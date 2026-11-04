import { redirect } from "next/navigation";
import { AyarKok } from "./AyarKok";

/** Eski tek sayfalık ayarların sekme bağlantıları yeni bölümlere yönlenir. */
const ESKI: Record<string, string> = { profil: "hesap", hediye: "hediye", abonelik: "abonelik", kullanim: "kullanim", promo: "hediye" };

export default async function AyarlarPage({ searchParams }: { searchParams: Promise<{ sekme?: string }> }) {
  const { sekme } = await searchParams;
  if (sekme) redirect(`/panel/ayarlar/${ESKI[sekme] ?? "hesap"}`);
  return <AyarKok />;
}
