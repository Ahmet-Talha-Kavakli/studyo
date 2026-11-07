/* Şablon: Sedef Diş Kliniği — hizmetler, hekimler, randevu formu (randevular tablosuna yazar; ziyaretçi ekler, okuyamaz),
 * dolu saatleri kişisel veri göstermeden veren sunucu fonksiyonu (api/doluluk.js), KVKK açık rıza kutusu ve aydınlatma metni. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";

const HEKIMLER = [
  { id: "elif", ad: "Dt. Elif Karaca", unvan: "Estetik diş hekimliği, gülüş tasarımı", foto: "/gercek/paz/av-emma.webp", gunler: [1, 2, 3, 4, 5, 6], egitim: "İstanbul Üniversitesi Diş Hekimliği Fakültesi, 2013", hakkinda: "Kliniğin kurucusu ve sorumlu müdürü. Porselen lamina, kompozit bonding ve beyazlatma planlamasında çalışıyor; her tedaviden önce dijital gülüş önizlemesi hazırlıyor." },
  { id: "mert", ad: "Uzm. Dt. Mert Aksoy", unvan: "Ortodonti uzmanı", foto: "/gercek/paz/av-malik.webp", gunler: [2, 4, 6], egitim: "Marmara Üniversitesi Ortodonti Anabilim Dalı, uzmanlık 2017", hakkinda: "Şeffaf plak ve braket tedavilerini yürütüyor. Yetişkin ortodontisi ve çene gelişimi takibinde deneyimli; ilk muayenede ağız içi tarama ile tedavi süresini gösteriyor." },
  { id: "zeynep", ad: "Dr. Dt. Zeynep Ulusoy", unvan: "Çocuk diş hekimi (pedodonti)", foto: "/gercek/paz/av-maria.webp", gunler: [1, 3, 5, 6], egitim: "Hacettepe Üniversitesi Pedodonti Doktorası, 2019", hakkinda: "3 yaşından itibaren çocukların ilk muayenesini, koruyucu tedavilerini ve süt dişi dolgularını yapıyor. Muayene odası çocuklar için ayrı düzenlendi." },
  { id: "kerem", ad: "Dt. Kerem Yalçın", unvan: "İmplant ve ağız cerrahisi", foto: "/gercek/paz/av-lucas.webp", gunler: [1, 2, 3, 4, 5], egitim: "Ege Üniversitesi Diş Hekimliği Fakültesi, 2011; implantoloji sertifika programı", hakkinda: "İmplant, yirmi yaş dişi çekimi ve kemik tozu uygulamalarını yapıyor. Cerrahi işlemlerden önce üç boyutlu tomografiyle planlama yapıyor." },
];

const HIZMETLER = [
  { id: "muayene", ad: "Muayene ve kontrol", sure: 30, hekimler: ["elif", "mert", "zeynep", "kerem"], kisa: "Ağız içi muayene, gerekirse panoramik röntgen ve yazılı tedavi planı.", uzun: "İlk ziyarette ağız ve diş eti sağlığına bakılır, gerekiyorsa panoramik röntgen çekilir. Muayene sonunda seçenekleri, süreleri ve ücretleri gösteren yazılı bir tedavi planı verilir; karar senindir." },
  { id: "temizlik", ad: "Diş taşı temizliği", sure: 45, hekimler: ["elif", "kerem"], kisa: "Ultrasonik temizlik ve parlatma; altı ayda bir önerilir.", uzun: "Diş taşları ultrasonik uçlarla nazikçe temizlenir, ardından yüzeyler parlatılır. Diş eti kanaması ve ağız kokusunun en sık nedeni olan plak birikimini azaltır." },
  { id: "dolgu", ad: "Dolgu", sure: 45, hekimler: ["elif", "zeynep", "kerem"], kisa: "Diş rengi kompozit dolgu, tek seansta.", uzun: "Çürük temizlenir ve diş rengi kompozit malzemeyle katman katman doldurulur. Çoğu dolgu tek seansta biter; işlem sırasında lokal anestezi uygulanır." },
  { id: "kanal", ad: "Kanal tedavisi", sure: 60, hekimler: ["elif", "kerem"], kisa: "Mikroskop destekli kanal tedavisi, çoğunlukla bir ya da iki seans.", uzun: "İltihaplanan diş sinirini temizleyip kanalları dolduran tedavidir. Döner aletler ve büyütme altında çalışılır; diş çekilmeden korunur." },
  { id: "implant", ad: "İmplant", sure: 30, hekimler: ["kerem"], kisa: "Eksik diş için titanyum kök; önce tomografiyle planlama.", uzun: "Eksik dişin yerine çene kemiğine titanyum bir kök yerleştirilir, iyileşme sonrası üzerine kron yapılır. İlk randevu planlama içindir; tomografi bu randevuda çekilir." },
  { id: "ortodonti", ad: "Ortodonti", sure: 30, hekimler: ["mert"], kisa: "Şeffaf plak ya da braketle diş düzeltme.", uzun: "Çapraşık dişler ve kapanış bozuklukları şeffaf plak ya da braketle düzeltilir. İlk muayenede ağız içi tarama yapılır, tedavi süresi ve seçenekler birlikte değerlendirilir." },
  { id: "beyazlatma", ad: "Diş beyazlatma", sure: 60, hekimler: ["elif"], kisa: "Klinikte tek seans ya da evde plakla beyazlatma.", uzun: "Önce diş ve diş eti sağlığı kontrol edilir. Klinikte yaklaşık bir saatlik seansla ya da kişiye özel plakla evde uygulanır; hassasiyet için koruyucu jel kullanılır." },
  { id: "cocuk", ad: "Çocuk diş hekimliği", sure: 30, hekimler: ["zeynep"], kisa: "İlk muayene, fissür örtücü ve flor uygulaması.", uzun: "Çocuğun diş hekimiyle tanışması oyunla başlar. Koruyucu fissür örtücü, flor vernik ve süt dişi tedavileri yapılır; ebeveyn muayene boyunca yanındadır." },
];

const SAATLER = { 1: ["09:00", "19:00"], 2: ["09:00", "19:00"], 3: ["09:00", "19:00"], 4: ["09:00", "19:00"], 5: ["09:00", "19:00"], 6: ["09:00", "15:00"] } as Record<number, [string, string]>;
const GUN_AD = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

const TABLOLAR: Record<string, SablonTablo> = {
  randevular: {
    aciklama: "Web sitesinden gelen randevu talepleri. Ziyaretçi ekleyebilir ama okuyamaz; dolu saatler api/doluluk.js ile kişisel veri olmadan gösterilir.",
    kurallar: { okuma: "kapali", ekleme: "herkes", duzenleme: "kapali" },
    sema: [
      { ad: "ad", tur: "metin", zorunlu: true, aciklama: "Hastanın adı soyadı" },
      { ad: "telefon", tur: "metin", zorunlu: true },
      { ad: "eposta", tur: "eposta" },
      { ad: "hizmet", tur: "secim", zorunlu: true, secenekler: HIZMETLER.map((h) => h.ad) },
      { ad: "hekim", tur: "secim", zorunlu: true, secenekler: [...HEKIMLER.map((h) => h.ad), "Fark etmez"] },
      { ad: "gun", tur: "metin", zorunlu: true, aciklama: "YYYY-AA-GG" },
      { ad: "saat", tur: "metin", zorunlu: true, aciklama: "SS:DD" },
      { ad: "not", tur: "uzunMetin", aciklama: "Şikâyet ya da not (sağlık verisi olabilir)" },
      { ad: "ilkZiyaret", tur: "mantiksal" },
      { ad: "kvkk", tur: "mantiksal", zorunlu: true, aciklama: "Aydınlatma metni ve açık rıza onayı" },
      { ad: "smsIzni", tur: "mantiksal", aciklama: "Hatırlatma SMS'i için izin" },
      { ad: "durum", tur: "secim", secenekler: ["Bekliyor", "Onaylandı", "Geldi", "İptal"], varsayilan: "Bekliyor" },
    ],
    kayitlar: [],
  },
};

const ust = (aktif: string) => `<a class="atla" href="#icerik">İçeriğe geç</a>
<header class="ust">
  <a class="logo" href="index.html" aria-label="Sedef Diş Kliniği ana sayfa"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 6.5c-2.2-1.6-6.6-2.4-8.8.4-2.2 2.9-1 7.4.3 10.6.9 2.4 1.2 5.2 1.6 7.6.3 1.6 2.4 1.8 3 .3l1.6-4.3c.6-1.6 3.9-1.6 4.5 0l1.6 4.3c.6 1.5 2.7 1.3 3-.3.4-2.4.7-5.2 1.6-7.6 1.3-3.2 2.5-7.7.3-10.6-2.2-2.8-6.6-2-8.7-.4z" fill="currentColor"/></svg><span>Sedef<small>Diş Kliniği</small></span></a>
  <nav class="menu" data-menu aria-label="Ana menü">
${[["index.html", "Klinik"], ["hizmetler.html", "Hizmetler"], ["hekimler.html", "Hekimler"], ["kvkk.html", "KVKK"]].map(([h, a]) => `    <a href="${h}"${h === aktif ? ' aria-current="page"' : ""}>${a}</a>`).join("\n")}
  </nav>
  <a class="dugme kucuk" href="randevu.html">Randevu al</a>
  <button class="menu-dugme" type="button" data-menu-ac aria-expanded="false" aria-label="Menüyü aç"><span></span><span></span></button>
</header>`;

const alt = `<footer class="alt">
  <div class="alt-ic">
    <div><a class="logo" href="index.html"><span>Sedef<small>Diş Kliniği</small></span></a><p>Sedef Ağız ve Diş Sağlığı Polikliniği. Sağlık Bakanlığı ruhsatlı özel poliklinik.</p><p>Sorumlu müdür: Dt. Elif Karaca</p></div>
    <div><h4>Adres</h4><p>Barbaros Mah. Begonya Sok. No: 7, Ataşehir / İstanbul</p><p>Ataşehir metro durağına 6 dakika yürüme</p></div>
    <div><h4>Çalışma saatleri</h4><p>Pazartesi ile cuma 09.00 ile 19.00</p><p>Cumartesi 09.00 ile 15.00</p><p>Pazar kapalı</p></div>
    <div><h4>İletişim</h4><p><a href="tel:+902164557230">0216 455 72 30</a></p><p><a href="mailto:randevu@sedefdis.com.tr">randevu@sedefdis.com.tr</a></p><p><a href="kvkk.html">KVKK aydınlatma metni</a></p></div>
  </div>
  <p class="alt-not">Bu sitedeki bilgiler bilgilendirme amaçlıdır; tanı ve tedavi için muayene gerekir.</p>
</footer>`;

const sayfa = (dosya: string, baslik: string, aciklama: string, govde: string) => `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${baslik}</title>
  <meta name="description" content="${aciklama}" />
  <meta name="theme-color" content="#f3f7f6" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" />
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

const hekimKarti = (h: (typeof HEKIMLER)[number], uzun = false) => `<article class="hekim${uzun ? " uzun" : ""}" id="${h.id}">
  <img src="${h.foto}" alt="${h.ad}" loading="lazy" />
  <div>
    <h3>${h.ad}</h3>
    <p class="unvan">${h.unvan}</p>
    ${uzun ? `<p>${h.hakkinda}</p><dl><dt>Eğitim</dt><dd>${h.egitim}</dd><dt>Klinikte</dt><dd>${h.gunler.map((g) => GUN_AD[g]).join(", ")}</dd></dl><a class="dugme" href="randevu.html?hekim=${h.id}">${h.ad.split(" ").slice(-2).join(" ")} ile randevu</a>` : `<p class="gunler">${h.gunler.map((g) => GUN_AD[g].slice(0, 3)).join(" · ")}</p>`}
  </div>
</article>`;

const SIMGE: Record<string, string> = {
  muayene: '<path d="M5 12a7 7 0 1 0 14 0 7 7 0 0 0-14 0zm10 5 4 4" />',
  temizlik: '<path d="M4 20 14 10m2-6 4 4-6 6-4-4zM6 8l1-3 1 3 3 1-3 1-1 3-1-3-3-1z" />',
  dolgu: '<path d="M12 4c-3-2-8-1-8 4 0 3 2 5 2 9 0 2 2 3 3 1l1-3h4l1 3c1 2 3 1 3-1 0-4 2-6 2-9 0-5-5-6-8-4z" /><path d="M10 9h4" />',
  kanal: '<path d="M12 4c-3-2-8-1-8 4 0 3 2 5 2 9 0 2 2 3 3 1l1-3h4l1 3c1 2 3 1 3-1 0-4 2-6 2-9 0-5-5-6-8-4z" /><path d="M10 8v6m4-6v6" />',
  implant: '<path d="M8 4h8M9 4c0 4 6 4 6 0M10 9h4m-4 3h4m-3.5 3h3M11 18l1 3 1-3" />',
  ortodonti: '<path d="M3 12h18M6 9h3v6H6zm6 0h3v6h-3zm6 0h-3" />',
  beyazlatma: '<path d="M12 3v3m0 12v3M3 12h3m12 0h3M6 6l2 2m8 8 2 2M6 18l2-2m8-8 2-2" /><circle cx="12" cy="12" r="3" />',
  cocuk: '<circle cx="12" cy="8" r="4" /><path d="M5 21c0-4 3-7 7-7s7 3 7 7M10 8h.01M14 8h.01" />',
};
const simge = (id: string) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${SIMGE[id] ?? SIMGE.muayene}</svg>`;

const STIL = String.raw`/* Sedef Diş Kliniği — sedef beyazı zemin, derin deniz yeşili, mercan vurgu; Plus Jakarta Sans. */
:root {
  --zemin: #f3f7f6; --kart: #ffffff; --murekkep: #0f2b2a; --soluk: #4d6463; --deniz: #0d5c56; --deniz-koyu: #0a4642; --nane: #dcefea; --nane-koyu: #c4e3dc;
  --mercan: #e8755a; --cizgi: rgba(15, 43, 42, .11); --yaricap: 22px; --yazi: "Plus Jakarta Sans", system-ui, sans-serif;
}
[hidden] { display: none !important; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--zemin); color: var(--murekkep); font: 16px/1.6 var(--yazi); -webkit-font-smoothing: antialiased; }
img, svg { display: block; max-width: 100%; }
a { color: inherit; }
h1, h2, h3 { margin: 0; line-height: 1.1; letter-spacing: -.025em; font-weight: 800; }
:focus-visible { outline: 3px solid var(--mercan); outline-offset: 2px; border-radius: 8px; }
.atla { position: absolute; left: -999px; top: 8px; background: var(--deniz); color: #fff; padding: 8px 14px; border-radius: 10px; z-index: 50; }
.atla:focus { left: 12px; }

.ust { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 22px; padding: 12px clamp(16px, 5vw, 64px); background: color-mix(in srgb, var(--zemin) 88%, transparent); backdrop-filter: blur(12px); border-bottom: 1px solid var(--cizgi); }
.logo { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; font-weight: 800; font-size: 21px; letter-spacing: -.03em; color: var(--deniz); }
.logo svg { width: 30px; height: 30px; color: var(--deniz); }
.logo small { display: block; font-size: 11.5px; font-weight: 600; letter-spacing: 0; color: var(--soluk); margin-top: -3px; }
.menu { display: flex; gap: 6px; margin-left: auto; }
.menu a { text-decoration: none; padding: 9px 14px; border-radius: 99px; font-size: 14.5px; font-weight: 600; color: var(--soluk); }
.menu a:hover { color: var(--murekkep); background: var(--nane); }
.menu a[aria-current] { color: var(--deniz); background: var(--nane); }
.menu-dugme { display: none; width: 44px; height: 44px; border: 1px solid var(--cizgi); background: var(--kart); border-radius: 14px; cursor: pointer; flex-direction: column; justify-content: center; align-items: center; gap: 6px; }
.menu-dugme span { width: 18px; height: 2px; border-radius: 2px; background: var(--murekkep); }

.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 50px; padding: 12px 24px; border: 0; border-radius: 99px; background: var(--deniz); color: #fff; font: 700 15px/1 var(--yazi); text-decoration: none; cursor: pointer; transition: background .2s, transform .2s; }
.dugme:hover { background: var(--deniz-koyu); }
.dugme:active { transform: scale(.98); }
.dugme[disabled] { opacity: .55; cursor: not-allowed; }
.dugme.kucuk { min-height: 42px; padding: 10px 18px; font-size: 14px; }
.dugme.ikincil { background: var(--kart); color: var(--deniz); border: 1.5px solid var(--nane-koyu); }
.dugme.ikincil:hover { border-color: var(--deniz); }
.ust .dugme.kucuk { margin-left: 4px; }

.kapsayici { max-width: 1240px; margin: 0 auto; padding: 0 clamp(16px, 5vw, 48px); }
.kahraman { display: grid; grid-template-columns: 1.1fr .9fr; gap: clamp(28px, 5vw, 64px); align-items: center; padding-block: clamp(36px, 6vw, 80px); }
.etiket { display: inline-flex; align-items: center; gap: 8px; padding: 7px 14px; border-radius: 99px; background: var(--nane); color: var(--deniz); font-size: 13.5px; font-weight: 700; }
.etiket i { width: 8px; height: 8px; border-radius: 50%; background: #23a36a; }
.kahraman h1 { font-size: clamp(40px, 5.6vw, 68px); margin: 18px 0 18px; }
.kahraman h1 span { color: var(--deniz); }
.giris { font-size: 18px; color: var(--soluk); max-width: 540px; margin: 0 0 28px; }
.eylemler { display: flex; flex-wrap: wrap; gap: 12px; }
.ozellikler { display: flex; flex-wrap: wrap; gap: 10px 24px; margin-top: 30px; padding: 0; list-style: none; color: var(--soluk); font-size: 14.5px; font-weight: 600; }
.ozellikler li { display: flex; gap: 8px; align-items: center; }
.ozellikler li::before { content: ""; width: 18px; height: 18px; border-radius: 50%; background: var(--nane) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230d5c56' stroke-width='3'%3E%3Cpath d='M6 12l4 4 8-8'/%3E%3C/svg%3E") center / 12px no-repeat; }
.vitrin { position: relative; }
.vitrin .kemer { aspect-ratio: 4 / 5; border-radius: 999px 999px 32px 32px; overflow: hidden; background: var(--nane); }
.vitrin .kemer img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
.yuzen { position: absolute; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 18px; padding: 12px 16px; font-size: 13.5px; color: var(--soluk); }
.yuzen b { display: block; color: var(--murekkep); font-size: 15px; }
.yuzen.y1 { left: -6%; bottom: 16%; }
.yuzen.y2 { right: -4%; top: 12%; }

.bolum { padding-block: clamp(48px, 7vw, 96px); }
.bolum-ust { display: flex; justify-content: space-between; align-items: end; gap: 18px; flex-wrap: wrap; margin-bottom: 30px; }
.bolum-ust h2 { font-size: clamp(30px, 4vw, 46px); }
.bolum-ust p { margin: 8px 0 0; color: var(--soluk); max-width: 560px; }
.hizmet-izgara { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.hizmet { background: var(--kart); border: 1px solid var(--cizgi); border-radius: var(--yaricap); padding: 22px; display: flex; flex-direction: column; gap: 10px; text-decoration: none; transition: border-color .2s, transform .2s; }
.hizmet:hover { border-color: var(--deniz); transform: translateY(-2px); }
.hizmet svg { width: 44px; height: 44px; padding: 10px; border-radius: 14px; background: var(--nane); color: var(--deniz); }
.hizmet h3 { font-size: 18px; }
.hizmet p { margin: 0; color: var(--soluk); font-size: 14.5px; flex: 1; }
.hizmet small { color: var(--deniz); font-weight: 700; font-size: 13px; }
.hizmet-liste { display: grid; gap: 14px; }
.hizmet-uzun { display: grid; grid-template-columns: 56px 1fr auto; gap: 20px; align-items: start; background: var(--kart); border: 1px solid var(--cizgi); border-radius: var(--yaricap); padding: 24px; }
.hizmet-uzun svg { width: 56px; height: 56px; padding: 13px; border-radius: 16px; background: var(--nane); color: var(--deniz); }
.hizmet-uzun h2 { font-size: 22px; }
.hizmet-uzun p { margin: 8px 0 0; color: var(--soluk); }
.hizmet-uzun .bilgi { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.hap { display: inline-flex; padding: 5px 11px; border-radius: 99px; background: var(--zemin); border: 1px solid var(--cizgi); font-size: 13px; font-weight: 600; color: var(--soluk); }

.hekim-izgara { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.hekim { background: var(--kart); border: 1px solid var(--cizgi); border-radius: var(--yaricap); overflow: hidden; }
.hekim img { width: 100%; aspect-ratio: 4 / 4.4; object-fit: cover; object-position: top; background: var(--nane); }
.hekim > div { padding: 16px 18px 20px; }
.hekim h3 { font-size: 18px; }
.hekim .unvan { margin: 4px 0 0; color: var(--deniz); font-weight: 600; font-size: 14px; }
.hekim .gunler { margin: 10px 0 0; color: var(--soluk); font-size: 13px; }
.hekim.uzun { display: grid; grid-template-columns: 300px 1fr; }
.hekim.uzun img { height: 100%; aspect-ratio: auto; min-height: 340px; }
.hekim.uzun > div { padding: clamp(20px, 3vw, 34px); }
.hekim.uzun h3 { font-size: 26px; }
.hekim.uzun p { color: var(--soluk); }
.hekim.uzun dl { display: grid; grid-template-columns: auto 1fr; gap: 6px 16px; margin: 16px 0 22px; font-size: 14.5px; }
.hekim.uzun dt { color: var(--soluk); font-weight: 600; }
.hekim.uzun dd { margin: 0; }
.hekim-liste { display: grid; gap: 18px; }

.adimlar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; counter-reset: a; }
.adimlar div { background: var(--deniz); color: #e3f2ef; border-radius: var(--yaricap); padding: 26px; }
.adimlar div::before { counter-increment: a; content: counter(a); display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: rgba(255, 255, 255, .14); color: #fff; font-weight: 800; margin-bottom: 16px; }
.adimlar h3 { color: #fff; font-size: 19px; margin-bottom: 6px; }
.adimlar p { margin: 0; font-size: 15px; }
.konum { display: grid; grid-template-columns: 1fr 1.2fr; gap: 20px; align-items: stretch; }
.konum .kutu { background: var(--kart); border: 1px solid var(--cizgi); border-radius: var(--yaricap); padding: 28px; }
.konum h2 { font-size: 30px; margin-bottom: 12px; }
.saat-tablo { width: 100%; border-collapse: collapse; margin: 14px 0 22px; font-size: 15px; }
.saat-tablo td { padding: 9px 0; border-bottom: 1px solid var(--cizgi); }
.saat-tablo td:last-child { text-align: right; font-weight: 600; }
.saat-tablo tr.bugun td { color: var(--deniz); font-weight: 800; }
.konum iframe { background: var(--nane); width: 100%; height: 100%; min-height: 340px; border: 0; border-radius: var(--yaricap); }

/* Randevu */
.randevu { display: grid; grid-template-columns: 1.35fr .9fr; gap: clamp(20px, 4vw, 40px); align-items: start; padding-block: clamp(32px, 5vw, 64px); }
.randevu > * { min-width: 0; }
.randevu h1 { font-size: clamp(36px, 5vw, 54px); margin-bottom: 10px; }
.randevu > div > p { color: var(--soluk); margin: 0 0 24px; }
.adim { background: var(--kart); border: 1px solid var(--cizgi); border-radius: var(--yaricap); padding: clamp(18px, 3vw, 26px); margin-bottom: 16px; }
.adim legend, .adim h2 { font-size: 17px; font-weight: 800; padding: 0; margin-bottom: 14px; display: flex; align-items: center; gap: 10px; }
.adim legend span, .adim h2 span { width: 28px; height: 28px; border-radius: 50%; background: var(--nane); color: var(--deniz); display: inline-grid; place-items: center; font-size: 13px; }
fieldset.adim { margin-inline: 0; min-width: 0; }
fieldset.adim > legend { float: left; width: 100%; }
fieldset.adim > legend + * { clear: both; }
.ikili { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
label.alan { display: grid; gap: 7px; font-size: 14px; font-weight: 700; }
.alan input, .alan select, .alan textarea { width: 100%; min-height: 50px; padding: 12px 14px; border-radius: 14px; border: 1.5px solid #cfdcd9; background: #fff; color: inherit; font: 500 16px var(--yazi); }
.alan input:focus, .alan select:focus, .alan textarea:focus { outline: none; border-color: var(--deniz); box-shadow: 0 0 0 3px var(--nane); }
.gunler-serit { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; scroll-snap-type: x mandatory; scrollbar-width: thin; }
.gun { flex: none; width: 72px; scroll-snap-align: start; display: grid; justify-items: center; gap: 2px; padding: 10px 6px; border-radius: 16px; border: 1.5px solid #cfdcd9; background: #fff; color: inherit; cursor: pointer; font: 600 13px var(--yazi); }
.gun b { font-size: 20px; font-weight: 800; }
.gun small { color: var(--soluk); font-size: 11.5px; }
.gun[aria-pressed="true"] { background: var(--deniz); border-color: var(--deniz); color: #fff; }
.gun[aria-pressed="true"] small { color: #cfe8e3; }
.gun:disabled { opacity: .45; cursor: not-allowed; background: var(--zemin); }
.slotlar { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 8px; margin-top: 16px; }
.slot { min-height: 46px; border-radius: 12px; border: 1.5px solid #cfdcd9; background: #fff; color: inherit; font: 700 15px var(--yazi); cursor: pointer; }
.slot:hover:not(:disabled) { border-color: var(--deniz); }
.slot[aria-pressed="true"] { background: var(--deniz); border-color: var(--deniz); color: #fff; }
.slot:disabled { cursor: not-allowed; color: #9bb0ad; background: repeating-linear-gradient(135deg, #f1f5f4 0 6px, #e9efee 6px 12px); text-decoration: line-through; }
.lejant { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 12px; font-size: 13px; color: var(--soluk); }
.lejant span { display: inline-flex; align-items: center; gap: 6px; }
.lejant i { width: 14px; height: 14px; border-radius: 4px; border: 1.5px solid #cfdcd9; background: #fff; }
.lejant i.d { background: repeating-linear-gradient(135deg, #f1f5f4 0 3px, #e1e9e8 3px 6px); }
.lejant i.s { background: var(--deniz); border-color: var(--deniz); }
.bos-not { padding: 18px; border-radius: 14px; background: var(--zemin); color: var(--soluk); font-size: 14.5px; margin-top: 16px; }
.onay { display: flex; gap: 12px; align-items: flex-start; font-size: 14px; color: var(--soluk); margin-top: 12px; }
.onay input { width: 22px; height: 22px; margin-top: 1px; accent-color: var(--deniz); flex: none; }
.ozet { position: sticky; top: 96px; background: var(--murekkep); color: #d7e6e3; border-radius: var(--yaricap); padding: 26px; }
.ozet h2 { color: #fff; font-size: 20px; margin-bottom: 16px; }
.ozet dl { margin: 0 0 20px; display: grid; gap: 12px; }
.ozet dt { font-size: 12.5px; color: #93b3ae; font-weight: 600; }
.ozet dd { margin: 2px 0 0; color: #fff; font-weight: 700; }
.ozet .dugme { width: 100%; background: var(--mercan); }
.ozet .dugme:hover { background: #d4603f; }
.ozet p { font-size: 13px; margin: 14px 0 0; }
.mesaj { border-radius: 14px; padding: 14px 16px; font-size: 14.5px; margin-top: 14px; }
.mesaj b { display: block; }
.mesaj.hata { background: #fde8e2; color: #8a2a14; }
.mesaj.bilgi { background: #fff4d9; color: #6a4b00; }
.basari { text-align: center; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 28px; padding: clamp(28px, 5vw, 56px); max-width: 640px; margin: clamp(32px, 6vw, 72px) auto; }
.basari .tik { width: 72px; height: 72px; margin: 0 auto 18px; border-radius: 50%; background: var(--nane); color: var(--deniz); display: grid; place-items: center; }
.basari .tik svg { width: 36px; }
.basari h1 { font-size: clamp(30px, 4vw, 40px); margin-bottom: 10px; }
.basari p { color: var(--soluk); }
.basari dl { display: grid; grid-template-columns: auto 1fr; gap: 8px 18px; text-align: left; background: var(--zemin); border-radius: 16px; padding: 18px 20px; margin: 22px 0; }
.basari dt { color: var(--soluk); font-weight: 600; }
.basari dd { margin: 0; font-weight: 700; }

.metin { max-width: 800px; padding-block: clamp(32px, 5vw, 64px); }
.metin h1 { font-size: clamp(32px, 4.5vw, 48px); margin-bottom: 14px; }
.metin h2 { font-size: 21px; margin: 32px 0 8px; }
.metin p, .metin li { color: var(--soluk); }
.metin table { width: 100%; border-collapse: collapse; font-size: 14.5px; margin: 10px 0; }
.metin th, .metin td { text-align: left; padding: 10px; border-bottom: 1px solid var(--cizgi); vertical-align: top; }
.metin th { color: var(--murekkep); }
.tablo-kap { overflow-x: auto; }

.alt { background: var(--murekkep); color: #b7cbc8; padding: 56px clamp(16px, 5vw, 64px) 26px; margin-top: 32px; }
.alt-ic { max-width: 1240px; margin: 0 auto; display: grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; gap: 28px; }
.alt .logo, .alt .logo svg { color: #fff; }
.alt .logo small { color: #93b3ae; }
.alt h4 { color: #fff; margin: 0 0 8px; font-size: 14px; }
.alt p { margin: 4px 0; font-size: 14px; }
.alt a { color: #e2efec; }
.alt-not { max-width: 1240px; margin: 34px auto 0; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, .12); font-size: 13px; }
.bildirim { position: fixed; left: 50%; bottom: 22px; transform: translate(-50%, 160%); background: var(--murekkep); color: #fff; padding: 13px 20px; border-radius: 99px; font-weight: 600; font-size: 14.5px; z-index: 60; transition: transform .35s; max-width: calc(100vw - 32px); }
.bildirim.acik { transform: translate(-50%, 0); }
.bildirim[data-tur="hata"] { background: #8a2a14; }

@media (max-width: 1060px) {
  .hizmet-izgara, .hekim-izgara { grid-template-columns: repeat(2, 1fr); }
  .alt-ic { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 860px) {
  .menu { display: none; position: absolute; left: 12px; right: 12px; top: calc(100% + 8px); flex-direction: column; background: var(--kart); border: 1px solid var(--cizgi); border-radius: 18px; padding: 8px; }
  .menu.acik { display: flex; }
  .menu a { padding: 13px 14px; font-size: 16px; }
  .menu-dugme { display: inline-flex; }
  .ust .dugme.kucuk { margin-left: auto; }
  .kahraman, .konum, .randevu { grid-template-columns: 1fr; }
  .vitrin { max-width: 420px; margin: 0 auto; width: 100%; }
  .yuzen.y1 { left: 0; } .yuzen.y2 { right: 0; }
  .adimlar { grid-template-columns: 1fr; }
  .hekim.uzun { grid-template-columns: 1fr; }
  .hekim.uzun img { min-height: 0; aspect-ratio: 4 / 3.6; }
  .ozet { position: static; }
  .hizmet-uzun { grid-template-columns: 1fr; }
  .hizmet-uzun svg { width: 48px; height: 48px; padding: 11px; }
}
@media (max-width: 560px) {
  .hizmet-izgara { grid-template-columns: 1fr; }
  .hekim-izgara { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .hekim > div { padding: 12px 12px 16px; }
  .hekim h3 { font-size: 15.5px; }
  .ikili { grid-template-columns: 1fr; }
  .alt-ic { grid-template-columns: 1fr; }
  .logo small { display: none; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; scroll-behavior: auto !important; } }
`;

const DOLULUK = String.raw`/* Sunucu fonksiyonu: bir günün dolu randevu saatlerini döndürür (GET /api/doluluk?gun=2026-11-12).
 * "randevular" tablosu ziyaretçiye kapalıdır; burada yalnız saat ve hekim adı döner, hastanın adı ya da telefonu dönmez. */
export default async function (istek, vayra) {
  var gun = String((istek.sorgu && istek.sorgu.gun) || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(gun)) return { durum: 400, govde: { hata: "Gün YYYY-AA-GG biçiminde olmalı." } };
  var kayitlar = await vayra.veri.liste("randevular", { gun: gun, sinir: 1000 });
  var saatler = {};
  kayitlar.forEach(function (r) {
    if (r.durum === "İptal" || !r.saat) return;
    (saatler[r.saat] = saatler[r.saat] || []).push(r.hekim || "Fark etmez");
  });
  return { durum: 200, basliklar: { "Cache-Control": "no-store" }, govde: { gun: gun, saatler: saatler } };
}
`;

const UYGULAMA = ORTAK_JS + String.raw`
/* ── Sedef Diş Kliniği: randevu ──
 * Talep "randevular" tablosuna yazılır (ziyaretçi ekleyebilir, okuyamaz). Dolu saatler api/doluluk.js sunucu fonksiyonundan
 * gelir; fonksiyon kişisel veri döndürmez. Klinik saatleri, hekimlerin çalıştığı günler ve hizmetler aşağıda. */
var HEKIMLER = ${JSON.stringify(HEKIMLER.map(({ id, ad, unvan, gunler }) => ({ id, ad, unvan, gunler })))};
var HIZMETLER = ${JSON.stringify(HIZMETLER.map(({ id, ad, sure, hekimler }) => ({ id, ad, sure, hekimler })))};
var SAATLER = ${JSON.stringify(SAATLER)};
var OGLE = ["13:00", "14:00"];
var GUN_AD = ${JSON.stringify(GUN_AD)};
var SAYFA = document.body.dataset.sayfa;

/* Ana sayfa: çalışma saatleri tablosunda bugünü işaretle. */
$$(".saat-tablo tr").forEach(function (tr) { if (Number(tr.dataset.gun) === istanbul().gun) tr.classList.add("bugun"); });

if (SAYFA === "randevu") {
  var form = $("#randevu"), q = new URLSearchParams(location.search);
  var sec = { hizmet: null, hekim: "Fark etmez", gun: null, saat: null }, doluluk = {}, istekNo = 0;
  var hizmetSec = $("#hizmet"), hekimSec = $("#hekim"), gunSerit = $("#gunler"), slotYer = $("#slotlar");

  hizmetSec.innerHTML = '<option value="">Hizmet seç</option>' + HIZMETLER.map(function (h) { return '<option value="' + h.id + '">' + kacir(h.ad) + " (" + h.sure + " dk)</option>"; }).join("");
  function hizmet() { return HIZMETLER.find(function (h) { return h.id === hizmetSec.value; }); }
  function yetkinHekimler() { var h = hizmet(); return HEKIMLER.filter(function (x) { return !h || h.hekimler.indexOf(x.id) >= 0; }); }
  function hekimleriDoldur() {
    var l = yetkinHekimler(), once = hekimSec.value;
    hekimSec.innerHTML = (l.length > 1 ? '<option value="Fark etmez">Fark etmez, ilk uygun hekim</option>' : "") + l.map(function (x) { return '<option value="' + kacir(x.ad) + '">' + kacir(x.ad) + ", " + kacir(x.unvan) + "</option>"; }).join("");
    if (Array.prototype.some.call(hekimSec.options, function (o) { return o.value === once; })) hekimSec.value = once;
    sec.hekim = hekimSec.value;
  }
  /** O gün çalışan ve seçilen hizmeti veren hekimler. */
  function gunHekimleri(tarih) {
    var g = haftaGunu(tarih);
    return yetkinHekimler().filter(function (x) { return x.gunler.indexOf(g) >= 0 && (sec.hekim === "Fark etmez" || x.ad === sec.hekim); });
  }
  function gunleriCiz() {
    var bugun = istanbul().tarih, h = "";
    for (var i = 0; i < 14; i++) {
      var t = gunEkle(bugun, i), g = haftaGunu(t), acik = !!SAATLER[g] && gunHekimleri(t).length > 0;
      if (i === 0 && acik) { var son = saatDakika(SAATLER[g][1]) - 30; acik = istanbul().dakika + 60 <= son; }
      h += '<button type="button" class="gun" data-gun="' + t + '" aria-pressed="' + (sec.gun === t) + '"' + (acik ? "" : " disabled") + ' aria-label="' + tarihYaz(t, { weekday: "long" }) + (acik ? "" : ", uygun değil") + '"><small>' + (i === 0 ? "Bugün" : i === 1 ? "Yarın" : GUN_AD[g].slice(0, 3)) + "</small><b>" + Number(t.slice(8)) + "</b><small>" + tarihYaz(t, { month: "short", day: undefined }) + "</small></button>";
    }
    gunSerit.innerHTML = h;
    if (sec.gun && !$('.gun[data-gun="' + sec.gun + '"]:not(:disabled)')) { sec.gun = null; sec.saat = null; }
    if (!sec.gun) { var ilk = $(".gun:not(:disabled)"); if (ilk) sec.gun = ilk.dataset.gun; }
    $$(".gun").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.gun === sec.gun)); });
    doluluguGetir();
  }
  function slotlar(tarih) {
    var g = haftaGunu(tarih), s = SAATLER[g]; if (!s) return [];
    var l = [], sure = (hizmet() || { sure: 30 }).sure, bas = saatDakika(s[0]), bit = saatDakika(s[1]);
    for (var d = bas; d + sure <= bit; d += 30) {
      var ogleBas = saatDakika(OGLE[0]), ogleBit = saatDakika(OGLE[1]);
      if (g !== 6 && d < ogleBit && d + sure > ogleBas) continue;
      l.push(dakikaSaat(d));
    }
    return l;
  }
  /** Saat dolu mu? Seçilen hekim o saatte doluysa ya da o saatteki randevu sayısı çalışan hekim sayısına ulaştıysa. */
  function dolu(saat) {
    var r = doluluk[saat] || [], hekimler = gunHekimleri(sec.gun);
    if (!hekimler.length) return true;
    if (sec.hekim !== "Fark etmez" && r.indexOf(sec.hekim) >= 0) return true;
    var musait = hekimler.filter(function (x) { return r.indexOf(x.ad) < 0; }).length;
    return musait - r.filter(function (x) { return x === "Fark etmez"; }).length <= 0;
  }
  function slotlariCiz() {
    if (!sec.gun) { slotYer.innerHTML = '<p class="bos-not">Önümüzdeki iki hafta içinde bu seçime uygun gün yok. Başka bir hekim ya da hizmet seç, ya da bizi ara.</p>'; ozetCiz(); return; }
    var simdi = istanbul(), l = slotlar(sec.gun), bos = 0;
    var h = l.map(function (s) {
      var gecti = sec.gun === simdi.tarih && saatDakika(s) < simdi.dakika + 60, d = gecti || dolu(s);
      if (!d) bos++;
      if (d && sec.saat === s) sec.saat = null;
      return '<button type="button" class="slot" data-saat="' + s + '" aria-pressed="' + (sec.saat === s) + '"' + (d ? ' disabled aria-label="' + s + ', dolu"' : "") + ">" + s + "</button>";
    }).join("");
    slotYer.innerHTML = '<div class="slotlar">' + h + "</div>" + (bos ? "" : '<p class="bos-not">Bu gün için boş saat kalmadı. Başka bir gün seç.</p>');
    $("#bosSayi").textContent = bos ? tarihYaz(sec.gun, { weekday: "long" }) + ": " + bos + " boş saat" : "";
    ozetCiz();
  }
  function doluluguGetir() {
    if (!sec.gun) return slotlariCiz();
    var no = ++istekNo;
    if (!fonksiyonVar()) { doluluk = {}; return slotlariCiz(); }
    slotYer.innerHTML = '<p class="bos-not">Uygun saatler yükleniyor…</p>';
    return fonksiyonOku("doluluk", { gun: sec.gun }).then(function (j) {
      if (no !== istekNo) return;
      doluluk = (j && j.saatler) || {}; slotlariCiz();
    }).catch(function () { if (no !== istekNo) return; doluluk = {}; slotlariCiz(); bildir("Doluluk bilgisi alınamadı; seçtiğin saat gönderirken yeniden denetlenir.", "hata"); });
  }
  function ozetCiz() {
    var h = hizmet();
    $("#ozHizmet").textContent = h ? h.ad + ", " + h.sure + " dakika" : "Seçilmedi";
    $("#ozHekim").textContent = sec.hekim === "Fark etmez" ? "İlk uygun hekim" : sec.hekim;
    $("#ozZaman").textContent = sec.gun && sec.saat ? tarihYaz(sec.gun, { weekday: "long" }) + ", " + sec.saat : sec.gun ? tarihYaz(sec.gun, { weekday: "long" }) + ", saat seçilmedi" : "Seçilmedi";
  }
  hizmetSec.addEventListener("change", function () { sec.hizmet = hizmetSec.value; hekimleriDoldur(); gunleriCiz(); });
  hekimSec.addEventListener("change", function () { sec.hekim = hekimSec.value; gunleriCiz(); });
  gunSerit.addEventListener("click", function (e) { var b = e.target.closest(".gun"); if (!b || b.disabled) return; sec.gun = b.dataset.gun; sec.saat = null; $$(".gun").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); doluluguGetir(); });
  slotYer.addEventListener("click", function (e) { var b = e.target.closest(".slot"); if (!b || b.disabled) return; sec.saat = b.dataset.saat; $$(".slot").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); ozetCiz(); });

  // Bağlantıdan gelen seçim: randevu.html?hizmet=implant&hekim=kerem
  if (q.get("hizmet") && HIZMETLER.some(function (h) { return h.id === q.get("hizmet"); })) hizmetSec.value = q.get("hizmet");
  hekimleriDoldur();
  var hk = HEKIMLER.find(function (x) { return x.id === q.get("hekim"); });
  if (hk) { if (!hizmetSec.value) { hizmetSec.value = "muayene"; hekimleriDoldur(); } if (Array.prototype.some.call(hekimSec.options, function (o) { return o.value === hk.ad; })) { hekimSec.value = hk.ad; sec.hekim = hk.ad; } }
  gunleriCiz();

  var mesaj = $("#mesaj");
  function goster(tur, baslik, metin) { mesaj.hidden = false; mesaj.className = "mesaj " + tur; mesaj.innerHTML = "<b>" + kacir(baslik) + "</b>" + kacir(metin || ""); mesaj.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
  form.addEventListener("submit", function (e) {
    e.preventDefault(); mesaj.hidden = true;
    if (!hizmet()) { hizmetSec.focus(); return goster("hata", "Hizmet seç.", "Hangi işlem için geleceğini seçersen uygun saatleri gösterebiliriz."); }
    if (!sec.gun || !sec.saat) { slotYer.scrollIntoView({ block: "center", behavior: "smooth" }); return goster("hata", "Gün ve saat seç.", "Boş saatlerden birine dokun."); }
    if (!form.reportValidity()) return;
    var f = new FormData(form);
    if (!/^[0-9 +()]{10,17}$/.test(String(f.get("telefon")).trim())) return goster("hata", "Telefon numarası geçersiz.", "Örneğin 0532 123 45 67 biçiminde yaz.");
    var kayit = { ad: String(f.get("ad")).trim(), telefon: String(f.get("telefon")).trim(), eposta: String(f.get("eposta") || "").trim() || null, hizmet: hizmet().ad, hekim: sec.hekim, gun: sec.gun, saat: sec.saat, not: String(f.get("not") || "").trim() || null, ilkZiyaret: f.get("ilk") === "on", kvkk: true, smsIzni: f.get("sms") === "on" };
    if (!veriVar()) return goster("bilgi", "Bu canlı önizlemede randevu kaydedilmez.", "Şablonu kullanınca talepler veritabanındaki randevular tablosuna düşer.");
    var d = $("#gonder"); d.disabled = true; d.textContent = "Gönderiliyor…";
    // Gönderimden hemen önce saati yeniden denetle: başka biri az önce almış olabilir.
    var denetim = fonksiyonVar() ? fonksiyonOku("doluluk", { gun: sec.gun }).then(function (j) { doluluk = (j && j.saatler) || {}; }).catch(function () {}) : Promise.resolve();
    denetim.then(function () {
      if (dolu(kayit.saat)) { slotlariCiz(); throw new Error("DOLU"); }
      return vayra.veri.ekle("randevular", kayit);
    }).then(function () {
      olay("randevu_talebi", { hizmet: kayit.hizmet });
      basari(kayit);
    }).catch(function (err) {
      if (err && err.message === "DOLU") goster("hata", "Bu saat az önce doldu.", "Başka bir saat seç; boş saatleri yeniledik.");
      else goster("hata", "Randevu talebi gönderilemedi.", (err && err.message ? err.message + ". " : "") + "Lütfen yeniden dene ya da 0216 455 72 30 numarasını ara.");
    }).finally(function () { d.disabled = false; d.textContent = "Randevu talebini gönder"; });
  });

  function basari(k) {
    var bitis = dakikaSaat(saatDakika(k.saat) + (hizmet() || { sure: 30 }).sure);
    $("#icerik").innerHTML = '<section class="kapsayici"><div class="basari" role="status"><div class="tik"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>'
      + "<h1>Randevu talebin alındı</h1><p>Mesai saatleri içinde en geç 30 dakikada seni arayıp onaylayacağız. Onaydan önce saat başka birine verilmez.</p>"
      + "<dl><dt>Hizmet</dt><dd>" + kacir(k.hizmet) + "</dd><dt>Hekim</dt><dd>" + kacir(k.hekim === "Fark etmez" ? "İlk uygun hekim" : k.hekim) + "</dd><dt>Zaman</dt><dd>" + kacir(tarihYaz(k.gun, { weekday: "long", year: "numeric" })) + ", " + k.saat + "</dd><dt>Telefon</dt><dd>" + kacir(k.telefon) + "</dd></dl>"
      + '<div class="eylemler" style="justify-content:center"><button class="dugme" id="takvim" type="button">Takvimime ekle</button><a class="dugme ikincil" href="index.html">Ana sayfa</a></div></div></section>';
    window.scrollTo(0, 0);
    $("#takvim").addEventListener("click", function () {
      var t = k.gun.replace(/-/g, ""), s1 = k.saat.replace(":", "") + "00", s2 = bitis.replace(":", "") + "00";
      var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sedef Dis Klinigi//Randevu//TR", "BEGIN:VEVENT", "UID:" + Date.now() + "@sedefdis.com.tr", "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z", "DTSTART;TZID=Europe/Istanbul:" + t + "T" + s1, "DTEND;TZID=Europe/Istanbul:" + t + "T" + s2, "SUMMARY:Sedef Diş Kliniği: " + k.hizmet, "LOCATION:Barbaros Mah. Begonya Sok. No: 7\\, Ataşehir / İstanbul", "DESCRIPTION:Randevu talebi. Klinik arayıp onaylayacak. Telefon: 0216 455 72 30", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = "sedef-randevu.ics"; document.body.appendChild(a); a.click(); a.remove();
    });
  }
}
`;

export const DIS_KLINIGI = {
  id: "dis-klinigi",
  ad: "Sedef · Diş Kliniği",
  tur: "site" as const,
  aciklama: "Hizmetler, hekimler, dolu saatleri gösteren randevu formu, KVKK açık rıza ve aydınlatma metniyle diş kliniği sitesi",
  kapak: "/gercek/build/sablon/dis-klinigi.webp",
  tablolar: TABLOLAR,
  dosyalar: {
    "index.html": sayfa("index.html", "Sedef Diş Kliniği · Ataşehir", "Ataşehir'de ağız ve diş sağlığı polikliniği: muayene, dolgu, kanal, implant, ortodonti, çocuk diş hekimliği. Online randevu.", `<section class="kapsayici kahraman">
  <div>
    <span class="etiket"><i></i>Bu hafta yeni hasta kabul ediyoruz</span>
    <h1>Sakin bir koltuk, <span>açık bir tedavi planı.</span></h1>
    <p class="giris">Ataşehir'deki kliniğimizde dört hekimle muayeneden implanta kadar ağız ve diş sağlığının her adımındayız. Her tedaviden önce seçenekleri ve süreyi yazılı olarak paylaşıyoruz.</p>
    <div class="eylemler"><a class="dugme" href="randevu.html">Online randevu al</a><a class="dugme ikincil" href="hizmetler.html">Hizmetlere bak</a></div>
    <ul class="ozellikler"><li>Her hasta için steril, tek kullanımlık set</li><li>Düşük dozlu dijital röntgen</li><li>Çocuklar için ayrı muayene odası</li></ul>
  </div>
  <div class="vitrin">
    <div class="kemer"><img src="/gercek/paz/av-emma.webp" alt="Dt. Elif Karaca" /></div>
    <div class="yuzen y1"><b>Dt. Elif Karaca</b>Kurucu hekim, estetik diş hekimliği</div>
    <div class="yuzen y2"><b>Randevunu 1 dakikada al</b>Boş saatleri anında gör</div>
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-ust"><div><h2>Hizmetlerimiz</h2><p>Koruyucu bakımdan cerrahiye; her tedavi muayene ve yazılı planla başlar.</p></div><a class="dugme ikincil" href="hizmetler.html">Bütün hizmetler</a></div>
  <div class="hizmet-izgara">
${HIZMETLER.slice(0, 8).map((h) => `    <a class="hizmet" href="hizmetler.html#${h.id}">${simge(h.id)}<h3>${h.ad}</h3><p>${h.kisa}</p><small>Yaklaşık ${h.sure} dakika</small></a>`).join("\n")}
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-ust"><div><h2>Nasıl çalışıyoruz</h2></div></div>
  <div class="adimlar">
    <div><h3>Muayene ve görüntüleme</h3><p>İlk ziyarette ağız içi muayene ve gerekiyorsa röntgen. Şikâyetini dinleyerek başlıyoruz.</p></div>
    <div><h3>Yazılı tedavi planı</h3><p>Seçenekleri, seans sayısını ve ücretleri yazılı veriyoruz. Acele yok; karar senin.</p></div>
    <div><h3>Tedavi ve kontrol</h3><p>Planlanan seanslar ve sonrasında kontrol randevusu. Hatırlatmaları SMS ile gönderiyoruz.</p></div>
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="bolum-ust"><div><h2>Hekimlerimiz</h2><p>Her biri kendi alanında çalışan dört diş hekimi.</p></div><a class="dugme ikincil" href="hekimler.html">Hekimleri tanı</a></div>
  <div class="hekim-izgara">
${HEKIMLER.map((h) => hekimKarti(h)).join("\n")}
  </div>
</section>
<section class="kapsayici bolum" style="padding-top:0">
  <div class="konum">
    <div class="kutu">
      <h2>Bizi bul</h2>
      <p style="color:var(--soluk);margin:0">Barbaros Mah. Begonya Sok. No: 7, Ataşehir / İstanbul. Binanın önünde hastalarımıza ayrılmış park yeri var.</p>
      <table class="saat-tablo"><tbody>
${[1, 2, 3, 4, 5, 6, 0].map((g) => `        <tr data-gun="${g}"><td>${GUN_AD[g]}</td><td>${SAATLER[g] ? `${SAATLER[g][0].replace(":", ".")} ile ${SAATLER[g][1].replace(":", ".")}` : "Kapalı"}</td></tr>`).join("\n")}
      </tbody></table>
      <a class="dugme" href="randevu.html">Randevu al</a>
    </div>
    <iframe title="Sedef Diş Kliniği harita konumu" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=29.110%2C40.984%2C29.138%2C41.000&amp;layer=mapnik&amp;marker=40.9923%2C29.1244"></iframe>
  </div>
</section>`),
    "hizmetler.html": sayfa("hizmetler.html", "Hizmetler · Sedef Diş Kliniği", "Muayene, diş taşı temizliği, dolgu, kanal tedavisi, implant, ortodonti, beyazlatma ve çocuk diş hekimliği.", `<section class="kapsayici bolum">
  <div class="bolum-ust"><div><h1 style="font-size:clamp(36px,5vw,54px)">Hizmetler</h1><p>Süreler ortalamadır; tedavi planı muayeneden sonra kişiye göre hazırlanır. Ücret bilgisi muayenede yazılı verilir.</p></div></div>
  <div class="hizmet-liste">
${HIZMETLER.map((h) => `    <article class="hizmet-uzun" id="${h.id}">${simge(h.id)}<div><h2>${h.ad}</h2><p>${h.uzun}</p><div class="bilgi"><span class="hap">Yaklaşık ${h.sure} dakika</span>${h.hekimler.map((x) => `<span class="hap">${HEKIMLER.find((k) => k.id === x)!.ad}</span>`).join("")}</div></div><a class="dugme kucuk" href="randevu.html?hizmet=${h.id}">Randevu al</a></article>`).join("\n")}
  </div>
</section>`),
    "hekimler.html": sayfa("hekimler.html", "Hekimler · Sedef Diş Kliniği", "Sedef Diş Kliniği hekimleri: estetik diş hekimliği, ortodonti, pedodonti, implant ve ağız cerrahisi.", `<section class="kapsayici bolum">
  <div class="bolum-ust"><div><h1 style="font-size:clamp(36px,5vw,54px)">Hekimlerimiz</h1><p>Hangi hekimin hangi gün klinikte olduğunu aşağıda görebilir, doğrudan randevu alabilirsin.</p></div></div>
  <div class="hekim-liste">
${HEKIMLER.map((h) => hekimKarti(h, true)).join("\n")}
  </div>
</section>`),
    "randevu.html": sayfa("randevu.html", "Online randevu · Sedef Diş Kliniği", "Sedef Diş Kliniği'nde boş saatleri gör, randevu talebini gönder.", `<section class="kapsayici randevu">
  <div>
    <h1>Online randevu</h1>
    <p>Hizmeti ve günü seç, boş saatlerden birine dokun. Talebini aldıktan sonra arayıp onaylıyoruz.</p>
    <form id="randevu" novalidate>
      <fieldset class="adim">
        <legend><span>1</span>Hizmet ve hekim</legend>
        <div class="ikili">
          <label class="alan">Hizmet<select id="hizmet" name="hizmet" required></select></label>
          <label class="alan">Hekim<select id="hekim" name="hekim"></select></label>
        </div>
      </fieldset>
      <fieldset class="adim">
        <legend><span>2</span>Gün ve saat</legend>
        <div class="gunler-serit" id="gunler" role="group" aria-label="Gün seç"></div>
        <div id="slotlar" aria-live="polite"></div>
        <div class="lejant" aria-hidden="true"><span><i></i>Boş</span><span><i class="s"></i>Seçili</span><span><i class="d"></i>Dolu</span><span id="bosSayi"></span></div>
      </fieldset>
      <fieldset class="adim">
        <legend><span>3</span>İletişim bilgilerin</legend>
        <div class="ikili">
          <label class="alan">Ad soyad<input name="ad" required autocomplete="name" minlength="3" /></label>
          <label class="alan">Cep telefonu<input name="telefon" type="tel" required autocomplete="tel" inputmode="tel" placeholder="05xx xxx xx xx" /></label>
        </div>
        <label class="alan" style="margin-top:14px">E-posta (isteğe bağlı)<input name="eposta" type="email" autocomplete="email" inputmode="email" /></label>
        <label class="alan" style="margin-top:14px">Şikâyetin ya da notun (isteğe bağlı)<textarea name="not" rows="3" maxlength="600" placeholder="Örneğin sağ alt dişte soğuğa hassasiyet"></textarea></label>
        <label class="onay"><input type="checkbox" name="ilk" /> <span>Kliniğe ilk kez geliyorum.</span></label>
        <label class="onay"><input type="checkbox" name="kvkk" required /> <span><a href="kvkk.html" target="_blank" rel="noopener">Aydınlatma metnini</a> okudum. Randevu ve tedavi süreci için sağlık verilerimin işlenmesine açık rıza veriyorum.</span></label>
        <label class="onay"><input type="checkbox" name="sms" /> <span>Randevu hatırlatması için SMS gönderilmesine izin veriyorum (isteğe bağlı).</span></label>
      </fieldset>
      <div id="mesaj" class="mesaj" role="alert" hidden></div>
    </form>
  </div>
  <aside class="ozet" aria-labelledby="ozetBaslik">
    <h2 id="ozetBaslik">Randevu özeti</h2>
    <dl><div><dt>Hizmet</dt><dd id="ozHizmet">Seçilmedi</dd></div><div><dt>Hekim</dt><dd id="ozHekim">İlk uygun hekim</dd></div><div><dt>Zaman</dt><dd id="ozZaman">Seçilmedi</dd></div></dl>
    <button class="dugme" id="gonder" type="submit" form="randevu">Randevu talebini gönder</button>
    <p>Bilgilerin yalnız randevun için kullanılır, başka ziyaretçiler göremez. Acil durumda 0216 455 72 30.</p>
  </aside>
</section>`),
    "kvkk.html": sayfa("kvkk.html", "KVKK aydınlatma metni · Sedef Diş Kliniği", "Sedef Ağız ve Diş Sağlığı Polikliniği kişisel verilerin işlenmesine ilişkin aydınlatma metni.", `<section class="kapsayici metin">
  <h1>Kişisel verilerin işlenmesine ilişkin aydınlatma metni</h1>
  <p>Sedef Ağız ve Diş Sağlığı Polikliniği olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 10. maddesi uyarınca, web sitemizdeki randevu formu ve klinikteki hizmet süreci kapsamında işlediğimiz kişisel verileriniz hakkında sizi bilgilendirmek isteriz.</p>
  <h2>Veri sorumlusu</h2>
  <p>Sedef Ağız ve Diş Sağlığı Polikliniği, Barbaros Mah. Begonya Sok. No: 7, Ataşehir / İstanbul. İletişim: kvkk@sedefdis.com.tr</p>
  <h2>İşlenen kişisel veriler</h2>
  <div class="tablo-kap"><table><thead><tr><th>Veri kategorisi</th><th>Örnek</th></tr></thead><tbody>
    <tr><td>Kimlik</td><td>Ad, soyad</td></tr>
    <tr><td>İletişim</td><td>Cep telefonu, e-posta adresi</td></tr>
    <tr><td>Sağlık verisi (özel nitelikli)</td><td>Formdaki şikâyet notu, muayene ve tedavi kayıtları, röntgen görüntüleri</td></tr>
    <tr><td>Randevu bilgisi</td><td>Seçilen hizmet, hekim, gün ve saat</td></tr>
  </tbody></table></div>
  <h2>İşleme amaçları</h2>
  <ul><li>Randevu talebinizi almak, onaylamak ve size hatırlatmak,</li><li>Muayene, teşhis ve tedavi hizmetlerinin yürütülmesi,</li><li>Sağlık mevzuatından doğan kayıt ve bildirim yükümlülüklerinin yerine getirilmesi,</li><li>İzin vermeniz hâlinde randevu hatırlatma SMS'i gönderilmesi.</li></ul>
  <h2>Hukuki sebepler</h2>
  <p>Kimlik, iletişim ve randevu verileriniz Kanun'un 5/2-c (sözleşmenin kurulması ve ifası) ve 5/2-ç (hukuki yükümlülük) maddelerine dayanılarak işlenir. Sağlık verileriniz Kanun'un 6. maddesi uyarınca açık rızanıza ya da tıbbi teşhis ve tedavi amacıyla sır saklama yükümlülüğü altındaki kişilerce işlenmesine dayanılarak işlenir.</p>
  <h2>Aktarım</h2>
  <p>Verileriniz yasal zorunluluk hâlinde Sağlık Bakanlığı ve yetkili kamu kurumlarıyla, hizmet aldığımız SMS ve barındırma sağlayıcılarıyla yalnız ilgili amaçla sınırlı olarak paylaşılır. Verileriniz pazarlama amacıyla üçüncü kişilere aktarılmaz.</p>
  <h2>Toplama yöntemi ve saklama süresi</h2>
  <p>Veriler web sitesindeki randevu formu, telefon ve klinikteki kayıt süreciyle elektronik ortamda toplanır. Randevu talepleri en çok iki yıl, sağlık kayıtları ise mevzuatta öngörülen süre boyunca saklanır.</p>
  <h2>Haklarınız</h2>
  <p>Kanun'un 11. maddesi uyarınca verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini ya da silinmesini isteme, aktarıldığı kişileri bilme ve zarara uğramanız hâlinde giderilmesini talep etme haklarına sahipsiniz. Açık rızanızı dilediğiniz zaman geri alabilirsiniz.</p>
  <h2>Başvuru</h2>
  <p>Başvurularınızı kimliğinizi doğrulayan bir dilekçeyle klinik adresimize ya da kvkk@sedefdis.com.tr adresine iletebilirsiniz. Başvurunuz en geç 30 gün içinde ücretsiz olarak yanıtlanır.</p>
  <p><a class="dugme" href="randevu.html">Randevu formuna dön</a></p>
</section>`),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#0d5c56"/><path d="M32 15c-4.4-3.2-13.2-4.8-17.6.8-4.4 5.8-2 14.8.6 21.2 1.8 4.8 2.4 10.4 3.2 15.2.6 3.2 4.8 3.6 6 .6l3.2-8.6c1.2-3.2 7.8-3.2 9 0l3.2 8.6c1.2 3 5.4 2.6 6-.6.8-4.8 1.4-10.4 3.2-15.2 2.6-6.4 5-15.4.6-21.2-4.4-5.6-13.2-4-17.4-.8z" fill="#f3f7f6"/></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
    "api/doluluk.js": DOLULUK,
  },
};
