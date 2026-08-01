import { notFound } from "next/navigation";
import { URUNLER, URUN_SLUGLARI } from "@/lib/urunler";
import { UrunIcerik } from "./UrunIcerik";

export function generateStaticParams() {
  return URUN_SLUGLARI.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const urun = URUNLER[slug];
  if (!urun) return { title: "Ürün bulunamadı — Vayra" };
  return { title: `${urun.ustBaslik} — Vayra`, description: urun.aciklama };
}

export default async function UrunPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const urun = URUNLER[slug];
  if (!urun) notFound();
  return <UrunIcerik urun={urun} />;
}
