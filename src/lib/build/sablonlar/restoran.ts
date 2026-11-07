/* Şablon: Kekik Lokanta — Urla'da Ege mutfağı. Menü "menu" tablosundan (kategori sekmeleri, alerjen etiketleri ve süzgeci),
 * masa rezervasyonu "rezervasyonlar" tablosuna (ziyaretçi ekler, okuyamaz), telefon için sade QR menü sayfası ve masa QR kodu,
 * çalışma saatleri ve İstanbul saatine göre "şu an açık mı" göstergesi. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";

const KATEGORILER = ["Mezeler", "Ara sıcaklar", "Ana yemekler", "Tatlılar", "İçecekler"];
const ALERJENLER = ["gluten", "süt", "yumurta", "kuruyemiş", "yer fıstığı", "balık", "kabuklu deniz ürünü", "yumuşakça", "susam", "soya", "hardal", "kereviz", "sülfit", "acı bakla"];

const MENU = [
  { id: "m-patlican", ad: "Köz patlıcan", kategori: "Mezeler", fiyat: 260, aciklama: "Közde pişmiş patlıcan, sarımsaklı süzme yoğurt, ceviz", alerjenler: "süt, kuruyemiş", vejetaryen: true },
  { id: "m-borulce", ad: "Deniz börülcesi", kategori: "Mezeler", fiyat: 240, aciklama: "Haşlanıp ayıklanmış, zeytinyağı, limon ve sarımsakla", alerjenler: "", vejetaryen: true, vegan: true },
  { id: "m-girit", ad: "Girit ezmesi", kategori: "Mezeler", fiyat: 280, aciklama: "Beyaz peynir, lor, Antep fıstığı, dereotu ve sızma zeytinyağı", alerjenler: "süt, kuruyemiş", vejetaryen: true },
  { id: "m-enginar", ad: "Zeytinyağlı enginar", kategori: "Mezeler", fiyat: 320, aciklama: "Bakla içi, taze soğan, dereotu ve portakal suyuyla", alerjenler: "", vejetaryen: true, vegan: true, onerilen: true },
  { id: "m-humus", ad: "Sıcak humus", kategori: "Mezeler", fiyat: 230, aciklama: "Tahinli nohut ezmesi, kızgın tereyağı yerine pul biberli zeytinyağı", alerjenler: "susam", vejetaryen: true, vegan: true },
  { id: "m-levrek", ad: "Levrek marin", kategori: "Mezeler", fiyat: 380, aciklama: "İnce dilim çiğ levrek, narenciye, kapari ve kırmızı soğan", alerjenler: "balık", onerilen: true },
  { id: "m-atom", ad: "Atom", kategori: "Mezeler", fiyat: 210, aciklama: "Süzme yoğurt, kuru biber ve tereyağı; acılı sever için", alerjenler: "süt", vejetaryen: true, acili: true },
  { id: "a-kalamar", ad: "Kalamar tava", kategori: "Ara sıcaklar", fiyat: 460, aciklama: "Çıtır kalamar halkaları, cevizli tarator sos", alerjenler: "yumuşakça, gluten, kuruyemiş, yumurta" },
  { id: "a-kabak", ad: "Kabak çiçeği dolması", kategori: "Ara sıcaklar", fiyat: 340, aciklama: "Pirinç, nane ve kuş üzümüyle doldurulmuş, zeytinyağlı", alerjenler: "", vejetaryen: true, vegan: true },
  { id: "a-otlar", ad: "Yumurtalı Ege otları", kategori: "Ara sıcaklar", fiyat: 380, aciklama: "Radika, şevketibostan ve ısırgan, köy yumurtasıyla", alerjenler: "yumurta", vejetaryen: true },
  { id: "a-karides", ad: "Karides güveç", kategori: "Ara sıcaklar", fiyat: 540, aciklama: "Domates, sivri biber ve kaşarla güveçte", alerjenler: "kabuklu deniz ürünü, süt" },
  { id: "y-kofte", ad: "İzmir köfte", kategori: "Ana yemekler", fiyat: 620, aciklama: "Fırında patates ve biberle, domates soslu; babaannemizin tarifi", alerjenler: "gluten, yumurta", onerilen: true },
  { id: "y-incik", ad: "Kuzu incik", kategori: "Ana yemekler", fiyat: 980, aciklama: "Altı saat ağır ateşte, közlenmiş patlıcan beğendi üzerinde", alerjenler: "süt, gluten" },
  { id: "y-cipura", ad: "Çipura ızgara", kategori: "Ana yemekler", fiyat: 720, aciklama: "Günlük çipura, roka, kırmızı soğan ve limon", alerjenler: "balık" },
  { id: "y-tavuk", ad: "Kekikli tavuk şiş", kategori: "Ana yemekler", fiyat: 540, aciklama: "Yoğurtlu marine, bulgur pilavı ve köz biber", alerjenler: "süt, gluten" },
  { id: "y-guvec", ad: "Sebzeli toprak güveç", kategori: "Ana yemekler", fiyat: 480, aciklama: "Mevsim sebzeleri, nohut ve kekik, fırında", alerjenler: "", vejetaryen: true, vegan: true, acili: true },
  { id: "t-lor", ad: "Urla lor tatlısı", kategori: "Tatlılar", fiyat: 260, aciklama: "Taze lordan, hafif şerbetli", alerjenler: "süt, gluten, yumurta", vejetaryen: true, onerilen: true },
  { id: "t-sakiz", ad: "Sakızlı muhallebi", kategori: "Tatlılar", fiyat: 240, aciklama: "Damla sakızı ve gül suyu", alerjenler: "süt", vejetaryen: true },
  { id: "t-incir", ad: "İncir uyutması", kategori: "Tatlılar", fiyat: 250, aciklama: "Kuru incir, süt ve ceviz; şekersiz", alerjenler: "süt, kuruyemiş", vejetaryen: true },
  { id: "i-limonata", ad: "Ev yapımı limonata", kategori: "İçecekler", fiyat: 140, aciklama: "Taze sıkım, naneli", alerjenler: "", vejetaryen: true, vegan: true },
  { id: "i-ayran", ad: "Yayık ayranı", kategori: "İçecekler", fiyat: 90, aciklama: "Bakır tasta", alerjenler: "süt", vejetaryen: true },
  { id: "i-sarap", ad: "Urla bağlarından şarap, kadeh", kategori: "İçecekler", fiyat: 380, aciklama: "Haftanın beyaz ya da kırmızısı; garsonumuza sor", alerjenler: "sülfit", vejetaryen: true, vegan: true },
  { id: "i-kahve", ad: "Türk kahvesi", kategori: "İçecekler", fiyat: 120, aciklama: "Közde, lokumla", alerjenler: "", vejetaryen: true, vegan: true },
].map((m, i) => ({ vejetaryen: false, vegan: false, acili: false, onerilen: false, aktif: true, sira: i + 1, ...m }));

/** Haftanın günü (0 pazar) → [açılış, kapanış]; kapanış gece yarısını geçebilir. null: kapalı. */
const SAATLER: Record<number, [string, string] | null> = { 0: ["11:00", "22:00"], 1: null, 2: ["12:00", "23:00"], 3: ["12:00", "23:00"], 4: ["12:00", "23:00"], 5: ["12:00", "00:30"], 6: ["11:00", "00:30"] };
const GUN_AD = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

const TABLOLAR: Record<string, SablonTablo> = {
  menu: {
    aciklama: "Menüdeki yemek ve içecekler. Sayfalar ve QR menü bu tablodan okur; aktif olmayan ürün gösterilmez.",
    kurallar: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" },
    sema: [
      { ad: "ad", tur: "metin", zorunlu: true },
      { ad: "kategori", tur: "secim", zorunlu: true, secenekler: KATEGORILER },
      { ad: "fiyat", tur: "sayi", zorunlu: true, aciklama: "TL" },
      { ad: "aciklama", tur: "uzunMetin" },
      { ad: "alerjenler", tur: "metin", aciklama: "Virgülle: " + ALERJENLER.join(", ") },
      { ad: "vejetaryen", tur: "mantiksal", varsayilan: false },
      { ad: "vegan", tur: "mantiksal", varsayilan: false },
      { ad: "acili", tur: "mantiksal", varsayilan: false },
      { ad: "onerilen", tur: "mantiksal", varsayilan: false, aciklama: "Şefin önerisi; ana sayfada görünür" },
      { ad: "aktif", tur: "mantiksal", varsayilan: true },
      { ad: "sira", tur: "sayi" },
    ],
    kayitlar: MENU,
  },
  rezervasyonlar: {
    aciklama: "Siteden gelen masa rezervasyonları. Ziyaretçi ekleyebilir ama okuyamaz.",
    kurallar: { okuma: "kapali", ekleme: "herkes", duzenleme: "kapali" },
    sema: [
      { ad: "ad", tur: "metin", zorunlu: true },
      { ad: "telefon", tur: "metin", zorunlu: true },
      { ad: "tarih", tur: "metin", zorunlu: true, aciklama: "YYYY-AA-GG" },
      { ad: "saat", tur: "metin", zorunlu: true },
      { ad: "kisi", tur: "sayi", zorunlu: true },
      { ad: "alan", tur: "secim", secenekler: ["İç salon", "Bahçe", "Fark etmez"], varsayilan: "Fark etmez" },
      { ad: "not", tur: "uzunMetin" },
      { ad: "kvkk", tur: "mantiksal", zorunlu: true },
      { ad: "durum", tur: "secim", secenekler: ["Bekliyor", "Onaylandı", "Geldi", "İptal"], varsayilan: "Bekliyor" },
    ],
    kayitlar: [],
  },
};

const ust = (aktif: string) => `<a class="atla" href="#icerik">İçeriğe geç</a>
<header class="ust">
  <a class="logo" href="index.html"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 29V12M16 18c-5 0-8-3-9-8 5 0 8 2 9 6M16 15c4 0 7-2.5 8-7-4 0-7 2-8 5M16 23c-3.5 0-6-2-7-5.5 3.5 0 6 1.5 7 4M16 21c3.5 0 6-2 7-5.5-3.5 0-6 1.5-7 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Kekik<em>Lokanta</em></a>
  <nav class="menu" data-menu aria-label="Ana menü">
${[["index.html", "Lokanta"], ["menu.html", "Menü"], ["rezervasyon.html", "Rezervasyon"], ["qr.html", "QR menü"]].map(([h, a]) => `    <a href="${h}"${h === aktif ? ' aria-current="page"' : ""}>${a}</a>`).join("\n")}
  </nav>
  <span class="acik-rozet" data-acik aria-live="polite"></span>
  <button class="menu-dugme" type="button" data-menu-ac aria-expanded="false" aria-label="Menüyü aç"><span></span><span></span></button>
</header>`;

const alt = `<footer class="alt">
  <div class="alt-ic">
    <div><p class="logo-alt">Kekik Lokanta</p><p>Urla'nın bağ yolunda, Ege otları, zeytinyağı ve közle pişen bir sofra. 2015'ten beri.</p></div>
    <div><h4>Adres</h4><p>Yeni Mah. Bağyolu Cad. No: 112, Urla / İzmir</p><p><a href="tel:+902327541840">0232 754 18 40</a></p></div>
    <div><h4>Saatler</h4><p>Salı ile perşembe 12.00 ile 23.00</p><p>Cuma ve cumartesi gece 00.30'a kadar</p><p>Pazar 11.00 ile 22.00, pazartesi kapalı</p></div>
  </div>
  <p class="alt-not">Alerjen bilgisi Türk Gıda Kodeksi'ndeki 14 alerjene göre verilmiştir. Mutfağımızda bütün alerjenler kullanıldığından çapraz bulaşma olasılığı vardır; alerjin varsa siparişte garsonuna söyle.</p>
</footer>`;

const sayfa = (dosya: string, baslik: string, aciklama: string, govde: string, sade = false) => `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${baslik}</title>
  <meta name="description" content="${aciklama}" />
  <meta name="theme-color" content="${sade ? "#fbf7ef" : "#f4ecdd"}" />
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Young+Serif&family=Figtree:wght@400;500;600;700;800&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body data-sayfa="${dosya.replace(".html", "")}"${sade ? ' class="sade"' : ""}>
${sade ? "" : ust(dosya)}
<main id="icerik">
${govde}
</main>
${sade ? "" : alt}
<script src="app.js"></script>
</body>
</html>
`;

const STIL = String.raw`/* Kekik Lokanta — keten krem zemin, zeytin yeşili, domates kırmızısı ve hardal; Young Serif başlıklar, Figtree gövde. */
:root {
  --keten: #f4ecdd; --kart: #fbf7ef; --murekkep: #23190f; --soluk: #67584a; --zeytin: #45552a; --zeytin-koyu: #333f1e; --domates: #c0442a; --hardal: #d9a23d;
  --cizgi: rgba(35, 25, 15, .13); --yaricap: 20px; --baslik: "Young Serif", Georgia, serif; --govde: "Figtree", system-ui, sans-serif;
}
[hidden] { display: none !important; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--keten); color: var(--murekkep); font: 16.5px/1.6 var(--govde); -webkit-font-smoothing: antialiased; }
img, svg { display: block; max-width: 100%; }
a { color: inherit; }
h1, h2, h3 { font-family: var(--baslik); font-weight: 400; line-height: 1.08; margin: 0; letter-spacing: -.01em; }
:focus-visible { outline: 3px solid var(--hardal); outline-offset: 2px; border-radius: 6px; }
.atla { position: absolute; left: -999px; top: 8px; background: var(--murekkep); color: #fff; padding: 8px 14px; border-radius: 10px; z-index: 50; }
.atla:focus { left: 12px; }

.ust { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: 22px; padding: 14px clamp(16px, 5vw, 60px); background: color-mix(in srgb, var(--keten) 90%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--cizgi); }
.logo { display: inline-flex; align-items: center; gap: 8px; font-family: var(--baslik); font-size: 24px; text-decoration: none; color: var(--zeytin); }
.logo svg { width: 28px; height: 28px; }
.logo em { font-style: normal; font-family: var(--govde); font-weight: 700; font-size: 12px; color: var(--soluk); margin-left: 2px; align-self: flex-end; margin-bottom: 5px; }
.menu { display: flex; gap: 4px; margin-left: auto; }
.menu a { text-decoration: none; padding: 9px 14px; border-radius: 99px; font-weight: 600; font-size: 15px; color: var(--soluk); }
.menu a:hover, .menu a[aria-current] { color: var(--murekkep); background: #eadfca; }
.acik-rozet { display: inline-flex; align-items: center; gap: 8px; padding: 8px 13px; border-radius: 99px; background: var(--kart); border: 1px solid var(--cizgi); font-size: 13.5px; font-weight: 700; white-space: nowrap; }
.acik-rozet:empty { display: none; }
.acik-rozet::before { content: ""; width: 9px; height: 9px; border-radius: 50%; background: #9b8f82; }
.acik-rozet.acik::before { background: #3f9a3a; box-shadow: 0 0 0 4px rgba(63, 154, 58, .18); }
.acik-rozet.yakinda::before { background: var(--hardal); }
.menu-dugme { display: none; width: 44px; height: 44px; border: 1px solid var(--cizgi); background: var(--kart); border-radius: 14px; cursor: pointer; flex-direction: column; justify-content: center; align-items: center; gap: 6px; }
.menu-dugme span { width: 18px; height: 2px; background: var(--murekkep); border-radius: 2px; }

.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 50px; padding: 12px 24px; border-radius: 99px; border: 0; background: var(--domates); color: #fff; font: 700 15.5px/1 var(--govde); text-decoration: none; cursor: pointer; transition: background .2s, transform .2s; }
.dugme:hover { background: #a3361f; }
.dugme:active { transform: scale(.98); }
.dugme[disabled] { opacity: .55; cursor: not-allowed; }
.dugme.ikincil { background: transparent; color: var(--murekkep); border: 1.5px solid var(--murekkep); }
.dugme.ikincil:hover { background: var(--murekkep); color: var(--keten); }
.dugme.zeytin { background: var(--zeytin); }
.dugme.zeytin:hover { background: var(--zeytin-koyu); }

.kapsayici { max-width: 1240px; margin: 0 auto; padding: 0 clamp(16px, 5vw, 48px); }
.kahraman { position: relative; min-height: min(78vh, 720px); display: grid; align-items: end; color: #fff7ea; overflow: hidden; border-radius: 0 0 36px 36px; }
.kahraman > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.kahraman::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(25, 16, 8, .05) 20%, rgba(25, 16, 8, .78)); }
.kahraman .ic { position: relative; z-index: 1; padding: 0 clamp(16px, 5vw, 60px) clamp(32px, 6vw, 72px); max-width: 860px; }
.kahraman .ust-yazi { display: inline-block; padding: 6px 12px; border-radius: 99px; background: rgba(255, 247, 234, .16); backdrop-filter: blur(6px); font-weight: 700; font-size: 13.5px; margin-bottom: 18px; }
.kahraman h1 { font-size: clamp(44px, 7vw, 92px); }
.kahraman p { font-size: clamp(17px, 1.6vw, 20px); max-width: 600px; color: #f1e5d1; margin: 16px 0 26px; }
.kahraman .dugme.ikincil { color: #fff7ea; border-color: rgba(255, 247, 234, .7); }
.kahraman .dugme.ikincil:hover { background: #fff7ea; color: var(--murekkep); }
.eylemler { display: flex; flex-wrap: wrap; gap: 12px; }

.bolum { padding-block: clamp(52px, 7vw, 100px); }
.bolum-ust { display: flex; justify-content: space-between; align-items: end; gap: 18px; flex-wrap: wrap; margin-bottom: 30px; }
.bolum-ust h2 { font-size: clamp(34px, 4.5vw, 54px); }
.bolum-ust p { color: var(--soluk); margin: 8px 0 0; max-width: 560px; }
.hikaye { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(24px, 5vw, 64px); align-items: center; }
.hikaye p { color: var(--soluk); font-size: 17.5px; }
.kolaj { display: grid; grid-template-columns: 1.2fr 1fr; grid-template-rows: 200px 200px; gap: 12px; }
.kolaj img { width: 100%; height: 100%; object-fit: cover; border-radius: 18px; }
.kolaj img:first-child { grid-row: span 2; }
.oneriler { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.oneri { background: var(--kart); border: 1px solid var(--cizgi); border-radius: var(--yaricap); padding: 22px; display: flex; flex-direction: column; gap: 8px; }
.oneri .kat { font-size: 12.5px; font-weight: 700; color: var(--zeytin); }
.oneri h3 { font-size: 23px; }
.oneri p { margin: 0; color: var(--soluk); font-size: 14.5px; flex: 1; }
.oneri b { font-size: 17px; }
.saatler-kutu { display: grid; grid-template-columns: 1fr 1.25fr; gap: 18px; }
.saatler-kutu .kutu { background: var(--zeytin); color: #eef0df; border-radius: var(--yaricap); padding: clamp(22px, 3vw, 34px); }
.saatler-kutu h2 { color: #fff; font-size: 34px; margin-bottom: 6px; }
.saatler-kutu .acik-rozet { background: rgba(255, 255, 255, .1); border-color: rgba(255, 255, 255, .18); color: #fff; margin: 8px 0 14px; }
.saat-tablo { width: 100%; border-collapse: collapse; margin-bottom: 22px; }
.saat-tablo td { padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, .14); font-size: 15px; }
.saat-tablo td:last-child { text-align: right; font-weight: 700; }
.saat-tablo tr.bugun td { color: var(--hardal); }
.saatler-kutu iframe { width: 100%; height: 100%; min-height: 360px; border: 0; border-radius: var(--yaricap); background: #e6dcc7; }

/* Menü */
.menu-ust { padding-top: clamp(36px, 5vw, 64px); }
.menu-ust h1 { font-size: clamp(44px, 6vw, 76px); }
.menu-ust p { color: var(--soluk); max-width: 640px; }
.sekmeler { position: sticky; top: 72px; z-index: 20; display: flex; gap: 6px; overflow-x: auto; padding: 12px 0; margin: 20px 0 6px; background: var(--keten); scrollbar-width: none; }
.sekmeler::-webkit-scrollbar { display: none; }
.sekmeler a, .sekmeler button { flex: none; min-height: 42px; display: inline-flex; align-items: center; padding: 8px 16px; border-radius: 99px; border: 1px solid var(--cizgi); background: var(--kart); text-decoration: none; font: 700 14.5px var(--govde); color: var(--murekkep); cursor: pointer; }
.sekmeler [aria-current="true"], .sekmeler [aria-selected="true"] { background: var(--murekkep); color: var(--keten); border-color: var(--murekkep); }
.suzgecler { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 14px 16px; border-radius: 16px; background: var(--kart); border: 1px solid var(--cizgi); margin-bottom: 18px; font-size: 14px; }
.suzgecler > span { font-weight: 700; margin-right: 4px; }
.cip { min-height: 36px; padding: 6px 12px; border-radius: 99px; border: 1px dashed rgba(35, 25, 15, .3); background: transparent; font: 600 13.5px var(--govde); color: var(--soluk); cursor: pointer; }
.cip[aria-pressed="true"] { border-style: solid; background: #f5d9d1; border-color: var(--domates); color: #8a2b16; text-decoration: line-through; }
.cip.olumlu[aria-pressed="true"] { background: #e2e8cf; border-color: var(--zeytin); color: var(--zeytin-koyu); text-decoration: none; }
.temizle { border: 0; background: none; color: var(--domates); font: 700 13.5px var(--govde); cursor: pointer; text-decoration: underline; }
.kategori { scroll-margin-top: 140px; margin-top: 30px; }
.kategori h2 { font-size: 32px; padding-bottom: 10px; border-bottom: 2px solid var(--murekkep); margin-bottom: 4px; }
.yemekler { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; column-gap: 48px; }
.yemek { display: grid; grid-template-columns: 1fr auto; gap: 4px 16px; padding: 18px 0; border-bottom: 1px solid var(--cizgi); }
.yemek h3 { font-family: var(--govde); font-weight: 800; font-size: 18px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.yemek .fiyat { font-weight: 800; font-size: 17px; white-space: nowrap; }
.yemek p { grid-column: 1 / -1; margin: 0; color: var(--soluk); font-size: 15px; }
.etiketler { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.et { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 99px; font-size: 12px; font-weight: 700; background: #eee3cf; color: #5b4a37; }
.et.alerjen { background: #fbe7cf; color: #7b4b0c; }
.et.vegan, .et.vej { background: #e2e8cf; color: var(--zeytin-koyu); }
.et.aci { background: #f6d6cc; color: #8a2b16; }
.et.oneri-et { background: var(--murekkep); color: var(--keten); }
.bos { padding: 40px 16px; text-align: center; color: var(--soluk); border: 1px dashed var(--cizgi); border-radius: var(--yaricap); margin-top: 20px; }
.qr-kutu { margin-top: 48px; display: grid; grid-template-columns: 1fr auto; gap: 18px; align-items: center; background: var(--kart); border: 1px solid var(--cizgi); border-radius: var(--yaricap); padding: 22px 24px; }
.qr-kutu h2 { font-size: 26px; }
.qr-kutu p { margin: 6px 0 0; color: var(--soluk); }
dialog { border: 0; border-radius: 24px; padding: 28px; max-width: min(420px, 92vw); text-align: center; background: var(--kart); color: inherit; }
dialog::backdrop { background: rgba(35, 25, 15, .45); }
dialog h2 { font-size: 28px; }
#qrYer { margin: 18px auto; width: 240px; height: 240px; display: grid; place-items: center; background: #fff; border-radius: 12px; }
#qrYer svg { width: 100%; height: 100%; }
dialog .eylemler { justify-content: center; }
dialog small { display: block; color: var(--soluk); word-break: break-all; }

/* Rezervasyon */
.rez { display: grid; grid-template-columns: 1fr 1.1fr; gap: clamp(24px, 5vw, 64px); padding-block: clamp(36px, 5vw, 72px); align-items: start; }
.rez > * { min-width: 0; }
.rez h1 { font-size: clamp(40px, 5.5vw, 66px); }
.rez .yan p { color: var(--soluk); }
.rez .yan img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: var(--yaricap); margin-top: 22px; }
.form { background: var(--kart); border: 1px solid var(--cizgi); border-radius: 24px; padding: clamp(20px, 3vw, 32px); display: grid; gap: 16px; }
.ikili { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form label { display: grid; gap: 7px; font-weight: 700; font-size: 14px; }
.form input, .form select, .form textarea { width: 100%; min-height: 50px; padding: 12px 14px; border-radius: 14px; border: 1.5px solid rgba(35, 25, 15, .2); background: #fff; color: inherit; font: 500 16px var(--govde); }
.form input:focus, .form select:focus, .form textarea:focus { outline: none; border-color: var(--zeytin); box-shadow: 0 0 0 3px #e2e8cf; }
.alanlar { display: flex; gap: 8px; flex-wrap: wrap; }
.alanlar label { display: inline-flex; flex-direction: row; align-items: center; gap: 8px; min-height: 46px; padding: 0 16px; border-radius: 99px; border: 1.5px solid rgba(35, 25, 15, .2); background: #fff; cursor: pointer; font-weight: 600; }
.alanlar input { width: 18px; min-height: 18px; height: 18px; accent-color: var(--zeytin); }
.alanlar label:has(input:checked) { border-color: var(--zeytin); background: #eef1e2; }
.onay { display: flex !important; gap: 10px; align-items: flex-start; font-weight: 500 !important; color: var(--soluk); }
.onay input { width: 20px; min-height: 20px !important; height: 20px; margin-top: 2px; accent-color: var(--zeytin); flex: none; }
.ipucu { margin: 0; font-size: 13.5px; color: var(--soluk); }
.mesaj { border-radius: 14px; padding: 14px 16px; font-size: 14.5px; }
.mesaj b { display: block; }
.mesaj.hata { background: #f9dfd6; color: #7e2814; }
.mesaj.bilgi { background: #f8ebc9; color: #5f4507; }
.mesaj.tamam { background: #e2e8cf; color: var(--zeytin-koyu); }

/* QR menü: telefon için sade görünüm */
body.sade { background: #fbf7ef; font-size: 17px; }
.qr-ust { position: sticky; top: 0; z-index: 20; background: #fbf7ef; margin: 0 -16px; padding: max(12px, env(safe-area-inset-top)) 16px 0; border-bottom: 1px solid var(--cizgi); }
.qr-ust .satir { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.qr-ust .logo { font-size: 22px; }
.qr-ust .acik-rozet { font-size: 12.5px; padding: 6px 10px; }
.ara { position: relative; margin: 12px 0 0; }
.ara input { width: 100%; min-height: 48px; padding: 12px 14px 12px 42px; border-radius: 14px; border: 1.5px solid rgba(35, 25, 15, .18); background: #fff; font: 500 16px var(--govde); color: inherit; }
.ara svg { position: absolute; left: 14px; top: 50%; width: 18px; transform: translateY(-50%); color: var(--soluk); }
body.sade .sekmeler { position: static; margin: 8px 0 0; padding: 10px 0 12px; background: transparent; }
body.sade main { max-width: 640px; margin: 0 auto; padding: 4px 16px calc(32px + env(safe-area-inset-bottom)); }
body.sade .kategori { scroll-margin-top: 170px; margin-top: 22px; }
body.sade .kategori h2 { font-size: 26px; }
body.sade .yemekler { grid-template-columns: 1fr; }
body.sade .yemek h3 { font-size: 18px; }
.qr-alt { margin-top: 28px; padding: 16px; border-radius: 16px; background: #f1e7d5; font-size: 14px; color: var(--soluk); }
.qr-alt a { font-weight: 700; color: var(--murekkep); }

.alt { background: var(--murekkep); color: #cbbca8; padding: 56px clamp(16px, 5vw, 60px) 26px; margin-top: 48px; }
.alt-ic { max-width: 1240px; margin: 0 auto; display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 28px; }
.logo-alt { font-family: var(--baslik); font-size: 26px; color: #fff7ea; margin: 0 0 6px; }
.alt h4 { color: #fff7ea; margin: 0 0 8px; font-size: 14px; }
.alt p { margin: 4px 0; font-size: 14.5px; }
.alt a { color: #f3e5cf; }
.alt-not { max-width: 1240px; margin: 34px auto 0; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, .12); font-size: 13px; }
.bildirim { position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 160%); background: var(--murekkep); color: #fff; padding: 13px 20px; border-radius: 99px; font-weight: 700; font-size: 14.5px; z-index: 60; transition: transform .35s; max-width: calc(100vw - 32px); }
.bildirim.acik { transform: translate(-50%, 0); }

@media (max-width: 1000px) { .oneriler { grid-template-columns: repeat(2, 1fr); } .yemekler { grid-template-columns: 1fr; } }
@media (max-width: 820px) {
  .menu { display: none; position: absolute; left: 12px; right: 12px; top: calc(100% + 8px); flex-direction: column; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 18px; padding: 8px; }
  .menu.acik { display: flex; }
  .menu a { padding: 13px 14px; font-size: 16px; }
  .menu-dugme { display: inline-flex; }
  .ust .acik-rozet { margin-left: auto; }
  .hikaye, .saatler-kutu, .rez, .qr-kutu { grid-template-columns: 1fr; }
  .kolaj { grid-template-rows: 150px 150px; }
  .alt-ic { grid-template-columns: 1fr; }
  .sekmeler { top: 70px; }
}
@media (max-width: 560px) {
  .oneriler { grid-template-columns: 1fr; }
  .ikili { grid-template-columns: 1fr; }
  .ust .acik-rozet { font-size: 12.5px; padding: 6px 10px; }
  .logo em { display: none; }
  .kahraman { min-height: 76vh; }
}
@media print { .ust, .alt, .suzgecler, .sekmeler, .qr-kutu { display: none; } }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; scroll-behavior: auto !important; } }
`;

const UYGULAMA = ORTAK_JS + String.raw`
/* ── Kekik Lokanta ──
 * Menü "menu" tablosundan okunur; şablon galerisindeki canlı önizlemede (Vayra Veri bağlı değilken) aşağıdaki yedek liste
 * gösterilir. Rezervasyonlar "rezervasyonlar" tablosuna yazılır (ziyaretçi ekler, okuyamaz). Saatler İstanbul saatine göredir. */
var YEDEK_MENU = ${JSON.stringify(MENU)};
var KATEGORILER = ${JSON.stringify(KATEGORILER)};
var SAATLER = ${JSON.stringify(SAATLER)};
var GUN_AD = ${JSON.stringify(GUN_AD)};
var SAYFA = document.body.dataset.sayfa;

/* ── Şu an açık mı? Kapanışı gece yarısını geçen günler (cuma, cumartesi) bir sonraki güne taşar. ── */
function aralik(g) { var s = SAATLER[g]; if (!s) return null; var a = saatDakika(s[0]), b = saatDakika(s[1]); if (b <= a) b += 1440; return [a, b]; }
function saatYaz(d) { return dakikaSaat(d).replace(":", "."); }
function acikDurum() {
  var an = istanbul(), g = an.gun, m = an.dakika, bugun = aralik(g), dun = aralik((g + 6) % 7);
  if (dun && dun[1] > 1440 && m < dun[1] - 1440) return { acik: true, kalan: dun[1] - 1440 - m, kapanis: dun[1] };
  if (bugun && m >= bugun[0] && m < bugun[1]) return { acik: true, kalan: bugun[1] - m, kapanis: bugun[1] };
  if (bugun && m < bugun[0]) return { acik: false, metin: "Bugün " + saatYaz(bugun[0]) + "'" + saatEki(bugun[0], "de") + " açılıyor" };
  for (var i = 1; i <= 7; i++) { var y = (g + i) % 7, r = aralik(y); if (r) return { acik: false, metin: (i === 1 ? "Yarın " : GUN_AD[y] + " ") + saatYaz(r[0]) + "'" + saatEki(r[0], "de") + " açılıyor" }; }
  return { acik: false, metin: "Kapalı" };
}
function acikRozetleri() {
  var d = acikDurum();
  $$("[data-acik]").forEach(function (el) {
    el.classList.toggle("acik", d.acik); el.classList.toggle("yakinda", d.acik && d.kalan <= 60);
    el.textContent = d.acik ? (d.kalan <= 60 ? "Kapanmaya " + d.kalan + " dakika var" : "Şu an açık, " + saatYaz(d.kapanis) + "'" + saatEki(d.kapanis, "e") + " kadar") : "Şu an kapalı. " + d.metin;
  });
  var bg = istanbul().gun;
  $$(".saat-tablo tr").forEach(function (tr) { tr.classList.toggle("bugun", Number(tr.dataset.gun) === bg); });
}
acikRozetleri(); setInterval(acikRozetleri, 60000);

/* ── Menü verisi ── */
var menuSoz = null;
function menu() {
  if (!menuSoz) menuSoz = (veriVar() ? vayra.veri.liste("menu", { sirala: "sira", yon: "artan", sinir: 500 }) : Promise.resolve(YEDEK_MENU.slice()))
    .then(function (l) { return l.filter(function (x) { return x.aktif !== false; }); })
    .catch(function (e) { menuSoz = null; throw e; });
  return menuSoz;
}
function alerjenler(x) { return String(x.alerjenler || "").split(",").map(function (a) { return a.trim().toLocaleLowerCase("tr-TR"); }).filter(Boolean); }
function yemekHtml(x) {
  var et = "";
  if (x.onerilen) et += '<span class="et oneri-et">Şefin önerisi</span>';
  if (x.vegan) et += '<span class="et vegan">Vegan</span>'; else if (x.vejetaryen) et += '<span class="et vej">Vejetaryen</span>';
  if (x.acili) et += '<span class="et aci">Acılı</span>';
  var al = alerjenler(x);
  et += al.length ? al.map(function (a) { return '<span class="et alerjen">' + kacir(a.charAt(0).toLocaleUpperCase("tr-TR") + a.slice(1)) + "</span>"; }).join("") : '<span class="et">Bilinen alerjen yok</span>';
  return '<li class="yemek"><h3>' + kacir(x.ad) + '</h3><span class="fiyat">' + tl(x.fiyat) + "</span>" + (x.aciklama ? "<p>" + kacir(x.aciklama) + "</p>" : "") + '<div class="etiketler" aria-label="Etiketler">' + et + "</div></li>";
}
function kategoriHtml(k, l) { return '<section class="kategori" id="k-' + KATEGORILER.indexOf(k) + '" aria-labelledby="b-' + KATEGORILER.indexOf(k) + '"><h2 id="b-' + KATEGORILER.indexOf(k) + '">' + kacir(k) + '</h2><ul class="yemekler">' + l.map(yemekHtml).join("") + "</ul></section>"; }
function hataHtml(e) { return '<div class="bos"><b>Menü yüklenemedi.</b> ' + kacir(e && e.message || "") + ' <button class="temizle" onclick="location.reload()">Yeniden dene</button></div>'; }

if (SAYFA === "index") {
  menu().then(function (l) {
    var o = l.filter(function (x) { return x.onerilen; }).slice(0, 4);
    $("#oneriler").innerHTML = o.map(function (x) { return '<article class="oneri"><span class="kat">' + kacir(x.kategori) + "</span><h3>" + kacir(x.ad) + "</h3><p>" + kacir(x.aciklama || "") + "</p><b>" + tl(x.fiyat) + "</b></article>"; }).join("");
  }).catch(function (e) { $("#oneriler").innerHTML = hataHtml(e); });
}

if (SAYFA === "menu" || SAYFA === "qr") {
  var yer = $("#menuListe"), sekmeler = $("#sekmeler"), haric = {}, yalniz = { vegan: false, vejetaryen: false }, aranan = "", hepsi = [];
  function suz(l) {
    return l.filter(function (x) {
      if (yalniz.vegan && !x.vegan) return false;
      if (yalniz.vejetaryen && !(x.vejetaryen || x.vegan)) return false;
      var al = alerjenler(x);
      for (var a in haric) if (haric[a] && al.indexOf(a) >= 0) return false;
      if (aranan && (x.ad + " " + (x.aciklama || "")).toLocaleLowerCase("tr-TR").indexOf(aranan) < 0) return false;
      return true;
    });
  }
  function ciz() {
    var l = suz(hepsi), dolu = KATEGORILER.filter(function (k) { return l.some(function (x) { return x.kategori === k; }); });
    var digerleri = l.filter(function (x) { return KATEGORILER.indexOf(x.kategori) < 0; });
    yer.innerHTML = dolu.length || digerleri.length ? dolu.map(function (k) { return kategoriHtml(k, l.filter(function (x) { return x.kategori === k; })); }).join("") + (digerleri.length ? kategoriHtml("Diğer", digerleri) : "")
      : '<div class="bos"><b>Bu süzgeçlere uyan yemek yok.</b><br>Süzgeçleri gevşetmeyi dene ya da garsonumuza sor; mutfakta uyarlayabileceğimiz yemekler var.</div>';
    sekmeler.innerHTML = dolu.map(function (k) { return '<a href="#k-' + KATEGORILER.indexOf(k) + '">' + kacir(k) + "</a>"; }).join("");
    var sayac = $("#sonucSayi"); if (sayac) sayac.textContent = l.length + " ürün";
    izle();
  }
  /* Kaydırınca görünen kategorinin sekmesi işaretlenir. */
  var gozcu = null;
  function izle() {
    if (gozcu) gozcu.disconnect();
    if (!("IntersectionObserver" in window)) return;
    gozcu = new IntersectionObserver(function (g) {
      g.forEach(function (x) { if (x.isIntersecting) $$("#sekmeler a").forEach(function (a) { var on = a.getAttribute("href") === "#" + x.target.id; a.setAttribute("aria-current", String(on)); if (on && a.scrollIntoView && SAYFA === "qr") a.parentNode.scrollTo({ left: a.offsetLeft - 16, behavior: "smooth" }); }); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$(".kategori").forEach(function (s) { gozcu.observe(s); });
  }
  $$("[data-haric]").forEach(function (b) { b.addEventListener("click", function () { var a = b.dataset.haric; haric[a] = !haric[a]; b.setAttribute("aria-pressed", String(haric[a])); ciz(); }); });
  $$("[data-yalniz]").forEach(function (b) { b.addEventListener("click", function () { var a = b.dataset.yalniz; yalniz[a] = !yalniz[a]; b.setAttribute("aria-pressed", String(yalniz[a])); ciz(); }); });
  var temizle = $("#temizle"); if (temizle) temizle.addEventListener("click", function () { haric = {}; yalniz = { vegan: false, vejetaryen: false }; $$("[data-haric],[data-yalniz]").forEach(function (b) { b.setAttribute("aria-pressed", "false"); }); ciz(); });
  var ara = $("#ara"); if (ara) ara.addEventListener("input", function () { aranan = ara.value.trim().toLocaleLowerCase("tr-TR"); ciz(); });
  menu().then(function (l) { hepsi = l; ciz(); }).catch(function (e) { yer.innerHTML = hataHtml(e); });
}

/* ── Masa QR kodu: QR menü sayfasının adresini kodlar, yazdırılabilir ── */
if (SAYFA === "menu") {
  var dlg = $("#qrPencere");
  $("#qrAc").addEventListener("click", function () {
    var adres = new URL("qr.html", document.baseURI).href;
    $("#qrAdres").textContent = adres;
    dlg.showModal();
    function ciz() { var q = window.qrcode(0, "M"); q.addData(adres); q.make(); $("#qrYer").innerHTML = q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); }
    if (window.qrcode) return ciz();
    var s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js";
    s.onload = ciz; s.onerror = function () { $("#qrYer").textContent = "QR kodu üretilemedi; bağlantını kontrol et."; };
    document.head.appendChild(s);
  });
  $("#qrKapat").addEventListener("click", function () { dlg.close(); });
  $("#qrYazdir").addEventListener("click", function () { window.print(); });
}

/* ── Rezervasyon ── */
if (SAYFA === "rezervasyon") {
  var form = $("#rez"), tarih = $("#tarih"), saat = $("#saat"), mesaj = $("#mesaj"), kisi = $("#kisi");
  var bugun = istanbul().tarih;
  tarih.min = bugun; tarih.max = gunEkle(bugun, 60);
  /** Seçilen gün için masa saatleri: açılıştan kapanıştan 90 dakika öncesine kadar, yarım saatte bir. */
  function saatleriDoldur() {
    var t = tarih.value, onceki = saat.value;
    if (!t) { saat.innerHTML = '<option value="">Önce tarih seç</option>'; saat.disabled = true; return; }
    var r = aralik(haftaGunu(t));
    if (!r) { saat.innerHTML = '<option value="">Pazartesi kapalıyız</option>'; saat.disabled = true; return goster("bilgi", "Pazartesi kapalıyız.", "Salıdan pazara her gün açığız; başka bir gün seç."); }
    mesaj.hidden = true;
    var simdi = istanbul(), l = [];
    for (var d = r[0]; d <= r[1] - 90; d += 30) { if (t === simdi.tarih && d < simdi.dakika + 30) continue; l.push(dakikaSaat(d)); }
    saat.disabled = !l.length;
    saat.innerHTML = l.length ? '<option value="">Saat seç</option>' + l.map(function (s) { return '<option' + (s === onceki ? " selected" : "") + ">" + s + "</option>"; }).join("") : '<option value="">Bugün için masa saati kalmadı</option>';
  }
  function goster(tur, baslik, metin) { mesaj.hidden = false; mesaj.className = "mesaj " + tur; mesaj.innerHTML = "<b>" + kacir(baslik) + "</b>" + kacir(metin || ""); }
  tarih.addEventListener("change", saatleriDoldur);
  kisi.addEventListener("change", function () { $("#kalabalik").hidden = Number(kisi.value) < 9; });
  saatleriDoldur();
  form.addEventListener("submit", function (e) {
    e.preventDefault(); mesaj.hidden = true;
    if (!form.reportValidity()) return;
    var f = new FormData(form);
    var k = { ad: String(f.get("ad")).trim(), telefon: String(f.get("telefon")).trim(), tarih: tarih.value, saat: saat.value, kisi: Number(f.get("kisi")), alan: f.get("alan") || "Fark etmez", not: String(f.get("not") || "").trim() || null, kvkk: true };
    if (!/^[0-9 +()]{10,17}$/.test(k.telefon)) return goster("hata", "Telefon numarası geçersiz.", "Örneğin 0532 123 45 67 biçiminde yaz.");
    if (!veriVar()) return goster("bilgi", "Bu canlı önizlemede rezervasyon kaydedilmez.", "Şablonu kullanınca rezervasyonlar veritabanındaki rezervasyonlar tablosuna düşer.");
    var d = $("#gonder"); d.disabled = true; d.textContent = "Gönderiliyor…";
    vayra.veri.ekle("rezervasyonlar", k).then(function () {
      olay("rezervasyon", { kisi: k.kisi, alan: k.alan });
      form.reset(); saatleriDoldur();
      goster("tamam", "Teşekkürler " + k.ad.split(" ")[0] + ", rezervasyon talebin alındı.", tarihYaz(k.tarih, { weekday: "long" }) + " saat " + k.saat + ", " + k.kisi + " kişi. Masanı ayırınca seni arayıp onaylayacağız.");
      mesaj.scrollIntoView({ block: "center", behavior: "smooth" });
    }).catch(function (err) { goster("hata", "Rezervasyon gönderilemedi.", (err && err.message ? err.message + ". " : "") + "Yeniden dene ya da 0232 754 18 40 numarasını ara."); })
      .finally(function () { d.disabled = false; d.textContent = "Rezervasyon talebini gönder"; });
  });
}
`;

const SUZGECLER = `<div class="suzgecler" role="group" aria-label="Menü süzgeçleri">
    <span>İçermesin:</span>
${["gluten", "süt", "yumurta", "kuruyemiş", "balık", "kabuklu deniz ürünü", "yumuşakça", "susam"].map((a) => `    <button type="button" class="cip" data-haric="${a}" aria-pressed="false">${a.charAt(0).toLocaleUpperCase("tr-TR") + a.slice(1)}</button>`).join("\n")}
    <span style="margin-left:8px">Yalnız:</span>
    <button type="button" class="cip olumlu" data-yalniz="vejetaryen" aria-pressed="false">Vejetaryen</button>
    <button type="button" class="cip olumlu" data-yalniz="vegan" aria-pressed="false">Vegan</button>
    <button type="button" class="temizle" id="temizle">Temizle</button>
  </div>`;

export const EGE_RESTORAN = {
  id: "ege-restoran",
  ad: "Kekik Lokanta · Restoran",
  tur: "site" as const,
  aciklama: "Ege restoranı: tablodan menü, alerjen etiketleri ve süzgeci, masa rezervasyonu, QR menü ve şu an açık mı göstergesi",
  kapak: "/gercek/build/sablon/ege-restoran.webp",
  tablolar: TABLOLAR,
  dosyalar: {
    "index.html": sayfa("index.html", "Kekik Lokanta · Urla", "Urla bağ yolunda Ege mutfağı: zeytinyağlılar, köz, deniz ürünleri ve Urla şarapları. Masa rezervasyonu ve menü.", `<section class="kahraman">
  <img src="/gercek/havuz/gorsel/mk-yemek-3806.webp" alt="Domates soslu İzmir köfte" fetchpriority="high" />
  <div class="ic">
    <span class="ust-yazi" data-acik></span>
    <h1>Bağ yolunda, közün başında.</h1>
    <p>Urla'nın otları, Ege'nin zeytinyağı ve babaannemizin köftesi. Akşamüstü bahçede, kış akşamları ocak başında.</p>
    <div class="eylemler"><a class="dugme" href="rezervasyon.html">Masa ayırt</a><a class="dugme ikincil" href="menu.html">Menüye bak</a></div>
  </div>
</section>
<section class="kapsayici bolum">
  <div class="hikaye">
    <div>
      <h2 style="font-size:clamp(34px,4.5vw,54px);margin-bottom:16px">Pazardan sofraya, aynı gün.</h2>
      <p>Her sabah Urla pazarından ve komşu bahçelerden ne geldiyse menü onunla kurulur. Zeytinyağımızı Karaburun'daki aile bahçemizden sıkıyor, ekmeğimizi taş fırında ekşi mayayla pişiriyoruz.</p>
      <p>Kırk kişilik iç salonumuz ve asma altında altmış kişilik bahçemiz var. Hafta sonu akşamları için rezervasyon öneririz.</p>
      <a class="dugme zeytin" href="menu.html" style="margin-top:10px">Bugünün menüsü</a>
    </div>
    <div class="kolaj">
      <img src="/gercek/havuz/gorsel/mk-yemek-10420.webp" alt="Ahşap tahta üzerinde taze sebzeler" loading="lazy" />
      <img src="/gercek/galeri/urun12.webp" alt="Otlu zeytinyağı şişesi" loading="lazy" />
      <img src="/gercek/havuz/gorsel/mk-urun-22734.webp" alt="Kadehe dökülen kırmızı şarap" loading="lazy" />
    </div>
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-ust"><div><h2>Şefin önerileri</h2><p>Bu hafta mutfaktan en çok çıkanlar. Menünün tamamı alerjen bilgisiyle birlikte menü sayfasında.</p></div><a class="dugme ikincil" href="menu.html">Bütün menü</a></div>
  <div class="oneriler" id="oneriler" aria-live="polite"></div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="saatler-kutu">
    <div class="kutu">
      <h2>Çalışma saatleri</h2>
      <span class="acik-rozet" data-acik></span>
      <table class="saat-tablo"><tbody>
${[2, 3, 4, 5, 6, 0, 1].map((g) => `        <tr data-gun="${g}"><td>${GUN_AD[g]}</td><td>${SAATLER[g] ? `${SAATLER[g]![0].replace(":", ".")} ile ${SAATLER[g]![1].replace(":", ".")}` : "Kapalı"}</td></tr>`).join("\n")}
      </tbody></table>
      <p style="margin:0 0 18px">Yeni Mah. Bağyolu Cad. No: 112, Urla / İzmir. Mutfak kapanıştan bir saat önce sipariş alır.</p>
      <a class="dugme" href="rezervasyon.html">Masa ayırt</a>
    </div>
    <iframe title="Kekik Lokanta harita konumu" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=26.745%2C38.315%2C26.785%2C38.335&amp;layer=mapnik&amp;marker=38.3245%2C26.7650"></iframe>
  </div>
</section>`),
    "menu.html": sayfa("menu.html", "Menü · Kekik Lokanta", "Kekik Lokanta menüsü: mezeler, ara sıcaklar, ana yemekler, tatlılar ve içecekler; alerjen bilgisiyle.", `<section class="kapsayici menu-ust">
  <h1>Menü</h1>
  <p>Fiyatlar TL ve KDV dahildir. Alerjenler her yemeğin altında yazar; içermesini istemediklerini seç, menü ona göre süzülsün.</p>
  <nav class="sekmeler" id="sekmeler" aria-label="Kategoriler"></nav>
  ${SUZGECLER}
  <div id="menuListe" aria-live="polite"><div class="bos">Menü yükleniyor…</div></div>
  <div class="qr-kutu">
    <div><h2>Masalar için QR menü</h2><p>QR kodu yazdırıp masalara koy; misafirler menüyü telefonda sade görünümde açar.</p></div>
    <div class="eylemler"><a class="dugme ikincil" href="qr.html">QR menüyü aç</a><button class="dugme zeytin" type="button" id="qrAc">QR kodunu göster</button></div>
  </div>
</section>
<dialog id="qrPencere" aria-labelledby="qrBaslik">
  <h2 id="qrBaslik">Kekik Lokanta QR menü</h2>
  <div id="qrYer" aria-label="QR menü kodu"></div>
  <small id="qrAdres"></small>
  <div class="eylemler" style="margin-top:18px"><button class="dugme" type="button" id="qrYazdir">Yazdır</button><button class="dugme ikincil" type="button" id="qrKapat">Kapat</button></div>
</dialog>`),
    "rezervasyon.html": sayfa("rezervasyon.html", "Rezervasyon · Kekik Lokanta", "Kekik Lokanta'da masa ayırt: iç salon ya da asma altı bahçe.", `<section class="kapsayici rez">
  <div class="yan">
    <h1>Masa ayırt</h1>
    <p>Formu doldur, masanı ayırınca seni arayıp onaylayalım. Aynı gün için iki saatten kısa süre kaldıysa telefonla ulaşman daha hızlı olur: <a href="tel:+902327541840">0232 754 18 40</a>.</p>
    <p><span class="acik-rozet" data-acik></span></p>
    <img src="/gercek/havuz/gorsel/mk-yemek-40524.webp" alt="Mutfakta doğranan taze sebzeler" loading="lazy" />
  </div>
  <form class="form" id="rez" novalidate>
    <div class="ikili">
      <label>Tarih<input type="date" id="tarih" name="tarih" required /></label>
      <label>Saat<select id="saat" name="saat" required></select></label>
    </div>
    <label>Kişi sayısı<select id="kisi" name="kisi" required>${Array.from({ length: 12 }, (_, i) => `<option${i === 1 ? " selected" : ""}>${i + 1}</option>`).join("")}</select></label>
    <p class="ipucu" id="kalabalik" hidden>9 kişi ve üstü gruplar için ön sipariş gerekebilir; seni arayıp ayrıntıları konuşacağız.</p>
    <fieldset style="border:0;padding:0;margin:0"><legend style="font-weight:700;font-size:14px;margin-bottom:8px">Nerede oturmak istersin?</legend>
      <div class="alanlar"><label><input type="radio" name="alan" value="İç salon" />İç salon</label><label><input type="radio" name="alan" value="Bahçe" />Bahçe</label><label><input type="radio" name="alan" value="Fark etmez" checked />Fark etmez</label></div>
    </fieldset>
    <div class="ikili">
      <label>Ad soyad<input name="ad" required autocomplete="name" minlength="3" /></label>
      <label>Telefon<input name="telefon" type="tel" required autocomplete="tel" inputmode="tel" placeholder="05xx xxx xx xx" /></label>
    </div>
    <label>Not (isteğe bağlı)<textarea name="not" rows="3" maxlength="400" placeholder="Doğum günü, bebek sandalyesi, alerji…"></textarea></label>
    <label class="onay"><input type="checkbox" name="kvkk" required /> <span>Ad ve telefon bilgimin yalnız bu rezervasyon için kullanılmasını kabul ediyorum.</span></label>
    <div id="mesaj" class="mesaj" role="status" aria-live="polite" hidden></div>
    <button class="dugme" type="submit" id="gonder">Rezervasyon talebini gönder</button>
  </form>
</section>`),
    "qr.html": sayfa("qr.html", "QR menü · Kekik Lokanta", "Kekik Lokanta menüsü, telefon için sade görünüm.", `<header class="qr-ust">
  <div class="satir"><a class="logo" href="index.html" aria-label="Kekik Lokanta ana sayfa"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 29V12M16 18c-5 0-8-3-9-8 5 0 8 2 9 6M16 15c4 0 7-2.5 8-7-4 0-7 2-8 5M16 23c-3.5 0-6-2-7-5.5 3.5 0 6 1.5 7 4M16 21c3.5 0 6-2 7-5.5-3.5 0-6 1.5-7 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Kekik</a><span class="acik-rozet" data-acik></span></div>
  <label class="ara"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span class="atla">Menüde ara</span><input id="ara" type="search" placeholder="Menüde ara: köfte, enginar…" autocomplete="off" /></label>
  <nav class="sekmeler" id="sekmeler" aria-label="Kategoriler"></nav>
</header>
<div class="suzgecler" role="group" aria-label="Süzgeçler" style="margin-top:12px">
  <span>İçermesin:</span>
${["gluten", "süt", "kuruyemiş", "balık"].map((a) => `  <button type="button" class="cip" data-haric="${a}" aria-pressed="false">${a.charAt(0).toLocaleUpperCase("tr-TR") + a.slice(1)}</button>`).join("\n")}
  <button type="button" class="cip olumlu" data-yalniz="vegan" aria-pressed="false">Yalnız vegan</button>
</div>
<div id="menuListe" aria-live="polite"><div class="bos">Menü yükleniyor…</div></div>
<div class="qr-alt">Alerjin varsa siparişte garsonuna söyle; mutfağımızda bütün alerjenler kullanılıyor. Fiyatlar KDV dahil. <a href="rezervasyon.html">Başka bir gün için masa ayırt</a></div>`, true),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#45552a"/><path d="M32 54V24M32 36c-9 0-14-5-16-14 9 0 14 4 16 11M32 30c8 0 13-5 15-13-8 0-13 4-15 9M32 46c-7 0-11-4-13-10 7 0 11 3 13 8M32 42c7 0 11-4 13-10-7 0-11 3-13 8" fill="none" stroke="#f4ecdd" stroke-width="3.4" stroke-linecap="round"/></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
  },
};
