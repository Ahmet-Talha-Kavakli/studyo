"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { para } from "@/lib/admin/cekirdek";
import { AD } from "@/components/admin/ui/temel";
import type { PLSatir } from "@/lib/admin/seed/finans";

/* Aylık P&L tablosu — kâr-zarar akışı. Gelir yeşil, gider kırmızı, sonuç vurgulu. */

export function PLTablo({ satirlar }: { satirlar: PLSatir[] }) {
  return (
    <div className="space-y-1">
      {satirlar.map((s, i) => {
        const sonuc = s.tur === "sonuc";
        const gider = s.tur === "gider";
        const renk = sonuc
          ? (s.tutar >= 0 ? "var(--ad-basari)" : "var(--ad-tehlike)")
          : gider ? "var(--ad-tehlike)" : "var(--ad-metin)";
        return (
          <motion.div key={s.etiket}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            className={cn("flex items-center justify-between rounded-lg px-3 py-2.5",
              sonuc ? "bg-white/[0.04] ring-1 ring-inset ring-white/[0.06]" : "")}>
            <div className="flex items-center gap-2">
              <span className={cn("text-sm", sonuc ? cn("font-bold", AD.metin) : gider ? AD.metin2 : AD.metin)}>{s.etiket}</span>
              {s.yuzde !== undefined && <span className={cn("text-[11px] tabular-nums", AD.metin3)}>%{s.yuzde}</span>}
            </div>
            <span className={cn("tabular-nums", sonuc ? "text-[15px] font-bold" : "text-sm font-semibold")} style={{ color: renk }}>
              {s.tutar < 0 ? "−" : ""}{para(Math.abs(s.tutar))}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
