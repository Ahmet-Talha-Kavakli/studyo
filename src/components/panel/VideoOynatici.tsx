"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Download, Volume2, VolumeX, Maximize, Captions, ChevronDown, Check } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/**
 * Gerçek video oynatıcı — Higgsfield birebir kontrol çubuğu.
 * Gerçek video URL'i varsa <video> ile oynatır; demo modda dekoratif ama
 * çalışan bir zaman çizgisi + hız + ses + TAM EKRAN (sadece video) kontrolleri.
 * Tam ekran YALNIZCA video kabına uygulanır (tüm sayfa değil).
 */
const HIZLAR = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75];

export function VideoOynatici({
  videoUrl,
  poster,
  baslik = "video",
}: {
  videoUrl?: string;
  poster?: string;
  baslik?: string;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const kapRef = useRef<HTMLDivElement | null>(null);
  const [oynat, setOynat] = useState(false);
  const [ilerleme, setIlerleme] = useState(0); // 0-100
  const [an, setAn] = useState(0);
  const [sure, setSure] = useState(0);
  const [sessiz, setSessiz] = useState(false);
  const [ses, setSes] = useState(1);
  const [hiz, setHiz] = useState(1);
  const [hizAcik, setHizAcik] = useState(false);
  const [zamanBicimAcik, setZamanBicimAcik] = useState(false);
  const [zamanBicim, setZamanBicim] = useState<"standart" | "kod">("standart");
  const [altyazi, setAltyazi] = useState(false);
  // m16: timeline hover mini-önizleme (Higgsfield birebir — imlecin olduğu anın
  // küçük kare önizlemesi + saniye etiketi).
  const [onizle, setOnizle] = useState<{ x: number; sn: number } | null>(null);
  const gercek = Boolean(videoUrl);

  // Gerçek video: metadata/timeupdate dinle.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const gun = () => { setAn(v.currentTime); setIlerleme(v.duration ? (v.currentTime / v.duration) * 100 : 0); };
    const yuk = () => setSure(v.duration || 0);
    const bit = () => { setOynat(false); setIlerleme(0); setAn(0); };
    v.addEventListener("timeupdate", gun);
    v.addEventListener("loadedmetadata", yuk);
    v.addEventListener("ended", bit);
    return () => { v.removeEventListener("timeupdate", gun); v.removeEventListener("loadedmetadata", yuk); v.removeEventListener("ended", bit); };
  }, [videoUrl]);

  // Demo mod: oynarken sahte ilerleme (10 sn döngü).
  useEffect(() => {
    if (gercek || !oynat) return;
    const t = setInterval(() => setIlerleme((p) => (p >= 100 ? 0 : p + 1)), 100);
    return () => clearInterval(t);
  }, [gercek, oynat]);

  const cal = () => {
    if (!gercek) { setOynat((v) => !v); return; }
    const v = ref.current; if (!v) return;
    if (oynat) { v.pause(); setOynat(false); }
    else { v.play().catch(() => toast.error("Video oynatılamadı.")); setOynat(true); }
  };

  const sar = (e: React.MouseEvent<HTMLDivElement>) => {
    const kutu = e.currentTarget.getBoundingClientRect();
    const oran = Math.min(1, Math.max(0, (e.clientX - kutu.left) / kutu.width));
    if (gercek && ref.current && sure) ref.current.currentTime = oran * sure;
    else setIlerleme(oran * 100);
  };

  const sesDegis = (v: number) => {
    setSes(v); setSessiz(v === 0);
    if (ref.current) { ref.current.volume = v; ref.current.muted = v === 0; }
  };
  const sessizToggle = () => {
    const yeni = !sessiz; setSessiz(yeni);
    if (ref.current) ref.current.muted = yeni;
  };
  const hizSec = (h: number) => {
    setHiz(h); setHizAcik(false);
    if (ref.current) ref.current.playbackRate = h;
  };

  // TAM EKRAN — yalnızca video kabı (tüm sayfa değil).
  const tamEkran = () => {
    const el = kapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen?.().catch(() => toast.error("Tam ekran açılamadı."));
  };

  // Zaman biçimi — Higgsfield birebir: Standart "1:23" veya Zaman-kodu "00:01:23:456"
  const zamanYaz = (s: number) => {
    if (zamanBicim === "kod") {
      const sa = Math.floor(s / 3600), dk2 = Math.floor((s % 3600) / 60), sn = Math.floor(s % 60), ms = Math.floor((s % 1) * 1000);
      return `${String(sa).padStart(2, "0")}:${String(dk2).padStart(2, "0")}:${String(sn).padStart(2, "0")}:${String(ms).padStart(3, "0")}`;
    }
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };
  const gosterSure = gercek ? sure : 10; // demo: 10 sn
  const gosterAn = gercek ? an : (ilerleme / 100) * 10;

  return (
    <div ref={kapRef} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-ink-950">
      <div className="relative aspect-video w-full bg-black">
        {gercek ? (
          <video
            ref={ref}
            src={videoUrl}
            poster={poster}
            playsInline
            onClick={cal}
            onPlay={() => setOynat(true)}
            onPause={() => setOynat(false)}
            className="h-full w-full object-contain"
          />
        ) : (
          <button
            onClick={cal}
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: poster ? `center/cover url(${poster})` : "linear-gradient(135deg,#1a1725,#12101a)" }}
          >
            <motion.span
              animate={oynat ? { scale: [1, 1.12, 1], opacity: [1, 0.6, 1] } : { scale: 1, opacity: 1 }}
              transition={{ repeat: oynat ? Infinity : 0, duration: 1.4 }}
              className="flex h-16 w-16 items-center justify-center rounded-full glass-ikon "
            >
              {oynat ? <Pause className="h-7 w-7 fill-white text-white" /> : <Play className="h-7 w-7 translate-x-0.5 fill-white text-white" />}
            </motion.span>
            <span className="absolute right-3 top-3 rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-semibold text-white/60 backdrop-blur-sm">demo</span>
          </button>
        )}

        {/* Kontrol çubuğu — hover'da / durunca görünür (Higgsfield birebir) */}
        <div className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col gap-1.5 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2.5 pt-8 transition-opacity",
          oynat ? "opacity-0 group-hover:opacity-100" : "opacity-100",
        )}>
          {/* Zaman çizgisi — hover'da mini önizleme (m16 Higgsfield birebir) */}
          <div onClick={sar}
            onMouseMove={(e) => {
              const kutu = e.currentTarget.getBoundingClientRect();
              const oran = Math.min(1, Math.max(0, (e.clientX - kutu.left) / kutu.width));
              setOnizle({ x: e.clientX - kutu.left, sn: oran * gosterSure });
            }}
            onMouseLeave={() => setOnizle(null)}
            className="group/bar relative h-1.5 cursor-pointer rounded-full bg-white/25">
            <div className="absolute inset-y-0 left-0 rounded-full bg-aksan" style={{ width: `${ilerleme}%` }} />
            <div className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover/bar:opacity-100" style={{ left: `calc(${ilerleme}% - 6px)` }} />
            {/* mini önizleme kartı — imlecin olduğu an */}
            {onizle && (
              <div className="pointer-events-none absolute bottom-5 -translate-x-1/2" style={{ left: onizle.x }}>
                <div className="overflow-hidden rounded-lg border-2 border-white/70 bg-black shadow-xl" style={{ width: 74, height: 116 }}>
                  {poster
                    ? <div className="h-full w-full" style={{ background: `center/cover url(${poster})` }} />
                    : <div className="h-full w-full bg-gradient-to-br from-ink-800 to-ink-950" />}
                </div>
                <div className="mx-auto mt-1 w-fit rounded bg-black/85 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
                  {zamanYaz(onizle.sn)}
                </div>
              </div>
            )}
          </div>
          {/* Alt kontrol satırı */}
          <div className="flex items-center gap-2 text-white">
            <button onClick={cal} aria-label={oynat ? "Duraklat" : "Oynat"} className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/15">
              {oynat ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 translate-x-px fill-current" />}
            </button>
            {/* Hız — "Oynatma hızı" popover (Higgsfield birebir: 0.25–1.75 kaydırıcı) */}
            <div className="relative">
              <button onClick={() => { setHizAcik((v) => !v); setZamanBicimAcik(false); }} className="flex h-7 items-center gap-1 rounded-md border border-white/15 px-2 text-[12px] font-medium transition-colors hover:bg-white/15">
                {hiz}×
              </button>
              {hizAcik && (
                <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-white/12 bg-ink-900 p-3 shadow-2xl">
                  <p className="mb-2 text-[13px] font-semibold text-white">Oynatma hızı</p>
                  <div className="flex items-center justify-between text-[11px] text-white/50">
                    {HIZLAR.map((h) => (
                      <button key={h} onClick={() => hizSec(h)}
                        className={cn("rounded px-1 py-0.5 tabular-nums transition-colors hover:text-white", hiz === h ? "font-bold text-white" : "")}>{h}</button>
                    ))}
                  </div>
                  <input type="range" min={0} max={HIZLAR.length - 1} step={1} value={HIZLAR.indexOf(hiz)}
                    onChange={(e) => hizSec(HIZLAR[Number(e.target.value)])}
                    className="mt-1.5 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-aksan" aria-label="Hız" />
                </div>
              )}
            </div>
            {/* Ses */}
            <div className="flex items-center gap-1">
              <button onClick={sessizToggle} aria-label="Ses" className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/15">
                {sessiz || ses === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input type="range" min={0} max={1} step={0.05} value={sessiz ? 0 : ses}
                onChange={(e) => sesDegis(Number(e.target.value))}
                className="hidden h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/30 accent-aksan sm:block" aria-label="Ses seviyesi" />
            </div>
            {/* Zaman + biçim popover (Higgsfield birebir: Standart / Zaman-kodu) */}
            <div className="relative">
              <button onClick={() => { setZamanBicimAcik((v) => !v); setHizAcik(false); }} className="flex items-center gap-0.5 rounded-md px-1 text-[11px] tabular-nums text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                {zamanYaz(gosterAn)} / {zamanYaz(gosterSure)} <ChevronDown className="h-3 w-3" />
              </button>
              {zamanBicimAcik && (
                <div className="absolute bottom-full left-0 mb-2 w-52 rounded-xl border border-white/12 bg-ink-900 p-1.5 shadow-2xl">
                  <p className="px-2 py-1 text-[13px] font-semibold text-white">Zaman biçimi</p>
                  {([["standart", "Standart", "1:23"], ["kod", "Zaman-kodu", "00:01:23:456"]] as const).map(([id, ad, ornek]) => (
                    <button key={id} onClick={() => { setZamanBicim(id); setZamanBicimAcik(false); }}
                      className={cn("flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/8", zamanBicim === id && "bg-white/[0.06]")}>
                      <span className="text-[13px] text-white/90">{ad}</span>
                      <span className="flex items-center gap-1.5"><span className="text-[11px] tabular-nums text-white/40">{ornek}</span>{zamanBicim === id && <Check className="h-3.5 w-3.5 text-aksan" />}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="ml-auto flex items-center gap-1">
              {/* Altyazı (Higgsfield birebir) */}
              <button onClick={() => setAltyazi((v) => !v)} aria-label="Altyazı" className={cn("flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/15", altyazi && "text-aksan")}><Captions className="h-4 w-4" /></button>
              <button onClick={indirVideo} aria-label="İndir" className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/15"><Download className="h-4 w-4" /></button>
              <button onClick={tamEkran} aria-label="Tam ekran (video)" className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/15"><Maximize className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function indirVideo() {
    if (!videoUrl) return toast.info("Demo çıktı — gerçek video için anahtar ekle.");
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `${baslik.replace(/[^\wğüşiöçİĞÜŞÖÇ -]/gi, "").slice(0, 40) || "vayra-video"}.mp4`;
    a.target = "_blank";
    document.body.appendChild(a); a.click(); a.remove();
    toast.success("Video indiriliyor 🎬");
  }
}
