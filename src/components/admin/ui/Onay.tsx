"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPRING } from "@/lib/admin/animasyon";
import { AD } from "./temel";

/* Kademeli onay: sağdan açılan panel.
   risk 0 normal (tek onay), risk 1 riskli (tek onay, uyarı rengi), risk 2 çok riskli (geri sayım ve yazılı doğrulama). */

export type RiskSeviye = 0 | 1 | 2;

export interface OnayIstek {
  baslik: string;
  aciklama: string;
  risk: RiskSeviye;
  onayMetin?: string; // çok riskli işlemde yazılması gereken doğrulama metni
  eylemEtiket?: string;
}

interface OnayContext {
  onayIste: (istek: OnayIstek) => Promise<boolean>;
}

const Ctx = createContext<OnayContext | null>(null);

export function useOnay() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useOnay OnaySaglayici içinde kullanılmalı");
  return c;
}

export function OnaySaglayici({ children }: { children: ReactNode }) {
  const [istek, setIstek] = useState<OnayIstek | null>(null);
  const [cozucu, setCozucu] = useState<((v: boolean) => void) | null>(null);
  const [gerisayim, setGerisayim] = useState(0);
  const [dogrulama, setDogrulama] = useState("");

  const onayIste = useCallback((y: OnayIstek) => {
    setIstek(y);
    setDogrulama("");
    setGerisayim(y.risk === 2 ? 4 : 0);
    return new Promise<boolean>((res) => setCozucu(() => res));
  }, []);

  useEffect(() => {
    if (gerisayim <= 0) return;
    const t = setTimeout(() => setGerisayim((g) => g - 1), 1000);
    return () => clearTimeout(t);
  }, [gerisayim]);

  const kapat = (sonuc: boolean) => {
    cozucu?.(sonuc);
    setIstek(null);
    setCozucu(null);
  };

  const risk = istek?.risk ?? 0;
  const metinTamam = !istek?.onayMetin || dogrulama.trim().toUpperCase() === istek.onayMetin.toUpperCase();
  const onaylanabilir = gerisayim <= 0 && metinTamam;
  const Ikon = risk === 2 ? ShieldAlert : risk === 1 ? AlertTriangle : ShieldCheck;
  const renk = risk === 2 ? "var(--ad-tehlike)" : risk === 1 ? "var(--ad-uyari)" : "var(--ad-aksan)";

  return (
    <Ctx.Provider value={{ onayIste }}>
      {children}
      <AnimatePresence>
        {istek && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => kapat(false)} className="perde fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={SPRING}
              role="dialog" aria-modal="true"
              className="fixed right-0 top-0 z-[101] flex h-full w-full max-w-md flex-col border-l border-[color:var(--ad-kenar-2)] bg-[color:var(--ad-yuzey-2)]">
              <div className="flex-1 overflow-y-auto p-6 ad-ince-scroll">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${renk} 14%, transparent)`, color: renk }}>
                    <Ikon className="h-5.5 w-5.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className={cn("text-[17px] font-bold", AD.metin)}>{istek.baslik}</h3>
                    {risk === 2 && <span className="mt-1 inline-block rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-300">Yüksek riskli, çift onay</span>}
                    {risk === 1 && <span className="mt-1 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300">Riskli işlem</span>}
                  </div>
                </div>
                <p className={cn("mt-4 text-sm leading-relaxed", AD.metin2)}>{istek.aciklama}</p>
                {istek.onayMetin && (
                  <div className="mt-5">
                    <label className={cn("mb-1.5 block text-xs font-semibold", AD.metin2)}>
                      Onaylamak için <span className="text-rose-300">{istek.onayMetin}</span> yaz
                    </label>
                    <input value={dogrulama} onChange={(e) => setDogrulama(e.target.value)} autoFocus
                      className="h-10 w-full rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 text-sm text-[color:var(--ad-metin)] outline-none focus:border-rose-400/50" />
                  </div>
                )}
              </div>
              <div className="flex gap-2.5 border-t border-[color:var(--ad-kenar)] p-4">
                <button onClick={() => kapat(false)} className="ad-btn-glass h-10 flex-1 rounded-xl text-sm font-semibold">Vazgeç</button>
                <button onClick={() => kapat(true)} disabled={!onaylanabilir}
                  className="h-10 flex-1 rounded-xl text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: renk, color: risk === 0 ? "#04222c" : "#fff" }}>
                  {gerisayim > 0 ? `Bekle (${gerisayim})` : (istek.eylemEtiket ?? "Onayla")}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}
