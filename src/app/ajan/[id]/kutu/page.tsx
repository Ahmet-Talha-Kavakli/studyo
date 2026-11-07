import type { Metadata } from "next";
import { GenelSohbet } from "@/components/build/ajanlar/GenelSohbet";

type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vayra ajanı", robots: { index: false } };

/** Web sitelerine gömülen sohbet kutusu (ajan-kutusu.js iframe olarak açar). */
export default async function AjanKutusu({ params }: Props) {
  return <GenelSohbet id={(await params).id} kutu />;
}
