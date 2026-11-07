"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AD } from "@/components/admin/ui/temel";

/* Huni: daralan çubuklar; her adımda ilk adıma göre oran ve önceki adımdan kayıp. */

export function Funnel({ adimlar }: { adimlar: { asama: string; sayi: number }[] }) {
  const ilk = adimlar[0]?.sayi || 0;
  const max = ilk || 1;
  return (
    <div className="space-y-3">
      {adimlar.map((a, i) => {
        const onceki = i > 0 ? adimlar[i - 1].sayi : a.sayi;
        const kayip = i > 0 && onceki > 0 ? Math.round(((onceki - a.sayi) / onceki) * 100) : 0;
        const oran = ilk ? Math.round((a.sayi / ilk) * 100) : 0;
        return (
          <div key={a.asama}>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-x-3 text-[13px]">
              <span className={AD.metin2}>{a.asama}</span>
              <span className="flex items-center gap-2">
                <span className={cn("font-semibold tabular-nums", AD.metin)}>{a.sayi.toLocaleString("tr-TR")}</span>
                {i > 0 && ilk > 0 && <span className={cn("text-[11px] tabular-nums", AD.metin3)}>ilk adımın yüzde {oran}</span>}
                {kayip > 0 && <span className="text-[11px] tabular-nums text-rose-300">yüzde {kayip} kayıp</span>}
              </span>
            </div>
            <div className="h-7 overflow-hidden rounded-lg bg-white/[0.03]">
              <motion.div className="h-full rounded-lg bg-gradient-to-r from-[color:var(--ad-aksan)]/70 to-[color:var(--ad-aksan)]/30"
                initial={{ width: 0 }} animate={{ width: `${(a.sayi / max) * 100}%` }} transition={{ duration: 0.7, delay: i * 0.08, ease: "easeOut" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
