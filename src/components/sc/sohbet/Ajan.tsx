"use client";

import { useEffect } from "react";
import { KrediJeton } from "@/components/ui/KrediHap";
import { motion } from "framer-motion";
import { BellOff, Check, ShieldCheck, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

const YAY = { type: "spring", stiffness: 420, damping: 32 } as const;

/** Kredi harcayan işten önce sohbet içinde onay kartı (Enter onaylar, Esc reddeder). */
export function OnayKarti({ baslik, aciklama, kredi, satirlar, onOnay, onHepsi, onRed }: {
  baslik: string; aciklama: string; kredi: number; satirlar: [string, string][]; onOnay: () => void; onHepsi: () => void; onRed: () => void;
}) {
  useEffect(() => {
    const t = (e: KeyboardEvent) => {
      const hedef = e.target as HTMLElement | null;
      if (hedef && /TEXTAREA|INPUT/.test(hedef.tagName)) return;
      if (e.key === "Enter") { e.preventDefault(); onOnay(); } else if (e.key === "Escape") onRed();
    };
    window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t);
  }, [onOnay, onRed]);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={YAY} className="my-2 overflow-hidden rounded-[18px] bg-[#18181b] ring-1 ring-inset ring-[var(--sc-aksan)]/30">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--sc-aksan)]/15 text-[var(--sc-aksan)]"><ShieldCheck className="h-[18px] w-[18px]" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[15px] font-semibold text-[var(--sc-metin)]">{baslik}</p>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[12.5px] font-medium tabular-nums text-[var(--sc-metin)]"><KrediJeton boyut={14} />{kredi} kredi</span>
            </div>
            <p className="mt-0.5 text-[13.5px] leading-relaxed text-[var(--sc-metin-2)]">{aciklama}</p>
          </div>
        </div>
        <dl className="mt-3 divide-y divide-white/[0.06] rounded-[12px] bg-white/[0.03] px-3 text-[13px] ring-1 ring-inset ring-white/[0.06] sm:ml-12">
          {satirlar.map(([a, d]) => <div key={a} className="flex items-center justify-between gap-4 py-2"><dt className="shrink-0 text-[var(--sc-metin-2)]">{a}</dt><dd className="min-w-0 truncate text-right font-medium text-[var(--sc-metin)]">{d}</dd></div>)}
        </dl>
      </div>
      <div className="flex items-center gap-2 border-t border-white/[0.06] px-4 py-3 max-sm:flex-wrap">
        <motion.button whileTap={{ scale: 0.96 }} onClick={onOnay} className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-[var(--sc-aksan)] px-4 text-[13.5px] font-semibold text-[#06232a] hover:bg-[var(--sc-aksan-koyu)] max-sm:flex-1"><Check className="h-4 w-4" />Onayla<kbd className="ml-1 rounded bg-black/15 px-1.5 text-[11px] font-medium max-sm:hidden">Enter</kbd></motion.button>
        <button onClick={onRed} className="flex h-9 items-center justify-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-medium text-[var(--sc-metin-2)] ring-1 ring-inset ring-white/[0.12] hover:bg-white/[0.05] hover:text-[var(--sc-metin)] max-sm:flex-1 sm:order-3 sm:ml-auto sm:ring-0"><X className="h-4 w-4" />Vazgeç<kbd className="ml-1 rounded bg-white/[0.08] px-1.5 text-[11px] max-sm:hidden">Esc</kbd></button>
        <button onClick={onHepsi} className="flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.05] hover:text-[var(--sc-metin)] max-sm:w-full sm:order-2"><BellOff className="h-4 w-4" />Bundan sonra sorma</button>
      </div>
    </motion.div>
  );
}

const ORANLAR: [string, string][] = [["1:1", "Kare"], ["4:5", "Dikey gönderi"], ["9:16", "Hikâye"], ["16:9", "Yatay"], ["3:2", "Fotoğraf"]];
/** Ajanın görselden önce sorduğu oran sorusu: şekilli seçenek kartları + "Sen seç". */
export function OranKarti({ onSec }: { onSec: (oran: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={YAY} className="my-2 rounded-[18px] bg-[#18181b] p-4 ring-1 ring-inset ring-white/[0.1]">
      <p className="text-[15px] font-semibold text-[var(--sc-metin)]">Görsel hangi oranda olsun?</p>
      <p className="mt-0.5 text-[13.5px] text-[var(--sc-metin-2)]">Nerede kullanacağına göre seç; emin değilsen ben seçerim.</p>
      <div className="mt-3 grid grid-cols-6 gap-2 max-sm:grid-cols-3">
        {ORANLAR.map(([o, ad]) => {
          const [w, h] = o.split(":").map(Number);
          return (
            <motion.button key={o} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} onClick={() => onSec(o)}
              className="flex flex-col items-center gap-2 rounded-[14px] bg-white/[0.03] py-3 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.07] hover:ring-white/20">
              <span className="flex h-9 items-center"><span className="rounded-[4px] border-2 border-[var(--sc-metin-2)]" style={{ width: 30 * Math.min(1, w / h), height: 30 * Math.min(1, h / w) }} /></span>
              <span className="text-[12px] font-semibold text-[var(--sc-metin)]">{o}</span>
              <span className="-mt-1.5 text-[11px] text-[var(--sc-metin-3)]">{ad}</span>
            </motion.button>
          );
        })}
        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} onClick={() => onSec("")}
          className={cn("flex flex-col items-center justify-center gap-1.5 rounded-[14px] bg-[var(--sc-aksan)]/[0.08] py-3 ring-1 ring-inset ring-[var(--sc-aksan)]/30 hover:bg-[var(--sc-aksan)]/[0.14]")}>
          <Sparkles className="h-5 w-5 text-[var(--sc-aksan)]" /><span className="text-[12px] font-semibold text-[var(--sc-metin)]">Sen seç</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
