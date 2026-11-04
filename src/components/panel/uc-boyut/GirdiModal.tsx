"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

/**
 * Basit tek-alanlı girdi modalı — yeniden adlandır / etiket ekle gibi işlemler için.
 * onKaydet ile girilen değeri gerçek store'a yazan çağırana döner.
 */
export function GirdiModal({
  acik, baslik, etiket, varsayilan = "", kaydetAd = "Kaydet", onKaydet, onKapat,
}: {
  acik: boolean;
  baslik: string;
  etiket: string;
  varsayilan?: string;
  kaydetAd?: string;
  onKaydet: (deger: string) => void;
  onKapat: () => void;
}) {
  const [deger, setDeger] = useState(varsayilan);
  useEffect(() => { if (acik) setDeger(varsayilan); }, [acik, varsayilan]);

  const kaydet = () => {
    const v = deger.trim();
    if (!v) return;
    onKaydet(v);
    onKapat();
  };

  return (
    <AnimatePresence>
      {acik && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="perde fixed inset-0 z-[95] bg-black/60 backdrop-blur-sm" onClick={onKapat} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="menu-surface fixed left-1/2 top-1/2 z-[96] w-80 -translate-x-1/2 -translate-y-1/2 rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">{baslik}</h3>
              <button onClick={onKapat} className="text-metin-3 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <label className="mb-1.5 block text-xs text-metin-2">{etiket}</label>
            <input autoFocus value={deger} onChange={(e) => setDeger(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") kaydet(); if (e.key === "Escape") onKapat(); }}
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm outline-none focus:border-aksan/40" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onKapat} className="rounded-lg border border-white/12 px-3 py-1.5 text-sm text-metin-2 hover:bg-white/[0.05]">İptal</button>
              <button onClick={kaydet} disabled={!deger.trim()}
                className="rounded-lg bg-aksan px-3 py-1.5 text-sm font-semibold text-zemin transition-transform hover:scale-[1.03] disabled:opacity-40">{kaydetAd}</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
