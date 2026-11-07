import "server-only";
import { createHash, createHmac } from "crypto";
import { getQuickJS, type QuickJSContext, type QuickJSHandle } from "quickjs-emscripten";
import { adresGecerli } from "./kaynak";
import { guvenliFetch } from "@/lib/guvenliAg";
import type { Proje } from "./tipler";
import { veriDegistir, veriOku, yeniKayitId, koleksiyonAdiGecerli, VARSAYILAN_KURAL, SINIR, semayaUygula, suzgecUygula, alanlariTemizle, metinAra, type Kayit, type Kural, type Suzgec } from "./veri";
import { canliYayinla } from "./bulutCanli";
import { gecmisYaz } from "./bulutGecmis";

/**
 * Vayra Bulut sunucu fonksiyonları: projedeki api/<ad>.js dosyaları QuickJS kum havuzunda çalışır (Node'a, dosya
 * sistemine ve ağa doğrudan erişim yok). Fonksiyon biçimi:
 *   export default async function (istek, vayra) { return { durum: 200, govde: { ... } } }
 * ya da  async function main(istek, vayra) { … }
 * vayra: sir(ad) (projenin "sunucu" sırları), fetch(adres, ayar) (https, 10 sn), hmac(alg, anahtar, veri, cikti),
 * ozet(alg, veri, cikti), veri.liste/ekle/guncelle/sil/ara (kurallar atlanır, sahip yetkisiyle; değişiklikler canlı
 * abonelere ve kayıt geçmişine gider), sonra(saniye, "fonksiyon", veri) gecikmeli iş, console.log günlüğe düşer.
 * Sınırlar: 32 MB bellek, 8 sn süre, 10 dış istek, 1 MB yanıt.
 */
export type FnIstek = { yontem: string; yol: string; sorgu: Record<string, string>; basliklar: Record<string, string>; govde: unknown; metin: string };
/** Dış istek kaydı: adres (sorgu dizgesi atılır, anahtar sızmasın), yöntem, durum (0: ağ hatası), süre, hata. */
export type FnDisIstek = { adres: string; yontem: string; durum: number; sure: number; hata?: string };
export type FnSonuc = { durum: number; basliklar: Record<string, string>; govde: string; loglar: string[]; sure: number; hata?: string; disIstekler?: FnDisIstek[] };

const SURE = 8000, DIS_ISTEK = 10;

function dondur(vm: QuickJSContext, v: unknown): QuickJSHandle {
  return vm.newString(JSON.stringify(v ?? null));
}

export async function fonksiyonCalistir(kod: string, istek: FnIstek, p: Proje): Promise<FnSonuc> {
  const bas = Date.now();
  const loglar: string[] = [];
  const QuickJS = await getQuickJS();
  const rt = QuickJS.newRuntime();
  rt.setMemoryLimit(32 * 1024 * 1024);
  rt.setMaxStackSize(1024 * 1024);
  const bitis = bas + SURE;
  rt.setInterruptHandler(() => Date.now() > bitis);
  const vm = rt.newContext();
  let kapandi = false;
  let disIstek = 0;
  const disIstekler: FnDisIstek[] = [];
  const sirlar = Object.fromEntries((p.ayarlar.sirlar ?? []).filter((s) => s.gorunurluk === "sunucu").map((s) => [s.ad, s.deger]));
  const isle = () => { if (!kapandi) { const r = rt.executePendingJobs(); if (r.error) r.error.dispose(); } };
  const tanimla = (ad: string, f: (...h: QuickJSHandle[]) => QuickJSHandle | undefined) => vm.newFunction(ad, f).consume((h) => vm.setProp(vm.global, ad, h));
  /** Ana makinede çalışan eşzamansız işlev: JSON metni döner. */
  const eszamansiz = (ad: string, f: (args: string[]) => Promise<unknown>) => tanimla(ad, (...h) => {
    const args = h.map((x) => vm.getString(x));
    const s = vm.newPromise();
    f(args).then((v) => { if (!kapandi) { const x = dondur(vm, v); s.resolve(x); x.dispose(); } }, (e) => { if (!kapandi) { const x = vm.newError((e as Error).message); s.reject(x); x.dispose(); } }).finally(isle);
    return s.handle;
  });

  tanimla("__log", (...h) => { if (loglar.length < 200) loglar.push(h.map((x) => vm.getString(x)).join(" ").slice(0, 2000)); return undefined; });
  tanimla("__sir", (h) => { const v = sirlar[vm.getString(h)]; return v === undefined ? vm.undefined : vm.newString(v); });
  tanimla("__hmac", (alg, anahtar, veri, cikti) => {
    try { return vm.newString(createHmac(vm.getString(alg), vm.getString(anahtar)).update(vm.getString(veri)).digest(vm.getString(cikti) as "base64" | "hex")); }
    catch (e) { throw vm.newError((e as Error).message); }
  });
  tanimla("__ozet", (alg, veri, cikti) => {
    try { return vm.newString(createHash(vm.getString(alg)).update(vm.getString(veri)).digest(vm.getString(cikti) as "base64" | "hex")); }
    catch (e) { throw vm.newError((e as Error).message); }
  });
  eszamansiz("__fetch", async ([adres, ayarJson]) => {
    if (++disIstek > DIS_ISTEK) throw new Error(`Bir çalışmada en çok ${DIS_ISTEK} dış istek yapılabilir.`);
    const a = JSON.parse(ayarJson || "{}") as { method?: string; headers?: Record<string, string>; body?: string };
    const kayit: FnDisIstek = { adres: String(adres).split(/[?#]/)[0].slice(0, 200), yontem: (a.method ?? "GET").toUpperCase(), durum: 0, sure: 0 };
    disIstekler.push(kayit);
    const u = adresGecerli(adres);
    if (!u || (process.env.NODE_ENV === "production" && u.protocol !== "https:")) { kayit.hata = "Engellendi: yalnız herkese açık https adresleri"; throw new Error("Yalnız herkese açık https adreslerine istek yapılabilir."); }
    kayit.adres = `${u.origin}${u.pathname}`.slice(0, 200);
    const t0 = Date.now();
    try {
      const r = await guvenliFetch(u, { method: a.method ?? "GET", headers: a.headers, body: a.body, signal: AbortSignal.timeout(Math.max(500, Math.min(10_000, bitis - Date.now()))) }, { yalnizHttps: process.env.NODE_ENV === "production" });
      const govde = (await r.text()).slice(0, 1_000_000);
      kayit.durum = r.status; kayit.sure = Date.now() - t0;
      return { durum: r.status, basliklar: Object.fromEntries(r.headers.entries()), govde };
    } catch (e) { kayit.sure = Date.now() - t0; kayit.hata = (e as Error).message.slice(0, 160); throw e; }
  });
  eszamansiz("__veri", async ([islem, kol, json]) => {
    if (!koleksiyonAdiGecerli(kol)) throw new Error("Koleksiyon adı geçersiz.");
    if (islem === "liste") {
      // json: { suzgec?: [{alan, op, deger}], alan=deger kısayolları, sirala?, yon?, sinir? }
      const a = JSON.parse(json || "{}") as Record<string, unknown>;
      let l = [...((await veriOku(p.id)).koleksiyonlar[kol]?.kayitlar ?? [])];
      for (const [x, d] of Object.entries(a)) if (!["suzgec", "sirala", "yon", "sinir"].includes(x)) l = l.filter((r) => String(r[x]) === String(d));
      if (Array.isArray(a.suzgec)) l = suzgecUygula(l, a.suzgec.slice(0, 10) as Suzgec[]);
      if (typeof a.sirala === "string") { const al = a.sirala, yon = a.yon === "artan" ? 1 : -1; l.sort((x, y) => { const p1 = x[al], p2 = y[al]; return (typeof p1 === "number" && typeof p2 === "number" ? p1 - p2 : String(p1 ?? "").localeCompare(String(p2 ?? ""), "tr")) * yon; }); }
      else l.reverse();
      return l.slice(0, Math.min(1000, Math.max(1, Number(a.sinir) || 500)));
    }
    if (islem === "ara") {
      const a = JSON.parse(json || "{}") as { metin?: string; alanlar?: string[]; sinir?: number };
      const k = (await veriOku(p.id)).koleksiyonlar[kol];
      return metinAra(k?.kayitlar ?? [], String(a.metin ?? ""), k?.sema, Array.isArray(a.alanlar) ? a.alanlar.map(String) : undefined).slice(0, Math.min(500, Math.max(1, Number(a.sinir) || 50)));
    }
    if (islem === "ekle") {
      const alanlar = alanlariTemizle(JSON.parse(json || "{}"));
      if (!alanlar) throw new Error("Kayıt geçersiz ya da çok büyük.");
      let okuma: Kural = "herkes";
      const yk = await import("./bulutVeriAyar").then((m) => m.yeniTabloKurali(p.id)).catch(() => ({ ...VARSAYILAN_KURAL }));
      const y = await veriDegistir(p.id, (v) => {
        const k = v.koleksiyonlar[kol] ??= { kurallar: { ...yk }, kayitlar: [] };
        if (k.kayitlar.length >= SINIR.kayit) throw new Error("Koleksiyon dolu.");
        const s = semayaUygula(k, alanlar, true);
        if ("hata" in s) throw new Error(s.hata);
        const z = Date.now();
        const y = { id: yeniKayitId(), olusturma: z, guncelleme: z, ...s.alanlar } as Kayit;
        k.kayitlar.push(y);
        okuma = k.kurallar.okuma;
        return y;
      });
      canliYayinla(p.id, "canli", kol, okuma, "ekle", y);
      gecmisYaz(p.id, "canli", kol, { kayitId: y.id, islem: "ekle", kim: "fonksiyon", sonraki: y });
      return y;
    }
    if (islem === "guncelle" || islem === "sil") {
      const { id, alanlar: g } = JSON.parse(json || "{}") as { id?: string; alanlar?: unknown };
      let okuma: Kural = "herkes", onceki: Kayit | undefined;
      const r = await veriDegistir(p.id, (v) => {
        const k = v.koleksiyonlar[kol];
        const x = k?.kayitlar.find((r) => r.id === id);
        if (!k || !x) throw new Error("Kayıt bulunamadı.");
        okuma = k.kurallar.okuma; onceki = { ...x };
        if (islem === "sil") { k.kayitlar = k.kayitlar.filter((r) => r.id !== id); return null; }
        const t = alanlariTemizle(g);
        if (!t) throw new Error("Alanlar geçersiz.");
        const s = semayaUygula(k, t, false, x.id);
        if ("hata" in s) throw new Error(s.hata);
        Object.assign(x, s.alanlar, { guncelleme: Date.now() });
        return { ...x };
      });
      canliYayinla(p.id, "canli", kol, okuma, r ? "guncelle" : "sil", r ?? onceki, r ? onceki : undefined);
      if (onceki) gecmisYaz(p.id, "canli", kol, { kayitId: onceki.id, islem: r ? "guncelle" : "sil", kim: "fonksiyon", onceki, ...(r ? { sonraki: r } : {}) });
      return r ?? { ok: true };
    }
    throw new Error("Bilinmeyen veri işlemi.");
  });

  eszamansiz("__sonra", async ([saniye, ad, veriJson]) => {
    const { gecikmeliEkle } = await import("./bulutZamanli");
    const is = await gecikmeliEkle(p.id, { fonksiyon: String(ad), gecikme: Number(saniye) * 1000, veri: veriJson ? JSON.parse(veriJson) : undefined });
    return { id: is.id, zaman: new Date(is.zaman).toISOString() };
  });

  eszamansiz("__oda", async ([ad, json]) => {
    const [{ odaFonksiyon }, { aktifOrtam }] = await Promise.all([import("./bulutOda"), import("./veri")]);
    return odaFonksiyon(p.id, aktifOrtam(), String(ad), JSON.parse(json || "{}"));
  });

  // Kullanıcıya dönük API ve modül sözdizimi uyarlaması (export default → main).
  const hazir = `
var console = { log: function(){ __log.apply(null, Array.prototype.map.call(arguments, function(x){ return typeof x === "string" ? x : JSON.stringify(x); })); } };
console.error = console.log; console.warn = console.log; console.info = console.log;
var vayra = {
  sir: function(ad){ return __sir(String(ad)); },
  hmac: function(alg, anahtar, veri, cikti){ return __hmac(String(alg), String(anahtar), String(veri), cikti || "base64"); },
  ozet: function(alg, veri, cikti){ return __ozet(String(alg), String(veri), cikti || "hex"); },
  fetch: async function(adres, ayar){ ayar = ayar || {}; var b = ayar.body; if (b && typeof b !== "string") { b = JSON.stringify(b); ayar.headers = Object.assign({ "Content-Type": "application/json" }, ayar.headers || {}); }
    var r = JSON.parse(await __fetch(String(adres), JSON.stringify({ method: ayar.method, headers: ayar.headers, body: b })));
    return { status: r.durum, ok: r.durum < 400, headers: r.basliklar, text: async function(){ return r.govde; }, json: async function(){ return JSON.parse(r.govde); } }; },
  veri: { liste: async function(k, s){ return JSON.parse(await __veri("liste", String(k), JSON.stringify(s || {}))); }, ekle: async function(k, kayit){ return JSON.parse(await __veri("ekle", String(k), JSON.stringify(kayit || {}))); },
    guncelle: async function(k, id, alanlar){ return JSON.parse(await __veri("guncelle", String(k), JSON.stringify({ id: String(id), alanlar: alanlar || {} }))); }, sil: async function(k, id){ return JSON.parse(await __veri("sil", String(k), JSON.stringify({ id: String(id) }))); },
    ara: async function(k, metin, s){ s = s || {}; return JSON.parse(await __veri("ara", String(k), JSON.stringify({ metin: String(metin || ""), alanlar: s.alanlar, sinir: s.sinir }))); } },
  sonra: async function(saniye, ad, veri){ return JSON.parse(await __sonra(String(saniye), String(ad), veri === undefined ? "" : JSON.stringify(veri))); },
  oda: function(ad){ var a = String(ad); var g = async function(x){ return JSON.parse(await __oda(a, JSON.stringify(x))); }; var t = function(l, k){ return g({ islemler: l, kosul: k }); };
    return { durum: function(){ return g({ t: "oku" }); }, toplu: t, ayarla: function(y, d, k){ return t([{ t: "ayarla", y: String(y), d: d }], k); }, sil: function(y, k){ return t([{ t: "sil", y: String(y) }], k); },
      artir: function(y, n, k){ return t([{ t: "artir", y: String(y), n: n == null ? 1 : n }], k); }, ekle: function(y, d, s){ return t([{ t: "ekle", y: String(y), d: d, s: s }]); }, birlestir: function(n, y){ return t([{ t: "birlestir", y: y, d: n || {} }]); },
      olay: function(o, d){ return t([{ t: "olay", o: String(o), d: d }]); }, sifirla: function(d){ return t([{ t: "sifirla", d: d || {} }]); } }; }
};
var fetch = vayra.fetch;
`;
  const uyarlanmis = kod.replace(/export\s+default\s+(async\s+)?function\s*([A-Za-z_$][\w$]*)?\s*\(/, (_m, a) => `var main = ${a ?? ""}function (`)
    .replace(/export\s+default\s+/, "var main = ")
    // Yapılandırma dışa aktarımları (export const zamanlama = "…") kum havuzunda düz değişken olur.
    .replace(/export\s+(const|let|var)\s+/g, "$1 ");
  const kapanis = `
;(async function(){ if (typeof main !== "function") throw new Error("Fonksiyon bulunamadı: export default async function (istek, vayra) { … } yaz.");
  var y = await main(JSON.parse(__istek), vayra);
  if (y && typeof y === "object" && ("durum" in y || "govde" in y || "status" in y || "body" in y)) return JSON.stringify({ durum: y.durum || y.status || 200, basliklar: y.basliklar || y.headers || {}, govde: y.govde !== undefined ? y.govde : y.body });
  return JSON.stringify({ durum: 200, basliklar: {}, govde: y === undefined ? null : y });
})()`;
  let sonuc: FnSonuc;
  try {
    vm.newString(JSON.stringify(istek)).consume((h) => vm.setProp(vm.global, "__istek", h));
    const r = vm.evalCode(hazir + uyarlanmis + kapanis, "fonksiyon.js");
    if (r.error) { const e = vm.dump(r.error); r.error.dispose(); throw new Error(typeof e === "object" && e ? `${e.name ?? "Hata"}: ${e.message ?? ""}` : String(e)); }
    const soz = r.value;
    isle();
    const zaman = new Promise<never>((_, red) => setTimeout(() => red(new Error(`Fonksiyon ${SURE / 1000} saniyede bitmedi.`)), Math.max(0, bitis - Date.now()) + 200));
    // resolvePromise kum havuzunda then işi kuyruğa ekler; dış çağrı olmayan fonksiyonda onu hemen işlet.
    const bekleyen = vm.resolvePromise(soz);
    isle();
    const cozum = await Promise.race([bekleyen, zaman]);
    soz.dispose();
    if (cozum.error) { const e = vm.dump(cozum.error); cozum.error.dispose(); throw new Error(typeof e === "object" && e ? `${e.name ?? "Hata"}: ${e.message ?? ""}` : String(e)); }
    const metin = vm.getString(cozum.value);
    cozum.value.dispose();
    const y = JSON.parse(metin) as { durum: number; basliklar: Record<string, string>; govde: unknown };
    const govde = typeof y.govde === "string" ? y.govde : JSON.stringify(y.govde);
    const basliklar: Record<string, string> = {};
    for (const [k, v] of Object.entries(y.basliklar ?? {})) if (/^[A-Za-z0-9-]{1,60}$/.test(k) && !/^(set-cookie|content-length|transfer-encoding)$/i.test(k)) basliklar[k] = String(v).slice(0, 2000);
    if (!Object.keys(basliklar).some((k) => k.toLowerCase() === "content-type")) basliklar["Content-Type"] = typeof y.govde === "string" ? "text/plain; charset=utf-8" : "application/json; charset=utf-8";
    sonuc = { durum: Math.max(100, Math.min(599, Number(y.durum) || 200)), basliklar, govde: govde.slice(0, 1_000_000), loglar, sure: Date.now() - bas, disIstekler };
  } catch (e) {
    const m = (e as Error).message;
    sonuc = { durum: 500, basliklar: { "Content-Type": "application/json; charset=utf-8" }, govde: JSON.stringify({ hata: /interrupted/i.test(m) ? `Fonksiyon ${SURE / 1000} saniyede bitmedi.` : m }), loglar, sure: Date.now() - bas, hata: /interrupted/i.test(m) ? "Süre aşıldı" : m, disIstekler };
  } finally {
    kapandi = true;
    try { vm.dispose(); rt.dispose(); } catch { /* bekleyen işler varsa çöp toplayıcı bırakır */ }
  }
  return sonuc;
}

/** Fonksiyon çağrısını Bulut günlüğüne yazılacak ayrıntıya çevirir (console satırları, dış istekler, hata). */
export function fonksiyonAyrintisi(s: FnSonuc, onizleme = false) {
  return {
    ...(s.loglar.length ? { log: s.loglar.slice(-30) } : {}),
    ...(s.disIstekler?.length ? { dis: s.disIstekler.slice(0, 12).map((x) => ({ a: x.adres, y: x.yontem, d: x.durum, ms: x.sure, ...(x.hata ? { h: x.hata } : {}) })) } : {}),
    ...(s.hata ? { hata: s.hata } : {}),
    ...(onizleme ? { onizleme: true } : {}),
  };
}

/** HTTP isteğini fonksiyona verir ve yanıtı döndürür. */
export async function fonksiyonIstegi(req: Request, p: Proje, dosyalar: Record<string, string>, ad: string): Promise<{ yanit: Response; sonuc?: FnSonuc }> {
  const kod = dosyalar[`api/${ad}.js`];
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization, x-vayra-oturum" };
  if (!kod) return { yanit: Response.json({ hata: `"${ad}" adında fonksiyon yok (api/${ad}.js).` }, { status: 404, headers: cors }) };
  if (req.method === "OPTIONS") return { yanit: new Response(null, { status: 204, headers: cors }) };
  const u = new URL(req.url);
  const metin = req.method === "GET" || req.method === "HEAD" ? "" : (await req.text()).slice(0, 1_000_000);
  let govde: unknown = metin;
  if (metin && (req.headers.get("content-type") ?? "").includes("json")) { try { govde = JSON.parse(metin); } catch { /* metin kalır */ } }
  else if (metin && (req.headers.get("content-type") ?? "").includes("form-urlencoded")) govde = Object.fromEntries(new URLSearchParams(metin));
  const basliklar: Record<string, string> = {};
  req.headers.forEach((v, k) => { if (!/^(cookie|x-build-sahip)$/i.test(k)) basliklar[k] = v.slice(0, 2000); });
  const sonuc = await fonksiyonCalistir(kod, { yontem: req.method, yol: u.pathname, sorgu: Object.fromEntries(u.searchParams), basliklar, govde, metin }, p);
  return { yanit: new Response(sonuc.govde, { status: sonuc.durum, headers: { ...sonuc.basliklar, ...cors, "X-Vayra-Sure": String(sonuc.sure) } }), sonuc };
}
