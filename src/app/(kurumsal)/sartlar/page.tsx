import type { Metadata } from "next";
import { HukukiSayfa } from "@/components/kurumsal/HukukiSayfa";

export const metadata: Metadata = { title: "Kullanım Şartları — Vayra" };

export default function SartlarPage() {
  return (
    <HukukiSayfa
      baslik="Kullanım Şartları"
      guncelleme="1 Temmuz 2026"
      ozet="Vayra'yı kullanırken geçerli olan koşullar ve karşılıklı sorumluluklar."
      bolumler={[
        { baslik: "Hizmetin kabulü", icerik: "Vayra'yı kullanarak bu şartları kabul etmiş olursun. Şartları kabul etmiyorsan hizmeti kullanma." },
        { baslik: "Hesap sorumluluğu", icerik: "Hesabının güvenliğinden sen sorumlusun. Şüpheli bir durumda bizi bilgilendir." },
        { baslik: "Kabul edilebilir kullanım", icerik: "Yasa dışı, zararlı, telif ihlali içeren veya başkalarının haklarını çiğneyen içerik üretemezsin." },
        { baslik: "Krediler ve ödemeler", icerik: "Krediler seçtiğin plana göre tahsis edilir. Aboneliği istediğin an iptal edebilirsin." },
        { baslik: "İçerik ve fikri mülkiyet", icerik: "Ürettiğin içerik sana aittir; platform altyapısı ve markası Vayra'ya aittir." },
        { baslik: "Sorumluluk sınırı", icerik: "Hizmet 'olduğu gibi' sunulur. Kesintisiz veya hatasız olacağını garanti etmeyiz." },
      ]}
    />
  );
}
