/**
 * Önizlemede açık ve koyu tema taklidi (yalnız önizleme; <head>'in başına, depolama dolgusundan sonra eklenir).
 * Düz ES5, şablon dizgesi değişkeni yok. Çalışma alanı { tur: "tema", tema: "acik" | "koyu" | null } gönderir:
 *  - prefers-color-scheme içeren bütün @media kuralları (iç içe olanlar da) seçilen temaya göre açılır ya da kapanır;
 *    <link media> ve <style media> öznitelikleri de aynı biçimde değişir. Tailwind CDN gibi sonradan eklenen stiller
 *    MutationObserver ile yakalanır.
 *  - window.matchMedia("(prefers-color-scheme: dark)") seçilen temayı döndürür, change dinleyicileri haber alır.
 *  - Sınıf kullanan siteler için <html> öğesine "dark" sınıfı ve color-scheme eklenir ya da kaldırılır.
 * Seçim sekme belleğinde (kum havuzunda window.name dolgusu) tutulur; sayfalar arası geçişte de sürer.
 * Ayrıca { tur: "kaydirma" } isteğine kaydırma konumu ve pencere ölçüsüyle yanıt verir (çizim ekran görüntüsü için).
 * Yanıt: { tur: "temaBilgi", medya: <prefers kural sayısı>, sinif: <.dark seçicisi var mı>, tema }.
 */
export const temaKoprusu = String.raw`<script>(function(){var QM=/[?&]vayra-tema=(acik|koyu)/.exec(location.search);if(window.parent===window&&!QM)return;
var K="vayra-onizleme-tema",T=null,H=document.documentElement,ilkDark=null,O=[],L=[],gozcu=null,zz=null;
try{T=sessionStorage.getItem(K)}catch(e){}if(T!=="acik"&&T!=="koyu")T=null;
if(QM){T=QM[1];try{sessionStorage.setItem(K,T)}catch(x){}}
function g(m){if(window.parent===window)return;m.vayra=1;try{parent.postMessage(m,"*")}catch(e){}}
function uyar(q){return /dark/i.test(q)===(T==="koyu")}
var GM=window.matchMedia?window.matchMedia.bind(window):null;
if(GM){window.matchMedia=function(q){var gm=GM(q),s=String(q);if(!/prefers-color-scheme/i.test(s))return gm;
var o={media:gm.media,onchange:null,addListener:function(f){L.push({o:o,f:f})},removeListener:function(f){L=L.filter(function(x){return x.f!==f})},
addEventListener:function(t,f){if(t==="change")L.push({o:o,f:f})},removeEventListener:function(t,f){L=L.filter(function(x){return x.f!==f})},dispatchEvent:function(){return true}};
try{Object.defineProperty(o,"matches",{get:function(){return T===null?gm.matches:uyar(s)}})}catch(e){o.matches=gm.matches}
try{gm.addEventListener("change",function(){if(T===null)bildir()})}catch(e){}
O.push(o);return o}}
function bildir(){var i;for(i=0;i<L.length;i++){try{L[i].f.call(L[i].o,{matches:L[i].o.matches,media:L[i].o.media})}catch(e){}}for(i=0;i<O.length;i++){try{if(typeof O[i].onchange==="function")O[i].onchange({matches:O[i].matches,media:O[i].media})}catch(e){}}}
var RE=/\(\s*prefers-color-scheme\s*:\s*(dark|light)\s*\)/gi;
function sorgu(mt){if(T===null)return mt;return mt.split(",").map(function(p){if(!/prefers-color-scheme/i.test(p))return p;var tut=true;p.replace(RE,function(_,v){if((v.toLowerCase()==="dark")!==(T==="koyu"))tut=false;return _});return tut?p.replace(RE,"(min-width: 0px)"):"not all"}).join(", ")}
var sayac=0,sinif=false;
function kurallar(r){for(var i=0;i<r.length;i++){var k=r[i];
if(k.selectorText&&/\.dark\b/.test(k.selectorText))sinif=true;
if(k.media&&k.cssRules){if(k.__vm===undefined){var mt=k.media.mediaText;k.__vm=/prefers-color-scheme/i.test(mt)?mt:null}
if(k.__vm){sayac++;var y=sorgu(k.__vm);if(k.media.mediaText!==y){try{k.media.mediaText=y}catch(e){}}}}
if(k.cssRules)kurallar(k.cssRules)}}
function uygula(){sayac=0;sinif=false;
var ss=document.styleSheets;for(var i=0;i<ss.length;i++){var r=null;try{r=ss[i].cssRules}catch(e){r=null}if(r)kurallar(r)}
var el=document.querySelectorAll("link[media],style[media]");for(var j=0;j<el.length;j++){var x=el[j];if(!x.hasAttribute("data-vayra-media")){var m=x.getAttribute("media")||"";if(!/prefers-color-scheme/i.test(m))continue;x.setAttribute("data-vayra-media",m)}var yy=sorgu(x.getAttribute("data-vayra-media"));if(x.getAttribute("media")!==yy)x.setAttribute("media",yy)}
if(ilkDark===null)ilkDark=H.classList.contains("dark");
if(T==="koyu"){H.classList.add("dark");H.style.colorScheme="dark"}else if(T==="acik"){H.classList.remove("dark");H.style.colorScheme="light"}else{if(ilkDark)H.classList.add("dark");else H.classList.remove("dark");H.style.colorScheme=""}
g({tur:"temaBilgi",medya:sayac,sinif:sinif,tema:T})}
function izle(){if(gozcu||typeof MutationObserver==="undefined")return;gozcu=new MutationObserver(function(){if(zz)clearTimeout(zz);zz=setTimeout(uygula,60)});gozcu.observe(H,{childList:true,subtree:true,characterData:true})}
function bekle(){uygula();if(T!==null)izle()}
if(T!==null){bekle();document.addEventListener("DOMContentLoaded",bekle);window.addEventListener("load",function(){bekle();setTimeout(uygula,300)})}
else{window.addEventListener("load",function(){setTimeout(uygula,200)})}
window.addEventListener("message",function(e){var m=e.data;if(!m||!m.vayra)return;
if(m.tur==="tema"){T=m.tema==="acik"||m.tema==="koyu"?m.tema:null;try{if(T)sessionStorage.setItem(K,T);else sessionStorage.removeItem(K)}catch(x){}uygula();if(T!==null)izle();bildir()}
if(m.tur==="kaydirma"){g({tur:"kaydirma",x:window.scrollX||0,y:window.scrollY||0,w:window.innerWidth,h:window.innerHeight})}});})();</script>`;
