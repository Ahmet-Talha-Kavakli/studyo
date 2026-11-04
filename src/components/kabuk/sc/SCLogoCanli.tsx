"use client";

import { useEffect, useRef } from "react";

/* ============================================================
   CANLI LOGO — Claude'un çalışırken oynayan marka göstergesi.

   Kaynak videonun kendisi 1440×1440 / 7sn / 6.4MB'tı; her açılışta indirilemez.
   320px webm+mp4 (130KB/60KB) ve poster karesi (4KB) türetildi:
     · calisiyor=true  → video döngüde oynar
     · calisiyor=false → video duraklar (son karede kalır)
   Poster, video yüklenene kadar boşluk/atlama olmasın diye verilir.

   `boyut` px cinsindendir. Kullanım (kullanıcı kararı):
     · boş sohbet ekranında büyük
     · üretim sırasında çalışma bandında küçük
   · sohbette son yanıtın altında (yazarken canlı, bitince durgun) — 2026-10-26 kullanıcı kararı
   ============================================================ */
export function SCLogoCanli({
  boyut = 28, calisiyor = false, className,
}: { boyut?: number; calisiyor?: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (calisiyor) {
      // play() reddedilebilir (otomatik oynatma politikası) — sessizce yut.
      void v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [calisiyor]);

  return (
    <video
      ref={ref}
      width={boyut}
      height={boyut}
      muted
      loop
      playsInline
      preload="metadata"
      poster="/brand/vayra-logo-poster.webp"
      aria-hidden
      className={className}
      style={{
        width: boyut, height: boyut, objectFit: "contain", display: "block",
        /* Videonun arka planı OPAK SİYAH (mp4/webm alfa taşımıyor; bu ffmpeg
           derlemesi yuva420p üretemedi). Logo parlak neon olduğu için `screen`
           karışımı siyahı yok eder ve yalnızca ışık kalır.
           `brightness/contrast` ŞART: yalnız `screen` ile videonun sıkıştırma
           gürültüsü kalıyor ve zeminde hafif mavimsi bir KARE görünüyordu
           (ölçüm: kutu rgb(36,37,36) vs zemin rgb(35,34,33)). Kontrast artışı
           koyu gürültüyü tam siyaha bastırır, parlak logo etkilenmez. */
        mixBlendMode: "screen",
        filter: "brightness(1.08) contrast(1.35)",
      }}
    >
      <source src="/brand/vayra-logo-320.webm" type="video/webm" />
      <source src="/brand/vayra-logo-320.mp4" type="video/mp4" />
    </video>
  );
}
