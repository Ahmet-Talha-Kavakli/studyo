/* Şablon: Leylak Çiçek Atölyesi — Nişantaşı'nda çiçekçi. Ürünler "urunler" tablosundan (boy seçenekleri ve fiyatları, günlük stok),
 * kategori süzgeci, ürün sayfası, localStorage sepeti, teslimat günü ve saat aralığı (İstanbul saatiyle 14.00'e kadar aynı gün,
 * pazar teslimat yok), semte göre teslimat ücreti, kart notu. Sipariş api/siparis.js sunucu fonksiyonuyla verilir: fiyat ve
 * stok sunucuda tablodan hesaplanır, "siparisler" tablosuna yazılır (ziyaretçi okuyamaz), stok düşer; aynı fonksiyon kod ve
 * telefonun son dört hanesiyle sipariş durumunu verir. Haftalık abonelik, düğün ve kurumsal talep formu. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";

const G = (d: string) => `/gercek/havuz/gorsel/${d}.webp`;
const URUNLER = [
  { id: "pazar-buketi", ad: "Pazar Buketi", kategori: "Buket", gorsel: G("mk-doga-4742"), fiyatS: 950, fiyatM: 1350, fiyatL: 1900, stok: 14, onecikan: true, cicekler: "Şakayık, ortanca, düğün çiçeği, okaliptüs", aciklama: "Haftanın en güzel çiçekleriyle elde bağlanan, pastel tonlu bol buket. Her sabah çiçek halinden gelen taze dallarla hazırlanır; içeriği mevsime göre değişir, tonlar aynı kalır." },
  { id: "pembe-dus", ad: "Pembe Düş", kategori: "Buket", gorsel: G("mk-doga-1186"), fiyatS: 890, fiyatM: 1250, fiyatL: 1750, stok: 10, onecikan: true, cicekler: "Pembe gül, karanfil, lisiantus", aciklama: "Pembenin bütün tonlarıyla romantik ve hafif bir buket. Doğum günü ve yıl dönümü siparişlerinde en çok seçilen tasarımımız." },
  { id: "beyaz-sukunet", ad: "Beyaz Sükûnet", kategori: "Buket", gorsel: G("mk-doga-1187"), fiyatS: 990, fiyatM: 1400, fiyatL: 1950, stok: 8, onecikan: false, cicekler: "Beyaz gül, frezya, kokulu yasemin dalı", aciklama: "Bembeyaz çiçeklerle sade ve zarif bir buket. Taziye, geçmiş olsun ve yeni doğan ziyaretleri için de uygundur; istersen kart notunu biz yazalım." },
  { id: "kir-buketi", ad: "Kır Buketi", kategori: "Buket", gorsel: G("mk-doga-2854"), fiyatS: 690, fiyatM: 980, fiyatL: 1380, stok: 16, onecikan: true, cicekler: "Papatya, mor salkım, kır çiçekleri", aciklama: "Sanki az önce bir kır yolundan toplanmış gibi, serbest ve neşeli bir buket. Kâğıda değil keten kumaşa sarılır." },
  { id: "aycicegi-kucagi", ad: "Ayçiçeği Kucağı", kategori: "Buket", gorsel: G("mk-doga-4881"), fiyatS: 780, fiyatM: 1120, fiyatL: 1590, stok: 12, onecikan: false, cicekler: "Ayçiçeği, solidago, buğday başağı", aciklama: "Güneş gibi sarı ayçiçekleri ve buğday başaklarıyla enerjik bir buket. Yeni iş, mezuniyet ve tebrik siparişlerinin sevilen seçimi." },
  { id: "fusya-aranjman", ad: "Fuşya Aranjman", kategori: "Aranjman", gorsel: G("mk-doga-1168"), fiyatS: null, fiyatM: 1650, fiyatL: 2400, stok: 6, onecikan: true, cicekler: "Fuşya orkide, begonvil dalı, sukulent", aciklama: "El yapımı seramik kâse içinde, suya ihtiyaç duymayan çiçek süngeri üzerinde kurulan canlı renkli aranjman. Ofis masası ve resepsiyonlar için." },
  { id: "saksida-sardunya", ad: "Saksıda Sardunya", kategori: "Saksı", gorsel: G("mk-doga-1780"), fiyatS: null, fiyatM: 640, fiyatL: null, stok: 20, onecikan: false, cicekler: "Kırmızı sardunya, pişmiş toprak saksı", aciklama: "Balkonu bütün yaz çiçekli tutacak, bakımı kolay sardunya. 16 santimlik pişmiş toprak saksıda, bakım kartıyla birlikte gönderilir." },
  { id: "lavanta-demeti", ad: "Kuru Lavanta Demeti", kategori: "Kuru çiçek", gorsel: G("mk-yasam-962"), fiyatS: null, fiyatM: 420, fiyatL: null, stok: 30, onecikan: false, cicekler: "Isparta lavantası, rafya kurdele", aciklama: "Isparta'dan gelen, gölgede kurutulmuş lavanta demeti. Aylarca rengini ve kokusunu korur; dolap ve çekmeceler için de birebir." },
  { id: "haftalik-seckin", ad: "Haftalık Atölye Seçkisi", kategori: "Abonelik", gorsel: "/gercek/galeri/manzara6.webp", fiyatS: 2900, fiyatM: 4200, fiyatL: 5900, stok: 40, onecikan: false, cicekler: "Her hafta mevsimin çiçekleri, dört teslimat", aciklama: "Dört hafta boyunca, seçtiğin gün kapına mevsimin en güzel çiçekleriyle hazırlanmış bir buket. Fiyat dört teslimat içindir; ilk teslimatı aşağıda seçtiğin gün yaparız, sonrakiler her hafta aynı gün gelir." },
].map((u, i) => ({ sira: i + 1, aktif: true, ...u }));

const KATEGORILER = ["Buket", "Aranjman", "Saksı", "Kuru çiçek", "Abonelik"];
const BOY_AD: Record<string, string> = { S: "Küçük", M: "Orta", L: "Büyük" };
const BOLGELER = [
  { id: "nisantasi", ad: "Nişantaşı, Teşvikiye, Maçka", ucret: 0 },
  { id: "merkez", ad: "Şişli, Beşiktaş, Beyoğlu", ucret: 120 },
  { id: "avrupa", ad: "Avrupa yakasında diğer semtler", ucret: 220 },
  { id: "kadikoy", ad: "Kadıköy, Üsküdar, Moda", ucret: 180 },
  { id: "anadolu", ad: "Anadolu yakasında diğer semtler", ucret: 260 },
];
const ARALIKLAR = ["10.00 ile 13.00", "13.00 ile 17.00", "17.00 ile 20.00"];
const KESIM = "14:00";

const TABLOLAR: Record<string, SablonTablo> = {
  urunler: {
    aciklama: "Satılan çiçekler. fiyatS, fiyatM, fiyatL: küçük, orta, büyük boy fiyatları (TL); boş bırakılan boy satılmaz. stok günlük adettir, sipariş verildikçe düşer. Siparişte fiyat ve stok sunucuda bu tablodan okunur.",
    kurallar: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" },
    sema: [
      { ad: "ad", tur: "metin", zorunlu: true },
      { ad: "kategori", tur: "secim", zorunlu: true, secenekler: KATEGORILER },
      { ad: "aciklama", tur: "uzunMetin" },
      { ad: "cicekler", tur: "metin", aciklama: "Buketteki çiçekler" },
      { ad: "gorsel", tur: "gorsel" },
      { ad: "fiyatS", tur: "sayi", aciklama: "Küçük boy, TL" },
      { ad: "fiyatM", tur: "sayi", aciklama: "Orta boy ya da tek boy, TL" },
      { ad: "fiyatL", tur: "sayi", aciklama: "Büyük boy, TL" },
      { ad: "stok", tur: "sayi", aciklama: "Günlük adet; boşsa sınırsız" },
      { ad: "onecikan", tur: "mantiksal", varsayilan: false },
      { ad: "sira", tur: "sayi" },
      { ad: "aktif", tur: "mantiksal", varsayilan: true },
    ],
    kayitlar: URUNLER,
  },
  siparisler: {
    aciklama: "Siparişler. Yalnız api/siparis.js sunucu fonksiyonu yazar (fiyat, teslimat kuralı ve stok denetimiyle); ziyaretçi okuyamaz ve doğrudan yazamaz. Ödeme bağlantısı onaydan sonra gönderilir.",
    kurallar: { okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" },
    sema: [
      { ad: "kod", tur: "metin", zorunlu: true, benzersiz: true },
      { ad: "kalemler", tur: "json", zorunlu: true, aciklama: "Ürün, boy, adet, birim fiyat" },
      { ad: "araToplam", tur: "sayi" },
      { ad: "teslimatUcreti", tur: "sayi" },
      { ad: "tutar", tur: "sayi", zorunlu: true },
      { ad: "teslimTarihi", tur: "metin", zorunlu: true, aciklama: "YYYY-AA-GG" },
      { ad: "teslimAraligi", tur: "secim", secenekler: ARALIKLAR },
      { ad: "bolge", tur: "secim", secenekler: BOLGELER.map((b) => b.ad) },
      { ad: "adres", tur: "uzunMetin", zorunlu: true },
      { ad: "alici", tur: "metin", zorunlu: true },
      { ad: "aliciTelefon", tur: "metin", zorunlu: true },
      { ad: "kartNotu", tur: "uzunMetin" },
      { ad: "imzasiz", tur: "mantiksal", aciklama: "Kartta gönderen adı yazılmasın" },
      { ad: "gonderen", tur: "metin", zorunlu: true },
      { ad: "telefon", tur: "metin", zorunlu: true },
      { ad: "eposta", tur: "eposta" },
      { ad: "kvkk", tur: "mantiksal", zorunlu: true },
      { ad: "durum", tur: "secim", secenekler: ["Alındı", "Ödeme bekleniyor", "Hazırlanıyor", "Yolda", "Teslim edildi", "İptal"], varsayilan: "Alındı" },
    ],
    kayitlar: [],
  },
};

const ust = (aktif: string) => `<a class="atla" href="#icerik">İçeriğe geç</a>
<div class="duyuru" id="duyuru">Nişantaşı, Teşvikiye ve Maçka'ya teslimat ücretsiz. <span id="kesimSayac">Bugün teslimat için siparişler 14.00'e kadar.</span></div>
<header class="ust">
  <a class="logo" href="index.html" aria-label="Leylak Çiçek Atölyesi ana sayfa"><svg viewBox="0 0 40 40" aria-hidden="true"><g fill="currentColor"><circle cx="20" cy="11" r="5"/><circle cx="12" cy="18" r="5"/><circle cx="28" cy="18" r="5"/><circle cx="15.5" cy="27" r="5"/><circle cx="24.5" cy="27" r="5"/></g><circle cx="20" cy="20" r="3.4" fill="#f7ece8"/></svg><span>Leylak<small>Çiçek Atölyesi</small></span></a>
  <nav class="menu" data-menu aria-label="Ana menü">
${[["magaza.html", "Çiçekler"], ["abonelik.html", "Abonelik"], ["kurumsal.html", "Düğün ve kurumsal"], ["siparis.html", "Sipariş takibi"]].map(([h, a]) => `    <a href="${h}"${h === aktif || (aktif === "urun.html" && h === "magaza.html") ? ' aria-current="page"' : ""}>${a}</a>`).join("\n")}
  </nav>
  <a class="sepet" href="sepet.html" aria-label="Sepet"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1 12H7z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg><span class="sepet-yazi">Sepet</span><b id="sepetSayi">0</b></a>
  <button class="menu-dugme" type="button" data-menu-ac aria-expanded="false" aria-label="Menüyü aç"><span></span><span></span></button>
</header>`;

const alt = `<footer class="alt">
  <div class="alt-ic">
    <div><span class="alt-logo">Leylak</span><p>2015'ten beri Nişantaşı'nda, her sabah çiçek halinden gelen taze dallarla elde bağlanan buketler.</p></div>
    <div><h4>Atölye</h4><p>Atiye Sok. No: 14, Teşvikiye<br />Şişli / İstanbul</p><p>Pazartesi ile cumartesi 09.00 ile 20.00</p></div>
    <div><h4>Yardım</h4><p><a href="siparis.html">Sipariş takibi</a></p><p><a href="teslimat.html">Teslimat ve iade</a></p><p><a href="kvkk.html">KVKK aydınlatma metni</a></p></div>
    <div><h4>Bize ulaş</h4><p><a href="tel:+902122513040">0212 251 30 40</a></p><p><a href="https://wa.me/905322513040">WhatsApp ile sipariş</a></p><p><a href="mailto:merhaba@leylakcicek.com">merhaba@leylakcicek.com</a></p></div>
  </div>
  <p class="alt-not">Çiçekler doğal üründür; buketteki çiçekler mevsime göre benzer renk ve tondaki başka çiçeklerle değiştirilebilir.</p>
</footer>`;

const sayfa = (dosya: string, baslik: string, aciklama: string, govde: string) => `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${baslik}</title>
  <meta name="description" content="${aciklama}" />
  <meta name="theme-color" content="#f7ece8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gilda+Display&family=Karla:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" />
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

const enDusuk = (u: (typeof URUNLER)[number]) => Math.min(...[u.fiyatS, u.fiyatM, u.fiyatL].filter((x): x is number => typeof x === "number"));
const urunKarti = (u: (typeof URUNLER)[number]) => `<a class="urun" href="urun.html?id=${u.id}"><div class="urun-foto"><img src="${u.gorsel}" alt="${u.ad}" loading="lazy" /></div><div class="urun-bilgi"><h3>${u.ad}</h3><p>${u.cicekler}</p><span>${enDusuk(u).toLocaleString("tr-TR")} TL'den</span></div></a>`;

const STIL = String.raw`/* Leylak Çiçek Atölyesi — pudra pembesi, koyu yaprak yeşili, vişne; Gilda Display ve Karla. */
:root {
  --pudra: #f7ece8; --pudra-koyu: #efdcd5; --krem: #fffaf6; --yaprak: #23382b; --yaprak-acik: #3d5a47; --visne: #9c2f4f; --visne-koyu: #7f2340;
  --soluk: #6a5f5c; --cizgi: rgba(35, 56, 43, .14); --baslik: "Gilda Display", Georgia, serif; --govde: "Karla", system-ui, sans-serif;
}
[hidden] { display: none !important; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--pudra); color: var(--yaprak); font: 400 16.5px/1.65 var(--govde); -webkit-font-smoothing: antialiased; }
img { display: block; max-width: 100%; }
a { color: inherit; }
h1, h2, h3 { font-family: var(--baslik); font-weight: 400; line-height: 1.08; margin: 0; letter-spacing: -.005em; }
:focus-visible { outline: 2px solid var(--visne); outline-offset: 3px; }
.atla { position: absolute; left: -999px; top: 8px; background: var(--yaprak); color: #fff; padding: 8px 14px; z-index: 60; }
.atla:focus { left: 12px; }
.kap { max-width: 1280px; margin: 0 auto; padding: 0 clamp(18px, 4.5vw, 52px); }

.duyuru { background: var(--yaprak); color: #e9efe9; text-align: center; font-size: 14px; padding: 9px 16px; }
.duyuru span { color: #f4c9d6; font-weight: 600; }
.ust { position: sticky; top: 0; z-index: 40; display: flex; align-items: center; gap: 26px; padding: 14px clamp(18px, 4.5vw, 52px); background: color-mix(in srgb, var(--pudra) 94%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--cizgi); }
.logo { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: var(--visne); }
.logo svg { width: 36px; height: 36px; }
.logo span { font-family: var(--baslik); font-size: 28px; line-height: 1; color: var(--yaprak); }
.logo small { display: block; font-family: var(--govde); font-size: 12px; color: var(--soluk); margin-top: 3px; letter-spacing: .04em; }
.menu { display: flex; gap: 4px; margin-left: auto; }
.menu a { text-decoration: none; padding: 9px 14px; border-radius: 99px; font-weight: 500; font-size: 15px; }
.menu a:hover { background: var(--pudra-koyu); }
.menu a[aria-current] { background: var(--yaprak); color: var(--pudra); }
.sepet { display: inline-flex; align-items: center; gap: 8px; min-height: 46px; padding: 8px 16px 8px 14px; border-radius: 99px; border: 1px solid var(--cizgi); text-decoration: none; font-weight: 600; background: var(--krem); }
.sepet svg { width: 22px; height: 22px; }
.sepet b { min-width: 24px; height: 24px; border-radius: 99px; background: var(--visne); color: #fff; display: grid; place-items: center; font-size: 13px; padding: 0 6px; }
.sepet.zipla { animation: zipla .5s; }
@keyframes zipla { 30% { transform: scale(1.12); } }
.menu-dugme { display: none; width: 46px; height: 46px; border-radius: 50%; border: 1px solid var(--cizgi); background: var(--krem); cursor: pointer; flex-direction: column; justify-content: center; align-items: center; gap: 6px; }
.menu-dugme span { width: 18px; height: 1.6px; background: var(--yaprak); }
.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px; padding: 14px 28px; border: 0; border-radius: 99px; background: var(--visne); color: #fff; font: 600 15.5px/1 var(--govde); text-decoration: none; cursor: pointer; transition: background .2s, transform .15s; }
.dugme:hover { background: var(--visne-koyu); }
.dugme:active { transform: scale(.98); }
.dugme.yesil { background: var(--yaprak); }
.dugme.yesil:hover { background: var(--yaprak-acik); }
.dugme.cizgi { background: transparent; color: var(--yaprak); box-shadow: inset 0 0 0 1.5px var(--yaprak); }
.dugme.cizgi:hover { background: var(--yaprak); color: var(--pudra); }
.dugme[disabled] { opacity: .5; cursor: not-allowed; }

/* Kahraman */
.kahraman { display: grid; grid-template-columns: 1fr 1.05fr; gap: clamp(24px, 5vw, 72px); align-items: center; padding-block: clamp(32px, 5vw, 72px); }
.kahraman h1 { font-size: clamp(50px, 7vw, 104px); line-height: .98; }
.kahraman h1 i { font-style: normal; color: var(--visne); }
.kahraman .giris { font-size: 19px; color: var(--soluk); max-width: 470px; margin: 26px 0 32px; }
.eylemler { display: flex; flex-wrap: wrap; gap: 12px; }
.vitrin { position: relative; }
.vitrin video, .vitrin > img { width: 100%; aspect-ratio: 5 / 6; object-fit: cover; border-radius: 280px 280px 28px 28px; background: var(--pudra-koyu); }
.etiket-yuz { position: absolute; background: var(--krem); border-radius: 20px; padding: 14px 18px; font-size: 14px; color: var(--soluk); border: 1px solid var(--cizgi); }
.etiket-yuz b { display: block; color: var(--yaprak); font-size: 16px; }
.etiket-yuz.e1 { left: -28px; bottom: 14%; }
.etiket-yuz.e2 { right: -18px; top: 16%; display: flex; gap: 10px; align-items: center; }
.etiket-yuz .nokta { width: 10px; height: 10px; border-radius: 50%; background: #3f9b62; flex: none; box-shadow: 0 0 0 5px rgba(63, 155, 98, .16); }
.serit { display: flex; gap: 48px; overflow: hidden; border-block: 1px solid var(--cizgi); padding: 18px 0; white-space: nowrap; }
.serit-ic { display: flex; gap: 48px; animation: kay 40s linear infinite; font-family: var(--baslik); font-size: 26px; color: var(--yaprak-acik); }
.serit-ic span::after { content: "✿"; margin-left: 48px; color: var(--visne); font-size: 18px; vertical-align: middle; }
@keyframes kay { to { transform: translateX(-50%); } }

.bolum { padding-block: clamp(56px, 8vw, 112px); }
.bolum-bas { display: flex; justify-content: space-between; align-items: end; gap: 20px; flex-wrap: wrap; margin-bottom: clamp(26px, 3.5vw, 44px); }
.bolum-bas h2 { font-size: clamp(40px, 5vw, 68px); }
.bolum-bas p { color: var(--soluk); max-width: 520px; margin: 12px 0 0; }
.urun-izgara { display: grid; grid-template-columns: repeat(4, 1fr); gap: clamp(14px, 2vw, 26px); }
.urun { text-decoration: none; display: grid; gap: 14px; }
.urun-foto { position: relative; overflow: hidden; border-radius: 22px; aspect-ratio: 4 / 5; background: var(--pudra-koyu); }
.urun-foto img { width: 100%; height: 100%; object-fit: cover; transition: transform .8s; }
.urun:hover .urun-foto img { transform: scale(1.05); }
.urun-foto .rozet { position: absolute; left: 12px; top: 12px; background: var(--krem); color: var(--visne); font-size: 12.5px; font-weight: 700; padding: 5px 11px; border-radius: 99px; }
.urun-foto .rozet.bitti { color: var(--soluk); }
.urun h3 { font-size: 25px; }
.urun p { margin: 2px 0 0; color: var(--soluk); font-size: 14.5px; }
.urun span { font-weight: 700; color: var(--visne); }
.urun.tukendi .urun-foto img { filter: grayscale(.7); opacity: .7; }

.ozellik-uclu { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.ozellik-uclu div { background: var(--krem); border-radius: 24px; padding: 28px; }
.ozellik-uclu svg { width: 42px; height: 42px; color: var(--visne); margin-bottom: 14px; }
.ozellik-uclu h3 { font-size: 26px; margin-bottom: 8px; }
.ozellik-uclu p { margin: 0; color: var(--soluk); font-size: 15.5px; }

.abone-bant { display: grid; grid-template-columns: 1fr 1fr; background: var(--yaprak); color: #dfe7e0; border-radius: 32px; overflow: hidden; }
.abone-bant img { width: 100%; height: 100%; object-fit: cover; min-height: 420px; }
.abone-bant div { padding: clamp(32px, 5vw, 64px); align-self: center; }
.abone-bant h2 { color: #fff; font-size: clamp(38px, 4.4vw, 60px); }
.abone-bant p { margin: 16px 0 26px; }
.abone-bant .dugme { background: #f4c9d6; color: var(--yaprak); }
.abone-bant .dugme:hover { background: #fff; }

/* Mağaza */
.sayfa-bas { padding-block: clamp(40px, 6vw, 80px) clamp(20px, 3vw, 32px); }
.sayfa-bas h1 { font-size: clamp(50px, 7vw, 96px); }
.sayfa-bas p { color: var(--soluk); max-width: 640px; font-size: 17.5px; margin: 14px 0 0; }
.suzgec { display: flex; gap: 8px; flex-wrap: wrap; margin: 26px 0 32px; }
.suzgec button { min-height: 44px; padding: 10px 18px; border-radius: 99px; border: 1px solid var(--cizgi); background: var(--krem); font: 500 15px var(--govde); color: var(--yaprak); cursor: pointer; }
.suzgec button[aria-pressed="true"] { background: var(--yaprak); color: var(--pudra); border-color: var(--yaprak); }
.suzgec .sayi { margin-left: auto; align-self: center; color: var(--soluk); font-size: 14.5px; }

/* Ürün */
.urun-detay { display: grid; grid-template-columns: 1.05fr 1fr; gap: clamp(24px, 5vw, 72px); align-items: start; padding-block: clamp(24px, 4vw, 56px) clamp(56px, 7vw, 96px); }
.urun-detay > * { min-width: 0; }
.urun-detay .buyuk { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; border-radius: 30px; position: sticky; top: 100px; }
.geri { display: inline-flex; align-items: center; min-height: 44px; color: var(--soluk); text-decoration: none; font-size: 15px; }
.urun-detay h1 { font-size: clamp(46px, 5.6vw, 76px); margin: 8px 0 10px; }
.urun-detay .cicekler { color: var(--visne); font-weight: 600; margin: 0 0 16px; }
.urun-detay .aciklama { color: var(--soluk); font-size: 17px; }
.secim-bas { font-weight: 700; font-size: 14.5px; margin: 26px 0 10px; }
.boylar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.boy { position: relative; }
.boy input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.boy span { display: grid; gap: 2px; padding: 14px 16px; border-radius: 18px; border: 1.5px solid var(--cizgi); background: var(--krem); min-height: 72px; }
.boy span b { font-size: 16px; }
.boy span small { color: var(--soluk); font-size: 14px; }
.boy input:checked + span { border-color: var(--visne); box-shadow: inset 0 0 0 1px var(--visne); }
.boy input:focus-visible + span { outline: 2px solid var(--visne); outline-offset: 2px; }
.adet-satir { display: flex; gap: 12px; align-items: center; margin-top: 22px; flex-wrap: wrap; }
.adet { display: inline-flex; align-items: center; border: 1.5px solid var(--cizgi); border-radius: 99px; background: var(--krem); }
.adet button { width: 46px; height: 50px; border: 0; background: transparent; font-size: 22px; cursor: pointer; color: var(--yaprak); }
.adet output { min-width: 28px; text-align: center; font-weight: 700; }
.adet-satir .dugme { flex: 1; min-width: 200px; }
.stok-not { font-size: 14px; color: var(--soluk); margin-top: 12px; }
.bilgi-liste { margin: 28px 0 0; padding: 0; list-style: none; border-top: 1px solid var(--cizgi); }
.bilgi-liste li { padding: 14px 0; border-bottom: 1px solid var(--cizgi); font-size: 15px; display: flex; gap: 12px; }
.bilgi-liste b { min-width: 120px; }

/* Sepet */
.sepet-duzen { display: grid; grid-template-columns: 1fr 400px; gap: clamp(24px, 4vw, 48px); align-items: start; padding-block: 10px clamp(56px, 7vw, 96px); }
.sepet-duzen > * { min-width: 0; }
.kutu { background: var(--krem); border-radius: 26px; padding: clamp(18px, 3vw, 28px); margin-bottom: 18px; }
.kutu h2 { font-size: 32px; margin-bottom: 16px; display: flex; align-items: center; gap: 12px; }
.kutu h2 i { font-style: normal; font-family: var(--govde); font-size: 14px; font-weight: 700; width: 30px; height: 30px; border-radius: 50%; background: var(--pudra); color: var(--visne); display: grid; place-items: center; }
.kalem { display: grid; grid-template-columns: 84px 1fr auto; gap: 16px; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--cizgi); }
.kalem:last-child { border-bottom: 0; }
.kalem img { width: 84px; height: 100px; object-fit: cover; border-radius: 14px; }
.kalem h3 { font-size: 22px; }
.kalem p { margin: 2px 0 8px; color: var(--soluk); font-size: 14px; }
.kalem .adet button { width: 40px; height: 42px; font-size: 19px; }
.kalem .fiyat { font-weight: 700; text-align: right; }
.kalem .sil { background: none; border: 0; color: var(--soluk); text-decoration: underline; cursor: pointer; font: 500 13.5px var(--govde); padding: 8px 0; min-height: 36px; }
.bos-sepet { text-align: center; padding: 40px 10px; }
.bos-sepet h2 { justify-content: center; }
.gunler { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: thin; }
.gun { flex: none; width: 76px; display: grid; justify-items: center; gap: 1px; padding: 10px 4px; border-radius: 18px; border: 1.5px solid var(--cizgi); background: #fff; cursor: pointer; font: 500 13px var(--govde); color: var(--yaprak); }
.gun b { font-size: 21px; font-family: var(--baslik); font-weight: 400; }
.gun small { color: var(--soluk); font-size: 12px; }
.gun[aria-pressed="true"] { background: var(--yaprak); border-color: var(--yaprak); color: #fff; }
.gun[aria-pressed="true"] small { color: #cfdbd2; }
.gun:disabled { opacity: .4; cursor: not-allowed; background: transparent; }
.araliklar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 14px; }
.aralik { min-height: 48px; border-radius: 14px; border: 1.5px solid var(--cizgi); background: #fff; font: 600 14.5px var(--govde); color: var(--yaprak); cursor: pointer; }
.aralik[aria-pressed="true"] { border-color: var(--visne); color: var(--visne); box-shadow: inset 0 0 0 1px var(--visne); }
.aralik:disabled { opacity: .4; cursor: not-allowed; text-decoration: line-through; }
.not-kucuk { font-size: 14px; color: var(--soluk); margin: 12px 0 0; }
.ikili { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.alan { display: grid; gap: 6px; font-size: 14px; font-weight: 600; margin-bottom: 14px; }
.alan input, .alan select, .alan textarea { width: 100%; min-height: 50px; padding: 12px 14px; border-radius: 14px; border: 1.5px solid var(--cizgi); background: #fff; font: 400 16px var(--govde); color: var(--yaprak); }
.alan textarea { resize: vertical; }
.alan input:focus, .alan select:focus, .alan textarea:focus { outline: none; border-color: var(--visne); }
.alan small { font-weight: 400; color: var(--soluk); }
.kart-onizleme { background: #fff; border-radius: 6px; padding: 22px 24px; font-family: var(--baslik); font-size: 22px; line-height: 1.35; color: var(--yaprak); border: 1px solid var(--cizgi); min-height: 120px; white-space: pre-wrap; overflow-wrap: anywhere; position: relative; margin-bottom: 14px; }
.kart-onizleme::before { content: "✿"; position: absolute; right: 16px; top: 10px; color: var(--visne); font-size: 18px; }
.kart-onizleme em { display: block; font-family: var(--govde); font-style: italic; font-size: 15px; color: var(--soluk); margin-top: 10px; }
.onay { display: flex; gap: 12px; align-items: flex-start; font-size: 14.5px; color: var(--soluk); margin: 4px 0 12px; cursor: pointer; }
.onay input { width: 22px; height: 22px; accent-color: var(--visne); flex: none; margin: 1px 0 0; }
.ozet { position: sticky; top: 100px; background: var(--yaprak); color: #d6e0d8; border-radius: 28px; padding: 26px; }
.ozet h2 { color: #fff; font-size: 34px; margin-bottom: 14px; }
.ozet dl { margin: 0; display: grid; grid-template-columns: 1fr auto; gap: 8px 14px; font-size: 15px; }
.ozet dd { margin: 0; text-align: right; color: #fff; }
.ozet .toplam { display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid rgba(255, 255, 255, .18); margin-top: 14px; padding-top: 14px; color: #fff; }
.ozet .toplam b { font-family: var(--baslik); font-weight: 400; font-size: 40px; }
.ozet .teslim { font-size: 14px; margin: 14px 0 0; color: #f4c9d6; }
.ozet .dugme { width: 100%; margin-top: 18px; background: #f4c9d6; color: var(--yaprak); }
.ozet .dugme:hover { background: #fff; }
.ozet .kucuk { font-size: 13px; margin: 12px 0 0; }
.mesaj { border-radius: 16px; padding: 14px 16px; font-size: 15px; margin-top: 12px; }
.mesaj b { display: block; }
.mesaj.hata { background: #fbe0e6; color: #7f2340; }
.mesaj.bilgi { background: #e3ece5; color: var(--yaprak); }
.basari { max-width: 720px; margin: 0 auto; padding: clamp(40px, 7vw, 88px) clamp(18px, 4vw, 24px); text-align: center; }
.basari .cicek { width: 86px; height: 86px; margin: 0 auto 20px; color: var(--visne); }
.basari h1 { font-size: clamp(46px, 6vw, 74px); }
.basari p { color: var(--soluk); font-size: 17px; }
.basari dl { display: grid; grid-template-columns: auto 1fr; gap: 10px 22px; text-align: left; background: var(--krem); border-radius: 22px; padding: 22px 24px; margin: 24px 0; }
.basari dt { color: var(--soluk); }
.basari dd { margin: 0; font-weight: 600; }
.basari .kod { font-family: var(--baslik); font-size: 32px; color: var(--visne); font-weight: 400; }

/* Abonelik ve kurumsal */
.plan-izgara { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.plan { background: var(--krem); border-radius: 28px; padding: 30px; display: grid; gap: 10px; align-content: start; border: 1.5px solid transparent; }
.plan.one { border-color: var(--visne); }
.plan .ust-not { font-size: 13px; font-weight: 700; color: var(--visne); }
.plan h3 { font-size: 34px; }
.plan .fiyat { font-family: var(--baslik); font-size: 44px; line-height: 1; }
.plan .fiyat small { font-family: var(--govde); font-size: 15px; color: var(--soluk); }
.plan ul { margin: 6px 0 14px; padding: 0 0 0 18px; color: var(--soluk); font-size: 15px; }
.plan li { margin: 4px 0; }
.ikili-bolum { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(24px, 5vw, 64px); align-items: start; }
.ikili-bolum img { width: 100%; border-radius: 28px; aspect-ratio: 4 / 5; object-fit: cover; }
.form-kart { background: var(--krem); border-radius: 28px; padding: clamp(20px, 3vw, 32px); }
.form-kart h2 { font-size: 38px; margin-bottom: 18px; }
.sorgu { max-width: 560px; }
.durum-cizgi { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin: 22px 0 10px; }
.durum-cizgi span { height: 6px; border-radius: 99px; background: var(--pudra-koyu); }
.durum-cizgi span.tamam { background: var(--visne); }
.metin { max-width: 820px; padding-block: clamp(36px, 5vw, 64px); }
.metin h1 { font-size: clamp(44px, 5.4vw, 70px); margin-bottom: 18px; }
.metin h2 { font-size: 30px; margin: 30px 0 10px; }
.metin p, .metin li { color: var(--soluk); }
.metin table { width: 100%; border-collapse: collapse; }
.metin td, .metin th { text-align: left; padding: 11px 6px; border-bottom: 1px solid var(--cizgi); }

.alt { background: var(--yaprak); color: #b8c7bc; padding: clamp(48px, 6vw, 72px) clamp(18px, 4.5vw, 52px) 28px; }
.alt-ic { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; gap: 30px; }
.alt-logo { font-family: var(--baslik); font-size: 44px; color: #fff; }
.alt h4 { color: #fff; margin: 0 0 10px; font-size: 15px; }
.alt p { margin: 6px 0; font-size: 14.5px; }
.alt a { color: #eef3ef; text-decoration: none; }
.alt a:hover { text-decoration: underline; }
.alt-not { max-width: 1280px; margin: 36px auto 0; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, .14); font-size: 13.5px; }
.bildirim { position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 180%); background: var(--yaprak); color: #fff; padding: 14px 22px; border-radius: 99px; font-weight: 600; font-size: 15px; z-index: 60; transition: transform .35s; max-width: calc(100vw - 32px); }
.bildirim.acik { transform: translate(-50%, 0); }
.bildirim a { color: #f4c9d6; margin-left: 8px; }

@media (max-width: 1080px) {
  .urun-izgara { grid-template-columns: repeat(3, 1fr); }
  .sepet-duzen { grid-template-columns: 1fr; }
  .ozet { position: static; }
  .alt-ic { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 860px) {
  .menu { display: none; position: absolute; left: 12px; right: 12px; top: calc(100% + 8px); flex-direction: column; background: var(--krem); border: 1px solid var(--cizgi); border-radius: 22px; padding: 10px; }
  .menu.acik { display: flex; }
  .menu a { padding: 14px 16px; font-size: 17px; }
  .menu-dugme { display: inline-flex; }
  .sepet { margin-left: auto; }
  .kahraman, .urun-detay, .ikili-bolum, .abone-bant { grid-template-columns: 1fr; }
  .vitrin { max-width: 460px; margin: 0 auto; width: 100%; }
  .etiket-yuz.e1 { left: 0; } .etiket-yuz.e2 { right: 0; }
  .urun-detay .buyuk { position: static; aspect-ratio: 4 / 3.6; }
  .ozellik-uclu, .plan-izgara { grid-template-columns: 1fr; }
  .abone-bant img { min-height: 0; aspect-ratio: 16 / 10; }
}
@media (max-width: 560px) {
  .duyuru { font-size: 13px; }
  .logo small { display: none; }
  .logo span { font-size: 25px; }
  .sepet { padding: 8px 12px; }
  .sepet-yazi { display: none; }
  .urun-izgara { grid-template-columns: 1fr 1fr; gap: 14px 12px; }
  .urun h3 { font-size: 20px; }
  .urun p { display: none; }
  .urun-foto { border-radius: 16px; }
  .boylar { grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .boy span { padding: 12px 10px; }
  .kalem { grid-template-columns: 64px 1fr; }
  .kalem img { width: 64px; height: 78px; }
  .kalem .fiyat { grid-column: 2; text-align: left; }
  .ikili, .araliklar { grid-template-columns: 1fr; }
  .alt-ic { grid-template-columns: 1fr; }
  .etiket-yuz { padding: 10px 14px; font-size: 13px; }
  .etiket-yuz b { font-size: 14.5px; }
  .etiket-yuz.e1 { bottom: 6%; }
  .suzgec .sayi { width: 100%; margin: 4px 0 0; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; scroll-behavior: auto !important; } }
`;

const SIPARIS_FN = String.raw`/* Sunucu fonksiyonu: sipariş (POST /api/siparis) ve sipariş takibi (GET /api/siparis?kod=LC-XXXXX&tel=1234).
 * Fiyat, boy, stok ve teslimat kuralları burada tablodan denetlenir; tarayıcıdan gelen fiyat kullanılmaz. */
var BOLGELER = ${JSON.stringify(BOLGELER)};
var ARALIKLAR = ${JSON.stringify(ARALIKLAR)};
var KESIM = "${KESIM}";
function istanbul() { var d = new Date(Date.now() + 3 * 3600 * 1000); return { tarih: d.toISOString().slice(0, 10), dakika: d.getUTCHours() * 60 + d.getUTCMinutes() }; }
function gunEkle(t, n) { var d = new Date(t + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function dk(s) { var p = String(s).split(":"); return Number(p[0]) * 60 + Number(p[1] || 0); }
export default async function (istek, vayra) {
  if (istek.yontem === "GET") {
    var kod = String((istek.sorgu && istek.sorgu.kod) || "").trim().toUpperCase(), tel = String((istek.sorgu && istek.sorgu.tel) || "").replace(/\D/g, "");
    if (!/^LC-[A-Z0-9]{5}$/.test(kod) || tel.length !== 4) return { durum: 400, govde: { hata: "Sipariş kodu ve telefonun son dört hanesi gerekli." } };
    var b = (await vayra.veri.liste("siparisler", { kod: kod, sinir: 1 }))[0];
    if (!b || String(b.telefon).replace(/\D/g, "").slice(-4) !== tel) return { durum: 404, govde: { hata: "Bu bilgilerle sipariş bulunamadı." } };
    return { durum: 200, basliklar: { "Cache-Control": "no-store" }, govde: { kod: b.kod, durum: b.durum, teslimTarihi: b.teslimTarihi, teslimAraligi: b.teslimAraligi, alici: String(b.alici || "").split(" ")[0], tutar: b.tutar } };
  }
  if (istek.yontem !== "POST") return { durum: 405, govde: { hata: "Yalnız GET ve POST." } };
  var g = istek.govde;
  if (!g || typeof g !== "object") { try { g = JSON.parse(istek.metin || "{}"); } catch (e) { g = {}; } }
  if (g.kvkk !== true) return { durum: 400, govde: { hata: "Aydınlatma metni onayı gerekli." } };
  var t = g.teslimat || {}, s = g.gonderen || {};
  var bolge = BOLGELER.find(function (x) { return x.id === t.bolge; });
  if (!bolge) return { durum: 400, govde: { hata: "Teslimat bölgesi seçilmeli." } };
  if (ARALIKLAR.indexOf(t.aralik) < 0) return { durum: 400, govde: { hata: "Teslimat saat aralığı seçilmeli." } };
  var simdi = istanbul();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t.tarih || "") || t.tarih < simdi.tarih || t.tarih > gunEkle(simdi.tarih, 30)) return { durum: 400, govde: { hata: "Teslimat tarihi bugünden itibaren 30 gün içinde olmalı." } };
  if (new Date(t.tarih + "T12:00:00Z").getUTCDay() === 0) return { durum: 400, govde: { hata: "Pazar günleri teslimat yapmıyoruz." } };
  if (t.tarih === simdi.tarih) {
    if (simdi.dakika >= dk(KESIM)) return { durum: 400, govde: { hata: "Bugün teslimat için siparişler 14.00'te kapandı; yarın ya da sonrası için seç." } };
    if (dk(String(t.aralik).slice(0, 5).replace(".", ":")) < simdi.dakika + 120) return { durum: 400, govde: { hata: "Bu saat aralığı için hazırlık süresi yetmiyor; daha geç bir aralık seç." } };
  }
  var adres = String(t.adres || "").trim(), alici = String(t.alici || "").trim(), aliciTel = String(t.aliciTelefon || "").trim();
  var ad = String(s.ad || "").trim(), tel = String(s.telefon || "").trim();
  if (adres.length < 10 || alici.length < 3 || !/^[0-9 +()]{10,17}$/.test(aliciTel)) return { durum: 400, govde: { hata: "Alıcının adı, telefonu ve açık adresi gerekli." } };
  if (ad.length < 3 || !/^[0-9 +()]{10,17}$/.test(tel)) return { durum: 400, govde: { hata: "Adın ve geçerli bir telefon numaran gerekli." } };
  var istenen = Array.isArray(g.kalemler) ? g.kalemler.slice(0, 20) : [];
  if (!istenen.length) return { durum: 400, govde: { hata: "Sepet boş." } };
  var urunler = await vayra.veri.liste("urunler", { sinir: 500 }), kalemler = [], ara = 0, dus = {};
  for (var i = 0; i < istenen.length; i++) {
    var k = istenen[i], u = urunler.find(function (x) { return x.id === k.id && x.aktif !== false; }), adet = Math.floor(Number(k.adet));
    if (!u) return { durum: 409, govde: { hata: "Sepetteki bir ürün artık satışta değil; sepeti yenile." } };
    var boy = ["S", "M", "L"].indexOf(k.boy) >= 0 ? k.boy : "M", f = Number(u["fiyat" + boy]);
    if (!(f > 0)) return { durum: 409, govde: { hata: u.ad + " için seçilen boy satışta değil." } };
    if (!(adet >= 1 && adet <= 10)) return { durum: 400, govde: { hata: "Adet 1 ile 10 arasında olmalı." } };
    dus[u.id] = (dus[u.id] || 0) + adet;
    if (typeof u.stok === "number" && dus[u.id] > u.stok) return { durum: 409, govde: { hata: u.stok > 0 ? u.ad + " için bugün yalnız " + u.stok + " adet kaldı." : u.ad + " bugün tükendi." } };
    kalemler.push({ id: u.id, ad: u.ad, boy: boy, adet: adet, birim: f, tutar: f * adet });
    ara += f * adet;
  }
  var harf = "ABCDEFGHJKLMNPRSTUVYZ23456789", kod2 = "LC-";
  for (var j = 0; j < 5; j++) kod2 += harf.charAt(Math.floor(Math.random() * harf.length));
  var tutar = ara + bolge.ucret;
  await vayra.veri.ekle("siparisler", { kod: kod2, kalemler: kalemler, araToplam: ara, teslimatUcreti: bolge.ucret, tutar: tutar, teslimTarihi: t.tarih, teslimAraligi: t.aralik, bolge: bolge.ad, adres: adres.slice(0, 400), alici: alici.slice(0, 80), aliciTelefon: aliciTel, kartNotu: g.kartNotu ? String(g.kartNotu).slice(0, 300) : null, imzasiz: g.imzasiz === true, gonderen: ad.slice(0, 80), telefon: tel, eposta: s.eposta ? String(s.eposta).slice(0, 120) : null, kvkk: true, durum: "Alındı" });
  for (var id in dus) { var u2 = urunler.find(function (x) { return x.id === id; }); if (u2 && typeof u2.stok === "number") await vayra.veri.guncelle("urunler", id, { stok: Math.max(0, u2.stok - dus[id]) }); }
  return { durum: 201, basliklar: { "Cache-Control": "no-store" }, govde: { ok: true, kod: kod2, araToplam: ara, teslimatUcreti: bolge.ucret, tutar: tutar } };
}
`;

const UYGULAMA = ORTAK_JS + String.raw`
/* ── Leylak Çiçek Atölyesi ──
 * Ürünler "urunler" tablosundan (canlı önizlemede gömülü kopya). Sepet localStorage'da: [{ id, boy, adet }].
 * Sipariş api/siparis.js'e gider; fiyat ve stok orada tablodan hesaplanır. */
var YEDEK_URUNLER = ${JSON.stringify(URUNLER)};
var BOLGELER = ${JSON.stringify(BOLGELER)};
var ARALIKLAR = ${JSON.stringify(ARALIKLAR)};
var BOY_AD = ${JSON.stringify(BOY_AD)};
var KESIM = "${KESIM}";
var KATEGORILER = ${JSON.stringify(KATEGORILER)};
var SAYFA = document.body.dataset.sayfa, SEPET = "leylak-sepet";
var GUN_KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

var urunSoz = null;
function urunler() {
  if (!urunSoz) urunSoz = (veriVar() ? vayra.veri.liste("urunler", { sirala: "sira", yon: "artan", sinir: 300 }) : Promise.resolve(YEDEK_URUNLER.slice()))
    .catch(function () { return YEDEK_URUNLER.slice(); })
    .then(function (l) { return l.filter(function (u) { return u.aktif !== false; }); });
  return urunSoz;
}
function boylar(u) { return ["S", "M", "L"].filter(function (b) { return Number(u["fiyat" + b]) > 0; }); }
function enDusuk(u) { return Math.min.apply(null, boylar(u).map(function (b) { return Number(u["fiyat" + b]); })); }
function tukendi(u) { return typeof u.stok === "number" && u.stok <= 0; }
function sepetOku() { try { var s = JSON.parse(localStorage.getItem(SEPET) || "[]"); return Array.isArray(s) ? s : []; } catch (e) { return []; } }
function sepetYaz(s) { localStorage.setItem(SEPET, JSON.stringify(s)); sayac(); }
function sayac() { var n = sepetOku().reduce(function (t, k) { return t + (Number(k.adet) || 0); }, 0); var b = $("#sepetSayi"); if (b) b.textContent = n; }
sayac();

/* Bugün teslimat için kalan süre (İstanbul saati) */
function kesimGuncelle() {
  var s = istanbul(), kalan = saatDakika(KESIM) - s.dakika, y = $("#kesimSayac"); if (!y) return;
  if (s.gun === 0) y.textContent = "Pazar günü teslimat yok; pazartesi için sipariş verebilirsin.";
  else if (kalan > 300) y.textContent = "Bugün teslimat için siparişler 14.00'e kadar.";
  else if (kalan > 0) y.textContent = "Bugün teslimat için " + (kalan >= 60 ? Math.floor(kalan / 60) + " saat " : "") + (kalan % 60) + " dakika kaldı.";
  else y.textContent = "Bugünkü teslimatlar kapandı; yarın için sipariş verebilirsin.";
  var e = $("#kesimKart"); if (e) e.innerHTML = "<b>" + (s.gun !== 0 && kalan > 0 ? "Bugün kapında" : "Yarın kapında") + "</b>" + (s.gun !== 0 && kalan > 0 ? "14.00'e kadar verilen siparişler" : "Saat 09.00'dan itibaren yola çıkıyoruz");
}
kesimGuncelle(); setInterval(kesimGuncelle, 30000);

function urunKarti(u) {
  var t = tukendi(u);
  return '<a class="urun' + (t ? " tukendi" : "") + '" href="urun.html?id=' + encodeURIComponent(u.id) + '"><div class="urun-foto"><img src="' + kacir(u.gorsel) + '" alt="' + kacir(u.ad) + '" loading="lazy" />' + (t ? '<span class="rozet bitti">Bugün tükendi</span>' : u.onecikan ? '<span class="rozet">Çok sevilen</span>' : "") + '</div><div class="urun-bilgi"><h3>' + kacir(u.ad) + "</h3><p>" + kacir(u.cicekler || "") + "</p><span>" + tl(enDusuk(u)) + "'den</span></div></a>";
}

/* Ana sayfa: öne çıkanlar (tablodan) */
if ($("#oneCikan")) urunler().then(function (l) { var o = l.filter(function (u) { return u.onecikan && u.kategori !== "Abonelik"; }); $("#oneCikan").innerHTML = (o.length >= 4 ? o : l).slice(0, 4).map(urunKarti).join(""); });

/* Mağaza */
if (SAYFA === "magaza") {
  var secKat = new URLSearchParams(location.search).get("kategori") || "Hepsi";
  urunler().then(function (l) {
    function ciz() {
      $$(".suzgec button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.kategori === secKat)); });
      var g = l.filter(function (u) { return secKat === "Hepsi" || u.kategori === secKat; });
      $("#urunSayi").textContent = g.length + " çiçek";
      $("#urunler").innerHTML = g.length ? g.map(urunKarti).join("") : '<p>Bu kategoride şu an çiçek yok.</p>';
    }
    ciz();
    $(".suzgec").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; secKat = b.dataset.kategori; ciz(); history.replaceState(null, "", secKat === "Hepsi" ? "magaza.html" : "magaza.html?kategori=" + encodeURIComponent(secKat)); });
  });
}

/* Ürün sayfası */
if (SAYFA === "urun") {
  var uid = new URLSearchParams(location.search).get("id");
  urunler().then(function (l) {
    var u = l.find(function (x) { return x.id === uid; }) || l[0], yer = $("#urun");
    if (!u) { yer.innerHTML = '<p>Ürün bulunamadı. <a href="magaza.html">Bütün çiçekler</a></p>'; return; }
    document.title = u.ad + " · Leylak Çiçek Atölyesi";
    var b = boylar(u), sec = b.indexOf("M") >= 0 ? "M" : b[0], adet = 1, t = tukendi(u);
    yer.innerHTML = '<div><img class="buyuk" src="' + kacir(u.gorsel) + '" alt="' + kacir(u.ad) + '" /></div><div><a class="geri" href="magaza.html?kategori=' + encodeURIComponent(u.kategori) + '">' + kacir(u.kategori) + "</a><h1>" + kacir(u.ad) + '</h1><p class="cicekler">' + kacir(u.cicekler || "") + '</p><p class="aciklama">' + kacir(u.aciklama || "") + "</p>"
      + '<p class="secim-bas">' + (b.length > 1 ? "Boy seç" : "Fiyat") + '</p><div class="boylar" role="radiogroup" aria-label="Boy">' + b.map(function (x) { return '<label class="boy"><input type="radio" name="boy" value="' + x + '"' + (x === sec ? " checked" : "") + " /><span><b>" + (b.length > 1 ? BOY_AD[x] : "Tek boy") + "</b><small>" + tl(u["fiyat" + x]) + "</small></span></label>"; }).join("") + "</div>"
      + '<div class="adet-satir"><div class="adet" aria-label="Adet"><button type="button" data-adet="-1" aria-label="Azalt">−</button><output id="adet">1</output><button type="button" data-adet="1" aria-label="Artır">+</button></div><button class="dugme" id="ekle" type="button"' + (t ? " disabled" : "") + ">" + (t ? "Bugün tükendi" : "Sepete ekle") + "</button></div>"
      + '<p class="stok-not">' + (t ? "Yarın sabah yeniden hazırlıyoruz; yarın için sipariş verebilirsin." : typeof u.stok === "number" && u.stok <= 5 ? "Bugün için son " + Number(u.stok) + " adet." : "Bugün 14.00'e kadar verilen siparişler aynı gün teslim edilir.") + "</p>"
      + '<ul class="bilgi-liste"><li><b>Teslimat</b><span>Nişantaşı, Teşvikiye ve Maçka ücretsiz; diğer semtler 120 TL ile 260 TL arası.</span></li><li><b>Kart notu</b><span>Ücretsiz, elle yazılmış kart; istersen imzasız.</span></li><li><b>Bakım</b><span>Saplarını çapraz kes, suyunu iki günde bir değiştir.</span></li></ul></div>';
    $$("input[name=boy]").forEach(function (r) { r.addEventListener("change", function () { sec = r.value; }); });
    $$("[data-adet]").forEach(function (d) { d.addEventListener("click", function () { adet = Math.max(1, Math.min(10, adet + Number(d.dataset.adet))); $("#adet").textContent = adet; }); });
    $("#ekle").addEventListener("click", function () {
      var s = sepetOku(), v = s.find(function (k) { return k.id === u.id && k.boy === sec; });
      if (v) v.adet = Math.min(10, v.adet + adet); else s.push({ id: u.id, boy: sec, adet: adet });
      sepetYaz(s); olay("sepete_ekle", { urun: u.id, boy: sec });
      var sp = $(".sepet"); sp.classList.remove("zipla"); void sp.offsetWidth; sp.classList.add("zipla");
      bildir(u.ad + " sepete eklendi.");
      var bd = $("#bildirim"); if (bd && !bd.querySelector("a")) { var a = document.createElement("a"); a.href = "sepet.html"; a.textContent = "Sepete git"; bd.appendChild(a); }
    });
    var ilgili = l.filter(function (x) { return x.id !== u.id && x.kategori !== "Abonelik"; }).sort(function (a, c) { return (c.kategori === u.kategori) - (a.kategori === u.kategori); }).slice(0, 4);
    $("#ilgili").innerHTML = ilgili.map(urunKarti).join("");
  });
}

/* Sepet ve sipariş */
if (SAYFA === "sepet") {
  var form = $("#siparisFormu"), mesaj = $("#mesaj"), harita = {}, sec = { gun: null, aralik: null };
  function goster(tur, baslik, metin) { mesaj.hidden = false; mesaj.className = "mesaj " + tur; mesaj.innerHTML = "<b>" + kacir(baslik) + "</b>" + kacir(metin || ""); mesaj.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  form.bolge.innerHTML = '<option value="">Semt seç</option>' + BOLGELER.map(function (b) { return '<option value="' + b.id + '">' + kacir(b.ad) + (b.ucret ? ", " + tl(b.ucret) : ", ücretsiz") + "</option>"; }).join("");
  function bugunAcikMi() { var s = istanbul(); return s.gun !== 0 && s.dakika < saatDakika(KESIM); }
  function aralikUygunMu(gun, a) { var s = istanbul(); return gun !== s.tarih || saatDakika(a.slice(0, 5).replace(".", ":")) >= s.dakika + 120; }
  function gunleriCiz() {
    var s = istanbul(), h = "";
    for (var i = 0; i < 14; i++) {
      var t = gunEkle(s.tarih, i), g = haftaGunu(t), acik = g !== 0 && (i > 0 || (bugunAcikMi() && ARALIKLAR.some(function (a) { return aralikUygunMu(t, a); })));
      h += '<button type="button" class="gun" data-gun="' + t + '" aria-pressed="false"' + (acik ? "" : " disabled") + ' aria-label="' + tarihYaz(t, { weekday: "long" }) + (acik ? "" : ", teslimat yok") + '"><small>' + (i === 0 ? "Bugün" : i === 1 ? "Yarın" : GUN_KISA[g]) + "</small><b>" + Number(t.slice(8)) + "</b><small>" + tarihYaz(t, { month: "short", day: undefined }) + "</small></button>";
    }
    $("#gunler").innerHTML = h;
    if (!sec.gun) { var ilk = $(".gun:not(:disabled)"); if (ilk) sec.gun = ilk.dataset.gun; }
    $$(".gun").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.gun === sec.gun)); });
    araliklariCiz();
  }
  function araliklariCiz() {
    $("#araliklar").innerHTML = ARALIKLAR.map(function (a) { var u = sec.gun && aralikUygunMu(sec.gun, a); if (!u && sec.aralik === a) sec.aralik = null; return '<button type="button" class="aralik" data-aralik="' + a + '" aria-pressed="' + (sec.aralik === a) + '"' + (u ? "" : " disabled") + ">" + a + "</button>"; }).join("");
    if (!sec.aralik) { var ilk = $(".aralik:not(:disabled)"); if (ilk) { sec.aralik = ilk.dataset.aralik; ilk.setAttribute("aria-pressed", "true"); } }
    ozetCiz();
  }
  $("#gunler").addEventListener("click", function (e) { var b = e.target.closest(".gun"); if (!b || b.disabled) return; sec.gun = b.dataset.gun; $$(".gun").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); araliklariCiz(); });
  $("#araliklar").addEventListener("click", function (e) { var b = e.target.closest(".aralik"); if (!b || b.disabled) return; sec.aralik = b.dataset.aralik; $$(".aralik").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); ozetCiz(); });
  function kalemleriCiz() {
    var s = sepetOku().filter(function (k) { var u = harita[k.id]; return u && Number(u["fiyat" + k.boy]) > 0; });
    sepetYaz(s);
    $("#bosSepet").hidden = s.length > 0; $("#doluSepet").hidden = s.length === 0;
    $("#kalemler").innerHTML = s.map(function (k, i) {
      var u = harita[k.id], f = Number(u["fiyat" + k.boy]);
      return '<div class="kalem"><img src="' + kacir(u.gorsel) + '" alt="" /><div><h3>' + kacir(u.ad) + "</h3><p>" + (boylar(u).length > 1 ? BOY_AD[k.boy] + " boy, " : "") + tl(f) + '</p><div class="adet"><button type="button" data-i="' + i + '" data-d="-1" aria-label="Azalt">−</button><output>' + k.adet + '</output><button type="button" data-i="' + i + '" data-d="1" aria-label="Artır">+</button></div></div><div class="fiyat">' + tl(f * k.adet) + '<br /><button class="sil" type="button" data-sil="' + i + '">Kaldır</button></div></div>';
    }).join("");
    ozetCiz();
  }
  $("#kalemler").addEventListener("click", function (e) {
    var s = sepetOku(), d = e.target.closest("[data-d]"), x = e.target.closest("[data-sil]");
    if (d) { var k = s[Number(d.dataset.i)]; k.adet = Math.max(1, Math.min(10, k.adet + Number(d.dataset.d))); }
    else if (x) s.splice(Number(x.dataset.sil), 1); else return;
    sepetYaz(s); kalemleriCiz();
  });
  function hesap() {
    var s = sepetOku(), ara = s.reduce(function (t, k) { var u = harita[k.id]; return t + (u ? Number(u["fiyat" + k.boy]) * k.adet : 0); }, 0);
    var b = BOLGELER.find(function (x) { return x.id === form.bolge.value; });
    return { ara: ara, ucret: b ? b.ucret : null, toplam: ara + (b ? b.ucret : 0) };
  }
  function ozetCiz() {
    var h = hesap();
    $("#ozAra").textContent = tl(h.ara);
    $("#ozTeslimat").textContent = h.ucret === null ? "Semt seç" : h.ucret ? tl(h.ucret) : "Ücretsiz";
    $("#ozToplam").textContent = tl(h.toplam);
    $("#ozTeslim").textContent = sec.gun && sec.aralik ? tarihYaz(sec.gun, { weekday: "long" }) + ", " + sec.aralik : "Teslimat günü seç";
  }
  form.bolge.addEventListener("change", ozetCiz);
  function kartCiz() {
    var m = form.kartNotu.value.trim(), imz = form.imzasiz.checked, ad = form.ad.value.trim();
    $("#kartOnizleme").innerHTML = (m ? kacir(m) : '<span style="color:var(--soluk)">Kart notun burada görünecek.</span>') + "<em>" + (imz ? "İmzasız" : ad ? "Sevgiyle, " + kacir(ad) : "Sevgiyle, adın") + "</em>";
    $("#kartSayac").textContent = form.kartNotu.value.length + " / 300";
  }
  ["kartNotu", "imzasiz", "ad"].forEach(function (n) { form[n].addEventListener("input", kartCiz); form[n].addEventListener("change", kartCiz); });
  urunler().then(function (l) { l.forEach(function (u) { harita[u.id] = u; }); kalemleriCiz(); gunleriCiz(); kartCiz(); });

  $("#gonder").addEventListener("click", function () { form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true })); });
  form.addEventListener("submit", function (e) {
    e.preventDefault(); mesaj.hidden = true;
    var s = sepetOku();
    if (!s.length) return goster("hata", "Sepetin boş.", " Önce bir çiçek seç.");
    if (!sec.gun || !sec.aralik) { $("#gunler").scrollIntoView({ block: "center", behavior: "smooth" }); return goster("hata", "Teslimat günü ve saat aralığı seç.", ""); }
    if (!form.reportValidity()) return;
    var f = new FormData(form), telOk = function (x) { return /^[0-9 +()]{10,17}$/.test(String(x).trim()); };
    if (!telOk(f.get("aliciTelefon"))) return goster("hata", "Alıcının telefonu geçersiz.", " Kuryemiz teslimattan önce arar; 0532 123 45 67 biçiminde yaz.");
    if (!telOk(f.get("telefon"))) return goster("hata", "Telefon numaran geçersiz.", " 0532 123 45 67 biçiminde yaz.");
    var g = { kalemler: s, teslimat: { tarih: sec.gun, aralik: sec.aralik, bolge: f.get("bolge"), adres: String(f.get("adres")).trim(), alici: String(f.get("alici")).trim(), aliciTelefon: String(f.get("aliciTelefon")).trim() }, kartNotu: String(f.get("kartNotu") || "").trim() || null, imzasiz: f.get("imzasiz") === "on", gonderen: { ad: String(f.get("ad")).trim(), telefon: String(f.get("telefon")).trim(), eposta: String(f.get("eposta") || "").trim() || null }, kvkk: f.get("kvkk") === "on" };
    if (!fonksiyonVar()) return goster("bilgi", "Bu canlı önizlemede sipariş alınmaz.", " Şablonu kullanınca siparişler fiyat ve stok denetlenerek veritabanındaki siparisler tablosuna düşer.");
    var d = $("#gonder"); d.disabled = true; d.textContent = "Gönderiliyor…";
    fetch(new URL("api/siparis", document.baseURI).href, { method: "POST", body: JSON.stringify(g) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.hata || "Sipariş verilemedi (" + r.status + ")"); return j; }); })
      .then(function (j) {
        olay("siparis", { tutar: j.tutar, kalem: s.length });
        localStorage.removeItem(SEPET); sayac();
        $("#icerik").innerHTML = '<section class="basari" role="status"><svg class="cicek" viewBox="0 0 40 40" aria-hidden="true"><g fill="currentColor"><circle cx="20" cy="11" r="5"/><circle cx="12" cy="18" r="5"/><circle cx="28" cy="18" r="5"/><circle cx="15.5" cy="27" r="5"/><circle cx="24.5" cy="27" r="5"/></g><circle cx="20" cy="20" r="3.4" fill="#f7ece8"/></svg><h1>Siparişin alındı</h1><p>Teşekkürler! Birkaç dakika içinde ödeme bağlantısını SMS ve e-postayla gönderiyoruz; ödeme tamamlanınca çiçeklerini hazırlamaya başlıyoruz.</p>'
          + '<dl><dt>Sipariş kodu</dt><dd class="kod">' + kacir(j.kod) + "</dd><dt>Teslimat</dt><dd>" + kacir(tarihYaz(g.teslimat.tarih, { weekday: "long" })) + ", " + kacir(g.teslimat.aralik) + "</dd><dt>Alıcı</dt><dd>" + kacir(g.teslimat.alici) + "</dd><dt>Çiçekler</dt><dd>" + tl(j.araToplam) + "</dd><dt>Teslimat ücreti</dt><dd>" + (j.teslimatUcreti ? tl(j.teslimatUcreti) : "Ücretsiz") + "</dd><dt>Toplam</dt><dd>" + tl(j.tutar) + '</dd></dl><p>Siparişini <a href="siparis.html?kod=' + encodeURIComponent(j.kod) + '">sipariş takibi</a> sayfasından kod ve telefonunun son dört hanesiyle izleyebilirsin.</p><div class="eylemler" style="justify-content:center;margin-top:20px"><a class="dugme" href="magaza.html">Alışverişe dön</a></div></section>';
        window.scrollTo(0, 0);
      })
      .catch(function (err) { urunSoz = null; goster("hata", "Sipariş verilemedi.", " " + (err && err.message ? err.message : "") + " Sorun sürerse 0212 251 30 40 numarasından ara."); })
      .finally(function () { d.disabled = false; d.textContent = "Siparişi ver"; });
  });
}

/* Sipariş takibi */
if (SAYFA === "siparis") {
  var sf = $("#sorgu"), sonuc = $("#sorguSonuc"), kq = new URLSearchParams(location.search).get("kod");
  if (kq) sf.kod.value = kq;
  var ADIMLAR = ["Alındı", "Ödeme bekleniyor", "Hazırlanıyor", "Yolda", "Teslim edildi"];
  sf.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!sf.reportValidity()) return;
    if (!fonksiyonVar()) { sonuc.innerHTML = '<p class="mesaj bilgi"><b>Bu canlı önizlemede sorgu yapılmaz.</b>Şablonu kullanınca siparişler kod ve telefonun son dört hanesiyle sorgulanır.</p>'; return; }
    sonuc.innerHTML = '<p class="not-kucuk">Sorgulanıyor…</p>';
    fonksiyonOku("siparis", { kod: sf.kod.value.trim().toUpperCase(), tel: sf.tel.value.trim() }).then(function (j) {
      var n = ADIMLAR.indexOf(j.durum);
      sonuc.innerHTML = '<div class="kutu" style="margin-top:20px"><h2>' + kacir(j.durum) + '</h2><div class="durum-cizgi" aria-hidden="true">' + ADIMLAR.map(function (a, i) { return '<span class="' + (i <= n ? "tamam" : "") + '"></span>'; }).join("") + '</div><p class="not-kucuk">' + kacir(j.alici) + " için " + kacir(tarihYaz(j.teslimTarihi, { weekday: "long" })) + ", " + kacir(j.teslimAraligi || "") + " arası teslimat. Toplam " + tl(j.tutar) + ".</p></div>";
    }).catch(function (err) { sonuc.innerHTML = '<p class="mesaj hata"><b>Sipariş bulunamadı.</b>' + kacir(err.message) + "</p>"; });
  });
}
`;

const CIZGI_SIMGE: Record<string, string> = {
  taze: '<path d="M20 34V18M20 18c0-6 4-10 10-10 0 6-4 10-10 10zM20 22c0-5-3.5-8-8.5-8 0 5 3.5 8 8.5 8z" />',
  kurye: '<path d="M4 26h18V12H4zM22 16h7l5 5v5h-12" /><circle cx="10" cy="28" r="3" /><circle cx="28" cy="28" r="3" />',
  kart: '<path d="M6 10h28v20H6z" /><path d="M6 10l14 11 14-11" />',
};
const cizgi = (k: string) => `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CIZGI_SIMGE[k]}</svg>`;

export const CICEKCI = {
  id: "cicekci",
  ad: "Leylak · Çiçek Atölyesi",
  tur: "site" as const,
  aciklama: "Çiçekçi mağazası: tablodan boy seçenekli ve stoklu ürünler, sepet, aynı gün teslimat saati kuralı, semte göre ücret, kart notu, sunucuda fiyat denetimli sipariş ve sipariş takibi",
  kapak: "/gercek/build/sablon/cicekci.webp",
  tablolar: TABLOLAR,
  dosyalar: {
    "index.html": sayfa("index.html", "Leylak Çiçek Atölyesi · Nişantaşı", "Nişantaşı'nda el yapımı buketler, aranjmanlar ve haftalık çiçek aboneliği. 14.00'e kadar verilen siparişlere aynı gün teslimat.", `<section class="kap kahraman">
  <div>
    <h1>Bugün sipariş ver, <i>bugün</i> kapısında.</h1>
    <p class="giris">Her sabah çiçek halinden gelen taze dallarla, Nişantaşı'ndaki atölyemizde elde bağlanan buketler. İstanbul'un her yerine özenle teslim ediyoruz.</p>
    <div class="eylemler"><a class="dugme" href="magaza.html">Çiçekleri gör</a><a class="dugme cizgi" href="abonelik.html">Haftalık abonelik</a></div>
  </div>
  <div class="vitrin">
    <video autoplay muted loop playsinline preload="metadata" poster="/gercek/havuz/gorsel/mk-doga-4742.webp" aria-label="Atölyedeki rengârenk buketler"><source src="/gercek/havuz/video/mk-doga-4742.mp4" type="video/mp4" /></video>
    <div class="etiket-yuz e1" id="kesimKart"><b>Bugün kapında</b>14.00'e kadar verilen siparişler</div>
    <div class="etiket-yuz e2"><span class="nokta"></span><span><b>Atölye açık</b>Atiye Sokak 14</span></div>
  </div>
</section>
<div class="serit" aria-hidden="true"><div class="serit-ic"><span>Şakayık</span><span>Ortanca</span><span>Lisiantus</span><span>Ayçiçeği</span><span>Frezya</span><span>Lavanta</span><span>Düğün çiçeği</span><span>Okaliptüs</span><span>Şakayık</span><span>Ortanca</span><span>Lisiantus</span><span>Ayçiçeği</span><span>Frezya</span><span>Lavanta</span><span>Düğün çiçeği</span><span>Okaliptüs</span></div></div>
<section class="kap bolum">
  <div class="bolum-bas"><div><h2>Bu hafta çok sevilenler</h2><p>Buketlerimiz üç boyda hazırlanır; içerik mevsime göre değişir, tonlar aynı kalır.</p></div><a class="dugme cizgi" href="magaza.html">Bütün çiçekler</a></div>
  <div class="urun-izgara" id="oneCikan">
${URUNLER.filter((u) => u.onecikan).slice(0, 4).map(urunKarti).join("\n")}
  </div>
</section>
<section class="kap bolum" style="padding-top:0">
  <div class="ozellik-uclu">
    <div>${cizgi("taze")}<h3>Her sabah taze</h3><p>Çiçeklerimiz sabah 06.00'da halden gelir; buketler sipariş anında bağlanır, vitrinde bekletilmez.</p></div>
    <div>${cizgi("kurye")}<h3>Kendi kuryemiz</h3><p>Çiçekleri kargoya vermiyoruz. Kuryemiz alıcıyı arar, çiçeği elden teslim eder ve fotoğrafını sana gönderir.</p></div>
    <div>${cizgi("kart")}<h3>Elle yazılmış kart</h3><p>Kart notunu el yazısıyla, mürekkepli kalemle yazıyoruz. İstersen imzasız gönderiyoruz.</p></div>
  </div>
</section>
<section class="kap bolum" style="padding-top:0">
  <div class="abone-bant">
    <img src="/gercek/havuz/gorsel/mk-portre-4702.webp" alt="Gelincik tarlasında dans eden kadın" loading="lazy" />
    <div>
      <h2>Her hafta eve çiçek.</h2>
      <p>Haftalık abonelikle seçtiğin gün kapına mevsimin en güzel çiçekleri gelir. Dört teslimatlık paketler 2.900 TL'den başlar; istediğin zaman ara verebilirsin.</p>
      <a class="dugme" href="abonelik.html">Abonelik paketleri</a>
    </div>
  </div>
</section>`),
    "magaza.html": sayfa("magaza.html", "Çiçekler · Leylak Çiçek Atölyesi", "Buketler, aranjmanlar, saksı çiçekleri, kuru çiçekler ve abonelik.", `<section class="kap sayfa-bas">
  <h1>Çiçekler</h1>
  <p>Buketlerimiz küçük, orta ve büyük boyda hazırlanır. Bugün teslimat için siparişini 14.00'e kadar ver.</p>
</section>
<section class="kap" style="padding-bottom:clamp(56px,7vw,96px)">
  <div class="suzgec" role="group" aria-label="Kategori">
    <button type="button" data-kategori="Hepsi" aria-pressed="true">Hepsi</button>
${KATEGORILER.map((k) => `    <button type="button" data-kategori="${k}" aria-pressed="false">${k}</button>`).join("\n")}
    <span class="sayi" id="urunSayi" aria-live="polite"></span>
  </div>
  <div class="urun-izgara" id="urunler">
${URUNLER.map(urunKarti).join("\n")}
  </div>
</section>`),
    "urun.html": sayfa("urun.html", "Çiçek · Leylak Çiçek Atölyesi", "Leylak Çiçek Atölyesi ürün sayfası.", `<section class="kap urun-detay" id="urun" aria-live="polite"><p style="color:var(--soluk);padding:60px 0">Yükleniyor…</p></section>
<section class="kap bolum" style="padding-top:0">
  <div class="bolum-bas"><h2>Bunlar da hoşuna gidebilir</h2></div>
  <div class="urun-izgara" id="ilgili"></div>
</section>`),
    "sepet.html": sayfa("sepet.html", "Sepet · Leylak Çiçek Atölyesi", "Sepetin, teslimat günü ve kart notu.", `<section class="kap sayfa-bas" style="padding-bottom:24px"><h1>Sepet</h1></section>
<section class="kap sepet-duzen">
  <div>
    <div class="kutu bos-sepet" id="bosSepet" hidden><h2>Sepetin boş</h2><p style="color:var(--soluk)">Bugün için taze buketlerimize göz at.</p><a class="dugme" href="magaza.html">Çiçekleri gör</a></div>
    <form id="siparisFormu" novalidate>
      <div id="doluSepet" hidden>
        <div class="kutu"><h2><i>1</i>Çiçeklerin</h2><div id="kalemler"></div></div>
        <div class="kutu">
          <h2><i>2</i>Teslimat</h2>
          <div class="gunler" id="gunler" role="group" aria-label="Teslimat günü"></div>
          <div class="araliklar" id="araliklar" role="group" aria-label="Saat aralığı"></div>
          <p class="not-kucuk">Bugün teslimat için siparişler 14.00'e kadar alınır; pazar günleri teslimat yapmıyoruz.</p>
          <div style="margin-top:20px">
            <label class="alan">Teslimat semti<select name="bolge" required></select></label>
            <div class="ikili">
              <label class="alan">Alıcının adı soyadı<input name="alici" required minlength="3" /></label>
              <label class="alan">Alıcının telefonu<input name="aliciTelefon" type="tel" inputmode="tel" required placeholder="05xx xxx xx xx" /></label>
            </div>
            <label class="alan">Açık adres <small>Mahalle, sokak, bina ve daire numarası, varsa tarif</small><textarea name="adres" rows="3" required minlength="10" maxlength="400"></textarea></label>
          </div>
        </div>
        <div class="kutu">
          <h2><i>3</i>Kart notu</h2>
          <div class="kart-onizleme" id="kartOnizleme" aria-live="polite"></div>
          <label class="alan">Notun <small id="kartSayac">0 / 300</small><textarea name="kartNotu" rows="3" maxlength="300" placeholder="İyi ki doğdun, nice güzel yaşlara"></textarea></label>
          <label class="onay"><input type="checkbox" name="imzasiz" /> <span>Kartta adım yazılmasın.</span></label>
        </div>
        <div class="kutu">
          <h2><i>4</i>Senin bilgilerin</h2>
          <div class="ikili">
            <label class="alan">Adın soyadın<input name="ad" required minlength="3" autocomplete="name" /></label>
            <label class="alan">Telefonun<input name="telefon" type="tel" inputmode="tel" required autocomplete="tel" placeholder="05xx xxx xx xx" /></label>
          </div>
          <label class="alan">E-posta (isteğe bağlı)<input name="eposta" type="email" autocomplete="email" inputmode="email" /></label>
          <label class="onay"><input type="checkbox" name="kvkk" required /> <span><a href="kvkk.html" target="_blank" rel="noopener">Aydınlatma metnini</a> ve <a href="teslimat.html" target="_blank" rel="noopener">teslimat koşullarını</a> okudum, kabul ediyorum.</span></label>
          <div id="mesaj" class="mesaj" role="alert" hidden></div>
        </div>
      </div>
    </form>
  </div>
  <aside class="ozet" aria-labelledby="ozetBaslik">
    <h2 id="ozetBaslik">Özet</h2>
    <dl><dt>Çiçekler</dt><dd id="ozAra">0 TL</dd><dt>Teslimat</dt><dd id="ozTeslimat">Semt seç</dd></dl>
    <div class="toplam"><span>Toplam</span><b id="ozToplam">0 TL</b></div>
    <p class="teslim" id="ozTeslim">Teslimat günü seç</p>
    <button class="dugme" id="gonder" type="button">Siparişi ver</button>
    <p class="kucuk">Siparişin alındıktan sonra ödeme bağlantısını SMS ile gönderiyoruz; ödeme tamamlanınca hazırlığa başlıyoruz. Fiyatlara KDV dahildir.</p>
  </aside>
</section>`),
    "abonelik.html": sayfa("abonelik.html", "Haftalık çiçek aboneliği · Leylak Çiçek Atölyesi", "Her hafta seçtiğin gün kapına mevsimin çiçekleri. Dört teslimatlık paketler.", `<section class="kap sayfa-bas">
  <h1>Haftalık abonelik</h1>
  <p>Dört hafta boyunca, seçtiğin gün kapına mevsimin en güzel çiçekleri. İlk teslimat gününü sepette seçersin, sonrakiler her hafta aynı gün gelir.</p>
</section>
<section class="kap" style="padding-bottom:clamp(56px,7vw,96px)">
  <div class="plan-izgara">
    <div class="plan"><span class="ust-not">Masa için</span><h3>Küçük</h3><p class="fiyat">2.900 TL <small>dört teslimat</small></p><ul><li>Yemek ya da çalışma masası için kompakt buket</li><li>Her hafta farklı tonlar</li><li>Bakım kartı ve çiçek besini</li></ul><a class="dugme cizgi" href="urun.html?id=haftalik-seckin">Küçük boyu seç</a></div>
    <div class="plan one"><span class="ust-not">En çok seçilen</span><h3>Orta</h3><p class="fiyat">4.200 TL <small>dört teslimat</small></p><ul><li>Salon ya da giriş için bol buket</li><li>İlk teslimatta cam vazo hediye</li><li>İstediğin hafta ara verebilirsin</li></ul><a class="dugme" href="urun.html?id=haftalik-seckin">Orta boyu seç</a></div>
    <div class="plan"><span class="ust-not">Ofisler için</span><h3>Büyük</h3><p class="fiyat">5.900 TL <small>dört teslimat</small></p><ul><li>Resepsiyon ve toplantı odaları için gösterişli buket</li><li>Önceki buketi teslimatta alıyoruz</li><li>Kurumsal faturalandırma</li></ul><a class="dugme cizgi" href="urun.html?id=haftalik-seckin">Büyük boyu seç</a></div>
  </div>
</section>`),
    "kurumsal.html": sayfa("kurumsal.html", "Düğün ve kurumsal · Leylak Çiçek Atölyesi", "Düğün, nişan, açılış ve ofis çiçekleri için teklif alın.", `<section class="kap sayfa-bas">
  <h1>Düğün ve kurumsal</h1>
  <p>Gelin buketinden masa süslerine, mağaza açılışından haftalık ofis çiçeklerine kadar her etkinlik için tasarım yapıyoruz. Formu doldur, iki iş günü içinde teklifimizi gönderelim.</p>
</section>
<section class="kap ikili-bolum" style="padding-bottom:clamp(56px,7vw,96px)">
  <img src="/gercek/muzik/ms-summer.webp" alt="Çiçeklerle süslenmiş, denize bakan teras masası" loading="lazy" />
  <form class="form-kart" data-vayra-form="Etkinlik teklifi" data-vayra-tesekkur="Teşekkürler! Talebin bize ulaştı, iki iş günü içinde teklifimizi göndereceğiz.">
    <h2>Teklif iste</h2>
    <label class="alan">Etkinlik türü<select name="tur" required><option value="">Seç</option><option>Düğün</option><option>Nişan ya da söz</option><option>Açılış ve lansman</option><option>Haftalık ofis çiçekleri</option><option>Diğer</option></select></label>
    <div class="ikili">
      <label class="alan">Tarih<input name="tarih" type="date" /></label>
      <label class="alan">Yaklaşık misafir sayısı<input name="misafir" type="number" min="0" inputmode="numeric" /></label>
    </div>
    <label class="alan">Mekân ya da semt<input name="mekan" /></label>
    <label class="alan">Bütçe aralığı<select name="butce"><option>Henüz belli değil</option><option>15.000 TL'ye kadar</option><option>15.000 ile 40.000 TL</option><option>40.000 ile 100.000 TL</option><option>100.000 TL üzeri</option></select></label>
    <div class="ikili">
      <label class="alan">Ad soyad<input name="ad" required autocomplete="name" /></label>
      <label class="alan">Telefon<input name="telefon" type="tel" inputmode="tel" required autocomplete="tel" /></label>
    </div>
    <label class="alan">Hayalindeki çiçekler, renkler<textarea name="not" rows="4" placeholder="Beyaz ve yeşil tonlar, bol okaliptüs"></textarea></label>
    <label class="onay"><input type="checkbox" name="kvkk" required /> <span><a href="kvkk.html" target="_blank" rel="noopener">Aydınlatma metnini</a> okudum.</span></label>
    <button class="dugme yesil" type="submit">Teklif iste</button>
  </form>
</section>`),
    "siparis.html": sayfa("siparis.html", "Sipariş takibi · Leylak Çiçek Atölyesi", "Sipariş kodun ve telefonunun son dört hanesiyle siparişini izle.", `<section class="kap sayfa-bas">
  <h1>Sipariş takibi</h1>
  <p>Sipariş kodunu ve siparişi verirken yazdığın telefonun son dört hanesini gir.</p>
</section>
<section class="kap sorgu" style="padding-bottom:clamp(56px,7vw,96px)">
  <form class="form-kart" id="sorgu" novalidate>
    <div class="ikili">
      <label class="alan">Sipariş kodu<input name="kod" required pattern="[A-Za-z]{2}-[A-Za-z0-9]{5}" placeholder="LC-7K2PA" autocapitalize="characters" /></label>
      <label class="alan">Telefonun son dört hanesi<input name="tel" required pattern="[0-9]{4}" maxlength="4" inputmode="numeric" /></label>
    </div>
    <button class="dugme yesil" type="submit">Sorgula</button>
  </form>
  <div id="sorguSonuc" aria-live="polite"></div>
</section>`),
    "teslimat.html": sayfa("teslimat.html", "Teslimat ve iade · Leylak Çiçek Atölyesi", "Teslimat bölgeleri, ücretler, saatler ve iade koşulları.", `<section class="kap metin">
  <h1>Teslimat ve iade</h1>
  <h2>Teslimat bölgeleri ve ücretler</h2>
  <table><tbody>
${BOLGELER.map((b) => `    <tr><td>${b.ad}</td><td>${b.ucret ? b.ucret.toLocaleString("tr-TR") + " TL" : "Ücretsiz"}</td></tr>`).join("\n")}
  </tbody></table>
  <h2>Saatler</h2>
  <p>Pazartesi ile cumartesi arası, ${ARALIKLAR.join(", ")} aralıklarında teslim ediyoruz. Bugün teslimat için siparişler 14.00'e kadar alınır ve seçtiğin aralık en az iki saat sonra başlamalıdır. Pazar günleri teslimat yapmıyoruz.</p>
  <h2>Alıcıya ulaşılamazsa</h2>
  <p>Kuryemiz alıcıyı teslimattan önce arar. Adreste kimse yoksa seni arar, uygun bir komşuya ya da kapıcıya bırakır; ulaşılamazsa çiçekler atölyeye döner ve aynı gün ücretsiz ikinci teslimat yapılır.</p>
  <h2>İade</h2>
  <p>Çiçekler çabuk bozulan ürünler olduğundan cayma hakkı kapsamı dışındadır. Ancak teslimatta çiçeklerde bir sorun görürsen 24 saat içinde fotoğrafla bize yaz; buketi ücretsiz yeniliyoruz.</p>
</section>`),
    "kvkk.html": sayfa("kvkk.html", "KVKK aydınlatma metni · Leylak Çiçek Atölyesi", "Leylak Çiçek Atölyesi kişisel verilerin işlenmesine ilişkin aydınlatma metni.", `<section class="kap metin">
  <h1>Aydınlatma metni</h1>
  <p>Leylak Çiçekçilik olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında sipariş ve teklif formlarıyla işlediğimiz kişisel veriler hakkında seni bilgilendirmek isteriz.</p>
  <h2>İşlenen veriler</h2>
  <p>Senin ve alıcının adı soyadı, telefon numaraları, teslimat adresi, e-posta adresin ve kart notu.</p>
  <h2>Amaç ve hukuki sebep</h2>
  <p>Veriler, siparişin alınması, ödeme bağlantısının gönderilmesi ve çiçeklerin teslim edilmesi amacıyla Kanun'un 5/2-c maddesi (sözleşmenin ifası) uyarınca işlenir. Alıcının bilgileri yalnız teslimat için kullanılır.</p>
  <h2>Aktarım ve saklama</h2>
  <p>Veriler yalnız kuryemiz ve ödeme kuruluşuyla, ilgili amaçla sınırlı olarak paylaşılır; sipariş kayıtları mevzuat gereği on yıl saklanır.</p>
  <h2>Hakların</h2>
  <p>Kanun'un 11. maddesindeki haklarını kullanmak için merhaba@leylakcicek.com adresine yazabilirsin.</p>
</section>`),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="#23382b"/><g fill="#f4c9d6"><circle cx="32" cy="19" r="7"/><circle cx="21" cy="29" r="7"/><circle cx="43" cy="29" r="7"/><circle cx="26" cy="42" r="7"/><circle cx="38" cy="42" r="7"/></g><circle cx="32" cy="32" r="5" fill="#9c2f4f"/></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
    "api/siparis.js": SIPARIS_FN,
  },
};
