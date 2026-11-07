"use client";

import { Suspense } from "react";
import { CalismaGezgini } from "@/components/build/sistemler/CalismaGezgini";

/** Sistem çalışmaları: tüm sistemler, süzgeç ve arama. */
export default function CalismalarSayfasi() {
  return <Suspense><CalismaGezgini /></Suspense>;
}
