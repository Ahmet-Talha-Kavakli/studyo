"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VElement } from "@/store/useElements";
import { ElementKapak, TurRozeti } from "./element/elementMeta";

/** @ yazılırken önerilecek elementler: önce eşleşen ad başı, sonra son kullanılan. */
export function elementOnerileri(elementler: VElement[], filtre: string): VElement[] {
  const q = filtre.toLocaleLowerCase("tr");
  const puan = (e: VElement) => {
    const a = e.ad.toLocaleLowerCase("tr");
    return (a.startsWith(q) ? 0 : a.includes(q) ? 1 : 2) * 1e13 - (e.sonKullanim ?? e.olusturma);
  };
  return elementler
    .filter((e) => !q || e.ad.toLocaleLowerCase("tr").includes(q) || e.aciklama.toLocaleLowerCase("tr").includes(q))
    .sort((a, b) => puan(a) - puan(b))
    .slice(0, 8);
}

/**
 * @mention önerileri — istemde "@" yazınca açılır. Klavye: ↑/↓ gez, Enter/Tab seç, Esc kapat
 * (tuşlar girişte yakalanır; `aktif` vurgulanan satırdır).
 */
export function ElementSecici({ liste, filtre, aktif, onAktif, onSec, onYeni, yukariAc = false }: {
  liste: VElement[];
  filtre: string;
  aktif: number;
  onAktif: (i: number) => void;
  onSec: (ad: string) => void;
  onYeni: () => void;
  yukariAc?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yukariAc ? -8 : 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: yukariAc ? -8 : 8, scale: 0.98 }}
      transition={{ duration: 0.14 }} role="listbox" aria-label="Element önerileri"
      className={cn("menu-surface absolute left-0 right-0 z-[60] max-w-[360px] rounded-2xl p-1.5", yukariAc ? "bottom-full mb-2" : "top-full mt-2")}>
      <p className="flex items-center justify-between px-2 pb-1 pt-1 text-[10.5px] font-semibold uppercase tracking-wider text-metin-3">
        <span>Elementler{filtre ? ` · @${filtre}` : ""}</span><span className="font-normal normal-case tracking-normal">↑↓ · Enter</span>
      </p>
      <div className="max-h-[300px] space-y-0.5 overflow-y-auto [scrollbar-width:thin]">
        {liste.map((e, i) => (
          <button key={e.id} role="option" aria-selected={i === aktif} onMouseEnter={() => onAktif(i)} onMouseDown={(ev) => { ev.preventDefault(); onSec(e.ad); }}
            className={cn("flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors", i === aktif ? "bg-white/[0.08]" : "hover:bg-white/[0.05]")}>
            <ElementKapak e={e} className="h-11 w-9 shrink-0 rounded-lg" ikonBoyut={15} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5"><span className="truncate text-[13.5px] font-semibold text-metin">@{e.ad}</span><TurRozeti tur={e.tur} kucuk /></span>
              <span className="block truncate text-[11.5px] text-metin-3">{e.aciklama || `${e.gorseller.length} görsel`}</span>
            </span>
          </button>
        ))}
        {liste.length === 0 && <p className="px-2 py-4 text-center text-[12px] text-metin-3">{filtre ? `@${filtre} adında element yok.` : "Henüz elementin yok."}</p>}
      </div>
      <button onMouseDown={(ev) => { ev.preventDefault(); onYeni(); }}
        className="mt-1 flex w-full items-center gap-2 rounded-xl border border-dashed border-white/15 p-2 text-[13px] text-metin-2 transition-colors hover:border-aksan/40 hover:text-metin">
        <Plus className="h-4 w-4" /> {filtre ? `@${filtre} olarak yeni element` : "Yeni element oluştur"}
      </button>
    </motion.div>
  );
}
