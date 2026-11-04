"use client";

import { Suspense } from "react";
import { GorselDuzenle } from "@/components/duzenle/GorselDuzenle";

/** Görsel düzenle — gerçek bileşen `@/components/duzenle/GorselDuzenle`. `?kaynak=<url>&uretim=<id>` ile açılabilir. */
export default function InpaintSayfa() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-var(--ust-nav))] bg-zemin" />}>
      <GorselDuzenle />
    </Suspense>
  );
}
