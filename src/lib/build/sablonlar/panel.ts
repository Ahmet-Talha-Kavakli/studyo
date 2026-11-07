/* Şablon: Satış Paneli — web uygulaması: özet kartları, SVG grafik, filtrelenebilir sipariş tablosu, yeni sipariş formu. */

export const SATIS_PANELI = {
  id: "satis-paneli",
  ad: "Satış Paneli",
  tur: "uygulama" as const,
  aciklama: "Özet kartları, haftalık grafik ve filtrelenebilir sipariş tablosu",
  kapak: "/gercek/sc/sc-dash.webp",
  dosyalar: {
    "index.html": `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Satış Paneli</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <aside class="yan">
    <div class="marka">Kuzey Atölye</div>
    <a class="secili" href="#">Genel bakış</a><a href="#">Siparişler</a><a href="#">Ürünler</a><a href="#">Müşteriler</a>
  </aside>
  <main>
    <header class="baslik"><div><h1>Genel bakış</h1><p>Son 7 gün</p></div><button id="yeniAc" class="dugme">Yeni sipariş</button></header>
    <section class="ozet" id="ozet"></section>
    <section class="kart"><h2>Günlük ciro</h2><svg id="grafik" viewBox="0 0 700 220" preserveAspectRatio="none"></svg><div id="gunler" class="gunler"></div></section>
    <section class="kart">
      <div class="tablo-ust"><h2>Siparişler</h2><input id="ara" placeholder="Müşteri ya da ürün ara" /></div>
      <table><thead><tr><th>Müşteri</th><th>Ürün</th><th>Tutar</th><th>Durum</th></tr></thead><tbody id="satirlar"></tbody></table>
    </section>
  </main>
  <dialog id="yeni">
    <form method="dialog" id="yeniForm" class="form">
      <h2>Yeni sipariş</h2>
      <label>Müşteri<input name="musteri" required /></label>
      <label>Ürün<input name="urun" required /></label>
      <label>Tutar (TL)<input name="tutar" type="number" min="1" required /></label>
      <div class="eylem"><button value="iptal" formnovalidate class="dugme ikincil">Vazgeç</button><button value="ekle" class="dugme">Ekle</button></div>
    </form>
  </dialog>
  <script src="app.js"></script>
</body>
</html>
`,
    "stil.css": `:root { --zemin: #f5f6f8; --kart: #fff; --metin: #111827; --soluk: #6b7280; --vurgu: #4f46e5; --cizgi: #e5e7eb; }
* { box-sizing: border-box; }
body { margin: 0; display: grid; grid-template-columns: 220px 1fr; min-height: 100vh; background: var(--zemin); color: var(--metin); font-family: Inter, system-ui, sans-serif; }
.yan { background: #0f172a; color: #cbd5e1; padding: 22px 14px; display: flex; flex-direction: column; gap: 4px; }
.marka { color: #fff; font-weight: 700; font-size: 17px; padding: 0 10px 18px; }
.yan a { color: inherit; text-decoration: none; padding: 9px 10px; border-radius: 10px; font-size: 14px; }
.yan a.secili, .yan a:hover { background: rgba(255,255,255,.08); color: #fff; }
main { padding: 28px; display: grid; gap: 18px; align-content: start; }
.baslik { display: flex; justify-content: space-between; align-items: center; }
h1 { margin: 0; font-size: 26px; } h2 { margin: 0 0 14px; font-size: 16px; }
.baslik p { margin: 2px 0 0; color: var(--soluk); font-size: 14px; }
.dugme { border: 0; border-radius: 10px; padding: 10px 16px; font: inherit; font-weight: 600; background: var(--vurgu); color: #fff; cursor: pointer; }
.dugme.ikincil { background: #eef2ff; color: var(--vurgu); }
.ozet { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.ozet div, .kart { background: var(--kart); border-radius: 16px; padding: 18px; border: 1px solid var(--cizgi); }
.ozet small { color: var(--soluk); } .ozet b { display: block; font-size: 24px; margin-top: 4px; } .ozet em { font-style: normal; font-size: 12px; color: #059669; }
#grafik { width: 100%; height: 220px; }
.gunler { display: flex; justify-content: space-between; color: var(--soluk); font-size: 12px; margin-top: 6px; }
.tablo-ust { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.tablo-ust input { padding: 9px 12px; border: 1px solid var(--cizgi); border-radius: 10px; font: inherit; min-width: 240px; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th { text-align: left; color: var(--soluk); font-weight: 500; padding: 10px 8px; border-bottom: 1px solid var(--cizgi); }
td { padding: 12px 8px; border-bottom: 1px solid var(--cizgi); }
.durum { padding: 3px 9px; border-radius: 99px; font-size: 12px; font-weight: 600; }
.durum.teslim { background: #d1fae5; color: #065f46; } .durum.yolda { background: #e0e7ff; color: #3730a3; } .durum.bekliyor { background: #fef3c7; color: #92400e; }
dialog { border: 0; border-radius: 18px; padding: 0; width: min(420px, 92vw); }
dialog::backdrop { background: rgba(15,23,42,.4); }
.form { display: grid; gap: 12px; padding: 22px; }
.form label { display: grid; gap: 6px; font-size: 14px; }
.form input { padding: 10px 12px; border: 1px solid var(--cizgi); border-radius: 10px; font: inherit; }
.eylem { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
@media (max-width: 860px) { body { grid-template-columns: 1fr; } .yan { display: none; } .ozet { grid-template-columns: 1fr 1fr; } .tablo-ust input { min-width: 0; width: 100%; } }
`,
    "app.js": `// Satış Paneli — veriler cihazda saklanır; yeni sipariş ekle, ara, grafiği güncelle.
var S = JSON.parse(localStorage.getItem("satis-paneli") || "null") || {
  gunluk: [18400, 22100, 19800, 26500, 31200, 28900, 34600],
  siparisler: [
    { musteri: "Elif Yıldız", urun: "Seramik kupa seti", tutar: 1240, durum: "teslim" },
    { musteri: "Mert Kaya", urun: "Keten masa örtüsü", tutar: 890, durum: "yolda" },
    { musteri: "Zeynep Arslan", urun: "El yapımı vazo", tutar: 1560, durum: "bekliyor" },
    { musteri: "Can Demir", urun: "Ahşap tepsi", tutar: 640, durum: "teslim" },
    { musteri: "Deniz Acar", urun: "Mum seti", tutar: 420, durum: "yolda" }
  ]
};
var DURUM = { teslim: "Teslim edildi", yolda: "Yolda", bekliyor: "Bekliyor" };
var TL = function (n) { return n.toLocaleString("tr-TR") + " TL"; };
function kaydet() { localStorage.setItem("satis-paneli", JSON.stringify(S)); }
function ozet() {
  var ciro = S.gunluk.reduce(function (a, b) { return a + b; }, 0);
  var adet = S.siparisler.length;
  document.getElementById("ozet").innerHTML = [["Ciro", TL(ciro), "geçen haftaya göre yüzde 12 fazla"], ["Sipariş", adet, "bugün 3 yeni"], ["Ortalama sepet", TL(Math.round(S.siparisler.reduce(function (a, s) { return a + s.tutar; }, 0) / adet)), "istikrarlı"], ["Dönüşüm", "yüzde 3,4", "hedefin üstünde"]]
    .map(function (k) { return "<div><small>" + k[0] + "</small><b>" + k[1] + "</b><em>" + k[2] + "</em></div>"; }).join("");
}
function grafik() {
  var g = S.gunluk, enC = Math.max.apply(null, g) * 1.1, w = 700, h = 220;
  var nokta = g.map(function (v, i) { return [i * (w / (g.length - 1)), h - (v / enC) * h]; });
  var yol = nokta.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
  document.getElementById("grafik").innerHTML = '<defs><linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f46e5" stop-opacity=".25"/><stop offset="1" stop-color="#4f46e5" stop-opacity="0"/></linearGradient></defs>'
    + '<path d="' + yol + " L" + w + " " + h + " L0 " + h + ' Z" fill="url(#d)"/><path d="' + yol + '" fill="none" stroke="#4f46e5" stroke-width="3"/>'
    + nokta.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="#4f46e5"/>'; }).join("");
  document.getElementById("gunler").innerHTML = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(function (d) { return "<span>" + d + "</span>"; }).join("");
}
function tablo() {
  var q = document.getElementById("ara").value.toLocaleLowerCase("tr-TR");
  document.getElementById("satirlar").innerHTML = S.siparisler.filter(function (s) { return (s.musteri + " " + s.urun).toLocaleLowerCase("tr-TR").includes(q); })
    .map(function (s) { return "<tr><td>" + s.musteri + "</td><td>" + s.urun + "</td><td>" + TL(s.tutar) + '</td><td><span class="durum ' + s.durum + '">' + DURUM[s.durum] + "</span></td></tr>"; }).join("");
}
document.getElementById("ara").addEventListener("input", tablo);
var dlg = document.getElementById("yeni");
document.getElementById("yeniAc").addEventListener("click", function () { dlg.showModal(); });
document.getElementById("yeniForm").addEventListener("submit", function (e) {
  if (e.submitter && e.submitter.value === "ekle") {
    var f = new FormData(e.target);
    S.siparisler.unshift({ musteri: f.get("musteri"), urun: f.get("urun"), tutar: Number(f.get("tutar")), durum: "bekliyor" });
    S.gunluk[S.gunluk.length - 1] += Number(f.get("tutar"));
    kaydet(); ozet(); grafik(); tablo(); e.target.reset();
  }
});
ozet(); grafik(); tablo();
`,
  },
};
