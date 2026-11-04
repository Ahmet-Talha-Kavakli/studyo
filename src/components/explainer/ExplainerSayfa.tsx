"use client";

import { useEffect, useState } from "react";
import { useExplainer } from "@/store/useExplainer";
import { ExGiris } from "./ExGiris";

/**
 * Explainer Stüdyosu — konu/metin/bağlantı → senaryo → MP4. Araya onay ya da düzenleyici sayfası girmez:
 * video tarayıcıda kurulur ve Üretilenler'de oynar (exVideo.ts).
 */
export function ExplainerSayfa() {
  // Kalıcı depo istemcide yüklenir; ilk karede sunucu çıktısıyla uyuşsun diye bekle.
  const [hazir, setHazir] = useState(false);
  useEffect(() => { setHazir(true); useExplainer.getState().sec(null); }, []);
  if (!hazir) return <div className="min-h-[calc(100dvh-var(--ust-nav))] bg-zemin" />;
  return <ExGiris />;
}
