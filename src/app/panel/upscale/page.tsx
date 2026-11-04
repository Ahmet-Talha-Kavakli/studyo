"use client";

/* Route sarmalayıcısı — gerçek bileşen `@/components/studyo/UpscaleStudyo`.
   `?kaynak=<url>&uretim=<id>` ile başka sayfalardan kaynakla açılabilir. */
import { Suspense } from "react";
import { UpscaleStudyo } from "@/components/studyo/UpscaleStudyo";

export default function UpscaleSayfa() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-var(--ust-nav))] bg-zemin" />}>
      <UpscaleStudyo />
    </Suspense>
  );
}
