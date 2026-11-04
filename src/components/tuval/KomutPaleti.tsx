"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { KrediJeton } from "@/components/ui/KrediHap";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { KATALOG, KATEGORILER, PORT_AD, PORT_RENK, dugumKredi, type DugumTur, type PortTip, saydam } from "@/lib/tuval/katalog";

/**
 * Düğüm ekleme paleti (Freepik Spotlight / Weavy Tab / Flora çift tık): ara, ↑↓ gez, Enter ekle, Esc kapat.
 * Bir çıktıdan sürükleyip boşluğa bırakınca açılır ve yalnız o tipi alabilen düğümleri gösterir.
 */
export function KomutPaleti({ x, y, filtreTip, onSec, onKapat }: { x: number; y: number; filtreTip?: PortTip; onSec: (tur: DugumTur) => void; onKapat: () => void }) {
  const [q, setQ] = useState("");
  const [s, setS] = useState(0);
  const giris = useRef<HTMLInputElement>(null);
  useEffect(() => { giris.current?.focus(); }, []);
  const liste = useMemo(() => {
    const k = q.trim().toLocaleLowerCase("tr");
    return (Object.values(KATALOG))
      .filter((t) => !filtreTip || t.girisler.some((g) => g.tip === filtreTip))
      .filter((t) => !k || `${t.ad} ${t.alt} ${t.anahtar ?? ""}`.toLocaleLowerCase("tr").includes(k));
  }, [q, filtreTip]);
  useEffect(() => setS(0), [q]);
  const gruplu = KATEGORILER.map((kat) => [kat, liste.filter((t) => t.kategori === kat)] as const).filter(([, l]) => l.length);
  const sirali = gruplu.flatMap(([, l]) => l);

  return (
    <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.12 }}
      onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}
      className="fixed z-[60] w-[380px] overflow-hidden rounded-[18px] bg-[var(--tv-kart)] ring-1 ring-white/[0.1]"
      style={{ left: Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 392), top: Math.min(y, (typeof window !== "undefined" ? window.innerHeight : 800) - 440) }} role="dialog" aria-label="Düğüm ekle">
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3.5 py-3">
        <Search className="h-4 w-4 text-[var(--sc-metin-3)]" />
        <input ref={giris} value={q} onChange={(e) => setQ(e.target.value)} placeholder={filtreTip ? `${PORT_AD[filtreTip]} alabilen düğüm ara…` : "Düğüm ara…"} aria-label="Düğüm ara"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setS((v) => Math.min(sirali.length - 1, v + 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setS((v) => Math.max(0, v - 1)); }
            else if (e.key === "Enter") { e.preventDefault(); const t = sirali[s]; if (t) onSec(t.tur); }
            else if (e.key === "Escape") { e.preventDefault(); onKapat(); }
          }}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--sc-metin)] outline-none placeholder:text-[var(--sc-metin-3)]" />
        {filtreTip && <span className="flex items-center gap-1 rounded-full bg-white/[0.075] px-2 py-0.5 text-[11px] text-[var(--sc-metin-2)]"><span className="h-2 w-2 rounded-full" style={{ background: PORT_RENK[filtreTip] }} />{PORT_AD[filtreTip]}</span>}
      </div>
      <div className="max-h-[340px] overflow-y-auto p-1.5 [scrollbar-width:thin]">
        {gruplu.map(([kat, l]) => (
          <div key={kat}>
            <p className="px-2.5 pb-1 pt-2 text-[11.5px] font-medium text-[var(--sc-metin-3)]">{kat}</p>
            {l.map((t) => {
              const i = sirali.indexOf(t); const I = t.ikon;
              const kr = dugumKredi({ tur: t.tur, model: t.model, ayar: { adet: 1 }, metin: "" });
              return (
                <button key={t.tur} onMouseEnter={() => setS(i)} onClick={() => onSec(t.tur)}
                  className={cn("flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left", s === i && "bg-white/[0.085]")}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]" style={{ background: saydam(t.cikti ? PORT_RENK[t.cikti] : "#8693a5", 14), color: t.cikti ? PORT_RENK[t.cikti] : "#a7b2c0" }}><I className="h-3.5 w-3.5" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[13.5px] text-[var(--sc-metin)]">{t.ad}</span><span className="block truncate text-[11.5px] text-[var(--sc-metin-3)]">{t.alt}</span></span>
                  {t.calisir && <span className="flex shrink-0 items-center gap-1 text-[11.5px] tabular-nums text-[var(--sc-metin-3)]">{kr ? <><KrediJeton boyut={14} />{kr}</> : "Ücretsiz"}</span>}
                </button>
              );
            })}
          </div>
        ))}
        {!sirali.length && <p className="px-3 py-6 text-center text-[13px] text-[var(--sc-metin-3)]">Eşleşen düğüm yok</p>}
      </div>
      <div className="flex gap-3 border-t border-white/[0.06] px-3.5 py-2 text-[11.5px] text-[var(--sc-metin-3)]"><span>↑↓ gez</span><span>Enter ekle</span><span>Esc kapat</span></div>
    </motion.div>
  );
}
