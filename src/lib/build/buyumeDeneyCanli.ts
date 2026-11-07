import "server-only";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";

/**
 * Yayındaki sitelere giden A/B denemesi betiği. Çalışan denemeler küçük bir dizinde tutulur
 * (.veri/build/buyume-deney-canli.json) ve sayfa sunulurken eşzamanlı okunur (kopru.ts betikleriEkle).
 * Betik: ziyaretçiyi kalıcı olarak A ya da B'ye atar (tarayıcı belleği; kum havuzunda pencere adı dolgusu), B'ye düşen
 * A sayfasını açarsa sayfa görünmeden B adresine yönlenir, görüş ve dönüşümü (form, hedef sayfa ya da özel olay)
 * bir kez bildirir. Kişisel veri yok: yalnız rastgele ziyaretçi kimliği.
 */
export type CanliDeney = { i: string; a: string; b: string; p: number; h: { t: "form" | "sayfa" | "olay"; s?: string } };
const DOSYA = path.join(DEPO_KOK, "build", "buyume-deney-canli.json");
const G = globalThis as unknown as { __vayraDeneyCanli?: Record<string, CanliDeney[]> };

function dizin(): Record<string, CanliDeney[]> {
  if (G.__vayraDeneyCanli) return G.__vayraDeneyCanli;
  try { G.__vayraDeneyCanli = JSON.parse(readFileSync(DOSYA, "utf8")); } catch { G.__vayraDeneyCanli = {}; }
  return G.__vayraDeneyCanli!;
}
export function canliDeneyler(projeId: string): CanliDeney[] { return dizin()[projeId] ?? []; }
export function canliDeneyYaz(projeId: string, l: CanliDeney[]) {
  const d = { ...dizin() };
  if (l.length) d[projeId] = l; else delete d[projeId];
  G.__vayraDeneyCanli = d;
  try { mkdirSync(path.dirname(DOSYA), { recursive: true }); writeFileSync(DOSYA, JSON.stringify(d)); } catch { /* bir sonraki yazımda */ }
}

/** Analitik adresinden (/api/build/analitik/<id>) proje kimliğini çıkarıp betiği üretir; deneme yoksa boş. */
export function deneyBetigi(analitikAdresi: string, kok: string): string {
  const id = analitikAdresi.split("/").filter(Boolean).pop() ?? "";
  const l = canliDeneyler(id);
  if (!l.length) return "";
  const C = JSON.stringify({ d: l, k: kok, a: `/api/build/buyume-genel/deney/${id}` }).replace(/</g, "\\u003c");
  return "<script>(function(){try{var C=" + C + ",K=C.k||\"\",y=location.pathname;if(K&&y.indexOf(K)===0)y=y.slice(K.length);while(y.charAt(0)===\"/\")y=y.slice(1);if(!y)y=\"index.html\";"
    + "if(y.slice(-1)===\"/\")y=y+\"index.html\";"
    + "var N=\"vayra-deney\",S={};try{S=JSON.parse(localStorage.getItem(N)||\"{}\")||{}}catch(e){S={}}"
    + "function kaydet(){try{localStorage.setItem(N,JSON.stringify(S))}catch(e){}}"
    + "function gonder(o){try{var s=JSON.stringify(o);if(navigator.sendBeacon)navigator.sendBeacon(C.a,new Blob([s],{type:\"text/plain\"}));else fetch(C.a,{method:\"POST\",body:s,keepalive:true})}catch(e){}}"
    + "function kimlik(){var h=\"abcdefghijklmnopqrstuvwxyz0123456789\",r=\"\";for(var i=0;i<16;i++)r+=h.charAt(Math.floor(Math.random()*h.length));return r}"
    + "function donustu(d,x){if(x.d)return;x.d=1;kaydet();gonder({d:d.i,k:x.k,z:x.z,t:\"don\"})}"
    + "for(var j=0;j<C.d.length;j++){var d=C.d[j],x=S[d.i];"
    + "if(y===d.a||y===d.b){if(!x){x=S[d.i]={k:y===d.b?\"b\":(Math.random()*100<d.p?\"b\":\"a\"),z:kimlik()};kaydet()}"
    + "if(y===d.a&&x.k===\"b\"){document.documentElement.style.visibility=\"hidden\";location.replace(K+\"/\"+d.b+location.search+location.hash);return}"
    + "if(!x.g){x.g=1;x.k=y===d.b?\"b\":\"a\";kaydet();gonder({d:d.i,k:x.k,z:x.z,t:\"gor\"})}}"
    + "if(!x||!x.g||x.d)continue;"
    + "if(d.h.t===\"sayfa\"&&y===d.h.s)donustu(d,x);"
    + "if(d.h.t===\"form\")(function(d,x){document.addEventListener(\"submit\",function(e){var f=e.target;if(f&&f.getAttribute&&f.getAttribute(\"data-vayra-form\")!==null)donustu(d,x)},true)})(d,x);"
    + "if(d.h.t===\"olay\")(function(d,x){function sar(){var v=window.vayra||{},o=v.olay;if(!o||o.__deney)return;var y2=function(ad,veri){if(ad===d.h.s)donustu(d,x);return o.apply(this,arguments)};y2.__deney=1;v.olay=y2}if(document.readyState===\"loading\")document.addEventListener(\"DOMContentLoaded\",sar);else sar()})(d,x)}"
    + "}catch(e){document.documentElement.style.visibility=\"\"}})();</script>";
}
