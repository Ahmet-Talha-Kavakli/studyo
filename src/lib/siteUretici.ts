/**
 * Vayra Site Üreteci — GERÇEKTEN ÇALIŞAN, kendi kendine yeten HTML/CSS/JS üretir.
 *
 * LLM anahtarı gerektirmez: istem metnini deterministik olarak analiz eder
 * (tip, sektör, renk paleti, marka adı, bölümler) ve tek dosyalık, responsive,
 * animasyonlu, GERÇEK ÇALIŞAN bir web sitesi/uygulama döndürür. Çıktı bir
 * <iframe srcdoc> içinde canlı çalışır ve .html olarak indirilebilir.
 *
 * SSR güvenli: Math.random / Date.now KULLANMAZ (deterministik hash tabanlı).
 */

export type SiteTip = "landing" | "portfolyo" | "dashboard" | "oyun" | "blog" | "menu";

export interface SitePlan {
  tip: SiteTip;
  marka: string;
  slogan: string;
  aksan: string;      // ana renk (hex)
  aksan2: string;     // ikincil renk
  zemin: string;      // koyu mu açık mı
  koyu: boolean;
  sektor: string;
  bolumler: string[]; // üretilen bölüm başlıkları (düşünce izi için)
  dosyalar: string[]; // "üretilen dosyalar" listesi (düşünce izi için)
}

/* ---- deterministik yardımcılar ---- */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
function sec<T>(dizi: T[], tohum: string): T { return dizi[hash(tohum) % dizi.length]; }

const PALETLER: { ad: string; a: string; b: string; koyu: boolean; zemin: string }[] = [
  { ad: "gece-neon", a: "#22d3ee", b: "#a78bfa", koyu: true, zemin: "#0a0a0f" },
  { ad: "lime-siyah", a: "#55d6fd", b: "#84cc16", koyu: true, zemin: "#0b0d09" },
  { ad: "gün-batımı", a: "#fb7185", b: "#fbbf24", koyu: true, zemin: "#140d12" },
  { ad: "okyanus", a: "#38bdf8", b: "#2dd4bf", koyu: true, zemin: "#07121a" },
  { ad: "mor-elektrik", a: "#c084fc", b: "#f472b6", koyu: true, zemin: "#100a18" },
  { ad: "temiz-açık", a: "#2563eb", b: "#7c3aed", koyu: false, zemin: "#f8fafc" },
  { ad: "toprak", a: "#ea580c", b: "#f59e0b", koyu: false, zemin: "#fffaf3" },
];

const SEKTORLER: { anahtar: string[]; ad: string; ikon: string }[] = [
  { anahtar: ["kahve", "cafe", "kafe", "restoran", "yemek", "menü", "pizza", "burger"], ad: "Yeme-İçme", ikon: "☕" },
  { anahtar: ["spor", "fitness", "gym", "koş", "yoga"], ad: "Spor & Sağlık", ikon: "💪" },
  { anahtar: ["moda", "giyim", "ayakkabı", "butik", "mağaza", "e-ticaret", "shop", "store"], ad: "E-Ticaret", ikon: "🛍️" },
  { anahtar: ["oyun", "game", "arcade", "puan"], ad: "Oyun", ikon: "🎮" },
  { anahtar: ["ajans", "tasarım", "studio", "stüdyo", "kreatif", "portfolyo", "portfolio"], ad: "Kreatif Ajans", ikon: "✦" },
  { anahtar: ["yapay zeka", "ai", "saas", "yazılım", "uygulama", "platform", "startup", "teknoloji"], ad: "Teknoloji / SaaS", ikon: "⚡" },
  { anahtar: ["emlak", "gayrimenkul", "ev", "konut"], ad: "Emlak", ikon: "🏛️" },
  { anahtar: ["seyahat", "tur", "otel", "tatil"], ad: "Seyahat", ikon: "✈️" },
  { anahtar: ["müzik", "sanat", "etkinlik", "konser", "festival"], ad: "Etkinlik & Sanat", ikon: "🎵" },
  { anahtar: ["blog", "haber", "dergi", "yazı"], ad: "Yayın / Blog", ikon: "✍️" },
];

/** İstemi analiz edip bir üretim planı çıkarır (deterministik). */
export function planla(istem: string): SitePlan {
  const t = istem.toLowerCase();
  const tohum = istem.trim();

  // Tip algıla
  let tip: SiteTip = "landing";
  if (/(oyun|game|arcade|yılan|snake|tetris|puan tut)/.test(t)) tip = "oyun";
  else if (/(dashboard|panel|yönetim|admin|gösterge|analitik|istatistik)/.test(t)) tip = "dashboard";
  else if (/(portfolyo|portfolio|cv|özgeçmiş|kişisel site)/.test(t)) tip = "portfolyo";
  else if (/(blog|haber|dergi|yazı|makale)/.test(t)) tip = "blog";
  else if (/(menü|menu|restoran|kafe|kahve|cafe)/.test(t)) tip = "menu";

  // Sektör
  const sektorObj = SEKTORLER.find((s) => s.anahtar.some((a) => t.includes(a))) ?? { ad: "Genel", ikon: "✦" };

  // Marka adı: tırnak içi ya da büyük harfli kelime ya da ilk anlamlı kelime
  let marka = "";
  const tirnak = istem.match(/["'"']([^"'"']{2,30})["'"']/);
  if (tirnak) marka = tirnak[1].trim();
  if (!marka) {
    const adGecti = istem.match(/(?:adı|ismi|adında|isminde)\s+([A-Za-zçğıöşüÇĞİÖŞÜ0-9]{2,20})/i);
    if (adGecti) marka = adGecti[1];
  }
  if (!marka) {
    // sektöre göre üretilmiş marka
    const ADLAR = ["Nova", "Aura", "Zenith", "Lumen", "Vertex", "Aurora", "Prizma", "Kobalt", "Meridyen", "Solstis", "Fenom", "Orbit"];
    marka = sec(ADLAR, tohum);
  }
  marka = marka.charAt(0).toLocaleUpperCase("tr") + marka.slice(1);

  const palet = sec(PALETLER, tohum);

  const SLOGANLAR = [
    "Fikirden yayına, dakikalar içinde.",
    "Geleceği bugünden inşa et.",
    "Basit. Güçlü. Senin.",
    "Yeni nesil deneyim burada başlıyor.",
    "Hayalini kur, gerisini bize bırak.",
    "Daha hızlı, daha akıllı, daha güzel.",
  ];

  const BOLUM_HAVUZ = ["Kahraman bölümü", "Özellikler ızgarası", "Nasıl çalışır", "Referanslar", "Fiyatlandırma", "SSS", "İletişim / CTA", "Ayak (footer)"];

  return {
    tip,
    marka,
    slogan: sec(SLOGANLAR, tohum + "s"),
    aksan: palet.a,
    aksan2: palet.b,
    zemin: palet.zemin,
    koyu: palet.koyu,
    sektor: sektorObj.ad,
    bolumler: tip === "oyun" ? ["Oyun tuvali", "Skor & kontroller", "Başlat/Duraklat", "Duyarlı yerleşim"] : BOLUM_HAVUZ,
    dosyalar: tip === "oyun"
      ? ["index.html", "style.css", "game.js", "README.md"]
      : ["index.html", "style.css", "main.js", "assets/logo.svg", "README.md"],
  };
}

/* ---- HTML üreticiler ---- */

function ortakStil(p: SitePlan): string {
  const metin = p.koyu ? "#f2f2f7" : "#0a0a0a";
  const metin2 = p.koyu ? "rgba(242,242,247,.62)" : "rgba(10,10,10,.6)";
  const yuzey = p.koyu ? "rgba(255,255,255,.05)" : "rgba(10,10,20,.04)";
  const kenar = p.koyu ? "rgba(255,255,255,.1)" : "rgba(10,10,20,.1)";
  return `
    *{margin:0;padding:0;box-sizing:border-box}
    :root{--a:${p.aksan};--b:${p.aksan2};--bg:${p.zemin};--tx:${metin};--tx2:${metin2};--yz:${yuzey};--kn:${kenar}}
    html{scroll-behavior:smooth}
    body{font-family:'Inter',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--tx);line-height:1.6;overflow-x:hidden}
    a{color:inherit;text-decoration:none}
    .wrap{max-width:1120px;margin:0 auto;padding:0 24px}
    .btn{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,var(--a),var(--b));color:#07070a;font-weight:700;padding:13px 26px;border-radius:12px;border:0;cursor:pointer;font-size:15px;transition:transform .2s,box-shadow .2s;box-shadow:0 8px 30px -8px var(--a)}
    .btn:hover{transform:translateY(-2px);box-shadow:0 14px 40px -10px var(--a)}
    .btn.ghost{background:transparent;color:var(--tx);border:1px solid var(--kn);box-shadow:none}
    .chip{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border:1px solid var(--kn);border-radius:100px;font-size:13px;color:var(--tx2);background:var(--yz)}
    nav{position:fixed;top:0;left:0;right:0;z-index:50;backdrop-filter:blur(14px);background:${p.koyu ? "rgba(10,10,15,.6)" : "rgba(255,255,255,.6)"};border-bottom:1px solid var(--kn)}
    nav .wrap{display:flex;align-items:center;justify-content:space-between;height:64px}
    .logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px}
    .logo .mark{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,var(--a),var(--b));display:grid;place-items:center;color:#07070a;font-weight:900}
    .nlinks{display:flex;gap:28px;font-size:14px;color:var(--tx2)}
    .nlinks a:hover{color:var(--tx)}
    section{padding:96px 0;position:relative}
    .reveal{opacity:0;transform:translateY(24px);transition:opacity .7s,transform .7s}
    .reveal.in{opacity:1;transform:none}
    h1{font-size:clamp(38px,7vw,74px);line-height:1.02;letter-spacing:-.03em;font-weight:800}
    h2{font-size:clamp(28px,4vw,44px);letter-spacing:-.02em;font-weight:800;margin-bottom:14px}
    .grad{background:linear-gradient(135deg,var(--a),var(--b));-webkit-background-clip:text;background-clip:text;color:transparent}
    .lead{font-size:clamp(17px,2vw,21px);color:var(--tx2);max-width:620px}
    .grid{display:grid;gap:20px}
    @media(min-width:720px){.g3{grid-template-columns:repeat(3,1fr)}.g2{grid-template-columns:repeat(2,1fr)}.g4{grid-template-columns:repeat(4,1fr)}}
    .card{background:var(--yz);border:1px solid var(--kn);border-radius:18px;padding:26px;transition:transform .25s,border-color .25s}
    .card:hover{transform:translateY(-5px);border-color:var(--a)}
    .card .ic{width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg,var(--a),var(--b));display:grid;place-items:center;font-size:22px;margin-bottom:16px}
    .hero-orb{position:absolute;border-radius:50%;filter:blur(90px);opacity:.5;z-index:0}
    footer{padding:50px 0;border-top:1px solid var(--kn);color:var(--tx2);font-size:14px;text-align:center}
    .price{text-align:center}.price .amt{font-size:46px;font-weight:800;margin:10px 0}
    .nlinks,.hide-sm{}@media(max-width:719px){.nlinks{display:none}}
  `;
}

const REVEAL_JS = `
<script>
  const io=new IntersectionObserver((es)=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')}),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
</script>`;

function landingHTML(p: SitePlan): string {
  const ozellikler = [
    { i: "⚡", b: "Şimşek hızı", a: "Milisaniyeler içinde yüklenen, optimize edilmiş deneyim." },
    { i: "🎨", b: "Kusursuz tasarım", a: "Piksel hassasiyetinde, markana özel modern arayüz." },
    { i: "🔒", b: "Güvenli altyapı", a: "Uçtan uca şifreleme ve KVKK uyumlu veri yönetimi." },
    { i: "📱", b: "Her ekranda", a: "Mobil, tablet ve masaüstünde birebir mükemmel." },
    { i: "🤖", b: "Akıllı otomasyon", a: "Tekrarlayan işleri senin yerine yapan yapay zeka." },
    { i: "📈", b: "Ölçülebilir sonuç", a: "Gerçek zamanlı analitik ile büyümeni takip et." },
  ];
  const planlar = [
    { ad: "Başlangıç", f: "₺0", not: "Bireysel kullanım", ozel: false },
    { ad: "Profesyonel", f: "₺249", not: "Ekipler için", ozel: true },
    { ad: "Kurumsal", f: "Özel", not: "Sınırsız ölçek", ozel: false },
  ];
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${p.marka} — ${p.slogan}</title><style>${ortakStil(p)}</style></head><body>
<nav><div class="wrap"><div class="logo"><span class="mark">${p.marka.charAt(0)}</span>${p.marka}</div>
<div class="nlinks"><a href="#ozellikler">Özellikler</a><a href="#nasil">Nasıl çalışır</a><a href="#fiyat">Fiyatlandırma</a><a href="#iletisim">İletişim</a></div>
<a href="#iletisim" class="btn" style="padding:9px 18px">Başla</a></div></nav>

<section style="padding-top:150px;text-align:center;overflow:hidden">
  <div class="hero-orb" style="width:420px;height:420px;background:var(--a);top:-80px;left:-60px"></div>
  <div class="hero-orb" style="width:380px;height:380px;background:var(--b);top:40px;right:-40px"></div>
  <div class="wrap" style="position:relative;z-index:1">
    <span class="chip reveal in">${p.sektor} · Yapay zeka ile üretildi</span>
    <h1 class="reveal in" style="margin:22px auto;max-width:900px">Geleceğin <span class="grad">${p.sektor.toLowerCase()}</span> deneyimi <span class="grad">${p.marka}</span> ile.</h1>
    <p class="lead reveal in" style="margin:0 auto 32px">${p.slogan} ${p.marka}, işini bir üst seviyeye taşımak için gereken her şeyi tek çatı altında sunar.</p>
    <div class="reveal in" style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap"><a href="#iletisim" class="btn">Ücretsiz dene →</a><a href="#nasil" class="btn ghost">Nasıl çalışır</a></div>
    <div class="reveal" style="margin-top:60px;height:320px;border-radius:20px;border:1px solid var(--kn);background:linear-gradient(135deg,var(--yz),transparent);display:grid;place-items:center;color:var(--tx2)">✦ Canlı ürün önizlemesi</div>
  </div>
</section>

<section id="ozellikler"><div class="wrap">
  <div class="reveal" style="text-align:center;margin-bottom:50px"><h2>İhtiyacın olan <span class="grad">her şey</span></h2><p class="lead" style="margin:0 auto">Tek platform, sınırsız olasılık.</p></div>
  <div class="grid g3">${ozellikler.map((o, i) => `<div class="card reveal" style="transition-delay:${i * 60}ms"><div class="ic">${o.i}</div><h3 style="font-size:19px;margin-bottom:8px">${o.b}</h3><p style="color:var(--tx2);font-size:15px">${o.a}</p></div>`).join("")}</div>
</div></section>

<section id="nasil" style="background:var(--yz)"><div class="wrap">
  <div class="reveal" style="text-align:center;margin-bottom:50px"><h2>3 adımda <span class="grad">başla</span></h2></div>
  <div class="grid g3">${["Hesabını oluştur", "Markanı özelleştir", "Yayına al & büyü"].map((s, i) => `<div class="reveal card" style="transition-delay:${i * 80}ms"><div class="ic">${i + 1}</div><h3 style="font-size:19px;margin-bottom:8px">${s}</h3><p style="color:var(--tx2);font-size:15px">Dakikalar içinde tamamla, anında sonuç al.</p></div>`).join("")}</div>
</div></section>

<section id="fiyat"><div class="wrap">
  <div class="reveal" style="text-align:center;margin-bottom:50px"><h2>Sana uygun <span class="grad">plan</span></h2></div>
  <div class="grid g3">${planlar.map((pl) => `<div class="card price reveal" style="${pl.ozel ? "border-color:var(--a);box-shadow:0 20px 60px -20px var(--a)" : ""}">${pl.ozel ? '<span class="chip" style="border-color:var(--a);color:var(--a)">En popüler</span>' : ""}<h3 style="font-size:20px;margin-top:10px">${pl.ad}</h3><div class="amt grad">${pl.f}</div><p style="color:var(--tx2);font-size:14px;margin-bottom:18px">${pl.not}</p><a href="#iletisim" class="btn ${pl.ozel ? "" : "ghost"}" style="width:100%;justify-content:center">Seç</a></div>`).join("")}</div>
</div></section>

<section id="iletisim"><div class="wrap reveal" style="text-align:center;background:linear-gradient(135deg,var(--a),var(--b));border-radius:28px;padding:70px 30px;color:#07070a">
  <h2 style="color:#07070a">Bugün ${p.marka} ile başla</h2>
  <p style="font-size:19px;max-width:560px;margin:0 auto 28px;opacity:.85">Binlerce kullanıcı çoktan katıldı. Sıradaki sen ol.</p>
  <a href="#" class="btn" style="background:#07070a;color:#fff" onclick="alert('🎉 ${p.marka} ailesine hoş geldin! (demo)');return false">Ücretsiz hesap aç →</a>
</div></section>

<footer><div class="wrap"><div class="logo" style="justify-content:center;margin-bottom:12px"><span class="mark">${p.marka.charAt(0)}</span>${p.marka}</div>© 2026 ${p.marka}. Vayra Supercomputer ile üretildi.</div></footer>
${REVEAL_JS}</body></html>`;
}

function oyunHTML(p: SitePlan): string {
  // GERÇEK oynanabilir yılan oyunu (canvas + klavye + dokunmatik + skor).
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${p.marka} — Oyun</title><style>${ortakStil(p)}
  body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:18px;text-align:center;padding:20px}
  #skorbar{display:flex;gap:24px;font-weight:700;font-size:18px}
  canvas{border-radius:16px;border:1px solid var(--kn);background:var(--yz);touch-action:none;max-width:92vw;height:auto}
  .ctrl{display:flex;gap:10px}
  </style></head><body>
  <div class="logo" style="font-size:26px"><span class="mark">${p.marka.charAt(0)}</span>${p.marka}</div>
  <p style="color:var(--tx2)">Yılanı yönlendir, elmaları topla. <b>Ok tuşları</b> veya <b>WASD</b> · mobilde kaydır.</p>
  <div id="skorbar"><span>Skor: <span class="grad" id="skor">0</span></span><span>Rekor: <span class="grad" id="rekor">0</span></span></div>
  <canvas id="c" width="420" height="420"></canvas>
  <div class="ctrl"><button class="btn" id="basla">Yeniden Başlat</button><button class="btn ghost" id="dur">Duraklat</button></div>
  <p style="color:var(--tx2);font-size:13px">${p.marka} · Vayra Supercomputer ile üretildi</p>
<script>
const cv=document.getElementById('c'),cx=cv.getContext('2d'),N=21,S=cv.width/N;
let yilan,yon,elma,skor,rekor=+localStorage.getItem('${p.marka}_rekor')||0,dongu,duraklat=false;
document.getElementById('rekor').textContent=rekor;
function basla(){yilan=[{x:10,y:10}];yon={x:1,y:0};elma=yeniElma();skor=0;duraklat=false;guncelleSkor();clearInterval(dongu);dongu=setInterval(tik,95)}
function yeniElma(){let e;do{e={x:(Math.floor(Math.abs(Math.sin(skor*99.7+Date.now()*.001)*1e4))%N),y:(Math.floor(Math.abs(Math.cos(skor*57.3+Date.now()*.001)*1e4))%N)}}while(yilan&&yilan.some(s=>s.x===e.x&&s.y===e.y));return e}
function guncelleSkor(){document.getElementById('skor').textContent=skor}
function tik(){if(duraklat)return;const b={x:(yilan[0].x+yon.x+N)%N,y:(yilan[0].y+yon.y+N)%N};if(yilan.some(s=>s.x===b.x&&s.y===b.y)){if(skor>rekor){rekor=skor;localStorage.setItem('${p.marka}_rekor',rekor);document.getElementById('rekor').textContent=rekor}return basla()}yilan.unshift(b);if(b.x===elma.x&&b.y===elma.y){skor++;guncelleSkor();elma=yeniElma()}else yilan.pop();ciz()}
function ciz(){cx.clearRect(0,0,cv.width,cv.height);const g=cx.createLinearGradient(elma.x*S,elma.y*S,elma.x*S+S,elma.y*S+S);g.addColorStop(0,'${p.aksan}');g.addColorStop(1,'${p.aksan2}');cx.fillStyle=g;cx.beginPath();cx.arc(elma.x*S+S/2,elma.y*S+S/2,S/2-2,0,7);cx.fill();yilan.forEach((s,i)=>{cx.fillStyle=i===0?'${p.aksan}':'${p.aksan2}';cx.globalAlpha=i===0?1:Math.max(.35,1-i/28);const r=6;cx.beginPath();cx.roundRect(s.x*S+1,s.y*S+1,S-2,S-2,r);cx.fill()});cx.globalAlpha=1}
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if((k==='arrowup'||k==='w')&&yon.y===0)yon={x:0,y:-1};else if((k==='arrowdown'||k==='s')&&yon.y===0)yon={x:0,y:1};else if((k==='arrowleft'||k==='a')&&yon.x===0)yon={x:-1,y:0};else if((k==='arrowright'||k==='d')&&yon.x===0)yon={x:1,y:0}});
let tx,ty;cv.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
cv.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;if(Math.abs(dx)>Math.abs(dy)){if(dx>0&&yon.x===0)yon={x:1,y:0};else if(dx<0&&yon.x===0)yon={x:-1,y:0}}else{if(dy>0&&yon.y===0)yon={x:0,y:1};else if(dy<0&&yon.y===0)yon={x:0,y:-1}}});
document.getElementById('basla').onclick=basla;
document.getElementById('dur').onclick=()=>{duraklat=!duraklat;document.getElementById('dur').textContent=duraklat?'Devam':'Duraklat'};
if(cx.roundRect===undefined){CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){this.moveTo(x+r,y);this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);return this}}
basla();
</script></body></html>`;
}

function dashboardHTML(p: SitePlan): string {
  const kpis = [
    { e: "Gelir", v: "₺482.9K", d: "+12.4%" },
    { e: "Aktif Kullanıcı", v: "8.241", d: "+5.1%" },
    { e: "Dönüşüm", v: "%3.8", d: "+0.6%" },
    { e: "Çıkış Oranı", v: "%24", d: "-2.1%" },
  ];
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${p.marka} — Panel</title><style>${ortakStil(p)}
  body{display:flex;min-height:100vh}
  .side{width:230px;border-right:1px solid var(--kn);padding:22px 14px;flex-shrink:0;background:var(--yz)}
  .side a{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:10px;color:var(--tx2);font-size:14px;margin-bottom:2px}
  .side a.on,.side a:hover{background:var(--yz);color:var(--tx)}
  .main{flex:1;padding:26px 30px;overflow:auto}
  .row{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px}
  .kpi{flex:1;min-width:180px;background:var(--yz);border:1px solid var(--kn);border-radius:16px;padding:20px}
  .bars{display:flex;align-items:flex-end;gap:10px;height:200px;padding:20px;background:var(--yz);border:1px solid var(--kn);border-radius:16px}
  .bar{flex:1;border-radius:8px 8px 0 0;background:linear-gradient(180deg,var(--a),var(--b));transition:height 1s}
  @media(max-width:640px){.side{display:none}}
  </style></head><body>
  <aside class="side"><div class="logo" style="margin-bottom:26px"><span class="mark">${p.marka.charAt(0)}</span>${p.marka}</div>
  ${["📊 Genel Bakış", "👥 Kullanıcılar", "💳 Gelir", "📈 Analitik", "⚙️ Ayarlar"].map((m, i) => `<a class="${i === 0 ? "on" : ""}" href="#">${m}</a>`).join("")}</aside>
  <main class="main">
    <h2 style="margin-bottom:4px">Genel Bakış</h2><p style="color:var(--tx2);margin-bottom:24px">Hoş geldin — işte bugünkü performansın.</p>
    <div class="row">${kpis.map((k) => `<div class="kpi"><div style="color:var(--tx2);font-size:13px">${k.e}</div><div style="font-size:28px;font-weight:800;margin:6px 0" class="grad">${k.v}</div><div style="font-size:13px;color:${k.d.startsWith("-") ? "#f87171" : "#4ade80"}">${k.d} bu ay</div></div>`).join("")}</div>
    <h3 style="margin:8px 0 14px">Aylık gelir</h3>
    <div class="bars" id="bars">${[45, 62, 38, 78, 55, 90, 71, 84, 60, 95, 72, 88].map(() => `<div class="bar" style="height:0"></div>`).join("")}</div>
  </main>
<script>
  setTimeout(()=>{const h=[45,62,38,78,55,90,71,84,60,95,72,88];document.querySelectorAll('.bar').forEach((b,i)=>b.style.height=h[i]+'%')},200);
</script></body></html>`;
}

/** Plana göre gerçek çalışan tek-dosya HTML üretir. */
export function siteUret(plan: SitePlan): string {
  if (plan.tip === "oyun") return oyunHTML(plan);
  if (plan.tip === "dashboard") return dashboardHTML(plan);
  return landingHTML(plan); // landing / portfolyo / blog / menu → zengin landing
}

/** Kısayol: istemden doğrudan {plan, html}. */
export function istemdenSite(istem: string): { plan: SitePlan; html: string } {
  const plan = planla(istem);
  return { plan, html: siteUret(plan) };
}

/**
 * Takip/geliştirme mesajı mı? (kısa, değiştirici komut — "rengini değiştir", "büyüt",
 * "koyu yap", "bölüm ekle" gibi). Böyleyse önceki çıktı revize edilir, sıfırdan üretilmez.
 */
export function takipMi(istem: string): boolean {
  const t = istem.toLowerCase().trim();
  if (t.length > 70) return false;
  // Yeni bir üretim tipi ("... bir site/oyun/uygulama yap") isteniyorsa takip DEĞİL.
  const yeniUretim = /\b(site|website|web sitesi|uygulama|app|oyun|game|dashboard|panel|landing)\b/.test(t);
  const degistirici = /(reng|renk|paleti|koyu|açık|büyüt|küçült|değiştir|ekle|çıkar|güncelle|düzelt|canlı|parlak|daha|farklı|başka|animasyon|font|yazı tipi|logo|arttır|azalt)/.test(t);
  return degistirici && !yeniUretim;
}

/** Önceki planı bir takip mesajına göre revize eder (marka/tip korunur, stil değişir). */
export function planiRevizeEt(onceki: SitePlan, istem: string): SitePlan {
  const t = istem.toLowerCase();
  const yeni = { ...onceki };
  // Renk değişikliği istendiyse deterministik olarak farklı palete geç
  if (/(renk|paleti|canlı|parlak|koyu|açık|farklı|başka)/.test(t)) {
    const idx = PALETLER.findIndex((p) => p.a === onceki.aksan);
    const yp = PALETLER[(idx + 1 + hash(istem) % (PALETLER.length - 1)) % PALETLER.length];
    yeni.aksan = yp.a; yeni.aksan2 = yp.b; yeni.zemin = yp.zemin; yeni.koyu = yp.koyu;
  }
  if (/koyu/.test(t) && !yeni.koyu) { const d = PALETLER.find((p) => p.koyu)!; yeni.zemin = d.zemin; yeni.koyu = true; }
  if (/açık/.test(t) && yeni.koyu) { const l = PALETLER.find((p) => !p.koyu)!; yeni.zemin = l.zemin; yeni.koyu = false; }
  return yeni;
}
