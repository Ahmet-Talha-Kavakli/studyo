"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Eraser, Undo2, Trash2, Sparkles, Pencil } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const RENKLER = ["#ffffff", "#22d3ee", "#f43f5e", "#facc15", "#4ade80", "#a78bfa", "#000000"];

/**
 * Çizim tuvali — Higgsfield "Draw to Edit / Draw to Video" karşılığı.
 * Gerçek çalışan canvas: fırça/silgi, renk, kalınlık, geri al, temizle.
 * "Bu çizimi kullan" → data-URL referans olarak prompt'a döner.
 */
export function CizimTuvali({ onKapat, onKullan }: { onKapat: () => void; onKullan: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ciziyor = useRef(false);
  const [renk, setRenk] = useState("#22d3ee");
  const [kalinlik, setKalinlik] = useState(6);
  const [silgi, setSilgi] = useState(false);
  const gecmis = useRef<ImageData[]>([]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    // Tuval zemini — koyu, çizgiler net görünsün
    ctx.fillStyle = "#0b0b12";
    ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  const konum = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };

  const basla = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    // Geri al için anlık görüntü sakla (son 20 adım)
    gecmis.current.push(ctx.getImageData(0, 0, c.width, c.height));
    if (gecmis.current.length > 20) gecmis.current.shift();
    ciziyor.current = true;
    const { x, y } = konum(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    c.setPointerCapture(e.pointerId);
  };

  const ciz = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ciziyor.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = konum(e);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = silgi ? kalinlik * 3 : kalinlik;
    ctx.strokeStyle = silgi ? "#0b0b12" : renk;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const bitir = () => { ciziyor.current = false; };

  const geriAl = () => {
    const c = canvasRef.current!;
    const onceki = gecmis.current.pop();
    if (!onceki) return toast("Geri alınacak adım yok");
    c.getContext("2d")!.putImageData(onceki, 0, 0);
  };

  const temizle = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    gecmis.current.push(ctx.getImageData(0, 0, c.width, c.height));
    ctx.fillStyle = "#0b0b12";
    ctx.fillRect(0, 0, c.width, c.height);
  };

  const kullan = () => {
    const c = canvasRef.current!;
    onKullan(c.toDataURL("image/png"));
  };

  const aracBtn = "flex h-9 w-9 items-center justify-center rounded-lg transition-colors";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ink-950/85 backdrop-blur-md" onClick={onKapat} />

      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        className="menu-surface relative flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl">
        {/* Başlık */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Pencil className="h-4.5 w-4.5 text-cyan-glow" /> Çizerek anlat
          </h2>
          <button onClick={onKapat} className="text-white/50 transition-colors hover:text-white" aria-label="Kapat">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tuval */}
        <div className="p-4">
          <canvas
            ref={canvasRef}
            width={880}
            height={495}
            onPointerDown={basla}
            onPointerMove={ciz}
            onPointerUp={bitir}
            onPointerLeave={bitir}
            className="w-full cursor-crosshair touch-none rounded-2xl border border-white/10"
          />
        </div>

        {/* Araç çubuğu */}
        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 p-4">
          {/* Fırça / silgi */}
          <div className="flex gap-1 rounded-xl bg-white/5 p-1">
            <button onClick={() => setSilgi(false)} title="Fırça"
              className={cn(aracBtn, !silgi ? "bg-white/12 text-white" : "text-white/50 hover:text-white")}>
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => setSilgi(true)} title="Silgi"
              className={cn(aracBtn, silgi ? "bg-white/12 text-white" : "text-white/50 hover:text-white")}>
              <Eraser className="h-4 w-4" />
            </button>
          </div>

          {/* Renkler */}
          <div className="flex gap-1.5">
            {RENKLER.map((r) => (
              <button key={r} onClick={() => { setRenk(r); setSilgi(false); }} title={r}
                style={{ background: r }}
                className={cn("h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                  renk === r && !silgi ? "border-white" : "border-white/20")} />
            ))}
          </div>

          {/* Kalınlık */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/45">Kalınlık</span>
            <input type="range" min={2} max={24} value={kalinlik} onChange={(e) => setKalinlik(Number(e.target.value))}
              className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-white/15 accent-cyan-glow" />
          </div>

          {/* Geri al / temizle */}
          <button onClick={geriAl} title="Geri al"
            className={cn(aracBtn, "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white")}>
            <Undo2 className="h-4 w-4" />
          </button>
          <button onClick={temizle} title="Temizle"
            className={cn(aracBtn, "bg-white/5 text-white/60 hover:bg-rose-500/15 hover:text-rose-400")}>
            <Trash2 className="h-4 w-4" />
          </button>

          {/* Kullan */}
          <button onClick={kullan}
            className="ml-auto flex items-center gap-2 rounded-xl bg-cyan-glow px-4 py-2.5 text-sm font-bold text-ink-950 transition-all hover:brightness-110 active:scale-[0.97]">
            <Sparkles className="h-4 w-4" /> Bu çizimi kullan
          </button>
        </div>
      </motion.div>
    </div>
  );
}
