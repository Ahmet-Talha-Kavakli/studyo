"use client";

/* Route sarmalayıcısı — gerçek bileşen `@/components/cizim/CizimStudyo`. */
import { useEffect, useState } from "react";
import { CizimStudyo } from "@/components/cizim/CizimStudyo";

export default function CizimSayfa() {
  // Kalıcı taslak istemcide yüklenir; ilk karede sunucu çıktısıyla uyuşsun diye bekle.
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  if (!hazir) return <div className="min-h-[calc(100dvh-var(--ust-nav))] bg-zemin" />;
  return <CizimStudyo />;
}
