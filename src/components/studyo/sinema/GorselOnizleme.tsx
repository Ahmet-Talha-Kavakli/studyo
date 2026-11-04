"use client";

/**
 * Üzerine gelince açılan büyük görsel önizlemesi (element hapındaki kartın aynısı).
 * Portal ile body'ye çıkar ki komut kutusunun overflow'u kesmesin; yukarıda yer yoksa alta açılır.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function GorselOnizleme({ url, etiket, alt, children, className, kapali }: {
  url?: string; etiket?: string; alt?: string; children: React.ReactNode; className?: string; kapali?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const zaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [yer, setYer] = useState<{ x: number; y: number; ust: boolean } | null>(null);
  const [oran, setOran] = useState(4 / 5);
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  useEffect(() => () => { if (zaman.current) clearTimeout(zaman.current); }, []);
  useEffect(() => { if (kapali) setYer(null); }, [kapali]);

  const ac = () => {
    if (!url || kapali) return;
    if (zaman.current) clearTimeout(zaman.current);
    zaman.current = setTimeout(() => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const ust = r.top > 320;
      const x = Math.min(Math.max(r.left + r.width / 2, 130), window.innerWidth - 130);
      setYer({ x, y: ust ? r.top - 10 : r.bottom + 10, ust });
    }, 120);
  };
  const kapat = () => { if (zaman.current) clearTimeout(zaman.current); setYer(null); };

  const gen = oran >= 1 ? 240 : Math.round(260 * oran);
  const yuk = oran >= 1 ? Math.round(240 / oran) : 260;

  return (
    <>
      <span ref={ref} onMouseEnter={ac} onMouseLeave={kapat} onMouseDown={kapat} className={cn("relative inline-flex shrink-0", className)}>{children}</span>
      {hazir && createPortal(
        <AnimatePresence>
          {yer && url && (
            <motion.div key="oniz"
              initial={{ opacity: 0, y: yer.ust ? 6 : -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: yer.ust ? 6 : -6, scale: 0.96 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: "fixed", left: yer.x, top: yer.y, translateX: "-50%", translateY: yer.ust ? "-100%" : "0%" }}
              className="pointer-events-none z-[170] rounded-[22px] bg-[rgba(30,31,35,0.92)] p-2 ring-1 ring-white/[0.1] backdrop-blur-[14px]">
              <span className="relative block overflow-hidden rounded-[16px] bg-white/[0.05]" style={{ width: gen, height: yuk }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={alt ?? etiket ?? ""} className="h-full w-full object-cover"
                  onLoad={(e) => { const i = e.currentTarget; if (i.naturalWidth && i.naturalHeight) setOran(Math.min(Math.max(i.naturalWidth / i.naturalHeight, 0.56), 1.78)); }} />
                {etiket && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2.5 pt-8">
                    <span className="text-[14px] font-semibold text-white">{etiket}</span>
                  </span>
                )}
              </span>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
