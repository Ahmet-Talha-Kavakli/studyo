"use client";

import { Suspense } from "react";
import { ModaFabrikasi } from "@/components/moda/ModaFabrikasi";

/** Moda fabrikası — gerçek bileşen `@/components/moda/ModaFabrikasi`. */
export default function ModaSayfa() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-var(--ust-nav))] bg-zemin" />}>
      <ModaFabrikasi />
    </Suspense>
  );
}
