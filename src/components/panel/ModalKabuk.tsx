"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Proje modallarının ortak kabuğu (başlık + kapat + kart yüzeyi).
 *
 * NOT: Bu bileşen daha önce `src/app/panel/projeler/page.tsx` içinden export
 * ediliyordu. Next.js sayfa dosyaları yalnızca `default` ve tanınan alanları
 * (metadata, dynamic vb.) dışa açabildiğinden build
 * "ModalKabuk is not a valid Page export field" hatasıyla kırılıyordu.
 * Hem liste sayfası hem de /panel/projeler/[id] kullandığı için ortak
 * bileşen dosyasına taşındı.
 */
export function ModalKabuk({ baslik, onKapat, children, genis }: {
  baslik: string;
  onKapat: () => void;
  children: React.ReactNode;
  genis?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button className="perde absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Kapat" onClick={onKapat} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className={cn("relative w-full rounded-2xl bg-yuzey p-5 ring-1 ring-inset ring-white/[0.08]", genis ? "max-w-3xl" : "max-w-md")}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-metin">{baslik}</h2>
          <button onClick={onKapat} aria-label="Kapat" className="glass-ikon flex h-7 w-7 items-center justify-center rounded-full text-metin-2">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
