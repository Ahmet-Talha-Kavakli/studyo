"use client";

import { motion } from "framer-motion";
import { Clapperboard, ImageIcon, X } from "lucide-react";
import type { VElement } from "@/store/useElements";
import { ElementKapak } from "./elementMeta";

export type KullanHedef = "gorsel" | "video";
const ANAHTAR = "vayra-element-kullan";

/** Elementi bir stüdyonun istemine taşır (stüdyo açılınca tüketilir). */
export function elementiStudyodaKullan(e: VElement, hedef: KullanHedef) {
  try { sessionStorage.setItem(ANAHTAR, JSON.stringify({ ad: e.ad, hedef })); } catch { /* yok say */ }
}
/** Stüdyo açılışında çağrılır: bekleyen element varsa adını döner ve kaydı siler. */
export function bekleyenElement(hedef: KullanHedef): string | null {
  try {
    const ham = sessionStorage.getItem(ANAHTAR);
    if (!ham) return null;
    const v = ham.startsWith("{") ? (JSON.parse(ham) as { ad: string; hedef: KullanHedef }) : { ad: ham, hedef: "gorsel" as const };
    if (v.hedef !== hedef) return null;
    sessionStorage.removeItem(ANAHTAR);
    return v.ad;
  } catch { return null; }
}

export function KullanSecici({ e, onKapat, onSec }: { e: VElement; onKapat: () => void; onSec: (h: KullanHedef) => void }) {
  return (
    <div className="fixed inset-0 z-[270] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`@${e.ad} nerede kullanılsın`}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="perde absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onKapat} />
      <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
        className="hf-kart relative w-full max-w-md bg-yuzey p-5">
        <button onClick={onKapat} aria-label="Kapat" className="glass-ikon absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-metin-2"><X className="h-4 w-4" /></button>
        <div className="flex items-center gap-3">
          <ElementKapak e={e} className="h-14 w-11 shrink-0 rounded-lg" ikonBoyut={18} />
          <div><p className="text-[17px] font-bold text-metin">@{e.ad}</p><p className="text-[12.5px] text-metin-3">Nerede kullanmak istersin?</p></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {([["gorsel", ImageIcon, "Görsel stüdyosu", "Görsel üret"], ["video", Clapperboard, "Video stüdyosu", "Video üret"]] as const).map(([h, I, ad, alt]) => (
            <button key={h} onClick={() => onSec(h)} className="flex flex-col items-start gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-left transition-colors hover:border-aksan/50 hover:bg-aksan/[0.05]">
              <I className="h-5 w-5 text-aksan" />
              <span className="text-[14px] font-semibold text-metin">{ad}</span>
              <span className="text-[12px] text-metin-3">{alt} · istemine @{e.ad} eklenir</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
