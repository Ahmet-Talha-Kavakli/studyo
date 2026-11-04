import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tuvalPaylasimOku } from "@/lib/tuvalPaylasim";
import { TuvalGoruntu } from "@/components/tuval/TuvalGoruntu";

type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const k = await tuvalPaylasimOku((await params).id);
  return k ? { title: `${k.ad} · Vayra Canvas`, description: `${k.dugumler.length} düğümlü akış`, robots: { index: false } } : { title: "Bulunamadı" };
}

/** Paylaşılan Canvas tuvali — salt okunur. */
export default async function PaylasilanTuval({ params }: Props) {
  const k = await tuvalPaylasimOku((await params).id);
  if (!k) notFound();
  return <TuvalGoruntu k={k} />;
}
