/* Şablon: Lumen Kahve — çok sayfalı kahveci sitesi (menü, rezervasyon formu → gelen kutusu). */

const ust = (aktif: string) => '<header class="ust">\n  <a class="logo" href="index.html">Lumen Kahve</a>\n  <nav>\n'
  + [["index.html", "Ana sayfa"], ["menu.html", "Menü"], ["rezervasyon.html", "Rezervasyon"]].map(([h, a]) => '    <a href="' + h + '"' + (h === aktif ? ' class="aktif"' : "") + ">" + a + "</a>").join("\n")
  + '\n  </nav>\n  <a class="dugme kucuk" href="rezervasyon.html">Masa ayırt</a>\n</header>';

const alt = '<footer class="alt">\n  <div><strong>Lumen Kahve</strong><p>Moda Cad. No:42, Kadıköy / İstanbul</p></div>\n  <div><p>Her gün 08.00 - 22.00</p><p>merhaba@lumenkahve.com</p></div>\n</footer>';

const sayfa = (baslik: string, aktif: string, govde: string) => '<!doctype html>\n<html lang="tr">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <title>' + baslik + '</title>\n  <meta name="description" content="Kadıköy\'de üçüncü dalga kahve: tek kökenli çekirdekler, ev yapımı tatlılar." />\n  <link rel="preconnect" href="https://fonts.googleapis.com" />\n  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />\n  <link rel="stylesheet" href="stil.css" />\n</head>\n<body>\n' + ust(aktif) + "\n" + govde + "\n" + alt + '\n<script src="app.js"></script>\n</body>\n</html>\n';

export const KAHVE = {
  id: "kahve",
  ad: "Lumen Kahve",
  tur: "site" as const,
  aciklama: "Menü, rezervasyon formu ve konumuyla kahveci sitesi",
  kapak: "/gercek/paz/urun-kahve.webp",
  dosyalar: {
    "index.html": sayfa("Lumen Kahve · Kadıköy", "index.html", `<main>
  <section class="kahraman">
    <div>
      <p class="ust-baslik">Kadıköy, 2019'dan beri</p>
      <h1>Her fincan bir sabah ritüeli.</h1>
      <p class="giris">Etiyopya'dan Kolombiya'ya, her hafta taze kavrulan tek kökenli çekirdekler. Yavaş demleme, ev yapımı tatlılar ve uzun sohbetler.</p>
      <div class="eylemler"><a class="dugme" href="menu.html">Menüyü gör</a><a class="dugme ikincil" href="#konum">Yol tarifi</a></div>
    </div>
    <img src="/gercek/paz/urun-kahve.webp" alt="Cam demlikte filtre kahve" />
  </section>
  <section class="kartlar">
    <article><img src="/gercek/havuz/gorsel/mk-urun-4992.webp" alt="" /><h3>Filtre kahve</h3><p>Günün çekirdeği, V60 ile</p><span>95 TL</span></article>
    <article><img src="/gercek/havuz/gorsel/mk-urun-810.webp" alt="" /><h3>Flat white</h3><p>Çift shot, ipeksi süt</p><span>110 TL</span></article>
    <article><img src="/gercek/havuz/gorsel/mk-urun-41859.webp" alt="" /><h3>Cappuccino</h3><p>Klasik oran, kakao dokunuşu</p><span>105 TL</span></article>
  </section>
  <section id="konum" class="konum">
    <div><h2>Bizi bul</h2><p>Moda Caddesi'nin sonunda, deniz kokusunun başladığı yerde. Hafta sonu kahvaltısı için rezervasyon önerilir.</p><a class="dugme" href="rezervasyon.html">Masa ayırt</a></div>
    <iframe title="Harita" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=29.020%2C40.979%2C29.036%2C40.989&amp;layer=mapnik"></iframe>
  </section>
</main>`),
    "menu.html": sayfa("Menü · Lumen Kahve", "menu.html", `<main class="dar">
  <h1>Menü</h1>
  <p class="giris">Bütün kahvelerimiz bitkisel sütle de hazırlanır.</p>
  <div class="filtre" role="tablist">
    <button class="secili" data-kategori="hepsi">Hepsi</button><button data-kategori="sicak">Sıcak</button><button data-kategori="soguk">Soğuk</button><button data-kategori="tatli">Tatlı</button>
  </div>
  <ul class="menu">
    <li data-kategori="sicak"><span>Filtre kahve</span><em>Günün çekirdeği</em><b>95 TL</b></li>
    <li data-kategori="sicak"><span>Espresso</span><em>Çift shot</em><b>80 TL</b></li>
    <li data-kategori="sicak"><span>Flat white</span><em>İpeksi süt</em><b>110 TL</b></li>
    <li data-kategori="sicak"><span>Cappuccino</span><em>Kakao dokunuşu</em><b>105 TL</b></li>
    <li data-kategori="soguk"><span>Cold brew</span><em>18 saat demleme</em><b>120 TL</b></li>
    <li data-kategori="soguk"><span>Buzlu latte</span><em>Vanilya isteğe bağlı</em><b>115 TL</b></li>
    <li data-kategori="tatli"><span>Tarçınlı çörek</span><em>Her sabah fırından</em><b>85 TL</b></li>
    <li data-kategori="tatli"><span>Limonlu kek</span><em>Glutensiz</em><b>90 TL</b></li>
  </ul>
</main>`),
    "rezervasyon.html": sayfa("Rezervasyon · Lumen Kahve", "rezervasyon.html", `<main class="dar">
  <h1>Masa ayırt</h1>
  <p class="giris">Formu doldur, en geç bir saat içinde onaylayalım.</p>
  <form class="form" data-vayra-form="Rezervasyon">
    <label>Ad soyad<input name="ad" required autocomplete="name" /></label>
    <label>Telefon<input name="telefon" required inputmode="tel" autocomplete="tel" /></label>
    <div class="ikili">
      <label>Tarih<input name="tarih" type="date" required /></label>
      <label>Saat<input name="saat" type="time" required /></label>
    </div>
    <label>Kişi sayısı<select name="kisi"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5+</option></select></label>
    <label>Not<textarea name="not" rows="3" placeholder="Doğum günü, alerji, bebek arabası…"></textarea></label>
    <button class="dugme" type="submit">Gönder</button>
  </form>
</main>`),
    "stil.css": `:root {
  --zemin: #f6f1ea;
  --metin: #2a1d14;
  --soluk: #6b5444;
  --vurgu: #a0714f;
  --kart: #ffffff;
  --yaricap: 18px;
  --baslik-font: "Fraunces", Georgia, serif;
  --govde-font: "Inter", system-ui, sans-serif;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--zemin); color: var(--metin); font-family: var(--govde-font); line-height: 1.55; }
a { color: inherit; text-decoration: none; }
img { display: block; max-width: 100%; }
.ust { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 6vw; position: sticky; top: 0; background: color-mix(in srgb, var(--zemin) 92%, transparent); backdrop-filter: blur(8px); z-index: 5; }
.logo { font-family: var(--baslik-font); font-size: 22px; font-weight: 600; }
.ust nav { display: flex; gap: 22px; font-size: 14px; color: var(--soluk); }
.ust nav a.aktif, .ust nav a:hover { color: var(--metin); }
.dugme { display: inline-flex; align-items: center; justify-content: center; padding: 12px 20px; border-radius: 999px; background: var(--metin); color: var(--zemin); font-weight: 600; font-size: 14px; border: 0; cursor: pointer; }
.dugme.ikincil { background: transparent; color: var(--metin); border: 1px solid color-mix(in srgb, var(--metin) 25%, transparent); }
.dugme.kucuk { padding: 9px 16px; font-size: 13px; }
.kahraman { display: grid; grid-template-columns: 1.05fr 1fr; gap: 48px; align-items: center; padding: 40px 6vw 64px; }
.kahraman img { width: 100%; height: 460px; object-fit: cover; border-radius: var(--yaricap); }
.ust-baslik { color: var(--vurgu); font-size: 13px; letter-spacing: .02em; margin: 0 0 10px; }
h1, h2, h3 { font-family: var(--baslik-font); font-weight: 600; letter-spacing: -.02em; margin: 0; }
h1 { font-size: clamp(40px, 6vw, 72px); line-height: 1.02; }
h2 { font-size: 38px; }
.giris { color: var(--soluk); font-size: 17px; max-width: 520px; }
.eylemler { display: flex; gap: 10px; margin-top: 24px; }
.kartlar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; padding: 0 6vw 72px; }
.kartlar article { background: var(--kart); border-radius: var(--yaricap); overflow: hidden; padding-bottom: 18px; }
.kartlar img { height: 220px; width: 100%; object-fit: cover; }
.kartlar h3 { font-size: 22px; padding: 16px 18px 2px; }
.kartlar p { margin: 0; padding: 0 18px; color: var(--soluk); font-size: 14px; }
.kartlar span { display: block; padding: 10px 18px 0; color: var(--vurgu); font-weight: 600; }
.konum { display: grid; grid-template-columns: 1fr 1.3fr; gap: 40px; align-items: center; padding: 0 6vw 80px; }
.konum iframe { width: 100%; height: 340px; border: 0; border-radius: var(--yaricap); }
.dar { max-width: 760px; margin: 0 auto; padding: 40px 6vw 80px; }
.filtre { display: flex; gap: 8px; margin: 24px 0; flex-wrap: wrap; }
.filtre button { border: 1px solid color-mix(in srgb, var(--metin) 18%, transparent); background: transparent; border-radius: 999px; padding: 8px 16px; font: inherit; cursor: pointer; color: var(--metin); }
.filtre button.secili { background: var(--metin); color: var(--zemin); border-color: var(--metin); }
.menu { list-style: none; padding: 0; margin: 0; }
.menu li { display: grid; grid-template-columns: 1fr auto; gap: 2px 16px; padding: 18px 0; border-bottom: 1px solid color-mix(in srgb, var(--metin) 12%, transparent); }
.menu li span { font-family: var(--baslik-font); font-size: 22px; }
.menu li em { grid-column: 1; color: var(--soluk); font-style: normal; font-size: 14px; }
.menu li b { grid-row: 1 / span 2; grid-column: 2; align-self: center; color: var(--vurgu); }
.menu li.gizli { display: none; }
.form { display: grid; gap: 16px; margin-top: 28px; }
.form label { display: grid; gap: 6px; font-size: 14px; font-weight: 500; }
.form input, .form select, .form textarea { font: inherit; padding: 13px 14px; border-radius: 12px; border: 1px solid color-mix(in srgb, var(--metin) 18%, transparent); background: var(--kart); color: var(--metin); }
.ikili { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.alt { display: flex; justify-content: space-between; gap: 24px; padding: 40px 6vw; border-top: 1px solid color-mix(in srgb, var(--metin) 12%, transparent); color: var(--soluk); font-size: 14px; }
.alt p { margin: 4px 0 0; }
@media (max-width: 760px) {
  .ust nav { display: none; }
  .kahraman, .konum { grid-template-columns: 1fr; gap: 24px; }
  .kahraman img { height: 280px; }
  .kartlar { grid-template-columns: 1fr; }
  .alt { flex-direction: column; }
}
`,
    "app.js": `// Menü filtresi: kategori düğmeleri listeyi süzer.
document.querySelectorAll(".filtre button").forEach(function (dugme) {
  dugme.addEventListener("click", function () {
    document.querySelectorAll(".filtre button").forEach(function (b) { b.classList.remove("secili"); });
    dugme.classList.add("secili");
    var k = dugme.getAttribute("data-kategori");
    document.querySelectorAll(".menu li").forEach(function (li) {
      li.classList.toggle("gizli", k !== "hepsi" && li.getAttribute("data-kategori") !== k);
    });
  });
});
`,
  },
};
