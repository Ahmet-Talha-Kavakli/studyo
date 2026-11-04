"use client";

import { Suspense } from "react";
import { Calisanlar } from "@/components/sc/sayfalar/Calisanlar";

/* Usta çalışanları — bileşen: components/sc/sayfalar/Calisanlar. */
export default function CalisanlarSayfa() {
  return <Suspense fallback={null}><Calisanlar /></Suspense>;
}
