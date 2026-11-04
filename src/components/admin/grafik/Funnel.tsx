"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { kisaSayi } from "@/lib/admin/cekirdek";
import { AD } from "@/components/admin/ui/temel";

/* Edinim funnel'ı — daralan çubuklar + adım-adım dönüşüm oranı ve düşüş. */

export function Funnel({ adimlar }: { adimlar: { asama: string; sayi: number; oran: number }[] }) {
  const max = adimlar[0]?.sayi || 1;
  return (
    <div className="space-y-2">
      {adimlar.map((a, i) => {
        const oncekiSayi = i > 0 ? adimlar[i - 1].sayi : a.sayi;
        const dususOran = i > 0 ? ((oncekiSayi - a.sayi) / oncekiSayi) * 100 : 0;
        return (
          <div key={a.asama}>
            <div className="mb-1 flex items-center justify-between text-[13px]">
              <span className={AD.metin2}>{a.asama}</span>
              <span className="flex items-center gap-2">
                <span className={cn("tabular-nums", AD.metin)}>{kisaSayi(a.sayi)}</span>
                <span className={cn("tabular-nums text-[11px]", AD.metin3)}>%{a.oran.toFixed(1)}</span>
                {dususOran > 0 && <span className="tabular-nums text-[11px] text-rose-400">%{dususOran.toFixed(0)} düşüş</span>}
              </span>
            </div>
            <div className="h-7 overflow-hidden rounded-lg bg-white/[0.03]">
              <motion.div className="flex h-full items-center rounded-lg bg-gradient-to-r from-[color:var(--ad-aksan)]/70 to-[color:var(--ad-aksan)]/30"
                initial={{ width: 0 }} animate={{ width: `${(a.sayi / max) * 100}%` }} transition={{ duration: 0.7, delay: i * 0.08, ease: "easeOut" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
