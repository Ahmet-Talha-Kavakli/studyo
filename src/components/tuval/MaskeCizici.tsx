"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Brush, Eraser, Loader2, RotateCcw, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { gorselYukle } from "@/components/arac/kit";

/**
 * Bölgesel düzenleme için maske boyama penceresi. Boyanan alan beyaz, kalanı siyah PNG olarak yüklenir
 * (stüdyodaki maskeyle aynı biçim). Fırça boyutu, silgi, geri al, temizle; dokunmatikte de çalışır.
 */
export function MaskeCizici({ gorsel, mevcut, onKaydet, onKapat }: { gorsel: string; mevcut?: string; onKaydet: (maskeUrl: string | undefined) => void; onKapat: () => void }) {
  const tuval = useRef<HTMLCanvasElement>(null);
  const [boyut, setBoyut] = useState<{ w: number; h: number } | null>(null);
  const [firca, setFirca] = useState(48);
  const [silgi, setSilgi] = useState(false);
  const [gecmis, setGecmis] = useState<ImageData[]>([]);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const ciz = useRef<{ x: number; y: number } | null>(null);
  const [imlec, setImlec] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => {
      setBoyut({ w: img.naturalWidth, h: img.naturalHeight });
      requestAnimationFrame(() => {
        const c = tuval.current; if (!c) return;
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        if (mevcut) {
          // Var olan maske: beyaz alanları yarı saydam boya olarak geri yükle.
          const m = new Image(); m.crossOrigin = "anonymous";
          m.onload = () => {
            const o = document.createElement("canvas"); o.width = c.width; o.height = c.height;
            const ox = o.getContext("2d")!; ox.drawImage(m, 0, 0, c.width, c.height);
            const v = ox.getImageData(0, 0, c.width, c.height); const x = c.getContext("2d")!; const h = x.createImageData(c.width, c.height);
            for (let i = 0; i < v.data.length; i += 4) if (v.data[i] > 127) { h.data[i] = 34; h.data[i + 1] = 211; h.data[i + 2] = 238; h.data[i + 3] = 255; }
            x.putImageData(h, 0, 0);
          };
          m.src = mevcut;
        }
      });
    };
    img.src = gorsel;
  }, [gorsel, mevcut]);

  const nokta = (e: React.PointerEvent) => { const c = tuval.current!; const r = c.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height, olcek: c.width / r.width }; };
  const firc = (a: { x: number; y: number }, b: { x: number; y: number }, olcek: number) => {
    const x = tuval.current!.getContext("2d")!;
    x.globalCompositeOperation = silgi ? "destination-out" : "source-over";
    x.strokeStyle = "rgb(34,211,238)"; x.lineCap = "round"; x.lineJoin = "round"; x.lineWidth = firca * olcek;
    x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
  };
  const bas = (e: React.PointerEvent) => {
    const c = tuval.current; if (!c) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setGecmis((g) => [...g.slice(-19), c.getContext("2d")!.getImageData(0, 0, c.width, c.height)]);
    const p = nokta(e); ciz.current = p; firc(p, { x: p.x + 0.01, y: p.y }, p.olcek);
  };
  const hareket = (e: React.PointerEvent) => {
    const r = tuval.current?.getBoundingClientRect(); if (r) setImlec({ x: e.clientX - r.left, y: e.clientY - r.top });
    if (!ciz.current) return; const p = nokta(e); firc(ciz.current, p, p.olcek); ciz.current = p;
  };
  const geriAl = () => { const c = tuval.current; const s = gecmis[gecmis.length - 1]; if (!c || !s) return; c.getContext("2d")!.putImageData(s, 0, 0); setGecmis((g) => g.slice(0, -1)); };
  const temizle = () => { const c = tuval.current; if (!c) return; setGecmis((g) => [...g.slice(-19), c.getContext("2d")!.getImageData(0, 0, c.width, c.height)]); c.getContext("2d")!.clearRect(0, 0, c.width, c.height); };
  const kaydet = async () => {
    const c = tuval.current; if (!c) return;
    const v = c.getContext("2d")!.getImageData(0, 0, c.width, c.height);
    if (!v.data.some((x, i) => i % 4 === 3 && x > 0)) { onKaydet(undefined); onKapat(); return; }
    const o = document.createElement("canvas"); o.width = c.width; o.height = c.height;
    const x = o.getContext("2d")!; x.fillStyle = "#000"; x.fillRect(0, 0, o.width, o.height);
    x.globalCompositeOperation = "destination-out"; x.drawImage(c, 0, 0);
    x.globalCompositeOperation = "destination-over"; x.fillStyle = "#fff"; x.fillRect(0, 0, o.width, o.height);
    setKaydediliyor(true);
    const veri = o.toDataURL("image/png");
    const url = await gorselYukle(veri).catch(() => veri);
    setKaydediliyor(false); onKaydet(url); onKapat();
  };
  useEffect(() => {
    const t = (e: KeyboardEvent) => {
      if (e.key === "Escape") onKapat();
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); geriAl(); }
      else if (e.key === "[") setFirca((f) => Math.max(6, f - 8)); else if (e.key === "]") setFirca((f) => Math.min(200, f + 8));
      else if (e.key.toLowerCase() === "e") setSilgi((s) => !s);
    };
    window.addEventListener("keydown", t, true); return () => window.removeEventListener("keydown", t, true);
  });

  return (
    <div data-arayuz className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6" onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="perde absolute inset-0 bg-black/75" onClick={onKapat} />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} role="dialog" aria-label="Maske boya"
        className="relative flex max-h-full w-full max-w-[980px] flex-col overflow-hidden rounded-[20px] bg-[var(--tv-kart)] ring-1 ring-white/[0.1]">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
          <div className="flex-1"><h2 className="text-[15px] font-semibold">Değişecek alanı boya</h2><p className="text-[12px] text-[var(--sc-metin-3)]">Boyanan yer düzenlenir, kalanı korunur · [ ] fırça boyutu · E silgi · Ctrl Z geri al</p></div>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.075]"><X className="h-4 w-4" /></button>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[var(--tv-zemin)] p-3">
          {!boyut && <Loader2 className="h-5 w-5 animate-spin text-[var(--sc-metin-3)]" />}
          {boyut && (
            <div className="relative max-h-[68vh]" style={{ aspectRatio: `${boyut.w}/${boyut.h}`, height: "68vh", maxWidth: "100%" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={gorsel} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none object-contain" />
              <canvas ref={tuval} onPointerDown={bas} onPointerMove={hareket} onPointerUp={() => { ciz.current = null; }} onPointerLeave={() => { ciz.current = null; setImlec(null); }}
                className="absolute inset-0 h-full w-full cursor-none touch-none opacity-55" />
              {imlec && <span aria-hidden className="pointer-events-none absolute rounded-full border-2 border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.6)]" style={{ left: imlec.x - firca / 2, top: imlec.y - firca / 2, width: firca, height: firca }} />}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-4 py-3">
          <div className="flex rounded-full bg-white/[0.065] p-1">
            <button onClick={() => setSilgi(false)} aria-pressed={!silgi} className={cn("flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px]", !silgi ? "bg-white/[0.1] text-[var(--sc-metin)]" : "text-[var(--sc-metin-3)]")}><Brush className="h-3.5 w-3.5" />Fırça</button>
            <button onClick={() => setSilgi(true)} aria-pressed={silgi} className={cn("flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px]", silgi ? "bg-white/[0.1] text-[var(--sc-metin)]" : "text-[var(--sc-metin-3)]")}><Eraser className="h-3.5 w-3.5" />Silgi</button>
          </div>
          <label className="flex items-center gap-2 text-[12.5px] text-[var(--sc-metin-2)]">Boyut<input type="range" min={6} max={200} value={firca} onChange={(e) => setFirca(Number(e.target.value))} className="w-28 accent-[var(--tv-aksan)]" /><span className="w-8 tabular-nums text-[var(--sc-metin-3)]">{firca}</span></label>
          <button onClick={geriAl} disabled={!gecmis.length} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-[var(--sc-metin-2)] hover:bg-white/[0.075] disabled:opacity-35"><RotateCcw className="h-3.5 w-3.5" />Geri al</button>
          <button onClick={temizle} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-[var(--sc-metin-2)] hover:bg-white/[0.075]"><Trash2 className="h-3.5 w-3.5" />Temizle</button>
          <span className="flex-1" />
          <button onClick={onKapat} className="h-9 rounded-full px-4 text-[13px] text-[var(--sc-metin-2)] hover:bg-white/[0.065]">Vazgeç</button>
          <button onClick={() => void kaydet()} disabled={kaydediliyor} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-50">{kaydediliyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Maskeyi kaydet</button>
        </div>
      </motion.div>
    </div>
  );
}
