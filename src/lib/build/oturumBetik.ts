import "server-only";

/**
 * Vayra oturum kaydedicisinin yapıştırıcısı: /api/build/oturum/kaydedici.js içinde rrweb UMD paketinin hemen
 * ardından çalışır (R = rrweb). Sayfadaki küçük yükleyici (kopru.ts kayitBetigi) window.__vayraKayit'i kurar:
 *   a: gönderim adresi, o: oturum kimliği, m: metinleri maskele, k: yayın kökü, q: erken yakalanan hatalar,
 *   f: sayfanın özgün fetch'i (gönderimler sarılmış fetch'ten geçmesin diye).
 *
 * Gizlilik: bütün form alanları maskelenir; parola, kart, kimlik alanlarıyla data-vayra-gizli öğeler hiç kaydedilmez
 * (rrweb blockSelector: yerine boş kutu çizilir). Sayfa metnindeki e-posta adresleri ve 9 haneden uzun sayılar
 * (telefon, kart, kimlik numarası) her zaman yıldızlanır; "metinleri de maskele" açıksa bütün metin yıldızlanır.
 *
 * Gönderim: olaylar 5 saniyede bir (ilki 1,5 saniyede) text/plain fetch ile, sayfa kapanırken sendBeacon ile 58 KB
 * parçalar hâlinde gider. Sunucu { dur: true } derse (boyut sınırı, kayıt kapandı) kayıt durur.
 * Düz ES5; şablon dizgesi ve dolar-süslü parantez kullanılmaz (String.raw içinde durur).
 */
export const OTURUM_YAPISTIRICI = String.raw`;(function(R){
var K=window.__vayraKayit;
if(!K||!R||!R.record||K.calisiyor)return;
K.calisiyor=1;
var F=K.f||window.fetch,A=K.a,O=K.o,P=kimlik(10),sira=0,kuyruk=[],bekleyen=[],toplam=0,durdu=false,dur=null,zaman=null;
var SINIR=4800000;
function kimlik(n){var h="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",r="",x=new Uint8Array(n);try{crypto.getRandomValues(x)}catch(e){for(var j=0;j<n;j++)x[j]=Math.floor(Math.random()*256)}for(var i=0;i<n;i++)r+=h.charAt(x[i]%62);return r}
var GIZLI='input[type=password],input[autocomplete^="cc-"],input[autocomplete="one-time-code"],input[name*="kart" i],input[name*="card" i],input[name*="cvv" i],input[name*="cvc" i],input[name*="iban" i],input[name*="tckn" i],input[name*="kimlik" i],input[name*="ssn" i],input[name*="pasaport" i],input[name*="passport" i],input[id*="kart" i],input[id*="card" i],input[id*="cvv" i],input[id*="tckn" i],[data-vayra-gizli]';
try{document.querySelector(GIZLI)}catch(e){GIZLI=GIZLI.replace(/ i\]/g,"]")}
function gizliMi(el){try{return !!(el&&el.closest&&el.closest(GIZLI))}catch(e){return false}}
function kisisel(t){return String(t==null?"":t).replace(/[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[A-Za-z]{2,}/g,function(m){return m.replace(/[^@.]/g,"*")}).replace(/\+?\d[\d ()./-]{7,}\d/g,function(m){return m.replace(/\D/g,"").length>=9?m.replace(/\d/g,"*"):m})}
function gizle(t){t=String(t==null?"":t);return K.m?t.replace(/\S/g,"*"):kisisel(t)}
function sade(t,n){return String(t==null?"":t).replace(/\s+/g," ").trim().slice(0,n)}
function alanAdi(el){var t="";if(K.m)return sade(el.getAttribute("name")||"",40);try{if(el.labels&&el.labels[0]){var l=el.labels[0];for(var i=0;i<l.childNodes.length;i++){if(l.childNodes[i].nodeType===3)t+=l.childNodes[i].nodeValue}t=sade(t,60)||sade(l.innerText,60)}}catch(e){}
t=t||el.getAttribute("aria-label")||el.getAttribute("placeholder")||el.getAttribute("name")||el.id||"";return kisisel(sade(t,60))}
function metni(el){if(!el||gizliMi(el)||K.m)return"";var t="",tn=el.tagName;try{t=el.getAttribute("aria-label")||el.getAttribute("title")||(tn==="IMG"?el.getAttribute("alt"):"")||""}catch(e){}
if(!t){if(tn==="INPUT"||tn==="SELECT"||tn==="TEXTAREA")return alanAdi(el);t=el.innerText||el.textContent||""}return kisisel(sade(t,80))}
function hedef(el){try{return el.closest('a,button,[role=button],[role=link],[role=tab],[role=menuitem],[role=checkbox],[role=switch],summary,label,input,select,textarea,[onclick]')||el.closest("img,svg")||el}catch(e){return el}}
function etiket(el){var t=String(el.tagName||"").toLowerCase();if(t==="path"||t==="use"||t==="g"||t==="circle"||t==="rect")return"svg";return t.slice(0,12)}
function yol(){var y=location.pathname,k=K.k||"";if(k&&y.indexOf(k)===0)y=y.slice(k.length);y=y.replace(/^\/+/,"");return y||"index.html"}
function ozel(t,p){if(durdu)return;try{R.record.addCustomEvent(t,p)}catch(e){if(bekleyen.length<200)bekleyen.push([t,p])}}
function bekleyenler(){if(!bekleyen.length)return;var b=bekleyen;bekleyen=[];for(var i=0;i<b.length;i++)ozel(b[i][0],b[i][1])}
var TUM={color:true,date:true,"datetime-local":true,email:true,month:true,number:true,range:true,search:true,tel:true,text:true,time:true,url:true,week:true,textarea:true,select:true,password:true};
try{dur=R.record({
emit:function(e){if(!durdu)kuyruk.push(e)},
maskAllInputs:true,maskInputOptions:TUM,
maskInputFn:function(t,el){return gizliMi(el)?"":String(t==null?"":t).replace(/[\s\S]/g,"*")},
maskTextSelector:"*",maskTextFn:function(t){return gizle(t)},
blockSelector:GIZLI,
slimDOMOptions:{script:true,comment:true,headFavicon:true,headWhitespace:true,headMetaSocial:true,headMetaRobots:true,headMetaHttpEquiv:true,headMetaAuthorship:true,headMetaVerification:true,headMetaDescKeywords:true},
sampling:{mousemove:50,scroll:150,media:800,input:"last"},
recordCanvas:false,collectFonts:false,inlineImages:false,recordAfter:"DOMContentLoaded",
errorHandler:function(){return true}})}catch(e){return}
if(!dur)return;
/* Kayıt DOMContentLoaded'da başlar; o ana kadar eklenen özel olaylar hemen ardından yazılır. */
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",function(){setTimeout(bekleyenler,0)});
var ref="";try{if(document.referrer){var ru=new URL(document.referrer);if(ru.hostname!==location.hostname)ref=ru.hostname.replace(/^www\./,"")}}catch(e){}
/* Sayfa: yüklemede ve tek sayfalık uygulamalarda adres değişince (pushState, replaceState, popstate, hashchange). */
function tamYol(){var h=location.hash||"";return yol()+(h.length>1&&h.length<60&&h.indexOf("#vayra-")!==0?h:"")}
var sonYol=tamYol();
function sayfaOlayi(r){ozel("vayra-sayfa",{y:sonYol,b:K.m?"":kisisel(sade(document.title,120)),r:r||"",en:innerWidth,boy:innerHeight})}
function adresDegisti(){var y=tamYol();if(y===sonYol)return;sonYol=y;sayfaOlayi("")}
["pushState","replaceState"].forEach(function(a){var o=history[a];if(typeof o!=="function")return;history[a]=function(){var s=o.apply(this,arguments);try{setTimeout(adresDegisti,0)}catch(e){}return s}});
addEventListener("popstate",adresDegisti);addEventListener("hashchange",adresDegisti);
sayfaOlayi(ref);
K.h=function(p){p.m=kisisel(sade(p.m,300));ozel("vayra-hata",p)};
var q=K.q||[];K.q=[];for(var qi=0;qi<q.length;qi++)K.h(q[qi]);
/* Tık, öfkeli tık (aynı yere 1 sn içinde 3 ve daha çok), sonuçsuz tık (tıklanabilir görünen öğede 1,2 sn tepki yok). */
var degisim=0,tepki=0,gidiyor=false,son=[],ofT=null,ofN=0,ofB=null;
try{new MutationObserver(function(){degisim++}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,characterData:true})}catch(e){}
["submit","hashchange","popstate","input","change"].forEach(function(t){addEventListener(t,function(){tepki++},true)});
addEventListener("scroll",function(){tepki++},true);
addEventListener("beforeunload",function(){gidiyor=true});addEventListener("pagehide",function(){gidiyor=true});
function oluDenetle(el,b){try{
if(el.closest("input,select,textarea,option,label,video,audio,[contenteditable]"))return;
var a=el.closest("a[href]");if(a){var hr=a.getAttribute("href")||"";if(hr&&hr.charAt(0)!=="#"&&hr.indexOf("javascript:")!==0)return}
var ilgi=el.closest('a,button,[role=button],[role=link],[role=tab],[role=menuitem],summary,[onclick],img,svg');
if(!ilgi){var c=getComputedStyle(el).cursor;if(c!=="pointer")return}
var d0=degisim,t0=tepki,u0=location.href;
setTimeout(function(){if(gidiyor||document.visibilityState==="hidden")return;var sec="";try{sec=String(getSelection())}catch(e){}
if(degisim===d0&&tepki===t0&&location.href===u0&&!sec)ozel("vayra-olu",b)},1200)}catch(e){}}
document.addEventListener("click",function(ev){if(!ev.isTrusted)return;var el=ev.target;if(el&&el.nodeType!==1)el=el.parentElement;if(!el)return;
var h=hedef(el),b={e:etiket(h),m:metni(h),x:Math.round(ev.clientX),y:Math.round(ev.clientY)};ozel("vayra-tik",b);
var t=Date.now(),yeni=[];for(var i=0;i<son.length;i++){var s=son[i];if(t-s.t<1000&&Math.abs(s.x-ev.clientX)<30&&Math.abs(s.y-ev.clientY)<30)yeni.push(s)}yeni.push({t:t,x:ev.clientX,y:ev.clientY});son=yeni;
if(son.length>=3){ofN=son.length;ofB=b;clearTimeout(ofT);ofT=setTimeout(function(){ozel("vayra-ofkeli",{n:ofN,e:ofB.e,m:ofB.m,x:ofB.x,y:ofB.y});son=[]},1000)}
oluDenetle(el,b)},true);
/* Form alanı: odak süresi ve doldurulup doldurulmadığı (değer hiçbir zaman gönderilmez). */
var odak=null;
document.addEventListener("focusin",function(e){var el=e.target;if(el&&el.matches&&el.matches("input,textarea,select")&&el.type!=="hidden"&&el.type!=="submit"&&el.type!=="button")odak={el:el,t:Date.now()}},true);
document.addEventListener("focusout",function(e){if(!odak||odak.el!==e.target)return;var el=odak.el,ms=Date.now()-odak.t;odak=null;if(ms<300)return;
ozel("vayra-alan",{a:alanAdi(el),t:String(el.type||el.tagName||"").toLowerCase().slice(0,16),ms:ms,d:!!(el.value&&String(el.value).length)})},true);
/* Kaydırma derinliği: yüzde 25, 50, 75 ve 100 eşikleri. */
var derin=0,kT=null;
function kaydir(){kT=null;var h=Math.max(document.documentElement.scrollHeight,document.body?document.body.scrollHeight:0);if(!h)return;var p=Math.min(100,Math.round((scrollY+innerHeight)/h*100)),e=p>=98?100:p>=75?75:p>=50?50:p>=25?25:0;if(e>derin&&h>innerHeight*1.2){derin=e;ozel("vayra-kaydirma",{p:e})}}
addEventListener("scroll",function(){if(!kT)kT=setTimeout(kaydir,400)},{passive:true});
/* Gönderim: her paket sunucu onaylayana kadar "yolda" tutulur (20 sn yanıtsız kalırsa yeniden gider). Sayfa kapanırken
   kuyruk 58 KB paketlere bölünür, yoldakilerle birlikte sendBeacon ile gönderilir ve ayrıca sekme belleğine yazılır;
   sonraki sayfa onları yeniden yollar. Sunucu aynı sayfa yüklemesi ve sıra numarasını bir kez yazar. */
var YOL="vayra-kayit-yolda",yolda={};
function tazele(){try{var v=JSON.parse(sessionStorage.getItem("vayra-kayit")||"null");if(v&&v.o===O){v.s=Date.now();sessionStorage.setItem("vayra-kayit",JSON.stringify(v))}}catch(e){}}
function paketle(e){sira++;var s=JSON.stringify({o:O,p:P,s:sira,e:e});toplam+=s.length;yolda[sira]={g:s,z:0,d:0};return sira}
function durdur(){if(durdu)return;durdu=true;try{dur&&dur()}catch(e){}clearInterval(zaman);kuyruk=[];yolda={}}
function yolla(no){var y=yolda[no];if(!y||durdu)return;y.z=Date.now();y.d++;
try{F.call(window,A,{method:"POST",body:y.g,headers:{"Content-Type":"text/plain"}}).then(function(r){if(r.ok||r.status===400||r.status===413)delete yolda[no];return r.json().catch(function(){return null})}).then(function(j){if(j&&j.dur)durdur()},function(){})}catch(x){}}
function bol(e){var b=[],n=0;for(var i=0;i<e.length;i++){var u=0;try{u=JSON.stringify(e[i]).length}catch(x){}if(b.length&&n+u>58000){paketle(b);b=[];n=0}b.push(e[i]);n+=u}if(b.length)paketle(b)}
function gonder(){bekleyenler();if(durdu)return;
for(var k in yolda){var y=yolda[k];if(y.z&&Date.now()-y.z>20000&&y.d<4)yolla(k)}
if(!kuyruk.length)return;var e=kuyruk;kuyruk=[];tazele();var no=paketle(e);yolla(no);if(toplam>SINIR)durdur()}
function kapanis(){bekleyenler();if(durdu)return;tazele();if(kuyruk.length){var e=kuyruk;kuyruk=[];bol(e)}
var l=[];for(var k in yolda)l.push(yolda[k].g);if(!l.length)return;
try{var sakla=[],t=0;for(var i=l.length-1;i>=0&&t+l[i].length<2000000;i--){sakla.unshift(l[i]);t+=l[i].length}sessionStorage.setItem(YOL,JSON.stringify({o:O,l:sakla}))}catch(x){}
for(var j=0;j<l.length;j++){var ok=false;try{ok=l[j].length<64000&&!!(navigator.sendBeacon&&navigator.sendBeacon(A,new Blob([l[j]],{type:"text/plain"})))}catch(x){}if(!ok)break}}
/* Önceki sayfadan kalan, onaylanmamış paketler */
try{var eski=JSON.parse(sessionStorage.getItem(YOL)||"null");sessionStorage.removeItem(YOL);if(eski&&eski.o===O&&eski.l)for(var ei=0;ei<eski.l.length&&ei<60;ei++){yolda["e"+ei]={g:eski.l[ei],z:0,d:0};yolla("e"+ei)}}catch(x){}
zaman=setInterval(gonder,5000);
setTimeout(gonder,1500);
addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")gonder()});
addEventListener("pagehide",kapanis);
K.durdur=function(){gonder();durdur()};
})(this&&this.rrweb);`;
