"use client";

import { Suspense, use } from "react";
import { PresetUygula } from "@/components/presetler/PresetUygula";

/** Tek preset sayfası — /panel/presetler/<slug>. `?ek=<slug>` ikinci efekti hazır seçer. */
export default function PresetSayfasi({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <Suspense fallback={<div className="min-h-[calc(100dvh-var(--ust-nav))] bg-zemin" />}><PresetUygula slug={decodeURIComponent(slug)} /></Suspense>;
}
