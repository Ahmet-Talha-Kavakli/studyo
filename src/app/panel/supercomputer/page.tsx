"use client";

import { Suspense } from "react";
import { AnaEkran } from "@/components/sc/sohbet/AnaEkran";

/* Usta boş ekranı — bileşen: components/sc/sohbet/AnaEkran. */
export default function SupercomputerAna() {
  return <Suspense fallback={null}><AnaEkran /></Suspense>;
}
