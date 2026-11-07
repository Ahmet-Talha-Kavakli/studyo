"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProjeYonetimi } from "@/components/build/ana/ProjeYonetimi";
import { studyoYenile, useStudyo } from "@/components/build/kabuk/useStudyo";

/** Bütün projeler: ara, türe göre süz, menüden aç/adlandır/kopyala/sil. */
export default function ProjelerSayfasi() {
  const router = useRouter();
  const projeler = useStudyo((s) => s.projeler);
  useEffect(() => { studyoYenile(); }, []);
  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      <ProjeYonetimi projeler={projeler} yenile={studyoYenile} yeni={() => router.push("/panel/build")} />
    </div>
  );
}
