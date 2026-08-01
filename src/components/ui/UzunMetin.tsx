"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * UzunMetin — uzun metinleri (prompt, açıklama) kısaltıp "Tümünü gör / Gizle"
 * ile genişleten profesyonel bileşen (Higgsfield "See all / Hide" birebir).
 * Eşik karakterden kısa metinler olduğu gibi gösterilir (buton çıkmaz).
 */
export function UzunMetin({
  metin,
  esik = 140,
  className,
}: {
  metin: string;
  esik?: number;
  className?: string;
}) {
  const [acik, setAcik] = useState(false);
  const uzun = metin.length > esik;
  const gosterilen = !uzun || acik ? metin : metin.slice(0, esik).trimEnd() + "…";

  return (
    <div>
      <p className={cn("text-[13px] leading-relaxed text-metin", className)}>{gosterilen}</p>
      {uzun && (
        <button
          onClick={() => setAcik((v) => !v)}
          className="mt-1 flex items-center gap-0.5 text-[12px] font-medium text-aksan transition-colors hover:text-aksan/80"
        >
          {acik ? "Gizle" : "Tümünü gör"}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", acik && "rotate-180")} />
        </button>
      )}
    </div>
  );
}
