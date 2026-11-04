import type { Metadata } from "next";
import { YasalBelge } from "@/components/sirket/YasalBelge";
import { GIZLILIK, GIZLILIK_GECMIS, GIZLILIK_META } from "@/lib/kurumsal/yasal/gizlilik";
import { ILETISIM } from "@/lib/kurumsal/site";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description: "Kişisel verilerinin nasıl işlendiği, saklandığı ve korunduğu; GDPR ve KVKK kapsamındaki hakların.",
};

export default function Sayfa() {
  return (
    <YasalBelge
      baslik="Gizlilik Politikası"
      aciklama="Hangi verileri neden topladığımızı, kimlerle paylaştığımızı, ne kadar sakladığımızı ve haklarını nasıl kullanacağını açıklıyoruz."
      yururluk={GIZLILIK_META.yururluk}
      surum={GIZLILIK_META.surum}
      sorumlu="Vayra Technologies B.V. · Türkiye’de Vayra Teknoloji A.Ş."
      bolumler={GIZLILIK}
      gecmis={GIZLILIK_GECMIS}
      iletisim={{ ad: "Veri koruma", eposta: ILETISIM.gizlilik }}
    />
  );
}
