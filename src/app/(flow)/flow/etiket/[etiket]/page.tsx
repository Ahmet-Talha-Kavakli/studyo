"use client";

import { useMemo, useState, use } from "react";
import { Hash, Heart, MessageCircle, Play, Images } from "lucide-react";
import { onizlemeArka } from "@/lib/utils";
import { flowVeri, type FlowGonderi } from "@/lib/flow/seed";
import { sayiKisa } from "@/lib/flow/cekirdek";
import { useFlow } from "@/store/useFlow";
import { YorumModal } from "@/components/flow/YorumModal";
import { cn } from "@/components/flow/UI";

/** Hashtag sayfası — o etiketi içeren gönderiler (Instagram konu etiketi sayfası). */
export default function EtiketSayfa({ params }: { params: Promise<{ etiket: string }> }) {
  const { etiket } = use(params);
  const et = decodeURIComponent(etiket).replace("#", "");
  const s = useFlow();
  const e = flowVeri();
  const [secili, setSecili] = useState<FlowGonderi | null>(null);

  const gonderiler = useMemo(
    () => e.gonderiler.filter((g) => g.hashtagler.some((h) => h.toLowerCase() === et.toLowerCase()) && !s.gizlenenler[g.id] && !s.engellenenler[g.sahipId]),
    [e, et, s.gizlenenler, s.engellenenler],
  );
  const toplamBegeni = gonderiler.reduce((t, g) => t + g.begeni, 0);

  return (
    <div className="mx-auto max-w-[935px] px-4 py-8">
      {/* başlık */}
      <div className="mb-8 flex items-center gap-6">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-white/[0.06]"><Hash className="h-11 w-11" /></span>
        <div>
          <h1 className="text-[26px] font-bold">#{et}</h1>
          <div className="mt-1 text-[15px] text-white/60"><b className="text-white">{gonderiler.length}</b> gönderi · {sayiKisa(toplamBegeni)} beğeni</div>
        </div>
      </div>

      {gonderiler.length === 0 ? (
        <div className="py-20 text-center text-[15px] text-white/40">Bu etikette henüz gönderi yok.</div>
      ) : (
        <>
          <div className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-white/45">En çok beğenilenler</div>
          <div className="grid grid-cols-3 gap-0.5 md:gap-1">
            {gonderiler.map((g) => (
              <button key={g.id} onClick={() => setSecili(g)} className="group relative aspect-square overflow-hidden" style={{ background: onizlemeArka(g.medya[0].tohum, g.medya[0].kat) }}>
                {g.tur === "reels" && g.medya[0].video && <video src={`/gercek/preset-video/${g.medya[0].video}.mp4`} muted loop playsInline autoPlay className="absolute inset-0 h-full w-full object-cover" onError={(ev) => { ev.currentTarget.style.display = "none"; }} />}
                {g.tur === "reels" && <Play className="absolute right-2 top-2 h-4 w-4 fill-white text-white drop-shadow" />}
                {g.tur === "carousel" && <Images className="absolute right-2 top-2 h-4 w-4 text-white drop-shadow" />}
                <div className="absolute inset-0 flex items-center justify-center gap-5 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex items-center gap-1.5 font-semibold"><Heart className="h-5 w-5 fill-white" />{sayiKisa(g.begeni)}</span>
                  <span className="flex items-center gap-1.5 font-semibold"><MessageCircle className="h-5 w-5 -scale-x-100 fill-white" />{sayiKisa(g.yorumSayisi)}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
      {secili && <YorumModal gonderi={secili} kapat={() => setSecili(null)} />}
    </div>
  );
}
