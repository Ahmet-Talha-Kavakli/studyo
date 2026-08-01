"use client";

import { useState } from "react";
import { Heart, MessageCircle, Play, Images } from "lucide-react";
import { onizlemeArka } from "@/lib/utils";
import { sayiKisa } from "@/lib/flow/cekirdek";
import { type FlowGonderi } from "@/lib/flow/seed";
import { YorumModal } from "./YorumModal";
import { cn } from "./UI";

/** Profil gönderi grid'i (3 sütun) — tıklayınca yorum/detay modalı. */
export function ProfilGrid({ gonderiler, bosMesaj = "Henüz gönderi yok" }: { gonderiler: FlowGonderi[]; bosMesaj?: string }) {
  const [secili, setSecili] = useState<FlowGonderi | null>(null);
  if (gonderiler.length === 0) return <div className="py-16 text-center text-[14px] text-white/40">{bosMesaj}</div>;
  return (
    <>
      <div className="grid grid-cols-3 gap-0.5 md:gap-1">
        {gonderiler.map((g) => (
          <button key={g.id} onClick={() => setSecili(g)} className="group relative aspect-square overflow-hidden" style={{ background: onizlemeArka(g.medya[0].tohum, g.medya[0].kat) }}>
            {g.tur === "reels" && g.medya[0].video && <video src={`/gercek/preset-video/${g.medya[0].video}.mp4`} muted loop playsInline className="absolute inset-0 h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
            {g.tur === "reels" && <Play className="absolute right-1.5 top-1.5 h-4 w-4 fill-white text-white drop-shadow" />}
            {g.tur === "carousel" && <Images className="absolute right-1.5 top-1.5 h-4 w-4 text-white drop-shadow" />}
            <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold"><Heart className="h-4 w-4 fill-white" />{sayiKisa(g.begeni)}</span>
              <span className="flex items-center gap-1.5 text-[13px] font-semibold"><MessageCircle className="h-4 w-4 -scale-x-100 fill-white" />{sayiKisa(g.yorumSayisi)}</span>
            </div>
          </button>
        ))}
      </div>
      {secili && <YorumModal gonderi={secili} kapat={() => setSecili(null)} />}
    </>
  );
}
