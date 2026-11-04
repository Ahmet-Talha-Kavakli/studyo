import type { Metadata } from "next";
import { YasalBelge } from "@/components/sirket/YasalBelge";
import { SARTLAR, SARTLAR_GECMIS, SARTLAR_META } from "@/lib/kurumsal/yasal/sartlar";
import { ILETISIM } from "@/lib/kurumsal/site";

export const metadata: Metadata = {
  title: "Kullanım Şartları",
  description: "Vayra kullanım şartları: hesap, krediler ve ödeme, içerik sahipliği, kabul edilebilir kullanım, fesih ve uyuşmazlıklar.",
};

export default function Sayfa() {
  return (
    <YasalBelge
      baslik="Kullanım Şartları"
      aciklama="Vayra’yı kullanırken senin ve bizim haklarımızı, sorumluluklarımızı düzenleyen sözleşme. Her bölümün başında sade bir özet bulacaksın."
      yururluk={SARTLAR_META.yururluk}
      surum={SARTLAR_META.surum}
      sorumlu="Vayra Technologies B.V. · Türkiye’de Vayra Teknoloji A.Ş."
      bolumler={SARTLAR}
      gecmis={SARTLAR_GECMIS}
      iletisim={{ ad: "Hukuk", eposta: ILETISIM.hukuk }}
    />
  );
}
