"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Panel içi yumuşak sayfa geçiş animasyonu — her rota değişiminde. */
export function SayfaGecis({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <motion.div
      key={path}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
