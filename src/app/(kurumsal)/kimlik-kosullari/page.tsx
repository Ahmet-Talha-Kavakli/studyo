import type { Metadata } from "next";
import { YasalBelge } from "@/components/sirket/YasalBelge";
import { KIMLIK, KIMLIK_GECMIS, KIMLIK_META } from "@/lib/kurumsal/yasal/kimlik";
import { ILETISIM } from "@/lib/kurumsal/site";

export const metadata: Metadata = {
  title: "Kimlik ve Benzerlik Kullanım Koşulları",
  description: "Vayra’da bir kişinin fotoğrafıyla karakter oluştururken verdiğin beyanlar, rıza, yasak kullanımlar, fotoğrafların işlenmesi, saklama ve itiraz.",
};

export default function Sayfa() {
  return (
    <YasalBelge
      baslik="Kimlik ve Benzerlik Kullanım Koşulları"
      aciklama="Bir yüzü karakter olarak yüklediğinde neyi beyan ettiğin, kişinin rızasının nasıl alınacağı ve fotoğraflarla ne yaptığımız."
      yururluk={KIMLIK_META.yururluk}
      surum={KIMLIK_META.surum}
      sorumlu="Vayra Güven ve Güvenlik ekibi"
      bolumler={KIMLIK}
      gecmis={KIMLIK_GECMIS}
      iletisim={{ ad: "Güven ve Güvenlik", eposta: ILETISIM.guvenlik }}
    />
  );
}
