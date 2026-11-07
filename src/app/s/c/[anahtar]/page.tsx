import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SohbetSayfasi } from "@/components/build/sistemler/SohbetSayfasi";
import { sohbetBul, sohbetTanimi, testMi } from "@/lib/build/sistemGenel";

type Props = { params: Promise<{ anahtar: string }>; searchParams: Promise<{ test?: string; gomulu?: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const h = await sohbetBul((await params).anahtar);
  if (!h) return { title: "Sohbet bulunamadı", robots: { index: false } };
  const t = sohbetTanimi(h, false);
  return { title: t.baslik, description: t.altBaslik || undefined, robots: { index: false } };
}

/** Vayra Build sisteminin herkese açık sohbet sayfası (gomulu=1 ile sitelere gömülen kutunun içi). */
export default async function SohbetSayfasiRota({ params, searchParams }: Props) {
  const { anahtar } = await params;
  const h = await sohbetBul(anahtar);
  if (!h) notFound();
  const q = await searchParams;
  const deneme = testMi(h, q.test);
  return <SohbetSayfasi anahtar={anahtar} t={sohbetTanimi(h, deneme)} test={deneme ? q.test : undefined} gomulu={q.gomulu === "1"} />;
}
