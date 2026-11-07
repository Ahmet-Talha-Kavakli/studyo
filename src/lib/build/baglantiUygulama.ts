import "server-only";
import type { AracIzni } from "./ajanKatalog";
import { ajanGetirOz, yayindakiAjan, type Ajan } from "./ajanDepo";
import { baglantiHam, baglantiHatasi, baglantiKullanilabilir, baglantiOturumu, cagriKaydet, etkinIzin, gizle, hamSonucKirp, okumaAraci, type Baglanti } from "./baglantiDepo";
import { sahipOzeti } from "./depo";
import { aracGorunurlugu, mcpCagir, mcpKaynakOku, type McpKaynakIcerigi } from "./mcpIstemci";
import { coz, sifrele } from "./sifre";
import { sahipAl } from "./sunucu";

/**
 * MCP Apps sunucu katmanı: arayüzlü bağlantı araçlarının görünümü (ui:// kaynağı) ve görünümün istekleri.
 *  - Görünüm HTML'i sunucudan okunur (resources/read), kimlik bilgileri araç çağrısıyla aynı yoldan kullanılır.
 *  - Görünümün tools/call ve resources/read istekleri vekil olarak iletilir; izin kuralı: araç izni "her-zaman"
 *    ya da okuma aracıysa çağrılır, "sor" ve "kapali" hata döner (onay sohbette istenir).
 *  - Sahip kendi başlığıyla erişir. Yayındaki ajan sayfasında ziyaretçi, parça kaydındaki kısa ömürlü şifreli
 *    belirteçle erişir: belirteç AES-GCM ile şifrelidir, sahibin kimliği ziyaretçiye görünmez.
 *  - Her sunucu çağrısı bağlantının denetim kaydına yazılır.
 */
export const BELIRTEC_OMRU = 2 * 3600_000;
type Belirtec = { k: "mcp-ui"; b: string; s: string; u: string; a?: string; t: number };

/** Ziyaretçi görünümü için belirteç: bağlantı, sahip özeti, görünüm adresi ve ajan; BELIRTEC_OMRU sonra geçersiz. */
export function uygulamaBelirteci(g: { baglantiId: string; sahipOz: string; resourceUri: string; ajanId?: string }): string {
  const v: Belirtec = { k: "mcp-ui", b: g.baglantiId, s: g.sahipOz, u: g.resourceUri, ...(g.ajanId ? { a: g.ajanId } : {}), t: Date.now() + BELIRTEC_OMRU };
  return sifrele(JSON.stringify(v));
}
function belirtecCoz(s: unknown): Belirtec | "suresi-doldu" | null {
  if (typeof s !== "string" || s.length > 2000) return null;
  try {
    const v = JSON.parse(coz(s) ?? "null") as Belirtec | null;
    if (!v || v.k !== "mcp-ui" || typeof v.b !== "string" || typeof v.s !== "string" || typeof v.u !== "string") return null;
    return v.t > Date.now() ? v : "suresi-doldu";
  } catch { return null; }
}

export type UygulamaBaglami = { sahipOz: string; ziyaretci: boolean; kaynak: string; ajan?: Ajan; uri?: string; anahtar: string };
type Hata = { hata: string; durum: number };

/**
 * İsteğin bağlamı: geçerli belirteç (ziyaretçi; yalnız yayındaki ajanın bu bağlantısı) ya da sahip başlığı.
 * Sahipte ajanId verilirse ajanın bağlantı onay politikası da uygulanır.
 */
export async function uygulamaBaglami(req: Request, baglantiId: string, g: { belirtec?: unknown; ajanId?: unknown }): Promise<UygulamaBaglami | Hata> {
  const t = g.belirtec ? belirtecCoz(g.belirtec) : null;
  if (t && t !== "suresi-doldu" && t.b === baglantiId) {
    if (!t.a) return { hata: "Belirteç geçersiz.", durum: 403 };
    const y = await yayindakiAjan(t.a);
    if (!y || y.sahipOzeti !== t.s || !(y.ayar.baglantilar ?? []).includes(baglantiId)) return { hata: "Bu ajan artık bu bağlantıyı kullanmıyor.", durum: 403 };
    return { sahipOz: t.s, ziyaretci: true, kaynak: `ziyaretci:${y.ajan.ad}`, ajan: y.ajan, uri: t.u, anahtar: `z:${t.a}:${t.t}` };
  }
  const sahip = sahipAl(req);
  if (sahip) {
    const sahipOz = sahipOzeti(sahip);
    const ajan = typeof g.ajanId === "string" && /^[A-Za-z0-9_-]{6,20}$/.test(g.ajanId) ? await ajanGetirOz(g.ajanId, sahipOz) : null;
    return { sahipOz, ziyaretci: false, kaynak: ajan ? `ajan:${ajan.ad}` : "sohbet", ...(ajan ? { ajan } : {}), anahtar: `s:${sahipOz}` };
  }
  if (t === "suresi-doldu") return { hata: "Bu etkileşimli görünümün süresi doldu.", durum: 410 };
  return { hata: "Bu etkileşimli görünüm yalnız bağlantının sahibine açılır.", durum: 403 };
}

async function baglantiAl(id: string, c: UygulamaBaglami): Promise<{ b: Baglanti } | Hata> {
  const b = await baglantiHam(id, c.sahipOz);
  if (!b) return { hata: "Bağlantı bulunamadı.", durum: 404 };
  if (c.ziyaretci && !baglantiKullanilabilir(b, "ziyaretci")) return { hata: "Bu bağlantı ziyaretçilere kapalı.", durum: 403 };
  return { b };
}

/* ───────────── Görünüm kaynağı ───────────── */
export type UygulamaCsp = { connectDomains?: string[]; resourceDomains?: string[]; frameDomains?: string[]; baseUriDomains?: string[] };
export type UygulamaKaynagi = { html: string; csp?: UygulamaCsp; izinler?: { clipboardWrite?: boolean }; kenarlik?: boolean };
/** Görünüm HTML'i kısa süre önbellekte (aynı kart her açılışta sunucuya gitmesin). */
const onbellek = new Map<string, { zaman: number; v: UygulamaKaynagi }>();
const ONBELLEK_SURE = 2 * 60_000;
const ucusta = new Map<string, Promise<UygulamaKaynagi | Hata>>();
const ALAN = /^(https?|wss?):\/\/(\*\.)?[A-Za-z0-9.-]{1,253}(:\d{1,5})?$/;
const alanlar = (v: unknown): string[] | undefined => {
  if (!Array.isArray(v)) return undefined;
  const l = v.filter((x): x is string => typeof x === "string").map((x) => x.trim().replace(/\/$/, "")).filter((x) => ALAN.test(x)).slice(0, 20);
  return l.length ? l : undefined;
};
const nesne = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined);

/** Görünümün HTML'ini ve güvenlik ayarlarını (csp, izinler) okur. Yalnız ui:// adresleri; taze: önbelleği atla (Yeniden yükle). */
export async function uygulamaKaynagi(id: string, uri: string, c: UygulamaBaglami, taze = false): Promise<UygulamaKaynagi | Hata> {
  if (!/^ui:\/\/\S{1,500}$/.test(uri)) return { hata: "Geçersiz görünüm adresi.", durum: 400 };
  if (c.uri && c.uri !== uri) return { hata: "Bu belirteç başka bir görünüm için.", durum: 403 };
  const x = await baglantiAl(id, c);
  if (!("b" in x)) return x;
  const b = x.b;
  // Önbellek anahtarı adres ve son denemeyle değişir (kimlik ya da sunucu değişince görünüm yeniden okunur).
  const anahtar = `${b.id}|${uri}|${b.url}|${b.saltOkunur}|${b.sonKontrol ?? 0}`;
  const o = onbellek.get(anahtar);
  if (o && !taze && Date.now() - o.zaman < ONBELLEK_SURE) return o.v;
  // Aynı anda açılan kartlar tek okumayı paylaşır.
  const u = ucusta.get(anahtar);
  if (u) return u;
  const is = (async (): Promise<UygulamaKaynagi | Hata> => {
    const bas = Date.now();
    let v: UygulamaKaynagi | Hata;
    try {
      const r = await mcpKaynakOku(await baglantiOturumu(b, c.sahipOz), uri);
      v = kaynakCoz(r.contents.find((y) => y.uri === uri) ?? r.contents[0]);
    } catch (e) {
      v = { hata: (await baglantiHatasi(b, c.sahipOz, e)).mesaj, durum: 502 };
    }
    await cagriKaydet(b.id, c.sahipOz, {
      zaman: Date.now(), arac: "resources/read", sure: Date.now() - bas, basarili: !("hata" in v), ozet: `Etkileşimli görünüm: ${uri}`.slice(0, 300), kaynak: c.kaynak, yazma: false,
      cikti: "hata" in v ? v.hata.slice(0, 600) : `Görünüm okundu (${Math.round(v.html.length / 1024)} KB).`,
    });
    if (!("hata" in v)) {
      onbellek.set(anahtar, { zaman: Date.now(), v });
      if (onbellek.size > 200) onbellek.delete(onbellek.keys().next().value as string);
    }
    return v;
  })();
  ucusta.set(anahtar, is);
  try { return await is; } finally { ucusta.delete(anahtar); }
}
function kaynakCoz(x?: McpKaynakIcerigi): UygulamaKaynagi | Hata {
  if (!x) return { hata: "Sunucu görünüm içeriği döndürmedi.", durum: 502 };
  if (x.mimeType && !/^text\/html/i.test(x.mimeType)) return { hata: `Görünüm türü desteklenmiyor (${x.mimeType.slice(0, 60)}).`, durum: 415 };
  const html = typeof x.text === "string" ? x.text : typeof x.blob === "string" ? Buffer.from(x.blob, "base64").toString("utf8") : "";
  if (!html.trim()) return { hata: "Görünüm boş.", durum: 502 };
  if (html.length > 3_000_000) return { hata: "Görünüm çok büyük.", durum: 413 };
  const ui = nesne(nesne(x._meta)?.ui);
  const csp = nesne(ui?.csp);
  const izin = nesne(ui?.permissions);
  const c: UygulamaCsp = {};
  for (const k of ["connectDomains", "resourceDomains", "frameDomains", "baseUriDomains"] as const) { const l = alanlar(csp?.[k]); if (l) c[k] = l; }
  return { html, ...(Object.keys(c).length ? { csp: c } : {}), ...(izin?.clipboardWrite ? { izinler: { clipboardWrite: true } } : {}), ...(ui?.prefersBorder === false ? { kenarlik: false } : {}) };
}

/* ───────────── Görünümün istekleri (vekil) ───────────── */
/** Kaba hız sınırı: bağlam başına 10 dakikada 120 istek. */
const sayaclar = new Map<string, { bas: number; n: number }>();
function sinirAsildi(anahtar: string): boolean {
  const s = sayaclar.get(anahtar);
  if (!s || Date.now() - s.bas > 600_000) { sayaclar.set(anahtar, { bas: Date.now(), n: 1 }); if (sayaclar.size > 2000) sayaclar.clear(); return false; }
  s.n += 1;
  return s.n > 120;
}

/** Görünümün çağırdığı aracın etkin izni: bağlantı izni, ajanın bağlantı onay politikası, ziyaretçi kısıtı. */
function aracIzni(b: Baglanti, a: Baglanti["araclar"][number], c: UygulamaBaglami): AracIzni {
  let izin = etkinIzin(b, a, c.ziyaretci);
  if (izin !== "kapali" && c.ajan) {
    const p = c.ajan.onay?.baglantiIzin?.[b.id];
    if (p === "yazmada") izin = okumaAraci(a) ? "her-zaman" : "sor";
    else if (p === "hep") izin = "sor";
  }
  if (c.ziyaretci && izin === "sor") izin = "kapali";
  return izin;
}
export const ONAY_HATASI = "Bu işlem onay istiyor; sohbette iste";

export type VekilYaniti = { sonuc: unknown } | Hata;
/** tools/call ve resources/read vekili; izin kuralı ve denetim kaydıyla. */
export async function uygulamaIstegi(id: string, yontem: string, params: unknown, c: UygulamaBaglami): Promise<VekilYaniti> {
  if (sinirAsildi(`${c.anahtar}:${id}`)) return { hata: "Çok fazla istek; biraz sonra dene.", durum: 429 };
  const x = await baglantiAl(id, c);
  if (!("b" in x)) return x;
  const b = x.b;
  const p = nesne(params) ?? {};
  const bas = Date.now();
  if (yontem === "tools/call") {
    const ad = typeof p.name === "string" ? p.name : "";
    const a = b.araclar.find((x) => x.name === ad);
    if (!a) return { hata: `${b.ad} bağlantısında "${ad.slice(0, 80)}" adlı araç yok.`, durum: 404 };
    if (!aracGorunurlugu(a).includes("app")) return { hata: "Bu araç görünümden çağrılamaz.", durum: 403 };
    const izin = aracIzni(b, a, c);
    const okuma = okumaAraci(a);
    if (!(izin === "her-zaman" || (okuma && izin !== "kapali"))) {
      const mesaj = izin === "kapali" && !c.ziyaretci ? "Bu araç kapalı; Bağlantılar sayfasından açılabilir." : ONAY_HATASI;
      await cagriKaydet(b.id, c.sahipOz, { zaman: Date.now(), arac: a.name, sure: 0, basarili: false, ozet: gizle(`Görünümden: ${JSON.stringify(p.arguments ?? {})}`).slice(0, 300), kaynak: c.kaynak, yazma: !okuma, cikti: mesaj });
      return { hata: mesaj, durum: 403 };
    }
    const girdi = nesne(p.arguments) ?? {};
    let v: VekilYaniti, cikti: string;
    try {
      const r = await mcpCagir(await baglantiOturumu(b, c.sahipOz), a.name, girdi);
      v = { sonuc: hamSonucKirp(r.ham) };
      cikti = r.metin;
      await cagriKaydet(b.id, c.sahipOz, { zaman: Date.now(), arac: a.name, sure: Date.now() - bas, basarili: !r.hata, ozet: gizle(`Görünümden: ${JSON.stringify(girdi)}`).slice(0, 300), kaynak: c.kaynak, yazma: !okuma, cikti: gizle(cikti).slice(0, 600) });
    } catch (e) {
      const h = await baglantiHatasi(b, c.sahipOz, e);
      v = { hata: h.mesaj, durum: h.durum === 401 ? 401 : 502 };
      await cagriKaydet(b.id, c.sahipOz, { zaman: Date.now(), arac: a.name, sure: Date.now() - bas, basarili: false, ozet: gizle(`Görünümden: ${JSON.stringify(girdi)}`).slice(0, 300), kaynak: c.kaynak, yazma: !okuma, cikti: h.mesaj.slice(0, 600) });
    }
    return v;
  }
  if (yontem === "resources/read") {
    const uri = typeof p.uri === "string" ? p.uri.trim().slice(0, 600) : "";
    if (!uri) return { hata: "Kaynak adresi gerekli.", durum: 400 };
    // Ziyaretçi yalnız görünüm kaynaklarını (ui://) okuyabilir; sahibin verisine açılan kapı olmasın.
    if (c.ziyaretci && !uri.startsWith("ui://")) return { hata: "Bu kaynak ziyaretçilere kapalı.", durum: 403 };
    let v: VekilYaniti;
    try {
      const r = await mcpKaynakOku(await baglantiOturumu(b, c.sahipOz), uri);
      const n = JSON.stringify(r).length;
      v = n > 3_000_000 ? { hata: "Kaynak çok büyük.", durum: 413 } : { sonuc: r };
    } catch (e) {
      v = { hata: (await baglantiHatasi(b, c.sahipOz, e)).mesaj, durum: 502 };
    }
    await cagriKaydet(b.id, c.sahipOz, { zaman: Date.now(), arac: "resources/read", sure: Date.now() - bas, basarili: !("hata" in v), ozet: `Görünümden: ${uri}`.slice(0, 300), kaynak: c.kaynak, yazma: false, cikti: "hata" in v ? v.hata.slice(0, 600) : "Kaynak okundu." });
    return v;
  }
  return { hata: "Desteklenmeyen istek.", durum: 400 };
}
