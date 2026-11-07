/* Şablon: Nabız Stüdyo — spor salonu için mobil öncelikli web uygulaması. Haftalık ders programı "dersler" tablosundan,
 * vayra.uye ile üye girişi, "kayitlar" tablosuna kontenjan denetimli derse kayıt (kural sahibi: her üye yalnız kendi kaydını
 * görür), doluluğu kişisel veri göstermeden veren sunucu fonksiyonu (api/kontenjan.js), Derslerim ve Profil ekranları. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";

const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const EGITMENLER: Record<string, string> = { "Deniz Koç": "/gercek/paz/av-niko.webp", "Ece Tan": "/gercek/paz/av-elena.webp", "Bora Kaya": "/gercek/paz/av-marco.webp", "Melis Er": "/gercek/paz/av-sofia.webp" };
const GORSEL = { hiit: "/gercek/havuz/gorsel/mk-hareket-40248.webp", boks: "/gercek/havuz/gorsel/mk-hareket-40957.webp", yoga: "/gercek/havuz/gorsel/mk-yasam-4803.webp", esne: "/gercek/havuz/gorsel/mk-hareket-780.webp", dans: "/gercek/havuz/gorsel/mk-hareket-51295.webp", guc: "/gercek/paz/ortam-spor.webp", kosu: "/gercek/havuz/gorsel/mk-yasam-40881.webp", su: "/gercek/havuz/gorsel/mk-urun-4546.webp" };

type Ders = { id: string; ad: string; kategori: string; gun: string; saat: string; sure: number; egitmen: string; salon: string; seviye: string; kontenjan: number; gorsel: string; aciklama: string };
const D = (id: string, ad: string, kategori: string, gun: number, saat: string, sure: number, egitmen: string, salon: string, seviye: string, kontenjan: number, gorsel: string, aciklama: string): Ders => ({ id, ad, kategori, gun: GUNLER[gun], saat, sure, egitmen, salon, seviye, kontenjan, gorsel, aciklama });
const HIIT = "Isınma, 30 saniyelik yüklenme ve kısa dinlenmelerle tüm vücut interval antrenmanı. Nabzı yükseltir, kısa sürede yüksek enerji harcatır.";
const PILATES = "Reformer aletiyle merkez bölge, duruş ve esneklik çalışması. Kontenjan alet sayısı kadardır; kaymaz çorap getir.";
const BOKS = "İp, gölge boksu, eldiven ve pao çalışmalarıyla kondisyon dersi. Temas yoktur; bandaj ve eldiven stüdyoda var.";
const SPIN = "Müzik eşliğinde tempo ve direnç değişimli kapalı alan bisikleti. Kendi temponu seçersin; havlu ve su şişeni unutma.";
const KETTLE = "Swing, goblet squat ve press gibi temel hareketlerle güç ve dayanıklılık. Ağırlıklar seviyene göre seçilir.";
const DANS = "Latin ve pop ritimleriyle eğlenceli kardiyo. Koreografiyi adım adım öğretiyoruz; dans geçmişi gerekmez.";
const YOGA = "Nefesle uyumlu akışlar ve ayakta duruşlarla güç ve denge. Mat ve bloklar stüdyoda.";
const YIN = "Uzun süre tutulan, yere yakın duruşlarla derin gevşeme ve esneklik. Günün yorgunluğunu atmak için ideal.";
const MOBIL = "Eklem hareket açıklığı, köpük rulo ve aktif esneme. Masa başı çalışanlar ve koşucular için birebir.";
const FONK = "Çekme, itme, taşıma ve çömelme kalıplarıyla günlük hayata dönük güç antrenmanı.";

const DERSLER: Ders[] = [
  D("pzt-hiit", "Sabah HIIT", "Kardiyo", 1, "07:00", 45, "Deniz Koç", "Stüdyo A", "Orta", 14, GORSEL.hiit, HIIT),
  D("pzt-pilates", "Reformer Pilates", "Esneklik", 1, "12:30", 50, "Ece Tan", "Reformer odası", "Her seviye", 8, GORSEL.esne, PILATES),
  D("pzt-boks", "Boks Kondisyon", "Dövüş", 1, "19:00", 60, "Bora Kaya", "Stüdyo B", "Orta", 12, GORSEL.boks, BOKS),
  D("pzt-yin", "Yin Yoga", "Esneklik", 1, "20:15", 60, "Melis Er", "Stüdyo A", "Başlangıç", 16, GORSEL.yoga, YIN),
  D("sal-spin", "Spinning", "Kardiyo", 2, "07:00", 45, "Deniz Koç", "Bisiklet odası", "Her seviye", 18, GORSEL.su, SPIN),
  D("sal-kettle", "Kettlebell Güç", "Güç", 2, "18:30", 50, "Bora Kaya", "Stüdyo B", "Orta", 12, GORSEL.guc, KETTLE),
  D("sal-dans", "Dans Kardiyo", "Dans", 2, "19:45", 50, "Melis Er", "Stüdyo A", "Her seviye", 20, GORSEL.dans, DANS),
  D("car-mobil", "Mobilite", "Esneklik", 3, "07:00", 40, "Ece Tan", "Stüdyo A", "Her seviye", 16, GORSEL.esne, MOBIL),
  D("car-fonk", "Fonksiyonel Güç", "Güç", 3, "12:30", 50, "Deniz Koç", "Stüdyo B", "Orta", 12, GORSEL.guc, FONK),
  D("car-pilates", "Reformer Pilates", "Esneklik", 3, "19:00", 50, "Ece Tan", "Reformer odası", "Her seviye", 8, GORSEL.esne, PILATES),
  D("car-spin", "Spinning", "Kardiyo", 3, "20:15", 45, "Deniz Koç", "Bisiklet odası", "Her seviye", 18, GORSEL.su, SPIN),
  D("per-hiit", "Sabah HIIT", "Kardiyo", 4, "07:00", 45, "Deniz Koç", "Stüdyo A", "Orta", 14, GORSEL.hiit, HIIT),
  D("per-boks", "Boks Kondisyon", "Dövüş", 4, "18:30", 60, "Bora Kaya", "Stüdyo B", "Orta", 12, GORSEL.boks, BOKS),
  D("per-yoga", "Akış Yoga", "Esneklik", 4, "19:45", 60, "Melis Er", "Stüdyo A", "Orta", 16, GORSEL.yoga, YOGA),
  D("cum-spin", "Spinning", "Kardiyo", 5, "07:00", 45, "Deniz Koç", "Bisiklet odası", "Her seviye", 18, GORSEL.su, SPIN),
  D("cum-kettle", "Kettlebell Güç", "Güç", 5, "18:00", 50, "Bora Kaya", "Stüdyo B", "Orta", 12, GORSEL.guc, KETTLE),
  D("cum-dans", "Dans Kardiyo", "Dans", 5, "19:15", 50, "Melis Er", "Stüdyo A", "Her seviye", 20, GORSEL.dans, DANS),
  D("cmt-fonk", "Fonksiyonel Güç", "Güç", 6, "10:00", 50, "Deniz Koç", "Stüdyo B", "Orta", 14, GORSEL.guc, FONK),
  D("cmt-pilates", "Reformer Pilates", "Esneklik", 6, "11:30", 50, "Ece Tan", "Reformer odası", "Her seviye", 8, GORSEL.esne, PILATES),
  D("cmt-kosu", "Sahil Koşu Kulübü", "Kardiyo", 6, "13:00", 60, "Deniz Koç", "Moda sahili buluşma", "Her seviye", 25, GORSEL.kosu, "Moda sahilinde 5 ile 8 kilometre arası grup koşusu; tempo grupları ayrı. Buluşma noktası iskele önü."),
  D("paz-yoga", "Akış Yoga", "Esneklik", 0, "10:30", 60, "Melis Er", "Stüdyo A", "Her seviye", 16, GORSEL.yoga, YOGA),
  D("paz-mobil", "Mobilite", "Esneklik", 0, "12:00", 40, "Ece Tan", "Stüdyo A", "Her seviye", 16, GORSEL.esne, MOBIL),
];

const TABLOLAR: Record<string, SablonTablo> = {
  dersler: {
    aciklama: "Haftalık ders programı. Her kayıt her hafta aynı gün ve saatte tekrarlanır. Herkes okur; yalnız sahip düzenler.",
    kurallar: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" },
    sema: [
      { ad: "ad", tur: "metin", zorunlu: true },
      { ad: "kategori", tur: "secim", secenekler: ["Güç", "Kardiyo", "Esneklik", "Dövüş", "Dans"] },
      { ad: "gun", tur: "secim", zorunlu: true, secenekler: GUNLER },
      { ad: "saat", tur: "metin", zorunlu: true, aciklama: "SS:DD" },
      { ad: "sure", tur: "sayi", aciklama: "Dakika" },
      { ad: "egitmen", tur: "metin" },
      { ad: "salon", tur: "metin" },
      { ad: "seviye", tur: "secim", secenekler: ["Başlangıç", "Orta", "İleri", "Her seviye"] },
      { ad: "kontenjan", tur: "sayi", zorunlu: true },
      { ad: "gorsel", tur: "gorsel" },
      { ad: "aciklama", tur: "uzunMetin" },
      { ad: "aktif", tur: "mantiksal", varsayilan: true },
    ],
    kayitlar: DERSLER.map((d) => ({ ...d, aktif: true })),
  },
  kayitlar: {
    aciklama: "Üyelerin ders kayıtları (bir dersin belirli bir tarihi). Her üye yalnız kendi kaydını görür ve iptal eder; doluluk api/kontenjan.js ile sayılır.",
    kurallar: { okuma: "sahibi", ekleme: "uyeler", duzenleme: "sahibi" },
    sema: [
      { ad: "dersId", tur: "iliski", iliski: "dersler", zorunlu: true },
      { ad: "tarih", tur: "metin", zorunlu: true, aciklama: "YYYY-AA-GG" },
      { ad: "dersAd", tur: "metin" },
      { ad: "saat", tur: "metin" },
      { ad: "egitmen", tur: "metin" },
      { ad: "uye", tur: "metin", aciklama: "Üye kimliği (önizlemede süzmek için; yayında uyeId kullanılır)" },
    ],
    kayitlar: [],
  },
};

const KONTENJAN = String.raw`/* Sunucu fonksiyonu: ders doluluğu. "kayitlar" tablosu üyelere kapalıdır (her üye yalnız kendi kaydını görür);
 * burada yalnız sayılar ve kayıt sırası döner, kimin kaydolduğu dönmez.
 *  GET /api/kontenjan?bas=2026-11-09&bit=2026-11-15   { sayilar: { "<dersId>|<tarih>": adet } }
 *  GET /api/kontenjan?ders=<dersId>&tarih=2026-11-09  { sira: [kayıt kimlikleri, ilk kaydolan önce] } */
var TARIH = /^\d{4}-\d{2}-\d{2}$/;
export default async function (istek, vayra) {
  var q = istek.sorgu || {};
  if (q.ders) {
    if (!TARIH.test(q.tarih || "")) return { durum: 400, govde: { hata: "Tarih geçersiz." } };
    var l = await vayra.veri.liste("kayitlar", { dersId: String(q.ders), tarih: q.tarih, sirala: "olusturma", yon: "artan", sinir: 1000 });
    return { durum: 200, basliklar: { "Cache-Control": "no-store" }, govde: { sira: l.map(function (k) { return k.id; }) } };
  }
  if (!TARIH.test(q.bas || "") || !TARIH.test(q.bit || "")) return { durum: 400, govde: { hata: "bas ve bit tarihleri gerekli." } };
  var kayitlar = await vayra.veri.liste("kayitlar", { suzgec: [{ alan: "tarih", op: "buyukEsit", deger: q.bas }, { alan: "tarih", op: "kucukEsit", deger: q.bit }], sinir: 1000 });
  var sayilar = {};
  kayitlar.forEach(function (k) { var a = k.dersId + "|" + k.tarih; sayilar[a] = (sayilar[a] || 0) + 1; });
  return { durum: 200, basliklar: { "Cache-Control": "no-store" }, govde: { sayilar: sayilar } };
}
`;

const SIMGE = {
  program: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  derslerim: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l4.5 4.5L20 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  profil: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
};

const HTML = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Nabız Stüdyo · Ders programı</title>
  <meta name="description" content="Nabız Stüdyo ders programı: HIIT, reformer pilates, boks, spinning, yoga ve dans derslerine kaydol, derslerini yönet." />
  <meta name="theme-color" content="#131110" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Nabız" />
  <link rel="manifest" href="manifest.webmanifest" />
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="ikon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <div class="uygulama">
    <header class="ust">
      <div class="marka"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 17h6l3-8 5 15 3-9 2 2h7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Nabız<small>Stüdyo · Moda</small></span></div>
      <p class="selam" id="selam"></p>
    </header>
    <main id="ekran" tabindex="-1">
      <section data-ekran="program" aria-labelledby="pBaslik">
        <h1 id="pBaslik" class="ekran-baslik">Ders programı</h1>
        <div class="gunler" id="gunler" role="tablist" aria-label="Gün seç"></div>
        <div class="kategoriler" id="kategoriler" role="group" aria-label="Kategori"></div>
        <div id="dersListe" class="ders-liste" aria-live="polite"></div>
      </section>
      <section data-ekran="derslerim" aria-labelledby="dBaslik" hidden>
        <h1 id="dBaslik" class="ekran-baslik">Derslerim</h1>
        <div id="derslerim"></div>
      </section>
      <section data-ekran="profil" aria-labelledby="prBaslik" hidden>
        <h1 id="prBaslik" class="ekran-baslik">Profil</h1>
        <div id="profil"></div>
      </section>
    </main>
    <nav class="sekmeler" aria-label="Ana menü">
      <a href="#program" data-sekme="program" aria-current="page">${SIMGE.program}<span>Program</span></a>
      <a href="#derslerim" data-sekme="derslerim">${SIMGE.derslerim}<span>Derslerim</span><b id="kayitSayi" hidden></b></a>
      <a href="#profil" data-sekme="profil">${SIMGE.profil}<span>Profil</span></a>
    </nav>
  </div>
  <dialog class="sayfa-alt" id="detay" aria-labelledby="detayBaslik"><div id="detayIc"></div></dialog>
  <script src="app.js"></script>
</body>
</html>
`;

const STIL = String.raw`/* Nabız Stüdyo — sıcak koyu zemin, köz turuncusu vurgu, kategori renkleri; Barlow Condensed başlıklar, Barlow gövde. Mobil öncelikli. */
:root {
  --zemin: #131110; --kart: #1d1a18; --kart2: #26221f; --metin: #f5efe7; --soluk: #a89e93; --koz: #ff6a3d; --koz-koyu: #e5532a; --cizgi: rgba(245, 239, 231, .09);
  --guc: #ff6a3d; --kardiyo: #f6c344; --esneklik: #7fd1b9; --dovus: #ef5d79; --dans: #b08cff;
  --baslik: "Barlow Condensed", system-ui, sans-serif; --govde: "Barlow", system-ui, sans-serif; --alt-bosluk: env(safe-area-inset-bottom);
}
[hidden] { display: none !important; }
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html { background: #0b0a09; }
body { margin: 0; color: var(--metin); font: 16px/1.5 var(--govde); -webkit-font-smoothing: antialiased; background: radial-gradient(1200px 600px at 50% -10%, #2a1610, #0b0a09 60%); min-height: 100vh; }
img, svg { display: block; max-width: 100%; }
button { font: inherit; color: inherit; }
:focus-visible { outline: 3px solid var(--koz); outline-offset: 2px; border-radius: 8px; }
.uygulama { max-width: 560px; margin: 0 auto; min-height: 100vh; background: var(--zemin); padding-bottom: calc(86px + var(--alt-bosluk)); border-inline: 1px solid var(--cizgi); }
.ust { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: max(14px, env(safe-area-inset-top)) 18px 12px; background: color-mix(in srgb, var(--zemin) 88%, transparent); backdrop-filter: blur(12px); }
.marka { display: flex; align-items: center; gap: 10px; }
.marka svg { width: 32px; height: 32px; color: var(--koz); }
.marka span { font-family: var(--baslik); font-weight: 800; font-size: 24px; letter-spacing: .01em; line-height: .9; }
.marka small { display: block; font-family: var(--govde); font-weight: 500; font-size: 12px; color: var(--soluk); letter-spacing: 0; margin-top: 3px; }
.selam { margin: 0; font-size: 14px; color: var(--soluk); text-align: right; }
.selam b { color: var(--metin); }
main { padding: 4px 18px 24px; outline: none; }
.ekran-baslik { font-family: var(--baslik); font-weight: 800; font-size: 40px; letter-spacing: .005em; margin: 6px 0 14px; line-height: 1; }

/* Günler ve kategoriler */
.gunler { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.gun { min-height: 64px; border: 1px solid var(--cizgi); border-radius: 16px; background: var(--kart); cursor: pointer; display: grid; place-items: center; gap: 0; padding: 6px 0; position: relative; }
.gun small { font-size: 12px; color: var(--soluk); font-weight: 600; }
.gun b { font-family: var(--baslik); font-size: 24px; line-height: 1; }
.gun[aria-selected="true"] { background: var(--koz); border-color: var(--koz); color: #1a0d07; }
.gun[aria-selected="true"] small { color: #3b1a0c; }
.gun i { position: absolute; bottom: 6px; width: 5px; height: 5px; border-radius: 50%; background: var(--koz); }
.gun[aria-selected="true"] i { background: #1a0d07; }
.kategoriler { display: flex; gap: 6px; overflow-x: auto; margin: 14px -18px 6px; padding: 0 18px 4px; scrollbar-width: none; }
.kategoriler::-webkit-scrollbar { display: none; }
.kategoriler button { flex: none; min-height: 38px; padding: 6px 14px; border-radius: 99px; border: 1px solid var(--cizgi); background: transparent; font-weight: 600; font-size: 14px; cursor: pointer; color: var(--soluk); display: inline-flex; align-items: center; gap: 7px; }
.kategoriler button i { width: 8px; height: 8px; border-radius: 50%; }
.kategoriler button[aria-pressed="true"] { background: var(--metin); color: var(--zemin); border-color: var(--metin); }

/* Ders kartı */
.ders-liste { display: grid; gap: 10px; margin-top: 10px; }
.ders { display: grid; grid-template-columns: 64px 1fr; gap: 14px; width: 100%; text-align: left; padding: 14px; border-radius: 20px; border: 1px solid var(--cizgi); background: var(--kart); cursor: pointer; position: relative; overflow: hidden; }
.ders::before { content: ""; position: absolute; left: 0; top: 14px; bottom: 14px; width: 4px; border-radius: 0 4px 4px 0; background: var(--renk, var(--koz)); }
.ders .saat { font-family: var(--baslik); font-weight: 700; font-size: 26px; line-height: 1; }
.ders .saat small { display: block; font-family: var(--govde); font-size: 12.5px; font-weight: 500; color: var(--soluk); margin-top: 4px; }
.ders h2 { font-family: var(--baslik); font-weight: 700; font-size: 23px; margin: 0; line-height: 1.05; letter-spacing: .005em; }
.ders .alt-bilgi { display: flex; align-items: center; gap: 8px; margin-top: 6px; font-size: 13.5px; color: var(--soluk); flex-wrap: wrap; }
.ders .alt-bilgi img { width: 22px; height: 22px; border-radius: 50%; object-fit: cover; object-position: top; }
.doluluk { margin-top: 10px; display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; }
.cubuk { flex: 1; height: 6px; border-radius: 99px; background: var(--kart2); overflow: hidden; }
.cubuk i { display: block; height: 100%; border-radius: 99px; background: var(--renk, var(--koz)); }
.rozet { display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px; border-radius: 99px; font-size: 12.5px; font-weight: 700; background: var(--kart2); color: var(--soluk); }
.rozet.kayitli { background: rgba(127, 209, 185, .16); color: var(--esneklik); }
.rozet.dolu { background: rgba(239, 93, 121, .16); color: #ff9db0; }
.rozet.az { background: rgba(246, 195, 68, .16); color: var(--kardiyo); }
.ders.bitti { opacity: .45; }
.bos { text-align: center; padding: 40px 12px; color: var(--soluk); border: 1px dashed var(--cizgi); border-radius: 20px; }
.bos b { display: block; color: var(--metin); font-family: var(--baslik); font-size: 24px; margin-bottom: 4px; }
.iskelet { height: 108px; border-radius: 20px; background: linear-gradient(90deg, #1d1a18, #27231f, #1d1a18); background-size: 200% 100%; animation: parilti 1.3s infinite; }
@keyframes parilti { to { background-position: -200% 0; } }

/* Alt sayfa (ders ayrıntısı) */
dialog.sayfa-alt { width: 100%; max-width: 560px; margin: auto auto 0; padding: 0; border: 0; border-radius: 26px 26px 0 0; background: var(--kart); color: var(--metin); max-height: 92vh; overflow-y: auto; }
dialog.sayfa-alt[open] { animation: yuksel .28s ease-out; }
@keyframes yuksel { from { transform: translateY(40px); opacity: .4; } }
dialog.sayfa-alt::backdrop { background: rgba(0, 0, 0, .62); }
.detay-gorsel { position: relative; height: 210px; }
.detay-gorsel img { width: 100%; height: 100%; object-fit: cover; }
.detay-gorsel::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, var(--kart)); }
.kapat { position: absolute; right: 14px; top: 14px; z-index: 2; width: 44px; height: 44px; border-radius: 50%; border: 0; background: rgba(19, 17, 16, .7); cursor: pointer; display: grid; place-items: center; }
.kapat svg { width: 18px; }
.detay-ic { padding: 0 20px calc(22px + var(--alt-bosluk)); margin-top: -26px; position: relative; z-index: 1; }
.detay-ic h2 { font-family: var(--baslik); font-weight: 800; font-size: 38px; margin: 0; line-height: 1; }
.detay-ic .zaman { color: var(--soluk); margin: 6px 0 14px; font-weight: 500; }
.bilgi-izgara { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
.bilgi-izgara div { background: var(--kart2); border-radius: 14px; padding: 10px 12px; }
.bilgi-izgara dt { font-size: 12px; color: var(--soluk); font-weight: 600; }
.bilgi-izgara dd { margin: 2px 0 0; font-weight: 700; font-size: 14.5px; }
.egitmen { display: flex; align-items: center; gap: 12px; margin: 14px 0; }
.egitmen img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; object-position: top; }
.egitmen span { color: var(--soluk); font-size: 13.5px; display: block; }
.detay-ic p { color: #d8cfc4; }
.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; min-height: 56px; padding: 14px 20px; border-radius: 16px; border: 0; background: var(--koz); color: #1a0d07; font: 700 17px/1 var(--govde); cursor: pointer; text-decoration: none; transition: background .2s, transform .15s; }
.dugme:active { transform: scale(.98); }
.dugme:hover { background: var(--koz-koyu); }
.dugme[disabled] { opacity: .5; cursor: not-allowed; }
.dugme.ikincil { background: var(--kart2); color: var(--metin); }
.dugme.sil { background: transparent; color: #ff9db0; border: 1px solid rgba(239, 93, 121, .4); }
.not { font-size: 13px; color: var(--soluk); text-align: center; margin: 10px 0 0; }

/* Derslerim */
.ozet-kartlar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 18px; }
.ozet-kartlar div { background: var(--kart); border: 1px solid var(--cizgi); border-radius: 16px; padding: 12px; }
.ozet-kartlar b { display: block; font-family: var(--baslik); font-size: 30px; line-height: 1; color: var(--koz); }
.ozet-kartlar span { font-size: 12.5px; color: var(--soluk); }
.alt-baslik { font-family: var(--baslik); font-weight: 700; font-size: 22px; margin: 18px 0 10px; color: var(--soluk); }
.kayit { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; padding: 14px; border-radius: 18px; background: var(--kart); border: 1px solid var(--cizgi); margin-bottom: 8px; position: relative; overflow: hidden; }
.kayit::before { content: ""; position: absolute; left: 0; top: 12px; bottom: 12px; width: 4px; border-radius: 0 4px 4px 0; background: var(--renk, var(--koz)); }
.kayit h3 { margin: 0; font-family: var(--baslik); font-size: 21px; font-weight: 700; }
.kayit p { margin: 2px 0 0; color: var(--soluk); font-size: 13.5px; }
.kayit button { min-height: 40px; padding: 8px 14px; border-radius: 12px; border: 1px solid var(--cizgi); background: var(--kart2); cursor: pointer; font-weight: 600; font-size: 14px; }
.kayit button:disabled { opacity: .45; cursor: not-allowed; }
.kayit.gecmis { opacity: .6; }

/* Profil ve giriş */
.kutu { background: var(--kart); border: 1px solid var(--cizgi); border-radius: 22px; padding: 20px; }
.sekme-satir { display: flex; padding: 4px; border-radius: 14px; background: var(--kart2); margin-bottom: 16px; }
.sekme-satir button { flex: 1; min-height: 44px; border: 0; border-radius: 10px; background: transparent; font-weight: 700; cursor: pointer; color: var(--soluk); }
.sekme-satir button[aria-selected="true"] { background: var(--metin); color: var(--zemin); }
.form { display: grid; gap: 12px; }
.form label { display: grid; gap: 6px; font-weight: 600; font-size: 14px; }
.form input { width: 100%; min-height: 52px; padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(245, 239, 231, .16); background: var(--zemin); color: var(--metin); font: 500 16px var(--govde); }
.form input:focus { outline: none; border-color: var(--koz); }
.mesaj { border-radius: 14px; padding: 12px 14px; font-size: 14.5px; background: rgba(239, 93, 121, .14); color: #ffb3c1; }
.mesaj.bilgi { background: rgba(246, 195, 68, .14); color: #f7d67d; }
.profil-ust { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.avatar { width: 60px; height: 60px; border-radius: 50%; background: var(--koz); color: #1a0d07; display: grid; place-items: center; font-family: var(--baslik); font-weight: 800; font-size: 28px; }
.profil-ust b { display: block; font-size: 18px; }
.profil-ust span { color: var(--soluk); font-size: 14px; }
.liste { display: grid; gap: 8px; margin-top: 16px; }
.uyelik { margin-top: 16px; padding: 16px; border-radius: 18px; background: linear-gradient(135deg, #3a1a0f, #1d1a18); border: 1px solid rgba(255, 106, 61, .3); }
.uyelik b { font-family: var(--baslik); font-size: 22px; display: block; }
.uyelik span { color: var(--soluk); font-size: 14px; }

/* Alt sekmeler */
.sekmeler { position: fixed; left: 50%; bottom: 0; transform: translateX(-50%); width: 100%; max-width: 560px; z-index: 30; display: grid; grid-template-columns: repeat(3, 1fr); padding: 8px 10px calc(8px + var(--alt-bosluk)); background: color-mix(in srgb, #181513 94%, transparent); backdrop-filter: blur(14px); border-top: 1px solid var(--cizgi); }
.sekmeler a { position: relative; display: grid; justify-items: center; gap: 3px; min-height: 56px; padding: 6px 0; text-decoration: none; color: var(--soluk); font-size: 12.5px; font-weight: 600; border-radius: 14px; }
.sekmeler a svg { width: 24px; height: 24px; }
.sekmeler a[aria-current="page"] { color: var(--koz); }
.sekmeler b { position: absolute; top: 4px; left: calc(50% + 8px); min-width: 19px; height: 19px; padding: 0 5px; border-radius: 99px; background: var(--koz); color: #1a0d07; font-size: 11.5px; display: grid; place-items: center; }
.sekmeler b[hidden] { display: none; }
.bildirim { position: fixed; left: 50%; bottom: calc(92px + var(--alt-bosluk)); transform: translate(-50%, 30px); opacity: 0; pointer-events: none; background: var(--metin); color: var(--zemin); padding: 12px 18px; border-radius: 14px; font-weight: 700; font-size: 14.5px; z-index: 60; transition: transform .3s, opacity .3s; width: max-content; max-width: calc(100vw - 32px); }
.bildirim.acik { transform: translate(-50%, 0); opacity: 1; }
.bildirim[data-tur="hata"] { background: #ff9db0; }
/* Yayındaki "Vayra Build ile yapıldı" rozeti alt sekme çubuğunun üstünde dursun. */
body > a[href="/panel/build"] { bottom: calc(92px + env(safe-area-inset-bottom)) !important; }
@media (min-width: 600px) { .ekran-baslik { font-size: 46px; } }
@media (max-width: 370px) { .gun b { font-size: 20px; } .bilgi-izgara { grid-template-columns: 1fr 1fr; } }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
`;

const UYGULAMA = ORTAK_JS + String.raw`
/* ── Nabız Stüdyo ──
 * Program "dersler" tablosundan (haftalık tekrar eden dersler). Kayıtlar "kayitlar" tablosunda: kural "sahibi", yani yayındaki
 * uygulamada her üye yalnız kendi kayıtlarını görür; uyeId sunucuda kendiliğinden eklenir. Doluluk api/kontenjan.js'ten gelir.
 * Kontenjan denetimi: kayıttan önce boş yer sayılır; kayıttan sonra sıra yeniden okunur, son yer aynı anda kapıldıysa kayıt geri alınır. */
var YEDEK = ${JSON.stringify(DERSLER.map((d) => ({ ...d, aktif: true })))};
var EGITMENLER = ${JSON.stringify(EGITMENLER)};
var GUNLER = ${JSON.stringify(GUNLER)};
var RENK = { "Güç": "var(--guc)", "Kardiyo": "var(--kardiyo)", "Esneklik": "var(--esneklik)", "Dövüş": "var(--dovus)", "Dans": "var(--dans)" };
var IPTAL_SINIRI = 120; // dersten kaç dakika öncesine kadar iptal edilebilir

var dersler = [], sayilar = {}, kayitlarim = [], ben = null, secGun = istanbul().tarih, secKat = "Hepsi", bekleyenDers = null;
function uyeVar() { return !!(window.vayra && window.vayra.uye); }
function benimMi(k) { return ben && (k.uyeId ? k.uyeId === ben.id : k.uye === ben.id); }
function dersGunu(d) { return GUNLER.indexOf(d.gun); }
function baslangic(tarih, d) { var n = istanbul(), fark = (new Date(tarih + "T00:00:00Z") - new Date(n.tarih + "T00:00:00Z")) / 60000; return fark + saatDakika(d.saat) - n.dakika; } // şu andan kaç dakika sonra
function haftaAraligi() { var b = istanbul().tarih; return { bas: b, bit: gunEkle(b, 6) }; }
function kayitliMi(d, t) { return kayitlarim.find(function (k) { return k.dersId === d.id && k.tarih === t; }); }
function sayi(d, t) { return sayilar[d.id + "|" + t] || 0; }

/* ── Veri ── */
function dersleriGetir() { return (veriVar() ? vayra.veri.liste("dersler", { sinir: 500 }) : Promise.resolve(YEDEK.slice())).then(function (l) { dersler = l.filter(function (d) { return d.aktif !== false; }); }); }
function dolulukGetir() {
  if (!fonksiyonVar()) { sayilar = {}; return Promise.resolve(); }
  return fonksiyonOku("kontenjan", haftaAraligi()).then(function (j) { sayilar = (j && j.sayilar) || {}; }).catch(function () { sayilar = {}; });
}
function kayitlarimiGetir() {
  if (!ben || !veriVar()) { kayitlarim = []; return Promise.resolve(); }
  // Yayında kural "sahibi" olduğundan yalnız bu üyenin kayıtları gelir; önizlemede site sahibi her şeyi görür, burada süzülür.
  return vayra.veri.liste("kayitlar", { sinir: 500 }).then(function (l) { kayitlarim = l.filter(benimMi); }).catch(function () { kayitlarim = []; });
}
function hepsiniYenile() { return Promise.all([dolulukGetir(), kayitlarimiGetir()]).then(cizHepsi); }

/* ── Program ekranı ── */
function gunleriCiz() {
  var b = istanbul().tarih, h = "";
  for (var i = 0; i < 7; i++) {
    var t = gunEkle(b, i), g = haftaGunu(t), var_ = kayitlarim.some(function (k) { return k.tarih === t; });
    h += '<button class="gun" type="button" role="tab" data-gun="' + t + '" aria-selected="' + (t === secGun) + '" aria-label="' + tarihYaz(t, { weekday: "long" }) + '"><small>' + (i === 0 ? "Bugün" : GUNLER[g].slice(0, 3)) + "</small><b>" + Number(t.slice(8)) + "</b>" + (var_ ? "<i></i>" : "") + "</button>";
  }
  $("#gunler").innerHTML = h;
}
function kategorileriCiz() {
  var l = ["Hepsi", "Güç", "Kardiyo", "Esneklik", "Dövüş", "Dans"];
  $("#kategoriler").innerHTML = l.map(function (k) { return '<button type="button" data-kat="' + k + '" aria-pressed="' + (k === secKat) + '">' + (RENK[k] ? '<i style="background:' + RENK[k] + '"></i>' : "") + k + "</button>"; }).join("");
}
function dersKarti(d, t) {
  var n = sayi(d, t), bos = Math.max(0, d.kontenjan - n), k = kayitliMi(d, t), bitti = baslangic(t, d) < 0;
  var durum = k ? '<span class="rozet kayitli">Kayıtlısın</span>' : bitti ? '<span class="rozet">Bitti</span>' : bos === 0 ? '<span class="rozet dolu">Dolu</span>' : bos <= 3 ? '<span class="rozet az">Son ' + bos + " yer</span>" : '<span class="rozet">' + bos + " yer var</span>";
  return '<button type="button" class="ders' + (bitti ? " bitti" : "") + '" data-ders="' + kacir(d.id) + '" style="--renk:' + (RENK[d.kategori] || "var(--koz)") + '"><div class="saat">' + kacir(d.saat) + "<small>" + kacir(d.sure) + " dk</small></div><div><h2>" + kacir(d.ad) + "</h2>"
    + '<div class="alt-bilgi">' + (EGITMENLER[d.egitmen] ? '<img src="' + kacir(EGITMENLER[d.egitmen]) + '" alt="" loading="lazy" />' : "") + "<span>" + kacir(d.egitmen) + "</span><span>" + kacir(d.salon) + "</span></div>"
    + '<div class="doluluk"><div class="cubuk" aria-hidden="true"><i style="width:' + Math.min(100, Math.round(n / Math.max(1, d.kontenjan) * 100)) + '%"></i></div>' + durum + "</div></div></button>";
}
function programCiz() {
  var g = haftaGunu(secGun), l = dersler.filter(function (d) { return dersGunu(d) === g && (secKat === "Hepsi" || d.kategori === secKat); }).sort(function (a, b) { return saatDakika(a.saat) - saatDakika(b.saat); });
  $("#dersListe").innerHTML = l.length ? l.map(function (d) { return dersKarti(d, secGun); }).join("") : '<div class="bos"><b>Bu gün ' + (secKat === "Hepsi" ? "ders yok" : secKat.toLocaleLowerCase("tr-TR") + " dersi yok") + "</b>Başka bir güne ya da kategoriye bak.</div>";
}

/* ── Ders ayrıntısı (alt sayfa) ── */
var dlg = $("#detay");
function detayAc(id, t) {
  var d = dersler.find(function (x) { return x.id === id; }); if (!d) return;
  t = t || secGun;
  var n = sayi(d, t), bos = Math.max(0, d.kontenjan - n), k = kayitliMi(d, t), kalan = baslangic(t, d), bitti = kalan < 0;
  var eylem;
  if (k) eylem = '<button class="dugme sil" type="button" data-iptal="' + kacir(k.id) + '"' + (kalan < IPTAL_SINIRI ? " disabled" : "") + ">Kaydımı iptal et</button><p class=\"not\">" + (kalan < IPTAL_SINIRI && !bitti ? "Derse 2 saatten az kaldığı için iptal edilemez." : "Dersten 2 saat öncesine kadar iptal edebilirsin.") + "</p>";
  else if (bitti) eylem = '<button class="dugme ikincil" type="button" disabled>Bu ders bitti</button>';
  else if (bos === 0) eylem = '<button class="dugme ikincil" type="button" disabled>Kontenjan dolu</button><p class="not">Bir yer açılırsa programda görünür.</p>';
  else eylem = '<button class="dugme" type="button" data-kayit="' + kacir(d.id) + '" data-tarih="' + t + '">' + (ben ? "Derse kaydol" : "Giriş yap ve kaydol") + "</button><p class=\"not\">" + bos + " yer kaldı · Dersten 2 saat öncesine kadar ücretsiz iptal</p>";
  $("#detayIc").innerHTML = '<div class="detay-gorsel"><img src="' + kacir(d.gorsel || "/gercek/paz/ortam-spor.webp") + '" alt="" /><button class="kapat" type="button" data-kapat aria-label="Kapat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button></div>'
    + '<div class="detay-ic"><h2 id="detayBaslik">' + kacir(d.ad) + '</h2><p class="zaman">' + kacir(tarihYaz(t, { weekday: "long" })) + ", " + kacir(d.saat) + " · " + kacir(d.sure) + " dakika</p>"
    + '<dl class="bilgi-izgara"><div><dt>Seviye</dt><dd>' + kacir(d.seviye) + "</dd></div><div><dt>Salon</dt><dd>" + kacir(d.salon) + "</dd></div><div><dt>Doluluk</dt><dd>" + n + " / " + kacir(d.kontenjan) + "</dd></div></dl>"
    + '<div class="egitmen">' + (EGITMENLER[d.egitmen] ? '<img src="' + kacir(EGITMENLER[d.egitmen]) + '" alt="" />' : "") + "<div><b>" + kacir(d.egitmen) + "</b><span>Eğitmen</span></div></div>"
    + "<p>" + kacir(d.aciklama || "") + "</p>" + eylem + "</div>";
  if (!dlg.open) dlg.showModal();
}
dlg.addEventListener("click", function (e) {
  if (e.target === dlg || e.target.closest("[data-kapat]")) return dlg.close();
  var k = e.target.closest("[data-kayit]"); if (k) return kaydol(k.dataset.kayit, k.dataset.tarih, k);
  var i = e.target.closest("[data-iptal]"); if (i) return iptal(i.dataset.iptal, i);
});

/* ── Kayıt ve iptal ── */
function kaydol(id, t, dugme) {
  var d = dersler.find(function (x) { return x.id === id; });
  if (!uyeVar()) return bildir("Bu canlı önizlemede üyelik çalışmaz; şablonu kullanınca üyeler derse kaydolur.");
  if (!ben) { bekleyenDers = { id: id, tarih: t }; dlg.close(); location.hash = "#profil"; return bildir("Kaydolmak için önce giriş yap."); }
  if (kayitliMi(d, t)) return bildir("Bu derse zaten kayıtlısın.");
  dugme.disabled = true; dugme.textContent = "Yer ayırılıyor…";
  var yeni = null;
  dolulukGetir().then(function () {
    if (sayi(d, t) >= d.kontenjan) throw new Error("DOLU");
    return vayra.veri.ekle("kayitlar", { dersId: d.id, tarih: t, dersAd: d.ad, saat: d.saat, egitmen: d.egitmen, uye: ben.id });
  }).then(function (k) {
    yeni = k;
    // Son yer aynı anda başka birine gitmiş olabilir: sırayı sunucudan oku, kontenjan dışında kaldıysak kaydı geri al.
    return fonksiyonOku("kontenjan", { ders: d.id, tarih: t }).then(function (j) {
      var sira = (j && j.sira) || [];
      if (sira.indexOf(k.id) >= d.kontenjan) return vayra.veri.sil("kayitlar", k.id).then(function () { throw new Error("DOLU"); });
    });
  }).then(function () {
    olay("ders_kayit", { ders: d.ad, kategori: d.kategori });
    bildir("Kaydın alındı: " + d.ad + ", " + tarihYaz(t, { weekday: "long" }) + " " + d.saat);
    return hepsiniYenile().then(function () { detayAc(id, t); });
  }).catch(function (e) {
    if (e && e.message === "DOLU") { bildir("Son yer az önce doldu.", "hata"); return hepsiniYenile().then(function () { detayAc(id, t); }); }
    bildir("Kaydolunamadı: " + (e && e.message || "bağlantı sorunu"), "hata"); dugme.disabled = false; dugme.textContent = "Derse kaydol";
  });
}
function iptal(kayitId, dugme) {
  var k = kayitlarim.find(function (x) { return x.id === kayitId; }); if (!k) return;
  if (!confirm(k.dersAd + " kaydın iptal edilsin mi?")) return;
  if (dugme) dugme.disabled = true;
  vayra.veri.sil("kayitlar", kayitId).then(function () {
    olay("ders_iptal", { ders: k.dersAd });
    bildir("Kaydın iptal edildi.");
    return hepsiniYenile().then(function () { if (dlg.open) detayAc(k.dersId, k.tarih); });
  }).catch(function (e) { bildir("İptal edilemedi: " + e.message, "hata"); if (dugme) dugme.disabled = false; });
}

/* ── Derslerim ekranı ── */
function derslerimCiz() {
  var yer = $("#derslerim");
  if (!uyeVar()) { yer.innerHTML = '<div class="bos"><b>Önizleme</b>Bu canlı önizlemede üyelik çalışmaz. Şablonu kullanınca üyeler kayıtlı derslerini burada görür.</div>'; return; }
  if (!ben) { yer.innerHTML = '<div class="bos"><b>Derslerin burada</b>Kaydolduğun dersleri görmek için giriş yap.<br><br><a class="dugme" href="#profil" style="max-width:260px">Giriş yap</a></div>'; return; }
  var bugun = istanbul().tarih, ay = bugun.slice(0, 7);
  var gelecek = kayitlarim.filter(function (k) { var d = dersler.find(function (x) { return x.id === k.dersId; }); return d && baslangic(k.tarih, d) > -((d.sure || 60)); })
    .sort(function (a, b) { return (a.tarih + a.saat).localeCompare(b.tarih + b.saat); });
  var gecmis = kayitlarim.filter(function (k) { return gelecek.indexOf(k) < 0; }).sort(function (a, b) { return (b.tarih + b.saat).localeCompare(a.tarih + a.saat); }).slice(0, 10);
  var buAy = kayitlarim.filter(function (k) { return k.tarih.slice(0, 7) === ay && k.tarih <= bugun; }).length;
  function satir(k, gecti) {
    var d = dersler.find(function (x) { return x.id === k.dersId; }) || {}, kalan = d.saat ? baslangic(k.tarih, d) : 0;
    return '<div class="kayit' + (gecti ? " gecmis" : "") + '" style="--renk:' + (RENK[d.kategori] || "var(--koz)") + '"><div><h3>' + kacir(k.dersAd || d.ad) + "</h3><p>" + kacir(tarihYaz(k.tarih, { weekday: "long" })) + ", " + kacir(k.saat || d.saat) + " · " + kacir(k.egitmen || d.egitmen || "") + "</p></div>"
      + (gecti ? "" : '<button type="button" data-iptal="' + kacir(k.id) + '"' + (kalan < IPTAL_SINIRI ? ' disabled title="Derse 2 saatten az kaldı"' : "") + ">İptal</button>") + "</div>";
  }
  yer.innerHTML = '<div class="ozet-kartlar"><div><b>' + gelecek.length + "</b><span>yaklaşan ders</span></div><div><b>" + buAy + "</b><span>bu ay katıldığın</span></div><div><b>" + kayitlarim.length + "</b><span>toplam kayıt</span></div></div>"
    + '<h2 class="alt-baslik">Yaklaşan</h2>' + (gelecek.length ? gelecek.map(function (k) { return satir(k, false); }).join("") : '<div class="bos"><b>Yaklaşan dersin yok</b>Programdan bir derse kaydol.<br><br><a class="dugme" href="#program" style="max-width:260px">Programa git</a></div>')
    + (gecmis.length ? '<h2 class="alt-baslik">Geçmiş</h2>' + gecmis.map(function (k) { return satir(k, true); }).join("") : "");
}
$("#derslerim").addEventListener("click", function (e) { var b = e.target.closest("[data-iptal]"); if (b) iptal(b.dataset.iptal, b); });

/* ── Profil: giriş, kayıt, çıkış, hesabı silme ── */
function profilCiz() {
  var yer = $("#profil");
  if (!uyeVar()) { yer.innerHTML = '<div class="bos"><b>Önizleme</b>Bu canlı önizlemede üyelik çalışmaz. Şablonu kullanınca üyeler buradan hesap açar.</div>'; return; }
  if (!ben) {
    yer.innerHTML = '<div class="kutu"><div class="sekme-satir" role="tablist"><button type="button" role="tab" aria-selected="true" data-mod="giris">Giriş yap</button><button type="button" role="tab" aria-selected="false" data-mod="kayit">Üye ol</button></div>'
      + (bekleyenDers ? '<p class="mesaj bilgi" style="margin:0 0 12px">Derse kaydolmak için giriş yap; sonra kaldığın yerden devam edersin.</p>' : "")
      + '<form class="form" id="uyeForm" novalidate><label id="adAlan" hidden>Ad soyad<input name="ad" autocomplete="name" /></label><label>E-posta<input name="eposta" type="email" required autocomplete="email" inputmode="email" /></label><label>Şifre<input name="sifre" type="password" required minlength="8" autocomplete="current-password" /></label><div class="mesaj" id="uyeMesaj" role="alert" hidden></div><button class="dugme" type="submit" id="uyeGonder">Giriş yap</button></form></div>'
      + '<div class="uyelik"><b>Nabız üyeliği</b><span>Aylık 2.400 TL ile sınırsız grup dersi. Üyeliğini resepsiyondan başlatıp uygulamadan derslerine kaydolursun.</span></div>';
    var mod = "giris";
    $$("[data-mod]").forEach(function (b) { b.addEventListener("click", function () { mod = b.dataset.mod; $$("[data-mod]").forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); }); $("#adAlan").hidden = mod !== "kayit"; $("#adAlan input").required = mod === "kayit"; $("#uyeGonder").textContent = mod === "kayit" ? "Üye ol" : "Giriş yap"; }); });
    $("#uyeForm").addEventListener("submit", function (e) {
      e.preventDefault(); var f = e.target, m = $("#uyeMesaj"); m.hidden = true;
      if (!f.reportValidity()) return;
      var v = new FormData(f), b = $("#uyeGonder"); b.disabled = true;
      (mod === "kayit" ? vayra.uye.kayit(String(v.get("eposta")).trim(), String(v.get("sifre")), String(v.get("ad")).trim()) : vayra.uye.giris(String(v.get("eposta")).trim(), String(v.get("sifre"))))
        .then(function (u) { ben = u; olay(mod === "kayit" ? "kayit_ol" : "giris_yap"); return hepsiniYenile(); })
        .then(function () { if (bekleyenDers) { var x = bekleyenDers; bekleyenDers = null; secGun = x.tarih; location.hash = "#program"; setTimeout(function () { detayAc(x.id, x.tarih); }, 50); } else location.hash = "#program"; })
        .catch(function (err) { m.hidden = false; m.textContent = err.message; b.disabled = false; });
    });
    return;
  }
  var bas = String(ben.ad || ben.eposta || "N").trim().charAt(0).toLocaleUpperCase("tr-TR");
  yer.innerHTML = '<div class="kutu"><div class="profil-ust"><span class="avatar" aria-hidden="true">' + kacir(bas) + "</span><div><b>" + kacir(ben.ad || "Nabız üyesi") + "</b><span>" + kacir(ben.eposta || "") + "</span></div></div>"
    + '<div class="liste"><a class="dugme ikincil" href="#derslerim">Derslerim</a><button class="dugme ikincil" type="button" id="cikis">Çıkış yap</button></div></div>'
    + '<div class="uyelik"><b>Stüdyo bilgisi</b><span>Moda Cad. No: 88, Kadıköy. Hafta içi 06.30 ile 22.30, hafta sonu 09.00 ile 18.00 açığız. Duş, dolap ve havlu hizmeti var.</span></div>'
    + '<div class="kutu" style="margin-top:16px"><b style="display:block;margin-bottom:6px">Hesabımı sil</b><p style="margin:0 0 12px;color:var(--soluk);font-size:14px">Hesabın ve bütün ders kayıtların kalıcı olarak silinir.</p><button class="dugme sil" type="button" id="hesapSil">Hesabımı sil</button></div>';
  $("#cikis").addEventListener("click", function () { vayra.uye.cikis().then(function () { ben = null; kayitlarim = []; cizHepsi(); }); });
  $("#hesapSil").addEventListener("click", function () {
    if (!confirm("Hesabın ve bütün ders kayıtların kalıcı olarak silinecek. Emin misin?")) return;
    vayra.uye.hesabiSil().then(function () { ben = null; kayitlarim = []; bildir("Hesabın silindi."); return hepsiniYenile(); }).catch(function (e) { bildir("Silinemedi: " + e.message, "hata"); });
  });
}

/* ── Ekranlar ve sekmeler ── */
function cizHepsi() {
  var s = $("#selam"), saat = Math.floor(istanbul().dakika / 60), ad = ben ? String(ben.ad || "").split(" ")[0] : "";
  s.innerHTML = (saat < 12 ? "Günaydın" : saat < 18 ? "İyi günler" : "İyi akşamlar") + (ad ? ", <b>" + kacir(ad) + "</b>" : "");
  var gelecek = kayitlarim.filter(function (k) { return k.tarih >= istanbul().tarih; }).length, rozet = $("#kayitSayi");
  rozet.hidden = !gelecek; rozet.textContent = String(gelecek);
  gunleriCiz(); kategorileriCiz(); programCiz(); derslerimCiz(); profilCiz();
}
function ekranSec() {
  var e = (location.hash || "#program").slice(1); if (["program", "derslerim", "profil"].indexOf(e) < 0) e = "program";
  $$("[data-ekran]").forEach(function (s) { s.hidden = s.dataset.ekran !== e; });
  $$("[data-sekme]").forEach(function (a) { if (a.dataset.sekme === e) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  if (e === "profil") profilCiz(); if (e === "derslerim") derslerimCiz();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", ekranSec);
$("#gunler").addEventListener("click", function (e) { var b = e.target.closest("[data-gun]"); if (!b) return; secGun = b.dataset.gun; gunleriCiz(); programCiz(); });
$("#kategoriler").addEventListener("click", function (e) { var b = e.target.closest("[data-kat]"); if (!b) return; secKat = b.dataset.kat; kategorileriCiz(); programCiz(); });
$("#dersListe").addEventListener("click", function (e) { var b = e.target.closest("[data-ders]"); if (b) detayAc(b.dataset.ders, secGun); });

ekranSec();
$("#dersListe").innerHTML = '<div class="iskelet"></div><div class="iskelet"></div><div class="iskelet"></div>';
(uyeVar() ? vayra.uye.ben().catch(function () { return null; }) : Promise.resolve(null)).then(function (u) { ben = u; return dersleriGetir(); })
  .then(hepsiniYenile)
  .catch(function (e) { $("#dersListe").innerHTML = '<div class="bos"><b>Program yüklenemedi</b>' + kacir(e && e.message || "") + "</div>"; });
if (uyeVar()) vayra.uye.degisince(function (u) { ben = u; });
`;

export const SPOR_SALONU = {
  id: "spor-salonu",
  ad: "Nabız Stüdyo · Spor Salonu",
  tur: "uygulama" as const,
  aciklama: "Mobil öncelikli spor salonu uygulaması: ders programı, üye girişi, kontenjan denetimli derse kayıt ve Derslerim ekranı",
  kapak: "/gercek/build/sablon/spor-salonu.webp",
  tablolar: TABLOLAR,
  dosyalar: {
    "index.html": HTML,
    "manifest.webmanifest": JSON.stringify({ name: "Nabız Stüdyo", short_name: "Nabız", lang: "tr", start_url: "./index.html", display: "standalone", background_color: "#131110", theme_color: "#131110", icons: [{ src: "ikon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }] }, null, 2),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#131110"/><path d="M64 272h88l48-128 80 240 48-144 32 32h88" fill="none" stroke="#ff6a3d" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
    "api/kontenjan.js": KONTENJAN,
  },
};
