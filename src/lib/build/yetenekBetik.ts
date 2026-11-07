import "server-only";
import { createHash, createHmac } from "crypto";
import { getQuickJS, type QuickJSContext, type QuickJSHandle } from "quickjs-emscripten";
import { guvenliFetch } from "@/lib/guvenliAg";
import { adresGecerli } from "./kaynak";
import type { Yetenek, YetenekDosya } from "./yetenekDepo";

/**
 * Yetenek betikleri: yeteneğin scripts/*.js dosyaları QuickJS kum havuzunda çalışır (Node'a, dosya sistemine ve
 * ağa doğrudan erişim yok). Desteklenen biçimler:
 *   module.exports = function (girdi, vayra) { … return sonuc; }   (eşzamansız da olabilir)
 *   export default function (girdi, vayra) { … }
 *   düz betik: girdi değişkenini okur, console.log ile yazar.
 * require("./yardimci.js") ve require("../references/veri.json") yalnız yeteneğin kendi dosyalarını yükler.
 * vayra: dosya(yol) yeteneğin dosyasını okur, yaz(yol, icerik) çıktı dosyası üretir (en çok 20 dosya, 1 MB),
 * ozet / hmac (sha256 vb.), fetch(adres) yalnız yeteneğin izin verdiği alan adlarına (varsayılan kapalı).
 * Sınırlar: 32 MB bellek, 5 sn süre, 5 dış istek, dönüş ve günlük 200 KB.
 * Python ve kabuk betikleri bu ortamda çalışmaz; açıkça söylenir.
 */
export type BetikDisIstek = { adres: string; durum: number; sure: number; hata?: string };
export type BetikSonuc = { donus: unknown; loglar: string[]; dosyalar: YetenekDosya[]; sure: number; hata?: string; disIstekler: BetikDisIstek[] };

const SURE = 5000, DIS_ISTEK = 5, CIKTI = 200_000;
const yolNormal = (taban: string, yol: string): string | null => {
  const parca = (yol.startsWith("/") ? yol.slice(1) : `${taban}/${yol}`).split("/");
  const o: string[] = [];
  for (const p of parca) { if (!p || p === ".") continue; if (p === "..") { if (!o.length) return null; o.pop(); } else o.push(p); }
  return o.join("/");
};
/** Alan adı izin listesine uyuyor mu (tam ad ya da alt alan adı). */
const alanUyar = (host: string, l: string[]) => l.some((a) => { const x = a.toLowerCase().replace(/^\*\./, ""); return host === x || host.endsWith(`.${x}`); });

/** Çalıştırılabilir betikler (yalnız .js, .mjs, .cjs). */
export const calisirBetikler = (y: Pick<Yetenek, "dosyalar">) => y.dosyalar.filter((d) => /\.(c|m)?js$/i.test(d.yol));

export async function yetenekBetigiCalistir(y: Pick<Yetenek, "ad" | "dosyalar"> & { betikAg?: string[] }, yol: string, girdi: unknown): Promise<BetikSonuc> {
  const bas = Date.now();
  const loglar: string[] = [];
  const cikti: YetenekDosya[] = [];
  const disIstekler: BetikDisIstek[] = [];
  const d = y.dosyalar.find((x) => x.yol === yol);
  if (!d) return { donus: null, loglar, dosyalar: [], sure: 0, disIstekler, hata: `${yol} bulunamadı.` };
  if (/\.(py|sh|bash|ps1|rb|php)$/i.test(yol)) return { donus: null, loglar, dosyalar: [], sure: 0, disIstekler, hata: "Bu betik türü Vayra kum havuzunda çalışmaz; yalnız JavaScript (.js) betikleri çalışır. Model bu dosyayı okuyup adımlarını kendisi uygulayabilir." };
  if (!/\.(c|m)?js$/i.test(yol)) return { donus: null, loglar, dosyalar: [], sure: 0, disIstekler, hata: "Yalnız .js dosyaları çalıştırılabilir." };
  const izinli = (y.betikAg ?? []).filter(Boolean);
  const QuickJS = await getQuickJS();
  const rt = QuickJS.newRuntime();
  rt.setMemoryLimit(32 * 1024 * 1024);
  rt.setMaxStackSize(1024 * 1024);
  const bitis = bas + SURE;
  rt.setInterruptHandler(() => Date.now() > bitis);
  const vm = rt.newContext();
  let kapandi = false, istek = 0, yazilan = 0;
  const isle = () => { if (!kapandi) { const r = rt.executePendingJobs(); if (r.error) r.error.dispose(); } };
  const tanimla = (ad: string, f: (...h: QuickJSHandle[]) => QuickJSHandle | undefined) => vm.newFunction(ad, f).consume((h) => vm.setProp(vm.global, ad, h));
  const hata = (vm2: QuickJSContext, m: string) => vm2.newError(m);
  tanimla("__log", (...h) => { if (loglar.length < 300) loglar.push(h.map((x) => vm.getString(x)).join(" ").slice(0, 4000)); return undefined; });
  tanimla("__dosya", (h) => { const v = y.dosyalar.find((x) => x.yol === vm.getString(h)); return v ? vm.newString(v.icerik) : vm.undefined; });
  tanimla("__yaz", (a, b) => {
    const yol2 = vm.getString(a).replace(/^\/+/, "").slice(0, 160), icerik = vm.getString(b);
    if (!/^[\w.-]+(\/[\w.-]+)*$/.test(yol2) || yol2.split("/").includes("..")) throw hata(vm, "Dosya yolu geçersiz.");
    if (cikti.length >= 20 && !cikti.some((x) => x.yol === yol2)) throw hata(vm, "En çok 20 çıktı dosyası yazılabilir.");
    yazilan += icerik.length;
    if (yazilan > 1_000_000) throw hata(vm, "Çıktı dosyaları 1 MB sınırını aştı.");
    const i = cikti.findIndex((x) => x.yol === yol2);
    if (i >= 0) cikti[i] = { yol: yol2, icerik }; else cikti.push({ yol: yol2, icerik });
    return undefined;
  });
  tanimla("__ozet", (alg, veri, c) => { try { return vm.newString(createHash(vm.getString(alg)).update(vm.getString(veri)).digest(vm.getString(c) as "hex" | "base64")); } catch (e) { throw hata(vm, (e as Error).message); } });
  tanimla("__hmac", (alg, k, veri, c) => { try { return vm.newString(createHmac(vm.getString(alg), vm.getString(k)).update(vm.getString(veri)).digest(vm.getString(c) as "hex" | "base64")); } catch (e) { throw hata(vm, (e as Error).message); } });
  tanimla("__fetch", (a, b) => {
    const adres = vm.getString(a), ayar = JSON.parse(vm.getString(b) || "{}") as { method?: string; headers?: Record<string, string>; body?: string };
    const s = vm.newPromise();
    (async () => {
      if (!izinli.length) throw new Error("Bu yeteneğin betiklerine ağ erişimi kapalı. Yetenek ayarlarından izin verilen alan adı ekle.");
      if (++istek > DIS_ISTEK) throw new Error(`Bir çalışmada en çok ${DIS_ISTEK} dış istek yapılabilir.`);
      const u = adresGecerli(adres);
      if (!u || (process.env.NODE_ENV === "production" && u.protocol !== "https:")) throw new Error("Yalnız herkese açık https adresleri.");
      if (!alanUyar(u.hostname, izinli)) throw new Error(`${u.hostname} izin listesinde değil.`);
      const k: BetikDisIstek = { adres: `${u.origin}${u.pathname}`.slice(0, 200), durum: 0, sure: 0 };
      disIstekler.push(k);
      const t0 = Date.now();
      try {
        const r = await guvenliFetch(u, { method: ayar.method ?? "GET", headers: ayar.headers, body: ayar.body, signal: AbortSignal.timeout(Math.max(500, Math.min(4000, bitis - Date.now()))) }, { yalnizHttps: process.env.NODE_ENV === "production" });
        const govde = (await r.text()).slice(0, 500_000);
        k.durum = r.status; k.sure = Date.now() - t0;
        return { durum: r.status, govde };
      } catch (e) { k.sure = Date.now() - t0; k.hata = (e as Error).message.slice(0, 160); throw e; }
    })().then((v) => { if (!kapandi) { const x = vm.newString(JSON.stringify(v)); s.resolve(x); x.dispose(); } }, (e) => { if (!kapandi) { const x = vm.newError((e as Error).message); s.reject(x); x.dispose(); } }).finally(isle);
    return s.handle;
  });
  const dizin = yol.includes("/") ? yol.slice(0, yol.lastIndexOf("/")) : "";
  const hazir = `
var console = { log: function(){ __log.apply(null, Array.prototype.map.call(arguments, function(x){ return typeof x === "string" ? x : JSON.stringify(x); })); } };
console.error = console.log; console.warn = console.log; console.info = console.log; console.table = console.log;
var vayra = {
  dosya: function(y){ var v = __dosya(String(y).replace(/^\\.?\\//, "")); if (v === undefined) throw new Error("Dosya yok: " + y); return v; },
  yaz: function(y, icerik){ __yaz(String(y), typeof icerik === "string" ? icerik : JSON.stringify(icerik, null, 2)); },
  ozet: function(alg, veri, c){ return __ozet(String(alg), String(veri), c || "hex"); },
  hmac: function(alg, k, veri, c){ return __hmac(String(alg), String(k), String(veri), c || "hex"); },
  fetch: async function(adres, ayar){ ayar = ayar || {}; var b = ayar.body; if (b && typeof b !== "string") b = JSON.stringify(b);
    var r = JSON.parse(await __fetch(String(adres), JSON.stringify({ method: ayar.method, headers: ayar.headers, body: b })));
    return { status: r.durum, ok: r.durum < 400, text: async function(){ return r.govde; }, json: async function(){ return JSON.parse(r.govde); } }; }
};
var __moduller = {};
function __cozYol(taban, y){ var p = (taban ? taban + "/" : "") + y, o = []; p.split("/").forEach(function(s){ if (!s || s === ".") return; if (s === "..") o.pop(); else o.push(s); }); return o.join("/"); }
function __require(taban){ return function(y){
  y = String(y); if (!/^\\.{1,2}\\//.test(y)) throw new Error("Yalnız yeteneğin kendi dosyaları yüklenebilir (./ ya da ../ ile): " + y);
  var tam = __cozYol(taban, y); var adaylar = [tam, tam + ".js", tam + "/index.js"]; var bulunan = null, kod;
  for (var i = 0; i < adaylar.length; i++) { kod = __dosya(adaylar[i]); if (kod !== undefined) { bulunan = adaylar[i]; break; } }
  if (bulunan === null) throw new Error("Modül bulunamadı: " + y);
  if (__moduller[bulunan]) return __moduller[bulunan].exports;
  if (/\\.json$/.test(bulunan)) return JSON.parse(kod);
  var m = { exports: {} }; __moduller[bulunan] = m;
  (new Function("module", "exports", "require", kod))(m, m.exports, __require(bulunan.indexOf("/") >= 0 ? bulunan.slice(0, bulunan.lastIndexOf("/")) : ""));
  return m.exports; }; }
var require = __require(${JSON.stringify(dizin)});
var girdi = JSON.parse(__girdi);
var process = { argv: ["node", ${JSON.stringify(yol)}].concat(Array.isArray(girdi && girdi.argv) ? girdi.argv.map(String) : []), env: {}, exit: function(){ throw new Error("process.exit kullanılamaz"); } };
var module = { exports: {} }, exports = module.exports;
`;
  // ES modül sözdizimi CommonJS'e çevrilir: export default, adlı export function/const ve export { … }.
  const adlar: string[] = [];
  const kod = d.icerik
    .replace(/^\s*#!.*$/m, "")
    .replace(/^\s*import\s+.*$/gm, (s) => `// ${s.trim()} (import desteklenmez; require kullan)`)
    .replace(/export\s+default\s+(async\s+)?function\s*([A-Za-z_$][\w$]*)?\s*\(/, (_m, a) => `module.exports.default = ${a ?? ""}function (`)
    .replace(/export\s+default\s+/, "module.exports.default = ")
    .replace(/export\s+(async\s+)?function\s+([A-Za-z_$][\w$]*)/g, (_m, a, n) => { adlar.push(n); return `${a ?? ""}function ${n}`; })
    .replace(/export\s+(const|let|var|class)\s+([A-Za-z_$][\w$]*)/g, (_m, t, n) => { adlar.push(n); return `${t} ${n}`; })
    .replace(/export\s*\{([^}]*)\}\s*;?/g, (_m, l: string) => { for (const p of l.split(",")) { const [a, b] = p.trim().split(/\s+as\s+/); if (a) adlar.push(b ? `${b}:${a}` : a); } return ""; });
  const disari = adlar.map((n) => { const [dis, ic] = n.includes(":") ? n.split(":") : [n, n]; return `module.exports[${JSON.stringify(dis)}] = ${ic};`; }).join("\n");
  const kapanis = `
;${disari}
;(async function(){ var e = module.exports;
  var f = typeof e === "function" ? e : typeof e.default === "function" ? e.default : null;
  if (girdi && typeof girdi.islev === "string") { if (typeof e[girdi.islev] !== "function") throw new Error("Betikte " + girdi.islev + " adlı işlev yok. Var olanlar: " + Object.keys(e).filter(function(k){ return typeof e[k] === "function"; }).join(", ")); f = e[girdi.islev]; }
  else if (!f && typeof e.main === "function") f = e.main;
  var y;
  if (f) y = girdi && Array.isArray(girdi.argumanlar) ? await f.apply(null, girdi.argumanlar) : await f(girdi && girdi.islev && girdi.girdi !== undefined ? girdi.girdi : girdi, vayra);
  else { var islevler = Object.keys(e).filter(function(k){ return typeof e[k] === "function"; }); y = islevler.length ? { bilgi: "Bu betik birden çok işlev sunuyor; girdide islev ve argumanlar ver.", islevler: islevler } : undefined; }
  return JSON.stringify(y === undefined ? null : y);
})()`;
  let sonuc: BetikSonuc;
  try {
    vm.newString(JSON.stringify(girdi ?? {})).consume((h) => vm.setProp(vm.global, "__girdi", h));
    const r = vm.evalCode(hazir + kod + kapanis, yol);
    if (r.error) { const e = vm.dump(r.error); r.error.dispose(); throw new Error(typeof e === "object" && e ? `${e.name ?? "Hata"}: ${e.message ?? ""}` : String(e)); }
    const soz = r.value;
    isle();
    const zaman = new Promise<never>((_, red) => setTimeout(() => red(new Error(`Betik ${SURE / 1000} saniyede bitmedi.`)), Math.max(0, bitis - Date.now()) + 200));
    const bekleyen = vm.resolvePromise(soz);
    isle();
    const cozum = await Promise.race([bekleyen, zaman]);
    soz.dispose();
    if (cozum.error) { const e = vm.dump(cozum.error); cozum.error.dispose(); throw new Error(typeof e === "object" && e ? `${e.name ?? "Hata"}: ${e.message ?? ""}` : String(e)); }
    const metin = vm.getString(cozum.value);
    cozum.value.dispose();
    if (metin.length > CIKTI) throw new Error(`Dönüş değeri ${Math.round(CIKTI / 1000)} KB sınırını aşıyor; büyük çıktıyı vayra.yaz ile dosyaya yaz.`);
    sonuc = { donus: JSON.parse(metin), loglar, dosyalar: cikti, sure: Date.now() - bas, disIstekler };
  } catch (e) {
    const m = (e as Error).message;
    sonuc = { donus: null, loglar, dosyalar: cikti, sure: Date.now() - bas, disIstekler, hata: /interrupted/i.test(m) ? `Betik ${SURE / 1000} saniyede bitmedi.` : m.slice(0, 600) };
  } finally {
    kapandi = true;
    try { vm.dispose(); rt.dispose(); } catch { /* bekleyen işler varsa çöp toplayıcı bırakır */ }
  }
  return sonuc;
}

/* ───────────── Motorlar için araç ───────────── */
/** Sohbet ve ajan motorlarının modele sunacağı araç tanımı (yetenekleri olan turlarda eklenir). */
export const YETENEK_BETIK_ARACI = {
  name: "yetenek_betigi",
  description: "Bir yeteneğin scripts/ klasöründeki JavaScript betiğini kum havuzunda çalıştırır ve dönüş değerini, console çıktısını ve ürettiği dosyaları getirir. Önce yetenek_oku ile talimatı yükle; talimat betiği ve girdisini anlatır.",
  input_schema: { type: "object" as const, properties: { ad: { type: "string", description: "Yeteneğin adı" }, yol: { type: "string", description: "Betiğin yolu, ör. scripts/temizle.js" }, girdi: { type: "object", description: "Betiğe verilecek girdi nesnesi" } }, required: ["ad", "yol"] },
};
/** yetenek_betigi aracını yürütür: modele gidecek metin (dönüş, günlük, dosyalar). */
export async function yetenekBetikAraciYurut(yetenekler: (Pick<Yetenek, "ad" | "dosyalar"> & { betikAg?: string[] })[], girdi: unknown): Promise<{ icerik: string; hata?: boolean; sonuc: BetikSonuc | null }> {
  const g = (girdi ?? {}) as { ad?: unknown; yol?: unknown; girdi?: unknown };
  const y = yetenekler.find((x) => x.ad === String(g.ad ?? ""));
  if (!y) return { icerik: `Böyle bir yetenek yok: ${String(g.ad ?? "")}`, hata: true, sonuc: null };
  const s = await yetenekBetigiCalistir(y, String(g.yol ?? ""), g.girdi ?? {});
  const parca = [s.hata ? `Hata: ${s.hata}` : `Dönüş:\n${JSON.stringify(s.donus, null, 1).slice(0, 30_000)}`];
  if (s.loglar.length) parca.push(`Çıktı:\n${s.loglar.join("\n").slice(0, 10_000)}`);
  if (s.dosyalar.length) parca.push(`Üretilen dosyalar: ${s.dosyalar.map((d) => `${d.yol} (${d.icerik.length} karakter)`).join(", ")}\n${s.dosyalar.map((d) => `--- ${d.yol}\n${d.icerik.slice(0, 8000)}`).join("\n")}`);
  return { icerik: parca.join("\n\n"), hata: !!s.hata, sonuc: s };
}
