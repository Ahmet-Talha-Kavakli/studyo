/**
 * Çok dillilik: projede ceviri.json (kaynak metin → dil başına çeviri) ve ceviri.js (çalışma zamanı). Derleme adımı yok:
 * ceviri.js sayfa açılınca metin düğümlerini ve placeholder/alt/title/aria-label özniteliklerini seçili dile çevirir,
 * sonradan eklenen içeriği de izler, html lang ve yönünü (Arapça, Farsça, İbranice için sağdan sola) ayarlar, isteğe bağlı
 * dil seçici gösterir. Dil sırası: adres ?dil= > ziyaretçinin seçimi > tarayıcı dili > varsayılan.
 */

export type CeviriDosyasi = {
  kaynak: string;
  diller: string[];
  secici: boolean;
  metinler: Record<string, Record<string, string>>;
};

export const DIL_ADLARI: Record<string, string> = {
  tr: "Türkçe", en: "İngilizce", de: "Almanca", fr: "Fransızca", es: "İspanyolca", it: "İtalyanca", ar: "Arapça", ru: "Rusça",
  nl: "Felemenkçe", pt: "Portekizce", az: "Azerbaycan Türkçesi", fa: "Farsça", el: "Yunanca", ja: "Japonca", zh: "Çince", ko: "Korece", uk: "Ukraynaca", pl: "Lehçe",
};
/** Dil seçicide görünen kendi adları. */
export const DIL_YEREL: Record<string, string> = {
  tr: "Türkçe", en: "English", de: "Deutsch", fr: "Français", es: "Español", it: "Italiano", ar: "العربية", ru: "Русский", nl: "Nederlands", pt: "Português",
  az: "Azərbaycanca", fa: "فارسی", el: "Ελληνικά", ja: "日本語", zh: "中文", ko: "한국어", uk: "Українська", pl: "Polski",
};

const ATLA = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "CODE", "PRE", "SVG", "TEXTAREA"]);
const OZNITELIK = ["placeholder", "alt", "title", "aria-label"];

/** HTML sayfalarından çevrilecek metinleri çıkarır (tarayıcıda, DOMParser ile). Sıra: ilk görüldüğü yer. */
export function metinleriCikar(sayfalar: string[]): string[] {
  const l: string[] = [], gor = new Set<string>();
  const ekle = (m: string) => { const t = m.replace(/\s+/g, " ").trim(); if (t.length < 2 || t.length > 600 || !/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(t) || gor.has(t)) return; gor.add(t); l.push(t); };
  for (const html of sayfalar) {
    const d = new DOMParser().parseFromString(html, "text/html");
    const t = d.querySelector("title")?.textContent; if (t) ekle(t);
    const md = d.querySelector('meta[name="description"]')?.getAttribute("content"); if (md) ekle(md);
    const yuru = (el: Element) => {
      if (ATLA.has(el.tagName.toUpperCase()) || el.hasAttribute("data-cevirme")) return;
      for (const a of OZNITELIK) { const v = el.getAttribute(a); if (v) ekle(v); }
      for (const c of Array.from(el.childNodes)) { if (c.nodeType === 3) ekle(c.textContent ?? ""); else if (c.nodeType === 1) yuru(c as Element); }
    };
    if (d.body) yuru(d.body);
  }
  return l;
}

/** ceviri.js: düz ES5, kendi başına çalışır (önizlemede ve yayında). */
export const CEVIRI_JS = String.raw`/* Vayra çok dillilik. Metinler ceviri.json'da; Vayra Build > Ayarlar > Diller'den düzenlenir. */
(function(){var V=null,DIL=null,OZ=["placeholder","alt","title","aria-label"],ATLA={SCRIPT:1,STYLE:1,NOSCRIPT:1,TEMPLATE:1,CODE:1,PRE:1,TEXTAREA:1},RTL={ar:1,fa:1,he:1,ur:1};
var orj=typeof WeakMap!=="undefined"?new WeakMap():null;
function temiz(s){return String(s).replace(/\s+/g," ").trim()}
function cevir(k){if(!V||DIL===V.kaynak)return null;var m=V.metinler[k];return m&&m[DIL]?m[DIL]:null}
function dugum(n){var o=orj&&orj.get(n);if(o===undefined||o===null){o=n.nodeValue;if(orj)orj.set(n,o)}var k=temiz(o);if(!k)return;var c=cevir(k);var m=/^(\s*)[\s\S]*?(\s*)$/.exec(o);var yeni=c?m[1]+c+m[2]:o;if(n.nodeValue!==yeni)n.nodeValue=yeni}
function oge(el){for(var i=0;i<OZ.length;i++){var a=OZ[i];if(!el.hasAttribute||!el.hasAttribute(a))continue;var d="data-vo-"+a;if(!el.hasAttribute(d))el.setAttribute(d,el.getAttribute(a));var o=el.getAttribute(d),c=cevir(temiz(o));el.setAttribute(a,c||o)}}
function yuru(el){if(!el||ATLA[el.tagName]||(el.hasAttribute&&el.hasAttribute("data-cevirme"))||el.id==="vayra-dil-secici")return;oge(el);var c=el.childNodes;for(var i=0;i<c.length;i++){if(c[i].nodeType===3)dugum(c[i]);else if(c[i].nodeType===1)yuru(c[i])}}
var tb=null;function baslik(){if(tb===null)tb=document.title;var c=cevir(temiz(tb));document.title=c||tb;var md=document.querySelector('meta[name="description"]');if(md){if(!md.hasAttribute("data-vo"))md.setAttribute("data-vo",md.getAttribute("content")||"");var o=md.getAttribute("data-vo"),k=cevir(temiz(o));md.setAttribute("content",k||o)}}
function uygula(){if(!V)return;document.documentElement.setAttribute("lang",DIL);document.documentElement.setAttribute("dir",RTL[DIL]?"rtl":"ltr");baslik();yuru(document.body);secici()}
function sec(d){DIL=d;try{localStorage.setItem("vayra-dil",d)}catch(e){}uygula();try{window.dispatchEvent(new CustomEvent("vayra-dil",{detail:d}))}catch(e){}}
var AD=${"$"}{ADLAR};
function secici(){var s=document.getElementById("vayra-dil-secici");if(!V.secici){if(s)s.remove();return}if(!s){s=document.createElement("div");s.id="vayra-dil-secici";s.setAttribute("data-cevirme","");s.style.cssText="position:fixed;bottom:16px;right:16px;z-index:2147483000;display:flex;gap:2px;padding:3px;border-radius:999px;background:rgba(20,20,22,.88);backdrop-filter:blur(10px);font:500 12px system-ui,sans-serif";document.body.appendChild(s)}s.innerHTML="";var l=[V.kaynak].concat(V.diller);for(var i=0;i<l.length;i++){(function(d){var b=document.createElement("button");b.type="button";b.textContent=AD[d]||d.toUpperCase();b.setAttribute("aria-pressed",d===DIL?"true":"false");b.style.cssText="border:0;cursor:pointer;padding:6px 10px;border-radius:999px;font:inherit;"+(d===DIL?"background:#fff;color:#111":"background:transparent;color:rgba(255,255,255,.75)");b.onclick=function(){sec(d)};s.appendChild(b)})(l[i])}}
function sonra(){var q=null;try{q=new URLSearchParams(location.search).get("dil")}catch(e){}var ls=null;try{ls=localStorage.getItem("vayra-dil")}catch(e){}var nv=(navigator.language||"").slice(0,2).toLowerCase(),tum=[V.kaynak].concat(V.diller);
DIL=tum.indexOf(q)>=0?q:tum.indexOf(ls)>=0?ls:tum.indexOf(nv)>=0?nv:V.kaynak;uygula();
var bek=null;try{new MutationObserver(function(){if(bek)return;bek=setTimeout(function(){bek=null;yuru(document.body)},60)}).observe(document.body,{childList:true,subtree:true,characterData:false})}catch(e){}}
window.vayra=window.vayra||{};window.vayra.dil={sec:function(d){sec(d)},simdiki:function(){return DIL},diller:function(){return V?[V.kaynak].concat(V.diller):[]},cevir:function(m){return cevir(temiz(m))||m}};
var y=(document.currentScript&&document.currentScript.src||"ceviri.js").replace(/ceviri\.js(\?.*)?$/,"ceviri.json");
fetch(y).then(function(r){return r.json()}).then(function(j){V=j;if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",sonra);else sonra()}).catch(function(){})})();
`;

export function ceviriJs(): string {
  return CEVIRI_JS.replace("${ADLAR}", JSON.stringify(DIL_YEREL));
}

/** HTML'e ceviri.js etiketini ekler (yoksa). */
export function betikEkle(html: string): string {
  if (/<script[^>]+src=["']ceviri\.js["']/i.test(html)) return html;
  const t = '<script src="ceviri.js" defer></script>';
  return /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `  ${t}\n</head>`) : html + "\n" + t + "\n";
}
export function betikCikar(html: string): string {
  return html.replace(/[ \t]*<script[^>]+src=["']ceviri\.js["'][^>]*><\/script>\r?\n?/gi, "");
}
