import type { Metadata } from "next";
import { AuthEkran } from "@/components/auth/AuthEkran";
import { DavetKarti } from "@/components/alan/DavetKarti";

export const metadata: Metadata = { title: "Çalışma alanı daveti", robots: { index: false, follow: false }, referrer: "no-referrer" };

/** Çalışma alanı daveti: /davet?b=<belirteç>. Tek kullanımlık, 7 gün geçerli, davet edilen e-postaya bağlı. */
export default function Sayfa() {
  return <AuthEkran niyet="giris" geri="/davet"><DavetKarti /></AuthEkran>;
}
