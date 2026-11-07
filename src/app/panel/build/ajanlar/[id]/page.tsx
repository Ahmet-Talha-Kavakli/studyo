"use client";

import { Suspense, use } from "react";
import { AjanDuzenleyici } from "@/components/build/ajanlar/AjanDuzenleyici";

/** Ajan düzenleyicisi: solda ayarlar, sağda canlı test sohbeti, sağdan açılan yayın paneli. */
export default function AjanSayfasi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <Suspense fallback={null}><AjanDuzenleyici key={id} id={id} /></Suspense>;
}
