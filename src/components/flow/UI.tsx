"use client";

import { type ReactNode } from "react";
import { BadgeCheck } from "lucide-react";

/**
 * Flow ortak UI — Instagram gradient (mor→pembe→turuncu) imza.
 * Avatar (story halkalı), mavi tik, gradient buton, sayaç.
 */

export const IG_GRADIENT = "linear-gradient(45deg, #833AB4, #C13584, #E1306C, #FD1D1D, #F77737)";
export const cn = (...s: (string | false | undefined)[]) => s.filter(Boolean).join(" ");

/** Gradient/gri arka planlı avatar. `story`: halka (izlenmemiş = renkli, izlenmiş = gri). */
export function Avatar({ tohum, ad, boyut = 40, story, izlendi = false, onClick }: {
  tohum: string; ad?: string; boyut?: number; story?: boolean; izlendi?: boolean; onClick?: () => void;
}) {
  let h = 0;
  for (let i = 0; i < tohum.length; i++) h = (h * 31 + tohum.charCodeAt(i)) >>> 0;
  const a = h % 360, b = (a + 55) % 360;
  const bas = ad ? ad.replace(/[@._]/g, " ").trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() : "";
  const ic = (
    <span className="flex items-center justify-center rounded-full font-semibold text-white/90"
      style={{ width: boyut, height: boyut, fontSize: boyut * 0.36, background: `linear-gradient(135deg, hsl(${a} 62% 52%), hsl(${b} 58% 42%))` }}>{bas}</span>
  );
  // onClick varsa button, yoksa span (iç içe <button> / <a>-içi-button hydration hatasını önler)
  if (!story) {
    return onClick
      ? <button onClick={onClick} style={{ lineHeight: 0 }}>{ic}</button>
      : <span className="inline-block" style={{ lineHeight: 0 }}>{ic}</span>;
  }
  const halka = (
    <span className="inline-block rounded-full p-[2.5px]" style={{ background: izlendi ? "rgba(255,255,255,0.18)" : IG_GRADIENT, lineHeight: 0 }}>
      <span className="block rounded-full bg-[#12171c] p-[2px]">{ic}</span>
    </span>
  );
  return onClick ? <button onClick={onClick} style={{ lineHeight: 0 }}>{halka}</button> : halka;
}

/** Kullanıcı adı + mavi tik. */
export function KullaniciAdi({ kadi, onayli, className }: { kadi: string; onayli?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold", className)}>
      {kadi}
      {onayli && <BadgeCheck className="h-3.5 w-3.5 shrink-0 fill-[#3897f0] text-white" />}
    </span>
  );
}

/** Instagram gradient dolgu buton. */
export function GradientDugme({ children, onClick, className, disabled }: { children: ReactNode; onClick?: () => void; className?: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn("rounded-lg px-4 py-1.5 text-[14px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50", className)}
      style={{ background: IG_GRADIENT }}>{children}</button>
  );
}

/** Mavi (Instagram takip et) buton. */
export function MaviDugme({ children, onClick, aktif }: { children: ReactNode; onClick?: () => void; aktif?: boolean }) {
  return (
    <button onClick={onClick}
      className={cn("rounded-lg px-4 py-1.5 text-[14px] font-semibold transition-colors",
        aktif ? "bg-white/[0.08] text-white hover:bg-white/[0.12]" : "bg-[#0095f6] text-white hover:bg-[#1aa0f7]")}>{children}</button>
  );
}
