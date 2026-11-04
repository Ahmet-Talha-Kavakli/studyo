"use client";

import { Suspense } from "react";
import { PhotodumpStudyo } from "@/components/dump/PhotodumpStudyo";

/** Photodump — aynı yüz, farklı sahneler: karakter + konsept, tek tıkla set. */
export default function PhotodumpSayfa() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-var(--ust-nav))] bg-[#0b0b0c]" />}>
      <PhotodumpStudyo />
    </Suspense>
  );
}
