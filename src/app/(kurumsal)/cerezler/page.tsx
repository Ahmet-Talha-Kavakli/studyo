import type { Metadata } from "next";
import { YasalBelge } from "@/components/sirket/YasalBelge";
import { CEREZ, CEREZ_GECMIS, CEREZ_META } from "@/lib/kurumsal/yasal/cerez";
import { ILETISIM } from "@/lib/kurumsal/site";

export const metadata: Metadata = {
  title: "Çerez Politikası",
  description: "Vayra’nın kullandığı çerezler ve tarayıcı depolaması; kategoriler, amaçlar, süreler ve tercih yönetimi.",
};

export default function Sayfa() {
  return (
    <YasalBelge
      baslik="Çerez Politikası"
      aciklama="Vayra’nın tarayıcında sakladığı çerez ve benzeri verileri tek tek listeliyoruz. Zorunlu olmayanlar yalnız iznin olursa çalışır."
      yururluk={CEREZ_META.yururluk}
      surum={CEREZ_META.surum}
      sorumlu="Vayra Teknoloji A.Ş. · Vayra Technologies B.V."
      bolumler={CEREZ}
      gecmis={CEREZ_GECMIS}
      iletisim={{ ad: "KVKK", eposta: ILETISIM.kvkk }}
    />
  );
}
