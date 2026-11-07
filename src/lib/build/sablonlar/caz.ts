/* Şablon: Mavi Nota Caz Kulübü — Asmalımescit, Beyoğlu. Program "konserler" tablosundan (ay ve tür süzgeci, "bu gece
 * sahnede" şeridi İstanbul saatine göre), konser sayfası, masa rezervasyonu: api/rezervasyon.js sunucu fonksiyonu kapasiteyi
 * denetleyip "rezervasyonlar" tablosuna yazar (ziyaretçi tabloya doğrudan ekleyemez, okuyamaz), kalan yerler api/doluluk.js
 * ile kişisel veri olmadan gösterilir. Kulüp ve bar menüsü, özel etkinlik formu, bülten formu, KVKK metni. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";

const G = (d: string) => `/gercek/havuz/gorsel/${d}.webp`;
const TURLER = ["Vokal caz", "Piyano", "Swing", "Latin caz", "Bebop", "Füzyon", "Anadolu caz", "Soul caz", "Jam gecesi", "Plak gecesi"];

/** Her gece bir konser; pazartesi kulüp kapalı. Tarihler şablon yüklendiği güne göre kurulur (program hep ileriye bakar). */
const KONSERLER = [
  { id: "k-selin-ayaz", baslik: "Selin Ayaz Quartet", altBaslik: "Ella'nın şarkı defterinden", tur: "Vokal caz", saat: "21:30", kapi: 650, kapasite: 80, gorsel: "/gercek/muzik/vs-kehribar.webp", kadro: "Selin Ayaz (vokal), Kerem Tunç (piyano), Onur Balcı (kontrbas), Ece Duman (davul)", aciklama: "Selin Ayaz, kırk yılların balad'larını ve hızlı swing parçalarını sıcak, yakın bir sesle yeniden yorumluyor. İlk set daha sakin, ikinci set dansa davet eden standartlarla geçiyor." },
  { id: "k-kerem-tunc", baslik: "Kerem Tunç Trio", altBaslik: "Yeni albüm Geç Saatler'in tanıtım gecesi", tur: "Piyano", saat: "21:30", kapi: 550, kapasite: 75, gorsel: "/gercek/galeri/portre10.webp", kadro: "Kerem Tunç (piyano), Onur Balcı (kontrbas), Sarp Ekin (davul)", aciklama: "Kerem Tunç'un ikinci albümündeki besteler ilk kez bütünüyle sahnede. Modal armoniler, İstanbul gecelerinden esinlenen sakin melodiler ve uzun doğaçlamalar." },
  { id: "k-jam-1", baslik: "Açık Sahne: Jam Gecesi", altBaslik: "Ev orkestrası ve sahneye çıkan herkes", tur: "Jam gecesi", saat: "22:00", kapi: 250, kapasite: 90, gorsel: G("mk-muzik-427"), kadro: "Ev orkestrası: Baran Kaya (davul), İlke Sezer (piyano), Onur Balcı (kontrbas)", aciklama: "İlk set ev orkestrasının, sonrası sahneye çıkmak isteyen müzisyenlerin. Enstrümanını getir, isim listesine kapıda yazıl. Standartlar çalınır, nota sehpası hazır." },
  { id: "k-defne-kural", baslik: "Defne Kural Sextet", altBaslik: "Havana'dan Rio'ya", tur: "Latin caz", saat: "21:30", kapi: 600, kapasite: 80, gorsel: "/gercek/muzik/vs-kuyu.webp", kadro: "Defne Kural (flüt), Diego Aranda (perküsyon), Selim Ateş (piyano), Uğur Narin (bas), Kaan Arı (davul), Melis Tan (trompet)", aciklama: "Afro-Küba ritimleri, bossa nova ve samba üzerine kurulu, ayakta durmayı zorlaştıran bir gece. Defne Kural'ın flütü ile altı kişilik ritim bölümü sahnede." },
  { id: "k-big-band", baslik: "Mavi Nota Big Band", altBaslik: "Swing çağının büyük orkestra düzenlemeleri", tur: "Swing", saat: "21:00", kapi: 750, kapasite: 90, gorsel: "/gercek/muzik/ms-brass.webp", kadro: "On yedi kişilik orkestra; şef Murat Aydemir", aciklama: "Kulübün ev big band'i ayda bir sahnede. Nefesli bölümün tam kadro çaldığı, klasik düzenlemelerle kulübün en kalabalık gecesi; erken rezervasyon önerilir." },
  { id: "k-anadolu", baslik: "Hüsnü Ilgaz: Anadolu Caz Projesi", altBaslik: "Ud, kaval ve ritim bölümü", tur: "Anadolu caz", saat: "21:30", kapi: 600, kapasite: 80, gorsel: "/gercek/muzik/ms-kadeh.webp", kadro: "Hüsnü Ilgaz (ud), Cem Arıkan (kaval), Nehir Uslu (kontrbas), Tamer Aksu (davul ve bendir)", aciklama: "Türküler ve makamlar, caz armonisi ve doğaçlamayla buluşuyor. Aksak ritimler üzerine uzun soloların olduğu, kulübün kendine özgü gecelerinden biri." },
  { id: "k-emre-sarp", baslik: "Emre Sarp Organ Trio", altBaslik: "Hammond orgu ile soul ve groove", tur: "Soul caz", saat: "22:00", kapi: 550, kapasite: 80, gorsel: "/gercek/muzik/vs-kuzey.webp", kadro: "Emre Sarp (org), Deniz Oral (gitar), Can Uyar (davul)", aciklama: "Altmışların organ trio geleneği: kalın bas hatları, blues kokan gitar ve sallanan bir davul. Gece ilerledikçe tempo artar." },
  { id: "k-ada-bilgin", baslik: "Ada Bilgin: Solo Piyano", altBaslik: "Sessiz bir gece için", tur: "Piyano", saat: "21:00", kapi: 500, kapasite: 60, gorsel: G("mk-muzik-44147"), kadro: "Ada Bilgin (piyano)", aciklama: "Kulübün 1928 yapımı kuyruklu piyanosunda tek kişilik bir konser. Ballad'lar, Ada Bilgin'in kendi besteleri ve dinleyiciden gelen istekler. Bu gece masalar sahneye daha yakın kurulur." },
  { id: "k-tarik-ersoy", baslik: "Tarık Ersoy Quartet", altBaslik: "Bebop klasikleri", tur: "Bebop", saat: "21:30", kapi: 600, kapasite: 80, gorsel: "/gercek/muzik/vs-depo.webp", kadro: "Tarık Ersoy (tenor saksafon), İlke Sezer (piyano), Onur Balcı (kontrbas), Baran Kaya (davul)", aciklama: "Kırk yıllık sahne hayatıyla Tarık Ersoy, bebop'un hızlı temalarını ve uzun nefesli solo geleneğini sürdürüyor. Kulübün en sadık dinleyicilerinin gecesi." },
  { id: "k-fuzyon", baslik: "Gece Yarısı Füzyon Kolektifi", altBaslik: "Elektrik gitar, synth ve serbest form", tur: "Füzyon", saat: "22:30", kapi: 500, kapasite: 85, gorsel: G("mk-muzik-42824"), kadro: "Arda Gül (gitar), Zeynep Er (synth), Barış Kılıç (elektrik bas), Sarp Ekin (davul)", aciklama: "Yetmişlerin füzyon kayıtlarından bugünün elektronik dokularına uzanan, sesin yüksek ve gecenin uzun olduğu bir set. Son set gece yarısını geçer." },
  { id: "k-lara-demirci", baslik: "Lara Demirci Trio", altBaslik: "Türkçe caz şarkıları", tur: "Vokal caz", saat: "21:30", kapi: 600, kapasite: 80, gorsel: "/gercek/galeri/portre12.webp", kadro: "Lara Demirci (vokal), Selim Ateş (piyano), Uğur Narin (kontrbas)", aciklama: "Altmışların Türkçe sözlü caz şarkıları ve Lara Demirci'nin yeni besteleri. Yumuşak bir ses, sade bir trio ve şarkıların hikâyeleri." },
  { id: "k-plak", baslik: "Plak Gecesi: 1959", altBaslik: "Ahmet Yalvaç'ın arşivinden", tur: "Plak gecesi", saat: "21:00", kapi: 300, kapasite: 70, gorsel: "/gercek/galeri/portre2.webp", kadro: "Ahmet Yalvaç (plak ve anlatım)", aciklama: "Caz tarihinin en verimli yılı 1959'un kayıtları, orijinal baskı plaklardan ve iyi bir ses sisteminden. Ahmet Yalvaç her plağın hikâyesini anlatıyor; konuşmasız ikinci yarıda sadece müzik." },
  { id: "k-jam-2", baslik: "Açık Sahne: Jam Gecesi", altBaslik: "Vokalistlere ayrılmış gece", tur: "Jam gecesi", saat: "22:00", kapi: 250, kapasite: 90, gorsel: G("mk-isik-38"), kadro: "Ev orkestrası: İlke Sezer (piyano), Onur Balcı (kontrbas), Baran Kaya (davul)", aciklama: "Bu ayın vokal jam'i. Şarkını ve tonunu kapıdaki listeye yaz, ev orkestrası eşlik etsin. İlk kez sahneye çıkanlara her zaman yer var." },
  { id: "k-bossa", baslik: "Bossa Akşamı", altBaslik: "Eda Karasu ve Mert Ilık", tur: "Latin caz", saat: "21:00", kapi: 500, kapasite: 70, gorsel: G("mk-isik-3461"), kadro: "Eda Karasu (vokal), Mert Ilık (klasik gitar)", aciklama: "Mum ışığında, iki kişilik bir bossa nova gecesi. Portekizce klasikler ve Türkçeye uyarlanmış birkaç sürpriz." },
  { id: "k-swing-balo", baslik: "Swing Balosu", altBaslik: "Dans pisti açık, ders saat 20.00'de", tur: "Swing", saat: "21:00", kapi: 450, kapasite: 90, gorsel: G("mk-moda-4043"), kadro: "Mavi Nota Swing Altılısı; dans eğitmeni Sena Polat", aciklama: "Masalar kenara çekiliyor. Saat 20.00'de yeni başlayanlar için kısa bir lindy hop dersi, ardından bütün gece canlı swing. Dans ayakkabısı şart değil." },
].map((k, i) => ({ ...k, sira: i, aktif: true }));

/** Bugünden başlayarak pazartesi dışındaki günlere sırayla bir konser yerleştirir. */
function istanbulBugun() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
function programTarihleri(n: number) {
  const l: string[] = []; const d = new Date(istanbulBugun() + "T12:00:00Z");
  while (l.length < n) { if (d.getUTCDay() !== 1) l.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
  return l;
}
const TARIHLER = programTarihleri(KONSERLER.length);

const TABLOLAR: Record<string, SablonTablo> = {
  konserler: {
    aciklama: "Kulübün programı. Program, ana sayfa ve konser sayfası bu tablodan okur; aktif olmayan ya da tarihi geçen konser gösterilmez.",
    kurallar: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" },
    sema: [
      { ad: "baslik", tur: "metin", zorunlu: true, aciklama: "Sanatçı ya da grup adı" },
      { ad: "altBaslik", tur: "metin" },
      { ad: "tur", tur: "secim", zorunlu: true, secenekler: TURLER },
      { ad: "tarih", tur: "metin", zorunlu: true, aciklama: "YYYY-AA-GG" },
      { ad: "saat", tur: "metin", zorunlu: true, aciklama: "SS:DD" },
      { ad: "kapi", tur: "sayi", zorunlu: true, aciklama: "Kişi başı kapı ücreti, TL" },
      { ad: "kapasite", tur: "sayi", zorunlu: true, aciklama: "Rezervasyona açık toplam kişi" },
      { ad: "gorsel", tur: "gorsel" },
      { ad: "kadro", tur: "metin" },
      { ad: "aciklama", tur: "uzunMetin" },
      { ad: "aktif", tur: "mantiksal", varsayilan: true },
      { ad: "sira", tur: "sayi" },
    ],
    kayitlar: KONSERLER.map((k, i) => ({ ...k, tarih: TARIHLER[i] })),
  },
  rezervasyonlar: {
    aciklama: "Masa rezervasyonları. Kayıtları api/rezervasyon.js sunucu fonksiyonu kapasiteyi denetleyerek ekler; ziyaretçi tabloya doğrudan yazamaz ve okuyamaz.",
    kurallar: { okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" },
    sema: [
      { ad: "kod", tur: "metin", zorunlu: true, aciklama: "Rezervasyon kodu, kapıda sorulur" },
      { ad: "konser", tur: "metin", zorunlu: true, aciklama: "konserler tablosundaki kayıt kimliği" },
      { ad: "konserAdi", tur: "metin" },
      { ad: "tarih", tur: "metin" },
      { ad: "kisi", tur: "sayi", zorunlu: true },
      { ad: "oturma", tur: "secim", secenekler: ["Sahne önü", "Salon", "Bar"] },
      { ad: "ad", tur: "metin", zorunlu: true },
      { ad: "telefon", tur: "metin", zorunlu: true },
      { ad: "eposta", tur: "eposta" },
      { ad: "not", tur: "uzunMetin" },
      { ad: "kvkk", tur: "mantiksal", zorunlu: true },
      { ad: "durum", tur: "secim", secenekler: ["Onaylandı", "Geldi", "İptal"], varsayilan: "Onaylandı" },
    ],
    kayitlar: [],
  },
};

const MENU = [
  { ad: "Mavi Nota", ic: "Cin, kelebek bezelye çiçeği, limon, bal", fiyat: 420, grup: "Kokteyl" },
  { ad: "Asmalı Old Fashioned", ic: "Burbon, kestane şurubu, portakal kabuğu", fiyat: 460, grup: "Kokteyl" },
  { ad: "Galata Negroni", ic: "Cin, kırmızı vermut, bitter, ardıç", fiyat: 450, grup: "Kokteyl" },
  { ad: "Gece Yarısı Espresso", ic: "Votka, soğuk demleme kahve, vanilya", fiyat: 440, grup: "Kokteyl" },
  { ad: "Bergamot Soda", ic: "Bergamot, ıhlamur, maden suyu; alkolsüz", fiyat: 220, grup: "Alkolsüz" },
  { ad: "Ihlamur Limonata", ic: "Taze limon, ıhlamur şurubu, nane", fiyat: 200, grup: "Alkolsüz" },
  { ad: "Kadeh şarap", ic: "Trakya ve Ege bağlarından, haftanın seçkisi", fiyat: 380, grup: "Şarap ve bira" },
  { ad: "Fıçı bira", ic: "Yerel butik bira, 40 cl", fiyat: 240, grup: "Şarap ve bira" },
  { ad: "Peynir tabağı", ic: "Kars gravyeri, Ezine, tulum, bal ve ceviz", fiyat: 520, grup: "Mutfak" },
  { ad: "Trüflü patates", ic: "Parmesan ve maydanozla", fiyat: 300, grup: "Mutfak" },
  { ad: "Zeytin ve badem", ic: "Kekikli zeytin, tuzlu badem", fiyat: 180, grup: "Mutfak" },
  { ad: "Bitter çikolatalı tart", ic: "Deniz tuzu ve krem şanti", fiyat: 260, grup: "Mutfak" },
];

const NOTA = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M12 24.5a4 4 0 1 1-2-3.46V6.5l14-3v17a4 4 0 1 1-2-3.46V9.1l-10 2.14z" fill="currentColor"/></svg>';

const ust = (aktif: string) => `<a class="atla" href="#icerik">İçeriğe geç</a>
<header class="ust">
  <a class="logo" href="index.html" aria-label="Mavi Nota Caz Kulübü ana sayfa">${NOTA}<span>Mavi Nota<small>caz kulübü</small></span></a>
  <nav class="menu" data-menu aria-label="Ana menü">
${[["index.html", "Kulüp"], ["program.html", "Program"], ["menu.html", "Bar ve menü"], ["rezervasyon.html", "Rezervasyon"]].map(([h, a]) => `    <a href="${h}"${h === aktif ? ' aria-current="page"' : ""}>${a}</a>`).join("\n")}
  </nav>
  <a class="dugme kucuk" href="rezervasyon.html">Masa ayırt</a>
  <button class="menu-dugme" type="button" data-menu-ac aria-expanded="false" aria-label="Menüyü aç"><span></span><span></span></button>
</header>`;

const alt = `<footer class="alt">
  <div class="alt-ic">
    <div class="alt-marka"><a class="logo" href="index.html">${NOTA}<span>Mavi Nota<small>caz kulübü</small></span></a><p>2011'den beri Asmalımescit'te, haftanın altı gecesi canlı caz.</p></div>
    <div><h4>Adres</h4><p>Asmalımescit Mah. Sofyalı Sok. No: 14<br />Beyoğlu / İstanbul</p><p>Şişhane metrosuna 4 dakika</p></div>
    <div><h4>Saatler</h4><p>Salı ile pazar 19.00 ile 02.00</p><p>Pazartesi kapalı</p><p>Kapılar konserden bir saat önce açılır</p></div>
    <div><h4>İletişim</h4><p><a href="tel:+902122934170">0212 293 41 70</a></p><p><a href="mailto:masa@mavinota.com.tr">masa@mavinota.com.tr</a></p><p><a href="kvkk.html">Kişisel verilerin korunması</a></p></div>
  </div>
  <p class="alt-not">Mavi Nota Müzik ve Eğlence Ltd. Şti. · 18 yaş sınırı vardır · Sahnede fotoğraf çekilebilir, flaş kullanılmaz.</p>
</footer>`;

const sayfa = (dosya: string, baslik: string, aciklama: string, govde: string) => `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${baslik}</title>
  <meta name="description" content="${aciklama}" />
  <meta name="theme-color" content="#0e1420" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;1,6..96,400;1,6..96,500&family=Space+Grotesk:wght@400;500;600;700&display=swap" />
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body data-sayfa="${dosya.replace(".html", "")}">
${ust(dosya)}
<main id="icerik">
${govde}
</main>
${alt}
<script src="app.js"></script>
</body>
</html>
`;

const STIL = String.raw`/* Mavi Nota Caz Kulübü — gece mavisi zemin, pirinç vurgu, krem metin; Bodoni Moda ve Space Grotesk. */
:root {
  --gece: #0e1420; --gece-2: #131b2a; --yuzey: #172133; --cizgi: rgba(239, 230, 210, .12); --cizgi-2: rgba(239, 230, 210, .22);
  --krem: #efe6d2; --soluk: #a9a18f; --pirinc: #c9a35b; --pirinc-acik: #e2c487; --kor: #d9673e;
  --baslik: "Bodoni Moda", "Didot", Georgia, serif; --govde: "Space Grotesk", system-ui, sans-serif;
  color-scheme: dark;
}
[hidden] { display: none !important; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--gece); color: var(--krem); font: 16px/1.6 var(--govde); -webkit-font-smoothing: antialiased; }
img, svg { display: block; max-width: 100%; }
a { color: inherit; }
h1, h2, h3 { font-family: var(--baslik); font-weight: 500; letter-spacing: -.01em; line-height: 1.04; margin: 0; }
em { font-style: italic; color: var(--pirinc-acik); }
:focus-visible { outline: 2px solid var(--pirinc); outline-offset: 3px; }
.atla { position: absolute; left: -999px; top: 8px; background: var(--pirinc); color: var(--gece); padding: 8px 14px; z-index: 50; }
.atla:focus { left: 12px; }

.ust { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: 24px; padding: 14px clamp(16px, 4.5vw, 64px); background: color-mix(in srgb, var(--gece) 86%, transparent); backdrop-filter: blur(14px); border-bottom: 1px solid var(--cizgi); }
.logo { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: var(--krem); }
.logo svg { width: 26px; height: 26px; color: var(--pirinc); }
.logo span { font: italic 500 25px/1 var(--baslik); letter-spacing: -.01em; }
.logo small { display: block; font: 500 11px/1 var(--govde); letter-spacing: .04em; color: var(--soluk); margin-top: 4px; font-style: normal; }
.menu { display: flex; gap: 4px; margin-left: auto; }
.menu a { text-decoration: none; padding: 10px 14px; font-size: 14.5px; font-weight: 500; color: var(--soluk); border-radius: 99px; }
.menu a:hover { color: var(--krem); }
.menu a[aria-current] { color: var(--pirinc-acik); }
.menu-dugme { display: none; width: 46px; height: 46px; border: 1px solid var(--cizgi-2); background: transparent; border-radius: 99px; cursor: pointer; flex-direction: column; justify-content: center; align-items: center; gap: 6px; }
.menu-dugme span { width: 18px; height: 1.5px; background: var(--krem); }

.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 50px; padding: 12px 26px; border-radius: 99px; border: 1px solid var(--pirinc); background: var(--pirinc); color: #17110a; font: 600 15px/1 var(--govde); text-decoration: none; cursor: pointer; transition: background .2s, color .2s, border-color .2s; }
.dugme:hover { background: var(--pirinc-acik); border-color: var(--pirinc-acik); }
.dugme.ikincil { background: transparent; color: var(--krem); border-color: var(--cizgi-2); }
.dugme.ikincil:hover { border-color: var(--pirinc); color: var(--pirinc-acik); }
.dugme.kucuk { min-height: 42px; padding: 10px 20px; font-size: 14px; }
.dugme[disabled] { opacity: .5; cursor: not-allowed; }

.kap { max-width: 1280px; margin: 0 auto; padding: 0 clamp(16px, 4.5vw, 56px); }
.ust-yazi { display: flex; align-items: flex-start; gap: 12px; color: var(--pirinc); font-size: 14px; font-weight: 500; margin: 0 0 18px; }
.ust-yazi::before { content: ""; flex: none; width: 32px; height: 1px; background: var(--pirinc); margin-top: .8em; }

/* Ana sayfa */
.kahraman { display: grid; grid-template-columns: 1.05fr .95fr; gap: clamp(28px, 5vw, 80px); align-items: center; padding-block: clamp(32px, 5vw, 72px) clamp(48px, 6vw, 96px); }
.kahraman > * { min-width: 0; }
.kahraman h1 { font-size: clamp(52px, 7.4vw, 112px); line-height: .95; letter-spacing: -.02em; }
.kahraman .giris { color: var(--soluk); font-size: 18px; max-width: 520px; margin: 26px 0 30px; }
.eylemler { display: flex; flex-wrap: wrap; gap: 12px; }
.cerceve { position: relative; padding: 14px; border: 1px solid var(--cizgi-2); }
.cerceve img { width: 100%; aspect-ratio: 4 / 4.6; object-fit: cover; object-position: 40% 50%; }
.cerceve figcaption { position: absolute; right: -1px; bottom: 34px; background: var(--gece); border: 1px solid var(--cizgi-2); border-right: 0; padding: 12px 18px; font-size: 13.5px; color: var(--soluk); }
.cerceve figcaption b { display: block; color: var(--krem); font: italic 500 19px/1.2 var(--baslik); }

.bu-gece { margin-top: 38px; display: grid; grid-template-columns: auto 1fr auto; gap: 18px; align-items: center; padding: 18px 20px; border: 1px solid var(--cizgi-2); background: var(--gece-2); text-decoration: none; transition: border-color .2s; }
.bu-gece:hover { border-color: var(--pirinc); }
.bu-gece .nabiz { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--kor); white-space: nowrap; }
.bu-gece .nabiz i { width: 8px; height: 8px; border-radius: 50%; background: var(--kor); animation: nabiz 1.8s infinite; }
.bu-gece .nabiz.sakin { color: var(--pirinc); } .bu-gece .nabiz.sakin i { background: var(--pirinc); animation: none; }
@keyframes nabiz { 0% { box-shadow: 0 0 0 0 rgba(217, 103, 62, .6); } 70% { box-shadow: 0 0 0 10px rgba(217, 103, 62, 0); } 100% { box-shadow: 0 0 0 0 rgba(217, 103, 62, 0); } }
.bu-gece b { display: block; font: 500 22px/1.15 var(--baslik); }
.bu-gece small { color: var(--soluk); font-size: 14px; }
.bu-gece .ok { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--cizgi-2); display: grid; place-items: center; }
.bu-gece .ok svg { width: 18px; }

.bolum { padding-block: clamp(56px, 8vw, 112px); border-top: 1px solid var(--cizgi); }
.bolum-ust { display: flex; justify-content: space-between; align-items: end; gap: 20px; flex-wrap: wrap; margin-bottom: 36px; }
.bolum-ust h2 { font-size: clamp(36px, 5vw, 64px); }
.bolum-ust p { color: var(--soluk); max-width: 520px; margin: 12px 0 0; }

.kartlar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px 22px; }
.kart { text-decoration: none; display: grid; gap: 14px; }
.kart .gorsel { position: relative; overflow: hidden; aspect-ratio: 4 / 3.2; background: var(--yuzey); }
.kart img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s; filter: saturate(.9); }
.kart:hover img { transform: scale(1.04); }
.kart .tarih { position: absolute; left: 0; top: 0; background: var(--gece); padding: 10px 14px 8px; text-align: center; min-width: 70px; }
.kart .tarih b { display: block; font: 500 30px/1 var(--baslik); }
.kart .tarih span { font-size: 12px; color: var(--soluk); }
.kart h3 { font-size: 26px; }
.kart .meta { display: flex; flex-wrap: wrap; gap: 6px 14px; color: var(--soluk); font-size: 14px; }
.kart .meta .tur { color: var(--pirinc); }
.durum { font-size: 13px; font-weight: 600; color: var(--pirinc-acik); }
.durum.az { color: var(--kor); }
.durum.dolu { color: var(--soluk); text-decoration: line-through; }

.hikaye { display: grid; grid-template-columns: .9fr 1.1fr; gap: clamp(28px, 6vw, 96px); align-items: center; }
.hikaye > * { min-width: 0; }
.hikaye img { width: 100%; aspect-ratio: 5 / 4; object-fit: cover; }
.hikaye h2 { font-size: clamp(34px, 4.4vw, 56px); margin-bottom: 18px; }
.hikaye p { color: var(--soluk); margin: 0 0 14px; max-width: 560px; }
.sayilar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; margin-top: 30px; border-top: 1px solid var(--cizgi); }
.sayilar div { padding: 18px 16px 0 0; }
.sayilar b { display: block; font: 500 44px/1 var(--baslik); color: var(--pirinc-acik); }
.sayilar span { font-size: 14px; color: var(--soluk); }

.bar-ozet { display: grid; grid-template-columns: 1fr 1fr; gap: 0 56px; }
.icki { display: grid; grid-template-columns: 1fr auto; gap: 2px 18px; padding: 18px 0; border-bottom: 1px solid var(--cizgi); }
.icki b { font: 500 22px/1.2 var(--baslik); }
.icki span { grid-column: 1; color: var(--soluk); font-size: 14px; }
.icki em { grid-row: 1 / span 2; grid-column: 2; align-self: center; font-style: normal; color: var(--pirinc-acik); font-weight: 600; white-space: nowrap; }

.ziyaret { display: grid; grid-template-columns: 1fr 1.3fr; gap: 28px; align-items: stretch; }
.ziyaret > * { min-width: 0; }
.ziyaret .kutu { border: 1px solid var(--cizgi-2); padding: clamp(22px, 3vw, 36px); }
.ziyaret h2 { font-size: clamp(32px, 4vw, 48px); margin-bottom: 14px; }
.ziyaret p { color: var(--soluk); margin: 0 0 8px; }
.saatler { width: 100%; border-collapse: collapse; margin: 18px 0 24px; font-size: 15px; }
.saatler td { padding: 10px 0; border-bottom: 1px solid var(--cizgi); }
.saatler td:last-child { text-align: right; }
.saatler tr.bugun td { color: var(--pirinc-acik); font-weight: 600; }
.harita { border: 1px solid var(--cizgi-2); background: var(--gece-2); min-height: 360px; padding: 10px; }
.harita iframe { display: block; width: 100%; height: 100%; min-height: 340px; border: 0; filter: invert(.9) hue-rotate(185deg) saturate(.55) brightness(.92) contrast(.95); }

.bulten { background: var(--pirinc); color: #17110a; }
.bulten .kap { display: grid; grid-template-columns: 1.1fr 1fr; gap: 32px; align-items: center; padding-block: clamp(40px, 6vw, 72px); }
.bulten h2 { font-size: clamp(32px, 4.2vw, 52px); }
.bulten p { margin: 10px 0 0; color: #3b2c14; }
.bulten form { display: flex; gap: 10px; flex-wrap: wrap; }
.bulten input { flex: 1 1 220px; min-height: 52px; padding: 12px 18px; border-radius: 99px; border: 1px solid rgba(23, 17, 10, .3); background: #f3e6c8; font: 500 16px var(--govde); color: #17110a; }
.bulten .dugme { background: #17110a; color: var(--krem); border-color: #17110a; }

/* Program */
.sayfa-bas { padding-block: clamp(36px, 6vw, 80px) 26px; }
.sayfa-bas h1 { font-size: clamp(56px, 9vw, 128px); line-height: .9; }
.sayfa-bas p { color: var(--soluk); max-width: 560px; margin: 18px 0 0; font-size: 17px; }
.suzgec { display: flex; flex-wrap: wrap; gap: 10px 26px; align-items: center; padding: 18px 0; border-top: 1px solid var(--cizgi); border-bottom: 1px solid var(--cizgi); position: sticky; top: 73px; background: color-mix(in srgb, var(--gece) 94%, transparent); backdrop-filter: blur(10px); z-index: 10; }
.cipler { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; max-width: 100%; }
.cipler::-webkit-scrollbar { display: none; }
.cip { flex: none; min-height: 40px; padding: 8px 16px; border-radius: 99px; border: 1px solid var(--cizgi-2); background: transparent; color: var(--soluk); font: 500 14px var(--govde); cursor: pointer; }
.cip:hover { color: var(--krem); }
.cip[aria-pressed="true"] { background: var(--krem); color: var(--gece); border-color: var(--krem); }
.suzgec select { min-height: 42px; padding: 8px 36px 8px 16px; border-radius: 99px; border: 1px solid var(--cizgi-2); background: var(--gece) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c9a35b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") right 12px center / 16px no-repeat; color: var(--krem); font: 500 14px var(--govde); appearance: none; }
.sayac { margin-left: auto; color: var(--soluk); font-size: 14px; }
.liste { display: grid; }
.satir { display: grid; grid-template-columns: 96px 168px 1fr 210px; gap: 26px; align-items: center; padding: 26px 0; border-bottom: 1px solid var(--cizgi); text-decoration: none; }
.satir:hover h3 { color: var(--pirinc-acik); }
.satir .gun b { display: block; font: 500 54px/.9 var(--baslik); }
.satir .gun span { display: block; font-size: 13.5px; color: var(--soluk); margin-top: 6px; }
.satir img { width: 168px; aspect-ratio: 4 / 3; object-fit: cover; }
.satir h3 { font-size: 30px; transition: color .2s; }
.satir .alt-b { color: var(--soluk); margin: 6px 0 0; font-size: 15px; }
.satir .meta { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 10px; font-size: 14px; color: var(--soluk); }
.satir .meta .tur { color: var(--pirinc); }
.satir .sag { display: grid; gap: 10px; justify-items: end; text-align: right; }
.satir .fiyat { font: 500 24px/1 var(--baslik); white-space: nowrap; }
.satir .fiyat small { font: 400 13px var(--govde); color: var(--soluk); }
.ay-baslik { font: italic 500 30px/1 var(--baslik); color: var(--pirinc); padding: 44px 0 6px; }
.bos { padding: 48px 0; color: var(--soluk); }
.bos b { display: block; color: var(--krem); font: 500 26px var(--baslik); margin-bottom: 6px; }

/* Konser */
.konser { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(28px, 5vw, 72px); padding-block: clamp(32px, 5vw, 64px); align-items: start; }
.konser > * { min-width: 0; }
.konser .cerceve img { aspect-ratio: 1; }
.geri { display: flex; width: fit-content; gap: 8px; align-items: center; color: var(--soluk); text-decoration: none; font-size: 14px; margin-bottom: 22px; min-height: 44px; }
.geri:hover { color: var(--krem); }
.konser h1 { font-size: clamp(44px, 5.6vw, 80px); line-height: .98; }
.konser .alt-baslik { font: italic 400 24px/1.3 var(--baslik); color: var(--soluk); margin: 14px 0 26px; }
.bilgi-izgara { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--cizgi); border-bottom: 1px solid var(--cizgi); margin-bottom: 26px; }
.bilgi-izgara div { padding: 16px 14px 16px 0; }
.bilgi-izgara div + div { padding-left: 16px; border-left: 1px solid var(--cizgi); }
.bilgi-izgara dt { font-size: 13px; color: var(--soluk); }
.bilgi-izgara dd { margin: 4px 0 0; font: 500 21px/1.2 var(--baslik); }
.konser p { color: var(--soluk); }
.kadro { border-left: 2px solid var(--pirinc); padding: 4px 0 4px 16px; margin: 22px 0 28px; }
.kadro small { display: block; color: var(--pirinc); font-size: 13px; font-weight: 600; margin-bottom: 4px; }
.yer-cubugu { height: 4px; background: var(--cizgi); margin: 10px 0 6px; overflow: hidden; }
.yer-cubugu i { display: block; height: 100%; background: var(--pirinc); }

/* Rezervasyon */
.rez { display: grid; grid-template-columns: 1.4fr .9fr; gap: clamp(24px, 4vw, 56px); padding-block: clamp(32px, 5vw, 64px); align-items: start; }
.rez > * { min-width: 0; }
.rez h1 { font-size: clamp(44px, 6vw, 84px); line-height: .95; margin-bottom: 14px; }
.rez .giris { color: var(--soluk); margin: 0 0 30px; }
.adim { border: 0; border-top: 1px solid var(--cizgi); padding: 26px 0 30px; margin: 0; min-width: 0; }
.adim legend { float: left; width: 100%; padding: 0; margin-bottom: 18px; font: 500 26px/1.1 var(--baslik); display: flex; gap: 14px; align-items: baseline; }
.adim legend span { font: 500 14px var(--govde); color: var(--pirinc); }
.adim legend + * { clear: both; }
.alan { display: grid; gap: 8px; font-size: 14px; font-weight: 500; color: var(--soluk); }
.alan input, .alan select, .alan textarea { width: 100%; min-height: 52px; padding: 12px 16px; border: 1px solid var(--cizgi-2); background: var(--gece-2); color: var(--krem); font: 500 16px var(--govde); border-radius: 0; }
.alan select { appearance: none; background: var(--gece-2) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c9a35b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") right 14px center / 18px no-repeat; padding-right: 44px; }
.alan input:focus, .alan select:focus, .alan textarea:focus { outline: none; border-color: var(--pirinc); }
.ikili { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.secili-konser { display: grid; grid-template-columns: 96px 1fr; gap: 16px; align-items: center; margin-top: 16px; padding: 12px; border: 1px solid var(--cizgi); }
.secili-konser img { width: 96px; aspect-ratio: 1; object-fit: cover; }
.secili-konser b { display: block; font: 500 21px/1.2 var(--baslik); }
.secili-konser span { color: var(--soluk); font-size: 14px; }
.sayici { display: inline-flex; align-items: center; border: 1px solid var(--cizgi-2); }
.sayici button { width: 52px; height: 52px; border: 0; background: transparent; color: var(--krem); font-size: 22px; cursor: pointer; }
.sayici button:disabled { opacity: .3; cursor: not-allowed; }
.sayici output { min-width: 64px; text-align: center; font: 500 26px var(--baslik); }
.kisi-satir { display: flex; flex-wrap: wrap; gap: 14px 22px; align-items: center; }
.kisi-satir p { margin: 0; color: var(--soluk); font-size: 14px; }
.oturma { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px; }
.oturma label { position: relative; display: grid; gap: 4px; padding: 14px 16px; border: 1px solid var(--cizgi-2); cursor: pointer; font-size: 13.5px; color: var(--soluk); min-height: 44px; }
.oturma label b { color: var(--krem); font-size: 15px; font-weight: 600; }
.oturma input { position: absolute; opacity: 0; pointer-events: none; }
.oturma label:has(input:checked) { border-color: var(--pirinc); background: rgba(201, 163, 91, .08); }
.oturma label:has(input:focus-visible) { outline: 2px solid var(--pirinc); outline-offset: 2px; }
.onay { display: flex; gap: 12px; align-items: flex-start; font-size: 14px; color: var(--soluk); margin-top: 18px; }
.onay input { appearance: none; width: 22px; height: 22px; margin: 0; flex: none; border: 1px solid var(--cizgi-2); background: var(--gece-2); cursor: pointer; display: grid; place-items: center; }
.onay input:checked { background: var(--pirinc) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2317110a' stroke-width='3'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7.5'/%3E%3C/svg%3E") center / 15px no-repeat; border-color: var(--pirinc); }
.onay input:focus-visible { outline: 2px solid var(--pirinc); outline-offset: 2px; }
.ozet { position: sticky; top: 100px; border: 1px solid var(--cizgi-2); background: var(--gece-2); padding: 28px; }
.ozet h2 { font-size: 30px; margin-bottom: 18px; }
.ozet dl { margin: 0 0 18px; display: grid; gap: 14px; }
.ozet dt { font-size: 13px; color: var(--soluk); }
.ozet dd { margin: 2px 0 0; font-weight: 600; }
.ozet .toplam { display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid var(--cizgi); padding-top: 16px; margin-bottom: 20px; }
.ozet .toplam b { font: 500 34px var(--baslik); color: var(--pirinc-acik); }
.ozet .dugme { width: 100%; }
.ozet p { font-size: 13px; color: var(--soluk); margin: 14px 0 0; }
.mesaj { padding: 14px 16px; font-size: 14.5px; margin-top: 16px; border-left: 3px solid; }
.mesaj b { display: block; }
.mesaj.hata { border-color: var(--kor); background: rgba(217, 103, 62, .1); }
.mesaj.bilgi { border-color: var(--pirinc); background: rgba(201, 163, 91, .1); }
.basari { max-width: 680px; margin: clamp(40px, 7vw, 96px) auto; text-align: center; border: 1px solid var(--cizgi-2); padding: clamp(28px, 5vw, 56px); }
.basari .kod { display: inline-block; font: 500 clamp(34px, 6vw, 52px)/1 var(--baslik); color: var(--pirinc-acik); letter-spacing: .04em; border: 1px dashed var(--pirinc); padding: 14px 24px; margin: 18px 0; }
.basari h1 { font-size: clamp(36px, 5vw, 56px); }
.basari p { color: var(--soluk); }
.basari dl { display: grid; grid-template-columns: auto 1fr; gap: 10px 20px; text-align: left; border-top: 1px solid var(--cizgi); border-bottom: 1px solid var(--cizgi); padding: 18px 0; margin: 22px 0; }
.basari dt { color: var(--soluk); }
.basari dd { margin: 0; font-weight: 600; }

/* Menü sayfası */
.menu-izgara { display: grid; grid-template-columns: 1fr 1fr; gap: 0 64px; }
.menu-grup h2 { font-size: 34px; padding: 34px 0 6px; color: var(--pirinc-acik); font-style: italic; }
.galeri3 { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 14px; }
.galeri3 img { width: 100%; height: 100%; aspect-ratio: 4 / 5; object-fit: cover; }
.galeri3 img:first-child { aspect-ratio: auto; }
.kurallar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border-top: 1px solid var(--cizgi); }
.kurallar div { padding: 22px 22px 0 0; }
.kurallar b { display: block; font: 500 22px/1.2 var(--baslik); margin-bottom: 8px; }
.kurallar p { margin: 0; color: var(--soluk); font-size: 14.5px; }
.ozel { display: grid; grid-template-columns: 1fr 1.2fr; gap: clamp(24px, 5vw, 72px); }
.ozel > * { min-width: 0; }
.ozel h2 { font-size: clamp(34px, 4.4vw, 56px); margin-bottom: 14px; }
.ozel p { color: var(--soluk); }
.form { display: grid; gap: 14px; }
.metin { max-width: 820px; padding-block: clamp(36px, 5vw, 72px); }
.metin h1 { font-size: clamp(40px, 5vw, 64px); margin-bottom: 18px; }
.metin h2 { font-size: 26px; margin: 34px 0 10px; }
.metin p, .metin li { color: var(--soluk); }

.alt { border-top: 1px solid var(--cizgi); padding: 64px clamp(16px, 4.5vw, 64px) 28px; color: var(--soluk); font-size: 14.5px; }
.alt-ic { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 32px; }
.alt h4 { color: var(--krem); font: 600 14px var(--govde); margin: 0 0 10px; }
.alt p { margin: 4px 0; }
.alt a { color: var(--krem); }
.alt-marka p { max-width: 300px; margin-top: 14px; }
.alt-not { max-width: 1280px; margin: 40px auto 0; padding-top: 20px; border-top: 1px solid var(--cizgi); font-size: 13px; }
.bildirim { position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 180%); background: var(--krem); color: var(--gece); padding: 13px 22px; border-radius: 99px; font-weight: 600; font-size: 14.5px; z-index: 60; transition: transform .35s; max-width: calc(100vw - 32px); }
.bildirim.acik { transform: translate(-50%, 0); }

@media (max-width: 1080px) {
  .kartlar { grid-template-columns: repeat(2, 1fr); }
  .satir { grid-template-columns: 80px 140px 1fr; }
  .satir img { width: 140px; }
  .satir .sag { grid-column: 3; justify-items: start; text-align: left; grid-auto-flow: column; align-items: center; justify-content: start; gap: 16px; }
  .alt-ic { grid-template-columns: 1fr 1fr; }
  .kurallar { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 880px) {
  .menu { display: none; position: absolute; left: 12px; right: 12px; top: calc(100% + 8px); flex-direction: column; background: var(--gece-2); border: 1px solid var(--cizgi-2); padding: 8px; }
  .menu.acik { display: flex; }
  .menu a { padding: 14px 16px; font-size: 17px; }
  .menu-dugme { display: inline-flex; }
  .ust .dugme.kucuk { margin-left: auto; }
  .kahraman, .hikaye, .ziyaret, .bulten .kap, .konser, .rez, .ozel { grid-template-columns: 1fr; }
  .kahraman .cerceve { order: -1; }
  .cerceve img { aspect-ratio: 4 / 3.4; }
  .bar-ozet, .menu-izgara { grid-template-columns: 1fr; }
  .ozet { position: static; }
  .suzgec { position: static; }
  .galeri3 { grid-template-columns: 1fr 1fr; }
  .galeri3 img:first-child { grid-column: 1 / -1; aspect-ratio: 16 / 10; }
}
@media (max-width: 600px) {
  .ust { gap: 12px; }
  .logo small { display: none; }
  .logo span { font-size: 22px; }
  .kartlar { grid-template-columns: 1fr; gap: 0; }
  .kart { grid-template-columns: 116px 1fr; gap: 4px 16px; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--cizgi); }
  .kart .gorsel { grid-row: span 2; aspect-ratio: 1; }
  .kart .tarih { padding: 6px 8px 5px; min-width: 50px; }
  .kart .tarih b { font-size: 22px; }
  .kart .tarih span { font-size: 10.5px; }
  .kart h3 { font-size: 22px; }
  .kart .durum { grid-column: 2; align-self: start; }
  .kart > div:nth-child(2) { align-self: end; }
  .satir { grid-template-columns: 64px 1fr; gap: 14px 16px; padding: 22px 0; }
  .satir img { grid-column: 1 / -1; grid-row: 1; width: 100%; aspect-ratio: 16 / 9; }
  .satir .gun b { font-size: 42px; }
  .satir h3 { font-size: 25px; }
  .satir .sag { grid-column: 1 / -1; }
  .bu-gece { grid-template-columns: 1fr auto; }
  .bu-gece .nabiz { grid-column: 1 / -1; }
  .sayilar b { font-size: 34px; }
  .ikili, .oturma { grid-template-columns: 1fr; }
  .bilgi-izgara { grid-template-columns: 1fr 1fr; }
  .bilgi-izgara div:nth-child(3) { grid-column: 1 / -1; border-left: 0; padding-left: 0; border-top: 1px solid var(--cizgi); }
  .alt-ic, .kurallar { grid-template-columns: 1fr; }
  .cerceve { padding: 8px; }
  .cerceve figcaption { bottom: 18px; }
  .sayac { margin-left: 0; width: 100%; }
}
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }
`;

const DOLULUK = String.raw`/* Sunucu fonksiyonu: konser başına ayrılmış kişi sayısı (GET /api/doluluk). Kişisel veri dönmez, yalnız sayılar.
 * "rezervasyonlar" tablosu ziyaretçiye kapalıdır; bu fonksiyon sahip yetkisiyle sayar. */
export default async function (istek, vayra) {
  var l = await vayra.veri.liste("rezervasyonlar", { sinir: 1000 });
  var dolu = {};
  l.forEach(function (r) { if (r.durum === "İptal") return; dolu[r.konser] = (dolu[r.konser] || 0) + (Number(r.kisi) || 0); });
  return { durum: 200, basliklar: { "Cache-Control": "no-store" }, govde: { dolu: dolu } };
}
`;

const REZERVASYON = String.raw`/* Sunucu fonksiyonu: masa rezervasyonu (POST /api/rezervasyon, gövde JSON). Konserin kapasitesini denetler, yer
 * kalmadıysa 409 döner; uygunsa "rezervasyonlar" tablosuna kod üreterek ekler. Ziyaretçi tabloya doğrudan yazamaz. */
export default async function (istek, vayra) {
  if (istek.yontem !== "POST") return { durum: 405, govde: { hata: "Yalnız POST." } };
  var g = istek.govde;
  if (!g || typeof g !== "object") { try { g = JSON.parse(istek.metin || "{}"); } catch (e) { g = {}; } }
  var kisi = Math.floor(Number(g.kisi));
  var ad = String(g.ad || "").trim().slice(0, 80), tel = String(g.telefon || "").trim().slice(0, 20);
  if (!g.konser || !(kisi >= 1 && kisi <= 8)) return { durum: 400, govde: { hata: "Konser ve 1 ile 8 arası kişi sayısı gerekli." } };
  if (ad.length < 3 || !/^[0-9 +()]{10,17}$/.test(tel)) return { durum: 400, govde: { hata: "Ad soyad ve geçerli bir telefon numarası gerekli." } };
  if (g.kvkk !== true) return { durum: 400, govde: { hata: "Aydınlatma metni onayı gerekli." } };
  var konserler = await vayra.veri.liste("konserler", { sinir: 500 });
  var k = konserler.find(function (x) { return x.id === g.konser; });
  var bugun = new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);
  if (!k || k.aktif === false) return { durum: 404, govde: { hata: "Konser bulunamadı." } };
  if (String(k.tarih) < bugun) return { durum: 400, govde: { hata: "Bu konserin tarihi geçti." } };
  var l = await vayra.veri.liste("rezervasyonlar", { konser: k.id, sinir: 1000 });
  var dolu = 0;
  l.forEach(function (r) { if (r.durum !== "İptal") dolu += Number(r.kisi) || 0; });
  var kalan = Math.max(0, (Number(k.kapasite) || 0) - dolu);
  if (kisi > kalan) return { durum: 409, govde: { hata: kalan ? "Bu konser için yalnız " + kalan + " kişilik yer kaldı." : "Bu konserin bütün masaları doldu.", kalan: kalan } };
  var harf = "ABCDEFGHJKLMNPRSTUVYZ23456789", kod = "MN-";
  for (var i = 0; i < 5; i++) kod += harf.charAt(Math.floor(Math.random() * harf.length));
  var oturma = ["Sahne önü", "Salon", "Bar"].indexOf(g.oturma) >= 0 ? g.oturma : "Salon";
  await vayra.veri.ekle("rezervasyonlar", { kod: kod, konser: k.id, konserAdi: k.baslik, tarih: k.tarih, kisi: kisi, oturma: oturma, ad: ad, telefon: tel, eposta: g.eposta ? String(g.eposta).slice(0, 120) : null, not: g.not ? String(g.not).slice(0, 600) : null, kvkk: true, durum: "Onaylandı" });
  return { durum: 201, basliklar: { "Cache-Control": "no-store" }, govde: { ok: true, kod: kod, kalan: kalan - kisi } };
}
`;

const YEDEK = KONSERLER.map((k, i) => ({ ...k, sira: i }));

const UYGULAMA = ORTAK_JS + String.raw`
/* ── Mavi Nota Caz Kulübü ──
 * Program "konserler" tablosundan okunur (galerideki canlı önizlemede gömülü yedek programla). Rezervasyon
 * api/rezervasyon.js fonksiyonuna gider; fonksiyon kapasiteyi denetler. Kalan yerler api/doluluk.js'ten gelir. */
var YEDEK = ${JSON.stringify(YEDEK)};
var AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
var GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
var SAYFA = document.body.dataset.sayfa;
var OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/** Yedek programın tarihleri bugünden başlar; pazartesi kulüp kapalı. */
function yedekProgram() {
  var t = istanbul().tarih, l = [];
  YEDEK.forEach(function (k) { while (haftaGunu(t) === 1) t = gunEkle(t, 1); l.push(Object.assign({}, k, { tarih: t })); t = gunEkle(t, 1); });
  return l;
}
var konserSoz = null;
function konserler() {
  if (!konserSoz) konserSoz = (veriVar() ? vayra.veri.liste("konserler", { sirala: "tarih", yon: "artan", sinir: 300 }).catch(function () { return yedekProgram(); }) : Promise.resolve(yedekProgram()))
    .then(function (l) {
      var bugun = istanbul().tarih;
      return l.filter(function (k) { return k.aktif !== false && k.tarih >= bugun; }).sort(function (a, b) { return (a.tarih + a.saat).localeCompare(b.tarih + b.saat); });
    });
  return konserSoz;
}
var dolulukSoz = null;
function doluluk(tazele) {
  if (!dolulukSoz || tazele) dolulukSoz = fonksiyonVar() ? fonksiyonOku("doluluk").then(function (j) { return (j && j.dolu) || {}; }).catch(function () { return null; }) : Promise.resolve(null);
  return dolulukSoz;
}
function kalan(k, d) { return d ? Math.max(0, (Number(k.kapasite) || 0) - (d[k.id] || 0)) : null; }
function durumYaz(k, d) {
  var n = kalan(k, d);
  if (n === null) return '<span class="durum">Masa ayırtılabilir</span>';
  if (n === 0) return '<span class="durum dolu">Masalar doldu</span>';
  if (n <= 12) return '<span class="durum az">Son ' + n + " kişilik yer</span>";
  return '<span class="durum">' + n + " kişilik yer var</span>";
}
function gunAdi(t) { return GUNLER[haftaGunu(t)]; }
function ayAdi(t) { return AYLAR[Number(t.slice(5, 7)) - 1]; }
function saatYaz(s) { return String(s || "").replace(":", "."); }
function uzunTarih(t) { return Number(t.slice(8)) + " " + ayAdi(t) + " " + gunAdi(t); }
function gorsel(k) { return kacir(k.gorsel || "/gercek/muzik/ms-brass.webp"); }

function kartHtml(k, d) {
  return '<a class="kart" href="konser.html?id=' + encodeURIComponent(k.id) + '"><div class="gorsel"><img src="' + gorsel(k) + '" alt="' + kacir(k.baslik) + '" loading="lazy" /><div class="tarih"><b>' + Number(k.tarih.slice(8)) + "</b><span>" + ayAdi(k.tarih).slice(0, 3) + " " + gunAdi(k.tarih).slice(0, 3) + "</span></div></div>"
    + "<div><h3>" + kacir(k.baslik) + '</h3><div class="meta"><span class="tur">' + kacir(k.tur) + "</span><span>" + saatYaz(k.saat) + "</span><span>" + tl(k.kapi) + "</span></div></div>" + durumYaz(k, d) + "</a>";
}
function satirHtml(k, d) {
  var n = kalan(k, d);
  return '<a class="satir" href="konser.html?id=' + encodeURIComponent(k.id) + '"><div class="gun"><b>' + Number(k.tarih.slice(8)) + "</b><span>" + kacir(gunAdi(k.tarih)) + "</span></div>"
    + '<img src="' + gorsel(k) + '" alt="" loading="lazy" /><div><h3>' + kacir(k.baslik) + "</h3>" + (k.altBaslik ? '<p class="alt-b">' + kacir(k.altBaslik) + "</p>" : "")
    + '<div class="meta"><span class="tur">' + kacir(k.tur) + "</span><span>Sahne " + saatYaz(k.saat) + "</span><span>Kapı " + saatYaz(dakikaSaat(saatDakika(k.saat) - 60)) + "</span></div></div>"
    + '<div class="sag"><span class="fiyat">' + tl(k.kapi) + " <small>kişi başı</small></span>" + durumYaz(k, d) + (n === 0 ? "" : '<span class="dugme kucuk ikincil">Masa ayırt</span>') + "</div></a>";
}

/* Çalışma saatleri tablosunda bugün */
$$(".saatler tr").forEach(function (tr) { if (Number(tr.dataset.gun) === istanbul().gun) tr.classList.add("bugun"); });

if (SAYFA === "index") {
  Promise.all([konserler(), doluluk()]).then(function (s) {
    var l = s[0], d = s[1], bugun = istanbul().tarih, yer = $("#buGece");
    var k = l[0];
    if (k) {
      var bu = k.tarih === bugun;
      yer.innerHTML = '<span class="nabiz' + (bu ? "" : " sakin") + '"><i></i>' + (bu ? "Bu gece sahnede" : "Sıradaki konser") + "</span><span><b>" + kacir(k.baslik) + "</b><small>" + (bu ? "Bu akşam" : kacir(uzunTarih(k.tarih))) + ", sahne " + saatYaz(k.saat) + " · " + tl(k.kapi) + "</small></span><span class=\"ok\">" + OK + "</span>";
      yer.href = "konser.html?id=" + encodeURIComponent(k.id);
      yer.hidden = false;
    }
    $("#yakinda").innerHTML = l.slice(0, 6).map(function (x) { return kartHtml(x, d); }).join("") || '<p class="bos"><b>Yeni program hazırlanıyor.</b>Bültene katıl, açıklandığında ilk sen duy.</p>';
  });
}

if (SAYFA === "program") {
  var secAy = "hepsi", secTur = "hepsi", liste = [], dol = null;
  function ciz() {
    var l = liste.filter(function (k) { return (secAy === "hepsi" || k.tarih.slice(0, 7) === secAy) && (secTur === "hepsi" || k.tur === secTur); });
    $("#sayac").textContent = l.length + " konser";
    if (!l.length) { $("#program").innerHTML = '<div class="bos"><b>Bu seçime uyan konser yok.</b>Başka bir ay ya da tür dene.</div>'; return; }
    var h = "", sonAy = "";
    l.forEach(function (k) { var ay = k.tarih.slice(0, 7); if (ay !== sonAy) { h += '<h2 class="ay-baslik">' + ayAdi(k.tarih) + " " + k.tarih.slice(0, 4) + "</h2>"; sonAy = ay; } h += satirHtml(k, dol); });
    $("#program").innerHTML = h;
  }
  Promise.all([konserler(), doluluk()]).then(function (s) {
    liste = s[0]; dol = s[1];
    var aylar = []; liste.forEach(function (k) { var a = k.tarih.slice(0, 7); if (aylar.indexOf(a) < 0) aylar.push(a); });
    $("#aylar").innerHTML = '<button class="cip" type="button" data-ay="hepsi" aria-pressed="true">Bütün program</button>' + aylar.map(function (a) { return '<button class="cip" type="button" data-ay="' + a + '" aria-pressed="false">' + AYLAR[Number(a.slice(5)) - 1] + "</button>"; }).join("");
    var turler = []; liste.forEach(function (k) { if (turler.indexOf(k.tur) < 0) turler.push(k.tur); });
    $("#tur").innerHTML = '<option value="hepsi">Bütün türler</option>' + turler.sort(function (a, b) { return a.localeCompare(b, "tr"); }).map(function (t) { return '<option value="' + kacir(t) + '">' + kacir(t) + "</option>"; }).join("");
    var q = new URLSearchParams(location.search).get("tur");
    if (q && turler.indexOf(q) >= 0) { secTur = q; $("#tur").value = q; }
    ciz();
  });
  $("#aylar").addEventListener("click", function (e) { var b = e.target.closest(".cip"); if (!b) return; secAy = b.dataset.ay; $$("#aylar .cip").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); ciz(); });
  $("#tur").addEventListener("change", function () { secTur = this.value; ciz(); });
}

if (SAYFA === "konser") {
  var id = new URLSearchParams(location.search).get("id");
  Promise.all([konserler(), doluluk()]).then(function (s) {
    var l = s[0], d = s[1], k = l.find(function (x) { return x.id === id; }) || l[0];
    if (!k) { $("#konser").innerHTML = '<div class="bos"><b>Bu konser programda değil.</b><a class="dugme" href="program.html">Programa dön</a></div>'; return; }
    document.title = k.baslik + " · Mavi Nota Caz Kulübü";
    var n = kalan(k, d), doluOran = n === null ? 0 : Math.round(100 * (1 - n / Math.max(1, k.kapasite)));
    $("#konser").innerHTML = '<figure class="cerceve" style="margin:0"><img src="' + gorsel(k) + '" alt="' + kacir(k.baslik) + '" /></figure>'
      + '<div><a class="geri" href="program.html">' + '<svg width="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>Bütün program</a>'
      + '<p class="ust-yazi">' + kacir(k.tur) + "</p><h1>" + kacir(k.baslik) + "</h1>" + (k.altBaslik ? '<p class="alt-baslik">' + kacir(k.altBaslik) + "</p>" : "")
      + '<dl class="bilgi-izgara"><div><dt>Tarih</dt><dd>' + kacir(Number(k.tarih.slice(8)) + " " + ayAdi(k.tarih)) + "<br /><small style=\"font:400 14px var(--govde);color:var(--soluk)\">" + gunAdi(k.tarih) + "</small></dd></div><div><dt>Sahne</dt><dd>" + saatYaz(k.saat) + '<br /><small style="font:400 14px var(--govde);color:var(--soluk)">kapı ' + saatYaz(dakikaSaat(saatDakika(k.saat) - 60)) + "</small></dd></div><div><dt>Kapı ücreti</dt><dd>" + tl(k.kapi) + '<br /><small style="font:400 14px var(--govde);color:var(--soluk)">kişi başı, girişte</small></dd></div></dl>'
      + "<p>" + kacir(k.aciklama) + "</p>" + (k.kadro ? '<div class="kadro"><small>Kadro</small>' + kacir(k.kadro) + "</div>" : "")
      + (n === null ? "" : '<div>' + durumYaz(k, d) + '<div class="yer-cubugu" aria-hidden="true"><i style="width:' + doluOran + '%"></i></div></div>')
      + '<div class="eylemler" style="margin-top:22px">' + (n === 0 ? '<span class="dugme ikincil" aria-disabled="true">Masalar doldu</span><a class="dugme ikincil" href="program.html">Başka bir gece seç</a>' : '<a class="dugme" href="rezervasyon.html?konser=' + encodeURIComponent(k.id) + '">Masa ayırt</a><a class="dugme ikincil" href="program.html?tur=' + encodeURIComponent(k.tur) + '">Benzer geceler</a>') + "</div></div>";
    var digerleri = l.filter(function (x) { return x.id !== k.id; }).slice(0, 3);
    $("#diger").innerHTML = digerleri.map(function (x) { return kartHtml(x, d); }).join("");
  });
}

if (SAYFA === "rezervasyon") {
  var form = $("#rez"), q = new URLSearchParams(location.search), mesaj = $("#mesaj");
  var sec = { konser: null, kisi: 2 }, liste2 = [], dol2 = null;
  function konser() { return liste2.find(function (k) { return k.id === sec.konser; }); }
  function goster(tur, baslik, metin) { mesaj.hidden = false; mesaj.className = "mesaj " + tur; mesaj.innerHTML = "<b>" + kacir(baslik) + "</b>" + kacir(metin || ""); mesaj.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  function guncelle() {
    var k = konser(), n = k ? kalan(k, dol2) : null, ust = n === null ? 8 : Math.min(8, n);
    if (sec.kisi > Math.max(1, ust)) sec.kisi = Math.max(1, ust);
    $("#kisi").textContent = sec.kisi;
    $("#eksi").disabled = sec.kisi <= 1; $("#arti").disabled = sec.kisi >= ust;
    $("#kisiNot").textContent = n === null ? "En çok 8 kişi; daha kalabalık gruplar için bizi ara." : n === 0 ? "Bu konserin masaları doldu." : "Bu gece en çok " + ust + " kişilik yer ayırtabilirsin.";
    $("#seciliKonser").innerHTML = k ? '<img src="' + gorsel(k) + '" alt="" /><div><b>' + kacir(k.baslik) + "</b><span>" + kacir(uzunTarih(k.tarih)) + ", sahne " + saatYaz(k.saat) + "</span><br />" + durumYaz(k, dol2) + "</div>" : "";
    $("#seciliKonser").hidden = !k;
    $("#ozKonser").textContent = k ? k.baslik : "Seçilmedi";
    $("#ozTarih").textContent = k ? uzunTarih(k.tarih) + ", " + saatYaz(k.saat) : "Seçilmedi";
    $("#ozKisi").textContent = sec.kisi + " kişi, " + (($("input[name=oturma]:checked") || {}).value || "Salon");
    $("#ozToplam").textContent = k ? tl(k.kapi * sec.kisi) : "0 TL";
    $("#gonder").disabled = !!(k && n === 0);
  }
  Promise.all([konserler(), doluluk()]).then(function (s) {
    liste2 = s[0]; dol2 = s[1];
    $("#konserSec").innerHTML = '<option value="">Konser seç</option>' + liste2.map(function (k) { var n = kalan(k, dol2); return '<option value="' + kacir(k.id) + '"' + (n === 0 ? " disabled" : "") + ">" + kacir(Number(k.tarih.slice(8)) + " " + ayAdi(k.tarih) + " " + gunAdi(k.tarih) + ", " + k.baslik) + (n === 0 ? " (dolu)" : "") + "</option>"; }).join("");
    var iste = q.get("konser"), ilk = liste2.find(function (k) { return k.id === iste; }) || liste2.find(function (k) { return kalan(k, dol2) !== 0; });
    if (ilk && kalan(ilk, dol2) !== 0) { sec.konser = ilk.id; $("#konserSec").value = ilk.id; }
    guncelle();
  });
  $("#konserSec").addEventListener("change", function () { sec.konser = this.value || null; guncelle(); });
  $("#eksi").addEventListener("click", function () { sec.kisi--; guncelle(); });
  $("#arti").addEventListener("click", function () { sec.kisi++; guncelle(); });
  $$("input[name=oturma]").forEach(function (r) { r.addEventListener("change", guncelle); });

  form.addEventListener("submit", function (e) {
    e.preventDefault(); mesaj.hidden = true;
    var k = konser();
    if (!k) { $("#konserSec").focus(); return goster("hata", "Konser seç.", "Hangi gece geleceğini seçersen kalan yerleri gösterebiliriz."); }
    if (!form.reportValidity()) return;
    var f = new FormData(form);
    if (!/^[0-9 +()]{10,17}$/.test(String(f.get("telefon")).trim())) return goster("hata", "Telefon numarası geçersiz.", "Örneğin 0532 123 45 67 biçiminde yaz.");
    var kayit = { konser: k.id, kisi: sec.kisi, oturma: f.get("oturma") || "Salon", ad: String(f.get("ad")).trim(), telefon: String(f.get("telefon")).trim(), eposta: String(f.get("eposta") || "").trim() || null, not: String(f.get("not") || "").trim() || null, kvkk: f.get("kvkk") === "on" };
    if (!fonksiyonVar()) return goster("bilgi", "Bu canlı önizlemede rezervasyon kaydedilmez.", "Şablonu kullanınca rezervasyonlar kapasite denetlenerek veritabanındaki rezervasyonlar tablosuna düşer.");
    var d = $("#gonder"); d.disabled = true; d.textContent = "Ayırtılıyor…";
    fetch(new URL("api/rezervasyon", document.baseURI).href, { method: "POST", body: JSON.stringify(kayit) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var h = new Error(j.hata || "Rezervasyon yapılamadı (" + r.status + ")"); h.kalan = j.kalan; h.durum = r.status; throw h; } return j; }); })
      .then(function (j) { olay("rezervasyon", { tur: k.tur, kisi: kayit.kisi }); basari(k, kayit, j.kod); })
      .catch(function (err) {
        if (err && err.durum === 409) { doluluk(true).then(function (x) { dol2 = x; guncelle(); }); goster("hata", "Yer kalmadı.", err.message + " Kişi sayısını azalt ya da başka bir gece seç."); }
        else goster("hata", "Rezervasyon yapılamadı.", (err && err.message ? err.message + ". " : "") + "Yeniden dene ya da 0212 293 41 70 numarasını ara.");
      })
      .finally(function () { d.disabled = false; d.textContent = "Masayı ayırt"; });
  });

  function basari(k, r, kod) {
    $("#icerik").innerHTML = '<section class="kap"><div class="basari" role="status"><p class="ust-yazi" style="justify-content:center">Rezervasyonun onaylandı</p><h1>Masan hazır.</h1><div class="kod">' + kacir(kod) + "</div><p>Kapıda bu kodu ya da adını söylemen yeterli. Masalar sahne saatinden 15 dakika sonrasına kadar tutulur.</p>"
      + "<dl><dt>Konser</dt><dd>" + kacir(k.baslik) + "</dd><dt>Tarih</dt><dd>" + kacir(uzunTarih(k.tarih)) + ", sahne " + saatYaz(k.saat) + "</dd><dt>Kişi</dt><dd>" + r.kisi + " kişi, " + kacir(r.oturma) + "</dd><dt>Kapı ücreti</dt><dd>" + tl(k.kapi * r.kisi) + ", girişte ödenir</dd></dl>"
      + '<div class="eylemler" style="justify-content:center"><button class="dugme" id="takvim" type="button">Takvimime ekle</button><a class="dugme ikincil" href="program.html">Programa dön</a></div></div></section>';
    window.scrollTo(0, 0);
    $("#takvim").addEventListener("click", function () {
      var t = k.tarih.replace(/-/g, ""), s1 = k.saat.replace(":", "") + "00", s2 = dakikaSaat(saatDakika(k.saat) + 150).replace(":", "") + "00";
      var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mavi Nota//Rezervasyon//TR", "BEGIN:VEVENT", "UID:" + kod + "@mavinota.com.tr", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z", "DTSTART;TZID=Europe/Istanbul:" + t + "T" + s1, "DTEND;TZID=Europe/Istanbul:" + t + "T" + s2, "SUMMARY:Mavi Nota: " + k.baslik, "LOCATION:Asmalımescit Mah. Sofyalı Sok. No: 14\\, Beyoğlu / İstanbul", "DESCRIPTION:Rezervasyon kodu " + kod + ". Kapılar sahneden bir saat önce açılır.", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = "mavi-nota-" + kod + ".ics"; document.body.appendChild(a); a.click(); a.remove();
    });
  }
}
`;

const GUN_AD = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const saatTablosu = `<table class="saatler"><tbody>
${[2, 3, 4, 5, 6, 0, 1].map((g) => `        <tr data-gun="${g}"><td>${GUN_AD[g]}</td><td>${g === 1 ? "Kapalı" : g === 5 || g === 6 ? "19.00 ile 03.00" : "19.00 ile 02.00"}</td></tr>`).join("\n")}
      </tbody></table>`;
const icki = (m: (typeof MENU)[number]) => `<div class="icki"><b>${m.ad}</b><span>${m.ic}</span><em>${m.fiyat} TL</em></div>`;
const HARITA = `<div class="harita"><iframe title="Mavi Nota Caz Kulübü harita konumu" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=28.9680%2C41.0270%2C28.9800%2C41.0340&amp;layer=mapnik&amp;marker=41.0307%2C28.9745"></iframe></div>`;

export const CAZ_KULUBU = {
  id: "caz-kulubu",
  ad: "Mavi Nota · Caz Kulübü",
  tur: "site" as const,
  aciklama: "Beyoğlu'nda caz kulübü: tablodan program, ay ve tür süzgeci, bu gece sahnede şeridi, kapasite denetimli masa rezervasyonu ve bar menüsü",
  kapak: "/gercek/build/sablon/caz-kulubu.webp",
  tablolar: TABLOLAR,
  dosyalar: {
    "index.html": sayfa("index.html", "Mavi Nota Caz Kulübü · Asmalımescit, Beyoğlu", "Asmalımescit'te haftanın altı gecesi canlı caz. Program, masa rezervasyonu, kokteyl menüsü.", `<section class="kap kahraman">
  <div>
    <p class="ust-yazi">Asmalımescit, 2011'den beri</p>
    <h1>Her gece <em>canlı</em> caz.</h1>
    <p class="giris">Seksen kişilik bir salon, 1928 yapımı bir kuyruklu piyano ve haftanın altı gecesi sahnede başka bir hikâye. Masanı ayırt, gerisini müziğe bırak.</p>
    <div class="eylemler"><a class="dugme" href="program.html">Programı gör</a><a class="dugme ikincil" href="rezervasyon.html">Masa ayırt</a></div>
    <a class="bu-gece" id="buGece" href="program.html" hidden></a>
  </div>
  <figure class="cerceve" style="margin:0">
    <img src="/gercek/muzik/ms-brass.webp" alt="Sahnede saksafon ve trompet, arkada kontrbas çalan müzisyen" />
    <figcaption><b>Mavi Nota Big Band</b>ayda bir, tam kadro</figcaption>
  </figure>
</section>
<section class="kap bolum">
  <div class="bolum-ust"><div><h2>Önümüzdeki <em>geceler</em></h2><p>Konserler 21.00 ile 22.30 arasında başlar; kapılar bir saat önce açılır.</p></div><a class="dugme ikincil" href="program.html">Bütün program</a></div>
  <div class="kartlar" id="yakinda" aria-live="polite"></div>
</section>
<section class="kap bolum">
  <div class="hikaye">
    <img src="/gercek/havuz/gorsel/mk-isik-3461.webp" alt="Masalarda yanan mumlar" loading="lazy" />
    <div>
      <p class="ust-yazi">Kulüp</p>
      <h2>Küçük bir salon, <em>büyük</em> bir dinleme geleneği.</h2>
      <p>Mavi Nota, Sofyalı Sokağı'ndaki eski bir matbaanın bodrum katında açıldı. Taş duvarlar, alçak tavan ve sahneye en fazla on iki adım. Burada müzik konuşmanın arka planı değil, gecenin kendisi.</p>
      <p>Programı kulübün müzik direktörü Kerem Tunç hazırlıyor: İstanbul'un caz sahnesinin ustaları, yeni nesil gruplar, ayda bir big band ve her hafta açık sahne.</p>
      <div class="sayilar"><div><b>80</b><span>kişilik salon</span></div><div><b>6</b><span>gece canlı müzik</span></div><div><b>1928</b><span>yapımı piyano</span></div></div>
    </div>
  </div>
</section>
<section class="kap bolum">
  <div class="bolum-ust"><div><h2>Barda <em>bu akşam</em></h2><p>Kokteyller kulübün adını taşıyor; mutfak gece yarısına kadar açık.</p></div><a class="dugme ikincil" href="menu.html">Bütün menü</a></div>
  <div class="bar-ozet">
${MENU.filter((m) => m.grup === "Kokteyl").map(icki).join("\n")}
  </div>
</section>
<section class="kap bolum">
  <div class="ziyaret">
    <div class="kutu">
      <p class="ust-yazi">Ziyaret</p>
      <h2>Bizi bul</h2>
      <p>Asmalımescit Mah. Sofyalı Sok. No: 14, Beyoğlu / İstanbul. Şişhane metrosundan dört dakika; girişimiz mavi kapılı taş binanın alt katında.</p>
      ${saatTablosu}
      <a class="dugme" href="rezervasyon.html">Masa ayırt</a>
    </div>
    ${HARITA}
  </div>
</section>
<section class="bulten">
  <div class="kap">
    <div><h2>Program her pazartesi <span style="white-space:nowrap">e-postanda.</span></h2><p>Haftanın konserleri, ilk duyurulan geceler ve bülten okurlarına ayrılan masalar.</p></div>
    <form data-vayra-form="Bülten" data-vayra-tesekkur="Teşekkürler, programı pazartesi gönderiyoruz.">
      <label class="gorunmez" for="bultenEposta" style="position:absolute;left:-999px">E-posta adresin</label>
      <input id="bultenEposta" name="eposta" type="email" required autocomplete="email" placeholder="E-posta adresin" />
      <button class="dugme" type="submit">Abone ol</button>
    </form>
  </div>
</section>`),
    "program.html": sayfa("program.html", "Program · Mavi Nota Caz Kulübü", "Mavi Nota Caz Kulübü konser programı: vokal caz, piyano, swing, Latin caz, bebop, jam geceleri.", `<section class="kap sayfa-bas">
  <p class="ust-yazi">Salıdan pazara, her gece</p>
  <h1>Program</h1>
  <p>Konser sayfasından masanı ayırtabilirsin. Kapı ücreti girişte ödenir; rezervasyon için ön ödeme alınmaz.</p>
</section>
<section class="kap">
  <div class="suzgec">
    <div class="cipler" id="aylar" role="group" aria-label="Ay seç"></div>
    <label style="position:absolute;left:-999px" for="tur">Tür</label><select id="tur" aria-label="Tür"></select>
    <span class="sayac" id="sayac" aria-live="polite"></span>
  </div>
  <div class="liste" id="program"><p class="bos">Program yükleniyor…</p></div>
</section>
<section class="kap bolum" style="margin-top:64px">
  <div class="bolum-ust"><div><h2>Sahnede <em>sen</em> de ol</h2><p>Açık sahne gecelerinde ev orkestrası eşlik ediyor. Grubunla kulüpte çalmak istersen kayıtlarını bize gönder.</p></div><a class="dugme ikincil" href="mailto:program@mavinota.com.tr">program@mavinota.com.tr</a></div>
</section>`),
    "konser.html": sayfa("konser.html", "Konser · Mavi Nota Caz Kulübü", "Konser bilgileri ve masa rezervasyonu.", `<section class="kap konser" id="konser" aria-live="polite"><p class="bos">Konser yükleniyor…</p></section>
<section class="kap bolum">
  <div class="bolum-ust"><div><h2>Aynı hafta <em>sahnede</em></h2></div><a class="dugme ikincil" href="program.html">Bütün program</a></div>
  <div class="kartlar" id="diger"></div>
</section>`),
    "rezervasyon.html": sayfa("rezervasyon.html", "Masa ayırt · Mavi Nota Caz Kulübü", "Mavi Nota Caz Kulübü'nde konser seç, kalan yerleri gör ve masanı ayırt.", `<section class="kap rez">
  <div>
    <p class="ust-yazi">Ön ödeme yok, kapıda ödenir</p>
    <h1>Masa ayırt</h1>
    <p class="giris">Geceyi ve kişi sayısını seç; yer varsa masan hemen onaylanır ve sana bir rezervasyon kodu veririz.</p>
    <form id="rez" novalidate>
      <fieldset class="adim">
        <legend>Gece <span>1 / 3</span></legend>
        <label class="alan">Konser<select id="konserSec" name="konser" required><option value="">Program yükleniyor…</option></select></label>
        <div class="secili-konser" id="seciliKonser" hidden></div>
      </fieldset>
      <fieldset class="adim">
        <legend>Kişi ve masa <span>2 / 3</span></legend>
        <div class="kisi-satir">
          <div class="sayici" role="group" aria-label="Kişi sayısı"><button type="button" id="eksi" aria-label="Bir kişi azalt">−</button><output id="kisi" aria-live="polite">2</output><button type="button" id="arti" aria-label="Bir kişi ekle">+</button></div>
          <p id="kisiNot"></p>
        </div>
        <div class="oturma" role="radiogroup" aria-label="Masa tercihi">
          <label><input type="radio" name="oturma" value="Sahne önü" /><b>Sahne önü</b>İlk iki sıra, en yakın</label>
          <label><input type="radio" name="oturma" value="Salon" checked /><b>Salon</b>Orta masalar</label>
          <label><input type="radio" name="oturma" value="Bar" /><b>Bar</b>Tabureler, ayakta rahat</label>
        </div>
      </fieldset>
      <fieldset class="adim">
        <legend>İletişim <span>3 / 3</span></legend>
        <div class="ikili">
          <label class="alan">Ad soyad<input name="ad" required minlength="3" autocomplete="name" /></label>
          <label class="alan">Cep telefonu<input name="telefon" type="tel" required inputmode="tel" autocomplete="tel" placeholder="05xx xxx xx xx" /></label>
        </div>
        <label class="alan" style="margin-top:14px">E-posta (isteğe bağlı)<input name="eposta" type="email" autocomplete="email" /></label>
        <label class="alan" style="margin-top:14px">Not (isteğe bağlı)<textarea name="not" rows="3" maxlength="600" placeholder="Doğum günü, tekerlekli sandalye, geç geleceğiz…"></textarea></label>
        <label class="onay"><input type="checkbox" name="kvkk" required /> <span><a href="kvkk.html" target="_blank" rel="noopener">Aydınlatma metnini</a> okudum; rezervasyonum için ad ve telefon bilgimin işlenmesini kabul ediyorum.</span></label>
      </fieldset>
      <div id="mesaj" class="mesaj" role="alert" hidden></div>
    </form>
  </div>
  <aside class="ozet" aria-labelledby="ozetBaslik">
    <h2 id="ozetBaslik">Rezervasyon özeti</h2>
    <dl><div><dt>Konser</dt><dd id="ozKonser">Seçilmedi</dd></div><div><dt>Tarih ve sahne saati</dt><dd id="ozTarih">Seçilmedi</dd></div><div><dt>Kişi ve masa</dt><dd id="ozKisi">2 kişi, Salon</dd></div></dl>
    <div class="toplam"><span>Kapı ücreti</span><b id="ozToplam">0 TL</b></div>
    <button class="dugme" id="gonder" type="submit" form="rez">Masayı ayırt</button>
    <p>Kapı ücreti girişte nakit ya da kartla ödenir. Gelemeyeceksen bir telefonla iptal etmen, masayı bekleyen başka birine açar.</p>
  </aside>
</section>`),
    "menu.html": sayfa("menu.html", "Bar ve menü · Mavi Nota Caz Kulübü", "Mavi Nota'nın kokteyl, şarap ve mutfak menüsü; kulüp kuralları ve özel etkinlik talebi.", `<section class="kap sayfa-bas">
  <p class="ust-yazi">Bar 19.00'da açılır, mutfak gece yarısına kadar</p>
  <h1>Bar ve <em>menü</em></h1>
  <p>Konser sırasında servis sessizce sürer; siparişini ara verilmeden önce vermeni rica ederiz.</p>
</section>
<section class="kap">
  <div class="galeri3">
    <img src="/gercek/havuz/gorsel/mk-moda-4043.webp" alt="Kalabalık bar tezgâhı" loading="lazy" />
    <img src="/gercek/havuz/gorsel/mk-urun-5133.webp" alt="Zeytinli martini" loading="lazy" />
    <img src="/gercek/havuz/gorsel/mk-urun-52418.webp" alt="Kadehe dökülen beyaz şarap" loading="lazy" />
  </div>
</section>
<section class="kap">
  <div class="menu-izgara">
${["Kokteyl", "Alkolsüz", "Şarap ve bira", "Mutfak"].map((g) => `    <div class="menu-grup"><h2>${g === "Kokteyl" ? "Kokteyller" : g}</h2>${MENU.filter((m) => m.grup === g).map(icki).join("")}</div>`).join("\n")}
  </div>
</section>
<section class="kap bolum" style="margin-top:72px">
  <div class="bolum-ust"><div><h2>Kulüp <em>adabı</em></h2></div></div>
  <div class="kurallar">
    <div><b>Kapılar bir saat önce</b><p>Masalar sahne saatinden 15 dakika sonrasına kadar tutulur.</p></div>
    <div><b>Sessiz telefon</b><p>Konser sırasında telefonlar sessizde; fotoğraf serbest, flaş değil.</p></div>
    <div><b>18 yaş sınırı</b><p>Kapıda kimlik sorulabilir. Pazar matinelerinde aile masaları var.</p></div>
    <div><b>Erişilebilirlik</b><p>Rampalı yan girişimiz var; rezervasyon notuna yazman yeterli.</p></div>
  </div>
</section>
<section class="kap bolum">
  <div class="ozel">
    <div>
      <p class="ust-yazi">Özel etkinlik</p>
      <h2>Salonu <em>sizin</em> geceniz için kapatalım.</h2>
      <p>Pazartesi akşamları ve gündüz saatlerinde kulüp; lansman, şirket yemeği ve doğum günü için kiralanabilir. Ev orkestramız ya da seçtiğiniz bir grup çalabilir. En çok 90 kişi.</p>
    </div>
    <form class="form" data-vayra-form="Özel etkinlik" data-vayra-tesekkur="Teşekkürler, iki iş günü içinde dönüş yapacağız.">
      <div class="ikili"><label class="alan">Ad soyad<input name="ad" required autocomplete="name" /></label><label class="alan">Telefon<input name="telefon" type="tel" required inputmode="tel" autocomplete="tel" /></label></div>
      <div class="ikili"><label class="alan">Tarih<input name="tarih" type="date" required /></label><label class="alan">Kişi sayısı<select name="kisi"><option>20 ile 40</option><option>40 ile 60</option><option>60 ile 90</option></select></label></div>
      <label class="alan">Etkinliğiniz<textarea name="aciklama" rows="4" required placeholder="Ne kutluyorsunuz, nasıl bir müzik hayal ediyorsunuz?"></textarea></label>
      <div><button class="dugme" type="submit">Teklif iste</button></div>
    </form>
  </div>
</section>
<section class="kap bolum">
  <div class="ziyaret">
    <div class="kutu"><h2>Saatler</h2>${saatTablosu}<a class="dugme" href="rezervasyon.html">Masa ayırt</a></div>
    ${HARITA}
  </div>
</section>`),
    "kvkk.html": sayfa("kvkk.html", "Kişisel verilerin korunması · Mavi Nota Caz Kulübü", "Mavi Nota Caz Kulübü rezervasyon aydınlatma metni.", `<section class="kap metin">
  <h1>Aydınlatma metni</h1>
  <p>Mavi Nota Müzik ve Eğlence Ltd. Şti. olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca web sitemizdeki rezervasyon, bülten ve özel etkinlik formlarıyla işlediğimiz kişisel veriler hakkında sizi bilgilendiririz.</p>
  <h2>Hangi verileri işliyoruz?</h2>
  <ul><li>Kimlik ve iletişim: ad soyad, cep telefonu, e-posta adresi</li><li>Rezervasyon bilgisi: konser, kişi sayısı, masa tercihi, notunuz</li><li>Bülten aboneliğinde yalnız e-posta adresiniz</li></ul>
  <h2>Amaç ve hukuki sebep</h2>
  <p>Verileriniz rezervasyonunuzu oluşturmak, kapıda doğrulamak ve gerektiğinde size ulaşmak için Kanun'un 5/2-c maddesi (sözleşmenin kurulması ve ifası) uyarınca işlenir. Bülten e-postaları yalnız açık rızanızla gönderilir ve her e-postadaki bağlantıyla abonelikten çıkabilirsiniz.</p>
  <h2>Saklama ve aktarım</h2>
  <p>Rezervasyon kayıtları konser tarihinden sonra en çok bir yıl saklanır ve silinir. Verileriniz pazarlama amacıyla üçüncü kişilerle paylaşılmaz; yalnız barındırma hizmeti aldığımız sağlayıcıda saklanır.</p>
  <h2>Haklarınız</h2>
  <p>Kanun'un 11. maddesindeki haklarınız için kvkk@mavinota.com.tr adresine yazabilirsiniz. Başvurunuz en geç 30 gün içinde ücretsiz yanıtlanır.</p>
  <p><a class="dugme" href="rezervasyon.html">Rezervasyona dön</a></p>
</section>`),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0e1420"/><path d="M26 47a7 7 0 1 1-3.5-6.06V15l22-5v29a7 7 0 1 1-3.5-6.06V18.6l-15 3.4z" fill="#c9a35b"/></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
    "api/doluluk.js": DOLULUK,
    "api/rezervasyon.js": REZERVASYON,
  } as Record<string, string>,
};
