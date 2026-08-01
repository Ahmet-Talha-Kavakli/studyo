import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Geliştirici",
  description: "Vayra geliştirici kaynakları: API, MCP sunucusu ve CLI ile sinematik AI üretimini kendi uygulamalarına entegre et. Dokümantasyon, anahtarlar ve örneklerle başla.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
