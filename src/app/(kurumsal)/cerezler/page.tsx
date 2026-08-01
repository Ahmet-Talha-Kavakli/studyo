import type { Metadata } from "next";
import { HukukiSayfa } from "@/components/kurumsal/HukukiSayfa";

export const metadata: Metadata = { title: "Çerez Bildirimi — Vayra" };

export default function CerezlerPage() {
  return (
    <HukukiSayfa
      baslik="Çerez Bildirimi"
      guncelleme="1 Temmuz 2026"
      ozet="Hangi çerezleri neden kullandığımız ve tercihlerini nasıl yöneteceğin."
      bolumler={[
        { baslik: "Çerez nedir?", icerik: "Çerezler, siteyi ziyaret ettiğinde tarayıcına kaydedilen küçük metin dosyalarıdır. Oturumunu sürdürmek, tercihlerini hatırlamak ve deneyimini iyileştirmek için kullanılır." },
        { baslik: "Zorunlu çerezler", icerik: "Giriş oturumunu ve güvenliği sağlayan çerezler. Bunlar olmadan platform çalışmaz, bu yüzden devre dışı bırakılamazlar." },
        { baslik: "Tercih çerezleri", icerik: "Dil, tema ve arayüz tercihlerini (ör. son kullanılan stüdyolar) hatırlar. Kapatırsan bu ayarlar her ziyarette sıfırlanır." },
        { baslik: "Analitik çerezler", icerik: "Platformu nasıl kullandığını anonim olarak ölçerek özellikleri geliştirmemize yardımcı olur. Kişisel kimlik bilgisi içermez." },
        { baslik: "Çerezleri yönetme", icerik: "Tarayıcı ayarlarından çerezleri silebilir veya engelleyebilirsin. Ayrıca hesap ayarlarından tercih ve analitik çerezleri için onayını istediğin an geri çekebilirsin." },
        { baslik: "Üçüncü taraf çerezleri", icerik: "Ödeme ve içerik dağıtımı için çalıştığımız güvenilir sağlayıcılar kendi çerezlerini kullanabilir. Bu sağlayıcılar kendi gizlilik politikalarına tabidir." },
        { baslik: "İletişim", icerik: "Çerez uygulamalarımızla ilgili sorular için hello@vayra.ai adresine yazabilirsin." },
      ]}
    />
  );
}
