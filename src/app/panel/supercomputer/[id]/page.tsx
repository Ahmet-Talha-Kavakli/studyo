"use client";

import { use } from "react";
import { SohbetEkrani } from "@/components/sc/sohbet/SohbetEkrani";

/* Usta sohbeti — bileşen: components/sc/sohbet/SohbetEkrani. */
export default function SupercomputerSohbet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SohbetEkrani id={id} />;
}
