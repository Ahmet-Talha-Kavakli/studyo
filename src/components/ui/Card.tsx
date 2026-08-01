"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Cam kart — hover'da hafif kalkar, kenar ışıması belirir. */
export function Card({
  className,
  hover = true,
  children,
  ...props
}: Omit<HTMLMotionProps<"div">, "children"> & { hover?: boolean; children?: ReactNode }) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-yuzey p-5",
        "backdrop-blur-xl transition-colors",
        hover && "hover:border-white/20",
        className,
      )}
      {...props}
    >
      {hover && (
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-vayra-500/20 via-transparent to-cyan-glow/10" />
        </div>
      )}
      <div className="relative">{children}</div>
    </motion.div>
  );
}
