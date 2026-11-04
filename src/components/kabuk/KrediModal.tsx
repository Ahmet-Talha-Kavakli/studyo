"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Coins, Infinity as InfinityIcon, Rocket, X, Zap } from "lucide-react";
import { useState } from "react";
import { useKrediModal, type KrediSekme } from "@/store/useKrediModal";
import { useScrollKilit } from "@/hooks/useScrollKilit";
import { DonemSecici, PlanKartlari } from "@/components/fiyat/Planlar";
import { HizSekmesi, KrediYukleSekmesi, SinirsizSekmesi } from "@/components/fiyat/PanelSekmeleri";
import type { Donem } from "@/lib/fiyat";
import { cn } from "@/lib/utils";

/**
 * KrediModal — üretim akışının ortasında (ör. kredi bitince) açılan hızlı satın
 * alma katmanı. İçerik /panel/kredi ile aynı bileşenler; rakamlar lib/fiyat.
 * useKrediModal().ac("kredi") ile ilgili sekmede açılır.
 */
const SEKMELER: { id: KrediSekme; ad: string; ikon: typeof Rocket }[] = [
  { id: "plan", ad: "Plan", ikon: Rocket },
  { id: "kredi", ad: "Kredi yükle", ikon: Coins },
  { id: "sinirsiz", ad: "Sınırsız", ikon: InfinityIcon },
  { id: "hiz", ad: "Hız", ikon: Zap },
];

export function KrediModal() {
  const { acik, sekme, kapat, ac } = useKrediModal();
  const [donem, setDonem] = useState<Donem>("yillik");
  useScrollKilit(acik);

  return (
    <AnimatePresence>
      {acik && (
        <div className="kesfet-tema fixed inset-0 z-[170] overflow-y-auto bg-transparent" role="dialog" aria-modal="true" aria-label="Kredi ve plan"
          onKeyDown={(e) => { if (e.key === "Escape") kapat(); }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kapat}
            className="perde fixed inset-0 bg-black/75 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto my-6 w-[calc(100%-2rem)] max-w-[1240px] rounded-[28px] border border-white/[0.08] bg-[#0d0d0f] p-5 sm:my-12 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div role="tablist" aria-label="Kredi seçenekleri" className="gizli-scroll flex gap-1 overflow-x-auto">
                {SEKMELER.map((s) => (
                  <button key={s.id} role="tab" aria-selected={sekme === s.id} onClick={() => ac(s.id)}
                    className={cn("relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors", sekme === s.id ? "text-zemin" : "text-metin-2 hover:text-white")}>
                    {sekme === s.id && <motion.span layoutId="krediModalHap" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                    <s.ikon className="relative h-3.5 w-3.5" /><span className="relative">{s.ad}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {sekme === "plan" && <DonemSecici donem={donem} setDonem={setDonem} kimlik="kredi-modal" />}
                <button onClick={kapat} aria-label="Kapat" autoFocus
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-metin-2 transition-colors hover:bg-white/[0.1] hover:text-white">
                  <X className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>

            <motion.div key={sekme} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mt-6">
              {sekme === "plan" && <PlanKartlari donem={donem} mod="panel" />}
              {sekme === "kredi" && <KrediYukleSekmesi onSekme={ac} />}
              {sekme === "sinirsiz" && <SinirsizSekmesi />}
              {sekme === "hiz" && <HizSekmesi />}
            </motion.div>

            <Link href={`/panel/kredi?sekme=${sekme}`} onClick={kapat}
              className="group mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-metin-2 transition-colors hover:text-white">
              Tam sayfada aç <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
