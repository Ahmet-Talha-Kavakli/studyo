import "server-only";
import { createHash, createHmac } from "crypto";
import { getQuickJS, type QuickJSContext, type QuickJSHandle } from "quickjs-emscripten";

/**
 * Sistem kod adımı: JavaScript QuickJS kum havuzunda çalışır (Node'a, dosya sistemine ve ağa erişim yok).
 *   export default function (girdi) { return { ... } }     ya da  function main(girdi) { … }
 * ya da yalnız gövde (return ile). girdi: { tetik, adim: { "1": çıktı, "<kimlik>": çıktı }, dongu? }.
 * vayra.hmac(alg, anahtar, veri, cikti), vayra.ozet(alg, veri, cikti); console.log günlüğe düşer.
 * Sınırlar: 32 MB bellek, 5 sn süre, 200 KB çıktı. Bulut fonksiyonları (fonksiyon.ts) ile aynı kum havuzu.
 */
export type KodSonuc = { deger: unknown; loglar: string[]; sure: number };
const SURE = 5000;

export async function kodCalistir(kod: string, girdi: unknown): Promise<KodSonuc> {
  const bas = Date.now();
  const loglar: string[] = [];
  const QuickJS = await getQuickJS();
  const rt = QuickJS.newRuntime();
  rt.setMemoryLimit(32 * 1024 * 1024);
  rt.setMaxStackSize(1024 * 1024);
  const bitis = bas + SURE;
  rt.setInterruptHandler(() => Date.now() > bitis);
  const vm: QuickJSContext = rt.newContext();
  const isle = () => { const r = rt.executePendingJobs(); if (r.error) r.error.dispose(); };
  const tanimla = (ad: string, f: (...h: QuickJSHandle[]) => QuickJSHandle | undefined) => vm.newFunction(ad, f).consume((h) => vm.setProp(vm.global, ad, h));
  const hataAt = (e: unknown) => { throw vm.newError((e as Error).message); };
  try {
    tanimla("__log", (...h) => { if (loglar.length < 200) loglar.push(h.map((x) => vm.getString(x)).join(" ").slice(0, 2000)); return undefined; });
    tanimla("__hmac", (alg, anahtar, veri, cikti) => { try { return vm.newString(createHmac(vm.getString(alg), vm.getString(anahtar)).update(vm.getString(veri)).digest(vm.getString(cikti) as "base64" | "hex")); } catch (e) { return hataAt(e); } });
    tanimla("__ozet", (alg, veri, cikti) => { try { return vm.newString(createHash(vm.getString(alg)).update(vm.getString(veri)).digest(vm.getString(cikti) as "base64" | "hex")); } catch (e) { return hataAt(e); } });
    vm.newString(JSON.stringify(girdi ?? null)).consume((h) => vm.setProp(vm.global, "__girdi", h));
    const hazir = `
var console = { log: function(){ __log.apply(null, Array.prototype.map.call(arguments, function(x){ return typeof x === "string" ? x : JSON.stringify(x); })); } };
console.error = console.log; console.warn = console.log; console.info = console.log;
var vayra = {
  hmac: function(alg, anahtar, veri, cikti){ return __hmac(String(alg), String(anahtar), String(veri), cikti || "base64"); },
  ozet: function(alg, veri, cikti){ return __ozet(String(alg), String(veri), cikti || "hex"); }
};
`;
    const modul = /export\s+default|function\s+main\s*\(/.test(kod);
    const govde = modul
      ? kod.replace(/export\s+default\s+(async\s+)?function\s*([A-Za-z_$][\w$]*)?\s*\(/, (_m, a) => `var main = ${a ?? ""}function (`).replace(/export\s+default\s+/, "var main = ")
      : `var main = async function (girdi) {\n${kod}\n};`;
    const kapanis = `
;(async function(){ if (typeof main !== "function") throw new Error("Kod bulunamadı: export default function (girdi) { return { … } } yaz.");
  var y = await main(JSON.parse(__girdi));
  return JSON.stringify(y === undefined ? null : y);
})()`;
    const r = vm.evalCode(hazir + govde + kapanis, "kod.js");
    if (r.error) { const e = vm.dump(r.error); r.error.dispose(); throw new Error(typeof e === "object" && e ? `${e.name ?? "Hata"}: ${e.message ?? ""}` : String(e)); }
    const soz = r.value;
    isle();
    const bekleyen = vm.resolvePromise(soz);
    isle();
    const zaman = new Promise<never>((_, red) => setTimeout(() => red(new Error(`Kod ${SURE / 1000} saniyede bitmedi.`)), Math.max(0, bitis - Date.now()) + 200));
    const cozum = await Promise.race([bekleyen, zaman]);
    soz.dispose();
    if (cozum.error) { const e = vm.dump(cozum.error); cozum.error.dispose(); throw new Error(typeof e === "object" && e ? `${e.message ?? e.name ?? "Hata"}` : String(e)); }
    const metin = vm.getString(cozum.value);
    cozum.value.dispose();
    if (metin.length > 200_000) throw new Error("Kodun çıktısı 200 KB sınırını aşıyor.");
    return { deger: JSON.parse(metin), loglar, sure: Date.now() - bas };
  } catch (e) {
    const m = (e as Error).message;
    const x = new Error(/interrupted/i.test(m) ? `Kod ${SURE / 1000} saniyede bitmedi.` : m) as Error & { loglar?: string[] };
    x.loglar = loglar;
    throw x;
  } finally {
    try { vm.dispose(); rt.dispose(); } catch { /* bekleyen işler varsa çöp toplayıcı bırakır */ }
  }
}
