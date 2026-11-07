import { acikGorunum, baglantiOlustur, baglantilariListele, baglantiTest } from "@/lib/build/baglantiDepo";
import { ADAPTORLER } from "@/lib/build/baglantiAdaptorTanim";
import { katalogBul, sablonDoldur } from "@/lib/build/baglantiKatalog";
import { sahipOzeti } from "@/lib/build/depo";
import { mcpAdresi } from "@/lib/build/mcpIstemci";
import { belgeCoz, islemDogrula, openapiCevir, openapiIndir, restKimlikAlanlari, type RestTanim } from "@/lib/build/baglantiRest";
import type { RestIslemTanim } from "@/lib/build/baglantiKatalog";
import { hata, sahipAl } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Sahibin bağlantıları (gizliler maskeli). */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return Response.json({ ok: true, baglantilar: [] });
  return Response.json({ ok: true, baglantilar: (await baglantilariListele(sahip)).map(acikGorunum) });
}

type Govde = {
  katalog?: string; url?: string; ad?: string; yetki?: "yok" | "anahtar" | "oauth"; anahtar?: string; host?: string; baslik?: string; onEk?: string; basliklar?: { ad: string; deger: string }[];
  /** v2: adres şablonu değerleri, adaptör ya da çok alanlı kimlik değerleri, kendi OAuth istemcin. */
  sablon?: Record<string, string>; alanlar?: Record<string, string>; istemci?: { id?: string; gizli?: string };
  /** v3: REST bağlantısı — openapi (belge adresi) ya da belge (yapıştırılan JSON/YAML) ya da taban + islemler. */
  rest?: { openapi?: string; belge?: string; taban?: string; yetki?: RestTanim["yetki"]; anahtarAd?: string; islemler?: Partial<RestIslemTanim>[] };
  etiket?: string;
};
const YETKI = ["bearer", "baslik", "sorgu", "temel", "yok"];

/** REST tanımı: katalog kaydı, OpenAPI adresi, yapıştırılan belge ya da elle uç noktalar. */
async function restKur(g: Govde, k?: ReturnType<typeof katalogBul>): Promise<RestTanim | string> {
  const kr = k?.rest;
  const r = g.rest ?? {};
  let t: RestTanim;
  try {
    if (r.belge?.trim()) t = openapiCevir(belgeCoz(r.belge.slice(0, 4_000_000)));
    else if (r.openapi?.trim() || kr?.openapi) t = await openapiIndir((r.openapi?.trim() || kr!.openapi)!);
    else t = { taban: "", yetki: "yok", islemler: [] };
  } catch (e) { return (e as Error).message; }
  if (kr) { t.taban = kr.taban || t.taban; t.yetki = kr.yetki; t.anahtarAd = kr.anahtarAd ?? t.anahtarAd; t.ekAlanlar = kr.ekAlanlar; if (!t.islemler.length && kr.islemler) t.islemler = kr.islemler.slice(0, 300); }
  if (r.taban?.trim()) t.taban = r.taban.trim().replace(/\/+$/, "");
  // Kimlik biçimi belgede tanımlıysa o geçerli; belge yoksa ya da belgede kimlik yoksa kullanıcının seçimi.
  const belgeli = !!(r.belge?.trim() || r.openapi?.trim());
  if (r.yetki && YETKI.includes(r.yetki) && !kr && (!belgeli || t.yetki === "yok")) { t.yetki = r.yetki; if (r.anahtarAd?.trim()) t.anahtarAd = r.anahtarAd.trim().slice(0, 80); }
  if ((t.yetki === "baslik" || t.yetki === "sorgu") && !t.anahtarAd) return "Anahtarın gönderileceği başlık ya da parametre adını yaz.";
  for (const x of (r.islemler ?? []).slice(0, 100)) { const d = islemDogrula(x); if (typeof d === "string") return d; if (!t.islemler.some((y) => y.ad === d.ad)) t.islemler.push(d); }
  if (!/^https?:\/\/[^\s/]+/.test(t.taban) || !mcpAdresi(t.taban)) return "Servisin API kök adresini yaz (https).";
  return t;
}
const metin = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

/**
 * Yeni bağlantı: { katalog, yetki, anahtar?, sablon?, alanlar?, istemci? } katalogdan; { url, ad, yetki, anahtar?,
 * baslik?, onEk?, basliklar?, istemci? } özel sunucu. Anahtarlı ya da girişsiz bağlantı hemen denenir; OAuth için
 * ayrıca /oauth ile giriş başlatılır.
 */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  let g: Govde;
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const k = katalogBul(g.katalog);
  if (g.katalog && !k) return hata("Bu servis katalogda yok.", 404);
  // REST bağlantısı (resmî MCP'si olmayan servis ya da kullanıcının kendi API'si).
  if (k?.yol === "rest" || g.rest) {
    const t = await restKur(g, k);
    if (typeof t === "string") return hata(t);
    const tanimlar = restKimlikAlanlari(t);
    const alanlar: Record<string, string> = {};
    for (const a of tanimlar) { const v = metin(g.alanlar?.[a.id], 4000); if (v) alanlar[a.id] = v; }
    if (t.yetki !== "yok" && !alanlar.anahtar && !alanlar.sifre) return hata("Servisin anahtarını gir.");
    let host = ""; try { host = new URL(t.taban).hostname; } catch { /* boş */ }
    const b = await baglantiOlustur(sahip, {
      ad: [k?.ad ?? (metin(g.ad, 60) || t.baslik || host), metin(g.etiket, 30)].filter(Boolean).join(" · "), url: t.taban, katalogId: k?.id, logo: k?.logo, yetki: t.yetki === "yok" ? "yok" : "anahtar",
      alanlar, rest: t, etiket: metin(g.etiket, 30) || undefined,
    });
    return Response.json({ ok: true, baglanti: acikGorunum((await baglantiTest(b.id, sahipOzeti(sahip))) ?? b) });
  }
  const yetki = g.yetki ?? (k ? k.yetki[0] : "yok");
  if (k && !k.yetki.includes(yetki)) return hata("Bu servis bu giriş yöntemini desteklemiyor.");

  // Adres: katalog şablonu (bölge, mağaza, sunucu) ya da özel adres.
  let url = String(g.url ?? "").trim();
  const sablon: Record<string, string> = {};
  if (k) {
    const degerler: Record<string, string> = { ...(g.sablon ?? {}), ...(g.host ? { host: g.host } : {}) };
    const s = k.adaptor ? { url: k.url } : sablonDoldur(k, yetki, degerler);
    if ("hata" in s) return hata(s.hata);
    url = s.url;
    for (const a of k.alanlar ?? []) if (degerler[a.id]) sablon[a.id] = metin(degerler[a.id], 120).toLowerCase();
    if (k.istemciKimligi) for (const a of k.alanlar ?? []) if (!sablon[a.id]) return hata(`${a.ad} gerekli.`);
  }
  if (!k?.adaptor && !mcpAdresi(url)) return hata("Geçerli bir https sunucu adresi yaz.");

  // Kimlik alanları (adaptör ya da istemci kimliği akışı): tanımlı alanlar, desen denetimiyle.
  const tanimlar = k?.adaptor ? ADAPTORLER[k.adaptor].alanlar : k?.kimlikAlanlari ?? [];
  const alanlar: Record<string, string> = {};
  for (const a of tanimlar) {
    const v = metin(g.alanlar?.[a.id], 600) || a.varsayilan || "";
    if (!v && !a.istege) return hata(`${a.ad} gerekli.`);
    if (v && a.desen && !new RegExp(a.desen).test(v)) return hata(`${a.ad} geçersiz${a.ornek ? `; örnek: ${a.ornek}` : ""}.`);
    if (a.secenekler && v && !a.secenekler.some((x) => x.id === v)) return hata(`${a.ad} geçersiz.`);
    if (v) alanlar[a.id] = v;
  }
  const istemci = metin(g.istemci?.id, 300) ? { id: metin(g.istemci?.id, 300), gizli: metin(g.istemci?.gizli, 600) || undefined } : undefined;
  if (k?.adaptor && yetki === "oauth" && !istemci) return hata("İstemci kimliği ve sırrı gerekli.");
  if (yetki === "anahtar" && !tanimlar.length && !String(g.anahtar ?? "").trim()) return hata("Erişim anahtarını yapıştır.");

  const b = await baglantiOlustur(sahip, {
    ad: [k?.ad ?? (metin(g.ad, 60) || new URL(url).hostname), metin(g.etiket, 30)].filter(Boolean).join(" · "), url, etiket: metin(g.etiket, 30) || undefined, katalogId: k?.id, logo: k?.logo, yetki,
    anahtar: tanimlar.length ? undefined : g.anahtar?.trim().slice(0, 4000),
    baslik: k?.anahtarBaslik ?? g.baslik?.trim(), onEk: k?.anahtarBaslik ? k.anahtarOnEk ?? "" : g.onEk, basliklar: g.basliklar,
    sablon: Object.keys(sablon).length ? sablon : undefined, alanlar, istemci,
  });
  const son = yetki === "oauth" ? b : (await baglantiTest(b.id, sahipOzeti(sahip))) ?? b;
  return Response.json({ ok: true, baglanti: acikGorunum(son) });
}
