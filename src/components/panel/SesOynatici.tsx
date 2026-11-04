"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Download } from "lucide-react";
import { toast } from "@/lib/toast";

/**
 * Gerçek ses oynatıcı — sesUrl (data:audio/... veya http URL) varsa gerçekten
 * çalar, ilerleme çubuğu sürülebilir, indirilebilir. sesUrl yoksa (demo)
 * dekoratif dalga animasyonu gösterir ve "demo" bilgisi verir.
 */
export function SesOynatici({
  sesUrl,
  baslik = "ses",
  vurgu = "emerald",
}: {
  sesUrl?: string;
  baslik?: string;
  vurgu?: "emerald" | "cyan";
}) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [oynat, setOynat] = useState(false);
  const [ilerleme, setIlerleme] = useState(0);
  const [sure, setSure] = useState(0);
  const [an, setAn] = useState(0);
  const renk = vurgu === "cyan" ? "bg-cyan-glow" : "bg-emerald-400";
  const renkText = vurgu === "cyan" ? "text-cyan-glow" : "text-emerald-400";
  const gercek = Boolean(sesUrl);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const guncelle = () => {
      setAn(a.currentTime);
      setIlerleme(a.duration ? (a.currentTime / a.duration) * 100 : 0);
    };
    const yukle = () => setSure(a.duration || 0);
    const bitti = () => {
      setOynat(false);
      setIlerleme(0);
      setAn(0);
    };
    a.addEventListener("timeupdate", guncelle);
    a.addEventListener("loadedmetadata", yukle);
    a.addEventListener("ended", bitti);
    return () => {
      a.removeEventListener("timeupdate", guncelle);
      a.removeEventListener("loadedmetadata", yukle);
      a.removeEventListener("ended", bitti);
    };
  }, [sesUrl]);

  const cal = () => {
    if (!gercek) {
      // Demo: gerçek ses yok — dekoratif oynat/durdur + bilgi.
      setOynat((v) => !v);
      if (!oynat) toast.info("Örnek ses çalınıyor", { description: "Bu bir önizleme. Gerçek ses için ElevenLabs anahtarı gerekli." });
      return;
    }
    const a = ref.current;
    if (!a) return;
    if (oynat) {
      a.pause();
      setOynat(false);
    } else {
      a.play().catch(() => toast.error("Ses oynatılamadı", { description: "Tarayıcı oynatmayı engelledi ya da dosyaya ulaşılamadı. Yeniden dene." }));
      setOynat(true);
    }
  };

  const sar = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gercek || !ref.current || !sure) return;
    const kutu = e.currentTarget.getBoundingClientRect();
    const oran = (e.clientX - kutu.left) / kutu.width;
    ref.current.currentTime = oran * sure;
  };

  const indir = () => {
    if (!sesUrl) return toast.info("Örnek ses indirilemez", { description: "Bu bir önizleme. Gerçek üretim için sağlayıcı anahtarı gerekli." });
    const a = document.createElement("a");
    a.href = sesUrl;
    a.download = `${baslik.replace(/[^\wğüşiöçİĞÜŞÖÇ -]/gi, "").slice(0, 40) || "vayra-ses"}.mp3`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("Ses indiriliyor", { description: a.download });
  };

  const dk = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="glass flex items-center gap-4 rounded-2xl p-4">
      {gercek && <audio ref={ref} src={sesUrl} preload="metadata" />}
      <button
        onClick={cal}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${renk} text-ink-950 transition-transform hover:scale-105`}
        aria-label={oynat ? "Duraklat" : "Oynat"}
      >
        {oynat ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
      </button>

      <div className="min-w-0 flex-1">
        {gercek ? (
          <>
            <div
              onClick={sar}
              className="group relative h-2 cursor-pointer rounded-full bg-white/10"
            >
              <div className={`absolute inset-y-0 left-0 rounded-full ${renk}`} style={{ width: `${ilerleme}%` }} />
              <div
                className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full ${renk} opacity-0 transition-opacity group-hover:opacity-100`}
                style={{ left: `calc(${ilerleme}% - 6px)` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-white/45">
              <span>{dk(an)}</span>
              <span className={renkText}>● canlı çıktı</span>
              <span>{dk(sure)}</span>
            </div>
          </>
        ) : (
          <div className="flex h-10 items-center gap-1">
            {Array.from({ length: 44 }).map((_, i) => {
              const h = 14 + Math.abs(Math.sin(i * 0.5)) * 40 + (i % 3) * 6;
              return (
                <motion.span
                  key={i}
                  className={`w-1 rounded-full ${renk} opacity-70`}
                  animate={oynat ? { height: [h * 0.4, h, h * 0.4] } : { height: h * 0.5 }}
                  transition={{ repeat: oynat ? Infinity : 0, duration: 0.8, delay: i * 0.02 }}
                  style={{ height: h * 0.5 }}
                />
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={indir}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/8 hover:text-white"
        title="Sesi indir"
        aria-label="İndir"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}
