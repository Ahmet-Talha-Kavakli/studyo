"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { onizlemeArka } from "@/lib/utils";
import { goreceKisa, sayiKisa, sayiTam } from "@/lib/flow/cekirdek";
import { kullaniciBul, type FlowGonderi } from "@/lib/flow/seed";
import { useFlow } from "@/store/useFlow";
import { toast } from "@/lib/toast";
import { Avatar, KullaniciAdi, cn } from "./UI";
import { GonderiMenu } from "./GonderiMenu";
import { TakipButon } from "./TakipButon";
import { SuperLikeButon } from "./SuperLike";

/** Feed gönderi kartı — Instagram birebir. Carousel, çift-tık beğeni, yorum, kaydet, paylaş. */
export function Gonderi({ g, onYorum }: { g: FlowGonderi; onYorum?: (g: FlowGonderi) => void }) {
  const s = useFlow();
  const sahip = kullaniciBul(g.sahipId)!;
  const [idx, setIdx] = useState(0);
  const [kalp, setKalp] = useState(false); // çift tık animasyonu
  const [menuAcik, setMenuAcik] = useState(false);
  const [sesKapali, setSesKapali] = useState(true);
  const sonTik = useRef(0);
  const begenili = s.begeniler[g.id];
  const kayitli = s.kaydedilenler[g.id];

  const cistTik = () => {
    const simdi = Date.now();
    if (simdi - sonTik.current < 300) { if (!begenili) s.begen(g.id); setKalp(true); setTimeout(() => setKalp(false), 700); }
    sonTik.current = simdi;
  };

  const paylas = () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/flow/gonderi/${g.id}`;
    navigator.clipboard?.writeText(url).then(() => toast.success("Bağlantı kopyalandı 🔗")).catch(() => toast.success("Bağlantı kopyalandı 🔗"));
  };
  const begeniSayi = g.begeni + (begenili ? 1 : 0);

  return (
    <article className="mx-auto mb-4 max-w-[470px] border-b border-white/[0.08] pb-3">
      {/* başlık */}
      <div className="flex items-center gap-2.5 px-1 py-2.5">
        <Avatar tohum={sahip.avatarTohum} ad={sahip.ad} boyut={34} story={sahip.hikayeVar} izlendi={!!s.izlenenStoryler[sahip.id]} />
        <div className="flex flex-1 items-center gap-1.5">
          <Link href={`/flow/u/${sahip.kadi}`}><KullaniciAdi kadi={sahip.kadi} onayli={sahip.onayli} className="text-[13.5px]" /></Link>
          {g.konum && <span className="text-[11px] text-white/50">· {g.konum}</span>}
          <span className="text-[13px] text-white/40">· {goreceKisa(g.zaman)}</span>
          <span className="flex items-center gap-1 text-[13px] text-white/40"><span>·</span><TakipButon kullaniciId={g.sahipId} kadi={sahip.kadi} boyut="feed" /></span>
        </div>
        <button onClick={() => setMenuAcik(true)} className="p-1 text-white/80 hover:text-white"><MoreHorizontal className="h-5 w-5" /></button>
      </div>

      {/* medya */}
      <div className="relative overflow-hidden rounded-md bg-[#111]" onDoubleClick={cistTik}>
        <div className="relative aspect-square w-full" style={{ background: onizlemeArka(g.medya[idx].tohum, g.medya[idx].kat) }}>
          {g.tur === "reels" && g.medya[idx].video && (
            <video src={`/gercek/preset-video/${g.medya[idx].video}.mp4`} autoPlay loop playsInline muted={sesKapali} className="absolute inset-0 h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          )}
          {/* çift tık kalbi */}
          {kalp && <Heart className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 animate-[kalpAt_0.7s_ease-out] fill-white text-white drop-shadow-lg" />}
          {/* carousel okları */}
          {g.medya.length > 1 && (
            <>
              {idx > 0 && <button onClick={() => setIdx(idx - 1)} className="absolute left-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-black"><ChevronLeft className="h-4 w-4" /></button>}
              {idx < g.medya.length - 1 && <button onClick={() => setIdx(idx + 1)} className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-black"><ChevronRight className="h-4 w-4" /></button>}
              <div className="absolute right-2.5 top-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium">{idx + 1}/{g.medya.length}</div>
            </>
          )}
          {g.tur === "reels" && <button onClick={() => setSesKapali((v) => !v)} className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60">{sesKapali ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>}
        </div>
        {/* carousel nokta göstergesi */}
        {g.medya.length > 1 && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {g.medya.map((_, i) => <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i === idx ? "bg-[#0095f6]" : "bg-white/40")} />)}
          </div>
        )}
      </div>

      {/* aksiyon çubuğu — hafif hover büyüme + tık geri-bildirim */}
      <div className="flex items-center gap-4 px-1 pt-3">
        <button onClick={() => s.begen(g.id)} className="transition-transform duration-150 hover:scale-110 active:scale-95">
          <Heart className={cn("h-6 w-6", begenili ? "fill-[#ff3040] text-[#ff3040]" : "text-white/90 hover:text-white/60")} />
        </button>
        <button onClick={() => onYorum?.(g)} className="transition-transform duration-150 hover:scale-110 active:scale-95"><MessageCircle className="h-6 w-6 -scale-x-100 hover:text-white/60" /></button>
        <button onClick={paylas} className="transition-transform duration-150 hover:scale-110 active:scale-95"><Send className="h-6 w-6 hover:text-white/60" /></button>
        <SuperLikeButon gonderiId={g.id} varyant="feed" />
        <button onClick={() => s.kaydet(g.id)} className="ml-auto transition-transform duration-150 hover:scale-110 active:scale-95">
          <Bookmark className={cn("h-6 w-6", kayitli ? "fill-white text-white" : "text-white/90 hover:text-white/60")} />
        </button>
      </div>

      {/* beğeni + açıklama + yorumlar */}
      <div className="px-1 pt-2.5">
        <div className="text-[14px] font-semibold">{sayiTam(begeniSayi)} beğenme</div>
        <div className="mt-1 text-[14px] leading-snug">
          <Link href={`/flow/u/${sahip.kadi}`} className="font-semibold">{sahip.kadi}</Link>{" "}
          <span className="text-white/90">{g.aciklama}</span>{" "}
          {g.hashtagler.map((h) => <Link key={h} href={`/flow/etiket/${h}`} className="text-[#e0f1ff]">#{h} </Link>)}
        </div>
        {g.yorumSayisi > 0 && <button onClick={() => onYorum?.(g)} className="mt-1 text-[14px] text-white/45">{sayiTam(g.yorumSayisi)} yorumun tümünü gör</button>}
        {g.ses && <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-white/70"><Volume2 className="h-3.5 w-3.5" /><span className="truncate">{g.ses}</span></div>}
        <div className="mt-1 text-[11px] uppercase tracking-wide text-white/35">{goreceKisa(g.zaman)} önce</div>
      </div>

      <GonderiMenu acik={menuAcik} kapat={() => setMenuAcik(false)} gonderi={g} />
      <style jsx>{`@keyframes kalpAt { 0% { transform: translate(-50%,-50%) scale(0); opacity: 0 } 15% { transform: translate(-50%,-50%) scale(1.2); opacity: 0.9 } 30% { transform: translate(-50%,-50%) scale(0.95) } 45% { transform: translate(-50%,-50%) scale(1) } 80% { opacity: 0.9 } 100% { opacity: 0; transform: translate(-50%,-50%) scale(1) } }`}</style>
    </article>
  );
}
