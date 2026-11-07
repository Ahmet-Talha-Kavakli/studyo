"use client";

import { temaSinifi, useTuvalTema } from "@/lib/tuval/tema";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Maximize, Minus, Plus } from "lucide-react";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { KATALOG, PORT_RENK } from "@/lib/tuval/katalog";
import { useTuval, type Dugum as TDugum, type Kenar, type Tuval } from "@/store/useTuval";
import { Dugum, portY } from "./Dugum";

/** Paylaşılan tuvalin salt okunur görünümü (/t/<id>): kaydır, yakınlaştır, "Kopyasını aç". */
export function TuvalGoruntu({ k }: { k: { id: string; ad: string; dugumler: unknown[]; kenarlar: unknown[]; guncelleme: number } }) {
  const router = useRouter();
  const t: Tuval = { id: `p-${k.id}`, ad: k.ad, olusturma: k.guncelleme, guncelleme: k.guncelleme, dugumler: k.dugumler as TDugum[], kenarlar: k.kenarlar as Kenar[], gorunum: { x: 0, y: 0, z: 1 } };
  const kok = useRef<HTMLDivElement>(null);
  const tema = useTuvalTema((s) => s.tema);
  const [g, setG] = useState({ x: 0, y: 0, z: 1 });
  const sur = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const sigdir = () => {
    const el = kok.current; if (!el || !t.dugumler.length) return;
    const x0 = Math.min(...t.dugumler.map((d) => d.x)), y0 = Math.min(...t.dugumler.map((d) => d.y)), x1 = Math.max(...t.dugumler.map((d) => d.x + KATALOG[d.tur].genislik)), y1 = Math.max(...t.dugumler.map((d) => d.y + 340));
    const z = Math.max(0.15, Math.min(1, Math.min(el.clientWidth / (x1 - x0 + 120), (el.clientHeight - 60) / (y1 - y0 + 120))));
    setG({ z, x: el.clientWidth / 2 - ((x0 + x1) / 2) * z, y: 30 + el.clientHeight / 2 - ((y0 + y1) / 2) * z });
  };
  useEffect(() => { sigdir(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = kok.current; if (!el) return;
    const w = (e: WheelEvent) => { e.preventDefault(); if (e.ctrlKey || e.metaKey) { const r = el.getBoundingClientRect(); setG((v) => { const z = Math.max(0.15, Math.min(2.5, v.z * Math.exp(-e.deltaY * 0.0022))); const wx = (e.clientX - r.left - v.x) / v.z, wy = (e.clientY - r.top - v.y) / v.z; return { z, x: e.clientX - r.left - wx * z, y: e.clientY - r.top - wy * z }; }); } else setG((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY })); };
    el.addEventListener("wheel", w, { passive: false }); return () => el.removeEventListener("wheel", w);
  }, []);
  const kopyaAc = () => {
    const id = useTuval.getState().olustur({ ad: `${k.ad} (kopya)`, dugumler: t.dugumler.map((d) => ({ ...d, durum: d.surumler.length ? "bitti" : "bos" })), kenarlar: t.kenarlar });
    router.push(`/panel/canvas/${id}`);
  };
  const genis = (d: TDugum) => KATALOG[d.tur].genislik;

  return (
    <div ref={kok} className={`sc-kapsam ${temaSinifi(tema)} relative h-[100dvh] w-full touch-none overflow-hidden bg-[var(--tv-zemin)] text-[var(--sc-metin)]`}
      onPointerDown={(e) => { if ((e.target as HTMLElement).closest("[data-ui],video,audio")) return; sur.current = { sx: e.clientX, sy: e.clientY, ox: g.x, oy: g.y }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => { const s = sur.current; if (s) setG((v) => ({ ...v, x: s.ox + e.clientX - s.sx, y: s.oy + e.clientY - s.sy })); }}
      onPointerUp={() => { sur.current = null; }}
      style={{ backgroundImage: "radial-gradient(var(--tv-nokta) 1.1px, transparent 1.2px)", backgroundSize: `${22 * g.z}px ${22 * g.z}px`, backgroundPosition: `${g.x}px ${g.y}px`, cursor: "grab" }}>
      <div className="pointer-events-none absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${g.x}px, ${g.y}px) scale(${g.z})` }}>
        <svg className="absolute left-0 top-0 overflow-visible" width="1" height="1">
          {t.kenarlar.map((e) => { const A = t.dugumler.find((d) => d.id === e.kaynak), B = t.dugumler.find((d) => d.id === e.hedef); if (!A || !B) return null;
            const x1 = A.x + genis(A), y1 = A.y + portY(0), i = Math.max(0, KATALOG[B.tur].girisler.findIndex((x) => x.id === e.port)), x2 = B.x, y2 = B.y + portY(i), kk = Math.max(50, Math.abs(x2 - x1) / 2);
            return <path key={e.id} d={`M${x1},${y1} C${x1 + kk},${y1} ${x2 - kk},${y2} ${x2},${y2}`} fill="none" stroke={PORT_RENK[KATALOG[A.tur].cikti ?? "metin"]} strokeOpacity={0.6} strokeWidth={2} />; })}
        </svg>
        {t.dugumler.map((d) => (
          <div key={d.id} className="[&_video]:pointer-events-auto">
            <Dugum saltOkunur d={d} t={t} secili={false} onDegis={() => undefined} onCalistir={() => undefined} onIptal={() => undefined} onGovdeBas={() => undefined} />
          </div>
        ))}
      </div>
      <div data-ui className="absolute left-4 top-4 flex items-center gap-2 rounded-[14px] bg-[var(--tv-kart)]/92 p-1.5 pr-3 ring-1 ring-white/[0.08] backdrop-blur-md">
        <Link href="/panel/canvas" className="flex items-center gap-2 rounded-[10px] px-1.5 py-1 hover:bg-white/[0.055]"><VayraIsaret size={18} /><span className="text-[12.5px] text-[var(--sc-metin-3)]">Vayra Canvas</span></Link>
        <span className="h-4 w-px bg-white/[0.1]" />
        <span className="max-w-[40vw] truncate text-[13.5px] font-medium">{k.ad}</span>
        <span className="rounded-full bg-white/[0.075] px-2 py-0.5 text-[11px] text-[var(--sc-metin-3)]">Salt okunur</span>
      </div>
      <div data-ui className="absolute right-4 top-4"><button onClick={kopyaAc} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black hover:brightness-110"><Copy className="h-3.5 w-3.5" />Kopyasını aç</button></div>
      <div data-ui className="absolute bottom-4 left-4 flex items-center gap-0.5 rounded-[12px] bg-[var(--tv-kart)]/92 p-1 ring-1 ring-white/[0.08]">
        <button onClick={() => setG((v) => ({ ...v, z: Math.max(0.15, v.z / 1.2) }))} aria-label="Uzaklaştır" className="flex h-7 w-7 items-center justify-center rounded-[8px] hover:bg-white/[0.075]"><Minus className="h-3.5 w-3.5" /></button>
        <span className="min-w-11 whitespace-nowrap px-1 text-center text-[12px] tabular-nums text-[var(--sc-metin-2)]">yüzde {Math.round(g.z * 100)}</span>
        <button onClick={() => setG((v) => ({ ...v, z: Math.min(2.5, v.z * 1.2) }))} aria-label="Yakınlaştır" className="flex h-7 w-7 items-center justify-center rounded-[8px] hover:bg-white/[0.075]"><Plus className="h-3.5 w-3.5" /></button>
        <button onClick={sigdir} aria-label="Sığdır" className="flex h-7 w-7 items-center justify-center rounded-[8px] hover:bg-white/[0.075]"><Maximize className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}
