"use client";

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Pencil, Eraser, Undo2, Redo2, Trash2, Minus, Plus } from "lucide-react";
import { cn, saltUrl } from "@/lib/utils";

/** Gömülebilir GERÇEK çizim tuvali (Higgsfield "Draw to Edit").
 * Kendi modal kabuğu YOK — bir modalın içine gömülür. Fare+dokunma çizimi,
 * kalem/silgi, renk, kalınlık, gerçek undo/redo. Ref: dataUrl()/bosMu()/temizle(). */
export interface CizimCanvasRef {
  dataUrl: () => string;
  bosMu: () => boolean;
  temizle: () => void;
}

type Arac = "kalem" | "silgi";
const RENKLER = ["#ffffff", "#55d6fd", "#f87171", "#60a5fa", "#34d399", "#fbbf24", "#c084fc", "#0a0a0b"];

export const CizimCanvas = forwardRef<CizimCanvasRef, { arka?: string; className?: string }>(
  function CizimCanvas({ arka, className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const ciziyor = useRef(false);
    const sonNokta = useRef<{ x: number; y: number } | null>(null);
    const gecmis = useRef<ImageData[]>([]);
    const ileri = useRef<ImageData[]>([]);
    const [arac, setArac] = useState<Arac>("kalem");
    const [renk, setRenk] = useState("#ffffff");
    const [kalinlik, setKalinlik] = useState(4);
    const [dolu, setDolu] = useState(false);
    const [, yenile] = useState(0);

    const kur = useCallback(() => {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = c.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const ctx = c.getContext("2d");
      const eski = c.width && ctx ? ctx.getImageData(0, 0, c.width, c.height) : null;
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(r.height * dpr);
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (eski) ctx.putImageData(eski, 0, 0);
      }
    }, []);

    useEffect(() => {
      kur();
      const ro = new ResizeObserver(() => kur());
      const c = canvasRef.current;
      if (c) ro.observe(c);
      return () => ro.disconnect();
    }, [kur]);

    const snapshotAl = () => {
      const c = canvasRef.current;
      const ctx = c?.getContext("2d");
      if (!c || !ctx) return;
      gecmis.current.push(ctx.getImageData(0, 0, c.width, c.height));
      if (gecmis.current.length > 40) gecmis.current.shift();
      ileri.current = [];
    };

    const konum = (e: React.PointerEvent) => {
      const c = canvasRef.current!;
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const uygulaStil = (ctx: CanvasRenderingContext2D) => {
      if (arac === "silgi") { ctx.globalCompositeOperation = "destination-out"; ctx.strokeStyle = "rgba(0,0,0,1)"; ctx.fillStyle = "rgba(0,0,0,1)"; }
      else { ctx.globalCompositeOperation = "source-over"; ctx.strokeStyle = renk; ctx.fillStyle = renk; }
    };

    const basla = (e: React.PointerEvent) => {
      const c = canvasRef.current;
      const ctx = c?.getContext("2d");
      if (!c || !ctx) return;
      c.setPointerCapture(e.pointerId);
      snapshotAl();
      ciziyor.current = true;
      const p = konum(e);
      sonNokta.current = p;
      uygulaStil(ctx);
      ctx.beginPath();
      ctx.arc(p.x, p.y, (arac === "silgi" ? kalinlik * 2.2 : kalinlik) / 2, 0, Math.PI * 2);
      ctx.fill();
    };

    const hareket = (e: React.PointerEvent) => {
      if (!ciziyor.current || !sonNokta.current) return;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const p = konum(e);
      uygulaStil(ctx);
      ctx.lineWidth = arac === "silgi" ? kalinlik * 2.2 : kalinlik;
      ctx.beginPath();
      ctx.moveTo(sonNokta.current.x, sonNokta.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      sonNokta.current = p;
    };

    const bitir = () => {
      if (!ciziyor.current) return;
      ciziyor.current = false;
      sonNokta.current = null;
      setDolu(true);
      yenile((n) => n + 1);
    };

    const geriAl = () => {
      const c = canvasRef.current;
      const ctx = c?.getContext("2d");
      if (!c || !ctx || !gecmis.current.length) return;
      ileri.current.push(ctx.getImageData(0, 0, c.width, c.height));
      ctx.putImageData(gecmis.current.pop()!, 0, 0);
      setDolu(gecmis.current.length > 0);
      yenile((n) => n + 1);
    };

    const ileriAl = () => {
      const c = canvasRef.current;
      const ctx = c?.getContext("2d");
      if (!c || !ctx || !ileri.current.length) return;
      gecmis.current.push(ctx.getImageData(0, 0, c.width, c.height));
      ctx.putImageData(ileri.current.pop()!, 0, 0);
      setDolu(true);
      yenile((n) => n + 1);
    };

    const temizle = () => {
      const c = canvasRef.current;
      const ctx = c?.getContext("2d");
      if (!c || !ctx) return;
      snapshotAl();
      ctx.clearRect(0, 0, c.width, c.height);
      setDolu(false);
      yenile((n) => n + 1);
    };

    useImperativeHandle(ref, () => ({
      dataUrl: () => canvasRef.current?.toDataURL("image/png") ?? "",
      bosMu: () => !dolu,
      temizle,
    }), [dolu]);

    // arka bir CSS background string olabilir (url(...) veya gradient) → <img> için saltUrl
    const arkaSrc = arka ? saltUrl(arka) : undefined;

    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <div className="relative flex-1 overflow-hidden rounded-xl border border-[var(--sn-kenar)]" style={{ minHeight: 360, background: arka ?? "#0a0a0b" }}>
          {arkaSrc && <img src={arkaSrc} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-70" />}
          <canvas
            ref={canvasRef}
            onPointerDown={basla}
            onPointerMove={hareket}
            onPointerUp={bitir}
            onPointerLeave={bitir}
            onPointerCancel={bitir}
            className="absolute inset-0 h-full w-full touch-none"
            style={{ cursor: arac === "silgi" ? "cell" : "crosshair" }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="glass-cip flex items-center gap-1 rounded-full p-1">
            <button onClick={() => setArac("kalem")} className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors", arac === "kalem" ? "bg-white text-zemin" : "text-metin-2 hover:text-metin")} aria-label="Kalem"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => setArac("silgi")} className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors", arac === "silgi" ? "bg-white text-zemin" : "text-metin-2 hover:text-metin")} aria-label="Silgi"><Eraser className="h-4 w-4" /></button>
          </div>

          <div className="flex items-center gap-1.5">
            {RENKLER.map((r) => (
              <button key={r} onClick={() => { setRenk(r); setArac("kalem"); }}
                className={cn("h-6 w-6 rounded-full border-2 transition-transform hover:scale-110", renk === r && arac === "kalem" ? "border-aksan" : "border-white/20")}
                style={{ background: r }} aria-label={`Renk ${r}`} />
            ))}
          </div>

          <div className="glass-cip flex items-center gap-1.5 rounded-full px-2 py-1">
            <button onClick={() => setKalinlik((k) => Math.max(1, k - 2))} className="flex h-6 w-6 items-center justify-center rounded-full text-metin-2 hover:text-metin" aria-label="İncelt"><Minus className="h-3.5 w-3.5" /></button>
            <span className="rounded-full bg-white" style={{ width: Math.min(kalinlik, 20), height: Math.min(kalinlik, 20) }} />
            <button onClick={() => setKalinlik((k) => Math.min(40, k + 2))} className="flex h-6 w-6 items-center justify-center rounded-full text-metin-2 hover:text-metin" aria-label="Kalınlaştır"><Plus className="h-3.5 w-3.5" /></button>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button disabled={!gecmis.current.length} onClick={geriAl} className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition-colors hover:text-metin disabled:opacity-35" aria-label="Geri al"><Undo2 className="h-4 w-4" /></button>
            <button disabled={!ileri.current.length} onClick={ileriAl} className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition-colors hover:text-metin disabled:opacity-35" aria-label="İleri al"><Redo2 className="h-4 w-4" /></button>
            <button onClick={temizle} className="flex h-8 w-8 items-center justify-center rounded-full text-metin-2 transition-colors hover:bg-rose-500/15 hover:text-rose-400" aria-label="Temizle"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    );
  },
);
