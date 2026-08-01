import type { Metadata } from "next";

/**
 * /gelistirici/ui — GELİŞTİRİCİYE ÖZEL UI kataloğu.
 * Aramaya kapalı (noindex, nofollow), nav'da link yok. Kullanıcıya görünmez.
 */
export const metadata: Metadata = {
  title: "UI Kataloğu — Geliştirici",
  robots: { index: false, follow: false },
};

export default function UiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
