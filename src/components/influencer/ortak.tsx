"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Görselli seçim karosu (tekli/çoklu). */
export function GorselKaro({ kapak, ad, alt, secili, onClick, oran = "aspect-[4/5]", coklu, renk, rozet, kucuk }: {
  kapak: string; ad: string; alt?: string; secili: boolean; onClick: () => void; oran?: string; coklu?: boolean; renk?: string; rozet?: string; kucuk?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={secili} title={alt ? `${ad} · ${alt}` : ad}
      className={cn("group relative w-full overflow-hidden rounded-[16px] bg-black text-left transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98]", oran)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={kapak} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
      <span aria-hidden className={cn("pointer-events-none absolute inset-0 z-10 rounded-[16px] ring-inset transition-shadow", secili ? "ring-2 ring-white" : "ring-1 ring-white/10 group-hover:ring-white/35")} />
      {coklu && !secili ? <span className="absolute right-1.5 top-1.5 h-5 w-5 rounded-full bg-black/40 ring-1 ring-white/50" /> : null}
      {rozet && <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-px text-[10px] font-medium text-white">{rozet}</span>}
      <span className="absolute inset-x-3 bottom-2.5 flex items-end gap-1.5">
        {renk && <span className="mb-0.5 h-3 w-3 shrink-0 rounded-full ring-1 ring-white/60" style={{ background: renk }} />}
        <span className="min-w-0">
          <span className={cn("block truncate font-semibold leading-tight text-white", kucuk ? "text-[12px]" : "text-[14px]")}>{ad}</span>
          {alt && !kucuk && <span className="block truncate text-[11.5px] leading-tight text-white/70">{alt}</span>}
        </span>
      </span>
    </button>
  );
}

/** Oran önizleme kutusu. */
export function OranKutu({ o, boyut = 40 }: { o: string; boyut?: number }) {
  const [w, h] = o.split(":").map(Number);
  const k = (boyut * 0.55) / Math.max(w, h);
  return (
    <span className="glass-ikon flex shrink-0 items-center justify-center rounded-lg" style={{ width: boyut, height: boyut }}>
      <span className="rounded-[3px] border-[1.5px] border-aksan" style={{ width: w * k, height: h * k }} />
    </span>
  );
}

/** Platform logosu (beyaz yuvarlak içinde — siyah logolar koyu zeminde de görünür). */
export function PlatformLogo({ src, boyut = 22 }: { src: string; boyut?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-white" style={{ width: boyut, height: boyut }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="object-contain" style={{ width: boyut * 0.6, height: boyut * 0.6 }} />
    </span>
  );
}

/** Bölüm başlığı: ikon + cümle düzeninde başlık + sağ içerik. */
export function Baslik({ ikon: I, ad, sag }: { ikon: LucideIcon; ad: string; sag?: React.ReactNode; renk?: string }) {
  return (
    <div className="-mx-3 -mt-3 mb-3 flex min-h-[46px] items-center justify-between gap-2 border-b border-white/[0.06] px-3.5 py-2.5">
      <span className="flex min-w-0 items-center gap-2 text-[13.5px] font-semibold text-metin">
        <I className="h-4 w-4 shrink-0 text-metin-2" />
        <span className="truncate">{ad}</span>
      </span>
      {sag && <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-metin-3">{sag}</span>}
    </div>
  );
}

/** Görselli seçenek ızgarası (karo genişliği otomatik). */
export function KaroIzgara({ min = 96, children, className }: { min?: number; children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-3", className)} style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, calc(50% - 6px)), 1fr))` }}>{children}</div>;
}

/** Önizleme modu rozeti (görsel üstünde okunur). */
export function DemoRozet({ baslik = "Sağlayıcı bağlı değil: plan önizlemesi, gerçek üretim değil" }: { baslik?: string }) {
  void baslik; return null;
}
