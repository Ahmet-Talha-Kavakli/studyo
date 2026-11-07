/* Şablon: Avlu Gayrimenkul — emlak ilanları. İlanlar "ilanlar" tablosundan (il, ilçe, fiyat aralığı, oda sayısı, satılık ya da
 * kiralık süzgeci), ilan ayrıntısı ve görsel galerisi, "talepler" tablosuna yazan Bilgi iste formu, vayra.uye ile giriş yapan
 * üyenin favorileri ("favoriler" tablosu, kural sahibi: herkes yalnız kendi favorisini görür) ve Hesabım ekranı. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";

const G = {
  villa1: "/gercek/sc/uyg-emlak.webp", villa2: "/gercek/sc/uyg-ilan.webp", kule1: "/gercek/kesfet/mimari-gorsellestirmearchviz.webp", kule2: "/gercek/kesfet/mimari-gorsel10.webp",
  mutfak: "/gercek/paz/ortam-mutfak.webp", salon: "/gercek/paz/ortam-ofis.webp", yatak: "/gercek/paz/ortam-yatak.webp",
  koy: "/gercek/havuz/gorsel/mk-deniz-4999.webp", kiyi: "/gercek/havuz/gorsel/mk-deniz-1082.webp", gece: "/gercek/havuz/gorsel/mk-sehir-49845.webp", iskele: "/gercek/havuz/gorsel/mk-deniz-1197.webp", korfez: "/gercek/havuz/gorsel/mk-deniz-44498.webp",
};
const DANISMANLAR: Record<string, { foto: string; tel: string }> = {
  "Emre Aksoy": { foto: "/gercek/paz/av-erik.webp", tel: "0532 614 22 80" },
  "Gizem Polat": { foto: "/gercek/paz/av-clara.webp", tel: "0533 718 40 15" },
  "Can Ertürk": { foto: "/gercek/paz/av-stefan.webp", tel: "0542 305 91 64" },
};

const ILANLAR = [
  { id: "yalikavak-villa", baslik: "Yalıkavak'ta deniz manzaralı, havuzlu villa", tur: "Satılık", tip: "Villa", il: "Muğla", ilce: "Bodrum", mahalle: "Yalıkavak", fiyat: 38500000, oda: "5+1", brut: 340, net: 290, kat: "Bahçe dubleksi, 3 kat", binaYasi: 4, isitma: "Yerden ısıtma, ısı pompası", esyali: false, aidat: 6500, enlem: 37.1065, boylam: 27.2955, danisman: "Emre Aksoy", onecikan: true,
    gorseller: [G.villa1, G.salon, G.mutfak, G.yatak, G.koy], ozellikler: ["Özel havuz", "Deniz manzarası", "620 metrekare bahçe", "Akıllı ev sistemi", "Güneş paneli", "Kapalı otopark"],
    aciklama: "Yalıkavak koyuna bakan yamaçta, 2022 yapımı, tek parsel üzerinde müstakil villa. Giriş katında açık mutfaklı salon ve havuza açılan teras; üst katta dört yatak odası, her birinin kendi banyosu var. Bodrum katta misafir odası, sinema odası ve çamaşırhane bulunuyor. Marinaya arabayla 6 dakika." },
  { id: "alacati-villa", baslik: "Alaçatı'da taş mimarili, bahçeli villa", tur: "Satılık", tip: "Villa", il: "İzmir", ilce: "Çeşme", mahalle: "Alaçatı", fiyat: 27900000, oda: "4+1", brut: 260, net: 215, kat: "2 kat", binaYasi: 6, isitma: "Kombi ve şömine", esyali: true, aidat: 3200, enlem: 38.27, boylam: 26.375, danisman: "Gizem Polat", onecikan: true,
    gorseller: [G.villa2, G.salon, G.yatak, G.kiyi], ozellikler: ["Taş mimari", "Havuz", "Şömine", "Eşyalı", "Sörf plajına 5 dakika", "Krediye uygun"],
    aciklama: "Alaçatı'nın taş sokaklarına yürüme mesafesinde, yedi villalık küçük bir sitede. Ahşap tavanlı salon, ada mutfak ve bahçeye açılan geniş veranda. Eşyalarıyla birlikte satılıktır; yaz sezonu kiralamasında doluluğu yüksek bir bölgedir." },
  { id: "atasehir-rezidans", baslik: "Finans merkezine yürüme mesafesinde 2+1 rezidans", tur: "Satılık", tip: "Rezidans", il: "İstanbul", ilce: "Ataşehir", mahalle: "Barbaros", fiyat: 14750000, oda: "2+1", brut: 125, net: 98, kat: "18. kat", binaYasi: 3, isitma: "Merkezi sistem, yerden ısıtma", esyali: false, aidat: 9800, enlem: 40.9915, boylam: 29.127, danisman: "Can Ertürk", onecikan: true,
    gorseller: [G.kule1, G.mutfak, G.yatak, G.gece], ozellikler: ["24 saat güvenlik", "Kapalı havuz", "Spor salonu", "Metroya 4 dakika", "Konsiyerj", "Şehir manzarası"],
    aciklama: "İstanbul Finans Merkezi'ne yürüme mesafesindeki rezidansın 18. katında, güney cepheli 2+1. Salon ve ebeveyn yatak odası tam boy cama sahip; mutfak ankastre ve kapalı. Sitede kapalı havuz, spor salonu ve iki araçlık otopark hakkı var." },
  { id: "esentepe-rezidans", baslik: "Esentepe'de eşyalı 1+1 rezidans dairesi", tur: "Kiralık", tip: "Rezidans", il: "İstanbul", ilce: "Şişli", mahalle: "Esentepe", fiyat: 85000, oda: "1+1", brut: 78, net: 62, kat: "24. kat", binaYasi: 7, isitma: "Merkezi sistem", esyali: true, aidat: 7500, enlem: 41.0745, boylam: 29.011, danisman: "Can Ertürk", onecikan: false,
    gorseller: [G.kule2, G.salon, G.gece], ozellikler: ["Eşyalı", "Boğaz manzarası", "Metroya 3 dakika", "Konsiyerj", "Otopark"],
    aciklama: "Levent ve Mecidiyeköy iş merkezlerine yakın, eşyalı ve kullanıma hazır 1+1. Beyaz eşyalar yeni, internet altyapısı fiber. En az bir yıllık kiralama; depozito iki kira bedelidir. Aidat kiracıya aittir." },
  { id: "moda-daire", baslik: "Moda'da sahile 4 dakika, yenilenmiş 3+1", tur: "Satılık", tip: "Daire", il: "İstanbul", ilce: "Kadıköy", mahalle: "Caferağa", fiyat: 18900000, oda: "3+1", brut: 145, net: 125, kat: "3. kat", binaYasi: 32, isitma: "Kombi", esyali: false, aidat: 1500, enlem: 40.984, boylam: 29.027, danisman: "Gizem Polat", onecikan: false,
    gorseller: [G.mutfak, G.salon, G.yatak, G.iskele], ozellikler: ["2025'te yenilendi", "Balkon", "Asansör", "Ankastre mutfak", "Moda sahiline 4 dakika"],
    aciklama: "Moda Caddesi'ne paralel, ağaçlı sokakta beş katlı apartmanın üçüncü katı. 2025'te tesisatı, doğramaları ve mutfağıyla baştan yenilendi. Salonun balkonu sokağa bakıyor; iki yatak odası arka cephede ve sessiz. Tapusu kat mülkiyetlidir." },
  { id: "besiktas-kiralik", baslik: "Abbasağa Parkı'na komşu 2+1 kiralık", tur: "Kiralık", tip: "Daire", il: "İstanbul", ilce: "Beşiktaş", mahalle: "Sinanpaşa", fiyat: 62000, oda: "2+1", brut: 105, net: 90, kat: "2. kat", binaYasi: 18, isitma: "Kombi", esyali: false, aidat: 1200, enlem: 41.045, boylam: 29.005, danisman: "Emre Aksoy", onecikan: false,
    gorseller: [G.salon, G.yatak, G.mutfak], ozellikler: ["Parka komşu", "Ankastre mutfak", "Çarşıya 5 dakika", "Evcil hayvana uygun"],
    aciklama: "Abbasağa Parkı'nın hemen yanında, aydınlık ve ferah 2+1. Beşiktaş çarşısına ve vapur iskelesine yürüme mesafesinde. Evcil hayvan kabul edilir; en az bir yıllık sözleşme ve iki kira depozito istenir." },
  { id: "ayranci-kiralik", baslik: "Ayrancı'da geniş ve aydınlık 3+1 kiralık", tur: "Kiralık", tip: "Daire", il: "Ankara", ilce: "Çankaya", mahalle: "Ayrancı", fiyat: 32000, oda: "3+1", brut: 160, net: 140, kat: "4. kat", binaYasi: 22, isitma: "Doğalgaz kombi", esyali: false, aidat: 900, enlem: 39.901, boylam: 32.859, danisman: "Can Ertürk", onecikan: false,
    gorseller: [G.yatak, G.mutfak, G.salon], ozellikler: ["Çift cephe", "Ebeveyn banyosu", "Kapalı otopark", "Okullara yakın"],
    aciklama: "Ayrancı'nın sakin bir sokağında, çift cepheli ve gün boyu güneş alan 3+1. Ebeveyn banyolu yatak odası, ayrı kiler ve geniş giriş holü var. Kuğulu Park ve Tunalı Hilmi Caddesi'ne yürüme mesafesinde." },
  { id: "bostanli-daire", baslik: "Bostanlı'da körfez manzaralı 3+1", tur: "Satılık", tip: "Daire", il: "İzmir", ilce: "Karşıyaka", mahalle: "Bostanlı", fiyat: 11400000, oda: "3+1", brut: 150, net: 130, kat: "6. kat", binaYasi: 9, isitma: "Kombi", esyali: false, aidat: 1800, enlem: 38.457, boylam: 27.095, danisman: "Gizem Polat", onecikan: false,
    gorseller: [G.korfez, G.mutfak, G.yatak], ozellikler: ["Körfez manzarası", "Sahile 3 dakika", "Site içinde", "Otopark", "Krediye uygun"],
    aciklama: "Bostanlı sahiline üç dakika yürüme mesafesindeki sitede, körfeze bakan 3+1. Salondan ve mutfaktan gün batımı görülüyor. Vapur iskelesi ve tramvay durağı yakın; sitede çocuk parkı ve kapalı otopark var." },
].map((x) => ({ ...x, aktif: true, ilanTarihi: "2026-10-" + String(10 + Math.abs(x.id.length % 18)).padStart(2, "0") }));

const ODALAR = ["1+0", "1+1", "2+1", "3+1", "4+1", "5+1"];

const TABLOLAR: Record<string, SablonTablo> = {
  ilanlar: {
    aciklama: "Yayındaki emlak ilanları. Herkes okur; yalnız site sahibi ekler ve düzenler. Kiralıkta fiyat aylık kiradır.",
    kurallar: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" },
    sema: [
      { ad: "baslik", tur: "metin", zorunlu: true },
      { ad: "tur", tur: "secim", zorunlu: true, secenekler: ["Satılık", "Kiralık"] },
      { ad: "tip", tur: "secim", secenekler: ["Daire", "Rezidans", "Villa", "Müstakil ev"] },
      { ad: "il", tur: "metin", zorunlu: true },
      { ad: "ilce", tur: "metin", zorunlu: true },
      { ad: "mahalle", tur: "metin" },
      { ad: "fiyat", tur: "sayi", zorunlu: true, aciklama: "TL; kiralıkta aylık" },
      { ad: "oda", tur: "secim", secenekler: ODALAR },
      { ad: "brut", tur: "sayi", aciklama: "Brüt metrekare" },
      { ad: "net", tur: "sayi", aciklama: "Net metrekare" },
      { ad: "kat", tur: "metin" },
      { ad: "binaYasi", tur: "sayi" },
      { ad: "isitma", tur: "metin" },
      { ad: "esyali", tur: "mantiksal" },
      { ad: "aidat", tur: "sayi", aciklama: "TL, aylık" },
      { ad: "aciklama", tur: "uzunMetin" },
      { ad: "gorseller", tur: "json", aciklama: "Görsel adresleri listesi; ilki kapak" },
      { ad: "ozellikler", tur: "json", aciklama: "Öne çıkan özellikler listesi" },
      { ad: "enlem", tur: "sayi" },
      { ad: "boylam", tur: "sayi" },
      { ad: "danisman", tur: "metin" },
      { ad: "onecikan", tur: "mantiksal", aciklama: "Ana sayfada gösterilir" },
      { ad: "aktif", tur: "mantiksal", varsayilan: true },
      { ad: "ilanTarihi", tur: "tarih" },
    ],
    kayitlar: ILANLAR,
  },
  talepler: {
    aciklama: "İlanlardaki Bilgi iste formundan gelen talepler. Ziyaretçi ekleyebilir ama okuyamaz.",
    kurallar: { okuma: "kapali", ekleme: "herkes", duzenleme: "kapali" },
    sema: [
      { ad: "ilanId", tur: "iliski", iliski: "ilanlar", zorunlu: true },
      { ad: "ilanBaslik", tur: "metin" },
      { ad: "ad", tur: "metin", zorunlu: true },
      { ad: "telefon", tur: "metin", zorunlu: true },
      { ad: "eposta", tur: "eposta" },
      { ad: "mesaj", tur: "uzunMetin" },
      { ad: "tercih", tur: "secim", secenekler: ["Telefon", "WhatsApp", "E-posta"], varsayilan: "Telefon" },
      { ad: "kvkk", tur: "mantiksal", zorunlu: true },
      { ad: "durum", tur: "secim", secenekler: ["Yeni", "Arandı", "Gösterim yapıldı", "Kapandı"], varsayilan: "Yeni" },
    ],
    kayitlar: [],
  },
  favoriler: {
    aciklama: "Üyelerin favori ilanları. Her üye yalnız kendi favorilerini görür, ekler ve siler.",
    kurallar: { okuma: "sahibi", ekleme: "uyeler", duzenleme: "sahibi" },
    sema: [
      { ad: "ilanId", tur: "iliski", iliski: "ilanlar", zorunlu: true },
      { ad: "ilanBaslik", tur: "metin" },
      { ad: "uye", tur: "metin", aciklama: "Üye kimliği (önizlemede süzmek için; yayında uyeId kullanılır)" },
    ],
    kayitlar: [],
  },
};

const KALP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-9.2-8.6C1.2 8.2 3 4.5 6.6 4.5c2.1 0 3.5 1.2 4.4 2.6.9-1.4 2.3-2.6 4.4-2.6 3.6 0 5.4 3.7 3.8 6.9C19 15.6 12 20 12 20z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';

const ust = (aktif: string) => `<a class="atla" href="#icerik">İçeriğe geç</a>
<header class="ust">
  <a class="logo" href="index.html" aria-label="Avlu Gayrimenkul ana sayfa"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 27V13L16 5l12 8v14" fill="none" stroke="currentColor" stroke-width="2"/><path d="M11 27v-8h10v8" fill="none" stroke="currentColor" stroke-width="2"/></svg><span>Avlu<small>Gayrimenkul</small></span></a>
  <nav class="menu" data-menu aria-label="Ana menü">
${[["ilanlar.html?tur=Satılık", "Satılık"], ["ilanlar.html?tur=Kiralık", "Kiralık"], ["ilanlar.html", "Bütün ilanlar"], ["index.html#danismanlar", "Danışmanlar"]].map(([h, a]) => `    <a href="${h}"${h === aktif ? ' aria-current="page"' : ""}>${a}</a>`).join("\n")}
  </nav>
  <a class="fav-baglanti" href="favoriler.html"${aktif === "favoriler.html" ? ' aria-current="page"' : ""}>${KALP}<span id="uyeDurum">Giriş yap</span><b id="favSayi" hidden>0</b></a>
  <button class="menu-dugme" type="button" data-menu-ac aria-expanded="false" aria-label="Menüyü aç"><span></span><span></span></button>
</header>`;

const alt = `<footer class="alt">
  <div class="alt-ic">
    <div><p class="logo-alt">Avlu Gayrimenkul</p><p>2009'dan beri İstanbul, İzmir, Bodrum ve Ankara'da konut alım, satım ve kiralama danışmanlığı.</p></div>
    <div><h4>Ofis</h4><p>Bağdat Cad. No: 214, Caddebostan, Kadıköy / İstanbul</p><p><a href="tel:+902163851020">0216 385 10 20</a></p></div>
    <div><h4>Belgeler</h4><p>Taşınmaz Ticareti Yetki Belgesi No: 3400417</p><p>Hizmet bedeli satışta yüzde 2, kiralamada bir aylık kira, KDV hariç.</p></div>
  </div>
  <p class="alt-not">İlan bilgileri mal sahibinin beyanına dayanır; tapu ve imar durumu satış öncesi resmî belgelerle doğrulanır.</p>
</footer>`;

const sayfa = (dosya: string, baslik: string, aciklama: string, govde: string) => `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${baslik}</title>
  <meta name="description" content="${aciklama}" />
  <meta name="theme-color" content="#f2efe8" />
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500;600;700&display=swap" />
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

const STIL = String.raw`/* Avlu Gayrimenkul — taş zemin, orman yeşili, pirinç vurgu; Instrument Serif başlıklar, Instrument Sans gövde. */
:root {
  --tas: #f2efe8; --kart: #fffdf9; --murekkep: #17211c; --soluk: #5b655f; --orman: #1f3a2e; --orman-koyu: #142a20; --pirinc: #b08544; --pirinc-acik: #f1e5cf;
  --kalp: #d2453a; --cizgi: rgba(23, 33, 28, .12); --yaricap: 18px; --baslik: "Instrument Serif", Georgia, serif; --govde: "Instrument Sans", system-ui, sans-serif;
}
[hidden] { display: none !important; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--tas); color: var(--murekkep); font: 16px/1.6 var(--govde); -webkit-font-smoothing: antialiased; }
img, svg { display: block; max-width: 100%; }
a { color: inherit; }
h1, h2, h3 { font-family: var(--baslik); font-weight: 400; line-height: 1.04; margin: 0; letter-spacing: -.01em; }
h1 em, h2 em { color: var(--pirinc); }
:focus-visible { outline: 3px solid var(--pirinc); outline-offset: 2px; border-radius: 6px; }
.atla { position: absolute; left: -999px; top: 8px; background: var(--orman); color: #fff; padding: 8px 14px; border-radius: 10px; z-index: 80; }
.atla:focus { left: 12px; }
.kapsayici { max-width: 1280px; margin: 0 auto; padding: 0 clamp(16px, 4.5vw, 48px); }

.ust { position: sticky; top: 0; z-index: 40; display: flex; align-items: center; gap: 20px; padding: 12px clamp(16px, 4.5vw, 48px); background: color-mix(in srgb, var(--tas) 90%, transparent); backdrop-filter: blur(12px); border-bottom: 1px solid var(--cizgi); }
.logo { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: var(--orman); }
.logo svg { width: 30px; height: 30px; }
.logo span { font-family: var(--baslik); font-size: 27px; line-height: .9; }
.logo small { display: block; font-family: var(--govde); font-size: 11px; font-weight: 600; color: var(--soluk); letter-spacing: .02em; }
.menu { display: flex; gap: 4px; margin-left: auto; }
.menu a { text-decoration: none; padding: 9px 13px; border-radius: 99px; font-weight: 500; font-size: 15px; color: var(--soluk); }
.menu a:hover, .menu a[aria-current] { color: var(--murekkep); background: #e7e2d7; }
.fav-baglanti { display: inline-flex; align-items: center; gap: 8px; min-height: 42px; padding: 8px 14px; border-radius: 99px; background: var(--orman); color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; }
.fav-baglanti svg { width: 17px; height: 17px; color: #f0b7ae; }
.fav-baglanti b[hidden] { display: none; }
.fav-baglanti b { min-width: 22px; height: 22px; border-radius: 99px; background: var(--pirinc); display: grid; place-items: center; font-size: 12px; }
.menu-dugme { display: none; width: 42px; height: 42px; border: 1px solid var(--cizgi); background: var(--kart); border-radius: 12px; cursor: pointer; flex-direction: column; justify-content: center; align-items: center; gap: 6px; }
.menu-dugme span { width: 18px; height: 2px; background: var(--murekkep); border-radius: 2px; }

.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 50px; padding: 12px 22px; border-radius: 12px; border: 0; background: var(--orman); color: #fff; font: 600 15px/1 var(--govde); text-decoration: none; cursor: pointer; transition: background .2s, transform .2s; }
.dugme:hover { background: var(--orman-koyu); }
.dugme:active { transform: scale(.98); }
.dugme[disabled] { opacity: .55; cursor: not-allowed; }
.dugme.ikincil { background: var(--kart); color: var(--murekkep); border: 1px solid rgba(23, 33, 28, .22); }
.dugme.pirinc { background: var(--pirinc); }
.dugme.tam { width: 100%; }

/* Kahraman ve arama */
.kahraman { position: relative; min-height: min(80vh, 720px); display: grid; align-items: end; overflow: hidden; color: #fff; }
.kahraman > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.kahraman::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10, 18, 14, .1) 30%, rgba(10, 18, 14, .72)); }
.kahraman .ic { position: relative; z-index: 1; width: 100%; padding-block: 0 clamp(28px, 5vw, 56px); }
.kahraman h1 { font-size: clamp(48px, 7.5vw, 104px); max-width: 900px; }
.kahraman h1 em { color: #f4d6a4; }
.kahraman p { font-size: clamp(16px, 1.5vw, 19px); max-width: 560px; color: #e6ebe7; margin: 14px 0 26px; }
.arama { display: grid; grid-template-columns: auto 1fr 1fr 1fr auto; gap: 8px; align-items: end; background: var(--kart); color: var(--murekkep); border-radius: 20px; padding: 12px; max-width: 1080px; }
.arama > * { min-width: 0; }
.arama label { display: grid; gap: 4px; font-size: 12.5px; font-weight: 600; color: var(--soluk); padding: 0 4px; }
.arama select { width: 100%; min-height: 48px; border-radius: 12px; border: 1px solid var(--cizgi); background: #fff; padding: 10px 12px; font: 500 15.5px var(--govde); color: var(--murekkep); }
.ikili-anahtar { display: inline-flex; padding: 4px; border-radius: 14px; background: #ece7dc; align-self: stretch; }
.ikili-anahtar button { min-height: 48px; padding: 0 16px; border: 0; border-radius: 10px; background: transparent; font: 600 15px var(--govde); cursor: pointer; color: var(--soluk); }
.ikili-anahtar button[aria-pressed="true"] { background: var(--orman); color: #fff; }

.bolum { padding-block: clamp(52px, 7vw, 100px); }
.bolum-ust { display: flex; justify-content: space-between; align-items: end; gap: 18px; flex-wrap: wrap; margin-bottom: 30px; }
.bolum-ust h2 { font-size: clamp(36px, 4.6vw, 60px); }
.bolum-ust p { margin: 8px 0 0; color: var(--soluk); max-width: 560px; }

/* İlan kartı */
.izgara { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 22px; }
.ilan-kart { position: relative; display: flex; flex-direction: column; background: var(--kart); border: 1px solid var(--cizgi); border-radius: var(--yaricap); overflow: hidden; transition: transform .25s, border-color .25s; }
.ilan-kart:hover { transform: translateY(-3px); border-color: rgba(23, 33, 28, .28); }
.ilan-kart > a { text-decoration: none; display: flex; flex-direction: column; flex: 1; }
.ilan-kart .resim { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background: #e2ddd2; }
.ilan-kart .resim img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s; }
.ilan-kart:hover .resim img { transform: scale(1.04); }
.etiket { position: absolute; left: 12px; top: 12px; padding: 5px 11px; border-radius: 99px; font-size: 12.5px; font-weight: 700; background: var(--kart); color: var(--orman); }
.etiket.kiralik { background: var(--pirinc); color: #fff; }
.ilan-kart .govde { padding: 16px 18px 18px; display: grid; gap: 6px; }
.ilan-kart .fiyat { font-family: var(--baslik); font-size: 30px; line-height: 1; }
.ilan-kart .fiyat small { font-family: var(--govde); font-size: 13px; color: var(--soluk); margin-left: 4px; }
.ilan-kart h3 { font-family: var(--govde); font-weight: 600; font-size: 16px; line-height: 1.35; }
.ilan-kart .yer { color: var(--soluk); font-size: 14px; }
.ozet-satir { display: flex; flex-wrap: wrap; gap: 6px 14px; padding-top: 10px; margin-top: 4px; border-top: 1px solid var(--cizgi); font-size: 13.5px; color: var(--soluk); }
.ozet-satir b { color: var(--murekkep); font-weight: 600; }
.kalp { position: absolute; right: 12px; top: 12px; z-index: 2; width: 44px; height: 44px; border: 0; border-radius: 50%; background: rgba(255, 253, 249, .94); color: #8b948f; display: grid; place-items: center; cursor: pointer; transition: transform .2s, color .2s; }
.kalp svg { width: 21px; height: 21px; }
.kalp svg path { fill: none; }
.kalp[aria-pressed="true"] { color: var(--kalp); }
.kalp[aria-pressed="true"] svg path { fill: currentColor; }
.kalp:active { transform: scale(.9); }
.iskelet { min-height: 360px; border-radius: var(--yaricap); background: linear-gradient(90deg, #e7e2d7, #f2eee6, #e7e2d7); background-size: 200% 100%; animation: parilti 1.4s infinite; }
@keyframes parilti { to { background-position: -200% 0; } }
.bos { grid-column: 1 / -1; text-align: center; padding: 56px 16px; color: var(--soluk); border: 1px dashed var(--cizgi); border-radius: var(--yaricap); }
.bos h3 { font-size: 30px; color: var(--murekkep); margin-bottom: 6px; }

/* İlan listesi ve süzgeç */
.liste-duzen { display: grid; grid-template-columns: 290px 1fr; gap: 28px; align-items: start; padding-block: clamp(28px, 4vw, 48px); }
.liste-duzen > * { min-width: 0; }
.suzgec { position: sticky; top: 84px; background: var(--kart); border: 1px solid var(--cizgi); border-radius: var(--yaricap); padding: 20px; display: grid; gap: 16px; }
.suzgec h2 { font-size: 30px; }
.suzgec label, .suzgec fieldset > legend { display: grid; gap: 6px; font-weight: 600; font-size: 13.5px; }
.suzgec fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }
.suzgec select, .suzgec input { width: 100%; min-height: 46px; border-radius: 12px; border: 1px solid rgba(23, 33, 28, .2); background: #fff; padding: 9px 12px; font: 500 15.5px var(--govde); color: var(--murekkep); }
.suzgec .ikili-anahtar { display: flex; }
.suzgec .ikili-anahtar button { flex: 1; min-height: 42px; }
.aralik { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.odalar { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.odalar button { min-height: 40px; min-width: 52px; padding: 6px 10px; border-radius: 10px; border: 1px solid rgba(23, 33, 28, .2); background: #fff; font: 600 14px var(--govde); cursor: pointer; color: var(--murekkep); }
.odalar button[aria-pressed="true"] { background: var(--orman); border-color: var(--orman); color: #fff; }
.temizle { border: 0; background: none; color: var(--soluk); text-decoration: underline; font: 500 14px var(--govde); cursor: pointer; justify-self: start; padding: 4px 0; }
.sonuc-ust { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
.sonuc-ust h1 { font-size: clamp(34px, 4vw, 52px); }
.sonuc-ust p { margin: 2px 0 0; color: var(--soluk); }
.sonuc-ust select { min-height: 44px; border-radius: 12px; border: 1px solid rgba(23, 33, 28, .2); background: #fff; padding: 8px 12px; font: 500 15px var(--govde); color: inherit; }
.suzgec-ac { display: none; }

/* İlan ayrıntısı */
.ilan { padding-block: clamp(24px, 4vw, 48px); }
.yol { font-size: 14px; color: var(--soluk); margin-bottom: 14px; }
.yol a { text-decoration: none; }
.ilan-ust { display: flex; justify-content: space-between; align-items: end; gap: 18px; flex-wrap: wrap; margin-bottom: 20px; }
.ilan-ust h1 { font-size: clamp(34px, 4.4vw, 58px); max-width: 860px; }
.ilan-ust .yer { color: var(--soluk); margin: 8px 0 0; }
.ilan-ust .fiyat { font-family: var(--baslik); font-size: clamp(36px, 4vw, 52px); line-height: 1; text-align: right; }
.ilan-ust .fiyat small { display: block; font-family: var(--govde); font-size: 14px; color: var(--soluk); }
.galeri { display: grid; grid-template-columns: 1fr 180px; gap: 10px; height: clamp(300px, 40vw, 560px); }
.galeri > * { min-width: 0; }
.ana-gorsel { position: relative; height: 100%; border-radius: var(--yaricap); overflow: hidden; background: #e2ddd2; }
.ana-gorsel img { width: 100%; height: 100%; object-fit: cover; cursor: zoom-in; }
.gezin { position: absolute; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border: 0; border-radius: 50%; background: rgba(255, 253, 249, .92); color: var(--murekkep); display: grid; place-items: center; cursor: pointer; }
.gezin svg { width: 22px; }
.gezin.onceki { left: 14px; } .gezin.sonraki { right: 14px; }
.sayac-rozet { position: absolute; right: 14px; bottom: 14px; padding: 6px 12px; border-radius: 99px; background: rgba(23, 33, 28, .78); color: #fff; font-size: 13px; font-weight: 600; }
.kucukler { display: flex; flex-direction: column; gap: 10px; height: 100%; overflow-y: auto; scrollbar-width: thin; }
.kucukler button { flex: 0 0 calc((100% - 30px) / 4); padding: 0; border: 2px solid transparent; border-radius: 12px; overflow: hidden; cursor: pointer; background: none; opacity: .7; transition: opacity .2s; }
.kucukler button[aria-current="true"] { border-color: var(--pirinc); opacity: 1; }
.kucukler img { width: 100%; height: 100%; object-fit: cover; }
.ilan-govde { display: grid; grid-template-columns: 1fr 380px; gap: clamp(20px, 4vw, 48px); margin-top: 28px; align-items: start; }
.ilan-govde > * { min-width: 0; }
.bilgiler { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.bilgiler div { background: var(--kart); border: 1px solid var(--cizgi); border-radius: 14px; padding: 14px; }
.bilgiler dt { font-size: 12.5px; color: var(--soluk); font-weight: 600; }
.bilgiler dd { margin: 2px 0 0; font-weight: 600; }
.ilan-govde h2 { font-size: 34px; margin: 32px 0 10px; }
.ilan-govde .aciklama { color: var(--soluk); font-size: 17px; }
.ozellik-liste { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; }
.ozellik-liste li { padding: 7px 13px; border-radius: 99px; background: var(--pirinc-acik); color: #6a4a17; font-weight: 600; font-size: 14px; }
.harita { width: 100%; height: 320px; border: 0; border-radius: var(--yaricap); background: #e2ddd2; }
.yan-kutu { position: sticky; top: 84px; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 22px; padding: 22px; display: grid; gap: 14px; }
.danisman { display: flex; align-items: center; gap: 14px; padding-bottom: 14px; border-bottom: 1px solid var(--cizgi); }
.danisman img { width: 58px; height: 58px; border-radius: 50%; object-fit: cover; object-position: top; }
.danisman b { display: block; }
.danisman span { color: var(--soluk); font-size: 14px; }
.yan-kutu h2 { font-size: 28px; margin: 0; }
.form { display: grid; gap: 12px; }
.form label { display: grid; gap: 6px; font-weight: 600; font-size: 14px; }
.form input, .form textarea, .form select { width: 100%; min-height: 48px; padding: 11px 13px; border-radius: 12px; border: 1px solid rgba(23, 33, 28, .22); background: #fff; color: inherit; font: 500 16px var(--govde); }
.form input:focus, .form textarea:focus { outline: none; border-color: var(--orman); box-shadow: 0 0 0 3px #dfe7e1; }
.tercih { display: flex; gap: 6px; flex-wrap: wrap; }
.tercih label { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 12px; border-radius: 99px; border: 1px solid rgba(23, 33, 28, .2); font-weight: 500; cursor: pointer; }
.tercih input { width: 16px; min-height: 16px; height: 16px; accent-color: var(--orman); }
.tercih label:has(input:checked) { border-color: var(--orman); background: #e6ede8; }
.onay { display: flex !important; gap: 10px; align-items: flex-start; font-weight: 500 !important; color: var(--soluk); font-size: 13.5px !important; }
.onay input { width: 20px; min-height: 20px !important; height: 20px; margin-top: 1px; accent-color: var(--orman); flex: none; }
.mesaj { border-radius: 12px; padding: 12px 14px; font-size: 14.5px; }
.mesaj b { display: block; }
.mesaj.hata { background: #f9e1dd; color: #812519; }
.mesaj.tamam { background: #e2ece5; color: #1d4a32; }
.mesaj.bilgi { background: #f6ecd5; color: #654713; }
dialog.isik { width: min(1200px, 96vw); max-height: 92vh; padding: 0; border: 0; border-radius: 16px; background: #0d120f; }
dialog.isik::backdrop { background: rgba(8, 12, 10, .86); }
dialog.isik img { width: 100%; max-height: 86vh; object-fit: contain; }
dialog.isik .kapat-d { position: absolute; right: 12px; top: 12px; z-index: 2; width: 44px; height: 44px; border: 0; border-radius: 50%; background: rgba(255, 255, 255, .9); cursor: pointer; display: grid; place-items: center; color: #17211c; }

/* Favoriler ve hesap */
.hesap { padding-block: clamp(32px, 5vw, 64px); }
.giris-kutu { max-width: 460px; margin: 0 auto; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 24px; padding: clamp(22px, 4vw, 34px); }
.giris-kutu h1 { font-size: 44px; margin-bottom: 6px; }
.giris-kutu > p { color: var(--soluk); margin: 0 0 20px; }
.sekme-satir { display: flex; padding: 4px; border-radius: 14px; background: #ece7dc; margin-bottom: 18px; }
.sekme-satir button { flex: 1; min-height: 44px; border: 0; border-radius: 10px; background: transparent; font: 600 15px var(--govde); cursor: pointer; color: var(--soluk); }
.sekme-satir button[aria-selected="true"] { background: var(--kart); color: var(--murekkep); }
.hesap-ust { display: flex; justify-content: space-between; align-items: end; gap: 16px; flex-wrap: wrap; margin-bottom: 26px; }
.hesap-ust h1 { font-size: clamp(38px, 5vw, 60px); }
.hesap-ust p { margin: 4px 0 0; color: var(--soluk); }
.hesap-eylem { display: flex; gap: 8px; flex-wrap: wrap; }
.tehlike { margin-top: 48px; padding: 22px; border-radius: var(--yaricap); border: 1px solid #ecc8c2; background: #fcf3f1; }
.tehlike h2 { font-size: 26px; }
.tehlike p { color: var(--soluk); margin: 6px 0 14px; }
.dugme.sil { background: #b3362b; }

.neden { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.neden div { padding: 26px; border-radius: var(--yaricap); background: var(--orman); color: #d5e0d9; }
.neden h3 { color: #fff; font-size: 28px; margin-bottom: 8px; }
.neden p { margin: 0; }
.danismanlar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.danismanlar article { display: flex; gap: 16px; align-items: center; background: var(--kart); border: 1px solid var(--cizgi); border-radius: var(--yaricap); padding: 16px; }
.danismanlar img { width: 84px; height: 84px; border-radius: 14px; object-fit: cover; object-position: top; }
.danismanlar h3 { font-size: 26px; }
.danismanlar p { margin: 2px 0 0; color: var(--soluk); font-size: 14px; }

.alt { background: var(--orman-koyu); color: #b9c8bf; padding: 56px clamp(16px, 4.5vw, 48px) 26px; margin-top: 40px; }
.alt-ic { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 28px; }
.logo-alt { font-family: var(--baslik); font-size: 30px; color: #fff; margin: 0 0 6px; }
.alt h4 { color: #fff; margin: 0 0 8px; font-size: 14px; }
.alt p { margin: 4px 0; font-size: 14px; }
.alt a { color: #e5ece8; }
.alt-not { max-width: 1280px; margin: 34px auto 0; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, .12); font-size: 13px; }
.bildirim { position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 160%); background: var(--orman); color: #fff; padding: 13px 20px; border-radius: 99px; font-weight: 600; font-size: 14.5px; z-index: 90; transition: transform .35s; max-width: calc(100vw - 32px); }
.bildirim.acik { transform: translate(-50%, 0); }
.bildirim[data-tur="hata"] { background: #812519; }

@media (max-width: 1080px) {
  .arama { grid-template-columns: 1fr 1fr; }
  .arama .ikili-anahtar { grid-column: 1 / -1; }
  .arama .dugme { grid-column: 1 / -1; }
  .ilan-govde { grid-template-columns: 1fr; }
  .yan-kutu { position: static; }
  .danismanlar { grid-template-columns: 1fr; }
}
@media (max-width: 900px) {
  .liste-duzen { grid-template-columns: 1fr; }
  .suzgec { position: static; display: none; }
  .suzgec.acik { display: grid; }
  .suzgec-ac { display: inline-flex; }
  .galeri { grid-template-columns: 1fr; height: auto; }
  .ana-gorsel { height: auto; aspect-ratio: 4 / 3; }
  .kucukler { flex-direction: row; height: 74px; overflow-x: auto; overflow-y: hidden; }
  .kucukler button { flex: 0 0 96px; }
  .bilgiler { grid-template-columns: repeat(2, 1fr); }
  .neden { grid-template-columns: 1fr; }
}
@media (max-width: 760px) {
  .menu { display: none; position: absolute; left: 12px; right: 12px; top: calc(100% + 8px); flex-direction: column; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 16px; padding: 8px; }
  .menu.acik { display: flex; }
  .menu a { padding: 13px 14px; font-size: 16px; }
  .menu-dugme { display: inline-flex; }
  .fav-baglanti { margin-left: auto; }
  .alt-ic { grid-template-columns: 1fr; }
  .ilan-ust .fiyat { text-align: left; }
  .izgara { grid-template-columns: 1fr; }
}
@media (max-width: 420px) { .fav-baglanti span { display: none; } .logo small { display: none; } .arama { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; scroll-behavior: auto !important; } }
`;

const UYGULAMA = ORTAK_JS + String.raw`
/* ── Avlu Gayrimenkul ──
 * İlanlar "ilanlar" tablosundan okunur (şablon galerisindeki canlı önizlemede yedek liste). Bilgi talepleri "talepler"
 * tablosuna yazılır (ziyaretçi ekler, okuyamaz). Favoriler "favoriler" tablosundadır: kural "sahibi", yani yayındaki sitede
 * her üye yalnız kendi kayıtlarını görür; uyeId sunucuda kendiliğinden eklenir. */
var YEDEK = ${JSON.stringify(ILANLAR)};
var DANISMANLAR = ${JSON.stringify(DANISMANLAR)};
var ODALAR = ${JSON.stringify(ODALAR)};
var SAYFA = document.body.dataset.sayfa;
var KALP = ${JSON.stringify(KALP)};
var OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
var GERI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';

var ilanSoz = null;
function ilanlar() {
  if (!ilanSoz) ilanSoz = (veriVar() ? vayra.veri.liste("ilanlar", { sinir: 500 }) : Promise.resolve(YEDEK.slice()))
    .then(function (l) { return l.filter(function (x) { return x.aktif !== false; }); })
    .catch(function (e) { ilanSoz = null; throw e; });
  return ilanSoz;
}
function gorseller(x) { var g = x.gorseller; if (typeof g === "string") { try { g = JSON.parse(g); } catch (e) { g = [g]; } } return Array.isArray(g) && g.length ? g : ["/gercek/sc/uyg-emlak.webp"]; }
function fiyatYaz(x) { return x.tur === "Kiralık" ? tl(x.fiyat) + "<small>aylık</small>" : tl(x.fiyat); }
function yer(x) { return [x.mahalle, x.ilce, x.il].filter(Boolean).join(", "); }

/* ── Üyelik ve favoriler ── */
var ben = null, favoriler = [];
function benimMi(k) { return ben && (k.uyeId ? k.uyeId === ben.id : k.uye === ben.id); }
function uyeVar() { return !!(window.vayra && window.vayra.uye); }
function ustGuncelle() {
  var d = $("#uyeDurum"), s = $("#favSayi");
  if (d) d.textContent = ben ? "Favorilerim" : "Giriş yap";
  if (s) { s.hidden = !ben || !favoriler.length; s.textContent = String(favoriler.length); }
  $$("[data-kalp]").forEach(function (b) { var f = favoriler.some(function (x) { return x.ilanId === b.dataset.kalp; }); b.setAttribute("aria-pressed", String(f)); b.setAttribute("aria-label", f ? "Favorilerden çıkar" : "Favorilere ekle"); });
}
function favorileriYukle() {
  if (!ben || !veriVar()) { favoriler = []; ustGuncelle(); return Promise.resolve([]); }
  // Yayında kural "sahibi" olduğu için yalnız bu üyenin kayıtları gelir; önizlemede site sahibi her şeyi görür, burada süzülür.
  return vayra.veri.liste("favoriler", { sinir: 500 }).then(function (l) { favoriler = l.filter(benimMi); ustGuncelle(); return favoriler; })
    .catch(function () { favoriler = []; ustGuncelle(); return []; });
}
var hazir = (uyeVar() ? vayra.uye.ben().catch(function () { return null; }) : Promise.resolve(null)).then(function (u) { ben = u; return favorileriYukle(); });
if (uyeVar()) vayra.uye.degisince(function (u) { ben = u; favorileriYukle(); });
function kalpTikla(ilan, dugme) {
  if (!uyeVar()) return bildir("Bu canlı önizlemede üyelik çalışmaz; şablonu kullanınca favoriler üyelere açılır.");
  if (!ben) { location.href = "favoriler.html?donus=" + encodeURIComponent("ilan.html?id=" + ilan.id); return; }
  var var_ = favoriler.find(function (x) { return x.ilanId === ilan.id; });
  dugme.disabled = true;
  (var_ ? vayra.veri.sil("favoriler", var_.id).then(function () { favoriler = favoriler.filter(function (x) { return x !== var_; }); bildir("Favorilerden çıkarıldı."); })
    : vayra.veri.ekle("favoriler", { ilanId: ilan.id, ilanBaslik: ilan.baslik, uye: ben.id }).then(function (k) { favoriler.push(k); olay("favori_ekle", { ilan: ilan.id }); bildir("Favorilere eklendi."); }))
    .catch(function (e) { bildir("İşlem yapılamadı: " + e.message, "hata"); })
    .finally(function () { dugme.disabled = false; ustGuncelle(); if (SAYFA === "favoriler") favoriSayfasi(); });
}
document.addEventListener("click", function (e) {
  var b = e.target.closest("[data-kalp]"); if (!b) return;
  e.preventDefault();
  ilanlar().then(function (l) { var x = l.find(function (i) { return i.id === b.dataset.kalp; }); if (x) kalpTikla(x, b); });
});

function kart(x) {
  return '<article class="ilan-kart"><button class="kalp" type="button" data-kalp="' + kacir(x.id) + '" aria-pressed="false" aria-label="Favorilere ekle">' + KALP + "</button>"
    + '<a href="ilan.html?id=' + encodeURIComponent(x.id) + '"><div class="resim"><img src="' + kacir(gorseller(x)[0]) + '" alt="' + kacir(x.baslik) + '" loading="lazy" /><span class="etiket' + (x.tur === "Kiralık" ? " kiralik" : "") + '">' + kacir(x.tur) + "</span></div>"
    + '<div class="govde"><p class="fiyat" style="margin:0">' + fiyatYaz(x) + "</p><h3>" + kacir(x.baslik) + '</h3><span class="yer">' + kacir(yer(x)) + "</span>"
    + '<div class="ozet-satir"><span><b>' + kacir(x.oda || "") + "</b> oda</span><span><b>" + kacir(x.net || x.brut || "") + "</b> m² net</span><span>" + kacir(x.tip || "") + "</span>" + (x.esyali ? "<span>Eşyalı</span>" : "") + "</div></div></a></article>";
}
function iskelet(yer, n) { yer.innerHTML = Array.from({ length: n }, function () { return '<div class="iskelet"></div>'; }).join(""); }
function hataKutusu(yer, e) { yer.innerHTML = '<div class="bos"><h3>İlanlar yüklenemedi</h3><p>' + kacir(e && e.message || "") + '</p><button class="dugme ikincil" onclick="location.reload()">Yeniden dene</button></div>'; }

/* ── Ana sayfa: arama kutusu ve öne çıkanlar ── */
if (SAYFA === "index") {
  var turSec = "Satılık";
  $$("#arama [data-tur]").forEach(function (b) { b.addEventListener("click", function () { turSec = b.dataset.tur; $$("#arama [data-tur]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); }); });
  iskelet($("#onecikan"), 3);
  ilanlar().then(function (l) {
    var iller = Array.from(new Set(l.map(function (x) { return x.il; }))).sort(function (a, b) { return a.localeCompare(b, "tr"); });
    $("#aIl").innerHTML = '<option value="">Bütün iller</option>' + iller.map(function (i) { return "<option>" + kacir(i) + "</option>"; }).join("");
    var o = l.filter(function (x) { return x.onecikan; }).concat(l.filter(function (x) { return !x.onecikan; })).slice(0, 3);
    $("#onecikan").innerHTML = o.map(kart).join(""); hazir.then(ustGuncelle);
  }).catch(function (e) { hataKutusu($("#onecikan"), e); });
  $("#arama").addEventListener("submit", function (e) {
    e.preventDefault(); var q = new URLSearchParams({ tur: turSec });
    if ($("#aIl").value) q.set("il", $("#aIl").value); if ($("#aOda").value) q.set("oda", $("#aOda").value); if ($("#aButce").value) q.set("max", $("#aButce").value);
    location.href = "ilanlar.html?" + q.toString();
  });
}

/* ── İlan listesi: süzgeçler adres çubuğunda tutulur (paylaşılabilir arama) ── */
if (SAYFA === "ilanlar") {
  var q = new URLSearchParams(location.search), hepsi = [];
  var s = { tur: q.get("tur") || "", il: q.get("il") || "", ilce: q.get("ilce") || "", min: q.get("min") || "", max: q.get("max") || "", oda: (q.get("oda") || "").split(",").filter(Boolean), sirala: q.get("sirala") || "yeni" };
  var izgara = $("#izgara");
  function secenek(sel, l, bos, deger) { sel.innerHTML = '<option value="">' + bos + "</option>" + l.map(function (x) { return '<option' + (x === deger ? " selected" : "") + ">" + kacir(x) + "</option>"; }).join(""); }
  function formuDoldur() {
    $$("#suzgec [data-tur]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.tur === s.tur)); });
    secenek($("#il"), Array.from(new Set(hepsi.map(function (x) { return x.il; }))).sort(function (a, b) { return a.localeCompare(b, "tr"); }), "Bütün iller", s.il);
    var ilceler = Array.from(new Set(hepsi.filter(function (x) { return !s.il || x.il === s.il; }).map(function (x) { return x.ilce; }))).sort(function (a, b) { return a.localeCompare(b, "tr"); });
    if (s.ilce && ilceler.indexOf(s.ilce) < 0) s.ilce = "";
    secenek($("#ilce"), ilceler, s.il ? "Bütün ilçeler" : "Önce il seç", s.ilce); $("#ilce").disabled = !s.il;
    $("#min").value = s.min; $("#max").value = s.max; $("#sirala").value = s.sirala;
    $$("#odalar button").forEach(function (b) { b.setAttribute("aria-pressed", String(s.oda.indexOf(b.dataset.oda) >= 0)); });
    $("#fiyatEtiket").textContent = s.tur === "Kiralık" ? "Aylık kira (TL)" : s.tur === "Satılık" ? "Fiyat (TL)" : "Fiyat ya da aylık kira (TL)";
  }
  function uygula() {
    var l = hepsi.filter(function (x) {
      return (!s.tur || x.tur === s.tur) && (!s.il || x.il === s.il) && (!s.ilce || x.ilce === s.ilce) && (!s.min || x.fiyat >= Number(s.min)) && (!s.max || x.fiyat <= Number(s.max)) && (!s.oda.length || s.oda.indexOf(x.oda) >= 0);
    });
    if (s.sirala === "artan") l.sort(function (a, b) { return a.fiyat - b.fiyat; });
    else if (s.sirala === "azalan") l.sort(function (a, b) { return b.fiyat - a.fiyat; });
    else if (s.sirala === "buyuk") l.sort(function (a, b) { return (b.net || 0) - (a.net || 0); });
    else l.sort(function (a, b) { return String(b.ilanTarihi || "").localeCompare(String(a.ilanTarihi || "")); });
    $("#baslik").textContent = s.tur ? s.tur + " ilanlar" : "Bütün ilanlar";
    $("#sayi").textContent = l.length + " ilan" + (s.il ? ", " + s.il + (s.ilce ? " / " + s.ilce : "") : "");
    izgara.innerHTML = l.length ? l.map(kart).join("") : '<div class="bos"><h3>Bu ölçütlere uyan ilan yok</h3><p>Fiyat aralığını genişletmeyi ya da oda sayısını değiştirmeyi dene. Aradığın evi danışmanlarımıza da yazabilirsin.</p><button class="dugme ikincil" type="button" id="bosTemizle">Süzgeçleri temizle</button></div>';
    var bt = $("#bosTemizle"); if (bt) bt.addEventListener("click", temizle);
    var p = new URLSearchParams(); ["tur", "il", "ilce", "min", "max"].forEach(function (k) { if (s[k]) p.set(k, s[k]); }); if (s.oda.length) p.set("oda", s.oda.join(",")); if (s.sirala !== "yeni") p.set("sirala", s.sirala);
    history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p.toString() : ""));
    hazir.then(ustGuncelle);
  }
  function temizle() { s = { tur: "", il: "", ilce: "", min: "", max: "", oda: [], sirala: s.sirala }; formuDoldur(); uygula(); }
  $$("#suzgec [data-tur]").forEach(function (b) { b.addEventListener("click", function () { s.tur = s.tur === b.dataset.tur ? "" : b.dataset.tur; formuDoldur(); uygula(); }); });
  $("#il").addEventListener("change", function () { s.il = this.value; s.ilce = ""; formuDoldur(); uygula(); });
  $("#ilce").addEventListener("change", function () { s.ilce = this.value; uygula(); });
  ["min", "max"].forEach(function (k) { $("#" + k).addEventListener("change", function () { s[k] = this.value.replace(/\D/g, ""); uygula(); }); });
  $("#sirala").addEventListener("change", function () { s.sirala = this.value; uygula(); });
  $$("#odalar button").forEach(function (b) { b.addEventListener("click", function () { var o = b.dataset.oda, i = s.oda.indexOf(o); if (i >= 0) s.oda.splice(i, 1); else s.oda.push(o); formuDoldur(); uygula(); }); });
  $("#temizle").addEventListener("click", temizle);
  $("#suzgecAc").addEventListener("click", function () { var p = $("#suzgec"), a = !p.classList.contains("acik"); p.classList.toggle("acik", a); this.setAttribute("aria-expanded", String(a)); });
  iskelet(izgara, 6);
  ilanlar().then(function (l) { hepsi = l; formuDoldur(); uygula(); }).catch(function (e) { hataKutusu(izgara, e); });
}

/* ── İlan ayrıntısı: galeri, bilgiler, harita, Bilgi iste formu ── */
if (SAYFA === "ilan") {
  var id = new URLSearchParams(location.search).get("id"), yerI = $("#ilan");
  ilanlar().then(function (l) {
    var x = l.find(function (i) { return i.id === id; });
    if (!x) { yerI.innerHTML = '<div class="bos"><h3>İlan bulunamadı</h3><p>Yayından kalkmış olabilir.</p><a class="dugme" href="ilanlar.html">Bütün ilanlar</a></div>'; return; }
    document.title = x.baslik + " · Avlu Gayrimenkul";
    var g = gorseller(x), i = 0, d = DANISMANLAR[x.danisman] || null, oz = x.ozellikler;
    if (typeof oz === "string") { try { oz = JSON.parse(oz); } catch (e) { oz = oz.split(","); } }
    var bilgi = [["Oda", x.oda], ["Net alan", x.net ? x.net + " m²" : ""], ["Brüt alan", x.brut ? x.brut + " m²" : ""], ["Kat", x.kat], ["Bina yaşı", x.binaYasi != null ? x.binaYasi + " yıl" : ""], ["Isınma", x.isitma], ["Eşyalı", x.esyali ? "Evet" : "Hayır"], ["Aidat", x.aidat ? tl(x.aidat) : "Yok"]].filter(function (b) { return b[1]; });
    yerI.innerHTML = '<p class="yol"><a href="ilanlar.html">İlanlar</a> / <a href="ilanlar.html?tur=' + encodeURIComponent(x.tur) + '">' + kacir(x.tur) + "</a> / " + kacir(x.il) + "</p>"
      + '<div class="ilan-ust"><div><h1>' + kacir(x.baslik) + '</h1><p class="yer">' + kacir(yer(x)) + " · " + kacir(x.tip || "") + '</p></div><div><p class="fiyat" style="margin:0">' + fiyatYaz(x) + "</p></div></div>"
      + '<div class="galeri"><div class="ana-gorsel"><img id="anaGorsel" alt="" /><button class="gezin onceki" type="button" aria-label="Önceki fotoğraf">' + GERI + '</button><button class="gezin sonraki" type="button" aria-label="Sonraki fotoğraf">' + OK + '</button><span class="sayac-rozet" id="gSayac"></span><button class="kalp" type="button" data-kalp="' + kacir(x.id) + '" aria-pressed="false" aria-label="Favorilere ekle">' + KALP + "</button></div>"
      + '<div class="kucukler" role="group" aria-label="Fotoğraflar">' + g.map(function (s2, n) { return '<button type="button" data-n="' + n + '" aria-label="' + (n + 1) + '. fotoğraf"><img src="' + kacir(s2) + '" alt="" loading="lazy" /></button>'; }).join("") + "</div></div>"
      + '<div class="ilan-govde"><div><dl class="bilgiler">' + bilgi.map(function (b) { return "<div><dt>" + b[0] + "</dt><dd>" + kacir(b[1]) + "</dd></div>"; }).join("") + "</dl>"
      + "<h2>Açıklama</h2><p class=\"aciklama\">" + kacir(x.aciklama || "") + "</p>"
      + (Array.isArray(oz) && oz.length ? '<h2>Öne çıkanlar</h2><ul class="ozellik-liste">' + oz.map(function (o) { return "<li>" + kacir(o) + "</li>"; }).join("") + "</ul>" : "")
      + (x.enlem && x.boylam ? '<h2>Konum</h2><iframe class="harita" title="İlanın yaklaşık konumu" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=' + (x.boylam - .012) + "%2C" + (x.enlem - .008) + "%2C" + (x.boylam + .012) + "%2C" + (x.enlem + .008) + "&amp;layer=mapnik&amp;marker=" + x.enlem + "%2C" + x.boylam + '"></iframe><p class="ipucu" style="color:var(--soluk);font-size:13.5px">Harita yaklaşık konumu gösterir; açık adres görüntüleme randevusunda paylaşılır.</p>' : "")
      + '</div><aside class="yan-kutu" aria-labelledby="talepBaslik">'
      + (d ? '<div class="danisman"><img src="' + kacir(d.foto) + '" alt="" /><div><b>' + kacir(x.danisman) + "</b><span>İlan danışmanı · " + kacir(d.tel) + "</span></div></div>" : "")
      + '<h2 id="talepBaslik">Bilgi iste</h2><form class="form" id="talep" novalidate>'
      + '<label>Ad soyad<input name="ad" required autocomplete="name" minlength="3" /></label>'
      + '<label>Telefon<input name="telefon" type="tel" required autocomplete="tel" inputmode="tel" placeholder="05xx xxx xx xx" /></label>'
      + '<label>E-posta (isteğe bağlı)<input name="eposta" type="email" autocomplete="email" /></label>'
      + '<label>Mesaj<textarea name="mesaj" rows="4">Merhaba, ' + kacir(x.baslik) + " ilanıyla ilgileniyorum. Görüntüleme için uygun zamanları öğrenebilir miyim?</textarea></label>"
      + '<div class="tercih" role="radiogroup" aria-label="Sana nasıl ulaşalım?"><label><input type="radio" name="tercih" value="Telefon" checked />Telefon</label><label><input type="radio" name="tercih" value="WhatsApp" />WhatsApp</label><label><input type="radio" name="tercih" value="E-posta" />E-posta</label></div>'
      + '<label class="onay"><input type="checkbox" name="kvkk" required /> <span>Bilgilerimin bu ilanla ilgili benimle iletişime geçilmesi için kullanılmasını kabul ediyorum.</span></label>'
      + '<div id="talepMesaj" class="mesaj" role="status" aria-live="polite" hidden></div><button class="dugme tam" type="submit" id="talepGonder">Bilgi iste</button></form></aside></div>'
      + '<dialog class="isik" id="isik" aria-label="Fotoğraf"><button class="kapat-d" type="button" id="isikKapat" aria-label="Kapat"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:20px;margin:auto"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button><img id="isikGorsel" alt="" /></dialog>';
    function goster(n) {
      i = (n + g.length) % g.length;
      $("#anaGorsel").src = g[i]; $("#anaGorsel").alt = x.baslik + ", " + (i + 1) + ". fotoğraf"; $("#gSayac").textContent = (i + 1) + " / " + g.length;
      $$(".kucukler button").forEach(function (b) { b.setAttribute("aria-current", String(Number(b.dataset.n) === i)); });
      var ig = $("#isikGorsel"); if (ig) ig.src = g[i];
    }
    goster(0);
    $(".gezin.onceki").addEventListener("click", function () { goster(i - 1); });
    $(".gezin.sonraki").addEventListener("click", function () { goster(i + 1); });
    $$(".kucukler button").forEach(function (b) { b.addEventListener("click", function () { goster(Number(b.dataset.n)); }); });
    $("#anaGorsel").addEventListener("click", function () { $("#isik").showModal(); });
    $("#isikKapat").addEventListener("click", function () { $("#isik").close(); });
    document.addEventListener("keydown", function (e) { if (e.target.closest && e.target.closest("form")) return; if (e.key === "ArrowLeft") goster(i - 1); if (e.key === "ArrowRight") goster(i + 1); });
    hazir.then(ustGuncelle);
    var form = $("#talep"), m = $("#talepMesaj");
    function mesaj(tur, b, t) { m.hidden = false; m.className = "mesaj " + tur; m.innerHTML = "<b>" + kacir(b) + "</b>" + kacir(t || ""); }
    form.addEventListener("submit", function (e) {
      e.preventDefault(); m.hidden = true;
      if (!form.reportValidity()) return;
      var f = new FormData(form), k = { ilanId: x.id, ilanBaslik: x.baslik, ad: String(f.get("ad")).trim(), telefon: String(f.get("telefon")).trim(), eposta: String(f.get("eposta") || "").trim() || null, mesaj: String(f.get("mesaj") || "").trim(), tercih: f.get("tercih"), kvkk: true };
      if (!/^[0-9 +()]{10,17}$/.test(k.telefon)) return mesaj("hata", "Telefon numarası geçersiz.", "Örneğin 0532 123 45 67 biçiminde yaz.");
      if (!veriVar()) return mesaj("bilgi", "Bu canlı önizlemede talep kaydedilmez.", "Şablonu kullanınca talepler veritabanındaki talepler tablosuna düşer.");
      var b = $("#talepGonder"); b.disabled = true; b.textContent = "Gönderiliyor…";
      vayra.veri.ekle("talepler", k).then(function () { olay("bilgi_talebi", { ilan: x.id, tercih: k.tercih }); form.reset(); mesaj("tamam", "Talebin danışmanımıza ulaştı.", (x.danisman || "Danışmanımız") + " iş saatleri içinde " + (k.tercih === "E-posta" ? "e-postayla" : k.tercih === "WhatsApp" ? "WhatsApp'tan" : "telefonla") + " sana dönecek."); })
        .catch(function (err) { mesaj("hata", "Talep gönderilemedi.", err.message + ". Yeniden dene ya da 0216 385 10 20 numarasını ara."); })
        .finally(function () { b.disabled = false; b.textContent = "Bilgi iste"; });
    });
  }).catch(function (e) { hataKutusu(yerI, e); });
}

/* ── Favoriler ve hesap: giriş, kayıt, favori listesi, çıkış, hesabı silme ── */
function favoriSayfasi() {
  var yerF = $("#hesap");
  if (!uyeVar()) { yerF.innerHTML = '<div class="giris-kutu"><h1>Favorilerim</h1><p>Bu canlı önizlemede üyelik çalışmaz. Şablonu kullanınca ziyaretçiler hesap açıp ilanları favorilerine ekleyebilir.</p><a class="dugme" href="ilanlar.html">İlanlara göz at</a></div>'; return; }
  var donus = new URLSearchParams(location.search).get("donus");
  if (donus && !/^[a-z0-9-]+\.html(\?[\w=&%.-]*)?$/i.test(donus)) donus = null;
  if (!ben) {
    yerF.innerHTML = '<div class="giris-kutu"><h1>Hoş geldin</h1><p>' + (donus ? "Favorilere eklemek için giriş yap ya da hesap aç." : "Beğendiğin ilanları kaydetmek ve fiyat değişince haberdar olmak için giriş yap.") + "</p>"
      + '<div class="sekme-satir" role="tablist"><button type="button" role="tab" aria-selected="true" data-mod="giris">Giriş yap</button><button type="button" role="tab" aria-selected="false" data-mod="kayit">Hesap aç</button></div>'
      + '<form class="form" id="uyeForm" novalidate><label id="adAlan" hidden>Ad soyad<input name="ad" autocomplete="name" /></label><label>E-posta<input name="eposta" type="email" required autocomplete="email" inputmode="email" /></label><label>Şifre<input name="sifre" type="password" required minlength="8" autocomplete="current-password" /></label><div id="uyeMesaj" class="mesaj hata" role="alert" hidden></div><button class="dugme tam" type="submit" id="uyeGonder">Giriş yap</button></form></div>';
    var mod = "giris";
    $$("[data-mod]").forEach(function (b) { b.addEventListener("click", function () {
      mod = b.dataset.mod; $$("[data-mod]").forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); });
      $("#adAlan").hidden = mod !== "kayit"; $("#adAlan input").required = mod === "kayit"; $("#uyeGonder").textContent = mod === "kayit" ? "Hesap aç" : "Giriş yap";
      $("#uyeForm [name=sifre]").setAttribute("autocomplete", mod === "kayit" ? "new-password" : "current-password");
    }); });
    $("#uyeForm").addEventListener("submit", function (e) {
      e.preventDefault(); var f = e.target, m = $("#uyeMesaj"); m.hidden = true;
      if (!f.reportValidity()) return;
      var v = new FormData(f), b = $("#uyeGonder"); b.disabled = true;
      var is = mod === "kayit" ? vayra.uye.kayit(String(v.get("eposta")).trim(), String(v.get("sifre")), String(v.get("ad")).trim()) : vayra.uye.giris(String(v.get("eposta")).trim(), String(v.get("sifre")));
      is.then(function (u) { ben = u; olay(mod === "kayit" ? "kayit_ol" : "giris_yap"); return favorileriYukle(); })
        .then(function () { if (donus) location.href = donus; else favoriSayfasi(); })
        .catch(function (err) { m.hidden = false; m.textContent = err.message; b.disabled = false; });
    });
    return;
  }
  ilanlar().then(function (l) {
    var fl = favoriler.map(function (f) { return l.find(function (x) { return x.id === f.ilanId; }); }).filter(Boolean);
    yerF.innerHTML = '<div class="hesap-ust"><div><h1>Favorilerim</h1><p>' + kacir(ben.ad || ben.eposta) + ", " + fl.length + " kayıtlı ilan</p></div><div class=\"hesap-eylem\"><a class=\"dugme ikincil\" href=\"ilanlar.html\">İlanlara dön</a><button class=\"dugme ikincil\" type=\"button\" id=\"cikis\">Çıkış yap</button></div></div>"
      + '<div class="izgara">' + (fl.length ? fl.map(kart).join("") : '<div class="bos"><h3>Henüz favorin yok</h3><p>İlanlardaki kalbe dokunarak kaydet; hepsi burada toplanır.</p><a class="dugme" href="ilanlar.html">İlanlara göz at</a></div>') + "</div>"
      + '<section class="tehlike" aria-labelledby="silBaslik"><h2 id="silBaslik">Hesabımı sil</h2><p>Hesabın ve bütün favorilerin kalıcı olarak silinir. Bu işlem geri alınamaz.</p><button class="dugme sil" type="button" id="hesapSil">Hesabımı sil</button></section>';
    ustGuncelle();
    $("#cikis").addEventListener("click", function () { vayra.uye.cikis().then(function () { ben = null; favoriler = []; ustGuncelle(); favoriSayfasi(); }); });
    $("#hesapSil").addEventListener("click", function () {
      if (!confirm("Hesabın ve bütün favorilerin kalıcı olarak silinecek. Emin misin?")) return;
      vayra.uye.hesabiSil().then(function () { ben = null; favoriler = []; ustGuncelle(); bildir("Hesabın silindi."); favoriSayfasi(); }).catch(function (e) { bildir("Silinemedi: " + e.message, "hata"); });
    });
  });
}
if (SAYFA === "favoriler") { $("#hesap").innerHTML = '<div class="iskelet" style="max-width:460px;margin:0 auto"></div>'; hazir.then(favoriSayfasi); }
`;

export const EMLAK_ILANLARI = {
  id: "emlak-ilanlari",
  ad: "Avlu · Emlak İlanları",
  tur: "site" as const,
  aciklama: "Emlak ilan sitesi: il, ilçe, fiyat, oda ve satılık ya da kiralık süzgeci, galerili ilan sayfası, bilgi talebi ve üye favorileri",
  kapak: "/gercek/build/sablon/emlak-ilanlari.webp",
  tablolar: TABLOLAR,
  dosyalar: {
    "index.html": sayfa("index.html", "Avlu Gayrimenkul · Satılık ve kiralık evler", "İstanbul, İzmir, Bodrum ve Ankara'da satılık ve kiralık daire, rezidans ve villalar. Danışmanlarımızla görüntüleme randevusu al.", `<section class="kahraman">
  <img src="/gercek/sc/uyg-emlak.webp" alt="Gün batımında havuzlu modern villa" fetchpriority="high" />
  <div class="ic kapsayici">
    <h1>Doğru ev, <em>doğru</em> mahallede.</h1>
    <p>On beş yıldır İstanbul, İzmir, Bodrum ve Ankara'da ev arayanla evini emanet edeni buluşturuyoruz. Her ilanı yerinde gördük.</p>
    <form class="arama" id="arama" role="search">
      <div class="ikili-anahtar" role="group" aria-label="İlan türü"><button type="button" data-tur="Satılık" aria-pressed="true">Satılık</button><button type="button" data-tur="Kiralık" aria-pressed="false">Kiralık</button></div>
      <label>İl<select id="aIl"><option value="">Bütün iller</option></select></label>
      <label>Oda<select id="aOda"><option value="">Fark etmez</option>${ODALAR.map((o) => `<option>${o}</option>`).join("")}</select></label>
      <label>En çok bütçe<select id="aButce"><option value="">Sınır yok</option><option value="40000">Aylık 40.000 TL</option><option value="90000">Aylık 90.000 TL</option><option value="12000000">12 milyon TL</option><option value="20000000">20 milyon TL</option><option value="40000000">40 milyon TL</option></select></label>
      <button class="dugme pirinc" type="submit">İlanları göster</button>
    </form>
  </div>
</section>
<section class="kapsayici bolum">
  <div class="bolum-ust"><div><h2>Yeni ve öne çıkan ilanlar</h2><p>Bu ay portföyümüze giren, danışmanlarımızın yerinde incelediği evler.</p></div><a class="dugme ikincil" href="ilanlar.html">Bütün ilanlar</a></div>
  <div class="izgara" id="onecikan" aria-live="polite"></div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="neden">
    <div><h3>Yerinde görülmüş ilan</h3><p>Her evi fotoğraflamadan önce gezdik; tapu, iskân ve aidat bilgisini mal sahibinden belgeyle aldık.</p></div>
    <div><h3>Tek danışman, baştan sona</h3><p>İlk görüşmeden tapu gününe kadar aynı danışmanla ilerlersin; kredi ve ekspertiz sürecinde de yanındayız.</p></div>
    <div><h3>Şeffaf hizmet bedeli</h3><p>Satışta yüzde 2, kiralamada bir aylık kira. Sözleşmeden önce yazılı olarak paylaşırız.</p></div>
  </div>
</section>
<section class="kapsayici bolum" id="danismanlar" style="padding-top:0">
  <div class="bolum-ust"><div><h2>Danışmanlarımız</h2><p>Bölgesini bilen, telefonu açan insanlar.</p></div></div>
  <div class="danismanlar">
${Object.entries(DANISMANLAR).map(([ad, d], i) => `    <article><img src="${d.foto}" alt="${ad}" loading="lazy" /><div><h3>${ad}</h3><p>${["Bodrum ve İstanbul Avrupa yakası", "İzmir ve Kadıköy", "Ataşehir, Şişli ve Ankara"][i]}</p><p><a href="tel:+9${d.tel.replace(/\s/g, "")}">${d.tel}</a></p></div></article>`).join("\n")}
  </div>
</section>`),
    "ilanlar.html": sayfa("ilanlar.html", "İlanlar · Avlu Gayrimenkul", "Satılık ve kiralık ilanları il, ilçe, fiyat aralığı ve oda sayısına göre süz.", `<div class="kapsayici liste-duzen">
  <aside class="suzgec" id="suzgec" aria-label="İlan süzgeçleri">
    <h2>Süzgeçler</h2>
    <fieldset><legend>İlan türü</legend><div class="ikili-anahtar"><button type="button" data-tur="Satılık" aria-pressed="false">Satılık</button><button type="button" data-tur="Kiralık" aria-pressed="false">Kiralık</button></div></fieldset>
    <label>İl<select id="il"></select></label>
    <label>İlçe<select id="ilce"></select></label>
    <fieldset><legend id="fiyatEtiket">Fiyat (TL)</legend><div class="aralik"><input id="min" inputmode="numeric" placeholder="En az" aria-label="En düşük fiyat" /><input id="max" inputmode="numeric" placeholder="En çok" aria-label="En yüksek fiyat" /></div></fieldset>
    <fieldset><legend>Oda sayısı</legend><div class="odalar" id="odalar">${ODALAR.map((o) => `<button type="button" data-oda="${o}" aria-pressed="false">${o}</button>`).join("")}</div></fieldset>
    <button class="temizle" type="button" id="temizle">Süzgeçleri temizle</button>
  </aside>
  <section>
    <div class="sonuc-ust"><div><h1 id="baslik">İlanlar</h1><p id="sayi" aria-live="polite"></p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="dugme ikincil suzgec-ac" type="button" id="suzgecAc" aria-expanded="false" aria-controls="suzgec">Süzgeçler</button>
      <label><span class="atla">Sırala</span><select id="sirala"><option value="yeni">En yeni</option><option value="artan">Fiyat: düşükten yükseğe</option><option value="azalan">Fiyat: yüksekten düşüğe</option><option value="buyuk">En geniş</option></select></label></div></div>
    <div class="izgara" id="izgara"></div>
  </section>
</div>`),
    "ilan.html": sayfa("ilan.html", "İlan · Avlu Gayrimenkul", "Avlu Gayrimenkul ilan ayrıntısı.", `<div class="kapsayici ilan" id="ilan"><div class="iskelet"></div></div>`),
    "favoriler.html": sayfa("favoriler.html", "Favorilerim · Avlu Gayrimenkul", "Kaydettiğin ilanlar ve hesabın.", `<div class="kapsayici hesap" id="hesap"></div>`),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#1f3a2e"/><path d="M14 50V28l18-12 18 12v22" fill="none" stroke="#f2efe8" stroke-width="4"/><path d="M25 50V38h14v12" fill="none" stroke="#b08544" stroke-width="4"/></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
  },
};
