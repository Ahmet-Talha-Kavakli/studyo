"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { butonSinif } from "@/lib/buton";

/** Sayfa genişliği — tüm bölümler aynı ızgaraya oturur. */
export function Kap({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1280px] px-4 sm:px-8", className)}>{children}</div>;
}

/** Görünür alana girince yumuşak yükselme. Bir kez oynar. */
export function Belir({ children, className, gecikme = 0 }: { children: React.ReactNode; className?: string; gecikme?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: gecikme, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** Bölüm başlığı: küçük üst etiket + başlık + açıklama, isteğe bağlı sağ eylem. */
export function BolumBaslik({ ust, baslik, alt, sag, ortala }: {
  ust?: string; baslik: React.ReactNode; alt?: React.ReactNode; sag?: React.ReactNode; ortala?: boolean;
}) {
  return (
    <Belir className={cn("mb-10 flex flex-col gap-5 sm:mb-12", ortala ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between")}>
      <div className={cn(ortala && "flex flex-col items-center")}>
        {ust && <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-vurgu">{ust}</p>}
        <h2 className="max-w-[720px] text-balance text-[30px] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[44px]">{baslik}</h2>
        {alt && <p className="mt-4 max-w-[560px] text-pretty text-[15.5px] leading-relaxed text-metin-2">{alt}</p>}
      </div>
      {sag && <div className="shrink-0">{sag}</div>}
    </Belir>
  );
}

/** Ekrandayken oynayan, ekrandan çıkınca duran video. Büyük medyanın boşuna çalışmasını önler. */
export function GorunurVideo({ src, poster, className, preload = "metadata" }: { src: string; poster?: string; className?: string; preload?: "none" | "metadata" | "auto" }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, [src]);
  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload={preload} className={className} />;
}

/** Fareyle üzerine gelince oynayan video için ref + işleyiciler. */
export function useHoverVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  return {
    ref,
    oynat: () => { ref.current?.play().catch(() => {}); },
    durdur: () => { const v = ref.current; if (v) { v.pause(); v.currentTime = 0; } },
  };
}

/** Birincil / ikincil eylem butonları — sayfa genelinde tek stil. */
export function Buton({ children, varyant = "birincil", className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { varyant?: "birincil" | "ikincil" | "beyaz" }) {
  return (
    <button {...p} className={cn(butonSinif(varyant), className)}>{children}</button>
  );
}
export { butonSinif };
