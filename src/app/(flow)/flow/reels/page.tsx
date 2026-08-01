"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Music2, Volume2, VolumeX, ChevronUp, ChevronDown } from "lucide-react";
import { onizlemeArka } from "@/lib/utils";
import { sayiKisa } from "@/lib/flow/cekirdek";
import { flowVeri, kullaniciBul, gonderiSkor, type FlowGonderi } from "@/lib/flow/seed";
import { useFlow } from "@/store/useFlow";
import { toast } from "@/lib/toast";
import { Avatar, KullaniciAdi, cn } from "@/components/flow/UI";
import { ReelsYorumPanel } from "@/components/flow/ReelsYorumPanel";
import { GonderiMenu } from "@/components/flow/GonderiMenu";
import { TakipButon } from "@/components/flow/TakipButon";
import { SuperLikeButon } from "@/components/flow/SuperLike";

export default function ReelsSayfa() {
  const s = useFlow();
  const [sesKapali, setSesKapali] = useState(true);
  const [yorumGonderi, setYorumGonderi] = useState<FlowGonderi | null>(null);
  const kaydirRef = useRef<HTMLDivElement>(null);

  const reels = useMemo(() => {
    const e = flowVeri();
    return e.gonderiler.filter((g) => g.tur === "reels" && !s.gizlenenler[g.id] && !s.engellenenler[g.sahipId])
      .map((g) => ({ g, sk: gonderiSkor(g) })).sort((a, b) => b.sk - a.sk).map(({ g }) => g);
  }, [s.gizlenenler, s.engellenenler]);

  const kilitRef = useRef(false);

  // yukarı/aşağı ok — bir reel yüksekliği kadar kaydır
  const kaydir = (yon: 1 | -1) => {
    const el = kaydirRef.current; if (!el || kilitRef.current) return;
    kilitRef.current = true;
    el.scrollBy({ top: yon * el.clientHeight, behavior: "smooth" });
    setTimeout(() => { kilitRef.current = false; }, 550);
  };

  // fare tekerleği: her hareket TAM 1 video kaydırır (momentum atlamasını engelle)
  useEffect(() => {
    const el = kaydirRef.current; if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      if (kilitRef.current) return;
      if (Math.abs(e.deltaY) < 8) return;
      kaydir(e.deltaY > 0 ? 1 : -1);
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
    // eslint-disable-next-line
  }, []);

  return (
    <div className="relative flex h-[calc(100vh-56px)] justify-center md:h-screen">
      {/* kaydırılabilir reel kolonu — her scroll'da TEK video (snap-stop always) + yumuşak geçiş */}
      <div ref={kaydirRef} className={cn("reels-kaydir h-full snap-y snap-mandatory overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", !!yorumGonderi && "lg:mr-[400px]")}>
        {reels.map((g) => <ReelKart key={g.id} g={g} sesKapali={sesKapali} setSesKapali={setSesKapali} onYorum={setYorumGonderi} />)}
      </div>

      {/* REELS YAN YORUM PANELİ (video sağında, Instagram birebir) */}
      {yorumGonderi && (
        <div className="fixed right-0 top-0 z-30 hidden h-screen w-[400px] p-3 lg:block animate-[panelGir_0.28s_cubic-bezier(0.16,1,0.3,1)]">
          <ReelsYorumPanel gonderi={yorumGonderi} kapat={() => setYorumGonderi(null)} />
        </div>
      )}
      {/* mobilde tam ekran alt sheet */}
      {yorumGonderi && (
        <div className="fixed inset-x-0 bottom-0 z-40 h-[70vh] lg:hidden">
          <ReelsYorumPanel gonderi={yorumGonderi} kapat={() => setYorumGonderi(null)} />
        </div>
      )}
      <style jsx global>{`
        .reels-kaydir { scroll-behavior: smooth; -webkit-overflow-scrolling: touch; }
        /* her scroll = tek video: snap noktasında zorunlu durur, atlamaz */
        .reels-kaydir > div { scroll-snap-align: center; scroll-snap-stop: always; }
        @keyframes panelGir { from { transform: translateX(24px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
      `}</style>

      {/* sağ üst yukarı/aşağı ok butonları (Instagram) — yorum açıkken gizle */}
      {!yorumGonderi && (
        <div className="pointer-events-none absolute inset-y-0 right-4 hidden flex-col items-center justify-center gap-3 md:flex">
          <button onClick={() => kaydir(-1)} className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:scale-105 hover:bg-white/20"><ChevronUp className="h-5 w-5" /></button>
          <button onClick={() => kaydir(1)} className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:scale-105 hover:bg-white/20"><ChevronDown className="h-5 w-5" /></button>
        </div>
      )}
    </div>
  );
}

function ReelKart({ g, sesKapali, setSesKapali, onYorum }: { g: FlowGonderi; sesKapali: boolean; setSesKapali: (v: boolean) => void; onYorum: (g: FlowGonderi) => void }) {
  const s = useFlow();
  const sahip = kullaniciBul(g.sahipId)!;
  const ref = useRef<HTMLVideoElement>(null);
  const [menu, setMenu] = useState(false);
  const begenili = s.begeniler[g.id];
  const kayitli = s.kaydedilenler[g.id];

  useEffect(() => {
    const v = ref.current; if (!v) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.6 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const ikonBtn = "flex flex-col items-center gap-1 transition-transform duration-150 hover:scale-110 active:scale-95";

  return (
    <div className="flex h-full snap-start items-center justify-center py-2">
      {/* VİDEO merkezde — Instagram: bilgi video-içi sol-alt, aksiyonlar video-içi sağ-alt */}
      <div className="relative h-full max-h-[880px] w-[calc((100vh-80px)*9/16)] max-w-[440px] overflow-hidden rounded-xl bg-[#0a0a0a]" style={{ background: onizlemeArka(g.medya[0].tohum, g.medya[0].kat) }}>
        {g.medya[0].video && (
          <video ref={ref} src={`/gercek/preset-video/${g.medya[0].video}.mp4`} loop playsInline muted={sesKapali} className="absolute inset-0 h-full w-full object-cover" onClick={() => setSesKapali(!sesKapali)} onError={(e) => { e.currentTarget.style.display = "none"; }} />
        )}

        {/* ses aç/kapa — sağ üst */}
        <button onClick={() => setSesKapali(!sesKapali)} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-transform hover:scale-110 active:scale-95">{sesKapali ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>

        {/* alt karartma degradesi */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* SOL-ALT bilgi bloğu (video İÇİNDE) — Instagram birebir */}
        <div className="absolute bottom-4 left-4 right-16 z-10">
          <div className="flex items-center gap-2.5">
            <Avatar tohum={sahip.avatarTohum} ad={sahip.ad} boyut={34} />
            <Link href={`/flow/u/${sahip.kadi}`}><KullaniciAdi kadi={sahip.kadi} onayli={sahip.onayli} className="text-[14px] text-white drop-shadow" /></Link>
            <span className="text-white/60">·</span>
            <TakipButon kullaniciId={g.sahipId} kadi={sahip.kadi} boyut="reels" />
          </div>
          <p className="mt-2.5 line-clamp-2 whitespace-pre-line text-[13.5px] leading-snug text-white drop-shadow">{g.aciklama}{" "}
            {g.hashtagler.map((h) => <Link key={h} href={`/flow/etiket/${h}`} className="text-[#e0f1ff]">#{h} </Link>)}
          </p>
          {g.ses && <div className="mt-2 flex items-center gap-1.5 text-[12px] text-white/90 drop-shadow"><Music2 className="h-3.5 w-3.5" /><span className="truncate">{g.ses}</span></div>}
        </div>

        {/* SAĞ-ALT aksiyon çubuğu (video İÇİNDE) — Instagram birebir, sayılar altında */}
        <div className="absolute bottom-4 right-3 z-10 flex flex-col items-center gap-4">
          <button onClick={() => s.begen(g.id)} className={ikonBtn}><Heart className={cn("h-7 w-7 drop-shadow", begenili ? "fill-[#ff3040] text-[#ff3040]" : "text-white")} /><span className="text-[12px] font-semibold text-white drop-shadow">{sayiKisa(g.begeni + (begenili ? 1 : 0))}</span></button>
          <button onClick={() => onYorum(g)} className={ikonBtn}><MessageCircle className="h-7 w-7 -scale-x-100 text-white drop-shadow" /><span className="text-[12px] font-semibold text-white drop-shadow">{sayiKisa(g.yorumSayisi)}</span></button>
          <button onClick={() => { const url = `${typeof window !== "undefined" ? window.location.origin : ""}/flow/gonderi/${g.id}`; navigator.clipboard?.writeText(url).then(() => toast.success("Bağlantı kopyalandı")).catch(() => toast.success("Bağlantı kopyalandı")); }} className={ikonBtn}><Send className="h-7 w-7 text-white drop-shadow" /><span className="text-[12px] font-semibold text-white drop-shadow">{sayiKisa(g.paylasim)}</span></button>
          <SuperLikeButon gonderiId={g.id} varyant="reels" />
          <button onClick={() => s.kaydet(g.id)} className="transition-transform duration-150 hover:scale-110 active:scale-95"><Bookmark className={cn("h-7 w-7 drop-shadow", kayitli ? "fill-white text-white" : "text-white")} /></button>
          <button onClick={() => setMenu(true)} className="transition-transform duration-150 hover:scale-110 active:scale-95"><MoreHorizontal className="h-7 w-7 text-white drop-shadow" /></button>
          <button onClick={() => { toast.success(g.ses ? `🎵 ${g.ses} — bu sesi kullanan içerikler` : "Orijinal ses"); }} className="mt-1 h-8 w-8 animate-[spin_4s_linear_infinite] overflow-hidden rounded-md border border-white/40" style={{ background: onizlemeArka(g.medya[0].tohum + "ses", g.medya[0].kat) }} aria-label="Ses" />
        </div>
      </div>

      <GonderiMenu acik={menu} kapat={() => setMenu(false)} gonderi={g} />
    </div>
  );
}
