"use client";

import { BarChart3, BookOpen, Bot, Brain, CalendarCheck, Camera, Clapperboard, Code2, Coffee, Globe, Headphones, Lightbulb, Megaphone, Palette, PenLine, Search, ShoppingBag, Smartphone, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalisanIkon, ScCalisan } from "@/lib/scCalisan";

/** Çalışan simgesi → lucide bileşeni. */
export const CALISAN_IKON: Record<CalisanIkon, LucideIcon> = {
  megafon: Megaphone, arama: Search, kalem: PenLine, kod: Code2, telefon: Smartphone, film: Clapperboard, grafik: BarChart3, takvim: CalendarCheck, palet: Palette,
  ampul: Lightbulb, beyin: Brain, kitap: BookOpen, canta: ShoppingBag, kahve: Coffee, kulaklik: Headphones, bot: Bot, dunya: Globe, kamera: Camera,
};

/** Avatar: çalışanın rengiyle dolgu, beyaz çizgi simge, yuvarlatılmış kare. */
export function CalisanAvatar({ c, boyut = 40, className }: { c: Pick<ScCalisan, "ikon" | "renk">; boyut?: number; className?: string }) {
  const I = CALISAN_IKON[c.ikon] ?? Bot;
  return (
    <span className={cn("relative flex shrink-0 items-center justify-center overflow-hidden ring-1 ring-inset ring-white/15", className)}
      style={{ width: boyut, height: boyut, borderRadius: boyut * 0.3, background: `linear-gradient(145deg, ${c.renk}, color-mix(in srgb, ${c.renk} 45%, #0b0b0c))` }}>
      <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)]" />
      <I className="relative text-white" style={{ width: boyut * 0.48, height: boyut * 0.48 }} strokeWidth={1.9} />
    </span>
  );
}

/**
 * Kapak: çalışanın rengiyle tasarlanmış sahne — ince nokta ızgarası, ışık lekesi ve çalışanın
 * nasıl konuştuğunu gösteren küçük bir sohbet önizlemesi (ilk başlangıç sorusu + avatar).
 */
export function CalisanKapak({ c, buyuk, avatarli, className }: { c: Pick<ScCalisan, "ikon" | "renk" | "baslaticilar" | "ad">; buyuk?: boolean; /** Kapağın içinde avatar ve yazıyor noktaları (kartta avatar ayrıca gösterildiği için varsayılan kapalı). */ avatarli?: boolean; className?: string }) {
  const I = CALISAN_IKON[c.ikon] ?? Bot;
  const soru = c.baslaticilar.find((b) => b.trim()) ?? `${c.ad} ile konuş`;
  return (
    <span className={cn("relative block overflow-hidden", className)} style={{ background: `radial-gradient(120% 90% at 85% 0%, color-mix(in srgb, ${c.renk} 55%, transparent), transparent 60%), radial-gradient(90% 80% at 0% 100%, color-mix(in srgb, ${c.renk} 22%, transparent), transparent 70%), #141416` }}>
      <span aria-hidden className="absolute inset-0 opacity-[0.22] [background-image:radial-gradient(rgba(255,255,255,0.55)_1px,transparent_1px)] [background-size:16px_16px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <I aria-hidden className="absolute -right-4 -top-3 text-white/[0.08]" style={{ width: buyuk ? 180 : 120, height: buyuk ? 180 : 120 }} strokeWidth={1.2} />
      <span className={cn("absolute inset-x-0 bottom-0 flex flex-col gap-2", buyuk ? "p-5" : "p-3.5", !avatarli && (buyuk ? "pb-8" : "pb-7"))}>
        <span className={cn("ml-auto line-clamp-2 max-w-[82%] rounded-[14px] rounded-br-[5px] leading-snug bg-white/[0.14] px-3 py-1.5 text-white/90 backdrop-blur-sm", buyuk ? "text-[13.5px]" : "text-[12px]")}>{soru}</span>
        {avatarli && (
          <span className="flex items-center gap-2">
            <CalisanAvatar c={c} boyut={buyuk ? 30 : 24} />
            <span className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/50" style={{ opacity: 1 - i * 0.25 }} />)}</span>
          </span>
        )}
      </span>
    </span>
  );
}
