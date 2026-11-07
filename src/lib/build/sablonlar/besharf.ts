/* Şablon: Beş Harf — Türkçe beş harfli kelime bulmacası (Wordle tarzı). Türkçe klavye (Ç, Ğ, I, İ, Ö, Ş, Ü), günün kelimesi
 * (İstanbul saatine göre herkese aynı) ve serbest oyun, zor mod, sözlük denetimi, çevirme animasyonları, istatistik ve
 * emoji ızgaralı paylaşım. Kelimeler kelimeler.js dosyasında, oynanış sayıları ayarlar.json'da (Vayra Build ayar paneli). */

/** Cevap olabilecek yaygın kelimeler (hepsi beş harf). */
const CEVAPLAR = `
kalem kitap deniz güneş bulut çiçek ekmek bahçe araba balık kuzey güney hayat zaman dünya insan şehir köprü sokak cadde
orman nehir çayır tarla limon armut kiraz incir kavun biber soğan havuç marul turşu börek çorba pilav kebap köfte lokum
helva tatlı şeker kahve ayran köpek tavuk horoz koyun aslan serçe karga ördek kirpi tilki geyik zebra yunus midye sinek
böcek dalga liman vapur kürek dümen beyin kulak burun dudak yanak bilek topuk gövde karın göğüs kemik damar ciğer teyze
torun kuzen gelin damat komşu sınıf silgi tahta sınav karne bilgi kural fikir yeşil beyaz siyah pembe sabah akşam öğlen
yarın bugün hafta bahar pazar duman kömür demir bakır altın gümüş çelik salon banyo duvar kapak dolap yatak sehpa perde
lamba havlu sabun tarak fırça makas düğme şapka ceket çorap kazak palto kemer çanta yüzük kolye kuruş banka fiyat kredi
vergi hasta müzik şarkı türkü davul zurna gitar keman sahne resim roman masal yazar çizgi yüzme güreş tenis hakem takım
zafer yarış tünel bilet durak taksi motor çarşı fırın manav kasap terzi saray görev memur pilot asker polis güzel büyük
küçük geniş derin alçak hızlı yavaş sıcak soğuk serin ıslak temiz kirli hafif kolay basit doğru yakın erken yaşlı mutlu
üzgün sakin cesur korku sevgi barış savaş özgür hayal sanat bilim tarih kimya fizik rakam cümle dilek selam yayla ırmak
çimen tohum fidan filiz evren roket bebek balon posta radyo ekran bıçak çatal kaşık tabak kumaş iplik düğüm sepet torba
çuval düğün nişan tören davet konuk cevap yanıt sonuç hedef merak sabır huzur gurur özlem kanat pençe kılıç nokta daire
üçgen kenar gölge elmas badem ceviz simit pasta reçel sucuk mantı dolma sarma kuşak çocuk kadın erkek başka bütün hepsi
şimdi sonra belki hemen artık güçlü zayıf çekiç meyve sebze tahıl mısır bilye diken yosun prens ejder domuz katır martı
şahin kekik dergi sayfa fener boğaz tatil boyut hacim metre litre halat kilit beden nefes çizme kafes çadır konak kubbe
çilek çamur çoban damla değer denge duygu düzen esnaf ezber gizem güven hamur hesap iklim inanç istek kabak kader kanal
karar kavga kayık kazan konum kutup lider maske melek mesaj model nazik neden nohut ortak pamuk parça rahat robot sahil
sakal sınır silah sorun şekil tablo tavan tavla tekne temel tepsi tutku tuzak vatan vakit yalan yasak yaşam yemek yolcu
yorum yüzey zarar zehir zemin zihin
`;

/** Yalnız tahmin olarak kabul edilen ek kelimeler (sözlük denetimi için). */
const EK = `
adres ahşap akrep alarm albüm alkış ambar anlam anket antik arena arıza aşama avize ayrım bacak bağış bakış baraj basın
başak batak bayan bazen belge benek bıyık binek birey birim bitki bodur boğum borsa bozuk bölge bölük bulgu burgu buzul
çakal çakıl çarık çekim çerez çeşit çevre çığır çıkış çinko çivit çukur dahil dalış dalak davar defne değil dekor delik
deney devir devre diyet dizgi doğal dolar dolgu dönem döviz düdük eksik eleme emsal enkaz erzak esnek etkin evlat evrak
eylem fakir fanus felek fidye firma fişek fosil gamze garip gazap gelir genel gerek gider giriş gönül hamal hasat hasır
hazır hırka hindi hisse ilmek ipucu irmik jeton kablo kabuk kadeh kahır kalıp kanun kasık katkı kaygı kayıt kazık kefil
kepçe kesik kesir kılıf kıyma kızak kibar kimse kiriş konut koşul kovan köken körük kumar kumru kupon kurul kurum kusur
külah künye lehçe lisan lokal mahal makam mamul matem mazot medya melez mesai metin mezun mimar miras miyop moral mucit
nakit nemli nesil nesne nimet okuma olgun onluk organ otlak ölçek önlük özgün panik parke parti pasaj patik pedal pelin
pınar plaka polen poşet radar rampa rehin rekor rende resmi ritim rozet saçma sağır sahip sahte sakız salça sancı sargı
sarık sayaç sayım seçim sedir sefer sekiz selvi semer seyir sıfır sırık sinir siren sirke sitem soluk sorgu soyut sözcü
sözlü suçlu sulak sürgü sürüş süslü şahıs şakak şamar şarap şerit şişme şoför şükür tabur takas takip talep tamir tanık
tarif tayfa tekel telaş tempo terim titiz toplu tufan tutar tütün uğraş umacı uygar uyarı uyruk uzman ücret ünite ünlem
ürkek varil vekil vezne yafta yakıt yamaç yanık yapay yarar yatay yazıt yedek yetki yıkım yiğit yokuş yudum yular yumak
yüzde zamir zorlu
`;

const liste = (s: string) => s.trim().split(/\s+/).filter((k) => [...k].length === 5);
const KELIMELER_JS =
  "/* Beş Harf kelime listeleri. CEVAPLAR: günün kelimesi ve serbest oyun bunlardan seçilir. EK_KELIMELER: yalnız tahmin olarak kabul edilir.\n" +
  " * Kelimeleri küçük harfle, boşlukla ayırarak ekleyip çıkarabilirsin; beş harften farklı olanlar oyunda yok sayılır. */\n" +
  "var CEVAPLAR = " + JSON.stringify(liste(CEVAPLAR).join(" ")) + ".split(\" \");\n" +
  "var EK_KELIMELER = " + JSON.stringify(liste(EK).join(" ")) + ".split(\" \");\n";

const HTML = String.raw`<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
  <meta name="theme-color" content="#101631" />
  <meta name="description" content="Beş Harf: altı tahminde beş harfli Türkçe kelimeyi bul. Günün kelimesi, serbest oyun, zor mod ve istatistikler." />
  <title>Beş Harf · Kelime Bulmacası</title>
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Rubik:wght@400;500;600;700&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <div class="zemin" aria-hidden="true"></div>
  <div class="uygulama">
    <header class="ust">
      <div class="marka">
        <svg class="logo" viewBox="0 0 40 40" aria-hidden="true">
          <rect x="2" y="2" width="16" height="16" rx="4.5" fill="#22c1ad" />
          <rect x="22" y="2" width="16" height="16" rx="4.5" fill="none" stroke="rgba(246,239,226,.45)" stroke-width="2" />
          <rect x="2" y="22" width="16" height="16" rx="4.5" fill="none" stroke="rgba(246,239,226,.45)" stroke-width="2" />
          <rect x="22" y="22" width="16" height="16" rx="4.5" fill="#efa93c" />
        </svg>
        <span>Beş Harf</span>
      </div>
      <div class="mod" role="tablist" aria-label="Oyun türü">
        <button type="button" role="tab" data-mod="gunluk" aria-selected="true">Günün kelimesi</button>
        <button type="button" role="tab" data-mod="serbest" aria-selected="false">Serbest oyun</button>
      </div>
      <div class="ikonlar">
        <button class="ikon" id="yardimAc" type="button" aria-label="Nasıl oynanır">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8" /><circle cx="12" cy="17.2" r=".6" fill="currentColor" /></svg>
        </button>
        <button class="ikon" id="istAc" type="button" aria-label="İstatistikler">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20v-7M10 20V5M15 20v-9M20 20v-4" /></svg>
        </button>
      </div>
    </header>

    <main class="orta">
      <aside class="yan sol" aria-label="Kurallar">
        <h2>Nasıl oynanır</h2>
        <p>Gizli kelimeyi bul. Her tahmin beş harfli gerçek bir Türkçe kelime olmalı.</p>
        <div class="ornek-satir"><span class="mini" data-durum="d">K</span><span class="mini">A</span><span class="mini">L</span><span class="mini">E</span><span class="mini">M</span></div>
        <p class="kucuk"><b class="t-d">Turkuaz</b> harf kelimede ve doğru yerde.</p>
        <div class="ornek-satir"><span class="mini">S</span><span class="mini" data-durum="y">İ</span><span class="mini">M</span><span class="mini">İ</span><span class="mini">T</span></div>
        <p class="kucuk"><b class="t-y">Safran</b> harf kelimede var ama başka yerde.</p>
        <div class="ornek-satir"><span class="mini">Ç</span><span class="mini">O</span><span class="mini">R</span><span class="mini" data-durum="n">B</span><span class="mini">A</span></div>
        <p class="kucuk"><b class="t-n">Gri</b> harf kelimede hiç yok.</p>
        <p class="not" id="kuralNot"></p>
      </aside>

      <section class="oyun-alan" aria-label="Oyun tahtası">
        <div class="baslik-satir">
          <p class="altbaslik" id="altBaslik"></p>
          <button class="yeni" id="yeniKelime" type="button" hidden>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" /></svg>
            Yeni kelime
          </button>
        </div>
        <div class="tahta-kutu" id="tahtaKutu">
          <div class="tahta" id="tahta" role="grid" aria-label="Tahminler"></div>
        </div>
      </section>

      <aside class="yan sag" aria-label="Durum">
        <h2 id="yanBaslik">Günün bulmacası</h2>
        <div class="yan-durum" id="yanDurum"></div>
        <dl class="yan-sayilar">
          <div><dt>Seri</dt><dd id="yanSeri">0</dd></div>
          <div><dt>Kazanma yüzdesi</dt><dd id="yanOran">0</dd></div>
          <div><dt>Oynanan</dt><dd id="yanOynanan">0</dd></div>
        </dl>
        <button class="dugme ikinci" id="yanIst" type="button">Tüm istatistikler</button>
      </aside>
    </main>

    <div class="klavye" id="klavye" role="group" aria-label="Klavye"></div>
  </div>

  <div class="tostlar" id="tostlar" aria-live="assertive"></div>

  <div class="perde" id="yardim" role="dialog" aria-modal="true" aria-labelledby="yardimBaslik" hidden>
    <div class="pencere" tabindex="-1">
      <button class="kapat" type="button" data-kapat aria-label="Kapat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
      <h2 id="yardimBaslik">Nasıl oynanır</h2>
      <p id="yardimHak">Beş harfli gizli kelimeyi altı tahminde bul.</p>
      <ul class="kurallar">
        <li>Her tahmin beş harfli gerçek bir Türkçe kelime olmalı.</li>
        <li>Gönderdikten sonra karoların rengi, tahminin kelimeye ne kadar yakın olduğunu gösterir.</li>
        <li>Türkçe harflerin hepsi var: Ç, Ğ, I, İ, Ö, Ş ve Ü ayrı harflerdir.</li>
      </ul>
      <div class="ornek">
        <div class="ornek-satir"><span class="mini" data-durum="d">K</span><span class="mini">A</span><span class="mini">L</span><span class="mini">E</span><span class="mini">M</span></div>
        <p><b class="t-d">K</b> kelimede ve doğru yerde.</p>
        <div class="ornek-satir"><span class="mini">S</span><span class="mini" data-durum="y">İ</span><span class="mini">M</span><span class="mini">İ</span><span class="mini">T</span></div>
        <p><b class="t-y">İ</b> kelimede var ama başka yerde.</p>
        <div class="ornek-satir"><span class="mini">Ç</span><span class="mini">O</span><span class="mini">R</span><span class="mini" data-durum="n">B</span><span class="mini">A</span></div>
        <p><b class="t-n">B</b> kelimede hiç yok.</p>
      </div>
      <p class="kucuk">Günün kelimesi her gece yarısı (İstanbul saati) yenilenir ve herkes için aynıdır. Serbest oyunda istediğin kadar kelime çözebilirsin.</p>
      <button class="dugme" type="button" data-kapat>Oynamaya başla</button>
    </div>
  </div>

  <div class="perde" id="ist" role="dialog" aria-modal="true" aria-labelledby="istBaslik" hidden>
    <div class="pencere" tabindex="-1">
      <button class="kapat" type="button" data-kapat aria-label="Kapat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
      <div class="sonuc" id="sonuc" hidden>
        <p class="sonuc-ust" id="sonucUst"></p>
        <div class="sonuc-kelime" id="sonucKelime"></div>
      </div>
      <h2 id="istBaslik">İstatistikler</h2>
      <div class="sayilar">
        <div><b id="sOynanan">0</b><span>Oynanan</span></div>
        <div><b id="sOran">0</b><span>Kazanma yüzdesi</span></div>
        <div><b id="sSeri">0</b><span>Güncel seri</span></div>
        <div><b id="sEnIyi">0</b><span>En iyi seri</span></div>
      </div>
      <h3>Tahmin dağılımı</h3>
      <div class="dagilim" id="dagilim"></div>
      <div class="sonuc-alt" id="sonucAlt" hidden>
        <div class="geri-sayim" id="geriSayimKutu"><span>Sıradaki kelime</span><b id="geriSayim">00:00:00</b></div>
        <div class="sonuc-dugmeler">
          <button class="dugme" id="paylas" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>
            Sonucu paylaş
          </button>
          <button class="dugme ikinci" id="sonucYeni" type="button" hidden>Yeni kelime</button>
        </div>
      </div>
    </div>
  </div>

  <script src="kelimeler.js"></script>
  <script src="oyun.js"></script>
</body>
</html>
`;

const STIL = String.raw`/* Beş Harf — gece mavisi zemin, çini yıldız deseni; turkuaz (doğru yer), safran (başka yer), arduvaz (yok). Fraunces ve Rubik. */
:root {
  --gece: #101631;
  --gece-2: #182046;
  --metin: #f6efe2;
  --metin-2: #b9bfd8;
  --metin-3: #8d94b3;
  --cizgi: rgba(246, 239, 226, 0.14);
  --cizgi-2: rgba(246, 239, 226, 0.32);
  --d: #22c1ad;
  --y: #efa93c;
  --n: #3a4166;
  --karo: 62px;
  --baslik: "Fraunces", Georgia, serif;
  --yazi: "Rubik", system-ui, -apple-system, "Segoe UI", sans-serif;
  --egri: cubic-bezier(0.22, 1, 0.36, 1);
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
[hidden] { display: none !important; }
html, body { margin: 0; height: 100%; overflow: hidden; background: var(--gece); }
body { color: var(--metin); font-family: var(--yazi); -webkit-font-smoothing: antialiased; user-select: none; -webkit-user-select: none; }
button { font: inherit; color: inherit; cursor: pointer; touch-action: manipulation; }
:focus-visible { outline: 2px solid var(--y); outline-offset: 2px; }
.zemin { position: fixed; inset: 0; z-index: -1;
  background:
    radial-gradient(70% 55% at 50% -10%, rgba(64, 86, 190, 0.45), transparent 70%),
    radial-gradient(40% 40% at 100% 100%, rgba(34, 193, 173, 0.14), transparent 70%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72' viewBox='0 0 72 72'%3E%3Cg fill='none' stroke='%23f6efe2' stroke-opacity='.05' stroke-width='1.2'%3E%3Cpath d='M36 14l6.4 15.6L58 36l-15.6 6.4L36 58l-6.4-15.6L14 36l15.6-6.4z'/%3E%3Crect x='24' y='24' width='24' height='24' transform='rotate(45 36 36)'/%3E%3C/g%3E%3C/svg%3E"),
    var(--gece);
}
.uygulama { height: 100vh; height: 100dvh; display: flex; flex-direction: column; padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }

/* Üst çubuk */
.ust { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; padding: 14px 24px; border-bottom: 1px solid var(--cizgi); }
.marka { display: flex; align-items: center; gap: 10px; font-family: var(--baslik); font-weight: 700; font-size: 25px; letter-spacing: -0.01em; white-space: nowrap; }
.logo { width: 30px; height: 30px; flex: none; }
.mod { display: flex; padding: 4px; border-radius: 999px; background: rgba(246, 239, 226, 0.06); border: 1px solid var(--cizgi); }
.mod button { border: 0; background: none; padding: 8px 18px; border-radius: 999px; font-size: 14.5px; font-weight: 500; color: var(--metin-2); white-space: nowrap; transition: background .25s, color .25s; }
.mod button[aria-selected="true"] { background: var(--metin); color: var(--gece); font-weight: 600; }
.ikonlar { display: flex; gap: 8px; justify-content: flex-end; }
.ikon { width: 42px; height: 42px; border-radius: 12px; border: 1px solid var(--cizgi); background: rgba(246, 239, 226, 0.05); display: grid; place-items: center; transition: background .2s; }
.ikon:hover { background: rgba(246, 239, 226, 0.12); }
.ikon svg { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }

/* Orta alan */
.orta { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr; justify-items: center; padding: 10px 16px 6px; }
.yan { display: none; }
.oyun-alan { width: 100%; max-width: 560px; min-height: 0; display: flex; flex-direction: column; align-items: center; }
.baslik-satir { display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 36px; margin-bottom: 6px; }
.altbaslik { margin: 0; color: var(--metin-2); font-size: 14px; font-weight: 500; text-align: center; }
.altbaslik b { color: var(--metin); font-weight: 600; }
.yeni { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px 6px 10px; border-radius: 999px; border: 1px solid var(--cizgi-2); background: none; font-size: 13.5px; font-weight: 600; }
.yeni:hover { background: rgba(246, 239, 226, 0.08); }
.yeni svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.1; stroke-linecap: round; stroke-linejoin: round; }
.tahta-kutu { flex: 1; min-height: 0; width: 100%; display: grid; place-items: center; }
.tahta { display: grid; gap: calc(var(--karo) * 0.1); }
.satir { display: grid; grid-template-columns: repeat(5, var(--karo)); gap: calc(var(--karo) * 0.1); }
.satir.sars { animation: sars .5s; }
@keyframes sars { 10%, 90% { transform: translateX(-2px); } 20%, 80% { transform: translateX(4px); } 30%, 50%, 70% { transform: translateX(-7px); } 40%, 60% { transform: translateX(7px); } }
.karo { width: var(--karo); height: var(--karo); display: grid; place-items: center; border-radius: calc(var(--karo) * 0.16); border: 2px solid var(--cizgi);
  font-weight: 700; font-size: calc(var(--karo) * 0.5); line-height: 1; color: var(--metin); background: rgba(246, 239, 226, 0.02); }
.karo.dolu { border-color: var(--cizgi-2); background: rgba(246, 239, 226, 0.06); animation: pop .12s ease-out; }
@keyframes pop { 50% { transform: scale(1.1); } }
.karo[data-durum] { border-color: transparent; }
.karo[data-durum="d"] { background: var(--d); color: #062a26; }
.karo[data-durum="y"] { background: var(--y); color: #3b2405; }
.karo[data-durum="n"] { background: var(--n); color: #d6dbef; }
.karo.cevir { animation: cevir .5s ease-in-out var(--g, 0ms) both; }
@keyframes cevir { 0% { transform: rotateX(0); } 50% { transform: rotateX(-90deg); } 100% { transform: rotateX(0); } }
.karo.zipla { animation: zipla .6s var(--egri) var(--g, 0ms) both; }
@keyframes zipla { 0%, 100% { transform: none; } 35% { transform: translateY(-34%); } 60% { transform: translateY(6%); } 80% { transform: translateY(-4%); } }

/* Klavye */
.klavye { width: 100%; max-width: 620px; margin: 0 auto; padding: 8px 8px 12px; display: flex; flex-direction: column; gap: 8px; }
.k-satir { display: flex; gap: 5px; justify-content: center; }
.tus { flex: 1 1 0; min-width: 0; max-width: 54px; height: 56px; border: 0; border-radius: 9px; background: #c9cde2; color: #141a38; font-weight: 600; font-size: 19px;
  display: grid; place-items: center; transition: background .3s, color .3s, transform .08s; }
.tus:active { transform: scale(0.94); }
.tus.genis { flex-grow: 1.55; max-width: 84px; font-size: 13.5px; font-weight: 700; }
.tus .tus-simge { display: none; }
.tus svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linejoin: round; stroke-linecap: round; }
.tus[data-durum="d"] { background: var(--d); color: #062a26; }
.tus[data-durum="y"] { background: var(--y); color: #3b2405; }
.tus[data-durum="n"] { background: var(--n); color: #9ba2c4; }

/* Yan paneller (geniş ekran) */
@media (min-width: 1100px) {
  .orta { grid-template-columns: 290px minmax(0, 560px) 290px; justify-content: center; align-items: center; gap: 56px; padding-top: 16px; }
  .yan { display: flex; flex-direction: column; gap: 10px; padding: 24px; border-radius: 22px; background: rgba(246, 239, 226, 0.04); border: 1px solid var(--cizgi); align-self: center; }
  .oyun-alan { height: 100%; }
}
.yan h2 { margin: 0 0 2px; font-family: var(--baslik); font-weight: 600; font-size: 22px; }
.yan p { margin: 0; color: var(--metin-2); font-size: 14.5px; line-height: 1.5; }
.yan p.kucuk { font-size: 13.5px; margin-bottom: 6px; }
.yan .not { margin-top: 6px; padding-top: 12px; border-top: 1px solid var(--cizgi); font-size: 13px; color: var(--metin-3); }
.ornek-satir { display: flex; gap: 5px; }
.mini { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 7px; border: 2px solid var(--cizgi-2); font-weight: 700; font-size: 17px; }
.mini[data-durum] { border-color: transparent; }
.mini[data-durum="d"] { background: var(--d); color: #062a26; }
.mini[data-durum="y"] { background: var(--y); color: #3b2405; }
.mini[data-durum="n"] { background: var(--n); color: #d6dbef; }
.t-d { color: var(--d); } .t-y { color: var(--y); } .t-n { color: #a5acd0; }
.yan-durum { display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; border-radius: 14px; background: rgba(246, 239, 226, 0.05); }
.yan-durum span { font-size: 13px; color: var(--metin-3); }
.yan-durum b { font-size: 18px; font-weight: 600; }
.yan-durum .saat { font-family: var(--yazi); font-variant-numeric: tabular-nums; font-size: 30px; font-weight: 600; letter-spacing: 0.01em; }
.yan-sayilar { margin: 4px 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.yan-sayilar div { text-align: center; }
.yan-sayilar dt { font-size: 12.5px; line-height: 1.25; color: var(--metin-3); min-height: 32px; display: flex; align-items: flex-end; justify-content: center; }
.yan-sayilar dd { margin: 2px 0 0; font-size: 24px; font-weight: 600; font-variant-numeric: tabular-nums; }

/* Düğmeler */
.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 46px; padding: 0 20px; border: 0; border-radius: 12px; background: var(--d); color: #062a26; font-weight: 600; font-size: 15.5px; transition: filter .2s, transform .1s; }
.dugme:hover { filter: brightness(1.08); }
.dugme:active { transform: scale(0.98); }
.dugme.ikinci { background: rgba(246, 239, 226, 0.08); color: var(--metin); border: 1px solid var(--cizgi-2); }
.dugme svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

/* Tostlar */
.tostlar { position: fixed; z-index: 30; top: 84px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; pointer-events: none; }
.tost { padding: 11px 18px; border-radius: 10px; background: var(--metin); color: var(--gece); font-weight: 600; font-size: 15px; white-space: nowrap; animation: tostGel .25s var(--egri); transition: opacity .3s; }
.tost.git { opacity: 0; }
@keyframes tostGel { from { opacity: 0; transform: translateY(-8px); } }

/* Pencereler */
.perde { position: fixed; z-index: 20; inset: 0; display: grid; place-items: center; padding: 16px; background: rgba(8, 11, 26, 0.72); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); animation: perdeGel .25s ease; }
@keyframes perdeGel { from { opacity: 0; } }
.pencere:focus { outline: none; }
.pencere { position: relative; width: min(460px, 100%); max-height: 100%; overflow: auto; padding: 28px 26px 24px; border-radius: 22px; background: var(--gece-2); border: 1px solid var(--cizgi-2); animation: pencereGel .35s var(--egri); user-select: text; -webkit-user-select: text; }
@keyframes pencereGel { from { opacity: 0; transform: translateY(14px) scale(.98); } }
.pencere h2 { margin: 0 0 8px; font-family: var(--baslik); font-weight: 700; font-size: 26px; }
.pencere h3 { margin: 22px 0 10px; font-size: 15px; font-weight: 600; color: var(--metin-2); }
.pencere p { margin: 0 0 12px; color: var(--metin-2); line-height: 1.55; font-size: 15px; }
.pencere p.kucuk { font-size: 13.5px; color: var(--metin-3); }
.pencere > .dugme { width: 100%; margin-top: 6px; }
.kapat { position: absolute; top: 14px; right: 14px; width: 38px; height: 38px; border-radius: 10px; border: 0; background: rgba(246, 239, 226, 0.06); display: grid; place-items: center; }
.kapat svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.kurallar { margin: 0 0 14px; padding-left: 20px; color: var(--metin-2); line-height: 1.55; font-size: 15px; }
.kurallar li + li { margin-top: 4px; }
.ornek { padding: 14px 0 4px; border-top: 1px solid var(--cizgi); border-bottom: 1px solid var(--cizgi); margin-bottom: 14px; }
.ornek p { margin: 8px 0 14px; font-size: 14px; }
.sayilar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.sayilar div { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 2px; }
.sayilar b { font-size: 32px; font-weight: 600; font-variant-numeric: tabular-nums; line-height: 1.1; }
.sayilar span { font-size: 12.5px; color: var(--metin-3); line-height: 1.25; }
.dagilim { display: flex; flex-direction: column; gap: 5px; }
.cubuk { display: grid; grid-template-columns: 14px 1fr; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; }
.cubuk i { display: block; min-width: 28px; width: 0; height: 24px; padding: 0 8px; border-radius: 6px; background: var(--n); text-align: right; font-style: normal; font-size: 13.5px; line-height: 24px; transition: width .6s var(--egri); }
.cubuk.bu i { background: var(--d); color: #062a26; }
.sonuc { text-align: center; padding-bottom: 6px; margin-bottom: 18px; border-bottom: 1px solid var(--cizgi); }
.sonuc-ust { margin: 0 0 10px !important; font-family: var(--baslik); font-size: 22px !important; color: var(--metin) !important; font-weight: 600; }
.sonuc-kelime { display: flex; justify-content: center; gap: 5px; margin-bottom: 14px; }
.sonuc-alt { margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--cizgi); display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: center; }
.geri-sayim { display: flex; flex-direction: column; }
.geri-sayim span { font-size: 13px; color: var(--metin-3); }
.geri-sayim b { font-size: 26px; font-weight: 600; font-variant-numeric: tabular-nums; }
.sonuc-dugmeler { display: flex; flex-direction: column; gap: 8px; }
.sonuc-alt.tek { grid-template-columns: 1fr; }

/* Telefon */
@media (max-width: 720px) {
  .ust { grid-template-columns: 1fr auto; grid-template-areas: "marka ikon" "mod mod"; padding: 10px 14px 10px; row-gap: 10px; }
  .marka { grid-area: marka; font-size: 23px; }
  .ikonlar { grid-area: ikon; }
  .mod { grid-area: mod; justify-self: stretch; }
  .mod button { flex: 1; padding: 8px 10px; }
  .ikon { width: 40px; height: 40px; }
  .orta { padding: 6px 12px 0; }
  .baslik-satir { min-height: 32px; margin-bottom: 4px; }
  .altbaslik { font-size: 13.5px; }
  .tostlar { top: 120px; }
  .klavye { padding: 6px 6px 10px; gap: 7px; }
  .k-satir { gap: 4px; }
  .tus { height: 54px; font-size: 18px; border-radius: 7px; }
  .tus.genis { font-size: 12px; }
  .tus .tus-yazi { display: none; }
  .tus .tus-simge { display: block; }
  .sayilar b { font-size: 28px; }
  .sonuc-alt { grid-template-columns: 1fr; text-align: center; }
  .geri-sayim { align-items: center; }
}
@media (max-height: 640px) { .tus { height: 46px; } .ust { padding-top: 8px; padding-bottom: 8px; } }
@media (prefers-reduced-motion: reduce) { .karo.cevir, .karo.zipla, .satir.sars { animation-duration: .01s; } }
`;

const OYUN = String.raw`// Beş Harf — oynanış sayıları ayarlar.json'dan gelir (Vayra Build ayar paneli bu dosyayı düzenler); kelimeler kelimeler.js'te.
var A = { tahminHakki: 6, sozlukDenetimi: 1, zorMod: 0, cevirmeHizi: 280 };
var ALFABE = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";
var SATIRLAR = ["ERTYUIOPĞÜ", "ASDFGHJKLŞİ", "ZCVBNMÖÇ"];
var SIRA_AD = ["Birinci", "İkinci", "Üçüncü", "Dördüncü", "Beşinci"];
var OVGU = ["Muhteşem!", "Harika!", "Çok iyi!", "Güzel!", "İyi iş!", "Kıl payı!", "Son anda!", "Son anda!"];
var DURUM_AD = { d: "doğru yerde", y: "kelimede var, başka yerde", n: "kelimede yok" };
var GUN_MS = 86400000, IST = 3 * 3600000, BAS = Math.floor(Date.UTC(2026, 0, 1) / GUN_MS);

var $ = function (id) { return document.getElementById(id); };
function buyuk(s) { return String(s || "").toLocaleUpperCase("tr-TR"); }
function gecerli(k) { if (k.length !== 5) return false; for (var i = 0; i < 5; i++) if (ALFABE.indexOf(k[i]) < 0) return false; return true; }
function kaydet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* depolama yok */ } }
function oku(k, v) { try { var x = localStorage.getItem(k); return x ? JSON.parse(x) : v; } catch (e) { return v; } }
function sayi(n) { return Number(n || 0).toLocaleString("tr-TR"); }

var CEV = [], SOZLUK = {}, SIRALI = [];
function kelimeleriHazirla() {
  var gor = {};
  (window.CEVAPLAR || []).forEach(function (k) { k = buyuk(String(k).trim()); if (gecerli(k) && !gor[k]) { gor[k] = 1; CEV.push(k); } });
  if (!CEV.length) CEV = ["KALEM"];
  CEV.forEach(function (k) { SOZLUK[k] = 1; });
  (window.EK_KELIMELER || []).forEach(function (k) { k = buyuk(String(k).trim()); if (gecerli(k)) SOZLUK[k] = 1; });
  SIRALI = karistir(CEV, 20260101);
}
/* Tohumlu karıştırma: günün kelimesi herkeste aynı sırayla gelir. */
function karistir(dizi, tohum) {
  var a = dizi.slice(), s = tohum >>> 0;
  function r() { s = (s + 0x6d2b79f5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; }
  return a;
}
function bugunNo() { return Math.floor((Date.now() + IST) / GUN_MS); }
function gunlukCevap(g) { var n = SIRALI.length; return SIRALI[(((g - BAS) % n) + n) % n]; }
function kalanSure() { var ms = (bugunNo() + 1) * GUN_MS - IST - Date.now(), s = Math.max(0, Math.floor(ms / 1000)); var p = function (x) { return String(x).padStart(2, "0"); }; return p(Math.floor(s / 3600)) + ":" + p(Math.floor(s / 60) % 60) + ":" + p(s % 60); }

/* ── Durum ── */
var mod = oku("bes-harf-mod", "gunluk") === "serbest" ? "serbest" : "gunluk";
var oyun = null, yazilan = "", kilit = false, hak = 6, karolar = [], tusEl = {};

function degerlendir(t, c) {
  var s = ["n", "n", "n", "n", "n"], kalan = {}, i;
  for (i = 0; i < 5; i++) { if (t[i] === c[i]) s[i] = "d"; else kalan[c[i]] = (kalan[c[i]] || 0) + 1; }
  for (i = 0; i < 5; i++) if (s[i] !== "d" && kalan[t[i]]) { s[i] = "y"; kalan[t[i]]--; }
  return s;
}
function yeniSerbest() {
  var once = oyun && oyun.cevap, c;
  do { c = CEV[Math.floor(Math.random() * CEV.length)]; } while (CEV.length > 1 && c === once);
  return { cevap: c, tahminler: [], bitti: false, kazandi: false };
}
function oyunKaydet() { kaydet("bes-harf-oyun-" + mod, oyun); }
function oyunYukle() {
  if (mod === "gunluk") {
    var g = bugunNo(), d = oku("bes-harf-oyun-gunluk", null);
    if (!d || d.gun !== g || d.cevap !== gunlukCevap(g) || !Array.isArray(d.tahminler)) d = { gun: g, cevap: gunlukCevap(g), tahminler: [], bitti: false, kazandi: false };
    oyun = d;
  } else {
    var s = oku("bes-harf-oyun-serbest", null);
    if (!s || !SOZLUK[s.cevap] || !Array.isArray(s.tahminler)) s = yeniSerbest();
    oyun = s;
  }
  yazilan = ""; kilit = false;
  tahtaKur(); klavyeBoya(); basliklariYaz(); boyutla(); yanGuncelle();
}

/* ── Tahta ── */
var tahtaEl = $("tahta");
function tahtaKur() {
  hak = Math.max(Math.round(A.tahminHakki), oyun.tahminler.length);
  tahtaEl.innerHTML = ""; karolar = [];
  for (var r = 0; r < hak; r++) {
    var sat = document.createElement("div"); sat.className = "satir"; sat.setAttribute("role", "row");
    var dz = [];
    for (var c = 0; c < 5; c++) { var k = document.createElement("div"); k.className = "karo"; k.setAttribute("role", "gridcell"); sat.appendChild(k); dz.push(k); }
    tahtaEl.appendChild(sat); karolar.push(dz);
  }
  oyun.tahminler.forEach(function (t, r) {
    var d = degerlendir(t, oyun.cevap);
    for (var c = 0; c < 5; c++) { var k = karolar[r][c]; k.textContent = t[c]; k.dataset.durum = d[c]; k.setAttribute("aria-label", t[c] + ", " + DURUM_AD[d[c]]); }
  });
  satirYaz();
}
function satirYaz() {
  if (oyun.bitti) return;
  var r = oyun.tahminler.length; if (r >= hak) return;
  for (var c = 0; c < 5; c++) { var k = karolar[r][c], h = yazilan[c] || ""; if (k.textContent !== h) { k.textContent = h; k.classList.toggle("dolu", !!h); } }
}
function boyutla() {
  var kutu = $("tahtaKutu"), w = kutu.clientWidth, h = kutu.clientHeight;
  var k = Math.floor(Math.min((w - 4) / 5.4, (h - 4) / (hak + (hak - 1) * 0.1), 74));
  document.documentElement.style.setProperty("--karo", Math.max(30, k) + "px");
}
addEventListener("resize", boyutla);

/* ── Klavye ── */
var GONDER_ICERIK = '<span class="tus-yazi">Gönder</span><svg class="tus-simge" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 5v7a3 3 0 0 1-3 3H5" /><path d="m9 11-4 4 4 4" /></svg>';
var SIL_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7z" /><path d="m12 9.5 5 5m0-5-5 5" /></svg>';
function klavyeKur() {
  var el = $("klavye");
  SATIRLAR.forEach(function (s, i) {
    var sat = document.createElement("div"); sat.className = "k-satir";
    if (i === 2) sat.appendChild(tus("GONDER", GONDER_ICERIK, true, "Tahmini gönder"));
    s.split("").forEach(function (h) { sat.appendChild(tus(h, h, false, h)); });
    if (i === 2) sat.appendChild(tus("SIL", SIL_SVG, true, "Harf sil"));
    el.appendChild(sat);
  });
}
function tus(kod, icerik, genis, etiket) {
  var b = document.createElement("button"); b.type = "button"; b.className = "tus" + (genis ? " genis" : ""); b.innerHTML = icerik; b.setAttribute("aria-label", etiket);
  b.addEventListener("click", function () { b.blur(); girdi(kod); });
  if (!genis) tusEl[kod] = b;
  return b;
}
function klavyeBoya() {
  var dz = { d: 3, y: 2, n: 1 }, en = {};
  oyun.tahminler.forEach(function (t) { var d = degerlendir(t, oyun.cevap); for (var i = 0; i < 5; i++) if (!en[t[i]] || dz[d[i]] > dz[en[t[i]]]) en[t[i]] = d[i]; });
  Object.keys(tusEl).forEach(function (h) { if (en[h]) tusEl[h].dataset.durum = en[h]; else delete tusEl[h].dataset.durum; });
}
function girdi(kod) {
  if (kod === "GONDER") return gonder();
  if (kod === "SIL") return sil();
  harfEkle(kod);
}
function harfEkle(h) {
  if (kilit || oyun.bitti || yazilan.length >= 5) return;
  yazilan += h; satirYaz();
}
function sil() { if (kilit || oyun.bitti || !yazilan) return; yazilan = yazilan.slice(0, -1); satirYaz(); }

addEventListener("keydown", function (e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (!$("yardim").hidden || !$("ist").hidden) { if (e.key === "Escape") pencereKapat(); return; }
  if (e.key === "Enter") { e.preventDefault(); gonder(); return; }
  if (e.key === "Backspace") { e.preventDefault(); sil(); return; }
  if (e.key && e.key.length === 1) { var h = buyuk(e.key); if (ALFABE.indexOf(h) >= 0) harfEkle(h); }
});

/* ── Gönderme ── */
function zorModHatasi(t) {
  for (var r = 0; r < oyun.tahminler.length; r++) {
    var o = oyun.tahminler[r], d = degerlendir(o, oyun.cevap), gerek = {}, i;
    for (i = 0; i < 5; i++) if (d[i] === "d" && t[i] !== o[i]) return SIRA_AD[i] + " harf " + o[i] + " olmalı";
    for (i = 0; i < 5; i++) if (d[i] !== "n") gerek[o[i]] = (gerek[o[i]] || 0) + 1;
    for (var h in gerek) { var adet = t.split(h).length - 1; if (adet < gerek[h]) return "Tahminde " + h + " harfi olmalı"; }
  }
  return "";
}
function sars(m) {
  tost(m);
  var sat = tahtaEl.children[oyun.tahminler.length]; if (!sat) return;
  sat.classList.remove("sars"); void sat.offsetWidth; sat.classList.add("sars");
}
function gonder() {
  if (kilit || oyun.bitti) return;
  if (yazilan.length < 5) return sars("Beş harf yazmalısın");
  if (A.sozlukDenetimi >= 0.5 && !SOZLUK[yazilan]) return sars("Bu kelime listemizde yok");
  if (A.zorMod >= 0.5) { var z = zorModHatasi(yazilan); if (z) return sars(z); }
  var t = yazilan, r = oyun.tahminler.length, d = degerlendir(t, oyun.cevap);
  oyun.tahminler.push(t); yazilan = "";
  var kazandi = t === oyun.cevap, kaybetti = !kazandi && oyun.tahminler.length >= hak;
  if (kazandi || kaybetti) { oyun.bitti = true; oyun.kazandi = kazandi; }
  oyunKaydet();
  if (oyun.bitti) istKaydet(kazandi, oyun.tahminler.length);
  ac(r, t, d, function () {
    klavyeBoya(); basliklariYaz(); yanGuncelle();
    if (kazandi) {
      tost(OVGU[Math.min(r, OVGU.length - 1)], 1900);
      karolar[r].forEach(function (k, i) { k.style.setProperty("--g", (i * 90) + "ms"); k.classList.add("zipla"); });
      setTimeout(function () { sonucAc(); }, 1700);
    } else if (kaybetti) {
      tost(oyun.cevap, 2600);
      setTimeout(function () { sonucAc(); }, 1900);
    }
  });
}
function ac(r, t, d, bitince) {
  kilit = true;
  var adim = Math.max(60, A.cevirmeHizi);
  karolar[r].forEach(function (k, c) {
    k.classList.remove("dolu");
    k.style.setProperty("--g", (c * adim) + "ms"); k.classList.add("cevir");
    setTimeout(function () { k.dataset.durum = d[c]; k.setAttribute("aria-label", t[c] + ", " + DURUM_AD[d[c]]); }, c * adim + 250);
  });
  setTimeout(function () { karolar[r].forEach(function (k) { k.classList.remove("cevir"); }); kilit = false; bitince(); }, 4 * adim + 540);
}

/* ── İstatistik ── */
function istBos() { return { oynanan: 0, kazanilan: 0, seri: 0, enIyi: 0, dagilim: [0, 0, 0, 0, 0, 0, 0, 0], sonGun: null }; }
function istOku() { var s = oku("bes-harf-ist-" + mod, null); return s && s.dagilim ? s : istBos(); }
function istKaydet(kazandi, deneme) {
  var s = istOku();
  s.oynanan++;
  if (kazandi) {
    s.kazanilan++; s.dagilim[deneme - 1] = (s.dagilim[deneme - 1] || 0) + 1;
    s.seri = mod === "gunluk" ? (s.sonGun === oyun.gun - 1 ? s.seri : 0) + 1 : s.seri + 1;
    s.enIyi = Math.max(s.enIyi, s.seri);
  } else s.seri = 0;
  if (mod === "gunluk") s.sonGun = kazandi ? oyun.gun : null;
  kaydet("bes-harf-ist-" + mod, s);
}
function gorunenSeri(s) { if (mod === "gunluk" && s.sonGun != null && s.sonGun < bugunNo() - 1) return 0; return s.seri; }
function oran(s) { return s.oynanan ? Math.round((s.kazanilan / s.oynanan) * 100) : 0; }

/* ── Başlıklar ve yan panel ── */
function basliklariYaz() {
  var a = $("altBaslik"), kalan = hak - oyun.tahminler.length;
  if (mod === "gunluk") a.innerHTML = "Günün bulmacası <b>" + sayi(oyun.gun - BAS + 1) + "</b> · " + (oyun.bitti ? (oyun.kazandi ? "çözüldü" : "bu sefer olmadı") : "<b>" + kalan + "</b> hak kaldı");
  else a.innerHTML = "Serbest oyun · " + (oyun.bitti ? (oyun.kazandi ? "çözüldü" : "bu sefer olmadı") : "<b>" + kalan + "</b> hak kaldı");
  $("yeniKelime").hidden = mod !== "serbest";
  $("yardimHak").textContent = "Beş harfli gizli kelimeyi " + ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz", "on"][Math.min(10, hak)] + " tahminde bul.";
  var n = [];
  if (A.zorMod >= 0.5) n.push("Zor mod açık: bulduğun ipuçlarını sonraki tahminlerde kullanmalısın.");
  if (A.sozlukDenetimi < 0.5) n.push("Sözlük denetimi kapalı: beş harfli her tahmin kabul edilir.");
  n.push("Klavyeden de yazabilirsin: Enter gönderir, geri tuşu siler.");
  $("kuralNot").textContent = n.join(" ");
  $$("[data-mod]").forEach(function (b) { b.setAttribute("aria-selected", String(b.dataset.mod === mod)); });
}
function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
function yanGuncelle() {
  var s = istOku();
  $("yanBaslik").textContent = mod === "gunluk" ? "Günün bulmacası" : "Serbest oyun";
  $("yanSeri").textContent = sayi(gorunenSeri(s));
  $("yanOran").textContent = oran(s);
  $("yanOynanan").textContent = sayi(s.oynanan);
  var d = $("yanDurum");
  if (mod === "gunluk") {
    if (oyun.bitti) d.innerHTML = "<span>" + (oyun.kazandi ? "Bugünü " + oyun.tahminler.length + ". tahminde çözdün" : "Bugünün kelimesi " + oyun.cevap + " idi") + "</span><span>Sıradaki kelime</span><b class=\"saat\" data-sayim>" + kalanSure() + "</b>";
    else d.innerHTML = "<span>Bulmaca " + sayi(oyun.gun - BAS + 1) + "</span><b>" + (oyun.tahminler.length ? oyun.tahminler.length + " tahmin yaptın" : "Henüz tahmin yok") + "</b><span>Yeni kelimeye</span><b class=\"saat\" data-sayim>" + kalanSure() + "</b>";
  } else {
    d.innerHTML = "<span>Kelime havuzu</span><b>" + sayi(CEV.length) + " kelime</b><span>" + (oyun.bitti ? "Yeni kelime düğmesiyle devam et" : "İstediğin kadar kelime çöz") + "</span>";
  }
}
setInterval(function () {
  $$("[data-sayim]").forEach(function (e) { e.textContent = kalanSure(); });
  var g = $("geriSayim"); if (g) g.textContent = kalanSure();
  if (mod === "gunluk" && oyun && oyun.gun !== bugunNo() && !kilit) oyunYukle();
}, 1000);

/* ── Tost ── */
function tost(m, sure) {
  var t = document.createElement("div"); t.className = "tost"; t.textContent = m;
  var kap = $("tostlar"); kap.prepend(t);
  while (kap.children.length > 3) kap.lastChild.remove();
  setTimeout(function () { t.classList.add("git"); setTimeout(function () { t.remove(); }, 320); }, sure || 1300);
}

/* ── Pencereler ── */
var sonOdak = null;
function pencereAc(id) { sonOdak = document.activeElement; $(id).hidden = false; var b = $(id).querySelector(".pencere"); if (b) b.focus({ preventScroll: true }); }
function pencereKapat() { ["yardim", "ist"].forEach(function (id) { $(id).hidden = true; }); if (sonOdak && sonOdak.focus) sonOdak.focus(); }
$$("[data-kapat]").forEach(function (b) { b.addEventListener("click", pencereKapat); });
$$(".perde").forEach(function (p) { p.addEventListener("click", function (e) { if (e.target === p) pencereKapat(); }); });
$("yardimAc").addEventListener("click", function () { pencereAc("yardim"); });
$("istAc").addEventListener("click", function () { sonucAc(); });
$("yanIst").addEventListener("click", function () { sonucAc(); });

function sonucAc() {
  var s = istOku();
  $("istBaslik").textContent = mod === "gunluk" ? "Günün kelimesi istatistikleri" : "Serbest oyun istatistikleri";
  $("sOynanan").textContent = sayi(s.oynanan);
  $("sOran").textContent = oran(s);
  $("sSeri").textContent = sayi(gorunenSeri(s));
  $("sEnIyi").textContent = sayi(s.enIyi);
  var en = 1, i; for (i = 0; i < hak; i++) en = Math.max(en, s.dagilim[i] || 0);
  var dg = $("dagilim"); dg.innerHTML = "";
  for (i = 0; i < hak; i++) {
    var c = document.createElement("div"); c.className = "cubuk" + (oyun.bitti && oyun.kazandi && oyun.tahminler.length === i + 1 ? " bu" : "");
    c.innerHTML = "<span>" + (i + 1) + "</span><i>" + (s.dagilim[i] || 0) + "</i>";
    dg.appendChild(c);
    (function (el, w) { requestAnimationFrame(function () { el.style.width = w; }); })(c.querySelector("i"), Math.max(7, Math.round(((s.dagilim[i] || 0) / en) * 100)) + "%");
  }
  $("sonuc").hidden = !oyun.bitti; $("sonucAlt").hidden = !oyun.bitti;
  if (oyun.bitti) {
    $("sonucUst").textContent = oyun.kazandi ? OVGU[Math.min(oyun.tahminler.length - 1, OVGU.length - 1)] + " " + oyun.tahminler.length + ". tahminde buldun." : "Bu sefer olmadı. Kelime şuydu:";
    $("sonucKelime").innerHTML = oyun.cevap.split("").map(function (h) { return "<span class=\"mini\" data-durum=\"" + (oyun.kazandi ? "d" : "y") + "\">" + h + "</span>"; }).join("");
    $("geriSayimKutu").hidden = mod !== "gunluk";
    $("sonucYeni").hidden = mod !== "serbest";
    $("sonucAlt").classList.toggle("tek", mod !== "gunluk");
    $("geriSayim").textContent = kalanSure();
  }
  pencereAc("ist");
}

/* ── Paylaşım ── */
function paylasMetni() {
  var bas = "Beş Harf " + (mod === "gunluk" ? sayi(oyun.gun - BAS + 1) : "serbest") + " " + (oyun.kazandi ? oyun.tahminler.length : "X") + "/" + hak + (A.zorMod >= 0.5 ? "*" : "");
  var renk = { d: "🟩", y: "🟨", n: "⬛" };
  return bas + "\n\n" + oyun.tahminler.map(function (t) { return degerlendir(t, oyun.cevap).map(function (x) { return renk[x]; }).join(""); }).join("\n");
}
function kopyala(m) {
  function eski() {
    var a = document.createElement("textarea"); a.value = m; a.setAttribute("readonly", ""); a.style.position = "fixed"; a.style.opacity = "0";
    document.body.appendChild(a); a.select(); var ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; } a.remove();
    return ok ? Promise.resolve() : Promise.reject(new Error("kopyalanamadı"));
  }
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(m).catch(eski);
  return eski();
}
$("paylas").addEventListener("click", function () {
  var m = paylasMetni();
  if (navigator.share && matchMedia("(pointer: coarse)").matches) { navigator.share({ text: m }).catch(function () { kopyala(m).then(function () { tost("Sonuç panoya kopyalandı"); }); }); return; }
  kopyala(m).then(function () { tost("Sonuç panoya kopyalandı"); }, function () { tost("Kopyalanamadı, tarayıcı izin vermedi"); });
});

/* ── Mod ve yeni kelime ── */
$$("[data-mod]").forEach(function (b) {
  b.addEventListener("click", function () {
    if (kilit || b.dataset.mod === mod) return;
    mod = b.dataset.mod; kaydet("bes-harf-mod", mod); oyunYukle();
  });
});
function yeniKelime() {
  if (kilit) return;
  if (!oyun.bitti && oyun.tahminler.length) { istKaydet(false, 0); tost("Önceki kelime " + oyun.cevap + " idi", 2000); }
  oyun = yeniSerbest(); oyunKaydet(); pencereKapat(); oyunYukle();
}
$("yeniKelime").addEventListener("click", function () { this.blur(); yeniKelime(); });
$("sonucYeni").addEventListener("click", yeniKelime);

/* ── Başlangıç ── */
klavyeKur();
fetch("ayarlar.json", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
  Object.keys(j).forEach(function (k) { if (j[k] && typeof j[k].deger === "number") A[k] = j[k].deger; });
}).catch(function () {}).then(function () {
  A.tahminHakki = Math.max(3, Math.min(10, Math.round(A.tahminHakki)));
  kelimeleriHazirla(); oyunYukle();
  if (!oku("bes-harf-yardim", false)) { kaydet("bes-harf-yardim", true); pencereAc("yardim"); }
  else if (oyun.bitti) setTimeout(sonucAc, 400);
});
`;

export const BES_HARF = {
  id: "bes-harf",
  ad: "Beş Harf · Kelime Bulmacası",
  tur: "oyun" as const,
  aciklama: "Türkçe beş harfli kelime bulmacası: Türkçe klavye, günün kelimesi ve serbest oyun, zor mod, istatistik ve paylaşılabilir sonuç",
  kapak: "/gercek/build/sablon/bes-harf.webp",
  dosyalar: {
    "index.html": HTML,
    "stil.css": STIL,
    "ayarlar.json": `{
  "tahminHakki": { "etiket": "Tahmin hakkı", "deger": 6, "min": 4, "max": 8, "adim": 1 },
  "sozlukDenetimi": { "etiket": "Sözlük denetimi (0 kapalı, 1 açık)", "deger": 1, "min": 0, "max": 1, "adim": 1 },
  "zorMod": { "etiket": "Zor mod: ipuçları kullanılmalı (0 kapalı, 1 açık)", "deger": 0, "min": 0, "max": 1, "adim": 1 },
  "cevirmeHizi": { "etiket": "Karo çevirme arası (milisaniye)", "deger": 280, "min": 100, "max": 500, "adim": 20 }
}
`,
    "kelimeler.js": KELIMELER_JS,
    "oyun.js": OYUN,
    "ikon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#101631" />
  <rect x="9" y="9" width="21" height="21" rx="5" fill="#22c1ad" />
  <rect x="34" y="9" width="21" height="21" rx="5" fill="none" stroke="#f6efe2" stroke-opacity=".45" stroke-width="2.4" />
  <rect x="9" y="34" width="21" height="21" rx="5" fill="none" stroke="#f6efe2" stroke-opacity=".45" stroke-width="2.4" />
  <rect x="34" y="34" width="21" height="21" rx="5" fill="#efa93c" />
</svg>
`,
  },
};
