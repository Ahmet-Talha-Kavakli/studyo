"use client";

import { Suspense } from "react";
import { GorselCercevele } from "@/components/cercevele/GorselCercevele";

/** Yeniden çerçevele — görseli her en-boy oranına taşır. `?kaynak=<url>&uretim=<id>` ile açılabilir. */
export default function ReframeSayfa() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-var(--ust-nav))] bg-zemin" />}>
      <GorselCercevele />
    </Suspense>
  );
}
