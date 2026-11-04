import { notFound } from "next/navigation";
import { paylasimOku } from "@/lib/paylasim";
import { PaylasimOynatici } from "@/components/paylasim/PaylasimOynatici";

type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

/** Başka sitelere gömülen sade oynatıcı (iframe, 96 px). */
export default async function GomuluOynatici({ params }: Props) {
  const k = await paylasimOku((await params).id);
  if (!k) notFound();
  return <div className="bg-transparent p-0"><PaylasimOynatici k={k} gomulu /></div>;
}
