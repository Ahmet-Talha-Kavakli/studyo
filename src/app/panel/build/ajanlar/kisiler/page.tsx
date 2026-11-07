"use client";

import { Suspense } from "react";
import { Kisiler } from "@/components/build/ajanlar/Kisiler";

/** Kişiler: kanallar arası tek kimlik ve ortak hafıza. */
export default function KisilerSayfasi() {
  return <Suspense><Kisiler /></Suspense>;
}
