import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Uygulamalar",
  description: "Vayra AI araç uygulamaları: tek tıkla görsel, video, 3D ve ses üret. Sinematik yaratıcılığı hızlandıran hazır uygulamaları keşfet ve iş akışına kat.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
