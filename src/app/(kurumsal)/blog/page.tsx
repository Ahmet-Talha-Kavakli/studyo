import type { Metadata } from "next";
import { Suspense } from "react";
import { Kap } from "@/components/sirket/ortak";
import { BlogListe } from "./BlogListe";

export const metadata: Metadata = {
  title: "Blog",
  description: "Vayra blog: ürün duyuruları, üretim rehberleri, şirket haberleri ve mühendislik yazıları.",
  alternates: { types: { "application/rss+xml": "/blog/rss.xml" } },
};

/** Blog — "dergi" düzeni (2026-10-28). */
export default function Blog() {
  return (
    <Kap className="pb-24 pt-14 sm:pt-20">
      <section className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[40px] font-semibold leading-[1.03] tracking-[-0.04em] text-white sm:text-[60px]">
          Ürün, zanaat ve<br /><span className="bg-gradient-to-r from-[#55d6fd] to-[#a8ecff] bg-clip-text text-transparent">perde arkası</span>
        </h1>
        <p className="max-w-sm text-[15px] leading-relaxed text-metin-2">Yeni özellikler, istem rehberleri, kreatör hikâyeleri ve Vayra&apos;yı nasıl kurduğumuz.</p>
      </section>
      <Suspense><BlogListe /></Suspense>
    </Kap>
  );
}
