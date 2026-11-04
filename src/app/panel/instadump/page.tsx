"use client";

import { Suspense } from "react";
import { InstadumpStudyo } from "@/components/dump/InstadumpStudyo";

/** Instadump — paket seç, tek selfie ekle, paylaşıma hazır set al (3 adım). */
export default function InstadumpSayfa() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-var(--ust-nav))] bg-[#0b0b0c]" />}>
      <InstadumpStudyo />
    </Suspense>
  );
}
