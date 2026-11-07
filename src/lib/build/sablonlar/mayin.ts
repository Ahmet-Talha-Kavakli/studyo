/* Şablon: Mayın Tarlası — topoğrafik harita kâğıdı üstünde çimen ve toprak karolu klasik mayın tarlası. İlk kazı her zaman
 * güvenli ve boş alan kendiliğinden açılır; bayrak, akor (sayıya basınca çevreyi açma), süre, zorluk başına en iyi süre,
 * dokunmatikte Kazı ve Bayrak modu, uzun basınca bayrak, telefonda geniş tahtayı dikine çevirme ve yakınlaştırma.
 * Özel zorluk ve dokunma süresi ayarlar.json'dan (Vayra Build ayar paneli kaydırıcıları). */

const BAYRAK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6.5 4.5h10l-2.6 3.8 2.6 3.7h-10z" fill="#e0412f"/></svg>';
const KUREK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 9.5 20 4M17.5 2.5l4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M13.6 8.4 7 15l2 2 6.6-6.6zM7 15c-2.6.4-4 2-4 5 3 0 4.6-1.4 5-4z" fill="currentColor"/></svg>';
const SAAT = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

const HTML = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#f3eee1" />
  <meta name="description" content="Mayın Tarlası: sayılara bakarak mayınları bul, bayrağını dik, tarlayı en kısa sürede temizle." />
  <title>Mayın Tarlası</title>
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Manrope:wght@500;600;700;800&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <div class="zemin" aria-hidden="true"></div>
  <main class="sahne" id="sahne">
    <header class="ust">
      <div class="marka">
        <svg class="logo" viewBox="0 0 48 48" aria-hidden="true">
          <rect width="48" height="48" rx="13" fill="#1f3d2b" />
          <path d="M4 38c8-7 14-9 20-9s12 2 20 9v4a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6z" fill="#7fbf52" />
          <path d="M22 30V11" stroke="#f3eee1" stroke-width="2.6" stroke-linecap="round" />
          <path d="M23 11.5h12l-3.2 4.6 3.2 4.4H23z" fill="#e0412f" />
        </svg>
        <div><h1>Mayın Tarlası</h1><p>Sayılara güven, bayrağını dik.</p></div>
      </div>
      <nav class="zorluk" aria-label="Zorluk">
        <button type="button" data-zorluk="kolay"><b>Kolay</b><small>9 × 9</small></button>
        <button type="button" data-zorluk="orta"><b>Orta</b><small>16 × 16</small></button>
        <button type="button" data-zorluk="zor"><b>Zor</b><small>30 × 16</small></button>
        <button type="button" data-zorluk="ozel"><b>Özel</b><small id="ozelBoyut">12 × 12</small></button>
      </nav>
    </header>

    <section class="pano" id="pano">
      <div class="durum">
        <div class="sayac" title="Kalan mayın">${BAYRAK}<b id="kalan">10</b><span>mayın</span></div>
        <button class="yuz" id="yuz" type="button" aria-label="Yeni oyun"></button>
        <div class="sayac sure" title="Süre">${SAAT}<b id="sure">00:00</b></div>
      </div>
      <div class="arac">
        <div class="mod" role="radiogroup" aria-label="Dokunma modu">
          <button type="button" role="radio" data-mod="kaz" aria-checked="true">${KUREK}<span>Kazı</span></button>
          <button type="button" role="radio" data-mod="bayrak" aria-checked="false">${BAYRAK}<span>Bayrak</span></button>
        </div>
        <p class="arac-ipucu" id="aracIpucu">Sağ tık bayrak diker, sayıya tıklamak çevresini açar.</p>
        <div class="yakinlik" id="yakinlik">
          <button type="button" id="uzak" aria-label="Uzaklaştır"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" /></svg></button>
          <button type="button" id="yakin" aria-label="Yakınlaştır"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12M12 6v12" /></svg></button>
        </div>
      </div>
      <div class="tarla-kap" id="tarlaKap">
        <div class="tarla" id="tarla" role="grid" tabindex="0" aria-label="Mayın tarlası. Ok tuşlarıyla gez, boşluk ile kaz, F ile bayrak dik."></div>
      </div>
    </section>

    <section class="alt">
      <div class="kart">
        <h2>En iyi süreler</h2>
        <ol class="rekorlar" id="rekorlar"></ol>
      </div>
      <div class="kart">
        <h2>Nasıl oynanır</h2>
        <ul class="nasil">
          <li><i>1</i>Sayı, o karenin çevresindeki sekiz karede kaç mayın olduğunu söyler.</li>
          <li><i>2</i>İlk kazı her zaman güvenlidir; boş alanlar kendiliğinden açılır.</li>
          <li><i>3</i><span class="masaustu">Sağ tık bayrak diker. Bayrağı tamam olan sayıya tıklarsan çevresi açılır.</span><span class="dokunmatik">Uzun basınca bayrak diker. Bayrağı tamam olan sayıya dokunursan çevresi açılır.</span></li>
          <li><i>4</i>Mayın olmayan bütün kareleri açtığında tarla senindir.</li>
        </ul>
      </div>
    </section>
  </main>

  <div class="sonuc" id="sonuc" hidden>
    <div class="sonuc-kart" role="dialog" aria-modal="true" aria-labelledby="sonucBaslik">
      <p class="sonuc-ust" id="sonucUst"></p>
      <h2 id="sonucBaslik"></h2>
      <dl class="sonuc-liste" id="sonucListe"></dl>
      <div class="sonuc-dugmeler">
        <button type="button" class="dugme" id="tekrar">Yeniden oyna</button>
        <button type="button" class="dugme ikincil" id="incele">Tarlaya bak</button>
      </div>
    </div>
  </div>
  <p class="gizli" id="duyuru" aria-live="polite"></p>
  <script src="oyun.js"></script>
</body>
</html>
`;

const STIL = String.raw`/* Mayın Tarlası — harita kâğıdı zemin, orman yeşili, çimen ve toprak karolar, mercan kırmızısı bayrak. */
:root {
  --kagit: #f3eee1;
  --kagit-2: #ebe4d2;
  --orman: #1f3d2b;
  --orman-2: #2d5a3f;
  --metin: #1f2a22;
  --metin-2: #56655a;
  --metin-3: #7d8a80;
  --cimen: #8ccb5e;
  --cimen-2: #7fbf52;
  --cimen-ust: #a6dc7a;
  --toprak: #efe1c3;
  --toprak-2: #e7d5b0;
  --mercan: #e0412f;
  --cizgi: rgba(31, 61, 43, 0.14);
  --c: 40px;
  --w: 9;
  --egri: cubic-bezier(0.22, 1, 0.36, 1);
  --yazi: "Manrope", system-ui, -apple-system, "Segoe UI", sans-serif;
  --baslik: "Bricolage Grotesque", "Manrope", system-ui, sans-serif;
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
[hidden] { display: none !important; }
html, body { margin: 0; background: var(--kagit); }
body { min-height: 100vh; min-height: 100dvh; color: var(--metin); font-family: var(--yazi); font-size: 15px; line-height: 1.45; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
button { font: inherit; color: inherit; cursor: pointer; }
:focus-visible { outline: 2.5px solid var(--orman-2); outline-offset: 2px; }
.gizli { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.zemin {
  position: fixed; inset: 0; z-index: -1;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='360' viewBox='0 0 360 360'%3E%3Cg fill='none' stroke='%231f3d2b' stroke-opacity='.07' stroke-width='1.3'%3E%3Cpath d='M-20 70C50 30 110 110 190 70S300 20 380 60'/%3E%3Cpath d='M-20 95C55 58 115 135 192 96S305 48 380 86'/%3E%3Cpath d='M-20 122C60 88 120 160 195 124S310 78 380 114'/%3E%3Cpath d='M-20 250C40 215 100 290 180 255S290 205 380 240'/%3E%3Cpath d='M-20 278C45 246 105 316 182 284S295 236 380 270'/%3E%3Cellipse cx='280' cy='180' rx='46' ry='26'/%3E%3Cellipse cx='280' cy='180' rx='26' ry='13'/%3E%3Cellipse cx='70' cy='190' rx='34' ry='20'/%3E%3C/g%3E%3C/svg%3E"),
    radial-gradient(60% 50% at 0% 0%, rgba(140, 203, 94, 0.18), transparent 70%),
    radial-gradient(50% 45% at 100% 100%, rgba(224, 65, 47, 0.08), transparent 70%),
    var(--kagit);
}

.sahne { max-width: 1320px; margin: 0 auto; padding: 26px 32px 40px; display: flex; flex-direction: column; align-items: center; gap: 18px; }
.ust { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px 24px; flex-wrap: wrap; }
.marka { display: flex; align-items: center; gap: 13px; }
.logo { width: 48px; height: 48px; flex: none; }
.marka h1 { margin: 0; font-family: var(--baslik); font-weight: 800; font-size: 30px; line-height: 1.05; letter-spacing: -0.03em; color: var(--orman); }
.marka p { margin: 2px 0 0; color: var(--metin-2); font-size: 14px; }

.zorluk { display: flex; gap: 4px; padding: 4px; border-radius: 16px; background: rgba(31, 61, 43, 0.07); border: 1px solid var(--cizgi); }
.zorluk button { display: flex; flex-direction: column; align-items: center; min-width: 84px; padding: 7px 14px 8px; border: 0; border-radius: 12px; background: transparent; transition: background 0.2s, color 0.2s; }
.zorluk b { font-weight: 800; font-size: 15px; }
.zorluk small { font-size: 12px; color: var(--metin-3); font-weight: 600; font-variant-numeric: tabular-nums; }
.zorluk button:hover { background: rgba(31, 61, 43, 0.07); }
.zorluk button[aria-pressed="true"] { background: var(--orman); color: var(--kagit); }
.zorluk button[aria-pressed="true"] small { color: rgba(243, 238, 225, 0.7); }

/* ── Pano ── */
.pano { max-width: 100%; padding: 14px; border-radius: 22px; background: rgba(255, 253, 246, 0.72); border: 1px solid var(--cizgi); display: flex; flex-direction: column; gap: 12px; }
.pano.sars { animation: sars 0.45s ease; }
@keyframes sars { 15% { transform: translate(-6px, 2px); } 35% { transform: translate(5px, -3px); } 55% { transform: translate(-4px, 2px); } 75% { transform: translate(3px, -1px); } }
.durum { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; }
.sayac { display: inline-flex; align-items: center; gap: 8px; justify-self: start; height: 46px; padding: 0 14px; border-radius: 14px; background: var(--orman); color: var(--kagit); }
.sayac svg { width: 20px; height: 20px; color: var(--kagit); flex: none; }
.sayac b { font-family: var(--baslik); font-weight: 800; font-size: 22px; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; min-width: 2ch; }
.sayac span { font-size: 13px; color: rgba(243, 238, 225, 0.7); font-weight: 600; }
.sayac.sure { justify-self: end; }
.sayac.sure b { min-width: 5ch; }
.yuz { width: 54px; height: 54px; border-radius: 50%; border: 2px solid var(--orman); background: #f8d353; display: grid; place-items: center; padding: 0; transition: transform 0.15s var(--egri); }
.yuz:hover { transform: rotate(-8deg) scale(1.05); }
.yuz:active { transform: scale(0.92); }
.yuz svg { width: 40px; height: 40px; }

.arac { display: flex; align-items: center; gap: 12px; }
.mod { display: inline-flex; padding: 3px; border-radius: 13px; background: rgba(31, 61, 43, 0.08); flex: none; }
.mod button { display: inline-flex; align-items: center; gap: 7px; height: 40px; padding: 0 14px; border: 0; border-radius: 10px; background: transparent; font-weight: 700; font-size: 14.5px; color: var(--metin-2); }
.mod button svg { width: 19px; height: 19px; }
.mod button[aria-checked="true"] { background: #fffdf6; color: var(--orman); box-shadow: inset 0 0 0 1px var(--cizgi); }
.arac-ipucu { margin: 0; flex: 1; min-width: 0; color: var(--metin-3); font-size: 13px; }
.yakinlik { display: none; gap: 6px; margin-left: auto; }
.yakinlik button { width: 40px; height: 40px; border-radius: 12px; border: 1px solid var(--cizgi); background: #fffdf6; display: grid; place-items: center; padding: 0; }
.yakinlik svg { width: 18px; height: 18px; fill: none; stroke: var(--orman); stroke-width: 2.4; stroke-linecap: round; }
.yakinlik button:disabled { opacity: 0.35; }
.dokunmatik-cihaz .yakinlik { display: flex; }
.dokunmatik-cihaz .arac-ipucu { display: none; }

/* ── Tarla ── */
.tarla-kap { max-width: 100%; overflow: auto; border-radius: 12px; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
.tarla {
  display: grid; grid-template-columns: repeat(var(--w), var(--c)); grid-auto-rows: var(--c);
  width: max-content; margin: 0 auto; border-radius: 12px; overflow: hidden;
  user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; touch-action: pan-x pan-y; outline: none;
  border: 2px solid var(--orman);
}
.tarla:focus-visible { outline: 3px solid rgba(45, 90, 63, 0.4); outline-offset: 3px; }
.h {
  position: relative; display: grid; place-items: center;
  background: var(--cimen); box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.2), inset 0 -2px 0 rgba(31, 61, 43, 0.08);
  font-family: var(--baslik); font-weight: 800; font-size: calc(var(--c) * 0.56); line-height: 1; font-variant-numeric: tabular-nums;
  cursor: pointer;
}
.h.k { background: var(--cimen-2); }
@media (hover: hover) { .h:not(.a):hover { background: var(--cimen-ust); } }
.h.bas:not(.a) { background: #b5e48d; box-shadow: inset 0 2px 5px rgba(31, 61, 43, 0.22); }
.h.a { background: var(--toprak); box-shadow: inset 0 0 0 0.5px rgba(150, 120, 70, 0.18); cursor: default; animation: acil 0.3s var(--d, 0ms) both; }
.h.a.k { background: var(--toprak-2); }
.h.a[data-n]:not([data-n="0"]) { cursor: pointer; }
@keyframes acil { 0% { transform: scale(0.6); opacity: 0.2; } 70% { transform: scale(1.05); } 100% { transform: none; opacity: 1; } }
.h[data-n="1"] { color: #2f6fd0; } .h[data-n="2"] { color: #2f8a3e; } .h[data-n="3"] { color: #d33b2c; } .h[data-n="4"] { color: #6c3fb5; }
.h[data-n="5"] { color: #b8620e; } .h[data-n="6"] { color: #13858a; } .h[data-n="7"] { color: #2b2b2b; } .h[data-n="8"] { color: #7a7a7a; }
.h.vurgu:not(.a):not(.b) { background: #c9eba9; }
.h.i::before { content: ""; position: absolute; inset: 2px; border: 2.5px solid var(--orman); border-radius: 6px; z-index: 2; pointer-events: none; }
.h.b::after, .h.m::after, .h.y::after { content: ""; position: absolute; inset: 16%; background-position: center; background-repeat: no-repeat; background-size: contain; pointer-events: none; }
.h.b::after { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7 21.5V3.5' stroke='%231f3d2b' stroke-width='2.2' stroke-linecap='round'/%3E%3Cpath d='M7.6 3.8h11l-2.9 4.1 2.9 4.1h-11z' fill='%23e0412f'/%3E%3Cellipse cx='7' cy='21.3' rx='4' ry='1.3' fill='%231f3d2b' fill-opacity='.35'/%3E%3C/svg%3E"); animation: dik 0.28s var(--egri); transform-origin: 30% 90%; }
@keyframes dik { 0% { transform: scale(0.3) rotate(-25deg); opacity: 0; } 100% { transform: none; opacity: 1; } }
.h.m::after { inset: 18%; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cg stroke='%231a201c' stroke-width='2.2' stroke-linecap='round'%3E%3Cpath d='M12 1.5v21M1.5 12h21M4.6 4.6l14.8 14.8M19.4 4.6 4.6 19.4'/%3E%3C/g%3E%3Ccircle cx='12' cy='12' r='7' fill='%231a201c'/%3E%3Ccircle cx='9.6' cy='9.6' r='2' fill='%23fff' fill-opacity='.75'/%3E%3C/svg%3E"); animation: patla 0.42s var(--egri) both; }
.h.m { background: #d9c7a1; }
.h.m.k { background: #d2bf97; }
.h.p { background: var(--mercan) !important; }
.h.p::after { animation: none; }
@keyframes patla { 0% { transform: scale(0); } 60% { transform: scale(1.3); } 100% { transform: scale(1); } }
.h.y::after { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7 21.5V3.5' stroke='%231f3d2b' stroke-width='2.2' stroke-linecap='round' stroke-opacity='.5'/%3E%3Cpath d='M7.6 3.8h11l-2.9 4.1 2.9 4.1h-11z' fill='%23e0412f' fill-opacity='.5'/%3E%3Cpath d='M3 3l18 18M21 3 3 21' stroke='%23b3261a' stroke-width='2.6' stroke-linecap='round'/%3E%3C/svg%3E"); }
.tarla.bitti .h { cursor: default; }
.tarla.kazandi .h { animation: dalga 0.7s calc(var(--s, 0) * 1ms) both; }
@keyframes dalga { 0% { transform: none; } 40% { transform: translateY(-5px) scale(1.06); filter: brightness(1.12); } 100% { transform: none; } }

/* ── Alt kartlar ── */
.alt { width: 100%; max-width: 920px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 6px; }
.kart { padding: 18px 20px; border-radius: 20px; background: rgba(255, 253, 246, 0.6); border: 1px solid var(--cizgi); }
.kart h2 { margin: 0 0 12px; font-family: var(--baslik); font-weight: 800; font-size: 19px; letter-spacing: -0.02em; color: var(--orman); }
.rekorlar { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.rekorlar li { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 2px 12px; padding: 9px 12px; border-radius: 12px; background: rgba(31, 61, 43, 0.05); }
.rekorlar li.simdi { background: rgba(140, 203, 94, 0.22); }
.rekorlar b { font-weight: 800; }
.rekorlar .zaman { font-family: var(--baslik); font-weight: 800; font-size: 18px; color: var(--orman); font-variant-numeric: tabular-nums; }
.rekorlar .zaman.yok { color: var(--metin-3); font-size: 14px; font-family: var(--yazi); font-weight: 600; }
.rekorlar small { grid-column: 1 / -1; color: var(--metin-3); font-size: 12.5px; }
.nasil { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; color: var(--metin-2); font-size: 14.5px; }
.nasil li { display: grid; grid-template-columns: 26px 1fr; gap: 10px; align-items: start; }
.nasil i { font-style: normal; width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; background: var(--cimen-2); color: var(--orman); font-weight: 800; font-size: 13px; }
.dokunmatik { display: none; }
.dokunmatik-cihaz .masaustu { display: none; }
.dokunmatik-cihaz .dokunmatik { display: inline; }

/* ── Sonuç ── */
.sonuc { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; padding: 20px; background: rgba(243, 238, 225, 0.55); -webkit-backdrop-filter: blur(5px); backdrop-filter: blur(5px); animation: sAc 0.35s ease; }
@keyframes sAc { from { opacity: 0; } to { opacity: 1; } }
.sonuc-kart { width: min(400px, 100%); padding: 26px 24px 22px; border-radius: 26px; background: #fffdf6; border: 1.5px solid var(--orman); text-align: center; animation: kAc 0.45s var(--egri); }
@keyframes kAc { from { opacity: 0; transform: translateY(18px) scale(0.97); } to { opacity: 1; transform: none; } }
.sonuc-ust { margin: 0 0 4px; font-weight: 700; font-size: 14px; color: var(--orman-2); }
.sonuc.kaybetti .sonuc-ust { color: var(--mercan); }
.sonuc-kart h2 { margin: 0; font-family: var(--baslik); font-weight: 800; font-size: 40px; letter-spacing: -0.03em; line-height: 1.05; color: var(--orman); }
.sonuc-liste { margin: 18px 0 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.sonuc-liste div { padding: 10px 6px; border-radius: 14px; background: rgba(31, 61, 43, 0.06); }
.sonuc-liste dt { font-size: 12.5px; color: var(--metin-3); font-weight: 600; }
.sonuc-liste dd { margin: 2px 0 0; font-family: var(--baslik); font-weight: 800; font-size: 18px; color: var(--orman); font-variant-numeric: tabular-nums; }
.sonuc-liste .rekor dd { color: #2f8a3e; }
.sonuc-dugmeler { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.dugme { min-height: 46px; padding: 0 22px; border-radius: 999px; border: 1.5px solid var(--orman); background: var(--orman); color: var(--kagit); font-weight: 800; font-size: 15px; transition: transform 0.15s var(--egri), background 0.2s; }
.dugme:hover { background: var(--orman-2); }
.dugme:active { transform: scale(0.96); }
.dugme.ikincil { background: transparent; color: var(--orman); }
.dugme.ikincil:hover { background: rgba(31, 61, 43, 0.07); }

/* ── Dar ekran ── */
@media (max-width: 760px) {
  .sahne { padding: calc(env(safe-area-inset-top) + 14px) 12px calc(env(safe-area-inset-bottom) + 28px); gap: 12px; align-items: stretch; }
  .ust { gap: 12px; }
  .logo { width: 40px; height: 40px; }
  .marka h1 { font-size: 24px; }
  .marka p { font-size: 13px; }
  .zorluk { width: 100%; }
  .zorluk button { flex: 1; min-width: 0; padding: 6px 4px 7px; }
  .zorluk b { font-size: 14px; }
  .zorluk small { font-size: 11px; }
  .pano { padding: 10px; border-radius: 18px; gap: 10px; }
  .sayac { height: 42px; padding: 0 11px; gap: 6px; border-radius: 12px; }
  .sayac b { font-size: 19px; }
  .sayac span { display: none; }
  .yuz { width: 48px; height: 48px; }
  .yuz svg { width: 35px; height: 35px; }
  .mod button { height: 40px; padding: 0 12px; }
  .alt { grid-template-columns: 1fr; }
  .sonuc { place-items: end center; padding: 12px; }
  .sonuc-kart { padding: 22px 18px 18px; }
  .sonuc-kart h2 { font-size: 34px; }
}
@media (prefers-reduced-motion: reduce) {
  .h.a, .h.b::after, .h.m::after, .tarla.kazandi .h, .pano.sars { animation: none !important; }
}
`;

const AYARLAR = `{
  "varsayilanZorluk": { "etiket": "Açılış zorluğu (1 kolay, 2 orta, 3 zor, 4 özel)", "deger": 1, "min": 1, "max": 4, "adim": 1 },
  "genislik": { "etiket": "Özel tarla genişliği (kare)", "deger": 12, "min": 5, "max": 40, "adim": 1 },
  "yukseklik": { "etiket": "Özel tarla yüksekliği (kare)", "deger": 12, "min": 5, "max": 30, "adim": 1 },
  "mayin": { "etiket": "Özel tarladaki mayın sayısı", "deger": 24, "min": 3, "max": 300, "adim": 1 },
  "uzunBasma": { "etiket": "Bayrak için uzun basma süresi (milisaniye)", "deger": 380, "min": 200, "max": 900, "adim": 20 }
}
`;

const OYUN = String.raw`// Mayın Tarlası — özel zorluk ve dokunma süresi ayarlar.json'dan gelir (Vayra Build ayar paneli bu dosyayı düzenler).
var A = { varsayilanZorluk: 1, genislik: 12, yukseklik: 12, mayin: 24, uzunBasma: 380 };

var $ = function (id) { return document.getElementById(id); };
var tarla = $("tarla"), tarlaKap = $("tarlaKap"), pano = $("pano"), sahne = $("sahne"), sonucEl = $("sonuc");
var ZORLUK = { kolay: { w: 9, h: 9, m: 10, ad: "Kolay" }, orta: { w: 16, h: 16, m: 40, ad: "Orta" }, zor: { w: 30, h: 16, m: 99, ad: "Zor" }, ozel: { w: 12, h: 12, m: 24, ad: "Özel" } };
var SIRA = ["kolay", "orta", "zor", "ozel"];
var KAYIT = "mayin-tarlasi-istatistik", ZKAYIT = "mayin-tarlasi-zorluk";
var zorluk = "kolay", W = 9, H = 9, M = 10, dondu = false;
var mayin, acik, bayrak, sayi, hucreler = [];
var durum = "hazir", acilan = 0, bayrakSay = 0, baslangic = 0, gecen = 0, sureZ = 0, mod = "kaz", zoom = 0, imlec = 0, hucreBoy = 40;
var istat = oku(KAYIT) || {};
var dokunmatik = (window.matchMedia && matchMedia("(pointer: coarse)").matches) || (navigator.maxTouchPoints > 0 && innerWidth < 900);
if (dokunmatik) document.documentElement.classList.add("dokunmatik-cihaz");

function oku(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
function yaz(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* depolama dolu */ } }
function sinirla(v, a, b) { v = Math.round(Number(v)); if (!isFinite(v)) v = a; return Math.max(a, Math.min(b, v)); }
function titres(d) { try { if (navigator.vibrate) navigator.vibrate(d); } catch (e) { /* yok */ } }
function saat(ms) { var s = Math.floor(ms / 1000); return String(Math.min(99, Math.floor(s / 60))).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }
function saniye(ms) { return (ms / 1000).toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " sn"; }

/* ── Ayarlar ── */
fetch("ayarlar.json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
  Object.keys(j).forEach(function (k) { if (j[k] && typeof j[k].deger === "number") A[k] = j[k].deger; });
}).catch(function () {}).then(function () {
  var o = ZORLUK.ozel;
  o.w = sinirla(A.genislik, 5, 40); o.h = sinirla(A.yukseklik, 5, 30); o.m = sinirla(A.mayin, 1, o.w * o.h - 10);
  $("ozelBoyut").textContent = o.w + " × " + o.h;
  var kayitli = localStorage.getItem(ZKAYIT);
  yeniOyun(ZORLUK[kayitli] ? kayitli : SIRA[sinirla(A.varsayilanZorluk, 1, 4) - 1]);
});

/* ── Kurulum ── */
function yeniOyun(z) {
  if (z) zorluk = z;
  try { localStorage.setItem(ZKAYIT, zorluk); } catch (e) { /* yok */ }
  var d = ZORLUK[zorluk];
  dondu = innerWidth < 700 && innerHeight > innerWidth && d.w > d.h;
  W = dondu ? d.h : d.w; H = dondu ? d.w : d.h; M = Math.min(d.m, W * H - 1);
  var N = W * H;
  mayin = new Uint8Array(N); acik = new Uint8Array(N); bayrak = new Uint8Array(N); sayi = new Uint8Array(N);
  durum = "hazir"; acilan = 0; bayrakSay = 0; gecen = 0; zoom = 0; clearInterval(sureZ);
  imlec = Math.floor(H / 2) * W + Math.floor(W / 2);
  var parca = document.createDocumentFragment(); hucreler = [];
  for (var i = 0; i < N; i++) {
    var h = document.createElement("div");
    h.className = "h" + (((i % W) + Math.floor(i / W)) % 2 ? " k" : "");
    h.dataset.i = i; h.setAttribute("role", "gridcell");
    hucreler.push(h); parca.appendChild(h);
  }
  tarla.className = "tarla"; tarla.innerHTML = ""; tarla.appendChild(parca);
  tarla.style.setProperty("--w", W);
  sonucEl.hidden = true;
  document.querySelectorAll(".zorluk button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.zorluk === zorluk)); });
  yuz("normal"); sayacYaz(); $("sure").textContent = "00:00";
  olc(); rekorYaz();
  tarlaKap.scrollLeft = (tarlaKap.scrollWidth - tarlaKap.clientWidth) / 2; tarlaKap.scrollTop = 0;
}

/* ── Ölçü: tarla ekrana sığar; telefonda karelere rahat dokunulur, sığmazsa kaydırılır ── */
function olc() {
  var sst = getComputedStyle(sahne), pst = getComputedStyle(pano);
  var avW = sahne.clientWidth - parseFloat(sst.paddingLeft) - parseFloat(sst.paddingRight) - parseFloat(pst.paddingLeft) - parseFloat(pst.paddingRight) - 6;
  var c;
  if (dokunmatik) {
    var sig = Math.floor(avW / W);
    c = sig >= 30 ? Math.min(sig, 54) : 32;
    c = Math.max(20, Math.min(64, c + zoom * 6));
  } else {
    var ust = tarlaKap.getBoundingClientRect().top + scrollY;
    var avH = Math.max(320, innerHeight - ust - 34);
    c = Math.floor(Math.min(avW / W, avH / H, 56));
    c = Math.max(24, c);
  }
  hucreBoy = c;
  tarla.style.setProperty("--c", c + "px");
  if (dokunmatik) {
    var ustT = tarlaKap.getBoundingClientRect().top + scrollY;
    tarlaKap.style.maxHeight = Math.max(300, innerHeight - ustT - 14) + "px";
    $("uzak").disabled = c <= 20; $("yakin").disabled = c >= 64;
  }
}
var olcZ = 0;
addEventListener("resize", function () { clearTimeout(olcZ); olcZ = setTimeout(olc, 120); });
$("uzak").addEventListener("click", function () { zoom--; olc(); });
$("yakin").addEventListener("click", function () { zoom++; olc(); });

/* ── Oyun mantığı ── */
function komsular(i) {
  var r = Math.floor(i / W), c = i % W, l = [];
  for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    var rr = r + dr, cc = c + dc;
    if (rr >= 0 && rr < H && cc >= 0 && cc < W) l.push(rr * W + cc);
  }
  return l;
}
function mayinKoy(ilk) {
  var yasak = {}; yasak[ilk] = 1;
  if (W * H - 9 >= M) komsular(ilk).forEach(function (k) { yasak[k] = 1; });
  var aday = [];
  for (var i = 0; i < W * H; i++) if (!yasak[i]) aday.push(i);
  for (var j = aday.length - 1; j > 0; j--) { var x = Math.floor(Math.random() * (j + 1)), t = aday[j]; aday[j] = aday[x]; aday[x] = t; }
  aday.slice(0, M).forEach(function (k) { mayin[k] = 1; });
  for (var n = 0; n < W * H; n++) { var s = 0; komsular(n).forEach(function (k) { s += mayin[k]; }); sayi[n] = s; }
}
function sureBaslat() {
  baslangic = performance.now(); clearInterval(sureZ);
  sureZ = setInterval(function () { gecen = performance.now() - baslangic; $("sure").textContent = saat(gecen); }, 250);
}
function sureDur() { clearInterval(sureZ); if (baslangic) gecen = performance.now() - baslangic; $("sure").textContent = saat(gecen); }

function ac(i) {
  if (durum === "kazandi" || durum === "kaybetti" || acik[i] || bayrak[i]) return;
  if (durum === "hazir") {
    mayinKoy(i); durum = "oyun"; sureBaslat();
    istatAl().oynanan++; yaz(KAYIT, istat);
  }
  if (mayin[i]) { kaybet(i); return; }
  var kuyruk = [i], mesafe = {}, bas = 0;
  mesafe[i] = 0; acik[i] = 1;
  while (bas < kuyruk.length) {
    var x = kuyruk[bas++];
    if (sayi[x] === 0) komsular(x).forEach(function (k) {
      if (!acik[k] && !bayrak[k] && !mayin[k]) { acik[k] = 1; mesafe[k] = mesafe[x] + 1; kuyruk.push(k); }
    });
  }
  kuyruk.forEach(function (k) { acikCiz(k, Math.min(mesafe[k], 26) * 16); });
  acilan += kuyruk.length;
  if (acilan === W * H - M) kazan();
}
function acikCiz(k, gecikme) {
  var h = hucreler[k];
  h.classList.add("a"); h.classList.remove("b");
  h.style.setProperty("--d", gecikme + "ms");
  h.dataset.n = sayi[k];
  h.textContent = sayi[k] ? sayi[k] : "";
}
function bayrakla(i) {
  if (durum === "kazandi" || durum === "kaybetti" || acik[i]) return;
  bayrak[i] = bayrak[i] ? 0 : 1;
  bayrakSay += bayrak[i] ? 1 : -1;
  hucreler[i].classList.toggle("b", !!bayrak[i]);
  titres(bayrak[i] ? 22 : 10);
  sayacYaz();
}
function akor(i) {
  if (durum !== "oyun" || !acik[i] || !sayi[i]) return;
  var k = komsular(i), b = 0;
  k.forEach(function (x) { b += bayrak[x]; });
  if (b !== sayi[i]) {
    k.forEach(function (x) { if (!acik[x] && !bayrak[x]) hucreler[x].classList.add("vurgu"); });
    setTimeout(function () { k.forEach(function (x) { hucreler[x].classList.remove("vurgu"); }); }, 220);
    return;
  }
  var patlayan = -1;
  k.forEach(function (x) { if (!acik[x] && !bayrak[x] && mayin[x] && patlayan < 0) patlayan = x; });
  if (patlayan >= 0) { kaybet(patlayan); return; }
  k.forEach(function (x) { if (durum === "oyun") ac(x); });
}
function sayacYaz() { $("kalan").textContent = M - bayrakSay; }

function kaybet(i) {
  durum = "kaybetti"; sureDur();
  tarla.classList.add("bitti");
  hucreler[i].classList.add("m", "p");
  titres([70, 40, 110]);
  pano.classList.remove("sars"); void pano.offsetWidth; pano.classList.add("sars");
  yuz("kaybetti");
  var r0 = Math.floor(i / W), c0 = i % W, liste = [];
  for (var k = 0; k < W * H; k++) {
    if (mayin[k] && k !== i && !bayrak[k]) liste.push(k);
    if (bayrak[k] && !mayin[k]) { hucreler[k].classList.remove("b"); hucreler[k].classList.add("y"); }
  }
  liste.sort(function (a, b) { return Math.hypot(Math.floor(a / W) - r0, a % W - c0) - Math.hypot(Math.floor(b / W) - r0, b % W - c0); });
  var adim = Math.min(45, 1300 / Math.max(1, liste.length));
  liste.forEach(function (k, s) { setTimeout(function () { if (durum === "kaybetti") hucreler[k].classList.add("m"); }, 160 + s * adim); });
  var acikOran = Math.round(acilan / (W * H - M) * 100);
  setTimeout(function () {
    if (durum !== "kaybetti") return;
    sonucGoster(false, [["Süre", saat(gecen)], ["Temizlenen", "yüzde " + acikOran], ["Bayrak", bayrakSay + " / " + M]]);
  }, 700 + liste.length * adim);
  $("duyuru").textContent = "Mayına bastın. Oyun bitti.";
}
function kazan() {
  durum = "kazandi"; sureDur();
  tarla.classList.add("bitti");
  for (var k = 0; k < W * H; k++) {
    if (mayin[k] && !bayrak[k]) { bayrak[k] = 1; hucreler[k].classList.add("b"); }
    hucreler[k].style.setProperty("--s", (Math.floor(k / W) + (k % W)) * 20);
  }
  bayrakSay = M; sayacYaz();
  tarla.classList.add("kazandi");
  yuz("kazandi"); titres([30, 50, 30, 50, 60]);
  var s = istatAl(); s.kazanilan++;
  var once = s.enIyi, rekor = !once || gecen < once;
  if (rekor) s.enIyi = Math.round(gecen);
  yaz(KAYIT, istat); rekorYaz();
  setTimeout(function () {
    if (durum !== "kazandi") return;
    sonucGoster(true, [["Süre", saniye(gecen)], rekor ? (once ? ["Yeni rekor", saniye(once - s.enIyi) + " önde", true] : ["Rekor", "İlk zafer", true]) : ["En iyi", saniye(s.enIyi)], ["Kazanma", s.kazanilan + " / " + s.oynanan]]);
  }, 650 + (W + H) * 20);
  $("duyuru").textContent = "Tebrikler, tarlayı temizledin.";
}
function anahtar() { var d = ZORLUK[zorluk]; return zorluk === "ozel" ? "ozel-" + d.w + "x" + d.h + "x" + d.m : zorluk; }
function istatAl() { var a = anahtar(); if (!istat[a]) istat[a] = { oynanan: 0, kazanilan: 0, enIyi: 0 }; return istat[a]; }

function sonucGoster(kazandi, satirlar) {
  sonucEl.classList.toggle("kaybetti", !kazandi);
  var d = ZORLUK[zorluk];
  $("sonucUst").textContent = kazandi ? d.ad + " tarla temizlendi" : "Mayına bastın";
  $("sonucBaslik").textContent = kazandi ? "Kazandın!" : "Bu kez olmadı";
  $("sonucListe").innerHTML = satirlar.map(function (s) { return '<div' + (s[2] ? ' class="rekor"' : "") + '><dt>' + s[0] + "</dt><dd>" + s[1] + "</dd></div>"; }).join("");
  sonucEl.hidden = false;
  $("tekrar").focus({ preventScroll: true });
}
$("tekrar").addEventListener("click", function () { yeniOyun(); });
$("incele").addEventListener("click", function () { sonucEl.hidden = true; tarla.focus({ preventScroll: true }); });
sonucEl.addEventListener("click", function (e) { if (e.target === sonucEl) sonucEl.hidden = true; });

function rekorYaz() {
  var ol = $("rekorlar"), simdi = anahtar();
  ol.innerHTML = SIRA.map(function (z) {
    var d = ZORLUK[z], a = z === "ozel" ? "ozel-" + d.w + "x" + d.h + "x" + d.m : z, s = istat[a] || { oynanan: 0, kazanilan: 0, enIyi: 0 };
    return '<li class="' + (a === simdi ? "simdi" : "") + '"><b>' + d.ad + '</b><span class="zaman' + (s.enIyi ? "" : " yok") + '">' + (s.enIyi ? saniye(s.enIyi) : "Henüz yok") + "</span><small>" + d.w + " × " + d.h + ", " + d.m + " mayın · " + s.kazanilan + " / " + s.oynanan + " kazanıldı</small></li>";
  }).join("");
}

/* ── Yüz düğmesi ── */
var YUZ = {
  normal: '<circle cx="15" cy="17" r="2.2" fill="#1f3d2b"/><circle cx="25" cy="17" r="2.2" fill="#1f3d2b"/><path d="M13.5 24.5c3.5 3.6 9.5 3.6 13 0" fill="none" stroke="#1f3d2b" stroke-width="2.4" stroke-linecap="round"/>',
  sasirmis: '<circle cx="15" cy="16.5" r="2.4" fill="#1f3d2b"/><circle cx="25" cy="16.5" r="2.4" fill="#1f3d2b"/><ellipse cx="20" cy="26" rx="3.2" ry="3.8" fill="#1f3d2b"/>',
  kazandi: '<path d="M8.5 15h23l-1.5 4.5a3.5 3.5 0 0 1-3.3 2.4h-2.6a3.5 3.5 0 0 1-3.3-2.4L20 17l-.8 2.5a3.5 3.5 0 0 1-3.3 2.4h-2.6A3.5 3.5 0 0 1 10 19.5z" fill="#1f3d2b"/><path d="M13 26c3.8 3.8 10.2 3.8 14 0" fill="none" stroke="#1f3d2b" stroke-width="2.4" stroke-linecap="round"/>',
  kaybetti: '<path d="M12.5 14.5l5 5m0-5-5 5M22.5 14.5l5 5m0-5-5 5" stroke="#1f3d2b" stroke-width="2.3" stroke-linecap="round"/><path d="M14 28c3.5-3 8.5-3 12 0" fill="none" stroke="#1f3d2b" stroke-width="2.4" stroke-linecap="round"/>'
};
function yuz(d) { $("yuz").innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true">' + YUZ[d] + "</svg>"; }
$("yuz").addEventListener("click", function () { yeniOyun(); });
document.querySelectorAll(".zorluk button").forEach(function (b) { b.addEventListener("click", function () { yeniOyun(b.dataset.zorluk); }); });

/* ── Mod ── */
function modSec(m) {
  mod = m;
  document.querySelectorAll(".mod button").forEach(function (b) { b.setAttribute("aria-checked", String(b.dataset.mod === m)); });
}
document.querySelectorAll(".mod button").forEach(function (b) { b.addEventListener("click", function () { modSec(b.dataset.mod); }); });

function kisa(i) { if (acik[i]) akor(i); else if (mod === "bayrak") bayrakla(i); else ac(i); }
function uzun(i) { if (acik[i]) akor(i); else if (mod === "bayrak") ac(i); else bayrakla(i); }

/* ── Dokunma ve fare ── */
var bas = null, sonDokunma = 0;
function hucreBul(e) { var h = e.target.closest ? e.target.closest(".h") : null; return h && tarla.contains(h) ? Number(h.dataset.i) : -1; }
function basBirak() { if (!bas) return; clearTimeout(bas.z); hucreler[bas.i] && hucreler[bas.i].classList.remove("bas"); bas = null; if (durum === "hazir" || durum === "oyun") yuz("normal"); }
tarla.addEventListener("pointerdown", function (e) {
  var i = hucreBul(e); if (i < 0 || durum === "kazandi" || durum === "kaybetti") return;
  tarla.classList.remove("klavye"); if (hucreler[imlec]) hucreler[imlec].classList.remove("i");
  if (e.pointerType === "mouse") {
    if (e.button === 1) { e.preventDefault(); akor(i); return; }
    if (e.button !== 0) return;
    bas = { i: i, fare: true };
    hucreler[i].classList.add("bas"); yuz("sasirmis");
    return;
  }
  dokunmatik = true; document.documentElement.classList.add("dokunmatik-cihaz");
  sonDokunma = Date.now();
  bas = { i: i, x: e.clientX, y: e.clientY, uzun: false };
  if (!acik[i]) { hucreler[i].classList.add("bas"); yuz("sasirmis"); }
  bas.z = setTimeout(function () {
    if (!bas || bas.i !== i) return;
    bas.uzun = true; hucreler[i].classList.remove("bas"); yuz("normal");
    uzun(i);
  }, sinirla(A.uzunBasma, 150, 1500));
});
tarla.addEventListener("pointermove", function (e) {
  if (!bas || bas.fare) return;
  if (Math.abs(e.clientX - bas.x) > 10 || Math.abs(e.clientY - bas.y) > 10) basBirak();
});
tarla.addEventListener("pointerup", function (e) {
  if (!bas) return;
  var b = bas, i = hucreBul(e);
  basBirak();
  if (b.uzun) return;
  if (b.fare) { if (i === b.i) kisa(i); return; }
  kisa(b.i);
});
tarla.addEventListener("pointercancel", basBirak);
tarla.addEventListener("pointerleave", function (e) { if (bas && bas.fare) basBirak(); });
tarla.addEventListener("contextmenu", function (e) {
  e.preventDefault();
  if (Date.now() - sonDokunma < 1200) return;
  var i = hucreBul(e); if (i >= 0) bayrakla(i);
});

/* ── Klavye ── */
function imlecCiz(yeni) {
  if (hucreler[imlec]) hucreler[imlec].classList.remove("i");
  imlec = yeni; tarla.classList.add("klavye");
  hucreler[imlec].classList.add("i");
  hucreler[imlec].scrollIntoView({ block: "nearest", inline: "nearest" });
}
tarla.addEventListener("keydown", function (e) {
  var r = Math.floor(imlec / W), c = imlec % W, y = -1;
  if (e.key === "ArrowUp") y = Math.max(0, r - 1) * W + c;
  else if (e.key === "ArrowDown") y = Math.min(H - 1, r + 1) * W + c;
  else if (e.key === "ArrowLeft") y = r * W + Math.max(0, c - 1);
  else if (e.key === "ArrowRight") y = r * W + Math.min(W - 1, c + 1);
  if (y >= 0) { e.preventDefault(); imlecCiz(y); return; }
  if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (!tarla.classList.contains("klavye")) { imlecCiz(imlec); return; } kisa(imlec); }
  else if (e.key === "f" || e.key === "F" || e.key === "b" || e.key === "B") { e.preventDefault(); bayrakla(imlec); }
});
tarla.addEventListener("focus", function () { var g = false; try { g = tarla.matches(":focus-visible"); } catch (e) { g = false; } if (g && !bas) imlecCiz(imlec); });
tarla.addEventListener("blur", function () { if (hucreler[imlec]) hucreler[imlec].classList.remove("i"); });
addEventListener("keydown", function (e) {
  if (e.target.closest && e.target.closest("button")) return;
  if ((e.key === "n" || e.key === "N") && !e.metaKey && !e.ctrlKey) yeniOyun();
  if (e.key === "Escape" && !sonucEl.hidden) sonucEl.hidden = true;
});
`;

const IKON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#1f3d2b" />
  <path d="M5 50c11-9 19-12 27-12s16 3 27 12v3a8 8 0 0 1-8 8H13a8 8 0 0 1-8-8z" fill="#7fbf52" />
  <path d="M29 40V14" stroke="#f3eee1" stroke-width="3.4" stroke-linecap="round" />
  <path d="M30.5 14.5h16l-4.2 6.2 4.2 6H30.5z" fill="#e0412f" />
</svg>
`;

export const MAYIN_TARLASI = {
  id: "mayin-tarlasi",
  ad: "Mayın Tarlası",
  tur: "oyun" as const,
  aciklama: "Harita kâğıdı üstünde klasik mayın tarlası: güvenli ilk kazı, bayrak ve akor, üç zorluk ve özel tarla, en iyi süreler, dokunmatikte Kazı ve Bayrak modu",
  kapak: "/gercek/build/sablon/mayin-tarlasi.webp",
  dosyalar: {
    "index.html": HTML,
    "stil.css": STIL,
    "ayarlar.json": AYARLAR,
    "oyun.js": OYUN,
    "ikon.svg": IKON,
  },
};
