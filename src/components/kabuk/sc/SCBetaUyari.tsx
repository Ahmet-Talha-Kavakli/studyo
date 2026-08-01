"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, X, Sparkles, AlertTriangle } from "lucide-react";

/**
 * SCBetaUyari — Supercomputer BETA bildirimi.
 * Sayfaya ilk girişte bir kez merkezi pop-up (localStorage flag). Kullanıcı
 * "Anladım" der → bir daha çıkmaz. Sayfa içinde beta rozetleri için `SCBetaRozet`.
 */
const ANAHTAR = "vayra-sc-beta-goruldu";

export function SCBetaUyari() {
  const [acik, setAcik] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(ANAHTAR)) {
      const t = setTimeout(() => setAcik(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const kapat = () => {
    setAcik(false);
    try { localStorage.setItem(ANAHTAR, "1"); } catch { /* yoksay */ }
  };

  /* ESC ile kapanma — modal olduğu halde klavyeyle kapatılamıyordu. */
  useEffect(() => {
    if (!acik) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") kapat(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
    // kapat yalnızca setState + localStorage yapar, kimliği önemsiz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acik]);

  return (
    <AnimatePresence>
      {acik && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={kapat} className="absolute inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            role="dialog" aria-modal="true" aria-labelledby="sc-beta-baslik"
            className="sc-kapsam relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-[var(--sc-kenar)] bg-[var(--sc-kart)] p-7 text-center shadow-[0_28px_70px_-20px_rgba(0,0,0,0.6)]">
            <button onClick={kapat} aria-label="Kapat" className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--sc-cip)] text-[var(--sc-metin-3)] transition-colors hover:bg-[var(--sc-cip-2)] hover:text-[var(--sc-metin)]"><X className="h-4 w-4" /></button>

            <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--sc-aksan)] text-[var(--sc-aksan-metin)]">
              <Cpu className="h-8 w-8" />
            </span>
            <div className="mb-1.5 flex items-center justify-center gap-2">
              <h2 id="sc-beta-baslik" className="text-[21px] font-semibold text-[var(--sc-metin)]">Supercomputer</h2>
              <span className="rounded-md bg-[var(--sc-aksan-zayif)] px-2 py-0.5 text-[11px] font-bold text-[var(--sc-aksan)]">BETA</span>
            </div>
            <p className="mb-5 text-[14px] leading-relaxed text-[var(--sc-metin-2)]">
              Supercomputer şu an <span className="font-semibold text-[var(--sc-metin)]">beta aşamasında</span>.
              İstemden site, oyun ve uygulama üretimi hâlâ geliştiriliyor — bazı sonuçlar
              beklediğin gibi olmayabilir. Geri bildirimlerin bizim için çok değerli 🙏
            </p>
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[var(--sc-kenar)] bg-[var(--sc-zemin)] p-3.5 text-left">
              <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[var(--sc-aksan)]" />
              <p className="text-[13px] leading-snug text-[var(--sc-metin-3)]">
                Beta sürecinde üretimler ücretsiz veya indirimli olabilir; özellikler
                zamanla değişebilir.
              </p>
            </div>
            <button onClick={kapat}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--sc-aksan)] py-3.5 text-[14.5px] font-semibold text-[var(--sc-aksan-metin)] transition-colors hover:bg-[var(--sc-aksan-koyu)]">
              <Sparkles className="h-4.5 w-4.5" /> Anladım, başlayalım
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Sayfa içi küçük BETA rozeti — hero başlığı vb. yanına. */
export function SCBetaRozet({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md bg-[var(--sc-aksan-zayif)] px-2 py-0.5 text-[11px] font-bold text-[var(--sc-aksan)] ${className ?? ""}`}>
      BETA
    </span>
  );
}
