import type { Metadata } from "next";
import { YasalBelge } from "@/components/sirket/YasalBelge";
import { MESAFELI, MESAFELI_GECMIS, MESAFELI_META } from "@/lib/kurumsal/yasal/mesafeli";
import { ILETISIM } from "@/lib/kurumsal/site";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu",
  description: "Vayra abonelik ve kredi satışlarına ilişkin mesafeli satış sözleşmesi ve ön bilgilendirme formu.",
};

export default function Sayfa() {
  return (
    <YasalBelge
      baslik="Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu"
      aciklama="6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca Türkiye’deki tüketicilerle kurulan satış sözleşmesi."
      yururluk={MESAFELI_META.yururluk}
      surum={MESAFELI_META.surum}
      sorumlu="Vayra Teknoloji A.Ş."
      bolumler={MESAFELI}
      gecmis={MESAFELI_GECMIS}
      iletisim={{ ad: "Destek", eposta: ILETISIM.destek }}
    />
  );
}
