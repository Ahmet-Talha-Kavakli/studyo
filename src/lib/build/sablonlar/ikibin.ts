/* Şablon: Çini 2048 — İznik çinisi renkleriyle 2048 bulmacası. Kaydırma ve birleşme animasyonları, dokunmatik kaydırma,
 * ok ve WASD tuşları, sınırlı geri alma, kazanma ve devam etme, oyun bitti ekranı, cihazda kalan oyun durumu ve en iyi skor.
 * Oynanış sayıları ayarlar.json'dan (Vayra Build ayar paneli kaydırıcıları). */

const HTML = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
  <meta name="theme-color" content="#0d1a33" />
  <meta name="description" content="Çini 2048: İznik çinisi renklerinde taşları kaydır, aynı sayıları birleştir, 2048 taşına ulaş." />
  <title>Çini 2048</title>
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,600;1,9..144,700&family=Outfit:wght@500;600;700;800&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <div class="zemin" aria-hidden="true"></div>

  <main class="sahne">
    <header class="ust">
      <div class="marka">
        <svg class="logo" viewBox="0 0 48 48" aria-hidden="true">
          <rect x="2" y="2" width="44" height="44" rx="12" fill="#f4e7cc" />
          <path d="M24 9c4 6 4 10 0 15-4-5-4-9 0-15Zm0 30c-4-6-4-10 0-15 4 5 4 9 0 15ZM9 24c6-4 10-4 15 0-5 4-9 4-15 0Zm30 0c-6 4-10 4-15 0 5-4 9-4 15 0Z" fill="#2a5fb8" />
          <circle cx="24" cy="24" r="3.6" fill="#d23c32" />
          <circle cx="10" cy="10" r="2" fill="#35b3a6" /><circle cx="38" cy="10" r="2" fill="#35b3a6" /><circle cx="10" cy="38" r="2" fill="#35b3a6" /><circle cx="38" cy="38" r="2" fill="#35b3a6" />
        </svg>
        <div class="marka-yazi"><b>Çini</b><span id="markaHedef">2048</span></div>
      </div>
      <div class="skorlar">
        <div class="skor" id="skorKutu"><span>Skor</span><b id="skor">0</b></div>
        <div class="skor en-iyi"><span>En iyi</span><b id="enIyi">0</b></div>
      </div>
    </header>

    <div class="arac">
      <p class="hedef-yazi">Aynı taşları birleştir, <b id="hedefYazi">2048</b> çinisine ulaş.</p>
      <div class="dugmeler">
        <button class="dugme ikincil" id="geriAl" type="button" aria-label="Son hamleyi geri al">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>
          <span>Geri al</span><i class="hak" id="geriHak">3</i>
        </button>
        <button class="dugme" id="yeni" type="button">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 4v5h-5" /></svg>
          <span id="yeniYazi">Yeni oyun</span>
        </button>
      </div>
    </div>

    <section class="tahta-kap">
      <div class="tahta" id="tahta" role="application" aria-roledescription="oyun tahtası" aria-label="2048 tahtası. Ok tuşlarıyla ya da parmağını kaydırarak taşları hareket ettir.">
        <div class="hucreler" id="hucreler" aria-hidden="true"></div>
        <div class="taslar" id="taslar" aria-hidden="true"></div>
        <div class="perde" id="perde" hidden>
          <div class="perde-kart" role="dialog" aria-modal="true" aria-labelledby="perdeBaslik">
            <p class="perde-ust" id="perdeUst"></p>
            <h2 id="perdeBaslik"></h2>
            <p class="perde-metin" id="perdeMetin"></p>
            <div class="perde-dugmeler">
              <button class="dugme" id="perdeAna" type="button"></button>
              <button class="dugme ikincil" id="perdeIkinci" type="button"></button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <aside class="yan">
      <section class="panel">
        <div class="panel-bas"><h2>Çini dizisi</h2><span id="diziDurum">2 açıldı</span></div>
        <ol class="dizi" id="dizi"></ol>
      </section>
      <section class="panel">
        <div class="panel-bas"><h2>Bu cihazda</h2></div>
        <dl class="istatistik">
          <div><dt>Hamle</dt><dd id="hamle">0</dd></div>
          <div><dt>Oyun</dt><dd id="oyunSayisi">0</dd></div>
          <div><dt>En büyük</dt><dd id="enBuyuk">2</dd></div>
        </dl>
      </section>
      <p class="ipucu">
        <span class="masaustu"><kbd>Ok tuşları</kbd> ya da <kbd>WASD</kbd> ile kaydır. <kbd>Z</kbd> geri alır, <kbd>N</kbd> yeni oyun açar.</span>
        <span class="dokunmatik">Tahtanın üzerinde parmağını dört yöne kaydır. Oyunun kapatsan da kaldığın yerde bekler.</span>
      </p>
    </aside>
  </main>

  <p class="gizli" id="durumOku" aria-live="polite"></p>
  <script src="oyun.js"></script>
</body>
</html>
`;

const STIL = String.raw`/* Çini 2048 — gece mavisi zemin, İznik paleti: krem sır, mercan, domates kırmızısı, turkuaz, kobalt, zümrüt, altın. */
:root {
  --gece: #0d1a33;
  --gece-2: #13244a;
  --tepsi: #182c57;
  --krem: #f4e7cc;
  --metin: #f6eedd;
  --metin-2: #c4c9dc;
  --metin-3: #8f98b8;
  --turkuaz: #35b3a6;
  --kirmizi: #d23c32;
  --altin: #e2b33c;
  --cizgi: rgba(244, 231, 204, 0.12);
  --sure: 110ms;
  --tahta: min(560px, calc(100dvh - 230px));
  --egri: cubic-bezier(0.22, 1, 0.36, 1);
  --yazi: "Outfit", system-ui, -apple-system, "Segoe UI", sans-serif;
  --baslik: "Fraunces", Georgia, serif;
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
[hidden] { display: none !important; }
html, body { margin: 0; background: var(--gece); }
body {
  min-height: 100vh; min-height: 100dvh;
  color: var(--metin); font-family: var(--yazi); font-size: 15px; line-height: 1.45;
  -webkit-font-smoothing: antialiased; overflow-x: hidden;
}
button { font: inherit; color: inherit; cursor: pointer; }
:focus-visible { outline: 2px solid var(--turkuaz); outline-offset: 3px; }
.gizli { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

.zemin {
  position: fixed; inset: 0; z-index: -1;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='%23f4e7cc' stroke-opacity='.06' stroke-width='1.2'%3E%3Cpath d='M60 12l13 35 35 13-35 13-13 35-13-35-35-13 35-13z'/%3E%3Ccircle cx='60' cy='60' r='9'/%3E%3Cpath d='M0 0l18 18M120 0l-18 18M0 120l18-18M120 120l-18-18'/%3E%3C/g%3E%3C/svg%3E"),
    radial-gradient(70% 55% at 15% 0%, rgba(210, 60, 50, 0.16), transparent 70%),
    radial-gradient(60% 50% at 100% 100%, rgba(53, 179, 166, 0.14), transparent 70%),
    linear-gradient(180deg, #102044 0%, var(--gece) 70%);
}

/* ── Yerleşim ── */
.sahne {
  min-height: 100vh; min-height: 100dvh;
  display: grid;
  grid-template-columns: var(--tahta) 300px;
  grid-template-areas: "ust ust" "arac yan" "tahta yan";
  grid-template-rows: auto auto auto;
  column-gap: 44px; row-gap: 18px;
  justify-content: center; align-content: center;
  padding: 28px 28px 36px;
}
.ust { grid-area: ust; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.arac { grid-area: arac; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.tahta-kap { grid-area: tahta; }
.yan { grid-area: yan; display: flex; flex-direction: column; gap: 14px; align-self: start; }

.marka { display: flex; align-items: center; gap: 12px; }
.logo { width: 46px; height: 46px; flex: none; }
.marka-yazi { display: flex; align-items: baseline; gap: 8px; }
.marka-yazi b { font-family: var(--baslik); font-style: italic; font-weight: 700; font-size: 34px; letter-spacing: -0.02em; color: var(--krem); }
.marka-yazi span { font-weight: 800; font-size: 26px; letter-spacing: -0.02em; color: var(--altin); }

.skorlar { display: flex; gap: 8px; }
.skor {
  position: relative; min-width: 96px; padding: 8px 14px 9px;
  border-radius: 14px; border: 1px solid var(--cizgi); background: rgba(244, 231, 204, 0.06);
  text-align: center;
}
.skor span { display: block; font-size: 12.5px; font-weight: 600; color: var(--metin-3); }
.skor b { display: block; font-size: 22px; font-weight: 800; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; line-height: 1.15; }
.skor.en-iyi b { color: var(--altin); }
.artis {
  position: absolute; left: 0; right: 0; top: 18px; text-align: center;
  font-weight: 800; font-size: 17px; color: var(--turkuaz); pointer-events: none;
  animation: artis 0.75s var(--egri) forwards;
}
@keyframes artis { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-34px); } }

.hedef-yazi { margin: 0; color: var(--metin-2); font-size: 15px; }
.hedef-yazi b { color: var(--krem); }
.dugmeler { display: flex; gap: 8px; flex: none; }
.dugme {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 44px; padding: 0 18px; border-radius: 999px;
  border: 1px solid transparent; background: var(--krem); color: #3a2410;
  font-weight: 700; font-size: 15px; white-space: nowrap;
  transition: transform 0.15s var(--egri), background 0.2s, opacity 0.2s;
}
.dugme:hover { background: #fff4dd; }
.dugme:active { transform: scale(0.96); }
.dugme svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.dugme.ikincil { background: rgba(244, 231, 204, 0.08); color: var(--metin); border-color: var(--cizgi); }
.dugme.ikincil:hover { background: rgba(244, 231, 204, 0.14); }
.dugme:disabled { opacity: 0.4; cursor: default; transform: none; }
.dugme.uyari { background: var(--kirmizi); color: #fff; }
.hak {
  font-style: normal; font-size: 12px; font-weight: 800; min-width: 22px; height: 22px; padding: 0 6px;
  display: inline-grid; place-items: center; border-radius: 999px; background: var(--turkuaz); color: #06221f;
}

/* ── Tahta ── */
.tahta {
  position: relative; width: var(--tahta); aspect-ratio: 1;
  border-radius: 22px; background: var(--tepsi);
  border: 1px solid rgba(244, 231, 204, 0.14);
  touch-action: none; user-select: none; -webkit-user-select: none;
  outline: none;
}
.tahta.titre { animation: titre 0.22s ease; }
@keyframes titre { 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
.hucreler {
  position: absolute; inset: 0; display: grid;
  grid-template-columns: repeat(var(--n, 4), 1fr); grid-template-rows: repeat(var(--n, 4), 1fr);
  gap: var(--g, 12px); padding: var(--g, 12px);
}
.hucreler i { border-radius: calc(var(--h, 100px) * 0.14); background: rgba(244, 231, 204, 0.07); box-shadow: inset 0 0 0 1px rgba(244, 231, 204, 0.05); }
.taslar { position: absolute; inset: 0; }
.tas {
  position: absolute; left: 0; top: 0; width: var(--h, 100px); height: var(--h, 100px);
  transition: transform var(--sure) ease-in-out;
  will-change: transform;
}
.olcu .tas { transition: none; }
.tas .ic {
  position: absolute; inset: 0; display: grid; place-items: center;
  border-radius: calc(var(--h, 100px) * 0.14);
  font-weight: 800; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; line-height: 1;
  background-color: var(--r, #f4e7cc); color: var(--y, #5b3a22);
  background-image: radial-gradient(120% 90% at 28% 18%, rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0) 52%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28), inset 0 calc(var(--h, 100px) * -0.05) 0 rgba(0, 0, 0, 0.12);
}
.tas.gidiyor { z-index: 0; }
.tas .ic.birlesti { animation: birles calc(var(--sure) * 2) var(--sure) both; z-index: 2; }
.tas .ic.dogdu { animation: dogdu calc(var(--sure) * 2) var(--sure) both; }
.tas .ic.geri { animation: geri 0.24s ease both; }
@keyframes birles { 0% { transform: scale(0.7); opacity: 0; } 55% { transform: scale(1.14); opacity: 1; } 100% { transform: scale(1); } }
@keyframes dogdu { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
@keyframes geri { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: none; } }
.tas[data-hane="1"] .ic { font-size: calc(var(--h, 100px) * 0.5); }
.tas[data-hane="2"] .ic { font-size: calc(var(--h, 100px) * 0.46); }
.tas[data-hane="3"] .ic { font-size: calc(var(--h, 100px) * 0.38); }
.tas[data-hane="4"] .ic { font-size: calc(var(--h, 100px) * 0.3); }
.tas[data-hane="5"] .ic { font-size: calc(var(--h, 100px) * 0.25); }
.tas[data-hane="6"] .ic, .tas[data-hane="7"] .ic { font-size: calc(var(--h, 100px) * 0.2); }

/* İznik paleti: her değerin sırı */
[data-v="2"] { --r: #f4e7cc; --y: #5b3a22; }
[data-v="4"] { --r: #ead3a6; --y: #5b3a22; }
[data-v="8"] { --r: #f0a066; --y: #fff8ee; }
[data-v="16"] { --r: #e4683f; --y: #fff8ee; }
[data-v="32"] { --r: #d23c32; --y: #fff8ee; }
[data-v="64"] { --r: #35b3a6; --y: #fff; }
[data-v="128"] { --r: #1f8a9e; --y: #fff; }
[data-v="256"] { --r: #2a5fb8; --y: #fff; }
[data-v="512"] { --r: #22408f; --y: #fff; }
[data-v="1024"] { --r: #2f7d4f; --y: #fff; }
[data-v="2048"] { --r: #e2b33c; --y: #3a2508; }
[data-v="buyuk"] { --r: #0a1226; --y: #f1c75a; }
.tas[data-v="128"] .ic, .tas[data-v="256"] .ic, .tas[data-v="512"] .ic, .tas[data-v="1024"] .ic, .tas[data-v="2048"] .ic, .tas[data-v="buyuk"] .ic {
  background-image:
    radial-gradient(circle at 13% 13%, rgba(255, 255, 255, 0.4) 0 3.5%, transparent 4.5%),
    radial-gradient(circle at 87% 13%, rgba(255, 255, 255, 0.4) 0 3.5%, transparent 4.5%),
    radial-gradient(circle at 13% 87%, rgba(255, 255, 255, 0.4) 0 3.5%, transparent 4.5%),
    radial-gradient(circle at 87% 87%, rgba(255, 255, 255, 0.4) 0 3.5%, transparent 4.5%),
    radial-gradient(120% 90% at 28% 18%, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0) 52%);
}
.tas[data-v="2048"] .ic, .tas[data-v="buyuk"] .ic {
  box-shadow: inset 0 0 0 calc(var(--h, 100px) * 0.05) rgba(255, 255, 255, 0.22), inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}
.tas[data-v="buyuk"] .ic { box-shadow: inset 0 0 0 calc(var(--h, 100px) * 0.05) rgba(241, 199, 90, 0.35), inset 0 0 0 1px rgba(241, 199, 90, 0.6); }

/* ── Perde ── */
.perde {
  position: absolute; inset: 0; z-index: 5; display: grid; place-items: center; padding: 18px;
  border-radius: 22px; background: rgba(13, 26, 51, 0.72);
  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
  animation: perdeAc 0.4s var(--egri);
}
.perde.kazandi { background: rgba(60, 40, 8, 0.55); }
@keyframes perdeAc { from { opacity: 0; } to { opacity: 1; } }
.perde-kart { max-width: 360px; text-align: center; animation: kartAc 0.5s var(--egri); }
@keyframes kartAc { from { opacity: 0; transform: translateY(14px) scale(0.97); } to { opacity: 1; transform: none; } }
.perde-ust { margin: 0 0 6px; font-weight: 600; font-size: 14px; color: var(--turkuaz); }
.perde.kazandi .perde-ust { color: #ffd77a; }
.perde-kart h2 { margin: 0; font-family: var(--baslik); font-style: italic; font-weight: 700; font-size: clamp(38px, 9vw, 56px); line-height: 1.05; letter-spacing: -0.02em; color: var(--krem); }
.perde-metin { margin: 10px 0 20px; color: var(--metin-2); font-size: 15.5px; }
.perde-metin b { color: var(--krem); }
.perde-dugmeler { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }

/* ── Yan panel ── */
.panel { border: 1px solid var(--cizgi); border-radius: 18px; padding: 16px; background: rgba(244, 231, 204, 0.04); }
.panel-bas { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
.panel h2 { margin: 0; font-family: var(--baslik); font-style: italic; font-weight: 600; font-size: 20px; color: var(--krem); }
.panel-bas span { font-size: 13px; color: var(--metin-3); }
.dizi { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.dizi li {
  --h: 58px; position: relative; aspect-ratio: 1; display: grid; place-items: center;
  border-radius: 12px; font-weight: 800; font-size: 16px; letter-spacing: -0.02em;
  background: rgba(244, 231, 204, 0.06); color: var(--metin-3);
  border: 1px dashed rgba(244, 231, 204, 0.16);
  transition: background 0.3s, color 0.3s;
}
.dizi li.acik { background-color: var(--r); color: var(--y); border: 1px solid rgba(255, 255, 255, 0.25); background-image: radial-gradient(120% 90% at 28% 18%, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0) 52%); }
.dizi li.simdi::after { content: ""; position: absolute; inset: -4px; border-radius: 15px; border: 2px solid var(--krem); }
.dizi li[data-hane="4"], .dizi li[data-hane="5"] { font-size: 13px; }
.istatistik { margin: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.istatistik div { padding: 10px; border-radius: 12px; background: rgba(244, 231, 204, 0.05); }
.istatistik dt { font-size: 12.5px; color: var(--metin-3); }
.istatistik dd { margin: 2px 0 0; font-size: 20px; font-weight: 800; font-variant-numeric: tabular-nums; }
.ipucu { margin: 2px 4px 0; color: var(--metin-3); font-size: 13.5px; line-height: 1.6; }
kbd { font-family: var(--yazi); font-size: 12px; font-weight: 700; padding: 1px 7px; border-radius: 6px; background: rgba(244, 231, 204, 0.1); color: var(--metin-2); border: 1px solid var(--cizgi); }
.dokunmatik { display: none; }
.dokunmatik-cihaz .masaustu { display: none; }
.dokunmatik-cihaz .dokunmatik { display: inline; }

/* ── Dar ekran ── */
@media (max-width: 900px) {
  .sahne {
    --tahta: min(560px, calc(100vw - 32px), max(260px, calc(100dvh - 220px)));
    grid-template-columns: var(--tahta);
    grid-template-areas: "ust" "arac" "tahta" "yan";
    grid-template-rows: none;
    align-content: start; row-gap: 14px;
    padding: calc(env(safe-area-inset-top) + 16px) 16px calc(env(safe-area-inset-bottom) + 28px);
  }
  .tahta { border-radius: 18px; }
  .perde { border-radius: 18px; }
  .yan { margin-top: 8px; }
}
@media (max-width: 480px) {
  .logo { width: 38px; height: 38px; }
  .marka { gap: 9px; }
  .marka-yazi { gap: 6px; }
  .marka-yazi b { font-size: 27px; }
  .marka-yazi span { font-size: 21px; }
  .skor { min-width: 74px; padding: 6px 10px 7px; border-radius: 12px; }
  .skor b { font-size: 19px; }
  .skor span { font-size: 11.5px; }
  .hedef-yazi { font-size: 13.5px; }
  .dugme { padding: 0 14px; font-size: 14.5px; }
  .arac .dugme span:not(.hak) { display: none; }
  .arac .dugme { width: 44px; padding: 0; position: relative; }
  .arac .hak { position: absolute; top: -5px; right: -5px; min-width: 19px; height: 19px; font-size: 11px; }
  .dizi { grid-template-columns: repeat(6, 1fr); gap: 6px; }
  .dizi li { font-size: 12.5px; border-radius: 9px; }
  .dizi li[data-hane="4"], .dizi li[data-hane="5"] { font-size: 10.5px; }
}
@media (prefers-reduced-motion: reduce) {
  .tas { transition: none; }
  .tas .ic.birlesti, .tas .ic.dogdu, .tahta.titre { animation: none; }
}
`;

const AYARLAR = `{
  "boyut": { "etiket": "Tahta boyutu (kenar başına taş)", "deger": 4, "min": 3, "max": 6, "adim": 1 },
  "hedefUs": { "etiket": "Hedef taş (2 üssü, 11 ise 2048)", "deger": 11, "min": 6, "max": 15, "adim": 1 },
  "dortOlasiligi": { "etiket": "Yeni taşın 4 gelme olasılığı (yüzde)", "deger": 10, "min": 0, "max": 60, "adim": 5 },
  "geriAlHakki": { "etiket": "Oyun başına geri alma hakkı", "deger": 3, "min": 0, "max": 10, "adim": 1 },
  "kaydirmaSuresi": { "etiket": "Kaydırma animasyonu (milisaniye)", "deger": 110, "min": 50, "max": 300, "adim": 10 }
}
`;

const OYUN = String.raw`// Çini 2048 — oynanış sayıları ayarlar.json'dan gelir (Vayra Build ayar paneli bu dosyayı düzenler).
var A = { boyut: 4, hedefUs: 11, dortOlasiligi: 10, geriAlHakki: 3, kaydirmaSuresi: 110 };

var $ = function (id) { return document.getElementById(id); };
var tahta = $("tahta"), hucrelerEl = $("hucreler"), taslarEl = $("taslar"), perde = $("perde");
var KAYIT = "cini-2048-durum", ISTAT = "cini-2048-istatistik";
var n = 4, hedef = 2048, sure = 110, izgara = [], skor = 0, hamle = 0, hak = 3, gecmis = [];
var kazandi = false, devam = false, bitti = false, enIyi = 0, rekorOnce = 0, sira = 0, olu = [], temizZ = 0, yeniOnayZ = 0, hazir = false;
var olcu = { g: 12, h: 100 };
var istat = oku(ISTAT) || { oyun: 0, enBuyuk: 2 };
if ((window.matchMedia && matchMedia("(pointer: coarse)").matches) || (navigator.maxTouchPoints > 0 && innerWidth < 900)) document.documentElement.classList.add("dokunmatik-cihaz");
addEventListener("pointerdown", function (e) { if (e.pointerType === "touch") document.documentElement.classList.add("dokunmatik-cihaz"); }, true);

function oku(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
function yaz(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* depolama dolu */ } }
function sinirla(v, a, b) { v = Number(v); if (!isFinite(v)) v = a; return Math.max(a, Math.min(b, v)); }
function sayi(x) { return Number(x).toLocaleString("tr-TR"); }

/* ── Ayarlar ── */
fetch("ayarlar.json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
  Object.keys(j).forEach(function (k) { if (j[k] && typeof j[k].deger === "number") A[k] = j[k].deger; });
}).catch(function () {}).then(baslat);

function baslat() {
  n = Math.round(sinirla(A.boyut, 3, 8));
  hedef = Math.pow(2, Math.round(sinirla(A.hedefUs, 4, 17)));
  sure = Math.round(sinirla(A.kaydirmaSuresi, 30, 500));
  document.documentElement.style.setProperty("--sure", sure + "ms");
  $("hedefYazi").textContent = hedef; $("markaHedef").textContent = hedef;
  document.title = "Çini " + hedef;
  enIyi = Number(localStorage.getItem("cini-2048-en-iyi-" + n) || 0); rekorOnce = enIyi;
  hucreKur(); diziKur(); olc();
  var d = oku(KAYIT);
  if (d && d.n === n && d.hedef === hedef && Array.isArray(d.degerler) && d.degerler.length === n * n && !d.bitti) yukle(d);
  else yeniOyun();
  hazir = true;
}

/* ── Ölçü: taşlar tam piksel konumlanır ── */
function hucreKur() {
  hucrelerEl.innerHTML = "";
  for (var i = 0; i < n * n; i++) hucrelerEl.appendChild(document.createElement("i"));
  tahta.style.setProperty("--n", n);
}
function olc() {
  var b = tahta.clientWidth || 400;
  var g = Math.max(5, Math.round(b * (n <= 4 ? 0.03 : n === 5 ? 0.025 : 0.02)));
  olcu.g = g; olcu.h = (b - g * (n + 1)) / n;
  tahta.style.setProperty("--g", g + "px"); tahta.style.setProperty("--h", olcu.h + "px");
  tahta.classList.add("olcu");
  izgara.forEach(function (t) { if (t && t.el) konum(t); });
  void tahta.offsetWidth; tahta.classList.remove("olcu");
}
if (window.ResizeObserver) new ResizeObserver(function () { if (hazir) olc(); }).observe(tahta);
else addEventListener("resize", function () { if (hazir) olc(); });

/* ── Taşlar ── */
function tasYap(v, r, c, tur) {
  var t = { id: ++sira, v: v, r: r, c: c, el: document.createElement("div") };
  t.el.className = "tas";
  t.el.innerHTML = '<span class="ic"></span>';
  t.el.firstChild.textContent = v;
  t.el.dataset.v = v <= 2048 ? v : "buyuk";
  t.el.dataset.hane = String(v).length;
  if (tur) t.el.firstChild.classList.add(tur);
  konum(t);
  taslarEl.appendChild(t.el);
  return t;
}
function konum(t) {
  t.el.style.transform = "translate(" + (olcu.g + t.c * (olcu.h + olcu.g)) + "px," + (olcu.g + t.r * (olcu.h + olcu.g)) + "px)";
}
function hucre(r, c) { return izgara[r * n + c]; }
function bosHucreler() { var l = []; izgara.forEach(function (t, i) { if (!t) l.push(i); }); return l; }
function tasEkle(animasyon) {
  var bos = bosHucreler(); if (!bos.length) return;
  var i = bos[Math.floor(Math.random() * bos.length)];
  var v = Math.random() * 100 < sinirla(A.dortOlasiligi, 0, 100) ? 4 : 2;
  izgara[i] = tasYap(v, Math.floor(i / n), i % n, animasyon ? "dogdu" : "geri");
}
function tumunuKur(d, tur) {
  taslarEl.innerHTML = ""; olu = [];
  izgara = d.map(function (v, i) { return v ? tasYap(v, Math.floor(i / n), i % n, tur) : null; });
}
function temizle() { clearTimeout(temizZ); olu.forEach(function (e) { e.remove(); }); olu = []; }
function enBuyukTas() { var m = 0; izgara.forEach(function (t) { if (t && t.v > m) m = t.v; }); return m; }

/* ── Hamle ── */
var YON = { yukari: [-1, 0], asagi: [1, 0], sol: [0, -1], sag: [0, 1] };
function anlik() { return { d: izgara.map(function (t) { return t ? t.v : 0; }), s: skor, h: hamle }; }

function kaydir(yon) {
  if (!hazir || bitti || !perde.hidden) return;
  temizle();
  var v = YON[yon], once = anlik(), kazanc = 0, oynadi = false, birlesenler = [];
  var rs = [], cs = [];
  for (var i = 0; i < n; i++) { rs.push(i); cs.push(i); }
  if (v[0] === 1) rs.reverse();
  if (v[1] === 1) cs.reverse();
  rs.forEach(function (r) {
    cs.forEach(function (c) {
      var t = hucre(r, c); if (!t) return;
      var nr = r, nc = c, es = null;
      for (;;) {
        var rr = nr + v[0], cc = nc + v[1];
        if (rr < 0 || cc < 0 || rr >= n || cc >= n) break;
        var o = hucre(rr, cc);
        if (!o) { nr = rr; nc = cc; continue; }
        if (o.v === t.v && !o.birlesik) es = o;
        break;
      }
      if (es) {
        izgara[r * n + c] = null;
        var m = { v: t.v * 2, r: es.r, c: es.c, birlesik: true, kaynak: [t, es] };
        izgara[m.r * n + m.c] = m; birlesenler.push(m);
        t.r = m.r; t.c = m.c; kazanc += m.v; oynadi = true;
      } else if (nr !== r || nc !== c) {
        izgara[r * n + c] = null; izgara[nr * n + nc] = t; t.r = nr; t.c = nc; oynadi = true;
      }
    });
  });
  if (!oynadi) { tahta.classList.remove("titre"); void tahta.offsetWidth; tahta.classList.add("titre"); return; }

  if (sinirla(A.geriAlHakki, 0, 99) > 0) { gecmis.push(once); while (gecmis.length > Math.max(hak, 1)) gecmis.shift(); }
  izgara.forEach(function (t) { if (t && t.el) konum(t); });
  birlesenler.forEach(function (m) {
    m.kaynak.forEach(function (k) { konum(k); k.el.classList.add("gidiyor"); olu.push(k.el); });
    izgara[m.r * n + m.c] = tasYap(m.v, m.r, m.c, "birlesti");
  });
  temizZ = setTimeout(temizle, sure + 40);
  skor += kazanc; hamle++;
  if (kazanc) skorArtis(kazanc);
  if (birlesenler.length && navigator.vibrate) { try { navigator.vibrate(birlesenler.some(function (m) { return m.v >= 128; }) ? 18 : 8); } catch (e) { /* yok */ } }
  tasEkle(true);

  var buyuk = enBuyukTas();
  if (buyuk > istat.enBuyuk) { istat.enBuyuk = buyuk; yaz(ISTAT, istat); }
  if (!kazandi && buyuk >= hedef) { kazandi = true; setTimeout(function () { perdeGoster("kazandi"); }, sure * 3 + 200); }
  else if (!hamleVar()) { bitti = true; setTimeout(function () { perdeGoster("bitti"); }, sure * 3 + 350); }
  hud(); kaydet();
}

function hamleVar() {
  for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
    var t = hucre(r, c); if (!t) return true;
    if (c < n - 1 && hucre(r, c + 1) && hucre(r, c + 1).v === t.v) return true;
    if (r < n - 1 && hucre(r + 1, c) && hucre(r + 1, c).v === t.v) return true;
  }
  return false;
}

function geriAl() {
  if (!hazir || hak <= 0 || !gecmis.length) return;
  var a = gecmis.pop(); hak--;
  temizle(); tumunuKur(a.d, "geri");
  skor = a.s; hamle = a.h; bitti = false;
  perdeGizle(); hud(); kaydet();
  $("durumOku").textContent = "Son hamle geri alındı. Kalan hak " + hak + ".";
}

function yeniOyun() {
  temizle();
  izgara = []; for (var i = 0; i < n * n; i++) izgara.push(null);
  taslarEl.innerHTML = "";
  skor = 0; hamle = 0; hak = Math.round(sinirla(A.geriAlHakki, 0, 99)); gecmis = [];
  kazandi = false; devam = false; bitti = false; rekorOnce = enIyi;
  tasEkle(true); tasEkle(true);
  istat.oyun++; yaz(ISTAT, istat);
  perdeGizle(); hud(); kaydet();
}

function yukle(d) {
  tumunuKur(d.degerler, "geri");
  skor = d.skor || 0; hamle = d.hamle || 0; hak = typeof d.hak === "number" ? d.hak : A.geriAlHakki;
  gecmis = Array.isArray(d.gecmis) ? d.gecmis.filter(function (a) { return a && Array.isArray(a.d) && a.d.length === n * n; }) : [];
  kazandi = !!d.kazandi; devam = !!d.devam; bitti = false; rekorOnce = enIyi;
  if (kazandi && !devam) perdeGoster("kazandi");
  hud();
}

function kaydet() {
  yaz(KAYIT, { n: n, hedef: hedef, degerler: izgara.map(function (t) { return t ? t.v : 0; }), skor: skor, hamle: hamle, hak: hak, gecmis: gecmis, kazandi: kazandi, devam: devam, bitti: bitti });
}

/* ── Gösterge ── */
function hud() {
  if (skor > enIyi) { enIyi = skor; localStorage.setItem("cini-2048-en-iyi-" + n, String(enIyi)); }
  $("skor").textContent = sayi(skor);
  $("enIyi").textContent = sayi(enIyi);
  $("hamle").textContent = sayi(hamle);
  $("oyunSayisi").textContent = sayi(istat.oyun);
  $("enBuyuk").textContent = istat.enBuyuk;
  var gb = $("geriAl");
  gb.hidden = sinirla(A.geriAlHakki, 0, 99) === 0;
  gb.disabled = hak <= 0 || !gecmis.length;
  $("geriHak").textContent = hak;
  gb.setAttribute("aria-label", "Son hamleyi geri al, " + hak + " hak kaldı");
  var buyuk = enBuyukTas(), acik = 0;
  Array.prototype.forEach.call($("dizi").children, function (li) {
    var v = Number(li.dataset.deger);
    li.classList.toggle("acik", buyuk >= v);
    li.classList.toggle("simdi", buyuk === v);
    if (buyuk >= v) acik++;
  });
  $("diziDurum").textContent = acik + " / " + $("dizi").children.length + " açıldı";
}
function diziKur() {
  var ol = $("dizi"); ol.innerHTML = "";
  for (var v = 2; v <= hedef; v *= 2) {
    var li = document.createElement("li");
    li.dataset.deger = v; li.dataset.v = v <= 2048 ? v : "buyuk"; li.dataset.hane = String(v).length;
    li.textContent = v; ol.appendChild(li);
  }
}
function skorArtis(k) {
  var i = document.createElement("i"); i.className = "artis"; i.textContent = "+" + sayi(k);
  $("skorKutu").appendChild(i);
  setTimeout(function () { i.remove(); }, 800);
}

/* ── Perde ── */
var perdeMod = "";
function perdeGoster(mod) {
  perdeMod = mod;
  perde.classList.toggle("kazandi", mod === "kazandi");
  var ikinci = $("perdeIkinci");
  if (mod === "kazandi") {
    $("perdeUst").textContent = "Hedef çiniye ulaştın";
    $("perdeBaslik").textContent = hedef + "!";
    $("perdeMetin").innerHTML = "Skorun <b>" + sayi(skor) + "</b>, " + sayi(hamle) + " hamlede. İstersen aynı tahtada devam et, daha büyük çinilerin peşine düş.";
    $("perdeAna").textContent = "Devam et"; ikinci.textContent = "Yeni oyun"; ikinci.hidden = false;
  } else {
    var rekor = skor > 0 && skor >= enIyi && skor > rekorOnce;
    $("perdeUst").textContent = rekor ? "Yeni rekor" : "Hamle kalmadı";
    $("perdeBaslik").textContent = "Oyun bitti";
    $("perdeMetin").innerHTML = "Skorun <b>" + sayi(skor) + "</b>, en büyük çinin <b>" + enBuyukTas() + "</b>." + (rekor ? " Bu tahtadaki en iyi skorun bu artık." : "");
    $("perdeAna").textContent = "Yeniden oyna";
    ikinci.hidden = !(hak > 0 && gecmis.length);
    ikinci.textContent = "Geri al (" + hak + " hak)";
  }
  perde.hidden = false;
  $("perdeAna").focus({ preventScroll: true });
}
function perdeGizle() { perde.hidden = true; perdeMod = ""; }
$("perdeAna").addEventListener("click", function () {
  if (perdeMod === "kazandi") { devam = true; perdeGizle(); kaydet(); tahta.focus({ preventScroll: true }); }
  else yeniOyun();
});
$("perdeIkinci").addEventListener("click", function () {
  if (perdeMod === "kazandi") yeniOyun(); else geriAl();
});

/* ── Düğmeler ── */
$("geriAl").addEventListener("click", geriAl);
$("yeni").addEventListener("click", function () {
  var b = $("yeni");
  if (hamle > 0 && !bitti && !b.classList.contains("uyari")) {
    b.classList.add("uyari"); $("yeniYazi").textContent = "Emin misin?";
    b.setAttribute("aria-label", "Yeni oyun başlatmak için yeniden bas");
    clearTimeout(yeniOnayZ);
    yeniOnayZ = setTimeout(yeniSifirla, 2600);
    return;
  }
  yeniSifirla(); yeniOyun();
});
function yeniSifirla() { var b = $("yeni"); b.classList.remove("uyari"); $("yeniYazi").textContent = "Yeni oyun"; b.removeAttribute("aria-label"); }

/* ── Klavye ── */
var TUS = { ArrowUp: "yukari", ArrowDown: "asagi", ArrowLeft: "sol", ArrowRight: "sag", w: "yukari", s: "asagi", a: "sol", d: "sag", W: "yukari", S: "asagi", A: "sol", D: "sag" };
addEventListener("keydown", function (e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (TUS[e.key]) { e.preventDefault(); kaydir(TUS[e.key]); return; }
  if ((e.key === "z" || e.key === "Z") && !e.repeat) geriAl();
  if ((e.key === "n" || e.key === "N") && !e.repeat) { yeniSifirla(); yeniOyun(); }
});

/* ── Dokunmatik ve fare ile kaydırma ── */
var basla = null;
tahta.addEventListener("pointerdown", function (e) {
  if (!e.isPrimary || e.target.closest(".perde")) return;
  basla = { x: e.clientX, y: e.clientY, z: Date.now() };
});
tahta.addEventListener("pointermove", function (e) {
  if (!basla || !e.isPrimary) return;
  var dx = e.clientX - basla.x, dy = e.clientY - basla.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) > 34) { basla = null; kaydir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "sag" : "sol") : (dy > 0 ? "asagi" : "yukari")); }
});
tahta.addEventListener("pointerup", function (e) {
  if (!basla) return;
  var dx = e.clientX - basla.x, dy = e.clientY - basla.y; basla = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) > 18) kaydir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "sag" : "sol") : (dy > 0 ? "asagi" : "yukari"));
});
tahta.addEventListener("pointercancel", function () { basla = null; });
document.addEventListener("touchmove", function (e) { if (e.target.closest && e.target.closest("#tahta")) e.preventDefault(); }, { passive: false });
document.addEventListener("visibilitychange", function () { if (document.hidden && hazir) kaydet(); });
`;

const IKON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#0d1a33" />
  <rect x="7" y="7" width="23" height="23" rx="6" fill="#f4e7cc" />
  <rect x="34" y="7" width="23" height="23" rx="6" fill="#d23c32" />
  <rect x="7" y="34" width="23" height="23" rx="6" fill="#35b3a6" />
  <rect x="34" y="34" width="23" height="23" rx="6" fill="#e2b33c" />
  <path d="M45.5 39c2.5 3.8 2.5 6.4 0 9.6-2.5-3.2-2.5-5.8 0-9.6Z" fill="#3a2508" />
  <circle cx="18.5" cy="18.5" r="4" fill="#2a5fb8" />
</svg>
`;

export const IKI_BIN_KIRK_SEKIZ = {
  id: "oyun-2048",
  ad: "Çini 2048",
  tur: "oyun" as const,
  aciklama: "İznik çinisi renklerinde 2048: akıcı kaydırma, geri alma hakkı, devam etme ve kaldığın yerden süren oyun",
  kapak: "/gercek/build/sablon/oyun-2048.webp",
  dosyalar: {
    "index.html": HTML,
    "stil.css": STIL,
    "ayarlar.json": AYARLAR,
    "oyun.js": OYUN,
    "ikon.svg": IKON,
  },
};
