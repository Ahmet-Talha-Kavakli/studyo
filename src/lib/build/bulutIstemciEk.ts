/**
 * Site istemcisine (kopru.ts veriBetigi) eklenen Bulut parçaları; aynı IIFE içinde çalışır ve oradaki istek, k, V, F,
 * T, O, CB değişkenlerini kullanır. Düz ES5.
 *
 * vayra.oda(ad, { kim }): paylaşılan durum ve sıralı olaylar (Bulut > Odalar).
 *   const oda = vayra.oda("masa-1", { kim: { ad: "Ayşe" } });
 *   await oda.hazir();                       // ilk durum
 *   oda.degisince((durum, olay) => ciz(durum)); // her değişiklikte, sıra numarasıyla aynı sırada
 *   oda.ayarla("tahta.3", "X"); oda.artir("skor.ayse", 10); oda.ekle("mesajlar", { metin }, 100);
 *   oda.birlestir({ sira: "ali" }); oda.sil("tahta.3"); oda.olay("hamle", { x, y }); oda.dinle("hamle", (veri, bilgi) => …);
 *   oda.toplu([{ t: "ayarla", y: "a", d: 1 }, { t: "artir", y: "n" }], { seq: oda.surum() }); // koşullu, birlikte
 *   oda.kimler((liste) => …); oda.ayril();
 * vayra.dosya.yukle(kova, dosya, { klasor, ilerleme }): 8 MB üstü dosyalar kendiliğinden parçalı ve kaldığı yerden
 * sürdürülebilir yüklenir. vayra.dosya.yukleParcali(kova, dosya, { klasor, ilerleme, sinyal }) doğrudan da çağrılır.
 * vayra.dosya.adres(kova, "klasor/ad.png", { w }) klasörlü adres verir.
 */
export const bulutIstemciEk = `
function OY(y){return String(y==null?"":y).split(".").filter(function(x){return x!==""})}
function OKp(D,y,ol){var x=D;for(var i=0;i<y.length-1;i++){var p=y[i];if(x[p]==null||typeof x[p]!=="object"){if(!ol)return null;x[p]=/^\\d+$/.test(y[i+1])?[]:{}}x=x[p]}return{u:x,s:y[y.length-1]}}
function OJ(v){return v===undefined?null:JSON.parse(JSON.stringify(v))}
function OU(D,l){for(var i=0;i<l.length;i++){var o=l[i],t=o.t,c,h,a;if(t==="olay")continue;if(t==="sifirla"){D=o.d?OJ(o.d):{};continue}
if(t==="birlestir"){h=D;if(o.y){c=OKp(D,OY(o.y),true);if(!c.u[c.s]||typeof c.u[c.s]!=="object")c.u[c.s]={};h=c.u[c.s]}for(a in o.d){if(o.d[a]===null)delete h[a];else h[a]=OJ(o.d[a])}continue}
var y=OY(o.y);if(!y.length){if(t==="ayarla"&&o.d&&typeof o.d==="object")D=OJ(o.d);continue}
c=OKp(D,y,t!=="sil");if(!c)continue;var u=c.u,s=c.s;
if(t==="ayarla")u[s]=OJ(o.d);else if(t==="sil"){if(Object.prototype.toString.call(u)==="[object Array]"&&/^\\d+$/.test(s))u.splice(Number(s),1);else delete u[s]}
else if(t==="artir")u[s]=(typeof u[s]==="number"?u[s]:0)+Number(o.n==null?1:o.n);
else if(t==="ekle"){if(Object.prototype.toString.call(u[s])!=="[object Array]")u[s]=[];u[s].push(OJ(o.d));var mx=Math.min(500,Math.max(1,Math.round(Number(o.s)||500)));if(u[s].length>mx)u[s].splice(0,u[s].length-mx)}}return D}
var ODL={};
window.vayra.oda=function(ad,s){s=s||{};ad=String(ad);if(ODL[ad])return ODL[ad];
var kn=ad.indexOf("uyeler:")===0?"uyeler:oda:"+ad.slice(7):"oda:"+ad;var c=window.vayra.kanal(kn,{kim:s.kim||{}});
var st={D:null,Q:0,L:[],E:[],B:[],cb:null,yk:null};
function bil(o){var D=st.D;st.L.slice().forEach(function(f){try{f(D,o)}catch(e){}});if(o)o.islemler.forEach(function(i){if(i.t==="olay")st.E.slice().forEach(function(x){if(x.o==="*"||x.o===i.o)try{x.f(i.d,{olay:i.o,seq:o.seq,kim:o.kim,uyeId:o.uyeId,ben:o.kim===CB,z:o.z})}catch(e){}})})}
function isle(o){if(!o)return;if(o.silindi){st.D={};st.Q=0;bil(null);return}if(st.yk){st.B.push(o);return}if(o.seq<=st.Q)return;if(o.seq!==st.Q+1){es();st.B.push(o);return}st.Q=o.seq;st.D=OU(st.D||{},o.islemler);bil(o)}
function es(){if(st.yk)return st.yk;st.yk=istek("/$oda/"+k(ad)+(st.D!==null?"?sonra="+st.Q:"")).then(function(j){st.yk=null;if(j.tam){st.D=j.durum||{};st.Q=j.seq||0;bil(null)}else (j.olaylar||[]).forEach(isle);var b=st.B;st.B=[];b.forEach(isle);return st.D},function(e){st.yk=null;throw e});return st.yk}
c.dinle("$oda",function(v){isle(v)});
c.kimler(function(){if(st.cb!==CB){var ilk=st.cb===null;st.cb=CB;if(!ilk&&st.D!==null)es().catch(function(){})}});
es().catch(function(e){try{console.warn("Vayra oda: "+e.message)}catch(x){}});
var A={hazir:function(){return st.D!==null&&!st.yk?Promise.resolve(st.D):es()},durum:function(){return st.D},surum:function(){return st.Q},ben:function(){return CB},
toplu:function(l,kosul){return istek("/$oda/"+k(ad),{method:"POST",body:{islemler:l,kosul:kosul,ben:CB}}).then(function(j){isle(j.olay);return st.D},function(e){es().catch(function(){});throw e})},
ayarla:function(y,d,ks){return A.toplu([{t:"ayarla",y:String(y),d:d}],ks)},sil:function(y,ks){return A.toplu([{t:"sil",y:String(y)}],ks)},
artir:function(y,n,ks){return A.toplu([{t:"artir",y:String(y),n:n==null?1:n}],ks)},ekle:function(y,d,sn){return A.toplu([{t:"ekle",y:String(y),d:d,s:sn}])},
birlestir:function(n,y){return A.toplu([{t:"birlestir",y:y,d:n||{}}])},olay:function(o,d){return A.toplu([{t:"olay",o:String(o),d:d}])},sifirla:function(d){return A.toplu([{t:"sifirla",d:d||{}}])},
degisince:function(f){st.L.push(f);if(st.D!==null)try{f(st.D,null)}catch(e){}return function(){st.L=st.L.filter(function(x){return x!==f})}},
dinle:function(o,f){if(typeof o==="function"){f=o;o="*"}var x={o:String(o),f:f};st.E.push(x);return function(){st.E=st.E.filter(function(y){return y!==x})}},
kimler:function(f){return c.kimler(f)},ayril:function(){c.ayril();delete ODL[ad]}};
ODL[ad]=A;return A};
(function(){var D0=window.vayra.dosya;if(!D0)return;var P=5*1024*1024;
function yk(y){return String(y).split("/").map(k).join("/")}
function hd(j){var h={};if(j)h["Content-Type"]="application/json";if(O)h["x-vayra-oturum"]=O;if(T)h["x-vayra-onizleme"]=T;return h}
function js(r){return r.json().catch(function(){return{}}).then(function(j){if(!r.ok||j.ok===false){var e=new Error(j.hata||("Yükleme başarısız ("+r.status+")"));e.durum=r.status;throw e}return j})}
function bekle(ms){return new Promise(function(c){setTimeout(c,ms)})}
D0.yukleParcali=function(kova,dosya,s){s=s||{};var U=F+"/"+k(kova),an="vayra-parca:"+kova+":"+(s.klasor||"")+":"+dosya.name+":"+dosya.size+":"+(dosya.lastModified||0),ot=null;try{ot=localStorage.getItem(an)}catch(e){}
function dur(){if(s.sinyal&&s.sinyal.aborted){var e=new Error("Yükleme durduruldu; aynı dosyayla yeniden çağırınca kaldığı yerden sürer.");e.durduruldu=true;throw e}}
function bas(){if(ot)return fetch(U+"?parca="+k(ot),{headers:hd()}).then(js).then(function(j){return j.alinan},function(){ot=null;try{localStorage.removeItem(an)}catch(e){}return bas()});
return fetch(U+"?parca=baslat",{method:"POST",headers:hd(true),body:JSON.stringify({ad:dosya.name,boyut:dosya.size,klasor:s.klasor||""})}).then(js).then(function(j){ot=j.oturum;try{localStorage.setItem(an,ot)}catch(e){}return 0})}
function gon(o,den){dur();if(s.ilerleme)try{s.ilerleme(Math.min(1,o/Math.max(1,dosya.size)))}catch(e){}if(o>=dosya.size)return bit();
return fetch(U+"?parca="+k(ot)+"&ofset="+o,{method:"PUT",headers:hd(),body:dosya.slice(o,o+P)}).then(js).then(function(j){return gon(j.alinan,0)},function(e){if(e.durum&&e.durum<500&&e.durum!==409)throw e;if(den>=4)throw e;return bekle(800*Math.pow(2,den)).then(function(){return fetch(U+"?parca="+k(ot),{headers:hd()}).then(js)}).then(function(j){return gon(j.alinan,den+1)},function(){return gon(o,den+1)})})}
function bit(){return fetch(U+"?parca="+k(ot)+"&bitir=1",{method:"POST",headers:hd(true),body:"{}"}).then(js).then(function(j){try{localStorage.removeItem(an)}catch(e){}return{ad:j.dosya.ad,adres:j.adres,boyut:j.dosya.boyut}})}
return Promise.resolve().then(bas).then(function(o){return gon(o,0)})};
D0.yukle=function(kova,dosya,s){s=s||{};if(dosya&&dosya.size>8*1024*1024)return D0.yukleParcali(kova,dosya,s);var fd=new FormData();fd.append("dosya",dosya);if(s.klasor)fd.append("klasor",String(s.klasor));
return fetch(F+"/"+k(kova),{method:"POST",headers:hd(),body:fd}).then(js).then(function(j){if(s.ilerleme)try{s.ilerleme(1)}catch(e){}return{ad:j.dosya.ad,adres:j.adres,boyut:j.dosya.boyut}})};
D0.adres=function(kova,ad,s){var u=F+"/"+k(kova)+"/"+yk(ad),q=[];s=s||{};["w","h","fit","fm","q"].forEach(function(a){if(s[a]!=null)q.push(a+"="+k(s[a]))});return q.length?u+"?"+q.join("&"):u}})();
`;
