"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Usta alt sayfası çerçevesi — Higgsfield birebir (HIGGSFIELD-SPEC.md §2.5-2.9).
 * Üst bar: sol başlık · ortada segment sekmeler · sağda aksan CTA.
 */
export function SCSayfaBaslik({
  baslik, sekmeler, aktifSekme, onSekme, sagAksiyon,
}: {
  baslik: string;
  sekmeler?: { id: string; ad: string; ikon?: ReactNode }[];
  aktifSekme?: string;
  onSekme?: (id: string) => void;
  sagAksiyon?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-[var(--sc-kenar)] bg-[var(--sc-zemin)]/85 px-6 py-4 pr-14 backdrop-blur-xl">
      <h1 className="text-[17px] text-[var(--sc-metin)]">{baslik}</h1>
      {sekmeler && (
        <div className="glass-cip mx-auto flex items-center gap-1 rounded-full p-1">
          {sekmeler.map((s) => (
            <button
              key={s.id}
              onClick={() => onSekme?.(s.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] transition-colors",
                aktifSekme === s.id ? "bg-white text-black" : "text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]",
              )}
            >
              {s.ikon}
              {s.ad}
            </button>
          ))}
        </div>
      )}
      {sagAksiyon && <div className="ml-auto">{sagAksiyon}</div>}
    </div>
  );
}

/** Aksan pill CTA (birçok SC sayfasının sağ üst butonu) */
export function AksanPill({
  children, onClick,
}: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      // Referans: birincil eylem = LIME dolgu + siyah metin (Win $100k, + New employee…)
      className="hf-btn flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-bold"
      style={{ background: "var(--sn-lime)", color: "var(--sn-lime-metin)" }}
    >
      {children}
    </button>
  );
}

/** SC hero — sol metin sütunu + sağ illüstrasyon */
export function SCHero({
  baslik, maddeler, cta, sag,
}: {
  baslik: string;
  maddeler?: { kalin: string; devam: string }[];
  cta?: ReactNode;
  sag?: ReactNode;
}) {
  return (
    <div className="hf-nokta-izgara relative overflow-hidden rounded-[20px] border border-[var(--sc-kenar)] px-8 py-10">
      {/* Higgsfield birebir: sol metin + sağda TAŞAN geniş illüstrasyon (kare kutu değil) */}
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.15fr]">
        <div className="relative z-10">
          <h2 className="sc-baslik text-[38px] sm:text-[44px]">{baslik}</h2>
          {maddeler && (
            <ul className="mt-5 space-y-2.5">
              {maddeler.map((m) => (
                <li key={m.kalin} className="text-[15px] text-[var(--sc-metin-2)]">
                  <span className="font-semibold text-[var(--sc-metin)]">{m.kalin}</span> — {m.devam}
                </li>
              ))}
            </ul>
          )}
          {cta && <div className="mt-6">{cta}</div>}
        </div>
        {sag && <div className="relative flex items-center justify-center lg:justify-end">{sag}</div>}
      </div>
    </div>
  );
}
