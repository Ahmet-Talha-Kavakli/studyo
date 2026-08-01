"use client";

import { useState, useEffect, type ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, AlertTriangle } from "lucide-react";

/**
 * BetaUyari — beta aşamasındaki stüdyolar için ortak uyarı pop-up'ı.
 * Sayfaya ilk girişte bir kez çıkar (localStorage bayrağı), "Anladım" denince
 * bir daha gösterilmez. Sayfa içi küçük rozet için `BetaRozet`.
 *
 * Supercomputer'ın SCBetaUyari deseninin genelleştirilmiş hali; her beta
 * stüdyo kendi `anahtar`ını verir (Montaj, Supercomputer, …).
 */
export function BetaUyari({
  anahtar, baslik, ikon: Ikon, aciklama, notMetni,
}: {
  anahtar: string;
  baslik: string;
  ikon: ComponentType<{ className?: string }>;
  aciklama: React.ReactNode;
  notMetni?: string;
}) {
  const [acik, setAcik] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(anahtar)) {
      const t = setTimeout(() => setAcik(true), 600);
      return () => clearTimeout(t);
    }
  }, [anahtar]);

  const kapat = () => {
    setAcik(false);
    try { localStorage.setItem(anahtar, "1"); } catch { /* yoksay */ }
  };

  return (
    <AnimatePresence>
      {acik && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={kapat} className="absolute inset-0 bg-black/55 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="relative w-full max-w-[440px] overflow-hidden rounded-3xl border border-white/10 bg-[#141416] p-7 text-center shadow-2xl">
            <button onClick={kapat} aria-label="Kapat"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-metin-2 hover:bg-white/12 hover:text-white"><X className="h-4 w-4" /></button>

            <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-zemin">
              <Ikon className="h-8 w-8" />
            </span>
            <div className="mb-1.5 flex items-center justify-center gap-2">
              <h2 className="text-[22px] font-bold text-white">{baslik}</h2>
              <BetaRozet />
            </div>
            <div className="mb-5 text-[14.5px] leading-relaxed text-metin-2">{aciklama}</div>
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-amber-400/[0.07] p-3.5 text-left ring-1 ring-inset ring-amber-400/15">
              <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-amber-300" />
              <p className="text-[13px] leading-snug text-metin-2">
                {notMetni ?? "Beta sürecinde üretimler ücretsiz veya indirimli olabilir; özellikler zamanla değişebilir."}
              </p>
            </div>
            <button onClick={kapat}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-aksan py-3.5 text-[15px] font-bold text-zemin transition-transform hover:scale-[1.02]">
              <Sparkles className="h-4.5 w-4.5" /> Anladım, başlayalım
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Sayfa içi küçük BETA rozeti — başlık/nav öğesi yanına. */
export function BetaRozet({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md bg-amber-400/15 px-2 py-0.5 text-[11px] font-bold text-amber-300 ring-1 ring-inset ring-amber-400/30 ${className ?? ""}`}>
      BETA
    </span>
  );
}
