"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Eraser, Loader2, MessageSquarePlus, Pencil, Square, Type, Undo2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Nokta = { x: number; y: number };
type Sekil =
  | { tur: "kalem"; renk: string; noktalar: Nokta[] }
  | { tur: "kutu" | "ok"; renk: string; a: Nokta; b: Nokta }
  | { tur: "not"; renk: string; a: Nokta; metin: string };
type Arac = "kalem" | "kutu" | "ok" | "not";

const RENKLER = [{ id: "#55d6fd", ad: "Camgöbeği" }, { id: "#ff4d6d", ad: "Kırmızı" }, { id: "#ffd23f", ad: "Sarı" }];
const ARACLAR: { id: Arac; ad: string; ikon: typeof Pencil }[] = [
  { id: "kalem", ad: "Kalem", ikon: Pencil }, { id: "kutu", ad: "Dikdörtgen", ikon: Square }, { id: "ok", ad: "Ok", ikon: ArrowUpRight }, { id: "not", ad: "Not", ikon: Type },
];

/** Şekilleri verilen tuvale çizer (koordinatlar 0..1; kalınlık görüntü genişliğine göre). */
function ciz(c: CanvasRenderingContext2D, l: Sekil[], w: number, h: number) {
  const k = Math.max(1, w / 900);
  c.lineCap = "round"; c.lineJoin = "round";
  l.forEach((s, i) => {
    c.strokeStyle = s.renk; c.fillStyle = s.renk; c.lineWidth = 3.5 * k;
    if (s.tur === "kalem") {
      c.beginPath(); s.noktalar.forEach((p, j) => (j ? c.lineTo(p.x * w, p.y * h) : c.moveTo(p.x * w, p.y * h))); c.stroke();
    } else if (s.tur === "kutu") {
      c.strokeRect(Math.min(s.a.x, s.b.x) * w, Math.min(s.a.y, s.b.y) * h, Math.abs(s.b.x - s.a.x) * w, Math.abs(s.b.y - s.a.y) * h);
    } else if (s.tur === "ok") {
      const ax = s.a.x * w, ay = s.a.y * h, bx = s.b.x * w, by = s.b.y * h, aci = Math.atan2(by - ay, bx - ax), u = 16 * k;
      c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
      c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - u * Math.cos(aci - 0.45), by - u * Math.sin(aci - 0.45)); c.lineTo(bx - u * Math.cos(aci + 0.45), by - u * Math.sin(aci + 0.45)); c.closePath(); c.fill();
    } else if (s.tur === "not") {
      const fs = 15 * k, x = s.a.x * w, y = s.a.y * h;
      c.font = `600 ${fs}px system-ui, sans-serif`;
      const metin = `${i + 1}. ${s.metin}`;
      const gw = c.measureText(metin).width + fs;
      c.fillStyle = s.renk; c.beginPath(); c.roundRect(x, y - fs * 1.1, gw, fs * 1.7, fs * 0.5); c.fill();
      c.fillStyle = "#04121a"; c.fillText(metin, x + fs / 2, y + fs * 0.15);
    }
  });
}

/**
 * Önizleme üstüne çizim ve not: kalem, dikdörtgen, ok ve numaralı not. "Sohbete ekle" önizlemenin o anki ekran
 * görüntüsünü (sunucuda gerçek tarayıcıyla) alır, çizimi üstüne işler ve görsel olarak komut kutusuna ekler.
 */
export function CizimKatmani({ kapat, goruntuAl, ekle }: { kapat: () => void; goruntuAl: () => Promise<string | null>; ekle: (gorsel: string, not: string) => void }) {
  const kutu = useRef<HTMLDivElement>(null);
  const tuval = useRef<HTMLCanvasElement>(null);
  const [l, setL] = useState<Sekil[]>([]);
  const [canli, setCanli] = useState<Sekil | null>(null);
  const [arac, setArac] = useState<Arac>("kalem");
  const [renk, setRenk] = useState(RENKLER[0].id);
  const [notYeri, setNotYeri] = useState<Nokta | null>(null);
  const [notMetin, setNotMetin] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [gidiyor, setGidiyor] = useState(false);
  const [uyari, setUyari] = useState("");

  useEffect(() => {
    const k = kutu.current, t = tuval.current;
    if (!k || !t) return;
    const yeniden = () => { const r = k.getBoundingClientRect(); t.width = r.width * devicePixelRatio; t.height = r.height * devicePixelRatio; t.style.width = `${r.width}px`; t.style.height = `${r.height}px`; };
    yeniden();
    const ro = new ResizeObserver(yeniden); ro.observe(k);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const t = tuval.current; const c = t?.getContext("2d");
    if (!t || !c) return;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, t.width, t.height);
    ciz(c, canli ? [...l, canli] : l, t.width, t.height);
  });
  useEffect(() => { const f = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !notYeri) { e.preventDefault(); setL((x) => x.slice(0, -1)); } if (e.key === "Escape" && !notYeri) kapat(); }; addEventListener("keydown", f); return () => removeEventListener("keydown", f); }, [kapat, notYeri]);

  const nokta = (e: React.PointerEvent): Nokta => { const r = kutu.current!.getBoundingClientRect(); return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) }; };
  const bas = (e: React.PointerEvent) => {
    if (notYeri) return;
    const p = nokta(e);
    if (arac === "not") { setNotYeri(p); setNotMetin(""); return; }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setCanli(arac === "kalem" ? { tur: "kalem", renk, noktalar: [p] } : { tur: arac, renk, a: p, b: p });
  };
  const hareket = (e: React.PointerEvent) => {
    if (!canli) return;
    const p = nokta(e);
    setCanli(canli.tur === "kalem" ? { ...canli, noktalar: [...canli.noktalar, p] } : canli.tur === "kutu" || canli.tur === "ok" ? { ...canli, b: p } : canli);
  };
  const birak = () => {
    if (!canli) return;
    const kucuk = canli.tur === "kalem" ? canli.noktalar.length < 2 : canli.tur !== "not" && Math.hypot(canli.b.x - canli.a.x, canli.b.y - canli.a.y) < 0.01;
    if (!kucuk) setL((x) => [...x, canli]);
    setCanli(null);
  };
  const notlar = l.filter((s): s is Extract<Sekil, { tur: "not" }> => s.tur === "not");

  const gonder = async () => {
    setGidiyor(true); setUyari("");
    try {
      const zemin = await goruntuAl();
      const r = kutu.current!.getBoundingClientRect();
      const img = zemin ? await new Promise<HTMLImageElement | null>((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = zemin; }) : null;
      const W = img ? img.naturalWidth : Math.round(r.width * 2), H = img ? img.naturalHeight : Math.round(r.height * 2);
      const o = Math.min(1, 1600 / Math.max(W, H));
      const c = document.createElement("canvas"); c.width = Math.round(W * o); c.height = Math.round(H * o);
      const x = c.getContext("2d")!;
      if (img) x.drawImage(img, 0, 0, c.width, c.height); else { x.fillStyle = "#ffffff"; x.fillRect(0, 0, c.width, c.height); }
      ciz(x, l, c.width, c.height);
      const satirlar = notlar.map((n) => `${l.indexOf(n) + 1}. ${n.metin}`);
      const metin = [`Önizlemede çizerek işaretledim (ekteki görsel)${aciklama.trim() ? `: ${aciklama.trim()}` : "."}`, ...(satirlar.length ? ["Notlarım:", ...satirlar] : [])].join("\n");
      ekle(c.toDataURL("image/jpeg", 0.86), metin);
      if (!img) setUyari("Ekran görüntüsü alınamadı (sunucuda tarayıcı motoru yok); çizim beyaz zemin üzerinde eklendi.");
      else kapat();
    } finally { setGidiyor(false); }
  };

  return (
    <>
      <div ref={kutu} className={cn("absolute inset-0 z-[15] touch-none", arac === "not" ? "cursor-text" : "cursor-crosshair")} onPointerDown={bas} onPointerMove={hareket} onPointerUp={birak} onPointerCancel={birak}>
        <canvas ref={tuval} className="pointer-events-none absolute inset-0" />
        {notYeri && (
          <form onPointerDown={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); if (notMetin.trim()) setL((x) => [...x, { tur: "not", renk, a: notYeri, metin: notMetin.trim().slice(0, 120) }]); setNotYeri(null); }}
            className="absolute z-10 flex items-center gap-1 rounded-full bg-[#17181b] p-1 pl-3 ring-1 ring-inset ring-white/20" style={{ left: `${notYeri.x * 100}%`, top: `${notYeri.y * 100}%`, transform: "translateY(-50%)" }}>
            <input autoFocus value={notMetin} onChange={(e) => setNotMetin(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") setNotYeri(null); }} placeholder="Not yaz, Enter" className="h-7 w-[180px] bg-transparent text-[12.5px] text-white outline-none placeholder:text-white/35" />
            <button type="submit" className="h-7 rounded-full bg-white px-2.5 text-[12px] font-semibold text-black">Ekle</button>
          </form>
        )}
      </div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
        className="absolute bottom-3 left-1/2 z-30 w-[min(680px,calc(100%-24px))] -translate-x-1/2 rounded-[20px] bg-[#17181b]/95 p-2 ring-1 ring-inset ring-white/[0.12] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-1">
          {ARACLAR.map((a) => (
            <button key={a.id} type="button" title={a.ad} aria-label={a.ad} aria-pressed={arac === a.id} onClick={() => setArac(a.id)} className={cn("flex h-8 w-8 items-center justify-center rounded-full ring-inset", arac === a.id ? "bg-white/[0.1] text-white ring-2 ring-white" : "text-white/60 hover:bg-white/[0.07] hover:text-white")}><a.ikon className="h-4 w-4" /></button>
          ))}
          <span className="mx-1 h-5 w-px bg-white/[0.1]" />
          {RENKLER.map((r) => <button key={r.id} type="button" title={r.ad} aria-label={r.ad} aria-pressed={renk === r.id} onClick={() => setRenk(r.id)} className={cn("h-6 w-6 rounded-full ring-offset-2 ring-offset-[#17181b]", renk === r.id && "ring-2 ring-white")} style={{ background: r.id }} />)}
          <label title="Özel renk" className={cn("relative flex h-6 items-center gap-1 overflow-hidden rounded-full px-2 text-[11.5px] text-white/60 ring-1 ring-inset ring-white/15", !RENKLER.some((r) => r.id === renk) && "text-white ring-2 ring-white")}>
            <span className="h-3 w-3 rounded-full" style={{ background: renk }} />Özel
            <input type="color" value={renk} onChange={(e) => setRenk(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
          <span className="mx-1 h-5 w-px bg-white/[0.1]" />
          <button type="button" title="Geri al (Ctrl Z)" aria-label="Geri al" disabled={!l.length} onClick={() => setL((x) => x.slice(0, -1))} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white disabled:opacity-30"><Undo2 className="h-4 w-4" /></button>
          <button type="button" title="Hepsini sil" aria-label="Hepsini sil" disabled={!l.length} onClick={() => setL([])} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white disabled:opacity-30"><Eraser className="h-4 w-4" /></button>
          <button type="button" aria-label="Çizimi kapat" onClick={kapat} className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <input value={aciklama} onChange={(e) => setAciklama(e.target.value)} maxLength={300} placeholder={l.length ? "Ne değişsin? (isteğe bağlı)" : "Önizlemeye çiz ya da not bırak"} className="h-9 min-w-0 flex-1 rounded-full bg-white/[0.05] px-3.5 text-[13px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/35 focus:ring-white/30" />
          <button type="button" disabled={!l.length || gidiyor} onClick={gonder} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black disabled:opacity-35">{gidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquarePlus className="h-3.5 w-3.5" />}Sohbete ekle</button>
        </div>
        {uyari && <p className="mt-1.5 px-2 text-[12px] leading-snug text-amber-200/90">{uyari}</p>}
      </motion.div>
    </>
  );
}
