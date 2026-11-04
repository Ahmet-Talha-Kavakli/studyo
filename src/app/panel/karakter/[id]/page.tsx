"use client";

import { Suspense, use } from "react";
import { KarakterUret } from "@/components/karakter/KarakterUret";

/** Bir karakterle üretim: referanslı sahne üretimi ve sonuçlar. */
export default function KarakterSayfa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-var(--ust-nav))] bg-zemin" />}>
      <KarakterUret id={id} />
    </Suspense>
  );
}
