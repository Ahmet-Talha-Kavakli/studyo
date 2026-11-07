"use client";

import { use } from "react";
import { SohbetEkrani } from "@/components/build/sohbet/SohbetEkrani";

/** Vayra Build sohbeti (Claude benzeri genel asistan). */
export default function SohbetSayfasi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SohbetEkrani key={id} id={id} />;
}
