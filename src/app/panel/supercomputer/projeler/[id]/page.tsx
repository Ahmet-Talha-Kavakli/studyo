"use client";

import { use } from "react";
import { ProjeDetay } from "@/components/sc/sayfalar/ProjeDetay";

/* Tek proje — bileşen: components/sc/sayfalar/ProjeDetay. */
export default function ProjeSayfa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ProjeDetay id={id} />;
}
