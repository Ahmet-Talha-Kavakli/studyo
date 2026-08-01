"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPRING } from "@/lib/admin/animasyon";
import { AD } from "./temel";

/* Kademeli onay sistemi — kurumsal admin güvenliği.
   risk 0 = normal (tek onay)
   risk 1 = riskli (tek onay, kırmızı vurgu)
   risk 2 = ekstra-riskli (ÇİFT onay: geri sayımlı 2. onay + metin doğrulama)
   Hem manuel butonlar hem AI write-tool'ları bunu kullanır. */

export type RiskSeviye = 0 | 1 | 2;

export interface OnayIstek {
  baslik: string;
  aciklama: string;
  risk: RiskSeviye;
  onayMetin?: string; // ekstra-riskli için yazılması gereken doğrulama (ör. "BANLA")
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => kapat(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={SPRING}
              className="ad-panel relative w-full max-w-md p-6">
              <div className="flex items-start gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${renk}20`, color: renk }}>
                  <Ikon className="h-5.5 w-5.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className={cn("text-[17px] font-bold", AD.metin)}>{istek.baslik}</h3>
                  {risk === 2 && <span className="mt-0.5 inline-block rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-300">Yüksek riskli · çift onay</span>}
                  {risk === 1 && <span className="mt-0.5 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">Riskli işlem</span>}
                </div>
              </div>
              <p className={cn("mt-3.5 text-sm leading-relaxed", AD.metin2)}>{istek.aciklama}</p>

              {istek.onayMetin && (
                <div className="mt-4">
                  <label className={cn("mb-1.5 block text-xs font-semibold", AD.metin2)}>
                    Onaylamak için <span className="font-mono text-rose-300">{istek.onayMetin}</span> yaz
                  </label>
                  <input value={dogrulama} onChange={(e) => setDogrulama(e.target.value)} autoFocus
                    className="h-10 w-full rounded-xl border border-[color:var(--ad-kenar)] bg-white/[0.03] px-3 font-mono text-sm text-[color:var(--ad-metin)] outline-none focus:border-rose-400/50" />
                </div>
              )}

              <div className="mt-5 flex gap-2.5">
                <button onClick={() => kapat(false)}
                  className="ad-btn-glass h-10 flex-1 rounded-xl text-sm font-semibold">İptal</button>
                <button onClick={() => kapat(true)} disabled={!onaylanabilir}
                  className="h-10 flex-1 rounded-xl text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: renk, color: risk === 0 ? "#04222c" : "#fff" }}>
                  {gerisayim > 0 ? `Bekle (${gerisayim})` : (istek.eylemEtiket ?? "Onayla")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}
