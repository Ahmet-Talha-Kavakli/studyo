/* Şablon: Lâl Saç ve Güzellik — Alsancak'ta kuaför ve güzellik salonu. Kategorili hizmet menüsü (süre ve başlangıç fiyatı),
 * uzmanlar, birden çok hizmet seçilebilen online randevu (süre ve tutar toplanır, yalnız seçilen hizmetlerin hepsini yapan
 * uzmanlar listelenir, dolu saatler api/doluluk.js ile kişisel veri olmadan gelir, "randevular" tablosuna yazılır),
 * lookbook galerisi, yorumlar ve canlı önizlemeli hediye kartı formu. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";

const GUN_KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const GUN_AD = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
/** Haftanın günü (0 pazar) için açılış ve kapanış; null kapalı. */
const SAATLER: Record<number, [string, string] | null> = { 0: ["11:00", "18:00"], 1: null, 2: ["10:00", "20:00"], 3: ["10:00", "20:00"], 4: ["10:00", "20:00"], 5: ["10:00", "20:00"], 6: ["10:00", "20:00"] };

const UZMANLAR = [
  { id: "lal", ad: "Lâl Ertem", unvan: "Kurucu, renk ve balyaj uzmanı", foto: "/gercek/paz/av-hana.webp", gunler: [2, 3, 4, 5, 6], yil: 16, hakkinda: "Londra'da renk eğitimi aldıktan sonra 2012'de salonu açtı. Doğal geçişli balyaj ve sıcak bakır tonları onun imzası; her renk randevusundan önce ışıkta saç analizi yapar." },
  { id: "ece", ad: "Ece Doğan", unvan: "Kesim ve gelin saçı", foto: "/gercek/paz/av-naomi.webp", gunler: [2, 3, 5, 6, 0], yil: 11, hakkinda: "Katlı kesimler, perçem ve doğal dalgalar konusunda salonun en çok istenen adı. Her yıl yüzü aşkın gelinin saçını yapıyor; prova randevusunu mutlaka öneriyor." },
  { id: "kaan", ad: "Kaan Arslan", unvan: "Erkek kesim ve renk", foto: "/gercek/paz/av-jayden.webp", gunler: [2, 4, 5, 6, 0], yil: 9, hakkinda: "Makasla klasik erkek kesimleri ve doğal görünen beyaz kapatma boyaları yapıyor. Kısa kadın kesimlerinde de çok tercih ediliyor." },
  { id: "melis", ad: "Melis Karaca", unvan: "Makyaj, kaş ve kirpik", foto: "/gercek/paz/av-margot.webp", gunler: [3, 4, 5, 6, 0], yil: 8, hakkinda: "Işıltılı ve hafif makyajlarıyla tanınıyor. Gelin makyajlarında cilt hazırlığına bir saat ayırır, kaş tasarımında yüz ölçüsüyle çalışır." },
  { id: "derya", ad: "Derya Yıldız", unvan: "Manikür ve pedikür", foto: "/gercek/paz/av-amara.webp", gunler: [2, 3, 4, 5, 6], yil: 7, hakkinda: "Tek kullanımlık törpü ve sterilize alet setleriyle çalışır. Kalıcı ojede tırnağı yormayan, kazımasız çıkarma yöntemini uygular." },
];

const KATEGORILER = [
  { id: "kesim", ad: "Kesim ve şekillendirme", aciklama: "Yıkama, kesim ve fön dahil. Yüz hattına ve saç dokusuna göre danışmanlıkla başlar.", gorsel: "/gercek/paz/av-miso.webp" },
  { id: "renk", ad: "Renk", aciklama: "Amonyaksız boyalar ve bağ onarıcı katkıyla. Uzun saçlarda fiyat saç boyuna göre değişir.", gorsel: "/gercek/paz/av-valentina.webp" },
  { id: "bakim", ad: "Bakım", aciklama: "Yıpranmış, kabaran ya da boyalı saçlar için. Bakım sonrası fön dahil.", gorsel: "/gercek/paz/av-yuki.webp" },
  { id: "makyaj", ad: "Makyaj, kaş ve kirpik", aciklama: "Cilt hazırlığıyla başlayan makyaj; kaş ve kirpikte doğal sonuç.", gorsel: "/gercek/havuz/gorsel/mk-moda-52055.webp" },
  { id: "tirnak", ad: "Tırnak", aciklama: "Steril alet setleri ve tek kullanımlık törpüler. Kalıcı ojede 60 renk.", gorsel: "/gercek/havuz/gorsel/mk-moda-367.webp" },
  { id: "gelin", ad: "Gelin paketleri", aciklama: "Prova, nişan, kına ve düğün günü. Düğün günü salon size özel erken açılır.", gorsel: "/gercek/havuz/gorsel/mk-portre-42733.webp" },
];

type Hizmet = { id: string; kat: string; ad: string; sure: number; fiyat: number; kisa: string; uzmanlar: string[] };
const HIZMETLER: Hizmet[] = [
  { id: "kadin-kesim", kat: "kesim", ad: "Kadın kesim ve fön", sure: 60, fiyat: 1400, kisa: "Yıkama, danışmanlık, kesim ve fön", uzmanlar: ["lal", "ece", "kaan"] },
  { id: "erkek-kesim", kat: "kesim", ad: "Erkek kesim", sure: 45, fiyat: 750, kisa: "Makasla ya da makineyle, yıkama ve şekillendirme", uzmanlar: ["kaan"] },
  { id: "fon", kat: "kesim", ad: "Fön ve dalga", sure: 45, fiyat: 650, kisa: "Düz fön, dalga ya da maşa", uzmanlar: ["lal", "ece", "kaan"] },
  { id: "topuz", kat: "kesim", ad: "Topuz ve özel gün saçı", sure: 75, fiyat: 1800, kisa: "Davet, mezuniyet ve nişan için", uzmanlar: ["lal", "ece"] },
  { id: "dip-boya", kat: "renk", ad: "Dip boya", sure: 90, fiyat: 1900, kisa: "Beyaz kapatma ya da renk tazeleme, fön dahil", uzmanlar: ["lal", "kaan"] },
  { id: "tum-boya", kat: "renk", ad: "Tüm saç boya", sure: 120, fiyat: 2800, kisa: "Tek renk, uçlara kadar", uzmanlar: ["lal", "kaan"] },
  { id: "balyaj", kat: "renk", ad: "Balyaj", sure: 180, fiyat: 4800, kisa: "Elde boyama, doğal geçiş, tonlama dahil", uzmanlar: ["lal"] },
  { id: "rofle", kat: "renk", ad: "Röfle", sure: 150, fiyat: 3900, kisa: "Folyoyla ince ya da kalın tutam açma", uzmanlar: ["lal", "kaan"] },
  { id: "keratin", kat: "bakim", ad: "Keratin bakımı", sure: 150, fiyat: 4500, kisa: "Kabarmayı alır, üç ile dört ay kalıcı", uzmanlar: ["lal", "ece"] },
  { id: "botoks", kat: "bakim", ad: "Saç botoksu", sure: 90, fiyat: 2600, kisa: "Yoğun nem ve parlaklık, düzleştirmeden", uzmanlar: ["lal", "ece", "kaan"] },
  { id: "onarici", kat: "bakim", ad: "Bağ onarıcı bakım", sure: 30, fiyat: 1100, kisa: "Boya ya da açıcı sonrası kırılmaya karşı", uzmanlar: ["lal", "ece", "kaan"] },
  { id: "makyaj", kat: "makyaj", ad: "Gün ve gece makyajı", sure: 60, fiyat: 2200, kisa: "Cilt hazırlığı ve bant kirpik dahil", uzmanlar: ["melis"] },
  { id: "kas", kat: "makyaj", ad: "Kaş tasarımı", sure: 30, fiyat: 500, kisa: "Ölçüyle şekillendirme, iple ya da cımbızla", uzmanlar: ["melis"] },
  { id: "kirpik", kat: "makyaj", ad: "Kirpik lifting", sure: 60, fiyat: 1300, kisa: "Kıvrım ve boya, altı ile sekiz hafta", uzmanlar: ["melis"] },
  { id: "manikur", kat: "tirnak", ad: "Manikür", sure: 45, fiyat: 650, kisa: "Şekillendirme, kütikül bakımı ve düz oje", uzmanlar: ["derya"] },
  { id: "kalici-oje", kat: "tirnak", ad: "Kalıcı oje", sure: 60, fiyat: 900, kisa: "Manikür dahil, üç hafta dayanır", uzmanlar: ["derya"] },
  { id: "pedikur", kat: "tirnak", ad: "Pedikür", sure: 60, fiyat: 850, kisa: "Ayak banyosu, nasır bakımı ve oje", uzmanlar: ["derya"] },
  { id: "gelin-prova", kat: "gelin", ad: "Gelin saçı provası", sure: 90, fiyat: 3500, kisa: "Düğünden iki ile dört hafta önce; ücreti paketten düşülür", uzmanlar: ["lal", "ece"] },
  { id: "gelin-sac", kat: "gelin", ad: "Gelin saçı", sure: 120, fiyat: 7500, kisa: "Düğün günü, tel ve aksesuar takımı dahil", uzmanlar: ["lal", "ece"] },
  { id: "gelin-makyaj", kat: "gelin", ad: "Gelin makyajı", sure: 90, fiyat: 6500, kisa: "Cilt hazırlığı, kirpik ve gün boyu rötuş seti", uzmanlar: ["melis"] },
  { id: "nisan", kat: "gelin", ad: "Nişan ve kına saçı", sure: 90, fiyat: 2800, kisa: "Topuz, örgü ya da dalga; aksesuar dahil", uzmanlar: ["lal", "ece"] },
];

const LOOKBOOK = [
  { foto: "/gercek/paz/av-valentina.webp", ad: "Bakır dalga", uzman: "Lâl Ertem", hizmet: "Tüm saç boya ve fön" },
  { foto: "/gercek/paz/av-zara.webp", ad: "Gümüş geçiş", uzman: "Lâl Ertem", hizmet: "Beyaz saça geçiş balyajı" },
  { foto: "/gercek/havuz/gorsel/mk-moda-52055.webp", ad: "Işıltılı göz", uzman: "Melis Karaca", hizmet: "Gece makyajı", genis: true },
  { foto: "/gercek/paz/av-elena.webp", ad: "Doğal bukle", uzman: "Ece Doğan", hizmet: "Bukle kesimi ve nem bakımı" },
  { foto: "/gercek/paz/av-miso.webp", ad: "Bal köpüğü", uzman: "Lâl Ertem", hizmet: "Balyaj ve tonlama" },
  { foto: "/gercek/paz/av-audrey.webp", ad: "Kızıl bukleler", uzman: "Ece Doğan", hizmet: "Katlı kesim ve saç botoksu" },
  { foto: "/gercek/havuz/gorsel/mk-portre-42733.webp", ad: "Prova günü", uzman: "Ece Doğan", hizmet: "Gelin saçı provası", genis: true },
  { foto: "/gercek/paz/av-jia.webp", ad: "Buz grisi", uzman: "Kaan Arslan", hizmet: "Röfle ve gri tonlama" },
  { foto: "/gercek/paz/av-yuki.webp", ad: "Yumuşak dalga", uzman: "Ece Doğan", hizmet: "Fön ve dalga" },
  { foto: "/gercek/havuz/gorsel/mk-moda-367.webp", ad: "Kirpik lifting", uzman: "Melis Karaca", hizmet: "Kirpik lifting ve boya", genis: true },
];

const YORUMLAR = [
  { ad: "Selin A.", hizmet: "Balyaj, Lâl Ertem", metin: "Yıllardır istediğim doğal geçişi sonunda buldum. Lâl Hanım önce saçımı ışıkta inceledi, nasıl görüneceğini anlattı; sonuç tam konuştuğumuz gibi oldu." },
  { ad: "Burcu T.", hizmet: "Gelin saçı ve makyajı", metin: "Düğün sabahı salonu bizim için erken açtılar. Prova günü her şeyi denediğimiz için hiç stres yaşamadım; makyaj gece yarısına kadar ilk günkü gibiydi." },
  { ad: "Mert Ö.", hizmet: "Erkek kesim, Kaan Arslan", metin: "Online randevuyla tam saatinde girdim, yirmi dakika beklemeden çıktım. Kesim iki hafta sonra bile şeklini koruyor." },
];

const tl = (n: number) => n.toLocaleString("tr-TR") + " TL";
const kat = (id: string) => KATEGORILER.find((k) => k.id === id)!;
const uzmanAd = (id: string) => UZMANLAR.find((u) => u.id === id)!.ad;

const TABLOLAR: Record<string, SablonTablo> = {
  randevular: {
    aciklama: "Siteden gelen salon randevuları. Ziyaretçi ekleyebilir ama okuyamaz; dolu saatler api/doluluk.js ile kişisel veri olmadan gösterilir.",
    kurallar: { okuma: "kapali", ekleme: "herkes", duzenleme: "kapali" },
    sema: [
      { ad: "ad", tur: "metin", zorunlu: true, aciklama: "Müşterinin adı soyadı" },
      { ad: "telefon", tur: "metin", zorunlu: true },
      { ad: "eposta", tur: "eposta" },
      { ad: "hizmetler", tur: "metin", zorunlu: true, aciklama: "Seçilen hizmetler, virgülle" },
      { ad: "sure", tur: "sayi", zorunlu: true, aciklama: "Toplam süre, dakika" },
      { ad: "tutar", tur: "sayi", aciklama: "Başlangıç fiyatları toplamı, TL" },
      { ad: "uzman", tur: "secim", zorunlu: true, secenekler: UZMANLAR.map((u) => u.ad) },
      { ad: "gun", tur: "metin", zorunlu: true, aciklama: "YYYY-AA-GG" },
      { ad: "saat", tur: "metin", zorunlu: true, aciklama: "SS:DD başlangıç" },
      { ad: "bitis", tur: "metin", aciklama: "SS:DD bitiş" },
      { ad: "not", tur: "uzunMetin" },
      { ad: "ilkZiyaret", tur: "mantiksal" },
      { ad: "kvkk", tur: "mantiksal", zorunlu: true },
      { ad: "durum", tur: "secim", secenekler: ["Bekliyor", "Onaylandı", "Geldi", "Gelmedi", "İptal"], varsayilan: "Onaylandı" },
    ],
    kayitlar: [],
  },
};

const MENU = [["index.html", "Salon"], ["hizmetler.html", "Hizmetler"], ["ekip.html", "Ekip"], ["galeri.html", "Lookbook"], ["hediye-karti.html", "Hediye kartı"]];
const LOGO = `<a class="logo" href="index.html" aria-label="Lâl Saç ve Güzellik ana sayfa"><b>Lâl</b><span>saç ve güzellik</span></a>`;
const ust = (aktif: string) => `<a class="atla" href="#icerik">İçeriğe geç</a>
<div class="duyuru">Pazartesi kapalıyız. Salı ile pazar arası online randevu açık.</div>
<header class="ust">
  ${LOGO}
  <nav class="menu" data-menu aria-label="Ana menü">
${MENU.map(([h, a]) => `    <a href="${h}"${h === aktif ? ' aria-current="page"' : ""}>${a}</a>`).join("\n")}
  </nav>
  <a class="dugme kucuk ust-dugme" href="randevu.html">Randevu al</a>
  <button class="menu-dugme" type="button" data-menu-ac aria-expanded="false" aria-label="Menüyü aç"><span></span><span></span><span></span></button>
</header>`;

const alt = `<footer class="alt">
  <div class="alt-ust">
    <p class="alt-buyuk">Aynanın karşısında<br><em>kendin gibi</em> hisset.</p>
    <a class="dugme gul" href="randevu.html">Randevu al</a>
  </div>
  <div class="alt-ic">
    <div>${LOGO}<p>2012'den beri Alsancak'ta. Saç, makyaj ve tırnak için tek adres.</p></div>
    <div><h4>Adres</h4><p>Kıbrıs Şehitleri Cad. No: 74, Kat 1<br>Alsancak, Konak / İzmir</p></div>
    <div><h4>Saatler</h4><p>Salı ile cumartesi 10.00 ile 20.00</p><p>Pazar 11.00 ile 18.00</p><p>Pazartesi kapalı</p></div>
    <div><h4>İletişim</h4><p><a href="tel:+902324641830">0232 464 18 30</a></p><p><a href="mailto:randevu@lalsacguzellik.com">randevu@lalsacguzellik.com</a></p><p><a href="hediye-karti.html">Hediye kartı</a></p></div>
  </div>
  <p class="alt-not">Lâl Saç ve Güzellik Salonu. Fiyatlar başlangıç fiyatıdır; saç boyu ve yoğunluğuna göre salonda netleşir.</p>
</footer>`;

const sayfa = (dosya: string, baslik: string, aciklama: string, govde: string) => `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${baslik}</title>
  <meta name="description" content="${aciklama}" />
  <meta name="theme-color" content="#faf6f1" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap" />
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

const YILDIZ = `<svg viewBox="0 0 100 18" aria-hidden="true">${[0, 1, 2, 3, 4].map((i) => `<path transform="translate(${i * 20} 0)" d="M9 1l2.3 5.2 5.7.5-4.3 3.8 1.3 5.6L9 13.2 4 16.1l1.3-5.6L1 6.7l5.7-.5z" fill="currentColor"/>`).join("")}</svg>`;
const hizmetSatiri = (h: Hizmet) => `<li><div><h4>${h.ad}</h4><p>${h.kisa}</p></div><span class="nokta-cizgi" aria-hidden="true"></span><div class="fiyat-blok"><b>${tl(h.fiyat)}'den</b><small>${h.sure} dakika</small></div></li>`;
const uzmanKarti = (u: (typeof UZMANLAR)[number]) => `<a class="uzman" href="ekip.html#${u.id}"><div class="foto"><img src="${u.foto}" alt="${u.ad}" loading="lazy" /></div><h3>${u.ad}</h3><p>${u.unvan}</p></a>`;

const STIL = String.raw`/* Lâl Saç ve Güzellik — krem zemin, espresso mürekkep, gül kurusu vurgu; Playfair Display ve Outfit. Keskin köşeler, ince çizgiler, dergi düzeni. */
:root {
  --krem: #faf6f1; --krem-koyu: #f1e9df; --kart: #fffdf9; --espresso: #2b1f1a; --soluk: #6e5e56; --gul: #c9897b; --gul-koyu: #a8685b; --gul-acik: #f4e3dc;
  --cizgi: rgba(43, 31, 26, .14); --serif: "Playfair Display", Georgia, serif; --sans: "Outfit", system-ui, sans-serif;
}
[hidden] { display: none !important; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--krem); color: var(--espresso); font: 300 16.5px/1.65 var(--sans); font-variant-numeric: lining-nums; -webkit-font-smoothing: antialiased; }
img, svg { display: block; max-width: 100%; }
a { color: inherit; }
b, strong { font-weight: 500; }
h1, h2, h3, h4 { font-family: var(--serif); font-weight: 400; line-height: 1.08; letter-spacing: -.015em; margin: 0; }
h1 em, h2 em, h3 em, p em { font-style: italic; color: var(--gul-koyu); }
:focus-visible { outline: 2px solid var(--gul-koyu); outline-offset: 3px; }
.atla { position: absolute; left: -999px; top: 8px; background: var(--espresso); color: var(--krem); padding: 8px 14px; z-index: 50; }
.atla:focus { left: 12px; }
.kapsayici { max-width: 1320px; margin: 0 auto; padding: 0 clamp(18px, 4vw, 56px); }
.duyuru { background: var(--espresso); color: #e9dcd3; text-align: center; font-size: 13.5px; padding: 8px 16px; }

.ust { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: 28px; padding: 16px clamp(18px, 4vw, 56px); background: color-mix(in srgb, var(--krem) 92%, transparent); backdrop-filter: blur(12px); border-bottom: 1px solid var(--cizgi); }
.logo { display: inline-flex; align-items: baseline; gap: 10px; text-decoration: none; color: var(--espresso); }
.logo b { font: italic 500 34px/1 var(--serif); letter-spacing: -.02em; }
.logo span { font-size: 13px; color: var(--soluk); letter-spacing: .04em; }
.menu { display: flex; gap: 26px; margin-left: auto; }
.menu a { text-decoration: none; font-size: 15px; font-weight: 400; color: var(--soluk); padding: 10px 0; border-bottom: 1px solid transparent; }
.menu a:hover { color: var(--espresso); }
.menu a[aria-current] { color: var(--espresso); border-bottom-color: var(--gul); }
.menu-dugme { display: none; width: 46px; height: 46px; border: 1px solid var(--cizgi); background: transparent; cursor: pointer; flex-direction: column; justify-content: center; align-items: center; gap: 5px; }
.menu-dugme span { width: 20px; height: 1.5px; background: var(--espresso); }

.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px; padding: 14px 28px; border: 1px solid var(--espresso); border-radius: 2px; background: var(--espresso); color: var(--krem); font: 400 15px/1 var(--sans); letter-spacing: .02em; text-decoration: none; cursor: pointer; transition: background .2s, color .2s, border-color .2s; }
.dugme:hover { background: #46342c; }
.dugme[disabled] { opacity: .45; cursor: not-allowed; }
.dugme.kucuk { min-height: 44px; padding: 10px 20px; font-size: 14px; }
.dugme.ikincil { background: transparent; color: var(--espresso); }
.dugme.ikincil:hover { background: var(--espresso); color: var(--krem); }
.dugme.gul { background: var(--gul); border-color: var(--gul); color: #fff; }
.dugme.gul:hover { background: var(--gul-koyu); border-color: var(--gul-koyu); }
.ok-baglanti { display: inline-flex; gap: 10px; align-items: center; font-size: 15px; text-decoration: none; border-bottom: 1px solid var(--gul); padding: 8px 0 4px; }
.ok-baglanti:hover { color: var(--gul-koyu); }

/* Kahraman */
.kahraman { display: grid; grid-template-columns: 1.05fr 1fr; gap: clamp(28px, 5vw, 80px); align-items: center; padding-block: clamp(40px, 6vw, 88px) clamp(48px, 7vw, 100px); }
.kahraman .ust-not { font-size: 14px; color: var(--soluk); letter-spacing: .03em; margin: 0 0 26px; display: flex; align-items: center; gap: 14px; }
.kahraman .ust-not::before { content: ""; width: 44px; height: 1px; background: var(--gul); }
.kahraman h1 { font-size: clamp(52px, 7.4vw, 112px); line-height: .98; letter-spacing: -.03em; }
.kahraman .giris { font-size: 18.5px; color: var(--soluk); max-width: 500px; margin: 28px 0 34px; }
.eylemler { display: flex; flex-wrap: wrap; gap: 14px 22px; align-items: center; }
.kolaj { position: relative; aspect-ratio: 1 / 1.08; }
.kolaj figure { position: absolute; margin: 0; overflow: hidden; background: var(--krem-koyu); }
.kolaj img { width: 100%; height: 100%; object-fit: cover; }
.kolaj .k1 { left: 18%; top: 0; width: 62%; height: 80%; }
.kolaj .k1 img { object-position: top; }
.kolaj .k2 { left: 0; bottom: 0; width: 46%; height: 34%; border: 8px solid var(--krem); }
.kolaj .k3 { right: 0; bottom: 6%; width: 32%; height: 42%; border: 8px solid var(--krem); }
.kolaj .k3 img { object-position: top; }
.rozet { position: absolute; right: 8%; top: 6%; width: 116px; height: 116px; border-radius: 50%; background: var(--gul); color: #fff; display: grid; place-items: center; text-align: center; font: italic 400 17px/1.15 var(--serif); padding: 14px; transform: rotate(-8deg); }

.bant { background: var(--espresso); color: #f0e4dc; overflow: hidden; white-space: nowrap; padding: 20px 0; }
.bant div { display: inline-flex; gap: 46px; animation: kay 38s linear infinite; padding-left: 46px; }
.bant span { font: italic 400 30px/1 var(--serif); display: inline-flex; align-items: center; gap: 46px; }
.bant span::after { content: ""; width: 9px; height: 9px; border-radius: 50%; background: var(--gul); }
@keyframes kay { to { transform: translateX(-50%); } }

.bolum { padding-block: clamp(64px, 9vw, 130px); }
.bolum-ust { display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: end; margin-bottom: clamp(30px, 4vw, 56px); }
.bolum-ust .sayi { font: italic 400 18px var(--serif); color: var(--gul-koyu); display: block; margin-bottom: 12px; }
.bolum-ust h2 { font-size: clamp(40px, 5.4vw, 76px); }
.bolum-ust p { margin: 14px 0 0; color: var(--soluk); max-width: 560px; }

/* Basılı menü */
.menu-izgara { display: grid; grid-template-columns: 1fr 1fr; gap: 8px clamp(32px, 6vw, 96px); }
.kat-blok h3 { font-size: 30px; padding-bottom: 14px; border-bottom: 1px solid var(--espresso); margin-bottom: 4px; display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.kat-blok h3 small { font: 300 13.5px var(--sans); color: var(--soluk); }
.fiyat-liste { list-style: none; padding: 0; margin: 0 0 38px; }
.fiyat-liste li { display: grid; grid-template-columns: auto 1fr auto; gap: 14px; align-items: baseline; padding: 16px 0; border-bottom: 1px solid var(--cizgi); }
.fiyat-liste h4 { font: 400 20px/1.25 var(--serif); }
.fiyat-liste p { margin: 2px 0 0; font-size: 14px; color: var(--soluk); }
.nokta-cizgi { border-bottom: 1px dotted color-mix(in srgb, var(--espresso) 40%, transparent); transform: translateY(-6px); min-width: 20px; }
.fiyat-blok { text-align: right; white-space: nowrap; }
.fiyat-blok b { display: block; font-weight: 500; font-size: 16px; }
.fiyat-blok small { color: var(--soluk); font-size: 13px; }

/* Hizmetler sayfası */
.kat-sekme { position: sticky; top: 77px; z-index: 10; display: flex; gap: 6px; overflow-x: auto; padding: 12px 0; background: var(--krem); border-bottom: 1px solid var(--cizgi); scrollbar-width: none; }
.kat-sekme::-webkit-scrollbar { display: none; }
.kat-sekme a { flex: none; text-decoration: none; padding: 10px 16px; font-size: 14.5px; color: var(--soluk); border: 1px solid var(--cizgi); border-radius: 2px; }
.kat-sekme a:hover { color: var(--espresso); border-color: var(--espresso); }
.kat-bolum { display: grid; grid-template-columns: 360px 1fr; gap: clamp(28px, 5vw, 72px); padding-block: 56px; border-bottom: 1px solid var(--cizgi); scroll-margin-top: 140px; }
.kat-bolum .gorsel { aspect-ratio: 4 / 5; overflow: hidden; background: var(--krem-koyu); }
.kat-bolum .gorsel img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
.kat-bolum h2 { font-size: clamp(36px, 4vw, 54px); }
.kat-bolum > div > p { color: var(--soluk); margin: 12px 0 18px; max-width: 560px; }
.kat-bolum .dugme { margin-top: 12px; }

/* Uzmanlar */
.uzman-izgara { display: grid; grid-template-columns: repeat(5, 1fr); gap: 18px; }
.uzman { text-decoration: none; }
.uzman .foto { aspect-ratio: 3 / 4; overflow: hidden; background: var(--krem-koyu); }
.uzman img { width: 100%; height: 100%; object-fit: cover; object-position: top; filter: saturate(.92); transition: transform .7s, filter .4s; }
.uzman:hover img { transform: scale(1.04); filter: saturate(1.05); }
.uzman h3 { font-size: 23px; margin-top: 16px; }
.uzman p { margin: 4px 0 0; font-size: 14px; color: var(--soluk); }
.uzman-uzun { display: grid; grid-template-columns: 1fr 1.25fr; gap: clamp(28px, 6vw, 96px); align-items: center; padding-block: 56px; border-bottom: 1px solid var(--cizgi); }
.uzman-uzun:nth-child(even) .foto { order: 2; }
.uzman-uzun .foto { aspect-ratio: 4 / 5; overflow: hidden; background: var(--krem-koyu); max-height: 640px; }
.uzman-uzun img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
.uzman-uzun h2 { font-size: clamp(44px, 5vw, 72px); }
.uzman-uzun .unvan { font: italic 400 22px var(--serif); color: var(--gul-koyu); margin: 8px 0 22px; }
.uzman-uzun p { color: var(--soluk); max-width: 560px; }
.uzman-bilgi { display: flex; gap: 40px; margin: 26px 0 30px; padding-top: 22px; border-top: 1px solid var(--cizgi); flex-wrap: wrap; }
.uzman-bilgi div b { display: block; font: 400 34px/1 var(--serif); }
.uzman-bilgi div span { font-size: 13.5px; color: var(--soluk); }

/* Lookbook */
.lookbook { columns: 3; column-gap: 18px; }
.lb { break-inside: avoid; margin: 0 0 18px; position: relative; display: block; width: 100%; padding: 0; border: 0; background: var(--krem-koyu); cursor: zoom-in; overflow: hidden; text-align: left; font: inherit; color: inherit; }
.lb img { width: 100%; aspect-ratio: 3 / 4; object-fit: cover; object-position: top; transition: transform .7s; }
.lb.genis img { aspect-ratio: 4 / 3; object-position: center; }
.lb:hover img { transform: scale(1.03); }
.lb figcaption { position: absolute; left: 0; right: 0; bottom: 0; padding: 40px 18px 16px; background: linear-gradient(transparent, rgba(30, 20, 16, .72)); color: #fff; }
.lb figcaption b { display: block; font: italic 400 22px/1.1 var(--serif); }
.lb figcaption span { font-size: 13px; color: #eadbd2; }
.lb-pencere { border: 0; padding: 0; background: transparent; max-width: min(92vw, 980px); width: 100%; }
.lb-pencere::backdrop { background: rgba(26, 18, 14, .86); }
.lb-pencere img { width: 100%; max-height: 80vh; object-fit: contain; background: #1a120e; }
.lb-pencere p { color: #f3e7df; margin: 12px 0 0; font-size: 15px; }
.lb-pencere p b { font: italic 400 22px var(--serif); margin-right: 10px; }
.lb-kapat { position: absolute; right: 10px; top: 10px; width: 46px; height: 46px; border: 0; border-radius: 50%; background: rgba(250, 246, 241, .92); color: var(--espresso); font-size: 24px; cursor: pointer; line-height: 1; }

.yorumlar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.yorum { background: var(--kart); border: 1px solid var(--cizgi); padding: 30px 28px; display: flex; flex-direction: column; gap: 16px; }
.yorum svg { width: 92px; color: var(--gul); }
.yorum p { margin: 0; font: italic 400 19px/1.5 var(--serif); flex: 1; }
.yorum footer { font-size: 14px; color: var(--soluk); }
.yorum footer b { color: var(--espresso); display: block; font-size: 15px; }

.hediye-bant { display: grid; grid-template-columns: 1.1fr 1fr; gap: clamp(28px, 5vw, 72px); align-items: center; background: var(--gul-acik); padding: clamp(28px, 5vw, 72px); }
.hediye-bant h2 { font-size: clamp(38px, 4.6vw, 64px); margin-bottom: 14px; }
.hediye-bant p { color: var(--soluk); margin: 0 0 26px; max-width: 520px; }

.ziyaret { display: grid; grid-template-columns: 1fr 1.3fr; gap: 0; border: 1px solid var(--cizgi); }
.ziyaret .kutu { padding: clamp(26px, 4vw, 52px); background: var(--kart); }
.ziyaret h2 { font-size: clamp(36px, 4vw, 56px); margin-bottom: 16px; }
.ziyaret p { color: var(--soluk); margin: 0 0 6px; }
.saat-liste { list-style: none; padding: 0; margin: 22px 0 28px; }
.saat-liste li { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--cizgi); font-size: 15px; }
.saat-liste li.bugun { color: var(--gul-koyu); font-weight: 500; }
.ziyaret iframe { width: 100%; height: 100%; min-height: 420px; border: 0; background: var(--krem-koyu); display: block; }

/* Sayfa başlığı */
.sayfa-bas { padding-block: clamp(40px, 6vw, 88px) clamp(28px, 4vw, 48px); border-bottom: 1px solid var(--cizgi); display: grid; grid-template-columns: 1.2fr 1fr; gap: 28px; align-items: end; }
.sayfa-bas h1 { font-size: clamp(54px, 8vw, 116px); line-height: .95; letter-spacing: -.03em; }
.sayfa-bas p { margin: 0; color: var(--soluk); font-size: 17.5px; }

/* Randevu */
.randevu { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, .9fr); gap: clamp(24px, 4vw, 56px); align-items: start; padding-block: 40px 90px; }
.randevu > * { min-width: 0; }
.adim { border: 0; border-top: 1px solid var(--espresso); padding: 26px 0 40px; margin: 0; min-width: 0; }
.adim > legend { float: left; width: 100%; padding: 0; margin: 0 0 18px; display: flex; align-items: baseline; gap: 14px; font: 400 32px/1.1 var(--serif); }
.adim > legend + * { clear: both; }
.adim > legend i { font: italic 400 18px var(--serif); color: var(--gul-koyu); }
.adim > legend small { margin-left: auto; font: 300 14px var(--sans); color: var(--soluk); }
.kat-cipler { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
.kat-cip { min-height: 42px; padding: 8px 16px; border: 1px solid var(--cizgi); border-radius: 2px; background: transparent; font: 400 14px var(--sans); color: var(--soluk); cursor: pointer; }
.kat-cip:hover { border-color: var(--espresso); color: var(--espresso); }
.kat-cip[aria-pressed="true"] { background: var(--espresso); color: var(--krem); border-color: var(--espresso); }
.kat-cip b { display: inline-grid; place-items: center; min-width: 20px; height: 20px; margin-left: 6px; border-radius: 50%; background: var(--gul); color: #fff; font-size: 11.5px; font-weight: 500; }
.h-liste { display: grid; gap: 8px; }
.h-sec { display: grid; grid-template-columns: 30px 1fr auto; gap: 14px; align-items: center; width: 100%; text-align: left; padding: 16px 18px; border: 1px solid var(--cizgi); background: var(--kart); cursor: pointer; font: inherit; color: inherit; transition: border-color .2s, background .2s; }
.h-sec:hover { border-color: var(--espresso); }
.h-sec .kutucuk { width: 26px; height: 26px; border: 1px solid var(--espresso); display: grid; place-items: center; }
.h-sec .kutucuk svg { width: 16px; opacity: 0; color: #fff; }
.h-sec[aria-pressed="true"] { border-color: var(--gul-koyu); background: var(--gul-acik); }
.h-sec[aria-pressed="true"] .kutucuk { background: var(--gul-koyu); border-color: var(--gul-koyu); }
.h-sec[aria-pressed="true"] .kutucuk svg { opacity: 1; }
.h-sec strong { display: block; font: 400 19px/1.3 var(--serif); }
.h-sec small { color: var(--soluk); font-size: 13.5px; }
.h-sec em { font-style: normal; text-align: right; font-size: 14.5px; font-weight: 400; white-space: nowrap; }
.h-sec em span { display: block; color: var(--soluk); font-size: 12.5px; }
.u-liste { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.u-sec { position: relative; padding: 0; border: 1px solid var(--cizgi); background: var(--kart); cursor: pointer; text-align: left; font: inherit; color: inherit; overflow: hidden; }
.u-sec img { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; object-position: top; }
.u-sec .fark { width: 100%; aspect-ratio: 1 / 1; display: grid; place-items: center; background: var(--krem-koyu); font: italic 400 40px var(--serif); color: var(--gul-koyu); }
.u-sec span { display: block; padding: 10px 12px 12px; font-size: 14px; line-height: 1.3; }
.u-sec span small { display: block; color: var(--soluk); font-size: 12.5px; }
.u-sec[aria-pressed="true"] { border-color: var(--gul-koyu); box-shadow: inset 0 0 0 2px var(--gul-koyu); }
.u-sec[aria-pressed="true"]::after { content: ""; position: absolute; top: 10px; right: 10px; width: 26px; height: 26px; border-radius: 50%; background: var(--gul-koyu) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'%3E%3Cpath d='M6 12l4 4 8-8'/%3E%3C/svg%3E") center / 14px no-repeat; }
.bilgi-not { padding: 18px 20px; background: var(--krem-koyu); color: var(--soluk); font-size: 15px; }
.bilgi-not b { color: var(--espresso); display: block; }
.gunler { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: thin; }
.gun { flex: none; width: 76px; display: grid; justify-items: center; padding: 12px 6px; border: 1px solid var(--cizgi); background: var(--kart); color: inherit; cursor: pointer; font: 400 12.5px var(--sans); }
.gun b { font: 400 28px/1.1 var(--serif); }
.gun small { color: var(--soluk); font-size: 12px; }
.gun:hover:not(:disabled) { border-color: var(--espresso); }
.gun[aria-pressed="true"] { background: var(--espresso); border-color: var(--espresso); color: var(--krem); }
.gun[aria-pressed="true"] small { color: #cdbdb3; }
.gun:disabled { opacity: .4; cursor: not-allowed; }
.slotlar { display: grid; grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 8px; margin-top: 18px; }
.slot { min-height: 48px; border: 1px solid var(--cizgi); background: var(--kart); color: inherit; font: 400 15.5px var(--sans); cursor: pointer; }
.slot:hover:not(:disabled) { border-color: var(--espresso); }
.slot[aria-pressed="true"] { background: var(--gul-koyu); border-color: var(--gul-koyu); color: #fff; }
.slot:disabled { color: #b5a79f; background: transparent; text-decoration: line-through; cursor: not-allowed; }
.alt-satir { display: flex; justify-content: space-between; gap: 12px; margin-top: 12px; font-size: 13.5px; color: var(--soluk); flex-wrap: wrap; }
.ikili { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
label.alan { display: grid; gap: 8px; font-size: 14px; font-weight: 400; color: var(--soluk); }
.alan input, .alan select, .alan textarea { width: 100%; min-height: 52px; padding: 13px 16px; border: 1px solid var(--cizgi); border-radius: 2px; background: var(--kart); color: var(--espresso); font: 400 16px var(--sans); }
.alan textarea { min-height: 100px; resize: vertical; }
.alan input:focus, .alan select:focus, .alan textarea:focus { outline: none; border-color: var(--espresso); }
.onay { display: flex; gap: 12px; align-items: flex-start; font-size: 14px; color: var(--soluk); margin-top: 14px; }
.onay input { width: 22px; height: 22px; margin-top: 1px; accent-color: var(--gul-koyu); flex: none; }
.sepet { position: sticky; top: 100px; background: var(--espresso); color: #d9cbc2; padding: 30px 28px; }
.sepet h2 { color: #fff; font-size: 30px; margin-bottom: 18px; }
.sepet ul { list-style: none; padding: 0; margin: 0 0 16px; }
.sepet li { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, .12); font-size: 14.5px; }
.sepet li span:last-child { white-space: nowrap; color: #fff; }
.sepet .bos-sepet { color: #a8968b; font-size: 14.5px; margin: 0 0 16px; }
.sepet dl { display: grid; grid-template-columns: auto 1fr; gap: 10px 14px; margin: 18px 0 22px; font-size: 14.5px; }
.sepet dt { color: #a8968b; }
.sepet dd { margin: 0; color: #fff; text-align: right; }
.sepet .toplam { font: 400 30px/1 var(--serif); color: #fff; }
.sepet .dugme { width: 100%; }
.sepet p { font-size: 13px; color: #a8968b; margin: 14px 0 0; }
.mesaj { padding: 14px 16px; font-size: 14.5px; margin-top: 16px; }
.mesaj b { display: block; font-weight: 500; }
.mesaj.hata { background: #f6dcd4; color: #7a2b1b; }
.mesaj.bilgi { background: #efe5cf; color: #5b4712; }
.basari { max-width: 720px; margin: clamp(32px, 6vw, 80px) auto; text-align: center; padding: clamp(28px, 5vw, 64px); background: var(--kart); border: 1px solid var(--cizgi); }
.basari .ust-not { font: italic 400 20px var(--serif); color: var(--gul-koyu); margin: 0 0 10px; }
.basari h1 { font-size: clamp(42px, 5vw, 64px); margin-bottom: 14px; }
.basari p { color: var(--soluk); }
.basari dl { display: grid; grid-template-columns: auto 1fr; gap: 10px 22px; text-align: left; margin: 28px 0; padding: 22px 0; border-top: 1px solid var(--cizgi); border-bottom: 1px solid var(--cizgi); }
.basari dt { color: var(--soluk); }
.basari dd { margin: 0; }
.basari .eylemler { justify-content: center; }

/* Hediye kartı */
.hediye { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(28px, 5vw, 80px); align-items: start; padding-block: 48px 90px; }
.hediye > * { min-width: 0; }
.hediye .kart-onizleme { position: sticky; top: 110px; }
.kart-onizleme { position: relative; aspect-ratio: 1.6 / 1; background: var(--espresso); color: #f3e7df; padding: clamp(22px, 3.4vw, 40px); display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; }
.kart-onizleme::before { content: ""; position: absolute; width: 70%; aspect-ratio: 1; right: -22%; top: -38%; border-radius: 50%; border: 1px solid rgba(201, 137, 123, .5); }
.kart-onizleme::after { content: ""; position: absolute; width: 50%; aspect-ratio: 1; right: -8%; top: -18%; border-radius: 50%; border: 1px solid rgba(201, 137, 123, .35); }
.kart-onizleme p { margin: 0; max-width: none; }
.kart-onizleme .ust-satir { display: flex; justify-content: space-between; align-items: baseline; position: relative; z-index: 1; }
.kart-onizleme .marka { font: italic 500 34px/1 var(--serif); }
.kart-onizleme .tutar { font: 400 clamp(34px, 4vw, 52px)/1 var(--serif); color: #fff; }
.kart-onizleme .kime { color: #fff; font: italic 400 clamp(20px, 2.2vw, 26px)/1.25 var(--serif); position: relative; z-index: 1; }
.kart-onizleme .mesaj-on { font-size: 14px; color: #cdbdb3; margin: 6px 0 0; max-height: 3.2em; overflow: hidden; }
.kart-onizleme .alt-satir { color: #a8968b; margin: 0; position: relative; z-index: 1; }
.tutar-sec { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.tutar-sec label { position: relative; cursor: pointer; }
.tutar-sec input { position: absolute; opacity: 0; inset: 0; cursor: pointer; }
.tutar-sec span { display: grid; place-items: center; min-height: 56px; border: 1px solid var(--cizgi); background: var(--kart); font: 400 19px var(--serif); }
.tutar-sec input:checked + span { background: var(--espresso); color: var(--krem); border-color: var(--espresso); }
.tutar-sec input:focus-visible + span { outline: 2px solid var(--gul-koyu); outline-offset: 2px; }
.form-izgara { display: grid; gap: 18px; }
.form-izgara h2 { font-size: 26px; margin-top: 10px; }

.alt { background: var(--espresso); color: #c7b6ac; padding: clamp(48px, 7vw, 96px) clamp(18px, 4vw, 56px) 30px; }
.alt-ust { max-width: 1320px; margin: 0 auto 56px; display: flex; justify-content: space-between; align-items: end; gap: 28px; flex-wrap: wrap; padding-bottom: 48px; border-bottom: 1px solid rgba(255, 255, 255, .14); }
.alt .alt-buyuk { margin: 0; font: 400 clamp(38px, 5.4vw, 80px)/1.02 var(--serif); color: #fff; letter-spacing: -.02em; }
.alt-buyuk em { color: var(--gul); }
.alt-ic { max-width: 1320px; margin: 0 auto; display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 32px; }
.alt .logo { color: #fff; }
.alt .logo span { color: #a8968b; }
.alt h4 { color: #fff; font-size: 20px; margin: 0 0 10px; }
.alt p { margin: 6px 0; font-size: 14.5px; }
.alt a { color: #f0e4dc; }
.alt-not { max-width: 1320px; margin: 44px auto 0; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, .12); font-size: 13px; }
.bildirim { position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 180%); background: var(--espresso); color: #fff; padding: 14px 22px; font-size: 14.5px; z-index: 60; transition: transform .35s; max-width: calc(100vw - 32px); }
.bildirim.acik { transform: translate(-50%, 0); }
.bildirim[data-tur="hata"] { background: #7a2b1b; }

@media (max-width: 1120px) {
  .uzman-izgara { grid-template-columns: repeat(3, 1fr); }
  .menu { gap: 18px; }
  .alt-ic { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 900px) {
  .menu { display: none; position: absolute; left: 0; right: 0; top: 100%; flex-direction: column; gap: 0; background: var(--krem); border-bottom: 1px solid var(--cizgi); padding: 8px clamp(18px, 4vw, 56px) 18px; }
  .menu.acik { display: flex; }
  .menu a { padding: 15px 0; font: 400 26px var(--serif); color: var(--espresso); border-bottom: 1px solid var(--cizgi); }
  .menu a[aria-current] { color: var(--gul-koyu); border-bottom-color: var(--cizgi); }
  .menu-dugme { display: inline-flex; }
  .ust-dugme { margin-left: auto; }
  .kahraman, .menu-izgara, .kat-bolum, .uzman-uzun, .hediye-bant, .ziyaret, .sayfa-bas, .randevu, .hediye { grid-template-columns: minmax(0, 1fr); }
  .kahraman > *, .uzman-uzun > *, .kat-bolum > *, .hediye-bant > *, .ziyaret > * { min-width: 0; }
  .kolaj { max-width: 560px; width: 100%; margin: 0 auto; }
  .kat-bolum .gorsel { aspect-ratio: 16 / 10; }
  .uzman-uzun:nth-child(even) .foto { order: 0; }
  .uzman-uzun .foto { max-width: 460px; }
  .yorumlar { grid-template-columns: 1fr; }
  .lookbook { columns: 2; }
  .sepet, .hediye .kart-onizleme { position: relative; top: 0; }
  .kat-sekme { top: 77px; }
}
@media (max-width: 600px) {
  .duyuru { font-size: 12.5px; }
  .ust { gap: 10px; padding: 12px 16px; }
  .logo b { font-size: 29px; }
  .logo span { display: none; }
  .ust-dugme { padding: 10px 16px; }
  .kahraman { padding-top: 28px; }
  .rozet { width: 92px; height: 92px; font-size: 14px; right: 0; }
  .bolum-ust { grid-template-columns: 1fr; }
  .uzman-izgara { grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .uzman h3 { font-size: 20px; }
  .fiyat-liste li { grid-template-columns: 1fr auto; }
  .nokta-cizgi { display: none; }
  .lookbook { columns: 1; }
  .alt-ic { grid-template-columns: 1fr; }
  .ikili { grid-template-columns: 1fr; }
  .tutar-sec { grid-template-columns: repeat(2, 1fr); }
  .adim > legend { font-size: 27px; flex-wrap: wrap; }
  .adim > legend small { margin-left: 0; width: 100%; }
  .h-sec { grid-template-columns: 26px 1fr; padding: 14px; }
  .h-sec em { grid-column: 2; text-align: left; }
  .h-sec em span { display: inline; margin-left: 8px; }
  .u-liste { grid-template-columns: repeat(2, 1fr); }
  .kat-sekme { top: 71px; }
  .ziyaret iframe { min-height: 300px; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; scroll-behavior: auto !important; } .bant div { animation: none; } }
`;

const DOLULUK = String.raw`/* Sunucu fonksiyonu: bir günün dolu zaman aralıklarını uzman başına döndürür (GET /api/doluluk?gun=2026-11-12).
 * "randevular" tablosu ziyaretçiye kapalıdır; burada yalnız uzman adı ve başlangıç ile bitiş dakikası döner, müşteri bilgisi dönmez. */
export default async function (istek, vayra) {
  var gun = String((istek.sorgu && istek.sorgu.gun) || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(gun)) return { durum: 400, govde: { hata: "Gün YYYY-AA-GG biçiminde olmalı." } };
  var kayitlar = await vayra.veri.liste("randevular", { gun: gun, sinir: 1000 });
  var dolu = {};
  kayitlar.forEach(function (r) {
    if (r.durum === "İptal" || !r.saat || !r.uzman) return;
    var p = String(r.saat).split(":"), bas = Number(p[0]) * 60 + Number(p[1] || 0), sure = Number(r.sure) || 60;
    (dolu[r.uzman] = dolu[r.uzman] || []).push([bas, bas + sure]);
  });
  return { durum: 200, basliklar: { "Cache-Control": "no-store" }, govde: { gun: gun, dolu: dolu } };
}
`;

const UYGULAMA = ORTAK_JS + String.raw`
/* ── Lâl Saç ve Güzellik ──
 * Randevu "randevular" tablosuna yazılır (ziyaretçi ekler, okuyamaz). Dolu aralıklar api/doluluk.js fonksiyonundan uzman başına
 * gelir; fonksiyon müşteri bilgisi döndürmez. Hizmetler, uzmanlar ve çalışma saatleri aşağıda. */
var HIZMETLER = ${JSON.stringify(HIZMETLER.map(({ id, kat, ad, sure, fiyat, uzmanlar }) => ({ id, kat, ad, sure, fiyat, uzmanlar })))};
var KATEGORILER = ${JSON.stringify(KATEGORILER.map(({ id, ad }) => ({ id, ad })))};
var UZMANLAR = ${JSON.stringify(UZMANLAR.map(({ id, ad, unvan, foto, gunler }) => ({ id, ad, unvan, foto, gunler })))};
var SAATLER = ${JSON.stringify(SAATLER)};
var GUN_AD = ${JSON.stringify(GUN_AD)};
var GUN_KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
var SAYFA = document.body.dataset.sayfa;
function saatYaz(s) { return String(s || "").replace(":", "."); }
function para(n) { return Number(n || 0).toLocaleString("tr-TR") + " TL"; }

/* Çalışma saatleri listesinde bugünü işaretle. */
$$(".saat-liste li").forEach(function (li) { if (Number(li.dataset.gun) === istanbul().gun) li.classList.add("bugun"); });

/* Lookbook: büyütülmüş görünüm. */
if (SAYFA === "galeri") {
  var pen = $("#lbPencere");
  $$(".lb").forEach(function (b) {
    b.addEventListener("click", function () {
      var img = b.querySelector("img");
      $("#lbGorsel").src = img.getAttribute("src"); $("#lbGorsel").alt = img.alt;
      $("#lbYazi").innerHTML = "<b>" + kacir(b.dataset.ad) + "</b>" + kacir(b.dataset.alt);
      if (pen.showModal) pen.showModal(); else pen.setAttribute("open", "");
    });
  });
  $("#lbKapat").addEventListener("click", function () { pen.close(); });
  pen.addEventListener("click", function (e) { if (e.target === pen) pen.close(); });
}

/* Hediye kartı: canlı önizleme. */
if (SAYFA === "hediye-karti") {
  var hf = $("#hediyeForm");
  function onizle() {
    var f = new FormData(hf), t = f.get("tutar") || "";
    $("#onTutar").textContent = t === "Hizmet hediyesi" ? "Hizmet" : t;
    $("#onKime").textContent = (String(f.get("alici") || "").trim() || "Sevdiğin birine") + ",";
    $("#onMesaj").textContent = String(f.get("mesaj") || "").trim() || "Kendine ayıracağın güzel bir saat için.";
    $("#onKimden").textContent = String(f.get("gonderen") || "").trim() ? "Sevgiyle, " + String(f.get("gonderen")).trim() : "Sevgiyle";
    $("#hizmetAlan").hidden = t !== "Hizmet hediyesi";
  }
  hf.addEventListener("input", onizle); hf.addEventListener("change", onizle); onizle();
}

/* Kodsuz formlar: Vayra köprüsü yoksa (şablon galerisi) gönderimi durdurup bilgi ver. */
$$("form[data-vayra-form]").forEach(function (f) {
  f.addEventListener("submit", function (e) {
    if (e.defaultPrevented) { olay("form_gonderildi", { form: f.getAttribute("data-vayra-form") }); return; }
    e.preventDefault();
    bildir("Bu canlı önizlemede form gönderilmez; şablonu kullanınca talepler gelen kutuna düşer.");
  });
});

if (SAYFA === "randevu") {
  var q = new URLSearchParams(location.search);
  var sec = { hizmetler: [], uzman: "fark", gun: null, saat: null, kat: KATEGORILER[0].id }, doluluk = {}, istekNo = 0;
  if (q.get("hizmet")) q.get("hizmet").split(",").forEach(function (id) { var h = HIZMETLER.find(function (x) { return x.id === id; }); if (h && sec.hizmetler.indexOf(id) < 0) { sec.hizmetler.push(id); sec.kat = h.kat; } });
  var istenenUzman = UZMANLAR.find(function (u) { return u.id === q.get("uzman"); });
  if (istenenUzman) sec.uzman = istenenUzman.id;

  function secilenler() { return sec.hizmetler.map(function (id) { return HIZMETLER.find(function (h) { return h.id === id; }); }).filter(Boolean); }
  function toplamSure() { return secilenler().reduce(function (a, h) { return a + h.sure; }, 0); }
  function toplamTutar() { return secilenler().reduce(function (a, h) { return a + h.fiyat; }, 0); }
  /** Seçilen hizmetlerin hepsini yapan uzmanlar. */
  function yetkinler() { var l = secilenler(); return UZMANLAR.filter(function (u) { return l.length && l.every(function (h) { return h.uzmanlar.indexOf(u.id) >= 0; }); }); }
  function uzmanBul(id) { return UZMANLAR.find(function (u) { return u.id === id; }); }
  /** O gün çalışan, seçime uyan uzmanlar. */
  function gunUzmanlari(tarih) { var g = haftaGunu(tarih); return yetkinler().filter(function (u) { return u.gunler.indexOf(g) >= 0 && (sec.uzman === "fark" || u.id === sec.uzman); }); }
  function musait(u, bas, sure) { return !(doluluk[u.ad] || []).some(function (a) { return bas < a[1] && bas + sure > a[0]; }); }

  function katlariCiz() {
    $("#katlar").innerHTML = KATEGORILER.map(function (k) {
      var n = secilenler().filter(function (h) { return h.kat === k.id; }).length;
      return '<button type="button" class="kat-cip" data-kat="' + k.id + '" aria-pressed="' + (sec.kat === k.id) + '">' + kacir(k.ad) + (n ? "<b>" + n + "</b>" : "") + "</button>";
    }).join("");
    $("#hizmetler").innerHTML = HIZMETLER.filter(function (h) { return h.kat === sec.kat; }).map(function (h) {
      var s = sec.hizmetler.indexOf(h.id) >= 0;
      return '<button type="button" class="h-sec" data-hizmet="' + h.id + '" aria-pressed="' + s + '"><span class="kutucuk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg></span><span><strong>' + kacir(h.ad) + "</strong><small>" + h.uzmanlar.map(function (id) { return uzmanBul(id).ad.split(" ")[0]; }).join(", ") + "</small></span><em>" + para(h.fiyat) + "'den<span>" + h.sure + " dakika</span></em></button>";
    }).join("");
  }
  function uzmanlariCiz() {
    var y = yetkinler();
    if (!sec.hizmetler.length) { $("#uzmanlar").innerHTML = '<p class="bilgi-not">Önce en az bir hizmet seç; o hizmetleri yapan uzmanlar burada görünür.</p>'; return; }
    if (!y.length) { sec.uzman = "fark"; $("#uzmanlar").innerHTML = '<p class="bilgi-not"><b>Bu hizmetleri tek bir uzman yapmıyor.</b>Örneğin saç ve tırnak farklı uzmanlarda. Hizmetleri ayrı randevular olarak alabilir ya da 0232 464 18 30 numarasını arayıp birlikte planlayabilirsin.</p>'; return; }
    if (sec.uzman !== "fark" && !y.some(function (u) { return u.id === sec.uzman; })) sec.uzman = "fark";
    $("#uzmanlar").innerHTML = '<div class="u-liste">' + (y.length > 1 ? '<button type="button" class="u-sec" data-uzman="fark" aria-pressed="' + (sec.uzman === "fark") + '"><div class="fark" aria-hidden="true">Lâl</div><span>Fark etmez<small>İlk uygun uzman</small></span></button>' : "")
      + y.map(function (u) { return '<button type="button" class="u-sec" data-uzman="' + u.id + '" aria-pressed="' + (sec.uzman === u.id || y.length === 1) + '"><img src="' + u.foto + '" alt="" loading="lazy" /><span>' + kacir(u.ad) + "<small>" + kacir(u.unvan) + "</small></span></button>"; }).join("") + "</div>";
    if (y.length === 1) sec.uzman = y[0].id;
  }
  function gunleriCiz() {
    var bugun = istanbul().tarih, h = "";
    var uygun = sec.hizmetler.length && yetkinler().length;
    for (var i = 0; i < 14; i++) {
      var t = gunEkle(bugun, i), g = haftaGunu(t), acik = !!uygun && !!SAATLER[g] && gunUzmanlari(t).length > 0;
      if (i === 0 && acik) acik = istanbul().dakika + 60 + toplamSure() <= saatDakika(SAATLER[g][1]);
      h += '<button type="button" class="gun" data-gun="' + t + '" aria-pressed="false"' + (acik ? "" : " disabled") + ' aria-label="' + tarihYaz(t, { weekday: "long" }) + (acik ? "" : ", uygun değil") + '"><small>' + (i === 0 ? "Bugün" : i === 1 ? "Yarın" : GUN_KISA[g]) + "</small><b>" + Number(t.slice(8)) + "</b><small>" + tarihYaz(t, { month: "short", day: undefined }) + "</small></button>";
    }
    $("#gunler").innerHTML = h;
    if (sec.gun && !$('.gun[data-gun="' + sec.gun + '"]:not(:disabled)')) { sec.gun = null; sec.saat = null; }
    if (!sec.gun) { var ilk = $(".gun:not(:disabled)"); sec.gun = ilk ? ilk.dataset.gun : null; }
    $$(".gun").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.gun === sec.gun)); });
    doluluguGetir();
  }
  /** Bir başlangıç için boş uzman (fark etmez seçiliyse ilk boş uzman). */
  function bosUzman(bas) { var s = toplamSure(); return gunUzmanlari(sec.gun).find(function (u) { return musait(u, bas, s); }) || null; }
  function slotlariCiz() {
    var yer = $("#slotlar");
    if (!sec.hizmetler.length) { yer.innerHTML = '<p class="bilgi-not">Hizmet seçince boş saatler burada görünür.</p>'; $("#bosSayi").textContent = ""; return sepetCiz(); }
    if (!sec.gun) { yer.innerHTML = '<p class="bilgi-not">Önümüzdeki iki hafta içinde bu seçime uygun gün yok. Başka bir uzman seç ya da bizi ara.</p>'; $("#bosSayi").textContent = ""; return sepetCiz(); }
    var g = haftaGunu(sec.gun), s = SAATLER[g], sure = toplamSure(), simdi = istanbul(), bos = 0, h = "";
    for (var d = saatDakika(s[0]); d + sure <= saatDakika(s[1]); d += 30) {
      var gecti = sec.gun === simdi.tarih && d < simdi.dakika + 60, dolu = gecti || !bosUzman(d), saat = dakikaSaat(d);
      if (!dolu) bos++;
      if (dolu && sec.saat === saat) sec.saat = null;
      h += '<button type="button" class="slot" data-saat="' + saat + '" aria-pressed="' + (sec.saat === saat) + '"' + (dolu ? ' disabled aria-label="' + saat + ', dolu"' : "") + ">" + saatYaz(saat) + "</button>";
    }
    yer.innerHTML = '<div class="slotlar">' + h + "</div>" + (bos ? "" : '<p class="bilgi-not" style="margin-top:14px">Bu gün için boş saat kalmadı. Başka bir gün seç.</p>');
    $("#bosSayi").textContent = bos ? tarihYaz(sec.gun, { weekday: "long" }) + ", " + bos + " boş başlangıç saati" : "";
    sepetCiz();
  }
  function doluluguGetir() {
    if (!sec.gun) return slotlariCiz();
    var no = ++istekNo;
    if (!fonksiyonVar()) { doluluk = {}; return slotlariCiz(); }
    $("#slotlar").innerHTML = '<p class="bilgi-not">Boş saatler yükleniyor…</p>';
    return fonksiyonOku("doluluk", { gun: sec.gun }).then(function (j) { if (no !== istekNo) return; doluluk = (j && j.dolu) || {}; slotlariCiz(); })
      .catch(function () { if (no !== istekNo) return; doluluk = {}; slotlariCiz(); bildir("Doluluk bilgisi alınamadı; seçtiğin saat gönderirken yeniden denetlenir.", "hata"); });
  }
  function sepetCiz() {
    var l = secilenler(), u = sec.uzman === "fark" ? null : uzmanBul(sec.uzman);
    $("#sepetListe").innerHTML = l.length ? l.map(function (h) { return "<li><span>" + kacir(h.ad) + "</span><span>" + para(h.fiyat) + "</span></li>"; }).join("") : "";
    $("#sepetBos").hidden = !!l.length;
    $("#ozSure").textContent = l.length ? toplamSure() + " dakika" : "Hizmet seçilmedi";
    $("#ozUzman").textContent = u ? u.ad : "İlk uygun uzman";
    $("#ozZaman").textContent = sec.gun && sec.saat ? tarihYaz(sec.gun, { weekday: "long" }) + ", " + saatYaz(sec.saat) + " ile " + saatYaz(dakikaSaat(saatDakika(sec.saat) + toplamSure())) : "Seçilmedi";
    $("#ozTutar").textContent = l.length ? para(toplamTutar()) : "0 TL";
  }
  function hepsiniCiz() { katlariCiz(); uzmanlariCiz(); gunleriCiz(); }

  $("#katlar").addEventListener("click", function (e) { var b = e.target.closest(".kat-cip"); if (!b) return; sec.kat = b.dataset.kat; katlariCiz(); });
  $("#hizmetler").addEventListener("click", function (e) {
    var b = e.target.closest(".h-sec"); if (!b) return;
    var id = b.dataset.hizmet, i = sec.hizmetler.indexOf(id);
    if (i >= 0) sec.hizmetler.splice(i, 1); else sec.hizmetler.push(id);
    sec.saat = null; hepsiniCiz();
  });
  $("#uzmanlar").addEventListener("click", function (e) { var b = e.target.closest(".u-sec"); if (!b) return; sec.uzman = b.dataset.uzman; sec.saat = null; uzmanlariCiz(); gunleriCiz(); });
  $("#gunler").addEventListener("click", function (e) { var b = e.target.closest(".gun"); if (!b || b.disabled) return; sec.gun = b.dataset.gun; sec.saat = null; $$(".gun").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); doluluguGetir(); });
  $("#slotlar").addEventListener("click", function (e) { var b = e.target.closest(".slot"); if (!b || b.disabled) return; sec.saat = b.dataset.saat; $$(".slot").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); sepetCiz(); });
  hepsiniCiz();

  var form = $("#randevuForm"), mesaj = $("#mesaj");
  function goster(tur, baslik, metin) { mesaj.hidden = false; mesaj.className = "mesaj " + tur; mesaj.innerHTML = "<b>" + kacir(baslik) + "</b>" + kacir(metin || ""); mesaj.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  form.addEventListener("submit", function (e) {
    e.preventDefault(); mesaj.hidden = true;
    if (!sec.hizmetler.length) { $("#katlar").scrollIntoView({ block: "center", behavior: "smooth" }); return goster("hata", "Hizmet seç.", "Listeden en az bir hizmete dokun."); }
    if (!yetkinler().length) return goster("hata", "Bu hizmetler tek randevuda alınamıyor.", "Farklı uzmanların hizmetlerini ayrı randevu olarak al.");
    if (!sec.gun || !sec.saat) { $("#slotlar").scrollIntoView({ block: "center", behavior: "smooth" }); return goster("hata", "Gün ve saat seç.", "Boş saatlerden birine dokun."); }
    if (!form.reportValidity()) return;
    var f = new FormData(form);
    if (!/^[0-9 +()]{10,17}$/.test(String(f.get("telefon")).trim())) return goster("hata", "Telefon numarası geçersiz.", "0532 123 45 67 biçiminde yaz.");
    if (!veriVar()) return goster("bilgi", "Bu canlı önizlemede randevu kaydedilmez.", "Şablonu kullanınca randevular veritabanındaki randevular tablosuna düşer.");
    var d = $("#gonder"); d.disabled = true; d.textContent = "Gönderiliyor…";
    var bas = saatDakika(sec.saat), sure = toplamSure();
    // Göndermeden hemen önce yeniden denetle: saat az önce dolmuş olabilir.
    var denetim = fonksiyonVar() ? fonksiyonOku("doluluk", { gun: sec.gun }).then(function (j) { doluluk = (j && j.dolu) || {}; }).catch(function () {}) : Promise.resolve();
    var kayit;
    denetim.then(function () {
      var u = bosUzman(bas);
      if (!u) { slotlariCiz(); throw new Error("DOLU"); }
      kayit = { ad: String(f.get("ad")).trim(), telefon: String(f.get("telefon")).trim(), eposta: String(f.get("eposta") || "").trim() || null, hizmetler: secilenler().map(function (h) { return h.ad; }).join(", "), sure: sure, tutar: toplamTutar(), uzman: u.ad, gun: sec.gun, saat: sec.saat, bitis: dakikaSaat(bas + sure), not: String(f.get("not") || "").trim() || null, ilkZiyaret: f.get("ilk") === "on", kvkk: true };
      return vayra.veri.ekle("randevular", kayit);
    }).then(function () {
      olay("salon_randevusu", { hizmet: sec.hizmetler.length, sure: sure });
      basari(kayit);
    }).catch(function (err) {
      if (err && err.message === "DOLU") goster("hata", "Bu saat az önce doldu.", "Boş saatleri yeniledik; başka bir saat seç.");
      else goster("hata", "Randevu gönderilemedi.", (err && err.message ? err.message + ". " : "") + "Yeniden dene ya da 0232 464 18 30 numarasını ara.");
    }).finally(function () { d.disabled = false; d.textContent = "Randevumu onayla"; });
  });

  function basari(k) {
    $("#icerik").innerHTML = '<section class="kapsayici"><div class="basari" role="status"><p class="ust-not">Görüşmek üzere</p><h1>Randevun <em>hazır</em></h1><p>Randevundan bir gün önce kısa bir hatırlatma mesajı göndereceğiz. Değişiklik için 0232 464 18 30 numarasını araman yeterli.</p>'
      + "<dl><dt>Hizmetler</dt><dd>" + kacir(k.hizmetler) + "</dd><dt>Uzman</dt><dd>" + kacir(k.uzman) + "</dd><dt>Zaman</dt><dd>" + kacir(tarihYaz(k.gun, { weekday: "long", year: "numeric" })) + ", " + saatYaz(k.saat) + " ile " + saatYaz(k.bitis) + "</dd><dt>Başlangıç tutarı</dt><dd>" + para(k.tutar) + "</dd></dl>"
      + '<div class="eylemler"><button class="dugme" id="takvim" type="button">Takvimime ekle</button><a class="dugme ikincil" href="index.html">Ana sayfa</a></div></div></section>';
    window.scrollTo(0, 0);
    $("#takvim").addEventListener("click", function () {
      var t = k.gun.replace(/-/g, ""), s1 = k.saat.replace(":", "") + "00", s2 = k.bitis.replace(":", "") + "00";
      var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Lal Sac ve Guzellik//Randevu//TR", "BEGIN:VEVENT", "UID:" + Date.now() + "@lalsacguzellik.com", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z", "DTSTART;TZID=Europe/Istanbul:" + t + "T" + s1, "DTEND;TZID=Europe/Istanbul:" + t + "T" + s2, "SUMMARY:Lâl Saç ve Güzellik: " + k.hizmetler, "LOCATION:Kıbrıs Şehitleri Cad. No: 74\\, Alsancak\\, Konak / İzmir", "DESCRIPTION:Uzman: " + k.uzman + ". Değişiklik için 0232 464 18 30", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = "lal-randevu.ics"; document.body.appendChild(a); a.click(); a.remove();
    });
  }
}
`;

const BANT = ["Balyaj", "Kesim ve fön", "Keratin", "Gelin saçı", "Kirpik lifting", "Kalıcı oje", "Topuz", "Saç botoksu"];

export const KUAFOR_SALONU = {
  id: "kuafor-salonu",
  ad: "Lâl · Saç ve Güzellik",
  tur: "site" as const,
  aciklama: "Alsancak'ta kuaför ve güzellik salonu: fiyatlı hizmet menüsü, uzmanlar, çok hizmetli online randevu ve dolu saatler, lookbook ve hediye kartı",
  kapak: "/gercek/build/sablon/kuafor-salonu.webp",
  tablolar: TABLOLAR,
  dosyalar: {
    "index.html": sayfa("index.html", "Lâl Saç ve Güzellik · Alsancak, İzmir", "Alsancak'ta kuaför ve güzellik salonu: kesim, renk, balyaj, bakım, makyaj, tırnak ve gelin paketleri. Online randevu.", `<section class="kapsayici kahraman">
  <div>
    <p class="ust-not">Alsancak, 2012'den beri</p>
    <h1>Saçın, <em>senin</em> imzan.</h1>
    <p class="giris">Kesimden balyaja, gelin saçından kalıcı ojeye. Beş uzmanla, acele etmeden ve önce seni dinleyerek çalışıyoruz.</p>
    <div class="eylemler"><a class="dugme" href="randevu.html">Online randevu al</a><a class="ok-baglanti" href="hizmetler.html">Hizmet ve fiyatlar <svg width="22" height="12" viewBox="0 0 22 12" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M0 6h20M15 1l5 5-5 5"/></svg></a></div>
  </div>
  <div class="kolaj">
    <figure class="k1"><img src="/gercek/paz/av-valentina.webp" alt="Bakır tonlarında dalgalı saç" /></figure>
    <figure class="k2"><img src="/gercek/havuz/gorsel/mk-moda-52055.webp" alt="Göz makyajı yapılan bir müşteri" /></figure>
    <figure class="k3"><img src="/gercek/paz/av-zara.webp" alt="Gümüş tonlarında dalgalı saç" /></figure>
    <div class="rozet">Ayın rengi: bakır</div>
  </div>
</section>
<div class="bant" aria-hidden="true"><div>${[...BANT, ...BANT].map((b) => `<span>${b}</span>`).join("")}</div></div>
<section class="kapsayici bolum">
  <div class="bolum-ust"><div><span class="sayi">Hizmet menüsü</span><h2>Her saça, <em>kendi zamanı.</em></h2><p>Fiyatlar başlangıç fiyatıdır. Uzun ve yoğun saçlarda renk ve bakım fiyatı salonda, saçına bakarak netleşir.</p></div><a class="dugme ikincil" href="hizmetler.html">Bütün menü</a></div>
  <div class="menu-izgara">
${["kesim", "renk", "bakim", "makyaj"].map((k) => `    <div class="kat-blok"><h3>${kat(k).ad}<small>${HIZMETLER.filter((h) => h.kat === k).length} hizmet</small></h3><ul class="fiyat-liste">${HIZMETLER.filter((h) => h.kat === k).slice(0, 3).map(hizmetSatiri).join("")}</ul></div>`).join("\n")}
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-ust"><div><span class="sayi">Ekip</span><h2>Ellerine <em>güvenebileceğin</em> beş uzman.</h2></div><a class="dugme ikincil" href="ekip.html">Ekibi tanı</a></div>
  <div class="uzman-izgara">
${UZMANLAR.map(uzmanKarti).join("\n")}
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-ust"><div><span class="sayi">Müşterilerimizden</span><h2>Aynada <em>gülümseyerek</em> çıkanlar.</h2></div><a class="dugme ikincil" href="galeri.html">Lookbook</a></div>
  <div class="yorumlar">
${YORUMLAR.map((y) => `    <figure class="yorum">${YILDIZ}<p>${y.metin}</p><footer><b>${y.ad}</b>${y.hizmet}</footer></figure>`).join("\n")}
  </div>
</section>
<section class="kapsayici" style="padding-bottom:clamp(64px,9vw,120px)">
  <div class="hediye-bant">
    <div><h2>Bir saatlik <em>güzellik</em> hediye et.</h2><p>Dilediğin tutarda ya da bir hizmet için hediye kartı. Zarflı kart salondan, dijital kart e-postayla gider; bir yıl geçerlidir.</p><a class="dugme" href="hediye-karti.html">Hediye kartı hazırla</a></div>
    <div class="kart-onizleme" aria-hidden="true"><div class="ust-satir"><span class="marka">Lâl</span><span class="tutar">2.500 TL</span></div><div><p class="kime">Canım Elif,</p><p class="mesaj-on">Doğum günün kutlu olsun; bu sefer sıra sende.</p></div><p class="alt-satir"><span>Hediye kartı</span><span>Sevgiyle, Deniz</span></p></div>
  </div>
</section>
<section class="kapsayici" style="padding-bottom:16px">
  <div class="ziyaret">
    <div class="kutu">
      <h2>Bizi <em>ziyaret</em> et</h2>
      <p>Kıbrıs Şehitleri Caddesi No: 74, Kat 1, Alsancak. Alsancak garına beş dakika yürüme; Gazi Kadınlar Sokağı'nda otopark var.</p>
      <ul class="saat-liste">
${[2, 3, 4, 5, 6, 0, 1].map((g) => `        <li data-gun="${g}"><span>${GUN_AD[g]}</span><span>${SAATLER[g] ? `${SAATLER[g]![0].replace(":", ".")} ile ${SAATLER[g]![1].replace(":", ".")}` : "Kapalı"}</span></li>`).join("\n")}
      </ul>
      <a class="dugme" href="randevu.html">Randevu al</a>
    </div>
    <iframe title="Lâl Saç ve Güzellik harita konumu" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=27.1370%2C38.4330%2C27.1490%2C38.4410&amp;layer=mapnik&amp;marker=38.4371%2C27.1431"></iframe>
  </div>
</section>`),
    "hizmetler.html": sayfa("hizmetler.html", "Hizmetler ve fiyatlar · Lâl Saç ve Güzellik", "Kesim, renk, balyaj, bakım, makyaj, tırnak ve gelin paketleri: süreler ve başlangıç fiyatları.", `<section class="kapsayici sayfa-bas">
  <h1>Hizmetler <em>ve fiyatlar</em></h1>
  <p>Süreler ortalamadır. Fiyatlar başlangıç fiyatıdır; renk ve bakımda saç boyuna göre salonda netleşir, sürpriz olmaz.</p>
</section>
<div class="kapsayici"><nav class="kat-sekme" aria-label="Kategoriler">${KATEGORILER.map((k) => `<a href="#${k.id}">${k.ad}</a>`).join("")}</nav></div>
<section class="kapsayici">
${KATEGORILER.map((k) => `  <article class="kat-bolum" id="${k.id}">
    <div class="gorsel"><img src="${k.gorsel}" alt="" loading="lazy" /></div>
    <div>
      <h2>${k.ad}</h2>
      <p>${k.aciklama}</p>
      <ul class="fiyat-liste">${HIZMETLER.filter((h) => h.kat === k.id).map(hizmetSatiri).join("")}</ul>
      <a class="dugme" href="randevu.html?hizmet=${HIZMETLER.find((h) => h.kat === k.id)!.id}">${k.ad.split(" ")[0]} için randevu al</a>
    </div>
  </article>`).join("\n")}
</section>`),
    "ekip.html": sayfa("ekip.html", "Ekip · Lâl Saç ve Güzellik", "Lâl Saç ve Güzellik uzmanları: renk ve balyaj, kesim ve gelin saçı, erkek kesim, makyaj, manikür ve pedikür.", `<section class="kapsayici sayfa-bas">
  <h1>Ekip</h1>
  <p>Her uzmanın hangi gün salonda olduğunu görebilir, doğrudan ondan randevu alabilirsin.</p>
</section>
<section class="kapsayici">
${UZMANLAR.map((u) => `  <article class="uzman-uzun" id="${u.id}">
    <div class="foto"><img src="${u.foto}" alt="${u.ad}" loading="lazy" /></div>
    <div>
      <h2>${u.ad}</h2>
      <p class="unvan">${u.unvan}</p>
      <p>${u.hakkinda}</p>
      <div class="uzman-bilgi"><div><b>${u.yil} yıl</b><span>deneyim</span></div><div><b>${HIZMETLER.filter((h) => h.uzmanlar.includes(u.id)).length}</b><span>hizmet</span></div><div><b>${u.gunler.length} gün</b><span>${[2, 3, 4, 5, 6, 0].filter((g) => u.gunler.includes(g)).map((g) => GUN_KISA[g]).join(", ")}</span></div></div>
      <a class="dugme" href="randevu.html?uzman=${u.id}&amp;hizmet=${HIZMETLER.find((h) => h.uzmanlar.includes(u.id))!.id}">${u.ad.split(" ")[0]} ile randevu</a>
    </div>
  </article>`).join("\n")}
</section>`),
    "galeri.html": sayfa("galeri.html", "Lookbook · Lâl Saç ve Güzellik", "Lâl Saç ve Güzellik'ten renk, kesim, makyaj ve gelin çalışmaları.", `<section class="kapsayici sayfa-bas">
  <h1>Look<em>book</em></h1>
  <p>Salondan çıkan son çalışmalar. Beğendiğin bir görünümü randevu notuna yazman yeterli.</p>
</section>
<section class="kapsayici bolum" style="padding-top:48px">
  <div class="lookbook">
${LOOKBOOK.map((l) => `    <button type="button" class="lb${l.genis ? " genis" : ""}" data-ad="${l.ad}" data-alt="${l.hizmet}, ${l.uzman}"><figure style="margin:0"><img src="${l.foto}" alt="${l.ad}: ${l.hizmet}" loading="lazy" /><figcaption><b>${l.ad}</b><span>${l.hizmet}, ${l.uzman}</span></figcaption></figure></button>`).join("\n")}
  </div>
</section>
<section class="kapsayici" style="padding-bottom:24px">
  <div class="bolum-ust"><div><span class="sayi">Yorumlar</span><h2>Müşterilerimiz <em>anlatıyor</em></h2></div><a class="dugme" href="randevu.html">Randevu al</a></div>
  <div class="yorumlar">
${YORUMLAR.map((y) => `    <figure class="yorum">${YILDIZ}<p>${y.metin}</p><footer><b>${y.ad}</b>${y.hizmet}</footer></figure>`).join("\n")}
  </div>
</section>
<dialog class="lb-pencere" id="lbPencere" aria-label="Büyük görsel"><img id="lbGorsel" src="/gercek/paz/av-valentina.webp" alt="" /><p id="lbYazi"></p><button class="lb-kapat" id="lbKapat" type="button" aria-label="Kapat">×</button></dialog>`),
    "randevu.html": sayfa("randevu.html", "Online randevu · Lâl Saç ve Güzellik", "Lâl Saç ve Güzellik'te hizmet, uzman, gün ve saat seçerek online randevu al.", `<section class="kapsayici sayfa-bas">
  <h1>Online <em>randevu</em></h1>
  <p>Bir ya da birkaç hizmet seç; süreler toplanır, yalnız o hizmetlerin hepsini yapan uzmanlar ve onların boş saatleri görünür.</p>
</section>
<section class="kapsayici randevu">
  <form id="randevuForm" novalidate>
    <fieldset class="adim">
      <legend><i>01</i>Hizmetler<small>Birden çok seçebilirsin</small></legend>
      <div class="kat-cipler" id="katlar" role="group" aria-label="Kategori"></div>
      <div class="h-liste" id="hizmetler"></div>
    </fieldset>
    <fieldset class="adim">
      <legend><i>02</i>Uzman</legend>
      <div id="uzmanlar"></div>
    </fieldset>
    <fieldset class="adim">
      <legend><i>03</i>Gün ve saat</legend>
      <div class="gunler" id="gunler" role="group" aria-label="Gün seç"></div>
      <div id="slotlar" aria-live="polite"></div>
      <div class="alt-satir"><span id="bosSayi"></span><span>Pazartesi kapalıyız</span></div>
    </fieldset>
    <fieldset class="adim">
      <legend><i>04</i>Bilgilerin</legend>
      <div class="ikili">
        <label class="alan">Ad soyad<input name="ad" required autocomplete="name" minlength="3" /></label>
        <label class="alan">Cep telefonu<input name="telefon" type="tel" required autocomplete="tel" inputmode="tel" placeholder="05xx xxx xx xx" /></label>
      </div>
      <label class="alan" style="margin-top:16px">E-posta (isteğe bağlı)<input name="eposta" type="email" autocomplete="email" inputmode="email" /></label>
      <label class="alan" style="margin-top:16px">Not (isteğe bağlı)<textarea name="not" maxlength="500" placeholder="İstediğin renk, saç boyun ya da lookbook'tan beğendiğin görünüm"></textarea></label>
      <label class="onay"><input type="checkbox" name="ilk" /><span>Salona ilk kez geliyorum.</span></label>
      <label class="onay"><input type="checkbox" name="kvkk" required /><span>Bilgilerimin yalnız randevum ve hatırlatma mesajı için işlenmesini kabul ediyorum.</span></label>
      <div id="mesaj" class="mesaj" role="alert" hidden></div>
    </fieldset>
  </form>
  <aside class="sepet" aria-labelledby="sepetBaslik">
    <h2 id="sepetBaslik">Randevun</h2>
    <ul id="sepetListe"></ul>
    <p class="bos-sepet" id="sepetBos">Henüz hizmet seçmedin.</p>
    <dl><dt>Toplam süre</dt><dd id="ozSure">Hizmet seçilmedi</dd><dt>Uzman</dt><dd id="ozUzman">İlk uygun uzman</dd><dt>Zaman</dt><dd id="ozZaman">Seçilmedi</dd><dt>Başlangıç tutarı</dt><dd class="toplam" id="ozTutar">0 TL</dd></dl>
    <button class="dugme gul" id="gonder" type="submit" form="randevuForm">Randevumu onayla</button>
    <p>Ödeme salonda. Gelemeyeceksen en geç bir gün önce haber ver.</p>
  </aside>
</section>`),
    "hediye-karti.html": sayfa("hediye-karti.html", "Hediye kartı · Lâl Saç ve Güzellik", "Lâl Saç ve Güzellik hediye kartı: dilediğin tutarda ya da bir hizmet için, zarflı ya da dijital.", `<section class="kapsayici sayfa-bas">
  <h1>Hediye <em>kartı</em></h1>
  <p>Tutarı ve mesajını seç, kartı biz hazırlayalım. Ödeme salonda ya da havaleyle; kart bir yıl geçerlidir.</p>
</section>
<section class="kapsayici hediye">
  <div class="kart-onizleme" aria-live="polite"><div class="ust-satir"><span class="marka">Lâl</span><span class="tutar" id="onTutar">2.500 TL</span></div><div><p class="kime" id="onKime">Sevdiğin birine,</p><p class="mesaj-on" id="onMesaj">Kendine ayıracağın güzel bir saat için.</p></div><p class="alt-satir"><span>Hediye kartı</span><span id="onKimden">Sevgiyle</span></p></div>
  <form class="form-izgara" id="hediyeForm" data-vayra-form="Hediye kartı" data-vayra-tesekkur="Teşekkürler, kartını hazırlayıp bugün içinde seni arayacağız.">
    <h2>Tutar</h2>
    <div class="tutar-sec" role="radiogroup" aria-label="Tutar">
      <label><input type="radio" name="tutar" value="1.000 TL" /><span>1.000 TL</span></label>
      <label><input type="radio" name="tutar" value="2.500 TL" checked /><span>2.500 TL</span></label>
      <label><input type="radio" name="tutar" value="5.000 TL" /><span>5.000 TL</span></label>
      <label><input type="radio" name="tutar" value="Hizmet hediyesi" /><span>Hizmet</span></label>
    </div>
    <label class="alan" id="hizmetAlan" hidden>Hediye edilecek hizmet<select name="hizmet">${HIZMETLER.map((h) => `<option>${h.ad}</option>`).join("")}</select></label>
    <h2>Kart</h2>
    <div class="ikili">
      <label class="alan">Kime<input name="alici" required maxlength="40" placeholder="Elif" /></label>
      <label class="alan">Kimden<input name="gonderen" required maxlength="40" autocomplete="name" placeholder="Deniz" /></label>
    </div>
    <label class="alan">Mesajın<textarea name="mesaj" maxlength="160" placeholder="Doğum günün kutlu olsun; bu sefer sıra sende."></textarea></label>
    <div class="ikili">
      <label class="alan">Teslim<select name="teslim"><option>Zarflı kart, salondan alacağım</option><option>Dijital kart, e-postayla</option></select></label>
      <label class="alan">Telefonun<input name="telefon" type="tel" required inputmode="tel" autocomplete="tel" /></label>
    </div>
    <label class="alan">E-posta (dijital kart için)<input name="eposta" type="email" inputmode="email" autocomplete="email" /></label>
    <button class="dugme" type="submit">Kartımı hazırlayın</button>
  </form>
</section>`),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#2b1f1a"/><text x="32" y="43" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="30" fill="#c9897b">L</text></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
    "api/doluluk.js": DOLULUK,
  },
};
