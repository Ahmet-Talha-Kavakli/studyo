import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AyarKabugu } from "@/components/ayarlar/AyarKabugu";

export const metadata: Metadata = { title: "Ayarlar" };

/** Hesap ayarları — panel üst menüsünün altında sol ray + içerik. */
export default function AyarlarLayout({ children }: { children: ReactNode }) {
  return <AyarKabugu>{children}</AyarKabugu>;
}
