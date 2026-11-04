"use client";

import { Suspense } from "react";
import { Calisanlar } from "@/components/sc/sayfalar/Calisanlar";

/* Ayarlar › Çalışanlar — çalışanlar sayfasının aynısı (ayar kabuğu içinde). */
export default function CalisanlarAyar() {
  return <Suspense fallback={null}><Calisanlar gomulu /></Suspense>;
}
