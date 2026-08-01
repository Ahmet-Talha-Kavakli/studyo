"use client";

import { useState } from "react";
import {
  UserSquare, Smartphone, Maximize, PackageOpen, Mic, Footprints, Home,
  MicVocal, Camera, Sparkles, Wand2, Box, Refrigerator, Aperture,
  Clapperboard, Columns2, FileSearch, Shirt, Layers, Star, Video, Shuffle,
  Hammer, Music, VolumeX,
} from "lucide-react";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import {
  STIL_GRADYAN, STIL_GLIF_KOYU, type PazStil,
} from "@/lib/pazarlamaVeri";
import { onizlemeArka, saltUrl, cn } from "@/lib/utils";
import { pazArka } from "@/lib/gercekVeri";

/* ============================================================
   PAZARLAMA STİL KARTI — referanslar/marketing/anasayfa birebir.

   Anatomi (referans ölçüleri):
     panel r=20 · #151618 · 1px beyaz %6 · iç boşluk 16
     [marka şeridi]  ♪ Symphony  /  ◆ Vayra           (bazı kartlarda)
     3 dikey karo (9:16) · gap 8 · r=10
        → üzerine gelinen karoda: sağ üst sessize-al düğmesi
          + ortada beyaz "Yeniden Üret" butonu
     alt satır: 52px gradyan ikon kutusu · başlık/özet · lime "Dene"
   ============================================================ */

const IKONLAR: Record<string, typeof Home> = {
  "user-square": UserSquare, smartphone: Smartphone, maximize: Maximize,
  "package-open": PackageOpen, mic: Mic, footprints: Footprints, home: Home,
  "mic-vocal": MicVocal, camera: Camera, sparkles: Sparkles, "wand-2": Wand2,
  box: Box, refrigerator: Refrigerator, aperture: Aperture,
  clapperboard: Clapperboard, "columns-2": Columns2, "file-search": FileSearch,
  shirt: Shirt, layers: Layers, star: Star, video: Video, shuffle: Shuffle,
  hammer: Hammer,
};

export function PazStilKarti({ s, onSec }: { s: PazStil; onSec?: (slug: string) => void }) {
  const [uzerinde, setUzerinde] = useState<number | null>(null);
  const Ikon = IKONLAR[s.ikon] ?? Sparkles;
  const koyuGlif = STIL_GLIF_KOYU.includes(s.renk);

  /* Referansta "Dene"/"Yeniden Üret" ayrı sayfaya GİTMEZ — üstteki
     composer'ın stilini bu stile alır ve oraya kaydırır. */
  const ac = () => {
    onSec?.(s.slug);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="rounded-[20px] border border-white/[0.06] bg-[#151618]/85 p-4">
      {/* ── Ortak marka şeridi (referansta bazı kartlarda) ── */}
      {s.markaSerit && (
        <div className="mb-3 flex items-center gap-2 text-[15px] font-medium text-[#E4E5E7]">
          <Music className="h-[17px] w-[17px]" />
          Symphony
          <span className="px-1 text-[#5A5B60]">/</span>
          <VayraIsaret size={17} />
          Vayra
        </div>
      )}

      {/* ── 3'lü dikey karo ── */}
      <div className="grid grid-cols-3 gap-2">
        {s.tohumlar.map((t, i) => {
          const arka = pazArka(t, i === 1 ? "portre" : "urun");
          const url = saltUrl(arka);
          const aktif = uzerinde === i;
          return (
            <div key={t}
              onMouseEnter={() => setUzerinde(i)}
              onMouseLeave={() => setUzerinde(null)}
              className="relative aspect-[9/16] overflow-hidden rounded-[10px]">
              <span className="absolute inset-0" style={{ background: arka }} />
              {url && (
                <img src={url} alt="" loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500"
                  style={{ transform: aktif ? "scale(1.04)" : undefined }} />
              )}

              {aktif && (
                <>
                  {/* sessize al — sağ üst */}
                  <button
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Sesi kapat"
                    className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70">
                    <VolumeX className="h-[15px] w-[15px]" />
                  </button>
                  {/* Yeniden Üret — alt orta */}
                  <button onClick={ac}
                    className="absolute bottom-6 left-1/2 h-11 -translate-x-1/2 whitespace-nowrap rounded-[12px] bg-white px-5 text-[15px] font-semibold text-[#111] transition-transform hover:scale-[1.03]">
                    Yeniden Üret
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Alt satır ── */}
      <div className="mt-5 flex items-center gap-4">
        <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px]"
          style={{ background: STIL_GRADYAN[s.renk] }}>
          <Ikon className={cn("h-6 w-6", koyuGlif ? "text-[#1a2400]" : "text-white")} strokeWidth={1.9} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[20px] font-semibold text-[#F4F4F5]">{s.ad}</span>
          <span className="mt-1 block truncate text-[15px] text-[#9C9DA2]">{s.ozet}</span>
        </span>
        <button onClick={ac}
          className="hf-uret h-10 shrink-0 rounded-[10px] px-5 text-[16px]">
          Dene
        </button>
      </div>
    </div>
  );
}
