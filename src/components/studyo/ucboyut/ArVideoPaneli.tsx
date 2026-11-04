"use client";

/**
 * AR ve döner video paneli (sağdan açılır): QR ile telefonda AR önizleme bağlantısı ve sahnenin
 * tarayıcıda kaydedilen 360° döner videosu (MP4 ya da WebM, kredi düşmez).
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import qrcode from "qrcode-generator";
import { Copy, Download, Film, Loader2, Smartphone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { Segment } from "@/components/montaj/ui";

const YAY = { type: "spring", stiffness: 420, damping: 34 } as const;

function Kart({ baslik, ikon: I, sag, children }: { baslik: string; ikon: typeof Film; sag?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3.5 py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-metin"><I className="h-3.5 w-3.5" /></span>
        <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-metin">{baslik}</span>{sag}
      </div>
      {children}
    </section>
  );
}

export function ArVideoPaneli({ glb, ad, poster, onKapat, onVideo }: {
  glb: string; ad: string; poster?: string; onKapat: () => void;
  onVideo: (sn: number, ilerleme: (o: number) => void) => Promise<{ blob: Blob; uzanti: string } | null>;
}) {
  const adres = useMemo(() => {
    if (typeof location === "undefined") return "";
    const tam = glb.startsWith("/") ? `${location.origin}${glb}` : glb;
    return `${location.origin}/ar?glb=${encodeURIComponent(tam)}&ad=${encodeURIComponent(ad)}`;
  }, [glb, ad]);
  const yerel = typeof location !== "undefined" && /^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname);
  const qrYol = useMemo(() => {
    if (!adres) return { yol: "", n: 0 };
    const q = qrcode(0, "M"); q.addData(adres); q.make();
    const n = q.getModuleCount(); let yol = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) yol += `M${c},${r}h1v1h-1z`;
    return { yol, n };
  }, [adres]);

  const [sn, setSn] = useState(6);
  const [oran, setOran] = useState<number | null>(null);
  const [video, setVideo] = useState<{ url: string; uzanti: string } | null>(null);
  const kaydet = async () => {
    setOran(0); setVideo(null);
    const r = await onVideo(sn, setOran).catch(() => null);
    setOran(null);
    if (!r) return void toast.error("Video kaydedilemedi", { description: "Model sahnede yüklendikten sonra yeniden dene; tarayıcın video kaydını desteklemiyor olabilir." });
    setVideo({ url: URL.createObjectURL(r.blob), uzanti: r.uzanti });
    toast.success("Döner video hazır", { description: `${sn} saniye, 1080 × 1080` });
  };
  const indir = () => {
    if (!video) return;
    const a = document.createElement("a"); a.href = video.url; a.download = `${ad.replace(/[\\/:*?"<>|]+/g, "-")}-360.${video.uzanti}`; a.click();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-metin"><Smartphone className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1 leading-tight"><span className="block text-[15px] font-semibold text-metin">AR ve video</span><span className="block truncate text-[12px] text-metin-3">{ad}</span></span>
        <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition hover:bg-white/[0.06] hover:text-metin active:scale-90"><X className="h-4 w-4" /></button>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 [scrollbar-width:thin]">
        <Kart baslik="Telefonda odanda gör" ikon={Smartphone}>
          <div className="p-3">
            <div className="mx-auto w-[184px] rounded-[16px] bg-white p-3">
              {qrYol.n > 0 && <svg viewBox={`-1 -1 ${qrYol.n + 2} ${qrYol.n + 2}`} className="block h-auto w-full" shapeRendering="crispEdges" aria-label="AR önizleme QR kodu"><path d={qrYol.yol} fill="#0b0c0e" /></svg>}
            </div>
            <ol className="mt-3 space-y-1.5 text-[12.5px] text-metin-2">
              {["Telefon kamerasıyla kodu tara", "Odanda gör düğmesine bas", "Telefonu zeminde gezdir, model yerleşsin"].map((m, i) => (
                <li key={m} className="flex items-center gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-black">{i + 1}</span>{m}</li>
              ))}
            </ol>
            {yerel && <p className="mt-3 rounded-[12px] bg-amber-300/[0.08] px-3 py-2 text-[12px] leading-snug text-amber-200/90 ring-1 ring-inset ring-amber-300/20">Şu an yerel adrestesin; telefon bu bağlantıyı yalnız yayındaki sitede açabilir.</p>}
            <button onClick={() => void mesaj.kopyala(adres, "AR bağlantısı")} className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-white/[0.07] text-[13px] font-medium text-metin transition hover:bg-white/[0.12] active:scale-95"><Copy className="h-3.5 w-3.5" />Bağlantıyı kopyala</button>
          </div>
        </Kart>

        <Kart baslik="360° döner video" ikon={Film} sag={<span className="text-[11.5px] text-metin-3">Kredi düşmez</span>}>
          <div className="space-y-3 p-3">
            <div className="relative aspect-square overflow-hidden rounded-[14px] bg-black ring-1 ring-inset ring-white/[0.08]">
              {video ? <video src={video.url} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover" />
                // eslint-disable-next-line @next/next/no-img-element
                : poster ? <img src={poster} alt="" className="absolute inset-0 h-full w-full object-contain p-6 opacity-70" /> : null}
              {oran !== null && (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 text-[13px] font-medium text-white">
                  <Loader2 className="h-5 w-5 animate-spin" />Kaydediliyor, %{Math.round(oran * 100)}
                  <span className="h-1 w-32 overflow-hidden rounded-full bg-white/15"><motion.span className="block h-full rounded-full bg-white" animate={{ width: `${oran * 100}%` }} transition={{ duration: 0.2 }} /></span>
                </span>
              )}
            </div>
            <Segment etiket="Süre" deger={sn} onDegis={setSn} secenekler={[[4, "4 sn"], [6, "6 sn"], [10, "10 sn"]]} />
            <div className={cn("grid gap-2", video && "grid-cols-2")}>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => void kaydet()} disabled={oran !== null} transition={YAY}
                className={cn("flex h-10 items-center justify-center gap-1.5 rounded-full text-[13.5px] font-semibold transition disabled:opacity-60", video ? "bg-white/[0.07] text-metin hover:bg-white/[0.12]" : "bg-white text-black")}>
                {oran !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}{video ? "Yeniden kaydet" : "Videoyu kaydet"}
              </motion.button>
              {video && <button onClick={indir} className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-white text-[13.5px] font-semibold text-black transition active:scale-95"><Download className="h-4 w-4" />İndir</button>}
            </div>
            <p className="text-[12px] leading-snug text-metin-3">Sahnedeki görünüm, ışık ve arka planla kaydedilir; kayıt sırasında sekmeyi açık tut.</p>
          </div>
        </Kart>
      </div>
    </div>
  );
}
