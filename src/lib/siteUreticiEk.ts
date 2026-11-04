/**
 * Site üretecinin oyun ve uygulama şablonları — tek dosyalık, gerçekten çalışan HTML.
 * Oyunlar: tuğla kırma, kanat (flappy), hafıza kartları. Uygulamalar: yapılacaklar, bütçe, odak zamanlayıcı.
 * Hepsi klavye + fare + dokunmayla çalışır, rekor/veri localStorage'da (erişilemezse sessizce atlanır).
 * Üretici kodu deterministiktir; Math.random yalnız ÜRETİLEN sayfanın çalışma anında kullanılır.
 */
import type { SitePlan } from "./siteUretici";

const kacis = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const anahtar = (p: SitePlan, ek: string) => `${p.marka.replace(/[^\wçğıöşü]/gi, "")}_${ek}`;

/** Oyun ve uygulamaların ortak koyu kabuğu. */
function kabuk(p: SitePlan, baslik: string, stil: string, govde: string, betik: string, sag = "") {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"><title>${kacis(p.marka)} — ${baslik}</title><style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--a:${p.aksan};--b:${p.aksan2};--bg:#0b0b10;--yz:rgba(255,255,255,.05);--kn:rgba(255,255,255,.1);--tx:#f2f2f7;--tx2:rgba(242,242,247,.6)}
html,body{height:100%}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;background:radial-gradient(120% 80% at 50% 0%,color-mix(in srgb,var(--a) 14%,transparent),transparent 60%),var(--bg);color:var(--tx);display:flex;flex-direction:column;align-items:center;padding:24px 16px;gap:16px;-webkit-tap-highlight-color:transparent}
.ust{width:100%;max-width:520px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px}
.logo .mark{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,var(--a),var(--b));display:grid;place-items:center;color:#07070a;font-weight:900}
.skor{display:flex;gap:8px}
.kutu{background:var(--yz);border:1px solid var(--kn);border-radius:12px;padding:5px 10px;font-size:11.5px;color:var(--tx2);text-align:center;min-width:56px}
@media(max-width:420px){.logo{font-size:0;gap:0}.kutu{min-width:50px;padding:4px 8px}}
.kutu b{display:block;font-size:18px;color:var(--tx);font-variant-numeric:tabular-nums}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,var(--a),var(--b));color:#07070a;font-weight:700;padding:11px 22px;border-radius:12px;border:0;cursor:pointer;font-size:15px;font-family:inherit}
.btn.ghost{background:var(--yz);color:var(--tx);border:1px solid var(--kn)}
.not{font-size:13px;color:var(--tx2);text-align:center}
${stil}
</style></head><body>
<div class="ust"><div class="logo"><span class="mark">${kacis(p.marka.charAt(0))}</span>${kacis(p.marka)}</div>${sag}</div>
${govde}
<p class="not">${kacis(p.marka)} · Vayra Usta ile üretildi</p>
<script>
const rk=k=>{try{return +localStorage.getItem(k)||0}catch(e){return 0}},yk=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
${betik}
</script></body></html>`;
}

const tuvalStil = `
.sahne{position:relative;width:100%;max-width:520px;aspect-ratio:4/3;border-radius:18px;overflow:hidden;border:1px solid var(--kn);background:#06060a;touch-action:none}
canvas{width:100%;height:100%;display:block}
.perde{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:rgba(6,6,10,.72);backdrop-filter:blur(4px);text-align:center;padding:20px}
.perde h2{font-size:26px;font-weight:800}
.perde p{color:var(--tx2);font-size:14px}
.gizli{display:none}`;

const skorKutulari = (ek = "") => `<div class="skor"><div class="kutu">Skor<b id="skor">0</b></div><div class="kutu">Rekor<b id="rekor">0</b></div>${ek}</div>`;

/* ───────────── Tuğla kırma ───────────── */
export function tuglaHTML(p: SitePlan) {
  const govde = `<div class="sahne"><canvas id="c" width="480" height="360"></canvas>
<div class="perde" id="perde"><h2 id="pb">Tuğla Kır</h2><p id="pa">Raketi fareyle, parmağınla ya da ← → ile oynat.</p><button class="btn" id="bas">Başla</button></div></div>`;
  const betik = `
const c=document.getElementById('c'),x=c.getContext('2d'),W=480,H=360,R=8,C=10,TW=W/C,TH=18;
const A=getComputedStyle(document.documentElement).getPropertyValue('--a').trim(),B=getComputedStyle(document.documentElement).getPropertyValue('--b').trim();
const K='${anahtar(p, "tugla")}';let rekor=rk(K);document.getElementById('rekor').textContent=rekor;
let raket,top_,tuglalar,skor,can,oynuyor=false,sol=false,sag=false;
function kur(){raket={x:W/2-40,w:80};tuglalar=[];for(let r=0;r<5;r++)for(let k=0;k<C;k++)tuglalar.push({x:k*TW+2,y:40+r*(TH+4),w:TW-4,h:TH,v:true,r});yeniTop()}
function yeniTop(){top_={x:W/2,y:H-60,dx:3*(Math.random()>.5?1:-1),dy:-3.6}}
function yaz(){document.getElementById('skor').textContent=skor;document.getElementById('can').textContent=can}
function bitir(kazandi){oynuyor=false;if(skor>rekor){rekor=skor;yk(K,rekor);document.getElementById('rekor').textContent=rekor}
document.getElementById('pb').textContent=kazandi?'Kazandın!':'Oyun bitti';document.getElementById('pa').textContent='Skor: '+skor;document.getElementById('bas').textContent='Yeniden oyna';document.getElementById('perde').classList.remove('gizli')}
function adim(){if(!oynuyor)return;if(sol)raket.x-=7;if(sag)raket.x+=7;raket.x=Math.max(0,Math.min(W-raket.w,raket.x));
top_.x+=top_.dx;top_.y+=top_.dy;if(top_.x<R||top_.x>W-R)top_.dx*=-1;if(top_.y<R)top_.dy*=-1;
if(top_.y>H-28-R&&top_.y<H-16&&top_.x>raket.x&&top_.x<raket.x+raket.w&&top_.dy>0){const o=(top_.x-(raket.x+raket.w/2))/(raket.w/2);top_.dx=o*5;top_.dy=-Math.max(3.4,Math.abs(top_.dy)*1.02)}
for(const t of tuglalar)if(t.v&&top_.x>t.x&&top_.x<t.x+t.w&&top_.y-R<t.y+t.h&&top_.y+R>t.y){t.v=false;top_.dy*=-1;skor+=10*(5-t.r);yaz();break}
if(top_.y>H+R){can--;yaz();if(can<=0)return bitir(false);yeniTop()}
if(tuglalar.every(t=>!t.v))return bitir(true);ciz();requestAnimationFrame(adim)}
function ciz(){x.clearRect(0,0,W,H);for(const t of tuglalar)if(t.v){x.fillStyle=t.r%2?B:A;x.globalAlpha=1-t.r*.12;x.beginPath();x.roundRect(t.x,t.y,t.w,t.h,5);x.fill()}x.globalAlpha=1;
x.fillStyle='#f2f2f7';x.beginPath();x.roundRect(raket.x,H-28,raket.w,10,5);x.fill();x.shadowColor=A;x.shadowBlur=14;x.fillStyle=A;x.beginPath();x.arc(top_.x,top_.y,R,0,7);x.fill();x.shadowBlur=0}
function basla(){skor=0;can=3;yaz();kur();oynuyor=true;document.getElementById('perde').classList.add('gizli');requestAnimationFrame(adim)}
document.getElementById('bas').onclick=basla;
const tasi=e=>{const r=c.getBoundingClientRect();const px=((e.touches?e.touches[0].clientX:e.clientX)-r.left)/r.width*W;raket&&(raket.x=px-raket.w/2)};
c.addEventListener('mousemove',tasi);c.addEventListener('touchmove',e=>{e.preventDefault();tasi(e)},{passive:false});
addEventListener('keydown',e=>{if(e.key==='ArrowLeft')sol=true;if(e.key==='ArrowRight')sag=true;if((e.key===' '||e.key==='Enter')&&!oynuyor){e.preventDefault();basla()}});
addEventListener('keyup',e=>{if(e.key==='ArrowLeft')sol=false;if(e.key==='ArrowRight')sag=false});
kur();ciz();`;
  return kabuk(p, "Tuğla Kır", tuvalStil, govde, betik, skorKutulari('<div class="kutu">Can<b id="can">3</b></div>'));
}

/* ───────────── Kanat (flappy) ───────────── */
export function kanatHTML(p: SitePlan) {
  const govde = `<div class="sahne"><canvas id="c" width="480" height="360"></canvas>
<div class="perde" id="perde"><h2 id="pb">Kanat</h2><p id="pa">Uçmak için dokun, tıkla ya da boşluğa bas.</p><button class="btn" id="bas">Başla</button></div></div>`;
  const betik = `
const c=document.getElementById('c'),x=c.getContext('2d'),W=480,H=360;
const A=getComputedStyle(document.documentElement).getPropertyValue('--a').trim(),B=getComputedStyle(document.documentElement).getPropertyValue('--b').trim();
const K='${anahtar(p, "kanat")}';let rekor=rk(K);document.getElementById('rekor').textContent=rekor;
let kus,borular,skor,oynuyor=false,kare=0;
function kur(){kus={x:110,y:H/2,v:0};borular=[];skor=0;kare=0;document.getElementById('skor').textContent=0}
function cirp(){if(!oynuyor)return basla();kus.v=-6.2}
function bitir(){oynuyor=false;if(skor>rekor){rekor=skor;yk(K,rekor);document.getElementById('rekor').textContent=rekor}
document.getElementById('pb').textContent='Oyun bitti';document.getElementById('pa').textContent='Skor: '+skor;document.getElementById('bas').textContent='Yeniden oyna';document.getElementById('perde').classList.remove('gizli')}
function adim(){if(!oynuyor)return;kare++;kus.v+=.36;kus.y+=kus.v;
if(kare%90===0){const bosluk=120,u=40+Math.random()*(H-bosluk-80);borular.push({x:W,u,a:u+bosluk,gecti:false})}
for(const b of borular){b.x-=2.6;if(!b.gecti&&b.x+52<kus.x){b.gecti=true;skor++;document.getElementById('skor').textContent=skor}
if(kus.x+12>b.x&&kus.x-12<b.x+52&&(kus.y-12<b.u||kus.y+12>b.a))return bitir()}
borular=borular.filter(b=>b.x>-60);if(kus.y>H-12||kus.y<0)return bitir();ciz();requestAnimationFrame(adim)}
function ciz(){x.clearRect(0,0,W,H);for(let i=0;i<40;i++){x.fillStyle='rgba(255,255,255,'+(.15+(i%3)*.1)+')';x.fillRect(((i*97-kare*.3*(1+i%3))%W+W)%W,(i*53)%H,2,2)}
for(const b of borular){const g=x.createLinearGradient(b.x,0,b.x+52,0);g.addColorStop(0,A);g.addColorStop(1,B);x.fillStyle=g;x.beginPath();x.roundRect(b.x,-10,52,b.u+10,8);x.fill();x.beginPath();x.roundRect(b.x,b.a,52,H-b.a+10,8);x.fill()}
x.save();x.translate(kus.x,kus.y);x.rotate(Math.max(-.5,Math.min(.9,kus.v/10)));x.shadowColor=A;x.shadowBlur=16;x.fillStyle='#f2f2f7';x.beginPath();x.ellipse(0,0,14,11,0,0,7);x.fill();x.shadowBlur=0;x.fillStyle=A;x.beginPath();x.ellipse(-3,2,7,4,-.4,0,7);x.fill();x.fillStyle='#07070a';x.beginPath();x.arc(6,-3,2.2,0,7);x.fill();x.restore()}
function basla(){kur();oynuyor=true;document.getElementById('perde').classList.add('gizli');kus.v=-6;requestAnimationFrame(adim)}
document.getElementById('bas').onclick=e=>{e.stopPropagation();basla()};
c.addEventListener('pointerdown',e=>{e.preventDefault();cirp()});
addEventListener('keydown',e=>{if(e.key===' '||e.key==='ArrowUp'||e.key==='Enter'){e.preventDefault();cirp()}});
kur();ciz();`;
  return kabuk(p, "Kanat", tuvalStil, govde, betik, skorKutulari());
}

/* ───────────── Hafıza kartları ───────────── */
export function hafizaHTML(p: SitePlan) {
  const stil = `
.izgara{width:100%;max-width:520px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.kart{aspect-ratio:1;perspective:600px;cursor:pointer;border:0;background:none;padding:0}
.ic{position:relative;width:100%;height:100%;transition:transform .45s;transform-style:preserve-3d}
.kart.acik .ic,.kart.bulundu .ic{transform:rotateY(180deg)}
.yuz{position:absolute;inset:0;border-radius:14px;display:grid;place-items:center;backface-visibility:hidden;font-size:clamp(28px,8vw,40px)}
.arka{background:linear-gradient(135deg,var(--a),var(--b));box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}
.arka::after{content:'';width:34%;height:34%;border-radius:50%;border:3px solid rgba(7,7,10,.35)}
.on{background:var(--yz);border:1px solid var(--kn);transform:rotateY(180deg)}
.kart.bulundu .on{border-color:var(--a);box-shadow:0 0 0 1px var(--a),0 0 24px -6px var(--a)}
.alt{display:flex;gap:10px}`;
  const govde = `<div class="izgara" id="iz"></div>
<div class="alt"><button class="btn ghost" id="yeni">Yeniden karıştır</button></div>
<p class="not" id="durum" aria-live="polite">Kartları çevir, eşleri bul.</p>`;
  const betik = `
const S=['☕','🍩','🌙','⭐','🎧','🌵','🚀','🎈'],K='${anahtar(p, "hafiza")}';
let acik=[],bulunan=0,hamle=0,sn=0,zaman=null,kilit=false;
const iz=document.getElementById('iz'),en=rk(K);if(en)document.getElementById('rekor').textContent=en;
function sure(){document.getElementById('sure').textContent=Math.floor(sn/60)+':'+String(sn%60).padStart(2,'0')}
function kur(){clearInterval(zaman);zaman=null;sn=0;sure();hamle=0;bulunan=0;acik=[];kilit=false;document.getElementById('hamle').textContent=0;document.getElementById('durum').textContent='Kartları çevir, eşleri bul.';
const d=[...S,...S].sort(()=>Math.random()-.5);iz.innerHTML='';d.forEach((s,i)=>{const b=document.createElement('button');b.className='kart';b.setAttribute('aria-label','Kapalı kart '+(i+1));b.dataset.s=s;b.innerHTML='<div class="ic"><div class="yuz arka"></div><div class="yuz on">'+s+'</div></div>';b.onclick=()=>cevir(b);iz.appendChild(b)})}
function cevir(b){if(kilit||b.classList.contains('acik')||b.classList.contains('bulundu'))return;if(!zaman)zaman=setInterval(()=>{sn++;sure()},1000);
b.classList.add('acik');b.setAttribute('aria-label',b.dataset.s);acik.push(b);if(acik.length<2)return;hamle++;document.getElementById('hamle').textContent=hamle;
const [a,c]=acik;if(a.dataset.s===c.dataset.s){a.classList.replace('acik','bulundu');c.classList.replace('acik','bulundu');acik=[];bulunan++;
if(bulunan===S.length){clearInterval(zaman);const r=rk(K);if(!r||hamle<r){yk(K,hamle);document.getElementById('rekor').textContent=hamle}document.getElementById('durum').textContent='Tebrikler! '+hamle+' hamlede, '+document.getElementById('sure').textContent+' sürede bitirdin.'}}
else{kilit=true;setTimeout(()=>{a.classList.remove('acik');c.classList.remove('acik');a.setAttribute('aria-label','Kapalı kart');c.setAttribute('aria-label','Kapalı kart');acik=[];kilit=false},750)}}
document.getElementById('yeni').onclick=kur;kur();`;
  return kabuk(p, "Hafıza", stil, govde, betik, `<div class="skor"><div class="kutu">Hamle<b id="hamle">0</b></div><div class="kutu">Süre<b id="sure">0:00</b></div><div class="kutu">En iyi<b id="rekor">–</b></div></div>`);
}

/* ───────────── Yapılacaklar ───────────── */
export function yapilacakHTML(p: SitePlan) {
  const stil = `
.kart{width:100%;max-width:520px;background:var(--yz);border:1px solid var(--kn);border-radius:20px;padding:18px}
h1{font-size:24px;font-weight:800;margin-bottom:4px}.alt{color:var(--tx2);font-size:14px;margin-bottom:14px}
.form{display:flex;gap:8px}input{flex:1;min-width:0;background:rgba(0,0,0,.25);border:1px solid var(--kn);border-radius:12px;padding:12px 14px;color:var(--tx);font:inherit;font-size:15px;outline:none}input:focus{border-color:var(--a)}
.sekme{display:flex;gap:4px;margin:14px 0 8px;background:rgba(0,0,0,.2);padding:4px;border-radius:12px}.sekme button{flex:1;border:0;background:none;color:var(--tx2);padding:8px;border-radius:9px;font:inherit;font-size:13px;font-weight:600;cursor:pointer}.sekme button.on{background:var(--yz);color:var(--tx)}
ul{list-style:none}li{display:flex;align-items:center;gap:12px;padding:12px 6px;border-bottom:1px solid var(--kn);animation:gir .25s}li:last-child{border:0}
@keyframes gir{from{opacity:0;transform:translateY(-4px)}}
.kutucuk{width:22px;height:22px;border-radius:7px;border:2px solid var(--kn);background:none;cursor:pointer;flex-shrink:0;display:grid;place-items:center;color:#07070a;font-weight:900;font-size:13px}
li.bitti .kutucuk{background:linear-gradient(135deg,var(--a),var(--b));border-color:transparent}li.bitti span{text-decoration:line-through;color:var(--tx2)}
li span{flex:1;font-size:15px;word-break:break-word}.sil{border:0;background:none;color:var(--tx2);cursor:pointer;font-size:18px;opacity:.5}.sil:hover{opacity:1}
.ayak{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:13px;color:var(--tx2)}.ayak button{border:0;background:none;color:var(--tx2);cursor:pointer;font:inherit}.ayak button:hover{color:var(--tx)}
.bos{text-align:center;padding:28px 0;color:var(--tx2);font-size:14px}`;
  const govde = `<div class="kart"><h1>Yapılacaklar</h1><p class="alt" id="ozet"></p>
<div class="form" id="f"><input id="g" placeholder="Yeni görev ekle…" aria-label="Yeni görev" autocomplete="off" enterkeyhint="done"><button class="btn" id="ekle" type="button">Ekle</button></div>
<div class="sekme" role="tablist"><button data-f="hepsi" class="on">Tümü</button><button data-f="aktif">Aktif</button><button data-f="bitti">Biten</button></div>
<ul id="l"></ul><div class="ayak"><span id="say"></span><button id="temizle">Bitenleri temizle</button></div></div>`;
  const betik = `
const K='${anahtar(p, "gorevler")}';let g=[],f='hepsi';try{g=JSON.parse(localStorage.getItem(K))||[]}catch(e){}
if(!g.length)g=[{t:'Sabah demlemesini hazırla',b:true},{t:'Yeni menüyü panoya yaz',b:false},{t:'Tedarikçiyi ara',b:false}];
const kaydet=()=>{try{localStorage.setItem(K,JSON.stringify(g))}catch(e){}};
function ciz(){const l=document.getElementById('l');const liste=g.map((x,i)=>({...x,i})).filter(x=>f==='hepsi'||(f==='aktif'?!x.b:x.b));
l.innerHTML=liste.length?'':'<div class="bos">'+(f==='bitti'?'Henüz biten görev yok.':'Her şey tamam. Yeni bir görev ekle.')+'</div>';
for(const x of liste){const li=document.createElement('li');if(x.b)li.className='bitti';li.innerHTML='<button class="kutucuk" aria-label="Tamamlandı olarak işaretle">'+(x.b?'✓':'')+'</button><span></span><button class="sil" aria-label="Sil">×</button>';li.querySelector('span').textContent=x.t;
li.querySelector('.kutucuk').onclick=()=>{g[x.i].b=!g[x.i].b;kaydet();ciz()};li.querySelector('.sil').onclick=()=>{g.splice(x.i,1);kaydet();ciz()};l.appendChild(li)}
const ak=g.filter(x=>!x.b).length;document.getElementById('say').textContent=ak+' görev kaldı';document.getElementById('ozet').textContent=g.length?(g.length-ak)+' / '+g.length+' tamamlandı':'Listen boş'}
// Önizleme kum havuzunda form gönderimi kapalı olabilir: Enter ve düğme doğrudan dinlenir.
const ekle=()=>{const i=document.getElementById('g');const t=i.value.trim();if(!t)return;g.unshift({t,b:false});i.value='';kaydet();ciz();i.focus()};
document.getElementById('ekle').onclick=ekle;document.getElementById('g').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();ekle()}};
document.querySelectorAll('.sekme button').forEach(b=>b.onclick=()=>{f=b.dataset.f;document.querySelectorAll('.sekme button').forEach(x=>x.classList.toggle('on',x===b));ciz()});
document.getElementById('temizle').onclick=()=>{g=g.filter(x=>!x.b);kaydet();ciz()};ciz();`;
  return kabuk(p, "Yapılacaklar", stil, govde, betik);
}

/* ───────────── Bütçe takibi ───────────── */
export function butceHTML(p: SitePlan) {
  const stil = `
.kart{width:100%;max-width:520px;background:var(--yz);border:1px solid var(--kn);border-radius:20px;padding:18px}
.ozet{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%;max-width:520px}.ozet div{background:var(--yz);border:1px solid var(--kn);border-radius:14px;padding:12px}.ozet small{color:var(--tx2);font-size:12px}.ozet b{display:block;font-size:clamp(15px,4vw,20px);font-variant-numeric:tabular-nums;margin-top:2px}
.art{color:#4ade80}.eks{color:#fb7185}
.form{display:grid;grid-template-columns:1fr 110px;gap:8px}input,select{background:rgba(0,0,0,.25);border:1px solid var(--kn);border-radius:12px;padding:11px 12px;color:var(--tx);font:inherit;font-size:14px;outline:none;min-width:0}input:focus,select:focus{border-color:var(--a)}
.tur{grid-column:1/-1;display:flex;gap:6px}.tur button{flex:1;border:1px solid var(--kn);background:none;color:var(--tx2);border-radius:10px;padding:9px;font:inherit;font-weight:600;cursor:pointer}.tur button.on{background:var(--yz);color:var(--tx);border-color:var(--a)}
.form .btn{grid-column:1/-1}.hata{border-color:#fb7185!important}
h3{font-size:14px;margin:16px 0 8px;color:var(--tx2);font-weight:600}
.bar{display:flex;align-items:center;gap:10px;font-size:13px;margin:6px 0}.bar span:first-child{width:84px;color:var(--tx2)}.bar i{flex:1;height:8px;border-radius:9px;background:rgba(255,255,255,.06);overflow:hidden}.bar i b{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,var(--a),var(--b));transition:width .4s}.bar em{font-style:normal;width:72px;text-align:right;font-variant-numeric:tabular-nums}
ul{list-style:none}li{display:flex;align-items:center;gap:10px;padding:10px 2px;border-bottom:1px solid var(--kn);font-size:14px}li:last-child{border:0}li span{flex:1}li small{color:var(--tx2)}li b{font-variant-numeric:tabular-nums}.sil{border:0;background:none;color:var(--tx2);cursor:pointer;font-size:17px}`;
  const govde = `<div class="ozet"><div><small>Gelir</small><b class="art" id="gel">0</b></div><div><small>Gider</small><b class="eks" id="gid">0</b></div><div><small>Bakiye</small><b id="bak">0</b></div></div>
<div class="kart"><div class="form" id="f"><div class="tur"><button type="button" data-t="gider" class="on">Gider</button><button type="button" data-t="gelir">Gelir</button></div>
<input id="ac" placeholder="Açıklama (ör. Kira)" aria-label="Açıklama"><input id="tu" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Tutar" aria-label="Tutar">
<select id="ka" aria-label="Kategori"><option>Mutfak</option><option>Kira</option><option>Ulaşım</option><option>Eğlence</option><option>Fatura</option><option>Diğer</option></select><span></span>
<button class="btn" id="ekle" type="button">Ekle</button></div>
<h3>Kategoriye göre gider</h3><div id="bars"></div><h3>Hareketler</h3><ul id="l"></ul></div>`;
  const betik = `
const K='${anahtar(p, "butce")}';let h=[],tur='gider';try{h=JSON.parse(localStorage.getItem(K))||[]}catch(e){}
if(!h.length)h=[{a:'Maaş',t:42000,k:'Diğer',g:true},{a:'Kira',t:15000,k:'Kira',g:false},{a:'Market',t:3250,k:'Mutfak',g:false},{a:'Akbil',t:900,k:'Ulaşım',g:false}];
const tl=n=>n.toLocaleString('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0});const kaydet=()=>{try{localStorage.setItem(K,JSON.stringify(h))}catch(e){}};
function ciz(){const gel=h.filter(x=>x.g).reduce((s,x)=>s+x.t,0),gid=h.filter(x=>!x.g).reduce((s,x)=>s+x.t,0);document.getElementById('gel').textContent=tl(gel);document.getElementById('gid').textContent=tl(gid);const b=document.getElementById('bak');b.textContent=tl(gel-gid);b.className=gel-gid<0?'eks':'';
const kat={};h.filter(x=>!x.g).forEach(x=>kat[x.k]=(kat[x.k]||0)+x.t);const en=Math.max(1,...Object.values(kat));
document.getElementById('bars').innerHTML=Object.keys(kat).length?Object.entries(kat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>'<div class="bar"><span>'+k+'</span><i><b style="width:'+(v/en*100)+'%"></b></i><em>'+tl(v)+'</em></div>').join(''):'<p style="color:var(--tx2);font-size:13px">Henüz gider yok.</p>';
const l=document.getElementById('l');l.innerHTML='';h.forEach((x,i)=>{const li=document.createElement('li');li.innerHTML='<span></span><small>'+x.k+'</small><b class="'+(x.g?'art':'eks')+'">'+(x.g?'+':'−')+tl(x.t)+'</b><button class="sil" aria-label="Sil">×</button>';li.querySelector('span').textContent=x.a;li.querySelector('.sil').onclick=()=>{h.splice(i,1);kaydet();ciz()};l.appendChild(li)})}
document.querySelectorAll('.tur button').forEach(b=>b.onclick=()=>{tur=b.dataset.t;document.querySelectorAll('.tur button').forEach(x=>x.classList.toggle('on',x===b))});
// Önizleme kum havuzunda form gönderimi kapalı olabilir: Enter ve düğme doğrudan dinlenir.
const ac=document.getElementById('ac'),tu=document.getElementById('tu');
const ekle=()=>{const t=parseFloat(tu.value),a=ac.value.trim();ac.classList.toggle('hata',!a);tu.classList.toggle('hata',!(t>0));if(!a||!(t>0))return;
h.unshift({a,t,k:tur==='gelir'?'Diğer':document.getElementById('ka').value,g:tur==='gelir'});ac.value='';tu.value='';kaydet();ciz();ac.focus()};
document.getElementById('ekle').onclick=ekle;[ac,tu].forEach(i=>i.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();ekle()}});ciz();`;
  return kabuk(p, "Bütçe", stil, govde, betik);
}

/* ───────────── Odak zamanlayıcı (pomodoro) ───────────── */
export function zamanlayiciHTML(p: SitePlan) {
  const stil = `
.kart{width:100%;max-width:420px;background:var(--yz);border:1px solid var(--kn);border-radius:24px;padding:22px;display:flex;flex-direction:column;align-items:center;gap:18px}
.mod{display:flex;gap:4px;background:rgba(0,0,0,.25);padding:4px;border-radius:12px;width:100%}.mod button{flex:1;border:0;background:none;color:var(--tx2);padding:9px 4px;border-radius:9px;font:inherit;font-size:13px;font-weight:600;cursor:pointer}.mod button.on{background:var(--yz);color:var(--tx)}
.halka{position:relative;width:min(260px,70vw);aspect-ratio:1}.halka svg{width:100%;height:100%;transform:rotate(-90deg)}.halka circle{fill:none;stroke-width:10}.halka .iz{stroke:rgba(255,255,255,.07)}.halka .ilerle{stroke:url(#g);stroke-linecap:round;transition:stroke-dashoffset .9s linear}
.sure{position:absolute;inset:0;display:grid;place-items:center;text-align:center}.sure b{font-size:clamp(44px,13vw,60px);font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.02em}.sure small{display:block;color:var(--tx2);font-size:13px;margin-top:-6px}
.alt{display:flex;gap:10px}.tur{font-size:13px;color:var(--tx2)}.tur b{color:var(--tx)}`;
  const govde = `<div class="kart"><div class="mod" role="tablist"><button data-d="25" data-a="Odak" class="on">Odak · 25</button><button data-d="5" data-a="Kısa mola">Mola · 5</button><button data-d="15" data-a="Uzun mola">Uzun · 15</button></div>
<div class="halka"><svg viewBox="0 0 120 120"><defs><linearGradient id="g"><stop offset="0" stop-color="var(--a)"/><stop offset="1" stop-color="var(--b)"/></linearGradient></defs><circle class="iz" cx="60" cy="60" r="52"/><circle class="ilerle" id="pr" cx="60" cy="60" r="52"/></svg>
<div class="sure"><div><b id="s">25:00</b><small id="ad">Odak</small></div></div></div>
<div class="alt"><button class="btn" id="bas">Başlat</button><button class="btn ghost" id="sifir">Sıfırla</button></div>
<p class="tur">Bugün tamamlanan odak: <b id="say">0</b></p></div>`;
  const betik = `
const K='${anahtar(p, "odak")}',CV=2*Math.PI*52,pr=document.getElementById('pr');pr.style.strokeDasharray=CV;
let dk=25,kalan=dk*60,t=null,say=rk(K+'_'+new Date().toDateString());document.getElementById('say').textContent=say;
function yaz(){const m=Math.floor(kalan/60),s=kalan%60;document.getElementById('s').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');pr.style.strokeDashoffset=CV*(1-kalan/(dk*60));document.title=document.getElementById('s').textContent+' · '+document.getElementById('ad').textContent}
function bip(){try{const a=new AudioContext(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=880;g.gain.setValueAtTime(.2,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+1.2);o.start();o.stop(a.currentTime+1.2)}catch(e){}}
function dur(){clearInterval(t);t=null;document.getElementById('bas').textContent='Başlat'}
document.getElementById('bas').onclick=()=>{if(t)return dur();document.getElementById('bas').textContent='Duraklat';t=setInterval(()=>{kalan--;yaz();if(kalan<=0){dur();bip();if(dk===25){say++;yk(K+'_'+new Date().toDateString(),say);document.getElementById('say').textContent=say}kalan=dk*60;yaz()}},1000)};
document.getElementById('sifir').onclick=()=>{dur();kalan=dk*60;yaz()};
document.querySelectorAll('.mod button').forEach(b=>b.onclick=()=>{dur();dk=+b.dataset.d;kalan=dk*60;document.getElementById('ad').textContent=b.dataset.a;document.querySelectorAll('.mod button').forEach(x=>x.classList.toggle('on',x===b));yaz()});
addEventListener('keydown',e=>{if(e.key===' '&&e.target===document.body){e.preventDefault();document.getElementById('bas').click()}});yaz();`;
  return kabuk(p, "Odak", stil, govde, betik);
}
