/* Şablon: Uzay Savunması — canvas dikey uzay nişancı (paralaks yıldızlar, düşman dalgaları, komuta gemisi, mermi desenleri, patlamalar, güçlendiriciler). Ayarlar ayarlar.json'dan (Vayra Build ayar paneli kaydırıcıları). */

export const UZAY_SAVUNMASI = {
  id: "uzay-savunmasi",
  ad: "Uzay Savunması",
  tur: "oyun" as const,
  aciklama: "Dikey uzay nişancı: dalgalar, komuta gemisi, güçlendiriciler ve en iyi skor",
  kapak: "/gercek/build/sablon/uzay-savunmasi.webp",
  dosyalar: {
    "index.html": `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
  <title>Uzay Savunması</title>
  <meta name="description" content="Dikey uzay nişancı oyunu: düşman dalgaları, komuta gemisi, güçlendiriciler ve en iyi skor." />
  <meta name="theme-color" content="#04060d" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2304060d'/%3E%3Cpath d='M16 5c3 3 4 8 4 13l4 4v3h-5l-1 3h-4l-1-3H8v-3l4-4c0-5 1-10 4-13z' fill='%23eaf1ff'/%3E%3Cpath d='M14 25h4l-2 4z' fill='%23ffb547'/%3E%3C/svg%3E" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Manrope:wght@500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <div class="derin" aria-hidden="true"></div>
  <canvas id="tuval" aria-label="Oyun alanı"></canvas>

  <header class="hud" id="hud">
    <div class="hud-sol">
      <div class="can" aria-label="Can">
        <span class="hud-etiket">Can</span>
        <span class="can-bar" id="canBar"></span>
      </div>
      <div class="skor"><span class="hud-etiket">Skor</span><b id="skor">0</b></div>
      <div class="guclar" id="guclar"></div>
    </div>

    <div class="hud-orta">
      <div class="dalga" id="dalgaKutu">
        <div class="dalga-ust"><b id="dalgaAd">Dalga 1</b><span id="dalgaNot">Komuta gemisine 2 dalga</span></div>
        <span class="dalga-cubuk"><span id="dalgaIlerleme"></span></span>
      </div>
      <div class="boss" id="bossKutu" aria-hidden="true">
        <div class="dalga-ust"><b>Komuta gemisi</b><span id="bossEvre">Evre 1 / 3</span></div>
        <span class="boss-cubuk"><span id="bossCan"></span></span>
      </div>
    </div>

    <div class="hud-sag">
      <div class="en-iyi"><span class="hud-etiket">En iyi</span><b id="enIyi">0</b></div>
      <button class="ikon-dugme" id="duraklat" type="button" aria-label="Duraklat">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="3.6" height="14" rx="1.4" fill="currentColor"/><rect x="13.9" y="5" width="3.6" height="14" rx="1.4" fill="currentColor"/></svg>
      </button>
    </div>
  </header>

  <div class="afis" id="afis" aria-live="polite"><b id="afisBaslik"></b><span id="afisAlt"></span></div>

  <section class="ekran gorunur" id="giris" aria-labelledby="girisBaslik">
    <div class="ekran-ic">
      <p class="ust-not"><span class="nokta"></span>Yörünge savunma hattı</p>
      <h1 id="girisBaslik">Uzay <span>Savunması</span></h1>
      <p class="giris-metin">Dalga dalga gelen akıncıları püskürt, güçlendiricileri topla ve her üç dalgada bir gelen komuta gemisini düşür.</p>
      <div class="kontroller">
        <div class="kontrol">
          <span class="tuslar"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span>
          <span>ya da ok tuşlarıyla uç</span>
        </div>
        <div class="kontrol">
          <span class="tuslar"><kbd class="genis">Boşluk</kbd></span>
          <span>basılı tut, ateş et</span>
        </div>
        <div class="kontrol dokun">
          <span class="tuslar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5.5a1.8 1.8 0 0 1 3.6 0V11m0-1.5a1.8 1.8 0 0 1 3.6 0V12m0-1a1.8 1.8 0 0 1 3.4.8V15a6 6 0 0 1-6 6h-1.2a6 6 0 0 1-4.6-2.2L4.6 15.6a1.7 1.7 0 0 1 2.6-2.2L9 15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
          <span>dokunmatikte sürükle, gemi kendisi ateş eder</span>
        </div>
      </div>
      <button class="ana-dugme" id="basla" type="button">Göreve başla</button>
      <p class="alt-not">En iyi skor <b id="girisEnIyi">0</b> · Duraklatmak için P</p>
    </div>
  </section>

  <section class="ekran" id="durakla" aria-labelledby="duraklaBaslik">
    <div class="ekran-ic dar">
      <h2 id="duraklaBaslik">Duraklatıldı</h2>
      <p class="giris-metin">Görev seni bekliyor. Hazır olduğunda devam et.</p>
      <button class="ana-dugme" id="devam" type="button">Devam et</button>
      <button class="ikinci-dugme" id="bastan" type="button">Baştan başla</button>
    </div>
  </section>

  <section class="ekran" id="bitti" aria-labelledby="bittiBaslik">
    <div class="ekran-ic dar">
      <span class="rozet" id="rekorRozet">Yeni rekor</span>
      <h2 id="bittiBaslik">Gemin düştü</h2>
      <p class="giris-metin" id="bittiMetin">Savunma hattı geri çekiliyor.</p>
      <dl class="sonuc">
        <div><dt>Skor</dt><dd id="sonSkor">0</dd></div>
        <div><dt>Dalga</dt><dd id="sonDalga">1</dd></div>
        <div><dt>Düşürülen</dt><dd id="sonDusen">0</dd></div>
      </dl>
      <button class="ana-dugme" id="tekrar" type="button">Tekrar oyna</button>
      <p class="alt-not">En iyi skor <b id="bittiEnIyi">0</b> · Enter ile yeniden başla</p>
    </div>
  </section>

  <script src="grafik.js"></script>
  <script src="oyun.js"></script>
</body>
</html>
`,
    "stil.css": `/* Uzay Savunması — gece mavisi derin uzay, kehribar ve mercan vurgular, cam göstergeler. */
:root {
  --gece: #04060d;
  --buz: #eaf1ff;
  --soluk: rgba(234, 241, 255, .64);
  --amber: #ffb547;
  --mercan: #ff5a3c;
  --mor: #a184ff;
  --nane: #6cf0c2;
  --cam: rgba(9, 13, 27, .56);
  --cizgi: rgba(255, 255, 255, .1);
  --ust: max(14px, env(safe-area-inset-top));
}
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body {
  background: var(--gece); color: var(--buz); overflow: hidden;
  font-family: "Manrope", system-ui, sans-serif; -webkit-font-smoothing: antialiased;
  user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
}
button { font: inherit; color: inherit; }

.derin {
  position: fixed; inset: -6%; z-index: 0;
  background: url("/gercek/havuz/gorsel/mk-uzay-30031.webp") center / cover no-repeat;
  opacity: .5; filter: saturate(1.2) hue-rotate(-12deg);
  animation: suzul 90s ease-in-out infinite alternate;
}
.derin::after {
  content: ""; position: absolute; inset: 0;
  background: radial-gradient(120% 85% at 50% 40%, transparent 35%, rgba(4, 6, 13, .78) 100%), linear-gradient(180deg, rgba(4, 6, 13, .3), rgba(4, 6, 13, 0) 40%, rgba(4, 6, 13, .6));
}
@keyframes suzul { from { transform: scale(1.04) rotate(0deg); } to { transform: scale(1.16) rotate(6deg); } }

canvas { position: fixed; inset: 0; z-index: 1; display: block; width: 100%; height: 100%; touch-action: none; cursor: crosshair; }

/* Göstergeler */
.hud {
  position: fixed; z-index: 5; top: 0; left: 0; right: 0;
  display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: start; gap: 12px;
  padding: var(--ust) max(16px, env(safe-area-inset-right)) 0 max(16px, env(safe-area-inset-left));
  pointer-events: none; opacity: 0; transform: translateY(-8px); transition: opacity .4s, transform .4s;
}
.hud.gorunur { opacity: 1; transform: none; }
.hud-etiket { font-size: 12px; font-weight: 600; color: var(--soluk); }
.hud-sol { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.can, .skor, .en-iyi, .dalga, .boss, .guc {
  background: var(--cam); border: 1px solid var(--cizgi); border-radius: 14px;
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
}
.can { display: flex; align-items: center; gap: 10px; padding: 9px 12px; }
.can-bar { display: flex; gap: 4px; }
.can-bar i { display: block; width: 20px; height: 8px; border-radius: 3px; background: rgba(255, 255, 255, .13); transition: background .3s; }
.can-bar i.dolu { background: linear-gradient(90deg, var(--mercan), var(--amber)); }
.can-bar i.kayip { animation: kayip .6s ease; }
@keyframes kayip { 0%, 50% { background: #fff; transform: scaleY(1.6); } 100% { transform: none; } }
.can-bar.kucuk i { width: 12px; }
.skor { display: flex; align-items: baseline; gap: 10px; padding: 8px 14px 9px 12px; }
.skor b, .en-iyi b {
  font-family: "Chakra Petch", sans-serif; font-weight: 600; font-size: 26px; line-height: 1;
  font-variant-numeric: tabular-nums; letter-spacing: .01em;
}
.skor b.artti { animation: artti .3s ease; }
@keyframes artti { 50% { color: var(--amber); } }
.guclar { display: flex; flex-wrap: wrap; gap: 6px; }
.guc { display: flex; align-items: center; gap: 7px; padding: 6px 10px 6px 7px; font-size: 13px; font-weight: 700; animation: guc-gel .35s ease; }
.guc i { width: 18px; height: 18px; border-radius: 6px; display: grid; place-items: center; }
.guc i svg { width: 12px; height: 12px; }
.guc.silah i { background: var(--amber); color: #2a1a00; }
.guc.kalkan i { background: var(--nane); color: #00261a; }
.guc small { font-weight: 600; color: var(--soluk); font-size: 12px; }
@keyframes guc-gel { from { opacity: 0; transform: translateY(-4px); } }

.hud-orta { position: relative; display: flex; justify-content: center; min-width: 260px; }
.dalga, .boss { padding: 9px 14px 11px; min-width: 260px; }
.dalga-ust { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; }
.dalga-ust b { font-family: "Chakra Petch", sans-serif; font-weight: 700; font-size: 17px; }
.dalga-ust span { font-size: 12.5px; font-weight: 600; color: var(--soluk); }
.dalga-cubuk, .boss-cubuk { display: block; margin-top: 8px; height: 5px; border-radius: 99px; background: rgba(255, 255, 255, .12); overflow: hidden; }
.dalga-cubuk span, .boss-cubuk span { display: block; height: 100%; width: 0; border-radius: inherit; transition: width .3s ease; }
.dalga-cubuk span { background: linear-gradient(90deg, var(--amber), #ffe0a3); }
.boss { display: none; width: min(520px, 46vw); border-color: rgba(255, 90, 60, .35); }
.boss .dalga-ust b { color: #ffd1c6; }
.boss-cubuk { height: 9px; position: relative; }
.boss-cubuk span { background: linear-gradient(90deg, #ff3d2e, var(--mercan) 60%, var(--amber)); transition: width .15s linear; }
.boss-cubuk::before, .boss-cubuk::after { content: ""; position: absolute; z-index: 1; top: 0; bottom: 0; width: 2px; background: rgba(4, 6, 13, .8); }
.boss-cubuk::before { left: 33.3%; }
.boss-cubuk::after { left: 66.6%; }
.hud.boss-var .dalga { display: none; }
.hud.boss-var .boss { display: block; animation: guc-gel .4s ease; }

.hud-sag { display: flex; justify-content: flex-end; align-items: flex-start; gap: 8px; }
.en-iyi { display: flex; align-items: baseline; gap: 10px; padding: 8px 14px 9px 12px; }
.en-iyi b { font-size: 20px; color: var(--soluk); }
.ikon-dugme {
  pointer-events: auto; display: grid; place-items: center; width: 44px; height: 44px; padding: 0; cursor: pointer;
  border-radius: 14px; border: 1px solid var(--cizgi); background: var(--cam); color: var(--buz);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); transition: background .2s;
}
.ikon-dugme:hover { background: rgba(30, 38, 66, .7); }
.ikon-dugme:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
.ikon-dugme svg { width: 20px; height: 20px; }

/* Dalga afişi */
.afis {
  position: fixed; z-index: 4; left: 50%; top: 40%; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center;
  pointer-events: none; opacity: 0; width: max-content; max-width: 92vw;
}
.afis b { font-family: "Chakra Petch", sans-serif; font-weight: 700; font-size: clamp(40px, 7vw, 68px); line-height: 1; letter-spacing: .01em; }
.afis span { font-size: clamp(14px, 2vw, 17px); font-weight: 600; color: var(--soluk); }
.afis.oyna { animation: afis 2.4s ease forwards; }
.afis.uyari b { color: #ff8a6e; }
.afis.uyari::before, .afis.uyari::after {
  content: ""; display: block; width: min(560px, 86vw); height: 10px; margin: 8px 0;
  background: repeating-linear-gradient(-45deg, rgba(255, 90, 60, .9) 0 10px, transparent 10px 20px);
  animation: serit .6s linear infinite;
}
@keyframes serit { to { background-position: 28px 0; } }
@keyframes afis {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(.9); letter-spacing: .2em; }
  14% { opacity: 1; transform: translate(-50%, -50%) scale(1); letter-spacing: .01em; }
  78% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -54%) scale(1.02); }
}

/* Ekranlar */
.ekran {
  position: fixed; inset: 0; z-index: 8; display: grid; place-items: center; padding: 24px;
  background: radial-gradient(90% 70% at 50% 45%, rgba(4, 6, 13, .35), rgba(4, 6, 13, .82));
  opacity: 0; visibility: hidden; transition: opacity .35s, visibility .35s;
}
.ekran.gorunur { opacity: 1; visibility: visible; }
.ekran-ic { width: min(620px, 100%); text-align: center; transform: translateY(12px); transition: transform .5s cubic-bezier(.2, .9, .3, 1); }
.ekran.gorunur .ekran-ic { transform: none; }
.ekran-ic.dar {
  width: min(420px, 100%); padding: 30px 28px 24px; border-radius: 24px;
  background: rgba(10, 14, 28, .72); border: 1px solid rgba(255, 255, 255, .12);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
}
.ust-not {
  display: inline-flex; align-items: center; gap: 8px; margin: 0 0 18px; padding: 6px 12px 6px 10px; border-radius: 99px;
  background: rgba(255, 181, 71, .1); border: 1px solid rgba(255, 181, 71, .28); color: #ffd79a; font-size: 13px; font-weight: 700;
}
.nokta { width: 7px; height: 7px; border-radius: 50%; background: var(--amber); animation: nabiz 1.6s ease infinite; }
@keyframes nabiz { 50% { opacity: .3; } }
.ekran h1 {
  margin: 0; font-family: "Chakra Petch", sans-serif; font-weight: 700; font-size: clamp(46px, 8.4vw, 86px); line-height: .98; letter-spacing: -.01em;
}
.ekran h1 span { display: block; background: linear-gradient(92deg, var(--amber) 10%, var(--mercan) 70%, #ff3d6e); -webkit-background-clip: text; background-clip: text; color: transparent; }
.ekran h2 { margin: 0; font-family: "Chakra Petch", sans-serif; font-weight: 700; font-size: 38px; line-height: 1.05; }
.giris-metin { margin: 16px auto 0; max-width: 470px; font-size: 16px; font-weight: 500; line-height: 1.6; color: var(--soluk); }
.kontroller { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 26px 0 28px; }
.kontrol.dokun { order: 0; }
.kontrol {
  display: flex; flex-direction: column; align-items: center; gap: 9px; padding: 14px 10px 13px; border-radius: 16px;
  background: rgba(255, 255, 255, .045); border: 1px solid rgba(255, 255, 255, .09);
  font-size: 13px; font-weight: 600; line-height: 1.4; color: var(--soluk);
}
.tuslar { display: flex; gap: 4px; height: 30px; align-items: center; color: var(--buz); }
.tuslar svg { width: 28px; height: 28px; }
kbd {
  display: inline-grid; place-items: center; min-width: 28px; height: 28px; padding: 0 6px; border-radius: 8px;
  background: rgba(255, 255, 255, .08); border: 1px solid rgba(255, 255, 255, .22);
  font-family: "Chakra Petch", sans-serif; font-weight: 600; font-size: 13px; color: var(--buz);
}
kbd.genis { padding: 0 14px; }
.ana-dugme {
  display: inline-flex; align-items: center; justify-content: center; min-height: 54px; padding: 0 38px; border: 0; cursor: pointer;
  border-radius: 14px; background: var(--amber); color: #1d1205;
  font-family: "Chakra Petch", sans-serif; font-weight: 700; font-size: 18px; letter-spacing: .01em;
  transition: transform .15s, background .2s;
}
.ana-dugme:hover { background: #ffc469; transform: translateY(-1px); }
.ana-dugme:active { transform: translateY(1px) scale(.99); }
.ana-dugme:focus-visible, .ikinci-dugme:focus-visible { outline: 2px solid var(--buz); outline-offset: 3px; }
.ekran-ic.dar .ana-dugme { width: 100%; margin-top: 4px; }
.ikinci-dugme {
  width: 100%; min-height: 48px; margin-top: 10px; border-radius: 14px; cursor: pointer;
  background: rgba(255, 255, 255, .06); border: 1px solid rgba(255, 255, 255, .14);
  font-family: "Chakra Petch", sans-serif; font-weight: 600; font-size: 16px;
}
.ikinci-dugme:hover { background: rgba(255, 255, 255, .1); }
.alt-not { margin: 16px 0 0; font-size: 13.5px; font-weight: 600; color: var(--soluk); }
.alt-not b { font-family: "Chakra Petch", sans-serif; color: var(--buz); }
.ekran-ic.dar .giris-metin { margin: 10px auto 22px; font-size: 15px; }
.sonuc { display: grid; grid-template-columns: repeat(3, 1fr); margin: 0 0 22px; padding: 14px 0; border-top: 1px solid var(--cizgi); border-bottom: 1px solid var(--cizgi); }
.sonuc div + div { border-left: 1px solid var(--cizgi); }
.sonuc dt { font-size: 12.5px; font-weight: 600; color: var(--soluk); }
.sonuc dd { margin: 4px 0 0; font-family: "Chakra Petch", sans-serif; font-weight: 600; font-size: 26px; font-variant-numeric: tabular-nums; }
.rozet {
  display: none; margin: 0 auto 12px; width: fit-content; padding: 5px 12px; border-radius: 99px;
  background: var(--amber); color: #1d1205; font-family: "Chakra Petch", sans-serif; font-weight: 700; font-size: 13px;
}
.rozet.gorunur { display: block; animation: guc-gel .4s ease .3s both; }

/* Tablet ve telefon */
@media (max-width: 760px) {
  .hud { gap: 8px; grid-template-columns: auto minmax(0, 1fr) auto; }
  .hud-orta { min-width: 0; }
  .dalga, .boss { min-width: 0; width: 100%; padding: 8px 11px 9px; }
  .dalga-ust span { display: none; }
  .dalga-ust b { font-size: 15px; }
  .boss .dalga-ust span { display: none; }
  .boss .dalga-ust b { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hud-sol { position: relative; }
  .guclar { position: absolute; top: 100%; left: 0; margin-top: 8px; width: max-content; flex-direction: column; align-items: flex-start; }
  .en-iyi { display: none; }
  .can { padding: 8px 10px; gap: 8px; }
  .can .hud-etiket, .skor .hud-etiket { display: none; }
  .can-bar i { width: 12px; height: 7px; }
  .can-bar { gap: 3px; }
  .can-bar.kucuk i { width: 7px; }
  .boss .dalga-ust b { font-size: 14px; }
  .skor { padding: 7px 10px 8px; }
  .skor b { font-size: 21px; }
  .ikon-dugme { width: 42px; height: 42px; }
  .kontroller { grid-template-columns: 1fr; gap: 8px; margin: 22px 0 24px; }
  .kontrol { flex-direction: row; justify-content: flex-start; gap: 12px; padding: 10px 12px; text-align: left; }
  .tuslar { min-width: 120px; justify-content: center; }
  .giris-metin { font-size: 15px; }
}
@media (max-width: 380px) {
  .tuslar { min-width: 104px; }
  kbd { min-width: 24px; height: 26px; }
}

@media (pointer: coarse) {
  .kontrol.dokun { order: -1; }
}

@media (prefers-reduced-motion: reduce) {
  .derin { animation: none; }
  .afis.oyna { animation-duration: 2.4s; }
}
`,
    "grafik.js": `// Uzay Savunması — çizimler. Gemiler, düşmanlar, mermiler ve güçlendiriciler bir kez küçük tuvallere çizilir,
// oyun sırasında yalnızca kopyalanır (hızlı). Renkleri ya da biçimleri buradan değiştirebilirsin.
(function () {
  "use strict";

  function tuvalYap(w, h, S, D, ciz) {
    var c = document.createElement("canvas");
    c.width = Math.max(1, Math.ceil(w * S * D));
    c.height = Math.max(1, Math.ceil(h * S * D));
    var x = c.getContext("2d");
    x.scale(S * D, S * D);
    x.translate(w / 2, h / 2);
    ciz(x);
    return { c: c, w: w * S, h: h * S };
  }
  // Bir çizimin beyaz silüeti (vurulunca yanıp sönme için)
  function beyazla(s) {
    var c = document.createElement("canvas");
    c.width = s.c.width; c.height = s.c.height;
    var x = c.getContext("2d");
    x.drawImage(s.c, 0, 0);
    x.globalCompositeOperation = "source-in";
    x.fillStyle = "#ffffff";
    x.fillRect(0, 0, c.width, c.height);
    return { c: c, w: s.w, h: s.h };
  }
  function yol(x, noktalar) {
    x.beginPath();
    x.moveTo(noktalar[0], noktalar[1]);
    for (var i = 2; i < noktalar.length; i += 2) x.lineTo(noktalar[i], noktalar[i + 1]);
    x.closePath();
  }
  function ayna(noktalar) {
    var a = [];
    for (var i = 0; i < noktalar.length; i += 2) a.push(-noktalar[i], noktalar[i + 1]);
    return a;
  }
  function dolgu(x, noktalar, renk, aynali) {
    x.fillStyle = renk;
    yol(x, noktalar); x.fill();
    if (aynali) { yol(x, ayna(noktalar)); x.fill(); }
  }

  /* ── Oyuncu gemisi (burun yukarı) ── */
  function oyuncu(x) {
    var kanat = x.createLinearGradient(-34, 0, 34, 0);
    kanat.addColorStop(0, "#76839f"); kanat.addColorStop(0.5, "#d6deee"); kanat.addColorStop(1, "#76839f");
    dolgu(x, [9, -6, 33, 15, 34, 26, 22, 26, 11, 20], kanat, true);
    dolgu(x, [28, 11, 33, 15, 34, 26, 30, 26], "#ff5a3c", true);
    dolgu(x, [13, 2, 24, 12, 22, 14, 12, 7], "rgba(40,52,84,.35)", true);
    // kanat topları
    x.fillStyle = "#4b5675";
    x.fillRect(19, 2, 3, 12); x.fillRect(-22, 2, 3, 12);
    x.fillStyle = "#ffb547";
    x.fillRect(19, 1, 3, 2.4); x.fillRect(-22, 1, 3, 2.4);
    // motor yuvaları
    x.fillStyle = "#3a4361";
    x.beginPath(); x.roundRect ? x.roundRect(-10, 21, 7, 10, 2) : x.rect(-10, 21, 7, 10); x.fill();
    x.beginPath(); x.roundRect ? x.roundRect(3, 21, 7, 10, 2) : x.rect(3, 21, 7, 10); x.fill();
    // gövde
    var govde = x.createLinearGradient(-11, 0, 11, 0);
    govde.addColorStop(0, "#8d9bb8"); govde.addColorStop(0.45, "#f6f8fd"); govde.addColorStop(1, "#a2afc8");
    x.fillStyle = govde;
    x.beginPath();
    x.moveTo(0, -37);
    x.bezierCurveTo(5, -30, 9, -18, 10, -2);
    x.lineTo(12, 20); x.lineTo(7, 28); x.lineTo(-7, 28); x.lineTo(-12, 20); x.lineTo(-10, -2);
    x.bezierCurveTo(-9, -18, -5, -30, 0, -37);
    x.closePath(); x.fill();
    // panel çizgileri
    x.strokeStyle = "rgba(48,60,96,.45)"; x.lineWidth = 0.9;
    x.beginPath(); x.moveTo(-9.5, 4); x.lineTo(9.5, 4); x.moveTo(-11, 14); x.lineTo(11, 14); x.stroke();
    x.strokeStyle = "rgba(255,181,71,.95)"; x.lineWidth = 1.6;
    x.beginPath(); x.moveTo(0, 7); x.lineTo(0, 24); x.stroke();
    // kokpit
    var cam = x.createLinearGradient(0, -24, 0, -2);
    cam.addColorStop(0, "#36508f"); cam.addColorStop(1, "#111a33");
    x.fillStyle = cam;
    x.beginPath(); x.ellipse(0, -13, 4.8, 10, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = "rgba(255,214,150,.85)";
    x.beginPath(); x.ellipse(-1.5, -17, 1.3, 3.4, 0, 0, Math.PI * 2); x.fill();
  }

  /* ── Akıncı: mercan ok başı ── */
  function akinci(x) {
    var g = x.createLinearGradient(0, -16, 0, 19);
    g.addColorStop(0, "#ff8a6a"); g.addColorStop(1, "#b8261a");
    dolgu(x, [0, 19, 14, -4, 18, -15, 8, -10, 0, -16, -8, -10, -18, -15, -14, -4], g);
    dolgu(x, [0, 11, 7, -3, 0, -8, -7, -3], "#4a0c10");
    x.strokeStyle = "rgba(255,220,200,.55)"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(-18, -15); x.lineTo(-8, -10); x.lineTo(0, -16); x.lineTo(8, -10); x.lineTo(18, -15); x.stroke();
    x.shadowColor = "#ffb547"; x.shadowBlur = 8;
    x.fillStyle = "#ffd27a";
    x.beginPath(); x.arc(0, 0, 3.2, 0, Math.PI * 2); x.fill();
    x.shadowBlur = 0;
  }

  /* ── Dalgacı: mor uçan daire ── */
  function dalgaci(x) {
    x.shadowColor = "#a184ff"; x.shadowBlur = 10;
    x.fillStyle = "rgba(161,132,255,.55)";
    x.beginPath(); x.ellipse(0, 7, 15, 3.6, 0, 0, Math.PI * 2); x.fill();
    x.shadowBlur = 0;
    var g = x.createLinearGradient(0, -6, 0, 10);
    g.addColorStop(0, "#cbbcff"); g.addColorStop(1, "#4b33a8");
    x.fillStyle = g;
    x.beginPath(); x.ellipse(0, 2, 24, 8, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = "rgba(255,255,255,.28)"; x.lineWidth = 1;
    x.beginPath(); x.ellipse(0, 3, 23, 3.2, 0, 0, Math.PI * 2); x.stroke();
    var k = x.createLinearGradient(0, -10, 0, 0);
    k.addColorStop(0, "rgba(240,236,255,.95)"); k.addColorStop(1, "rgba(143,117,255,.6)");
    x.fillStyle = k;
    x.beginPath(); x.ellipse(0, -1, 10, 9, 0, Math.PI, Math.PI * 2); x.closePath(); x.fill();
    x.fillStyle = "#ffd27a";
    [-17, -8.5, 0, 8.5, 17].forEach(function (px) { x.beginPath(); x.arc(px, 4, 1.5, 0, Math.PI * 2); x.fill(); });
  }

  /* ── Taret gemisi: çelik zırh, kehribar plakalar ── */
  function taret(x) {
    x.fillStyle = "#6d7896";
    x.fillRect(-3.2, 12, 6.4, 16);
    x.fillStyle = "#ff5a3c";
    x.fillRect(-3.2, 25, 6.4, 3);
    var g = x.createLinearGradient(0, -22, 0, 24);
    g.addColorStop(0, "#46526f"); g.addColorStop(1, "#1a2033");
    dolgu(x, [-16, -22, 16, -22, 26, -8, 22, 14, 10, 23, -10, 23, -22, 14, -26, -8], g);
    x.strokeStyle = "rgba(255,255,255,.16)"; x.lineWidth = 1.2;
    yol(x, [-16, -22, 16, -22, 26, -8, 22, 14, 10, 23, -10, 23, -22, 14, -26, -8]); x.stroke();
    dolgu(x, [26, -8, 20, -8, 17, 11, 22, 14], "#ffb547", true);
    dolgu(x, [-10, -22, 10, -22, 7, -16, -7, -16], "#59658a");
    var o = x.createRadialGradient(0, 0, 1, 0, 0, 9);
    o.addColorStop(0, "#fff3d6"); o.addColorStop(0.45, "#ff5a3c"); o.addColorStop(1, "#5a1006");
    x.shadowColor = "#ff5a3c"; x.shadowBlur = 12;
    x.fillStyle = o;
    x.beginPath(); x.arc(0, 0, 8.5, 0, Math.PI * 2); x.fill();
    x.shadowBlur = 0;
    x.fillStyle = "rgba(255,255,255,.35)";
    [[-13, -14], [13, -14], [-14, 8], [14, 8]].forEach(function (p) { x.beginPath(); x.arc(p[0], p[1], 1.2, 0, Math.PI * 2); x.fill(); });
  }

  /* ── Dalıcı: pembe yaban arısı ── */
  function dalici(x) {
    x.fillStyle = "rgba(255,226,240,.32)"; x.strokeStyle = "rgba(255,200,226,.7)"; x.lineWidth = 1;
    [[-11, -0.5], [11, 0.5]].forEach(function (k) {
      x.beginPath(); x.ellipse(k[0], -4, 10, 5, k[1], 0, Math.PI * 2); x.fill(); x.stroke();
    });
    dolgu(x, [0, 21, -3, 13, 3, 13], "#7a1846");
    var g = x.createLinearGradient(0, -15, 0, 15);
    g.addColorStop(0, "#ff9fcf"); g.addColorStop(1, "#c2185f");
    x.fillStyle = g;
    x.beginPath(); x.ellipse(0, 0, 7.5, 15, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = "rgba(60,8,30,.55)";
    x.fillRect(-7, 1, 14, 2.6); x.fillRect(-6, 7, 12, 2.4);
    x.shadowColor = "#ffb547"; x.shadowBlur = 6;
    x.fillStyle = "#ffd27a";
    x.beginPath(); x.arc(-3, -9, 2.1, 0, Math.PI * 2); x.arc(3, -9, 2.1, 0, Math.PI * 2); x.fill();
    x.shadowBlur = 0;
  }

  /* ── Komuta gemisi (boss) gövdesi; çekirdek oyunda canlı çizilir ── */
  function boss(x) {
    var govde = [0, 72, 40, 52, 108, 32, 128, 2, 118, -28, 72, -48, 30, -62, -30, -62, -72, -48, -118, -28, -128, 2, -108, 32, -40, 52];
    var g = x.createLinearGradient(0, -62, 0, 72);
    g.addColorStop(0, "#46516f"); g.addColorStop(0.6, "#232b42"); g.addColorStop(1, "#141a2a");
    dolgu(x, govde, g);
    x.strokeStyle = "rgba(255,255,255,.14)"; x.lineWidth = 1.6;
    yol(x, govde); x.stroke();
    // zırh plakaları
    dolgu(x, [-118, -28, -74, -40, -62, -8, -106, 14], "#55627f", true);
    dolgu(x, [-60, -50, -28, -56, -24, -30, -52, -26], "#4b5774", true);
    // kehribar kenar şeritleri
    x.strokeStyle = "#ffb547"; x.lineWidth = 2.6;
    x.beginPath(); x.moveTo(-106, 30); x.lineTo(-42, 50); x.moveTo(106, 30); x.lineTo(42, 50); x.stroke();
    x.strokeStyle = "rgba(255,181,71,.5)"; x.lineWidth = 1.4;
    x.beginPath(); x.moveTo(-126, 2); x.lineTo(-108, 30); x.moveTo(126, 2); x.lineTo(108, 30); x.stroke();
    // köprü
    x.fillStyle = "#5d6a8d";
    x.beginPath(); x.roundRect ? x.roundRect(-24, -60, 48, 16, 5) : x.rect(-24, -60, 48, 16); x.fill();
    x.fillStyle = "#ffd27a";
    for (var i = 0; i < 5; i++) x.fillRect(-17 + i * 7.5, -54, 4, 3);
    // yan kuleler
    [-86, 86].forEach(function (px) {
      x.fillStyle = "#6d7896"; x.fillRect(px - 3.5, 24, 7, 22);
      x.fillStyle = "#ff5a3c"; x.fillRect(px - 3.5, 42, 7, 4);
      x.fillStyle = "#1c2236"; x.beginPath(); x.arc(px, 18, 15, 0, Math.PI * 2); x.fill();
      x.strokeStyle = "#ffb547"; x.lineWidth = 2; x.beginPath(); x.arc(px, 18, 15, 0, Math.PI * 2); x.stroke();
      x.fillStyle = "#3b4664"; x.beginPath(); x.arc(px, 18, 8, 0, Math.PI * 2); x.fill();
    });
    // çekirdek yuvası
    x.fillStyle = "#0b0f1c"; x.beginPath(); x.arc(0, 8, 31, 0, Math.PI * 2); x.fill();
    x.strokeStyle = "rgba(255,90,60,.55)"; x.lineWidth = 3; x.beginPath(); x.arc(0, 8, 31, 0, Math.PI * 2); x.stroke();
    // ışıklar
    x.fillStyle = "#ff5a3c";
    [[-100, -6], [100, -6], [-60, 30], [60, 30], [-38, -40], [38, -40]].forEach(function (p) { x.beginPath(); x.arc(p[0], p[1], 2, 0, Math.PI * 2); x.fill(); });
  }

  /* ── Mermiler ve ışıklar ── */
  function oyuncuMermi(x) {
    var iz = x.createLinearGradient(0, -12, 0, 16);
    iz.addColorStop(0, "rgba(255,207,122,.9)"); iz.addColorStop(1, "rgba(255,140,60,0)");
    x.fillStyle = iz; x.fillRect(-2.2, -6, 4.4, 22);
    x.shadowColor = "#ffb547"; x.shadowBlur = 10;
    x.fillStyle = "#ffcf7a";
    x.beginPath(); x.roundRect ? x.roundRect(-2.8, -13, 5.6, 16, 2.8) : x.rect(-2.8, -13, 5.6, 16); x.fill();
    x.shadowBlur = 0;
    x.fillStyle = "#fffaf0";
    x.beginPath(); x.roundRect ? x.roundRect(-1.3, -12, 2.6, 12, 1.3) : x.rect(-1.3, -12, 2.6, 12); x.fill();
  }
  function kure(renk) {
    return function (x) {
      var g = x.createRadialGradient(0, 0, 0, 0, 0, 13);
      g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.3, renk); g.addColorStop(0.55, renk); g.addColorStop(1, "rgba(0,0,0,0)");
      x.globalAlpha = 0.85; x.fillStyle = g; x.beginPath(); x.arc(0, 0, 13, 0, Math.PI * 2); x.fill();
      x.globalAlpha = 1; x.fillStyle = renk; x.beginPath(); x.arc(0, 0, 5.2, 0, Math.PI * 2); x.fill();
      x.fillStyle = "#fff"; x.beginPath(); x.arc(0, 0, 3, 0, Math.PI * 2); x.fill();
    };
  }
  function isik(renk) {
    return function (x) {
      var g = x.createRadialGradient(0, 0, 0, 0, 0, 16);
      g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, renk); g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, 16, 0, Math.PI * 2); x.fill();
    };
  }
  function duman(x) {
    var g = x.createRadialGradient(0, 0, 0, 0, 0, 16);
    g.addColorStop(0, "rgba(120,110,150,.55)"); g.addColorStop(1, "rgba(60,50,90,0)");
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, 16, 0, Math.PI * 2); x.fill();
  }

  /* ── Güçlendiriciler ── */
  function guc(renk, ikon) {
    return function (x) {
      x.shadowColor = renk; x.shadowBlur = 12;
      x.strokeStyle = renk; x.lineWidth = 2.4;
      x.fillStyle = "rgba(8,12,26,.88)";
      x.beginPath();
      for (var i = 0; i < 6; i++) { var a = Math.PI / 6 + i * Math.PI / 3; x.lineTo(Math.cos(a) * 14.5, Math.sin(a) * 14.5); }
      x.closePath(); x.fill(); x.stroke();
      x.shadowBlur = 0;
      x.fillStyle = renk; x.strokeStyle = renk;
      ikon(x);
    };
  }
  var IKON = {
    silah: function (x) { x.beginPath(); x.moveTo(2, -9); x.lineTo(-5, 1.5); x.lineTo(-0.5, 1.5); x.lineTo(-2, 9); x.lineTo(5, -1.5); x.lineTo(0.5, -1.5); x.closePath(); x.fill(); },
    kalkan: function (x) { x.beginPath(); x.moveTo(0, -8.5); x.lineTo(6.5, -5.5); x.lineTo(6.5, 0); x.bezierCurveTo(6.5, 4.5, 3.5, 7.5, 0, 9); x.bezierCurveTo(-3.5, 7.5, -6.5, 4.5, -6.5, 0); x.lineTo(-6.5, -5.5); x.closePath(); x.fill(); },
    onarim: function (x) { x.fillRect(-2, -7.5, 4, 15); x.fillRect(-7.5, -2, 15, 4); }
  };

  /* ── Uzak gezegen ── */
  function gezegen(x) {
    var R = 70;
    x.save();
    x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.clip();
    var g = x.createRadialGradient(-26, -30, 8, 0, 0, R * 1.05);
    g.addColorStop(0, "#f2b27a"); g.addColorStop(0.45, "#b8643a"); g.addColorStop(1, "#2a1020");
    x.fillStyle = g; x.fillRect(-R, -R, R * 2, R * 2);
    x.globalAlpha = 0.22;
    for (var i = -4; i <= 4; i++) {
      x.fillStyle = i % 2 ? "#ffd6a8" : "#5a2018";
      x.beginPath(); x.ellipse(0, i * 15 + 4, R * 1.2, 4 + Math.abs(i % 3) * 2, -0.25, 0, Math.PI * 2); x.fill();
    }
    x.globalAlpha = 1;
    var golge = x.createLinearGradient(-R, -R, R, R);
    golge.addColorStop(0.35, "rgba(4,6,13,0)"); golge.addColorStop(1, "rgba(4,6,13,.82)");
    x.fillStyle = golge; x.fillRect(-R, -R, R * 2, R * 2);
    x.restore();
    x.strokeStyle = "rgba(255,190,140,.35)"; x.lineWidth = 2;
    x.beginPath(); x.arc(0, 0, R, Math.PI * 0.9, Math.PI * 1.65); x.stroke();
    x.strokeStyle = "rgba(255,214,170,.38)"; x.lineWidth = 5;
    x.beginPath(); x.ellipse(0, 0, R * 1.75, R * 0.36, -0.25, Math.PI * 0.04, Math.PI * 0.96); x.stroke();
    x.strokeStyle = "rgba(255,214,170,.18)"; x.lineWidth = 9;
    x.beginPath(); x.ellipse(0, 0, R * 1.95, R * 0.42, -0.25, Math.PI * 0.06, Math.PI * 0.94); x.stroke();
  }

  window.GRAFIK = {
    yap: function (S, D) {
      var t = function (w, h, f) { return tuvalYap(w, h, S, D, f); };
      var g = {
        S: S, D: D,
        oyuncu: t(72, 80, oyuncu),
        akinci: t(42, 42, akinci),
        dalgaci: t(56, 34, dalgaci),
        taret: t(60, 62, taret),
        dalici: t(48, 48, dalici),
        boss: t(264, 150, boss),
        oyuncuMermi: t(16, 36, oyuncuMermi),
        mermi: { mercan: t(28, 28, kure("#ff5a3c")), mor: t(28, 28, kure("#a184ff")), pembe: t(28, 28, kure("#ff4fa0")), amber: t(28, 28, kure("#ffb547")) },
        isik: { amber: t(32, 32, isik("rgba(255,181,71,.9)")), mercan: t(32, 32, isik("rgba(255,90,60,.9)")), beyaz: t(32, 32, isik("rgba(220,230,255,.9)")), mor: t(32, 32, isik("rgba(161,132,255,.9)")), nane: t(32, 32, isik("rgba(108,240,194,.9)")), pembe: t(32, 32, isik("rgba(255,79,160,.9)")) },
        duman: t(32, 32, duman),
        guc: { silah: t(40, 40, guc("#ffb547", IKON.silah)), kalkan: t(40, 40, guc("#6cf0c2", IKON.kalkan)), onarim: t(40, 40, guc("#ff7a8a", IKON.onarim)) },
        gezegen: tuvalYap(320, 180, 1, D, gezegen)
      };
      g.beyaz = { akinci: beyazla(g.akinci), dalgaci: beyazla(g.dalgaci), taret: beyazla(g.taret), dalici: beyazla(g.dalici), boss: beyazla(g.boss) };
      return g;
    }
  };
})();
`,
    "oyun.js": `// Uzay Savunması — oyun döngüsü. Oynanış sayıları ayarlar.json'dan okunur (Vayra Build ayar paneli bu dosyayı düzenler).
(function () {
  "use strict";

  var A = { gemiHizi: 6, atesHizi: 7, dusmanSikligi: 1, dusmanHizi: 1, can: 5, bossAraligi: 3 };
  var ANAHTAR = "uzay-savunmasi-en-iyi";
  var PUAN = { akinci: 100, dalgaci: 150, dalici: 120, taret: 400 };
  var ALT_BASLIK = ["Akıncı filosu yaklaşıyor", "Dalıcı sürüsü radarda", "Taret gemileri yörüngede", "Gezgin daireler sınırı geçti", "Karma filo saldırıya geçti"];

  var tuval = document.getElementById("tuval"), c = tuval.getContext("2d");
  function $(id) { return document.getElementById(id); }
  var W = 0, H = 0, D = 1, S = 1, G = null;
  var durum = "giris";
  var oyuncu = null, mermiler = [], dmermiler = [], dusmanlar = [], parcalar = [], guclendiriciler = [], yazilar = [], halkalar = [], bekleyen = [];
  var boss = null, skor = 0, gosterilenSkor = -1, dusen = 0, dalga = 0, plan = [], planZaman = 0, dalgaToplam = 1, dalgaBiten = 0, sonrakiDalga = -1;
  var sarsinti = 0, flas = 0, hasarFlas = 0, zamanOlcek = 1, yavasSure = 0, zaman = 0, hudZaman = 0;
  var tuslar = {}, isaretci = null, otoAtes = false;
  var yildizlar = [], gezegen = null;
  var enIyi = 0;
  try { enIyi = Number(localStorage.getItem(ANAHTAR) || 0) || 0; } catch (e) { enIyi = 0; }

  function rast(a, b) { return a + Math.random() * (b - a); }
  function sinir(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sayi(n) { return Math.round(n).toLocaleString("tr-TR"); }
  function bossAraligi() { return Math.max(2, Math.round(A.bossAraligi)); }
  function mermiHizi() { return 210 * S * (0.75 + 0.25 * A.dusmanHizi); }
  function altSinir() { return H - 46 * S; }

  /* ── Boyut ── */
  function boyutla() {
    D = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    tuval.width = Math.round(W * D); tuval.height = Math.round(H * D);
    var yeni = sinir(Math.min(W / 520, H / 820), 0.62, 1.15);
    if (!G || Math.abs(yeni - S) > 0.03 || G.D !== D) { S = yeni; G = window.GRAFIK.yap(S, D); }
    yildizKur();
    if (!gezegen) gezegen = { x: W * 0.8, y: H * 0.3, v: 7, olcek: 1 };
    if (oyuncu) { oyuncu.x = sinir(oyuncu.x, 24 * S, W - 24 * S); oyuncu.y = sinir(oyuncu.y, H * 0.25, altSinir()); }
    canBarKur();
  }
  function yildizKur() {
    yildizlar = [];
    var n = Math.round(Math.min(700, W * H / 2400));
    for (var i = 0; i < n; i++) {
      var k = i % 3, r = Math.random();
      yildizlar.push({
        x: Math.random() * W, y: Math.random() * H, k: k,
        r: [0.7, 1.1, 1.7][k] * rast(0.7, 1.3), a: [0.35, 0.6, 0.95][k] * rast(0.55, 1), t: Math.random() * 6.28,
        renk: r < 0.14 ? "#ffd9a8" : r < 0.3 ? "#bcd0ff" : "#ffffff"
      });
    }
  }

  /* ── Göstergeler ── */
  function canBarKur() {
    var bar = $("canBar"), n = oyuncu ? oyuncu.maxCan : Math.round(A.can), h = "";
    for (var i = 0; i < n; i++) h += "<i></i>";
    bar.innerHTML = h;
    bar.classList.toggle("kucuk", n > 7);
    hudCan(false);
  }
  function hudCan(kayip) {
    var l = $("canBar").children, can = oyuncu ? oyuncu.can : Math.round(A.can);
    for (var i = 0; i < l.length; i++) {
      l[i].classList.toggle("dolu", i < can);
      if (kayip && i === can) { l[i].classList.remove("kayip"); void l[i].offsetWidth; l[i].classList.add("kayip"); }
    }
    $("canBar").parentNode.setAttribute("aria-label", "Can " + can + " / " + l.length);
  }
  function hudSkor() {
    if (gosterilenSkor === skor) return;
    var b = $("skor");
    b.textContent = sayi(skor);
    if (gosterilenSkor >= 0 && skor > gosterilenSkor) { b.classList.remove("artti"); void b.offsetWidth; b.classList.add("artti"); }
    gosterilenSkor = skor;
  }
  function hudDalga() {
    $("dalgaAd").textContent = "Dalga " + dalga;
    var kalan = bossAraligi() - (dalga % bossAraligi());
    $("dalgaNot").textContent = kalan === 1 ? "Sırada komuta gemisi" : "Komuta gemisine " + kalan + " dalga";
    $("dalgaIlerleme").style.width = Math.min(100, (dalgaBiten / Math.max(1, dalgaToplam)) * 100) + "%";
  }
  function hudBoss() {
    var hud = $("hud");
    hud.classList.toggle("boss-var", !!boss);
    $("bossKutu").setAttribute("aria-hidden", boss ? "false" : "true");
    if (!boss) return;
    $("bossCan").style.width = Math.max(0, boss.can / boss.maxCan * 100) + "%";
    $("bossEvre").textContent = "Evre " + boss.evre + " / 3";
  }
  function hudGuc() {
    if (!oyuncu) return;
    var h = "";
    if (oyuncu.silah > 1) h += '<span class="guc silah"><i><svg viewBox="-10 -10 20 20"><path d="M2 -9L-5 1.5h4.5L-2 9l7-10.5H.5z" fill="currentColor"/></svg></i>Silah <small>' + oyuncu.silah + ". seviye</small></span>";
    if (oyuncu.kalkan > 0) h += '<span class="guc kalkan"><i><svg viewBox="-10 -10 20 20"><path d="M0 -8.5l6.5 3v5.5c0 4.5-3 7.5-6.5 9-3.5-1.5-6.5-4.5-6.5-9v-5.5z" fill="currentColor"/></svg></i>Kalkan <small>' + Math.ceil(oyuncu.kalkan) + " sn</small></span>";
    var g = $("guclar");
    if (g.getAttribute("data-h") !== h) { g.innerHTML = h; g.setAttribute("data-h", h); }
  }
  function enIyiYaz() {
    $("enIyi").textContent = sayi(enIyi);
    $("girisEnIyi").textContent = sayi(enIyi);
    $("bittiEnIyi").textContent = sayi(enIyi);
  }
  var afisZ = null;
  function afis(baslik, alt, uyari) {
    var a = $("afis");
    $("afisBaslik").textContent = baslik;
    $("afisAlt").textContent = alt || "";
    a.classList.remove("oyna", "uyari"); void a.offsetWidth;
    if (uyari) a.classList.add("uyari");
    a.classList.add("oyna");
    clearTimeout(afisZ);
    afisZ = setTimeout(function () { a.classList.remove("oyna", "uyari"); }, 2500);
  }
  function ekran(id) {
    ["giris", "durakla", "bitti"].forEach(function (e) { $(e).classList.toggle("gorunur", e === id); });
    $("hud").classList.toggle("gorunur", id !== "giris");
  }

  /* ── Oyun akışı ── */
  function basla() {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    oyuncu = { x: W / 2, y: altSinir() - 40 * S, can: Math.max(1, Math.round(A.can)), maxCan: Math.max(1, Math.round(A.can)), silah: 1, kalkan: 0, dokunulmaz: 1.2, atesSure: 0, egim: 0, olu: false, hx: 0 };
    mermiler = []; dmermiler = []; dusmanlar = []; parcalar = []; guclendiriciler = []; yazilar = []; halkalar = []; bekleyen = [];
    boss = null; skor = 0; gosterilenSkor = -1; dusen = 0; sarsinti = 0; flas = 0; hasarFlas = 0; zamanOlcek = 1; yavasSure = 0;
    isaretci = null; tuslar = {};
    canBarKur(); hudSkor(); hudBoss(); hudGuc();
    durum = "oyun";
    ekran(null);
    dalgaBaslat(1);
  }
  function duraklat() { if (durum !== "oyun") return; durum = "durdu"; tuslar = {}; isaretci = null; ekran("durakla"); setTimeout(function () { $("devam").focus({ preventScroll: true }); }, 50); }
  function devam() { if (durum !== "durdu") return; durum = "oyun"; ekran(null); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }
  function bitir() {
    durum = "bitti";
    var rekor = skor > enIyi;
    if (rekor) { enIyi = skor; try { localStorage.setItem(ANAHTAR, String(skor)); } catch (e) { /* depolama kapalı */ } }
    enIyiYaz();
    $("rekorRozet").classList.toggle("gorunur", rekor && skor > 0);
    $("bittiBaslik").textContent = "Gemin düştü";
    $("bittiMetin").textContent = rekor && skor > 0 ? "Ama bugünün en iyi skoru senin. Bir tur daha?" : "Savunma hattı geri çekiliyor. Bir tur daha?";
    $("sonSkor").textContent = sayi(skor);
    $("sonDalga").textContent = dalga;
    $("sonDusen").textContent = dusen;
    ekran("bitti");
    setTimeout(function () { $("tekrar").focus({ preventScroll: true }); }, 60);
  }

  function dalgaBaslat(n) {
    dalga = n; plan = []; planZaman = 0; dalgaBiten = 0; dalgaToplam = 0; sonrakiDalga = -1;
    var bossDalgasi = n % bossAraligi() === 0;
    if (bossDalgasi) {
      plan.push({ t: 2.6, tur: "boss", adet: 1 });
      afis("Uyarı", "Komuta gemisi yaklaşıyor", true);
    } else {
      var adet = Math.min(15, 6 + n), t = 2;
      for (var i = 0; i < adet; i++) {
        var f = formasyon(n, i);
        plan.push(f);
        f.t = t;
        t += (2.2 - Math.min(1, n * 0.1)) / Math.max(0.2, A.dusmanSikligi) * rast(0.85, 1.15);
      }
      afis("Dalga " + n, n <= 3 ? ALT_BASLIK[n - 1] : ALT_BASLIK[Math.floor(Math.random() * ALT_BASLIK.length)]);
    }
    plan.forEach(function (p) { dalgaToplam += p.adet; });
    hudDalga();
  }
  function formasyon(n, i) {
    var havuz = ["sira", "v", "sira"];
    if (n >= 1) havuz.push("yilan");
    if (n >= 2) havuz.push("dalis", "taret");
    if (n >= 4) havuz.push("yilan", "dalis", "karma");
    var tur = i === 0 ? (n === 1 ? "sira" : havuz[Math.floor(Math.random() * havuz.length)]) : havuz[Math.floor(Math.random() * havuz.length)];
    var genis = alanGenislik();
    var adet = { sira: sinir(Math.round(genis / (74 * S)), 4, 8), v: 7, yilan: 6, dalis: n >= 5 ? 4 : 3, taret: n >= 5 ? 2 : 1, karma: sinir(Math.round(genis / (90 * S)), 4, 6) + 1 }[tur];
    return { tur: tur, adet: adet };
  }
  function alanGenislik() { return Math.min(W, 980 * Math.max(S, 0.8)) - 60 * S; }
  function alanSol() { return (W - alanGenislik()) / 2; }

  /* ── Düşmanlar ── */
  function dusman(tur, x, y, ek) {
    var e = { tur: tur, x: x, y: y, t: 0, faz: Math.random() * 6.28, vurulma: 0, atesZ: rast(1, 3), durum: "gir", sure: 0, kac: false };
    var hiz = A.dusmanHizi * S;
    if (tur === "akinci") { e.can = 1; e.r = 15 * S; e.vy = 150 * hiz; e.atar = dalga >= 3 && Math.random() < 0.3; }
    if (tur === "dalgaci") { e.can = 3; e.r = 18 * S; e.vy = 105 * hiz; e.x0 = x; e.genlik = rast(70, 130) * S; e.atesZ = rast(1.2, 2.6); }
    if (tur === "dalici") { e.can = 2; e.r = 14 * S; e.hedefY = rast(0.12, 0.26) * H; e.vy = 0; e.vx = 0; }
    if (tur === "taret") { e.can = 8 + Math.floor(dalga / 2); e.r = 24 * S; e.hedefY = rast(0.14, 0.3) * H; e.atesZ = 1.2; e.sure = rast(5.5, 7.5); }
    if (ek) for (var k in ek) e[k] = ek[k];
    e.maxCan = e.can;
    dusmanlar.push(e);
    return e;
  }
  function formasyonCikar(f) {
    var sol = alanSol(), gen = alanGenislik(), i;
    if (f.tur === "sira" || f.tur === "karma") {
      var n = f.tur === "karma" ? f.adet - 1 : f.adet;
      for (i = 0; i < n; i++) dusman("akinci", sol + gen * (i + 0.5) / n, -30 * S - (i % 2) * 26 * S);
      if (f.tur === "karma") dusman("taret", sol + gen * rast(0.3, 0.7), -50 * S);
    } else if (f.tur === "v") {
      var orta = sol + gen * rast(0.3, 0.7), m = (f.adet - 1) / 2;
      for (i = 0; i < f.adet; i++) dusman("akinci", orta + (i - m) * 50 * S, -30 * S - Math.abs(i - m) * 36 * S);
    } else if (f.tur === "yilan") {
      var x0 = sol + gen * (Math.random() < 0.5 ? rast(0.22, 0.38) : rast(0.62, 0.78)), faz = Math.random() * 6.28;
      for (i = 0; i < f.adet; i++) (function (j) {
        bekleyen.push({ t: j * 0.3, f: function () { dusman("dalgaci", x0, -24 * S, { faz: faz - j * 0.55 }); } });
      })(i);
    } else if (f.tur === "dalis") {
      for (i = 0; i < f.adet; i++) (function (j) {
        bekleyen.push({ t: j * 0.35, f: function () { dusman("dalici", sol + gen * rast(0.1, 0.9), -24 * S); } });
      })(i);
    } else if (f.tur === "taret") {
      for (i = 0; i < f.adet; i++) dusman("taret", sol + gen * (f.adet === 1 ? rast(0.3, 0.7) : (i ? rast(0.6, 0.8) : rast(0.2, 0.4))), -40 * S);
    } else if (f.tur === "boss") {
      bossYap();
    }
  }
  function dusmanGuncelle(e, dt) {
    e.t += dt;
    if (e.vurulma > 0) e.vurulma -= dt;
    var hiz = A.dusmanHizi * S;
    if (e.tur === "akinci") {
      e.y += e.vy * dt;
      e.x += Math.sin(e.t * 2.2 + e.faz) * 34 * S * dt;
      if (e.atar && e.y > H * 0.12 && e.y < H * 0.5) { e.atar = false; nisanli(e.x, e.y + 12 * S, 1, 0, "mercan"); }
    } else if (e.tur === "dalgaci") {
      e.y += e.vy * dt;
      e.x = e.x0 + Math.sin(e.t * 1.7 + e.faz) * e.genlik;
      e.atesZ -= dt;
      if (e.atesZ <= 0 && e.y > 30 * S && e.y < H * 0.65) { e.atesZ = rast(1.6, 2.8) / Math.max(0.4, A.dusmanHizi); dmermi(e.x, e.y + 10 * S, 0, mermiHizi() * 0.85, "mor"); }
    } else if (e.tur === "dalici") {
      if (e.durum === "gir") { e.y += (e.hedefY - e.y) * Math.min(1, dt * 3); if (Math.abs(e.y - e.hedefY) < 3 * S) { e.durum = "bekle"; e.sure = 0.55; } }
      else if (e.durum === "bekle") {
        e.sure -= dt; e.x += Math.sin(e.t * 40) * 0.6;
        if (e.sure <= 0 && oyuncu) {
          var dx = oyuncu.x - e.x, dy = oyuncu.y - e.y, l = Math.max(1, Math.hypot(dx, dy)), v = 380 * hiz;
          e.vx = dx / l * v; e.vy = dy / l * v; e.durum = "dal";
        }
      } else { e.x += e.vx * dt; e.y += e.vy * dt; }
    } else if (e.tur === "taret") {
      if (e.durum === "gir") { e.y += Math.max(40 * S, (e.hedefY - e.y) * 2) * dt * A.dusmanHizi; if (e.y >= e.hedefY) e.durum = "dur"; }
      else if (e.durum === "dur") {
        e.sure -= dt; e.x += Math.sin(e.t * 0.8 + e.faz) * 26 * S * dt;
        e.atesZ -= dt;
        if (e.atesZ <= 0) {
          e.atesZ = 1.6 / Math.max(0.4, A.dusmanHizi);
          [0, 0.13, 0.26].forEach(function (g) { bekleyen.push({ t: g, f: function () { if (dusmanlar.indexOf(e) >= 0) nisanli(e.x, e.y + 26 * S, 1, 0, "mercan"); } }); });
        }
        if (e.sure <= 0) e.durum = "cik";
      } else { e.y += 130 * hiz * dt; }
    }
    if (e.y > H + 60 * S || e.x < -80 * S || e.x > W + 80 * S) { e.kac = true; }
  }

  /* ── Komuta gemisi ── */
  function bossYap() {
    var tur = Math.max(1, Math.round(dalga / bossAraligi()));
    boss = { x: W / 2, y: -110 * S, hedefY: Math.max(120 * S, H * 0.2), t: 0, maxCan: 140 + 60 * tur, evre: 1, a: 1.2, b: 0.5, aci: 0, vurulma: 0, giris: true, olum: 0, patZ: 0, tur: tur };
    boss.can = boss.maxCan;
    hudBoss();
  }
  function bossGuncelle(dt) {
    var b = boss;
    b.t += dt;
    if (b.vurulma > 0) b.vurulma -= dt;
    if (b.olum > 0) {
      b.olum -= dt; b.patZ -= dt;
      b.x += Math.sin(b.t * 50) * 1.2; b.y += 10 * S * dt;
      if (b.patZ <= 0) { b.patZ = 0.11; patlama(b.x + rast(-110, 110) * S, b.y + rast(-50, 50) * S, rast(0.6, 1.1), Math.random() < 0.5 ? "mercan" : "amber"); }
      if (b.olum <= 0) bossOldu();
      return;
    }
    if (b.giris) {
      b.y += (b.hedefY - b.y) * Math.min(1, dt * 1.3);
      if (Math.abs(b.y - b.hedefY) < 3 * S) b.giris = false;
      return;
    }
    var oran = b.can / b.maxCan, evre = oran > 0.66 ? 1 : oran > 0.33 ? 2 : 3;
    if (evre !== b.evre) {
      b.evre = evre; flas = 0.5; sarsinti = Math.max(sarsinti, 10);
      for (var p = 0; p < 4; p++) patlama(b.x + rast(-90, 90) * S, b.y + rast(-30, 30) * S, 0.7, "amber");
      hudBoss();
    }
    var hizK = 0.8 + 0.2 * A.dusmanHizi;
    var genlik = Math.min(W * 0.32, 300 * S);
    b.x = W / 2 + Math.sin(b.t * (evre === 3 ? 0.85 : 0.5)) * genlik;
    b.y = b.hedefY + Math.sin(b.t * 1.3) * 10 * S;
    var namlu = b.y + 46 * S;
    b.a -= dt * hizK; b.b -= dt * hizK;
    if (evre === 1) {
      if (b.a <= 0) { b.a = 1.5; nisanli(b.x, namlu, 7, 0.95, "mercan"); }
      if (b.b <= 0) { b.b = 0.5; var yan = (Math.floor(b.t * 2) % 2 ? 1 : -1) * 86 * S; dmermi(b.x + yan, b.y + 46 * S, 0, mermiHizi() * 1.1, "amber"); dmermi(b.x + yan, b.y + 46 * S, yan > 0 ? 30 * S : -30 * S, mermiHizi(), "amber"); }
    } else if (evre === 2) {
      if (b.b <= 0) { b.b = 0.09; for (var k = 0; k < 2; k++) { var a = b.aci + k * Math.PI; dmermi(b.x, b.y + 8 * S, Math.cos(a) * mermiHizi() * 0.8, Math.sin(a) * mermiHizi() * 0.8 + 20 * S, "mor"); } b.aci += 0.29; }
      if (b.a <= 0) { b.a = 2.4; nisanli(b.x, namlu, 5, 0.7, "mercan"); }
    } else {
      if (b.b <= 0) { b.b = 1.1; var n = 20, ofs = b.t * 0.7; for (var j = 0; j < n; j++) { var r = ofs + j * Math.PI * 2 / n; dmermi(b.x, b.y + 8 * S, Math.cos(r) * mermiHizi() * 0.75, Math.sin(r) * mermiHizi() * 0.75, "pembe"); } }
      if (b.a <= 0) { b.a = 0.7; nisanli(b.x, namlu, 3, 0.3, "mercan"); }
    }
  }
  function bossVur(x, y) {
    var b = boss;
    if (!b || b.olum > 0) return false;
    var dx = x - b.x, dy = y - b.y;
    if (Math.abs(dx) < 50 * S && dy > -60 * S && dy < 70 * S) return true;
    if (Math.abs(dx) < 128 * S && dy > -30 * S && dy < 32 * S - Math.abs(dx) * 0.2) return true;
    return false;
  }
  function bossOldu() {
    var b = boss, bonus = 5000 * b.tur;
    patlama(b.x, b.y, 3.2, "amber");
    patlama(b.x - 70 * S, b.y, 1.6, "mercan");
    patlama(b.x + 70 * S, b.y, 1.6, "mercan");
    flas = 1; sarsinti = 26; zamanOlcek = 0.35; yavasSure = 0.7;
    skor += bonus; dusen++;
    yazi(b.x, b.y - 30 * S, "Bonus " + sayi(bonus), "#ffd27a", 1.4);
    guclendir(b.x - 40 * S, b.y, "silah"); guclendir(b.x + 40 * S, b.y, "kalkan"); guclendir(b.x, b.y + 20 * S, "onarim");
    dalgaBiten = dalgaToplam;
    boss = null; hudBoss(); hudDalga();
    afis("Komuta gemisi düştü", "Bonus " + sayi(bonus) + " puan");
    sonrakiDalga = 3.2;
  }

  /* ── Mermiler ── */
  function dmermi(x, y, vx, vy, renk) { dmermiler.push({ x: x, y: y, vx: vx, vy: vy, r: 5 * S, renk: renk }); }
  function nisanli(x, y, n, yayilim, renk) {
    if (!oyuncu) return;
    var temel = Math.atan2(oyuncu.y - y, oyuncu.x - x), v = mermiHizi();
    for (var i = 0; i < n; i++) {
      var a = temel + (n > 1 ? (i / (n - 1) - 0.5) * yayilim : 0);
      dmermi(x, y, Math.cos(a) * v, Math.sin(a) * v, renk);
    }
  }
  function ates() {
    var o = oyuncu, v = -880 * S, lv = o.silah, burun = o.y - 30 * S;
    function m(dx, a) { mermiler.push({ x: o.x + dx * S, y: burun + Math.abs(dx) * 0.6 * S, vx: Math.sin(a) * -v, vy: Math.cos(a) * v, a: a }); }
    m(-5, 0); m(5, 0);
    if (lv >= 2) m(0, 0);
    if (lv >= 3) { m(-12, -0.13); m(12, 0.13); }
    if (lv >= 4) { m(-20, -0.26); m(20, 0.26); }
    parca(o.x, burun, "isik", "amber", 0, 0, 0.06, 9 * S);
  }

  /* ── Parçacıklar ── */
  function parca(x, y, tur, renk, vx, vy, omur, boy) { if (parcalar.length < 1400) parcalar.push({ x: x, y: y, tur: tur, renk: renk, vx: vx, vy: vy, t: 0, omur: omur, boy: boy }); }
  function patlama(x, y, guc, renk) {
    var i, a, v;
    parca(x, y, "isik", "beyaz", 0, 0, 0.18, 34 * S * guc);
    parca(x, y, "isik", renk, 0, 0, 0.32, 54 * S * guc);
    for (i = 0; i < 16 * guc; i++) { a = Math.random() * 6.28; v = rast(120, 460) * S * Math.sqrt(guc); parca(x, y, "kivilcim", Math.random() < 0.35 ? "#fff3d6" : renk === "mor" ? "#c9b8ff" : renk === "pembe" ? "#ff9fcf" : "#ffb547", Math.cos(a) * v, Math.sin(a) * v, rast(0.25, 0.6), 1.6 * S); }
    for (i = 0; i < 9 * guc; i++) { a = Math.random() * 6.28; v = rast(20, 140) * S; parca(x, y, "isik", Math.random() < 0.5 ? renk : "amber", Math.cos(a) * v, Math.sin(a) * v, rast(0.4, 0.9), rast(5, 10) * S); }
    for (i = 0; i < 6 * guc; i++) { a = Math.random() * 6.28; v = rast(10, 60) * S; parca(x + rast(-6, 6) * S, y + rast(-6, 6) * S, "duman", "", Math.cos(a) * v, Math.sin(a) * v + 20 * S, rast(0.8, 1.4), rast(14, 24) * S * Math.sqrt(guc)); }
    halkalar.push({ x: x, y: y, t: 0, omur: 0.45, r: 70 * S * guc, renk: renk });
    sarsinti = Math.min(30, sarsinti + 3 * guc);
  }
  function yazi(x, y, metin, renk, omur) { yazilar.push({ x: x, y: y, metin: metin, renk: renk || "#ffd27a", t: 0, omur: omur || 0.9 }); }

  /* ── Güçlendiriciler ── */
  function guclendir(x, y, tur) {
    if (!tur) {
      var r = Math.random();
      tur = r < 0.45 ? "silah" : r < 0.75 ? "kalkan" : "onarim";
      if (tur === "silah" && oyuncu && oyuncu.silah >= 4) tur = "kalkan";
      if (tur === "onarim" && oyuncu && oyuncu.can >= oyuncu.maxCan) tur = oyuncu.silah < 4 ? "silah" : "kalkan";
    }
    guclendiriciler.push({ x: x, y: y, tur: tur, t: Math.random() * 6, vy: 72 * S });
  }
  function gucAl(p) {
    var o = oyuncu, renk = { silah: "#ffb547", kalkan: "#6cf0c2", onarim: "#ff7a8a" }[p.tur];
    if (p.tur === "silah") { o.silah = Math.min(4, o.silah + 1); yazi(p.x, p.y - 20 * S, "Silah " + o.silah + ". seviye", renk, 1.1); }
    if (p.tur === "kalkan") { o.kalkan = 8; yazi(p.x, p.y - 20 * S, "Kalkan açık", renk, 1.1); }
    if (p.tur === "onarim") { o.can = Math.min(o.maxCan, o.can + 1); hudCan(false); yazi(p.x, p.y - 20 * S, "Onarım", renk, 1.1); }
    skor += 250;
    halkalar.push({ x: p.x, y: p.y, t: 0, omur: 0.4, r: 46 * S, renk: p.tur === "kalkan" ? "nane" : p.tur === "onarim" ? "pembe" : "amber" });
    hudGuc();
  }

  /* ── Hasar ── */
  function hasar() {
    var o = oyuncu;
    if (!o || o.olu || o.dokunulmaz > 0 || durum !== "oyun") return;
    if (o.kalkan > 0) {
      o.kalkan = 0; o.dokunulmaz = 0.9;
      halkalar.push({ x: o.x, y: o.y, t: 0, omur: 0.5, r: 80 * S, renk: "nane" });
      mermiTemizle(150 * S); hudGuc();
      return;
    }
    o.can--; o.dokunulmaz = 1.8; o.silah = Math.max(1, o.silah - 1);
    hasarFlas = 1; sarsinti = Math.max(sarsinti, 14);
    patlama(o.x, o.y, 0.8, "mercan");
    mermiTemizle(140 * S);
    hudCan(true); hudGuc();
    if (o.can <= 0) {
      o.olu = true;
      patlama(o.x, o.y, 2.6, "amber");
      flas = 0.8; sarsinti = 28;
      setTimeout(function () { if (durum === "oyun" && oyuncu && oyuncu.olu) bitir(); }, 1700);
    }
  }
  function mermiTemizle(r) {
    dmermiler = dmermiler.filter(function (m) {
      if (Math.hypot(m.x - oyuncu.x, m.y - oyuncu.y) < r) { parca(m.x, m.y, "isik", m.renk, 0, 0, 0.25, 10 * S); return false; }
      return true;
    });
  }
  function oldur(e) {
    var guc = e.tur === "taret" ? 1.5 : e.tur === "dalgaci" ? 1.05 : 0.85;
    var renk = e.tur === "dalgaci" ? "mor" : e.tur === "dalici" ? "pembe" : "mercan";
    patlama(e.x, e.y, guc, renk);
    var p = PUAN[e.tur] || 100;
    skor += p; dusen++;
    yazi(e.x, e.y - 14 * S, String(p), "#ffd27a", 0.8);
    var sans = { akinci: 0.05, dalgaci: 0.1, dalici: 0.08, taret: 0.5 }[e.tur] || 0.05;
    if (Math.random() < sans) guclendir(e.x, e.y);
  }

  /* ── Güncelle ── */
  function guncelle(dt) {
    zaman += dt;
    if (gezegen) {
      gezegen.y += gezegen.v * S * dt;
      if (gezegen.y - 120 > H) gezegen = { x: rast(0.1, 0.9) * W, y: -160, v: rast(5, 9), olcek: rast(0.6, 1.1) };
    }
    var akisH = durum === "oyun" ? 1 : 0.6;
    for (var i = 0; i < yildizlar.length; i++) {
      var y = yildizlar[i];
      y.y += [14, 34, 86][y.k] * S * dt * akisH;
      if (y.y > H + 4) { y.y = -4; y.x = Math.random() * W; }
    }
    if (durum !== "oyun" && durum !== "bitti") { parcaGuncelle(dt); return; }

    var o = oyuncu;
    // Hareket
    if (!o.olu) {
      var dx = (tuslar.ArrowRight || tuslar.KeyD ? 1 : 0) - (tuslar.ArrowLeft || tuslar.KeyA ? 1 : 0);
      var dy = (tuslar.ArrowDown || tuslar.KeyS ? 1 : 0) - (tuslar.ArrowUp || tuslar.KeyW ? 1 : 0);
      if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
      var hiz = A.gemiHizi * 60 * S;
      var eskiX = o.x;
      o.x += dx * hiz * dt; o.y += dy * hiz * dt;
      if (isaretci && isaretci.hx !== undefined) {
        var tx = isaretci.hx, ty = isaretci.hy;
        var k = Math.min(1, dt * 18);
        o.x += (tx - o.x) * k; o.y += (ty - o.y) * k;
      }
      o.x = sinir(o.x, 24 * S, W - 24 * S); o.y = sinir(o.y, H * 0.25, altSinir());
      var vx = (o.x - eskiX) / Math.max(dt, 0.001);
      o.egim += (sinir(vx / (hiz || 1), -1, 1) - o.egim) * Math.min(1, dt * 10);
      // Ateş
      o.atesSure -= dt;
      if ((tuslar.Space || isaretci || otoAtes) && o.atesSure <= 0) { ates(); o.atesSure = 1 / Math.max(1, A.atesHizi); }
      if (o.dokunulmaz > 0) o.dokunulmaz -= dt;
      if (o.kalkan > 0) { o.kalkan -= dt; if (o.kalkan <= 0) { o.kalkan = 0; hudGuc(); } }
    }

    // Dalga planı
    planZaman += dt;
    while (plan.length && plan[0].t <= planZaman) formasyonCikar(plan.shift());
    for (var b = bekleyen.length - 1; b >= 0; b--) { bekleyen[b].t -= dt; if (bekleyen[b].t <= 0) { var f = bekleyen[b].f; bekleyen.splice(b, 1); f(); } }
    if (durum === "bitti") { /* gemi düştü: dünya akmaya devam eder */ }
    else if (sonrakiDalga > 0) { sonrakiDalga -= dt; if (sonrakiDalga <= 0) dalgaBaslat(dalga + 1); }
    else if (!plan.length && !bekleyen.length && !dusmanlar.length && !boss && !o.olu) {
      var bonus = 500 * dalga;
      skor += bonus;
      yazi(W / 2, H * 0.5, "Dalga temizlendi · " + sayi(bonus), "#ffd27a", 1.6);
      sonrakiDalga = 1.8;
    }

    // Oyuncu mermileri
    for (var m = mermiler.length - 1; m >= 0; m--) {
      var mr = mermiler[m];
      mr.x += mr.vx * dt; mr.y += mr.vy * dt;
      var vurdu = false;
      for (var d = 0; d < dusmanlar.length; d++) {
        var e = dusmanlar[d];
        if (Math.abs(mr.x - e.x) < e.r + 3 * S && Math.abs(mr.y - e.y) < e.r + 8 * S) {
          e.can--; e.vurulma = 0.07; vurdu = true;
          parca(mr.x, mr.y, "kivilcim", "#fff3d6", rast(-80, 80) * S, rast(-160, -40) * S, 0.18, 1.4 * S);
          break;
        }
      }
      if (!vurdu && boss && bossVur(mr.x, mr.y)) {
        vurdu = true;
        if (!boss.giris) { boss.can -= 1; boss.vurulma = 0.06; }
        parca(mr.x, mr.y, "isik", "amber", 0, 0, 0.12, 9 * S);
        if (boss.can <= 0 && boss.olum <= 0) { boss.can = 0; boss.olum = 1.7; boss.patZ = 0; dmermiler.forEach(function (q) { parca(q.x, q.y, "isik", q.renk, 0, 0, 0.3, 10 * S); }); dmermiler = []; }
      }
      if (vurdu || mr.y < -30 || mr.x < -30 || mr.x > W + 30) mermiler.splice(m, 1);
    }
    // Düşmanlar
    for (var i2 = dusmanlar.length - 1; i2 >= 0; i2--) {
      var en = dusmanlar[i2];
      dusmanGuncelle(en, dt);
      if (en.can <= 0) { oldur(en); dusmanlar.splice(i2, 1); dalgaBiten++; continue; }
      if (!o.olu && Math.hypot(en.x - o.x, en.y - o.y) < en.r + 14 * S) { hasar(); en.can = 0; oldur(en); dusmanlar.splice(i2, 1); dalgaBiten++; continue; }
      if (en.kac) { dusmanlar.splice(i2, 1); dalgaBiten++; }
    }
    if (boss) {
      bossGuncelle(dt);
      if (boss && !o.olu && boss.olum <= 0 && bossVur(o.x, o.y)) hasar();
      if (boss) { $("bossCan").style.width = Math.max(0, boss.can / boss.maxCan * 100) + "%"; }
    }
    // Düşman mermileri
    var oR = 8 * S;
    for (var q = dmermiler.length - 1; q >= 0; q--) {
      var dm = dmermiler[q];
      dm.x += dm.vx * dt; dm.y += dm.vy * dt;
      if (!o.olu && Math.abs(dm.x - o.x) < dm.r + oR && Math.abs(dm.y - o.y) < dm.r + oR && Math.hypot(dm.x - o.x, dm.y - o.y) < dm.r + oR) {
        dmermiler.splice(q, 1); hasar(); q = Math.min(q, dmermiler.length); continue;
      }
      if (dm.y > H + 20 || dm.y < -40 || dm.x < -20 || dm.x > W + 20) dmermiler.splice(q, 1);
    }
    // Güçlendiriciler
    for (var g = guclendiriciler.length - 1; g >= 0; g--) {
      var p = guclendiriciler[g];
      p.t += dt; p.y += p.vy * dt; p.x += Math.sin(p.t * 2) * 20 * S * dt;
      if (!o.olu && Math.hypot(p.x - o.x, p.y - o.y) < 30 * S) { gucAl(p); guclendiriciler.splice(g, 1); continue; }
      if (p.y > H + 30) guclendiriciler.splice(g, 1);
    }
    parcaGuncelle(dt);

    hudZaman -= dt;
    if (hudZaman <= 0) { hudZaman = 0.2; hudDalga(); hudGuc(); }
    hudSkor();
  }
  function parcaGuncelle(dt) {
    for (var i = parcalar.length - 1; i >= 0; i--) {
      var p = parcalar[i];
      p.t += dt;
      if (p.t >= p.omur) { parcalar.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      var s = p.tur === "duman" ? 0.96 : 0.9;
      p.vx *= Math.pow(s, dt * 60); p.vy *= Math.pow(s, dt * 60);
    }
    for (var h = halkalar.length - 1; h >= 0; h--) { halkalar[h].t += dt; if (halkalar[h].t >= halkalar[h].omur) halkalar.splice(h, 1); }
    for (var y = yazilar.length - 1; y >= 0; y--) { yazilar[y].t += dt; yazilar[y].y -= 34 * S * dt; if (yazilar[y].t >= yazilar[y].omur) yazilar.splice(y, 1); }
    if (sarsinti > 0) sarsinti = Math.max(0, sarsinti - dt * 40);
    if (flas > 0) flas = Math.max(0, flas - dt * 2.2);
    if (hasarFlas > 0) hasarFlas = Math.max(0, hasarFlas - dt * 1.6);
  }

  /* ── Çiz ── */
  function resim(s, x, y, olcek) {
    olcek = olcek || 1;
    c.drawImage(s.c, x - s.w * olcek / 2, y - s.h * olcek / 2, s.w * olcek, s.h * olcek);
  }
  function alev(x, y, boy, gen) {
    var g = c.createLinearGradient(x, y, x, y + boy);
    g.addColorStop(0, "rgba(255,250,235,.95)"); g.addColorStop(0.25, "rgba(255,190,90,.9)"); g.addColorStop(0.6, "rgba(255,90,60,.55)"); g.addColorStop(1, "rgba(255,60,40,0)");
    c.fillStyle = g;
    c.beginPath(); c.moveTo(x - gen, y); c.quadraticCurveTo(x, y + boy * 1.15, x + gen, y); c.closePath(); c.fill();
  }
  function gemiCiz(x, y, egim, saydam) {
    c.save();
    c.translate(x, y);
    c.rotate(egim * 0.1);
    c.scale(1 - Math.abs(egim) * 0.14, 1);
    if (saydam) c.globalAlpha = saydam;
    c.globalCompositeOperation = "lighter";
    var tit = 0.75 + Math.random() * 0.35;
    alev(-6.5 * S, 29 * S, 24 * S * tit, 4 * S);
    alev(6.5 * S, 29 * S, 24 * S * (1.85 - tit), 4 * S);
    c.drawImage(G.isik.amber.c, -6.5 * S - 9 * S, 27 * S, 18 * S, 18 * S);
    c.drawImage(G.isik.amber.c, 6.5 * S - 9 * S, 27 * S, 18 * S, 18 * S);
    c.globalCompositeOperation = "source-over";
    resim(G.oyuncu, 0, 0);
    c.restore();
  }
  function ciz() {
    c.setTransform(D, 0, 0, D, 0, 0);
    c.clearRect(0, 0, W, H);
    var zm = performance.now() / 1000;

    // Yıldızlar
    for (var i = 0; i < yildizlar.length; i++) {
      var y = yildizlar[i], a = y.a * (0.72 + 0.28 * Math.sin(y.t + zm * (1.5 + y.k)));
      c.globalAlpha = a; c.fillStyle = y.renk;
      if (y.k === 2 && durum === "oyun") c.fillRect(y.x, y.y, y.r, y.r * 1.9);
      else c.fillRect(y.x, y.y, y.r, y.r);
    }
    c.globalAlpha = 1;
    if (gezegen) { c.globalAlpha = 0.85; resim(G.gezegen, gezegen.x, gezegen.y, gezegen.olcek * Math.max(0.7, S)); c.globalAlpha = 1; }

    c.save();
    if (sarsinti > 0) c.translate(rast(-1, 1) * sarsinti * 0.6, rast(-1, 1) * sarsinti * 0.6);

    // Güçlendiriciler
    for (var g = 0; g < guclendiriciler.length; g++) {
      var p = guclendiriciler[g];
      c.globalCompositeOperation = "lighter";
      c.globalAlpha = 0.55 + 0.25 * Math.sin(p.t * 5);
      var renk = p.tur === "kalkan" ? "nane" : p.tur === "onarim" ? "pembe" : "amber";
      resim(G.isik[renk], p.x, p.y, 2.4);
      c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
      c.save(); c.translate(p.x, p.y); c.rotate(Math.sin(p.t * 1.6) * 0.25); resim(G.guc[p.tur], 0, 0, 1 + 0.06 * Math.sin(p.t * 6)); c.restore();
    }

    // Düşmanlar
    for (var d = 0; d < dusmanlar.length; d++) {
      var e = dusmanlar[d];
      c.save(); c.translate(e.x, e.y);
      if (e.tur === "dalici" && e.durum === "dal") c.rotate(Math.atan2(e.vy, e.vx) - Math.PI / 2);
      if (e.tur === "dalgaci") c.rotate(Math.cos(e.t * 1.7 + e.faz) * 0.18);
      if (e.tur === "akinci" || e.tur === "taret") {
        c.globalCompositeOperation = "lighter";
        c.globalAlpha = 0.55 + 0.3 * Math.sin(zm * 20 + e.faz);
        resim(G.isik.mercan, 0, (e.tur === "taret" ? -24 : -14) * S, e.tur === "taret" ? 1.1 : 0.8);
        c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
      }
      resim(G[e.tur], 0, 0);
      if (e.vurulma > 0) { c.globalAlpha = 0.75; resim(G.beyaz[e.tur], 0, 0); c.globalAlpha = 1; }
      if (e.tur === "taret" && e.can < e.maxCan) {
        c.fillStyle = "rgba(255,255,255,.15)"; c.fillRect(-18 * S, -34 * S, 36 * S, 3 * S);
        c.fillStyle = "#ffb547"; c.fillRect(-18 * S, -34 * S, 36 * S * e.can / e.maxCan, 3 * S);
      }
      c.restore();
    }

    // Komuta gemisi
    if (boss) {
      var b = boss, nabiz = 0.6 + 0.4 * Math.sin(zm * (4 + b.evre * 2));
      c.save(); c.translate(b.x, b.y);
      c.globalCompositeOperation = "lighter";
      c.globalAlpha = 0.5;
      resim(G.isik.mercan, 0, 8 * S, 5.5 + nabiz * 1.5);
      c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
      resim(G.boss, 0, 0);
      c.globalCompositeOperation = "lighter";
      resim(G.isik[b.evre === 3 ? "pembe" : "mercan"], 0, 8 * S, 2.6 + nabiz * 0.8);
      resim(G.isik.beyaz, 0, 8 * S, 1 + nabiz * 0.4);
      [-86, 86].forEach(function (px) { resim(G.isik.amber, px * S, 18 * S, 0.9 + 0.3 * Math.sin(zm * 8 + px)); });
      c.globalCompositeOperation = "source-over";
      if (b.vurulma > 0) { c.globalAlpha = 0.16; resim(G.beyaz.boss, 0, 0); c.globalAlpha = 1; }
      c.restore();
    }

    // Oyuncu mermileri
    c.globalCompositeOperation = "lighter";
    for (var m = 0; m < mermiler.length; m++) {
      var mr = mermiler[m];
      if (mr.a) { c.save(); c.translate(mr.x, mr.y); c.rotate(mr.a); resim(G.oyuncuMermi, 0, 0); c.restore(); }
      else resim(G.oyuncuMermi, mr.x, mr.y);
    }
    c.globalCompositeOperation = "source-over";

    // Oyuncu
    if (oyuncu && !oyuncu.olu) {
      var gorun = oyuncu.dokunulmaz > 0 && durum === "oyun" ? (Math.floor(zm * 16) % 2 ? 0.35 : 1) : 1;
      gemiCiz(oyuncu.x, oyuncu.y, oyuncu.egim, gorun);
      if (oyuncu.kalkan > 0) {
        var kz = oyuncu.kalkan < 2 ? (Math.floor(zm * 10) % 2 ? 0.4 : 1) : 1;
        c.globalCompositeOperation = "lighter";
        c.globalAlpha = 0.35 * kz; resim(G.isik.nane, oyuncu.x, oyuncu.y, 3.4);
        c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
        c.strokeStyle = "rgba(108,240,194," + (0.75 * kz) + ")"; c.lineWidth = 2 * S;
        c.beginPath(); c.arc(oyuncu.x, oyuncu.y, 44 * S + Math.sin(zm * 6) * 2 * S, 0, Math.PI * 2); c.stroke();
      }
    } else if (!oyuncu && durum === "giris") {
      var gy = girisGemiY();
      if (gy) gemiCiz(W / 2, gy + Math.sin(zm * 1.6) * 6 * S, Math.sin(zm * 0.8) * 0.3, 1);
    }

    // Düşman mermileri (en üstte, görünür kalsın)
    c.globalCompositeOperation = "lighter";
    for (var q = 0; q < dmermiler.length; q++) { var dm = dmermiler[q]; resim(G.mermi[dm.renk], dm.x, dm.y); }

    // Parçacıklar
    for (var k = 0; k < parcalar.length; k++) {
      var pc = parcalar[k], o = 1 - pc.t / pc.omur;
      if (pc.tur === "kivilcim") {
        c.globalCompositeOperation = "lighter";
        c.strokeStyle = pc.renk; c.globalAlpha = o; c.lineWidth = pc.boy;
        c.beginPath(); c.moveTo(pc.x, pc.y); c.lineTo(pc.x - pc.vx * 0.035, pc.y - pc.vy * 0.035); c.stroke();
      } else if (pc.tur === "isik") {
        c.globalCompositeOperation = "lighter";
        c.globalAlpha = o; var r = pc.boy * (0.6 + 0.4 * o);
        c.drawImage(G.isik[pc.renk].c, pc.x - r, pc.y - r, r * 2, r * 2);
      } else {
        c.globalCompositeOperation = "source-over";
        c.globalAlpha = o * 0.8; var rd = pc.boy * (1 + pc.t / pc.omur * 1.4);
        c.drawImage(G.duman.c, pc.x - rd, pc.y - rd, rd * 2, rd * 2);
      }
    }
    // Şok halkaları
    c.globalCompositeOperation = "lighter";
    for (var h = 0; h < halkalar.length; h++) {
      var hl = halkalar[h], ilerle = hl.t / hl.omur;
      c.globalAlpha = (1 - ilerle) * 0.8;
      c.strokeStyle = { amber: "#ffb547", mercan: "#ff7a5c", mor: "#b9a2ff", pembe: "#ff8fc4", nane: "#6cf0c2" }[hl.renk] || "#ffb547";
      c.lineWidth = Math.max(1, 5 * S * (1 - ilerle));
      c.beginPath(); c.arc(hl.x, hl.y, hl.r * (0.2 + 0.8 * Math.sqrt(ilerle)), 0, Math.PI * 2); c.stroke();
    }
    c.globalAlpha = 1; c.globalCompositeOperation = "source-over";

    // Yazılar
    c.textAlign = "center"; c.textBaseline = "middle";
    for (var t = 0; t < yazilar.length; t++) {
      var yz = yazilar[t];
      c.globalAlpha = Math.min(1, (1 - yz.t / yz.omur) * 2);
      c.fillStyle = yz.renk;
      c.font = "600 " + Math.round((yz.metin.length > 6 ? 19 : 14) * Math.max(0.85, S)) + "px 'Chakra Petch', sans-serif";
      c.fillText(yz.metin, yz.x, yz.y);
    }
    c.globalAlpha = 1;
    c.restore();

    // Ekran efektleri
    if (flas > 0) { c.fillStyle = "rgba(255,236,210," + (flas * 0.35) + ")"; c.fillRect(0, 0, W, H); }
    if (hasarFlas > 0) {
      var v = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
      v.addColorStop(0, "rgba(255,40,30,0)"); v.addColorStop(1, "rgba(255,40,30," + (hasarFlas * 0.5) + ")");
      c.fillStyle = v; c.fillRect(0, 0, W, H);
    }
  }

  /* ── Döngü ── */
  var onceki = performance.now();
  function dongu(simdi) {
    var dt = Math.min(0.05, Math.max(0, (simdi - onceki) / 1000));
    onceki = simdi;
    if (yavasSure > 0) { yavasSure -= dt; if (yavasSure <= 0) zamanOlcek = 1; }
    if (durum !== "durdu") guncelle(dt * zamanOlcek);
    ciz();
    requestAnimationFrame(dongu);
  }

  /* ── Kontroller ── */
  var OYUN_TUSLARI = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "KeyW", "KeyA", "KeyS", "KeyD"];
  addEventListener("keydown", function (e) {
    var k = e.code;
    if (OYUN_TUSLARI.indexOf(k) >= 0 && durum === "oyun") { e.preventDefault(); tuslar[k] = true; }
    if (k === "Enter" && !e.repeat) {
      if (durum === "giris" || durum === "bitti") { e.preventDefault(); basla(); }
      else if (durum === "durdu") { e.preventDefault(); devam(); }
    }
    if ((k === "KeyP" || k === "Escape") && !e.repeat) { if (durum === "oyun") duraklat(); else if (durum === "durdu") devam(); }
  });
  addEventListener("keyup", function (e) { tuslar[e.code] = false; });
  addEventListener("blur", function () { tuslar = {}; if (durum === "oyun") duraklat(); });
  document.addEventListener("visibilitychange", function () { if (document.hidden && durum === "oyun") duraklat(); });

  function isaretKonum(e) {
    var dx = (e.clientX - isaretci.sx) * 1.2, dy = (e.clientY - isaretci.sy) * 1.2;
    isaretci.hx = sinir(isaretci.ox + dx, 24 * S, W - 24 * S);
    isaretci.hy = sinir(isaretci.oy + dy, H * 0.25, altSinir());
  }
  tuval.addEventListener("pointerdown", function (e) {
    if (durum !== "oyun" || !oyuncu) return;
    if (e.pointerType === "touch") otoAtes = true;
    isaretci = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: oyuncu.x, oy: oyuncu.y };
    isaretKonum(e);
    try { tuval.setPointerCapture(e.pointerId); } catch (x) { /* yok */ }
  });
  tuval.addEventListener("pointermove", function (e) { if (isaretci && e.pointerId === isaretci.id) isaretKonum(e); });
  function birak(e) { if (isaretci && e.pointerId === isaretci.id) isaretci = null; }
  tuval.addEventListener("pointerup", birak);
  tuval.addEventListener("pointercancel", birak);

  $("basla").addEventListener("click", basla);
  $("tekrar").addEventListener("click", basla);
  $("devam").addEventListener("click", devam);
  $("bastan").addEventListener("click", basla);
  $("duraklat").addEventListener("click", function () { if (durum === "oyun") duraklat(); else if (durum === "durdu") devam(); });
  addEventListener("resize", boyutla);

  function girisGemiY() {
    var r = document.querySelector("#giris .ekran-ic").getBoundingClientRect();
    var y = Math.max(r.bottom + 70 * S, H - 110 * S);
    return y < H - 40 * S ? y : 0;
  }
  function metinGuncelle() {
    var n = bossAraligi();
    var adlar = { 2: "iki", 3: "üç", 4: "dört", 5: "beş", 6: "altı" };
    document.querySelector(".giris-metin").textContent = "Dalga dalga gelen akıncıları püskürt, güçlendiricileri topla ve her " + (adlar[n] || n) + " dalgada bir gelen komuta gemisini düşür.";
  }

  /* ── Başlat ── */
  boyutla();
  enIyiYaz();
  metinGuncelle();
  requestAnimationFrame(function (t) { onceki = t; dongu(t); });

  fetch("ayarlar.json", { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error("ayarlar okunamadı"); return r.json(); })
    .then(function (j) {
      Object.keys(j).forEach(function (k) { if (j[k] && typeof j[k].deger === "number" && k in A) A[k] = j[k].deger; });
      canBarKur();
      metinGuncelle();
    })
    .catch(function () { /* varsayılanlarla devam */ });
})();
`,
    "ayarlar.json": `{
  "gemiHizi": { "etiket": "Gemi hızı", "deger": 6, "min": 3, "max": 12, "adim": 0.5 },
  "atesHizi": { "etiket": "Ateş hızı (atış/sn)", "deger": 7, "min": 3, "max": 15, "adim": 1 },
  "dusmanSikligi": { "etiket": "Düşman sıklığı", "deger": 1, "min": 0.4, "max": 2.5, "adim": 0.1 },
  "dusmanHizi": { "etiket": "Düşman hızı", "deger": 1, "min": 0.5, "max": 2, "adim": 0.1 },
  "can": { "etiket": "Can", "deger": 5, "min": 1, "max": 10, "adim": 1 },
  "bossAraligi": { "etiket": "Komuta gemisi kaç dalgada bir", "deger": 3, "min": 2, "max": 6, "adim": 1 }
}
`,
  },
};
