"use client";

import { useParams } from "next/navigation";
import { AnalitikPanosu } from "@/components/api/AnalitikPanosu";
import { useHazir } from "@/components/api/veri";

export default function ModelAnalitik() {
  const { model } = useParams<{ model: string }>();
  const hazir = useHazir();
  if (!hazir) return <div className="h-[60vh]" />;
  return <AnalitikPanosu model={model} />;
}
