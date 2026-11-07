import type { Metadata } from "next";
import { AuthEkran } from "@/components/auth/AuthEkran";
import { SifirlaKarti } from "@/components/auth/HesapBaglantiKarti";

export const metadata: Metadata = { title: "Şifreni sıfırla", robots: { index: false, follow: false }, referrer: "no-referrer" };

/** E-postadaki sıfırlama bağlantısı: /sifirla?b=<belirteç>. */
export default function Sayfa() {
  return <AuthEkran niyet="giris" geri="/panel"><SifirlaKarti /></AuthEkran>;
}
