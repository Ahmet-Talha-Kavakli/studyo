"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "glass" | "ghost" | "amber" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: Variant;
  size?: Size;
}

// Higgsfield imzası: birincil CTA = vurgu dolgu + SİYAH metin + tam pill.
const variants: Record<Variant, string> = {
  primary:
    "bg-cyan-glow text-ink-950 font-semibold hover:brightness-110",
  amber:
    "bg-amber-glow text-ink-950 font-semibold hover:brightness-110",
  glass:
    "glass-strong text-white hover:bg-white/15",
  outline:
    "border border-white/15 text-white hover:bg-white/8 hover:border-white/25",
  ghost: "text-white/70 hover:text-white hover:bg-white/8",
};

// Tam-pill (Higgsfield 999px imzası).
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm rounded-full gap-1.5",
  md: "h-11 px-5 text-sm rounded-full gap-2",
  lg: "h-13 px-7 text-base rounded-full gap-2.5",
};

/** Apple-vari cam / dolu buton, mikro basma animasyonlu. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className={cn(
          "inline-flex select-none items-center justify-center font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vayra-400/60",
          "disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);
Button.displayName = "Button";
