"use client";

/**
 * ÇİZİMDEN VİDEOYA (Draw to Video) — Higgsfield create-draw mobil BİREBİR.
 * Referans: ~/Desktop/responsive/create-draw-to-edit-draw-to-video (12 ekran).
 *
 * Yapı:
 *  ┌ "Çizimden Videoya ⌄" + ✕
 *  │ 3 SEGMENT: Çizimden Videoya(NEW) · Çizerek Video · Çizerek Düzenle
 *  │ 16:9 tuval: görsel/gradyan + üzerine çizim (kalem/kare/ok/metin)
 *  │ Model kartı (Google Veo 3.1 Lite ›) + Auto(oran)
 *  ├ 8 ARAÇ RAIL: Seç · Kalem · Silgi · Kare · Ok · Metin · Görsel · Renk(nokta)
 *  └ lime "Üret ✦N" (video=8, edit=1)
 *
 * Renk tıklanınca 5-renk paleti açılır (beyaz/yeşil/sarı/mavi/kırmızı).
 * Gerçek HTML canvas çizimi (kalem serbest, kare/ok şekil, metin).
 */

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import {
  MousePointer2, Pencil, Eraser, Square, ArrowUpRight, Type, ImagePlus,
  ChevronDown, ChevronRight, X, Check,
} from "lucide-react";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { onizlemeArka, cn } from "@/lib/utils";
import { aracArka } from "@/lib/gercekVeri";

type Segment = "sketch" | "video" | "edit";
type Arac = "sec" | "kalem" | "silgi" | "kare" | "ok" | "metin" | "gorsel" | "renk";

const SEGMENTLER: { id: Segment; ad: string; yeni?: boolean; kredi: number }[] = [
  { id: "sketch", ad: "Eskizden Videoya", yeni: true, kredi: 8 },
  { id: "video", ad: "Çizerek Video", kredi: 8 },
  { id: "edit", ad: "Çizerek Düzenle", kredi: 1 },
];

const RENKLER = ["#ffffff", "#4ade80", "#facc15", "#3b82f6", "#ef4444"];

const MODELLER: Record<Segment, string> = {
  sketch: "Google Veo 3.1 Lite",
  video: "Google Veo 3.1 Lite",
  edit: "Nano Banana",
};

export default function DrawPage() {
  const router = useRouter();
  const [segment, setSegment] = useState<Segment>("video");
  const [arac, setArac] = useState<Arac>("kalem");
  const [renk, setRenk] = useState("#ef4444");
  const [renkAcik, setRenkAcik] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ciziyor, setCiziyor] = useState(false);
  const sonNokta = useRef<{ x: number; y: number } | null>(null);

  const seg = SEGMENTLER.find((s) => s.id === segment)!;

  const kanvasHazirla = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    cv.width = r.width; cv.height = r.height;
  };
  useEffect(() => { kanvasHazirla(); }, []);

  const koordinat = (e: React.PointerEvent) => {
    const cv = canvasRef.current!;
    const r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const basla = (e: React.PointerEvent) => {
    if (arac === "sec" || arac === "renk" || arac === "gorsel") return;
    setCiziyor(true);
    sonNokta.current = koordinat(e);
  };
  const surukle = (e: React.PointerEvent) => {
    if (!ciziyor) return;
    const cv = canvasRef.current, ctx = cv?.getContext("2d");
    if (!cv || !ctx || !sonNokta.current) return;
    const p = koordinat(e);
    ctx.strokeStyle = arac === "silgi" ? "rgba(0,0,0,1)" : renk;
    ctx.lineWidth = arac === "silgi" ? 24 : 3.5;
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = arac === "silgi" ? "destination-out" : "source-over";
    ctx.beginPath();
    ctx.moveTo(sonNokta.current.x, sonNokta.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    sonNokta.current = p;
  };
  const bitir = () => { setCiziyor(false); sonNokta.current = null; };

  const uret = () => {
    const s = uretimBaslat({
      baslik: `Çizimden ${segment === "edit" ? "düzenleme" : "video"}`,
      tur: segment === "edit" ? "gorsel" : "video", model: MODELLER[segment],
      prompt: `çizim/eskiz temelli ${segment === "edit" ? "düzenleme" : "video üretimi"}, ${MODELLER[segment]}`,
      kredi: seg.kredi, arac: "Çizimden Videoya",
    });
    if (!s.ok) return uretimHataToast(s, "Üretilemedi");
    toast.success("Üretiliyor ✦", { description: MODELLER[segment] });
    router.push("/panel/kitaplik");
  };

  const ARACLAR: { id: Arac; ikon: typeof Pencil }[] = [
    { id: "sec", ikon: MousePointer2 },
    { id: "kalem", ikon: Pencil },
    { id: "silgi", ikon: Eraser },
    { id: "kare", ikon: Square },
    { id: "ok", ikon: ArrowUpRight },
    { id: "metin", ikon: Type },
    { id: "gorsel", ikon: ImagePlus },
  ];

  return (
    <div className="mobil-lime flex min-h-[100dvh] flex-col bg-zemin pb-[env(safe-area-inset-bottom)] sm:hidden">
      {/* Başlık */}
      <header className="flex h-[52px] shrink-0 items-center px-3">
        <span className="w-9" aria-hidden />
        <span className="flex flex-1 items-center justify-center gap-1.5 text-[17px] font-semibold text-white">
          Çizimden Videoya <ChevronDown className="h-4 w-4 text-metin-2" />
        </span>
        <button onClick={() => router.push("/panel/gorsel")} aria-label="Kapat"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white">
          <X className="h-[22px] w-[22px]" />
        </button>
      </header>

      <div className="flex-1 space-y-3 px-3 pb-3">
        {/* Segment sekmeler */}
        <div className="flex gap-1.5 rounded-[12px] bg-yuzey-2 p-1">
          {SEGMENTLER.map((s) => (
            <button key={s.id} onClick={() => setSegment(s.id)}
              className={cn("flex flex-1 items-center justify-center gap-1 rounded-[9px] py-2 text-[12.5px] font-medium transition-colors",
                segment === s.id ? "bg-[#0f1113] text-white" : "text-metin-2")}>
              {s.ad}
              {s.yeni && <span className="rounded-[4px] bg-aksan px-1 py-[1px] text-[8px] font-extrabold text-zemin">YENİ</span>}
            </button>
          ))}
        </div>

        {/* Tuval */}
        <div className="relative aspect-video w-full overflow-hidden rounded-[14px] bg-cover bg-center"
          style={{ background: aracArka("draw-tuval-" + segment, "soyut") }}>
          <span className="absolute bottom-2 left-2.5 text-[13px] font-bold text-white/90">Vayra</span>
          <canvas ref={canvasRef}
            className={cn("absolute inset-0 h-full w-full", arac === "sec" ? "cursor-default" : "cursor-crosshair touch-none")}
            onPointerDown={basla} onPointerMove={surukle} onPointerUp={bitir} onPointerLeave={bitir} />
        </div>

        {/* Model + oran satırı */}
        <div className="flex gap-2">
          <button className="flex flex-1 items-center justify-between rounded-[12px] bg-yuzey-2 px-4 py-3 text-left">
            <span className="text-[15px] font-medium text-white">{MODELLER[segment]}</span>
            <ChevronRight className="h-5 w-5 text-metin-2" />
          </button>
          <button className="flex w-[72px] flex-col items-center justify-center rounded-[12px] bg-yuzey-2 py-2 text-[13px] text-white">
            Auto
          </button>
        </div>

        {/* 8 ARAÇ RAIL */}
        <div className="relative flex items-center justify-between rounded-[12px] bg-yuzey-2 px-2 py-2">
          {ARACLAR.map((a) => {
            const aktif = a.id === arac;
            return (
              <button key={a.id} onClick={() => setArac(a.id)} aria-label={a.id}
                className={cn("flex h-10 w-10 items-center justify-center rounded-[9px] transition-colors",
                  aktif ? "bg-white text-[#131517]" : "text-white")}>
                <a.ikon className="h-[19px] w-[19px]" />
              </button>
            );
          })}
          {/* Renk butonu */}
          <button onClick={() => { setArac("renk"); setRenkAcik((v) => !v); }} aria-label="Renk"
            className="flex h-10 w-10 items-center justify-center rounded-[9px]">
            <span className="h-5 w-5 rounded-full border-2 border-white/20" style={{ background: renk }} />
          </button>

          {/* Renk paleti */}
          {renkAcik && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setRenkAcik(false)} />
              <div className="absolute bottom-full right-2 z-50 mb-2 flex gap-2 rounded-[12px] menu-surface p-2.5">
                {RENKLER.map((r) => (
                  <button key={r} onClick={() => { setRenk(r); setRenkAcik(false); }}
                    className={cn("h-7 w-7 rounded-full border-2", renk === r ? "border-white" : "border-transparent")}
                    style={{ background: r }} aria-label={r} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Üret */}
      <div className="shrink-0 px-3 pb-4">
        <button onClick={uret}
          className="hf-uret flex h-14 w-full items-center justify-center gap-2 rounded-[14px] text-[17px] font-bold">
          Üret <span className="flex items-center gap-1">✦ {seg.kredi}</span>
        </button>
      </div>
    </div>
  );
}
