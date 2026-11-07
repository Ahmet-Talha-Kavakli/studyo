import "server-only";
import { createPublicKey, verify, type JsonWebKeyInput } from "crypto";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { deflateSync } from "zlib";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { guvenliFetch } from "@/lib/guvenliAg";
import type { Ajan } from "./ajanDepo";
import { coz } from "./sifre";

/**
 * Microsoft Teams (Azure Bot Service, Bot Framework REST). Gelen her etkinlik Authorization: Bearer <JWT> taşır;
 * imza Bot Framework'ün OpenID anahtarlarıyla (RS256) doğrulanır, iss https://api.botframework.com, aud ajanın
 * Microsoft uygulama kimliği olmalı, serviceUrl talebi etkinlikteki serviceUrl ile aynı olmalı. Yanıt, istemci
 * kimlik bilgileriyle alınan belirteçle serviceUrl üzerinden gönderilir (yalnız Microsoft alan adları, guvenliFetch).
 * Teams uygulama paketi (manifest.json + simgeler) sunucuda zip olarak üretilir.
 */
const OPENID = "https://login.botframework.com/v1/.well-known/openidconfiguration";
const SERVIS = /^https:\/\/([a-z0-9-]+\.)*(botframework\.com|trafficmanager\.net|teams\.microsoft\.com|botframework\.azure\.us|teams\.microsoft\.us|infra\.gov\.teams\.microsoft\.us)(:\d+)?\//i;
export const servisGecerli = (u: string) => SERVIS.test(u);

type Jwk = JsonWebKeyInput["key"] & { kid?: string; endorsements?: string[] };
let anahtarlar: { zaman: number; l: Jwk[] } | null = null;
async function jwks(): Promise<Jwk[]> {
  // Yerel denemede (production dışı) .veri/build/sahte-teams-jwks.json varsa onun anahtarları kullanılır.
  const sahte = path.join(DEPO_KOK, "build", "sahte-teams-jwks.json");
  if (process.env.NODE_ENV !== "production" && existsSync(sahte)) { try { return (JSON.parse(readFileSync(sahte, "utf8")) as { keys: Jwk[] }).keys; } catch { /* yok */ } }
  if (anahtarlar && Date.now() - anahtarlar.zaman < 12 * 3600_000) return anahtarlar.l;
  const c = (await (await fetch(OPENID, { signal: AbortSignal.timeout(8000) })).json()) as { jwks_uri?: string };
  if (!c.jwks_uri || !/^https:\/\/login\.botframework\.com\//.test(c.jwks_uri)) throw new Error("OpenID yapılandırması okunamadı.");
  const k = (await (await fetch(c.jwks_uri, { signal: AbortSignal.timeout(8000) })).json()) as { keys?: Jwk[] };
  anahtarlar = { zaman: Date.now(), l: k.keys ?? [] };
  return anahtarlar.l;
}
const b64 = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
/** Gelen etkinliğin JWT'sini doğrular. Dönüş: hata metni ya da null. */
export async function teamsJwtDogrula(baslik: string | null, uygulama: string, serviceUrl: string): Promise<string | null> {
  const m = /^Bearer\s+([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(baslik ?? "");
  if (!m) return "Yetki belirteci yok.";
  let h: { alg?: string; kid?: string }, p: { iss?: string; aud?: string; exp?: number; nbf?: number; serviceurl?: string; serviceUrl?: string };
  try { h = JSON.parse(b64(m[1]).toString("utf8")); p = JSON.parse(b64(m[2]).toString("utf8")); } catch { return "Belirteç çözülemedi."; }
  if (h.alg !== "RS256") return "Beklenmeyen imza türü.";
  const l = await jwks().catch(() => [] as Jwk[]);
  const k = l.find((x) => x.kid === h.kid);
  if (!k) return "İmza anahtarı bulunamadı.";
  if (k.endorsements && !k.endorsements.includes("msteams")) return "Anahtar Teams için onaylı değil.";
  let dogru = false;
  try { dogru = verify("RSA-SHA256", Buffer.from(`${m[1]}.${m[2]}`), createPublicKey({ key: k, format: "jwk" }), b64(m[3])); } catch { return "İmza doğrulanamadı."; }
  if (!dogru) return "İmza geçersiz.";
  const simdi = Date.now() / 1000;
  if (p.iss !== "https://api.botframework.com") return "Belirteci veren beklenen değil.";
  if (p.aud !== uygulama) return "Belirteç bu uygulama için değil.";
  if (!p.exp || p.exp < simdi - 300 || (p.nbf && p.nbf > simdi + 300)) return "Belirtecin süresi dolmuş.";
  const su = p.serviceurl ?? p.serviceUrl;
  if (!su || su.replace(/\/$/, "") !== serviceUrl.replace(/\/$/, "")) return "serviceUrl eşleşmiyor.";
  return null;
}

/* ───────────── Giden ───────────── */
const belirtecler = new Map<string, { b: string; bitis: number }>();
export async function teamsBelirteci(uygulama: string, sifre: string, kiraci?: string): Promise<{ belirtec?: string; hata?: string }> {
  const a = `${uygulama}:${kiraci ?? ""}`;
  const v = belirtecler.get(a);
  if (v && v.bitis > Date.now() + 60_000) return { belirtec: v.b };
  try {
    const r = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(kiraci || "botframework.com")}/oauth2/v2.0/token`, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: uygulama, client_secret: sifre, scope: "https://api.botframework.com/.default" }),
    });
    const j = (await r.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string; error?: string };
    if (!r.ok || !j.access_token) return { hata: j.error === "invalid_client" ? "İstemci gizli anahtarı ya da uygulama kimliği yanlış." : j.error === "unauthorized_client" ? "Uygulama bu kiracıda bulunamadı; tek kiracılı uygulamada kiracı kimliğini gir." : `Microsoft belirteci alınamadı: ${(j.error_description ?? j.error ?? r.status).toString().split("\r\n")[0].slice(0, 200)}` };
    belirtecler.set(a, { b: j.access_token, bitis: Date.now() + (j.expires_in ?? 3600) * 1000 });
    return { belirtec: j.access_token };
  } catch (e) { return { hata: `Microsoft'a ulaşılamadı: ${(e as Error).message}` }; }
}
/** Konuşmaya mesaj (yanıt kimliği verilirse onun altına). adres: "serviceUrl|konuşmaKimliği". */
export async function teamsMesaj(uygulama: string, sifre: string, kiraci: string | undefined, adres: string, metin: string, yanitKimligi?: string): Promise<string | null> {
  const [servis, konusma] = adres.split("|");
  if (!servis || !konusma || !servisGecerli(servis.endsWith("/") ? servis : `${servis}/`)) return "Teams adresi geçersiz.";
  const b = await teamsBelirteci(uygulama, sifre, kiraci);
  if (!b.belirtec) return b.hata ?? "Belirteç alınamadı.";
  const kok = servis.replace(/\/$/, "");
  const yol = `${kok}/v3/conversations/${encodeURIComponent(konusma)}/activities${yanitKimligi ? `/${encodeURIComponent(yanitKimligi)}` : ""}`;
  try {
    const r = await guvenliFetch(yol, { method: "POST", headers: { Authorization: `Bearer ${b.belirtec}`, "Content-Type": "application/json" }, body: JSON.stringify({ type: "message", text: metin.slice(0, 28_000), textFormat: "markdown" }), signal: AbortSignal.timeout(10_000) }, { yalnizHttps: true });
    return r.ok ? null : `Teams mesajı gönderilemedi (${r.status}).`;
  } catch (e) { return `Teams'e ulaşılamadı: ${(e as Error).message}`; }
}
export async function teamsGonder(a: Ajan, adres: string, metin: string): Promise<string | null> {
  const t = a.yayin.teams;
  const s = coz(t?.sifreSifreli);
  if (!t?.uygulama || !s) return "Teams kanalı bağlı değil.";
  return teamsMesaj(t.uygulama, s, t.tur === "tek" ? t.kiraci : undefined, adres, metin);
}
export type TeamsEtkinlik = {
  type?: string; id?: string; text?: string; serviceUrl?: string; channelId?: string;
  from?: { id?: string; name?: string; aadObjectId?: string }; recipient?: { id?: string; name?: string };
  conversation?: { id?: string; conversationType?: string; tenantId?: string }; membersAdded?: { id?: string }[];
};
export const teamsMetni = (t: string) => t.replace(/<at>[^<]*<\/at>/g, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/* ───────────── Uygulama paketi (zip: manifest.json, color.png, outline.png) ───────────── */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function pngYap(boyut: number, ciz: (x: number, y: number) => [number, number, number, number]): Buffer {
  const satir = boyut * 4 + 1, ham = Buffer.alloc(satir * boyut);
  for (let y = 0; y < boyut; y++) { ham[y * satir] = 0; for (let x = 0; x < boyut; x++) { const [r, g, b, a] = ciz(x, y); ham.set([r, g, b, a], y * satir + 1 + x * 4); } }
  const parca = (tur: string, v: Buffer) => { const u = Buffer.alloc(4); u.writeUInt32BE(v.length); const tv = Buffer.concat([Buffer.from(tur), v]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(tv)); return Buffer.concat([u, tv, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(boyut, 0); ihdr.writeUInt32BE(boyut, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), parca("IHDR", ihdr), parca("IDAT", deflateSync(ham)), parca("IEND", Buffer.alloc(0))]);
}
/** Sohbet balonu biçimli simge: renkli zemin üstünde beyaz balon (color) ve saydam zeminde beyaz çizgi (outline). */
function simgeler(): { renkli: Buffer; cizgi: Buffer } {
  const balon = (x: number, y: number, s: number) => { const cx = s / 2, cy = s * 0.46, rx = s * 0.3, ry = s * 0.22; const ic = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1; const ucgen = (px: number, py: number, a: number[], b: number[], c: number[]) => { const d = (p: number[], q: number[], r: number[]) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]); const d1 = d([px, py], a, b), d2 = d([px, py], b, c), d3 = d([px, py], c, a); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); };
    const kuyruk = ucgen(x, y, [cx - s * 0.2, cy + s * 0.1], [cx - s * 0.02, cy + s * 0.16], [cx - s * 0.26, cy + s * 0.34]); return ic || kuyruk; };
  const renkli = pngYap(192, (x, y) => (balon(x, y, 192) ? [255, 255, 255, 255] : [85, 214, 253, 255]));
  const cizgi = pngYap(32, (x, y) => { const d = balon(x, y, 32), ic = balon(x, y, 32) && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([a, b]) => balon(x + a * 2, y + b * 2, 32)); return d && !ic ? [255, 255, 255, 255] : [0, 0, 0, 0]; });
  return { renkli, cizgi };
}
function zipYap(dosyalar: { ad: string; veri: Buffer }[]): Buffer {
  const yerel: Buffer[] = [], merkez: Buffer[] = [];
  let ofset = 0;
  for (const d of dosyalar) {
    const ad = Buffer.from(d.ad), c = crc32(d.veri);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0, 6); h.writeUInt16LE(0, 8); h.writeUInt32LE(0, 10); h.writeUInt32LE(c, 14); h.writeUInt32LE(d.veri.length, 18); h.writeUInt32LE(d.veri.length, 22); h.writeUInt16LE(ad.length, 26); h.writeUInt16LE(0, 28);
    yerel.push(h, ad, d.veri);
    const m = Buffer.alloc(46); m.writeUInt32LE(0x02014b50, 0); m.writeUInt16LE(20, 4); m.writeUInt16LE(20, 6); m.writeUInt16LE(0, 8); m.writeUInt16LE(0, 10); m.writeUInt32LE(0, 12); m.writeUInt32LE(c, 16); m.writeUInt32LE(d.veri.length, 20); m.writeUInt32LE(d.veri.length, 24); m.writeUInt16LE(ad.length, 28); m.writeUInt32LE(ofset, 42);
    merkez.push(m, ad);
    ofset += 30 + ad.length + d.veri.length;
  }
  const mb = Buffer.concat(merkez);
  const son = Buffer.alloc(22); son.writeUInt32LE(0x06054b50, 0); son.writeUInt16LE(dosyalar.length, 8); son.writeUInt16LE(dosyalar.length, 10); son.writeUInt32LE(mb.length, 12); son.writeUInt32LE(ofset, 16);
  return Buffer.concat([...yerel, mb, son]);
}
export function teamsPaketi(g: { uygulama: string; ad: string; aciklama: string; koken: string }): Buffer {
  const host = (() => { try { return new URL(g.koken).host; } catch { return "vayra.app"; } })();
  const manifest = {
    $schema: "https://developer.microsoft.com/json-schemas/teams/v1.17/MicrosoftTeams.schema.json", manifestVersion: "1.17", version: "1.0.0", id: g.uygulama,
    developer: { name: "Vayra", websiteUrl: g.koken, privacyUrl: `${g.koken}/gizlilik`, termsOfUseUrl: `${g.koken}/sartlar` },
    name: { short: g.ad.slice(0, 30), full: g.ad.slice(0, 100) }, description: { short: (g.aciklama || `${g.ad} ajanı`).slice(0, 80), full: (g.aciklama || `${g.ad} ajanı, Vayra Build ile yapıldı.`).slice(0, 4000) },
    icons: { color: "color.png", outline: "outline.png" }, accentColor: "#55D6FD",
    bots: [{ botId: g.uygulama, scopes: ["personal", "team", "groupChat"], supportsFiles: false, isNotificationOnly: false }],
    permissions: ["identity", "messageTeamMembers"], validDomains: [host],
  };
  const s = simgeler();
  return zipYap([{ ad: "manifest.json", veri: Buffer.from(JSON.stringify(manifest, null, 2)) }, { ad: "color.png", veri: s.renkli }, { ad: "outline.png", veri: s.cizgi }]);
}
