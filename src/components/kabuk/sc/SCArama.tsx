"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   SC ARAMA KUTUSU — tek kaynak.
   Referans: /panel/supercomputer/uygulamalar sağ üstteki arama.
   Tüm Supercomputer sayfaları BUNU kullanır; böylece hepsi birebir aynı.

   Anatomi: yuvarlak hap · 240px · sol büyüteç (16px, %40 beyaz) · 14px metin
   ============================================================ */
export function SCArama({
  deger, onDegis, placeholder = "Ara", genislik = 240, className,
}: {
  deger: string;
  onDegis: (v: string) => void;
  placeholder?: string;
  /** Genişlik: sayı → px (oyunlar 330), string → doğrudan CSS ("100%"). */
  genislik?: number | string;
  className?: string;
}) {
  return (
    <label
      style={{ width: genislik }}
      className={cn("sc-hap flex max-w-full items-center gap-2 rounded-full px-3.5 py-2", className)}
    >
      <Search className="h-4 w-4 shrink-0 text-[var(--sc-metin-3)]" />
      <input
        value={deger}
        onChange={(e) => onDegis(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[14px] text-[var(--sc-metin)] outline-none placeholder:text-[var(--sc-metin-3)]"
      />
    </label>
  );
}
