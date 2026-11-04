import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { uygulamaOku } from "@/lib/tuvalUygulama";
import { UygulamaSayfa } from "@/components/tuval/UygulamaSayfa";

type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const k = await uygulamaOku((await params).id);
  return k ? { title: `${k.ad} · Vayra`, description: k.aciklama || "Vayra Canvas ile yapılmış uygulama", robots: { index: false }, ...(k.kapak ? { openGraph: { images: [k.kapak] } } : {}) } : { title: "Bulunamadı" };
}

/** Yayınlanmış Canvas uygulaması. */
export default async function CanvasUygulamasi({ params }: Props) {
  const k = await uygulamaOku((await params).id);
  if (!k) notFound();
  return <UygulamaSayfa k={k} />;
}
