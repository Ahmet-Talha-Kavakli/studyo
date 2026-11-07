"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { YuklemeIsigi } from "./YuklemeEkrani";

/** En kısa ve en uzun gösterim (ms). Sayfa hazır olunca en kısa süreden sonra kapanır. */
const EN_AZ = 1100;
const EN_COK = 2400;

/**
 * MarkaSplash — oturumun ilk panel açılışında Akış ekranı; sayfa hazır olunca şeritler toplanır ve ekran o çizgiden açılır.
 * Rakipler (Higgsfield, Krea, Runway, Linear) içeriği bekletmiyor; bu yüzden ekran
 * sayfa hazır olur olmaz (en az 1.3 sn, en çok 2.4 sn; işaretin çizilişi görünsün diye) kapanır. Tık, dokunma ya da
 * herhangi bir tuş hemen geçer. Hareketi azalt açıkken yalnız kısa bir geçiş yapılır.
 */
export function MarkaSplash() {
  const [goster, setGoster] = useState(false);
  const sistemAzalt = useReducedMotion();
  const [azalt, setAzalt] = useState(false);
  /** Kullanıcı atladıysa çıkış daha kısa. */
  const [atlandi, setAtlandi] = useState(false);
  /** Sayfa hazır: şeritler toplanıp ekran açılır, sonra kapanır. */
  const [bitiyor, setBitiyor] = useState(false);

  useEffect(() => {
    // Oturumda bir kez
    try {
      if (sessionStorage.getItem("vayra-splash-gorundu")) return;
      sessionStorage.setItem("vayra-splash-gorundu", "1");
    } catch { /* özel modda yoksay */ }
    setAzalt(!!sistemAzalt || document.documentElement.classList.contains("hareket-azalt"));
    setGoster(true);
  }, [sistemAzalt]);

  useEffect(() => {
    if (!goster) return;
    const basla = performance.now();
    let kapandi = false;
    const kapat = () => { if (!kapandi) { kapandi = true; if (azalt) setGoster(false); else setBitiyor(true); } };
    const atla = () => { kapandi = true; setGoster(false); };
    const enAz = azalt ? 350 : EN_AZ;
    const hazirsaKapat = () => {
      const kalan = enAz - (performance.now() - basla);
      setTimeout(kapat, Math.max(0, kalan));
    };
    if (document.readyState === "complete") hazirsaKapat();
    else window.addEventListener("load", hazirsaKapat, { once: true });
    const tavan = setTimeout(kapat, EN_COK);
    // Kısa çıkış süresi önce render edilsin, kapanış bir sonraki karede.
    const tus = () => { setAtlandi(true); requestAnimationFrame(atla); };
    window.addEventListener("keydown", tus);
    return () => {
      clearTimeout(tavan);
      window.removeEventListener("load", hazirsaKapat);
      window.removeEventListener("keydown", tus);
    };
  }, [goster, azalt]);

  const yumusak = [0.22, 1, 0.36, 1] as const;

  return (
    <AnimatePresence>
      {goster && (
        <motion.div
          key="marka-splash"
          role="status"
          aria-live="polite"
          aria-label="Vayra yükleniyor"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: azalt || atlandi ? 0.18 : 0.45, ease: yumusak } }}
          onPointerDown={() => { setAtlandi(true); requestAnimationFrame(() => setGoster(false)); }}
          className="fixed inset-0 z-[200] cursor-default select-none overflow-hidden bg-zemin pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]"
        >
          <motion.div
            className="absolute inset-0"
            initial={azalt ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: azalt ? 0.2 : 0.5, ease: yumusak } }}
            exit={azalt || atlandi ? { opacity: 0, transition: { duration: 0.15 } } : { opacity: 0, y: -4, transition: { duration: 0.35, ease: yumusak } }}
          >
            <YuklemeIsigi durumlar={["Çalışma alanın hazırlanıyor", "Projelerin getiriliyor", "Modeller bağlanıyor"]} bitis={bitiyor} onBitti={() => setGoster(false)} />
            <span className="sr-only">Geçmek için herhangi bir tuşa basabilir ya da ekrana dokunabilirsin.</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
