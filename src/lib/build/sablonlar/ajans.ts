/* Şablon: Paralel Stüdyo — Karaköy'de marka, web ve ürün tasarımı yapan dijital ajans. İşler "isler" tablosundan (kategori
 * süzgeci, vaka sayfası is.html?id=, sonuçlar json), hizmetler ve SSS, ekip, brif formu "brifler" tablosuna yazar
 * (ziyaretçi ekler, okuyamaz). Galerideki canlı önizlemede gömülü işlerle çalışır. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";

const KATEGORILER = ["Marka", "Web", "Kampanya", "Ürün"];
const HIZMET_SECENEK = ["Marka kimliği", "Web sitesi", "E-ticaret", "Mobil uygulama", "Kampanya", "Hareket tasarımı", "Sosyal medya", "Ürün tasarımı"];
const BUTCELER = ["150.000 TL altı", "150.000 ile 400.000 TL", "400.000 TL ile 1 milyon TL", "1 milyon TL üstü", "Henüz bilmiyorum"];
const ZAMANLAR = ["Hemen, bir ay içinde", "Bir ile üç ay içinde", "Üç aydan sonra", "Tarih esnek"];

type Sonuc = { deger: string; aciklama: string };
const ISLER: { id: string; musteri: string; baslik: string; kategori: string; yil: number; gorsel: string; ikinciGorsel: string; renk: string; ozet: string; sorun: string; yaklasim: string; hizmetler: string; sonuclar: Sonuc[]; onecikan?: boolean }[] = [
  { id: "mira-kozmetik", musteri: "Mira Kozmetik", baslik: "Serumdan önce gelen marka", kategori: "Marka", yil: 2026, gorsel: "/gercek/galeri/urun1.webp", ikinciGorsel: "/gercek/galeri/soyut9.webp", renk: "#e9d9c4", onecikan: true,
    ozet: "Eczane rafından çıkıp kendi mağazasını açan bir cilt bakım markası için isim dışında her şeyi yeniden kurduk.", sorun: "Mira on yıldır eczanelerde satılıyordu ama raftaki yüzlerce kutu arasında kayboluyordu. Kendi mağazasını açmadan önce, ürünü değil markayı hatırlatacak bir kimliğe ihtiyacı vardı.", yaklasim: "İçerik listesini kutunun ön yüzüne taşıyan yalın bir ambalaj sistemi, tek renkli şişe ailesi ve cildin dokusunu yakın çekimle anlatan bir fotoğraf dili tasarladık. Mağaza tabelasından kargo kutusuna kadar 140 parça.", hizmetler: "Strateji, marka kimliği, ambalaj, fotoğraf yönetimi",
    sonuclar: [{ deger: "yüzde 38", aciklama: "daha yüksek raf satışı, ilk altı ayda" }, { deger: "120 bin", aciklama: "yeni takipçi, lansmandan sonraki üç ayda" }, { deger: "2 ödül", aciklama: "ambalaj tasarımında, Kırmızı ve Grafik Tasarım Yıllığı" }] },
  { id: "vakit-saat", musteri: "Vakit Saat Atölyesi", baslik: "Ustanın elinden ekrana", kategori: "Web", yil: 2026, gorsel: "/gercek/galeri/urun11.webp", ikinciGorsel: "/gercek/galeri/soyut5.webp", renk: "#d8e1ea", onecikan: true,
    ozet: "El yapımı saatler üreten bir atölyenin e-ticaret sitesini, mağazadaki sohbet hissini koruyarak baştan yaptık.", sorun: "Ziyaretçiler ürün sayfalarında uzun süre kalıyor ama satın almadan çıkıyordu. Fiyatı yüksek bir ürünü, dokunmadan almaya ikna etmek gerekiyordu.", yaklasim: "Her saatin üretim hikâyesini adım adım gösteren uzun ürün sayfaları, bilekte nasıl duracağını gösteren ölçü aracı ve ustaya görüntülü soru sorma randevusu ekledik. Ödeme adımlarını üçten bire indirdik.", hizmetler: "UX araştırması, arayüz tasarımı, e-ticaret geliştirme",
    sonuclar: [{ deger: "yüzde 42", aciklama: "daha fazla dönüşüm, yeni siteyle" }, { deger: "yarı yarıya", aciklama: "azalan sepet terki" }, { deger: "1,8 kat", aciklama: "ortalama sipariş tutarı artışı" }] },
  { id: "bora-kosu", musteri: "Bora Koşu", baslik: "Şehri koşu pistine çeviren kampanya", kategori: "Kampanya", yil: 2025, gorsel: "/gercek/galeri/urun4.webp", ikinciGorsel: "/gercek/galeri/soyut7.webp", renk: "#d4ff3a", onecikan: true,
    ozet: "Yerli bir koşu ayakkabısı markası için İstanbul'un yokuşlarını rakip ilan eden bir kampanya.", sorun: "Bora'nın yeni modeli teknik olarak iddialıydı ama bilinirliği düşüktü. Bütçe, büyük markaların reklam yükleriyle yarışmaya yetmiyordu.", yaklasim: "İstanbul'un en dik on yokuşunu haritaladık, her birine bir rekor tablosu açtık. Koşucular uygulamayla süresini kaydetti, en hızlılar sokak afişlerinde yer aldı. Kısa videolar koşucuların kendi çekimleriyle üretildi.", hizmetler: "Kampanya fikri, hareket tasarımı, sosyal medya, mikro site",
    sonuclar: [{ deger: "4,2 milyon", aciklama: "kısa video izlenmesi" }, { deger: "18 bin", aciklama: "kaydedilen yokuş koşusu" }, { deger: "yüzde 64", aciklama: "lansman ayında satış artışı" }] },
  { id: "kervan-lojistik", musteri: "Kervan Lojistik", baslik: "Kuryenin gününü kısaltan uygulama", kategori: "Ürün", yil: 2025, gorsel: "/gercek/galeri/3d2.webp", ikinciGorsel: "/gercek/havuz/gorsel/mk-teknoloji-4916.webp", renk: "#cfe3d6", onecikan: true,
    ozet: "Günde 40 bin paket taşıyan bir lojistik şirketinin kurye uygulamasını sahada, kuryelerle birlikte yeniden tasarladık.", sorun: "Kuryeler eski uygulamada adres bulmak ve teslim fotoğrafı yüklemek için günde ortalama bir saat kaybediyordu; uygulama tek elle kullanılamıyordu.", yaklasim: "İki hafta boyunca kuryelerle sahaya çıktık. Tek elle kullanılan, büyük dokunma alanlı bir arayüz, sesli yönlendirme ve bağlantı kopunca da çalışan teslim akışı tasarlayıp geliştirdik.", hizmetler: "Saha araştırması, ürün tasarımı, mobil uygulama geliştirme",
    sonuclar: [{ deger: "47 dakika", aciklama: "kurye başına günlük kazanç" }, { deger: "yüzde 31", aciklama: "daha az hatalı teslim" }, { deger: "4,8 puan", aciklama: "uygulama içi kurye memnuniyeti" }] },
  { id: "lumo-enerji", musteri: "Lumo Enerji", baslik: "Çatıdaki güneşi görünür kılmak", kategori: "Kampanya", yil: 2025, gorsel: "/gercek/galeri/soyut8.webp", ikinciGorsel: "/gercek/galeri/soyut11.webp", renk: "#f5e3a3",
    ozet: "Ev tipi güneş paneli satan bir girişim için, faturadaki tasarrufu her gün gösteren bir kampanya ve hesaplayıcı.", sorun: "İnsanlar güneş panelinin pahalı ve karmaşık olduğunu düşünüyordu. Asıl soru basitti: bana ne kazandırır?", yaklasim: "Adresini yazanın çatısını uydu görüntüsünden ölçüp yıllık tasarrufu gösteren bir hesaplayıcı yaptık. Kampanya, gerçek müşterilerin faturalarını açık açık paylaşmasına dayandı.", hizmetler: "Kampanya, web uygulaması, video",
    sonuclar: [{ deger: "62 bin", aciklama: "çatı hesaplaması, ilk iki ayda" }, { deger: "yüzde 27", aciklama: "hesaplayıcıdan teklif talebine geçiş" }, { deger: "3 kat", aciklama: "keşif randevusu artışı" }] },
  { id: "dalga-ses", musteri: "Dalga Ses", baslik: "Taş gibi bir hoparlör", kategori: "Ürün", yil: 2024, gorsel: "/gercek/kesfet/pz-s3.webp", ikinciGorsel: "/gercek/galeri/soyut1.webp", renk: "#dfe6ee",
    ozet: "Türkiye'de üretilen ilk taş gövdeli kablosuz hoparlörün ürün dili, uygulaması ve ön sipariş sitesi.", sorun: "Dalga'nın mühendisleri ses kalitesinden emindi; eksik olan, ürünün neden farklı olduğunu tek bakışta anlatan bir dildi.", yaklasim: "Gövdenin dokusundan yola çıkan sakin bir arayüz, kurulumu doksan saniyeye indiren bir eşleştirme akışı ve ön sipariş sitesini tasarladık.", hizmetler: "Ürün dili, uygulama arayüzü, lansman sitesi",
    sonuclar: [{ deger: "4.200", aciklama: "ön sipariş, kırk sekiz saatte" }, { deger: "90 saniye", aciklama: "ortalama kurulum süresi" }] },
  { id: "akis-finans", musteri: "Akış Finans", baslik: "Bankacılığı sakinleştiren site", kategori: "Web", yil: 2024, gorsel: "/gercek/galeri/soyut5.webp", ikinciGorsel: "/gercek/havuz/gorsel/mk-is-4872.webp", renk: "#e4e0f2",
    ozet: "Genç kullanıcılara yönelen bir finans uygulamasının tanıtım sitesi ve içerik sistemi.", sorun: "Akış'ın ürünü basitti ama sitesi ağır finans diliyle doluydu; ziyaretçilerin çoğu ilk ekranda çıkıyordu.", yaklasim: "Her özelliği tek cümleyle anlatan bir yazı rehberi, hareketli ürün anlatımı ve hızlı açılan bir site kurduk. İçerik ekibi artık yeni sayfayı kodsuz yayınlıyor.", hizmetler: "Yazı rehberi, web tasarımı, geliştirme, içerik yönetimi",
    sonuclar: [{ deger: "yüzde 53", aciklama: "daha düşük hemen çıkma" }, { deger: "1,2 saniye", aciklama: "ilk ekranın açılma süresi" }] },
  { id: "tonart-boya", musteri: "Tonart Boya", baslik: "Elli yıllık boyaya yeni renk", kategori: "Marka", yil: 2024, gorsel: "/gercek/galeri/soyut7.webp", ikinciGorsel: "/gercek/galeri/soyut1.webp", renk: "#ffd2bf",
    ozet: "Üç kuşaktır aynı ailenin yönettiği boya üreticisinin kimliğini, ustaların gözünden yeniden yaptık.", sorun: "Tonart bayilerde güvenilir ama eski bir marka olarak görülüyordu; yeni nesil ev sahipleri markayı tanımıyordu.", yaklasim: "Renk kartelasını marka kimliğinin merkezine koyduk: her rengin bir semt adı var. Bayi tabelaları, kutu sistemi ve renk seçme uygulaması aynı dili konuşuyor.", hizmetler: "Marka kimliği, ambalaj sistemi, renk adlandırma",
    sonuclar: [{ deger: "yüzde 22", aciklama: "perakende satış artışı" }, { deger: "860", aciklama: "bayide yenilenen tabela" }] },
  { id: "bicim-muzesi", musteri: "İstanbul Biçim Müzesi", baslik: "Sonsuz düğüm", kategori: "Marka", yil: 2023, gorsel: "/gercek/galeri/3d3.webp", ikinciGorsel: "/gercek/galeri/3d11.webp", renk: "#e6e6e1",
    ozet: "Yeni açılan bir tasarım müzesi için hareket eden bir logo, yön bulma sistemi ve sergi grafikleri.", sorun: "Müze her sergide başka bir yüze bürünmek istiyordu ama tanınır kalmalıydı.", yaklasim: "Sergiye göre biçim değiştiren, üç boyutlu bir düğüm logosu tasarladık. Yön bulma tabelaları ve bilet sistemi aynı modüler ızgaraya oturuyor.", hizmetler: "Marka kimliği, hareketli logo, yön bulma",
    sonuclar: [{ deger: "11 sergi", aciklama: "aynı sistemle tasarlandı" }, { deger: "yüzde 35", aciklama: "çevrim içi bilet payı" }] },
  { id: "nabiz-saat", musteri: "Nabız", baslik: "Bilekteki koç", kategori: "Ürün", yil: 2023, gorsel: "/gercek/galeri/urun2.webp", ikinciGorsel: "/gercek/havuz/gorsel/mk-teknoloji-4916.webp", renk: "#cdeaf5",
    ozet: "Akıllı saat üreticisi için antrenman uygulaması ve saat yüzleri.", sorun: "Kullanıcılar saati ilk ayda çekmeceye kaldırıyordu; veriler vardı ama anlamı yoktu.", yaklasim: "Sayılar yerine günlük tek bir öneri gösteren bir saat yüzü ve haftalık hedefleri oyunlaştıran bir uygulama tasarladık.", hizmetler: "Ürün stratejisi, arayüz tasarımı, prototip",
    sonuclar: [{ deger: "yüzde 58", aciklama: "daha uzun kullanım, ilk üç ayda" }, { deger: "4,7 puan", aciklama: "uygulama mağazası puanı" }] },
].map((x) => x);

const KAYITLAR = ISLER.map((x, i) => ({ ...x, onecikan: !!x.onecikan, sira: i + 1, aktif: true }));

const TABLOLAR: Record<string, SablonTablo> = {
  isler: {
    aciklama: "Portfolyodaki işler. Ana sayfa, İşler ve vaka sayfası bu tablodan okur. sonuclar: [{ deger, aciklama }] listesi.",
    kurallar: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" },
    sema: [
      { ad: "musteri", tur: "metin", zorunlu: true },
      { ad: "baslik", tur: "metin", zorunlu: true },
      { ad: "kategori", tur: "secim", zorunlu: true, secenekler: KATEGORILER },
      { ad: "yil", tur: "sayi" },
      { ad: "gorsel", tur: "gorsel", zorunlu: true },
      { ad: "ikinciGorsel", tur: "gorsel" },
      { ad: "renk", tur: "metin", aciklama: "Vaka sayfasının zemin rengi, örneğin #e9d9c4" },
      { ad: "ozet", tur: "uzunMetin" },
      { ad: "sorun", tur: "uzunMetin" },
      { ad: "yaklasim", tur: "uzunMetin" },
      { ad: "hizmetler", tur: "metin" },
      { ad: "sonuclar", tur: "json", aciklama: "[{ \"deger\": \"yüzde 42\", \"aciklama\": \"daha fazla dönüşüm\" }]" },
      { ad: "onecikan", tur: "mantiksal", varsayilan: false, aciklama: "Ana sayfada görünür" },
      { ad: "aktif", tur: "mantiksal", varsayilan: true },
      { ad: "sira", tur: "sayi" },
    ],
    kayitlar: KAYITLAR,
  },
  brifler: {
    aciklama: "Sitedeki brif formundan gelen proje talepleri. Ziyaretçi ekleyebilir ama okuyamaz.",
    kurallar: { okuma: "kapali", ekleme: "herkes", duzenleme: "kapali" },
    sema: [
      { ad: "ad", tur: "metin", zorunlu: true },
      { ad: "sirket", tur: "metin", zorunlu: true },
      { ad: "eposta", tur: "eposta", zorunlu: true },
      { ad: "telefon", tur: "metin" },
      { ad: "web", tur: "metin", aciklama: "Mevcut site adresi" },
      { ad: "hizmetler", tur: "metin", zorunlu: true, aciklama: "Virgülle: " + HIZMET_SECENEK.join(", ") },
      { ad: "butce", tur: "secim", zorunlu: true, secenekler: BUTCELER },
      { ad: "zaman", tur: "secim", secenekler: ZAMANLAR },
      { ad: "mesaj", tur: "uzunMetin", zorunlu: true },
      { ad: "kaynak", tur: "secim", secenekler: ["Arama motoru", "Tavsiye", "Sosyal medya", "Bir işinizi gördüm", "Diğer"] },
      { ad: "kvkk", tur: "mantiksal", zorunlu: true },
      { ad: "durum", tur: "secim", secenekler: ["Yeni", "Görüşüldü", "Teklif verildi", "Kazanıldı", "Olmadı"], varsayilan: "Yeni" },
    ],
    kayitlar: [],
  },
};

const MUSTERILER: [string, string][] = [["Mira", "m1"], ["KERVAN", "m2"], ["vakit.", "m3"], ["Lumo Enerji", "m4"], ["BORA", "m5"], ["Tonart", "m6"], ["akış", "m7"], ["DALGA", "m8"], ["Biçim Müzesi", "m9"], ["nabız", "m10"]];
const EKIP = [
  { ad: "Deniz Arslan", rol: "Kurucu, kreatif direktör", foto: "/gercek/paz/av-jayden.webp" },
  { ad: "Ece Yıldırım", rol: "Tasarım direktörü", foto: "/gercek/paz/av-hana.webp" },
  { ad: "Kaan Öztürk", rol: "Teknoloji direktörü", foto: "/gercek/paz/av-tae.webp" },
  { ad: "Melis Aydın", rol: "Strateji ortağı", foto: "/gercek/paz/av-margot.webp" },
  { ad: "Barış Er", rol: "Hareket tasarımcısı", foto: "/gercek/paz/av-ren.webp" },
  { ad: "Zehra Kılınç", rol: "Proje yöneticisi", foto: "/gercek/paz/av-sora.webp" },
];
const HIZMETLER = [
  { no: "01", ad: "Marka kimliği", kisa: "İsimden ambalaja, markanın bütün yüzleri.", teslim: ["Marka stratejisi ve konumlama", "Logo ve görsel kimlik", "Yazı ve renk sistemi", "Ambalaj ve basılı işler", "Marka kılavuzu"], sure: "8 ile 14 hafta", baslangic: "180.000 TL" },
  { no: "02", ad: "Web ve e-ticaret", kisa: "Hızlı açılan, kolay yönetilen, satan siteler.", teslim: ["Kullanıcı araştırması", "Arayüz tasarımı", "Geliştirme ve içerik yönetimi", "E-ticaret ve ödeme", "Hız ve erişilebilirlik denetimi"], sure: "6 ile 16 hafta", baslangic: "220.000 TL" },
  { no: "03", ad: "Dijital ürün", kisa: "Mobil uygulama ve panel tasarımı, sahadan başlayarak.", teslim: ["Saha ve kullanıcı araştırması", "Prototip ve test", "Tasarım sistemi", "iOS ve Android geliştirme"], sure: "12 hafta ve üstü", baslangic: "450.000 TL" },
  { no: "04", ad: "Kampanya ve hareket", kisa: "Konuşulan fikirler, kısa videolar, hareketli kimlikler.", teslim: ["Kampanya fikri", "Kısa video ve hareket tasarımı", "Sosyal medya içerikleri", "Mikro site"], sure: "4 ile 10 hafta", baslangic: "150.000 TL" },
];

const ust = (aktif: string) => `<a class="atla" href="#icerik">İçeriğe geç</a>
<header class="ust">
  <a class="logo" href="index.html" aria-label="Paralel Stüdyo ana sayfa"><span class="logo-isaret" aria-hidden="true"><i></i><i></i></span>paralel<small>stüdyo</small></a>
  <nav class="menu" data-menu aria-label="Ana menü">
${[["isler.html", "İşler"], ["hizmetler.html", "Hizmetler"], ["studyo.html", "Stüdyo"], ["brif.html", "İletişim"]].map(([h, a]) => `    <a href="${h}"${h === aktif || (aktif === "is.html" && h === "isler.html") ? ' aria-current="page"' : ""}>${a}</a>`).join("\n")}
  </nav>
  <a class="dugme kucuk" href="brif.html">Brif ver</a>
  <button class="menu-dugme" type="button" data-menu-ac aria-expanded="false" aria-label="Menüyü aç"><span></span><span></span></button>
</header>`;

const alt = `<footer class="alt">
  <div class="kap">
    <a class="alt-cta" href="brif.html"><div><span>Bir fikrin mi var?</span><b>Konuşalım</b></div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></a>
    <div class="alt-izgara">
      <div><a class="logo" href="index.html"><span class="logo-isaret" aria-hidden="true"><i></i><i></i></span>paralel<small>stüdyo</small></a><p>Marka, web ve dijital ürün tasarımı. 2014'ten beri Karaköy'de.</p></div>
      <div><h4>Stüdyo</h4><p>Kemankeş Karamustafa Paşa Mah.<br />Halil Paşa Sok. No: 6, Karaköy<br />Beyoğlu / İstanbul</p></div>
      <div><h4>Yeni işler</h4><p><a href="mailto:merhaba@paralelstudyo.com">merhaba@paralelstudyo.com</a></p><p><a href="tel:+902122523890">0212 252 38 90</a></p></div>
      <div><h4>Sayfalar</h4><p><a href="isler.html">İşler</a></p><p><a href="hizmetler.html">Hizmetler</a></p><p><a href="studyo.html">Stüdyo ve kariyer</a></p><p><a href="kvkk.html">KVKK</a></p></div>
    </div>
    <p class="alt-not">Paralel Tasarım ve Yazılım A.Ş. · Bütün işler müşterilerimizin izniyle paylaşılmıştır.</p>
  </div>
</footer>`;

const sayfa = (dosya: string, baslik: string, aciklama: string, govde: string) => `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${baslik}</title>
  <meta name="description" content="${aciklama}" />
  <meta name="theme-color" content="#f2f0eb" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" />
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

const kirma = (ad: string) => ad.replace("e-ticaret", '<span style="white-space:nowrap">e-ticaret</span>');
const OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';

const STIL = String.raw`/* Paralel Stüdyo — kırık beyaz zemin, mürekkep siyahı, asit yeşili imza; Syne ve Inter. */
:root {
  --zemin: #f2f0eb; --kagit: #faf9f6; --murekkep: #111111; --soluk: #5e5b55; --cizgi: rgba(17, 17, 17, .14); --cizgi-k: rgba(17, 17, 17, .08);
  --asit: #d4ff3a; --asit-koyu: #b8e61a; --gece: #111111;
  --baslik: "Syne", "Inter", sans-serif; --govde: "Inter", system-ui, sans-serif;
}
[hidden] { display: none !important; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--zemin); color: var(--murekkep); font: 16px/1.6 var(--govde); -webkit-font-smoothing: antialiased; }
img, svg { display: block; max-width: 100%; }
a { color: inherit; }
h1, h2, h3 { font-family: var(--baslik); font-weight: 700; letter-spacing: -.03em; line-height: .98; margin: 0; overflow-wrap: break-word; }
:focus-visible { outline: 2px solid var(--murekkep); outline-offset: 3px; }
.atla { position: absolute; left: -999px; top: 8px; background: var(--asit); padding: 8px 14px; z-index: 50; }
.atla:focus { left: 12px; }
.kap { max-width: 1360px; margin: 0 auto; padding: 0 clamp(16px, 4vw, 48px); }
.vurgu { background: var(--asit); padding: 0 .12em; border-radius: .12em; box-decoration-break: clone; -webkit-box-decoration-break: clone; }

.ust { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: 24px; padding: 14px clamp(16px, 4vw, 48px); background: color-mix(in srgb, var(--zemin) 88%, transparent); backdrop-filter: blur(14px); border-bottom: 1px solid var(--cizgi-k); }
.logo { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; font: 800 24px/1 var(--baslik); letter-spacing: -.04em; }
.logo small { font: 500 13px var(--govde); letter-spacing: 0; color: var(--soluk); margin-left: -4px; align-self: flex-end; padding-bottom: 2px; }
.logo-isaret { display: inline-grid; grid-template-columns: 1fr 1fr; gap: 4px; width: 22px; height: 22px; transform: skewX(-14deg); }
.logo-isaret i { background: var(--murekkep); border-radius: 2px; }
.logo-isaret i + i { background: var(--asit); outline: 1.5px solid var(--murekkep); outline-offset: -1.5px; }
.menu { display: flex; gap: 2px; margin-left: auto; }
.menu a { text-decoration: none; padding: 10px 14px; border-radius: 99px; font-weight: 500; font-size: 15px; }
.menu a:hover { background: var(--cizgi-k); }
.menu a[aria-current] { background: var(--murekkep); color: var(--zemin); }
.menu-dugme { display: none; width: 46px; height: 46px; border-radius: 99px; border: 1px solid var(--cizgi); background: transparent; cursor: pointer; flex-direction: column; align-items: center; justify-content: center; gap: 6px; }
.menu-dugme span { width: 18px; height: 2px; background: var(--murekkep); }

.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px; padding: 12px 26px; border-radius: 99px; border: 1.5px solid var(--murekkep); background: var(--murekkep); color: var(--zemin); font: 600 15px/1 var(--govde); text-decoration: none; cursor: pointer; transition: background .2s, color .2s, transform .2s; }
.dugme:hover { background: var(--asit); color: var(--murekkep); }
.dugme svg { width: 18px; }
.dugme.asit { background: var(--asit); color: var(--murekkep); border-color: var(--murekkep); }
.dugme.asit:hover { background: var(--murekkep); color: var(--asit); }
.dugme.cizgili { background: transparent; color: var(--murekkep); }
.dugme.cizgili:hover { background: var(--murekkep); color: var(--zemin); }
.dugme.kucuk { min-height: 44px; padding: 10px 20px; font-size: 14px; }
.ust .dugme.kucuk { background: var(--asit); color: var(--murekkep); }
.ust .dugme.kucuk:hover { background: var(--murekkep); color: var(--asit); }
.dugme[disabled] { opacity: .5; cursor: not-allowed; }

/* Kahraman */
.kahraman { padding-block: clamp(36px, 6vw, 88px) clamp(28px, 4vw, 56px); }
.musait { display: inline-flex; align-items: center; gap: 10px; padding: 8px 14px 8px 10px; border: 1px solid var(--cizgi); border-radius: 99px; font-size: 14px; font-weight: 500; margin-bottom: 28px; }
.musait i { width: 10px; height: 10px; border-radius: 50%; background: #1fbf5b; box-shadow: 0 0 0 4px rgba(31, 191, 91, .18); }
.kahraman h1 { font-size: clamp(46px, 7.4vw, 124px); font-weight: 800; letter-spacing: -.055em; line-height: .88; }
.kahraman h1 .satir2 { display: block; padding-left: clamp(0px, 6vw, 110px); }
.kahraman-alt { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: end; margin-top: clamp(28px, 4vw, 56px); }
.kahraman-alt p { font-size: clamp(18px, 1.6vw, 22px); line-height: 1.45; margin: 0; max-width: 560px; }
.kahraman-alt .eylemler { justify-self: end; }
.eylemler { display: flex; flex-wrap: wrap; gap: 12px; }
.vitrin { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 14px; margin-top: clamp(32px, 5vw, 64px); }
.vitrin a { position: relative; display: block; overflow: hidden; border-radius: 18px; aspect-ratio: 4 / 4.6; background: var(--kagit); }
.vitrin a:first-child { aspect-ratio: auto; }
.vitrin img { width: 100%; height: 100%; object-fit: cover; transition: transform .7s; }
.vitrin a:hover img { transform: scale(1.04); }
.vitrin span { position: absolute; left: 14px; bottom: 14px; background: var(--kagit); padding: 8px 14px; border-radius: 99px; font-size: 13.5px; font-weight: 600; }

/* Kayan müşteri şeridi */
.serit { background: var(--asit); border-block: 1.5px solid var(--murekkep); overflow: hidden; padding: 22px 0; margin-top: clamp(40px, 6vw, 80px); }
.serit-ic { display: flex; gap: 64px; width: max-content; animation: kay 34s linear infinite; }
.serit:hover .serit-ic { animation-play-state: paused; }
.serit-ic span { font-size: 34px; line-height: 1; white-space: nowrap; display: inline-flex; align-items: center; gap: 64px; }
.serit-ic span::after { content: ""; width: 12px; height: 12px; background: var(--murekkep); transform: rotate(45deg); }
.m1 { font: italic 600 36px var(--baslik); } .m2 { font: 800 30px var(--govde); letter-spacing: .12em; } .m3 { font: 700 36px var(--baslik); letter-spacing: -.06em; }
.m4 { font: 500 30px var(--govde); } .m5 { font: 800 34px var(--baslik); letter-spacing: .06em; } .m6 { font: 600 34px Georgia, serif; font-style: italic; }
.m7 { font: 800 36px var(--baslik); letter-spacing: -.05em; } .m8 { font: 700 28px var(--govde); letter-spacing: .3em; } .m9 { font: 500 30px Georgia, serif; } .m10 { font: 600 34px var(--govde); letter-spacing: -.04em; }
@keyframes kay { to { transform: translateX(-50%); } }

.bolum { padding-block: clamp(64px, 9vw, 128px); }
.bolum-ust { display: flex; justify-content: space-between; align-items: end; gap: 24px; flex-wrap: wrap; margin-bottom: clamp(28px, 4vw, 52px); }
.bolum-ust > div { min-width: 0; }
.bolum-ust h2 { font-size: clamp(42px, 7vw, 104px); letter-spacing: -.05em; font-weight: 800; overflow-wrap: break-word; }
.bolum-ust p { max-width: 460px; color: var(--soluk); margin: 0; }
.etiket { display: inline-block; font-size: 14px; font-weight: 600; margin-bottom: 14px; }
.etiket::before { content: ""; display: inline-block; width: 10px; height: 10px; background: var(--asit); border: 1.5px solid var(--murekkep); border-radius: 50%; margin-right: 8px; vertical-align: -1px; }

/* İş kartları */
.isler { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(28px, 4vw, 56px) clamp(16px, 2.4vw, 32px); }
.isler.kaydir .is-kart:nth-child(2n) { margin-top: clamp(0px, 8vw, 120px); }
.is-kart { text-decoration: none; display: grid; gap: 16px; align-content: start; }
.is-kart .gorsel { position: relative; overflow: hidden; border-radius: 22px; aspect-ratio: 4 / 3.4; background: var(--kagit); }
.is-kart img { width: 100%; height: 100%; object-fit: cover; transition: transform .8s cubic-bezier(.2, .7, .2, 1); }
.is-kart:hover img { transform: scale(1.05); }
.is-kart .incele { position: absolute; right: 16px; top: 16px; width: 56px; height: 56px; border-radius: 50%; background: var(--asit); border: 1.5px solid var(--murekkep); display: grid; place-items: center; transform: scale(.6); opacity: 0; transition: transform .3s, opacity .3s; }
.is-kart .incele svg { width: 22px; }
.is-kart:hover .incele, .is-kart:focus-visible .incele { transform: scale(1); opacity: 1; }
.is-kart .bilgi { display: flex; justify-content: space-between; gap: 16px; align-items: start; }
.is-kart h3 { font-size: clamp(24px, 2.4vw, 34px); letter-spacing: -.035em; }
.is-kart .musteri { display: block; color: var(--soluk); font-size: 15px; margin-top: 6px; }
.haplar { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.hap { padding: 6px 12px; border: 1px solid var(--cizgi); border-radius: 99px; font-size: 13px; font-weight: 500; white-space: nowrap; }

/* Hizmet satırları */
.hizmet-satirlar { border-top: 1.5px solid var(--murekkep); }
.hizmet-satir { display: grid; grid-template-columns: 90px 1.2fr 1fr 60px; gap: 24px; align-items: center; padding: 28px 0; border-bottom: 1.5px solid var(--murekkep); text-decoration: none; transition: background .25s, padding .25s; }
.hizmet-satir:hover { background: var(--asit); padding-inline: 18px; }
.hizmet-satir > * { min-width: 0; }
.hizmet-satir .no { font: 600 15px var(--govde); }
.hizmet-satir h3 { font-size: clamp(28px, 3.4vw, 50px); letter-spacing: -.045em; font-weight: 800; }
.hizmet-satir p { margin: 0; color: var(--soluk); }
.hizmet-satir svg { width: 32px; justify-self: end; }

/* Koyu sayılar */
.koyu { background: var(--gece); color: var(--zemin); border-radius: clamp(24px, 3vw, 40px); margin-inline: clamp(8px, 1.5vw, 20px); }
.koyu .bolum-ust p { color: #b9b6ae; }
.sayilar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border-top: 1px solid rgba(242, 240, 235, .18); }
.sayilar div { padding: 26px 22px 0 0; }
.sayilar b small { display: block; font-size: .36em; letter-spacing: -.02em; margin-bottom: 4px; }
.sayilar b { display: block; font: 800 clamp(44px, 5vw, 76px)/1 var(--baslik); letter-spacing: -.05em; color: var(--asit); }
.sayilar span { display: block; margin-top: 10px; color: #c9c6be; font-size: 15px; max-width: 220px; }
.surec { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: clamp(48px, 6vw, 88px); }
.surec div { border: 1px solid rgba(242, 240, 235, .18); border-radius: 20px; padding: 24px; }
.surec small { display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: var(--asit); color: var(--murekkep); font-weight: 700; margin-bottom: 18px; }
.surec h3 { font-size: 24px; margin-bottom: 8px; }
.surec p { margin: 0; color: #b9b6ae; font-size: 15px; }

/* İşler sayfası */
.sayfa-bas { padding-block: clamp(40px, 6vw, 88px) clamp(24px, 3vw, 40px); }
.sayfa-bas h1 { font-size: clamp(60px, 12vw, 190px); font-weight: 800; letter-spacing: -.06em; line-height: .9; padding-bottom: .1em; }
.sayfa-bas p { max-width: 560px; font-size: 19px; color: var(--soluk); margin: 22px 0 0; }
.suzgec { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 36px; }
.cip { min-height: 44px; padding: 10px 18px; border-radius: 99px; border: 1.5px solid var(--murekkep); background: transparent; color: var(--murekkep); font: 600 14.5px var(--govde); cursor: pointer; }
.cip sup { font-size: 11px; margin-left: 3px; }
.cip[aria-pressed="true"] { background: var(--murekkep); color: var(--zemin); }
.cip:hover:not([aria-pressed="true"]) { background: var(--asit); }
.sayac { margin-left: auto; color: var(--soluk); font-size: 14px; }

/* Vaka */
.vaka-bas { padding-block: clamp(36px, 5vw, 72px) clamp(28px, 4vw, 48px); }
.geri { display: flex; width: fit-content; align-items: center; gap: 8px; text-decoration: none; font-weight: 500; min-height: 44px; margin-bottom: 18px; }
.geri svg { width: 18px; transform: rotate(-135deg); }
.vaka-bas h1 { font-size: clamp(48px, 8.4vw, 132px); font-weight: 800; letter-spacing: -.055em; line-height: .9; max-width: 1100px; }
.vaka-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; margin-top: clamp(28px, 4vw, 48px); border-top: 1.5px solid var(--murekkep); }
.vaka-meta div { padding: 16px 16px 0 0; }
.vaka-meta dt { font-size: 13px; color: var(--soluk); }
.vaka-meta dd { margin: 4px 0 0; font-weight: 600; }
.vaka-gorsel { border-radius: clamp(18px, 2.4vw, 32px); overflow: hidden; padding: clamp(20px, 5vw, 80px); }
.vaka-gorsel img { width: 100%; max-height: 720px; object-fit: cover; border-radius: 14px; aspect-ratio: 16 / 10; }
.vaka-metin { display: grid; grid-template-columns: 1fr 1.6fr; gap: clamp(24px, 6vw, 96px); padding-block: clamp(48px, 7vw, 104px) 0; }
.vaka-metin h2 { font-size: clamp(30px, 3.4vw, 46px); letter-spacing: -.04em; }
.vaka-metin p { font-size: clamp(18px, 1.6vw, 21px); line-height: 1.55; margin: 0 0 28px; }
.vaka-metin p.ozet-p { font-size: clamp(22px, 2.2vw, 30px); line-height: 1.35; font-weight: 500; letter-spacing: -.01em; }
.sonuclar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: clamp(40px, 6vw, 80px); }
.sonuc { background: var(--murekkep); color: var(--zemin); border-radius: 22px; padding: clamp(22px, 2.6vw, 34px); min-height: 220px; display: flex; flex-direction: column; justify-content: space-between; gap: 20px; }
.sonuc b small { display: block; font-size: .42em; letter-spacing: -.02em; margin-bottom: 6px; }
.sonuc b { font: 800 clamp(40px, 4.6vw, 68px)/.95 var(--baslik); letter-spacing: -.05em; color: var(--asit); }
.sonuc span { color: #d8d5cd; font-size: 16px; }
.ikili-gorsel { margin-top: 14px; }
.ikili-gorsel img { width: 100%; aspect-ratio: 21 / 9; object-fit: cover; border-radius: 22px; }
.sonraki { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 20px; padding: clamp(32px, 5vw, 64px) 0; border-top: 1.5px solid var(--murekkep); text-decoration: none; margin-top: clamp(48px, 7vw, 96px); }
.sonraki small { color: var(--soluk); font-size: 14px; }
.sonraki b { display: block; font: 800 clamp(36px, 6vw, 84px)/.95 var(--baslik); letter-spacing: -.05em; }
.sonraki .daire { width: clamp(64px, 8vw, 110px); height: clamp(64px, 8vw, 110px); border-radius: 50%; background: var(--asit); border: 1.5px solid var(--murekkep); display: grid; place-items: center; transition: transform .3s; }
.sonraki .daire svg { width: 40%; }
.sonraki:hover .daire { transform: rotate(45deg); }

/* Hizmetler sayfası */
.hizmet-kart { display: grid; grid-template-columns: 110px 1fr 1fr; gap: 28px; padding: clamp(28px, 4vw, 48px) 0; border-top: 1.5px solid var(--murekkep); }
.hizmet-kart .no { font: 800 clamp(40px, 4vw, 60px)/1 var(--baslik); letter-spacing: -.05em; }
.hizmet-kart h2 { font-size: clamp(34px, 4.4vw, 64px); font-weight: 800; letter-spacing: -.05em; }
.hizmet-kart > div > p { color: var(--soluk); font-size: 18px; margin: 14px 0 22px; }
.hizmet-kart ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 0; }
.hizmet-kart li { padding: 12px 0; border-bottom: 1px solid var(--cizgi); display: flex; gap: 12px; align-items: center; }
.hizmet-kart li::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--murekkep); flex: none; }
.fiyat-kutu { display: flex; flex-wrap: wrap; gap: 8px; }
.fiyat-kutu span { padding: 8px 14px; border-radius: 99px; background: var(--kagit); border: 1px solid var(--cizgi); font-size: 14px; }
.fiyat-kutu span b { font-weight: 700; }
.sss { max-width: 960px; }
.sss details { border-bottom: 1.5px solid var(--murekkep); }
.sss summary { list-style: none; cursor: pointer; display: flex; justify-content: space-between; gap: 20px; align-items: center; padding: 24px 0; font: 700 clamp(20px, 2.2vw, 28px)/1.2 var(--baslik); letter-spacing: -.03em; min-height: 44px; }
.sss summary::-webkit-details-marker { display: none; }
.sss summary::after { content: ""; flex: none; width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid var(--murekkep); background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23111' stroke-width='2'%3E%3Cpath d='M12 6v12M6 12h12'/%3E%3C/svg%3E") center / 18px no-repeat; transition: transform .25s, background-color .25s; }
.sss details[open] summary::after { transform: rotate(45deg); background-color: var(--asit); }
.sss details p { margin: 0 0 26px; color: var(--soluk); font-size: 17px; max-width: 760px; }

/* Stüdyo */
.studyo-giris { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(24px, 5vw, 80px); align-items: end; }
.studyo-giris > * { min-width: 0; }
.studyo-giris p { font-size: clamp(19px, 1.7vw, 23px); line-height: 1.5; margin: 0 0 18px; }
.genis-gorsel { border-radius: clamp(20px, 3vw, 36px); overflow: hidden; margin-top: clamp(32px, 5vw, 64px); }
.genis-gorsel img { width: 100%; aspect-ratio: 21 / 9; object-fit: cover; }
.degerler { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.degerler div { background: var(--kagit); border: 1px solid var(--cizgi); border-radius: 22px; padding: clamp(22px, 2.6vw, 32px); }
.degerler b { display: block; font: 700 26px/1.1 var(--baslik); letter-spacing: -.03em; margin-bottom: 10px; }
.degerler p { margin: 0; color: var(--soluk); }
.ekip { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(20px, 3vw, 36px) 16px; }
.uye img { width: 100%; aspect-ratio: 4 / 4.6; object-fit: cover; object-position: top; border-radius: 22px; background: var(--kagit); filter: grayscale(1) contrast(1.05); transition: filter .4s; }
.uye:hover img { filter: none; }
.uye b { display: block; font: 700 22px var(--baslik); letter-spacing: -.03em; margin-top: 14px; }
.uye span { color: var(--soluk); font-size: 15px; }
.kariyer { display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap; background: var(--asit); border: 1.5px solid var(--murekkep); border-radius: 28px; padding: clamp(24px, 4vw, 48px); }
.kariyer h2 { font-size: clamp(32px, 4vw, 56px); font-weight: 800; letter-spacing: -.05em; }
.kariyer p { margin: 8px 0 0; max-width: 560px; }

/* Brif */
.brif { display: grid; grid-template-columns: .8fr 1.2fr; gap: clamp(28px, 5vw, 88px); padding-block: clamp(40px, 6vw, 88px); align-items: start; }
.brif > * { min-width: 0; }
.brif-sol { position: sticky; top: 100px; }
.brif-sol h1 { font-size: clamp(56px, 8vw, 120px); font-weight: 800; letter-spacing: -.06em; line-height: .88; }
.brif-sol p { color: var(--soluk); font-size: 18px; margin: 22px 0; }
.iletisim-kisa { display: grid; gap: 4px; padding-top: 18px; border-top: 1px solid var(--cizgi); }
.iletisim-kisa a { font-weight: 600; text-decoration: none; }
.iletisim-kisa a:hover { text-decoration: underline; }
.adim { border: 0; padding: 0 0 36px; margin: 0 0 36px; border-bottom: 1px solid var(--cizgi); min-width: 0; }
.adim legend { padding: 0; margin-bottom: 18px; font: 700 clamp(24px, 2.4vw, 32px)/1.1 var(--baslik); letter-spacing: -.035em; float: left; width: 100%; }
.adim legend + * { clear: both; }
.adim legend small { display: block; font: 500 15px var(--govde); letter-spacing: 0; color: var(--soluk); margin-top: 6px; }
.secim-cipleri { display: flex; flex-wrap: wrap; gap: 10px; }
.secim-cipleri label { position: relative; display: inline-flex; align-items: center; gap: 8px; min-height: 48px; padding: 10px 20px; border-radius: 99px; border: 1.5px solid var(--murekkep); cursor: pointer; font-weight: 500; font-size: 15px; transition: background .15s; user-select: none; }
.secim-cipleri input { position: absolute; opacity: 0; pointer-events: none; }
.secim-cipleri label:hover { background: var(--kagit); }
.secim-cipleri label:has(input:checked) { background: var(--asit); }
.secim-cipleri label:has(input:checked)::before { content: ""; width: 14px; height: 14px; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23111' stroke-width='3.4'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7.5'/%3E%3C/svg%3E") center / contain no-repeat; }
.secim-cipleri label:has(input:focus-visible) { outline: 2px solid var(--murekkep); outline-offset: 3px; }
.alanlar { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.alan { display: grid; gap: 8px; font-size: 14px; font-weight: 600; }
.alan.genis { grid-column: 1 / -1; }
.alan input, .alan select, .alan textarea { width: 100%; min-height: 54px; padding: 14px 18px; border-radius: 16px; border: 1.5px solid var(--cizgi); background: var(--kagit); color: var(--murekkep); font: 500 16px var(--govde); }
.alan textarea { resize: vertical; }
.alan input:focus, .alan select:focus, .alan textarea:focus { outline: none; border-color: var(--murekkep); background: #fff; }
.alan select { appearance: none; background: var(--kagit) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23111' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") right 16px center / 18px no-repeat; padding-right: 46px; }
.sayac-metin { font-size: 13px; color: var(--soluk); text-align: right; font-weight: 500; }
.onay { display: flex; gap: 12px; align-items: flex-start; font-size: 14.5px; color: var(--soluk); }
.onay input { width: 22px; height: 22px; margin-top: 1px; accent-color: var(--murekkep); flex: none; }
.gonder-satir { display: flex; flex-wrap: wrap; align-items: center; gap: 18px; justify-content: space-between; }
.mesaj { padding: 14px 18px; border-radius: 16px; font-size: 15px; margin-top: 18px; }
.mesaj b { display: block; }
.mesaj.hata { background: #ffe0d6; color: #7a210a; }
.mesaj.bilgi { background: var(--asit); color: var(--murekkep); }
.basari { padding-block: clamp(48px, 8vw, 120px); }
.basari h1 { font-size: clamp(56px, 10vw, 150px); font-weight: 800; letter-spacing: -.06em; line-height: .88; }
.basari p { font-size: 20px; max-width: 640px; margin: 24px 0; }
.basari dl { display: grid; grid-template-columns: 180px 1fr; gap: 12px 24px; max-width: 760px; border-top: 1.5px solid var(--murekkep); padding-top: 22px; margin: 32px 0; }
.basari dt { color: var(--soluk); }
.basari dd { margin: 0; font-weight: 600; }
.metin { max-width: 820px; padding-block: clamp(40px, 6vw, 88px); }
.metin h1 { font-size: clamp(44px, 6vw, 80px); font-weight: 800; letter-spacing: -.05em; margin-bottom: 20px; }
.metin h2 { font-size: 26px; margin: 34px 0 10px; }
.metin p, .metin li { color: var(--soluk); }

.alt { background: var(--gece); color: #c9c6be; padding: clamp(48px, 7vw, 96px) 0 28px; margin-top: clamp(48px, 7vw, 96px); }
.alt-cta { display: flex; align-items: center; justify-content: space-between; gap: 24px; text-decoration: none; color: var(--zemin); padding-bottom: clamp(36px, 5vw, 64px); border-bottom: 1px solid rgba(242, 240, 235, .18); }
.alt-cta span { display: block; font-size: clamp(18px, 2vw, 24px); color: #c9c6be; }
.alt-cta > div { min-width: 0; }
body[data-sayfa="brif"] .alt-cta { display: none; }
body[data-sayfa="brif"] .alt-izgara { padding-top: 0; }
.alt-cta b { display: block; font: 800 clamp(44px, 10.5vw, 168px)/.85 var(--baslik); letter-spacing: -.065em; color: var(--zemin); transition: color .25s; }
.alt-cta:hover b { color: var(--asit); }
.alt-cta svg { width: clamp(44px, 8vw, 120px); flex: none; color: var(--asit); transition: transform .3s; }
.alt-cta:hover svg { transform: rotate(45deg); }
.alt-izgara { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 28px; padding-top: 40px; }
.alt .logo { color: var(--zemin); }
.alt .logo small { color: #a29f97; }
.alt .logo-isaret i { background: var(--zemin); }
.alt .logo-isaret i + i { background: var(--asit); outline-color: var(--zemin); }
.alt h4 { color: var(--zemin); margin: 0 0 10px; font-size: 14px; }
.alt p { margin: 4px 0; font-size: 14.5px; }
.alt a { color: var(--zemin); }
.alt-not { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(242, 240, 235, .18); font-size: 13px; }
.bildirim { position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 180%); background: var(--murekkep); color: var(--zemin); padding: 13px 22px; border-radius: 99px; font-weight: 600; z-index: 60; transition: transform .35s; max-width: calc(100vw - 32px); }
.bildirim.acik { transform: translate(-50%, 0); }

@media (max-width: 1080px) {
  .sayilar, .surec { grid-template-columns: 1fr 1fr; }
  .sayilar div:nth-child(n+3) { border-top: 1px solid rgba(242, 240, 235, .18); margin-top: 20px; }
  .alt-izgara { grid-template-columns: 1fr 1fr; }
  .hizmet-kart { grid-template-columns: 80px 1fr; }
  .hizmet-kart > :last-child { grid-column: 2; }
  .vaka-meta { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 860px) {
  .menu { display: none; position: absolute; left: 12px; right: 12px; top: calc(100% + 8px); flex-direction: column; background: var(--kagit); border: 1.5px solid var(--murekkep); border-radius: 22px; padding: 8px; }
  .menu.acik { display: flex; }
  .menu a { padding: 14px 16px; font-size: 18px; }
  .menu-dugme { display: inline-flex; }
  .ust .dugme.kucuk { margin-left: auto; }
  .kahraman-alt, .studyo-giris, .brif, .vaka-metin { grid-template-columns: 1fr; }
  .kahraman-alt .eylemler { justify-self: start; }
  .vitrin { grid-template-columns: 1fr 1fr; }
  .vitrin a:first-child { grid-column: 1 / -1; aspect-ratio: 16 / 10; }
  .hizmet-satir { grid-template-columns: 56px 1fr 40px; }
  .hizmet-satir p { grid-column: 2; grid-row: 2; }
  .hizmet-satir svg { grid-row: 1 / span 2; grid-column: 3; }
  .sonuclar, .degerler { grid-template-columns: 1fr; }
  .sonuc { min-height: 0; }
  .ekip { grid-template-columns: 1fr 1fr; }
  .brif-sol { position: static; }
}
@media (max-width: 600px) {
  .ust { gap: 10px; }
  .logo small { display: none; }
  .isler { grid-template-columns: 1fr; }
  .isler.kaydir .is-kart:nth-child(2n) { margin-top: 0; }
  .is-kart .bilgi { flex-direction: column; gap: 10px; }
  .haplar { justify-content: flex-start; }
  .kahraman h1 .satir2 { padding-left: 0; }
  .sayilar, .surec { grid-template-columns: 1fr; }
  .sayilar div { border-top: 1px solid rgba(242, 240, 235, .18); margin-top: 0 !important; padding: 20px 0; }
  .sayilar div:first-child { border-top: 0; }
  .alanlar { grid-template-columns: 1fr; }
  .alt-izgara { grid-template-columns: 1fr; }
  .vaka-meta { grid-template-columns: 1fr 1fr; }
  .ikili-gorsel img { aspect-ratio: 4 / 3; }
  .hizmet-kart { grid-template-columns: 1fr; gap: 14px; }
  .hizmet-kart > :last-child { grid-column: 1; }
  .basari dl { grid-template-columns: 1fr; gap: 2px; }
  .basari dd { margin-bottom: 10px; }
  .sayac { margin-left: 0; width: 100%; }
  .serit-ic span, .serit-ic span[class] { font-size: 24px; }
  .serit-ic, .serit-ic span { gap: 40px; }
  .sonraki .daire { width: 56px; height: 56px; }
  .sayfa-bas h1 { font-size: 12vw; }
  .kahraman h1 { font-size: 11.6vw; }
  .metin h1 { font-size: 9.5vw; }
  .vaka-bas h1 { font-size: 10vw; }
  .basari h1 { font-size: 11vw; }
  .sonraki b { font-size: 8.4vw; }
}
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }
`;

const UYGULAMA = ORTAK_JS + String.raw`
/* ── Paralel Stüdyo ──
 * İşler "isler" tablosundan okunur (galerideki canlı önizlemede gömülü yedek listeyle). Brif formu "brifler"
 * tablosuna yazar; ziyaretçi ekleyebilir, okuyamaz. */
var YEDEK = ${JSON.stringify(KAYITLAR)};
var SAYFA = document.body.dataset.sayfa;
var OK = '${OK}';

var isSoz = null;
function isler() {
  if (!isSoz) isSoz = (veriVar() ? vayra.veri.liste("isler", { sirala: "sira", yon: "artan", sinir: 200 }).catch(function () { return YEDEK.slice(); }) : Promise.resolve(YEDEK.slice()))
    .then(function (l) { return l.filter(function (x) { return x.aktif !== false; }); });
  return isSoz;
}
function kartHtml(x) {
  return '<a class="is-kart" href="is.html?id=' + encodeURIComponent(x.id) + '"><div class="gorsel"><img src="' + kacir(x.gorsel) + '" alt="' + kacir(x.musteri + ", " + x.baslik) + '" loading="lazy" /><span class="incele" aria-hidden="true">' + OK + "</span></div>"
    + '<div class="bilgi"><div><h3>' + kacir(x.baslik) + '</h3><span class="musteri">' + kacir(x.musteri) + '</span></div><div class="haplar"><span class="hap">' + kacir(x.kategori) + '</span><span class="hap">' + kacir(x.yil) + "</span></div></div></a>";
}

if (SAYFA === "index") {
  isler().then(function (l) {
    var one = l.filter(function (x) { return x.onecikan; });
    if (one.length < 4) one = one.concat(l.filter(function (x) { return !x.onecikan; })).slice(0, 4);
    $("#secili").innerHTML = one.slice(0, 4).map(kartHtml).join("");
  });
}

if (SAYFA === "isler") {
  var secili = new URLSearchParams(location.search).get("kategori") || "Hepsi", liste = [];
  function ciz() {
    var l = liste.filter(function (x) { return secili === "Hepsi" || x.kategori === secili; });
    $("#liste").innerHTML = l.map(kartHtml).join("") || '<p>Bu kategoride henüz iş yok.</p>';
    $("#sayac").textContent = l.length + " iş";
    $$(".suzgec .cip").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.kategori === secili)); });
  }
  isler().then(function (l) {
    liste = l;
    var kat = ["Hepsi", "Marka", "Web", "Kampanya", "Ürün"];
    $("#cipler").innerHTML = kat.map(function (k) { var n = k === "Hepsi" ? l.length : l.filter(function (x) { return x.kategori === k; }).length; return '<button class="cip" type="button" data-kategori="' + k + '" aria-pressed="false">' + k + "<sup>" + n + "</sup></button>"; }).join("");
    if (kat.indexOf(secili) < 0) secili = "Hepsi";
    ciz();
  });
  $("#cipler").addEventListener("click", function (e) {
    var b = e.target.closest(".cip"); if (!b) return;
    secili = b.dataset.kategori; ciz();
    history.replaceState(null, "", secili === "Hepsi" ? "isler.html" : "isler.html?kategori=" + encodeURIComponent(secili));
  });
}

if (SAYFA === "is") {
  var id = new URLSearchParams(location.search).get("id");
  isler().then(function (l) {
    var i = Math.max(0, l.findIndex(function (x) { return x.id === id; })), x = l[i];
    if (!x) { $("#vaka").innerHTML = '<div class="kap metin"><h1>İş bulunamadı.</h1><a class="dugme" href="isler.html">Bütün işler</a></div>'; return; }
    var sonraki = l[(i + 1) % l.length];
    document.title = x.musteri + ": " + x.baslik + " · Paralel Stüdyo";
    var sonuclar = Array.isArray(x.sonuclar) ? x.sonuclar : [];
    $("#vaka").innerHTML = '<section class="kap vaka-bas"><a class="geri" href="isler.html">' + OK + "Bütün işler</a>"
      + '<span class="etiket">' + kacir(x.musteri) + "</span><h1>" + kacir(x.baslik) + "</h1>"
      + '<dl class="vaka-meta"><div><dt>Müşteri</dt><dd>' + kacir(x.musteri) + "</dd></div><div><dt>Kategori</dt><dd>" + kacir(x.kategori) + "</dd></div><div><dt>Yıl</dt><dd>" + kacir(x.yil) + "</dd></div><div><dt>Yaptıklarımız</dt><dd>" + kacir(x.hizmetler) + "</dd></div></dl></section>"
      + '<section class="kap"><div class="vaka-gorsel" style="background:' + kacir(/^#[0-9a-fA-F]{3,8}$/.test(x.renk || "") ? x.renk : "#e6e3dc") + '"><img src="' + kacir(x.gorsel) + '" alt="' + kacir(x.baslik) + '" /></div>'
      + '<div class="vaka-metin"><h2>Kısaca</h2><div><p class="ozet-p">' + kacir(x.ozet) + "</p></div></div>"
      + '<div class="vaka-metin"><h2>Sorun</h2><div><p>' + kacir(x.sorun) + "</p></div></div>"
      + '<div class="vaka-metin"><h2>Yaklaşım</h2><div><p>' + kacir(x.yaklasim) + "</p></div></div>"
      + (sonuclar.length ? '<div class="sonuclar">' + sonuclar.map(function (s) { var d = String(s.deger || ""), m = /^(yüzde) (.+)$/.exec(d); return '<div class="sonuc"><b>' + (m ? "<small>" + m[1] + "</small>" + kacir(m[2]) : kacir(d)) + "</b><span>" + kacir(s.aciklama) + "</span></div>"; }).join("") + "</div>" : "")
      + (x.ikinciGorsel ? '<div class="ikili-gorsel"><img src="' + kacir(x.ikinciGorsel) + '" alt="" loading="lazy" /></div>' : "")
      + '<a class="sonraki" href="is.html?id=' + encodeURIComponent(sonraki.id) + '"><div><small>Sıradaki iş · ' + kacir(sonraki.musteri) + "</small><b>" + kacir(sonraki.baslik) + '</b></div><span class="daire">' + OK + "</span></a></section>";
    window.scrollTo(0, 0);
  });
}

if (SAYFA === "brif") {
  var form = $("#brif"), mesaj = $("#mesaj"), q = new URLSearchParams(location.search);
  if (q.get("hizmet")) $$("input[name=hizmet]").forEach(function (c) { if (c.value === q.get("hizmet")) c.checked = true; });
  var ta = $("textarea[name=mesaj]");
  function say() { $("#karakter").textContent = ta.value.length + " / 1500"; }
  ta.addEventListener("input", say); say();
  function goster(tur, baslik, metin) { mesaj.hidden = false; mesaj.className = "mesaj " + tur; mesaj.innerHTML = "<b>" + kacir(baslik) + "</b>" + kacir(metin || ""); mesaj.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  form.addEventListener("submit", function (e) {
    e.preventDefault(); mesaj.hidden = true;
    var f = new FormData(form), hizmetler = f.getAll("hizmet");
    if (!hizmetler.length) { $("#hizmetAlan").scrollIntoView({ block: "center", behavior: "smooth" }); return goster("hata", "En az bir hizmet seç.", "Neye ihtiyacın olduğunu bilirsek doğru kişiyle dönelim."); }
    if (!f.get("butce")) { $("#butceAlan").scrollIntoView({ block: "center", behavior: "smooth" }); return goster("hata", "Bir bütçe aralığı seç.", "Kesin değilse Henüz bilmiyorum seçeneği de olur."); }
    if (!form.reportValidity()) return;
    var kayit = { ad: String(f.get("ad")).trim(), sirket: String(f.get("sirket")).trim(), eposta: String(f.get("eposta")).trim(), telefon: String(f.get("telefon") || "").trim() || null, web: String(f.get("web") || "").trim() || null, hizmetler: hizmetler.join(", "), butce: f.get("butce"), zaman: f.get("zaman") || null, mesaj: String(f.get("mesaj")).trim(), kaynak: f.get("kaynak") || null, kvkk: true };
    if (!veriVar()) return goster("bilgi", "Bu canlı önizlemede brif kaydedilmez.", "Şablonu kullanınca brifler veritabanındaki brifler tablosuna düşer.");
    var d = $("#gonder"); d.disabled = true; d.firstChild.textContent = "Gönderiliyor… ";
    vayra.veri.ekle("brifler", kayit).then(function () {
      olay("brif", { butce: kayit.butce, hizmet: hizmetler.length });
      $("#icerik").innerHTML = '<section class="kap basari" role="status"><span class="etiket">Brifin bize ulaştı</span><h1>Teşekkürler, ' + kacir(kayit.ad.split(" ")[0]) + ".</h1><p>Brifini okuyup iki iş günü içinde " + kacir(kayit.eposta) + " adresine yazacağız. Uygunsa ilk görüşmeyi stüdyoda kahve eşliğinde yapalım.</p>"
        + "<dl><dt>Şirket</dt><dd>" + kacir(kayit.sirket) + "</dd><dt>Hizmetler</dt><dd>" + kacir(kayit.hizmetler) + "</dd><dt>Bütçe</dt><dd>" + kacir(kayit.butce) + "</dd><dt>Zaman</dt><dd>" + kacir(kayit.zaman || "Belirtilmedi") + "</dd></dl>"
        + '<div class="eylemler"><a class="dugme" href="isler.html">İşlere göz at ' + OK + '</a><a class="dugme cizgili" href="index.html">Ana sayfa</a></div></section>';
      window.scrollTo(0, 0);
    }).catch(function (err) {
      goster("hata", "Brif gönderilemedi.", (err && err.message ? err.message + ". " : "") + "Yeniden dene ya da merhaba@paralelstudyo.com adresine yaz.");
      d.disabled = false; d.firstChild.textContent = "Brifi gönder ";
    });
  });
}
`;

const serit = MUSTERILER.map(([a, c]) => `<span class="${c}">${a}</span>`).join("");

export const DIJITAL_AJANS = {
  id: "dijital-ajans",
  ad: "Paralel Stüdyo · Dijital Ajans",
  tur: "site" as const,
  aciklama: "Karaköy'de tasarım ajansı: tablodan iş portfolyosu ve kategori süzgeci, sonuçlu vaka sayfaları, hizmetler ve SSS, ekip, veritabanına yazan brif formu",
  kapak: "/gercek/build/sablon/dijital-ajans.webp",
  tablolar: TABLOLAR,
  dosyalar: {
    "index.html": sayfa("index.html", "Paralel Stüdyo · Marka, web ve dijital ürün tasarımı", "Karaköy'de bağımsız tasarım stüdyosu: marka kimliği, web siteleri, mobil uygulamalar ve kampanyalar.", `<section class="kap kahraman">
  <span class="musait"><i></i>2027 ilk çeyreği için iki proje yerimiz var</span>
  <h1>Markaya <span class="vurgu">biçim,</span><span class="satir2">ürüne hareket.</span></h1>
  <div class="kahraman-alt">
    <p>Paralel, Karaköy'de on altı kişilik bağımsız bir tasarım stüdyosu. Markaların kimliğini, sitesini ve uygulamasını aynı masada, strateji ile kodu ayırmadan tasarlıyoruz.</p>
    <div class="eylemler"><a class="dugme" href="isler.html">İşlerimiz ${OK}</a><a class="dugme cizgili" href="brif.html">Brif ver</a></div>
  </div>
  <div class="vitrin">
    <a href="is.html?id=kervan-lojistik"><img src="/gercek/galeri/3d2.webp" alt="Kervan Lojistik için tasarlanan şehir görseli" /><span>Kervan Lojistik</span></a>
    <a href="is.html?id=mira-kozmetik"><img src="/gercek/galeri/urun1.webp" alt="Mira Kozmetik şişesi" /><span>Mira Kozmetik</span></a>
    <a href="is.html?id=bicim-muzesi"><img src="/gercek/galeri/3d3.webp" alt="Biçim Müzesi düğüm logosu" /><span>Biçim Müzesi</span></a>
  </div>
</section>
<div class="serit" aria-label="Birlikte çalıştığımız markalar"><div class="serit-ic">${serit}<span aria-hidden="true" class="m1">Mira</span>${MUSTERILER.slice(1).map(([a, c]) => `<span class="${c}" aria-hidden="true">${a}</span>`).join("")}</div></div>
<section class="kap bolum">
  <div class="bolum-ust"><div><span class="etiket">Seçili işler</span><h2>Son işler</h2></div><p>Her proje bir sorunla başlıyor ve ölçülebilir bir sonuçla bitiyor. Vaka sayfalarında ikisini de açıkça yazıyoruz.</p></div>
  <div class="isler kaydir" id="secili" aria-live="polite"></div>
  <div style="margin-top:56px;display:flex;justify-content:center"><a class="dugme cizgili" href="isler.html">Bütün işler ${OK}</a></div>
</section>
<section class="kap bolum" style="padding-top:0">
  <div class="bolum-ust"><div><span class="etiket">Ne yapıyoruz</span><h2>Hizmetler</h2></div><p>Dört disiplin, tek ekip. Çoğu projede ikisi ya da üçü birlikte çalışıyor.</p></div>
  <div class="hizmet-satirlar">
${HIZMETLER.map((h) => `    <a class="hizmet-satir" href="hizmetler.html#h${h.no}"><span class="no">${h.no}</span><h3>${kirma(h.ad)}</h3><p>${h.kisa}</p>${OK}</a>`).join("\n")}
  </div>
</section>
<section class="koyu">
  <div class="kap bolum">
    <div class="bolum-ust"><div><span class="etiket" style="color:var(--zemin)">Rakamlarla</span><h2>On iki yıl,<br />yüz kırk proje.</h2></div><p>Müşterilerimizin çoğu ikinci, üçüncü projede de bizimle. Bunu en iyi referansımız sayıyoruz.</p></div>
    <div class="sayilar">
      <div><b><small>&nbsp;</small>140</b><span>tamamlanan proje, 2014'ten beri</span></div>
      <div><b><small>&nbsp;</small>16</b><span>kişilik ekip: tasarımcı, yazılımcı, stratejist</span></div>
      <div><b><small>yüzde</small>72</b><span>müşteri ikinci projeye dönüyor</span></div>
      <div><b><small>&nbsp;</small>23</b><span>ulusal ve uluslararası tasarım ödülü</span></div>
    </div>
    <div class="surec">
      <div><small>1</small><h3>Dinleme</h3><p>İlk iki hafta sorular soruyor, kullanıcılarla ve ekibinle konuşuyoruz.</p></div>
      <div><small>2</small><h3>Yön</h3><p>Üç farklı yön sunuyor, birini birlikte seçip derinleştiriyoruz.</p></div>
      <div><small>3</small><h3>Yapım</h3><p>Tasarım ve kod aynı anda ilerliyor; her hafta çalışan bir sürüm görüyorsun.</p></div>
      <div><small>4</small><h3>Yayın ve ölçüm</h3><p>Yayından sonra üç ay sonuçları birlikte izleyip iyileştiriyoruz.</p></div>
    </div>
  </div>
</section>`),
    "isler.html": sayfa("isler.html", "İşler · Paralel Stüdyo", "Paralel Stüdyo'nun marka, web, kampanya ve dijital ürün işleri.", `<section class="kap sayfa-bas">
  <h1>İşler</h1>
  <p>2014'ten bu yana tasarladığımız markalardan, sitelerden ve uygulamalardan bir seçki. Her vakada sorunu, yaklaşımı ve sonucu yazdık.</p>
</section>
<section class="kap">
  <div class="suzgec"><div id="cipler" role="group" aria-label="Kategori" style="display:flex;flex-wrap:wrap;gap:8px"></div><span class="sayac" id="sayac" aria-live="polite"></span></div>
  <div class="isler kaydir" id="liste"></div>
</section>`),
    "is.html": sayfa("is.html", "Vaka · Paralel Stüdyo", "Paralel Stüdyo vaka çalışması: sorun, yaklaşım ve sonuçlar.", `<div id="vaka" aria-live="polite"><section class="kap vaka-bas"><p>Vaka yükleniyor…</p></section></div>`),
    "hizmetler.html": sayfa("hizmetler.html", "Hizmetler · Paralel Stüdyo", "Marka kimliği, web ve e-ticaret, dijital ürün, kampanya ve hareket tasarımı. Süreler ve başlangıç bütçeleri.", `<section class="kap sayfa-bas">
  <h1>Hizmetler</h1>
  <p>Süreler ve başlangıç bütçeleri ortalamadır; ilk görüşmeden sonra kapsamı netleştirip yazılı teklif veriyoruz.</p>
</section>
<section class="kap">
${HIZMETLER.map((h) => `  <article class="hizmet-kart" id="h${h.no}">
    <span class="no">${h.no}</span>
    <div><h2>${kirma(h.ad)}</h2><p>${h.kisa}</p><div class="fiyat-kutu"><span>Süre <b>${h.sure}</b></span><span><b>${h.baslangic}</b> ile başlar</span></div><div style="margin-top:22px"><a class="dugme kucuk" href="brif.html?hizmet=${encodeURIComponent(h.ad === "Web ve e-ticaret" ? "Web sitesi" : h.ad === "Dijital ürün" ? "Mobil uygulama" : h.ad === "Kampanya ve hareket" ? "Kampanya" : h.ad)}">Bu hizmet için brif ver</a></div></div>
    <ul>${h.teslim.map((t) => `<li>${t}</li>`).join("")}</ul>
  </article>`).join("\n")}
</section>
<section class="kap bolum">
  <div class="bolum-ust"><div><span class="etiket">Sık sorulanlar</span><h2>Sorular</h2></div></div>
  <div class="sss">
    <details open><summary>Küçük bir işletmeyiz, bizimle de çalışır mısınız?</summary><p>Evet. Yılda birkaç projeyi yerel işletmelere ve kurulduğu ilk yılındaki girişimlere ayırıyoruz. Bütçen sınırlıysa kapsamı birlikte küçültüp en önemli parçadan başlıyoruz.</p></details>
    <details><summary>Teklif ne kadar sürede gelir?</summary><p>Brifini aldıktan sonra iki iş günü içinde ilk görüşmeyi ayarlıyoruz. Görüşmeden sonraki bir hafta içinde kapsamı, takvimi ve ücreti gösteren yazılı teklif gönderiyoruz.</p></details>
    <details><summary>Ödeme nasıl yapılıyor?</summary><p>Çoğu projede ücretin yüzde 40'ı başlangıçta, yüzde 30'u tasarım onayında, kalan yüzde 30'u teslimde faturalanır. Uzun projelerde aylık ödeme planı da yapıyoruz.</p></details>
    <details><summary>Site ya da uygulama yayına çıktıktan sonra ne oluyor?</summary><p>Her projeden sonra üç ay ücretsiz destek veriyoruz. Sonrasında isteyenlerle aylık bakım ve geliştirme anlaşması yapıyoruz; istemeyenlere bütün kaynak dosyaları ve belgeleri teslim ediyoruz.</p></details>
    <details><summary>Yurt dışındaki markalarla çalışıyor musunuz?</summary><p>Evet, işlerimizin üçte biri Avrupa ve Körfez'deki müşterilerimiz için. Toplantıları çevrim içi yapıyor, gerekirse atölye için yanınıza geliyoruz.</p></details>
  </div>
</section>`),
    "studyo.html": sayfa("studyo.html", "Stüdyo · Paralel Stüdyo", "Paralel Stüdyo ekibi, çalışma biçimimiz ve açık pozisyonlar.", `<section class="kap sayfa-bas">
  <div class="studyo-giris">
    <h1>Stüdyo</h1>
    <div><p>Paralel'i 2014'te iki tasarımcı ve bir yazılımcı, tasarımın kodla aynı masada yapılması gerektiğine inandığı için kurdu.</p><p style="color:var(--soluk);font-size:17px">Bugün Karaköy'de, eski bir han binasının üçüncü katında on altı kişiyiz. Her projeye baştan sona aynı küçük ekip bakıyor; işi devretmiyor, satmıyoruz.</p></div>
  </div>
  <div class="genis-gorsel"><img src="/gercek/havuz/gorsel/mk-is-914.webp" alt="Stüdyonun açık çalışma alanı" /></div>
</section>
<section class="kap bolum">
  <div class="bolum-ust"><div><span class="etiket">Nasıl çalışıyoruz</span><h2>İlkeler</h2></div></div>
  <div class="degerler">
    <div><b>Önce dinle</b><p>Her proje, müşterinin ve kullanıcılarının anlattıklarıyla başlar. İlk toplantıda hiçbir şey çizmeyiz.</p></div>
    <div><b>Çalışan sürüm</b><p>Sunum dosyası yerine her hafta tıklanabilen bir prototip ya da yayındaki bir sayfa gösteririz.</p></div>
    <div><b>Ölçülebilir sonuç</b><p>Başlarken neyi başarı sayacağımızı birlikte yazarız; bitince de açıkça ölçeriz.</p></div>
  </div>
</section>
<section class="kap bolum" style="padding-top:0">
  <div class="bolum-ust"><div><span class="etiket">Ekip</span><h2>Masada kimler var</h2></div><p>Projelerin başında bu altı kişiden en az ikisi oluyor.</p></div>
  <div class="ekip">
${EKIP.map((u) => `    <div class="uye"><img src="${u.foto}" alt="${u.ad}" loading="lazy" /><b>${u.ad}</b><span>${u.rol}</span></div>`).join("\n")}
  </div>
</section>
<section class="kap">
  <div class="kariyer"><div><h2>Ekibe katıl</h2><p>Şu an kıdemli bir arayüz geliştiricisi ve bir yazı yazarı arıyoruz. Portfolyonu ve kısa bir notu gönder.</p></div><a class="dugme" href="mailto:kariyer@paralelstudyo.com">kariyer@paralelstudyo.com</a></div>
</section>
<section class="kap bolum">
  <div class="studyo-giris" style="align-items:start">
    <div><span class="etiket">Gel, kahve içelim</span><h2 style="font-size:clamp(36px,5vw,72px);font-weight:800;letter-spacing:-.05em">Karaköy, üçüncü kat.</h2><p style="color:var(--soluk);margin-top:16px">Kemankeş Karamustafa Paşa Mah. Halil Paşa Sok. No: 6, Beyoğlu / İstanbul. Karaköy tramvay durağına iki dakika. Hafta içi 09.30 ile 18.30 arası açığız.</p></div>
    <div class="genis-gorsel" style="margin-top:0"><img src="/gercek/havuz/gorsel/mk-is-4872.webp" alt="Stüdyoda birlikte çalışan iki ekip üyesi" loading="lazy" style="aspect-ratio:16/10" /></div>
  </div>
</section>`),
    "brif.html": sayfa("brif.html", "Brif ver · Paralel Stüdyo", "Projeni anlat: hizmet, bütçe ve takvim. İki iş günü içinde dönüyoruz.", `<section class="kap brif">
  <div class="brif-sol">
    <span class="etiket">Yeni proje</span>
    <h1>Brif ver</h1>
    <p>Birkaç soruya cevap ver, iki iş günü içinde sana yazalım. Kesin bilmediğin yerleri boş bırakabilirsin; ilk görüşme zaten bunun için.</p>
    <div class="iletisim-kisa"><a href="mailto:merhaba@paralelstudyo.com">merhaba@paralelstudyo.com</a><a href="tel:+902122523890">0212 252 38 90</a></div>
  </div>
  <form id="brif" novalidate>
    <fieldset class="adim" id="hizmetAlan">
      <legend>Neye ihtiyacın var?<small>Birden fazla seçebilirsin.</small></legend>
      <div class="secim-cipleri">
${HIZMET_SECENEK.map((h) => `        <label><input type="checkbox" name="hizmet" value="${h}" />${h}</label>`).join("\n")}
      </div>
    </fieldset>
    <fieldset class="adim" id="butceAlan">
      <legend>Bütçe aralığın<small>Proje için ayırdığın yaklaşık tutar, KDV hariç.</small></legend>
      <div class="secim-cipleri">
${BUTCELER.map((b) => `        <label><input type="radio" name="butce" value="${b}" />${b}</label>`).join("\n")}
      </div>
    </fieldset>
    <fieldset class="adim">
      <legend>Proje ve iletişim</legend>
      <div class="alanlar">
        <label class="alan">Adın soyadın<input name="ad" required minlength="3" autocomplete="name" /></label>
        <label class="alan">Şirket ya da marka<input name="sirket" required autocomplete="organization" /></label>
        <label class="alan">E-posta<input name="eposta" type="email" required autocomplete="email" inputmode="email" /></label>
        <label class="alan">Telefon (isteğe bağlı)<input name="telefon" type="tel" autocomplete="tel" inputmode="tel" /></label>
        <label class="alan">Mevcut siten (isteğe bağlı)<input name="web" autocomplete="url" placeholder="markan.com.tr" /></label>
        <label class="alan">Ne zaman başlamak istiyorsun?<select name="zaman">${ZAMANLAR.map((z) => `<option>${z}</option>`).join("")}</select></label>
        <label class="alan genis">Projeyi anlat<textarea name="mesaj" rows="6" required minlength="20" maxlength="1500" placeholder="Ne yapıyorsunuz, neyi değiştirmek istiyorsunuz, başarıyı nasıl ölçeceksiniz?"></textarea><span class="sayac-metin" id="karakter" aria-live="polite"></span></label>
        <label class="alan genis">Bizi nereden duydun?<select name="kaynak"><option value="">Seç</option><option>Arama motoru</option><option>Tavsiye</option><option>Sosyal medya</option><option>Bir işinizi gördüm</option><option>Diğer</option></select></label>
      </div>
    </fieldset>
    <div class="gonder-satir">
      <label class="onay"><input type="checkbox" name="kvkk" required /> <span><a href="kvkk.html" target="_blank" rel="noopener">Aydınlatma metnini</a> okudum; brifime dönüş yapılması için bilgilerimin işlenmesini kabul ediyorum.</span></label>
      <button class="dugme asit" id="gonder" type="submit">Brifi gönder ${OK}</button>
    </div>
    <div id="mesaj" class="mesaj" role="alert" hidden></div>
  </form>
</section>`),
    "kvkk.html": sayfa("kvkk.html", "KVKK aydınlatma metni · Paralel Stüdyo", "Paralel Stüdyo brif formu aydınlatma metni.", `<section class="kap metin">
  <h1>Aydınlatma metni</h1>
  <p>Paralel Tasarım ve Yazılım A.Ş. olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca brif formu ve e-posta yoluyla ilettiğiniz kişisel veriler hakkında sizi bilgilendiririz.</p>
  <h2>İşlenen veriler</h2>
  <ul><li>Kimlik ve iletişim: ad soyad, e-posta, telefon</li><li>İş bilgisi: şirket adı, web sitesi, proje açıklaması, bütçe aralığı</li></ul>
  <h2>Amaç ve hukuki sebep</h2>
  <p>Verileriniz proje talebinizi değerlendirmek, sizinle iletişime geçmek ve teklif hazırlamak amacıyla, Kanun'un 5/2-c maddesi (sözleşmenin kurulmasıyla doğrudan ilgili olması) uyarınca işlenir.</p>
  <h2>Saklama ve aktarım</h2>
  <p>Brifler iki yıl saklanır. Verileriniz yalnız barındırma hizmeti aldığımız sağlayıcıda tutulur ve pazarlama amacıyla üçüncü kişilerle paylaşılmaz.</p>
  <h2>Haklarınız</h2>
  <p>Kanun'un 11. maddesindeki haklarınız için kvkk@paralelstudyo.com adresine yazabilirsiniz. Başvurunuz en geç 30 gün içinde yanıtlanır.</p>
  <p><a class="dugme" href="brif.html">Brif formuna dön</a></p>
</section>`),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#111"/><g transform="skewX(-14) translate(14 0)"><rect x="12" y="16" width="16" height="32" rx="3" fill="#f2f0eb"/><rect x="32" y="16" width="16" height="32" rx="3" fill="#d4ff3a"/></g></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
  } as Record<string, string>,
};
