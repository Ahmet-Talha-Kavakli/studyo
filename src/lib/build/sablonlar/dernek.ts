/* Şablon: Yeşil İz Derneği — fidan bağışı toplayan dernek. Kampanyalar "kampanyalar" tablosundan (hedef, il, bitiş), ilerleme ve
 * son bağışçılar api/ozet.js sunucu fonksiyonundan (kişisel veri döndürmeden), bağış api/bagis.js ile "bagislar" tablosuna
 * (ziyaretçi okuyamaz ve doğrudan yazamaz; tutarı sunucu fidan sayısından hesaplar), havale bilgisi ve açıklama kodu, birinin
 * adına bağışta indirilebilir fidan sertifikası, şeffaflık raporu, gönüllü formu ve KVKK metni. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";

const FIDAN_FIYAT = 60;
const G = (d: string) => `/gercek/havuz/gorsel/${d}.webp`;
const KAMPANYALAR = [
  { id: "mugla-kizilcam", ad: "Marmaris yangın alanına kızılçam", il: "Muğla", bolge: "Marmaris, Hisarönü", hedef: 25000, baslangic: 18420, bitis: "2027-03-15", dikim: "Ocak ve şubat 2027", turler: "Kızılçam, fıstıkçamı, kermes meşesi", gorsel: G("mk-doga-50847"), ozet: "2025 yazında yanan 340 hektarlık alanda, Orman Bölge Müdürlüğü'nün ağaçlandırma planıyla kızılçam ormanını yeniden kuruyoruz.", aciklama: "Temmuz 2025'teki yangında Hisarönü çevresinde 340 hektar orman yandı. Toprak kış yağmurlarıyla akmadan, Orman Bölge Müdürlüğü'nün hazırladığı plan doğrultusunda bölgenin doğal türleriyle yeniden ağaçlandırma yapıyoruz. Dikimler yerel köylerden gönüllülerle yapılacak; fidanların ilk üç yaz sulaması ve bakımı kampanya bütçesine dahildir." },
  { id: "okul-bahceleri", ad: "Okul bahçeleri gölgelensin", il: "İstanbul", bolge: "Esenyurt, Sultangazi, Arnavutköy", hedef: 6000, baslangic: 4110, bitis: "2027-02-28", dikim: "Şubat ve mart 2027", turler: "Ihlamur, akçaağaç, çınar", gorsel: G("mk-yasam-4831"), ozet: "Gölgesi olmayan 40 okul bahçesine, öğrencilerle birlikte büyük taç yapan ağaçlar dikiyoruz.", aciklama: "İstanbul'un en kalabalık ilçelerinde 40 okulun bahçesi yazın gölgesiz kalıyor. Okul aile birlikleriyle birlikte belirlediğimiz noktalara, her okula ortalama 150 ağaç dikiyoruz. Dikim günlerinde her sınıf kendi ağacını sahipleniyor ve bakımını üstleniyor." },
  { id: "bafra-kavak", ad: "Kızılırmak deltasına dişbudak ve kavak", il: "Samsun", bolge: "Bafra, Kızılırmak deltası", hedef: 12000, baslangic: 3270, bitis: "2027-04-30", dikim: "Mart ve nisan 2027", turler: "Dişbudak, karakavak, söğüt", gorsel: G("mk-doga-529"), ozet: "Kuş cenneti Kızılırmak deltasında kaybolan su kenarı ormanlarını, sel riskini de azaltacak türlerle onarıyoruz.", aciklama: "Kızılırmak deltası, 350'den fazla kuş türüne ev sahipliği yapan bir sulak alan. Tarım arazilerinin genişlemesiyle küçülen subasar ormanlarını, delta yönetimiyle birlikte belirlenen alanlarda yeniden kuruyoruz. Dikilen türler taşkın sularını yavaşlatarak çevre köyleri de koruyor." },
  { id: "palandoken-saricam", ad: "Palandöken eteklerine sarıçam", il: "Erzurum", bolge: "Palandöken, Kırkgöze", hedef: 15000, baslangic: 9880, bitis: "2027-05-31", dikim: "Mayıs 2027", turler: "Sarıçam, ardıç", gorsel: G("mk-doga-41545"), ozet: "Erozyonla toprağını kaybeden yamaçlara, soğuğa dayanıklı sarıçam ve ardıçla yeşil bir kuşak oluşturuyoruz.", aciklama: "Palandöken'in kuzey yamaçlarında yıllardır süren erozyon, kar sularıyla toprağı vadiye taşıyor. Teraslama çalışması tamamlanan 120 hektarlık alana, kar kalkar kalkmaz soğuğa dayanıklı türlerle dikim yapacağız. Erzurum Atatürk Üniversitesi Orman Fakültesi fidanların gelişimini beş yıl boyunca izleyecek." },
].map((k, i) => ({ sira: i + 1, aktif: true, ...k }));

const TABLOLAR: Record<string, SablonTablo> = {
  kampanyalar: {
    aciklama: "Bağış kampanyaları. hedef: fidan sayısı; baslangic: site dışından (havale, etkinlik) gelen ve ilerlemeye eklenen fidan sayısı. İlerleme api/ozet.js ile bagislar tablosundan hesaplanır.",
    kurallar: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" },
    sema: [
      { ad: "ad", tur: "metin", zorunlu: true },
      { ad: "il", tur: "metin", zorunlu: true },
      { ad: "bolge", tur: "metin" },
      { ad: "hedef", tur: "sayi", zorunlu: true, aciklama: "Fidan" },
      { ad: "baslangic", tur: "sayi", varsayilan: 0, aciklama: "Site dışından gelen fidan" },
      { ad: "bitis", tur: "metin", aciklama: "YYYY-AA-GG" },
      { ad: "dikim", tur: "metin", aciklama: "Dikim dönemi" },
      { ad: "turler", tur: "metin" },
      { ad: "gorsel", tur: "gorsel" },
      { ad: "ozet", tur: "uzunMetin" },
      { ad: "aciklama", tur: "uzunMetin" },
      { ad: "sira", tur: "sayi" },
      { ad: "aktif", tur: "mantiksal", varsayilan: true },
    ],
    kayitlar: KAMPANYALAR,
  },
  bagislar: {
    aciklama: "Bağışlar. Yalnız api/bagis.js yazar (tutar fidan sayısından sunucuda hesaplanır); ziyaretçi okuyamaz. Havale gelince durumu Onaylandı yapın; İptal edilenler ilerlemeye sayılmaz.",
    kurallar: { okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" },
    sema: [
      { ad: "kod", tur: "metin", zorunlu: true, benzersiz: true, aciklama: "Havale açıklama kodu" },
      { ad: "kampanya", tur: "metin", zorunlu: true },
      { ad: "kampanyaAdi", tur: "metin" },
      { ad: "fidan", tur: "sayi", zorunlu: true },
      { ad: "tutar", tur: "sayi", zorunlu: true, aciklama: "TL" },
      { ad: "ad", tur: "metin", zorunlu: true },
      { ad: "eposta", tur: "eposta", zorunlu: true },
      { ad: "telefon", tur: "metin" },
      { ad: "adina", tur: "metin", aciklama: "Bağış birinin adına yapıldıysa" },
      { ad: "anonim", tur: "mantiksal", aciklama: "Bağışçı listesinde adı görünmesin" },
      { ad: "kvkk", tur: "mantiksal", zorunlu: true },
      { ad: "durum", tur: "secim", secenekler: ["Havale bekleniyor", "Onaylandı", "İptal"], varsayilan: "Havale bekleniyor" },
    ],
    kayitlar: [],
  },
};

const ust = (aktif: string) => `<a class="atla" href="#icerik">İçeriğe geç</a>
<header class="ust">
  <a class="logo" href="index.html" aria-label="Yeşil İz Derneği ana sayfa"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4 9 20h6l-7 9h10v7h4v-7h10l-7-9h6z" fill="currentColor"/></svg><span>Yeşil İz<small>Derneği</small></span></a>
  <nav class="menu" data-menu aria-label="Ana menü">
${[["kampanyalar.html", "Kampanyalar"], ["seffaflik.html", "Şeffaflık"], ["gonullu.html", "Gönüllü ol"]].map(([h, a]) => `    <a href="${h}"${h === aktif || (aktif === "kampanya.html" && h === "kampanyalar.html") ? ' aria-current="page"' : ""}>${a}</a>`).join("\n")}
  </nav>
  <a class="dugme gunes ust-dugme" href="bagis.html">Fidan bağışla</a>
  <button class="menu-dugme" type="button" data-menu-ac aria-expanded="false" aria-label="Menüyü aç"><span></span><span></span></button>
</header>`;

const alt = `<footer class="alt">
  <div class="alt-ic">
    <div><span class="alt-logo">Yeşil İz</span><p>2012'den beri Türkiye'nin dört bir yanında yangın, erozyon ve kentleşmeyle kaybolan ormanları yeniden kuruyoruz. Dernekler kütük no 34-187-092.</p></div>
    <div><h4>Dernek merkezi</h4><p>Tomtom Mah. Yeni Çarşı Cad. No: 28/3<br />Beyoğlu / İstanbul</p></div>
    <div><h4>Bağış hesabı</h4><p>Yeşil İz Derneği</p><p class="iban">TR32 0006 4000 0011 2345 6789 01</p><p>Türkiye İş Bankası, Beyoğlu şubesi</p></div>
    <div><h4>İletişim</h4><p><a href="tel:+902122495512">0212 249 55 12</a></p><p><a href="mailto:merhaba@yesiliz.org.tr">merhaba@yesiliz.org.tr</a></p><p><a href="kvkk.html">KVKK aydınlatma metni</a></p></div>
  </div>
  <p class="alt-not">Derneğimize yapılan bağışlar, Gelir Vergisi Kanunu'nun 89. maddesi kapsamında beyan edilen gelirin yüzde beşine kadar indirilebilir. Makbuzunuz havale onaylandıktan sonra e-postayla gönderilir.</p>
</footer>`;

const sayfa = (dosya: string, baslik: string, aciklama: string, govde: string) => `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${baslik}</title>
  <meta name="description" content="${aciklama}" />
  <meta name="theme-color" content="#1f3d2b" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Young+Serif&family=Work+Sans:wght@400;500;600;700&display=swap" />
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

const STIL = String.raw`/* Yeşil İz Derneği — kâğıt, orman yeşili, yosun, güneş sarısı; Young Serif ve Work Sans. */
:root {
  --kagit: #f6f3ea; --kagit-koyu: #ebe5d6; --beyaz: #fffdf7; --orman: #1f3d2b; --orman-koyu: #16301f; --yosun: #6b8f3a; --gunes: #e9b949; --gunes-koyu: #d6a42f;
  --kil: #b4582f; --soluk: #5c6458; --cizgi: rgba(31, 61, 43, .15); --serif: "Young Serif", Georgia, serif; --sans: "Work Sans", system-ui, sans-serif;
}
[hidden] { display: none !important; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--kagit); color: var(--orman); font: 400 16.5px/1.65 var(--sans); -webkit-font-smoothing: antialiased; }
img { display: block; max-width: 100%; }
a { color: inherit; }
h1, h2, h3 { font-family: var(--serif); font-weight: 400; line-height: 1.1; margin: 0; letter-spacing: -.01em; }
:focus-visible { outline: 3px solid var(--gunes); outline-offset: 2px; }
.atla { position: absolute; left: -999px; top: 8px; background: var(--orman); color: #fff; padding: 8px 14px; z-index: 60; }
.atla:focus { left: 12px; }
.kap { max-width: 1260px; margin: 0 auto; padding: 0 clamp(18px, 4.5vw, 52px); }
.ust { position: sticky; top: 0; z-index: 40; display: flex; align-items: center; gap: 24px; padding: 13px clamp(18px, 4.5vw, 52px); background: color-mix(in srgb, var(--kagit) 94%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--cizgi); }
.logo { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: var(--yosun); }
.logo svg { width: 34px; height: 34px; }
.logo span { font-family: var(--serif); font-size: 25px; color: var(--orman); line-height: 1; }
.logo small { display: block; font-family: var(--sans); font-size: 12px; color: var(--soluk); margin-top: 3px; letter-spacing: .06em; }
.menu { display: flex; gap: 4px; margin-left: auto; }
.menu a { text-decoration: none; padding: 9px 14px; font-weight: 500; font-size: 15px; border-radius: 10px; }
.menu a:hover { background: var(--kagit-koyu); }
.menu a[aria-current] { color: var(--yosun); text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 2px; }
.menu-dugme { display: none; width: 46px; height: 46px; border-radius: 12px; border: 1px solid var(--cizgi); background: var(--beyaz); cursor: pointer; flex-direction: column; justify-content: center; align-items: center; gap: 6px; }
.menu-dugme span { width: 18px; height: 2px; border-radius: 2px; background: var(--orman); }
.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px; padding: 14px 26px; border: 0; border-radius: 14px; background: var(--orman); color: #fff; font: 600 15.5px/1 var(--sans); text-decoration: none; cursor: pointer; transition: background .2s, transform .15s; }
.dugme:hover { background: var(--orman-koyu); }
.dugme:active { transform: scale(.98); }
.dugme.gunes { background: var(--gunes); color: var(--orman); }
.dugme.gunes:hover { background: var(--gunes-koyu); }
.dugme.cizgi { background: transparent; color: var(--orman); box-shadow: inset 0 0 0 2px var(--orman); }
.dugme.cizgi:hover { background: var(--orman); color: #fff; }
.dugme[disabled] { opacity: .55; cursor: not-allowed; }
.ust-dugme { min-height: 44px; padding: 11px 20px; }

/* Kahraman */
.kahraman { padding-block: clamp(20px, 3vw, 36px) 0; }
.kahraman-kart { position: relative; border-radius: 34px; overflow: hidden; color: #fff; isolation: isolate; min-height: min(78vh, 720px); display: grid; grid-template-columns: 1.2fr .8fr; align-items: end; gap: 24px; padding: clamp(24px, 5vw, 64px); }
.kahraman-kart > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -2; }
.kahraman-kart::after { content: ""; position: absolute; inset: 0; z-index: -1; background: linear-gradient(180deg, rgba(14, 32, 20, .15), rgba(14, 32, 20, .2) 40%, rgba(14, 32, 20, .78)); }
.kahraman h1 { font-size: clamp(46px, 6.6vw, 96px); line-height: 1; }
.kahraman h1 em { font-style: normal; color: var(--gunes); }
.kahraman p.giris { font-size: 19px; max-width: 560px; margin: 20px 0 28px; color: #e8eee6; }
.sayac-kart { background: var(--beyaz); color: var(--orman); border-radius: 24px; padding: 24px 26px; }
.sayac-kart small { display: block; font-size: 14px; color: var(--soluk); }
.sayac-kart .buyuk-sayi { font-family: var(--serif); font-size: clamp(46px, 5vw, 64px); line-height: 1.05; color: var(--orman); }
.sayac-kart .alt-satir { display: flex; gap: 20px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--cizgi); font-size: 14px; color: var(--soluk); }
.sayac-kart .alt-satir b { display: block; font-size: 20px; color: var(--orman); }

.bolum { padding-block: clamp(56px, 8vw, 112px); }
.bolum-bas { display: flex; justify-content: space-between; align-items: end; gap: 20px; flex-wrap: wrap; margin-bottom: clamp(26px, 3.5vw, 44px); }
.bolum-bas h2 { font-size: clamp(38px, 4.6vw, 62px); }
.bolum-bas p { color: var(--soluk); max-width: 540px; margin: 12px 0 0; }
.ust-yazi { display: inline-block; font-weight: 600; font-size: 14px; color: var(--kil); margin-bottom: 12px; letter-spacing: .02em; }

.kampanya-izgara { display: grid; grid-template-columns: repeat(2, 1fr); gap: clamp(18px, 2.5vw, 30px); }
.kampanya { background: var(--beyaz); border-radius: 28px; overflow: hidden; display: grid; grid-template-rows: auto 1fr; text-decoration: none; border: 1px solid var(--cizgi); transition: transform .25s, border-color .25s; }
.kampanya:hover { transform: translateY(-3px); border-color: var(--yosun); }
.kampanya-foto { position: relative; aspect-ratio: 16 / 9; overflow: hidden; background: var(--kagit-koyu); }
.kampanya-foto img { width: 100%; height: 100%; object-fit: cover; }
.kampanya-foto .il { position: absolute; left: 14px; top: 14px; background: var(--beyaz); border-radius: 99px; padding: 6px 13px; font-size: 13px; font-weight: 600; }
.kampanya-ic { padding: 22px 24px 26px; display: grid; gap: 12px; align-content: start; }
.kampanya h3 { font-size: 27px; }
.kampanya p { margin: 0; color: var(--soluk); font-size: 15px; }
.ilerleme { height: 12px; border-radius: 99px; background: var(--kagit-koyu); overflow: hidden; }
.ilerleme i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--yosun), #8db04f); width: 0; transition: width 1.2s cubic-bezier(.2, .7, .2, 1); }
.ilerleme-yazi { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; font-size: 14px; color: var(--soluk); }
.ilerleme-yazi b { color: var(--orman); font-size: 16px; }

.adimlar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.adim { background: var(--orman); color: #d7e2d6; border-radius: 26px; padding: 30px; }
.adim .no { font-family: var(--serif); font-size: 54px; color: var(--gunes); line-height: 1; }
.adim h3 { color: #fff; font-size: 26px; margin: 14px 0 8px; }
.adim p { margin: 0; font-size: 15.5px; }

.ikili { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(24px, 5vw, 64px); align-items: center; }
.ikili > img { width: 100%; aspect-ratio: 5 / 4; object-fit: cover; border-radius: 30px; }
.cubuklar { display: grid; gap: 16px; margin-top: 20px; }
.cubuk div:first-child { display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 6px; }
.cubuk b { font-weight: 600; }
.cubuk .ilerleme i { background: var(--orman); }
.cubuk:nth-child(2) .ilerleme i { background: var(--yosun); }
.cubuk:nth-child(3) .ilerleme i { background: var(--gunes); }
.cubuk:nth-child(4) .ilerleme i { background: var(--kil); }

.bagiscilar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.bagisci { display: flex; gap: 12px; align-items: center; background: var(--beyaz); border-radius: 18px; padding: 14px 16px; border: 1px solid var(--cizgi); font-size: 14.5px; }
.bagisci .bas { width: 42px; height: 42px; border-radius: 50%; background: var(--kagit-koyu); display: grid; place-items: center; font-family: var(--serif); color: var(--yosun); flex: none; }
.bagisci b { display: block; }
.bagisci span { color: var(--soluk); font-size: 13.5px; }

.haber-izgara { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.haber { display: grid; gap: 12px; text-decoration: none; }
.haber img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 22px; }
.haber time { font-size: 13.5px; color: var(--kil); font-weight: 600; }
.haber h3 { font-size: 24px; }
.haber p { margin: 0; color: var(--soluk); font-size: 15px; }

.cagri { background: var(--gunes); border-radius: 32px; padding: clamp(32px, 5vw, 64px); display: grid; grid-template-columns: 1.3fr .7fr; gap: 24px; align-items: center; }
.cagri h2 { font-size: clamp(36px, 4.4vw, 58px); }
.cagri p { margin: 14px 0 0; font-size: 17px; }
.cagri .eylem { display: grid; gap: 10px; justify-items: start; }

/* Sayfa başı */
.sayfa-bas { padding-block: clamp(40px, 6vw, 80px) clamp(24px, 3vw, 36px); }
.sayfa-bas h1 { font-size: clamp(46px, 6.4vw, 88px); }
.sayfa-bas p { color: var(--soluk); max-width: 660px; font-size: 18px; margin: 16px 0 0; }

/* Kampanya detayı */
.detay { display: grid; grid-template-columns: 1.25fr .75fr; gap: clamp(24px, 4vw, 56px); align-items: start; padding-block: clamp(20px, 3vw, 40px) clamp(56px, 7vw, 96px); }
.detay > * { min-width: 0; }
.detay .buyuk { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 30px; }
.detay h1 { font-size: clamp(40px, 5vw, 66px); margin: 24px 0 14px; }
.detay .aciklama { font-size: 17.5px; color: var(--soluk); }
.bilgi-tablo { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 26px 0; }
.bilgi-tablo div { background: var(--beyaz); border-radius: 18px; padding: 16px; border: 1px solid var(--cizgi); }
.bilgi-tablo small { display: block; color: var(--soluk); font-size: 13px; }
.bilgi-tablo b { font-weight: 600; }
.yan-kart { position: sticky; top: 96px; background: var(--beyaz); border-radius: 28px; padding: 26px; border: 1px solid var(--cizgi); display: grid; gap: 14px; }
.yan-kart .buyuk-sayi { font-family: var(--serif); font-size: 46px; line-height: 1; }
.yan-kart .geri { color: var(--soluk); font-size: 14.5px; }
.hizli { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.hizli a { display: grid; place-items: center; min-height: 52px; border-radius: 14px; border: 1.5px solid var(--cizgi); text-decoration: none; font-weight: 600; font-size: 15px; }
.hizli a:hover { border-color: var(--orman); }

/* Bağış */
.bagis-duzen { display: grid; grid-template-columns: 1fr 380px; gap: clamp(24px, 4vw, 48px); align-items: start; padding-bottom: clamp(56px, 7vw, 96px); }
.bagis-duzen > * { min-width: 0; }
.blok { background: var(--beyaz); border-radius: 28px; padding: clamp(20px, 3vw, 30px); border: 1px solid var(--cizgi); margin-bottom: 18px; }
.blok h2 { font-size: 29px; margin-bottom: 18px; display: flex; gap: 12px; align-items: center; }
.blok h2 i { font-style: normal; font-family: var(--sans); width: 32px; height: 32px; border-radius: 50%; background: var(--gunes); display: grid; place-items: center; font-size: 15px; font-weight: 700; }
.secim-kart { display: grid; gap: 10px; }
.sk { position: relative; }
.sk input { position: absolute; opacity: 0; inset: 0; cursor: pointer; }
.sk > span { display: grid; grid-template-columns: 64px 1fr; gap: 14px; align-items: center; padding: 10px 14px 10px 10px; border-radius: 18px; border: 2px solid var(--cizgi); background: var(--kagit); }
.sk img { width: 64px; height: 64px; object-fit: cover; border-radius: 12px; }
.sk b { display: block; font-weight: 600; font-size: 15.5px; }
.sk small { color: var(--soluk); font-size: 13.5px; }
.sk input:checked + span { border-color: var(--yosun); background: #f1f5e8; }
.sk input:focus-visible + span { outline: 3px solid var(--gunes); outline-offset: 2px; }
.paketler { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.paket { min-height: 92px; border-radius: 18px; border: 2px solid var(--cizgi); background: var(--kagit); cursor: pointer; display: grid; place-content: center; gap: 2px; font: 500 14px var(--sans); color: var(--soluk); }
.paket b { font-family: var(--serif); font-weight: 400; font-size: 30px; color: var(--orman); line-height: 1; }
.paket[aria-pressed="true"] { border-color: var(--yosun); background: #f1f5e8; }
.ozel { display: flex; gap: 12px; align-items: center; margin-top: 14px; flex-wrap: wrap; }
.ozel input { width: 140px; min-height: 50px; padding: 10px 14px; border-radius: 14px; border: 2px solid var(--cizgi); font: 600 17px var(--sans); color: var(--orman); background: #fff; }
.ozel span { color: var(--soluk); font-size: 15px; }
.etki { margin: 16px 0 0; padding: 14px 16px; border-radius: 16px; background: var(--kagit); font-size: 15px; }
.alan { display: grid; gap: 6px; font-size: 14px; font-weight: 600; margin-bottom: 14px; }
.alan small { font-weight: 400; color: var(--soluk); }
.alan input, .alan select, .alan textarea { width: 100%; min-height: 50px; padding: 12px 14px; border-radius: 14px; border: 2px solid var(--cizgi); background: #fff; font: 400 16px var(--sans); color: var(--orman); }
.alan input:focus, .alan select:focus, .alan textarea:focus { outline: none; border-color: var(--yosun); }
.iki-sutun { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.onay { display: flex; gap: 12px; align-items: flex-start; font-size: 14.5px; color: var(--soluk); margin: 4px 0 12px; cursor: pointer; }
.onay input { width: 22px; height: 22px; accent-color: var(--yosun); flex: none; margin: 1px 0 0; }
.ozet { position: sticky; top: 96px; background: var(--orman); color: #d2ded1; border-radius: 28px; padding: 26px; }
.ozet h2 { color: #fff; font-size: 30px; margin-bottom: 14px; }
.ozet dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; font-size: 15px; }
.ozet dd { margin: 0; text-align: right; color: #fff; }
.ozet .toplam { display: flex; justify-content: space-between; align-items: baseline; margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, .18); color: #fff; }
.ozet .toplam b { font-family: var(--serif); font-size: 42px; font-weight: 400; }
.ozet .dugme { width: 100%; margin-top: 18px; }
.ozet p { font-size: 13.5px; margin: 12px 0 0; }
.mesaj { border-radius: 16px; padding: 14px 16px; font-size: 15px; margin-top: 12px; }
.mesaj b { display: block; }
.mesaj.hata { background: #f7e1d6; color: #7a3016; }
.mesaj.bilgi { background: #eaf0dc; color: var(--orman); }
.basari { max-width: 760px; margin: 0 auto; padding: clamp(40px, 6vw, 80px) clamp(18px, 4vw, 24px); text-align: center; }
.basari h1 { font-size: clamp(42px, 5.6vw, 70px); }
.basari > p { color: var(--soluk); font-size: 17px; }
.havale { text-align: left; background: var(--beyaz); border: 1px solid var(--cizgi); border-radius: 26px; padding: 24px; margin: 26px 0; display: grid; gap: 12px; }
.havale div { display: grid; grid-template-columns: 150px 1fr auto; gap: 12px; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--cizgi); }
.havale div:last-child { border-bottom: 0; padding-bottom: 0; }
.havale span { color: var(--soluk); font-size: 14px; }
.havale b { font-weight: 600; overflow-wrap: anywhere; }
.havale .kod { font-family: var(--serif); font-weight: 400; font-size: 26px; color: var(--kil); }
.kopyala { min-height: 40px; padding: 8px 14px; border-radius: 10px; border: 1.5px solid var(--cizgi); background: transparent; font: 600 13.5px var(--sans); color: var(--orman); cursor: pointer; }

/* Şeffaflık */
.rakamlar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.rakamlar div { background: var(--beyaz); border-radius: 22px; padding: 22px; border: 1px solid var(--cizgi); }
.rakamlar b { display: block; font-family: var(--serif); font-weight: 400; font-size: clamp(34px, 3.4vw, 46px); line-height: 1.1; }
.rakamlar span { font-size: 14.5px; color: var(--soluk); }
.yillar { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; align-items: end; height: 260px; padding: 20px 0 0; border-bottom: 2px solid var(--orman); }
.yil { display: grid; gap: 8px; justify-items: center; align-self: stretch; grid-template-rows: auto 1fr; }
.yil .sutun { width: 100%; max-width: 90px; border-radius: 14px 14px 0 0; background: var(--yosun); align-self: end; }
.yil:last-child .sutun { background: var(--gunes); }
.yil b { font-size: 14px; }
.yil-ad { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; text-align: center; font-size: 14px; color: var(--soluk); padding-top: 8px; }
.belge-liste { list-style: none; padding: 0; margin: 0; border-top: 1px solid var(--cizgi); }
.belge-liste li { display: flex; justify-content: space-between; gap: 14px; padding: 16px 0; border-bottom: 1px solid var(--cizgi); flex-wrap: wrap; }
.belge-liste span { color: var(--soluk); font-size: 14.5px; }

/* Gönüllü */
.etkinlik-liste { display: grid; gap: 12px; }
.etkinlik { display: grid; grid-template-columns: 84px 1fr auto; gap: 18px; align-items: center; background: var(--beyaz); border-radius: 22px; padding: 16px 20px; border: 1px solid var(--cizgi); }
.etkinlik .tarih { text-align: center; background: var(--kagit-koyu); border-radius: 16px; padding: 10px 0; }
.etkinlik .tarih b { display: block; font-family: var(--serif); font-weight: 400; font-size: 30px; line-height: 1; }
.etkinlik .tarih span { font-size: 13px; color: var(--soluk); }
.etkinlik h3 { font-size: 22px; }
.etkinlik p { margin: 2px 0 0; color: var(--soluk); font-size: 14.5px; }
.etkinlik .kontenjan { font-size: 13.5px; font-weight: 600; color: var(--yosun); }
.form-kart { background: var(--beyaz); border-radius: 28px; padding: clamp(20px, 3vw, 32px); border: 1px solid var(--cizgi); }
.form-kart h2 { font-size: 34px; margin-bottom: 16px; }

.metin { max-width: 820px; padding-block: clamp(36px, 5vw, 64px); }
.metin h1 { font-size: clamp(40px, 5vw, 62px); margin-bottom: 18px; }
.metin h2 { font-size: 28px; margin: 30px 0 10px; }
.metin p, .metin li { color: var(--soluk); }

.alt { background: var(--orman); color: #b6c6b5; padding: clamp(48px, 6vw, 72px) clamp(18px, 4.5vw, 52px) 28px; }
.alt-ic { max-width: 1260px; margin: 0 auto; display: grid; grid-template-columns: 1.4fr 1fr 1.2fr 1fr; gap: 30px; }
.alt-logo { font-family: var(--serif); font-size: 40px; color: #fff; }
.alt h4 { color: var(--gunes); margin: 0 0 10px; font-size: 14.5px; }
.alt p { margin: 6px 0; font-size: 14.5px; }
.alt .iban { color: #fff; font-weight: 600; overflow-wrap: anywhere; }
.alt a { color: #eef3ec; text-decoration: none; }
.alt a:hover { text-decoration: underline; }
.alt-not { max-width: 1260px; margin: 36px auto 0; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, .14); font-size: 13.5px; }
.bildirim { position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 180%); background: var(--orman); color: #fff; padding: 14px 22px; border-radius: 14px; font-weight: 600; font-size: 15px; z-index: 60; transition: transform .35s; max-width: calc(100vw - 32px); }
.bildirim.acik { transform: translate(-50%, 0); }

@media (max-width: 1060px) {
  .bagis-duzen, .detay { grid-template-columns: 1fr; }
  .ozet, .yan-kart { position: static; }
  .rakamlar { grid-template-columns: 1fr 1fr; }
  .alt-ic { grid-template-columns: 1fr 1fr; }
  .bagiscilar { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 860px) {
  .menu { display: none; position: absolute; left: 12px; right: 12px; top: calc(100% + 8px); flex-direction: column; background: var(--beyaz); border: 1px solid var(--cizgi); border-radius: 20px; padding: 10px; }
  .menu.acik { display: flex; }
  .menu a { padding: 14px 16px; font-size: 17px; }
  .menu-dugme { display: inline-flex; }
  .ust-dugme { margin-left: auto; }
  .kahraman-kart { grid-template-columns: 1fr; min-height: 0; padding-top: 180px; }
  .kampanya-izgara, .adimlar, .ikili, .haber-izgara, .cagri { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .logo small { display: none; }
  .logo span { font-size: 22px; }
  .ust { gap: 12px; }
  .ust-dugme { padding: 10px 14px; font-size: 14px; }
  .kahraman { padding-top: 10px; }
  .kahraman-kart { border-radius: 26px; padding: 150px 18px 18px; }
  .kahraman p.giris { font-size: 17px; }
  .sayac-kart .alt-satir { gap: 14px; }
  .bagiscilar { grid-template-columns: 1fr; }
  .paketler { grid-template-columns: 1fr 1fr; }
  .iki-sutun, .bilgi-tablo { grid-template-columns: 1fr; }
  .hizli { grid-template-columns: 1fr 1fr; }
  .havale div { grid-template-columns: 1fr auto; }
  .havale div span { grid-column: 1 / -1; }
  .yillar { gap: 8px; height: 220px; }
  .yil-ad { gap: 8px; }
  .etkinlik { grid-template-columns: 64px 1fr; }
  .etkinlik .dugme { grid-column: 1 / -1; }
  .alt-ic { grid-template-columns: 1fr; }
  .rakamlar { grid-template-columns: 1fr 1fr; gap: 10px; }
  .rakamlar div { padding: 16px; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; scroll-behavior: auto !important; } }
`;

const OZET_FN = String.raw`/* Sunucu fonksiyonu: kampanya ilerlemesi ve son bağışçılar (GET /api/ozet). "bagislar" tablosu ziyaretçiye kapalıdır;
 * burada yalnız kampanya başına fidan sayısı, bağışçı sayısı ve anonim olmayan son bağışçıların adı ile soyadının baş harfi döner. */
export default async function (istek, vayra) {
  var l = await vayra.veri.liste("bagislar", { sirala: "olusturma", yon: "azalan", sinir: 1000 });
  var kampanyalar = {}, bagisci = 0, son = [];
  l.forEach(function (b) {
    if (b.durum === "İptal") return;
    kampanyalar[b.kampanya] = (kampanyalar[b.kampanya] || 0) + (Number(b.fidan) || 0);
    bagisci++;
    if (!b.anonim && son.length < 6) { var p = String(b.ad || "").trim().split(/\s+/); son.push({ ad: p[0] + (p.length > 1 ? " " + p[p.length - 1].charAt(0) + "." : ""), fidan: Number(b.fidan) || 0, kampanya: b.kampanya, zaman: b.olusturma }); }
  });
  return { durum: 200, basliklar: { "Cache-Control": "no-store" }, govde: { kampanyalar: kampanyalar, bagisci: bagisci, son: son } };
}
`;

const BAGIS_FN = String.raw`/* Sunucu fonksiyonu: bağış kaydı (POST /api/bagis). Tutar fidan sayısından burada hesaplanır; havale açıklama kodu üretilir. */
var FIDAN_FIYAT = ${FIDAN_FIYAT};
export default async function (istek, vayra) {
  if (istek.yontem !== "POST") return { durum: 405, govde: { hata: "Yalnız POST." } };
  var g = istek.govde;
  if (!g || typeof g !== "object") { try { g = JSON.parse(istek.metin || "{}"); } catch (e) { g = {}; } }
  if (g.kvkk !== true) return { durum: 400, govde: { hata: "Aydınlatma metni onayı gerekli." } };
  var fidan = Math.floor(Number(g.fidan));
  if (!(fidan >= 1 && fidan <= 5000)) return { durum: 400, govde: { hata: "Fidan sayısı 1 ile 5000 arasında olmalı." } };
  var ad = String(g.ad || "").trim().slice(0, 80), eposta = String(g.eposta || "").trim().slice(0, 120);
  if (ad.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) return { durum: 400, govde: { hata: "Ad soyad ve geçerli bir e-posta adresi gerekli." } };
  var k = (await vayra.veri.liste("kampanyalar", { sinir: 200 })).find(function (x) { return x.id === g.kampanya && x.aktif !== false; });
  if (!k) return { durum: 404, govde: { hata: "Kampanya bulunamadı." } };
  var bugun = new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);
  if (k.bitis && String(k.bitis) < bugun) return { durum: 400, govde: { hata: "Bu kampanya sona erdi." } };
  var harf = "ABCDEFGHJKLMNPRSTUVYZ23456789", kod = "YI-";
  for (var i = 0; i < 6; i++) kod += harf.charAt(Math.floor(Math.random() * harf.length));
  var tutar = fidan * FIDAN_FIYAT;
  await vayra.veri.ekle("bagislar", { kod: kod, kampanya: k.id, kampanyaAdi: k.ad, fidan: fidan, tutar: tutar, ad: ad, eposta: eposta, telefon: g.telefon ? String(g.telefon).slice(0, 20) : null, adina: g.adina ? String(g.adina).trim().slice(0, 80) : null, anonim: g.anonim === true, kvkk: true, durum: "Havale bekleniyor" });
  return { durum: 201, basliklar: { "Cache-Control": "no-store" }, govde: { ok: true, kod: kod, tutar: tutar, fidan: fidan, kampanya: k.ad } };
}
`;

const UYGULAMA = ORTAK_JS + String.raw`
/* ── Yeşil İz Derneği ──
 * Kampanyalar "kampanyalar" tablosundan; ilerleme api/ozet.js'ten (bağışlar + tablodaki baslangic). Bağış api/bagis.js'e gider.
 * Canlı önizlemede fonksiyon olmadığından ilerleme yalnız baslangic sayılarıyla gösterilir. */
var YEDEK = ${JSON.stringify(KAMPANYALAR)};
var FIDAN_FIYAT = ${FIDAN_FIYAT};
var IBAN = "TR32 0006 4000 0011 2345 6789 01";
var SAYFA = document.body.dataset.sayfa;
function sayi(n) { return Number(n || 0).toLocaleString("tr-TR"); }

var veriSoz = null;
function veriler() {
  if (!veriSoz) veriSoz = Promise.all([
    (veriVar() ? vayra.veri.liste("kampanyalar", { sirala: "sira", yon: "artan", sinir: 100 }) : Promise.resolve(YEDEK.slice())).catch(function () { return YEDEK.slice(); }),
    // Özet gecikirse kampanyalar beklemeden tablodaki sayılarla gösterilir.
    fonksiyonVar() ? Promise.race([fonksiyonOku("ozet").catch(function () { return {}; }), new Promise(function (r) { setTimeout(function () { r({}); }, 5000); })]) : Promise.resolve({}),
  ]).then(function (r) {
    var oz = r[1] || {}, bag = oz.kampanyalar || {};
    var l = r[0].filter(function (k) { return k.aktif !== false; }).map(function (k) { var t = (Number(k.baslangic) || 0) + (Number(bag[k.id]) || 0); return Object.assign({}, k, { toplam: t, oran: Math.min(100, Math.round((t / (Number(k.hedef) || 1)) * 1000) / 10) }); });
    return { kampanyalar: l, son: oz.son || [], bagisci: oz.bagisci || 0 };
  });
  return veriSoz;
}
function kalanGun(t) { if (!t) return null; return Math.ceil((new Date(t + "T12:00:00Z") - new Date(istanbul().tarih + "T12:00:00Z")) / 864e5); }
function kampanyaKarti(k) {
  var g = kalanGun(k.bitis);
  return '<a class="kampanya" href="kampanya.html?id=' + encodeURIComponent(k.id) + '"><div class="kampanya-foto"><img src="' + kacir(k.gorsel) + '" alt="" loading="lazy" /><span class="il">' + kacir(k.il) + '</span></div><div class="kampanya-ic"><h3>' + kacir(k.ad) + "</h3><p>" + kacir(k.ozet) + '</p><div class="ilerleme" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + k.oran + '" aria-label="İlerleme"><i data-oran="' + k.oran + '"></i></div><div class="ilerleme-yazi"><span><b>' + sayi(k.toplam) + "</b> / " + sayi(k.hedef) + " fidan</span><span>" + (g === null ? "" : g > 0 ? g + " gün kaldı" : "Sona erdi") + "</span></div></div></a>";
}
/** İlerleme çubuklarını doldurur (genişlik geçişiyle soldan dolar). */
function cubuklariDoldur() {
  requestAnimationFrame(function () { requestAnimationFrame(function () { $$(".ilerleme i[data-oran]").forEach(function (i) { i.style.width = i.dataset.oran + "%"; }); }); });
}
cubuklariDoldur();
function sayacAnimasyon(el, hedef) {
  var bas = performance.now(), s = 1400;
  (function adim(t) { var p = Math.min(1, (t - bas) / s), e = 1 - Math.pow(1 - p, 3); el.textContent = sayi(Math.round(hedef * e)); if (p < 1) requestAnimationFrame(adim); })(bas);
}

if (SAYFA === "index") {
  veriler().then(function (v) {
    var top = v.kampanyalar.reduce(function (t, k) { return t + k.toplam; }, 0);
    sayacAnimasyon($("#toplamFidan"), 61240 + top);
    $("#aktifKampanya").textContent = v.kampanyalar.length;
    $("#kampanyaListe").innerHTML = v.kampanyalar.slice(0, 4).map(kampanyaKarti).join("");
    cubuklariDoldur();
    if (v.son.length) {
      var ad = {}; v.kampanyalar.forEach(function (k) { ad[k.id] = k.il; });
      $("#sonBagiscilar").hidden = false;
      $("#bagisciListe").innerHTML = v.son.map(function (b) { return '<div class="bagisci"><span class="bas">' + kacir(b.ad.charAt(0)) + "</span><div><b>" + kacir(b.ad) + "</b><span>" + sayi(b.fidan) + " fidan, " + kacir(ad[b.kampanya] || "") + "</span></div></div>"; }).join("");
    }
  });
}
if (SAYFA === "kampanyalar") {
  veriler().then(function (v) {
    var iller = Array.from(new Set(v.kampanyalar.map(function (k) { return k.il; }))), sec = "Hepsi";
    $("#ilSuzgec").innerHTML = ["Hepsi"].concat(iller).map(function (i) { return '<button type="button" class="dugme ' + (i === sec ? "" : "cizgi") + '" data-il="' + kacir(i) + '" aria-pressed="' + (i === sec) + '">' + kacir(i === "Hepsi" ? "Bütün iller" : i) + "</button>"; }).join("");
    function ciz() {
      $$("#ilSuzgec button").forEach(function (b) { var a = b.dataset.il === sec; b.setAttribute("aria-pressed", String(a)); b.classList.toggle("cizgi", !a); });
      $("#kampanyaListe").innerHTML = v.kampanyalar.filter(function (k) { return sec === "Hepsi" || k.il === sec; }).map(kampanyaKarti).join("");
      cubuklariDoldur();
    }
    ciz();
    $("#ilSuzgec").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; sec = b.dataset.il; ciz(); });
  });
}
if (SAYFA === "kampanya") {
  var kid = new URLSearchParams(location.search).get("id");
  veriler().then(function (v) {
    var k = v.kampanyalar.find(function (x) { return x.id === kid; }) || v.kampanyalar[0], yer = $("#detay");
    if (!k) { yer.innerHTML = '<p>Kampanya bulunamadı. <a href="kampanyalar.html">Bütün kampanyalar</a></p>'; return; }
    document.title = k.ad + " · Yeşil İz Derneği";
    var g = kalanGun(k.bitis), kalan = Math.max(0, k.hedef - k.toplam);
    yer.innerHTML = '<div><img class="buyuk" src="' + kacir(k.gorsel) + '" alt="" /><span class="ust-yazi" style="margin-top:24px">' + kacir(k.il + ", " + (k.bolge || "")) + "</span><h1 style=\"margin-top:0\">" + kacir(k.ad) + '</h1><p class="aciklama">' + kacir(k.aciklama) + '</p><div class="bilgi-tablo"><div><small>Dikilecek türler</small><b>' + kacir(k.turler || "") + "</b></div><div><small>Dikim dönemi</small><b>" + kacir(k.dikim || "") + "</b></div><div><small>Kampanya bitişi</small><b>" + (k.bitis ? tarihYaz(k.bitis, { year: "numeric" }) : "Süresiz") + "</b></div></div></div>"
      + '<aside class="yan-kart"><span class="buyuk-sayi">' + sayi(k.toplam) + '</span><span>' + sayi(k.hedef) + ' fidan hedefinin yüzde ' + String(k.oran).replace(".", ",") + ' kadarı toplandı</span><div class="ilerleme"><i data-oran="' + k.oran + '"></i></div><span style="color:var(--soluk);font-size:15px">' + (kalan ? "Hedefe " + sayi(kalan) + " fidan kaldı" : "Hedefe ulaşıldı, teşekkürler!") + (g !== null && g > 0 ? ", son " + g + " gün." : ".") + '</span><p style="margin:6px 0 0;font-weight:600">Hızlı bağış</p><div class="hizli">' + [1, 5, 10, 25].map(function (n) { return '<a href="bagis.html?kampanya=' + encodeURIComponent(k.id) + "&fidan=" + n + '">' + n + " fidan</a>"; }).join("") + '</div><a class="dugme gunes" href="bagis.html?kampanya=' + encodeURIComponent(k.id) + '">Bu kampanyaya bağış yap</a><a class="geri" href="kampanyalar.html">Bütün kampanyalar</a></aside>';
    cubuklariDoldur();
  });
}

/* Bağış */
if (SAYFA === "bagis") {
  var q = new URLSearchParams(location.search), form = $("#bagisFormu"), mesaj = $("#mesaj"), fidan = Math.max(1, Math.min(5000, Number(q.get("fidan")) || 5));
  function goster(tur, baslik, metin) { mesaj.hidden = false; mesaj.className = "mesaj " + tur; mesaj.innerHTML = "<b>" + kacir(baslik) + "</b>" + kacir(metin || ""); mesaj.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  veriler().then(function (v) {
    var aktifler = v.kampanyalar.filter(function (k) { var g = kalanGun(k.bitis); return g === null || g > 0; });
    var sec = (aktifler.find(function (k) { return k.id === q.get("kampanya"); }) || aktifler[0] || {}).id;
    $("#kampanyaSec").innerHTML = aktifler.map(function (k) { return '<label class="sk"><input type="radio" name="kampanya" value="' + kacir(k.id) + '"' + (k.id === sec ? " checked" : "") + ' /><span><img src="' + kacir(k.gorsel) + '" alt="" /><span><b>' + kacir(k.ad) + "</b><small>" + kacir(k.il) + ", yüzde " + String(k.oran).replace(".", ",") + " tamamlandı</small></span></span></label>"; }).join("");
    ozetCiz();
  });
  function paketCiz() { $$(".paket").forEach(function (p) { p.setAttribute("aria-pressed", String(Number(p.dataset.fidan) === fidan)); }); form.ozelFidan.value = fidan; }
  $(".paketler").addEventListener("click", function (e) { var p = e.target.closest(".paket"); if (!p) return; fidan = Number(p.dataset.fidan); paketCiz(); ozetCiz(); });
  form.ozelFidan.addEventListener("input", function () { var n = Math.floor(Number(form.ozelFidan.value)); if (n >= 1 && n <= 5000) { fidan = n; $$(".paket").forEach(function (p) { p.setAttribute("aria-pressed", String(Number(p.dataset.fidan) === fidan)); }); ozetCiz(); } });
  form.adinaMi.addEventListener("change", function () { $("#adinaAlan").hidden = !form.adinaMi.checked; form.adina.required = form.adinaMi.checked; ozetCiz(); });
  form.addEventListener("change", function (e) { if (e.target.name === "kampanya") ozetCiz(); });
  function ozetCiz() {
    var r = form.querySelector("input[name=kampanya]:checked"), lbl = r ? r.closest(".sk").querySelector("b").textContent : "Seçilmedi";
    $("#ozKampanya").textContent = lbl; $("#ozFidan").textContent = sayi(fidan) + " fidan"; $("#ozToplam").textContent = tl(fidan * FIDAN_FIYAT);
    var co2 = Math.round(fidan * 22), alan = Math.round(fidan * 4);
    $("#etki").innerHTML = "<b>" + sayi(fidan) + " fidan</b>, yetişkin olduklarında yılda yaklaşık " + sayi(co2) + " kilogram karbonu bağlar ve " + sayi(alan) + " metrekarelik toprağı erozyondan korur.";
  }
  paketCiz();
  $("#gonder").addEventListener("click", function () { form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true })); });
  form.addEventListener("submit", function (e) {
    e.preventDefault(); mesaj.hidden = true;
    var f = new FormData(form);
    if (!f.get("kampanya")) return goster("hata", "Bir kampanya seçin.", "");
    if (!(fidan >= 1 && fidan <= 5000)) return goster("hata", "Fidan sayısı 1 ile 5000 arasında olmalı.", "");
    if (!form.reportValidity()) return;
    var g = { kampanya: f.get("kampanya"), fidan: fidan, ad: String(f.get("ad")).trim(), eposta: String(f.get("eposta")).trim(), telefon: String(f.get("telefon") || "").trim() || null, adina: f.get("adinaMi") === "on" ? String(f.get("adina")).trim() : null, anonim: f.get("anonim") === "on", kvkk: f.get("kvkk") === "on" };
    if (!fonksiyonVar()) return goster("bilgi", "Bu canlı önizlemede bağış kaydedilmez.", " Şablonu kullanınca bağışlar veritabanındaki bagislar tablosuna düşer ve kampanya ilerlemesine eklenir.");
    var d = $("#gonder"); d.disabled = true; d.textContent = "Kaydediliyor…";
    fetch(new URL("api/bagis", document.baseURI).href, { method: "POST", body: JSON.stringify(g) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.hata || "Bağış kaydedilemedi (" + r.status + ")"); return j; }); })
      .then(function (j) { olay("bagis", { fidan: j.fidan, kampanya: g.kampanya }); basari(j, g); })
      .catch(function (err) { goster("hata", "Bağış kaydedilemedi.", " " + (err && err.message ? err.message : "") + " Sorun sürerse 0212 249 55 12 numarasını arayın."); })
      .finally(function () { d.disabled = false; d.textContent = "Bağışımı kaydet"; });
  });
  function basari(j, g) {
    $("#icerik").innerHTML = '<section class="basari" role="status"><span class="ust-yazi">Teşekkürler, ' + kacir(g.ad.split(" ")[0]) + "</span><h1>" + sayi(j.fidan) + " fidan sizin adınıza ayrıldı</h1><p>Bağışınızı tamamlamak için aşağıdaki hesaba havale ya da EFT yapın. Açıklamaya kodu yazmayı unutmayın; ödeme ulaşınca makbuzunuzu e-postayla gönderiyoruz.</p>"
      + '<div class="havale"><div><span>Alıcı</span><b>Yeşil İz Derneği</b><i></i></div><div><span>IBAN</span><b id="ibanYazi">' + IBAN + '</b><button class="kopyala" type="button" data-kopya="' + IBAN.replace(/\s/g, "") + '">Kopyala</button></div><div><span>Tutar</span><b>' + tl(j.tutar) + '</b><i></i></div><div><span>Açıklama kodu</span><b class="kod">' + kacir(j.kod) + '</b><button class="kopyala" type="button" data-kopya="' + kacir(j.kod) + '">Kopyala</button></div></div>'
      + '<div class="eylemler" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center">' + (g.adina ? '<button class="dugme gunes" type="button" id="sertifika">Fidan sertifikasını indir</button>' : "") + '<a class="dugme cizgi" href="kampanyalar.html">Kampanyalara dön</a></div></section>';
    window.scrollTo(0, 0);
    $$(".kopyala").forEach(function (b) { b.addEventListener("click", function () { (navigator.clipboard ? navigator.clipboard.writeText(b.dataset.kopya) : Promise.reject()).then(function () { bildir("Kopyalandı."); }, function () { bildir("Kopyalanamadı; elle seçip kopyalayın."); }); }); });
    var s = $("#sertifika");
    if (s) s.addEventListener("click", function () {
      var e = function (x) { return String(x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1130" viewBox="0 0 1600 1130"><rect width="1600" height="1130" fill="#f6f3ea"/><rect x="40" y="40" width="1520" height="1050" fill="none" stroke="#1f3d2b" stroke-width="4"/><rect x="60" y="60" width="1480" height="1010" fill="none" stroke="#e9b949" stroke-width="2"/><path d="M800 150 760 210h22l-26 34h36v26h16v-26h36l-26-34h22z" fill="#6b8f3a"/><text x="800" y="340" text-anchor="middle" font-family="Georgia, serif" font-size="64" fill="#1f3d2b">Fidan Sertifikası</text><text x="800" y="450" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#5c6458">Bu sertifika</text><text x="800" y="560" text-anchor="middle" font-family="Georgia, serif" font-size="88" fill="#b4582f">' + e(g.adina) + '</text><text x="800" y="660" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#1f3d2b">adına ' + e(sayi(j.fidan)) + ' fidanın toprakla buluşacağını belgeler.</text><text x="800" y="720" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#5c6458">' + e(j.kampanya) + '</text><text x="800" y="900" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#5c6458">Bağışlayan: ' + e(g.ad) + "  ·  " + e(tarihYaz(istanbul().tarih, { year: "numeric" })) + "  ·  " + e(j.kod) + '</text><text x="800" y="990" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#1f3d2b">Yeşil İz Derneği</text></svg>';
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); a.download = "fidan-sertifikasi-" + j.kod + ".svg"; document.body.appendChild(a); a.click(); a.remove();
    });
  }
}
`;

const HABERLER = [
  { tarih: "28 Ekim 2026", baslik: "Muğla'da dikim alanı hazırlıkları başladı", ozet: "Orman ekipleriyle birlikte yanık alanda teraslama çalışmalarının yüzde altmışı tamamlandı.", gorsel: G("mk-doga-40657") },
  { tarih: "14 Ekim 2026", baslik: "2025 faaliyet raporu yayımlandı", ozet: "Geçen yıl 14 ilde 23.600 fidan diktik. Gelir ve giderlerin ayrıntısı şeffaflık sayfamızda.", gorsel: G("mk-doga-4075") },
  { tarih: "2 Ekim 2026", baslik: "Okul bahçelerinde ilk dikim günü", ozet: "Esenyurt'taki üç okulda 420 öğrenci, sınıfının ağacını kendi elleriyle dikti.", gorsel: G("mk-doga-5040") },
];

export const FIDAN_DERNEGI = {
  id: "fidan-dernegi",
  ad: "Yeşil İz · Fidan Derneği",
  tur: "site" as const,
  aciklama: "Fidan bağışı toplayan dernek: tablodan kampanyalar ve canlı ilerleme, son bağışçılar, sunucuda hesaplanan bağış kaydı, havale kodu, adına fidan sertifikası, şeffaflık raporu ve gönüllü formu",
  kapak: "/gercek/build/sablon/fidan-dernegi.webp",
  tablolar: TABLOLAR,
  dosyalar: {
    "index.html": sayfa("index.html", "Yeşil İz Derneği · Fidan bağışı", "Yangın, erozyon ve kentleşmeyle kaybolan ormanları yeniden kuruyoruz. Bir fidan 60 TL.", `<section class="kap kahraman">
  <div class="kahraman-kart">
    <img src="/gercek/havuz/gorsel/mk-doga-50847.webp" alt="Güneşli bir çam ormanı" />
    <div>
      <h1>Bir fidan <em>60 TL.</em> Bir orman, hepimiz.</h1>
      <p class="giris">2012'den beri yangın, erozyon ve kentleşmeyle kaybolan ormanları yerel halk ve orman ekipleriyle birlikte yeniden kuruyoruz. Her fidan dikildiği yerin koordinatıyla raporlanır.</p>
      <div style="display:flex;flex-wrap:wrap;gap:12px"><a class="dugme gunes" href="bagis.html">Fidan bağışla</a><a class="dugme cizgi" style="color:#fff;box-shadow:inset 0 0 0 2px #fff" href="kampanyalar.html">Kampanyalar</a></div>
    </div>
    <div class="sayac-kart" aria-live="polite">
      <small>Bugüne kadar toprakla buluşan fidan</small>
      <div class="buyuk-sayi" id="toplamFidan">96.920</div>
      <div class="alt-satir"><div><b>14</b>il</div><div><b id="aktifKampanya">4</b>aktif kampanya</div><div><b>3.200</b>gönüllü</div></div>
    </div>
  </div>
</section>
<section class="kap bolum">
  <div class="bolum-bas"><div><span class="ust-yazi">Aktif kampanyalar</span><h2>Nereye dikelim?</h2><p>Her kampanyanın bir yerel ortağı, bir dikim takvimi ve beş yıllık bakım planı var.</p></div><a class="dugme cizgi" href="kampanyalar.html">Bütün kampanyalar</a></div>
  <div class="kampanya-izgara" id="kampanyaListe"></div>
</section>
<section class="kap bolum" style="padding-top:0">
  <div class="bolum-bas"><div><span class="ust-yazi">Nasıl çalışıyor</span><h2>Bağıştan ormana</h2></div></div>
  <div class="adimlar">
    <div class="adim"><span class="no">1</span><h3>Bağışlayın</h3><p>Bir fidan; fidanın kendisi, dikimi ve ilk üç yılın sulama ve bakımı dahil 60 TL. Kendiniz ya da sevdiğiniz biri adına.</p></div>
    <div class="adim"><span class="no">2</span><h3>Birlikte dikelim</h3><p>Dikimler kasım ile mayıs arasında, orman ekipleri ve yerel gönüllülerle yapılır. Siz de dikim günlerine katılabilirsiniz.</p></div>
    <div class="adim"><span class="no">3</span><h3>Takip edin</h3><p>Dikimden sonra fotoğraflı ve koordinatlı raporu e-postayla gönderiyoruz; beş yıl boyunca yaşama oranını yayımlıyoruz.</p></div>
  </div>
</section>
<section class="kap bolum" id="sonBagiscilar" style="padding-top:0" hidden>
  <div class="bolum-bas"><div><span class="ust-yazi">Son bağışlar</span><h2>Bu hafta ormana katılanlar</h2></div></div>
  <div class="bagiscilar" id="bagisciListe"></div>
</section>
<section class="kap bolum" style="padding-top:0">
  <div class="ikili">
    <img src="/gercek/galeri/manzara3.webp" alt="Yeşil tepeler arasında küçük bir köy evi" loading="lazy" />
    <div>
      <span class="ust-yazi">Şeffaflık</span>
      <h2 style="font-size:clamp(36px,4.2vw,56px)">Her 100 liranın 71'i doğrudan toprağa.</h2>
      <p style="color:var(--soluk)">2025 yılında topladığımız 4,2 milyon liranın nereye gittiğini kuruşu kuruşuna yayımlıyoruz. Bağımsız denetim raporumuz şeffaflık sayfamızda.</p>
      <div class="cubuklar">
        <div class="cubuk"><div><span>Fidan ve dikim</span><b>yüzde 71</b></div><div class="ilerleme"><i data-oran="71"></i></div></div>
        <div class="cubuk"><div><span>Sulama ve bakım</span><b>yüzde 14</b></div><div class="ilerleme"><i data-oran="14"></i></div></div>
        <div class="cubuk"><div><span>Gönüllü ve eğitim</span><b>yüzde 8</b></div><div class="ilerleme"><i data-oran="8"></i></div></div>
        <div class="cubuk"><div><span>Yönetim giderleri</span><b>yüzde 7</b></div><div class="ilerleme"><i data-oran="7"></i></div></div>
      </div>
      <p style="margin-top:24px"><a class="dugme cizgi" href="seffaflik.html">Faaliyet raporu</a></p>
    </div>
  </div>
</section>
<section class="kap bolum" style="padding-top:0">
  <div class="bolum-bas"><div><span class="ust-yazi">Sahadan</span><h2>Haberler</h2></div></div>
  <div class="haber-izgara">
${HABERLER.map((h) => `    <article class="haber"><img src="${h.gorsel}" alt="" loading="lazy" /><time>${h.tarih}</time><h3>${h.baslik}</h3><p>${h.ozet}</p></article>`).join("\n")}
  </div>
</section>
<section class="kap" style="padding-bottom:clamp(56px,8vw,112px)">
  <div class="cagri">
    <div><h2>Elinizi toprağa değdirin.</h2><p>Dikim günlerimize katılın; eldiveni, fidanı ve öğle yemeğini biz getiriyoruz.</p></div>
    <div class="eylem"><a class="dugme" href="gonullu.html">Gönüllü olun</a></div>
  </div>
</section>`),
    "kampanyalar.html": sayfa("kampanyalar.html", "Kampanyalar · Yeşil İz Derneği", "Muğla, İstanbul, Samsun ve Erzurum'daki ağaçlandırma kampanyalarımız.", `<section class="kap sayfa-bas">
  <h1>Kampanyalar</h1>
  <p>Her kampanya, yerel orman idaresi ya da belediyeyle birlikte hazırlanan bir dikim planına dayanır. Bağışınızı istediğiniz alana yönlendirebilirsiniz.</p>
  <div id="ilSuzgec" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:26px" role="group" aria-label="İl süzgeci"></div>
</section>
<section class="kap" style="padding-bottom:clamp(56px,7vw,96px)">
  <div class="kampanya-izgara" id="kampanyaListe"></div>
</section>`),
    "kampanya.html": sayfa("kampanya.html", "Kampanya · Yeşil İz Derneği", "Yeşil İz Derneği kampanya ayrıntıları.", `<section class="kap detay" id="detay" aria-live="polite"><p style="color:var(--soluk);padding:60px 0">Yükleniyor…</p></section>`),
    "bagis.html": sayfa("bagis.html", "Fidan bağışla · Yeşil İz Derneği", "Kampanya seçin, fidan sayısını belirleyin; kendi adınıza ya da sevdiğiniz biri adına bağış yapın.", `<section class="kap sayfa-bas">
  <h1>Fidan bağışla</h1>
  <p>Bir fidan 60 TL: fidanın kendisi, dikimi ve ilk üç yılın bakımı dahil. Bağışınızı kaydedin, havale bilgileri ve açıklama kodu hemen ekranda.</p>
</section>
<section class="kap bagis-duzen">
  <form id="bagisFormu" novalidate>
    <div class="blok"><h2><i>1</i>Kampanya</h2><div class="secim-kart" id="kampanyaSec" role="radiogroup" aria-label="Kampanya"></div></div>
    <div class="blok">
      <h2><i>2</i>Fidan sayısı</h2>
      <div class="paketler" role="group" aria-label="Hazır miktarlar">
        <button type="button" class="paket" data-fidan="1"><b>1</b>60 TL</button>
        <button type="button" class="paket" data-fidan="5"><b>5</b>300 TL</button>
        <button type="button" class="paket" data-fidan="10"><b>10</b>600 TL</button>
        <button type="button" class="paket" data-fidan="25"><b>25</b>1.500 TL</button>
      </div>
      <label class="ozel"><span>Başka bir sayı:</span><input name="ozelFidan" type="number" min="1" max="5000" inputmode="numeric" aria-label="Fidan sayısı" /><span>fidan</span></label>
      <p class="etki" id="etki" aria-live="polite"></p>
    </div>
    <div class="blok">
      <h2><i>3</i>Bilgileriniz</h2>
      <div class="iki-sutun">
        <label class="alan">Ad soyad<input name="ad" required minlength="3" autocomplete="name" /></label>
        <label class="alan">E-posta <small>Makbuz için</small><input name="eposta" type="email" required autocomplete="email" inputmode="email" /></label>
      </div>
      <label class="alan">Telefon (isteğe bağlı)<input name="telefon" type="tel" inputmode="tel" autocomplete="tel" /></label>
      <label class="onay"><input type="checkbox" name="adinaMi" /> <span>Bu bağışı sevdiğim biri adına yapıyorum; adına fidan sertifikası hazırlansın.</span></label>
      <label class="alan" id="adinaAlan" hidden>Sertifikada yazacak isim<input name="adina" maxlength="60" /></label>
      <label class="onay"><input type="checkbox" name="anonim" /> <span>Adım sitedeki bağışçı listesinde görünmesin.</span></label>
      <label class="onay"><input type="checkbox" name="kvkk" required /> <span><a href="kvkk.html" target="_blank" rel="noopener">Aydınlatma metnini</a> okudum; bağışımın kaydı ve makbuz için bilgilerimin işlenmesini kabul ediyorum.</span></label>
      <div id="mesaj" class="mesaj" role="alert" hidden></div>
    </div>
  </form>
  <aside class="ozet" aria-labelledby="ozetBaslik">
    <h2 id="ozetBaslik">Bağışınız</h2>
    <dl><dt>Kampanya</dt><dd id="ozKampanya">Seçilmedi</dd><dt>Fidan</dt><dd id="ozFidan">5 fidan</dd></dl>
    <div class="toplam"><span>Toplam</span><b id="ozToplam">300 TL</b></div>
    <button class="dugme gunes" id="gonder" type="button">Bağışımı kaydet</button>
    <p>Kaydettikten sonra IBAN ve açıklama kodu gösterilir; havale ulaşınca bağış makbuzunuz e-postayla gelir. Bağışınız vergi matrahından indirilebilir.</p>
  </aside>
</section>`),
    "seffaflik.html": sayfa("seffaflik.html", "Şeffaflık · Yeşil İz Derneği", "2025 faaliyet raporu: gelirler, giderler, dikilen fidan sayıları ve bağımsız denetim.", `<section class="kap sayfa-bas">
  <h1>Şeffaflık</h1>
  <p>Bağışçılarımızın parasının nereye gittiğini bilmeye hakkı var. Her yıl bağımsız denetimden geçen faaliyet raporumuzu ve dikim sonuçlarımızı yayımlıyoruz.</p>
</section>
<section class="kap" style="padding-bottom:clamp(40px,5vw,64px)">
  <div class="rakamlar">
    <div><b>4,2 milyon TL</b><span>2025 toplam bağış</span></div>
    <div><b>23.600</b><span>2025'te dikilen fidan</span></div>
    <div><b>yüzde 87</b><span>Üç yıllık yaşama oranı</span></div>
    <div><b>11.400</b><span>Bireysel bağışçı</span></div>
  </div>
</section>
<section class="kap bolum" style="padding-top:0">
  <div class="ikili" style="align-items:start">
    <div>
      <h2 style="font-size:clamp(34px,4vw,50px)">Yıllara göre dikilen fidan</h2>
      <div class="yillar" aria-label="2021 ile 2025 arası dikilen fidan sayısı">
${[[2021, 9800], [2022, 13200], [2023, 16900], [2024, 19400], [2025, 23600]].map(([y, n]) => `        <div class="yil"><b>${(n as number).toLocaleString("tr-TR")}</b><span class="sutun" style="height:${Math.round(((n as number) / 23600) * 100)}%"></span></div>`).join("\n")}
      </div>
      <div class="yil-ad"><span>2021</span><span>2022</span><span>2023</span><span>2024</span><span>2025</span></div>
    </div>
    <div>
      <h2 style="font-size:clamp(34px,4vw,50px)">2025 giderleri</h2>
      <div class="cubuklar">
        <div class="cubuk"><div><span>Fidan ve dikim</span><b>2.982.000 TL</b></div><div class="ilerleme"><i data-oran="71" style="width:71%"></i></div></div>
        <div class="cubuk"><div><span>Sulama ve bakım</span><b>588.000 TL</b></div><div class="ilerleme"><i data-oran="14" style="width:14%"></i></div></div>
        <div class="cubuk"><div><span>Gönüllü ve eğitim</span><b>336.000 TL</b></div><div class="ilerleme"><i data-oran="8" style="width:8%"></i></div></div>
        <div class="cubuk"><div><span>Yönetim giderleri</span><b>294.000 TL</b></div><div class="ilerleme"><i data-oran="7" style="width:7%"></i></div></div>
      </div>
    </div>
  </div>
</section>
<section class="kap bolum" style="padding-top:0">
  <h2 style="font-size:clamp(34px,4vw,50px);margin-bottom:20px">Belgeler</h2>
  <ul class="belge-liste">
    <li><b>2025 faaliyet raporu</b><span>Ekim 2026, 48 sayfa</span></li>
    <li><b>2025 bağımsız denetim raporu</b><span>Eylül 2026, Yıldız Denetim ve YMM</span></li>
    <li><b>Dikim alanları ve koordinat listesi</b><span>2021 ile 2025 arası, 212 alan</span></li>
    <li><b>Dernek tüzüğü</b><span>Son değişiklik mart 2024</span></li>
  </ul>
  <p style="color:var(--soluk);margin-top:18px">Belgelerin kopyasını <a href="mailto:merhaba@yesiliz.org.tr">merhaba@yesiliz.org.tr</a> adresinden isteyebilirsiniz.</p>
</section>`),
    "gonullu.html": sayfa("gonullu.html", "Gönüllü ol · Yeşil İz Derneği", "Dikim günlerine katılın, Yeşil İz gönüllüsü olun.", `<section class="kap sayfa-bas">
  <h1>Gönüllü olun</h1>
  <p>Dikim günlerimizde eldiven, fidan, ulaşım ve öğle yemeği bizden. Tek yapmanız gereken rahat kıyafetler ve iyi bir ruh hali.</p>
</section>
<section class="kap bolum" style="padding-top:10px">
  <div class="ikili" style="align-items:start">
    <div>
      <h2 style="font-size:clamp(32px,3.6vw,46px);margin-bottom:18px">Yaklaşan dikim günleri</h2>
      <div class="etkinlik-liste">
        <div class="etkinlik"><div class="tarih"><b>23</b><span>Kasım</span></div><div><h3>Belgrad Ormanı bakım günü</h3><p>İstanbul, Bahçeköy. Servis Taksim'den 08.00'de kalkar.</p><span class="kontenjan">40 kişilik kontenjan</span></div><a class="dugme cizgi" href="#gonulluFormu">Katıl</a></div>
        <div class="etkinlik"><div class="tarih"><b>11</b><span>Ocak</span></div><div><h3>Marmaris dikim haftası</h3><p>Muğla, Hisarönü. Üç günlük kamp, konaklama dahil.</p><span class="kontenjan">120 kişilik kontenjan</span></div><a class="dugme cizgi" href="#gonulluFormu">Katıl</a></div>
        <div class="etkinlik"><div class="tarih"><b>14</b><span>Şubat</span></div><div><h3>Okul bahçeleri dikim günü</h3><p>İstanbul, Esenyurt. Öğrencilerle birlikte.</p><span class="kontenjan">60 kişilik kontenjan</span></div><a class="dugme cizgi" href="#gonulluFormu">Katıl</a></div>
      </div>
    </div>
    <form class="form-kart" id="gonulluFormu" data-vayra-form="Gönüllü başvurusu" data-vayra-tesekkur="Teşekkürler! Etkinlikten bir hafta önce ayrıntıları e-postayla göndereceğiz.">
      <h2>Başvuru</h2>
      <label class="alan">Katılmak istediğiniz etkinlik<select name="etkinlik" required><option value="">Seçin</option><option>23 Kasım, Belgrad Ormanı bakım günü</option><option>11 Ocak, Marmaris dikim haftası</option><option>14 Şubat, Okul bahçeleri dikim günü</option><option>Yeni etkinliklerden haberdar olmak istiyorum</option></select></label>
      <div class="iki-sutun">
        <label class="alan">Ad soyad<input name="ad" required autocomplete="name" /></label>
        <label class="alan">Telefon<input name="telefon" type="tel" inputmode="tel" required autocomplete="tel" /></label>
      </div>
      <label class="alan">E-posta<input name="eposta" type="email" required autocomplete="email" inputmode="email" /></label>
      <label class="alan">Kaç kişi geleceksiniz?<select name="kisi"><option>1</option><option>2</option><option>3</option><option>4</option><option>5 ve üzeri, grup olarak</option></select></label>
      <label class="onay"><input type="checkbox" name="kvkk" required /> <span><a href="kvkk.html" target="_blank" rel="noopener">Aydınlatma metnini</a> okudum.</span></label>
      <button class="dugme" type="submit">Başvur</button>
    </form>
  </div>
</section>`),
    "kvkk.html": sayfa("kvkk.html", "KVKK aydınlatma metni · Yeşil İz Derneği", "Yeşil İz Derneği kişisel verilerin işlenmesine ilişkin aydınlatma metni.", `<section class="kap metin">
  <h1>Aydınlatma metni</h1>
  <p>Yeşil İz Derneği olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında bağış ve gönüllü formlarıyla işlediğimiz kişisel verileriniz hakkında sizi bilgilendirmek isteriz.</p>
  <h2>İşlenen veriler</h2>
  <p>Ad soyad, e-posta, telefon, bağış tutarı ve tarihi, varsa adına bağış yapılan kişinin adı; gönüllü başvurularında katılmak istenen etkinlik.</p>
  <h2>Amaç ve hukuki sebep</h2>
  <p>Bağışın kaydı, makbuz düzenlenmesi, dikim raporunun gönderilmesi ve 5253 sayılı Dernekler Kanunu ile vergi mevzuatından doğan kayıt yükümlülükleri; Kanun'un 5/2-c ve 5/2-ç maddeleri.</p>
  <h2>Aktarım ve saklama</h2>
  <p>Veriler yalnız yasal zorunluluk hâlinde yetkili kamu kurumlarıyla paylaşılır; bağış kayıtları mevzuat gereği on yıl saklanır. Bağışçı listesinde yalnız adınız ve soyadınızın baş harfi görünür; isterseniz hiç görünmez.</p>
  <h2>Haklarınız</h2>
  <p>Kanun'un 11. maddesindeki haklarınız için merhaba@yesiliz.org.tr adresine yazabilirsiniz.</p>
</section>`),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#1f3d2b"/><path d="M32 9 15 33h9l-11 14h16v9h6v-9h16L40 33h9z" fill="#e9b949"/></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
    "api/ozet.js": OZET_FN,
    "api/bagis.js": BAGIS_FN,
  },
};
