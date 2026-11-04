"use client";

/* Route sarmalayıcısı — gerçek bileşen `@/components/speak/SpeakStudyo`. */
import { useEffect, useState } from "react";
import { SpeakStudyo } from "@/components/speak/SpeakStudyo";

export default function SpeakSayfa() {
  // Elementler ve üretimler istemcide yüklenir; ilk karede sunucu çıktısıyla uyuşsun diye bekle.
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  if (!hazir) return <div className="min-h-[calc(100dvh-var(--ust-nav))] bg-zemin" />;
  return <SpeakStudyo />;
}
