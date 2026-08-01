"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Sayfa üstünde akan scroll ilerleme çubuğu — landing'de "scroollu geçiş" hissini
 * güçlendirir. Yumuşatılmış (spring) ilerleme.
 */
export function ScrollIlerleme() {
  const { scrollYProgress } = useScroll();
  const genislik = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[90] h-0.5 origin-left bg-gradient-to-r from-vayra-400 via-cyan-glow to-iris-400"
      style={{ scaleX: genislik }}
    />
  );
}
