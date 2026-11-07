/* Şablon: Tutarlı — yapay zekâ destekli ön muhasebe aracının tanıtım sitesi. Kahraman, özellikler, aylık ve yıllık anahtarlı
 * fiyatlandırma, müşteri yorumları, SSS akordeonu, "bekleme_listesi" tablosuna yazan form ve vayra.ai.sohbet ile ürün
 * sorularını yanıtlayan "Sor" kutusu. Sayfalar: tanıtım, fiyatlar (karşılaştırma), güvenlik ve KVKK. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";

const PLANLAR = [
  { id: "baslangic", ad: "Başlangıç", aylik: 349, yillik: 3490, kim: "Serbest çalışanlar ve tek kişilik işletmeler", ozellik: ["Ayda 60 fiş ve fatura okuma", "1 kullanıcı", "e-Arşiv fatura kesme", "1 banka hesabı eşleştirme", "Mali müşavire aylık rapor"] },
  { id: "isletme", ad: "İşletme", aylik: 899, yillik: 8990, kim: "Ekibi olan küçük ve orta işletmeler", one: true, ozellik: ["Sınırsız fiş ve fatura okuma", "5 kullanıcı", "e-Fatura ve e-Arşiv", "3 banka hesabı eşleştirme", "90 günlük nakit akışı tahmini", "Tahsilat hatırlatmaları"] },
  { id: "kurumsal", ad: "Kurumsal", aylik: 2290, yillik: 22900, kim: "Birden çok şirketi ve onay akışı olanlar", ozellik: ["İşletme planındaki her şey", "Sınırsız kullanıcı ve şirket", "Harcama onay akışları", "Sınırsız banka hesabı", "API erişimi", "Öncelikli destek"] },
];

const SSS = [
  ["Tutarlı ne zaman kullanıma açılıyor?", "Kapalı beta 2026 sonbaharında 140 işletmeyle sürüyor. Genel kullanım 2027'nin ilk çeyreğinde açılacak; bekleme listesindekiler sırayla davet edilir ve ilk üç ay yüzde 50 indirim alır."],
  ["Mali müşavirimin yerini alır mı?", "Hayır. Tutarlı fiş ve faturaları düzenli tutar, eksikleri gösterir; beyannameler ve resmî defterler mali müşavirinde kalır. Mali müşavirine kendi giriş hakkı verirsin, ay sonunda aktarım dosyasını tek tıkla alır."],
  ["Verilerim nerede saklanıyor?", "Bütün veriler İstanbul'daki veri merkezlerinde, aktarımda ve depolamada şifreli tutulur. Fiş görüntülerin yapay zekâ modellerini eğitmek için kullanılmaz. Ayrıntılar güvenlik sayfasında."],
  ["e-Fatura mükellefi değilim, yine de kullanabilir miyim?", "Evet. e-Arşiv fatura kesebilir, gelen kâğıt ya da PDF faturaları fotoğrafla kaydedebilirsin. e-Fatura'ya geçtiğinde aynı hesapla devam edersin."],
  ["Bankamı bağlayabilir miyim?", "Türkiye'deki bankaların hesap hareketlerini açık bankacılık izniyle ya da ekstre dosyasıyla alıyoruz. Hareketler faturalarla kendiliğinden eşleşir; eşleşmeyenleri sen onaylarsın."],
  ["Fiyatlar lansmanda değişecek mi?", "Sayfadaki fiyatlar lansman fiyatlarıdır ve KDV hariçtir. Bekleme listesinden katılanlar için ilk yıl fiyat sabit kalır."],
];

const YORUMLAR = [
  { ad: "Ece Dinçer", rol: "Kurucu, Dinçer Mimarlık", foto: "/gercek/paz/av-hana.webp", metin: "Ay sonunda mali müşavirime fiş fotoğrafı yetiştirmekle uğraşmıyorum. Telefonla çekiyorum, Tutarlı tutarı da KDV'yi de doğru ayırıyor." },
  { ad: "Burak Öztürk", rol: "Kafe sahibi, Kadıköy", foto: "/gercek/paz/av-niko.webp", metin: "Tedarikçi faturaları banka hareketleriyle kendiliğinden eşleşiyor. Hangi ödemenin açıkta kaldığını ilk kez tek ekranda görüyorum." },
  { ad: "Selin Arca", rol: "Serbest mali müşavir", foto: "/gercek/paz/av-valentina.webp", metin: "Müşterilerimden belgeler düzenli ve eksiksiz geliyor. Aktarım dosyası sayesinde ay sonu kapanışı iki günden yarım güne indi." },
];

const TABLOLAR: Record<string, SablonTablo> = {
  bekleme_listesi: {
    aciklama: "Lansman bekleme listesi. Ziyaretçi ekleyebilir ama okuyamaz; aynı e-posta ikinci kez eklenemez.",
    kurallar: { okuma: "kapali", ekleme: "herkes", duzenleme: "kapali" },
    sema: [
      { ad: "eposta", tur: "eposta", zorunlu: true, benzersiz: true },
      { ad: "ad", tur: "metin", zorunlu: true },
      { ad: "sirket", tur: "metin" },
      { ad: "calisan", tur: "secim", secenekler: ["Yalnız ben", "2 ile 10", "11 ile 50", "51 ve üzeri"] },
      { ad: "yontem", tur: "secim", secenekler: ["Excel ya da defter", "Muhasebe programı", "Mali müşavirim tutuyor", "Henüz tutmuyorum"], aciklama: "Şu an kayıtları nasıl tutuyor" },
      { ad: "plan", tur: "secim", secenekler: ["Başlangıç", "İşletme", "Kurumsal", "Karar vermedim"] },
      { ad: "izin", tur: "mantiksal", zorunlu: true, aciklama: "Lansman e-postası izni" },
      { ad: "kaynak", tur: "metin", aciklama: "Formun gönderildiği sayfa" },
    ],
    kayitlar: [],
  },
};

const BILGI = [
  "Tutarlı, Türkiye'deki küçük ve orta işletmeler için yapay zekâ destekli bir ön muhasebe uygulamasıdır. Henüz kapalı betada; genel kullanım 2027'nin ilk çeyreğinde açılacak.",
  "Özellikler: fiş ve fatura fotoğrafından tutar, tarih, tedarikçi, KDV oranı ve tutarını okuma; gider kategorisi önerme; banka hareketlerini faturalarla eşleştirme; anlaşmalı özel entegratör üzerinden e-Fatura ve e-Arşiv kesme; 90 günlük nakit akışı tahmini; vadesi geçen alacaklar için e-posta ya da WhatsApp hatırlatması; mali müşavire ayrı giriş ve aylık aktarım dosyası.",
  "Planlar (KDV hariç): " + PLANLAR.map((p) => `${p.ad} aylık ${p.aylik} TL ya da yıllık ${p.yillik} TL (${p.kim}; ${p.ozellik.join(", ")})`).join(". ") + ". Yıllık ödemede iki ay ücretsizdir.",
  "Bekleme listesine katılanlar sırayla davet edilir, ilk üç ay yüzde 50 indirim alır ve ilk yıl fiyatları sabit kalır.",
  "Güvenlik: veriler İstanbul'daki veri merkezlerinde tutulur, aktarımda TLS 1.3 ve depolamada AES-256 ile şifrelenir, iki adımlı doğrulama ve rol bazlı yetki vardır, fiş görüntüleri yapay zekâ modeli eğitmek için kullanılmaz, Tutarlı KVKK kapsamında veri işleyendir.",
  "Tutarlı mali müşavirin yerini almaz; beyanname vermez, resmî defter tutmaz. İletişim: merhaba@tutarli.com.tr",
].join("\n");

const ust = (aktif: string) => `<a class="atla" href="#icerik">İçeriğe geç</a>
<header class="ust">
  <a class="logo" href="index.html" aria-label="Tutarlı ana sayfa"><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="3" width="26" height="26" rx="8" fill="currentColor"/><path d="M10 12h12M16 12v10M11 20.5l2.5 2.5L22 15" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>tutarlı</a>
  <nav class="menu" data-menu aria-label="Ana menü">
${[["index.html#ozellikler", "Özellikler"], ["fiyatlar.html", "Fiyatlar"], ["guvenlik.html", "Güvenlik"], ["index.html#sss", "SSS"]].map(([h, a]) => `    <a href="${h}"${h === aktif ? ' aria-current="page"' : ""}>${a}</a>`).join("\n")}
  </nav>
  <a class="dugme kucuk" href="index.html#bekleme">Bekleme listesine katıl</a>
  <button class="menu-dugme" type="button" data-menu-ac aria-expanded="false" aria-label="Menüyü aç"><span></span><span></span></button>
</header>`;

const alt = `<footer class="alt">
  <div class="alt-ic">
    <div><a class="logo" href="index.html"><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="3" width="26" height="26" rx="8" fill="currentColor"/><path d="M10 12h12M16 12v10M11 20.5l2.5 2.5L22 15" fill="none" stroke="#0c1222" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>tutarlı</a><p>Fişten bilançoya, ön muhasebe kendiliğinden tutarlı.</p></div>
    <div><h4>Ürün</h4><p><a href="index.html#ozellikler">Özellikler</a></p><p><a href="fiyatlar.html">Fiyatlar</a></p><p><a href="index.html#sss">Sık sorulanlar</a></p></div>
    <div><h4>Şirket</h4><p><a href="guvenlik.html">Güvenlik ve KVKK</a></p><p><a href="mailto:merhaba@tutarli.com.tr">merhaba@tutarli.com.tr</a></p><p>Maslak, İstanbul</p></div>
  </div>
  <p class="alt-not">Tutarlı bir ön muhasebe aracıdır; vergi danışmanlığı yapmaz. Beyanname ve resmî defterler için mali müşavirinle çalış.</p>
</footer>`;

const SOR = `<button class="sor-ac" type="button" id="sorAc" aria-expanded="false" aria-controls="sorPanel"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>Tutarlı'ya sor</button>
<section class="sor" id="sorPanel" role="dialog" aria-modal="false" aria-labelledby="sorBaslik" hidden>
  <header><div><h2 id="sorBaslik">Tutarlı'ya sor</h2><p>Ürün, fiyatlar ve güvenlik hakkında yanıtlar. Yapay zekâ yanıtlar; emin olmadığında söyler.</p></div><button type="button" class="kapat" id="sorKapat" aria-label="Kapat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></header>
  <div class="sor-akis" id="sorAkis" aria-live="polite">
    <div class="balon asistan">Merhaba! Tutarlı'nın özelliklerini, fiyatlarını ya da verilerin nasıl korunduğunu sorabilirsin.</div>
  </div>
  <div class="oneriler" id="sorOneri"><button type="button">Hangi plan bana uygun?</button><button type="button">e-Fatura kesebilir miyim?</button><button type="button">Verilerim nerede tutuluyor?</button></div>
  <form class="sor-form" id="sorForm"><label class="atla" for="sorGirdi">Sorun</label><input id="sorGirdi" maxlength="400" placeholder="Sorunu yaz" autocomplete="off" required /><button type="submit" aria-label="Gönder"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></form>
</section>`;

const sayfa = (dosya: string, baslik: string, aciklama: string, govde: string) => `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${baslik}</title>
  <meta name="description" content="${aciklama}" />
  <meta name="theme-color" content="#f6f6f1" />
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body data-sayfa="${dosya.replace(".html", "")}">
${ust(dosya)}
<main id="icerik">
${govde}
</main>
${alt}
${SOR}
<script src="app.js"></script>
</body>
</html>
`;

const tik = '<svg class="tik" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 10.5l3.2 3.2L15 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const fiyatKartlari = `<div class="donem" role="radiogroup" aria-label="Ödeme dönemi">
    <button type="button" role="radio" aria-checked="true" data-donem="aylik">Aylık</button>
    <button type="button" role="radio" aria-checked="false" data-donem="yillik">Yıllık <span>2 ay bizden</span></button>
  </div>
  <div class="planlar">
${PLANLAR.map((p) => `    <article class="plan${p.one ? " one" : ""}">
      ${p.one ? '<span class="plan-rozet">En çok seçilen</span>' : ""}
      <h3>${p.ad}</h3>
      <p class="kim">${p.kim}</p>
      <p class="fiyat" data-aylik="${p.aylik}" data-yillik="${p.yillik}"><b>${p.aylik.toLocaleString("tr-TR")} TL</b><span>aylık, KDV hariç</span></p>
      <p class="yillik-not" data-yillik-not="${p.yillik}" hidden></p>
      <ul>${p.ozellik.map((o) => `<li>${tik}${o}</li>`).join("")}</ul>
      <a class="dugme${p.one ? "" : " ikincil"}" href="index.html#bekleme" data-plan="${p.ad}">Listeye katıl</a>
    </article>`).join("\n")}
  </div>`;

const BEKLEME = `<section class="bekleme" id="bekleme">
  <div class="kapsayici bekleme-ic">
    <div>
      <h2>Lansmanda ilk sıradan gir.</h2>
      <p>Bekleme listesindekiler sırayla davet edilir, ilk üç ay yüzde 50 indirim alır ve ilk yıl fiyatı sabit kalır.</p>
      <ul class="liste-artilar"><li>${tik}Kredi kartı istemiyoruz</li><li>${tik}Davet gelince 30 gün ücretsiz dene</li><li>${tik}İstediğin an listeden çık</li></ul>
    </div>
    <form class="form" id="bekleForm" novalidate>
      <div class="ikili"><label>Ad soyad<input name="ad" required autocomplete="name" /></label><label>İş e-postası<input name="eposta" type="email" required autocomplete="email" inputmode="email" /></label></div>
      <div class="ikili"><label>Şirket (isteğe bağlı)<input name="sirket" autocomplete="organization" /></label>
        <label>Çalışan sayısı<select name="calisan" required><option value="">Seç</option><option>Yalnız ben</option><option>2 ile 10</option><option>11 ile 50</option><option>51 ve üzeri</option></select></label></div>
      <div class="ikili"><label>Kayıtları şu an nasıl tutuyorsun?<select name="yontem"><option value="">Seç</option><option>Excel ya da defter</option><option>Muhasebe programı</option><option>Mali müşavirim tutuyor</option><option>Henüz tutmuyorum</option></select></label>
        <label>İlgilendiğin plan<select name="plan" id="planSec"><option>Karar vermedim</option>${PLANLAR.map((p) => `<option>${p.ad}</option>`).join("")}</select></label></div>
      <label class="onay"><input type="checkbox" name="izin" required /> <span>Davet ve lansman duyuruları için e-posta almayı kabul ediyorum. Ayrıntılar <a href="guvenlik.html#kvkk">aydınlatma metninde</a>.</span></label>
      <div id="bekleMesaj" class="mesaj" role="status" aria-live="polite" hidden></div>
      <button class="dugme" type="submit" id="bekleGonder">Listeye katıl</button>
    </form>
  </div>
</section>`;

const STIL = String.raw`/* Tutarlı — kırık beyaz zemin, gece mavisi metin, kobalt ve nane vurgu; Sora başlıklar, Inter gövde. */
:root {
  --zemin: #f6f6f1; --kart: #ffffff; --murekkep: #0c1222; --soluk: #535b6e; --kobalt: #2d4cf0; --kobalt-koyu: #1f37c4; --nane: #10b981; --nane-acik: #d9f7ea;
  --limon: #e3f56b; --cizgi: rgba(12, 18, 34, .1); --yaricap: 20px; --baslik: "Sora", system-ui, sans-serif; --govde: "Inter", system-ui, sans-serif;
}
[hidden] { display: none !important; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--zemin); color: var(--murekkep); font: 16px/1.6 var(--govde); -webkit-font-smoothing: antialiased; }
img, svg { display: block; max-width: 100%; }
a { color: inherit; }
h1, h2, h3 { font-family: var(--baslik); margin: 0; letter-spacing: -.035em; line-height: 1.08; }
:focus-visible { outline: 3px solid var(--kobalt); outline-offset: 2px; border-radius: 8px; }
.atla { position: absolute; left: -999px; top: 8px; background: var(--murekkep); color: #fff; padding: 8px 14px; border-radius: 10px; z-index: 80; }
.atla:focus { left: 12px; }
.kapsayici { max-width: 1200px; margin: 0 auto; padding: 0 clamp(16px, 5vw, 40px); }

.ust { position: sticky; top: 0; z-index: 40; display: flex; align-items: center; gap: 22px; padding: 12px clamp(16px, 5vw, 48px); background: color-mix(in srgb, var(--zemin) 86%, transparent); backdrop-filter: blur(14px); border-bottom: 1px solid var(--cizgi); }
.logo { display: inline-flex; align-items: center; gap: 9px; font-family: var(--baslik); font-weight: 800; font-size: 21px; letter-spacing: -.04em; text-decoration: none; color: var(--murekkep); }
.logo svg { width: 28px; height: 28px; color: var(--kobalt); }
.menu { display: flex; gap: 4px; margin-left: auto; }
.menu a { text-decoration: none; padding: 8px 13px; border-radius: 10px; font-weight: 500; font-size: 14.5px; color: var(--soluk); }
.menu a:hover, .menu a[aria-current] { color: var(--murekkep); background: rgba(12, 18, 34, .05); }
.menu-dugme { display: none; width: 42px; height: 42px; border: 1px solid var(--cizgi); background: var(--kart); border-radius: 12px; cursor: pointer; flex-direction: column; justify-content: center; align-items: center; gap: 6px; }
.menu-dugme span { width: 18px; height: 2px; background: var(--murekkep); border-radius: 2px; }
.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 50px; padding: 12px 22px; border-radius: 14px; border: 0; background: var(--kobalt); color: #fff; font: 600 15px/1 var(--govde); text-decoration: none; cursor: pointer; transition: background .2s, transform .2s; }
.dugme:hover { background: var(--kobalt-koyu); }
.dugme:active { transform: scale(.98); }
.dugme[disabled] { opacity: .55; cursor: not-allowed; }
.dugme.kucuk { min-height: 40px; padding: 9px 16px; font-size: 14px; border-radius: 12px; }
.dugme.ikincil { background: var(--kart); color: var(--murekkep); border: 1px solid rgba(12, 18, 34, .18); }
.dugme.ikincil:hover { border-color: var(--murekkep); }

/* Kahraman */
.kahraman { display: grid; grid-template-columns: 1fr 1.02fr; gap: clamp(28px, 5vw, 64px); align-items: center; padding-block: clamp(40px, 6vw, 88px); }
.kahraman > * { min-width: 0; }
.duyuru { display: inline-flex; align-items: center; gap: 10px; padding: 6px 12px 6px 6px; border-radius: 99px; background: var(--kart); border: 1px solid var(--cizgi); font-size: 13.5px; font-weight: 500; color: var(--soluk); text-decoration: none; }
.duyuru b { background: var(--limon); color: var(--murekkep); padding: 3px 9px; border-radius: 99px; font-size: 12px; }
.kahraman h1 { font-size: clamp(40px, 5.6vw, 70px); margin: 20px 0 18px; }
.kahraman h1 em { font-style: normal; color: var(--kobalt); }
.giris { font-size: 18.5px; color: var(--soluk); max-width: 540px; margin: 0 0 28px; }
.eylemler { display: flex; flex-wrap: wrap; gap: 12px; }
.kucuk-not { margin-top: 18px; font-size: 13.5px; color: var(--soluk); }
.urun { position: relative; background: linear-gradient(160deg, #e6eaff, #eefaf4); border-radius: 28px; padding: clamp(18px, 3vw, 30px); border: 1px solid var(--cizgi); }
.fis { position: absolute; left: clamp(14px, 3vw, 28px); top: clamp(14px, 3vw, 28px); width: 42%; background: #fffdf7; border-radius: 10px; padding: 14px 12px 18px; font: 11px/1.5 "Courier New", monospace; color: #3d3d3d; transform: rotate(-4deg); overflow: hidden; border: 1px solid #ece6d8; }
.fis b { display: block; text-align: center; font-size: 12px; margin-bottom: 6px; }
.fis .s { display: flex; justify-content: space-between; }
.fis .t { border-top: 1px dashed #bbb; margin-top: 6px; padding-top: 6px; font-weight: 700; }
.fis::after { content: ""; position: absolute; left: 0; right: 0; height: 3px; background: var(--nane); opacity: .8; animation: tara 2.6s ease-in-out infinite; }
@keyframes tara { 0% { top: 6%; } 50% { top: 92%; } 100% { top: 6%; } }
.okunan { margin-left: 36%; background: var(--kart); border-radius: 18px; border: 1px solid var(--cizgi); padding: 18px; position: relative; }
.okunan-ust { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-weight: 600; font-size: 14px; }
.guven { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 99px; background: var(--nane-acik); color: #05704c; font-size: 12px; font-weight: 700; }
.alan-satir { display: grid; grid-template-columns: auto 1fr; gap: 12px; padding: 9px 0; border-top: 1px solid var(--cizgi); font-size: 14px; }
.alan-satir span { color: var(--soluk); }
.alan-satir b { font-weight: 600; text-align: right; justify-self: end; }
.alan-satir .kat { background: #eef0ff; color: var(--kobalt-koyu); padding: 2px 9px; border-radius: 8px; font-size: 13px; }
.akis-kart { margin-top: 14px; background: var(--murekkep); color: #cfd6ea; border-radius: 18px; padding: 16px 18px; }
.akis-kart .ust-s { display: flex; justify-content: space-between; font-size: 13px; }
.akis-kart b { color: #fff; font-family: var(--baslik); font-size: 22px; display: block; margin-top: 2px; }
.akis-kart svg { width: 100%; height: 70px; margin-top: 8px; }
.akis-kart .ust-s em { font-style: normal; color: var(--limon); font-weight: 600; }

.bolum { padding-block: clamp(56px, 8vw, 110px); }
.bolum-ust { max-width: 680px; margin-bottom: 40px; }
.bolum-ust .k { color: var(--kobalt); font-weight: 600; font-size: 14px; margin: 0 0 10px; }
.bolum-ust h2 { font-size: clamp(30px, 4vw, 48px); }
.bolum-ust p { color: var(--soluk); font-size: 17px; margin: 14px 0 0; }
.ozellik-izgara { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.ozellik { background: var(--kart); border: 1px solid var(--cizgi); border-radius: var(--yaricap); padding: 26px; }
.ozellik svg { width: 44px; height: 44px; padding: 10px; border-radius: 12px; background: #eef0ff; color: var(--kobalt); margin-bottom: 18px; }
.ozellik:nth-child(3n+2) svg { background: var(--nane-acik); color: #05704c; }
.ozellik:nth-child(3n) svg { background: #f6fbd2; color: #5c6a00; }
.ozellik h3 { font-size: 19px; margin-bottom: 8px; letter-spacing: -.02em; }
.ozellik p { margin: 0; color: var(--soluk); font-size: 15px; }
.adimlar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; counter-reset: a; }
.adimlar div { border-top: 2px solid var(--murekkep); padding-top: 18px; }
.adimlar div::before { counter-increment: a; content: "0" counter(a); font-family: var(--baslik); font-weight: 700; color: var(--kobalt); }
.adimlar h3 { font-size: 21px; margin: 8px 0 6px; }
.adimlar p { margin: 0; color: var(--soluk); }

/* Fiyatlar */
.donem { display: inline-flex; padding: 4px; border-radius: 14px; background: var(--kart); border: 1px solid var(--cizgi); margin-bottom: 26px; }
.donem button { min-height: 42px; padding: 8px 18px; border: 0; border-radius: 10px; background: transparent; font: 600 14.5px var(--govde); color: var(--soluk); cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
.donem button span { font-size: 12px; background: var(--nane-acik); color: #05704c; padding: 2px 8px; border-radius: 99px; }
.donem button[aria-checked="true"] { background: var(--murekkep); color: #fff; }
.planlar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; align-items: stretch; }
.plan { position: relative; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 24px; padding: 28px; display: flex; flex-direction: column; }
.plan.one { border: 2px solid var(--kobalt); }
.plan-rozet { position: absolute; top: -13px; left: 24px; background: var(--kobalt); color: #fff; font-size: 12px; font-weight: 700; padding: 5px 11px; border-radius: 99px; }
.plan h3 { font-size: 22px; }
.plan .kim { color: var(--soluk); font-size: 14.5px; margin: 6px 0 18px; min-height: 44px; }
.plan .fiyat { margin: 0; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.plan .fiyat b { font-family: var(--baslik); font-size: 38px; letter-spacing: -.04em; }
.plan .fiyat span { color: var(--soluk); font-size: 14px; }
.yillik-not { margin: 4px 0 0; font-size: 13.5px; color: #05704c; font-weight: 600; }
.plan ul { list-style: none; padding: 0; margin: 22px 0 26px; display: grid; gap: 10px; flex: 1; font-size: 15px; }
.plan li { display: flex; gap: 10px; align-items: flex-start; }
.tik { width: 20px; height: 20px; flex: none; color: var(--nane); }
.karsilastir { width: 100%; border-collapse: collapse; background: var(--kart); border-radius: 18px; overflow: hidden; font-size: 15px; }
.karsilastir th, .karsilastir td { padding: 14px 16px; text-align: left; border-bottom: 1px solid var(--cizgi); }
.karsilastir thead th { font-family: var(--baslik); font-size: 16px; background: #fbfbf8; }
.karsilastir td:not(:first-child), .karsilastir th:not(:first-child) { text-align: center; }
.karsilastir .tik { margin: 0 auto; }
.karsilastir .yok { color: #9aa0ad; }
.karsilastir tr.grup td { background: #f1f2ec; font-weight: 700; font-size: 13.5px; }
.tablo-kap { overflow-x: auto; border-radius: 18px; border: 1px solid var(--cizgi); }

/* Yorumlar */
.yorumlar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.yorum { margin: 0; background: var(--kart); border: 1px solid var(--cizgi); border-radius: var(--yaricap); padding: 26px; display: flex; flex-direction: column; gap: 22px; }
.yorum blockquote { margin: 0; font-size: 17px; line-height: 1.55; flex: 1; }
.yorum figcaption { display: flex; align-items: center; gap: 12px; font-size: 14px; }
.yorum img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; object-position: top; }
.yorum b { display: block; }
.yorum span { color: var(--soluk); }
.beta-not { margin-top: 14px; font-size: 13px; color: var(--soluk); }

/* SSS */
.sss { display: grid; gap: 10px; max-width: 860px; }
.sss details { background: var(--kart); border: 1px solid var(--cizgi); border-radius: 16px; }
.sss summary { list-style: none; cursor: pointer; padding: 20px 56px 20px 22px; font-weight: 600; font-size: 16.5px; position: relative; }
.sss summary::-webkit-details-marker { display: none; }
.sss summary::after { content: ""; position: absolute; right: 22px; top: 50%; width: 12px; height: 12px; margin-top: -8px; border-right: 2px solid var(--soluk); border-bottom: 2px solid var(--soluk); transform: rotate(45deg); transition: transform .2s; }
.sss details[open] summary::after { transform: rotate(-135deg); margin-top: -2px; }
.sss details p { margin: 0; padding: 0 22px 20px; color: var(--soluk); }

/* Bekleme listesi */
.bekleme { background: var(--murekkep); color: #cdd3e3; padding-block: clamp(56px, 8vw, 100px); }
.bekleme-ic { display: grid; grid-template-columns: .9fr 1.1fr; gap: clamp(28px, 5vw, 64px); align-items: start; }
.bekleme h2 { color: #fff; font-size: clamp(32px, 4.2vw, 50px); }
.bekleme p { font-size: 17px; }
.liste-artilar { list-style: none; padding: 0; margin: 24px 0 0; display: grid; gap: 10px; }
.liste-artilar li { display: flex; gap: 10px; color: #fff; }
.liste-artilar .tik { color: var(--limon); }
.form { background: var(--kart); color: var(--murekkep); border-radius: 24px; padding: clamp(20px, 3vw, 30px); display: grid; gap: 14px; }
.ikili { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form label { display: grid; gap: 6px; font-weight: 600; font-size: 14px; }
.form input, .form select { width: 100%; min-height: 48px; padding: 11px 13px; border-radius: 12px; border: 1px solid rgba(12, 18, 34, .2); background: #fff; color: inherit; font: 500 16px var(--govde); }
.form input:focus, .form select:focus { outline: none; border-color: var(--kobalt); box-shadow: 0 0 0 3px #e3e8ff; }
.onay { display: flex !important; gap: 10px; align-items: flex-start; font-weight: 500 !important; color: var(--soluk); }
.onay input { width: 20px; min-height: 20px !important; height: 20px; margin-top: 2px; accent-color: var(--kobalt); flex: none; }
.mesaj { border-radius: 12px; padding: 13px 15px; font-size: 14.5px; }
.mesaj b { display: block; }
.mesaj.hata { background: #fde7e4; color: #8b1d12; }
.mesaj.tamam { background: var(--nane-acik); color: #05583c; }
.mesaj.bilgi { background: #fff6d6; color: #634a00; }

/* Metin sayfası */
.metin { max-width: 820px; padding-block: clamp(40px, 6vw, 80px); }
.metin h1 { font-size: clamp(36px, 5vw, 56px); margin-bottom: 16px; }
.metin h2 { font-size: 24px; margin: 40px 0 10px; letter-spacing: -.02em; }
.metin p, .metin li { color: var(--soluk); }
.guven-izgara { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 28px; }
.guven-izgara div { background: var(--kart); border: 1px solid var(--cizgi); border-radius: 18px; padding: 20px; }
.guven-izgara b { display: block; font-family: var(--baslik); font-size: 17px; margin-bottom: 4px; }
.guven-izgara span { color: var(--soluk); font-size: 14.5px; }

/* Sor kutusu */
.sor-ac { position: fixed; right: 20px; bottom: 20px; z-index: 60; display: inline-flex; align-items: center; gap: 8px; min-height: 52px; padding: 12px 18px; border-radius: 99px; border: 0; background: var(--murekkep); color: #fff; font: 600 15px var(--govde); cursor: pointer; }
.sor-ac svg { width: 20px; height: 20px; color: var(--limon); }
.sor-ac[aria-expanded="true"] { display: none; }
.sor { position: fixed; right: 20px; bottom: 20px; z-index: 70; width: min(400px, calc(100vw - 24px)); height: min(600px, calc(100vh - 100px)); display: flex; flex-direction: column; background: var(--kart); border: 1px solid rgba(12, 18, 34, .16); border-radius: 22px; overflow: hidden; }
.sor[hidden] { display: none; }
.sor header { display: flex; gap: 12px; align-items: flex-start; padding: 18px 18px 14px; border-bottom: 1px solid var(--cizgi); }
.sor h2 { font-size: 18px; letter-spacing: -.02em; }
.sor header p { margin: 4px 0 0; font-size: 13px; color: var(--soluk); line-height: 1.45; }
.kapat { margin-left: auto; width: 38px; height: 38px; flex: none; border: 0; border-radius: 10px; background: #f1f2ee; cursor: pointer; display: grid; place-items: center; color: var(--murekkep); }
.kapat svg { width: 18px; }
.sor-akis { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.balon { max-width: 88%; padding: 11px 14px; border-radius: 16px; font-size: 14.5px; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word; }
.balon.asistan { background: #f1f2ee; border-bottom-left-radius: 6px; }
.balon.kullanici { align-self: flex-end; background: var(--kobalt); color: #fff; border-bottom-right-radius: 6px; }
.balon.hata { background: #fde7e4; color: #8b1d12; }
.balon.yaziyor { color: var(--soluk); }
.balon.yaziyor i { display: inline-block; width: 6px; height: 6px; margin: 0 2px; border-radius: 50%; background: currentColor; animation: nokta 1s infinite; }
.balon.yaziyor i:nth-child(2) { animation-delay: .15s; } .balon.yaziyor i:nth-child(3) { animation-delay: .3s; }
@keyframes nokta { 50% { opacity: .2; } }
.oneriler { display: flex; gap: 6px; flex-wrap: wrap; padding: 0 16px 10px; }
.oneriler button { border: 1px solid var(--cizgi); background: #fff; border-radius: 99px; padding: 7px 12px; font: 500 13px var(--govde); cursor: pointer; color: var(--murekkep); }
.sor-form { display: flex; gap: 8px; padding: 12px; border-top: 1px solid var(--cizgi); }
.sor-form input { flex: 1; min-width: 0; min-height: 46px; padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(12, 18, 34, .2); font: 16px var(--govde); color: inherit; }
.sor-form button { width: 46px; height: 46px; border: 0; border-radius: 12px; background: var(--kobalt); color: #fff; cursor: pointer; display: grid; place-items: center; }
.sor-form button svg { width: 20px; }
.sor-form button:disabled { opacity: .5; }

/* Yayındaki "Vayra Build ile yapıldı" rozeti Sor düğmesiyle çakışmasın: sol alta alınır. */
body > a[href="/panel/build"] { right: auto !important; left: 14px !important; }
.alt { background: #0a0f1c; color: #9ea6ba; padding: 56px clamp(16px, 5vw, 48px) 26px; }
.alt-ic { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 28px; }
.alt .logo { color: #fff; }
.alt .logo svg { color: var(--limon); }
.alt h4 { color: #fff; margin: 0 0 8px; font-size: 14px; }
.alt p { margin: 4px 0; font-size: 14px; }
.alt a { color: #dfe4f2; }
.alt-not { max-width: 1200px; margin: 34px auto 0; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, .1); font-size: 13px; }

@media (max-width: 980px) {
  .kahraman, .bekleme-ic { grid-template-columns: 1fr; }
  .ozellik-izgara, .yorumlar { grid-template-columns: 1fr 1fr; }
  .planlar { grid-template-columns: 1fr; max-width: 520px; }
}
@media (max-width: 760px) {
  .menu { display: none; position: absolute; left: 12px; right: 12px; top: calc(100% + 8px); flex-direction: column; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 16px; padding: 8px; }
  .menu.acik { display: flex; }
  .menu a { padding: 13px 14px; font-size: 16px; }
  .menu-dugme { display: inline-flex; }
  .ust .dugme.kucuk { margin-left: auto; font-size: 13px; padding: 8px 12px; }
  .ozellik-izgara, .yorumlar, .adimlar, .guven-izgara { grid-template-columns: 1fr; }
  .ikili { grid-template-columns: 1fr; }
  .alt-ic { grid-template-columns: 1fr; }
  .fis { width: 46%; font-size: 10px; }
  .okunan { margin-left: 22%; }
  .sor { right: 12px; bottom: 12px; height: min(560px, calc(100vh - 90px)); }
  .sor-ac { right: 12px; bottom: 12px; }
}
@media (max-width: 420px) { .ust .dugme.kucuk { display: none; } .menu-dugme { margin-left: auto; } }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; scroll-behavior: auto !important; } }
`;

const UYGULAMA = ORTAK_JS + String.raw`
/* ── Tutarlı tanıtım sitesi ──
 * Bekleme listesi "bekleme_listesi" tablosuna yazılır (ziyaretçi ekler, okuyamaz; e-posta benzersiz).
 * "Sor" kutusu vayra.ai.sohbet ile çalışır; ürün bilgisi aşağıdaki BILGI metninden sistem istemi olarak verilir. */
var BILGI = ${JSON.stringify(BILGI)};
var SAYFA = document.body.dataset.sayfa;

/* ── Fiyat dönemi anahtarı (aylık / yıllık) ── */
function donemSec(d) {
  $$("[data-donem]").forEach(function (b) { b.setAttribute("aria-checked", String(b.dataset.donem === d)); });
  $$(".plan .fiyat").forEach(function (p) {
    var a = Number(p.dataset.aylik), y = Number(p.dataset.yillik);
    p.innerHTML = d === "yillik" ? "<b>" + tl(y) + "</b><span>yıllık, KDV hariç</span>" : "<b>" + tl(a) + "</b><span>aylık, KDV hariç</span>";
  });
  $$("[data-yillik-not]").forEach(function (n) { var y = Number(n.dataset.yillikNot); n.hidden = d !== "yillik"; n.textContent = "Aylık " + tl(Math.round(y / 12)) + " ödemeye denk gelir"; });
  try { localStorage.setItem("tutarli-donem", d); } catch (e) { /* yok say */ }
}
$$("[data-donem]").forEach(function (b) {
  b.addEventListener("click", function () { donemSec(b.dataset.donem); });
  b.addEventListener("keydown", function (e) { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { var d = b.dataset.donem === "aylik" ? "yillik" : "aylik"; donemSec(d); $('[data-donem="' + d + '"]').focus(); e.preventDefault(); } });
});
if ($("[data-donem]")) { var kayitli = null; try { kayitli = localStorage.getItem("tutarli-donem"); } catch (e) { /* yok say */ } donemSec(kayitli === "yillik" ? "yillik" : "aylik"); }

/* ── SSS: aynı anda bir yanıt açık kalır ── */
$$(".sss details").forEach(function (d) { d.addEventListener("toggle", function () { if (d.open) $$(".sss details").forEach(function (x) { if (x !== d) x.open = false; }); }); });

/* ── Plan düğmeleri formdaki planı seçer ── */
$$("[data-plan]").forEach(function (a) { a.addEventListener("click", function () { try { sessionStorage.setItem("tutarli-plan", a.dataset.plan); } catch (e) { /* yok say */ } var s = $("#planSec"); if (s) s.value = a.dataset.plan; }); });
(function () { var s = $("#planSec"), p = null; try { p = sessionStorage.getItem("tutarli-plan"); } catch (e) { /* yok say */ } if (s && p) s.value = p; })();

/* ── Bekleme listesi ── */
var form = $("#bekleForm");
if (form) {
  var mesaj = $("#bekleMesaj");
  var goster = function (tur, baslik, metin) { mesaj.hidden = false; mesaj.className = "mesaj " + tur; mesaj.innerHTML = "<b>" + kacir(baslik) + "</b>" + kacir(metin || ""); };
  form.addEventListener("submit", function (e) {
    e.preventDefault(); mesaj.hidden = true;
    if (!form.reportValidity()) return;
    var f = new FormData(form);
    var k = { ad: String(f.get("ad")).trim(), eposta: String(f.get("eposta")).trim().toLowerCase(), sirket: String(f.get("sirket") || "").trim() || null, calisan: f.get("calisan"), yontem: f.get("yontem") || null, plan: f.get("plan") || "Karar vermedim", izin: true, kaynak: SAYFA };
    if (!veriVar()) return goster("bilgi", "Bu canlı önizlemede kayıt alınmaz.", "Şablonu kullanınca kayıtlar bekleme_listesi tablosuna düşer.");
    var d = $("#bekleGonder"); d.disabled = true; d.textContent = "Ekleniyor…";
    vayra.veri.ekle("bekleme_listesi", k).then(function () {
      olay("bekleme_listesi", { plan: k.plan, calisan: k.calisan });
      form.reset();
      goster("tamam", "Listedesin, " + k.ad.split(" ")[0] + ".", "Davetin sırası gelince " + k.eposta + " adresine e-posta göndereceğiz.");
    }).catch(function (err) {
      var m = err && err.message || "";
      if (/zaten var/.test(m)) goster("bilgi", "Bu e-posta zaten listede.", "Davetin sırası gelince haber vereceğiz; ikinci kez katılmana gerek yok.");
      else goster("hata", "Listeye eklenemedin.", m + " Biraz sonra yeniden dene.");
    }).finally(function () { d.disabled = false; d.textContent = "Listeye katıl"; });
  });
}

/* ── Sor kutusu (vayra.ai.sohbet) ── */
var sorAc = $("#sorAc"), sorPanel = $("#sorPanel"), akis = $("#sorAkis"), sorForm = $("#sorForm"), girdi = $("#sorGirdi");
var gecmis = [], soruSayisi = 0, SINIR = 12, bekliyor = false;
var SISTEM = "Sen Tutarlı'nın web sitesindeki ürün asistanısın. Yalnız aşağıdaki bilgilere dayanarak, Türkçe, samimi ve en fazla 110 kelimeyle yanıt ver. "
  + "Bilgide olmayan bir şey sorulursa bilmediğini söyle ve merhaba@tutarli.com.tr adresini öner. Vergi ya da hukuk danışmanlığı yapma; o konularda mali müşavire yönlendir. "
  + "Markdown kullanma, düz metin yaz. Rakip ürünlerden söz etme. Fiyatları TL olarak ve KDV hariç olduğunu belirterek ver. Bekleme listesine katılmayı uygun yerde öner.\n\nÜRÜN BİLGİSİ:\n" + BILGI;
function panel(ac) {
  sorPanel.hidden = !ac; sorAc.setAttribute("aria-expanded", String(ac));
  if (ac) { girdi.focus(); olay("sor_acildi"); } else sorAc.focus();
}
function balon(tur, metin) { var b = document.createElement("div"); b.className = "balon " + tur; b.textContent = metin; akis.appendChild(b); akis.scrollTop = akis.scrollHeight; return b; }
function sor(soru) {
  soru = String(soru || "").trim();
  if (!soru || bekliyor) return;
  balon("kullanici", soru); girdi.value = ""; $("#sorOneri").hidden = true;
  if (!window.vayra || !window.vayra.ai) return balon("asistan", "Bu canlı önizlemede yapay zekâ kapalı. Şablonu kullanınca bu kutu Vayra yapay zekâ geçidiyle soruları yanıtlar.");
  if (++soruSayisi > SINIR) return balon("asistan", "Bu oturumda epey soru sordun. Devamı için merhaba@tutarli.com.tr adresine yazabilirsin.");
  gecmis.push({ rol: "kullanici", metin: soru });
  var y = balon("asistan yaziyor", ""); y.innerHTML = '<span class="atla">Yanıt yazılıyor</span><i></i><i></i><i></i>';
  bekliyor = true; sorForm.querySelector("button").disabled = true;
  vayra.ai.sohbet(gecmis.slice(-10), { sistem: SISTEM, enCok: 450 }).then(function (metin) {
    y.className = "balon asistan"; y.textContent = String(metin || "").replace(/\x60{3}[a-z]*\n?/gi, "").replace(/^#{1,6}\s*/gm, "").replace(/\*\*/g, "").trim() || "Buna şu an yanıt veremiyorum.";
    gecmis.push({ rol: "asistan", metin: y.textContent });
  }).catch(function (e) {
    gecmis.pop();
    y.className = "balon hata"; y.textContent = "Şu an yanıt veremedim: " + (e && e.message || "bağlantı sorunu") + " Sık sorulanlar bölümüne de bakabilirsin.";
  }).finally(function () { bekliyor = false; sorForm.querySelector("button").disabled = false; akis.scrollTop = akis.scrollHeight; });
}
sorAc.addEventListener("click", function () { panel(true); });
$("#sorKapat").addEventListener("click", function () { panel(false); });
document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sorPanel.hidden) panel(false); });
sorForm.addEventListener("submit", function (e) { e.preventDefault(); sor(girdi.value); });
$$("#sorOneri button").forEach(function (b) { b.addEventListener("click", function () { sor(b.textContent); }); });
`;

const SIMGE = {
  fis: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3" />',
  banka: '<path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />',
  fatura: '<path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4" />',
  akis: '<path d="M3 17l5-5 4 3 8-8M15 7h5v5" />',
  musavir: '<circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 11l2 2 4-4" />',
  hatirlat: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" />',
};
const ozellik = (s: keyof typeof SIMGE, b: string, m: string) => `<article class="ozellik"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SIMGE[s]}</svg><h3>${b}</h3><p>${m}</p></article>`;

const KARSILASTIRMA: [string, (string | boolean)[]][] = [
  ["Belgeler", []],
  ["Fiş ve fatura okuma", ["Ayda 60", "Sınırsız", "Sınırsız"]],
  ["Gider kategorisi önerisi", [true, true, true]],
  ["e-Arşiv fatura", [true, true, true]],
  ["e-Fatura", [false, true, true]],
  ["Banka ve nakit", []],
  ["Banka hesabı eşleştirme", ["1 hesap", "3 hesap", "Sınırsız"]],
  ["Nakit akışı tahmini", [false, "90 gün", "180 gün"]],
  ["Tahsilat hatırlatmaları", [false, true, true]],
  ["Ekip", []],
  ["Kullanıcı", ["1", "5", "Sınırsız"]],
  ["Mali müşavir girişi", [true, true, true]],
  ["Harcama onay akışı", [false, false, true]],
  ["Birden çok şirket", [false, false, true]],
  ["API erişimi", [false, false, true]],
  ["Destek", ["E-posta", "E-posta ve canlı yazışma", "Öncelikli, atanmış danışman"]],
];

export const SAAS_MUHASEBE = {
  id: "saas-muhasebe",
  ad: "Tutarlı · SaaS Tanıtım",
  tur: "site" as const,
  aciklama: "Yapay zekâ destekli muhasebe aracı için tanıtım sitesi: aylık ve yıllık fiyatlar, SSS, bekleme listesi ve yapay zekâlı Sor kutusu",
  kapak: "/gercek/build/sablon/saas-muhasebe.webp",
  tablolar: TABLOLAR,
  dosyalar: {
    "index.html": sayfa("index.html", "Tutarlı · Yapay zekâ destekli ön muhasebe", "Fişi çek, Tutarlı okusun: gider kaydı, banka eşleştirme, e-Fatura ve nakit akışı tahmini tek yerde. Bekleme listesine katıl.", `<section class="kapsayici kahraman">
  <div>
    <a class="duyuru" href="#bekleme"><b>Kapalı beta</b>Lansman 2027'nin ilk çeyreğinde</a>
    <h1>Fişi çek, <em>ön muhasebe</em> kendini tutsun.</h1>
    <p class="giris">Tutarlı fiş ve faturaları okur, KDV'yi ayırır, banka hareketleriyle eşleştirir ve önündeki 90 günün nakit durumunu gösterir. Mali müşavirin de ay sonunda her şeyi eksiksiz bulur.</p>
    <div class="eylemler"><a class="dugme" href="#bekleme">Bekleme listesine katıl</a><a class="dugme ikincil" href="fiyatlar.html">Fiyatları gör</a></div>
    <p class="kucuk-not">Kredi kartı gerekmez. Bekleme listesine ilk üç ay yüzde 50 indirim.</p>
  </div>
  <div class="urun" aria-label="Tutarlı ekranından bir görünüm">
    <div class="fis" aria-hidden="true"><b>KUZEY KIRTASİYE</b><div class="s"><span>A4 kâğıt 5 top</span><span>890,00</span></div><div class="s"><span>Toner</span><span>150,00</span></div><div class="s"><span>KDV yüzde 20</span><span>208,00</span></div><div class="s t"><span>TOPLAM</span><span>1.248,00</span></div><div class="s" style="margin-top:6px"><span>12.10.2026</span><span>14:32</span></div></div>
    <div class="okunan">
      <div class="okunan-ust"><span>Okunan fiş</span><span class="guven">Güven yüzde 98</span></div>
      <div class="alan-satir"><span>Tedarikçi</span><b>Kuzey Kırtasiye Ltd.</b></div>
      <div class="alan-satir"><span>Tarih</span><b>12 Ekim 2026</b></div>
      <div class="alan-satir"><span>Tutar</span><b>1.248,00 TL</b></div>
      <div class="alan-satir"><span>KDV, yüzde 20</span><b>208,00 TL</b></div>
      <div class="alan-satir"><span>Kategori</span><b class="kat">Ofis giderleri</b></div>
      <div class="alan-satir"><span>Banka eşleşmesi</span><b>Garanti hesabı, 12 Ekim</b></div>
    </div>
    <div class="akis-kart"><div class="ust-s"><span>90 günlük nakit tahmini</span><em>Ocak sonu</em></div><b>412.600 TL</b>
      <svg viewBox="0 0 300 70" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e3f56b" stop-opacity=".35"/><stop offset="1" stop-color="#e3f56b" stop-opacity="0"/></linearGradient></defs><path d="M0 52 L30 48 L60 50 L90 38 L120 42 L150 30 L180 34 L210 22 L240 26 L270 14 L300 10 L300 70 L0 70Z" fill="url(#g)"/><path d="M0 52 L30 48 L60 50 L90 38 L120 42 L150 30 L180 34 L210 22" fill="none" stroke="#e3f56b" stroke-width="2.5"/><path d="M210 22 L240 26 L270 14 L300 10" fill="none" stroke="#e3f56b" stroke-width="2.5" stroke-dasharray="5 5"/></svg>
    </div>
  </div>
</section>
<section class="kapsayici bolum" id="ozellikler" style="padding-top:20px">
  <div class="bolum-ust"><p class="k">Özellikler</p><h2>Ay sonu telaşı yerine her gün birkaç saniye.</h2><p>Belgeyi topla, gerisini Tutarlı düzenlesin. Emin olmadığı her kaydı sana sorar; onaylamadan hiçbir şey kesinleşmez.</p></div>
  <div class="ozellik-izgara">
    ${ozellik("fis", "Fişi çek, kayıt hazır", "Tutar, tarih, tedarikçi, KDV oranı ve tutarı fotoğraftan okunur; gider kategorisi önerilir.")}
    ${ozellik("banka", "Banka hareketi eşleşir", "Hesap hareketleri faturalarla kendiliğinden eşleşir. Açıkta kalan ödemeyi ilk bakışta görürsün.")}
    ${ozellik("fatura", "e-Fatura ve e-Arşiv", "Anlaşmalı özel entegratör üzerinden faturanı kes, gelen faturaları kendiliğinden içeri al.")}
    ${ozellik("akis", "90 günlük nakit tahmini", "Vadesi gelen alacak ve borçlardan önündeki üç ayın nakit durumunu hesaplar, sıkışacağın haftayı önceden söyler.")}
    ${ozellik("musavir", "Mali müşavirinle ortak", "Mali müşavirine ayrı giriş ver; ay sonunda muhasebe programına aktarım dosyasını tek tıkla alsın.")}
    ${ozellik("hatirlat", "Tahsilat hatırlatmaları", "Vadesi geçen faturalar için müşterine kibar bir e-posta ya da WhatsApp hatırlatması gider.")}
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-ust"><p class="k">Nasıl çalışır</p><h2>Üç adımda düzenli defter.</h2></div>
  <div class="adimlar">
    <div><h3>Bağla</h3><p>Banka hesaplarını ve e-Fatura kutunu bağla. Kurulum on dakika sürer.</p></div>
    <div><h3>Topla</h3><p>Fişleri telefonla çek ya da e-postayla ilet. Tutarlı okur, kategorisini önerir, sen onaylarsın.</p></div>
    <div><h3>Paylaş</h3><p>Ay sonunda mali müşavirin her şeyi tek ekranda bulur; sen nakit durumuna bakarsın.</p></div>
  </div>
</section>
<section class="kapsayici bolum" id="fiyatlar" style="padding-top:0">
  <div class="bolum-ust"><p class="k">Fiyatlar</p><h2>İşletmenle büyüyen sade fiyatlar.</h2><p>Lansman fiyatları, KDV hariç. Ayrıntılı karşılaştırma <a href="fiyatlar.html">fiyatlar sayfasında</a>.</p></div>
  ${fiyatKartlari}
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-ust"><p class="k">Beta kullanıcıları</p><h2>Kapalı betada neler diyorlar?</h2></div>
  <div class="yorumlar">
${YORUMLAR.map((y) => `    <figure class="yorum"><blockquote>${y.metin}</blockquote><figcaption><img src="${y.foto}" alt="" loading="lazy" /><span><b>${y.ad}</b><span>${y.rol}</span></span></figcaption></figure>`).join("\n")}
  </div>
  <p class="beta-not">Yorumlar kapalı beta kullanıcılarından, izinleriyle yayımlanmıştır.</p>
</section>
<section class="kapsayici bolum" id="sss" style="padding-top:0">
  <div class="bolum-ust"><p class="k">Sık sorulanlar</p><h2>Merak ettiklerin.</h2><p>Burada olmayan bir şey mi var? Sağ alttaki kutudan Tutarlı'ya sor.</p></div>
  <div class="sss">
${SSS.map(([s, c], i) => `    <details${i === 0 ? " open" : ""}><summary>${s}</summary><p>${c}</p></details>`).join("\n")}
  </div>
</section>
${BEKLEME}`),
    "fiyatlar.html": sayfa("fiyatlar.html", "Fiyatlar · Tutarlı", "Tutarlı planları: Başlangıç, İşletme ve Kurumsal. Aylık ya da yıllık ödeme, ayrıntılı özellik karşılaştırması.", `<section class="kapsayici bolum">
  <div class="bolum-ust"><p class="k">Fiyatlar</p><h1 style="font-size:clamp(36px,5vw,58px)">Her ölçekte aynı netlik.</h1><p>Lansman fiyatları, KDV hariç. Yıllık ödemede iki ay ücretsiz; bekleme listesine ilk üç ay yüzde 50 indirim.</p></div>
  ${fiyatKartlari}
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-ust"><h2>Planları karşılaştır</h2></div>
  <div class="tablo-kap"><table class="karsilastir">
    <thead><tr><th scope="col">Özellik</th>${PLANLAR.map((p) => `<th scope="col">${p.ad}</th>`).join("")}</tr></thead>
    <tbody>
${KARSILASTIRMA.map(([ad, d]) => (d.length ? `      <tr><th scope="row" style="font-weight:500">${ad}</th>${d.map((x) => `<td>${x === true ? `${tik}<span class="atla">Var</span>` : x === false ? '<span class="yok">Yok</span>' : x}</td>`).join("")}</tr>` : `      <tr class="grup"><td colspan="4">${ad}</td></tr>`)).join("\n")}
    </tbody>
  </table></div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-ust"><h2>Ödeme hakkında</h2></div>
  <div class="sss">
    <details open><summary>Planımı sonradan değiştirebilir miyim?</summary><p>Evet, istediğin an üst ya da alt plana geçebilirsin. Fark gün hesabıyla bir sonraki faturana yansır.</p></details>
    <details><summary>Hangi ödeme yöntemlerini kabul ediyorsunuz?</summary><p>Kredi kartı, banka kartı ve yıllık planlarda havale. Her ödeme için e-Arşiv fatura kesilir.</p></details>
    <details><summary>Deneme süresi var mı?</summary><p>Davet geldiğinde 30 gün boyunca İşletme planını ücretsiz kullanırsın; kart bilgisi istemeyiz.</p></details>
    <details><summary>Aboneliği iptal edersem verilerim ne olur?</summary><p>İptalden sonra 90 gün boyunca bütün verilerini Excel ve PDF olarak indirebilirsin; sonra kalıcı olarak silinir.</p></details>
  </div>
</section>
${BEKLEME}`),
    "guvenlik.html": sayfa("guvenlik.html", "Güvenlik ve KVKK · Tutarlı", "Tutarlı'da veriler İstanbul'da, şifreli ve yalnız senin izninle işlenir. Güvenlik önlemleri ve aydınlatma metni.", `<section class="kapsayici metin">
  <p class="k" style="color:var(--kobalt);font-weight:600;margin:0 0 10px">Güvenlik</p>
  <h1>Defterin sende, verin Türkiye'de.</h1>
  <p>Muhasebe verisi bir işletmenin en hassas verisidir. Tutarlı'yı baştan buna göre kurduk.</p>
  <div class="guven-izgara">
    <div><b>Veriler İstanbul'da</b><span>Bütün veriler ve yedekler İstanbul'daki iki ayrı veri merkezinde tutulur.</span></div>
    <div><b>Uçtan uca şifreleme</b><span>Aktarımda TLS 1.3, depolamada AES-256. Anahtarlar ayrı bir anahtar yönetim hizmetinde.</span></div>
    <div><b>İki adımlı doğrulama</b><span>Her girişte doğrulama kodu; rol bazlı yetkilerle kimin neyi göreceğini sen seçersin.</span></div>
    <div><b>Model eğitimi yok</b><span>Fiş ve fatura görüntülerin yapay zekâ modellerini eğitmek için kullanılmaz.</span></div>
  </div>
  <h2>Erişim ve kayıt</h2>
  <p>Ekibimizden hiç kimse senin açık iznin olmadan hesabına giremez. Destek için verdiğin erişim süreli olarak açılır ve her işlem denetim kaydına yazılır. Hesabındaki bütün değişiklikleri kim, ne zaman yaptı, ekrandan görebilirsin.</p>
  <h2>Yedekleme ve süreklilik</h2>
  <p>Veriler her saat artımlı, her gece tam olarak yedeklenir; yedekler 35 gün saklanır. Yılda bir kez bağımsız bir firmaya sızma testi yaptırıyoruz.</p>
  <h2 id="kvkk">Kişisel verilerin korunması</h2>
  <p>Bu sitedeki bekleme listesi formunda verdiğin ad, e-posta, şirket ve tercih bilgileri; 6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca veri sorumlusu sıfatıyla Tutarlı Yazılım tarafından, yalnız seni lansman davetine çağırmak ve ürünü geliştirmek amacıyla, açık rızana dayanarak işlenir. Bilgilerin üçüncü kişilerle paylaşılmaz, yurt dışına aktarılmaz.</p>
  <p>Ürün kullanıma açıldığında Tutarlı, işletmenin muhasebe verileri bakımından veri işleyen sıfatıyla çalışır; veri sorumlusu işletmenin kendisidir. Kanun'un 11. maddesindeki hakların için merhaba@tutarli.com.tr adresine yazabilirsin. Listeden çıkmak için gelen her e-postanın altında tek tıklık bağlantı bulunur.</p>
  <p style="margin-top:28px"><a class="dugme" href="index.html#bekleme">Bekleme listesine katıl</a></p>
</section>`),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#2d4cf0"/><path d="M20 24h24M32 24v20M22 41l5 5 15-14" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
  },
};
