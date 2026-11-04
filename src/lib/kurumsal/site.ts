/* Kurumsal alan genel sabitleri — alt bilgi, iletişim, basın, yasal belgeler ortak kullanır.
 *
 * Şirket yapısı: global merkez Amsterdam'da (Vayra Technologies B.V.); Türkiye'deki
 * kullanıcılara hizmet, TL faturalama, kreatör ödemeleri ve KVKK kapsamındaki veri
 * sorumluluğu İstanbul'daki bağlı şirket (Vayra Teknoloji A.Ş.) üzerinden yürür.
 * Yasal metinler iki tüzel kişiliği de bu sabitlerden okur.
 *
 * NOT: Sicil, vergi ve MERSİS numaraları yayın öncesi gerçek kayıtlarla değiştirilmelidir.
 */

export const SIRKET = {
  ad: "Vayra",
  yasalAd: "Vayra Technologies B.V.",
  slogan: "Yaratıcılığın altyapısı",
  aciklama:
    "Video, görsel, ses, müzik ve 3D için tek yaratım platformu. Fikirle yayın arasındaki mesafeyi sıfırlıyoruz.",
  kurulus: "2024",
  merkez: "Amsterdam, Hollanda",
  ticaretSicil: "KvK 89451207",
  vergiNo: "NL864921503B01",
};

/** Türkiye'deki bağlı şirket — KVKK veri sorumlusu, TL faturalama, mesafeli satış satıcısı. */
export const TR_SIRKET = {
  yasalAd: "Vayra Teknoloji Anonim Şirketi",
  kisaAd: "Vayra Teknoloji A.Ş.",
  adres: "Maslak Mah. Büyükdere Cad. No:255 Nurol Plaza Kat:12, 34485 Sarıyer / İstanbul",
  mersis: "0925 0841 7360 0001",
  vergiDairesi: "Maslak Vergi Dairesi",
  vergiNo: "9250841736",
  ticaretSicil: "İstanbul Ticaret Sicili 418526-5",
  kep: "vayrateknoloji@hs01.kep.tr",
  telefon: "+90 212 909 44 10",
};

export const ILETISIM = {
  genel: "hello@vayra.ai",
  destek: "support@vayra.ai",
  satis: "sales@vayra.ai",
  basin: "press@vayra.ai",
  kariyer: "careers@vayra.ai",
  partner: "partners@vayra.ai",
  gizlilik: "privacy@vayra.ai",
  kvkk: "kvkk@vayra.ai",
  guvenlik: "security@vayra.ai",
  hukuk: "legal@vayra.ai",
  adres: "Keizersgracht 241, 1016 EA Amsterdam, Hollanda",
  telefon: "+31 20 808 44 10",
};

/** Ofisler — iletişim ve kurumsal sayfalarda global varlığı gösterir. */
export const OFISLER: { sehir: string; ulke: string; rol: string; saat: string; adres: string }[] = [
  { sehir: "Amsterdam", ulke: "Hollanda", rol: "Genel merkez", saat: "Orta Avrupa saati", adres: "Keizersgracht 241" },
  { sehir: "İstanbul", ulke: "Türkiye", rol: "Türkiye operasyonu", saat: "Türkiye saati", adres: "Maslak, Sarıyer" },
  { sehir: "Londra", ulke: "Birleşik Krallık", rol: "Satış & ortaklıklar", saat: "Londra saati", adres: "Shoreditch" },
  { sehir: "New York", ulke: "ABD", rol: "Amerika operasyonu", saat: "Doğu ABD saati", adres: "SoHo" },
  { sehir: "Singapur", ulke: "Singapur", rol: "Asya-Pasifik", saat: "Singapur saati", adres: "Tanjong Pagar" },
];

/* Sosyal hesaplar */
export const SOSYAL = {
  x: "https://x.com/vayra",
  instagram: "https://instagram.com/vayra",
  youtube: "https://youtube.com/@vayra",
  github: "https://github.com/vayra",
  linkedin: "https://linkedin.com/company/vayra",
};
