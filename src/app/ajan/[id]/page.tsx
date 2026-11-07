import type { Metadata } from "next";
import { yayindakiAjan } from "@/lib/build/ajanDepo";
import { GenelSohbet } from "@/components/build/ajanlar/GenelSohbet";

type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const y = await yayindakiAjan((await params).id);
  if (!y) return { title: "Ajan bulunamadı · Vayra", robots: { index: false } };
  const g = y.ayar.simge.startsWith("/") ? [y.ayar.simge] : [];
  return { title: `${y.ayar.ad} · Vayra ajanı`, description: y.ayar.aciklama || "Vayra Build ile yapılmış yapay zekâ ajanı", openGraph: { title: y.ayar.ad, description: y.ayar.aciklama, images: g } };
}

/** Yayındaki ajanın paylaşım sayfası. */
export default async function AjanPaylasimSayfasi({ params }: Props) {
  return <GenelSohbet id={(await params).id} />;
}
