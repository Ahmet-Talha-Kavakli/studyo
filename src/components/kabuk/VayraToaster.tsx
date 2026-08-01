"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Info, Loader2, Bell, X } from "lucide-react";
import { useToastStore, type ToastVeri, type ToastTur } from "@/lib/toast";

/**
 * VAYRA TOAST render katmanı (m53).
 * ---------------------------------------------------------------
 * Konum: SOL-ÜST — nav'ın (48px) hemen altında. Kullanıcı isteği:
 * "sol üstün bir tık altında gelsin".
 *
 * Görünüm: Vayra cam dili (koyu blur + ince kenar), türe göre renkli
 * ikon rozeti + üstte ince ilerleme çubuğu (kalan süre). Yığılma spring
 * animasyonu, hover'da otomatik kapanma duraklar, kapat düğmesi.
 */

const TUR_STIL: Record<ToastTur, { renk: string; ikon: typeof CheckCircle2 }> = {
  success: { renk: "var(--sn-lime, #55d6fd)", ikon: CheckCircle2 },
  error: { renk: "#fb7185", ikon: XCircle },
  warning: { renk: "#fbbf24", ikon: AlertTriangle },
  info: { renk: "#7dd3fc", ikon: Info },
  loading: { renk: "rgba(255,255,255,0.55)", ikon: Loader2 },
  default: { renk: "rgba(255,255,255,0.55)", ikon: Bell },
};

function ToastKart({ t }: { t: ToastVeri }) {
  const kaldir = useToastStore((s) => s.kaldir);
  const stil = TUR_STIL[t.tur];
  const Ikon = stil.ikon;
  const [duraklat, setDuraklat] = useState(false);

  useEffect(() => {
    if (t.sure <= 0 || duraklat) return;
    const zamanlayici = setTimeout(() => kaldir(t.id), t.sure);
    return () => clearTimeout(zamanlayici);
  }, [t.id, t.sure, duraklat, kaldir]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -24, scale: 0.9, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 460, damping: 34 }}
      onMouseEnter={() => setDuraklat(true)}
      onMouseLeave={() => setDuraklat(false)}
      className="pointer-events-auto relative w-[360px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[15px]"
      style={{
        background: "rgba(24, 26, 29, 0.92)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 20px 48px -16px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,0,0,0.4)",
      }}
      role="status"
    >
      {/* sol renkli şerit */}
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: stil.renk }} />

      <div className="flex items-start gap-3 px-4 py-3.5 pl-[18px]">
        {/* ikon rozeti */}
        <span
          className="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px]"
          style={{
            color: stil.renk,
            background: `color-mix(in srgb, ${stil.renk} 16%, transparent)`,
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${stil.renk} 26%, transparent)`,
          }}
        >
          {t.ikon ?? <Ikon className={t.tur === "loading" ? "h-[17px] w-[17px] animate-spin" : "h-[17px] w-[17px]"} strokeWidth={2.2} />}
        </span>

        <div className="min-w-0 flex-1 pt-px">
          <p className="text-[13.5px] font-semibold leading-snug text-[#f3f3f5] [overflow-wrap:anywhere]">{t.baslik}</p>
          {t.aciklama != null && t.aciklama !== "" && (
            <p className="mt-1 text-[12.5px] leading-relaxed text-metin-3 [overflow-wrap:anywhere]">{t.aciklama}</p>
          )}
          {t.aksiyon && (
            <button
              onClick={() => { t.aksiyon!.onClick(); kaldir(t.id); }}
              className="mt-2.5 rounded-[9px] px-3 py-1.5 text-[12.5px] font-bold text-zemin transition-transform hover:-translate-y-px"
              style={{
                background: "linear-gradient(180deg, var(--sn-lime-parlak, #7de0ff) 0%, var(--sn-lime, #55d6fd) 100%)",
                boxShadow: "0 2px 10px color-mix(in srgb, var(--sn-lime, #55d6fd) 26%, transparent)",
              }}
            >
              {t.aksiyon.label}
            </button>
          )}
        </div>

        {/* kapat — hover'da belirir */}
        <button
          onClick={() => kaldir(t.id)}
          className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-metin-3 opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover:opacity-100 [.group\\/toast:hover_&]:opacity-100"
          aria-label="Kapat"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* alt ilerleme çubuğu — kalan süre (loading hariç) */}
      {t.sure > 0 && !duraklat && (
        <motion.span
          key={`bar-${t.id}`}
          className="absolute bottom-0 left-0 h-[2px]"
          style={{ background: stil.renk, opacity: 0.5 }}
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: t.sure / 1000, ease: "linear" }}
        />
      )}
    </motion.div>
  );
}

export function VayraToaster() {
  const toastlar = useToastStore((s) => s.toastlar);
  const [monte, setMonte] = useState(false);
  useEffect(() => setMonte(true), []);
  if (!monte) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed left-4 top-[60px] z-[9999] flex flex-col gap-2.5"
      style={{ maxWidth: "min(360px, calc(100vw - 24px))" }}
    >
      <AnimatePresence mode="popLayout">
        {toastlar.map((t) => (
          <div key={t.id} className="group/toast pointer-events-none">
            <ToastKart t={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
