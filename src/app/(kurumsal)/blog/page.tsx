import type { Metadata } from "next";
import { Hero } from "@/components/kurumsal/UI";
import { BlogListe } from "./BlogListe";

export const metadata: Metadata = {
  title: "Blog — Vayra",
  description: "Vayra blog: ürün duyuruları, yaratıcılık rehberleri, sorumlu AI ve mühendislik yazıları. Yaratıcı üretimin geleceğini birlikte keşfedelim.",
};

export default function Blog() {
  return (
    <>
      <Hero
        ustBaslik="Blog"
        baslik="Ürün, yaratıcılık ve teknoloji"
        aciklama="Yeni özellikler, üretim rehberleri ve perde arkası. Yaratıcı üretimin geleceğine dair yazıyoruz."
      />
      <BlogListe />
    </>
  );
}
