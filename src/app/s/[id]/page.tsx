import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { scPaylasimOku } from "@/lib/scPaylasim";
import { PaylasilanSohbet } from "@/components/sc/PaylasilanSohbet";

type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const k = await scPaylasimOku((await params).id);
  if (!k) return { title: "Bulunamadı" };
  const ilk = k.mesajlar.find((m) => m.rol === "kullanici")?.metin.slice(0, 150);
  return { title: `${k.baslik} · Usta`, description: ilk, robots: { index: false }, openGraph: { title: k.baslik, description: ilk, type: "article" } };
}

/** Paylaşılan Usta sohbeti — salt okunur kopya. */
export default async function PaylasilanSohbetSayfasi({ params }: Props) {
  const k = await scPaylasimOku((await params).id);
  if (!k) notFound();
  return <PaylasilanSohbet k={k} />;
}
