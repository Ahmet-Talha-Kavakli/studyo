import { dilimFark, dilimGecerli, dilimTarih, dilimZaman } from "./bolge";
/**
 * Vayra Build sistemleri (otomasyonlar), sürüm 2: tetikleyiciler + ağaç biçiminde adımlar. İstemci ve sunucu ortak
 * tanımlar: veri modeli, adım kataloğu, ağaç yardımcıları (numaralandırma, ekleme, silme, taşıma), eski kayıtların
 * göçü, iki sürüm arasındaki fark, zamanlama hesabı (Türkiye saati) ve hazır sistemler.
 *
 * Ağaç: yönlendirici, sınıflandırıcı ve onay adımlarının dalları (dallar), döngünün gövdesi (govde) ve her adımın
 * isteğe bağlı hata dalı (hataDali) vardır. Dallar bitince akış bir sonraki adımda birleşir.
 */
/**
 * Zamanlama (Türkiye saati). saatler günde birden çok saat; ayGunleri ayın günleri (32: ayın son günü); "ozel" cron
 * ifadesiyle (dakika saat gün ay haftagünü). baslangic ve bitis YYYY-AA-GG (dahil). tolerans: sunucu kapalıyken
 * kaçırılan çalışma bu kadar dakika içinde yakalanırsa bir kez çalışır (0: kaçırılan çalışmaz).
 */
export type Zamanlama = {
  siklik: "dakikalik" | "saatlik" | "gunluk" | "haftalik" | "aylik" | "ozel";
  her?: number; saat?: string; saatler?: string[]; gunler?: number[]; ayGunu?: number; ayGunleri?: number[];
  cron?: string; baslangic?: string; bitis?: string; tolerans?: number;
  /** IANA saat dilimi (America/New_York, Europe/London); yoksa Türkiye saati (eski sistemler bu varsayımla kuruldu). */
  saatDilimi?: string;
};
/** Zamanlamanın saat dilimi. */
export const zamanDilimi = (z: Pick<Zamanlama, "saatDilimi">) => (z.saatDilimi && dilimGecerli(z.saatDilimi) ? z.saatDilimi : "Europe/Istanbul");
export type VeriOlay = "ekle" | "guncelle" | "sil";
/** Girdi alanı: elle çalıştırma formu, Sistemi çağır adımı, API ve MCP aracının şeması. */
/** Girdi alanı: elle çalıştırma formu, form sayfası, Sistemi çağır adımı, API ve MCP aracının şeması. telefon, coklu (çoklu seçim) ve gizli alanlar form sayfası için. */
export type GirdiTuru = "metin" | "uzunMetin" | "sayi" | "evet-hayir" | "tarih" | "secim" | "eposta" | "telefon" | "coklu" | "gizli";
export type GirdiAlani = { ad: string; etiket?: string; tur: GirdiTuru; zorunlu?: boolean; varsayilan?: string; secenekler?: string[]; aciklama?: string; yer?: string };
/** Form sayfasının bitişi: teşekkür metni, sistemin yanıtı (Yanıt ver adımı ya da son çıktı) ya da başka adrese yönlendirme. */
export type FormBitis = "mesaj" | "sonuc" | "yonlendir";
export type Tetikleyici =
  | { id: string; tur: "elle"; form?: boolean }
  | { id: string; tur: "zaman"; zaman: Zamanlama }
  | { id: string; tur: "webhook"; anahtarSonu?: string; yanit?: string; dogrulama?: string; /** İmzalı web kancası türü (sistemTetikKatalog KANCA_IMZALARI) ve özel imzada başlık adı. */ imza?: string; imzaBaslik?: string; /** Yanıt: hemen kabul, akış bitince son çıktı (Yanıt ver adımı varsa o). */ yanitModu?: "hemen" | "bitince" }
  | { id: string; tur: "form"; projeId: string }
  | { id: string; tur: "veri"; projeId: string; koleksiyon: string; olaylar?: VeriOlay[] }
  | { id: string; tur: "sistem"; sistemId: string }
  | { id: string; tur: "rss"; adres: string; aralik: number }
  | { id: string; tur: "eposta"; gonderen?: string }
  | { id: string; tur: "odeme"; projeId: string; durumlar?: OdemeDurum[]; test?: boolean }
  | { id: string; tur: "formSayfasi"; baslik?: string; aciklama?: string; dugme?: string; bitis?: FormBitis; mesaj?: string; yonlendir?: string; tekrar?: boolean }
  | { id: string; tur: "servis"; servis: string; olay: string; ayar?: Record<string, string>; aralik: number; baglanti?: string }
  | { id: string; tur: "isletme"; projeId: string; olay: import("./sistemTetikKatalog").IsletmeOlay }
  | { id: string; tur: "sohbet"; baslik?: string; altBaslik?: string; karsilama?: string; oneriler?: string[]; yerTutucu?: string; alanAdlari?: string; gecmis?: number };
/** Vayra Ödeme sipariş durumları (odeme.ts SiparisDurum ile aynı; bekleyen siparişler tetiklemez). */
export type OdemeDurum = "odendi" | "iade" | "basarisiz";
export const ODEME_DURUMLARI: { id: OdemeDurum; ad: string; alt: string }[] = [
  { id: "odendi", ad: "Ödendi", alt: "Ödeme doğrulanınca" }, { id: "iade", ad: "İade edildi", alt: "Ödeme iade edilince" }, { id: "basarisiz", ad: "Başarısız", alt: "Ödeme reddedilince" },
];
export type TetikTuru = Tetikleyici["tur"];

export type AdimTuru = "ajan" | "arac" | "baglanti" | "http" | "kosul" | "veri" | "bekle" | "yonlendirici" | "siniflandir" | "dongu" | "onay" | "kod" | "donustur" | "cagir" | "guvenlik" | "yanit" | "paralel" | "depo" | "uygulama";
/** Tuvaldeki not kartı (akışı etkilemez). x: kök sütunun ortasına göre, y: tuvalin üstüne göre (piksel). */
export type NotKarti = { id: string; metin: string; renk: "sari" | "mavi" | "mor" | "gri"; x: number; y: number };
export type Kosul = { sol: string; islec: string; sag: string };
export type Dal = { id: string; ad: string; aciklama?: string; kosullar?: Kosul[]; baglac?: "ve" | "veya"; yedek?: boolean; adimlar: Adim[] };
export type Tekrar = { sayi: number; bekleme: number; artan: boolean };
export type CiktiAlani = { ad: string; tur: "metin" | "sayi" | "evet-hayir" | "liste" | "nesne"; aciklama?: string };
export type HataIlkesi = "durdur" | "devam" | "dal" | "yedek";
export type Adim = {
  id: string; ad: string; tur: AdimTuru;
  /** Türüne göre ayarlar (yalnız metin, sayı, evet-hayır). Metin alanlarında {{tetik.alan}}, {{adim.<kimlik>.alan}} kullanılır. */
  ayar: Record<string, unknown>;
  hata: HataIlkesi;
  tekrar?: Tekrar;
  hataDali?: Adim[];
  /** Hata dalı bitince: akışı bitir ya da ana akışa devam et. */
  hataSonrasi?: "bitir" | "devam";
  /** Koşul adımı (süzgeç) için. */
  kosullar?: Kosul[]; baglac?: "ve" | "veya";
  /** Yönlendirici, sınıflandırıcı ve onay dalları. Son dal yedek ("Hiçbiri uymazsa"). */
  dallar?: Dal[];
  /** Döngü gövdesi: listedeki her öğe için. */
  govde?: Adim[];
  /** Ajan adımının yapılandırılmış çıktı alanları. */
  alanlar?: CiktiAlani[];
  kapali?: boolean;
};

export const TETIK_TURLERI: { tur: TetikTuru; ad: string; alt: string }[] = [
  { tur: "elle", ad: "Elle", alt: "Çalıştır düğmesiyle" },
  { tur: "zaman", ad: "Zamanlı", alt: "Belirli aralıklarla, seçtiğin saat diliminde" },
  { tur: "webhook", ad: "Web kancası", alt: "Başka bir uygulama adrese istek atınca" },
  { tur: "form", ad: "Site formu", alt: "Build sitende form gönderilince" },
  { tur: "veri", ad: "Veri tablosu", alt: "Kayıt eklenince, güncellenince ya da silinince" },
  { tur: "sistem", ad: "Başka sistem", alt: "Seçtiğin sistem başarıyla bitince" },
  { tur: "rss", ad: "RSS akışı", alt: "Akışta yeni öğe çıkınca, düzenli yoklamayla" },
  { tur: "eposta", ad: "Gelen e-posta", alt: "Sisteme özel adrese e-posta gelince" },
  { tur: "odeme", ad: "Ödeme alındı", alt: "Vayra Ödeme ile sipariş ödenince ya da iade edilince" },
  { tur: "formSayfasi", ad: "Form sayfası", alt: "Sistemin herkese açık formu doldurulunca" },
  { tur: "sohbet", ad: "Sohbet", alt: "Sohbet sayfasına ya da sitene gömülen kutuya mesaj gelince" },
  { tur: "servis", ad: "Servis olayı", alt: "Trendyol siparişi, yeni E-Tablolar satırı, Gmail iletisi gibi" },
  { tur: "isletme", ad: "İşletme olayı", alt: "Mağaza siparişi, randevu, yorum, abone ya da terk edilen sepet" },
];
export const VERI_OLAYLARI: { id: VeriOlay; ad: string; alt: string }[] = [
  { id: "ekle", ad: "Eklenince", alt: "Yeni kayıt yazılınca" }, { id: "guncelle", ad: "Güncellenince", alt: "Var olan kayıt değişince" }, { id: "sil", ad: "Silinince", alt: "Kayıt silinince" },
];

/* ───────────── Veri tablosu adımı ───────────── */
export type VeriIslem = "ekle" | "bul" | "getir" | "guncelle" | "upsert" | "sil" | "say";
export const VERI_ISLEMLERI: { id: VeriIslem; ad: string; alt: string; adimAdi: string }[] = [
  { id: "ekle", ad: "Kayıt ekle", alt: "Tabloya yeni satır yazar", adimAdi: "Kayıt ekle" },
  { id: "bul", ad: "Kayıt bul", alt: "Süzgeç, arama ve sıralamayla listeler", adimAdi: "Kayıt bul" },
  { id: "getir", ad: "Tek kaydı getir", alt: "Kimliğiyle bir kaydı okur", adimAdi: "Kaydı getir" },
  { id: "guncelle", ad: "Kayıt güncelle", alt: "Kimlikle ya da süzgeçle bulunanları değiştirir", adimAdi: "Kayıt güncelle" },
  { id: "upsert", ad: "Varsa güncelle, yoksa ekle", alt: "Eşleşme alanına göre tek kayıt", adimAdi: "Güncelle ya da ekle" },
  { id: "sil", ad: "Kayıt sil", alt: "Kimlikle ya da süzgeçle bulunanları siler", adimAdi: "Kayıt sil" },
  { id: "say", ad: "Kayıtları say", alt: "Süzgece uyan kayıt sayısı", adimAdi: "Kayıtları say" },
];
/** Veri tablosu süzgeç işleçleri (veri.ts Suzgec ile aynı kimlikler). */
export const VERI_ISLECLERI: { id: string; ad: string; tek?: boolean }[] = [
  { id: "esit", ad: "eşitse" }, { id: "esitDegil", ad: "eşit değilse" }, { id: "icerir", ad: "içeriyorsa" }, { id: "baslar", ad: "ile başlıyorsa" },
  { id: "buyuk", ad: "büyükse" }, { id: "buyukEsit", ad: "büyük ya da eşitse" }, { id: "kucuk", ad: "küçükse" }, { id: "kucukEsit", ad: "küçük ya da eşitse" },
  { id: "dolu", ad: "doluysa", tek: true }, { id: "bos", ad: "boşsa", tek: true },
];
export const veriIslemi = (a: Pick<Adim, "ayar">): VeriIslem => (VERI_ISLEMLERI.some((x) => x.id === a.ayar.islem) ? (a.ayar.islem as VeriIslem) : "ekle");

/* ───────────── Güvenlik denetimi adımı ───────────── */
export const GUVENLIK_DENETIMLERI: { id: string; ad: string; alt: string; ornek: string }[] = [
  { id: "tc", ad: "TC kimlik numarası", alt: "11 hane, sağlama denetimiyle", ornek: "10000000146" },
  { id: "iban", ad: "IBAN", alt: "TR ve yabancı IBAN, mod 97 denetimiyle", ornek: "TR33 0006 1005 1978 6457 8413 26" },
  { id: "telefon", ad: "Telefon numarası", alt: "Türkiye cep ve sabit, uluslararası biçim", ornek: "0532 123 45 67" },
  { id: "eposta", ad: "E-posta adresi", alt: "ad@alan.com biçimindeki adresler", ornek: "ayse@ornek.com" },
  { id: "kart", ad: "Kart numarası", alt: "13 ile 19 hane, Luhn denetimiyle", ornek: "4111 1111 1111 1111" },
  { id: "anahtar", ad: "Gizli anahtar sızıntısı", alt: "API anahtarı, erişim belirteci, özel anahtar", ornek: "sk-proj-…" },
  { id: "uygunsuz", ad: "Uygunsuz içerik", alt: "Yapay zekâ yönlendirici ile: nefret, taciz, şiddet, cinsellik", ornek: "" },
];

export type AdimGrubu = "ai" | "eylem" | "akis" | "veri";
export const ADIM_GRUPLARI: { id: AdimGrubu; ad: string }[] = [
  { id: "ai", ad: "Yapay zekâ" }, { id: "eylem", ad: "Eylemler" }, { id: "akis", ad: "Akış" }, { id: "veri", ad: "Veri" },
];
export const ADIM_TURLERI: { tur: AdimTuru; ad: string; alt: string; grup: AdimGrubu }[] = [
  { tur: "ajan", ad: "Ajan", alt: "Ajanın ya da Vayra'nın görevi yapması, istersen alanlarla", grup: "ai" },
  { tur: "siniflandir", ad: "Yapay zekâ yönlendirici", alt: "Model metni okur, en uygun dalı seçer", grup: "ai" },
  { tur: "arac", ad: "Vayra aracı", alt: "Görsel, video, müzik, ses, 3D üret", grup: "ai" },
  { tur: "uygulama", ad: "Uygulama eylemi", alt: "Slack, Telegram, Resend, Notion gibi servislerde hazır eylem", grup: "eylem" },
  { tur: "baglanti", ad: "Bağlantı", alt: "Bağlı MCP servisinin aracını çalıştır", grup: "eylem" },
  { tur: "http", ad: "HTTP isteği", alt: "Herhangi bir API'ye istek gönder", grup: "eylem" },
  { tur: "guvenlik", ad: "Güvenlik denetimi", alt: "Kişisel veri, gizli anahtar ve uygunsuz içerik", grup: "ai" },
  { tur: "veri", ad: "Veri tablosu", alt: "Kayıt ekle, bul, güncelle, sil ya da say", grup: "eylem" },
  { tur: "cagir", ad: "Sistemi çağır", alt: "Başka bir sistemi girdilerle çalıştır", grup: "eylem" },
  { tur: "yanit", ad: "Yanıt ver", alt: "Form, sohbet ve API'ye akışın içinden yanıt döndür", grup: "eylem" },
  { tur: "kosul", ad: "Süzgeç", alt: "Koşul tutmazsa sistem burada durur", grup: "akis" },
  { tur: "yonlendirici", ad: "Yönlendirici", alt: "2 ile 10 dal, her dalın kendi koşulu", grup: "akis" },
  { tur: "dongu", ad: "Döngü", alt: "Listedeki her öğe için adımları çalıştır", grup: "akis" },
  { tur: "paralel", ad: "Paralel dallar", alt: "Dallar aynı anda çalışır, sonuçlar birleşir", grup: "akis" },
  { tur: "bekle", ad: "Bekle", alt: "Süre, tarih ya da dış çağrı gelene kadar", grup: "akis" },
  { tur: "onay", ad: "İnsan onayı", alt: "Onayla, reddet ya da düzenleyip onayla", grup: "akis" },
  { tur: "donustur", ad: "Dönüştür", alt: "Metin, sayı, tarih, JSON, liste ve CSV işlemleri", grup: "veri" },
  { tur: "kod", ad: "Kod", alt: "JavaScript ile veriyi işle, JSON döndür", grup: "veri" },
  { tur: "depo", ad: "Depo", alt: "Çalışmalar arası değer sakla, say, tekrarı ayıkla", grup: "veri" },
];
export const adimTuruAdi = (t: AdimTuru) => ADIM_TURLERI.find((x) => x.tur === t)?.ad ?? t;
/** Ekleme menüsündeki hazır yardımcılar: sık kullanılan ayarlarla gelen adımlar (biçimlendirici, toplayıcı, tekilleştirici). */
export const ADIM_HAZIRLARI: { id: string; ad: string; alt: string; tur: AdimTuru; adimAdi: string; ayar: Record<string, unknown> }[] = [
  { id: "alan-ayarla", ad: "Alanları ayarla", alt: "Yeni bir nesne kur, alanları türüyle ver", tur: "donustur", adimAdi: "Alanları ayarla", ayar: { grup: "json", islem: "ayarla", satirlar: "[]" } },
  { id: "topla", ad: "Topla ve grupla", alt: "Listeyi alana göre grupla, say ve topla", tur: "donustur", adimAdi: "Grupla ve say", ayar: { grup: "liste", islem: "grupla", deger: "" } },
  { id: "ozetle", ad: "Sayıları özetle", alt: "Toplam, ortalama, en küçük ve en büyük", tur: "donustur", adimAdi: "Sayıları özetle", ayar: { grup: "liste", islem: "ozetle", deger: "" } },
  { id: "sirala", ad: "Listeyi sırala ve süz", alt: "Alana göre sırala ya da değere göre süz", tur: "donustur", adimAdi: "Sırala", ayar: { grup: "liste", islem: "sirala", deger: "" } },
  { id: "arama", ad: "Arama tablosu", alt: "Anahtara karşılık değer, bulunamazsa varsayılan", tur: "donustur", adimAdi: "Arama tablosu", ayar: { grup: "yardimci", islem: "arama", deger: "" } },
  { id: "csv", ad: "CSV oku", alt: "CSV metnini tabloya, tabloyu CSV'ye çevir", tur: "donustur", adimAdi: "CSV metnini tabloya çevir", ayar: { grup: "yardimci", islem: "csvOku", deger: "" } },
  { id: "tarih", ad: "Tarihi biçimle", alt: "Türkçe tarih, gün ekle, iki tarih farkı", tur: "donustur", adimAdi: "Türkçe biçimle", ayar: { grup: "tarih", islem: "bicim", deger: "{{simdi}}", p1: "uzun" } },
  { id: "tekrar", ad: "Tekrarı ayıkla", alt: "Aynı değer ikinci kez gelirse dur", tur: "depo", adimAdi: "Daha önce görüldü mü", ayar: { islem: "goruldu", anahtar: "gorulenler" } },
  { id: "sayac", ad: "Sayaç", alt: "Çalışmalar arası say ve eşiği denetle", tur: "depo", adimAdi: "Sayaç", ayar: { islem: "artir", anahtar: "sayac", miktar: 1 } },
  { id: "kuyruk", ad: "Kuyruğa ekle", alt: "Sonra işlenmek üzere listeye koy", tur: "depo", adimAdi: "Kuyruğa ekle", ayar: { islem: "ekle", anahtar: "kuyruk" } },
];

export const VAYRA_ARACLARI: { id: string; ad: string; alan: string; ek?: Record<string, unknown> }[] = [
  { id: "gorsel_uret", ad: "Görsel üret", alan: "istem", ek: { oran: "1:1" } },
  { id: "video_uret", ad: "Video üret", alan: "istem", ek: { sure: 5, oran: "9:16" } },
  { id: "muzik_uret", ad: "Müzik üret", alan: "istem" },
  { id: "ses_uret", ad: "Seslendir", alan: "metin" },
  { id: "model_3d_uret", ad: "3D model üret", alan: "istem" },
];

/** Koşul işleçleri (görünen adlar simgesiz, düz Türkçe). */
export const ISLECLER: { id: string; ad: string; tek?: boolean; grup: string }[] = [
  { id: "iceriyor", ad: "içeriyorsa", grup: "Metin" }, { id: "icermiyor", ad: "içermiyorsa", grup: "Metin" },
  { id: "esit", ad: "eşitse", grup: "Metin" }, { id: "esit-degil", ad: "eşit değilse", grup: "Metin" },
  { id: "baslar", ad: "ile başlıyorsa", grup: "Metin" }, { id: "biter", ad: "ile bitiyorsa", grup: "Metin" },
  { id: "desen", ad: "düzenli ifadeye uyuyorsa", grup: "Metin" },
  { id: "buyuk", ad: "büyükse", grup: "Sayı" }, { id: "kucuk", ad: "küçükse", grup: "Sayı" },
  { id: "buyuk-esit", ad: "büyük ya da eşitse", grup: "Sayı" }, { id: "kucuk-esit", ad: "küçük ya da eşitse", grup: "Sayı" },
  { id: "tarih-once", ad: "tarihinden önceyse", grup: "Tarih" }, { id: "tarih-sonra", ad: "tarihinden sonraysa", grup: "Tarih" },
  { id: "dogru", ad: "doğruysa", tek: true, grup: "Evet ya da hayır" }, { id: "yanlis", ad: "yanlışsa", tek: true, grup: "Evet ya da hayır" },
  { id: "bos-degil", ad: "boş değilse", tek: true, grup: "Var mı" }, { id: "bos", ad: "boşsa", tek: true, grup: "Var mı" },
];
export const islecAdi = (id: string) => ISLECLER.find((x) => x.id === id)?.ad ?? id;

export const SURE_BIRIMLERI: { id: string; ad: string; ms: number }[] = [
  { id: "saniye", ad: "saniye", ms: 1000 }, { id: "dakika", ad: "dakika", ms: 60_000 }, { id: "saat", ad: "saat", ms: 3_600_000 }, { id: "gun", ad: "gün", ms: 86_400_000 },
];
export const sureMs = (miktar: unknown, birim: unknown) => Math.max(0, Number(miktar) || 0) * (SURE_BIRIMLERI.find((x) => x.id === birim)?.ms ?? 1000);
export const sureMetni = (miktar: unknown, birim: unknown) => `${Number(miktar) || 0} ${SURE_BIRIMLERI.find((x) => x.id === birim)?.ad ?? "saniye"}`;

export const GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

/* ───────────── Ağaç yardımcıları ───────────── */

/** Bir adımın alt listeleri: [anahtar, liste] — anahtar "govde", "hata" ya da dal kimliği. */
export function altListeler(a: Adim): { anahtar: string; ad: string; l: Adim[]; dal?: Dal }[] {
  const o: { anahtar: string; ad: string; l: Adim[]; dal?: Dal }[] = [];
  if (a.dallar) for (const d of a.dallar) o.push({ anahtar: d.id, ad: d.ad, l: d.adimlar, dal: d });
  if (a.govde) o.push({ anahtar: "govde", ad: "Her öğe için", l: a.govde });
  if (a.hataDali && a.hata === "dal") o.push({ anahtar: "hata", ad: "Hata olursa", l: a.hataDali });
  return o;
}

export type DuzAdim = { a: Adim; no: number; derinlik: number; ebeveyn?: string; kol?: string; dongu: string[] };
/** Derinlik öncelikli düz liste ve numaralar (1'den başlar). dongu: adımı saran döngü kimlikleri (dıştan içe). */
export function duzListe(l: Adim[]): DuzAdim[] {
  const o: DuzAdim[] = [];
  const gez = (x: Adim[], derinlik: number, ebeveyn: string | undefined, kol: string | undefined, dongu: string[]) => {
    for (const a of x) {
      o.push({ a, no: o.length + 1, derinlik, ebeveyn, kol, dongu });
      for (const k of altListeler(a)) gez(k.l, derinlik + 1, a.id, k.anahtar, a.tur === "dongu" && k.anahtar === "govde" ? [...dongu, a.id] : dongu);
    }
  };
  gez(l, 0, undefined, undefined, []);
  return o;
}
export const adimBul = (l: Adim[], id: string) => duzListe(l).find((x) => x.a.id === id)?.a;

/** Ağacı kopyalayıp her adıma f uygular (f yeni adım ya da null döndürürse silinir). */
export function agacEsle(l: Adim[], f: (a: Adim) => Adim | null): Adim[] {
  const o: Adim[] = [];
  for (const a of l) {
    const y = f(a);
    if (!y) continue;
    const z: Adim = { ...y };
    if (z.dallar) z.dallar = z.dallar.map((d) => ({ ...d, adimlar: agacEsle(d.adimlar, f) }));
    if (z.govde) z.govde = agacEsle(z.govde, f);
    if (z.hataDali) z.hataDali = agacEsle(z.hataDali, f);
    o.push(z);
  }
  return o;
}
export const agacGuncelle = (l: Adim[], id: string, f: (a: Adim) => Adim) => agacEsle(l, (a) => (a.id === id ? f(a) : a));
export const agacSil = (l: Adim[], id: string) => agacEsle(l, (a) => (a.id === id ? null : a));

/** Ekleme yeri: ebeveyn yoksa kök liste; kol "govde", "hata" ya da dal kimliği; sira listedeki konum. */
export type Konum = { ebeveyn?: string; kol?: string; sira: number };
function listeUygula(l: Adim[], k: Omit<Konum, "sira">, f: (x: Adim[]) => Adim[]): Adim[] {
  if (!k.ebeveyn) return f(l);
  return agacEsle(l, (a) => {
    if (a.id !== k.ebeveyn) return a;
    const y = { ...a };
    if (k.kol === "govde") y.govde = f(y.govde ?? []);
    else if (k.kol === "hata") y.hataDali = f(y.hataDali ?? []);
    else if (y.dallar) y.dallar = y.dallar.map((d) => (d.id === k.kol ? { ...d, adimlar: f(d.adimlar) } : d));
    return y;
  });
}
export function agacEkle(l: Adim[], k: Konum, yeni: Adim): Adim[] {
  return listeUygula(l, k, (x) => { const c = [...x]; c.splice(Math.max(0, Math.min(k.sira, c.length)), 0, yeni); return c; });
}
/** Adımın bulunduğu liste ve konumu. */
export function adimYeri(l: Adim[], id: string): { konum: Konum; uzunluk: number } | null {
  const ara = (x: Adim[], ebeveyn?: string, kol?: string): { konum: Konum; uzunluk: number } | null => {
    const i = x.findIndex((a) => a.id === id);
    if (i >= 0) return { konum: { ebeveyn, kol, sira: i }, uzunluk: x.length };
    for (const a of x) for (const k of altListeler(a)) { const r = ara(k.l, a.id, k.anahtar); if (r) return r; }
    return null;
  };
  return ara(l);
}
export function agacTasi(l: Adim[], id: string, yon: -1 | 1): Adim[] {
  const y = adimYeri(l, id);
  if (!y) return l;
  const hedef = y.konum.sira + yon;
  if (hedef < 0 || hedef >= y.uzunluk) return l;
  return listeUygula(l, y.konum, (x) => { const c = [...x]; const [a] = c.splice(y.konum.sira, 1); c.splice(hedef, 0, a); return c; });
}
/** Adımı kopyalar (alt adımlar dahil, yeni kimliklerle) ve hemen altına koyar. */
export function agacCogalt(l: Adim[], id: string, kimlik: () => string): { l: Adim[]; yeniId?: string } {
  const y = adimYeri(l, id), a = adimBul(l, id);
  if (!y || !a) return { l };
  const kopya = adimKopyasi(a, kimlik);
  kopya.ad = `${a.ad} (kopya)`.slice(0, 80);
  return { l: agacEkle(l, { ...y.konum, sira: y.konum.sira + 1 }, kopya), yeniId: kopya.id };
}

/* ───────────── Yeni adım varsayılanları ───────────── */
export const VARSAYILAN_AYAR: Record<AdimTuru, Record<string, unknown>> = {
  ajan: { istem: "" }, arac: { arac: "gorsel_uret", istem: "", oran: "1:1" }, baglanti: { baglantiId: "", arac: "", girdi: "{}" },
  http: { yontem: "POST", url: "", basliklar: "", govde: "" }, kosul: {}, veri: { projeId: "", koleksiyon: "", alanlar: "{}" },
  bekle: { mod: "sure", miktar: 10, birim: "dakika", zamanAsimiMiktar: 1, zamanAsimiBirim: "gun", zamanAsiminda: "devam" },
  yonlendirici: { mod: "ilk" }, siniflandir: { girdi: "", talimat: "", esik: 50 },
  dongu: { liste: "", sinir: 100, topla: "liste", toplaDeger: "" },
  onay: { baslik: "", icerik: "", duzenlenebilir: true, zamanAsimiMiktar: 1, zamanAsimiBirim: "gun", varsayilan: "ret" },
  kod: { kod: "export default function (girdi) {\n  // girdi.tetik, girdi.adim[\"1\"], girdi.dongu\n  return { sonuc: girdi.tetik };\n}\n" },
  donustur: { grup: "metin", islem: "kirp", deger: "" },
  cagir: { sistemId: "", girdi: "{}", mod: "bekle", zamanAsimiMiktar: 1, zamanAsimiBirim: "gun" },
  guvenlik: { metin: "", mod: "maskele", tc: true, iban: true, telefon: true, eposta: true, kart: true, anahtar: true, uygunsuz: false, esik: 60, ihlalSonrasi: "devam" },
  yanit: { icerik: "", bicim: "metin", durum: 200 },
  paralel: { birlestir: "nesne" },
  uygulama: { servis: "", eylem: "" },
  depo: { islem: "yaz", anahtar: "", deger: "", miktar: 1, kapsam: "sistem", sure: 0, gorulduyse: "dur" },
};
export const ADIM_ADI: Record<AdimTuru, string> = {
  ajan: "Görevi yap", arac: "Üret", baglanti: "Servis aracı", http: "İstek gönder", kosul: "Süzgeç", veri: "Kayıt ekle", bekle: "Bekle",
  yonlendirici: "Yönlendir", siniflandir: "Yapay zekâyla yönlendir", dongu: "Her öğe için", onay: "Onay iste", kod: "Kod çalıştır", donustur: "Dönüştür",
  cagir: "Sistemi çağır", guvenlik: "Güvenlik denetimi", yanit: "Yanıt ver", paralel: "Aynı anda", depo: "Depoya yaz", uygulama: "Uygulama eylemi",
};
/** Sabit kimlikli dallar (onay ve güvenlik denetimi). */
export const SABIT_DALLAR: Partial<Record<AdimTuru, { id: string; ad: string }[]>> = {
  onay: [{ id: "onay", ad: "Onaylanırsa" }, { id: "ret", ad: "Reddedilirse" }],
  guvenlik: [{ id: "temiz", ad: "Temizse" }, { id: "ihlal", ad: "İhlal varsa" }],
};
/** Yeni adım (alt yapılarıyla). */
export function yeniAdim(tur: AdimTuru, kimlik: () => string): Adim {
  const a: Adim = { id: kimlik(), ad: ADIM_ADI[tur], tur, ayar: { ...VARSAYILAN_AYAR[tur] }, hata: "durdur" };
  if (tur === "kosul") { a.kosullar = [{ sol: "", islec: "iceriyor", sag: "" }]; a.baglac = "ve"; }
  if (tur === "yonlendirici") a.dallar = [
    { id: kimlik(), ad: "Dal A", kosullar: [{ sol: "", islec: "esit", sag: "" }], baglac: "ve", adimlar: [] },
    { id: kimlik(), ad: "Dal B", kosullar: [{ sol: "", islec: "esit", sag: "" }], baglac: "ve", adimlar: [] },
    { id: "yedek", ad: "Hiçbiri uymazsa", yedek: true, adimlar: [] },
  ];
  if (tur === "siniflandir") a.dallar = [
    { id: kimlik(), ad: "Olumlu", aciklama: "Memnun, teşekkür eden ya da öven mesajlar", adimlar: [] },
    { id: kimlik(), ad: "Olumsuz", aciklama: "Şikâyet, sorun ya da memnuniyetsizlik bildiren mesajlar", adimlar: [] },
    { id: "yedek", ad: "Hiçbiri uymazsa", yedek: true, aciklama: "Yukarıdakilerden hiçbirine uymuyorsa", adimlar: [] },
  ];
  if (SABIT_DALLAR[tur]) a.dallar = SABIT_DALLAR[tur]!.map((d) => ({ ...d, adimlar: [] }));
  if (tur === "dongu") a.govde = [];
  if (tur === "paralel") a.dallar = [{ id: kimlik(), ad: "Dal A", adimlar: [] }, { id: kimlik(), ad: "Dal B", adimlar: [] }];
  return a;
}

/** Adımın tam kopyası (alt adımlar dahil): yeni kimlikler; kopya içindeki {{adim.eski}} göndermeleri de yenilenir. */
export function adimKopyasi(a: Adim, kimlik: () => string): Adim {
  const harita = new Map<string, string>();
  for (const x of duzListe([a])) harita.set(x.a.id, kimlik());
  const yenile = (s: unknown) => (typeof s === "string" ? s.replace(/\{\{\s*adim\.([A-Za-z0-9_-]+)/g, (m, k: string) => (harita.has(k) ? `{{adim.${harita.get(k)}` : m)) : s);
  const kosul = (l?: Kosul[]) => l?.map((k) => ({ sol: String(yenile(k.sol)), islec: k.islec, sag: String(yenile(k.sag)) }));
  return agacEsle([JSON.parse(JSON.stringify(a)) as Adim], (x) => ({
    ...x, id: harita.get(x.id) ?? kimlik(),
    ayar: Object.fromEntries(Object.entries(x.ayar).map(([k, v]) => [k, yenile(v)])),
    kosullar: kosul(x.kosullar),
    dallar: x.dallar?.map((d) => ({ ...d, id: d.yedek || SABIT_DALLAR[x.tur] ? d.id : kimlik(), kosullar: kosul(d.kosullar) })),
  }))[0];
}

/* ───────────── Göç (eski kayıtlar) ───────────── */
/** Eski biçimdeki adımı yeni biçime çevirir: hata "tekrar", bekle.saniye, koşul ayarı. Yeni biçimde dokunmaz. */
export function adimGoc(a: Adim): Adim {
  const y: Adim = { ...a, ayar: { ...(a.ayar ?? {}) } };
  if ((y.hata as string) === "tekrar") { y.hata = "durdur"; y.tekrar ??= { sayi: 2, bekleme: 2, artan: true }; }
  if (y.hata !== "devam" && y.hata !== "dal" && y.hata !== "yedek") y.hata = "durdur";
  if (y.tur === "bekle" && y.ayar.mod === undefined) {
    y.ayar = { ...VARSAYILAN_AYAR.bekle, mod: "sure", miktar: Number(y.ayar.saniye) || 10, birim: "saniye" };
  }
  if (y.tur === "kosul" && !y.kosullar) {
    y.kosullar = [{ sol: String(y.ayar.sol ?? ""), islec: String(y.ayar.islec ?? "iceriyor"), sag: String(y.ayar.sag ?? "") }];
    y.baglac = "ve";
  }
  if (y.dallar) y.dallar = y.dallar.map((d) => ({ ...d, adimlar: (d.adimlar ?? []).map(adimGoc) }));
  if (y.tur === "dongu") y.govde = (y.govde ?? []).map(adimGoc);
  if (y.hataDali) y.hataDali = y.hataDali.map(adimGoc);
  return y;
}

/* ───────────── Sürüm farkı ───────────── */
export type FarkSatiri = { tur: "eklendi" | "silindi" | "degisti" | "tasindi"; ad: string; adimTur?: AdimTuru; ayrinti: string[] };
const ALAN_ADI: Record<string, string> = {
  istem: "Görev", ajanId: "Ajan", model: "Model", arac: "Araç", oran: "Oran", baglantiId: "Bağlantı", girdi: "Girdi", yontem: "Yöntem", url: "Adres",
  basliklar: "Başlıklar", govde: "Gövde", projeId: "Proje", koleksiyon: "Koleksiyon", alanlar: "Alanlar", mod: "Mod", miktar: "Süre", birim: "Birim",
  tarih: "Tarih", liste: "Liste", sinir: "En çok tur", topla: "Toplama", toplaDeger: "Toplanan değer", baslik: "Başlık", icerik: "İçerik",
  duzenlenebilir: "Düzenlenebilir", varsayilan: "Varsayılan karar", kod: "Kod", grup: "Grup", islem: "İşlem", deger: "Değer", talimat: "Talimat",
  esik: "Güven eşiği", metin: "Metin", sure: "Süre", zamanAsimiMiktar: "Zaman aşımı", zamanAsimiBirim: "Zaman aşımı birimi", zamanAsiminda: "Zaman aşımında",
  sistemId: "Çağrılan sistem", kayitId: "Kayıt kimliği", hedef: "Hangi kayıt", eslesme: "Eşleşme alanı", sirala: "Sıralama", yon: "Sıralama yönü", ara: "Arama",
  bulunamazsa: "Bulunamazsa", tc: "TC kimlik denetimi", iban: "IBAN denetimi", telefon: "Telefon denetimi", eposta: "E-posta denetimi", kart: "Kart denetimi",
  anahtar: "Gizli anahtar denetimi", uygunsuz: "Uygunsuz içerik denetimi", ozelDesen: "Özel kalıp", ihlalSonrasi: "İhlalden sonra",
  bicim: "Biçim", durum: "Durum kodu", birlestir: "Birleştirme", kapsam: "Kapsam", gorulduyse: "Görüldüyse", p1: "Birinci değer", p2: "İkinci değer", p3: "Üçüncü değer",
};
const kisa = (v: unknown) => { const s = typeof v === "string" ? v : JSON.stringify(v ?? ""); return s.length > 60 ? `${s.slice(0, 60)}…` : s || "boş"; };
export function surumFarki(eski: { tetikler: Tetikleyici[]; adimlar: Adim[] }, yeni: { tetikler: Tetikleyici[]; adimlar: Adim[] }): FarkSatiri[] {
  const o: FarkSatiri[] = [];
  const te = JSON.stringify(eski.tetikler.map(({ id: _i, ...t }) => t)), ty = JSON.stringify(yeni.tetikler.map(({ id: _i, ...t }) => t));
  if (te !== ty) o.push({ tur: "degisti", ad: "Tetikleyici", ayrinti: [`${eski.tetikler.map((t) => TETIK_TURLERI.find((x) => x.tur === t.tur)?.ad).join(", ") || "yok"} yerine ${yeni.tetikler.map((t) => TETIK_TURLERI.find((x) => x.tur === t.tur)?.ad).join(", ") || "yok"}`] });
  const de = duzListe(eski.adimlar), dy = duzListe(yeni.adimlar);
  const me = new Map(de.map((x) => [x.a.id, x])), my = new Map(dy.map((x) => [x.a.id, x]));
  for (const x of dy) {
    const e = me.get(x.a.id);
    if (!e) { o.push({ tur: "eklendi", ad: x.a.ad, adimTur: x.a.tur, ayrinti: [`${x.no}. adım olarak eklendi`] }); continue; }
    const ayr: string[] = [];
    if (e.a.ad !== x.a.ad) ayr.push(`Ad: "${e.a.ad}" yerine "${x.a.ad}"`);
    const anahtarlar = new Set([...Object.keys(e.a.ayar ?? {}), ...Object.keys(x.a.ayar ?? {})]);
    for (const k of anahtarlar) if (JSON.stringify(e.a.ayar?.[k] ?? "") !== JSON.stringify(x.a.ayar?.[k] ?? "")) ayr.push(`${ALAN_ADI[k] ?? k}: ${kisa(e.a.ayar?.[k])} yerine ${kisa(x.a.ayar?.[k])}`);
    if (e.a.hata !== x.a.hata) ayr.push("Hata olursa ayarı değişti");
    if (JSON.stringify(e.a.tekrar ?? null) !== JSON.stringify(x.a.tekrar ?? null)) ayr.push("Yeniden deneme ayarı değişti");
    if (JSON.stringify(e.a.kosullar ?? null) !== JSON.stringify(x.a.kosullar ?? null) || e.a.baglac !== x.a.baglac) ayr.push("Koşullar değişti");
    if (JSON.stringify((e.a.dallar ?? []).map((d) => [d.ad, d.aciklama, d.kosullar, d.baglac])) !== JSON.stringify((x.a.dallar ?? []).map((d) => [d.ad, d.aciklama, d.kosullar, d.baglac]))) ayr.push("Dallar değişti");
    if (JSON.stringify(e.a.alanlar ?? null) !== JSON.stringify(x.a.alanlar ?? null)) ayr.push("Çıktı alanları değişti");
    if (!!e.a.kapali !== !!x.a.kapali) ayr.push(x.a.kapali ? "Devre dışı bırakıldı" : "Yeniden etkinleştirildi");
    if (ayr.length) o.push({ tur: "degisti", ad: x.a.ad, adimTur: x.a.tur, ayrinti: ayr });
    else if (e.ebeveyn !== x.ebeveyn || e.kol !== x.kol || de.filter((z) => z.ebeveyn === e.ebeveyn && z.kol === e.kol).findIndex((z) => z.a.id === e.a.id) !== dy.filter((z) => z.ebeveyn === x.ebeveyn && z.kol === x.kol).findIndex((z) => z.a.id === x.a.id)) o.push({ tur: "tasindi", ad: x.a.ad, adimTur: x.a.tur, ayrinti: [`${e.no}. sıradan ${x.no}. sıraya`] });
  }
  for (const x of de) if (!my.has(x.a.id)) o.push({ tur: "silindi", ad: x.a.ad, adimTur: x.a.tur, ayrinti: [`${x.no}. adımdı`] });
  return o;
}

/* ───────────── Zamanlama ───────────── */
/** Verilen saat diliminde (varsayılan Türkiye saati) tarih parçaları. */
export function trParcalar(t: number, tz = "Europe/Istanbul") {
  const d = new Date(t + dilimFark(t, tz));
  return { yil: d.getUTCFullYear(), ay: d.getUTCMonth() + 1, gun: d.getUTCDate(), haftaGunu: ((d.getUTCDay() + 6) % 7) + 1, saat: d.getUTCHours(), dakika: d.getUTCMinutes() };
}

const iki = (n: number) => String(n).padStart(2, "0");
const gunAnahtari = (p: { yil: number; ay: number; gun: number }) => `${p.yil}-${iki(p.ay)}-${iki(p.gun)}`;
const ayinSonGunu = (yil: number, ay: number) => new Date(Date.UTC(yil, ay, 0)).getUTCDate();
const dakikaOku = (s: string) => { const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim()); return m ? Math.min(23, Number(m[1])) * 60 + Math.min(59, Number(m[2])) : null; };
/** Günün çalışma saatleri (sıralı, yinelenmesiz, dakika cinsinden). */
export function zamanSaatleri(z: Zamanlama): number[] {
  const l = (z.saatler?.length ? z.saatler : [z.saat ?? "09:00"]).map(dakikaOku).filter((x): x is number => x !== null);
  return [...new Set(l.length ? l : [540])].sort((a, b) => a - b);
}
const saatYaz = (d: number) => `${iki(Math.floor(d / 60))}:${iki(d % 60)}`;

/* ── Cron (dakika saat ayınGünü ay haftaGünü), Türkiye saatiyle ── */
export type Cron = { dk: number[]; sa: number[]; ag: Set<number> | null; ay: Set<number>; hg: Set<number> | null };
const AY_ADLARI: Record<string, number> = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
const GUN_ADLARI: Record<string, number> = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
const KISALTMA: Record<string, string> = { "@hourly": "0 * * * *", "@daily": "0 0 * * *", "@midnight": "0 0 * * *", "@weekly": "0 0 * * 0", "@monthly": "0 0 1 * *", "@yearly": "0 0 1 1 *", "@annually": "0 0 1 1 *" };
function cronAlan(s: string, en: number, boy: number, adlar?: Record<string, number>): number[] | string {
  const o = new Set<number>();
  for (const parca of s.split(",")) {
    const [aralik, adimS] = parca.split("/");
    const adim = adimS === undefined ? 1 : Number(adimS);
    if (!Number.isInteger(adim) || adim < 1) return `"${parca}" adımı geçersiz`;
    const sayi = (x: string) => { const u = x.toUpperCase(); if (adlar && u in adlar) return adlar[u]; return /^\d+$/.test(x) ? Number(x) : NaN; };
    let a: number, b: number;
    if (aralik === "*") { a = en; b = boy; }
    else if (aralik.includes("-")) { const [x, y] = aralik.split("-"); a = sayi(x); b = sayi(y); }
    else { a = sayi(aralik); b = adimS === undefined ? a : boy; }
    if (!Number.isFinite(a) || !Number.isFinite(b) || a < en || b > boy || a > b) return `"${parca}" ${en} ile ${boy} arasında olmalı`;
    for (let i = a; i <= b; i += adim) o.add(i);
  }
  return [...o].sort((x, y) => x - y);
}
export function cronCoz(ifade: string): { c: Cron; hata?: undefined } | { hata: string; c?: undefined } {
  const t = (KISALTMA[ifade.trim().toLowerCase()] ?? ifade).trim().split(/\s+/);
  if (t.length !== 5) return { hata: "Beş alan yaz: dakika, saat, ayın günü, ay ve haftanın günü." };
  const ADLAR = ["Dakika", "Saat", "Ayın günü", "Ay", "Haftanın günü"];
  const s = [cronAlan(t[0], 0, 59), cronAlan(t[1], 0, 23), cronAlan(t[2], 1, 31), cronAlan(t[3], 1, 12, AY_ADLARI), cronAlan(t[4], 0, 7, GUN_ADLARI)];
  const h = s.findIndex((x) => typeof x === "string");
  if (h >= 0) return { hata: `${ADLAR[h]}: ${s[h]}` };
  const [dk, sa, ag, ay, hg] = s as number[][];
  return { c: { dk, sa, ag: t[2] === "*" || t[2] === "?" ? null : new Set(ag), ay: new Set(ay), hg: t[4] === "*" || t[4] === "?" ? null : new Set(hg.map((g) => (g === 0 ? 7 : g))) } };
}
function cronGunUyar(c: Cron, p: { ay: number; gun: number; haftaGunu: number }) {
  if (!c.ay.has(p.ay)) return false;
  if (c.ag && c.hg) return c.ag.has(p.gun) || c.hg.has(p.haftaGunu);
  if (c.ag) return c.ag.has(p.gun);
  if (c.hg) return c.hg.has(p.haftaGunu);
  return true;
}

/** Bu yerel gün (gece yarısı, UTC ms) zamanlamaya uyuyorsa o günün çalışma dakikaları (sıralı). */
function gunAdaylari(z: Zamanlama, gunBasi: number, cron?: Cron | null): number[] {
  const p = trParcalar(gunBasi + 3600_000, zamanDilimi(z));
  const k = gunAnahtari(p);
  if ((z.baslangic && k < z.baslangic) || (z.bitis && k > z.bitis)) return [];
  switch (z.siklik) {
    case "dakikalik": {
      const her = Math.max(5, z.her ?? 15), o: number[] = [];
      for (let d = 0; d < 1440; d++) if (Math.floor((gunBasi + d * 60_000) / 60_000) % her === 0) o.push(d);
      return o;
    }
    case "saatlik": {
      const mm = Number((z.saat ?? "00:00").split(":")[1]) || 0, her = Math.max(1, z.her ?? 1), o: number[] = [];
      for (let h = 0; h < 24; h++) if (h % her === 0) o.push(h * 60 + mm);
      return o;
    }
    case "gunluk": return zamanSaatleri(z);
    case "haftalik": return (z.gunler?.length ? z.gunler : [1]).includes(p.haftaGunu) ? zamanSaatleri(z) : [];
    case "aylik": {
      const l = z.ayGunleri?.length ? z.ayGunleri : [z.ayGunu ?? 1];
      return l.includes(p.gun) || (l.includes(32) && p.gun === ayinSonGunu(p.yil, p.ay)) ? zamanSaatleri(z) : [];
    }
    case "ozel": {
      const c = cron ?? cronCoz(z.cron ?? "").c;
      if (!c || !cronGunUyar(c, p)) return [];
      const o: number[] = [];
      for (const h of c.sa) for (const m of c.dk) o.push(h * 60 + m);
      return o;
    }
  }
  return [];
}
/** Saat dilimindeki günün başı (UTC ms). */
const trGunBasi = (t: number, tz = "Europe/Istanbul") => dilimZaman(dilimTarih(t, tz), "00:00", tz);
/** Gün başından d dakika sonrası, yaz saati geçişini hesaba katarak (yerel saat d dakika). */
const gunDakika = (g: number, d: number, tz: string, z?: Pick<Zamanlama, "siklik">) => (z?.siklik === "dakikalik" ? g + d * 60_000 : dilimZaman(dilimTarih(g + 3600_000, tz), `${String(Math.floor(d / 60)).padStart(2, "0")}:${String(d % 60).padStart(2, "0")}`, tz));
const sonrakiGun = (g: number, tz: string) => trGunBasi(g + 30 * 3600_000, tz);
const oncekiGun = (g: number, tz: string) => trGunBasi(g - 18 * 3600_000, tz);

/** Bu dakika zamanlamaya uyuyor mu? */
export function zamanUyar(z: Zamanlama, t: number): boolean {
  const tz = zamanDilimi(z);
  const dk = Math.floor(t / 60_000) * 60_000, g = trGunBasi(dk, tz);
  return gunAdaylari(z, g).some((d) => gunDakika(g, d, tz, z) === dk);
}

/** Sonraki n çalışma (en çok 400 gün ileri bakar). */
export function sonrakiZamanlar(z: Zamanlama, n = 5, simdi = Date.now()): number[] {
  const o: number[] = [];
  const cron = z.siklik === "ozel" ? cronCoz(z.cron ?? "").c ?? null : null;
  if (z.siklik === "ozel" && !cron) return o;
  const tz = zamanDilimi(z);
  let g = trGunBasi(simdi, tz);
  for (let i = 0; i < 400 && o.length < n; i++, g = sonrakiGun(g, tz)) {
    for (const d of gunAdaylari(z, g, cron)) { const t = gunDakika(g, d, tz, z); if (t > simdi) { o.push(t); if (o.length >= n) break; } }
  }
  return o;
}
export const sonrakiZaman = (z: Zamanlama, simdi = Date.now()): number | null => sonrakiZamanlar(z, 1, simdi)[0] ?? null;

/** simdi anından geriye en çok pencere dakika içindeki son planlı çalışma (kaçırılanı yakalamak için). */
export function oncekiZaman(z: Zamanlama, simdi: number, pencereDk: number): number | null {
  const alt = simdi - Math.max(0, pencereDk) * 60_000;
  const cron = z.siklik === "ozel" ? cronCoz(z.cron ?? "").c ?? null : null;
  if (z.siklik === "ozel" && !cron) return null;
  const tz = zamanDilimi(z);
  for (let g = trGunBasi(simdi, tz); g + 86_400_000 > alt; g = oncekiGun(g, tz)) {
    const l = gunAdaylari(z, g, cron);
    for (let i = l.length - 1; i >= 0; i--) { const t = gunDakika(g, l[i], tz, z); if (t <= simdi && t >= alt) return t; if (t < alt) break; }
  }
  return null;
}

const TR_AY_KISA = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const tarihKisa = (k: string) => { const [y, a, g] = k.split("-").map(Number); return `${g} ${TR_AY_KISA[a - 1] ?? ""} ${y}`; };
const ve = (l: string[]) => (l.length <= 1 ? l.join("") : `${l.slice(0, -1).join(", ")} ve ${l.at(-1)}`);
/** Zamanlamayı düz Türkçe anlatır. */
export function zamanMetni(z: Zamanlama): string {
  const saatler = ve(zamanSaatleri(z).map(saatYaz));
  let m: string;
  switch (z.siklik) {
    case "dakikalik": m = `Her ${Math.max(5, z.her ?? 15)} dakikada bir`; break;
    case "saatlik": { const dk = (z.saat ?? "00:00").split(":")[1] ?? "00"; m = (z.her ?? 1) > 1 ? `${z.her} saatte bir, ${dk} geçe` : `Her saat ${dk} geçe`; break; }
    case "gunluk": m = `Her gün ${saatler}`; break;
    case "haftalik": {
      const g = [...new Set(z.gunler?.length ? z.gunler : [1])].sort((a, b) => a - b);
      const k = g.join(",");
      m = `${k === "1,2,3,4,5" ? "Hafta içi her gün" : k === "6,7" ? "Hafta sonu" : k === "1,2,3,4,5,6,7" ? "Her gün" : `Her ${ve(g.map((x) => GUNLER[x - 1]))}`} ${saatler}`;
      break;
    }
    case "aylik": { const l = [...new Set(z.ayGunleri?.length ? z.ayGunleri : [z.ayGunu ?? 1])].sort((a, b) => a - b); m = `Her ayın ${ve(l.map((x) => (x === 32 ? "son günü" : `${x}.`)))}${l.at(-1) === 32 ? "" : " günü"} ${saatler}`; break; }
    case "ozel": m = cronCoz(z.cron ?? "").hata ? "Özel zamanlama (ifade geçersiz)" : `Özel zamanlama: ${z.cron}`; break;
    default: m = "Zamanlı";
  }
  if (z.baslangic && z.bitis) m += `, ${tarihKisa(z.baslangic)} ile ${tarihKisa(z.bitis)} arası`;
  else if (z.baslangic) m += `, ${tarihKisa(z.baslangic)} tarihinden itibaren`;
  else if (z.bitis) m += `, ${tarihKisa(z.bitis)} tarihine kadar`;
  return m;
}

/* ───────────── Girdi alanları ───────────── */
export const GIRDI_TURLERI: { id: GirdiAlani["tur"]; ad: string; json: string }[] = [
  { id: "metin", ad: "Metin", json: "string" }, { id: "uzunMetin", ad: "Uzun metin", json: "string" }, { id: "sayi", ad: "Sayı", json: "number" },
  { id: "evet-hayir", ad: "Evet ya da hayır", json: "boolean" }, { id: "tarih", ad: "Tarih", json: "string" }, { id: "secim", ad: "Seçim", json: "string" }, { id: "eposta", ad: "E-posta", json: "string" },
  { id: "telefon", ad: "Telefon", json: "string" }, { id: "coklu", ad: "Çoklu seçim", json: "array" }, { id: "gizli", ad: "Gizli alan", json: "string" },
];
/** Girdiyi alanlara göre doğrular ve türüne çevirir. Tanımsız alanlar olduğu gibi geçer. */
export function girdiDogrula(alanlar: GirdiAlani[], g: unknown): { veri: Record<string, unknown>; hatalar: string[] } {
  const o: Record<string, unknown> = g && typeof g === "object" && !Array.isArray(g) ? { ...(g as Record<string, unknown>) } : {};
  const hatalar: string[] = [];
  for (const a of alanlar) {
    let v = o[a.ad];
    const ad = a.etiket || a.ad;
    if ((v === undefined || v === null || v === "") && a.varsayilan !== undefined && a.varsayilan !== "") v = a.varsayilan;
    if (v === undefined || v === null || v === "") { if (a.zorunlu) hatalar.push(`${ad} zorunlu`); else delete o[a.ad]; continue; }
    switch (a.tur) {
      case "sayi": { const n = typeof v === "number" ? v : Number(String(v).replace(",", ".")); if (!Number.isFinite(n)) hatalar.push(`${ad} sayı olmalı`); else o[a.ad] = n; break; }
      case "evet-hayir": { const t = String(v).toLocaleLowerCase("tr"); if (typeof v === "boolean") o[a.ad] = v; else if (["true", "1", "evet", "doğru"].includes(t)) o[a.ad] = true; else if (["false", "0", "hayır", "yanlış"].includes(t)) o[a.ad] = false; else hatalar.push(`${ad} evet ya da hayır olmalı`); break; }
      case "eposta": if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim())) hatalar.push(`${ad} geçerli bir e-posta olmalı`); else o[a.ad] = String(v).trim(); break;
      case "secim": if (a.secenekler?.length && !a.secenekler.includes(String(v))) hatalar.push(`${ad} şunlardan biri olmalı: ${a.secenekler.join(", ")}`); else o[a.ad] = String(v); break;
      case "telefon": { const t = String(v).replace(/[^\d+]/g, ""), n = t.replace(/\D/g, "").length; if (n < 10 || n > 15) hatalar.push(`${ad} geçerli bir telefon numarası olmalı`); else o[a.ad] = t; break; }
      case "coklu": {
        const l = (Array.isArray(v) ? v : String(v).split(",")).map((x) => String(x).trim()).filter(Boolean);
        const yanlis = a.secenekler?.length ? l.filter((x) => !a.secenekler!.includes(x)) : [];
        if (yanlis.length) hatalar.push(`${ad} şunlardan seçilmeli: ${a.secenekler!.join(", ")}`); else if (a.zorunlu && !l.length) hatalar.push(`${ad} zorunlu`); else o[a.ad] = l;
        break;
      }
      case "tarih": if (!Number.isFinite(Date.parse(String(v))) && !/^\d{1,2}\.\d{1,2}\.\d{4}/.test(String(v))) hatalar.push(`${ad} geçerli bir tarih olmalı`); else o[a.ad] = String(v); break;
      default: o[a.ad] = typeof v === "object" ? JSON.stringify(v) : String(v);
    }
  }
  return { veri: o, hatalar };
}
/** Girdi alanlarından JSON şeması (API ve MCP aracı). */
export function girdiSemasi(alanlar: GirdiAlani[]): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  for (const a of alanlar) {
    const t = GIRDI_TURLERI.find((x) => x.id === a.tur)?.json ?? "string";
    properties[a.ad] = { type: t, ...(a.tur === "coklu" ? { items: { type: "string", ...(a.secenekler?.length ? { enum: a.secenekler } : {}) } } : {}), ...(a.etiket || a.aciklama ? { description: [a.etiket, a.aciklama].filter(Boolean).join(": ") } : {}), ...(a.tur === "secim" && a.secenekler?.length ? { enum: a.secenekler } : {}), ...(a.tur === "eposta" ? { format: "email" } : {}), ...(a.varsayilan ? { default: a.tur === "sayi" ? Number(a.varsayilan) : a.tur === "evet-hayir" ? a.varsayilan === "true" : a.varsayilan } : {}) };
  }
  const required = alanlar.filter((a) => a.zorunlu).map((a) => a.ad);
  return { type: "object", properties, ...(required.length ? { required } : {}), additionalProperties: !alanlar.length };
}

/* ───────────── Hazır sistemler ───────────── */
/** Birleşik türde her üyeden ayrı ayrı alan çıkarır. */
export type KimliksizTetik = Tetikleyici extends infer T ? (T extends unknown ? Omit<T, "id"> : never) : never;
export type SablonKategori = "satis" | "icerik" | "destek" | "operasyon" | "ik" | "finans" | "yazilim" | "yz" | "verimlilik";
export const SABLON_KATEGORILERI: { id: SablonKategori; ad: string }[] = [
  { id: "satis", ad: "Satış ve e-ticaret" }, { id: "icerik", ad: "Pazarlama ve içerik" }, { id: "destek", ad: "Müşteri ve destek" }, { id: "operasyon", ad: "Operasyon" },
  { id: "ik", ad: "İnsan kaynakları" }, { id: "finans", ad: "Finans" }, { id: "yazilim", ad: "Yazılım ve BT" }, { id: "yz", ad: "Yapay zekâ servisleri" }, { id: "verimlilik", ad: "Kişisel verimlilik" },
];
/** Sektör etiketleri (hazır sistem galerisinde süzgeç). */
export const SABLON_SEKTORLERI: { id: string; ad: string }[] = [
  { id: "eticaret", ad: "E-ticaret" }, { id: "restoran", ad: "Restoran ve kafe" }, { id: "saglik", ad: "Sağlık ve klinik" }, { id: "emlak", ad: "Emlak" }, { id: "egitim", ad: "Eğitim" },
  { id: "ajans", ad: "Ajans" }, { id: "saas", ad: "Yazılım şirketi" }, { id: "turizm", ad: "Turizm ve otel" }, { id: "hizmet", ad: "Hizmet işletmesi" }, { id: "topluluk", ad: "Topluluk" },
];
/** Şablon adımı: kimlikler şablon içinde sabittir (ş1, ş2…); kurulurken yenileriyle değiştirilir ve şablon değişkenleri de güncellenir. */
export type SistemSablon = {
  id: string; ad: string; aciklama: string; kapak?: string; kategori: SablonKategori; logo?: string;
  tetik: KimliksizTetik; adimlar: Adim[];
  /** Kurulumda kullanıcının doldurması gerekenler (düz Türkçe). */
  kurulum?: string[];
  /** Form sayfası, girdi formu, API ve MCP için girdi alanları. */
  girdi?: GirdiAlani[];
  sektor?: string[];
};
const ad = (id: string, ad: string, tur: AdimTuru, ayar: Record<string, unknown>, ek: Partial<Adim> = {}): Adim => ({ id, ad, tur, ayar, hata: "durdur", ...ek });

export const SISTEM_SABLONLARI: SistemSablon[] = [
  {
    id: "iyzico-odeme", ad: "iyzico ödemesi gelince kaydet", kategori: "satis", logo: "/marka/baglanti/iyzico.svg",
    aciklama: "iyzico ödeme bildirimi web kancasıyla gelir; başarılı ödemeyi siparişlere, başarısızı ayrı tabloya yazar.", kapak: "/gercek/panel/gal-gpt-6.webp",
    tetik: { tur: "webhook" },
    kurulum: ["iyzico panelinde bildirim adresi olarak bu sistemin web kancası adresini gir", "Kayıt adımlarında Build projeni seç"],
    adimlar: [
      ad("s1", "Ödeme durumu", "yonlendirici", { mod: "ilk" }, { dallar: [
        { id: "d1", ad: "Başarılı", kosullar: [{ sol: "{{tetik.status}}", islec: "esit", sag: "SUCCESS" }], baglac: "ve", adimlar: [
          ad("s2", "Ödemeyi kaydet", "veri", { projeId: "", koleksiyon: "odemeler", alanlar: "{\"odemeId\": \"{{tetik.iyziPaymentId}}\", \"konusma\": \"{{tetik.paymentConversationId}}\", \"olay\": \"{{tetik.iyziEventType}}\", \"durum\": \"{{tetik.status}}\"}" }),
        ] },
        { id: "yedek", ad: "Hiçbiri uymazsa", yedek: true, adimlar: [
          ad("s3", "Başarısız ödemeyi kaydet", "veri", { projeId: "", koleksiyon: "basarisiz_odemeler", alanlar: "{\"konusma\": \"{{tetik.paymentConversationId}}\", \"durum\": \"{{tetik.status}}\", \"ham\": {{tetik}}}" }),
        ] },
      ] }),
    ],
  },
  {
    id: "paytr-odeme", ad: "PayTR ödeme bildirimini işle", kategori: "satis", logo: "/marka/baglanti/paytr.svg",
    aciklama: "PayTR bildirim adresine gelen ödemenin imzasını doğrular, tutarı TL'ye çevirir ve siparişlere yazar. PayTR'ye beklediği OK yanıtını verir.", kapak: "/gercek/build/sablon/satis-paneli.webp",
    tetik: { tur: "webhook", yanit: "OK" },
    kurulum: ["PayTR mağaza panelinde bildirim adresi olarak web kancası adresini gir", "Kod adımında mağaza anahtarını ve mağaza tuzunu yaz", "Kayıt adımında Build projeni seç"],
    adimlar: [
      ad("s1", "İmzayı doğrula", "kod", { kod: "// PayTR bildirim imzası: base64(HMAC-SHA256(merchant_oid + tuz + status + total_amount, anahtar))\nconst ANAHTAR = \"MAGAZA_ANAHTARI\";\nconst TUZ = \"MAGAZA_TUZU\";\n\nexport default function (girdi) {\n  const t = girdi.tetik;\n  const beklenen = vayra.hmac(\"sha256\", ANAHTAR, t.merchant_oid + TUZ + t.status + t.total_amount, \"base64\");\n  if (beklenen !== t.hash) throw new Error(\"PayTR imzası tutmadı; istek PayTR'den gelmemiş olabilir.\");\n  return { gecerli: true, siparis: t.merchant_oid, durum: t.status };\n}\n" }),
      ad("s2", "Tutarı TL yap", "donustur", { grup: "sayi", islem: "bol", deger: "{{tetik.total_amount}}", p1: "100" }),
      ad("s3", "Başarılı mı", "kosul", {}, { kosullar: [{ sol: "{{tetik.status}}", islec: "esit", sag: "success" }], baglac: "ve" }),
      ad("s4", "Siparişi kaydet", "veri", { projeId: "", koleksiyon: "siparisler", alanlar: "{\"siparis\": \"{{tetik.merchant_oid}}\", \"tutar\": {{adim.s2.sonuc}}, \"odemeTuru\": \"{{tetik.payment_type}}\"}" }),
    ],
  },
  {
    id: "trendyol-siparis", ad: "Trendyol siparişini özetle", kategori: "satis", logo: "/marka/baglanti/trendyol.svg",
    aciklama: "Trendyol sipariş bildirimi gelince ürün satırlarını tek tek okur, ekip için kısa bir özet yazar ve siparişi kaydeder.", kapak: "/gercek/kesfet/blog-api.webp",
    tetik: { tur: "webhook" },
    kurulum: ["Trendyol satıcı panelinde web kancası adresi olarak bu sistemin adresini gir", "Kayıt adımında Build projeni seç"],
    adimlar: [
      ad("s1", "Ürün satırları", "dongu", { liste: "{{tetik.lines}}", sinir: 100, topla: "metin", toplaDeger: "{{dongu.oge.quantity}} adet {{dongu.oge.productName}}" }, { govde: [] }),
      ad("s2", "Sipariş özeti", "ajan", { istem: "Trendyol'dan {{tetik.orderNumber}} numaralı sipariş geldi. Müşteri: {{tetik.customerFirstName}} {{tetik.customerLastName}}, şehir: {{tetik.shipmentAddress.city}}. Ürünler:\n{{adim.s1.metin}}\nToplam: {{tetik.totalPrice}} TL. Depo ekibine 3 satırlık Türkçe bir hazırlık özeti yaz." }, { alanlar: [{ ad: "ozet", tur: "metin", aciklama: "Depo ekibi için 3 satırlık özet" }, { ad: "oncelik", tur: "metin", aciklama: "normal ya da acil" }] }),
      ad("s3", "Siparişi kaydet", "veri", { projeId: "", koleksiyon: "trendyol_siparisler", alanlar: "{\"siparis\": \"{{tetik.orderNumber}}\", \"durum\": \"{{tetik.status}}\", \"tutar\": \"{{tetik.totalPrice}}\", \"ozet\": \"{{adim.s2.ozet}}\", \"oncelik\": \"{{adim.s2.oncelik}}\"}" }),
    ],
  },
  {
    id: "whatsapp-yanit", ad: "WhatsApp mesajına yanıt ver", kategori: "destek", logo: "/marka/whatsapp.svg",
    aciklama: "WhatsApp Business Cloud API'den gelen müşteri mesajını okur, kısa bir yanıt yazar ve aynı numaraya gönderir.", kapak: "/gercek/panel/gal-gpt-1.webp",
    tetik: { tur: "webhook", dogrulama: "" },
    kurulum: ["Meta geliştirici panelinde geri çağırma adresi olarak web kancası adresini, doğrulama belirteci olarak tetikteki belirteci gir", "Gönder adımında telefon numarası kimliğini ve erişim belirtecini yaz"],
    adimlar: [
      ad("s1", "Mesaj var mı", "kosul", {}, { kosullar: [{ sol: "{{tetik.entry.0.changes.0.value.messages.0.text.body}}", islec: "bos-degil", sag: "" }], baglac: "ve" }),
      ad("s2", "Yanıt yaz", "ajan", { istem: "Bir müşteri WhatsApp'tan şunu yazdı:\n{{tetik.entry.0.changes.0.value.messages.0.text.body}}\n\nİşletmemiz adına kibar, en çok 3 cümlelik Türkçe bir yanıt yaz." }, { alanlar: [{ ad: "yanit", tur: "metin", aciklama: "Müşteriye gönderilecek yanıt" }] }),
      ad("s3", "WhatsApp ile gönder", "http", { yontem: "POST", url: "https://graph.facebook.com/v21.0/TELEFON_NUMARASI_KIMLIGI/messages", basliklar: "{\"Authorization\": \"Bearer ERISIM_BELIRTECI\"}", govde: "{\"messaging_product\": \"whatsapp\", \"to\": \"{{tetik.entry.0.changes.0.value.messages.0.from}}\", \"type\": \"text\", \"text\": {\"body\": \"{{adim.s2.yanit}}\"}}" }, { tekrar: { sayi: 2, bekleme: 5, artan: true } }),
    ],
  },
  {
    id: "form-yaniti", ad: "Formu sınıflandır ve yanıtla", kategori: "destek",
    aciklama: "Sitendeki form gelince mesajı sınıflandırır, kibar bir yanıt taslağı yazar ve sınıfıyla birlikte veritabanına kaydeder.", kapak: "/gercek/panel/gal-gpt-1.webp",
    tetik: { tur: "form", projeId: "" },
    kurulum: ["Tetikte ve kayıt adımında Build projeni seç"],
    adimlar: [
      ad("s1", "Sınıflandır ve yanıt yaz", "ajan", { istem: "Sitemizin formundan şu mesaj geldi:\n{{tetik.alanlar}}\n\nMesajı rezervasyon, şikâyet, soru ya da iş birliği olarak sınıflandır ve göndericiye kısa, kibar bir Türkçe yanıt taslağı yaz." }, { alanlar: [{ ad: "sinif", tur: "metin", aciklama: "rezervasyon, şikâyet, soru ya da iş birliği" }, { ad: "yanit", tur: "metin", aciklama: "Göndericiye yanıt taslağı" }] }),
      ad("s2", "Yanıtı kaydet", "veri", { projeId: "", koleksiyon: "form_yanitlari", alanlar: "{\"mesaj\": {{tetik.alanlar}}, \"sinif\": \"{{adim.s1.sinif}}\", \"taslak\": \"{{adim.s1.yanit}}\"}" }, { hata: "devam" }),
    ],
  },
  {
    id: "yorum-siniflandir", ad: "Yorumları duyguya göre ayır", kategori: "destek",
    aciklama: "Uygulamana yeni yorum eklenince yapay zekâ yönlendirici olumlu, olumsuz ya da soru diye ayırır; olumsuzlar şikâyet tablosuna, sorular yanıt kuyruğuna gider.", kapak: "/gercek/build/sablon/satis-paneli.webp",
    tetik: { tur: "veri", projeId: "", koleksiyon: "yorumlar" },
    kurulum: ["Tetikte ve kayıt adımlarında Build projeni seç"],
    adimlar: [
      ad("s1", "Yorumun türü", "siniflandir", { girdi: "{{tetik.kayit}}", talimat: "Bu bir müşteri yorumu.", esik: 50 }, { dallar: [
        { id: "d1", ad: "Olumlu", aciklama: "Memnun, öven ya da teşekkür eden yorum", adimlar: [] },
        { id: "d2", ad: "Olumsuz", aciklama: "Şikâyet, sorun ya da memnuniyetsizlik", adimlar: [
          ad("s2", "Şikâyeti kaydet", "veri", { projeId: "", koleksiyon: "sikayetler", alanlar: "{\"yorum\": {{tetik.kayit}}, \"gerekce\": \"{{adim.s1.gerekce}}\"}" }),
        ] },
        { id: "d3", ad: "Soru", aciklama: "Ürün ya da hizmet hakkında soru soruyor", adimlar: [
          ad("s3", "Yanıt taslağı", "ajan", { istem: "Müşteri şu soruyu sordu: {{tetik.kayit}}. Kısa ve net bir Türkçe yanıt taslağı yaz." }),
          ad("s4", "Yanıt kuyruğuna ekle", "veri", { projeId: "", koleksiyon: "yanit_kuyrugu", alanlar: "{\"yorum\": {{tetik.kayit}}, \"taslak\": \"{{adim.s3.cikti}}\"}" }),
        ] },
        { id: "yedek", ad: "Hiçbiri uymazsa", yedek: true, aciklama: "Yukarıdakilerden hiçbirine uymuyor", adimlar: [] },
      ] }),
    ],
  },
  {
    id: "icerik-onay", ad: "Gönderiyi onaya sun", kategori: "icerik",
    aciklama: "Her pazartesi haftanın gönderisini yazar, sen onaylayınca ya da düzenleyip onaylayınca yayın kuyruğuna ekler. Bir gün içinde yanıt vermezsen reddedilmiş sayılır.", kapak: "/gercek/kesfet/blog-shorts.webp",
    tetik: { tur: "zaman", zaman: { siklik: "haftalik", saat: "09:00", gunler: [1] } },
    kurulum: ["Kayıt adımında Build projeni seç"],
    adimlar: [
      ad("s1", "Gönderiyi yaz", "ajan", { istem: "Bugün {{tarih}}. Kahve markamız için bu haftanın Instagram gönderisini yaz: bir kanca cümlesi, 3 cümlelik metin ve 5 etiket." }, { alanlar: [{ ad: "metin", tur: "metin", aciklama: "Gönderinin tamamı" }] }),
      ad("s2", "Onayla", "onay", { baslik: "Haftanın gönderisi", icerik: "{{adim.s1.metin}}", duzenlenebilir: true, zamanAsimiMiktar: 1, zamanAsimiBirim: "gun", varsayilan: "ret" }, { dallar: [
        { id: "onay", ad: "Onaylanırsa", adimlar: [
          ad("s3", "Yayın kuyruğuna ekle", "veri", { projeId: "", koleksiyon: "yayin_kuyrugu", alanlar: "{\"metin\": \"{{adim.s2.icerik}}\", \"not\": \"{{adim.s2.not}}\"}" }),
        ] },
        { id: "ret", ad: "Reddedilirse", adimlar: [] },
      ] }),
    ],
  },
  {
    id: "haftalik-icerik", ad: "Haftalık sosyal medya planı", kategori: "icerik",
    aciklama: "Her pazartesi haftanın içerik planını çıkarır ve ilk gönderinin görselini üretir.", kapak: "/gercek/kesfet/blog-shorts.webp",
    tetik: { tur: "zaman", zaman: { siklik: "haftalik", saat: "09:00", gunler: [1] } },
    adimlar: [
      ad("s1", "Haftalık plan", "ajan", { istem: "Kahve markamız için bu haftanın Instagram planını çıkar: 5 gönderi, her biri için gün, kanca, metin ve görsel tarifi." }, { alanlar: [{ ad: "plan", tur: "metin", aciklama: "5 gönderilik plan" }, { ad: "gorselTarifi", tur: "metin", aciklama: "İlk gönderinin görsel tarifi, İngilizce tek paragraf" }] }),
      ad("s2", "İlk gönderinin görseli", "arac", { arac: "gorsel_uret", istem: "{{adim.s1.gorselTarifi}}", oran: "4:5" }, { hata: "devam" }),
    ],
  },
  {
    id: "sabah-ozeti", ad: "Her sabah sektör özeti", kategori: "icerik",
    aciklama: "Her iş günü 08.30'da sektöründeki gelişmeleri araştırır, kaynaklarıyla kısa bir özet çıkarır.", kapak: "/gercek/kesfet/blog-api.webp",
    tetik: { tur: "zaman", zaman: { siklik: "haftalik", saat: "08:30", gunler: [1, 2, 3, 4, 5] } },
    adimlar: [ad("s1", "Haberleri araştır ve özetle", "ajan", { istem: "Bugün {{tarih}}. Kahve ve perakende sektöründe son 24 saatteki önemli gelişmeleri web'de araştır. En önemli 5 haberi kaynak bağlantısıyla, her biri iki cümle olacak şekilde özetle." })],
  },
  {
    id: "buyuk-siparis", ad: "Büyük siparişi ekibe bildir", kategori: "satis",
    aciklama: "Mağazandan web kancasıyla gelen sipariş 1.000 TL'nin üstündeyse özet çıkarır ve ekibin sohbet kanalına gönderir; küçük siparişleri yalnız kaydeder.", kapak: "/gercek/panel/gal-gpt-6.webp",
    tetik: { tur: "webhook" },
    kurulum: ["Gönder adımına ekibinin Slack, Discord ya da Teams gelen web kancası adresini yaz", "Kayıt adımında Build projeni seç"],
    adimlar: [
      ad("s1", "Tutara göre", "yonlendirici", { mod: "ilk" }, { dallar: [
        { id: "d1", ad: "1.000 TL üstü", kosullar: [{ sol: "{{tetik.tutar}}", islec: "buyuk", sag: "1000" }], baglac: "ve", adimlar: [
          ad("s2", "Sipariş özeti", "ajan", { istem: "Şu sipariş geldi: {{tetik}}. Ekibe gönderilecek, müşteri adı, ürünler ve tutarı içeren 3 satırlık Türkçe bir özet yaz." }),
          ad("s3", "Ekibe gönder", "http", { yontem: "POST", url: "", basliklar: "", govde: "{\"text\": \"{{adim.s2.cikti}}\", \"content\": \"{{adim.s2.cikti}}\"}" }, { tekrar: { sayi: 2, bekleme: 5, artan: true } }),
        ] },
        { id: "yedek", ad: "Hiçbiri uymazsa", yedek: true, adimlar: [
          ad("s4", "Küçük siparişi kaydet", "veri", { projeId: "", koleksiyon: "siparisler", alanlar: "{{tetik}}" }),
        ] },
      ] }),
    ],
  },
  {
    id: "takip-mesaji", ad: "Formdan bir gün sonra takip", kategori: "operasyon",
    aciklama: "Form gelince kaydı yazar, bir gün bekler, sonra kişiye özel bir takip mesajı hazırlayıp takip listesine ekler. Bekleme sunucu yeniden başlasa da sürer.", kapak: "/gercek/build/sablon/satis-paneli.webp",
    tetik: { tur: "form", projeId: "" },
    kurulum: ["Tetikte ve kayıt adımlarında Build projeni seç"],
    adimlar: [
      ad("s1", "Başvuruyu kaydet", "veri", { projeId: "", koleksiyon: "basvurular", alanlar: "{{tetik.alanlar}}" }),
      ad("s2", "Bir gün bekle", "bekle", { mod: "sure", miktar: 1, birim: "gun" }),
      ad("s3", "Takip mesajı", "ajan", { istem: "Dün şu form geldi: {{tetik.alanlar}}. Kişiye bir gün sonra gönderilecek, sıcak ve kısa bir Türkçe takip mesajı yaz." }, { alanlar: [{ ad: "mesaj", tur: "metin" }] }),
      ad("s4", "Takip listesine ekle", "veri", { projeId: "", koleksiyon: "takipler", alanlar: "{\"basvuru\": \"{{adim.s1.id}}\", \"mesaj\": \"{{adim.s3.mesaj}}\"}" }),
    ],
  },
  {
    id: "yeni-kayit-ozet", ad: "Yeni üyeyi karşıla", kategori: "operasyon",
    aciklama: "Uygulamana yeni üye eklenince kişiye özel karşılama metni yazar ve kaydeder.", kapak: "/gercek/build/sablon/satis-paneli.webp",
    tetik: { tur: "veri", projeId: "", koleksiyon: "uyeler" },
    kurulum: ["Tetikte ve kayıt adımında Build projeni seç"],
    adimlar: [
      ad("s1", "Karşılama metni", "ajan", { istem: "Yeni kayıt: {{tetik.kayit}}. Bu kişiye uygulamamızı tanıtan, sıcak, 3 cümlelik bir karşılama metni yaz." }),
      ad("s2", "Kaydet", "veri", { projeId: "", koleksiyon: "karsilamalar", alanlar: "{\"uye\": \"{{tetik.kayit.id}}\", \"metin\": \"{{adim.s1.cikti}}\"}" }, { hata: "devam" }),
    ],
  },
];

/** Şablondan kurulan adımlara yeni kimlik verir; şablon içindeki {{adim.ş}} göndermelerini de yeniler. */
export function sablonKur(t: SistemSablon, kimlik: () => string): Adim[] {
  const harita = new Map<string, string>();
  for (const x of duzListe(t.adimlar)) harita.set(x.a.id, kimlik());
  const yenile = (s: unknown) => (typeof s === "string" ? s.replace(/\{\{\s*adim\.([A-Za-z0-9_-]+)/g, (m, k: string) => (harita.has(k) ? `{{adim.${harita.get(k)}` : m)) : s);
  return agacEsle(JSON.parse(JSON.stringify(t.adimlar)) as Adim[], (a) => ({
    ...a, id: harita.get(a.id) ?? kimlik(),
    ayar: Object.fromEntries(Object.entries(a.ayar).map(([k, v]) => [k, yenile(v)])),
    kosullar: a.kosullar?.map((k) => ({ sol: String(yenile(k.sol)), islec: k.islec, sag: String(yenile(k.sag)) })),
    dallar: a.dallar?.map((d) => ({ ...d, id: d.yedek || SABIT_DALLAR[a.tur] ? d.id : kimlik(), kosullar: d.kosullar?.map((k) => ({ sol: String(yenile(k.sol)), islec: k.islec, sag: String(yenile(k.sag)) })) })),
  }));
}

/** Koşulu düz Türkçe cümle yapar (simgesiz). sol ve sag okunur hale getirilmiş olmalı. */
export function kosulCumlesi(sol: string, islec: string, sag: string): string {
  const a = sol || "değer", b = sag || "boş";
  switch (islec) {
    case "esit": return `${a}, ${b} ise`;
    case "esit-degil": return `${a}, ${b} değilse`;
    case "iceriyor": return `${a} içinde ${b} geçiyorsa`;
    case "icermiyor": return `${a} içinde ${b} geçmiyorsa`;
    case "baslar": return `${a}, ${b} ile başlıyorsa`;
    case "biter": return `${a}, ${b} ile bitiyorsa`;
    case "desen": return `${a} desene uyuyorsa`;
    case "buyuk": return `${a}, ${b} üstündeyse`;
    case "kucuk": return `${a}, ${b} altındaysa`;
    case "buyuk-esit": return `${a} en az ${b} ise`;
    case "kucuk-esit": return `${a} en çok ${b} ise`;
    case "tarih-once": return `${a}, ${b} tarihinden önceyse`;
    case "tarih-sonra": return `${a}, ${b} tarihinden sonraysa`;
    case "dogru": return `${a} doğruysa`;
    case "yanlis": return `${a} yanlışsa`;
    case "bos": return `${a} boşsa`;
    case "bos-degil": return `${a} doluysa`;
    default: return `${a} ${islecAdi(islec)} ${b}`;
  }
}
