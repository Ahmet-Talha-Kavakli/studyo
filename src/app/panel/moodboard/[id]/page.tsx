"use client";

import { Suspense, use } from "react";
import { PanoOlustur } from "@/components/pano/PanoOlustur";

/** Ruh panosu düzenle ve önizle. */
export default function PanoSayfa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-var(--ust-nav))] bg-zemin" />}>
      <PanoOlustur id={id} />
    </Suspense>
  );
}
