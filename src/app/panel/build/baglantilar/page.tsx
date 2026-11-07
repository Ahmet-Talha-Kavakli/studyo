"use client";

import { Suspense } from "react";
import { Baglantilar } from "@/components/build/baglantilar/Baglantilar";

/** Vayra Build bağlantıları: servis kataloğu, özel MCP sunucusu, araç izinleri. */
export default function BaglantilarSayfasi() {
  return <Suspense fallback={null}><Baglantilar /></Suspense>;
}
