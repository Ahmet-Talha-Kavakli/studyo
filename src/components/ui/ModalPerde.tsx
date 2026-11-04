"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Ortada açılan pencerelerin arka perdesi: bulanık, karartılmış sayfa üstünde
 * karakter yağmuru. Yağmuru `.perde` sınıfı sayesinde PerdeGozcusu bağlar
 * (sitedeki tüm modal arka planlarıyla aynı motor, bkz. lib/perdeMotor).
 */
export function ModalPerde({ onKapat, className }: { onKapat?: () => void; className?: string }) {
  return (
    <motion.div aria-hidden onClick={onKapat}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
      className={cn("perde absolute inset-0", className)} />
  );
}
