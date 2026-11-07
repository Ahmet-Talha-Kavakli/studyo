import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { PaylasilanSohbet, PaylasimKapisi } from "@/components/build/sohbet/PaylasilanSohbet";
import { cerezdenIstek, istekKimligi, istekSahipOzeti } from "@/lib/build/sohbetOrtak";
import { paylasimOku, paylasimRolu } from "@/lib/build/sohbetPaylasim";

type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await paylasimOku((await params).id);
  if (!p) return { title: "Bulunamadı" };
  // Kişiye özel paylaşımın başlığı ve içeriği önizleme kartlarına sızmaz.
  if (p.erisim === "davetli") return { title: "Kişiye özel sohbet · Vayra Build", robots: { index: false } };
  const ilk = p.mesajlar.find((m) => m.rol === "kullanici")?.metin?.slice(0, 150);
  return { title: `${p.baslik} · Vayra Build`, description: ilk, robots: { index: false }, openGraph: { title: p.baslik, description: ilk, type: "article" } };
}

/**
 * Paylaşılan Vayra Build sohbeti (salt okunur; davetliler rolüne göre yorum yazar). /s/[id] Usta paylaşımlarınındır.
 * Kişiye özel paylaşımda erişim çerezdeki oturumla denetlenir; doğrulanamazsa istemci API'ye sorar (sahip bu
 * tarayıcının Build anahtarıyla tanınır), erişim yoksa giriş önerilir.
 */
export default async function PaylasilanBuildSohbeti({ params }: Props) {
  const p = await paylasimOku((await params).id);
  if (!p) notFound();
  const istek = cerezdenIstek((await cookies()).toString());
  const rol = paylasimRolu(p, { sahipOz: istekSahipOzeti(istek), eposta: istekKimligi(istek)?.eposta });
  if (!rol) return <PaylasimKapisi pid={p.id} />;
  const { sahip: _s, sohbet: _c, davetliler, ...acik } = p; void _s; void _c;
  return <PaylasilanSohbet p={{ ...acik, davetliSayisi: davetliler?.length ?? 0 } as never} rol={rol} />;
}
