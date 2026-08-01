"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GorselKarsilastir — sürüklenebilir önce/sonra karşılaştırma.
 *
 * Kaynak: 21st.dev "feature-with-image-comparison" (@tommyjepsen).
 * Vayra'ya uyarlanırken değişenler ve NEDENLERİ:
 *
 *  · Orijinali bir PAZARLAMA BLOĞUYDU (başlık + rozet + metin + görsel sabit
 *    kodlanmış). Burada yalnız karşılaştırma mekanizması alındı, yeniden
 *    kullanılabilir bir bileşene çevrildi (props ile görsel/etiket).
 *  · `onMouseUp` yalnızca kabın ÜSTÜNDEYKEN yakalanıyordu → fare kabın dışında
 *    bırakılınca kolu "yapışık" kalıyordu. Artık window'a bağlı.
 *  · Klavye erişimi yoktu: kol artık ok tuşlarıyla (±2, Shift ile ±10) hareket
 *    eder; role="slider" + aria değerleri verildi.
 *  · next/image yerine <img>: kaynaklar hem yerel dosya hem blob: URL olabiliyor
 *    (kullanıcının yüklediği medya), next/image bunları optimize edemez.
 *  · Renkler bizim cam dilimize alındı (beyaz/muted yerine aksan + glass).
 */
export function GorselKarsilastir({
  once,
  sonra,
  onceEtiket = "Önce",
  sonraEtiket = "Sonra",
  oran = "aspect-[4/3]",
  sonraFiltre,
  className,
}: {
  /** Solda/altta kalan görsel (orijinal). */
  once: string;
  /** Sağda/üstte kalan görsel (işlenmiş). */
  sonra: string;
  onceEtiket?: string;
  sonraEtiket?: string;
  /** Tailwind en-boy sınıfı. */
  oran?: string;
  /** "sonra" katmanına uygulanacak CSS filter — aynı görselden iyileştirme
      önizlemesi üretmek için (upscale composer'ı böyle kullanıyor). */
  sonraFiltre?: string;
  className?: string;
}) {
  const [yuzde, setYuzde] = useState(50);
  const [suruklu, setSuruklu] = useState(false);
  const kapRef = useRef<HTMLDivElement>(null);

  const konumla = useCallback((clientX: number) => {
    const kap = kapRef.current;
    if (!kap) return;
    const r = kap.getBoundingClientRect();
    const x = clientX - r.left;
    setYuzde(Math.min(100, Math.max(0, (x / r.width) * 100)));
  }, []);

  /* Sürükleme window'a bağlı: fare kabın DIŞINDA bırakılınca da biter.
     Orijinalde onMouseUp kabın üstündeydi, kol yapışık kalıyordu. */
  useEffect(() => {
    if (!suruklu) return;
    const hareket = (e: MouseEvent) => konumla(e.clientX);
    const dokunma = (e: TouchEvent) => e.touches[0] && konumla(e.touches[0].clientX);
    const birak = () => setSuruklu(false);
    window.addEventListener("mousemove", hareket);
    window.addEventListener("mouseup", birak);
    window.addEventListener("touchmove", dokunma, { passive: true });
    window.addEventListener("touchend", birak);
    return () => {
      window.removeEventListener("mousemove", hareket);
      window.removeEventListener("mouseup", birak);
      window.removeEventListener("touchmove", dokunma);
      window.removeEventListener("touchend", birak);
    };
  }, [suruklu, konumla]);

  const tus = (e: React.KeyboardEvent) => {
    const adim = e.shiftKey ? 10 : 2;
    if (e.key === "ArrowLeft") { e.preventDefault(); setYuzde((v) => Math.max(0, v - adim)); }
    if (e.key === "ArrowRight") { e.preventDefault(); setYuzde((v) => Math.min(100, v + adim)); }
    if (e.key === "Home") { e.preventDefault(); setYuzde(0); }
    if (e.key === "End") { e.preventDefault(); setYuzde(100); }
  };

  return (
    <div
      ref={kapRef}
      className={cn("relative w-full select-none overflow-hidden rounded-2xl border border-white/[0.08]", oran, className)}
      onMouseDown={(e) => { setSuruklu(true); konumla(e.clientX); }}
      onTouchStart={(e) => { setSuruklu(true); e.touches[0] && konumla(e.touches[0].clientX); }}
    >
      {/* ALT KATMAN — "sonra" (işlenmiş). Tam görünür. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={sonra} alt="" aria-hidden draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={sonraFiltre ? { filter: sonraFiltre } : undefined} />

      {/* ÜST KATMAN — "önce". clip-path ile kolun SOLUNDA kalan kısmı görünür. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={once} alt="" aria-hidden draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - yuzde}% 0 0)` }} />

      {/* Etiketler — hangi tarafın ne olduğunu söyler (orijinalde yoktu). */}
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur-sm">
        {onceEtiket}
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11.5px] font-bold text-zemin"
        style={{ background: "var(--sn-lime, #55d6fd)" }}>
        {sonraEtiket}
      </span>

      {/* AYIRAÇ + KOL */}
      <div className="absolute inset-y-0 z-20 w-px bg-white/85"
        style={{ left: `${yuzde}%`, boxShadow: "0 0 12px rgba(0,0,0,0.5)" }}>
        <button
          type="button"
          role="slider"
          aria-label="Önce/sonra karşılaştırma kolu"
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(yuzde)}
          aria-orientation="horizontal"
          tabIndex={0}
          onKeyDown={tus}
          onMouseDown={(e) => { e.stopPropagation(); setSuruklu(true); }}
          onTouchStart={(e) => { e.stopPropagation(); setSuruklu(true); }}
          className={cn(
            "absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
            "items-center justify-center rounded-full border border-white/25 bg-black/55 text-white",
            "backdrop-blur-md transition-transform hover:scale-110 focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-[var(--sn-lime,#55d6fd)] focus-visible:ring-offset-2 focus-visible:ring-offset-black/50",
            suruklu && "scale-110",
          )}
        >
          <GripVertical className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}
