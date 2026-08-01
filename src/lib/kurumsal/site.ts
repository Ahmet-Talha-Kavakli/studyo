/* Kurumsal alan genel sabitleri — footer, iletişim, basın ortak kullanır.
 *
 * GLOBAL KİMLİK (2026-08-01): Şirket kimliği Türkiye merkezli olmaktan çıkarılıp
 * global bir yapıya taşındı. Önceki hâlde merkez "İstanbul, Türkiye", yasal ad
 * "A.Ş.", kimlik alanları MERSİS / vergi dairesi / vergi no (yalnız TR mevzuatı)
 * idi. Şimdi: Amsterdam merkezli, dağıtık ekipli, çok bölgeli bir şirket.
 *
 * NOT: Arayüz DİLİ Türkçe kalır — değişen yalnızca ŞİRKET KİMLİĞİDİR.
 */

export const SIRKET = {
  ad: "Vayra",
  yasalAd: "Vayra Technologies B.V.",
  slogan: "Yaratıcılığın altyapısı",
  aciklama:
    "Tek panelde sinematik video, editorial görsel, 3D modelleme ve stüdyo kalitesinde ses. Fikirle yayın arasındaki mesafeyi sıfırlıyoruz.",
  kurulus: "2024",
  merkez: "Amsterdam, Hollanda",
  /* Global tüzel kişilik kimlikleri (TR'ye özgü MERSİS / vergi dairesi yerine). */
  ticaretSicil: "KvK 89451207",
  vergiNo: "NL864921503B01",
};

export const ILETISIM = {
  genel: "hello@vayra.ai",
  destek: "support@vayra.ai",
  basin: "press@vayra.ai",
  kariyer: "careers@vayra.ai",
  partner: "partners@vayra.ai",
  /* Veri koruma sorumlusu — global (KVKK'ya özgü adres yerine). */
  gizlilik: "privacy@vayra.ai",
  guvenlik: "security@vayra.ai",
  adres: "Keizersgracht 241, 1016 EA Amsterdam, Hollanda",
  telefon: "+31 20 808 44 10",
};

/** Ofisler — iletişim ve kurumsal sayfalarda global varlığı gösterir. */
export const OFISLER: { sehir: string; ulke: string; rol: string; saat: string }[] = [
  { sehir: "Amsterdam", ulke: "Hollanda", rol: "Genel merkez", saat: "CET · UTC+1" },
  { sehir: "New York", ulke: "ABD", rol: "Amerika operasyonu", saat: "ET · UTC−5" },
  { sehir: "Singapur", ulke: "Singapur", rol: "Asya-Pasifik", saat: "SGT · UTC+8" },
  { sehir: "Londra", ulke: "Birleşik Krallık", rol: "Satış & ortaklıklar", saat: "GMT · UTC+0" },
];

/* Gerçek sosyal hesap URL'leri (footer placeholder # yerine). */
export const SOSYAL = {
  x: "https://x.com/vayra",
  instagram: "https://instagram.com/vayra",
  youtube: "https://youtube.com/@vayra",
  github: "https://github.com/vayra",
  linkedin: "https://linkedin.com/company/vayra",
};
