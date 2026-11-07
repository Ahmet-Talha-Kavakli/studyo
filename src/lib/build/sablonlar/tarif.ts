/* Şablon: Mutfak · Tarif Defteri — mobil uygulama (PWA): görselli tarifler, kategori ve arama, kişi sayısına göre ölçeklenen malzemeler, adım adım pişirme ve zamanlayıcı, favoriler, alışveriş listesi, kendi tarifini ekleme. Veriler cihazda saklanır. */

export const TARIF_DEFTERI = {
  id: "tarif-defteri",
  ad: "Mutfak · Tarif Defteri",
  tur: "mobil" as const,
  aciklama: "Türk mutfağı tarifleri, adım adım pişirme, zamanlayıcı ve alışveriş listesi",
  kapak: "/gercek/build/sablon/tarif-defteri.webp",
  dosyalar: {
    "index.html": `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#eef1ea" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="description" content="Mutfak: Türk mutfağından tarifler, kişi sayısına göre ölçeklenen malzemeler, adım adım pişirme ve alışveriş listesi." />
  <title>Mutfak · Tarif Defteri</title>
  <link rel="manifest" href="manifest.webmanifest" />
  <link rel="icon" href="ikon.svg" />
  <link rel="apple-touch-icon" href="ikon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Young+Serif&family=Figtree:wght@400;500;600;700&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <main id="ekran" tabindex="-1"></main>

  <div id="sayac" class="sayac-hap" hidden></div>

  <nav class="sekmeler" aria-label="Ana menü">
    <button type="button" data-sekme="kesfet" class="secili" aria-current="page">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="m15.2 8.8-1.9 4.5-4.5 1.9 1.9-4.5z"/></svg>
      <span>Keşfet</span>
    </button>
    <button type="button" data-sekme="favoriler">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z"/></svg>
      <span>Favoriler</span>
    </button>
    <button type="button" data-sekme="liste">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h1"/><path d="M9.5 7H19"/><path d="M5 12h1"/><path d="M9.5 12H19"/><path d="M5 17h1"/><path d="M9.5 17H19"/></svg>
      <span>Liste</span><i class="rozet-sayi" id="listeSayi" hidden></i>
    </button>
    <button type="button" data-sekme="ekle" class="ekle-sekme">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12"/><path d="M6 12h12"/></svg>
      <span>Ekle</span>
    </button>
  </nav>

  <section id="detay" class="katman" role="dialog" aria-modal="true" aria-label="Tarif" hidden></section>
  <section id="pisir" class="pisir" role="dialog" aria-modal="true" aria-label="Adım adım pişirme" hidden></section>
  <div id="tost" class="tost" role="status" aria-live="polite"></div>

  <script src="app.js"></script>
</body>
</html>
`,
    "manifest.webmanifest": `{
  "name": "Mutfak · Tarif Defteri",
  "short_name": "Mutfak",
  "description": "Türk mutfağından tarifler, kişi sayısına göre ölçeklenen malzemeler, adım adım pişirme ve alışveriş listesi.",
  "lang": "tr",
  "start_url": "index.html",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#eef1ea",
  "theme_color": "#eef1ea",
  "icons": [
    { "src": "ikon.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "any" },
    { "src": "ikon.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "maskable" }
  ]
}
`,
    "ikon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#2d4a36"/><circle cx="256" cy="268" r="150" fill="#eef1ea"/><path d="M150 262h212v34a76 76 0 0 1-76 76h-60a76 76 0 0 1-76-76z" fill="#d9472f"/><path d="M128 262h256" stroke="#2d4a36" stroke-width="18" stroke-linecap="round"/><path d="M216 222c0-14 9-22 22-22h36c13 0 22 8 22 22" fill="none" stroke="#2d4a36" stroke-width="16" stroke-linecap="round"/><path d="M256 200v-20" stroke="#2d4a36" stroke-width="16" stroke-linecap="round"/><path d="M330 150c26-30 60-34 86-26-4 28-24 54-60 58" fill="#e9a23b"/></svg>
`,
    "stil.css": `:root {
  --zemin: #eef1ea;
  --kart: #ffffff;
  --kart-2: #f6f8f3;
  --metin: #1b2a20;
  --soluk: #5a675e;
  --soluk-2: #7a867d;
  --zeytin: #2d4a36;
  --zeytin-2: #3d6149;
  --zeytin-acik: #dfe8dc;
  --domates: #d9472f;
  --domates-acik: #fbe4dd;
  --safran: #e9a23b;
  --cizgi: #dde2d6;
  --yazi: "Figtree", system-ui, -apple-system, "Segoe UI", sans-serif;
  --serif: "Young Serif", Georgia, "Times New Roman", serif;
  --egri: cubic-bezier(0.22, 1, 0.36, 1);
}

* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
[hidden] { display: none !important; }
html { background: var(--zemin); }
body {
  margin: 0; min-height: 100vh; min-height: 100dvh; background: var(--zemin); color: var(--metin);
  font-family: var(--yazi); font-size: 15px; line-height: 1.45; -webkit-font-smoothing: antialiased; overflow-x: hidden;
}
body.kilit { overflow: hidden; }
button, input, select, textarea { font: inherit; color: inherit; }
button { cursor: pointer; }
:focus-visible { outline: 2.5px solid var(--domates); outline-offset: 2px; border-radius: 10px; }
h1, h2, h3 { font-family: var(--serif); font-weight: 400; margin: 0; letter-spacing: -0.01em; }
img { display: block; max-width: 100%; }

#ekran {
  max-width: 560px; margin: 0 auto; outline: none;
  padding: calc(env(safe-area-inset-top) + 18px) 18px calc(env(safe-area-inset-bottom) + 104px);
  animation: belir 0.4s var(--egri);
}
@keyframes belir { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

/* Üst */
.ust { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.marka-satir { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.marka { display: inline-flex; align-items: center; gap: 7px; color: var(--zeytin); font-family: var(--serif); font-size: 21px; }
.marka svg { width: 26px; height: 26px; }
.ust-ust { margin: 0; color: var(--soluk); font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.ust-ust .marka { display: inline-flex; align-items: center; gap: 6px; color: var(--zeytin); font-family: var(--serif); font-size: 17px; font-weight: 400; }
.ust-ust .marka svg { width: 22px; height: 22px; }
.ust h1 { font-size: 32px; line-height: 1.12; margin-top: 4px; }
.ust h1 em { font-style: normal; color: var(--domates); }
.yuvarlak-dugme {
  flex: none; width: 46px; height: 46px; border-radius: 50%; border: 1px solid var(--cizgi); background: var(--kart);
  display: grid; place-items: center; color: var(--zeytin); transition: transform 0.2s var(--egri), background 0.2s;
}
.yuvarlak-dugme:hover { background: var(--kart-2); }
.yuvarlak-dugme:active { transform: scale(0.94); }
.yuvarlak-dugme svg { width: 22px; height: 22px; }

/* Arama */
.arama { position: relative; margin-top: 16px; }
.arama svg { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; color: var(--soluk); pointer-events: none; }
.arama input {
  width: 100%; min-height: 50px; border-radius: 16px; border: 1px solid var(--cizgi); background: var(--kart);
  padding: 0 44px 0 46px; font-size: 15.5px; color: var(--metin);
}
.arama input::placeholder { color: var(--soluk); }
.arama input:focus { outline: none; border-color: var(--zeytin-2); }
.arama .temizle { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); width: 44px; height: 44px; border: 0; background: none; color: var(--soluk); display: grid; place-items: center; }
.arama .temizle svg { position: static; transform: none; width: 18px; height: 18px; }

/* Kategori çipleri */
.cipler { display: flex; gap: 8px; overflow-x: auto; margin: 14px -18px 0; padding: 2px 18px 4px; scrollbar-width: none; }
.cipler::-webkit-scrollbar { display: none; }
.cip {
  flex: none; display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px 0 5px;
  border-radius: 999px; border: 1px solid var(--cizgi); background: var(--kart); font-weight: 600; font-size: 14px; color: var(--metin);
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}
.cip.yalin { padding: 0 16px; }
.cip img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; }
.cip .cip-ikon { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: var(--zeytin-acik); color: var(--zeytin); }
.cip .cip-ikon svg { width: 18px; height: 18px; }
.cip[aria-pressed="true"] { background: var(--zeytin); border-color: var(--zeytin); color: #fff; }
.cip[aria-pressed="true"] .cip-ikon { background: rgba(255, 255, 255, 0.16); color: #fff; }

/* Günün tarifi */
.bolum-baslik { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin: 24px 2px 12px; }
.bolum-baslik h2 { font-size: 21px; }
.bolum-baslik span, .bolum-baslik label { color: var(--soluk); font-size: 13.5px; font-weight: 600; }
.sirala { border: 0; background: transparent; color: var(--zeytin); font-weight: 700; font-size: 13.5px; padding: 8px 2px; min-height: 40px; cursor: pointer; }
.manset {
  position: relative; display: block; width: 100%; padding: 0; border: 0; border-radius: 26px; overflow: hidden; text-align: left;
  aspect-ratio: 4 / 3.2; background: #c9d3c4; color: #fff; isolation: isolate;
}
.manset img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s var(--egri); }
.manset:hover img { transform: scale(1.04); }
.manset::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(20, 30, 22, 0) 38%, rgba(20, 30, 22, 0.86) 100%); }
.manset-yazi { position: absolute; z-index: 1; left: 18px; right: 18px; bottom: 16px; }
.manset-yazi .etiket { display: inline-block; padding: 5px 11px; border-radius: 999px; background: var(--safran); color: #2b1d05; font-size: 12.5px; font-weight: 700; }
.manset-yazi .baslik { display: block; font-family: var(--serif); font-size: 28px; line-height: 1.12; margin: 8px 0 6px; }
.manset-yazi .meta { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 13.5px; font-weight: 600; color: rgba(255, 255, 255, 0.92); }
.manset-yazi .meta span { display: inline-flex; align-items: center; gap: 5px; }
.manset-yazi svg { width: 16px; height: 16px; }

.kalp {
  position: absolute; z-index: 2; top: 10px; right: 10px; width: 44px; height: 44px; border-radius: 50%; border: 0;
  background: rgba(255, 255, 255, 0.9); color: var(--metin); display: grid; place-items: center;
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); transition: transform 0.2s var(--egri);
}
.kalp svg { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 1.9; }
.kalp[aria-pressed="true"] { color: var(--domates); }
.kalp[aria-pressed="true"] svg { fill: currentColor; }
.kalp:active { transform: scale(0.88); }
.kalp.atti { animation: atti 0.45s var(--egri); }
@keyframes atti { 0% { transform: scale(1); } 40% { transform: scale(1.25); } 100% { transform: scale(1); } }

/* Tarif ızgarası */
.izgara { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 12px; }
.tarif-kart { position: relative; }
.tarif-kart > button.ac { display: block; width: 100%; padding: 0; border: 0; background: none; text-align: left; color: inherit; }
.tarif-kart .gorsel { position: relative; border-radius: 20px; overflow: hidden; aspect-ratio: 1 / 1; background: #cfd8ca; }
.tarif-kart .gorsel img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s var(--egri); }
.tarif-kart:hover .gorsel img { transform: scale(1.05); }
.tarif-kart .sure {
  position: absolute; left: 8px; bottom: 8px; display: inline-flex; align-items: center; gap: 4px; padding: 5px 9px; border-radius: 999px;
  background: rgba(255, 255, 255, 0.92); font-size: 12px; font-weight: 700; color: var(--metin);
}
.tarif-kart .sure svg { width: 13px; height: 13px; }
.tarif-kart .kart-baslik { display: block; font-family: var(--serif); font-size: 16.5px; line-height: 1.2; margin: 10px 2px 3px; }
.tarif-kart .alt { display: block; margin: 0 2px; color: var(--soluk); font-size: 13px; font-weight: 500; }
.tarif-kart .kalp { width: 40px; height: 40px; top: 8px; right: 8px; }
.tarif-kart .kalp svg { width: 19px; height: 19px; }
.senin { position: absolute; left: 8px; top: 8px; padding: 4px 9px; border-radius: 999px; background: var(--zeytin); color: #fff; font-size: 11.5px; font-weight: 700; }

/* Boş durum */
.bos { text-align: center; padding: 34px 18px 20px; }
.bos .yelpaze { position: relative; height: 128px; width: 220px; margin: 0 auto 18px; }
.bos .yelpaze img { position: absolute; top: 10px; width: 96px; height: 112px; object-fit: cover; border-radius: 18px; border: 4px solid var(--zemin); }
.bos .yelpaze img:nth-child(1) { left: 6px; transform: rotate(-9deg); }
.bos .yelpaze img:nth-child(2) { left: 62px; top: 0; z-index: 1; }
.bos .yelpaze img:nth-child(3) { right: 6px; transform: rotate(9deg); }
.bos h2 { font-size: 22px; }
.bos p { color: var(--soluk); margin: 6px auto 16px; max-width: 300px; }
.bos-dugmeler { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }

/* Düğmeler */
.dugme {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; padding: 0 20px;
  border-radius: 15px; border: 1px solid transparent; font-weight: 700; font-size: 15px;
  background: var(--zeytin); color: #fff; transition: transform 0.15s, background 0.2s;
}
.dugme:hover { background: var(--zeytin-2); }
.dugme:active { transform: scale(0.97); }
.dugme svg { width: 20px; height: 20px; }
.dugme.ikincil { background: var(--kart); color: var(--metin); border-color: var(--cizgi); }
.dugme.ikincil:hover { background: var(--kart-2); }
.dugme.vurgu { background: var(--domates); }
.dugme.vurgu:hover { background: #c43d27; }
.dugme.tehlike { background: var(--kart); color: var(--domates); border-color: #f0c6bc; }
.dugme.tam { width: 100%; }
.dugme:disabled { opacity: 0.5; cursor: default; }

/* Detay katmanı */
.katman { position: fixed; inset: 0; z-index: 50; overflow-y: auto; background: var(--zemin); overscroll-behavior: contain; animation: kay 0.42s var(--egri); }
@keyframes kay { from { transform: translateY(24px); opacity: 0; } to { transform: none; opacity: 1; } }
.detay-ic { max-width: 560px; margin: 0 auto; position: relative; min-height: 100%; }
.detay-gorsel { position: relative; height: min(46vh, 400px); min-height: 280px; overflow: hidden; background: #c9d3c4; }
.detay-gorsel img { width: 100%; height: 100%; object-fit: cover; }
.detay-gorsel::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(20, 30, 22, 0.35) 0%, rgba(20, 30, 22, 0) 30%); }
.detay-ust { position: absolute; z-index: 2; left: 14px; right: 14px; top: calc(env(safe-area-inset-top) + 12px); display: flex; justify-content: space-between; gap: 8px; }
.detay-ust .sag { display: flex; gap: 8px; }
.cam-dugme {
  width: 46px; height: 46px; border-radius: 50%; border: 0; display: grid; place-items: center; color: var(--metin);
  background: rgba(255, 255, 255, 0.88); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
}
.cam-dugme svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.cam-dugme[aria-pressed="true"] { color: var(--domates); }
.cam-dugme[aria-pressed="true"] svg { fill: currentColor; }
.detay-govde { position: relative; z-index: 1; margin-top: -30px; background: var(--zemin); border-radius: 30px 30px 0 0; padding: 22px 18px calc(env(safe-area-inset-bottom) + 110px); }
.detay-govde .kat { color: var(--domates); font-weight: 700; font-size: 13.5px; }
.detay-govde h1 { font-size: 30px; line-height: 1.12; margin: 4px 0 8px; }
.detay-govde .ozet-yazi { color: var(--soluk); margin: 0; font-size: 15px; }
.olcu { display: grid; grid-template-columns: repeat(4, 1fr); margin: 18px 0 0; padding: 14px 4px; border-radius: 20px; background: var(--kart); border: 1px solid var(--cizgi); }
.olcu div { text-align: center; padding: 0 4px; }
.olcu div + div { border-left: 1px solid var(--cizgi); }
.olcu dt { color: var(--soluk); font-size: 12px; font-weight: 600; }
.olcu dd { margin: 2px 0 0; font-weight: 700; font-size: 15px; }
.bolum { margin-top: 26px; }
.bolum > header { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
.bolum > header h2 { font-size: 22px; }
.kisi { display: inline-flex; align-items: center; gap: 2px; padding: 3px; border-radius: 999px; background: var(--kart); border: 1px solid var(--cizgi); }
.kisi button { width: 40px; height: 40px; border-radius: 50%; border: 0; background: var(--kart-2); font-size: 20px; font-weight: 600; color: var(--zeytin); display: grid; place-items: center; }
.kisi button:disabled { opacity: 0.35; cursor: default; }
.kisi output { min-width: 78px; text-align: center; font-weight: 700; font-size: 14.5px; }
.malzemeler { list-style: none; margin: 0; padding: 4px 0; border-radius: 20px; background: var(--kart); border: 1px solid var(--cizgi); }
.malzemeler li + li { border-top: 1px solid #edf0e8; }
.malzemeler label { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 8px 14px; cursor: pointer; }
.malzemeler input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.tik { flex: none; width: 24px; height: 24px; border-radius: 50%; border: 2px solid #c3cbbf; display: grid; place-items: center; transition: background 0.2s, border-color 0.2s; }
.tik svg { width: 14px; height: 14px; stroke: #fff; stroke-width: 3; fill: none; opacity: 0; }
input:checked + .tik { background: var(--zeytin); border-color: var(--zeytin); }
input:checked + .tik svg { opacity: 1; }
input:focus-visible + .tik { outline: 2.5px solid var(--domates); outline-offset: 2px; }
.malzemeler .ad { flex: 1; }
.malzemeler .miktar { font-weight: 700; color: var(--zeytin); white-space: nowrap; font-variant-numeric: tabular-nums; }
.malzemeler .miktar.degisti { animation: parla 0.6s; }
@keyframes parla { 0% { color: var(--domates); } 100% { color: var(--zeytin); } }
.malzemeler input:checked ~ .ad, .malzemeler input:checked ~ .miktar { color: var(--soluk-2); text-decoration: line-through; }
.liste-ekle-satir { display: flex; gap: 8px; margin-top: 10px; }
.liste-ekle-satir .dugme { flex: 1; }

.adimlar { list-style: none; margin: 0; padding: 0; counter-reset: adim; }
.adimlar li { position: relative; display: grid; grid-template-columns: 34px 1fr; gap: 12px; padding: 0 0 18px; }
.adimlar li::before {
  counter-increment: adim; content: counter(adim); width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center;
  background: var(--zeytin-acik); color: var(--zeytin); font-weight: 700; font-size: 14px;
}
.adimlar li:not(:last-child)::after { content: ""; position: absolute; left: 16.5px; top: 40px; bottom: 4px; width: 1.5px; background: var(--cizgi); }
.adimlar p { margin: 6px 0 0; }
.zaman-cip {
  display: inline-flex; align-items: center; gap: 6px; min-height: 40px; margin-top: 8px; padding: 0 14px 0 10px; border-radius: 999px;
  border: 1px solid #f0c6bc; background: var(--domates-acik); color: #a8321e; font-weight: 700; font-size: 13.5px;
}
.zaman-cip svg { width: 18px; height: 18px; }
.zaman-cip.calisiyor { background: var(--domates); color: #fff; border-color: var(--domates); }
.sahip-satir { display: flex; gap: 8px; margin-top: 8px; }
.sahip-satir .dugme { flex: 1; }

.detay-alt {
  position: fixed; z-index: 55; left: 50%; transform: translateX(-50%); bottom: 0; width: min(560px, 100%);
  padding: 12px 18px calc(env(safe-area-inset-bottom) + 14px); background: rgba(238, 241, 234, 0.92); border-top: 1px solid var(--cizgi);
  -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); display: flex; gap: 10px;
}
.detay-alt .dugme { flex: 1; min-height: 54px; font-size: 16px; border-radius: 17px; }

/* Pişirme modu */
.pisir {
  position: fixed; inset: 0; z-index: 70; background: #1f3427; color: #f3f6ef; display: flex; flex-direction: column;
  padding: calc(env(safe-area-inset-top) + 14px) 0 calc(env(safe-area-inset-bottom) + 16px); animation: belir 0.35s var(--egri);
}
.pisir-ic { width: min(560px, 100%); margin: 0 auto; padding: 0 20px; display: flex; flex-direction: column; flex: 1; min-height: 0; }
.pisir-ust { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.pisir-ust b { font-family: var(--serif); font-weight: 400; font-size: 17px; }
.pisir-ust span { display: block; color: rgba(243, 246, 239, 0.7); font-size: 13px; }
.pisir .cam-dugme { background: rgba(255, 255, 255, 0.1); color: #f3f6ef; }
.ilerleme { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 5px; margin: 16px 0 0; }
.ilerleme i { height: 5px; border-radius: 9px; background: rgba(255, 255, 255, 0.16); transition: background 0.3s; }
.ilerleme i.dolu { background: var(--safran); }
.pisir-govde { flex: 1; overflow-y: auto; padding: 26px 0 12px; display: flex; flex-direction: column; }
.pisir-govde .adim-no { color: var(--safran); font-weight: 700; font-size: 14px; }
.pisir-govde .adim-metin { font-family: var(--serif); font-size: 27px; line-height: 1.3; margin: 10px 0 0; }
.pisir-malz { margin-top: 18px; display: flex; flex-wrap: wrap; gap: 6px; }
.pisir-malz span { padding: 6px 11px; border-radius: 999px; background: rgba(255, 255, 255, 0.09); font-size: 13px; font-weight: 600; }
.halka-kap { display: flex; align-items: center; gap: 18px; margin-top: auto; padding-top: 24px; }
.halka { position: relative; width: 120px; height: 120px; flex: none; }
.halka svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.halka circle { fill: none; stroke-width: 8; }
.halka .iz { stroke: rgba(255, 255, 255, 0.12); }
.halka .dolgu { stroke: var(--safran); stroke-linecap: round; transition: stroke-dashoffset 0.5s linear; }
.halka output { position: absolute; inset: 0; display: grid; place-items: center; font-weight: 700; font-size: 25px; font-variant-numeric: tabular-nums; }
.halka-dugmeler { display: grid; gap: 8px; flex: 1; }
.halka-dugmeler .dugme { background: var(--safran); color: #2b1d05; }
.halka-dugmeler .dugme.ikincil { background: rgba(255, 255, 255, 0.08); color: #f3f6ef; border-color: rgba(255, 255, 255, 0.16); }
.pisir-alt { display: flex; gap: 10px; padding-top: 14px; }
.siradaki { margin-top: 22px; padding: 14px 16px; border-radius: 18px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); }
.halka-kap + .siradaki { margin-top: 18px; }
.pisir-govde > .siradaki:not(.halka-kap + .siradaki) { margin-top: auto; }
.siradaki span { color: var(--safran); font-size: 12.5px; font-weight: 700; }
.siradaki p { margin: 4px 0 0; color: rgba(243, 246, 239, 0.78); font-size: 14.5px; }
.pisir-alt .dugme { flex: 1; min-height: 56px; font-size: 16px; }
.pisir-alt .dugme.ikincil { background: rgba(255, 255, 255, 0.08); color: #f3f6ef; border-color: rgba(255, 255, 255, 0.16); }
.pisir-alt .dugme.ana { background: #f3f6ef; color: #1f3427; }
.bitti { margin: auto 0; text-align: center; }
.bitti img { width: 180px; height: 180px; border-radius: 50%; object-fit: cover; margin: 0 auto 18px; border: 6px solid rgba(255, 255, 255, 0.12); }
.bitti h2 { font-size: 34px; }
.bitti p { color: rgba(243, 246, 239, 0.75); margin: 8px 0 0; }

/* Alışveriş listesi */
.liste-ozet { display: flex; align-items: center; gap: 14px; margin-top: 16px; padding: 14px 16px; border-radius: 20px; background: var(--zeytin); color: #fff; }
.liste-ozet .halka-kucuk { flex: none; width: 52px; height: 52px; }
.liste-ozet .halka-kucuk svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.liste-ozet .halka-kucuk circle { fill: none; stroke-width: 6; }
.liste-ozet b { font-size: 17px; display: block; }
.liste-ozet span { font-size: 13px; color: rgba(255, 255, 255, 0.8); }
.liste-ozet .govde { flex: 1; }
.ekle-kutu { display: flex; gap: 8px; margin-top: 12px; }
.ekle-kutu input { flex: 1; min-width: 0; min-height: 50px; border-radius: 15px; border: 1px solid var(--cizgi); background: var(--kart); padding: 0 16px; font-size: 15px; }
.ekle-kutu input:focus { outline: none; border-color: var(--zeytin-2); }
.ekle-kutu .dugme { min-width: 50px; padding: 0 16px; }
.reyon { margin-top: 20px; }
.reyon h3 { font-family: var(--yazi); font-weight: 700; font-size: 14px; color: var(--soluk); margin: 0 4px 8px; display: flex; align-items: center; gap: 8px; }
.reyon h3 i { width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; font-style: normal; }
.reyon h3 i svg { width: 15px; height: 15px; }
.urunler { list-style: none; margin: 0; padding: 4px 0; border-radius: 20px; background: var(--kart); border: 1px solid var(--cizgi); }
.urunler li { display: flex; align-items: center; gap: 4px; padding-right: 4px; }
.urunler li + li { border-top: 1px solid #edf0e8; }
.urunler label { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 8px 4px 8px 14px; cursor: pointer; }
.urunler input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.urunler .govde { flex: 1; min-width: 0; }
.urunler .govde b { display: block; font-weight: 600; }
.urunler .govde small { display: block; color: var(--soluk); font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.urunler .mik { color: var(--zeytin); font-weight: 700; font-size: 14px; white-space: nowrap; }
.urunler li.alindi .govde b, .urunler li.alindi .mik { color: var(--soluk-2); text-decoration: line-through; }
.sil-dugme { flex: none; width: 44px; height: 44px; border: 0; border-radius: 12px; background: none; color: var(--soluk-2); display: grid; place-items: center; }
.sil-dugme:hover { background: var(--kart-2); color: var(--domates); }
.sil-dugme svg { width: 18px; height: 18px; }
.liste-eylem { display: flex; gap: 8px; margin-top: 18px; }
.liste-eylem .dugme { flex: 1; }

/* Ekle formu */
.form { margin-top: 18px; }
.alan { margin-bottom: 16px; }
.alan > label, .alan > .etiket-yazi { display: block; font-weight: 700; font-size: 14px; margin: 0 2px 6px; }
.alan small.ipucu { display: block; color: var(--soluk); font-size: 12.5px; margin: 5px 2px 0; }
.kutu {
  width: 100%; min-height: 50px; border-radius: 15px; border: 1px solid var(--cizgi); background: var(--kart);
  padding: 12px 14px; font-size: 15px; color: var(--metin);
}
.kutu::placeholder { color: var(--soluk-2); }
textarea.kutu { min-height: 76px; resize: vertical; line-height: 1.45; }
.kutu:focus { outline: none; border-color: var(--zeytin-2); }
.kutu.hatali { border-color: var(--domates); background: #fff8f6; }
.hata-yazi { color: #b8321d; font-size: 13px; font-weight: 600; margin: 6px 2px 0; }
.kapak-sec { display: flex; gap: 10px; overflow-x: auto; margin: 0 -18px; padding: 2px 18px 6px; scrollbar-width: none; }
.kapak-sec::-webkit-scrollbar { display: none; }
.kapak-sec label { flex: none; position: relative; cursor: pointer; }
.kapak-sec input { position: absolute; opacity: 0; }
.kapak-sec img { width: 86px; height: 86px; object-fit: cover; border-radius: 18px; border: 3px solid transparent; transition: border-color 0.2s, transform 0.2s; }
.kapak-sec input:checked + img { border-color: var(--domates); transform: scale(0.97); }
.kapak-sec input:focus-visible + img { outline: 2.5px solid var(--zeytin); outline-offset: 2px; }
.iki-sutun { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.segment { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 4px; padding: 4px; border-radius: 15px; background: var(--kart); border: 1px solid var(--cizgi); }
.segment button { min-height: 42px; border: 0; border-radius: 11px; background: transparent; font-weight: 700; font-size: 14px; color: var(--soluk); }
.segment button[aria-pressed="true"] { background: var(--zeytin); color: #fff; }
.cip-sec { display: flex; flex-wrap: wrap; gap: 8px; }
.cip-sec .cip { padding: 0 14px; min-height: 42px; }
.satir-liste { display: grid; gap: 8px; }
.malz-satir { display: grid; grid-template-columns: 64px 116px 1fr 44px; gap: 6px; align-items: center; }
.malz-satir .kutu { padding: 10px; min-height: 46px; font-size: 14.5px; }
.malz-satir select.kutu { padding: 0 6px; }
.adim-satir { display: grid; grid-template-columns: 30px 1fr 44px; gap: 8px; align-items: start; }
.adim-satir .no { width: 30px; height: 30px; margin-top: 8px; border-radius: 50%; background: var(--zeytin-acik); color: var(--zeytin); display: grid; place-items: center; font-weight: 700; font-size: 13px; }
.adim-satir .ic { display: grid; gap: 6px; }
.adim-satir .sure-kutu { display: flex; align-items: center; gap: 8px; color: var(--soluk); font-size: 13px; font-weight: 600; }
.adim-satir .sure-kutu .kutu { width: 84px; min-height: 40px; padding: 6px 10px; }
.ekle-baglanti { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; margin-top: 6px; padding: 0 12px; border: 1px dashed #b9c4b4; border-radius: 13px; background: transparent; color: var(--zeytin); font-weight: 700; font-size: 14px; }
.ekle-baglanti svg { width: 18px; height: 18px; }
.form-alt { margin-top: 22px; display: grid; gap: 8px; }

/* Sekme çubuğu */
.sekmeler {
  position: fixed; z-index: 30; left: 0; right: 0; bottom: 0;
  display: grid; grid-template-columns: repeat(4, 1fr); padding: 8px max(10px, calc((100% - 560px) / 2)) calc(env(safe-area-inset-bottom) + 8px);
  background: rgba(255, 255, 255, 0.94); border-top: 1px solid var(--cizgi);
  -webkit-backdrop-filter: blur(16px) saturate(140%); backdrop-filter: blur(16px) saturate(140%);
}
.sekmeler button {
  position: relative; min-height: 54px; border: 0; background: none; color: var(--soluk-2);
  display: grid; justify-items: center; align-content: center; gap: 3px; font-size: 12px; font-weight: 700; transition: color 0.2s;
}
.sekmeler svg { width: 25px; height: 25px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; transition: transform 0.25s var(--egri); }
.sekmeler button:hover { color: var(--metin); }
.sekmeler button.secili { color: var(--zeytin); }
.sekmeler button.secili svg { transform: translateY(-1px); }
.sekmeler button.secili::before { content: ""; position: absolute; top: -8px; width: 26px; height: 3px; border-radius: 0 0 4px 4px; background: var(--zeytin); }
.sekmeler .ekle-sekme svg { width: 38px; height: 25px; padding: 2px 9px; border-radius: 11px; background: var(--domates); color: #fff; stroke: #fff; stroke-width: 2.4; }
.sekmeler .ekle-sekme.secili svg { background: var(--zeytin); }
.sekmeler .ekle-sekme.secili::before { display: none; }
.rozet-sayi {
  position: absolute; top: 3px; left: calc(50% + 6px); min-width: 19px; height: 19px; padding: 0 5px; border-radius: 99px;
  background: var(--domates); color: #fff; font-style: normal; font-size: 11px; font-weight: 700; display: grid; place-items: center; border: 2px solid #fff;
}

/* Zamanlayıcı hapı */
.sayac-hap {
  position: fixed; z-index: 45; left: 50%; transform: translateX(-50%); bottom: calc(env(safe-area-inset-bottom) + 84px);
  display: flex; align-items: center; gap: 10px; padding: 6px 6px 6px 14px; border-radius: 999px; background: var(--zeytin); color: #fff;
  font-weight: 700; font-size: 14px; white-space: nowrap; max-width: calc(100% - 24px);
}
.sayac-hap .nokta { width: 9px; height: 9px; border-radius: 50%; background: var(--safran); animation: nabiz 1.2s infinite; }
@keyframes nabiz { 50% { opacity: 0.35; } }
.sayac-hap span { overflow: hidden; text-overflow: ellipsis; }
.sayac-hap time { font-variant-numeric: tabular-nums; }
.sayac-hap button { min-height: 36px; padding: 0 12px; border-radius: 999px; border: 0; background: rgba(255, 255, 255, 0.14); color: #fff; font-weight: 700; font-size: 13px; }
.sayac-hap.bitti-hap { background: var(--domates); }
body.detay-acik .sayac-hap { bottom: calc(env(safe-area-inset-bottom) + 92px); z-index: 60; }
body.pisir-acik .sayac-hap { display: none; }

/* Tost */
.tost {
  position: fixed; z-index: 90; left: 50%; bottom: calc(env(safe-area-inset-bottom) + 86px); transform: translate(-50%, 16px); opacity: 0; pointer-events: none;
  display: flex; align-items: center; gap: 12px; padding: 8px 8px 8px 16px; border-radius: 999px; background: var(--metin); color: #fff;
  font-weight: 600; font-size: 14px; white-space: nowrap; max-width: calc(100% - 24px); transition: opacity 0.25s, transform 0.35s var(--egri);
}
.tost.acik { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; }
.tost:not(.eylemli) { padding-right: 16px; }
.tost button { min-height: 36px; padding: 0 14px; border-radius: 999px; border: 0; background: rgba(255, 255, 255, 0.16); color: #fff; font-weight: 700; font-size: 13px; }
body.detay-acik .tost { bottom: calc(env(safe-area-inset-bottom) + 92px); }
body.sayac-var:not(.pisir-acik) .tost { bottom: calc(env(safe-area-inset-bottom) + 140px); }
body.sayac-var.detay-acik:not(.pisir-acik) .tost { bottom: calc(env(safe-area-inset-bottom) + 148px); }

.gizli { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

@media (min-width: 600px) {
  #ekran { padding-top: 34px; }
  .ust h1 { font-size: 36px; }
  .izgara { gap: 20px 16px; }
  .manset { aspect-ratio: 16 / 10; }
}
@media (max-width: 360px) {
  .malz-satir { grid-template-columns: 54px 96px 1fr 40px; }
  .olcu dd { font-size: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
}
`,
    "app.js": `/* Mutfak · Tarif Defteri — veriler cihazda (localStorage). Sekmeler: Keşfet, Favoriler, Liste, Ekle. */
(function () {
  "use strict";

  var G = "/gercek/havuz/gorsel/";
  function gorsel(ad) { return G + ad + ".webp"; }

  /* ---------- Sabitler ---------- */
  var KATEGORI = [
    { id: "tumu", ad: "Tümü" },
    { id: "kahvalti", ad: "Kahvaltı", g: "mk-yemek-42910" },
    { id: "corba", ad: "Çorba", g: "mk-yemek-40534" },
    { id: "ana", ad: "Ana yemek", g: "mk-yemek-3806" },
    { id: "sebze", ad: "Sebze", g: "mk-yemek-10420" },
    { id: "salata", ad: "Salata", g: "mk-yemek-40524" },
    { id: "tatli", ad: "Tatlı", g: "mk-yemek-10424" },
    { id: "icecek", ad: "İçecek", g: "mk-yemek-43941" },
  ];
  function katAd(id) { for (var i = 0; i < KATEGORI.length; i++) if (KATEGORI[i].id === id) return KATEGORI[i].ad; return "Diğer"; }

  var S = function (ic) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ic + "</svg>"; };
  var IKON = {
    saat: S('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    kisi: S('<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
    kalp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z" stroke-linejoin="round"/></svg>',
    ara: S('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'),
    kapat: S('<path d="M6 6l12 12"/><path d="M18 6 6 18"/>'),
    geri: S('<path d="m15 5-7 7 7 7"/>'),
    zar: S('<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r=".9" fill="currentColor"/><circle cx="15" cy="15" r=".9" fill="currentColor"/><circle cx="15" cy="9" r=".9" fill="currentColor"/><circle cx="9" cy="15" r=".9" fill="currentColor"/><circle cx="12" cy="12" r=".9" fill="currentColor"/>'),
    izgara: S('<rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/>'),
    sepet: S('<path d="M4 9h16l-1.6 9.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8z"/><path d="m9 9 2-5"/><path d="m15 9-2-5"/>'),
    cop: S('<path d="M4.5 6.5h15"/><path d="M9.5 6.5V4.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.7"/><path d="M6.5 6.5l.8 12.6a1.6 1.6 0 0 0 1.6 1.4h6.2a1.6 1.6 0 0 0 1.6-1.4l.8-12.6"/>'),
    arti: S('<path d="M12 5v14"/><path d="M5 12h14"/>'),
    tik: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    tencere: S('<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2.5 10h19"/><path d="M9 6.5c0-1 .7-1.5 1.5-1.5h3c.8 0 1.5.5 1.5 1.5"/><path d="M12 5V3.5"/>'),
    kopyala: S('<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
    oynat: S('<path d="M8 5.5v13l10.5-6.5z"/>'),
    duraklat: S('<path d="M8.5 5.5v13"/><path d="M15.5 5.5v13"/>'),
  };
  var REYON = {
    manav: { ad: "Manav", renk: "#e2eed9", yazi: "#3b6a2a", ic: S('<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l8-8"/>') },
    kasap: { ad: "Kasap ve şarküteri", renk: "#fbe1da", yazi: "#a8321e", ic: S('<path d="M15 3.5a5.5 5.5 0 0 1 3.9 9.4c-1.8 1.8-4.4 2.2-6.3 1.5l-2.6 2.6a1.9 1.9 0 1 1-2.7 2.3 1.9 1.9 0 1 1-2.3-2.7l2.6-2.6c-.7-1.9-.3-4.5 1.5-6.3A5.5 5.5 0 0 1 15 3.5z"/>') },
    sut: { ad: "Süt ve kahvaltılık", renk: "#e3ecf7", yazi: "#2c5684", ic: S('<path d="M8 3h8v3l2 3v12H6V9l2-3z"/><path d="M6 9h12"/>') },
    kuru: { ad: "Kuru gıda ve bakliyat", renk: "#f6ead3", yazi: "#7d5413", ic: S('<rect x="6" y="8" width="12" height="13" rx="3"/><path d="M8 4h8v4H8z"/>') },
    baharat: { ad: "Baharat, yağ ve sos", renk: "#f3e2d9", yazi: "#8a3f1d", ic: S('<path d="M8 9h8l-1 12H9z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/>') },
    diger: { ad: "Diğer", renk: "#e9ebe6", yazi: "#4b544d", ic: S('<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>') },
  };
  var REYON_SIRA = ["manav", "kasap", "sut", "kuru", "baharat", "diger"];
  var REYON_ANAHTAR = {
    manav: ["domates", "biber", "soğan", "patates", "limon", "maydanoz", "elma", "muz", "salatalık", "sarımsak", "havuç", "kabak", "patlıcan", "nane", "dereotu", "portakal", "kivi", "mango", "marul", "roka", "ıspanak", "armut", "üzüm", "çilek", "mantar"],
    kasap: ["kıyma", "tavuk", "et", "köfte", "sucuk", "pastırma", "balık", "hindi", "kuşbaşı"],
    sut: ["süt", "yoğurt", "peynir", "kaşar", "tereyağı", "yumurta", "ayran", "kaymak", "zeytin", "krema"],
    kuru: ["un", "pirinç", "bulgur", "mercimek", "nohut", "fasulye", "makarna", "şeker", "çay", "kahve", "ceviz", "fındık", "bal", "lokum", "irmik", "yulaf"],
    baharat: ["tuz", "karabiber", "kimyon", "pul biber", "kekik", "salça", "sirke", "zeytinyağı", "yağ", "sumak", "tarçın"],
  };
  var BIRIMLER = ["adet", "g", "kg", "ml", "su bardağı", "çay bardağı", "yemek kaşığı", "tatlı kaşığı", "çay kaşığı", "diş", "demet", "dal", "dilim", "yaprak", "fincan", "küp", "tutam", "paket"];
  var KAPAKLAR = ["mk-yemek-372", "mk-yemek-44001", "mk-yemek-43925", "mk-yemek-26085", "mk-yemek-10434", "mk-yemek-10419", "mk-yemek-10428", "mk-yemek-43063", "mk-yemek-10420", "mk-yemek-3806", "mk-yemek-40524", "mk-yemek-42910"];

  /* ---------- Tarifler ---------- */
  function M(m, b, a, r, ev) { return { m: m, b: b, a: a, r: r, ev: !!ev }; }
  var TARIFLER = [
    { id: "izmir-kofte", ad: "İzmir Köfte", kat: "ana", g: "mk-yemek-3806", kisi: 4, haz: 25, pis: 40, zor: "Orta", kal: 520,
      ozet: "Patates, biber ve domatesle fırında pişen, salçalı sosuyla klasik bir Ege sofrası.",
      malz: [M(500, "g", "dana kıyma", "kasap"), M(1, "adet", "kuru soğan", "manav"), M(2, "dilim", "bayat ekmek", "diger"), M(1, "adet", "yumurta", "sut"), M(1, "çay kaşığı", "kimyon", "baharat"), M(1, "tatlı kaşığı", "tuz", "baharat"), M(4, "adet", "patates", "manav"), M(4, "adet", "sivri biber", "manav"), M(2, "adet", "domates", "manav"), M(1, "yemek kaşığı", "domates salçası", "baharat"), M(2, "su bardağı", "sıcak su", "diger", true)],
      adim: [{ t: "Soğanı rendeleyip suyunu süzün. Islatıp sıktığınız ekmek içi, kıyma, yumurta, kimyon ve tuzla birlikte iyice yoğurun." }, { t: "Harcı streç filmle kapatıp buzdolabında dinlendirin.", dk: 15 }, { t: "Patatesleri elma dilimi doğrayın. Köfteleri parmak şeklinde verip patateslerle birlikte tavada hafifçe kızartın." }, { t: "Fırın tepsisine köfte, patates, biber ve domates dilimlerini sırayla dizin." }, { t: "Salçayı sıcak suda eritip tepsinin üzerine gezdirin." }, { t: "Önceden ısıtılmış 200 derece fırında, üzeri kızarana kadar pişirin.", dk: 35 }] },
    { id: "domates-corbasi", ad: "Domates Çorbası", kat: "corba", g: "mk-yemek-40534", kisi: 4, haz: 10, pis: 25, zor: "Kolay", kal: 180,
      ozet: "Olgun domatesle kadifemsi, sütlü ve üzeri kaşar rendeli bir kış klasiği.",
      malz: [M(6, "adet", "olgun domates", "manav"), M(2, "yemek kaşığı", "tereyağı", "sut"), M(2, "yemek kaşığı", "un", "kuru"), M(1, "yemek kaşığı", "domates salçası", "baharat"), M(5, "su bardağı", "sıcak su", "diger", true), M(1, "su bardağı", "süt", "sut"), M(1, "tatlı kaşığı", "tuz", "baharat"), M(1, "su bardağı", "rendelenmiş kaşar", "sut")],
      adim: [{ t: "Domatesleri kabuklarıyla birlikte rendeleyin." }, { t: "Tereyağını tencerede eritin, unu ekleyip kokusu çıkana kadar kavurun.", dk: 3 }, { t: "Salçayı ve rendelenmiş domatesi ekleyip karıştırarak pişirin.", dk: 5 }, { t: "Sıcak suyu yavaş yavaş ekleyin. Kaynayınca kısık ateşte pişirin.", dk: 15 }, { t: "Sütü ekleyip çorbayı blenderdan geçirin, tuzunu ayarlayın." }, { t: "Kâselere paylaştırıp üzerine kaşar rendesi serperek sıcak servis edin." }] },
    { id: "coban-salata", ad: "Çoban Salata", kat: "salata", g: "mk-yemek-40524", kisi: 4, haz: 15, pis: 0, zor: "Kolay", kal: 110,
      ozet: "Bol limonlu, sumaklı soğanıyla her sofraya yakışan ferah bir salata.",
      malz: [M(4, "adet", "domates", "manav"), M(2, "adet", "salatalık", "manav"), M(2, "adet", "sivri biber", "manav"), M(1, "adet", "mor soğan", "manav"), M(0.5, "demet", "maydanoz", "manav"), M(3, "yemek kaşığı", "zeytinyağı", "baharat"), M(1, "adet", "limon", "manav"), M(1, "çay kaşığı", "sumak", "baharat"), M(1, "çay kaşığı", "tuz", "baharat")],
      adim: [{ t: "Domates, salatalık ve biberleri küçük küpler halinde doğrayın." }, { t: "Soğanı ince piyaz doğrayıp sumak ve tuzla ovun." }, { t: "Maydanozu ince ince kıyın." }, { t: "Hepsini geniş bir kapta birleştirin. Limon suyu ve zeytinyağını ekleyip servisten hemen önce karıştırın." }] },
    { id: "tavuk-sote", ad: "Tavuk Sote", kat: "ana", g: "mk-yemek-43063", kisi: 4, haz: 15, pis: 25, zor: "Kolay", kal: 340,
      ozet: "Biber ve domatesle yüksek ateşte sotelenen, yarım saatte hazır sulu bir tavuk yemeği.",
      malz: [M(600, "g", "tavuk göğsü", "kasap"), M(1, "adet", "kuru soğan", "manav"), M(2, "adet", "sivri biber", "manav"), M(1, "adet", "kapya biber", "manav"), M(2, "adet", "domates", "manav"), M(2, "diş", "sarımsak", "manav"), M(2, "yemek kaşığı", "zeytinyağı", "baharat"), M(1, "tatlı kaşığı", "biber salçası", "baharat"), M(1, "çay kaşığı", "kekik", "baharat"), M(1, "tatlı kaşığı", "tuz", "baharat"), M(null, "", "karabiber", "baharat")],
      adim: [{ t: "Tavuk göğsünü kuşbaşı doğrayın." }, { t: "Zeytinyağında tavukları yüksek ateşte, suyunu salıp çekene kadar soteleyin.", dk: 8 }, { t: "Doğranmış soğan ve sarımsağı ekleyip kavurun.", dk: 3 }, { t: "Biberleri ve salçayı ekleyin, birlikte çevirin.", dk: 4 }, { t: "Rendelenmiş domates, tuz, kekik ve karabiberi ekleyip kapağı kapalı kısık ateşte pişirin.", dk: 10 }, { t: "Pilav ya da bulgur pilavıyla sıcak servis edin." }] },
    { id: "firin-turlu", ad: "Zeytinyağlı Fırın Türlü", kat: "sebze", g: "mk-yemek-10420", kisi: 6, haz: 20, pis: 50, zor: "Kolay", kal: 210,
      ozet: "Mevsim sebzeleri zeytinyağı ve salçayla fırında ağır ağır pişer; ılık da soğuk da yenir.",
      malz: [M(2, "adet", "patlıcan", "manav"), M(2, "adet", "kabak", "manav"), M(3, "adet", "patates", "manav"), M(2, "adet", "havuç", "manav"), M(2, "adet", "dolmalık biber", "manav"), M(3, "adet", "domates", "manav"), M(2, "adet", "kuru soğan", "manav"), M(4, "diş", "sarımsak", "manav"), M(0.5, "su bardağı", "zeytinyağı", "baharat"), M(1, "yemek kaşığı", "domates salçası", "baharat"), M(1, "su bardağı", "sıcak su", "diger", true), M(2, "çay kaşığı", "tuz", "baharat"), M(1, "çay kaşığı", "pul biber", "baharat")],
      adim: [{ t: "Patlıcanları alacalı soyup küp doğrayın ve acısı çıksın diye tuzlu suda bekletin.", dk: 15 }, { t: "Diğer sebzeleri iri küpler halinde doğrayın." }, { t: "Salçayı sıcak su, zeytinyağı, tuz ve pul biberle çırpıp sos hazırlayın." }, { t: "Süzdüğünüz patlıcanla tüm sebzeleri geniş bir fırın kabında sosla harmanlayın." }, { t: "Üzerini folyoyla kapatıp 190 derece fırında pişirin.", dk: 35 }, { t: "Folyoyu açın ve üzeri hafifçe kızarana kadar pişirmeye devam edin.", dk: 15 }] },
    { id: "otlu-omlet", ad: "Otlu Peynirli Omlet", kat: "kahvalti", g: "mk-yemek-42910", kisi: 2, haz: 5, pis: 8, zor: "Kolay", kal: 260,
      ozet: "Dereotu, taze soğan ve beyaz peynirle on dakikada hazır, yumuşacık bir kahvaltı omleti.",
      malz: [M(4, "adet", "yumurta", "sut"), M(2, "yemek kaşığı", "süt", "sut"), M(0.5, "demet", "dereotu", "manav"), M(3, "dal", "taze soğan", "manav"), M(50, "g", "beyaz peynir", "sut"), M(1, "yemek kaşığı", "tereyağı", "sut"), M(1, "tutam", "tuz", "baharat"), M(null, "", "karabiber", "baharat")],
      adim: [{ t: "Yumurtaları süt ve tuzla köpürene kadar çırpın." }, { t: "Dereotu ve taze soğanı ince kıyıp ezdiğiniz peynirle karıştırın." }, { t: "Tereyağını tavada eritin, yumurtayı dökün ve kısık ateşte pişirin.", dk: 3 }, { t: "Otlu peyniri bir yarısına serpiştirin, omleti ikiye katlayıp pişirin.", dk: 1 }, { t: "Karabiber serpip sıcak servis edin." }] },
    { id: "meyve-salatasi", ad: "Portakal Soslu Meyve Salatası", kat: "tatli", g: "mk-yemek-10424", kisi: 4, haz: 15, pis: 0, zor: "Kolay", kal: 150,
      ozet: "Taze portakal suyu ve balla tatlanan, cevizli ve naneli hafif bir tatlı.",
      malz: [M(2, "adet", "muz", "manav"), M(2, "adet", "kivi", "manav"), M(1, "adet", "mango", "manav"), M(1, "adet", "elma", "manav"), M(2, "adet", "portakal", "manav"), M(1, "yemek kaşığı", "bal", "kuru"), M(2, "yemek kaşığı", "ceviz içi", "kuru"), M(6, "yaprak", "taze nane", "manav")],
      adim: [{ t: "Portakalların suyunu sıkın ve balla karıştırarak sosu hazırlayın." }, { t: "Meyveleri soyup küp doğrayın. Elmayı kararmaması için hemen sosa ekleyin." }, { t: "Tüm meyveleri sosla nazikçe harmanlayın." }, { t: "Buzdolabında dinlendirin.", dk: 20 }, { t: "Ceviz içi ve taze naneyle süsleyip servis edin." }] },
    { id: "turk-kahvesi", ad: "Türk Kahvesi", kat: "icecek", g: "mk-yemek-43941", kisi: 2, haz: 2, pis: 4, zor: "Kolay", kal: 10,
      ozet: "Bol köpüklü, cezvede kısık ateşte pişen; yanında su ve lokumla gelenek.",
      malz: [M(2, "tatlı kaşığı", "Türk kahvesi", "kuru"), M(2, "fincan", "soğuk su", "diger", true), M(2, "küp", "şeker", "kuru"), M(2, "adet", "lokum", "kuru")],
      adim: [{ t: "Cezveye her fincan için bir fincan soğuk su ve bir tepeleme tatlı kaşığı kahve koyun." }, { t: "İsteğe göre şekeri ekleyip ateşe koymadan iyice karıştırın." }, { t: "Kısık ateşte, kaynatmadan pişirin. Köpük kabarmaya başlayınca ocaktan alın.", dk: 3 }, { t: "Köpüğü fincanlara paylaştırın, kalanını bir kez daha ısıtıp yavaşça doldurun." }, { t: "Yanında bir bardak su ve lokumla servis edin." }] },
  ];

  /* ---------- Yardımcılar ---------- */
  function $(s, k) { return (k || document).querySelector(s); }
  function $$(s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); }
  function kacis(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function kucuk(t) { return String(t).toLocaleLowerCase("tr"); }
  function sayi(n) { return Math.round(n).toLocaleString("tr-TR"); }
  function sureYaz(dk) { if (dk < 60) return dk + " dk"; var s = Math.floor(dk / 60), d = dk % 60; return s + " sa" + (d ? " " + d + " dk" : ""); }
  function ikiHane(n) { return (n < 10 ? "0" : "") + n; }
  function saniyeYaz(sn) { sn = Math.max(0, Math.ceil(sn)); return ikiHane(Math.floor(sn / 60)) + ":" + ikiHane(sn % 60); }
  var KESIR = [[0, ""], [0.25, "¼"], [1 / 3, "⅓"], [0.5, "½"], [2 / 3, "⅔"], [0.75, "¾"], [1, ""]];
  function miktarYaz(m, b) {
    if (m == null) return "Kararınca";
    if (b === "g" || b === "ml") {
      var v = m >= 100 ? Math.round(m / 10) * 10 : Math.max(5, Math.round(m / 5) * 5);
      if (v >= 1000) return (v / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 2 }) + (b === "g" ? " kg" : " litre");
      return v.toLocaleString("tr-TR") + " " + b;
    }
    if (b === "kg") return (Math.round(m * 100) / 100).toLocaleString("tr-TR") + " kg";
    var tam = Math.floor(m), k = m - tam, en = KESIR[0];
    KESIR.forEach(function (x) { if (Math.abs(x[0] - k) < Math.abs(en[0] - k)) en = x; });
    if (en[0] === 1) { tam += 1; en = KESIR[0]; }
    var s = (tam ? String(tam) : "") + en[1];
    return (s || "¼") + (b ? " " + b : "");
  }
  function gunAdi(d) { return d.toLocaleDateString("tr-TR", { weekday: "long" }); }
  function ogun() { var s = new Date().getHours(); return s < 11 ? "kahvaltı" : s < 16 ? "öğle yemeği" : s < 22 ? "akşam yemeği" : "gece atıştırması"; }
  function oncesi(t) {
    var fark = (Date.now() - t) / 60000;
    if (fark < 60) return Math.max(1, Math.round(fark)) + " dk önce";
    if (fark < 1440) return Math.round(fark / 60) + " saat önce";
    var g = Math.round(fark / 1440); return g === 1 ? "Dün" : g + " gün önce";
  }
  function yeniId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ---------- Veri ---------- */
  var ANAHTAR = "mutfak-v1";
  function ornekVeri() {
    var simdi = Date.now();
    return {
      surum: 1,
      fav: ["izmir-kofte", "turk-kahvesi", "domates-corbasi"],
      ozel: [],
      pisirilen: [{ id: "turk-kahvesi", t: simdi - 5 * 3600000 }, { id: "tavuk-sote", t: simdi - 2 * 86400000 }, { id: "coban-salata", t: simdi - 4 * 86400000 }],
      liste: [
        { id: "l1", a: "tavuk göğsü", m: 600, b: "g", r: "kasap", k: ["Tavuk Sote"], al: false },
        { id: "l2", a: "kapya biber", m: 1, b: "adet", r: "manav", k: ["Tavuk Sote"], al: false },
        { id: "l3", a: "sivri biber", m: 2, b: "adet", r: "manav", k: ["Tavuk Sote"], al: false },
        { id: "l4", a: "domates", m: 2, b: "adet", r: "manav", k: ["Tavuk Sote"], al: true },
        { id: "l5", a: "köy ekmeği", m: 1, b: "adet", r: "diger", k: [], al: false },
        { id: "l6", a: "süzme yoğurt", m: 1, b: "kg", r: "sut", k: [], al: false },
        { id: "l7", a: "demlik poşet çay", m: 1, b: "paket", r: "kuru", k: [], al: true },
      ],
    };
  }
  var V;
  try { V = JSON.parse(localStorage.getItem(ANAHTAR) || "null"); } catch (e) { V = null; }
  if (!V || V.surum !== 1) V = ornekVeri();
  function kaydet() { try { localStorage.setItem(ANAHTAR, JSON.stringify(V)); } catch (e) { /* depolama dolu */ } }
  kaydet();

  function tumTarifler() { return V.ozel.concat(TARIFLER); }
  function tarifBul(id) { var l = tumTarifler(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function favMi(id) { return V.fav.indexOf(id) >= 0; }
  function ozelMi(t) { return t.id.indexOf("ozel-") === 0; }
  function toplamSure(t) { return (+t.haz || 0) + (+t.pis || 0); }

  /* ---------- Durum ---------- */
  var E = $("#ekran"), detay = $("#detay"), pisir = $("#pisir");
  var durum = { sekme: "kesfet", kat: "tumu", arama: "", sira: "onerilen", detay: null, kisi: 4, evde: {}, adim: 0, duzenlenen: null, oncekiOdak: null };
  var sayac = null; // { tarif, adim, toplam, bitis, kalan, duruyor, bitti }

  /* ---------- Kartlar ---------- */
  function kartHTML(t) {
    var f = favMi(t.id);
    return '<article class="tarif-kart"><button type="button" class="ac" data-ac="' + t.id + '" aria-label="' + kacis(t.ad) + ' tarifini aç">'
      + '<span class="gorsel" style="display:block"><img src="' + gorsel(t.g) + '" alt="" loading="lazy" /><span class="sure">' + IKON.saat + sureYaz(toplamSure(t)) + "</span>"
      + (ozelMi(t) ? '<span class="senin">Senin tarifin</span>' : "") + "</span>"
      + '<span class="kart-baslik">' + kacis(t.ad) + '</span><span class="alt">' + kacis(t.zor) + " · " + t.kisi + " kişilik</span></button>"
      + kalpHTML(t, f, "kalp") + "</article>";
  }
  function kalpHTML(t, f, sinif) {
    return '<button type="button" class="' + sinif + '" data-fav="' + t.id + '" aria-pressed="' + f + '" aria-label="' + kacis(t.ad) + (f ? " favorilerden çıkar" : " favorilere ekle") + '">' + IKON.kalp + "</button>";
  }
  function bosHTML(baslik, metin, dugmeler, gorseller) {
    return '<div class="bos"><div class="yelpaze" aria-hidden="true">' + (gorseller || ["mk-yemek-40524", "mk-yemek-3806", "mk-yemek-10424"]).map(function (g) { return '<img src="' + gorsel(g) + '" alt="" />'; }).join("") + "</div>"
      + "<h2>" + baslik + "</h2><p>" + metin + '</p><div class="bos-dugmeler">' + dugmeler + "</div></div>";
  }

  /* ---------- Keşfet ---------- */
  function gununTarifi() {
    if (ogun() === "kahvaltı") return tarifBul("otlu-omlet");
    var aday = ["firin-turlu", "izmir-kofte", "tavuk-sote", "domates-corbasi"];
    var bas = new Date(new Date().getFullYear(), 0, 0), gun = Math.floor((new Date() - bas) / 86400000);
    return tarifBul(aday[gun % aday.length]);
  }
  function filtreli() {
    var q = kucuk(durum.arama.trim());
    var l = tumTarifler().filter(function (t) {
      if (durum.kat !== "tumu" && t.kat !== durum.kat) return false;
      if (!q) return true;
      var metin = kucuk(t.ad + " " + t.ozet + " " + t.malz.map(function (m) { return m.a; }).join(" "));
      return q.split(/\\s+/).every(function (p) { return metin.indexOf(p) >= 0; });
    });
    if (durum.sira === "sure") l.sort(function (a, b) { return toplamSure(a) - toplamSure(b); });
    if (durum.sira === "kalori") l.sort(function (a, b) { return (a.kal || 0) - (b.kal || 0); });
    return l;
  }
  var ekranlar = {};
  ekranlar.kesfet = function () {
    var gun = gunAdi(new Date());
    return '<div class="marka-satir"><span class="marka">' + IKON.tencere + 'Mutfak</span><button type="button" class="yuvarlak-dugme" id="rastgele" aria-label="Bana rastgele bir tarif öner" title="Rastgele tarif">' + IKON.zar + "</button></div>"
      + '<header class="ust"><div><p class="ust-ust">' + kacis(gun.charAt(0).toLocaleUpperCase("tr") + gun.slice(1)) + ", " + ogun() + " vakti</p>"
      + "<h1>Bugün ne <em>pişirsek?</em></h1></div></header>"
      + '<div class="arama" role="search">' + IKON.ara + '<input id="aramaKutu" type="search" placeholder="Tarif ya da malzeme ara" aria-label="Tarif ya da malzeme ara" autocomplete="off" value="' + kacis(durum.arama) + '" />'
      + '<button type="button" class="temizle" id="aramaTemizle" aria-label="Aramayı temizle"' + (durum.arama ? "" : " hidden") + ">" + IKON.kapat + "</button></div>"
      + '<div class="cipler" role="group" aria-label="Kategoriler">' + KATEGORI.map(function (k) {
        return '<button type="button" class="cip" data-kat="' + k.id + '" aria-pressed="' + (durum.kat === k.id) + '">' + (k.g ? '<img src="' + gorsel(k.g) + '" alt="" />' : '<span class="cip-ikon">' + IKON.izgara + "</span>") + k.ad + "</button>";
      }).join("") + "</div>"
      + '<div id="kesfetIcerik"></div>';
  };
  function kesfetIcerik() {
    var kutu = $("#kesfetIcerik"); if (!kutu) return;
    var l = filtreli(), aramaVar = !!durum.arama.trim(), html = "", mansetVar = !aramaVar && durum.kat === "tumu";
    if (mansetVar) {
      var g = gununTarifi();
      l = l.filter(function (x) { return x.id !== g.id; });
      html += '<div class="bolum-baslik"><h2>Günün tarifi</h2><span>' + kacis(ogun().charAt(0).toLocaleUpperCase("tr") + ogun().slice(1)) + " için</span></div>"
        + '<div style="position:relative"><button type="button" class="manset" data-ac="' + g.id + '" aria-label="Günün tarifi: ' + kacis(g.ad) + '"><img src="' + gorsel(g.g) + '" alt="" />'
        + '<span class="manset-yazi"><span class="etiket">' + katAd(g.kat) + '</span><span class="baslik">' + kacis(g.ad) + "</span>"
        + '<span class="meta"><span>' + IKON.saat + sureYaz(toplamSure(g)) + '</span><span>' + IKON.kisi + g.kisi + " kişilik</span><span>" + g.zor + "</span><span>" + g.kal + " kcal</span></span></span></button>"
        + kalpHTML(g, favMi(g.id), "kalp") + "</div>";
    }
    var baslik = aramaVar ? "Arama sonuçları" : mansetVar ? "Diğer tarifler" : katAd(durum.kat);
    html += '<div class="bolum-baslik"><h2>' + baslik + ' <span style="font-family:var(--yazi);font-size:14px;color:var(--soluk);font-weight:600">' + l.length + "</span></h2>"
      + '<label class="gizli" for="siraSec">Sırala</label><select id="siraSec" class="sirala"><option value="onerilen"' + (durum.sira === "onerilen" ? " selected" : "") + '>Önerilen</option><option value="sure"' + (durum.sira === "sure" ? " selected" : "") + '>En kısa süre</option><option value="kalori"' + (durum.sira === "kalori" ? " selected" : "") + ">En az kalori</option></select></div>";
    html += l.length ? '<div class="izgara">' + l.map(kartHTML).join("") + "</div>"
      : bosHTML("Bu aramaya uyan tarif yok", "Başka bir malzeme dene ya da aradığın tarifi kendin ekle.", '<button type="button" class="dugme ikincil" id="aramaSifirla">Aramayı temizle</button><button type="button" class="dugme" data-git="ekle">Tarif ekle</button>');
    kutu.innerHTML = html;
  }

  /* ---------- Favoriler ---------- */
  ekranlar.favoriler = function () {
    var l = V.fav.map(tarifBul).filter(Boolean);
    var son = V.pisirilen.slice().sort(function (a, b) { return b.t - a.t; }).filter(function (p) { return tarifBul(p.id); }).slice(0, 4);
    var html = '<header class="ust"><div><p class="ust-ust">Kaydettiklerin</p><h1>Favorilerin</h1></div></header>';
    html += l.length ? '<div class="bolum-baslik"><h2>' + l.length + " tarif</h2><span>Kalbe dokunarak çıkarabilirsin</span></div><div class=\\"izgara\\">" + l.map(kartHTML).join("") + "</div>"
      : bosHTML("Henüz favorin yok", "Beğendiğin tariflerdeki kalbe dokun, hepsi burada toplansın.", '<button type="button" class="dugme" data-git="kesfet">Tariflere göz at</button>', ["mk-yemek-43941", "mk-yemek-42910", "mk-yemek-40534"]);
    if (son.length) {
      html += '<div class="bolum-baslik"><h2>Son pişirdiklerin</h2></div><ul class="urunler">' + son.map(function (p) {
        var t = tarifBul(p.id);
        return '<li><button type="button" data-ac="' + t.id + '" style="flex:1;display:flex;align-items:center;gap:12px;min-height:64px;padding:8px 12px;border:0;background:none;text-align:left;color:inherit"><img src="' + gorsel(t.g) + '" alt="" style="width:48px;height:48px;border-radius:14px;object-fit:cover" /><span class="govde"><b>' + kacis(t.ad) + "</b><small>" + katAd(t.kat) + " · " + oncesi(p.t) + '</small></span><span style="color:var(--soluk-2)">' + IKON.geri.replace("m15 5-7 7 7 7", "m9 5 7 7-7 7") + "</span></button></li>";
      }).join("") + "</ul>";
    }
    return html;
  };

  /* ---------- Alışveriş listesi ---------- */
  function listeSayaci() {
    var n = V.liste.filter(function (x) { return !x.al; }).length, r = $("#listeSayi");
    r.textContent = n; r.hidden = n === 0;
    r.setAttribute("aria-label", n + " alınacak malzeme");
  }
  function urunHTML(x) {
    var mik = x.m == null ? "" : miktarYaz(x.m, x.b);
    return '<li class="' + (x.al ? "alindi" : "") + '"><label><input type="checkbox" data-al="' + x.id + '"' + (x.al ? " checked" : "") + ' /><span class="tik">' + IKON.tik + '</span><span class="govde"><b>' + kacis(x.a.charAt(0).toLocaleUpperCase("tr") + x.a.slice(1)) + "</b>"
      + (x.k && x.k.length ? "<small>" + kacis(x.k.join(", ")) + "</small>" : "") + '</span><span class="mik">' + kacis(mik) + "</span></label>"
      + '<button type="button" class="sil-dugme" data-urunsil="' + x.id + '" aria-label="' + kacis(x.a) + ' öğesini sil">' + IKON.cop + "</button></li>";
  }
  ekranlar.liste = function () {
    var kalan = V.liste.filter(function (x) { return !x.al; }), alinan = V.liste.filter(function (x) { return x.al; });
    var tarifSayi = {}; kalan.forEach(function (x) { (x.k || []).forEach(function (k) { tarifSayi[k] = 1; }); });
    var oran = V.liste.length ? alinan.length / V.liste.length : 0, cevre = 2 * Math.PI * 22;
    var html = '<header class="ust"><div><p class="ust-ust">Market için</p><h1>Alışveriş listesi</h1></div></header>';
    if (V.liste.length) {
      html += '<div class="liste-ozet"><span class="halka-kucuk"><svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="22" stroke="rgba(255,255,255,.18)"/><circle cx="26" cy="26" r="22" stroke="#e9a23b" stroke-linecap="round" stroke-dasharray="' + cevre.toFixed(1) + '" stroke-dashoffset="' + (cevre * (1 - oran)).toFixed(1) + '"/></svg></span>'
        + '<span class="govde"><b>' + (kalan.length ? kalan.length + " malzeme alınacak" : "Hepsi sepette") + "</b><span>" + alinan.length + " / " + V.liste.length + " alındı" + (Object.keys(tarifSayi).length ? " · " + Object.keys(tarifSayi).length + " tarif için" : "") + "</span></span></div>";
    }
    html += '<form class="ekle-kutu" id="urunFormu" autocomplete="off"><label class="gizli" for="urunKutu">Listeye ekle</label><input id="urunKutu" placeholder="Örneğin 2 kg domates" maxlength="60" enterkeyhint="done" /><button type="submit" class="dugme" aria-label="Listeye ekle">' + IKON.arti + "</button></form>";
    if (!V.liste.length) {
      return html + bosHTML("Listen boş", "Bir tarifin malzemelerini tek dokunuşla buraya ekleyebilir ya da yukarıdan kendin yazabilirsin.", '<button type="button" class="dugme" data-git="kesfet">Tarif seç</button>', ["mk-yemek-10420", "mk-yemek-10419", "mk-yemek-10434"]);
    }
    REYON_SIRA.forEach(function (r) {
      var l = kalan.filter(function (x) { return (x.r || "diger") === r; });
      if (!l.length) return;
      var R = REYON[r];
      html += '<section class="reyon"><h3><i style="background:' + R.renk + ";color:" + R.yazi + '">' + R.ic + "</i>" + R.ad + '</h3><ul class="urunler">' + l.map(urunHTML).join("") + "</ul></section>";
    });
    if (alinan.length) html += '<section class="reyon"><h3><i style="background:#dfe8dc;color:#2d4a36">' + IKON.sepet + "</i>Sepette</h3><ul class=\\"urunler\\">" + alinan.map(urunHTML).join("") + "</ul></section>";
    html += '<div class="liste-eylem"><button type="button" class="dugme ikincil" id="alinanlariSil"' + (alinan.length ? "" : " disabled") + ">" + IKON.cop + 'Alınanları sil</button><button type="button" class="dugme ikincil" id="listeKopyala">' + IKON.kopyala + "Kopyala</button></div>";
    return html;
  };
  function reyonTahmin(ad) {
    var a = kucuk(ad);
    for (var i = 0; i < REYON_SIRA.length; i++) {
      var kel = REYON_ANAHTAR[REYON_SIRA[i]] || [];
      for (var j = 0; j < kel.length; j++) if (new RegExp("(^|\\\\s)" + kel[j]).test(a)) return REYON_SIRA[i];
    }
    return "diger";
  }
  function listeyeEkle(a, m, b, r, kaynak) {
    if (/kaşığı|tutam|bardağı|fincan/.test(b || "") && (r === "baharat" || r === "kuru" || r === "sut" && m != null && /kaşığı/.test(b))) { m = null; b = ""; }
    if (m != null && /^(adet|demet|dal|küp|paket)$/.test(b)) m = Math.ceil(m - 0.001);
    var var_ = null;
    V.liste.forEach(function (x) { if (!x.al && kucuk(x.a) === kucuk(a) && x.b === b) var_ = x; });
    if (var_) {
      if (m != null) var_.m = (var_.m || 0) + m;
      if (kaynak && var_.k.indexOf(kaynak) < 0) var_.k.push(kaynak);
    } else V.liste.push({ id: yeniId(), a: a, m: m, b: b, r: r || reyonTahmin(a), k: kaynak ? [kaynak] : [], al: false });
  }

  /* ---------- Ekle formu ---------- */
  function bosTarif() { return { ad: "", ozet: "", kat: "ana", g: KAPAKLAR[0], kisi: 4, haz: 15, pis: 30, zor: "Kolay", kal: "", malz: [M(null, "adet", "", ""), M(null, "adet", "", ""), M(null, "adet", "", "")], adim: [{ t: "" }, { t: "" }] }; }
  function malzSatir(m, i) {
    return '<div class="malz-satir"><input class="kutu" inputmode="decimal" name="mm" placeholder="Miktar" aria-label="' + (i + 1) + '. malzeme miktarı" value="' + (m.m == null ? "" : String(m.m).replace(".", ",")) + '" />'
      + '<select class="kutu" name="mb" aria-label="' + (i + 1) + '. malzeme birimi">' + BIRIMLER.map(function (b) { return '<option value="' + b + '"' + (m.b === b ? " selected" : "") + ">" + b + "</option>"; }).join("") + "</select>"
      + '<input class="kutu" name="ma" placeholder="Malzeme" aria-label="' + (i + 1) + '. malzeme adı" value="' + kacis(m.a) + '" maxlength="40" />'
      + '<button type="button" class="sil-dugme" data-satirsil aria-label="Malzemeyi kaldır">' + IKON.cop + "</button></div>";
  }
  function adimSatir(a, i) {
    return '<div class="adim-satir"><span class="no">' + (i + 1) + '</span><div class="ic"><textarea class="kutu" name="at" rows="2" placeholder="Bu adımda ne yapılıyor?" aria-label="' + (i + 1) + '. adım">' + kacis(a.t) + "</textarea>"
      + '<label class="sure-kutu">Zamanlayıcı<input class="kutu" name="ad" inputmode="numeric" placeholder="Yok" value="' + (a.dk || "") + '" aria-label="' + (i + 1) + '. adım süresi, dakika" />dakika</label></div>'
      + '<button type="button" class="sil-dugme" data-satirsil aria-label="Adımı kaldır">' + IKON.cop + "</button></div>";
  }
  ekranlar.ekle = function () {
    var t = durum.duzenlenen ? tarifBul(durum.duzenlenen) : null, d = t || bosTarif();
    return '<header class="ust"><div><p class="ust-ust">' + (t ? "Değişiklikleri kaydetmeyi unutma" : "Defterine yeni bir sayfa") + "</p><h1>" + (t ? "Tarifi düzenle" : "Kendi tarifin") + "</h1></div>"
      + (t ? '<button type="button" class="yuvarlak-dugme" id="duzenlemeIptal" aria-label="Düzenlemeyi bırak">' + IKON.kapat + "</button>" : "") + "</header>"
      + '<form class="form" id="tarifFormu" novalidate>'
      + '<div class="alan"><span class="etiket-yazi">Kapak fotoğrafı</span><div class="kapak-sec" role="radiogroup" aria-label="Kapak fotoğrafı">' + KAPAKLAR.map(function (g, i) {
        return '<label><input type="radio" name="kapak" value="' + g + '"' + (d.g === g ? " checked" : "") + ' aria-label="' + (i + 1) + '. kapak" /><img src="' + gorsel(g) + '" alt="" loading="lazy" /></label>';
      }).join("") + "</div></div>"
      + '<div class="alan"><label for="fAd">Tarif adı</label><input class="kutu" id="fAd" maxlength="50" placeholder="Örneğin Fırında Sütlaç" value="' + kacis(d.ad) + '" /></div>'
      + '<div class="alan"><label for="fOzet">Kısa açıklama</label><textarea class="kutu" id="fOzet" maxlength="160" placeholder="Tarifi bir cümleyle anlat">' + kacis(d.ozet) + "</textarea></div>"
      + '<div class="alan"><span class="etiket-yazi">Kategori</span><div class="cip-sec" role="group" aria-label="Kategori">' + KATEGORI.slice(1).map(function (k) { return '<button type="button" class="cip" data-fkat="' + k.id + '" aria-pressed="' + (d.kat === k.id) + '">' + k.ad + "</button>"; }).join("") + "</div></div>"
      + '<div class="iki-sutun alan"><div><label for="fHaz" style="display:block;font-weight:700;font-size:14px;margin:0 2px 6px">Hazırlık (dk)</label><input class="kutu" id="fHaz" inputmode="numeric" value="' + d.haz + '" /></div><div><label for="fPis" style="display:block;font-weight:700;font-size:14px;margin:0 2px 6px">Pişirme (dk)</label><input class="kutu" id="fPis" inputmode="numeric" value="' + d.pis + '" /></div></div>'
      + '<div class="iki-sutun alan"><div><span class="etiket-yazi" style="display:block;font-weight:700;font-size:14px;margin:0 2px 6px">Kaç kişilik</span><div class="kisi" style="display:flex;justify-content:space-between"><button type="button" data-fkisi="-1" aria-label="Kişi sayısını azalt">−</button><output id="fKisi">' + d.kisi + '</output><button type="button" data-fkisi="1" aria-label="Kişi sayısını artır">+</button></div></div>'
      + '<div><label for="fKal" style="display:block;font-weight:700;font-size:14px;margin:0 2px 6px">Kalori (porsiyon)</label><input class="kutu" id="fKal" inputmode="numeric" placeholder="İsteğe bağlı" value="' + (d.kal || "") + '" /></div></div>'
      + '<div class="alan"><span class="etiket-yazi">Zorluk</span><div class="segment" role="group" aria-label="Zorluk">' + ["Kolay", "Orta", "Zor"].map(function (z) { return '<button type="button" data-fzor="' + z + '" aria-pressed="' + (d.zor === z) + '">' + z + "</button>"; }).join("") + "</div></div>"
      + '<div class="alan"><span class="etiket-yazi">Malzemeler</span><div class="satir-liste" id="malzListe">' + d.malz.map(malzSatir).join("") + '</div><button type="button" class="ekle-baglanti" id="malzEkle">' + IKON.arti + "Malzeme ekle</button></div>"
      + '<div class="alan"><span class="etiket-yazi">Hazırlanışı</span><small class="ipucu" style="margin:-2px 2px 10px">Süre yazdığın adımlarda pişirirken zamanlayıcı çıkar.</small><div class="satir-liste" id="adimListe">' + d.adim.map(adimSatir).join("") + '</div><button type="button" class="ekle-baglanti" id="adimEkle">' + IKON.arti + "Adım ekle</button></div>"
      + '<div class="form-alt"><button type="submit" class="dugme vurgu tam" style="min-height:54px;font-size:16px">' + (t ? "Değişiklikleri kaydet" : "Tarifi kaydet") + "</button>"
      + (t ? "" : '<button type="button" class="dugme ikincil tam" id="formTemizle">Formu temizle</button>') + "</div></form>";
  };
  function adimNumarala() { $$("#adimListe .adim-satir .no").forEach(function (n, i) { n.textContent = i + 1; }); }
  function formOku() {
    var f = $("#tarifFormu"), hatalar = [];
    $$(".hata-yazi", f).forEach(function (h) { h.remove(); });
    $$(".hatali", f).forEach(function (h) { h.classList.remove("hatali"); });
    function hata(el, metin) { el.classList.add("hatali"); var p = document.createElement("p"); p.className = "hata-yazi"; p.textContent = metin; (el.closest(".alan") || el.parentNode).appendChild(p); hatalar.push(el); }
    var ad = $("#fAd").value.trim();
    if (ad.length < 3) hata($("#fAd"), "Tarife en az 3 harfli bir ad ver.");
    var malz = $$("#malzListe .malz-satir").map(function (s) {
      var mm = s.querySelector("[name=mm]").value.trim().replace(",", "."), n = parseFloat(mm);
      return { m: mm && !isNaN(n) && n > 0 ? n : null, b: s.querySelector("[name=mb]").value, a: s.querySelector("[name=ma]").value.trim(), r: "" };
    }).filter(function (m) { return m.a; }).map(function (m) { m.r = reyonTahmin(m.a); if (m.m == null) m.b = ""; return M(m.m, m.b, m.a, m.r); });
    if (!malz.length) hata($("#malzListe [name=ma]") || $("#malzEkle"), "En az bir malzeme yaz.");
    var adim = $$("#adimListe .adim-satir").map(function (s) {
      var dk = parseInt(s.querySelector("[name=ad]").value, 10);
      return { t: s.querySelector("[name=at]").value.trim(), dk: dk > 0 && dk <= 600 ? dk : undefined };
    }).filter(function (a) { return a.t; });
    if (!adim.length) hata($("#adimListe [name=at]") || $("#adimEkle"), "En az bir adım yaz.");
    if (hatalar.length) { hatalar[0].focus(); hatalar[0].scrollIntoView({ block: "center", behavior: "smooth" }); return null; }
    var secKat = $("[data-fkat][aria-pressed=true]"), secZor = $("[data-fzor][aria-pressed=true]"), kap = $("input[name=kapak]:checked");
    var haz = Math.min(600, Math.max(0, parseInt($("#fHaz").value, 10) || 0)), pis = Math.min(1440, Math.max(0, parseInt($("#fPis").value, 10) || 0));
    var kal = parseInt($("#fKal").value, 10);
    return {
      ad: ad, ozet: $("#fOzet").value.trim() || "Kendi tarif defterimden.", kat: secKat ? secKat.getAttribute("data-fkat") : "ana",
      g: kap ? kap.value : KAPAKLAR[0], kisi: +$("#fKisi").textContent || 4, haz: haz, pis: pis, zor: secZor ? secZor.getAttribute("data-fzor") : "Kolay",
      kal: kal > 0 ? kal : 0, malz: malz, adim: adim,
    };
  }

  /* ---------- Sekmeler ---------- */
  function goster(sekme, yerinde) {
    if (sekme !== durum.sekme) { $("#tost").classList.remove("acik"); if (sekme !== "ekle") durum.duzenlenen = null; }
    durum.sekme = sekme;
    $$(".sekmeler button").forEach(function (b) {
      var s = b.getAttribute("data-sekme") === sekme;
      b.classList.toggle("secili", s);
      if (s) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    E.innerHTML = ekranlar[sekme]();
    E.style.animation = "none"; void E.offsetWidth; E.style.animation = "";
    if (sekme === "kesfet") kesfetIcerik();
    if (!yerinde) window.scrollTo(0, 0);
    listeSayaci();
  }
  $$(".sekmeler button").forEach(function (b) { b.addEventListener("click", function () { goster(b.getAttribute("data-sekme")); }); });
  function yenile() {
    if (durum.sekme === "kesfet") kesfetIcerik();
    else { var y = window.scrollY; E.innerHTML = ekranlar[durum.sekme](); window.scrollTo(0, y); }
    listeSayaci();
  }

  /* ---------- Favori ---------- */
  function favDegistir(id, dugme) {
    var t = tarifBul(id); if (!t) return;
    var i = V.fav.indexOf(id);
    if (i >= 0) V.fav.splice(i, 1); else V.fav.unshift(id);
    kaydet();
    var f = favMi(id);
    $$('[data-fav="' + id + '"]').forEach(function (b) {
      b.setAttribute("aria-pressed", f);
      b.setAttribute("aria-label", t.ad + (f ? " favorilerden çıkar" : " favorilere ekle"));
      if (f) { b.classList.remove("atti"); void b.offsetWidth; b.classList.add("atti"); }
    });
    tost(f ? "Favorilere eklendi" : "Favorilerden çıkarıldı", f ? null : "Geri al", f ? null : function () { favDegistir(id); });
    if (durum.sekme === "favoriler" && dugme && E.contains(dugme)) yenile();
  }

  /* ---------- Detay ---------- */
  function olcek(t) { return durum.kisi / t.kisi; }
  function malzMiktar(m, t) { return m.m == null ? null : m.m * olcek(t); }
  function detayHTML(t) {
    var f = favMi(t.id);
    return '<div class="detay-ic"><div class="detay-gorsel"><img src="' + gorsel(t.g) + '" alt="' + kacis(t.ad) + '" /></div>'
      + '<div class="detay-ust"><button type="button" class="cam-dugme" data-geri aria-label="Geri dön">' + IKON.geri + '</button><div class="sag">'
      + '<button type="button" class="cam-dugme" data-fav="' + t.id + '" aria-pressed="' + f + '" aria-label="' + kacis(t.ad) + (f ? " favorilerden çıkar" : " favorilere ekle") + '">' + IKON.kalp.replace("<path", '<path stroke="currentColor" stroke-width="1.9"') + "</button></div></div>"
      + '<div class="detay-govde"><span class="kat">' + katAd(t.kat) + (ozelMi(t) ? " · Senin tarifin" : "") + "</span><h1>" + kacis(t.ad) + '</h1><p class="ozet-yazi">' + kacis(t.ozet) + "</p>"
      + '<dl class="olcu"><div><dt>Hazırlık</dt><dd>' + sureYaz(t.haz) + "</dd></div><div><dt>Pişirme</dt><dd>" + (t.pis ? sureYaz(t.pis) : "Yok") + "</dd></div><div><dt>Zorluk</dt><dd>" + kacis(t.zor) + "</dd></div><div><dt>Porsiyon</dt><dd>" + (t.kal ? t.kal + " kcal" : "Belirsiz") + "</dd></div></dl>"
      + '<section class="bolum"><header><h2>Malzemeler</h2><div class="kisi" role="group" aria-label="Kişi sayısı"><button type="button" data-kisi="-1" aria-label="Kişi sayısını azalt"' + (durum.kisi <= 1 ? " disabled" : "") + '>−</button><output id="kisiYazi" aria-live="polite">' + durum.kisi + ' kişilik</output><button type="button" data-kisi="1" aria-label="Kişi sayısını artır"' + (durum.kisi >= 20 ? " disabled" : "") + ">+</button></div></header>"
      + '<p style="margin:-4px 2px 10px;color:var(--soluk);font-size:13.5px">Evde olanları işaretle; kalanlar alışveriş listene eklenir.</p>'
      + '<ul class="malzemeler" id="malzemeler">' + malzListeHTML(t) + "</ul>"
      + '<div class="liste-ekle-satir"><button type="button" class="dugme ikincil" id="listeyeEkle">' + IKON.sepet + "<span></span></button></div></section>"
      + '<section class="bolum"><header><h2>Hazırlanışı</h2><span style="color:var(--soluk);font-weight:600;font-size:13.5px">' + t.adim.length + " adım</span></header><ol class=\\"adimlar\\">" + t.adim.map(function (a, i) {
        return "<li><div><p>" + kacis(a.t) + "</p>" + (a.dk ? '<button type="button" class="zaman-cip" data-zaman="' + i + '">' + IKON.saat + "<span>" + a.dk + " dakikalık zamanlayıcı</span></button>" : "") + "</div></li>";
      }).join("") + "</ol></section>"
      + (ozelMi(t) ? '<div class="sahip-satir"><button type="button" class="dugme ikincil" data-duzenle="' + t.id + '">Düzenle</button><button type="button" class="dugme tehlike" data-tarifsil="' + t.id + '">Tarifi sil</button></div>' : "")
      + "</div></div>"
      + '<div class="detay-alt"><button type="button" class="dugme" data-pisir>' + IKON.oynat + "Adım adım pişir</button></div>";
  }
  function malzListeHTML(t) {
    return t.malz.map(function (m, i) {
      var mik = miktarYaz(malzMiktar(m, t), m.b);
      return '<li><label><input type="checkbox" data-evde="' + i + '"' + (durum.evde[i] ? " checked" : "") + ' /><span class="tik">' + IKON.tik + '</span><span class="ad">' + kacis(m.a.charAt(0).toLocaleUpperCase("tr") + m.a.slice(1)) + "" + '</span><span class="miktar">' + kacis(mik) + "</span></label></li>";
    }).join("");
  }
  function listeDugmesiGuncelle(t) {
    var n = t.malz.filter(function (m, i) { return !m.ev && !durum.evde[i]; }).length, b = $("#listeyeEkle");
    if (!b) return;
    b.querySelector("span").textContent = n ? "Eksik " + n + " malzemeyi listeye ekle" : "Hepsi evde, listeye eklenecek yok";
    b.disabled = n === 0;
  }
  function detayAc(id, odak) {
    var t = tarifBul(id); if (!t) return;
    durum.oncekiOdak = odak || document.activeElement;
    durum.detay = id; durum.kisi = t.kisi; durum.evde = {};
    t.malz.forEach(function (m, i) { if (m.ev) durum.evde[i] = true; });
    detay.innerHTML = detayHTML(t);
    detay.hidden = false; detay.scrollTop = 0;
    document.body.classList.add("kilit", "detay-acik");
    listeDugmesiGuncelle(t); zamanCipleri();
    var g = $("[data-geri]", detay); if (g) g.focus({ preventScroll: true });
  }
  function detayKapat() {
    detay.hidden = true; detay.innerHTML = ""; durum.detay = null;
    document.body.classList.remove("kilit", "detay-acik");
    yenile();
    if (durum.oncekiOdak && document.contains(durum.oncekiOdak)) durum.oncekiOdak.focus({ preventScroll: true });
  }
  function kisiDegistir(d) {
    var t = tarifBul(durum.detay); if (!t) return;
    durum.kisi = Math.max(1, Math.min(20, durum.kisi + d));
    $("#kisiYazi").textContent = durum.kisi + " kişilik";
    $('[data-kisi="-1"]', detay).disabled = durum.kisi <= 1;
    $('[data-kisi="1"]', detay).disabled = durum.kisi >= 20;
    $$("#malzemeler .miktar").forEach(function (el, i) {
      var m = t.malz[i], y = miktarYaz(malzMiktar(m, t), m.b);
      if (el.textContent !== y) { el.textContent = y; el.classList.remove("degisti"); void el.offsetWidth; el.classList.add("degisti"); }
    });
  }
  function eksikleriEkle() {
    var t = tarifBul(durum.detay); if (!t) return;
    var n = 0;
    t.malz.forEach(function (m, i) { if (m.ev || durum.evde[i]) return; listeyeEkle(m.a, malzMiktar(m, t), m.b, m.r, t.ad); n++; });
    kaydet(); listeSayaci();
    tost(n + " malzeme listeye eklendi", "Listeye git", function () { detayKapat(); goster("liste"); });
  }

  /* ---------- Pişirme modu ---------- */
  var CEVRE = 2 * Math.PI * 52;
  function adimMalzemeleri(t, metin) {
    var k = kucuk(metin);
    return t.malz.filter(function (m) {
      return kucuk(m.a).split(/\\s+/).some(function (p) { return p.length >= 3 && k.indexOf(p.length > 5 ? p.slice(0, p.length - 1) : p) >= 0; });
    });
  }
  function pisirHTML(t) {
    var n = t.adim.length, i = durum.adim;
    var ust = '<div class="pisir-ust"><div><b>' + kacis(t.ad) + "</b><span>" + durum.kisi + " kişilik · " + sureYaz(toplamSure(t)) + '</span></div><button type="button" class="cam-dugme" data-pisirkapat aria-label="Pişirme modunu kapat">' + IKON.kapat + "</button></div>"
      + '<div class="ilerleme" aria-hidden="true">' + t.adim.map(function (a, j) { return '<i class="' + (j <= i ? "dolu" : "") + '"></i>'; }).join("") + "</div>";
    if (i >= n) {
      var f = favMi(t.id);
      return '<div class="pisir-ic">' + ust + '<div class="pisir-govde"><div class="bitti"><img src="' + gorsel(t.g) + '" alt="" /><h2>Afiyet olsun!</h2><p>' + kacis(t.ad) + " hazır. Pişirdiklerin arasına eklendi.</p></div></div>"
        + '<div class="pisir-alt"><button type="button" class="dugme ikincil" data-onceki>Son adıma dön</button>' + (f ? '<button type="button" class="dugme ana" data-pisirkapat>Tarife dön</button>' : '<button type="button" class="dugme ana" data-pisirfav>Favorilere ekle</button>') + "</div></div>";
    }
    var a = t.adim[i], malz = adimMalzemeleri(t, a.t);
    var html = '<div class="pisir-ic">' + ust + '<div class="pisir-govde" aria-live="polite"><span class="adim-no">Adım ' + (i + 1) + " / " + n + '</span><p class="adim-metin">' + kacis(a.t) + "</p>"
      + (malz.length ? '<div class="pisir-malz">' + malz.map(function (m) { return "<span>" + kacis((m.m == null ? "" : miktarYaz(malzMiktar(m, t), m.b) + " ") + m.a) + "</span>"; }).join("") + "</div>" : "");
    if (a.dk) {
      html += '<div class="halka-kap"><div class="halka"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="iz" cx="60" cy="60" r="52"/><circle class="dolgu" id="halkaDolgu" cx="60" cy="60" r="52" stroke-dasharray="' + CEVRE.toFixed(1) + '" stroke-dashoffset="0"/></svg><output id="halkaYazi">' + saniyeYaz(a.dk * 60) + "</output></div>"
        + '<div class="halka-dugmeler"><button type="button" class="dugme" id="sayacDugme"></button><button type="button" class="dugme ikincil" id="sayacSifirla">Sıfırla</button></div></div>';
    }
    html += i < n - 1 ? '<div class="siradaki"><span>Sıradaki</span><p>' + kacis(t.adim[i + 1].t) + "</p></div>" : '<div class="siradaki"><span>Son adım</span><p>Bitir dediğinde tarif pişirdiklerine eklenir.</p></div>';
    html += '</div><div class="pisir-alt"><button type="button" class="dugme ikincil" data-onceki' + (i === 0 ? " disabled" : "") + '>Önceki</button><button type="button" class="dugme ana" data-sonraki>' + (i === n - 1 ? "Bitir" : "Sonraki adım") + "</button></div></div>";
    return html;
  }
  function pisirCiz() {
    var t = tarifBul(durum.detay); if (!t) return;
    if (durum.adim >= t.adim.length) {
      V.pisirilen = V.pisirilen.filter(function (p) { return p.id !== t.id; });
      V.pisirilen.unshift({ id: t.id, t: Date.now() }); V.pisirilen = V.pisirilen.slice(0, 12); kaydet();
    }
    pisir.innerHTML = pisirHTML(t);
    sayacCiz();
    var s = $("[data-sonraki]", pisir) || $("[data-pisirkapat]", pisir); if (s) s.focus({ preventScroll: true });
  }
  function pisirAc() {
    $("#tost").classList.remove("acik");
    durum.adim = 0; pisir.hidden = false; document.body.classList.add("pisir-acik");
    var t = tarifBul(durum.detay);
    if (sayac && t && sayac.tarif === t.id && !sayac.bitti) durum.adim = sayac.adim;
    pisirCiz();
  }
  function pisirKapat() { pisir.hidden = true; pisir.innerHTML = ""; document.body.classList.remove("pisir-acik"); var p = $("[data-pisir]", detay); if (p) p.focus({ preventScroll: true }); zamanCipleri(); }

  /* ---------- Zamanlayıcı ---------- */
  var sesBag = null;
  function bip() {
    try {
      if (!sesBag) return;
      [0, 0.32, 0.64].forEach(function (g) {
        var o = sesBag.createOscillator(), k = sesBag.createGain(), s = sesBag.currentTime + g;
        o.type = "sine"; o.frequency.value = 880; o.connect(k); k.connect(sesBag.destination);
        k.gain.setValueAtTime(0.0001, s); k.gain.exponentialRampToValueAtTime(0.22, s + 0.02); k.gain.exponentialRampToValueAtTime(0.0001, s + 0.24);
        o.start(s); o.stop(s + 0.26);
      });
    } catch (e) { /* ses yok */ }
  }
  function sesHazirla() {
    try { if (!sesBag) { var A = window.AudioContext || window.webkitAudioContext; if (A) sesBag = new A(); } if (sesBag && sesBag.state === "suspended") sesBag.resume(); } catch (e) { sesBag = null; }
  }
  function kalanSn() { if (!sayac) return 0; return sayac.duruyor ? sayac.kalan : (sayac.bitis - Date.now()) / 1000; }
  function sayacBaslat(tarifId, adim) {
    var t = tarifBul(tarifId), a = t && t.adim[adim]; if (!a || !a.dk) return;
    sesHazirla();
    if (sayac && sayac.tarif === tarifId && sayac.adim === adim && !sayac.bitti) {
      if (sayac.duruyor) { sayac.bitis = Date.now() + sayac.kalan * 1000; sayac.duruyor = false; }
      else { sayac.kalan = kalanSn(); sayac.duruyor = true; }
    } else {
      sayac = { tarif: tarifId, ad: t.ad, adim: adim, toplam: a.dk * 60, bitis: Date.now() + a.dk * 60000, kalan: a.dk * 60, duruyor: false, bitti: false };
    }
    sayacCiz();
  }
  function sayacSifirla() { sayac = null; sayacCiz(); }
  function sayacCiz() {
    var hap = $("#sayac");
    document.body.classList.toggle("sayac-var", !!sayac);
    if (!sayac) { hap.hidden = true; hap.classList.remove("bitti-hap"); hap.removeAttribute("data-durum"); }
    else {
      var k = kalanSn();
      if (!sayac.bitti && !sayac.duruyor && k <= 0) {
        sayac.bitti = true; bip();
        try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) { /* titreşim yok */ }
        if (!pisir.hidden) tost(sayac.ad + ", " + (sayac.adim + 1) + ". adımın süresi doldu");
      }
      hap.hidden = false;
      hap.classList.toggle("bitti-hap", sayac.bitti);
      var metin = sayac.bitti ? "Süre doldu" : sayac.duruyor ? "Duraklatıldı" : "";
      var yeni = '<i class="nokta"></i><span>' + kacis(sayac.ad) + "</span><time>" + (metin || saniyeYaz(k)) + "</time>"
        + '<button type="button" data-hap="' + (sayac.bitti ? "tamam" : "ac") + '">' + (sayac.bitti ? "Tamam" : "Aç") + "</button>";
      var anahtar = (sayac.bitti ? "b" : sayac.duruyor ? "d" : "c") + sayac.tarif + sayac.adim;
      if (hap.getAttribute("data-durum") !== anahtar || !hap.firstChild) { hap.innerHTML = yeni; hap.setAttribute("data-durum", anahtar); }
      else hap.querySelector("time").textContent = metin || saniyeYaz(k);
    }
    // Pişirme ekranındaki halka
    var t = durum.detay && tarifBul(durum.detay), dugme = $("#sayacDugme");
    if (dugme && t) {
      var a = t.adim[durum.adim], buAdim = sayac && sayac.tarif === t.id && sayac.adim === durum.adim;
      var kalan = buAdim ? Math.max(0, kalanSn()) : a.dk * 60, toplam = a.dk * 60;
      $("#halkaYazi").textContent = buAdim && sayac.bitti ? "Bitti" : saniyeYaz(kalan);
      $("#halkaDolgu").setAttribute("stroke-dashoffset", (CEVRE * (1 - kalan / toplam)).toFixed(1));
      var yazi = !buAdim ? "Zamanlayıcıyı başlat" : sayac.bitti ? "Yeniden başlat" : sayac.duruyor ? "Devam et" : "Duraklat";
      if (dugme.textContent !== yazi) dugme.innerHTML = (buAdim && !sayac.duruyor && !sayac.bitti ? IKON.duraklat : IKON.oynat) + yazi;
    }
    zamanCipleri();
  }
  function zamanCipleri() {
    $$(".zaman-cip", detay).forEach(function (c) {
      var i = +c.getAttribute("data-zaman"), t = tarifBul(durum.detay); if (!t) return;
      var bu = sayac && sayac.tarif === t.id && sayac.adim === i && !sayac.bitti;
      c.classList.toggle("calisiyor", !!bu);
      var y = bu ? (sayac.duruyor ? "Duraklatıldı " : "Kalan ") + saniyeYaz(kalanSn()) : t.adim[i].dk + " dakikalık zamanlayıcı";
      var sp = c.querySelector("span"); if (sp.textContent !== y) sp.textContent = y;
    });
  }
  setInterval(function () { if (sayac && !sayac.bitti) sayacCiz(); }, 250);

  /* ---------- Tost ---------- */
  var tostZaman;
  function tost(metin, eylem, fn) {
    var t = $("#tost");
    t.innerHTML = "<span></span>"; t.firstChild.textContent = metin;
    t.classList.toggle("eylemli", !!eylem);
    if (eylem) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = eylem;
      b.addEventListener("click", function () { t.classList.remove("acik"); fn(); });
      t.appendChild(b);
    }
    t.classList.add("acik");
    clearTimeout(tostZaman); tostZaman = setTimeout(function () { t.classList.remove("acik"); }, eylem ? 4500 : 2600);
  }

  /* ---------- Olaylar ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target;
    var fv = t.closest("[data-fav]"); if (fv) { e.preventDefault(); favDegistir(fv.getAttribute("data-fav"), fv); return; }
    var ac = t.closest("[data-ac]"); if (ac) { detayAc(ac.getAttribute("data-ac"), ac); return; }
    var git = t.closest("[data-git]"); if (git) { goster(git.getAttribute("data-git")); return; }
    var hp = t.closest("[data-hap]");
    if (hp) {
      if (hp.getAttribute("data-hap") === "tamam") { sayacSifirla(); return; }
      if (sayac) { if (durum.detay !== sayac.tarif) detayAc(sayac.tarif); durum.adim = sayac.adim; pisir.hidden = false; document.body.classList.add("pisir-acik"); pisirCiz(); }
      return;
    }
    if (t.closest("#rastgele")) { var l = tumTarifler(); detayAc(l[Math.floor(Math.random() * l.length)].id, t.closest("#rastgele")); return; }
  });
  E.addEventListener("click", function (e) {
    var t = e.target;
    var kt = t.closest("[data-kat]"); if (kt) { durum.kat = kt.getAttribute("data-kat"); $$("[data-kat]", E).forEach(function (x) { x.setAttribute("aria-pressed", x === kt); }); kesfetIcerik(); return; }
    if (t.closest("#aramaTemizle") || t.closest("#aramaSifirla")) { durum.arama = ""; durum.kat = "tumu"; goster("kesfet", true); $("#aramaKutu").focus(); return; }
    var us = t.closest("[data-urunsil]");
    if (us) {
      var id = us.getAttribute("data-urunsil"), idx = -1, eski = null;
      V.liste.forEach(function (x, i) { if (x.id === id) { idx = i; eski = x; } });
      if (idx < 0) return;
      V.liste.splice(idx, 1); kaydet(); yenile();
      tost(eski.a.charAt(0).toLocaleUpperCase("tr") + eski.a.slice(1) + " silindi", "Geri al", function () { V.liste.splice(idx, 0, eski); kaydet(); yenile(); });
      return;
    }
    if (t.closest("#alinanlariSil")) {
      var yedek = V.liste.slice(), n = V.liste.filter(function (x) { return x.al; }).length;
      V.liste = V.liste.filter(function (x) { return !x.al; }); kaydet(); yenile();
      tost(n + " öğe silindi", "Geri al", function () { V.liste = yedek; kaydet(); yenile(); });
      return;
    }
    if (t.closest("#listeKopyala")) {
      var metin = "Alışveriş listesi\\n" + REYON_SIRA.map(function (r) {
        var l2 = V.liste.filter(function (x) { return !x.al && (x.r || "diger") === r; });
        return l2.length ? "\\n" + REYON[r].ad + "\\n" + l2.map(function (x) { return "- " + x.a + (x.m != null ? " (" + miktarYaz(x.m, x.b) + ")" : ""); }).join("\\n") : "";
      }).join("");
      var ta = document.createElement("textarea"); ta.value = metin; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand("copy"); } catch (x) { ok = false; }
      ta.remove();
      tost(ok ? "Liste panoya kopyalandı" : "Kopyalanamadı, metni elle seçebilirsin");
      return;
    }
    // Form
    var fk = t.closest("[data-fkat]"); if (fk) { $$("[data-fkat]", E).forEach(function (x) { x.setAttribute("aria-pressed", x === fk); }); return; }
    var fz = t.closest("[data-fzor]"); if (fz) { $$("[data-fzor]", E).forEach(function (x) { x.setAttribute("aria-pressed", x === fz); }); return; }
    var fks = t.closest("[data-fkisi]"); if (fks) { var o = $("#fKisi"); o.textContent = Math.max(1, Math.min(20, +o.textContent + +fks.getAttribute("data-fkisi"))); return; }
    if (t.closest("#malzEkle")) { var ml = $("#malzListe"), n2 = ml.children.length; ml.insertAdjacentHTML("beforeend", malzSatir(M(null, "adet", "", ""), n2)); ml.lastElementChild.querySelector("[name=ma]").focus(); return; }
    if (t.closest("#adimEkle")) { var al = $("#adimListe"), n3 = al.children.length; al.insertAdjacentHTML("beforeend", adimSatir({ t: "" }, n3)); al.lastElementChild.querySelector("textarea").focus(); return; }
    var ss = t.closest("[data-satirsil]");
    if (ss) {
      var satir = ss.closest(".malz-satir, .adim-satir"), liste = satir.parentNode;
      if (liste.children.length <= 1) { $$("input, textarea", satir).forEach(function (x) { x.value = ""; }); return; }
      satir.remove(); adimNumarala(); return;
    }
    if (t.closest("#formTemizle")) { goster("ekle", true); tost("Form temizlendi"); return; }
    if (t.closest("#duzenlemeIptal")) { var dz = durum.duzenlenen; durum.duzenlenen = null; goster("kesfet"); if (dz) detayAc(dz); return; }
  });
  E.addEventListener("input", function (e) {
    if (e.target.id === "aramaKutu") {
      durum.arama = e.target.value;
      $("#aramaTemizle").hidden = !durum.arama;
      kesfetIcerik();
    }
    if (e.target.classList.contains("hatali")) { e.target.classList.remove("hatali"); var h = e.target.closest(".alan") && e.target.closest(".alan").querySelector(".hata-yazi"); if (h) h.remove(); }
  });
  E.addEventListener("change", function (e) {
    var t = e.target;
    if (t.id === "siraSec") { durum.sira = t.value; kesfetIcerik(); $("#siraSec").focus(); }
    if (t.hasAttribute("data-al")) {
      var id = t.getAttribute("data-al");
      V.liste.forEach(function (x) { if (x.id === id) x.al = t.checked; });
      kaydet(); setTimeout(yenile, 220);
    }
  });
  E.addEventListener("submit", function (e) {
    e.preventDefault();
    if (e.target.id === "urunFormu") {
      var k = $("#urunKutu"), v = k.value.trim(); if (!v) { k.focus(); return; }
      var m = v.match(/^(\\d+(?:[.,]\\d+)?)\\s*(kg|g|gr|gram|adet|litre|lt|l|ml|paket|demet|kutu|şişe)?\\s+(.+)$/i), ad = v, mik = null, b = "";
      if (m) {
        mik = parseFloat(m[1].replace(",", ".")); ad = m[3];
        var bb = kucuk(m[2] || "adet"); b = bb === "gr" || bb === "gram" ? "g" : bb === "lt" || bb === "l" || bb === "litre" ? "ml" : bb;
        if (b === "ml" && /^(lt|l|litre)$/i.test(m[2] || "")) mik = mik * 1000;
      }
      listeyeEkle(ad, mik, b, null, null); kaydet(); yenile();
      var yeni = $("#urunKutu"); if (yeni) yeni.focus();
      tost(ad.charAt(0).toLocaleUpperCase("tr") + ad.slice(1) + " listeye eklendi");
      return;
    }
    if (e.target.id === "tarifFormu") {
      var veri = formOku(); if (!veri) return;
      var id2;
      if (durum.duzenlenen) {
        id2 = durum.duzenlenen;
        V.ozel = V.ozel.map(function (x) { if (x.id === id2) { veri.id = id2; return veri; } return x; });
        tost("Değişiklikler kaydedildi");
      } else {
        id2 = "ozel-" + yeniId(); veri.id = id2; V.ozel.unshift(veri);
        tost("Tarifin deftere eklendi");
      }
      kaydet(); durum.duzenlenen = null; durum.kat = "tumu"; durum.arama = "";
      goster("kesfet"); detayAc(id2);
    }
  });

  detay.addEventListener("click", function (e) {
    var t = e.target;
    if (t.closest("[data-geri]")) { detayKapat(); return; }
    var k = t.closest("[data-kisi]"); if (k) { kisiDegistir(+k.getAttribute("data-kisi")); return; }
    if (t.closest("#listeyeEkle")) { eksikleriEkle(); return; }
    if (t.closest("[data-pisir]")) { pisirAc(); return; }
    var z = t.closest("[data-zaman]"); if (z) { sayacBaslat(durum.detay, +z.getAttribute("data-zaman")); return; }
    var dz = t.closest("[data-duzenle]"); if (dz) { durum.duzenlenen = dz.getAttribute("data-duzenle"); detay.hidden = true; detay.innerHTML = ""; durum.detay = null; document.body.classList.remove("kilit", "detay-acik"); goster("ekle"); durum.duzenlenen = dz.getAttribute("data-duzenle"); E.innerHTML = ekranlar.ekle(); return; }
    var ts = t.closest("[data-tarifsil]");
    if (ts) {
      var id = ts.getAttribute("data-tarifsil"), yedek = V.ozel.slice(), favYedek = V.fav.slice();
      V.ozel = V.ozel.filter(function (x) { return x.id !== id; }); V.fav = V.fav.filter(function (x) { return x !== id; });
      if (sayac && sayac.tarif === id) sayacSifirla();
      kaydet(); detayKapat();
      tost("Tarif silindi", "Geri al", function () { V.ozel = yedek; V.fav = favYedek; kaydet(); yenile(); });
    }
  });
  detay.addEventListener("change", function (e) {
    var t = e.target;
    if (t.hasAttribute("data-evde")) { durum.evde[+t.getAttribute("data-evde")] = t.checked; listeDugmesiGuncelle(tarifBul(durum.detay)); }
  });
  pisir.addEventListener("click", function (e) {
    var t = e.target, tr = tarifBul(durum.detay); if (!tr) return;
    if (t.closest("[data-pisirkapat]")) { pisirKapat(); return; }
    if (t.closest("[data-pisirfav]")) { favDegistir(tr.id); pisirCiz(); return; }
    if (t.closest("[data-onceki]")) { durum.adim = Math.max(0, durum.adim - 1); pisirCiz(); return; }
    if (t.closest("[data-sonraki]")) { durum.adim = Math.min(tr.adim.length, durum.adim + 1); pisirCiz(); return; }
    if (t.closest("#sayacDugme")) {
      if (sayac && sayac.tarif === tr.id && sayac.adim === durum.adim && sayac.bitti) sayac = null;
      sayacBaslat(tr.id, durum.adim); return;
    }
    if (t.closest("#sayacSifirla")) { if (sayac && sayac.tarif === tr.id && sayac.adim === durum.adim) sayacSifirla(); else sayacCiz(); }
  });
  document.addEventListener("keydown", function (e) {
    if (!pisir.hidden) {
      if (e.key === "Escape") { pisirKapat(); return; }
      if (e.key === "ArrowRight") { var s = $("[data-sonraki]", pisir); if (s) s.click(); }
      if (e.key === "ArrowLeft") { var o = $("[data-onceki]", pisir); if (o && !o.disabled) o.click(); }
      return;
    }
    if (!detay.hidden && e.key === "Escape") detayKapat();
  });

  goster("kesfet");
})();
`,
  },
};
