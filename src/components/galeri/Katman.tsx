"use client";

/**
 * Galeri katmanı — masaüstünde düğmeye bağlı yüzen popover (Yuzen), telefonda (640 altı)
 * alttan çıkan çekmece. Yüzey: yuvarlak köşe, ince kenarlık, buzlu cam; arkasında gölge yok.
 * Galeri popover'larının (görünüm ayarı, indirme, süzgeçler, takvim) ortak kabuğu.
 */

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { X } from "lucide-react";
import { Yuzen, type Yerlesim } from "@/components/ui/Yuzen";
import { useMasaustu } from "@/hooks/useMasaustu";
import { cn } from "@/lib/utils";

/** Buzlu cam popover yüzeyi (gölgesiz). */
export const CAM_YUZEY = "galeri-cam rounded-[18px] border border-white/[0.09]";

export function Katman({ acik, onKapat, yerlesim = "alt-sag", genislik = 300, baslik, etiket, children, className, z = 400 }: {
  acik: boolean; onKapat: () => void; yerlesim?: Yerlesim; genislik?: number;
  /** Çekmecede başlık satırı (masaüstünde içerik kendi başlığını taşır). */
  baslik?: string; etiket?: string; children: ReactNode; className?: string; z?: number;
}) {
  const masaustu = useMasaustu();
  if (masaustu) {
    return (
      <Yuzen acik={acik} onKapat={onKapat} yerlesim={yerlesim} bosluk={8} etiket={etiket ?? baslik} z={z}
        className={cn(CAM_YUZEY, "p-1.5 text-metin", className)} style={{ width: genislik }}>
        <MotionConfig reducedMotion="user">
          <motion.div initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}>
            {children}
          </motion.div>
        </MotionConfig>
      </Yuzen>
    );
  }
  return <Cekmece acik={acik} onKapat={onKapat} baslik={baslik} etiket={etiket} z={z} className={className}>{children}</Cekmece>;
}

/** Telefonda alttan çekmece: perde, tutamaç, başlık ve kapat düğmesi; içerik kayar. */
export function Cekmece({ acik, onKapat, baslik, etiket, children, className, z = 400 }: {
  acik: boolean; onKapat: () => void; baslik?: string; etiket?: string; children: ReactNode; className?: string; z?: number;
}) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  useEffect(() => {
    if (!acik) return;
    const tus = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onKapat(); } };
    window.addEventListener("keydown", tus, true);
    return () => window.removeEventListener("keydown", tus, true);
  }, [acik, onKapat]);
  if (!hazir) return null;
  return createPortal(
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {acik && (
          <div className="fixed inset-0" style={{ zIndex: z }} onClick={(e) => e.stopPropagation()}>
            <motion.div aria-hidden className="perde absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onKapat} />
            <motion.div role="dialog" aria-label={etiket ?? baslik}
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 420, damping: 40 }}
              drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, i) => { if (i.offset.y > 90 || i.velocity.y > 600) onKapat(); }}
              className={cn(CAM_YUZEY, "absolute inset-x-0 bottom-0 max-h-[86vh] overflow-hidden rounded-b-none pb-[max(12px,env(safe-area-inset-bottom))] text-metin", className)}>
              <div className="flex justify-center pt-2"><span className="h-1 w-10 rounded-full bg-white/25" /></div>
              {baslik && (
                <div className="flex items-center gap-2 px-4 pb-1 pt-2">
                  <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-metin">{baslik}</h2>
                  <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-metin-2 transition active:scale-90 hover:text-metin"><X className="h-4 w-4" /></button>
                </div>
              )}
              <div className="max-h-[calc(86vh-60px)] overflow-y-auto px-2 pb-1">{children}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  );
}

/** Popover içinde başlıklı bölüm. */
export function Bolum({ baslik, sag, children, className }: { baslik: string; sag?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("px-2 py-2", className)}>
      <div className="mb-1.5 flex items-center gap-2 px-0.5">
        <h3 className="flex-1 text-[12.5px] font-medium text-metin-2">{baslik}</h3>
        {sag}
      </div>
      {children}
    </section>
  );
}

/** Kayan arka planlı segment (seçili: açık dolgu, tik yok). */
export function KayanSegment<T extends string>({ deger, onDegis, secenekler, grup, etiket, dikey }: {
  deger: T; onDegis: (v: T) => void; grup: string; etiket: string;
  secenekler: { id: T; ad: string; ikon?: React.ElementType }[];
  /** İkonu üstte, adı altta (iki satırlı karo). */
  dikey?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={etiket} className="flex gap-1 rounded-[13px] bg-white/[0.045] p-1 ring-1 ring-inset ring-white/[0.06]">
      {secenekler.map((s) => {
        const sec = s.id === deger;
        const I = s.ikon;
        return (
          <motion.button key={s.id} type="button" role="radio" aria-checked={sec} onClick={() => onDegis(s.id)} whileTap={{ scale: 0.95 }}
            className={cn("relative flex min-w-0 flex-1 items-center justify-center rounded-[10px] px-2 text-[13px] font-medium transition-colors",
              dikey ? "h-[54px] flex-col gap-1" : "h-9 gap-1.5", sec ? "text-[#0d0e10]" : "text-metin-2 hover:text-metin")}>
            {sec && <motion.span layoutId={`kayan-${grup}`} className="absolute inset-0 rounded-[10px] bg-white" transition={{ type: "spring", stiffness: 520, damping: 38 }} />}
            {I && <I className={cn("relative shrink-0", dikey ? "h-[18px] w-[18px]" : "h-4 w-4")} />}
            <span className="relative truncate">{s.ad}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

/** Açma/kapama anahtarı (açık: camgöbeği). */
export function Anahtar({ acik, onDegis, etiket, kilitli }: { acik: boolean; onDegis?: (v: boolean) => void; etiket: string; kilitli?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={acik} aria-label={etiket} disabled={kilitli} onClick={() => onDegis?.(!acik)}
      className={cn("relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors disabled:cursor-not-allowed", acik ? "bg-aksan" : "bg-white/[0.16]", kilitli && "opacity-55")}>
      <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 34 }}
        className={cn("absolute top-[3px] h-4 w-4 rounded-full", acik ? "right-[3px] bg-[#0d0e10]" : "left-[3px] bg-white")} />
    </button>
  );
}
