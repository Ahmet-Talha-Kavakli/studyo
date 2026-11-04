"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Brush, ChevronLeft, ChevronRight, Eraser, Maximize, Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SCCikti } from "@/store/useSupercomputer";

/**
 * Sohbet görsel görüntüleyicisi (ChatGPT görsel düzenleme): yakınlaştır (tekerlek, +/−, sığdır), sohbetteki görseller
 * arasında ←/→, alt şeritte küçük resimler; "Alan seç" fırçasıyla maske boya ve "ne değişsin?" yaz → yeni sürüm üretilir.
 */
export function GorselPanel({ c, gorseller, onSec, onDuzenle, kredi }: {
  c: SCCikti; gorseller: SCCikti[]; onSec: (c: SCCikti) => void; onDuzenle?: (istem: string, maske?: string) => void; kredi: number;
}) {
  const [olcek, setOlcek] = useState(1);
  const [firca, setFirca] = useState(false);
  const [boyut, setBoyut] = useState(36);
  const [maskeVar, setMaskeVar] = useState(false);
  const [istem, setIstem] = useState("");
  const [dogal, setDogal] = useState<{ w: number; h: number } | null>(null);
  const tuval = useRef<HTMLCanvasElement>(null);
  const ciziyor = useRef(false);
  const i = gorseller.findIndex((x) => x.id === c.id);
  /* Demo görselleri CSS arka planı olarak gelir (url("…") center/cover); gerçek adres oradan ayıklanır. */
  const url = c.url ? (/^(data:|http|\/)/.test(c.url) ? c.url : c.url.match(/url\(["']?([^"')]+)["']?\)/)?.[1] ?? null) : null;

  useEffect(() => { setOlcek(1); setFirca(false); setMaskeVar(false); setIstem(""); setDogal(null);
    if (!url) return; const im = new Image(); im.onload = () => setDogal({ w: im.naturalWidth, h: im.naturalHeight }); im.src = url; }, [c.id, url]);
  useEffect(() => {
    const t = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowRight" && i < gorseller.length - 1) onSec(gorseller[i + 1]);
      if (e.key === "ArrowLeft" && i > 0) onSec(gorseller[i - 1]);
    };
    window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t);
  }, [i, gorseller, onSec]);

  const boya = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = tuval.current; if (!cv || !ciziyor.current) return;
    const r = cv.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * cv.width, y = ((e.clientY - r.top) / r.height) * cv.height;
    const ctx = cv.getContext("2d")!; ctx.fillStyle = "rgba(85,214,253,0.55)";
    ctx.beginPath(); ctx.arc(x, y, (boyut / r.width) * cv.width, 0, Math.PI * 2); ctx.fill();
    setMaskeVar(true);
  };
  const temizle = () => { const cv = tuval.current; cv?.getContext("2d")?.clearRect(0, 0, cv.width, cv.height); setMaskeVar(false); };
  /** Boyanan alan → siyah zemin üstünde beyaz maske (sağlayıcıların beklediği biçim). */
  const maskeAl = () => {
    const cv = tuval.current; if (!cv || !maskeVar) return undefined;
    const m = document.createElement("canvas"); m.width = cv.width; m.height = cv.height;
    const x = m.getContext("2d")!; x.fillStyle = "#000"; x.fillRect(0, 0, m.width, m.height);
    const kaynak = cv.getContext("2d")!.getImageData(0, 0, cv.width, cv.height);
    const hedef = x.getImageData(0, 0, m.width, m.height);
    for (let p = 3; p < kaynak.data.length; p += 4) if (kaynak.data[p] > 10) { hedef.data[p - 3] = 255; hedef.data[p - 2] = 255; hedef.data[p - 1] = 255; }
    x.putImageData(hedef, 0, 0);
    return m.toDataURL("image/png");
  };
  const gonder = () => { if (!onDuzenle || istem.trim().length < 3) return; onDuzenle(istem.trim(), maskeAl()); setIstem(""); temizle(); setFirca(false); };
  const ikon = "flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] transition-colors hover:bg-white/[0.07] hover:text-[var(--sc-metin)] disabled:opacity-30";

  return (
    <div className="flex h-full flex-col bg-[#0a0d12]">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-white/[0.06] px-3">
        <button onClick={() => setOlcek((o) => Math.max(0.5, +(o - 0.25).toFixed(2)))} aria-label="Uzaklaştır" className={ikon}><Minus className="h-3.5 w-3.5" /></button>
        <span className="w-12 text-center text-[12px] tabular-nums text-[var(--sc-metin-2)]">%{Math.round(olcek * 100)}</span>
        <button onClick={() => setOlcek((o) => Math.min(4, +(o + 0.25).toFixed(2)))} aria-label="Yakınlaştır" className={ikon}><Plus className="h-3.5 w-3.5" /></button>
        <button onClick={() => setOlcek(1)} aria-label="Sığdır" title="Sığdır" className={ikon}><Maximize className="h-3.5 w-3.5" /></button>
        {onDuzenle && url && (
          <>
            <span className="mx-1.5 h-5 w-px bg-white/[0.08]" />
            <button onClick={() => { setFirca((v) => !v); setOlcek(1); }} aria-pressed={firca}
              className={cn("flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-colors", firca ? "bg-[var(--sc-aksan)]/20 text-[var(--sc-aksan)]" : "text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]")}><Brush className="h-3.5 w-3.5" />Alan seç</button>
            {firca && (
              <>
                <input type="range" min={10} max={90} value={boyut} onChange={(e) => setBoyut(Number(e.target.value))} aria-label="Fırça boyutu" className="ml-1 w-24 accent-[var(--sc-aksan)]" />
                <button onClick={temizle} disabled={!maskeVar} aria-label="Seçimi temizle" title="Seçimi temizle" className={ikon}><Eraser className="h-3.5 w-3.5" /></button>
              </>
            )}
          </>
        )}
        <span className="flex-1" />
        {gorseller.length > 1 && <span className="text-[12px] tabular-nums text-[var(--sc-metin-3)]">{i + 1} / {gorseller.length}</span>}
      </div>

      <div className="relative min-h-0 flex-1 overflow-auto bg-[length:20px_20px] [background-image:radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [scrollbar-width:thin]"
        onWheel={(e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); setOlcek((o) => Math.min(4, Math.max(0.5, o - e.deltaY * 0.002))); } }}>
        <div className="flex min-h-full min-w-full items-center justify-center p-6" style={{ width: `${olcek * 100}%`, height: olcek > 1 ? `${olcek * 100}%` : undefined }}>
          {url ? (
            <div className="relative max-h-full max-w-full" style={dogal ? { aspectRatio: `${dogal.w} / ${dogal.h}`, height: olcek > 1 ? "100%" : undefined, width: olcek > 1 ? undefined : "100%", maxWidth: olcek > 1 ? "none" : `min(100%, ${dogal.w}px)` } : undefined}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={c.ad ?? "Görsel"} draggable={false} className="block h-full w-full rounded-[12px] object-contain" />
              {dogal && (
                <canvas ref={tuval} width={Math.min(dogal.w, 2048)} height={Math.round(Math.min(dogal.w, 2048) * dogal.h / dogal.w)}
                  onPointerDown={(e) => { if (!firca) return; ciziyor.current = true; e.currentTarget.setPointerCapture(e.pointerId); boya(e); }}
                  onPointerMove={boya} onPointerUp={() => { ciziyor.current = false; }}
                  className={cn("absolute inset-0 h-full w-full rounded-[12px] touch-none", firca ? "cursor-crosshair" : "pointer-events-none")} />
              )}
            </div>
          ) : <div className="h-64 w-64 rounded-[12px]" style={{ background: c.url }} />}
        </div>
        {i > 0 && <button onClick={() => onSec(gorseller[i - 1])} aria-label="Önceki görsel" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70"><ChevronLeft className="h-5 w-5" /></button>}
        {i < gorseller.length - 1 && <button onClick={() => onSec(gorseller[i + 1])} aria-label="Sonraki görsel" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70"><ChevronRight className="h-5 w-5" /></button>}
      </div>

      {gorseller.length > 1 && (
        <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-white/[0.06] px-3 py-2.5 [scrollbar-width:none]">
          {gorseller.map((g) => (
            <button key={g.id} onClick={() => onSec(g)} aria-label={g.ad} aria-current={g.id === c.id}
              className={cn("h-14 w-14 shrink-0 overflow-hidden rounded-[10px] outline outline-2 -outline-offset-2 transition-opacity", g.id === c.id ? "outline-[var(--sc-aksan)]" : "opacity-60 outline-transparent hover:opacity-100")}
              style={{ background: g.url && /^(data:|http|\/)/.test(g.url) ? `url("${g.url}") center/cover` : g.url }} />
          ))}
        </div>
      )}

      {onDuzenle && url && (
        <form onSubmit={(e) => { e.preventDefault(); gonder(); }} className="shrink-0 border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-2 rounded-[14px] bg-[#18181b] py-1.5 pl-3.5 pr-1.5 ring-1 ring-inset ring-white/[0.08] focus-within:ring-[var(--sc-aksan)]/50">
            {maskeVar && <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--sc-aksan)]/15 px-2 py-0.5 text-[11.5px] font-medium text-[var(--sc-aksan)]">Seçili alan<button type="button" onClick={temizle} aria-label="Seçimi kaldır"><X className="h-3 w-3" /></button></span>}
            <input value={istem} onChange={(e) => setIstem(e.target.value)} placeholder={maskeVar ? "Seçili alanda ne değişsin?" : "Bu görselde ne değişsin? Ya da önce alan seç"} aria-label="Görsel düzenleme talimatı"
              className="h-9 min-w-0 flex-1 bg-transparent text-[13.5px] text-[var(--sc-metin)] outline-none placeholder:text-[var(--sc-metin-3)]" />
            <span className="shrink-0 text-[11.5px] tabular-nums text-[var(--sc-metin-3)]">{kredi} kredi</span>
            <button disabled={istem.trim().length < 3} aria-label="Düzenle" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--sc-aksan)] text-[var(--sc-aksan-metin)] disabled:bg-white/[0.08] disabled:text-[var(--sc-metin-3)]"><ArrowUp className="h-4 w-4" strokeWidth={2.4} /></button>
          </div>
        </form>
      )}
    </div>
  );
}
