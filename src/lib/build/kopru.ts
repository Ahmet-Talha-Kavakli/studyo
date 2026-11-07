/**
 * Önizleme ve yayın sayfalarına eklenen betikler.
 * Sayfalar kum havuzunda (opak köken) çalışır: Vayra çerezlerine ve depolamasına erişemez. Bu yüzden:
 *  - depolamaDolgusu: localStorage/sessionStorage yoksa window.name'e yazan dolgu (aynı sekmede yenilemeden sağ çıkar).
 *  - calismaBetigi: data-vayra-form formlarını gelen kutusuna gönderir (Vayra Build formları kodsuz çalışır).
 *  - onizlemeKoprusu (yalnız önizleme): hata/günlük iletimi, öğe seçme, metin düzenleme, canlı stil, sayfa bildirimi.
 * Hepsi düz ES5; şablon dizgesi kullanılmaz (sunucu bunları dizgeye gömer).
 */
import { deneyBetigi } from "./buyumeDeneyCanli";
import { bulutIstemciEk } from "./bulutIstemciEk";
import { tasarimKoprusu } from "./tasarimKopru";
import { temaKoprusu } from "./onizlemeTema";

export const depolamaDolgusu = `<script>(function(){function ok(n){try{var s=window[n];var k="__v";s.setItem(k,"1");s.removeItem(k);return true}catch(e){return false}}
function yap(on){var d={};try{var h=JSON.parse(window.name||"{}");d=(h&&h[on])||{}}catch(e){}
function yaz(){try{var h={};try{h=JSON.parse(window.name||"{}")||{}}catch(e){}h[on]=d;window.name=JSON.stringify(h)}catch(e){}}
return{getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},setItem:function(k,v){d[k]=String(v);yaz()},removeItem:function(k){delete d[k];yaz()},clear:function(){d={};yaz()},key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}}
if(!ok("localStorage")){try{Object.defineProperty(window,"localStorage",{value:yap("l"),configurable:true})}catch(e){}}
if(!ok("sessionStorage")){try{Object.defineProperty(window,"sessionStorage",{value:yap("s"),configurable:true})}catch(e){}}})();</script>`;

/**
 * Vayra Veri istemcisi: window.vayra.veri.liste / ekle / guncelle / sil (Promise döner). Üyelik: vayra.uye.kayit / giris /
 * cikis / ben / degisince / google(donus) / baglantiGonder(eposta, donus) / sifremiUnuttum(eposta) / girisHatasi() / hesabiSil(); Google ve e-posta bağlantısı
 * dönüşünde oturum adresin #vayra-oturum parçasıyla gelir, burada saklanıp adresten silinir. Önizlemede belirteç gönderilir,
 * böylece sahip her kuralı aşabilir; yayında ziyaretçi koleksiyon kurallarına tabidir.
 * Ödeme (Vayra Ödeme): vayra.odeme.baslat({ urunler: [{ id, adet }], alici: { ad, soyad, eposta, telefon, adres, sehir, ulke, bolge, postaKodu },
 * basariSayfasi, hataSayfasi, saglayici? }) ödeme sayfası adresini döndürür (fiyat sunucuda ürün tablosundan hesaplanır);
 * vayra.odeme.ode(...) aynısını yapıp sayfayı açar (önizlemede yeni sekmede); vayra.odeme.durum(siparisNo) siparişin
 * durumunu verir; vayra.odeme.siparis() dönüş sayfasında adresteki sipariş numarasını okur.
 */
export const veriBetigi = (veriAdresi: string, belirtec: string | null, uyeAdresi: string, kok = "") => `<script>(function(){var V=${JSON.stringify(veriAdresi)},T=${JSON.stringify(belirtec)},U=${JSON.stringify(uyeAdresi)},K=${JSON.stringify(kok)},O=null,D=[],H=null;try{O=localStorage.getItem("vayra-oturum")}catch(e){}
try{var hs=location.hash||"",mo=/[#&]vayra-oturum=([A-Za-z0-9_-]{20,64})/.exec(hs),mh=/[#&]vayra-hata=([^&]*)/.exec(hs);if(mo){O=mo[1];try{localStorage.setItem("vayra-oturum",O)}catch(e){}}if(mh)H=decodeURIComponent(mh[1]);if(mo||mh||/[#&]vayra-dogrulandi=1/.test(hs)){try{history.replaceState(null,"",location.pathname+location.search)}catch(e){try{location.hash=""}catch(x){}}}}catch(e){}
var M=null;try{var mm=/[#&]vayra-ikiadim=([A-Za-z0-9_-]{20,64})/.exec(location.hash||"");if(mm){M=mm[1];try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}}}catch(e){}
function istek(y,o){o=o||{};var h={"Content-Type":"application/json"};if(T)h["x-vayra-onizleme"]=T;if(O)h["x-vayra-oturum"]=O;return fetch(V+y,{method:o.method||"GET",headers:h,body:o.body?JSON.stringify(o.body):undefined}).then(function(r){return r.json().catch(function(){return{}}).then(function(j){if(!r.ok||j.ok===false)throw new Error(j.hata||("Veri isteği başarısız ("+r.status+")"));return j})})}
function k(a){return encodeURIComponent(String(a))}
window.vayra=window.vayra||{};
window.vayra.veri={
liste:function(kol,s){s=s||{};var q=[];for(var a in s){if(s[a]!=null)q.push(k(a)+"="+k(typeof s[a]==="object"?JSON.stringify(s[a]):s[a]))}return istek("/"+k(kol)+(q.length?"?"+q.join("&"):"")).then(function(j){return j.kayitlar||[]})},
ekle:function(kol,kayit){return istek("/"+k(kol),{method:"POST",body:{kayit:kayit}}).then(function(j){return j.kayit})},
guncelle:function(kol,id,alanlar){return istek("/"+k(kol)+"/"+k(id),{method:"PATCH",body:{alanlar:alanlar}}).then(function(j){return j.kayit})},
sil:function(kol,id){return istek("/"+k(kol)+"/"+k(id),{method:"DELETE"}).then(function(){return true})},
ara:function(kol,metin,s){s=s||{};var x={},a;for(a in s)if(a!=="alanlar")x[a]=s[a];x.bul=String(metin||"");if(s.alanlar)x.alanlar=[].concat(s.alanlar).join(",");return window.vayra.veri.liste(kol,x)},
dinle:function(kol,f,s){s=s||{};var id="d"+(++CI);CA[id]={t:String(kol),f:f,s:s.suzgec};cKur();return function(){delete CA[id];cKur()}},
izle:function(kol,s,f){if(typeof s==="function"){f=s;s={}}s=s||{};var son=0,zz=null,bitti=false;function cek(){var n=++son;window.vayra.veri.liste(kol,s).then(function(l){if(n===son&&!bitti)f(l)},function(e){try{console.warn(e.message)}catch(x){}})}cek();var kap=window.vayra.veri.dinle(kol,function(){if(zz)clearTimeout(zz);zz=setTimeout(cek,120)},{suzgec:s.suzgec});return function(){bitti=true;kap()}}};
var CS=null,CA={},CK={},CI=0,CZ=null,CB=null;
function cKur(){if(CZ)clearTimeout(CZ);CZ=setTimeout(cAc,30)}
function cAc(){CZ=null;if(CS){try{CS.close()}catch(e){}CS=null}var a=[],kn=[],i;for(i in CA)a.push({i:i,t:CA[i].t,s:CA[i].s});for(i in CK)kn.push({ad:i,kim:CK[i].kim});if((!a.length&&!kn.length)||typeof EventSource==="undefined")return;
var u=V+"/$canli?a="+k(JSON.stringify(a))+"&k="+k(JSON.stringify(kn));if(T)u+="&onizleme="+k(T);if(O)u+="&oturum="+k(O);var s=new EventSource(u);CS=s;
s.addEventListener("hazir",function(e){try{var j=JSON.parse(e.data);CB=j.id;(j.uyarilar||[]).forEach(function(x){console.warn("Vayra canlı: "+x)})}catch(x){}});
s.addEventListener("degisiklik",function(e){try{var j=JSON.parse(e.data);(j.i||[]).forEach(function(id){var x=CA[id];if(x)try{x.f({olay:j.olay,kayit:j.kayit,tablo:j.tablo,adet:j.adet})}catch(y){}})}catch(x){}});
s.addEventListener("mesaj",function(e){try{var j=JSON.parse(e.data),c=CK[j.kanal];if(c)c.d.forEach(function(d){if(d.o==="*"||d.o===j.olay)try{d.f(j.veri,j.olay)}catch(y){}})}catch(x){}});
s.addEventListener("varlik",function(e){try{var j=JSON.parse(e.data),c=CK[j.kanal];if(c){c.l=j.kimler;c.v.forEach(function(f){try{f(j.kimler)}catch(y){}})}}catch(x){}})}
window.vayra.kanal=function(ad,s){s=s||{};ad=String(ad);var c=CK[ad];if(!c){c=CK[ad]={kim:s.kim||{},d:[],v:[],l:[]};cKur()}else if(s.kim){c.kim=s.kim;cKur()}
return{gonder:function(olay,veri){return istek("/$canli",{method:"POST",body:{kanal:ad,olay:String(olay||"mesaj"),veri:veri,ben:CB}}).then(function(j){return j.alici})},
dinle:function(olay,f){if(typeof olay==="function"){f=olay;olay="*"}var x={o:olay,f:f};c.d.push(x);return function(){c.d=c.d.filter(function(y){return y!==x})}},
kimler:function(f){c.v.push(f);if(c.l.length)try{f(c.l)}catch(e){}return function(){c.v=c.v.filter(function(y){return y!==f})}},
ayril:function(){delete CK[ad];cKur()}}};
function uIstek(y,g,m){var h={"Content-Type":"application/json"};if(O)h["x-vayra-oturum"]=O;return fetch(U+"/"+y,{method:m||"POST",headers:h,body:m==="GET"?undefined:JSON.stringify(g||{})}).then(function(r){return r.json().catch(function(){return{}}).then(function(j){if(!r.ok||j.ok===false)throw new Error(j.hata||("Üyelik isteği başarısız ("+r.status+")"));return j})})}
function haber(u){D.forEach(function(f){try{f(u)}catch(e){}});if(CS)cKur()}
function sakla(j){if(j.mfa&&!j.oturum){M=j.mfa;var x=new Error("İki adımlı doğrulama kodu gerekli.");x.ikiAdim=true;throw x}O=j.oturum;try{localStorage.setItem("vayra-oturum",O)}catch(e){}haber(j.uye);return j.uye}
window.vayra.uye={kayit:function(eposta,sifre,ad){return uIstek("kayit",{eposta:eposta,sifre:sifre,ad:ad}).then(sakla)},giris:function(eposta,sifre){return uIstek("giris",{eposta:eposta,sifre:sifre}).then(sakla)},
cikis:function(){var o=O;O=null;try{localStorage.removeItem("vayra-oturum")}catch(e){}haber(null);return o?fetch(U+"/cikis",{method:"POST",headers:{"x-vayra-oturum":o}}).then(function(){return true},function(){return true}):Promise.resolve(true)},
ben:function(){if(!O)return Promise.resolve(null);return uIstek("ben",null,"GET").then(function(j){if(!j.uye){O=null;try{localStorage.removeItem("vayra-oturum")}catch(e){}}return j.uye||null})},
degisince:function(f){D.push(f);return function(){D=D.filter(function(x){return x!==f})}},
google:function(donus){location.href=U+"/google/basla?donus="+k(donus||location.href.split("#")[0])},
baglantiGonder:function(eposta,donus){return uIstek("baglanti",{eposta:eposta,donus:donus||location.href.split("#")[0]}).then(function(){return true})},
sifremiUnuttum:function(eposta){return uIstek("sifremiUnuttum",{eposta:eposta}).then(function(){return true})},
girisHatasi:function(){return H},
hesabiSil:function(){return uIstek("hesabiSil",{}).then(function(j){O=null;try{localStorage.removeItem("vayra-oturum")}catch(e){}haber(null);return{silinenKayit:j.silinenKayit||0}})}};
(function(Y){function od(s){return function(donus){location.href=U+"/oauth/"+s+"/basla?donus="+k(donus||location.href.split("#")[0])}}Y.github=od("github");Y.microsoft=od("microsoft");Y.apple=od("apple");Y.oauth=function(s,donus){return od(s)(donus)};
Y.ikiAdimBekliyor=function(){return!!M};Y.ikiAdimDogrula=function(kod){if(!M)return Promise.reject(new Error("Bekleyen bir giriş yok; önce giriş yap."));return uIstek("ikiAdimGiris",{mfa:M,kod:String(kod||"")}).then(function(j){M=null;return sakla(j)})};
Y.ikiAdim={kur:function(){return uIstek("ikiAdimKur",{}).then(function(j){return{gizli:j.gizli,uri:j.uri,qr:j.qr}})},onayla:function(kod){return uIstek("ikiAdimOnayla",{kod:String(kod||"")}).then(function(j){return j.kurtarmaKodlari})},kapat:function(kod){return uIstek("ikiAdimKapat",{kod:String(kod||"")}).then(function(){return true})}};
Y.smsGonder=function(tel){return uIstek("kodGonder",{kanal:"sms",hedef:tel}).then(function(j){return{deneme:!!j.deneme}})};Y.smsGiris=function(tel,kod){return uIstek("kodGiris",{kanal:"sms",hedef:tel,kod:kod}).then(sakla)};
Y.epostaKodGonder=function(e){return uIstek("kodGonder",{kanal:"eposta",hedef:e}).then(function(){return true})};Y.epostaKodGiris=function(e,kod){return uIstek("kodGiris",{kanal:"eposta",hedef:e,kod:kod}).then(sakla)};
Y.anonim=function(){return uIstek("anonim",{}).then(sakla)}})(window.vayra.uye);
var F=V.replace("/api/build/veri/","/api/build/depolama/");
window.vayra.dosya={yukle:function(kova,dosya){var fd=new FormData();fd.append("dosya",dosya);var h={};if(O)h["x-vayra-oturum"]=O;return fetch(F+"/"+k(kova),{method:"POST",headers:h,body:fd}).then(function(r){return r.json().catch(function(){return{}}).then(function(j){if(!r.ok||j.ok===false)throw new Error(j.hata||("Yükleme başarısız ("+r.status+")"));return{ad:j.dosya.ad,adres:j.adres,boyut:j.dosya.boyut}})})},
adres:function(kova,ad,s){var u=F+"/"+k(kova)+"/"+k(ad),q=[];s=s||{};["w","h","fit","fm","q"].forEach(function(a){if(s[a]!=null)q.push(a+"="+k(s[a]))});return q.length?u+"?"+q.join("&"):u}};
var AI=V.replace("/api/build/veri/","/api/build/ai/");
function aIstek(y,g){var h={"Content-Type":"application/json"};if(T)h["x-vayra-onizleme"]=T;return fetch(AI+"/"+y,{method:"POST",headers:h,body:JSON.stringify(g)}).then(function(r){return r.json().catch(function(){return{}}).then(function(j){if(!r.ok||j.ok===false)throw new Error(j.hata||("Yapay zekâ isteği başarısız ("+r.status+")"));return j})})}
window.vayra.ai={sohbet:function(girdi,s){s=s||{};var g=typeof girdi==="string"?{metin:girdi}:{mesajlar:girdi};if(s.sistem)g.sistem=s.sistem;if(s.enCok)g.enCok=s.enCok;return aIstek("sohbet",g).then(function(j){return j.metin})},gorsel:function(istem,s){s=s||{};return aIstek("gorsel",{istem:istem,oran:s.oran||"1:1"}).then(function(j){return j.url})}};
var OD=V.replace("/api/build/veri/","/api/build/odeme/");
function oIstek(y,g){var h={"Content-Type":"application/json"};if(T)h["x-vayra-onizleme"]=T;if(O)h["x-vayra-oturum"]=O;return fetch(OD+"/"+y,{method:g?"POST":"GET",headers:h,body:g?JSON.stringify(g):undefined}).then(function(r){return r.json().catch(function(){return{}}).then(function(j){if(!r.ok||j.ok===false)throw new Error(j.hata||("Ödeme isteği başarısız ("+r.status+")"));return j})})}
window.vayra.odeme={baslat:function(s){s=s||{};return oIstek("baslat",{urunler:s.urunler,alici:s.alici,saglayici:s.saglayici,basariSayfasi:s.basariSayfasi,hataSayfasi:s.hataSayfasi,kok:K,sayfa:location.pathname}).then(function(j){return j.adres})},
ode:function(s){var w=null;if(window.parent!==window){try{w=window.open("about:blank","_blank")}catch(e){}}return window.vayra.odeme.baslat(s).then(function(u){if(w){try{w.location.href=u}catch(e){location.href=u}}else location.href=u;return u},function(e){if(w)try{w.close()}catch(x){}throw e})},
durum:function(no){return oIstek("durum/"+k(no)).then(function(j){return j.siparis})},
siparis:function(){var m=/[?&]siparis=(VS[A-Z0-9]{14})/.exec(location.search);return m?m[1]:null}};
var IS=V.replace("/api/build/veri/","/api/build/isletme-genel/");
function iIstek(y,g,m){var h={};if(g)h["Content-Type"]="application/json";if(T)h["x-vayra-onizleme"]=T;if(O)h["x-vayra-oturum"]=O;return fetch(IS+"/"+y,{method:m||(g?"POST":"GET"),headers:h,body:g?JSON.stringify(g):undefined}).then(function(r){return r.json().catch(function(){return{}}).then(function(j){if(!r.ok||j.ok===false)throw new Error(j.hata||("İstek başarısız ("+r.status+")"));return j})})}
function iSorgu(o){var q=[];for(var a in o)if(o[a]!==undefined&&o[a]!==null&&o[a]!=="")q.push(encodeURIComponent(a)+"="+encodeURIComponent(o[a]));return q.length?"?"+q.join("&"):""}
function iAc(p){var w=null;if(window.parent!==window){try{w=window.open("about:blank","_blank")}catch(e){}}return p.then(function(u){if(w){try{w.location.href=u}catch(e){location.href=u}}else location.href=u;return u},function(e){if(w)try{w.close()}catch(x){}throw e})}
window.vayra.isletme={istek:iIstek,adres:IS,profil:function(){return iIstek("profil").then(function(j){return j.profil})}};
window.vayra.magaza={urunler:function(s){return iIstek("magaza/urunler"+iSorgu(s||{})).then(function(j){return j.urunler})},urun:function(id,para){return iIstek("magaza/urun/"+k(id)+(para?"?para="+k(para):"")).then(function(j){return j.urun})},ayar:function(){return iIstek("magaza/ayar").then(function(j){return j.magaza})},sepet:function(s){s=s||{};return iIstek("magaza/sepet",{sepet:s.sepet,kupon:s.kupon,kargo:s.kargo,eposta:s.eposta,ulke:s.ulke,bolge:s.bolge,para:s.para,vergiKimligi:s.vergiKimligi})},
baslat:function(s){s=s||{};return iIstek("magaza/odeme",{sepet:s.sepet,kupon:s.kupon,kargo:s.kargo,alici:s.alici,fatura:s.fatura,not:s.not,para:s.para,saglayici:s.saglayici,basariSayfasi:s.basariSayfasi,hataSayfasi:s.hataSayfasi,kok:K,sayfa:location.pathname}).then(function(j){return j.adres})},
ode:function(s){return iAc(window.vayra.magaza.baslat(s))},takip:function(no,eposta){return iIstek("magaza/takip",{siparisNo:no,eposta:eposta}).then(function(j){return j.siparis})}};
window.vayra.randevu={ayarlar:function(){return iIstek("randevu").then(function(j){return j.randevu})},gunler:function(h,c){return iIstek("randevu/gunler"+iSorgu({hizmet:h,calisan:c})).then(function(j){return j.gunler})},saatler:function(h,t,c){return iIstek("randevu/saatler"+iSorgu({hizmet:h,tarih:t,calisan:c})).then(function(j){return j.saatler})},al:function(g){return iIstek("randevu",g)}};
window.vayra.blog={liste:function(s){return iIstek("blog"+iSorgu(s||{}))},yazi:function(s){return iIstek("blog/yazi/"+k(s)).then(function(j){return j.yazi})}};
window.vayra.yorum={liste:function(u){return iIstek("yorumlar"+iSorgu({urun:u}))},gonder:function(g){return iIstek("yorum",g)}};
window.vayra.abone=function(e,s){s=s||{};return iIstek("abone",{eposta:e,ad:s.ad,izin:s.izin!==false,kaynak:s.kaynak||"form",sayfa:location.pathname,izinMetni:s.izinMetni})};
try{var es=document.createElement("script");es.src=IS+"/eklenti.js"+iSorgu({k:K});es.async=true;(document.head||document.documentElement).appendChild(es)}catch(e){}
window.vayra.olay=window.vayra.olay||function(){return Promise.resolve(false)};
window.vayra.fonksiyon=function(ad,veri,s){s=s||{};var h={"Content-Type":"application/json"};if(O)h["x-vayra-oturum"]=O;var y=s.yontem||(veri===undefined?"GET":"POST");return fetch(K+"/api/"+k(ad)+(s.sorgu?"?"+new URLSearchParams(s.sorgu):""),{method:y,headers:h,body:y==="GET"?undefined:JSON.stringify(veri)}).then(function(r){return r.text().then(function(t){var j;try{j=JSON.parse(t)}catch(e){j=t}if(!r.ok)throw new Error((j&&j.hata)||("Fonksiyon hatası ("+r.status+")"));return j})})};${bulutIstemciEk}})();</script>`;

/** Yayındaki sitede yakalanmayan hataları bildirir (sayfa başına en çok 5; Bulut günlüklerine ve çalışma alanına düşer). */
export const hataBetigi = (adres: string) => `<script>(function(){var A=${JSON.stringify(adres)},n=0,g={};function b(m,k,s){try{m=String(m||"").slice(0,300);if(!m||n>=5||g[m])return;g[m]=1;n++;var v=JSON.stringify({m:m,k:String(k||"").slice(0,200),s:s||0,y:location.pathname});if(navigator.sendBeacon)navigator.sendBeacon(A,new Blob([v],{type:"application/json"}));else fetch(A,{method:"POST",headers:{"Content-Type":"application/json"},body:v,keepalive:true})}catch(e){}}
addEventListener("error",function(e){if(e&&e.message)b(e.message,e.filename,e.lineno)});addEventListener("unhandledrejection",function(e){var r=e&&e.reason;b(r&&r.message?r.message:String(r),"Promise",0)})})();</script>`;

/**
 * Çerezsiz ölçüm (yalnız yayında): sayfa görüntüleme (sayfa, yönlendiren alan adı, utm, dil, ekran genişliği), gerçek
 * kullanıcı hız ölçümü (LCP, CLS, INP; sayfa gizlenince bir kez), özel olaylar (vayra.olay(ad, veri); sayfa başına en çok
 * 50) ve şu an sitede olanlar için dakikada bir nabız (en çok 30). Kişisel veri tutulmaz.
 * Sahip GA4 ya da Meta Pixel kimliği girdiyse (Bulut > Analitik) betikler çerez onayı gelince yüklenir: İşletme çerez
 * bandının "vayra-cerez" olayı ve localStorage kaydı (analitik: GA4, pazarlama: Pixel). Kum havuzunda çerez olmadığı için
 * GA4 client_storage "none" ve oturum başına kimlikle çalışır. vayra.olay çağrıları onlara da iletilir.
 * Not: CLS düzen kaymalarının toplamı, INP en uzun etkileşim süresidir (az etkileşimli sayfalarda resmî değere eşittir).
 */
export const analitikBetigi = (adres: string, kok: string) => `<script>(function(){try{var A=${JSON.stringify(adres)},K=${JSON.stringify(kok)},y=location.pathname;if(K&&y.indexOf(K)===0)y=y.slice(K.length);y=y.replace(/^\\/+/,"")||"index.html";
function gonder(t,o){try{var s=JSON.stringify(o),u=A+(t?"?tur="+t:"");if(navigator.sendBeacon)navigator.sendBeacon(u,new Blob([s],{type:"text/plain"}));else fetch(u,{method:"POST",body:s,keepalive:true})}catch(e){}}
var q=new URLSearchParams(location.search),utm={kaynak:q.get("utm_source")||undefined,ortam:q.get("utm_medium")||undefined,kampanya:q.get("utm_campaign")||undefined};
gonder("",{sayfa:y,ref:document.referrer?new URL(document.referrer).hostname:"",dil:(navigator.language||"").slice(0,2),en:innerWidth,utm:utm});
window.vayra=window.vayra||{};var on=0;window.vayra.olay=function(ad,veri){if(!ad||on>=50)return Promise.resolve(false);on++;gonder("olay",{ad:String(ad).slice(0,60),veri:veri&&typeof veri==="object"?veri:{},sayfa:y});return Promise.resolve(true)};
var lcp=null,cls=0,inp=null,gitti=false;
try{new PerformanceObserver(function(l){var e=l.getEntries(),s=e[e.length-1];if(s)lcp=Math.round(s.renderTime||s.startTime)}).observe({type:"largest-contentful-paint",buffered:true})}catch(e){}
try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){if(!e.hadRecentInput)cls+=e.value})}).observe({type:"layout-shift",buffered:true})}catch(e){}
try{new PerformanceObserver(function(l){l.getEntries().forEach(function(e){if(e.interactionId&&(inp===null||e.duration>inp))inp=Math.round(e.duration)})}).observe({type:"event",buffered:true,durationThreshold:16})}catch(e){}
function hiz(){if(gitti)return;gitti=true;gonder("hiz",{sayfa:y,lcp:lcp,cls:Math.round(cls*1000)/1000,inp:inp,en:innerWidth})}
addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")hiz()});addEventListener("pagehide",hiz);
try{fetch(A+"?izleme=1").then(function(r){return r.json()}).then(function(z){if(!z||(!z.ga4&&!z.metaPixel))return;var gy=false,py=false;
function ga(){if(gy||!z.ga4)return;gy=true;var s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(z.ga4);document.head.appendChild(s);window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};var cid=null;try{cid=sessionStorage.getItem("vayra-ga");if(!cid){cid=String(Math.floor(Math.random()*1e9))+"."+Math.floor(Date.now()/1000);sessionStorage.setItem("vayra-ga",cid)}}catch(e){}window.gtag("js",new Date());window.gtag("config",z.ga4,{client_storage:"none",client_id:cid||undefined,page_path:"/"+y})}
function px(){if(py||!z.metaPixel)return;py=true;var f=window;if(f.fbq)return;var n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=true;n.version="2.0";n.queue=[];var s=document.createElement("script");s.async=true;s.src="https://connect.facebook.net/en_US/fbevents.js";document.head.appendChild(s);f.fbq("init",z.metaPixel);f.fbq("track","PageView")}
function karar(t){if(!t)return;if(t.analitik)ga();if(t.pazarlama)px()}
if(z.onaysiz){ga();px()}else{try{karar(JSON.parse(localStorage.getItem("vayra-cerez")||"null"))}catch(e){}addEventListener("vayra-cerez",function(e){karar(e.detail)})}
var eski=window.vayra.olay;window.vayra.olay=function(ad,veri){try{if(gy&&window.gtag)window.gtag("event",String(ad),veri||{});if(py&&window.fbq)window.fbq("trackCustom",String(ad),veri||{})}catch(e){}return eski(ad,veri)}}).catch(function(){})}catch(e){}
var nb=0;setInterval(function(){if(document.visibilityState==="visible"&&nb<30){nb++;gonder("nabiz",{sayfa:y})}},60000)}catch(e){}})();</script>`;

export const calismaBetigi = (formAdresi: string, kok: string) => `<script>(function(){var A=${JSON.stringify(formAdresi)},K=${JSON.stringify(kok)};
function sayfaAdi(){var y=location.pathname;if(K&&y.indexOf(K)===0)y=y.slice(K.length);return y.replace(/^\\/+/,"")||"index.html"}
document.addEventListener("submit",function(e){var f=e.target;if(!f||!f.getAttribute||f.getAttribute("data-vayra-form")===null)return;e.preventDefault();
var veri={};new FormData(f).forEach(function(v,k){if(typeof v==="string")veri[k]=v});
var b=f.querySelector("[type=submit]");if(b){b.disabled=true;b.setAttribute("data-eski",b.textContent);b.textContent="Gönderiliyor…"}
fetch(A,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({form:f.getAttribute("data-vayra-form")||"Form",sayfa:sayfaAdi(),alanlar:veri})})
.then(function(r){if(!r.ok)throw 0;f.reset();var m=document.createElement("p");m.setAttribute("role","status");m.style.cssText="margin:12px 0 0;padding:12px 14px;border-radius:12px;background:#ecfdf5;color:#065f46;font:500 14px system-ui";m.textContent=f.getAttribute("data-vayra-tesekkur")||"Teşekkürler, mesajın bize ulaştı.";f.appendChild(m);setTimeout(function(){m.remove()},6000)})
.catch(function(){alert("Gönderilemedi, lütfen tekrar dene.")}).finally(function(){if(b){b.disabled=false;b.textContent=b.getAttribute("data-eski")}})},true)})();</script>`;

export const onizlemeKoprusu = `<script>(function(){if(window.parent===window)return;
function gonder(m){m.vayra=1;try{parent.postMessage(m,"*")}catch(e){}}
var sayfa=location.pathname.split("/").pop()||"index.html";
gonder({tur:"sayfa",yol:sayfa,baslik:document.title});
window.addEventListener("error",function(e){gonder({tur:"hata",mesaj:String(e.message||"Hata"),kaynak:String(e.filename||"").split("/").pop(),satir:e.lineno||0})});
window.addEventListener("unhandledrejection",function(e){gonder({tur:"hata",mesaj:"İşlenmeyen hata: "+String(e.reason&&e.reason.message||e.reason),kaynak:"",satir:0})});
["log","info","warn","error"].forEach(function(t){var o=console[t];console[t]=function(){try{gonder({tur:"gunluk",seviye:t,metin:[].slice.call(arguments).map(function(x){try{return typeof x==="string"?x:JSON.stringify(x)}catch(e){return String(x)}}).join(" ").slice(0,500)})}catch(e){}return o.apply(console,arguments)}});
function secici(el){if(!el||el===document.body)return"body";var y=[];while(el&&el.nodeType===1&&el!==document.body&&el!==document.documentElement){var t=el.tagName.toLowerCase(),i=1,k=el;while((k=k.previousElementSibling))if(k.tagName===el.tagName)i++;y.unshift(t+":nth-of-type("+i+")");el=el.parentElement}return"body > "+y.join(" > ")}
var kat=null,cer=null,etk=null,mod=null;
function katman(){if(kat)return;kat=document.createElement("div");kat.style.cssText="position:fixed;inset:0;pointer-events:none;z-index:2147483646";cer=document.createElement("div");cer.style.cssText="position:fixed;border:2px solid #55d6fd;border-radius:4px;background:rgba(85,214,253,.08);transition:all .06s;display:none";etk=document.createElement("div");etk.style.cssText="position:fixed;padding:2px 7px;border-radius:6px;background:#55d6fd;color:#04212b;font:600 11px system-ui;display:none";kat.appendChild(cer);kat.appendChild(etk);document.documentElement.appendChild(kat)}
function goster(el){var r=el.getBoundingClientRect();cer.style.display="block";cer.style.left=r.left+"px";cer.style.top=r.top+"px";cer.style.width=r.width+"px";cer.style.height=r.height+"px";etk.style.display="block";etk.textContent=el.tagName.toLowerCase()+(el.className&&typeof el.className==="string"?"."+el.className.split(" ")[0]:"");etk.style.left=r.left+"px";etk.style.top=Math.max(0,r.top-20)+"px"}
function gizle(){if(cer){cer.style.display="none";etk.style.display="none"}}
function ustte(e){if(!mod)return;var el=e.target;if(!el||el===document.documentElement||(kat&&kat.contains(el)))return;goster(el)}
function stilOku(el){var s=getComputedStyle(el);return{color:s.color,backgroundColor:s.backgroundColor,fontSize:s.fontSize,fontWeight:s.fontWeight,fontFamily:s.fontFamily,textAlign:s.textAlign,padding:s.padding,margin:s.margin,borderRadius:s.borderRadius,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,opacity:s.opacity,width:s.width,height:s.height}}
var duzenlenen=null;
function tikla(e){if(!mod)return;var el=e.target;if(!el||(kat&&kat.contains(el)))return;e.preventDefault();e.stopPropagation();
if(mod==="metin"){if(duzenlenen&&duzenlenen!==el)bitir();duzenlenen=el;el.setAttribute("contenteditable","true");el.focus();el.addEventListener("blur",bitir,{once:true});return}
var r=el.getBoundingClientRect();gonder({tur:"secildi",secici:secici(el),etiket:el.tagName.toLowerCase(),metin:(el.innerText||"").trim().slice(0,160),gorsel:el.tagName==="IMG"?el.getAttribute("src"):null,stil:stilOku(el),kutu:{x:r.left,y:r.top,w:r.width,h:r.height}})}
function bitir(){if(!duzenlenen)return;var el=duzenlenen;duzenlenen=null;el.removeAttribute("contenteditable");gonder({tur:"metinDegisti",secici:secici(el),html:el.innerHTML})}
document.addEventListener("mousemove",ustte,true);document.addEventListener("click",tikla,true);
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&mod){gonder({tur:"kapat"})}},true);
window.addEventListener("message",function(e){var m=e.data;if(!m||!m.vayra)return;
if(m.tur==="mod"){mod=m.mod||null;katman();if(!mod)gizle();document.documentElement.style.cursor=mod==="metin"?"text":mod?"crosshair":""}
if(m.tur==="stil"){try{var el=document.querySelector(m.secici);if(el){el.style.setProperty(m.ozellik,m.deger);gonder({tur:"stilOkundu",secici:m.secici,stil:stilOku(el)})}}catch(x){}}
if(m.tur==="vurgula"){try{var v=document.querySelector(m.secici);if(v){katman();v.scrollIntoView({block:"center",behavior:"smooth"});setTimeout(function(){goster(v)},250)}}catch(x){}}
if(m.tur==="gorselDegis"){try{var g=document.querySelector(m.secici);if(g)g.setAttribute("src",m.src)}catch(x){}}});})();</script>`;

/**
 * Ziyaretçi oturum kaydı yükleyicisi (yalnız yayında ve Bulut > Oturumlar açıksa; <head>'de, depolama dolgusundan sonra).
 * Oturum başında örnekleme kararı verilir ve sekme belleğinde (sessionStorage; kum havuzunda window.name dolgusu)
 * "vayra-kayit" anahtarıyla tutulur; sayfalar arası sürer, 30 dakika hareketsizlikte yeni oturum başlar. Kayda düşen
 * ziyarette JavaScript, Promise, console.error/warn ve 400 üstü fetch hataları erkenden yakalanır, kaydedici
 * (rrweb + Vayra yapıştırıcısı) kendi adresimizden yüklenir. Do Not Track / GPC ve "onay bekle" ayarına uyulur:
 * sitenin çerez bandı analitik onayında vayra.kayit.onayla(), reddinde vayra.kayit.reddet() çağırır.
 * Vayra Build sitelere çerez bandı eklemez; kayıt çerez kullanmaz.
 */
export const kayitBetigi = (g: { adres: string; kaydedici: string; projeId: string; oran: number; metinMaskele: boolean; onayBekle: boolean; izlemeIstemeyen: boolean; kok: string }) => `<script>(function(){try{var C=${JSON.stringify({ a: g.adres, j: g.kaydedici, p: g.projeId, o: g.oran / 100, m: g.metinMaskele, b: g.onayBekle, d: g.izlemeIstemeyen, k: g.kok }).replace(/</g, "\\u003c")};
var S=window.sessionStorage,N="vayra-kayit",n=Date.now(),v=null;try{v=JSON.parse(S.getItem(N)||"null")}catch(e){}
if(!v||v.p!==C.p||n-(v.s||0)>1800000){var h="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",r="",x=new Uint8Array(20);try{crypto.getRandomValues(x)}catch(e){for(var j=0;j<20;j++)x[j]=Math.floor(Math.random()*256)}for(var i=0;i<20;i++)r+=h.charAt(x[i]%62);v={o:r,k:Math.random()<C.o?1:0,p:C.p,b:n}}
v.s=n;try{S.setItem(N,JSON.stringify(v))}catch(e){}
var K=window.__vayraKayit={a:C.a,o:v.o,m:C.m,k:C.k,q:[],h:null,f:window.fetch},bas=false;
function not(p){if(K.h)K.h(p);else if(K.q.length<60)K.q.push(p)}
function metin(a){var l=[];for(var i=0;i<a.length;i++){var y=a[i];try{l.push(y instanceof Error?(y.name+": "+y.message):typeof y==="string"?y:JSON.stringify(y))}catch(e){l.push(String(y))}}return l.join(" ").slice(0,300)}
function baslat(){if(bas)return;bas=true;
addEventListener("error",function(e){if(e&&e.message)not({s:"hata",t:"js",m:e.message,k:String(e.filename||"").split("/").pop().split("?")[0],l:e.lineno||0})});
addEventListener("unhandledrejection",function(e){var r=e&&e.reason;not({s:"hata",t:"promise",m:r&&r.message?r.message:String(r)})});
["error","warn"].forEach(function(t){var o=console[t];if(typeof o!=="function")return;console[t]=function(){try{not({s:t==="error"?"hata":"uyari",t:"konsol",m:metin(arguments)})}catch(e){}return o.apply(console,arguments)}});
if(K.f){window.fetch=function(u,o){var p=K.f.apply(this,arguments);try{var y=String(u&&u.url||u).split("?")[0].replace(location.origin,""),m=String(o&&o.method||u&&u.method||"GET").toUpperCase();if(y.indexOf("/api/build/oturum/")<0)p.then(function(r){if(r.status>=400)not({s:r.status>=500?"hata":"uyari",t:"ag",m:m+" "+y+" isteği "+r.status+" döndü"})},function(){not({s:"hata",t:"ag",m:m+" "+y+" isteğine ulaşılamadı"})})}catch(e){}return p}}
var s=document.createElement("script");s.src=C.j;s.async=true;(document.head||document.documentElement).appendChild(s)}
window.vayra=window.vayra||{};
window.vayra.kayit={onayla:function(){try{localStorage.setItem("vayra-kayit-onay","1")}catch(e){}if(v.k)baslat();return true},reddet:function(){try{localStorage.setItem("vayra-kayit-onay","0")}catch(e){}if(K.durdur)K.durdur();return true},durum:function(){return bas?"kayitta":"kapali"}};
if(!v.k)return;
if(C.d&&(navigator.doNotTrack==="1"||window.doNotTrack==="1"||navigator.globalPrivacyControl===true))return;
if(C.b){var on=null;try{on=localStorage.getItem("vayra-kayit-onay")}catch(e){}if(on!=="1")return}
baslat()}catch(e){}})();</script>`;

/** HTML'e betikleri yerleştirir: dolgu <head>'in başına, diğerleri </body>'nin önüne. */
export function betikleriEkle(html: string, g: { formAdresi: string; kok?: string; onizleme: boolean; rozet?: string; veriAdresi?: string; uyeAdresi?: string; belirtec?: string | null; analitik?: { adres: string; kok: string }; oturum?: Parameters<typeof kayitBetigi>[0] }): string {
  // Büyüme A/B denemesi (yalnız yayında, çalışan deneme varsa): dolgudan hemen sonra, sayfa çizilmeden yönlendirir.
  const bas = depolamaDolgusu + (g.onizleme ? temaKoprusu : "") + (g.analitik ? deneyBetigi(g.analitik.adres, g.analitik.kok) : "") + (g.veriAdresi ? veriBetigi(g.veriAdresi, g.belirtec ?? null, g.uyeAdresi ?? "", g.kok) : "") + (g.oturum ? kayitBetigi(g.oturum) : "");
  const son = calismaBetigi(g.formAdresi, g.kok ?? "") + (g.onizleme ? onizlemeKoprusu + tasarimKoprusu : "") + (g.analitik ? analitikBetigi(g.analitik.adres, g.analitik.kok) + hataBetigi(g.analitik.adres.replace("/api/build/analitik/", "/api/build/hata/")) : "") + (g.rozet ?? "");
  let h = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + bas) : bas + html;
  h = /<\/body>/i.test(h) ? h.replace(/<\/body>(?![\s\S]*<\/body>)/i, son + "</body>") : h + son;
  return h;
}
