"use client";

import { useEffect, useState } from "react";
import { UgcStudyo } from "@/components/ugc/UgcStudyo";

export default function UgcSayfa() {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  if (!hazir) return <div className="h-[calc(100dvh-var(--ust-nav))] bg-zemin" />;
  return <UgcStudyo />;
}
