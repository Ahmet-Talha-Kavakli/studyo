import type { Metadata, Viewport } from "next";
import { KurumsalNav } from "@/components/kurumsal/KurumsalNav";
import { KurumsalFooter } from "@/components/kurumsal/KurumsalFooter";

/* (kurumsal) route-group kabuğu — AÇIK/BEYAZ kurumsal alan.
   `.kurumsal-kapsam` token'ları beyaz temayı bu ağaca indirir (uygulamanın koyu
   dilinden KASITLI ayrışma). URL'ler parantezle DEĞİŞMEZ: /gizlilik yine /gizlilik. */

export const metadata: Metadata = {
  description: "Vayra kurumsal — hakkımızda, kariyer, basın, güvenlik, iletişim ve yasal belgeler.",
};

/* Kurumsal alan açık temalı → tarayıcı çubuğu da beyaz. */
export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
};

export default function KurumsalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="kurumsal-kapsam min-h-screen bg-white text-[color:var(--color-metin)] antialiased">
      <KurumsalNav />
      <main className="pt-16">{children}</main>
      <KurumsalFooter />
    </div>
  );
}
