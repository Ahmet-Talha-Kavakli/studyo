"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { AlertCircle, AlertTriangle, Check, Info, Loader2, X } from "lucide-react";
import { VayraIsaret } from "./VayraIsaret";
import { useToastStore, type ToastTur, type ToastVeri } from "@/lib/toast";
import { cn } from "@/lib/utils";

/**
 * Bildirim katmanı — sol üst, üst menünün hemen altı. iOS bildirim kartı dili:
 * opak kart (bd-kart), solda türüne göre uygulama simgesi karesi, kalın başlık + "şimdi",
 * altında açıklama, sağda eylem hapı (Geri al…), üzerine gelince sol üstte ×.
 *
 * Kapalı yığın: en yeni bildirim önde, en çok iki eskisi arkasından görünür.
 * Üzerine gelince (ya da dokununca) yığın açılır ve tüm geri sayımlar durur;
 * çıkınca kalan süreden devam eder. Aynı bildirim tekrar gelirse "×2" olur.
 * Mobilde sola kaydırarak kapatılır. Hatalar ekran okuyucuya "alert" olarak gider.
 */

const STIL: Record<ToastTur, { ikon: React.ElementType | null; zemin: string; renk: string }> = {
  success: { ikon: Check, zemin: "linear-gradient(135deg, #4ade80, #059669)", renk: "#fff" },
  error: { ikon: AlertCircle, zemin: "linear-gradient(135deg, #ff6b6b, #dc2626)", renk: "#fff" },
  warning: { ikon: AlertTriangle, zemin: "linear-gradient(135deg, #fcd34d, #f59e0b)", renk: "#2a1a00" },
  info: { ikon: Info, zemin: "linear-gradient(135deg, #6fe0ff, #2f7cf6)", renk: "#fff" },
  loading: { ikon: Loader2, zemin: "linear-gradient(135deg, #2c2c30, #121214)", renk: "#fff" },
  default: { ikon: null, zemin: "#000", renk: "#fff" },
};

const GORUNEN = 3;
const BOSLUK = 8;

export function VayraToaster() {
  const toastlar = useToastStore((s) => s.toastlar);
  const kaldir = useToastStore((s) => s.kaldir);
  const [monte, setMonte] = useState(false);
  const [acik, setAcik] = useState(false);
  const [odakDisi, setOdakDisi] = useState(false);
  const [yukseklik, setYukseklik] = useState<Record<string, number>>({});
  useEffect(() => setMonte(true), []);

  // Sekme arka plandayken geri sayım durur (kullanıcı görmediği bildirimi kaçırmasın).
  useEffect(() => {
    const g = () => setOdakDisi(document.visibilityState !== "visible");
    document.addEventListener("visibilitychange", g);
    return () => document.removeEventListener("visibilitychange", g);
  }, []);
  useEffect(() => { if (!toastlar.length) setAcik(false); }, [toastlar.length]);

  if (!monte) return null;
  const sirali = [...toastlar].reverse(); // en yeni önde
  const onYukseklik = yukseklik[String(sirali[0]?.id)] ?? 64;
  const durdur = acik || odakDisi;

  let ofset = 0;
  const konumlar = sirali.map((t, i) => {
    const y = acik ? ofset : i * 10;
    ofset += (yukseklik[String(t.id)] ?? 64) + BOSLUK;
    return y;
  });
  const toplam = acik ? Math.max(0, ofset - BOSLUK) : onYukseklik + Math.min(sirali.length - 1, GORUNEN - 1) * 10;

  return createPortal(
    <section
      aria-label="Bildirimler"
      className="kesfet-tema pointer-events-none fixed left-3 right-3 top-[60px] z-[9999] sm:right-auto sm:left-4 sm:top-[66px] sm:w-[372px]"
      onMouseEnter={() => setAcik(true)}
      onMouseLeave={() => setAcik(false)}
      style={{ background: "transparent" }}
    >
      <ol className="relative" style={{ height: sirali.length ? toplam : 0 }} onClick={() => !acik && sirali.length > 1 && setAcik(true)}>
        <AnimatePresence initial={false}>
          {sirali.map((t, i) => (
            <Kart key={t.id} t={t} sira={i} y={konumlar[i]} acik={acik} durdur={durdur} onYukseklik={onYukseklik}
              gizli={!acik && i >= GORUNEN}
              olcu={(h) => setYukseklik((m) => (m[String(t.id)] === h ? m : { ...m, [String(t.id)]: h }))}
              kapat={() => kaldir(t.id)} />
          ))}
        </AnimatePresence>
      </ol>
    </section>,
    document.body,
  );
}

function Kart({ t, sira, y, acik, durdur, gizli, onYukseklik, olcu, kapat }: {
  t: ToastVeri; sira: number; y: number; acik: boolean; durdur: boolean; gizli: boolean; onYukseklik: number;
  olcu: (h: number) => void; kapat: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const s = STIL[t.tur];
  const I = s.ikon;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => olcu(el.offsetHeight));
    ro.observe(el);
    olcu(el.offsetHeight);
    return () => ro.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const kaydir = (_: unknown, info: PanInfo) => { if (info.offset.x < -80 || info.velocity.x < -500) kapat(); };
  const arkada = !acik && sira > 0;

  return (
    <motion.li
      layout={false}
      initial={{ opacity: 0, y: -18, scale: 0.97 }}
      animate={{ opacity: gizli ? 0 : arkada ? 1 - sira * 0.18 : 1, y, scale: acik ? 1 : 1 - sira * 0.045 }}
      exit={{ opacity: 0, x: -40, transition: { duration: 0.16 } }}
      transition={{ type: "spring", stiffness: 420, damping: 36 }}
      drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0.6, right: 0.05 }} onDragEnd={kaydir}
      className={cn("absolute inset-x-0 top-0 origin-top", gizli ? "pointer-events-none" : "pointer-events-auto")}
      style={{ zIndex: 100 - sira }}
      role={t.tur === "error" ? "alert" : "status"}
      aria-live={t.tur === "error" ? "assertive" : "polite"}
    >
      <div ref={ref} className="group/t relative">
        <div className={cn("bd-kart relative overflow-hidden rounded-[22px]", arkada && "pointer-events-none")} style={arkada ? { height: onYukseklik } : undefined}>
          <div className={cn("flex items-center gap-3 p-3 transition-opacity duration-150", arkada && "opacity-0")}>
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center self-start overflow-hidden rounded-[10px]"
              style={{ background: s.zemin, color: s.renk, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}>
              {t.ikon ?? (I ? <I className={cn("h-[18px] w-[18px]", t.tur === "loading" && "animate-spin")} strokeWidth={2.4} /> : <VayraIsaret size={26} />)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <p className="min-w-0 flex-1 text-[14px] font-semibold leading-[18px] text-white [overflow-wrap:anywhere]">{t.baslik}</p>
                <span className="shrink-0 text-[12px] leading-[18px] tabular-nums text-white/45">{t.adet > 1 ? `×${t.adet} · ` : ""}{t.tur === "loading" ? "sürüyor" : "şimdi"}</span>
              </div>
              {t.aciklama != null && t.aciklama !== "" && <p className="mt-0.5 line-clamp-3 text-[13.5px] leading-[18px] text-white/70 [overflow-wrap:anywhere]">{t.aciklama}</p>}
            </div>
            {t.aksiyon && (
              <button onClick={(e) => { e.stopPropagation(); t.aksiyon!.onClick(); kapat(); }}
                className="h-8 shrink-0 rounded-full bg-white/[0.14] px-3.5 text-[13px] font-semibold text-white transition-[background-color,transform] hover:bg-white/[0.2] active:scale-95">
                {t.aksiyon.label}
              </button>
            )}
          </div>
          {/* Geri sayım (görünmez): bitince kapatır; üzerine gelince durur */}
          {t.sure > 0 && (
            <span key={t.olusma} aria-hidden onAnimationEnd={kapat} className="absolute bottom-0 left-0 h-px w-full opacity-0"
              style={{ animation: `toast-sure ${t.sure}ms linear forwards`, animationPlayState: durdur ? "paused" : "running" }} />
          )}
        </div>
        {!arkada && (
          <button onClick={(e) => { e.stopPropagation(); kapat(); }} aria-label="Bildirimi kapat"
            className="absolute -left-1.5 -top-1.5 flex h-[22px] w-[22px] scale-75 items-center justify-center rounded-full bg-[#3a3a3e] text-white/85 opacity-0 ring-1 ring-black/40 transition-[opacity,transform] duration-150 hover:bg-[#4a4a4f] focus-visible:scale-100 focus-visible:opacity-100 group-hover/t:scale-100 group-hover/t:opacity-100 pointer-coarse:hidden">
            <X className="h-3 w-3" strokeWidth={2.6} />
          </button>
        )}
      </div>
    </motion.li>
  );
}
