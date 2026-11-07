/* Şablon: Odak — pomodoro ve odak uygulaması: SVG halka sayaç, odak/kısa mola/uzun mola, görev listesi, günlük ve haftalık istatistik, ses ve bildirim tercihi, koyu/açık tema, klavye kısayolları. Veriler localStorage'da. */

export const ODAK_ZAMANLAYICI = {
  id: "odak",
  ad: "Odak",
  tur: "uygulama" as const,
  aciklama: "Halka sayaçlı pomodoro, görev listesi, seri ve haftalık odak istatistiği",
  kapak: "/gercek/build/sablon/odak.webp",
  dosyalar: {
    "index.html": `<!doctype html>
<html lang="tr" data-tema="koyu" data-mod="odak">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0c0d10" />
  <meta name="description" content="Odak: sakin bir pomodoro zamanlayıcısı, görev listesi ve odak istatistikleri." />
  <title>Odak</title>
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@200;300;400;500;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <div class="ortam" aria-hidden="true"><span class="leke l1"></span><span class="leke l2"></span><span class="doku"></span></div>

  <header class="ust">
    <div class="marka">
      <svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="markaRenk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="d1" /><stop offset="1" class="d2" /></linearGradient></defs><circle cx="16" cy="16" r="11.5" fill="none" stroke="currentColor" stroke-opacity=".16" stroke-width="3.4" /><path d="M16 4.5a11.5 11.5 0 1 1-10.9 7.9" fill="none" stroke="url(#markaRenk)" stroke-width="3.4" stroke-linecap="round" /><circle cx="16" cy="16" r="3.3" fill="url(#markaRenk)" /></svg>
      <span>Odak</span>
    </div>

    <div class="segment" id="modSecici" role="tablist" aria-label="Zamanlayıcı türü">
      <span class="segment-kayar" aria-hidden="true"></span>
      <button role="tab" data-mod="odak" aria-selected="true">Odak</button>
      <button role="tab" data-mod="kisa" aria-selected="false">Kısa mola</button>
      <button role="tab" data-mod="uzun" aria-selected="false">Uzun mola</button>
    </div>

    <div class="ust-sag">
      <button class="ikon-dugme" id="sadeDugme" title="Sade görünüm (F)" aria-label="Sade görünüm"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg></button>
      <button class="ikon-dugme" id="temaDugme" title="Temayı değiştir (T)" aria-label="Temayı değiştir"><svg class="ay" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.6A8 8 0 0 1 9.4 4 8 8 0 1 0 20 14.6z" /></svg><svg class="gunes" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></svg></button>
      <button class="ikon-dugme" id="kisayolDugme" title="Klavye kısayolları (?)" aria-label="Klavye kısayolları"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="3" /><path d="M6.5 10h1M10 10h1M13.5 10h1M17 10h.5M7 14h10" /></svg></button>
      <button class="ikon-dugme" id="ayarDugme" title="Ayarlar (,)" aria-label="Ayarlar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h9M18 7h2M4 17h3M12 17h8" /><circle cx="15.5" cy="7" r="2.5" /><circle cx="9.5" cy="17" r="2.5" /></svg></button>
    </div>
  </header>

  <main class="duzen">
    <section class="sahne" aria-label="Zamanlayıcı">
      <div class="halka-kap">
        <svg class="halka" viewBox="0 0 420 420" aria-hidden="true">
          <defs>
            <linearGradient id="halkaRenk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="d1" /><stop offset="1" class="d2" /></linearGradient>
            <radialGradient id="icDisk" cx="50%" cy="38%" r="62%"><stop offset="0" class="disk1" /><stop offset="1" class="disk2" /></radialGradient>
            <filter id="parilti" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" /></filter>
          </defs>
          <circle class="disk" cx="210" cy="210" r="164" fill="url(#icDisk)" />
          <g id="tikler" class="tikler"></g>
          <circle class="iz" cx="210" cy="210" r="180" />
          <circle class="ilerleme" id="ilerleme" cx="210" cy="210" r="180" transform="rotate(-90 210 210)" stroke="url(#halkaRenk)" />
          <circle class="uc-hale" id="ucHale" cx="210" cy="30" r="14" filter="url(#parilti)" />
          <circle class="uc" id="uc" cx="210" cy="30" r="7.5" />
        </svg>
        <div class="halka-ic">
          <div class="mod-etiket" id="modEtiket">Odak zamanı</div>
          <div class="sure" id="sure" role="timer" aria-live="off">25:00</div>
          <div class="bitis" id="bitis">25 dakikalık odak</div>
        </div>
      </div>

      <div class="kontroller">
        <button class="yuvarlak ikincil" id="sifirla" title="Sıfırla (R)" aria-label="Sıfırla"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4.5 4.5v4h4" /></svg></button>
        <button class="yuvarlak ana" id="baslat" title="Başlat ya da duraklat (Boşluk)" aria-label="Başlat">
          <svg class="oynat" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 5.2v13.6a1 1 0 0 0 1.5.9l10.6-6.8a1 1 0 0 0 0-1.7L9.7 4.4a1 1 0 0 0-1.5.8z" /></svg>
          <svg class="durdur" viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.4" /><rect x="13.5" y="5" width="4" height="14" rx="1.4" /></svg>
        </button>
        <button class="yuvarlak ikincil" id="atla" title="Sonrakine geç (S)" aria-label="Sonrakine geç"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6.2v11.6l8.6-5.8z" /><path d="M18 5.5v13" /></svg></button>
      </div>

      <div class="dongu" id="dongu"></div>

      <button class="simdiki" id="simdiki" type="button">
        <span class="simdiki-nokta" aria-hidden="true"></span>
        <span class="simdiki-metin"><small id="simdikiUst">Şimdi odaklanılan</small><b id="simdikiAd">Görev seç</b></span>
        <span class="pomlar" id="simdikiPom"></span>
      </button>
    </section>

    <aside class="yan">
      <section class="kart gorevler" aria-labelledby="gorevBaslik">
        <header class="kart-ust">
          <h2 id="gorevBaslik">Görevler</h2>
          <span class="hap" id="kalanHap">0 kaldı</span>
          <button class="metin-dugme" id="temizle" type="button">Bitenleri temizle</button>
        </header>
        <ul class="gorev-liste" id="gorevListe"></ul>
        <form class="gorev-ekle" id="gorevForm" autocomplete="off">
          <label class="gizli" for="gorevAd">Yeni görev</label>
          <input id="gorevAd" maxlength="80" placeholder="Yeni görev ekle" />
          <div class="tahmin" aria-label="Tahmini seans sayısı">
            <button type="button" data-d="-1" aria-label="Bir seans azalt"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" /></svg></button>
            <span id="tahmin" title="Tahmini seans">2</span>
            <button type="button" data-d="1" aria-label="Bir seans artır"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12M6 12h12" /></svg></button>
          </div>
          <button class="ekle" type="submit" aria-label="Görevi ekle"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5.5v13M5.5 12h13" /></svg></button>
        </form>
        <p class="gorev-ozet" id="gorevOzet"></p>
      </section>

      <section class="kart istatistik" aria-labelledby="istBaslik">
        <header class="kart-ust">
          <h2 id="istBaslik">İstatistik</h2>
          <div class="mini-segment" role="group" aria-label="Grafik aralığı">
            <button type="button" data-aralik="hafta" aria-pressed="true">Son 7 gün</button>
            <button type="button" data-aralik="gun" aria-pressed="false">Bugün</button>
          </div>
        </header>
        <dl class="sayilar">
          <div><dt>Bugün</dt><dd id="sBugun">0 dk</dd></div>
          <div><dt>Seans</dt><dd id="sSeans">0</dd></div>
          <div><dt>Seri</dt><dd id="sSeri">0 gün</dd></div>
        </dl>
        <div class="hedef">
          <div class="hedef-cubuk"><span id="hedefDolu"></span></div>
          <small id="hedefMetin">Günlük hedef</small>
        </div>
        <div class="grafik-kap" id="grafikKap">
          <svg id="grafik" role="img" aria-labelledby="grafikAd"><title id="grafikAd">Odak süresi grafiği</title></svg>
          <div class="ipucu" id="ipucu" role="status"></div>
        </div>
        <div class="grafik-alt" id="grafikAlt"></div>
        <div class="gizli"><table id="grafikTablo"></table></div>
      </section>
    </aside>
  </main>

  <dialog id="ayarlar" class="pencere" aria-labelledby="ayarBaslik">
    <form method="dialog" class="pencere-ic">
      <header class="pencere-ust"><h2 id="ayarBaslik">Ayarlar</h2><button class="ikon-dugme kucuk" value="kapat" aria-label="Kapat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></svg></button></header>

      <h3 class="grup-baslik">Süreler</h3>
      <div class="grup">
        <div class="satir"><div class="satir-metin"><b>Odak</b><small>Tek seansın uzunluğu</small></div><div class="adimci" data-ayar="odak" data-min="5" data-max="90" data-adim="5"></div></div>
        <div class="satir"><div class="satir-metin"><b>Kısa mola</b><small>Her odaktan sonra</small></div><div class="adimci" data-ayar="kisa" data-min="1" data-max="30" data-adim="1"></div></div>
        <div class="satir"><div class="satir-metin"><b>Uzun mola</b><small>Döngü tamamlanınca</small></div><div class="adimci" data-ayar="uzun" data-min="5" data-max="45" data-adim="5"></div></div>
        <div class="satir"><div class="satir-metin"><b>Uzun mola aralığı</b><small>Kaç odak seansında bir</small></div><div class="adimci" data-ayar="aralik" data-min="2" data-max="8" data-adim="1"></div></div>
        <div class="satir"><div class="satir-metin"><b>Günlük hedef</b><small>İstatistikteki hedef çizgisi</small></div><div class="adimci" data-ayar="hedef" data-min="30" data-max="480" data-adim="15"></div></div>
      </div>

      <h3 class="grup-baslik">Akış</h3>
      <div class="grup">
        <label class="satir"><span class="satir-metin"><b>Molaları kendiliğinden başlat</b><small>Odak bitince mola sayacı hemen işler</small></span><input type="checkbox" class="anahtar" role="switch" data-ayar="otoMola" /></label>
        <label class="satir"><span class="satir-metin"><b>Odağı kendiliğinden başlat</b><small>Mola bitince yeni seans hemen başlar</small></span><input type="checkbox" class="anahtar" role="switch" data-ayar="otoOdak" /></label>
      </div>

      <h3 class="grup-baslik">Ses</h3>
      <div class="grup">
        <div class="satir dikey-mobil"><div class="satir-metin"><b>Bitiş sesi</b><small>Seans bittiğinde çalar</small></div><div class="secenekler" data-ayar="ses"><button type="button" data-deger="kase">Kase</button><button type="button" data-deger="zil">Zil</button><button type="button" data-deger="ahsap">Ahşap</button><button type="button" data-deger="kapali">Kapalı</button></div></div>
        <div class="satir"><div class="satir-metin"><b>Ses düzeyi</b><small id="duzeyMetin">Yüzde 70</small></div><div class="duzey"><input type="range" min="0" max="100" step="5" data-ayar="duzey" aria-label="Ses düzeyi" /><button type="button" class="kucuk-dugme" id="dinle">Dinle</button></div></div>
        <div class="satir dikey-mobil"><div class="satir-metin"><b>Arka plan sesi</b><small>Yalnız odak sırasında çalar</small></div><div class="secenekler" data-ayar="arka"><button type="button" data-deger="kapali">Kapalı</button><button type="button" data-deger="yagmur">Yağmur</button><button type="button" data-deger="beyaz">Beyaz gürültü</button></div></div>
      </div>

      <h3 class="grup-baslik">Bildirim</h3>
      <div class="grup">
        <label class="satir"><span class="satir-metin"><b>Masaüstü bildirimi</b><small id="bildirimNot">Seans bitince sekme kapalıyken de haber verir</small></span><input type="checkbox" class="anahtar" role="switch" id="bildirimAnahtar" /></label>
      </div>

      <h3 class="grup-baslik">Görünüm</h3>
      <div class="grup">
        <div class="satir"><div class="satir-metin"><b>Tema</b><small>Sistem seçeneği cihaz ayarını izler</small></div><div class="secenekler" data-ayar="tema"><button type="button" data-deger="koyu">Koyu</button><button type="button" data-deger="acik">Açık</button><button type="button" data-deger="sistem">Sistem</button></div></div>
      </div>

      <h3 class="grup-baslik">Veriler</h3>
      <div class="grup">
        <div class="satir"><div class="satir-metin"><b>Örnek veriler</b><small>Görevleri ve geçmişi örnekle yeniden doldurur</small></div><button type="button" class="kucuk-dugme" id="ornekYukle">Geri yükle</button></div>
        <div class="satir"><div class="satir-metin"><b>Her şeyi sil</b><small>Görevler, geçmiş ve ayarlar bu cihazdan silinir</small></div><button type="button" class="kucuk-dugme tehlike" id="hepsiniSil">Sil</button></div>
      </div>
      <p class="pencere-not">Veriler yalnız bu tarayıcıda saklanır.</p>
    </form>
  </dialog>

  <dialog id="kisayollar" class="pencere dar" aria-labelledby="kisayolBaslik">
    <form method="dialog" class="pencere-ic">
      <header class="pencere-ust"><h2 id="kisayolBaslik">Klavye kısayolları</h2><button class="ikon-dugme kucuk" value="kapat" aria-label="Kapat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></svg></button></header>
      <ul class="kisayol-liste">
        <li><span>Başlat ya da duraklat</span><kbd>Boşluk</kbd></li>
        <li><span>Sıfırla</span><kbd>R</kbd></li>
        <li><span>Sonrakine geç</span><kbd>S</kbd></li>
        <li><span>Odak, kısa mola, uzun mola</span><span class="tuslar"><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd></span></li>
        <li><span>Yeni görev yaz</span><kbd>N</kbd></li>
        <li><span>Sade görünüm</span><kbd>F</kbd></li>
        <li><span>Temayı değiştir</span><kbd>T</kbd></li>
        <li><span>Ayarlar</span><kbd>,</kbd></li>
        <li><span>Bu liste</span><kbd>?</kbd></li>
      </ul>
    </form>
  </dialog>

  <div class="bildirim" id="bildirim" role="status" aria-live="polite"><span class="bildirim-nokta" aria-hidden="true"></span><span id="bildirimMetin"></span></div>

  <script src="app.js"></script>
</body>
</html>
`,
    "stil.css": `/* Odak — sakin, cam yüzeyli arayüz. Renkler moda göre (odak, kısa mola, uzun mola) yumuşakça değişir. */
@property --v1 { syntax: "<color>"; inherits: true; initial-value: #ff7a59; }
@property --v2 { syntax: "<color>"; inherits: true; initial-value: #ffb98a; }

:root {
  color-scheme: dark;
  --zemin: #0c0d10;
  --yuzey: rgba(255, 255, 255, .035);
  --yuzey-2: rgba(255, 255, 255, .07);
  --yuzey-3: rgba(255, 255, 255, .11);
  --kenar: rgba(255, 255, 255, .075);
  --kenar-2: rgba(255, 255, 255, .13);
  --metin: #f3f0ea;
  --metin-2: #b7b3ab;
  --metin-3: #8d8982;
  --cam: rgba(24, 25, 30, .78);
  --iz: rgba(255, 255, 255, .065);
  --disk1: rgba(255, 255, 255, .05);
  --disk2: rgba(255, 255, 255, 0);
  --leke: .26;
  --v1: #ff7a59;
  --v2: #ffb98a;
  --vyazi: #1d0f09;
  --tehlike: #ff7b72;
  --yumusak: cubic-bezier(.22, 1, .36, 1);
  --yay: cubic-bezier(.34, 1.4, .5, 1);
  transition: --v1 .9s ease, --v2 .9s ease;
}
:root[data-mod="kisa"] { --v1: #3fcfa4; --v2: #a6ecd2; --vyazi: #04251b; }
:root[data-mod="uzun"] { --v1: #8e90ff; --v2: #d2b6ff; --vyazi: #120f33; }

:root[data-tema="acik"] {
  color-scheme: light;
  --zemin: #f4f2ed;
  --yuzey: rgba(255, 255, 255, .58);
  --yuzey-2: rgba(255, 255, 255, .9);
  --yuzey-3: #ffffff;
  --kenar: rgba(30, 26, 20, .08);
  --kenar-2: rgba(30, 26, 20, .14);
  --metin: #1b1a17;
  --metin-2: #5c5953;
  --metin-3: #77736c;
  --cam: rgba(250, 249, 246, .86);
  --iz: rgba(30, 26, 20, .07);
  --disk1: rgba(255, 255, 255, .75);
  --disk2: rgba(255, 255, 255, 0);
  --leke: .2;
  --v1: #ee5f3d;
  --v2: #f7a36d;
  --vyazi: #ffffff;
  --tehlike: #c4372d;
}
:root[data-tema="acik"][data-mod="kisa"] { --v1: #149b74; --v2: #52cfa3; --vyazi: #ffffff; }
:root[data-tema="acik"][data-mod="uzun"] { --v1: #5d60e6; --v2: #a283f2; --vyazi: #ffffff; }

* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; }
body {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--zemin);
  color: var(--metin);
  font-family: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
  transition: background-color .5s ease, color .5s ease;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}
button, input { font: inherit; color: inherit; }
button { cursor: pointer; -webkit-tap-highlight-color: transparent; }
svg { display: block; }
.gizli { position: absolute !important; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
:focus-visible { outline: 2px solid var(--v1); outline-offset: 3px; border-radius: 10px; }
.d1 { stop-color: var(--v1); }
.d2 { stop-color: var(--v2); }
.disk1 { stop-color: var(--disk1); }
.disk2 { stop-color: var(--disk2); }

/* Ortam ışığı */
.ortam { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.leke { position: absolute; width: 70vmax; height: 70vmax; border-radius: 50%; opacity: var(--leke); background: radial-gradient(closest-side, var(--v1), transparent); filter: blur(40px); transition: opacity .8s ease; }
.l1 { left: -22vmax; top: -30vmax; animation: suzul 28s ease-in-out infinite alternate; }
.l2 { right: -30vmax; bottom: -40vmax; background: radial-gradient(closest-side, var(--v2), transparent); opacity: calc(var(--leke) * .7); animation: suzul 34s ease-in-out infinite alternate-reverse; }
.doku { position: absolute; inset: 0; opacity: .05; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .6 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
:root[data-tema="acik"] .doku { opacity: .07; filter: invert(1); }
@keyframes suzul { to { transform: translate(7vmax, 5vmax) scale(1.1); } }
body.calisiyor .leke { opacity: calc(var(--leke) * 1.25); }

/* Üst çubuk */
.ust { position: relative; z-index: 3; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px; padding: max(14px, env(safe-area-inset-top)) 28px 6px; }
.marka { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 17px; letter-spacing: -.015em; }
.marka svg { width: 28px; height: 28px; color: var(--metin); }
.ust-sag { display: flex; justify-content: flex-end; gap: 6px; }
.ikon-dugme { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 12px; border: 1px solid transparent; background: transparent; color: var(--metin-2); transition: background .2s, color .2s, border-color .2s, transform .2s var(--yay); }
.ikon-dugme:hover { background: var(--yuzey-2); border-color: var(--kenar); color: var(--metin); }
.ikon-dugme:active { transform: scale(.94); }
.ikon-dugme svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.ikon-dugme.kucuk { width: 34px; height: 34px; border-radius: 10px; }
.ikon-dugme.kucuk svg { width: 18px; height: 18px; }
#temaDugme .gunes { display: none; }
:root[data-tema="acik"] #temaDugme .ay { display: none; }
:root[data-tema="acik"] #temaDugme .gunes { display: block; }

.segment { position: relative; display: inline-flex; padding: 4px; border-radius: 999px; background: var(--yuzey); border: 1px solid var(--kenar); -webkit-backdrop-filter: blur(24px) saturate(150%); backdrop-filter: blur(24px) saturate(150%); }
.segment button { position: relative; z-index: 1; border: 0; background: none; color: var(--metin-2); font-weight: 500; font-size: 14px; line-height: 1; padding: 11px 18px; border-radius: 999px; transition: color .3s ease; white-space: nowrap; }
.segment button:hover { color: var(--metin); }
.segment button[aria-selected="true"] { color: var(--metin); }
.segment-kayar { position: absolute; top: 4px; bottom: 4px; left: 0; width: 0; border-radius: 999px; background: var(--yuzey-3); border: 1px solid var(--kenar-2); transition: transform .5s var(--yay), width .5s var(--yay); }

/* Düzen */
.duzen { position: relative; z-index: 2; display: grid; grid-template-columns: minmax(0, 1fr) 392px; gap: 28px; padding: 4px 28px 20px; flex: 1; align-items: center; }
.sahne { display: flex; flex-direction: column; align-items: center; gap: 18px; padding: 4px 0 8px; }

/* Halka */
.halka-kap { position: relative; width: clamp(300px, calc(100vh - 372px), 440px); max-width: 80vw; aspect-ratio: 1; }
.halka { position: relative; width: 100%; height: 100%; overflow: visible; }
.halka-kap::before { content: ""; position: absolute; inset: 14%; border-radius: 50%; background: radial-gradient(closest-side, var(--v1), transparent); opacity: .16; filter: blur(36px); transition: opacity .8s ease; }
.calisiyor .halka-kap::before { opacity: .24; }
.tikler line { stroke: var(--metin); stroke-opacity: .16; stroke-width: 1.4; stroke-linecap: round; }
.tikler line.buyuk { stroke-opacity: .32; stroke-width: 1.8; }
.iz { fill: none; stroke: var(--iz); stroke-width: 9; }
.ilerleme { fill: none; stroke-width: 9; stroke-linecap: round; transition: stroke-dashoffset .6s var(--yumusak); }
.calisiyor .ilerleme { transition: none; }
.uc { fill: var(--v2); stroke: var(--zemin); stroke-width: 3; transition: opacity .3s; }
.uc-hale { fill: var(--v1); opacity: .55; }
.halka-ic { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; pointer-events: none; }
.mod-etiket { font-family: "Instrument Serif", Georgia, serif; font-style: italic; font-size: 24px; color: var(--metin-2); letter-spacing: .005em; margin-bottom: 2px; }
.sure { font-weight: 200; font-size: clamp(66px, 8.6vw, 112px); line-height: 1; letter-spacing: -.05em; font-variant-numeric: tabular-nums; margin: 2px 0 12px; transition: opacity .4s; }
.durdu .sure { animation: nefes 2.4s ease-in-out infinite; }
@keyframes nefes { 50% { opacity: .45; } }
.bitis { font-size: 14px; color: var(--metin-3); display: flex; align-items: center; gap: 8px; }
.bitis .canli { width: 6px; height: 6px; border-radius: 50%; background: var(--v1); animation: nabiz 2s ease-in-out infinite; }
@keyframes nabiz { 50% { transform: scale(1.6); opacity: .5; } }

/* Kontroller */
.kontroller { display: flex; align-items: center; gap: 22px; }
.yuvarlak { display: grid; place-items: center; border-radius: 50%; border: 1px solid var(--kenar); transition: transform .3s var(--yay), background .25s, border-color .25s, color .25s; }
.yuvarlak svg { width: 22px; height: 22px; }
.yuvarlak.ikincil { width: 54px; height: 54px; background: var(--yuzey); color: var(--metin-2); -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px); }
.yuvarlak.ikincil svg { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.yuvarlak.ikincil:hover { background: var(--yuzey-2); color: var(--metin); border-color: var(--kenar-2); }
.yuvarlak.ana { width: 80px; height: 80px; border: 0; color: var(--vyazi); background: linear-gradient(140deg, var(--v2), var(--v1)); position: relative; }
.yuvarlak.ana::after { content: ""; position: absolute; inset: -6px; border-radius: 50%; border: 1px solid var(--v1); opacity: .35; transition: inset .4s var(--yay), opacity .4s; }
.yuvarlak.ana:hover { transform: scale(1.05); }
.yuvarlak.ana:hover::after { inset: -9px; opacity: .5; }
.yuvarlak:active { transform: scale(.93); }
.yuvarlak.ana svg { width: 28px; height: 28px; fill: currentColor; }
.yuvarlak.ana .durdur { display: none; }
.calisiyor .yuvarlak.ana .oynat { display: none; }
.calisiyor .yuvarlak.ana .durdur { display: block; }

.dongu { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--metin-3); min-height: 20px; }
.dongu-cubuklar { display: flex; gap: 5px; }
.dongu-cubuklar i { width: 20px; height: 5px; border-radius: 3px; background: var(--yuzey-3); border: 1px solid var(--kenar); transition: background .5s, border-color .5s; }
.dongu-cubuklar i.dolu { background: var(--v1); border-color: transparent; }

.simdiki { display: flex; align-items: center; gap: 12px; max-width: min(440px, 92vw); padding: 10px 16px 10px 14px; border-radius: 16px; border: 1px solid var(--kenar); background: var(--yuzey); -webkit-backdrop-filter: blur(24px); backdrop-filter: blur(24px); text-align: left; transition: border-color .2s, background .2s; }
.simdiki:hover { border-color: var(--kenar-2); background: var(--yuzey-2); }
.simdiki-nokta { flex: none; width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--v1); }
.calisiyor .simdiki-nokta { background: var(--v1); }
.simdiki-metin { display: flex; flex-direction: column; min-width: 0; }
.simdiki-metin small { font-size: 12px; color: var(--metin-3); }
.simdiki-metin b { font-weight: 500; font-size: 14.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pomlar { display: inline-flex; gap: 4px; flex: none; margin-left: auto; padding-left: 6px; }
.pomlar i { width: 7px; height: 7px; border-radius: 50%; border: 1.5px solid var(--metin-3); opacity: .7; }
.pomlar i.dolu { background: var(--v1); border-color: var(--v1); opacity: 1; }
.pomlar i.fazla { background: var(--v2); border-color: var(--v2); opacity: 1; }

/* Yan sütun kartları */
.yan { display: flex; flex-direction: column; gap: 12px; align-self: center; }
.kart { border-radius: 22px; border: 1px solid var(--kenar); background: var(--yuzey); -webkit-backdrop-filter: blur(28px) saturate(140%); backdrop-filter: blur(28px) saturate(140%); padding: 14px 16px 12px; transition: background .5s, border-color .5s; }
.kart-ust { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; min-height: 30px; }
.kart-ust h2 { margin: 0; font-size: 16px; font-weight: 600; letter-spacing: -.01em; }
.hap { font-size: 12px; font-weight: 500; color: var(--metin-2); padding: 3px 9px; border-radius: 999px; background: var(--yuzey-2); border: 1px solid var(--kenar); }
.metin-dugme { margin-left: auto; border: 0; background: none; padding: 6px 8px; border-radius: 8px; font-size: 13px; color: var(--metin-3); transition: color .2s, background .2s; }
.metin-dugme:hover { color: var(--metin); background: var(--yuzey-2); }

.gorev-liste { list-style: none; margin: 0 -6px; padding: 0; display: flex; flex-direction: column; gap: 2px; max-height: 222px; overflow-y: auto; scrollbar-width: thin; }
.gorev { position: relative; display: flex; align-items: center; gap: 10px; padding: 5px 8px; border-radius: 12px; border: 1px solid transparent; transition: background .2s, border-color .2s; animation: gelis .45s var(--yumusak) both; }
@keyframes gelis { from { opacity: 0; transform: translateY(6px); } }
.gorev:hover { background: var(--yuzey); }
.gorev.secili { background: var(--yuzey-2); border-color: var(--kenar); }
.gorev.secili::before { content: ""; position: absolute; left: -1px; top: 11px; bottom: 11px; width: 3px; border-radius: 3px; background: var(--v1); }
.tik { flex: none; width: 22px; height: 22px; border-radius: 50%; border: 1.6px solid var(--metin-3); background: transparent; display: grid; place-items: center; padding: 0; transition: background .25s, border-color .25s, transform .3s var(--yay); }
.tik svg { width: 13px; height: 13px; fill: none; stroke: var(--vyazi); stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; opacity: 0; transform: scale(.5); transition: opacity .2s, transform .3s var(--yay); }
.tik:hover { border-color: var(--v1); }
.tik:active { transform: scale(.88); }
.gorev.tamam .tik { background: var(--v1); border-color: var(--v1); }
.gorev.tamam .tik svg { opacity: 1; transform: none; }
.gorev-ad { flex: 1; min-width: 0; border: 0; background: none; padding: 5px 0; text-align: left; font-size: 14.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gorev.tamam .gorev-ad { color: var(--metin-3); text-decoration: line-through; text-decoration-color: var(--metin-3); }
.gorev .pomlar { margin-left: 0; padding: 0; }
.sil { flex: none; width: 28px; height: 28px; border-radius: 8px; border: 0; background: none; color: var(--metin-3); display: grid; place-items: center; opacity: 0; transition: opacity .2s, background .2s, color .2s; }
.sil svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; }
.gorev:hover .sil, .sil:focus-visible { opacity: 1; }
.sil:hover { background: var(--yuzey-2); color: var(--tehlike); }
.bos-liste { padding: 18px 10px 14px; text-align: center; color: var(--metin-3); font-size: 14px; }
.bos-liste b { display: block; color: var(--metin-2); font-weight: 500; margin-bottom: 2px; }

.gorev-ekle { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding: 5px 5px 5px 14px; border-radius: 14px; border: 1px solid var(--kenar); background: var(--yuzey); transition: border-color .2s, background .2s; }
.gorev-ekle:focus-within { border-color: var(--kenar-2); background: var(--yuzey-2); }
.gorev-ekle input { flex: 1; min-width: 0; border: 0; background: none; outline: none; padding: 8px 0; font-size: 14.5px; }
.gorev-ekle input::placeholder { color: var(--metin-3); }
.tahmin { display: flex; align-items: center; gap: 2px; padding: 2px; border-radius: 10px; background: var(--yuzey-2); }
.tahmin button { width: 26px; height: 26px; border: 0; border-radius: 8px; background: none; color: var(--metin-2); display: grid; place-items: center; }
.tahmin button:hover { background: var(--yuzey-3); color: var(--metin); }
.tahmin svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.tahmin span { min-width: 18px; text-align: center; font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; }
.ekle { width: 36px; height: 36px; border-radius: 11px; border: 0; background: var(--v1); color: var(--vyazi); display: grid; place-items: center; transition: transform .3s var(--yay), filter .2s; }
.ekle:hover { filter: brightness(1.08); }
.ekle:active { transform: scale(.9); }
.ekle svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; }
.gorev-ozet { margin: 9px 2px 0; font-size: 12.5px; color: var(--metin-3); }
.gorev-ozet b { color: var(--metin-2); font-weight: 500; }

/* İstatistik */
.mini-segment { margin-left: auto; display: flex; padding: 3px; border-radius: 10px; background: var(--yuzey); border: 1px solid var(--kenar); }
.mini-segment button { border: 0; background: none; padding: 5px 10px; border-radius: 7px; font-size: 12.5px; color: var(--metin-3); transition: background .2s, color .2s; }
.mini-segment button[aria-pressed="true"] { background: var(--yuzey-3); color: var(--metin); }
.sayilar { display: grid; grid-template-columns: repeat(3, 1fr); margin: 0 0 10px; border-radius: 14px; border: 1px solid var(--kenar); overflow: hidden; }
.sayilar div { padding: 8px 12px; }
.sayilar div + div { border-left: 1px solid var(--kenar); }
.sayilar dt { font-size: 12px; color: var(--metin-3); }
.sayilar dd { margin: 1px 0 0; font-size: 17px; font-weight: 500; letter-spacing: -.02em; white-space: nowrap; }
.hedef { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.hedef-cubuk { flex: 1; height: 6px; border-radius: 3px; background: var(--yuzey-3); overflow: hidden; }
.hedef-cubuk span { display: block; height: 100%; width: 0; border-radius: 3px; background: linear-gradient(90deg, var(--v1), var(--v2)); transition: width 1s var(--yumusak); }
.hedef small { font-size: 12px; color: var(--metin-3); white-space: nowrap; }
.grafik-kap { position: relative; }
#grafik { width: 100%; height: 112px; overflow: visible; }
#grafik .cubuk { fill: var(--metin); opacity: .2; transition: opacity .2s, fill .2s; }
#grafik .cubuk.vurgu { opacity: 1; fill: url(#grafikRenk); }
#grafik .cubuk.bos { opacity: .1; }
#grafik .cubuk-grup:hover .cubuk:not(.vurgu), #grafik .cubuk-grup:focus .cubuk:not(.vurgu) { opacity: .38; }
#grafik .cubuk-grup { outline: none; }
#grafik .vurus { fill: transparent; cursor: default; }
#grafik .eksen { fill: var(--metin-3); font-size: 11px; font-family: inherit; }
#grafik .eksen.bugun { fill: var(--metin); font-weight: 600; }
#grafik .taban { stroke: var(--kenar-2); stroke-width: 1; }
#grafik .hedef-cizgi { stroke: var(--metin-3); stroke-width: 1; opacity: .55; }
#grafik .hedef-yazi { fill: var(--metin-3); font-size: 11px; font-family: inherit; }
.ipucu { position: absolute; z-index: 4; pointer-events: none; min-width: 120px; padding: 8px 11px; border-radius: 11px; background: var(--cam); border: 1px solid var(--kenar-2); -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px); font-size: 12.5px; line-height: 1.35; opacity: 0; transform: translate(-50%, -6px); transition: opacity .15s, transform .15s; white-space: nowrap; }
.ipucu.acik { opacity: 1; transform: translate(-50%, -12px); }
.ipucu b { display: block; font-weight: 600; font-size: 13px; }
.ipucu span { color: var(--metin-2); }
.grafik-alt { display: flex; justify-content: space-between; gap: 10px; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--kenar); font-size: 12.5px; color: var(--metin-3); }
.grafik-alt b { color: var(--metin); font-weight: 500; }
.grafik-alt span { white-space: nowrap; }

/* Pencereler */
.pencere { padding: 0; border: 1px solid var(--kenar-2); border-radius: 26px; background: var(--cam); color: var(--metin); width: min(540px, calc(100vw - 24px)); max-height: min(780px, calc(100dvh - 32px)); -webkit-backdrop-filter: blur(40px) saturate(160%); backdrop-filter: blur(40px) saturate(160%); }
.pencere.dar { width: min(420px, calc(100vw - 24px)); }
.pencere::backdrop { background: rgba(8, 8, 10, .32); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
:root[data-tema="acik"] .pencere::backdrop { background: rgba(60, 55, 45, .16); }
.pencere[open] { animation: pencereAc .42s var(--yumusak); }
@keyframes pencereAc { from { opacity: 0; transform: translateY(14px) scale(.97); } }
.pencere-ic { padding: 18px 20px 20px; }
.pencere-ust { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.pencere-ust h2 { margin: 0; font-size: 19px; font-weight: 600; letter-spacing: -.02em; }
.grup-baslik { margin: 16px 6px 6px; font-size: 13px; font-weight: 500; color: var(--metin-3); }
.grup { border-radius: 16px; border: 1px solid var(--kenar); background: var(--yuzey); overflow: hidden; }
.satir { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 11px 14px; min-height: 56px; }
.satir + .satir { border-top: 1px solid var(--kenar); }
label.satir { cursor: pointer; }
.satir-metin { display: flex; flex-direction: column; min-width: 0; }
.satir-metin b { font-weight: 500; font-size: 14.5px; }
.satir-metin small { font-size: 12.5px; color: var(--metin-3); }
.adimci { display: flex; align-items: center; gap: 4px; flex: none; }
.adimci button { width: 32px; height: 32px; border-radius: 10px; border: 1px solid var(--kenar); background: var(--yuzey-2); color: var(--metin-2); display: grid; place-items: center; transition: background .2s, color .2s, transform .25s var(--yay); }
.adimci button:hover { background: var(--yuzey-3); color: var(--metin); }
.adimci button:active { transform: scale(.9); }
.adimci button:disabled { opacity: .35; pointer-events: none; }
.adimci svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.adimci output { min-width: 74px; text-align: center; font-size: 14px; font-weight: 500; font-variant-numeric: tabular-nums; }
.secenekler { display: flex; flex-wrap: wrap; justify-content: flex-end; padding: 3px; gap: 2px; border-radius: 11px; background: var(--yuzey-2); border: 1px solid var(--kenar); }
.secenekler button { border: 0; background: none; padding: 6px 11px; border-radius: 8px; font-size: 13px; color: var(--metin-2); transition: background .2s, color .2s; white-space: nowrap; }
.secenekler button:hover { color: var(--metin); }
.secenekler button[aria-pressed="true"] { background: var(--v1); color: var(--vyazi); font-weight: 500; }
.anahtar { -webkit-appearance: none; appearance: none; flex: none; position: relative; width: 48px; height: 29px; margin: 0; border-radius: 999px; background: var(--yuzey-3); border: 1px solid var(--kenar-2); cursor: pointer; transition: background .25s, border-color .25s; }
.anahtar::after { content: ""; position: absolute; top: 2px; left: 2px; width: 23px; height: 23px; border-radius: 50%; background: #fff; border: 1px solid rgba(0, 0, 0, .06); transition: transform .35s var(--yay); }
.anahtar:checked { background: var(--v1); border-color: transparent; }
.anahtar:checked::after { transform: translateX(19px); }
.duzey { display: flex; align-items: center; gap: 10px; flex: none; }
.duzey input { width: 130px; accent-color: var(--v1); }
.kucuk-dugme { flex: none; border: 1px solid var(--kenar-2); background: var(--yuzey-2); padding: 7px 13px; border-radius: 10px; font-size: 13px; font-weight: 500; transition: background .2s, border-color .2s, color .2s; }
.kucuk-dugme:hover { background: var(--yuzey-3); }
.kucuk-dugme.tehlike { color: var(--tehlike); }
.kucuk-dugme.tehlike.emin { background: var(--tehlike); color: #fff; border-color: transparent; }
.pencere-not { margin: 14px 6px 0; font-size: 12.5px; color: var(--metin-3); }
.kisayol-liste { list-style: none; margin: 8px 0 0; padding: 0; border-radius: 16px; border: 1px solid var(--kenar); background: var(--yuzey); }
.kisayol-liste li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 14px; font-size: 14px; }
.kisayol-liste li + li { border-top: 1px solid var(--kenar); }
.tuslar { display: flex; gap: 4px; }
kbd { min-width: 28px; padding: 3px 8px; border-radius: 7px; border: 1px solid var(--kenar-2); background: var(--yuzey-2); font-family: inherit; font-size: 12.5px; font-weight: 500; line-height: 1.4; text-align: center; color: var(--metin-2); }

/* Bildirim */
.bildirim { position: fixed; z-index: 20; left: 50%; top: max(12px, env(safe-area-inset-top)); display: flex; align-items: center; gap: 10px; max-width: calc(100vw - 32px); padding: 12px 18px 12px 14px; border-radius: 16px; background: var(--cam); border: 1px solid var(--kenar-2); -webkit-backdrop-filter: blur(30px) saturate(160%); backdrop-filter: blur(30px) saturate(160%); font-size: 14px; opacity: 0; transform: translate(-50%, -14px) scale(.96); pointer-events: none; transition: opacity .35s var(--yumusak), transform .45s var(--yumusak); }
.bildirim.acik { opacity: 1; transform: translate(-50%, 0); }
.bildirim-nokta { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--v1); }

/* Sade görünüm */
.sade .yan { position: absolute; top: 4px; right: 28px; width: 392px; opacity: 0; visibility: hidden; pointer-events: none; transform: translateX(24px); }
.sade .duzen { grid-template-columns: minmax(0, 1fr); }
.sade .marka span, .sade .simdiki { opacity: .6; }
.yan { transition: opacity .5s var(--yumusak), transform .5s var(--yumusak), visibility .5s; }

@media (max-width: 1100px) {
  .duzen { grid-template-columns: minmax(0, 1fr) 350px; gap: 20px; padding: 8px 20px 24px; }
  .ust { padding-left: 20px; padding-right: 20px; }
}
@media (max-width: 860px) {
  .ust { grid-template-columns: 1fr auto; row-gap: 14px; padding: max(14px, env(safe-area-inset-top)) 16px 4px; }
  .segment { grid-column: 1 / -1; grid-row: 2; justify-self: center; }
  .ust-sag { gap: 2px; }
  .duzen { grid-template-columns: minmax(0, 1fr); flex: none; padding: 8px 16px max(28px, env(safe-area-inset-bottom)); gap: 18px; }
  .sahne { padding-top: 6px; gap: 18px; }
  .halka-kap { width: min(330px, 84vw); max-width: none; }
  .sure { font-size: clamp(60px, 18vw, 84px); margin-bottom: 8px; }
  .mod-etiket { font-size: 21px; }
  .yuvarlak.ana { width: 74px; height: 74px; }
  .yuvarlak.ikincil { width: 52px; height: 52px; }
  .yan { align-self: stretch; }
  .gorev-liste { max-height: none; }
  .grafik-alt { flex-wrap: wrap; justify-content: flex-start; column-gap: 16px; row-gap: 2px; }
  .sil { opacity: 1; }
  .sade .yan { display: none; }
  .sade .duzen { grid-template-columns: minmax(0, 1fr); }
}
@media (min-width: 640px) and (max-width: 860px) {
  .yan { display: grid; grid-template-columns: 1fr 1fr; align-items: start; }
  .gorev-liste { max-height: 222px; }
}
@media (max-width: 420px) {
  .segment button { padding: 11px 13px; font-size: 13.5px; }
  .satir.dikey-mobil { flex-direction: column; align-items: flex-start; gap: 8px; }
  .satir.dikey-mobil .secenekler { justify-content: flex-start; }
  .duzey input { width: 96px; }
  .pencere { border-radius: 22px; }
  .pencere-ic { padding: 16px 14px 18px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition-duration: .01ms !important; }
}
`,
    "app.js": `/* Odak — pomodoro zamanlayıcısı, görevler ve istatistik. Her şey bu cihazda (localStorage) saklanır. */
(function () {
  "use strict";

  var ANAHTAR = "odak-v1";
  var DAKIKA = 60000;
  var CEVRE = 2 * Math.PI * 180;
  var MODLAR = { odak: "Odak zamanı", kisa: "Kısa mola", uzun: "Uzun mola" };
  var VARSAYILAN = { odak: 25, kisa: 5, uzun: 15, aralik: 4, hedef: 120, otoMola: true, otoOdak: false, ses: "kase", duzey: 70, arka: "kapali", bildirim: false, tema: "koyu" };
  var GUN_KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  var GUN_UZUN = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  var AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var kok = document.documentElement;

  /* ---------- yardımcılar ---------- */
  function gunBasi(t) { var d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
  function gunEkle(t, n) { var d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n).getTime(); }
  function iki(n) { return (n < 10 ? "0" : "") + n; }
  function saatYaz(t) { var d = new Date(t); return iki(d.getHours()) + ":" + iki(d.getMinutes()); }
  function sureYaz(dk) {
    dk = Math.round(dk);
    if (dk < 60) return dk + " dk";
    var s = Math.floor(dk / 60), k = dk % 60;
    return k ? s + " sa " + k + " dk" : s + " sa";
  }
  function kacir(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function kimlik() { return "g" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
  function tohumlu(t) {
    return function () {
      t = (t + 0x6D2B79F5) | 0;
      var x = Math.imul(t ^ (t >>> 15), 1 | t);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- veri ---------- */
  function ornekVeri() {
    var simdi = Date.now(), bugun = gunBasi(simdi), r = tohumlu(20261105);
    var gorevler = [
      { id: "g1", ad: "Çeyrek sunumunun taslağını bitir", tahmin: 4, biten: 2, tamam: false },
      { id: "g2", ad: "Müşteri görüşmesi notlarını düzenle", tahmin: 2, biten: 1, tamam: false },
      { id: "g3", ad: "Haftalık bülteni yaz", tahmin: 3, biten: 0, tamam: false },
      { id: "g4", ad: "Kod incelemelerini tamamla", tahmin: 2, biten: 0, tamam: false },
      { id: "g5", ad: "Harcama tablosunu güncelle", tahmin: 1, biten: 1, tamam: true }
    ];
    var gecmis = [];
    for (var g = 24; g >= 1; g--) {
      if (g === 9 || g === 17) continue;
      var gun = gunEkle(bugun, -g), hg = new Date(gun).getDay(), haftaSonu = hg === 0 || hg === 6;
      var adet = haftaSonu ? 1 + Math.floor(r() * 3) : 3 + Math.floor(r() * 5);
      var t = gun + (8 * 60 + 40 + Math.floor(r() * 80)) * DAKIKA;
      for (var i = 0; i < adet; i++) {
        t += 25 * DAKIKA;
        gecmis.push({ t: t, dk: 25 });
        t += ((i + 1) % 4 === 0 ? 15 + Math.floor(r() * 60) : 5 + Math.floor(r() * 25)) * DAKIKA;
        if (i === 2) t += Math.floor(r() * 90) * DAKIKA;
      }
    }
    var t2 = bugun + (9 * 60 + 5) * DAKIKA;
    for (var k = 0; k < 4; k++) {
      var bit = t2 + 25 * DAKIKA;
      if (bit > simdi - 2 * DAKIKA) break;
      gecmis.push({ t: bit, dk: 25, g: k < 2 ? "g1" : "g2" });
      t2 = bit + (k === 1 ? 22 : 6) * DAKIKA;
    }
    return {
      surum: 1, ayar: Object.assign({}, VARSAYILAN), gorevler: gorevler, secili: "g1", gecmis: gecmis, dongu: 2,
      z: { mod: "odak", durum: "bos", toplam: 25 * DAKIKA, kalan: 25 * DAKIKA, bitis: 0 }
    };
  }
  function bosVeri() {
    return { surum: 1, ayar: Object.assign({}, VARSAYILAN), gorevler: [], secili: null, gecmis: [], dongu: 0, z: { mod: "odak", durum: "bos", toplam: 25 * DAKIKA, kalan: 25 * DAKIKA, bitis: 0 } };
  }
  function yukle() {
    try {
      var v = JSON.parse(localStorage.getItem(ANAHTAR) || "null");
      if (v && v.surum === 1 && v.z && Array.isArray(v.gorevler)) { v.ayar = Object.assign({}, VARSAYILAN, v.ayar); return v; }
    } catch (e) { /* bozuk veri: örnekle başla */ }
    return ornekVeri();
  }
  var S = yukle();
  function kaydet() { try { localStorage.setItem(ANAHTAR, JSON.stringify(S)); } catch (e) { /* depolama dolu */ } }
  function gorevBul(id) { for (var i = 0; i < S.gorevler.length; i++) if (S.gorevler[i].id === id) return S.gorevler[i]; return null; }

  /* ---------- ses ---------- */
  var ses = null, arka = null;
  function sesBaglam() {
    try {
      if (!ses) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ses = new AC(); }
      if (ses.state === "suspended") ses.resume();
    } catch (e) { return null; }
    return ses;
  }
  function cal(tur) {
    if (!tur || tur === "kapali") return;
    if (!ses && navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    var c = sesBaglam(); if (!c) return;
    var t = c.currentTime + .03, cikis = c.createGain();
    cikis.gain.value = Math.pow(S.ayar.duzey / 100, 1.6) * .9;
    cikis.connect(c.destination);
    function ton(f, bas, sure, g, tip) {
      var o = c.createOscillator(), k = c.createGain();
      o.type = tip || "sine"; o.frequency.value = f;
      k.gain.setValueAtTime(0.0001, t + bas);
      k.gain.exponentialRampToValueAtTime(g, t + bas + .012);
      k.gain.exponentialRampToValueAtTime(0.0001, t + bas + sure);
      o.connect(k); k.connect(cikis); o.start(t + bas); o.stop(t + bas + sure + .05);
    }
    if (tur === "kase") { ton(262, 0, 4.2, .5); ton(263.6, 0, 4.4, .32); ton(524, 0, 3.2, .16); ton(786, .01, 2.4, .08); ton(1310, .02, 1.6, .04); }
    else if (tur === "zil") { [0, .42].forEach(function (b, i) { var f = i ? 1046.5 : 1318.5; ton(f, b, 1.8, .38); ton(f * 2.01, b, .9, .09); ton(f * 3.03, b, .5, .04); }); }
    else if (tur === "ahsap") { [0, .16, .52].forEach(function (b, i) { ton(i === 2 ? 760 : 980, b, .16, .55, "triangle"); ton(i === 2 ? 1520 : 1960, b, .06, .12); }); }
  }
  function gurultu(c, tur) {
    var uz = c.sampleRate * 3, b = c.createBuffer(1, uz, c.sampleRate), d = b.getChannelData(0), son = 0;
    for (var i = 0; i < uz; i++) {
      var w = Math.random() * 2 - 1;
      if (tur === "yagmur") { son = (son + .02 * w) / 1.02; d[i] = son * 3.2; } else d[i] = w * .32;
    }
    return b;
  }
  function arkaSes(acik) {
    var istek = acik && S.ayar.arka !== "kapali" && S.z.mod === "odak" && S.z.durum === "calisiyor";
    if (arka && (!istek || arka.tur !== S.ayar.arka)) {
      var eski = arka; arka = null;
      try { eski.kazanc.gain.setTargetAtTime(0, eski.c.currentTime, .25); setTimeout(function () { try { eski.kaynak.stop(); } catch (e) { /* zaten durdu */ } }, 1200); } catch (e) { /* yok */ }
    }
    if (!istek || arka) return;
    if (!ses && navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    var c = sesBaglam(); if (!c) return;
    var kaynak = c.createBufferSource(), suzgec = c.createBiquadFilter(), kazanc = c.createGain();
    kaynak.buffer = gurultu(c, S.ayar.arka); kaynak.loop = true;
    suzgec.type = "lowpass"; suzgec.frequency.value = S.ayar.arka === "yagmur" ? 1400 : 9000;
    kazanc.gain.value = 0;
    kaynak.connect(suzgec); suzgec.connect(kazanc); kazanc.connect(c.destination);
    kaynak.start();
    kazanc.gain.setTargetAtTime(Math.pow(S.ayar.duzey / 100, 1.6) * .35, c.currentTime, .6);
    arka = { c: c, kaynak: kaynak, kazanc: kazanc, tur: S.ayar.arka };
  }

  /* ---------- bildirim ---------- */
  var bildirimZaman = 0;
  function duyur(metin, sure) {
    $("#bildirimMetin").textContent = metin;
    var b = $("#bildirim"); b.classList.add("acik");
    clearTimeout(bildirimZaman);
    bildirimZaman = setTimeout(function () { b.classList.remove("acik"); }, sure || 3200);
  }
  function masaustu(baslik, govde) {
    if (!S.ayar.bildirim) return;
    try { if ("Notification" in window && Notification.permission === "granted") new Notification(baslik, { body: govde, icon: "ikon.svg" }); } catch (e) { /* desteklenmiyor */ }
  }

  /* ---------- zamanlayıcı ---------- */
  var cerceve = 0, sonSaniye = -1, baslikYanip = 0;
  function sureMs(m) { return S.ayar[m] * DAKIKA; }
  function kalanMs() { return S.z.durum === "calisiyor" ? Math.max(0, S.z.bitis - Date.now()) : S.z.kalan; }
  function baslat() {
    if (S.z.durum === "calisiyor") return;
    sesBaglam();
    if (S.z.kalan <= 0) S.z.kalan = S.z.toplam;
    S.z.bitis = Date.now() + S.z.kalan; S.z.durum = "calisiyor";
    kaydet(); durumCiz(); dongu(); arkaSes(true);
  }
  function duraklat() {
    if (S.z.durum !== "calisiyor") return;
    S.z.kalan = kalanMs(); S.z.durum = "durdu";
    kaydet(); durumCiz(); arkaSes(false);
  }
  function degistir() { if (S.z.durum === "calisiyor") duraklat(); else baslat(); }
  function sifirla() {
    S.z.durum = "bos"; S.z.toplam = sureMs(S.z.mod); S.z.kalan = S.z.toplam;
    kaydet(); arkaSes(false); durumCiz(); halkaCiz(S.z.kalan);
  }
  function modSec(m) {
    if (!MODLAR[m]) return;
    S.z.mod = m; S.z.durum = "bos"; S.z.toplam = sureMs(m); S.z.kalan = S.z.toplam;
    kaydet(); arkaSes(false); modCiz(); durumCiz(); halkaCiz(S.z.kalan);
  }
  function sonrakiMola() { return S.dongu >= S.ayar.aralik ? "uzun" : "kisa"; }
  function bitir() {
    cancelAnimationFrame(cerceve);
    var m = S.z.mod;
    if (m === "odak") {
      var dk = Math.round(S.z.toplam / DAKIKA);
      S.gecmis.push({ t: Date.now(), dk: dk, g: S.secili || undefined });
      var gr = gorevBul(S.secili); if (gr) gr.biten++;
      S.dongu++;
      var mola = sonrakiMola();
      cal(S.ayar.ses);
      var metin = mola === "uzun" ? "Döngü tamamlandı. " + S.ayar.uzun + " dakikalık uzun mola zamanı." : "Odak seansı bitti. " + S.ayar.kisa + " dakika mola ver.";
      duyur(metin, 5200); masaustu("Odak seansı bitti", metin);
      modSec(mola);
      if (S.ayar.otoMola) baslat();
    } else {
      if (m === "uzun") S.dongu = 0;
      cal(S.ayar.ses);
      duyur("Mola bitti. Hazırsan yeni bir odak seansı başlat.", 5200); masaustu("Mola bitti", "Hazırsan yeni bir odak seansı başlat.");
      modSec("odak");
      if (S.ayar.otoOdak) baslat();
    }
    baslikYanip = Date.now() + 6000;
    gorevleriCiz(); istatistikCiz(); donguCiz();
  }
  function atla() {
    if (S.z.mod === "odak") modSec(sonrakiMola());
    else { if (S.z.mod === "uzun") S.dongu = 0; modSec("odak"); }
    donguCiz();
    duyur(S.z.mod === "odak" ? "Odak seansına geçildi." : MODLAR[S.z.mod] + " hazır.");
  }
  function dongu() {
    cancelAnimationFrame(cerceve);
    (function adim() {
      var k = kalanMs();
      halkaCiz(k);
      if (S.z.durum !== "calisiyor") return;
      if (k <= 0) { bitir(); return; }
      cerceve = requestAnimationFrame(adim);
    })();
  }
  // Sekme arka plandayken requestAnimationFrame durur; bitişi bu yedek denetim yakalar.
  setInterval(function () {
    if (S.z.durum === "calisiyor" && kalanMs() <= 0) bitir();
    else if (S.z.durum === "calisiyor" && document.hidden) halkaCiz(kalanMs());
  }, 1000);

  /* ---------- çizim: halka ve durum ---------- */
  var ilerleme = $("#ilerleme"), uc = $("#uc"), ucHale = $("#ucHale");
  ilerleme.style.strokeDasharray = CEVRE + " " + CEVRE;
  (function tikler() {
    var g = $("#tikler"), s = "";
    for (var i = 0; i < 60; i++) {
      var a = (i / 60) * Math.PI * 2 - Math.PI / 2, buyuk = i % 5 === 0, r1 = buyuk ? 193 : 196, r2 = 202;
      s += '<line class="' + (buyuk ? "buyuk" : "") + '" x1="' + (210 + Math.cos(a) * r1).toFixed(2) + '" y1="' + (210 + Math.sin(a) * r1).toFixed(2) + '" x2="' + (210 + Math.cos(a) * r2).toFixed(2) + '" y2="' + (210 + Math.sin(a) * r2).toFixed(2) + '"/>';
    }
    g.innerHTML = s;
  })();
  function halkaCiz(k) {
    var oran = S.z.toplam ? Math.min(1, Math.max(0, k / S.z.toplam)) : 1;
    ilerleme.style.strokeDashoffset = (CEVRE * (1 - oran)).toFixed(2);
    var a = -Math.PI / 2 + oran * Math.PI * 2, x = (210 + Math.cos(a) * 180).toFixed(2), y = (210 + Math.sin(a) * 180).toFixed(2);
    uc.setAttribute("cx", x); uc.setAttribute("cy", y); ucHale.setAttribute("cx", x); ucHale.setAttribute("cy", y);
    uc.style.opacity = ucHale.style.opacity = oran <= 0.002 ? "0" : "";
    var sn = Math.ceil(k / 1000);
    if (sn !== sonSaniye) {
      sonSaniye = sn;
      var metin = iki(Math.floor(sn / 60)) + ":" + iki(sn % 60);
      $("#sure").textContent = metin;
      if (S.z.durum === "calisiyor") document.title = metin + " · " + (S.z.mod === "odak" ? "Odak" : MODLAR[S.z.mod]);
      else if (Date.now() < baslikYanip) document.title = (S.z.mod === "odak" ? "Mola bitti" : "Seans bitti") + " · Odak";
      else document.title = "Odak";
      if (S.z.durum === "calisiyor") $("#bitis").innerHTML = '<span class="canli"></span>Bitiş ' + saatYaz(S.z.bitis);
    }
  }
  function durumCiz() {
    var b = document.body;
    b.classList.toggle("calisiyor", S.z.durum === "calisiyor");
    b.classList.toggle("durdu", S.z.durum === "durdu");
    var bd = $("#baslat");
    bd.setAttribute("aria-label", S.z.durum === "calisiyor" ? "Duraklat" : S.z.durum === "durdu" ? "Sürdür" : "Başlat");
    var bitis = $("#bitis");
    if (S.z.durum === "calisiyor") bitis.innerHTML = '<span class="canli"></span>Bitiş ' + saatYaz(S.z.bitis);
    else if (S.z.durum === "durdu") bitis.textContent = "Duraklatıldı, devam etmek için boşluk";
    else bitis.textContent = Math.round(S.z.toplam / DAKIKA) + " dakikalık " + (S.z.mod === "odak" ? "odak" : "mola");
    sonSaniye = -1;
    if (S.z.durum !== "calisiyor") halkaCiz(kalanMs());
  }
  function modCiz() {
    kok.setAttribute("data-mod", S.z.mod);
    $("#modEtiket").textContent = MODLAR[S.z.mod];
    $$("#modSecici [data-mod]").forEach(function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-mod") === S.z.mod)); });
    kayarCiz();
    donguCiz();
  }
  function kayarCiz() {
    var sec = $('#modSecici [aria-selected="true"]'), k = $(".segment-kayar");
    if (!sec) return;
    k.style.width = sec.offsetWidth + "px";
    k.style.transform = "translateX(" + (sec.offsetLeft - 4) + "px)";
  }
  function donguCiz() {
    var n = S.ayar.aralik, dolu = Math.min(S.dongu, n), s = '<span class="dongu-cubuklar" aria-hidden="true">';
    for (var i = 0; i < n; i++) s += '<i class="' + (i < dolu ? "dolu" : "") + '"></i>';
    s += "</span>";
    var kalan = n - dolu;
    var metin = S.z.mod === "uzun" ? "Döngü tamamlandı, dinlen" : kalan <= 0 ? "Sıradaki mola uzun" : "Uzun molaya " + kalan + " seans";
    $("#dongu").innerHTML = s + "<span>" + metin + "</span>";
  }

  /* ---------- görevler ---------- */
  var tahmin = 2;
  function pomHtml(g) {
    var n = Math.max(g.tahmin, g.biten), s = "";
    for (var i = 0; i < Math.min(n, 8); i++) s += '<i class="' + (i < g.biten ? (i >= g.tahmin ? "fazla" : "dolu") : "") + '"></i>';
    return s;
  }
  function gorevleriCiz() {
    var ul = $("#gorevListe");
    if (!S.gorevler.length) {
      ul.innerHTML = '<li class="bos-liste"><b>Liste boş</b>Bugün neye odaklanacağını aşağıya yaz.</li>';
    } else {
      ul.innerHTML = S.gorevler.map(function (g) {
        return '<li class="gorev' + (g.id === S.secili ? " secili" : "") + (g.tamam ? " tamam" : "") + '" data-id="' + g.id + '">'
          + '<button class="tik" role="checkbox" aria-checked="' + g.tamam + '" aria-label="' + kacir(g.ad) + ' tamamlandı"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12.5l4 4L18.5 7.5"/></svg></button>'
          + '<button class="gorev-ad" title="Bu göreve odaklan">' + kacir(g.ad) + "</button>"
          + '<span class="pomlar" title="' + g.biten + " / " + g.tahmin + ' seans">' + pomHtml(g) + "</span>"
          + '<button class="sil" aria-label="' + kacir(g.ad) + ' görevini sil"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg></button></li>';
      }).join("");
    }
    var acik = S.gorevler.filter(function (g) { return !g.tamam; });
    $("#kalanHap").textContent = acik.length + " kaldı";
    $("#temizle").style.visibility = S.gorevler.some(function (g) { return g.tamam; }) ? "visible" : "hidden";
    var kalanSeans = acik.reduce(function (a, g) { return a + Math.max(0, g.tahmin - g.biten); }, 0);
    if (kalanSeans) {
      var dk = kalanSeans * S.ayar.odak + (kalanSeans - 1) * S.ayar.kisa + Math.floor((kalanSeans - 1) / S.ayar.aralik) * (S.ayar.uzun - S.ayar.kisa);
      $("#gorevOzet").innerHTML = "<b>" + kalanSeans + " seans</b> kaldı, molalarla " + sureYaz(dk) + ". Tahmini bitiş <b>" + saatYaz(Date.now() + dk * DAKIKA) + "</b>";
    } else $("#gorevOzet").textContent = acik.length ? "Açık görevlerin tahmini seanslarını doldurdun." : "Tüm görevler tamam. Güzel iş.";
    simdikiCiz();
  }
  function simdikiCiz() {
    var g = gorevBul(S.secili);
    if (g && !g.tamam) {
      $("#simdikiUst").textContent = "Şimdi odaklanılan";
      $("#simdikiAd").textContent = g.ad;
      $("#simdikiPom").innerHTML = pomHtml(g);
    } else {
      $("#simdikiUst").textContent = "Görev seçilmedi";
      $("#simdikiAd").textContent = "Listeden bir göreve dokun";
      $("#simdikiPom").innerHTML = "";
    }
  }
  function siradakiSec() { var a = S.gorevler.filter(function (g) { return !g.tamam; })[0]; S.secili = a ? a.id : null; }
  $("#gorevListe").addEventListener("click", function (e) {
    var li = e.target.closest(".gorev"); if (!li) return;
    var g = gorevBul(li.getAttribute("data-id")); if (!g) return;
    if (e.target.closest(".tik")) {
      g.tamam = !g.tamam;
      if (g.tamam && S.secili === g.id) siradakiSec();
      if (!g.tamam && !S.secili) S.secili = g.id;
      if (g.tamam) duyur("“" + g.ad + "” tamamlandı.");
    } else if (e.target.closest(".sil")) {
      S.gorevler = S.gorevler.filter(function (x) { return x.id !== g.id; });
      if (S.secili === g.id) siradakiSec();
    } else if (e.target.closest(".gorev-ad")) {
      if (g.tamam) { g.tamam = false; }
      S.secili = g.id;
    }
    kaydet(); gorevleriCiz();
  });
  $("#gorevForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var inp = $("#gorevAd"), ad = inp.value.trim();
    if (!ad) { inp.focus(); return; }
    var g = { id: kimlik(), ad: ad.slice(0, 80), tahmin: tahmin, biten: 0, tamam: false };
    S.gorevler.push(g);
    if (!gorevBul(S.secili) || gorevBul(S.secili).tamam) S.secili = g.id;
    inp.value = ""; tahmin = 2; $("#tahmin").textContent = tahmin;
    kaydet(); gorevleriCiz();
    var ul = $("#gorevListe"); ul.scrollTop = ul.scrollHeight;
  });
  $$(".tahmin button").forEach(function (b) {
    b.addEventListener("click", function () { tahmin = Math.max(1, Math.min(8, tahmin + Number(b.getAttribute("data-d")))); $("#tahmin").textContent = tahmin; });
  });
  $("#temizle").addEventListener("click", function () {
    var n = S.gorevler.filter(function (g) { return g.tamam; }).length;
    S.gorevler = S.gorevler.filter(function (g) { return !g.tamam; });
    if (!gorevBul(S.secili)) siradakiSec();
    kaydet(); gorevleriCiz(); duyur(n + " biten görev temizlendi.");
  });
  $("#simdiki").addEventListener("click", function () {
    var hedef = $(".gorev.secili") || $("#gorevAd");
    hedef.scrollIntoView({ behavior: "smooth", block: "center" });
    if (!S.secili) setTimeout(function () { $("#gorevAd").focus(); }, 300);
  });

  /* ---------- istatistik ---------- */
  var aralik = "hafta";
  function seri() {
    var gunler = {};
    S.gecmis.forEach(function (s) { gunler[gunBasi(s.t)] = 1; });
    var g = gunBasi(Date.now()), n = 0;
    if (!gunler[g]) g = gunEkle(g, -1);
    while (gunler[g]) { n++; g = gunEkle(g, -1); }
    return n;
  }
  function haftaVerisi() {
    var bugun = gunBasi(Date.now()), dizi = [];
    for (var i = 6; i >= 0; i--) {
      var bas = gunEkle(bugun, -i), son = gunEkle(bas, 1), dk = 0, adet = 0;
      S.gecmis.forEach(function (s) { if (s.t >= bas && s.t < son) { dk += s.dk; adet++; } });
      var d = new Date(bas);
      dizi.push({ etiket: i === 0 ? "Bugün" : GUN_KISA[d.getDay()], baslik: i === 0 ? "Bugün" : i === 1 ? "Dün" : d.getDate() + " " + AYLAR[d.getMonth()] + " " + GUN_UZUN[d.getDay()], dk: dk, adet: adet, vurgu: i === 0 });
    }
    return dizi;
  }
  function gunVerisi() {
    var bugun = gunBasi(Date.now()), dizi = [], simdiSaat = new Date().getHours();
    for (var h = 7; h <= 23; h++) {
      var bas = bugun + h * 3600000, son = bas + 3600000, dk = 0, adet = 0;
      S.gecmis.forEach(function (s) {
        var b = s.t - s.dk * DAKIKA, ortak = Math.min(s.t, son) - Math.max(b, bas);
        if (ortak > 0) { dk += ortak / DAKIKA; if (s.t >= bas && s.t < son) adet++; }
      });
      dizi.push({ etiket: h % 3 === 1 ? iki(h) : "", baslik: iki(h) + ":00 ile " + iki(h + 1 === 24 ? 0 : h + 1) + ":00 arası", dk: dk, adet: adet, vurgu: h === simdiSaat });
    }
    return dizi;
  }
  function istatistikCiz() {
    var bugun = gunBasi(Date.now()), bugunDk = 0, bugunAdet = 0;
    S.gecmis.forEach(function (s) { if (s.t >= bugun) { bugunDk += s.dk; bugunAdet++; } });
    var sr = seri();
    $("#sBugun").textContent = sureYaz(bugunDk);
    $("#sSeans").textContent = bugunAdet;
    $("#sSeri").textContent = sr + " gün";
    var oran = Math.min(100, Math.round((bugunDk / S.ayar.hedef) * 100));
    $("#hedefDolu").style.width = oran + "%";
    $("#hedefMetin").textContent = oran >= 100 ? "Günlük hedef tamam" : "Hedef " + sureYaz(S.ayar.hedef) + ", yüzde " + oran;
    grafikCiz();
  }
  function cubukYol(x, y, w, h) {
    var r = Math.min(4, w / 2, h);
    return "M" + x + " " + (y + h) + "V" + (y + r) + "Q" + x + " " + y + " " + (x + r) + " " + y + "H" + (x + w - r) + "Q" + (x + w) + " " + y + " " + (x + w) + " " + (y + r) + "V" + (y + h) + "Z";
  }
  function grafikCiz() {
    var svg = $("#grafik"), W = Math.max(240, Math.round(svg.getBoundingClientRect().width || 340)), H = 112, alt = 22, ust = 8, pay = aralik === "hafta" ? 46 : 0, PW = W - pay;
    var veri = aralik === "hafta" ? haftaVerisi() : gunVerisi();
    var enb = Math.max.apply(null, veri.map(function (v) { return v.dk; }));
    var tavan = aralik === "hafta" ? Math.max(enb, S.ayar.hedef) * 1.12 : 66;
    var cizH = H - alt - ust, taban = H - alt, bant = PW / veri.length, bw = Math.min(aralik === "hafta" ? 24 : 12, bant * .58);
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var s = '<title id="grafikAd">' + (aralik === "hafta" ? "Son 7 günün odak süresi" : "Bugün saat saat odak süresi") + '</title><defs><linearGradient id="grafikRenk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="d2"/><stop offset="1" class="d1"/></linearGradient></defs>';
    s += '<line class="taban" x1="0" x2="' + W + '" y1="' + (taban + .5) + '" y2="' + (taban + .5) + '"/>';
    if (aralik === "hafta") {
      var hy = Math.round(taban - (S.ayar.hedef / tavan) * cizH) + .5;
      s += '<line class="hedef-cizgi" x1="0" x2="' + (PW + 4) + '" y1="' + hy + '" y2="' + hy + '"/><text class="hedef-yazi" x="' + W + '" y="' + (hy + 4) + '" text-anchor="end">Hedef</text>';
    }
    veri.forEach(function (v, i) {
      var x = Math.round(i * bant + (bant - bw) / 2), h = v.dk > 0 ? Math.max(4, (v.dk / tavan) * cizH) : 3, y = taban - h;
      var ad = v.baslik + ": " + (v.dk ? sureYaz(v.dk) + ", " + v.adet + " seans" : "odak yok");
      s += '<g class="cubuk-grup" tabindex="0" data-i="' + i + '" aria-label="' + ad + '"><rect class="vurus" x="' + (i * bant) + '" y="0" width="' + bant + '" height="' + H + '"/>'
        + '<path class="cubuk' + (v.dk ? "" : " bos") + (v.vurgu && v.dk ? " vurgu" : "") + '" d="' + cubukYol(x, y, bw, h) + '"/></g>';
      if (v.etiket) s += '<text class="eksen' + (v.vurgu && aralik === "hafta" ? " bugun" : "") + '" x="' + (i * bant + bant / 2) + '" y="' + (H - 5) + '" text-anchor="middle">' + v.etiket + "</text>";
    });
    svg.innerHTML = s;
    var toplam = veri.reduce(function (a, v) { return a + v.dk; }, 0), gunSay = veri.filter(function (v) { return v.dk > 0; }).length;
    if (aralik === "hafta") $("#grafikAlt").innerHTML = "<span>Toplam <b>" + sureYaz(toplam) + "</b></span><span>Günlük ortalama <b>" + sureYaz(toplam / 7) + "</b></span><span>Aktif <b>" + gunSay + " gün</b></span>";
    else {
      var enIyi = veri.reduce(function (a, v, i) { return v.dk > a.dk ? { dk: v.dk, i: i } : a; }, { dk: 0, i: -1 });
      $("#grafikAlt").innerHTML = "<span>Bugün <b>" + sureYaz(toplam) + "</b></span><span>En verimli saat <b>" + (enIyi.i >= 0 ? iki(enIyi.i + 7) + ":00" : "henüz yok") + "</b></span>";
    }
    $("#grafikTablo").innerHTML = "<caption>" + (aralik === "hafta" ? "Son 7 gün" : "Bugün") + "</caption><tr><th>Zaman</th><th>Odak</th><th>Seans</th></tr>" + veri.map(function (v) { return "<tr><td>" + v.baslik + "</td><td>" + sureYaz(v.dk) + "</td><td>" + v.adet + "</td></tr>"; }).join("");
    grafikVeri = veri; grafikBant = bant; grafikW = W;
  }
  var grafikVeri = [], grafikBant = 0, grafikW = 0;
  function ipucuGoster(i) {
    var v = grafikVeri[i]; if (!v) return;
    var ip = $("#ipucu"), kap = $("#grafikKap"), olcek = kap.clientWidth / grafikW;
    ip.innerHTML = "<b>" + v.baslik + "</b><span>" + (v.dk ? sureYaz(v.dk) + " odak · " + v.adet + " seans" : "Odak kaydı yok") + "</span>";
    var x = (i + .5) * grafikBant * olcek;
    x = Math.max(70, Math.min(kap.clientWidth - 70, x));
    ip.style.left = x + "px"; ip.style.top = "0px";
    ip.classList.add("acik");
  }
  function ipucuGizle() { $("#ipucu").classList.remove("acik"); }
  $("#grafik").addEventListener("mouseover", function (e) { var g = e.target.closest(".cubuk-grup"); if (g) ipucuGoster(Number(g.getAttribute("data-i"))); });
  $("#grafik").addEventListener("mouseleave", ipucuGizle);
  $("#grafik").addEventListener("focusin", function (e) { var g = e.target.closest(".cubuk-grup"); if (g) ipucuGoster(Number(g.getAttribute("data-i"))); });
  $("#grafik").addEventListener("focusout", ipucuGizle);
  $$(".mini-segment button").forEach(function (b) {
    b.addEventListener("click", function () {
      aralik = b.getAttribute("data-aralik");
      $$(".mini-segment button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      ipucuGizle(); grafikCiz();
    });
  });

  /* ---------- tema ---------- */
  var sistemKoyu = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function temaUygula() {
    var t = S.ayar.tema === "sistem" ? (sistemKoyu && !sistemKoyu.matches ? "acik" : "koyu") : S.ayar.tema;
    kok.setAttribute("data-tema", t);
    var meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute("content", t === "acik" ? "#f4f2ed" : "#0c0d10");
  }
  if (sistemKoyu && sistemKoyu.addEventListener) sistemKoyu.addEventListener("change", function () { if (S.ayar.tema === "sistem") temaUygula(); });
  function temaDegistir() {
    S.ayar.tema = kok.getAttribute("data-tema") === "koyu" ? "acik" : "koyu";
    kaydet(); temaUygula(); ayarlariCiz();
  }

  /* ---------- ayarlar ---------- */
  var IKON_EKSI = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg>', IKON_ARTI = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v12M6 12h12"/></svg>';
  function adimciYazi(ad, v) { return ad === "aralik" ? v + " seans" : ad === "hedef" ? sureYaz(v) : v + " dk"; }
  $$(".adimci").forEach(function (el) {
    var ad = el.getAttribute("data-ayar");
    el.innerHTML = '<button type="button" data-d="-1" aria-label="Azalt">' + IKON_EKSI + '</button><output aria-live="polite"></output><button type="button" data-d="1" aria-label="Artır">' + IKON_ARTI + "</button>";
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var min = Number(el.getAttribute("data-min")), max = Number(el.getAttribute("data-max")), adim = Number(el.getAttribute("data-adim"));
      S.ayar[ad] = Math.max(min, Math.min(max, S.ayar[ad] + adim * Number(b.getAttribute("data-d"))));
      if (S.z.durum === "bos" && ad === S.z.mod) { S.z.toplam = sureMs(ad); S.z.kalan = S.z.toplam; durumCiz(); halkaCiz(S.z.kalan); }
      kaydet(); ayarlariCiz(); donguCiz(); gorevleriCiz(); istatistikCiz();
    });
  });
  $$(".secenekler").forEach(function (el) {
    var ad = el.getAttribute("data-ayar");
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      S.ayar[ad] = b.getAttribute("data-deger");
      kaydet(); ayarlariCiz();
      if (ad === "tema") temaUygula();
      if (ad === "ses") cal(S.ayar.ses);
      if (ad === "arka") arkaSes(true);
    });
  });
  $$('input.anahtar[data-ayar]').forEach(function (el) {
    el.addEventListener("change", function () { S.ayar[el.getAttribute("data-ayar")] = el.checked; kaydet(); });
  });
  var duzeyGirdi = $('input[data-ayar="duzey"]');
  duzeyGirdi.addEventListener("input", function () {
    S.ayar.duzey = Number(duzeyGirdi.value); $("#duzeyMetin").textContent = "Yüzde " + S.ayar.duzey;
    if (arka) arka.kazanc.gain.setTargetAtTime(Math.pow(S.ayar.duzey / 100, 1.6) * .35, arka.c.currentTime, .1);
    kaydet();
  });
  $("#dinle").addEventListener("click", function () { cal(S.ayar.ses === "kapali" ? "kase" : S.ayar.ses); });
  $("#bildirimAnahtar").addEventListener("change", function () {
    var el = this, not = $("#bildirimNot");
    if (!el.checked) { S.ayar.bildirim = false; kaydet(); not.textContent = "Seans bitince sekme kapalıyken de haber verir"; return; }
    function olmadi() { el.checked = false; S.ayar.bildirim = false; kaydet(); not.textContent = "Tarayıcı bu sayfada bildirim izni vermiyor; bitişte ses ve ekran uyarısı çıkar."; }
    try {
      if (!("Notification" in window) || window.origin === "null") { olmadi(); return; }
      if (Notification.permission === "granted") { S.ayar.bildirim = true; kaydet(); not.textContent = "Bildirimler açık"; return; }
      Promise.resolve(Notification.requestPermission()).then(function (p) {
        if (p === "granted") { S.ayar.bildirim = true; kaydet(); not.textContent = "Bildirimler açık"; } else olmadi();
      }, olmadi);
    } catch (e) { olmadi(); }
  });
  function ayarlariCiz() {
    $$(".adimci").forEach(function (el) {
      var ad = el.getAttribute("data-ayar"), v = S.ayar[ad], bt = el.querySelectorAll("button");
      el.querySelector("output").textContent = adimciYazi(ad, v);
      bt[0].disabled = v <= Number(el.getAttribute("data-min"));
      bt[1].disabled = v >= Number(el.getAttribute("data-max"));
    });
    $$(".secenekler").forEach(function (el) {
      var v = S.ayar[el.getAttribute("data-ayar")];
      el.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-deger") === v)); });
    });
    $$('input.anahtar[data-ayar]').forEach(function (el) { el.checked = !!S.ayar[el.getAttribute("data-ayar")]; });
    $("#bildirimAnahtar").checked = !!S.ayar.bildirim;
    duzeyGirdi.value = S.ayar.duzey; $("#duzeyMetin").textContent = "Yüzde " + S.ayar.duzey;
  }
  var silZaman = 0;
  $("#hepsiniSil").addEventListener("click", function () {
    var b = this;
    if (!b.classList.contains("emin")) {
      b.classList.add("emin"); b.textContent = "Emin misin?";
      clearTimeout(silZaman); silZaman = setTimeout(function () { b.classList.remove("emin"); b.textContent = "Sil"; }, 3500);
      return;
    }
    clearTimeout(silZaman); b.classList.remove("emin"); b.textContent = "Sil";
    arkaSes(false); S = bosVeri(); kaydet(); hepsiniCiz(); duyur("Tüm veriler silindi.");
  });
  $("#ornekYukle").addEventListener("click", function () { arkaSes(false); S = ornekVeri(); kaydet(); hepsiniCiz(); duyur("Örnek görevler ve geçmiş yüklendi."); });

  function pencereAc(id) {
    var d = document.getElementById(id);
    $$("dialog[open]").forEach(function (x) { if (x !== d) x.close(); });
    if (!d.open) { if (id === "ayarlar") ayarlariCiz(); d.showModal(); }
  }
  $$("dialog").forEach(function (d) { d.addEventListener("click", function (e) { if (e.target === d) d.close(); }); });
  $("#ayarDugme").addEventListener("click", function () { pencereAc("ayarlar"); });
  $("#kisayolDugme").addEventListener("click", function () { pencereAc("kisayollar"); });
  $("#temaDugme").addEventListener("click", temaDegistir);
  function sadeDegistir() { document.body.classList.toggle("sade"); var acik = document.body.classList.contains("sade"); duyur(acik ? "Sade görünüm açık. Çıkmak için F." : "Sade görünüm kapandı."); setTimeout(kayarCiz, 50); }
  $("#sadeDugme").addEventListener("click", sadeDegistir);

  /* ---------- düğmeler ve kısayollar ---------- */
  $("#baslat").addEventListener("click", degistir);
  $("#sifirla").addEventListener("click", sifirla);
  $("#atla").addEventListener("click", atla);
  $$("#modSecici [data-mod]").forEach(function (b) {
    b.addEventListener("click", function () { if (b.getAttribute("data-mod") !== S.z.mod) modSec(b.getAttribute("data-mod")); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    var t = e.target, yaziyor = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    if (yaziyor) { if (e.key === "Escape") t.blur(); return; }
    if (document.querySelector("dialog[open]")) return;
    var k = (e.key || "").toLocaleLowerCase("tr-TR");
    if (k === " " || e.code === "Space") { e.preventDefault(); if (t && t.blur && t !== document.body) t.blur(); degistir(); }
    else if (k === "r") sifirla();
    else if (k === "s") atla();
    else if (k === "1") modSec("odak");
    else if (k === "2") modSec("kisa");
    else if (k === "3") modSec("uzun");
    else if (k === "n") { e.preventDefault(); var inp = $("#gorevAd"); inp.scrollIntoView({ block: "center", behavior: "smooth" }); inp.focus(); }
    else if (k === "t") temaDegistir();
    else if (k === "f") sadeDegistir();
    else if (k === ",") pencereAc("ayarlar");
    else if (k === "?" || (e.shiftKey && e.code === "Slash")) pencereAc("kisayollar");
    else if (k === "escape" && document.body.classList.contains("sade")) sadeDegistir();
  });

  var boyutZaman = 0;
  window.addEventListener("resize", function () { clearTimeout(boyutZaman); boyutZaman = setTimeout(function () { kayarCiz(); grafikCiz(); }, 80); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden && S.z.durum === "calisiyor") dongu(); });

  function hepsiniCiz() {
    temaUygula(); modCiz(); durumCiz(); gorevleriCiz(); istatistikCiz(); ayarlariCiz();
    if (S.z.durum === "calisiyor") { if (kalanMs() <= 0) bitir(); else dongu(); } else halkaCiz(kalanMs());
  }
  hepsiniCiz();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { kayarCiz(); grafikCiz(); });
  setInterval(function () { if (S.z.durum !== "calisiyor") gorevleriCiz(); }, 60000);
})();
`,
    "ikon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb98a"/><stop offset="1" stop-color="#ff7a59"/></linearGradient></defs><rect width="512" height="512" rx="116" fill="#0c0d10"/><circle cx="256" cy="256" r="150" fill="none" stroke="#ffffff" stroke-opacity=".12" stroke-width="40"/><path d="M256 106a150 150 0 1 1-142.7 103.6" fill="none" stroke="url(#a)" stroke-width="40" stroke-linecap="round"/><circle cx="256" cy="256" r="42" fill="url(#a)"/></svg>
`,
  },
};
