"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Panel sayfa başlığı — sol açıklama, sağ aksiyon. */
export function Baslik({
  baslik,
  aciklama,
  aksiyon,
}: {
  baslik: string;
  aciklama?: string;
  aksiyon?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-7 flex flex-wrap items-end justify-between gap-4"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{baslik}</h1>
        {aciklama && <p className="mt-1 text-sm text-white/55">{aciklama}</p>}
      </div>
      {aksiyon}
    </motion.div>
  );
}
