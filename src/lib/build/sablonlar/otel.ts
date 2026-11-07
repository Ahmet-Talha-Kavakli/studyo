/* Şablon: Ada Taşevi — Bozcaada'da dört odalı butik otel. Odalar "odalar" tablosundan (sezon fiyatı, hafta sonu farkı, kapasite,
 * oda sayısı), tarih ve misafir sayısına göre müsait oda arama (api/musaitlik.js: kişisel veri döndürmeden gece gece doluluk),
 * gece gece fiyat dökümü, en az konaklama kuralları, rezervasyon talebi ("rezervasyonlar": ziyaretçi ekler, okuyamaz),
 * oda sayfası, ada rehberi ve ulaşım, KVKK metni. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";

const ODALAR = [
  { id: "bag-odasi", ad: "Bağ Odası", kisa: "Bağlara bakan, ahşap tavanlı sakin oda", aciklama: "Taş duvarlı, ahşap kirişli tavanıyla evin en sessiz odası. Pencereleri arkadaki bağlara açılır; sabahları kuş sesiyle uyanırsınız. Çift kişilik yatak, keten nevresimler ve okuma köşesi.", kisi: 2, metrekare: 22, fiyat: 3900, yazFiyat: 5600, haftasonuFark: 600, adet: 2, manzara: "Bağ manzarası", ozellikler: "Çift kişilik yatak, Duş, Klima, Okuma köşesi, Kahve demleme seti", gorsel: "/gercek/paz/ortam-yatak.webp", konum: "50% 45%" },
  { id: "deniz-odasi", ad: "Deniz Odası", kisa: "Penceresinden Ayazma koyu görünen oda", aciklama: "Üst katta, iki büyük penceresi Ayazma koyuna bakan oda. Gün batımında pencere önündeki sedir, evin en sevilen yeri. Çift kişilik yatak ya da istenirse iki ayrı yatak.", kisi: 2, metrekare: 26, fiyat: 4600, yazFiyat: 6900, haftasonuFark: 700, adet: 1, manzara: "Deniz manzarası", ozellikler: "Çift ya da ikiz yatak, Duş, Klima, Pencere sediri, Mini buzdolabı", gorsel: "/gercek/havuz/gorsel/mk-deniz-44392.webp", konum: "50% 50%" },
  { id: "teras-suit", ad: "Teras Süit", kisa: "Çiçekli özel teras, gün batımı ve deniz", aciklama: "Evin çatı katında, begonvil ve sardunyalarla çevrili özel terası olan süit. Kahvaltınızı terasa getiriyoruz. Geniş yatak odası ve ayrı oturma bölümü; ilave yatakla üç kişi konaklayabilir.", kisi: 3, metrekare: 38, fiyat: 6200, yazFiyat: 9400, haftasonuFark: 900, adet: 1, manzara: "Deniz ve gün batımı", ozellikler: "Özel teras, Geniş yatak, Oturma bölümü, Küvet ve duş, Klima, Terasta kahvaltı", gorsel: "/gercek/muzik/ms-summer.webp", konum: "50% 60%" },
  { id: "avlu-suit", ad: "Avlu Süiti", kisa: "Avluya açılan, aileler için iki bölümlü süit", aciklama: "Zemin katta, taş avluya açılan iki bölümlü süit. Ebeveyn yatak odası ve iki tek kişilik yataklı çocuk bölümü ayrıdır. Bebek yatağı ve mama sandalyesi ücretsiz verilir.", kisi: 4, metrekare: 44, fiyat: 6800, yazFiyat: 9900, haftasonuFark: 900, adet: 1, manzara: "Avlu ve bahçe", ozellikler: "İki bölüm, Çift ve iki tek yatak, Avluya çıkış, Duş, Klima, Bebek yatağı", gorsel: "/gercek/kesfet/genel.webp", konum: "50% 55%" },
].map((o, i) => ({ sira: i + 1, aktif: true, ...o }));

const TABLOLAR: Record<string, SablonTablo> = {
  odalar: {
    aciklama: "Otelin odaları. fiyat: ekim ile mayıs arası gecelik, yazFiyat: haziran ile eylül arası gecelik; haftasonuFark cuma ve cumartesi geceleri eklenir. adet: bu tipten kaç oda olduğu (müsaitlik buna göre hesaplanır).",
    kurallar: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" },
    sema: [
      { ad: "ad", tur: "metin", zorunlu: true },
      { ad: "kisa", tur: "metin" },
      { ad: "aciklama", tur: "uzunMetin" },
      { ad: "kisi", tur: "sayi", zorunlu: true, aciklama: "En çok misafir" },
      { ad: "metrekare", tur: "sayi" },
      { ad: "fiyat", tur: "sayi", zorunlu: true, aciklama: "TL, gecelik, ekim ile mayıs" },
      { ad: "yazFiyat", tur: "sayi", zorunlu: true, aciklama: "TL, gecelik, haziran ile eylül" },
      { ad: "haftasonuFark", tur: "sayi", varsayilan: 0, aciklama: "TL, cuma ve cumartesi geceleri" },
      { ad: "adet", tur: "sayi", varsayilan: 1 },
      { ad: "manzara", tur: "metin" },
      { ad: "ozellikler", tur: "metin", aciklama: "Virgülle ayrılmış" },
      { ad: "gorsel", tur: "gorsel" },
      { ad: "konum", tur: "metin", aciklama: "Görsel odak noktası (CSS object-position)" },
      { ad: "sira", tur: "sayi" },
      { ad: "aktif", tur: "mantiksal", varsayilan: true },
    ],
    kayitlar: ODALAR,
  },
  rezervasyonlar: {
    aciklama: "Rezervasyon talepleri. Ziyaretçi ekleyebilir ama okuyamaz; müsaitlik api/musaitlik.js ile kişisel veri olmadan hesaplanır. İptal durumundaki kayıtlar müsaitliği etkilemez.",
    kurallar: { okuma: "kapali", ekleme: "herkes", duzenleme: "kapali" },
    sema: [
      { ad: "kod", tur: "metin", zorunlu: true },
      { ad: "oda", tur: "metin", zorunlu: true, aciklama: "Oda kimliği" },
      { ad: "odaAdi", tur: "metin" },
      { ad: "giris", tur: "metin", zorunlu: true, aciklama: "YYYY-AA-GG" },
      { ad: "cikis", tur: "metin", zorunlu: true, aciklama: "YYYY-AA-GG" },
      { ad: "gece", tur: "sayi" },
      { ad: "yetiskin", tur: "sayi" },
      { ad: "cocuk", tur: "sayi" },
      { ad: "tutar", tur: "sayi", aciklama: "TL, kahvaltı dahil" },
      { ad: "ad", tur: "metin", zorunlu: true },
      { ad: "telefon", tur: "metin", zorunlu: true },
      { ad: "eposta", tur: "eposta", zorunlu: true },
      { ad: "varis", tur: "secim", secenekler: ["Geyikli feribotu, arabasız", "Geyikli feribotu, arabayla", "Çanakkale feribotu", "Henüz bilmiyorum"] },
      { ad: "not", tur: "uzunMetin" },
      { ad: "kvkk", tur: "mantiksal", zorunlu: true },
      { ad: "durum", tur: "secim", secenekler: ["Talep", "Onaylandı", "Ön ödeme alındı", "İptal"], varsayilan: "Talep" },
    ],
    kayitlar: [],
  },
};

const MENU = [["index.html", "Taşevi"], ["odalar.html", "Odalar"], ["ada.html", "Ada rehberi"], ["rezervasyon.html", "Rezervasyon"]];

const ust = (aktif: string, koyu: boolean) => `<a class="atla" href="#icerik">İçeriğe geç</a>
<header class="ust${koyu ? " saydam" : ""}">
  <a class="logo" href="index.html" aria-label="Ada Taşevi ana sayfa"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 34V18L20 7l14 11v16" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M15 34v-8a5 5 0 0 1 10 0v8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 34h34" stroke="currentColor" stroke-width="1.6"/></svg><span>Ada Taşevi</span></a>
  <nav class="menu" data-menu aria-label="Ana menü">
${MENU.map(([h, a]) => `    <a href="${h}"${h === aktif || (aktif === "oda.html" && h === "odalar.html") ? ' aria-current="page"' : ""}>${a}</a>`).join("\n")}
  </nav>
  <a class="dugme kucuk ust-dugme" href="rezervasyon.html">Yer ayırt</a>
  <button class="menu-dugme" type="button" data-menu-ac aria-expanded="false" aria-label="Menüyü aç"><span></span><span></span></button>
</header>`;

const alt = `<footer class="alt">
  <div class="alt-ic">
    <div class="alt-marka"><span class="logo-yazi">Ada Taşevi</span><p>1890'lardan kalma bir Rum taş evinde dört odalı butik otel. Turizm işletme belgeli, belge no 17-2041.</p></div>
    <div><h4>Adres</h4><p>Alaybey Mah. Kale Arkası Sok. No: 9<br />Bozcaada / Çanakkale</p><p>İskeleye 6 dakika yürüme</p></div>
    <div><h4>İletişim</h4><p><a href="tel:+902866970412">0286 697 04 12</a></p><p><a href="https://wa.me/905324470412">WhatsApp ile yazın</a></p><p><a href="mailto:merhaba@adatasevi.com">merhaba@adatasevi.com</a></p></div>
    <div><h4>Konaklama</h4><p>Giriş 14.00, çıkış 11.30</p><p>Kahvaltı 08.30 ile 11.00</p><p><a href="kvkk.html">KVKK aydınlatma metni</a></p></div>
  </div>
  <p class="alt-not">Fiyatlara kahvaltı ve konaklama vergisi dahildir. Evcil dostlar avlu süitinde, önceden haber verilerek kabul edilir.</p>
</footer>`;

const sayfa = (dosya: string, baslik: string, aciklama: string, govde: string, saydam = false) => `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${baslik}</title>
  <meta name="description" content="${aciklama}" />
  <meta name="theme-color" content="#f6f2ea" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Italiana&family=Jost:wght@300;400;500;600&display=swap" />
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body data-sayfa="${dosya.replace(".html", "")}">
${ust(dosya, saydam)}
<main id="icerik">
${govde}
</main>
${alt}
<script src="app.js"></script>
</body>
</html>
`;

const ARAMA = `<form class="arama" id="arama" action="rezervasyon.html" novalidate>
  <label class="a-alan"><span>Giriş</span><input type="date" name="giris" required /></label>
  <label class="a-alan"><span>Çıkış</span><input type="date" name="cikis" required /></label>
  <label class="a-alan"><span>Yetişkin</span><select name="yetiskin"><option>1</option><option selected>2</option><option>3</option><option>4</option></select></label>
  <label class="a-alan"><span>Çocuk</span><select name="cocuk"><option selected>0</option><option>1</option><option>2</option></select></label>
  <button class="dugme" type="submit">Müsaitliğe bak</button>
</form>`;

const odaKarti = (o: (typeof ODALAR)[number]) => `    <a class="oda-kart" href="oda.html?id=${o.id}">
      <div class="oda-foto"><img src="${o.gorsel}" alt="${o.ad}" loading="lazy" style="object-position:${o.konum}" /></div>
      <div class="oda-bilgi"><h3>${o.ad}</h3><p>${o.kisa}</p><ul><li>${o.kisi} kişi</li><li>${o.metrekare} m²</li><li>${o.manzara}</li></ul><span class="fiyat"><small>Gecelik</small> ${o.fiyat.toLocaleString("tr-TR")} TL'den</span></div>
    </a>`;

const STIL = String.raw`/* Ada Taşevi — kireç badanası beyazı, Ege mavisi, toprak ve zeytin; Italiana ve Jost. */
:root {
  --kirec: #f6f2ea; --kirec-koyu: #ece5d8; --beyaz: #fffdf9; --murekkep: #1d2a33; --soluk: #5b6770; --ege: #1f4e6b; --ege-koyu: #163b52;
  --toprak: #c0703f; --zeytin: #6f7a4e; --cizgi: rgba(29, 42, 51, .14); --baslik: "Italiana", "Didot", serif; --govde: "Jost", system-ui, sans-serif;
}
[hidden] { display: none !important; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--kirec); color: var(--murekkep); font: 400 16.5px/1.7 var(--govde); -webkit-font-smoothing: antialiased; }
img { display: block; max-width: 100%; }
a { color: inherit; }
h1, h2, h3 { font-family: var(--baslik); font-weight: 400; line-height: 1.05; margin: 0; letter-spacing: .005em; }
:focus-visible { outline: 2px solid var(--toprak); outline-offset: 3px; }
.atla { position: absolute; left: -999px; top: 8px; background: var(--ege); color: #fff; padding: 8px 14px; z-index: 60; }
.atla:focus { left: 12px; }
.kap { max-width: 1240px; margin: 0 auto; padding: 0 clamp(18px, 5vw, 56px); }

/* Üst */
.ust { position: sticky; top: 0; z-index: 40; display: flex; align-items: center; gap: 30px; padding: 14px clamp(18px, 5vw, 56px); background: color-mix(in srgb, var(--kirec) 94%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--cizgi); transition: background .3s, color .3s, border-color .3s; }
.ust.saydam { position: fixed; left: 0; right: 0; background: transparent; border-color: transparent; color: #fff; backdrop-filter: none; }
.ust.saydam.kaydi { background: color-mix(in srgb, var(--kirec) 94%, transparent); color: var(--murekkep); border-color: var(--cizgi); backdrop-filter: blur(10px); }
.logo { display: inline-flex; align-items: center; gap: 12px; text-decoration: none; }
.logo svg { width: 34px; height: 34px; }
.logo span, .logo-yazi { font-family: var(--baslik); font-size: 28px; letter-spacing: .02em; }
.menu { display: flex; gap: 6px; margin-left: auto; }
.menu a { text-decoration: none; padding: 8px 14px; font-size: 15px; font-weight: 500; opacity: .82; }
.menu a:hover, .menu a[aria-current] { opacity: 1; }
.menu a[aria-current] { text-decoration: underline; text-underline-offset: 7px; text-decoration-thickness: 1px; }
.menu-dugme { display: none; width: 46px; height: 46px; border: 1px solid currentColor; border-radius: 50%; background: transparent; color: inherit; cursor: pointer; flex-direction: column; justify-content: center; align-items: center; gap: 6px; }
.menu-dugme span { width: 18px; height: 1.5px; background: currentColor; }
.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px; padding: 14px 28px; border: 0; border-radius: 99px; background: var(--ege); color: #fff; font: 500 15px/1 var(--govde); letter-spacing: .02em; text-decoration: none; cursor: pointer; transition: background .2s; }
.dugme:hover { background: var(--ege-koyu); }
.dugme.toprak { background: var(--toprak); }
.dugme.toprak:hover { background: #a65d30; }
.dugme.acik { background: transparent; color: var(--ege); box-shadow: inset 0 0 0 1px var(--ege); }
.dugme.acik:hover { background: var(--ege); color: #fff; }
.dugme.kucuk { min-height: 44px; padding: 10px 22px; font-size: 14.5px; }
.dugme[disabled] { opacity: .55; cursor: not-allowed; }
.ust.saydam:not(.kaydi) .ust-dugme { background: rgba(255, 255, 255, .16); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .6); backdrop-filter: blur(6px); }

/* Kahraman */
.kahraman { position: relative; min-height: 100vh; min-height: 100svh; display: grid; align-items: end; color: #fff; isolation: isolate; }
.kahraman > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 30% 50%; z-index: -2; }
.kahraman::after { content: ""; position: absolute; inset: 0; z-index: -1; background: linear-gradient(180deg, rgba(16, 32, 44, .45) 0%, rgba(16, 32, 44, 0) 28%, rgba(16, 32, 44, 0) 45%, rgba(16, 32, 44, .62) 100%); }
.kahraman-ic { padding-block: 140px 56px; width: 100%; }
.kahraman .yer { font-size: 15px; letter-spacing: .08em; margin: 0 0 18px; opacity: .9; }
.kahraman h1 { font-size: clamp(54px, 8.4vw, 128px); line-height: .95; max-width: 980px; }
.kahraman p.giris { font-size: 19px; max-width: 520px; margin: 22px 0 34px; opacity: .92; font-weight: 300; }
.arama { display: grid; grid-template-columns: 1.2fr 1.2fr .8fr .8fr auto; gap: 0; background: var(--beyaz); color: var(--murekkep); border-radius: 22px; padding: 8px; max-width: 980px; }
.a-alan { display: grid; gap: 2px; padding: 8px 18px; border-right: 1px solid var(--cizgi); min-width: 0; }
.a-alan span { font-size: 12.5px; color: var(--soluk); font-weight: 500; }
.a-alan input, .a-alan select { border: 0; background: transparent; font: 500 16px var(--govde); color: var(--murekkep); padding: 2px 0; min-height: 30px; width: 100%; min-width: 0; }
.a-alan input:focus, .a-alan select:focus { outline: none; }
.arama .dugme { border-radius: 16px; margin-left: 8px; }

.bolum { padding-block: clamp(64px, 9vw, 128px); }
.ust-yazi { display: block; color: var(--toprak); font-size: 14.5px; font-weight: 500; letter-spacing: .06em; margin-bottom: 18px; }
.giris-ikili { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(28px, 6vw, 96px); align-items: center; }
.giris-ikili h2 { font-size: clamp(42px, 5vw, 70px); }
.giris-ikili p { color: var(--soluk); font-size: 17.5px; }
.cerceve { position: relative; }
.cerceve img { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; border-radius: 200px 200px 0 0; }
.cerceve::before { content: ""; position: absolute; inset: 18px -18px -18px 18px; border: 1px solid var(--toprak); border-radius: 200px 200px 0 0; z-index: -1; }
.imza { font-family: var(--baslik); font-size: 30px; color: var(--ege); margin-top: 24px; }
.sayilar { display: flex; flex-wrap: wrap; gap: 18px 44px; margin-top: 30px; padding-top: 26px; border-top: 1px solid var(--cizgi); }
.sayilar b { display: block; font-family: var(--baslik); font-size: 44px; font-weight: 400; line-height: 1; color: var(--ege); }
.sayilar span { font-size: 14px; color: var(--soluk); }

.bolum-bas { display: flex; justify-content: space-between; align-items: end; gap: 24px; flex-wrap: wrap; margin-bottom: clamp(30px, 4vw, 52px); }
.bolum-bas h2 { font-size: clamp(42px, 5vw, 70px); }
.bolum-bas p { color: var(--soluk); max-width: 520px; margin: 14px 0 0; }
.oda-izgara { display: grid; grid-template-columns: repeat(2, 1fr); gap: clamp(20px, 3vw, 36px); }
.oda-kart { display: grid; text-decoration: none; background: var(--beyaz); border-radius: 26px; overflow: hidden; }
.oda-foto { overflow: hidden; aspect-ratio: 16 / 11; background: var(--kirec-koyu); }
.oda-foto img { width: 100%; height: 100%; object-fit: cover; transition: transform .7s; }
.oda-kart:hover .oda-foto img { transform: scale(1.04); }
.oda-bilgi { padding: 24px 26px 28px; display: grid; gap: 8px; }
.oda-bilgi h3 { font-size: 36px; }
.oda-bilgi p { margin: 0; color: var(--soluk); }
.oda-bilgi ul { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 0; padding: 0; list-style: none; }
.oda-bilgi li { font-size: 13.5px; padding: 4px 12px; border-radius: 99px; background: var(--kirec); color: var(--soluk); }
.fiyat { font-size: 17px; font-weight: 500; color: var(--ege); margin-top: 6px; }
.fiyat small { font-size: 13px; color: var(--soluk); font-weight: 400; }

.kahvalti { background: var(--ege); color: #dfe8ee; }
.kahvalti .giris-ikili h2 { color: #fff; }
.kahvalti .giris-ikili p { color: #c8d7e1; }
.kahvalti .ust-yazi { color: #f0b98f; }
.kolaj { display: grid; grid-template-columns: 1.3fr 1fr; grid-template-rows: 1fr 1fr; gap: 14px; min-height: 520px; }
.kolaj img { width: 100%; height: 100%; object-fit: cover; border-radius: 22px; }
.kolaj img:first-child { grid-row: span 2; }
.menu-liste { list-style: none; padding: 0; margin: 26px 0 0; columns: 2; column-gap: 32px; }
.menu-liste li { padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, .16); break-inside: avoid; font-size: 15.5px; }

.deneyim-izgara { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
.deneyim { position: relative; border-radius: 24px; overflow: hidden; aspect-ratio: 3 / 4; color: #fff; isolation: isolate; text-decoration: none; display: flex; align-items: end; }
.deneyim img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -2; transition: transform .7s; }
.deneyim::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, rgba(12, 24, 32, .74)); z-index: -1; }
.deneyim div { padding: 22px; }
.deneyim h3 { font-size: 30px; }
.deneyim p { margin: 6px 0 0; font-size: 14.5px; opacity: .9; }
.deneyim:hover img { transform: scale(1.05); }

.yorum { text-align: center; max-width: 880px; margin: 0 auto; }
.yorum blockquote { margin: 0; font-family: var(--baslik); font-size: clamp(30px, 3.6vw, 48px); line-height: 1.2; }
.yorum cite { display: block; margin-top: 22px; font-style: normal; color: var(--soluk); font-size: 15px; }

.cagri-bant { position: relative; border-radius: 30px; overflow: hidden; color: #fff; isolation: isolate; padding: clamp(40px, 7vw, 96px) clamp(24px, 6vw, 80px); }
.cagri-bant video, .cagri-bant > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -2; }
.cagri-bant::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(16, 36, 50, .72), rgba(16, 36, 50, .2)); z-index: -1; }
.cagri-bant h2 { font-size: clamp(40px, 5vw, 68px); max-width: 640px; }
.cagri-bant p { max-width: 480px; opacity: .92; margin: 16px 0 28px; }

/* Sayfa başı */
.sayfa-bas { padding-block: clamp(48px, 7vw, 96px) clamp(28px, 4vw, 48px); text-align: center; }
.sayfa-bas h1 { font-size: clamp(52px, 7vw, 100px); }
.sayfa-bas p { color: var(--soluk); max-width: 640px; margin: 18px auto 0; font-size: 17.5px; }

/* Odalar sayfası */
.oda-satir { display: grid; grid-template-columns: 1.15fr 1fr; gap: clamp(24px, 5vw, 72px); align-items: center; padding-block: clamp(36px, 5vw, 64px); border-top: 1px solid var(--cizgi); }
.oda-satir:nth-child(even) .oda-satir-foto { order: 2; }
.oda-satir-foto img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 26px; }
.oda-satir h2 { font-size: clamp(40px, 4.6vw, 62px); }
.oda-satir p { color: var(--soluk); }
.ozellik-liste { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; margin: 18px 0 24px; padding: 0; list-style: none; font-size: 15px; }
.ozellik-liste li { display: flex; gap: 10px; align-items: baseline; }
.ozellik-liste li::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--toprak); flex: none; transform: translateY(-2px); }
.fiyat-satir { display: flex; flex-wrap: wrap; gap: 12px 28px; align-items: center; padding: 16px 0; border-block: 1px solid var(--cizgi); margin-bottom: 24px; }
.fiyat-satir div { display: grid; }
.fiyat-satir small { color: var(--soluk); font-size: 13px; }
.fiyat-satir b { font-weight: 500; font-size: 20px; color: var(--ege); }
.eylemler { display: flex; flex-wrap: wrap; gap: 12px; }

/* Oda detay */
.oda-detay { padding-block: clamp(28px, 4vw, 48px) clamp(56px, 7vw, 96px); }
.oda-detay .geri { display: inline-flex; align-items: center; min-height: 44px; color: var(--soluk); text-decoration: none; font-size: 15px; }
.oda-ust { display: grid; grid-template-columns: 1.4fr 1fr; gap: clamp(24px, 5vw, 64px); align-items: start; margin-top: 10px; }
.oda-ust > * { min-width: 0; }
.oda-ust .buyuk { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 28px; }
.oda-ust h1 { font-size: clamp(48px, 6vw, 84px); margin-bottom: 10px; }
.oda-ust .yan { position: sticky; top: 100px; }
.hesap { background: var(--beyaz); border-radius: 24px; padding: 24px; margin-top: 24px; display: grid; gap: 12px; }
.hesap .ikili { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.hesap label { display: grid; gap: 4px; font-size: 13px; color: var(--soluk); font-weight: 500; }
.hesap input { min-height: 48px; border: 1px solid var(--cizgi); border-radius: 14px; padding: 10px 12px; font: 500 15.5px var(--govde); background: var(--kirec); color: var(--murekkep); width: 100%; min-width: 0; }
.hesap-sonuc { font-size: 15px; color: var(--soluk); min-height: 24px; }
.hesap-sonuc b { color: var(--ege); font-size: 22px; font-weight: 500; }

/* Rezervasyon */
.rez { display: grid; grid-template-columns: 1fr 380px; gap: clamp(24px, 4vw, 48px); align-items: start; padding-block: 10px clamp(56px, 7vw, 96px); }
.rez > * { min-width: 0; }
.rez .arama { max-width: none; border: 1px solid var(--cizgi); }
.kural { font-size: 14px; color: var(--soluk); margin: 12px 4px 0; }
.sonuc-baslik { font-family: var(--govde); font-weight: 400; font-size: clamp(21px, 2.2vw, 26px); line-height: 1.35; margin-top: 34px; }
.sonuclar { display: grid; gap: 16px; margin-top: 26px; }
.sonuc { display: grid; grid-template-columns: 220px 1fr; gap: 0; background: var(--beyaz); border-radius: 22px; overflow: hidden; border: 1.5px solid transparent; transition: border-color .2s; }
.sonuc-foto { position: relative; min-height: 200px; background: var(--kirec-koyu); }
.sonuc-foto img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.sonuc-ic { padding: 20px 22px; display: grid; gap: 8px; align-content: start; }
.sonuc h3 { font-size: 30px; }
.sonuc p { margin: 0; font-size: 14.5px; color: var(--soluk); }
.sonuc-alt { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-top: 6px; }
.sonuc-tutar { display: grid; }
.sonuc-tutar b { font-size: 22px; font-weight: 500; color: var(--ege); }
.sonuc-tutar small { font-size: 13px; color: var(--soluk); }
.sonuc.secili { border-color: var(--ege); }
.sonuc.yok { opacity: .62; }
.sonuc .durum { font-size: 13.5px; font-weight: 500; color: var(--zeytin); }
.sonuc.yok .durum { color: #a2492b; }
.form-kutu { background: var(--beyaz); border-radius: 24px; padding: clamp(20px, 3vw, 30px); margin-top: 26px; }
.form-kutu h2 { font-size: 38px; margin-bottom: 18px; }
.alan { display: grid; gap: 6px; font-size: 14px; font-weight: 500; margin-bottom: 14px; }
.alan input, .alan select, .alan textarea { width: 100%; min-height: 50px; padding: 12px 14px; border: 1px solid var(--cizgi); border-radius: 14px; background: var(--kirec); font: 400 16px var(--govde); color: var(--murekkep); }
.alan input:focus, .alan select:focus, .alan textarea:focus { outline: none; border-color: var(--ege); background: #fff; }
.ikili { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.onay { display: flex; gap: 12px; align-items: flex-start; font-size: 14.5px; color: var(--soluk); margin: 4px 0 14px; cursor: pointer; }
.onay input { width: 22px; height: 22px; accent-color: var(--ege); flex: none; margin: 1px 0 0; }
.ozet { position: sticky; top: 96px; background: var(--murekkep); color: #cfd8de; border-radius: 26px; padding: 26px; }
.ozet h2 { font-size: 34px; color: #fff; margin-bottom: 4px; }
.ozet .bos-ozet { font-size: 15px; margin: 10px 0 0; }
.ozet dl { margin: 16px 0; display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; font-size: 14.5px; }
.ozet dt { color: #93a4af; }
.ozet dd { margin: 0; color: #fff; text-align: right; }
.dokum { border-top: 1px solid rgba(255, 255, 255, .14); padding-top: 12px; display: grid; gap: 6px; font-size: 13.5px; max-height: 220px; overflow: auto; }
.dokum div { display: flex; justify-content: space-between; gap: 10px; }
.toplam { display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid rgba(255, 255, 255, .2); margin-top: 12px; padding-top: 14px; color: #fff; }
.toplam b { font-family: var(--baslik); font-size: 40px; font-weight: 400; }
.ozet .dugme { width: 100%; margin-top: 18px; background: var(--toprak); }
.ozet .dugme:hover { background: #a65d30; }
.ozet .not { font-size: 13px; margin: 14px 0 0; }
.mesaj { border-radius: 16px; padding: 14px 16px; font-size: 15px; margin-top: 14px; }
.mesaj b { display: block; }
.mesaj.hata { background: #f8e2d8; color: #7d2e12; }
.mesaj.bilgi { background: #e7eff3; color: #1f4e6b; }
.basari { max-width: 720px; margin: 0 auto; padding: clamp(48px, 7vw, 96px) clamp(18px, 5vw, 32px); text-align: center; }
.basari .tik { width: 80px; height: 80px; border-radius: 50%; background: var(--beyaz); display: grid; place-items: center; margin: 0 auto 22px; color: var(--ege); }
.basari .tik svg { width: 34px; }
.basari h1 { font-size: clamp(46px, 6vw, 76px); }
.basari p { color: var(--soluk); font-size: 17px; }
.basari dl { display: grid; grid-template-columns: auto 1fr; gap: 10px 24px; text-align: left; background: var(--beyaz); border-radius: 22px; padding: 22px 24px; margin: 26px 0; }
.basari dt { color: var(--soluk); }
.basari dd { margin: 0; font-weight: 500; }
.basari .kod { font-family: var(--baslik); font-size: 30px; color: var(--ege); }

/* Ada rehberi */
.rehber { display: grid; grid-template-columns: repeat(2, 1fr); gap: clamp(20px, 3vw, 36px); }
.rehber article { background: var(--beyaz); border-radius: 26px; overflow: hidden; }
.rehber img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; }
.rehber div { padding: 22px 26px 28px; }
.rehber h3 { font-size: 34px; }
.rehber p { color: var(--soluk); margin: 8px 0 0; }
.rehber .mesafe { display: inline-block; margin-top: 12px; font-size: 13.5px; color: var(--toprak); font-weight: 500; }
.ulasim { display: grid; grid-template-columns: 1fr 1.1fr; gap: clamp(24px, 5vw, 64px); align-items: stretch; }
.ulasim ol { list-style: none; counter-reset: a; padding: 0; margin: 20px 0 0; }
.ulasim li { counter-increment: a; display: grid; grid-template-columns: 48px 1fr; gap: 6px; padding: 16px 0; border-bottom: 1px solid var(--cizgi); }
.ulasim li::before { content: counter(a); font-family: var(--baslik); font-size: 34px; color: var(--toprak); line-height: 1; }
.ulasim li b { display: block; font-weight: 500; }
.ulasim li span { color: var(--soluk); font-size: 15px; }
.ulasim iframe { width: 100%; height: 100%; min-height: 420px; border: 0; border-radius: 26px; background: var(--kirec-koyu); }

.metin { max-width: 820px; padding-block: clamp(36px, 5vw, 64px); }
.metin h1 { font-size: clamp(42px, 5vw, 64px); margin-bottom: 18px; }
.metin h2 { font-size: 32px; margin: 30px 0 8px; }
.metin p, .metin li { color: var(--soluk); }

.alt { background: var(--murekkep); color: #a9b6be; padding: clamp(48px, 6vw, 72px) clamp(18px, 5vw, 56px) 28px; }
.alt-ic { max-width: 1240px; margin: 0 auto; display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 32px; }
.alt .logo-yazi { color: #fff; font-size: 34px; }
.alt h4 { color: #fff; margin: 0 0 10px; font-size: 14px; font-weight: 500; letter-spacing: .04em; }
.alt p { margin: 6px 0; font-size: 14.5px; }
.alt a { color: #e5ecf0; text-decoration: none; }
.alt a:hover { text-decoration: underline; }
.alt-not { max-width: 1240px; margin: 40px auto 0; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, .12); font-size: 13.5px; }
.bildirim { position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 180%); background: var(--murekkep); color: #fff; padding: 14px 22px; border-radius: 99px; font-size: 14.5px; z-index: 60; transition: transform .35s; max-width: calc(100vw - 32px); }
.bildirim.acik { transform: translate(-50%, 0); }

@media (max-width: 1080px) {
  .deneyim-izgara { grid-template-columns: repeat(2, 1fr); }
  .arama { grid-template-columns: 1fr 1fr 1fr 1fr; border-radius: 22px; }
  .arama .dugme { grid-column: 1 / -1; margin: 8px 0 0; }
  .a-alan:nth-child(4) { border-right: 0; }
  .rez { grid-template-columns: 1fr; }
  .ozet { position: static; }
  .alt-ic { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 860px) {
  .menu { display: none; position: absolute; left: 12px; right: 12px; top: calc(100% + 8px); flex-direction: column; gap: 0; background: var(--beyaz); color: var(--murekkep); border-radius: 22px; padding: 10px; border: 1px solid var(--cizgi); }
  .menu.acik { display: flex; }
  .menu a { padding: 14px 16px; font-size: 18px; opacity: 1; }
  .menu-dugme { display: inline-flex; margin-left: auto; }
  .ust-dugme { display: none; }
  .giris-ikili, .oda-ust, .ulasim { grid-template-columns: 1fr; }
  .oda-izgara, .rehber { grid-template-columns: 1fr; }
  .oda-satir { grid-template-columns: 1fr; }
  .oda-satir:nth-child(even) .oda-satir-foto { order: 0; }
  .kolaj { min-height: 380px; }
  .oda-ust .yan { position: static; }
  .cerceve { max-width: 420px; margin: 0 auto; }
}
@media (max-width: 560px) {
  .logo span { font-size: 25px; }
  .kahraman-ic { padding-block: 120px 28px; }
  .kahraman::after { background: linear-gradient(180deg, rgba(16, 32, 44, .5) 0%, rgba(16, 32, 44, .28) 30%, rgba(16, 32, 44, .72) 100%); }
  .kahraman p.giris { font-size: 17px; margin-bottom: 24px; }
  .arama { grid-template-columns: 1fr 1fr; padding: 6px; }
  .a-alan { padding: 8px 12px; border-right: 0; border-bottom: 1px solid var(--cizgi); }
  .a-alan:nth-child(odd) { border-right: 1px solid var(--cizgi); }
  .a-alan:nth-child(3), .a-alan:nth-child(4) { border-bottom: 0; }
  .deneyim-izgara { grid-template-columns: 1fr 1fr; gap: 12px; }
  .deneyim div { padding: 14px; }
  .deneyim h3 { font-size: 23px; }
  .deneyim p { display: none; }
  .menu-liste { columns: 1; }
  .kolaj { grid-template-columns: 1fr 1fr; grid-template-rows: 220px 150px; min-height: 0; }
  .kolaj img:first-child { grid-row: auto; grid-column: span 2; }
  .sonuc { grid-template-columns: 1fr; }
  .sonuc-foto { min-height: 0; aspect-ratio: 16 / 9; }
  .ikili, .hesap .ikili { grid-template-columns: 1fr; }
  .ozellik-liste { grid-template-columns: 1fr; }
  .alt-ic { grid-template-columns: 1fr; }
  .cerceve::before { inset: 12px -10px -12px 10px; }
  .ulasim iframe { min-height: 300px; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; scroll-behavior: auto !important; } }
`;

const MUSAITLIK = String.raw`/* Sunucu fonksiyonu: tarih aralığı için her odanın en dolu gecesindeki rezervasyon sayısı (GET /api/musaitlik?giris=2027-05-14&cikis=2027-05-17).
 * "rezervasyonlar" tablosu ziyaretçiye kapalıdır; burada yalnız oda kimliği ve sayı döner, misafir bilgisi dönmez. */
function gunEkle(t, n) { var d = new Date(t + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export default async function (istek, vayra) {
  var q = istek.sorgu || {}, giris = String(q.giris || ""), cikis = String(q.cikis || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(giris) || !/^\d{4}-\d{2}-\d{2}$/.test(cikis) || cikis <= giris) return { durum: 400, govde: { hata: "Giriş ve çıkış YYYY-AA-GG biçiminde olmalı, çıkış girişten sonra olmalı." } };
  var geceler = [];
  for (var t = giris; t < cikis && geceler.length < 31; t = gunEkle(t, 1)) geceler.push(t);
  var kayitlar = await vayra.veri.liste("rezervasyonlar", { sinir: 1000 });
  var sayim = {};
  kayitlar.forEach(function (r) {
    if (r.durum === "İptal" || !r.oda || !r.giris || !r.cikis) return;
    if (r.cikis <= giris || r.giris >= cikis) return;
    var g = sayim[r.oda] = sayim[r.oda] || {};
    geceler.forEach(function (n) { if (n >= r.giris && n < r.cikis) g[n] = (g[n] || 0) + 1; });
  });
  var odalar = {};
  Object.keys(sayim).forEach(function (o) { odalar[o] = Math.max.apply(null, Object.keys(sayim[o]).map(function (n) { return sayim[o][n]; }).concat([0])); });
  return { durum: 200, basliklar: { "Cache-Control": "no-store" }, govde: { giris: giris, cikis: cikis, odalar: odalar } };
}
`;

const UYGULAMA = ORTAK_JS + String.raw`
/* ── Ada Taşevi ──
 * Odalar "odalar" tablosundan okunur (canlı önizlemede gömülü kopya). Fiyat: haziran ile eylül arası geceler yazFiyat, diğerleri fiyat;
 * cuma ve cumartesi gecelerine haftasonuFark eklenir. En az konaklama: temmuz ve ağustosta 3, diğer aylarda 2 gece.
 * Müsaitlik api/musaitlik.js sunucu fonksiyonundan gelir; talep "rezervasyonlar" tablosuna yazılır. */
var YEDEK_ODALAR = ${JSON.stringify(ODALAR)};
var SAYFA = document.body.dataset.sayfa;
var GUN_KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

/* Saydam başlık: kahramanın üstünden kayınca zemin alır */
(function () { var u = $(".ust.saydam"); if (!u) return; function b() { u.classList.toggle("kaydi", scrollY > 40); } addEventListener("scroll", b, { passive: true }); b(); })();

var odaSoz = null;
function odalar() {
  if (!odaSoz) odaSoz = (veriVar() ? vayra.veri.liste("odalar", { sirala: "sira", yon: "artan", sinir: 100 }) : Promise.resolve(YEDEK_ODALAR.slice()))
    .catch(function () { return YEDEK_ODALAR.slice(); })
    .then(function (l) { return l.filter(function (o) { return o.aktif !== false; }); });
  return odaSoz;
}
function yazMi(t) { var a = Number(t.slice(5, 7)); return a >= 6 && a <= 9; }
function enAzGece(giris) { var a = Number(giris.slice(5, 7)); return a === 7 || a === 8 ? 3 : 2; }
function geceSayisi(g, c) { return Math.round((new Date(c + "T12:00:00Z") - new Date(g + "T12:00:00Z")) / 864e5); }
/** Gece gece fiyat dökümü. */
function fiyatla(oda, giris, cikis) {
  var l = [], t = giris;
  while (t < cikis && l.length < 31) {
    var g = haftaGunu(t), f = Number(yazMi(t) ? oda.yazFiyat : oda.fiyat) || 0;
    if (g === 5 || g === 6) f += Number(oda.haftasonuFark) || 0;
    l.push({ tarih: t, tutar: f, haftasonu: g === 5 || g === 6 });
    t = gunEkle(t, 1);
  }
  return { geceler: l, toplam: l.reduce(function (s, x) { return s + x.tutar; }, 0) };
}
/** Tarih aralığını denetler; hata metni ya da null. */
function aralikHatasi(giris, cikis) {
  var bugun = istanbul().tarih;
  if (!giris || !cikis) return "Giriş ve çıkış tarihini seçin.";
  if (giris < bugun) return "Giriş tarihi bugünden önce olamaz.";
  if (cikis <= giris) return "Çıkış tarihi girişten sonra olmalı.";
  var n = geceSayisi(giris, cikis), en = enAzGece(giris);
  if (n < en) return (en === 3 ? "Temmuz ve ağustosta" : "Bu tarihlerde") + " en az " + en + " gece konaklama kabul ediyoruz.";
  if (n > 21) return "Çevrimiçi talepte en çok 21 gece seçilebilir; daha uzun konaklamalar için bizi arayın.";
  return null;
}
function varsayilanTarih() { var g = gunEkle(istanbul().tarih, 14); while (haftaGunu(g) !== 5) g = gunEkle(g, 1); return { giris: g, cikis: gunEkle(g, enAzGece(g)) }; }
function aralikYaz(g, c) { return tarihYaz(g, { weekday: "short" }) + " ile " + tarihYaz(c, { weekday: "short" }); }

/* Arama formu (ana sayfa ve rezervasyon): tarihlerin alt sınırı ve varsayılanları */
function aramaHazirla(form, q) {
  var v = varsayilanTarih(), bugun = istanbul().tarih;
  form.giris.min = bugun; form.cikis.min = gunEkle(bugun, 1);
  form.giris.value = (q && q.get("giris")) || v.giris;
  form.cikis.value = (q && q.get("cikis")) || v.cikis;
  if (q && q.get("yetiskin")) form.yetiskin.value = q.get("yetiskin");
  if (q && q.get("cocuk")) form.cocuk.value = q.get("cocuk");
  form.giris.addEventListener("change", function () {
    form.cikis.min = gunEkle(form.giris.value, 1);
    if (!form.cikis.value || form.cikis.value <= form.giris.value) form.cikis.value = gunEkle(form.giris.value, enAzGece(form.giris.value));
  });
}
if (SAYFA === "index") aramaHazirla($("#arama"), null);

/* Ana sayfa ve odalar sayfası: tablodaki güncel "…TL'den" fiyatlar */
odalar().then(function (l) {
  $$("[data-oda-fiyat]").forEach(function (el) { var o = l.find(function (x) { return x.id === el.dataset.odaFiyat; }); if (o) el.textContent = tl(o.fiyat); });
  $$("[data-oda-yaz]").forEach(function (el) { var o = l.find(function (x) { return x.id === el.dataset.odaYaz; }); if (o) el.textContent = tl(o.yazFiyat); });
});

/* Oda sayfası */
if (SAYFA === "oda") {
  var oid = new URLSearchParams(location.search).get("id");
  odalar().then(function (l) {
    var o = l.find(function (x) { return x.id === oid; }) || l[0], yer = $("#oda");
    if (!o) { yer.innerHTML = '<p>Oda bulunamadı. <a href="odalar.html">Bütün odalar</a></p>'; return; }
    document.title = o.ad + " · Ada Taşevi";
    var diger = l.filter(function (x) { return x.id !== o.id; });
    yer.innerHTML = '<a class="geri" href="odalar.html">Bütün odalar</a><div class="oda-ust"><div><img class="buyuk" src="' + kacir(o.gorsel) + '" alt="' + kacir(o.ad) + '" style="object-position:' + kacir(o.konum || "50% 50%") + '" /></div>'
      + '<div class="yan"><span class="ust-yazi">' + kacir(o.manzara || "") + "</span><h1>" + kacir(o.ad) + "</h1><p style=\"color:var(--soluk)\">" + kacir(o.aciklama) + '</p><ul class="ozellik-liste"><li>En çok ' + Number(o.kisi) + " kişi</li><li>" + Number(o.metrekare) + " m²</li>" + String(o.ozellikler || "").split(",").map(function (x) { return x.trim() ? "<li>" + kacir(x.trim()) + "</li>" : ""; }).join("") + "</ul>"
      + '<div class="fiyat-satir"><div><small>Ekim ile mayıs, gecelik</small><b>' + tl(o.fiyat) + '</b></div><div><small>Haziran ile eylül, gecelik</small><b>' + tl(o.yazFiyat) + "</b></div>" + (Number(o.haftasonuFark) ? '<div><small>Cuma ve cumartesi geceleri</small><b>artı ' + tl(o.haftasonuFark) + "</b></div>" : "") + "</div>"
      + '<form class="hesap" id="hesap"><b style="font-weight:500">Tarihlerinize göre fiyat</b><div class="ikili"><label>Giriş<input type="date" name="giris" required /></label><label>Çıkış<input type="date" name="cikis" required /></label></div><p class="hesap-sonuc" id="hesapSonuc" aria-live="polite"></p><button class="dugme" type="submit">Bu odayı ayırt</button></form></div></div>'
      + '<div class="bolum-bas" style="margin-top:clamp(56px,7vw,96px)"><h2>Diğer odalar</h2></div><div class="oda-izgara">' + diger.slice(0, 2).map(function (x) {
        return '<a class="oda-kart" href="oda.html?id=' + encodeURIComponent(x.id) + '"><div class="oda-foto"><img src="' + kacir(x.gorsel) + '" alt="' + kacir(x.ad) + '" loading="lazy" style="object-position:' + kacir(x.konum || "50% 50%") + '" /></div><div class="oda-bilgi"><h3>' + kacir(x.ad) + "</h3><p>" + kacir(x.kisa) + '</p><span class="fiyat"><small>Gecelik</small> ' + tl(x.fiyat) + "'den</span></div></a>";
      }).join("") + "</div>";
    var f = $("#hesap"), v = varsayilanTarih();
    f.giris.min = istanbul().tarih; f.giris.value = v.giris; f.cikis.value = v.cikis;
    function hesapla() {
      var h = aralikHatasi(f.giris.value, f.cikis.value);
      if (h) { $("#hesapSonuc").textContent = h; return; }
      var r = fiyatla(o, f.giris.value, f.cikis.value);
      $("#hesapSonuc").innerHTML = r.geceler.length + " gece, kahvaltı dahil <b>" + tl(r.toplam) + "</b>";
    }
    f.addEventListener("change", function (e) { if (e.target === f.giris && f.cikis.value <= f.giris.value) f.cikis.value = gunEkle(f.giris.value, enAzGece(f.giris.value)); hesapla(); });
    f.addEventListener("submit", function (e) { e.preventDefault(); location.href = "rezervasyon.html?oda=" + encodeURIComponent(o.id) + "&giris=" + f.giris.value + "&cikis=" + f.cikis.value; });
    hesapla();
  });
}

/* Rezervasyon */
if (SAYFA === "rezervasyon") {
  var q = new URLSearchParams(location.search), arama = $("#arama"), sonucYer = $("#sonuclar"), form = $("#bilgiler"), mesaj = $("#mesaj");
  var sec = { oda: q.get("oda") || null }, durum = { giris: "", cikis: "", yetiskin: 2, cocuk: 0, dolu: {}, odalar: [] }, istekNo = 0;
  aramaHazirla(arama, q);
  function goster(tur, baslik, metin) { mesaj.hidden = false; mesaj.className = "mesaj " + tur; mesaj.innerHTML = "<b>" + kacir(baslik) + "</b>" + kacir(metin || ""); mesaj.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  function doluluk(giris, cikis) {
    if (!fonksiyonVar()) return Promise.resolve({});
    return fonksiyonOku("musaitlik", { giris: giris, cikis: cikis }).then(function (j) { return (j && j.odalar) || {}; });
  }
  function musaitMi(o) { return (durum.dolu[o.id] || 0) < (Number(o.adet) || 1); }
  function sigarMi(o) { return durum.yetiskin + durum.cocuk <= Number(o.kisi); }
  function ara() {
    mesaj.hidden = true;
    durum.giris = arama.giris.value; durum.cikis = arama.cikis.value; durum.yetiskin = Number(arama.yetiskin.value); durum.cocuk = Number(arama.cocuk.value);
    history.replaceState(null, "", "rezervasyon.html?giris=" + durum.giris + "&cikis=" + durum.cikis + "&yetiskin=" + durum.yetiskin + "&cocuk=" + durum.cocuk + (sec.oda ? "&oda=" + encodeURIComponent(sec.oda) : ""));
    var h = aralikHatasi(durum.giris, durum.cikis);
    if (h) { sonucYer.innerHTML = '<p class="mesaj hata" role="alert"><b>Tarihleri kontrol edin.</b>' + kacir(h) + "</p>"; ozetCiz(); return; }
    var no = ++istekNo;
    sonucYer.innerHTML = '<p class="kural">Müsaitlik kontrol ediliyor…</p>';
    Promise.all([odalar(), doluluk(durum.giris, durum.cikis).catch(function () { bildir("Müsaitlik bilgisi alınamadı; talebiniz gönderilirken yeniden denetlenecek."); return {}; })]).then(function (r) {
      if (no !== istekNo) return;
      durum.odalar = r[0]; durum.dolu = r[1];
      ciz();
    });
  }
  function ciz() {
    var n = geceSayisi(durum.giris, durum.cikis);
    var l = durum.odalar.slice().sort(function (a, b) { return (musaitMi(b) && sigarMi(b)) - (musaitMi(a) && sigarMi(a)); });
    var uygun = l.filter(function (o) { return musaitMi(o) && sigarMi(o); });
    if (sec.oda && !uygun.some(function (o) { return o.id === sec.oda; })) sec.oda = null;
    if (!sec.oda && uygun.length === 1) sec.oda = uygun[0].id;
    $("#sonucBaslik").textContent = uygun.length ? aralikYaz(durum.giris, durum.cikis) + ", " + n + " gece: " + uygun.length + " oda müsait" : "Bu tarihlerde uygun oda kalmadı";
    sonucYer.innerHTML = l.map(function (o) {
      var m = musaitMi(o), s = sigarMi(o), ok = m && s, r = fiyatla(o, durum.giris, durum.cikis);
      return '<article class="sonuc' + (ok ? "" : " yok") + (sec.oda === o.id ? " secili" : "") + '"><div class="sonuc-foto"><img src="' + kacir(o.gorsel) + '" alt="" loading="lazy" style="object-position:' + kacir(o.konum || "50% 50%") + '" /></div><div class="sonuc-ic"><span class="durum">' + (!m ? "Bu tarihlerde dolu" : !s ? "En çok " + Number(o.kisi) + " kişi kalabilir" : "Müsait") + "</span><h3>" + kacir(o.ad) + "</h3><p>" + kacir(o.kisa) + ", " + Number(o.metrekare) + ' m²</p><div class="sonuc-alt"><div class="sonuc-tutar"><b>' + tl(r.toplam) + "</b><small>" + n + " gece, kahvaltı dahil</small></div>"
        + (ok ? '<button class="dugme ' + (sec.oda === o.id ? "" : "acik ") + 'kucuk" type="button" data-sec="' + kacir(o.id) + '" aria-pressed="' + (sec.oda === o.id) + '">' + (sec.oda === o.id ? "Seçildi" : "Bu odayı seç") + "</button>" : "") + "</div></div></article>";
    }).join("") + (uygun.length ? "" : '<p class="kural">Başka tarihlere bakabilir ya da 0286 697 04 12 numarasından bekleme listesine yazılabilirsiniz.</p>');
    form.hidden = !sec.oda;
    ozetCiz();
  }
  function secilenOda() { return durum.odalar.find(function (o) { return o.id === sec.oda; }); }
  function ozetCiz() {
    var o = secilenOda(), yer = $("#ozetIc");
    if (!o || aralikHatasi(durum.giris, durum.cikis)) { yer.innerHTML = '<p class="bos-ozet">Tarihleri ve misafir sayısını seçip müsait odalardan birini seçin; fiyat dökümü burada görünür.</p>'; $("#gonder").disabled = true; return; }
    var r = fiyatla(o, durum.giris, durum.cikis);
    yer.innerHTML = "<dl><dt>Oda</dt><dd>" + kacir(o.ad) + "</dd><dt>Giriş</dt><dd>" + tarihYaz(durum.giris, { weekday: "long" }) + ", 14.00</dd><dt>Çıkış</dt><dd>" + tarihYaz(durum.cikis, { weekday: "long" }) + ", 11.30</dd><dt>Misafir</dt><dd>" + durum.yetiskin + " yetişkin" + (durum.cocuk ? ", " + durum.cocuk + " çocuk" : "") + '</dd></dl><div class="dokum">' + r.geceler.map(function (g) { return "<div><span>" + GUN_KISA[haftaGunu(g.tarih)] + " " + tarihYaz(g.tarih, { month: "short" }) + (g.haftasonu ? ", hafta sonu" : "") + "</span><span>" + tl(g.tutar) + "</span></div>"; }).join("") + '</div><div class="toplam"><span>Toplam</span><b>' + tl(r.toplam) + "</b></div>";
    $("#gonder").disabled = false;
  }
  arama.addEventListener("submit", function (e) { e.preventDefault(); ara(); });
  arama.addEventListener("change", function () { ara(); });
  sonucYer.addEventListener("click", function (e) {
    var b = e.target.closest("[data-sec]"); if (!b) return;
    sec.oda = b.dataset.sec; ciz();
    history.replaceState(null, "", location.pathname + location.search.replace(/&oda=[^&]*/, "") + "&oda=" + encodeURIComponent(sec.oda));
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  ara();

  function kodUret() { var h = "ABCDEFGHJKLMNPRSTUVYZ23456789", s = "AT-"; for (var i = 0; i < 5; i++) s += h.charAt(Math.floor(Math.random() * h.length)); return s; }
  $("#gonder").addEventListener("click", function () { form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true })); });
  form.addEventListener("submit", function (e) {
    e.preventDefault(); mesaj.hidden = true;
    var o = secilenOda();
    if (!o) return goster("hata", "Önce bir oda seçin.", "");
    if (!form.reportValidity()) return;
    var f = new FormData(form);
    if (!/^[0-9 +()]{10,17}$/.test(String(f.get("telefon")).trim())) return goster("hata", "Telefon numarası geçersiz.", " 0532 123 45 67 biçiminde yazın.");
    var r = fiyatla(o, durum.giris, durum.cikis);
    var k = { kod: kodUret(), oda: o.id, odaAdi: o.ad, giris: durum.giris, cikis: durum.cikis, gece: r.geceler.length, yetiskin: durum.yetiskin, cocuk: durum.cocuk, tutar: r.toplam, ad: String(f.get("ad")).trim(), telefon: String(f.get("telefon")).trim(), eposta: String(f.get("eposta")).trim(), varis: f.get("varis"), not: String(f.get("not") || "").trim() || null, kvkk: true };
    if (!veriVar()) return goster("bilgi", "Bu canlı önizlemede rezervasyon kaydedilmez.", " Şablonu kullanınca talepler veritabanındaki rezervasyonlar tablosuna düşer.");
    var d = $("#gonder"); d.disabled = true; d.textContent = "Gönderiliyor…";
    // Göndermeden hemen önce müsaitliği yeniden denetle: aynı oda az önce ayrılmış olabilir.
    doluluk(durum.giris, durum.cikis).catch(function () { return durum.dolu; }).then(function (dolu) {
      durum.dolu = dolu;
      if (!musaitMi(o)) { ciz(); throw new Error("DOLU"); }
      return vayra.veri.ekle("rezervasyonlar", k);
    }).then(function () {
      olay("rezervasyon_talebi", { oda: k.oda, gece: k.gece });
      basari(k);
    }).catch(function (err) {
      if (err && err.message === "DOLU") goster("hata", "Bu oda az önce bu tarihler için ayrıldı.", " Müsait odaları yeniledik; başka bir oda ya da tarih seçin.");
      else goster("hata", "Talep gönderilemedi.", " " + (err && err.message ? err.message + ". " : "") + "Lütfen yeniden deneyin ya da 0286 697 04 12 numarasını arayın.");
    }).finally(function () { d.disabled = false; d.textContent = "Rezervasyon talebini gönder"; });
  });
  function basari(k) {
    $("#icerik").innerHTML = '<section class="basari" role="status"><div class="tik"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h1>Talebiniz alındı</h1><p>Odanızı sizin için ayırdık. En geç iki saat içinde arayıp onaylayacak, ön ödeme bağlantısını e-postayla göndereceğiz. Ön ödeme yapılmazsa ayırma 48 saat sonra kalkar.</p>'
      + '<dl><dt>Rezervasyon kodu</dt><dd class="kod">' + kacir(k.kod) + "</dd><dt>Oda</dt><dd>" + kacir(k.odaAdi) + "</dd><dt>Tarihler</dt><dd>" + kacir(aralikYaz(k.giris, k.cikis)) + ", " + k.gece + " gece</dd><dt>Misafir</dt><dd>" + k.yetiskin + " yetişkin" + (k.cocuk ? ", " + k.cocuk + " çocuk" : "") + "</dd><dt>Toplam</dt><dd>" + tl(k.tutar) + ', kahvaltı dahil</dd></dl><div class="eylemler" style="justify-content:center"><button class="dugme" type="button" id="takvim">Takvimime ekle</button><a class="dugme acik" href="ada.html">Adaya nasıl gelinir?</a></div></section>';
    window.scrollTo(0, 0);
    $("#takvim").addEventListener("click", function () {
      var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ada Tasevi//Rezervasyon//TR", "BEGIN:VEVENT", "UID:" + k.kod + "@adatasevi.com", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z", "DTSTART;VALUE=DATE:" + k.giris.replace(/-/g, ""), "DTEND;VALUE=DATE:" + k.cikis.replace(/-/g, ""), "SUMMARY:Ada Taşevi, " + k.odaAdi + " (" + k.kod + ")", "LOCATION:Alaybey Mah. Kale Arkası Sok. No: 9\\, Bozcaada / Çanakkale", "DESCRIPTION:Giriş 14.00\\, çıkış 11.30. Telefon: 0286 697 04 12", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = "ada-tasevi-" + k.kod + ".ics"; document.body.appendChild(a); a.click(); a.remove();
    });
  }
}
`;

export const BUTIK_OTEL = {
  id: "butik-otel",
  ad: "Ada Taşevi · Butik Otel",
  tur: "site" as const,
  aciklama: "Bozcaada'da dört odalı butik otel: tablodan odalar, tarih ve kişiye göre müsaitlik, sezon ve hafta sonu fiyatlı gece gece döküm, rezervasyon talebi ve ada rehberi",
  kapak: "/gercek/build/sablon/butik-otel.webp",
  tablolar: TABLOLAR,
  dosyalar: {
    "index.html": sayfa("index.html", "Ada Taşevi · Bozcaada'da butik otel", "Bozcaada'da 1890'lardan kalma bir taş evde dört odalı butik otel. Ada kahvaltısı, bağ manzarası, çevrimiçi rezervasyon.", `<section class="kahraman">
  <img src="/gercek/kesfet/pz-h4.webp" alt="Yeşil tepeler arasında beyaz evleri ve koyuyla ada kıyısı" />
  <div class="kap kahraman-ic">
    <p class="yer">Bozcaada, Çanakkale</p>
    <h1>Adanın en sakin köşesinde dört oda.</h1>
    <p class="giris">Kale arkasında, 1890'lardan kalma bir taş evde bağ kokusu, ev yapımı reçeller ve uzun kahvaltılar.</p>
    ${ARAMA}
  </div>
</section>
<section class="kap bolum">
  <div class="giris-ikili">
    <div class="cerceve"><img src="/gercek/havuz/gorsel/mk-isik-3461.webp" alt="Karanlıkta yanan küçük mumlar" loading="lazy" style="object-position:50% 60%" /></div>
    <div>
      <span class="ust-yazi">Taşevi'nin hikâyesi</span>
      <h2>Bir Rum evini, kapısını açık tutmak için onardık.</h2>
      <p>Ev, 1890'larda bir şarap tüccarı tarafından yaptırılmış. 2018'de taşlarını tek tek numaralayıp sökmeden onardık; ahşap kirişler, avludaki kuyu ve asma yerinde duruyor. Dört odamızda, misafirlerimizi tanıyabileceğimiz kadar az kişi ağırlıyoruz.</p>
      <p>Sabahları avluda ada kahvaltısı, akşamüstü bağlardan gelen şarapla terasta gün batımı. Gerisi adanın yavaş ritmine kalmış.</p>
      <p class="imza">Defne ve Yorgo Kalafatoğlu</p>
      <div class="sayilar"><div><b>4</b><span>oda, en çok 11 misafir</span></div><div><b>6 dk</b><span>iskeleye yürüyüş</span></div><div><b>1890</b><span>evin yapım yılı</span></div></div>
    </div>
  </div>
</section>
<section class="kap bolum" style="padding-top:0">
  <div class="bolum-bas"><div><span class="ust-yazi">Odalar</span><h2>Her biri ayrı bir köşe</h2></div><a class="dugme acik" href="odalar.html">Bütün odalar</a></div>
  <div class="oda-izgara">
${ODALAR.map(odaKarti).join("\n")}
  </div>
</section>
<section class="kahvalti bolum">
  <div class="kap giris-ikili">
    <div>
      <span class="ust-yazi">Ada kahvaltısı</span>
      <h2>Her sabah 08.30'dan 11.00'e, avluda.</h2>
      <p>Masamıza adadan ne gelirse o konuyor: Bozcaada domatesi, keçi peyniri, sakızlı ve domates reçeli, fırından yeni çıkmış kuru üzümlü çörek. Kahvaltı bütün odalarımızın fiyatına dahildir.</p>
      <ul class="menu-liste"><li>Domates reçeli ve sakızlı reçel</li><li>Ada keçi peyniri, lor</li><li>Fırında mevsim sebzeleri</li><li>Bakır sahanda yumurta</li><li>Kuru üzümlü ada çöreği</li><li>Taze sıkım portakal suyu</li><li>Bağ evinden pekmez, tahin</li><li>Demlik çay, filtre kahve</li></ul>
    </div>
    <div class="kolaj">
      <img src="/gercek/havuz/gorsel/mk-yemek-10419.webp" alt="Masada dilimlenmiş taze meyveler" loading="lazy" />
      <img src="/gercek/havuz/gorsel/mk-urun-41858.webp" alt="Köpüklü kahve" loading="lazy" />
      <img src="/gercek/havuz/gorsel/mk-yemek-43925.webp" alt="Yoğurt ve meyveyle hazırlanan kase" loading="lazy" />
    </div>
  </div>
</section>
<section class="kap bolum">
  <div class="bolum-bas"><div><span class="ust-yazi">Adada</span><h2>Yavaşça keşfedin</h2></div><a class="dugme acik" href="ada.html">Ada rehberi</a></div>
  <div class="deneyim-izgara">
    <a class="deneyim" href="ada.html#bag"><img src="/gercek/havuz/gorsel/mk-urun-22734.webp" alt="" loading="lazy" /><div><h3>Bağ tadımı</h3><p>Ada üzümleriyle yapılan şaraplar, aile bağlarında.</p></div></a>
    <a class="deneyim" href="ada.html#ayazma"><img src="/gercek/havuz/gorsel/mk-deniz-44392.webp" alt="" loading="lazy" /><div><h3>Ayazma koyu</h3><p>Bisikletle yirmi dakika, ince kum ve berrak deniz.</p></div></a>
    <a class="deneyim" href="ada.html#polente"><img src="/gercek/havuz/gorsel/mk-gokyuzu-38948.webp" alt="" loading="lazy" /><div><h3>Polente feneri</h3><p>Adanın batı ucunda gün batımı.</p></div></a>
    <a class="deneyim" href="ada.html#bisiklet"><img src="/gercek/havuz/gorsel/mk-doga-41537.webp" alt="" loading="lazy" /><div><h3>Bisikletle ada</h3><p>Avludaki bisikletler misafirlerimize ücretsiz.</p></div></a>
  </div>
</section>
<section class="kap bolum" style="padding-top:0">
  <div class="yorum">
    <blockquote>Sabah avluda kahvaltı, öğleden sonra Ayazma, akşam terasta gün batımı. Üç gün boyunca saate hiç bakmadık.</blockquote>
    <cite>Zeynep ve Kerem, eylül 2026, Teras Süit</cite>
  </div>
</section>
<section class="kap" style="padding-bottom:clamp(64px,9vw,128px)">
  <div class="cagri-bant">
    <video autoplay muted loop playsinline preload="none" poster="/gercek/havuz/gorsel/mk-deniz-1085.webp" aria-hidden="true"><source src="/gercek/havuz/video/mk-deniz-1085.mp4" type="video/mp4" /></video>
    <h2>Ada sizi bekliyor.</h2>
    <p>Tarihlerinizi seçin, müsait odaları ve gece gece fiyatı hemen görün. Talebinizi iki saat içinde onaylıyoruz.</p>
    <a class="dugme toprak" href="rezervasyon.html">Müsaitliğe bakın</a>
  </div>
</section>`, true),
    "odalar.html": sayfa("odalar.html", "Odalar · Ada Taşevi", "Ada Taşevi'nin dört odası: Bağ Odası, Deniz Odası, Teras Süit ve Avlu Süiti. Kapasite, özellikler ve sezon fiyatları.", `<section class="kap sayfa-bas">
  <span class="ust-yazi">Dört oda, dört manzara</span>
  <h1>Odalar</h1>
  <p>Bütün odalarımızda keten nevresim, ada sabunları, klima ve hızlı internet var. Fiyatlara kahvaltı ve konaklama vergisi dahildir; cuma ve cumartesi gecelerine hafta sonu farkı eklenir.</p>
</section>
<div class="kap">
${ODALAR.map((o) => `  <article class="oda-satir" id="${o.id}">
    <div class="oda-satir-foto"><img src="${o.gorsel}" alt="${o.ad}" loading="lazy" style="object-position:${o.konum}" /></div>
    <div>
      <span class="ust-yazi">${o.manzara}</span>
      <h2>${o.ad}</h2>
      <p>${o.aciklama}</p>
      <ul class="ozellik-liste"><li>En çok ${o.kisi} kişi</li><li>${o.metrekare} m²</li>${o.ozellikler.split(",").map((x) => `<li>${x.trim()}</li>`).join("")}</ul>
      <div class="fiyat-satir"><div><small>Ekim ile mayıs, gecelik</small><b data-oda-fiyat="${o.id}">${o.fiyat.toLocaleString("tr-TR")} TL</b></div><div><small>Haziran ile eylül, gecelik</small><b data-oda-yaz="${o.id}">${o.yazFiyat.toLocaleString("tr-TR")} TL</b></div></div>
      <div class="eylemler"><a class="dugme" href="rezervasyon.html?oda=${o.id}">Bu odayı ayırt</a><a class="dugme acik" href="oda.html?id=${o.id}">Ayrıntılar</a></div>
    </div>
  </article>`).join("\n")}
</div>
<section class="kap bolum" style="padding-top:clamp(36px,5vw,64px)">
  <div class="giris-ikili">
    <div><span class="ust-yazi">Konaklama koşulları</span><h2>Bilmeniz gerekenler</h2></div>
    <ul class="ozellik-liste" style="grid-template-columns:1fr">
      <li>Giriş 14.00, çıkış 11.30. Erken giriş ve geç çıkış müsaitliğe göre ücretsiz.</li>
      <li>Temmuz ve ağustosta en az üç, diğer aylarda en az iki gece konaklama.</li>
      <li>Onaydan sonra toplam tutarın yüzde otuzu ön ödeme olarak alınır, kalanı girişte ödenir.</li>
      <li>Girişten yedi gün öncesine kadar ücretsiz iptal; sonrasında ön ödeme iade edilmez.</li>
      <li>Altı yaşa kadar çocuklar ücretsiz; avlu süitinde bebek yatağı verilir.</li>
    </ul>
  </div>
</section>`),
    "oda.html": sayfa("oda.html", "Oda · Ada Taşevi", "Ada Taşevi oda ayrıntıları ve fiyat hesaplama.", `<section class="kap oda-detay" id="oda" aria-live="polite"><p style="padding:80px 0;color:var(--soluk)">Oda yükleniyor…</p></section>`),
    "rezervasyon.html": sayfa("rezervasyon.html", "Rezervasyon · Ada Taşevi", "Tarihlerinizi seçin, müsait odaları ve gece gece fiyat dökümünü görün, rezervasyon talebinizi gönderin.", `<section class="kap sayfa-bas" style="padding-bottom:28px">
  <h1>Rezervasyon</h1>
  <p>Tarihleri ve misafir sayısını seçin. Müsait odaları kahvaltı dahil toplam fiyatıyla görürsünüz; talebinizi iki saat içinde arayıp onaylıyoruz.</p>
</section>
<section class="kap rez">
  <div>
    ${ARAMA}
    <p class="kural">Temmuz ve ağustosta en az 3, diğer aylarda en az 2 gece. Cuma ve cumartesi gecelerine hafta sonu farkı eklenir.</p>
    <h2 id="sonucBaslik" class="sonuc-baslik" aria-live="polite"></h2>
    <div class="sonuclar" id="sonuclar" aria-live="polite"></div>
    <form class="form-kutu" id="bilgiler" novalidate hidden>
      <h2>Bilgileriniz</h2>
      <div class="ikili">
        <label class="alan">Ad soyad<input name="ad" required minlength="3" autocomplete="name" /></label>
        <label class="alan">Cep telefonu<input name="telefon" type="tel" required inputmode="tel" autocomplete="tel" placeholder="05xx xxx xx xx" /></label>
      </div>
      <label class="alan">E-posta<input name="eposta" type="email" required autocomplete="email" inputmode="email" /></label>
      <label class="alan">Adaya nasıl geleceksiniz?<select name="varis"><option>Geyikli feribotu, arabasız</option><option>Geyikli feribotu, arabayla</option><option>Çanakkale feribotu</option><option selected>Henüz bilmiyorum</option></select></label>
      <label class="alan">Notunuz (isteğe bağlı)<textarea name="not" rows="3" maxlength="600" placeholder="Doğum günü, alerji, geç varış saati"></textarea></label>
      <label class="onay"><input type="checkbox" name="kvkk" required /> <span><a href="kvkk.html" target="_blank" rel="noopener">Aydınlatma metnini</a> okudum; rezervasyonum için bilgilerimin işlenmesini kabul ediyorum.</span></label>
      <div id="mesaj" class="mesaj" role="alert" hidden></div>
    </form>
  </div>
  <aside class="ozet" aria-labelledby="ozetBaslik">
    <h2 id="ozetBaslik">Konaklamanız</h2>
    <div id="ozetIc"></div>
    <button class="dugme" id="gonder" type="button" disabled>Rezervasyon talebini gönder</button>
    <p class="not">Şimdi ödeme alınmaz. Onaydan sonra yüzde otuz ön ödeme bağlantısı gönderilir; girişten yedi gün öncesine kadar iptal ücretsizdir.</p>
  </aside>
</section>`),
    "ada.html": sayfa("ada.html", "Ada rehberi ve ulaşım · Ada Taşevi", "Bozcaada'da bağlar, koylar, Polente feneri, bisiklet rotaları ve adaya ulaşım.", `<section class="kap sayfa-bas">
  <span class="ust-yazi">Defne'nin önerileri</span>
  <h1>Ada rehberi</h1>
  <p>Bozcaada küçük ama acele edilecek bir yer değil. Misafirlerimize en çok önerdiğimiz yerleri, Taşevi'ne uzaklıklarıyla birlikte yazdık.</p>
</section>
<section class="kap rehber">
  <article id="bag"><img src="/gercek/havuz/gorsel/mk-urun-22734.webp" alt="Kadehe dökülen kırmızı şarap" loading="lazy" /><div><h3>Bağ ve şarap tadımı</h3><p>Adanın yerel üzümleri kuntra, karalahna ve çavuşla yapılan şarapları, aile bağlarındaki tadımlarda deneyin. Rezervasyonu biz yapıyoruz.</p><span class="mesafe">Arabayla 8 dakika</span></div></article>
  <article id="ayazma"><img src="/gercek/havuz/gorsel/mk-deniz-44392.webp" alt="Ağaçlarla çevrili sakin bir koy" loading="lazy" /><div><h3>Ayazma koyu</h3><p>Adanın en bilinen plajı; ince kumu ve sığ, berrak suyuyla çocuklu aileler için ideal. Erken saatte gidin, öğleden sonra kalabalıklaşıyor.</p><span class="mesafe">Bisikletle 20 dakika</span></div></article>
  <article id="polente"><img src="/gercek/havuz/gorsel/mk-gokyuzu-38948.webp" alt="Denizin üzerinde batan güneş" loading="lazy" /><div><h3>Polente feneri</h3><p>Adanın batı ucunda, rüzgâr gülleri arasında gün batımını izlemek için en güzel yer. Yanınıza bir hırka alın; akşamları rüzgâr serinletir.</p><span class="mesafe">Arabayla 15 dakika</span></div></article>
  <article id="bisiklet"><img src="/gercek/havuz/gorsel/mk-doga-41537.webp" alt="Yeşil tepeler arasında kıvrılan yol" loading="lazy" /><div><h3>Bisikletle ada turu</h3><p>Avludaki bisikletleri ücretsiz kullanabilirsiniz. Kale, Ayazma, Sulubahçe ve Polente'yi kapsayan 28 kilometrelik rotanın haritasını odanızda bulacaksınız.</p><span class="mesafe">Yarım gün</span></div></article>
</section>
<section class="kap bolum">
  <div class="ulasim">
    <div>
      <span class="ust-yazi">Ulaşım</span>
      <h2 style="font-size:clamp(42px,5vw,64px)">Adaya nasıl gelinir?</h2>
      <ol>
        <li><span><b>Geyikli iskelesine gelin</b>Çanakkale merkezden arabayla 55 dakika, İstanbul'dan yaklaşık 5 saat.</span></li>
        <li><span><b>Feribota binin</b>Yaz aylarında gün içinde birçok sefer var, yolculuk 35 dakika. Hafta sonları araçlı geçiş için erken gidin.</span></li>
        <li><span><b>İskeleden Taşevi'ne</b>Kale arkasına 6 dakikalık yürüyüş. Bavulunuz varsa haber verin, iskelede karşılayalım.</span></li>
      </ol>
      <p style="color:var(--soluk);margin-top:22px">Ada içinde araba gerekmiyor; bisiklet ve dolmuş her yere yetiyor.</p>
    </div>
    <iframe title="Ada Taşevi harita konumu" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=26.050%2C39.825%2C26.090%2C39.845&amp;layer=mapnik&amp;marker=39.8352%2C26.0702"></iframe>
  </div>
</section>`),
    "kvkk.html": sayfa("kvkk.html", "KVKK aydınlatma metni · Ada Taşevi", "Ada Taşevi kişisel verilerin işlenmesine ilişkin aydınlatma metni.", `<section class="kap metin">
  <h1>Kişisel verilerin işlenmesine ilişkin aydınlatma metni</h1>
  <p>Ada Taşevi Turizm İşletmeleri olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında rezervasyon formu ve konaklama süreciyle işlediğimiz kişisel verileriniz hakkında sizi bilgilendirmek isteriz.</p>
  <h2>İşlenen veriler</h2>
  <p>Ad soyad, telefon, e-posta, konaklama tarihleri, misafir sayısı, varış şekli ve formda paylaştığınız notlar. Girişte, mevzuat gereği kimlik bilgileriniz ayrıca alınır.</p>
  <h2>Amaçlar ve hukuki sebepler</h2>
  <p>Verileriniz rezervasyonun alınması, onaylanması ve konaklama hizmetinin sunulması amacıyla Kanun'un 5/2-c (sözleşmenin kurulması ve ifası) ve 5/2-ç (hukuki yükümlülük; 1774 sayılı Kimlik Bildirme Kanunu) maddelerine dayanılarak işlenir.</p>
  <h2>Aktarım ve saklama</h2>
  <p>Kimlik bildirimi yükümlülüğü kapsamında kolluk kuvvetleriyle, ödeme sırasında ödeme kuruluşuyla paylaşılır. Rezervasyon kayıtları konaklamadan sonra on yıl saklanır.</p>
  <h2>Haklarınız</h2>
  <p>Kanun'un 11. maddesindeki haklarınız için merhaba@adatasevi.com adresine yazabilirsiniz; başvurunuz en geç 30 gün içinde ücretsiz yanıtlanır.</p>
  <p><a class="dugme" href="rezervasyon.html">Rezervasyona dön</a></p>
</section>`),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="#1f4e6b"/><path d="M14 46V30l18-14 18 14v16" fill="none" stroke="#f6f2ea" stroke-width="3"/><path d="M26 46v-9a6 6 0 0 1 12 0v9" fill="none" stroke="#f6f2ea" stroke-width="3"/></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
    "api/musaitlik.js": MUSAITLIK,
  },
};
