/**
 * Yanıt içi etkileşimli görsel (gorsellestir aracı): modelin HTML, SVG ya da JS parçası kum havuzlu çerçevede
 * (sandbox="allow-scripts", ayrı köken) çizilir. Belgeye eklenenler:
 *  - içerik güvenlik kuralı: dış ağ yok (betik, stil, görsel, istek); yalnız satır içi kod ve data: görseller
 *  - Vayra'nın koyu temasına uyan temel stiller (düğme, girdi, tablo, kart, ızgara)
 *  - küçük grafik yardımcıları: V.cubuk, V.cizgi, V.pasta, V.sayi (doğrulanmış koyu kategorik palet, ipucu, lejant)
 *  - yükseklik bildirimi: içerik büyüdükçe üst pencere çerçeveyi uzatır
 * İstemci ve sunucu ortak kullanır (saf işlev).
 */
export const GORSEL_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'";

const STIL = `:root{color-scheme:dark;--zemin:#121315;--yuzey:#1a1b1e;--cizgi:rgba(255,255,255,.08);--metin:#f4f4f5;--metin2:#a1a1aa;--vurgu:#55d6fd;--vurgu2:#8be6ff}
*{box-sizing:border-box}html,body{margin:0;background:var(--zemin);color:var(--metin);font:14px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased}
body{padding:16px;overflow-x:hidden}h1,h2,h3,h4{margin:0 0 .5em;font-weight:600;letter-spacing:-.01em;line-height:1.25}h1{font-size:20px}h2{font-size:17px}h3{font-size:15px}p{margin:.45em 0}
.soluk{color:var(--metin2)}.vurgu{color:var(--vurgu2)}small{color:var(--metin2)}
button{font:inherit;font-size:13px;color:#0b0b0c;background:#fff;border:0;border-radius:999px;padding:7px 14px;font-weight:600;cursor:pointer;transition:opacity .15s,background .15s}
button:hover{opacity:.9}button:active{transform:scale(.97)}button.ikincil,button[data-ikincil]{background:rgba(255,255,255,.08);color:var(--metin)}button.secili,button[aria-pressed=true]{outline:2px solid #fff;outline-offset:1px}
input,select,textarea{font:inherit;font-size:13px;color:var(--metin);background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:7px 10px;outline:none;max-width:100%}
input:focus,select:focus,textarea:focus{border-color:rgba(85,214,253,.6)}input[type=range]{accent-color:#55d6fd;padding:0;border:0;background:none;width:100%}input[type=checkbox],input[type=radio]{accent-color:#55d6fd}
label{font-size:13px;color:var(--metin2)}table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:8px 10px;border-bottom:1px solid var(--cizgi);text-align:left;vertical-align:top}
th{color:var(--metin2);font-weight:600;font-size:12px}tbody tr:hover td{background:rgba(255,255,255,.025)}td.sayi,th.sayi{text-align:right;font-variant-numeric:tabular-nums}
.kart{background:var(--yuzey);border-radius:16px;padding:14px;border:1px solid var(--cizgi)}.izgara{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}
.satir{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.buyuk{font-size:28px;font-weight:650;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.v-grafik{position:relative;width:100%}.v-grafik svg{display:block;overflow:visible}svg text{font-family:inherit}
.v-ipucu{position:fixed;z-index:20;pointer-events:none;background:#1f2024;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:7px 10px;font-size:12px;line-height:1.5;display:none;white-space:nowrap;color:var(--metin)}
.v-ipucu b{font-weight:600}.v-ipucu i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px}
.v-lejant{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12px;color:var(--metin2);margin-top:10px}.v-lejant span{display:inline-flex;align-items:center}.v-lejant i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px}`;

/** Grafik yardımcıları. Palet: doğrulanmış koyu kategorik sıra (#121315 zemininde 3:1 üstü, renk körlüğü ayrımı geçer). */
const YARDIMCI = `(function(){
var P=["#3987e5","#d95926","#199e70","#c98500","#d55181","#008300","#9085e9","#e66767"],NS="http://www.w3.org/2000/svg";
function el(t,a,p){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function hd(h){return typeof h==="string"?document.querySelector(h):h}
function sayi(n,b){if(typeof n!=="number"||!isFinite(n))return String(n);return new Intl.NumberFormat("tr-TR",{maximumFractionDigits:b==null?2:b}).format(n)}
function kisa(n){var a=Math.abs(n);return a>=1e9?sayi(n/1e9,1)+" milyar":a>=1e6?sayi(n/1e6,1)+" milyon":a>=1e4?sayi(n/1e3,1)+" bin":sayi(n)}
function guzel(max,min){min=Math.min(0,min||0);var r=(max-min)||1,ham=r/4,us=Math.pow(10,Math.floor(Math.log10(ham))),k=ham/us,ad=(k<=1?1:k<=2?2:k<=2.5?2.5:k<=5?5:10)*us;return{ust:Math.ceil(max/ad)*ad||ad,alt:Math.floor(min/ad)*ad,adim:ad}}
var ip;function ipucu(e,h){if(!ip){ip=document.createElement("div");ip.className="v-ipucu";document.body.appendChild(ip)}ip.innerHTML=h;ip.style.display="block";var x=e.clientX+14,y=e.clientY+14,r=ip.getBoundingClientRect();if(x+r.width>innerWidth-6)x=e.clientX-r.width-14;if(y+r.height>innerHeight-6)y=Math.max(6,e.clientY-r.height-14);ip.style.left=x+"px";ip.style.top=y+"px"}
function gizle(){if(ip)ip.style.display="none"}
function lejant(k,l){if(l.length<2)return;var d=document.createElement("div");d.className="v-lejant";l.forEach(function(s,i){var x=document.createElement("span");x.innerHTML='<i style="background:'+(s.renk||P[i%8])+'"></i>';x.appendChild(document.createTextNode(s.ad+(s.ek||"")));d.appendChild(x)});k.appendChild(d)}
function kap(h){var k=hd(h);if(!k)throw new Error("Grafik hedefi bulunamadı");k.innerHTML="";var g=document.createElement("div");g.className="v-grafik";k.appendChild(g);return{k:k,g:g}}
function izle(k,f){var w=0;function c(){var y=k.clientWidth;if(Math.abs(y-w)>2){w=y;f(y)}}c();if(window.ResizeObserver)new ResizeObserver(c).observe(k)}
function eksen(svg,o){var s=guzel(o.max,o.min);for(var v=s.alt;v<=s.ust+1e-9;v+=s.adim){var y=o.y(v,s);el("line",{x1:o.sol,x2:o.w,y1:y,y2:y,stroke:v===0?"rgba(255,255,255,.22)":"rgba(255,255,255,.07)","stroke-width":1},svg);var t=el("text",{x:o.sol-8,y:y+4,"text-anchor":"end","font-size":11,fill:"#a1a1aa"},svg);t.textContent=kisa(v)+(o.birim&&v!==s.alt?"":"")}return s}
function etiket(svg,l,x,y,max){l.forEach(function(e,i){var t=el("text",{x:x(i),y:y,"text-anchor":"middle","font-size":11,fill:"#a1a1aa"},svg);var m=String(e);t.textContent=m.length>max?m.slice(0,max-1)+"…":m})}
function cubuk(h,o){var c=kap(h),l=o.etiketler||[],ss=o.seriler||[{ad:o.ad||"",veriler:o.veriler||[]}],H=o.yukseklik||260,birim=o.birim||"";
izle(c.k,function(W){if(W<120)return;c.g.innerHTML="";var svg=el("svg",{width:W,height:H,viewBox:"0 0 "+W+" "+H,role:"img"},c.g),sol=48,alt=26,ust=8,w=W-4,ih=H-alt-ust;
var tum=[];ss.forEach(function(s){s.veriler.forEach(function(v,i){tum.push(o.yigin?ss.reduce(function(t,x){return t+(+x.veriler[i]||0)},0):+v||0)})});
var mx=Math.max.apply(null,tum.concat([0])),mn=o.yigin?0:Math.min.apply(null,tum.concat([0]));var s;
var y=function(v,sk){return ust+ih-(v-sk.alt)/((sk.ust-sk.alt)||1)*ih};s=eksen(svg,{max:mx,min:mn,sol:sol,w:w,y:y,birim:birim});
var bant=(w-sol)/Math.max(1,l.length),ns=o.yigin?1:ss.length,bw=Math.max(4,Math.min(40,(bant*.72-(ns-1)*2)/ns)),grup=ns*bw+(ns-1)*2;
l.forEach(function(e,i){var x0=sol+bant*i+(bant-grup)/2,taban=0;var bg=el("rect",{x:sol+bant*i,y:ust,width:bant,height:ih,fill:"transparent"},svg);
ss.forEach(function(sr,j){var v=+sr.veriler[i]||0,x=o.yigin?x0:x0+j*(bw+2),y1=y(o.yigin?taban+v:Math.max(0,v),s),y0=y(o.yigin?taban:Math.min(0,v),s),hh=Math.max(0,y0-y1)-(o.yigin&&j>0?2:0),r=Math.min(4,bw/2,hh);
var ustteki=o.yigin?j===ss.length-1:true,d=ustteki&&v>=0?"M"+x+","+(y1+hh)+"V"+(y1+r)+"Q"+x+","+y1+" "+(x+r)+","+y1+"H"+(x+bw-r)+"Q"+(x+bw)+","+y1+" "+(x+bw)+","+(y1+r)+"V"+(y1+hh)+"Z":"M"+x+","+y1+"h"+bw+"v"+hh+"h"+(-bw)+"Z";
el("path",{d:d,fill:sr.renk||P[j%8]},svg);taban+=v});
bg.addEventListener("mousemove",function(ev){bg.setAttribute("fill","rgba(255,255,255,.04)");ipucu(ev,"<b>"+e+"</b><br>"+ss.map(function(sr,j){return'<i style="background:'+(sr.renk||P[j%8])+'"></i>'+(ss.length>1?sr.ad+": ":"")+sayi(+sr.veriler[i]||0)+(birim?" "+birim:"")}).join("<br>"))});
bg.addEventListener("mouseleave",function(){bg.setAttribute("fill","transparent");gizle()});svg.appendChild(bg)});
etiket(svg,l,function(i){return sol+bant*i+bant/2},H-8,Math.max(3,Math.floor(bant/7)))});lejant(c.k,ss)}
function cizgi(h,o){var c=kap(h),l=o.etiketler||[],ss=o.seriler||[{ad:o.ad||"",veriler:o.veriler||[]}],H=o.yukseklik||260,birim=o.birim||"";
izle(c.k,function(W){if(W<120)return;c.g.innerHTML="";var svg=el("svg",{width:W,height:H,viewBox:"0 0 "+W+" "+H,role:"img"},c.g),sol=48,alt=26,ust=8,w=W-8,ih=H-alt-ust;
var tum=[];ss.forEach(function(s){s.veriler.forEach(function(v){tum.push(+v||0)})});var mx=Math.max.apply(null,tum.concat([0])),mn=Math.min.apply(null,tum.concat([0]));
var y=function(v,sk){return ust+ih-(v-sk.alt)/((sk.ust-sk.alt)||1)*ih},s=eksen(svg,{max:mx,min:mn,sol:sol,w:w,y:y}),x=function(i){return sol+8+(w-sol-16)*(l.length>1?i/(l.length-1):.5)};
ss.forEach(function(sr,j){var d=sr.veriler.map(function(v,i){return(i?"L":"M")+x(i)+","+y(+v||0,s)}).join("");
if(ss.length===1){var gr=el("linearGradient",{id:"vg"+j,x1:0,y1:0,x2:0,y2:1},el("defs",{},svg));el("stop",{offset:0,"stop-color":sr.renk||P[j],"stop-opacity":.22},gr);el("stop",{offset:1,"stop-color":sr.renk||P[j],"stop-opacity":0},gr);el("path",{d:d+"L"+x(sr.veriler.length-1)+","+y(s.alt,s)+"L"+x(0)+","+y(s.alt,s)+"Z",fill:"url(#vg"+j+")"},svg)}
el("path",{d:d,fill:"none",stroke:sr.renk||P[j%8],"stroke-width":2,"stroke-linejoin":"round","stroke-linecap":"round"},svg)});
var ch=el("line",{y1:ust,y2:ust+ih,stroke:"rgba(255,255,255,.25)","stroke-width":1,visibility:"hidden"},svg),nok=ss.map(function(sr,j){return el("circle",{r:4.5,fill:sr.renk||P[j%8],stroke:"#121315","stroke-width":2,visibility:"hidden"},svg)});
var hit=el("rect",{x:sol,y:ust,width:w-sol,height:ih,fill:"transparent"},svg);
hit.addEventListener("mousemove",function(ev){var r=svg.getBoundingClientRect(),px=ev.clientX-r.left,i=Math.max(0,Math.min(l.length-1,Math.round((px-sol-8)/((w-sol-16)/Math.max(1,l.length-1)))));ch.setAttribute("x1",x(i));ch.setAttribute("x2",x(i));ch.setAttribute("visibility","visible");
nok.forEach(function(n,j){n.setAttribute("cx",x(i));n.setAttribute("cy",y(+ss[j].veriler[i]||0,s));n.setAttribute("visibility","visible")});
ipucu(ev,"<b>"+l[i]+"</b><br>"+ss.map(function(sr,j){return'<i style="background:'+(sr.renk||P[j%8])+'"></i>'+(ss.length>1?sr.ad+": ":"")+sayi(+sr.veriler[i]||0)+(birim?" "+birim:"")}).join("<br>"))});
hit.addEventListener("mouseleave",function(){ch.setAttribute("visibility","hidden");nok.forEach(function(n){n.setAttribute("visibility","hidden")});gizle()});
var adimE=Math.max(1,Math.ceil(l.length/Math.max(2,Math.floor((w-sol)/64))));etiket(svg,l.map(function(e,i){return i%adimE?"":e}),x,H-8,10)});lejant(c.k,ss)}
function pasta(h,o){var c=kap(h),d=(o.dilimler||[]).filter(function(x){return +x.deger>0}),top=d.reduce(function(t,x){return t+(+x.deger)},0)||1,R=o.yaricap||96,halka=o.halka!==false;
var svg=el("svg",{width:R*2+8,height:R*2+8,viewBox:"0 0 "+(R*2+8)+" "+(R*2+8),role:"img"},c.g),cx=R+4,cy=R+4,a=-Math.PI/2;
d.forEach(function(x,i){var v=+x.deger,b=a+v/top*Math.PI*2,buyuk=b-a>Math.PI?1:0,ic=halka?R*.6:0;
var p="M"+(cx+R*Math.cos(a))+","+(cy+R*Math.sin(a))+"A"+R+","+R+" 0 "+buyuk+" 1 "+(cx+R*Math.cos(b))+","+(cy+R*Math.sin(b))+(ic?"L"+(cx+ic*Math.cos(b))+","+(cy+ic*Math.sin(b))+"A"+ic+","+ic+" 0 "+buyuk+" 0 "+(cx+ic*Math.cos(a))+","+(cy+ic*Math.sin(a))+"Z":"L"+cx+","+cy+"Z");
if(d.length===1)p=ic?"M"+cx+","+(cy-R)+"a"+R+","+R+" 0 1 1 0 "+2*R+"a"+R+","+R+" 0 1 1 0 "+(-2*R)+"M"+cx+","+(cy-ic)+"a"+ic+","+ic+" 0 1 0 0 "+2*ic+"a"+ic+","+ic+" 0 1 0 0 "+(-2*ic):"M"+cx+","+(cy-R)+"a"+R+","+R+" 0 1 1 0 "+2*R+"a"+R+","+R+" 0 1 1 0 "+(-2*R);
var e=el("path",{d:p,fill:x.renk||P[i%8],stroke:"#121315","stroke-width":2,"fill-rule":"evenodd"},svg);
e.addEventListener("mousemove",function(ev){e.setAttribute("opacity",.85);ipucu(ev,'<i style="background:'+(x.renk||P[i%8])+'"></i><b>'+x.ad+"</b><br>"+sayi(v)+(o.birim?" "+o.birim:"")+" · yüzde "+sayi(v/top*100,1))});e.addEventListener("mouseleave",function(){e.removeAttribute("opacity");gizle()});a=b});
if(halka&&o.merkez){var t=el("text",{x:cx,y:cy+2,"text-anchor":"middle","font-size":20,"font-weight":650,fill:"#f4f4f5"},svg);t.textContent=o.merkez;if(o.merkezAlt){var u=el("text",{x:cx,y:cy+20,"text-anchor":"middle","font-size":11,fill:"#a1a1aa"},svg);u.textContent=o.merkezAlt}}
var k=document.createElement("div");k.style.cssText="display:flex;align-items:center;gap:20px;flex-wrap:wrap";c.g.appendChild(k);k.appendChild(svg);var lj=document.createElement("div");lj.className="v-lejant";lj.style.cssText="flex-direction:column;margin:0;gap:7px";
d.forEach(function(x,i){var s=document.createElement("span");s.innerHTML='<i style="background:'+(x.renk||P[i%8])+'"></i>';s.appendChild(document.createTextNode(x.ad+"  "+sayi(+x.deger)+(o.birim?" "+o.birim:"")+" (yüzde "+sayi(+x.deger/top*100,1)+")"));lj.appendChild(s)});k.appendChild(lj)}
window.V={renkler:P,renk:function(i){return P[i%8]},sayi:sayi,kisa:kisa,cubuk:cubuk,cizgi:cizgi,pasta:pasta,el:el};
})();`;

const YUKSEKLIK = `<script>(function(){var son=0,P=parent;function g(){var h=Math.ceil(document.body.getBoundingClientRect().height);if(Math.abs(h-son)>1){son=h;try{P.postMessage({vayraGorsel:1,yukseklik:h},"*")}catch(e){}}}
if(window.ResizeObserver)new ResizeObserver(g).observe(document.body);addEventListener("load",g);setTimeout(g,30);setTimeout(g,400);setTimeout(g,1500);
addEventListener("error",function(e){try{P.postMessage({vayraGorsel:1,hata:String(e.message||"Betik hatası")},"*")}catch(x){}});})();</script>`;

const kacis = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Modelin parçasını tam belgeye çevirir (tam belge verdiyse başına güvenlik kuralı ve yardımcılar eklenir). */
export function gorselBelgesi(html: string, baslik = "Görselleştirme"): string {
  const bas = `<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${GORSEL_CSP}"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${STIL}</style><script>${YARDIMCI}</script>`;
  if (/<html[\s>]|<!doctype/i.test(html)) {
    let x = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => `${m}${bas}`) : html.replace(/<html[^>]*>/i, (m) => `${m}<head>${bas}</head>`);
    if (!/<title>/i.test(x)) x = x.replace(bas, `${bas}<title>${kacis(baslik)}</title>`);
    return /<\/body>/i.test(x) ? x.replace(/<\/body>/i, `${YUKSEKLIK}</body>`) : x + YUKSEKLIK;
  }
  return `<!doctype html><html lang="tr"><head>${bas}<title>${kacis(baslik)}</title></head><body>${html}${YUKSEKLIK}</body></html>`;
}
