"use client";

/* Route sarmalayıcısı — gerçek bileşen `@/components/fans/FansStudyo`. */
import { useEffect, useState } from "react";
import { FansStudyo } from "@/components/fans/FansStudyo";

export default function FansSayfa() {
  // Elementler ve üretimler istemcide yüklenir; ilk karede sunucu çıktısıyla uyuşsun diye bekle.
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  if (!hazir) return <div className="min-h-[calc(100dvh-var(--ust-nav))] bg-zemin" />;
  return <FansStudyo />;
}
