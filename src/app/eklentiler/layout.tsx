import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eklentiler",
  description: "Vayra eklentileriyle Photoshop, Premiere ve Figma içinde sinematik AI üretimi yap. Yaratıcı araçlarından çıkmadan görsel, video ve tasarım varlıklarını üret.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
