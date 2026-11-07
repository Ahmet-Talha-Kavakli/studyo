/* Şablon: Hafıza Kartları — DOM + CSS 3B çevirmeli kart eşleştirme oyunu (üç zorluk, hamle ve süre sayacı, yıldız puanı, en iyi süre). Ayarlar ayarlar.json'dan (Vayra Build ayar paneli kaydırıcıları). */

export const HAFIZA_KARTLARI = {
  id: "hafiza-kartlari",
  ad: "Hafıza Kartları",
  tur: "oyun" as const,
  aciklama: "Üç zorlukta kart eşleştirme; yıldız puanı, konfeti ve en iyi süre",
  kapak: "/gercek/build/sablon/hafiza-kartlari.webp",
  dosyalar: {
    "index.html": `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Hafıza Kartları</title>
  <meta name="description" content="Kartları çevir, eşlerini bul: üç zorluk seviyesi, yıldız puanı ve en iyi süre." />
  <meta name="theme-color" content="#fff4e6" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='3' y='2' width='26' height='28' rx='7' fill='%23ff6b4a'/%3E%3Ccircle cx='16' cy='16' r='7' fill='%23fff7ec'/%3E%3Cpath d='M13.6 14.2a2.4 2.4 0 1 1 3.4 2.2c-.7.3-1 .8-1 1.5' stroke='%23ff6b4a' stroke-width='1.8' fill='none' stroke-linecap='round'/%3E%3Ccircle cx='16' cy='20.3' r='1.1' fill='%23ff6b4a'/%3E%3C/svg%3E" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body data-zorluk="orta">
  <div class="zemin" aria-hidden="true"><span class="leke l1"></span><span class="leke l2"></span><span class="leke l3"></span></div>

  <div class="uygulama">
    <aside class="panel" aria-label="Oyun paneli">
      <div class="marka">
        <span class="logo" id="logo"></span>
        <div>
          <h1>Hafıza Kartları</h1>
          <p>Eşini bul, yıldızları topla</p>
        </div>
      </div>

      <div class="eylemler">
        <button class="dugme birincil" id="yeniOyun" type="button" title="Yeni oyun" aria-label="Yeni oyun">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>Yeni oyun</span>
        </button>
        <button class="dugme ikon" id="sesDugme" type="button" aria-pressed="true" aria-label="Sesi kapat">
          <svg class="ses-acik" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.2 6.5a8 8 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
          <svg class="ses-kapali" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
        </button>
      </div>

      <div class="zorluk">
        <span class="baslik-kucuk" id="zorlukEtiket">Zorluk</span>
        <div class="secici" role="radiogroup" aria-labelledby="zorlukEtiket">
          <span class="kayan" aria-hidden="true"></span>
          <button type="button" role="radio" data-zorluk="kolay" aria-checked="false"><b>Kolay</b><small>4×3</small></button>
          <button type="button" role="radio" data-zorluk="orta" aria-checked="true"><b>Orta</b><small>4×4</small></button>
          <button type="button" role="radio" data-zorluk="zor" aria-checked="false"><b>Zor</b><small>6×5</small></button>
        </div>
      </div>

      <dl class="ozet">
        <div class="olcu sure"><dt>Süre</dt><dd id="sure">0:00</dd></div>
        <div class="olcu hamle"><dt>Hamle</dt><dd id="hamle">0</dd></div>
        <div class="olcu eslesen"><dt>Eşleşen</dt><dd id="eslesen">0 / 8</dd></div>
        <div class="olcu yildiz">
          <dt>Yıldız</dt>
          <dd><span class="yildizlar" id="yildizlar"></span><span class="yildiz-not" id="yildizNot">12 hamleye kadar üç yıldız</span></dd>
        </div>
        <div class="olcu rekor">
          <dt><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v3M8.5 20h7l-1-3h-5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg><span>En iyi<span class="genis-metin"> süre</span></span></dt>
          <dd id="enIyi">Henüz yok</dd>
        </div>
      </dl>

      <div class="ilerleme" aria-hidden="true"><span id="ilerlemeCubuk"></span></div>

      <p class="ipucu">Ok tuşlarıyla kartlar arasında gez, Enter ya da boşlukla çevir.</p>
    </aside>

    <main class="masa" id="masa">
      <div class="tahta" id="tahta" aria-label="Kartlar"></div>
      <div class="balon" id="balon" role="status" aria-live="polite"></div>

      <div class="giris gorunur" id="giris">
        <div class="giris-kart" role="dialog" aria-labelledby="girisBaslik" aria-describedby="girisMetin">
          <div class="yelpaze" id="yelpaze" aria-hidden="true"></div>
          <h2 id="girisBaslik">Hazır mısın?</h2>
          <p id="girisMetin">Kartlar başta 2 saniye açık kalır. Yerlerini aklında tut, sonra çiftleri en az hamleyle eşleştir.</p>
          <button class="dugme birincil buyuk" id="basla" type="button">Başla</button>
          <span class="kisayol">ya da Enter'a bas</span>
        </div>
      </div>
    </main>
  </div>

  <div class="sonuc" id="sonuc" aria-hidden="true">
    <div class="sonuc-kart" role="dialog" aria-modal="true" aria-labelledby="sonucBaslik">
      <div class="sonuc-yildiz" id="sonucYildiz"></div>
      <span class="rozet" id="rekorRozet">Yeni rekor</span>
      <h2 id="sonucBaslik">Harika iş!</h2>
      <p id="sonucMetin"></p>
      <dl class="sonuc-olcu">
        <div><dt>Süre</dt><dd id="sonucSure">0:00</dd></div>
        <div><dt>Hamle</dt><dd id="sonucHamle">0</dd></div>
        <div><dt>En iyi</dt><dd id="sonucEnIyi">0:00</dd></div>
      </dl>
      <div class="sonuc-eylem">
        <button class="dugme birincil" id="tekrar" type="button">Tekrar oyna</button>
        <button class="dugme ikincil" id="sonraki" type="button">Zor seviyeye geç</button>
      </div>
    </div>
  </div>

  <canvas class="konfeti" id="konfeti" aria-hidden="true"></canvas>

  <script src="cizimler.js"></script>
  <script src="oyun.js"></script>
</body>
</html>
`,
    "stil.css": `/* Hafıza Kartları — sıcak, oyuncak dili: krem zemin, tok renkli kartlar, kalın alt kenarlar. */
:root {
  --zemin: #fff4e6;
  --kagit: #fffaf3;
  --cizgi: #f0dcc4;
  --cizgi-koyu: #e6caa9;
  --murekkep: #3b2340;
  --ikincil: #7a5c6c;
  --altin: #ffbe2e;
  --vurgu: #ff6b4a;
  --vurgu-kenar: #d6492b;
  --vurgu-acik: #ffe2d8;
  --cevir: 480ms;
  --w: 120px;
  --h: 146px;
  --b: 12px;
  --sut: 4;
  --yay: cubic-bezier(.34, 1.4, .52, 1);
}
body[data-zorluk="kolay"] { --vurgu: #12a58b; --vurgu-kenar: #0b7f6a; --vurgu-acik: #d3f2e9; }
body[data-zorluk="zor"] { --vurgu: #7452ee; --vurgu-kenar: #5434c6; --vurgu-acik: #e7dffd; }

* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; }
body {
  background: var(--zemin);
  color: var(--murekkep);
  font-family: "Nunito", system-ui, sans-serif;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
}
button { font: inherit; color: inherit; }
h1, h2 { font-family: "Fredoka", "Nunito", system-ui, sans-serif; margin: 0; letter-spacing: -.01em; }

/* Zemin süsleri */
.zemin { position: fixed; inset: 0; z-index: -1; overflow: hidden;
  background-image: radial-gradient(rgba(150, 100, 60, .11) 1.4px, transparent 1.6px);
  background-size: 24px 24px; }
.leke { position: absolute; border-radius: 50%; filter: blur(60px); opacity: .75; }
.l1 { width: 46vmax; height: 46vmax; left: -14vmax; top: -18vmax; background: #ffd9bd; }
.l2 { width: 38vmax; height: 38vmax; right: -12vmax; bottom: -16vmax; background: #ffe8a8; }
.l3 { width: 26vmax; height: 26vmax; right: 18vmax; top: -12vmax; background: var(--vurgu-acik); transition: background .5s; }

/* Düzen */
.uygulama {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 22px;
  height: 100vh;
  height: 100dvh;
  padding: 22px;
}
.panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
  overflow: auto;
  padding: 22px 20px 20px;
  background: var(--kagit);
  border: 2px solid var(--cizgi);
  border-bottom-width: 7px;
  border-radius: 30px;
  scrollbar-width: none;
}
.marka { display: flex; align-items: center; gap: 12px; }
.logo { width: 50px; height: 50px; flex: none; display: block; }
.logo svg { width: 100%; height: 100%; display: block; }
.marka h1 { font-size: 23px; font-weight: 600; line-height: 1.1; }
.marka p { margin: 3px 0 0; font-size: 13.5px; font-weight: 600; color: var(--ikincil); }

.baslik-kucuk { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 700; color: var(--ikincil); }

/* Zorluk seçici */
.secici { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); padding: 4px; border-radius: 18px; background: #f7e9d6; }
.secici button {
  position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 1px;
  padding: 8px 4px 7px; border: 0; border-radius: 14px; background: none; cursor: pointer;
  color: var(--ikincil); transition: color .25s;
}
.secici button b { font-family: "Fredoka", sans-serif; font-weight: 600; font-size: 15px; }
.secici button small { font-size: 12px; font-weight: 700; opacity: .8; }
.secici button[aria-checked="true"] { color: #fff; }
.secici button:focus-visible { outline: 3px solid var(--murekkep); outline-offset: 1px; }
.kayan {
  position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc((100% - 8px) / 3);
  border-radius: 14px; background: var(--vurgu); border-bottom: 4px solid var(--vurgu-kenar);
  transition: transform .45s var(--yay), background .35s, border-color .35s;
}

/* Ölçüler */
.ozet { margin: 0; display: grid; grid-template-columns: 1fr 1fr; }
.olcu { margin: 0; padding: 14px 0; border-top: 2px dashed var(--cizgi); }
.olcu dt { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--ikincil); }
.olcu dt svg { width: 16px; height: 16px; color: var(--altin); }
.olcu dd { margin: 4px 0 0; font-family: "Fredoka", sans-serif; font-weight: 600; font-size: 26px; line-height: 1.1; font-variant-numeric: tabular-nums; }
.olcu.sure { grid-column: 1 / -1; border-top: 0; padding-top: 0; }
.olcu.sure dd { font-size: 60px; font-weight: 600; line-height: 1; color: var(--murekkep); }
.olcu.hamle { border-right: 2px dashed var(--cizgi); }
.olcu.eslesen { padding-left: 16px; }
.olcu.yildiz, .olcu.rekor { grid-column: 1 / -1; }
.yildizlar { display: inline-flex; gap: 4px; vertical-align: middle; }
.yildizlar svg { width: 30px; height: 30px; transition: transform .35s var(--yay); }
.yildizlar svg path { fill: #f2e2cb; stroke: #f2e2cb; transition: fill .3s, stroke .3s; }
.yildizlar svg.dolu path { fill: var(--altin); stroke: var(--altin); }
.yildizlar svg.dustu { animation: yildiz-dus .5s ease; }
.yildiz-not { display: block; margin-top: 6px; font-family: "Nunito", sans-serif; font-size: 13px; font-weight: 700; color: var(--ikincil); }
.olcu.rekor dd { font-size: 22px; }

.ilerleme { height: 10px; border-radius: 99px; background: #f4e4cf; overflow: hidden; }
.ilerleme span { display: block; height: 100%; width: 0; border-radius: inherit; background: var(--vurgu); transition: width .5s var(--yay), background .35s; }

.ipucu { margin: auto 0 0; font-size: 13px; font-weight: 600; line-height: 1.45; color: var(--ikincil); }

.eylemler { order: 10; display: flex; gap: 10px; }

/* Düğmeler */
.dugme {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 48px; padding: 0 20px; border: 0; border-radius: 16px; cursor: pointer;
  font-family: "Fredoka", sans-serif; font-weight: 600; font-size: 17px;
  transition: transform .15s, background .3s, border-color .3s, filter .2s;
}
.dugme svg { width: 20px; height: 20px; }
.dugme.birincil { flex: 1; color: #fff; background: var(--vurgu); border-bottom: 5px solid var(--vurgu-kenar); }
.dugme.ikincil { color: var(--murekkep); background: #fff; border: 2px solid var(--cizgi); border-bottom-width: 5px; }
.dugme.ikon { width: 52px; padding: 0; color: var(--murekkep); background: #fff; border: 2px solid var(--cizgi); border-bottom-width: 5px; }
.dugme:hover { filter: brightness(1.04); transform: translateY(-1px); }
.dugme:active { transform: translateY(2px); filter: brightness(.97); }
.dugme:focus-visible { outline: 3px solid var(--murekkep); outline-offset: 3px; }
.dugme.buyuk { min-height: 56px; padding: 0 44px; font-size: 20px; flex: none; }
.ses-kapali { display: none; }
[aria-pressed="false"] .ses-acik { display: none; }
[aria-pressed="false"] .ses-kapali { display: block; }

/* Masa ve kartlar */
.masa { position: relative; display: grid; place-items: center; min-width: 0; min-height: 0; }
.tahta { display: grid; grid-template-columns: repeat(var(--sut), var(--w)); grid-auto-rows: var(--h); gap: var(--b); }

.kart {
  position: relative; width: var(--w); height: var(--h); padding: 0; border: 0; background: none;
  cursor: pointer; perspective: 900px; border-radius: calc(var(--w) * .16);
  container-type: inline-size;
}
.kart:focus-visible { outline: 3px solid var(--murekkep); outline-offset: 4px; }
.kalk { position: absolute; inset: 0; display: block; border-radius: inherit; transition: transform .25s var(--yay); }
.ic { position: absolute; inset: 0; display: block; border-radius: inherit; transform-style: preserve-3d; transition: transform var(--cevir) var(--yay); }
.kart.acik .ic, .kart.eslesti .ic { transform: rotateY(180deg); }
.yuz {
  position: absolute; inset: 0; display: grid; place-items: center; overflow: hidden;
  border-radius: inherit; border-bottom: 5.5cqw solid; backface-visibility: hidden; -webkit-backface-visibility: hidden;
}
.arka {
  background-color: var(--vurgu); border-color: var(--vurgu-kenar);
  background-image:
    radial-gradient(circle, rgba(255, 255, 255, .2) 0 1.8cqw, transparent 2cqw),
    radial-gradient(circle, rgba(255, 255, 255, .1) 0 1.2cqw, transparent 1.4cqw);
  background-size: 15cqw 15cqw, 15cqw 15cqw;
  background-position: 0 0, 7.5cqw 7.5cqw;
  transition: background-color .35s, border-color .35s;
}
.arka::before { content: ""; position: absolute; inset: 7cqw; border: 1.8cqw solid rgba(255, 255, 255, .38); border-radius: 11cqw; }
.amblem {
  position: relative; display: grid; place-items: center; width: 44cqw; height: 44cqw; border-radius: 50%;
  background: #fff7ec; color: var(--vurgu); border-bottom: 3cqw solid var(--vurgu-acik);
  font-family: "Fredoka", sans-serif; font-weight: 700; font-size: 28cqw; line-height: 1; padding-bottom: 1cqw;
  transition: color .35s, border-color .35s;
}
.on { transform: rotateY(180deg); background: var(--z); border-color: var(--k); }
.on svg { width: 76%; height: auto; margin-top: -16%; }
.on .ad {
  position: absolute; left: 50%; bottom: 7%; transform: translateX(-50%);
  padding: 1.2cqw 6cqw; border-radius: 99px; white-space: nowrap;
  font-family: "Fredoka", sans-serif; font-weight: 600; font-size: 10.5cqw; line-height: 1.2; color: var(--murekkep);
  transition: background .3s, color .3s;
}
.kart.eslesti .on .ad { background: var(--vurgu); color: #fff; }

@media (hover: hover) {
  .kart:not(.acik):not(.eslesti):hover .kalk { transform: translateY(-5px) rotate(-1.5deg); }
}
.kart:not(.eslesti):active .kalk { transform: translateY(2px) scale(.97); }
.kart.eslesti { cursor: default; }

.kart.dagit .kalk { animation: dagit .5s var(--yay) both; animation-delay: calc(var(--i) * 24ms); }
.kart.pop .kalk { animation: pop .6s var(--yay); }
.kart.salla .kalk { animation: salla .45s ease; }

@keyframes dagit { from { opacity: 0; transform: translateY(26px) scale(.6) rotate(-8deg); } }
@keyframes pop { 0% { transform: scale(1); } 35% { transform: scale(1.13) rotate(-3deg); } 70% { transform: scale(.97) rotate(1deg); } 100% { transform: scale(1); } }
@keyframes salla { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-6px) rotate(-2deg); } 40% { transform: translateX(6px) rotate(2deg); } 60% { transform: translateX(-4px); } 80% { transform: translateX(3px); } }
@keyframes yildiz-dus { 0% { transform: scale(1); } 40% { transform: scale(.7) rotate(-20deg); } 100% { transform: scale(1); } }

/* Kıvılcımlar (eşleşme kutlaması) */
.kivilcim {
  position: fixed; z-index: 30; width: 10px; height: 10px; margin: -5px 0 0 -5px; border-radius: 50%;
  pointer-events: none; animation: sic .75s cubic-bezier(.2, .7, .3, 1) forwards;
}
.kivilcim.kare { border-radius: 3px; }
@keyframes sic { 0% { transform: translate(0, 0) scale(.4); opacity: 1; } 70% { opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) scale(1) rotate(var(--r)); opacity: 0; } }

/* Balon mesaj */
.balon {
  position: absolute; z-index: 5; top: 2px; left: 50%; transform: translate(-50%, -8px) scale(.7);
  padding: 9px 20px; border-radius: 99px; background: #fff; border: 2px solid var(--cizgi); border-bottom-width: 5px;
  font-family: "Fredoka", sans-serif; font-weight: 600; font-size: 19px; color: var(--vurgu); white-space: nowrap;
  opacity: 0; pointer-events: none; transition: opacity .2s, transform .35s var(--yay);
}
.balon.gorunur { opacity: 1; transform: translate(-50%, 0) scale(1); }

/* Giriş kartı */
.giris {
  position: absolute; inset: 0; z-index: 10; display: grid; place-items: center; padding: 16px;
  background: rgba(255, 244, 230, .55); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
  border-radius: 30px; opacity: 0; visibility: hidden; transition: opacity .3s, visibility .3s;
}
.giris.gorunur { opacity: 1; visibility: visible; }
.giris-kart {
  width: min(400px, 100%); padding: 30px 30px 24px; text-align: center;
  background: var(--kagit); border: 2px solid var(--cizgi); border-bottom-width: 7px; border-radius: 30px;
  transform: translateY(10px) scale(.96); transition: transform .45s var(--yay);
}
.giris.gorunur .giris-kart { transform: none; }
.yelpaze { position: relative; height: 112px; margin-bottom: 18px; }
.yelpaze .kart { position: absolute; left: 50%; top: 0; --w: 78px; --h: 96px; margin-left: -39px; cursor: default; pointer-events: none; }
.yelpaze .kart:nth-child(1) { transform: translate(-58px, 12px) rotate(-14deg); }
.yelpaze .kart:nth-child(2) { transform: translateY(-2px); z-index: 1; }
.yelpaze .kart:nth-child(3) { transform: translate(58px, 12px) rotate(14deg); }
.yelpaze .kart:nth-child(2) .ic { animation: yelpaze-cevir 3.6s var(--yay) infinite; }
@keyframes yelpaze-cevir { 0%, 40% { transform: rotateY(0); } 50%, 90% { transform: rotateY(180deg); } 100% { transform: rotateY(360deg); } }
.giris-kart h2 { font-size: 30px; font-weight: 600; }
.giris-kart p { margin: 8px 0 22px; font-size: 15.5px; font-weight: 600; line-height: 1.5; color: var(--ikincil); }
.kisayol { display: block; margin-top: 12px; font-size: 13px; font-weight: 700; color: var(--ikincil); opacity: .8; }

/* Sonuç */
.sonuc {
  position: fixed; inset: 0; z-index: 40; display: grid; place-items: center; padding: 18px;
  background: rgba(255, 240, 222, .7); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  opacity: 0; visibility: hidden; transition: opacity .35s, visibility .35s;
}
.sonuc.gorunur { opacity: 1; visibility: visible; }
.sonuc-kart {
  position: relative; width: min(420px, 100%); padding: 26px 28px 26px; text-align: center;
  background: var(--kagit); border: 2px solid var(--cizgi); border-bottom-width: 8px; border-radius: 32px;
  transform: translateY(24px) scale(.92); transition: transform .5s var(--yay);
}
.sonuc.gorunur .sonuc-kart { transform: none; }
.sonuc-yildiz { display: flex; justify-content: center; align-items: flex-end; gap: 6px; height: 84px; margin-top: -4px; }
.sonuc-yildiz svg { width: 62px; height: 62px; opacity: 0; transform: scale(.3) rotate(-30deg); }
.sonuc-yildiz svg:nth-child(2) { width: 80px; height: 80px; }
.sonuc-yildiz svg path { fill: #f2e2cb; stroke: #f2e2cb; }
.sonuc-yildiz svg.dolu path { fill: var(--altin); stroke: var(--altin); }
.sonuc.gorunur .sonuc-yildiz svg { animation: yildiz-gel .55s var(--yay) forwards; }
.sonuc.gorunur .sonuc-yildiz svg:nth-child(2) { animation-delay: .18s; }
.sonuc.gorunur .sonuc-yildiz svg:nth-child(3) { animation-delay: .36s; }
@keyframes yildiz-gel { to { opacity: 1; transform: none; } }
.rozet {
  display: none; margin: 12px auto 0; width: fit-content; padding: 5px 14px; border-radius: 99px;
  background: var(--altin); color: var(--murekkep); font-family: "Fredoka", sans-serif; font-weight: 600; font-size: 14px;
}
.rozet.gorunur { display: block; animation: pop .6s var(--yay) .6s both; }
.sonuc-kart h2 { margin-top: 10px; font-size: 32px; font-weight: 600; }
.sonuc-kart > p { margin: 6px 0 18px; font-size: 15.5px; font-weight: 600; line-height: 1.5; color: var(--ikincil); }
.sonuc-olcu { display: grid; grid-template-columns: repeat(3, 1fr); margin: 0 0 22px; padding: 14px 0; border-top: 2px dashed var(--cizgi); border-bottom: 2px dashed var(--cizgi); }
.sonuc-olcu div + div { border-left: 2px dashed var(--cizgi); }
.sonuc-olcu dt { font-size: 13px; font-weight: 700; color: var(--ikincil); }
.sonuc-olcu dd { margin: 3px 0 0; font-family: "Fredoka", sans-serif; font-weight: 600; font-size: 24px; font-variant-numeric: tabular-nums; }
.sonuc-eylem { display: flex; flex-direction: column; gap: 10px; }
.sonuc-eylem .dugme { width: 100%; }

.konfeti { position: fixed; inset: 0; z-index: 50; width: 100%; height: 100%; pointer-events: none; }

/* Telefon ve dar ekran */
@media (max-width: 860px) {
  .uygulama {
    grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); gap: 10px;
    padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
  }
  .panel { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px 10px; padding: 14px; border-radius: 24px; border-bottom-width: 6px; overflow: visible; }
  .marka { gap: 10px; }
  .logo { width: 40px; height: 40px; }
  .marka h1 { font-size: 20px; }
  .marka p { display: none; }
  .eylemler { order: 0; gap: 8px; }
  .eylemler .dugme { min-height: 44px; }
  .eylemler .dugme.birincil { padding: 0 14px; font-size: 15px; }
  .eylemler .dugme.ikon { width: 46px; }
  .zorluk { grid-column: 1 / -1; }
  .zorluk .baslik-kucuk { display: none; }
  .secici button { flex-direction: row; justify-content: center; gap: 6px; padding: 9px 4px 8px; }
  .ozet { grid-column: 1 / -1; grid-template-columns: 1.15fr .8fr 1.1fr 1fr; align-items: start; }
  .olcu { padding: 0 0 0 10px; border-top: 0; border-left: 2px dashed var(--cizgi); }
  .olcu.sure { grid-column: auto; border-left: 0; padding-left: 0; }
  .olcu.hamle { border-right: 0; }
  .olcu.eslesen { display: none; }
  .olcu.yildiz, .olcu.rekor { grid-column: auto; }
  .olcu dt { font-size: 12px; }
  .olcu dt svg { display: none; }
  .olcu dd, .olcu.rekor dd { font-size: 21px; }
  .olcu.sure dd { font-size: 21px; }
  .yildizlar { gap: 1px; margin-top: 1px; }
  .yildizlar svg { width: 22px; height: 22px; }
  .yildiz-not { display: none; }
  .ilerleme { grid-column: 1 / -1; height: 8px; }
  .ipucu { display: none; }
  .giris { border-radius: 24px; }
  .giris-kart { padding: 24px 22px 20px; }
  .giris-kart h2 { font-size: 26px; }
  .balon { font-size: 17px; }
}
@media (max-width: 560px) {
  .eylemler .dugme.birincil span { display: none; }
  .eylemler .dugme.birincil { width: 46px; flex: none; padding: 0; }
  .genis-metin { display: none; }
  .olcu.rekor dd.bos { font-size: 15px; padding-top: 4px; color: var(--ikincil); white-space: nowrap; }
}
@media (max-height: 620px) and (min-width: 861px) {
  .olcu.sure dd { font-size: 44px; }
  .ipucu { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
`,
    "cizimler.js": `// Kart yüzü çizimleri: 100x100 SVG, düz renkli oyuncak dili. Her çizimin kendi pastel zemini ve kenar rengi var.
// Yeni bir kart eklemek için listeye { ad, zemin, kenar, svg } ekle.
(function () {
  var K = "#3b2340";

  function yuz(x, y, o) {
    o = o || 1;
    var g = 6.5 * o, r = 2.6 * o;
    return '<g>' +
      '<ellipse cx="' + (x - g - 3.6 * o) + '" cy="' + (y + 5 * o) + '" rx="' + 3.4 * o + '" ry="' + 2.1 * o + '" fill="#ff6f86" opacity=".45"/>' +
      '<ellipse cx="' + (x + g + 3.6 * o) + '" cy="' + (y + 5 * o) + '" rx="' + 3.4 * o + '" ry="' + 2.1 * o + '" fill="#ff6f86" opacity=".45"/>' +
      '<circle cx="' + (x - g) + '" cy="' + y + '" r="' + r + '" fill="' + K + '"/>' +
      '<circle cx="' + (x + g) + '" cy="' + y + '" r="' + r + '" fill="' + K + '"/>' +
      '<circle cx="' + (x - g - 0.8 * o) + '" cy="' + (y - 0.9 * o) + '" r="' + 0.9 * o + '" fill="#fff"/>' +
      '<circle cx="' + (x + g - 0.8 * o) + '" cy="' + (y - 0.9 * o) + '" r="' + 0.9 * o + '" fill="#fff"/>' +
      '<path d="M' + (x - 3.2 * o) + ' ' + (y + 3.6 * o) + ' q' + 3.2 * o + ' ' + 3.4 * o + ' ' + 6.4 * o + ' 0" stroke="' + K + '" stroke-width="' + 2 * o + '" fill="none" stroke-linecap="round"/>' +
      '</g>';
  }
  function uykulu(x, y, o) {
    o = o || 1;
    var g = 6.5 * o;
    return '<g fill="none" stroke="' + K + '" stroke-width="' + 2 * o + '" stroke-linecap="round">' +
      '<path d="M' + (x - g - 3 * o) + ' ' + y + ' q' + 3 * o + ' ' + 3 * o + ' ' + 6 * o + ' 0"/>' +
      '<path d="M' + (x + g - 3 * o) + ' ' + y + ' q' + 3 * o + ' ' + 3 * o + ' ' + 6 * o + ' 0"/>' +
      '<path d="M' + (x - 2.6 * o) + ' ' + (y + 6 * o) + ' q' + 2.6 * o + ' ' + 2.6 * o + ' ' + 5.2 * o + ' 0"/></g>' +
      '<ellipse cx="' + (x - g - 2 * o) + '" cy="' + (y + 6 * o) + '" rx="' + 3.2 * o + '" ry="' + 2 * o + '" fill="#ff6f86" opacity=".45"/>' +
      '<ellipse cx="' + (x + g + 2 * o) + '" cy="' + (y + 6 * o) + '" rx="' + 3.2 * o + '" ry="' + 2 * o + '" fill="#ff6f86" opacity=".45"/>';
  }
  function parilti(x, y, r, renk) {
    var a = r * 0.28;
    return '<path d="M' + x + ' ' + (y - r) + ' Q' + (x + a) + ' ' + (y - a) + ' ' + (x + r) + ' ' + y + ' Q' + (x + a) + ' ' + (y + a) + ' ' + x + ' ' + (y + r) + ' Q' + (x - a) + ' ' + (y + a) + ' ' + (x - r) + ' ' + y + ' Q' + (x - a) + ' ' + (y - a) + ' ' + x + ' ' + (y - r) + 'Z" fill="' + renk + '"/>';
  }
  function damla(x, y, renk) {
    return '<path d="M' + x + ' ' + (y - 7) + ' C' + (x + 4.5) + ' ' + (y - 1) + ' ' + (x + 5) + ' ' + (y + 2) + ' ' + (x + 5) + ' ' + (y + 3.5) + ' A5 5 0 0 1 ' + (x - 5) + ' ' + (y + 3.5) + ' C' + (x - 5) + ' ' + (y + 2) + ' ' + (x - 4.5) + ' ' + (y - 1) + ' ' + x + ' ' + (y - 7) + 'Z" fill="' + renk + '"/>';
  }
  function parlak(x, y, rx, ry, aci, op) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" transform="rotate(' + aci + ' ' + x + ' ' + y + ')" fill="#fff" opacity="' + (op || 0.4) + '"/>';
  }
  function svg(ic) {
    return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + ic + '</svg>';
  }

  var gunesIsin = "";
  for (var i = 0; i < 8; i++) gunesIsin += '<rect x="45.5" y="5" width="9" height="17" rx="4.5" fill="#ffa21f" transform="rotate(' + i * 45 + ' 50 50)"/>';

  var yaprak = "";
  for (var j = 0; j < 6; j++) yaprak += '<ellipse cx="50" cy="22" rx="10.5" ry="14" fill="' + (j % 2 ? "#ff8fc4" : "#ff6fb0") + '" transform="rotate(' + j * 60 + ' 50 38)"/>';

  window.CIZIMLER = [
    {
      ad: "Çilek", zemin: "#ffe4e2", kenar: "#f3b8b6",
      svg: svg(
        '<path d="M50 30C31 28 18 39 20 54c2 16 18 30 30 34 12-4 28-18 30-34 2-15-11-26-30-24z" fill="#ff4d63"/>' +
        parlak(32, 50, 4.5, 9, 22, 0.35) +
        '<g fill="#ffe08a"><ellipse cx="27" cy="54" rx="1.6" ry="2.5"/><ellipse cx="33" cy="67" rx="1.6" ry="2.5"/><ellipse cx="44" cy="77" rx="1.6" ry="2.5"/><ellipse cx="56" cy="77" rx="1.6" ry="2.5"/><ellipse cx="67" cy="67" rx="1.6" ry="2.5"/><ellipse cx="73" cy="54" rx="1.6" ry="2.5"/></g>' +
        '<path d="M50 34c-6-8-16-10-22-6 6 2 10 6 12 9-6 1-10 5-10 9 8-4 14-6 20-6s12 2 20 6c0-4-4-8-10-9 2-3 6-7 12-9-6-4-16-2-22 6z" fill="#3fbf6b"/>' +
        '<path d="M50 34c0-8 2-14 6-18" stroke="#2c9a55" stroke-width="4" stroke-linecap="round" fill="none"/>' +
        yuz(50, 57, 1)
      )
    },
    {
      ad: "Karpuz", zemin: "#e2f4d6", kenar: "#b9dca3",
      svg: svg(
        '<g transform="rotate(-10 50 50)">' +
        '<path d="M11 36a39 39 0 0 0 78 0z" fill="#2fa451"/>' +
        '<path d="M16 36a34 34 0 0 0 68 0z" fill="#ecf9dc"/>' +
        '<path d="M20.5 36a29.5 29.5 0 0 0 59 0z" fill="#ff5a6f"/>' +
        '<g fill="' + K + '"><ellipse cx="28" cy="44" rx="1.8" ry="2.8" transform="rotate(-25 28 44)"/><ellipse cx="72" cy="44" rx="1.8" ry="2.8" transform="rotate(25 72 44)"/><ellipse cx="37" cy="57" rx="1.8" ry="2.8" transform="rotate(-15 37 57)"/><ellipse cx="63" cy="57" rx="1.8" ry="2.8" transform="rotate(15 63 57)"/><ellipse cx="50" cy="61" rx="1.8" ry="2.8"/></g>' +
        yuz(50, 44, 0.95) +
        '</g>'
      )
    },
    {
      ad: "Limon", zemin: "#fff3c2", kenar: "#efd779",
      svg: svg(
        '<path d="M56 30c2-10 12-16 24-14-4 10-14 16-24 14z" fill="#3fbf6b"/>' +
        '<path d="M58 29c6-5 12-9 19-11" stroke="#2c9a55" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M10 54c0-4 4-8 8-10 8-12 20-16 32-16s24 4 32 16c4 2 8 6 8 10s-4 8-8 10c-8 12-20 16-32 16s-24-4-32-16c-4-2-8-6-8-10z" fill="#ffd23f"/>' +
        '<path d="M18 64c8 12 20 16 32 16s24-4 32-16c-10 6-20 8-32 8s-22-2-32-8z" fill="#f6bb1e"/>' +
        parlak(33, 41, 9, 3.6, -18, 0.5) +
        yuz(50, 54, 1)
      )
    },
    {
      ad: "Kiraz", zemin: "#ffe1ea", kenar: "#f2b3c5",
      svg: svg(
        '<path d="M33 54C35 40 44 28 56 19M67 52C65 38 61 28 56 19" stroke="#5c8f37" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
        '<path d="M56 19c6-10 20-12 28-6-6 8-18 10-28 6z" fill="#3fbf6b"/>' +
        '<circle cx="33" cy="66" r="17" fill="#e8344e"/>' +
        '<circle cx="67" cy="64" r="17" fill="#ff4d63"/>' +
        parlak(26, 59, 3.4, 5.4, 25, 0.45) + parlak(60, 57, 3.4, 5.4, 25, 0.45) +
        yuz(33, 68, 0.72) + yuz(67, 66, 0.72)
      )
    },
    {
      ad: "Avokado", zemin: "#ebf4d4", kenar: "#c9dc98",
      svg: svg(
        '<path d="M50 11c-12 0-18 12-20 24-2 10-12 16-12 31 0 15 14 24 32 24s32-9 32-24c0-15-10-21-12-31-2-12-8-24-20-24z" fill="#3d7a33"/>' +
        '<path d="M50 16.5c-9.5 0-14.5 10-16.2 20.5-1.6 9.4-11 15-11 29 0 12.6 12 19.5 27.2 19.5s27.2-6.9 27.2-19.5c0-14-9.4-19.6-11-29C64.5 26.5 59.5 16.5 50 16.5z" fill="#cfe97a"/>' +
        '<circle cx="50" cy="65" r="14" fill="#a5612e"/>' +
        '<circle cx="45" cy="60" r="4" fill="#fff" opacity=".3"/>' +
        yuz(50, 40, 0.8)
      )
    },
    {
      ad: "Mantar", zemin: "#ffe8d8", kenar: "#f3c09f",
      svg: svg(
        '<path d="M38 58h24c2 10 3 20 0 27-4 5-20 5-24 0-3-7-2-17 0-27z" fill="#fff4e2"/>' +
        '<path d="M38 58h24c.6 3 1 5.5 1.3 8-8 2-18 2-26.6 0 .3-2.5.7-5 1.3-8z" fill="#f1dcc0"/>' +
        '<path d="M12 57c0-23 17-41 38-41s38 18 38 41c0 4-3 7-7 7H19c-4 0-7-3-7-7z" fill="#ff5a4a"/>' +
        '<g fill="#fff"><circle cx="31" cy="39" r="6"/><circle cx="52" cy="27" r="4.5"/><circle cx="69" cy="43" r="7"/><circle cx="47" cy="50" r="3.6"/><circle cx="80" cy="57" r="3"/><circle cx="21" cy="55" r="2.8"/></g>' +
        yuz(50, 74, 0.72)
      )
    },
    {
      ad: "Kaktüs", zemin: "#dcf2e5", kenar: "#a9dcbf",
      svg: svg(
        '<path d="M36 47h-6c-4 0-6-2-6-6v-8M64 41h6c4 0 6-2 6-6v-8" stroke="#3fbf6b" stroke-width="9" stroke-linecap="round" fill="none"/>' +
        '<rect x="35" y="20" width="30" height="50" rx="15" fill="#3fbf6b"/>' +
        '<path d="M42 28v4M58 28v4M40 58v4M60 58v4M50 24v3" stroke="#2c9a55" stroke-width="1.8" stroke-linecap="round"/>' +
        '<g fill="#ff6fb0"><circle cx="50" cy="15.5" r="3.6"/><circle cx="45.5" cy="18.8" r="3.6"/><circle cx="54.5" cy="18.8" r="3.6"/></g><circle cx="50" cy="18.5" r="2.4" fill="#ffd23f"/>' +
        '<path d="M29 70h42l-6 22H35z" fill="#e9814f"/>' +
        '<rect x="25" y="64" width="50" height="10" rx="4" fill="#d6683a"/>' +
        yuz(50, 45, 0.85)
      )
    },
    {
      ad: "Güneş", zemin: "#fff0c9", kenar: "#f4cd76",
      svg: svg(
        gunesIsin +
        '<circle cx="50" cy="50" r="25" fill="#ffc83a"/>' +
        parlak(40, 40, 7, 4, -35, 0.4) +
        yuz(50, 52, 1.1)
      )
    },
    {
      ad: "Ay", zemin: "#e7e3ff", kenar: "#c3bbf4",
      svg: svg(
        parilti(77, 22, 7, "#8b7cf6") + parilti(84, 52, 4.5, "#a99cff") + parilti(66, 80, 5.5, "#8b7cf6") +
        '<path d="M60 12A39 39 0 1 0 86 74 31 31 0 0 1 60 12z" fill="#ffd45c"/>' +
        parlak(30, 32, 8, 3.5, -50, 0.45) +
        uykulu(36, 52, 0.95)
      )
    },
    {
      ad: "Bulut", zemin: "#d8ecff", kenar: "#a4cbf2",
      svg: svg(
        damla(34, 82, "#4d9cf5") + damla(50, 88, "#4d9cf5") + damla(66, 82, "#4d9cf5") +
        '<g fill="#ffffff"><circle cx="33" cy="52" r="15"/><circle cx="52" cy="42" r="20"/><circle cx="69" cy="53" r="14"/><rect x="18" y="50" width="65" height="20" rx="10"/></g>' +
        '<path d="M20 64c4 4 8 6 13 6h36c5 0 10-2 13-6z" fill="#e3effb"/>' +
        yuz(50, 55, 1)
      )
    },
    {
      ad: "Roket", zemin: "#e2eaff", kenar: "#b3c3f1",
      svg: svg(
        '<g transform="rotate(32 50 52)">' +
        '<path d="M41 74c0 10 4 18 9 24 5-6 9-14 9-24z" fill="#ff9f1f"/>' +
        '<path d="M45.5 74c0 6 2 11 4.5 15 2.5-4 4.5-9 4.5-15z" fill="#ffe08a"/>' +
        '<path d="M38 55L25 71v8l15-6zM62 55l13 16v8l-15-6z" fill="#ff5a4a"/>' +
        '<path d="M50 6c12 10 16 28 14 48l-2 22H38l-2-22C34 34 38 16 50 6z" fill="#fbf7f0"/>' +
        '<path d="M50 6c6 5 10 12 12 20H38c2-8 6-15 12-20z" fill="#ff5a4a"/>' +
        '<circle cx="50" cy="44" r="11" fill="#d9deea"/><circle cx="50" cy="44" r="8" fill="#4d9cf5"/>' +
        parlak(47, 41, 2.6, 2, 0, 0.8) +
        '<rect x="48" y="62" width="4" height="15" rx="2" fill="#ff5a4a"/>' +
        '</g>'
      )
    },
    {
      ad: "Dondurma", zemin: "#ffe5f0", kenar: "#f3b5cf",
      svg: svg(
        '<path d="M30 52h40L52.5 92.5c-1 2-4 2-5 0z" fill="#eaa65b"/>' +
        '<path d="M37 52l20 27M50 52l13.6 13.8M63 52l-20 27M50 52l-13.6 13.8" stroke="#c98940" stroke-width="1.8" stroke-linecap="round"/>' +
        '<circle cx="50" cy="21" r="12" fill="#8fe3c4"/>' +
        '<path d="M50 9c0-3 1-5 3-6" stroke="#5c8f37" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="51" cy="10" r="4.5" fill="#e8344e"/>' +
        '<circle cx="50" cy="40" r="18" fill="#ff8fb1"/>' +
        '<path d="M31 44c0 9 6 9 8 6 2 7 8 7 10 2 2 6 9 6 11 0 2 5 9 4 9-8z" fill="#ff8fb1"/>' +
        '<g stroke-linecap="round" stroke-width="2.2"><path d="M38 31l3-2" stroke="#ffd23f"/><path d="M60 30l2 3" stroke="#4d9cf5"/><path d="M64 44l3-1" stroke="#ffd23f"/><path d="M36 46l2 2" stroke="#4d9cf5"/></g>' +
        yuz(50, 40, 0.88)
      )
    },
    {
      ad: "Balon", zemin: "#efe4ff", kenar: "#cfb5f4",
      svg: svg(
        '<path d="M50 74c-5 8 6 12 0 22" stroke="#8a6f9a" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path d="M45.5 75h9L50 68z" fill="#6c45dc"/>' +
        '<ellipse cx="50" cy="40" rx="26" ry="30" fill="#8455f2"/>' +
        parlak(38, 28, 5.5, 10, 25, 0.35) +
        yuz(50, 43, 1)
      )
    },
    {
      ad: "Balık", zemin: "#ffecd9", kenar: "#f4c697",
      svg: svg(
        '<g fill="none" stroke="#4d9cf5" stroke-width="2"><circle cx="80" cy="25" r="4"/><circle cx="88" cy="14" r="2.6"/><circle cx="72" cy="13" r="2"/></g>' +
        '<path d="M27 52L8 35c4 10 4 24 0 34z" fill="#ff7a2e"/>' +
        '<path d="M38 35c6-12 20-12 26 0z" fill="#ff7a2e"/>' +
        '<ellipse cx="50" cy="53" rx="29" ry="21" fill="#ff9a3d"/>' +
        '<path d="M45 34c-4 10-4 28 0 38M57 33c-4 10-4 30 0 40" stroke="#fff" stroke-width="4" fill="none" opacity=".75"/>' +
        '<path d="M46 60c4 4 10 4 12 0" fill="#ff7a2e"/>' +
        '<circle cx="67" cy="48" r="6.5" fill="#fff"/><circle cx="68.5" cy="48.5" r="3.4" fill="' + K + '"/><circle cx="67.4" cy="47.2" r="1.1" fill="#fff"/>' +
        '<path d="M71 60q3.5 2.6 7-.6" stroke="' + K + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="62" cy="58" rx="3.4" ry="2.1" fill="#ff6f86" opacity=".5"/>'
      )
    },
    {
      ad: "Çiçek", zemin: "#ffe3f1", kenar: "#f2b0d1",
      svg: svg(
        '<path d="M50 58c0 12-2 22 0 36" stroke="#2fa451" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<path d="M50 81c-10-10-22-9-26-3 8 6 20 7 26 3zM50 73c8-10 20-10 26-4-8 8-18 8-26 4z" fill="#3fbf6b"/>' +
        yaprak +
        '<circle cx="50" cy="38" r="13" fill="#ffd23f"/>' +
        yuz(50, 38, 0.72)
      )
    }
  ];

  // Kart arkası ve logo için küçük işaret
  window.CIZIM_LOGO = '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">' +
    '<rect x="6" y="8" width="22" height="30" rx="6" transform="rotate(-14 17 23)" fill="#ff6b4a"/>' +
    '<rect x="8.5" y="11" width="17" height="24" rx="4" transform="rotate(-14 17 23)" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.6"/>' +
    '<g transform="rotate(10 31 25)"><rect x="20" y="10" width="22" height="30" rx="6" fill="#ffe4e2" stroke="#3b2340" stroke-opacity=".08"/>' +
    '<g transform="translate(19 13) scale(.24)"><path d="M50 30C31 28 18 39 20 54c2 16 18 30 30 34 12-4 28-18 30-34 2-15-11-26-30-24z" fill="#ff4d63"/><path d="M50 34c-6-8-16-10-22-6 6 2 10 6 12 9-6 1-10 5-10 9 8-4 14-6 20-6s12 2 20 6c0-4-4-8-10-9 2-3 6-7 12-9-6-4-16-2-22 6z" fill="#3fbf6b"/></g></g>' +
    '</svg>';
})();
`,
    "oyun.js": `// Hafıza Kartları — oyun mantığı. Oynanış sayıları ayarlar.json'dan okunur (Vayra Build ayar paneli bu dosyayı düzenler).
(function () {
  "use strict";

  var A = { cevirmeGecikmesi: 850, onizlemeSuresi: 2, ucYildiz: 1.6, ikiYildiz: 2.4, cevirmeHizi: 480 };
  var ZORLUK = {
    kolay: { ad: "Kolay", sut: 4, sat: 3 },
    orta: { ad: "Orta", sut: 4, sat: 4 },
    zor: { ad: "Zor", sut: 6, sat: 5 }
  };
  var SIRA = ["kolay", "orta", "zor"];
  var ANAHTAR = "hafiza-kartlari";
  var OVGU = ["Harika!", "Süper!", "Tam isabet!", "Bravo!", "Çok iyi!", "İşte bu!"];
  var KONFETI_RENK = ["#ff6b4a", "#ffbe2e", "#12a58b", "#7452ee", "#4d9cf5", "#ff6fb0", "#3fbf6b"];
  var YILDIZ = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.5l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" stroke-width="2.6" stroke-linejoin="round"/></svg>';

  function $(s) { return document.querySelector(s); }
  var masa = $("#masa"), tahta = $("#tahta"), giris = $("#giris"), sonuc = $("#sonuc"), balon = $("#balon");
  var cizimler = window.CIZIMLER || [];

  var kayit = (function () {
    try { return JSON.parse(localStorage.getItem(ANAHTAR) || "{}") || {}; } catch (e) { return {}; }
  })();
  if (!kayit.enIyi || typeof kayit.enIyi !== "object") kayit.enIyi = {};
  function kaydet() { try { localStorage.setItem(ANAHTAR, JSON.stringify(kayit)); } catch (e) { /* depolama kapalı */ } }

  var zorluk = ZORLUK[kayit.zorluk] ? kayit.zorluk : "orta";
  var deste = [], acik = [], eslesen = 0, hamle = 0, seri = 0, durum = "bekliyor";
  var sayacBas = 0, gecen = 0, sayacAcik = false, sonSaniye = -1, aktifSut = 4, oncekiYildiz = 3;
  var zamanlayicilar = [], kapatZ = null, balonZ = null;

  function sonra(fn, ms) { var id = setTimeout(fn, ms); zamanlayicilar.push(id); return id; }
  function temizle() { zamanlayicilar.forEach(clearTimeout); zamanlayicilar = []; kapatZ = null; }
  function karistir(d) {
    for (var i = d.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = d[i]; d[i] = d[j]; d[j] = t; }
    return d;
  }
  function iki(n) { return n < 10 ? "0" + n : String(n); }
  function sureYaz(sn) { sn = Math.max(0, Math.floor(sn)); return Math.floor(sn / 60) + ":" + iki(sn % 60); }
  function sureDetay(sn) {
    var t = Math.floor(sn), d = Math.floor((sn - t) * 10);
    return Math.floor(t / 60) + ":" + iki(t % 60) + "," + d;
  }
  function sureUzun(sn) {
    if (sn < 60) return (Math.floor(sn * 10) / 10).toLocaleString("tr-TR") + " saniyede";
    var t = Math.round(sn);
    return Math.floor(t / 60) + " dakika " + (t % 60 ? (t % 60) + " saniyede" : "içinde");
  }
  function ciftSayisi() { var z = ZORLUK[zorluk]; return z.sut * z.sat / 2; }
  function esik(oran) { return Math.max(1, Math.floor(ciftSayisi() * oran)); }
  function yildizSay(h) {
    if (h <= esik(A.ucYildiz)) return 3;
    if (h <= esik(Math.max(A.ikiYildiz, A.ucYildiz))) return 2;
    return 1;
  }

  /* ── Ses (Web Audio, dosyasız) ── */
  var sesAcik = kayit.ses !== false, ctx = null;
  function ton(f1, f2, sure, tip, gecikme, guc) {
    var t = ctx.currentTime + (gecikme || 0);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tip; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + sure);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(guc || 0.08, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + sure + 0.03);
  }
  function ses(tur) {
    if (!sesAcik) return;
    try {
      if (!ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ctx = new AC(); }
      if (ctx.state === "suspended") ctx.resume();
      if (tur === "cevir") ton(540, 760, 0.07, "triangle", 0, 0.06);
      else if (tur === "eslesme") { ton(784, 784, 0.16, "sine", 0, 0.09); ton(1046, 1046, 0.22, "sine", 0.09, 0.09); }
      else if (tur === "yanlis") ton(260, 170, 0.18, "triangle", 0, 0.07);
      else if (tur === "kazandi") [523, 659, 784, 1046, 1318].forEach(function (f, i) { ton(f, f, 0.26, "sine", i * 0.1, 0.09); });
      else if (tur === "dagit") ton(330, 520, 0.12, "sine", 0, 0.04);
    } catch (e) { /* ses desteklenmiyor */ }
  }
  function sesDugmesi() {
    var b = $("#sesDugme");
    b.setAttribute("aria-pressed", sesAcik ? "true" : "false");
    b.setAttribute("aria-label", sesAcik ? "Sesi kapat" : "Sesi aç");
  }

  /* ── Kartlar ── */
  function kartHtml(c, arkaYaz) {
    return '<span class="kalk"><span class="ic">' +
      '<span class="yuz arka"><span class="amblem">' + (arkaYaz || "?") + '</span></span>' +
      '<span class="yuz on" style="--z:' + c.zemin + ';--k:' + c.kenar + '">' + c.svg + '<span class="ad">' + c.ad + '</span></span>' +
      '</span></span>';
  }
  function kartYap(k) {
    var c = cizimler[k.motif];
    var b = document.createElement("button");
    b.type = "button";
    b.className = "kart dagit";
    b.style.setProperty("--i", k.i);
    b.innerHTML = kartHtml(c);
    b.addEventListener("click", function () { cevir(k); });
    k.el = b;
    etiketle(k);
    return b;
  }
  function etiketle(k) {
    var ad = cizimler[k.motif].ad;
    k.el.setAttribute("aria-label", "Kart " + (k.i + 1) + ", " + (k.eslesti ? ad + ", eşleşti" : k.acik ? ad : "kapalı"));
  }
  function ac(k) { k.acik = true; k.el.classList.add("acik"); etiketle(k); }
  function kapat(k) { k.acik = false; k.el.classList.remove("acik"); etiketle(k); }

  function hazirla() {
    temizle();
    parcalar = [];
    var cift = ciftSayisi();
    var havuz = karistir(cizimler.map(function (c, i) { return i; })).slice(0, cift);
    deste = karistir(havuz.concat(havuz)).map(function (m, i) { return { i: i, motif: m, acik: false, eslesti: false, el: null }; });
    acik = []; eslesen = 0; hamle = 0; seri = 0; gecen = 0; sayacAcik = false; sonSaniye = -1; oncekiYildiz = 3;
    durum = "bekliyor";
    document.body.setAttribute("data-zorluk", zorluk);
    tahta.innerHTML = "";
    var parca = document.createDocumentFragment();
    deste.forEach(function (k) { parca.appendChild(kartYap(k)); });
    tahta.appendChild(parca);
    sonra(function () { deste.forEach(function (k) { k.el.classList.remove("dagit"); }); }, deste.length * 24 + 560);
    yerlestir();
    seciciGuncelle();
    paneliGuncelle();
    $("#sure").textContent = "0:00";
    girisMetni();
  }

  function basla() {
    if (durum === "onizleme" || durum === "oynuyor") return;
    if (durum === "bitti") hazirla();
    giris.classList.remove("gorunur");
    sonuc.classList.remove("gorunur");
    sonuc.setAttribute("aria-hidden", "true");
    durum = "onizleme";
    ses("dagit");
    var sure = Math.max(0, A.onizlemeSuresi) * 1000;
    if (sure <= 0) { durum = "oynuyor"; odakla(0); return; }
    var acilis = 380;
    deste.forEach(function (k, i) { sonra(function () { ac(k); }, acilis + i * 26); });
    var toplam = acilis + deste.length * 26 + A.cevirmeHizi * 0.6;
    var kalan = Math.ceil(sure / 1000);
    sonra(function () { geriSay(kalan); }, toplam);
    sonra(function () {
      balonGizle();
      deste.forEach(function (k, i) { sonra(function () { kapat(k); }, i * 18); });
      sonra(function () { durum = "oynuyor"; odakla(0); }, deste.length * 18 + A.cevirmeHizi * 0.5);
    }, toplam + sure);
  }
  function geriSay(n) {
    if (durum !== "onizleme") return;
    balonGoster("Ezberle, " + n, 0);
    if (n > 1) sonra(function () { geriSay(n - 1); }, 1000);
  }
  function odakla(i) {
    var k = deste[i], o = document.activeElement;
    if (!k || !k.el) return;
    if (!o || o === document.body || giris.contains(o) || sonuc.contains(o)) k.el.focus({ preventScroll: true });
  }

  function cevir(k) {
    if (durum !== "oynuyor" || k.eslesti || k.acik) return;
    if (acik.length === 2) {
      clearTimeout(kapatZ);
      kapat(acik[0]); kapat(acik[1]);
      acik = [];
    }
    if (!sayacAcik) { sayacAcik = true; sayacBas = performance.now(); }
    ac(k);
    acik.push(k);
    ses("cevir");
    if (acik.length < 2) return;

    hamle++;
    var a = acik[0], b = acik[1];
    if (a.motif === b.motif) {
      acik = [];
      a.eslesti = b.eslesti = true;
      sonra(function () { eslesti(a, b); }, A.cevirmeHizi * 0.55);
    } else {
      seri = 0;
      sonra(function () {
        if (!a.acik || !b.acik) return;
        [a, b].forEach(function (x) { x.el.classList.remove("salla"); void x.el.offsetWidth; x.el.classList.add("salla"); });
        ses("yanlis");
      }, A.cevirmeHizi * 0.75);
      kapatZ = sonra(function () {
        if (acik[0] === a && acik[1] === b) { kapat(a); kapat(b); acik = []; }
      }, A.cevirmeGecikmesi + A.cevirmeHizi * 0.5);
    }
    paneliGuncelle();
  }

  function eslesti(a, b) {
    eslesen++; seri++;
    [a, b].forEach(function (x) {
      x.el.classList.add("eslesti");
      x.el.classList.remove("pop"); void x.el.offsetWidth; x.el.classList.add("pop");
      etiketle(x);
      kivilcim(x.el);
    });
    ses("eslesme");
    var cift = ciftSayisi();
    if (eslesen < cift) balonGoster(seri >= 2 ? seri + " eşleşme üst üste!" : OVGU[Math.floor(Math.random() * OVGU.length)], 1100);
    paneliGuncelle();
    if (eslesen === cift) sonra(bitir, 520);
  }

  function bitir() {
    durum = "bitti";
    sayacAcik = false;
    gecen = (performance.now() - sayacBas) / 1000;
    $("#sure").textContent = sureYaz(gecen);
    balonGizle();
    var y = yildizSay(hamle);
    var onceki = kayit.enIyi[zorluk];
    var rekor = typeof onceki !== "number" || gecen < onceki;
    if (rekor) kayit.enIyi[zorluk] = Math.round(gecen * 10) / 10;
    kaydet();
    paneliGuncelle();
    ses("kazandi");
    deste.forEach(function (k, i) { sonra(function () { k.el.classList.remove("pop"); void k.el.offsetWidth; k.el.classList.add("pop"); }, i * 30); });
    konfeti();
    sonra(function () { sonucGoster(y, rekor); }, 650);
  }

  function sonucGoster(y, rekor) {
    var z = ZORLUK[zorluk];
    var yildizHtml = "";
    for (var i = 0; i < 3; i++) yildizHtml += YILDIZ.replace("<svg", '<svg class="' + (i < y ? "dolu" : "") + '"');
    $("#sonucYildiz").innerHTML = yildizHtml;
    $("#sonucYildiz").setAttribute("aria-label", y + " yıldız");
    $("#rekorRozet").classList.toggle("gorunur", rekor);
    $("#sonucBaslik").textContent = y === 3 ? "Kusursuz hafıza!" : y === 2 ? "Harika iş!" : "Bitirdin!";
    $("#sonucMetin").textContent = z.ad + " seviyeyi " + hamle + " hamlede, " + sureUzun(gecen) + " tamamladın." +
      (y < 3 ? " Üç yıldız için en çok " + esik(A.ucYildiz) + " hamle gerekiyor." : "");
    $("#sonucSure").textContent = sureDetay(gecen);
    $("#sonucHamle").textContent = hamle;
    $("#sonucEnIyi").textContent = sureDetay(kayit.enIyi[zorluk]);
    var sira = SIRA.indexOf(zorluk), sonraki = $("#sonraki");
    if (sira < SIRA.length - 1) { sonraki.textContent = ZORLUK[SIRA[sira + 1]].ad + " seviyeye geç"; sonraki.setAttribute("data-hedef", SIRA[sira + 1]); }
    else { sonraki.textContent = "Kolay seviyeye dön"; sonraki.setAttribute("data-hedef", "kolay"); }
    sonuc.classList.add("gorunur");
    sonuc.setAttribute("aria-hidden", "false");
    setTimeout(function () { $("#tekrar").focus({ preventScroll: true }); }, 60);
  }

  /* ── Panel ── */
  function paneliGuncelle() {
    var cift = ciftSayisi();
    $("#hamle").textContent = hamle;
    $("#eslesen").textContent = eslesen + " / " + cift;
    $("#ilerlemeCubuk").style.width = (eslesen / cift * 100) + "%";
    var y = yildizSay(hamle);
    var svgler = $("#yildizlar").children;
    for (var i = 0; i < svgler.length; i++) {
      var dolu = i < y;
      if (!dolu && i < oncekiYildiz) { svgler[i].classList.remove("dustu"); void svgler[i].offsetWidth; svgler[i].classList.add("dustu"); }
      svgler[i].classList.toggle("dolu", dolu);
    }
    oncekiYildiz = y;
    $("#yildizlar").setAttribute("aria-label", y + " yıldız");
    var e3 = esik(A.ucYildiz), e2 = esik(Math.max(A.ikiYildiz, A.ucYildiz));
    $("#yildizNot").textContent = y === 3 ? e3 + " hamleye kadar üç yıldız" : y === 2 ? e2 + " hamleye kadar iki yıldız" : "Bitir, süreni kaydet";
    var en = kayit.enIyi[zorluk];
    $("#enIyi").textContent = typeof en === "number" ? sureDetay(en) : "Henüz yok";
    $("#enIyi").classList.toggle("bos", typeof en !== "number");
  }
  function seciciGuncelle() {
    var dugmeler = document.querySelectorAll(".secici button");
    for (var i = 0; i < dugmeler.length; i++) {
      var secili = dugmeler[i].getAttribute("data-zorluk") === zorluk;
      dugmeler[i].setAttribute("aria-checked", secili ? "true" : "false");
      dugmeler[i].tabIndex = secili ? 0 : -1;
    }
    document.querySelector(".kayan").style.transform = "translateX(" + (SIRA.indexOf(zorluk) * 100) + "%)";
  }
  function girisMetni() {
    var s = A.onizlemeSuresi;
    var bas = s > 0 ? "Kartlar başta " + String(s).replace(".", ",") + " saniye açık kalır. Yerlerini aklında tut, sonra " : "Kartlar kapalı başlar. ";
    $("#girisMetin").textContent = bas + ciftSayisi() + " çifti en az hamleyle eşleştir.";
  }
  function zorlukSec(z) {
    if (!ZORLUK[z]) return;
    zorluk = z; kayit.zorluk = z; kaydet();
    sonuc.classList.remove("gorunur");
    sonuc.setAttribute("aria-hidden", "true");
    hazirla();
    giris.classList.add("gorunur");
  }

  /* ── Yerleşim: kartlar ekrana sığacak boyda ── */
  function yerlestir() {
    var z = ZORLUK[zorluk];
    var dar = innerWidth <= 860;
    var pad = dar ? 2 : 10;
    var W = masa.clientWidth - pad * 2, H = masa.clientHeight - pad * 2;
    var sut = z.sut, sat = z.sat;
    if (H > W * 1.05 && sut > sat) { var t = sut; sut = sat; sat = t; }
    var bosluk = Math.round(Math.max(7, Math.min(16, Math.min(W, H) * 0.02)));
    var oran = 1.22;
    var w = Math.min((W - bosluk * (sut - 1)) / sut, (H - bosluk * (sat - 1)) / sat / oran, 178);
    w = Math.max(44, Math.floor(w));
    tahta.style.setProperty("--sut", sut);
    tahta.style.setProperty("--w", w + "px");
    tahta.style.setProperty("--h", Math.floor(w * oran) + "px");
    tahta.style.setProperty("--b", bosluk + "px");
    aktifSut = sut;
  }

  /* ── Balon mesaj ── */
  function balonGoster(metin, sure) {
    clearTimeout(balonZ);
    balon.textContent = metin;
    balon.classList.remove("gorunur"); void balon.offsetWidth; balon.classList.add("gorunur");
    if (sure) balonZ = setTimeout(balonGizle, sure);
  }
  function balonGizle() { clearTimeout(balonZ); balon.classList.remove("gorunur"); }

  /* ── Eşleşme kıvılcımları ── */
  function kivilcim(el) {
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var renk = getComputedStyle(document.body).getPropertyValue("--vurgu").trim() || "#ff6b4a";
    var renkler = [renk, "#ffbe2e", "#ff6fb0", "#4d9cf5"];
    for (var i = 0; i < 12; i++) {
      var s = document.createElement("span");
      var aci = (Math.PI * 2 * i) / 12 + Math.random() * 0.4, mesafe = r.width * (0.55 + Math.random() * 0.45);
      s.className = "kivilcim" + (i % 3 === 0 ? " kare" : "");
      s.style.left = cx + "px"; s.style.top = cy + "px";
      s.style.background = renkler[i % renkler.length];
      var boy = 6 + Math.random() * 6;
      s.style.width = s.style.height = boy + "px";
      s.style.setProperty("--dx", Math.cos(aci) * mesafe + "px");
      s.style.setProperty("--dy", Math.sin(aci) * mesafe + "px");
      s.style.setProperty("--r", Math.round(Math.random() * 360) + "deg");
      document.body.appendChild(s);
      setTimeout(function (x) { return function () { x.remove(); }; }(s), 800);
    }
  }

  /* ── Konfeti (bitişte) ── */
  var kTuval = $("#konfeti"), kc = kTuval.getContext("2d"), parcalar = [], konfetiAcik = false, konfetiOnce = 0;
  function konfetiBoyut() { var d = window.devicePixelRatio || 1; kTuval.width = innerWidth * d; kTuval.height = innerHeight * d; kc.setTransform(d, 0, 0, d, 0, 0); }
  function konfetiEkle(x, y, aci, guc, n, yayilim) {
    for (var i = 0; i < n; i++) {
      var a = aci + (Math.random() - 0.5) * (yayilim || 0.9), v = guc * (0.55 + Math.random() * 0.6);
      parcalar.push({
        x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        w: 7 + Math.random() * 7, h: 4 + Math.random() * 5, d: Math.random() * Math.PI * 2, dv: (Math.random() - 0.5) * 0.3,
        s: Math.random() * 10, son: 2.2 + Math.random() * 1.8, renk: KONFETI_RENK[Math.floor(Math.random() * KONFETI_RENK.length)],
        tur: Math.random() < 0.25 ? 1 : 0, omur: 0
      });
    }
  }
  function konfeti() {
    konfetiBoyut();
    var W = innerWidth, H = innerHeight, guc = Math.max(15, Math.min(25, H / 34));
    konfetiEkle(0, H * 0.92, -Math.PI / 3, guc, 80);
    konfetiEkle(W, H * 0.92, -Math.PI * 2 / 3, guc, 80);
    for (var i = 0; i < 70; i++) konfetiEkle(Math.random() * W, -20 - Math.random() * 200, Math.PI / 2, 1.5, 1);
    sonra(function () {
      konfetiEkle(W * 0.08, H * 0.95, -Math.PI * 0.42, guc * 0.95, 45);
      konfetiEkle(W * 0.92, H * 0.95, -Math.PI * 0.58, guc * 0.95, 45);
    }, 380);
    if (!konfetiAcik) { konfetiAcik = true; konfetiOnce = 0; requestAnimationFrame(konfetiAdim); }
  }
  function konfetiAdim(simdi) {
    var f = konfetiOnce ? Math.min(3, (simdi - konfetiOnce) / (1000 / 60)) : 1;
    konfetiOnce = simdi;
    var W = innerWidth, H = innerHeight, surt = Math.pow(0.985, f);
    kc.clearRect(0, 0, W, H);
    parcalar = parcalar.filter(function (p) { return p.y < H + 40 && p.omur < 720; });
    parcalar.forEach(function (p) {
      p.omur += f;
      p.vx *= surt; p.vy = p.vy * surt + 0.3 * f;
      if (p.vy > p.son) p.vy = p.son;
      p.s += 0.11 * f;
      p.x += (p.vx + Math.sin(p.s) * 0.9) * f; p.y += p.vy * f; p.d += p.dv * f;
      kc.save(); kc.translate(p.x, p.y); kc.rotate(p.d); kc.scale(1, Math.cos(p.s));
      kc.fillStyle = p.renk;
      if (p.tur) { kc.beginPath(); kc.arc(0, 0, p.h * 0.7, 0, Math.PI * 2); kc.fill(); }
      else kc.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      kc.restore();
    });
    if (parcalar.length) requestAnimationFrame(konfetiAdim);
    else { konfetiAcik = false; kc.clearRect(0, 0, W, H); }
  }

  /* ── Sayaç döngüsü ── */
  function dongu() {
    if (sayacAcik) {
      var s = Math.floor((performance.now() - sayacBas) / 1000);
      if (s !== sonSaniye) { sonSaniye = s; $("#sure").textContent = sureYaz(s); }
    }
    requestAnimationFrame(dongu);
  }

  /* ── Olaylar ── */
  document.querySelectorAll(".secici button").forEach(function (b) {
    b.addEventListener("click", function () { zorlukSec(b.getAttribute("data-zorluk")); });
  });
  $(".secici").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && giris.classList.contains("gorunur")) { e.preventDefault(); basla(); return; }
    var i = SIRA.indexOf(zorluk);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") i = Math.min(SIRA.length - 1, i + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") i = Math.max(0, i - 1);
    else return;
    e.preventDefault();
    zorlukSec(SIRA[i]);
    document.querySelector('.secici button[data-zorluk="' + SIRA[i] + '"]').focus();
  });
  $("#basla").addEventListener("click", basla);
  $("#yeniOyun").addEventListener("click", function () { hazirla(); basla(); });
  $("#tekrar").addEventListener("click", function () { hazirla(); basla(); });
  $("#sonraki").addEventListener("click", function () { zorlukSec(this.getAttribute("data-hedef")); });
  $("#sesDugme").addEventListener("click", function () { sesAcik = !sesAcik; kayit.ses = sesAcik; kaydet(); sesDugmesi(); if (sesAcik) ses("cevir"); });

  tahta.addEventListener("keydown", function (e) {
    var kartlar = Array.prototype.slice.call(tahta.children), i = kartlar.indexOf(document.activeElement);
    if (i < 0) return;
    var y = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: aktifSut, ArrowUp: -aktifSut }[e.key];
    if (!y) return;
    e.preventDefault();
    var h = Math.max(0, Math.min(kartlar.length - 1, i + y));
    kartlar[h].focus();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    var hedef = document.activeElement;
    if (hedef && hedef.tagName === "BUTTON" && hedef !== document.body) return;
    if (giris.classList.contains("gorunur")) { e.preventDefault(); basla(); }
    else if (sonuc.classList.contains("gorunur")) { e.preventDefault(); hazirla(); basla(); }
  });

  var boyutZ = null;
  addEventListener("resize", function () { clearTimeout(boyutZ); boyutZ = setTimeout(function () { yerlestir(); if (konfetiAcik) konfetiBoyut(); }, 80); });

  /* ── Başlat ── */
  $("#logo").innerHTML = window.CIZIM_LOGO || "";
  $("#yildizlar").innerHTML = YILDIZ + YILDIZ + YILDIZ;
  var ornek = [cizimler[0], cizimler[10], cizimler[7]];
  $("#yelpaze").innerHTML = ornek.map(function (c, i) {
    return '<span class="kart' + (i === 1 ? "" : " acik") + '">' + kartHtml(c) + "</span>";
  }).join("");
  sesDugmesi();
  hazirla();
  requestAnimationFrame(dongu);

  fetch("ayarlar.json", { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error("ayarlar okunamadı"); return r.json(); })
    .then(function (j) {
      Object.keys(j).forEach(function (k) { if (j[k] && typeof j[k].deger === "number" && k in A) A[k] = j[k].deger; });
      document.documentElement.style.setProperty("--cevir", Math.max(120, A.cevirmeHizi) + "ms");
      girisMetni();
      paneliGuncelle();
    })
    .catch(function () { /* varsayılanlarla devam */ });
})();
`,
    "ayarlar.json": `{
  "cevirmeGecikmesi": { "etiket": "Çevirme gecikmesi (ms)", "deger": 850, "min": 300, "max": 2000, "adim": 50 },
  "onizlemeSuresi": { "etiket": "Önizleme süresi (sn)", "deger": 2, "min": 0, "max": 6, "adim": 0.5 },
  "ucYildiz": { "etiket": "Üç yıldız: çift başına hamle", "deger": 1.6, "min": 1, "max": 3, "adim": 0.1 },
  "ikiYildiz": { "etiket": "İki yıldız: çift başına hamle", "deger": 2.4, "min": 1.2, "max": 4, "adim": 0.1 },
  "cevirmeHizi": { "etiket": "Çevirme animasyonu (ms)", "deger": 480, "min": 200, "max": 900, "adim": 20 }
}
`,
  },
};
