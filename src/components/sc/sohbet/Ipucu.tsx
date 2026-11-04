"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Küçük ipucu balonu — simge düğmelerin üzerinde açılır (tarayıcının yavaş title'ı yerine).
 * İlk ipucu kısa bir gecikmeyle gelir; bir ipucu açıkken komşu düğmeye geçilince yenisi ANINDA
 * açılır (Claude gibi "ısınmış" davranış) — böylece satır boyunca gezinirken titreme/takılma olmaz.
 * Kısayol varsa sağında tuş rozetleri gösterir. Dokunmatikte gösterilmez.
 */
let sonAcik = 0; // en son bir ipucunun açık olduğu an (modül genelinde paylaşılır)
const GECIKME = 380, ISINMA = 450;

export function Ipucu({ metin, tus, yon = "ust", hiza = "orta", kapali, children, className }: {
  metin: string; tus?: string; yon?: "ust" | "alt"; hiza?: "orta" | "sol" | "sag"; kapali?: boolean; children: React.ReactNode; className?: string;
}) {
  const [acik, setAcik] = useState(false);
  const zaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  const temizle = () => { if (zaman.current) { clearTimeout(zaman.current); zaman.current = null; } };
  useEffect(() => temizle, []);
  useEffect(() => { if (kapali) { temizle(); setAcik(false); } }, [kapali]);

  const gir = (e: React.PointerEvent) => {
    if (kapali || e.pointerType === "touch") return;
    temizle();
    if (Date.now() - sonAcik < ISINMA) setAcik(true);
    else zaman.current = setTimeout(() => setAcik(true), GECIKME);
  };
  const cik = () => { temizle(); if (acik) sonAcik = Date.now(); setAcik(false); };

  return (
    <span className={cn("relative inline-flex", className)} onPointerEnter={gir} onPointerLeave={cik} onPointerDown={cik}
      onFocus={(e) => { if (!kapali && (e.target as HTMLElement).matches(":focus-visible")) setAcik(true); }} onBlur={cik}>
      {children}
      {acik && !kapali && (
        <span role="tooltip"
          className={cn("sc-ipucu pointer-events-none absolute z-[80] flex items-center gap-1.5 whitespace-nowrap rounded-[8px] bg-[#05070a] px-2 py-1 text-[12px] font-medium text-[#f2f2f3] ring-1 ring-white/[0.08]",
            yon === "ust" ? "bottom-full mb-2" : "top-full mt-2",
            hiza === "orta" ? "left-1/2 -translate-x-1/2" : hiza === "sol" ? "left-0" : "right-0")}>
          {metin}
          {tus && tus.split(" ").map((t) => <kbd key={t} className="rounded-[4px] bg-white/[0.1] px-1 text-[10.5px] font-medium text-[#b4b4ba]">{t}</kbd>)}
        </span>
      )}
    </span>
  );
}
