/* Şablon: Fatura Masası · Fatura Oluşturucu — küçük bir tasarım stüdyosu için fatura uygulaması. Müşteriler "musteriler",
 * faturalar (kalemler ve alıcı bilgisi json olarak) "faturalar", satıcı firma bilgileri "firma" tablosunda. Kalem kalem
 * miktar, birim fiyat, iskonto ve vergi oranı; para birimi (fatura başına), vergi adı (KDV, VAT, Sales tax...), oranlar
 * ve vergi no etiketi firma ayarlarından gelir, ülkeye özel kural sabitlenmez; oranlara göre vergi dökümü, yazıyla tutar, A4 kâğıt önizlemesi ve yazdırma,
 * taslak, gönderildi, gecikti ve ödendi durumları, tahsilat özeti ve son altı ay grafiği, müşteri bakiyeleri ve CSV.
 * Tablolar ekibe özeldir (kurallar kapalı). Galerideki canlı önizlemede gömülü kayıtlar ve bu cihazın belleğiyle çalışır. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";

const BIRIMLER = ["adet", "saat", "gün", "ay", "yıl", "proje", "sayfa", "paket"];
/** Para birimleri: kod, ad, yazıyla tutar için ana ve alt birim adı. Firma varsayılanı ve fatura başına seçilir. */
const PARA_BIRIMLERI = [
  { kod: "TRY", ad: "Türk lirası", ana: "Türk lirası", alt: "kuruş" },
  { kod: "USD", ad: "ABD doları", ana: "ABD doları", alt: "sent" },
  { kod: "EUR", ad: "Avro", ana: "avro", alt: "sent" },
  { kod: "GBP", ad: "İngiliz sterlini", ana: "İngiliz sterlini", alt: "peni" },
  { kod: "CHF", ad: "İsviçre frangı", ana: "İsviçre frangı", alt: "santim" },
  { kod: "CAD", ad: "Kanada doları", ana: "Kanada doları", alt: "sent" },
  { kod: "AUD", ad: "Avustralya doları", ana: "Avustralya doları", alt: "sent" },
  { kod: "AED", ad: "BAE dirhemi", ana: "BAE dirhemi", alt: "fils" },
  { kod: "SAR", ad: "Suudi riyali", ana: "Suudi riyali", alt: "halala" },
  { kod: "JPY", ad: "Japon yeni", ana: "Japon yeni", alt: "" },
  { kod: "INR", ad: "Hindistan rupisi", ana: "Hindistan rupisi", alt: "paisa" },
  { kod: "BRL", ad: "Brezilya reali", ana: "Brezilya reali", alt: "sentavo" },
  { kod: "MXN", ad: "Meksika pesosu", ana: "Meksika pesosu", alt: "sentavo" },
  { kod: "SEK", ad: "İsveç kronu", ana: "İsveç kronu", alt: "öre" },
  { kod: "PLN", ad: "Polonya zlotisi", ana: "Polonya zlotisi", alt: "grosz" },
  { kod: "AZN", ad: "Azerbaycan manatı", ana: "Azerbaycan manatı", alt: "kepik" },
];
/** Vergi adı önerileri (serbest metin de yazılabilir). */
const VERGI_ADLARI = ["KDV", "VAT", "Sales tax", "GST", "HST", "IVA", "MwSt", "TVA", "ƏDV"];

type Kalem = { aciklama: string; miktar: number; birim: string; fiyat: number; iskonto: number; kdv: number };
type Musteri = { id: string; ad: string; yetkili: string; vergiDairesi: string; vergiNo: string; adres: string; eposta: string; telefon: string };
const MUSTERILER: Musteri[] = [
  { id: "m1", ad: "Mavera Tekstil A.Ş.", yetkili: "Zeynep Aral", vergiDairesi: "Nilüfer", vergiNo: "6120458831", adres: "Organize Sanayi Bölgesi, Mavi Cad. No: 14, Nilüfer, Bursa", eposta: "muhasebe@maveratekstil.com.tr", telefon: "0224 411 20 11" },
  { id: "m2", ad: "Rota Lojistik Ltd. Şti.", yetkili: "Kerem Yalçın", vergiDairesi: "Gebze", vergiNo: "7340192264", adres: "Güzeller OSB, 1. Cad. No: 8, Gebze, Kocaeli", eposta: "finans@rotalojistik.com", telefon: "0262 751 33 40" },
  { id: "m3", ad: "Sahil Otelcilik ve Turizm A.Ş.", yetkili: "Deniz Yılmaz", vergiDairesi: "Bodrum", vergiNo: "7518830042", adres: "Neyzen Tevfik Cad. No: 92, Bodrum, Muğla", eposta: "satinalma@sahilotel.com.tr", telefon: "0252 316 48 00" },
  { id: "m4", ad: "Nar Kozmetik", yetkili: "Elif Şahin", vergiDairesi: "Beşiktaş", vergiNo: "25841733902", adres: "Ihlamurdere Cad. No: 31/2, Beşiktaş, İstanbul", eposta: "elif@narkozmetik.com", telefon: "0532 640 18 27" },
  { id: "m5", ad: "Pera Yazılım A.Ş.", yetkili: "Can Özdemir", vergiDairesi: "Beyoğlu", vergiNo: "7290556318", adres: "Meşrutiyet Cad. No: 66, Kat 4, Beyoğlu, İstanbul", eposta: "odemeler@perayazilim.com", telefon: "0212 252 90 14" },
  { id: "m6", ad: "Lavanta Butik", yetkili: "İpek Arslan", vergiDairesi: "Karşıyaka", vergiNo: "31877204658", adres: "Kemalpaşa Cad. No: 47/A, Karşıyaka, İzmir", eposta: "ipek@lavantabutik.com", telefon: "0533 712 45 09" },
  { id: "m7", ad: "Nordlicht Studio GmbH", yetkili: "Lena Hoffmann", vergiDairesi: "", vergiNo: "DE314159265", adres: "Torstraße 112, 10119 Berlin, Almanya", eposta: "accounts@nordlicht.studio", telefon: "+49 30 2091 4400" },
];

type FaturaTohum = { id: string; sira: number; musteriId: string; gunOnce: number; vadeGun: number; durum: "Taslak" | "Gönderildi" | "Ödendi"; odemeGun?: number; kalemler: Kalem[]; not?: string; paraBirimi?: string };
const K = (aciklama: string, miktar: number, birim: string, fiyat: number, kdv = 20, iskonto = 0): Kalem => ({ aciklama, miktar, birim, fiyat, kdv, iskonto });
const FATURALAR: FaturaTohum[] = [
  { id: "f27", sira: 27, musteriId: "m5", gunOnce: 158, vadeGun: 30, durum: "Ödendi", odemeGun: 21, kalemler: [K("Aylık arayüz danışmanlığı", 36, "saat", 1750)] },
  { id: "f28", sira: 28, musteriId: "m4", gunOnce: 131, vadeGun: 30, durum: "Ödendi", odemeGun: 28, kalemler: [K("Marka kimliği yenileme", 1, "proje", 54000), K("Kartvizit baskısı, 1000 adet", 2, "paket", 2400)] },
  { id: "f29", sira: 29, musteriId: "m2", gunOnce: 104, vadeGun: 30, durum: "Ödendi", odemeGun: 30, kalemler: [K("Web sitesi arayüz tasarımı, 12 sayfa", 1, "proje", 84000, 20, 5)] },
  { id: "f30", sira: 30, musteriId: "m6", gunOnce: 86, vadeGun: 15, durum: "Ödendi", odemeGun: 12, kalemler: [K("Instagram içerik paketi", 1, "ay", 22000), K("Ürün fotoğrafı", 24, "adet", 650)] },
  { id: "f31", sira: 31, musteriId: "m1", gunOnce: 62, vadeGun: 30, durum: "Ödendi", odemeGun: 25, kalemler: [K("Marka kimliği tasarımı", 1, "proje", 68000), K("Kurumsal kırtasiye seti tasarımı", 1, "paket", 18500)] },
  { id: "f32", sira: 32, musteriId: "m2", gunOnce: 48, vadeGun: 30, durum: "Ödendi", odemeGun: 29, kalemler: [K("Filo takip paneli arayüz tasarımı", 1, "proje", 96000, 20, 5)], not: "Sözleşmedeki ikinci hak ediş." },
  { id: "f33", sira: 33, musteriId: "m3", gunOnce: 40, vadeGun: 15, durum: "Gönderildi", kalemler: [K("Rezervasyon sitesi tasarımı", 1, "proje", 72000), K("Otel ve oda fotoğraf çekimi", 2, "gün", 14500)] },
  { id: "f34", sira: 34, musteriId: "m4", gunOnce: 33, vadeGun: 30, durum: "Ödendi", odemeGun: 18, kalemler: [K("Ambalaj tasarımı", 4, "adet", 9500), K("Tasarım eğitimi semineri", 1, "gün", 22000, 10)] },
  { id: "f35", sira: 35, musteriId: "m5", gunOnce: 21, vadeGun: 30, durum: "Gönderildi", kalemler: [K("Aylık arayüz danışmanlığı", 40, "saat", 1850)] },
  { id: "f36", sira: 36, musteriId: "m6", gunOnce: 15, vadeGun: 7, durum: "Gönderildi", kalemler: [K("Instagram içerik paketi", 1, "ay", 24000), K("Ürün fotoğrafı", 30, "adet", 650)] },
  { id: "f37", sira: 37, musteriId: "m1", gunOnce: 9, vadeGun: 30, durum: "Gönderildi", kalemler: [K("Katalog tasarımı, 48 sayfa", 1, "proje", 54000), K("Katalog baskısı", 500, "adet", 118)] },
  { id: "f38", sira: 38, musteriId: "m7", gunOnce: 4, vadeGun: 30, durum: "Gönderildi", paraBirimi: "EUR", kalemler: [K("Brand identity design", 1, "proje", 6800, 0), K("Web interface design, 8 pages", 1, "proje", 4200, 0, 5)], not: "Yurt dışına verilen hizmet, vergiden istisna. Vergiyi alıcı beyan eder (reverse charge). Lütfen fatura numarasını açıklamaya yazın." },
  { id: "f39", sira: 39, musteriId: "m3", gunOnce: 0, vadeGun: 15, durum: "Taslak", kalemler: [K("Kış sezonu kampanya görselleri", 12, "adet", 2400), K("Sosyal medya yönetimi", 1, "ay", 26000)] },
];

const FIRMA = {
  id: "firma",
  unvan: "Kırkambar Tasarım Ltd. Şti.",
  adres: "Caferağa Mah. Moda Cad. No: 41/3, Kadıköy, İstanbul",
  vergiDairesi: "Kadıköy",
  vergiNo: "4810392257",
  telefon: "0216 330 41 41",
  eposta: "merhaba@kirkambar.studio",
  web: "kirkambar.studio",
  banka: "Ziraat Bankası, Moda Şubesi",
  iban: "TR330006100519786457841326",
  seri: "KRK",
  vade: 30,
  paraBirimi: "TRY",
  vergiAdi: "KDV",
  vergiOranlari: [0, 1, 10, 20],
  varsayilanOran: 20,
  vergiNoEtiketi: "VKN",
  not: "Ödemeyi fatura numarasını açıklamaya yazarak yapmanızı rica ederiz. Teşekkür ederiz.",
};

const SERI_YIL = (yil: number, sira: number) => "KRK" + yil + String(sira).padStart(9, "0");
const gunStr = (d: Date) => d.toISOString().slice(0, 10);
const gunKaydir = (t: string, n: number) => { const d = new Date(t + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return gunStr(d); };

function aliciOf(m: Musteri) { return { ad: m.ad, yetkili: m.yetkili, vergiDairesi: m.vergiDairesi, vergiNo: m.vergiNo, adres: m.adres, eposta: m.eposta }; }
function toplamOf(kalemler: Kalem[]) {
  let genel = 0;
  for (const k of kalemler) { const net = k.miktar * k.fiyat * (1 - k.iskonto / 100); genel += net + net * k.kdv / 100; }
  return Math.round(genel * 100) / 100;
}

function tablolarKur(): Record<string, SablonTablo> {
  const bugun = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  const yil = Number(bugun.slice(0, 4));
  return {
    musteriler: {
      aciklama: "Fatura kesilen müşteriler: unvan, yetkili kişi, vergi dairesi ve numarası, adres. Ekibe özel.",
      kurallar: { okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" },
      sema: [
        { ad: "ad", tur: "metin", zorunlu: true, aciklama: "Unvan" },
        { ad: "yetkili", tur: "metin" },
        { ad: "vergiDairesi", tur: "metin" },
        { ad: "vergiNo", tur: "metin", aciklama: "Vergi kimlik numarası (ülkeye göre VKN, VAT ID, EIN ve benzeri)" },
        { ad: "adres", tur: "uzunMetin" },
        { ad: "eposta", tur: "metin" },
        { ad: "telefon", tur: "metin" },
      ],
      kayitlar: MUSTERILER,
    },
    faturalar: {
      aciklama: "Faturalar. kalemler: [{aciklama, miktar, birim, fiyat, iskonto (yüzde), kdv (vergi oranı, yüzde; vergi adı firmadan gelir: KDV, VAT, Sales tax...)}]; alici: kesildiği andaki müşteri bilgisi; paraBirimi: ISO 4217 kodu. durum Taslak, Gönderildi ya da Ödendi; vadesi geçen gönderilmiş fatura gecikmiş sayılır.",
      kurallar: { okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" },
      sema: [
        { ad: "no", tur: "metin", zorunlu: true, benzersiz: true, aciklama: "Fatura numarası, varsayılan biçim seri + yıl + 9 hane" },
        { ad: "paraBirimi", tur: "metin", varsayilan: "TRY", aciklama: "ISO 4217 para birimi kodu" },
        { ad: "musteriId", tur: "iliski", iliski: "musteriler", zorunlu: true, silinince: "kisitla" },
        { ad: "alici", tur: "json" },
        { ad: "tarih", tur: "metin", aciklama: "Düzenleme tarihi, YYYY-AA-GG" },
        { ad: "vade", tur: "metin", aciklama: "Son ödeme tarihi, YYYY-AA-GG" },
        { ad: "durum", tur: "secim", secenekler: ["Taslak", "Gönderildi", "Ödendi"], varsayilan: "Taslak" },
        { ad: "kalemler", tur: "json" },
        { ad: "not", tur: "uzunMetin" },
        { ad: "odemeTarihi", tur: "metin" },
        { ad: "toplam", tur: "sayi", aciklama: "Vergi dahil ödenecek tutar, faturanın para biriminde" },
      ],
      kayitlar: FATURALAR.map((f) => {
        const tarih = gunKaydir(bugun, -f.gunOnce);
        const m = MUSTERILER.find((x) => x.id === f.musteriId)!;
        return { id: f.id, no: SERI_YIL(yil, f.sira), paraBirimi: f.paraBirimi || FIRMA.paraBirimi, musteriId: f.musteriId, alici: aliciOf(m), tarih, vade: gunKaydir(tarih, f.vadeGun), durum: f.durum, kalemler: f.kalemler, not: f.not || FIRMA.not, odemeTarihi: f.odemeGun != null ? gunKaydir(tarih, f.odemeGun) : "", toplam: toplamOf(f.kalemler) };
      }),
    },
    firma: {
      aciklama: "Faturayı kesen firmanın bilgileri (tek kayıt, id firma): unvan, adres, vergi bilgileri, banka ve IBAN, fatura serisi, varsayılan vade ve not; varsayılan para birimi, vergi adı (KDV, VAT, Sales tax, GST...), kullanılabilir vergi oranları ve vergi numarası etiketi.",
      kurallar: { okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" },
      sema: [
        { ad: "unvan", tur: "metin", zorunlu: true },
        { ad: "adres", tur: "uzunMetin" },
        { ad: "vergiDairesi", tur: "metin" },
        { ad: "vergiNo", tur: "metin" },
        { ad: "telefon", tur: "metin" },
        { ad: "eposta", tur: "metin" },
        { ad: "web", tur: "metin" },
        { ad: "banka", tur: "metin" },
        { ad: "iban", tur: "metin" },
        { ad: "seri", tur: "metin", aciklama: "Fatura serisi, 1 ile 6 harf" },
        { ad: "vade", tur: "sayi", aciklama: "Varsayılan vade, gün" },
        { ad: "not", tur: "uzunMetin" },
        { ad: "paraBirimi", tur: "metin", varsayilan: "TRY", aciklama: "Varsayılan para birimi, ISO 4217 kodu" },
        { ad: "vergiAdi", tur: "metin", varsayilan: "KDV", aciklama: "Faturada görünen vergi adı" },
        { ad: "vergiOranlari", tur: "json", aciklama: "Seçilebilir vergi oranları, yüzde, sayı dizisi" },
        { ad: "varsayilanOran", tur: "sayi", aciklama: "Yeni kalemin vergi oranı, yüzde" },
        { ad: "vergiNoEtiketi", tur: "metin", varsayilan: "VKN", aciklama: "Vergi numarasının faturadaki etiketi" },
      ],
      kayitlar: [FIRMA],
    },
  };
}

const STIL = String.raw`/* Fatura Masası — sıcak kâğıt zemin, çam yeşili imza, mühür kırmızısı; Manrope arayüz, Fraunces başlık. */
:root {
  --zemin: #f3f1ec;
  --panel: #ffffff;
  --panel-2: #f8f7f3;
  --cizgi: #e3dfd5;
  --cizgi-2: #d3cec2;
  --metin: #1b1f1d;
  --metin-2: #575d59;
  --metin-3: #878c87;
  --cam: #0f5c4d;
  --cam-koyu: #0a4639;
  --cam-acik: #e1eee8;
  --muhur: #d24a26;
  --muhur-acik: #fbe8e1;
  --mavi: #2a62c4;
  --mavi-acik: #e5edfb;
  --amber: #a86a12;
  --amber-acik: #fbf0dc;
  --r: 14px;
  --yazi: "Manrope", system-ui, -apple-system, "Segoe UI", sans-serif;
  --baslik: "Fraunces", Georgia, serif;
  --egri: cubic-bezier(.22, 1, .36, 1);
  color-scheme: light;
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
[hidden] { display: none !important; }
html, body { margin: 0; }
body { background: var(--zemin); color: var(--metin); font: 14px/1.5 var(--yazi); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
button, input, select, textarea { font: inherit; color: inherit; }
button { cursor: pointer; }
a { color: inherit; }
:focus-visible { outline: 2px solid var(--cam); outline-offset: 2px; }
h1, h2, h3 { margin: 0; letter-spacing: -0.02em; }
.sayi { font-variant-numeric: tabular-nums; }

/* Üst çubuk */
.ust { position: sticky; top: 0; z-index: 40; background: rgba(243,241,236,.88); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid var(--cizgi); }
.ust-ic { max-width: 1380px; margin: 0 auto; padding: 12px 28px; display: flex; align-items: center; gap: 22px; }
.marka { display: flex; align-items: center; gap: 10px; text-decoration: none; min-width: 0; }
.marka svg { width: 34px; height: 34px; flex: none; }
.marka b { display: block; font-family: var(--baslik); font-size: 19px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.1; }
.marka small { display: block; color: var(--metin-3); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nav { display: flex; gap: 4px; background: #e9e6df; padding: 4px; border-radius: 12px; }
.nav a { text-decoration: none; padding: 7px 14px; border-radius: 9px; font-weight: 600; font-size: 13.5px; color: var(--metin-2); display: flex; align-items: center; gap: 7px; }
.nav a svg { width: 17px; height: 17px; }
.nav a[aria-current="page"] { background: var(--panel); color: var(--metin); }
.bosluk { flex: 1; }
.mod { display: flex; align-items: center; gap: 7px; color: var(--metin-3); font-size: 12.5px; white-space: nowrap; }
.mod i { width: 7px; height: 7px; border-radius: 50%; background: var(--amber); }
.mod[data-bagli="1"] i { background: #1f9d6c; }

/* Düğmeler */
.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 40px; padding: 0 15px; border-radius: 11px; border: 1px solid var(--cizgi-2); background: var(--panel); font-weight: 600; font-size: 13.5px; white-space: nowrap; text-decoration: none; transition: background .15s, border-color .15s, transform .1s; }
.dugme:hover { background: var(--panel-2); }
.dugme:active { transform: scale(.98); }
.dugme svg { width: 17px; height: 17px; flex: none; }
.dugme.ana { background: var(--cam); border-color: var(--cam); color: #fff; }
.dugme.ana:hover { background: var(--cam-koyu); }
.dugme.tehlike { color: var(--muhur); }
.dugme.tehlike.dolu { background: var(--muhur); border-color: var(--muhur); color: #fff; }
.dugme.kucuk { height: 34px; padding: 0 11px; font-size: 13px; border-radius: 9px; }
.dugme.ikon { width: 40px; padding: 0; }
.dugme[disabled] { opacity: .55; pointer-events: none; }

main { max-width: 1380px; margin: 0 auto; padding: 26px 28px 80px; }
.sayfa-bas { display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
.sayfa-bas h1 { font-family: var(--baslik); font-weight: 600; font-size: 32px; line-height: 1.1; }
.sayfa-bas p { margin: 4px 0 0; color: var(--metin-2); }
.sayfa-bas .eylem { margin-left: auto; display: flex; gap: 8px; flex-wrap: wrap; }

/* Özet */
.ozet { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(0, 1.35fr); gap: 14px; margin-bottom: 22px; }
.ozet-kart { background: var(--panel); border: 1px solid var(--cizgi); border-radius: var(--r); padding: 16px 18px; min-width: 0; }
.ozet-kart small { display: flex; align-items: center; gap: 7px; color: var(--metin-2); font-size: 13px; font-weight: 600; }
.ozet-kart small i { width: 8px; height: 8px; border-radius: 3px; background: var(--renk, var(--cam)); }
.ozet-kart b { display: block; font-size: 26px; font-weight: 700; letter-spacing: -0.03em; margin: 8px 0 3px; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ozet-kart span { color: var(--metin-3); font-size: 12.5px; }
.ozet-kart.uyari b { color: var(--muhur); }
.grafik { display: flex; flex-direction: column; }
.grafik-ic { flex: 1; display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; align-items: end; min-height: 74px; margin-top: 10px; }
.ay { display: flex; flex-direction: column; align-items: center; gap: 5px; height: 100%; justify-content: flex-end; }
.ay .cubuklar { display: flex; gap: 3px; align-items: flex-end; height: 62px; }
.ay .cubuklar i { width: 11px; border-radius: 4px 4px 2px 2px; background: #cfd8d3; min-height: 3px; transition: height .5s var(--egri); }
.ay .cubuklar i.t { background: var(--cam); }
.ay em { font-style: normal; font-size: 11.5px; color: var(--metin-3); }
.lejant { display: flex; gap: 14px; font-size: 12px; color: var(--metin-2); margin-top: 8px; }
.lejant span::before { content: ""; display: inline-block; width: 9px; height: 9px; border-radius: 3px; background: #cfd8d3; margin-right: 6px; vertical-align: -1px; }
.lejant span.t::before { background: var(--cam); }

/* Süzgeç */
.suzgec { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.cipler { display: flex; gap: 6px; flex-wrap: wrap; }
.cip { height: 36px; padding: 0 13px; border-radius: 999px; border: 1px solid var(--cizgi-2); background: var(--panel); font-weight: 600; font-size: 13px; color: var(--metin-2); display: inline-flex; align-items: center; gap: 7px; }
.cip em { font-style: normal; color: var(--metin-3); font-weight: 600; font-size: 12px; }
.cip[aria-pressed="true"] { background: var(--metin); border-color: var(--metin); color: #fff; }
.cip[aria-pressed="true"] em { color: #c9cdc9; }
.ara { margin-left: auto; position: relative; width: 300px; max-width: 100%; }
.ara svg { position: absolute; left: 12px; top: 50%; translate: 0 -50%; width: 17px; height: 17px; color: var(--metin-3); }
.ara input { width: 100%; height: 40px; border-radius: 11px; border: 1px solid var(--cizgi-2); background: var(--panel); padding: 0 12px 0 38px; }

/* Tablo */
.tablo-kap { background: var(--panel); border: 1px solid var(--cizgi); border-radius: var(--r); overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; font-size: 12.5px; font-weight: 600; color: var(--metin-3); padding: 12px 16px; border-bottom: 1px solid var(--cizgi); background: var(--panel-2); white-space: nowrap; }
td { padding: 13px 16px; border-bottom: 1px solid #efece5; vertical-align: middle; }
tr:last-child td { border-bottom: 0; }
tbody tr { cursor: pointer; transition: background .12s; }
tbody tr:hover { background: #faf9f6; }
th.sag, td.sag { text-align: right; }
td .no { font-weight: 700; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
td .alt { display: block; color: var(--metin-3); font-size: 12.5px; }
td .tutar { font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
.durum { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: 999px; font-size: 12.5px; font-weight: 700; white-space: nowrap; background: #eeece6; color: var(--metin-2); }
.durum::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.durum[data-d="Gönderildi"] { background: var(--mavi-acik); color: var(--mavi); }
.durum[data-d="Gecikti"] { background: var(--muhur-acik); color: var(--muhur); }
.durum[data-d="Ödendi"] { background: var(--cam-acik); color: var(--cam); }
.satir-eylem { display: flex; gap: 6px; justify-content: flex-end; }
.vade-yazi { white-space: nowrap; }
.vade-yazi.gec { color: var(--muhur); font-weight: 600; }
.kartlar { display: none; }
.bos { padding: 48px 20px; text-align: center; color: var(--metin-2); }
.bos b { display: block; font-family: var(--baslik); font-size: 20px; color: var(--metin); margin-bottom: 4px; }

/* Düzenleyici */
.ed-ust { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
.geri { display: inline-flex; align-items: center; gap: 6px; color: var(--metin-2); text-decoration: none; font-weight: 600; font-size: 13.5px; height: 40px; padding: 0 12px 0 8px; border-radius: 10px; }
.geri:hover { background: #e9e6df; }
.geri svg { width: 18px; height: 18px; }
.ed-baslik { display: flex; align-items: center; gap: 10px; min-width: 0; flex-wrap: wrap; }
.ed-baslik h1 { font-family: var(--baslik); font-weight: 600; font-size: 26px; font-variant-numeric: tabular-nums; }
.kirli-yazi { color: var(--amber); font-size: 12.5px; font-weight: 600; }
.ed-eylem { margin-left: auto; display: flex; gap: 8px; flex-wrap: wrap; }
.ed-sekme { display: none; }
.ed-govde { display: grid; grid-template-columns: minmax(0, 1fr) 560px; gap: 22px; align-items: start; }
.ed-form { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.blok { background: var(--panel); border: 1px solid var(--cizgi); border-radius: var(--r); padding: 18px; }
.blok h2 { font-size: 15px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.blok h2 .ek { margin-left: auto; font-weight: 600; font-size: 12.5px; color: var(--metin-3); }
.alanlar { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.alanlar.uc { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.alan { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.alan.tam { grid-column: 1 / -1; }
.alan > span { font-size: 12.5px; font-weight: 600; color: var(--metin-2); }
.alan input, .alan select, .alan textarea, .kalem input, .kalem select { width: 100%; height: 42px; border-radius: 10px; border: 1px solid var(--cizgi-2); background: var(--panel); padding: 0 11px; min-width: 0; transition: border-color .15s; }
.alan textarea { height: auto; min-height: 84px; padding: 10px 11px; resize: vertical; line-height: 1.45; }
.alan input:focus, .alan select:focus, .alan textarea:focus, .kalem input:focus, .kalem select:focus { outline: none; border-color: var(--cam); }
.alan input[aria-invalid="true"] { border-color: var(--muhur); }
.ipucu { font-size: 12px; color: var(--metin-3); }
.hata-yazi { color: var(--muhur); font-size: 12.5px; font-weight: 600; }
.alici-satir { display: flex; gap: 8px; }
.alici-satir select { flex: 1; min-width: 0; height: 44px; border-radius: 10px; border: 1px solid var(--cizgi-2); background: var(--panel); padding: 0 11px; font-weight: 600; }
.alici-satir select:focus { outline: none; border-color: var(--cam); }
.alici-bilgi { margin-top: 10px; padding: 11px 13px; border-radius: 10px; background: var(--panel-2); color: var(--metin-2); font-size: 13px; line-height: 1.5; }
.alici-bilgi b { color: var(--metin); }
.vade-cip { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.vade-cip button { height: 30px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--cizgi-2); background: var(--panel); font-size: 12.5px; font-weight: 600; color: var(--metin-2); }
.vade-cip button[aria-pressed="true"] { background: var(--cam-acik); border-color: var(--cam); color: var(--cam); }

.kalemler { display: flex; flex-direction: column; gap: 10px; }
.kalem { border: 1px solid var(--cizgi); border-radius: 12px; padding: 12px; background: var(--panel-2); }
.kalem-ust { display: flex; align-items: center; gap: 9px; }
.kalem-ust .sira { width: 26px; height: 26px; flex: none; border-radius: 8px; background: var(--panel); border: 1px solid var(--cizgi); display: grid; place-items: center; font-size: 12px; font-weight: 700; color: var(--metin-2); }
.kalem-ust input { flex: 1; font-weight: 600; }
.kalem-sil { flex: none; width: 36px; height: 36px; border-radius: 9px; border: 0; background: transparent; color: var(--metin-3); display: grid; place-items: center; }
.kalem-sil:hover { background: var(--muhur-acik); color: var(--muhur); }
.kalem-sil svg { width: 18px; height: 18px; }
.kalem-alt { display: grid; grid-template-columns: .8fr 1fr 1.25fr .8fr 1fr 1.25fr; gap: 8px; margin-top: 9px; padding-left: 35px; }
.kalem-alt label { display: flex; flex-direction: column; gap: 4px; min-width: 0; font-size: 11.5px; font-weight: 600; color: var(--metin-3); }
.kalem-alt input, .kalem-alt select { height: 38px; padding: 0 9px; font-variant-numeric: tabular-nums; }
.ed-form { container-type: inline-size; }
@container (max-width: 700px) { .kalem-alt { grid-template-columns: repeat(3, minmax(0, 1fr)); padding-left: 0; } }
.k-tutar { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; justify-content: flex-start; min-width: 0; }
.k-tutar small { font-size: 11.5px; font-weight: 600; color: var(--metin-3); }
.k-tutar b { height: 38px; display: flex; align-items: center; font-variant-numeric: tabular-nums; white-space: nowrap; font-size: 14px; }
.kalem-ekle { margin-top: 10px; width: 100%; height: 44px; border: 1.5px dashed var(--cizgi-2); border-radius: 12px; background: transparent; font-weight: 700; color: var(--cam); display: flex; align-items: center; justify-content: center; gap: 7px; }
.kalem-ekle:hover { background: var(--cam-acik); border-color: var(--cam); }
.kalem-ekle svg { width: 18px; height: 18px; }
.toplam-ozet { display: grid; gap: 6px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--cizgi); }
.toplam-ozet div { display: flex; justify-content: space-between; gap: 12px; color: var(--metin-2); font-variant-numeric: tabular-nums; }
.toplam-ozet div.genel { color: var(--metin); font-weight: 800; font-size: 17px; margin-top: 4px; }

.ed-onizleme { position: sticky; top: 84px; min-width: 0; }
.onizleme-bas { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; color: var(--metin-2); font-size: 13px; font-weight: 600; }
.kagit-kap { position: relative; width: 100%; overflow: hidden; border-radius: 6px; border: 1px solid var(--cizgi-2); background: #fff; }
.kagit-olcek { width: 794px; transform-origin: 0 0; }
.ed-alt { display: none; }

/* A4 kâğıt */
.kagit { width: 794px; min-height: 1123px; background: #fff; color: #1d2421; padding: 64px 64px 56px; font: 12.5px/1.5 "Manrope", system-ui, sans-serif; position: relative; display: flex; flex-direction: column; }
.k-ust { display: flex; justify-content: space-between; gap: 30px; }
.k-firma { display: flex; gap: 14px; max-width: 360px; }
.k-firma svg { width: 46px; height: 46px; flex: none; }
.k-firma b { display: block; font-family: "Fraunces", Georgia, serif; font-size: 19px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.2; margin-bottom: 5px; }
.k-firma p, .k-alici p { margin: 0; color: #4c5551; }
.k-baslik { text-align: right; }
.k-baslik h2 { font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: 40px; line-height: 1; color: var(--cam); letter-spacing: -0.02em; }
.k-meta { margin-top: 14px; display: grid; grid-template-columns: auto auto; gap: 3px 18px; justify-content: end; text-align: right; }
.k-meta span { color: #7a827e; }
.k-meta b { font-variant-numeric: tabular-nums; }
.k-alici { margin-top: 38px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; padding: 18px 0; border-top: 1.5px solid #1d2421; border-bottom: 1px solid #dcd8cf; }
.k-alici small { display: block; color: #7a827e; font-size: 11.5px; font-weight: 600; margin-bottom: 4px; }
.k-alici b { display: block; font-size: 14px; margin-bottom: 3px; }
.k-tablo { margin-top: 26px; width: 100%; border-collapse: collapse; }
.k-tablo th { background: none; color: #7a827e; font-size: 11.5px; padding: 0 8px 9px; border-bottom: 1px solid #dcd8cf; }
.k-tablo td { padding: 11px 8px; border-bottom: 1px solid #ebe8e1; font-variant-numeric: tabular-nums; vertical-align: top; cursor: default; }
.k-tablo tr:hover { background: none; }
.k-tablo th:first-child, .k-tablo td:first-child { padding-left: 0; width: 26px; color: #7a827e; }
.k-tablo th:last-child, .k-tablo td:last-child { padding-right: 0; }
.k-tablo .r { text-align: right; white-space: nowrap; }
.k-tablo td b { font-weight: 600; }
.k-alt { display: flex; justify-content: space-between; gap: 34px; margin-top: 22px; }
.k-yazi { flex: 1; color: #4c5551; font-style: italic; padding-top: 4px; }
.k-toplam b { white-space: nowrap; }
.k-toplam { width: 350px; flex: none; display: grid; gap: 5px; font-variant-numeric: tabular-nums; }
.k-toplam div { display: flex; justify-content: space-between; gap: 12px; }
.k-toplam div span { color: #5d6662; }
.k-toplam .genel { margin-top: 8px; padding: 12px 14px; border-radius: 8px; background: var(--cam); color: #fff; font-size: 15px; font-weight: 700; }
.k-toplam .genel span { color: #d5e8e0; }
.k-dip { margin-top: auto; padding-top: 34px; display: grid; grid-template-columns: 1.2fr 1fr; gap: 30px; font-size: 11.5px; color: #4c5551; }
.k-dip small { display: block; color: #7a827e; font-weight: 600; margin-bottom: 4px; }
.k-dip b { color: #1d2421; font-variant-numeric: tabular-nums; }
.k-cizgi { margin-top: 22px; height: 6px; border-radius: 3px; background: linear-gradient(90deg, var(--cam) 0 70%, var(--muhur) 70% 100%); }
.muhur { position: absolute; top: 250px; right: 70px; transform: rotate(-12deg); border: 3px solid var(--muhur); color: var(--muhur); border-radius: 12px; padding: 8px 18px; text-align: center; opacity: .85; font-family: "Fraunces", Georgia, serif; }
.muhur b { display: block; font-size: 30px; font-weight: 700; line-height: 1; letter-spacing: .02em; }
.muhur span { font-family: "Manrope", sans-serif; font-size: 12px; font-weight: 700; }
.filigran { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; font-family: "Fraunces", Georgia, serif; font-size: 150px; font-weight: 600; color: rgba(29,36,33,.045); transform: rotate(-28deg); }

/* Müşteriler */
.musteri-izgara { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
.musteri { background: var(--panel); border: 1px solid var(--cizgi); border-radius: var(--r); padding: 18px; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.musteri h3 { font-size: 16px; font-weight: 700; }
.musteri p { margin: 2px 0 0; color: var(--metin-2); font-size: 13px; }
.musteri .rakam { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; padding: 12px 0; border-top: 1px solid #efece5; border-bottom: 1px solid #efece5; }
.musteri .rakam small { display: block; font-size: 11.5px; color: var(--metin-3); font-weight: 600; }
.musteri .rakam b { font-variant-numeric: tabular-nums; font-size: 14px; white-space: nowrap; }
.musteri .rakam b.gec { color: var(--muhur); }
.musteri .alt-satir { display: flex; gap: 8px; flex-wrap: wrap; }
.musteri .iletisim { font-size: 12.5px; color: var(--metin-3); overflow-wrap: anywhere; }

/* Firma */
.firma-duzen { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 22px; align-items: start; }
.bilgi-kutu { background: var(--cam-acik); border-radius: var(--r); padding: 18px; color: #234a40; font-size: 13.5px; }
.bilgi-kutu b { display: block; color: var(--cam-koyu); font-size: 15px; margin-bottom: 6px; }
.bilgi-kutu p { margin: 0 0 10px; }

/* Pencere */
.pencere-kap { position: fixed; inset: 0; z-index: 80; background: rgba(27,31,29,.42); display: grid; place-items: center; padding: 20px; animation: sol .2s; }
.pencere { width: min(520px, 100%); max-height: calc(100dvh - 40px); overflow: auto; background: var(--panel); border-radius: 18px; padding: 22px; animation: yuksel .28s var(--egri); }
.pencere h2 { font-family: var(--baslik); font-weight: 600; font-size: 22px; margin-bottom: 4px; }
.pencere > p { margin: 0 0 16px; color: var(--metin-2); }
.pencere .alt-dugmeler { display: flex; gap: 8px; justify-content: flex-end; margin-top: 18px; flex-wrap: wrap; }
@keyframes sol { from { opacity: 0; } }
@keyframes yuksel { from { transform: translateY(16px); opacity: 0; } }

.bildirim { position: fixed; left: 50%; bottom: 26px; z-index: 90; translate: -50% 20px; opacity: 0; pointer-events: none; background: var(--metin); color: #fff; padding: 11px 16px; border-radius: 12px; font-weight: 600; font-size: 13.5px; transition: .25s var(--egri); max-width: calc(100vw - 32px); text-align: center; }
.bildirim.acik { opacity: 1; translate: -50% 0; }
.bildirim[data-tur="hata"] { background: var(--muhur); }

.alt-nav { display: none; }
.yeni-yuzen { display: none; }
.yukleniyor { padding: 80px 0; text-align: center; color: var(--metin-3); }

@media (max-width: 1180px) {
  .ozet { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ed-govde { grid-template-columns: 1fr; }
  .ed-sekme { display: flex; gap: 4px; background: #e9e6df; padding: 4px; border-radius: 12px; margin-bottom: 14px; }
  .ed-sekme button { flex: 1; height: 38px; border: 0; border-radius: 9px; background: transparent; font-weight: 700; color: var(--metin-2); }
  .ed-sekme button[aria-pressed="true"] { background: var(--panel); color: var(--metin); }
  .ed-govde[data-gorunum="duzenle"] .ed-onizleme { display: none; }
  .ed-govde[data-gorunum="onizleme"] .ed-form { display: none; }
  .ed-onizleme { position: static; max-width: 760px; margin: 0 auto; width: 100%; }
  .firma-duzen { grid-template-columns: 1fr; }
}
@media (max-width: 760px) {
  .ust-ic { padding: 10px 16px; }
  .ust .nav, .mod span { display: none; }
  main { padding: 18px 16px 150px; }
  .sayfa-bas h1 { font-size: 27px; }
  .sayfa-bas .eylem .gizle-mobil { display: none; }
  .ozet { gap: 10px; }
  .ozet-kart { padding: 13px 14px; }
  .ozet-kart b { font-size: 20px; }
  .ozet-kart.grafik { grid-column: 1 / -1; }
  .ara { width: 100%; margin-left: 0; order: -1; }
  .cipler { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin: 0 -16px; padding: 0 16px; width: calc(100% + 32px); }
  .cipler::-webkit-scrollbar { display: none; }
  .cip { flex: none; }
  .tablo-kap { display: none; }
  .kartlar { display: flex; flex-direction: column; gap: 10px; }
  .fkart { background: var(--panel); border: 1px solid var(--cizgi); border-radius: var(--r); padding: 14px; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 12px; text-align: left; width: 100%; }
  .fkart .m { font-weight: 700; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .fkart .no { color: var(--metin-3); font-size: 12.5px; font-variant-numeric: tabular-nums; }
  .fkart .tutar { font-weight: 800; font-size: 15px; text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .fkart .sag-alt { text-align: right; }
  .fkart .vade-yazi { font-size: 12.5px; color: var(--metin-2); }
  .fkart .vade-yazi.gec { color: var(--muhur); }
  .alt-nav { display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 50; background: rgba(255,255,255,.94); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-top: 1px solid var(--cizgi); padding: 6px 8px calc(6px + env(safe-area-inset-bottom)); }
  .alt-nav a { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 4px; text-decoration: none; color: var(--metin-3); font-size: 11.5px; font-weight: 700; border-radius: 10px; }
  .alt-nav a svg { width: 22px; height: 22px; }
  .alt-nav a[aria-current="page"] { color: var(--cam); }
  .yeni-yuzen { display: inline-flex; position: fixed; right: 16px; bottom: calc(76px + env(safe-area-inset-bottom)); z-index: 45; height: 52px; padding: 0 20px; border-radius: 16px; font-size: 15px; }
  body[data-rota="fatura"] .alt-nav, body[data-rota="fatura"] .yeni-yuzen { display: none; }
  body[data-rota="fatura"] main { padding-bottom: 110px; }
  .ed-baslik h1 { font-size: 21px; }
  .ed-eylem { margin-left: 0; width: 100%; }
  .ed-eylem .dugme { flex: 1 1 auto; }
  .ed-eylem .kaydet-ust { display: none; }
  .blok { padding: 14px; }
  .alanlar, .alanlar.uc { grid-template-columns: 1fr 1fr; }
  .alanlar.uc .alan:first-child { grid-column: 1 / -1; }
  .kalem-alt { grid-template-columns: repeat(3, minmax(0, 1fr)); padding-left: 0; }
  .ed-alt { display: flex; align-items: center; gap: 12px; position: fixed; left: 0; right: 0; bottom: 0; z-index: 50; background: rgba(255,255,255,.95); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-top: 1px solid var(--cizgi); padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); }
  .ed-alt div { flex: 1; min-width: 0; }
  .ed-alt small { display: block; color: var(--metin-3); font-size: 12px; font-weight: 600; }
  .ed-alt b { font-size: 18px; font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .ed-alt .dugme { height: 46px; padding: 0 22px; }
  .musteri-izgara { grid-template-columns: 1fr; }
  .pencere-kap { place-items: end stretch; padding: 0; }
  .pencere { width: 100%; border-radius: 20px 20px 0 0; max-height: 92dvh; padding: 20px 16px calc(20px + env(safe-area-inset-bottom)); }
  .bildirim { bottom: 90px; }
}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }

/* Yazdırma: yalnız kâğıt */
@page { size: A4; margin: 0; }
@media print {
  body { background: #fff; }
  body * { visibility: hidden; }
  .ust, .alt-nav, .ed-alt, .yeni-yuzen, .bildirim { display: none !important; }
  main { padding: 0; max-width: none; }
  .ed-govde, .ed-govde[data-gorunum="duzenle"] .ed-onizleme { display: block !important; }
  .ed-form, .ed-ust, .ed-sekme, .onizleme-bas { display: none !important; }
  .kagit-kap { border: 0; overflow: visible; height: auto !important; }
  .kagit-olcek { transform: none !important; }
  .kagit, .kagit * { visibility: visible; }
  .kagit { position: absolute; left: 0; top: 0; width: 210mm; min-height: 297mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

const UYGULAMA = ORTAK_JS + "\nvar TOHUM = " + JSON.stringify({ musteriler: MUSTERILER, faturalar: FATURALAR, firma: FIRMA }) + ";\nvar BIRIMLER = " + JSON.stringify(BIRIMLER) + ";\nvar PARA_BIRIMLERI = " + JSON.stringify(PARA_BIRIMLERI) + ";\nvar VERGI_ADLARI = " + JSON.stringify(VERGI_ADLARI) + ";\n" + String.raw`
/* ── Durum ── */
var S = { musteriler: [], faturalar: [], firma: null, yuklendi: false, rota: { ad: "liste" }, suzgec: "tumu", ara: "", taslak: null, kirli: false, gorunum: "duzenle", mesgul: false };
var IK = {
  fatura: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V4a1 1 0 0 1 1-1z"/><path d="M9 9h6M9 13h6M9 17h3"/></svg>',
  kisiler: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .8 3.2 2.5 3.5 5.2"/></svg>',
  firma: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3"/></svg>',
  arti: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  geri: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  yazdir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V3h10v6M7 17H4.5A1.5 1.5 0 0 1 3 15.5v-5A1.5 1.5 0 0 1 4.5 9h15a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H17"/><path d="M7 14h10v7H7z"/></svg>',
  kopya: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/></svg>',
  cop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  gonder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/></svg>',
  odendi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  geriAl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
  ara: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
  indir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5v10.5M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/></svg>',
  posta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>',
  kapat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  duzenle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>'
};
var LOGO = '<svg viewBox="0 0 46 46" aria-hidden="true"><rect width="46" height="46" rx="12" fill="#0f5c4d"/><path d="M14 12v22M14 23l11-11M18.5 19 27 34" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32.5" cy="14.5" r="3.2" fill="#d24a26"/></svg>';

/* ── Depo: Vayra Veri ya da bu cihazın belleği ── */
var YEREL = "fatura-masasi-v2", yerel = null;
function bugun() { return istanbul().tarih; }
function seriNo(seri, yil, sira) { return seri + yil + String(sira).padStart(9, "0"); }
function aliciOf(m) { return m ? { ad: m.ad, yetkili: m.yetkili || "", vergiDairesi: m.vergiDairesi || "", vergiNo: m.vergiNo || "", adres: m.adres || "", eposta: m.eposta || "" } : null; }
function tohumCoz() {
  var z = Date.now(), b = bugun(), yil = b.slice(0, 4);
  return {
    surum: 1,
    musteriler: TOHUM.musteriler.map(function (m) { return Object.assign({ olusturma: z, guncelleme: z }, m); }),
    faturalar: TOHUM.faturalar.map(function (f, i) {
      var tarih = gunEkle(b, -f.gunOnce), m = TOHUM.musteriler.find(function (x) { return x.id === f.musteriId; });
      var r = { id: f.id, no: seriNo("KRK", yil, f.sira), paraBirimi: f.paraBirimi || TOHUM.firma.paraBirimi, musteriId: f.musteriId, alici: aliciOf(m), tarih: tarih, vade: gunEkle(tarih, f.vadeGun), durum: f.durum, kalemler: f.kalemler, not: f.not || TOHUM.firma.not, odemeTarihi: f.odemeGun != null ? gunEkle(tarih, f.odemeGun) : "", olusturma: z + i, guncelleme: z + i };
      r.toplam = hesapla(r.kalemler).genel;
      return r;
    }),
    firma: [Object.assign({ olusturma: z, guncelleme: z }, TOHUM.firma)]
  };
}
function yerelAl() {
  if (!yerel) { try { yerel = JSON.parse(localStorage.getItem(YEREL) || "null"); } catch (e) { yerel = null; } if (!yerel || yerel.surum !== 1) { yerel = tohumCoz(); yerelYaz(); } }
  return yerel;
}
function yerelYaz() { try { localStorage.setItem(YEREL, JSON.stringify(yerel)); } catch (e) { /* bellek dolu */ } }
function yeniId() { return "y" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function kopya(x) { return JSON.parse(JSON.stringify(x)); }
var Depo = {
  liste: function (kol) { return veriVar() ? vayra.veri.liste(kol, { sinir: 1000 }) : Promise.resolve(kopya(yerelAl()[kol])); },
  ekle: function (kol, k) {
    if (veriVar()) return vayra.veri.ekle(kol, k);
    var l = yerelAl()[kol];
    if (kol === "faturalar" && l.some(function (x) { return x.no === k.no; })) return Promise.reject(new Error("Bu fatura numarası zaten kullanılıyor."));
    var r = Object.assign({ id: k.id || yeniId(), olusturma: Date.now(), guncelleme: Date.now() }, k);
    l.push(r); yerelYaz(); return Promise.resolve(kopya(r));
  },
  guncelle: function (kol, id, a) {
    if (veriVar()) return vayra.veri.guncelle(kol, id, a);
    var l = yerelAl()[kol];
    if (kol === "faturalar" && a.no && l.some(function (x) { return x.no === a.no && x.id !== id; })) return Promise.reject(new Error("Bu fatura numarası zaten kullanılıyor."));
    var r = l.find(function (x) { return x.id === id; });
    if (r) { Object.assign(r, kopya(a), { guncelleme: Date.now() }); yerelYaz(); }
    return Promise.resolve(r ? kopya(r) : null);
  },
  sil: function (kol, id) {
    if (veriVar()) return vayra.veri.sil(kol, id);
    var l = yerelAl()[kol], i = l.findIndex(function (x) { return x.id === id; });
    if (i >= 0) { l.splice(i, 1); yerelYaz(); }
    return Promise.resolve(true);
  }
};

/* ── Hesap ve biçim ── */
function sayi(v) { if (typeof v === "number") return isFinite(v) ? v : 0; var s = String(v == null ? "" : v).trim().replace(/\s/g, ""); if (s.indexOf(",") >= 0) s = s.replace(/\./g, "").replace(",", "."); var n = parseFloat(s); return isFinite(n) ? n : 0; }
function yuvarla(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
/* Para birimi ve vergi: firma ayarlarından gelir (ülkeye özel kural sabitlenmez). */
function pb(kod) { return PARA_BIRIMLERI.find(function (x) { return x.kod === kod; }) || { kod: kod || "TRY", ad: kod || "TRY", ana: "", alt: "" }; }
function varsayilanPB() { return firma().paraBirimi || "TRY"; }
function paraBicim(n, kod, kisa) {
  kod = kod || varsayilanPB(); n = Number(n || 0);
  if (kod === "TRY") return n.toLocaleString("tr-TR", kisa ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " TL";
  try { return new Intl.NumberFormat("tr-TR", Object.assign({ style: "currency", currency: kod }, kisa ? { maximumFractionDigits: 0, minimumFractionDigits: 0 } : {})).format(n); }
  catch (e) { return n.toLocaleString("tr-TR", { maximumFractionDigits: kisa ? 0 : 2 }) + " " + kod; }
}
function para(n, kod) { return paraBicim(n, kod, false); }
function kisaPara(n, kod) { return paraBicim(n, kod, true); }
function vergiAdi() { return firma().vergiAdi || "Vergi"; }
function vergiOranlari() {
  var l = firma().vergiOranlari;
  if (typeof l === "string") l = oranCoz(l);
  l = (Array.isArray(l) ? l : [0]).map(sayi).filter(function (x) { return x >= 0 && x <= 100; });
  l = l.filter(function (x, i) { return l.indexOf(x) === i; }).sort(function (a, b) { return a - b; });
  return l.length ? l : [0];
}
/* "0; 10; 20" ya da "0, 10, 20" (virgülden sonra boşluk) ayrılır; "7,5" ondalık sayıdır. */
function oranCoz(s) { return String(s || "").split(/;|\s+|,\s+/).filter(function (x) { return x.trim() !== ""; }); }
function varsayilanOran() { var o = sayi(firma().varsayilanOran); return vergiOranlari().indexOf(o) >= 0 ? o : vergiOranlari()[vergiOranlari().length - 1]; }
function vergiNoEtiketi() { return firma().vergiNoEtiketi || "Vergi no"; }
function oranYaz(o) { return "yüzde " + giris(o); }
function giris(n) { return n === 0 || n ? String(n).replace(".", ",") : ""; }
function hesapla(kalemler) {
  var ara = 0, isk = 0, kdvler = {}, satirlar = [];
  (kalemler || []).forEach(function (k) {
    var brut = sayi(k.miktar) * sayi(k.fiyat), i = brut * Math.min(100, Math.max(0, sayi(k.iskonto))) / 100, net = brut - i, oran = sayi(k.kdv), kdv = net * oran / 100;
    ara += brut; isk += i;
    if (!kdvler[oran]) kdvler[oran] = { oran: oran, matrah: 0, tutar: 0 };
    kdvler[oran].matrah += net; kdvler[oran].tutar += kdv;
    satirlar.push({ brut: yuvarla(brut), net: yuvarla(net), kdv: yuvarla(kdv) });
  });
  var liste = Object.keys(kdvler).map(function (o) { return kdvler[o]; }).sort(function (a, b) { return b.oran - a.oran; });
  liste.forEach(function (x) { x.matrah = yuvarla(x.matrah); x.tutar = yuvarla(x.tutar); });
  var matrah = yuvarla(ara - isk), kdv = yuvarla(liste.reduce(function (t, x) { return t + x.tutar; }, 0));
  return { ara: yuvarla(ara), iskonto: yuvarla(isk), matrah: matrah, kdvler: liste, kdv: kdv, genel: yuvarla(matrah + kdv), satirlar: satirlar };
}
var BIR = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"], ON = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"], GRUP = ["", "bin", "milyon", "milyar", "trilyon"];
function ucHane(n) { var y = Math.floor(n / 100), o = Math.floor(n % 100 / 10), b = n % 10, p = []; if (y) p.push(y === 1 ? "yüz" : BIR[y] + " yüz"); if (o) p.push(ON[o]); if (b) p.push(BIR[b]); return p.join(" "); }
function yaziyla(n) {
  n = Math.floor(n); if (n === 0) return "sıfır";
  var p = [], i = 0;
  while (n > 0 && i < GRUP.length) { var u = n % 1000; if (u) p.unshift(i === 1 && u === 1 ? "bin" : ucHane(u) + (GRUP[i] ? " " + GRUP[i] : "")); n = Math.floor(n / 1000); i++; }
  return p.join(" ");
}
function tutarYazi(t, kod) {
  var p = pb(kod || varsayilanPB()); if (!p.ana) return "";
  var l = Math.floor(t + 1e-9), k = Math.round((t - l) * 100); if (k === 100) { l++; k = 0; }
  return "Yalnız " + yaziyla(l) + " " + p.ana + (k && p.alt ? " " + yaziyla(k) + " " + p.alt : "") + ".";
}
function tarihKisa(t) { return t ? tarihYaz(t, { year: "numeric", month: "short" }) : ""; }
function tarihUzun(t) { return t ? tarihYaz(t, { year: "numeric" }) : ""; }
function gunFark(a, b) { return Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 864e5); }
function durumOf(f) { return f.durum === "Gönderildi" && f.vade && f.vade < bugun() ? "Gecikti" : f.durum; }
function durumHTML(d) { return '<span class="durum" data-d="' + kacir(d) + '">' + kacir(d) + "</span>"; }
function vadeHTML(f) {
  var d = durumOf(f), fark = gunFark(bugun(), f.vade);
  if (d === "Ödendi") return '<span class="vade-yazi">' + kacir(tarihKisa(f.odemeTarihi || f.vade)) + " ödendi</span>";
  if (d === "Taslak") return '<span class="vade-yazi">' + kacir(tarihKisa(f.vade)) + "</span>";
  if (fark < 0) return '<span class="vade-yazi gec">' + (-fark) + " gün gecikti</span>";
  if (fark === 0) return '<span class="vade-yazi gec">Bugün son gün</span>';
  return '<span class="vade-yazi">' + fark + " gün kaldı</span>";
}
function musteri(id) { return S.musteriler.find(function (m) { return m.id === id; }) || null; }
function ibanMi(s) { return /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(String(s || "").replace(/\s/g, "").toUpperCase()); }
function ibanYaz(s) { return ibanMi(s) ? String(s).replace(/\s/g, "").toUpperCase().replace(/(.{4})/g, "$1 ").trim() : String(s || ""); }
function firma() { return S.firma || TOHUM.firma; }
function sonrakiNo() {
  var seri = (firma().seri || "KRK").toLocaleUpperCase("tr"), yil = bugun().slice(0, 4), on = seri + yil, en = 0;
  S.faturalar.forEach(function (f) { if (String(f.no).indexOf(on) === 0) { var n = parseInt(String(f.no).slice(on.length), 10); if (n > en) en = n; } });
  return seriNo(seri, yil, en + 1);
}
function hizmetler() {
  var m = {};
  S.faturalar.slice().sort(function (a, b) { return a.tarih < b.tarih ? -1 : 1; }).forEach(function (f) { (f.kalemler || []).forEach(function (k) { if (k.aciklama) m[k.aciklama] = k; }); });
  return m;
}

/* ── Yönlendirme ── */
var yoksay = false, eskiHash = "";
function rotaCoz() {
  var h = location.hash.replace(/^#\/?/, ""), soru = h.indexOf("?"), q = {};
  if (soru >= 0) { new URLSearchParams(h.slice(soru + 1)).forEach(function (v, k) { q[k] = v; }); h = h.slice(0, soru); }
  var p = h.split("/");
  if (p[0] === "fatura" && p[1]) return { ad: "fatura", id: decodeURIComponent(p[1]), q: q };
  if (p[0] === "yeni") return { ad: "fatura", id: null, q: q };
  if (p[0] === "musteriler") return { ad: "musteriler", q: q };
  if (p[0] === "firma") return { ad: "firma", q: q };
  return { ad: "liste", q: q };
}
function git(h) { if (location.hash === h) rotaDegisti(); else location.hash = h; }
function rotaDegisti() {
  if (yoksay) { yoksay = false; return; }
  var r = rotaCoz();
  if (S.kirli && S.rota.ad === "fatura" && !(r.ad === "fatura" && S.taslak && r.id === S.taslak.id && r.id)) {
    var don = eskiHash;
    sor({ baslik: "Kaydedilmemiş değişiklik var", metin: "Bu faturadaki değişiklikler kaydedilmedi. Çıkarsan kaybolacak.", evet: "Kaydetmeden çık", tehlike: true }).then(function (ok) {
      if (ok) { S.kirli = false; S.rota = r; eskiHash = location.hash; ciz(); }
      else { yoksay = true; location.hash = don; }
    });
    return;
  }
  S.rota = r; eskiHash = location.hash; ciz();
}
window.addEventListener("hashchange", rotaDegisti);
window.addEventListener("beforeunload", function (e) { if (S.kirli) { e.preventDefault(); e.returnValue = ""; } });

/* ── Çizim ── */
function navGuncelle() {
  var ad = S.rota.ad === "fatura" ? "liste" : S.rota.ad;
  $$("[data-nav]").forEach(function (a) { if (a.dataset.nav === ad) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  document.body.dataset.rota = S.rota.ad;
  $("#yeniYuzen").hidden = S.rota.ad === "fatura" || S.rota.ad === "firma";
}
function ciz() {
  navGuncelle();
  if (!S.yuklendi) { $("#icerik").innerHTML = '<div class="yukleniyor">Faturalar yükleniyor</div>'; return; }
  window.scrollTo(0, 0);
  if (S.rota.ad === "fatura") return edAc();
  if (S.rota.ad === "musteriler") return cizMusteriler();
  if (S.rota.ad === "firma") return cizFirma();
  cizListe();
}

function ozetHesapla() {
  /* Özet ve grafik varsayılan para birimindedir; başka para birimindeki bekleyenler ayrıca yazılır (kur çevrimi yapılmaz). */
  var b = bugun(), ay = b.slice(0, 7), pbv = varsayilanPB(), o = { bekleyen: 0, bekleyenSay: 0, gec: 0, gecSay: 0, enEski: 0, buAy: 0, buAySay: 0, diger: {} };
  var ayni = function (f) { return (f.paraBirimi || pbv) === pbv; };
  S.faturalar.forEach(function (f) {
    var d = durumOf(f), t = Number(f.toplam || 0);
    if (!ayni(f)) { if (d === "Gönderildi" || d === "Gecikti") o.diger[f.paraBirimi] = (o.diger[f.paraBirimi] || 0) + t; return; }
    if (d === "Gönderildi" || d === "Gecikti") { o.bekleyen += t; o.bekleyenSay++; }
    if (d === "Gecikti") { o.gec += t; o.gecSay++; o.enEski = Math.max(o.enEski, gunFark(f.vade, b)); }
    if (d !== "Taslak" && String(f.tarih).slice(0, 7) === ay) { o.buAy += t; o.buAySay++; }
  });
  var aylar = [];
  for (var i = 5; i >= 0; i--) { var d = new Date(b.slice(0, 7) + "-15T12:00:00Z"); d.setUTCMonth(d.getUTCMonth() - i); aylar.push({ k: d.toISOString().slice(0, 7), ad: d.toLocaleDateString("tr-TR", { month: "short", timeZone: "UTC" }), kes: 0, tah: 0 }); }
  S.faturalar.forEach(function (f) {
    if (f.durum === "Taslak" || !ayni(f)) return;
    var a = aylar.find(function (x) { return x.k === String(f.tarih).slice(0, 7); }); if (a) a.kes += Number(f.toplam || 0);
    if (f.durum === "Ödendi" && f.odemeTarihi) { var c = aylar.find(function (x) { return x.k === String(f.odemeTarihi).slice(0, 7); }); if (c) c.tah += Number(f.toplam || 0); }
  });
  o.aylar = aylar;
  return o;
}
function cizListe() {
  var o = ozetHesapla(), en = Math.max.apply(null, o.aylar.map(function (a) { return Math.max(a.kes, a.tah); }).concat([1]));
  var sayac = { tumu: S.faturalar.length, Taslak: 0, "Gönderildi": 0, Gecikti: 0, "Ödendi": 0 };
  S.faturalar.forEach(function (f) { sayac[durumOf(f)]++; });
  var cipler = [["tumu", "Tümü"], ["Taslak", "Taslak"], ["Gönderildi", "Gönderildi"], ["Gecikti", "Gecikti"], ["Ödendi", "Ödendi"]].map(function (c) {
    return '<button type="button" class="cip" data-suzgec="' + c[0] + '" aria-pressed="' + (S.suzgec === c[0]) + '">' + c[1] + " <em>" + sayac[c[0]] + "</em></button>";
  }).join("");
  $("#icerik").innerHTML =
    '<div class="sayfa-bas"><div><h1>Faturalar</h1><p>' + kacir(firma().unvan) + " için " + S.faturalar.length + " fatura</p></div>" +
    '<div class="eylem"><button type="button" class="dugme" data-csv>' + IK.indir + '<span>CSV</span></button><a class="dugme ana gizle-mobil" href="#/yeni">' + IK.arti + "Yeni fatura</a></div></div>" +
    '<section class="ozet" aria-label="Özet">' +
      '<div class="ozet-kart" style="--renk:var(--mavi)"><small><i></i>Tahsil edilecek</small><b>' + kisaPara(o.bekleyen) + "</b><span>" + o.bekleyenSay + " fatura ödeme bekliyor" + Object.keys(o.diger).map(function (k) { return ", ayrıca " + kisaPara(o.diger[k], k); }).join("") + "</span></div>" +
      '<div class="ozet-kart' + (o.gecSay ? " uyari" : "") + '" style="--renk:var(--muhur)"><small><i></i>Vadesi geçen</small><b>' + kisaPara(o.gec) + "</b><span>" + (o.gecSay ? o.gecSay + " fatura, en eskisi " + o.enEski + " gün" : "Geciken fatura yok") + "</span></div>" +
      '<div class="ozet-kart"><small><i></i>Bu ay kesilen</small><b>' + kisaPara(o.buAy) + "</b><span>" + o.buAySay + " fatura, " + kacir(vergiAdi()) + " dahil</span></div>" +
      '<div class="ozet-kart grafik"><small><i style="background:var(--cam)"></i>Son 6 ay</small><div class="grafik-ic">' +
        o.aylar.map(function (a) { return '<div class="ay" title="' + kacir(a.ad) + ": kesilen " + kisaPara(a.kes) + ", tahsil edilen " + kisaPara(a.tah) + '"><div class="cubuklar"><i style="height:' + Math.round(a.kes / en * 100) + '%"></i><i class="t" style="height:' + Math.round(a.tah / en * 100) + '%"></i></div><em>' + kacir(a.ad) + "</em></div>"; }).join("") +
      '</div><div class="lejant"><span>Kesilen</span><span class="t">Tahsil edilen</span></div></div>' +
    "</section>" +
    '<div class="suzgec"><div class="cipler" role="group" aria-label="Durum">' + cipler + '</div><label class="ara">' + IK.ara + '<input id="ara" type="search" placeholder="Fatura no, müşteri ya da kalem ara" aria-label="Fatura ara" value="' + kacir(S.ara) + '" /></label></div>' +
    '<div id="liste"></div>';
  cizSatirlar();
}
function suzulmus() {
  var a = S.ara.trim().toLocaleLowerCase("tr");
  return S.faturalar.filter(function (f) {
    if (S.suzgec !== "tumu" && durumOf(f) !== S.suzgec) return false;
    if (!a) return true;
    var m = (f.alici && f.alici.ad) || (musteri(f.musteriId) || {}).ad || "";
    return (f.no + " " + m + " " + (f.kalemler || []).map(function (k) { return k.aciklama; }).join(" ")).toLocaleLowerCase("tr").indexOf(a) >= 0;
  }).sort(function (x, y) { return x.tarih === y.tarih ? (x.no < y.no ? 1 : -1) : (x.tarih < y.tarih ? 1 : -1); });
}
function cizSatirlar() {
  var l = suzulmus(), kap = $("#liste");
  if (!kap) return;
  if (!l.length) { kap.innerHTML = '<div class="tablo-kap" style="display:block"><div class="bos"><b>Fatura bulunamadı</b>Süzgeci ya da aramayı değiştir, veya yeni bir fatura kes.</div></div>'; return; }
  var ad = function (f) { return (f.alici && f.alici.ad) || (musteri(f.musteriId) || {}).ad || "Müşteri yok"; };
  var hizli = function (f) {
    var d = durumOf(f);
    if (d === "Gönderildi" || d === "Gecikti") return '<button type="button" class="dugme kucuk" data-hizli-ode="' + kacir(f.id) + '">' + IK.odendi + "Ödendi</button>";
    if (d === "Taslak") return '<button type="button" class="dugme kucuk" data-hizli-gonder="' + kacir(f.id) + '">' + IK.gonder + "Gönderildi</button>";
    return "";
  };
  kap.innerHTML =
    '<div class="tablo-kap"><table><thead><tr><th>Fatura</th><th>Müşteri</th><th>Düzenleme</th><th>Vade</th><th class="sag">Tutar</th><th>Durum</th><th class="sag"><span class="gizli-yazi" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">İşlem</span></th></tr></thead><tbody>' +
    l.map(function (f) {
      return '<tr data-ac="' + kacir(f.id) + '"><td><span class="no">' + kacir(f.no) + '</span><span class="alt">' + (f.kalemler || []).length + " kalem</span></td><td><b>" + kacir(ad(f)) + '</b><span class="alt">' + kacir((f.alici && f.alici.yetkili) || "") + "</span></td><td>" + kacir(tarihKisa(f.tarih)) + "</td><td>" + vadeHTML(f) + '</td><td class="sag"><span class="tutar">' + para(f.toplam, f.paraBirimi) + "</span></td><td>" + durumHTML(durumOf(f)) + '</td><td><div class="satir-eylem">' + hizli(f) + '<button type="button" class="dugme kucuk ikon" data-yazdir="' + kacir(f.id) + '" aria-label="Yazdır" title="Yazdır">' + IK.yazdir + "</button></div></td></tr>";
    }).join("") + "</tbody></table></div>" +
    '<div class="kartlar">' + l.map(function (f) {
      return '<button type="button" class="fkart" data-ac="' + kacir(f.id) + '"><span class="m">' + kacir(ad(f)) + '</span><span class="tutar">' + para(f.toplam, f.paraBirimi) + '</span><span class="no">' + kacir(f.no) + " · " + kacir(tarihKisa(f.tarih)) + '</span><span class="sag-alt">' + durumHTML(durumOf(f)) + "</span>" + vadeHTML(f) + "</button>";
    }).join("") + "</div>";
}

/* ── Fatura düzenleyici ── */
function bosKalem() { return { aciklama: "", miktar: 1, birim: "adet", fiyat: 0, iskonto: 0, kdv: varsayilanOran() }; }
function edAc() {
  var r = S.rota;
  if (r.id) {
    var f = S.faturalar.find(function (x) { return x.id === r.id; });
    if (!f) { bildir("Fatura bulunamadı.", "hata"); yoksay = false; location.hash = "#/faturalar"; return; }
    if (!S.taslak || S.taslak.id !== f.id || !S.kirli) { S.taslak = kopya(f); S.kirli = false; }
  } else if (!S.taslak || S.taslak.id || !S.kirli) {
    var b = bugun(), mid = r.q.musteri && musteri(r.q.musteri) ? r.q.musteri : "";
    S.taslak = { id: null, no: sonrakiNo(), paraBirimi: varsayilanPB(), musteriId: mid, tarih: b, vade: gunEkle(b, Number(firma().vade || 30)), durum: "Taslak", kalemler: [bosKalem()], not: firma().not || "", odemeTarihi: "" };
    if (r.q.kaynak) { var k = S.faturalar.find(function (x) { return x.id === r.q.kaynak; }); if (k) { S.taslak.musteriId = k.musteriId; S.taslak.kalemler = kopya(k.kalemler); S.taslak.not = k.not; S.taslak.paraBirimi = k.paraBirimi || varsayilanPB(); S.kirli = true; } }
    else S.kirli = false;
  }
  cizEditor();
  if (r.q.yazdir) setTimeout(function () { window.print(); }, 500);
}
function cizEditor() {
  var f = S.taslak, d = durumOf(f), yeni = !f.id;
  var mOpt = '<option value="">Müşteri seç</option>' + S.musteriler.slice().sort(function (a, b) { return a.ad.localeCompare(b.ad, "tr"); }).map(function (m) { return '<option value="' + kacir(m.id) + '"' + (m.id === f.musteriId ? " selected" : "") + ">" + kacir(m.ad) + "</option>"; }).join("") + '<option value="__yeni">Yeni müşteri ekle</option>';
  var h = hizmetler();
  var eylem = "";
  if (!yeni) {
    if (d === "Taslak") eylem += '<button type="button" class="dugme" data-durum="Gönderildi">' + IK.gonder + "Gönderildi</button>";
    if (d === "Gönderildi" || d === "Gecikti") eylem += '<button type="button" class="dugme" data-odeme>' + IK.odendi + "Ödendi olarak işaretle</button>";
    if (d === "Ödendi") eylem += '<button type="button" class="dugme" data-durum="Gönderildi">' + IK.geriAl + "Ödemeyi geri al</button>";
    if (d === "Gönderildi" || d === "Gecikti") eylem += '<button type="button" class="dugme ikon" data-durum="Taslak" aria-label="Taslağa geri al" title="Taslağa geri al">' + IK.geriAl + "</button>";
    eylem += '<button type="button" class="dugme ikon" data-kopyala aria-label="Kopyasını oluştur" title="Kopyasını oluştur">' + IK.kopya + "</button>";
    eylem += '<button type="button" class="dugme ikon tehlike" data-sil aria-label="Faturayı sil" title="Faturayı sil">' + IK.cop + "</button>";
  }
  eylem += '<button type="button" class="dugme" data-yazdir-simdi>' + IK.yazdir + "Yazdır</button>";
  eylem += '<button type="button" class="dugme ana kaydet-ust" data-kaydet>Kaydet</button>';
  var vadeGun = gunFark(f.tarih, f.vade);
  $("#icerik").innerHTML =
    '<div class="ed-ust"><a class="geri" href="#/faturalar">' + IK.geri + 'Faturalar</a><div class="ed-baslik"><h1 id="edNo">' + kacir(yeni ? "Yeni fatura" : f.no) + "</h1>" + durumHTML(d) + '<span class="kirli-yazi" id="kirli"' + (S.kirli ? "" : " hidden") + ">Kaydedilmedi</span></div><div class=\"ed-eylem\">" + eylem + "</div></div>" +
    '<div class="ed-sekme" role="group" aria-label="Görünüm"><button type="button" data-gorunum="duzenle" aria-pressed="' + (S.gorunum === "duzenle") + '">Düzenle</button><button type="button" data-gorunum="onizleme" aria-pressed="' + (S.gorunum === "onizleme") + '">Önizleme</button></div>' +
    '<div class="ed-govde" data-gorunum="' + S.gorunum + '">' +
      '<form class="ed-form" id="edForm" novalidate>' +
        '<section class="blok"><h2>Alıcı</h2><div class="alici-satir"><select id="musteriSec" data-alan="musteriId" aria-label="Müşteri">' + mOpt + '</select></div><div id="aliciBilgi"></div></section>' +
        '<section class="blok"><h2>Fatura bilgileri</h2><div class="alanlar">' +
          '<label class="alan"><span>Fatura numarası</span><input data-alan="no" value="' + kacir(f.no) + '" autocomplete="off" /></label>' +
          '<label class="alan"><span>Para birimi</span><select data-alan="paraBirimi">' + pbSecenek(f.paraBirimi || varsayilanPB()) + "</select></label>" +
          '<label class="alan"><span>Düzenleme tarihi</span><input type="date" data-alan="tarih" value="' + kacir(f.tarih) + '" /></label>' +
          '<label class="alan"><span>Son ödeme tarihi</span><input type="date" data-alan="vade" value="' + kacir(f.vade) + '" /></label>' +
        '</div><div class="vade-cip" role="group" aria-label="Vade">' + [[0, "Peşin"], [7, "7 gün"], [15, "15 gün"], [30, "30 gün"], [60, "60 gün"]].map(function (v) { return '<button type="button" data-vade-gun="' + v[0] + '" aria-pressed="' + (vadeGun === v[0]) + '">' + v[1] + "</button>"; }).join("") + "</div></section>" +
        '<section class="blok"><h2>Kalemler <span class="ek" id="kalemSay"></span></h2><div class="kalemler" id="kalemler"></div><button type="button" class="kalem-ekle" data-kalem-ekle>' + IK.arti + 'Kalem ekle</button><div class="toplam-ozet" id="toplamOzet"></div>' +
          '<datalist id="hizmetListe">' + Object.keys(h).map(function (a) { return '<option value="' + kacir(a) + '"></option>'; }).join("") + "</datalist></section>" +
        '<section class="blok"><h2>Not</h2><label class="alan"><span class="gizli" hidden>Fatura notu</span><textarea data-alan="not" rows="3" placeholder="Ödeme koşulları, teşekkür notu">' + kacir(f.not || "") + '</textarea></label><p class="ipucu" style="margin:8px 0 0">Banka ve IBAN bilgisi firma bilgilerinden gelir.</p></section>' +
        '<p class="hata-yazi" id="edHata" hidden></p>' +
      "</form>" +
      '<div class="ed-onizleme"><div class="onizleme-bas"><span>A4 önizleme</span><span id="sayfaYazi"></span></div><div class="kagit-kap" id="kagitKap"><div class="kagit-olcek" id="kagitOlcek"></div></div></div>' +
    "</div>" +
    '<div class="ed-alt"><div><small>Ödenecek tutar</small><b id="altToplam"></b></div><button type="button" class="dugme ana" data-kaydet>Kaydet</button></div>';
  cizKalemler(); cizAlici(); guncelle();
}
function pbSecenek(secili) {
  var l = PARA_BIRIMLERI.slice(); if (secili && !l.some(function (x) { return x.kod === secili; })) l.push(pb(secili));
  return l.map(function (x) { return '<option value="' + kacir(x.kod) + '"' + (x.kod === secili ? " selected" : "") + ">" + kacir(x.kod + ", " + x.ad) + "</option>"; }).join("");
}
function cizAlici() {
  var m = musteri(S.taslak.musteriId), k = $("#aliciBilgi");
  if (!k) return;
  k.innerHTML = m ? '<div class="alici-bilgi"><b>' + kacir(m.ad) + "</b><br>" + kacir(m.adres || "") + "<br>" + (m.vergiDairesi ? kacir(m.vergiDairesi) + " Vergi Dairesi, " : "") + (m.vergiNo ? "Vergi no " + kacir(m.vergiNo) : "") + (m.yetkili ? "<br>Yetkili: " + kacir(m.yetkili) : "") + "</div>" : '<p class="ipucu" style="margin:8px 0 0">Listeden bir müşteri seç ya da yeni müşteri ekle.</p>';
}
function cizKalemler() {
  var k = $("#kalemler"); if (!k) return;
  var oranlar = vergiOranlari(), kod = S.taslak.paraBirimi || varsayilanPB();
  k.innerHTML = S.taslak.kalemler.map(function (x, i) {
    var ol = oranlar.indexOf(sayi(x.kdv)) < 0 ? oranlar.concat([sayi(x.kdv)]).sort(function (a, b) { return a - b; }) : oranlar;
    return '<div class="kalem" data-i="' + i + '"><div class="kalem-ust"><span class="sira">' + (i + 1) + '</span><input data-k="aciklama" list="hizmetListe" value="' + kacir(x.aciklama) + '" placeholder="Ürün ya da hizmet adı" aria-label="' + (i + 1) + '. kalem açıklaması" /><button type="button" class="kalem-sil" data-kalem-sil="' + i + '" aria-label="' + (i + 1) + '. kalemi sil">' + IK.cop + "</button></div>" +
      '<div class="kalem-alt">' +
        '<label>Miktar<input data-k="miktar" inputmode="decimal" value="' + kacir(giris(x.miktar)) + '" /></label>' +
        '<label>Birim<select data-k="birim">' + BIRIMLER.concat(BIRIMLER.indexOf(x.birim) < 0 && x.birim ? [x.birim] : []).map(function (b) { return "<option" + (b === x.birim ? " selected" : "") + ">" + kacir(b) + "</option>"; }).join("") + "</select></label>" +
        '<label>Birim fiyat, ' + kacir(kod) + '<input data-k="fiyat" inputmode="decimal" value="' + kacir(giris(x.fiyat)) + '" placeholder="0,00" /></label>' +
        '<label>İskonto, yüzde<input data-k="iskonto" inputmode="decimal" value="' + kacir(x.iskonto ? giris(x.iskonto) : "") + '" placeholder="0" /></label>' +
        '<label>' + kacir(vergiAdi()) + '<select data-k="kdv">' + ol.map(function (o) { return '<option value="' + o + '"' + (sayi(x.kdv) === o ? " selected" : "") + ">Yüzde " + giris(o) + "</option>"; }).join("") + "</select></label>" +
        '<div class="k-tutar"><small>Tutar</small><b data-tutar></b></div>' +
      "</div></div>";
  }).join("");
  $("#kalemSay").textContent = S.taslak.kalemler.length + " kalem";
}
function guncelle() {
  var f = S.taslak, t = hesapla(f.kalemler), kod = f.paraBirimi || varsayilanPB();
  $$("#kalemler .kalem").forEach(function (el, i) { var s = t.satirlar[i]; if (s) el.querySelector("[data-tutar]").textContent = para(s.net, kod); });
  var oz = '<div><span>Ara toplam</span><span>' + para(t.ara, kod) + "</span></div>" + (t.iskonto ? "<div><span>İskonto</span><span>eksi " + para(t.iskonto, kod) + "</span></div>" : "") +
    t.kdvler.map(function (k) { return "<div><span>" + kacir(vergiAdi()) + ", " + oranYaz(k.oran) + "</span><span>" + para(k.tutar, kod) + "</span></div>"; }).join("") +
    '<div class="genel"><span>Ödenecek tutar</span><span>' + para(t.genel, kod) + "</span></div>";
  $("#toplamOzet").innerHTML = oz;
  $("#altToplam").textContent = para(t.genel, kod);
  $("#kagitOlcek").innerHTML = kagitHTML(f, t);
  $("#kirli").hidden = !S.kirli;
  olcekle();
}
function kagitHTML(f, t) {
  var fi = firma(), a = (S.kirli || !f.alici ? aliciOf(musteri(f.musteriId)) : f.alici) || aliciOf(musteri(f.musteriId)), d = durumOf(f), kod = f.paraBirimi || varsayilanPB(), va = kacir(vergiAdi()), ve = kacir(vergiNoEtiketi());
  var satir = f.kalemler.map(function (k, i) {
    var s = t.satirlar[i];
    return "<tr><td>" + (i + 1) + "</td><td><b>" + kacir(k.aciklama || "Adsız kalem") + "</b></td><td class=\"r\">" + kacir(giris(sayi(k.miktar))) + " " + kacir(k.birim) + '</td><td class="r">' + para(sayi(k.fiyat), kod) + '</td><td class="r">' + (sayi(k.iskonto) ? oranYaz(sayi(k.iskonto)) : "Yok") + '</td><td class="r">' + oranYaz(sayi(k.kdv)) + '</td><td class="r"><b>' + para(s.net, kod) + "</b></td></tr>";
  }).join("");
  /* Satıcıda firmanın etiketi (VKN, VAT ID...), alıcıda ülkeden bağımsız "Vergi no" yazılır. */
  var vergiSatir = function (vd, no, et) { return (vd ? kacir(vd) + " Vergi Dairesi" + (no ? ", " : "") : "") + (no ? (et || ve) + " " + kacir(no) : ""); };
  var hesap = fi.iban ? (ibanMi(fi.iban) ? "IBAN " : "Hesap ") + "<b>" + kacir(ibanYaz(fi.iban)) + "</b><br>" : "";
  return '<div class="kagit" id="kagit">' +
    (d === "Taslak" ? '<div class="filigran" aria-hidden="true">Taslak</div>' : "") +
    (d === "Ödendi" ? '<div class="muhur"><b>Ödendi</b><span>' + kacir(tarihUzun(f.odemeTarihi)) + "</span></div>" : "") +
    '<div class="k-ust"><div class="k-firma">' + LOGO + "<div><b>" + kacir(fi.unvan) + "</b><p>" + kacir(fi.adres) + "</p><p>" + vergiSatir(fi.vergiDairesi, fi.vergiNo) + "</p><p>" + kacir(fi.telefon) + " · " + kacir(fi.eposta) + "</p></div></div>" +
      '<div class="k-baslik"><h2>Fatura</h2><div class="k-meta"><span>Fatura no</span><b>' + kacir(f.no) + "</b><span>Düzenleme</span><b>" + kacir(tarihUzun(f.tarih)) + "</b><span>Son ödeme</span><b>" + kacir(tarihUzun(f.vade)) + "</b></div></div></div>" +
    '<div class="k-alici"><div><small>Sayın</small>' + (a ? "<b>" + kacir(a.ad) + "</b><p>" + kacir(a.adres) + "</p><p>" + vergiSatir(a.vergiDairesi, a.vergiNo, "Vergi no") + "</p>" : "<b>Alıcı seçilmedi</b>") + "</div>" +
      "<div><small>İlgili kişi</small>" + (a ? "<b>" + kacir(a.yetkili || "Belirtilmedi") + "</b><p>" + kacir(a.eposta || "") + "</p>" : "") + "</div></div>" +
    '<table class="k-tablo"><thead><tr><th>#</th><th>Mal ya da hizmet</th><th class="r">Miktar</th><th class="r">Birim fiyat</th><th class="r">İskonto</th><th class="r">' + va + '</th><th class="r">Tutar</th></tr></thead><tbody>' + satir + "</tbody></table>" +
    '<div class="k-alt"><div class="k-yazi">' + kacir(tutarYazi(t.genel, kod)) + "</div><div class=\"k-toplam\"><div><span>Ara toplam</span><b>" + para(t.ara, kod) + "</b></div>" +
      (t.iskonto ? "<div><span>İskonto</span><b>eksi " + para(t.iskonto, kod) + "</b></div><div><span>Mal ve hizmet toplamı</span><b>" + para(t.matrah, kod) + "</b></div>" : "") +
      t.kdvler.map(function (k) { return "<div><span>" + va + ", " + oranYaz(k.oran) + " (matrah " + para(k.matrah, kod) + ")</span><b>" + para(k.tutar, kod) + "</b></div>"; }).join("") +
      '<div class="genel"><span>Ödenecek tutar, ' + kacir(kod) + "</span><b>" + para(t.genel, kod) + "</b></div></div></div>" +
    '<div class="k-dip"><div><small>Ödeme bilgileri</small>' + kacir(fi.banka) + "<br>" + hesap + "Alıcı: " + kacir(fi.unvan) + "<br>Açıklama: <b>" + kacir(f.no) + "</b></div><div><small>Not</small>" + kacir(f.not || "") + "</div></div>" +
    '<div class="k-cizgi"></div></div>';
}
function olcekle() {
  var kap = $("#kagitKap"), o = $("#kagitOlcek"), k = $("#kagit");
  if (!kap || !o || !k || !kap.clientWidth) return;
  var s = kap.clientWidth / 794;
  o.style.transform = "scale(" + s + ")";
  kap.style.height = Math.ceil(k.offsetHeight * s) + "px";
  var sy = Math.ceil(k.offsetHeight / 1123);
  $("#sayfaYazi").textContent = sy > 1 ? sy + " sayfa" : "1 sayfa";
}
if (window.ResizeObserver) new ResizeObserver(function () { olcekle(); }).observe(document.body); else window.addEventListener("resize", olcekle);

function kirlet() { S.kirli = true; }
function edGiris(e) {
  var el = e.target, f = S.taslak; if (!f) return;
  if (el.dataset.alan) {
    var al = el.dataset.alan;
    if (al === "musteriId") {
      if (el.value === "__yeni") { el.value = f.musteriId || ""; musteriPenceresi(null).then(function (m) { if (m) { f.musteriId = m.id; kirlet(); cizEditor(); } }); return; }
      f.musteriId = el.value; cizAlici();
    } else if (al === "tarih") {
      var gun = gunFark(f.tarih, f.vade); f.tarih = el.value || bugun();
      if (isFinite(gun)) { f.vade = gunEkle(f.tarih, Math.max(0, gun)); $('[data-alan="vade"]').value = f.vade; }
    } else f[al] = el.value;
    if (al === "paraBirimi") cizKalemler();
    if (al === "vade" || al === "tarih") { var g = gunFark(f.tarih, f.vade); $$("[data-vade-gun]").forEach(function (b) { b.setAttribute("aria-pressed", String(Number(b.dataset.vadeGun) === g)); }); }
    kirlet(); guncelle(); return;
  }
  var kalem = el.closest(".kalem");
  if (kalem && el.dataset.k) {
    var i = Number(kalem.dataset.i), k = f.kalemler[i], ad = el.dataset.k;
    if (ad === "aciklama") {
      k.aciklama = el.value;
      var bilinen = hizmetler()[el.value];
      if (bilinen && e.type === "input" && !sayi(k.fiyat)) {
        k.fiyat = sayi(bilinen.fiyat); k.birim = bilinen.birim; k.kdv = sayi(bilinen.kdv);
        kalem.querySelector('[data-k="fiyat"]').value = giris(k.fiyat); kalem.querySelector('[data-k="birim"]').value = k.birim; kalem.querySelector('[data-k="kdv"]').value = String(k.kdv);
      }
    } else if (ad === "birim") k.birim = el.value;
    else if (ad === "kdv") k.kdv = Number(el.value);
    else k[ad] = el.value === "" ? 0 : sayi(el.value);
    kirlet(); guncelle();
  }
}
function dogrula() {
  var f = S.taslak, h = "";
  if (!f.musteriId || !musteri(f.musteriId)) h = "Bir müşteri seç.";
  else if (!String(f.no || "").trim()) h = "Fatura numarası boş olamaz.";
  else if (String(f.no).trim().length > 40) h = "Fatura numarası en fazla 40 karakter olabilir.";
  else if (S.faturalar.some(function (x) { return x.no === String(f.no).trim() && x.id !== f.id; })) h = "Bu fatura numarası zaten kullanılıyor.";
  else if (!f.tarih || !f.vade) h = "Tarihleri doldur.";
  else if (f.vade < f.tarih) h = "Son ödeme tarihi düzenleme tarihinden önce olamaz.";
  else if (!f.kalemler.length) h = "En az bir kalem ekle.";
  else if (f.kalemler.some(function (k) { return !String(k.aciklama || "").trim(); })) h = "Her kalemin bir açıklaması olmalı.";
  else if (f.kalemler.some(function (k) { return sayi(k.miktar) <= 0; })) h = "Miktar sıfırdan büyük olmalı.";
  else if (f.kalemler.some(function (k) { return sayi(k.fiyat) < 0; })) h = "Birim fiyat eksi olamaz.";
  else if (hesapla(f.kalemler).genel <= 0) h = "Fatura tutarı sıfırdan büyük olmalı.";
  var e = $("#edHata"); if (e) { e.textContent = h; e.hidden = !h; }
  return h;
}
function kaydet(ek) {
  if (S.mesgul) return Promise.resolve(false);
  var f = S.taslak, h = dogrula();
  if (h) { bildir(h, "hata"); if (S.gorunum !== "duzenle") { S.gorunum = "duzenle"; cizEditor(); dogrula(); } return Promise.resolve(false); }
  var t = hesapla(f.kalemler);
  var veri = Object.assign({ no: String(f.no).trim(), paraBirimi: f.paraBirimi || varsayilanPB(), musteriId: f.musteriId, alici: aliciOf(musteri(f.musteriId)), tarih: f.tarih, vade: f.vade, durum: f.durum, kalemler: f.kalemler.map(function (k) { return { aciklama: String(k.aciklama).trim(), miktar: sayi(k.miktar), birim: k.birim, fiyat: sayi(k.fiyat), iskonto: sayi(k.iskonto), kdv: sayi(k.kdv) }; }), not: f.not || "", odemeTarihi: f.odemeTarihi || "", toplam: t.genel }, ek || {});
  S.mesgul = true; $$("[data-kaydet]").forEach(function (b) { b.disabled = true; });
  var is = f.id ? Depo.guncelle("faturalar", f.id, veri) : Depo.ekle("faturalar", veri);
  return is.then(function (r) {
    r = r || Object.assign({ id: f.id }, veri);
    var i = S.faturalar.findIndex(function (x) { return x.id === r.id; });
    if (i >= 0) S.faturalar[i] = r; else S.faturalar.push(r);
    var yeni = !f.id;
    S.taslak = kopya(r); S.kirli = false;
    olay("fatura_kaydedildi", { durum: r.durum });
    if (yeni) { yoksay = true; location.hash = "#/fatura/" + encodeURIComponent(r.id); S.rota = rotaCoz(); eskiHash = location.hash; }
    cizEditor();
    return true;
  }).catch(function (e) { bildir(e.message || "Kaydedilemedi.", "hata"); return false; }).then(function (x) { S.mesgul = false; $$("[data-kaydet]").forEach(function (b) { b.disabled = false; }); return x; });
}
function durumYaz(f, ek) {
  var i = S.faturalar.findIndex(function (x) { return x.id === f.id; });
  return Depo.guncelle("faturalar", f.id, ek).then(function (r) { if (i >= 0) S.faturalar[i] = r || Object.assign({}, S.faturalar[i], ek); return S.faturalar[i]; });
}
function odemePenceresi(f) {
  return pencereAc('<h2>Ödeme alındı</h2><p>' + kacir(f.no) + " · " + para(f.toplam, f.paraBirimi) + '</p><label class="alan"><span>Ödeme tarihi</span><input type="date" id="odemeTarih" value="' + bugun() + '" max="' + bugun() + '" /></label><div class="alt-dugmeler"><button type="button" class="dugme" data-kapat>Vazgeç</button><button type="button" class="dugme ana" data-tamam>' + IK.odendi + "Ödendi olarak işaretle</button></div>", function (p) {
    return { odemeTarihi: $("#odemeTarih", p).value || bugun() };
  });
}

/* ── Müşteriler ── */
/* Müşteri tutarları müşterinin en çok kullanılan para biriminde gösterilir (kur çevrimi yapılmaz). */
function musteriOzet(m) {
  var hepsi = S.faturalar.filter(function (f) { return f.musteriId === m.id; }), say = {}, kod = varsayilanPB(), en = 0;
  hepsi.forEach(function (f) { var k = f.paraBirimi || varsayilanPB(); say[k] = (say[k] || 0) + 1; if (say[k] > en) { en = say[k]; kod = k; } });
  var top = 0, acik = 0, gec = 0;
  hepsi.forEach(function (f) { if (f.durum === "Taslak" || (f.paraBirimi || varsayilanPB()) !== kod) return; var t = Number(f.toplam || 0), d = durumOf(f); top += t; if (d === "Gönderildi" || d === "Gecikti") acik += t; if (d === "Gecikti") gec += t; });
  return { say: hepsi.length, top: top, acik: acik, gec: gec, kod: kod };
}
function cizMusteriler() {
  var l = S.musteriler.slice().sort(function (a, b) { return musteriOzet(b).acik - musteriOzet(a).acik || a.ad.localeCompare(b.ad, "tr"); });
  $("#icerik").innerHTML = '<div class="sayfa-bas"><div><h1>Müşteriler</h1><p>' + l.length + ' müşteri, açık bakiyeye göre sıralı</p></div><div class="eylem"><button type="button" class="dugme ana" data-musteri-yeni>' + IK.arti + "Müşteri ekle</button></div></div>" +
    '<div class="musteri-izgara">' + l.map(function (m) {
      var o = musteriOzet(m);
      return '<article class="musteri"><div><h3>' + kacir(m.ad) + "</h3><p>" + kacir(m.yetkili || "") + (m.vergiNo ? " · Vergi no " + kacir(m.vergiNo) : "") + "</p></div>" +
        '<div class="rakam"><div><small>Fatura</small><b>' + o.say + "</b></div><div><small>Toplam</small><b>" + kisaPara(o.top, o.kod) + '</b></div><div><small>Açık bakiye</small><b class="' + (o.gec ? "gec" : "") + '">' + kisaPara(o.acik, o.kod) + "</b></div></div>" +
        '<div class="iletisim">' + kacir(m.eposta || "") + (m.telefon ? " · " + kacir(m.telefon) : "") + "</div>" +
        '<div class="alt-satir"><a class="dugme kucuk ana" href="#/yeni?musteri=' + encodeURIComponent(m.id) + '">' + IK.arti + 'Fatura kes</a><button type="button" class="dugme kucuk" data-musteri-duzenle="' + kacir(m.id) + '">' + IK.duzenle + "Düzenle</button>" + (m.eposta ? '<a class="dugme kucuk ikon" href="mailto:' + kacir(m.eposta) + '" aria-label="E-posta gönder" title="E-posta gönder">' + IK.posta + "</a>" : "") + "</div></article>";
    }).join("") + "</div>";
}
function musteriPenceresi(m) {
  var x = m || {};
  var al = function (ad, et, tip, tam, ek) { return '<label class="alan' + (tam ? " tam" : "") + '"><span>' + et + "</span>" + (tip === "textarea" ? '<textarea name="' + ad + '" rows="2">' + kacir(x[ad] || "") + "</textarea>" : '<input name="' + ad + '" type="' + (tip || "text") + '" value="' + kacir(x[ad] || "") + '"' + (ek || "") + " />") + "</label>"; };
  return pencereAc("<h2>" + (m ? "Müşteriyi düzenle" : "Yeni müşteri") + "</h2><p>Faturada alıcı olarak görünecek bilgiler.</p>" +
    '<form id="mForm" class="alanlar" novalidate>' + al("ad", "Unvan ya da ad soyad", "text", true, ' required autocomplete="organization"') + al("yetkili", "Yetkili kişi") + al("telefon", "Telefon", "tel") + al("vergiDairesi", "Vergi dairesi") + al("vergiNo", "Vergi numarası", "text", false, ' maxlength="30" autocomplete="off"') + al("eposta", "E-posta", "email", true) + al("adres", "Adres", "textarea", true) + '<p class="hata-yazi tam" id="mHata" hidden style="grid-column:1/-1;margin:0"></p></form>' +
    '<div class="alt-dugmeler">' + (m && !musteriOzet(m).say ? '<button type="button" class="dugme tehlike" data-musteri-sil style="margin-right:auto">' + IK.cop + "Sil</button>" : "") + '<button type="button" class="dugme" data-kapat>Vazgeç</button><button type="button" class="dugme ana" data-tamam>' + (m ? "Kaydet" : "Müşteriyi ekle") + "</button></div>", function (p) {
      var v = {}; $$("#mForm [name]", p).forEach(function (i) { v[i.name] = i.value.trim(); });
      var h = !v.ad ? "Unvan ya da ad soyad gerekli." : v.vergiNo && !/^[A-Za-z0-9 .\/-]{4,30}$/.test(v.vergiNo) ? "Vergi numarası 4 ile 30 karakter arasında harf ve rakamdan oluşmalı." : v.eposta && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.eposta) ? "E-posta adresini kontrol et." : "";
      if (h) { var e = $("#mHata", p); e.textContent = h; e.hidden = false; return null; }
      return (m ? Depo.guncelle("musteriler", m.id, v) : Depo.ekle("musteriler", v)).then(function (r) {
        r = r || Object.assign({}, m, v);
        var i = S.musteriler.findIndex(function (y) { return y.id === r.id; });
        if (i >= 0) S.musteriler[i] = r; else S.musteriler.push(r);
        bildir(m ? "Müşteri güncellendi." : "Müşteri eklendi.");
        return r;
      });
    }, function (p, kapat) {
      var s = $("[data-musteri-sil]", p);
      if (s) s.addEventListener("click", function () { Depo.sil("musteriler", m.id).then(function () { S.musteriler = S.musteriler.filter(function (y) { return y.id !== m.id; }); kapat("silindi"); bildir("Müşteri silindi."); }).catch(function (e) { bildir(e.message, "hata"); }); });
    });
}

/* ── Firma ── */
function cizFirma() {
  var f = firma();
  var al = function (ad, et, tip, tam, ek) { return '<label class="alan' + (tam ? " tam" : "") + '"><span>' + et + "</span>" + (tip === "textarea" ? '<textarea name="' + ad + '" rows="3">' + kacir(f[ad] || "") + "</textarea>" : '<input name="' + ad + '" type="' + (tip || "text") + '" value="' + kacir(ad === "iban" ? ibanYaz(f[ad]) : f[ad] == null ? "" : f[ad]) + '"' + (ek || "") + " />") + "</label>"; };
  $("#icerik").innerHTML = '<div class="sayfa-bas"><div><h1>Firma bilgileri</h1><p>Faturanın üst ve alt kısmında görünen satıcı bilgileri</p></div></div>' +
    '<div class="firma-duzen"><form class="ed-form" id="firmaForm" novalidate>' +
      '<section class="blok"><h2>Firma</h2><div class="alanlar">' + al("unvan", "Ticari unvan", "text", true) + al("adres", "Adres", "textarea", true) + al("vergiDairesi", "Vergi dairesi") + al("vergiNo", "Vergi numarası", "text", false, ' maxlength="30" autocomplete="off"') + al("telefon", "Telefon", "tel") + al("eposta", "E-posta", "email") + al("web", "Web adresi", "text", true) + "</div></section>" +
      '<section class="blok"><h2>Para birimi ve vergi</h2><div class="alanlar">' +
        '<label class="alan"><span>Varsayılan para birimi</span><select name="paraBirimi">' + pbSecenek(varsayilanPB()) + "</select></label>" +
        al("vergiAdi", "Vergi adı", "text", false, ' list="vergiAdlari" maxlength="20"') +
        '<label class="alan"><span>Vergi oranları, yüzde</span><input name="vergiOranlari" value="' + kacir(vergiOranlari().map(giris).join("; ")) + '" inputmode="decimal" placeholder="0; 10; 20" /></label>' +
        '<label class="alan"><span>Yeni kalemde oran</span><select name="varsayilanOran">' + vergiOranlari().map(function (o) { return '<option value="' + o + '"' + (o === varsayilanOran() ? " selected" : "") + ">Yüzde " + giris(o) + "</option>"; }).join("") + "</select></label>" +
        al("vergiNoEtiketi", "Vergi numarası etiketi", "text", false, ' list="vergiNoEtiketleri" maxlength="16"') +
        '</div><datalist id="vergiAdlari">' + VERGI_ADLARI.map(function (x) { return '<option value="' + kacir(x) + '"></option>'; }).join("") + '</datalist><datalist id="vergiNoEtiketleri">' + ["VKN", "VAT ID", "EIN", "ABN", "GSTIN", "USt-IdNr.", "SIRET", "NIF", "RFC", "TIN"].map(function (x) { return '<option value="' + kacir(x) + '"></option>'; }).join("") + '</datalist><p class="ipucu" style="margin:10px 0 0">Her faturada para birimi ayrıca seçilebilir. Örneğin Türkiye için KDV ve 0, 1, 10, 20; Birleşik Krallık için VAT ve 0, 5, 20; ABD için Sales tax ve eyalet oranın.</p></section>' +
      '<section class="blok"><h2>Ödeme</h2><div class="alanlar">' + al("banka", "Banka ve şube", "text", true) + al("iban", "IBAN ya da hesap numarası", "text", true, ' autocomplete="off" spellcheck="false"') + "</div></section>" +
      '<section class="blok"><h2>Fatura ayarları</h2><div class="alanlar">' + al("seri", "Fatura serisi, 1 ile 6 harf", "text", false, ' maxlength="6" style="text-transform:uppercase"') + al("vade", "Varsayılan vade, gün", "number", false, ' min="0" max="365"') + al("not", "Varsayılan fatura notu", "textarea", true) + '</div><p class="ipucu" style="margin:10px 0 0">Sıradaki fatura numarası: <b id="siradakiNo">' + kacir(sonrakiNo()) + "</b></p></section>" +
      '<p class="hata-yazi" id="fHata" hidden></p><div><button type="submit" class="dugme ana">Bilgileri kaydet</button></div>' +
    "</form>" +
    '<aside class="bilgi-kutu"><b>Resmî fatura hakkında</b><p>Bu uygulama fatura taslağı, proforma ve müşteriye gönderilecek fatura görüntüsü hazırlar, tahsilatı takip eder.</p><p>Bazı ülkelerde faturanın devletin elektronik sisteminde düzenlenmesi zorunludur: Türkiye’de e-Fatura ve e-Arşiv, İtalya’da SdI, Meksika’da CFDI gibi. Bu durumda resmî belgeyi o sistemden ya da bir entegratörden düzenle. Buradaki numara serisini oradaki seriyle aynı tutarsan kayıtların kolayca eşleşir.</p><p>Vergi oranları ve para birimi ülkene göre yukarıdan ayarlanır; tutarlar arasında kur çevrimi yapılmaz.</p></aside></div>';
}
function firmaKaydet(form) {
  var v = {}; $$("[name]", form).forEach(function (i) { v[i.name] = i.value.trim(); });
  if (ibanMi(v.iban)) v.iban = v.iban.replace(/\s/g, "").toUpperCase();
  v.seri = v.seri.toLocaleUpperCase("tr"); v.vade = Math.max(0, Math.min(365, Number(v.vade) || 0));
  var ham = oranCoz(v.vergiOranlari), oranlar = ham.map(sayi);
  var oranHata = !ham.length || ham.some(function (x) { return !/^\d+([.,]\d+)?$/.test(x.trim()); }) || oranlar.some(function (x) { return x < 0 || x > 100; });
  oranlar = oranlar.filter(function (x, i) { return oranlar.indexOf(x) === i; }).sort(function (a, b) { return a - b; });
  v.vergiOranlari = oranlar;
  v.varsayilanOran = oranlar.indexOf(sayi(v.varsayilanOran)) >= 0 ? sayi(v.varsayilanOran) : oranlar[oranlar.length - 1];
  v.vergiAdi = v.vergiAdi || "Vergi";
  var bosIban = v.iban.replace(/\s/g, "");
  var h = !v.unvan ? "Ticari unvan gerekli." : bosIban && /^[A-Z]{2}\d{2}/i.test(bosIban) && !ibanMi(bosIban) ? "IBAN 15 ile 34 karakter arasında olmalı; ülke kodu ve iki kontrol rakamıyla başlar." : !/^[A-ZÇĞİÖŞÜ0-9]{1,6}$/.test(v.seri) ? "Seri 1 ile 6 harf ya da rakam olmalı." : v.vergiNo && !/^[A-Za-z0-9 .\/-]{4,30}$/.test(v.vergiNo) ? "Vergi numarası 4 ile 30 karakter arasında harf ve rakamdan oluşmalı." : oranHata ? "Vergi oranlarını 0 ile 100 arasında, noktalı virgülle ayırarak yaz." : "";
  var e = $("#fHata"); e.textContent = h; e.hidden = !h;
  if (h) return;
  var is = S.firma && S.firma.id ? Depo.guncelle("firma", S.firma.id, v) : Depo.ekle("firma", Object.assign({ id: "firma" }, v));
  is.then(function (r) { S.firma = r || Object.assign({}, S.firma, v); bildir("Firma bilgileri kaydedildi."); cizFirma(); }).catch(function (x) { bildir(x.message, "hata"); });
}

/* ── Pencere ve onay ── */
var acikPencere = null;
function pencereAc(html, tamam, kur) {
  return new Promise(function (coz) {
    var kap = $("#pencere"), p = kap.querySelector(".pencere"), onceki = document.activeElement, bitti = false;
    p.innerHTML = html; kap.hidden = false;
    function kapat(sonuc) { if (bitti) return; bitti = true; kap.hidden = true; p.innerHTML = ""; acikPencere = null; document.removeEventListener("keydown", tus); if (onceki && onceki.focus) onceki.focus(); coz(sonuc === undefined ? null : sonuc); }
    function tus(e) { if (e.key === "Escape") kapat(null); }
    document.addEventListener("keydown", tus);
    acikPencere = kapat;
    kap.onclick = function (e) { if (e.target === kap || e.target.closest("[data-kapat]")) kapat(null); };
    var t = $("[data-tamam]", p);
    var calis = function () {
      var r = tamam ? tamam(p) : true;
      if (r && typeof r.then === "function") { t.disabled = true; r.then(function (x) { kapat(x); }).catch(function (e) { t.disabled = false; bildir(e.message || "Olmadı, tekrar dene.", "hata"); }); }
      else if (r) kapat(r);
    };
    if (t) t.addEventListener("click", calis);
    var form = $("form", p); if (form) form.addEventListener("submit", function (e) { e.preventDefault(); calis(); });
    if (kur) kur(p, kapat);
    var ilk = $("input, select, textarea", p) || t; if (ilk) setTimeout(function () { ilk.focus(); }, 60);
  });
}
function sor(o) {
  return pencereAc("<h2>" + kacir(o.baslik) + "</h2><p>" + kacir(o.metin) + '</p><div class="alt-dugmeler"><button type="button" class="dugme" data-kapat>Vazgeç</button><button type="button" class="dugme ' + (o.tehlike ? "tehlike dolu" : "ana") + '" data-tamam>' + kacir(o.evet) + "</button></div>", function () { return true; }).then(function (x) { return !!x; });
}

/* ── CSV ── */
function csvIndir() {
  var bas = ["Fatura no", "Müşteri", "Düzenleme", "Son ödeme", "Para birimi", "Mal ve hizmet toplamı", vergiAdi(), "Ödenecek", "Durum", "Ödeme tarihi"];
  var sat = suzulmus().map(function (f) { var t = hesapla(f.kalemler); return [f.no, (f.alici && f.alici.ad) || (musteri(f.musteriId) || {}).ad || "", f.tarih, f.vade, f.paraBirimi || varsayilanPB(), t.matrah, t.kdv, t.genel, durumOf(f), f.odemeTarihi || ""]; });
  var metin = "﻿" + [bas].concat(sat).map(function (r) { return r.map(function (h) { var s = typeof h === "number" ? String(h).replace(".", ",") : String(h == null ? "" : h); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(";"); }).join("\r\n");
  var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([metin], { type: "text/csv;charset=utf-8" })); a.download = "faturalar-" + bugun() + ".csv"; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  bildir(sat.length + " fatura CSV olarak indirildi.");
}

/* ── Olaylar ── */
document.addEventListener("click", function (e) {
  var b = e.target.closest("button, a, tr[data-ac]");
  if (!b) return;
  var d = b.dataset;
  /* Sayfa içi bağlantılar: <base> adresi farklı olabileceği için karma adres elle değiştirilir (sayfa yeniden yüklenmez). */
  var href = b.tagName === "A" ? b.getAttribute("href") || "" : "";
  if (href.charAt(0) === "#" && !e.ctrlKey && !e.metaKey) { e.preventDefault(); git(href); return; }
  if (d.suzgec) { S.suzgec = d.suzgec; $$("[data-suzgec]").forEach(function (x) { x.setAttribute("aria-pressed", String(x.dataset.suzgec === S.suzgec)); }); cizSatirlar(); return; }
  if (d.hizliOde != null) { e.stopPropagation(); var f1 = S.faturalar.find(function (x) { return x.id === d.hizliOde; }); odemePenceresi(f1).then(function (r) { if (!r) return; durumYaz(f1, { durum: "Ödendi", odemeTarihi: r.odemeTarihi }).then(function () { bildir(f1.no + " ödendi olarak işaretlendi."); cizListe(); }).catch(function (x) { bildir(x.message, "hata"); }); }); return; }
  if (d.hizliGonder != null) { e.stopPropagation(); var f2 = S.faturalar.find(function (x) { return x.id === d.hizliGonder; }); durumYaz(f2, { durum: "Gönderildi" }).then(function () { bildir(f2.no + " gönderildi olarak işaretlendi."); cizListe(); }).catch(function (x) { bildir(x.message, "hata"); }); return; }
  if (d.yazdir != null) { e.stopPropagation(); git("#/fatura/" + encodeURIComponent(d.yazdir) + "?yazdir=1"); return; }
  if (d.ac != null) { git("#/fatura/" + encodeURIComponent(d.ac)); return; }
  if (d.csv != null) { csvIndir(); return; }
  if (d.gorunum) { S.gorunum = d.gorunum; $(".ed-govde").dataset.gorunum = S.gorunum; $$("[data-gorunum]").forEach(function (x) { if (x.tagName === "BUTTON") x.setAttribute("aria-pressed", String(x.dataset.gorunum === S.gorunum)); }); olcekle(); return; }
  if (d.vadeGun != null) { var t = S.taslak; t.vade = gunEkle(t.tarih, Number(d.vadeGun)); $('[data-alan="vade"]').value = t.vade; $$("[data-vade-gun]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); kirlet(); guncelle(); return; }
  if (d.kalemEkle != null) { S.taslak.kalemler.push(bosKalem()); kirlet(); cizKalemler(); guncelle(); var son = $$("#kalemler .kalem").pop(); if (son) son.querySelector("input").focus(); return; }
  if (d.kalemSil != null) { if (S.taslak.kalemler.length === 1) { S.taslak.kalemler = [bosKalem()]; } else S.taslak.kalemler.splice(Number(d.kalemSil), 1); kirlet(); cizKalemler(); guncelle(); return; }
  if (d.kaydet != null) { kaydet().then(function (ok) { if (ok) bildir("Fatura kaydedildi."); }); return; }
  if (d.yazdirSimdi != null) { if (S.gorunum !== "onizleme" && innerWidth <= 1180) { S.gorunum = "onizleme"; $(".ed-govde").dataset.gorunum = "onizleme"; $$(".ed-sekme button").forEach(function (x) { x.setAttribute("aria-pressed", String(x.dataset.gorunum === "onizleme")); }); olcekle(); } setTimeout(function () { window.print(); }, 80); return; }
  if (d.durum) {
    var hedef = d.durum;
    var uygula = function () {
      var ek = { durum: hedef }; if (hedef !== "Ödendi") ek.odemeTarihi = "";
      return durumYaz(S.taslak, ek).then(function (r) { S.taslak = kopya(r); S.kirli = false; cizEditor(); bildir(hedef === "Gönderildi" ? "Fatura gönderildi olarak işaretlendi." : "Fatura taslağa alındı."); });
    };
    (S.kirli ? kaydet() : Promise.resolve(true)).then(function (ok) { if (ok) uygula().catch(function (x) { bildir(x.message, "hata"); }); });
    return;
  }
  if (d.odeme != null) {
    (S.kirli ? kaydet() : Promise.resolve(true)).then(function (ok) {
      if (!ok) return;
      odemePenceresi(S.taslak).then(function (r) { if (!r) return; durumYaz(S.taslak, { durum: "Ödendi", odemeTarihi: r.odemeTarihi }).then(function (x) { S.taslak = kopya(x); cizEditor(); bildir("Ödeme kaydedildi."); }); });
    });
    return;
  }
  if (d.kopyala != null) { S.kirli = false; git("#/yeni?kaynak=" + encodeURIComponent(S.taslak.id)); return; }
  if (d.sil != null) {
    var f3 = S.taslak;
    sor({ baslik: "Fatura silinsin mi?", metin: f3.no + " kalıcı olarak silinecek.", evet: "Sil", tehlike: true }).then(function (ok) {
      if (!ok) return;
      Depo.sil("faturalar", f3.id).then(function () { S.faturalar = S.faturalar.filter(function (x) { return x.id !== f3.id; }); S.kirli = false; S.taslak = null; bildir(f3.no + " silindi."); git("#/faturalar"); }).catch(function (x) { bildir(x.message, "hata"); });
    });
    return;
  }
  if (d.musteriYeni != null) { musteriPenceresi(null).then(function (m) { if (m) cizMusteriler(); }); return; }
  if (d.musteriDuzenle) { musteriPenceresi(musteri(d.musteriDuzenle)).then(function (m) { if (m) cizMusteriler(); }); return; }
});
document.addEventListener("input", function (e) {
  if (e.target.id === "ara") { S.ara = e.target.value; cizSatirlar(); return; }
  if (e.target.closest("#edForm")) edGiris(e);
});
document.addEventListener("change", function (e) {
  if (e.target.closest("#edForm") && (e.target.tagName === "SELECT" || e.target.type === "date")) edGiris(e);
});
document.addEventListener("submit", function (e) {
  if (e.target.id === "firmaForm") { e.preventDefault(); firmaKaydet(e.target); }
  if (e.target.id === "edForm") { e.preventDefault(); }
});
document.addEventListener("keydown", function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && S.rota.ad === "fatura" && !acikPencere) { e.preventDefault(); kaydet().then(function (ok) { if (ok) bildir("Fatura kaydedildi."); }); }
});

/* ── Başlangıç ── */
function yukle() {
  Promise.all([Depo.liste("musteriler"), Depo.liste("faturalar"), Depo.liste("firma").catch(function () { return []; })]).then(function (r) {
    S.musteriler = r[0] || []; S.faturalar = (r[1] || []).map(function (f) { if (!Array.isArray(f.kalemler)) f.kalemler = []; if (f.toplam == null) f.toplam = hesapla(f.kalemler).genel; return f; });
    S.firma = (r[2] || []).find(function (x) { return x.id === "firma"; }) || (r[2] || [])[0] || null;
    S.yuklendi = true; ciz();
  }).catch(function (e) {
    $("#icerik").innerHTML = '<div class="bos"><b>Veriler yüklenemedi</b>' + kacir(e.message || "") + "</div>";
  });
}
$("#modYazi").textContent = veriVar() ? "Veritabanına bağlı" : "Bu cihazda saklanıyor";
$("#mod").dataset.bagli = veriVar() ? "1" : "0";
S.rota = rotaCoz(); eskiHash = location.hash;
ciz(); yukle();
`;

const NAV = (rota: string, href: string, ad: string, ikon: string) => `<a href="${href}" data-nav="${rota}">${ikon}<span>${ad}</span></a>`;
const I_FATURA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V4a1 1 0 0 1 1-1z"/><path d="M9 9h6M9 13h6M9 17h3"/></svg>';
const I_KISI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .8 3.2 2.5 3.5 5.2"/></svg>';
const I_FIRMA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M3 21h18M8 8h3M8 12h3M8 16h3"/></svg>';
const LOGO_UST = '<svg viewBox="0 0 46 46" aria-hidden="true"><rect width="46" height="46" rx="12" fill="#0f5c4d"/><path d="M14 12v22M14 23l11-11M18.5 19 27 34" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32.5" cy="14.5" r="3.2" fill="#d24a26"/></svg>';

const HTML = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Fatura Masası · Kırkambar Tasarım</title>
  <meta name="description" content="Fatura oluşturucu: seçilebilir para birimi ve vergi (KDV, VAT, Sales tax), oranlara göre vergi dökümü, yazıyla tutar, A4 önizleme ve yazdırma, tahsilat takibi ve müşteri bakiyeleri." />
  <meta name="theme-color" content="#f3f1ec" />
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="manifest" href="manifest.webmanifest" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <header class="ust">
    <div class="ust-ic">
      <a class="marka" href="#/faturalar">${LOGO_UST}<div><b>Fatura Masası</b><small>Kırkambar Tasarım</small></div></a>
      <nav class="nav" aria-label="Bölümler">
        ${NAV("liste", "#/faturalar", "Faturalar", I_FATURA)}
        ${NAV("musteriler", "#/musteriler", "Müşteriler", I_KISI)}
        ${NAV("firma", "#/firma", "Firma bilgileri", I_FIRMA)}
      </nav>
      <span class="bosluk"></span>
      <span class="mod" id="mod"><i></i><span id="modYazi"></span></span>
    </div>
  </header>
  <main id="icerik"></main>
  <a class="dugme ana yeni-yuzen" id="yeniYuzen" href="#/yeni"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Yeni fatura</a>
  <nav class="alt-nav" aria-label="Bölümler">
    ${NAV("liste", "#/faturalar", "Faturalar", I_FATURA)}
    ${NAV("musteriler", "#/musteriler", "Müşteriler", I_KISI)}
    ${NAV("firma", "#/firma", "Firma", I_FIRMA)}
  </nav>
  <div class="pencere-kap" id="pencere" hidden><div class="pencere" role="dialog" aria-modal="true"></div></div>
  <div id="bildirim" class="bildirim" role="status" aria-live="polite"></div>
  <script src="app.js"></script>
</body>
</html>
`;

export const FATURA_OLUSTURUCU = {
  id: "fatura-olusturucu",
  ad: "Fatura Masası · Fatura Oluşturucu",
  tur: "uygulama" as const,
  aciklama: "Küçük işletmeler için fatura uygulaması: seçilebilir para birimi ve vergi (KDV, VAT, Sales tax, GST), kalem kalem iskonto ve vergi oranı, oranlara göre vergi dökümü, yazıyla tutar, A4 önizleme ve yazdırma, tahsilat ve gecikme takibi, müşteri bakiyeleri ve CSV",
  kapak: "/gercek/build/sablon/fatura-olusturucu.webp",
  get tablolar() { return tablolarKur(); },
  dosyalar: {
    "index.html": HTML,
    "manifest.webmanifest": JSON.stringify({ name: "Fatura Masası", short_name: "Fatura", lang: "tr", start_url: "./index.html", display: "standalone", background_color: "#f3f1ec", theme_color: "#0f5c4d", icons: [{ src: "ikon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }] }, null, 2),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#0f5c4d"/><path d="M156 134v244M156 256l122-122M206 212l94 166" fill="none" stroke="#fff" stroke-width="38" stroke-linecap="round" stroke-linejoin="round"/><circle cx="362" cy="162" r="36" fill="#d24a26"/></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
  },
};
