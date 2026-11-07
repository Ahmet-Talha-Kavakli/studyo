"use client";

import { Suspense, use } from "react";
import { KlasorSayfasi } from "@/components/build/sohbet/Klasorler";

/** Tek sohbet klasörü: yeni sohbet, klasördeki sohbetler, talimat, bilgi dosyaları. */
export default function KlasorSayfa({ params }: { params: Promise<{ kid: string }> }) {
  const { kid } = use(params);
  return <Suspense><KlasorSayfasi key={kid} id={kid} /></Suspense>;
}
