import "server-only";
import { guvenliFetch } from "@/lib/guvenliAg";

/**
 * Resmî MCP kayıt defteri (registry.modelcontextprotocol.io) araması. Vayra yalnız uzak sunuculara (Streamable HTTP,
 * SSE) bağlanır; yalnız yerel paket (npx, docker) sunanlar sayılır ama listelenmez. Ad alanı ters alan adıysa
 * (app.linear) yayıncı o alan adının sahibi olarak doğrulanmıştır; io.github.* GitHub hesabıyla doğrulanır.
 */
export type KayitDegisken = { ad: string; aciklama: string; varsayilan?: string; secenekler?: string[]; zorunlu: boolean };
export type KayitBaslik = { ad: string; aciklama: string; gizli: boolean; zorunlu: boolean; deger?: string };
export type KayitUc = { url: string; tasima: "streamable-http" | "sse"; basliklar: KayitBaslik[]; degiskenler: KayitDegisken[] };
export type KayitSunucu = {
  kimlik: string; ad: string; aciklama: string; surum: string; guncelleme?: string;
  yayinci: { ad: string; tur: "alan" | "github" }; site?: string; depo?: string; ikon?: string;
  uclar: KayitUc[];
};

const KOK = "https://registry.modelcontextprotocol.io/v0.1/servers";
const onbellek = new Map<string, { zaman: number; v: { sunucular: KayitSunucu[]; yerel: number } }>();
const metin = (v: unknown, n = 400) => (typeof v === "string" ? v.slice(0, n) : "");
const https = (v: unknown) => (typeof v === "string" && /^https:\/\/\S+$/.test(v) ? v : undefined);

function yayinci(kimlik: string): KayitSunucu["yayinci"] {
  const ns = kimlik.split("/")[0] ?? kimlik;
  if (ns.startsWith("io.github.")) return { ad: ns.slice("io.github.".length), tur: "github" };
  return { ad: ns.split(".").reverse().join("."), tur: "alan" };
}

function cevir(x: Record<string, unknown>): KayitSunucu | null {
  const s = (x.server ?? {}) as Record<string, unknown>;
  const kimlik = metin(s.name, 200);
  if (!kimlik) return null;
  const uclar: KayitUc[] = (Array.isArray(s.remotes) ? s.remotes : []).flatMap((r: Record<string, unknown>) => {
    const tasima = r.type === "sse" ? "sse" : r.type === "streamable-http" ? "streamable-http" : null;
    const url = metin(r.url, 500);
    if (!tasima || !/^https:\/\//.test(url)) return [];
    const basliklar = (Array.isArray(r.headers) ? r.headers : []).map((h: Record<string, unknown>) => ({ ad: metin(h.name, 80), aciklama: metin(h.description, 200), gizli: h.isSecret === true, zorunlu: h.isRequired === true, deger: metin(h.value, 200) || undefined })).filter((h: KayitBaslik) => /^[A-Za-z0-9-]+$/.test(h.ad));
    const dv = (r.variables && typeof r.variables === "object" ? r.variables : {}) as Record<string, Record<string, unknown>>;
    const degiskenler = Object.entries(dv).slice(0, 8).map(([ad, d]) => ({ ad: ad.slice(0, 60), aciklama: metin(d.description, 200), varsayilan: metin(d.default, 200) || undefined, secenekler: Array.isArray(d.choices) ? d.choices.filter((c): c is string => typeof c === "string").slice(0, 20) : undefined, zorunlu: d.isRequired === true }));
    return [{ url, tasima, basliklar, degiskenler }];
  });
  const meta = ((x._meta ?? {}) as Record<string, Record<string, unknown>>)["io.modelcontextprotocol.registry/official"] ?? {};
  const ikonlar = Array.isArray(s.icons) ? (s.icons as Record<string, unknown>[]) : [];
  const ikon = https(ikonlar.find((i) => i.mimeType === "image/svg+xml")?.src) ?? https(ikonlar[0]?.src);
  return {
    kimlik, ad: metin(s.title, 80) || kimlik.split("/").pop() || kimlik, aciklama: metin(s.description, 300), surum: metin(s.version, 40),
    guncelleme: metin(meta.updatedAt, 40) || undefined, yayinci: yayinci(kimlik),
    site: https(s.websiteUrl), depo: https((s.repository as Record<string, unknown> | undefined)?.url), ikon, uclar,
  };
}

/** Kayıt defterinde arar (10 dakika önbellek). Alan adıyla doğrulanmış yayıncılar ve resmî görünenler önde. */
export async function kayitAra(sorgu: string): Promise<{ sunucular: KayitSunucu[]; yerel: number }> {
  const q = sorgu.trim().slice(0, 80);
  if (q.length < 2) return { sunucular: [], yerel: 0 };
  const anahtar = q.toLocaleLowerCase("tr");
  const o = onbellek.get(anahtar);
  if (o && Date.now() - o.zaman < 10 * 60_000) return o.v;
  const r = await fetch(`${KOK}?search=${encodeURIComponent(q)}&limit=60&version=latest`, { signal: AbortSignal.timeout(12_000), headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`Kayıt defteri yanıt vermedi (${r.status}).`);
  const j = (await r.json()) as { servers?: Record<string, unknown>[] };
  const hepsi = (j.servers ?? []).map(cevir).filter((x): x is KayitSunucu => !!x);
  const sunucular = hepsi.filter((x) => x.uclar.length);
  const k = anahtar.replace(/[^a-z0-9]/g, "");
  const puan = (x: KayitSunucu) => (x.yayinci.tur === "alan" ? 4 : 0) + (x.yayinci.ad.replace(/[^a-z0-9]/g, "").includes(k) ? 6 : 0) + (x.ikon ? 1 : 0) + (x.site ? 1 : 0);
  sunucular.sort((a, b) => puan(b) - puan(a));
  const v = { sunucular: sunucular.slice(0, 30), yerel: hepsi.length - sunucular.length };
  onbellek.set(anahtar, { zaman: Date.now(), v });
  if (onbellek.size > 200) onbellek.delete(onbellek.keys().next().value!);
  return v;
}

/** Sunucuyu initialize isteğiyle yoklar: giriş istiyor mu (401, OAuth), girişsiz mi açık, yoksa belirsiz mi. */
export async function girisYokla(url: string): Promise<"oauth" | "yok" | "bilinmiyor"> {
  if (!/^https:\/\/[^\s/]+/.test(url)) return "bilinmiyor";
  try {
    const r = await guvenliFetch(url, {
      method: "POST", signal: AbortSignal.timeout(8000), redirect: "manual",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "Vayra", version: "1.0" } } }),
    });
    r.body?.cancel().catch(() => {});
    if (r.status === 401) return "oauth";
    if (r.ok) return "yok";
    return "bilinmiyor";
  } catch { return "bilinmiyor"; }
}
