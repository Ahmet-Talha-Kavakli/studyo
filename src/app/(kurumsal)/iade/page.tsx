import type { Metadata } from "next";
import { YasalBelge } from "@/components/sirket/YasalBelge";
import { IADE, IADE_GECMIS, IADE_META } from "@/lib/kurumsal/yasal/iade";
import { ILETISIM } from "@/lib/kurumsal/site";

export const metadata: Metadata = {
  title: "İade ve İptal Politikası",
  description: "Abonelik iptali, 7 günlük iade, kredi paketi iadesi, cayma hakkı ve tüketici başvuru yolları.",
};

export default function Sayfa() {
  return (
    <YasalBelge
      baslik="İade ve İptal Politikası"
      aciklama="Aboneliğini nasıl iptal edeceğini, hangi durumlarda iade alacağını ve iadenin ne kadar sürede yapılacağını açıklıyoruz."
      yururluk={IADE_META.yururluk}
      surum={IADE_META.surum}
      sorumlu="Vayra Teknoloji A.Ş."
      bolumler={IADE}
      gecmis={IADE_GECMIS}
      iletisim={{ ad: "Destek", eposta: ILETISIM.destek }}
    />
  );
}
