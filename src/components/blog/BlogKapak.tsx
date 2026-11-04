"use client";

/**
 * Blog kapağı (2026-10-29). Bulanık "tasarım kapak" yerine hepsi gerçek:
 *  - Ürün ve teknik yazılar: konuyla ilgili Vayra üretimi zemin + güncel arayüzün pencere görüntüsü
 *    (public/gercek/blog, panelden çekildi) — Linear/Runway ürün kapakları gibi.
 *  - Preset yazıları: gerçek preset videosu; öne çıkanda oynar, kartta üzerine gelince oynar.
 *  - Diğerleri: yazının kendi Vayra üretimi kapağı.
 */

import { useRef } from "react";
import type { BlogYazi } from "@/lib/kurumsal/blog";
import { cn } from "@/lib/utils";

const EKRAN: Record<string, { ekran: string; zemin: string }> = {
  "claude-u-vayraya-bagla-mcp": { ekran: "/gercek/surum/mcp.webp", zemin: "/gercek/galeri/soyut7.webp" },
  "iki-adimli-dogrulama-ve-guvenlik": { ekran: "/gercek/blog/guvenlik.jpg", zemin: "/gercek/galeri/soyut2.webp" },
  "kitaplik-bastan": { ekran: "/gercek/blog/kitaplik.jpg", zemin: "/gercek/galeri/manzara6.webp" },
  "api-v1-webhook-idempotency": { ekran: "/gercek/blog/api.jpg", zemin: "/gercek/galeri/soyut10.webp" },
  "vayra-earn-kreatorlere-odeme": { ekran: "/gercek/blog/earn.jpg", zemin: "/gercek/orig/seed-kapadokya-veo31.webp" },
  "kredi-fiyatlandirmasi-nasil-calisir": { ekran: "/gercek/blog/kredi.jpg", zemin: "/gercek/galeri/soyut5.webp" },
  "vayra-3d-studyo-tanitim": { ekran: "/gercek/blog/3d.jpg", zemin: "/gercek/galeri/3d4.webp" },
  "yaraticilar-icin-uretim-akisi": { ekran: "/gercek/blog/canvas.jpg", zemin: "/gercek/galeri/sinematik5.webp" },
  "model-yonlendirme-mimarisi": { ekran: "/gercek/blog/modeller.jpg", zemin: "/gercek/galeri/soyut12.webp" },
};
const VIDEO: Record<string, string> = {
  "presetler-yenilendi": "/gercek/preset-video/earth-zoom.mp4",
  "tek-fotograftan-viral-video-5-fikir": "/gercek/preset-video/selfie-twin.mp4",
};
/** Eski adla dışa aktarım: tasarım kapaklı yazı mı (artık arayüz görüntülü kapak). */
export const tasarimKapakVar = (slug: string) => slug in EKRAN;
export const kapakVideosu = (slug: string) => VIDEO[slug];

export function BlogKapak({ y, className, buyuk, oynat }: { y: BlogYazi; className?: string; buyuk?: boolean; kucuk?: boolean; oynat?: boolean }) {
  const v = useRef<HTMLVideoElement>(null);
  const e = EKRAN[y.slug], video = VIDEO[y.slug];

  if (e) {
    return (
      <div className={cn("relative h-full w-full overflow-hidden bg-[#0e0f11]", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={e.zemin} alt="" loading="lazy" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl saturate-[1.4]" />
        <span aria-hidden className="absolute inset-0 bg-[linear-gradient(160deg,rgba(11,11,13,0.1),rgba(11,11,13,0.55))]" />
        <div className={cn("absolute overflow-hidden rounded-[10px] bg-[#0b0b0d] ring-1 ring-white/20 transition-transform duration-700 ease-out group-hover:-translate-y-1.5 group-hover:translate-x-[-6px]",
          buyuk ? "left-[9%] top-[12%] w-[96%] rounded-[14px]" : "left-[10%] top-[14%] w-[100%]")}>
          <div className="flex h-[7%] min-h-[10px] items-center gap-1 bg-white/[0.06] px-2">
            {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/30" />)}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.ekran} alt={`${y.baslik} — Vayra arayüzü`} loading="lazy" className="block aspect-[16/10] w-full object-cover object-top" />
        </div>
      </div>
    );
  }

  if (video) {
    return (
      <div className={cn("relative h-full w-full overflow-hidden bg-[#0e0f11]", className)}
        onMouseEnter={() => { if (!oynat) void v.current?.play().catch(() => {}); }}
        onMouseLeave={() => { if (!oynat && v.current) { v.current.pause(); v.current.currentTime = 0; } }}>
        <video ref={v} src={video} poster={y.kapak} muted loop playsInline autoPlay={oynat} preload="metadata"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={y.kapak} alt="" loading="lazy" className={cn("h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]", className)} />;
}
