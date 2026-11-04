"use client";

import { Yuzen } from "@/components/ui/Yuzen";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Box, Download, RotateCw, ChevronDown, Check } from "lucide-react";
import { toast } from "@/lib/toast";

// model-viewer web bileşeni tipini React JSX'e tanıt.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        poster?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "shadow-intensity"?: string;
        exposure?: string;
        ar?: boolean;
      };
    }
  }
}

/**
 * Gerçek 3D model görüntüleyici. Meshy'nin döndürdüğü GLB URL'i varsa
 * <model-viewer> ile GERÇEK 3D render eder (döndür/zoom/AR). GLB yoksa
 * thumbnail; o da yoksa dekoratif dönen küp + "demo" bilgisi.
 */
export function ModelGoruntuleyici({
  glbUrl,
  thumbnail,
  baslik = "3D model",
  gercek,
}: {
  glbUrl?: string;
  thumbnail?: string;
  baslik?: string;
  gercek?: boolean;
}) {
  const [yuklendi, setYuklendi] = useState(false);
  const [aktifAci, setAktifAci] = useState("Perspektif");
  const [formatMenu, setFormatMenu] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const mvRef = useRef<HTMLElement | null>(null);

  const formatlar = ["GLB", "FBX", "OBJ", "USDZ", "STL"];

  // Çoklu-açı önizleme: model-viewer camera-orbit ile gerçek kamera açısı.
  const acilar: { ad: string; orbit: string }[] = [
    { ad: "Ön", orbit: "0deg 90deg 105%" },
    { ad: "Yan", orbit: "90deg 90deg 105%" },
    { ad: "Üst", orbit: "0deg 5deg 105%" },
    { ad: "Perspektif", orbit: "35deg 70deg 110%" },
  ];
  const aciSec = (ad: string, orbit: string) => {
    setAktifAci(ad);
    const mv = mvRef.current as unknown as { cameraOrbit?: string } | null;
    if (mv) mv.cameraOrbit = orbit;
  };

  // model-viewer'ı yalnızca istemcide ve GLB varsa dinamik yükle.
  useEffect(() => {
    if (!glbUrl) return;
    let iptal = false;
    import("@google/model-viewer")
      .then(() => !iptal && setYuklendi(true))
      .catch(() => toast.error("3D görüntüleyici yüklenemedi", { description: "Bağlantını kontrol edip sayfayı yenile." }));
    return () => {
      iptal = true;
    };
  }, [glbUrl]);

  const indir = (format = "GLB") => {
    if (!glbUrl) return toast.info("Örnek model indirilemez", { description: "Bu bir önizleme. Gerçek GLB için Meshy anahtarı gerekli." });
    const ad = baslik.replace(/[^\wğüşiöçİĞÜŞÖÇ -]/gi, "").slice(0, 40) || "vayra-model";
    const a = document.createElement("a");
    a.href = glbUrl;
    a.download = `${ad}.${format.toLowerCase()}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(`Model ${format} olarak indiriliyor`, { description: `${ad}.${format.toLowerCase()}` });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-950" ref={ref}>
      <div className="relative aspect-square w-full">
        {glbUrl && yuklendi ? (
          // @ts-expect-error — model-viewer özel elementi
          <model-viewer
            ref={mvRef}
            src={glbUrl}
            alt={baslik}
            poster={thumbnail}
            camera-controls
            shadow-intensity="1"
            exposure="1"
            ar
            style={{ width: "100%", height: "100%", background: "transparent" }}
          />
        ) : thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail} alt={baslik} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-cyan-glow/10 via-ink-900 to-ink-950">
            <motion.div
              animate={{ rotateY: 360, rotateX: [0, 12, 0] }}
              transition={{ rotateY: { repeat: Infinity, duration: 6, ease: "linear" }, rotateX: { repeat: Infinity, duration: 3 } }}
              style={{ transformStyle: "preserve-3d" }}
              className="relative"
            >
              <Box className="h-20 w-20 text-cyan-glow/80" strokeWidth={1} />
            </motion.div>
          </div>
        )}

        {/* Durum rozeti */}
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-ink-950/70 px-2 py-1 text-[11px] font-medium backdrop-blur-sm">
          <Box className="h-3 w-3" /> 3D
        </span>
        {gercek === false && (
          <span className="absolute right-3 top-3 rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-semibold text-white/60 backdrop-blur-sm">
            demo
          </span>
        )}
        {glbUrl && yuklendi && (
          <>
            <span className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-cyan-glow/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-glow backdrop-blur-sm">
              <RotateCw className="h-2.5 w-2.5" /> döndürmek için sürükle
            </span>
            {/* Çoklu-açı önizleme kontrolleri */}
            <div className="absolute bottom-3 right-3 flex gap-1">
              {acilar.map((a) => (
                <button key={a.ad} onClick={() => aciSec(a.ad, a.orbit)}
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm transition-colors ${aktifAci === a.ad ? "bg-cyan-glow text-ink-950" : "bg-ink-950/60 text-white/70 hover:bg-ink-950/80"}`}>
                  {a.ad}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-white/10 p-3">
        <span className="truncate text-sm font-medium">{baslik}</span>
        <div className="relative shrink-0">
          <button
            onClick={() => (glbUrl ? setFormatMenu((v) => !v) : indir())}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-xs transition-colors hover:bg-white/8"
          >
            <Download className="h-3.5 w-3.5" /> {glbUrl ? "Format indir" : "İndir"}
            {glbUrl && <ChevronDown className={`h-3 w-3 transition-transform ${formatMenu ? "rotate-180" : ""}`} />}
          </button>
          <Yuzen acik={!!(formatMenu)} onKapat={() => setFormatMenu(false)} alt={"tam"} sag={0} bosluk={4} className="menu-surface w-32 rounded-xl p-1.5">
                {formatlar.map((f) => (
                  <button key={f} onClick={() => { indir(f); setFormatMenu(false); }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-white/8">
                    {f}
                    {f === "GLB" && <Check className="h-3.5 w-3.5 text-cyan-glow" />}
                  </button>
                ))}
              </Yuzen>
        </div>
      </div>
    </div>
  );
}
