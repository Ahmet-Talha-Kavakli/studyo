/* Şablon: Liman Depo · Stok Takibi — kafe ve bar için envanter uygulaması. Ürünler (stok kodu, kategori, birim, maliyet,
 * satış fiyatı, stok, kritik seviye, tedarikçi) "urunler" tablosunda; giriş, çıkış ve sayım hareketleri sonrasındaki stokla
 * birlikte "hareketler" tablosunda. Kritik stok uyarıları, stok değeri özeti, son 7 günün hareket grafiği, kategori süzgeci
 * ve arama, masaüstünde sıralanabilir tablo ve telefonda kartlar, ürün geçmişi grafiği ve CSV dışa aktarma. Tablolar
 * ekibe özeldir (kurallar kapalı). Galerideki canlı önizlemede gömülü kayıtlar ve bu cihazın belleğiyle çalışır. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";
import { PARA_JS, AYARLAR_TABLOSU } from "./parabirimi";

const G = (d: string) => `/gercek/havuz/gorsel/mk-urun-${d}.webp`;
const KATEGORILER = ["Kahve", "Çay", "Süt ürünleri", "İçecek", "Meyve", "Sarf", "Ekipman"];
const BIRIMLER = ["kg", "litre", "şişe", "paket", "adet", "torba", "kasa", "fıçı"];
const NEDENLER = { "Giriş": ["Satın alma", "İade", "Transfer"], "Çıkış": ["Kullanım", "Satış", "Fire", "Transfer"], "Sayım": ["Sayım düzeltmesi"] };

type Urun = { id: string; ad: string; sku: string; kategori: string; birim: string; maliyet: number; satis: number; stok: number; kritik: number; tedarikci: string; gorsel: string };
const U = (id: string, ad: string, sku: string, kategori: string, birim: string, maliyet: number, satis: number, stok: number, kritik: number, tedarikci: string, gorsel: string): Urun => ({ id, ad, sku, kategori, birim, maliyet, satis, stok, kritik, tedarikci, gorsel: gorsel ? G(gorsel) : "" });
const URUNLER: Urun[] = [
  U("p1", "Etiyopya Yirgacheffe çekirdek", "KHV-001", "Kahve", "kg", 920, 1450, 14, 8, "Kavruk Kahve Kavurma", "4982"),
  U("p2", "Kolombiya Huila çekirdek", "KHV-002", "Kahve", "kg", 780, 1250, 6, 8, "Kavruk Kahve Kavurma", "4989"),
  U("p3", "Liman espresso harmanı", "KHV-003", "Kahve", "kg", 640, 1100, 22, 10, "Kavruk Kahve Kavurma", "4985"),
  U("p4", "Öğütülmüş filtre kahve 250 g", "KHV-004", "Kahve", "paket", 210, 340, 40, 15, "Kavruk Kahve Kavurma", "4984"),
  U("p5", "Tam yağlı süt 1 L", "SUT-001", "Süt ürünleri", "litre", 38, 0, 26, 18, "Ege Süt Kooperatifi", "810"),
  U("p6", "Yulaf içeceği 1 L", "SUT-002", "Süt ürünleri", "litre", 95, 0, 9, 12, "Ege Süt Kooperatifi", "41859"),
  U("p7", "Rize siyah çay", "CAY-001", "Çay", "kg", 260, 0, 11, 5, "Çaykur Bayi Kadıköy", "43935"),
  U("p8", "Öküzgözü kırmızı şarap 75 cl", "ICK-001", "İçecek", "şişe", 420, 950, 28, 12, "Bağbozumu Şarapçılık", "22734"),
  U("p9", "Narince beyaz şarap 75 cl", "ICK-002", "İçecek", "şişe", 390, 890, 4, 10, "Bağbozumu Şarapçılık", "52418"),
  U("p10", "Köpüklü şarap 75 cl", "ICK-003", "İçecek", "şişe", 610, 1400, 12, 6, "Bağbozumu Şarapçılık", "51553"),
  U("p11", "Fıçı bira 30 L", "ICK-004", "İçecek", "fıçı", 3100, 0, 3, 2, "Liman İçecek Dağıtım", "8709"),
  U("p12", "Şişe bira 50 cl", "ICK-005", "İçecek", "şişe", 52, 180, 96, 48, "Liman İçecek Dağıtım", "52415"),
  U("p13", "Kahve likörü 70 cl", "ICK-006", "İçecek", "şişe", 560, 1300, 7, 4, "Liman İçecek Dağıtım", "4416"),
  U("p14", "Nar şurubu 1 L", "ICK-007", "İçecek", "şişe", 145, 0, 18, 6, "Liman İçecek Dağıtım", "5096"),
  U("p15", "Buz, 5 kg torba", "SRF-001", "Sarf", "torba", 45, 0, 0, 10, "Kristal Buz", "5081"),
  U("p16", "Mango ve muz kasası", "MEY-001", "Meyve", "kasa", 340, 0, 5, 3, "Hal Meyve", "10422"),
  U("p17", "Kokteyl çalkalayıcı", "EKP-001", "Ekipman", "adet", 380, 0, 6, 4, "Barista Ekipman", "4174"),
  U("p18", "Espresso grup contası", "EKP-002", "Ekipman", "adet", 240, 0, 2, 3, "Barista Ekipman", "3578"),
];

type HareketTohum = { id: string; urunId: string; tur: "Giriş" | "Çıkış" | "Sayım"; miktar: number; neden: string; not: string; kullanici: string; saatOnce: number };
const H = (id: string, urunId: string, tur: HareketTohum["tur"], miktar: number, neden: string, saatOnce: number, kullanici: string, not = ""): HareketTohum => ({ id, urunId, tur, miktar, neden, saatOnce, kullanici, not });
const HAM: HareketTohum[] = [
  H("h1", "p1", "Giriş", 10, "Satın alma", 300, "Derya Yıldız", "Fatura KV-2291"),
  H("h2", "p1", "Çıkış", 4, "Kullanım", 200, "Melis Aksu"),
  H("h3", "p1", "Çıkış", 3, "Kullanım", 90, "Melis Aksu"),
  H("h4", "p1", "Çıkış", 2, "Kullanım", 20, "Melis Aksu"),
  H("h5", "p2", "Giriş", 6, "Satın alma", 280, "Derya Yıldız", "Fatura KV-2291"),
  H("h6", "p2", "Çıkış", 5, "Kullanım", 150, "Melis Aksu"),
  H("h7", "p2", "Çıkış", 3, "Kullanım", 40, "Melis Aksu"),
  H("h8", "p3", "Giriş", 20, "Satın alma", 160, "Derya Yıldız", "Haftalık kavrum"),
  H("h9", "p3", "Çıkış", 6, "Kullanım", 60, "Melis Aksu"),
  H("h10", "p3", "Çıkış", 4, "Kullanım", 8, "Melis Aksu"),
  H("h11", "p5", "Giriş", 48, "Satın alma", 100, "Derya Yıldız"),
  H("h12", "p5", "Çıkış", 30, "Kullanım", 50, "Melis Aksu"),
  H("h13", "p5", "Çıkış", 14, "Kullanım", 5, "Melis Aksu"),
  H("h14", "p6", "Çıkış", 8, "Kullanım", 70, "Melis Aksu"),
  H("h15", "p6", "Çıkış", 5, "Kullanım", 10, "Melis Aksu"),
  H("h16", "p8", "Giriş", 24, "Satın alma", 230, "Derya Yıldız", "İki koli"),
  H("h17", "p8", "Çıkış", 9, "Satış", 120, "Kaan Erol"),
  H("h18", "p8", "Çıkış", 1, "Fire", 30, "Kaan Erol", "Servis sırasında kırıldı"),
  H("h19", "p9", "Çıkış", 7, "Satış", 140, "Kaan Erol"),
  H("h20", "p9", "Çıkış", 5, "Satış", 26, "Kaan Erol", "Cuma akşamı grup rezervasyonu"),
  H("h21", "p12", "Giriş", 120, "Satın alma", 190, "Derya Yıldız", "Beş kasa"),
  H("h22", "p12", "Çıkış", 48, "Satış", 96, "Kaan Erol"),
  H("h23", "p12", "Çıkış", 30, "Satış", 14, "Kaan Erol"),
  H("h24", "p15", "Giriş", 20, "Satın alma", 180, "Derya Yıldız"),
  H("h25", "p15", "Çıkış", 12, "Kullanım", 100, "Kaan Erol"),
  H("h26", "p15", "Çıkış", 8, "Kullanım", 12, "Kaan Erol", "Teras açıldı, tüketim arttı"),
  H("h27", "p16", "Çıkış", 2, "Fire", 120, "Kaan Erol", "Fazla olgunlaştı"),
  H("h28", "p16", "Sayım", 5, "Sayım düzeltmesi", 48, "Derya Yıldız"),
  H("h29", "p18", "Çıkış", 1, "Kullanım", 60, "Melis Aksu", "Sol grup contası değişti"),
  H("h30", "p11", "Giriş", 2, "Satın alma", 210, "Derya Yıldız"),
  H("h31", "p11", "Çıkış", 2, "Satış", 70, "Kaan Erol"),
  H("h32", "p13", "Çıkış", 2, "Satış", 36, "Kaan Erol"),
  H("h33", "p4", "Çıkış", 6, "Satış", 30, "Melis Aksu"),
  H("h34", "p10", "Sayım", 12, "Sayım düzeltmesi", 22, "Derya Yıldız", "Bir şişe eksik çıktı"),
  H("h35", "p7", "Giriş", 6, "Satın alma", 260, "Derya Yıldız"),
  H("h36", "p7", "Çıkış", 2, "Kullanım", 110, "Melis Aksu"),
  H("h37", "p17", "Giriş", 2, "Satın alma", 330, "Derya Yıldız"),
];
/* Her hareketin değişimini ve sonrasındaki stoku, ürünün bugünkü stokundan geriye doğru hesaplar. */
type Hareket = HareketTohum & { urunAd: string; degisim: number; sonra: number };
const HAREKETLER: Hareket[] = (() => {
  const l: Hareket[] = [];
  for (const u of URUNLER) {
    const h = HAM.filter((x) => x.urunId === u.id).sort((a, b) => b.saatOnce - a.saatOnce);
    // Sayımda değişim bilinmez; sondan başa doğru: sonra = o anki stok, önce = sonra - değişim.
    let s = u.stok;
    const ters: Hareket[] = [];
    for (let i = h.length - 1; i >= 0; i--) {
      const x = h[i];
      const sonra = s;
      let degisim: number;
      if (x.tur === "Giriş") degisim = x.miktar;
      else if (x.tur === "Çıkış") degisim = -x.miktar;
      else degisim = -1; // tohumdaki sayımların ikisi de bir eksik çıktı
      s = sonra - degisim;
      ters.push({ ...x, urunAd: u.ad, degisim, sonra: x.tur === "Sayım" ? x.miktar : sonra });
    }
    l.push(...ters.reverse());
  }
  return l.sort((a, b) => b.saatOnce - a.saatOnce);
})();

function tablolarKur(): Record<string, SablonTablo> {
  const z = Date.now();
  return {
    urunler: {
      aciklama: "Depodaki ürünler. stok güncel miktardır (hareket eklenince güncellenir); kritik seviyenin altına inen ürün uyarıda görünür. Ekibe özel.",
      kurallar: { okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" },
      sema: [
        { ad: "ad", tur: "metin", zorunlu: true },
        { ad: "sku", tur: "metin", zorunlu: true, benzersiz: true, aciklama: "Stok kodu" },
        { ad: "kategori", tur: "secim", secenekler: KATEGORILER },
        { ad: "birim", tur: "secim", secenekler: BIRIMLER, varsayilan: "adet" },
        { ad: "maliyet", tur: "sayi", aciklama: "Birim maliyet, ayarlar tablosundaki para biriminde" },
        { ad: "satis", tur: "sayi", aciklama: "Birim satış fiyatı, ayarlar tablosundaki para biriminde (satılmıyorsa 0)" },
        { ad: "stok", tur: "sayi", varsayilan: 0 },
        { ad: "kritik", tur: "sayi", varsayilan: 0, aciklama: "Bu miktara inince uyarı" },
        { ad: "tedarikci", tur: "metin" },
        { ad: "gorsel", tur: "gorsel" },
      ],
      kayitlar: URUNLER,
    },
    ayarlar: AYARLAR_TABLOSU({ aciklama: "Depo ayarları (tek kayıt, id ayarlar). paraBirimi: maliyet ve satış fiyatlarının para birimi, ISO 4217 kodu." }),
    hareketler: {
      aciklama: "Stok hareketleri: giriş, çıkış ve sayım. degisim işaretli miktardır, sonra hareketten sonraki stoktur.",
      kurallar: { okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" },
      sema: [
        { ad: "urunId", tur: "iliski", iliski: "urunler", zorunlu: true },
        { ad: "urunAd", tur: "metin" },
        { ad: "tur", tur: "secim", zorunlu: true, secenekler: ["Giriş", "Çıkış", "Sayım"] },
        { ad: "miktar", tur: "sayi", zorunlu: true },
        { ad: "degisim", tur: "sayi" },
        { ad: "sonra", tur: "sayi" },
        { ad: "neden", tur: "metin" },
        { ad: "not", tur: "metin" },
        { ad: "kullanici", tur: "metin" },
        { ad: "zaman", tur: "metin", aciklama: "ISO zaman" },
      ],
      kayitlar: HAREKETLER.map((h) => ({ id: h.id, urunId: h.urunId, urunAd: h.urunAd, tur: h.tur, miktar: h.miktar, degisim: h.degisim, sonra: h.sonra, neden: h.neden, not: h.not, kullanici: h.kullanici, zaman: new Date(z - h.saatOnce * 3600000).toISOString() })),
    },
  };
}

const STIL = String.raw`/* Liman Depo — sıcak kömür zemin, iş güvenliği sarısı imza, yeşil ve mercan durum renkleri; Space Grotesk ve Inter. */
:root {
  --zemin: #121110;
  --panel: #1a1917;
  --panel-2: #22201d;
  --panel-3: #2a2824;
  --cizgi: #2e2b27;
  --cizgi-2: #3b3833;
  --metin: #f2eee7;
  --metin-2: #b9b2a6;
  --metin-3: #8a8378;
  --sari: #ffb21e;
  --sari-2: #ffc44d;
  --sari-koyu: #2b2210;
  --yesil: #5fd394;
  --yesil-koyu: #15291e;
  --mercan: #ff6e57;
  --mercan-koyu: #33170f;
  --r: 16px;
  --yazi: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --baslik: "Space Grotesk", "Inter", system-ui, sans-serif;
  --egri: cubic-bezier(.22, 1, .36, 1);
  color-scheme: dark;
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
[hidden] { display: none !important; }
html, body { margin: 0; }
body { background: var(--zemin); color: var(--metin); font: 14px/1.45 var(--yazi); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
button, input, select, textarea { font: inherit; color: inherit; }
button { cursor: pointer; }
:focus-visible { outline: 2px solid var(--sari); outline-offset: 2px; }
h1, h2, h3 { margin: 0; font-family: var(--baslik); font-weight: 600; letter-spacing: -0.02em; }
.sayi { font-family: var(--baslik); font-variant-numeric: tabular-nums; }

/* Üst çubuk */
.ust { position: sticky; top: 0; z-index: 40; background: rgba(18,17,16,.86); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid var(--cizgi); }
.ust-ic { max-width: 1400px; margin: 0 auto; padding: 12px 28px; display: flex; align-items: center; gap: 20px; }
.marka { display: flex; align-items: center; gap: 11px; min-width: 0; }
.marka svg { width: 36px; height: 36px; flex: none; }
.marka b { display: block; font-family: var(--baslik); font-size: 17px; font-weight: 600; letter-spacing: -0.02em; }
.marka small { display: block; color: var(--metin-3); font-size: 12px; white-space: nowrap; }
.sekmeler { display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: var(--panel); border: 1px solid var(--cizgi); margin-left: 12px; }
.sekmeler button { border: 0; background: none; height: 34px; padding: 0 14px; border-radius: 9px; color: var(--metin-2); font-weight: 500; display: inline-flex; align-items: center; gap: 8px; }
.sekmeler button[aria-current="page"] { background: var(--panel-3); color: var(--metin); }
.sekmeler .rozet { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: var(--mercan); color: #1b0b06; font-size: 11.5px; font-weight: 700; display: grid; place-items: center; }
.bosluk { flex: 1; }
.pb-sec { flex: none; }
.pb-sec select { height: 40px; border-radius: 11px; border: 1px solid var(--cizgi-2); background: var(--panel-2); color: var(--metin); font-weight: 600; padding: 0 8px; }
.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 40px; padding: 0 16px; border-radius: 11px; border: 1px solid var(--cizgi-2); background: var(--panel-2); color: var(--metin); font-weight: 600; white-space: nowrap; transition: background .2s, border-color .2s, transform .15s; }
.dugme:hover { background: var(--panel-3); }
.dugme:active { transform: scale(.98); }
.dugme svg { width: 17px; height: 17px; flex: none; }
.dugme.ana { background: var(--sari); border-color: var(--sari); color: #1d1404; }
.dugme.ana:hover { background: var(--sari-2); }
.dugme.tehlike { color: var(--mercan); }
.dugme.tehlike:hover { background: var(--mercan-koyu); border-color: #5a2a1f; }
.dugme.kucuk { height: 34px; padding: 0 12px; font-size: 13px; border-radius: 9px; }
.dugme[disabled] { opacity: .5; cursor: not-allowed; }
.ikon-dugme { width: 40px; height: 40px; border-radius: 11px; border: 1px solid var(--cizgi-2); background: var(--panel-2); display: grid; place-items: center; flex: none; }
.ikon-dugme svg { width: 18px; height: 18px; }
.ikon-dugme:hover { background: var(--panel-3); }

main { max-width: 1400px; margin: 0 auto; padding: 22px 28px 60px; }
.sayfa-bas { display: flex; align-items: flex-end; gap: 16px; margin-bottom: 18px; }
.sayfa-bas h1 { font-size: 28px; }
.sayfa-bas p { margin: 4px 0 0; color: var(--metin-3); }

/* Özet */
.ozet { display: grid; grid-template-columns: 1.25fr 1fr 1fr 1.35fr; gap: 12px; margin-bottom: 14px; }
.ozet > div { background: var(--panel); border: 1px solid var(--cizgi); border-radius: var(--r); padding: 16px 18px; min-width: 0; position: relative; overflow: hidden; }
.ozet span.et { display: flex; align-items: center; gap: 7px; color: var(--metin-2); font-size: 13px; }
.ozet span.et i { width: 8px; height: 8px; border-radius: 50%; background: var(--renk, var(--sari)); }
.ozet b { display: block; font-family: var(--baslik); font-size: 28px; font-weight: 600; letter-spacing: -0.03em; margin-top: 6px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.ozet small { display: block; color: var(--metin-3); font-size: 12.5px; margin-top: 2px; }
.ozet .uyari b { color: var(--mercan); }
.grafik7 { display: flex; align-items: flex-end; gap: 6px; height: 64px; margin-top: 8px; }
.grafik7 .gun { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 0; height: 100%; justify-content: center; }
.grafik7 .gun i { display: block; width: 100%; max-width: 22px; border-radius: 4px; }
.grafik7 .gir { background: var(--yesil); align-self: center; }
.grafik7 .cik { background: var(--mercan); opacity: .85; }
.grafik7 .gun em { font-style: normal; font-size: 10.5px; color: var(--metin-3); }
.grafik7 .ust-y { flex: 1; display: flex; align-items: flex-end; width: 100%; justify-content: center; }
.grafik7 .alt-y { flex: 1; display: flex; align-items: flex-start; width: 100%; justify-content: center; }
.lejant { display: flex; gap: 12px; font-size: 12px; color: var(--metin-3); }
.lejant span { display: inline-flex; align-items: center; gap: 5px; }
.lejant span::before { content: ""; width: 8px; height: 8px; border-radius: 2px; background: var(--renk); }

/* Kritik şeridi */
.kritik { background: linear-gradient(180deg, #221a0e, var(--panel)); border: 1px solid #3d2f14; border-radius: var(--r); padding: 14px 16px; margin-bottom: 18px; }
.kritik-bas { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.kritik-bas svg { width: 20px; height: 20px; color: var(--sari); flex: none; }
.kritik-bas h2 { font-size: 16px; }
.kritik-bas span { color: var(--metin-3); font-size: 13px; }
.kritik-bas button { margin-left: auto; }
.kritik-liste { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: thin; padding-bottom: 4px; scroll-snap-type: x proximity; }
.kritik-kart { flex: 0 0 268px; display: flex; gap: 11px; align-items: center; padding: 10px; border-radius: 13px; background: var(--panel); border: 1px solid var(--cizgi); scroll-snap-align: start; min-width: 0; }
.kritik-kart .metin { flex: 1; min-width: 0; }
.kritik-kart b { display: block; font-weight: 600; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
.kritik-kart small { display: block; font-size: 12.5px; color: var(--metin-3); margin-top: 1px; }
.kritik-kart small strong { color: var(--sari); font-weight: 600; }
.kritik-kart.tukendi small strong { color: var(--mercan); }
.kritik-kart button { flex: none; }

/* Ürün resmi */
.res { width: 44px; height: 44px; border-radius: 11px; object-fit: cover; background: var(--panel-3); flex: none; display: grid; place-items: center; color: var(--metin-3); font-family: var(--baslik); font-weight: 600; font-size: 14px; }
.res.b36 { width: 36px; height: 36px; border-radius: 9px; font-size: 12px; }
.res.b56 { width: 56px; height: 56px; border-radius: 13px; }
.res.b72 { width: 72px; height: 72px; border-radius: 16px; font-size: 20px; }

/* Araç çubuğu */
.arac { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.ara { position: relative; width: 300px; }
.ara svg { position: absolute; left: 12px; top: 50%; width: 17px; height: 17px; transform: translateY(-50%); color: var(--metin-3); pointer-events: none; }
.ara input { width: 100%; height: 40px; padding: 0 12px 0 38px; border-radius: 11px; border: 1px solid var(--cizgi-2); background: var(--panel); outline: none; }
.ara input:focus { border-color: var(--sari); }
.ara input::placeholder { color: var(--metin-3); }
.cipler { display: flex; gap: 6px; flex-wrap: wrap; }
.cip { height: 34px; padding: 0 13px; border-radius: 999px; border: 1px solid var(--cizgi-2); background: transparent; color: var(--metin-2); font-weight: 500; font-size: 13px; white-space: nowrap; display: inline-flex; align-items: center; gap: 7px; }
.cip:hover { color: var(--metin); border-color: #4a463f; }
.cip[aria-pressed="true"] { background: var(--metin); color: var(--zemin); border-color: var(--metin); }
.cip small { font-size: 11.5px; opacity: .7; }
.anahtar { display: inline-flex; align-items: center; gap: 9px; color: var(--metin-2); font-size: 13px; cursor: pointer; margin-left: auto; white-space: nowrap; }
.anahtar input { position: absolute; opacity: 0; pointer-events: none; }
.anahtar .ray { width: 36px; height: 21px; border-radius: 999px; background: var(--panel-3); border: 1px solid var(--cizgi-2); position: relative; transition: background .2s; flex: none; }
.anahtar .ray::after { content: ""; position: absolute; top: 2px; left: 2px; width: 15px; height: 15px; border-radius: 50%; background: var(--metin-2); transition: transform .2s var(--egri), background .2s; }
.anahtar input:checked + .ray { background: var(--sari); border-color: var(--sari); }
.anahtar input:checked + .ray::after { transform: translateX(15px); background: #1d1404; }
.anahtar input:focus-visible + .ray { outline: 2px solid var(--sari); outline-offset: 2px; }
.sirala-sec { display: none; height: 40px; border-radius: 11px; border: 1px solid var(--cizgi-2); background: var(--panel); padding: 0 10px; }

/* Tablo */
.tablo-kap { background: var(--panel); border: 1px solid var(--cizgi); border-radius: var(--r); overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; font-size: 12.5px; font-weight: 500; color: var(--metin-3); padding: 0; border-bottom: 1px solid var(--cizgi); background: var(--panel-2); white-space: nowrap; }
th button { all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 5px; width: 100%; padding: 12px 14px; cursor: pointer; }
th button:hover { color: var(--metin); }
th button:focus-visible { outline: 2px solid var(--sari); outline-offset: -2px; }
th button svg { width: 12px; height: 12px; opacity: 0; transition: opacity .15s, transform .2s; }
th[aria-sort] button { color: var(--metin); }
th[aria-sort] button svg { opacity: 1; }
th[aria-sort="descending"] button svg { transform: rotate(180deg); }
th.sag button { justify-content: flex-end; }
th.duz { padding: 12px 14px; }
td { padding: 11px 14px; border-bottom: 1px solid var(--cizgi); vertical-align: middle; }
tbody tr:last-child td { border-bottom: 0; }
tbody tr { transition: background .15s; }
tbody tr.tik { cursor: pointer; }
tbody tr.tik:hover { background: #1f1d1a; }
.sag { text-align: right; }
.soluk { color: var(--metin-3); }
.urun-hucre { display: flex; align-items: center; gap: 12px; min-width: 0; }
.urun-hucre b { display: block; font-weight: 600; }
.urun-hucre small { display: block; color: var(--metin-3); font-size: 12px; font-family: var(--baslik); letter-spacing: .02em; }
.stok-hucre { min-width: 150px; }
.stok-hucre .ust-s { display: flex; align-items: baseline; gap: 6px; }
.stok-hucre .ust-s b { font-family: var(--baslik); font-size: 16px; font-weight: 600; font-variant-numeric: tabular-nums; }
.stok-hucre .ust-s span { color: var(--metin-3); font-size: 12.5px; }
.cubuk { position: relative; height: 5px; border-radius: 9px; background: var(--panel-3); margin-top: 6px; overflow: hidden; }
.cubuk i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 9px; background: var(--yesil); }
.cubuk[data-d="kritik"] i { background: var(--sari); }
.cubuk[data-d="tukendi"] i { background: var(--mercan); }
.cubuk em { position: absolute; top: -2px; bottom: -2px; width: 2px; background: var(--metin-3); opacity: .7; }
.durum { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: 999px; white-space: nowrap; }
.durum::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.durum[data-d="yeterli"] { background: var(--yesil-koyu); color: var(--yesil); }
.durum[data-d="kritik"] { background: var(--sari-koyu); color: var(--sari); }
.durum[data-d="tukendi"] { background: var(--mercan-koyu); color: var(--mercan); }
.hizli { display: inline-flex; gap: 4px; }
.hizli button { width: 32px; height: 32px; border-radius: 9px; border: 1px solid var(--cizgi-2); background: var(--panel-2); display: grid; place-items: center; color: var(--metin-2); }
.hizli button:hover { color: var(--metin); background: var(--panel-3); }
.hizli button svg { width: 15px; height: 15px; }
.hizli button.gir:hover { color: var(--yesil); border-color: #2d5a40; }
.hizli button.cik:hover { color: var(--mercan); border-color: #5a2a1f; }
tfoot td { background: var(--panel-2); font-weight: 600; border-top: 1px solid var(--cizgi); border-bottom: 0; }
.bos { padding: 54px 20px; text-align: center; color: var(--metin-3); }
.bos b { display: block; color: var(--metin); font-size: 16px; margin-bottom: 4px; font-family: var(--baslik); }
.marj { font-variant-numeric: tabular-nums; }
.marj.iyi { color: var(--yesil); }

/* Kartlar (dar ekran) */
.kartlar { display: none; }
.ukart { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 4px 12px; align-items: center; padding: 12px; background: var(--panel); border: 1px solid var(--cizgi); border-radius: 16px; }
.ukart .res { grid-row: span 2; }
.ukart .ad { min-width: 0; cursor: pointer; }
.ukart .ad b { display: block; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ukart .ad small { color: var(--metin-3); font-size: 12px; font-family: var(--baslik); }
.ukart .stk { text-align: right; }
.ukart .stk b { font-family: var(--baslik); font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }
.ukart .stk span { color: var(--metin-3); font-size: 12px; margin-left: 3px; }
.ukart .alt-k { grid-column: 2 / 4; display: flex; align-items: center; gap: 8px; }
.ukart .alt-k .cubuk { flex: 1; margin: 0; }
.ukart .alt-k .hizli button { width: 38px; height: 38px; }

/* Hareketler */
.hareket-tur { display: inline-flex; align-items: center; gap: 7px; font-weight: 600; font-size: 13px; }
.hareket-tur i { width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; flex: none; }
.hareket-tur i svg { width: 14px; height: 14px; }
.hareket-tur[data-t="Giriş"] i { background: var(--yesil-koyu); color: var(--yesil); }
.hareket-tur[data-t="Çıkış"] i { background: var(--mercan-koyu); color: var(--mercan); }
.hareket-tur[data-t="Sayım"] i { background: #1c2333; color: #8fb3ff; }
.degisim { font-family: var(--baslik); font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.degisim.arti { color: var(--yesil); }
.degisim.eksi { color: var(--mercan); }
.hkart { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 2px 12px; align-items: center; padding: 12px; border-bottom: 1px solid var(--cizgi); }
.hkart:last-child { border-bottom: 0; }
.hkart .metin { min-width: 0; }
.hkart .metin b { display: block; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hkart .metin small { display: block; color: var(--metin-3); font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hkart .sag small { display: block; color: var(--metin-3); font-size: 12px; }
.gun-baslik { padding: 10px 12px 6px; color: var(--metin-3); font-size: 12.5px; font-weight: 600; background: var(--panel-2); border-bottom: 1px solid var(--cizgi); }

/* Çekmece */
.perde { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.5); opacity: 0; pointer-events: none; transition: opacity .25s; }
.perde.acik { opacity: 1; pointer-events: auto; }
.cekmece { position: fixed; top: 0; right: 0; bottom: 0; z-index: 70; width: min(560px, 100vw); background: var(--panel); border-left: 1px solid var(--cizgi); transform: translateX(102%); transition: transform .35s var(--egri); display: flex; flex-direction: column; }
.cekmece.acik { transform: none; }
.cek-bas { display: flex; align-items: center; gap: 8px; padding: 14px 18px; border-bottom: 1px solid var(--cizgi); }
.cek-govde { flex: 1; overflow-y: auto; padding: 22px; overscroll-behavior: contain; }
.cek-urun { display: flex; gap: 16px; align-items: center; }
.cek-urun h2 { font-size: 22px; line-height: 1.2; }
.cek-urun p { margin: 4px 0 0; color: var(--metin-3); font-family: var(--baslik); font-size: 13px; }
.buyuk-stok { display: flex; align-items: flex-end; gap: 14px; margin-top: 20px; flex-wrap: wrap; }
.buyuk-stok b { font-family: var(--baslik); font-size: 44px; line-height: 1; font-weight: 600; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
.buyuk-stok span { color: var(--metin-2); padding-bottom: 5px; }
.buyuk-stok .durum { margin-bottom: 6px; }
.cek-eylem { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 16px; }
.grafik-kap { margin-top: 20px; background: var(--panel-2); border: 1px solid var(--cizgi); border-radius: 14px; padding: 14px 14px 8px; }
.grafik-kap h3 { font-size: 14px; display: flex; justify-content: space-between; gap: 10px; }
.grafik-kap h3 span { font-family: var(--yazi); font-weight: 400; color: var(--metin-3); font-size: 12.5px; }
.grafik-kap svg { display: block; width: 100%; height: 130px; margin-top: 8px; overflow: visible; }
.bilgi { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--cizgi); border: 1px solid var(--cizgi); border-radius: 14px; overflow: hidden; margin-top: 16px; }
.bilgi > div { background: var(--panel); padding: 11px 13px; min-width: 0; }
.bilgi span { display: block; font-size: 12px; color: var(--metin-3); }
.bilgi b { display: block; margin-top: 2px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.bolum-bas { font-size: 15px; margin: 24px 0 8px; display: flex; align-items: center; gap: 8px; }
.bolum-bas small { color: var(--metin-3); font-family: var(--yazi); font-weight: 500; font-size: 13px; }
.mini-hareket { border: 1px solid var(--cizgi); border-radius: 14px; overflow: hidden; }

/* Pencere */
.pencere-kap { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 20px; background: rgba(0,0,0,.55); opacity: 0; pointer-events: none; transition: opacity .2s; }
.pencere-kap.acik { opacity: 1; pointer-events: auto; }
.pencere { width: min(540px, 100%); max-height: calc(100dvh - 40px); overflow-y: auto; background: var(--panel); border: 1px solid var(--cizgi-2); border-radius: 20px; padding: 22px; transform: translateY(10px); transition: transform .3s var(--egri); }
.pencere-kap.acik .pencere { transform: none; }
.pencere h2 { font-size: 20px; }
.pencere > p { margin: 4px 0 16px; color: var(--metin-2); }
.form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form .tam { grid-column: 1 / -1; }
.alan { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.alan > span { font-size: 12.5px; font-weight: 500; color: var(--metin-2); }
.alan input, .alan select { width: 100%; min-width: 0; height: 42px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--cizgi-2); background: var(--panel-2); outline: none; transition: border-color .2s; }
.alan input:focus, .alan select:focus { border-color: var(--sari); }
.miktar-kap { position: relative; }
.miktar-kap input { padding-right: 64px; font-family: var(--baslik); font-size: 18px; font-weight: 600; }
.miktar-kap em { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-style: normal; color: var(--metin-3); }
.tur-sec { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.tur-sec button { height: 46px; border-radius: 11px; border: 1px solid var(--cizgi-2); background: var(--panel-2); font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 7px; color: var(--metin-2); }
.tur-sec button svg { width: 16px; height: 16px; }
.tur-sec button[aria-pressed="true"][data-t="Giriş"] { background: var(--yesil-koyu); border-color: var(--yesil); color: var(--yesil); }
.tur-sec button[aria-pressed="true"][data-t="Çıkış"] { background: var(--mercan-koyu); border-color: var(--mercan); color: var(--mercan); }
.tur-sec button[aria-pressed="true"][data-t="Sayım"] { background: #1c2333; border-color: #8fb3ff; color: #8fb3ff; }
.onizleme { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; background: var(--panel-2); border: 1px dashed var(--cizgi-2); color: var(--metin-2); }
.onizleme b { font-family: var(--baslik); color: var(--metin); font-size: 18px; font-variant-numeric: tabular-nums; }
.onizleme .ok { color: var(--metin-3); }
.onizleme.hatali { border-color: var(--mercan); color: var(--mercan); }
.pencere .eylem { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.hata-yazi { color: var(--mercan); font-size: 13px; margin: 0; }
.resim-sec { display: grid; grid-template-columns: repeat(auto-fill, minmax(52px, 1fr)); gap: 6px; }
.resim-sec button { aspect-ratio: 1; border-radius: 10px; border: 2px solid transparent; padding: 0; overflow: hidden; background: var(--panel-3); color: var(--metin-3); font-size: 11.5px; }
.resim-sec button img { width: 100%; height: 100%; object-fit: cover; display: block; }
.resim-sec button[aria-pressed="true"] { border-color: var(--sari); }

.kilit { min-height: 60vh; display: grid; place-items: center; text-align: center; }
.kilit div { max-width: 420px; }
.kilit svg { width: 44px; height: 44px; color: var(--sari); }
.kilit h2 { margin: 12px 0 6px; }
.kilit p { color: var(--metin-2); margin: 0; }
.iskelet { height: 420px; border-radius: var(--r); background: linear-gradient(90deg, var(--panel), var(--panel-2), var(--panel)); background-size: 200% 100%; animation: akis 1.2s linear infinite; }
@keyframes akis { to { background-position: -200% 0; } }
@keyframes vurgu { from { background: rgba(255,178,30,.18); } to { background: transparent; } }
tr.yeni td, .ukart.yeni { animation: vurgu 1.6s var(--egri); }

.bildirim { position: fixed; left: 50%; bottom: 24px; z-index: 120; transform: translate(-50%, calc(100% + 120px)); visibility: hidden; background: var(--metin); color: var(--zemin); padding: 12px 18px; border-radius: 12px; font-weight: 600; transition: transform .35s var(--egri), visibility 0s .35s; max-width: calc(100vw - 32px); }
.bildirim.acik { transform: translate(-50%, 0); visibility: visible; transition: transform .35s var(--egri); }
.bildirim[data-tur="hata"] { background: var(--mercan); color: #1b0b06; }
.mobil-eylem { display: none; }

@media (max-width: 1100px) {
  .ozet { grid-template-columns: 1fr 1fr; }
  .gizle-orta { display: none; }
}
@media (max-width: 760px) {
  .ust-ic { padding: 10px 14px; gap: 10px; flex-wrap: wrap; }
  .marka small { display: none; }
  .sekmeler { order: 3; width: 100%; margin: 0; }
  .sekmeler button { flex: 1; justify-content: center; }
  .ust .dugme span, .ust .gizle-mobil { display: none; }
  .ust .dugme { width: 40px; padding: 0; }
  main { padding: 16px 14px 110px; }
  .sayfa-bas h1 { font-size: 23px; }
  .sayfa-bas .dugme { display: none; }
  .ozet { gap: 8px; }
  .ozet > div { padding: 13px 14px; }
  .ozet b { font-size: 21px; }
  .ozet > div.genis { grid-column: 1 / -1; }
  .kritik-kart { flex-basis: 82%; }
  .arac { gap: 8px; }
  .ara { width: auto; flex: 1; }
  .sirala-sec { display: block; width: 132px; }
  .cipler { order: 3; width: calc(100% + 28px); margin: 0 -14px; padding: 0 14px; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
  .cipler::-webkit-scrollbar { display: none; }
  .anahtar { order: 4; margin-left: 0; }
  .tablo-kap.urun-tablo { display: none; }
  .kartlar { display: flex; flex-direction: column; gap: 8px; }
  .hareket-tablo { display: none; }
  .cekmece { width: 100vw; border-left: 0; }
  .cek-govde { padding: 18px 16px 30px; }
  .buyuk-stok b { font-size: 38px; }
  .pencere-kap { align-items: end; padding: 0; }
  .pencere { border-radius: 20px 20px 0 0; max-height: 92dvh; padding: 20px 16px calc(20px + env(safe-area-inset-bottom)); }
  .form { grid-template-columns: 1fr; }
  .mobil-eylem { display: flex; position: fixed; left: 14px; right: 14px; bottom: calc(14px + env(safe-area-inset-bottom)); z-index: 30; }
  .mobil-eylem .dugme { flex: 1; height: 52px; border-radius: 15px; font-size: 15px; }
  .bildirim { bottom: 84px; }
}
@media (min-width: 761px) { .hareket-kartlar { display: none; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
`;

const UYGULAMA = ORTAK_JS + PARA_JS("liman-depo-para-birimi") + "\nvar TOHUM = " + JSON.stringify({ urunler: URUNLER, hareketler: HAREKETLER }) + ";\nvar KATEGORILER = " + JSON.stringify(KATEGORILER) + ";\nvar BIRIMLER = " + JSON.stringify(BIRIMLER) + ";\nvar NEDENLER = " + JSON.stringify(NEDENLER) + ";\nvar RESIMLER = " + JSON.stringify([...new Set(URUNLER.map((u) => u.gorsel).filter(Boolean))]) + ";\n" + String.raw`
/* Liman Depo. Veriler Vayra Veri tablolarında (urunler, hareketler); galerideki önizlemede bu cihazın belleğinde. */
var KULLANICI = "Derya Yıldız";
var S = { urunler: [], hareketler: [], gorunum: "urunler", kategori: "", ara: "", kritikYalniz: false, sirala: { alan: "ad", yon: 1 }, hTur: "", cekmece: null, yuklendi: false, kilit: "" };
var IK = {
  arti: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  eksi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  giris: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v13M6.5 11.5 12 17l5.5-5.5M5 20h14"/></svg>',
  cikis: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V7M6.5 12.5 12 7l5.5 5.5M5 4h14"/></svg>',
  sayim: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4.5V3h6v1.5M9 11l2 2 4-4M9 17h6"/></svg>',
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>',
  kapat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  duzenle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  cop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  uyari: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2v.3"/></svg>',
  kilit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>'
};
IK["Giriş"] = IK.giris; IK["Çıkış"] = IK.cikis; IK["Sayım"] = IK.sayim;

/* ── Depo: Vayra Veri ya da bu cihazın belleği ── */
var YEREL = "liman-depo-v1", yerel = null;
function tohumCoz() {
  var z = Date.now();
  return {
    surum: 1,
    urunler: TOHUM.urunler.map(function (u) { return Object.assign({ olusturma: z, guncelleme: z }, u); }),
    hareketler: TOHUM.hareketler.map(function (h) { var r = Object.assign({}, h, { zaman: new Date(z - h.saatOnce * 3600000).toISOString(), olusturma: z, guncelleme: z }); delete r.saatOnce; return r; })
  };
}
function yerelAl() {
  if (!yerel) { try { yerel = JSON.parse(localStorage.getItem(YEREL) || "null"); } catch (e) { yerel = null; } if (!yerel || yerel.surum !== 1) { yerel = tohumCoz(); yerelYaz(); } }
  return yerel;
}
function yerelYaz() { try { localStorage.setItem(YEREL, JSON.stringify(yerel)); } catch (e) { /* bellek dolu */ } }
function yeniId() { return "y" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
var Depo = {
  liste: function (kol) { return veriVar() ? vayra.veri.liste(kol, { sinir: 1000 }) : Promise.resolve(yerelAl()[kol].map(function (k) { return Object.assign({}, k); })); },
  ekle: function (kol, k) {
    if (veriVar()) return vayra.veri.ekle(kol, k);
    var l = yerelAl()[kol];
    if (kol === "urunler" && l.some(function (x) { return x.sku === k.sku; })) return Promise.reject(new Error("Bu stok kodu zaten kullanılıyor."));
    var r = Object.assign({ id: yeniId(), olusturma: Date.now(), guncelleme: Date.now() }, k);
    l.push(r); yerelYaz(); return Promise.resolve(Object.assign({}, r));
  },
  guncelle: function (kol, id, a) {
    if (veriVar()) return vayra.veri.guncelle(kol, id, a);
    var l = yerelAl()[kol];
    if (kol === "urunler" && a.sku && l.some(function (x) { return x.sku === a.sku && x.id !== id; })) return Promise.reject(new Error("Bu stok kodu zaten kullanılıyor."));
    var r = l.find(function (x) { return x.id === id; });
    if (r) { Object.assign(r, a, { guncelleme: Date.now() }); yerelYaz(); }
    return Promise.resolve(r ? Object.assign({}, r) : null);
  },
  sil: function (kol, id) {
    if (veriVar()) return vayra.veri.sil(kol, id);
    var l = yerelAl()[kol], i = l.findIndex(function (x) { return x.id === id; });
    if (i >= 0) { l.splice(i, 1); yerelYaz(); }
    return Promise.resolve(true);
  }
};

/* ── Yardımcılar ── */
function urun(id) { return S.urunler.find(function (u) { return u.id === id; }) || null; }
function say(n, b) { return Number(n || 0).toLocaleString("tr-TR", { maximumFractionDigits: b == null ? 2 : b }); }
function para(n) { return tl(Math.round(Number(n || 0) * 100) / 100); }
function durum(u) { var s = Number(u.stok || 0); return s <= 0 ? "tukendi" : s <= Number(u.kritik || 0) ? "kritik" : "yeterli"; }
var DURUM_AD = { tukendi: "Tükendi", kritik: "Kritik", yeterli: "Yeterli" };
function durumHTML(u) { var d = durum(u); return '<span class="durum" data-d="' + d + '">' + DURUM_AD[d] + "</span>"; }
function cubukHTML(u) {
  var k = Math.max(1, Number(u.kritik || 0)), ust = k * 3, s = Math.max(0, Number(u.stok || 0));
  return '<div class="cubuk" data-d="' + durum(u) + '" aria-hidden="true"><i style="width:' + Math.min(100, s / ust * 100) + '%"></i><em style="left:' + (100 / 3) + '%"></em></div>';
}
function resim(u, sinif) {
  if (u && u.gorsel) return '<img class="res ' + (sinif || "") + '" src="' + kacir(u.gorsel) + '" alt="" loading="lazy" />';
  var h = String((u && u.ad) || "?").split(" ").map(function (p) { return p.charAt(0); }).slice(0, 2).join("").toLocaleUpperCase("tr");
  return '<span class="res ' + (sinif || "") + '" aria-hidden="true">' + kacir(h) + "</span>";
}
function marj(u) { return u.satis > 0 && u.maliyet >= 0 ? Math.round((u.satis - u.maliyet) / u.satis * 100) : null; }
function goreli(iso) {
  var z = Date.parse(iso), f = (Date.now() - z) / 60000;
  if (!isFinite(f)) return "";
  if (f < 1) return "az önce";
  if (f < 60) return Math.floor(f) + " dakika önce";
  if (f < 1440) return Math.floor(f / 60) + " saat önce";
  return new Date(z).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) + ", " + new Date(z).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}
function gunAnahtar(iso) { return istanbul(new Date(iso)).tarih; }
function eslesir(u) {
  if (S.kategori && u.kategori !== S.kategori) return false;
  if (S.kritikYalniz && durum(u) === "yeterli") return false;
  if (!S.ara) return true;
  return [u.ad, u.sku, u.tedarikci, u.kategori].join(" ").toLocaleLowerCase("tr").indexOf(S.ara) >= 0;
}
function siraliUrunler() {
  var a = S.sirala.alan, y = S.sirala.yon;
  var deger = {
    ad: function (u) { return u.ad; }, kategori: function (u) { return u.kategori + " " + u.ad; },
    stok: function (u) { return (Number(u.stok) || 0) / Math.max(1, Number(u.kritik) || 1); },
    maliyet: function (u) { return Number(u.maliyet) || 0; }, satis: function (u) { return Number(u.satis) || 0; },
    marj: function (u) { var m = marj(u); return m === null ? -999 : m; }, deger: function (u) { return (Number(u.stok) || 0) * (Number(u.maliyet) || 0); },
    tedarikci: function (u) { return u.tedarikci || ""; }
  }[a];
  return S.urunler.filter(eslesir).sort(function (p, q) {
    var x = deger(p), z = deger(q);
    if (typeof x === "string") return x.localeCompare(z, "tr") * y;
    return (x - z) * y || p.ad.localeCompare(q.ad, "tr");
  });
}

/* ── Yükleme ── */
function yukle() {
  $("#icerik").innerHTML = '<div class="iskelet" aria-label="Yükleniyor"></div>';
  Promise.all([Depo.liste("urunler"), Depo.liste("hareketler"), pbYukle()]).then(function (r) {
    $("#pbSec").innerHTML = pbSecenekleri();
    S.urunler = r[0]; S.hareketler = r[1].sort(function (a, b) { return a.zaman < b.zaman ? 1 : -1; }); S.yuklendi = true; S.kilit = ""; ciz();
  }).catch(function (e) { S.kilit = (e && e.message) || "Veriler okunamadı."; ciz(); });
}

/* ── Çizim ── */
function ciz() {
  $$("[data-git]").forEach(function (b) { if (b.dataset.git === S.gorunum) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  var kritikSay = S.urunler.filter(function (u) { return durum(u) !== "yeterli"; }).length;
  var r = $("#kritikRozet"); r.textContent = kritikSay; r.hidden = !kritikSay;
  var ic = $("#icerik");
  if (S.kilit) { ic.innerHTML = '<div class="kilit"><div>' + IK.kilit + "<h2>Depo kayıtları ekibe özel</h2><p>Stok ve hareket kayıtlarını yalnız işletme ekibi görebilir. Erişim için yöneticine başvur.</p></div></div>"; return; }
  if (!S.yuklendi) return;
  ic.innerHTML = S.gorunum === "urunler" ? urunlerHTML() : hareketlerHTML();
  if (S.cekmece) cekmeceCiz();
}

function ozetHTML() {
  var deger = 0, satisDeger = 0, kritik = 0, tukendi = 0;
  S.urunler.forEach(function (u) { var s = Math.max(0, Number(u.stok) || 0); deger += s * (Number(u.maliyet) || 0); if (u.satis > 0) satisDeger += s * u.satis; var d = durum(u); if (d === "kritik") kritik++; if (d === "tukendi") tukendi++; });
  var bugun = istanbul().tarih, gunler = [], maks = 1, girTop = 0, cikTop = 0;
  for (var i = 6; i >= 0; i--) gunler.push({ t: gunEkle(bugun, -i), gir: 0, cik: 0 });
  S.hareketler.forEach(function (h) {
    var g = gunler.find(function (x) { return x.t === gunAnahtar(h.zaman); }); if (!g) return;
    var u = urun(h.urunId), tutar = Math.abs(Number(h.degisim) || 0) * (u ? Number(u.maliyet) || 0 : 0);
    if (h.degisim > 0) { g.gir += tutar; girTop += tutar; } else if (h.degisim < 0) { g.cik += tutar; cikTop += tutar; }
  });
  gunler.forEach(function (g) { maks = Math.max(maks, g.gir, g.cik); });
  var grafik = '<div class="grafik7" role="img" aria-label="Son 7 günün giriş ve çıkış değerleri">' + gunler.map(function (g) {
    return '<div class="gun"><div class="ust-y"><i class="gir" style="height:' + Math.max(g.gir ? 3 : 0, g.gir / maks * 26) + 'px" title="Giriş ' + para(g.gir) + '"></i></div><div class="alt-y"><i class="cik" style="height:' + Math.max(g.cik ? 3 : 0, g.cik / maks * 26) + 'px" title="Çıkış ' + para(g.cik) + '"></i></div><em>' + tarihYaz(g.t, { weekday: "short", day: undefined, month: undefined }) + "</em></div>";
  }).join("") + "</div>";
  return '<section class="ozet" aria-label="Özet">' +
    '<div class="genis"><span class="et"><i></i>Stok değeri, maliyetle</span><b>' + para(deger) + '</b><small>Satış fiyatıyla satılabilir stok ' + para(satisDeger) + "</small></div>" +
    '<div><span class="et" style="--renk:var(--yesil)"><i></i>Ürün çeşidi</span><b>' + S.urunler.length + "</b><small>" + KATEGORILER.filter(function (k) { return S.urunler.some(function (u) { return u.kategori === k; }); }).length + " kategori, " + new Set(S.urunler.map(function (u) { return u.tedarikci; }).filter(Boolean)).size + " tedarikçi</small></div>" +
    '<div class="' + (kritik + tukendi ? "uyari" : "") + '"><span class="et" style="--renk:var(--mercan)"><i></i>Uyarıdaki ürün</span><b>' + (kritik + tukendi) + "</b><small>" + kritik + " kritik, " + tukendi + " tükendi</small></div>" +
    '<div class="genis"><span class="et" style="--renk:var(--metin-3)"><i></i>Son 7 gün</span>' + grafik + '<div class="lejant"><span style="--renk:var(--yesil)">Giriş ' + para(girTop) + '</span><span style="--renk:var(--mercan)">Çıkış ' + para(cikTop) + "</span></div></div>" +
    "</section>";
}
function kritikHTML() {
  var l = S.urunler.filter(function (u) { return durum(u) !== "yeterli"; }).sort(function (a, b) { return (a.stok / Math.max(1, a.kritik)) - (b.stok / Math.max(1, b.kritik)); });
  if (!l.length) return "";
  return '<section class="kritik" aria-label="Kritik stok"><div class="kritik-bas">' + IK.uyari + "<h2>Sipariş zamanı</h2><span>" + l.length + " ürün kritik seviyede ya da tükendi</span></div><div class=\"kritik-liste\">" +
    l.map(function (u) {
      var oneri = Math.max(1, Math.ceil(u.kritik * 2 - u.stok));
      return '<div class="kritik-kart ' + (durum(u) === "tukendi" ? "tukendi" : "") + '">' + resim(u) + '<div class="metin"><b data-urun="' + kacir(u.id) + '">' + kacir(u.ad) + "</b><small><strong>" + (u.stok > 0 ? say(u.stok) + " " + kacir(u.birim) + " kaldı" : "Tükendi") + "</strong>, kritik seviye " + say(u.kritik) + '</small></div><button type="button" class="dugme kucuk" data-hareket="Giriş" data-urun-id="' + kacir(u.id) + '" data-miktar="' + oneri + '" aria-label="' + kacir(u.ad) + ' için ' + oneri + ' ' + kacir(u.birim) + ' giriş yap">' + IK.giris + "+" + oneri + "</button></div>";
    }).join("") + "</div></section>";
}
function urunlerHTML() {
  var l = siraliUrunler(), h = ozetHTML() + kritikHTML();
  var kat = '<button type="button" class="cip" data-kategori="" aria-pressed="' + !S.kategori + '">Tümü <small>' + S.urunler.length + "</small></button>" + KATEGORILER.map(function (k) { var n = S.urunler.filter(function (u) { return u.kategori === k; }).length; return n ? '<button type="button" class="cip" data-kategori="' + k + '" aria-pressed="' + (S.kategori === k) + '">' + k + " <small>" + n + "</small></button>" : ""; }).join("");
  var secenekler = [["ad", "Ada göre"], ["stok", "Stok durumu"], ["deger", "Stok değeri"], ["marj", "Kâr marjı"], ["kategori", "Kategori"]];
  h += '<div class="arac"><label class="ara"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="ara" type="search" placeholder="Ürün, stok kodu ya da tedarikçi" aria-label="Ürün ara" value="' + kacir(S.araHam || "") + '" autocomplete="off" /></label>' +
    '<select class="sirala-sec" id="siralaSec" aria-label="Sırala">' + secenekler.map(function (s) { return '<option value="' + s[0] + '"' + (S.sirala.alan === s[0] ? " selected" : "") + ">" + s[1] + "</option>"; }).join("") + "</select>" +
    '<div class="cipler" role="group" aria-label="Kategori">' + kat + '</div><label class="anahtar"><input type="checkbox" id="kritikYalniz"' + (S.kritikYalniz ? " checked" : "") + ' /><span class="ray" aria-hidden="true"></span>Yalnız uyarıdakiler</label></div>';
  if (!l.length) return h + '<div class="tablo-kap"><div class="bos"><b>' + (S.urunler.length ? "Süzgece uyan ürün yok" : "Depo boş") + "</b>" + (S.urunler.length ? "Aramayı ya da kategoriyi değiştir." : "Sağ üstten ilk ürünü ekle.") + "</div></div>";
  function th(alan, ad, sinif) {
    var s = S.sirala.alan === alan ? ' aria-sort="' + (S.sirala.yon > 0 ? "ascending" : "descending") + '"' : "";
    return '<th class="' + (sinif || "") + '"' + s + '><button type="button" data-sirala="' + alan + '">' + ad + IK.ok + "</button></th>";
  }
  var top = 0;
  h += '<div class="tablo-kap urun-tablo"><table><thead><tr>' + th("ad", "Ürün") + th("kategori", "Kategori", "gizle-orta") + th("stok", "Stok") + '<th class="duz">Durum</th>' + th("maliyet", "Maliyet", "sag") + th("satis", "Satış", "sag gizle-orta") + th("marj", "Marj", "sag gizle-orta") + th("deger", "Stok değeri", "sag") + th("tedarikci", "Tedarikçi", "gizle-orta") + '<th class="duz sag">Hareket</th></tr></thead><tbody>' +
    l.map(function (u) {
      var m = marj(u), d = (Number(u.stok) || 0) * (Number(u.maliyet) || 0); top += d;
      return '<tr class="tik" data-satir="' + kacir(u.id) + '"><td><div class="urun-hucre">' + resim(u) + "<div><b>" + kacir(u.ad) + "</b><small>" + kacir(u.sku) + '</small></div></div></td><td class="gizle-orta soluk">' + kacir(u.kategori || "") + '</td><td class="stok-hucre"><div class="ust-s"><b>' + say(u.stok) + "</b><span>" + kacir(u.birim) + ", kritik " + say(u.kritik) + "</span></div>" + cubukHTML(u) + "</td><td>" + durumHTML(u) + '</td><td class="sag sayi">' + para(u.maliyet) + '</td><td class="sag sayi gizle-orta">' + (u.satis > 0 ? para(u.satis) : '<span class="soluk">Satılmıyor</span>') + '</td><td class="sag gizle-orta"><span class="marj ' + (m !== null && m >= 50 ? "iyi" : "") + '">' + (m === null ? '<span class="soluk">Yok</span>' : "yüzde " + m) + '</span></td><td class="sag sayi"><b>' + para(d) + '</b></td><td class="gizle-orta soluk">' + kacir(u.tedarikci || "") + '</td><td class="sag"><span class="hizli"><button type="button" class="cik" data-hareket="Çıkış" data-urun-id="' + kacir(u.id) + '" aria-label="' + kacir(u.ad) + ' çıkışı">' + IK.eksi + '</button><button type="button" class="gir" data-hareket="Giriş" data-urun-id="' + kacir(u.id) + '" aria-label="' + kacir(u.ad) + ' girişi">' + IK.arti + "</button></span></td></tr>";
    }).join("") + '</tbody><tfoot><tr><td>' + l.length + ' ürün</td><td class="gizle-orta"></td><td></td><td></td><td></td><td class="gizle-orta"></td><td class="gizle-orta"></td><td class="sag sayi">' + para(top) + '</td><td class="gizle-orta"></td><td></td></tr></tfoot></table></div>';
  h += '<div class="kartlar">' + l.map(function (u) {
    return '<div class="ukart" data-kart="' + kacir(u.id) + '">' + resim(u, "b56") + '<div class="ad" data-urun="' + kacir(u.id) + '" role="button" tabindex="0"><b>' + kacir(u.ad) + "</b><small>" + kacir(u.sku) + " · " + para((Number(u.stok) || 0) * (Number(u.maliyet) || 0)) + '</small></div><div class="stk"><b>' + say(u.stok) + "</b><span>" + kacir(u.birim) + '</span></div><div class="alt-k">' + durumHTML(u) + cubukHTML(u) + '<span class="hizli"><button type="button" class="cik" data-hareket="Çıkış" data-urun-id="' + kacir(u.id) + '" aria-label="' + kacir(u.ad) + ' çıkışı">' + IK.eksi + '</button><button type="button" class="gir" data-hareket="Giriş" data-urun-id="' + kacir(u.id) + '" aria-label="' + kacir(u.ad) + ' girişi">' + IK.arti + "</button></span></div></div>";
  }).join("") + "</div>";
  return h;
}
function hareketlerHTML() {
  var l = S.hareketler.filter(function (h) {
    if (S.hTur && h.tur !== S.hTur) return false;
    if (S.kategori) { var u = urun(h.urunId); if (!u || u.kategori !== S.kategori) return false; }
    return !S.ara || [h.urunAd, h.neden, h.not, h.kullanici].join(" ").toLocaleLowerCase("tr").indexOf(S.ara) >= 0;
  });
  var gir = 0, cik = 0;
  l.forEach(function (h) { var u = urun(h.urunId), t = Math.abs(h.degisim || 0) * (u ? u.maliyet : 0); if (h.degisim > 0) gir += t; else cik += t; });
  var turlar = ["", "Giriş", "Çıkış", "Sayım"].map(function (t) { var n = S.hareketler.filter(function (h) { return !t || h.tur === t; }).length; return '<button type="button" class="cip" data-htur="' + t + '" aria-pressed="' + (S.hTur === t) + '">' + (t || "Tümü") + " <small>" + n + "</small></button>"; }).join("");
  var h = '<div class="sayfa-bas"><div><h1>Stok hareketleri</h1><p>Giriş ' + para(gir) + ", çıkış " + para(cik) + ' değerinde, maliyet fiyatıyla</p></div><span class="bosluk"></span><button type="button" class="dugme" data-csv="hareketler"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5v10.5M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/></svg>CSV indir</button></div>' +
    '<div class="arac"><label class="ara"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="ara" type="search" placeholder="Ürün, neden ya da kişi" aria-label="Hareket ara" value="' + kacir(S.araHam || "") + '" autocomplete="off" /></label><div class="cipler" role="group" aria-label="Hareket türü">' + turlar + "</div></div>";
  if (!l.length) return h + '<div class="tablo-kap"><div class="bos"><b>Hareket yok</b>Süzgeci değiştir ya da yeni bir hareket gir.</div></div>';
  h += '<div class="tablo-kap hareket-tablo"><table><thead><tr><th class="duz">Zaman</th><th class="duz">Ürün</th><th class="duz">Tür</th><th class="duz sag">Değişim</th><th class="duz sag">Sonra</th><th class="duz">Neden</th><th class="duz">Not</th><th class="duz">Kişi</th></tr></thead><tbody>' +
    l.slice(0, 300).map(function (x) {
      var u = urun(x.urunId);
      return '<tr class="tik" data-satir="' + kacir(x.urunId) + '"><td class="soluk" style="white-space:nowrap">' + goreli(x.zaman) + '</td><td><div class="urun-hucre">' + resim(u || { ad: x.urunAd }, "b36") + "<div><b>" + kacir(x.urunAd || (u && u.ad) || "") + "</b><small>" + kacir(u ? u.sku : "Silinmiş ürün") + "</small></div></div></td><td>" + turHTML(x) + '</td><td class="sag">' + degisimHTML(x, u) + '</td><td class="sag sayi">' + say(x.sonra) + " " + kacir(u ? u.birim : "") + "</td><td>" + kacir(x.neden || "") + '</td><td class="soluk">' + kacir(x.not || "") + '</td><td class="soluk" style="white-space:nowrap">' + kacir(x.kullanici || "") + "</td></tr>";
    }).join("") + "</tbody></table></div>";
  var son = "";
  h += '<div class="tablo-kap hareket-kartlar">' + l.slice(0, 300).map(function (x) {
    var u = urun(x.urunId), g = gunAnahtar(x.zaman), bas = "";
    if (g !== son) { son = g; bas = '<div class="gun-baslik">' + kacir(g === istanbul().tarih ? "Bugün" : tarihYaz(g, { weekday: "long" })) + "</div>"; }
    return bas + '<div class="hkart" data-satir="' + kacir(x.urunId) + '">' + resim(u || { ad: x.urunAd }, "b36") + '<div class="metin"><b>' + kacir(x.urunAd || "") + "</b><small>" + kacir(x.tur + ", " + (x.neden || "") + (x.not ? ", " + x.not : "")) + '</small></div><div class="sag">' + degisimHTML(x, u) + "<small>" + new Date(x.zaman).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) + "</small></div></div>";
  }).join("") + "</div>";
  return h;
}
function turHTML(x) { return '<span class="hareket-tur" data-t="' + kacir(x.tur) + '"><i>' + (IK[x.tur] || "") + "</i>" + kacir(x.tur) + "</span>"; }
function degisimHTML(x, u) { var d = Number(x.degisim) || 0; return '<span class="degisim ' + (d > 0 ? "arti" : d < 0 ? "eksi" : "") + '">' + (d > 0 ? "+" : d < 0 ? "eksi " : "") + say(Math.abs(d)) + " " + kacir(u ? u.birim : "") + "</span>"; }

/* ── Ürün çekmecesi ── */
function cekmeceAc(id) { S.cekmece = id; cekmeceCiz(); $("#perde").classList.add("acik"); var c = $("#cekmece"); c.classList.add("acik"); c.setAttribute("aria-hidden", "false"); setTimeout(function () { var k = $("#cekKapat"); if (k) k.focus(); }, 60); }
function cekmeceKapat() { S.cekmece = null; $("#perde").classList.remove("acik"); var c = $("#cekmece"); c.classList.remove("acik"); c.setAttribute("aria-hidden", "true"); }
function grafikSVG(u, hl) {
  var noktalar = hl.slice().reverse().map(function (h) { return { z: Date.parse(h.zaman), s: Number(h.sonra) || 0 }; });
  var simdi = Date.now(), bas = simdi - 14 * 86400000;
  noktalar = noktalar.filter(function (n) { return n.z >= bas; });
  var ilk = hl.filter(function (h) { return Date.parse(h.zaman) < bas; })[0];
  var baslangic = ilk ? Number(ilk.sonra) || 0 : (noktalar.length ? (function () { var x = hl.slice().reverse().filter(function (h) { return Date.parse(h.zaman) >= bas; })[0]; return (Number(x.sonra) || 0) - (Number(x.degisim) || 0); })() : Number(u.stok) || 0);
  var seri = [{ z: bas, s: Math.max(0, baslangic) }].concat(noktalar).concat([{ z: simdi, s: Number(u.stok) || 0 }]);
  var W = 500, Hh = 120, maks = Math.max(Number(u.kritik) * 2, 1);
  seri.forEach(function (n) { maks = Math.max(maks, n.s); }); maks *= 1.12;
  function X(z) { return (z - bas) / (simdi - bas) * W; } function Y(s) { return Hh - s / maks * Hh; }
  var d = "M" + X(seri[0].z).toFixed(1) + " " + Y(seri[0].s).toFixed(1);
  for (var i = 1; i < seri.length; i++) d += " H" + X(seri[i].z).toFixed(1) + " V" + Y(seri[i].s).toFixed(1);
  var alan = d + " V" + Hh + " H0 Z", ky = Y(Number(u.kritik) || 0).toFixed(1);
  var renk = { yeterli: "#5fd394", kritik: "#ffb21e", tukendi: "#ff6e57" }[durum(u)];
  return '<svg viewBox="0 0 ' + W + " " + Hh + '" preserveAspectRatio="none" role="img" aria-label="Son 14 günde stok değişimi"><defs><linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + renk + '" stop-opacity=".28"/><stop offset="1" stop-color="' + renk + '" stop-opacity="0"/></linearGradient></defs><path d="' + alan + '" fill="url(#gd)"/><line x1="0" x2="' + W + '" y1="' + ky + '" y2="' + ky + '" stroke="#ffb21e" stroke-width="1.2" stroke-dasharray="5 5" vector-effect="non-scaling-stroke" opacity=".7"/><path d="' + d + '" fill="none" stroke="' + renk + '" stroke-width="2.2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>';
}
function cekmeceCiz() {
  var u = urun(S.cekmece), c = $("#cekmece");
  if (!u) { cekmeceKapat(); return; }
  var hl = S.hareketler.filter(function (h) { return h.urunId === u.id; });
  var m = marj(u), kay = $(".cek-govde", c) ? $(".cek-govde", c).scrollTop : 0;
  c.innerHTML = '<div class="cek-bas">' + durumHTML(u) + '<span class="bosluk"></span><button type="button" class="ikon-dugme" data-urun-duzenle="' + kacir(u.id) + '" aria-label="Ürünü düzenle">' + IK.duzenle + '</button><button type="button" class="ikon-dugme" data-urun-sil="' + kacir(u.id) + '" aria-label="Ürünü sil">' + IK.cop + '</button><button type="button" class="ikon-dugme" id="cekKapat" aria-label="Kapat">' + IK.kapat + "</button></div>" +
    '<div class="cek-govde"><div class="cek-urun">' + resim(u, "b72") + '<div><h2 id="cekBaslik">' + kacir(u.ad) + "</h2><p>" + kacir(u.sku) + " · " + kacir(u.kategori || "") + "</p></div></div>" +
    '<div class="buyuk-stok"><b>' + say(u.stok) + "</b><span>" + kacir(u.birim) + " stokta, kritik seviye " + say(u.kritik) + "</span></div>" +
    '<div class="cek-eylem"><button type="button" class="dugme" data-hareket="Giriş" data-urun-id="' + kacir(u.id) + '" style="color:var(--yesil)">' + IK.giris + 'Giriş</button><button type="button" class="dugme" data-hareket="Çıkış" data-urun-id="' + kacir(u.id) + '" style="color:var(--mercan)">' + IK.cikis + 'Çıkış</button><button type="button" class="dugme" data-hareket="Sayım" data-urun-id="' + kacir(u.id) + '" style="color:#8fb3ff">' + IK.sayim + "Sayım</button></div>" +
    '<div class="grafik-kap"><h3>Son 14 gün <span>Kesikli çizgi kritik seviye</span></h3>' + grafikSVG(u, hl) + "</div>" +
    '<div class="bilgi"><div><span>Birim maliyet</span><b>' + para(u.maliyet) + "</b></div><div><span>Satış fiyatı</span><b>" + (u.satis > 0 ? para(u.satis) + (m !== null ? ", marj yüzde " + m : "") : "Satılmıyor") + "</b></div><div><span>Stok değeri</span><b>" + para((Number(u.stok) || 0) * (Number(u.maliyet) || 0)) + "</b></div><div><span>Tedarikçi</span><b>" + kacir(u.tedarikci || "Belirtilmedi") + "</b></div></div>" +
    '<h3 class="bolum-bas">Hareket geçmişi <small>' + hl.length + "</small></h3>" +
    (hl.length ? '<div class="mini-hareket">' + hl.slice(0, 40).map(function (x) { return '<div class="hkart">' + '<span class="hareket-tur" data-t="' + kacir(x.tur) + '"><i>' + (IK[x.tur] || "") + '</i></span><div class="metin"><b>' + kacir(x.tur + ", " + (x.neden || "")) + "</b><small>" + kacir(goreli(x.zaman) + ", " + (x.kullanici || "") + (x.not ? ", " + x.not : "")) + '</small></div><div class="sag">' + degisimHTML(x, u) + "<small>Sonra " + say(x.sonra) + "</small></div></div>"; }).join("") + "</div>" : '<p class="soluk" style="margin:0">Bu ürün için henüz hareket yok.</p>') +
    "</div>";
  $(".cek-govde", c).scrollTop = kay;
}

/* ── Pencere ── */
var oncekiOdak = null;
function pencereAc(html, kur) {
  var k = $("#pencere"); oncekiOdak = document.activeElement;
  $(".pencere", k).innerHTML = html; k.hidden = false;
  requestAnimationFrame(function () { k.classList.add("acik"); });
  if (kur) kur($(".pencere", k));
}
function pencereKapat() { var k = $("#pencere"); k.classList.remove("acik"); setTimeout(function () { if (!k.classList.contains("acik")) k.hidden = true; }, 220); if (oncekiOdak && oncekiOdak.focus) try { oncekiOdak.focus(); } catch (e) { /* yok */ } }
function secenekler(l, s) { return l.map(function (x) { var v = Array.isArray(x) ? x[0] : x, y = Array.isArray(x) ? x[1] : x; return '<option value="' + kacir(v) + '"' + (String(v) === String(s) ? " selected" : "") + ">" + kacir(y) + "</option>"; }).join(""); }

function hareketFormu(tur, urunId, miktar) {
  tur = tur || "Giriş";
  var l = S.urunler.slice().sort(function (a, b) { return a.ad.localeCompare(b.ad, "tr"); });
  if (!l.length) { bildir("Önce bir ürün ekle.", "hata"); return; }
  urunId = urunId || (S.cekmece || l[0].id);
  pencereAc('<h2>Stok hareketi</h2><p>Giriş stoku artırır, çıkış azaltır, sayım stoku sayılan miktara eşitler.</p><form id="hForm" class="form" novalidate>' +
    '<div class="tur-sec tam" role="group" aria-label="Hareket türü">' + ["Giriş", "Çıkış", "Sayım"].map(function (t) { return '<button type="button" data-t="' + t + '" aria-pressed="' + (t === tur) + '">' + IK[t] + t + "</button>"; }).join("") + "</div>" +
    '<label class="alan tam"><span>Ürün</span><select name="urunId" id="hUrun">' + secenekler(l.map(function (u) { return [u.id, u.ad + " (" + u.sku + ")"]; }), urunId) + "</select></label>" +
    '<label class="alan"><span id="hMiktarEt">Miktar</span><span class="miktar-kap"><input name="miktar" id="hMiktar" type="number" inputmode="decimal" min="0" step="any" required value="' + (miktar || "") + '" /><em id="hBirim"></em></span></label>' +
    '<label class="alan"><span>Neden</span><select name="neden" id="hNeden"></select></label>' +
    '<label class="alan tam"><span>Not</span><input name="not" maxlength="120" placeholder="Fatura numarası, açıklama" /></label>' +
    '<div class="onizleme tam" id="hOnizleme" aria-live="polite"></div><p class="hata-yazi tam" id="hHata" hidden></p></form>' +
    '<div class="eylem"><button type="button" class="dugme" data-pencere-kapat>Vazgeç</button><button type="submit" form="hForm" class="dugme ana" id="hKaydet">Kaydet</button></div>', function (p) {
    function tazele() {
      var u = urun($("#hUrun").value), m = Number(String($("#hMiktar").value).replace(",", ".")), on = $("#hOnizleme");
      $("#hBirim").textContent = u ? u.birim : "";
      $("#hMiktarEt").textContent = tur === "Sayım" ? "Sayılan miktar" : "Miktar";
      var yeni = !isFinite(m) || $("#hMiktar").value === "" ? null : tur === "Giriş" ? u.stok + m : tur === "Çıkış" ? u.stok - m : m;
      var hatali = yeni !== null && (yeni < 0 || m < 0);
      on.classList.toggle("hatali", hatali);
      on.innerHTML = yeni === null ? "Şu an <b>" + say(u.stok) + "</b> " + kacir(u.birim) + " stokta" : hatali ? "Stokta yalnız " + say(u.stok) + " " + kacir(u.birim) + " var" : "<span>Stok</span><b>" + say(u.stok) + '</b><span class="ok">iken</span><b>' + say(yeni) + "</b><span>" + kacir(u.birim) + " olacak</span>";
      $("#hKaydet").disabled = hatali;
    }
    function nedenler() { $("#hNeden").innerHTML = secenekler(NEDENLER[tur]); }
    $$(".tur-sec button", p).forEach(function (b) { b.addEventListener("click", function () { tur = b.dataset.t; $$(".tur-sec button", p).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); nedenler(); tazele(); }); });
    $("#hUrun").addEventListener("change", tazele); $("#hMiktar").addEventListener("input", tazele);
    nedenler(); tazele();
    setTimeout(function () { var i = $("#hMiktar"); i.focus(); i.select(); }, 80);
    $("#hForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var u = urun($("#hUrun").value), m = Number(String($("#hMiktar").value).replace(",", ".")), hh = $("#hHata");
      if (!u) return;
      if (!isFinite(m) || $("#hMiktar").value === "" || m < 0 || (tur !== "Sayım" && m === 0)) { hh.textContent = "Geçerli bir miktar yaz."; hh.hidden = false; $("#hMiktar").focus(); return; }
      var degisim = tur === "Giriş" ? m : tur === "Çıkış" ? -m : m - u.stok, sonra = Math.round((u.stok + degisim) * 1000) / 1000;
      if (sonra < 0) { hh.textContent = "Çıkış stoktan fazla olamaz."; hh.hidden = false; return; }
      $("#hKaydet").disabled = true;
      hareketKaydet(u, { tur: tur, miktar: m, degisim: degisim, sonra: sonra, neden: $("#hNeden").value, not: p.querySelector("[name=not]").value.trim() }).then(function () { pencereKapat(); }).catch(function (x) { $("#hKaydet").disabled = false; hh.textContent = x.message || "Kaydedilemedi."; hh.hidden = false; });
    });
  });
}
function hareketKaydet(u, h) {
  var kayit = Object.assign({ urunId: u.id, urunAd: u.ad, kullanici: KULLANICI, zaman: new Date().toISOString() }, h);
  var eskiStok = u.stok, eskiDurum = durum(u);
  return Depo.ekle("hareketler", kayit).then(function (r) {
    S.hareketler.unshift(Object.assign(kayit, r));
    u.stok = h.sonra;
    return Depo.guncelle("urunler", u.id, { stok: h.sonra }).catch(function (e) { u.stok = eskiStok; throw e; });
  }).then(function () {
    ciz();
    var satir = $('[data-satir="' + u.id + '"]') || $('[data-kart="' + u.id + '"]'); if (satir) satir.classList.add("yeni");
    var d = durum(u);
    bildir(d !== "yeterli" && eskiDurum === "yeterli" ? u.ad + " kritik seviyeye indi." : u.ad + ": " + say(eskiStok) + " " + u.birim + " iken " + say(u.stok) + " " + u.birim + " oldu.", d !== "yeterli" && eskiDurum === "yeterli" ? "hata" : "bilgi");
    olay("stok_hareketi", { tur: h.tur });
  });
}
function urunFormu(u) {
  u = u || {};
  var yeni = !u.id, secili = u.gorsel || "";
  pencereAc("<h2>" + (yeni ? "Ürün ekle" : "Ürünü düzenle") + "</h2><p>" + (yeni ? "Açılış stoku girersen bir giriş hareketi olarak kaydedilir." : "Stok miktarı hareketlerle değişir; burada yalnız ürün bilgileri düzenlenir.") + '</p><form id="uForm" class="form" novalidate>' +
    '<label class="alan tam"><span>Ürün adı</span><input name="ad" required maxlength="70" value="' + kacir(u.ad || "") + '" /></label>' +
    '<label class="alan"><span>Stok kodu</span><input name="sku" required maxlength="24" value="' + kacir(u.sku || "") + '" placeholder="KHV-010" autocapitalize="characters" /></label>' +
    '<label class="alan"><span>Kategori</span><select name="kategori">' + secenekler(KATEGORILER, u.kategori || "Kahve") + "</select></label>" +
    '<label class="alan"><span>Birim</span><select name="birim">' + secenekler(BIRIMLER, u.birim || "adet") + "</select></label>" +
    '<label class="alan"><span>Kritik seviye</span><input name="kritik" type="number" min="0" step="any" inputmode="decimal" value="' + kacir(u.kritik != null ? u.kritik : 5) + '" /></label>' +
    '<label class="alan"><span>Birim maliyet (' + PB.kod + ')</span><input name="maliyet" type="number" min="0" step="any" inputmode="decimal" value="' + kacir(u.maliyet != null ? u.maliyet : "") + '" /></label>' +
    '<label class="alan"><span>Satış fiyatı (' + PB.kod + ')</span><input name="satis" type="number" min="0" step="any" inputmode="decimal" value="' + kacir(u.satis || "") + '" placeholder="Satılmıyorsa boş bırak" /></label>' +
    '<label class="alan ' + (yeni ? "" : "tam") + '"><span>Tedarikçi</span><input name="tedarikci" maxlength="60" value="' + kacir(u.tedarikci || "") + '" list="tedarikciler" /></label>' +
    (yeni ? '<label class="alan"><span>Açılış stoku</span><input name="stok" type="number" min="0" step="any" inputmode="decimal" value="0" /></label>' : "") +
    '<div class="alan tam"><span>Görsel</span><div class="resim-sec" id="resimSec"><button type="button" data-resim="" aria-pressed="' + !secili + '">Yok</button>' + RESIMLER.map(function (r) { return '<button type="button" data-resim="' + kacir(r) + '" aria-pressed="' + (r === secili) + '"><img src="' + kacir(r) + '" alt="" loading="lazy" /></button>'; }).join("") + "</div></div>" +
    '<datalist id="tedarikciler">' + Array.from(new Set(S.urunler.map(function (x) { return x.tedarikci; }).filter(Boolean))).map(function (t) { return '<option value="' + kacir(t) + '">'; }).join("") + "</datalist>" +
    '<p class="hata-yazi tam" id="uHata" hidden></p></form><div class="eylem"><button type="button" class="dugme" data-pencere-kapat>Vazgeç</button><button type="submit" form="uForm" class="dugme ana" id="uKaydet">' + (yeni ? "Ürünü ekle" : "Kaydet") + "</button></div>", function (p) {
    setTimeout(function () { p.querySelector("[name=ad]").focus(); }, 80);
    $$("[data-resim]", p).forEach(function (b) { b.addEventListener("click", function () { secili = b.dataset.resim; $$("[data-resim]", p).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); }); });
    $("#uForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = Object.fromEntries(new FormData(e.target).entries()), hh = $("#uHata");
      var v = { ad: String(f.ad).trim(), sku: String(f.sku).trim().toLocaleUpperCase("tr"), kategori: f.kategori, birim: f.birim, kritik: Number(f.kritik || 0), maliyet: Number(f.maliyet || 0), satis: Number(f.satis || 0), tedarikci: String(f.tedarikci).trim(), gorsel: secili };
      if (!v.ad || !v.sku) { hh.textContent = "Ürün adı ve stok kodu gerekli."; hh.hidden = false; return; }
      if (S.urunler.some(function (x) { return x.sku === v.sku && x.id !== u.id; })) { hh.textContent = "Bu stok kodu başka bir üründe kullanılıyor."; hh.hidden = false; return; }
      if ([v.kritik, v.maliyet, v.satis].some(function (n) { return !isFinite(n) || n < 0; })) { hh.textContent = "Sayılar sıfır ya da daha büyük olmalı."; hh.hidden = false; return; }
      $("#uKaydet").disabled = true;
      if (!yeni) {
        Depo.guncelle("urunler", u.id, v).then(function () { Object.assign(u, v); pencereKapat(); ciz(); bildir("Ürün güncellendi."); }).catch(function (x) { $("#uKaydet").disabled = false; hh.textContent = x.message; hh.hidden = false; });
        return;
      }
      var acilis = Math.max(0, Number(f.stok || 0)) || 0;
      v.stok = 0;
      Depo.ekle("urunler", v).then(function (r) {
        S.urunler.push(r); pencereKapat();
        if (acilis > 0) return hareketKaydet(r, { tur: "Giriş", miktar: acilis, degisim: acilis, sonra: acilis, neden: "Satın alma", not: "Açılış stoku" });
        ciz(); bildir("Ürün eklendi.");
      }).catch(function (x) { $("#uKaydet").disabled = false; hh.textContent = x.message; hh.hidden = false; });
    });
  });
}
function urunSil(u) {
  var hl = S.hareketler.filter(function (h) { return h.urunId === u.id; });
  pencereAc("<h2>Ürün silinsin mi?</h2><p>" + kacir(u.ad) + " ve " + hl.length + ' hareket kaydı kalıcı olarak silinecek.</p><div class="eylem"><button type="button" class="dugme" data-pencere-kapat>Vazgeç</button><button type="button" class="dugme tehlike" id="silOnay">Sil</button></div>', function (p) {
    $("#silOnay", p).focus();
    $("#silOnay", p).addEventListener("click", function () {
      pencereKapat(); cekmeceKapat();
      S.urunler = S.urunler.filter(function (x) { return x !== u; });
      S.hareketler = S.hareketler.filter(function (h) { return h.urunId !== u.id; });
      ciz();
      Promise.all(hl.map(function (h) { return Depo.sil("hareketler", h.id).catch(function () {}); })).then(function () { return Depo.sil("urunler", u.id); }).then(function () { bildir("Ürün silindi."); }).catch(function (e) { bildir(e.message, "hata"); yukle(); });
    });
  });
}

/* ── CSV ── */
function csvAlan(v) { v = String(v == null ? "" : v); return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
function sayiCsv(n) { return String(Math.round(Number(n || 0) * 100) / 100).replace(".", ","); }
function csvIndir(tur) {
  var satirlar, ad;
  if (tur === "hareketler") {
    satirlar = [["Zaman", "Ürün", "Stok kodu", "Tür", "Değişim", "Sonraki stok", "Birim", "Neden", "Not", "Kişi"]].concat(S.hareketler.map(function (h) { var u = urun(h.urunId) || {}; return [new Date(h.zaman).toLocaleString("tr-TR"), h.urunAd, u.sku || "", h.tur, sayiCsv(h.degisim), sayiCsv(h.sonra), u.birim || "", h.neden || "", h.not || "", h.kullanici || ""]; }));
    ad = "stok-hareketleri-" + istanbul().tarih + ".csv";
  } else {
    satirlar = [["Stok kodu", "Ürün", "Kategori", "Birim", "Stok", "Kritik seviye", "Durum", "Birim maliyet (" + PB.kod + ")", "Satış fiyatı (" + PB.kod + ")", "Stok değeri (" + PB.kod + ")", "Tedarikçi"]].concat(siraliUrunler().map(function (u) { return [u.sku, u.ad, u.kategori, u.birim, sayiCsv(u.stok), sayiCsv(u.kritik), DURUM_AD[durum(u)], sayiCsv(u.maliyet), sayiCsv(u.satis), sayiCsv(u.stok * u.maliyet), u.tedarikci || ""]; }));
    ad = "stok-listesi-" + istanbul().tarih + ".csv";
  }
  var csv = String.fromCharCode(0xFEFF) + satirlar.map(function (r) { return r.map(csvAlan).join(";"); }).join("\r\n");
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = ad;
  document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  bildir((satirlar.length - 1) + " satır CSV olarak indirildi.");
}

/* ── Olaylar ── */
document.addEventListener("click", function (e) {
  var t = e.target;
  var g = t.closest("[data-git]"); if (g) { S.gorunum = g.dataset.git; S.ara = ""; S.araHam = ""; ciz(); window.scrollTo(0, 0); return; }
  var hr = t.closest("[data-hareket]"); if (hr) { e.stopPropagation(); hareketFormu(hr.dataset.hareket, hr.dataset.urunId, hr.dataset.miktar); return; }
  if (t.closest("#urunEkle")) { urunFormu(); return; }
  var cv = t.closest("[data-csv]"); if (cv) { csvIndir(cv.dataset.csv); return; }
  var kt = t.closest("[data-kategori]"); if (kt) { S.kategori = kt.dataset.kategori; ciz(); return; }
  var ht = t.closest("[data-htur]"); if (ht) { S.hTur = ht.dataset.htur; ciz(); return; }
  var so = t.closest("[data-sirala]"); if (so) { var a = so.dataset.sirala; S.sirala = { alan: a, yon: S.sirala.alan === a ? -S.sirala.yon : (a === "ad" || a === "kategori" || a === "tedarikci" || a === "stok" ? 1 : -1) }; ciz(); var b = $('[data-sirala="' + a + '"]'); if (b) b.focus(); return; }
  if (t.closest("#cekKapat") || t.closest("#perde")) { cekmeceKapat(); return; }
  if (t.closest("[data-pencere-kapat]") || t.id === "pencere") { pencereKapat(); return; }
  var ud = t.closest("[data-urun-duzenle]"); if (ud) { urunFormu(urun(ud.dataset.urunDuzenle)); return; }
  var us = t.closest("[data-urun-sil]"); if (us) { urunSil(urun(us.dataset.urunSil)); return; }
  var ac = t.closest("[data-urun]") || t.closest("[data-satir]"); if (ac) { cekmeceAc(ac.dataset.urun || ac.dataset.satir); return; }
});
document.addEventListener("input", function (e) {
  if (e.target.id === "ara") { var pos = e.target.selectionStart; S.araHam = e.target.value; S.ara = e.target.value.trim().toLocaleLowerCase("tr"); ciz(); var i = $("#ara"); i.focus(); try { i.setSelectionRange(pos, pos); } catch (x) { /* yok */ } }
});
document.addEventListener("change", function (e) {
  if (e.target.id === "kritikYalniz") { S.kritikYalniz = e.target.checked; ciz(); }
  if (e.target.id === "pbSec") { pbKaydet(e.target.value).then(function () { bildir("Tutarlar artık " + PB.kod + " ile gösteriliyor."); }).catch(function (x) { bildir(x.message, "hata"); }); ciz(); }
  if (e.target.id === "siralaSec") { var a = e.target.value; S.sirala = { alan: a, yon: a === "ad" || a === "kategori" || a === "stok" ? 1 : -1 }; ciz(); }
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") { if (!$("#pencere").hidden) pencereKapat(); else if (S.cekmece) cekmeceKapat(); }
  if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches(".ukart .ad")) { e.preventDefault(); cekmeceAc(e.target.dataset.urun); }
  if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && $("#ara")) { e.preventDefault(); $("#ara").focus(); }
});
$("#modYazi").textContent = veriVar() ? "Veritabanına bağlı" : "Bu cihazda saklanıyor";
yukle();
`;

const HTML = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Liman Depo · Stok Takibi</title>
  <meta name="description" content="Kafe ve bar için stok takibi: kritik stok uyarıları, giriş, çıkış ve sayım hareketleri, stok değeri ve CSV dışa aktarma." />
  <meta name="theme-color" content="#121110" />
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="manifest" href="manifest.webmanifest" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <header class="ust">
    <div class="ust-ic">
      <div class="marka"><svg viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" rx="10" fill="#ffb21e"/><path d="M8 15.5 18 9l10 6.5V27H8z" fill="none" stroke="#1d1404" stroke-width="2.4" stroke-linejoin="round"/><path d="M12.5 27v-7h11v7M12.5 23.5h11" fill="none" stroke="#1d1404" stroke-width="2.2"/></svg><div><b>Liman Depo</b><small>Liman Kafe ve Bar, Kadıköy</small></div></div>
      <nav class="sekmeler" aria-label="Bölümler">
        <button type="button" data-git="urunler" aria-current="page">Ürünler <span class="rozet" id="kritikRozet" hidden>0</span></button>
        <button type="button" data-git="hareketler">Hareketler</button>
      </nav>
      <span class="bosluk"></span>
      <span class="gizle-mobil" style="color:var(--metin-3);font-size:12.5px" id="modYazi"></span>
      <label class="pb-sec" title="Para birimi"><select id="pbSec" aria-label="Para birimi"><option>TRY</option></select></label>
      <button type="button" class="dugme" data-csv="urunler" aria-label="Stok listesini CSV indir"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4.5v10.5M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/></svg><span>CSV</span></button>
      <button type="button" class="dugme" id="urunEkle" aria-label="Ürün ekle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span>Ürün ekle</span></button>
      <button type="button" class="dugme ana gizle-mobil" data-hareket="Giriş"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg><span>Stok hareketi</span></button>
    </div>
  </header>
  <main id="icerik"></main>
  <div class="mobil-eylem"><button type="button" class="dugme ana" data-hareket="Giriş"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg>Stok hareketi</button></div>
  <div class="perde" id="perde"></div>
  <aside class="cekmece" id="cekmece" role="dialog" aria-modal="true" aria-labelledby="cekBaslik" aria-hidden="true"></aside>
  <div class="pencere-kap" id="pencere" role="dialog" aria-modal="true" hidden><div class="pencere"></div></div>
  <div id="bildirim" class="bildirim" role="status" aria-live="polite"></div>
  <script src="app.js"></script>
</body>
</html>
`;

export const STOK_TAKIP = {
  id: "stok-takip",
  ad: "Liman Depo · Stok Takibi",
  tur: "uygulama" as const,
  aciklama: "Kafe ve bar için stok takibi: kritik stok uyarıları, giriş, çıkış ve sayım hareketleri, ürün geçmişi grafiği, stok değeri, sıralanabilir tablo ve CSV dışa aktarma",
  kapak: "/gercek/build/sablon/stok-takip.webp",
  get tablolar() { return tablolarKur(); },
  dosyalar: {
    "index.html": HTML,
    "manifest.webmanifest": JSON.stringify({ name: "Liman Depo · Stok Takibi", short_name: "Liman Depo", lang: "tr", start_url: "./index.html", display: "standalone", background_color: "#121110", theme_color: "#121110", icons: [{ src: "ikon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }] }, null, 2),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#ffb21e"/><path d="M112 222 256 128l144 94v166H112z" fill="none" stroke="#1d1404" stroke-width="34" stroke-linejoin="round"/><path d="M176 388V288h160v100M176 338h160" fill="none" stroke="#1d1404" stroke-width="30"/></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
  },
};
