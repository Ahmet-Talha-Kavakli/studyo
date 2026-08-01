import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fiyatlandırma — Vayra",
  description: "Kredi tabanlı, şeffaf fiyatlandırma. Başlangıç, Artı, Ultra ve Kurumsal planlar. İstediğin an değiştir, istediğin an iptal et.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
