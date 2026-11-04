"use client";

import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { useTercih } from "@/store/useTercih";
import { VURGU_RENKLERI } from "@/lib/vurgu";
import { OturumGozcusu } from "./OturumGozcusu";

/**
 * Görünüm tercihlerini (Ayarlar › Görünüm) tüm uygulamaya uygular:
 * vurgu rengi CSS değişkenleri, "hareketi azalt" sınıfı ve framer-motion ayarı.
 * İlk boyamadaki renk sıçramasını kökteki satır içi betik (TERCIH_BETIGI) önler.
 */
export function TercihSaglayici({ children }: { children: React.ReactNode }) {
  const vurgu = useTercih((s) => s.vurgu);
  const hareket = useTercih((s) => s.hareket);

  useEffect(() => {
    const r = VURGU_RENKLERI.find((v) => v.id === vurgu) ?? VURGU_RENKLERI[0];
    const k = document.documentElement;
    k.style.setProperty("--vurgu-renk", r.renk);
    k.style.setProperty("--vurgu-ust", r.ust);
  }, [vurgu]);

  useEffect(() => {
    document.documentElement.classList.toggle("hareket-azalt", hareket === "azalt");
  }, [hareket]);

  return (
    <MotionConfig reducedMotion={hareket === "azalt" ? "always" : hareket === "tam" ? "never" : "user"}>
      {children}
      <OturumGozcusu />
    </MotionConfig>
  );
}
