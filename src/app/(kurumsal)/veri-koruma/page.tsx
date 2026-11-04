import type { Metadata } from "next";
import { YasalBelge } from "@/components/sirket/YasalBelge";
import { KVKK, KVKK_GECMIS, KVKK_META } from "@/lib/kurumsal/yasal/kvkk";
import { ILETISIM } from "@/lib/kurumsal/site";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description: "6698 sayılı KVKK md. 10 kapsamında aydınlatma metni: veri sorumlusu, işleme amaçları, hukuki sebepler, aktarım ve md. 11 hakların.",
};

export default function Sayfa() {
  return (
    <YasalBelge
      baslik="KVKK Aydınlatma Metni"
      aciklama="6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, Türkiye’deki kullanıcılarımızın kişisel verilerinin işlenmesine ilişkin aydınlatma metni."
      yururluk={KVKK_META.yururluk}
      surum={KVKK_META.surum}
      sorumlu="Vayra Teknoloji A.Ş."
      bolumler={KVKK}
      gecmis={KVKK_GECMIS}
      iletisim={{ ad: "KVKK", eposta: ILETISIM.kvkk }}
    />
  );
}
