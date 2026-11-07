/* Şablon: Evcil Dostum — mobil uygulama (PWA; mağaza paketine sarılabilir): birden çok hayvan profili, bugün ekranı (aktivite halkası, canlı yürüyüş zamanlayıcısı, öğünler, su kabı), takvim (aşı, veteriner, ilaç, bakım hatırlatmaları), sağlık (SVG kilo grafiği, aşı karnesi, ilaçlar, veteriner ziyaretleri) ve profil. Veriler cihazda saklanır. */

export const EVCIL_DOSTUM = {
  id: "evcil-dostum",
  ad: "Evcil Dostum",
  tur: "mobil" as const,
  aciklama: "Birden çok dost için yürüyüş, mama, su, aşı takvimi ve kilo grafiği; sekmeli mobil uygulama",
  kapak: "/gercek/build/sablon/evcil-dostum.webp",
  dosyalar: {
    "index.html": `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#fbf5ee" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="Evcil Dostum" />
  <meta name="description" content="Evcil Dostum: yürüyüş, mama ve su takibi, aşı ve veteriner hatırlatmaları, kilo grafiği ve sağlık kayıtları. Birden çok dost için." />
  <title>Evcil Dostum</title>
  <link rel="manifest" href="manifest.webmanifest" />
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="ikon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gabarito:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <div class="zemin" aria-hidden="true"><i></i><i></i><i></i></div>

  <div class="uygulama">
    <main id="ekran" tabindex="-1"></main>
  </div>

  <div class="canli" id="canli" role="status" aria-live="off" hidden></div>

  <nav class="sekmeler" aria-label="Ana menü">
    <button type="button" data-sekme="bugun" class="secili" aria-current="page">
      <svg class="ik" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" /><path d="M12 2.6v2.2M12 19.2v2.2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2.6 12h2.2M19.2 12h2.2M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" /></svg>
      <span>Bugün</span>
    </button>
    <button type="button" data-sekme="takvim">
      <svg class="ik" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
      <span>Takvim</span>
    </button>
    <button type="button" data-sekme="saglik">
      <svg class="ik" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.6-4.5-7.6-10.2A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 7.6 2.6C19.6 15.5 12 20 12 20z" /><path d="M7.6 12.2h2.1l1.3-2.3 2 4 1.3-1.7h2.1" /></svg>
      <span>Sağlık</span>
    </button>
    <button type="button" data-sekme="profil">
      <svg class="ik" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="6.6" cy="10" rx="1.7" ry="2.1" /><ellipse cx="10" cy="6.4" rx="1.7" ry="2.1" /><ellipse cx="14.2" cy="6.4" rx="1.7" ry="2.1" /><ellipse cx="17.5" cy="10" rx="1.7" ry="2.1" /><path d="M12 12.2c-2.7 0-5.1 2.7-5.1 4.8 0 1.6 1.4 2.5 3 2 .8-.2 1.4-.5 2.1-.5s1.3.3 2.1.5c1.6.5 3-.4 3-2 0-2.1-2.4-4.8-5.1-4.8z" /></svg>
      <span>Profil</span>
    </button>
  </nav>

  <div class="perde" id="perde" hidden></div>
  <section class="sayfa" id="sayfa" role="dialog" aria-modal="true" aria-labelledby="sayfaBaslik" hidden></section>
  <div class="tost" id="tost" role="status" aria-live="polite"></div>

  <script src="app.js"></script>
</body>
</html>
`,
    "manifest.webmanifest": `{
  "name": "Evcil Dostum",
  "short_name": "Evcil Dostum",
  "description": "Yürüyüş, mama ve su takibi; aşı, veteriner ve ilaç hatırlatmaları; kilo grafiği ve sağlık kayıtları.",
  "lang": "tr",
  "start_url": "index.html",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#fbf5ee",
  "theme_color": "#fbf5ee",
  "categories": ["lifestyle", "health"],
  "icons": [
    { "src": "ikon.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "any" },
    { "src": "ikon.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "maskable" }
  ]
}
`,
    "ikon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="z" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffa36b"/><stop offset="1" stop-color="#ff6236"/></linearGradient><linearGradient id="k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#ffeadf"/></linearGradient></defs><rect width="512" height="512" rx="116" fill="url(#z)"/><circle cx="392" cy="120" r="150" fill="#fff" opacity=".12"/><g fill="url(#k)"><ellipse cx="150" cy="228" rx="40" ry="50" transform="rotate(-18 150 228)"/><ellipse cx="216" cy="150" rx="40" ry="52" transform="rotate(-6 216 150)"/><ellipse cx="300" cy="150" rx="40" ry="52" transform="rotate(6 300 150)"/><ellipse cx="366" cy="228" rx="40" ry="50" transform="rotate(18 366 228)"/><path d="M258 262c-66 0-122 66-122 116 0 40 34 58 72 48 20-5 33-11 50-11s30 6 50 11c38 10 72-8 72-48 0-50-56-116-122-116z"/></g><path d="M258 352c-14-12-34-26-34-44 0-11 9-20 20-20 6 0 11 3 14 8 3-5 8-8 14-8 11 0 20 9 20 20 0 18-20 32-34 44z" fill="#ff6a3d"/></svg>
`,
    "stil.css": `/* Evcil Dostum — krem zemin, mandalina vurgu, kakao metin; bal, gök, lavanta, gül ve ada çayı yardımcı renkler. */
:root {
  --zemin: #fbf5ee;
  --kart: #ffffff;
  --kart-2: #fdf9f5;
  --metin: #2b1d17;
  --metin-2: #6b5a50;
  --metin-3: #8f7d72;
  --cizgi: #f0e5d9;
  --cizgi-2: #e5d5c5;
  --mandalina: #ff7a45;
  --mandalina-koyu: #c94a17;
  --seftali: #ffeadf;
  --bal: #f2a93b;
  --bal-koyu: #9a5f08;
  --bal-acik: #fff2d9;
  --gok: #3b9be6;
  --gok-koyu: #1767a8;
  --gok-acik: #e3f2fd;
  --lavanta: #7c6cf0;
  --lavanta-koyu: #5141c9;
  --lavanta-acik: #efedff;
  --gul: #e85a87;
  --gul-koyu: #b52a57;
  --gul-acik: #ffe7ef;
  --ada: #2f9e6e;
  --ada-koyu: #1d7550;
  --ada-acik: #e2f4ea;
  --baslik: "Gabarito", "Plus Jakarta Sans", system-ui, sans-serif;
  --yazi: "Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --egri: cubic-bezier(0.22, 1, 0.36, 1);
}

* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
[hidden] { display: none !important; }
html { background: var(--zemin); }
body {
  margin: 0;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--zemin);
  color: var(--metin);
  font-family: var(--yazi);
  font-size: 15px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
body.sayfa-acik { overflow: hidden; }
button, input, select, textarea { font: inherit; color: inherit; }
button { cursor: pointer; }
a { color: inherit; }
:focus-visible { outline: 3px solid rgba(255, 122, 69, 0.55); outline-offset: 2px; border-radius: 12px; }
h1, h2, h3 { margin: 0; font-family: var(--baslik); letter-spacing: -0.02em; }
.ik { width: 22px; height: 22px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }

.zemin { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
.zemin i { position: absolute; border-radius: 50%; filter: blur(60px); }
.zemin i:nth-child(1) { width: 420px; height: 420px; top: -220px; right: -140px; background: rgba(255, 170, 120, 0.42); }
.zemin i:nth-child(2) { width: 360px; height: 360px; top: -200px; left: -170px; background: rgba(255, 214, 140, 0.4); }
.zemin i:nth-child(3) { width: 520px; height: 520px; bottom: -320px; left: 50%; margin-left: -260px; background: rgba(255, 200, 175, 0.28); }

.uygulama {
  max-width: 560px;
  margin: 0 auto;
  padding: calc(env(safe-area-inset-top) + 18px) 18px calc(env(safe-area-inset-bottom) + 118px);
}
body.canli-var .uygulama { padding-bottom: calc(env(safe-area-inset-bottom) + 186px); }
#ekran { outline: none; }
#ekran.gecis { animation: belir 0.42s var(--egri); }
@keyframes belir { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

/* ── Üst başlık ── */
.ust { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.ust-yazi { margin: 0; font-size: 13.5px; font-weight: 600; color: var(--metin-2); }
.ust h1 { font-size: 29px; line-height: 1.12; font-weight: 700; margin-top: 3px; letter-spacing: -0.025em; }
.yuvarlak-dugme {
  position: relative;
  flex: none;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 17px;
  border: 1px solid var(--cizgi);
  background: rgba(255, 255, 255, 0.9);
  color: var(--metin);
  transition: border-color 0.2s, transform 0.15s;
}
.yuvarlak-dugme:hover { border-color: var(--cizgi-2); }
.yuvarlak-dugme:active { transform: scale(0.95); }
.yuvarlak-dugme.kucuk { width: 44px; height: 44px; border-radius: 15px; }
.rozet {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  border: 2px solid var(--zemin);
  background: var(--mandalina);
  color: #fff;
  font: 800 11.5px var(--yazi);
}
.ekle-dugme {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 46px;
  padding: 0 18px 0 13px;
  border: 0;
  border-radius: 999px;
  background: var(--metin);
  color: #fff;
  font-weight: 700;
  font-size: 14.5px;
  transition: transform 0.15s, background 0.2s;
}
.ekle-dugme:hover { background: #3d2a21; }
.ekle-dugme:active { transform: scale(0.97); }
.ekle-dugme .ik { width: 19px; height: 19px; stroke-width: 2.3; }
.ekle-dugme.acik { background: #fff; color: var(--metin); border: 1px solid var(--cizgi-2); }

/* ── Dost seçici ── */
.dostlar { display: flex; gap: 8px; overflow-x: auto; margin: 0 -18px 16px; padding: 2px 18px 4px; scrollbar-width: none; }
.dostlar::-webkit-scrollbar { display: none; }
.dost {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  height: 50px;
  padding: 0 18px 0 5px;
  border-radius: 999px;
  border: 1px solid var(--cizgi);
  background: rgba(255, 255, 255, 0.92);
  font-weight: 700;
  font-size: 14.5px;
  color: var(--metin-2);
  transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.15s;
}
.dost img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.dost:active { transform: scale(0.97); }
.dost.secili { background: var(--metin); border-color: var(--metin); color: #fff; }
.dost.secili img { box-shadow: 0 0 0 2px var(--metin), 0 0 0 4px var(--mandalina); }
.dost.ekle { width: 50px; padding: 0; justify-content: center; border-style: dashed; border-color: var(--cizgi-2); color: var(--mandalina-koyu); }

/* ── Kahraman ── */
.kahraman { position: relative; height: 206px; margin: 0 0 14px; border-radius: 30px; overflow: hidden; background: var(--seftali); }
.kahraman img { width: 100%; height: 100%; object-fit: cover; display: block; }
.kahraman::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(43, 29, 23, 0) 38%, rgba(43, 29, 23, 0.74) 100%); }
.cam-hap {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 14px 0 12px;
  border-radius: 999px;
  background: rgba(255, 252, 248, 0.82);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  font-size: 13px;
  font-weight: 700;
}
.cam-hap i { width: 8px; height: 8px; border-radius: 50%; background: var(--ada); animation: nabiz 2s ease-in-out infinite; }
@keyframes nabiz { 50% { opacity: 0.4; transform: scale(0.75); } }
.kahraman-alt { position: absolute; left: 20px; right: 20px; bottom: 18px; z-index: 1; color: #fff; }
.kahraman-alt h2 { font-size: 32px; line-height: 1; font-weight: 800; letter-spacing: -0.03em; }
.kahraman-alt p { margin: 7px 0 0; font-size: 14px; font-weight: 600; color: rgba(255, 255, 255, 0.92); }

/* ── Kart ── */
.kart { margin: 0 0 14px; padding: 18px; border-radius: 26px; border: 1px solid var(--cizgi); background: var(--kart); }
.kart-bas { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.kart-bas.ust-hizali { align-items: flex-start; }
.kart-bas h3 { flex: 1; display: flex; align-items: center; gap: 10px; font-size: 17.5px; font-weight: 700; letter-spacing: -0.015em; }
.kart-bas > div { flex: 1; }
.baslik-ik { width: 32px; height: 32px; padding: 6px; border-radius: 11px; background: var(--seftali); color: var(--mandalina-koyu); stroke-width: 2; }
.baslik-ik.bal { background: var(--bal-acik); color: var(--bal-koyu); }
.baslik-ik.gok { background: var(--gok-acik); color: var(--gok-koyu); }
.baslik-ik.lavanta { background: var(--lavanta-acik); color: var(--lavanta-koyu); }
.baslik-ik.gul { background: var(--gul-acik); color: var(--gul-koyu); }
.hap { display: inline-flex; align-items: center; height: 28px; padding: 0 11px; border-radius: 999px; background: #f6efe8; color: var(--metin-2); font-size: 12.5px; font-weight: 700; white-space: nowrap; }
.hap.seftali { background: var(--seftali); color: var(--mandalina-koyu); }
.hap.bal { background: var(--bal-acik); color: var(--bal-koyu); }
.hap.lavanta { background: var(--lavanta-acik); color: var(--lavanta-koyu); }
.metin-dugme {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 44px;
  margin: -10px -8px -10px 0;
  padding: 0 8px;
  border: 0;
  border-radius: 12px;
  background: none;
  color: var(--mandalina-koyu);
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
}
.metin-dugme:hover { background: var(--seftali); }
.metin-dugme .ik { width: 18px; height: 18px; stroke-width: 2.2; }
.metin-dugme.tehlike { margin: 4px 0 8px; color: var(--gul-koyu); }

.ana-dugme {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 54px;
  padding: 0 22px;
  border: 0;
  border-radius: 18px;
  background: linear-gradient(135deg, #ff8b4d 0%, #ff6236 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.15s, filter 0.2s;
}
.ana-dugme:hover { filter: brightness(1.04) saturate(1.05); }
.ana-dugme:active { transform: scale(0.98); }
.ana-dugme.genis { width: 100%; }
.ana-dugme .ik { width: 20px; height: 20px; }
.ana-dugme.tehlike { background: linear-gradient(135deg, #e85a87, #c93a68); }
.ikincil-dugme {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 54px;
  padding: 0 20px;
  border: 1px solid var(--cizgi-2);
  border-radius: 18px;
  background: #fff;
  color: var(--metin);
  font-size: 15.5px;
  font-weight: 700;
  transition: background 0.2s, transform 0.15s;
}
.ikincil-dugme:hover { background: #fdf6f0; }
.ikincil-dugme:active { transform: scale(0.98); }
.ikincil-dugme.genis { width: 100%; }
.ikincil-dugme .ik { width: 19px; height: 19px; }
.ikili { display: grid; grid-template-columns: 1fr 1.25fr; gap: 10px; margin-top: 18px; }

/* ── Aktivite ── */
.halka-satir { display: flex; align-items: center; gap: 20px; }
.halka { position: relative; flex: none; width: 136px; height: 136px; }
.halka-svg { width: 100%; height: 100%; display: block; }
.halka-iz { fill: none; stroke: var(--seftali); stroke-width: 13; }
.halka-dolu { fill: none; stroke-width: 13; stroke-linecap: round; transition: stroke-dasharray 0.9s var(--egri); }
.halka-ic { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; }
.halka-ic b { font: 800 38px/1 var(--baslik); letter-spacing: -0.04em; font-variant-numeric: tabular-nums; }
.halka-ic span { margin-top: 3px; font-size: 13px; font-weight: 700; color: var(--metin-2); }
.mini-istat { flex: 1; min-width: 0; margin: 0; display: grid; }
.mini-istat div { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding: 9px 0; border-bottom: 1px dashed var(--cizgi-2); }
.mini-istat div:first-child { padding-top: 0; }
.mini-istat div:last-child { border-bottom: 0; padding-bottom: 0; }
.mini-istat dt { font-size: 13.5px; font-weight: 600; color: var(--metin-2); }
.mini-istat dd { margin: 0; font: 700 16px var(--baslik); white-space: nowrap; }
.hafta { position: relative; display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; height: 82px; margin: 16px 0 14px; }
.hafta-gun { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 6px; }
.cubuk-kap { width: 100%; max-width: 30px; height: 56px; display: flex; align-items: flex-end; border-radius: 10px; background: #fbf3ec; overflow: hidden; }
.cubuk-kap i { width: 100%; border-radius: 10px; background: #ffd7c4; transition: height 0.6s var(--egri); }
.hafta-gun.tamam .cubuk-kap i { background: #ffae86; }
.hafta-gun.bugun .cubuk-kap i { background: linear-gradient(180deg, #ffbe4d, #ff6a3d); }
.hafta-gun small { font-size: 12px; line-height: 16px; font-weight: 700; color: var(--metin-3); }
.hafta-gun.bugun small { color: var(--mandalina-koyu); }
.hedef-cizgi { position: absolute; left: -4px; right: -4px; border-top: 1.5px dashed rgba(201, 74, 23, 0.4); pointer-events: none; }
.hedef-cizgi::after { content: "Hedef"; position: absolute; right: 0; top: -17px; font-size: 10.5px; font-weight: 800; color: var(--mandalina-koyu); background: #fff; padding: 0 4px; border-radius: 4px; }

.canli-kart { border-color: rgba(255, 122, 69, 0.4); background: linear-gradient(180deg, #ffffff 0%, #fff6f0 100%); }
.canli-bilgi { flex: 1; min-width: 0; display: grid; gap: 6px; }
.canli-etiket { display: inline-flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700; color: var(--mandalina-koyu); }
.canli-etiket i { width: 9px; height: 9px; border-radius: 50%; background: var(--mandalina); animation: nabiz 1.2s ease-in-out infinite; }
.canli-sure { font: 800 42px/1 var(--baslik); letter-spacing: -0.04em; font-variant-numeric: tabular-nums; }
.canli-bilgi small { font-size: 13.5px; font-weight: 600; color: var(--metin-2); }

/* ── Öğünler ── */
.ogunler, .etkinlik-liste, .asi-liste, .ilac-liste, .bilgi-liste, .dost-liste, .ayar-liste, .vet-bilgi { list-style: none; margin: 0; padding: 0; }
.ogunler { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
.ogunler li { display: flex; align-items: center; gap: 12px; padding: 9px 9px 9px 10px; border-radius: 19px; border: 1px solid var(--cizgi); background: var(--kart-2); transition: background 0.25s; }
.ogunler li.verildi { background: #fffaf0; }
.saat { flex: none; min-width: 58px; height: 36px; display: grid; place-items: center; border-radius: 12px; background: var(--bal-acik); color: var(--bal-koyu); font: 700 14.5px var(--baslik); font-variant-numeric: tabular-nums; }
.ogun-metin { flex: 1; min-width: 0; }
.ogun-metin b, .etk-metin b { display: block; font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ogun-metin small { display: block; font-size: 13px; color: var(--metin-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.verildi .ogun-metin b { color: var(--metin-2); }
.tik {
  flex: none;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 2px solid var(--cizgi-2);
  background: #fff;
  color: transparent;
  transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.15s;
}
.tik .ik { width: 20px; height: 20px; stroke-width: 2.8; }
.tik:hover { border-color: var(--ada); color: rgba(47, 158, 110, 0.4); }
.tik:active { transform: scale(0.9); }
.tik[aria-pressed="true"] { background: var(--ada); border-color: var(--ada); color: #fff; }
.tik.bal:hover { border-color: var(--bal); color: rgba(242, 169, 59, 0.5); }
.tik.bal[aria-pressed="true"] { background: var(--bal); border-color: var(--bal); color: #fff; }

/* ── Su ── */
.su-kart { display: flex; align-items: stretch; gap: 16px; }
.kase { flex: none; width: 112px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 12px 8px; border-radius: 20px; background: var(--gok-acik); }
.kase small { font-size: 12px; font-weight: 800; color: var(--gok-koyu); white-space: nowrap; }
.kase-svg { width: 100%; height: auto; display: block; }
.su-sag { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; gap: 14px; }
.su-yuzey { transition: all 0.6s var(--egri); }
.su-bilgi h3 { display: flex; align-items: center; gap: 10px; font-size: 17.5px; font-weight: 700; }
.su-bilgi p { margin: 8px 0 0; font-size: 14px; font-weight: 600; color: var(--metin-2); }
.su-bilgi p b { font: 800 26px var(--baslik); color: var(--metin); letter-spacing: -0.03em; }
.cubuk { height: 8px; margin-top: 8px; border-radius: 99px; background: #f3ebe3; overflow: hidden; }
.cubuk i { display: block; height: 100%; border-radius: 99px; background: var(--mandalina); transition: width 0.6s var(--egri); }
.cubuk.gok i { background: linear-gradient(90deg, #8fd3ff, #3b9be6); }
.cubuk.gul i { background: linear-gradient(90deg, #ffa5c0, #e85a87); }
.su-dugmeler { display: flex; gap: 8px; }
.su-dugmeler button { flex: 1; min-height: 44px; border: 0; border-radius: 14px; background: var(--gok-acik); color: var(--gok-koyu); font-weight: 800; font-size: 14px; transition: background 0.2s, transform 0.15s; }
.su-dugmeler button:hover { background: #d3eafb; }
.su-dugmeler button:active { transform: scale(0.96); }

/* ── Etkinlikler ── */
.etkinlik-liste { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
.etkinlik { display: flex; align-items: center; gap: 12px; padding: 9px 9px 9px 10px; border-radius: 19px; border: 1px solid var(--cizgi); background: var(--kart-2); }
.kartli .etkinlik { background: #fff; }
.tur-ikon { flex: none; width: 46px; height: 46px; display: grid; place-items: center; border-radius: 15px; background: var(--tur-acik); color: var(--tur); }
.etk-metin { flex: 1; min-width: 0; }
.etk-metin small { display: flex; flex-wrap: wrap; align-items: center; gap: 0 4px; margin-top: 1px; font-size: 13px; color: var(--metin-2); }
.kalan { font-weight: 700; color: var(--metin); }
.kalan.yakin { color: var(--mandalina-koyu); }
.kalan.gecti { color: var(--metin-3); }
.mini-dost { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; }
.mini-dost img { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; }
.etkinlik.tamam { background: #faf6f2; }
.etkinlik.tamam .etk-metin b { color: var(--metin-3); text-decoration: line-through; text-decoration-thickness: 1.5px; }
.etkinlik.tamam .tur-ikon { filter: grayscale(0.7); opacity: 0.6; }

/* ── Takvim ── */
.takvim-kart { padding: 14px 12px 12px; }
.ay-bas { display: flex; align-items: center; justify-content: space-between; margin: 0 2px 10px; }
.ay-bas h2 { font-size: 18.5px; font-weight: 700; }
.gun-adlari, .gunler { display: grid; grid-template-columns: repeat(7, 1fr); }
.gun-adlari { margin-bottom: 2px; text-align: center; font-size: 12px; font-weight: 700; color: var(--metin-3); }
.gun-adlari span { padding: 4px 0; }
.gunler { gap: 2px; }
.gun {
  position: relative;
  height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 0;
  border-radius: 15px;
  background: none;
  font: 600 15.5px var(--baslik);
  color: var(--metin);
  transition: background 0.18s;
}
.gun:hover { background: #f9f2eb; }
.gun.disarida { color: #c3b2a6; }
.gun.bugun { box-shadow: inset 0 0 0 1.5px var(--mandalina); }
.gun.bugun span { color: var(--mandalina-koyu); font-weight: 800; }
.gun.secili, .gun.secili:hover { background: var(--metin); }
.gun.secili span { color: #fff; }
.noktalar { display: flex; gap: 3px; height: 5px; }
.noktalar b { width: 5px; height: 5px; border-radius: 50%; }
.gun.secili .noktalar b { box-shadow: 0 0 0 1px var(--metin); }
.filtreler { display: flex; gap: 8px; overflow-x: auto; margin: 0 -18px 4px; padding: 2px 18px 6px; scrollbar-width: none; }
.filtreler::-webkit-scrollbar { display: none; }
.filtre {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid var(--cizgi);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--metin-2);
  font-size: 14px;
  font-weight: 700;
  transition: background 0.2s, color 0.2s;
}
.filtre i { width: 8px; height: 8px; border-radius: 50%; background: var(--tur); }
.filtre.secili { background: var(--metin); border-color: var(--metin); color: #fff; }
.bolum-baslik { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin: 16px 4px 10px; font-size: 17px; font-weight: 700; }
.bolum-baslik span { font: 600 13px var(--yazi); color: var(--metin-2); letter-spacing: 0; }

/* ── Sağlık ── */
.buyuk-sayi { margin: 2px 0 0; font: 800 42px/1 var(--baslik); letter-spacing: -0.04em; }
.buyuk-sayi span { margin-left: 4px; font-size: 18px; font-weight: 700; color: var(--metin-2); letter-spacing: 0; }
.degisim { margin: 7px 0 0; font-size: 13.5px; font-weight: 600; color: var(--metin-2); }
.aralik { flex: none; display: flex; padding: 3px; border-radius: 14px; background: #f6efe8; }
.aralik button { min-height: 38px; padding: 0 11px; border: 0; border-radius: 11px; background: none; color: var(--metin-2); font-size: 13px; font-weight: 700; transition: background 0.2s, color 0.2s; }
.aralik button.secili { background: #fff; color: var(--metin); }
.grafik { margin: 8px -4px 4px; }
.grafik-svg { width: 100%; height: auto; display: block; overflow: visible; }
.grafik-svg .izgara { stroke: #efe4d8; stroke-width: 1; stroke-dasharray: 3 5; }
.grafik-svg .eksen { font: 600 11px var(--yazi); fill: var(--metin-3); }
.grafik-svg .cizgi { fill: none; stroke: var(--mandalina); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.grafik-svg .nokta { fill: #fff; stroke: var(--mandalina); stroke-width: 2.2; }
.grafik-svg .nokta.son { fill: var(--mandalina); stroke: #fff; stroke-width: 3; }
.grafik-svg .ideal-bant { fill: var(--ada-acik); }
.grafik-svg .etiket-kutu rect { fill: var(--metin); }
.grafik-svg .etiket-kutu text { fill: #fff; font: 700 12px var(--baslik); }
.grafik-bos { margin: 10px 0; color: var(--metin-2); font-size: 14px; }
.ideal-satir { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 6px 0 14px; font-size: 13.5px; font-weight: 600; color: var(--metin-2); }
.ideal-renk { width: 14px; height: 14px; border-radius: 4px; background: var(--ada-acik); border: 1px solid #bfe3cf; }
.ideal-satir b { margin-left: auto; padding: 5px 11px; border-radius: 99px; font-size: 12.5px; }
.ideal-satir b.iyi { background: var(--ada-acik); color: var(--ada-koyu); }
.ideal-satir b.dikkat { background: var(--bal-acik); color: var(--bal-koyu); }

.asi-liste li, .ilac-liste li, .bilgi-liste li { border-bottom: 1px solid var(--cizgi); }
.asi-liste li:last-child, .ilac-liste li:last-child, .bilgi-liste li:last-child, .dost-liste li:last-child button, .ayar-liste li:last-child button { border-bottom: 0; }
.asi-liste li { display: flex; align-items: center; gap: 12px; padding: 12px 0; }
.asi-liste li:first-child, .ilac-liste li:first-child, .bilgi-liste li:first-child { padding-top: 0; }
.asi-liste li:last-child, .ilac-liste li:last-child, .bilgi-liste li:last-child { padding-bottom: 0; }
.asi-ikon { flex: none; width: 42px; height: 42px; display: grid; place-items: center; border-radius: 14px; background: var(--lavanta-acik); color: var(--lavanta-koyu); }
.asi-liste li > div, .bilgi-liste li > div { flex: 1; min-width: 0; }
.asi-liste b, .ilac-liste b, .bilgi-liste b { display: block; font-size: 15px; font-weight: 700; }
.asi-liste small, .ilac-liste small, .bilgi-liste small { display: block; font-size: 12.5px; color: var(--metin-2); }
.durum { flex: none; padding: 6px 10px; border-radius: 99px; font-size: 12px; font-weight: 800; white-space: nowrap; }
.durum.gecerli { background: var(--ada-acik); color: var(--ada-koyu); }
.durum.yaklasiyor { background: var(--bal-acik); color: var(--bal-koyu); }
.durum.gecikti { background: var(--gul-acik); color: var(--gul-koyu); }
.ilac-liste li { padding: 12px 0; }
.ilac-ust { display: flex; align-items: center; gap: 10px; }
.ilac-ust > div { flex: 1; min-width: 0; }
.hap-dugme {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 44px;
  padding: 0 16px;
  border: 1.5px solid #f3b6ca;
  border-radius: 999px;
  background: #fff;
  color: var(--gul-koyu);
  font-size: 13.5px;
  font-weight: 700;
  transition: background 0.2s, color 0.2s;
}
.hap-dugme .ik { width: 17px; height: 17px; stroke-width: 2.6; }
.hap-dugme.verildi { background: var(--gul); border-color: var(--gul); color: #fff; }
.ilac-alt { margin-top: 7px; font-weight: 600; }
.zaman-cizelgesi { list-style: none; margin: 0; padding: 0; }
.zaman-cizelgesi li { position: relative; padding: 0 0 16px 26px; }
.zaman-cizelgesi li:last-child { padding-bottom: 0; }
.zaman-cizelgesi li::before { content: ""; position: absolute; left: 6px; top: 16px; bottom: -2px; width: 2px; border-radius: 2px; background: var(--cizgi); }
.zaman-cizelgesi li:last-child::before { display: none; }
.zc-nokta { position: absolute; left: 0; top: 3px; width: 14px; height: 14px; border-radius: 50%; border: 3px solid var(--gok); background: #fff; }
.zaman-cizelgesi small { display: block; font-size: 12.5px; font-weight: 600; color: var(--metin-2); }
.zaman-cizelgesi b { display: block; margin-top: 1px; font-size: 15px; font-weight: 700; }
.zaman-cizelgesi p { margin: 4px 0 0; font-size: 13.5px; line-height: 1.5; color: var(--metin-2); }

/* ── Profil ── */
.profil-kart { margin: 0 0 14px; border-radius: 30px; border: 1px solid var(--cizgi); background: #fff; overflow: hidden; }
.profil-kart img { width: 100%; height: 232px; object-fit: cover; display: block; }
.profil-ozet { display: grid; grid-template-columns: repeat(3, 1fr); }
.profil-ozet div { padding: 14px 10px; text-align: center; border-left: 1px solid var(--cizgi); }
.profil-ozet div:first-child { border-left: 0; }
.profil-ozet small { display: block; font-size: 12.5px; font-weight: 600; color: var(--metin-2); }
.profil-ozet b { display: block; margin-top: 2px; font: 700 16.5px var(--baslik); }
.bilgi-liste li { display: flex; align-items: center; gap: 12px; padding: 12px 0; }
.bilgi-ikon { flex: none; width: 42px; height: 42px; display: grid; place-items: center; border-radius: 14px; background: #f8f1ea; color: var(--metin-2); }
.yan { flex: none; max-width: 40%; text-align: right; font-size: 12.5px; font-weight: 700; color: var(--mandalina-koyu); }
.hedefler { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.hedef { display: grid; gap: 2px; padding: 14px 12px; border-radius: 19px; }
.hedef .ik { width: 24px; height: 24px; margin-bottom: 6px; }
.hedef b { font: 800 19px var(--baslik); letter-spacing: -0.02em; }
.hedef small { font-size: 12.5px; font-weight: 600; color: var(--metin-2); }
.hedef.seftali { background: var(--seftali); color: var(--mandalina-koyu); }
.hedef.bal { background: var(--bal-acik); color: var(--bal-koyu); }
.hedef.gok { background: var(--gok-acik); color: var(--gok-koyu); }
.hedef b { color: var(--metin); }
.vet-ad { display: block; font: 700 18px var(--baslik); }
.vet-hekim { margin: 2px 0 12px; font-size: 14px; color: var(--metin-2); }
.vet-bilgi { display: grid; gap: 8px; margin-bottom: 16px; }
.vet-bilgi li { display: flex; align-items: flex-start; gap: 9px; font-size: 14px; color: var(--metin-2); }
.vet-bilgi .ik { width: 19px; height: 19px; color: var(--gok-koyu); }
.dost-liste button, .ayar-liste button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 10px 0;
  border: 0;
  border-bottom: 1px solid var(--cizgi);
  background: none;
  text-align: left;
}
.dost-liste li:first-child button { padding-top: 0; min-height: 54px; }
.dost-liste img { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; }
.dost-liste button > div { flex: 1; min-width: 0; }
.dost-liste b { display: block; font-size: 15.5px; font-weight: 700; }
.dost-liste small { display: block; font-size: 13px; color: var(--metin-2); }
.ok { color: var(--metin-3); width: 20px; height: 20px; }
.arti-kutu { flex: none; width: 50px; height: 50px; display: grid; place-items: center; border-radius: 50%; border: 1.5px dashed var(--cizgi-2); color: var(--mandalina-koyu); }
.ayar-liste button { min-height: 54px; font-size: 15px; font-weight: 600; color: var(--metin); }
.ayar-liste li:first-child button { padding-top: 0; min-height: 44px; }
.ayar-liste li:last-child button { padding-bottom: 0; min-height: 44px; }
.ayar-liste button > span { flex: 1; }
.ayar-liste button > b { font-weight: 700; color: var(--metin-2); }
.ayar-liste button > .ik:first-child { color: var(--metin-2); }
.ayar-liste .tehlike, .ayar-liste .tehlike > .ik:first-child { color: var(--gul-koyu); }
.dip-not { margin: 18px 0 0; text-align: center; font-size: 12.5px; color: var(--metin-3); }

/* ── Boş durum ── */
.bos { display: grid; justify-items: center; gap: 4px; padding: 10px 10px 4px; text-align: center; }
.bos-ikon { width: 54px; height: 54px; display: grid; place-items: center; margin-bottom: 6px; border-radius: 19px; background: #f8f1ea; color: var(--metin-2); }
.bos b { font-size: 15.5px; }
.bos p { margin: 0 0 4px; font-size: 13.5px; color: var(--metin-2); }
.bos .metin-dugme { margin: 0; }

/* ── Alt sekme çubuğu ── */
.sekmeler {
  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom) + 12px);
  z-index: 20;
  width: min(524px, calc(100% - 24px));
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  padding: 6px;
  border-radius: 26px;
  border: 1px solid var(--cizgi);
  background: rgba(255, 252, 248, 0.86);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  transform: translateX(-50%);
}
.sekmeler button {
  min-height: 56px;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 3px;
  border: 0;
  border-radius: 20px;
  background: none;
  color: var(--metin-3);
  font-size: 11.5px;
  font-weight: 700;
  transition: background 0.25s, color 0.25s;
}
.sekmeler button:hover { color: var(--metin); }
.sekmeler .ik { width: 23px; height: 23px; }
.sekmeler button.secili { background: var(--metin); color: #fff; }
.sekmeler button.secili .ik { color: #ffb48f; }

/* ── Canlı aktivite hapı ── */
.canli {
  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom) + 94px);
  z-index: 19;
  width: min(500px, calc(100% - 40px));
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: 24px;
  background: var(--metin);
  color: #fff;
  transform: translateX(-50%);
  animation: yukari 0.45s var(--egri);
}
@keyframes yukari { from { opacity: 0; transform: translate(-50%, 16px); } to { opacity: 1; transform: translate(-50%, 0); } }
.canli-ac { flex: 1; min-width: 0; min-height: 48px; display: flex; align-items: center; gap: 10px; border: 0; background: none; color: inherit; text-align: left; }
.canli-ac img { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; box-shadow: 0 0 0 2px var(--mandalina); }
.canli-ac small { display: block; font-size: 12px; font-weight: 600; color: rgba(255, 255, 255, 0.72); }
.canli-ac b { font: 800 19px var(--baslik); font-variant-numeric: tabular-nums; }
.canli-bitir { flex: none; width: 48px; height: 48px; display: grid; place-items: center; border: 0; border-radius: 18px; background: var(--mandalina); color: #fff; }

/* ── Alt sayfa ve formlar ── */
.perde { position: fixed; inset: 0; z-index: 30; background: rgba(43, 29, 23, 0.38); opacity: 0; transition: opacity 0.28s; }
.perde.acik { opacity: 1; }
.sayfa {
  position: fixed;
  left: 50%;
  bottom: 0;
  z-index: 31;
  width: min(560px, 100%);
  max-height: 90vh;
  max-height: 90dvh;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 8px 20px calc(env(safe-area-inset-bottom) + 18px);
  border-radius: 30px 30px 0 0;
  background: #fffaf6;
  transform: translate(-50%, 100%);
  transition: transform 0.34s var(--egri);
}
.sayfa.acik { transform: translate(-50%, 0); }
@media (min-width: 640px) {
  .sayfa { bottom: 24px; border-radius: 30px; max-height: calc(100vh - 48px); transform: translate(-50%, calc(100% + 40px)); }
}
.tutamak { width: 42px; height: 5px; margin: 4px auto 12px; border-radius: 99px; background: var(--cizgi-2); }
.sayfa-bas { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.sayfa-bas h2 { font-size: 22px; font-weight: 700; }
.alan { display: grid; gap: 7px; min-width: 0; margin: 0 0 14px; padding: 0; border: 0; }
.alan > span, .alan legend { padding: 0; font-size: 13.5px; font-weight: 700; color: var(--metin-2); }
.alan legend { margin-bottom: 7px; }
.alan input, .alan select, .alan textarea {
  width: 100%;
  min-height: 52px;
  padding: 12px 14px;
  border: 1.5px solid var(--cizgi-2);
  border-radius: 16px;
  background: #fff;
  font-size: 15.5px;
  font-weight: 600;
  transition: border-color 0.2s, box-shadow 0.2s;
  -webkit-appearance: none;
  appearance: none;
}
.alan select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b5a50' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; background-size: 18px; padding-right: 40px; }
.alan textarea { min-height: 84px; resize: vertical; line-height: 1.45; }
.alan input::placeholder, .alan textarea::placeholder { color: #a8968a; font-weight: 500; }
.alan input:focus, .alan select:focus, .alan textarea:focus { outline: none; border-color: var(--mandalina); box-shadow: 0 0 0 4px rgba(255, 122, 69, 0.16); }
.alan [aria-invalid="true"] { border-color: var(--gul); }
.alan small { font-size: 12.5px; color: var(--metin-2); }
.ikili-alan { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.secenekler { display: flex; flex-wrap: wrap; gap: 8px; }
.secenek { position: relative; }
.secenek input { position: absolute; opacity: 0; pointer-events: none; }
.secenek span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 46px;
  padding: 0 15px;
  border: 1.5px solid var(--cizgi-2);
  border-radius: 15px;
  background: #fff;
  color: var(--metin-2);
  font-size: 14.5px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, color 0.2s;
}
.secenek span .ik { width: 19px; height: 19px; color: var(--tur, var(--mandalina)); }
.secenek input:checked + span { border-color: var(--tur, var(--mandalina)); background: color-mix(in srgb, var(--tur, #ff7a45) 10%, #ffffff); color: var(--metin); }
.secenek input:focus-visible + span { outline: 3px solid rgba(255, 122, 69, 0.5); outline-offset: 2px; }
.foto-sec { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.foto-sec label { position: relative; aspect-ratio: 1.2; border-radius: 16px; overflow: hidden; cursor: pointer; background: var(--seftali); }
.foto-sec input { position: absolute; opacity: 0; pointer-events: none; }
.foto-sec img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s var(--egri); }
.foto-sec label:hover img { transform: scale(1.04); }
.foto-sec i { position: absolute; top: 7px; right: 7px; width: 26px; height: 26px; display: none; place-items: center; border-radius: 50%; background: var(--mandalina); color: #fff; }
.foto-sec i .ik { width: 16px; height: 16px; stroke-width: 3; }
.foto-sec input:checked ~ i { display: grid; }
.foto-sec input:checked ~ img { outline: 3px solid var(--mandalina); outline-offset: -3px; border-radius: 16px; }
.foto-sec input:focus-visible ~ img { outline: 3px solid var(--metin); outline-offset: -3px; }
.anahtar { display: flex; align-items: center; gap: 12px; min-height: 48px; margin: -2px 0 12px; font-size: 15px; font-weight: 700; cursor: pointer; }
.anahtar input { position: absolute; opacity: 0; pointer-events: none; }
.ray { position: relative; flex: none; width: 50px; height: 30px; border-radius: 99px; background: var(--cizgi-2); transition: background 0.2s; }
.ray::after { content: ""; position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; transition: transform 0.25s var(--egri); }
.anahtar input:checked + .ray { background: var(--ada); }
.anahtar input:checked + .ray::after { transform: translateX(20px); }
.anahtar input:focus-visible + .ray { outline: 3px solid rgba(255, 122, 69, 0.5); outline-offset: 2px; }
.sayfa-alt { position: sticky; bottom: calc(-1 * (env(safe-area-inset-bottom) + 18px)); display: flex; gap: 10px; margin: 6px -20px 0; padding: 12px 20px calc(env(safe-area-inset-bottom) + 18px); background: linear-gradient(180deg, rgba(255, 250, 246, 0) 0%, #fffaf6 28%); }
.sayfa-alt .ikincil-dugme { flex: none; }
.form-hata { margin: 0 0 4px; font-size: 14px; font-weight: 700; color: var(--gul-koyu); }
.form-not { margin: -4px 0 14px; font-size: 13.5px; line-height: 1.5; color: var(--metin-2); }
.uyari-kutu { display: flex; gap: 12px; padding: 14px; border-radius: 18px; background: var(--gul-acik); color: #7d1e3d; }
.uyari-kutu .ik { width: 24px; height: 24px; }
.uyari-kutu p { margin: 0; font-weight: 600; line-height: 1.5; }
.ozet-satir { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.ozet-satir img { width: 54px; height: 54px; border-radius: 50%; object-fit: cover; }
.ozet-satir b { display: block; font: 700 18px var(--baslik); }
.ozet-satir small { color: var(--metin-2); font-weight: 600; }
.ozet { display: grid; grid-template-columns: repeat(auto-fit, minmax(92px, 1fr)); gap: 8px; margin: 0 0 16px; }
.ozet div { padding: 12px 14px; border: 1px solid var(--cizgi); border-radius: 17px; background: #fff; }
.ozet dt { font-size: 12.5px; font-weight: 700; color: var(--metin-2); }
.ozet dd { margin: 4px 0 0; font: 800 23px var(--baslik); letter-spacing: -0.03em; }

/* ── Bildirim ── */
.tost {
  position: fixed;
  left: 0;
  right: 0;
  top: calc(env(safe-area-inset-top) + 14px);
  z-index: 40;
  width: max-content;
  max-width: calc(100% - 32px);
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 18px 12px 14px;
  border-radius: 999px;
  background: var(--metin);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  transform: translateY(calc(-100% - 30px));
  transition: transform 0.4s var(--egri);
  pointer-events: none;
}
.tost.acik { transform: none; }
.tost .ik { width: 20px; height: 20px; color: #8be0b4; stroke-width: 2.6; }

@media (max-width: 380px) {
  .uygulama { padding-left: 14px; padding-right: 14px; }
  .dostlar, .filtreler { margin-left: -14px; margin-right: -14px; padding-left: 14px; padding-right: 14px; }
  .halka { width: 120px; height: 120px; }
  .halka-satir { gap: 14px; }
  .ust h1 { font-size: 26px; }
}
@media (min-width: 720px) {
  .uygulama { padding-top: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
`,
    "app.js": `/* Evcil Dostum — evcil hayvan bakım uygulaması (PWA). Veriler yalnız bu cihazda (localStorage) saklanır.
   Sekmeler: Bugün, Takvim, Sağlık, Profil. Örnek veriler bugünün tarihine göre üretilir. */
(function () {
  "use strict";

  var ANAHTAR = "evcil-dostum-v2";
  var GORSEL = "/gercek/havuz/gorsel/";
  var AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  var AY_KISA = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  var GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  var GUN_BAS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  /* ── Yardımcılar ── */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function bugun() { return iso(new Date()); }
  function gun(n) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return iso(d); }
  function oku(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function fark(s) { return Math.round((oku(s) - oku(bugun())) / 864e5); }
  function tarihYaz(s, gunAdi) { var d = oku(s); return d.getDate() + " " + AYLAR[d.getMonth()] + (gunAdi ? " " + GUNLER[d.getDay()] : ""); }
  function tarihTam(s) { var d = oku(s); return d.getDate() + " " + AYLAR[d.getMonth()] + " " + d.getFullYear(); }
  function goreli(s) {
    var f = fark(s);
    if (f === 0) return "Bugün";
    if (f === 1) return "Yarın";
    if (f === -1) return "Dün";
    return f > 0 ? f + " gün sonra" : -f + " gün önce";
  }
  function yas(dogum) {
    if (!dogum) return "Yaşı bilinmiyor";
    var d = oku(dogum), b = new Date();
    var ay = (b.getFullYear() - d.getFullYear()) * 12 + (b.getMonth() - d.getMonth()) - (b.getDate() < d.getDate() ? 1 : 0);
    if (ay < 1) return "Yeni doğan";
    if (ay < 12) return ay + " aylık";
    var y = Math.floor(ay / 12), k = ay % 12;
    return y + " yaş" + (k ? " " + k + " ay" : "");
  }
  function saatSimdi() { var d = new Date(); return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function selam() { var h = new Date().getHours(); return h < 5 ? "İyi geceler" : h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar"; }
  function ondalik(n, k) { return Number(n).toLocaleString("tr-TR", { minimumFractionDigits: k, maximumFractionDigits: k }); }
  function kiloYaz(n) { return n < 1 ? Math.round(n * 1000) + " g" : ondalik(n, 1) + " kg"; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function kimlik() { return Math.random().toString(36).slice(2, 9); }
  function tohumlu(t) { return function () { t = (t * 9301 + 49297) % 233280; return t / 233280; }; }
  function sureYaz(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sn = s % 60;
    return (h ? h + ":" + pad(m) : pad(m)) + ":" + pad(sn);
  }

  /* ── Simgeler ── */
  var IK = {
    gunes: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2.6 12h2.2M19.2 12h2.2M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5"/>',
    takvim: '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    kalp: '<path d="M12 20s-7.6-4.5-7.6-10.2A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 7.6 2.6C19.6 15.5 12 20 12 20z"/><path d="M7.6 12.2h2.1l1.3-2.3 2 4 1.3-1.7h2.1"/>',
    pati: '<ellipse cx="6.6" cy="10" rx="1.7" ry="2.1"/><ellipse cx="10" cy="6.4" rx="1.7" ry="2.1"/><ellipse cx="14.2" cy="6.4" rx="1.7" ry="2.1"/><ellipse cx="17.5" cy="10" rx="1.7" ry="2.1"/><path d="M12 12.2c-2.7 0-5.1 2.7-5.1 4.8 0 1.6 1.4 2.5 3 2 .8-.2 1.4-.5 2.1-.5s1.3.3 2.1.5c1.6.5 3-.4 3-2 0-2.1-2.4-4.8-5.1-4.8z"/>',
    arti: '<path d="M12 5v14M5 12h14"/>',
    zil: '<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.6h-15z"/><path d="M10 20.4a2.1 2.1 0 0 0 4 0"/>',
    oynat: '<path d="M8 5.6v12.8l10.4-6.4z" fill="currentColor" stroke="none"/>',
    duraklat: '<path d="M9 6.5v11M15 6.5v11"/>',
    bitir: '<rect x="6.5" y="6.5" width="11" height="11" rx="2.6" fill="currentColor" stroke="none"/>',
    tik: '<path d="m5.5 12.5 4 4 9-9"/>',
    sag: '<path d="m9.5 6 6 6-6 6"/>',
    sol: '<path d="m14.5 6-6 6 6 6"/>',
    asi: '<path d="m17.5 3 3.5 3.5M19.2 4.8l-3 3"/><path d="m14.6 5.4 4 4-8.9 8.9H5.7v-4z"/><path d="m8.8 11.2 1.9 1.9M11.7 8.3l1.9 1.9M3 21l2.7-2.7"/>',
    vet: '<path d="M6.2 3.5H5.3A1.8 1.8 0 0 0 3.5 5.3v3.9a5 5 0 0 0 10 0V5.3a1.8 1.8 0 0 0-1.8-1.8h-.9"/><path d="M8.5 14.2v1.3a5 5 0 0 0 10 0v-2.6"/><circle cx="18.5" cy="10.8" r="2.1"/>',
    ilac: '<rect x="2.7" y="8.6" width="18.6" height="6.8" rx="3.4" transform="rotate(-45 12 12)"/><path d="m8.6 8.6 6.8 6.8"/>',
    bakim: '<path d="M11 3.5l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z"/><path d="M18 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    mama: '<path d="M3.5 12h17l-1.5 5a3.2 3.2 0 0 1-3 2.3H8a3.2 3.2 0 0 1-3-2.3z"/><circle cx="9" cy="8.8" r="1.4"/><circle cx="12.6" cy="7.6" r="1.4"/><circle cx="15.8" cy="9.2" r="1.4"/>',
    damla: '<path d="M12 3.5c3.1 3.8 5.6 7 5.6 10a5.6 5.6 0 0 1-11.2 0c0-3 2.5-6.2 5.6-10z"/>',
    tarti: '<rect x="3.5" y="4" width="17" height="16.5" rx="4.5"/><path d="M8.2 10a5.3 5.3 0 0 1 7.6 0"/><path d="m12 10.2 1.4-1.9"/>',
    telefon: '<path d="M6.6 3.5h2.9l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5v2.9a2 2 0 0 1-2.1 2A16 16 0 0 1 4.6 5.6a2 2 0 0 1 2-2.1z"/>',
    konum: '<path d="M12 21s-6.6-5.7-6.6-11.1a6.6 6.6 0 0 1 13.2 0C18.6 15.3 12 21 12 21z"/><circle cx="12" cy="9.9" r="2.4"/>',
    pasta: '<path d="M4 20.5h16M5 20.5v-6.8a2.2 2.2 0 0 1 2.2-2.2h9.6a2.2 2.2 0 0 1 2.2 2.2v6.8"/><path d="M5 15.6c1.2 1 2.3 1 3.5 0s2.3-1 3.5 0 2.3 1 3.5 0 2.3-1 3.5 0"/><path d="M12 11.5V8.4"/><path d="M12 4.2c.9 1 1.2 1.7.9 2.3a1 1 0 0 1-1.8 0c-.3-.6 0-1.3.9-2.3z"/>',
    kimlik: '<rect x="3" y="5" width="18" height="14" rx="3.2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16.2c.6-1.4 1.8-2.2 3.2-2.2s2.6.8 3.2 2.2M14.5 10h4M14.5 13.5h3"/>',
    cip: '<rect x="6.5" y="6.5" width="11" height="11" rx="2.4"/><rect x="9.6" y="9.6" width="4.8" height="4.8" rx="1"/><path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3"/>',
    kalkan: '<path d="M12 3.4 5 6v5.6c0 4.2 3 7.8 7 9 4-1.2 7-4.8 7-9V6z"/><path d="m9 12 2.1 2.1L15.2 10"/>',
    uyari: '<path d="M12 4.2 2.9 19.6h18.2z"/><path d="M12 10v4.4M12 17v.1"/>',
    cop: '<path d="M4.5 7h15M9.5 7V4.6h5V7M6.5 7l1 13h9l1-13"/>',
    kalem: '<path d="M4 20h4L19.4 8.6a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.6 6.4 4 4"/>',
    saat: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.6V12l3 2"/>',
    not: '<path d="M6 3.5h9l4 4v13H6z"/><path d="M14.6 3.5V8h4.4M9 12.6h6.6M9 16.2h4.6"/>',
    kapat: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    yol: '<path d="M5 19.5c2-4.5 4.5-6 7-6s4-1.5 4-4-1.6-4-4-4"/><circle cx="5" cy="19.5" r="1.6"/><circle cx="12" cy="5.5" r="1.6"/>',
    yildiz: '<path d="M12 3.6l2.5 5.1 5.6.8-4 4 .9 5.6-5-2.6-5 2.6.9-5.6-4-4 5.6-.8z"/>',
    ev: '<path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-4v-6h-5v6h-4A1.5 1.5 0 0 1 4 19z"/>',
    yenile: '<path d="M4.5 12a7.5 7.5 0 0 1 13-5.1L19.5 9M19.5 4.5V9H15M19.5 12a7.5 7.5 0 0 1-13 5.1L4.5 15M4.5 19.5V15H9"/>',
    kisi: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.8 20c1-3.6 3.9-5.6 7.2-5.6s6.2 2 7.2 5.6"/>',
  };
  function ikon(ad, sinif) { return '<svg class="ik' + (sinif ? " " + sinif : "") + '" viewBox="0 0 24 24" aria-hidden="true">' + (IK[ad] || "") + "</svg>"; }

  var TURLER = {
    asi: { ad: "Aşı", ikon: "asi", renk: "#7c6cf0", acik: "#eeebff" },
    veteriner: { ad: "Veteriner", ikon: "vet", renk: "#2f95dc", acik: "#e2f1fc" },
    ilac: { ad: "İlaç", ikon: "ilac", renk: "#e85a87", acik: "#ffe6ee" },
    bakim: { ad: "Bakım", ikon: "bakim", renk: "#2f9e6e", acik: "#e0f4ea" },
  };
  var AKTIVITE = {
    yuruyus: { ad: "Yürüyüş", cogul: "yürüyüş", basla: "Yürüyüşe çık", suruyor: "Yürüyüş sürüyor", km: 0.045 },
    ucus: { ad: "Uçuş", cogul: "uçuş", basla: "Uçuş saatini başlat", suruyor: "Uçuş saati sürüyor", km: 0 },
    gunes: { ad: "Güneşlenme", cogul: "seans", basla: "Güneşlenmeyi başlat", suruyor: "Güneşlenme sürüyor", km: 0 },
    oyun: { ad: "Oyun", cogul: "oyun", basla: "Oyun saatini başlat", suruyor: "Oyun saati sürüyor", km: 0 },
  };
  var TEKRAR = { yok: "Tekrar yok", gun: "Her gün", hafta: "Her hafta", ay: "Her ay", yil: "Her yıl" };
  var FOTOLAR = [
    { dosya: "mk-hayvan-22732", ad: "Turuncu kedi", konum: "50% 36%" },
    { dosya: "mk-hayvan-22732-b", ad: "Kedi, yakın", konum: "50% 40%" },
    { dosya: "mk-hayvan-4669", ad: "Ara papağanı", konum: "35% 40%" },
    { dosya: "mk-hayvan-4649", ad: "Papağan çifti", konum: "62% 40%" },
    { dosya: "mk-hayvan-1489", ad: "Bukalemun", konum: "40% 45%" },
    { dosya: "mk-hayvan-1489-b", ad: "Bukalemun, yan", konum: "40% 45%" },
  ];

  /* ── Örnek veri ── */
  function ornekVeri() {
    function dogum(ayOnce) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(12); d.setMonth(d.getMonth() - ayOnce); return iso(d); }
    function aylik(liste) {
      return liste.map(function (k, i) { return { tarih: gun(-(liste.length - 1 - i) * 30), kg: k }; });
    }
    var kayit = {};
    var r = tohumlu(42);
    var ornekler = {
      pamuk: { hedef: 40, kmDk: 0.045, ogunSay: 3, suH: 250 },
      mango: { hedef: 60, kmDk: 0, ogunSay: 3, suH: 200 },
      fistik: { hedef: 30, kmDk: 0, ogunSay: 2, suH: 60 },
    };
    for (var g = -6; g <= 0; g++) {
      var t = gun(g);
      kayit[t] = {};
      Object.keys(ornekler).forEach(function (id) {
        var o = ornekler[id];
        if (g === 0) return;
        var dk1 = Math.round(o.hedef * (0.35 + r() * 0.45)), dk2 = Math.round(o.hedef * (0.2 + r() * 0.5));
        kayit[t][id] = {
          aktivite: [
            { saat: "08:" + pad(Math.floor(r() * 50)), dk: dk1, km: +(dk1 * o.kmDk).toFixed(2), his: "Enerjik" },
            { saat: "18:" + pad(Math.floor(r() * 50)), dk: dk2, km: +(dk2 * o.kmDk).toFixed(2), his: "Normal" },
          ],
          ogun: { o1: true, o2: true, o3: true, m1: true, m2: true, m3: true, f1: true, f2: true },
          su: Math.round(o.suH * (0.75 + r() * 0.3)),
        };
      });
    }
    kayit[gun(0)] = {
      pamuk: { aktivite: [{ saat: "08:10", dk: 14, km: 0.63, his: "Enerjik" }, { saat: "12:35", dk: 10, km: 0.45, his: "Normal" }], ogun: { o1: true, o2: true }, su: 150 },
      mango: { aktivite: [{ saat: "09:00", dk: 25, km: 0, his: "Enerjik" }], ogun: { m1: true }, su: 120 },
      fistik: { aktivite: [{ saat: "10:30", dk: 20, km: 0, his: "Normal" }], ogun: {}, su: 30 },
    };
    return {
      surum: 2,
      sahip: "Elif",
      aktif: "pamuk",
      hayvanlar: [
        { id: "pamuk", ad: "Pamuk", tur: "Kedi", cins: "Sarman tekir", dogum: dogum(19), cinsiyet: "Dişi", kisir: true, cip: "900 164 000 482 317", alerji: "Tavuk proteini", foto: "mk-hayvan-22732", konum: "50% 36%", aktivite: "yuruyus", ruh: "Keyfi yerinde", ideal: [3.6, 4.6], hedef: { aktivite: 40, su: 250 } },
        { id: "mango", ad: "Mango", tur: "Papağan", cins: "Yeşil kanatlı ara", dogum: dogum(50), cinsiyet: "Erkek", kisir: false, cip: "900 164 000 219 044", alerji: "Yok", foto: "mk-hayvan-4669", konum: "35% 40%", aktivite: "ucus", ruh: "Çok konuşkan", ideal: [1.05, 1.3], hedef: { aktivite: 60, su: 200 } },
        { id: "fistik", ad: "Fıstık", tur: "Bukalemun", cins: "Peçeli bukalemun", dogum: dogum(14), cinsiyet: "Erkek", kisir: false, cip: "Yok", alerji: "Yok", foto: "mk-hayvan-1489", konum: "40% 45%", aktivite: "gunes", ruh: "Sakin ve meraklı", ideal: [0.1, 0.17], hedef: { aktivite: 30, su: 60 } },
      ],
      ogunler: {
        pamuk: [
          { id: "o1", saat: "08:00", ad: "Sabah öğünü", miktar: "40 g", mama: "Somonlu kuru mama" },
          { id: "o2", saat: "13:00", ad: "Öğle öğünü", miktar: "1 poşet", mama: "Ton balıklı yaş mama" },
          { id: "o3", saat: "19:30", ad: "Akşam öğünü", miktar: "35 g", mama: "Somonlu kuru mama" },
        ],
        mango: [
          { id: "m1", saat: "08:30", ad: "Kahvaltı", miktar: "30 g", mama: "Tohum ve pelet karışımı" },
          { id: "m2", saat: "14:00", ad: "Meyve tabağı", miktar: "1 kase", mama: "Elma, havuç, nar" },
          { id: "m3", saat: "19:00", ad: "Akşam öğünü", miktar: "25 g", mama: "Pelet" },
        ],
        fistik: [
          { id: "f1", saat: "11:00", ad: "Öğle avı", miktar: "6 adet", mama: "Çekirge, kalsiyum tozlu" },
          { id: "f2", saat: "17:00", ad: "Akşam avı", miktar: "4 adet", mama: "Un kurdu" },
        ],
      },
      kayit: kayit,
      etkinlikler: [
        { id: "e1", hayvan: "pamuk", tur: "ilac", baslik: "Probiyotik takviyesi", tarih: gun(-5), saat: "20:00", tekrar: "gun", bitis: gun(4), not: "Yaş mamanın içine karıştır.", tamam: {} },
        { id: "e2", hayvan: "pamuk", tur: "bakim", baslik: "Pire ve kene damlası", tarih: gun(2), saat: "10:00", tekrar: "ay", not: "Ense bölgesine tek doz.", tamam: {} },
        { id: "e3", hayvan: "pamuk", tur: "asi", baslik: "Karma aşı (rapel)", tarih: gun(7), saat: "11:30", tekrar: "yok", not: "Patiler Veteriner Kliniği, aşı karnesini götür.", tamam: {} },
        { id: "e4", hayvan: "mango", tur: "veteriner", baslik: "Gaga ve tırnak kontrolü", tarih: gun(4), saat: "16:00", tekrar: "yok", not: "Taşıma kafesini hazırla.", tamam: {} },
        { id: "e5", hayvan: "fistik", tur: "bakim", baslik: "UVB lambası değişimi", tarih: gun(1), saat: "09:30", tekrar: "yok", not: "Yeni lamba 12 ay dayanır.", tamam: {} },
        { id: "e6", hayvan: "pamuk", tur: "bakim", baslik: "Tırnak ve tüy bakımı", tarih: gun(12), saat: "15:00", tekrar: "yok", not: "", tamam: {} },
        { id: "e7", hayvan: "pamuk", tur: "asi", baslik: "Kuduz aşısı", tarih: gun(19), saat: "11:00", tekrar: "yok", not: "", tamam: {} },
        { id: "e8", hayvan: "pamuk", tur: "veteriner", baslik: "Genel kontrol", tarih: gun(-3), saat: "14:30", tekrar: "yok", not: "", tamam: {} },
        { id: "e9", hayvan: "fistik", tur: "ilac", baslik: "Kalsiyum ve D3 takviyesi", tarih: gun(-2), saat: "11:00", tekrar: "hafta", not: "Avın üstüne serp.", tamam: {} },
        { id: "e10", hayvan: "mango", tur: "bakim", baslik: "Kafes temizliği", tarih: gun(-1), saat: "18:00", tekrar: "hafta", not: "", tamam: {} },
      ],
      kilolar: {
        pamuk: aylik([2.9, 3.1, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9, 4.0, 4.0, 4.1, 4.2]),
        mango: aylik([1.12, 1.14, 1.13, 1.15, 1.16, 1.14, 1.15, 1.17, 1.16, 1.18, 1.17, 1.18]),
        fistik: aylik([0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.115, 0.12, 0.125, 0.13, 0.135, 0.14]),
      },
      asilar: {
        pamuk: [
          { id: "a1", ad: "Karma aşı", yapildi: gun(-358), sonraki: gun(7) },
          { id: "a2", ad: "Kuduz aşısı", yapildi: gun(-346), sonraki: gun(19) },
          { id: "a3", ad: "İç parazit", yapildi: gun(-40), sonraki: gun(50) },
          { id: "a4", ad: "Lösemi (FeLV)", yapildi: gun(-200), sonraki: gun(165) },
        ],
        mango: [
          { id: "a5", ad: "Polyomavirüs aşısı", yapildi: gun(-300), sonraki: gun(65) },
          { id: "a6", ad: "Parazit taraması", yapildi: gun(-62), sonraki: gun(28) },
        ],
        fistik: [{ id: "a7", ad: "Parazit taraması", yapildi: gun(-90), sonraki: gun(90) }],
      },
      ilaclar: {
        pamuk: [
          { id: "i1", ad: "Probiyotik", doz: "Günde 1 ölçek", gun: 10, verilen: 6, son: gun(-1) },
          { id: "i2", ad: "Omega-3 yağı", doz: "Haftada 3 gün, 1 pompa", gun: 0, verilen: 0, son: gun(-2) },
        ],
        mango: [{ id: "i3", ad: "Vitamin damlası", doz: "Suyuna 3 damla", gun: 14, verilen: 9, son: gun(-1) }],
        fistik: [{ id: "i4", ad: "Kalsiyum tozu", doz: "Her öğüne bir tutam", gun: 0, verilen: 0, son: gun(-1) }],
      },
      ziyaretler: {
        pamuk: [
          { id: "z1", tarih: gun(-3), neden: "Genel kontrol", not: "Kilosu ideal aralıkta, dişleri temiz. Sonraki kontrol altı ay sonra." },
          { id: "z2", tarih: gun(-74), neden: "Kısırlaştırma sonrası kontrol", not: "Dikişler alındı, iyileşme sorunsuz." },
          { id: "z3", tarih: gun(-88), neden: "Kısırlaştırma operasyonu", not: "Operasyon başarılı geçti, on gün koruyucu yaka kullanıldı." },
        ],
        mango: [{ id: "z4", tarih: gun(-45), neden: "Gaga ve tırnak bakımı", not: "Gaga törpülendi, tüyleri parlak ve sağlıklı." }],
        fistik: [{ id: "z5", tarih: gun(-30), neden: "İlk muayene", not: "UVB ışık süresi günde 10 saate çıkarılacak, nem yüzde 60 civarında tutulacak." }],
      },
      veteriner: { klinik: "Patiler Veteriner Kliniği", hekim: "Vet. Hek. Deniz Arslan", tel: "0216 555 01 42", adres: "Moda Cad. No: 41, Kadıköy, İstanbul", saat: "Her gün 09:00 ile 21:00 arası" },
      canli: null,
    };
  }

  var V;
  try { V = JSON.parse(localStorage.getItem(ANAHTAR) || "null"); } catch (e) { V = null; }
  if (!V || V.surum !== 2 || !V.hayvanlar || !V.hayvanlar.length) V = ornekVeri();
  function kaydet() { try { localStorage.setItem(ANAHTAR, JSON.stringify(V)); } catch (e) {} }
  kaydet();

  /* ── Veri erişimi ── */
  function hayvan(id) { return V.hayvanlar.filter(function (h) { return h.id === (id || V.aktif); })[0] || V.hayvanlar[0]; }
  function foto(h) { return GORSEL + h.foto + ".webp"; }
  function gunKaydi(t, id) {
    V.kayit[t] = V.kayit[t] || {};
    V.kayit[t][id] = V.kayit[t][id] || { aktivite: [], ogun: {}, su: 0 };
    return V.kayit[t][id];
  }
  function toplamDk(t, id) {
    var k = V.kayit[t] && V.kayit[t][id];
    return k ? k.aktivite.reduce(function (a, x) { return a + x.dk; }, 0) : 0;
  }
  function sonKilo(id) { var l = V.kilolar[id] || []; return l.length ? l[l.length - 1].kg : null; }
  function tekrarlar(e, a, b) {
    var cikti = [], d = oku(e.tarih), son = e.bitis ? oku(e.bitis) : null, sayac = 0;
    if (e.tekrar === "yok" || !e.tekrar) { if (d >= a && d <= b) cikti.push(iso(d)); return cikti; }
    while (d <= b && sayac++ < 900) {
      if (son && d > son) break;
      if (d >= a) cikti.push(iso(d));
      if (e.tekrar === "gun") d.setDate(d.getDate() + 1);
      else if (e.tekrar === "hafta") d.setDate(d.getDate() + 7);
      else if (e.tekrar === "ay") d.setMonth(d.getMonth() + 1);
      else d.setFullYear(d.getFullYear() + 1);
    }
    return cikti;
  }
  function olaylar(a, b, filtre) {
    var l = [];
    V.etkinlikler.forEach(function (e) {
      if (filtre && filtre.hayvan && e.hayvan !== filtre.hayvan) return;
      if (filtre && filtre.tur && filtre.tur !== "tumu" && e.tur !== filtre.tur) return;
      if (!hayvan(e.hayvan) || hayvan(e.hayvan).id !== e.hayvan) return;
      tekrarlar(e, oku(a), oku(b)).forEach(function (t) { l.push({ e: e, tarih: t, tamam: !!(e.tamam && e.tamam[t]) }); });
    });
    return l.sort(function (x, y) { return (x.tarih + x.e.saat).localeCompare(y.tarih + y.e.saat); });
  }
  function yaklasanlar(gunSay, filtre) {
    return olaylar(gun(0), gun(gunSay), filtre).filter(function (o) { return !o.tamam; });
  }
  function tekil(l) {
    var gorulen = {};
    return l.filter(function (o) { if (gorulen[o.e.id]) return false; gorulen[o.e.id] = true; return true; });
  }

  /* ── Durum ── */
  var sekme = "bugun";
  var takvimAy = (function () { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1, 12); })();
  var seciliGun = bugun();
  var filtre = "tumu";
  var kiloAralik = 6;
  var E = document.getElementById("ekran");

  /* ── Ortak parçalar ── */
  function dostSecici(etiket) {
    return '<div class="dostlar" role="tablist" aria-label="' + esc(etiket || "Dostlarım") + '">' +
      V.hayvanlar.map(function (h) {
        var s = h.id === V.aktif;
        return '<button type="button" class="dost' + (s ? " secili" : "") + '" role="tab" aria-selected="' + s + '" data-eylem="dost" data-id="' + h.id + '">' +
          '<img src="' + foto(h) + '" alt="" style="object-position:' + esc(h.konum) + '" /><span>' + esc(h.ad) + "</span></button>";
      }).join("") +
      '<button type="button" class="dost ekle" data-eylem="hayvanEkle" aria-label="Yeni dost ekle">' + ikon("arti") + "</button></div>";
  }
  function ustBaslik(ust, baslik, sag) {
    return '<header class="ust"><div><p class="ust-yazi">' + ust + "</p><h1>" + baslik + "</h1></div>" + (sag || "") + "</header>";
  }
  function etkinlikSatir(o, gosterHayvan) {
    var t = TURLER[o.e.tur], h = hayvan(o.e.hayvan);
    var f = fark(o.tarih);
    var kalanSinif = f < 0 ? "gecti" : f <= 2 ? "yakin" : "";
    var zamanYazi = goreli(o.tarih) + (f > 1 || f < -1 ? ", " + tarihYaz(o.tarih) : "");
    return '<li class="etkinlik' + (o.tamam ? " tamam" : "") + '" style="--tur:' + t.renk + ";--tur-acik:" + t.acik + '">' +
      '<span class="tur-ikon">' + ikon(t.ikon) + "</span>" +
      '<div class="etk-metin"><b>' + esc(o.e.baslik) + "</b>" +
      '<small><span class="kalan ' + kalanSinif + '">' + zamanYazi + "</span> · " + esc(o.e.saat) + (gosterHayvan ? ' · <span class="mini-dost"><img src="' + foto(h) + '" alt="" style="object-position:' + esc(h.konum) + '" />' + esc(h.ad) + "</span>" : "") + "</small></div>" +
      '<button type="button" class="tik" data-eylem="etkTamam" data-id="' + o.e.id + '" data-tarih="' + o.tarih + '" aria-pressed="' + o.tamam + '" aria-label="' + esc(o.e.baslik) + (o.tamam ? " tamamlandı, geri al" : " tamamlandı olarak işaretle") + '">' + ikon("tik") + "</button></li>";
  }
  function bosDurum(ikonAd, baslik, metin, dugme) {
    return '<div class="bos"><span class="bos-ikon">' + ikon(ikonAd) + "</span><b>" + baslik + "</b><p>" + metin + "</p>" + (dugme || "") + "</div>";
  }

  /* ── Bugün ── */
  function halkaSvg(oran) {
    var r = 52, cevre = 2 * Math.PI * r, dolu = Math.max(0.001, Math.min(1, oran)) * cevre;
    return '<svg viewBox="0 0 128 128" class="halka-svg" aria-hidden="true"><defs><linearGradient id="halkaRenk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffbe4d"/><stop offset="1" stop-color="#ff6a3d"/></linearGradient></defs>' +
      '<circle cx="64" cy="64" r="52" class="halka-iz"/>' +
      '<circle cx="64" cy="64" r="52" class="halka-dolu" data-cevre="' + cevre.toFixed(1) + '" stroke="url(#halkaRenk)" stroke-dasharray="' + dolu.toFixed(1) + " " + cevre.toFixed(1) + '" transform="rotate(-90 64 64)"/></svg>';
  }
  function haftaCubuk(h) {
    var hedef = h.hedef.aktivite, gunler = [], enCok = hedef;
    for (var g = -6; g <= 0; g++) { var t = gun(g), dk = toplamDk(t, h.id); enCok = Math.max(enCok, dk); gunler.push({ t: t, dk: dk }); }
    var tavan = enCok * 1.1;
    return '<div class="hafta" aria-label="Son yedi gün">' + gunler.map(function (x, i) {
      var d = oku(x.t), oran = Math.max(0.06, x.dk / tavan), bugunMu = i === 6;
      return '<div class="hafta-gun' + (bugunMu ? " bugun" : "") + (x.dk >= hedef ? " tamam" : "") + '"><span class="cubuk-kap" title="' + x.dk + ' dk"><i style="height:' + Math.round(oran * 100) + '%"></i></span><small>' + GUN_BAS[(d.getDay() + 6) % 7] + "</small></div>";
    }).join("") + '<span class="hedef-cizgi" style="bottom:' + (22 + Math.round((hedef / tavan) * 56)) + 'px"></span></div>';
  }
  function kaseSvg(oran) {
    var o = Math.max(0, Math.min(1, oran));
    var cy = 23 + (1 - o) * 7, rx = 33 - (1 - o) * 13, ry = 6.6 - (1 - o) * 2.6;
    return '<svg viewBox="0 0 96 64" class="kase-svg" aria-hidden="true"><defs>' +
      '<linearGradient id="kaseGovde" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb489"/><stop offset="1" stop-color="#ff7a45"/></linearGradient>' +
      '<linearGradient id="kaseSu" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fdcff"/><stop offset="1" stop-color="#3b9be6"/></linearGradient></defs>' +
      '<path d="M7 22c0 0 2 22 14 28.5 6 3.2 48 3.2 54 0C87 44 89 22 89 22z" fill="url(#kaseGovde)"/>' +
      '<path d="M15 41c10 5 56 5 66 0" stroke="#fff" stroke-opacity=".35" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="48" cy="22" rx="41" ry="9.5" fill="#ffd2bb"/>' +
      '<ellipse cx="48" cy="22.6" rx="36" ry="7.4" fill="#f7c4a8"/>' +
      (o > 0.01 ? '<ellipse class="su-yuzey" cx="48" cy="' + cy.toFixed(1) + '" rx="' + rx.toFixed(1) + '" ry="' + ry.toFixed(1) + '" fill="url(#kaseSu)"/>' +
        '<ellipse cx="' + (40).toFixed(1) + '" cy="' + (cy - ry * 0.25).toFixed(1) + '" rx="' + (rx * 0.35).toFixed(1) + '" ry="' + (ry * 0.28).toFixed(1) + '" fill="#fff" fill-opacity=".55"/>' : "") +
      "</svg>";
  }
  function aktiviteKart(h) {
    var a = AKTIVITE[h.aktivite] || AKTIVITE.yuruyus;
    var k = V.kayit[bugun()] && V.kayit[bugun()][h.id];
    var liste = k ? k.aktivite : [];
    var dk = toplamDk(bugun(), h.id);
    var km = liste.reduce(function (t, x) { return t + (x.km || 0); }, 0);
    var canli = V.canli && V.canli.hayvan === h.id ? V.canli : null;
    var canliDk = canli ? canliSure() / 60000 : 0;
    var oran = (dk + canliDk) / h.hedef.aktivite;
    var son = liste.length ? liste[liste.length - 1].saat : "Henüz yok";
    var ust = '<div class="kart-bas"><h3>' + ikon("pati", "baslik-ik") + a.ad + '</h3><span class="hap seftali">Hedef ' + h.hedef.aktivite + " dk</span></div>";
    var halka = '<div class="halka">' + halkaSvg(oran) + '<div class="halka-ic"><b data-canli-dk>' + Math.floor(dk + canliDk) + "</b><span>/ " + h.hedef.aktivite + " dk</span></div></div>";
    if (canli) {
      return '<section class="kart aktivite-kart canli-kart" aria-live="polite">' + ust +
        '<div class="halka-satir">' + halka +
        '<div class="canli-bilgi"><span class="canli-etiket"><i></i>' + (canli.durak ? "Duraklatıldı" : a.suruyor) + '</span><b class="canli-sure" data-canli-sure>' + sureYaz(canliSure()) + "</b>" +
        (a.km ? '<small data-canli-km>' + ondalik((canliSure() / 60000) * a.km, 2) + " km tahmini</small>" : '<small>Başlangıç ' + saatYaz(canli.bas) + "</small>") + "</div></div>" +
        '<div class="ikili">' +
        '<button type="button" class="ikincil-dugme" data-eylem="aktiviteDuraklat">' + ikon(canli.durak ? "oynat" : "duraklat") + (canli.durak ? "Devam et" : "Duraklat") + "</button>" +
        '<button type="button" class="ana-dugme" data-eylem="aktiviteBitir">' + ikon("bitir") + "Bitir</button></div></section>";
    }
    return '<section class="kart aktivite-kart">' + ust +
      '<div class="halka-satir">' + halka +
      '<dl class="mini-istat">' +
      (a.km ? "<div><dt>Mesafe</dt><dd>" + ondalik(km, 1) + " km</dd></div>" : "<div><dt>Kalan</dt><dd>" + Math.max(0, h.hedef.aktivite - dk) + " dk</dd></div>") +
      "<div><dt>Bugün</dt><dd>" + liste.length + " " + a.cogul + "</dd></div>" +
      "<div><dt>Son</dt><dd>" + son + "</dd></div></dl></div>" +
      haftaCubuk(h) +
      '<button type="button" class="ana-dugme genis" data-eylem="aktiviteBasla">' + ikon("oynat") + a.basla + "</button></section>";
  }
  function saatYaz(ms) { var d = new Date(ms); return pad(d.getHours()) + ":" + pad(d.getMinutes()); }

  function bugunEkrani() {
    var h = hayvan();
    var t = bugun(), k = gunKaydi(t, h.id);
    var plan = V.ogunler[h.id] || [];
    var verilen = plan.filter(function (o) { return k.ogun[o.id]; }).length;
    var yak = tekil(yaklasanlar(30, { hayvan: h.id })).slice(0, 3);
    var tumYak = yaklasanlar(1).length;
    var d = new Date();
    var html = ustBaslik(GUNLER[d.getDay()] + ", " + d.getDate() + " " + AYLAR[d.getMonth()], selam() + ", " + esc(V.sahip),
      '<button type="button" class="yuvarlak-dugme" data-eylem="hatirlatmalar" aria-label="Hatırlatmalar, bugün ve yarın ' + tumYak + ' kayıt">' + ikon("zil") + (tumYak ? '<span class="rozet">' + tumYak + "</span>" : "") + "</button>");
    html += dostSecici();
    var kilo = sonKilo(h.id);
    html += '<article class="kahraman"><img src="' + foto(h) + '" alt="' + esc(h.ad + ", " + h.cins.toLocaleLowerCase("tr-TR") + " " + h.tur.toLocaleLowerCase("tr-TR")) + '" style="object-position:' + esc(h.konum) + '" />' +
      '<span class="cam-hap"><i></i>' + esc(h.ruh || "Keyfi yerinde") + "</span>" +
      '<div class="kahraman-alt"><h2>' + esc(h.ad) + "</h2><p>" + esc(h.cins) + " · " + yas(h.dogum) + (kilo ? " · " + kiloYaz(kilo) : "") + "</p></div></article>";
    html += aktiviteKart(h);

    html += '<section class="kart"><div class="kart-bas"><h3>' + ikon("mama", "baslik-ik bal") + 'Mama</h3><span class="hap bal">' + verilen + "/" + plan.length + ' öğün</span><button type="button" class="metin-dugme" data-eylem="ogunEkle">' + ikon("arti") + "Öğün</button></div>";
    if (plan.length) {
      html += '<ul class="ogunler">' + plan.slice().sort(function (a, b) { return a.saat.localeCompare(b.saat); }).map(function (o) {
        var v = !!k.ogun[o.id];
        return '<li class="' + (v ? "verildi" : "") + '"><span class="saat">' + esc(o.saat) + '</span><div class="ogun-metin"><b>' + esc(o.ad) + "</b><small>" + esc(o.miktar) + " · " + esc(o.mama) + "</small></div>" +
          '<button type="button" class="tik bal" data-eylem="ogun" data-id="' + o.id + '" aria-pressed="' + v + '" aria-label="' + esc(o.ad) + (v ? " verildi, geri al" : " verildi olarak işaretle") + '">' + ikon("tik") + "</button></li>";
      }).join("") + "</ul>";
    } else {
      html += bosDurum("mama", "Öğün planı yok", "Mama saatlerini ekle, verdikçe işaretle.", "");
    }
    html += "</section>";

    var suOran = k.su / h.hedef.su;
    var kalanSu = h.hedef.su - k.su;
    html += '<section class="kart su-kart"><div class="kase">' + kaseSvg(suOran) + "<small>" + (kalanSu > 0 ? kalanSu + " ml kaldı" : "Hedef tamam") + '</small></div><div class="su-sag"><div class="su-bilgi"><h3>' + ikon("damla", "baslik-ik gok") + 'Su</h3><p><b>' + k.su + "</b> / " + h.hedef.su + ' ml</p><div class="cubuk gok"><i style="width:' + Math.min(100, Math.round(suOran * 100)) + '%"></i></div></div>' +
      '<div class="su-dugmeler"><button type="button" data-eylem="su" data-ml="' + (h.hedef.su >= 150 ? 50 : 10) + '">+' + (h.hedef.su >= 150 ? 50 : 10) + ' ml</button><button type="button" data-eylem="su" data-ml="' + (h.hedef.su >= 150 ? 100 : 20) + '">+' + (h.hedef.su >= 150 ? 100 : 20) + " ml</button></div></div></section>";

    html += '<section class="kart"><div class="kart-bas"><h3>' + ikon("takvim", "baslik-ik lavanta") + 'Yaklaşanlar</h3><button type="button" class="metin-dugme" data-eylem="sekme" data-sekme="takvim">Takvim' + ikon("sag") + "</button></div>";
    html += yak.length ? '<ul class="etkinlik-liste">' + yak.map(function (o) { return etkinlikSatir(o, false); }).join("") + "</ul>" : bosDurum("takvim", "Önümüzde boş günler var", h.ad + " için yaklaşan hatırlatma yok.", '<button type="button" class="metin-dugme" data-eylem="etkinlikEkle">' + ikon("arti") + "Hatırlatma ekle</button>");
    html += "</section>";
    return html;
  }

  /* ── Takvim ── */
  function takvimEkrani() {
    var y = takvimAy.getFullYear(), m = takvimAy.getMonth();
    var ilk = new Date(y, m, 1, 12), bas = (ilk.getDay() + 6) % 7;
    var basT = new Date(y, m, 1 - bas, 12), bitT = new Date(y, m, 1 - bas + 41, 12);
    var tum = olaylar(iso(basT), iso(bitT), { tur: filtre });
    var gunluk = {};
    tum.forEach(function (o) { (gunluk[o.tarih] = gunluk[o.tarih] || []).push(o); });
    var html = ustBaslik("Hatırlatmalar", "Takvim", '<button type="button" class="ekle-dugme" data-eylem="etkinlikEkle">' + ikon("arti") + "Ekle</button>");
    html += '<section class="kart takvim-kart"><div class="ay-bas"><button type="button" class="yuvarlak-dugme kucuk" data-eylem="ay" data-yon="-1" aria-label="Önceki ay">' + ikon("sol") + "</button><h2>" + AYLAR[m] + " " + y + '</h2><button type="button" class="yuvarlak-dugme kucuk" data-eylem="ay" data-yon="1" aria-label="Sonraki ay">' + ikon("sag") + "</button></div>";
    html += '<div class="gun-adlari" aria-hidden="true">' + GUN_BAS.map(function (g) { return "<span>" + g + "</span>"; }).join("") + "</div>";
    html += '<div class="gunler">';
    for (var i = 0; i < 42; i++) {
      var d = new Date(y, m, 1 - bas + i, 12), t = iso(d);
      var ol = gunluk[t] || [];
      var turlar = [];
      ol.forEach(function (o) { if (turlar.indexOf(o.e.tur) < 0) turlar.push(o.e.tur); });
      var sinif = "gun" + (d.getMonth() !== m ? " disarida" : "") + (t === bugun() ? " bugun" : "") + (t === seciliGun ? " secili" : "");
      html += '<button type="button" class="' + sinif + '" data-eylem="gunSec" data-gun="' + t + '" aria-label="' + tarihYaz(t, true) + (ol.length ? ", " + ol.length + " hatırlatma" : "") + '" aria-pressed="' + (t === seciliGun) + '"><span>' + d.getDate() + '</span><i class="noktalar">' +
        turlar.slice(0, 3).map(function (tr) { return '<b style="background:' + TURLER[tr].renk + '"></b>'; }).join("") + "</i></button>";
    }
    html += "</div></section>";
    html += '<div class="filtreler" role="tablist" aria-label="Tür filtresi">' + [["tumu", "Tümü"]].concat(Object.keys(TURLER).map(function (k) { return [k, TURLER[k].ad]; })).map(function (f) {
      var s = filtre === f[0];
      return '<button type="button" role="tab" aria-selected="' + s + '" class="filtre' + (s ? " secili" : "") + '" data-eylem="filtre" data-filtre="' + f[0] + '"' + (TURLER[f[0]] ? ' style="--tur:' + TURLER[f[0]].renk + '"' : "") + ">" + (TURLER[f[0]] ? "<i></i>" : "") + f[1] + "</button>";
    }).join("") + "</div>";
    var secOl = olaylar(seciliGun, seciliGun, { tur: filtre });
    html += '<h3 class="bolum-baslik">' + (seciliGun === bugun() ? "Bugün, " : "") + tarihYaz(seciliGun, true) + "<span>" + (secOl.length ? secOl.length + " hatırlatma" : "Boş") + "</span></h3>";
    html += secOl.length ? '<ul class="etkinlik-liste kartli">' + secOl.map(function (o) { return etkinlikSatir(o, true); }).join("") + "</ul>"
      : '<div class="kart">' + bosDurum("takvim", "Bu gün için hatırlatma yok", "Aşı, veteriner randevusu ya da ilaç saatini ekleyebilirsin.", '<button type="button" class="metin-dugme" data-eylem="etkinlikEkle" data-tarih="' + seciliGun + '">' + ikon("arti") + "Bu güne ekle</button>") + "</div>";
    var sonra = tekil(olaylar(gun(0), gun(45), { tur: filtre }).filter(function (o) { return o.tarih !== seciliGun && !o.tamam; })).slice(0, 6);
    if (sonra.length) {
      html += '<h3 class="bolum-baslik">Yaklaşanlar<span>45 gün</span></h3><ul class="etkinlik-liste kartli">' + sonra.map(function (o) { return etkinlikSatir(o, true); }).join("") + "</ul>";
    }
    return html;
  }

  /* ── Sağlık ── */
  function kiloGrafik(h) {
    var tum = V.kilolar[h.id] || [];
    var sinirT = gun(-kiloAralik * 30 - 2);
    var l = tum.filter(function (x) { return x.tarih >= sinirT; });
    if (l.length < 2) l = tum.slice(-2);
    if (l.length < 2) return '<p class="grafik-bos">Grafik için en az iki tartı gerekiyor.</p>';
    var W = 340, H = 168, sl = 40, sr = 14, st = 16, sa = 26;
    var degerler = l.map(function (x) { return x.kg; });
    var ideal = h.ideal || [Math.min.apply(null, degerler), Math.max.apply(null, degerler)];
    var min = Math.min(Math.min.apply(null, degerler), ideal[0]), max = Math.max(Math.max.apply(null, degerler), ideal[1]);
    var pay = (max - min) * 0.12 || 0.1;
    min -= pay; max += pay;
    var kucuk = max < 1;
    function X(i) { return sl + (i / (l.length - 1)) * (W - sl - sr); }
    function Yy(v) { return st + (1 - (v - min) / (max - min)) * (H - st - sa); }
    var noktalar = l.map(function (x, i) { return [X(i), Yy(x.kg)]; });
    var yol = "M" + noktalar[0][0].toFixed(1) + " " + noktalar[0][1].toFixed(1);
    for (var i = 1; i < noktalar.length; i++) {
      var p0 = noktalar[i - 2] || noktalar[i - 1], p1 = noktalar[i - 1], p2 = noktalar[i], p3 = noktalar[i + 1] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      yol += " C" + c1x.toFixed(1) + " " + c1y.toFixed(1) + " " + c2x.toFixed(1) + " " + c2y.toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    var alan = yol + " L" + noktalar[noktalar.length - 1][0].toFixed(1) + " " + (H - sa) + " L" + noktalar[0][0].toFixed(1) + " " + (H - sa) + " Z";
    var izgara = "";
    var ham = (max - min) / 3, us = Math.pow(10, Math.floor(Math.log(ham) / Math.LN10)), n = ham / us;
    var adim = (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * us;
    for (var v = Math.ceil(min / adim) * adim; v <= max + 1e-9; v += adim) {
      var yy = Yy(v);
      izgara += '<line x1="' + sl + '" x2="' + (W - sr) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '" class="izgara"/><text x="' + (sl - 8) + '" y="' + (yy + 4).toFixed(1) + '" class="eksen" text-anchor="end">' + (kucuk ? Math.round(v * 1000) : ondalik(v, adim < 0.1 ? 2 : 1)) + "</text>";
    }
    var etiketAdim = Math.ceil(l.length / 6);
    var xEt = l.map(function (x, i) {
      if (i % etiketAdim !== 0 && i !== l.length - 1) return "";
      return '<text x="' + X(i).toFixed(1) + '" y="' + (H - 6) + '" class="eksen" text-anchor="middle">' + AY_KISA[oku(x.tarih).getMonth()] + "</text>";
    }).join("");
    var son = noktalar[noktalar.length - 1];
    var bant = '<rect x="' + sl + '" width="' + (W - sl - sr) + '" y="' + Yy(ideal[1]).toFixed(1) + '" height="' + (Yy(ideal[0]) - Yy(ideal[1])).toFixed(1) + '" class="ideal-bant" rx="6"/>';
    return '<svg viewBox="0 0 ' + W + " " + H + '" class="grafik-svg" role="img" aria-label="' + esc(h.ad) + ' kilo grafiği, son değer ' + kiloYaz(l[l.length - 1].kg) + '">' +
      '<defs><linearGradient id="kiloAlan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7a45" stop-opacity=".28"/><stop offset="1" stop-color="#ff7a45" stop-opacity="0"/></linearGradient></defs>' +
      bant + izgara + '<path d="' + alan + '" fill="url(#kiloAlan)"/><path d="' + yol + '" class="cizgi"/>' +
      noktalar.map(function (p, i) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (i === noktalar.length - 1 ? 5.5 : 3.2) + '" class="' + (i === noktalar.length - 1 ? "nokta son" : "nokta") + '"><title>' + tarihTam(l[i].tarih) + ": " + kiloYaz(l[i].kg) + "</title></circle>"; }).join("") +
      '<g class="etiket-kutu" transform="translate(' + Math.min(son[0] - 26, W - sr - 58).toFixed(1) + " " + Math.max(2, son[1] - 34).toFixed(1) + ')"><rect width="56" height="24" rx="12"/><text x="28" y="16.2" text-anchor="middle">' + kiloYaz(l[l.length - 1].kg) + "</text></g>" +
      xEt + "</svg>";
  }

  function saglikEkrani() {
    var h = hayvan();
    var html = ustBaslik(esc(h.ad) + " için", "Sağlık", '<button type="button" class="ekle-dugme" data-eylem="kayitEkle">' + ikon("arti") + "Kayıt</button>");
    html += dostSecici("Sağlık kaydı gösterilecek dost");
    var l = V.kilolar[h.id] || [];
    var son = l.length ? l[l.length - 1] : null;
    var degisim = "";
    if (son && l.length > 1) {
      var once = l[l.length - 2];
      for (var i = l.length - 2; i >= 0; i--) { if (fark(l[i].tarih) <= -28) { once = l[i]; break; } }
      var df = son.kg - once.kg, gunFark = Math.max(1, Math.round((oku(son.tarih) - oku(once.tarih)) / 864e5));
      var miktar = Math.abs(df) < 1 && son.kg < 1 ? Math.round(Math.abs(df) * 1000) + " g" : ondalik(Math.abs(df), son.kg < 10 ? 2 : 1).replace(/0$/, "") + " kg";
      degisim = Math.abs(df) < 0.001 ? '<p class="degisim">Son ' + gunFark + " günde değişmedi</p>" : '<p class="degisim ' + (df > 0 ? "artis" : "azalis") + '">Son ' + gunFark + " günde " + miktar + (df > 0 ? " arttı" : " azaldı") + "</p>";
    }
    var idealMi = son && h.ideal && son.kg >= h.ideal[0] && son.kg <= h.ideal[1];
    html += '<section class="kart kilo-kart"><div class="kart-bas"><h3>' + ikon("tarti", "baslik-ik") + "Kilo</h3>" +
      '<div class="aralik" role="tablist" aria-label="Grafik aralığı">' + [[3, "3 ay"], [6, "6 ay"], [12, "1 yıl"]].map(function (a) {
        return '<button type="button" role="tab" aria-selected="' + (kiloAralik === a[0]) + '" class="' + (kiloAralik === a[0] ? "secili" : "") + '" data-eylem="aralik" data-ay="' + a[0] + '">' + a[1] + "</button>";
      }).join("") + "</div></div>" +
      '<p class="buyuk-sayi">' + (son ? (son.kg < 1 ? Math.round(son.kg * 1000) + "<span>g</span>" : ondalik(son.kg, 1) + "<span>kg</span>") : "Yok") + "</p>" + degisim +
      '<div class="grafik">' + kiloGrafik(h) + "</div>" +
      (h.ideal ? '<div class="ideal-satir"><span class="ideal-renk"></span>İdeal aralık ' + kiloYaz(h.ideal[0]) + " ile " + kiloYaz(h.ideal[1]) + '<b class="' + (idealMi ? "iyi" : "dikkat") + '">' + (idealMi ? "İdeal aralıkta" : "Aralığın dışında") + "</b></div>" : "") +
      '<button type="button" class="ikincil-dugme genis" data-eylem="kiloEkle">' + ikon("arti") + "Tartı ekle</button></section>";

    var asilar = (V.asilar[h.id] || []).slice().sort(function (a, b) { return a.sonraki.localeCompare(b.sonraki); });
    html += '<section class="kart"><div class="kart-bas"><h3>' + ikon("kalkan", "baslik-ik lavanta") + 'Aşı ve koruma</h3><span class="hap lavanta">' + asilar.length + " kayıt</span></div>";
    html += asilar.length ? '<ul class="asi-liste">' + asilar.map(function (a) {
      var f = fark(a.sonraki), durum = f < 0 ? ["gecikti", "Gecikti"] : f <= 14 ? ["yaklasiyor", f === 0 ? "Bugün" : f + " gün kaldı"] : ["gecerli", "Geçerli"];
      return '<li><span class="asi-ikon">' + ikon("asi") + '</span><div><b>' + esc(a.ad) + "</b><small title=\\"Son doz " + tarihTam(a.yapildi) + "\\">Sonraki doz " + tarihTam(a.sonraki) + '</small></div><span class="durum ' + durum[0] + '">' + durum[1] + "</span></li>";
    }).join("") + "</ul>" : bosDurum("kalkan", "Aşı kaydı yok", "İlk aşıyı ekleyerek karneyi başlat.", "");
    html += "</section>";

    var ilaclar = V.ilaclar[h.id] || [];
    html += '<section class="kart"><div class="kart-bas"><h3>' + ikon("ilac", "baslik-ik gul") + 'İlaç ve takviyeler</h3></div>';
    html += ilaclar.length ? '<ul class="ilac-liste">' + ilaclar.map(function (x) {
      var bugunVerildi = x.son === bugun();
      var ilerleme = x.gun ? '<div class="cubuk gul"><i style="width:' + Math.min(100, Math.round((x.verilen / x.gun) * 100)) + '%"></i></div><small class="ilac-alt">' + x.verilen + ". gün, toplam " + x.gun + " gün</small>" : '<small class="ilac-alt">Sürekli kullanım</small>';
      return '<li><div class="ilac-ust"><div><b>' + esc(x.ad) + "</b><small>" + esc(x.doz) + '</small></div><button type="button" class="hap-dugme' + (bugunVerildi ? " verildi" : "") + '" data-eylem="ilacVer" data-id="' + x.id + '" aria-pressed="' + bugunVerildi + '">' + (bugunVerildi ? ikon("tik") + "Verildi" : "Bugün ver") + "</button></div>" + ilerleme + "</li>";
    }).join("") + "</ul>" : bosDurum("ilac", "Aktif ilaç yok", "Takviye ya da tedavi eklediğinde burada takip edilir.", "");
    html += "</section>";

    var ziy = (V.ziyaretler[h.id] || []).slice().sort(function (a, b) { return b.tarih.localeCompare(a.tarih); });
    html += '<section class="kart"><div class="kart-bas"><h3>' + ikon("vet", "baslik-ik gok") + 'Veteriner ziyaretleri</h3></div>';
    html += ziy.length ? '<ol class="zaman-cizelgesi">' + ziy.map(function (z) {
      return '<li><span class="zc-nokta"></span><div><small>' + tarihTam(z.tarih) + " · " + goreli(z.tarih) + "</small><b>" + esc(z.neden) + "</b>" + (z.not ? "<p>" + esc(z.not) + "</p>" : "") + "</div></li>";
    }).join("") + "</ol>" : bosDurum("vet", "Ziyaret kaydı yok", "Muayene notlarını burada sakla.", "");
    html += "</section>";
    return html;
  }

  /* ── Profil ── */
  function profilEkrani() {
    var h = hayvan();
    var a = AKTIVITE[h.aktivite] || AKTIVITE.yuruyus;
    var kilo = sonKilo(h.id);
    var html = '<header class="ust"><div><p class="ust-yazi">Profil</p><h1>' + esc(h.ad) + '</h1></div><button type="button" class="ekle-dugme acik" data-eylem="hayvanDuzenle">' + ikon("kalem") + "Düzenle</button></header>";
    html += dostSecici("Profili gösterilecek dost");
    html += '<section class="profil-kart"><img src="' + foto(h) + '" alt="' + esc(h.ad) + '" style="object-position:' + esc(h.konum) + '" /><div class="profil-ozet">' +
      "<div><small>Tür</small><b>" + esc(h.tur) + "</b></div><div><small>Yaş</small><b>" + yas(h.dogum) + "</b></div><div><small>Kilo</small><b>" + (kilo ? kiloYaz(kilo) : "Yok") + "</b></div></div></section>";
    html += '<section class="kart"><ul class="bilgi-liste">' +
      bilgiSatir("pasta", "Doğum günü", h.dogum ? tarihTam(h.dogum) : "Bilinmiyor", h.dogum ? dogumGunuKalan(h.dogum) : "") +
      bilgiSatir("kimlik", "Cins ve cinsiyet", esc(h.cins) + " · " + esc(h.cinsiyet), h.kisir ? "Kısırlaştırılmış" : "") +
      bilgiSatir("cip", "Mikroçip", esc(h.cip || "Yok"), "") +
      bilgiSatir("uyari", "Alerji", esc(h.alerji || "Yok"), "") +
      "</ul></section>";
    html += '<section class="kart"><div class="kart-bas"><h3>Günlük hedefler</h3><button type="button" class="metin-dugme" data-eylem="hedefDuzenle">' + ikon("kalem") + 'Düzenle</button></div><div class="hedefler">' +
      '<div class="hedef seftali">' + ikon("pati") + "<b>" + h.hedef.aktivite + " dk</b><small>" + a.ad + "</small></div>" +
      '<div class="hedef bal">' + ikon("mama") + "<b>" + (V.ogunler[h.id] || []).length + " öğün</b><small>Mama</small></div>" +
      '<div class="hedef gok">' + ikon("damla") + "<b>" + h.hedef.su + " ml</b><small>Su</small></div></div></section>";
    var vt = V.veteriner;
    html += '<section class="kart vet-kart"><div class="kart-bas"><h3>' + ikon("vet", "baslik-ik gok") + 'Veterinerim</h3><button type="button" class="metin-dugme" data-eylem="vetDuzenle">' + ikon("kalem") + "Düzenle</button></div>" +
      '<b class="vet-ad">' + esc(vt.klinik) + "</b><p class=\\"vet-hekim\\">" + esc(vt.hekim) + "</p>" +
      '<ul class="vet-bilgi"><li>' + ikon("konum") + esc(vt.adres) + "</li><li>" + ikon("saat") + esc(vt.saat) + "</li></ul>" +
      '<a class="ana-dugme genis" href="tel:' + esc(vt.tel.replace(/\\s/g, "")) + '">' + ikon("telefon") + "Ara: " + esc(vt.tel) + "</a></section>";
    html += '<section class="kart"><div class="kart-bas"><h3>Dostlarım</h3><span class="hap">' + V.hayvanlar.length + " dost</span></div><ul class=\\"dost-liste\\">" + V.hayvanlar.map(function (x) {
      return '<li><button type="button" data-eylem="dost" data-id="' + x.id + '"' + (x.id === V.aktif ? ' aria-current="true"' : "") + '><img src="' + foto(x) + '" alt="" style="object-position:' + esc(x.konum) + '" /><div><b>' + esc(x.ad) + "</b><small>" + esc(x.tur) + " · " + yas(x.dogum) + "</small></div>" + (x.id === V.aktif ? '<span class="hap seftali">Seçili</span>' : ikon("sag", "ok")) + "</button></li>";
    }).join("") + '<li><button type="button" class="ekle-satir" data-eylem="hayvanEkle"><span class="arti-kutu">' + ikon("arti") + "</span><div><b>Yeni dost ekle</b><small>Fotoğraf, tür ve doğum tarihi</small></div></button></li></ul></section>";
    html += '<section class="kart"><ul class="ayar-liste">' +
      '<li><button type="button" data-eylem="sahipDuzenle">' + ikon("kisi") + "<span>Sahibi</span><b>" + esc(V.sahip) + "</b>" + ikon("sag", "ok") + "</button></li>" +
      '<li><button type="button" data-eylem="sifirla" class="tehlike">' + ikon("yenile") + "<span>Örnek verilere dön</span>" + ikon("sag", "ok") + "</button></li></ul></section>";
    html += '<p class="dip-not">Evcil Dostum · Tüm kayıtlar yalnızca bu cihazda saklanır.</p>';
    return html;
  }
  function bilgiSatir(ik, etiket, deger, yan) {
    return '<li><span class="bilgi-ikon">' + ikon(ik) + "</span><div><small>" + etiket + "</small><b>" + deger + "</b></div>" + (yan ? '<span class="yan">' + yan + "</span>" : "") + "</li>";
  }
  function dogumGunuKalan(dogum) {
    var d = oku(dogum), b = oku(bugun());
    var bu = new Date(b.getFullYear(), d.getMonth(), d.getDate(), 12);
    if (bu < b) bu.setFullYear(bu.getFullYear() + 1);
    var g = Math.round((bu - b) / 864e5);
    return g === 0 ? "Bugün doğum günü" : g + " gün kaldı";
  }

  /* ── Çizim ── */
  var EKRANLAR = { bugun: bugunEkrani, takvim: takvimEkrani, saglik: saglikEkrani, profil: profilEkrani };
  function ciz(kaydir) {
    var y = window.scrollY;
    E.innerHTML = EKRANLAR[sekme]();
    E.setAttribute("data-sekme", sekme);
    document.querySelectorAll(".sekmeler button").forEach(function (b) {
      var s = b.getAttribute("data-sekme") === sekme;
      b.classList.toggle("secili", s);
      if (s) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    if (kaydir) { window.scrollTo(0, 0); E.classList.remove("gecis"); void E.offsetWidth; E.classList.add("gecis"); }
    else window.scrollTo(0, y);
    canliPil();
  }

  /* ── Canlı aktivite zamanlayıcısı ── */
  function canliSure() {
    var c = V.canli;
    if (!c) return 0;
    var simdi = c.durak || Date.now();
    return simdi - c.bas - (c.toplamDurak || 0);
  }
  var canliEl = document.getElementById("canli");
  function canliPil() {
    var c = V.canli;
    var goster = !!c && !(sekme === "bugun" && c.hayvan === V.aktif);
    canliEl.hidden = !goster;
    document.body.classList.toggle("canli-var", goster);
    if (!c) return;
    var h = hayvan(c.hayvan), a = AKTIVITE[h.aktivite] || AKTIVITE.yuruyus;
    canliEl.innerHTML = '<button type="button" class="canli-ac" data-eylem="canliAc"><img src="' + foto(h) + '" alt="" style="object-position:' + esc(h.konum) + '" /><span><small>' + esc(h.ad) + " · " + (c.durak ? "Duraklatıldı" : a.suruyor) + '</small><b data-canli-sure>' + sureYaz(canliSure()) + '</b></span></button><button type="button" class="canli-bitir" data-eylem="aktiviteBitir" aria-label="Bitir">' + ikon("bitir") + "</button>";
  }
  function canliTik() {
    if (!V.canli) return;
    var ms = canliSure();
    document.querySelectorAll("[data-canli-sure]").forEach(function (x) { x.textContent = sureYaz(ms); });
    var h = hayvan(V.canli.hayvan), a = AKTIVITE[h.aktivite] || AKTIVITE.yuruyus;
    document.querySelectorAll("[data-canli-km]").forEach(function (x) { x.textContent = ondalik((ms / 60000) * a.km, 2) + " km tahmini"; });
    if (sekme === "bugun" && V.canli.hayvan === V.aktif) {
      var dk = toplamDk(bugun(), h.id) + ms / 60000;
      var b = document.querySelector("[data-canli-dk]");
      if (b) b.textContent = Math.floor(dk);
      var ring = document.querySelector(".halka-dolu");
      if (ring) { var cv = +ring.getAttribute("data-cevre"); ring.setAttribute("stroke-dasharray", (Math.min(1, dk / h.hedef.aktivite) * cv).toFixed(1) + " " + cv); }
    }
  }
  setInterval(canliTik, 1000);

  /* ── Alt sayfa (form) ── */
  var perde = document.getElementById("perde");
  var sayfa = document.getElementById("sayfa");
  var sayfaKaydet = null, sayfaOnceki = null;
  function sayfaAc(baslik, govde, kaydetFn, opts) {
    opts = opts || {};
    sayfaOnceki = document.activeElement;
    sayfaKaydet = kaydetFn;
    sayfa.innerHTML = '<div class="tutamak" aria-hidden="true"></div><div class="sayfa-bas"><h2 id="sayfaBaslik">' + baslik + '</h2><button type="button" class="yuvarlak-dugme kucuk" data-eylem="sayfaKapat" aria-label="Kapat">' + ikon("kapat") + "</button></div>" +
      '<form id="sayfaForm" novalidate>' + govde + (kaydetFn ? '<div class="sayfa-alt">' + (opts.ikincil || "") + '<button type="submit" class="ana-dugme genis' + (opts.tehlike ? " tehlike" : "") + '">' + (opts.dugme || "Kaydet") + "</button></div>" : "") + "</form>";
    perde.hidden = false;
    sayfa.hidden = false;
    document.body.classList.add("sayfa-acik");
    requestAnimationFrame(function () { perde.classList.add("acik"); sayfa.classList.add("acik"); });
    var ilk = sayfa.querySelector("input:not([type=radio]):not([type=checkbox]):not([type=hidden]), select, textarea");
    setTimeout(function () { if (ilk && !opts.odaksiz) ilk.focus({ preventScroll: true }); else sayfa.querySelector(".sayfa-bas button").focus({ preventScroll: true }); }, 260);
    if (opts.kur) opts.kur(sayfa);
  }
  function sayfaKapat() {
    perde.classList.remove("acik");
    sayfa.classList.remove("acik");
    document.body.classList.remove("sayfa-acik");
    setTimeout(function () { perde.hidden = true; sayfa.hidden = true; sayfa.innerHTML = ""; }, 280);
    sayfaKaydet = null;
    if (sayfaOnceki && document.body.contains(sayfaOnceki)) try { sayfaOnceki.focus({ preventScroll: true }); } catch (e) {}
  }
  sayfa.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!sayfaKaydet) return;
    var f = e.target;
    var veri = {};
    new FormData(f).forEach(function (v, k) { veri[k] = typeof v === "string" ? v.trim() : v; });
    f.querySelectorAll("input[type=checkbox]").forEach(function (c) { veri[c.name] = c.checked; });
    var hata = sayfaKaydet(veri, f);
    if (hata) {
      var alan = f.querySelector('[name="' + hata.alan + '"]');
      var mesaj = f.querySelector(".form-hata");
      if (!mesaj) { mesaj = document.createElement("p"); mesaj.className = "form-hata"; mesaj.setAttribute("role", "alert"); f.querySelector(".sayfa-alt").before(mesaj); }
      mesaj.textContent = hata.mesaj;
      if (alan) { alan.setAttribute("aria-invalid", "true"); alan.focus(); }
      return;
    }
    sayfaKapat();
    kaydet();
    ciz();
  });
  perde.addEventListener("click", sayfaKapat);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sayfa.hidden) sayfaKapat(); });

  function alan(etiket, ic, ipucu) { return '<label class="alan"><span>' + etiket + "</span>" + ic + (ipucu ? "<small>" + ipucu + "</small>" : "") + "</label>"; }
  function girdi(ad, tip, deger, ek) { return '<input name="' + ad + '" type="' + tip + '" value="' + esc(deger == null ? "" : deger) + '" ' + (ek || "") + " />"; }
  function secim(ad, liste, secili) {
    return '<select name="' + ad + '">' + liste.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (x[0] === secili ? " selected" : "") + ">" + esc(x[1]) + "</option>"; }).join("") + "</select>";
  }
  function cipler(ad, liste, secili, etiket) {
    return '<fieldset class="alan"><legend>' + etiket + '</legend><div class="secenekler">' + liste.map(function (x) {
      return '<label class="secenek"' + (x[2] ? ' style="--tur:' + x[2] + '"' : "") + '><input type="radio" name="' + ad + '" value="' + esc(x[0]) + '"' + (x[0] === secili ? " checked" : "") + " /><span>" + (x[3] ? ikon(x[3]) : "") + esc(x[1]) + "</span></label>";
    }).join("") + "</div></fieldset>";
  }
  function bildir(metin) {
    var t = document.getElementById("tost");
    t.innerHTML = ikon("tik") + "<span>" + esc(metin) + "</span>";
    t.classList.add("acik");
    clearTimeout(bildir.z);
    bildir.z = setTimeout(function () { t.classList.remove("acik"); }, 2400);
  }

  /* ── Formlar ── */
  function aktiviteBitirFormu() {
    var c = V.canli, h = hayvan(c.hayvan), a = AKTIVITE[h.aktivite] || AKTIVITE.yuruyus;
    if (!c.durak) c.durak = Date.now();
    kaydet();
    var ms = canliSure(), dk = Math.max(1, Math.round(ms / 60000));
    var km = +(dk * a.km).toFixed(2);
    sayfaAc(a.ad + " bitti",
      '<div class="ozet-satir"><img src="' + foto(h) + '" alt="" style="object-position:' + esc(h.konum) + '" /><div><b>' + esc(h.ad) + "</b><small>" + saatYaz(c.bas) + " başlangıç</small></div></div>" +
      '<dl class="ozet"><div><dt>Süre</dt><dd>' + dk + " dk</dd></div>" + (a.km ? "<div><dt>Mesafe</dt><dd>" + ondalik(km, 2) + " km</dd></div>" : "") + "<div><dt>Bugün</dt><dd>" + (toplamDk(bugun(), h.id) + dk) + " dk</dd></div></dl>" +
      cipler("his", [["Enerjik", "Enerjik", "#ff7a45", "yildiz"], ["Normal", "Normal", "#2f9e6e", "pati"], ["Yorgun", "Yorgun", "#7c6cf0", "saat"]], "Enerjik", h.ad + " nasıldı?") +
      alan("Not", '<textarea name="not" rows="2" placeholder="Parkta kuşları izledi, çok mutluydu"></textarea>'),
      function (v) {
        gunKaydi(bugun(), h.id).aktivite.push({ saat: saatYaz(c.bas), dk: dk, km: km, his: v.his || "Normal", not: v.not || "" });
        V.canli = null;
        bildir(a.ad + " kaydedildi: " + dk + " dk");
      },
      { dugme: "Kaydet", odaksiz: true, ikincil: '<button type="button" class="ikincil-dugme" data-eylem="aktiviteSil">Kaydetme</button>' });
  }
  function ogunFormu() {
    var h = hayvan();
    sayfaAc("Öğün ekle",
      '<div class="ikili-alan">' + alan("Saat", girdi("saat", "time", "16:00", "required")) + alan("Miktar", girdi("miktar", "text", "", 'placeholder="40 g" required')) + "</div>" +
      alan("Öğün adı", girdi("ad", "text", "", 'placeholder="Ara öğün" required')) +
      alan("Mama", girdi("mama", "text", "", 'placeholder="Somonlu kuru mama"'), h.ad + " için her gün tekrarlanır."),
      function (v) {
        if (!v.ad) return { alan: "ad", mesaj: "Öğüne bir ad ver." };
        if (!v.miktar) return { alan: "miktar", mesaj: "Miktarı yaz, örneğin 40 g." };
        (V.ogunler[h.id] = V.ogunler[h.id] || []).push({ id: "o" + kimlik(), saat: v.saat || "12:00", ad: v.ad, miktar: v.miktar, mama: v.mama || "Mama" });
        bildir(v.ad + " plana eklendi");
      });
  }
  function etkinlikFormu(tarih) {
    sayfaAc("Hatırlatma ekle",
      cipler("tur", Object.keys(TURLER).map(function (k) { return [k, TURLER[k].ad, TURLER[k].renk, TURLER[k].ikon]; }), "asi", "Tür") +
      alan("Başlık", girdi("baslik", "text", "", 'placeholder="Karma aşı" required maxlength="60"')) +
      alan("Dost", secim("hayvan", V.hayvanlar.map(function (h) { return [h.id, h.ad]; }), V.aktif)) +
      '<div class="ikili-alan">' + alan("Tarih", girdi("tarih", "date", tarih || seciliGun || bugun(), "required")) + alan("Saat", girdi("saat", "time", "10:00", "required")) + "</div>" +
      alan("Tekrar", secim("tekrar", Object.keys(TEKRAR).map(function (k) { return [k, TEKRAR[k]]; }), "yok")) +
      alan("Not", '<textarea name="not" rows="2" placeholder="Aşı karnesini yanına al"></textarea>'),
      function (v) {
        if (!v.baslik) return { alan: "baslik", mesaj: "Hatırlatmaya bir başlık ver." };
        if (!v.tarih) return { alan: "tarih", mesaj: "Bir tarih seç." };
        V.etkinlikler.push({ id: "e" + kimlik(), hayvan: v.hayvan, tur: v.tur || "bakim", baslik: v.baslik, tarih: v.tarih, saat: v.saat || "10:00", tekrar: v.tekrar || "yok", not: v.not || "", tamam: {} });
        seciliGun = v.tarih;
        var d = oku(v.tarih);
        takvimAy = new Date(d.getFullYear(), d.getMonth(), 1, 12);
        bildir("Hatırlatma eklendi, " + tarihYaz(v.tarih));
      });
  }
  function kiloFormu() {
    var h = hayvan(), son = sonKilo(h.id);
    var kucuk = son != null && son < 1;
    sayfaAc("Tartı ekle",
      '<div class="ikili-alan">' + alan(kucuk ? "Ağırlık (gram)" : "Ağırlık (kg)", girdi("kg", "text", son != null ? (kucuk ? Math.round(son * 1000) : ondalik(son, 1)) : "", 'inputmode="decimal" autocomplete="off" required')) + alan("Tarih", girdi("tarih", "date", bugun(), "required")) + "</div>" +
      (h.ideal ? '<p class="form-not">' + esc(h.ad) + " için ideal aralık " + kiloYaz(h.ideal[0]) + " ile " + kiloYaz(h.ideal[1]) + ".</p>" : ""),
      function (v) {
        var n = parseFloat(String(v.kg).replace(",", "."));
        if (!(n > 0)) return { alan: "kg", mesaj: "Geçerli bir ağırlık yaz." };
        if (kucuk) n = n / 1000;
        var l = (V.kilolar[h.id] = V.kilolar[h.id] || []);
        l.push({ tarih: v.tarih || bugun(), kg: n });
        l.sort(function (a, b) { return a.tarih.localeCompare(b.tarih); });
        bildir(h.ad + ": " + kiloYaz(n) + " kaydedildi");
      });
  }
  function kayitFormu() {
    var h = hayvan();
    sayfaAc("Sağlık kaydı",
      cipler("tur", [["asi", "Aşı", "#7c6cf0", "asi"], ["ilac", "İlaç", "#e85a87", "ilac"], ["ziyaret", "Ziyaret", "#2f95dc", "vet"]], "asi", "Kayıt türü") +
      '<div class="grup" data-grup="asi">' + alan("Aşı adı", girdi("asiAd", "text", "", 'placeholder="Kuduz aşısı"')) +
      '<div class="ikili-alan">' + alan("Yapıldı", girdi("yapildi", "date", bugun())) + alan("Sonraki doz", girdi("sonraki", "date", gun(365))) + "</div></div>" +
      '<div class="grup" data-grup="ilac" hidden>' + alan("İlaç adı", girdi("ilacAd", "text", "", 'placeholder="Probiyotik"')) +
      '<div class="ikili-alan">' + alan("Doz", girdi("doz", "text", "", 'placeholder="Günde 1 tablet"')) + alan("Süre (gün)", girdi("gun", "number", "7", 'min="0" inputmode="numeric"'), "0 yazarsan sürekli") + "</div></div>" +
      '<div class="grup" data-grup="ziyaret" hidden>' + '<div class="ikili-alan">' + alan("Tarih", girdi("ziyTarih", "date", bugun())) + alan("Neden", girdi("neden", "text", "", 'placeholder="Genel kontrol"')) + "</div>" +
      alan("Veteriner notu", '<textarea name="ziyNot" rows="2" placeholder="Hekimin önerileri"></textarea>') + "</div>",
      function (v) {
        if (v.tur === "asi") {
          if (!v.asiAd) return { alan: "asiAd", mesaj: "Aşının adını yaz." };
          (V.asilar[h.id] = V.asilar[h.id] || []).push({ id: "a" + kimlik(), ad: v.asiAd, yapildi: v.yapildi || bugun(), sonraki: v.sonraki || gun(365) });
          if (v.sonraki) V.etkinlikler.push({ id: "e" + kimlik(), hayvan: h.id, tur: "asi", baslik: v.asiAd, tarih: v.sonraki, saat: "10:00", tekrar: "yok", not: "Aşı karnesinden eklendi.", tamam: {} });
          bildir(v.asiAd + " karneye eklendi");
        } else if (v.tur === "ilac") {
          if (!v.ilacAd) return { alan: "ilacAd", mesaj: "İlacın adını yaz." };
          (V.ilaclar[h.id] = V.ilaclar[h.id] || []).push({ id: "i" + kimlik(), ad: v.ilacAd, doz: v.doz || "Hekimin önerdiği gibi", gun: Math.max(0, parseInt(v.gun, 10) || 0), verilen: 0, son: "" });
          bildir(v.ilacAd + " eklendi");
        } else {
          if (!v.neden) return { alan: "neden", mesaj: "Ziyaretin nedenini yaz." };
          (V.ziyaretler[h.id] = V.ziyaretler[h.id] || []).push({ id: "z" + kimlik(), tarih: v.ziyTarih || bugun(), neden: v.neden, not: v.ziyNot || "" });
          bildir("Ziyaret kaydedildi");
        }
      },
      {
        kur: function (s) {
          s.querySelectorAll('input[name="tur"]').forEach(function (r) {
            r.addEventListener("change", function () {
              s.querySelectorAll(".grup").forEach(function (g) { g.hidden = g.getAttribute("data-grup") !== r.value; });
            });
          });
        },
      });
  }
  function hayvanFormu(duzenle) {
    var h = duzenle ? hayvan() : null;
    var turler = ["Kedi", "Köpek", "Papağan", "Muhabbet kuşu", "Bukalemun", "Tavşan", "Hamster", "Balık", "Diğer"];
    var secFoto = h ? h.foto : FOTOLAR[0].dosya;
    sayfaAc(duzenle ? esc(h.ad) + " profilini düzenle" : "Yeni dost ekle",
      '<fieldset class="alan"><legend>Fotoğraf</legend><div class="foto-sec">' + FOTOLAR.map(function (f) {
        return '<label><input type="radio" name="foto" value="' + f.dosya + '"' + (f.dosya === secFoto ? " checked" : "") + ' /><img src="' + GORSEL + f.dosya + '.webp" alt="' + esc(f.ad) + '" style="object-position:' + f.konum + '" /><i>' + ikon("tik") + "</i></label>";
      }).join("") + "</div></fieldset>" +
      '<div class="ikili-alan">' + alan("Adı", girdi("ad", "text", h ? h.ad : "", 'placeholder="Zeytin" required maxlength="24"')) + alan("Tür", secim("tur", turler.map(function (t) { return [t, t]; }), h ? h.tur : "Kedi")) + "</div>" +
      '<div class="ikili-alan">' + alan("Cins", girdi("cins", "text", h ? h.cins : "", 'placeholder="Van kedisi"')) + alan("Doğum tarihi", girdi("dogum", "date", h ? h.dogum : gun(-365))) + "</div>" +
      cipler("cinsiyet", [["Dişi", "Dişi"], ["Erkek", "Erkek"]], h ? h.cinsiyet : "Dişi", "Cinsiyet") +
      '<label class="anahtar"><input type="checkbox" name="kisir"' + (h && h.kisir ? " checked" : "") + ' /><span class="ray" aria-hidden="true"></span><span>Kısırlaştırıldı</span></label>' +
      (duzenle ? "" : alan("Güncel kilo (kg)", girdi("kilo", "text", "", 'inputmode="decimal" autocomplete="off" placeholder="4,2"'))) +
      alan("Günlük aktivite", secim("aktivite", Object.keys(AKTIVITE).map(function (k) { return [k, AKTIVITE[k].ad]; }), h ? h.aktivite : "yuruyus")) +
      '<div class="ikili-alan">' + alan("Mikroçip", girdi("cip", "text", h ? h.cip : "", 'placeholder="900 164 ..."')) + alan("Alerji", girdi("alerji", "text", h ? h.alerji : "", 'placeholder="Yok"')) + "</div>" +
      (duzenle && V.hayvanlar.length > 1 ? '<button type="button" class="metin-dugme tehlike" data-eylem="hayvanSil">' + ikon("cop") + esc(h.ad) + " profilini sil</button>" : ""),
      function (v) {
        if (!v.ad) return { alan: "ad", mesaj: "Dostunun adını yaz." };
        var f = FOTOLAR.filter(function (x) { return x.dosya === v.foto; })[0] || FOTOLAR[0];
        if (duzenle) {
          h.ad = v.ad; h.tur = v.tur; h.cins = v.cins || v.tur; h.dogum = v.dogum; h.cinsiyet = v.cinsiyet || h.cinsiyet; h.kisir = !!v.kisir;
          h.aktivite = v.aktivite; h.cip = v.cip || "Yok"; h.alerji = v.alerji || "Yok"; h.foto = f.dosya; h.konum = f.konum;
          bildir(h.ad + " güncellendi");
        } else {
          var id = "h" + kimlik();
          V.hayvanlar.push({ id: id, ad: v.ad, tur: v.tur, cins: v.cins || v.tur, dogum: v.dogum, cinsiyet: v.cinsiyet || "Dişi", kisir: !!v.kisir, cip: v.cip || "Yok", alerji: v.alerji || "Yok", foto: f.dosya, konum: f.konum, aktivite: v.aktivite || "yuruyus", ruh: "Yeni evine alışıyor", ideal: null, hedef: { aktivite: 30, su: 200 } });
          var kg = parseFloat(String(v.kilo || "").replace(",", "."));
          V.kilolar[id] = kg > 0 ? [{ tarih: bugun(), kg: kg }] : [];
          V.ogunler[id] = [{ id: "o" + kimlik(), saat: "08:00", ad: "Sabah öğünü", miktar: "1 ölçek", mama: "Mama" }, { id: "o" + kimlik(), saat: "19:00", ad: "Akşam öğünü", miktar: "1 ölçek", mama: "Mama" }];
          V.aktif = id;
          bildir(v.ad + " aramıza katıldı");
        }
      },
      { dugme: duzenle ? "Kaydet" : "Dostu ekle", odaksiz: true });
  }
  function hedefFormu() {
    var h = hayvan(), a = AKTIVITE[h.aktivite] || AKTIVITE.yuruyus;
    sayfaAc("Günlük hedefler",
      '<div class="ikili-alan">' + alan(a.ad + " (dk)", girdi("aktivite", "number", h.hedef.aktivite, 'min="5" max="300" step="5" inputmode="numeric" required')) + alan("Su (ml)", girdi("su", "number", h.hedef.su, 'min="10" max="3000" step="10" inputmode="numeric" required')) + "</div>" +
      '<p class="form-not">Öğün sayısı mama planından gelir. Bugün ekranından öğün ekleyebilirsin.</p>',
      function (v) {
        var ak = parseInt(v.aktivite, 10), su = parseInt(v.su, 10);
        if (!(ak > 0)) return { alan: "aktivite", mesaj: "Aktivite hedefi sıfırdan büyük olmalı." };
        if (!(su > 0)) return { alan: "su", mesaj: "Su hedefi sıfırdan büyük olmalı." };
        h.hedef = { aktivite: ak, su: su };
        bildir("Hedefler güncellendi");
      });
  }
  function vetFormu() {
    var vt = V.veteriner;
    sayfaAc("Veterinerim",
      alan("Klinik", girdi("klinik", "text", vt.klinik, "required")) + alan("Hekim", girdi("hekim", "text", vt.hekim)) +
      '<div class="ikili-alan">' + alan("Telefon", girdi("tel", "tel", vt.tel, 'inputmode="tel" required')) + alan("Çalışma saatleri", girdi("saat", "text", vt.saat)) + "</div>" +
      alan("Adres", girdi("adres", "text", vt.adres)),
      function (v) {
        if (!v.klinik) return { alan: "klinik", mesaj: "Klinik adını yaz." };
        if (!v.tel) return { alan: "tel", mesaj: "Telefon numarasını yaz." };
        V.veteriner = { klinik: v.klinik, hekim: v.hekim, tel: v.tel, adres: v.adres, saat: v.saat };
        bildir("Veteriner bilgileri kaydedildi");
      });
  }
  function sahipFormu() {
    sayfaAc("Sahibi", alan("Adın", girdi("sahip", "text", V.sahip, 'required maxlength="24" autocomplete="given-name"'), "Selamlamada kullanılır."), function (v) {
      if (!v.sahip) return { alan: "sahip", mesaj: "Adını yaz." };
      V.sahip = v.sahip;
      bildir("Merhaba " + v.sahip);
    });
  }
  function sifirlaFormu() {
    sayfaAc("Örnek verilere dön", '<div class="uyari-kutu">' + ikon("uyari") + "<p>Eklediğin dostlar, hatırlatmalar ve kayıtlar silinir; uygulama örnek verilerle yeniden açılır. Bu işlem geri alınamaz.</p></div>", function () {
      V = ornekVeri();
      sekme = "bugun";
      seciliGun = bugun();
      bildir("Örnek veriler yüklendi");
    }, { dugme: "Evet, sıfırla", tehlike: true, odaksiz: true });
  }
  function hatirlatmaListesi() {
    var l = tekil(yaklasanlar(7));
    sayfaAc("Önümüzdeki 7 gün", l.length ? '<ul class="etkinlik-liste">' + l.map(function (o) { return etkinlikSatir(o, true); }).join("") + "</ul>" + '<button type="button" class="ikincil-dugme genis" data-eylem="sekme" data-sekme="takvim">Takvimi aç</button>'
      : bosDurum("zil", "Hatırlatma yok", "Önümüzdeki hafta sakin görünüyor.", ""), null, { odaksiz: true });
  }

  /* ── Eylemler ── */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-eylem]");
    if (!b) return;
    var ey = b.getAttribute("data-eylem");
    var h = hayvan();
    switch (ey) {
      case "sekme":
        var s = b.getAttribute("data-sekme");
        if (!sayfa.hidden) sayfaKapat();
        if (s === "takvim" && sekme !== "takvim") { seciliGun = bugun(); var d = new Date(); takvimAy = new Date(d.getFullYear(), d.getMonth(), 1, 12); }
        sekme = s;
        ciz(true);
        break;
      case "dost":
        V.aktif = b.getAttribute("data-id");
        kaydet();
        if (b.closest(".dost-liste")) window.scrollTo({ top: 0, behavior: "smooth" });
        ciz();
        break;
      case "hayvanEkle": hayvanFormu(false); break;
      case "hayvanDuzenle": hayvanFormu(true); break;
      case "hayvanSil":
        var silinen = h.ad;
        V.hayvanlar = V.hayvanlar.filter(function (x) { return x.id !== h.id; });
        V.etkinlikler = V.etkinlikler.filter(function (x) { return x.hayvan !== h.id; });
        if (V.canli && V.canli.hayvan === h.id) V.canli = null;
        V.aktif = V.hayvanlar[0].id;
        sayfaKapat();
        kaydet();
        ciz();
        bildir(silinen + " profili silindi");
        break;
      case "aktiviteBasla":
        if (V.canli) { bildir("Zaten bir aktivite sürüyor"); break; }
        V.canli = { hayvan: h.id, bas: Date.now(), durak: null, toplamDurak: 0 };
        kaydet();
        ciz();
        break;
      case "aktiviteDuraklat":
        if (!V.canli) break;
        if (V.canli.durak) { V.canli.toplamDurak += Date.now() - V.canli.durak; V.canli.durak = null; }
        else V.canli.durak = Date.now();
        kaydet();
        ciz();
        break;
      case "aktiviteBitir": if (V.canli) aktiviteBitirFormu(); break;
      case "aktiviteSil":
        V.canli = null;
        sayfaKapat();
        kaydet();
        ciz();
        bildir("Aktivite kaydedilmedi");
        break;
      case "canliAc":
        if (V.canli) { V.aktif = V.canli.hayvan; sekme = "bugun"; kaydet(); ciz(true); }
        break;
      case "ogun":
        var k = gunKaydi(bugun(), h.id), id = b.getAttribute("data-id");
        k.ogun[id] = !k.ogun[id];
        if (!k.ogun[id]) delete k.ogun[id];
        kaydet();
        ciz();
        if (k.ogun[id]) bildir("Afiyet olsun " + h.ad);
        break;
      case "ogunEkle": ogunFormu(); break;
      case "su":
        var ks = gunKaydi(bugun(), h.id);
        ks.su = Math.min(h.hedef.su * 3, ks.su + (+b.getAttribute("data-ml")));
        kaydet();
        ciz();
        if (ks.su >= h.hedef.su && ks.su - (+b.getAttribute("data-ml")) < h.hedef.su) bildir("Günlük su hedefi tamam");
        break;
      case "hatirlatmalar": hatirlatmaListesi(); break;
      case "etkinlikEkle": if (!sayfa.hidden) sayfaKapat(); setTimeout(function () { etkinlikFormu(b.getAttribute("data-tarih")); }, sayfa.hidden ? 0 : 300); break;
      case "etkTamam":
        var et = V.etkinlikler.filter(function (x) { return x.id === b.getAttribute("data-id"); })[0];
        if (!et) break;
        var tt = b.getAttribute("data-tarih");
        et.tamam = et.tamam || {};
        if (et.tamam[tt]) delete et.tamam[tt]; else { et.tamam[tt] = true; bildir(et.baslik + " tamamlandı"); }
        kaydet();
        if (!sayfa.hidden) { b.setAttribute("aria-pressed", String(!!et.tamam[tt])); b.closest(".etkinlik").classList.toggle("tamam", !!et.tamam[tt]); }
        ciz();
        break;
      case "ay":
        takvimAy = new Date(takvimAy.getFullYear(), takvimAy.getMonth() + (+b.getAttribute("data-yon")), 1, 12);
        ciz();
        break;
      case "gunSec":
        seciliGun = b.getAttribute("data-gun");
        var sd = oku(seciliGun);
        if (sd.getMonth() !== takvimAy.getMonth()) takvimAy = new Date(sd.getFullYear(), sd.getMonth(), 1, 12);
        ciz();
        break;
      case "filtre": filtre = b.getAttribute("data-filtre"); ciz(); break;
      case "aralik": kiloAralik = +b.getAttribute("data-ay"); ciz(); break;
      case "kiloEkle": kiloFormu(); break;
      case "kayitEkle": kayitFormu(); break;
      case "ilacVer":
        var il = (V.ilaclar[h.id] || []).filter(function (x) { return x.id === b.getAttribute("data-id"); })[0];
        if (!il) break;
        if (il.son === bugun()) { il.son = ""; if (il.gun) il.verilen = Math.max(0, il.verilen - 1); }
        else { il.son = bugun(); if (il.gun) il.verilen = Math.min(il.gun, il.verilen + 1); bildir(il.ad + " verildi"); }
        kaydet();
        ciz();
        break;
      case "hedefDuzenle": hedefFormu(); break;
      case "vetDuzenle": vetFormu(); break;
      case "sahipDuzenle": sahipFormu(); break;
      case "sifirla": sifirlaFormu(); break;
      case "sayfaKapat": sayfaKapat(); break;
    }
  });
  document.querySelectorAll(".sekmeler button").forEach(function (b) { b.setAttribute("data-eylem", "sekme"); });

  ciz();
  canliTik();
})();
`,
  },
};
