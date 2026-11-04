"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, Clapperboard, Crown, Flame, Footprints, Gamepad2, Orbit, Repeat, Skull, Sparkles, Trophy, Video, Wand2, Zap } from "lucide-react";
import type { KatalogPreset } from "@/lib/presetKatalog";
import { cn } from "@/lib/utils";

/** Kategori simgesi — tasarlanmış kapakta kullanılır. */
export const KAT_IKON: Record<string, React.ElementType> = {
  KAÇIŞ: Footprints, SPOR: Trophy, AKSİYON: Zap, FANTASTİK: Wand2, SİNEMATİK: Clapperboard, UZAY: Orbit, DÖNÜŞÜM: Repeat, "KAMERA HAREKETİ": Video, OYUN: Gamepad2, VIRAL: Flame, KORKU: Skull,
};

/** Kapak: görsel varsa görsel; yoksa (henüz örneği olmayan preset ya da kapaksız kendi presetin) tasarlanmış kapak. */
export function PresetKapak({ p, className, kucuk }: { p: KatalogPreset; className?: string; kucuk?: boolean }) {
  if (p.kapak) return <img src={p.kapak} alt="" draggable={false} className={cn("h-full w-full object-cover", className)} />;
  const I = KAT_IKON[p.kategoriler.find((k) => k !== "VIRAL") ?? "VIRAL"] ?? Sparkles;
  return (
    <div className={cn("relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[linear-gradient(165deg,color-mix(in_oklab,var(--vurgu-renk)_38%,#0b0b10)_0%,#111113_70%)]", className)}>
      <div aria-hidden className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
      <span className={cn("relative flex items-center justify-center rounded-2xl bg-white/[0.08] ring-1 ring-inset ring-white/15 backdrop-blur", kucuk ? "h-8 w-8" : "h-14 w-14")}><I className={cn("text-white", kucuk ? "h-4 w-4" : "h-6 w-6")} /></span>
      {!kucuk && p.ozel && <span className="relative mt-3 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white/80">Kendi presetin</span>}
    </div>
  );
}

/** Video önizlemesi — görünür olduğunda ve (masaüstünde) üzerine gelindiğinde oynar. */
export function PresetVideo({ p, oyna, className }: { p: KatalogPreset; oyna: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [yuklendi, setYuklendi] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (oyna) { v.currentTime = 0; void v.play().catch(() => {}); } else v.pause();
  }, [oyna, yuklendi]);
  return (
    <div className={cn("absolute inset-0", className)}>
      <PresetKapak p={p} className={cn("transition-transform duration-[1200ms] ease-out", oyna && !p.video && p.kapak && "scale-[1.06]")} />
      {p.video && oyna && (
        <video ref={ref} src={p.video} muted loop playsInline preload="auto" onLoadedData={() => setYuklendi(true)}
          className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-300", yuklendi ? "opacity-100" : "opacity-0")} />
      )}
    </div>
  );
}

/** Görünür olunca true — galeride yalnız ekrandaki videolar oynar (Higgsfield gibi sürekli döngü, pil dostu). */
function useGorunur<T extends Element>() {
  const ref = useRef<T>(null);
  const [gorunur, setGorunur] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setGorunur(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, gorunur] as const;
}

/** Galeri kartı: masonry oranında, örnek video ekranda kendiliğinden oynar; üstüne gelince "Dene". */
export function PresetKarti({ p, kayitli, onKayit, href, oran, kullanim = 0 }: {
  p: KatalogPreset; kayitli: boolean; onKayit: () => void; href: string; oran: string; kullanim?: number;
}) {
  const [ref, gorunur] = useGorunur<HTMLDivElement>();
  const hareketAz = typeof window !== "undefined" && document.documentElement.classList.contains("hareket-azalt");
  return (
    <div ref={ref} className="group relative mb-3 break-inside-avoid">
      <Link href={href} aria-label={`${p.ad} — ${p.kredi} kredi`}
        className="relative block w-full overflow-hidden rounded-[18px] bg-yuzey outline-none ring-1 ring-inset ring-white/[0.06] transition-[box-shadow] duration-300 focus-visible:ring-2 focus-visible:ring-white/70 group-hover:ring-white/[0.22]"
        style={{ aspectRatio: oran }}>
        <PresetVideo p={p} oyna={gorunur && !hareketAz} className="transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]" />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
        {(p.etiket === "Yeni" || p.pro || p.ozel) && (
          <span className="absolute left-2.5 top-2.5 flex gap-1">
            {p.etiket === "Yeni" && <span className="rounded-md bg-vurgu px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-vurgu-ust">Yeni</span>}
            {p.pro && <span className="inline-flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur"><Crown className="h-3 w-3 text-amber-300" />Pro</span>}
            {p.ozel && <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur", p.taslak ? "bg-amber-400 text-[#1a1206]" : "bg-black/55 text-white")}>{p.taslak ? "Taslak" : "Senin"}</span>}
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 p-3">
          <span className="block min-w-0 transition-[padding] group-hover:pr-[76px] [@media(hover:none)]:group-hover:pr-0">
            <span lang="en" className="line-clamp-2 text-[13px] font-extrabold uppercase leading-tight sm:text-[15px] tracking-[-0.01em] text-white">{p.ad}</span>
            <span className="mt-1 block truncate text-[11.5px] text-white/65">{p.taslak ? "Düzenlemeye devam et" : kullanim > 0 ? `${kullanim} kez kullandın` : `${p.kredi} kredi · ${p.sureSn} sn`}</span>
          </span>
          <span className="absolute bottom-3 right-3 inline-flex translate-y-1 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-zemin opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 [@media(hover:none)]:hidden">
            Dene<ArrowRight className="h-3.5 w-3.5" />
          </span>
        </span>
      </Link>
      <button type="button" onClick={onKayit} aria-pressed={kayitli} aria-label={kayitli ? `${p.ad} kayıtlılardan çıkar` : `${p.ad} kaydet`}
        className={cn("absolute right-2 top-2 z-[1] flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition-[opacity,background-color]",
          kayitli ? "bg-white text-zemin opacity-100" : "bg-black/45 text-white opacity-0 hover:bg-black/65 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100")}>
        <Bookmark className={cn("h-3.5 w-3.5", kayitli && "fill-current")} />
      </button>
    </div>
  );
}
