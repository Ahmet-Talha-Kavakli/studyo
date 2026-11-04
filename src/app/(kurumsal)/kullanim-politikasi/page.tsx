import type { Metadata } from "next";
import { YasalBelge } from "@/components/sirket/YasalBelge";
import { KULLANIM, KULLANIM_GECMIS, KULLANIM_META } from "@/lib/kurumsal/yasal/kullanim";
import { ILETISIM } from "@/lib/kurumsal/site";

export const metadata: Metadata = {
  title: "Kabul Edilebilir Kullanım Politikası",
  description: "Vayra’da yasak içerikler, gerçek kişiler ve sentetik medya, telif hakları, platformun kötüye kullanımı ve yaptırımlar.",
};

export default function Sayfa() {
  return (
    <YasalBelge
      baslik="Kabul Edilebilir Kullanım Politikası"
      aciklama="Herkesin güvenle üretebilmesi için Vayra’da neyin serbest, neyin yasak olduğu ve ihlallerde ne yaptığımız."
      yururluk={KULLANIM_META.yururluk}
      surum={KULLANIM_META.surum}
      sorumlu="Vayra Güven ve Güvenlik ekibi"
      bolumler={KULLANIM}
      gecmis={KULLANIM_GECMIS}
      iletisim={{ ad: "Güven ve Güvenlik", eposta: ILETISIM.guvenlik }}
    />
  );
}
