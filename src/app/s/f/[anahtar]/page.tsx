import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormSayfasi } from "@/components/build/sistemler/FormSayfasi";
import { formBul, formTanimi, testMi } from "@/lib/build/sistemGenel";

type Props = { params: Promise<{ anahtar: string }>; searchParams: Promise<{ test?: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const h = await formBul((await params).anahtar);
  if (!h) return { title: "Form bulunamadı", robots: { index: false } };
  const t = formTanimi(h, false);
  return { title: t.baslik, description: t.aciklama.slice(0, 160) || undefined, robots: { index: false } };
}

/** Vayra Build sisteminin herkese açık form sayfası. */
export default async function FormSayfasiRota({ params, searchParams }: Props) {
  const { anahtar } = await params;
  const h = await formBul(anahtar);
  if (!h) notFound();
  const test = (await searchParams).test;
  const deneme = testMi(h, test);
  return <FormSayfasi anahtar={anahtar} t={formTanimi(h, deneme)} test={deneme ? test : undefined} />;
}
