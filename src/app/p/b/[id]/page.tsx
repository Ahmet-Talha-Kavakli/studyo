import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaylasilanProje } from "@/components/build/paylasim/PaylasilanProje";
import { gorunum, paylasimCoz } from "@/lib/build/paylasim";
import { yazarAdi } from "@/lib/build/paylasimOrtak";

type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await paylasimCoz((await params).id);
  if (!c) return { title: "Bağlantı çalışmıyor", robots: { index: false } };
  const v = gorunum(c);
  const aciklama = v.aciklama || `${yazarAdi(v.yazar)} Vayra Build ile yaptı. Canlı önizle, ${v.remix ? "remix et ve " : ""}kendine uyarla.`;
  return {
    title: { absolute: `${v.ad} · Vayra Build` }, description: aciklama, robots: { index: false },
    openGraph: { title: v.ad, description: aciklama, type: "website", ...(v.kapak ? { images: [v.kapak] } : {}) },
    twitter: { card: v.kapak ? "summary_large_image" : "summary", title: v.ad, description: aciklama },
  };
}

/**
 * Paylaşılan Vayra Build projesi (salt okunur). /p/<id> Vayra ses ve müzik paylaşımlarınındır; Build projeleri /p/b/<id>
 * (Build sohbetlerinin /s/b/<id> düzeniyle aynı). Sayfaya proje kimliği, sahip ve sırlar gitmez.
 */
export default async function PaylasilanProjeSayfasi({ params }: Props) {
  const c = await paylasimCoz((await params).id);
  if (!c) notFound();
  return <PaylasilanProje v={gorunum(c)} />;
}
