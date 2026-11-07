/* Şablon: Tuğla Kır — canvas tuğla kırma oyunu: renkli tuğla katmanları, parçacıklar, ekran sarsıntısı, güçlendiriciler (geniş raket, çoklu top, yavaş top), canlar ve bölümler. Ayarlar ayarlar.json'dan (Vayra Build ayar paneli kaydırıcıları). */

export const TUGLA_KIR = {
  id: "tugla-kir",
  ad: "Tuğla Kır",
  tur: "oyun" as const,
  aciklama: "Rengârenk tuğlalar, güçlendiriciler ve bölümlerle raket ve top oyunu",
  kapak: "/gercek/build/sablon/tugla-kir.webp",
  dosyalar: {
    "index.html": `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
  <meta name="theme-color" content="#f3ebdf" />
  <meta name="description" content="Rengârenk tuğlaları raket ve topla kır: güçlendiriciler, kombolar ve giderek zorlaşan bölümler." />
  <title>Tuğla Kır</title>
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <canvas id="tuval" role="img" aria-label="Tuğla kırma oyun alanı"></canvas>

  <header class="hud">
    <div class="marka">
      <svg class="logo" viewBox="0 0 36 36" aria-hidden="true">
        <rect x="2" y="5" width="15" height="8" rx="3" fill="#ff4d6d" />
        <rect x="19" y="5" width="15" height="8" rx="3" fill="#ffb627" />
        <rect x="10.5" y="15" width="15" height="8" rx="3" fill="#19c3a6" />
        <rect x="8" y="29" width="20" height="4.5" rx="2.25" fill="#22203a" />
        <circle cx="25" cy="26" r="2.6" fill="#22203a" />
      </svg>
      <span>Tuğla Kır</span>
    </div>
    <p class="bolum" id="bolumEtiket"><b id="bolumNo">Bölüm 1</b><span id="bolumAd">Isınma turu</span></p>
    <dl class="sayac">
      <div><dt>Skor</dt><dd id="skor">0</dd></div>
      <div><dt>En iyi</dt><dd id="enIyi">0</dd></div>
    </dl>
    <div class="canlar" id="canlar" role="img" aria-label="3 can"></div>
    <div class="dugmeler">
      <button class="ikon" id="sesDugme" type="button" aria-label="Sesi kapat" aria-pressed="true">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path class="ses-acik" d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Zm11.5-.8a4.5 4.5 0 0 1 0 6.6M17.8 6.3a8 8 0 0 1 0 11.4" /><path class="ses-kapali" d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Zm11.5 0 5 5m0-5-5 5" /></svg>
      </button>
      <button class="ikon" id="durdurDugme" type="button" aria-label="Duraklat">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 6v12M15.5 6v12" /></svg>
      </button>
    </div>
  </header>

  <div class="guclar" id="guclar" aria-live="polite"></div>
  <div class="ilan" id="ilan" aria-live="polite"><span id="ilanUst">Bölüm 2</span><b id="ilanBaslik">Piramit</b></div>

  <div class="perde gorunur" id="perde" data-mod="giris">
    <div class="kart">
      <span class="rozet" id="perdeUst">Arcade klasiği</span>
      <h1 id="perdeBaslik">Tuğla <em>Kır</em></h1>
      <p class="aciklama" id="perdeMetin">Topu raketle karşıla, bütün tuğlaları kır. Düşen kapsülleri yakalarsan güçlenirsin.</p>
      <div class="sonuc" id="sonuc" hidden>
        <div><span>Skor</span><b id="sonSkor">0</b></div>
        <div><span>En iyi</span><b id="sonEnIyi">0</b></div>
        <div><span>Bölüm</span><b id="sonBolum">1</b></div>
      </div>
      <ul class="gucler" id="gucListe">
        <li><i class="g-genis"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4" /></svg></i><div><b>Geniş raket</b><span>Raket 12 saniye boyunca büyür</span></div></li>
        <li><i class="g-coklu"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="14" r="2.6" /><circle cx="12" cy="8" r="2.6" /><circle cx="18" cy="14" r="2.6" /></svg></i><div><b>Çoklu top</b><span>Sahadaki her top üçe bölünür</span></div></li>
        <li><i class="g-yavas"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></svg></i><div><b>Yavaş top</b><span>Toplar 9 saniye yavaşlar</span></div></li>
      </ul>
      <div class="eylemler">
        <button class="basla" id="basla" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5L8 5.5Z" /></svg><span id="baslaYazi">Oyuna başla</span></button>
        <button class="ikincil" id="bastan" type="button" hidden>Baştan başla</button>
      </div>
      <p class="ipucu"><span class="masaustu">Raketi fareyle ya da <kbd>A</kbd> <kbd>D</kbd> ve ok tuşlarıyla sür. Topu <kbd>Boşluk</kbd> ya da tıklamayla fırlat, <kbd>P</kbd> ile duraklat.</span><span class="dokunmatik">Raketi parmağınla sür, topu fırlatmak için ekrana dokun.</span></p>
    </div>
  </div>

  <script src="oyun.js"></script>
</body>
</html>
`,
    "stil.css": `:root {
  --zemin: #f3ebdf;
  --murekkep: #22203a;
  --metin-2: #5d5a72;
  --metin-3: #7c7890;
  --gul: #ff4d6d;
  --turuncu: #ff7a3d;
  --kehribar: #ffb627;
  --camgobegi: #19c3a6;
  --mavi: #3a86ff;
  --mor: #8c5cff;
  --yazi: "Bricolage Grotesque", system-ui, -apple-system, "Segoe UI", sans-serif;
}
* { box-sizing: border-box; }
html, body {
  margin: 0; height: 100%; overflow: hidden; color: var(--murekkep); font-family: var(--yazi);
  -webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none;
  background:
    radial-gradient(42% 50% at 0% 0%, rgba(255, 196, 160, 0.55), transparent 70%),
    radial-gradient(40% 50% at 100% 30%, rgba(206, 190, 255, 0.5), transparent 70%),
    radial-gradient(50% 45% at 30% 110%, rgba(170, 236, 210, 0.55), transparent 70%),
    var(--zemin);
}
button { font: inherit; color: inherit; }
#tuval { position: fixed; inset: 0; width: 100vw; height: 100vh; height: 100dvh; display: block; touch-action: none; cursor: none; }
body.imlecli #tuval { cursor: default; }

/* Üst bilgi */
.hud { position: fixed; z-index: 2; top: 0; left: 0; right: 0; display: flex; align-items: center; gap: 18px;
  padding: max(14px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) 10px max(24px, env(safe-area-inset-left)); pointer-events: none; }
.hud > * { pointer-events: auto; }
.marka { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 22px; letter-spacing: -0.03em; white-space: nowrap; }
.logo { width: 34px; height: 34px; flex: none; }
.bolum { margin: 0 auto; display: inline-flex; align-items: center; gap: 10px; padding: 6px 16px 6px 6px; border-radius: 999px; background: var(--murekkep); color: #fbf6ee; font-size: 14px; white-space: nowrap; }
.bolum b { padding: 5px 11px; border-radius: 999px; background: rgba(255, 255, 255, 0.12); font-weight: 700; }
.bolum span { font-weight: 600; color: rgba(251, 246, 238, 0.82); }
.sayac { margin: 0; display: flex; border-radius: 16px; background: rgba(255, 252, 246, 0.7); border: 1px solid rgba(34, 32, 58, 0.09); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.sayac div { padding: 6px 16px 7px; min-width: 88px; }
.sayac div + div { border-left: 1px solid rgba(34, 32, 58, 0.08); }
.sayac dt { font-size: 12px; font-weight: 600; color: var(--metin-3); }
.sayac dd { margin: 1px 0 0; font-weight: 800; font-size: 22px; line-height: 1.05; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; display: inline-block; transform-origin: left center; }
.sayac .pop dd { animation: pop .3s cubic-bezier(.3, 1.6, .5, 1); }
@keyframes pop { 40% { transform: scale(1.18); } }
.canlar { display: flex; gap: 4px; }
.canlar svg { width: 24px; height: 24px; transition: transform .3s cubic-bezier(.3, 1.6, .5, 1), opacity .3s; }
.canlar .dolu path { fill: var(--gul); }
.canlar .bos path { fill: none; stroke: rgba(34, 32, 58, 0.25); stroke-width: 1.8; }
.canlar .gitti { animation: kalpGit .6s; }
@keyframes kalpGit { 0% { transform: scale(1.5); } 30% { transform: scale(.6) rotate(-12deg); } 100% { transform: none; } }
.dugmeler { display: flex; gap: 8px; }
.ikon { width: 42px; height: 42px; border-radius: 14px; border: 1px solid rgba(34, 32, 58, 0.1); background: rgba(255, 252, 246, 0.75); display: grid; place-items: center; cursor: pointer; color: var(--murekkep); transition: background .2s, transform .15s; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.ikon:hover { background: #fff; }
.ikon:active { transform: scale(0.94); }
.ikon svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2.1; stroke-linecap: round; stroke-linejoin: round; }
.ikon .ses-kapali { display: none; }
.ikon[aria-pressed="false"] .ses-acik { display: none; }
.ikon[aria-pressed="false"] .ses-kapali { display: inline; }
.ikon:focus-visible, .basla:focus-visible, .ikincil:focus-visible { outline: 2.5px solid var(--mavi); outline-offset: 2px; }

/* Etkin güçlendiriciler */
.guclar { position: fixed; z-index: 2; left: 50%; top: 80px; transform: translateX(-50%); display: flex; gap: 8px; pointer-events: none; opacity: .94; }
.guc { display: flex; align-items: center; gap: 9px; padding: 7px 14px 7px 7px; border-radius: 999px; background: rgba(255, 252, 246, 0.86); border: 1px solid rgba(34, 32, 58, 0.1); font-size: 13.5px; font-weight: 700; white-space: nowrap; animation: gucGel .35s cubic-bezier(.3, 1.4, .5, 1); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.guc i { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; color: #fff; }
.guc i svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.guc small { font-weight: 600; color: var(--metin-3); font-variant-numeric: tabular-nums; }
@keyframes gucGel { from { opacity: 0; transform: translateY(10px) scale(.9); } }

/* Bölüm ilanı */
.ilan { position: fixed; z-index: 2; left: 50%; top: 60%; transform: translate(-50%, -50%) scale(.85); opacity: 0; pointer-events: none; text-align: center; display: flex; flex-direction: column; gap: 4px; padding: 14px 32px 18px; border-radius: 28px;
  background: rgba(255, 252, 247, 0.9); border: 1px solid rgba(34, 32, 58, 0.08); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); white-space: nowrap; transition: opacity .35s, transform .5s cubic-bezier(.2, 1.3, .4, 1); }
.ilan.gorunur { opacity: 1; transform: translate(-50%, -50%) scale(1); }
.ilan span { font-size: 16px; font-weight: 700; color: var(--metin-2); }
.ilan b { font-size: clamp(40px, 8vw, 72px); font-weight: 800; letter-spacing: -0.045em; line-height: 1; background: linear-gradient(95deg, var(--gul), var(--kehribar) 50%, var(--mor)); -webkit-background-clip: text; background-clip: text; color: transparent; }

/* Perde: başlangıç, mola, oyun sonu */
.perde { position: fixed; z-index: 3; inset: 0; display: grid; place-items: center; padding: 20px; opacity: 0; pointer-events: none; transition: opacity .35s;
  background: rgba(243, 235, 223, 0.42); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); }
.perde.gorunur { opacity: 1; pointer-events: auto; }
.kart { width: min(440px, 100%); max-height: 100%; overflow: auto; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; padding: 30px 28px 26px; border-radius: 30px;
  background: rgba(255, 252, 247, 0.9); border: 1px solid rgba(34, 32, 58, 0.09); transform: translateY(14px) scale(.98); transition: transform .5s cubic-bezier(.2, 1.1, .3, 1); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.perde.gorunur .kart { transform: none; }
.rozet { display: inline-flex; align-items: center; gap: 8px; padding: 6px 13px; border-radius: 999px; background: rgba(255, 77, 109, 0.1); color: #d6284b; font-size: 13px; font-weight: 700; }
.rozet::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.perde.rekor .rozet { background: rgba(255, 182, 39, 0.16); color: #a86400; }
.kart h1 { margin: 0; font-size: clamp(46px, 9vw, 66px); line-height: .95; font-weight: 800; letter-spacing: -0.05em; }
.kart h1 em { font-style: normal; background: linear-gradient(95deg, var(--gul), var(--turuncu) 45%, var(--kehribar)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.aciklama { margin: 0; max-width: 34ch; font-size: 16px; line-height: 1.5; color: var(--metin-2); font-weight: 500; }
.sonuc { width: 100%; display: grid; grid-template-columns: repeat(3, 1fr); border-radius: 20px; background: #f6efe4; border: 1px solid rgba(34, 32, 58, 0.07); }
.sonuc[hidden] { display: none; }
.sonuc div { padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; }
.sonuc div + div { border-left: 1px solid rgba(34, 32, 58, 0.08); }
.sonuc span { font-size: 12.5px; font-weight: 600; color: var(--metin-3); }
.sonuc b { font-size: 28px; font-weight: 800; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; }
.gucler { list-style: none; margin: 0; padding: 0; width: 100%; border-radius: 20px; background: #f6efe4; border: 1px solid rgba(34, 32, 58, 0.07); text-align: left; }
.gucler[hidden] { display: none; }
.gucler li { display: flex; align-items: center; gap: 12px; padding: 10px 14px; }
.gucler li + li { border-top: 1px solid rgba(34, 32, 58, 0.07); }
.gucler i { width: 36px; height: 36px; border-radius: 12px; flex: none; display: grid; place-items: center; color: #fff; }
.gucler i svg { width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-width: 2.3; stroke-linecap: round; stroke-linejoin: round; }
.g-genis { background: linear-gradient(160deg, #3fdcc0, #13a68d); }
.g-coklu { background: linear-gradient(160deg, #a481ff, #7646f0); }
.g-yavas { background: linear-gradient(160deg, #62a1ff, #2a6fe6); }
.g-coklu svg circle { fill: currentColor; stroke: none; }
.gucler b { display: block; font-size: 15px; font-weight: 700; }
.gucler span { display: block; font-size: 13px; color: var(--metin-2); font-weight: 500; }
.eylemler { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 2px; }
.basla { height: 54px; padding: 0 28px 0 22px; display: inline-flex; align-items: center; gap: 10px; border: 0; border-radius: 999px; cursor: pointer; background: var(--murekkep); color: #fbf6ee; font-weight: 700; font-size: 17px; transition: transform .15s, background .2s; }
.basla svg { width: 20px; height: 20px; fill: #ffb627; }
.basla:hover { background: #33304f; transform: translateY(-1px); }
.basla:active { transform: scale(.97); }
.ikincil { height: 54px; padding: 0 24px; border-radius: 999px; cursor: pointer; background: transparent; border: 1.5px solid rgba(34, 32, 58, 0.16); font-weight: 700; font-size: 16px; transition: background .2s, transform .15s; }
.ikincil:hover { background: rgba(34, 32, 58, 0.05); }
.ikincil:active { transform: scale(.97); }
.ikincil[hidden] { display: none; }
.ipucu { margin: 0; font-size: 13.5px; line-height: 1.85; color: var(--metin-3); font-weight: 500; max-width: 40ch; }
kbd { display: inline-block; min-width: 22px; padding: 0 6px; border-radius: 7px; border: 1px solid rgba(34, 32, 58, 0.16); background: #fff; font: 700 12px/1.6 var(--yazi); color: var(--murekkep); text-align: center; }
.dokunmatik { display: none; }

@media (pointer: coarse) {
  .masaustu { display: none; }
  .dokunmatik { display: inline; }
}
@media (max-width: 760px) {
  .hud { flex-wrap: wrap; row-gap: 10px; column-gap: 10px; padding-left: max(14px, env(safe-area-inset-left)); padding-right: max(14px, env(safe-area-inset-right)); }
  .marka { font-size: 19px; }
  .logo { width: 30px; height: 30px; }
  .ikon { width: 44px; height: 44px; }
  .bolum { order: 3; margin: 0; padding: 4px 12px 4px 4px; font-size: 13px; gap: 8px; }
  .bolum b { padding: 4px 9px; }
  .sayac { order: 4; margin-left: auto; }
  .sayac div { min-width: 0; padding: 4px 12px 5px; }
  .sayac dt { font-size: 11px; }
  .sayac dd { font-size: 18px; }
  .canlar { order: 1; margin-left: auto; }
  .dugmeler { order: 2; margin-left: 0; }
  .guc { padding: 4px 11px 4px 4px; gap: 7px; font-size: 12.5px; }
  .guc i { width: 22px; height: 22px; }
  .guc i svg { width: 13px; height: 13px; }
  .canlar svg { width: 20px; height: 20px; }
  .kart { padding: 24px 20px 20px; gap: 12px; border-radius: 26px; }
  .gucler li { padding: 9px 12px; }
  .aciklama { font-size: 15px; }
}
@media (max-width: 420px) {
  .bolum span { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
`,
    "ayarlar.json": `{
  "topHizi": { "etiket": "Top hızı", "deger": 7, "min": 4, "max": 14, "adim": 0.5 },
  "raketGenisligi": { "etiket": "Raket genişliği (piksel)", "deger": 150, "min": 70, "max": 320, "adim": 10 },
  "can": { "etiket": "Can sayısı", "deger": 3, "min": 1, "max": 9, "adim": 1 },
  "gucOlasiligi": { "etiket": "Güçlendirici olasılığı (yüzde)", "deger": 18, "min": 0, "max": 60, "adim": 1 },
  "siraSayisi": { "etiket": "Tuğla sıra sayısı", "deger": 6, "min": 3, "max": 10, "adim": 1 }
}
`,
    "oyun.js": `// Tuğla Kır — oynanış sayıları ayarlar.json'dan gelir (Vayra Build ayar paneli bu dosyayı düzenler).
var A = { topHizi: 7, raketGenisligi: 150, can: 3, gucOlasiligi: 18, siraSayisi: 6 };

var $ = function (id) { return document.getElementById(id); };
var tuval = $("tuval"), c = tuval.getContext("2d");
var hud = document.querySelector(".hud"), perde = $("perde");
var tepsi = document.createElement("canvas"), tc = tepsi.getContext("2d");
var KAYIT = "tugla-kir-en-iyi", SES_KAYIT = "tugla-kir-ses";
var enIyi = Number(localStorage.getItem(KAYIT) || 0);

var G = 0, Y = 0, dpr = 1, olcek = 1, R = 8, dokunmatik = false;
var alan = { x: 0, y: 0, w: 0, h: 0 };
var izgara = { sutun: 10, sira: 6, tw: 80, th: 26, bosluk: 8, sol: 0, ust: 0 };
var durum = "demo"; // demo · oyun · durdu · gecis · bitti
var bolum = 1, skor = 0, can = 3, kombo = 0, oncekiEnIyi = 0, demoBolum = 1;
var tuglalar = [], toplar = [], kapsuller = [], parcaciklar = [], yazilar = [], halkalar = [];
var raket = { x: 0, y: 0, w: 150, hedefW: 150, h: 16, ezilme: 0 };
var hedefX = null, tusSol = false, tusSag = false, demoSapma = 0, demoFirlat = 0;
var sarsinti = 0, ivme = 1, genisBitis = 0, yavasBitis = 0, gecisBitis = 0, kirmizi = 0;
var zaman = 0, oz = 0, sonZaman = 0;
var sprite = {};

var RENKLER = ["#ff4d6d", "#ff7a3d", "#ffb627", "#8bd346", "#19c3a6", "#3a86ff", "#8c5cff", "#e056c1"];
var GUCLER = {
  genis: { ad: "Geniş raket", renk: "#19c3a6", koyu: "#0f9a83" },
  coklu: { ad: "Çoklu top", renk: "#8c5cff", koyu: "#6a3ce0" },
  yavas: { ad: "Yavaş top", renk: "#3a86ff", koyu: "#2563d9" }
};
var BOLUM_ADLARI = ["Isınma turu", "Piramit", "Dama tahtası", "Dalga", "Kale", "Gökkuşağı", "Kum saati", "Elmas", "Fırtına", "Usta işi"];

function sinirla(v, a, b) { return Math.max(a, Math.min(b, v)); }
function sayi(n) { return Math.round(n).toLocaleString("tr-TR"); }
function rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function ton(h, k) {
  var r = rgb(h).map(function (v) { return k > 0 ? v + (255 - v) * k : v * (1 + k); });
  return "rgb(" + r.map(function (v) { return Math.round(v); }).join(",") + ")";
}
function bolumAdi(n) { return BOLUM_ADLARI[(n - 1) % BOLUM_ADLARI.length]; }

/* ── Ayarlar ── */
fetch("ayarlar.json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
  Object.keys(j).forEach(function (k) { if (j[k] && typeof j[k].deger === "number") A[k] = j[k].deger; });
}).catch(function () {}).then(function () {
  A.can = Math.round(sinirla(A.can, 1, 9));
  A.siraSayisi = Math.round(sinirla(A.siraSayisi, 2, 12));
  can = A.can; canlarCiz(false);
  if (durum === "demo" || durum === "bitti") { yerlesim(); bolumYukle(demoBolum); yeniTop(); }
});

/* ── Yerleşim ── */
function sutunHesapla() { return Math.round(sinirla(alan.w / 92, 6, 13)); }
function yerlesim() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  G = innerWidth; Y = innerHeight;
  tuval.width = Math.round(G * dpr); tuval.height = Math.round(Y * dpr);
  dokunmatik = matchMedia("(pointer: coarse)").matches;
  var kenar = G < 600 ? 10 : 20, ust = hud.offsetHeight + 2;
  var w = Math.min(G - kenar * 2, 1180);
  alan = { x: Math.round((G - w) / 2), y: ust, w: Math.round(w), h: Math.round(Y - ust - kenar) };
  olcek = sinirla(alan.w / 1000, 0.55, 1.2);
  R = Math.max(6.5, 8.5 * Math.min(1.1, sinirla(alan.w / 900, 0.8, 1.1)));
  if (!tuglalar.length) izgara.sutun = sutunHesapla();
  izgara.sira = Math.round(A.siraSayisi);
  izgara.bosluk = alan.w < 520 ? 5 : 8;
  var ic = alan.w < 520 ? 12 : 28;
  izgara.tw = (alan.w - ic * 2 - izgara.bosluk * (izgara.sutun - 1)) / izgara.sutun;
  izgara.th = sinirla(izgara.tw * (alan.w < 520 ? 0.44 : 0.36), 17, 30);
  var sigacak = alan.h * 0.44 / izgara.sira - izgara.bosluk;
  if (izgara.th > sigacak) izgara.th = Math.max(12, sigacak);
  izgara.sol = alan.x + ic;
  izgara.ust = alan.y + (alan.w < 520 ? Math.max(46, alan.h * 0.07) : 58);
  $("guclar").style.top = (alan.y + (alan.w < 520 ? 7 : 10)) + "px";
  tuglalar.forEach(konumla);
  raket.y = alan.y + alan.h - (dokunmatik ? 104 : 50);
  raket.h = Math.max(13, 17 * Math.min(1, olcek * 1.2));
  raket.hedefW = raketGenisligi();
  if (!raket.x) { raket.x = alan.x + alan.w / 2; raket.w = raket.hedefW; }
  raket.x = sinirla(raket.x, alan.x + raket.w / 2, alan.x + alan.w - raket.w / 2);
  sprite = {};
  tepsiCiz();
}
addEventListener("resize", yerlesim);

function raketGenisligi() {
  var w = A.raketGenisligi * olcek * (oz < genisBitis ? 1.6 : 1);
  return Math.min(w, alan.w * 0.6);
}
function topHizi() {
  var h = A.topHizi * 60 * sinirla(alan.h / 760, 0.8, 1.25);
  return h * Math.min(1.5, 1 + 0.06 * (bolum - 1)) * ivme * (oz < yavasBitis ? 0.62 : 1);
}

function tepsiCiz() {
  tepsi.width = Math.round(alan.w * dpr); tepsi.height = Math.round(alan.h * dpr);
  tc.setTransform(dpr, 0, 0, dpr, 0, 0);
  var r = alan.w < 520 ? 22 : 30;
  yol(tc, 0.5, 0.5, alan.w - 1, alan.h - 1, r);
  var g = tc.createLinearGradient(0, 0, 0, alan.h);
  g.addColorStop(0, "#fffcf6"); g.addColorStop(1, "#fbf4ea");
  tc.fillStyle = g; tc.fill();
  tc.save(); tc.clip();
  tc.fillStyle = "rgba(34,32,58,0.075)";
  var a = alan.w < 520 ? 20 : 26;
  for (var y = a / 2; y < alan.h; y += a) for (var x = a / 2; x < alan.w; x += a) { tc.beginPath(); tc.arc(x, y, 1.1, 0, Math.PI * 2); tc.fill(); }
  var alt = tc.createLinearGradient(0, alan.h * 0.78, 0, alan.h);
  alt.addColorStop(0, "rgba(255,77,109,0)"); alt.addColorStop(1, "rgba(255,77,109,0.07)");
  tc.fillStyle = alt; tc.fillRect(0, alan.h * 0.78, alan.w, alan.h * 0.22);
  tc.restore();
  yol(tc, 0.5, 0.5, alan.w - 1, alan.h - 1, r);
  tc.strokeStyle = "rgba(34,32,58,0.1)"; tc.lineWidth = 1; tc.stroke();
}
function yol(x, a, b, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath();
}

/* ── Bölümler ── */
function desen(n, sira, sutun) {
  var g = [], tip = (n - 1) % 10, orta = (sutun - 1) / 2, tohum = n * 7919 + 17;
  function rast() { tohum = (tohum * 9301 + 49297) % 233280; return tohum / 233280; }
  for (var r = 0; r < sira; r++) {
    g[r] = [];
    for (var k = 0; k < sutun; k++) {
      var v = 1, uz = Math.abs(k - orta);
      if (tip === 1) { v = uz <= (r + 1) * (sutun / 2) / sira + 0.01 ? (r < 2 ? 2 : 1) : 0; }
      else if (tip === 2) { v = (r + k) % 2 === 0 ? (r < 2 ? 2 : 1) : 0; }
      else if (tip === 3) { var t = Math.round((Math.sin(k * 0.8) + 1) * 1.1); v = r >= t ? (r === t ? 2 : 1) : 0; }
      else if (tip === 4) { v = r === 0 || k === 0 || k === sutun - 1 ? 2 : (k % 2 === 0 || r === sira - 1 ? 1 : 0); if (r === Math.floor(sira / 2) && uz < 1.5) v = 3; }
      else if (tip === 5) { v = r % 2 === 0 ? 1 : (k % 3 === 1 ? 0 : 2); }
      else if (tip === 6) { v = uz >= Math.abs(r - (sira - 1) / 2) * (sutun / sira) - 0.5 ? 1 : 0; if (v && (r === 0 || r === sira - 1)) v = 2; }
      else if (tip === 7) { v = uz + Math.abs(r - (sira - 1) / 2) * 1.4 <= orta + 0.6 ? 1 : 0; if (v && uz < 1) v = 3; }
      else if (tip >= 8) { var x = rast(); v = x < 0.2 ? 0 : x < 0.6 ? 1 : x < 0.88 ? 2 : 3; }
      g[r][k] = v;
    }
    if (tip >= 8) for (var m = 0; m < Math.floor(sutun / 2); m++) g[r][sutun - 1 - m] = g[r][m];
  }
  return g;
}
function bolumYukle(n) {
  tuglalar = [];
  yerlesim();
  var g = desen(n, izgara.sira, izgara.sutun), say = 0;
  tuglalar = [];
  for (var r = 0; r < izgara.sira; r++) for (var k = 0; k < izgara.sutun; k++) {
    var v = g[r][k];
    if (!v) continue;
    var b = { r: r, k: k, can: v, max: v, renk: r % RENKLER.length, flas: 0, sars: 0, dogum: zaman + r * 0.07 + k * 0.022 };
    konumla(b); tuglalar.push(b); say++;
  }
  if (!say) { bolumYukle(1); return; }
  kapsuller = []; kombo = 0; ivme = 1;
}
function konumla(b) {
  b.x = izgara.sol + b.k * (izgara.tw + izgara.bosluk);
  b.y = izgara.ust + b.r * (izgara.th + izgara.bosluk);
  b.w = izgara.tw; b.h = izgara.th;
}
function bolumYaz() {
  $("bolumNo").textContent = "Bölüm " + bolum;
  $("bolumAd").textContent = bolumAdi(bolum);
}

/* ── Oyun akışı ── */
function yeniTop() {
  toplar = [{ x: raket.x, y: raket.y - R - 1, dx: 0, dy: -1, yapisik: true, ofset: 0, iz: [], renk: "#ff4d6d" }];
  demoFirlat = oz + 0.7;
}
function firlat() {
  var oldu = false;
  toplar.forEach(function (t) {
    if (!t.yapisik) return;
    var a = (Math.random() - 0.5) * 0.7 + t.ofset / (raket.w / 2) * 0.6;
    t.dx = Math.sin(a); t.dy = -Math.cos(a); t.yapisik = false; oldu = true;
  });
  if (oldu && durum === "oyun") bip(520, 0.07, "sine", 0.05);
}
function basla() {
  sesBaslat();
  durum = "oyun"; bolum = 1; skor = 0; can = A.can; kombo = 0; oncekiEnIyi = enIyi;
  genisBitis = yavasBitis = 0; parcaciklar = []; yazilar = []; halkalar = [];
  bolumYukle(1); yeniTop(); bolumYaz(); canlarCiz(false); hudGuncelle(false);
  perdeGizle(); ilanGoster("Bölüm 1", bolumAdi(1));
}
function duraklat() { if (durum !== "oyun") return; durum = "durdu"; perdeGoster("durdu"); }
function devam() { if (durum !== "durdu") return; durum = "oyun"; perdeGizle(); }
function bitir() {
  durum = "bitti";
  if (skor > enIyi) { enIyi = skor; localStorage.setItem(KAYIT, String(enIyi)); }
  hudGuncelle(false); perdeGoster("bitti"); gucleriYaz();
  demoBolum = 1 + Math.floor(Math.random() * 5);
  setTimeout(function () { if (durum === "bitti") { bolumYukle(demoBolum); yeniTop(); } }, 900);
}
function canKaybet() {
  can--; canlarCiz(true);
  sarsinti = 18; kirmizi = 1; kombo = 0; ivme = 1; genisBitis = yavasBitis = 0; kapsuller = [];
  sesKayip();
  if (can <= 0) { bitir(); return; }
  yeniTop();
}
function bolumBitti() {
  if (durum !== "oyun") { demoBolum = demoBolum % 5 + 1; bolumYukle(demoBolum); yeniTop(); return; }
  var bonus = 250 * bolum;
  skor += bonus; hudGuncelle(true);
  yazilar.push({ x: raket.x, y: raket.y - 40, metin: "Bölüm bonusu +" + sayi(bonus), t: zaman, buyuk: true, renk: "#22203a" });
  toplar.forEach(function (t) { patlat(t.x, t.y, ["#22203a", "#ffb627"], 10); });
  toplar = []; kapsuller = [];
  durum = "gecis"; gecisBitis = oz + 2;
  ilanGoster("Bölüm " + (bolum + 1), bolumAdi(bolum + 1));
  [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { bip(f, 0.14, "triangle", 0.06); }, i * 90); });
}

/* ── Fizik ── */
function guncelle(dt) {
  var oto = durum !== "oyun" && durum !== "gecis";
  // Raket
  if (oto) {
    var hedefTop = null;
    toplar.forEach(function (t) { if (!hedefTop || (t.dy > 0 && t.y > hedefTop.y)) hedefTop = t; });
    if (hedefTop) {
      var hx = hedefTop.x + demoSapma;
      raket.x += (hx - raket.x) * Math.min(1, dt * 10);
    }
    if (toplar.length && toplar[0].yapisik && oz > demoFirlat) firlat();
  } else if (tusSol || tusSag) {
    hedefX = null;
    raket.x += ((tusSag ? 1 : 0) - (tusSol ? 1 : 0)) * 1150 * Math.max(0.7, olcek) * dt;
  } else if (hedefX !== null) {
    raket.x += (hedefX - raket.x) * Math.min(1, dt * 28);
  }
  raket.hedefW = raketGenisligi();
  raket.w += (raket.hedefW - raket.w) * Math.min(1, dt * 9);
  raket.x = sinirla(raket.x, alan.x + raket.w / 2, alan.x + alan.w - raket.w / 2);
  raket.ezilme *= Math.pow(0.002, dt);
  // Toplar
  for (var i = 0; i < toplar.length; i++) topGuncelle(toplar[i], dt);
  var once = toplar.length;
  toplar = toplar.filter(function (t) { return !t.oldu; });
  if (once && !toplar.length) { if (durum === "oyun") canKaybet(); else if (oto) yeniTop(); }
  // Kapsüller
  for (var j = kapsuller.length - 1; j >= 0; j--) {
    var k = kapsuller[j];
    k.y += k.vy * dt; k.t += dt;
    var kw = 44 * Math.max(0.8, olcek), kh = 20 * Math.max(0.8, olcek);
    if (k.y + kh / 2 >= raket.y && k.y - kh / 2 <= raket.y + raket.h && k.x + kw / 2 >= raket.x - raket.w / 2 && k.x - kw / 2 <= raket.x + raket.w / 2) { gucAl(k.tur); kapsuller.splice(j, 1); continue; }
    if (k.y - kh > alan.y + alan.h) kapsuller.splice(j, 1);
  }
  if (durum === "gecis" && oz >= gecisBitis) {
    bolum++; durum = "oyun"; bolumYukle(bolum); yeniTop(); bolumYaz();
  }
}

function topGuncelle(t, dt) {
  if (t.yapisik) { t.x = raket.x + t.ofset; t.y = raket.y - R - 1; t.iz.length = 0; return; }
  var v = topHizi(), mesafe = v * dt, adim = Math.max(1, Math.ceil(mesafe / (R * 0.5))), parca = mesafe / adim;
  var izgaraAlt = izgara.ust + izgara.sira * (izgara.th + izgara.bosluk) + R;
  for (var i = 0; i < adim; i++) {
    t.x += t.dx * parca; t.y += t.dy * parca;
    if (t.x - R < alan.x) { t.x = alan.x + R; t.dx = Math.abs(t.dx); duvarSesi(); }
    else if (t.x + R > alan.x + alan.w) { t.x = alan.x + alan.w - R; t.dx = -Math.abs(t.dx); duvarSesi(); }
    if (t.y - R < alan.y) { t.y = alan.y + R; t.dy = Math.abs(t.dy); duvarSesi(); }
    if (t.dy > 0 && t.y + R >= raket.y && t.y - R <= raket.y + raket.h && t.x >= raket.x - raket.w / 2 - R && t.x <= raket.x + raket.w / 2 + R) {
      var o = sinirla((t.x - raket.x) / (raket.w / 2), -1, 1), a = o * 1.05;
      t.dx = Math.sin(a); t.dy = -Math.cos(a); t.y = raket.y - R;
      raketVurdu(t);
    }
    if (t.y - R < izgaraAlt && tuglaCarp(t)) { /* bir tuğla yeter */ }
    if (t.y - R > alan.y + alan.h) { t.oldu = true; return; }
  }
  if (Math.abs(t.dy) < 0.24) { t.dy = t.dy < 0 ? -0.24 : 0.24; }
  var u = Math.hypot(t.dx, t.dy); t.dx /= u; t.dy /= u;
  t.iz.unshift({ x: t.x, y: t.y }); if (t.iz.length > 14) t.iz.pop();
}
function tuglaCarp(t) {
  for (var i = 0; i < tuglalar.length; i++) {
    var b = tuglalar[i];
    if (b.can <= 0) continue;
    var cx = sinirla(t.x, b.x, b.x + b.w), cy = sinirla(t.y, b.y, b.y + b.h), dx = t.x - cx, dy = t.y - cy;
    if (dx * dx + dy * dy > R * R) continue;
    var ox = b.w / 2 + R - Math.abs(t.x - (b.x + b.w / 2)), oy = b.h / 2 + R - Math.abs(t.y - (b.y + b.h / 2));
    if (ox < oy) { if (t.x < b.x + b.w / 2) { t.x -= ox; t.dx = -Math.abs(t.dx); } else { t.x += ox; t.dx = Math.abs(t.dx); } }
    else { if (t.y < b.y + b.h / 2) { t.y -= oy; t.dy = -Math.abs(t.dy); } else { t.y += oy; t.dy = Math.abs(t.dy); } }
    vur(b, t);
    return true;
  }
  return false;
}
function raketVurdu(t) {
  raket.ezilme = 1; kombo = 0;
  ivme = Math.min(1.22, ivme + 0.008);
  demoSapma = (Math.random() - 0.5) * raket.w * 0.7;
  patlat(t.x, raket.y, ["#ffffff"], 4);
  if (durum === "oyun") bip(260, 0.06, "sine", 0.06);
}
function vur(b, t) {
  b.can--; b.flas = 1; b.sars = 1;
  var renk = b.max === 3 ? "#9aa6b8" : RENKLER[b.renk];
  t.renk = renk;
  if (b.can > 0) {
    patlat(t.x, t.y, [b.max === 3 ? "#c9d1dc" : ton(renk, 0.3), "#ffffff"], 5);
    sarsinti = Math.max(sarsinti, 1.5);
    if (durum === "oyun") { skor += 5; hudGuncelle(false); bip(b.max === 3 ? 880 : 600, 0.05, "square", 0.025); }
    return;
  }
  kir(b, renk);
}
function kir(b, renk) {
  var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  kombo++;
  patlat(cx, cy, [renk, ton(renk, 0.35), ton(renk, -0.2)], 16);
  patlat(cx, cy, ["#ffffff"], 5);
  halkalar.push({ x: cx, y: cy, t: zaman, renk: renk, r: b.w * 0.75 });
  sarsinti = Math.max(sarsinti, b.max === 3 ? 7 : 4);
  if (durum === "oyun") {
    var carpan = 1 + Math.floor(kombo / 4);
    var puan = (10 * (izgara.sira - b.r) + (b.max - 1) * 20) * carpan;
    skor += puan; hudGuncelle(true);
    yazilar.push({ x: cx, y: cy, metin: "+" + sayi(puan), t: zaman, buyuk: false, renk: "#22203a" });
    if (kombo >= 4 && kombo % 4 === 0) yazilar.push({ x: cx, y: cy - 30, metin: "Kombo " + kombo, t: zaman + 0.05, buyuk: true, renk: renk });
    bip(300 + (izgara.sira - b.r) * 70 + Math.min(kombo, 12) * 25, 0.1, "triangle", 0.06);
  }
  if (Math.random() * 100 < A.gucOlasiligi) {
    var turler = ["genis", "coklu", "yavas", "genis", "coklu"];
    kapsuller.push({ x: cx, y: cy, vy: 175 * Math.max(0.8, olcek), t: 0, tur: turler[Math.floor(Math.random() * turler.length)] });
  }
  if (!tuglalar.some(function (x) { return x.can > 0; })) bolumBitti();
}
function gucAl(tur) {
  var g = GUCLER[tur];
  halkalar.push({ x: raket.x, y: raket.y, t: zaman, renk: g.renk, r: raket.w * 0.45 });
  patlat(raket.x, raket.y, [g.renk, "#ffffff"], 14);
  if (tur === "genis") genisBitis = oz + 12;
  else if (tur === "yavas") yavasBitis = oz + 9;
  else if (tur === "coklu") {
    var yeni = [];
    toplar.forEach(function (t) {
      if (t.yapisik) { t.yapisik = false; t.dx = 0; t.dy = -1; }
      [-0.45, 0.45].forEach(function (d) {
        if (toplar.length + yeni.length >= 14) return;
        var c0 = Math.cos(d), s0 = Math.sin(d);
        yeni.push({ x: t.x, y: t.y, dx: t.dx * c0 - t.dy * s0, dy: t.dx * s0 + t.dy * c0, yapisik: false, ofset: 0, iz: [], renk: g.renk });
      });
    });
    toplar = toplar.concat(yeni);
  }
  if (durum === "oyun") {
    yazilar.push({ x: raket.x, y: raket.y - 34, metin: g.ad, t: zaman, buyuk: true, renk: g.koyu });
    [660, 880, 1320].forEach(function (f, i) { setTimeout(function () { bip(f, 0.1, "triangle", 0.05); }, i * 70); });
  }
  gucleriYaz();
}

/* ── Efektler ── */
function patlat(x, y, renkler, n) {
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2, h = (90 + Math.random() * 330) * Math.max(0.7, olcek);
    var toz = renkler[0] === "#ffffff";
    parcaciklar.push({ x: x, y: y, vx: Math.cos(a) * h, vy: Math.sin(a) * h - 120, a: Math.random() * 6, va: (Math.random() - 0.5) * 14,
      w: toz ? 4 : 5 + Math.random() * 7, h: toz ? 4 : 3 + Math.random() * 4, omur: 0, max: 0.6 + Math.random() * 0.7, renk: renkler[i % renkler.length], toz: toz });
  }
}
function efektGuncelle(dt) {
  var yer = 1500 * Math.max(0.7, olcek);
  for (var i = parcaciklar.length - 1; i >= 0; i--) {
    var p = parcaciklar[i];
    p.omur += dt; p.vy += yer * dt; p.vx *= Math.pow(0.4, dt); p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt;
    if (p.omur > p.max) parcaciklar.splice(i, 1);
  }
  for (var j = yazilar.length - 1; j >= 0; j--) if (zaman - yazilar[j].t > 1.1) yazilar.splice(j, 1);
  for (var k = halkalar.length - 1; k >= 0; k--) if (zaman - halkalar[k].t > 0.45) halkalar.splice(k, 1);
  tuglalar.forEach(function (b) { b.flas = Math.max(0, b.flas - dt * 6); b.sars = Math.max(0, b.sars - dt * 5); });
  tuglalar = tuglalar.filter(function (b) { return b.can > 0 || b.flas > 0; });
  sarsinti *= Math.pow(0.0005, dt); kirmizi = Math.max(0, kirmizi - dt * 2);
}

/* ── Çizim ── */
function tuglaSprite(b) {
  var anahtar = b.renk + ":" + b.can + ":" + b.max;
  if (sprite[anahtar]) return sprite[anahtar];
  var w = izgara.tw, h = izgara.th, d = Math.max(3, h * 0.16), r = Math.min(9, h * 0.34);
  var cv = document.createElement("canvas"), x = cv.getContext("2d");
  cv.width = Math.ceil((w + 2) * dpr); cv.height = Math.ceil((h + d + 2) * dpr);
  x.setTransform(dpr, 0, 0, dpr, dpr, dpr);
  var metal = b.max === 3, ana = metal ? "#c3ccd8" : RENKLER[b.renk];
  yol(x, 0, d, w, h, r); x.fillStyle = metal ? "#8d98a9" : ton(ana, -0.3); x.fill();
  yol(x, 0, 0, w, h, r);
  var g = x.createLinearGradient(0, 0, 0, h);
  if (metal) { g.addColorStop(0, "#f4f7fb"); g.addColorStop(0.5, "#d3dae4"); g.addColorStop(1, "#b4bfcd"); }
  else { g.addColorStop(0, ton(ana, 0.28)); g.addColorStop(1, ana); }
  x.fillStyle = g; x.fill();
  yol(x, r * 0.7, h * 0.16, w * 0.42, Math.max(2, h * 0.17), h * 0.09); x.fillStyle = "rgba(255,255,255,0.55)"; x.fill();
  if (b.max === 2) { yol(x, 3, 3, w - 6, h - 6, Math.max(2, r - 3)); x.strokeStyle = "rgba(255,255,255,0.75)"; x.lineWidth = 1.6; x.stroke(); }
  if (metal) {
    x.fillStyle = "#7f8a9c";
    [[5, 5], [w - 5, 5], [5, h - 5], [w - 5, h - 5]].forEach(function (p) { x.beginPath(); x.arc(p[0], p[1], 1.6, 0, Math.PI * 2); x.fill(); });
  }
  var catlak = b.max - b.can;
  if (catlak > 0) {
    x.strokeStyle = metal ? "rgba(60,68,84,0.6)" : "rgba(34,32,58,0.45)"; x.lineWidth = 1.4; x.lineCap = "round"; x.lineJoin = "round";
    x.beginPath(); x.moveTo(w * 0.32, 0); x.lineTo(w * 0.4, h * 0.38); x.lineTo(w * 0.33, h * 0.62); x.lineTo(w * 0.42, h); x.moveTo(w * 0.4, h * 0.38); x.lineTo(w * 0.52, h * 0.5);
    if (catlak > 1) { x.moveTo(w * 0.74, 0); x.lineTo(w * 0.68, h * 0.45); x.lineTo(w * 0.78, h * 0.7); x.moveTo(w * 0.68, h * 0.45); x.lineTo(w * 0.58, h * 0.6); }
    x.stroke();
  }
  sprite[anahtar] = cv;
  return cv;
}
function tuglalariCiz() {
  for (var i = 0; i < tuglalar.length; i++) {
    var b = tuglalar[i];
    var gt = sinirla((zaman - b.dogum) / 0.45, 0, 1);
    if (gt <= 0) continue;
    var e = 1 - Math.pow(1 - gt, 3), oy = (1 - e) * -36 + Math.sin(b.sars * Math.PI * 3) * b.sars * 2.5;
    c.save();
    c.globalAlpha = e;
    if (b.can > 0) {
      var s = tuglaSprite(b);
      c.drawImage(s, b.x - 1, b.y - 1 + oy, s.width / dpr, s.height / dpr);
    }
    if (b.flas > 0) {
      c.globalAlpha = b.flas * (b.can > 0 ? 0.6 : 0.9);
      var bw = b.w * (1 + (b.can > 0 ? 0 : (1 - b.flas) * 0.25)), bh = b.h * (1 + (b.can > 0 ? 0 : (1 - b.flas) * 0.25));
      yol(c, b.x + (b.w - bw) / 2, b.y + oy + (b.h - bh) / 2, bw, bh, Math.min(9, b.h * 0.34)); c.fillStyle = "#ffffff"; c.fill();
    }
    c.restore();
  }
}
function raketCiz() {
  var e = raket.ezilme, w = raket.w * (1 + e * 0.07), h = raket.h * (1 - e * 0.22), x = raket.x - w / 2, y = raket.y + (raket.h - h);
  var genis = oz < genisBitis, d = Math.max(3, h * 0.28);
  yol(c, x, y + d, w, h, h / 2); c.fillStyle = genis ? "#0c7f6c" : "#121026"; c.fill();
  yol(c, x, y, w, h, h / 2);
  var g = c.createLinearGradient(0, y, 0, y + h);
  if (genis) { g.addColorStop(0, "#4be3c8"); g.addColorStop(1, "#16b598"); } else { g.addColorStop(0, "#3b3760"); g.addColorStop(1, "#22203a"); }
  c.fillStyle = g; c.fill();
  var s = c.createLinearGradient(x, 0, x + w, 0);
  s.addColorStop(0, "#ff4d6d"); s.addColorStop(0.3, "#ffb627"); s.addColorStop(0.55, "#19c3a6"); s.addColorStop(0.8, "#3a86ff"); s.addColorStop(1, "#8c5cff");
  yol(c, x + h * 0.55, y + h * 0.24, w - h * 1.1, Math.max(2, h * 0.2), h * 0.1); c.fillStyle = genis ? "rgba(255,255,255,0.75)" : s; c.fill();
  c.fillStyle = genis ? "#ffffff" : "#ffb627";
  c.beginPath(); c.arc(x + h * 0.5, y + h * 0.5, h * 0.17, 0, Math.PI * 2); c.arc(x + w - h * 0.5, y + h * 0.5, h * 0.17, 0, Math.PI * 2); c.fill();
}
function topCiz() {
  for (var i = 0; i < toplar.length; i++) {
    var t = toplar[i];
    for (var j = t.iz.length - 1; j >= 1; j--) {
      var p = t.iz[j], k = 1 - j / t.iz.length;
      c.globalAlpha = k * 0.5; c.fillStyle = t.renk;
      c.beginPath(); c.arc(p.x, p.y, R * (0.35 + k * 0.55), 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
    var g = c.createRadialGradient(t.x - R * 0.35, t.y - R * 0.4, R * 0.1, t.x, t.y, R);
    g.addColorStop(0, "#5a5684"); g.addColorStop(1, "#1c1a33");
    c.fillStyle = g; c.beginPath(); c.arc(t.x, t.y, R, 0, Math.PI * 2); c.fill();
    c.fillStyle = "rgba(255,255,255,0.85)"; c.beginPath(); c.arc(t.x - R * 0.34, t.y - R * 0.36, R * 0.26, 0, Math.PI * 2); c.fill();
  }
}
function kapsulCiz() {
  for (var i = 0; i < kapsuller.length; i++) {
    var k = kapsuller[i], g = GUCLER[k.tur], o = Math.max(0.8, olcek), w = 44 * o, h = 20 * o;
    c.save();
    c.translate(k.x, k.y); c.rotate(Math.sin(k.t * 5) * 0.12);
    yol(c, -w / 2, -h / 2 + 3, w, h, h / 2); c.fillStyle = g.koyu; c.fill();
    yol(c, -w / 2, -h / 2, w, h, h / 2);
    var gr = c.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, ton(g.renk, 0.3)); gr.addColorStop(1, g.renk);
    c.fillStyle = gr; c.fill();
    c.strokeStyle = "#ffffff"; c.fillStyle = "#ffffff"; c.lineWidth = 2 * o; c.lineCap = "round"; c.lineJoin = "round";
    var s = h * 0.28;
    c.beginPath();
    if (k.tur === "genis") { c.moveTo(-s * 2, 0); c.lineTo(s * 2, 0); c.moveTo(-s * 1.2, -s * 0.8); c.lineTo(-s * 2, 0); c.lineTo(-s * 1.2, s * 0.8); c.moveTo(s * 1.2, -s * 0.8); c.lineTo(s * 2, 0); c.lineTo(s * 1.2, s * 0.8); c.stroke(); }
    else if (k.tur === "coklu") { [-1.4, 0, 1.4].forEach(function (p, n) { c.moveTo(p * s + s * 0.55, n === 1 ? -s * 0.45 : s * 0.3); c.arc(p * s, n === 1 ? -s * 0.45 : s * 0.3, s * 0.55, 0, Math.PI * 2); }); c.fill(); }
    else { c.arc(0, 0, s * 1.15, 0, Math.PI * 2); c.moveTo(0, -s * 0.6); c.lineTo(0, 0); c.lineTo(s * 0.5, s * 0.3); c.stroke(); }
    c.restore();
  }
}
function parcacikCiz() {
  for (var i = 0; i < parcaciklar.length; i++) {
    var p = parcaciklar[i], a = 1 - p.omur / p.max;
    c.globalAlpha = Math.max(0, Math.min(1, a * 1.6));
    c.fillStyle = p.renk;
    if (p.toz) { c.beginPath(); c.arc(p.x, p.y, p.w * 0.5 * a + 0.5, 0, Math.PI * 2); c.fill(); }
    else { c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore(); }
  }
  c.globalAlpha = 1;
}
function halkaCiz() {
  for (var i = 0; i < halkalar.length; i++) {
    var h = halkalar[i], k = (zaman - h.t) / 0.45;
    c.globalAlpha = 1 - k; c.strokeStyle = h.renk; c.lineWidth = 3 * (1 - k) + 0.5;
    c.beginPath(); c.ellipse(h.x, h.y, h.r * (0.4 + k * 0.8), h.r * (0.4 + k * 0.8) * 0.55, 0, 0, Math.PI * 2); c.stroke();
  }
  c.globalAlpha = 1;
}
function yaziCiz() {
  c.textAlign = "center"; c.textBaseline = "middle"; c.lineJoin = "round";
  for (var i = 0; i < yazilar.length; i++) {
    var y = yazilar[i], yas = zaman - y.t;
    if (yas < 0) continue;
    var k = yas / 1.1, olc = y.buyuk ? 1 + Math.max(0, 0.35 - yas * 2) : 1;
    c.globalAlpha = Math.max(0, 1 - k * k);
    c.font = "800 " + Math.round((y.buyuk ? 24 : 17) * Math.max(0.85, olcek) * olc) + "px 'Bricolage Grotesque', system-ui, sans-serif";
    var yy = y.y - yas * 46;
    c.lineWidth = 5; c.strokeStyle = "rgba(255,252,246,0.95)"; c.strokeText(y.metin, y.x, yy);
    c.fillStyle = y.renk; c.fillText(y.metin, y.x, yy);
  }
  c.globalAlpha = 1;
}
function ipucuCiz() {
  if (durum !== "oyun" || !toplar.length || !toplar[0].yapisik) return;
  var t = toplar[0], a = 0.55 + 0.35 * Math.sin(zaman * 4);
  c.save();
  c.globalAlpha = a; c.strokeStyle = "#22203a"; c.lineWidth = 2; c.setLineDash([3, 7]); c.lineCap = "round";
  c.beginPath(); c.moveTo(t.x, t.y - R - 6); c.lineTo(t.x, t.y - R - 70); c.stroke();
  c.setLineDash([]);
  c.globalAlpha = 0.75;
  c.font = "600 " + Math.round(15 * Math.max(0.9, olcek)) + "px 'Bricolage Grotesque', system-ui, sans-serif";
  c.textAlign = "center"; c.fillStyle = "#4a4766";
  c.fillText(dokunmatik ? "Fırlatmak için dokun" : "Fırlatmak için tıkla ya da boşluğa bas", t.x, t.y - R - 92);
  c.restore();
}
function ciz() {
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, G, Y);
  var sx = sarsinti > 0.3 ? (Math.random() - 0.5) * 2 * sarsinti : 0, sy = sarsinti > 0.3 ? (Math.random() - 0.5) * 2 * sarsinti : 0;
  c.translate(sx, sy);
  c.drawImage(tepsi, alan.x, alan.y, alan.w, alan.h);
  c.save();
  yol(c, alan.x, alan.y, alan.w, alan.h, alan.w < 520 ? 22 : 30); c.clip();
  tuglalariCiz(); halkaCiz(); kapsulCiz(); raketCiz(); topCiz(); parcacikCiz(); yaziCiz(); ipucuCiz();
  c.restore();
  if (kirmizi > 0) {
    c.globalAlpha = kirmizi; c.strokeStyle = "#ff4d6d"; c.lineWidth = 5;
    yol(c, alan.x + 2.5, alan.y + 2.5, alan.w - 5, alan.h - 5, alan.w < 520 ? 20 : 28); c.stroke(); c.globalAlpha = 1;
  }
}

/* ── Arayüz ── */
var KALP = '<path d="M12 20.3s-7.4-4.5-9.2-9.1C1.6 7.9 3.7 4.6 7.2 4.6c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.5 0 5.6 3.3 4.4 6.6-1.8 4.6-9.2 9.1-9.2 9.1Z"/>';
function canlarCiz(kayip) {
  var toplam = Math.max(A.can, can), h = "";
  for (var i = 0; i < toplam; i++) h += '<svg viewBox="0 0 24 24" class="' + (i < can ? "dolu" : "bos") + (kayip && i === can ? " gitti" : "") + '" aria-hidden="true">' + KALP + "</svg>";
  $("canlar").innerHTML = h;
  $("canlar").setAttribute("aria-label", can + " can");
}
function hudGuncelle(pop) {
  $("skor").textContent = sayi(skor);
  $("enIyi").textContent = sayi(Math.max(enIyi, skor));
  if (pop) { var el = $("skor").parentNode; el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
}
var IKON = {
  genis: '<path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/>',
  coklu: '<circle cx="6" cy="14" r="2.2"/><circle cx="12" cy="8" r="2.2"/><circle cx="18" cy="14" r="2.2"/>',
  yavas: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>'
};
var cipler = {};
function gucleriYaz() {
  var etkin = durum === "oyun" || durum === "durdu" || durum === "gecis";
  var liste = {
    genis: etkin && oz < genisBitis ? Math.ceil(genisBitis - oz) + " sn" : null,
    yavas: etkin && oz < yavasBitis ? Math.ceil(yavasBitis - oz) + " sn" : null,
    coklu: etkin && toplar.length > 1 ? toplar.length + " top" : null
  };
  Object.keys(liste).forEach(function (tur) {
    var deger = liste[tur], el = cipler[tur];
    if (deger && !el) {
      el = document.createElement("div"); el.className = "guc";
      el.innerHTML = '<i style="background:' + GUCLER[tur].renk + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + IKON[tur] + "</svg></i>" + GUCLER[tur].ad + " <small></small>";
      $("guclar").appendChild(el); cipler[tur] = el;
    }
    if (!deger && el) { el.remove(); delete cipler[tur]; }
    if (deger && el.lastChild.textContent !== deger) el.lastChild.textContent = deger;
  });
}
setInterval(gucleriYaz, 200);

var ilanZaman = null;
function ilanGoster(ust, baslik) {
  $("ilanUst").textContent = ust; $("ilanBaslik").textContent = baslik;
  var el = $("ilan"); el.classList.add("gorunur");
  clearTimeout(ilanZaman); ilanZaman = setTimeout(function () { el.classList.remove("gorunur"); }, 1700);
}
function perdeGoster(mod) {
  perde.setAttribute("data-mod", mod);
  var rekor = mod === "bitti" && skor > 0 && skor > oncekiEnIyi;
  perde.classList.toggle("rekor", rekor);
  $("sonuc").hidden = mod !== "bitti";
  $("gucListe").hidden = mod !== "giris";
  $("bastan").hidden = mod !== "durdu";
  if (mod === "durdu") {
    $("perdeUst").textContent = "Mola";
    $("perdeBaslik").innerHTML = "Duraklatıldı";
    $("perdeMetin").textContent = "Top havada bekliyor. Hazır olduğunda kaldığın yerden devam et.";
    $("baslaYazi").textContent = "Devam et";
  } else if (mod === "bitti") {
    $("perdeUst").textContent = rekor ? "Yeni rekor" : "Oyun bitti";
    $("perdeBaslik").innerHTML = rekor ? "Rekor <em>senin</em>" : "Az <em>kaldı</em>";
    $("perdeMetin").textContent = rekor ? "En iyi skorunu geride bıraktın. Sıradaki bölümler daha sıkı tuğlalarla bekliyor." : "Bu tur " + bolum + ". bölüme kadar geldin. Kapsülleri yakalamak işini çok kolaylaştırır.";
    $("sonSkor").textContent = sayi(skor); $("sonEnIyi").textContent = sayi(enIyi); $("sonBolum").textContent = bolum;
    $("baslaYazi").textContent = "Tekrar oyna";
  }
  perde.classList.add("gorunur");
  document.body.classList.add("imlecli");
}
function perdeGizle() { perde.classList.remove("gorunur"); document.body.classList.remove("imlecli"); }

/* ── Girdi ── */
tuval.addEventListener("pointermove", function (e) { if (durum === "oyun" || durum === "gecis") hedefX = e.clientX; });
tuval.addEventListener("pointerdown", function (e) {
  if (durum !== "oyun" && durum !== "gecis") return;
  hedefX = e.clientX;
  if (durum === "oyun") firlat();
});
addEventListener("keydown", function (e) {
  var k = e.code, hedef = e.target && e.target.tagName;
  if (k === "ArrowLeft" || k === "KeyA") { tusSol = true; e.preventDefault(); return; }
  if (k === "ArrowRight" || k === "KeyD") { tusSag = true; e.preventDefault(); return; }
  if ((k === "Space" || k === "Enter") && hedef === "BUTTON") return;
  if (k === "Space" || k === "Enter" || k === "ArrowUp" || k === "KeyW") {
    e.preventDefault();
    if (durum === "oyun") firlat(); else if (durum === "durdu") devam(); else if (durum === "demo" || durum === "bitti") basla();
  } else if (k === "KeyP" || k === "Escape") {
    if (durum === "oyun") duraklat(); else if (durum === "durdu") devam();
  }
});
addEventListener("keyup", function (e) {
  if (e.code === "ArrowLeft" || e.code === "KeyA") tusSol = false;
  if (e.code === "ArrowRight" || e.code === "KeyD") tusSag = false;
});
$("basla").addEventListener("click", function () { this.blur(); if (durum === "durdu") devam(); else basla(); });
$("bastan").addEventListener("click", function () { this.blur(); basla(); });
$("durdurDugme").addEventListener("click", function () { this.blur(); if (durum === "oyun") duraklat(); else if (durum === "durdu") devam(); });
document.addEventListener("visibilitychange", function () { if (document.hidden) duraklat(); });

/* ── Ses ── */
var ses = null, sesAcik = localStorage.getItem(SES_KAYIT) !== "0", sonDuvar = 0;
function sesBaslat() { if (ses || !sesAcik) return; try { ses = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ses = null; } }
function bip(frek, sure, tip, hacim) {
  if (!ses || !sesAcik) return;
  try {
    var t = ses.currentTime, o = ses.createOscillator(), g = ses.createGain();
    o.type = tip; o.frequency.setValueAtTime(frek, t); o.frequency.exponentialRampToValueAtTime(frek * 1.25, t + sure);
    g.gain.setValueAtTime(hacim, t); g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    o.connect(g); g.connect(ses.destination); o.start(t); o.stop(t + sure + 0.02);
  } catch (e) {}
}
function duvarSesi() { if (durum === "oyun" && zaman - sonDuvar > 0.06) { sonDuvar = zaman; bip(180, 0.04, "sine", 0.03); } }
function sesKayip() {
  if (!ses || !sesAcik) return;
  try {
    var t = ses.currentTime, o = ses.createOscillator(), g = ses.createGain();
    o.type = "sawtooth"; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.5);
    g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.connect(g); g.connect(ses.destination); o.start(t); o.stop(t + 0.57);
  } catch (e) {}
}
function sesDugmesi() { var b = $("sesDugme"); b.setAttribute("aria-pressed", sesAcik ? "true" : "false"); b.setAttribute("aria-label", sesAcik ? "Sesi kapat" : "Sesi aç"); }
$("sesDugme").addEventListener("click", function () {
  sesAcik = !sesAcik; localStorage.setItem(SES_KAYIT, sesAcik ? "1" : "0"); sesDugmesi(); this.blur();
  if (sesAcik) { sesBaslat(); bip(520, 0.08, "triangle", 0.05); }
});
sesDugmesi();

/* ── Döngü ── */
function dongu(an) {
  var dt = sonZaman ? Math.min(0.05, (an - sonZaman) / 1000) : 1 / 60;
  sonZaman = an; zaman += dt;
  if (durum !== "durdu") { oz += dt; guncelle(dt); efektGuncelle(dt); }
  ciz();
  requestAnimationFrame(dongu);
}

yerlesim(); bolumYukle(demoBolum); yeniTop(); bolumYaz(); canlarCiz(false); hudGuncelle(false);
document.body.classList.add("imlecli");
requestAnimationFrame(dongu);
`,
    "ikon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="18" fill="#fbf4ea" />
  <rect x="8" y="11" width="22" height="11" rx="4" fill="#ff4d6d" />
  <rect x="34" y="11" width="22" height="11" rx="4" fill="#ffb627" />
  <rect x="21" y="26" width="22" height="11" rx="4" fill="#19c3a6" />
  <circle cx="44" cy="45" r="4.5" fill="#22203a" />
  <rect x="14" y="51" width="32" height="7" rx="3.5" fill="#22203a" />
</svg>
`,
  },
};
