/* Şablon: Cep Bütçe — kişisel bütçe uygulaması: gelir/gider kaydı, aylık özet kartları, kategori halka grafiği, aylık çubuk grafik, kategori sınırları ve aşım uyarısı, arama/filtre, CSV dışa aktarma. Örnek verilerle açılır; veriler localStorage'da. */

export const CEP_BUTCE = {
  id: "cep-butce",
  ad: "Cep Bütçe",
  tur: "uygulama" as const,
  aciklama: "Gelir ve gider takibi, kategori sınırları, grafikler ve CSV dışa aktarma",
  kapak: "/gercek/build/sablon/cep-butce.webp",
  dosyalar: {
    "index.html": `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#f2f0e9" />
  <meta name="description" content="Cep Bütçe: gelir ve giderlerini kaydet, kategori sınırlarını izle, aylık özetini gör." />
  <title>Cep Bütçe</title>
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..700&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <header class="ust" id="ust">
    <div class="ust-ic">
      <a class="marka" href="#" aria-label="Cep Bütçe ana sayfa">
        <svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#0f3b2c" /><path d="M8 12.5c0-1.7 1.3-3 3-3h10.5c1.4 0 2.5 1.1 2.5 2.5v9c0 1.4-1.1 2.5-2.5 2.5H11c-1.7 0-3-1.3-3-3z" fill="none" stroke="#c9f26b" stroke-width="2" /><path d="M8 13.5h16" stroke="#c9f26b" stroke-width="2" /><circle cx="19.5" cy="18.5" r="1.8" fill="#c9f26b" /></svg>
        <span>Cep Bütçe</span>
      </a>
      <div class="ay-secici" aria-label="Ay seçimi">
        <button class="ok" id="oncekiAy" type="button" aria-label="Önceki ay" title="Önceki ay (sol ok)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6l-6 6 6 6" /></svg></button>
        <div class="ay-metin"><b id="ayAd">Ay</b><small id="ayAlt"></small></div>
        <button class="ok" id="sonrakiAy" type="button" aria-label="Sonraki ay" title="Sonraki ay (sağ ok)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6" /></svg></button>
      </div>
      <label class="arama">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>
        <span class="gizli">İşlem ara</span>
        <input id="ara" type="search" placeholder="İşlem, kategori ya da not ara" autocomplete="off" />
        <kbd aria-hidden="true">/</kbd>
      </label>
      <div class="ust-eylem">
        <button class="dugme hayalet" id="csvDugme" type="button" title="Bu ayın listelenen işlemlerini indir"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5v10.5M7.5 10.5 12 15l4.5-4.5M5 19.5h14" /></svg><span>CSV indir</span></button>
        <button class="dugme ana" id="ekleDugme" type="button" title="Yeni işlem (N)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5.5v13M5.5 12h13" /></svg><span>İşlem ekle</span></button>
      </div>
    </div>
  </header>

  <main class="sayfa">
    <div class="uyari" id="uyari" role="status" hidden></div>

    <section class="ozet-izgara" aria-label="Aylık özet">
      <article class="kart kahraman">
        <svg class="kahraman-desen" viewBox="0 0 220 220" aria-hidden="true"><circle cx="170" cy="40" r="48" /><circle cx="170" cy="40" r="78" /><circle cx="170" cy="40" r="108" /><circle cx="170" cy="40" r="138" /></svg>
        <div class="k-ust"><span id="netEtiket">Bu ay kalan</span><span class="k-rozet" id="tasarrufRozet">Tasarruf</span></div>
        <div class="k-tutar" id="netTutar">0 TL</div>
        <div class="k-oran">
          <div class="k-cubuk" aria-hidden="true"><span id="harcananCubuk"></span></div>
          <div class="k-oran-metin"><span>Gelirden harcanan pay</span><b id="harcananPay">%0</b></div>
        </div>
        <dl class="k-alt">
          <div><dt>En büyük kalem</dt><dd id="enBuyuk">Yok</dd></div>
          <div><dt>İşlem</dt><dd id="islemSayi">0</dd></div>
        </dl>
      </article>
      <article class="kart kpi" id="kpiGelir"></article>
      <article class="kart kpi" id="kpiGider"></article>
      <article class="kart kpi" id="kpiGunluk"></article>
    </section>

    <section class="grafik-izgara">
      <article class="kart dagilim" aria-labelledby="dagilimBaslik">
        <header class="kart-ust"><div><h2 id="dagilimBaslik">Harcama dağılımı</h2><p id="dagilimAlt">Kategorilere göre</p></div></header>
        <div class="dagilim-ic">
          <div class="halka-kap">
            <svg id="halka" viewBox="0 0 200 200" role="img" aria-label="Kategori harcama halka grafiği"></svg>
            <div class="halka-merkez" id="halkaMerkez"></div>
          </div>
          <ul class="lejant" id="lejant"></ul>
        </div>
        <div class="akis-alt" id="dagilimAlt2"></div>
      </article>
      <article class="kart akis" aria-labelledby="akisBaslik">
        <header class="kart-ust">
          <div><h2 id="akisBaslik">Gelir ve gider</h2><p>Son 6 ay, aya dokunarak geç</p></div>
          <ul class="seri-lejant"><li><i class="sw gelir"></i>Gelir</li><li><i class="sw gider"></i>Gider</li></ul>
        </header>
        <div class="cubuk-kap" id="cubukKap">
          <svg id="cubuklar" role="img" aria-label="Aylara göre gelir ve gider sütun grafiği"></svg>
          <div class="ipucu" id="ipucu"></div>
        </div>
        <div class="akis-alt" id="akisAlt"></div>
      </article>
    </section>

    <section class="alt-izgara">
      <article class="kart sinirlar" aria-labelledby="sinirBaslik">
        <header class="kart-ust">
          <div><h2 id="sinirBaslik">Bütçe sınırları</h2><p id="sinirAlt">Aylık kategori sınırları</p></div>
          <button class="dugme kucuk hayalet" id="sinirDuzenle" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5h4l10-10-4-4-10 10z" /><path d="M13 7l4 4" /></svg>Düzenle</button>
        </header>
        <ul class="sinir-liste" id="sinirListe"></ul>
      </article>

      <article class="kart islemler" aria-labelledby="islemBaslik">
        <header class="kart-ust">
          <div class="baslik-hap"><h2 id="islemBaslik">İşlemler</h2><span class="hap" id="islemHap">0</span></div>
          <button class="metin-dugme" id="filtreTemizle" type="button" hidden>Filtreyi temizle</button>
        </header>
        <div class="filtreler">
          <div class="cipler" role="group" aria-label="İşlem türü">
            <button type="button" data-tur="tumu" aria-pressed="true">Tümü</button>
            <button type="button" data-tur="gider" aria-pressed="false">Gider</button>
            <button type="button" data-tur="gelir" aria-pressed="false">Gelir</button>
          </div>
          <label class="secim">
            <span class="gizli">Kategori</span>
            <select id="katFiltre"><option value="">Tüm kategoriler</option></select>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" /></svg>
          </label>
        </div>
        <div class="islem-liste" id="islemListe"></div>
      </article>
    </section>

    <p class="dip">Veriler yalnız bu tarayıcıda saklanır. Kısayollar: <kbd>N</kbd> yeni işlem, <kbd>/</kbd> arama, sol ve sağ ok tuşları ay değiştirir.</p>
  </main>

  <button class="fab" id="fab" type="button" aria-label="İşlem ekle"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5.5v13M5.5 12h13" /></svg></button>

  <dialog class="pencere" id="islemPencere" aria-labelledby="islemPencereBaslik">
    <form method="dialog" id="islemForm" novalidate>
      <header class="pencere-ust"><h2 id="islemPencereBaslik">Yeni işlem</h2><button class="kapat" value="iptal" formnovalidate aria-label="Kapat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></svg></button></header>
      <div class="tur-secici" role="radiogroup" aria-label="İşlem türü">
        <label><input type="radio" name="tur" value="gider" checked /><span>Gider</span></label>
        <label><input type="radio" name="tur" value="gelir" /><span>Gelir</span></label>
      </div>
      <label class="tutar-alan">
        <span>Tutar</span>
        <span class="tutar-kutu"><input id="tutarGirdi" name="tutar" inputmode="decimal" placeholder="0" autocomplete="off" /><b>TL</b></span>
      </label>
      <fieldset class="kat-alan">
        <legend>Kategori</legend>
        <div class="kat-izgara" id="katSecenek"></div>
      </fieldset>
      <div class="iki-alan">
        <label class="alan"><span>Tarih</span><input type="date" name="tarih" id="tarihGirdi" /></label>
        <label class="alan"><span>Not</span><input name="not" id="notGirdi" maxlength="60" placeholder="Örneğin haftalık market" /></label>
      </div>
      <p class="form-hata" id="formHata" role="alert"></p>
      <footer class="pencere-alt">
        <button type="button" class="dugme tehlike" id="islemSil" hidden>Sil</button>
        <span class="bosluk"></span>
        <button class="dugme hayalet" value="iptal" formnovalidate>Vazgeç</button>
        <button class="dugme ana" value="kaydet" type="submit">Kaydet</button>
      </footer>
    </form>
  </dialog>

  <dialog class="pencere" id="sinirPencere" aria-labelledby="sinirPencereBaslik">
    <form method="dialog" id="sinirForm">
      <header class="pencere-ust"><h2 id="sinirPencereBaslik">Bütçe sınırları</h2><button class="kapat" value="iptal" aria-label="Kapat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></svg></button></header>
      <p class="pencere-aciklama">Her kategori için aylık harcama sınırı. Boş bırakılan kategori sınırsız sayılır; sınırın yüzde 85'i geçilince uyarı çıkar.</p>
      <div class="sinir-girdiler" id="sinirGirdiler"></div>
      <div class="veri-alan">
        <div><b>Veriler</b><small>Örnek veriler son 6 ayı gerçekçi işlemlerle doldurur.</small></div>
        <div class="veri-dugmeler"><button type="button" class="dugme kucuk hayalet" id="ornekYukle">Örnekleri yükle</button><button type="button" class="dugme kucuk tehlike" id="hepsiniSil">Tümünü sil</button></div>
      </div>
      <footer class="pencere-alt"><span class="bosluk"></span><button class="dugme hayalet" value="iptal">Vazgeç</button><button class="dugme ana" value="kaydet">Kaydet</button></footer>
    </form>
  </dialog>

  <div class="bildirim" id="bildirim" role="status" aria-live="polite"></div>

  <script src="app.js"></script>
</body>
</html>
`,
    "stil.css": `/* Cep Bütçe — kâğıt zemin, koyu yeşil mürekkep, limon vurgu. */
:root {
  --zemin: #f2f0e9;
  --kart: #ffffff;
  --kart-2: #f7f6f1;
  --cizgi: #e5e1d6;
  --cizgi-2: #eeebe3;
  --murekkep: #13221b;
  --metin-2: #4c5750;
  --metin-3: #687169;
  --marka: #0f3b2c;
  --marka-2: #175340;
  --limon: #c9f26b;
  --limon-2: #b5e64c;
  --iyi: #15744a;
  --iyi-zemin: #e6f4ea;
  --uyari: #8f5200;
  --uyari-zemin: #fff4dc;
  --uyari-cizgi: #f3dca9;
  --tehlike: #b3321f;
  --tehlike-zemin: #fdeeeb;
  --tehlike-cizgi: #f4cbc3;
  --seri-gelir: #3aa36b;
  --seri-gider: #163f31;
  --yumusak: cubic-bezier(.22, 1, .36, 1);
  --baslik: "Bricolage Grotesque", "Figtree", system-ui, sans-serif;
}
* { box-sizing: border-box; }
html { scroll-padding-top: 90px; }
body { margin: 0; min-height: 100vh; background: var(--zemin); color: var(--murekkep); font-family: "Figtree", system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 15px; line-height: 1.45; -webkit-font-smoothing: antialiased; }
button, input, select { font: inherit; color: inherit; }
button { cursor: pointer; -webkit-tap-highlight-color: transparent; }
svg { display: block; }
h1, h2, h3 { font-family: var(--baslik); letter-spacing: -.02em; }
[hidden] { display: none !important; }
.gizli { position: absolute !important; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
:focus-visible { outline: 2px solid var(--marka-2); outline-offset: 2px; }
kbd { display: inline-block; min-width: 22px; padding: 1px 6px; border-radius: 6px; border: 1px solid var(--cizgi); background: var(--kart); font-family: inherit; font-size: 12px; font-weight: 600; text-align: center; color: var(--metin-2); }

/* Üst çubuk */
.ust { position: sticky; top: 0; z-index: 20; background: rgba(242, 240, 233, .86); -webkit-backdrop-filter: blur(18px) saturate(140%); backdrop-filter: blur(18px) saturate(140%); border-bottom: 1px solid transparent; transition: border-color .25s; }
.ust.kaydi { border-bottom-color: var(--cizgi); }
.ust-ic { max-width: 1320px; margin: 0 auto; display: flex; align-items: center; gap: 14px; padding: 14px 28px; }
.marka { display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit; font-family: var(--baslik); font-weight: 700; font-size: 19px; letter-spacing: -.025em; margin-right: 6px; }
.marka svg { width: 32px; height: 32px; }
.ay-secici { display: flex; align-items: center; gap: 2px; padding: 4px; border-radius: 14px; background: var(--kart); border: 1px solid var(--cizgi); }
.ok { width: 34px; height: 34px; display: grid; place-items: center; border: 0; border-radius: 10px; background: none; color: var(--metin-2); transition: background .2s, color .2s; }
.ok:hover { background: var(--kart-2); color: var(--murekkep); }
.ok:disabled { opacity: .3; pointer-events: none; }
.ok svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ay-metin { min-width: 116px; text-align: center; display: flex; flex-direction: column; line-height: 1.15; }
.ay-metin b { font-weight: 600; font-size: 14.5px; }
.ay-metin small { font-size: 11.5px; color: var(--metin-3); }
.arama { position: relative; flex: 1; max-width: 400px; margin-left: auto; display: flex; align-items: center; }
.arama > svg { position: absolute; left: 13px; width: 17px; height: 17px; fill: none; stroke: var(--metin-3); stroke-width: 1.9; stroke-linecap: round; pointer-events: none; }
.arama input { width: 100%; height: 44px; padding: 0 40px 0 40px; border-radius: 13px; border: 1px solid var(--cizgi); background: var(--kart); outline: none; transition: border-color .2s; }
.arama input::placeholder { color: var(--metin-3); }
.arama input:focus { border-color: var(--marka-2); }
.arama input::-webkit-search-cancel-button { display: none; }
.arama kbd { position: absolute; right: 10px; pointer-events: none; }
.ust-eylem { display: flex; gap: 8px; }
.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 44px; padding: 0 16px; border-radius: 13px; border: 1px solid transparent; font-weight: 600; font-size: 14.5px; white-space: nowrap; transition: background .2s, border-color .2s, transform .2s var(--yumusak), color .2s; }
.dugme svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.dugme:active { transform: scale(.97); }
.dugme.ana { background: var(--marka); color: #fff; }
.dugme.ana svg { stroke: var(--limon); }
.dugme.ana:hover { background: var(--marka-2); }
.dugme.hayalet { background: var(--kart); border-color: var(--cizgi); color: var(--murekkep); }
.dugme.hayalet:hover { border-color: #cfcabc; background: #fbfaf6; }
.dugme.tehlike { background: var(--tehlike-zemin); color: var(--tehlike); border-color: var(--tehlike-cizgi); }
.dugme.tehlike:hover { background: #fbe2dd; }
.dugme.tehlike.emin { background: var(--tehlike); color: #fff; border-color: transparent; }
.dugme.kucuk { height: 36px; padding: 0 12px; border-radius: 11px; font-size: 13.5px; }
.dugme.kucuk svg { width: 16px; height: 16px; }
.metin-dugme { border: 0; background: none; padding: 6px 8px; border-radius: 8px; font-size: 13.5px; font-weight: 600; color: var(--marka-2); }
.metin-dugme:hover { background: var(--kart-2); }

/* Sayfa */
.sayfa { max-width: 1320px; margin: 0 auto; padding: 6px 28px 40px; display: flex; flex-direction: column; gap: 16px; }
.kart { background: var(--kart); border: 1px solid var(--cizgi); border-radius: 22px; padding: 20px; min-width: 0; }
.kart-ust { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.kart-ust h2 { margin: 0; font-size: 18px; font-weight: 600; }
.kart-ust p { margin: 2px 0 0; font-size: 13px; color: var(--metin-3); }
.hap { display: inline-flex; align-items: center; height: 24px; padding: 0 9px; border-radius: 999px; background: var(--kart-2); border: 1px solid var(--cizgi); font-size: 12.5px; font-weight: 600; color: var(--metin-2); }
.baslik-hap { display: flex; align-items: center; gap: 8px; }

/* Uyarı şeridi */
.uyari { display: flex; align-items: center; gap: 12px; padding: 12px 14px 12px 14px; border-radius: 16px; background: var(--tehlike-zemin); border: 1px solid var(--tehlike-cizgi); color: #5f1d12; font-size: 14px; animation: belir .5s var(--yumusak); }
.uyari.sari { background: var(--uyari-zemin); border-color: var(--uyari-cizgi); color: #523000; }
.uyari .u-ikon { flex: none; width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; background: rgba(179, 50, 31, .1); color: var(--tehlike); }
.uyari.sari .u-ikon { background: rgba(143, 82, 0, .1); color: var(--uyari); }
.uyari .u-ikon svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.uyari p { margin: 0; flex: 1; }
.uyari b { font-weight: 600; }
@keyframes belir { from { opacity: 0; transform: translateY(-6px); } }

/* Özet */
.ozet-izgara { display: grid; grid-template-columns: 1.45fr 1fr 1fr 1fr; gap: 16px; }
.kahraman { position: relative; overflow: hidden; background: var(--marka); border-color: var(--marka); color: #eef5ef; display: flex; flex-direction: column; gap: 10px; padding: 20px 22px; }
.kahraman-desen { position: absolute; right: -40px; top: -40px; width: 260px; height: 260px; pointer-events: none; }
.kahraman-desen circle { fill: none; stroke: var(--limon); stroke-opacity: .13; stroke-width: 1.2; }
.k-ust { position: relative; display: flex; justify-content: space-between; align-items: center; gap: 10px; font-size: 14px; color: #b9d0c3; }
.k-rozet { display: inline-flex; align-items: center; height: 26px; padding: 0 10px; border-radius: 999px; background: var(--limon); color: var(--marka); font-weight: 700; font-size: 12.5px; }
.k-rozet.kotu { background: #ffb4a5; color: #4a120a; }
.k-tutar { position: relative; font-family: var(--baslik); font-weight: 600; font-size: 46px; line-height: 1.02; letter-spacing: -.035em; color: #fff; }
.k-tutar small { font-size: 22px; font-weight: 500; color: var(--limon); letter-spacing: -.01em; margin-left: 4px; }
.k-oran { position: relative; display: flex; flex-direction: column; gap: 7px; margin-top: 2px; }
.k-cubuk { height: 8px; border-radius: 4px; background: rgba(255, 255, 255, .14); overflow: hidden; }
.k-cubuk span { display: block; height: 100%; width: 0; border-radius: 4px; background: var(--limon); transition: width .9s var(--yumusak); }
.k-cubuk span.asti { background: #ffb4a5; }
.k-oran-metin { display: flex; justify-content: space-between; font-size: 13px; color: #b9d0c3; }
.k-oran-metin b { color: #fff; font-weight: 600; }
.k-alt { position: relative; display: grid; grid-template-columns: 1fr auto; gap: 16px; margin: auto 0 0; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, .12); }
.k-alt dt { font-size: 12px; color: #9fbbac; }
.k-alt dd { margin: 1px 0 0; font-weight: 600; font-size: 14.5px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.kpi { display: flex; flex-direction: column; gap: 4px; padding: 18px 18px 14px; position: relative; overflow: hidden; }
.kpi-ust { display: flex; align-items: center; gap: 9px; font-size: 14px; color: var(--metin-2); font-weight: 500; }
.kpi-ikon { width: 30px; height: 30px; border-radius: 10px; display: grid; place-items: center; background: var(--kart-2); border: 1px solid var(--cizgi-2); }
.kpi-ikon svg { width: 17px; height: 17px; fill: none; stroke: var(--marka-2); stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.kpi-deger { font-family: var(--baslik); font-weight: 600; font-size: 28px; letter-spacing: -.03em; margin-top: 8px; line-height: 1.1; white-space: nowrap; }
.kpi-deger small { font-size: 16px; font-weight: 500; color: var(--metin-3); margin-left: 3px; }
.kpi-not { font-size: 12.5px; color: var(--metin-3); min-height: 18px; }
.delta { display: inline-flex; align-items: center; gap: 3px; font-weight: 600; padding: 1px 7px 1px 5px; border-radius: 999px; margin-right: 4px; }
.delta svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.delta.iyi { background: var(--iyi-zemin); color: var(--iyi); }
.delta.kotu { background: var(--tehlike-zemin); color: var(--tehlike); }
.delta.notr { background: var(--kart-2); color: var(--metin-2); }
.spark-kap { flex: 1; display: flex; flex-direction: column; gap: 6px; margin-top: 12px; min-height: 66px; }
.spark-ic { position: relative; flex: 1; min-height: 40px; }
.spark-ic svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.spark-nokta { position: absolute; right: -4px; width: 9px; height: 9px; border-radius: 50%; background: var(--marka-2); border: 2px solid #fff; transform: translateY(-50%); }
.spark-ay { display: flex; justify-content: space-between; font-size: 11.5px; color: var(--metin-3); }
.spark .cizgi { fill: none; stroke: var(--marka-2); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.spark .alan { fill: var(--marka-2); opacity: .08; }
.spark .uc { fill: var(--marka-2); stroke: #fff; stroke-width: 2; }

/* Grafikler */
.grafik-izgara { display: grid; grid-template-columns: 5fr 7fr; gap: 16px; }
.dagilim-ic { display: grid; grid-template-columns: 196px 1fr; gap: 22px; align-items: center; }
.halka-kap { position: relative; width: 196px; height: 196px; }
#halka { width: 100%; height: 100%; overflow: visible; }
#halka .dilim { fill: none; stroke-width: 24; cursor: pointer; transition: stroke-width .25s var(--yumusak), opacity .25s; }
#halka .dilim:hover, #halka .dilim.etkin { stroke-width: 30; }
#halka.odakli .dilim:not(.etkin) { opacity: .28; }
#halka .bos-halka { fill: none; stroke: var(--cizgi-2); stroke-width: 24; }
.halka-merkez { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; pointer-events: none; padding: 0 40px; }
.halka-merkez small { font-size: 12.5px; color: var(--metin-3); line-height: 1.2; }
.halka-merkez b { font-family: var(--baslik); font-weight: 600; font-size: 21px; letter-spacing: -.03em; line-height: 1.2; margin-top: 2px; white-space: nowrap; }
.halka-merkez span { font-size: 12.5px; color: var(--metin-2); font-weight: 500; }
.lejant { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.lejant button { width: 100%; display: grid; grid-template-columns: 12px minmax(0, 1fr) auto auto; align-items: center; gap: 10px; padding: 7px 8px; border: 0; border-radius: 10px; background: none; text-align: left; font-size: 14px; transition: background .15s; }
.lejant button:hover, .lejant button.etkin { background: var(--kart-2); }
.lejant .sw { width: 12px; height: 12px; border-radius: 4px; }
.lejant .ad { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lejant .pay { font-size: 12.5px; color: var(--metin-3); font-variant-numeric: tabular-nums; }
.lejant .tutar { font-weight: 600; font-variant-numeric: tabular-nums; min-width: 84px; text-align: right; }
.lejant .bos { color: var(--metin-3); font-size: 14px; padding: 8px; }

.seri-lejant { list-style: none; margin: 4px 0 0; padding: 0; display: flex; gap: 14px; font-size: 13px; color: var(--metin-2); }
.seri-lejant li { display: flex; align-items: center; gap: 6px; }
.sw { display: inline-block; width: 10px; height: 10px; border-radius: 3px; }
.sw.gelir { background: var(--seri-gelir); }
.sw.gider { background: var(--seri-gider); }
.cubuk-kap { position: relative; }
#cubuklar { width: 100%; height: 232px; overflow: visible; }
#cubuklar .izgara { stroke: var(--cizgi-2); stroke-width: 1; }
#cubuklar .taban { stroke: #d6d1c3; stroke-width: 1; }
#cubuklar .eksen { fill: var(--metin-3); font-size: 11.5px; font-family: inherit; }
#cubuklar .eksen-x { fill: var(--metin-2); font-size: 12.5px; font-family: inherit; font-weight: 500; }
#cubuklar .eksen-x.secili { fill: var(--murekkep); font-weight: 700; }
#cubuklar .bant { fill: transparent; transition: fill .2s; }
#cubuklar .grup { cursor: pointer; outline: none; }
#cubuklar .grup:hover .bant, #cubuklar .grup:focus-visible .bant { fill: #f7f5ef; }
#cubuklar .grup.secili .bant { fill: #eef6d9; }
#cubuklar .gelir { fill: var(--seri-gelir); }
#cubuklar .gider { fill: var(--seri-gider); }
#cubuklar .deger { fill: var(--murekkep); font-size: 11.5px; font-weight: 600; font-family: inherit; }
.ipucu { position: absolute; z-index: 5; pointer-events: none; min-width: 180px; padding: 10px 12px; border-radius: 13px; background: var(--murekkep); color: #fff; font-size: 13px; line-height: 1.5; opacity: 0; transform: translate(-50%, -4px); transition: opacity .15s, transform .15s; }
.ipucu.acik { opacity: 1; transform: translate(-50%, -10px); }
.ipucu b { display: block; font-size: 13.5px; margin-bottom: 2px; }
.ipucu .sat { display: flex; align-items: center; gap: 8px; }
.ipucu .sat span:last-child { margin-left: auto; font-weight: 600; font-variant-numeric: tabular-nums; }
.ipucu .sw.gider { background: #7fae98; }
.akis-alt { display: flex; flex-wrap: wrap; gap: 6px 22px; margin-top: 10px; padding-top: 12px; border-top: 1px solid var(--cizgi-2); font-size: 13px; color: var(--metin-3); }
.akis-alt b { color: var(--murekkep); font-weight: 600; }
.dagilim, .akis { display: flex; flex-direction: column; }
.dagilim-ic { margin-bottom: 16px; }
.cubuk-kap { margin-bottom: 6px; }
.dagilim .akis-alt, .akis .akis-alt { margin-top: auto; }
.akis-alt .ipucu-not { margin-left: auto; }

/* Sınırlar */
.alt-izgara { display: grid; grid-template-columns: 5fr 7fr; gap: 16px; align-items: start; }
.sinir-liste { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.sinir { display: grid; grid-template-columns: 38px 1fr; gap: 5px 12px; align-items: center; padding: 11px 0; }
.sinir > .kat-ikon { grid-row: 1 / span 3; }
.sinir + .sinir { border-top: 1px solid var(--cizgi-2); }
.kat-ikon { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; }
.kat-ikon svg { width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-width: 1.85; stroke-linecap: round; stroke-linejoin: round; }
.kat-ikon svg .dolu { fill: currentColor; stroke: none; }
.sinir-ust { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
.sinir-ust b { font-weight: 600; font-size: 14.5px; }
.sinir-ust span { font-size: 13px; color: var(--metin-3); font-variant-numeric: tabular-nums; white-space: nowrap; }
.sinir-ust span strong { color: var(--murekkep); font-weight: 600; }
.metre { grid-column: 2; height: 8px; border-radius: 4px; background: #e9f1ec; overflow: hidden; }
.metre span { display: block; height: 100%; border-radius: 4px; background: var(--marka-2); width: 0; transition: width .8s var(--yumusak); }
.sinir.yakin .metre { background: #faefd8; }
.sinir.yakin .metre span { background: #d48a12; }
.sinir.asti .metre { background: #f9e1dc; }
.sinir.asti .metre span { background: var(--tehlike); }
.sinir-durum { grid-column: 2; display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--metin-3); }
.sinir-durum svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.sinir.yakin .sinir-durum { color: var(--uyari); font-weight: 600; }
.sinir.asti .sinir-durum { color: var(--tehlike); font-weight: 600; }
.sinir-bos { padding: 20px 4px; color: var(--metin-3); font-size: 14px; }

/* İşlemler */
.islemler .kart-ust { margin-bottom: 12px; align-items: center; }
.filtreler { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 8px; }
.cipler { display: flex; padding: 3px; border-radius: 12px; background: var(--kart-2); border: 1px solid var(--cizgi-2); }
.cipler button { border: 0; background: none; height: 32px; padding: 0 14px; border-radius: 9px; font-size: 13.5px; font-weight: 600; color: var(--metin-2); transition: background .2s, color .2s; }
.cipler button[aria-pressed="true"] { background: var(--kart); color: var(--murekkep); outline: 1px solid var(--cizgi); }
.secim { position: relative; display: flex; align-items: center; }
.secim select { -webkit-appearance: none; appearance: none; height: 38px; padding: 0 34px 0 12px; border-radius: 12px; border: 1px solid var(--cizgi); background: var(--kart); font-size: 13.5px; font-weight: 500; cursor: pointer; }
.secim svg { position: absolute; right: 10px; width: 16px; height: 16px; fill: none; stroke: var(--metin-3); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
.islem-liste { max-height: 620px; overflow-y: auto; margin: 0 -8px; padding: 0 8px; scrollbar-width: thin; }
.gun-baslik { position: sticky; top: 0; z-index: 1; display: flex; justify-content: space-between; align-items: center; padding: 10px 2px 6px; background: var(--kart); font-size: 12.5px; font-weight: 600; color: var(--metin-3); }
.gun-baslik span:last-child { font-variant-numeric: tabular-nums; }
.islem { width: 100%; display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 8px 8px; margin: 0 -8px; width: calc(100% + 16px); border: 0; border-radius: 14px; background: none; text-align: left; transition: background .15s; }
.islem:hover { background: var(--kart-2); }
.islem .kat-ikon { width: 40px; height: 40px; }
.islem-metin { display: flex; flex-direction: column; min-width: 0; }
.islem-metin b { font-weight: 600; font-size: 14.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.islem-metin small { font-size: 12.5px; color: var(--metin-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.islem-tutar { font-weight: 600; font-size: 14.5px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.islem-tutar.gelir { color: var(--iyi); }
.bos-durum { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 26px 10px 22px; }
.bos-durum svg { width: 132px; height: 92px; margin-bottom: 10px; }
.bos-durum b { font-family: var(--baslik); font-size: 17px; font-weight: 600; }
.bos-durum p { margin: 4px 0 14px; color: var(--metin-3); font-size: 14px; max-width: 320px; }
.bos-durum .eylemler { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.dip { margin: 4px 2px 0; font-size: 13px; color: var(--metin-3); }

/* Yüzen düğme */
.fab { display: none; position: fixed; z-index: 25; right: max(18px, env(safe-area-inset-right)); bottom: max(18px, env(safe-area-inset-bottom)); width: 60px; height: 60px; border-radius: 20px; border: 1px solid rgba(15, 59, 44, .25); background: var(--limon); color: var(--marka); place-items: center; transition: transform .25s var(--yumusak); }
.fab svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; }
.fab:active { transform: scale(.94); }

/* Pencereler */
.pencere { padding: 0; border: 1px solid var(--cizgi); border-radius: 24px; background: var(--kart); color: var(--murekkep); width: min(560px, calc(100vw - 24px)); max-height: calc(100dvh - 32px); }
.pencere::backdrop { background: rgba(19, 34, 27, .34); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
.pencere[open] { animation: ac .38s var(--yumusak); }
@keyframes ac { from { opacity: 0; transform: translateY(12px) scale(.98); } }
.pencere form { padding: 20px 22px 18px; display: flex; flex-direction: column; gap: 16px; }
.pencere-ust { display: flex; align-items: center; justify-content: space-between; }
.pencere-ust h2 { margin: 0; font-size: 21px; font-weight: 600; }
.kapat { width: 36px; height: 36px; display: grid; place-items: center; border: 0; border-radius: 11px; background: var(--kart-2); color: var(--metin-2); }
.kapat:hover { background: var(--cizgi-2); color: var(--murekkep); }
.kapat svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.tur-secici { display: grid; grid-template-columns: 1fr 1fr; padding: 4px; border-radius: 14px; background: var(--kart-2); border: 1px solid var(--cizgi-2); }
.tur-secici label { position: relative; cursor: pointer; }
.tur-secici input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
.tur-secici span { display: flex; align-items: center; justify-content: center; height: 40px; border-radius: 10px; font-weight: 600; font-size: 14.5px; color: var(--metin-2); transition: background .2s, color .2s; }
.tur-secici input:checked + span { background: var(--marka); color: #fff; }
.tur-secici input[value="gelir"]:checked + span { background: var(--iyi); }
.tur-secici input:focus-visible + span { outline: 2px solid var(--marka-2); outline-offset: 2px; }
.tutar-alan { display: flex; flex-direction: column; gap: 6px; }
.tutar-alan > span, .alan > span, .kat-alan legend { font-size: 13px; font-weight: 600; color: var(--metin-2); }
.tutar-kutu { display: flex; align-items: center; gap: 8px; padding: 0 16px; height: 64px; border-radius: 16px; border: 1px solid var(--cizgi); background: var(--kart); transition: border-color .2s; }
.tutar-kutu:focus-within { border-color: var(--marka-2); }
.tutar-kutu input { flex: 1; min-width: 0; border: 0; outline: none; background: none; font-family: var(--baslik); font-weight: 600; font-size: 32px; letter-spacing: -.03em; }
.tutar-kutu input::placeholder { color: #c9c4b6; }
.tutar-kutu b { font-family: var(--baslik); font-size: 20px; font-weight: 500; color: var(--metin-3); }
.kat-alan { border: 0; margin: 0; padding: 0; }
.kat-alan legend { padding: 0; margin-bottom: 8px; }
.kat-izgara { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 6px; }
.kat-izgara label { position: relative; cursor: pointer; }
.kat-izgara input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
.kat-izgara .kat-sec { display: flex; align-items: center; gap: 8px; padding: 6px 8px 6px 6px; border-radius: 12px; border: 1px solid var(--cizgi); font-size: 13.5px; font-weight: 500; transition: border-color .15s, background .15s; }
.kat-izgara .kat-ikon { width: 30px; height: 30px; border-radius: 9px; flex: none; }
.kat-izgara .kat-ikon svg { width: 16px; height: 16px; }
.kat-izgara label:hover .kat-sec { background: var(--kart-2); }
.kat-izgara input:checked + .kat-sec { border-color: var(--marka); background: #f1f7f2; outline: 1px solid var(--marka); }
.kat-izgara input:focus-visible + .kat-sec { outline: 2px solid var(--marka-2); outline-offset: 2px; }
.iki-alan { display: grid; grid-template-columns: 170px 1fr; gap: 10px; }
.alan { display: flex; flex-direction: column; gap: 6px; }
.alan input { height: 46px; padding: 0 12px; border-radius: 13px; border: 1px solid var(--cizgi); background: var(--kart); outline: none; }
.alan input:focus { border-color: var(--marka-2); }
.form-hata { margin: -6px 0 0; min-height: 0; font-size: 13.5px; font-weight: 600; color: var(--tehlike); }
.form-hata:empty { display: none; }
.pencere-alt { display: flex; align-items: center; gap: 8px; padding-top: 4px; }
.bosluk { flex: 1; }
.pencere-aciklama { margin: -6px 0 0; font-size: 14px; color: var(--metin-3); }
.sinir-girdiler { display: flex; flex-direction: column; border: 1px solid var(--cizgi); border-radius: 16px; overflow: hidden; }
.sinir-girdi { display: grid; grid-template-columns: 34px 1fr 150px; gap: 12px; align-items: center; padding: 8px 12px; }
.sinir-girdi + .sinir-girdi { border-top: 1px solid var(--cizgi-2); }
.sinir-girdi .kat-ikon { width: 34px; height: 34px; border-radius: 10px; }
.sinir-girdi .kat-ikon svg { width: 17px; height: 17px; }
.sinir-girdi label { font-weight: 500; font-size: 14.5px; }
.sinir-girdi small { display: block; font-size: 12px; color: var(--metin-3); }
.sinir-girdi .kutu { display: flex; align-items: center; height: 40px; border-radius: 11px; border: 1px solid var(--cizgi); padding: 0 10px; gap: 6px; }
.sinir-girdi .kutu:focus-within { border-color: var(--marka-2); }
.sinir-girdi input { width: 100%; min-width: 0; border: 0; outline: none; background: none; text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
.sinir-girdi input::placeholder { color: #a8a397; font-weight: 500; }
.sinir-girdi .kutu span { font-size: 13px; color: var(--metin-3); }
.veri-alan { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px; background: var(--kart-2); flex-wrap: wrap; }
.veri-alan b { display: block; font-size: 14.5px; font-weight: 600; }
.veri-alan small { font-size: 12.5px; color: var(--metin-3); }
.veri-dugmeler { display: flex; gap: 8px; }

/* Bildirim */
.bildirim { position: fixed; z-index: 40; left: 50%; bottom: max(24px, env(safe-area-inset-bottom)); display: flex; align-items: center; gap: 10px; max-width: calc(100vw - 32px); padding: 12px 18px 12px 14px; border-radius: 15px; background: var(--murekkep); color: #fff; font-size: 14px; font-weight: 500; opacity: 0; transform: translate(-50%, 14px); pointer-events: none; transition: opacity .3s var(--yumusak), transform .4s var(--yumusak); }
.bildirim::before { content: ""; flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--limon); }
.bildirim.uyar::before { background: #ffb4a5; }
.bildirim.acik { opacity: 1; transform: translate(-50%, 0); }

/* Duyarlılık */
@media (max-width: 1180px) {
  .ozet-izgara { grid-template-columns: repeat(3, 1fr); }
  .kahraman { grid-column: 1 / -1; }
  .grafik-izgara, .alt-izgara { grid-template-columns: 1fr 1fr; }
  .dagilim-ic { grid-template-columns: 1fr; justify-items: center; }
  .lejant { width: 100%; }
}
@media (max-width: 900px) {
  .ust-ic { flex-wrap: wrap; padding: 12px 18px; }
  .arama { order: 5; flex-basis: 100%; max-width: none; margin: 0; }
  .ust-eylem { margin-left: auto; }
  .ust-eylem #ekleDugme { display: none; }
  .fab { display: grid; }
  .sayfa { padding: 6px 18px 100px; }
  .grafik-izgara, .alt-izgara { grid-template-columns: 1fr; }
  .dagilim-ic { grid-template-columns: 196px 1fr; justify-items: stretch; }
}
@media (max-width: 640px) {
  .ust { position: relative; }
  .uyari { flex-wrap: wrap; }
  .uyari p { flex-basis: calc(100% - 44px); }
  .uyari .dugme { margin-left: 44px; }
  .akis-alt .ipucu-not { margin-left: 0; }
  .ust-ic { gap: 10px; padding: 10px 14px; }
  .marka span { display: none; }
  .marka { margin-right: 0; }
  .ay-secici { flex: 1; justify-content: space-between; }
  .ust-eylem .dugme span { display: none; }
  .ust-eylem .dugme { width: 44px; padding: 0; }
  .sayfa { padding: 4px 14px 100px; gap: 12px; }
  .ozet-izgara { grid-template-columns: 1fr 1fr; gap: 12px; }
  .ozet-izgara .kpi:last-child { grid-column: 1 / -1; }
  .kart { padding: 16px; border-radius: 20px; }
  .kahraman { padding: 18px; }
  .k-tutar { font-size: 40px; }
  .kpi { padding: 14px 14px 12px; }
  .kpi-deger { font-size: 22px; }
  .kpi-deger small { font-size: 13px; }
  .dagilim-ic { grid-template-columns: 1fr; justify-items: center; gap: 14px; }
  .islem-liste { max-height: none; }
  .iki-alan { grid-template-columns: 1fr; }
  .kat-izgara { grid-template-columns: 1fr 1fr; }
  .sinir-girdi { grid-template-columns: 34px 1fr 118px; }
  .pencere { width: 100vw; max-width: 100vw; max-height: 92dvh; margin: auto 0 0; border-radius: 24px 24px 0 0; border-bottom: 0; }
  .pencere form { padding: 18px 16px max(18px, env(safe-area-inset-bottom)); }
  .dip { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition-duration: .01ms !important; }
}
`,
    "app.js": `/* Cep Bütçe — gelir/gider kaydı, aylık özet, grafikler, kategori sınırları ve CSV. Veriler bu cihazda (localStorage) saklanır. */
(function () {
  "use strict";

  var ANAHTAR = "cep-butce-v1";
  var AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  var AYLAR_KISA = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  var GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

  /* Kategori renkleri renk körlüğü denetiminden geçmiş sırayla verildi; halka grafik bu sırayla çizilir. */
  var KAT = {
    ev: { ad: "Ev ve kira", tur: "gider", renk: "#178a5e", ikon: '<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z"/>' },
    fatura: { ad: "Faturalar", tur: "gider", renk: "#2a78d6", ikon: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>' },
    market: { ad: "Market", tur: "gider", renk: "#eb6834", ikon: '<path d="M3.5 4.5h2.2l2.1 10.2a1.2 1.2 0 0 0 1.2 1h7.6a1.2 1.2 0 0 0 1.2-.9l1.6-6.3H6.6"/><circle class="dolu" cx="9.5" cy="19.3" r="1.3"/><circle class="dolu" cx="16.8" cy="19.3" r="1.3"/>' },
    ulasim: { ad: "Ulaşım", tur: "gider", renk: "#6250d6", ikon: '<path d="M5 16.5V12l1.8-5a1.5 1.5 0 0 1 1.4-1h7.6a1.5 1.5 0 0 1 1.4 1L19 12v4.5zM5 12h14M7 16.5V19M17 16.5V19"/><circle class="dolu" cx="8.3" cy="14.2" r="1"/><circle class="dolu" cx="15.7" cy="14.2" r="1"/>' },
    saglik: { ad: "Sağlık", tur: "gider", renk: "#1fb3b0", ikon: '<path d="M12 20s-7-4.3-7-9.6A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.4C19 15.7 12 20 12 20z"/>' },
    alisveris: { ad: "Alışveriş", tur: "gider", renk: "#c2410c", ikon: '<path d="M6 8.5h12l-.9 11a1 1 0 0 1-1 .9H7.9a1 1 0 0 1-1-.9zM9 8.5V7a3 3 0 0 1 6 0v1.5"/>' },
    eglence: { ad: "Eğlence", tur: "gider", renk: "#e87ba4", ikon: '<path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4zM14.5 6.5v1.5M14.5 11v2M14.5 16v1.5"/>' },
    yeme: { ad: "Yeme içme", tur: "gider", renk: "#eda100", ikon: '<path d="M5 9h11v4.5A4.5 4.5 0 0 1 11.5 18h-2A4.5 4.5 0 0 1 5 13.5zM16 10.5h1.2a2.3 2.3 0 0 1 0 4.6H16M8.5 4.5c-.6.8-.6 1.7 0 2.5M12 4.5c-.6.8-.6 1.7 0 2.5"/>' },
    diger: { ad: "Diğer", tur: "gider", renk: "#8f8b80", ikon: '<circle class="dolu" cx="6.5" cy="12" r="1.6"/><circle class="dolu" cx="12" cy="12" r="1.6"/><circle class="dolu" cx="17.5" cy="12" r="1.6"/>' },
    maas: { ad: "Maaş", tur: "gelir", renk: "#15744a", ikon: '<path d="M4.5 8h13a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2zM4.5 8 15 5v3"/><circle class="dolu" cx="16" cy="13.8" r="1.2"/>' },
    serbest: { ad: "Serbest iş", tur: "gelir", renk: "#15744a", ikon: '<path d="M4 8.5h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM9 8.5v-2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M4 13h16"/>' },
    yatirim: { ad: "Yatırım getirisi", tur: "gelir", renk: "#15744a", ikon: '<path d="M4 17l5-5 3.5 3.5L20 8M15 8h5v5"/>' },
    digerGelir: { ad: "Diğer gelir", tur: "gelir", renk: "#15744a", ikon: '<path d="M4.5 10h15v9.5a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1zM3.5 7h17v3h-17zM12 7v13.5M12 7S10.5 3.5 8.5 4.2C6.8 4.8 7.6 7 9.5 7M12 7s1.5-3.5 3.5-2.8c1.7.6.9 2.8-1 2.8"/>' }
  };
  var GIDER_SIRA = ["ev", "fatura", "market", "ulasim", "saglik", "alisveris", "eglence", "yeme", "diger"];
  var GELIR_SIRA = ["maas", "serbest", "yatirim", "digerGelir"];
  var VARSAYILAN_SINIR = { ev: 24500, fatura: 6500, market: 13000, ulasim: 8000, saglik: 2000, alisveris: 4000, eglence: 2000, yeme: 8000 };
  var IKON = {
    uyari: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5 3 19.5h18zM12 10v4.2M12 16.9v.1"/></svg>',
    bilgi: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.1"/></svg>',
    tamam: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12.5l4 4 9-9"/></svg>',
    yukari: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    asagi: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    gelir: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V6M6.5 11.5 12 6l5.5 5.5"/></svg>',
    gider: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v13M6.5 12.5 12 18l5.5-5.5"/></svg>',
    takvim: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg>'
  };

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  /* ---------- biçim ---------- */
  var sayiBicim = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  var tamBicim = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
  var kurusBicim = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function TL(n) { n = Math.round(n * 100) / 100; return (n === Math.round(n) ? tamBicim : kurusBicim).format(n) + " TL"; }
  function TLtam(n) { return tamBicim.format(Math.round(n)) + " TL"; }
  function TLbuyuk(n) { return tamBicim.format(Math.round(n)) + "<small>TL</small>"; }
  function kisa(n) { return n >= 1000 ? sayiBicim.format(Math.round(n / 100) / 10) + " bin" : tamBicim.format(n); }
  function kacir(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function iki(n) { return (n < 10 ? "0" : "") + n; }
  function tarihYaz(y, m, g) { return y + "-" + iki(m + 1) + "-" + iki(g); }
  function bugunAnahtar() { var d = new Date(); return tarihYaz(d.getFullYear(), d.getMonth(), d.getDate()); }
  function ayAnahtar(d) { return d.getFullYear() + "-" + iki(d.getMonth() + 1); }
  function ayCoz(a) { var p = a.split("-"); return { y: Number(p[0]), m: Number(p[1]) - 1 }; }
  function ayKaydir(a, n) { var c = ayCoz(a); return ayAnahtar(new Date(c.y, c.m + n, 1)); }
  function ayAdi(a, kisaMi) { var c = ayCoz(a); return (kisaMi ? AYLAR_KISA : AYLAR)[c.m] + (kisaMi ? "" : " " + c.y); }
  function tarihCoz(t) { var p = t.split("-"); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
  function kimlik() { return "i" + Date.now().toString(36) + Math.floor(Math.random() * 1e8).toString(36); }
  function tutarCoz(s) {
    s = String(s || "").replace(/[^0-9.,]/g, "");
    if (!s) return NaN;
    if (s.indexOf(",") >= 0) s = s.split(".").join("").replace(",", ".");
    else if (/^\\d{1,3}(\\.\\d{3})+$/.test(s)) s = s.split(".").join("");
    return Number(s);
  }
  function tohumlu(t) {
    return function () {
      t = (t + 0x6D2B79F5) | 0;
      var x = Math.imul(t ^ (t >>> 15), 1 | t);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- örnek veri: son 6 ay, bugüne kadar ---------- */
  function ornekVeri() {
    var bugun = new Date(), liste = [];
    for (var k = 5; k >= 0; k--) {
      var ay = new Date(bugun.getFullYear(), bugun.getMonth() - k, 1);
      var y = ay.getFullYear(), m = ay.getMonth(), gunSay = new Date(y, m + 1, 0).getDate();
      var sonGun = k === 0 ? bugun.getDate() : gunSay;
      var r = tohumlu(y * 100 + m + 11);
      var kis = [10, 11, 0, 1, 2].indexOf(m) >= 0, yaz = [5, 6, 7].indexOf(m) >= 0;
      var ekle = function (gun, tur, kat, tutar, not) {
        if (gun > sonGun || gun > gunSay) return;
        liste.push({ id: "o" + y + m + "-" + liste.length, tur: tur, kat: kat, tutar: Math.round(tutar * 100) / 100, tarih: tarihYaz(y, m, gun), not: not });
      };
      var yuvarla = function (n, adim) { return Math.round(n / adim) * adim; };
      ekle(1, "gelir", "maas", 68500, AYLAR[m] + " maaşı");
      ekle(1, "gider", "ev", 22000, "Ev kirası");
      ekle(2, "gider", "ev", 1850, "Site aidatı");
      ekle(3, "gider", "fatura", yaz ? 1890 + r() * 320 : 1060 + r() * 240, "Elektrik faturası");
      ekle(4, "gider", "fatura", 599, "Ev interneti");
      ekle(5, "gider", "fatura", kis ? 2640 + r() * 880 : 410 + r() * 260, "Doğalgaz faturası");
      ekle(7, "gider", "fatura", 459, "Telefon faturası");
      ekle(8, "gider", "fatura", 214 + r() * 90, "Su faturası");
      ekle(6, "gider", "eglence", 299.99, "Netflix aboneliği");
      ekle(8, "gider", "eglence", 129.99, "Spotify Premium");
      var marketler = ["Migros", "A101", "Pazar alışverişi", "Carrefour", "BİM", "Manav ve kasap", "Migros", "Şok", "Haftalık market"];
      [2, 5, 9, 12, 16, 19, 23, 26, 29].forEach(function (g, i) { ekle(g, "gider", "market", yuvarla(640 + r() * 1280, 5) - (i % 3 === 0 ? 0.05 : 0), marketler[i]); });
      var kahveler = ["Kahve, Moda", "Kahve Dünyası", "Simit ve çay", "Kahve, ofis yanı", "Starbucks", "Kahve, Moda", "Börekçi", "Kahve Dünyası", "Kahve, ofis yanı"];
      [3, 5, 8, 11, 15, 18, 22, 25, 28].forEach(function (g, i) { ekle(g, "gider", "yeme", yuvarla(95 + r() * 85, 5), kahveler[i]); });
      [["Akşam yemeği, Karaköy", 7], ["Pizza akşamı", 17], ["Ocakbaşı, arkadaşlarla", 27]].forEach(function (x) { ekle(x[1], "gider", "yeme", yuvarla(850 + r() * 1100, 10), x[0]); });
      [4, 13, 21, 30].forEach(function (g) { ekle(g, "gider", "yeme", yuvarla(380 + r() * 260, 5), "Yemeksepeti siparişi"); });
      ekle(4, "gider", "ulasim", 1000, "İstanbulkart dolumu");
      ekle(18, "gider", "ulasim", 750, "İstanbulkart dolumu");
      ekle(10, "gider", "ulasim", yuvarla(2150 + r() * 650, 10), "Benzin");
      ekle(24, "gider", "ulasim", yuvarla(2150 + r() * 650, 10), "Benzin");
      ekle(14, "gider", "ulasim", yuvarla(280 + r() * 190, 5), "Taksi");
      ekle(12, "gider", "saglik", yuvarla(240 + r() * 420, 5), "Eczane");
      if (m % 3 === 1) ekle(20, "gider", "saglik", 2500, "Diş kontrolü");
      ekle(9, "gider", "alisveris", yuvarla(890 + r() * 1400, 10) - 0.01, "Trendyol siparişi");
      ekle(21, "gider", "alisveris", yuvarla(650 + r() * 1100, 10) - 0.01, m === 9 || m === 10 ? "Kışlık bot" : "Kitap ve kırtasiye");
      ekle(13, "gider", "eglence", 560, "Sinema, iki bilet");
      if (k === 0) ekle(3, "gider", "eglence", 3400, "Konser bileti, iki kişilik");
      else ekle(26, "gider", "eglence", yuvarla(450 + r() * 500, 10), "Bowling ve oyun salonu");
      ekle(19, "gider", "diger", 300, "Bağış");
      if (m % 2 === 1) ekle(11, "gider", "diger", 750, "Doğum günü hediyesi");
      ekle(15, "gelir", "yatirim", yuvarla(1150 + r() * 280, 1) + 0.42, "Mevduat faizi");
      if (m % 2 === 0) ekle(20, "gelir", "serbest", 8500, "Serbest çeviri işi");
      if (m === 6) ekle(16, "gelir", "digerGelir", 3200, "İkinci el bisiklet satışı");
    }
    return { surum: 1, islemler: liste, sinirlar: Object.assign({}, VARSAYILAN_SINIR) };
  }
  function yukle() {
    try {
      var v = JSON.parse(localStorage.getItem(ANAHTAR) || "null");
      if (v && v.surum === 1 && Array.isArray(v.islemler)) { v.sinirlar = v.sinirlar || {}; return v; }
    } catch (e) { /* bozuk veri: örnekle başla */ }
    return ornekVeri();
  }
  var S = yukle();
  function kaydet() { try { localStorage.setItem(ANAHTAR, JSON.stringify(S)); } catch (e) { /* depolama dolu */ } }

  /* ---------- durum ---------- */
  var BUGUN_AY = ayAnahtar(new Date());
  var secAy = BUGUN_AY;
  var filtre = { tur: "tumu", kat: "", ara: "" };
  var duzenlenen = null;

  /* ---------- hesaplar ---------- */
  function ayIslemleri(a) { return S.islemler.filter(function (i) { return i.tarih.slice(0, 7) === a; }); }
  function topla(liste, tur, sonGun) {
    return liste.reduce(function (t, i) { return i.tur === tur && (!sonGun || Number(i.tarih.slice(8)) <= sonGun) ? t + i.tutar : t; }, 0);
  }
  function gecenGun(a) { if (a === BUGUN_AY) return new Date().getDate(); var c = ayCoz(a); return new Date(c.y, c.m + 1, 0).getDate(); }
  function katToplam(liste) {
    var t = {};
    liste.forEach(function (i) { if (i.tur === "gider") t[i.kat] = (t[i.kat] || 0) + i.tutar; });
    return t;
  }
  function filtreli() {
    var q = filtre.ara.trim().toLocaleLowerCase("tr-TR");
    return ayIslemleri(secAy).filter(function (i) {
      if (filtre.tur !== "tumu" && i.tur !== filtre.tur) return false;
      if (filtre.kat && i.kat !== filtre.kat) return false;
      if (q) {
        var k = (i.not + " " + KAT[i.kat].ad + " " + sayiBicim.format(i.tutar) + " " + i.tutar).toLocaleLowerCase("tr-TR");
        if (k.indexOf(q) < 0) return false;
      }
      return true;
    }).sort(function (a, b) { return a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : (b.id > a.id ? 1 : -1); });
  }
  function ikonHtml(kat) {
    var k = KAT[kat] || KAT.diger;
    return '<span class="kat-ikon" style="background:' + k.renk + '1f;color:' + k.renk + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + k.ikon + "</svg></span>";
  }

  /* ---------- çizim: başlık ve özet ---------- */
  function ayCiz() {
    $("#ayAd").textContent = ayAdi(secAy);
    var gun = gecenGun(secAy), c = ayCoz(secAy), toplamGun = new Date(c.y, c.m + 1, 0).getDate();
    $("#ayAlt").textContent = secAy === BUGUN_AY ? (toplamGun - gun) + " gün kaldı" : "Kapanmış ay";
    $("#sonrakiAy").disabled = secAy >= BUGUN_AY;
  }
  function deltaHtml(simdi, once, artisIyi) {
    if (!once) return '<span class="delta notr">Yeni</span>';
    var fark = (simdi - once) / once, yuzde = Math.round(Math.abs(fark) * 100);
    if (yuzde === 0) return '<span class="delta notr">Aynı</span>';
    var iyi = (fark > 0) === artisIyi;
    return '<span class="delta ' + (iyi ? "iyi" : "kotu") + '">' + "%" + yuzde + (fark > 0 ? " fazla" : " az") + "</span>";
  }
  function spark(seri, aylar) {
    var w = 200, h = 34, en = Math.max.apply(null, seri), az = Math.min.apply(null, seri), ara = en - az || 1;
    var n = seri.map(function (v, i) { return [i * (w / (seri.length - 1)), 4 + (1 - (v - az) / ara) * (h - 8)]; });
    var d = n.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var son = n[n.length - 1];
    return '<div class="spark-kap" aria-hidden="true"><div class="spark-ic"><svg class="spark" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none"><path class="alan" d="' + d + " L" + w + " " + h + " L0 " + h + ' Z"/><path class="cizgi" d="' + d + '" vector-effect="non-scaling-stroke"/></svg><i class="spark-nokta" style="top:' + ((son[1] / h) * 100).toFixed(1) + '%"></i></div><div class="spark-ay"><span>' + aylar[0] + '</span><span>Son 6 ay</span><span>' + aylar[1] + '</span></div></div>';
  }
  function ozetCiz() {
    var liste = ayIslemleri(secAy), gelir = topla(liste, "gelir"), gider = topla(liste, "gider"), net = gelir - gider;
    var gun = gecenGun(secAy), onceki = ayIslemleri(ayKaydir(secAy, -1));
    var karsiGun = secAy === BUGUN_AY ? gun : 0;
    var oGelir = topla(onceki, "gelir", karsiGun), oGider = topla(onceki, "gider", karsiGun);
    var karsiMetin = '<span title="' + (secAy === BUGUN_AY ? "Geçen ayın ilk " + gun + " günüyle karşılaştırıldı" : "Geçen ayın tamamıyla karşılaştırıldı") + '">geçen aya göre</span>';
    var sparkAy = [ayAdi(ayKaydir(secAy, -5), true), ayAdi(secAy, true)];

    $("#netEtiket").textContent = net >= 0 ? ayAdi(secAy).split(" ")[0] + " ayında kalan" : ayAdi(secAy).split(" ")[0] + " ayında açık";
    $("#netTutar").innerHTML = (net < 0 ? "−" : "") + TLbuyuk(Math.abs(net));
    var pay = gelir ? Math.round((gider / gelir) * 100) : (gider ? 100 : 0);
    var rozet = $("#tasarrufRozet");
    rozet.textContent = gelir ? (net >= 0 ? "Tasarruf %" + Math.round((net / gelir) * 100) : "Gelirden fazla harcama") : "Gelir yok";
    rozet.classList.toggle("kotu", net < 0);
    var cubuk = $("#harcananCubuk");
    cubuk.style.width = Math.min(100, pay) + "%";
    cubuk.classList.toggle("asti", pay > 100);
    $("#harcananPay").textContent = "%" + pay;
    var kt = katToplam(liste), enK = Object.keys(kt).sort(function (a, b) { return kt[b] - kt[a]; })[0];
    $("#enBuyuk").textContent = enK ? KAT[enK].ad + ", " + TLtam(kt[enK]) : "Henüz gider yok";
    $("#islemSayi").textContent = liste.length;

    var son6 = [];
    for (var i = 5; i >= 0; i--) son6.push(ayIslemleri(ayKaydir(secAy, -i)));
    $("#kpiGelir").innerHTML = '<div class="kpi-ust"><span class="kpi-ikon">' + IKON.gelir + "</span>Gelir</div>"
      + '<div class="kpi-deger">' + TLbuyuk(gelir) + "</div>"
      + '<div class="kpi-not">' + deltaHtml(gelir, oGelir, true) + karsiMetin + "</div>"
      + spark(son6.map(function (l) { return topla(l, "gelir"); }), sparkAy);
    $("#kpiGider").innerHTML = '<div class="kpi-ust"><span class="kpi-ikon">' + IKON.gider + "</span>Gider</div>"
      + '<div class="kpi-deger">' + TLbuyuk(gider) + "</div>"
      + '<div class="kpi-not">' + deltaHtml(gider, oGider, false) + karsiMetin + "</div>"
      + spark(son6.map(function (l) { return topla(l, "gider"); }), sparkAy);
    var kirasiz = gider - (kt.ev || 0);
    $("#kpiGunluk").innerHTML = '<div class="kpi-ust"><span class="kpi-ikon">' + IKON.takvim + "</span>Günlük ortalama</div>"
      + '<div class="kpi-deger">' + TLbuyuk(gun ? gider / gun : 0) + "</div>"
      + '<div class="kpi-not">Ev ve kira hariç <b>' + TLtam(gun ? kirasiz / gun : 0) + "</b></div>"
      + spark(son6.map(function (l, j) { var a = ayKaydir(secAy, j - 5); var g = gecenGun(a); return g ? topla(l, "gider") / g : 0; }), sparkAy);
  }

  /* ---------- halka grafik ---------- */
  var etkinDilim = "";
  function yay(cx, cy, r, a0, a1) {
    var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    return "M" + x0.toFixed(2) + " " + y0.toFixed(2) + "A" + r + " " + r + " 0 " + (a1 - a0 > Math.PI ? 1 : 0) + " 1 " + x1.toFixed(2) + " " + y1.toFixed(2);
  }
  function halkaCiz() {
    var kt = katToplam(ayIslemleri(secAy)), toplam = 0;
    var dilimler = GIDER_SIRA.filter(function (k) { return kt[k] > 0; }).map(function (k) { toplam += kt[k]; return { k: k, v: kt[k] }; });
    var svg = $("#halka"), s = "", r = 82, cx = 100, cy = 100, bosluk = 2.2 / r;
    if (!toplam) s = '<circle class="bos-halka" cx="100" cy="100" r="' + r + '"/>';
    else {
      var a = -Math.PI / 2;
      dilimler.forEach(function (d) {
        var aci = (d.v / toplam) * Math.PI * 2, b = dilimler.length > 1 ? Math.min(bosluk, aci / 3) : 0;
        var a0 = a + b / 2, a1 = a + aci - b / 2;
        if (dilimler.length === 1) s += '<circle class="dilim' + (etkinDilim === d.k ? " etkin" : "") + '" data-kat="' + d.k + '" cx="100" cy="100" r="' + r + '" stroke="' + KAT[d.k].renk + '"/>';
        else s += '<path class="dilim' + (etkinDilim === d.k ? " etkin" : "") + '" data-kat="' + d.k + '" d="' + yay(cx, cy, r, a0, a1) + '" stroke="' + KAT[d.k].renk + '"><title>' + KAT[d.k].ad + ": " + TL(d.v) + "</title></path>";
        a += aci;
      });
    }
    svg.innerHTML = s;
    svg.classList.toggle("odakli", !!etkinDilim && !!kt[etkinDilim]);
    merkezCiz(etkinDilim && kt[etkinDilim] ? etkinDilim : "", kt, toplam);
    var sirali = dilimler.slice().sort(function (x, y) { return y.v - x.v; });
    $("#lejant").innerHTML = sirali.length ? sirali.map(function (d) {
      return '<li><button type="button" class="' + (filtre.kat === d.k ? "etkin" : "") + '" data-kat="' + d.k + '" aria-pressed="' + (filtre.kat === d.k) + '" title="Bu kategorinin işlemlerini göster">'
        + '<i class="sw" style="background:' + KAT[d.k].renk + '"></i><span class="ad">' + KAT[d.k].ad + '</span><span class="pay">%' + Math.max(1, Math.round((d.v / toplam) * 100)) + '</span><span class="tutar">' + TLtam(d.v) + "</span></button></li>";
    }).join("") : '<li class="bos">Bu ay henüz gider yok.</li>';
    $("#dagilimAlt").textContent = toplam ? sirali.length + " kategoride " + TLtam(toplam) : "Kategorilere göre";
    var gun = secAy === BUGUN_AY ? gecenGun(secAy) : 0;
    var onceki = katToplam(ayIslemleri(ayKaydir(secAy, -1)).filter(function (i) { return !gun || Number(i.tarih.slice(8)) <= gun; }));
    var farklar = GIDER_SIRA.map(function (k) { return { k: k, f: (kt[k] || 0) - (onceki[k] || 0) }; }).sort(function (a, b) { return b.f - a.f; });
    var artan = farklar[0], azalan = farklar[farklar.length - 1], alt = "";
    if (artan && artan.f > 0) alt += "<span>En çok artan <b>" + KAT[artan.k].ad + ", " + TLtam(artan.f) + "</b></span>";
    if (azalan && azalan.f < 0) alt += "<span>En çok azalan <b>" + KAT[azalan.k].ad + ", " + TLtam(-azalan.f) + "</b></span>";
    var a2 = $("#dagilimAlt2");
    a2.innerHTML = !toplam ? "<span>Gider ekledikçe kategori dağılımı burada oluşur</span>" : alt ? alt + '<span class="ipucu-not">Geçen ayın aynı dönemine göre</span>' : "<span>Dağılım geçen ayla aynı</span>";
  }
  function merkezCiz(k, kt, toplam) {
    var m = $("#halkaMerkez");
    if (k) m.innerHTML = "<small>" + KAT[k].ad + "</small><b>" + TLtam(kt[k]) + "</b><span>%" + Math.max(1, Math.round((kt[k] / toplam) * 100)) + " pay</span>";
    else m.innerHTML = "<small>Toplam gider</small><b>" + TLtam(toplam) + "</b><span>" + ayAdi(secAy).split(" ")[0] + "</span>";
  }
  $("#halka").addEventListener("mouseover", function (e) {
    var d = e.target.closest(".dilim"); if (!d) return;
    var kt = katToplam(ayIslemleri(secAy)), t = 0; Object.keys(kt).forEach(function (k) { t += kt[k]; });
    merkezCiz(d.getAttribute("data-kat"), kt, t);
  });
  $("#halka").addEventListener("mouseleave", function () { var kt = katToplam(ayIslemleri(secAy)), t = 0; Object.keys(kt).forEach(function (k) { t += kt[k]; }); merkezCiz(etkinDilim && kt[etkinDilim] ? etkinDilim : "", kt, t); });
  $("#halka").addEventListener("click", function (e) { var d = e.target.closest(".dilim"); if (d) katFiltrele(d.getAttribute("data-kat")); });
  $("#lejant").addEventListener("click", function (e) { var b = e.target.closest("button[data-kat]"); if (b) katFiltrele(b.getAttribute("data-kat")); });
  function katFiltrele(k) {
    filtre.kat = filtre.kat === k ? "" : k;
    if (filtre.kat && filtre.tur === "gelir") filtre.tur = "tumu";
    etkinDilim = filtre.kat;
    katSecenekleri();
    $("#katFiltre").value = filtre.kat;
    halkaCiz(); filtreCiz(); listeCiz();
    if (filtre.kat && window.innerWidth < 900) $(".islemler").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- aylık sütun grafiği ---------- */
  var cubukVeri = [], cubukOlcu = {};
  function adimBul(en) {
    var adimlar = [5000, 10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000];
    for (var i = 0; i < adimlar.length; i++) if (en / adimlar[i] <= 4) return adimlar[i];
    return Math.ceil(en / 4 / 100000) * 100000;
  }
  function cubukCiz() {
    var svg = $("#cubuklar"), W = Math.max(300, Math.round(svg.getBoundingClientRect().width || 600)), H = 232;
    var sol = 50, alt = 28, ust = 12, cizW = W - sol, cizH = H - alt - ust, taban = H - alt;
    cubukVeri = [];
    for (var i = 5; i >= 0; i--) {
      var a = ayKaydir(secAy, -i), l = ayIslemleri(a);
      cubukVeri.push({ ay: a, gelir: topla(l, "gelir"), gider: topla(l, "gider") });
    }
    var en = Math.max(1000, Math.max.apply(null, cubukVeri.map(function (v) { return Math.max(v.gelir, v.gider); })));
    var adim = adimBul(en), tavan = Math.ceil(en / adim) * adim;
    if (tavan - en < adim * .12) tavan += adim;
    var s = "";
    for (var t = 0; t <= tavan; t += adim) {
      var y = Math.round(taban - (t / tavan) * cizH) + .5;
      s += '<line class="' + (t === 0 ? "taban" : "izgara") + '" x1="' + sol + '" x2="' + W + '" y1="' + y + '" y2="' + y + '"/><text class="eksen" x="' + (sol - 10) + '" y="' + (y + 4) + '" text-anchor="end">' + (t === 0 ? "0" : kisa(t)) + "</text>";
    }
    var grupW = cizW / cubukVeri.length, bw = Math.min(22, grupW * .24), ara = 4;
    cubukVeri.forEach(function (v, i) {
      var gx = sol + i * grupW, orta = gx + grupW / 2, secili = v.ay === secAy;
      var hG = v.gelir ? Math.max(3, (v.gelir / tavan) * cizH) : 0, hD = v.gider ? Math.max(3, (v.gider / tavan) * cizH) : 0;
      var ad = ayAdi(v.ay) + ": gelir " + TLtam(v.gelir) + ", gider " + TLtam(v.gider);
      s += '<g class="grup' + (secili ? " secili" : "") + '" data-i="' + i + '" tabindex="0" role="button" aria-label="' + ad + '">'
        + '<rect class="bant" x="' + (gx + 6) + '" y="' + (ust - 4) + '" width="' + (grupW - 12) + '" height="' + (cizH + alt + 2) + '" rx="12"/>'
        + (hG ? '<path class="gelir" d="' + sutun(orta - ara / 2 - bw, taban - hG, bw, hG) + '"/>' : "")
        + (hD ? '<path class="gider" d="' + sutun(orta + ara / 2, taban - hD, bw, hD) + '"/>' : "")
        + '<text class="eksen-x' + (secili ? " secili" : "") + '" x="' + orta + '" y="' + (H - 7) + '" text-anchor="middle">' + ayAdi(v.ay, true) + (ayCoz(v.ay).m === 0 ? " " + String(ayCoz(v.ay).y).slice(2) : "") + "</text></g>";
    });
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.innerHTML = s;
    cubukOlcu = { W: W, sol: sol, grupW: grupW, ust: ust };
    var net = cubukVeri.reduce(function (t, v) { return t + v.gelir - v.gider; }, 0);
    var ortGider = cubukVeri.reduce(function (t, v) { return t + v.gider; }, 0) / cubukVeri.length;
    $("#akisAlt").innerHTML = "<span>6 ayda " + (net >= 0 ? "biriken" : "eksi") + " <b>" + TLtam(Math.abs(net)) + "</b></span><span>Aylık ortalama gider <b>" + TLtam(ortGider) + "</b></span>";
  }
  function sutun(x, y, w, h) {
    var r = Math.min(4, w / 2, h);
    return "M" + x.toFixed(1) + " " + (y + h).toFixed(1) + "V" + (y + r).toFixed(1) + "Q" + x.toFixed(1) + " " + y.toFixed(1) + " " + (x + r).toFixed(1) + " " + y.toFixed(1) + "H" + (x + w - r).toFixed(1) + "Q" + (x + w).toFixed(1) + " " + y.toFixed(1) + " " + (x + w).toFixed(1) + " " + (y + r).toFixed(1) + "V" + (y + h).toFixed(1) + "Z";
  }
  function ipucu(i) {
    var v = cubukVeri[i]; if (!v) return;
    var ip = $("#ipucu"), kap = $("#cubukKap"), olcek = kap.clientWidth / cubukOlcu.W;
    var net = v.gelir - v.gider;
    ip.innerHTML = "<b>" + ayAdi(v.ay) + "</b>"
      + '<div class="sat"><i class="sw gelir"></i><span>Gelir</span><span>' + TLtam(v.gelir) + "</span></div>"
      + '<div class="sat"><i class="sw gider"></i><span>Gider</span><span>' + TLtam(v.gider) + "</span></div>"
      + '<div class="sat"><span>Net</span><span>' + (net < 0 ? "−" : "") + TLtam(Math.abs(net)) + "</span></div>";
    var x = (cubukOlcu.sol + (i + .5) * cubukOlcu.grupW) * olcek;
    ip.style.left = Math.max(95, Math.min(kap.clientWidth - 95, x)) + "px";
    ip.style.top = "0px";
    ip.classList.add("acik");
  }
  $("#cubuklar").addEventListener("mouseover", function (e) { var g = e.target.closest(".grup"); if (g) ipucu(Number(g.getAttribute("data-i"))); });
  $("#cubuklar").addEventListener("mouseleave", function () { $("#ipucu").classList.remove("acik"); });
  $("#cubuklar").addEventListener("focusin", function (e) { var g = e.target.closest(".grup"); if (g) ipucu(Number(g.getAttribute("data-i"))); });
  $("#cubuklar").addEventListener("focusout", function () { $("#ipucu").classList.remove("acik"); });
  function grupSec(e) {
    var g = e.target.closest(".grup"); if (!g) return;
    var v = cubukVeri[Number(g.getAttribute("data-i"))];
    if (v && v.ay !== secAy) { secAy = v.ay; $("#ipucu").classList.remove("acik"); hepsiniCiz(); }
  }
  $("#cubuklar").addEventListener("click", grupSec);
  $("#cubuklar").addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); grupSec(e); } });

  /* ---------- sınırlar ---------- */
  function sinirDurumlari() {
    var kt = katToplam(ayIslemleri(secAy));
    return GIDER_SIRA.filter(function (k) { return S.sinirlar[k] > 0; }).map(function (k) {
      var h = kt[k] || 0, s = S.sinirlar[k];
      return { k: k, harcanan: h, sinir: s, oran: h / s, durum: h > s ? "asti" : h / s >= .85 ? "yakin" : "normal" };
    }).sort(function (a, b) { return b.oran - a.oran; });
  }
  function sinirCiz() {
    var d = sinirDurumlari();
    $("#sinirListe").innerHTML = d.length ? d.map(function (x) {
      var durumMetin = x.durum === "asti" ? IKON.uyari + TLtam(x.harcanan - x.sinir) + " aştın"
        : x.durum === "yakin" ? IKON.uyari + "Sınıra " + TLtam(x.sinir - x.harcanan) + " kaldı"
        : TLtam(x.sinir - x.harcanan) + " kaldı";
      return '<li class="sinir ' + x.durum + '">' + ikonHtml(x.k)
        + '<div class="sinir-ust"><b>' + KAT[x.k].ad + "</b><span><strong>" + TLtam(x.harcanan) + "</strong> / " + TLtam(x.sinir) + "</span></div>"
        + '<div class="metre" role="meter" aria-valuemin="0" aria-valuemax="' + x.sinir + '" aria-valuenow="' + Math.round(x.harcanan) + '" aria-label="' + KAT[x.k].ad + ' sınır kullanımı"><span style="width:' + Math.min(100, x.oran * 100).toFixed(1) + '%"></span></div>'
        + '<div class="sinir-durum">' + durumMetin + "</div></li>";
    }).join("") : '<li class="sinir-bos">Henüz sınır yok. Düzenle ile kategorilere aylık sınır koy.</li>';
    var asan = d.filter(function (x) { return x.durum === "asti"; }), yakin = d.filter(function (x) { return x.durum === "yakin"; });
    $("#sinirAlt").textContent = d.length ? (asan.length ? asan.length + " kategori sınırı aştı" : yakin.length ? yakin.length + " kategori sınıra yakın" : "Tüm kategoriler sınır içinde") : "Aylık kategori sınırları";
    var u = $("#uyari");
    if (asan.length || yakin.length) {
      var metin = "";
      if (asan.length) metin = asan.map(function (x) { return "<b>" + KAT[x.k].ad + "</b> sınırını " + TLtam(x.harcanan - x.sinir); }).join(", ") + " aştın.";
      if (yakin.length) metin += (metin ? " " : "") + yakin.map(function (x) { return "<b>" + KAT[x.k].ad + "</b> için sınıra " + TLtam(x.sinir - x.harcanan); }).join(", ") + " kaldı.";
      u.className = "uyari" + (asan.length ? "" : " sari");
      u.innerHTML = '<span class="u-ikon">' + IKON.uyari + "</span><p>" + metin + '</p><button class="dugme kucuk hayalet" type="button" id="uyariDuzenle">Sınırları düzenle</button>';
      u.hidden = false;
    } else u.hidden = true;
  }

  /* ---------- işlem listesi ---------- */
  function filtreCiz() {
    $$(".cipler button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-tur") === filtre.tur)); });
    $("#katFiltre").value = filtre.kat;
    $("#filtreTemizle").hidden = !(filtre.tur !== "tumu" || filtre.kat || filtre.ara);
  }
  function gunEtiketi(t) {
    var d = tarihCoz(t), b = bugunAnahtar(), dun = new Date(); dun.setDate(dun.getDate() - 1);
    if (t === b) return "Bugün";
    if (t === tarihYaz(dun.getFullYear(), dun.getMonth(), dun.getDate())) return "Dün";
    return d.getDate() + " " + AYLAR[d.getMonth()] + " " + GUNLER[d.getDay()];
  }
  function listeCiz() {
    var l = filtreli(), kap = $("#islemListe");
    $("#islemHap").textContent = l.length + " işlem";
    if (!l.length) {
      var filtreVar = filtre.tur !== "tumu" || filtre.kat || filtre.ara;
      kap.innerHTML = '<div class="bos-durum"><svg viewBox="0 0 132 92" aria-hidden="true"><rect x="18" y="20" width="96" height="62" rx="14" fill="#f7f6f1" stroke="#e5e1d6"/><rect x="30" y="10" width="72" height="20" rx="8" fill="#ffffff" stroke="#e5e1d6"/><rect x="32" y="40" width="40" height="7" rx="3.5" fill="#e5e1d6"/><rect x="32" y="54" width="62" height="7" rx="3.5" fill="#eeebe3"/><circle cx="100" cy="66" r="15" fill="#c9f26b" stroke="#0f3b2c" stroke-width="1.5"/><path d="M100 59v14M93 66h14" stroke="#0f3b2c" stroke-width="2.2" stroke-linecap="round"/></svg>'
        + "<b>" + (filtreVar ? "Bu filtreyle işlem yok" : "Bu ay henüz işlem yok") + "</b><p>" + (filtreVar ? "Aramayı ya da filtreyi değiştir, veya yeni bir işlem ekle." : "İlk gelirini ya da giderini ekle; özet ve grafikler kendiliğinden dolar.") + "</p>"
        + '<div class="eylemler"><button class="dugme kucuk ana" type="button" data-eylem="ekle">İşlem ekle</button>' + (filtreVar ? '<button class="dugme kucuk hayalet" type="button" data-eylem="temizle">Filtreyi temizle</button>' : "") + "</div></div>";
      return;
    }
    var s = "", son = "";
    l.forEach(function (i, n) {
      if (i.tarih !== son) {
        son = i.tarih;
        var gunNet = l.filter(function (x) { return x.tarih === son; }).reduce(function (t, x) { return t + (x.tur === "gelir" ? x.tutar : -x.tutar); }, 0);
        s += (n ? "</div>" : "") + '<div class="gun"><div class="gun-baslik"><span>' + gunEtiketi(son) + "</span><span>" + (gunNet < 0 ? "−" : "+") + TL(Math.abs(gunNet)) + "</span></div>";
      }
      var k = KAT[i.kat] || KAT.diger;
      s += '<button class="islem" type="button" data-id="' + i.id + '" title="Düzenlemek için dokun">' + ikonHtml(i.kat)
        + '<span class="islem-metin"><b>' + kacir(i.not || k.ad) + "</b><small>" + k.ad + (i.tur === "gelir" ? " · gelir" : "") + "</small></span>"
        + '<span class="islem-tutar ' + i.tur + '">' + (i.tur === "gelir" ? "+" : "−") + TL(i.tutar) + "</span></button>";
    });
    kap.innerHTML = s + "</div>";
  }
  $("#islemListe").addEventListener("click", function (e) {
    var b = e.target.closest(".islem");
    if (b) { var i = S.islemler.filter(function (x) { return x.id === b.getAttribute("data-id"); })[0]; if (i) pencereAc(i); return; }
    var ey = e.target.closest("[data-eylem]");
    if (ey && ey.getAttribute("data-eylem") === "ekle") pencereAc(null);
    if (ey && ey.getAttribute("data-eylem") === "temizle") filtreSifirla();
  });
  $$(".cipler button").forEach(function (b) {
    b.addEventListener("click", function () {
      filtre.tur = b.getAttribute("data-tur");
      if (filtre.kat && KAT[filtre.kat].tur !== filtre.tur && filtre.tur !== "tumu") { filtre.kat = ""; etkinDilim = ""; halkaCiz(); }
      katSecenekleri(); filtreCiz(); listeCiz();
    });
  });
  function katSecenekleri() {
    var sira = filtre.tur === "gelir" ? GELIR_SIRA : filtre.tur === "gider" ? GIDER_SIRA : GIDER_SIRA.concat(GELIR_SIRA);
    $("#katFiltre").innerHTML = '<option value="">Tüm kategoriler</option>' + sira.map(function (k) { return '<option value="' + k + '">' + KAT[k].ad + "</option>"; }).join("");
    $("#katFiltre").value = filtre.kat;
  }
  $("#katFiltre").addEventListener("change", function () { filtre.kat = this.value; etkinDilim = KAT[filtre.kat] && KAT[filtre.kat].tur === "gider" ? filtre.kat : ""; halkaCiz(); filtreCiz(); listeCiz(); });
  var araZaman = 0;
  $("#ara").addEventListener("input", function () {
    var v = this.value; clearTimeout(araZaman);
    araZaman = setTimeout(function () { filtre.ara = v; filtreCiz(); listeCiz(); }, 120);
  });
  $("#ara").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $(".islemler").scrollIntoView({ behavior: "smooth", block: "start" }); } });
  function filtreSifirla() {
    filtre = { tur: "tumu", kat: "", ara: "" }; etkinDilim = ""; $("#ara").value = "";
    katSecenekleri(); halkaCiz(); filtreCiz(); listeCiz();
  }
  $("#filtreTemizle").addEventListener("click", filtreSifirla);

  /* ---------- işlem penceresi ---------- */
  var pencere = $("#islemPencere"), form = $("#islemForm");
  function turSec(tur) {
    var sira = tur === "gelir" ? GELIR_SIRA : GIDER_SIRA, secili = form.querySelector('input[name="kat"]:checked');
    var onceki = secili ? secili.value : "";
    $("#katSecenek").innerHTML = sira.map(function (k) {
      return '<label><input type="radio" name="kat" value="' + k + '"' + (k === onceki ? " checked" : "") + ' /><span class="kat-sec">' + ikonHtml(k) + KAT[k].ad + "</span></label>";
    }).join("");
  }
  form.addEventListener("change", function (e) { if (e.target.name === "tur") turSec(e.target.value); if (e.target.name === "kat") $("#formHata").textContent = ""; });
  function pencereAc(i) {
    duzenlenen = i;
    form.reset();
    $("#formHata").textContent = "";
    var sil = $("#islemSil"); sil.hidden = !i; sil.classList.remove("emin"); sil.textContent = "Sil";
    $("#islemPencereBaslik").textContent = i ? "İşlemi düzenle" : "Yeni işlem";
    var tur = i ? i.tur : (filtre.tur === "gelir" ? "gelir" : "gider");
    form.querySelector('input[name="tur"][value="' + tur + '"]').checked = true;
    turSec(tur);
    if (i) {
      var r = form.querySelector('input[name="kat"][value="' + i.kat + '"]'); if (r) r.checked = true;
      $("#tutarGirdi").value = (i.tutar === Math.round(i.tutar) ? tamBicim : kurusBicim).format(i.tutar);
      $("#tarihGirdi").value = i.tarih;
      $("#notGirdi").value = i.not || "";
    } else {
      if (filtre.kat && KAT[filtre.kat].tur === tur) { var r2 = form.querySelector('input[name="kat"][value="' + filtre.kat + '"]'); if (r2) r2.checked = true; }
      var c = ayCoz(secAy);
      $("#tarihGirdi").value = secAy === BUGUN_AY ? bugunAnahtar() : tarihYaz(c.y, c.m, Math.min(15, new Date(c.y, c.m + 1, 0).getDate()));
    }
    pencere.showModal();
    setTimeout(function () { $("#tutarGirdi").focus(); }, 60);
  }
  form.addEventListener("submit", function (e) {
    var btn = e.submitter;
    if (!btn || btn.value !== "kaydet") return;
    var f = new FormData(form), tutar = tutarCoz(f.get("tutar")), kat = f.get("kat"), tarih = f.get("tarih"), hata = "";
    if (!(tutar > 0)) hata = "Tutarı yaz; örneğin 1.250,50";
    else if (tutar > 100000000) hata = "Tutar çok büyük görünüyor.";
    else if (!kat) hata = "Bir kategori seç.";
    else if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(String(tarih))) hata = "Geçerli bir tarih seç.";
    if (hata) { e.preventDefault(); $("#formHata").textContent = hata; return; }
    var kayit = { id: duzenlenen ? duzenlenen.id : kimlik(), tur: f.get("tur"), kat: kat, tutar: Math.round(tutar * 100) / 100, tarih: String(tarih), not: String(f.get("not") || "").trim().slice(0, 60) };
    var oncekiDurum = {};
    if (kayit.tur === "gider") sinirDurumlari().forEach(function (x) { oncekiDurum[x.k] = x.durum; });
    if (duzenlenen) S.islemler = S.islemler.map(function (x) { return x.id === kayit.id ? kayit : x; });
    else S.islemler.push(kayit);
    kaydet();
    var hedefAy = kayit.tarih.slice(0, 7);
    if (hedefAy !== secAy && hedefAy <= BUGUN_AY) secAy = hedefAy;
    hepsiniCiz();
    var mesaj = duzenlenen ? "İşlem güncellendi." : (kayit.tur === "gelir" ? "Gelir eklendi: " : "Gider eklendi: ") + TL(kayit.tutar), uyar = false;
    if (kayit.tur === "gider") {
      var x = sinirDurumlari().filter(function (d) { return d.k === kayit.kat; })[0];
      if (x && x.durum === "asti" && oncekiDurum[x.k] !== "asti") { mesaj = "Kaydedildi. " + KAT[x.k].ad + " sınırını " + TLtam(x.harcanan - x.sinir) + " aştın."; uyar = true; }
      else if (x && x.durum === "yakin" && oncekiDurum[x.k] === "normal") { mesaj = "Kaydedildi. " + KAT[x.k].ad + " için sınıra " + TLtam(x.sinir - x.harcanan) + " kaldı."; uyar = true; }
    }
    duyur(mesaj, uyar);
    duzenlenen = null;
  });
  $("#islemSil").addEventListener("click", function () {
    var b = this;
    if (!b.classList.contains("emin")) { b.classList.add("emin"); b.textContent = "Silinsin mi?"; return; }
    S.islemler = S.islemler.filter(function (x) { return x.id !== duzenlenen.id; });
    kaydet(); pencere.close(); duzenlenen = null; hepsiniCiz(); duyur("İşlem silindi.");
  });
  pencere.addEventListener("close", function () { duzenlenen = null; });

  /* ---------- sınır penceresi ---------- */
  var sinirPencere = $("#sinirPencere");
  function sinirPenceresiAc() {
    var kt = katToplam(ayIslemleri(secAy));
    $("#sinirGirdiler").innerHTML = GIDER_SIRA.map(function (k) {
      return '<div class="sinir-girdi">' + ikonHtml(k) + '<label for="sinir-' + k + '">' + KAT[k].ad + "<small>Bu ay " + TLtam(kt[k] || 0) + "</small></label>"
        + '<span class="kutu"><input id="sinir-' + k + '" data-kat="' + k + '" inputmode="numeric" placeholder="Sınırsız" value="' + (S.sinirlar[k] ? tamBicim.format(S.sinirlar[k]) : "") + '" /><span>TL</span></span></div>';
    }).join("");
    var sil = $("#hepsiniSil"); sil.classList.remove("emin"); sil.textContent = "Tümünü sil";
    sinirPencere.showModal();
  }
  $("#sinirDuzenle").addEventListener("click", sinirPenceresiAc);
  $("#uyari").addEventListener("click", function (e) { if (e.target.closest("#uyariDuzenle")) sinirPenceresiAc(); });
  $("#sinirForm").addEventListener("submit", function (e) {
    if (!e.submitter || e.submitter.value !== "kaydet") return;
    $$("#sinirGirdiler input").forEach(function (inp) {
      var v = tutarCoz(inp.value);
      if (v > 0) S.sinirlar[inp.getAttribute("data-kat")] = Math.round(v); else delete S.sinirlar[inp.getAttribute("data-kat")];
    });
    kaydet(); sinirCiz(); duyur("Bütçe sınırları kaydedildi.");
  });
  $("#ornekYukle").addEventListener("click", function () {
    S = ornekVeri(); kaydet(); secAy = BUGUN_AY; filtreSifirla(); sinirPencere.close(); hepsiniCiz(); duyur("Örnek veriler yüklendi.");
  });
  $("#hepsiniSil").addEventListener("click", function () {
    var b = this;
    if (!b.classList.contains("emin")) { b.classList.add("emin"); b.textContent = "Emin misin?"; return; }
    S = { surum: 1, islemler: [], sinirlar: {} }; kaydet(); sinirPencere.close(); filtreSifirla(); hepsiniCiz(); duyur("Tüm veriler silindi.");
  });
  $$("dialog").forEach(function (d) { d.addEventListener("click", function (e) { if (e.target === d) d.close(); }); });

  /* ---------- CSV ---------- */
  function csvAlan(v) { v = String(v); return /[";\\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  $("#csvDugme").addEventListener("click", function () {
    var l = filtreli();
    if (!l.length) { duyur("İndirilecek işlem yok.", true); return; }
    var satirlar = [["Tarih", "Tür", "Kategori", "Not", "Tutar (TL)"]].concat(l.slice().reverse().map(function (i) {
      return [i.tarih.split("-").reverse().join("."), i.tur === "gelir" ? "Gelir" : "Gider", KAT[i.kat].ad, i.not || "", (i.tur === "gider" ? "-" : "") + i.tutar.toFixed(2).replace(".", ",")];
    }));
    var csv = String.fromCharCode(0xFEFF) + satirlar.map(function (r) { return r.map(csvAlan).join(";"); }).join("\\r\\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "cep-butce-" + secAy + ".csv";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    duyur(l.length + " işlem CSV olarak indirildi.");
  });

  /* ---------- bildirim ---------- */
  var bildirimZaman = 0;
  function duyur(m, uyar) {
    var b = $("#bildirim"); b.textContent = m; b.classList.toggle("uyar", !!uyar); b.classList.add("acik");
    clearTimeout(bildirimZaman); bildirimZaman = setTimeout(function () { b.classList.remove("acik"); }, uyar ? 5200 : 3200);
  }

  /* ---------- gezinme ve kısayollar ---------- */
  function ayGit(n) {
    var y = ayKaydir(secAy, n);
    if (y > BUGUN_AY) return;
    secAy = y; hepsiniCiz();
  }
  $("#oncekiAy").addEventListener("click", function () { ayGit(-1); });
  $("#sonrakiAy").addEventListener("click", function () { ayGit(1); });
  $("#ekleDugme").addEventListener("click", function () { pencereAc(null); });
  $("#fab").addEventListener("click", function () { pencereAc(null); });
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target, yaziyor = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    if (yaziyor) { if (e.key === "Escape" && t.id === "ara") { t.value = ""; filtre.ara = ""; filtreCiz(); listeCiz(); t.blur(); } return; }
    if (document.querySelector("dialog[open]")) return;
    if (e.key === "n" || e.key === "N") { e.preventDefault(); pencereAc(null); }
    else if (e.key === "/") { e.preventDefault(); $("#ara").focus(); }
    else if (e.key === "ArrowLeft") ayGit(-1);
    else if (e.key === "ArrowRight") ayGit(1);
  });
  window.addEventListener("scroll", function () { $("#ust").classList.toggle("kaydi", window.scrollY > 4); }, { passive: true });
  var boyutZaman = 0;
  window.addEventListener("resize", function () { clearTimeout(boyutZaman); boyutZaman = setTimeout(cubukCiz, 80); });

  function hepsiniCiz() { ayCiz(); ozetCiz(); halkaCiz(); cubukCiz(); sinirCiz(); filtreCiz(); listeCiz(); }
  katSecenekleri();
  hepsiniCiz();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(cubukCiz);
})();
`,
    "ikon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="116" fill="#0f3b2c"/><path d="M128 200c0-27.6 22.4-50 50-50h168c22.1 0 40 17.9 40 40v144c0 22.1-17.9 40-40 40H178c-27.6 0-50-22.4-50-50z" fill="none" stroke="#c9f26b" stroke-width="30"/><path d="M128 216h258" stroke="#c9f26b" stroke-width="30"/><circle cx="312" cy="296" r="28" fill="#c9f26b"/></svg>
`,
  },
};
