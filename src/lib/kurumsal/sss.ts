/* SSS — kategorili, /sss sayfasında aranabilir; fiyatlandırma da alt kümesini kullanır. */

export interface SSSMadde {
  s: string; // soru
  c: string; // cevap
}

export interface SSSKategori {
  ad: string;
  maddeler: SSSMadde[];
}

export const SSS_KATEGORILER: SSSKategori[] = [
  {
    ad: "Genel",
    maddeler: [
      { s: "Vayra nedir?", c: "Vayra; sinematik video, editorial görsel, 3D modelleme ve stüdyo kalitesinde ses üretimini tek panelde birleştiren yeni nesil bir yaratıcı platformdur." },
      { s: "Ücretsiz deneyebilir miyim?", c: "Evet. Kayıt olduğunda başlangıç kredisiyle ürünü ücretsiz denersin; kredi kartı gerekmez." },
      { s: "Hangi dilleri destekliyor?", c: "Arayüz Türkçe ve İngilizce sunulur; ses ve altyazı üretimi 40'tan fazla dili destekler." },
      { s: "Hangi ülkelerde kullanılabilir?", c: "Vayra 120'den fazla ülkede kullanılabilir. Ödeme yerel para biriminde alınır ve fatura bulunduğun ülkenin vergi kurallarına göre düzenlenir." },
      { s: "Ekip olarak kullanabilir miyiz?", c: "Evet. Kurumsal planlarda ekip çalışma alanları, roller ve paylaşımlı proje kütüphanesi bulunur." },
    ],
  },
  {
    ad: "Fiyatlandırma & Krediler",
    maddeler: [
      { s: "Krediler nasıl çalışır?", c: "Her üretim türü belirli bir kredi tüketir. Planına göre aylık kredi alırsın; kredin biterse ek paket satın alabilirsin." },
      { s: "Kullanılmayan krediler devreder mi?", c: "Aylık planlarda krediler dönem sonunda sıfırlanır; yıllık planlarda ise bir sonraki döneme belli bir oranda devreder." },
      { s: "İstediğim zaman iptal edebilir miyim?", c: "Evet, aboneliğini istediğin an iptal edebilirsin. Dönem sonuna kadar erişimin sürer." },
      { s: "İade politikanız nedir?", c: "Kullanılmamış hizmetler için 14 gün içinde iade talebinde bulunabilirsin. Detaylar İade Politikası sayfasındadır." },
    ],
  },
  {
    ad: "Üretim & İçerik",
    maddeler: [
      { s: "Ürettiğim içerikler kime ait?", c: "Ürettiğin tüm içerikler sana aittir. Ticari kullanım hakları planına göre sağlanır." },
      { s: "Ticari kullanabilir miyim?", c: "Ücretli planlarda üretimlerini ticari projelerinde kullanabilirsin. Ücretsiz planda bazı sınırlar geçerlidir." },
      { s: "İçerik moderasyonu var mı?", c: "Evet. Platform kötüye kullanımı önlemek için bir moderasyon katmanı çalıştırır; yasa dışı veya zararlı içerik üretimi engellenir." },
      { s: "Kendi medyamı yükleyebilir miyim?", c: "Stüdyolarda referans görsel/model yükleyebilirsin; bu girdiler yalnızca senin üretimin için kullanılır." },
    ],
  },
  {
    ad: "Güvenlik & Gizlilik",
    maddeler: [
      { s: "Verilerim güvende mi?", c: "Verilerin aktarımda ve durağan hâlde şifrelenir; endüstri standardı güvenlik önlemleriyle korunur." },
      { s: "Verilerim modelleri eğitmek için kullanılıyor mu?", c: "Hayır. Kullanıcı içeriğin izinsiz olarak model eğitimine kullanılmaz." },
      { s: "GDPR'a uyumlu musunuz?", c: "Evet. Kişisel verilerin GDPR, UK GDPR ve CCPA/CPRA başta olmak üzere ilgili veri koruma mevzuatına uygun işlenir; detaylar Veri Koruma Bildirimi'ndedir." },
      { s: "Verilerim hangi bölgede tutulur?", c: "Varsayılan olarak Avrupa bölgesinde tutulur. Kurumsal planlarda Avrupa, Kuzey Amerika veya Asya-Pasifik bölgelerinden birini veri ikamet bölgesi olarak seçebilirsin." },
      { s: "Verilerimi silebilir miyim?", c: "Evet. Hesabından verilerine erişebilir, düzeltebilir, dışa aktarabilir ve silme talebinde bulunabilirsin." },
    ],
  },
  {
    ad: "API & Geliştirici",
    maddeler: [
      { s: "API sunuyor musunuz?", c: "Evet. REST API ile üretim akışlarını kendi ürününe entegre edebilirsin. Ayrıntılar Geliştirici sayfasındadır." },
      { s: "Ölçek limitleri neler?", c: "Her plan için istek hızı (rate limit) ve eşzamanlılık sınırları vardır; kurumsal planlarda bunlar artırılabilir." },
      { s: "Webhook desteği var mı?", c: "Uzun süren üretimler için webhook ile tamamlanma bildirimi alabilirsin." },
    ],
  },
];

/* Fiyatlandırma sayfasının kullandığı alt küme (Genel + Fiyatlandırma). */
export const FIYAT_SSS: SSSMadde[] = [
  ...SSS_KATEGORILER[1].maddeler,
  { s: "Plan değişikliği yapabilir miyim?", c: "İstediğin an yükseltebilir veya düşürebilirsin; fark orantılı olarak hesaplanır." },
];
