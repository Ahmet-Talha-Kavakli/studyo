import type { Metadata } from "next";
import { SayfaKabuk, SayfaHero } from "@/components/site/SayfaKabuk";
import { SSS_KATEGORILER } from "@/lib/kurumsal/sss";
import { SSSKoyu } from "./SSSKoyu";

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular — Vayra",
  description: "Vayra hakkında merak edilenler: genel bilgiler, fiyatlandırma ve krediler, üretim, güvenlik ve API. Cevabını aradığın sorunun.",
};

export default function SSSPage() {
  return (
    <SayfaKabuk>
      <SayfaHero
        ustBaslik="Yardım"
        baslik="Sıkça sorulan sorular"
        aciklama="Aradığın cevap büyük ihtimalle burada. Değilse, bize ulaşmaktan çekinme."
      />
      <SSSKoyu kategoriler={SSS_KATEGORILER} />
    </SayfaKabuk>
  );
}
