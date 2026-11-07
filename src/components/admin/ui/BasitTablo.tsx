"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AD } from "./temel";

/* Satırları çağıranın yazdığı sade tablo + sunucu sayfalaması için gezgin. */

export function BasitTablo({ baslik, sag = [], children, enAz = 640, alt }: { baslik: string[]; sag?: number[]; children: ReactNode; enAz?: number; alt?: ReactNode }) {
  return (
    <div className="ad-glass overflow-hidden !p-0">
      <div className="overflow-x-auto ad-ince-scroll">
        <table className="w-full text-sm" style={{ minWidth: enAz }}>
          <thead>
            <tr className="border-b border-[color:var(--ad-kenar)]">
              {baslik.map((b, i) => <th key={`${b}${i}`} className={cn("whitespace-nowrap px-4 py-3 text-left text-[12px] font-semibold", AD.metin3, sag.includes(i) && "text-right")}>{b}</th>)}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {alt}
    </div>
  );
}

export const hucre = "px-4 py-2.5 text-[13px]";
export const satirSinif = "border-b border-[color:var(--ad-kenar)] last:border-0";

export function SayfaGezgini({ sayfa, sayfaSayisi, toplam, birim, git }: { sayfa: number; sayfaSayisi: number; toplam: number; birim: string; git: (s: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-[color:var(--ad-kenar)] px-4 py-3">
      <span className={cn("text-[13px]", AD.metin3)}>{toplam.toLocaleString("tr-TR")} {birim}</span>
      <div className="flex items-center gap-1">
        <button aria-label="Önceki sayfa" onClick={() => git(sayfa - 1)} disabled={sayfa <= 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)] hover:bg-white/[0.05] disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
        <span className={cn("px-2 text-[13px] tabular-nums", AD.metin2)}>Sayfa {sayfa}, toplam {sayfaSayisi}</span>
        <button aria-label="Sonraki sayfa" onClick={() => git(sayfa + 1)} disabled={sayfa >= sayfaSayisi} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)] hover:bg-white/[0.05] disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
