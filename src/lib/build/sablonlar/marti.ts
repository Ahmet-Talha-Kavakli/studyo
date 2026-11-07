/* Şablon: Martı — Boğaz'da kanat çırpan martıyla dokun ve uç oyunu (canvas). Paralaks İstanbul silüeti (camiler, minareler,
 * kıyı evleri, Boğaz köprüsü, vapurlar), skora göre gündüzden akşama ve geceye dönen gökyüzü, minare ve köprü kulesi engelleri,
 * bonus simitler, madalyalar, en iyi skor, WebAudio sesleri. Oynanış sayıları ayarlar.json'da (Vayra Build ayar paneli). */

const HTML = String.raw`<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
  <meta name="theme-color" content="#5fb4e8" />
  <meta name="description" content="Martı: Boğaz'da kanat çırp, minarelerin ve köprü kulelerinin arasından geç, simitleri kap." />
  <title>Martı · Boğaz'da Uç</title>
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@500;600;700;800&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <main class="sahne" id="sahne">
    <canvas id="tuval" role="img" aria-label="Martı oyun alanı"></canvas>

    <header class="hud">
      <div class="marka">
        <img class="logo" src="ikon.svg" alt="" width="36" height="36" />
        <span>Martı</span>
      </div>
      <div class="skor" id="skor" aria-live="polite">0</div>
      <div class="sag">
        <div class="cip" title="Toplanan simit"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.5" fill="none" stroke="#d9822f" stroke-width="5" /></svg><b id="simitSayi">0</b></div>
        <div class="cip enIyiCip" title="En iyi skor"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9l-5.3 2.7 1-5.8-4.2-4.1 5.9-.9z" fill="#ffd166" /></svg><b id="enIyi">0</b></div>
        <button class="ikon" id="sesDugme" type="button" aria-label="Sesi kapat" aria-pressed="true">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path class="ses-acik" d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Zm11.5-.8a4.5 4.5 0 0 1 0 6.6M17.8 6.3a8 8 0 0 1 0 11.4" /><path class="ses-kapali" d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Zm11.5 0 5 5m0-5-5 5" /></svg>
        </button>
        <button class="ikon" id="durdurDugme" type="button" aria-label="Duraklat" hidden>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 6v12M15.5 6v12" /></svg>
        </button>
      </div>
    </header>

    <div class="perde gorunur" id="perde" data-mod="giris">
      <div class="kart">
        <div class="giris-icerik">
          <img class="buyuk-logo" src="ikon.svg" alt="" width="84" height="84" />
          <p class="ust-yazi">Boğaz'da süzül</p>
          <h1>Martı</h1>
          <p class="aciklama">Ekrana dokun ya da boşluk tuşuna bas, martı kanat çırpsın. Minarelerin ve köprü kulelerinin arasından geç, simitleri kap.</p>
          <ul class="madalyalar" aria-label="Madalyalar">
            <li><i class="madalya bronz"></i><span>Bronz</span><b>10</b></li>
            <li><i class="madalya gumus"></i><span>Gümüş</span><b>25</b></li>
            <li><i class="madalya altin"></i><span>Altın</span><b>50</b></li>
            <li><i class="madalya elmas"></i><span>Elmas</span><b>80</b></li>
          </ul>
        </div>
        <div class="mola-icerik">
          <p class="ust-yazi">Kısa bir mola</p>
          <h2>Mola</h2>
          <p class="aciklama">Martı havada bekliyor. Hazır olduğunda devam et.</p>
        </div>
        <div class="son-icerik">
          <p class="ust-yazi" id="sonUst">Suya düştün</p>
          <div class="son-madalya"><i class="madalya" id="sonMadalya"></i><span id="sonMadalyaAd">Madalya yok</span></div>
          <div class="sonuc">
            <div><span>Skor</span><b id="sonSkor">0</b></div>
            <div><span>En iyi</span><b id="sonEnIyi">0</b></div>
            <div><span>Simit</span><b id="sonSimit">0</b></div>
          </div>
          <p class="rekor" id="rekor" hidden>Yeni rekor!</p>
          <p class="aciklama kucuk" id="sonrakiHedef"></p>
        </div>
        <div class="eylemler">
          <button class="basla" id="basla" type="button">Uçuşa başla</button>
          <button class="ikincil" id="bastan" type="button" hidden>Baştan başla</button>
        </div>
        <p class="ipucu"><span class="masaustu"><kbd>Boşluk</kbd> ya da tıklama ile kanat çırp, <kbd>P</kbd> ile duraklat.</span><span class="dokunmatik">Ekranın herhangi bir yerine dokunarak kanat çırp.</span></p>
      </div>
    </div>
  </main>

  <script src="oyun.js"></script>
</body>
</html>
`;

const STIL = String.raw`/* Martı — Boğaz mavisi, simit turuncusu, kırık beyaz kart; Baloo 2 ve Nunito. */
:root {
  --murekkep: #13233a;
  --metin-2: #4a5a70;
  --metin-3: #6b7a90;
  --simit: #e0782f;
  --simit-koyu: #b95a1c;
  --bogaz: #1f6f9a;
  --kagit: rgba(255, 250, 241, 0.94);
  --baslik: "Baloo 2", system-ui, sans-serif;
  --yazi: "Nunito", system-ui, -apple-system, "Segoe UI", sans-serif;
}
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; overflow: hidden; background: #5fb4e8; font-family: var(--yazi); color: var(--murekkep);
  -webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none; }
button { font: inherit; color: inherit; cursor: pointer; touch-action: manipulation; }
[hidden] { display: none !important; }
.sahne { position: fixed; inset: 0; touch-action: none; }
#tuval { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }

/* Üst bilgi */
.hud { position: absolute; z-index: 2; top: 0; left: 0; right: 0; display: grid; grid-template-columns: 1fr auto 1fr; align-items: start; gap: 12px;
  padding: max(14px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) 0 max(20px, env(safe-area-inset-left)); pointer-events: none; }
.hud button, .hud .cip { pointer-events: auto; }
.marka { display: flex; align-items: center; gap: 10px; font-family: var(--baslik); font-weight: 800; font-size: 26px; color: #fff; text-shadow: 0 2px 0 rgba(19, 35, 58, 0.25); }
.logo { width: 36px; height: 36px; border-radius: 11px; }
.skor { font-family: var(--baslik); font-weight: 800; font-size: 64px; line-height: 1; color: #fff; text-align: center; min-width: 80px; font-variant-numeric: tabular-nums;
  -webkit-text-stroke: 2px rgba(19, 35, 58, 0.55); paint-order: stroke fill; text-shadow: 0 4px 0 rgba(19, 35, 58, 0.28); transition: transform .15s; }
.skor.pop { animation: skorPop .25s cubic-bezier(.3, 1.6, .5, 1); }
@keyframes skorPop { 40% { transform: scale(1.18); } }
.sahne.giris .skor { visibility: hidden; }
.sag { display: flex; justify-content: flex-end; align-items: center; gap: 8px; }
.cip { display: flex; align-items: center; gap: 6px; height: 42px; padding: 0 14px 0 10px; border-radius: 999px; background: rgba(255, 250, 241, 0.82); border: 1px solid rgba(19, 35, 58, 0.08);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); font-weight: 800; font-size: 16px; font-variant-numeric: tabular-nums; }
.cip svg { width: 22px; height: 22px; }
.ikon { width: 42px; height: 42px; border-radius: 14px; border: 1px solid rgba(19, 35, 58, 0.08); background: rgba(255, 250, 241, 0.82); display: grid; place-items: center;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); transition: transform .12s, background .2s; }
.ikon:hover { background: #fff; }
.ikon:active { transform: scale(0.93); }
.ikon svg { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 2.1; stroke-linecap: round; stroke-linejoin: round; }
.ikon .ses-kapali { display: none; }
.ikon[aria-pressed="false"] .ses-acik { display: none; }
.ikon[aria-pressed="false"] .ses-kapali { display: inline; }
:focus-visible { outline: 3px solid var(--simit); outline-offset: 2px; }

/* Perde */
.perde { position: absolute; z-index: 3; inset: 0; display: grid; place-items: center; padding: 84px 18px 24px; opacity: 0; pointer-events: none; transition: opacity .3s; }
.perde.gorunur { opacity: 1; pointer-events: auto; }
.kart { width: min(420px, 100%); max-height: 100%; overflow: auto; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center;
  padding: 26px 26px 22px; border-radius: 30px; background: var(--kagit); border: 1px solid rgba(19, 35, 58, 0.08);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); transform: translateY(12px) scale(.98); transition: transform .45s cubic-bezier(.2, 1.2, .3, 1); }
.perde.gorunur .kart { transform: none; }
.giris-icerik, .mola-icerik, .son-icerik { display: none; flex-direction: column; align-items: center; gap: 8px; width: 100%; }
.perde[data-mod="giris"] .giris-icerik, .perde[data-mod="mola"] .mola-icerik, .perde[data-mod="bitti"] .son-icerik { display: flex; }
.buyuk-logo { width: 84px; height: 84px; border-radius: 24px; animation: suzul 3s ease-in-out infinite; }
@keyframes suzul { 50% { transform: translateY(-6px) rotate(-3deg); } }
.ust-yazi { margin: 0; font-weight: 800; font-size: 14px; color: var(--bogaz); }
h1, h2 { margin: -4px 0 0; font-family: var(--baslik); font-weight: 800; line-height: 1; letter-spacing: -0.01em; }
h1 { font-size: 64px; }
h2 { font-size: 48px; }
.aciklama { margin: 0; color: var(--metin-2); font-size: 15.5px; line-height: 1.5; max-width: 340px; }
.aciklama.kucuk { font-size: 14px; }
.madalyalar { list-style: none; margin: 6px 0 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; width: 100%; }
.madalyalar li { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 10px 4px 8px; border-radius: 16px; background: rgba(19, 35, 58, 0.04); }
.madalyalar span { font-size: 12.5px; font-weight: 700; color: var(--metin-3); }
.madalyalar b { font-family: var(--baslik); font-size: 18px; line-height: 1; }
.madalya { width: 34px; height: 34px; border-radius: 50%; display: block; position: relative; background: #d7dde4; }
.madalya::after { content: ""; position: absolute; inset: 6px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.6);
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3 13c3-4 6-4 9-1 3-3 6-3 9 1-3-1.5-6-1-9 2-3-3-6-3.5-9-2z' fill='white' fill-opacity='.9'/%3E%3C/svg%3E") center / 70% no-repeat; }
.madalya.bronz { background: radial-gradient(circle at 35% 30%, #f3b98a, #b8692f 70%); }
.madalya.gumus { background: radial-gradient(circle at 35% 30%, #ffffff, #9aa7b6 70%); }
.madalya.altin { background: radial-gradient(circle at 35% 30%, #fff1a8, #e0a21b 70%); }
.madalya.elmas { background: radial-gradient(circle at 35% 30%, #e6fbff, #4cc3dd 55%, #7a7fe6 90%); }
.son-madalya { display: flex; flex-direction: column; align-items: center; gap: 6px; margin: 4px 0; }
.son-madalya .madalya { width: 76px; height: 76px; animation: madalyaGel .7s cubic-bezier(.2, 1.5, .4, 1); }
.son-madalya .madalya::after { inset: 11px; border-width: 3px; }
.son-madalya span { font-weight: 800; font-size: 15px; color: var(--metin-2); }
@keyframes madalyaGel { from { transform: scale(.3) rotate(-40deg); opacity: 0; } }
.sonuc { display: grid; grid-template-columns: repeat(3, 1fr); width: 100%; border-radius: 18px; background: rgba(19, 35, 58, 0.05); }
.sonuc div { padding: 10px 6px 12px; display: flex; flex-direction: column; gap: 2px; }
.sonuc div + div { border-left: 1px solid rgba(19, 35, 58, 0.08); }
.sonuc span { font-size: 13px; font-weight: 700; color: var(--metin-3); }
.sonuc b { font-family: var(--baslik); font-size: 34px; line-height: 1; font-variant-numeric: tabular-nums; }
.rekor { margin: 0; padding: 6px 14px; border-radius: 999px; background: #ffe7c9; color: var(--simit-koyu); font-weight: 800; font-size: 14px; animation: madalyaGel .6s cubic-bezier(.2, 1.5, .4, 1); }
.eylemler { display: flex; flex-direction: column; gap: 8px; width: 100%; margin-top: 4px; }
.basla { min-height: 54px; border: 0; border-radius: 18px; background: var(--simit); color: #fff; font-family: var(--baslik); font-weight: 800; font-size: 21px;
  box-shadow: inset 0 -4px 0 var(--simit-koyu); transition: transform .12s, filter .2s; }
.basla:hover { filter: brightness(1.06); }
.basla:active { transform: translateY(2px); box-shadow: inset 0 -2px 0 var(--simit-koyu); }
.ikincil { min-height: 46px; border-radius: 16px; border: 1.5px solid rgba(19, 35, 58, 0.14); background: transparent; font-weight: 800; font-size: 15.5px; }
.ikincil:hover { background: rgba(19, 35, 58, 0.05); }
.ipucu { margin: 0; font-size: 13.5px; color: var(--metin-3); line-height: 1.5; }
kbd { font-family: var(--yazi); font-weight: 800; font-size: 12px; padding: 2px 7px; border-radius: 6px; background: rgba(19, 35, 58, 0.07); border: 1px solid rgba(19, 35, 58, 0.1); }
.dokunmatik { display: none; }
@media (pointer: coarse) { .masaustu { display: none; } .dokunmatik { display: inline; } }

@media (max-width: 600px) {
  .hud { grid-template-columns: auto 1fr auto; padding-left: max(14px, env(safe-area-inset-left)); padding-right: max(14px, env(safe-area-inset-right)); gap: 8px; }
  .marka span { display: none; }
  .skor { font-size: 52px; }
  .enIyiCip { display: none; }
  .cip { height: 40px; padding: 0 12px 0 8px; }
  .ikon { width: 40px; height: 40px; }
  h1 { font-size: 56px; }
  .kart { padding: 22px 18px 18px; border-radius: 26px; }
}
@media (max-height: 620px) { .buyuk-logo { display: none; } .madalyalar { display: none; } }
@media (prefers-reduced-motion: reduce) { .buyuk-logo { animation: none; } }
`;

const OYUN = String.raw`// Martı — oynanış sayıları ayarlar.json'dan gelir (Vayra Build ayar paneli bu dosyayı düzenler). Dünya birimi: ekran yüksekliği 640 birim.
var A = { yercekimi: 1500, kanatGucu: 470, aralik: 165, hiz: 190, simitOlasiligi: 35, direkAraligi: 270 };

var $ = function (id) { return document.getElementById(id); };
var sahne = $("sahne"), tuval = $("tuval"), c = tuval.getContext("2d"), perde = $("perde");
var H = 640, SU = 572, W = 900, olcek = 1, dpr = 1, cssW = 0, cssH = 0;
var durum = "giris"; // giris · hazir · oyun · mola · oluyor · bitti
var kus = { x: 260, y: 270, vy: 0, faz: 0, aci: 0 };
var direkler = [], simitler = [], parcaciklar = [], yazilar = [], vapurlar = [];
var skor = 0, simitSayisi = 0, kaydirma = 0, zaman = 0, sarsinti = 0, flas = 0, sonrakiVapur = 3, kilitBitis = 0;
var enIyi = Number(oku("marti-en-iyi", "0")) || 0;
var ses = oku("marti-ses", "1") !== "0", ses_ = null;

function oku(k, v) { try { var x = localStorage.getItem(k); return x == null ? v : x; } catch (e) { return v; } }
function yaz(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) { /* yok */ } }
function sinirla(v, a, b) { return Math.max(a, Math.min(b, v)); }
function rastgele(a, b) { return a + Math.random() * (b - a); }
/* Tohumlu rastgele: silüet her açılışta aynı. */
function tohumlu(t) { var s = t >>> 0; return function () { s = (s + 0x6d2b79f5) >>> 0; var x = s; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }

/* ── Renk paleti: gündüz, ikindi, akşam, gece (skora göre yumuşakça geçer) ── */
var PALET = [
  { gok1: "#4aa8e6", gok2: "#cdeaf6", uzak: "#9cc0d3", uzak2: "#86aec4", kopru: "#6f93ab", yakin: "#5b7f98", su1: "#2f8bb6", su2: "#145a7d", bulut: "#ffffff", gunes: "#fff6cf" },
  { gok1: "#f29a63", gok2: "#ffe0a8", uzak: "#d79a86", uzak2: "#c4857a", kopru: "#9c6a68", yakin: "#7c5260", su1: "#d1806a", su2: "#5d3f63", bulut: "#ffe9d6", gunes: "#ffd27a" },
  { gok1: "#33377a", gok2: "#ef8f72", uzak: "#5a4a78", uzak2: "#4b3f6c", kopru: "#3b3158", yakin: "#2c2647", su1: "#4a4482", su2: "#1d1b3d", bulut: "#f7b5a6", gunes: "#ff9d6e" },
  { gok1: "#070d26", gok2: "#232b5c", uzak: "#1d2348", uzak2: "#181d3e", kopru: "#141933", yakin: "#0e1229", su1: "#15204a", su2: "#060a1c", bulut: "#56608f", gunes: "#f4f1e6" },
];
var renk = {}, vakit = 0, hedefVakit = 0;
function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
var PALET_RGB = PALET.map(function (p) { var o = {}; Object.keys(p).forEach(function (k) { o[k] = hex(p[k]); }); return o; });
function paletHesapla() {
  var v = ((vakit % 4) + 4) % 4, i = Math.floor(v), t = v - i, a = PALET_RGB[i], b = PALET_RGB[(i + 1) % 4];
  t = t * t * (3 - 2 * t);
  Object.keys(a).forEach(function (k) { renk[k] = "rgb(" + Math.round(a[k][0] + (b[k][0] - a[k][0]) * t) + "," + Math.round(a[k][1] + (b[k][1] - a[k][1]) * t) + "," + Math.round(a[k][2] + (b[k][2] - a[k][2]) * t) + ")"; });
  // gece etkisi: 0 gündüz, 1 tam gece
  var g = [0, 0.05, 0.45, 1][i], g2 = [0, 0.05, 0.45, 1][(i + 1) % 4];
  renk.gece = g + (g2 - g) * t;
}

/* ── Silüet (tohumlu üretim) ── */
var UZAK_P = 1500, YAKIN_P = 1150, KOPRU_P = 1800, BULUT_P = 1700;
var uzak = { tepeler: [], camiler: [], binalar: [] }, yakin = { evler: [], kule: 0 }, bulutlar = [], yildizlar = [];
(function () {
  var r = tohumlu(1453), x;
  for (x = 0; x <= UZAK_P; x += 75) uzak.tepeler.push([x, 70 + r() * 70]);
  uzak.tepeler[uzak.tepeler.length - 1][1] = uzak.tepeler[0][1];
  [{ x: 230, r: 34 }, { x: 760, r: 26 }, { x: 1190, r: 38 }].forEach(function (m) {
    var n = m.r > 30 ? 4 : 2, min = [];
    for (var i = 0; i < n; i++) { var yan = i % 2 ? 1 : -1, sira = Math.floor(i / 2); min.push({ dx: yan * (m.r * 1.55 + sira * m.r * 0.75), h: 95 + m.r * 1.3 - sira * 18 }); }
    uzak.camiler.push({ x: m.x, r: m.r, minare: min });
  });
  for (x = 0; x < UZAK_P; x += 16 + r() * 30) uzak.binalar.push({ x: x, w: 14 + r() * 26, h: 10 + r() * 26 });
  for (x = 0; x < YAKIN_P; x += 10 + r() * 22) {
    if (x > 420 && x < 520) continue;
    var h = 18 + r() * 52, w = 22 + r() * 30, cati = r() > 0.4;
    var pencere = [];
    for (var py = 8; py < h - 6; py += 11) for (var px = 5; px < w - 6; px += 9) if (r() > 0.45) pencere.push([px, py]);
    yakin.evler.push({ x: x, w: w, h: h, cati: cati, pencere: pencere, yanik: r() });
    x += w * 0.6;
  }
  yakin.kule = 470;
  for (var b = 0; b < 5; b++) { var tops = []; for (var k = 0; k < 6; k++) tops.push([k * 18 + r() * 8, -r() * 14, 14 + r() * 14]); bulutlar.push({ x: b * 340 + r() * 120, y: 50 + r() * 160, s: 0.7 + r() * 0.7, t: tops }); }
  for (var s = 0; s < 110; s++) yildizlar.push([r() * 2400, r() * 380, 0.4 + r() * 1.3, r() * 6.28]);
})();

/* ── Ayarlar ── */
fetch("ayarlar.json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
  Object.keys(j).forEach(function (k) { if (j[k] && typeof j[k].deger === "number") A[k] = j[k].deger; });
}).catch(function () {}).then(function () {
  A.yercekimi = sinirla(A.yercekimi, 300, 4000); A.kanatGucu = sinirla(A.kanatGucu, 150, 1200);
  A.aralik = sinirla(A.aralik, 90, 400); A.hiz = sinirla(A.hiz, 60, 600); A.direkAraligi = sinirla(A.direkAraligi, 150, 700);
});

/* ── Yerleşim: yükseklik her zaman 640 birim, genişlik ekrana göre ── */
function yerlesim() {
  dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  cssW = sahne.clientWidth; cssH = sahne.clientHeight;
  olcek = cssH / H; W = cssW / olcek;
  tuval.width = Math.round(cssW * dpr); tuval.height = Math.round(cssH * dpr);
  kus.x = Math.min(W * 0.3, 320);
}
addEventListener("resize", yerlesim);

/* ── Ses ── */
function sesBaslat() { if (!ses_) { try { ses_ = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ses_ = null; } } if (ses_ && ses_.state === "suspended") ses_.resume(); }
function bip(f, f2, sure, tip, vol, gecikme) {
  if (!ses || !ses_) return;
  var t = ses_.currentTime + (gecikme || 0), o = ses_.createOscillator(), g = ses_.createGain();
  o.type = tip || "sine"; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + sure);
  g.gain.setValueAtTime(vol || 0.07, t); g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
  o.connect(g); g.connect(ses_.destination); o.start(t); o.stop(t + sure + 0.03);
}
function sicrama() {
  if (!ses || !ses_) return;
  var n = ses_.sampleRate * 0.35, b = ses_.createBuffer(1, n, ses_.sampleRate), d = b.getChannelData(0);
  for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.2);
  var s = ses_.createBufferSource(), f = ses_.createBiquadFilter(), g = ses_.createGain();
  f.type = "lowpass"; f.frequency.value = 900; g.gain.value = 0.22; s.buffer = b; s.connect(f); f.connect(g); g.connect(ses_.destination); s.start();
}
function sesDugmesi() { var d = $("sesDugme"); d.setAttribute("aria-pressed", String(ses)); d.setAttribute("aria-label", ses ? "Sesi kapat" : "Sesi aç"); }
$("sesDugme").addEventListener("click", function () { ses = !ses; yaz("marti-ses", ses ? "1" : "0"); sesDugmesi(); sesBaslat(); bip(660, 0, 0.08, "triangle", 0.05); this.blur(); });
sesDugmesi();

/* ── Oyun akışı ── */
function suankiHiz() { return A.hiz * (1 + Math.min(skor, 60) * 0.005); }
function hazirla() {
  sesBaslat();
  direkler = []; simitler = []; parcaciklar = []; yazilar = [];
  skor = 0; simitSayisi = 0; hedefVakit = 0; flas = 0;
  kus.y = H * 0.42; kus.vy = 0; kus.aci = 0;
  durum = "hazir"; arayuz();
  skorYaz(false);
}
function kanatCirp() {
  if (durum === "hazir") { durum = "oyun"; arayuz(); direkKoy(W + 60); }
  if (durum !== "oyun") return;
  kus.vy = -A.kanatGucu; kus.faz = 0;
  bip(520, 780, 0.09, "triangle", 0.05);
}
function direkKoy(x) {
  var bosluk = Math.max(110, A.aralik - Math.min(skor, 40) * 0.6);
  var onceki = direkler.length ? direkler[direkler.length - 1].y : H * 0.45;
  var ust = 70 + bosluk / 2, alt = SU - 70 - bosluk / 2;
  var y = sinirla(onceki + rastgele(-170, 170), ust, alt);
  direkler.push({ x: x, y: y, b: bosluk, gecildi: false, w: 66 });
  if (direkler.length > 1 && Math.random() * 100 < A.simitOlasiligi) {
    var o = direkler[direkler.length - 2];
    simitler.push({ x: (o.x + o.w / 2 + x + 33) / 2, y: (o.y + y) / 2 + rastgele(-40, 40), alindi: false, faz: Math.random() * 6 });
  }
}
function bitir() {
  durum = "oluyor"; sarsinti = 14; flas = 1; arayuz();
  bip(200, 60, 0.3, "sawtooth", 0.07);
  for (var i = 0; i < 14; i++) parcaciklar.push({ x: kus.x, y: kus.y, vx: rastgele(-160, 160), vy: rastgele(-260, 40), om: rastgele(-6, 6), a: Math.random() * 6, o: 1.4, tur: "tuy" });
  if (kus.vy < 0) kus.vy = 0;
}
function suyaDus() {
  sicrama(); sarsinti = Math.max(sarsinti, 8);
  for (var i = 0; i < 22; i++) parcaciklar.push({ x: kus.x + rastgele(-10, 10), y: SU, vx: rastgele(-120, 120), vy: rastgele(-380, -120), o: 0.9, tur: "damla" });
  durum = "bitti"; kilitBitis = performance.now() + 700;
  var rekor = skor > enIyi;
  if (rekor) { enIyi = skor; yaz("marti-en-iyi", enIyi); }
  yaz("marti-toplam-simit", (Number(oku("marti-toplam-simit", "0")) || 0) + simitSayisi);
  setTimeout(function () { sonucGoster(rekor); }, 650);
}
function madalya(s) { return s >= 80 ? ["elmas", "Elmas madalya"] : s >= 50 ? ["altin", "Altın madalya"] : s >= 25 ? ["gumus", "Gümüş madalya"] : s >= 10 ? ["bronz", "Bronz madalya"] : ["", "Madalya yok"]; }
function sonucGoster(rekor) {
  if (durum !== "bitti") return;
  var m = madalya(skor), esik = [10, 25, 50, 80].filter(function (e) { return e > skor; })[0];
  $("sonUst").textContent = skor >= 25 ? "Muhteşem bir uçuştu" : skor >= 10 ? "Güzel uçtun" : "Suya düştün";
  $("sonMadalya").className = "madalya " + m[0];
  $("sonMadalya").style.visibility = m[0] ? "visible" : "hidden";
  $("sonMadalyaAd").textContent = m[1];
  $("sonSkor").textContent = skor; $("sonEnIyi").textContent = enIyi; $("sonSimit").textContent = simitSayisi;
  $("rekor").hidden = !rekor || skor === 0;
  $("sonrakiHedef").textContent = esik ? "Sıradaki madalya için " + (esik - skor) + " puan daha." : "Bütün madalyaları topladın, Boğaz'ın en hızlı martısı sensin.";
  perde.dataset.mod = "bitti"; $("basla").textContent = "Tekrar uç"; $("bastan").hidden = true;
  perde.classList.add("gorunur");
  $("enIyi").textContent = enIyi;
}
function arayuz() {
  sahne.classList.toggle("giris", durum === "giris");
  $("durdurDugme").hidden = !(durum === "oyun" || durum === "hazir");
  if (durum === "hazir" || durum === "oyun" || durum === "oluyor") perde.classList.remove("gorunur");
}
function duraklat() {
  if (durum !== "oyun" && durum !== "hazir") return;
  durum = "mola"; perde.dataset.mod = "mola"; $("basla").textContent = "Devam et"; $("bastan").hidden = false; perde.classList.add("gorunur"); arayuz();
}
function devam() { durum = kus.vy === 0 && !direkler.length ? "hazir" : "oyun"; perde.classList.remove("gorunur"); arayuz(); onceki = performance.now(); }
$("durdurDugme").addEventListener("click", function () { this.blur(); duraklat(); });
$("basla").addEventListener("click", function () { this.blur(); if (durum === "mola") devam(); else if (durum !== "bitti" || performance.now() > kilitBitis) hazirla(); });
$("bastan").addEventListener("click", function () { this.blur(); hazirla(); });
document.addEventListener("visibilitychange", function () { if (document.hidden) duraklat(); });

sahne.addEventListener("pointerdown", function (e) {
  if (e.target.closest("button") || e.target.closest(".kart")) return;
  if (durum === "hazir" || durum === "oyun") { e.preventDefault(); kanatCirp(); }
});
addEventListener("keydown", function (e) {
  var k = e.key;
  if (k === " " || k === "ArrowUp" || k === "w" || k === "W" || k === "Enter") {
    e.preventDefault(); if (e.repeat) return;
    if (durum === "hazir" || durum === "oyun") kanatCirp();
    else if (durum === "mola") devam();
    else if (durum === "giris" || (durum === "bitti" && performance.now() > kilitBitis)) hazirla();
  } else if (k === "p" || k === "P" || k === "Escape") { if (durum === "mola") devam(); else duraklat(); }
});

function skorYaz(pop) { var s = $("skor"); s.textContent = skor; if (pop) { s.classList.remove("pop"); void s.offsetWidth; s.classList.add("pop"); } $("simitSayi").textContent = simitSayisi; }

/* ── Çarpışma ── */
function daireDik(cx, cy, r, x, y, w, h) { var nx = sinirla(cx, x, x + w), ny = sinirla(cy, y, y + h), dx = cx - nx, dy = cy - ny; return dx * dx + dy * dy < r * r; }
function daireUcgen(cx, cy, r, p) {
  // nokta içeride mi ya da kenara uzaklık r'den küçük mü
  var ic = true, i, j;
  for (i = 0; i < 3; i++) { j = (i + 1) % 3; if ((p[j][0] - p[i][0]) * (cy - p[i][1]) - (p[j][1] - p[i][1]) * (cx - p[i][0]) > 0) ic = false; }
  if (ic) return true;
  for (i = 0; i < 3; i++) {
    j = (i + 1) % 3; var ax = p[i][0], ay = p[i][1], bx = p[j][0], by = p[j][1], vx = bx - ax, vy = by - ay;
    var t = sinirla(((cx - ax) * vx + (cy - ay) * vy) / (vx * vx + vy * vy), 0, 1), dx = cx - (ax + vx * t), dy = cy - (ay + vy * t);
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}
function carpiyor(d) {
  var r = 12.5, ustBit = d.y - d.b / 2, altBas = d.y + d.b / 2;
  if (daireDik(kus.x, kus.y, r, d.x, -50, d.w, ustBit - 12 + 50)) return true; // köprü kulesi
  if (daireDik(kus.x, kus.y, r, d.x - 6, ustBit - 14, d.w + 12, 14)) return true; // başlık kirişi
  if (daireUcgen(kus.x, kus.y, r, [[d.x - 3, altBas + 30], [d.x + d.w / 2, altBas], [d.x + d.w + 3, altBas + 30]])) return true; // külah
  if (daireDik(kus.x, kus.y, r, d.x - 7, altBas + 30, d.w + 14, 9)) return true; // şerefe
  if (daireDik(kus.x, kus.y, r, d.x + 4, altBas + 39, d.w - 8, H)) return true; // gövde
  return false;
}

/* ── Güncelleme ── */
function guncelle(dt) {
  zaman += dt;
  var hz = suankiHiz(), akiyor = durum === "giris" || durum === "hazir" || durum === "oyun";
  if (akiyor) kaydirma += hz * dt;
  hedefVakit = durum === "giris" ? 0 : skor / 18;
  vakit += (hedefVakit - vakit) * Math.min(1, dt * 0.8);
  if (durum === "giris" && Math.abs(vakit - hedefVakit) < 0.001) vakit = 0;

  if (durum === "giris" || durum === "hazir") {
    kus.y = H * 0.42 + Math.sin(zaman * 3) * 9; kus.aci = Math.sin(zaman * 3 + 1) * 0.06; kus.faz += dt * 13;
  } else if (durum === "oyun") {
    kus.vy = Math.min(kus.vy + A.yercekimi * dt, 900); kus.y += kus.vy * dt;
    if (kus.y < 14) { kus.y = 14; kus.vy = Math.max(0, kus.vy); }
    kus.faz += dt * (kus.vy < 80 ? 24 : 7);
    kus.aci += (sinirla(kus.vy / 620, -0.45, 1.25) - kus.aci) * Math.min(1, dt * 10);
    direkler.forEach(function (d) {
      d.x -= hz * dt;
      if (!d.gecildi && d.x + d.w / 2 < kus.x) { d.gecildi = true; skor++; skorYaz(true); bip(880, 0, 0.07, "sine", 0.06); bip(1320, 0, 0.09, "sine", 0.05, 0.06); }
    });
    simitler.forEach(function (s) {
      s.x -= hz * dt;
      var dx = s.x - kus.x, dy = s.y - kus.y;
      if (!s.alindi && dx * dx + dy * dy < 30 * 30) {
        s.alindi = true; simitSayisi++; skor += 2; skorYaz(true);
        yazilar.push({ x: s.x, y: s.y - 20, m: "+2 simit", o: 1 });
        for (var i = 0; i < 12; i++) { var a = (i / 12) * 6.283; parcaciklar.push({ x: s.x, y: s.y, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, o: 0.7, tur: "susam" }); }
        bip(990, 0, 0.07, "triangle", 0.05); bip(1250, 0, 0.07, "triangle", 0.05, 0.07); bip(1660, 0, 0.12, "triangle", 0.05, 0.14);
      }
    });
    direkler = direkler.filter(function (d) { return d.x + d.w > -40; });
    simitler = simitler.filter(function (s) { return s.x > -40 && !(s.alindi && s.x < kus.x - 5); });
    var son = direkler[direkler.length - 1];
    if (son && son.x < W + 60 - A.direkAraligi) direkKoy(son.x + A.direkAraligi);
    for (var j = 0; j < direkler.length; j++) if (carpiyor(direkler[j])) { bitir(); break; }
    if (durum === "oyun" && kus.y + 10 >= SU) { bitir(); kus.y = SU - 10; }
  } else if (durum === "oluyor") {
    kus.vy = Math.min(kus.vy + A.yercekimi * 1.2 * dt, 1100); kus.y += kus.vy * dt;
    kus.aci += (1.4 - kus.aci) * Math.min(1, dt * 6);
    if (kus.y >= SU + 6) suyaDus();
  } else if (durum === "bitti") {
    if (kus.y < SU + 40) kus.y += 60 * dt;
  }

  // vapurlar
  sonrakiVapur -= dt;
  if (sonrakiVapur <= 0 && vapurlar.length < 2) { vapurlar.push({ x: W + 120, hiz: rastgele(14, 30), s: rastgele(0.75, 1) }); sonrakiVapur = rastgele(7, 14); }
  vapurlar.forEach(function (v) { v.x -= (akiyor ? hz * 0.42 : 0) * dt + v.hiz * dt; });
  vapurlar = vapurlar.filter(function (v) { return v.x > -200; });

  parcaciklar.forEach(function (p) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.tur === "tuy") { p.vy += 260 * dt; p.vx *= 0.98; p.a += p.om * dt; p.o -= dt * 0.7; }
    else if (p.tur === "damla") { p.vy += 1100 * dt; p.o -= dt * 1.1; }
    else { p.vx *= 0.92; p.vy *= 0.92; p.o -= dt * 1.6; }
  });
  parcaciklar = parcaciklar.filter(function (p) { return p.o > 0; });
  yazilar.forEach(function (y) { y.y -= 40 * dt; y.o -= dt * 1.1; });
  yazilar = yazilar.filter(function (y) { return y.o > 0; });
  sarsinti = Math.max(0, sarsinti - dt * 40); flas = Math.max(0, flas - dt * 3);
}

/* ── Çizim ── */
function ciz() {
  paletHesapla();
  var sx = sarsinti ? (Math.random() - 0.5) * sarsinti : 0, sy = sarsinti ? (Math.random() - 0.5) * sarsinti : 0;
  c.setTransform(dpr * olcek, 0, 0, dpr * olcek, sx * dpr, sy * dpr);
  gokyuzu(); gunesAy(); bulutCiz(); uzakCiz(); kopruCiz(); yakinCiz(); suCiz(); vapurCiz();
  direkler.forEach(direkCiz);
  simitler.forEach(simitCiz);
  kusCiz();
  onSu();
  parcacikCiz();
  if (durum === "hazir") hazirCiz();
  if (flas > 0) { c.fillStyle = "rgba(255,255,255," + (flas * 0.55) + ")"; c.fillRect(-20, -20, W + 40, H + 40); }
}
function gokyuzu() {
  var g = c.createLinearGradient(0, 0, 0, SU);
  g.addColorStop(0, renk.gok1); g.addColorStop(1, renk.gok2);
  c.fillStyle = g; c.fillRect(-20, -20, W + 40, SU + 40);
  if (renk.gece > 0.05) {
    for (var i = 0; i < yildizlar.length; i++) {
      var y = yildizlar[i]; if (y[0] > W) continue;
      c.globalAlpha = renk.gece * (0.45 + 0.55 * Math.sin(zaman * 2 + y[3]) * 0.5 + 0.25);
      c.fillStyle = "#fff"; c.fillRect(y[0], y[1], y[2], y[2]);
    }
    c.globalAlpha = 1;
  }
}
function gunesAy() {
  var v = ((vakit % 4) + 4) % 4, gx = W * 0.72, gy;
  // güneş: gündüz yüksek, ikindi alçalır, akşam ufukta
  gy = v < 2 ? 120 + v * 170 : 460 + (v - 2) * 200;
  var ga = sinirla(1 - renk.gece * 1.4, 0, 1);
  if (ga > 0) {
    var hale = c.createRadialGradient(gx, gy, 10, gx, gy, 140);
    hale.addColorStop(0, "rgba(255,245,210," + 0.55 * ga + ")"); hale.addColorStop(1, "rgba(255,245,210,0)");
    c.fillStyle = hale; c.fillRect(gx - 140, gy - 140, 280, 280);
    c.globalAlpha = ga; c.fillStyle = renk.gunes; c.beginPath(); c.arc(gx, gy, 38, 0, 6.283); c.fill(); c.globalAlpha = 1;
  }
  if (renk.gece > 0.3) {
    var ma = (renk.gece - 0.3) / 0.7, mx = W * 0.22, my = 110;
    c.globalAlpha = ma;
    var mh = c.createRadialGradient(mx, my, 8, mx, my, 90); mh.addColorStop(0, "rgba(220,230,255,.35)"); mh.addColorStop(1, "rgba(220,230,255,0)");
    c.fillStyle = mh; c.fillRect(mx - 90, my - 90, 180, 180);
    c.fillStyle = "#f4f1e6"; c.beginPath(); c.arc(mx, my, 26, 0, 6.283); c.fill();
    c.fillStyle = renk.gok1; c.beginPath(); c.arc(mx + 11, my - 7, 23, 0, 6.283); c.fill();
    c.globalAlpha = 1;
  }
}
function tekrarla(periyot, faktor, f) {
  var o = -((kaydirma * faktor) % periyot);
  for (var x = o; x < W + 10; x += periyot) f(x);
}
function bulutCiz() {
  c.fillStyle = renk.bulut; c.globalAlpha = 0.75 - renk.gece * 0.45;
  tekrarla(BULUT_P, 0.06, function (ox) {
    bulutlar.forEach(function (b) {
      c.beginPath();
      b.t.forEach(function (t) { var x = ox + b.x + t[0] * b.s, y = b.y + t[1] * b.s; c.moveTo(x + t[2] * b.s, y); c.arc(x, y, t[2] * b.s, 0, 6.283); });
      for (var k = 0; k < 5; k++) { var bx = ox + b.x + (6 + k * 20) * b.s, by = b.y + 6 * b.s; c.moveTo(bx + 11 * b.s, by); c.arc(bx, by, 11 * b.s, 0, 6.283); }
      c.fill();
    });
  });
  c.globalAlpha = 1;
}
function uzakCiz() {
  var kiyi = SU - 22;
  tekrarla(UZAK_P, 0.12, function (ox) {
    c.fillStyle = renk.uzak; c.beginPath(); c.moveTo(ox, SU);
    var t = uzak.tepeler;
    c.lineTo(ox + t[0][0], SU - t[0][1]);
    for (var i = 1; i < t.length; i++) { var mx = (t[i - 1][0] + t[i][0]) / 2, my = (t[i - 1][1] + t[i][1]) / 2; c.quadraticCurveTo(ox + t[i - 1][0], SU - t[i - 1][1], ox + mx, SU - my); }
    c.lineTo(ox + t[t.length - 1][0], SU - t[t.length - 1][1]); c.lineTo(ox + UZAK_P, SU); c.closePath(); c.fill();
    c.fillStyle = renk.uzak2;
    uzak.binalar.forEach(function (b) { c.fillRect(ox + b.x, kiyi - b.h, b.w, b.h + 22); });
    uzak.camiler.forEach(function (m) {
      var x = ox + m.x, r = m.r, taban = kiyi - 30;
      c.fillRect(x - r * 1.35, taban, r * 2.7, 32);
      c.beginPath(); c.arc(x - r * 0.95, taban + 2, r * 0.5, Math.PI, 0); c.arc(x + r * 0.95, taban + 2, r * 0.5, Math.PI, 0); c.fill();
      c.fillRect(x - r * 0.82, taban - r * 0.3, r * 1.64, r * 0.32);
      c.beginPath(); c.arc(x, taban - r * 0.28, r * 0.8, Math.PI, 0); c.fill();
      c.fillRect(x - 1, taban - r * 1.08 - 10, 2, 11);
      m.minare.forEach(function (n) {
        var mx = x + n.dx, ust = kiyi - n.h;
        c.fillRect(mx - 3, ust, 6, n.h);
        c.fillRect(mx - 5, ust + n.h * 0.28, 10, 3); c.fillRect(mx - 5, ust + n.h * 0.5, 10, 3);
        c.beginPath(); c.moveTo(mx - 3.4, ust + 1); c.lineTo(mx, ust - 20); c.lineTo(mx + 3.4, ust + 1); c.fill();
      });
    });
  });
}
function kopruCiz() {
  var guverte = SU - 66, kuleUst = SU - 268, k1 = 360, k2 = 1240, orta = guverte - 8;
  var gece = renk.gece;
  // güverte (kesintisiz)
  c.fillStyle = renk.kopru; c.fillRect(-20, guverte, W + 40, 7);
  tekrarla(KOPRU_P, 0.25, function (ox) {
    var a = ox + k1, b = ox + k2, cy = 2 * orta - kuleUst - (orta - kuleUst) * 0.0;
    c.strokeStyle = renk.kopru; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(a, kuleUst); c.quadraticCurveTo((a + b) / 2, cy, b, kuleUst);
    c.moveTo(a, kuleUst); c.quadraticCurveTo(a - 220, guverte - 40, a - 420, guverte);
    c.moveTo(b, kuleUst); c.quadraticCurveTo(b + 220, guverte - 40, b + 420, guverte); c.stroke();
    c.lineWidth = 0.9; c.globalAlpha = 0.6; c.beginPath();
    for (var i = 1; i < 34; i++) { var t = i / 34, x = (1 - t) * (1 - t) * a + 2 * (1 - t) * t * ((a + b) / 2) + t * t * b, y = (1 - t) * (1 - t) * kuleUst + 2 * (1 - t) * t * cy + t * t * kuleUst; c.moveTo(x, y); c.lineTo(x, guverte); }
    c.stroke(); c.globalAlpha = 1;
    [a, b].forEach(function (kx) {
      c.fillStyle = renk.kopru;
      c.fillRect(kx - 13, kuleUst, 7, SU - kuleUst); c.fillRect(kx + 6, kuleUst, 7, SU - kuleUst);
      c.fillRect(kx - 13, kuleUst, 26, 7); c.fillRect(kx - 13, kuleUst + 70, 26, 6); c.fillRect(kx - 13, guverte - 4, 26, 12);
    });
    if (gece > 0.25) {
      // gece ışıkları: kabloda renk değiştiren ledler
      var h = (zaman * 25) % 360;
      c.globalAlpha = (gece - 0.25) / 0.75 * 0.9; c.strokeStyle = "hsl(" + h + ",80%,66%)"; c.lineWidth = 2;
      c.beginPath(); c.moveTo(a, kuleUst); c.quadraticCurveTo((a + b) / 2, cy, b, kuleUst); c.stroke();
      c.fillStyle = "#ffd98a";
      for (var l = -400; l < KOPRU_P - 400; l += 26) c.fillRect(ox + k1 + l, guverte + 1, 3, 2);
      c.globalAlpha = 1;
    }
  });
}
function yakinCiz() {
  var gece = renk.gece;
  tekrarla(YAKIN_P, 0.4, function (ox) {
    c.fillStyle = renk.yakin;
    yakin.evler.forEach(function (e) {
      var x = ox + e.x, y = SU - e.h;
      c.fillRect(x, y, e.w, e.h + 2);
      if (e.cati) { c.beginPath(); c.moveTo(x - 3, y + 1); c.lineTo(x + e.w / 2, y - 12); c.lineTo(x + e.w + 3, y + 1); c.fill(); }
    });
    // Galata benzeri kule
    var kx = ox + yakin.kule, kt = SU - 130;
    c.fillRect(kx - 15, kt, 30, 130); c.fillRect(kx - 19, kt - 6, 38, 8); c.fillRect(kx - 13, kt - 22, 26, 17);
    c.beginPath(); c.moveTo(kx - 17, kt - 21); c.lineTo(kx, kt - 66); c.lineTo(kx + 17, kt - 21); c.fill();
    if (gece > 0.2) {
      c.globalAlpha = (gece - 0.2) / 0.8; c.fillStyle = "#ffcf7a";
      yakin.evler.forEach(function (e) { if (e.yanik < 0.35) return; e.pencere.forEach(function (p, i) { if ((i + Math.floor(e.yanik * 10)) % 3 === 0) return; c.fillRect(ox + e.x + p[0], SU - e.h + p[1], 3.5, 4.5); }); });
      c.fillRect(kx - 9, kt - 18, 4, 7); c.fillRect(kx - 1, kt - 18, 4, 7); c.fillRect(kx + 7, kt - 18, 4, 7);
      c.globalAlpha = 1;
    }
  });
}
function suCiz() {
  var g = c.createLinearGradient(0, SU, 0, H);
  g.addColorStop(0, renk.su1); g.addColorStop(1, renk.su2);
  c.fillStyle = g; c.fillRect(-20, SU, W + 40, H - SU + 20);
  c.strokeStyle = "rgba(255,255,255," + (0.22 - renk.gece * 0.1) + ")"; c.lineWidth = 1.4; c.beginPath();
  for (var s = 0; s < 6; s++) {
    var y = SU + 6 + s * s * 2.2 + s * 4, f = 0.3 + s * 0.14, ar = 90 + s * 26, uz = 14 + s * 6;
    var o = -((kaydirma * f) % ar);
    for (var x = o + (s % 2) * 40; x < W + 20; x += ar) { c.moveTo(x, y); c.lineTo(x + uz, y); }
  }
  c.stroke();
  // güneş ya da ay yansıması
  var v = ((vakit % 4) + 4) % 4, gx = renk.gece > 0.5 ? W * 0.22 : W * 0.72;
  c.fillStyle = renk.gece > 0.5 ? "rgba(240,240,255,.22)" : "rgba(255,240,200," + (0.3 - v * 0.05) + ")";
  for (var i = 0; i < 7; i++) { var w = 46 - i * 5 + Math.sin(zaman * 3 + i) * 6; c.fillRect(gx - w / 2, SU + 5 + i * 8, w, 2); }
}
function vapurCiz() {
  vapurlar.forEach(function (v) {
    c.save(); c.translate(v.x, SU + 16); c.scale(v.s, v.s);
    c.fillStyle = "#1c2430"; c.beginPath(); c.moveTo(-70, -6); c.lineTo(70, -6); c.lineTo(62, 6); c.lineTo(-64, 6); c.closePath(); c.fill();
    c.fillStyle = "#f3f1ea"; c.fillRect(-66, -16, 132, 10); c.fillRect(-46, -27, 86, 11);
    c.fillStyle = "#1c2430"; c.fillRect(-8, -42, 12, 15); c.fillStyle = "#f3f1ea"; c.fillRect(-8, -36, 12, 4);
    c.fillStyle = renk.gece > 0.3 ? "rgba(255,210,130," + renk.gece + ")" : "rgba(28,36,48,.55)";
    for (var i = -58; i < 58; i += 11) c.fillRect(i, -13, 6, 4);
    c.restore();
  });
}
function direkCiz(d) {
  var ustBit = d.y - d.b / 2, altBas = d.y + d.b / 2, x = d.x, w = d.w;
  // Üst: köprü kulesi (çelik)
  var g = c.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, "#d9573d"); g.addColorStop(0.5, "#c4432d"); g.addColorStop(1, "#8e2c1f");
  c.fillStyle = g; c.fillRect(x, -20, w, ustBit - 12 + 20);
  c.strokeStyle = "rgba(60,14,8,.45)"; c.lineWidth = 3; c.beginPath();
  for (var y = ustBit - 12; y > -60; y -= 58) { c.moveTo(x + 8, y); c.lineTo(x + w - 8, y - 50); c.moveTo(x + w - 8, y); c.lineTo(x + 8, y - 50); c.moveTo(x + 4, y - 54); c.lineTo(x + w - 4, y - 54); }
  c.stroke();
  c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(x + 5, -20, 4, ustBit + 8);
  c.fillStyle = "#7a2418"; c.fillRect(x - 6, ustBit - 14, w + 12, 14);
  c.fillStyle = "#e46a4d"; c.fillRect(x - 6, ustBit - 14, w + 12, 3);
  c.fillStyle = "#5c1a10"; for (var r = 0; r < 5; r++) c.fillRect(x - 1 + r * ((w + 2) / 4), ustBit - 8, 3, 3);
  // Alt: minare (taş)
  var t = c.createLinearGradient(x, 0, x + w, 0);
  t.addColorStop(0, "#fbf3e4"); t.addColorStop(0.55, "#e7dac4"); t.addColorStop(1, "#b9a68b");
  c.fillStyle = t; c.fillRect(x + 4, altBas + 38, w - 8, H - altBas);
  c.strokeStyle = "rgba(120,96,64,.28)"; c.lineWidth = 1.2; c.beginPath();
  for (var s = altBas + 60; s < H; s += 22) { c.moveTo(x + 4, s); c.lineTo(x + w - 4, s); }
  c.stroke();
  c.fillStyle = "#c9b79b"; c.fillRect(x - 7, altBas + 30, w + 14, 9);
  c.fillStyle = "#f6ecda"; c.fillRect(x - 7, altBas + 30, w + 14, 2.5);
  c.fillStyle = "rgba(90,70,40,.35)"; for (var k = 0; k < 7; k++) c.fillRect(x - 3 + k * ((w + 6) / 6), altBas + 34, 2.5, 5);
  var kg = c.createLinearGradient(x, 0, x + w, 0);
  kg.addColorStop(0, "#7d93a8"); kg.addColorStop(1, "#465a70");
  c.fillStyle = kg; c.beginPath(); c.moveTo(x - 3, altBas + 30); c.lineTo(x + w / 2, altBas); c.lineTo(x + w + 3, altBas + 30); c.closePath(); c.fill();
  c.fillStyle = "#d8b25a"; c.fillRect(x + w / 2 - 1.5, altBas - 10, 3, 11); c.beginPath(); c.arc(x + w / 2, altBas - 12, 3.5, 0, 6.283); c.fill();
  if (renk.gece > 0.3) { c.globalAlpha = (renk.gece - 0.3) * 1.2; c.fillStyle = "#ffd98a"; c.fillRect(x - 7, altBas + 37, w + 14, 2); c.globalAlpha = 1; }
}
function simitCiz(s) {
  if (s.alindi) return;
  var y = s.y + Math.sin(zaman * 3 + s.faz) * 5;
  c.save(); c.translate(s.x, y); c.rotate(Math.sin(zaman * 2 + s.faz) * 0.25);
  var h = c.createRadialGradient(0, 0, 4, 0, 0, 30); h.addColorStop(0, "rgba(255,220,150,.45)"); h.addColorStop(1, "rgba(255,220,150,0)");
  c.fillStyle = h; c.fillRect(-30, -30, 60, 60);
  c.beginPath(); c.arc(0, 0, 15, 0, 6.283); c.arc(0, 0, 6, 0, 6.283, true);
  var g = c.createRadialGradient(-4, -5, 2, 0, 0, 16); g.addColorStop(0, "#f0a35a"); g.addColorStop(0.7, "#c96b25"); g.addColorStop(1, "#8f4514");
  c.fillStyle = g; c.fill("evenodd");
  c.fillStyle = "#fbecc8";
  for (var i = 0; i < 14; i++) { var a = i * 0.449 + 0.2, r = i % 2 ? 9.5 : 12.5; c.save(); c.translate(Math.cos(a) * r, Math.sin(a) * r); c.rotate(a); c.fillRect(-1.4, -0.7, 2.8, 1.4); c.restore(); }
  c.restore();
}
function kusCiz() {
  c.save(); c.translate(kus.x, kus.y); c.rotate(kus.aci);
  var kanat = Math.cos(kus.faz);
  // kuyruk
  c.fillStyle = "#cdd5dd"; c.beginPath(); c.moveTo(-13, -3); c.lineTo(-28, -8); c.lineTo(-27, 4); c.lineTo(-12, 5); c.closePath(); c.fill();
  c.fillStyle = "#2b3138"; c.beginPath(); c.moveTo(-25, -7.5); c.lineTo(-28, -8); c.lineTo(-27, 4); c.lineTo(-24, 3.5); c.closePath(); c.fill();
  // arka kanat
  kanatCiz(-1, -3, kanat * 0.8, "#aeb8c2", 0.85);
  // gövde
  var g = c.createLinearGradient(0, -12, 0, 12); g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#dfe5ea");
  c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 17, 11, 0, 0, 6.283); c.fill();
  c.beginPath(); c.arc(12, -5, 8.5, 0, 6.283); c.fill();
  // gaga
  c.fillStyle = "#f2b632"; c.beginPath(); c.moveTo(18.5, -7); c.lineTo(29, -3.5); c.lineTo(18.5, -1.5); c.closePath(); c.fill();
  c.fillStyle = "#d9452b"; c.beginPath(); c.arc(25.5, -3, 1.4, 0, 6.283); c.fill();
  // göz
  c.fillStyle = "#1b1d22"; c.beginPath(); c.arc(14.5, -7.2, 1.9, 0, 6.283); c.fill();
  c.fillStyle = "#fff"; c.beginPath(); c.arc(15.1, -7.8, 0.6, 0, 6.283); c.fill();
  // ön kanat
  kanatCiz(-3, -2, kanat, "#c3ccd5", 1);
  c.restore();
}
function kanatCiz(x, y, k, renk_, s) {
  c.save(); c.translate(x, y); c.scale(s, k);
  c.fillStyle = renk_; c.beginPath(); c.moveTo(6, 0); c.quadraticCurveTo(2, -14, -10, -24); c.lineTo(-24, -26); c.quadraticCurveTo(-14, -12, -14, 0); c.closePath(); c.fill();
  c.fillStyle = "#2b3138"; c.beginPath(); c.moveTo(-10, -24); c.lineTo(-24, -26); c.quadraticCurveTo(-19, -20, -17, -15); c.closePath(); c.fill();
  c.restore();
}
function onSu() {
  c.fillStyle = renk.su1; c.globalAlpha = 0.55; c.fillRect(-20, SU + 3, W + 40, H - SU);
  c.globalAlpha = 1;
  c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 2; c.beginPath();
  var o = -((kaydirma) % 48);
  for (var x = o; x < W + 50; x += 48) { c.moveTo(x, SU + 3); c.quadraticCurveTo(x + 12, SU - 1.5, x + 24, SU + 3); }
  c.stroke();
}
function parcacikCiz() {
  parcaciklar.forEach(function (p) {
    c.globalAlpha = Math.min(1, p.o);
    if (p.tur === "tuy") { c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.fillStyle = "#f2f5f7"; c.beginPath(); c.ellipse(0, 0, 6, 2.2, 0, 0, 6.283); c.fill(); c.restore(); }
    else if (p.tur === "damla") { c.fillStyle = "rgba(220,240,255,.9)"; c.beginPath(); c.arc(p.x, p.y, 2.6, 0, 6.283); c.fill(); }
    else { c.fillStyle = "#ffe3a3"; c.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }
  });
  c.globalAlpha = 1;
  c.textAlign = "center"; c.font = "800 18px 'Baloo 2', sans-serif";
  yazilar.forEach(function (y) { c.globalAlpha = Math.min(1, y.o); c.lineWidth = 4; c.strokeStyle = "rgba(19,35,58,.6)"; c.strokeText(y.m, y.x, y.y); c.fillStyle = "#fff3d6"; c.fillText(y.m, y.x, y.y); });
  c.globalAlpha = 1;
}
function hazirCiz() {
  var x = kus.x + 120 > W - 80 ? W / 2 : kus.x + 140, y = H * 0.42;
  var a = 0.75 + Math.sin(zaman * 5) * 0.25;
  c.globalAlpha = a;
  c.fillStyle = "rgba(255,250,241,.92)";
  c.beginPath(); if (c.roundRect) c.roundRect(x - 95, y + 46, 190, 44, 22); else c.rect(x - 95, y + 46, 190, 44); c.fill();
  c.fillStyle = "#13233a"; c.textAlign = "center"; c.font = "800 19px 'Baloo 2', sans-serif";
  c.fillText(matchMedia("(pointer: coarse)").matches ? "Uçmak için dokun" : "Boşluk tuşuyla uç", x, y + 74);
  c.globalAlpha = 1;
  // dokunma simgesi
  var p = (zaman * 1.6) % 1;
  c.strokeStyle = "rgba(255,255,255," + (1 - p) + ")"; c.lineWidth = 3;
  c.beginPath(); c.arc(x, y + 10, 10 + p * 18, 0, 6.283); c.stroke();
  c.fillStyle = "#fff"; c.beginPath(); c.arc(x, y + 10, 8, 0, 6.283); c.fill();
}

/* ── Döngü ── */
var onceki = performance.now();
function dongu(an) {
  var dt = Math.min(0.05, (an - onceki) / 1000); onceki = an;
  if (durum !== "mola") {
    var n = Math.ceil(dt / (1 / 120)), h = dt / Math.max(1, n);
    for (var i = 0; i < n; i++) guncelle(h);
  }
  ciz();
  requestAnimationFrame(dongu);
}
yerlesim();
$("enIyi").textContent = enIyi;
arayuz();
requestAnimationFrame(dongu);
`;

export const MARTI = {
  id: "marti",
  ad: "Martı · Boğaz'da Uç",
  tur: "oyun" as const,
  aciklama: "Boğaz'da dokun ve uç: minare ve köprü kulesi engelleri, bonus simitler, gündüzden geceye dönen İstanbul silüeti, madalyalar ve en iyi skor",
  kapak: "/gercek/build/sablon/marti.webp",
  dosyalar: {
    "index.html": HTML,
    "stil.css": STIL,
    "ayarlar.json": `{
  "yercekimi": { "etiket": "Yer çekimi", "deger": 1500, "min": 800, "max": 2600, "adim": 50 },
  "kanatGucu": { "etiket": "Kanat gücü", "deger": 470, "min": 300, "max": 700, "adim": 10 },
  "aralik": { "etiket": "Engel arası boşluk (birim)", "deger": 165, "min": 120, "max": 260, "adim": 5 },
  "hiz": { "etiket": "Uçuş hızı", "deger": 190, "min": 120, "max": 320, "adim": 5 },
  "direkAraligi": { "etiket": "Engeller arası mesafe", "deger": 270, "min": 200, "max": 480, "adim": 10 },
  "simitOlasiligi": { "etiket": "Simit çıkma olasılığı (yüzde)", "deger": 35, "min": 0, "max": 100, "adim": 5 }
}
`,
    "oyun.js": OYUN,
    "ikon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4aa8e6"/><stop offset="1" stop-color="#cdeaf6"/></linearGradient></defs>
  <rect width="64" height="64" rx="18" fill="url(#g)"/>
  <rect y="46" width="64" height="18" fill="#2f8bb6"/>
  <path d="M0 46h64v4H0z" fill="#145a7d" opacity=".35"/>
  <circle cx="47" cy="17" r="7" fill="#fff6cf"/>
  <path d="M12 30c6-8 12-9 18-3 4-8 12-11 21-6-7 0-13 3-17 10l-4 1c-6-4-12-4-18-2z" fill="#fff"/>
  <path d="M41 21c3-1 6-1 9 0-3 1-5 1-7 2z" fill="#2b3138"/>
  <path d="M34 28l7-1-6 3z" fill="#f2b632"/>
  <circle cx="20" cy="50" r="6" fill="none" stroke="#d9822f" stroke-width="3.4"/>
</svg>
`,
  },
};
