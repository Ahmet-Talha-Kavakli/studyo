import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { paylasimOku } from "@/lib/paylasim";
import { PaylasimOynatici } from "@/components/paylasim/PaylasimOynatici";

type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const k = await paylasimOku((await params).id);
  if (!k) return { title: "Bulunamadı" };
  const aciklama = k.alt ?? (k.tur === "muzik" ? "Vayra ile üretilmiş müzik" : "Vayra ile üretilmiş ses");
  return {
    title: k.baslik, description: aciklama, robots: { index: false },
    openGraph: { title: k.baslik, description: aciklama, type: "music.song", audio: [{ url: k.url }], ...(k.kapak ? { images: [k.kapak] } : {}) },
    twitter: { card: "player", title: k.baslik, description: aciklama, players: [{ playerUrl: `/p/${k.id}/embed`, streamUrl: k.url, width: 480, height: 96 }] },
  };
}

/** Herkese açık paylaşım sayfası: oynatıcı, metin (kelime vurgulu), bağlantı ve gömme kodu. */
export default async function PaylasimSayfasi({ params }: Props) {
  const k = await paylasimOku((await params).id);
  if (!k) notFound();
  return <PaylasimOynatici k={k} />;
}
