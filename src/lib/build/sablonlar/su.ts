/* Şablon: Damla · Su Takibi — mobil uygulama (PWA): dalgalı bardak, hızlı ekleme, kişisel hedef, hatırlatmalar, haftalık geçmiş ve seri rozetleri. Veriler cihazda saklanır. */

export const SU_TAKIP = {
  id: "su-takip",
  ad: "Damla · Su Takibi",
  tur: "mobil" as const,
  aciklama: "Dolan bardak, kişisel hedef, hatırlatmalar ve seri rozetleriyle su takibi",
  kapak: "/gercek/build/sablon/su-takip.webp",
  dosyalar: {
    "index.html": `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#06204a" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="description" content="Damla: günlük su içme takibi, kişisel hedef, hatırlatmalar ve seri rozetleri." />
  <title>Damla · Su Takibi</title>
  <link rel="manifest" href="manifest.webmanifest" />
  <link rel="icon" href="ikon.svg" />
  <link rel="apple-touch-icon" href="ikon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <div class="arka" aria-hidden="true"></div>
  <div id="bildirim" class="bildirim" role="alert" hidden></div>
  <main id="ekran" tabindex="-1"></main>

  <nav class="sekmeler" aria-label="Ana menü">
    <button type="button" data-sekme="bugun" class="secili" aria-current="page">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2c3.2 3.9 6 7.4 6 10.6a6 6 0 0 1-12 0c0-3.2 2.8-6.7 6-10.6z"/><path d="M9.2 14.6a2.9 2.9 0 0 0 2.6 2.6"/></svg>
      <span>Bugün</span>
    </button>
    <button type="button" data-sekme="gecmis">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V11"/><path d="M10 20V5"/><path d="M15 20v-6"/><path d="M20 20V8"/></svg>
      <span>Geçmiş</span>
    </button>
    <button type="button" data-sekme="ayarlar">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/><path d="M4 17h2"/><path d="M10 17h10"/><circle cx="8" cy="17" r="2"/></svg>
      <span>Ayarlar</span>
    </button>
  </nav>

  <div id="perde" class="perde" hidden></div>
  <section id="sayfa" class="alt-sayfa" role="dialog" aria-modal="true" aria-labelledby="sayfaBaslik" hidden></section>
  <div id="tost" class="tost" role="status" aria-live="polite"></div>

  <script src="app.js"></script>
</body>
</html>
`,
    "manifest.webmanifest": `{
  "name": "Damla · Su Takibi",
  "short_name": "Damla",
  "description": "Günlük su içme takibi, kişisel hedef, hatırlatmalar ve seri rozetleri.",
  "lang": "tr",
  "start_url": "index.html",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#041633",
  "theme_color": "#06204a",
  "icons": [
    { "src": "ikon.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "any" },
    { "src": "ikon.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "maskable" }
  ]
}
`,
    "ikon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="z" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f4ba3"/><stop offset="1" stop-color="#041633"/></linearGradient><linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ff0ff"/><stop offset="1" stop-color="#2a7cff"/></linearGradient><clipPath id="k"><path d="M256 92c62 72 118 136 118 196a118 118 0 0 1-236 0c0-60 56-124 118-196z"/></clipPath></defs><rect width="512" height="512" rx="112" fill="url(#z)"/><path d="M256 92c62 72 118 136 118 196a118 118 0 0 1-236 0c0-60 56-124 118-196z" fill="rgba(255,255,255,0.08)"/><g clip-path="url(#k)"><path d="M120 270q34-22 68 0t68 0 68 0 68 0V420H120z" fill="url(#d)"/></g><path d="M256 92c62 72 118 136 118 196a118 118 0 0 1-236 0c0-60 56-124 118-196z" fill="none" stroke="#dff6ff" stroke-width="14" stroke-linejoin="round"/><path d="M196 300a62 62 0 0 0 52 54" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" opacity=".85"/></svg>
`,
    "stil.css": `:root {
  --gece: #041633;
  --derin: #072558;
  --metin: #eef6ff;
  --soluk: #a3b9da;
  --soluk-2: #8199bd;
  --su: #52dcff;
  --su-2: #2a7cff;
  --nane: #62f0c6;
  --amber: #ffbe72;
  --kart: rgba(255, 255, 255, 0.055);
  --kart-2: rgba(255, 255, 255, 0.09);
  --cizgi: rgba(255, 255, 255, 0.1);
  --cizgi-2: rgba(255, 255, 255, 0.16);
  --tehlike: #ff8a8a;
  --yazi: "Manrope", system-ui, -apple-system, "Segoe UI", sans-serif;
  --baslik: "Outfit", "Manrope", system-ui, sans-serif;
  --egri: cubic-bezier(0.22, 1, 0.36, 1);
}

* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
[hidden] { display: none !important; }
html { background: var(--gece); }
body {
  margin: 0;
  min-height: 100vh;
  min-height: 100dvh;
  color: var(--metin);
  font-family: var(--yazi);
  font-size: 15px;
  line-height: 1.45;
  background: var(--gece);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
.arka {
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(120% 60% at 50% -8%, #0f4ba3 0%, rgba(15, 75, 163, 0) 62%),
    radial-gradient(80% 50% at 100% 100%, rgba(32, 168, 214, 0.22) 0%, rgba(32, 168, 214, 0) 70%),
    linear-gradient(180deg, var(--derin) 0%, var(--gece) 72%);
}
button, input, select { font: inherit; color: inherit; }
button { cursor: pointer; }
:focus-visible { outline: 2px solid var(--su); outline-offset: 2px; border-radius: 12px; }
h1, h2, h3 { font-family: var(--baslik); font-weight: 600; margin: 0; letter-spacing: -0.02em; }

#ekran {
  max-width: 560px;
  margin: 0 auto;
  padding: calc(env(safe-area-inset-top) + 22px) 20px calc(env(safe-area-inset-bottom) + 116px);
  outline: none;
  animation: belir 0.45s var(--egri);
}
@keyframes belir { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

/* Üst satır */
.ust { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.tarih { margin: 0; color: var(--soluk); font-size: 13.5px; font-weight: 500; }
.ust h1 { font-size: 28px; margin-top: 2px; }
.seri-hap {
  display: inline-flex; align-items: center; gap: 6px;
  min-height: 40px; padding: 0 14px 0 10px;
  border-radius: 999px; border: 1px solid rgba(255, 190, 114, 0.28);
  background: rgba(255, 190, 114, 0.1); color: #ffd9a8;
  font-weight: 700; font-size: 14px; white-space: nowrap;
}
.seri-hap svg { width: 20px; height: 20px; }

/* Bardak */
.sahne { position: relative; display: grid; place-items: center; margin: 14px 0 6px; }
.sahne::before {
  content: ""; position: absolute; width: 300px; height: 300px; border-radius: 50%;
  background: radial-gradient(circle, rgba(82, 220, 255, 0.22) 0%, rgba(82, 220, 255, 0) 68%);
  top: 50%; left: 50%; transform: translate(-50%, -50%);
  transition: opacity 0.6s;
}
.bardak-kap { position: relative; width: 236px; height: 300px; }
.bardak { width: 100%; height: 100%; display: block; overflow: visible; }
.seviye { transition: transform 1.2s var(--egri); }
.dalga-1 { animation: akis 4.2s linear infinite; }
.dalga-2 { animation: akis-ters 6.5s linear infinite; }
@keyframes akis { from { transform: translateX(0); } to { transform: translateX(-120px); } }
@keyframes akis-ters { from { transform: translateX(-120px); } to { transform: translateX(0); } }
.kabarcik { animation: kabar 5s ease-in infinite; opacity: 0; }
.kabarcik:nth-of-type(2) { animation-delay: 1.4s; animation-duration: 6s; }
.kabarcik:nth-of-type(3) { animation-delay: 2.6s; animation-duration: 4.4s; }
.kabarcik:nth-of-type(4) { animation-delay: 3.5s; animation-duration: 5.4s; }
@keyframes kabar { 0% { transform: translateY(40px); opacity: 0; } 15% { opacity: 0.8; } 80% { opacity: 0.5; } 100% { transform: translateY(-150px); opacity: 0; } }
.olcek text { fill: var(--soluk); font: 600 11px var(--yazi); }
.olcek line { stroke: rgba(255, 255, 255, 0.55); stroke-width: 2; stroke-linecap: round; }

.sayac { display: flex; align-items: baseline; justify-content: center; gap: 8px; margin-top: 4px; }
.sayac .miktar { font: 700 50px/1 var(--baslik); letter-spacing: -0.04em; font-variant-numeric: tabular-nums; }
.sayac .bolu { font: 500 18px var(--baslik); color: var(--soluk); }
.hedef-satir { text-align: center; color: var(--soluk); font-size: 14.5px; margin: 8px 0 18px; }
.hedef-satir b { color: var(--metin); font-weight: 700; }
.hedef-satir .tamam { color: var(--nane); font-weight: 700; }

/* Hızlı ekleme */
.hizli { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.hizli button {
  min-height: 92px; border-radius: 22px; border: 1px solid var(--cizgi);
  background: var(--kart); display: grid; justify-items: center; align-content: center; gap: 4px;
  padding: 10px 4px; transition: transform 0.18s var(--egri), background 0.2s, border-color 0.2s;
}
.hizli button:hover { background: var(--kart-2); border-color: var(--cizgi-2); }
.hizli button:active { transform: scale(0.95); }
.hizli svg { width: 30px; height: 30px; }
.hizli b { font: 600 15px var(--baslik); }
.hizli span { font-size: 11.5px; color: var(--soluk); font-weight: 600; }
.hizli .ozel { background: linear-gradient(160deg, rgba(82, 220, 255, 0.2), rgba(42, 124, 255, 0.16)); border-color: rgba(82, 220, 255, 0.35); }

/* Kartlar */
.kart {
  border-radius: 22px; border: 1px solid var(--cizgi); background: var(--kart);
  padding: 16px; margin-top: 12px;
}
.kart-satir { display: flex; align-items: center; gap: 12px; }
.hatirlatma-kart { width: 100%; text-align: left; color: inherit; padding: 12px 8px 12px 12px; transition: background 0.2s, border-color 0.2s; }
.hatirlatma-kart:hover { background: var(--kart-2); border-color: var(--cizgi-2); }
.simge-kutu {
  flex: none; width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center;
  background: rgba(82, 220, 255, 0.12); color: var(--su);
}
.simge-kutu svg { width: 22px; height: 22px; }
.kart-satir .govde { flex: 1; min-width: 0; }
.kart-satir .govde b { display: block; font-weight: 700; font-size: 15px; }
.kart-satir .govde span { display: block; color: var(--soluk); font-size: 13px; }
.ok-dugme {
  flex: none; min-width: 44px; min-height: 44px; border-radius: 14px; border: 0; background: transparent;
  color: var(--soluk); display: grid; place-items: center;
}
.ok-dugme svg { width: 20px; height: 20px; }
.ok-dugme:hover { color: var(--metin); background: var(--kart); }

.bolum-baslik { display: flex; align-items: baseline; justify-content: space-between; margin: 26px 2px 10px; }
.bolum-baslik h2 { font-size: 19px; }
.bolum-baslik span { color: var(--soluk); font-size: 13px; font-weight: 600; }

/* Kayıt listesi */
.kayitlar { list-style: none; margin: 0; padding: 0; border-radius: 22px; border: 1px solid var(--cizgi); background: var(--kart); overflow: hidden; }
.kayitlar li { display: flex; align-items: center; gap: 12px; padding: 8px 8px 8px 14px; min-height: 60px; }
.kayitlar li + li { border-top: 1px solid rgba(255, 255, 255, 0.06); }
.kayitlar li.yeni { animation: kayit-gir 0.5s var(--egri); }
@keyframes kayit-gir { from { opacity: 0; transform: translateX(-10px); background: rgba(82, 220, 255, 0.12); } to { opacity: 1; transform: none; } }
.icecek-nokta { flex: none; width: 36px; height: 36px; border-radius: 12px; display: grid; place-items: center; }
.icecek-nokta svg { width: 20px; height: 20px; }
.kayitlar .govde { flex: 1; }
.kayitlar .govde b { font-weight: 700; }
.kayitlar .govde span { display: block; font-size: 12.5px; color: var(--soluk); }
.kayitlar time { color: var(--soluk); font-size: 13.5px; font-variant-numeric: tabular-nums; }
.bos { padding: 22px 16px; text-align: center; color: var(--soluk); font-size: 14px; }
.bos b { display: block; color: var(--metin); font-family: var(--baslik); font-size: 16px; margin-bottom: 2px; }

/* Segment */
.segment { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 4px; padding: 4px; border-radius: 16px; background: rgba(255, 255, 255, 0.06); border: 1px solid var(--cizgi); }
.segment button { min-height: 40px; border: 0; border-radius: 12px; background: transparent; color: var(--soluk); font-weight: 700; font-size: 14px; transition: background 0.2s, color 0.2s; }
.segment button[aria-pressed="true"] { background: var(--metin); color: #072558; }

/* Grafik */
.hafta-nav { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 14px 0 4px; }
.hafta-nav b { font-family: var(--baslik); font-weight: 600; font-size: 16px; }
.hafta-nav .ok-dugme:disabled { opacity: 0.3; cursor: default; }
.grafik { width: 100%; height: auto; display: block; margin-top: 6px; }
.grafik .cubuk { cursor: pointer; transition: opacity 0.2s; }
.grafik .gun-ad { fill: var(--soluk); font: 600 12px var(--yazi); }
.grafik .gun-ad.secili { fill: var(--metin); }
.grafik .hedef-cizgi { stroke: var(--amber); stroke-width: 1.5; stroke-dasharray: 4 5; }
.grafik .hedef-yazi { fill: var(--amber); font: 700 11px var(--yazi); }
.grafik .deger { fill: var(--metin); font: 600 11px var(--baslik); }

.gun-detay { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 12px; margin-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.07); }
.gun-detay b { font-weight: 700; }
.gun-detay span { color: var(--soluk); font-size: 13px; display: block; }
.durum-hap { padding: 6px 12px; border-radius: 999px; font-size: 12.5px; font-weight: 700; white-space: nowrap; }
.durum-hap.ok { background: rgba(98, 240, 198, 0.14); color: var(--nane); }
.durum-hap.eksik { background: rgba(255, 255, 255, 0.08); color: var(--soluk); }

.ozet { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; margin: 0; }
.ozet div { padding: 4px 10px; }
.ozet div + div { border-left: 1px solid rgba(255, 255, 255, 0.08); }
.ozet dt { color: var(--soluk); font-size: 12.5px; font-weight: 600; }
.ozet dd { margin: 2px 0 0; font: 600 20px var(--baslik); letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.ozet dd small { font-size: 12px; color: var(--soluk); font-weight: 600; margin-left: 2px; }

/* Takvim */
.takvim { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 12px; }
.takvim .gb { text-align: center; color: var(--soluk-2); font-size: 11.5px; font-weight: 700; padding-bottom: 2px; }
.takvim .gun {
  aspect-ratio: 1; border-radius: 12px; display: grid; place-items: center; font: 600 13px var(--baslik);
  background: rgba(255, 255, 255, 0.04); color: var(--soluk); position: relative;
}
.takvim .gun.dolu { color: #03203f; }
.takvim .gun.bugun { outline: 2px solid var(--metin); outline-offset: -2px; }
.takvim .gun.gelecek { opacity: 0.35; }
.lejant { display: flex; align-items: center; gap: 6px; justify-content: flex-end; margin-top: 10px; color: var(--soluk); font-size: 12px; }
.lejant i { width: 14px; height: 14px; border-radius: 4px; display: inline-block; }

/* Rozetler */
.rozetler { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.rozet { text-align: center; padding: 12px 4px 10px; border-radius: 20px; border: 1px solid var(--cizgi); background: var(--kart); }
.rozet svg { width: 52px; height: 58px; display: block; margin: 0 auto 6px; }
.rozet b { display: block; font-size: 12.5px; font-weight: 700; line-height: 1.2; }
.rozet span { display: block; font-size: 11px; color: var(--soluk); margin-top: 2px; }
.rozet.kilitli b { color: var(--soluk); }
.rozet.kazanildi { border-color: rgba(82, 220, 255, 0.28); background: linear-gradient(180deg, rgba(82, 220, 255, 0.1), rgba(82, 220, 255, 0.02)); }

/* Ayarlar */
.grup { border-radius: 22px; border: 1px solid var(--cizgi); background: var(--kart); overflow: hidden; }
.grup + .grup-baslik { margin-top: 24px; }
.grup-baslik { margin: 22px 4px 8px; font: 600 15px var(--baslik); color: var(--soluk); }
.grup-baslik:first-of-type { margin-top: 18px; }
.satir { display: flex; align-items: center; gap: 12px; padding: 12px 14px; min-height: 60px; }
.satir + .satir { border-top: 1px solid rgba(255, 255, 255, 0.06); }
.satir .govde { flex: 1; min-width: 0; }
.satir .govde b, .satir .govde label { display: block; font-weight: 700; font-size: 15px; }
.satir .govde span { display: block; color: var(--soluk); font-size: 12.5px; }
.satir .deger { font: 600 17px var(--baslik); font-variant-numeric: tabular-nums; white-space: nowrap; }
.satir.dikey { display: block; }
.satir.dikey .ust-sira { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
.metin-kutu {
  width: 100%; min-height: 46px; padding: 10px 14px; border-radius: 14px; border: 1px solid var(--cizgi-2);
  background: rgba(3, 14, 34, 0.45); color: var(--metin); font-weight: 600;
}
.metin-kutu:focus { outline: none; border-color: var(--su); }
.metin-kutu.dar { width: 84px; text-align: center; }
.birimli { display: flex; align-items: center; gap: 8px; color: var(--soluk); font-weight: 600; font-size: 13.5px; }
input[type="time"].metin-kutu { color-scheme: dark; width: 120px; }
select.metin-kutu { color-scheme: dark; }

input[type="range"] { -webkit-appearance: none; appearance: none; width: 100%; height: 30px; background: transparent; margin: 0; }
input[type="range"]::-webkit-slider-runnable-track { height: 8px; border-radius: 99px; background: linear-gradient(90deg, var(--su) 0, var(--su-2) var(--yuzde, 50%), rgba(255, 255, 255, 0.12) var(--yuzde, 50%)); }
input[type="range"]::-moz-range-track { height: 8px; border-radius: 99px; background: rgba(255, 255, 255, 0.12); }
input[type="range"]::-moz-range-progress { height: 8px; border-radius: 99px; background: var(--su); }
input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 26px; height: 26px; margin-top: -9px; border-radius: 50%; background: #fff; border: 4px solid var(--su-2); }
input[type="range"]::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 4px solid var(--su-2); }

.anahtar { position: relative; flex: none; width: 52px; height: 32px; }
.anahtar input { position: absolute; inset: -6px; width: calc(100% + 12px); height: calc(100% + 12px); opacity: 0; margin: 0; cursor: pointer; z-index: 1; }
.anahtar i { position: absolute; inset: 0; border-radius: 99px; background: rgba(255, 255, 255, 0.16); transition: background 0.2s; }
.anahtar i::after { content: ""; position: absolute; top: 3px; left: 3px; width: 26px; height: 26px; border-radius: 50%; background: #fff; transition: transform 0.25s var(--egri); }
.anahtar input:checked + i { background: var(--su-2); }
.anahtar input:checked + i::after { transform: translateX(20px); }
.anahtar input:focus-visible + i { outline: 2px solid var(--su); outline-offset: 2px; }

.oneri {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 12px; padding: 14px 14px 12px;
  margin: 4px 14px 14px; border-radius: 18px; background: linear-gradient(140deg, rgba(82, 220, 255, 0.16), rgba(42, 124, 255, 0.12)); border: 1px solid rgba(82, 220, 255, 0.3);
}
.oneri small { display: block; color: var(--soluk); font-size: 12.5px; font-weight: 600; }
.oneri .oneri-not { flex-basis: 100%; color: var(--soluk); font-size: 12px; font-weight: 500; margin: 0; }
.oneri b { font: 700 26px var(--baslik); letter-spacing: -0.02em; }
.oneri b small { display: inline; font-size: 14px; color: var(--metin); margin-left: 2px; }
.dugme {
  min-height: 46px; padding: 0 18px; border-radius: 14px; border: 0; font-weight: 700; font-size: 14.5px;
  background: var(--metin); color: #072558; transition: transform 0.15s, opacity 0.2s;
}
.dugme:active { transform: scale(0.97); }
.dugme:disabled { opacity: 0.45; cursor: default; }
.dugme.ikincil { background: rgba(255, 255, 255, 0.09); color: var(--metin); border: 1px solid var(--cizgi); }
.dugme.tehlike { background: rgba(255, 138, 138, 0.14); color: var(--tehlike); border: 1px solid rgba(255, 138, 138, 0.3); }
.dugme.tam { width: 100%; }
.cip-sira { display: flex; flex-wrap: wrap; gap: 8px; }
.cip {
  min-height: 40px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--cizgi-2);
  background: transparent; color: var(--metin); font-weight: 600; font-size: 13.5px; display: inline-flex; align-items: center; gap: 8px;
}
.cip[aria-pressed="true"] { background: var(--metin); color: #072558; border-color: var(--metin); }
.cip svg { width: 18px; height: 18px; }
.saat-ekle { display: flex; gap: 8px; align-items: center; padding: 12px 14px; border-top: 1px solid rgba(255, 255, 255, 0.06); }
.saat-ekle input[type="time"].metin-kutu { flex: 1; width: auto; }
.saat-ekle .dugme { min-height: 46px; }
.aralik { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.aralik label { font-size: 12px; color: var(--soluk); font-weight: 600; display: grid; gap: 4px; }
.aralik .metin-kutu { width: 100%; }
.not { color: var(--soluk); font-size: 12.5px; margin: 8px 4px 0; }
.alt-bosluk { height: 6px; }

/* Sekme çubuğu */
.sekmeler {
  position: fixed; z-index: 20; left: 50%; transform: translateX(-50%);
  bottom: calc(env(safe-area-inset-bottom) + 14px);
  width: min(360px, calc(100% - 32px));
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 6px;
  border-radius: 26px; background: rgba(9, 32, 72, 0.72); border: 1px solid var(--cizgi-2);
  -webkit-backdrop-filter: blur(18px) saturate(150%); backdrop-filter: blur(18px) saturate(150%);
}
.sekmeler button {
  min-height: 54px; border: 0; border-radius: 20px; background: transparent; color: var(--soluk);
  display: grid; justify-items: center; align-content: center; gap: 3px; font-size: 11.5px; font-weight: 700;
  transition: background 0.25s, color 0.25s;
}
.sekmeler svg { width: 23px; height: 23px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.sekmeler button:hover { color: var(--metin); }
.sekmeler button.secili { background: rgba(82, 220, 255, 0.16); color: #8eeaff; }

/* Alt sayfa (sheet) */
.perde { position: fixed; inset: 0; z-index: 40; background: rgba(2, 10, 26, 0.55); -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px); animation: perde 0.25s; }
@keyframes perde { from { opacity: 0; } }
.alt-sayfa {
  position: fixed; z-index: 41; left: 50%; bottom: 0; transform: translateX(-50%);
  width: min(560px, 100%); max-height: 88vh; overflow-y: auto;
  padding: 10px 20px calc(env(safe-area-inset-bottom) + 20px);
  border-radius: 28px 28px 0 0; background: #0b2554; border: 1px solid var(--cizgi-2); border-bottom: 0;
  animation: yukari 0.4s var(--egri);
}
@keyframes yukari { from { transform: translate(-50%, 100%); } to { transform: translate(-50%, 0); } }
.tutamak { width: 40px; height: 5px; border-radius: 9px; background: rgba(255, 255, 255, 0.22); margin: 0 auto 14px; }
.alt-sayfa h2 { font-size: 21px; }
.alt-sayfa .alt-yazi { color: var(--soluk); margin: 4px 0 16px; font-size: 14px; }
.miktar-secici { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 18px 0 6px; }
.miktar-secici output { font: 700 44px/1 var(--baslik); letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
.miktar-secici output small { font-size: 18px; color: var(--soluk); margin-left: 4px; }
.yuvarlak { width: 52px; height: 52px; border-radius: 50%; border: 1px solid var(--cizgi-2); background: var(--kart); font-size: 24px; font-weight: 500; display: grid; place-items: center; }
.yuvarlak:active { transform: scale(0.94); }
.sayfa-dugmeler { display: flex; gap: 10px; margin-top: 18px; }
.sayfa-dugmeler .dugme { flex: 1; min-height: 52px; font-size: 15.5px; }

/* Bildirim ve tost */
.bildirim {
  position: fixed; z-index: 60; left: 50%; transform: translateX(-50%);
  top: calc(env(safe-area-inset-top) + 12px); width: min(528px, calc(100% - 24px));
  display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 4px 12px; padding: 12px 8px 12px 12px; border-radius: 24px;
  background: rgba(14, 48, 104, 0.94); border: 1px solid rgba(82, 220, 255, 0.35);
  -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px);
  animation: asagi 0.45s var(--egri);
}
@keyframes asagi { from { transform: translate(-50%, -140%); } to { transform: translate(-50%, 0); } }
.bildirim .govde { flex: 1; min-width: 0; }
.bildirim b { display: block; font-weight: 700; }
.bildirim span { display: block; font-size: 13px; color: var(--soluk); }
.bildirim .dugme { grid-column: 2 / 4; justify-self: start; min-height: 44px; padding: 0 16px; font-size: 13.5px; margin: 4px 0 0; }
.bildirim .bildirim-ikincil { grid-column: auto; background: transparent; color: var(--soluk); border: 0; padding: 0 10px; }
.bildirim-dugmeler { grid-column: 2 / 4; display: flex; gap: 6px; margin-top: 6px; }
.bildirim-dugmeler .dugme { grid-column: auto; margin: 0; }
.tost {
  position: fixed; z-index: 70; left: 50%; bottom: calc(env(safe-area-inset-bottom) + 96px);
  transform: translate(-50%, 20px); opacity: 0; pointer-events: none;
  display: flex; align-items: center; gap: 12px; padding: 8px 8px 8px 16px; border-radius: 999px;
  background: #eef6ff; color: #072558; font-weight: 700; font-size: 14px; white-space: nowrap;
  transition: opacity 0.25s, transform 0.35s var(--egri);
}
.tost.acik { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; }
.tost button { min-height: 36px; padding: 0 14px; border-radius: 999px; border: 0; background: #072558; color: #eef6ff; font-weight: 700; font-size: 13px; }
.tost:not(.eylemli) { padding-right: 16px; }

.kutla { animation: kutla 0.9s var(--egri); }
@keyframes kutla { 0% { transform: scale(1); } 35% { transform: scale(1.05); } 100% { transform: scale(1); } }

.gizli-baslik { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

@media (min-width: 600px) {
  #ekran { padding-top: 40px; }
  .ust h1 { font-size: 32px; }
}
@media (max-width: 360px) {
  .hizli { gap: 8px; }
  .hizli button { min-height: 84px; border-radius: 18px; }
  .bardak-kap { width: 210px; height: 268px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
}
`,
    "app.js": `/* Damla · Su Takibi — veriler cihazda (localStorage). Sekmeler: Bugün, Geçmiş, Ayarlar. */
(function () {
  "use strict";

  var ANAHTAR = "damla-v1";
  var ICECEK = {
    su: { ad: "Su", oran: 1, renk: "#52dcff" },
    maden: { ad: "Maden suyu", oran: 1, renk: "#93c5ff" },
    cay: { ad: "Çay", oran: 0.9, renk: "#ffb36b" },
    kahve: { ad: "Kahve", oran: 0.8, renk: "#e3aa80" },
    ayran: { ad: "Ayran", oran: 0.9, renk: "#e4eeff" },
  };
  var AKTIVITE = {
    hafif: { ad: "Hafif", ek: 0, aciklama: "Günün çoğu masa başında geçiyor" },
    orta: { ad: "Orta", ek: 400, aciklama: "Haftada birkaç gün yürüyüş ya da spor" },
    yogun: { ad: "Yoğun", ek: 800, aciklama: "Her gün terleten antrenman" },
  };
  var HIZLI_AD = ["Bardak", "Küçük şişe", "Şişe"];

  /* ---------- Simgeler ---------- */
  var S = function (ic, ek) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (ek || "") + ">" + ic + "</svg>"; };
  var IKON = {
    su: S('<path d="M12 3.2c3.2 3.9 6 7.4 6 10.6a6 6 0 0 1-12 0c0-3.2 2.8-6.7 6-10.6z"/>'),
    maden: S('<path d="M10 2.8h4"/><path d="M10.5 2.8v3.1L8 8.6V20a1.2 1.2 0 0 0 1.2 1.2h5.6A1.2 1.2 0 0 0 16 20V8.6l-2.5-2.7V2.8"/><circle cx="11" cy="16" r=".9"/><circle cx="13.2" cy="12.6" r=".9"/><circle cx="11.6" cy="10.4" r=".6"/>'),
    cay: S('<path d="M7.2 4h9.6l-1.7 6.2c-.3 1.2-.3 2.4 0 3.6L16.8 20H7.2l1.7-6.2c.3-1.2.3-2.4 0-3.6z"/><path d="M5 21.2h14"/><path d="M8.6 8.5h6.8"/>'),
    kahve: S('<path d="M4.5 9.5h11v4.2a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M15.5 10.5h1.6a2.4 2.4 0 0 1 0 4.8h-1.8"/><path d="M8 3.5c-.6.8-.6 1.6 0 2.4"/><path d="M11.5 3.5c-.6.8-.6 1.6 0 2.4"/><path d="M4 21h14"/>'),
    ayran: S('<path d="M6 4h12l-1.6 16.2a1 1 0 0 1-1 .8H8.6a1 1 0 0 1-1-.8z"/><path d="M6.5 8.5c1.8-1 3.6 1 5.5 0s3.7-1 5.5 0"/>'),
    bardak: S('<path d="M6 4h12l-1.7 15.4a1.8 1.8 0 0 1-1.8 1.6h-5a1.8 1.8 0 0 1-1.8-1.6z"/><path d="M7 11c1.7-.9 3.3.9 5 0s3.3-.9 5 0"/>'),
    kucukSise: S('<path d="M10 3h4"/><path d="M10.5 3v2.6L8.5 8v11.8A1.2 1.2 0 0 0 9.7 21h4.6a1.2 1.2 0 0 0 1.2-1.2V8l-2-2.4V3"/><path d="M8.5 12.5h7"/>'),
    sise: S('<path d="M9.5 2.6h5"/><path d="M10 2.6v2.6c0 .9-.4 1.7-1 2.3l-.6.6a3 3 0 0 0-.9 2.1V20a1.4 1.4 0 0 0 1.4 1.4h6.2A1.4 1.4 0 0 0 16.5 20v-9.8a3 3 0 0 0-.9-2.1l-.6-.6c-.6-.6-1-1.4-1-2.3V2.6"/><path d="M7.5 13c1.5-.8 3 .8 4.5 0s3-.8 4.5 0"/>'),
    arti: S('<path d="M12 5v14"/><path d="M5 12h14"/>'),
    zil: S('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2H4.5z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>'),
    sag: S('<path d="m9 5 7 7-7 7"/>'),
    sol: S('<path d="m15 5-7 7 7 7"/>'),
    kapat: S('<path d="M6 6l12 12"/><path d="M18 6 6 18"/>'),
    cop: S('<path d="M4.5 6.5h15"/><path d="M9.5 6.5V4.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.7"/><path d="M6.5 6.5l.8 12.6a1.6 1.6 0 0 0 1.6 1.4h6.2a1.6 1.6 0 0 0 1.6-1.4l.8-12.6"/>'),
    alev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.6 2.5c.5 3.1-1.3 4.6-2.8 6.2-1.6 1.7-3.3 3.6-3.3 6.6a5.5 5.5 0 0 0 11 0c0-2.5-1.2-4.2-2.2-5.4-.2 1.5-.9 2.6-2 3 .6-3.6-.2-7.4-.7-10.4z" fill="url(#g-alev)"/></svg>',
  };
  var HIZLI_IKON = [IKON.bardak, IKON.kucukSise, IKON.sise];

  /* ---------- Yardımcılar ---------- */
  function $(s, k) { return (k || document).querySelector(s); }
  function $$(s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); }
  function iki(n) { return (n < 10 ? "0" : "") + n; }
  function gunAnahtar(d) { return d.getFullYear() + "-" + iki(d.getMonth() + 1) + "-" + iki(d.getDate()); }
  function gunEkle(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
  function anahtardanGun(k) { var p = k.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function saatSimdi() { var d = new Date(); return iki(d.getHours()) + ":" + iki(d.getMinutes()); }
  function dakika(s) { var p = s.split(":"); return +p[0] * 60 + +p[1]; }
  function saatYaz(dk) { return iki(Math.floor(dk / 60) % 24) + ":" + iki(dk % 60); }
  function sayi(n) { return Math.round(n).toLocaleString("tr-TR"); }
  function litre(ml) { return (ml / 1000).toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " L"; }
  function kacis(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function haftaGunu(d) { return (d.getDay() + 6) % 7; }
  var GUN_KISA = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  var AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  function kisaTarih(d) { return d.getDate() + " " + AYLAR[d.getMonth()]; }
  function uzunTarih(d) { return d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" }); }
  function yuvarla50(n) { return Math.round(n / 50) * 50; }
  function onceYaz(s) {
    var fark = dakika(saatSimdi()) - dakika(s);
    if (fark < 1) return "Az önce";
    if (fark < 60) return fark + " dk önce";
    var sa = Math.floor(fark / 60), dk = fark % 60;
    return sa + " sa" + (dk ? " " + dk + " dk" : "") + " önce";
  }

  /* ---------- Veri ---------- */
  function ornekVeri() {
    var V = {
      surum: 1, ad: "Elif", hedef: 2400, kilo: 62, aktivite: "orta", sicak: false, hizli: [200, 330, 500],
      hatirlatmaAcik: true,
      hatirlatmalar: ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00"].map(function (s, i) { return { saat: s, acik: i < 6 }; }),
      gunler: {}, rozetler: [], sonBildirim: "",
    };
    var tohum = 91827;
    function rnd() { tohum = (tohum * 48271) % 2147483647; return tohum / 2147483647; }
    var bugun = new Date();
    var kacirilan = [7, 20, 26];
    for (var i = 27; i >= 1; i--) {
      var gun = gunEkle(bugun, -i);
      var h = i > 14 ? 2200 : 2400;
      var amac = kacirilan.indexOf(i) >= 0 ? 1450 + rnd() * 550 : h + 40 + rnd() * 420;
      var dk = 7 * 60 + 25 + Math.floor(rnd() * 40), top = 0, kayitlar = [], sira = 0;
      while (top < amac && dk < 23 * 60) {
        var r = rnd(), tur = "su";
        if (sira === 0 && r < 0.55) tur = "cay";
        else if (r > 0.9) tur = "kahve";
        else if (r > 0.82) tur = "maden";
        else if (r > 0.79 && dk > 12 * 60) tur = "ayran";
        var ml = tur === "cay" ? 200 : tur === "kahve" ? 180 : [200, 250, 330, 500][Math.floor(rnd() * 4)];
        kayitlar.push({ id: "o" + i + "-" + sira, s: saatYaz(dk), ml: ml, tur: tur });
        top += ml * ICECEK[tur].oran; sira++;
        dk += 45 + Math.floor(rnd() * 70);
      }
      V.gunler[gunAnahtar(gun)] = { h: h, k: kayitlar };
    }
    var simdi = dakika(saatSimdi());
    var bugunku = [
      { s: "07:50", ml: 250, tur: "su" }, { s: "08:40", ml: 200, tur: "cay" }, { s: "10:15", ml: 500, tur: "su" },
      { s: "12:35", ml: 330, tur: "maden" }, { s: "14:50", ml: 250, tur: "su" },
    ].filter(function (x) { return dakika(x.s) <= simdi; }).map(function (x, j) { x.id = "b" + j; return x; });
    V.gunler[gunAnahtar(bugun)] = { h: V.hedef, k: bugunku };
    return V;
  }

  var V;
  try { V = JSON.parse(localStorage.getItem(ANAHTAR) || "null"); } catch (e) { V = null; }
  var ilkAcilis = !V || V.surum !== 1;
  if (ilkAcilis) V = ornekVeri();
  function kaydet() { try { localStorage.setItem(ANAHTAR, JSON.stringify(V)); } catch (e) { /* depolama dolu */ } }

  function gunVerisi(k) { return V.gunler[k]; }
  function gunToplam(k) {
    var g = V.gunler[k]; if (!g) return 0;
    return g.k.reduce(function (t, x) { return t + x.ml * ((ICECEK[x.tur] || ICECEK.su).oran); }, 0);
  }
  function gunHedef(k) { var g = V.gunler[k]; return (g && g.h) || V.hedef; }
  function tamamMi(k) { return !!V.gunler[k] && gunToplam(k) >= gunHedef(k); }
  function bugunAnahtar() { return gunAnahtar(new Date()); }

  function seri() {
    var n = tamamMi(bugunAnahtar()) ? 1 : 0, d = gunEkle(new Date(), -1);
    while (tamamMi(gunAnahtar(d))) { n++; d = gunEkle(d, -1); }
    return n;
  }
  function enUzunSeri() {
    var anahtarlar = Object.keys(V.gunler).sort(); if (!anahtarlar.length) return 0;
    var d = anahtardanGun(anahtarlar[0]), son = new Date(), en = 0, n = 0;
    while (d <= son) { if (tamamMi(gunAnahtar(d))) { n++; if (n > en) en = n; } else n = 0; d = gunEkle(d, 1); }
    return en;
  }
  function toplamLitre() { return Object.keys(V.gunler).reduce(function (t, k) { return t + gunToplam(k); }, 0) / 1000; }
  function enIyiOran() { return Object.keys(V.gunler).reduce(function (m, k) { return Math.max(m, gunToplam(k) / gunHedef(k)); }, 0); }
  function erkenciMi() {
    return Object.keys(V.gunler).some(function (k) {
      return V.gunler[k].k.filter(function (x) { return dakika(x.s) < 600; }).reduce(function (t, x) { return t + x.ml; }, 0) >= 500;
    });
  }
  function kayitVarMi() { return Object.keys(V.gunler).some(function (k) { return V.gunler[k].k.length > 0; }); }

  function rozetler() {
    var uzun = enUzunSeri(), lt = toplamLitre(), oran = enIyiOran();
    var seriR = function (id, ad, n) { return { id: id, ad: ad, ic: '<text x="26" y="36" text-anchor="middle" font-family="Outfit, sans-serif" font-weight="700" font-size="' + (n > 9 ? 17 : 20) + '">' + n + "</text>", aciklama: n + " gün seri", tamam: uzun >= n, ilerleme: Math.min(uzun, n) + "/" + n + " gün" }; };
    return [
      { id: "ilk", ad: "İlk yudum", ic: '<path d="M26 17c4 4.6 7.2 8.8 7.2 12.6a7.2 7.2 0 0 1-14.4 0c0-3.8 3.2-8 7.2-12.6z" fill="currentColor"/>', aciklama: "İlk kaydın", tamam: kayitVarMi(), ilerleme: "Bir kayıt ekle" },
      seriR("seri3", "Üç gün", 3),
      seriR("seri7", "Bir hafta", 7),
      { id: "erkenci", ad: "Erkenci", ic: '<path d="M17 33h18"/><path d="M20 33a6 6 0 0 1 12 0"/><path d="M26 20v3"/><path d="m18.5 24 2 2"/><path d="m33.5 24-2 2"/>', cizgi: true, aciklama: "10:00'dan önce 500 ml", tamam: erkenciMi(), ilerleme: "Sabah 500 ml" },
      seriR("seri14", "İki hafta", 14),
      seriR("seri30", "Ay boyu", 30),
      { id: "fazlasi", ad: "Fazlası", ic: '<path d="m26 18 2.5 5.2 5.7.8-4.1 4 1 5.6L26 31l-5.1 2.6 1-5.6-4.1-4 5.7-.8z" fill="currentColor"/>', aciklama: "Hedefin %125'i", tamam: oran >= 1.25, ilerleme: "En iyi %" + Math.round(oran * 100) },
      { id: "okyanus", ad: "Okyanus", ic: '<path d="M16 25c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.4 5 0"/><path d="M16 31c2.5-2 5-2 7.5 0s5 2 7.5 0 3.5-1.4 5 0"/>', cizgi: true, aciklama: "Toplam 100 litre", tamam: lt >= 100, ilerleme: sayi(Math.min(lt, 100)) + "/100 L" },
    ];
  }
  function rozetSVG(r) {
    var dolgu = r.tamam ? "url(#g-rozet)" : "rgba(255,255,255,0.06)";
    var kenar = r.tamam ? "none" : "rgba(255,255,255,0.22)";
    var renk = r.tamam ? "#04204a" : "rgba(238,246,255,0.5)";
    return '<svg viewBox="0 0 52 58" aria-hidden="true"><path d="M26 2c9 9.5 22 20.5 22 33a22 22 0 0 1-44 0C4 22.5 17 11.5 26 2z" fill="' + dolgu + '" stroke="' + kenar + '" stroke-width="1.5" stroke-dasharray="' + (r.tamam ? "0" : "3 3") + '"/>'
      + '<g transform="translate(0 4)" color="' + renk + '" fill="' + (r.cizgi ? "none" : renk) + '" stroke="' + (r.cizgi ? renk : "none") + '" stroke-width="2" stroke-linecap="round">' + r.ic + "</g></svg>";
  }
  if (ilkAcilis) { V.rozetler = rozetler().filter(function (r) { return r.tamam; }).map(function (r) { return r.id; }); kaydet(); }

  /* ---------- Ortak SVG tanımları ---------- */
  var tanim = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  tanim.setAttribute("width", "0"); tanim.setAttribute("height", "0"); tanim.setAttribute("aria-hidden", "true");
  tanim.style.position = "absolute";
  tanim.innerHTML = '<defs>'
    + '<linearGradient id="g-su" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fe3ff"/><stop offset="0.55" stop-color="#2f97ff"/><stop offset="1" stop-color="#1a4fd6"/></linearGradient>'
    + '<linearGradient id="g-su-arka" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9af0ff" stop-opacity="0.75"/><stop offset="1" stop-color="#2f7dff" stop-opacity="0.35"/></linearGradient>'
    + '<linearGradient id="g-cam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0.1"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.02"/><stop offset="1" stop-color="#fff" stop-opacity="0.07"/></linearGradient>'
    + '<linearGradient id="g-cubuk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6be6ff"/><stop offset="1" stop-color="#2a7cff"/></linearGradient>'
    + '<linearGradient id="g-rozet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ff0ff"/><stop offset="1" stop-color="#3a8dff"/></linearGradient>'
    + '<linearGradient id="g-alev" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#ff8a3d"/></linearGradient>'
    + '<clipPath id="bardakKes"><path d="M15 12h190l-17.6 245.6a15 15 0 0 1-15 13.9H47.6a15 15 0 0 1-15-13.9z"/></clipPath>'
    + "</defs>";
  document.body.insertBefore(tanim, document.body.firstChild);

  /* ---------- Bardak ---------- */
  var BARDAK_ALT = 271.5, BARDAK_UST = 30;
  function dalga(genlik) {
    var d = "M-120 0q30 " + -genlik + " 60 0";
    for (var i = 0; i < 9; i++) d += "t60 0";
    return d + "V320H-120z";
  }
  function bardakSVG() {
    var olcek = "";
    [0.25, 0.5, 0.75, 1].forEach(function (p) {
      var y = BARDAK_ALT - p * (BARDAK_ALT - BARDAK_UST);
      var sagX = 205 - (y - 12) * (17.6 / 245.6);
      olcek += '<line x1="' + (sagX - 16).toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + (sagX - 5).toFixed(1) + '" y2="' + y.toFixed(1) + '"/>'
        + '<text x="' + (sagX + 9).toFixed(1) + '" y="' + (y + 3.8).toFixed(1) + '" data-p="' + p + '"></text>';
    });
    return '<svg class="bardak" viewBox="0 0 220 280" role="img" aria-label="Su bardağı">'
      + '<path d="M15 12h190l-17.6 245.6a15 15 0 0 1-15 13.9H47.6a15 15 0 0 1-15-13.9z" fill="url(#g-cam)"/>'
      + '<g clip-path="url(#bardakKes)"><g class="seviye" id="seviye" style="transform: translateY(' + (BARDAK_ALT + 12) + 'px)">'
      + '<path class="dalga-2" d="' + dalga(11) + '" transform="translate(0 -5)" fill="url(#g-su-arka)"/>'
      + '<path class="dalga-1" d="' + dalga(7) + '" fill="url(#g-su)"/>'
      + '<circle class="kabarcik" cx="72" cy="90" r="3.2" fill="#c9f6ff"/><circle class="kabarcik" cx="124" cy="110" r="2.2" fill="#c9f6ff"/>'
      + '<circle class="kabarcik" cx="150" cy="80" r="2.8" fill="#c9f6ff"/><circle class="kabarcik" cx="98" cy="120" r="1.8" fill="#c9f6ff"/>'
      + "</g></g>"
      + '<g class="olcek">' + olcek + "</g>"
      + '<path d="M15 12h190l-17.6 245.6a15 15 0 0 1-15 13.9H47.6a15 15 0 0 1-15-13.9z" fill="none" stroke="rgba(220,240,255,0.42)" stroke-width="2.5" stroke-linejoin="round"/>'
      + '<path d="M30 30 44 236" stroke="rgba(255,255,255,0.22)" stroke-width="5" stroke-linecap="round"/>'
      + '<path d="M10 12h200" stroke="rgba(220,240,255,0.55)" stroke-width="3" stroke-linecap="round"/>'
      + "</svg>";
  }

  /* ---------- Ekranlar ---------- */
  var E = $("#ekran");
  var aktif = "bugun";
  var gecmis = { mod: "hafta", hafta: 0, ay: 0, secili: null };

  function selam() {
    var s = new Date().getHours();
    return s < 5 ? "İyi geceler" : s < 12 ? "Günaydın" : s < 18 ? "İyi günler" : s < 23 ? "İyi akşamlar" : "İyi geceler";
  }
  function siradakiHatirlatma() {
    if (!V.hatirlatmaAcik) return null;
    var acik = V.hatirlatmalar.filter(function (r) { return r.acik; }).map(function (r) { return r.saat; }).sort();
    if (!acik.length) return null;
    var simdi = saatSimdi();
    var sonraki = acik.filter(function (s) { return s > simdi; })[0];
    return sonraki ? { saat: sonraki, yarin: false } : { saat: acik[0], yarin: true };
  }

  var ekranlar = {};
  ekranlar.bugun = function () {
    var hizli = V.hizli.map(function (ml, i) {
      return '<button type="button" data-ekle="' + ml + '" aria-label="' + ml + " ml " + HIZLI_AD[i].toLocaleLowerCase("tr") + ' su ekle">' + HIZLI_IKON[i] + "<b>" + ml + " ml</b><span>" + HIZLI_AD[i] + "</span></button>";
    }).join("");
    return '<header class="ust"><div><p class="tarih">' + kacis(uzunTarih(new Date())) + "</p><h1>" + selam() + ", " + kacis(V.ad || "dostum") + "</h1></div>"
      + '<span class="seri-hap" id="seriHap" title="Üst üste hedefe ulaştığın gün sayısı">' + IKON.alev + "<span></span></span></header>"
      + '<div class="sahne"><div class="bardak-kap" id="bardakKap">' + bardakSVG() + "</div></div>"
      + '<div class="sayac"><span class="miktar" id="miktar">0</span><span class="bolu">/ <span id="hedefYazi"></span> ml</span></div>'
      + '<p class="hedef-satir" id="hedefSatir"></p>'
      + '<div class="hizli">' + hizli + '<button type="button" class="ozel" id="ozelAc" aria-label="Özel miktar ve içecek seç">' + IKON.arti + "<b>Özel</b><span>Miktar seç</span></button></div>"
      + '<button type="button" class="kart kart-satir hatirlatma-kart" id="hatirlatmaKart"><span class="simge-kutu">' + IKON.zil + '</span><span class="govde"><b id="hatirlatmaBaslik"></b><span id="hatirlatmaAlt"></span></span><span class="ok-dugme" aria-hidden="true">' + IKON.sag + "</span></button>"
      + '<div class="bolum-baslik"><h2>Bugünkü kayıtlar</h2><span id="kayitSayi"></span></div>'
      + '<ul class="kayitlar" id="kayitlar"></ul>';
  };

  function bugunuGuncelle(yeniId) {
    if (aktif !== "bugun") return;
    var k = bugunAnahtar(), top = gunToplam(k), h = gunHedef(k), p = Math.min(1, top / h);
    var y = BARDAK_ALT - p * (BARDAK_ALT - BARDAK_UST);
    if (top === 0) y = BARDAK_ALT + 12;
    $("#seviye").style.transform = "translateY(" + y.toFixed(1) + "px)";
    $$(".olcek text").forEach(function (t) { t.textContent = litre(h * +t.getAttribute("data-p")); });
    $("#miktar").textContent = sayi(top);
    $("#hedefYazi").textContent = sayi(h);
    $("#hedefSatir").innerHTML = top >= h
      ? '<span class="tamam">Bugünkü hedef tamam</span>' + (top - h >= 50 ? " · fazladan " + sayi(top - h) + " ml" : "")
      : top === 0 ? "Güne bir bardak suyla başla · hedefin <b>" + sayi(h) + " ml</b>"
      : "%" + Math.round(p * 100) + " tamamlandı · <b>" + sayi(h - top) + " ml</b> kaldı";
    var n = seri();
    $("#seriHap span").textContent = n + " gün";
    $("#seriHap").setAttribute("aria-label", n + " gün seri");
    var sh = siradakiHatirlatma();
    $("#hatirlatmaBaslik").textContent = sh ? "Sıradaki hatırlatma " + (sh.yarin ? "yarın " : "") + sh.saat : "Hatırlatmalar kapalı";
    var acikSayi = V.hatirlatmalar.filter(function (r) { return r.acik; }).length;
    $("#hatirlatmaAlt").textContent = sh ? acikSayi + " hatırlatma açık" : "Ayarlar'dan saat ekleyip açabilirsin";
    var g = gunVerisi(k), liste = g ? g.k.slice().sort(function (a, b) { return b.s.localeCompare(a.s); }) : [];
    $("#kayitSayi").textContent = liste.length ? liste.length + " kayıt" : "";
    $("#kayitlar").innerHTML = liste.length ? liste.map(function (x) {
      var ic = ICECEK[x.tur] || ICECEK.su;
      var alt = (ic.oran < 1 ? sayi(x.ml * ic.oran) + " ml su değeri · " : "") + onceYaz(x.s);
      return '<li' + (x.id === yeniId ? ' class="yeni"' : "") + '><span class="icecek-nokta" style="background:' + ic.renk + '1f;color:' + ic.renk + '">' + IKON[x.tur] + '</span><span class="govde"><b>' + ic.ad + " · " + x.ml + " ml</b><span>" + alt + "</span></span>"
        + '<time datetime="' + k + "T" + x.s + '">' + x.s + '</time><button type="button" class="ok-dugme" data-sil="' + x.id + '" aria-label="' + x.s + " kaydını sil" + '">' + IKON.cop + "</button></li>";
    }).join("") : '<li class="bos"><span><b>Bugün henüz kayıt yok</b>Bir bardak suyla güne başla, yukarıdaki düğmeler tek dokunuşla ekler.</span></li>';
  }

  /* ---------- Geçmiş ---------- */
  ekranlar.gecmis = function () {
    var n = seri(), en = enUzunSeri();
    var rz = rozetler();
    return '<header class="ust"><div><p class="tarih">Su günlüğün</p><h1>Geçmiş</h1></div></header>'
      + '<div class="segment" role="group" aria-label="Görünüm" style="margin-top:16px"><button type="button" data-mod="hafta" aria-pressed="' + (gecmis.mod === "hafta") + '">Hafta</button><button type="button" data-mod="ay" aria-pressed="' + (gecmis.mod === "ay") + '">Ay</button></div>'
      + '<section class="kart" id="gecmisKart" aria-live="polite">' + (gecmis.mod === "hafta" ? haftaHTML() : ayHTML()) + "</section>"
      + '<section class="kart kart-satir"><span class="simge-kutu" style="background:rgba(255,190,114,.12)">' + IKON.alev + '</span><span class="govde"><b>' + n + " gün üst üste hedefte</b><span>" + (en === 0 ? "Hedefini tamamladığın ilk gün serin başlar" : "En uzun serin " + en + " gün" + (n > 0 && n >= en ? ", rekor sende" : ", rekor için " + (en - n + 1) + " gün daha")) + "</span></span></section>"
      + '<div class="bolum-baslik"><h2>Rozetler</h2><span>' + rz.filter(function (r) { return r.tamam; }).length + " / " + rz.length + "</span></div>"
      + '<div class="rozetler">' + rz.map(function (r) {
        return '<div class="rozet ' + (r.tamam ? "kazanildi" : "kilitli") + '">' + rozetSVG(r) + "<b>" + r.ad + "</b><span>" + (r.tamam ? r.aciklama : r.ilerleme) + "</span></div>";
      }).join("") + "</div>";
  };

  function haftaGunleri() {
    var bas = gunEkle(new Date(), -haftaGunu(new Date()) + gecmis.hafta * 7);
    var g = []; for (var i = 0; i < 7; i++) g.push(gunEkle(bas, i));
    return g;
  }
  function haftaHTML() {
    var gunler = haftaGunleri(), bugunK = bugunAnahtar();
    var veriler = gunler.map(function (d) { var k = gunAnahtar(d); return { d: d, k: k, top: gunToplam(k), h: gunHedef(k), gelecek: k > bugunK, kayit: (V.gunler[k] || { k: [] }).k.length }; });
    if (!gecmis.secili || !veriler.some(function (v) { return v.k === gecmis.secili; })) {
      var son = veriler.filter(function (v) { return !v.gelecek; }); gecmis.secili = (son[son.length - 1] || veriler[0]).k;
    }
    var hedef = veriler[veriler.length - 1].h;
    var enYuksek = Math.max(hedef * 1.3, Math.max.apply(null, veriler.map(function (v) { return v.top; })) * 1.08);
    var W = 340, H = 196, ust = 24, alt = 30, cizimH = H - ust - alt, slot = W / 7, gen = 30;
    var yOf = function (v) { return ust + cizimH - (v / enYuksek) * cizimH; };
    var svg = '<svg class="grafik" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Haftalık su grafiği">';
    var hy = yOf(hedef);
    svg += '<line class="hedef-cizgi" x1="0" x2="' + W + '" y1="' + hy.toFixed(1) + '" y2="' + hy.toFixed(1) + '"/>';
    veriler.forEach(function (v, i) {
      var x = i * slot + (slot - gen) / 2, ok = v.top >= v.h, sec = v.k === gecmis.secili;
      var yuk = v.gelecek ? 0 : Math.max(6, (v.top / enYuksek) * cizimH);
      var y = ust + cizimH - yuk;
      if (v.gelecek) svg += '<rect x="' + x + '" y="' + (ust + cizimH - 6) + '" width="' + gen + '" height="6" rx="3" fill="rgba(255,255,255,0.06)"/>';
      else {
        svg += '<rect class="cubuk" data-gun="' + v.k + '" x="' + x + '" y="' + y.toFixed(1) + '" width="' + gen + '" height="' + yuk.toFixed(1) + '" rx="10" fill="' + (ok ? "url(#g-cubuk)" : "rgba(255,255,255,0.2)") + '" opacity="' + (sec ? 1 : 0.62) + '" tabindex="0" role="button" aria-label="' + uzunTarih(v.d) + ", " + sayi(v.top) + ' ml"/>';
        if (v.top > 0) svg += '<text class="deger" x="' + (x + gen / 2) + '" y="' + (y - 7).toFixed(1) + '" text-anchor="middle" opacity="' + (sec ? 1 : 0.7) + '">' + (v.top / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + "</text>";
      }
      svg += '<text class="gun-ad' + (sec ? " secili" : "") + '" x="' + (x + gen / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + (v.k === bugunK ? "Bugün" : GUN_KISA[i]) + "</text>";
    });
    svg += '<text class="hedef-yazi" x="' + W + '" y="' + (hy - 6).toFixed(1) + '" text-anchor="end">Hedef ' + litre(hedef) + "</text></svg>";

    var gecmisVeri = veriler.filter(function (v) { return !v.gelecek && V.gunler[v.k]; });
    var ort = gecmisVeri.length ? gecmisVeri.reduce(function (t, v) { return t + v.top; }, 0) / gecmisVeri.length : 0;
    var tamamSayi = gecmisVeri.filter(function (v) { return v.top >= v.h; }).length;
    var enIyi = gecmisVeri.reduce(function (m, v) { return Math.max(m, v.top); }, 0);
    var s = veriler.filter(function (v) { return v.k === gecmis.secili; })[0];
    var baslik = gecmis.hafta === 0 ? "Bu hafta" : gecmis.hafta === -1 ? "Geçen hafta" : kisaTarih(gunler[0]) + " – " + kisaTarih(gunler[6]);
    return '<div class="hafta-nav" style="margin-top:0"><button type="button" class="ok-dugme" data-kaydir="-1" aria-label="Önceki hafta">' + IKON.sol + "</button><div style=\\"text-align:center\\"><b>" + baslik + '</b><span style="display:block;color:var(--soluk);font-size:12.5px">' + kisaTarih(gunler[0]) + " – " + kisaTarih(gunler[6]) + "</span></div>"
      + '<button type="button" class="ok-dugme" data-kaydir="1" aria-label="Sonraki hafta"' + (gecmis.hafta >= 0 ? " disabled" : "") + ">" + IKON.sag + "</button></div>"
      + svg
      + (s ? '<div class="gun-detay"><div><b>' + kacis(uzunTarih(s.d)) + "</b><span>" + sayi(s.top) + " ml · " + s.kayit + " kayıt</span></div>" + (s.gelecek ? "" : s.top >= s.h ? '<span class="durum-hap ok">Hedef tamam</span>' : '<span class="durum-hap eksik">%' + Math.round((s.top / s.h) * 100) + "</span>") + "</div>" : "")
      + '<dl class="ozet" style="margin-top:14px"><div><dt>Ortalama</dt><dd>' + sayi(ort) + "<small>ml</small></dd></div><div><dt>Hedefte</dt><dd>" + tamamSayi + "<small>/ " + gecmisVeri.length + " gün</small></dd></div><div><dt>En iyi gün</dt><dd>" + sayi(enIyi) + "<small>ml</small></dd></div></dl>";
  }
  function ayHTML() {
    var simdi = new Date(), ilk = new Date(simdi.getFullYear(), simdi.getMonth() + gecmis.ay, 1);
    var gunSayi = new Date(ilk.getFullYear(), ilk.getMonth() + 1, 0).getDate(), bugunK = bugunAnahtar();
    var hucre = GUN_KISA.map(function (g) { return '<div class="gb">' + g + "</div>"; }).join("");
    for (var b = 0; b < haftaGunu(ilk); b++) hucre += "<div></div>";
    var tamam = 0, toplam = 0, veriGun = 0;
    for (var i = 1; i <= gunSayi; i++) {
      var d = new Date(ilk.getFullYear(), ilk.getMonth(), i), k = gunAnahtar(d), top = gunToplam(k), h = gunHedef(k), p = Math.min(1, top / h);
      var stil = "", sinif = "gun";
      if (k > bugunK) sinif += " gelecek";
      else if (top > 0) {
        veriGun++; toplam += top;
        if (top >= h) { tamam++; sinif += " dolu"; stil = "background:linear-gradient(160deg,#7eecff,#3a8dff)"; }
        else stil = "background:rgba(82,220,255," + (0.08 + p * 0.32).toFixed(2) + ");color:var(--metin)";
      }
      if (k === bugunK) sinif += " bugun";
      hucre += '<div class="' + sinif + '" style="' + stil + '" title="' + kisaTarih(d) + ": " + sayi(top) + ' ml">' + i + "</div>";
    }
    return '<div class="hafta-nav" style="margin-top:0"><button type="button" class="ok-dugme" data-kaydir="-1" aria-label="Önceki ay">' + IKON.sol + "</button><b>" + AYLAR[ilk.getMonth()] + " " + ilk.getFullYear() + "</b>"
      + '<button type="button" class="ok-dugme" data-kaydir="1" aria-label="Sonraki ay"' + (gecmis.ay >= 0 ? " disabled" : "") + ">" + IKON.sag + "</button></div>"
      + '<div class="takvim">' + hucre + "</div>"
      + '<div class="lejant"><span>Az</span><i style="background:rgba(82,220,255,.14)"></i><i style="background:rgba(82,220,255,.28)"></i><i style="background:rgba(82,220,255,.4)"></i><i style="background:linear-gradient(160deg,#7eecff,#3a8dff)"></i><span>Hedef</span></div>'
      + '<dl class="ozet" style="margin-top:14px"><div><dt>Hedefte</dt><dd>' + tamam + "<small>gün</small></dd></div><div><dt>Toplam</dt><dd>" + litre(toplam).replace(" L", "") + "<small>L</small></dd></div><div><dt>Ortalama</dt><dd>" + sayi(veriGun ? toplam / veriGun : 0) + "<small>ml</small></dd></div></dl>";
  }

  /* ---------- Ayarlar ---------- */
  function oneriHesapla() { return yuvarla50(V.kilo * 33 + AKTIVITE[V.aktivite].ek + (V.sicak ? 500 : 0)); }
  ekranlar.ayarlar = function () {
    var hatirlatmalar = V.hatirlatmalar.slice().sort(function (a, b) { return a.saat.localeCompare(b.saat); });
    return '<header class="ust"><div><p class="tarih">Hedef, hatırlatma ve veriler</p><h1>Ayarlar</h1></div></header>'
      + '<h2 class="grup-baslik">Profil</h2><div class="grup"><div class="satir"><div class="govde"><label for="adKutu">Adın</label><span>Selamlamada görünür</span></div><input id="adKutu" class="metin-kutu" style="width:150px" maxlength="24" value="' + kacis(V.ad) + '" autocomplete="given-name" /></div></div>'
      + '<h2 class="grup-baslik">Günlük hedef</h2><div class="grup"><div class="satir dikey"><div class="ust-sira"><b><label for="hedefKaydir">Hedefin</label></b><span class="deger" id="hedefDeger">' + sayi(V.hedef) + ' ml</span></div>'
      + '<input type="range" id="hedefKaydir" min="1000" max="5000" step="50" value="' + V.hedef + '" /></div></div>'
      + '<h2 class="grup-baslik">Kişisel hedef hesaplayıcı</h2><div class="grup">'
      + '<div class="satir dikey"><div class="ust-sira"><b><label for="kiloKaydir">Kilon</label></b><span class="deger" id="kiloDeger">' + V.kilo + ' kg</span></div><input type="range" id="kiloKaydir" min="35" max="150" step="1" value="' + V.kilo + '" /></div>'
      + '<div class="satir dikey"><div class="ust-sira"><b>Aktivite</b><span style="color:var(--soluk);font-size:12.5px" id="aktiviteAciklama">' + AKTIVITE[V.aktivite].aciklama + "</span></div>"
      + '<div class="segment" role="group" aria-label="Aktivite seviyesi">' + Object.keys(AKTIVITE).map(function (k) { return '<button type="button" data-aktivite="' + k + '" aria-pressed="' + (V.aktivite === k) + '">' + AKTIVITE[k].ad + "</button>"; }).join("") + "</div></div>"
      + '<div class="satir"><div class="govde"><label for="sicakAnahtar">Sıcak hava</label><span>Yaz ayları ya da sıcak iklim için 500 ml ek</span></div><span class="anahtar"><input type="checkbox" role="switch" id="sicakAnahtar"' + (V.sicak ? " checked" : "") + "><i></i></span></div>"
      + '<div class="oneri"><div><small>Önerilen günlük hedef</small><b id="oneriDeger"></b></div><button type="button" class="dugme" id="oneriUygula"></button><p class="oneri-not">Kilogram başına 33 ml, aktivite ve hava eki dahil.</p></div></div>'
      + '<h2 class="grup-baslik">Hızlı ekleme düğmeleri</h2><div class="grup">' + V.hizli.map(function (ml, i) {
        return '<div class="satir"><span class="simge-kutu">' + HIZLI_IKON[i] + '</span><div class="govde"><label for="hizli' + i + '">' + HIZLI_AD[i] + '</label><span>' + ["Su bardağı, kupa", "Pet şişe, kutu", "Matara, büyük şişe"][i] + '</span></div><span class="birimli"><input id="hizli' + i + '" class="metin-kutu dar" type="number" inputmode="numeric" min="50" max="2000" step="10" data-hizli="' + i + '" value="' + ml + '" aria-label="' + HIZLI_AD[i] + ' miktarı, ml" />ml</span></div>';
      }).join("") + "</div>"
      + '<h2 class="grup-baslik" id="hatirlatmaBolum">Hatırlatmalar</h2><div class="grup">'
      + '<div class="satir"><span class="simge-kutu">' + IKON.zil + '</span><div class="govde"><label for="hatirlatmaAnahtar">Hatırlatmalar</label><span>Uygulama açıkken ekranın üstünde görünür</span></div><span class="anahtar"><input type="checkbox" role="switch" id="hatirlatmaAnahtar"' + (V.hatirlatmaAcik ? " checked" : "") + "><i></i></span></div>"
      + hatirlatmalar.map(function (r) {
        return '<div class="satir"><div class="govde"><b style="font-family:var(--baslik);font-size:18px;font-weight:600">' + r.saat + "</b><span>" + (dakika(r.saat) < 720 ? "Sabah" : dakika(r.saat) < 1080 ? "Öğleden sonra" : "Akşam") + '</span></div><button type="button" class="ok-dugme" data-hsil="' + r.saat + '" aria-label="' + r.saat + ' hatırlatmasını sil">' + IKON.cop + '</button><span class="anahtar"><input type="checkbox" role="switch" data-hac="' + r.saat + '" aria-label="' + r.saat + ' hatırlatması"' + (r.acik ? " checked" : "") + "><i></i></span></div>";
      }).join("")
      + '<div class="saat-ekle"><input type="time" id="yeniSaat" class="metin-kutu" value="16:00" aria-label="Yeni hatırlatma saati" /><button type="button" class="dugme ikincil" id="saatEkle">Saat ekle</button></div>'
      + '<div class="saat-ekle" style="display:block"><b style="display:block;margin-bottom:8px">Aralıkla oluştur</b><div class="aralik"><label>Başlangıç<input type="time" id="aBas" class="metin-kutu" value="09:00" /></label><label>Bitiş<input type="time" id="aBit" class="metin-kutu" value="21:00" /></label>'
      + '</div><span style="display:block;margin:12px 0 6px;font-size:12px;color:var(--soluk);font-weight:600">Sıklık</span><div class="segment" role="group" aria-label="Sıklık">' + [[60, "1 saat"], [90, "90 dk"], [120, "2 saat"], [180, "3 saat"]].map(function (x) { return '<button type="button" data-sik="' + x[0] + '" aria-pressed="' + (x[0] === 120) + '">' + x[1] + "</button>"; }).join("") + "</div>"
      + '<button type="button" class="dugme tam" id="aralikOlustur" style="margin-top:12px">Listeyi bu aralıkla yenile</button></div>'
      + '<div class="satir" style="border-top:1px solid rgba(255,255,255,.06)"><div class="govde"><b>Nasıl göründüğünü gör</b><span>Bir hatırlatmayı şimdi göster</span></div><button type="button" class="dugme ikincil" id="dene">Dene</button></div></div>'
      + '<h2 class="grup-baslik">Veriler</h2><div class="grup"><div class="satir"><div class="govde"><b>Kayıtlarını indir</b><span>' + Object.keys(V.gunler).length + " günlük geçmiş, JSON dosyası</span></div><button type=\\"button\\" class=\\"dugme ikincil\\" id=\\"indir\\">İndir</button></div>"
      + '<div class="satir"><div class="govde"><b>Sıfırdan başla</b><span>Tüm kayıtlar bu cihazdan silinir</span></div><button type="button" class="dugme tehlike" id="sifirla">Sil</button></div></div>'
      + '<p class="not">Damla verilerini yalnız bu cihazda saklar. Su ihtiyacı kişiden kişiye değişir; sağlık sorunun varsa hekimine danış.</p><div class="alt-bosluk"></div>';
  };
  function kaydiriciBoya(el) { var p = ((el.value - el.min) / (el.max - el.min)) * 100; el.style.setProperty("--yuzde", p + "%"); }
  function oneriGuncelle() {
    var o = oneriHesapla(), b = $("#oneriUygula");
    $("#oneriDeger").innerHTML = sayi(o) + "<small>ml</small>";
    b.textContent = o === V.hedef ? "Hedefin bu" : "Hedefim yap";
    b.disabled = o === V.hedef;
  }
  function hedefAyarla(ml) {
    V.hedef = ml;
    var g = V.gunler[bugunAnahtar()]; if (g) g.h = ml;
    kaydet();
  }

  /* ---------- Sekmeler ---------- */
  function goster(sekme, yerinde) {
    if (sekme !== aktif) $("#tost").classList.remove("acik");
    aktif = sekme;
    $$(".sekmeler button").forEach(function (b) {
      var s = b.getAttribute("data-sekme") === sekme;
      b.classList.toggle("secili", s);
      if (s) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    E.innerHTML = ekranlar[sekme]();
    E.style.animation = "none"; void E.offsetWidth; E.style.animation = "";
    if (!yerinde) window.scrollTo(0, 0);
    if (sekme === "bugun") requestAnimationFrame(function () { requestAnimationFrame(function () { bugunuGuncelle(); }); });
    if (sekme === "ayarlar") { $$("input[type=range]", E).forEach(kaydiriciBoya); oneriGuncelle(); }
  }
  $$(".sekmeler button").forEach(function (b) { b.addEventListener("click", function () { goster(b.getAttribute("data-sekme")); }); });

  /* ---------- Ekleme, silme ---------- */
  function ekle(ml, tur) {
    tur = tur || "su";
    var k = bugunAnahtar(), onceTamam = tamamMi(k);
    var g = V.gunler[k] || (V.gunler[k] = { h: V.hedef, k: [] });
    var kayit = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), s: saatSimdi(), ml: ml, tur: tur };
    g.k.push(kayit); kaydet();
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) { /* titreşim yok */ }
    bugunuGuncelle(kayit.id);
    var yeniRozet = rozetKontrol();
    if (!onceTamam && tamamMi(k)) { kutla(); tost("Bugünkü hedef tamam, harika gidiyorsun!"); }
    else if (yeniRozet) tost("Yeni rozet: " + yeniRozet.ad);
    else tost(ml + " ml " + ICECEK[tur].ad.toLocaleLowerCase("tr") + " eklendi", "Geri al", function () { sil(kayit.id); });
  }
  function sil(id) {
    var g = V.gunler[bugunAnahtar()]; if (!g) return;
    g.k = g.k.filter(function (x) { return x.id !== id; }); kaydet(); bugunuGuncelle();
  }
  function rozetKontrol() {
    var yeni = null;
    rozetler().forEach(function (r) { if (r.tamam && V.rozetler.indexOf(r.id) < 0) { V.rozetler.push(r.id); yeni = r; } });
    if (yeni) kaydet();
    return yeni;
  }
  function kutla() {
    var b = $("#bardakKap"); if (!b) return;
    b.classList.remove("kutla"); void b.offsetWidth; b.classList.add("kutla");
  }

  var tostZaman;
  function tost(metin, eylem, fn) {
    var t = $("#tost");
    t.innerHTML = "<span></span>"; t.firstChild.textContent = metin;
    t.classList.toggle("eylemli", !!eylem);
    if (eylem) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = eylem;
      b.addEventListener("click", function () { fn(); t.classList.remove("acik"); });
      t.appendChild(b);
    }
    t.classList.add("acik");
    clearTimeout(tostZaman); tostZaman = setTimeout(function () { t.classList.remove("acik"); }, eylem ? 4200 : 2800);
  }

  /* ---------- Alt sayfa ---------- */
  var sayfa = $("#sayfa"), perde = $("#perde"), oncekiOdak = null;
  function sayfaAc(html) {
    oncekiOdak = document.activeElement;
    $("#tost").classList.remove("acik");
    sayfa.innerHTML = '<div class="tutamak" aria-hidden="true"></div>' + html;
    sayfa.hidden = false; perde.hidden = false;
    var ilk = sayfa.querySelector("button, input"); if (ilk) ilk.focus({ preventScroll: true });
  }
  function sayfaKapat() {
    sayfa.hidden = true; perde.hidden = true; sayfa.innerHTML = "";
    if (oncekiOdak && oncekiOdak.focus) oncekiOdak.focus({ preventScroll: true });
  }
  perde.addEventListener("click", sayfaKapat);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sayfa.hidden) sayfaKapat(); });
  sayfa.addEventListener("click", function (e) { if (e.target.closest("[data-kapat]")) sayfaKapat(); });

  function ozelAc() {
    var ml = 250, tur = "su";
    sayfaAc('<h2 id="sayfaBaslik">Özel miktar</h2><p class="alt-yazi">İçeceği ve miktarı seç. Çay ve kahve hedefine biraz daha az sayılır.</p>'
      + '<div class="cip-sira" role="group" aria-label="İçecek">' + Object.keys(ICECEK).map(function (k) {
        return '<button type="button" class="cip" data-tur="' + k + '" aria-pressed="' + (k === tur) + '"><span style="color:' + ICECEK[k].renk + ';display:inline-flex">' + IKON[k] + "</span>" + ICECEK[k].ad + "</button>";
      }).join("") + "</div>"
      + '<div class="miktar-secici"><button type="button" class="yuvarlak" data-adim="-50" aria-label="50 ml azalt">−</button><output id="ozelMl" aria-live="polite"></output><button type="button" class="yuvarlak" data-adim="50" aria-label="50 ml artır">+</button></div>'
      + '<input type="range" id="ozelKaydir" min="50" max="1500" step="10" value="' + ml + '" aria-label="Miktar, ml" />'
      + '<div class="cip-sira" style="margin-top:10px">' + [150, 250, 750, 1000].map(function (m) { return '<button type="button" class="cip" data-hazir="' + m + '">' + sayi(m) + " ml</button>"; }).join("") + "</div>"
      + '<p class="not" id="ozelNot"></p>'
      + '<div class="sayfa-dugmeler"><button type="button" class="dugme ikincil" data-kapat>Vazgeç</button><button type="button" class="dugme" id="ozelEkle">Ekle</button></div>');
    var kay = $("#ozelKaydir");
    function yenile() {
      kay.value = ml; kaydiriciBoya(kay);
      $("#ozelMl").innerHTML = sayi(ml) + "<small>ml</small>";
      var o = ICECEK[tur].oran;
      $("#ozelNot").textContent = o < 1 ? ICECEK[tur].ad + " %" + Math.round(o * 100) + " oranında sayılır: hedefine " + sayi(ml * o) + " ml eklenir." : "Tamamı hedefine sayılır.";
      $("#ozelEkle").textContent = sayi(ml) + " ml " + ICECEK[tur].ad.toLocaleLowerCase("tr") + " ekle";
    }
    sayfa.addEventListener("click", function (e) {
      var c = e.target.closest("[data-tur]");
      if (c) { tur = c.getAttribute("data-tur"); $$("[data-tur]", sayfa).forEach(function (x) { x.setAttribute("aria-pressed", x === c); }); yenile(); }
      var a = e.target.closest("[data-adim]"); if (a) { ml = Math.max(50, Math.min(1500, ml + +a.getAttribute("data-adim"))); yenile(); }
      var hz = e.target.closest("[data-hazir]"); if (hz) { ml = +hz.getAttribute("data-hazir"); yenile(); }
      if (e.target.closest("#ozelEkle")) { var m = ml, t = tur; sayfaKapat(); ekle(m, t); }
    });
    kay.addEventListener("input", function () { ml = +kay.value; yenile(); });
    yenile();
  }

  function sifirlaSor() {
    sayfaAc('<h2 id="sayfaBaslik">Tüm kayıtlar silinsin mi?</h2><p class="alt-yazi">' + Object.keys(V.gunler).length + " günlük geçmiş, seri ve rozetler bu cihazdan kalıcı olarak silinir. Hedefin ve hatırlatmaların korunur.</p>"
      + '<div class="sayfa-dugmeler"><button type="button" class="dugme ikincil" data-kapat>Vazgeç</button><button type="button" class="dugme tehlike" id="evetSil">Hepsini sil</button></div>');
    $("#evetSil").addEventListener("click", function () {
      V.gunler = {}; V.rozetler = []; kaydet(); sayfaKapat(); goster("bugun"); tost("Kayıtlar silindi, yeni bir başlangıç");
    });
  }

  /* ---------- Hatırlatma (uygulama içi) ---------- */
  var bildirim = $("#bildirim"), bildirimZaman, erteleZaman;
  function bildirimGoster(deneme) {
    var k = bugunAnahtar(), kalan = Math.max(0, gunHedef(k) - gunToplam(k)), ml = V.hizli[0];
    bildirim.innerHTML = '<span class="simge-kutu">' + IKON.su + '</span><span class="govde"><b>Su vakti</b><span>' + (kalan > 0 ? "Hedefine " + sayi(kalan) + " ml kaldı. Bir bardak içelim mi?" : "Hedefin tamam, yine de bir yudum iyi gelir.") + "</span></span>"
      + '<button type="button" class="ok-dugme" id="bildirimKapat" aria-label="Hatırlatmayı kapat">' + IKON.kapat + '</button>'
      + '<div class="bildirim-dugmeler"><button type="button" class="dugme" id="bildirimEkle">' + ml + ' ml ekle</button><button type="button" class="dugme bildirim-ikincil" id="bildirimErtele">15 dk sonra</button></div>';
    bildirim.hidden = false;
    $("#bildirimEkle").addEventListener("click", function () { bildirim.hidden = true; ekle(ml, "su"); });
    $("#bildirimKapat").addEventListener("click", function () { bildirim.hidden = true; });
    $("#bildirimErtele").addEventListener("click", function () {
      bildirim.hidden = true; clearTimeout(erteleZaman);
      erteleZaman = setTimeout(function () { bildirimGoster(false); }, 15 * 60000);
      tost("15 dakika sonra yeniden hatırlatırım");
    });
    clearTimeout(bildirimZaman); bildirimZaman = setTimeout(function () { bildirim.hidden = true; }, 14000);
  }
  function hatirlatmaKontrol() {
    if (!V.hatirlatmaAcik) return;
    var s = saatSimdi(), iz = bugunAnahtar() + " " + s;
    var var_ = V.hatirlatmalar.some(function (r) { return r.acik && r.saat === s; });
    if (!var_ || V.sonBildirim === iz) return;
    V.sonBildirim = iz; kaydet();
    bildirimGoster(false);
  }
  setInterval(hatirlatmaKontrol, 15000);

  /* ---------- Olaylar ---------- */
  E.addEventListener("click", function (e) {
    var t = e.target;
    var ek = t.closest("[data-ekle]"); if (ek) { ek.animate && ek.animate([{ transform: "scale(.94)" }, { transform: "scale(1)" }], { duration: 260 }); ekle(+ek.getAttribute("data-ekle"), "su"); return; }
    if (t.closest("#ozelAc")) { ozelAc(); return; }
    if (t.closest("#hatirlatmaKart")) { goster("ayarlar"); var hb = $("#hatirlatmaBolum"); if (hb) hb.scrollIntoView({ block: "start" }); return; }
    var sl = t.closest("[data-sil]"); if (sl) { sil(sl.getAttribute("data-sil")); tost("Kayıt silindi"); return; }
    var md = t.closest("[data-mod]"); if (md) { gecmis.mod = md.getAttribute("data-mod"); goster("gecmis", true); return; }
    var kd = t.closest("[data-kaydir]"); if (kd && !kd.disabled) { var n = +kd.getAttribute("data-kaydir"); if (gecmis.mod === "hafta") { gecmis.hafta = Math.min(0, gecmis.hafta + n); gecmis.secili = null; } else gecmis.ay = Math.min(0, gecmis.ay + n); $("#gecmisKart").innerHTML = gecmis.mod === "hafta" ? haftaHTML() : ayHTML(); return; }
    var cb = t.closest(".cubuk"); if (cb) { gecmis.secili = cb.getAttribute("data-gun"); $("#gecmisKart").innerHTML = haftaHTML(); return; }
    var ak = t.closest("[data-aktivite]"); if (ak) { V.aktivite = ak.getAttribute("data-aktivite"); kaydet(); $$("[data-aktivite]", E).forEach(function (x) { x.setAttribute("aria-pressed", x === ak); }); $("#aktiviteAciklama").textContent = AKTIVITE[V.aktivite].aciklama; oneriGuncelle(); return; }
    if (t.closest("#oneriUygula")) { hedefAyarla(oneriHesapla()); var hk = $("#hedefKaydir"); hk.value = V.hedef; kaydiriciBoya(hk); $("#hedefDeger").textContent = sayi(V.hedef) + " ml"; oneriGuncelle(); tost("Günlük hedefin " + sayi(V.hedef) + " ml oldu"); return; }
    var hs = t.closest("[data-hsil]"); if (hs) { var s = hs.getAttribute("data-hsil"); V.hatirlatmalar = V.hatirlatmalar.filter(function (r) { return r.saat !== s; }); kaydet(); goster("ayarlar", true); tost(s + " hatırlatması silindi"); return; }
    if (t.closest("#saatEkle")) {
      var yeni = $("#yeniSaat").value; if (!yeni) return;
      if (V.hatirlatmalar.some(function (r) { return r.saat === yeni; })) { tost(yeni + " zaten listede"); return; }
      V.hatirlatmalar.push({ saat: yeni, acik: true }); kaydet(); goster("ayarlar", true); tost(yeni + " hatırlatması eklendi"); return;
    }
    if (t.closest("#dene")) { bildirimGoster(true); return; }
    var sk = t.closest("[data-sik]"); if (sk) { $$("[data-sik]", E).forEach(function (x) { x.setAttribute("aria-pressed", x === sk); }); return; }
    if (t.closest("#aralikOlustur")) {
      var bas = dakika($("#aBas").value || "09:00"), bit = dakika($("#aBit").value || "21:00"), secSik = $('[data-sik][aria-pressed="true"]'), sik = secSik ? +secSik.getAttribute("data-sik") : 120, liste = [];
      if (bit <= bas) { tost("Bitiş saati başlangıçtan sonra olmalı"); return; }
      for (var d = bas; d <= bit && liste.length < 24; d += sik) liste.push({ saat: saatYaz(d), acik: true });
      V.hatirlatmalar = liste; V.hatirlatmaAcik = true; kaydet(); goster("ayarlar", true); tost(liste.length + " hatırlatma oluşturuldu"); return;
    }
    if (t.closest("#indir")) {
      var blob = new Blob([JSON.stringify(V, null, 2)], { type: "application/json" }), a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "damla-kayitlar-" + bugunAnahtar() + ".json"; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); tost("Dosya hazırlandı"); return;
    }
    if (t.closest("#sifirla")) { sifirlaSor(); return; }
  });
  E.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("cubuk")) { e.preventDefault(); gecmis.secili = e.target.getAttribute("data-gun"); $("#gecmisKart").innerHTML = haftaHTML(); var y = $('.cubuk[data-gun="' + gecmis.secili + '"]'); if (y) y.focus(); }
  });
  E.addEventListener("input", function (e) {
    var t = e.target;
    if (t.id === "adKutu") { V.ad = t.value.trim(); kaydet(); }
    if (t.id === "hedefKaydir") { kaydiriciBoya(t); hedefAyarla(+t.value); $("#hedefDeger").textContent = sayi(V.hedef) + " ml"; oneriGuncelle(); }
    if (t.id === "kiloKaydir") { kaydiriciBoya(t); V.kilo = +t.value; kaydet(); $("#kiloDeger").textContent = V.kilo + " kg"; oneriGuncelle(); }
  });
  E.addEventListener("change", function (e) {
    var t = e.target;
    if (t.id === "sicakAnahtar") { V.sicak = t.checked; kaydet(); oneriGuncelle(); }
    if (t.id === "hatirlatmaAnahtar") { V.hatirlatmaAcik = t.checked; kaydet(); tost(t.checked ? "Hatırlatmalar açık" : "Hatırlatmalar kapalı"); }
    if (t.hasAttribute("data-hac")) { var s = t.getAttribute("data-hac"); V.hatirlatmalar.forEach(function (r) { if (r.saat === s) r.acik = t.checked; }); kaydet(); }
    if (t.hasAttribute("data-hizli")) {
      var i = +t.getAttribute("data-hizli"), v = Math.round(+t.value / 10) * 10;
      if (!(v >= 50 && v <= 2000)) { t.value = V.hizli[i]; tost("50 ile 2.000 ml arasında bir değer gir"); return; }
      V.hizli[i] = v; t.value = v; kaydet(); tost(HIZLI_AD[i] + " " + v + " ml olarak kaydedildi");
    }
  });

  /* Gün değişince Bugün ekranını tazele */
  var sonGun = bugunAnahtar();
  setInterval(function () { if (bugunAnahtar() !== sonGun) { sonGun = bugunAnahtar(); if (aktif === "bugun") goster("bugun", true); } }, 60000);

  goster("bugun");
})();
`,
  },
};
