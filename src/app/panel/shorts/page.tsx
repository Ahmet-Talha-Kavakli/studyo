"use client";

/* Route sarmalayıcısı — gerçek bileşen `@/components/shorts/ShortsStudyo`. */
import { useEffect, useState } from "react";
import { ShortsStudyo } from "@/components/shorts/ShortsStudyo";

export default function ShortsSayfa() {
  // Üretimler istemcide yüklenir; ilk karede sunucu çıktısıyla uyuşsun diye bekle.
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  if (!hazir) return <div className="min-h-[calc(100dvh-var(--ust-nav))] bg-zemin" />;
  return <ShortsStudyo />;
}
