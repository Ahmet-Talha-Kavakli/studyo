/* Şablon: Toprakhane Seramik — e-ticaret butiği. Ürünler "urunler" tablosundan (fiyatlı, stoklu), kategori süzgeci, ürün
 * sayfası, localStorage sepeti, Vayra Ödeme ile ödeme (vayra.odeme.ode), teşekkür ve ödeme hata sayfaları, sipariş durumu
 * sorgusu, mesafeli satış sözleşmesi. Görseli olmayan ürünler biçim ve sır renginden SVG olarak çizilir. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";

const URUNLER = [
  { id: "zeytin-kase", ad: "Zeytin Kase", kategori: "Kase", fiyat: 690, stok: 12, bicim: "kase", renk: "#6b7a4f", renk2: "", sir: "Zeytin yeşili, yarı mat", olcu: "15 cm çap, 7 cm yükseklik, 450 ml", onecikan: true, sira: 1,
    aciklama: "Çorbadan yoğurtlu kahvaltılığa her güne yakışan derin kase. Çarkta tek tek çekilir, 1240 derecede iki kez pişirilir. Dip kısmı sırsız bırakılır; toprağın rengi ve dokusu avucuna gelir." },
  { id: "gece-kupa", ad: "Gece Mavisi Kupa", kategori: "Kupa ve fincan", fiyat: 520, stok: 18, bicim: "kupa", renk: "#24365f", renk2: "", sir: "Kobalt mavisi, parlak", olcu: "350 ml, 9,5 cm yükseklik", onecikan: true, sira: 2,
    aciklama: "Sabah kahvesi için kalın cidarlı, avuca oturan kupa. Kulpu ayrı şekillendirilip elle takılır. Sırın inceldiği kenarlarda toprağın açık tonu görünür." },
  { id: "kum-tabak", ad: "Kum Tabak, ikili set", kategori: "Tabak", fiyat: 1150, stok: 6, bicim: "tabak", renk: "#d9c8a9", renk2: "", sir: "Kum beji, benekli mat", olcu: "27 cm çap, 2 adet", onecikan: false, sira: 3,
    aciklama: "Benekli stoneware topraktan iki ana yemek tabağı. Geniş kenarı sunumu çerçeveler, sığ çukuru soslu yemekleri tutar. Her tabak elde şekillendiği için ölçüler birkaç milimetre farklı olabilir." },
  { id: "lal-vazo", ad: "Lal Vazo", kategori: "Vazo", fiyat: 1480, stok: 4, bicim: "vazo", renk: "#7b2532", renk2: "", sir: "Lal kırmızısı, akıntılı parlak", olcu: "24 cm yükseklik, ağız çapı 5 cm", onecikan: true, sira: 4,
    aciklama: "Dar boyunlu, geniş gövdeli tek dal vazosu. Sır fırında akarak her parçada başka bir desen bırakır; ikizi yoktur. İçi sırlıdır, su tutar." },
  { id: "kopuk-fincan", ad: "Köpük Espresso Takımı", kategori: "Kupa ve fincan", fiyat: 640, stok: 10, bicim: "fincan", renk: "#efe8dc", renk2: "", sir: "Süt beyazı, saten", olcu: "90 ml fincan, 12 cm çaplı tabak", onecikan: false, sira: 5,
    aciklama: "Espresso ve Türk kahvesi için ince ağızlı fincan ve tabağı. Saten beyaz sır fincanın içini de kaplar, kahve lekesi tutmaz. Tek kişilik takım." },
  { id: "ege-surahi", ad: "Ege Sürahi", kategori: "Servis", fiyat: 1320, stok: 5, bicim: "surahi", renk: "#2c8584", renk2: "", sir: "Ege turkuazı, parlak", olcu: "1 litre, 19 cm yükseklik", onecikan: true, sira: 6,
    aciklama: "Limonata, su ya da zeytinyağı için akıtmayan ağızlı sürahi. Ağız ucu elle çekilir, damlatmadan döker. Sofrada boşken çiçeğe de yakışır." },
  { id: "tohum-set", ad: "Tohum Kase Seti, dörtlü", kategori: "Kase", fiyat: 980, stok: 0, bicim: "kase-seti", renk: "#b5603f", renk2: "#6b7a4f", sir: "Dört ayrı sır", olcu: "9 cm çap, 4 adet", onecikan: false, sira: 7,
    aciklama: "Meze, zeytin ve sos için dört küçük kase; her biri atölyedeki başka bir sırla. İç içe girer, dolapta yer kaplamaz. Yeni fırın ayın sonunda açılıyor." },
  { id: "kul-saksi", ad: "Kül Saksı", kategori: "Saksı", fiyat: 760, stok: 9, bicim: "saksi", renk: "#8b8780", renk2: "", sir: "Kül grisi, mat", olcu: "16 cm çap, altlıklı", onecikan: false, sira: 8,
    aciklama: "Su tahliye delikli, altlıklı saksı. Mat kül grisi sır yeşil yaprakları öne çıkarır. Sukulentler ve küçük iç mekân bitkileri için uygun." },
].map((u) => ({ ...u, aktif: true }));

const KATEGORILER = ["Kase", "Tabak", "Kupa ve fincan", "Vazo", "Servis", "Saksı"];

const TABLOLAR: Record<string, SablonTablo> = {
  urunler: {
    aciklama: "Satılan seramikler. Ödemede fiyat ve stok bu tablodan sunucuda okunur; ödeme alınınca stok kendiliğinden düşer.",
    kurallar: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" },
    sema: [
      { ad: "ad", tur: "metin", zorunlu: true },
      { ad: "fiyat", tur: "sayi", zorunlu: true, aciklama: "TL, KDV dahil satış fiyatı" },
      { ad: "kategori", tur: "secim", secenekler: KATEGORILER },
      { ad: "aciklama", tur: "uzunMetin" },
      { ad: "gorsel", tur: "gorsel", aciklama: "Ürün fotoğrafı; boşsa biçim ve sır renginden çizim gösterilir" },
      { ad: "stok", tur: "sayi", aciklama: "Boşsa sınırsız; ödeme alınınca düşer" },
      { ad: "aktif", tur: "mantiksal", varsayilan: true },
      { ad: "olcu", tur: "metin", aciklama: "Ölçü ve hacim" },
      { ad: "sir", tur: "metin", aciklama: "Sırın adı ve dokusu" },
      { ad: "bicim", tur: "secim", secenekler: ["kase", "tabak", "kupa", "fincan", "vazo", "surahi", "saksi", "kase-seti"], aciklama: "Görsel yoksa çizimin biçimi" },
      { ad: "renk", tur: "metin", aciklama: "Çizimin sır rengi, #rrggbb" },
      { ad: "renk2", tur: "metin", aciklama: "Setlerde ikinci sır rengi" },
      { ad: "onecikan", tur: "mantiksal", aciklama: "Ana sayfada gösterilir" },
      { ad: "sira", tur: "sayi" },
    ],
    kayitlar: URUNLER,
  },
};

const ust = (aktif: string) => `<a class="atla" href="#icerik">İçeriğe geç</a>
<header class="ust">
  <a class="logo" href="index.html" aria-label="Toprakhane ana sayfa"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 9h18l-2.2 14.5A4 4 0 0 1 18.9 27h-5.8a4 4 0 0 1-3.9-3.5z" fill="currentColor"/><ellipse cx="16" cy="9" rx="9" ry="2.6" fill="#f5f0e8"/></svg>Toprakhane</a>
  <nav class="menu" data-menu aria-label="Ana menü">
${[["urunler.html", "Ürünler"], ["index.html#atolye", "Atölye"], ["siparis.html", "Sipariş sorgula"], ["sozlesme.html", "Teslimat ve iade"]].map(([h, a]) => `    <a href="${h}"${h === aktif ? ' aria-current="page"' : ""}>${a}</a>`).join("\n")}
  </nav>
  <div class="ust-sag">
    <a class="sepet-dugme" href="sepet.html" aria-label="Sepet"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.3 11.1a2 2 0 0 1-2 1.9H8.3a2 2 0 0 1-2-1.9z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8" fill="none" stroke="currentColor" stroke-width="1.7"/></svg><span>Sepet</span><b id="sepetSayi" aria-live="polite">0</b></a>
    <button class="menu-dugme" type="button" data-menu-ac aria-expanded="false" aria-label="Menüyü aç"><span></span><span></span></button>
  </div>
</header>`;

const alt = `<footer class="alt">
  <div class="alt-ic">
    <div><a class="logo" href="index.html">Toprakhane</a><p>Kuzguncuk'ta, çarkın başında elde yapılan kullanım seramikleri. 2017'den beri.</p></div>
    <div><h4>Atölye</h4><p>İcadiye Cad. No: 41, Kuzguncuk, Üsküdar / İstanbul</p><p>Salı ile cumartesi arası 11.00 ile 19.00</p></div>
    <div><h4>Yardım</h4><p><a href="siparis.html">Sipariş durumu</a></p><p><a href="sozlesme.html">Mesafeli satış ve iade</a></p><p><a href="mailto:merhaba@toprakhane.com.tr">merhaba@toprakhane.com.tr</a></p></div>
  </div>
  <p class="alt-not">Ödemeler güvenli ödeme sayfasında alınır; kart bilgin bu siteye hiç gelmez.</p>
</footer>`;

const sayfa = (dosya: string, baslik: string, aciklama: string, govde: string) => `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${baslik}</title>
  <meta name="description" content="${aciklama}" />
  <meta name="theme-color" content="#f5f0e8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap" />
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

const STIL = String.raw`/* Toprakhane — kâğıt zemin, mürekkep metin, pişmiş toprak vurgusu; Cormorant Garamond başlıklar, Manrope gövde. */
:root {
  --kagit: #f5f0e8; --kart: #fbf8f3; --murekkep: #2a211b; --soluk: #6d5f55; --kil: #b4593b; --kil-koyu: #8e4329; --ada: #5f6e48;
  --cizgi: rgba(42, 33, 27, .13); --yaricap: 18px;
  --baslik: "Cormorant Garamond", Georgia, serif; --govde: "Manrope", system-ui, sans-serif;
}
[hidden] { display: none !important; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--kagit); color: var(--murekkep); font: 16px/1.6 var(--govde); -webkit-font-smoothing: antialiased; }
img, svg { display: block; max-width: 100%; }
a { color: inherit; }
h1, h2, h3 { font-family: var(--baslik); font-weight: 600; line-height: 1.04; letter-spacing: -.01em; margin: 0; }
:focus-visible { outline: 2px solid var(--kil); outline-offset: 3px; border-radius: 6px; }
.atla { position: absolute; left: -999px; top: 8px; background: var(--murekkep); color: var(--kagit); padding: 8px 14px; border-radius: 10px; z-index: 50; }
.atla:focus { left: 12px; }

/* Üst çubuk */
.ust { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 24px; padding: 14px clamp(16px, 5vw, 64px); background: color-mix(in srgb, var(--kagit) 90%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--cizgi); }
.logo { display: inline-flex; align-items: center; gap: 9px; font-family: var(--baslik); font-size: 26px; font-weight: 700; text-decoration: none; letter-spacing: -.01em; }
.logo svg { width: 26px; height: 26px; color: var(--kil); }
.menu { display: flex; gap: 26px; margin-left: auto; font-size: 14.5px; }
.menu a { text-decoration: none; color: var(--soluk); padding: 6px 0; border-bottom: 1.5px solid transparent; }
.menu a:hover, .menu a[aria-current] { color: var(--murekkep); border-color: var(--kil); }
.ust-sag { display: flex; align-items: center; gap: 8px; }
.sepet-dugme { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; padding: 9px 14px; border-radius: 999px; background: var(--murekkep); color: var(--kagit); font-size: 14px; font-weight: 600; }
.sepet-dugme svg { width: 18px; height: 18px; }
.sepet-dugme b { min-width: 22px; height: 22px; display: grid; place-items: center; border-radius: 99px; background: var(--kil); font-size: 12px; transition: transform .25s; }
.sepet-dugme b.zipla { transform: scale(1.3); }
.menu-dugme { display: none; width: 42px; height: 42px; border: 1px solid var(--cizgi); background: var(--kart); border-radius: 12px; cursor: pointer; flex-direction: column; justify-content: center; align-items: center; gap: 6px; }
.menu-dugme span { width: 18px; height: 1.6px; background: var(--murekkep); }

/* Düğmeler ve rozetler */
.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; padding: 12px 22px; border-radius: 999px; border: 0; background: var(--kil); color: #fff; font: 600 15px/1 var(--govde); text-decoration: none; cursor: pointer; transition: background .2s, transform .2s; }
.dugme:hover { background: var(--kil-koyu); }
.dugme:active { transform: scale(.98); }
.dugme[disabled] { opacity: .55; cursor: not-allowed; }
.dugme.ikincil { background: transparent; color: var(--murekkep); border: 1.5px solid var(--murekkep); }
.dugme.ikincil:hover { background: var(--murekkep); color: var(--kagit); }
.dugme.tam { width: 100%; }
.rozet { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 99px; font-size: 12.5px; font-weight: 600; background: #ece4d6; color: var(--soluk); }
.rozet.az { background: #f7e1d4; color: var(--kil-koyu); }
.rozet.yok { background: #e6e1da; color: #6b6158; }
.rozet.test { background: #fff0c2; color: #6d4e00; }

/* Ana sayfa */
.kahraman { display: grid; grid-template-columns: 1.05fr 1fr; gap: clamp(24px, 5vw, 72px); align-items: center; padding: clamp(32px, 6vw, 80px) clamp(16px, 5vw, 64px) clamp(40px, 6vw, 88px); max-width: 1320px; margin: 0 auto; }
.ust-yazi { color: var(--kil); font-weight: 600; font-size: 14px; margin: 0 0 14px; }
.kahraman h1 { font-size: clamp(46px, 7vw, 92px); }
.kahraman h1 em { font-style: italic; color: var(--kil); }
.giris { font-size: 18px; color: var(--soluk); max-width: 520px; margin: 20px 0 30px; }
.eylemler { display: flex; flex-wrap: wrap; gap: 12px; }
.sahne { position: relative; aspect-ratio: 1 / .92; border-radius: 28px; background: radial-gradient(120% 90% at 30% 20%, #efe5d5, #e2d3bd); overflow: hidden; }
.sahne .parca { position: absolute; }
.sahne .p1 { width: 60%; left: 0; bottom: -2%; }
.sahne .p2 { width: 47%; right: 1%; bottom: 3%; }
.sahne .p3 { width: 42%; left: 47%; top: 4%; }
.sahne .etiket { position: absolute; left: 20px; top: 20px; max-width: 44%; background: var(--kart); border-radius: 14px; padding: 10px 14px; font-size: 13px; color: var(--soluk); }
.sahne .etiket b { display: block; color: var(--murekkep); font-size: 14px; }
.serit { display: grid; grid-template-columns: repeat(3, 1fr); border-block: 1px solid var(--cizgi); }
.serit div { padding: 22px clamp(16px, 3vw, 32px); display: flex; gap: 14px; align-items: center; font-size: 14.5px; color: var(--soluk); }
.serit div + div { border-left: 1px solid var(--cizgi); }
.serit svg { width: 26px; height: 26px; flex: none; color: var(--kil); }
.serit b { display: block; color: var(--murekkep); }
.bolum { max-width: 1320px; margin: 0 auto; padding: clamp(48px, 7vw, 96px) clamp(16px, 5vw, 64px); }
.bolum-ust { display: flex; justify-content: space-between; align-items: end; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
.bolum-ust h2 { font-size: clamp(34px, 4.6vw, 56px); }
.bolum-ust p { margin: 6px 0 0; color: var(--soluk); max-width: 520px; }
.kategoriler { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
.kategoriler a { text-decoration: none; background: var(--kart); border: 1px solid var(--cizgi); border-radius: var(--yaricap); padding: 14px 12px 16px; text-align: center; transition: border-color .2s, transform .2s; }
.kategoriler a:hover { border-color: var(--kil); transform: translateY(-2px); }
.kategoriler a span { display: block; font-weight: 600; font-size: 14px; margin-top: 6px; }
.kategoriler a small { color: var(--soluk); font-size: 12.5px; }
.atolye { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(24px, 5vw, 72px); align-items: center; }
.atolye h2 { font-size: clamp(34px, 4.6vw, 56px); margin-bottom: 18px; }
.atolye p { color: var(--soluk); font-size: 17px; }
.adimlar { list-style: none; padding: 0; margin: 28px 0 0; display: grid; gap: 14px; counter-reset: a; }
.adimlar li { display: grid; grid-template-columns: 44px 1fr; gap: 14px; align-items: start; }
.adimlar li::before { counter-increment: a; content: counter(a); width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid var(--kil); color: var(--kil); display: grid; place-items: center; font-family: var(--baslik); font-size: 22px; font-weight: 700; }
.adimlar b { display: block; }
.adimlar span { color: var(--soluk); font-size: 15px; }
.atolye-kart { background: var(--murekkep); color: var(--kagit); border-radius: 28px; padding: clamp(28px, 4vw, 48px); }
.atolye-kart h3 { font-size: 34px; margin-bottom: 10px; }
.atolye-kart p { color: #d9cfc4; }
.atolye-kart dl { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 26px 0 0; }
.atolye-kart dt { font-size: 13px; color: #b9ab9d; }
.atolye-kart dd { margin: 2px 0 0; font-family: var(--baslik); font-size: 32px; font-weight: 600; }

/* Ürün ızgarası */
.izgara { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 22px; }
.urun-kart { position: relative; text-decoration: none; display: flex; flex-direction: column; gap: 10px; }
.urun-kart .resim { position: relative; aspect-ratio: 1; border-radius: var(--yaricap); overflow: hidden; display: grid; place-items: center; transition: transform .35s; }
.urun-kart .resim svg, .urun-kart .resim img { width: 82%; height: 82%; object-fit: contain; transition: transform .45s; }
.urun-kart .resim img.foto { width: 100%; height: 100%; object-fit: cover; }
.urun-kart:hover .resim svg, .urun-kart:hover .resim img { transform: scale(1.05); }
.urun-kart .rozet { position: absolute; left: 12px; top: 12px; }
.urun-kart h3 { font-size: 24px; }
.urun-kart .alt-satir { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
.urun-kart .fiyat { font-weight: 700; }
.urun-kart .sir { color: var(--soluk); font-size: 13.5px; }
.suzgec { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; }
.suzgec button { min-height: 40px; padding: 8px 16px; border-radius: 99px; border: 1px solid var(--cizgi); background: var(--kart); color: var(--murekkep); font: 500 14px var(--govde); cursor: pointer; }
.suzgec button[aria-pressed="true"] { background: var(--murekkep); border-color: var(--murekkep); color: var(--kagit); }
.arac-satiri { display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; }
.arac-satiri select { min-height: 42px; border: 1px solid var(--cizgi); background: var(--kart); border-radius: 12px; padding: 8px 12px; font: inherit; color: inherit; }
.sayac { color: var(--soluk); font-size: 14px; }
.bos { text-align: center; padding: 56px 16px; color: var(--soluk); border: 1px dashed var(--cizgi); border-radius: var(--yaricap); }
.bos h3 { color: var(--murekkep); font-size: 30px; margin-bottom: 6px; }
.iskelet { aspect-ratio: 1; border-radius: var(--yaricap); background: linear-gradient(90deg, #ede5d8, #f6f0e6, #ede5d8); background-size: 200% 100%; animation: parilti 1.4s infinite; }
@keyframes parilti { to { background-position: -200% 0; } }

/* Ürün sayfası */
.urun { display: grid; grid-template-columns: 1.1fr 1fr; gap: clamp(24px, 5vw, 72px); align-items: start; }
.urun .vitrin { position: sticky; top: 96px; aspect-ratio: 1; border-radius: 28px; display: grid; place-items: center; overflow: hidden; }
.urun .vitrin svg { width: 78%; }
.urun .vitrin img.foto { width: 100%; height: 100%; object-fit: cover; }
.yol { font-size: 13.5px; color: var(--soluk); margin-bottom: 14px; }
.yol a { text-decoration: none; }
.urun h1 { font-size: clamp(42px, 5vw, 64px); }
.urun .fiyat-buyuk { font-size: 26px; font-weight: 700; margin: 14px 0 6px; }
.urun .aciklama { color: var(--soluk); font-size: 17px; }
.ozellik { display: grid; grid-template-columns: auto 1fr; gap: 10px 18px; margin: 22px 0; padding: 18px 0; border-block: 1px solid var(--cizgi); font-size: 15px; }
.ozellik dt { color: var(--soluk); }
.ozellik dd { margin: 0; font-weight: 500; }
.adet-satir { display: flex; gap: 12px; align-items: stretch; flex-wrap: wrap; }
.adet { display: inline-flex; align-items: center; border: 1.5px solid var(--murekkep); border-radius: 999px; }
.adet button { width: 46px; height: 46px; border: 0; background: none; font-size: 20px; cursor: pointer; color: inherit; border-radius: 999px; }
.adet button:disabled { opacity: .35; cursor: default; }
.adet output { min-width: 32px; text-align: center; font-weight: 700; }
.adet-satir .dugme { flex: 1; min-width: 200px; }
.bakim { margin-top: 26px; background: var(--kart); border: 1px solid var(--cizgi); border-radius: var(--yaricap); }
.bakim summary { cursor: pointer; padding: 16px 18px; font-weight: 600; }
.bakim p, .bakim ul { margin: 0; padding: 0 18px 16px 36px; color: var(--soluk); font-size: 15px; }
.bakim p { padding-left: 18px; }

/* Sepet */
.sepet { display: grid; grid-template-columns: 1.3fr 1fr; gap: clamp(24px, 4vw, 56px); align-items: start; }
.kalemler { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--cizgi); }
.kalem { display: grid; grid-template-columns: 88px 1fr auto; gap: 16px; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--cizgi); }
.kalem .kucuk { width: 88px; height: 88px; border-radius: 14px; display: grid; place-items: center; overflow: hidden; }
.kalem .kucuk svg { width: 84%; }
.kalem .kucuk img.foto { width: 100%; height: 100%; object-fit: cover; }
.kalem h3 { font-size: 22px; }
.kalem a { text-decoration: none; }
.kalem .uyari { color: var(--kil-koyu); font-size: 13.5px; margin: 4px 0 0; }
.kalem .sag { display: grid; justify-items: end; gap: 8px; }
.kalem .adet button { width: 36px; height: 36px; font-size: 17px; }
.kaldir { border: 0; background: none; color: var(--soluk); font: 500 13px var(--govde); text-decoration: underline; cursor: pointer; padding: 4px; }
.ozet-kutu { background: var(--kart); border: 1px solid var(--cizgi); border-radius: 24px; padding: clamp(18px, 3vw, 28px); position: sticky; top: 96px; }
.ozet-kutu h2 { font-size: 32px; margin-bottom: 12px; }
.tutar-satir { display: flex; justify-content: space-between; padding: 6px 0; color: var(--soluk); }
.tutar-satir.toplam { color: var(--murekkep); font-weight: 700; font-size: 19px; border-top: 1px solid var(--cizgi); margin-top: 6px; padding-top: 12px; }
.form { display: grid; gap: 14px; margin-top: 18px; }
.form .ikili { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form label { display: grid; gap: 6px; font-size: 14px; font-weight: 600; }
.form input, .form select, .form textarea { width: 100%; min-height: 48px; padding: 12px 14px; border-radius: 12px; border: 1px solid rgba(42, 33, 27, .22); background: #fff; font: 16px var(--govde); color: inherit; }
.form input:focus, .form select:focus, .form textarea:focus { outline: 2px solid var(--kil); outline-offset: 0; border-color: transparent; }
.form .onay { display: flex; gap: 10px; align-items: flex-start; font-weight: 500; font-size: 14px; color: var(--soluk); }
.form .onay input { width: 20px; min-height: 20px; height: 20px; margin-top: 2px; accent-color: var(--kil); flex: none; }
.ipucu { font-size: 13px; color: var(--soluk); margin: 0; }
.mesaj { border-radius: 14px; padding: 14px 16px; font-size: 14.5px; }
.mesaj b { display: block; margin-bottom: 2px; }
.mesaj.hata { background: #fbe6df; color: #7a2c17; }
.mesaj.bilgi { background: #e9efe1; color: #39472a; }
.mesaj small { display: block; margin-top: 8px; opacity: .85; }

/* Sonuç ve sorgu sayfaları */
.dar { max-width: 760px; margin: 0 auto; padding: clamp(40px, 6vw, 80px) clamp(16px, 5vw, 32px); }
.dar h1 { font-size: clamp(40px, 6vw, 64px); margin-bottom: 12px; }
.dar > p { color: var(--soluk); font-size: 17px; }
.sonuc { background: var(--kart); border: 1px solid var(--cizgi); border-radius: 24px; padding: clamp(18px, 3vw, 30px); margin-top: 26px; }
.sonuc-ust { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.sonuc-ust code { font: 600 15px var(--govde); letter-spacing: .02em; }
.durum { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 99px; font-weight: 700; font-size: 14px; }
.durum::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.durum.odendi { background: #e3efd9; color: #2f5a1c; }
.durum.bekliyor { background: #fff1cc; color: #7a5600; }
.durum.basarisiz { background: #fbe0d8; color: #8a2b14; }
.durum.iade { background: #e6e3f4; color: #3e3478; }
.basamak { list-style: none; padding: 0; margin: 20px 0 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.basamak li { padding-top: 12px; border-top: 3px solid #e4dccf; font-size: 13.5px; color: var(--soluk); }
.basamak li.tamam { border-color: var(--ada); color: var(--murekkep); font-weight: 600; }
.sorgu { display: flex; gap: 10px; margin-top: 24px; flex-wrap: wrap; }
.sorgu input { flex: 1; min-width: 220px; min-height: 52px; padding: 12px 16px; border-radius: 14px; border: 1px solid rgba(42, 33, 27, .22); font: 600 17px var(--govde); letter-spacing: .04em; text-transform: uppercase; background: #fff; color: inherit; }
.son-siparisler { margin-top: 18px; font-size: 14px; color: var(--soluk); }
.son-siparisler button { border: 1px solid var(--cizgi); background: var(--kart); border-radius: 99px; padding: 6px 12px; margin: 4px 6px 0 0; font: 600 13px var(--govde); cursor: pointer; color: inherit; }
.metin h2 { font-size: 32px; margin: 36px 0 10px; }
.metin p, .metin li { color: var(--soluk); }

/* Alt bilgi ve bildirim */
.alt { margin-top: 40px; background: var(--murekkep); color: #d9cfc4; padding: 56px clamp(16px, 5vw, 64px) 28px; }
.alt-ic { max-width: 1320px; margin: 0 auto; display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 32px; }
.alt .logo { color: var(--kagit); }
.alt h4 { margin: 0 0 8px; color: var(--kagit); font-size: 14px; }
.alt p { margin: 4px 0; font-size: 14.5px; }
.alt a { color: #f1e6da; }
.alt-not { max-width: 1320px; margin: 36px auto 0; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, .12); font-size: 13px; color: #a89a8c; }
.bildirim { position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 140%); background: var(--murekkep); color: var(--kagit); padding: 13px 20px; border-radius: 99px; font-size: 14.5px; font-weight: 600; z-index: 60; transition: transform .35s; max-width: calc(100vw - 32px); }
.bildirim.acik { transform: translate(-50%, 0); }
.bildirim[data-tur="hata"] { background: #8a2b14; }

@media (max-width: 980px) {
  .kategoriler { grid-template-columns: repeat(3, 1fr); }
  .urun, .sepet, .atolye { grid-template-columns: 1fr; }
  .urun .vitrin, .ozet-kutu { position: static; }
  .alt-ic { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 760px) {
  .menu { display: none; position: absolute; left: 12px; right: 12px; top: calc(100% + 8px); flex-direction: column; gap: 0; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 18px; padding: 8px; }
  .menu.acik { display: flex; }
  .menu a { padding: 13px 14px; border: 0; border-radius: 12px; font-size: 16px; }
  .menu a[aria-current] { background: #efe7da; }
  .menu-dugme { display: inline-flex; }
  .ust { gap: 12px; }
  .ust-sag { margin-left: auto; }
  .sepet-dugme span { display: none; }
  .kahraman { grid-template-columns: 1fr; }
  .serit { grid-template-columns: 1fr; }
  .serit div + div { border-left: 0; border-top: 1px solid var(--cizgi); }
  .izgara { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .urun-kart h3 { font-size: 20px; }
  .urun-kart .alt-satir { flex-direction: column; gap: 0; }
  .kalem { grid-template-columns: 64px 1fr; }
  .kalem .kucuk { width: 64px; height: 64px; }
  .kalem .sag { grid-column: 2; justify-items: start; grid-auto-flow: column; align-items: center; justify-content: space-between; }
  .form .ikili { grid-template-columns: 1fr; }
  .alt-ic { grid-template-columns: 1fr; }
  .basamak { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; scroll-behavior: auto !important; } }
`;

const UYGULAMA = ORTAK_JS + String.raw`
/* ── Toprakhane mağaza mantığı ──
 * Ürünler Vayra Veri'deki "urunler" tablosundan okunur. Şablon galerisindeki canlı önizlemede (Vayra Veri bağlı değilken)
 * aşağıdaki yedek liste gösterilir; projede tablo düzenlenince sayfa kendiliğinden güncel veriyi kullanır. */
var YEDEK_URUNLER = ${JSON.stringify(URUNLER)};
var SEPET = "toprakhane-sepet", SON = "toprakhane-siparisler";

/* ── Ürün çizimi: görseli olmayan ürün, biçimi ve sır renginden SVG olarak çizilir ── */
function rgb(h) { h = String(h || "").replace("#", ""); if (h.length === 3) h = h.replace(/(.)/g, "$1$1"); var n = parseInt(h, 16); if (!/^[0-9a-f]{6}$/i.test(h)) n = 0xb4593b; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function karis(a, b, t) { var x = rgb(a), y = rgb(b); return "#" + [0, 1, 2].map(function (i) { return Math.round(x[i] + (y[i] - x[i]) * t).toString(16).padStart(2, "0"); }).join(""); }
function koyu(r, t) { return karis(r, "#1b120c", t); }
function acik(r, t) { return karis(r, "#ffffff", t); }
function parlaklik(r) { var c = rgb(r); return (c[0] * .299 + c[1] * .587 + c[2] * .114) / 255; }
function rastgele(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return function () { h += 0x6D2B79F5; var t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function egri(n) {
  var d = "";
  for (var i = 0; i < n.length - 1; i++) {
    var a = n[i - 1] || n[i], b = n[i], c = n[i + 1], e = n[i + 2] || c;
    d += " C" + (b[0] + (c[0] - a[0]) / 6).toFixed(1) + " " + (b[1] + (c[1] - a[1]) / 6).toFixed(1) + " " + (c[0] - (e[0] - b[0]) / 6).toFixed(1) + " " + (c[1] - (e[1] - b[1]) / 6).toFixed(1) + " " + c[0].toFixed(1) + " " + c[1].toFixed(1);
  }
  return d;
}
/** Dönel gövde: profil [[y, yarıçap], ...] yukarıdan aşağı; alt kenar perspektifle hafif kavisli. */
function govde(profil, cx) {
  var sol = profil.map(function (p) { return [cx - p[1], p[0]]; }), sag = profil.slice().reverse().map(function (p) { return [cx + p[1], p[0]]; });
  var s = profil[profil.length - 1];
  return "M" + sol[0][0].toFixed(1) + " " + sol[0][1] + egri(sol) + " Q" + cx + " " + (s[0] + s[1] * .34).toFixed(1) + " " + sag[0][0].toFixed(1) + " " + sag[0][1] + egri(sag) + " Z";
}
var cizimNo = 0;
function cizim(u) {
  var n = "c" + (++cizimNo), r = u.renk || "#b4593b", r2 = u.renk2 || karis(r, "#d7b98f", .5), kil = "#c9a684";
  var mat = /mat|saten/i.test(u.sir || "") && !/parlak/i.test(u.sir || ""), rnd = rastgele(String(u.id || u.ad));
  var defs = "", g = "";
  function sirGradyan(id, renk) { defs += '<linearGradient id="' + id + '" x1="0" x2="1"><stop offset="0" stop-color="' + koyu(renk, .38) + '"/><stop offset=".3" stop-color="' + acik(renk, mat ? .08 : .2) + '"/><stop offset=".62" stop-color="' + renk + '"/><stop offset="1" stop-color="' + koyu(renk, .45) + '"/></linearGradient>'; return "url(#" + id + ")"; }
  function benek(clip, x0, y0, w, h, renk, adet) { var s = ""; for (var i = 0; i < adet; i++) s += '<circle cx="' + (x0 + rnd() * w).toFixed(1) + '" cy="' + (y0 + rnd() * h).toFixed(1) + '" r="' + (.4 + rnd() * .9).toFixed(2) + '"/>'; return '<g clip-path="url(#' + clip + ')" fill="' + koyu(renk, .6) + '" opacity=".5">' + s + "</g>"; }
  function golge(cx, y, rx) { return '<ellipse cx="' + cx + '" cy="' + y + '" rx="' + rx + '" ry="' + (rx * .14).toFixed(1) + '" fill="url(#' + n + 'gl)"/>'; }
  defs += '<radialGradient id="' + n + 'gl"><stop offset="0" stop-color="#2a1a10" stop-opacity=".28"/><stop offset="1" stop-color="#2a1a10" stop-opacity="0"/></radialGradient>';
  /** Sırlı kap: gövde, daldırma çizgisinin altında sırsız toprak, benek, parlama ve ağız. */
  function kap(k, renk) {
    var id = n + k.ad, p = k.profil, cx = k.cx, ust = p[0][0], alt = p[p.length - 1][0], rmax = Math.max.apply(null, p.map(function (x) { return x[1]; }));
    var yol = govde(p, cx), dip = ust + (alt - ust) * (k.dip || 1);
    var s = '<clipPath id="' + id + 'k"><path d="' + yol + '"/></clipPath>';
    var dalga = "M0 0H200V" + dip.toFixed(1); for (var x = 200; x > 0; x -= 20) dalga += " Q" + (x - 10) + " " + (dip + (rnd() * 7 - 2)).toFixed(1) + " " + (x - 20) + " " + dip.toFixed(1); dalga += "Z";
    s += '<clipPath id="' + id + 's"><path d="' + dalga + '"/></clipPath>';
    defs += s;
    var o = (k.kulp || "") + '<path d="' + yol + '" fill="' + sirGradyan(id + "t", kil) + '"/>';
    o += '<path d="' + yol + '" fill="' + sirGradyan(id + "g", renk) + '" clip-path="url(#' + id + 's)"/>';
    o += benek(id + "k", cx - rmax, ust, rmax * 2, alt - ust, parlaklik(renk) > .6 ? renk : kil, parlaklik(renk) > .6 ? 90 : 34);
    o += '<ellipse cx="' + (cx - rmax * .42).toFixed(1) + '" cy="' + ((ust + alt) / 2).toFixed(1) + '" rx="' + (rmax * .09).toFixed(1) + '" ry="' + ((alt - ust) * .3).toFixed(1) + '" fill="#fff" opacity="' + (mat ? .07 : .2) + '" clip-path="url(#' + id + 'k)"/>';
    if (k.agiz) { var rx = p[0][1], ry = rx * k.agiz; o += '<ellipse cx="' + cx + '" cy="' + ust + '" rx="' + rx + '" ry="' + ry.toFixed(1) + '" fill="' + acik(renk, .14) + '"/><ellipse cx="' + cx + '" cy="' + (ust + .8) + '" rx="' + (rx - 3) + '" ry="' + (ry - 1.6).toFixed(1) + '" fill="' + koyu(renk, .42) + '"/>'; }
    if (k.ic) o += '<ellipse cx="' + cx + '" cy="' + (ust + 3.5) + '" rx="' + (p[0][1] - 9) + '" ry="' + (p[0][1] * k.agiz - 6).toFixed(1) + '" fill="' + koyu(renk, .2) + '"/>';
    return o;
  }
  function kulp(x1, y1, x2, y2, acilma, renk) { return '<path d="M' + x1 + " " + y1 + " C" + (x1 + acilma) + " " + (y1 - 6) + " " + (x2 + acilma + 4) + " " + (y2 + 6) + " " + x2 + " " + y2 + '" fill="none" stroke="' + koyu(renk, .12) + '" stroke-width="9" stroke-linecap="round"/><path d="M' + x1 + " " + (y1 + 2) + " C" + (x1 + acilma - 3) + " " + (y1 - 2) + " " + (x2 + acilma) + " " + (y2 + 2) + " " + x2 + " " + (y2 - 2) + '" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="2"/>'; }
  var b = u.bicim || "kase";
  if (b === "kase") { g += golge(100, 156, 46) + kap({ ad: "a", cx: 100, profil: [[70, 72], [80, 70.5], [102, 63], [124, 47], [140, 31], [148, 25]], dip: .7, agiz: .24, ic: true }, r); }
  else if (b === "kupa") { g += golge(100, 160, 44) + kap({ ad: "a", cx: 92, profil: [[58, 40], [64, 40.5], [104, 41], [140, 39.5], [152, 35]], dip: .8, agiz: .2, kulp: kulp(130, 80, 129, 128, 30, r) }, r); }
  else if (b === "vazo") { g += golge(100, 176, 32) + kap({ ad: "a", cx: 100, profil: [[24, 19], [30, 15], [44, 13], [72, 34], [106, 46], [140, 38], [164, 27], [172, 25]], dip: .92, agiz: .26 }, r); }
  else if (b === "surahi") {
    g += golge(100, 172, 42);
    g += '<path d="M68 41 L45 31 Q43 43 66 52 Z" fill="' + acik(r, .05) + '"/>';
    g += kap({ ad: "a", cx: 96, profil: [[42, 30], [54, 31], [82, 44], [114, 49], [148, 40], [164, 34], [168, 33]], dip: .88, agiz: .22, kulp: kulp(126, 56, 136, 124, 34, r) }, r);
  }
  else if (b === "fincan") {
    g += golge(100, 166, 66);
    g += '<ellipse cx="100" cy="150" rx="66" ry="17" fill="' + koyu(r, .22) + '"/><ellipse cx="100" cy="147" rx="66" ry="16" fill="' + sirGradyan(n + "tb", r) + '"/><ellipse cx="100" cy="148" rx="40" ry="9" fill="' + koyu(r, .08) + '"/>';
    g += kap({ ad: "a", cx: 96, profil: [[88, 37], [96, 36.5], [114, 32], [130, 22], [142, 17]], dip: .96, agiz: .2, kulp: kulp(126, 100, 120, 124, 22, r) }, r);
  }
  else if (b === "saksi") {
    g += golge(100, 168, 62);
    g += '<ellipse cx="100" cy="158" rx="60" ry="11" fill="' + koyu(r, .3) + '"/><ellipse cx="100" cy="155" rx="60" ry="10" fill="' + acik(r, .05) + '"/>';
    var yap = "", aci = [-58, -34, -14, 6, 26, 46, 64], boy = [46, 62, 70, 74, 66, 58, 42];
    aci.forEach(function (a, i) { var L = boy[i]; yap += '<path d="M0 0 C-9 -' + (L * .3).toFixed(0) + " -8 -" + (L * .75).toFixed(0) + " 0 -" + L + " C8 -" + (L * .75).toFixed(0) + " 9 -" + (L * .3).toFixed(0) + ' 0 0Z" transform="translate(100 72) rotate(' + a + ')" fill="' + ["#5c7848", "#6f8f57", "#4e6a3e", "#7a9a5e"][i % 4] + '"/>'; });
    g += kap({ ad: "a", cx: 100, profil: [[70, 58], [78, 57], [118, 51], [148, 45], [152, 44]], dip: 1, agiz: .2 }, r);
    g += '<ellipse cx="100" cy="71" rx="52" ry="9" fill="#4a3426"/>' + yap;
  }
  else if (b === "tabak") {
    g += golge(100, 150, 92);
    [[120, .92, r], [104, 1, r]].forEach(function (t, i) {
      var y = t[0], s = t[1], id = n + "t" + i;
      defs += '<clipPath id="' + id + '"><ellipse cx="100" cy="' + y + '" rx="' + (86 * s) + '" ry="' + (28 * s) + '"/></clipPath>';
      g += '<ellipse cx="100" cy="' + (y + 5) + '" rx="' + (86 * s) + '" ry="' + (28 * s) + '" fill="' + koyu(t[2], .28) + '"/><ellipse cx="100" cy="' + y + '" rx="' + (86 * s) + '" ry="' + (28 * s) + '" fill="' + sirGradyan(id + "g", t[2]) + '"/>';
      g += '<ellipse cx="100" cy="' + (y + 2) + '" rx="' + (56 * s) + '" ry="' + (17 * s) + '" fill="' + koyu(t[2], .07) + '" stroke="' + koyu(t[2], .16) + '" stroke-width=".8"/>';
      g += benek(id, 14, y - 30, 172, 60, t[2], 120);
    });
  }
  else {
    var renkler = [r, r2, karis(r, r2, .5), acik(r2, .35)];
    [[66, 92, .5], [134, 92, .5], [64, 128, .58], [136, 128, .58]].forEach(function (t, i) {
      g += '<g transform="translate(' + (t[0] - 100 * t[2]).toFixed(1) + " " + (t[1] - 100 * t[2]).toFixed(1) + ") scale(" + t[2] + ')">' + golge(100, 156, 46) + kap({ ad: "b" + i, cx: 100, profil: [[70, 72], [82, 70], [104, 62], [126, 45], [142, 29], [148, 25]], dip: .72, agiz: .24, ic: true }, renkler[i]) + "</g>";
    });
  }
  return '<svg viewBox="0 0 200 200" role="img" aria-label="' + kacir(u.ad) + ' çizimi"><defs>' + defs + "</defs>" + g + "</svg>";
}
function zemin(u) { return karis(u.renk || "#b4593b", "#f1eadf", parlaklik(u.renk || "#b4593b") > .7 ? .55 : .86); }
function resim(u) { return u.gorsel ? '<img class="foto" src="' + kacir(u.gorsel) + '" alt="' + kacir(u.ad) + '" loading="lazy" />' : cizim(u); }

/* ── Veri ── */
var urunSoz = null;
function urunler() {
  if (!urunSoz) urunSoz = (veriVar() ? vayra.veri.liste("urunler", { sirala: "sira", yon: "artan", sinir: 200 }) : Promise.resolve(YEDEK_URUNLER.slice()))
    .then(function (l) { return l.filter(function (u) { return u.aktif !== false; }); })
    .catch(function (e) { urunSoz = null; throw e; });
  return urunSoz;
}
function stokRozeti(u) {
  if (typeof u.stok === "number" && u.stok <= 0) return '<span class="rozet yok">Tükendi</span>';
  if (typeof u.stok === "number" && u.stok <= 5) return '<span class="rozet az">Son ' + u.stok + " parça</span>";
  return "";
}
function kart(u) {
  return '<a class="urun-kart" href="urun.html?id=' + encodeURIComponent(u.id) + '"><div class="resim" style="background:' + zemin(u) + '">' + resim(u) + stokRozeti(u) + "</div>"
    + '<h3>' + kacir(u.ad) + '</h3><div class="alt-satir"><span class="sir">' + kacir(u.sir || u.kategori || "") + '</span><span class="fiyat">' + tl(u.fiyat) + "</span></div></a>";
}
function yukleniyor(yer, n) { yer.innerHTML = Array.from({ length: n }, function () { return '<div class="iskelet"></div>'; }).join(""); }
function veriHatasi(yer, e) { yer.innerHTML = '<div class="bos"><h3>Ürünler yüklenemedi</h3><p>' + kacir(e && e.message || "Bağlantı sorunu") + '</p><button class="dugme ikincil" type="button" onclick="location.reload()">Yeniden dene</button></div>'; }

/* ── Sepet (localStorage): [{ id, adet }] ── */
function sepet() { try { var l = JSON.parse(localStorage.getItem(SEPET) || "[]"); return Array.isArray(l) ? l.filter(function (x) { return x && x.id && x.adet > 0; }) : []; } catch (e) { return []; } }
function sepetYaz(l) { localStorage.setItem(SEPET, JSON.stringify(l)); rozet(true); }
function rozet(zipla) {
  var b = $("#sepetSayi"); if (!b) return;
  b.textContent = String(sepet().reduce(function (t, x) { return t + x.adet; }, 0));
  if (zipla) { b.classList.add("zipla"); setTimeout(function () { b.classList.remove("zipla"); }, 250); }
}
function sepeteEkle(u, adet) {
  var l = sepet(), x = l.find(function (k) { return k.id === u.id; }), yeni = (x ? x.adet : 0) + adet;
  if (typeof u.stok === "number" && yeni > u.stok) { bildir("Stokta " + u.stok + " adet var.", "hata"); return false; }
  if (x) x.adet = yeni; else l.push({ id: u.id, adet: adet });
  sepetYaz(l); olay("sepete_ekle", { urun: u.ad, tutar: u.fiyat * adet }); bildir(u.ad + " sepete eklendi.");
  return true;
}
rozet();

/* ── Sayfalar ── */
var SAYFA = document.body.dataset.sayfa;

if (SAYFA === "index") {
  var one = $("#oneCikan"); yukleniyor(one, 4);
  urunler().then(function (l) {
    var s = l.filter(function (u) { return u.onecikan; }); if (s.length < 4) s = s.concat(l.filter(function (u) { return !u.onecikan; })).slice(0, 4);
    one.innerHTML = s.slice(0, 4).map(kart).join("");
    var sah = l.filter(function (u) { return !u.gorsel; });
    [["p1", "kase"], ["p2", "surahi"], ["p3", "vazo"]].forEach(function (p) { var u = sah.find(function (x) { return x.bicim === p[1]; }) || sah[0]; var el = $(".sahne ." + p[0]); if (u && el) el.innerHTML = cizim(u); });
    $$(".kategoriler a").forEach(function (a) { var k = a.dataset.kategori, n = l.filter(function (u) { return u.kategori === k; }).length; a.querySelector("small").textContent = n ? n + " ürün" : "Yakında"; });
  }).catch(function (e) { veriHatasi(one, e); });
}

if (SAYFA === "urunler") {
  var izgara = $("#izgara"), sayac = $("#sayac"), sirala = $("#sirala"), secili = new URLSearchParams(location.search).get("kategori") || "Hepsi", hepsi = [];
  function ciz() {
    var l = hepsi.filter(function (u) { return secili === "Hepsi" || u.kategori === secili; });
    if (sirala.value === "artan") l.sort(function (a, b) { return a.fiyat - b.fiyat; });
    if (sirala.value === "azalan") l.sort(function (a, b) { return b.fiyat - a.fiyat; });
    if (sirala.value === "stok") l.sort(function (a, b) { return (b.stok === 0 ? -1 : 0) - (a.stok === 0 ? -1 : 0); });
    sayac.textContent = l.length + " ürün";
    izgara.innerHTML = l.length ? l.map(kart).join("") : '<div class="bos" style="grid-column:1/-1"><h3>Bu kategoride şu an ürün yok</h3><p>Yeni fırın açıldığında burada olacak.</p></div>';
    $$(".suzgec button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.kategori === secili)); });
  }
  $$(".suzgec button").forEach(function (b) { b.addEventListener("click", function () { secili = b.dataset.kategori; history.replaceState(null, "", secili === "Hepsi" ? location.pathname : "?kategori=" + encodeURIComponent(secili)); ciz(); }); });
  sirala.addEventListener("change", ciz);
  yukleniyor(izgara, 8);
  urunler().then(function (l) { hepsi = l; ciz(); }).catch(function (e) { veriHatasi(izgara, e); });
}

if (SAYFA === "urun") {
  var yer = $("#urun"), id = new URLSearchParams(location.search).get("id");
  urunler().then(function (l) {
    var u = l.find(function (x) { return x.id === id; });
    if (!u) { yer.innerHTML = '<div class="bos"><h3>Ürün bulunamadı</h3><p>Satıştan kalkmış olabilir.</p><a class="dugme" href="urunler.html">Bütün ürünler</a></div>'; return; }
    document.title = u.ad + " · Toprakhane";
    var tukendi = typeof u.stok === "number" && u.stok <= 0, adet = 1, enCok = typeof u.stok === "number" ? u.stok : 20;
    yer.innerHTML = '<div class="urun"><div class="vitrin" style="background:' + zemin(u) + '">' + resim(u) + "</div><div>"
      + '<p class="yol"><a href="urunler.html">Ürünler</a> / <a href="urunler.html?kategori=' + encodeURIComponent(u.kategori || "") + '">' + kacir(u.kategori || "") + "</a></p>"
      + "<h1>" + kacir(u.ad) + '</h1><p class="fiyat-buyuk">' + tl(u.fiyat) + "</p>" + stokRozeti(u)
      + '<p class="aciklama">' + kacir(u.aciklama || "") + "</p>"
      + '<dl class="ozellik"><dt>Sır</dt><dd>' + kacir(u.sir || "Belirtilmedi") + "</dd><dt>Ölçü</dt><dd>" + kacir(u.olcu || "Belirtilmedi") + "</dd><dt>Kargo</dt><dd>Ücretsiz, 2 ile 4 iş günü</dd></dl>"
      + (tukendi ? '<div class="mesaj bilgi"><b>Bu parça tükendi.</b>Yeni fırından çıkınca stoğa eklenecek.</div>'
        : '<div class="adet-satir"><div class="adet" role="group" aria-label="Adet"><button type="button" data-d="-1" aria-label="Azalt">−</button><output id="adet" aria-live="polite">1</output><button type="button" data-d="1" aria-label="Artır">+</button></div><button class="dugme" id="ekle" type="button">Sepete ekle</button></div>')
      + '<details class="bakim"><summary>Kullanım ve bakım</summary><ul><li>Bulaşık makinesi ve mikrodalgaya uygundur.</li><li>Ani sıcaklık farkından kaçın; buzdolabından çıkanı doğrudan fırına koyma.</li><li>Sırsız dip kısmı ilk kullanımda biraz su emebilir; bu doğaldır.</li></ul></details>'
      + '<details class="bakim"><summary>Teslimat ve iade</summary><p>Her parça çift kutuyla, kırılmaya karşı korunarak gönderilir. Teslimden sonraki 14 gün içinde iade edebilirsin. Ayrıntılar <a href="sozlesme.html">teslimat ve iade</a> sayfasında.</p></details>'
      + "</div></div>";
    function guncelle() { $("#adet").textContent = String(adet); $$(".adet button").forEach(function (b) { var d = Number(b.dataset.d); b.disabled = adet + d < 1 || adet + d > enCok; }); }
    if (!tukendi) {
      guncelle();
      $$(".adet button").forEach(function (b) { b.addEventListener("click", function () { adet = Math.min(enCok, Math.max(1, adet + Number(b.dataset.d))); guncelle(); }); });
      $("#ekle").addEventListener("click", function () { if (sepeteEkle(u, adet)) { adet = 1; guncelle(); } });
    }
    var benzer = l.filter(function (x) { return x.id !== u.id && x.kategori === u.kategori; }).concat(l.filter(function (x) { return x.id !== u.id && x.kategori !== u.kategori; })).slice(0, 4);
    $("#benzer").innerHTML = benzer.map(kart).join("");
  }).catch(function (e) { veriHatasi(yer, e); });
}

if (SAYFA === "sepet") {
  var liste = $("#kalemler"), ozet = $("#ozet"), form = $("#odeme"), mesaj = $("#odemeMesaj"), urunMap = {};
  function satirlar() {
    return sepet().map(function (x) { var u = urunMap[x.id]; return u ? { u: u, adet: x.adet } : { u: null, id: x.id, adet: x.adet }; });
  }
  function sorunlar(s) {
    return s.filter(function (k) { return !k.u || (typeof k.u.stok === "number" && k.adet > k.u.stok); });
  }
  function ciz() {
    var s = satirlar();
    if (!s.length) {
      $("#sepetIcerik").className = ""; $("#sepetIcerik").innerHTML = '<div class="bos"><h3>Sepetin boş</h3><p>Fırından yeni çıkan parçalara göz at.</p><a class="dugme" href="urunler.html">Ürünlere git</a></div>';
      return;
    }
    liste.innerHTML = s.map(function (k) {
      if (!k.u) return '<li class="kalem"><div class="kucuk" style="background:#ece4d6"></div><div><h3>Satıştan kalkan ürün</h3><p class="uyari">Bu ürün artık satılmıyor; sepetten çıkar.</p></div><div class="sag"><button class="kaldir" type="button" data-kaldir="' + kacir(k.id) + '">Kaldır</button></div></li>';
      var u = k.u, fazla = typeof u.stok === "number" && k.adet > u.stok;
      return '<li class="kalem"><a class="kucuk" href="urun.html?id=' + encodeURIComponent(u.id) + '" style="background:' + zemin(u) + '" aria-label="' + kacir(u.ad) + '">' + resim(u) + '</a><div><a href="urun.html?id=' + encodeURIComponent(u.id) + '"><h3>' + kacir(u.ad) + "</h3></a><span class=\"sir\">" + tl(u.fiyat) + "</span>"
        + (fazla ? '<p class="uyari">' + (u.stok > 0 ? "Stokta " + u.stok + " adet kaldı; adedi düşür." : "Bu ürün tükendi; sepetten çıkar.") + "</p>" : "")
        + '</div><div class="sag"><div class="adet" role="group" aria-label="' + kacir(u.ad) + ' adedi"><button type="button" data-id="' + kacir(u.id) + '" data-d="-1" aria-label="Azalt">−</button><output>' + k.adet + '</output><button type="button" data-id="' + kacir(u.id) + '" data-d="1" aria-label="Artır"' + (typeof u.stok === "number" && k.adet >= u.stok ? " disabled" : "") + '>+</button></div><b>' + tl(u.fiyat * k.adet) + '</b><button class="kaldir" type="button" data-kaldir="' + kacir(u.id) + '">Kaldır</button></div></li>';
    }).join("");
    var ara = s.reduce(function (t, k) { return t + (k.u ? k.u.fiyat * k.adet : 0); }, 0);
    ozet.innerHTML = '<div class="tutar-satir"><span>Ara toplam</span><span>' + tl(ara) + '</span></div><div class="tutar-satir"><span>Kargo</span><span>Ücretsiz</span></div><div class="tutar-satir toplam"><span>Toplam</span><span>' + tl(ara) + "</span></div>";
  }
  liste.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var l = sepet();
    if (b.dataset.kaldir) { sepetYaz(l.filter(function (x) { return x.id !== b.dataset.kaldir; })); ciz(); return; }
    var x = l.find(function (k) { return k.id === b.dataset.id; }); if (!x) return;
    x.adet += Number(b.dataset.d); sepetYaz(l.filter(function (k) { return k.adet > 0; })); ciz();
  });
  function goster(tur, baslik, metin, not) { mesaj.hidden = false; mesaj.className = "mesaj " + tur; mesaj.innerHTML = "<b>" + kacir(baslik) + "</b>" + kacir(metin) + (not ? "<small>" + kacir(not) + "</small>" : ""); mesaj.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  /** Sunucudan gelen ödeme hatasını alıcıya açıkça söyler: sipariş açılmadı, karttan para çekilmedi. */
  function odemeHatasi(m) {
    if (/henüz kurulmadı/.test(m)) return goster("hata", "Ödeme altyapısı henüz bağlanmadı.", "Bu yüzden sipariş alınamadı; kartından hiçbir ücret çekilmedi. Ürünlerin sepette duruyor.", "Site sahibiysen: Vayra Bulut'taki Ödemeler bölümünden iyzico, PayTR ya da Stripe'ı bağla ve test anahtarlarını gir.");
    if (/anahtar/i.test(m)) return goster("hata", "Ödeme sağlayıcısının anahtarları eksik.", m + " Kartından ücret çekilmedi.");
    if (/yayında değil/.test(m)) return goster("hata", "Site henüz yayında değil.", "Ödeme yalnız yayındaki sitede ya da önizlemede test olarak alınır.");
    goster("hata", "Ödeme başlatılamadı.", m + " Kartından ücret çekilmedi; bilgilerini kontrol edip yeniden dene.");
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var s = satirlar();
    if (!s.length) return;
    if (sorunlar(s).length) return goster("hata", "Sepette düzeltilmesi gereken ürün var.", "Tükenen ya da stoğu yetmeyen ürünleri düzelttikten sonra devam et.");
    if (!form.reportValidity()) return;
    if (!window.vayra || !window.vayra.odeme) return goster("bilgi", "Bu canlı önizlemede ödeme alınmaz.", "Şablonu kullanınca ödeme Vayra Ödeme ile güvenli ödeme sayfasında alınır.");
    var f = new FormData(form), dugme = $("#ode");
    dugme.disabled = true; dugme.textContent = "Ödeme sayfası hazırlanıyor…"; mesaj.hidden = true;
    var tutar = s.reduce(function (t, k) { return t + k.u.fiyat * k.adet; }, 0);
    olay("odeme_baslat", { tutar: tutar, kalem: s.length });
    // Fiyatı sunucu "urunler" tablosundan hesaplar; tarayıcı yalnız ürün kimliği ve adet gönderir.
    vayra.odeme.ode({
      urunler: s.map(function (k) { return { id: k.u.id, adet: k.adet }; }),
      alici: { ad: f.get("ad"), soyad: f.get("soyad"), eposta: f.get("eposta"), telefon: f.get("telefon"), adres: f.get("adres"), sehir: f.get("sehir") },
      basariSayfasi: "tesekkurler.html", hataSayfasi: "odeme-hata.html",
    }).then(function () {
      if (window.parent !== window) goster("bilgi", "Ödeme sayfası yeni sekmede açıldı.", "Önizlemedeki ödemeler her zaman testtir; gerçek kart çekimi olmaz.");
    }).catch(function (err) { odemeHatasi(err && err.message || "Bilinmeyen hata"); })
      .finally(function () { dugme.disabled = false; dugme.textContent = "Güvenli ödemeye geç"; });
  });
  urunler().then(function (l) { l.forEach(function (u) { urunMap[u.id] = u; }); ciz(); })
    .catch(function (e) { veriHatasi($("#sepetIcerik"), e); });
}

/* ── Sipariş durumu (teşekkür, hata ve sorgu sayfaları ortak) ── */
var DURUM = { bekliyor: "Ödeme bekleniyor", odendi: "Ödendi", basarisiz: "Ödeme alınamadı", iade: "İade edildi" };
function siparisKarti(s) {
  var adim = s.durum === "odendi" ? 2 : 1;
  return '<div class="sonuc"><div class="sonuc-ust"><div><small class="ipucu">Sipariş numarası</small><br><code>' + kacir(s.siparisNo) + '</code></div><span class="durum ' + kacir(s.durum) + '">' + (DURUM[s.durum] || kacir(s.durum)) + "</span></div>"
    + (s.test ? '<p><span class="rozet test">Test siparişi: karttan para çekilmez</span></p>' : "")
    + '<ul class="kalemler">' + (s.kalemler || []).map(function (k) { return '<li class="tutar-satir"><span>' + kacir(k.ad) + ", " + k.adet + " adet</span><span>" + tl(k.tutar) + "</span></li>"; }).join("") + "</ul>"
    + '<div class="tutar-satir toplam"><span>Toplam</span><span>' + tl(s.tutar) + "</span></div>"
    + (s.durum === "basarisiz" && s.hata ? '<p class="mesaj hata" style="margin-top:14px"><b>Neden?</b>' + kacir(s.hata) + "</p>" : "")
    + (s.durum === "odendi" || s.durum === "bekliyor" ? '<ol class="basamak"><li class="tamam">Sipariş alındı</li><li class="' + (adim >= 2 ? "tamam" : "") + '">Ödeme onaylandı</li><li>Kargoya verildi (takip numarası e-postayla gelir)</li></ol>' : "")
    + '<p class="ipucu" style="margin-top:14px">' + new Date(s.olusturma).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" }) + "</p></div>";
}
function siparisHatirla(no) { try { var l = JSON.parse(localStorage.getItem(SON) || "[]").filter(function (x) { return x !== no; }); l.unshift(no); localStorage.setItem(SON, JSON.stringify(l.slice(0, 5))); } catch (e) { /* yok say */ } }
function siparisIzle(no, yer, bitince) {
  var deneme = 0;
  (function sor() {
    vayra.odeme.durum(no).then(function (s) {
      yer.innerHTML = siparisKarti(s);
      if (s.durum === "bekliyor" && ++deneme < 20) return setTimeout(sor, 3000);
      if (bitince) bitince(s);
    }).catch(function (e) { yer.innerHTML = '<div class="mesaj hata"><b>Sipariş bulunamadı.</b>' + kacir(e.message) + "</div>"; });
  })();
}

if (SAYFA === "tesekkurler" || SAYFA === "odeme-hata") {
  var yer2 = $("#sonuc"), no2 = window.vayra && vayra.odeme ? vayra.odeme.siparis() : null;
  if (!no2) yer2.innerHTML = '<div class="mesaj bilgi"><b>Sipariş numarası yok.</b>Bu sayfa ödemeden dönüşte açılır. Siparişini <a href="siparis.html">sipariş sorgula</a> sayfasından izleyebilirsin.</div>';
  else {
    siparisHatirla(no2);
    siparisIzle(no2, yer2, function (s) {
      if (s.durum === "odendi") { localStorage.removeItem(SEPET); rozet(); olay("satin_alma", { tutar: s.tutar }); if (SAYFA === "odeme-hata") location.replace("tesekkurler.html?siparis=" + encodeURIComponent(no2)); }
      $("#baslik").textContent = s.durum === "odendi" ? "Teşekkürler, siparişin alındı." : s.durum === "bekliyor" ? "Ödemen onay bekliyor." : "Ödeme tamamlanamadı.";
    });
  }
}

if (SAYFA === "siparis") {
  var sf = $("#sorgu"), giris = $("#no"), yer3 = $("#sonuc");
  function sorgula(no) {
    no = String(no || "").trim().toUpperCase();
    if (!/^VS[A-Z0-9]{14}$/.test(no)) { yer3.innerHTML = '<div class="mesaj hata"><b>Numara biçimi hatalı.</b>Sipariş numarası VS ile başlar ve 16 karakterdir; teşekkür sayfasında ve e-postanda yazar.</div>'; return; }
    if (!window.vayra || !window.vayra.odeme) { yer3.innerHTML = '<div class="mesaj bilgi"><b>Bu canlı önizlemede sorgu yapılmaz.</b>Şablonu kullanınca siparişler Vayra Ödeme üzerinden sorgulanır.</div>'; return; }
    yer3.innerHTML = '<div class="iskelet" style="aspect-ratio:3/1;margin-top:26px"></div>';
    siparisIzle(no, yer3); siparisHatirla(no);
  }
  sf.addEventListener("submit", function (e) { e.preventDefault(); sorgula(giris.value); });
  var q = new URLSearchParams(location.search).get("no"); if (q) { giris.value = q; sorgula(q); }
  try { var son = JSON.parse(localStorage.getItem(SON) || "[]"); if (son.length) $("#sonlar").innerHTML = "Son siparişlerin: " + son.map(function (n) { return '<button type="button" data-no="' + kacir(n) + '">' + kacir(n) + "</button>"; }).join(""); } catch (e) { /* yok say */ }
  $("#sonlar").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) { giris.value = b.dataset.no; sorgula(b.dataset.no); } });
}
`;

const ILLER = ["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis", "Kırıkkale", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt", "Sinop", "Sivas", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"];

const SIMGE = {
  kargo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="7" cy="17.5" r="1.8" fill="var(--kagit)" stroke="currentColor" stroke-width="1.6"/><circle cx="17" cy="17.5" r="1.8" fill="var(--kagit)" stroke="currentColor" stroke-width="1.6"/></svg>',
  kutu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8l8-4 8 4v8l-8 4-8-4z M4 8l8 4 8-4 M12 12v8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  iade: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7H5V3 M5.5 7A8 8 0 1 1 4 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
};

export const SERAMIK_BUTIK = {
  id: "seramik-butik",
  ad: "Toprakhane · Seramik Butiği",
  tur: "site" as const,
  aciklama: "El yapımı seramik mağazası: stoklu ürün tablosu, kategori süzgeci, sepet, Vayra Ödeme ile ödeme ve sipariş sorgusu",
  kapak: "/gercek/build/sablon/seramik-butik.webp",
  tablolar: TABLOLAR,
  dosyalar: {
    "index.html": sayfa("index.html", "Toprakhane · El yapımı seramik", "Kuzguncuk'taki atölyemizde çarkta şekillenen kase, kupa, tabak ve vazolar. Ücretsiz kargo, 14 gün iade.", `<section class="kahraman">
  <div>
    <p class="ust-yazi">Kuzguncuk atölyesinden, elden ele</p>
    <h1>Elde çekilmiş, <em>fırında</em> olgunlaşmış.</h1>
    <p class="giris">Her parça çarkta tek tek şekillenir, iki kez pişer ve sofrana tek başına gelir. Sırın akışı, toprağın beneği her seferinde başkadır; ikizi yoktur.</p>
    <div class="eylemler"><a class="dugme" href="urunler.html">Ürünleri gör</a><a class="dugme ikincil" href="#atolye">Atölyeyi tanı</a></div>
  </div>
  <div class="sahne" aria-hidden="true">
    <div class="parca p3"></div><div class="parca p1"></div><div class="parca p2"></div>
    <div class="etiket"><b>Bu hafta fırından</b>Zeytin, kobalt ve turkuaz sırlar</div>
  </div>
</section>
<section class="serit" aria-label="Alışveriş bilgileri">
  <div>${SIMGE.kargo}<span><b>Ücretsiz kargo</b>Türkiye'nin her yerine, 2 ile 4 iş günü</span></div>
  <div>${SIMGE.kutu}<span><b>Çift kutu ambalaj</b>Kırılırsa yenisini gönderiyoruz</span></div>
  <div>${SIMGE.iade}<span><b>14 gün iade</b>Kullanılmamış parçada koşulsuz</span></div>
</section>
<section class="bolum">
  <div class="bolum-ust"><div><h2>Fırından yeni çıkanlar</h2><p>Atölyenin bu ay en sevilen parçaları. Stoklar küçük; her biri birkaç tane.</p></div><a class="dugme ikincil" href="urunler.html">Hepsini gör</a></div>
  <div class="izgara" id="oneCikan" aria-live="polite"></div>
</section>
<section class="bolum" style="padding-top:0">
  <div class="bolum-ust"><div><h2>Kategoriler</h2></div></div>
  <nav class="kategoriler" aria-label="Kategoriler">
${KATEGORILER.map((k) => `    <a href="urunler.html?kategori=${encodeURIComponent(k)}" data-kategori="${k}"><span>${k}</span><small>&nbsp;</small></a>`).join("\n")}
  </nav>
</section>
<section class="bolum" id="atolye" style="padding-top:24px">
  <div class="atolye">
    <div>
      <h2>Bir kase üç haftada biter.</h2>
      <p>Toprakhane, Kuzguncuk'ta iki çark ve bir fırınla çalışan küçük bir atölye. Kullandığımız stoneware toprak Menemen'den gelir; sırlarımızı atölyede kendimiz hazırlarız.</p>
      <ol class="adimlar">
        <li><span><b>Çarkta şekillendirme</b>Toprak yoğrulur, çarkta çekilir ve bir gün kurumaya bırakılır.</span></li>
        <li><span><b>Tornalama ve bisküvi pişirimi</b>Dip tornalanır, kulp takılır, 950 derecede ilk pişirim yapılır.</span></li>
        <li><span><b>Sırlama ve ikinci pişirim</b>Elde daldırılan sır 1240 derecede camlaşır; parça artık yemeğe hazırdır.</span></li>
      </ol>
    </div>
    <div class="atolye-kart">
      <h3>Atölyeye uğra</h3>
      <p>Salı ile cumartesi arası kapımız açık. Hafta sonları çarkın başında birlikte kase çektiğimiz başlangıç atölyeleri var.</p>
      <dl><div><dt>Bir pişirimde</dt><dd>60 parça</dd></div><div><dt>Fırın sıcaklığı</dt><dd>1240 derece</dd></div><div><dt>Sır çeşidi</dt><dd>14</dd></div><div><dt>Kurulduğu yıl</dt><dd>2017</dd></div></dl>
    </div>
  </div>
</section>`),
    "urunler.html": sayfa("urunler.html", "Ürünler · Toprakhane", "Kase, tabak, kupa, vazo, sürahi ve saksı: Toprakhane'nin el yapımı seramikleri.", `<section class="bolum">
  <div class="bolum-ust"><div><h1 style="font-size:clamp(44px,6vw,72px)">Ürünler</h1><p>Hepsi Kuzguncuk'ta, elde yapıldı. Kargo ücretsiz.</p></div></div>
  <div class="suzgec" role="group" aria-label="Kategori süzgeci">
    <button type="button" data-kategori="Hepsi" aria-pressed="true">Hepsi</button>
${KATEGORILER.map((k) => `    <button type="button" data-kategori="${k}" aria-pressed="false">${k}</button>`).join("\n")}
  </div>
  <div class="arac-satiri"><span class="sayac" id="sayac" aria-live="polite"></span><label>Sırala <select id="sirala"><option value="onerilen">Önerilen</option><option value="artan">Fiyat: düşükten yükseğe</option><option value="azalan">Fiyat: yüksekten düşüğe</option><option value="stok">Stokta olanlar önce</option></select></label></div>
  <div class="izgara" id="izgara"></div>
</section>`),
    "urun.html": sayfa("urun.html", "Ürün · Toprakhane", "Toprakhane'nin el yapımı seramik ürünü.", `<section class="bolum" id="urun"><div class="iskelet" style="max-width:520px"></div></section>
<section class="bolum" style="padding-top:0">
  <div class="bolum-ust"><div><h2>Bunlar da hoşuna gidebilir</h2></div></div>
  <div class="izgara" id="benzer"></div>
</section>`),
    "sepet.html": sayfa("sepet.html", "Sepet · Toprakhane", "Sepetindeki ürünler ve güvenli ödeme.", `<section class="bolum">
  <div class="bolum-ust"><div><h1 style="font-size:clamp(44px,6vw,72px)">Sepet</h1><p>Fiyatlar KDV dahil. Kargo ücretsiz.</p></div></div>
  <div id="sepetIcerik" class="sepet">
    <div><ul class="kalemler" id="kalemler" aria-live="polite"></ul></div>
    <aside class="ozet-kutu" aria-labelledby="ozetBaslik">
      <h2 id="ozetBaslik">Sipariş özeti</h2>
      <div id="ozet"></div>
      <form class="form" id="odeme" novalidate>
        <div class="ikili"><label>Ad<input name="ad" required autocomplete="given-name" /></label><label>Soyad<input name="soyad" required autocomplete="family-name" /></label></div>
        <label>E-posta<input name="eposta" type="email" required autocomplete="email" inputmode="email" /></label>
        <label>Cep telefonu<input name="telefon" type="tel" required autocomplete="tel" inputmode="tel" placeholder="05xx xxx xx xx" pattern="[0-9 +()]{10,17}" /></label>
        <label>Teslimat adresi<textarea name="adres" required rows="3" autocomplete="street-address" minlength="10"></textarea></label>
        <label>Şehir<input name="sehir" required list="iller" autocomplete="address-level1" /></label>
        <datalist id="iller">${ILLER.map((i) => `<option value="${i}">`).join("")}</datalist>
        <label class="onay"><input type="checkbox" name="sozlesme" required /> <span><a href="sozlesme.html" target="_blank" rel="noopener">Mesafeli satış sözleşmesini</a> ve iade koşullarını okudum, onaylıyorum.</span></label>
        <div id="odemeMesaj" class="mesaj" role="alert" hidden></div>
        <button class="dugme tam" id="ode" type="submit">Güvenli ödemeye geç</button>
        <p class="ipucu">Kart bilgilerini ödeme kuruluşunun güvenli sayfasına girersin; bu siteye hiç gelmez.</p>
      </form>
    </aside>
  </div>
</section>`),
    "tesekkurler.html": sayfa("tesekkurler.html", "Teşekkürler · Toprakhane", "Siparişin alındı.", `<section class="dar">
  <h1 id="baslik">Siparişin kontrol ediliyor…</h1>
  <p>Ödeme sonucunu ödeme kuruluşundan doğruluyoruz. Sipariş numaranı not al; durumunu istediğin zaman sorgulayabilirsin.</p>
  <div id="sonuc" aria-live="polite"><div class="iskelet" style="aspect-ratio:3/1;margin-top:26px"></div></div>
  <div class="eylemler" style="margin-top:26px"><a class="dugme" href="urunler.html">Alışverişe devam et</a><a class="dugme ikincil" href="siparis.html">Sipariş sorgula</a></div>
</section>`),
    "odeme-hata.html": sayfa("odeme-hata.html", "Ödeme tamamlanmadı · Toprakhane", "Ödeme tamamlanamadı.", `<section class="dar">
  <h1 id="baslik">Ödeme tamamlanamadı.</h1>
  <p>Kartından ücret çekilmedi. Ürünlerin sepette duruyor; bilgilerini kontrol edip yeniden deneyebilir ya da başka bir kart kullanabilirsin.</p>
  <div id="sonuc" aria-live="polite"></div>
  <div class="eylemler" style="margin-top:26px"><a class="dugme" href="sepet.html">Sepete dön, yeniden dene</a><a class="dugme ikincil" href="mailto:merhaba@toprakhane.com.tr">Bize yaz</a></div>
</section>`),
    "siparis.html": sayfa("siparis.html", "Sipariş sorgula · Toprakhane", "Sipariş numaranla ödeme ve kargo durumunu öğren.", `<section class="dar">
  <h1>Sipariş sorgula</h1>
  <p>Sipariş numaran teşekkür sayfasında ve sana gelen e-postada yazar. VS ile başlar.</p>
  <form class="sorgu" id="sorgu" role="search"><label class="atla" for="no">Sipariş numarası</label><input id="no" name="no" placeholder="VS…" autocomplete="off" maxlength="16" required /><button class="dugme" type="submit">Sorgula</button></form>
  <div class="son-siparisler" id="sonlar"></div>
  <div id="sonuc" aria-live="polite"></div>
</section>`),
    "sozlesme.html": sayfa("sozlesme.html", "Mesafeli satış ve iade · Toprakhane", "Toprakhane mesafeli satış sözleşmesi, teslimat ve iade koşulları.", `<section class="dar metin">
  <h1>Teslimat, iade ve mesafeli satış</h1>
  <p>Bu sayfa 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca hazırlanmıştır. Siparişi onaylamadan önce okumanı rica ederiz.</p>
  <h2>Taraflar</h2>
  <p>Satıcı: Toprakhane Seramik Atölyesi, İcadiye Cad. No: 41, Kuzguncuk, Üsküdar / İstanbul, merhaba@toprakhane.com.tr. Alıcı: ödeme sayfasında adı, adresi ve iletişim bilgileri yazılı kişi.</p>
  <h2>Sözleşmenin konusu</h2>
  <p>Alıcının siteden sipariş ettiği ürünlerin satışı ve teslimidir. Ürünlerin adı, adedi ve KDV dahil satış fiyatı sipariş özetinde ve ödeme sayfasında yer alır. Kargo ücreti satıcıya aittir.</p>
  <h2>Teslimat</h2>
  <p>Ödeme onaylandıktan sonra ürünler en geç 3 iş günü içinde kargoya verilir ve 2 ile 4 iş günü içinde teslim edilir. Her parça çift kutuyla gönderilir. Kargo takip numarası e-postayla iletilir.</p>
  <h2>Kırık ya da hasarlı teslimat</h2>
  <p>Paketi teslim alırken hasar görürsen kargo görevlisine tutanak tutturman yeterli. Teslimden sonra fark edersen 48 saat içinde fotoğrafla bize yaz; aynı ürünü ya da stok yoksa bedelini gönderiyoruz.</p>
  <h2>Cayma hakkı ve iade</h2>
  <p>Teslimden itibaren 14 gün içinde gerekçe göstermeden cayma hakkın var. Kullanılmamış ürünü orijinal ambalajıyla, sipariş numarasını yazarak atölye adresimize gönder. İade kargo ücreti bize aittir; anlaşmalı kargo kodunu e-postayla iletiriz. Ürün bize ulaştıktan sonra 14 gün içinde ödeme, kullandığın karta iade edilir.</p>
  <h2>Kişisel veriler</h2>
  <p>Ad, adres, telefon ve e-posta bilgilerin yalnız siparişin teslimi ve faturalandırılması için işlenir, kargo firması dışında kimseyle paylaşılmaz. Kart bilgilerin ödeme kuruluşunda kalır, bize ulaşmaz.</p>
  <h2>Uyuşmazlık</h2>
  <p>Uyuşmazlıklarda Ticaret Bakanlığınca ilan edilen parasal sınırlar içinde Tüketici Hakem Heyetleri, üzerinde Tüketici Mahkemeleri yetkilidir.</p>
</section>`),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#b4593b"/><path d="M15 21h34l-4.4 27.5A7 7 0 0 1 37.7 54H26.3a7 7 0 0 1-6.9-5.5z" fill="#f5f0e8"/><ellipse cx="32" cy="21" rx="17" ry="5" fill="#2a211b"/></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
  },
};
