"use client";

import { cn } from "@/lib/utils";

/* ============================================================
   SC MODEL MARKA İKONLARI — referanslar/modeller birebir.
   Referansta her satırın solunda 34×34 koyu kare içinde beyaz
   marka logosu var (Anthropic yıldızı, OpenAI çiçeği, Google G,
   DeepSeek balinası, Moonshot küresi, GLM Z, Seed çubukları,
   xAI eğik daire). Hepsi tek renk (currentColor) — koyu zeminde beyaz.
   ============================================================ */

export function SCMarkaIkon({ marka, className }: { marka: string; className?: string }) {
  const c = cn("shrink-0", className);

  switch (marka) {
    /* Anthropic — 12 kollu ışın yıldızı */
    case "anthropic":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * Math.PI) / 6;
            return (
              <line key={i} x1={12 + Math.cos(a) * 3.2} y1={12 + Math.sin(a) * 3.2}
                x2={12 + Math.cos(a) * 9.4} y2={12 + Math.sin(a) * 9.4} />
            );
          })}
        </svg>
      );

    /* OpenAI — altı yapraklı düğüm */
    case "openai":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
          <path d="M12 3.2 5.6 6.9v7.4L12 18l6.4-3.7V6.9L12 3.2Z" />
          <path d="M12 3.2v7.4l6.4 3.7M12 10.6 5.6 14.3M12 10.6V18" />
        </svg>
      );

    /* Google — G */
    case "google":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
          <path d="M20.4 12c0 4.6-3.7 8.4-8.4 8.4S3.6 16.6 3.6 12 7.4 3.6 12 3.6c2.3 0 4.3.9 5.8 2.3" />
          <path d="M12 12h8.4" />
        </svg>
      );

    /* xAI (Grok) — eğik çizgili daire */
    case "xai":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="8.6" />
          <path d="M17.4 5.6 6.6 18.4" strokeLinecap="round" />
        </svg>
      );

    /* DeepSeek — balina */
    case "deepseek":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="currentColor">
          <path d="M2.6 13.4c2.7.6 4.6-.2 6.2-1.6 1.4-1.2 2.7-2.6 4.9-2.9 1.9-.3 3.6.4 4.9 1.6.4-.9.2-2-.5-2.9.9.2 1.9.9 2.4 1.9.6 1.2.5 2.6-.2 3.9-1.3 2.5-4.2 4-7.6 4-4.4 0-8.3-1.8-10.1-4Z" />
          <circle cx="16.4" cy="11.4" r="0.85" fill="#000" />
        </svg>
      );

    /* Moonshot (Kimi) — çizgili küre */
    case "moonshot":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="12" cy="12" r="8.6" fill="currentColor" />
          <g stroke="#000" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5.2 8.6h9.6M4 12h10.4M5.2 15.4h9.6M8.2 18.6h6.2" />
          </g>
        </svg>
      );

    /* GLM (Zhipu) — Z */
    case "glm":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="currentColor">
          <path d="M5.4 4.6h13.2l-2 3.1H10l8.6.1-2.1 3.2H8.2l7.9.1-8.2 8.3h11.1l-2 3.1H4.4l8.4-8.5H5.6l2.1-3.2h7.6L7.1 10.7l2-3.1h7.8Z" opacity="0.001" />
          <path d="M6 4.8h12.4L9.6 15.9h8.8L16.6 19H4.6l8.8-11.1H7.2L6 4.8Z" />
        </svg>
      );

    /* Seed (ByteDance) — üç dikey çubuk */
    case "seed":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="currentColor">
          <rect x="4" y="9.2" width="3.2" height="9" rx="1" />
          <rect x="10.4" y="5.4" width="3.2" height="12.8" rx="1" />
          <rect x="16.8" y="11.6" width="3.2" height="6.6" rx="1" />
        </svg>
      );

    /* Akıllı mod — dört uçlu parıltı */
    case "akilli":
      return (
        <svg viewBox="0 0 24 24" className={c} fill="currentColor">
          <path d="M13.6 2.6l1.5 4.1 4.1 1.5-4.1 1.5-1.5 4.1-1.5-4.1L8 8.2l4.1-1.5 1.5-4.1Z" />
          <path d="M6.4 13.4l.9 2.5 2.5.9-2.5.9-.9 2.5-.9-2.5-2.5-.9 2.5-.9.9-2.5Z" />
        </svg>
      );

    /* Vayra (Serbest mod) — marka kıvrımı, lime */
    case "vayra":
    default:
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M3.6 15.4c2.6-4.8 4.6-7.2 6-7.2 2.1 0 1.1 6.4 3.1 6.4 1.4 0 3.3-2.4 5.7-7.2" />
          <path d="M5.4 9.4c2.4 4.4 4.2 6.6 5.5 6.6" opacity="0.55" />
        </svg>
      );
  }
}
