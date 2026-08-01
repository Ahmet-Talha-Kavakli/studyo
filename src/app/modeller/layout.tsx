import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modeller",
  description: "Vayra'nın desteklediği AI modelleri: Kling, Veo, Seedance, Ruh ve daha fazlası. Sinematik video, görsel ve ses üretimi için en güçlü modelleri tek yerde keşfet.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
