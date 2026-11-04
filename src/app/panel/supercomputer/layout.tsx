"use client";

import { useState, useEffect } from "react";
import { SCAramaModal } from "@/components/kabuk/sc/SCAramaModal";
import { GorevCalistirici } from "@/components/sc/GorevCalistirici";

/* ============================================================
   SUPERCOMPUTER LAYOUT — tüm SC alt sayfalarını kapsar.
   Tek işi: referanstaki ⌘K arama modalını her SC ekranında
   kullanılabilir kılmak (sohbetlerde ara).
   ============================================================ */
export default function SupercomputerLayout({ children }: { children: React.ReactNode }) {
  const [aramaAcik, setAramaAcik] = useState(false);

  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setAramaAcik((v) => !v);
      }
    };
    // Sidebar'daki "Ara" düğmesi de bu olayı yayınlayabilir.
    const ac = () => setAramaAcik(true);
    window.addEventListener("keydown", tus);
    window.addEventListener("sc-arama-ac", ac);
    return () => {
      window.removeEventListener("keydown", tus);
      window.removeEventListener("sc-arama-ac", ac);
    };
  }, []);

  return (
    <>
      {children}
      <SCAramaModal acik={aramaAcik} onKapat={() => setAramaAcik(false)} />
      <GorevCalistirici />
    </>
  );
}
