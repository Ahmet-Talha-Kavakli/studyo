"use client";

import { type ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPRING } from "@/lib/admin/animasyon";
import { AD } from "./temel";

/* Tablo (sayfalamalı, 10k satır dostu) + Çekmece (sağdan spring). */

export interface Kolon<T> {
  anahtar: string;
  baslik: string;
  render: (satir: T) => ReactNode;
  hizala?: "sol" | "sag" | "orta";
  genislik?: string;
  gizleMobil?: boolean;
}

export function Tablo<T extends { id: string }>({
  kolonlar, satirlar, satirTikla, sayfaBoyut = 25, bosMetin = "Kayıt yok",
}: {
  kolonlar: Kolon<T>[];
  satirlar: T[];
  satirTikla?: (satir: T) => void;
  sayfaBoyut?: number;
  bosMetin?: string;
}) {
  const [sayfa, setSayfa] = useState(0);
  const toplamSayfa = Math.ceil(satirlar.length / sayfaBoyut);
  const dilim = satirlar.slice(sayfa * sayfaBoyut, (sayfa + 1) * sayfaBoyut);
  const hiza = (h?: string) => (h === "sag" ? "text-right" : h === "orta" ? "text-center" : "text-left");

  return (
    <div className="ad-glass overflow-hidden !p-0">
      <div className="overflow-x-auto ad-ince-scroll">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[color:var(--ad-kenar)]">
              {kolonlar.map((k) => (
                <th key={k.anahtar} style={{ width: k.genislik }}
                  className={cn("px-4 py-3 text-[11px] font-semibold uppercase tracking-wider", AD.metin3, hiza(k.hizala), k.gizleMobil && "hidden md:table-cell")}>
                  {k.baslik}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dilim.length === 0 ? (
              <tr><td colSpan={kolonlar.length} className={cn("px-4 py-12 text-center", AD.metin3)}>{bosMetin}</td></tr>
            ) : dilim.map((satir, i) => (
              <motion.tr key={satir.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.012 }}
                onClick={() => satirTikla?.(satir)}
                className={cn("border-b border-[color:var(--ad-kenar)] last:border-0 transition-colors", satirTikla && "cursor-pointer hover:bg-white/[0.03]")}>
                {kolonlar.map((k) => (
                  <td key={k.anahtar} className={cn("px-4 py-3", AD.metin, hiza(k.hizala), k.gizleMobil && "hidden md:table-cell")}>
                    {k.render(satir)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {toplamSayfa > 1 && (
        <div className="flex items-center justify-between border-t border-[color:var(--ad-kenar)] px-4 py-3">
          <span className={cn("text-[13px]", AD.metin3)}>
            {sayfa * sayfaBoyut + 1}–{Math.min((sayfa + 1) * sayfaBoyut, satirlar.length)} / {satirlar.length.toLocaleString("tr-TR")}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setSayfa((s) => Math.max(0, s - 1))} disabled={sayfa === 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)] transition-colors hover:bg-white/[0.05] disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className={cn("px-2 text-[13px] tabular-nums", AD.metin2)}>{sayfa + 1} / {toplamSayfa}</span>
            <button onClick={() => setSayfa((s) => Math.min(toplamSayfa - 1, s + 1))} disabled={sayfa >= toplamSayfa - 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)] transition-colors hover:bg-white/[0.05] disabled:opacity-30">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Sağdan açılan çekmece (detay paneli). */
export function Cekmece({ acik, kapat, baslik, genislik = "max-w-lg", children }: {
  acik: boolean; kapat: () => void; baslik?: ReactNode; genislik?: string; children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {acik && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={kapat} className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={SPRING}
            className={cn("fixed right-0 top-0 z-[81] h-full w-full overflow-y-auto ad-ince-scroll border-l border-[color:var(--ad-kenar)] bg-[color:var(--ad-yuzey)]", genislik)}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[color:var(--ad-kenar)] bg-[color:var(--ad-yuzey)]/90 px-5 py-4 backdrop-blur-xl">
              <div className={cn("font-bold", AD.metin)}>{baslik}</div>
              <button onClick={kapat} className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--ad-metin-3)] transition-colors hover:bg-white/[0.06] hover:text-[color:var(--ad-metin)]">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
