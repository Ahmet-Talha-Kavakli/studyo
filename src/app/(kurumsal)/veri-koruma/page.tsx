import type { Metadata } from "next";
import { HukukiSayfa } from "@/components/kurumsal/HukukiSayfa";
import { SIRKET, ILETISIM } from "@/lib/kurumsal/site";

/**
 * Veri Koruma Bildirimi — /kvkk sayfasının GLOBAL muadili (2026-08-01).
 *
 * Öncesi: yalnızca 6698 sayılı Türk KVKK mevzuatına dayanan bir aydınlatma
 * metniydi ve şirketi "Vayra Teknoloji A.Ş." olarak tanımlıyordu. Şirket global
 * bir yapıya taşındığı için metin GDPR (AB) merkezli, UK GDPR ve CCPA/CPRA'yı
 * da kapsayan çok yargı bölgeli bir bildirime çevrildi.
 *
 * NOT: Yasal koruma boşluğu bırakmamak için sayfa SİLİNMEDİ, dönüştürüldü.
 */

export const metadata: Metadata = {
  title: "Veri Koruma Bildirimi — Vayra",
  description:
    "Vayra'nın veri sorumlusu sıfatıyla kişisel verileri işleme amaçları, hukuki dayanakları, uluslararası aktarım güvenceleri ve GDPR / UK GDPR / CCPA kapsamındaki haklarına ilişkin bildirim.",
};

export default function VeriKorumaPage() {
  return (
    <HukukiSayfa
      baslik="Veri Koruma Bildirimi"
      guncelleme="1 Temmuz 2026"
      ozet="Kişisel verilerinin nasıl işlendiğine ve hangi haklara sahip olduğuna dair global bildirim."
      bolumler={[
        {
          baslik: "Veri sorumlusu",
          icerik: `Kişisel verilerin, veri sorumlusu (data controller) sıfatıyla ${SIRKET.yasalAd} tarafından aşağıda açıklanan kapsamda işlenmektedir. Şirket merkezi: ${ILETISIM.adres}. Ticaret sicil: ${SIRKET.ticaretSicil}. Veri koruma sorumlusuna ${ILETISIM.gizlilik} adresinden ulaşabilirsin.`,
        },
        {
          baslik: "Kapsam ve geçerli mevzuat",
          icerik:
            "Bu bildirim; Avrupa Birliği Genel Veri Koruma Tüzüğü (GDPR), Birleşik Krallık GDPR, Kaliforniya Tüketici Gizliliği Yasası (CCPA/CPRA) ve bulunduğun ülkede geçerli diğer veri koruma mevzuatı kapsamında hazırlanmıştır. Nerede yaşıyor olursan ol, aşağıdaki korumaların tamamından yararlanırsın.",
        },
        {
          baslik: "İşlenen kişisel veriler",
          icerik:
            "Kimlik ve iletişim bilgilerin (ad, soyad, e-posta), hesap ve işlem güvenliği verilerin, platformda ürettiğin içerikler ile bunlara ait istemler, ödeme ve fatura bilgilerin ve platform kullanım/log kayıtların işlenmektedir.",
        },
        {
          baslik: "İşleme amaçları",
          icerik:
            "Verilerin; üyelik ve hesap yönetimi, AI üretim hizmetlerinin sunulması, ödeme süreçlerinin yürütülmesi, müşteri desteğinin sağlanması, hizmet kalitesinin ve güvenliğinin artırılması ile yasal yükümlülüklerin yerine getirilmesi amaçlarıyla işlenir.",
        },
        {
          baslik: "Hukuki dayanaklar",
          icerik:
            "GDPR md.6 uyarınca verilerin; sözleşmenin kurulması ve ifası (md.6/1-b), hukuki yükümlülüğün yerine getirilmesi (md.6/1-c), meşru menfaat (md.6/1-f) hukuki sebeplerine dayanılarak; pazarlama iletişimi gibi hallerde ise açık rızan (md.6/1-a) alınarak işlenir. Rızanı dilediğin an geri çekebilirsin.",
        },
        {
          baslik: "Verilerin paylaşımı",
          icerik:
            "Verilerin, hizmetin sunulması için gerekli olduğu ölçüde barındırma, ödeme altyapısı, model ve analitik sağlayıcılarıyla GDPR md.28 kapsamındaki veri işleme sözleşmeleri altında paylaşılabilir. Güncel alt işleyici listesi Güvenlik sayfasında yayımlanır. Kişisel verilerini hiçbir koşulda satmayız.",
        },
        {
          baslik: "Uluslararası aktarım",
          icerik:
            "Altyapımız Avrupa, Kuzey Amerika ve Asya-Pasifik bölgelerinde konumlanır. Avrupa Ekonomik Alanı dışına yapılan aktarımlar, Avrupa Komisyonu'nun Standart Sözleşme Maddeleri (SCC), yeterlilik kararları ve gerekli hallerde ek teknik önlemlerle güvence altına alınır. Kurumsal planlarda veri ikamet bölgeni sen seçebilirsin.",
        },
        {
          baslik: "Saklama süresi",
          icerik:
            "Kişisel verilerin, hesabın aktif olduğu sürece saklanır. Hesabını sildiğinde içerik ve profil verilerin 30 gün içinde kalıcı olarak silinir; finansal kayıtlar yasal saklama yükümlülüğü nedeniyle mevzuatın öngördüğü süre boyunca (genellikle 7 yıl) tutulur.",
        },
        {
          baslik: "Haklarınız (GDPR / UK GDPR)",
          icerik:
            "Erişim, düzeltme, silinme ('unutulma'), işlemenin kısıtlanması, veri taşınabilirliği ve işlemeye itiraz haklarına sahipsin. Ayrıca otomatik karar verme süreçlerine tabi tutulmama hakkın bulunur.",
        },
        {
          baslik: "Haklarınız (CCPA / CPRA)",
          icerik:
            "Kaliforniya'da ikamet ediyorsan; hangi kişisel bilgilerin toplandığını öğrenme, silinmesini talep etme, düzeltilmesini isteme ve satış/paylaşımdan çıkma (opt-out) haklarına sahipsin. Bu hakları kullanman nedeniyle sana ayrımcılık uygulanmaz.",
        },
        {
          baslik: "Başvuru yöntemi",
          icerik: `Haklarına ilişkin taleplerini ${ILETISIM.gizlilik} adresine hesap e-postandan iletebilirsin. Başvurun en geç 30 gün içinde ücretsiz olarak sonuçlandırılır. Sonuçtan memnun kalmazsan, bulunduğun ülkenin veri koruma denetim otoritesine şikâyette bulunma hakkın saklıdır.`,
        },
      ]}
    />
  );
}
