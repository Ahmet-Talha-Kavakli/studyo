/**
 * Admin animasyon standartları — tek merkez → tutarlı mikro/makro his.
 * framer-motion variant/transition sabitleri + count-up hook.
 */
import { useEffect, useRef, useState } from "react";

/** Apple-benzeri yumuşak spring. */
export const SPRING = { type: "spring", stiffness: 320, damping: 30, mass: 0.8 } as const;
export const SPRING_YUMUSAK = { type: "spring", stiffness: 200, damping: 26 } as const;

/** Kart giriş — hafif yukarıdan belir. */
export const kartGiris = {
  gizli: { opacity: 0, y: 12 },
  gorunur: { opacity: 1, y: 0 },
};

/** Liste stagger konteyner. */
export const stagger = {
  gorunur: { transition: { staggerChildren: 0.04 } },
};

/** Sayfa geçişi. */
export const sayfaGecis = {
  gizli: { opacity: 0, y: 8 },
  gorunur: { opacity: 1, y: 0 },
  cikis: { opacity: 0, y: -8 },
};

/** Çekmece (sağdan) spring giriş. */
export const cekmeceGiris = {
  gizli: { x: "100%" },
  gorunur: { x: 0 },
  cikis: { x: "100%" },
};

/** Sayı count-up animasyonu (deterministik başlangıç, SSR-safe: 0'dan sayar). */
export function useSayac(hedef: number, sure = 900): number {
  const [deger, setDeger] = useState(0);
  const rafRef = useRef<number | null>(null);
  const baslangicRef = useRef<number | null>(null);

  useEffect(() => {
    baslangicRef.current = null;
    const tik = (t: number) => {
      if (baslangicRef.current === null) baslangicRef.current = t;
      const gecen = t - baslangicRef.current;
      const oran = Math.min(1, gecen / sure);
      // easeOutCubic
      const e = 1 - Math.pow(1 - oran, 3);
      setDeger(hedef * e);
      if (oran < 1) rafRef.current = requestAnimationFrame(tik);
      else setDeger(hedef);
    };
    rafRef.current = requestAnimationFrame(tik);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [hedef, sure]);

  return deger;
}
