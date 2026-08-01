"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * MarkaSplash — Vayra logo reveal açılış animasyonu.
 * Oturumda BİR KEZ gösterilir (sessionStorage): panel ilk açılışında logo reveal
 * videosu oynar, bitince yumuşakça kaybolur. Video biterse / hata olursa hemen kapanır.
 * Kullanıcı deneyimini yavaşlatmamak için maks 3.2sn'de otomatik kapanır.
 */
export function MarkaSplash() {
  const [goster, setGoster] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Oturumda bir kez
    try {
      if (sessionStorage.getItem("vayra-splash-gorundu")) return;
      sessionStorage.setItem("vayra-splash-gorundu", "1");
    } catch { /* özel modda yoksay */ }
    setGoster(true);
  }, []);

  useEffect(() => {
    if (!goster) return;
    videoRef.current?.play().catch(() => setGoster(false));
    // güvenlik: video takılırsa 3.2sn sonra kapan
    const t = setTimeout(() => setGoster(false), 3200);
    return () => clearTimeout(t);
  }, [goster]);

  return (
    <AnimatePresence>
      {goster && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
          onClick={() => setGoster(false)}
        >
          <motion.video
            ref={videoRef}
            muted playsInline autoPlay preload="auto"
            onEnded={() => setGoster(false)}
            onError={() => setGoster(false)}
            initial={{ scale: 0.96, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1, transition: { duration: 0.6 } }}
            className="h-auto w-[min(70vw,460px)] max-w-full"
          >
            <source src="/brand/vayra-logo-anim.mp4" type="video/mp4" />
          </motion.video>
          {/* atla ipucu */}
          <span className="absolute bottom-8 text-[12px] text-white/30">geçmek için dokun</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
