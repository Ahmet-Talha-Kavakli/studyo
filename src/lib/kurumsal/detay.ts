/* Kurumsal sayfaların derinlik verileri — güvenlik, kariyer, partner, iletişim,
   durum ek metrikleri. Her sayfanın "en ufak detay" bölümlerini besler. */

/* ── GÜVENLİK ── */
export interface AltIsleyici {
  ad: string;
  amac: string;
  konum: string;
}

/* Veri işleyen üçüncü taraflar (GDPR md.28 şeffaflığı). */
export const ALT_ISLEYICILER: AltIsleyici[] = [
  { ad: "Bulut altyapı sağlayıcısı", amac: "Barındırma ve hesaplama", konum: "AB · ABD · Singapur" },
  { ad: "Ödeme sağlayıcısı", amac: "Abonelik ve faturalama", konum: "AB · ABD" },
  { ad: "E-posta servisi", amac: "İşlemsel e-postalar", konum: "AB" },
  { ad: "Analitik sağlayıcısı", amac: "Anonim kullanım ölçümü", konum: "AB" },
  { ad: "CDN sağlayıcısı", amac: "İçerik dağıtımı", konum: "Global" },
  { ad: "Model sağlayıcıları", amac: "Üretim isteklerinin işlenmesi", konum: "AB · ABD" },
  { ad: "Destek platformu", amac: "Müşteri destek talepleri", konum: "AB" },
];

export const GUVENLIK_SERTIFIKA: { ad: string; durum: string }[] = [
  { ad: "TLS 1.3 şifreleme", durum: "Aktif" },
  { ad: "AES-256 durağan veri", durum: "Aktif" },
  { ad: "GDPR uyumu (AB)", durum: "Uyumlu" },
  { ad: "CCPA / CPRA (ABD)", durum: "Uyumlu" },
  { ad: "UK GDPR", durum: "Uyumlu" },
  { ad: "PIPEDA (Kanada)", durum: "Uyumlu" },
  { ad: "SOC 2 (Tip II)", durum: "Süreçte" },
  { ad: "ISO 27001", durum: "Süreçte" },
];

/** Veri ikamet bölgeleri — kurumsal planlarda seçilebilir. */
export const VERI_BOLGELERI: { bolge: string; konum: string; not: string }[] = [
  { bolge: "Avrupa", konum: "Frankfurt · Amsterdam", not: "Varsayılan bölge · GDPR" },
  { bolge: "Kuzey Amerika", konum: "Virginia · Oregon", not: "CCPA uyumlu" },
  { bolge: "Asya-Pasifik", konum: "Singapur · Tokyo", not: "Düşük gecikme" },
];

/* Güvenlik SSS — güvenlik sayfası alt bölümü. */
export const GUVENLIK_SSS: { s: string; c: string }[] = [
  { s: "Verilerim nerede saklanıyor?", c: "Veriler, sözleşmeli bulut sağlayıcılarının Avrupa, Kuzey Amerika ve Asya-Pasifik veri merkezlerinde, şifreli ve izole ortamlarda saklanır. Kurumsal planlarda veri ikamet bölgesini sen seçersin." },
  { s: "Uluslararası veri aktarımı nasıl korunuyor?", c: "AB dışına yapılan aktarımlar, Avrupa Komisyonu'nun Standart Sözleşme Maddeleri (SCC) ve gerekli hallerde ek teknik önlemlerle güvence altına alınır." },
  { s: "Çalışanlar verilerime erişebilir mi?", c: "Hayır, rutin olarak erişilemez. Erişim en az yetki ilkesiyle sınırlıdır; yalnızca destek talebin doğrultusunda ve denetim kaydıyla erişilir." },
  { s: "Bir sızıntı olursa ne yaparsınız?", c: "Olay müdahale planımız devreye girer: etkilenen kullanıcılar ve yetkili denetim otoriteleri mevzuatın öngördüğü sürede (GDPR kapsamında 72 saat) bilgilendirilir, kök neden giderilir." },
  { s: "İçeriğim yapay zekâyı eğitmek için kullanılıyor mu?", c: "Hayır. Kullanıcı içeriğin izinsiz olarak model eğitimine kullanılmaz." },
  { s: "Kurumsal güvenlik dokümanı alabilir miyim?", c: "Evet. Güvenlik değerlendirme paketi, penetrasyon testi özeti ve alt işleyici listesi için security@vayra.ai adresine yazabilirsin." },
];

/* ── KARİYER ── */
export interface SurecAdim {
  no: number;
  ad: string;
  aciklama: string;
  sure: string;
}

export const BASVURU_SURECI: SurecAdim[] = [
  { no: 1, ad: "Başvuru", aciklama: "CV ve kısa bir motivasyon notu gönder. Her başvuruyu ekibimiz okur.", sure: "5 dk" },
  { no: 2, ad: "İlk görüşme", aciklama: "Ekibimizle tanış; rol, beklentiler ve kültürü konuşuruz.", sure: "30 dk" },
  { no: 3, ad: "Teknik/pratik aşama", aciklama: "Role uygun bir vaka çalışması veya portföy incelemesi.", sure: "1-2 saat" },
  { no: 4, ad: "Ekip görüşmesi", aciklama: "Birlikte çalışacağın ekiple derinlemesine görüşme.", sure: "45 dk" },
  { no: 5, ad: "Teklif", aciklama: "Uyumluysak teklifimizi sunar, sorularını yanıtlarız.", sure: "Hızlı" },
];

export const KARIYER_SSS: { s: string; c: string }[] = [
  { s: "Uzaktan çalışabilir miyim?", c: "Evet, uzaktan öncelikli bir ekibiz. Ekibimiz 18 ülkeye yayılmış durumda; UTC−6 ile UTC+9 arasındaki saat dilimlerinden çalışabilirsin." },
  { s: "Hangi ülkelerden işe alım yapıyorsunuz?", c: "İstihdam kaydımızın (EOR) bulunduğu 30'dan fazla ülkeden tam zamanlı işe alım yapabiliyoruz. Ülkeni başvuruda belirtmen yeterli." },
  { s: "Staj imkânı var mı?", c: "Dönemsel olarak stajyer alıyoruz. Açık staj pozisyonu yoksa da careers@vayra.ai adresine yazabilirsin." },
  { s: "Başvurum ne kadar sürede yanıtlanır?", c: "Genellikle 5 iş günü içinde ilk dönüşü yaparız." },
  { s: "Görüşmeler hangi dilde yapılıyor?", c: "Görüşmelerimiz İngilizce yürütülür; ekip içi ortak çalışma dili de İngilizcedir." },
  { s: "Aradığım pozisyon yok, yine de başvurabilir miyim?", c: "Kesinlikle. Yeteneklerini anlatan bir e-postayı careers@vayra.ai adresine gönder; uygun bir rol açıldığında hatırlarız." },
];

/** Yan haklar — kariyer sayfası "neden Vayra" bölümü. */
export const YAN_HAKLAR: { ad: string; ozet: string }[] = [
  { ad: "Uzaktan öncelikli", ozet: "Nereden çalışacağını sen seçersin; ofisler isteğe bağlı." },
  { ad: "Esnek saatler", ozet: "Sonuç odaklıyız. Zaman dilimin bir engel değil." },
  { ad: "Hisse opsiyonu", ozet: "Tüm tam zamanlı çalışanlar şirket hissesine ortak olur." },
  { ad: "Donanım bütçesi", ozet: "İhtiyacın olan kurulumu biz karşılarız." },
  { ad: "Öğrenme bütçesi", ozet: "Yıllık konferans, kurs ve kitap desteği." },
  { ad: "Yıllık ekip buluşması", ozet: "Yılda bir kez tüm ekip aynı şehirde bir araya gelir." },
];

/* ── PARTNER ── */
export const PARTNER_SURECI: SurecAdim[] = [
  { no: 1, ad: "Başvuru", aciklama: "Ortaklık türünü ve şirketini kısaca anlat.", sure: "10 dk" },
  { no: 2, ad: "Değerlendirme", aciklama: "Ekibimiz uygunluğu ve ortak fırsatları değerlendirir.", sure: "3-5 gün" },
  { no: 3, ad: "Görüşme & anlaşma", aciklama: "Şartları, komisyonu ve teknik gereksinimleri netleştiririz.", sure: "1-2 hafta" },
  { no: 4, ad: "Kurulum & lansman", aciklama: "Entegrasyon, eğitim ve ortak duyuruyla başlarız.", sure: "Role göre" },
];

export const PARTNER_SSS: { s: string; c: string }[] = [
  { s: "Ortaklık için maliyet var mı?", c: "Partner programına katılım ücretsizdir. Gelir paylaşımı ve komisyon oranları ortaklık türüne göre belirlenir." },
  { s: "API erişimi nasıl sağlanır?", c: "Teknoloji ortaklarına özel API kotaları ve dokümantasyon sağlanır; teknik ekibimiz entegrasyonda destek olur." },
  { s: "Küçük bir ajansım, başvurabilir miyim?", c: "Elbette. Her ölçekte ajans ve stüdyoyla çalışıyoruz; program ihtiyaçlarına göre uyarlanır." },
];

/* ── İLETİŞİM ──
   NOT: Destek artık tek bir saat dilimine (TSİ) bağlı değil — ekip üç bölgeye
   yayıldığı için iş saatleri "takip eden güneş" modeliyle sunulur. */
export const CALISMA_SAATLERI: { gun: string; saat: string }[] = [
  { gun: "Pazartesi – Cuma", saat: "Kesintisiz — 3 bölge dönüşümlü" },
  { gun: "Avrupa (CET)", saat: "09:00 – 18:00" },
  { gun: "Amerika (ET)", saat: "09:00 – 18:00" },
  { gun: "Asya-Pasifik (SGT)", saat: "09:00 – 18:00" },
  { gun: "Hafta sonu", saat: "E-posta ile — 1 iş günü yanıt" },
];

export const ILETISIM_SSS: { s: string; c: string }[] = [
  { s: "Ne kadar sürede yanıt alırım?", c: "Genel talepleri genellikle 1 iş günü içinde yanıtlarız. Destek ekibimiz üç bölgede dönüşümlü çalıştığı için hafta içi her saatte bir ekip açıktır." },
  { s: "Hangi dillerde destek veriyorsunuz?", c: "Destek ekibimiz İngilizce, Türkçe, İspanyolca, Almanca ve Japonca yanıt verebilir." },
  { s: "Kurumsal teklif alabilir miyim?", c: "Evet. İletişim formunda konu olarak 'Satış & Kurumsal' seç; satış ekibimiz özel bir teklifle döner." },
  { s: "Faturamla ilgili soru kime iletmeliyim?", c: "Faturalama sorularını panel içindeki Destek bölümünden veya hello@vayra.ai adresinden iletebilirsin." },
];
