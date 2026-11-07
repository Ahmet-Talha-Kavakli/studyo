/* Şablon: Neon Yılan — neon ızgarada canvas yılan oyunu: kombo puanı, altın yem, hızlanma, duvardan geçiş, kaydırma ve ekran yön düğmeleri. Ayarlar ayarlar.json'dan (Vayra Build ayar paneli kaydırıcıları). */

export const NEON_YILAN = {
  id: "neon-yilan",
  ad: "Neon Yılan",
  tur: "oyun" as const,
  aciklama: "Neon ızgarada yılan; kombo puanı, altın yem ve duvardan geçiş seçeneği",
  kapak: "/gercek/build/sablon/neon-yilan.webp",
  dosyalar: {
    "index.html": `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
  <meta name="theme-color" content="#030807" />
  <meta name="description" content="Neon ışıklı ızgarada klasik yılan oyunu: yemleri topla, uzadıkça hızlan, kombo puanlarını katla." />
  <title>Neon Yılan</title>
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Unbounded:wght@600;700;800&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <div class="arka" aria-hidden="true"></div>

  <main class="sahne">
    <header class="ust">
      <div class="marka">
        <svg class="logo" viewBox="0 0 36 36" aria-hidden="true">
          <defs>
            <linearGradient id="logoRenk" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#d9ff5c" />
              <stop offset="1" stop-color="#2af5d0" />
            </linearGradient>
          </defs>
          <rect x="1" y="1" width="34" height="34" rx="10" fill="#0a1714" stroke="rgba(198,255,61,.35)" />
          <path d="M9 11h12a4 4 0 0 1 0 8h-6a4 4 0 0 0 0 8h12" fill="none" stroke="url(#logoRenk)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="27" cy="11" r="2.4" fill="#ffb43b" />
        </svg>
        <span>Neon Yılan</span>
      </div>
      <dl class="sayac">
        <div class="puan"><dt>Skor</dt><dd id="skor">0</dd></div>
        <div><dt>En iyi</dt><dd id="enIyi">0</dd></div>
        <div><dt>Uzunluk</dt><dd id="uzunluk">4</dd></div>
        <div><dt>Hız</dt><dd id="hiz">7</dd></div>
      </dl>
      <div class="dugmeler">
        <button class="ikon" id="sesDugme" type="button" aria-label="Sesi kapat" aria-pressed="true">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path class="ses-acik" d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Zm11.5-.8a4.5 4.5 0 0 1 0 6.6M17.8 6.3a8 8 0 0 1 0 11.4" /><path class="ses-kapali" d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Zm11.5 0 5 5m0-5-5 5" /></svg>
        </button>
        <button class="ikon" id="durdurDugme" type="button" aria-label="Duraklat">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 6v12M15.5 6v12" /></svg>
        </button>
      </div>
    </header>

    <section class="tahta" id="tahta">
      <canvas id="tuval" role="img" aria-label="Yılan oyunu alanı"></canvas>
      <div class="kombo" id="kombo" aria-live="polite"><span id="komboYazi">2'li kombo</span><i><b id="komboCubuk"></b></i></div>

      <div class="perde gorunur" id="perde" data-mod="giris">
        <div class="kart">
          <p class="etiket" id="perdeUst"><i></i><span>Klasik oyun, neon ışıklarla</span></p>
          <h1 id="perdeBaslik">Neon <em>Yılan</em></h1>
          <p class="aciklama" id="perdeMetin">Yemleri topla, uzadıkça hızlan. Arka arkaya hızlı yersen kombo puanın katlanır.</p>
          <div class="sonuc" id="sonuc" hidden>
            <div><span>Skor</span><b id="sonSkor">0</b></div>
            <div><span>En iyi</span><b id="sonEnIyi">0</b></div>
            <div><span>Uzunluk</span><b id="sonUzunluk">0</b></div>
          </div>
          <label class="anahtar" id="anahtar">
            <input type="checkbox" id="duvarSecim" />
            <span class="ray" aria-hidden="true"></span>
            <span class="yazi"><b>Duvardan geçiş</b><small id="duvarAciklama">Kenara çarpınca oyun biter</small></span>
          </label>
          <div class="eylemler">
            <button class="basla" id="basla" type="button">Oyuna başla</button>
            <button class="ikincil" id="bastan" type="button" hidden>Baştan başla</button>
          </div>
          <p class="ipucu"><span class="masaustu"><kbd>Ok tuşları</kbd> ya da <kbd>WASD</kbd> ile yön ver, <kbd>Boşluk</kbd> ile duraklat.</span><span class="dokunmatik">Ekranda kaydır ya da alttaki yön düğmelerini kullan.</span></p>
        </div>
      </div>
    </section>

    <footer class="alt">
      <span class="durum"><i id="modNokta"></i><span id="modYazi">Duvarlar kapalı</span></span>
      <span class="durum altin"><i></i>Her 5 yemde bir altın yem, 5 kat puan</span>
    </footer>

    <nav class="yon" aria-label="Yön düğmeleri">
      <button type="button" data-yon="yukari" aria-label="Yukarı"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6" /></svg></button>
      <button type="button" data-yon="sol" aria-label="Sola"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg></button>
      <button type="button" data-yon="asagi" aria-label="Aşağı"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></button>
      <button type="button" data-yon="sag" aria-label="Sağa"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg></button>
    </nav>
  </main>

  <script src="oyun.js"></script>
</body>
</html>
`,
    "stil.css": `:root {
  --zemin: #030807;
  --metin: #ecfff4;
  --metin-2: #a8c8b8;
  --metin-3: #7f9e90;
  --limon: #c6ff3d;
  --su: #2af5d0;
  --kehribar: #ffb43b;
  --cizgi: rgba(198, 255, 61, 0.16);
  --tahta: 600px;
  --baslik: "Unbounded", "Manrope", system-ui, sans-serif;
}
* { box-sizing: border-box; }
html, body {
  margin: 0; height: 100%; overflow: hidden; background: var(--zemin); color: var(--metin);
  font-family: "Manrope", system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased; -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none;
}
button { font: inherit; color: inherit; }

/* Arka plan: yumuşak neon ışıklar ve sönen ızgara */
.arka { position: fixed; inset: 0; pointer-events: none;
  background:
    radial-gradient(55% 45% at 50% -5%, rgba(150, 255, 90, 0.13), transparent 70%),
    radial-gradient(45% 50% at 105% 100%, rgba(42, 245, 208, 0.12), transparent 70%),
    radial-gradient(40% 40% at -5% 95%, rgba(255, 180, 59, 0.07), transparent 70%);
}
.arka::after { content: ""; position: absolute; inset: 0;
  background-image: linear-gradient(rgba(200, 255, 210, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(200, 255, 210, 0.04) 1px, transparent 1px);
  background-size: 44px 44px; background-position: center;
  -webkit-mask-image: radial-gradient(65% 60% at 50% 45%, #000 15%, transparent 85%); mask-image: radial-gradient(65% 60% at 50% 45%, #000 15%, transparent 85%);
}

.sahne {
  position: relative; height: 100vh; height: 100svh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  touch-action: none;
}

/* Üst bilgi çubuğu */
.ust { width: var(--tahta); display: flex; align-items: center; gap: 14px; }
.marka { display: flex; align-items: center; gap: 10px; font-family: var(--baslik); font-weight: 700; font-size: 17px; letter-spacing: -0.02em; white-space: nowrap; }
.logo { width: 34px; height: 34px; flex: none; }
.sayac { margin: 0 0 0 auto; display: flex; align-items: stretch; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08); background: rgba(255, 255, 255, 0.025); }
.sayac div { padding: 7px 16px 8px; min-width: 76px; }
.sayac div + div { border-left: 1px solid rgba(255, 255, 255, 0.07); }
.sayac dt { font-size: 11.5px; font-weight: 600; color: var(--metin-3); }
.sayac dd { margin: 2px 0 0; font-family: var(--baslik); font-weight: 700; font-size: 18px; line-height: 1.1; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
.sayac .puan dd { color: var(--limon); }
.sayac .pop dd { animation: pop 0.32s cubic-bezier(.3, 1.6, .5, 1); }
@keyframes pop { 0% { transform: scale(1); } 40% { transform: scale(1.22); } 100% { transform: scale(1); } }
.sayac dd { transform-origin: left center; display: inline-block; }
.dugmeler { display: flex; gap: 8px; }
.ikon { width: 42px; height: 42px; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.09); background: rgba(255, 255, 255, 0.03); display: grid; place-items: center; cursor: pointer; color: var(--metin-2); transition: background .2s, color .2s, transform .15s, border-color .2s; }
.ikon:hover { background: rgba(198, 255, 61, 0.08); color: var(--limon); border-color: rgba(198, 255, 61, 0.3); }
.ikon:active { transform: scale(0.94); }
.ikon:focus-visible, .basla:focus-visible, .ikincil:focus-visible, .yon button:focus-visible { outline: 2px solid var(--limon); outline-offset: 2px; }
.ikon svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ikon .ses-kapali { display: none; }
.ikon[aria-pressed="false"] .ses-acik { display: none; }
.ikon[aria-pressed="false"] .ses-kapali { display: inline; }

/* Oyun tahtası */
.tahta { position: relative; width: var(--tahta); height: var(--tahta-y, var(--tahta)); border-radius: 22px; overflow: hidden; background: #040b0a;
  outline: 1px solid rgba(198, 255, 61, 0.14); box-shadow: 0 0 90px -24px rgba(150, 255, 80, 0.45); transition: box-shadow .3s; }
.tahta.sarsil { animation: sarsil .35s; }
#tuval { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.tahta::after { content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 1;
  background: radial-gradient(120% 120% at 50% 45%, transparent 55%, rgba(0, 0, 0, 0.45) 100%), repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.018) 0 1px, transparent 1px 3px); }

/* Kombo göstergesi */
.kombo { position: absolute; z-index: 2; top: 14px; left: 50%; transform: translate(-50%, -8px) scale(.94); opacity: 0; pointer-events: none;
  display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px 16px 9px; border-radius: 999px;
  background: rgba(20, 16, 6, 0.72); border: 1px solid rgba(255, 180, 59, 0.45); color: #ffd58a; font-family: var(--baslik); font-weight: 700; font-size: 13px; letter-spacing: -0.01em;
  transition: opacity .2s, transform .25s cubic-bezier(.3, 1.4, .5, 1); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
.kombo.gorunur { opacity: 1; transform: translate(-50%, 0) scale(1); }
.kombo.gorunur.soluk { opacity: 0.22; }
.kombo i { display: block; width: 84px; height: 3px; border-radius: 3px; background: rgba(255, 180, 59, 0.2); overflow: hidden; }
.kombo b { display: block; height: 100%; width: 100%; border-radius: 3px; background: linear-gradient(90deg, #ffb43b, #ffe27a); transform-origin: left; }

/* Başlangıç, mola ve oyun sonu perdesi */
.perde { position: absolute; inset: 0; z-index: 3; display: grid; place-items: center; padding: 20px; opacity: 0; pointer-events: none; transition: opacity .35s ease;
  background: radial-gradient(60% 55% at 50% 48%, rgba(3, 10, 9, 0.72), rgba(3, 8, 7, 0.4)); backdrop-filter: blur(2.5px) saturate(1.2); -webkit-backdrop-filter: blur(2.5px) saturate(1.2); }
.perde.gorunur { opacity: 1; pointer-events: auto; }
.kart { width: min(420px, 100%); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; transform: translateY(10px); transition: transform .45s cubic-bezier(.2, .9, .3, 1); }
.perde.gorunur .kart { transform: none; }
.etiket { margin: 0; display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(198, 255, 61, 0.22); background: rgba(198, 255, 61, 0.06); font-size: 12.5px; font-weight: 700; color: #dfffb0; }
.etiket i { width: 7px; height: 7px; border-radius: 50%; background: var(--limon); box-shadow: 0 0 10px var(--limon); }
.perde[data-mod="bitti"].rekor .etiket { border-color: rgba(255, 180, 59, 0.4); background: rgba(255, 180, 59, 0.1); color: #ffd58a; }
.perde[data-mod="bitti"].rekor .etiket i { background: var(--kehribar); box-shadow: 0 0 10px var(--kehribar); }
.kart h1 { margin: 2px 0 0; font-family: var(--baslik); font-weight: 800; font-size: clamp(34px, 7.4vw, 56px); line-height: 1; letter-spacing: -0.035em; }
.kart h1 em { font-style: normal; background: linear-gradient(100deg, #e2ff6b 10%, #2af5d0 90%); -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 0 18px rgba(170, 255, 90, 0.35)); }
.aciklama { margin: 0; max-width: 34ch; font-size: 15px; line-height: 1.55; color: var(--metin-2); }
.sonuc { display: grid; grid-template-columns: repeat(3, 1fr); width: 100%; border-radius: 18px; border: 1px solid rgba(255, 255, 255, 0.08); background: rgba(255, 255, 255, 0.03); }
.sonuc[hidden] { display: none; }
.sonuc div { padding: 12px 8px; display: flex; flex-direction: column; gap: 4px; }
.sonuc div + div { border-left: 1px solid rgba(255, 255, 255, 0.07); }
.sonuc span { font-size: 12px; font-weight: 600; color: var(--metin-3); }
.sonuc b { font-family: var(--baslik); font-size: 24px; font-weight: 700; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.sonuc div:first-child b { color: var(--limon); }

.anahtar { display: flex; align-items: center; gap: 12px; padding: 10px 14px 10px 10px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08); background: rgba(255, 255, 255, 0.03); cursor: pointer; text-align: left; transition: border-color .2s, background .2s; }
.anahtar:hover { border-color: rgba(42, 245, 208, 0.35); }
.anahtar[hidden] { display: none; }
.anahtar input { position: absolute; opacity: 0; pointer-events: none; }
.ray { position: relative; width: 44px; height: 26px; flex: none; border-radius: 999px; background: rgba(255, 255, 255, 0.1); transition: background .25s; }
.ray::after { content: ""; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #dfeee7; transition: transform .28s cubic-bezier(.3, 1.4, .5, 1), background .25s; }
.anahtar input:checked + .ray { background: linear-gradient(90deg, #22d7b8, #2af5d0); }
.anahtar input:checked + .ray::after { transform: translateX(18px); background: #04140f; }
.anahtar input:focus-visible + .ray { outline: 2px solid var(--su); outline-offset: 2px; }
.anahtar .yazi { display: flex; flex-direction: column; gap: 1px; }
.anahtar b { font-size: 14px; font-weight: 700; }
.anahtar small { font-size: 12.5px; color: var(--metin-3); }

.eylemler { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 4px; }
.basla { height: 52px; padding: 0 32px; border: 0; border-radius: 999px; cursor: pointer; font-weight: 800; font-size: 16px; color: #03140e;
  background: linear-gradient(100deg, #d9ff5c, #2af5d0); box-shadow: 0 0 36px -6px rgba(170, 255, 80, 0.55); transition: transform .15s, filter .2s, box-shadow .2s; }
.basla:hover { filter: brightness(1.07); transform: translateY(-1px); box-shadow: 0 0 46px -4px rgba(170, 255, 80, 0.7); }
.basla:active { transform: scale(0.97); }
.ikincil { height: 52px; padding: 0 24px; border-radius: 999px; cursor: pointer; font-weight: 700; font-size: 15px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.14); transition: background .2s, transform .15s; }
.ikincil:hover { background: rgba(255, 255, 255, 0.08); }
.ikincil:active { transform: scale(0.97); }
.ikincil[hidden] { display: none; }
.ipucu { margin: 2px 0 0; font-size: 13px; line-height: 1.9; color: var(--metin-3); max-width: 46ch; }
kbd { display: inline-block; padding: 1px 7px; border-radius: 7px; border: 1px solid rgba(255, 255, 255, 0.16); background: rgba(255, 255, 255, 0.05); font: 700 12px/1.5 "Manrope", system-ui, sans-serif; color: var(--metin); }
.dokunmatik { display: none; }

/* Alt bilgi */
.alt { width: var(--tahta); display: flex; justify-content: space-between; gap: 12px; font-size: 13px; color: var(--metin-3); }
.durum { display: inline-flex; align-items: center; gap: 8px; }
.durum i { width: 8px; height: 8px; border-radius: 50%; background: var(--limon); box-shadow: 0 0 10px var(--limon); }
.durum i.gecis { background: var(--su); box-shadow: 0 0 10px var(--su); }
.durum.altin i { background: #ffe27a; box-shadow: 0 0 10px #ffc93b; transform: rotate(45deg); border-radius: 2px; }

/* Telefon yön düğmeleri */
.yon { display: none; }
.yon button { border-radius: 20px; border: 1px solid rgba(198, 255, 61, 0.2); background: rgba(198, 255, 61, 0.04); color: var(--limon); display: grid; place-items: center; cursor: pointer; transition: background .15s, transform .12s, border-color .15s; touch-action: none; }
.yon button svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.yon button.basili { background: rgba(198, 255, 61, 0.16); border-color: rgba(198, 255, 61, 0.55); transform: scale(0.95); }
.yon [data-yon="yukari"] { grid-column: 2; grid-row: 1; }
.yon [data-yon="sol"] { grid-column: 1; grid-row: 2; }
.yon [data-yon="asagi"] { grid-column: 2; grid-row: 2; }
.yon [data-yon="sag"] { grid-column: 3; grid-row: 2; }

@keyframes sarsil { 0%, 100% { transform: none; } 20% { transform: translate(-6px, 3px); } 40% { transform: translate(5px, -4px); } 60% { transform: translate(-4px, 2px); } 80% { transform: translate(3px, -1px); } }

@media (pointer: coarse), (max-width: 700px) {
  .yon { display: grid; grid-template-columns: repeat(3, 84px); grid-template-rows: repeat(2, 60px); gap: 8px; }
  .masaustu { display: none; }
  .dokunmatik { display: inline; }
  .alt .altin { display: none; }
}
/* Dar tahta (telefon ya da küçük pencere): sayaçlar ikinci satıra iner */
.dar { gap: 12px; }
.dar .ust { flex-wrap: wrap; row-gap: 12px; }
.dar .marka { font-size: 16px; }
.dar .dugmeler { margin-left: auto; }
.dar .ikon { width: 44px; height: 44px; }
.dar .sayac { order: 3; width: 100%; margin: 0; }
.dar .sayac div { flex: 1; min-width: 0; padding: 7px 12px 8px; }
.dar .sayac dd { font-size: 17px; }
.dar .kart { gap: 12px; }
.dar .aciklama { font-size: 14px; }
.dar .basla, .dar .ikincil { height: 48px; }
.dar .anahtar small { font-size: 12px; }
.dar .ipucu { line-height: 1.6; }
.dar .alt .altin { display: none; }
.kucuk .etiket { display: none; }
.kucuk .kart { gap: 10px; }
.kucuk .kart h1 { font-size: 34px; }
.kucuk .aciklama { font-size: 13.5px; }
.kucuk .ipucu { font-size: 12.5px; line-height: 1.6; }
.kucuk .anahtar { padding: 8px 12px 8px 8px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
`,
    "ayarlar.json": `{
  "baslangicHizi": { "etiket": "Başlangıç hızı (adım/sn)", "deger": 7, "min": 3, "max": 16, "adim": 0.5 },
  "hizlanma": { "etiket": "Yem başına hızlanma", "deger": 0.35, "min": 0, "max": 1.5, "adim": 0.05 },
  "izgara": { "etiket": "Izgara boyutu (hücre)", "deger": 20, "min": 12, "max": 32, "adim": 1 },
  "yemPuani": { "etiket": "Yem başına puan", "deger": 10, "min": 5, "max": 50, "adim": 5 },
  "duvardanGec": { "etiket": "Duvardan geç (0 kapalı, 1 açık)", "deger": 0, "min": 0, "max": 1, "adim": 1 }
}
`,
    "oyun.js": `// Neon Yılan — oynanış sayıları ayarlar.json'dan gelir (Vayra Build ayar paneli bu dosyayı düzenler).
var A = { baslangicHizi: 7, hizlanma: 0.35, izgara: 20, yemPuani: 10, duvardanGec: 0 };

var $ = function (id) { return document.getElementById(id); };
var tuval = $("tuval"), c = tuval.getContext("2d");
var sahne = document.querySelector(".sahne"), tahta = $("tahta"), ustCubuk = document.querySelector(".ust"), altCubuk = document.querySelector(".alt"), yonPaneli = document.querySelector(".yon");
var perde = $("perde"), duvarSecim = $("duvarSecim");
var izgaraTuval = document.createElement("canvas"), ic = izgaraTuval.getContext("2d");

var KAYIT = "neon-yilan-en-iyi", SES_KAYIT = "neon-yilan-ses";
var enIyi = Number(localStorage.getItem(KAYIT) || 0);
var N = 20, NX = 20, NY = 20, hucre = 30, gen = 600, yuk = 600, dpr = 1, izgaraKurulu = false;
var durum = "demo"; // demo · oyun · durdu · oluyor · bitti
var duvardanGec = false;
var yilan = [], onceki = [], yon = { x: 1, y: 0 }, kuyruk = [], buyume = 0;
var yem = null, bonus = null, yemSayisi = 0, skor = 0, kombo = 0, komboBitis = 0, komboSure = 3000, oncekiEnIyi = 0;
var adimSure = 140, birikim = 0, zaman = 0, oz = 0, sonZaman = 0;
var parcaciklar = [], yazilar = [], dalgalar = [], sarsinti = 0, flas = 0, olumSira = 0, olumSayac = 0;
var YONLER = { yukari: { x: 0, y: -1 }, asagi: { x: 0, y: 1 }, sol: { x: -1, y: 0 }, sag: { x: 1, y: 0 } };
var EK = ["", "'li", "'li", "'lü", "'lü", "'li", "'lı", "'li", "'li", "'lu", "'lu"];

function sinirla(v, a, b) { return Math.max(a, Math.min(b, v)); }
function sayi(n) { return Math.round(n).toLocaleString("tr-TR"); }
function kopya(s) { return { x: s.x, y: s.y }; }

/* ── Ayarlar ── */
fetch("ayarlar.json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
  Object.keys(j).forEach(function (k) { if (j[k] && typeof j[k].deger === "number") A[k] = j[k].deger; });
}).catch(function () {}).then(ayarlariUygula);

function ayarlariUygula() {
  A.baslangicHizi = sinirla(A.baslangicHizi, 2, 30);
  duvardanGec = A.duvardanGec >= 0.5;
  duvarSecim.checked = duvardanGec;
  modYaz(); hizYaz(A.baslangicHizi);
  if (durum === "demo" || durum === "bitti") { izgaraKur(); demoBasla(); }
}
function izgaraKur() {
  var yeni = Math.round(sinirla(A.izgara, 10, 40));
  if (yeni !== N || !izgaraKurulu) { N = yeni; izgaraKurulu = true; yerlesim(); }
}

/* ── Yerleşim: tahta her ekranda tam kare ve hücreler tam piksel ── */
function yerlesim() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  var st = getComputedStyle(sahne);
  var w = innerWidth - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight);
  var sabit = durum === "oyun" || durum === "durdu" || durum === "oluyor";
  var eskiX = NX, eskiY = NY;
  sahne.style.setProperty("--tahta", Math.min(w, 820) + "px");
  sahne.classList.toggle("dar", Math.min(w, 820) < 600);
  for (var tur = 0; tur < 2; tur++) {
    var bosluk = parseFloat(getComputedStyle(sahne).rowGap) || 14, dolu = 0, adet = 0;
    [ustCubuk, altCubuk, yonPaneli].forEach(function (el) { if (getComputedStyle(el).display !== "none") { dolu += el.offsetHeight; adet++; } });
    var h = innerHeight - parseFloat(st.paddingTop) - parseFloat(st.paddingBottom) - dolu - bosluk * adet;
    if (sabit) hucre = Math.max(6, Math.floor(Math.min(w / NX, h / NY, 820 / NX)));
    else {
      hucre = Math.max(6, Math.floor(Math.max(180, Math.min(w, h, 820)) / N));
      NX = N; NY = N;
      // Dikey ekranda (telefon) tahta aşağı doğru uzar; boş alan kalmaz.
      var sigan = Math.floor(h / hucre);
      if (h > w * 1.08 && sigan > N) NY = Math.min(sigan, Math.round(N * 1.6));
    }
    gen = hucre * NX; yuk = hucre * NY;
    sahne.style.setProperty("--tahta", gen + "px");
    sahne.style.setProperty("--tahta-y", yuk + "px");
    sahne.classList.toggle("dar", gen < 600);
    sahne.classList.toggle("kucuk", yuk < 470);
  }
  tuval.width = Math.round(gen * dpr); tuval.height = Math.round(yuk * dpr);
  izgaraHazirla();
  if (!sabit && (eskiX !== NX || eskiY !== NY) && yilan.length) demoBasla();
}
addEventListener("resize", yerlesim);

function izgaraHazirla() {
  izgaraTuval.width = Math.round(gen * dpr); izgaraTuval.height = Math.round(yuk * dpr);
  ic.setTransform(dpr, 0, 0, dpr, 0, 0);
  var g = ic.createRadialGradient(gen / 2, yuk * 0.42, 0, gen / 2, yuk / 2, Math.max(gen, yuk) * 0.78);
  g.addColorStop(0, "#0b1c18"); g.addColorStop(1, "#030807");
  ic.fillStyle = g; ic.fillRect(0, 0, gen, yuk);
  ic.fillStyle = "rgba(190,255,210,0.014)";
  for (var y = 0; y < NY; y++) for (var x = 0; x < NX; x++) if ((x + y) % 2 === 0) ic.fillRect(x * hucre, y * hucre, hucre, hucre);
  ic.strokeStyle = "rgba(190,255,210,0.04)"; ic.lineWidth = 1; ic.beginPath();
  for (var i = 1; i < NX; i++) { ic.moveTo(i * hucre + 0.5, 0); ic.lineTo(i * hucre + 0.5, yuk); }
  for (var j = 1; j < NY; j++) { ic.moveTo(0, j * hucre + 0.5); ic.lineTo(gen, j * hucre + 0.5); }
  ic.stroke();
  ic.fillStyle = "rgba(205,255,215,0.22)";
  var nk = Math.max(1.5, hucre * 0.07);
  for (var a = 1; a < NX; a++) for (var b = 1; b < NY; b++) ic.fillRect(a * hucre - nk / 2 + 0.5, b * hucre - nk / 2 + 0.5, nk, nk);
}

/* ── Oyun durumu ── */
function yilanKur() {
  var bx = Math.floor(NX / 2), by = Math.floor(NY / 2);
  yilan = [];
  for (var i = 0; i < 4; i++) yilan.push({ x: bx - i, y: by });
  onceki = yilan.map(kopya); yon = { x: 1, y: 0 }; kuyruk = []; buyume = 0;
  yem = null; bonus = null; yemKoy();
}
function bosHucre() {
  var dolu = {};
  yilan.forEach(function (s) { dolu[s.x + "," + s.y] = 1; });
  if (yem) dolu[yem.x + "," + yem.y] = 1;
  if (bonus) dolu[bonus.x + "," + bonus.y] = 1;
  var bos = [];
  for (var y = 0; y < NY; y++) for (var x = 0; x < NX; x++) if (!dolu[x + "," + y]) bos.push({ x: x, y: y });
  return bos.length ? bos[Math.floor(Math.random() * bos.length)] : null;
}
function yemKoy() { var h = bosHucre(); yem = h ? { x: h.x, y: h.y, dogum: zaman } : null; }
function bonusKoy() { var h = bosHucre(); if (h) bonus = { x: h.x, y: h.y, dogum: zaman, bitis: oz + 7000 }; }

function hizHesapla() {
  var h = Math.min(A.baslangicHizi + A.hizlanma * yemSayisi, 30);
  adimSure = 1000 / h;
  komboSure = Math.max(2400, adimSure * (NX + NY) * 0.6);
  hizYaz(h);
}
function hizYaz(h) { $("hiz").textContent = h.toLocaleString("tr-TR", { maximumFractionDigits: 1 }); }

function demoBasla() {
  yemSayisi = 0; yilanKur(); adimSure = 105; birikim = 0;
}

function basla(ilkYon) {
  sesBaslat();
  izgaraKur();
  durum = "oyun"; skor = 0; yemSayisi = 0; kombo = 0; komboBitis = 0; oncekiEnIyi = enIyi;
  parcaciklar = []; yazilar = []; dalgalar = []; flas = 0;
  yilanKur(); hizHesapla(); birikim = -320;
  if (ilkYon && ilkYon.x !== -1 && ilkYon.x !== 1) kuyruk.push(ilkYon);
  hudGuncelle(false); perdeGizle();
  dalgalar.push({ x: (yilan[0].x + 0.5) * hucre, y: (yilan[0].y + 0.5) * hucre, t: zaman, guc: 1 });
}
function duraklat() {
  if (durum !== "oyun") return;
  durum = "durdu"; perdeGoster("durdu");
}
function devam() {
  if (durum !== "durdu") return;
  durum = "oyun"; perdeGizle();
}
function bitir() {
  durum = "bitti";
  if (skor > enIyi) { enIyi = skor; localStorage.setItem(KAYIT, String(enIyi)); }
  hudGuncelle(false);
  perdeGoster("bitti");
  demoBasla();
}

/* ── Adım: yılan bir hücre ilerler ── */
function adim() {
  var otomatik = durum !== "oyun";
  if (otomatik) demoSec();
  if (kuyruk.length) yon = kuyruk.shift();
  var bas = yilan[0], x = bas.x + yon.x, y = bas.y + yon.y;
  if (x < 0 || y < 0 || x >= NX || y >= NY) {
    if (!duvardanGec) return carp();
    x = (x + NX) % NX; y = (y + NY) % NY;
    parcacikSac((x + 0.5) * hucre, (y + 0.5) * hucre, "#2af5d0", 6, 0.6);
  }
  var yedi = yem && yem.x === x && yem.y === y;
  var bonusYedi = bonus && bonus.x === x && bonus.y === y;
  if (yedi) buyume += 1;
  if (bonusYedi) buyume += 3;
  var sinir = buyume > 0 ? yilan.length : yilan.length - 1;
  for (var i = 0; i < sinir; i++) if (yilan[i].x === x && yilan[i].y === y) return carp();
  onceki = yilan.map(kopya);
  yilan.unshift({ x: x, y: y });
  if (buyume > 0) buyume--; else yilan.pop();
  if (yedi) yemYe(x, y, false);
  if (bonusYedi) yemYe(x, y, true);
  if (otomatik && yilan.length > (NX + NY) * 0.8) demoBasla();
}

function yemYe(x, y, altin) {
  var cx = (x + 0.5) * hucre, cy = (y + 0.5) * hucre;
  if (altin) bonus = null; else { yemSayisi++; yemKoy(); }
  dalgalar.push({ x: cx, y: cy, t: zaman, guc: altin ? 1.5 : 1 });
  parcacikSac(cx, cy, altin ? "#ffe680" : "#ffb43b", altin ? 34 : 22, 1);
  parcacikSac(cx, cy, "#c6ff3d", 10, 0.7);
  if (!altin && yemSayisi % 5 === 0 && !bonus) bonusKoy();
  if (durum !== "oyun") return;
  kombo = oz < komboBitis ? Math.min(kombo + 1, 10) : 1;
  var puan = A.yemPuani * kombo * (altin ? 5 : 1);
  skor += puan;
  hizHesapla();
  komboBitis = oz + komboSure;
  yazilar.push({ x: cx, y: cy, metin: "+" + sayi(puan), t: zaman, renk: altin ? "#ffe680" : "#ffd27a", buyuk: altin || kombo >= 3 });
  if (altin) yazilar.push({ x: cx, y: cy - hucre * 0.75, metin: "Altın yem", t: zaman + 60, renk: "#fff3b0", buyuk: false });
  hudGuncelle(true);
  if (altin) { bip(660, 0.09, "triangle", 0.07); setTimeout(function () { bip(990, 0.16, "triangle", 0.07); }, 80); }
  else bip(420 * Math.pow(1.12, kombo - 1), 0.11, "triangle", 0.07);
}

function carp() {
  if (durum !== "oyun") { yilan.forEach(function (s, i) { if (i % 2 === 0) parcacikSac((s.x + 0.5) * hucre, (s.y + 0.5) * hucre, "#2af5d0", 3, 0.5); }); demoBasla(); return; }
  durum = "oluyor"; olumSira = 0; olumSayac = 0; sarsinti = 16; flas = 1; onceki = yilan.map(kopya);
  kombo = 0;
  tahta.classList.remove("sarsil"); void tahta.offsetWidth; tahta.classList.add("sarsil");
  sesOlum();
}

/* ── Gösteri modu: perdenin arkasında yılan kendi kendine oynar ── */
function demoSec() {
  var hedef = bonus || yem; if (!hedef) return;
  var bas = yilan[0];
  var secenek = [yon, { x: -yon.y, y: yon.x }, { x: yon.y, y: -yon.x }];
  var dolu = {};
  for (var i = 0; i < yilan.length - 1; i++) dolu[yilan[i].x + "," + yilan[i].y] = 1;
  var en = null, enPuan = -1e9;
  secenek.forEach(function (d) {
    var x = bas.x + d.x, y = bas.y + d.y;
    if (x < 0 || y < 0 || x >= NX || y >= NY) { if (!duvardanGec) return; x = (x + NX) % NX; y = (y + NY) % NY; }
    if (dolu[x + "," + y]) return;
    var p = -uzaklik(x, y, hedef.x, hedef.y) + (d === yon ? 0.4 : 0) + Math.random() * 0.3;
    if (alan(x, y, dolu, yilan.length + 2) < yilan.length) p -= 1000;
    if (p > enPuan) { enPuan = p; en = d; }
  });
  if (en) yon = en;
}
function uzaklik(x1, y1, x2, y2) {
  var dx = Math.abs(x1 - x2), dy = Math.abs(y1 - y2);
  if (duvardanGec) { dx = Math.min(dx, NX - dx); dy = Math.min(dy, NY - dy); }
  return dx + dy;
}
function alan(x, y, dolu, sinir) {
  var gor = {}, yigin = [[x, y]], say = 0;
  gor[x + "," + y] = 1;
  while (yigin.length && say < sinir) {
    var h = yigin.pop(); say++;
    for (var k = 0; k < 4; k++) {
      var nx = h[0] + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = h[1] + (k === 2 ? 1 : k === 3 ? -1 : 0);
      if (nx < 0 || ny < 0 || nx >= NX || ny >= NY) { if (!duvardanGec) continue; nx = (nx + NX) % NX; ny = (ny + NY) % NY; }
      var a = nx + "," + ny;
      if (gor[a] || dolu[a]) continue;
      gor[a] = 1; yigin.push([nx, ny]);
    }
  }
  return say;
}

/* ── Girdi ── */
function yonEkle(d) {
  if (durum === "demo" || durum === "bitti") { basla(d); return; }
  if (durum !== "oyun") return;
  var son = kuyruk.length ? kuyruk[kuyruk.length - 1] : yon;
  if ((d.x === son.x && d.y === son.y) || (d.x === -son.x && d.y === -son.y)) return;
  if (kuyruk.length < 3) kuyruk.push(d);
}
var TUSLAR = { ArrowUp: "yukari", KeyW: "yukari", ArrowDown: "asagi", KeyS: "asagi", ArrowLeft: "sol", KeyA: "sol", ArrowRight: "sag", KeyD: "sag" };
addEventListener("keydown", function (e) {
  var hedef = e.target && e.target.tagName;
  if (TUSLAR[e.code]) {
    e.preventDefault();
    if (durum === "durdu") return;
    yonEkle(YONLER[TUSLAR[e.code]]); dugmeVurgula(TUSLAR[e.code]);
    return;
  }
  if ((e.code === "Space" || e.code === "Enter") && (hedef === "BUTTON" || hedef === "INPUT")) return;
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    if (durum === "oyun") duraklat(); else if (durum === "durdu") devam(); else if (durum === "demo" || durum === "bitti") basla();
  } else if (e.code === "KeyP" || e.code === "Escape") {
    if (durum === "oyun") duraklat(); else if (durum === "durdu") devam();
  }
});

// Kaydırma: parmak 22 pikselden fazla kayınca yön değişir; parmağı kaldırmadan art arda dönülebilir.
var dokunBas = null;
sahne.addEventListener("touchstart", function (e) { var t = e.touches[0]; dokunBas = { x: t.clientX, y: t.clientY }; }, { passive: true });
sahne.addEventListener("touchmove", function (e) {
  if (durum !== "oyun" || !dokunBas) return;
  e.preventDefault();
  var t = e.touches[0], dx = t.clientX - dokunBas.x, dy = t.clientY - dokunBas.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
  yonEkle(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? YONLER.sag : YONLER.sol) : (dy > 0 ? YONLER.asagi : YONLER.yukari));
  dokunBas = { x: t.clientX, y: t.clientY };
}, { passive: false });
sahne.addEventListener("touchend", function () { dokunBas = null; });

document.querySelectorAll(".yon button").forEach(function (b) {
  b.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    if (durum === "durdu") return;
    yonEkle(YONLER[b.getAttribute("data-yon")]);
    b.classList.add("basili");
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(function (t) { b.addEventListener(t, function () { b.classList.remove("basili"); }); });
});
function dugmeVurgula(ad) {
  var b = document.querySelector('.yon [data-yon="' + ad + '"]');
  if (!b) return;
  b.classList.add("basili"); setTimeout(function () { b.classList.remove("basili"); }, 120);
}

$("basla").addEventListener("click", function () { this.blur(); if (durum === "durdu") devam(); else basla(); });
$("bastan").addEventListener("click", function () { this.blur(); basla(); });
$("durdurDugme").addEventListener("click", function () { this.blur(); if (durum === "oyun") duraklat(); else if (durum === "durdu") devam(); });
duvarSecim.addEventListener("change", function () { duvardanGec = duvarSecim.checked; modYaz(); });
document.addEventListener("visibilitychange", function () { if (document.hidden) duraklat(); });

/* ── Perde ve sayaçlar ── */
function perdeGoster(mod) {
  perde.setAttribute("data-mod", mod);
  var rekor = mod === "bitti" && skor > 0 && skor > oncekiEnIyi;
  perde.classList.toggle("rekor", rekor);
  var ust = $("perdeUst").querySelector("span"), baslik = $("perdeBaslik"), metin = $("perdeMetin");
  $("sonuc").hidden = mod !== "bitti";
  $("anahtar").hidden = mod === "durdu";
  $("bastan").hidden = mod !== "durdu";
  if (mod === "durdu") {
    ust.textContent = "Mola"; baslik.innerHTML = "Duraklatıldı";
    metin.textContent = "Hazır olduğunda kaldığın yerden devam et. Yılan sen dönene kadar bekler.";
    $("basla").textContent = "Devam et";
  } else if (mod === "bitti") {
    ust.textContent = rekor ? "Yeni rekor" : "Oyun bitti";
    baslik.innerHTML = rekor ? "Harika <em>seri</em>" : "Bir tur <em>daha?</em>";
    metin.textContent = rekor ? "En iyi skorunu geride bıraktın. Bakalım bunu da geçebilecek misin?" : "Yemleri art arda topla, kombo puanı her yemde katlanır.";
    $("sonSkor").textContent = sayi(skor); $("sonEnIyi").textContent = sayi(enIyi); $("sonUzunluk").textContent = yilan.length;
    $("basla").textContent = "Tekrar oyna";
  }
  perde.classList.add("gorunur");
}
function perdeGizle() { perde.classList.remove("gorunur"); }

function modYaz() {
  $("modYazi").textContent = duvardanGec ? "Duvardan geçiş açık" : "Duvarlar kapalı";
  $("modNokta").classList.toggle("gecis", duvardanGec);
  $("duvarAciklama").textContent = duvardanGec ? "Kenardan çıkıp karşı taraftan girersin" : "Kenara çarpınca oyun biter";
}
function hudGuncelle(pop) {
  $("skor").textContent = sayi(skor);
  $("enIyi").textContent = sayi(Math.max(enIyi, skor));
  $("uzunluk").textContent = yilan.length;
  if (pop) { var el = $("skor").parentNode; el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
}
var komboEl = $("kombo"), komboYazi = $("komboYazi"), komboCubuk = $("komboCubuk");
function komboGuncelle() {
  if (kombo > 0 && oz >= komboBitis && durum === "oyun") kombo = 0;
  var gorunur = durum === "oyun" && kombo >= 2;
  komboEl.classList.toggle("gorunur", gorunur);
  if (gorunur) {
    // Gösterge altında yem ya da yılanın başı varsa saydamlaşır; oyun alanını kapatmaz.
    var alt = (komboEl.offsetTop + komboEl.offsetHeight) / hucre, yarim = komboEl.offsetWidth / 2 / hucre + 0.5, orta = NX / 2;
    var altinda = [yem, bonus, yilan[0]].some(function (q) { return q && q.y + 0.5 < alt + 0.5 && Math.abs(q.x + 0.5 - orta) < yarim; });
    komboEl.classList.toggle("soluk", altinda);
    komboYazi.textContent = kombo + EK[kombo] + " kombo";
    komboCubuk.style.transform = "scaleX(" + sinirla((komboBitis - oz) / komboSure, 0, 1).toFixed(3) + ")";
  }
}

/* ── Ses: küçük sentez, ilk dokunuşta açılır ── */
var ses = null, sesAcik = localStorage.getItem(SES_KAYIT) !== "0";
function sesBaslat() {
  if (ses || !sesAcik) return;
  try { ses = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ses = null; }
}
function bip(frek, sure, tip, hacim) {
  if (!ses || !sesAcik) return;
  try {
    var t = ses.currentTime, o = ses.createOscillator(), g = ses.createGain();
    o.type = tip; o.frequency.setValueAtTime(frek, t); o.frequency.exponentialRampToValueAtTime(frek * 1.6, t + sure);
    g.gain.setValueAtTime(hacim, t); g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    o.connect(g); g.connect(ses.destination); o.start(t); o.stop(t + sure + 0.02);
  } catch (e) {}
}
function sesOlum() {
  if (!ses || !sesAcik) return;
  try {
    var t = ses.currentTime, o = ses.createOscillator(), g = ses.createGain();
    o.type = "sawtooth"; o.frequency.setValueAtTime(320, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.55);
    g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(g); g.connect(ses.destination); o.start(t); o.stop(t + 0.62);
  } catch (e) {}
}
function sesDugmesi() {
  var b = $("sesDugme");
  b.setAttribute("aria-pressed", sesAcik ? "true" : "false");
  b.setAttribute("aria-label", sesAcik ? "Sesi kapat" : "Sesi aç");
}
$("sesDugme").addEventListener("click", function () {
  sesAcik = !sesAcik; localStorage.setItem(SES_KAYIT, sesAcik ? "1" : "0"); sesDugmesi(); this.blur();
  if (sesAcik) { sesBaslat(); bip(520, 0.08, "triangle", 0.06); }
});
sesDugmesi();

/* ── Efektler ── */
function parcacikSac(x, y, renk, n, guc) {
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2, h = (0.05 + Math.random() * 0.2) * hucre * guc;
    parcaciklar.push({ x: x, y: y, vx: Math.cos(a) * h, vy: Math.sin(a) * h, omur: 0, max: 380 + Math.random() * 520, r: (0.04 + Math.random() * 0.07) * hucre, renk: renk });
  }
}
function efektGuncelle(dt) {
  var k = dt / 16.67, s = Math.pow(0.92, k);
  for (var i = parcaciklar.length - 1; i >= 0; i--) {
    var p = parcaciklar[i];
    p.omur += dt; p.x += p.vx * k; p.y += p.vy * k; p.vx *= s; p.vy *= s;
    if (p.omur > p.max) parcaciklar.splice(i, 1);
  }
  for (var j = yazilar.length - 1; j >= 0; j--) if (zaman - yazilar[j].t > 900) yazilar.splice(j, 1);
  sarsinti *= Math.pow(0.86, k); flas = Math.max(0, flas - dt / 500);
  if (bonus && oz > bonus.bitis) { parcacikSac((bonus.x + 0.5) * hucre, (bonus.y + 0.5) * hucre, "#fff3b0", 12, 0.6); bonus = null; }
  if (durum === "oluyor") {
    olumSayac += dt;
    while (olumSayac > 34 && olumSira < yilan.length) {
      olumSayac -= 34;
      var sg = yilan[olumSira++];
      parcacikSac((sg.x + 0.5) * hucre, (sg.y + 0.5) * hucre, olumSira % 2 ? "#c6ff3d" : "#2af5d0", 8, 0.9);
      sarsinti = Math.max(sarsinti, 4);
      if (olumSira % 3 === 0) bip(180 + olumSira * 6, 0.05, "square", 0.025);
    }
    if (olumSira >= yilan.length && olumSayac > 520) bitir();
  }
}

/* ── Çizim ── */
function yuvarlakYol(x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function karis(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
var RENK_BAS = [214, 255, 72], RENK_ORTA = [96, 255, 150], RENK_KUYRUK = [24, 196, 190];
function govdeRengi(t) {
  var r = t < 0.5 ? karis(RENK_BAS, RENK_ORTA, t * 2) : karis(RENK_ORTA, RENK_KUYRUK, (t - 0.5) * 2);
  return "rgb(" + (r[0] | 0) + "," + (r[1] | 0) + "," + (r[2] | 0) + ")";
}

// Gövde ızgara köşelerinden geçer: baş yeni hücresine doğru kayar, kuyruk ucu bir önceki hücreden çekilir.
function ara(from, to, t) {
  var fx = from.x, fy = from.y;
  if (to.x - fx > 1) fx += NX; else if (fx - to.x > 1) fx -= NX;
  if (to.y - fy > 1) fy += NY; else if (fy - to.y > 1) fy -= NY;
  return { x: (fx + (to.x - fx) * t + 0.5) * hucre, y: (fy + (to.y - fy) * t + 0.5) * hucre };
}
function noktalar(t) {
  var P = [], i;
  if (durum === "oluyor") {
    for (i = olumSira; i < yilan.length; i++) P.push({ x: (yilan[i].x + 0.5) * hucre, y: (yilan[i].y + 0.5) * hucre });
    return P;
  }
  P.push(ara(onceki[0] || yilan[0], yilan[0], t));
  for (i = 1; i < yilan.length; i++) P.push({ x: (yilan[i].x + 0.5) * hucre, y: (yilan[i].y + 0.5) * hucre });
  if (onceki.length >= yilan.length) P.push(ara(onceki[onceki.length - 1], yilan[yilan.length - 1], t));
  return P;
}
function parcaCiz(a, b) {
  var dx = b.x - a.x, dy = b.y - a.y, ox = 0, oy = 0;
  if (dx > gen / 2) ox = -gen; else if (dx < -gen / 2) ox = gen;
  if (dy > yuk / 2) oy = -yuk; else if (dy < -yuk / 2) oy = yuk;
  c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x + ox, b.y + oy);
  if (ox || oy) { c.moveTo(a.x - ox, a.y - oy); c.lineTo(b.x, b.y); }
  c.stroke();
}
function yolKur(P) {
  var yol = new Path2D();
  yol.moveTo(P[0].x, P[0].y);
  for (var i = 1; i < P.length; i++) {
    var a = P[i - 1], b = P[i], dx = b.x - a.x, dy = b.y - a.y, ox = 0, oy = 0;
    if (dx > gen / 2) ox = -gen; else if (dx < -gen / 2) ox = gen;
    if (dy > yuk / 2) oy = -yuk; else if (dy < -yuk / 2) oy = yuk;
    if (ox || oy) { yol.lineTo(b.x + ox, b.y + oy); yol.moveTo(a.x - ox, a.y - oy); }
    yol.lineTo(b.x, b.y);
  }
  return yol;
}

function yilanCiz(t) {
  var P = noktalar(t);
  if (!P.length) return;
  var basVar = durum !== "oluyor";
  var toplam = Math.max(1, P.length - 1);
  if (basVar) {
    // Başın çevresindeki ızgarayı aydınlatan ışık
    c.save(); c.globalCompositeOperation = "lighter";
    var isik = c.createRadialGradient(P[0].x, P[0].y, 0, P[0].x, P[0].y, hucre * 4.5);
    isik.addColorStop(0, "rgba(170,255,90,0.14)"); isik.addColorStop(1, "rgba(170,255,90,0)");
    c.fillStyle = isik; c.fillRect(P[0].x - hucre * 4.5, P[0].y - hucre * 4.5, hucre * 9, hucre * 9);
    c.restore();
  }
  c.lineCap = "round"; c.lineJoin = "round";
  if (P.length > 1) {
    var yol = yolKur(P);
    c.save();
    c.globalCompositeOperation = "lighter";
    c.shadowColor = "rgba(150,255,90,0.95)"; c.shadowBlur = hucre * 1.1;
    c.strokeStyle = "rgba(120,255,120,0.2)"; c.lineWidth = hucre * 0.95; c.stroke(yol);
    c.restore();
    for (var i = P.length - 1; i >= 1; i--) {
      var k = i / toplam;
      c.strokeStyle = govdeRengi(k); c.lineWidth = hucre * (0.66 - 0.24 * k);
      parcaCiz(P[i], P[i - 1]);
    }
    c.save();
    c.strokeStyle = "rgba(255,255,255,0.42)"; c.lineWidth = Math.max(1.5, hucre * 0.12); c.stroke(yol);
    c.restore();
  }
  if (!basVar) return;
  // Baş: duvardan geçerken iki kenarda da görünür
  basCiz(P[0].x, P[0].y);
  if (duvardanGec) {
    if (P[0].x < hucre) basCiz(P[0].x + gen, P[0].y); else if (P[0].x > gen - hucre) basCiz(P[0].x - gen, P[0].y);
    if (P[0].y < hucre) basCiz(P[0].x, P[0].y + yuk); else if (P[0].y > yuk - hucre) basCiz(P[0].x, P[0].y - yuk);
  }
}
function basCiz(hx, hy) {
  var h = { x: hx, y: hy }, r = hucre * 0.42;
  c.save();
  c.shadowColor = "#c6ff3d"; c.shadowBlur = hucre * 0.8;
  var g = c.createRadialGradient(h.x - r * 0.3, h.y - r * 0.3, r * 0.1, h.x, h.y, r);
  g.addColorStop(0, "#f7ffd6"); g.addColorStop(0.55, "#d6ff48"); g.addColorStop(1, "#9ee830");
  c.fillStyle = g; c.beginPath(); c.arc(h.x, h.y, r, 0, Math.PI * 2); c.fill();
  c.restore();
  var dx = yon.x, dy = yon.y, px = -dy, py = dx;
  if (durum === "oyun" || durum === "demo" || durum === "bitti") {
    if (Math.sin(zaman / 230) > 0.82) {
      c.strokeStyle = "#ff5f7a"; c.lineWidth = Math.max(1.5, hucre * 0.07);
      var ux = h.x + dx * r * 0.9, uy = h.y + dy * r * 0.9, ex = ux + dx * hucre * 0.3, ey = uy + dy * hucre * 0.3;
      c.beginPath(); c.moveTo(ux, uy); c.lineTo(ex, ey);
      c.lineTo(ex + dx * hucre * 0.1 + px * hucre * 0.09, ey + dy * hucre * 0.1 + py * hucre * 0.09);
      c.moveTo(ex, ey); c.lineTo(ex + dx * hucre * 0.1 - px * hucre * 0.09, ey + dy * hucre * 0.1 - py * hucre * 0.09);
      c.stroke();
    }
  }
  for (var s = -1; s <= 1; s += 2) {
    var gx = h.x + dx * r * 0.28 + px * r * 0.44 * s, gy = h.y + dy * r * 0.28 + py * r * 0.44 * s;
    c.fillStyle = "#04140f"; c.beginPath(); c.arc(gx, gy, r * 0.22, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffffff"; c.beginPath(); c.arc(gx + dx * r * 0.06 - r * 0.05, gy + dy * r * 0.06 - r * 0.05, r * 0.08, 0, Math.PI * 2); c.fill();
  }
}

function yemCiz() {
  if (!yem) return;
  var cx = (yem.x + 0.5) * hucre, cy = (yem.y + 0.5) * hucre;
  var dogus = Math.min(1, (zaman - yem.dogum) / 320), e = Math.max(0, 1 + 2.2 * Math.pow(dogus - 1, 3) + 1.2 * Math.pow(dogus - 1, 2));
  var r = hucre * 0.27 * e * (1 + 0.08 * Math.sin(zaman / 150));
  c.save();
  c.globalCompositeOperation = "lighter";
  var hale = c.createRadialGradient(cx, cy, 0, cx, cy, hucre * 1.3);
  hale.addColorStop(0, "rgba(255,170,60,0.28)"); hale.addColorStop(1, "rgba(255,120,40,0)");
  c.fillStyle = hale; c.fillRect(cx - hucre * 1.3, cy - hucre * 1.3, hucre * 2.6, hucre * 2.6);
  c.restore();
  c.save();
  c.shadowColor = "#ff8a3d"; c.shadowBlur = hucre * 0.7;
  var g = c.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 0, cx, cy, r);
  g.addColorStop(0, "#fff7df"); g.addColorStop(0.4, "#ffc24a"); g.addColorStop(1, "#ff6a3d");
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, Math.max(0.5, r), 0, Math.PI * 2); c.fill();
  c.restore();
  c.strokeStyle = "rgba(255,190,100,0.6)"; c.lineWidth = 1.5; c.lineCap = "round";
  var don = zaman / 700;
  for (var k = 0; k < 3; k++) { c.beginPath(); c.arc(cx, cy, hucre * 0.5 * e, don + k * 2.094, don + k * 2.094 + 1.1); c.stroke(); }
}
function bonusCiz() {
  if (!bonus) return;
  var cx = (bonus.x + 0.5) * hucre, cy = (bonus.y + 0.5) * hucre, kalan = sinirla((bonus.bitis - oz) / 7000, 0, 1);
  var dogus = Math.min(1, (zaman - bonus.dogum) / 360), e = dogus * (1 + 0.1 * Math.sin(zaman / 120));
  var yanip = kalan < 0.3 && Math.sin(zaman / 60) > 0 ? 0.45 : 1;
  c.save();
  c.globalAlpha = yanip;
  c.translate(cx, cy); c.rotate(zaman / 900);
  c.shadowColor = "#ffd84a"; c.shadowBlur = hucre;
  var r = hucre * 0.42 * e, ir = r * 0.36;
  c.beginPath();
  for (var i = 0; i < 8; i++) { var a = (i / 8) * Math.PI * 2, rr = i % 2 ? ir : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  c.closePath();
  var g = c.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, "#ffffff"); g.addColorStop(0.5, "#fff1a0"); g.addColorStop(1, "#ffc93b");
  c.fillStyle = g; c.fill();
  c.restore();
  c.save();
  c.strokeStyle = "rgba(255,225,120,0.8)"; c.lineWidth = 2; c.lineCap = "round";
  c.beginPath(); c.arc(cx, cy, hucre * 0.62, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * kalan); c.stroke();
  c.restore();
}

function dalgaCiz() {
  if (!dalgalar.length) return;
  c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = "#c6ff3d";
  for (var k = dalgalar.length - 1; k >= 0; k--) {
    var d = dalgalar[k], yas = zaman - d.t;
    if (yas > 1100) { dalgalar.splice(k, 1); continue; }
    var r = yas * hucre * 0.02, son = 1 - yas / 1100, gen = hucre * 1.5;
    for (var i = 1; i < NX; i++) for (var j = 1; j < NY; j++) {
      var px = i * hucre, py = j * hucre, f = 1 - Math.abs(Math.hypot(px - d.x, py - d.y) - r) / gen;
      if (f <= 0) continue;
      var a = Math.min(1, f * son * d.guc), s = Math.max(1.5, hucre * (0.06 + a * 0.1));
      c.globalAlpha = a * 0.85; c.fillRect(px - s / 2, py - s / 2, s, s);
    }
  }
  c.restore();
}
function kenarCiz() {
  c.save();
  c.lineWidth = 2;
  if (duvardanGec) {
    c.setLineDash([hucre * 0.35, hucre * 0.65]); c.lineDashOffset = -zaman * 0.03;
    c.strokeStyle = "rgba(42,245,208,0.6)"; c.shadowColor = "#2af5d0";
  } else {
    c.strokeStyle = flas > 0 ? "rgba(255,90,110," + (0.45 + flas * 0.55).toFixed(2) + ")" : "rgba(198,255,61,0.42)";
    c.shadowColor = flas > 0 ? "#ff5a6e" : "#c6ff3d";
  }
  c.shadowBlur = 14;
  yuvarlakYol(1.5, 1.5, gen - 3, yuk - 3, 20); c.stroke();
  c.restore();
}
function parcacikCiz() {
  c.save(); c.globalCompositeOperation = "lighter";
  for (var i = 0; i < parcaciklar.length; i++) {
    var p = parcaciklar[i], a = 1 - p.omur / p.max;
    c.globalAlpha = a; c.fillStyle = p.renk;
    c.beginPath(); c.arc(p.x, p.y, Math.max(0.4, p.r * (0.5 + a * 0.5)), 0, Math.PI * 2); c.fill();
  }
  c.restore();
}
function yaziCiz() {
  c.save(); c.textAlign = "center"; c.textBaseline = "middle";
  for (var i = 0; i < yazilar.length; i++) {
    var y = yazilar[i], yas = zaman - y.t;
    if (yas < 0) continue;
    var a = 1 - yas / 900;
    c.globalAlpha = Math.max(0, a);
    c.font = "700 " + Math.round(hucre * (y.buyuk ? 0.62 : 0.48)) + "px Unbounded, Manrope, sans-serif";
    c.shadowBlur = 0; c.lineWidth = 4; c.lineJoin = "round"; c.strokeStyle = "rgba(3,8,7,0.7)"; c.strokeText(y.metin, y.x, y.y - hucre * 0.9 - yas * hucre * 0.0016);
    c.fillStyle = y.renk; c.shadowColor = y.renk; c.shadowBlur = 12;
    c.fillText(y.metin, y.x, y.y - hucre * 0.9 - yas * hucre * 0.0016);
  }
  c.restore();
}

function ciz(t) {
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = "#030807"; c.fillRect(0, 0, gen, yuk);
  var sx = sarsinti > 0.3 ? (Math.random() - 0.5) * sarsinti : 0, sy = sarsinti > 0.3 ? (Math.random() - 0.5) * sarsinti : 0;
  c.translate(sx, sy);
  c.drawImage(izgaraTuval, 0, 0, gen, yuk);
  dalgaCiz();
  yemCiz(); bonusCiz();
  yilanCiz(t);
  parcacikCiz(); yaziCiz();
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  kenarCiz();
  if (flas > 0) { c.fillStyle = "rgba(255,60,90," + (flas * 0.22).toFixed(3) + ")"; c.fillRect(0, 0, gen, yuk); }
}

/* ── Döngü ── */
function dongu(an) {
  var dt = sonZaman ? Math.min(100, an - sonZaman) : 16; sonZaman = an;
  zaman += dt;
  var calisiyor = durum === "oyun" || durum === "demo" || durum === "bitti";
  if (calisiyor) {
    oz += dt; birikim += dt;
    var guvenlik = 0;
    while (birikim >= adimSure && guvenlik++ < 4) {
      birikim -= adimSure; adim();
      if (durum === "oluyor") { birikim = 0; break; }
    }
  }
  efektGuncelle(dt);
  komboGuncelle();
  ciz(calisiyor || durum === "durdu" ? sinirla(birikim / adimSure, 0, 1) : 1);
  requestAnimationFrame(dongu);
}

izgaraKur(); demoBasla(); modYaz(); hizYaz(A.baslangicHizi); hudGuncelle(false);
requestAnimationFrame(dongu);
`,
    "ikon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="r" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#d9ff5c" />
      <stop offset="1" stop-color="#2af5d0" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="18" fill="#06120f" />
  <rect x="1" y="1" width="62" height="62" rx="17" fill="none" stroke="#c6ff3d" stroke-opacity=".35" stroke-width="2" />
  <path d="M16 20h22a7 7 0 0 1 0 14H27a7 7 0 0 0 0 14h22" fill="none" stroke="url(#r)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="48" cy="20" r="4.5" fill="#ffb43b" />
</svg>
`,
  },
};
