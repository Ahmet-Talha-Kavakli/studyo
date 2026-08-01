import type { Metadata } from "next";
import { HukukiSayfa } from "@/components/kurumsal/HukukiSayfa";

export const metadata: Metadata = { title: "Gizlilik Politikası — Vayra" };

export default function GizlilikPage() {
  return (
    <HukukiSayfa
      baslik="Gizlilik Politikası"
      guncelleme="1 Temmuz 2026"
      ozet="Verilerini nasıl topladığımız, kullandığımız ve koruduğumuz — açık ve sade."
      bolumler={[
        { baslik: "Topladığımız veriler", icerik: "Hesap bilgilerin (ad, e-posta), ürettiğin içerikler ve platform kullanım verileri. Verilerini yalnızca hizmeti sunmak ve geliştirmek için kullanırız." },
        { baslik: "Verilerin kullanımı", icerik: "Verilerini üretimlerini işlemek, hesabını yönetmek ve deneyimini iyileştirmek için kullanırız. İzin olmadan üçüncü taraflarla paylaşmayız." },
        { baslik: "İçerik sahipliği", icerik: "Ürettiğin tüm içerikler sana aittir. Ticari kullanım hakları planına göre sağlanır. Kullanıcı içeriğin izinsiz olarak model eğitimine kullanılmaz." },
        { baslik: "Çerezler", icerik: "Oturumunu sürdürmek ve tercihleri hatırlamak için gerekli çerezleri kullanırız. Ayrıntılar Çerez Bildirimi sayfasındadır." },
        { baslik: "Güvenlik", icerik: "Verilerin aktarımda ve durağan hâlde şifreleme ve endüstri standardı güvenlik önlemleriyle korunur." },
        { baslik: "Haklarınız", icerik: "Verilerine erişme, düzeltme ve silme hakkına sahipsin. Talep için hello@vayra.ai adresine yazabilirsin." },
      ]}
    />
  );
}
