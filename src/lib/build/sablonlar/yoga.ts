/* Şablon: Nefes Yoga ve Pilates — Cihangir'de yoga ve pilates stüdyosu. Haftalık program "dersler" tablosundan (tür, seviye,
 * eğitmen süzgeçleri ve gün sekmeleri), belirli bir güne ders rezervasyonu "rezervasyonlar" tablosuna (ziyaretçi ekler, okuyamaz),
 * kontenjan api/doluluk.js sunucu fonksiyonuyla kişisel veri döndürmeden denetlenir; paketler, eğitmenler, ilk ders formu. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";

const GUN_AD = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const TURLER = [
  { ad: "Vinyasa", renk: "#c46a4a", kisa: "Nefesle akan, ısıtan ve güçlendiren seri hareketler.", uzun: "Her hareket bir nefese bağlanır; ders boyunca beden ısınır, akış hızlanıp yavaşlar. Güç ve esneklik birlikte gelişir." },
  { ad: "Hatha", renk: "#7d8f73", kisa: "Duruşlarda kalarak hizalanmayı öğrenmek için.", uzun: "Her duruşta birkaç nefes kalınır, hizalanma tek tek anlatılır. Yogaya yeni başlayanlar için en sağlam başlangıç." },
  { ad: "Yin", renk: "#6f7f95", kisa: "Uzun tutulan, derin bağ dokusu esnemeleri.", uzun: "Yerde, destek malzemeleriyle üç ile beş dakika tutulan duruşlar. Günün yorgunluğunu bırakmak için akşam saatlerinde." },
  { ad: "Reformer pilates", renk: "#b08a3e", kisa: "Yaylı aletle, en fazla altı kişilik küçük gruplar.", uzun: "Reformer aletinin yay direnciyle merkez bölge, sırt ve kalça kasları çalışır. Gruplar en fazla altı kişidir, eğitmen her kişiyi tek tek düzeltir." },
  { ad: "Mat pilates", renk: "#5d7a6b", kisa: "Minder üzerinde merkez güç ve duruş çalışması.", uzun: "Alet kullanmadan, beden ağırlığı ve küçük toplarla merkez bölge çalışması. Masa başı çalışanların duruşu için birebir." },
  { ad: "Meditasyon", renk: "#9a7b6b", kisa: "Rehberli nefes ve oturma pratiği.", uzun: "Rehberli nefes çalışmaları ve sessiz oturma. Minder ve battaniye stüdyodan; deneyim gerekmez." },
];
const SEVIYELER = ["Başlangıç", "Orta", "İleri", "Her seviye"];

const EGITMENLER = [
  { id: "defne", ad: "Defne Aras", alan: "Vinyasa ve Yin yoga", foto: "/gercek/paz/av-lily.webp", sertifika: "RYT 500 Yoga Alliance, Rishikesh 2016; Yin yoga eğitmenliği, Lizbon 2019", hakkinda: "Stüdyonun kurucusu. On yıl reklam ajansında çalıştıktan sonra yogaya yöneldi; derslerinde nefesi hareketin önüne koyar. Akşam Yin derslerini canlı müzikle bitirmeyi sever." },
  { id: "nehir", ad: "Nehir Sezer", alan: "Reformer ve mat pilates", foto: "/gercek/paz/av-nia.webp", sertifika: "Fizyoterapi lisansı, Hacettepe 2014; STOTT Pilates tam eğitmenlik", hakkinda: "Fizyoterapist kökenli; bel ve boyun ağrısı yaşayanlarla çalışmayı sever. Reformer derslerinde herkes için ayrı yay ayarı yapar, ilk derste kısa bir duruş değerlendirmesi ister." },
  { id: "pinar", ad: "Pınar Ilgaz", alan: "Hatha yoga ve meditasyon", foto: "/gercek/paz/av-priya.webp", sertifika: "RYT 200 ve hamile yogası eğitmenliği; MBSR farkındalık programı", hakkinda: "Başlangıç derslerinin ve meditasyon programının sorumlusu. Sabırlı ve ayrıntılı anlatımıyla bilinir; hamile yogası için birebir görüşmeleri o yapar." },
  { id: "emre", ad: "Emre Tuna", alan: "Vinyasa ve mat pilates", foto: "/gercek/paz/av-marco.webp", sertifika: "RYT 200, İstanbul 2018; mat pilates eğitmenliği, 2020", hakkinda: "Eski yüzücü; derslerinde güç ve denge öne çıkar. Pazar sabahlarının yavaş akış dersi onun; haftanın en kalabalık dersi." },
];
const E = (id: string) => EGITMENLER.find((e) => e.id === id)!.ad;

type Ders = { id: string; ad: string; tur: string; seviye: string; gun: string; saat: string; sure: number; egitmen: string; kontenjan: number; salon: string; aciklama: string };
const D = (gun: number, saat: string, ad: string, tur: string, seviye: string, sure: number, egitmen: string, aciklama: string): Ders => {
  const reformer = tur === "Reformer pilates";
  return { id: `d${gun}-${saat.replace(":", "")}`, ad, tur, seviye, gun: GUN_AD[gun], saat, sure, egitmen: E(egitmen), kontenjan: reformer ? 6 : tur === "Meditasyon" ? 18 : tur === "Mat pilates" ? 12 : 14, salon: reformer ? "Reformer odası" : "Büyük salon", aciklama };
};
const DERSLER: Ders[] = [
  D(1, "07:30", "Sabah vinyasası", "Vinyasa", "Orta", 60, "defne", "Güne ısınarak başlamak için akıcı bir seri; güneşe selamlarla açılır."),
  D(1, "12:30", "Öğle molası mat pilates", "Mat pilates", "Her seviye", 45, "emre", "Ofisten çıkıp dönmeye yetecek, sırt ve merkez odaklı kısa ders."),
  D(1, "18:00", "Reformer temel", "Reformer pilates", "Başlangıç", 50, "nehir", "Aleti tanımak ve temel hareketleri öğrenmek için."),
  D(1, "19:30", "Akşam hatha", "Hatha", "Her seviye", 75, "pinar", "Duruşlarda kalarak hizalanma ve nefes."),
  D(1, "21:00", "Yin ve gevşeme", "Yin", "Her seviye", 60, "defne", "Uzun tutulan esnemeler ve rehberli gevşemeyle günü kapat."),
  D(2, "07:30", "Sabah reformer", "Reformer pilates", "Orta", 50, "nehir", "Tempolu, tüm bedeni çalıştıran reformer akışı."),
  D(2, "09:30", "Hatha başlangıç", "Hatha", "Başlangıç", 60, "pinar", "Yogaya ilk adım: temel duruşlar ve nefes."),
  D(2, "18:30", "Güçlü vinyasa", "Vinyasa", "İleri", 60, "emre", "Kol dengeleri ve ters duruş hazırlıklarıyla dinamik akış."),
  D(2, "20:00", "Akşam mat pilates", "Mat pilates", "Orta", 50, "nehir", "Küçük topla merkez ve kalça çalışması."),
  D(3, "07:30", "Sabah vinyasası", "Vinyasa", "Orta", 60, "defne", "Güne ısınarak başlamak için akıcı bir seri."),
  D(3, "12:30", "Meditasyon molası", "Meditasyon", "Her seviye", 30, "pinar", "Yarım saatlik rehberli nefes ve sessiz oturma."),
  D(3, "18:00", "Reformer orta", "Reformer pilates", "Orta", 50, "nehir", "Temeli bilenler için daha yoğun yay ayarlarıyla."),
  D(3, "19:30", "Vinyasa akış", "Vinyasa", "Orta", 75, "emre", "Uzun ve müzikli bir akış; sonda derin gevşeme."),
  D(3, "21:00", "Yin ve gevşeme", "Yin", "Her seviye", 60, "defne", "Uzun tutulan esnemeler ve rehberli gevşeme."),
  D(4, "07:30", "Sabah reformer", "Reformer pilates", "Orta", 50, "nehir", "Tempolu, tüm bedeni çalıştıran reformer akışı."),
  D(4, "09:30", "Hatha başlangıç", "Hatha", "Başlangıç", 60, "pinar", "Yogaya ilk adım: temel duruşlar ve nefes."),
  D(4, "18:30", "Mat pilates", "Mat pilates", "Her seviye", 50, "emre", "Duruş, merkez güç ve esneklik."),
  D(4, "20:00", "Akşam hatha", "Hatha", "Her seviye", 75, "pinar", "Duruşlarda kalarak hizalanma ve nefes."),
  D(5, "07:30", "Sabah vinyasası", "Vinyasa", "Orta", 60, "emre", "Haftayı enerjik kapatmak için akıcı bir seri."),
  D(5, "12:30", "Öğle molası mat pilates", "Mat pilates", "Her seviye", 45, "nehir", "Sırt ve merkez odaklı kısa ders."),
  D(5, "18:00", "Reformer temel", "Reformer pilates", "Başlangıç", 50, "nehir", "Aleti tanımak ve temel hareketleri öğrenmek için."),
  D(5, "19:30", "Yin ve ses banyosu", "Yin", "Her seviye", 75, "defne", "Yin duruşlarının ardından tibet çanlarıyla ses banyosu."),
  D(6, "09:00", "Hafta sonu vinyasası", "Vinyasa", "Her seviye", 90, "defne", "Uzun, keyifli bir akış; seviyene göre seçenekli."),
  D(6, "11:00", "Cumartesi reformer", "Reformer pilates", "Orta", 50, "nehir", "Tempolu, tüm bedeni çalıştıran reformer akışı."),
  D(6, "12:30", "Başlangıç atölyesi", "Hatha", "Başlangıç", 90, "pinar", "Yeni başlayanlar için duruşları tek tek anlatan uzun ders."),
  D(6, "17:00", "Gün batımı meditasyonu", "Meditasyon", "Her seviye", 45, "pinar", "Terasta, hava uygunsa açık havada."),
  D(0, "10:00", "Pazar yavaş akış", "Vinyasa", "Her seviye", 75, "emre", "Acele etmeden, nefesle uzun bir akış."),
  D(0, "11:30", "Pazar reformer", "Reformer pilates", "Her seviye", 50, "nehir", "Haftanın en sakin reformer dersi."),
  D(0, "17:30", "Pazar yin", "Yin", "Her seviye", 75, "defne", "Yeni haftaya dinlenmiş başlamak için."),
].sort((a, b) => (GUN_AD.indexOf(a.gun) + 6) % 7 - (GUN_AD.indexOf(b.gun) + 6) % 7 || a.saat.localeCompare(b.saat));
const GUN_KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

const PAKETLER = [
  { ad: "Tek ders", fiyat: "750 TL", alt: "Bütün grup derslerinde", ozellik: ["30 gün içinde kullanılır", "Mat, blok ve kayış stüdyodan"], vurgu: false },
  { ad: "8 ders", fiyat: "5.200 TL", alt: "Ders başı 650 TL", ozellik: ["2 ay geçerli", "Bir kez 2 hafta dondurma", "Yoga ve mat pilates"], vurgu: false },
  { ad: "16 ders", fiyat: "9.200 TL", alt: "Ders başı 575 TL", ozellik: ["4 ay geçerli", "İki kez dondurma", "Bir arkadaşına deneme dersi"], vurgu: true },
  { ad: "Sınırsız aylık", fiyat: "6.900 TL", alt: "30 gün, dilediğin kadar", ozellik: ["Bütün grup dersleri", "Atölyelerde yüzde 20 indirim", "Reformer hariç"], vurgu: false },
];
const REFORMER = [
  { ad: "Reformer tek ders", fiyat: "1.150 TL", alt: "En fazla 6 kişi" },
  { ad: "Reformer 8 ders", fiyat: "8.400 TL", alt: "Ders başı 1.050 TL, 2 ay geçerli" },
  { ad: "Birebir özel ders", fiyat: "2.400 TL", alt: "Reformer ya da yoga, 55 dakika" },
];

const TABLOLAR: Record<string, SablonTablo> = {
  dersler: {
    aciklama: "Haftalık ders programı. Program ve rezervasyon sayfaları bu tablodan okur; aktif olmayan ders gösterilmez.",
    kurallar: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" },
    sema: [
      { ad: "ad", tur: "metin", zorunlu: true, aciklama: "Dersin adı" },
      { ad: "tur", tur: "secim", zorunlu: true, secenekler: TURLER.map((t) => t.ad) },
      { ad: "seviye", tur: "secim", zorunlu: true, secenekler: SEVIYELER },
      { ad: "gun", tur: "secim", zorunlu: true, secenekler: [1, 2, 3, 4, 5, 6, 0].map((g) => GUN_AD[g]) },
      { ad: "saat", tur: "metin", zorunlu: true, aciklama: "SS:DD, başlangıç saati" },
      { ad: "sure", tur: "sayi", zorunlu: true, aciklama: "Dakika" },
      { ad: "egitmen", tur: "secim", zorunlu: true, secenekler: EGITMENLER.map((e) => e.ad) },
      { ad: "kontenjan", tur: "sayi", zorunlu: true, aciklama: "Derse katılabilecek en fazla kişi" },
      { ad: "salon", tur: "secim", secenekler: ["Büyük salon", "Reformer odası", "Teras"] },
      { ad: "aciklama", tur: "uzunMetin" },
      { ad: "aktif", tur: "mantiksal", varsayilan: true },
    ],
    kayitlar: DERSLER.map((d) => ({ ...d, aktif: true })),
  },
  rezervasyonlar: {
    aciklama: "Siteden yapılan ders rezervasyonları. Ziyaretçi ekleyebilir ama okuyamaz; doluluk api/doluluk.js ile kişisel veri olmadan sayılır.",
    kurallar: { okuma: "kapali", ekleme: "herkes", duzenleme: "kapali" },
    sema: [
      { ad: "ad", tur: "metin", zorunlu: true, aciklama: "Katılımcının adı soyadı" },
      { ad: "telefon", tur: "metin", zorunlu: true },
      { ad: "eposta", tur: "eposta" },
      { ad: "dersId", tur: "metin", zorunlu: true, aciklama: "dersler tablosundaki kaydın kimliği" },
      { ad: "ders", tur: "metin", zorunlu: true },
      { ad: "tarih", tur: "metin", zorunlu: true, aciklama: "YYYY-AA-GG" },
      { ad: "saat", tur: "metin", zorunlu: true },
      { ad: "egitmen", tur: "metin" },
      { ad: "paket", tur: "secim", secenekler: ["İlk dersim, ücretsiz", "Paketim var", "Tek ders, stüdyoda öderim"] },
      { ad: "not", tur: "uzunMetin", aciklama: "Sakatlık, hamilelik gibi notlar" },
      { ad: "kvkk", tur: "mantiksal", zorunlu: true },
      { ad: "durum", tur: "secim", secenekler: ["Kayıtlı", "Geldi", "Gelmedi", "İptal"], varsayilan: "Kayıtlı" },
    ],
    kayitlar: [],
  },
};

const MENU = [["index.html", "Stüdyo"], ["program.html", "Program"], ["egitmenler.html", "Eğitmenler"], ["fiyatlar.html", "Fiyatlar"]];
const ust = (aktif: string) => `<a class="atla" href="#icerik">İçeriğe geç</a>
<header class="ust">
  <a class="logo" href="index.html" aria-label="Nefes Yoga ve Pilates ana sayfa"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 24c4-6 8-6 12 0s8 6 12 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="20" cy="13" r="2.6" fill="currentColor"/></svg><span>Nefes<small>yoga ve pilates</small></span></a>
  <nav class="menu" data-menu aria-label="Ana menü">
${MENU.map(([h, a]) => `    <a href="${h}"${h === aktif ? ' aria-current="page"' : ""}>${a}</a>`).join("\n")}
    <a class="menu-cta" href="fiyatlar.html#ilk-ders">İlk ders ücretsiz</a>
  </nav>
  <a class="dugme kucuk ust-dugme" href="rezervasyon.html">Yer ayırt</a>
  <button class="menu-dugme" type="button" data-menu-ac aria-expanded="false" aria-label="Menüyü aç"><span></span><span></span></button>
</header>`;

const alt = `<footer class="alt">
  <div class="alt-ic">
    <div class="alt-marka"><a class="logo" href="index.html"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 24c4-6 8-6 12 0s8 6 12 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="20" cy="13" r="2.6" fill="currentColor"/></svg><span>Nefes<small>yoga ve pilates</small></span></a><p>Cihangir'de, eski bir apartman katında iki salon ve bir teras. Acele etmeden, nefesle.</p></div>
    <div><h4>Adres</h4><p>Akarsu Yokuşu No: 18, Kat 3<br>Firuzağa, Cihangir, Beyoğlu / İstanbul</p><p>Tophane tramvay durağına 7 dakika</p></div>
    <div><h4>Stüdyo saatleri</h4><p>Hafta içi 07.00 ile 22.30</p><p>Cumartesi 08.30 ile 19.00</p><p>Pazar 09.30 ile 19.00</p></div>
    <div><h4>İletişim</h4><p><a href="tel:+902122514790">0212 251 47 90</a></p><p><a href="mailto:merhaba@nefescihangir.com">merhaba@nefescihangir.com</a></p><p><a href="program.html">Haftalık program</a></p></div>
  </div>
  <p class="alt-not">Nefes Yoga ve Pilates Stüdyosu. Derslerimiz tıbbi tedavinin yerini tutmaz; sağlık sorunun varsa önce hekimine danış.</p>
</footer>`;

const sayfa = (dosya: string, baslik: string, aciklama: string, govde: string) => `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${baslik}</title>
  <meta name="description" content="${aciklama}" />
  <meta name="theme-color" content="#f4efe6" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" />
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

const turRenk = (ad: string) => (TURLER.find((t) => t.ad === ad) || TURLER[0]).renk;
const q = (s: string) => encodeURIComponent(s);
const paketKarti = (p: (typeof PAKETLER)[number]) => `<article class="paket${p.vurgu ? " vurgu" : ""}">${p.vurgu ? '<span class="paket-rozet">En çok tercih edilen</span>' : ""}<h3>${p.ad}</h3><p class="fiyat">${p.fiyat}</p><p class="paket-alt">${p.alt}</p><ul>${p.ozellik.map((o) => `<li>${o}</li>`).join("")}</ul><a class="dugme${p.vurgu ? "" : " ikincil"}" href="fiyatlar.html#ilk-ders">Stüdyoya sor</a></article>`;

const STIL = String.raw`/* Nefes Yoga ve Pilates — kum zemin, adaçayı, kiremit vurgu, derin zeytin mürekkep; Instrument Serif ve Instrument Sans. */
:root {
  --kum: #f4efe6; --kum-koyu: #ebe3d5; --kart: #fbf8f2; --murekkep: #2f3527; --soluk: #5f6656; --adacayi: #7d8f73; --adacayi-acik: #e1e6d8;
  --kiremit: #c46a4a; --kiremit-koyu: #a9553a; --cizgi: rgba(47, 53, 39, .14); --yaricap: 26px;
  --serif: "Instrument Serif", Georgia, serif; --sans: "Instrument Sans", system-ui, sans-serif;
}
[hidden] { display: none !important; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--kum); color: var(--murekkep); font: 16px/1.65 var(--sans); -webkit-font-smoothing: antialiased; }
img, svg, video { display: block; max-width: 100%; }
a { color: inherit; }
h1, h2, h3 { font-family: var(--serif); font-weight: 400; line-height: 1.02; letter-spacing: -.01em; margin: 0; }
h1 em, h2 em, h3 em { font-style: italic; color: var(--kiremit); }
:focus-visible { outline: 2px solid var(--kiremit); outline-offset: 3px; border-radius: 8px; }
.atla { position: absolute; left: -999px; top: 8px; background: var(--murekkep); color: var(--kum); padding: 8px 14px; border-radius: 99px; z-index: 50; }
.atla:focus { left: 12px; }
.kapsayici { max-width: 1280px; margin: 0 auto; padding: 0 clamp(18px, 4vw, 48px); }

/* Üst bar */
.ust { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: 20px; padding: 14px clamp(18px, 4vw, 48px); background: color-mix(in srgb, var(--kum) 90%, transparent); backdrop-filter: blur(14px); }
.logo { display: inline-flex; align-items: center; gap: 11px; text-decoration: none; color: var(--murekkep); }
.logo svg { width: 36px; height: 36px; color: var(--adacayi); flex: none; }
.logo span { font: 400 28px/1 var(--serif); letter-spacing: -.01em; }
.logo small { display: block; font: 500 12px/1.3 var(--sans); color: var(--soluk); letter-spacing: .01em; margin-top: 2px; }
.menu { display: flex; align-items: center; gap: 4px; margin-left: auto; }
.menu a { text-decoration: none; padding: 9px 15px; border-radius: 99px; font-size: 15px; font-weight: 500; color: var(--soluk); }
.menu a:hover { color: var(--murekkep); background: var(--kum-koyu); }
.menu a[aria-current] { color: var(--murekkep); background: var(--adacayi-acik); }
.menu .menu-cta { color: var(--kiremit); }
.menu-dugme { display: none; width: 46px; height: 46px; border: 1px solid var(--cizgi); background: var(--kart); border-radius: 50%; cursor: pointer; flex-direction: column; justify-content: center; align-items: center; gap: 6px; }
.menu-dugme span { width: 18px; height: 1.6px; border-radius: 2px; background: var(--murekkep); }

.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 50px; padding: 13px 26px; border: 0; border-radius: 99px; background: var(--kiremit); color: #fff; font: 600 15px/1 var(--sans); text-decoration: none; cursor: pointer; transition: background .2s, transform .2s; }
.dugme:hover { background: var(--kiremit-koyu); }
.dugme:active { transform: scale(.98); }
.dugme[disabled] { opacity: .5; cursor: not-allowed; }
.dugme.kucuk { min-height: 44px; padding: 10px 20px; font-size: 14px; }
.dugme.ikincil { background: transparent; color: var(--murekkep); box-shadow: inset 0 0 0 1.5px var(--murekkep); }
.dugme.ikincil:hover { background: var(--murekkep); color: var(--kum); }
.dugme.acik { background: var(--kum); color: var(--murekkep); }
.dugme.acik:hover { background: #fff; }
.dugme.cerceve-acik { background: transparent; color: #fff; box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, .7); }
.dugme.cerceve-acik:hover { background: rgba(255, 255, 255, .14); }

/* Kahraman */
.kahraman { position: relative; margin: 6px clamp(10px, 1.6vw, 22px) 0; border-radius: 32px; overflow: hidden; min-height: min(86vh, 780px); display: flex; align-items: flex-end; color: #fbf6ee; background: #6b5a45; }
.kahraman video, .kahraman > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.kahraman::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(30, 26, 18, .05) 30%, rgba(30, 26, 18, .62) 100%); }
.kahraman-ic { position: relative; z-index: 1; width: 100%; display: grid; grid-template-columns: 1.5fr 1fr; gap: 32px; align-items: end; padding: clamp(24px, 5vw, 64px); }
.kahraman .ust-yazi { font: italic 400 22px/1.2 var(--serif); margin: 0 0 14px; color: #f3dccb; }
.kahraman h1 { font-size: clamp(54px, 8.6vw, 132px); line-height: .92; letter-spacing: -.025em; }
.kahraman h1 em { color: #f3c9b1; }
.kahraman-yan p { margin: 0 0 22px; font-size: 17px; color: #efe6d9; max-width: 400px; }
.eylemler { display: flex; flex-wrap: wrap; gap: 10px; }

/* Bugün şeridi */
.bugun { display: grid; grid-template-columns: auto 1fr auto; gap: 24px; align-items: center; margin: 18px clamp(10px, 1.6vw, 22px) 0; padding: 18px clamp(18px, 3vw, 34px); border-radius: 24px; background: var(--kart); border: 1px solid var(--cizgi); }
.bugun h2 { font-size: 30px; }
.bugun-liste { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; min-width: 0; }
.bugun-liste::-webkit-scrollbar { display: none; }
.mini { flex: none; display: flex; align-items: center; gap: 12px; padding: 10px 16px 10px 10px; border-radius: 18px; background: var(--kum); text-decoration: none; min-width: 230px; }
.mini:hover { background: var(--kum-koyu); }
.mini b { font: 400 24px/1 var(--serif); min-width: 64px; text-align: center; }
.mini span { font-size: 14px; line-height: 1.3; }
.mini small { display: block; color: var(--soluk); font-size: 12.5px; }
.bugun-bos { color: var(--soluk); font-size: 15px; margin: 0; }

/* Bölümler */
.bolum { padding-block: clamp(64px, 9vw, 128px); }
.bolum-baslik { display: flex; justify-content: space-between; align-items: end; gap: 24px; flex-wrap: wrap; margin-bottom: clamp(28px, 4vw, 52px); }
.bolum-baslik h2 { font-size: clamp(42px, 6vw, 84px); max-width: 820px; }
.bolum-baslik p { margin: 0; color: var(--soluk); max-width: 420px; font-size: 16.5px; }
.giris-izgara { display: grid; grid-template-columns: 1.25fr 1fr; gap: clamp(28px, 6vw, 96px); align-items: start; }
.giris-izgara h2 { font-size: clamp(36px, 4.6vw, 64px); }
.giris-izgara p { color: var(--soluk); font-size: 17.5px; margin: 0 0 18px; }
.rakamlar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 34px; border-top: 1px solid var(--cizgi); padding-top: 24px; }
.rakamlar b { display: block; font: 400 52px/1 var(--serif); color: var(--adacayi); }
.rakamlar span { font-size: 14px; color: var(--soluk); }

.turler { display: grid; grid-template-columns: .9fr 1.1fr; gap: clamp(28px, 5vw, 72px); align-items: start; }
.turler-gorsel { position: sticky; top: 100px; border-radius: 999px 999px 28px 28px; overflow: hidden; aspect-ratio: 4 / 5; background: var(--kum-koyu); }
.turler-gorsel img { width: 100%; height: 100%; object-fit: cover; }
.tur-liste { list-style: none; margin: 0; padding: 0; counter-reset: t; }
.tur-liste li { border-top: 1px solid var(--cizgi); }
.tur-liste li:last-child { border-bottom: 1px solid var(--cizgi); }
.tur-liste a { display: grid; grid-template-columns: 54px 1fr auto; gap: 16px; align-items: baseline; padding: 24px 4px; text-decoration: none; transition: padding .25s; }
.tur-liste a:hover { padding-left: 14px; }
.tur-liste a::before { counter-increment: t; content: "0" counter(t); font: italic 400 22px var(--serif); color: var(--soluk); }
.tur-liste h3 { font-size: clamp(30px, 3.4vw, 44px); }
.tur-liste p { grid-column: 2; margin: 6px 0 0; color: var(--soluk); font-size: 15.5px; }
.tur-liste .ok { grid-row: 1; grid-column: 3; font-size: 14px; font-weight: 600; color: var(--kiremit); white-space: nowrap; }
.nokta { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 10px; vertical-align: middle; }

.egitmen-izgara { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
.egitmen { text-decoration: none; }
.egitmen .foto { border-radius: 200px 200px 22px 22px; overflow: hidden; aspect-ratio: 3 / 4; background: var(--kum-koyu); }
.egitmen img { width: 100%; height: 100%; object-fit: cover; object-position: top; transition: transform .6s; }
.egitmen:hover img { transform: scale(1.04); }
.egitmen h3 { font-size: 30px; margin-top: 16px; }
.egitmen p { margin: 4px 0 0; color: var(--soluk); font-size: 14.5px; }

.paketler { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.paket { position: relative; display: flex; flex-direction: column; background: var(--kart); border: 1px solid var(--cizgi); border-radius: var(--yaricap); padding: 28px 24px 24px; }
.paket.vurgu { background: var(--murekkep); color: var(--kum); border-color: var(--murekkep); }
.paket-rozet { position: absolute; top: -13px; left: 22px; background: var(--kiremit); color: #fff; font-size: 12.5px; font-weight: 600; padding: 5px 12px; border-radius: 99px; }
.paket h3 { font-size: 30px; }
.paket .fiyat { font: 400 46px/1 var(--serif); margin: 18px 0 4px; }
.paket-alt { margin: 0; font-size: 14px; color: var(--soluk); }
.paket.vurgu .paket-alt { color: #c9cdbd; }
.paket ul { list-style: none; padding: 0; margin: 20px 0 24px; display: grid; gap: 9px; font-size: 14.5px; flex: 1; }
.paket li { display: flex; gap: 10px; }
.paket li::before { content: ""; flex: none; width: 7px; height: 7px; margin-top: 9px; border-radius: 50%; background: var(--adacayi); }
.paket.vurgu li::before { background: var(--kiremit); }
.paket.vurgu .dugme { background: var(--kiremit); }
.reformer-satir { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px; }
.reformer-satir div { border: 1px dashed color-mix(in srgb, var(--murekkep) 30%, transparent); border-radius: 20px; padding: 18px 22px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.reformer-satir b { font: 400 26px/1.1 var(--serif); }
.reformer-satir span { display: block; font-size: 13.5px; color: var(--soluk); }
.reformer-satir strong { font-weight: 600; font-size: 17px; white-space: nowrap; }

.alinti { position: relative; border-radius: 32px; overflow: hidden; margin: 0 clamp(10px, 1.6vw, 22px); color: #f6efe3; min-height: 520px; display: grid; place-items: center; text-align: center; background: #3a4030; }
.alinti img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .55; }
.alinti blockquote { position: relative; margin: 0; padding: 48px clamp(20px, 6vw, 80px); max-width: 980px; }
.alinti p { font: italic 400 clamp(30px, 4.2vw, 56px)/1.1 var(--serif); margin: 0 0 22px; }
.alinti cite { font-style: normal; font-size: 15px; color: #e5dccd; }

.konum { display: grid; grid-template-columns: 1fr 1.2fr; gap: 18px; }
.konum .kutu { background: var(--adacayi); color: #f5f2ea; border-radius: var(--yaricap); padding: clamp(24px, 4vw, 44px); display: flex; flex-direction: column; }
.konum h2 { font-size: clamp(40px, 5vw, 64px); margin-bottom: 14px; }
.konum p { margin: 0 0 8px; color: #edf0e6; }
.konum .saatler { margin: 18px 0 26px; display: grid; gap: 6px; font-size: 15px; }
.konum .saatler div { display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, .22); padding-bottom: 6px; }
.konum iframe { width: 100%; min-height: 420px; height: 100%; border: 0; border-radius: var(--yaricap); background: var(--kum-koyu); }
.konum .kutu .dugme { align-self: flex-start; margin-top: auto; }

/* Sayfa başlıkları */
.sayfa-bas { padding-block: clamp(36px, 6vw, 80px) clamp(24px, 4vw, 40px); display: grid; grid-template-columns: 1.3fr 1fr; gap: 28px; align-items: end; }
.sayfa-bas h1 { font-size: clamp(56px, 9vw, 128px); line-height: .9; letter-spacing: -.025em; }
.sayfa-bas p { margin: 0; color: var(--soluk); font-size: 17px; }

/* Program */
.suzgec { display: grid; gap: 14px; padding: 18px; background: var(--kart); border: 1px solid var(--cizgi); border-radius: var(--yaricap); margin-bottom: 18px; }
.cipler { display: flex; gap: 8px; flex-wrap: wrap; }
.cip { display: inline-flex; align-items: center; gap: 8px; min-height: 42px; padding: 8px 16px; border-radius: 99px; border: 1px solid var(--cizgi); background: transparent; color: var(--murekkep); font: 500 14.5px var(--sans); cursor: pointer; }
.cip:hover { border-color: var(--murekkep); }
.cip[aria-pressed="true"] { background: var(--murekkep); border-color: var(--murekkep); color: var(--kum); }
.cip i { width: 9px; height: 9px; border-radius: 50%; }
.suzgec-alt { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.secim { position: relative; }
.secim select { appearance: none; min-height: 44px; padding: 8px 40px 8px 16px; border-radius: 99px; border: 1px solid var(--cizgi); background: var(--kum) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232f3527' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") right 14px center / 16px no-repeat; color: var(--murekkep); font: 500 14.5px var(--sans); cursor: pointer; }
.sonuc-sayi { margin-left: auto; color: var(--soluk); font-size: 14px; }
.temizle { border: 0; background: none; color: var(--kiremit); font: 600 14px var(--sans); cursor: pointer; padding: 10px 4px; min-height: 44px; }
.gunler { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; margin-bottom: 8px; }
.gun { display: grid; justify-items: center; gap: 0; padding: 12px 6px; border-radius: 20px; border: 1px solid var(--cizgi); background: transparent; color: var(--murekkep); cursor: pointer; font: 500 13px var(--sans); }
.gun b { font: 400 34px/1.05 var(--serif); }
.gun small { color: var(--soluk); font-size: 12px; }
.gun:hover { border-color: var(--murekkep); }
.gun[aria-pressed="true"] { background: var(--adacayi); border-color: var(--adacayi); color: #fff; }
.gun[aria-pressed="true"] small { color: #edf0e6; }
.gun-baslik { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin: 26px 0 6px; flex-wrap: wrap; }
.gun-baslik h2 { font-size: clamp(32px, 4vw, 48px); }
.gun-baslik span { color: var(--soluk); font-size: 14.5px; }
.ders-liste { display: grid; }
.ders { display: grid; grid-template-columns: 110px minmax(0, 1fr) 210px 190px; gap: 20px; align-items: center; padding: 22px 6px; border-bottom: 1px solid var(--cizgi); }
.ders.gecti { opacity: .5; }
.d-saat b { display: block; font: 400 38px/1 var(--serif); }
.d-saat span { font-size: 13.5px; color: var(--soluk); }
.d-govde h3 { font-size: 30px; }
.d-govde p { margin: 4px 0 0; color: var(--soluk); font-size: 14.5px; }
.d-meta { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 8px !important; font-size: 13.5px !important; }
.d-meta span { display: inline-flex; align-items: center; }
.d-egitmen { display: flex; align-items: center; gap: 12px; font-size: 14.5px; font-weight: 500; text-decoration: none; }
.d-egitmen img { width: 46px; height: 46px; border-radius: 50%; object-fit: cover; object-position: top; flex: none; }
.d-yer { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.yer { font-size: 13.5px; font-weight: 600; color: var(--adacayi); }
.yer.az { color: var(--kiremit); }
.yer.dolu { color: var(--soluk); }
.bos { padding: 40px 24px; text-align: center; color: var(--soluk); background: var(--kart); border-radius: var(--yaricap); border: 1px dashed var(--cizgi); }
.bos b { display: block; font: 400 30px/1.1 var(--serif); color: var(--murekkep); margin-bottom: 6px; }

/* Rezervasyon */
.rez > * { min-width: 0; }
.rez { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, .85fr); gap: clamp(20px, 4vw, 48px); align-items: start; padding-bottom: 80px; }
.adim { border: 1px solid var(--cizgi); background: var(--kart); border-radius: var(--yaricap); padding: clamp(18px, 3vw, 28px); margin: 0 0 16px; min-width: 0; }
.adim > legend, .adim > h2 { float: left; width: 100%; padding: 0; margin: 0 0 16px; font: 400 30px/1.1 var(--serif); display: flex; align-items: center; gap: 12px; }
.adim > legend + *, .adim > h2 + * { clear: both; }
.adim > legend span, .adim > h2 span { width: 32px; height: 32px; border-radius: 50%; background: var(--adacayi-acik); color: var(--murekkep); font: 600 14px/32px var(--sans); text-align: center; flex: none; }
.secenekler { display: grid; gap: 10px; margin-top: 16px; }
.secenek { display: grid; grid-template-columns: 74px 1fr auto; gap: 14px; align-items: center; padding: 14px 16px; border-radius: 18px; border: 1.5px solid var(--cizgi); background: var(--kum); cursor: pointer; text-align: left; color: inherit; font: inherit; width: 100%; }
.secenek:hover:not(:disabled) { border-color: var(--murekkep); }
.secenek[aria-pressed="true"] { border-color: var(--kiremit); background: #fbeee7; }
.secenek:disabled { cursor: not-allowed; opacity: .5; }
.secenek b { font: 400 28px/1 var(--serif); }
.secenek strong { display: block; font-weight: 600; font-size: 15.5px; }
.secenek small { color: var(--soluk); font-size: 13px; }
.secenek em { font-style: normal; font-size: 13px; font-weight: 600; color: var(--adacayi); white-space: nowrap; }
.secenek em.az { color: var(--kiremit); }
.ikili { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
label.alan { display: grid; gap: 7px; font-size: 14px; font-weight: 600; }
.alan input, .alan select, .alan textarea { width: 100%; min-height: 50px; padding: 12px 16px; border-radius: 16px; border: 1.5px solid var(--cizgi); background: #fff; color: inherit; font: 400 16px var(--sans); }
.alan textarea { min-height: 96px; resize: vertical; }
.alan input:focus, .alan select:focus, .alan textarea:focus { outline: none; border-color: var(--adacayi); box-shadow: 0 0 0 3px var(--adacayi-acik); }
.paket-sec { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 14px; }
.paket-sec label { position: relative; display: block; cursor: pointer; }
.paket-sec input { position: absolute; opacity: 0; }
.paket-sec span { display: grid; gap: 2px; min-height: 64px; align-content: center; padding: 12px 14px; border-radius: 16px; border: 1.5px solid var(--cizgi); background: #fff; font-size: 14.5px; font-weight: 600; }
.paket-sec small { font-weight: 400; color: var(--soluk); font-size: 12.5px; }
.paket-sec input:checked + span { border-color: var(--kiremit); background: #fbeee7; }
.paket-sec input:focus-visible + span { outline: 2px solid var(--kiremit); outline-offset: 2px; }
.onay { display: flex; gap: 12px; align-items: flex-start; font-size: 14px; color: var(--soluk); margin-top: 14px; }
.onay input { width: 22px; height: 22px; margin-top: 1px; accent-color: var(--adacayi); flex: none; }
.ozet { position: sticky; top: 96px; border-radius: var(--yaricap); overflow: hidden; background: var(--murekkep); color: #dfe2d6; }
.ozet-gorsel { height: 160px; position: relative; }
.ozet-gorsel img { width: 100%; height: 100%; object-fit: cover; opacity: .9; }
.ozet-ic { padding: 24px 26px 26px; }
.ozet h2 { font: 400 34px/1.05 var(--serif); color: #fff; margin-bottom: 18px; }
.ozet dl { margin: 0 0 22px; display: grid; gap: 12px; }
.ozet dt { font-size: 12.5px; color: #a7ad9b; }
.ozet dd { margin: 2px 0 0; color: #fff; font-weight: 600; }
.ozet .dugme { width: 100%; }
.ozet p { font-size: 13px; margin: 14px 0 0; color: #b9bfae; }
.mesaj { border-radius: 16px; padding: 14px 16px; font-size: 14.5px; margin-top: 14px; }
.mesaj b { display: block; }
.mesaj.hata { background: #f8e1d8; color: #7d2f16; }
.mesaj.bilgi { background: #efe6c9; color: #5b4a12; }
.basari { text-align: center; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 32px; padding: clamp(28px, 5vw, 60px); max-width: 680px; margin: clamp(32px, 6vw, 80px) auto; }
.basari .tik { width: 76px; height: 76px; margin: 0 auto 18px; border-radius: 50%; background: var(--adacayi-acik); color: var(--adacayi); display: grid; place-items: center; }
.basari .tik svg { width: 36px; }
.basari h1 { font-size: clamp(40px, 5vw, 60px); margin-bottom: 10px; }
.basari p { color: var(--soluk); }
.basari dl { display: grid; grid-template-columns: auto 1fr; gap: 8px 18px; text-align: left; background: var(--kum); border-radius: 18px; padding: 18px 22px; margin: 22px 0; }
.basari dt { color: var(--soluk); }
.basari dd { margin: 0; font-weight: 600; }
.basari .eylemler { justify-content: center; }

/* Eğitmenler sayfası */
.egitmen-uzun { display: grid; grid-template-columns: 360px 1fr; gap: clamp(24px, 5vw, 64px); padding-block: 40px; border-top: 1px solid var(--cizgi); align-items: start; }
.egitmen-uzun .foto { border-radius: 200px 200px 24px 24px; overflow: hidden; aspect-ratio: 3 / 4; background: var(--kum-koyu); }
.egitmen-uzun img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
.egitmen-uzun h2 { font-size: clamp(44px, 5vw, 72px); }
.egitmen-uzun .alan-ad { font: italic 400 24px var(--serif); color: var(--kiremit); margin: 6px 0 18px; }
.egitmen-uzun p { color: var(--soluk); font-size: 16.5px; max-width: 640px; }
.egitmen-uzun .sertifika { font-size: 14.5px; padding: 14px 18px; border-radius: 16px; background: var(--kart); border: 1px solid var(--cizgi); max-width: 640px; }
.haftalik { list-style: none; padding: 0; margin: 18px 0 24px; display: flex; flex-wrap: wrap; gap: 8px; }
.haftalik li { font-size: 13.5px; padding: 8px 14px; border-radius: 99px; background: var(--kart); border: 1px solid var(--cizgi); }

/* Fiyatlar ve SSS */
.sss { display: grid; gap: 10px; max-width: 900px; }
.sss details { background: var(--kart); border: 1px solid var(--cizgi); border-radius: 20px; padding: 4px 22px; }
.sss summary { cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; gap: 16px; min-height: 60px; font: 400 25px/1.15 var(--serif); }
.sss summary::-webkit-details-marker { display: none; }
.sss summary::after { content: "+"; font: 300 28px var(--sans); color: var(--kiremit); transition: transform .25s; flex: none; }
.sss details[open] summary::after { transform: rotate(45deg); }
.sss p { margin: 0 0 18px; color: var(--soluk); }
.ilk-ders { display: grid; grid-template-columns: 1fr 1.1fr; border-radius: 32px; overflow: hidden; background: var(--murekkep); color: var(--kum); }
.ilk-ders-gorsel { position: relative; min-height: 420px; }
.ilk-ders-gorsel img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.ilk-ders-form { padding: clamp(24px, 5vw, 56px); }
.ilk-ders h2 { font-size: clamp(42px, 5vw, 68px); margin-bottom: 12px; }
.ilk-ders h2 em { color: #f0b89d; }
.ilk-ders-form > p { color: #c9cdbd; margin: 0 0 24px; }
.ilk-ders .alan { color: #eef0e7; }
.ilk-ders .alan input, .ilk-ders .alan select { background: #3b4232; border-color: #535b47; color: #fff; }
.ilk-ders .onay { color: #c9cdbd; }
.ilk-ders .onay a { color: #fff; }
.form-izgara { display: grid; gap: 14px; }

.alt { background: var(--murekkep); color: #c3c8b6; padding: 64px clamp(18px, 4vw, 48px) 28px; margin-top: 72px; }
.alt-ic { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 32px; }
.alt .logo { color: var(--kum); }
.alt .logo small { color: #a7ad9b; }
.alt-marka p { margin-top: 16px; max-width: 320px; }
.alt h4 { color: #fff; margin: 0 0 10px; font: 400 22px var(--serif); }
.alt p { margin: 4px 0; font-size: 14.5px; }
.alt a { color: #eef0e7; }
.alt-not { max-width: 1280px; margin: 40px auto 0; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, .12); font-size: 13px; }
.bildirim { position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 180%); background: var(--murekkep); color: #fff; padding: 13px 22px; border-radius: 99px; font-weight: 500; font-size: 14.5px; z-index: 60; transition: transform .35s; max-width: calc(100vw - 32px); }
.bildirim.acik { transform: translate(-50%, 0); }
.bildirim[data-tur="hata"] { background: #7d2f16; }

@media (max-width: 1100px) {
  .ders { grid-template-columns: 96px minmax(0, 1fr) 180px; }
  .d-egitmen { grid-column: 2; grid-row: 2; }
  .d-yer { grid-column: 3; grid-row: 1 / span 2; }
  .egitmen-izgara, .paketler { grid-template-columns: repeat(2, 1fr); }
  .alt-ic { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 880px) {
  .menu { display: none; position: absolute; left: 12px; right: 12px; top: calc(100% + 6px); flex-direction: column; align-items: stretch; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 22px; padding: 10px; }
  .menu.acik { display: flex; }
  .menu a { padding: 14px 16px; font-size: 17px; }
  .menu-dugme { display: inline-flex; }
  .ust-dugme { margin-left: auto; }
  .kahraman-ic, .giris-izgara, .turler, .konum, .sayfa-bas, .rez, .ilk-ders, .egitmen-uzun { grid-template-columns: 1fr; }
  .kahraman { min-height: 82svh; }
  .turler-gorsel { position: relative; top: 0; max-width: 460px; width: 100%; aspect-ratio: 4 / 3.4; margin: 0 auto; border-radius: 28px; }
  .bugun { grid-template-columns: 1fr; gap: 12px; }
  .ozet { position: static; }
  .reformer-satir { grid-template-columns: 1fr; }
  .egitmen-uzun .foto { max-width: 380px; }
  .ilk-ders-gorsel { min-height: 260px; }
  .gunler { grid-template-columns: none; grid-auto-flow: column; grid-auto-columns: 74px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
  .gunler::-webkit-scrollbar { display: none; }
}
@media (max-width: 600px) {
  .ust { gap: 10px; padding: 12px 16px; }
  .logo span { font-size: 25px; }
  .logo small { display: none; }
  .ust-dugme { padding: 10px 16px; }
  .kahraman { margin: 4px 8px 0; border-radius: 24px; }
  .kahraman-ic { padding: 22px 20px 26px; gap: 18px; }
  .kahraman-yan p { font-size: 16px; }
  .rakamlar b { font-size: 40px; }
  .tur-liste a { grid-template-columns: 40px 1fr; }
  .tur-liste .ok { display: none; }
  .egitmen-izgara { gap: 12px; }
  .egitmen h3 { font-size: 24px; }
  .paketler { grid-template-columns: 1fr; }
  .alt-ic { grid-template-columns: 1fr; }
  .ders { grid-template-columns: 72px minmax(0, 1fr); gap: 6px 14px; padding: 20px 2px; align-items: start; }
  .d-saat b { font-size: 30px; }
  .d-govde h3 { font-size: 25px; }
  .d-egitmen { grid-column: 2; grid-row: auto; font-size: 14px; }
  .d-egitmen img { width: 34px; height: 34px; }
  .d-yer { grid-column: 2; grid-row: auto; flex-direction: row; justify-content: space-between; align-items: center; margin-top: 6px; }
  .ikili, .paket-sec { grid-template-columns: 1fr; }
  .secenek { grid-template-columns: 60px 1fr; }
  .secenek em { grid-column: 2; }
  .secenek b { font-size: 24px; }
  .sonuc-sayi { margin-left: 0; width: 100%; }
  .suzgec { padding: 14px; }
  .cipler { flex-wrap: nowrap; overflow-x: auto; margin: 0 -14px; padding: 0 14px 2px; scrollbar-width: none; }
  .cipler::-webkit-scrollbar { display: none; }
  .cip { flex: none; }
  .suzgec-alt { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .secim select { width: 100%; padding-right: 34px; background-position: right 10px center; font-size: 14px; }
  .temizle, .sonuc-sayi { grid-column: 1 / -1; }
  .alinti { min-height: 440px; margin: 0 8px; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; scroll-behavior: auto !important; } .kahraman video { display: none; } }
`;

const DOLULUK = String.raw`/* Sunucu fonksiyonu: bir tarihteki derslerin kaç kişi dolduğunu döndürür (GET /api/doluluk?tarih=2026-11-12).
 * "rezervasyonlar" tablosu ziyaretçiye kapalıdır; burada yalnız ders kimliği başına sayı döner, ad ya da telefon dönmez. */
export default async function (istek, vayra) {
  var tarih = String((istek.sorgu && istek.sorgu.tarih) || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih)) return { durum: 400, govde: { hata: "Tarih YYYY-AA-GG biçiminde olmalı." } };
  var kayitlar = await vayra.veri.liste("rezervasyonlar", { tarih: tarih, sinir: 1000 });
  var sayilar = {};
  kayitlar.forEach(function (r) {
    if (r.durum === "İptal" || !r.dersId) return;
    sayilar[r.dersId] = (sayilar[r.dersId] || 0) + 1;
  });
  return { durum: 200, basliklar: { "Cache-Control": "no-store" }, govde: { tarih: tarih, sayilar: sayilar } };
}
`;

const UYGULAMA = ORTAK_JS + String.raw`
/* ── Nefes Yoga ve Pilates ──
 * Program "dersler" tablosundan okunur (şablon galerisinde gömülü yedekten). Rezervasyon "rezervasyonlar" tablosuna yazılır
 * (ziyaretçi ekler, okuyamaz). Kaç yer kaldığı api/doluluk.js fonksiyonundan gelir; fonksiyon kişisel veri döndürmez. */
var YEDEK_DERSLER = ${JSON.stringify(DERSLER)};
var EGITMENLER = ${JSON.stringify(EGITMENLER.map(({ id, ad, foto }) => ({ id, ad, foto })))};
var TURLER = ${JSON.stringify(TURLER.map(({ ad, renk }) => ({ ad, renk })))};
var GUN_AD = ${JSON.stringify(GUN_AD)};
var SAYFA = document.body.dataset.sayfa;

function saatYaz(s) { return String(s || "").replace(":", "."); }
function turRenk(t) { var x = TURLER.find(function (y) { return y.ad === t; }); return x ? x.renk : "#7d8f73"; }
function egitmenBul(ad) { return EGITMENLER.find(function (e) { return e.ad === ad; }) || { id: "", ad: ad || "", foto: "" }; }
function gunNo(g) { var i = GUN_AD.indexOf(g); return i < 0 ? Number(g) : i; }

var dersSoz = null;
function dersler() {
  if (!dersSoz) dersSoz = (veriVar() ? vayra.veri.liste("dersler", { sirala: "saat", yon: "artan", sinir: 500 }) : Promise.resolve(YEDEK_DERSLER.slice()))
    .then(function (l) { return l.filter(function (d) { return d.aktif !== false && d.saat; }).sort(function (a, b) { return String(a.saat).localeCompare(String(b.saat)); }); })
    .catch(function () { bildir("Program şu an güncellenemedi; kayıtlı program gösteriliyor.", "hata"); return YEDEK_DERSLER.slice(); });
  return dersSoz;
}
var dolulukOnbellek = {};
function doluluk(tarih, taze) {
  if (!fonksiyonVar()) return Promise.resolve({});
  if (!taze && dolulukOnbellek[tarih]) return dolulukOnbellek[tarih];
  var p = fonksiyonOku("doluluk", { tarih: tarih }).then(function (j) { return (j && j.sayilar) || {}; }).catch(function () { delete dolulukOnbellek[tarih]; return {}; });
  dolulukOnbellek[tarih] = p;
  return p;
}
function gunDersleri(l, tarih) { var g = haftaGunu(tarih); return l.filter(function (d) { return gunNo(d.gun) === g; }); }
function basladi(d, tarih) { var s = istanbul(); return tarih < s.tarih || (tarih === s.tarih && saatDakika(d.saat) <= s.dakika); }
function kalanYer(d, sayilar) { return Math.max(0, Number(d.kontenjan || 0) - Number(sayilar[d.id] || 0)); }
function yerMetni(d, sayilar) {
  var k = kalanYer(d, sayilar);
  if (k <= 0) return { m: "Dolu", c: "dolu" };
  if (!fonksiyonVar()) return { m: d.kontenjan + " kişilik", c: "" };
  return { m: k + " yer kaldı", c: k <= 2 ? "az" : "" };
}
var GUN_KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
function gunEtiketi(t, i) { return i === 0 ? "Bugün" : i === 1 ? "Yarın" : GUN_KISA[haftaGunu(t)]; }
/** Bugünün bütün dersleri bittiyse, dersi olan ilk sonraki gün. */
function ilkUygunGun(l) { var b = istanbul().tarih; for (var i = 0; i < 7; i++) { var t = gunEkle(b, i); if (gunDersleri(l, t).some(function (d) { return !basladi(d, t); })) return t; } return b; }

/* Ana sayfa: bugün kalan dersler (yoksa yarın). */
if (SAYFA === "index") {
  dersler().then(function (l) {
    var bugun = istanbul().tarih, t = bugun, liste = gunDersleri(l, t).filter(function (d) { return !basladi(d, t); });
    if (!liste.length) { t = gunEkle(bugun, 1); liste = gunDersleri(l, t); }
    $("#bugunBaslik").textContent = t === bugun ? "Bugün" : "Yarın";
    return doluluk(t).then(function (s) {
      $("#bugunListe").innerHTML = liste.length ? liste.slice(0, 5).map(function (d) {
        var y = yerMetni(d, s);
        return '<a class="mini" href="rezervasyon.html?ders=' + encodeURIComponent(d.id) + "&tarih=" + t + '"><b>' + saatYaz(d.saat) + "</b><span>" + kacir(d.ad) + "<small>" + kacir(d.egitmen) + ", " + y.m.toLocaleLowerCase("tr-TR") + "</small></span></a>";
      }).join("") : '<p class="bugun-bos">Bugün için ders kalmadı; haftalık programa göz at.</p>';
    });
  });
}

/* Program sayfası: gün sekmeleri ve süzgeçler. */
if (SAYFA === "program") {
  var q = new URLSearchParams(location.search), bugun = istanbul().tarih;
  var sec = { tarih: bugun, tur: q.get("tur") || "", seviye: "", egitmen: "" };
  var hepsi = [];
  var egitmenQ = EGITMENLER.find(function (e) { return e.id === q.get("egitmen"); });
  if (egitmenQ) sec.egitmen = egitmenQ.ad;
  if (q.get("tarih") && /^\d{4}-\d{2}-\d{2}$/.test(q.get("tarih")) && q.get("tarih") >= bugun && q.get("tarih") <= gunEkle(bugun, 6)) sec.tarih = q.get("tarih");

  $("#turCipleri").innerHTML = '<button type="button" class="cip" data-tur="">Hepsi</button>' + TURLER.map(function (t) { return '<button type="button" class="cip" data-tur="' + kacir(t.ad) + '"><i style="background:' + t.renk + '"></i>' + kacir(t.ad) + "</button>"; }).join("");
  $("#egitmenSec").innerHTML = '<option value="">Bütün eğitmenler</option>' + EGITMENLER.map(function (e) { return '<option value="' + kacir(e.ad) + '">' + kacir(e.ad) + "</option>"; }).join("");
  $("#egitmenSec").value = sec.egitmen;

  function gunleriCiz() {
    var h = "";
    for (var i = 0; i < 7; i++) {
      var t = gunEkle(bugun, i);
      h += '<button type="button" class="gun" data-tarih="' + t + '" aria-pressed="' + (t === sec.tarih) + '" aria-label="' + tarihYaz(t, { weekday: "long" }) + '"><small>' + gunEtiketi(t, i) + "</small><b>" + Number(t.slice(8)) + "</b><small>" + tarihYaz(t, { month: "short", day: undefined }) + "</small></button>";
    }
    $("#gunler").innerHTML = h;
  }
  function uyar(d) {
    if (sec.tur && d.tur !== sec.tur) return false;
    if (sec.seviye && d.seviye !== sec.seviye && !(sec.seviye === "Başlangıç" && d.seviye === "Her seviye")) return false;
    if (sec.egitmen && d.egitmen !== sec.egitmen) return false;
    return true;
  }
  function ciz() {
    $$("#turCipleri .cip").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.tur === sec.tur)); });
    $$("#gunler .gun").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.tarih === sec.tarih)); });
    var t = sec.tarih, gunun = gunDersleri(hepsi, t), l = gunun.filter(uyar);
    $("#gunBaslik").textContent = t === bugun ? "Bugün, " + tarihYaz(t) : tarihYaz(t, { weekday: "long" });
    $("#gunOzet").textContent = gunun.length ? l.length + " / " + gunun.length + " ders gösteriliyor" : "";
    $("#sonucSayi").textContent = (sec.tur || sec.seviye || sec.egitmen) ? "Süzgeç açık" : "";
    $("#temizle").hidden = !(sec.tur || sec.seviye || sec.egitmen);
    var yer = $("#dersListe");
    if (!l.length) { yer.innerHTML = '<div class="bos"><b>' + (gunun.length ? "Bu süzgeçlere uyan ders yok" : "Bu gün ders yok") + "</b>" + (gunun.length ? "Süzgeçleri temizle ya da başka bir gün seç." : "Başka bir gün seç.") + "</div>"; return; }
    doluluk(t).then(function (s) {
      if (t !== sec.tarih) return;
      yer.innerHTML = l.map(function (d) {
        var e = egitmenBul(d.egitmen), gecti = basladi(d, t), y = yerMetni(d, s), dolu = y.c === "dolu";
        return '<article class="ders' + (gecti ? " gecti" : "") + '">'
          + '<div class="d-saat"><b>' + saatYaz(d.saat) + "</b><span>" + Number(d.sure || 0) + " dakika</span></div>"
          + '<div class="d-govde"><h3>' + kacir(d.ad) + "</h3>" + (d.aciklama ? "<p>" + kacir(d.aciklama) + "</p>" : "")
          + '<p class="d-meta"><span><i class="nokta" style="background:' + turRenk(d.tur) + '"></i>' + kacir(d.tur) + "</span><span>" + kacir(d.seviye || "") + (d.seviye === "Her seviye" ? "" : " seviye") + "</span><span>" + kacir(d.salon || "") + "</span></p></div>"
          + '<a class="d-egitmen" href="egitmenler.html#' + kacir(e.id) + '">' + (e.foto ? '<img src="' + kacir(e.foto) + '" alt="" loading="lazy" />' : "") + kacir(d.egitmen) + "</a>"
          + '<div class="d-yer">' + (gecti ? '<span class="yer dolu">Ders başladı</span>' : '<span class="yer ' + y.c + '">' + y.m + "</span>" + (dolu ? '<span class="dugme kucuk ikincil" aria-disabled="true">Dolu</span>' : '<a class="dugme kucuk" href="rezervasyon.html?ders=' + encodeURIComponent(d.id) + "&tarih=" + t + '" aria-label="' + kacir(d.ad) + ", " + saatYaz(d.saat) + ' için yer ayırt">Yer ayırt</a>')) + "</div>"
          + "</article>";
      }).join("");
    });
  }
  $("#turCipleri").addEventListener("click", function (e) { var b = e.target.closest(".cip"); if (!b) return; sec.tur = b.dataset.tur; ciz(); });
  $("#gunler").addEventListener("click", function (e) { var b = e.target.closest(".gun"); if (!b) return; sec.tarih = b.dataset.tarih; ciz(); });
  $("#seviyeSec").addEventListener("change", function (e) { sec.seviye = e.target.value; ciz(); });
  $("#egitmenSec").addEventListener("change", function (e) { sec.egitmen = e.target.value; ciz(); });
  $("#temizle").addEventListener("click", function () { sec.tur = ""; sec.seviye = ""; sec.egitmen = ""; $("#seviyeSec").value = ""; $("#egitmenSec").value = ""; ciz(); });
  gunleriCiz();
  $("#dersListe").innerHTML = '<div class="bos">Program yükleniyor…</div>';
  dersler().then(function (l) { hepsi = l; if (!q.get("tarih")) { sec.tarih = ilkUygunGun(l); gunleriCiz(); } ciz(); });
}

/* Rezervasyon: gün, ders, bilgiler. */
if (SAYFA === "rezervasyon") {
  var rq = new URLSearchParams(location.search), rBugun = istanbul().tarih;
  var rs = { tarih: rBugun, ders: null }, rHepsi = [], rSayilar = {}, istekNo = 0;
  if (rq.get("tarih") && /^\d{4}-\d{2}-\d{2}$/.test(rq.get("tarih")) && rq.get("tarih") >= rBugun && rq.get("tarih") <= gunEkle(rBugun, 6)) rs.tarih = rq.get("tarih");
  var istenen = rq.get("ders");
  var form = $("#rezForm"), mesaj = $("#mesaj");

  function rGunler() {
    var h = "";
    for (var i = 0; i < 7; i++) { var t = gunEkle(rBugun, i); h += '<button type="button" class="gun" data-tarih="' + t + '" aria-pressed="' + (t === rs.tarih) + '" aria-label="' + tarihYaz(t, { weekday: "long" }) + '"><small>' + gunEtiketi(t, i) + "</small><b>" + Number(t.slice(8)) + "</b><small>" + tarihYaz(t, { month: "short", day: undefined }) + "</small></button>"; }
    $("#rGunler").innerHTML = h;
  }
  function dersBul(id) { return rHepsi.find(function (d) { return d.id === id; }); }
  function rDersler() {
    var t = rs.tarih, no = ++istekNo;
    $("#rDersler").innerHTML = '<p class="bos">Dersler yükleniyor…</p>';
    doluluk(t, true).then(function (s) {
      if (no !== istekNo) return;
      rSayilar = s;
      var l = gunDersleri(rHepsi, t);
      if (rs.ders && (!dersBul(rs.ders) || gunNo(dersBul(rs.ders).gun) !== haftaGunu(t))) rs.ders = null;
      if (!l.length) { $("#rDersler").innerHTML = '<div class="bos"><b>Bu gün ders yok</b>Başka bir gün seç.</div>'; ozet(); return; }
      $("#rDersler").innerHTML = '<div class="secenekler">' + l.map(function (d) {
        var gecti = basladi(d, t), y = yerMetni(d, s), kapali = gecti || y.c === "dolu";
        if (kapali && rs.ders === d.id) rs.ders = null;
        return '<button type="button" class="secenek" data-ders="' + kacir(d.id) + '" aria-pressed="' + (rs.ders === d.id) + '"' + (kapali ? " disabled" : "") + "><b>" + saatYaz(d.saat) + "</b><span><strong>" + kacir(d.ad) + "</strong><small>" + kacir(d.tur) + ", " + kacir(d.egitmen) + ", " + Number(d.sure || 0) + " dakika</small></span><em class=\"" + y.c + "\">" + (gecti ? "Başladı" : y.m) + "</em></button>";
      }).join("") + "</div>";
      ozet();
    });
  }
  function ozet() {
    var d = rs.ders ? dersBul(rs.ders) : null;
    $("#ozDers").textContent = d ? d.ad : "Seçilmedi";
    $("#ozZaman").textContent = tarihYaz(rs.tarih, { weekday: "long" }) + (d ? ", " + saatYaz(d.saat) + " (" + d.sure + " dakika)" : "");
    $("#ozEgitmen").textContent = d ? d.egitmen : "Dersi seçince görünür";
    $("#ozYer").textContent = d ? yerMetni(d, rSayilar).m : "Dersi seçince görünür";
    var e = d ? egitmenBul(d.egitmen) : null;
    if (e && e.foto) $("#ozFoto").src = e.foto;
  }
  $("#rGunler").addEventListener("click", function (e) { var b = e.target.closest(".gun"); if (!b) return; rs.tarih = b.dataset.tarih; $$("#rGunler .gun").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); rDersler(); });
  $("#rDersler").addEventListener("click", function (e) { var b = e.target.closest(".secenek"); if (!b || b.disabled) return; rs.ders = b.dataset.ders; $$("#rDersler .secenek").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); ozet(); });
  rGunler();
  dersler().then(function (l) {
    rHepsi = l;
    if (!rq.get("tarih")) { rs.tarih = ilkUygunGun(l); rGunler(); }
    var d = istenen && dersBul(istenen);
    if (d) {
      rs.ders = d.id;
      if (gunNo(d.gun) !== haftaGunu(rs.tarih)) { for (var i = 0; i < 7; i++) { var t = gunEkle(rBugun, i); if (haftaGunu(t) === gunNo(d.gun) && !basladi(d, t)) { rs.tarih = t; break; } } rGunler(); }
    }
    rDersler();
  });

  function goster(tur, baslik, metin) { mesaj.hidden = false; mesaj.className = "mesaj " + tur; mesaj.innerHTML = "<b>" + kacir(baslik) + "</b>" + kacir(metin || ""); mesaj.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  form.addEventListener("submit", function (e) {
    e.preventDefault(); mesaj.hidden = true;
    var d = rs.ders ? dersBul(rs.ders) : null;
    if (!d) { $("#rDersler").scrollIntoView({ block: "center", behavior: "smooth" }); return goster("hata", "Bir ders seç.", "Gün seçip listeden derse dokun."); }
    if (!form.reportValidity()) return;
    var f = new FormData(form);
    if (!/^[0-9 +()]{10,17}$/.test(String(f.get("telefon")).trim())) return goster("hata", "Telefon numarası geçersiz.", "0532 123 45 67 biçiminde yaz.");
    var kayit = { ad: String(f.get("ad")).trim(), telefon: String(f.get("telefon")).trim(), eposta: String(f.get("eposta") || "").trim() || null, dersId: d.id, ders: d.ad, tarih: rs.tarih, saat: d.saat, egitmen: d.egitmen, paket: String(f.get("paket") || "Tek ders, stüdyoda öderim"), not: String(f.get("not") || "").trim() || null, kvkk: true };
    if (!veriVar()) return goster("bilgi", "Bu canlı önizlemede rezervasyon kaydedilmez.", "Şablonu kullanınca rezervasyonlar veritabanındaki rezervasyonlar tablosuna düşer.");
    var b = $("#gonder"); b.disabled = true; b.textContent = "Kaydediliyor…";
    // Göndermeden hemen önce kontenjanı yeniden denetle: son yer az önce gitmiş olabilir.
    doluluk(rs.tarih, true).then(function (s) {
      rSayilar = s;
      if (fonksiyonVar() && kalanYer(d, s) <= 0) throw new Error("DOLU");
      return vayra.veri.ekle("rezervasyonlar", kayit);
    }).then(function () {
      olay("ders_rezervasyonu", { tur: d.tur });
      basari(kayit, d);
    }).catch(function (err) {
      if (err && err.message === "DOLU") { rDersler(); goster("hata", "Bu derste yer kalmadı.", "Son yer az önce doldu; aynı gün başka bir ders seçebilirsin."); }
      else goster("hata", "Rezervasyon kaydedilemedi.", (err && err.message ? err.message + ". " : "") + "Yeniden dene ya da 0212 251 47 90 numarasını ara.");
    }).finally(function () { b.disabled = false; b.textContent = "Yerimi ayırt"; });
  });

  function basari(k, d) {
    var bitis = dakikaSaat(saatDakika(k.saat) + Number(d.sure || 60));
    $("#icerik").innerHTML = '<section class="kapsayici"><div class="basari" role="status"><div class="tik"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>'
      + "<h1>Yerin <em>ayrıldı</em></h1><p>Dersten on dakika önce gelmen yeterli. Gelemeyeceksen en geç altı saat önce haber ver, yerin bir başkasına geçsin.</p>"
      + "<dl><dt>Ders</dt><dd>" + kacir(k.ders) + "</dd><dt>Zaman</dt><dd>" + kacir(tarihYaz(k.tarih, { weekday: "long" })) + ", " + saatYaz(k.saat) + " ile " + saatYaz(bitis) + "</dd><dt>Eğitmen</dt><dd>" + kacir(k.egitmen) + "</dd><dt>Ödeme</dt><dd>" + kacir(k.paket) + "</dd></dl>"
      + '<div class="eylemler"><button class="dugme" id="takvim" type="button">Takvimime ekle</button><a class="dugme ikincil" href="program.html">Programa dön</a></div></div></section>';
    window.scrollTo(0, 0);
    $("#takvim").addEventListener("click", function () {
      var t = k.tarih.replace(/-/g, ""), s1 = k.saat.replace(":", "") + "00", s2 = bitis.replace(":", "") + "00";
      var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Nefes Yoga//Rezervasyon//TR", "BEGIN:VEVENT", "UID:" + Date.now() + "@nefescihangir.com", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z", "DTSTART;TZID=Europe/Istanbul:" + t + "T" + s1, "DTEND;TZID=Europe/Istanbul:" + t + "T" + s2, "SUMMARY:Nefes: " + k.ders, "LOCATION:Akarsu Yokuşu No: 18\\, Cihangir\\, Beyoğlu / İstanbul", "DESCRIPTION:Eğitmen: " + k.egitmen + ". Mat ve malzemeler stüdyodan.", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = "nefes-ders.ics"; document.body.appendChild(a); a.click(); a.remove();
    });
  }
}

/* Kodsuz formlar (data-vayra-form): Vayra köprüsü yoksa (şablon galerisi) gönderimi durdurup bilgi ver. */
$$("form[data-vayra-form]").forEach(function (f) {
  f.addEventListener("submit", function (e) {
    if (e.defaultPrevented) { olay("form_gonderildi", { form: f.getAttribute("data-vayra-form") }); return; }
    e.preventDefault();
    bildir("Bu canlı önizlemede form gönderilmez; şablonu kullanınca başvurular gelen kutuna düşer.");
  });
});
`;

export const YOGA_STUDYOSU = {
  id: "yoga-studyosu",
  ad: "Nefes · Yoga ve Pilates",
  tur: "site" as const,
  aciklama: "Cihangir'de yoga ve pilates stüdyosu: tablodan haftalık program, tür, seviye ve eğitmen süzgeci, kontenjanlı ders rezervasyonu, paketler ve ilk ders formu",
  kapak: "/gercek/build/sablon/yoga-studyosu.webp",
  tablolar: TABLOLAR,
  dosyalar: {
    "index.html": sayfa("index.html", "Nefes Yoga ve Pilates · Cihangir", "Cihangir'de yoga ve pilates stüdyosu: vinyasa, hatha, yin, reformer ve mat pilates, meditasyon. Haftalık program ve online rezervasyon.", `<section class="kahraman">
  <video autoplay muted loop playsinline preload="metadata" poster="/gercek/havuz/gorsel/mk-yasam-4803.webp" aria-hidden="true"><source src="/gercek/havuz/video/mk-yasam-4803.mp4" type="video/mp4" /></video>
  <div class="kahraman-ic">
    <div>
      <p class="ust-yazi">Cihangir'de yoga ve pilates</p>
      <h1>Nefes al.<br><em>Yavaşla.</em></h1>
    </div>
    <div class="kahraman-yan">
      <p>Haftada ${DERSLER.length} ders, dört eğitmen, iki salon ve gün batımına bakan bir teras. Yeni başlayan da, yıllardır pratik yapan da burada kendi temposunu bulur.</p>
      <div class="eylemler"><a class="dugme acik" href="program.html">Haftalık program</a><a class="dugme cerceve-acik" href="fiyatlar.html#ilk-ders">İlk ders ücretsiz</a></div>
    </div>
  </div>
</section>
<section class="bugun" aria-labelledby="bugunBaslik">
  <h2 id="bugunBaslik">Bugün</h2>
  <div class="bugun-liste" id="bugunListe"><p class="bugun-bos">Program yükleniyor…</p></div>
  <a class="dugme kucuk ikincil" href="program.html">Bütün program</a>
</section>
<section class="kapsayici bolum">
  <div class="giris-izgara">
    <h2>Mükemmel bir duruş değil, <em>her gün biraz daha iyi</em> bir nefes arıyoruz.</h2>
    <div>
      <p>Nefes, 2017'de Akarsu Yokuşu'ndaki eski bir apartman katında açıldı. Yüksek tavanlı salonlarda sınıflar küçük tutulur; eğitmenlerimiz herkesin adını bilir ve hareketleri bedenine göre uyarlar.</p>
      <p>Mat, blok, kayış ve battaniye stüdyodan. Duş, soyunma odası ve ders sonrası bir bardak bitki çayı da.</p>
      <div class="rakamlar"><div><b>${DERSLER.length}</b><span>haftalık ders</span></div><div><b>6</b><span>kişilik reformer grupları</span></div><div><b>${TURLER.length}</b><span>farklı ders türü</span></div></div>
    </div>
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-baslik"><h2>Ders <em>türleri</em></h2><p>Hangisinden başlayacağını bilmiyorsan Hatha başlangıç ya da Reformer temel derslerine gel.</p></div>
  <div class="turler">
    <div class="turler-gorsel"><img src="/gercek/havuz/gorsel/mk-hareket-780.webp" alt="Gün batımında kollarını açıp esneyen bir kadının silueti" loading="lazy" /></div>
    <ol class="tur-liste">
${TURLER.map((t) => `      <li><a href="program.html?tur=${q(t.ad)}"><h3><i class="nokta" style="background:${t.renk}"></i>${t.ad}</h3><span class="ok">Derslere bak</span><p>${t.kisa}</p></a></li>`).join("\n")}
    </ol>
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-baslik"><h2>Eğitmenler</h2><a class="dugme ikincil" href="egitmenler.html">Eğitmenleri tanı</a></div>
  <div class="egitmen-izgara">
${EGITMENLER.map((e) => `    <a class="egitmen" href="egitmenler.html#${e.id}"><div class="foto"><img src="${e.foto}" alt="${e.ad}" loading="lazy" /></div><h3>${e.ad}</h3><p>${e.alan}</p></a>`).join("\n")}
  </div>
</section>
<section class="alinti">
  <img src="/gercek/havuz/gorsel/mk-doga-5040.webp" alt="" loading="lazy" />
  <blockquote><p>“Masa başında geçen on yılın ardından sırtım ilk kez ağrımıyor. Pazar sabahı dersini kaçırmamak için cumartesi gecelerimi bile değiştirdim.”</p><cite>Zeynep K., üç yıldır Nefes'te</cite></blockquote>
</section>
<section class="kapsayici bolum">
  <div class="bolum-baslik"><h2>Paketler</h2><p>Bütün paketler yoga ve mat pilates derslerinde geçerli. Reformer paketleri ayrı.</p></div>
  <div class="paketler">
${PAKETLER.map(paketKarti).join("\n")}
  </div>
</section>
<section class="kapsayici" style="padding-bottom:16px">
  <div class="konum">
    <div class="kutu">
      <h2>Stüdyo</h2>
      <p>Firuzağa Mah. Akarsu Yokuşu No: 18, Kat 3, Cihangir. Asansör var; binanın kapısı derslerden yarım saat önce açılır.</p>
      <div class="saatler"><div><span>Hafta içi</span><span>07.00 ile 22.30</span></div><div><span>Cumartesi</span><span>08.30 ile 19.00</span></div><div><span>Pazar</span><span>09.30 ile 19.00</span></div></div>
      <a class="dugme acik" href="rezervasyon.html">Derse yer ayırt</a>
    </div>
    <iframe title="Nefes Yoga ve Pilates harita konumu" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=28.9775%2C41.0285%2C28.9905%2C41.0355&amp;layer=mapnik&amp;marker=41.0318%2C28.9836"></iframe>
  </div>
</section>`),
    "program.html": sayfa("program.html", "Haftalık program · Nefes Yoga ve Pilates", "Nefes Yoga ve Pilates haftalık ders programı: gün, tür, seviye ve eğitmene göre süz, kalan yerleri gör, yer ayırt.", `<section class="kapsayici sayfa-bas">
  <h1>Haftalık <em>program</em></h1>
  <p>Önümüzdeki yedi günün dersleri. Kalan yerler anlık güncellenir; yer ayırtmak bir dakika sürer.</p>
</section>
<section class="kapsayici">
  <div class="suzgec">
    <div class="cipler" id="turCipleri" role="group" aria-label="Ders türü"></div>
    <div class="suzgec-alt">
      <label class="secim"><span class="atla">Seviye</span><select id="seviyeSec" aria-label="Seviye"><option value="">Bütün seviyeler</option>${SEVIYELER.map((s) => `<option>${s}</option>`).join("")}</select></label>
      <label class="secim"><span class="atla">Eğitmen</span><select id="egitmenSec" aria-label="Eğitmen"></select></label>
      <button class="temizle" id="temizle" type="button" hidden>Süzgeçleri temizle</button>
      <span class="sonuc-sayi" id="sonucSayi" aria-live="polite"></span>
    </div>
  </div>
  <div class="gunler" id="gunler" role="group" aria-label="Gün seç"></div>
  <div class="gun-baslik"><h2 id="gunBaslik">Bugün</h2><span id="gunOzet" aria-live="polite"></span></div>
  <div class="ders-liste" id="dersListe" aria-live="polite"></div>
</section>`),
    "rezervasyon.html": sayfa("rezervasyon.html", "Yer ayırt · Nefes Yoga ve Pilates", "Nefes Yoga ve Pilates'te bir derse yer ayırt.", `<section class="kapsayici sayfa-bas">
  <h1>Yer <em>ayırt</em></h1>
  <p>Günü ve dersi seç, bilgilerini yaz. İlk dersin bizden; paketin varsa stüdyoda düşeriz.</p>
</section>
<section class="kapsayici rez">
  <form id="rezForm" novalidate>
    <fieldset class="adim">
      <legend><span>1</span>Gün ve ders</legend>
      <div class="gunler" id="rGunler" role="group" aria-label="Gün seç"></div>
      <div id="rDersler" aria-live="polite"></div>
    </fieldset>
    <fieldset class="adim">
      <legend><span>2</span>Bilgilerin</legend>
      <div class="ikili">
        <label class="alan">Ad soyad<input name="ad" required autocomplete="name" minlength="3" /></label>
        <label class="alan">Cep telefonu<input name="telefon" type="tel" required autocomplete="tel" inputmode="tel" placeholder="05xx xxx xx xx" /></label>
      </div>
      <label class="alan" style="margin-top:14px">E-posta (isteğe bağlı)<input name="eposta" type="email" autocomplete="email" inputmode="email" /></label>
      <div class="paket-sec" role="radiogroup" aria-label="Ödeme">
        <label><input type="radio" name="paket" value="İlk dersim, ücretsiz" /><span>İlk dersim<small>Bizden, ücretsiz</small></span></label>
        <label><input type="radio" name="paket" value="Paketim var" checked /><span>Paketim var<small>Stüdyoda düşülür</small></span></label>
        <label><input type="radio" name="paket" value="Tek ders, stüdyoda öderim" /><span>Tek ders<small>Stüdyoda 750 TL</small></span></label>
      </div>
      <label class="alan" style="margin-top:14px">Eğitmenin bilmesi gereken bir şey var mı? (isteğe bağlı)<textarea name="not" maxlength="500" placeholder="Bel fıtığı, hamilelik, yeni bir sakatlık…"></textarea></label>
      <label class="onay"><input type="checkbox" name="kvkk" required /><span>Bilgilerimin yalnız rezervasyonum için işlenmesini kabul ediyorum. Notumdaki sağlık bilgisi yalnız eğitmenle paylaşılır.</span></label>
      <div id="mesaj" class="mesaj" role="alert" hidden></div>
    </fieldset>
  </form>
  <aside class="ozet" aria-labelledby="ozetBaslik">
    <div class="ozet-gorsel"><img id="ozFoto" src="/gercek/havuz/gorsel/mk-yasam-4800.webp" alt="" /></div>
    <div class="ozet-ic">
      <h2 id="ozetBaslik">Rezervasyonun</h2>
      <dl><div><dt>Ders</dt><dd id="ozDers">Seçilmedi</dd></div><div><dt>Zaman</dt><dd id="ozZaman">Seçilmedi</dd></div><div><dt>Eğitmen</dt><dd id="ozEgitmen">Dersi seçince görünür</dd></div><div><dt>Yer durumu</dt><dd id="ozYer">Dersi seçince görünür</dd></div></dl>
      <button class="dugme" id="gonder" type="submit" form="rezForm">Yerimi ayırt</button>
      <p>Dersten altı saat öncesine kadar ücretsiz iptal. Bilgilerini başka katılımcılar göremez.</p>
    </div>
  </aside>
</section>`),
    "egitmenler.html": sayfa("egitmenler.html", "Eğitmenler · Nefes Yoga ve Pilates", "Nefes Yoga ve Pilates eğitmenleri: vinyasa, yin, hatha, meditasyon, reformer ve mat pilates.", `<section class="kapsayici sayfa-bas">
  <h1>Seni <em>kim</em> karşılayacak?</h1>
  <p>Dört eğitmen, her biri kendi alanında yıllarca çalışmış. Her eğitmenin haftalık derslerine buradan geçebilirsin.</p>
</section>
<section class="kapsayici">
${EGITMENLER.map((e) => {
  const dersleri = DERSLER.filter((d) => d.egitmen === e.ad);
  return `  <article class="egitmen-uzun" id="${e.id}">
    <div class="foto"><img src="${e.foto}" alt="${e.ad}" loading="lazy" /></div>
    <div>
      <h2>${e.ad}</h2>
      <p class="alan-ad">${e.alan}</p>
      <p>${e.hakkinda}</p>
      <p class="sertifika"><strong>Eğitim:</strong> ${e.sertifika}</p>
      <ul class="haftalik" aria-label="Haftalık dersleri">${dersleri.map((d) => `<li>${GUN_KISA[GUN_AD.indexOf(d.gun)]} ${d.saat.replace(":", ".")}, ${d.ad}</li>`).join("")}</ul>
      <a class="dugme" href="program.html?egitmen=${e.id}">${e.ad.split(" ")[0]} ile dersler</a>
    </div>
  </article>`;
}).join("\n")}
</section>`),
    "fiyatlar.html": sayfa("fiyatlar.html", "Fiyatlar ve paketler · Nefes Yoga ve Pilates", "Nefes Yoga ve Pilates ders paketleri, reformer fiyatları, sık sorulan sorular ve ücretsiz ilk ders başvurusu.", `<section class="kapsayici sayfa-bas">
  <h1>Fiyatlar <em>ve paketler</em></h1>
  <p>Paketler stüdyoda nakit ya da kartla alınır; kredi kartına üç taksit yapılır. Öğrencilere bütün paketlerde yüzde 15 indirim.</p>
</section>
<section class="kapsayici">
  <div class="paketler">
${PAKETLER.map(paketKarti).join("\n")}
  </div>
  <div class="reformer-satir">
${REFORMER.map((r) => `    <div><span><b>${r.ad}</b><span>${r.alt}</span></span><strong>${r.fiyat}</strong></div>`).join("\n")}
  </div>
</section>
<section class="kapsayici bolum" id="ilk-ders">
  <div class="ilk-ders">
    <div class="ilk-ders-gorsel"><img src="/gercek/galeri/manzara6.webp" alt="Gün batımında uzanan lavanta tarlası" loading="lazy" /></div>
    <div class="ilk-ders-form">
      <h2>İlk ders <em>bizden</em></h2>
      <p>Formu doldur, ilgilendiğin derse göre seni arayıp uygun bir saat bulalım. Deneme dersi için hiçbir şey getirmen gerekmiyor.</p>
      <form class="form-izgara" data-vayra-form="İlk ders başvurusu" data-vayra-tesekkur="Teşekkürler, bugün içinde seni arayacağız.">
        <div class="ikili">
          <label class="alan">Ad soyad<input name="ad" required autocomplete="name" /></label>
          <label class="alan">Telefon<input name="telefon" type="tel" required inputmode="tel" autocomplete="tel" /></label>
        </div>
        <div class="ikili">
          <label class="alan">İlgilendiğin ders<select name="ders">${TURLER.map((t) => `<option>${t.ad}</option>`).join("")}<option>Henüz bilmiyorum</option></select></label>
          <label class="alan">Sana uygun zaman<select name="zaman"><option>Sabah</option><option>Öğle</option><option>Akşam</option><option>Hafta sonu</option></select></label>
        </div>
        <label class="onay"><input type="checkbox" name="izin" value="evet" required /><span>Başvurum için benimle telefonla iletişime geçilmesini kabul ediyorum.</span></label>
        <button class="dugme" type="submit">Ücretsiz dersimi iste</button>
      </form>
    </div>
  </div>
</section>
<section class="kapsayici" style="padding-bottom:24px">
  <div class="bolum-baslik"><h2>Sık <em>sorulanlar</em></h2></div>
  <div class="sss">
    <details><summary>Mat getirmem gerekiyor mu?</summary><p>Hayır. Mat, blok, kayış, bolster ve battaniye stüdyoda var; her dersten sonra temizlenir. Kendi matını getirmek istersen dolaplarımızda saklayabilirsin.</p></details>
    <details><summary>Derse ne giyip gelmeliyim?</summary><p>Rahat hareket edebileceğin, çok bol olmayan kıyafetler yeterli. Yoga ve pilates çıplak ayakla yapılır; reformer için kaymaz çorap öneriyoruz, stüdyoda da satılıyor.</p></details>
    <details><summary>Hiç yoga yapmadım, hangi dersten başlamalıyım?</summary><p>Hatha başlangıç ya da cumartesi başlangıç atölyesi en iyi başlangıç. Pilates için Reformer temel dersiyle başlayıp aleti tanımanı öneriyoruz.</p></details>
    <details><summary>Rezervasyonumu nasıl iptal ederim?</summary><p>Dersten altı saat öncesine kadar 0212 251 47 90 numarasını arayarak ya da mesaj atarak ücretsiz iptal edebilirsin. Daha geç iptallerde ders paketinden düşülür.</p></details>
    <details><summary>Hamileyim, derslere katılabilir miyim?</summary><p>Hekimin onay verdiyse evet. İlk üç aydan sonra Pınar'ın hamile yogası birebir derslerini öneriyoruz; grup derslerinde eğitmen sana uygun seçenekleri gösterir.</p></details>
    <details><summary>Paketimi dondurabilir miyim?</summary><p>8 derslik pakette bir kez iki hafta, 16 derslik pakette iki kez dondurma hakkın var. Sağlık raporuyla bu süre uzatılır.</p></details>
  </div>
</section>`),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="#7d8f73"/><path d="M14 38c6-9 12-9 18 0s12 9 18 0" fill="none" stroke="#f4efe6" stroke-width="3.2" stroke-linecap="round"/><circle cx="32" cy="22" r="4.4" fill="#f4efe6"/></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
    "api/doluluk.js": DOLULUK,
  },
};
