"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { SablonGalerisi } from "@/components/build/ana/SablonGalerisi";
import { ApiHatasi, projeOlustur } from "@/lib/build/istemci";

/** Şablonlar: Vayra şablonları ve Topluluk; ara, kategori ve etikete göre süz, sırala, canlı önizle, kullan ya da remix et. */
export default function SablonlarSayfasi() {
  const router = useRouter();
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const kullan = async (id: string) => {
    if (gidiyor) return;
    setGidiyor(id);
    try { router.push(`/panel/build/${await projeOlustur({ sablon: id })}`); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Şablon açılamadı."); setGidiyor(null); }
  };
  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      {hata && <p className="mb-3 text-[13px] text-rose-300">{hata}</p>}
      <Suspense><SablonGalerisi kullan={kullan} gidiyor={gidiyor} /></Suspense>
    </div>
  );
}
