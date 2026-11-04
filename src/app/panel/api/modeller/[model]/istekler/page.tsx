"use client";

import { useParams } from "next/navigation";
import { UretimTablosu } from "@/components/api/IstekGunlugu";
import { useHazir } from "@/components/api/veri";

export default function ModelIstekleri() {
  const { model } = useParams<{ model: string }>();
  const hazir = useHazir();
  if (!hazir) return <div className="h-[60vh]" />;
  return <UretimTablosu model={model} />;
}
