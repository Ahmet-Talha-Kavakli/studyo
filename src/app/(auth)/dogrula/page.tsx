import type { Metadata } from "next";
import { AuthEkran } from "@/components/auth/AuthEkran";
import { DogrulaKarti } from "@/components/auth/HesapBaglantiKarti";

export const metadata: Metadata = { title: "E-posta doğrulama", robots: { index: false, follow: false }, referrer: "no-referrer" };

/** E-postadaki doğrulama ya da e-posta değişikliği bağlantısı: /dogrula?b=<belirteç>. */
export default function Sayfa() {
  return <AuthEkran niyet="giris" geri="/panel"><DogrulaKarti /></AuthEkran>;
}
