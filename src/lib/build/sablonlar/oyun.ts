/* Şablon: Neon Koşu — neon synthwave şehirde canvas sonsuz koşu: paralaks gökdelenler ve ufuk güneşi, çizilmiş robot (koşu, zıplama, çift zıplama, kayma), bariyer, enerji kapısı, dron ve çukur engelleri, enerji küreleri ve kalkan, hızlanan zorluk, parçacıklar ve ekran sarsıntısı. Oynanış sayıları ayarlar.json'dan (Vayra Build ayar paneli kaydırıcıları). */

export const NEON_KOSU = {
  id: "neon-kosu",
  ad: "Neon Koşu",
  tur: "oyun" as const,
  aciklama: "Neon şehirde robotla sonsuz koşu; çift zıplama, kayma, enerji kalkanı ve hızlanan engeller",
  kapak: "/gercek/build/sablon/neon-kosu.webp",
  dosyalar: {
    "index.html": `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
  <meta name="theme-color" content="#07021a" />
  <meta name="description" content="Neon şehirde sonsuz koşu: bariyerlerin üstünden zıpla, dronların altından kay, enerji kürelerini toplayıp kalkanını doldur." />
  <title>Neon Koşu</title>
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Audiowide&family=Sora:wght@400;500;600;700;800&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body class="giris">
  <canvas id="tuval" role="img" aria-label="Neon Koşu oyun alanı: gece şehrinde koşan robot"></canvas>
  <div class="tarama" aria-hidden="true"></div>

  <header class="hud" id="hud">
    <div class="hud-sol">
      <div class="marka">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <linearGradient id="mZemin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0a5c" /><stop offset="1" stop-color="#0b0324" /></linearGradient>
            <linearGradient id="mGunes" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff27a" /><stop offset=".55" stop-color="#ff8a3d" /><stop offset="1" stop-color="#ff2e88" /></linearGradient>
            <clipPath id="mKes"><rect x="0" y="0" width="64" height="38" /></clipPath>
          </defs>
          <rect width="64" height="64" rx="17" fill="url(#mZemin)" />
          <g clip-path="url(#mKes)">
            <circle cx="32" cy="37" r="17" fill="url(#mGunes)" />
            <rect x="12" y="28.5" width="40" height="1.6" fill="#1a0640" />
            <rect x="12" y="32.4" width="40" height="2.4" fill="#1a0640" />
          </g>
          <path d="M7 38.5h50" stroke="#2ef2ff" stroke-width="2.6" stroke-linecap="round" />
          <path d="M32 40 16 60M32 40l16 20M32 40v20M12 47h40M8 54h48" stroke="#ff3ea5" stroke-width="1.4" opacity=".7" />
        </svg>
        <span>Neon Koşu</span>
      </div>
    </div>

    <div class="hud-orta">
      <span class="hud-etiket">Skor</span>
      <output id="skor" aria-live="off">0</output>
      <div class="hud-satir">
        <span class="hap" id="mesafe">0 m</span>
        <span class="hap genis" id="seviye">Seviye 1</span>
        <span class="hap dar" id="enIyiDar">En iyi 0</span>
      </div>
      <div class="enerji" id="enerji" aria-label="Enerji: 0 / 10">
        <svg class="simsek" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 2.5 5.5 13.4h5.6l-1 8.1 7.7-10.9h-5.6z" /></svg>
        <div class="hucreler" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <span class="kalkan-yazi">Kalkan</span>
      </div>
    </div>

    <div class="hud-sag">
      <span class="hap en-iyi genis">En iyi <b id="enIyi">0</b></span>
      <button class="ikon" id="sesDugme" type="button" aria-label="Sesi kapat" aria-pressed="true">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path class="ses-acik" d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Zm11.5-.8a4.5 4.5 0 0 1 0 6.6M17.8 6.3a8 8 0 0 1 0 11.4" /><path class="ses-kapali" d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Zm11.5 0 5 5m0-5-5 5" /></svg>
      </button>
      <button class="ikon" id="durDugme" type="button" aria-label="Duraklat">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 6v12M15.5 6v12" /></svg>
      </button>
    </div>
  </header>

  <div class="bildirim" id="bildirim" role="status" aria-live="polite"></div>

  <!-- Başlangıç -->
  <section class="perde gorunur" id="perdeGiris" aria-labelledby="girisBaslik">
    <div class="kart kart-giris">
      <p class="ust-etiket"><i></i>Sonsuz koşu, gece vardiyası</p>
      <h1 id="girisBaslik" class="logo-yazi">Neon <span>Koşu</span></h1>
      <p class="aciklama">Robot K-7 şehrin neon otoyolunda. Engellerden kaç, enerji kürelerini topla; on küre bir kalkan doldurur ve seni bir çarpmadan kurtarır.</p>

      <ul class="engeller" aria-label="Engeller">
        <li>
          <svg viewBox="0 0 40 40" aria-hidden="true"><rect x="9" y="12" width="3" height="22" rx="1" fill="#2a1d52" /><rect x="28" y="12" width="3" height="22" rx="1" fill="#2a1d52" /><rect x="12" y="13" width="16" height="20" fill="#ff3ea5" opacity=".18" /><path d="M12 16h16M12 22.5h16M12 29h16" stroke="#ff7cc6" stroke-width="2" /><rect x="7" y="33" width="26" height="3" rx="1" fill="#ffd23f" /></svg>
          <b>Bariyer</b><small>Üstünden zıpla</small>
        </li>
        <li>
          <svg viewBox="0 0 40 40" aria-hidden="true"><rect x="10" y="4" width="3" height="30" rx="1" fill="#2a1d52" /><rect x="27" y="4" width="3" height="30" rx="1" fill="#2a1d52" /><rect x="13" y="5" width="14" height="28" fill="#ffb02e" opacity=".2" /><path d="M13 8h14M13 13.5h14M13 19h14M13 24.5h14M13 30h14" stroke="#ffc861" stroke-width="1.8" /><rect x="8" y="33" width="24" height="3" rx="1" fill="#ffd23f" /></svg>
          <b>Enerji kapısı</b><small>Çift zıpla</small>
        </li>
        <li>
          <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 13h30" stroke="#3a3360" stroke-width="2.4" /><ellipse cx="7" cy="10.5" rx="5" ry="1.4" fill="#c8d6ff" opacity=".7" /><ellipse cx="33" cy="10.5" rx="5" ry="1.4" fill="#c8d6ff" opacity=".7" /><rect x="10" y="13" width="20" height="11" rx="5" fill="#2b2349" /><circle cx="15.5" cy="18.5" r="2.6" fill="#ff2e63" /><path d="M8 33h24" stroke="#2ef2ff" stroke-width="2" stroke-linecap="round" opacity=".7" /></svg>
          <b>Dron</b><small>Altından kay</small>
        </li>
        <li>
          <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M3 22h12M25 22h12" stroke="#2ef2ff" stroke-width="2.4" stroke-linecap="round" /><rect x="3" y="23" width="12" height="7" fill="#24104a" /><rect x="25" y="23" width="12" height="7" fill="#24104a" /><rect x="15" y="22" width="10" height="16" fill="#ff2e63" opacity=".25" /><rect x="13" y="20" width="2.4" height="10" fill="#ffd23f" /><rect x="24.6" y="20" width="2.4" height="10" fill="#ffd23f" /></svg>
          <b>Çukur</b><small>Atla, düşme</small>
        </li>
      </ul>

      <ul class="kontroller" aria-label="Kontroller">
        <li>
          <span class="eylem">Zıpla</span>
          <span class="tuslar masaustu"><kbd>Boşluk</kbd><kbd aria-label="Yukarı ok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 18V6m-5 5 5-5 5 5" /></svg></kbd></span>
          <span class="tuslar dokunmatik">Ekrana dokun</span>
        </li>
        <li>
          <span class="eylem">Çift zıplama</span>
          <span class="tuslar">Havadayken bir kez daha</span>
        </li>
        <li>
          <span class="eylem">Kay</span>
          <span class="tuslar masaustu"><kbd aria-label="Aşağı ok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12m-5-5 5 5 5-5" /></svg></kbd><small>basılı tut</small></span>
          <span class="tuslar dokunmatik">Aşağı kaydır</span>
        </li>
      </ul>

      <button class="ana" id="baslaDugme" type="button">
        <span>Koşuya başla</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m-5-6 6 6-6 6" /></svg>
      </button>
      <p class="alt-bilgi"><span>En iyi skorun <b id="girisEnIyi">0</b></span><span class="masaustu"><kbd>Enter</kbd> ile başla</span></p>
    </div>
  </section>

  <!-- Duraklatma -->
  <section class="perde" id="perdeDur" aria-labelledby="durBaslik" hidden>
    <div class="kart kart-kucuk">
      <p class="ust-etiket"><i></i>Mola</p>
      <h2 id="durBaslik">Duraklatıldı</h2>
      <p class="aciklama" id="durMetin">Şu ana kadar 0 puan topladın. Hazır olduğunda kaldığın yerden devam et.</p>
      <div class="eylemler">
        <button class="ana" id="devamDugme" type="button"><span>Devam et</span></button>
        <button class="ikincil" id="bastanDugme" type="button">Baştan başla</button>
      </div>
      <p class="alt-bilgi masaustu"><span><kbd>P</kbd> ya da <kbd>Esc</kbd> ile devam</span></p>
    </div>
  </section>

  <!-- Oyun sonu -->
  <section class="perde" id="perdeSon" aria-labelledby="sonBaslik" hidden>
    <div class="kart kart-son">
      <p class="ust-etiket kirmizi" id="sonNeden"><i></i>Bir drona çarptın</p>
      <h2 id="sonBaslik">Koşu bitti</h2>
      <p class="rekor" id="rekorYazi" hidden>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>
        <span id="rekorMetin">Yeni rekor</span>
      </p>
      <dl class="sonuclar">
        <div class="buyuk"><dt>Skor</dt><dd id="sonSkor">0</dd></div>
        <div><dt>Mesafe</dt><dd id="sonMesafe">0 m</dd></div>
        <div><dt>Küre</dt><dd id="sonKure">0</dd></div>
        <div><dt>En iyi</dt><dd id="sonEnIyi">0</dd></div>
      </dl>
      <div class="eylemler">
        <button class="ana" id="tekrarDugme" type="button">
          <span>Tekrar koş</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4" /></svg>
        </button>
        <button class="ikincil" id="anaEkranDugme" type="button">Ana ekran</button>
      </div>
      <p class="alt-bilgi masaustu"><span><kbd>Boşluk</kbd> ile hemen yeniden başla</span></p>
    </div>
  </section>

  <script src="oyun.js"></script>
</body>
</html>
`,
    "stil.css": `/* Neon Koşu — synthwave gece: mor gökyüzü, ufuk güneşi, camgöbeği ve pembe neon. */
:root {
  --gece: #07021a;
  --mor: #1a0640;
  --pembe: #ff3ea5;
  --camgobegi: #2ef2ff;
  --turuncu: #ff8a3d;
  --sari: #ffd23f;
  --metin: #f6f2ff;
  --metin-2: #d2c8f0;
  --metin-3: #a497cf;
  --cizgi: rgba(255, 255, 255, 0.13);
  --cam: rgba(24, 9, 56, 0.58);
  --baslik: "Audiowide", "Sora", system-ui, sans-serif;
  --yazi: "Sora", system-ui, -apple-system, "Segoe UI", sans-serif;
  --egri: cubic-bezier(0.2, 0.9, 0.3, 1.15);
}

* { box-sizing: border-box; }
[hidden] { display: none !important; }
html, body {
  margin: 0;
  height: 100%;
  overflow: hidden;
  background: var(--gece);
  color: var(--metin);
  font-family: var(--yazi);
  -webkit-font-smoothing: antialiased;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
button { font: inherit; color: inherit; cursor: pointer; }
:focus-visible { outline: 2px solid var(--camgobegi); outline-offset: 3px; }

canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  display: block;
  touch-action: none;
}
.tarama {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0 1px, transparent 1px 3px);
  mix-blend-mode: overlay;
}

/* ── Gösterge ── */
.hud {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: start;
  gap: 16px;
  padding: calc(env(safe-area-inset-top) + 18px) calc(env(safe-area-inset-right) + 22px) 0 calc(env(safe-area-inset-left) + 22px);
  pointer-events: none;
  transition: opacity 0.45s ease, transform 0.45s ease;
}
body.giris .hud { opacity: 0; transform: translateY(-12px); }
.hud button { pointer-events: auto; }
.hud-sol { display: flex; align-items: center; min-height: 44px; }
.marka { display: inline-flex; align-items: center; gap: 11px; font-family: var(--baslik); font-size: 17px; letter-spacing: 0.01em; }
.marka svg { width: 38px; height: 38px; flex: none; }

.hud-orta { display: grid; justify-items: center; gap: 6px; text-align: center; }
.hud-etiket { font-size: 12px; font-weight: 600; color: var(--metin-2); }
#skor {
  display: block;
  font-family: var(--yazi);
  font-weight: 800;
  font-size: 48px;
  letter-spacing: -0.03em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(180deg, #ffffff 35%, #8ff6ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 16px rgba(46, 242, 255, 0.5));
}
.hud-satir { display: flex; gap: 6px; }
.hap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--cam);
  border: 1px solid var(--cizgi);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--metin-2);
  white-space: nowrap;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-variant-numeric: tabular-nums;
}
.hap b { color: var(--metin); font-weight: 700; }
.hap.dar { display: none; }

.enerji {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 9px;
  border-radius: 999px;
  background: var(--cam);
  border: 1px solid var(--cizgi);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: border-color 0.3s, background 0.3s;
}
.simsek { width: 16px; height: 16px; fill: var(--sari); }
.hucreler { display: flex; gap: 3px; }
.hucreler i { width: 9px; height: 12px; border-radius: 3px; background: rgba(255, 255, 255, 0.12); transition: background 0.2s, transform 0.2s; }
.hucreler i.dolu { background: linear-gradient(180deg, #a5fbff, var(--camgobegi)); transform: scaleY(1.08); }
.kalkan-yazi { display: none; font-size: 12px; font-weight: 700; color: #a5fbff; }
.enerji.kalkanli { border-color: rgba(46, 242, 255, 0.55); background: rgba(10, 60, 80, 0.55); }
.enerji.kalkanli .kalkan-yazi { display: inline; }
.enerji.parla { animation: parla 0.5s ease; }
@keyframes parla { 50% { transform: scale(1.08); } }

.hud-sag { display: flex; justify-content: flex-end; align-items: center; gap: 8px; }
.hud-sag .en-iyi { min-height: 44px; padding: 0 16px; font-size: 13px; }
.ikon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  border: 1px solid var(--cizgi);
  background: var(--cam);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: background 0.2s, border-color 0.2s, transform 0.15s;
}
.ikon:hover { background: rgba(60, 24, 120, 0.7); border-color: rgba(46, 242, 255, 0.45); }
.ikon:active { transform: scale(0.94); }
.ikon svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ikon .ses-kapali { display: none; }
.ikon[aria-pressed="false"] .ses-acik { display: none; }
.ikon[aria-pressed="false"] .ses-kapali { display: inline; }

/* ── Bildirim ── */
.bildirim {
  position: fixed;
  left: 50%;
  top: calc(env(safe-area-inset-top) + 152px);
  transform: translate(-50%, -8px);
  padding: 10px 18px;
  border-radius: 999px;
  background: rgba(30, 10, 70, 0.72);
  border: 1px solid rgba(46, 242, 255, 0.4);
  color: #e9fdff;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: opacity 0.3s, transform 0.3s var(--egri);
}
.bildirim.gorunur { opacity: 1; transform: translate(-50%, 0); }
.bildirim.pembe { border-color: rgba(255, 62, 165, 0.55); color: #ffe3f3; }
.bildirim.sari { border-color: rgba(255, 210, 63, 0.55); color: #fff6d6; }

/* ── Perdeler ── */
.perde {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: calc(env(safe-area-inset-top) + 20px) 20px calc(env(safe-area-inset-bottom) + 20px);
  overflow-y: auto;
  background: rgba(7, 2, 26, 0.28);
  opacity: 0;
  transition: opacity 0.35s ease;
}
.perde.gorunur { opacity: 1; }
.kart {
  position: relative;
  width: min(540px, 100%);
  padding: 30px 30px 24px;
  border-radius: 28px;
  background: linear-gradient(165deg, rgba(46, 16, 98, 0.66) 0%, rgba(14, 5, 38, 0.8) 70%);
  border: 1px solid rgba(255, 255, 255, 0.13);
  backdrop-filter: blur(20px) saturate(1.3);
  -webkit-backdrop-filter: blur(20px) saturate(1.3);
  overflow: hidden;
  transform: translateY(14px) scale(0.98);
  transition: transform 0.5s var(--egri);
}
.perde.gorunur .kart { transform: none; }
.kart::before {
  content: "";
  position: absolute;
  left: 24px;
  right: 24px;
  top: 0;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, var(--camgobegi), var(--pembe), transparent);
}
.kart-kucuk { width: min(420px, 100%); }
.kart-son { width: min(460px, 100%); }

.ust-etiket { display: inline-flex; align-items: center; gap: 8px; margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #a5fbff; }
.ust-etiket i { width: 8px; height: 8px; border-radius: 50%; background: var(--camgobegi); animation: nabiz 1.6s ease-in-out infinite; }
.ust-etiket.kirmizi { color: #ffb3d6; }
.ust-etiket.kirmizi i { background: var(--pembe); }
@keyframes nabiz { 50% { opacity: 0.35; transform: scale(0.7); } }

.logo-yazi, .kart h2 { margin: 0; font-family: var(--baslik); font-weight: 400; letter-spacing: 0.005em; line-height: 1.02; }
.logo-yazi { font-size: clamp(42px, 8vw, 60px); }
.logo-yazi span, .kart h2 span {
  background: linear-gradient(90deg, var(--camgobegi), #b98cff 55%, var(--pembe));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.kart h2 { font-size: 38px; }
.aciklama { margin: 12px 0 0; color: var(--metin-2); font-size: 15px; line-height: 1.6; }

.engeller { list-style: none; margin: 20px 0 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.engeller li {
  display: grid;
  justify-items: start;
  gap: 2px;
  padding: 10px 10px 11px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: border-color 0.2s, background 0.2s;
}
.engeller li:hover { border-color: rgba(46, 242, 255, 0.35); background: rgba(46, 242, 255, 0.06); }
.engeller svg { width: 36px; height: 36px; margin-bottom: 4px; }
.engeller b { font-size: 13px; font-weight: 600; }
.engeller small { font-size: 12px; color: var(--metin-3); }

.kontroller { list-style: none; margin: 14px 0 0; padding: 4px 0; display: grid; border-top: 1px solid rgba(255, 255, 255, 0.08); }
.kontroller li { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 42px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
.eylem { font-size: 14px; font-weight: 600; }
.tuslar { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--metin-2); }
.tuslar small { font-size: 12px; color: var(--metin-3); }
kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 28px;
  padding: 0 9px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-bottom-width: 2px;
  font: 600 12px var(--yazi);
  color: var(--metin);
}
kbd svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.dokunmatik { display: none !important; }
@media (hover: none) and (pointer: coarse) {
  .dokunmatik { display: inline-flex !important; }
  .masaustu { display: none !important; }
}

.ana {
  position: relative;
  width: 100%;
  min-height: 56px;
  margin-top: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 0;
  border-radius: 18px;
  background: linear-gradient(100deg, #ff3ea5 0%, #ff6a6a 55%, #ff9a3d 100%);
  color: #fff;
  font-size: 16.5px;
  font-weight: 700;
  box-shadow: 0 0 28px rgba(255, 62, 165, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.35);
  transition: transform 0.18s var(--egri), box-shadow 0.25s, filter 0.2s;
}
.ana:hover { transform: translateY(-2px); box-shadow: 0 0 38px rgba(255, 62, 165, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.35); filter: saturate(1.15); }
.ana:active { transform: translateY(0) scale(0.985); }
.ana svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; transition: transform 0.2s; }
.ana:hover svg { transform: translateX(3px); }
.eylemler { display: grid; grid-template-columns: 1.4fr 1fr; gap: 10px; margin-top: 20px; }
.eylemler .ana { margin-top: 0; }
.ikincil {
  min-height: 56px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.06);
  font-size: 15px;
  font-weight: 600;
  transition: background 0.2s, border-color 0.2s;
}
.ikincil:hover { background: rgba(255, 255, 255, 0.11); border-color: rgba(46, 242, 255, 0.4); }

.alt-bilgi { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin: 16px 0 0; font-size: 13px; color: var(--metin-3); }
.alt-bilgi b { color: var(--metin); font-weight: 700; margin-left: 4px; font-variant-numeric: tabular-nums; }
.alt-bilgi kbd { height: 24px; min-width: 24px; padding: 0 7px; font-size: 11.5px; margin-right: 4px; }
.kart-kucuk .alt-bilgi, .kart-son .alt-bilgi { justify-content: center; }

.rekor {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 14px 0 0;
  padding: 7px 14px 7px 10px;
  border-radius: 999px;
  background: rgba(255, 210, 63, 0.12);
  border: 1px solid rgba(255, 210, 63, 0.4);
  color: #ffe9a6;
  font-size: 13.5px;
  font-weight: 600;
  animation: belir 0.6s var(--egri);
}
.rekor svg { width: 18px; height: 18px; fill: var(--sari); }
@keyframes belir { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: none; } }

.sonuclar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 20px 0 0; }
.sonuclar div { padding: 12px 14px; border-radius: 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08); }
.sonuclar .buyuk { grid-column: 1 / -1; display: flex; align-items: baseline; justify-content: space-between; background: linear-gradient(100deg, rgba(46, 242, 255, 0.1), rgba(255, 62, 165, 0.1)); border-color: rgba(46, 242, 255, 0.25); }
.sonuclar dt { font-size: 12px; font-weight: 600; color: var(--metin-3); }
.sonuclar dd { margin: 4px 0 0; font-size: 21px; font-weight: 700; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.sonuclar .buyuk dt { font-size: 14px; color: var(--metin-2); }
.sonuclar .buyuk dd { font-size: 42px; font-weight: 800; letter-spacing: -0.03em; margin: 0; background: linear-gradient(180deg, #fff 30%, #8ff6ff); -webkit-background-clip: text; background-clip: text; color: transparent; }

/* ── Dar ekran ── */
@media (max-width: 760px) {
  .marka span { display: none; }
  .hud-sag .en-iyi { display: none; }
  .hud-satir .genis { display: none; }
  .hap.dar { display: inline-flex; }
}
@media (max-width: 560px) {
  .hud { gap: 8px; padding: calc(env(safe-area-inset-top) + 14px) calc(env(safe-area-inset-right) + 14px) 0 calc(env(safe-area-inset-left) + 14px); }
  .marka svg { width: 40px; height: 40px; }
  #skor { font-size: 40px; }
  .hucreler i { width: 7px; height: 11px; }
  .bildirim { top: calc(env(safe-area-inset-top) + 146px); font-size: 13px; }
  .kart { padding: 24px 20px 20px; border-radius: 24px; }
  .logo-yazi { font-size: 44px; }
  .kart h2 { font-size: 32px; }
  .aciklama { font-size: 14px; }
  .engeller { grid-template-columns: repeat(2, 1fr); }
  .engeller li { grid-template-columns: auto 1fr; grid-template-rows: auto auto; column-gap: 10px; align-items: center; }
  .engeller svg { grid-row: 1 / 3; margin: 0; width: 34px; height: 34px; }
  .sonuclar dd { font-size: 17px; }
  .sonuclar .buyuk dd { font-size: 34px; }
}
@media (max-height: 520px) and (orientation: landscape) {
  .perde { place-items: start center; }
  .engeller { display: none; }
  #skor { font-size: 32px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
`,
    "ayarlar.json": `{
  "hiz": { "etiket": "Başlangıç hızı", "deger": 7, "min": 4, "max": 14, "adim": 0.5 },
  "ziplama": { "etiket": "Zıplama gücü", "deger": 14, "min": 9, "max": 22, "adim": 0.5 },
  "yercekimi": { "etiket": "Yerçekimi", "deger": 0.75, "min": 0.35, "max": 1.5, "adim": 0.05 },
  "engelSikligi": { "etiket": "Engel sıklığı", "deger": 1, "min": 0.4, "max": 2, "adim": 0.1 },
  "hizlanma": { "etiket": "Hızlanma (0 sabit hız)", "deger": 1, "min": 0, "max": 3, "adim": 0.1 }
}
`,
    "oyun.js": `// Neon Koşu — oynanış sayıları ayarlar.json'dan gelir (Vayra Build ayar paneli bu dosyayı düzenler).
// Dünya birimi: zemin y = 0, yukarısı eksi. Her şey s ölçeğiyle tuval pikseline çevrilir; her ekranda aynı oynanış.
(function () {
  "use strict";

  /* ───────── Ayarlar ───────── */
  var A = { hiz: 7, ziplama: 14, yercekimi: 0.75, engelSikligi: 1, hizlanma: 1 };
  fetch("ayarlar.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (!j) return;
      Object.keys(A).forEach(function (k) {
        if (j[k] && typeof j[k].deger === "number" && isFinite(j[k].deger)) A[k] = j[k].deger;
      });
      if (oyun && oyun.demo) oyun.hiz = A.hiz;
    })
    .catch(function () {});

  var ENERJI_HEDEF = 10;
  var KAYIT = "neon-kosu-en-iyi";
  var TIK = 1000 / 60;
  var TAU = Math.PI * 2;

  /* ───────── Yardımcılar ───────── */
  function $(id) { return document.getElementById(id); }
  var bicim = new Intl.NumberFormat("tr-TR");
  function rast(a, b) { return a + Math.random() * (b - a); }
  function sinir(v, a, b) { return v < a ? a : v > b ? b : v; }
  function tohumlu(t) {
    return function () {
      t |= 0; t = (t + 0x6d2b79f5) | 0;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function sec(r, liste) { return liste[Math.floor(r() * liste.length)]; }
  function yuvarlak(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  /* ───────── DOM ───────── */
  var tuval = $("tuval");
  var c = tuval.getContext("2d");
  var el = {
    skor: $("skor"), mesafe: $("mesafe"), seviye: $("seviye"), enIyi: $("enIyi"), enIyiDar: $("enIyiDar"),
    enerji: $("enerji"), hucreler: [].slice.call(document.querySelectorAll("#enerji .hucreler i")),
    bildirim: $("bildirim"), girisEnIyi: $("girisEnIyi"),
    perdeGiris: $("perdeGiris"), perdeDur: $("perdeDur"), perdeSon: $("perdeSon"),
    durMetin: $("durMetin"), sonNeden: $("sonNeden"), sonBaslik: $("sonBaslik"), rekorYazi: $("rekorYazi"), rekorMetin: $("rekorMetin"),
    sonSkor: $("sonSkor"), sonMesafe: $("sonMesafe"), sonKure: $("sonKure"), sonEnIyi: $("sonEnIyi"),
    sesDugme: $("sesDugme"), durDugme: $("durDugme"),
  };

  var enIyi = 0;
  try { enIyi = Number(localStorage.getItem(KAYIT)) || 0; } catch (e) { enIyi = 0; }
  function enIyiYaz() {
    var t = bicim.format(enIyi);
    el.enIyi.textContent = t;
    el.enIyiDar.textContent = "En iyi " + t;
    el.girisEnIyi.textContent = t;
  }
  enIyiYaz();

  /* ───────── Ses (Web Audio, küçük sentezler) ───────── */
  var ses = { acik: true, ctx: null };
  try { ses.acik = localStorage.getItem("neon-kosu-ses") !== "kapali"; } catch (e) {}
  function sesDugmeYaz() {
    el.sesDugme.setAttribute("aria-pressed", ses.acik ? "true" : "false");
    el.sesDugme.setAttribute("aria-label", ses.acik ? "Sesi kapat" : "Sesi aç");
  }
  sesDugmeYaz();
  function sesBaslat() {
    if (ses.ctx) { if (ses.ctx.state === "suspended") ses.ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ses.ctx = new AC(); } catch (e) { ses.ctx = null; }
  }
  function ton(f1, f2, sure, tip, hacim, gecikme) {
    var a = ses.ctx;
    if (!a) return;
    var t = a.currentTime + (gecikme || 0);
    var o = a.createOscillator(), g = a.createGain();
    o.type = tip;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(f2, t + sure);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(hacim, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
    o.connect(g);
    g.connect(a.destination);
    o.start(t);
    o.stop(t + sure + 0.03);
  }
  function sesCal(ad) {
    if (!ses.acik || !ses.ctx || !oyun || oyun.demo) return;
    switch (ad) {
      case "zipla": ton(360, 720, 0.13, "square", 0.035); break;
      case "cift": ton(520, 1240, 0.17, "square", 0.035); break;
      case "kure": ton(1320, 1760, 0.08, "sine", 0.06); ton(1760, 2350, 0.08, "sine", 0.04, 0.05); break;
      case "kay": ton(260, 110, 0.2, "sawtooth", 0.025); break;
      case "carp": ton(240, 40, 0.55, "sawtooth", 0.07); ton(120, 30, 0.6, "square", 0.04); break;
      case "dus": ton(620, 70, 0.8, "sine", 0.06); break;
      case "kalkan": [523, 659, 784, 1046].forEach(function (f, i) { ton(f, f * 1.01, 0.16, "triangle", 0.05, i * 0.07); }); break;
      case "kir": ton(980, 180, 0.32, "triangle", 0.06); break;
      case "seviye": ton(660, 990, 0.18, "triangle", 0.04); ton(990, 1320, 0.2, "triangle", 0.04, 0.12); break;
    }
  }

  /* ───────── Sahne ölçüleri ve önbellek ───────── */
  var G = 0, Y = 0, dpr = 1, s = 1, zeminY = 0, ufukY = 0, gorunurG = 0, oyuncuX = 120;
  var D = {};
  var katmanlar = [];
  var yildizlar = [];
  var isikOnbellek = {};

  function isikSprite(rgb) {
    if (isikOnbellek[rgb]) return isikOnbellek[rgb];
    var cv = document.createElement("canvas");
    cv.width = cv.height = 96;
    var g = cv.getContext("2d");
    var rg = g.createRadialGradient(48, 48, 0, 48, 48, 48);
    rg.addColorStop(0, "rgba(" + rgb + ",1)");
    rg.addColorStop(0.25, "rgba(" + rgb + ",0.55)");
    rg.addColorStop(0.6, "rgba(" + rgb + ",0.14)");
    rg.addColorStop(1, "rgba(" + rgb + ",0)");
    g.fillStyle = rg;
    g.fillRect(0, 0, 96, 96);
    isikOnbellek[rgb] = cv;
    return cv;
  }
  function isik(rgb, x, y, boyut, alfa) {
    var eski = c.globalAlpha;
    c.globalAlpha = eski * alfa;
    c.drawImage(isikSprite(rgb), x - boyut / 2, y - boyut / 2, boyut, boyut);
    c.globalAlpha = eski;
  }

  function boyutla() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    G = tuval.width = Math.round(window.innerWidth * dpr);
    Y = tuval.height = Math.round(window.innerHeight * dpr);
    s = Math.min(Y / 520, G / 480);
    zeminY = Math.round(Math.min(Y - 118 * s, Y * 0.74));
    ufukY = Math.round(zeminY - Math.max(150 * s, Y * 0.3));
    gorunurG = G / s;
    oyuncuX = sinir(gorunurG * 0.2, 80, 220);
    sahneHazirla();
  }

  function sahneHazirla() {
    D.gok = c.createLinearGradient(0, 0, 0, ufukY);
    D.gok.addColorStop(0, "#06011a");
    D.gok.addColorStop(0.42, "#170540");
    D.gok.addColorStop(0.75, "#43105f");
    D.gok.addColorStop(0.93, "#8f1f6e");
    D.gok.addColorStop(1, "#c0306f");
    D.zemin = c.createLinearGradient(0, ufukY, 0, Y);
    D.zemin.addColorStop(0, "#3a0b4a");
    D.zemin.addColorStop(0.18, "#16052f");
    D.zemin.addColorStop(1, "#05010f");
    D.pus1 = c.createLinearGradient(0, ufukY - 130 * s, 0, ufukY);
    D.pus1.addColorStop(0, "rgba(255,70,150,0)");
    D.pus1.addColorStop(1, "rgba(255,70,150,0.34)");
    D.pus2 = c.createLinearGradient(0, ufukY - 70 * s, 0, ufukY);
    D.pus2.addColorStop(0, "rgba(255,80,140,0)");
    D.pus2.addColorStop(1, "rgba(255,80,140,0.2)");
    D.ufukParilti = c.createLinearGradient(0, ufukY, 0, ufukY + 40 * s);
    D.ufukParilti.addColorStop(0, "rgba(255,90,170,0.32)");
    D.ufukParilti.addColorStop(1, "rgba(255,90,170,0)");
    D.izgaraPus = c.createLinearGradient(0, ufukY, 0, ufukY + (Y - ufukY) * 0.42);
    D.izgaraPus.addColorStop(0, "rgba(58,11,78,0.92)");
    D.izgaraPus.addColorStop(0.55, "rgba(40,8,66,0.45)");
    D.izgaraPus.addColorStop(1, "rgba(30,6,60,0)");
    D.yuzey = c.createLinearGradient(0, zeminY - 7 * s, 0, zeminY + 5 * s);
    D.yuzey.addColorStop(0, "#3d1c74");
    D.yuzey.addColorStop(1, "#271052");
    D.cephe = c.createLinearGradient(0, zeminY + 5 * s, 0, zeminY + 24 * s);
    D.cephe.addColorStop(0, "#1d0b40");
    D.cephe.addColorStop(1, "#0c0422");
    D.ayak = c.createLinearGradient(0, zeminY + 24 * s, 0, Y);
    D.ayak.addColorStop(0, "#1a0838");
    D.ayak.addColorStop(1, "rgba(10,3,28,0.2)");
    D.cukur = c.createLinearGradient(0, zeminY, 0, zeminY + 110 * s);
    D.cukur.addColorStop(0, "rgba(255,40,90,0.34)");
    D.cukur.addColorStop(1, "rgba(255,40,90,0)");
    D.vinyet = c.createRadialGradient(G / 2, Y * 0.55, Math.min(G, Y) * 0.32, G / 2, Y * 0.55, Math.max(G, Y) * 0.78);
    D.vinyet.addColorStop(0, "rgba(4,0,14,0)");
    D.vinyet.addColorStop(1, "rgba(4,0,14,0.6)");
    gunesHazirla();
    katmanlar = [
      katmanUret(11, 0.05, 0.5, { min: 50, max: 140, gMin: 26, gMax: 70, bosluk: 0.08, alt: "#250a46", ust: "#3a1066", pencere: 0.05, neon: 0.08, tabela: 0, serit: 0 }),
      katmanUret(23, 0.13, 0.65, { min: 80, max: 190, gMin: 38, gMax: 92, bosluk: 0.28, alt: "#12052a", ust: "#22093f", pencere: 0.16, neon: 0.22, tabela: 0.15, serit: 0.1 }),
      katmanUret(37, 0.26, 0.85, { min: 120, max: 230, gMin: 56, gMax: 120, bosluk: 0.5, alt: "#080116", ust: "#140530", pencere: 0.22, neon: 0.35, tabela: 0.55, serit: 0.4 }),
    ];
    var r = tohumlu(7);
    yildizlar = [];
    for (var i = 0; i < 150; i++) yildizlar.push({ x: r(), y: Math.pow(r(), 1.6), b: 0.5 + r() * 1.3, f: r() * TAU, h: 0.02 + r() * 0.04 });
  }

  function gunesHazirla() {
    var R = Math.min(G * 0.3, 150 * s);
    var pay = R * 0.95;
    var cv = document.createElement("canvas");
    cv.width = cv.height = Math.ceil((R + pay) * 2);
    var g = cv.getContext("2d");
    var m = cv.width / 2;
    var hale = g.createRadialGradient(m, m, R * 0.5, m, m, R + pay);
    hale.addColorStop(0, "rgba(255,96,140,0.5)");
    hale.addColorStop(0.45, "rgba(255,60,150,0.16)");
    hale.addColorStop(1, "rgba(255,60,150,0)");
    g.fillStyle = hale;
    g.fillRect(0, 0, cv.width, cv.height);
    var d = document.createElement("canvas");
    d.width = d.height = Math.ceil(R * 2);
    var dg = d.getContext("2d");
    var lg = dg.createLinearGradient(0, 0, 0, R * 2);
    lg.addColorStop(0, "#fff38a");
    lg.addColorStop(0.42, "#ffa543");
    lg.addColorStop(0.72, "#ff5379");
    lg.addColorStop(1, "#d3238f");
    dg.fillStyle = lg;
    dg.beginPath();
    dg.arc(R, R, R, 0, TAU);
    dg.fill();
    dg.globalCompositeOperation = "destination-out";
    for (var i = 0; i < 8; i++) {
      var t = i / 8;
      dg.fillRect(0, R * (1.0 + t * 0.98), R * 2, R * (0.018 + t * 0.07));
    }
    g.drawImage(d, m - R, m - R);
    D.gunes = { cv: cv, R: R };
  }

  function katmanUret(tohum, par, kalite, o) {
    var r = tohumlu(tohum);
    var tw = 1100;
    var olc = Math.min(s * kalite, 2.4);
    var hMax = o.max + 44;
    var cv = document.createElement("canvas");
    cv.width = Math.ceil(tw * olc);
    cv.height = Math.ceil(hMax * olc);
    var g = cv.getContext("2d");
    g.scale(olc, olc);
    var x = 0;
    while (x < tw - 16) {
      var w = Math.min(o.gMin + r() * (o.gMax - o.gMin), tw - x);
      if (r() < o.bosluk) { x += w * 0.7; continue; }
      var h = o.min + r() * (o.max - o.min);
      bina(g, r, x, hMax - h, w, h, o);
      x += w + (r() < 0.35 ? 2 + r() * 10 : 0);
    }
    return { cv: cv, tw: tw, hMax: hMax, par: par };
  }

  function bina(g, r, x, y, w, h, o) {
    var gr = g.createLinearGradient(0, y, 0, y + h);
    gr.addColorStop(0, o.ust);
    gr.addColorStop(1, o.alt);
    g.fillStyle = gr;
    g.fillRect(x, y, w, h);
    var cati = r();
    if (cati < 0.22) {
      g.fillRect(x + w * 0.18, y - h * 0.07, w * 0.64, h * 0.07 + 1);
      g.fillRect(x + w * 0.36, y - h * 0.12, w * 0.28, h * 0.05 + 1);
    } else if (cati < 0.42) {
      g.fillRect(x + w * 0.5 - 1, y - 30, 2, 30);
      g.fillStyle = "#ff3e6e";
      g.fillRect(x + w * 0.5 - 1.6, y - 32, 3.2, 3.2);
    } else if (cati < 0.52) {
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + w / 2, y - Math.min(30, w * 0.5));
      g.lineTo(x + w, y);
      g.fill();
    }
    if (o.pencere > 0) {
      var renkler = ["rgba(255,184,107,0.85)", "rgba(255,95,175,0.8)", "rgba(110,240,255,0.75)", "rgba(190,150,255,0.7)"];
      var anaRenk = sec(r, renkler);
      for (var yy = y + 9; yy < y + h - 8; yy += 8) {
        var satirAcik = r() < 0.75;
        for (var xx = x + 5; xx < x + w - 6; xx += 6) {
          if (satirAcik && r() < o.pencere) {
            g.fillStyle = r() < 0.75 ? anaRenk : sec(r, renkler);
            g.fillRect(xx, yy, 2.4, 3.2);
          }
        }
      }
    }
    if (r() < o.neon) {
      var nr = r() < 0.5 ? "46,242,255" : "255,62,165";
      g.fillStyle = "rgba(" + nr + ",0.95)";
      g.fillRect(x, y, w, 1.6);
      g.fillStyle = "rgba(" + nr + ",0.25)";
      g.fillRect(x, y - 2, w, 5);
    }
    if (r() < o.serit) {
      g.fillStyle = r() < 0.5 ? "rgba(46,242,255,0.55)" : "rgba(255,62,165,0.55)";
      g.fillRect(x + (r() < 0.5 ? 3 : w - 4.5), y + 10, 1.5, h - 10);
    }
    g.fillStyle = "rgba(255,90,170,0.14)";
    g.fillRect(x, y, 1.4, h);
    if (o.tabela && r() < o.tabela && w > 46 && h > 110) tabela(g, r, x, y, w, h);
  }

  function tabela(g, r, x, y, w, h) {
    var yazi = sec(r, ["OTEL", "ÇAY", "BAR", "SİNEMA", "ARCADE", "RAMEN", "DİSKO", "24 SAAT", "KEBAP", "PLAK"]);
    var renk = sec(r, ["#ff3ea5", "#2ef2ff", "#ffd23f", "#b98cff", "#ff8a3d"]);
    g.save();
    g.font = "12px Audiowide, Sora, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    var dikey = r() < 0.55 && yazi.indexOf(" ") < 0;
    if (dikey) {
      var harfler = Array.from(yazi);
      var sh = harfler.length * 13 + 10, sx = x + (r() < 0.5 ? 8 : w - 28), sy = y + 16;
      g.fillStyle = "rgba(10,2,24,0.9)";
      g.fillRect(sx, sy, 20, sh);
      g.shadowColor = renk;
      g.shadowBlur = 10;
      g.strokeStyle = renk;
      g.lineWidth = 1.4;
      g.strokeRect(sx, sy, 20, sh);
      g.fillStyle = renk;
      harfler.forEach(function (hf, i) { g.fillText(hf, sx + 10, sy + 12 + i * 13); });
    } else {
      var tw = g.measureText(yazi).width + 16, tx = x + w / 2 - tw / 2, ty = y + 18;
      g.fillStyle = "rgba(10,2,24,0.9)";
      g.fillRect(tx, ty, tw, 20);
      g.shadowColor = renk;
      g.shadowBlur = 10;
      g.strokeStyle = renk;
      g.lineWidth = 1.4;
      g.strokeRect(tx, ty, tw, 20);
      g.fillStyle = renk;
      g.fillText(yazi, x + w / 2, ty + 10.5);
    }
    g.restore();
  }

  /* ───────── Oyun durumu ───────── */
  var durum = "giris"; // giris | oyun | duraklat | bitti
  var oyun = null;
  var zaman = 0, sarsinti = 0, flas = 0;
  var parcaciklar = [], yazilar = [];

  function yeniOyun(demo) {
    return {
      demo: demo,
      kamera: 0,
      hiz: demo ? A.hiz : A.hiz,
      mesafe: 0,
      kureSay: 0,
      bonus: 0,
      enerji: 0,
      kalkan: false,
      dokunulmaz: 0,
      seviye: 1,
      engeller: [],
      cukurlar: [],
      kureler: [],
      sonrakiX: gorunurG + 260,
      iz: [],
      bitisSayac: 0,
      o: {
        y: 0, vy: 0, yerde: true, zipSay: 0, coyote: 0, tampon: 0,
        kayiyor: false, kayKalan: 0, kayTut: false, kayBekle: false,
        faz: 0, donus: 0, ez: 0, olu: false, dusuyor: false, neden: "",
      },
    };
  }
  function skorHesap(O) { return Math.floor(O.mesafe / 40) + O.kureSay * 10 + O.bonus; }
  function tepe() { return (A.ziplama * A.ziplama) / (2 * A.yercekimi); }
  function tepeCift() { var v = A.ziplama * 0.86; return tepe() + (v * v) / (2 * A.yercekimi); }

  /* ───────── Desenler (engel ve küre dizilimleri) ───────── */
  function kureYay(O, merkez, genislik, yukseklik, n) {
    for (var i = 0; i < n; i++) {
      var t = n === 1 ? 0.5 : i / (n - 1);
      O.kureler.push({ x: merkez - genislik / 2 + genislik * t, y: -(30 + yukseklik * (1 - Math.pow(2 * t - 1, 2))), f: Math.random() * TAU, alindi: false });
    }
  }
  function kureSira(O, x, y, n, ara) {
    for (var i = 0; i < n; i++) O.kureler.push({ x: x + i * ara, y: y, f: Math.random() * TAU, alindi: false });
  }
  function bariyerEkle(O, x, yuksek) {
    var h = yuksek ? Math.min(rast(92, 108), tepeCift() * 0.72) : Math.min(rast(42, 60), tepe() * 0.6);
    var w = yuksek ? 34 : rast(26, 34);
    O.engeller.push({ tur: "bariyer", yuksek: yuksek, x: x, w: w, h: h, f: Math.random() * TAU });
    return w;
  }
  function droneEkle(O, x) {
    O.engeller.push({ tur: "drone", x: x, w: 58, alt: 37, f: Math.random() * TAU });
    return 58;
  }
  function cukurEkle(O, x, ucus) {
    var w = sinir(rast(86, 136) + O.seviye * 9, 70, Math.max(70, ucus * 0.55));
    O.cukurlar.push({ x0: x, x1: x + w });
    return w;
  }
  var desenler = {
    tekBariyer: function (O, x, ucus) {
      var w = bariyerEkle(O, x, false);
      if (Math.random() < 0.65) kureYay(O, x + w / 2, ucus * 0.8, tepe() * 0.8, 5);
      return w;
    },
    ikiliBariyer: function (O, x, ucus) {
      var w1 = bariyerEkle(O, x, false);
      var ara = Math.min(70, ucus * 0.3);
      var w2 = bariyerEkle(O, x + w1 + ara, false);
      var uz = w1 + ara + w2;
      if (Math.random() < 0.6) kureYay(O, x + uz / 2, ucus * 0.85, tepe() * 0.85, 6);
      return uz;
    },
    kapi: function (O, x, ucus) {
      var w = bariyerEkle(O, x, true);
      if (Math.random() < 0.7) kureYay(O, x + w / 2, ucus * 1.1, tepeCift() * 0.78, 5);
      return w;
    },
    drone: function (O, x) {
      var w = droneEkle(O, x);
      if (Math.random() < 0.7) kureSira(O, x - 20, -14, 4, 32);
      return w;
    },
    cukur: function (O, x, ucus) {
      var w = cukurEkle(O, x, ucus);
      if (Math.random() < 0.6) kureYay(O, x + w / 2, Math.max(w + 40, ucus * 0.7), tepe() * 0.7, 5);
      return w;
    },
    kureSerit: function (O, x) {
      var n = 6;
      for (var i = 0; i < n; i++) O.kureler.push({ x: x + i * 34, y: -(26 + Math.sin(i * 0.9) * 18 + 18), f: i, alindi: false });
      return n * 34;
    },
    droneBariyer: function (O, x, ucus) {
      var w1 = droneEkle(O, x);
      var ara = Math.max(150, O.hiz * 14);
      var w2 = bariyerEkle(O, x + w1 + ara, false);
      kureSira(O, x - 10, -14, 3, 30);
      return w1 + ara + w2;
    },
    cukurBariyer: function (O, x, ucus) {
      var w1 = cukurEkle(O, x, ucus);
      var ara = Math.max(ucus * 0.55, 150);
      var w2 = bariyerEkle(O, x + w1 + ara, false);
      return w1 + ara + w2;
    },
    cukurDrone: function (O, x, ucus) {
      var w1 = cukurEkle(O, x, ucus);
      var ara = Math.max(ucus * 0.6, 170);
      var w2 = droneEkle(O, x + w1 + ara);
      kureSira(O, x + w1 + ara - 10, -14, 3, 30);
      return w1 + ara + w2;
    },
  };
  function desenSec(O) {
    var sv = O.seviye;
    var l = [["tekBariyer", 4], ["drone", 3], ["cukur", 3], ["kureSerit", 1.1]];
    if (sv >= 2) l.push(["kapi", 2], ["ikiliBariyer", 1.6]);
    if (sv >= 3) l.push(["droneBariyer", 1.6], ["cukurBariyer", 1.4]);
    if (sv >= 4) l.push(["cukurDrone", 1.3]);
    var top = l.reduce(function (t, x) { return t + x[1]; }, 0);
    var r = Math.random() * top;
    for (var i = 0; i < l.length; i++) { r -= l[i][1]; if (r <= 0) return l[i][0]; }
    return "tekBariyer";
  }
  function uret(O) {
    var sag = O.kamera + gorunurG + 160;
    var guvenlik = 0;
    while (O.sonrakiX < sag && guvenlik++ < 6) {
      var hava = (2 * A.ziplama) / A.yercekimi;
      var ucus = O.hiz * hava;
      var ad = desenSec(O);
      var uz = desenler[ad](O, O.sonrakiX, ucus);
      var bos = O.hiz * hava * 0.8 + 90 + (120 + Math.random() * 380) / Math.max(0.3, A.engelSikligi);
      O.sonrakiX += uz + bos;
    }
  }

  /* ───────── Oyuncu hareketleri ───────── */
  function merkezX(O) { return O.kamera + oyuncuX; }
  function destekVar(O, a, b) {
    for (var i = 0; i < O.cukurlar.length; i++) {
      var cu = O.cukurlar[i];
      if (a >= cu.x0 && b <= cu.x1) return false;
    }
    return true;
  }
  function zipla(O) {
    var o = O.o;
    if (o.olu || o.dusuyor) return;
    if (o.kayiyor) { o.kayiyor = false; o.kayKalan = 0; }
    o.kayBekle = false;
    if (o.yerde || (o.coyote > 0 && o.zipSay === 0)) {
      o.vy = -A.ziplama;
      o.yerde = false;
      o.coyote = 0;
      o.zipSay = 1;
      for (var i = 0; i < 7; i++) parca(merkezX(O) + rast(-8, 8), -1, rast(-1.6, 0.6), rast(-1.4, -0.3), rast(18, 30), "255,120,220", rast(2, 4), "duman");
      sesCal("zipla");
    } else if (o.zipSay < 2) {
      o.vy = -A.ziplama * 0.86;
      o.zipSay = 2;
      o.donus = 0.001;
      for (var j = 0; j < 16; j++) {
        var a = (j / 16) * TAU;
        parca(merkezX(O) + Math.cos(a) * 10, o.y - 26 + Math.sin(a) * 10, Math.cos(a) * 2.6, Math.sin(a) * 2.6, 22, "46,242,255", 2.6, "isik");
      }
      sesCal("cift");
    } else {
      o.tampon = 9;
    }
  }
  function kayBasla(O, sure) {
    var o = O.o;
    if (o.olu || o.dusuyor) return;
    if (!o.yerde) {
      o.vy = Math.max(o.vy, A.ziplama * 0.95);
      o.kayBekle = true;
      o.kayBekleSure = sure;
      return;
    }
    if (!o.kayiyor) sesCal("kay");
    o.kayiyor = true;
    o.kayKalan = Math.max(o.kayKalan, sure);
  }

  function parca(x, y, vx, vy, omur, rgb, boyut, tur) {
    if (parcaciklar.length > 520) parcaciklar.shift();
    parcaciklar.push({ x: x, y: y, vx: vx, vy: vy, omur: omur, max: omur, rgb: rgb, b: boyut, tur: tur, d: Math.random() * TAU, dh: rast(-0.3, 0.3) });
  }
  function yaziEkle(x, y, metin, rgb) { yazilar.push({ x: x, y: y, metin: metin, rgb: rgb, omur: 46, max: 46 }); }

  function bildir(metin, tur) {
    if (oyun && oyun.demo) return;
    el.bildirim.textContent = metin;
    el.bildirim.className = "bildirim gorunur" + (tur ? " " + tur : "");
    clearTimeout(bildir.z);
    bildir.z = setTimeout(function () { el.bildirim.className = "bildirim" + (tur ? " " + tur : ""); }, 1900);
  }

  function kutu(O) {
    var cx = merkezX(O), o = O.o;
    if (o.kayiyor) return { x0: cx - 26, x1: cx + 18, y0: o.y - 26, y1: o.y };
    return { x0: cx - 11, x1: cx + 11, y0: o.y - 54, y1: o.y };
  }
  function engelKutu(e) {
    if (e.tur === "drone") {
      var b = Math.sin(zaman * 0.08 + e.f) * 3;
      return { x0: e.x + 5, x1: e.x + e.w - 5, y0: -(e.alt + 22 + b), y1: -(e.alt + b) };
    }
    return { x0: e.x + 3, x1: e.x + e.w - 3, y0: -e.h, y1: 0 };
  }
  function cakisir(a, b) { return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0; }

  function engelPatlat(O, e) {
    e.sil = true;
    var rgb = e.tur === "drone" ? "255,46,99" : e.yuksek ? "255,176,46" : "255,62,165";
    var cx = e.x + e.w / 2, cy = e.tur === "drone" ? -(e.alt + 11) : -e.h / 2;
    for (var i = 0; i < 28; i++) parca(cx, cy, rast(-3, 5), rast(-5, 2), rast(24, 44), rgb, rast(2, 4.5), "kivilcim");
  }

  function olum(O, neden, e) {
    var o = O.o;
    if (o.olu) return;
    if (neden === "cukur") {
      if (O.kalkan) {
        O.kalkan = false;
        o.dusuyor = false;
        o.vy = -A.ziplama * 1.2;
        o.zipSay = 1;
        O.dokunulmaz = 40;
        sarsinti = Math.max(sarsinti, 8);
        for (var k = 0; k < 20; k++) parca(merkezX(O), o.y - 20, rast(-3, 3), rast(-6, -1), rast(20, 34), "46,242,255", 3, "isik");
        bildir("Kalkan seni çukurdan fırlattı", "sari");
        sesCal("kir");
        return;
      }
      o.olu = true;
      o.dusuyor = true;
      o.neden = neden;
      sarsinti = Math.max(sarsinti, 6);
      sesCal("dus");
      return;
    }
    if (O.dokunulmaz > 0) return;
    if (O.kalkan) {
      O.kalkan = false;
      O.dokunulmaz = 50;
      engelPatlat(O, e);
      sarsinti = Math.max(sarsinti, 11);
      flas = 0.25;
      for (var j = 0; j < 22; j++) {
        var a = (j / 22) * TAU;
        parca(merkezX(O) + Math.cos(a) * 30, o.y - 28 + Math.sin(a) * 30, Math.cos(a) * 3.2, Math.sin(a) * 3.2, 26, "46,242,255", 3, "isik");
      }
      bildir("Kalkan kırıldı, dikkat", "pembe");
      sesCal("kir");
      return;
    }
    o.olu = true;
    o.neden = neden;
    sarsinti = 22;
    flas = 0.55;
    var cx = merkezX(O), cy = o.y - (o.kayiyor ? 14 : 30);
    var renkler = ["233,236,255", "160,166,214", "46,242,255", "42,37,71"];
    for (var i = 0; i < 22; i++) parca(cx, cy, rast(-2, 7), rast(-8, -1), rast(50, 80), renkler[i % 4], rast(3, 7), "parca");
    for (var m = 0; m < 34; m++) parca(cx, cy, rast(-5, 6), rast(-7, 3), rast(20, 40), m % 2 ? "255,62,165" : "255,210,63", rast(2, 4), "kivilcim");
    sesCal("carp");
  }

  /* ───────── Güncelleme (sabit 60 Hz adım) ───────── */
  function guncelle() {
    zaman++;
    var O = oyun;
    if (durum === "duraklat") return;
    var o = O.o;

    if (o.olu) O.hiz *= o.dusuyor ? 0.84 : 0.9;
    else if (O.demo) O.hiz = A.hiz;
    else O.hiz = Math.min(O.hiz + 0.0016 * A.hizlanma, A.hiz * 2.3);
    O.kamera += O.hiz;
    if (!o.olu) O.mesafe += O.hiz;

    var sv = 1 + Math.floor(O.mesafe / 40 / 250);
    if (sv > O.seviye) {
      O.seviye = sv;
      bildir("Seviye " + sv + ", tempo artıyor");
      sesCal("seviye");
    }
    if (!o.olu) uret(O);
    if (O.demo) otopilot(O);
    oyuncuGuncelle(O);

    if (!o.olu) {
      var k = kutu(O);
      for (var i = 0; i < O.engeller.length; i++) {
        var e = O.engeller[i];
        if (e.sil) continue;
        if (cakisir(k, engelKutu(e))) { olum(O, e.tur === "drone" ? "drone" : e.yuksek ? "kapi" : "bariyer", e); break; }
      }
      var genis = { x0: k.x0 - 10, x1: k.x1 + 10, y0: k.y0 - 10, y1: k.y1 + 6 };
      for (var j = 0; j < O.kureler.length; j++) {
        var q = O.kureler[j];
        if (q.alindi) continue;
        if (q.x > genis.x0 && q.x < genis.x1 && q.y > genis.y0 && q.y < genis.y1) kureAl(O, q);
      }
    }
    if (O.dokunulmaz > 0) O.dokunulmaz--;

    var sol = O.kamera - 160;
    O.engeller = O.engeller.filter(function (e) { return !e.sil && e.x + e.w > sol; });
    O.kureler = O.kureler.filter(function (q) { return !q.alindi && q.x > sol; });
    O.cukurlar = O.cukurlar.filter(function (cu) { return cu.x1 > sol - 200; });

    O.iz.unshift({ x: merkezX(O), y: o.y - (o.kayiyor ? 14 : 30) });
    if (O.iz.length > 18) O.iz.pop();

    if (!o.olu && O.hiz > A.hiz * 1.4 && Math.random() < (O.hiz / A.hiz - 1.3) * 0.4) {
      parca(O.kamera + gorunurG + 40, -rast(40, 200), -O.hiz * rast(0.6, 1.1), 0, 70, "255,255,255", rast(30, 80), "cizgi");
    }
    parcacikGuncelle(O);
    sarsinti *= 0.88;
    if (sarsinti < 0.1) sarsinti = 0;
    flas *= 0.9;

    if (o.olu) {
      O.bitisSayac++;
      if ((o.dusuyor && (o.y > 360 || O.bitisSayac > 70)) || (!o.dusuyor && O.bitisSayac > 58)) {
        if (O.demo) { oyun = yeniOyun(true); oyun.kamera = O.kamera; oyun.sonrakiX = O.kamera + gorunurG + 200; }
        else if (durum === "oyun") oyunBitti();
      }
    }
    hudGuncelle();
  }

  function oyuncuGuncelle(O) {
    var o = O.o;
    if (o.olu && !o.dusuyor) return;
    o.faz += 0.2 + O.hiz * 0.012;
    if (o.ez > 0) o.ez--;
    if (o.donus > 0) { o.donus += TAU / 26; if (o.donus >= TAU) o.donus = 0; }

    if (o.kayiyor) {
      if (!o.kayTut) o.kayKalan--;
      if (o.kayKalan <= 0 && !o.kayTut) o.kayiyor = false;
      if (Math.random() < 0.8) parca(merkezX(O) + 14, -1, rast(-2.5, -0.5), rast(-2.4, -0.6), rast(12, 22), Math.random() < 0.5 ? "255,210,63" : "255,138,61", rast(1.5, 2.6), "kivilcim");
    }

    var oncekiY = o.y;
    o.vy += A.yercekimi * (o.vy > 0 ? 1.08 : 1);
    o.y += o.vy;
    var cx = merkezX(O);
    var dest = destekVar(O, cx - 7, cx + 7);

    if (o.y >= 0 && !o.dusuyor) {
      if (dest && oncekiY <= 16) {
        if (!o.yerde) inis(O);
        o.y = 0;
        o.vy = 0;
        o.yerde = true;
        o.zipSay = 0;
        o.coyote = 7;
        o.donus = 0;
        if (o.kayBekle) { o.kayBekle = false; kayBasla(O, o.kayBekleSure || 36); }
        if (o.tampon > 0) { o.tampon = 0; zipla(O); }
      } else {
        // Ya boşluğun üstündeyiz ya da yüzeyin altında kalıp pistin yan duvarına geldik.
        o.yerde = false;
        o.kayiyor = false;
        if (o.y > 16 || dest) olum(O, "cukur");
      }
    } else if (o.y < 0) {
      o.yerde = false;
    }
    if (!o.yerde && o.coyote > 0) o.coyote--;
    if (o.tampon > 0) o.tampon--;

    if (o.yerde && !o.kayiyor && O.hiz > A.hiz * 1.15 && Math.random() < 0.18) {
      parca(cx - 4, -1, rast(-1.5, 0), rast(-1, -0.2), 14, "46,242,255", 1.6, "isik");
    }
  }

  function inis(O) {
    var o = O.o;
    var guc = Math.min(1, o.vy / 14);
    o.ez = 8;
    for (var i = 0; i < 6 + guc * 8; i++) parca(merkezX(O) + rast(-12, 12), -1, rast(-2.2, 1.4), rast(-1.6, -0.2), rast(16, 28), "255,120,220", rast(2, 4), "duman");
  }

  function kureAl(O, q) {
    q.alindi = true;
    O.kureSay++;
    O.enerji++;
    for (var i = 0; i < 10; i++) parca(q.x, q.y, rast(-2.5, 2.5), rast(-3, 1.5), rast(16, 26), "46,242,255", rast(1.6, 3), "isik");
    yaziEkle(q.x, q.y - 10, "+10", "165,251,255");
    sesCal("kure");
    if (O.enerji >= ENERJI_HEDEF) {
      O.enerji = 0;
      if (!O.kalkan) {
        O.kalkan = true;
        bildir("Kalkan hazır: bir çarpmayı affeder");
        sesCal("kalkan");
      } else {
        O.bonus += 100;
        yaziEkle(q.x, q.y - 30, "+100", "255,210,63");
        bildir("Kalkan zaten açık, +100 puan", "sari");
      }
      el.enerji.classList.remove("parla");
      void el.enerji.offsetWidth;
      el.enerji.classList.add("parla");
    }
  }

  function parcacikGuncelle(O) {
    for (var i = parcaciklar.length - 1; i >= 0; i--) {
      var p = parcaciklar[i];
      p.x += p.vx;
      p.y += p.vy;
      p.omur--;
      if (p.tur === "kivilcim" || p.tur === "parca") p.vy += 0.32;
      else if (p.tur === "duman") { p.vx *= 0.93; p.vy *= 0.93; }
      else if (p.tur === "isik") { p.vx *= 0.95; p.vy *= 0.95; }
      if (p.tur === "parca") {
        p.d += p.dh;
        if (p.y > 0 && p.vy > 0 && destekVar(O, p.x - 1, p.x + 1) && p.y < 12) { p.y = 0; p.vy *= -0.42; p.vx *= 0.7; p.dh *= 0.7; }
      }
      if (p.omur <= 0) parcaciklar.splice(i, 1);
    }
    for (var j = yazilar.length - 1; j >= 0; j--) {
      yazilar[j].y -= 0.7;
      if (--yazilar[j].omur <= 0) yazilar.splice(j, 1);
    }
  }

  /* ───────── Gösteri modu (başlangıç ekranının arkasında robot kendi koşar) ───────── */
  function otopilot(O) {
    var o = O.o;
    if (o.olu) return;
    var cx = merkezX(O), on = cx + 11;
    var hz = O.hiz, tTepe = A.ziplama / A.yercekimi;
    var hedef = null, hd = 1e9;
    O.engeller.forEach(function (e) {
      if (e.sil || e.x + e.w < cx - 28) return;
      var d = e.x - on;
      if (d < hd) { hd = d; hedef = e; }
    });
    O.cukurlar.forEach(function (cu) {
      if (cu.x1 < cx - 8) return;
      var d = cu.x0 - on;
      if (d < hd) { hd = d; hedef = { tur: "cukur", x: cu.x0, w: cu.x1 - cu.x0 }; }
    });
    if (!hedef) { o.kayTut = false; return; }
    if (hedef.tur === "drone") {
      if (hd < hz * 7 + 10 && hd > -hedef.w - 40) { o.kayTut = true; if (!o.kayiyor) kayBasla(O, 10); }
      else o.kayTut = false;
      return;
    }
    o.kayTut = false;
    if (hedef.tur === "cukur") {
      if (o.yerde && hd < hz * 2 + 6) zipla(O);
      return;
    }
    var esik = hz * tTepe * (hedef.yuksek ? 0.62 : 0.85) - hedef.w / 2;
    if (o.yerde && hd < esik && hd > -hedef.w) zipla(O);
    if (hedef.yuksek && !o.yerde && o.zipSay === 1 && o.vy > -A.ziplama * 0.35) zipla(O);
  }

  /* ───────── Çizim ───────── */
  function ciz() {
    var O = oyun;
    var sx = sarsinti ? (Math.random() - 0.5) * sarsinti * s * 0.9 : 0;
    var sy = sarsinti ? (Math.random() - 0.5) * sarsinti * s * 0.9 : 0;

    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = D.gok;
    c.fillRect(0, 0, G, ufukY + 2);
    yildizCiz(O);
    var R = D.gunes.R, gc = D.gunes.cv;
    c.drawImage(gc, G * 0.64 - gc.width / 2, ufukY - R * 0.32 - gc.height / 2);
    katmanCiz(katmanlar[0], O);
    c.fillStyle = D.pus1;
    c.fillRect(0, ufukY - 130 * s, G, 130 * s);
    katmanCiz(katmanlar[1], O);
    c.fillStyle = D.pus2;
    c.fillRect(0, ufukY - 70 * s, G, 70 * s);
    katmanCiz(katmanlar[2], O);

    c.save();
    c.translate(sx, sy);
    izgaraCiz(O);
    pistCiz(O);
    O.kureler.forEach(function (q) { kureCiz(O, q); });
    O.engeller.forEach(function (e) { if (e.tur === "drone") droneCiz(O, e); else bariyerCiz(O, e); });
    robotCiz(O);
    parcacikCiz(O);
    yaziCiz(O);
    c.restore();

    if (flas > 0.01) {
      c.fillStyle = "rgba(255,230,250," + flas.toFixed(3) + ")";
      c.fillRect(0, 0, G, Y);
    }
    c.fillStyle = D.vinyet;
    c.fillRect(0, 0, G, Y);
  }

  function yildizCiz(O) {
    var kay = (O.kamera * 0.012 * s) % G;
    c.fillStyle = "#ffffff";
    for (var i = 0; i < yildizlar.length; i++) {
      var y = yildizlar[i];
      var x = (y.x * G - kay + G) % G;
      c.globalAlpha = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(zaman * y.h + y.f));
      var b = y.b * dpr;
      c.fillRect(x, y.y * ufukY * 0.82, b, b);
    }
    c.globalAlpha = 1;
  }

  function katmanCiz(k, O) {
    var w = k.tw * s, h = k.hMax * s;
    var off = ((O.kamera * k.par * s) % w + w) % w;
    var y = ufukY - h + 1;
    for (var x = -off; x < G; x += w) c.drawImage(k.cv, Math.floor(x), y, Math.ceil(w) + 1, h);
  }

  function izgaraCiz(O) {
    c.fillStyle = D.zemin;
    c.fillRect(0, ufukY, G, Y - ufukY);
    c.save();
    c.beginPath();
    c.rect(0, ufukY, G, Y - ufukY);
    c.clip();
    c.globalCompositeOperation = "lighter";
    var alt = Y - ufukY, vx = G * 0.5;
    c.beginPath();
    for (var i = 0; i < 11; i++) {
      var yy = ufukY + alt / Math.pow(1.42, i);
      c.moveTo(0, yy);
      c.lineTo(G, yy);
    }
    var ara = 74 * s * 1.3;
    var off = (O.kamera * s * 1.3) % ara;
    var n = Math.ceil((G * 4) / ara);
    for (var j = -n; j <= n; j++) {
      var xb = vx + j * ara - off;
      c.moveTo(vx + (xb - vx) * 0.02, ufukY);
      c.lineTo(xb, Y);
    }
    c.strokeStyle = "rgba(255,62,165,0.16)";
    c.lineWidth = Math.max(2, 4 * s);
    c.stroke();
    c.strokeStyle = "rgba(255,110,200,0.5)";
    c.lineWidth = Math.max(1, 1.2 * s);
    c.stroke();
    c.globalCompositeOperation = "source-over";
    c.fillStyle = D.izgaraPus;
    c.fillRect(0, ufukY, G, (Y - ufukY) * 0.42);
    c.fillStyle = D.ufukParilti;
    c.fillRect(0, ufukY, G, 40 * s);
    c.restore();
    c.globalCompositeOperation = "lighter";
    c.fillStyle = "rgba(255,120,200,0.85)";
    c.fillRect(0, ufukY - 1 * s, G, 1.6 * s);
    c.globalCompositeOperation = "source-over";
  }

  function pistCiz(O) {
    var k = O.kamera;
    var bas = k - 80, son = k + gorunurG + 80;
    var parcalar = [], x = bas, bosluklar = [];
    var liste = O.cukurlar.slice().sort(function (a, b) { return a.x0 - b.x0; });
    for (var i = 0; i < liste.length; i++) {
      var cu = liste[i];
      if (cu.x1 < bas || cu.x0 > son) continue;
      bosluklar.push(cu);
      if (cu.x0 > x) parcalar.push([x, cu.x0]);
      x = Math.max(x, cu.x1);
    }
    if (x < son) parcalar.push([x, son]);
    var ust = zeminY - 7 * s, on = zeminY + 5 * s, alt = zeminY + 24 * s;

    var ARA = 230;
    for (var p = Math.ceil(bas / ARA) * ARA; p < son; p += ARA) {
      if (!destekVar(O, p - 12, p + 12)) continue;
      var px = (p - k) * s;
      c.fillStyle = D.ayak;
      c.fillRect(px - 7 * s, alt, 14 * s, Y - alt);
      c.fillStyle = "rgba(255,62,165,0.5)";
      c.fillRect(px - 0.7 * s, alt + 8 * s, 1.4 * s, Y - alt);
    }
    bosluklar.forEach(function (cu) {
      var gx0 = (cu.x0 - k) * s, gx1 = (cu.x1 - k) * s;
      c.fillStyle = D.cukur;
      c.fillRect(gx0, zeminY - 2 * s, gx1 - gx0, 110 * s);
    });
    parcalar.forEach(function (sg) {
      var x0 = (sg[0] - k) * s, x1 = (sg[1] - k) * s, w = x1 - x0;
      c.fillStyle = D.yuzey;
      c.fillRect(x0, ust, w, on - ust);
      c.fillStyle = D.cephe;
      c.fillRect(x0, on, w, alt - on);
    });
    c.globalCompositeOperation = "lighter";
    parcalar.forEach(function (sg) {
      var x0 = (sg[0] - k) * s, x1 = (sg[1] - k) * s, w = x1 - x0;
      c.fillStyle = "rgba(255,62,165,0.55)";
      c.fillRect(x0, ust, w, 1.2 * s);
      c.fillStyle = "rgba(46,242,255,0.2)";
      c.fillRect(x0, on - 3.5 * s, w, 7 * s);
      c.fillStyle = "rgba(170,250,255,0.95)";
      c.fillRect(x0, on - 0.8 * s, w, 1.6 * s);
      c.fillStyle = "rgba(255,62,165,0.6)";
      c.fillRect(x0, alt - 1.4 * s, w, 1.4 * s);
      var DA = 64;
      c.fillStyle = "rgba(255,130,210,0.4)";
      for (var d = Math.ceil(sg[0] / DA) * DA; d < sg[1] - 26; d += DA) c.fillRect((d - k) * s, zeminY - 1.8 * s, 26 * s, 1.6 * s);
      var CA = 46;
      c.fillStyle = "rgba(46,242,255,0.28)";
      for (var e = Math.ceil(sg[0] / CA) * CA; e < sg[1] - 4; e += CA) c.fillRect((e - k) * s, on + 6 * s, 2 * s, 12 * s);
    });
    c.globalCompositeOperation = "source-over";
    bosluklar.forEach(function (cu) {
      [cu.x0, cu.x1].forEach(function (kx, i) {
        var px = (kx - k) * s, w = 5 * s, bx = i === 0 ? px - w : px;
        c.save();
        c.beginPath();
        c.rect(bx, ust, w, alt - ust);
        c.clip();
        c.fillStyle = "#ffd23f";
        c.fillRect(bx, ust, w, alt - ust);
        c.fillStyle = "#1a0b2e";
        for (var z = -2; z < 8; z++) {
          c.beginPath();
          c.moveTo(bx, ust + z * 7 * s);
          c.lineTo(bx + w, ust + z * 7 * s - 4 * s);
          c.lineTo(bx + w, ust + z * 7 * s - 0.5 * s);
          c.lineTo(bx, ust + z * 7 * s + 3.5 * s);
          c.closePath();
          c.fill();
        }
        c.restore();
        var yan = (Math.floor(zaman / 18) + i) % 2 === 0;
        c.globalCompositeOperation = "lighter";
        isik("255,46,99", bx + w / 2, ust - 4 * s, (yan ? 26 : 16) * s, yan ? 0.95 : 0.5);
        c.globalCompositeOperation = "source-over";
        c.fillStyle = yan ? "#ff5a7e" : "#7a2040";
        c.fillRect(bx + w / 2 - 1.6 * s, ust - 5.6 * s, 3.2 * s, 3.2 * s);
      });
    });
  }

  function kureCiz(O, q) {
    var x = (q.x - O.kamera) * s;
    if (x < -40 * s || x > G + 40 * s) return;
    var y = zeminY + (q.y + Math.sin(zaman * 0.09 + q.f) * 2.5) * s;
    var r = 6.4 * s;
    c.globalCompositeOperation = "lighter";
    isik("46,242,255", x, y, 50 * s, 0.6 + Math.sin(zaman * 0.15 + q.f) * 0.1);
    c.globalCompositeOperation = "source-over";
    var g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.08, x, y, r);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.35, "#b8fbff");
    g.addColorStop(0.8, "#2ad3ec");
    g.addColorStop(1, "#1590b8");
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
    c.globalCompositeOperation = "lighter";
    c.strokeStyle = "rgba(170,250,255,0.4)";
    c.lineWidth = 1 * s;
    c.beginPath();
    c.ellipse(x, y, 11.5 * s, 3.4 * s, -0.35, 0, TAU);
    c.stroke();
    var a = zaman * 0.11 + q.f, ex = Math.cos(a) * 11.5 * s, ey = Math.sin(a) * 3.4 * s;
    var cr = Math.cos(-0.35), sr = Math.sin(-0.35);
    if (Math.sin(a) > -0.2) isik("255,255,255", x + ex * cr - ey * sr, y + ex * sr + ey * cr, 7 * s, 0.95);
    c.globalCompositeOperation = "source-over";
  }

  function bariyerCiz(O, e) {
    var x = (e.x - O.kamera) * s;
    if (x < -80 * s || x > G + 40 * s) return;
    var w = e.w, h = e.h, rgb = e.yuksek ? "255,176,46" : "255,62,165";
    var titre = 0.82 + Math.sin(zaman * 0.5 + e.f) * 0.08 + (Math.random() < 0.04 ? -0.3 : 0);
    c.save();
    c.translate(x, zeminY);
    c.scale(s, s);
    c.globalCompositeOperation = "lighter";
    isik(rgb, w / 2, -h / 2, Math.max(w * 2.4, h * 1.6), 0.4);
    c.fillStyle = "rgba(" + rgb + "," + (0.14 * titre).toFixed(3) + ")";
    c.fillRect(4, -h, w - 8, h);
    var n = e.yuksek ? 6 : 3;
    for (var i = 0; i < n; i++) {
      var yy = -h + 6 + (i * (h - 14)) / (n - 1);
      c.fillStyle = "rgba(" + rgb + "," + (0.38 * titre).toFixed(3) + ")";
      c.fillRect(4, yy - 2.6, w - 8, 5.2);
      c.fillStyle = "rgba(255,255,255," + (0.92 * titre).toFixed(3) + ")";
      c.fillRect(4, yy - 0.6, w - 8, 1.2);
    }
    var tar = (zaman * 0.9) % h;
    c.fillStyle = "rgba(" + rgb + ",0.35)";
    c.fillRect(4, -tar - 1, w - 8, 2);
    c.globalCompositeOperation = "source-over";
    c.fillStyle = "#1c1238";
    yuvarlak(c, -1, -h - 4, 6, h + 4, 2);
    c.fill();
    yuvarlak(c, w - 5, -h - 4, 6, h + 4, 2);
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.12)";
    c.fillRect(0, -h - 3, 1.4, h + 2);
    c.fillRect(w - 4, -h - 3, 1.4, h + 2);
    c.fillStyle = "rgb(" + rgb + ")";
    c.fillRect(-1, -h - 6, 6, 3);
    c.fillRect(w - 5, -h - 6, 6, 3);
    c.fillStyle = "#ffd23f";
    c.fillRect(-4, -5, w + 8, 5);
    c.fillStyle = "#1a0b2e";
    for (var z = -4; z < w + 6; z += 7) {
      c.beginPath();
      c.moveTo(z, 0);
      c.lineTo(z + 3.5, -5);
      c.lineTo(z + 6.5, -5);
      c.lineTo(z + 3, 0);
      c.closePath();
      c.fill();
    }
    if (e.yuksek) {
      c.strokeStyle = "rgba(255,230,160,0.9)";
      c.lineWidth = 1.8;
      c.lineCap = "round";
      c.lineJoin = "round";
      for (var ch = 0; ch < 2; ch++) {
        var cy = -h - 16 - ch * 7 - (Math.sin(zaman * 0.12) + 1) * 2;
        c.beginPath();
        c.moveTo(w / 2 - 6, cy + 4);
        c.lineTo(w / 2, cy);
        c.lineTo(w / 2 + 6, cy + 4);
        c.stroke();
      }
    }
    c.restore();
  }

  function droneCiz(O, e) {
    var x = (e.x - O.kamera) * s;
    if (x < -80 * s || x > G + 60 * s) return;
    var bob = Math.sin(zaman * 0.08 + e.f) * 3;
    c.save();
    c.translate(x + (e.w / 2) * s, zeminY - (e.alt + bob + 11) * s);
    c.scale(s, s);
    c.globalCompositeOperation = "lighter";
    isik("255,46,99", -12, 1, 56, 0.45 + Math.sin(zaman * 0.2) * 0.15);
    var tara = c.createLinearGradient(-12, 0, -80, 0);
    tara.addColorStop(0, "rgba(255,46,99,0.26)");
    tara.addColorStop(1, "rgba(255,46,99,0)");
    c.fillStyle = tara;
    var aci = Math.sin(zaman * 0.05 + e.f) * 6;
    c.beginPath();
    c.moveTo(-14, 1);
    c.lineTo(-84, -14 + aci);
    c.lineTo(-84, 16 + aci);
    c.closePath();
    c.fill();
    c.globalCompositeOperation = "source-over";
    c.strokeStyle = "#3a3360";
    c.lineWidth = 3;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-27, -7);
    c.lineTo(27, -7);
    c.stroke();
    c.fillStyle = "#4a4278";
    c.fillRect(-29, -12, 4, 6);
    c.fillRect(25, -12, 4, 6);
    var dn = Math.abs(Math.sin(zaman * 0.9));
    c.fillStyle = "rgba(205,220,255,0.6)";
    c.beginPath();
    c.ellipse(-27, -12.5, 3 + dn * 11, 1.5, 0, 0, TAU);
    c.fill();
    c.beginPath();
    c.ellipse(27, -12.5, 3 + (1 - dn) * 11, 1.5, 0, 0, TAU);
    c.fill();
    c.fillStyle = "#272043";
    yuvarlak(c, -20, -9, 40, 19, 8.5);
    c.fill();
    c.fillStyle = "#3e3568";
    yuvarlak(c, -17, -8, 34, 5.5, 3);
    c.fill();
    c.fillStyle = "#1a1530";
    c.fillRect(-4, 10, 8, 3);
    c.fillStyle = "#0b0620";
    c.beginPath();
    c.arc(-11, 1, 5, 0, TAU);
    c.fill();
    c.globalCompositeOperation = "lighter";
    isik("255,46,99", -11, 1, 18, 0.9);
    c.globalCompositeOperation = "source-over";
    c.fillStyle = "#ff4d7a";
    c.beginPath();
    c.arc(-11, 1, 2.8, 0, TAU);
    c.fill();
    c.fillStyle = "#ffffff";
    c.fillRect(-12.6, -0.8, 1.4, 1.4);
    var yan = Math.floor(zaman / 10 + e.f) % 2 === 0;
    c.fillStyle = yan ? "#2ef2ff" : "#ff3ea5";
    c.fillRect(8, -1, 7, 2.2);
    c.fillRect(8, 3, 4, 2.2);
    c.restore();
  }

  function pozHesapla(o) {
    var P = { govde: 0.16, kalca: 19.5, kafa: 0.02, bacak: [[0, 0.15], [0, 0.15]], kol: [[0, 1.1], [0, 1.1]] };
    if (o.kayiyor) {
      P.govde = -1.15; P.kalca = 10; P.kafa = 0.55;
      P.bacak = [[1.15, 0.5], [1.42, 0.05]];
      P.kol = [[-1.6, 0.25], [1.25, 0.7]];
      return P;
    }
    if (o.dusuyor) {
      P.govde = 0.05; P.kafa = -0.2;
      P.bacak = [[0.4, 0.5], [-0.3, 0.6]];
      P.kol = [[-2.6, 0.2], [2.7, 0.2]];
      return P;
    }
    if (!o.yerde) {
      if (o.vy < 0) {
        P.govde = 0.24;
        P.bacak = [[-0.45, 1.15], [0.95, 1.75]];
        P.kol = [[-2.3, 0.5], [2.45, 0.55]];
      } else {
        P.govde = 0.1;
        P.bacak = [[-0.2, 0.4], [0.55, 0.75]];
        P.kol = [[-1.2, 0.6], [1.5, 0.9]];
      }
      return P;
    }
    var p = o.faz;
    P.govde = 0.2 + Math.sin(p * 2) * 0.03;
    P.kalca = 19.5 - Math.abs(Math.sin(p)) * 1.6;
    P.kafa = Math.sin(p * 2) * 0.03;
    for (var i = 0; i < 2; i++) {
      var q = p + i * Math.PI;
      P.bacak[i] = [0.8 * Math.sin(q), 0.15 + 1.35 * Math.max(0, Math.cos(q))];
      P.kol[1 - i] = [0.95 * Math.sin(q), 1.15 + 0.35 * Math.cos(q)];
    }
    return P;
  }

  function uzuv(x, y, a1, l1, a2, l2, kalin, renk) {
    var kx = x + Math.sin(a1) * l1, ky = y + Math.cos(a1) * l1;
    var ux = kx + Math.sin(a2) * l2, uy = ky + Math.cos(a2) * l2;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.strokeStyle = "#0b0620";
    c.lineWidth = kalin + 2.6;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(kx, ky);
    c.lineTo(ux, uy);
    c.stroke();
    c.strokeStyle = renk;
    c.lineWidth = kalin;
    c.stroke();
    c.fillStyle = "#2a2547";
    c.beginPath();
    c.arc(kx, ky, kalin * 0.3, 0, TAU);
    c.fill();
    return [ux, uy];
  }
  function bacakCiz(hx, hy, b, renk) {
    var a2 = b[0] - b[1];
    var u = uzuv(hx, hy, b[0], 10, a2, 10, 6.5, renk);
    c.save();
    c.translate(u[0], u[1]);
    c.rotate(sinir(-a2 * 0.75, -1.3, 1.1));
    c.fillStyle = "#0b0620";
    yuvarlak(c, -4.4, -3.2, 12.4, 6.2, 2.8);
    c.fill();
    c.fillStyle = "#2a2547";
    yuvarlak(c, -3.4, -2.3, 10.4, 4.4, 2);
    c.fill();
    c.fillStyle = "#2ef2ff";
    c.fillRect(-2.6, 1.3, 8.8, 1.1);
    c.restore();
  }
  function kolCiz(sx, sy, k, renk) {
    var u = uzuv(sx, sy, k[0], 8, k[0] + k[1], 7.5, 5, renk);
    c.fillStyle = "#0b0620";
    c.beginPath();
    c.arc(u[0], u[1], 3.4, 0, TAU);
    c.fill();
    c.fillStyle = "#2a2547";
    c.beginPath();
    c.arc(u[0], u[1], 2.4, 0, TAU);
    c.fill();
  }

  function robotCiz(O) {
    var o = O.o;
    var cx = oyuncuX * s;
    var h = -o.y;

    if (O.iz.length > 2 && !(o.olu && !o.dusuyor)) {
      c.globalCompositeOperation = "lighter";
      c.lineCap = "round";
      for (var i = 1; i < O.iz.length; i++) {
        var a = O.iz[i - 1], b = O.iz[i];
        var t = 1 - i / O.iz.length;
        c.strokeStyle = "rgba(46,242,255," + (0.32 * t * (o.yerde ? 0.6 : 1)).toFixed(3) + ")";
        c.lineWidth = (2 + 9 * t) * s;
        c.beginPath();
        c.moveTo((a.x - O.kamera) * s, zeminY + a.y * s);
        c.lineTo((b.x - O.kamera) * s, zeminY + b.y * s);
        c.stroke();
      }
      c.globalCompositeOperation = "source-over";
    }
    if (o.olu && !o.dusuyor) return;

    if (h > -4 && destekVar(O, merkezX(O) - 7, merkezX(O) + 7)) {
      var sOran = sinir(1 - h / 170, 0.25, 1);
      c.fillStyle = "rgba(4,0,14," + (0.5 * sOran).toFixed(3) + ")";
      c.beginPath();
      c.ellipse(cx, zeminY, 17 * s * sOran, 3.6 * s * sOran, 0, 0, TAU);
      c.fill();
    }

    if (O.dokunulmaz > 0 && Math.floor(zaman / 4) % 2 === 0) c.globalAlpha = 0.45;
    c.save();
    c.translate(cx, zeminY + o.y * s);
    c.scale(s, s);
    if (o.ez > 0 && o.yerde) { var ez = o.ez / 8; c.scale(1 + ez * 0.08, 1 - ez * 0.1); }
    if (o.donus > 0) { c.translate(0, -28); c.rotate(o.donus); c.translate(0, 28); }
    if (o.dusuyor) { c.rotate(Math.min(0.9, O.bitisSayac * 0.02)); }

    c.globalCompositeOperation = "lighter";
    isik("46,242,255", 0, -32, 92, 0.2);
    c.globalCompositeOperation = "source-over";

    var P = pozHesapla(o);
    var kalcaY = -P.kalca;
    bacakCiz(-1, kalcaY, P.bacak[0], "#8d90c8");

    c.save();
    c.translate(0, kalcaY);
    c.rotate(P.govde);
    kolCiz(-1, -16, P.kol[0], "#8d90c8");
    c.restore();

    c.save();
    c.translate(0, kalcaY);
    c.rotate(P.govde);
    // sırt çantası
    c.fillStyle = "#0b0620";
    yuvarlak(c, -15.5, -20.5, 9, 16, 3.5);
    c.fill();
    c.fillStyle = "#2a2547";
    yuvarlak(c, -14.5, -19.5, 7, 14, 2.6);
    c.fill();
    c.fillStyle = "#ff3ea5";
    c.fillRect(-12.6, -11, 3, 3);
    // gövde
    c.fillStyle = "#0b0620";
    yuvarlak(c, -10.4, -23, 20.8, 24, 8);
    c.fill();
    c.fillStyle = "#e7e9fc";
    yuvarlak(c, -9.2, -21.8, 18.4, 21.6, 7);
    c.fill();
    c.fillStyle = "#bfc3ea";
    yuvarlak(c, -9.2, -21.8, 6, 21.6, 4);
    c.fill();
    c.fillStyle = "#2a2547";
    c.fillRect(-9.2, -5, 18.4, 3);
    c.globalCompositeOperation = "lighter";
    isik("46,242,255", 3.4, -13.5, 16, 0.9);
    c.globalCompositeOperation = "source-over";
    c.fillStyle = "#c8fbff";
    c.beginPath();
    c.arc(3.4, -13.5, 2.5, 0, TAU);
    c.fill();
    // kafa
    c.translate(1, -21);
    c.rotate(P.kafa);
    c.fillStyle = "#2a2547";
    c.fillRect(-2.6, -3.5, 5.2, 4.5);
    c.strokeStyle = "#0b0620";
    c.lineWidth = 3;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-3, -21);
    c.lineTo(-7, -29);
    c.stroke();
    c.strokeStyle = "#a9acd8";
    c.lineWidth = 1.4;
    c.stroke();
    c.globalCompositeOperation = "lighter";
    isik("255,62,165", -7.2, -30, 16, 0.9 + Math.sin(zaman * 0.15) * 0.1);
    c.globalCompositeOperation = "source-over";
    c.fillStyle = "#ff6fbf";
    c.beginPath();
    c.arc(-7.2, -30, 2.3, 0, TAU);
    c.fill();
    c.fillStyle = "#0b0620";
    yuvarlak(c, -11.4, -22.4, 25.8, 21.8, 8.4);
    c.fill();
    c.fillStyle = "#eef0ff";
    yuvarlak(c, -10.2, -21.2, 23.4, 19.4, 7.4);
    c.fill();
    c.fillStyle = "#c5c9ee";
    yuvarlak(c, -10.2, -8, 23.4, 6.2, 3.2);
    c.fill();
    c.fillStyle = "#ffffff";
    yuvarlak(c, -6, -19.6, 12, 2.4, 1.2);
    c.fill();
    c.fillStyle = "#0b0620";
    yuvarlak(c, 1.2, -16.6, 13.2, 9, 4.5);
    c.fill();
    c.globalCompositeOperation = "lighter";
    isik("46,242,255", 8.5, -12, 26, 0.75);
    c.globalCompositeOperation = "source-over";
    c.fillStyle = "#2ef2ff";
    yuvarlak(c, 3.4, -14.2, 9.6, 3.6, 1.8);
    c.fill();
    c.fillStyle = "#d8fdff";
    c.fillRect(4.8, -13.4, 3.4, 1.2);
    c.fillStyle = "#2a2547";
    c.beginPath();
    c.arc(-4.4, -11, 3.4, 0, TAU);
    c.fill();
    c.fillStyle = "#ff3ea5";
    c.beginPath();
    c.arc(-4.4, -11, 1.4, 0, TAU);
    c.fill();
    c.restore();

    bacakCiz(1, kalcaY, P.bacak[1], "#eef0ff");
    c.save();
    c.translate(0, kalcaY);
    c.rotate(P.govde);
    kolCiz(1, -16, P.kol[1], "#f4f5ff");
    c.restore();

    if (O.kalkan) {
      var nb = 1 + Math.sin(zaman * 0.12) * 0.04;
      var my = o.kayiyor ? -16 : -30;
      c.globalCompositeOperation = "lighter";
      var kg = c.createRadialGradient(0, my, 18, 0, my, 44 * nb);
      kg.addColorStop(0, "rgba(46,242,255,0)");
      kg.addColorStop(0.75, "rgba(46,242,255,0.12)");
      kg.addColorStop(1, "rgba(46,242,255,0.38)");
      c.fillStyle = kg;
      c.beginPath();
      c.arc(0, my, 44 * nb, 0, TAU);
      c.fill();
      c.strokeStyle = "rgba(170,250,255,0.75)";
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(0, my, 44 * nb, zaman * 0.05, zaman * 0.05 + 1.6);
      c.stroke();
      c.beginPath();
      c.arc(0, my, 44 * nb, zaman * 0.05 + Math.PI, zaman * 0.05 + Math.PI + 1.2);
      c.stroke();
      c.globalCompositeOperation = "source-over";
    }
    c.restore();
    c.globalAlpha = 1;
  }

  function parcacikCiz(O) {
    for (var i = 0; i < parcaciklar.length; i++) {
      var p = parcaciklar[i];
      var x = (p.x - O.kamera) * s, y = zeminY + p.y * s;
      if (x < -140 * s || x > G + 140 * s) continue;
      var t = p.omur / p.max;
      if (p.tur === "parca") {
        c.save();
        c.translate(x, y);
        c.rotate(p.d);
        c.globalAlpha = Math.min(1, t * 2);
        c.fillStyle = "rgb(" + p.rgb + ")";
        c.fillRect((-p.b / 2) * s, (-p.b / 3) * s, p.b * s, (p.b / 1.5) * s);
        c.restore();
        continue;
      }
      c.globalCompositeOperation = "lighter";
      if (p.tur === "cizgi") {
        var cg = c.createLinearGradient(x, 0, x + p.b * s, 0);
        cg.addColorStop(0, "rgba(" + p.rgb + "," + (0.2 * Math.min(1, t * 3)).toFixed(3) + ")");
        cg.addColorStop(1, "rgba(" + p.rgb + ",0)");
        c.fillStyle = cg;
        c.fillRect(x, y, p.b * s, 1.1 * s);
      } else if (p.tur === "duman") {
        c.fillStyle = "rgba(" + p.rgb + "," + (0.38 * t).toFixed(3) + ")";
        c.beginPath();
        c.arc(x, y, p.b * s * (1.6 - t * 0.6), 0, TAU);
        c.fill();
      } else {
        c.fillStyle = "rgba(" + p.rgb + "," + Math.min(1, t * 1.6).toFixed(3) + ")";
        var b = p.b * s * (0.5 + t * 0.5);
        c.fillRect(x - b / 2, y - b / 2, b, b);
      }
      c.globalCompositeOperation = "source-over";
    }
    c.globalAlpha = 1;
  }

  function yaziCiz(O) {
    if (!yazilar.length) return;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = "700 " + Math.round(15 * s) + "px Sora, system-ui, sans-serif";
    for (var i = 0; i < yazilar.length; i++) {
      var y = yazilar[i];
      var t = y.omur / y.max;
      c.fillStyle = "rgba(" + y.rgb + "," + Math.min(1, t * 2).toFixed(3) + ")";
      c.fillText(y.metin, (y.x - O.kamera) * s, zeminY + y.y * s);
    }
  }

  /* ───────── Gösterge ───────── */
  var once = {};
  function hudGuncelle() {
    var O = oyun;
    if (O.demo) return;
    var skor = skorHesap(O), m = Math.floor(O.mesafe / 40);
    if (once.skor !== skor) { once.skor = skor; el.skor.textContent = bicim.format(skor); }
    if (once.m !== m) { once.m = m; el.mesafe.textContent = bicim.format(m) + " m"; }
    if (once.sv !== O.seviye) { once.sv = O.seviye; el.seviye.textContent = "Seviye " + O.seviye; }
    var anahtar = O.enerji + (O.kalkan ? "k" : "");
    if (once.en !== anahtar) {
      once.en = anahtar;
      el.hucreler.forEach(function (h, i) { h.classList.toggle("dolu", i < O.enerji); });
      el.enerji.classList.toggle("kalkanli", O.kalkan);
      el.enerji.setAttribute("aria-label", "Enerji: " + O.enerji + " / " + ENERJI_HEDEF + (O.kalkan ? ", kalkan açık" : ""));
    }
  }
  function hudSifirla() { once = {}; hudGuncelle(); }

  /* ───────── Akış ───────── */
  function perdeGoster(p) {
    [el.perdeGiris, el.perdeDur, el.perdeSon].forEach(function (x) {
      if (x === p) {
        x.hidden = false;
        requestAnimationFrame(function () { x.classList.add("gorunur"); });
      } else {
        x.classList.remove("gorunur");
        x.hidden = true;
      }
    });
    var odak = p && p.querySelector(".ana");
    if (odak) setTimeout(function () { try { odak.focus({ preventScroll: true }); } catch (e) {} }, 60);
  }

  function basla() {
    sesBaslat();
    oyun = yeniOyun(false);
    parcaciklar = [];
    yazilar = [];
    sarsinti = 0;
    flas = 0;
    durum = "oyun";
    document.body.classList.remove("giris");
    perdeGoster(null);
    hudSifirla();
    odakBirak();
  }
  function odakBirak() {
    var a = document.activeElement;
    if (a && a !== document.body && a.blur) a.blur();
  }
  function duraklat() {
    if (durum !== "oyun" || oyun.o.olu) return;
    durum = "duraklat";
    el.durMetin.textContent = "Şu ana kadar " + bicim.format(skorHesap(oyun)) + " puan ve " + bicim.format(Math.floor(oyun.mesafe / 40)) + " metre. Hazır olduğunda kaldığın yerden devam et.";
    perdeGoster(el.perdeDur);
  }
  function devam() {
    if (durum !== "duraklat") return;
    durum = "oyun";
    perdeGoster(null);
    birikim = 0;
    odakBirak();
  }
  function anaEkran() {
    durum = "giris";
    oyun = yeniOyun(true);
    parcaciklar = [];
    yazilar = [];
    document.body.classList.add("giris");
    perdeGoster(el.perdeGiris);
  }
  var nedenler = { bariyer: "Bariyere takıldın", kapi: "Enerji kapısına çarptın", drone: "Bir drona çarptın", cukur: "Çukura düştün" };
  function oyunBitti() {
    var O = oyun;
    durum = "bitti";
    bitisAni = performance.now();
    var skor = skorHesap(O), onceki = enIyi, rekor = skor > enIyi;
    if (rekor) {
      enIyi = skor;
      try { localStorage.setItem(KAYIT, String(skor)); } catch (e) {}
      enIyiYaz();
    }
    el.sonNeden.lastChild.textContent = nedenler[O.o.neden] || "Koşu bitti";
    el.sonBaslik.innerHTML = rekor ? "Yeni <span>rekor</span>" : "Koşu bitti";
    el.rekorYazi.hidden = !rekor;
    el.rekorMetin.textContent = onceki > 0 ? "Önceki en iyi skorun " + bicim.format(onceki) + " idi" : "İlk rekorun kaydedildi";
    el.sonSkor.textContent = bicim.format(skor);
    el.sonMesafe.textContent = bicim.format(Math.floor(O.mesafe / 40)) + " m";
    el.sonKure.textContent = bicim.format(O.kureSay);
    el.sonEnIyi.textContent = bicim.format(enIyi);
    perdeGoster(el.perdeSon);
  }

  /* ───────── Girdi ───────── */
  var bitisAni = 0;
  window.addEventListener("keydown", function (e) {
    var k = e.code;
    var zipTus = k === "Space" || k === "ArrowUp" || k === "KeyW";
    var kayTus = k === "ArrowDown" || k === "KeyS";
    var odakDugme = document.activeElement && document.activeElement.tagName === "BUTTON";
    if (durum === "giris" || durum === "bitti") {
      if (k === "Enter" && odakDugme) return;
      if ((zipTus || k === "Enter") && !e.repeat) {
        e.preventDefault();
        if (durum === "bitti" && performance.now() - bitisAni < 500) return;
        basla();
      }
      return;
    }
    if (k === "KeyP" || k === "Escape") {
      e.preventDefault();
      if (durum === "oyun") duraklat(); else if (durum === "duraklat") devam();
      return;
    }
    if (durum !== "oyun") return;
    if (zipTus || kayTus) e.preventDefault();
    if (zipTus && !e.repeat) zipla(oyun);
    if (kayTus) { oyun.o.kayTut = true; if (!e.repeat) kayBasla(oyun, 24); }
  });
  window.addEventListener("keyup", function (e) {
    if ((e.code === "ArrowDown" || e.code === "KeyS") && oyun) oyun.o.kayTut = false;
  });

  var dokun = null;
  tuval.addEventListener("pointerdown", function (e) {
    if (durum !== "oyun") return;
    e.preventDefault();
    dokun = { id: e.pointerId, x: e.clientX, y: e.clientY, kaydi: false };
    zipla(oyun);
  });
  tuval.addEventListener("pointermove", function (e) {
    if (!dokun || dokun.id !== e.pointerId || dokun.kaydi || durum !== "oyun") return;
    var dy = e.clientY - dokun.y, dx = e.clientX - dokun.x;
    if (dy > 26 && dy > Math.abs(dx)) {
      dokun.kaydi = true;
      var o = oyun.o;
      if (!o.yerde && o.zipSay === 1 && o.vy < 0 && o.y > -30) { o.vy = A.ziplama; }
      kayBasla(oyun, 40);
    }
  });
  function dokunBitti(e) { if (dokun && dokun.id === e.pointerId) dokun = null; }
  tuval.addEventListener("pointerup", dokunBitti);
  tuval.addEventListener("pointercancel", dokunBitti);
  tuval.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  $("baslaDugme").addEventListener("click", basla);
  $("tekrarDugme").addEventListener("click", basla);
  $("anaEkranDugme").addEventListener("click", anaEkran);
  $("devamDugme").addEventListener("click", devam);
  $("bastanDugme").addEventListener("click", basla);
  el.durDugme.addEventListener("click", function () { el.durDugme.blur(); if (durum === "oyun") duraklat(); else if (durum === "duraklat") devam(); });
  el.sesDugme.addEventListener("click", function () {
    ses.acik = !ses.acik;
    try { localStorage.setItem("neon-kosu-ses", ses.acik ? "acik" : "kapali"); } catch (e) {}
    if (ses.acik) sesBaslat();
    sesDugmeYaz();
    el.sesDugme.blur();
  });
  document.addEventListener("visibilitychange", function () { if (document.hidden) duraklat(); });
  window.addEventListener("blur", function () { duraklat(); });

  var yenidenBoyut;
  window.addEventListener("resize", function () {
    clearTimeout(yenidenBoyut);
    yenidenBoyut = setTimeout(boyutla, 120);
  });

  /* ───────── Döngü ───────── */
  var son = performance.now(), birikim = 0;
  function dongu(t) {
    var dt = Math.min(100, t - son);
    son = t;
    birikim += dt;
    var adim = 0;
    while (birikim >= TIK && adim < 5) { guncelle(); birikim -= TIK; adim++; }
    if (adim === 5) birikim = 0;
    ciz();
    requestAnimationFrame(dongu);
  }

  boyutla();
  oyun = yeniOyun(true);
  if (document.fonts && document.fonts.load) {
    document.fonts.load("16px Audiowide").then(function () { sahneHazirla(); }).catch(function () {});
  }
  requestAnimationFrame(dongu);
})();
`,
    "ikon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="z" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0a5c"/><stop offset="1" stop-color="#0b0324"/></linearGradient>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff27a"/><stop offset=".55" stop-color="#ff8a3d"/><stop offset="1" stop-color="#ff2e88"/></linearGradient>
    <clipPath id="k"><rect x="0" y="0" width="64" height="38"/></clipPath>
    <clipPath id="c"><rect width="64" height="64" rx="17"/></clipPath>
  </defs>
  <rect width="64" height="64" rx="17" fill="url(#z)"/>
  <g clip-path="url(#k)">
    <circle cx="32" cy="37" r="17" fill="url(#g)"/>
    <rect x="12" y="28.5" width="40" height="1.6" fill="#1a0640"/>
    <rect x="12" y="32.4" width="40" height="2.4" fill="#1a0640"/>
  </g>
  <g clip-path="url(#c)" stroke="#ff3ea5" stroke-width="1.4" opacity=".75">
    <path d="M32 40 16 64M32 40l16 24M32 40v24M32 40 2 56M32 40l30 16M8 46h48M2 54h60"/>
  </g>
  <path d="M7 38.5h50" stroke="#2ef2ff" stroke-width="2.6" stroke-linecap="round"/>
</svg>
`,
  },
};
