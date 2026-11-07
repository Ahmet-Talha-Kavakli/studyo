import type { Metadata } from "next";
import { DavetKarsilama } from "@/components/earn/DavetKarsilama";
import { kesfetFont } from "@/components/kesfet/font";

type Props = { params: Promise<{ kod: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kod } = await params;
  return {
    title: `@${kod} seni Vayra'ya davet etti`,
    description: "Görsel, video, ses ve müzik üretiminde tek platform. Davetle katıl, ilk plan ödemende yüzde 15 indirim kazan.",
    robots: { index: false },
  };
}

/** Davet bağlantısı: kodu kaydeder, kayda yönlendirir. */
export default async function DavetSayfasi({ params }: Props) {
  const { kod } = await params;
  const temiz = decodeURIComponent(kod).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);
  return (
    <div className={`kesfet-tema ${kesfetFont.variable} min-h-screen`}>
      <DavetKarsilama kod={temiz} />
    </div>
  );
}
