/* Şablon: Bağ · Müşteri Hattı — küçük satış ekipleri için mini CRM. Fırsatlar aşama aşama bir panoda (fare ve dokunmatikle
 * sürükle bırak), aşama toplamları, olasılıkla ağırlıklı tahmin, takip edilecek adımlar (geciken, bugün, bu hafta), kişiler
 * ve şirketler listesi, fırsat ve kişi çekmecesinde not ve etkinlik zaman çizelgesi. Veriler "musteriler", "firsatlar" ve
 * "notlar" tablolarında (ekibe özel: kurallar kapalı, yalnız proje sahibi). Galerideki canlı önizlemede gömülü kayıtlar ve
 * bu cihazın belleğiyle çalışır. */
import type { SablonTablo } from "./kurulum";
import { ORTAK_JS } from "./ortak";
import { PARA_JS, AYARLAR_TABLOSU } from "./parabirimi";

const AV = (a: string) => `/gercek/paz/av-${a}.webp`;
const ASAMALAR = ["Aday", "Görüşme", "Teklif", "Pazarlık", "Kazanıldı", "Kaybedildi"];
const EKIP = ["Ece Kaya", "Onur Aydın", "Sena Er"];
const NOT_TURLERI = ["Not", "Arama", "Toplantı", "E-posta", "Aşama"];

const MUSTERILER = [
  { id: "m1", ad: "Zeynep Aral", sirket: "Mavera Tekstil", unvan: "Pazarlama Direktörü", eposta: "zeynep.aral@maveratekstil.com.tr", telefon: "0532 418 20 11", sehir: "İstanbul", avatar: AV("emma"), sicaklik: "Sıcak" },
  { id: "m2", ad: "Kerem Yalçın", sirket: "Rota Lojistik", unvan: "Operasyon Müdürü", eposta: "kerem@rotalojistik.com", telefon: "0533 902 44 18", sehir: "İzmir", avatar: AV("jayden"), sicaklik: "Sıcak" },
  { id: "m3", ad: "Elif Şahin", sirket: "Nar Kozmetik", unvan: "Kurucu Ortak", eposta: "elif@narkozmetik.com", telefon: "0544 315 67 02", sehir: "İstanbul", avatar: AV("clara"), sicaklik: "Ilık" },
  { id: "m4", ad: "Mert Akın", sirket: "Kuzey Yapı", unvan: "Genel Müdür Yardımcısı", eposta: "mert.akin@kuzeyyapi.com.tr", telefon: "0535 621 08 90", sehir: "Ankara", avatar: AV("liam"), sicaklik: "Soğuk" },
  { id: "m5", ad: "Deniz Yılmaz", sirket: "Sahil Otelcilik", unvan: "Satış Müdürü", eposta: "deniz@sahilotelcilik.com", telefon: "0542 774 31 26", sehir: "Antalya", avatar: AV("margot"), sicaklik: "Sıcak" },
  { id: "m6", ad: "Can Özdemir", sirket: "Pera Yazılım", unvan: "Teknik Direktör", eposta: "can@perayazilim.io", telefon: "0530 288 19 73", sehir: "İstanbul", avatar: AV("marco"), sicaklik: "Ilık" },
  { id: "m7", ad: "Selin Korkmaz", sirket: "Defne Mobilya", unvan: "E-ticaret Sorumlusu", eposta: "selin@defnemobilya.com", telefon: "0541 530 62 47", sehir: "Bursa", avatar: AV("amara"), sicaklik: "Ilık" },
  { id: "m8", ad: "Arda Kılıç", sirket: "Anka Gıda", unvan: "Satın Alma Müdürü", eposta: "arda.kilic@ankagida.com.tr", telefon: "0536 147 85 30", sehir: "Konya", avatar: AV("tae"), sicaklik: "Soğuk" },
  { id: "m9", ad: "Ayşe Demir", sirket: "Mira Eğitim", unvan: "Genel Müdür", eposta: "ayse@miraegitim.org", telefon: "0532 660 94 15", sehir: "İstanbul", avatar: AV("zara"), sicaklik: "Sıcak" },
  { id: "m10", ad: "Burak Çelik", sirket: "Volta Enerji", unvan: "Pazarlama Müdürü", eposta: "burak@voltaenerji.com", telefon: "0543 219 77 08", sehir: "Eskişehir", avatar: AV("omar"), sicaklik: "Ilık" },
  { id: "m11", ad: "İpek Arslan", sirket: "Lavanta Butik", unvan: "Kurucu", eposta: "ipek@lavantabutik.com", telefon: "0538 402 13 59", sehir: "Muğla", avatar: AV("lily"), sicaklik: "Ilık" },
  { id: "m12", ad: "Emre Tunç", sirket: "Atlas Sigorta", unvan: "Dijital Dönüşüm Lideri", eposta: "emre.tunc@atlassigorta.com.tr", telefon: "0531 845 26 61", sehir: "İstanbul", avatar: AV("ren"), sicaklik: "Sıcak" },
];

/* Tarihler bugünden gün farkıyla tutulur; proje açılırken (ve galeride tarayıcıda) gerçek tarihe çevrilir. */
type FirsatTohum = { id: string; baslik: string; musteriId: string; tutar: number; asama: string; sahip: string; adim?: string; adimGun?: number; kapanisGun?: number; kayipNedeni?: string; acilisGun: number };
const F = (id: string, baslik: string, musteriId: string, tutar: number, asama: string, sahip: string, acilisGun: number, adim?: string, adimGun?: number, kapanisGun?: number, kayipNedeni?: string): FirsatTohum => ({ id, baslik, musteriId, tutar, asama, sahip, acilisGun, adim, adimGun, kapanisGun, kayipNedeni });
const FIRSATLAR: FirsatTohum[] = [
  F("f1", "Kurumsal web sitesi yenileme", "m1", 285000, "Teklif", "Ece Kaya", -24, "Teklif sunumu toplantısı", 1),
  F("f2", "Filo takip paneli", "m2", 420000, "Pazarlık", "Onur Aydın", -41, "Sözleşme taslağını gönder", -2),
  F("f3", "E-ticaret mağazası kurulumu", "m3", 168000, "Görüşme", "Sena Er", -9, "İhtiyaç analizi görüşmesi", 0),
  F("f4", "Şantiye raporlama uygulaması", "m4", 610000, "Aday", "Onur Aydın", -3, "Tanışma araması", 3),
  F("f5", "Rezervasyon motoru entegrasyonu", "m5", 236000, "Teklif", "Ece Kaya", -19, "Revize fiyatı gönder", -1),
  F("f6", "Tasarım sistemi danışmanlığı", "m6", 145000, "Pazarlık", "Ece Kaya", -33, "Hukuk onayını takip et", 2),
  F("f7", "Ürün fotoğrafı ve katalog", "m7", 72000, "Görüşme", "Sena Er", -12, "Deneme çekimini planla", 4),
  F("f8", "Bayi sipariş portalı", "m8", 380000, "Aday", "Onur Aydın", -5, "Karar vericiyle tanış", 6),
  F("f9", "Öğrenci mobil uygulaması", "m9", 540000, "Teklif", "Onur Aydın", -27, "Teknik sunum", 5),
  F("f10", "Kampanya açılış sayfaları", "m10", 64000, "Görüşme", "Sena Er", -15, "Brif dosyasını iste", -3),
  F("f11", "Instagram mağaza bağlantısı", "m11", 38000, "Aday", "Sena Er", -2, "WhatsApp ile dönüş yap", 1),
  F("f12", "Müşteri portalı yeniden tasarım", "m12", 720000, "Pazarlık", "Ece Kaya", -52, "Fiyat görüşmesi", 0),
  F("f13", "Yıllık bakım sözleşmesi", "m1", 96000, "Kazanıldı", "Ece Kaya", -40, undefined, undefined, -6),
  F("f14", "Erişilebilirlik denetimi", "m6", 54000, "Kazanıldı", "Onur Aydın", -38, undefined, undefined, -12),
  F("f15", "Marka kimliği paketi", "m3", 120000, "Kazanıldı", "Sena Er", -60, undefined, undefined, -20),
  F("f16", "Saha formu uygulaması", "m4", 210000, "Kaybedildi", "Onur Aydın", -45, undefined, undefined, -9, "Bütçe gelecek yıla ertelendi"),
  F("f17", "Sosyal medya yönetimi", "m10", 48000, "Kaybedildi", "Sena Er", -30, undefined, undefined, -15, "Daha düşük fiyatlı bir ajansla anlaştılar"),
  F("f18", "Mobil check-in uygulaması", "m5", 330000, "Kazanıldı", "Ece Kaya", -58, undefined, undefined, -3),
  F("f19", "Eğitim platformu entegrasyonu", "m9", 185000, "Görüşme", "Ece Kaya", -7, "Ürün turu toplantısı", 2),
  F("f20", "Arama motoru bakım paketi", "m7", 42000, "Aday", "Sena Er", -1, "Mevcut siteyi incele", 8),
];

type NotTohum = { id: string; firsatId: string; musteriId: string; tur: string; metin: string; yazar: string; saatOnce: number };
const N = (id: string, firsatId: string, tur: string, metin: string, yazar: string, saatOnce: number): NotTohum => ({ id, firsatId, musteriId: FIRSATLAR.find((f) => f.id === firsatId)!.musteriId, tur, metin, yazar, saatOnce });
const NOTLAR: NotTohum[] = [
  N("n1", "f1", "Toplantı", "Zeynep Hanım ve ekibiyle ilk toplantı. Mevcut site mobilde yavaş; kampanya sayfalarını kendileri yönetmek istiyorlar.", "Ece Kaya", 410),
  N("n2", "f1", "Aşama", "Görüşme aşamasından Teklif aşamasına geçti.", "Ece Kaya", 150),
  N("n3", "f1", "E-posta", "Üç seçenekli teklif gönderildi: temel, büyüme ve kurumsal. Kurumsal pakete ilgi var.", "Ece Kaya", 52),
  N("n4", "f2", "Arama", "Kerem Bey filo sayısını 140 araç olarak doğruladı. Canlı konum ve yakıt raporu şart.", "Onur Aydın", 600),
  N("n5", "f2", "Aşama", "Teklif aşamasından Pazarlık aşamasına geçti.", "Onur Aydın", 200),
  N("n6", "f2", "Not", "Ödeme takvimini üç taksite bölmemizi istediler; finans ekibi uygun buldu.", "Onur Aydın", 70),
  N("n7", "f3", "Arama", "Elif Hanım mevcut mağazadan taşınmak istiyor. Ürün sayısı yaklaşık 320.", "Sena Er", 190),
  N("n8", "f5", "E-posta", "Kanal yöneticisi bağlantısı için teknik dokümanları paylaştılar.", "Ece Kaya", 260),
  N("n9", "f5", "Not", "Bütçeleri teklifin yüzde 12 altında. Kapsamı daraltan bir seçenek hazırlanacak.", "Ece Kaya", 30),
  N("n10", "f6", "Toplantı", "Bileşen kütüphanesi için iki günlük atölye üzerinde anlaştık.", "Ece Kaya", 480),
  N("n11", "f9", "Toplantı", "Öğrenci, veli ve öğretmen rolleri olacak. Yayın hedefi şubat sonu.", "Onur Aydın", 320),
  N("n12", "f10", "E-posta", "Kampanya takvimini ve görselleri bekliyoruz.", "Sena Er", 240),
  N("n13", "f12", "Toplantı", "Satın alma komitesi sunumu iyi geçti. Rakip teklifle aramızda yüzde 8 fark var.", "Ece Kaya", 96),
  N("n14", "f12", "Aşama", "Teklif aşamasından Pazarlık aşamasına geçti.", "Ece Kaya", 90),
  N("n15", "f13", "Aşama", "Fırsat kazanıldı.", "Ece Kaya", 150),
  N("n16", "f16", "Aşama", "Fırsat kaybedildi: Bütçe gelecek yıla ertelendi.", "Onur Aydın", 220),
  N("n17", "f18", "Aşama", "Fırsat kazanıldı.", "Ece Kaya", 75),
  N("n18", "f4", "Not", "Fuar standında tanıştık; kartvizit alındı. Şantiye sayısı 9.", "Onur Aydın", 70),
  N("n19", "f19", "Arama", "Mevcut öğrenme yönetim sistemine tek oturumla bağlanma isteniyor.", "Ece Kaya", 140),
  N("n20", "f11", "Not", "Instagram'dan mesaj attı, küçük bütçeli hızlı bir çözüm arıyor.", "Sena Er", 40),
];

/* Sunucu tarafında (proje açılırken) tohumları gerçek tarihlere çevirir. */
const istTarih = (z: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(z));
const gunSonra = (n: number) => istTarih(Date.now() + n * 86400000);
function tablolarKur(): Record<string, SablonTablo> {
  return {
    musteriler: {
      aciklama: "Kişiler ve şirketler. Ekibe özel: yalnız proje sahibi okur ve düzenler (ekip girişi için kuralları üyelere açabilirsin).",
      kurallar: { okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" },
      sema: [
        { ad: "ad", tur: "metin", zorunlu: true },
        { ad: "sirket", tur: "metin" },
        { ad: "unvan", tur: "metin" },
        { ad: "eposta", tur: "eposta" },
        { ad: "telefon", tur: "metin" },
        { ad: "sehir", tur: "metin" },
        { ad: "avatar", tur: "gorsel" },
        { ad: "sicaklik", tur: "secim", secenekler: ["Sıcak", "Ilık", "Soğuk"], varsayilan: "Ilık" },
      ],
      kayitlar: MUSTERILER,
    },
    ayarlar: AYARLAR_TABLOSU({ aciklama: "Satış hattı ayarları (tek kayıt, id ayarlar). paraBirimi: fırsat tutarlarının para birimi, ISO 4217 kodu." }),
    firsatlar: {
      aciklama: "Satış fırsatları. asama panodaki sütundur; sira sütun içindeki sırayı tutar. adimTarihi YYYY-AA-GG.",
      kurallar: { okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" },
      sema: [
        { ad: "baslik", tur: "metin", zorunlu: true },
        { ad: "musteriId", tur: "iliski", iliski: "musteriler" },
        { ad: "tutar", tur: "sayi", aciklama: "Ayarlar tablosundaki para biriminde" },
        { ad: "asama", tur: "secim", zorunlu: true, secenekler: ASAMALAR, varsayilan: "Aday" },
        { ad: "sahip", tur: "secim", secenekler: EKIP },
        { ad: "adim", tur: "metin", aciklama: "Sıradaki adım" },
        { ad: "adimTarihi", tur: "metin", aciklama: "YYYY-AA-GG" },
        { ad: "acilis", tur: "metin", aciklama: "YYYY-AA-GG" },
        { ad: "kapanis", tur: "metin", aciklama: "YYYY-AA-GG, kazanılınca ya da kaybedilince" },
        { ad: "kayipNedeni", tur: "metin" },
        { ad: "sira", tur: "sayi" },
      ],
      kayitlar: FIRSATLAR.map((f, i) => ({ id: f.id, baslik: f.baslik, musteriId: f.musteriId, tutar: f.tutar, asama: f.asama, sahip: f.sahip, adim: f.adim ?? "", adimTarihi: f.adimGun === undefined ? "" : gunSonra(f.adimGun), acilis: gunSonra(f.acilisGun), kapanis: f.kapanisGun === undefined ? "" : gunSonra(f.kapanisGun), kayipNedeni: f.kayipNedeni ?? "", sira: (i + 1) * 10 })),
    },
    notlar: {
      aciklama: "Fırsat ve kişilere eklenen notlar, aramalar, toplantılar ve otomatik aşama kayıtları.",
      kurallar: { okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" },
      sema: [
        { ad: "firsatId", tur: "iliski", iliski: "firsatlar" },
        { ad: "musteriId", tur: "iliski", iliski: "musteriler" },
        { ad: "tur", tur: "secim", secenekler: NOT_TURLERI, varsayilan: "Not" },
        { ad: "metin", tur: "uzunMetin", zorunlu: true },
        { ad: "yazar", tur: "metin" },
        { ad: "zaman", tur: "metin", aciklama: "ISO zaman" },
      ],
      kayitlar: NOTLAR.map((n) => ({ id: n.id, firsatId: n.firsatId, musteriId: n.musteriId, tur: n.tur, metin: n.metin, yazar: n.yazar, zaman: new Date(Date.now() - n.saatOnce * 3600000).toISOString() })),
    },
  };
}

const STIL = String.raw`/* Bağ · Müşteri Hattı — sıcak kâğıt zemin, mürekkep kenar çubuğu, çivit imza; Geist. */
:root {
  --zemin: #f3f2ee;
  --panel: #ffffff;
  --panel-2: #f8f7f3;
  --cizgi: #e4e2db;
  --cizgi-2: #d3d0c6;
  --metin: #17181c;
  --metin-2: #565961;
  --metin-3: #82858d;
  --murekkep: #17181c;
  --vurgu: #4136e0;
  --vurgu-2: #5b51f0;
  --vurgu-acik: #ecebfd;
  --kirmizi: #c8412f;
  --kirmizi-acik: #fbe9e5;
  --amber: #a8650a;
  --amber-acik: #fbf0dc;
  --yesil: #17845a;
  --yesil-acik: #e2f4ea;
  --r: 14px;
  --yazi: "Geist", system-ui, -apple-system, "Segoe UI", sans-serif;
  --egri: cubic-bezier(.22, 1, .36, 1);
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
[hidden] { display: none !important; }
html, body { margin: 0; }
body { background: var(--zemin); color: var(--metin); font: 14px/1.45 var(--yazi); -webkit-font-smoothing: antialiased; font-feature-settings: "tnum" 1; overflow-x: hidden; }
button, input, select, textarea { font: inherit; color: inherit; }
button { cursor: pointer; }
:focus-visible { outline: 2px solid var(--vurgu); outline-offset: 2px; }
h1, h2, h3, h4 { margin: 0; letter-spacing: -0.02em; font-weight: 600; }
img { display: block; }

[data-asama="Aday"] { --renk: #7d828c; }
[data-asama="Görüşme"] { --renk: #2f74e8; }
[data-asama="Teklif"] { --renk: #6e4fe6; }
[data-asama="Pazarlık"] { --renk: #d97a1e; }
[data-asama="Kazanıldı"] { --renk: #17845a; }
[data-asama="Kaybedildi"] { --renk: #c8412f; }

/* Kabuk */
.kabuk { display: grid; grid-template-columns: 236px minmax(0, 1fr); min-height: 100vh; min-height: 100dvh; }
.yan { position: sticky; top: 0; height: 100vh; height: 100dvh; background: var(--murekkep); color: #f1f0ec; display: flex; flex-direction: column; padding: 20px 14px; gap: 6px; }
.marka { display: flex; align-items: center; gap: 10px; padding: 4px 8px 18px; font-weight: 600; font-size: 17px; letter-spacing: -0.02em; }
.marka svg { width: 30px; height: 30px; }
.marka small { display: block; font-size: 12px; font-weight: 500; color: #a3a49f; letter-spacing: 0; }
.nav { display: flex; flex-direction: column; gap: 2px; }
.nav button { display: flex; align-items: center; gap: 11px; width: 100%; padding: 10px 10px; border: 0; border-radius: 10px; background: none; color: #c9c8c2; font-weight: 500; text-align: left; transition: background .2s, color .2s; }
.nav button svg { width: 19px; height: 19px; flex: none; }
.nav button:hover { background: rgba(255,255,255,.06); color: #fff; }
.nav button[aria-current="page"] { background: rgba(255,255,255,.1); color: #fff; }
.nav button[aria-current="page"] svg { color: #a9a3ff; }
.nav .rozet { margin-left: auto; min-width: 22px; height: 20px; padding: 0 7px; border-radius: 999px; background: #e8553f; color: #fff; font-size: 12px; font-weight: 600; display: grid; place-items: center; }
.yan-alt { margin-top: auto; display: flex; flex-direction: column; gap: 12px; }
.ekip-kart { padding: 12px; border-radius: 12px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); }
.ekip-kart b { display: block; font-size: 13px; font-weight: 600; }
.ekip-kart span { font-size: 12px; color: #a3a49f; }
.ekip-yuzler { display: flex; margin-top: 10px; }
.ekip-yuzler .bas { margin-left: -6px; border: 2px solid var(--murekkep); }
.ekip-yuzler .bas:first-child { margin-left: 0; }
.mod-yazi { font-size: 12px; color: #8f908b; padding: 0 6px; display: flex; gap: 7px; align-items: center; }
.mod-yazi i { width: 7px; height: 7px; border-radius: 50%; background: #3fc98a; flex: none; }
.mod-yazi.yerel i { background: #e3a83a; }

.ana { min-width: 0; padding: 22px 28px 40px; }
.ust { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
.ust h1 { font-size: 24px; }
.ust .alt-baslik { color: var(--metin-3); font-size: 13px; margin-top: 2px; }
.ust .bosluk { flex: 1; }
.ara { position: relative; width: 300px; }
.ara svg { position: absolute; left: 12px; top: 50%; width: 17px; height: 17px; transform: translateY(-50%); color: var(--metin-3); pointer-events: none; }
.ara input { width: 100%; height: 40px; padding: 0 12px 0 38px; border: 1px solid var(--cizgi); border-radius: 11px; background: var(--panel); outline: none; transition: border-color .2s; }
.ara input:focus { border-color: var(--vurgu); }
.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 40px; padding: 0 16px; border-radius: 11px; border: 1px solid transparent; background: var(--murekkep); color: #fff; font-weight: 600; white-space: nowrap; transition: background .2s, transform .15s; }
.dugme:hover { background: #2b2c33; }
.dugme:active { transform: scale(.98); }
.dugme svg { width: 17px; height: 17px; }
.dugme.vurgu { background: var(--vurgu); }
.dugme.vurgu:hover { background: var(--vurgu-2); }
.dugme.ikincil { background: var(--panel); color: var(--metin); border-color: var(--cizgi); }
.dugme.ikincil:hover { background: var(--panel-2); }
.dugme.tehlike { background: var(--panel); color: var(--kirmizi); border-color: #efcdc6; }
.dugme.tehlike:hover { background: var(--kirmizi-acik); }
.dugme.kucuk { height: 34px; padding: 0 12px; font-size: 13px; border-radius: 9px; }
.ikon-dugme { width: 40px; height: 40px; border-radius: 11px; border: 1px solid var(--cizgi); background: var(--panel); display: grid; place-items: center; }
.ikon-dugme svg { width: 18px; height: 18px; }
.yalniz-mobil { display: none !important; }

/* Göstergeler */
.kpi { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }
.kpi > div { background: var(--panel); border: 1px solid var(--cizgi); border-radius: var(--r); padding: 14px 16px; min-width: 0; }
.kpi span { display: block; color: var(--metin-2); font-size: 13px; }
.kpi b { display: block; font-size: 24px; font-weight: 600; letter-spacing: -0.03em; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kpi small { display: block; color: var(--metin-3); font-size: 12.5px; margin-top: 2px; }
.kpi .cubuk { height: 5px; border-radius: 9px; background: #eceae4; margin-top: 10px; overflow: hidden; }
.kpi .cubuk i { display: block; height: 100%; background: var(--yesil); border-radius: 9px; }

/* Araç çubuğu */
.arac { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.bolum { display: inline-flex; padding: 3px; border-radius: 11px; background: #e9e7e1; }
.bolum button { border: 0; background: none; height: 32px; padding: 0 13px; border-radius: 8px; font-weight: 500; color: var(--metin-2); white-space: nowrap; }
.bolum button[aria-pressed="true"] { background: var(--panel); color: var(--metin); box-shadow: 0 1px 2px rgba(23,24,28,.08); }
.cipler { display: flex; gap: 6px; flex-wrap: wrap; }
.cip { display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 11px 0 5px; border-radius: 999px; border: 1px solid var(--cizgi); background: var(--panel); font-size: 13px; font-weight: 500; color: var(--metin-2); }
.cip.yazi { padding-left: 12px; }
.cip[aria-pressed="true"] { border-color: var(--murekkep); color: var(--metin); background: #fff; box-shadow: inset 0 0 0 1px var(--murekkep); }
.ipucu-yazi { margin-left: auto; color: var(--metin-3); font-size: 12.5px; }

/* Baş resmi */
.bas { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; object-position: 50% 18%; background: #ddd; flex: none; }
.bas.harf { display: grid; place-items: center; font-size: 11px; font-weight: 600; color: #fff; background: var(--vurgu); }
.bas.b32 { width: 32px; height: 32px; }
.bas.b40 { width: 40px; height: 40px; }
.bas.b56 { width: 56px; height: 56px; font-size: 18px; }

/* Hat düzeni */
.hat { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: start; }
.pano-kap { min-width: 0; }
.pano { display: grid; grid-template-columns: repeat(4, minmax(196px, 1fr)); gap: 12px; align-items: start; }
.sutun { background: #ecebe5; border-radius: 16px; padding: 10px; min-width: 0; display: flex; flex-direction: column; transition: background .2s, box-shadow .2s; }
.sutun.hedef { background: #e3e1f8; box-shadow: inset 0 0 0 2px var(--vurgu); }
.sutun-bas { padding: 4px 4px 10px; }
.sutun-bas .ust-satir { display: flex; align-items: center; gap: 8px; }
.sutun-bas h2 { font-size: 14px; }
.sutun-bas .adet { font-size: 12px; color: var(--metin-3); background: rgba(255,255,255,.7); border-radius: 999px; padding: 1px 8px; font-weight: 600; }
.sutun-bas .ekle { margin-left: auto; width: 28px; height: 28px; border-radius: 8px; border: 0; background: transparent; color: var(--metin-2); display: grid; place-items: center; }
.sutun-bas .ekle:hover { background: rgba(255,255,255,.8); color: var(--metin); }
.sutun-bas .ekle svg { width: 16px; height: 16px; }
.sutun-bas .toplam { display: flex; flex-wrap: wrap; justify-content: space-between; column-gap: 8px; margin-top: 6px; font-size: 12.5px; color: var(--metin-2); }
.sutun-bas .toplam > * { white-space: nowrap; }
.sutun-bas .toplam b { color: var(--metin); font-weight: 600; }
.sutun-bas .serit { height: 3px; border-radius: 3px; background: var(--renk); margin-top: 9px; opacity: .9; }
.kartlar { display: flex; flex-direction: column; gap: 8px; min-height: 64px; }
.bos-sutun { border: 1.5px dashed var(--cizgi-2); border-radius: 12px; padding: 18px 10px; text-align: center; color: var(--metin-3); font-size: 12.5px; }

.kart { position: relative; display: block; width: 100%; text-align: left; background: var(--panel); border: 1px solid var(--cizgi); border-radius: 12px; padding: 12px 12px 11px; cursor: grab; touch-action: manipulation; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; transition: border-color .15s, transform .15s; }
.kart:hover { border-color: var(--cizgi-2); }
.kart h3 { font-size: 14px; font-weight: 600; line-height: 1.3; letter-spacing: -0.01em; }
.kart .sirket { display: flex; align-items: center; gap: 7px; margin-top: 8px; color: var(--metin-2); font-size: 12.5px; min-width: 0; }
.kart .sirket span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kart .bas { width: 20px; height: 20px; }
.kart .alt { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.kart .tutar { font-weight: 600; font-size: 14px; letter-spacing: -0.01em; }
.kart .sahip { margin-left: auto; }
.kart .adim { display: flex; align-items: center; gap: 6px; margin-top: 9px; padding-top: 9px; border-top: 1px solid #efede7; font-size: 12.5px; color: var(--metin-2); min-width: 0; }
.kart .adim { align-items: flex-start; }
.kart .adim > svg { margin-top: 2px; }
.kart .adim > span:not(.tarih-cip) { flex: 1; min-width: 0; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.35; }
.kart .adim.yok { color: var(--amber); }
.tarih-cip { flex: none; font-size: 11.5px; font-weight: 600; padding: 2px 7px; border-radius: 6px; background: #f0eee8; color: var(--metin-2); white-space: nowrap; }
.tarih-cip.gecikti { background: var(--kirmizi-acik); color: var(--kirmizi); }
.tarih-cip.bugun { background: var(--amber-acik); color: var(--amber); }
.kart.yer { opacity: .35; border-style: dashed; }
.kart.yeni { animation: parla 1.2s var(--egri); }
@keyframes parla { 0% { border-color: var(--vurgu); box-shadow: 0 0 0 3px var(--vurgu-acik); } 100% { box-shadow: 0 0 0 0 transparent; } }
.yer-tutucu { height: 4px; border-radius: 4px; background: var(--vurgu); margin: -2px 0; }
.hayalet { position: fixed; left: 0; top: 0; z-index: 90; pointer-events: none; margin: 0; transform-origin: 30% 30%; box-shadow: 0 10px 24px rgba(23,24,28,.14); border-color: var(--cizgi-2); cursor: grabbing; transition: none; }
body.surukleniyor, body.surukleniyor * { cursor: grabbing !important; user-select: none; }

.birak { position: fixed; left: 50%; bottom: 22px; z-index: 80; display: flex; gap: 10px; transform: translate(-50%, 140%); visibility: hidden; transition: transform .3s var(--egri), visibility 0s .3s; }
.birak.acik { transform: translate(-50%, 0); visibility: visible; transition: transform .3s var(--egri); }
.birak div { display: flex; align-items: center; gap: 10px; width: 230px; height: 64px; padding: 0 18px; border-radius: 16px; background: var(--panel); border: 2px dashed var(--renk); color: var(--renk); font-weight: 600; transition: background .15s, transform .15s; }
.birak div svg { width: 22px; height: 22px; }
.birak div.hedef { background: var(--renk); color: #fff; border-style: solid; transform: scale(1.04); }

/* Kapanan liste */
.liste { background: var(--panel); border: 1px solid var(--cizgi); border-radius: var(--r); overflow: hidden; }
.liste table { width: 100%; border-collapse: collapse; }
.liste th { text-align: left; font-size: 12.5px; font-weight: 500; color: var(--metin-3); padding: 11px 16px; border-bottom: 1px solid var(--cizgi); background: var(--panel-2); white-space: nowrap; }
.liste td { padding: 12px 16px; border-bottom: 1px solid #efede7; vertical-align: middle; }
.liste tr:last-child td { border-bottom: 0; }
.liste tbody tr { cursor: pointer; transition: background .15s; }
.liste tbody tr:hover { background: var(--panel-2); }
.liste .kisi-hucre { display: flex; align-items: center; gap: 10px; min-width: 0; }
.liste .kisi-hucre b { display: block; font-weight: 600; }
.liste .kisi-hucre small { display: block; color: var(--metin-3); font-size: 12.5px; }
.liste .sag { text-align: right; }
.liste .soluk { color: var(--metin-3); }
.asama-etiket { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--renk); white-space: nowrap; }
.asama-etiket::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--renk); }
.sicak { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
.sicak[data-s="Sıcak"] { background: #fde6df; color: #b23d22; }
.sicak[data-s="Ilık"] { background: #fbf0dc; color: #96600f; }
.sicak[data-s="Soğuk"] { background: #e3edfb; color: #2a5ea8; }
.bos-durum { padding: 48px 20px; text-align: center; color: var(--metin-3); }
.bos-durum b { display: block; color: var(--metin); font-size: 16px; margin-bottom: 4px; }

/* Sağ ray */
.ray { display: flex; flex-direction: column; gap: 14px; }
.blok { background: var(--panel); border: 1px solid var(--cizgi); border-radius: var(--r); padding: 16px; }
.blok-bas { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.blok-bas h2 { font-size: 15px; }
.blok-bas a, .blok-bas button.bag { margin-left: auto; border: 0; background: none; color: var(--vurgu); font-weight: 500; font-size: 13px; padding: 0; }
.takip-satir { display: flex; align-items: flex-start; gap: 10px; width: 100%; padding: 9px 6px; margin: 0 -6px; border: 0; background: none; border-radius: 10px; text-align: left; width: calc(100% + 12px); }
.takip-satir:hover { background: var(--panel-2); }
.takip-satir .metin { min-width: 0; flex: 1; }
.takip-satir b { display: block; font-size: 13.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.takip-satir small { display: block; color: var(--metin-3); font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tahmin-satir { display: grid; grid-template-columns: 76px 1fr auto; align-items: center; gap: 10px; font-size: 13px; padding: 6px 0; }
.tahmin-satir .ad { color: var(--metin-2); }
.tahmin-satir .bar { height: 8px; border-radius: 8px; background: #efede7; position: relative; overflow: hidden; }
.tahmin-satir .bar i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--renk); opacity: .25; border-radius: 8px; }
.tahmin-satir .bar em { position: absolute; left: 0; top: 0; bottom: 0; background: var(--renk); border-radius: 8px; }
.tahmin-satir b { font-weight: 600; font-size: 12.5px; white-space: nowrap; }
.tahmin-alt { display: flex; justify-content: space-between; border-top: 1px solid #efede7; margin-top: 10px; padding-top: 10px; font-size: 13px; color: var(--metin-2); }
.tahmin-alt b { color: var(--metin); }
.hedef-satir { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 12.5px; color: var(--metin-3); }
.hedef-satir select { height: 30px; border: 1px solid var(--cizgi); border-radius: 8px; padding: 0 6px; background: var(--panel-2); font-weight: 600; color: var(--metin); }
.hedef-satir input { min-width: 0; width: 120px; height: 30px; border: 1px solid var(--cizgi); border-radius: 8px; padding: 0 8px; background: var(--panel-2); }

/* Takip görünümü */
.takip-grup { margin-bottom: 18px; }
.takip-grup h2 { font-size: 14px; display: flex; align-items: center; gap: 8px; margin: 0 0 8px; color: var(--metin-2); font-weight: 600; }
.takip-grup h2 i { width: 8px; height: 8px; border-radius: 50%; background: var(--renk, #888); }
.gorev { display: flex; align-items: center; gap: 12px; background: var(--panel); border: 1px solid var(--cizgi); border-radius: 12px; padding: 12px 14px; margin-bottom: 8px; transition: opacity .3s, transform .3s; }
.gorev.bitti { opacity: 0; transform: translateX(20px); }
.onay { width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--cizgi-2); background: var(--panel); flex: none; display: grid; place-items: center; color: transparent; transition: all .2s; }
.onay:hover { border-color: var(--yesil); color: var(--yesil); }
.onay svg { width: 14px; height: 14px; }
.onay.isaretli { background: var(--yesil); border-color: var(--yesil); color: #fff; }
.gorev .metin { flex: 1; min-width: 0; cursor: pointer; }
.gorev .metin b { display: block; font-weight: 600; }
.gorev .metin small { display: flex; align-items: center; gap: 6px; color: var(--metin-3); font-size: 12.5px; margin-top: 2px; min-width: 0; }
.gorev .metin small span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gorev .tutar { font-weight: 600; white-space: nowrap; }

/* Çekmece */
.perde { position: fixed; inset: 0; z-index: 60; background: rgba(23,24,28,.3); opacity: 0; pointer-events: none; transition: opacity .25s; }
.perde.acik { opacity: 1; pointer-events: auto; }
.cekmece { position: fixed; top: 0; right: 0; bottom: 0; z-index: 70; width: min(540px, 100vw); background: var(--panel); border-left: 1px solid var(--cizgi); transform: translateX(102%); transition: transform .35s var(--egri); display: flex; flex-direction: column; }
.cekmece.acik { transform: none; }
.cek-bas { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid var(--cizgi); }
.cek-bas .bosluk { flex: 1; }
.cek-govde { flex: 1; overflow-y: auto; padding: 22px 22px 30px; overscroll-behavior: contain; }
.cek-govde h2 { font-size: 22px; line-height: 1.25; }
.cek-ust { display: flex; align-items: center; gap: 10px; margin-top: 10px; color: var(--metin-2); flex-wrap: wrap; }
.cek-ust a { color: inherit; }
.cek-tutar { display: flex; align-items: baseline; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
.cek-tutar b { font-size: 30px; letter-spacing: -0.03em; font-weight: 600; }
.cek-tutar span { color: var(--metin-3); font-size: 13px; }
.adimlar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-top: 18px; }
.adimlar button { position: relative; height: 34px; border: 0; background: #ecebe5; font-size: 12.5px; font-weight: 600; color: var(--metin-2); padding: 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.adimlar button:first-child { border-radius: 9px 0 0 9px; }
.adimlar button:last-child { border-radius: 0 9px 9px 0; }
.adimlar button.gecti { background: color-mix(in srgb, var(--renk) 18%, #fff); color: var(--renk); }
.adimlar button.simdi { background: var(--renk); color: #fff; }
.kapat-eylem { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
.kapat-eylem button { height: 38px; border-radius: 10px; font-weight: 600; border: 1px solid var(--cizgi); background: var(--panel); display: inline-flex; align-items: center; justify-content: center; gap: 7px; }
.kapat-eylem button svg { width: 16px; height: 16px; }
.kapat-eylem .kazan { color: var(--yesil); }
.kapat-eylem .kazan:hover { background: var(--yesil-acik); border-color: #b9e3cc; }
.kapat-eylem .kaybet { color: var(--kirmizi); }
.kapat-eylem .kaybet:hover { background: var(--kirmizi-acik); border-color: #efcdc6; }
.kapali-durum { margin-top: 16px; padding: 12px 14px; border-radius: 12px; background: color-mix(in srgb, var(--renk) 10%, #fff); color: var(--renk); font-weight: 600; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.kapali-durum span { font-weight: 500; color: var(--metin-2); }
.kapali-durum button { margin-left: auto; }
.bilgi-izgara { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--cizgi); border: 1px solid var(--cizgi); border-radius: 12px; overflow: hidden; margin-top: 18px; }
.bilgi-izgara > div { background: var(--panel); padding: 10px 12px; min-width: 0; }
.bilgi-izgara span { display: block; font-size: 12px; color: var(--metin-3); }
.bilgi-izgara b { display: block; font-weight: 600; font-size: 13.5px; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bilgi-izgara a { color: var(--vurgu); text-decoration: none; }
.siradaki { margin-top: 18px; padding: 14px; border-radius: 14px; border: 1px solid var(--cizgi); background: var(--panel-2); }
.siradaki h3 { font-size: 13.5px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
.siradaki .satir { display: grid; grid-template-columns: minmax(0, 1fr) 150px; gap: 8px; }
.siradaki .eylem { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.alan { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.alan > span { font-size: 12.5px; font-weight: 500; color: var(--metin-2); }
.alan input, .alan select, .alan textarea, .siradaki input { width: 100%; min-width: 0; height: 40px; padding: 0 12px; border: 1px solid var(--cizgi); border-radius: 10px; background: var(--panel); outline: none; transition: border-color .2s; }
.alan textarea { height: auto; min-height: 84px; padding: 10px 12px; resize: vertical; }
.alan input:focus, .alan select:focus, .alan textarea:focus, .siradaki input:focus { border-color: var(--vurgu); }
.bolum-baslik { font-size: 14px; margin: 26px 0 10px; display: flex; align-items: center; gap: 8px; }
.bolum-baslik small { color: var(--metin-3); font-weight: 500; }
.not-yaz { border: 1px solid var(--cizgi); border-radius: 14px; overflow: hidden; background: var(--panel); transition: border-color .2s; }
.not-yaz:focus-within { border-color: var(--vurgu); }
.not-turleri { display: flex; gap: 4px; padding: 8px 8px 0; flex-wrap: wrap; }
.not-turleri button { border: 0; background: none; height: 28px; padding: 0 10px; border-radius: 8px; font-size: 12.5px; font-weight: 500; color: var(--metin-2); display: inline-flex; align-items: center; gap: 6px; }
.not-turleri button svg { width: 14px; height: 14px; }
.not-turleri button[aria-pressed="true"] { background: var(--vurgu-acik); color: var(--vurgu); }
.not-yaz textarea { display: block; width: 100%; border: 0; outline: none; resize: none; min-height: 70px; padding: 10px 14px; background: transparent; }
.not-yaz .alt { display: flex; justify-content: flex-end; padding: 0 8px 8px; }
.zaman-cizgi { list-style: none; margin: 16px 0 0; padding: 0; position: relative; }
.zaman-cizgi::before { content: ""; position: absolute; left: 15px; top: 6px; bottom: 6px; width: 1.5px; background: var(--cizgi); }
.zaman-cizgi li { position: relative; display: flex; gap: 12px; padding: 0 0 16px; }
.zaman-cizgi .im { position: relative; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; flex: none; background: var(--panel); border: 1.5px solid var(--cizgi); color: var(--metin-2); }
.zaman-cizgi .im svg { width: 15px; height: 15px; }
.zaman-cizgi li[data-tur="Aşama"] .im { background: var(--vurgu-acik); border-color: transparent; color: var(--vurgu); }
.zaman-cizgi li[data-tur="Arama"] .im { color: #2f74e8; }
.zaman-cizgi li[data-tur="Toplantı"] .im { color: #d97a1e; }
.zaman-cizgi li[data-tur="E-posta"] .im { color: #17845a; }
.zaman-cizgi .icerik { min-width: 0; flex: 1; padding-top: 5px; }
.zaman-cizgi .icerik p { margin: 4px 0 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.zaman-cizgi .ust-bilgi { display: flex; gap: 6px; flex-wrap: wrap; font-size: 12.5px; color: var(--metin-3); }
.zaman-cizgi .ust-bilgi b { color: var(--metin); font-weight: 600; }
.zaman-cizgi .sil-not { margin-left: auto; border: 0; background: none; color: var(--metin-3); font-size: 12px; padding: 0; opacity: 0; transition: opacity .15s; }
.zaman-cizgi li:hover .sil-not, .zaman-cizgi .sil-not:focus-visible { opacity: 1; }
.mini-firsat { display: flex; align-items: center; gap: 10px; width: 100%; padding: 11px 12px; border: 1px solid var(--cizgi); border-radius: 12px; background: var(--panel); margin-bottom: 8px; text-align: left; }
.mini-firsat:hover { border-color: var(--cizgi-2); }
.mini-firsat .metin { flex: 1; min-width: 0; }
.mini-firsat b { display: block; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kisi-bas { display: flex; align-items: center; gap: 14px; }
.kisi-bas p { margin: 3px 0 0; color: var(--metin-2); }
.iletisim { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }

/* Pencere (form) */
.pencere-kap { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 20px; background: rgba(23,24,28,.32); opacity: 0; pointer-events: none; transition: opacity .2s; }
.pencere-kap.acik { opacity: 1; pointer-events: auto; }
.pencere { width: min(520px, 100%); max-height: calc(100dvh - 40px); overflow-y: auto; background: var(--panel); border: 1px solid var(--cizgi); border-radius: 20px; padding: 22px; transform: translateY(10px) scale(.98); transition: transform .3s var(--egri); }
.pencere-kap.acik .pencere { transform: none; }
.pencere h2 { font-size: 19px; margin-bottom: 4px; }
.pencere > p { margin: 0 0 16px; color: var(--metin-2); }
.form-izgara { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-izgara .tam { grid-column: 1 / -1; }
.pencere .eylem { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.hata-yazi { color: var(--kirmizi); font-size: 13px; margin-top: 10px; }
.neden-cipler { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }

.kilit { min-height: 70vh; display: grid; place-items: center; text-align: center; padding: 30px; }
.kilit div { max-width: 420px; }
.kilit svg { width: 44px; height: 44px; color: var(--vurgu); }
.kilit h2 { margin: 12px 0 6px; font-size: 20px; }
.kilit p { color: var(--metin-2); margin: 0; }
.yukleniyor { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.yukleniyor i { height: 280px; border-radius: 16px; background: linear-gradient(90deg, #ebe9e3, #f3f2ee, #ebe9e3); background-size: 200% 100%; animation: akis 1.2s linear infinite; }
@keyframes akis { to { background-position: -200% 0; } }

.bildirim { position: fixed; left: 50%; bottom: 24px; z-index: 120; transform: translate(-50%, calc(100% + 120px)); visibility: hidden; background: var(--murekkep); color: #fff; padding: 12px 18px; border-radius: 12px; font-weight: 500; transition: transform .35s var(--egri), visibility 0s .35s; max-width: calc(100vw - 32px); }
.bildirim.acik { transform: translate(-50%, 0); visibility: visible; transition: transform .35s var(--egri); }
.bildirim[data-tur="hata"] { background: var(--kirmizi); }
.bildirim[data-tur="basari"] { background: var(--yesil); }

/* Kişiler kart görünümü (dar ekran) */
.kisi-kartlar { display: none; }

@media (max-width: 1400px) {
  .hat { grid-template-columns: 1fr; }
  .ray { display: grid; grid-template-columns: 1fr 1fr; }
}
@media (max-width: 860px) {
  .kabuk { grid-template-columns: 1fr; }
  .yan { position: fixed; top: auto; bottom: 0; left: 0; right: 0; height: auto; z-index: 50; flex-direction: row; padding: 6px 10px calc(6px + env(safe-area-inset-bottom)); border-top: 1px solid #2a2b31; }
  .marka, .yan-alt { display: none; }
  .nav { flex-direction: row; width: 100%; justify-content: space-around; }
  .nav button { flex-direction: column; gap: 3px; font-size: 11.5px; padding: 7px 4px; align-items: center; position: relative; flex: 1; }
  .nav button svg { width: 22px; height: 22px; }
  .nav .rozet { position: absolute; top: 2px; left: calc(50% + 6px); margin: 0; height: 17px; min-width: 18px; font-size: 11px; padding: 0 5px; }
  .ana { padding: 14px 14px 100px; }
  .ust { flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
  .ust h1 { font-size: 21px; }
  .ust .bosluk { display: none; }
  .ust .baslik-kap { flex: 1; min-width: 0; }
  .ara { order: 3; width: 100%; }
  .yalniz-masa { display: none !important; }
  .yalniz-mobil { display: inline-flex !important; }
  .kpi { grid-template-columns: 1fr 1fr; gap: 8px; }
  .kpi > div { padding: 12px; }
  .kpi b { font-size: 19px; }
  .arac { flex-wrap: nowrap; overflow-x: auto; margin: 0 -14px 12px; padding: 0 14px; scrollbar-width: none; }
  .arac::-webkit-scrollbar { display: none; }
  .cipler { flex-wrap: nowrap; }
  .ipucu-yazi { display: none; }
  .pano-kap { margin: 0 -14px; }
  .pano { grid-template-columns: repeat(4, 82vw); overflow-x: auto; scroll-snap-type: x mandatory; padding: 0 14px 6px; scroll-padding: 0 14px; scrollbar-width: none; }
  .pano::-webkit-scrollbar { display: none; }
  .pano.surukle-kaydir { scroll-snap-type: none; }
  .sutun { scroll-snap-align: start; }
  .ray { grid-template-columns: 1fr; }
  .cekmece { width: 100vw; border-left: 0; }
  .cek-govde { padding: 18px 16px 30px; }
  .siradaki .satir { grid-template-columns: 1fr; }
  .pencere-kap { align-items: end; padding: 0; }
  .pencere { border-radius: 20px 20px 0 0; max-height: 92dvh; padding: 20px 16px calc(20px + env(safe-area-inset-bottom)); }
  .form-izgara { grid-template-columns: 1fr; }
  .birak { bottom: 82px; width: calc(100vw - 28px); }
  .birak div { width: auto; flex: 1; height: 58px; }
  .liste.kisiler { display: none; }
  .kisi-kartlar { display: flex; flex-direction: column; gap: 8px; }
  .kisi-kart { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--cizgi); border-radius: 14px; background: var(--panel); width: 100%; text-align: left; }
  .kisi-kart .metin { flex: 1; min-width: 0; }
  .kisi-kart b { display: block; font-weight: 600; }
  .kisi-kart small { display: block; color: var(--metin-3); font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .kisi-kart .sag { text-align: right; flex: none; }
  .kisi-kart .sag b { font-size: 13.5px; }
  .liste.kapanan th:nth-child(3), .liste.kapanan td:nth-child(3), .liste.kapanan th:nth-child(5), .liste.kapanan td:nth-child(5) { display: none; }
  .liste td, .liste th { padding: 11px 12px; }
  .bildirim { bottom: 86px; }
  .yukleniyor { grid-template-columns: 1fr; }
  .yukleniyor i:nth-child(n+2) { display: none; }
}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
`;

const UYGULAMA = ORTAK_JS + PARA_JS("bag-crm-para-birimi") + "\nvar TOHUM = " + JSON.stringify({ musteriler: MUSTERILER, firsatlar: FIRSATLAR, notlar: NOTLAR }) + ";\nvar ASAMALAR = " + JSON.stringify(ASAMALAR) + ";\nvar EKIP = " + JSON.stringify(EKIP) + ";\n" + String.raw`
/* Bağ · Müşteri Hattı. Veriler Vayra Veri tablolarında (musteriler, firsatlar, notlar); galerideki önizlemede gömülü
 * kayıtlar bu cihazın belleğinde (localStorage) tutulur. */
var ACIK_ASAMALAR = ["Aday", "Görüşme", "Teklif", "Pazarlık"];
var OLASILIK = { "Aday": 10, "Görüşme": 25, "Teklif": 50, "Pazarlık": 75, "Kazanıldı": 100, "Kaybedildi": 0 };
var EKIP_AVATAR = { "Ece Kaya": "/gercek/paz/av-yuna.webp", "Onur Aydın": "/gercek/paz/av-stefan.webp", "Sena Er": "/gercek/paz/av-nia.webp" };
var BEN = "Ece Kaya";
var KAYIP_NEDENLERI = ["Bütçe yetersiz", "Rakibi seçti", "Zamanlama uymadı", "Yanıt vermiyor", "İhtiyaç değişti"];

var S = { musteriler: [], firsatlar: [], notlar: [], gorunum: "hat", durum: "acik", sahip: "", ara: "", cekmece: null, notTuru: "Not", yuklendi: false, kilit: "" };
var ICON = {
  hat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/></svg>',
  kisiler: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.4c1.9.8 3 2.8 3 5.6"/></svg>',
  takip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  ara: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  arti: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  kapat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  onay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17 19 7"/></svg>',
  kupa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v3M8.5 20h7M10 17h4"/></svg>',
  carpi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/></svg>',
  Not: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h10l4 4v12H5z"/><path d="M9 12h6M9 16h4"/></svg>',
  Arama: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  "Toplantı": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  "E-posta": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg>',
  "Aşama": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h12M13 7l5 5-5 5"/></svg>',
  duzenle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  cop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  kilit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
  bayrak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>'
};

/* ── Depo: Vayra Veri ya da bu cihazın belleği ── */
var YEREL = "bag-crm-v1";
var yerel = null;
function tohumCoz() {
  var bugun = istanbul().tarih, z = Date.now();
  function g(n) { return n === undefined || n === null ? "" : gunEkle(bugun, n); }
  return {
    surum: 1,
    musteriler: TOHUM.musteriler.map(function (m, i) { return Object.assign({ olusturma: z - (60 - i) * 86400000, guncelleme: z }, m); }),
    firsatlar: TOHUM.firsatlar.map(function (f, i) { return { id: f.id, baslik: f.baslik, musteriId: f.musteriId, tutar: f.tutar, asama: f.asama, sahip: f.sahip, adim: f.adim || "", adimTarihi: g(f.adimGun), acilis: g(f.acilisGun), kapanis: g(f.kapanisGun), kayipNedeni: f.kayipNedeni || "", sira: (i + 1) * 10, olusturma: z, guncelleme: z }; }),
    notlar: TOHUM.notlar.map(function (n) { return { id: n.id, firsatId: n.firsatId, musteriId: n.musteriId, tur: n.tur, metin: n.metin, yazar: n.yazar, zaman: new Date(z - n.saatOnce * 3600000).toISOString(), olusturma: z, guncelleme: z }; })
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
    var r = Object.assign({ id: yeniId(), olusturma: Date.now(), guncelleme: Date.now() }, k);
    yerelAl()[kol].push(r); yerelYaz(); return Promise.resolve(Object.assign({}, r));
  },
  guncelle: function (kol, id, a) {
    if (veriVar()) return vayra.veri.guncelle(kol, id, a);
    var r = yerelAl()[kol].find(function (x) { return x.id === id; });
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
function bugun() { return istanbul().tarih; }
function musteri(id) { return S.musteriler.find(function (m) { return m.id === id; }) || null; }
function firsat(id) { return S.firsatlar.find(function (f) { return f.id === id; }) || null; }
function acikMi(f) { return ACIK_ASAMALAR.indexOf(f.asama) >= 0; }
function kisa(n) { return pbKisa(n); }
function gunFark(t) { if (!t) return null; return Math.round((Date.parse(t + "T12:00:00Z") - Date.parse(bugun() + "T12:00:00Z")) / 86400000); }
function tarihCip(t) {
  var d = gunFark(t);
  if (d === null) return "";
  var sinif = d < 0 ? "gecikti" : d === 0 ? "bugun" : "", yazi;
  if (d === 0) yazi = "Bugün"; else if (d === 1) yazi = "Yarın"; else if (d === -1) yazi = "Dün"; else if (d < 0) yazi = (-d) + " gün gecikti"; else if (d < 7) { yazi = tarihYaz(t, { weekday: "long", day: undefined, month: undefined }); yazi = yazi.charAt(0).toLocaleUpperCase("tr") + yazi.slice(1); } else yazi = tarihYaz(t, { month: "short" });
  return '<span class="tarih-cip ' + sinif + '">' + kacir(yazi) + "</span>";
}
function basResmi(m, sinif) {
  sinif = sinif || "";
  if (m && m.avatar) return '<img class="bas ' + sinif + '" src="' + kacir(m.avatar) + '" alt="" loading="lazy" />';
  var ad = (m && (m.ad || m)) || "?";
  var h = String(ad).split(" ").map(function (p) { return p.charAt(0); }).slice(0, 2).join("");
  var renkler = ["#4136e0", "#2f74e8", "#d97a1e", "#17845a", "#b2407a", "#6e4fe6"], t = 0;
  for (var i = 0; i < ad.length; i++) t += ad.charCodeAt(i);
  return '<span class="bas harf ' + sinif + '" style="background:' + renkler[t % renkler.length] + '" aria-hidden="true">' + kacir(h.toLocaleUpperCase("tr")) + "</span>";
}
function sahipBas(ad, sinif) { return EKIP_AVATAR[ad] ? '<img class="bas ' + (sinif || "") + '" src="' + EKIP_AVATAR[ad] + '" alt="' + kacir(ad) + '" title="' + kacir(ad) + '" />' : basResmi(ad, sinif); }
function goreli(iso) {
  var z = Date.parse(iso), f = (Date.now() - z) / 60000;
  if (!isFinite(f)) return "";
  if (f < 1) return "az önce";
  if (f < 60) return Math.floor(f) + " dakika önce";
  if (f < 1440) return Math.floor(f / 60) + " saat önce";
  if (f < 2880) return "dün";
  if (f < 10080) return Math.floor(f / 1440) + " gün önce";
  return new Date(z).toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}
function eslesir(f) {
  if (S.sahip && f.sahip !== S.sahip) return false;
  if (!S.ara) return true;
  var m = musteri(f.musteriId) || {};
  return [f.baslik, m.ad, m.sirket, f.adim].join(" ").toLocaleLowerCase("tr").indexOf(S.ara) >= 0;
}
function siraliAsama(a) { return S.firsatlar.filter(function (f) { return f.asama === a; }).sort(function (x, y) { return (x.sira || 0) - (y.sira || 0); }); }

/* ── Yükleme ── */
function yukle() {
  $("#icerik").innerHTML = '<div class="yukleniyor" aria-label="Yükleniyor"><i></i><i></i><i></i><i></i></div>';
  Promise.all([Depo.liste("musteriler"), Depo.liste("firsatlar"), Depo.liste("notlar"), pbYukle()]).then(function (r) {
    S.musteriler = r[0]; S.firsatlar = r[1]; S.notlar = r[2]; S.yuklendi = true; S.kilit = "";
    ciz();
  }).catch(function (e) {
    S.kilit = e && e.message ? e.message : "Veriler okunamadı.";
    ciz();
  });
  $("#modYazi").classList.toggle("yerel", !veriVar());
  $("#modYazi span").textContent = veriVar() ? "Veritabanına bağlı" : "Bu cihazda saklanıyor";
}

/* ── Çizim ── */
function ciz() {
  $$(".nav [data-git]").forEach(function (b) { if (b.dataset.git === S.gorunum) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  var gec = S.firsatlar.filter(function (f) { return acikMi(f) && f.adimTarihi && gunFark(f.adimTarihi) <= 0; }).length;
  $$("[data-rozet]").forEach(function (r) { r.textContent = gec; r.hidden = !gec; });
  var basliklar = { hat: ["Satış hattı", "Fırsatları sürükleyip aşamalar arasında taşı"], kisiler: ["Kişiler ve şirketler", S.musteriler.length + " kişi"], takip: ["Takip edilecekler", "Sıradaki adımlar, tarihe göre"] };
  $("#baslik").textContent = basliklar[S.gorunum][0];
  $("#altBaslik").textContent = basliklar[S.gorunum][1];
  $("#yeniDugme span").textContent = S.gorunum === "kisiler" ? "Kişi ekle" : "Yeni fırsat";
  var ic = $("#icerik"), eskiPano = $("#pano"), panoX = eskiPano ? eskiPano.scrollLeft : 0;
  if (S.kilit) { ic.innerHTML = '<div class="kilit"><div>' + ICON.kilit + '<h2>Bu pano ekibe özel</h2><p>Müşteri ve fırsat kayıtlarını yalnız ekip görebilir. Erişim için yöneticine başvur.</p></div></div>'; return; }
  if (!S.yuklendi) return;
  if (S.gorunum === "hat") ic.innerHTML = hatHTML();
  else if (S.gorunum === "kisiler") ic.innerHTML = kisilerHTML();
  else ic.innerHTML = takipHTML();
  var yeniPano = $("#pano"); if (yeniPano && panoX) yeniPano.scrollLeft = panoX;
  if (S.cekmece) cekmeceCiz();
}

function kpiHTML() {
  var acik = S.firsatlar.filter(acikMi), top = 0, agirlik = 0;
  acik.forEach(function (f) { top += f.tutar || 0; agirlik += (f.tutar || 0) * OLASILIK[f.asama] / 100; });
  var otuz = gunEkle(bugun(), -30), kaz = 0, kazAdet = 0, kazanan = 0, kaybeden = 0;
  S.firsatlar.forEach(function (f) {
    if (f.asama === "Kazanıldı") { kazanan++; if (f.kapanis && f.kapanis >= otuz) { kaz += f.tutar || 0; kazAdet++; } }
    if (f.asama === "Kaybedildi") kaybeden++;
  });
  var oran = kazanan + kaybeden ? Math.round(kazanan * 100 / (kazanan + kaybeden)) : 0;
  var hedef = hedefAl(), yuzde = Math.min(100, Math.round(kaz * 100 / hedef));
  return '<div class="kpi">' +
    '<div><span>Açık hat</span><b>' + kisa(top) + '</b><small>' + acik.length + ' açık fırsat</small></div>' +
    '<div><span>Ağırlıklı tahmin</span><b>' + kisa(agirlik) + '</b><small>Aşama olasılığıyla</small></div>' +
    '<div><span>Son 30 günde kazanılan</span><b>' + kisa(kaz) + '</b><small>' + kazAdet + ' fırsat, hedefin yüzde ' + yuzde + "'" + ek(yuzde) + '</small><div class="cubuk"><i style="width:' + yuzde + '%"></i></div></div>' +
    '<div><span>Kazanma oranı</span><b>yüzde ' + oran + '</b><small>' + kazanan + ' kazanıldı, ' + kaybeden + ' kaybedildi</small></div>' +
    "</div>";
}
/* "yüzde 40'ı" gibi iyelik eki (sayının okunuşuna göre). */
function ek(n) {
  var son = ["sıfır", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"], on = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];
  var k = n === 100 ? "yüz" : n % 10 ? son[n % 10] : n ? on[Math.floor(n / 10)] : "sıfır";
  var u = (k.match(/[aeıioöuü]/g) || ["e"]).pop();
  var e = { a: "ı", ı: "ı", o: "u", u: "u", e: "i", i: "i", ö: "ü", ü: "ü" }[u];
  return (/[aeıioöuü]$/.test(k) ? "s" : "") + e;
}
function hedefAl() { var h = Number(localStorage.getItem("bag-crm-hedef") || 750000); return h > 0 ? h : 750000; }

function aracHTML() {
  var b = function (d, y) { return '<button type="button" data-durum="' + d + '" aria-pressed="' + (S.durum === d) + '">' + y + "</button>"; };
  var c = '<button type="button" class="cip yazi" data-sahip="" aria-pressed="' + (!S.sahip) + '">Herkes</button>';
  EKIP.forEach(function (a) { c += '<button type="button" class="cip" data-sahip="' + kacir(a) + '" aria-pressed="' + (S.sahip === a) + '">' + sahipBas(a, "") + kacir(a.split(" ")[0]) + "</button>"; });
  return '<div class="arac"><div class="bolum" role="group" aria-label="Fırsat durumu">' + b("acik", "Açık") + b("kazanildi", "Kazanılan") + b("kaybedildi", "Kaybedilen") + '</div><div class="cipler" role="group" aria-label="Sorumlu">' + c + '</div><span class="ipucu-yazi">Kartı tutup sürükle, kapatmak için alttaki alana bırak</span></div>';
}

function kartHTML(f) {
  var m = musteri(f.musteriId);
  var adim = f.adim ? '<div class="adim">' + ICON.bayrak.replace("<svg", '<svg width="14" height="14" style="flex:none"') + "<span>" + kacir(f.adim) + "</span>" + tarihCip(f.adimTarihi) + "</div>" : '<div class="adim yok"><span>Sıradaki adım yok</span></div>';
  return '<button type="button" class="kart" data-firsat="' + kacir(f.id) + '" data-asama="' + kacir(f.asama) + '">' +
    "<h3>" + kacir(f.baslik) + "</h3>" +
    '<div class="sirket">' + basResmi(m) + "<span>" + kacir(m ? m.sirket || m.ad : "Kişi yok") + "</span></div>" +
    '<div class="alt"><span class="tutar">' + tl(f.tutar) + '</span><span class="sahip">' + sahipBas(f.sahip) + "</span></div>" + adim + "</button>";
}

function hatHTML() {
  var h = kpiHTML() + aracHTML();
  if (S.durum !== "acik") return h + kapananHTML();
  h += '<div class="hat"><div class="pano-kap"><div class="pano" id="pano">';
  ACIK_ASAMALAR.forEach(function (a) {
    var l = siraliAsama(a), top = 0;
    l.forEach(function (f) { top += f.tutar || 0; });
    var g = l.filter(eslesir);
    h += '<section class="sutun" data-asama="' + a + '" aria-label="' + a + '"><div class="sutun-bas"><div class="ust-satir"><h2>' + a + '</h2><span class="adet">' + l.length + '</span><button type="button" class="ekle" data-ekle-asama="' + a + '" aria-label="' + a + ' aşamasına fırsat ekle">' + ICON.arti + '</button></div><div class="toplam"><b>' + kisa(top) + "</b><span>olasılık yüzde " + OLASILIK[a] + '</span></div><div class="serit"></div></div><div class="kartlar" data-kartlar="' + a + '">' +
      (g.length ? g.map(kartHTML).join("") : '<div class="bos-sutun">' + (l.length ? "Aramaya uyan fırsat yok" : "Buraya kart bırak") + "</div>") + "</div></section>";
  });
  h += "</div></div>" + rayHTML() + "</div>";
  return h;
}

function rayHTML() {
  var l = S.firsatlar.filter(function (f) { return acikMi(f) && f.adimTarihi && gunFark(f.adimTarihi) <= 3; }).sort(function (a, b) { return a.adimTarihi < b.adimTarihi ? -1 : 1; }).slice(0, 6);
  var t = '<div class="blok"><div class="blok-bas"><h2>Takip edilecekler</h2><button type="button" class="bag" data-git="takip">Tümü</button></div>';
  t += l.length ? l.map(function (f) { var m = musteri(f.musteriId); return '<button type="button" class="takip-satir" data-ac="' + kacir(f.id) + '">' + basResmi(m, "b32") + '<span class="metin"><b>' + kacir(f.adim) + "</b><small>" + kacir(m ? m.sirket : f.baslik) + "</small></span>" + tarihCip(f.adimTarihi) + "</button>"; }).join("") : '<p class="soluk" style="margin:0;color:var(--metin-3)">Önümüzdeki üç günde planlı adım yok.</p>';
  t += "</div>";
  var maks = 1, satirlar = "", top = 0, agir = 0;
  ACIK_ASAMALAR.forEach(function (a) { var s = 0; siraliAsama(a).forEach(function (f) { s += f.tutar || 0; }); maks = Math.max(maks, s); });
  ACIK_ASAMALAR.forEach(function (a) {
    var s = 0; siraliAsama(a).forEach(function (f) { s += f.tutar || 0; });
    var w = s * OLASILIK[a] / 100; top += s; agir += w;
    satirlar += '<div class="tahmin-satir" data-asama="' + a + '"><span class="ad">' + a + '</span><span class="bar"><i style="width:' + (s / maks * 100) + '%"></i><em style="width:' + (w / maks * 100) + '%"></em></span><b>' + kisa(w) + "</b></div>";
  });
  t += '<div class="blok"><div class="blok-bas"><h2>Tahmin</h2></div>' + satirlar + '<div class="tahmin-alt"><span>Ağırlıklı toplam</span><b>' + kisa(agir) + '</b></div><div class="hedef-satir"><span>Aylık hedef</span><input type="number" min="0" step="50000" id="hedefGir" value="' + hedefAl() + '" inputmode="numeric" aria-label="Aylık hedef tutarı" /><select id="pbSec" aria-label="Para birimi">' + pbSecenekleri() + "</select></div></div>";
  return '<aside class="ray">' + t + "</aside>";
}

function kapananHTML() {
  var a = S.durum === "kazanildi" ? "Kazanıldı" : "Kaybedildi";
  var l = S.firsatlar.filter(function (f) { return f.asama === a && eslesir(f); }).sort(function (x, y) { return (y.kapanis || "") < (x.kapanis || "") ? -1 : 1; });
  if (!l.length) return '<div class="liste"><div class="bos-durum"><b>' + (a === "Kazanıldı" ? "Henüz kazanılan fırsat yok" : "Kaybedilen fırsat yok") + "</b>Açık fırsatları panoda alttaki alana sürükleyerek kapatabilirsin.</div></div>";
  var top = 0; l.forEach(function (f) { top += f.tutar || 0; });
  return '<div class="liste kapanan"><table><thead><tr><th>Fırsat</th><th class="sag">Tutar</th><th>Sorumlu</th><th>Kapanış</th><th>' + (a === "Kaybedildi" ? "Neden" : "Süre") + "</th></tr></thead><tbody>" +
    l.map(function (f) {
      var m = musteri(f.musteriId), sure = f.acilis && f.kapanis ? Math.max(0, Math.round((Date.parse(f.kapanis) - Date.parse(f.acilis)) / 86400000)) + " gün" : "";
      return '<tr data-ac="' + kacir(f.id) + '"><td><div class="kisi-hucre">' + basResmi(m, "b32") + "<div><b>" + kacir(f.baslik) + "</b><small>" + kacir(m ? m.sirket : "") + '</small></div></div></td><td class="sag"><b>' + tl(f.tutar) + "</b></td><td>" + kacir(f.sahip || "") + '</td><td class="soluk">' + (f.kapanis ? kacir(tarihYaz(f.kapanis, { month: "short" })) : "") + '</td><td class="soluk">' + kacir(a === "Kaybedildi" ? f.kayipNedeni || "Belirtilmedi" : sure) + "</td></tr>";
    }).join("") + '</tbody><tfoot><tr><td style="color:var(--metin-2)">' + l.length + ' fırsat</td><td class="sag"><b>' + tl(top) + "</b></td><td></td><td></td><td></td></tr></tfoot></table></div>";
}

function kisilerHTML() {
  var l = S.musteriler.filter(function (m) { return !S.ara || [m.ad, m.sirket, m.unvan, m.sehir, m.eposta].join(" ").toLocaleLowerCase("tr").indexOf(S.ara) >= 0; }).sort(function (a, b) { return a.ad.localeCompare(b.ad, "tr"); });
  if (!l.length) return '<div class="liste"><div class="bos-durum"><b>' + (S.ara ? "Aramaya uyan kişi yok" : "Henüz kişi yok") + "</b>Sağ üstten yeni kişi ekleyebilirsin.</div></div>";
  function ozet(m) {
    var acik = 0, adet = 0, son = "";
    S.firsatlar.forEach(function (f) { if (f.musteriId === m.id) { adet++; if (acikMi(f)) acik += f.tutar || 0; } });
    S.notlar.forEach(function (n) { if (n.musteriId === m.id && n.zaman > son) son = n.zaman; });
    return { acik: acik, adet: adet, son: son };
  }
  var tablo = '<div class="liste kisiler"><table><thead><tr><th>Kişi</th><th>Şirket</th><th>İletişim</th><th>Durum</th><th class="sag">Açık fırsat</th><th>Son temas</th></tr></thead><tbody>';
  var kartlar = '<div class="kisi-kartlar">';
  l.forEach(function (m) {
    var o = ozet(m);
    tablo += '<tr data-kisi="' + kacir(m.id) + '"><td><div class="kisi-hucre">' + basResmi(m, "b32") + "<div><b>" + kacir(m.ad) + "</b><small>" + kacir(m.unvan || "") + "</small></div></div></td><td>" + kacir(m.sirket || "") + '<br><small class="soluk">' + kacir(m.sehir || "") + '</small></td><td><span>' + kacir(m.eposta || "") + '</span><br><small class="soluk">' + kacir(m.telefon || "") + '</small></td><td><span class="sicak" data-s="' + kacir(m.sicaklik || "Ilık") + '">' + kacir(m.sicaklik || "Ilık") + '</span></td><td class="sag"><b>' + (o.acik ? tl(o.acik) : '<span class="soluk">Yok</span>') + '</b><br><small class="soluk">' + o.adet + ' fırsat</small></td><td class="soluk">' + (o.son ? goreli(o.son) : "Henüz yok") + "</td></tr>";
    kartlar += '<button type="button" class="kisi-kart" data-kisi="' + kacir(m.id) + '">' + basResmi(m, "b40") + '<span class="metin"><b>' + kacir(m.ad) + "</b><small>" + kacir([m.sirket, m.unvan].filter(Boolean).join(", ")) + '</small></span><span class="sag"><b>' + (o.acik ? kisa(o.acik) : "") + '</b><small><span class="sicak" data-s="' + kacir(m.sicaklik || "Ilık") + '">' + kacir(m.sicaklik || "Ilık") + "</span></small></span></button>";
  });
  return tablo + "</tbody></table></div>" + kartlar + "</div>";
}

function takipHTML() {
  var gruplar = [
    { ad: "Gecikenler", renk: "#c8412f", f: function (d) { return d < 0; } },
    { ad: "Bugün", renk: "#a8650a", f: function (d) { return d === 0; } },
    { ad: "Bu hafta", renk: "#2f74e8", f: function (d) { return d > 0 && d <= 7; } },
    { ad: "Daha sonra", renk: "#7d828c", f: function (d) { return d > 7; } }
  ];
  var l = S.firsatlar.filter(function (f) { return acikMi(f) && eslesir(f); });
  var h = aracHTML().replace(/<div class="bolum"[\s\S]*?<\/div>/, "").replace(/<span class="ipucu-yazi">[\s\S]*?<\/span>/, ""), toplam = 0;
  gruplar.forEach(function (g) {
    var x = l.filter(function (f) { return f.adim && f.adimTarihi && g.f(gunFark(f.adimTarihi)); }).sort(function (a, b) { return a.adimTarihi < b.adimTarihi ? -1 : 1; });
    if (!x.length) return;
    toplam += x.length;
    h += '<section class="takip-grup"><h2 style="--renk:' + g.renk + '"><i></i>' + g.ad + " <small>" + x.length + "</small></h2>" + x.map(gorevHTML).join("") + "</section>";
  });
  var adimsiz = l.filter(function (f) { return !f.adim || !f.adimTarihi; });
  if (adimsiz.length) h += '<section class="takip-grup"><h2 style="--renk:#a8650a"><i></i>Sıradaki adımı olmayanlar <small>' + adimsiz.length + "</small></h2>" + adimsiz.map(gorevHTML).join("") + "</section>";
  if (!toplam && !adimsiz.length) h += '<div class="liste"><div class="bos-durum"><b>Her şey yolunda</b>Takip edilecek açık adım yok.</div></div>';
  return h;
}
function gorevHTML(f) {
  var m = musteri(f.musteriId);
  return '<div class="gorev" data-gorev="' + kacir(f.id) + '">' + (f.adim ? '<button type="button" class="onay" data-tamamla="' + kacir(f.id) + '" aria-label="' + kacir(f.adim) + ' adımını tamamla">' + ICON.onay + "</button>" : basResmi(m, "b32")) +
    '<div class="metin" data-ac="' + kacir(f.id) + '" role="button" tabindex="0"><b>' + kacir(f.adim || f.baslik) + "</b><small>" + (f.adim ? "<span>" + kacir(f.baslik) + ", " + kacir(m ? m.sirket : "") + "</span>" + tarihCip(f.adimTarihi) : "<span>" + kacir(m ? m.sirket : "") + ", " + kacir(f.asama) + "</span>") + "</small></div>" +
    '<span class="tutar yalniz-masa">' + tl(f.tutar) + "</span>" + sahipBas(f.sahip) + "</div>";
}

/* ── Çekmece ── */
function cekmeceAc(tur, id) { S.cekmece = { tur: tur, id: id }; S.notTuru = "Not"; cekmeceCiz(); $("#perde").classList.add("acik"); var c = $("#cekmece"); c.classList.add("acik"); c.setAttribute("aria-hidden", "false"); setTimeout(function () { var k = $("#cekKapat"); if (k) k.focus(); }, 50); }
function cekmeceKapat() { S.cekmece = null; $("#perde").classList.remove("acik"); var c = $("#cekmece"); c.classList.remove("acik"); c.setAttribute("aria-hidden", "true"); }
function cekmeceCiz() {
  var c = $("#cekmece"), d = S.cekmece;
  if (!d) return;
  var kayit = d.tur === "firsat" ? firsat(d.id) : musteri(d.id);
  if (!kayit) { cekmeceKapat(); return; }
  var kaydirma = $(".cek-govde", c) ? $(".cek-govde", c).scrollTop : 0;
  var taslak = $("#notMetin") ? $("#notMetin").value : "";
  c.innerHTML = d.tur === "firsat" ? firsatCekmece(kayit) : kisiCekmece(kayit);
  $(".cek-govde", c).scrollTop = kaydirma;
  if ($("#notMetin")) $("#notMetin").value = taslak;
}
function notlarHTML(l) {
  if (!l.length) return '<p style="color:var(--metin-3);margin:14px 0 0">Henüz not yok. İlk görüşmeyi buraya yaz.</p>';
  return '<ol class="zaman-cizgi">' + l.map(function (n) {
    return '<li data-tur="' + kacir(n.tur) + '"><span class="im">' + (ICON[n.tur] || ICON.Not) + '</span><div class="icerik"><div class="ust-bilgi"><b>' + kacir(n.tur === "Aşama" ? "Aşama" : n.tur) + "</b><span>" + kacir(n.yazar || "") + "</span><span>" + goreli(n.zaman) + '</span><button type="button" class="sil-not" data-not-sil="' + kacir(n.id) + '">Sil</button></div><p>' + kacir(n.metin) + "</p></div></li>";
  }).join("") + "</ol>";
}
function notYazHTML() {
  return '<div class="not-yaz"><div class="not-turleri" role="group" aria-label="Not türü">' + ["Not", "Arama", "Toplantı", "E-posta"].map(function (t) { return '<button type="button" data-not-tur="' + t + '" aria-pressed="' + (S.notTuru === t) + '">' + ICON[t] + t + "</button>"; }).join("") +
    '</div><textarea id="notMetin" rows="3" placeholder="Görüşmeden bir not ekle" aria-label="Not"></textarea><div class="alt"><button type="button" class="dugme kucuk" id="notEkle">Notu ekle</button></div></div>';
}
function firsatCekmece(f) {
  var m = musteri(f.musteriId), acik = acikMi(f), i = ACIK_ASAMALAR.indexOf(f.asama);
  var notlar = S.notlar.filter(function (n) { return n.firsatId === f.id; }).sort(function (a, b) { return a.zaman < b.zaman ? 1 : -1; });
  var adimlar = '<div class="adimlar" role="group" aria-label="Aşama">' + ACIK_ASAMALAR.map(function (a, j) { return '<button type="button" data-asama="' + a + '" data-asamaya="' + a + '" class="' + (j < i ? "gecti" : j === i ? "simdi" : "") + '" aria-pressed="' + (j === i) + '">' + a + "</button>"; }).join("") + "</div>";
  var durum = acik ? adimlar + '<div class="kapat-eylem"><button type="button" class="kazan" data-kapat="Kazanıldı">' + ICON.kupa + 'Kazanıldı</button><button type="button" class="kaybet" data-kapat="Kaybedildi">' + ICON.carpi + "Kaybedildi</button></div>"
    : '<div class="kapali-durum" data-asama="' + kacir(f.asama) + '">' + (f.asama === "Kazanıldı" ? ICON.kupa.replace("<svg", '<svg width="20" height="20"') : ICON.carpi.replace("<svg", '<svg width="20" height="20"')) + f.asama + " <span>" + (f.kapanis ? kacir(tarihYaz(f.kapanis)) : "") + (f.kayipNedeni ? ", " + kacir(f.kayipNedeni) : "") + '</span><button type="button" class="dugme ikincil kucuk" data-yeniden-ac>Yeniden aç</button></div>';
  return '<div class="cek-bas"><span class="asama-etiket" data-asama="' + kacir(f.asama) + '">' + kacir(f.asama) + '</span><span class="bosluk"></span><button type="button" class="ikon-dugme" data-duzenle-firsat="' + kacir(f.id) + '" aria-label="Fırsatı düzenle">' + ICON.duzenle + '</button><button type="button" class="ikon-dugme" data-sil-firsat="' + kacir(f.id) + '" aria-label="Fırsatı sil">' + ICON.cop + '</button><button type="button" class="ikon-dugme" id="cekKapat" aria-label="Kapat">' + ICON.kapat + "</button></div>" +
    '<div class="cek-govde"><h2 id="cekBaslik">' + kacir(f.baslik) + "</h2>" +
    '<div class="cek-ust">' + (m ? basResmi(m) + '<a href="#" data-kisi-ac="' + kacir(m.id) + '">' + kacir(m.ad) + "</a><span>" + kacir(m.sirket || "") + "</span>" : "<span>Kişi bağlı değil</span>") + "</div>" +
    '<div class="cek-tutar"><b>' + tl(f.tutar) + "</b><span>" + (acik ? "olasılık yüzde " + OLASILIK[f.asama] + ", ağırlıklı " + tl(Math.round((f.tutar || 0) * OLASILIK[f.asama] / 100)) : "") + "</span></div>" + durum +
    (acik ? '<div class="siradaki"><h3>' + ICON.bayrak.replace("<svg", '<svg width="16" height="16"') + 'Sıradaki adım</h3><div class="satir"><input id="adimMetin" value="' + kacir(f.adim || "") + '" placeholder="Teklifi telefonla ara" aria-label="Sıradaki adım" /><input type="date" id="adimTarih" value="' + kacir(f.adimTarihi || "") + '" aria-label="Adım tarihi" /></div><div class="eylem"><button type="button" class="dugme kucuk" id="adimKaydet">Kaydet</button>' + (f.adim ? '<button type="button" class="dugme ikincil kucuk" data-tamamla="' + kacir(f.id) + '">' + ICON.onay.replace("<svg", '<svg width="14" height="14"') + "Tamamlandı</button>" : "") + "</div></div>" : "") +
    '<div class="bilgi-izgara"><div><span>Sorumlu</span><b>' + kacir(f.sahip || "Atanmadı") + "</b></div><div><span>Açılış</span><b>" + (f.acilis ? kacir(tarihYaz(f.acilis)) : "Bilinmiyor") + "</b></div><div><span>E-posta</span><b>" + (m && m.eposta ? '<a href="mailto:' + kacir(m.eposta) + '">' + kacir(m.eposta) + "</a>" : "Yok") + "</b></div><div><span>Telefon</span><b>" + (m && m.telefon ? '<a href="tel:' + kacir(m.telefon.replace(/\s/g, "")) + '">' + kacir(m.telefon) + "</a>" : "Yok") + "</b></div></div>" +
    '<h3 class="bolum-baslik">Etkinlik <small>' + notlar.length + "</small></h3>" + notYazHTML() + notlarHTML(notlar) + "</div>";
}
function kisiCekmece(m) {
  var fl = S.firsatlar.filter(function (f) { return f.musteriId === m.id; });
  var notlar = S.notlar.filter(function (n) { return n.musteriId === m.id; }).sort(function (a, b) { return a.zaman < b.zaman ? 1 : -1; });
  return '<div class="cek-bas"><span class="sicak" data-s="' + kacir(m.sicaklik || "Ilık") + '">' + kacir(m.sicaklik || "Ilık") + '</span><span class="bosluk"></span><button type="button" class="ikon-dugme" data-duzenle-kisi="' + kacir(m.id) + '" aria-label="Kişiyi düzenle">' + ICON.duzenle + '</button><button type="button" class="ikon-dugme" data-sil-kisi="' + kacir(m.id) + '" aria-label="Kişiyi sil">' + ICON.cop + '</button><button type="button" class="ikon-dugme" id="cekKapat" aria-label="Kapat">' + ICON.kapat + "</button></div>" +
    '<div class="cek-govde"><div class="kisi-bas">' + basResmi(m, "b56") + '<div><h2 id="cekBaslik">' + kacir(m.ad) + "</h2><p>" + kacir([m.unvan, m.sirket].filter(Boolean).join(", ")) + "</p></div></div>" +
    '<div class="iletisim">' + (m.telefon ? '<a class="dugme ikincil kucuk" href="tel:' + kacir(m.telefon.replace(/\s/g, "")) + '">' + ICON.Arama + "Ara</a>" : "") + (m.eposta ? '<a class="dugme ikincil kucuk" href="mailto:' + kacir(m.eposta) + '">' + ICON["E-posta"] + "E-posta</a>" : "") + '<button type="button" class="dugme vurgu kucuk" data-kisiye-firsat="' + kacir(m.id) + '">' + ICON.arti + "Fırsat ekle</button></div>" +
    '<div class="bilgi-izgara"><div><span>E-posta</span><b>' + kacir(m.eposta || "Yok") + "</b></div><div><span>Telefon</span><b>" + kacir(m.telefon || "Yok") + "</b></div><div><span>Şehir</span><b>" + kacir(m.sehir || "Yok") + "</b></div><div><span>Kayıt</span><b>" + (m.olusturma ? new Date(m.olusturma).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : "") + "</b></div></div>" +
    '<h3 class="bolum-baslik">Fırsatlar <small>' + fl.length + "</small></h3>" + (fl.length ? fl.map(function (f) { return '<button type="button" class="mini-firsat" data-ac="' + kacir(f.id) + '"><span class="metin"><b>' + kacir(f.baslik) + '</b><span class="asama-etiket" data-asama="' + kacir(f.asama) + '">' + kacir(f.asama) + "</span></span><b>" + tl(f.tutar) + "</b></button>"; }).join("") : '<p style="color:var(--metin-3);margin:0">Bu kişiye bağlı fırsat yok.</p>') +
    '<h3 class="bolum-baslik">Notlar <small>' + notlar.length + "</small></h3>" + notYazHTML() + notlarHTML(notlar) + "</div>";
}

/* ── İşlemler ── */
function hataGoster(e) { bildir((e && e.message) || "İşlem tamamlanamadı.", "hata"); }
function notYaz(firsatId, musteriId, tur, metin) {
  var n = { firsatId: firsatId || "", musteriId: musteriId || "", tur: tur, metin: metin, yazar: BEN, zaman: new Date().toISOString() };
  var gecici = Object.assign({ id: "g" + Date.now() }, n);
  S.notlar.push(gecici);
  return Depo.ekle("notlar", n).then(function (r) { Object.assign(gecici, r); return gecici; }).catch(function (e) { S.notlar = S.notlar.filter(function (x) { return x !== gecici; }); throw e; });
}
function firsatGuncelle(f, alanlar) {
  var eski = {};
  Object.keys(alanlar).forEach(function (k) { eski[k] = f[k]; });
  Object.assign(f, alanlar);
  return Depo.guncelle("firsatlar", f.id, alanlar).catch(function (e) { Object.assign(f, eski); ciz(); throw e; });
}
function asamaDegistir(f, asama, sira, neden) {
  if (f.asama === asama && sira === undefined) return Promise.resolve();
  var onceki = f.asama, a = { asama: asama };
  if (sira !== undefined) a.sira = sira;
  if (asama === "Kazanıldı" || asama === "Kaybedildi") { a.kapanis = bugun(); a.adim = ""; a.adimTarihi = ""; a.kayipNedeni = asama === "Kaybedildi" ? neden || "" : ""; }
  else if (onceki === "Kazanıldı" || onceki === "Kaybedildi") { a.kapanis = ""; a.kayipNedeni = ""; }
  if (sira === undefined && asama !== onceki) { var l = siraliAsama(asama); a.sira = l.length ? (l[l.length - 1].sira || 0) + 10 : 10; }
  var p = firsatGuncelle(f, a);
  if (asama !== onceki) {
    var metin = asama === "Kazanıldı" ? "Fırsat kazanıldı." : asama === "Kaybedildi" ? "Fırsat kaybedildi" + (neden ? ": " + neden : ".") : onceki + " aşamasından " + asama + " aşamasına geçti.";
    p = p.then(function () { return notYaz(f.id, f.musteriId, "Aşama", metin); });
    if (asama === "Kazanıldı") { bildir("Tebrikler, " + f.baslik + " kazanıldı.", "basari"); olay("firsat_kazanildi", { tutar: f.tutar }); }
    else if (asama === "Kaybedildi") bildir(f.baslik + " kaybedildi olarak işaretlendi.");
  }
  ciz();
  return p.then(ciz).catch(hataGoster);
}
function kaybetSor(f) {
  pencereAc('<h2>Fırsat neden kaybedildi?</h2><p>Nedeni kaydetmek, ileride hangi fırsatlara odaklanacağını gösterir.</p><div class="neden-cipler">' + KAYIP_NEDENLERI.map(function (n) { return '<button type="button" class="cip yazi" data-neden="' + kacir(n) + '" aria-pressed="false">' + kacir(n) + "</button>"; }).join("") + '</div><label class="alan"><span>Açıklama</span><input id="nedenMetin" maxlength="160" placeholder="İstersen kendi cümlenle yaz" /></label><div class="eylem"><button type="button" class="dugme ikincil" data-pencere-kapat>Vazgeç</button><button type="button" class="dugme" style="background:var(--kirmizi)" id="nedenKaydet">Kaybedildi olarak kapat</button></div>', function (p) {
    $$("[data-neden]", p).forEach(function (b) { b.addEventListener("click", function () { $$("[data-neden]", p).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); $("#nedenMetin").value = b.dataset.neden; }); });
    $("#nedenKaydet", p).addEventListener("click", function () { pencereKapat(); asamaDegistir(f, "Kaybedildi", undefined, $("#nedenMetin").value.trim()); });
  });
}

/* ── Formlar ── */
var pencereSonra = null, oncekiOdak = null;
function pencereAc(html, kur) {
  var k = $("#pencere"); oncekiOdak = document.activeElement;
  $(".pencere", k).innerHTML = html;
  k.hidden = false; requestAnimationFrame(function () { k.classList.add("acik"); });
  if (kur) kur($(".pencere", k));
  var ilk = $("input, select, textarea", k); setTimeout(function () { if (ilk) ilk.focus(); }, 60);
}
function pencereKapat() { var k = $("#pencere"); k.classList.remove("acik"); setTimeout(function () { if (!k.classList.contains("acik")) k.hidden = true; }, 220); if (oncekiOdak && oncekiOdak.focus) try { oncekiOdak.focus(); } catch (e) { /* yok */ } }
function secenek(l, secili) { return l.map(function (x) { var v = typeof x === "string" ? x : x[0], y = typeof x === "string" ? x : x[1]; return '<option value="' + kacir(v) + '"' + (v === secili ? " selected" : "") + ">" + kacir(y) + "</option>"; }).join(""); }
function firsatFormu(f, varsayilan) {
  f = f || {}; varsayilan = varsayilan || {};
  var mus = S.musteriler.slice().sort(function (a, b) { return (a.sirket || a.ad).localeCompare(b.sirket || b.ad, "tr"); }).map(function (m) { return [m.id, (m.sirket ? m.sirket + ", " : "") + m.ad]; });
  pencereAc('<h2>' + (f.id ? "Fırsatı düzenle" : "Yeni fırsat") + '</h2><p>' + (f.id ? "Değişiklikler hemen kaydedilir." : "Panoya yeni bir satış fırsatı ekle.") + '</p><form id="firsatForm" class="form-izgara" novalidate>' +
    '<label class="alan tam"><span>Başlık</span><input name="baslik" required maxlength="80" value="' + kacir(f.baslik || "") + '" placeholder="Kurumsal web sitesi yenileme" /></label>' +
    '<label class="alan tam"><span>Kişi</span><select name="musteriId"><option value="">Kişi seç</option>' + secenek(mus, f.musteriId || varsayilan.musteriId) + '<option value="__yeni">Yeni kişi ekle</option></select></label>' +
    '<label class="alan"><span>Tutar (' + PB.kod + ')</span><input name="tutar" type="number" min="0" step="1000" inputmode="numeric" value="' + kacir(f.tutar != null ? f.tutar : "") + '" placeholder="150000" /></label>' +
    '<label class="alan"><span>Aşama</span><select name="asama">' + secenek(f.id ? ASAMALAR : ACIK_ASAMALAR, f.asama || varsayilan.asama || "Aday") + "</select></label>" +
    '<label class="alan"><span>Sorumlu</span><select name="sahip">' + secenek(EKIP, f.sahip || BEN) + "</select></label>" +
    '<label class="alan"><span>Adım tarihi</span><input name="adimTarihi" type="date" value="' + kacir(f.adimTarihi || gunEkle(bugun(), 2)) + '" /></label>' +
    '<label class="alan tam"><span>Sıradaki adım</span><input name="adim" maxlength="80" value="' + kacir(f.adim || (f.id ? "" : "Tanışma araması")) + '" /></label>' +
    '<p class="hata-yazi tam" id="formHata" hidden></p></form><div class="eylem"><button type="button" class="dugme ikincil" data-pencere-kapat>Vazgeç</button><button type="submit" form="firsatForm" class="dugme vurgu">' + (f.id ? "Kaydet" : "Fırsatı ekle") + "</button></div>", function (p) {
    $("select[name=musteriId]", p).addEventListener("change", function (e) { if (e.target.value === "__yeni") { pencereKapat(); setTimeout(function () { kisiFormu(null, function (m) { firsatFormu(null, { musteriId: m.id, asama: varsayilan.asama }); }); }, 230); } });
    $("#firsatForm", p).addEventListener("submit", function (e) {
      e.preventDefault();
      var v = Object.fromEntries(new FormData(e.target).entries());
      if (!v.baslik.trim()) { var h = $("#formHata"); h.textContent = "Başlık boş kalamaz."; h.hidden = false; return; }
      var a = { baslik: v.baslik.trim(), musteriId: v.musteriId === "__yeni" ? "" : v.musteriId, tutar: Number(v.tutar || 0), asama: v.asama, sahip: v.sahip, adim: v.adim.trim(), adimTarihi: v.adim.trim() ? v.adimTarihi : "" };
      var dugme = $("button[type=submit]", $("#pencere")); dugme.disabled = true;
      if (f.id) {
        var onceki = f.asama, asama = a.asama; delete a.asama;
        firsatGuncelle(f, a).then(function () { pencereKapat(); if (asama !== onceki) return asamaDegistir(f, asama); ciz(); bildir("Fırsat güncellendi."); }).catch(function (x) { dugme.disabled = false; hataGoster(x); });
      } else {
        var l = siraliAsama(a.asama); a.sira = l.length ? (l[0].sira || 0) - 10 : 10; a.acilis = bugun();
        Depo.ekle("firsatlar", a).then(function (r) {
          S.firsatlar.push(r); pencereKapat(); S.durum = "acik";
          if (S.gorunum !== "hat" && S.gorunum !== "takip") S.gorunum = "hat";
          ciz(); var k = $('[data-firsat="' + r.id + '"]'); if (k) { k.classList.add("yeni"); k.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" }); }
          bildir("Fırsat eklendi."); olay("firsat_eklendi", { tutar: r.tutar });
          return notYaz(r.id, r.musteriId, "Aşama", "Fırsat " + r.asama + " aşamasında açıldı.");
        }).catch(function (x) { dugme.disabled = false; hataGoster(x); });
      }
    });
  });
}
function kisiFormu(m, sonra) {
  m = m || {};
  pencereAc('<h2>' + (m.id ? "Kişiyi düzenle" : "Yeni kişi") + '</h2><p>Müşteri ya da aday firmadaki iletişim kişin.</p><form id="kisiForm" class="form-izgara" novalidate>' +
    '<label class="alan"><span>Ad soyad</span><input name="ad" required maxlength="60" value="' + kacir(m.ad || "") + '" /></label>' +
    '<label class="alan"><span>Şirket</span><input name="sirket" maxlength="60" value="' + kacir(m.sirket || "") + '" /></label>' +
    '<label class="alan"><span>Unvan</span><input name="unvan" maxlength="60" value="' + kacir(m.unvan || "") + '" /></label>' +
    '<label class="alan"><span>Şehir</span><input name="sehir" maxlength="40" value="' + kacir(m.sehir || "") + '" /></label>' +
    '<label class="alan"><span>E-posta</span><input name="eposta" type="email" maxlength="80" value="' + kacir(m.eposta || "") + '" /></label>' +
    '<label class="alan"><span>Telefon</span><input name="telefon" type="tel" maxlength="20" value="' + kacir(m.telefon || "") + '" /></label>' +
    '<label class="alan tam"><span>Durum</span><select name="sicaklik">' + secenek(["Sıcak", "Ilık", "Soğuk"], m.sicaklik || "Ilık") + "</select></label>" +
    '<p class="hata-yazi tam" id="formHata" hidden></p></form><div class="eylem"><button type="button" class="dugme ikincil" data-pencere-kapat>Vazgeç</button><button type="submit" form="kisiForm" class="dugme vurgu">' + (m.id ? "Kaydet" : "Kişiyi ekle") + "</button></div>", function (p) {
    $("#kisiForm", p).addEventListener("submit", function (e) {
      e.preventDefault();
      var v = Object.fromEntries(new FormData(e.target).entries()), h = $("#formHata");
      Object.keys(v).forEach(function (k) { v[k] = String(v[k]).trim(); });
      if (!v.ad) { h.textContent = "Ad soyad gerekli."; h.hidden = false; return; }
      if (v.eposta && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.eposta)) { h.textContent = "E-posta adresi geçerli görünmüyor."; h.hidden = false; return; }
      var dugme = $("button[type=submit]", $("#pencere")); dugme.disabled = true;
      var is = m.id ? Depo.guncelle("musteriler", m.id, v).then(function () { Object.assign(m, v); return m; }) : Depo.ekle("musteriler", v).then(function (r) { S.musteriler.push(r); return r; });
      is.then(function (r) { pencereKapat(); ciz(); bildir(m.id ? "Kişi güncellendi." : "Kişi eklendi."); if (sonra) setTimeout(function () { sonra(r); }, 230); }).catch(function (x) { dugme.disabled = false; hataGoster(x); });
    });
  });
}
function onayla(baslik, metin, eylem, sonra) {
  pencereAc("<h2>" + kacir(baslik) + "</h2><p>" + kacir(metin) + '</p><div class="eylem"><button type="button" class="dugme ikincil" data-pencere-kapat>Vazgeç</button><button type="button" class="dugme" style="background:var(--kirmizi)" id="onayDugme">' + kacir(eylem) + "</button></div>", function (p) {
    $("#onayDugme", p).addEventListener("click", function () { pencereKapat(); sonra(); });
  });
}
function firsatSil(f) {
  onayla("Fırsat silinsin mi?", f.baslik + " ve " + S.notlar.filter(function (n) { return n.firsatId === f.id; }).length + " notu kalıcı olarak silinecek.", "Sil", function () {
    var notlar = S.notlar.filter(function (n) { return n.firsatId === f.id; });
    S.firsatlar = S.firsatlar.filter(function (x) { return x !== f; });
    S.notlar = S.notlar.filter(function (n) { return n.firsatId !== f.id; });
    cekmeceKapat(); ciz();
    Promise.all(notlar.map(function (n) { return Depo.sil("notlar", n.id).catch(function () {}); })).then(function () { return Depo.sil("firsatlar", f.id); }).then(function () { bildir("Fırsat silindi."); }).catch(function (e) { hataGoster(e); yukle(); });
  });
}
function kisiSil(m) {
  var fl = S.firsatlar.filter(function (f) { return f.musteriId === m.id; });
  if (fl.length) { bildir(m.ad + " kişisine bağlı " + fl.length + " fırsat var. Önce fırsatları sil ya da başka kişiye bağla.", "hata"); return; }
  onayla("Kişi silinsin mi?", m.ad + " ve notları kalıcı olarak silinecek.", "Sil", function () {
    var notlar = S.notlar.filter(function (n) { return n.musteriId === m.id; });
    S.musteriler = S.musteriler.filter(function (x) { return x !== m; });
    S.notlar = S.notlar.filter(function (n) { return n.musteriId !== m.id; });
    cekmeceKapat(); ciz();
    Promise.all(notlar.map(function (n) { return Depo.sil("notlar", n.id).catch(function () {}); })).then(function () { return Depo.sil("musteriler", m.id); }).then(function () { bildir("Kişi silindi."); }).catch(function (e) { hataGoster(e); yukle(); });
  });
}
function adimTamamla(f) {
  var adim = f.adim;
  if (!adim) return;
  var satir = $('[data-gorev="' + f.id + '"]'); if (satir) { var o = $(".onay", satir); if (o) o.classList.add("isaretli"); satir.classList.add("bitti"); }
  setTimeout(function () {
    firsatGuncelle(f, { adim: "", adimTarihi: "" }).then(function () { return notYaz(f.id, f.musteriId, "Not", "Tamamlandı: " + adim); }).then(function () {
      ciz(); bildir("Adım tamamlandı. Sıradaki adımı planla.", "basari");
      if (!S.cekmece || S.cekmece.id !== f.id) cekmeceAc("firsat", f.id); else cekmeceCiz();
      setTimeout(function () { var i = $("#adimMetin"); if (i) { i.focus(); i.scrollIntoView({ block: "center", behavior: "smooth" }); } }, 380);
    }).catch(hataGoster);
  }, satir ? 320 : 0);
}

/* ── Olaylar ── */
document.addEventListener("click", function (e) {
  var t = e.target;
  var g = t.closest("[data-git]"); if (g) { S.gorunum = g.dataset.git; ciz(); window.scrollTo(0, 0); return; }
  if (t.closest("#yeniDugme")) { if (S.gorunum === "kisiler") kisiFormu(); else firsatFormu(); return; }
  var d = t.closest("[data-durum]"); if (d) { S.durum = d.dataset.durum; ciz(); return; }
  var sh = t.closest("[data-sahip]"); if (sh) { S.sahip = sh.dataset.sahip; ciz(); return; }
  var ea = t.closest("[data-ekle-asama]"); if (ea) { firsatFormu(null, { asama: ea.dataset.ekleAsama }); return; }
  var k = t.closest(".kart[data-firsat]"); if (k) { if (surukleBitti) { surukleBitti = false; return; } cekmeceAc("firsat", k.dataset.firsat); return; }
  var tm = t.closest("[data-tamamla]"); if (tm) { var tf = firsat(tm.dataset.tamamla); if (tf) adimTamamla(tf); return; }
  var ac = t.closest("[data-ac]"); if (ac) { cekmeceAc("firsat", ac.dataset.ac); return; }
  var ks = t.closest("[data-kisi]"); if (ks) { cekmeceAc("kisi", ks.dataset.kisi); return; }
  var ka = t.closest("[data-kisi-ac]"); if (ka) { e.preventDefault(); cekmeceAc("kisi", ka.dataset.kisiAc); return; }
  if (t.closest("#cekKapat") || t.closest("#perde")) { cekmeceKapat(); return; }
  if (t.closest("[data-pencere-kapat]") || t.id === "pencere") { pencereKapat(); return; }
  var nt = t.closest("[data-not-tur]"); if (nt) { S.notTuru = nt.dataset.notTur; $$("[data-not-tur]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === nt)); }); $("#notMetin").focus(); return; }
  if (t.closest("#notEkle")) {
    var metin = $("#notMetin").value.trim(), c = S.cekmece;
    if (!metin) { $("#notMetin").focus(); return; }
    var fr = c.tur === "firsat" ? firsat(c.id) : null;
    $("#notMetin").value = "";
    notYaz(fr ? fr.id : "", fr ? fr.musteriId : c.id, S.notTuru, metin).then(function () { cekmeceCiz(); ciz(); }).catch(hataGoster);
    cekmeceCiz();
    return;
  }
  var ns = t.closest("[data-not-sil]"); if (ns) { var n = S.notlar.find(function (x) { return x.id === ns.dataset.notSil; }); if (n) { S.notlar = S.notlar.filter(function (x) { return x !== n; }); cekmeceCiz(); ciz(); Depo.sil("notlar", n.id).catch(function (x) { S.notlar.push(n); cekmeceCiz(); hataGoster(x); }); } return; }
  var aa = t.closest("[data-asamaya]"); if (aa && S.cekmece) { var af = firsat(S.cekmece.id); if (af) asamaDegistir(af, aa.dataset.asamaya); return; }
  var kp = t.closest("[data-kapat]"); if (kp && S.cekmece) { var kf = firsat(S.cekmece.id); if (!kf) return; if (kp.dataset.kapat === "Kaybedildi") kaybetSor(kf); else asamaDegistir(kf, "Kazanıldı"); return; }
  if (t.closest("[data-yeniden-ac]") && S.cekmece) { var yf = firsat(S.cekmece.id); if (yf) asamaDegistir(yf, "Pazarlık"); return; }
  if (t.closest("#adimKaydet") && S.cekmece) {
    var sf = firsat(S.cekmece.id), am = $("#adimMetin").value.trim(), at = $("#adimTarih").value;
    if (am && !at) at = gunEkle(bugun(), 1);
    firsatGuncelle(sf, { adim: am, adimTarihi: am ? at : "" }).then(function () { ciz(); bildir("Sıradaki adım kaydedildi."); }).catch(hataGoster);
    ciz(); return;
  }
  var df = t.closest("[data-duzenle-firsat]"); if (df) { firsatFormu(firsat(df.dataset.duzenleFirsat)); return; }
  var sf2 = t.closest("[data-sil-firsat]"); if (sf2) { firsatSil(firsat(sf2.dataset.silFirsat)); return; }
  var dk = t.closest("[data-duzenle-kisi]"); if (dk) { kisiFormu(musteri(dk.dataset.duzenleKisi)); return; }
  var sk = t.closest("[data-sil-kisi]"); if (sk) { kisiSil(musteri(sk.dataset.silKisi)); return; }
  var kf2 = t.closest("[data-kisiye-firsat]"); if (kf2) { firsatFormu(null, { musteriId: kf2.dataset.kisiyeFirsat }); return; }
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") { if (!$("#pencere").hidden) pencereKapat(); else if (S.cekmece) cekmeceKapat(); }
  if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches(".gorev .metin")) { e.preventDefault(); cekmeceAc("firsat", e.target.dataset.ac); }
  if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $("#ara").focus(); }
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && e.target.id === "notMetin") $("#notEkle").click();
});
$("#ara").addEventListener("input", function (e) { S.ara = e.target.value.trim().toLocaleLowerCase("tr"); ciz(); });
document.addEventListener("change", function (e) {
  if (e.target.id === "hedefGir") { var v = Math.max(0, Number(e.target.value) || 0); localStorage.setItem("bag-crm-hedef", String(v || 750000)); ciz(); }
  if (e.target.id === "pbSec") { pbKaydet(e.target.value).then(function () { bildir("Tutarlar artık " + PB.kod + " ile gösteriliyor."); }).catch(function (x) { bildir(x.message, "hata"); }); ciz(); }
});

/* ── Sürükle bırak: fare hemen, dokunmatik kısa basılı tutunca başlar ── */
var aday = null, sur = null, surukleBitti = false, otoKaydir = 0;
document.addEventListener("touchmove", function (e) { if (sur) e.preventDefault(); }, { passive: false });
document.addEventListener("pointerdown", function (e) {
  var k = e.target.closest && e.target.closest(".kart[data-firsat]");
  if (!k || (e.pointerType === "mouse" && e.button !== 0)) return;
  aday = { kart: k, x: e.clientX, y: e.clientY, tur: e.pointerType, id: e.pointerId, zaman: 0 };
  if (e.pointerType !== "mouse") aday.zaman = setTimeout(function () { if (aday) { if (navigator.vibrate) try { navigator.vibrate(12); } catch (x) { /* yok */ } surukleBasla(aday.x, aday.y); } }, 280);
});
document.addEventListener("pointermove", function (e) {
  if (sur) { e.preventDefault(); surukleTasi(e.clientX, e.clientY); return; }
  if (!aday || e.pointerId !== aday.id) return;
  var d = Math.hypot(e.clientX - aday.x, e.clientY - aday.y);
  if (aday.tur === "mouse") { if (d > 5) surukleBasla(e.clientX, e.clientY); }
  else if (d > 10) { clearTimeout(aday.zaman); aday = null; }
  else { aday.x = e.clientX; aday.y = e.clientY; }
});
function birak(e) {
  if (aday) { clearTimeout(aday.zaman); aday = null; }
  if (sur) surukleBitir(e && e.type !== "pointercancel");
}
document.addEventListener("pointerup", birak);
document.addEventListener("pointercancel", birak);
document.addEventListener("contextmenu", function (e) { if (sur || (aday && aday.tur !== "mouse")) e.preventDefault(); });

function surukleBasla(x, y) {
  var k = aday.kart, r = k.getBoundingClientRect();
  clearTimeout(aday.zaman); aday = null;
  var h = k.cloneNode(true); h.classList.add("hayalet"); h.style.width = r.width + "px";
  document.body.appendChild(h);
  var yer = document.createElement("div"); yer.className = "yer-tutucu";
  sur = { kart: k, hayalet: h, dx: x - r.left, dy: y - r.top, yer: yer, hedef: null, kapat: null, x: x, y: y, id: k.dataset.firsat };
  k.classList.add("yer");
  document.body.classList.add("surukleniyor");
  var pano = $("#pano"); if (pano) pano.classList.add("surukle-kaydir");
  $("#birak").classList.add("acik");
  surukleTasi(x, y);
  otoKaydir = requestAnimationFrame(kaydirDongu);
}
function surukleTasi(x, y) {
  sur.x = x; sur.y = y;
  sur.hayalet.style.transform = "translate(" + (x - sur.dx) + "px," + (y - sur.dy) + "px) rotate(2deg)";
  var el = document.elementFromPoint(x, y);
  var kapat = el && el.closest("[data-birak]");
  $$("[data-birak]").forEach(function (b) { b.classList.toggle("hedef", b === kapat); });
  sur.kapat = kapat ? kapat.dataset.birak : null;
  var sutun = !kapat && el && el.closest(".sutun");
  $$(".sutun").forEach(function (s) { s.classList.toggle("hedef", s === sutun); });
  if (!sutun) { if (sur.yer.parentNode) sur.yer.remove(); sur.hedef = null; return; }
  var liste = $(".kartlar", sutun), kartlar = $$(".kart:not(.yer)", liste), once = null;
  for (var i = 0; i < kartlar.length; i++) { var r = kartlar[i].getBoundingClientRect(); if (y < r.top + r.height / 2) { once = kartlar[i]; break; } }
  var bos = $(".bos-sutun", liste); if (bos) bos.hidden = true;
  if (once) liste.insertBefore(sur.yer, once); else liste.appendChild(sur.yer);
  sur.hedef = { asama: sutun.dataset.asama, once: once ? once.dataset.firsat : null };
}
function kaydirDongu() {
  if (!sur) return;
  var pano = $("#pano"), x = sur.x, y = sur.y, W = innerWidth, H = innerHeight, kenar = 56;
  if (pano && pano.scrollWidth > pano.clientWidth) {
    if (x < kenar) pano.scrollLeft -= Math.ceil((kenar - x) / 4);
    else if (x > W - kenar) pano.scrollLeft += Math.ceil((x - (W - kenar)) / 4);
  }
  if (y < 70) window.scrollBy(0, -Math.ceil((70 - y) / 5));
  else if (y > H - 110 && !sur.kapat) window.scrollBy(0, Math.ceil((y - (H - 110)) / 6));
  otoKaydir = requestAnimationFrame(kaydirDongu);
  surukleTasi(x, y);
}
function surukleBitir(gecerli) {
  var s = sur; sur = null; cancelAnimationFrame(otoKaydir);
  s.hayalet.remove(); s.kart.classList.remove("yer"); if (s.yer.parentNode) s.yer.remove();
  document.body.classList.remove("surukleniyor");
  $$(".sutun").forEach(function (x) { x.classList.remove("hedef"); });
  $$("[data-birak]").forEach(function (x) { x.classList.remove("hedef"); });
  $("#birak").classList.remove("acik");
  var pano = $("#pano"); if (pano) pano.classList.remove("surukle-kaydir");
  surukleBitti = true; setTimeout(function () { surukleBitti = false; }, 60);
  var f = firsat(s.id); if (!f || !gecerli) { ciz(); return; }
  if (s.kapat) { if (s.kapat === "Kaybedildi") { ciz(); kaybetSor(f); } else asamaDegistir(f, "Kazanıldı"); return; }
  if (!s.hedef) { ciz(); return; }
  var l = siraliAsama(s.hedef.asama).filter(function (x) { return x.id !== f.id; }), i = s.hedef.once ? l.findIndex(function (x) { return x.id === s.hedef.once; }) : l.length;
  if (i < 0) i = l.length;
  var onceki = l[i - 1], sonraki = l[i], sira;
  if (!onceki && !sonraki) sira = 10; else if (!onceki) sira = (sonraki.sira || 0) - 10; else if (!sonraki) sira = (onceki.sira || 0) + 10; else sira = ((onceki.sira || 0) + (sonraki.sira || 0)) / 2;
  if (f.asama === s.hedef.asama && f.sira === sira) { ciz(); return; }
  asamaDegistir(f, s.hedef.asama, sira);
  var yeni = $('[data-firsat="' + f.id + '"]'); if (yeni) yeni.classList.add("yeni");
}

yukle();
`;

const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#4136e0"/><circle cx="11.5" cy="16" r="5.2" fill="none" stroke="#fff" stroke-width="2.6"/><circle cx="20.5" cy="16" r="5.2" fill="none" stroke="#c9c5ff" stroke-width="2.6"/></svg>';
const NAV = (k: string, y: string, ikon: string, rozet = "") => `<button type="button" data-git="${k}"${k === "hat" ? ' aria-current="page"' : ""}>${ikon}<span>${y}</span>${rozet}</button>`;
const IK = {
  hat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/><rect x="17" y="4" width="4" height="7" rx="1.5"/></svg>',
  kisiler: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.4c1.9.8 3 2.8 3 5.6"/></svg>',
  takip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
};

const HTML = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Bağ · Müşteri Hattı</title>
  <meta name="description" content="Küçük satış ekipleri için müşteri takibi: aşama aşama fırsat panosu, takip edilecek adımlar, kişiler ve notlar." />
  <meta name="theme-color" content="#17181c" />
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="manifest" href="manifest.webmanifest" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <div class="kabuk">
    <aside class="yan">
      <div class="marka">${LOGO}<div>Bağ<small>Müşteri hattı</small></div></div>
      <nav class="nav" aria-label="Bölümler">
        ${NAV("hat", "Satış hattı", IK.hat)}
        ${NAV("kisiler", "Kişiler", IK.kisiler)}
        ${NAV("takip", "Takip", IK.takip, '<span class="rozet" data-rozet hidden>0</span>')}
      </nav>
      <div class="yan-alt">
        <div class="ekip-kart"><b>Satış ekibi</b><span>Ece, Onur ve Sena</span>
          <div class="ekip-yuzler"><img class="bas b32" src="/gercek/paz/av-yuna.webp" alt="Ece Kaya" /><img class="bas b32" src="/gercek/paz/av-stefan.webp" alt="Onur Aydın" /><img class="bas b32" src="/gercek/paz/av-nia.webp" alt="Sena Er" /></div>
        </div>
        <p class="mod-yazi" id="modYazi"><i></i><span>Bağlanıyor</span></p>
      </div>
    </aside>
    <main class="ana">
      <header class="ust">
        <div class="baslik-kap"><h1 id="baslik">Satış hattı</h1><div class="alt-baslik" id="altBaslik"></div></div>
        <span class="bosluk"></span>
        <label class="ara"><span class="gorunmez" hidden>Ara</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="ara" type="search" placeholder="Fırsat, kişi ya da şirket ara" aria-label="Ara" autocomplete="off" /></label>
        <button type="button" class="dugme vurgu" id="yeniDugme"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span>Yeni fırsat</span></button>
      </header>
      <div id="icerik"></div>
    </main>
  </div>

  <div class="birak" id="birak" aria-hidden="true">
    <div data-birak="Kazanıldı" data-asama="Kazanıldı"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v3M8.5 20h7M10 17h4"/></svg>Kazanıldı</div>
    <div data-birak="Kaybedildi" data-asama="Kaybedildi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/></svg>Kaybedildi</div>
  </div>
  <div class="perde" id="perde"></div>
  <aside class="cekmece" id="cekmece" role="dialog" aria-modal="true" aria-labelledby="cekBaslik" aria-hidden="true"></aside>
  <div class="pencere-kap" id="pencere" role="dialog" aria-modal="true" hidden><div class="pencere"></div></div>
  <div id="bildirim" class="bildirim" role="status" aria-live="polite"></div>

  <script src="app.js"></script>
</body>
</html>
`;

export const MINI_CRM = {
  id: "mini-crm",
  ad: "Bağ · Müşteri Hattı",
  tur: "uygulama" as const,
  aciklama: "Küçük satış ekipleri için mini CRM: fare ve dokunmatikle sürüklenen fırsat panosu, aşama toplamları, ağırlıklı tahmin, geciken takipler, kişiler ve not zaman çizelgesi",
  kapak: "/gercek/build/sablon/mini-crm.webp",
  get tablolar() { return tablolarKur(); },
  dosyalar: {
    "index.html": HTML,
    "manifest.webmanifest": JSON.stringify({ name: "Bağ · Müşteri Hattı", short_name: "Bağ", lang: "tr", start_url: "./index.html", display: "standalone", background_color: "#f3f2ee", theme_color: "#17181c", icons: [{ src: "ikon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }] }, null, 2),
    "ikon.svg": '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#4136e0"/><circle cx="196" cy="256" r="84" fill="none" stroke="#fff" stroke-width="40"/><circle cx="316" cy="256" r="84" fill="none" stroke="#c9c5ff" stroke-width="40"/></svg>',
    "stil.css": STIL,
    "app.js": UYGULAMA,
  },
};
