"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Wand2 } from "lucide-react";
import { PROJE_KESFET, GALERI_HAVUZLARI } from "@/lib/kesfetVeri";
import { BolumBaslik, Kap, butonSinif, useHoverVideo } from "./ortak";
import { cn } from "@/lib/utils";

type Oge = { gorsel: string; video?: string; baslik?: string; yazar?: string; prompt?: string; tur: "gorsel" | "video" };

// İstemli proje kartları model havuzlarıyla serpiştirilir. Deterministik (SSR = istemci).
const GALERI: Oge[] = (() => {
  const istemli: Oge[] = PROJE_KESFET.map((p) => ({ gorsel: p.gorsel, baslik: p.baslik, yazar: p.yazar, prompt: p.prompt, tur: "gorsel" }));
  const diger: Oge[] = [];
  for (let i = 0; i < 2; i++) {
    for (const h of ["soulcinema", "pazarlama", "gptimage", "seedance"] as const) {
      diger.push({
        gorsel: GALERI_HAVUZLARI[h][i],
        video: h === "pazarlama" ? `/gercek/paz-video/gal-pazarlama-${i}.mp4` : undefined,
        tur: h === "pazarlama" ? "video" : "gorsel",
      });
    }
  }
  const sonuc: Oge[] = [];
  diger.forEach((o, i) => { if (i % 2 === 0 && istemli.length) sonuc.push(istemli.shift()!); sonuc.push(o); });
  return [...sonuc, ...istemli];
})();

/** Topluluk galerisi — masonry; "İstemi kullan" hero'daki kutuyu doldurur. */
export function Topluluk({ onIstem }: { onIstem: (metin: string) => void }) {
  const [filtre, setFiltre] = useState<"tumu" | "gorsel" | "video">("tumu");
  const liste = GALERI.filter((o) => filtre === "tumu" || o.tur === filtre);
  return (
    <section className="py-16 sm:py-20">
      <Kap>
        <BolumBaslik ust="Topluluk" baslik="Vayra'da bugün üretilenler."
          alt="Beğendiğin bir işin istemini tek tıkla al, kendi versiyonunu üret."
          sag={
            <div className="flex gap-1 rounded-full border border-white/[0.07] bg-yuzey p-1">
              {([["tumu", "Tümü"], ["gorsel", "Görsel"], ["video", "Video"]] as const).map(([id, ad]) => (
                <button key={id} onClick={() => setFiltre(id)}
                  className={cn("rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors", filtre === id ? "bg-white text-zemin" : "text-metin-2 hover:text-white")}>
                  {ad}
                </button>
              ))}
            </div>
          } />

        {/* Yükseklik sınırlı: galeri bir vitrin. */}
        <div className="relative max-h-[1100px] overflow-hidden sm:max-h-[1300px]">
          <div className="columns-2 gap-3 md:columns-3 xl:columns-4">
            {liste.map((o, i) => <Kart key={o.gorsel + i} oge={o} onIstem={onIstem} />)}
          </div>
          {/* Alt kenar zemine erir — masonry'nin düzensiz bitişini gizler */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-zemin via-zemin/80 to-transparent" />
        </div>
      </Kap>
    </section>
  );
}

function Kart({ oge, onIstem }: { oge: Oge; onIstem: (m: string) => void }) {
  const { ref, oynat, durdur } = useHoverVideo();
  return (
    <div className="group relative mb-3 break-inside-avoid overflow-hidden rounded-xl bg-yuzey-2"
      onMouseEnter={oge.video ? oynat : undefined} onMouseLeave={oge.video ? durdur : undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={oge.gorsel} alt={oge.baslik ?? ""} loading="lazy" className="block w-full transition-transform duration-700 group-hover:scale-[1.03]" />
      {oge.video && (
        <>
          <video ref={ref} src={oge.video} muted loop playsInline preload="none"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="absolute left-2.5 top-2.5 rounded-md bg-black/50 px-1.5 py-0.5 text-[10.5px] font-medium text-white/85 backdrop-blur">Video</span>
        </>
      )}
      {(oge.baslik || oge.prompt) && (
        // Fare: katman hover'da açılır, görünmezken tıklanamaz. Klavye: focus-within ile açılır.
        // Dokunmatik (pointer-coarse): hover yok — başlık + buton her zaman görünür, istem metni gizli.
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/20 to-transparent p-3.5 opacity-0 transition-opacity duration-200 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 pointer-coarse:pointer-events-auto pointer-coarse:via-transparent pointer-coarse:p-2.5 pointer-coarse:opacity-100">
          {oge.baslik && <p className="text-[14px] font-semibold text-white pointer-coarse:text-[12.5px]">{oge.baslik}</p>}
          {oge.yazar && <p className="text-[12px] text-white/60 pointer-coarse:hidden">@{oge.yazar}</p>}
          {oge.prompt && <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-snug text-white/55 pointer-coarse:hidden">{oge.prompt}</p>}
          {oge.prompt && (
            <button onClick={() => onIstem(oge.prompt!)}
              className="mt-2.5 flex w-fit items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[12px] font-semibold text-zemin transition-transform hover:scale-[1.03]">
              <Wand2 className="h-3.5 w-3.5" /> İstemi kullan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
