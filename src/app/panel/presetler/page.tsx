"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PresetGaleri } from "@/components/presetler/PresetGaleri";

/** Viral presetler galerisi. Tek preset sayfası: /panel/presetler/<slug>. */
export default function PresetlerSayfa() {
  return <Suspense><Icerik /></Suspense>;
}

function Icerik() {
  const router = useRouter();
  const eski = useSearchParams().get("preset");
  // Eski paylaşım bağlantıları (?preset=slug) preset sayfasına yönlenir.
  useEffect(() => { if (eski) router.replace(`/panel/presetler/${eski}`); }, [eski, router]);
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  if (!hazir || eski) return <div className="min-h-[calc(100dvh-var(--ust-nav))] bg-zemin" />;
  return <PresetGaleri />;
}
