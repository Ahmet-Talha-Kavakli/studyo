"use client";

import { Suspense } from "react";
import { PanoOlustur } from "@/components/pano/PanoOlustur";

/** Yeni ruh panosu (?hazir=<id> ile hazır panodan başlar). */
export default function YeniPanoSayfa() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-var(--ust-nav))] bg-zemin" />}>
      <PanoOlustur />
    </Suspense>
  );
}
