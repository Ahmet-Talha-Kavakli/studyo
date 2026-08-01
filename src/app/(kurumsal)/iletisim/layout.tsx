import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim — Vayra",
  description: "Vayra ekibiyle iletişime geç. Satış, destek ve iş birliği talepleriniz için bize ulaşın; sinematik AI üretim yolculuğunuzda yanınızdayız.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
