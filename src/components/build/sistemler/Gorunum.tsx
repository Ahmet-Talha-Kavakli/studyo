"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Minus, Plus, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tuval görünümü: kaydır (sürükle, tekerlek, shift ile yatay), yakınlaştır (ctrl ya da cmd ile tekerlek, iki parmakla
 * sıkıştır, düğmeler) ve sığdır. İlk açılışta akış görünümden genişse genişliğe sığar. Yakınlık sistem başına
 * tarayıcıda saklanır. Sürükleme kart üstünden de başlar; sürüklenince tıklama yutulur. Akış görünüme sığmayınca sağ altta
 * mini harita çıkar (kartlar data-harita ile işaretlenir; tıkla ya da sürükle, görünüm oraya gider).
 */
type HaritaKutu = { x: number; y: number; w: number; h: number; t: string };
const HARITA_RENK: Record<string, string> = { tetik: "#55d6fd", ai: "rgba(85,214,253,0.55)", eylem: "rgba(255,255,255,0.45)", akis: "rgba(196,181,253,0.6)", veri: "rgba(252,211,77,0.55)", not: "rgba(253,230,138,0.7)", dal: "rgba(255,255,255,0.22)" };
type Durum = { z: number; x: number; y: number };
const EN_AZ = 0.25, EN_COK = 1.6;
const sinirla = (z: number) => Math.max(EN_AZ, Math.min(EN_COK, z));
const DUZENLENEBILIR = "input, textarea, select, [contenteditable], [contenteditable] *";

export function TuvalGorunumu({ anahtar, children, ust, ek, className, notEkle }: { anahtar: string; children: React.ReactNode; ust?: React.ReactNode; ek?: React.ReactNode; className?: string; notEkle?: (x: number, y: number) => void }) {
  const kap = useRef<HTMLDivElement>(null);
  const ic = useRef<HTMLDivElement>(null);
  const [d, setD] = useState<Durum | null>(null);
  const dRef = useRef<Durum | null>(null);
  dRef.current = d;
  const saklaAnahtari = `vayra-sistem-yakinlik:${anahtar}`;

  const olc = () => {
    const k = kap.current, i = ic.current;
    return k && i ? { vw: k.clientWidth, vh: k.clientHeight, w: i.offsetWidth, h: i.offsetHeight } : null;
  };
  const ayarla = useCallback((y: Durum) => {
    const o = olc();
    if (o) {
      // İçerik tamamen kaybolmasın: her yönde en az 80 piksel görünür kalsın.
      y = { z: y.z, x: Math.min(o.vw - 80, Math.max(80 - o.w * y.z, y.x)), y: Math.min(o.vh - 80, Math.max(80 - o.h * y.z, y.y)) };
    }
    setD(y);
  }, []);
  const sigdir = useCallback((yalnizEn = false) => {
    const o = olc();
    if (!o) return;
    const z = sinirla(Math.min(1, (o.vw - 48) / o.w, yalnizEn ? Infinity : (o.vh - 48) / o.h));
    ayarla({ z, x: (o.vw - o.w * z) / 2, y: yalnizEn || o.h * z > o.vh - 48 ? 16 : (o.vh - o.h * z) / 2 });
  }, [ayarla]);

  // İlk açılış: saklanan yakınlık ya da gerekiyorsa genişliğe sığdır; kök sütun ortada.
  useLayoutEffect(() => {
    if (d) return;
    const o = olc();
    if (!o || !o.w) return;
    let z = Number(typeof localStorage !== "undefined" ? localStorage.getItem(saklaAnahtari) : NaN);
    // İlk açılışta okunabilirlik önce gelir: tam sığdırma yüzde 60 altına düşecekse yüzde 60 ile ana sütun ortalanır; Sığdır düğmesi tamamını gösterir.
    if (!Number.isFinite(z) || z <= 0) z = o.w > o.vw - 24 ? Math.max(0.6, sinirla((o.vw - 48) / o.w)) : 1;
    setD({ z: sinirla(z), x: (o.vw - o.w * sinirla(z)) / 2, y: 16 });
  });
  // Akış genişleyip daralınca (dal, adım ekleme ya da geri alma) kök sütun yerinde kalsın.
  const oncekiEn = useRef(0);
  useEffect(() => {
    const i = ic.current;
    if (!i) return;
    const o = new ResizeObserver(() => {
      const w = i.offsetWidth, m = dRef.current;
      if (m && oncekiEn.current && w !== oncekiEn.current) setD({ ...m, x: m.x + ((oncekiEn.current - w) / 2) * m.z });
      oncekiEn.current = w;
    });
    o.observe(i);
    return () => o.disconnect();
  }, []);
  useEffect(() => { if (d) try { localStorage.setItem(saklaAnahtari, String(Math.round(d.z * 100) / 100)); } catch { /* gizli sekme */ } }, [d?.z, saklaAnahtari]); // eslint-disable-line react-hooks/exhaustive-deps

  const yakinlas = useCallback((carpan: number, cx?: number, cy?: number) => {
    const o = olc(), m = dRef.current;
    if (!o || !m) return;
    const z = sinirla(m.z * carpan);
    const px = cx ?? o.vw / 2, py = cy ?? o.vh / 2;
    ayarla({ z, x: px - ((px - m.x) * z) / m.z, y: py - ((py - m.y) * z) / m.z });
  }, [ayarla]);

  // Tekerlek: ctrl ya da cmd ile yakınlaştır, değilse kaydır (shift ile yatay).
  useEffect(() => {
    const k = kap.current;
    if (!k) return;
    const f = (e: WheelEvent) => {
      const m = dRef.current;
      if (!m) return;
      if ((e.target as HTMLElement).closest?.("[data-kaydirilabilir]")) return;
      e.preventDefault();
      const r = k.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) { yakinlas(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0022)), e.clientX - r.left, e.clientY - r.top); return; }
      const carp = e.deltaMode === 1 ? 32 : 1;
      const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX, dy = e.shiftKey && !e.deltaX ? 0 : e.deltaY;
      ayarla({ z: m.z, x: m.x - dx * carp, y: m.y - dy * carp });
    };
    k.addEventListener("wheel", f, { passive: false });
    return () => k.removeEventListener("wheel", f);
  }, [ayarla, yakinlas]);

  // Sürükle ve iki parmakla sıkıştır.
  const isaretler = useRef(new Map<number, { x: number; y: number }>());
  const surukle = useRef<{ x: number; y: number; dx: number; dy: number; aktif: boolean; uzaklik?: number; z?: number } | null>(null);
  const yut = useRef(false);
  const [suruklen, setSuruklen] = useState(false);
  const basla = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if ((e.target as HTMLElement).closest(DUZENLENEBILIR) || !dRef.current) return;
    isaretler.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const m = dRef.current;
    if (isaretler.current.size === 2) {
      const [a, b] = [...isaretler.current.values()];
      surukle.current = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, dx: m.x, dy: m.y, aktif: true, uzaklik: Math.hypot(a.x - b.x, a.y - b.y), z: m.z };
      kap.current?.setPointerCapture(e.pointerId);
      return;
    }
    surukle.current = { x: e.clientX, y: e.clientY, dx: m.x, dy: m.y, aktif: false };
  };
  const hareket = (e: React.PointerEvent) => {
    const s = surukle.current, m = dRef.current;
    if (!s || !m || !isaretler.current.has(e.pointerId)) return;
    isaretler.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (isaretler.current.size === 2 && s.uzaklik && s.z) {
      const [a, b] = [...isaretler.current.values()];
      const r = kap.current!.getBoundingClientRect();
      const z = sinirla((s.z * Math.hypot(a.x - b.x, a.y - b.y)) / s.uzaklik);
      const cx = (a.x + b.x) / 2 - r.left, cy = (a.y + b.y) / 2 - r.top;
      const ox = s.x - r.left, oy = s.y - r.top;
      ayarla({ z, x: cx - ((ox - s.dx) * z) / s.z, y: cy - ((oy - s.dy) * z) / s.z });
      return;
    }
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (!s.aktif && Math.hypot(dx, dy) < 6) return;
    if (!s.aktif) { s.aktif = true; setSuruklen(true); kap.current?.setPointerCapture(e.pointerId); }
    ayarla({ z: m.z, x: s.dx + dx, y: s.dy + dy });
  };
  const bitir = (e: React.PointerEvent) => {
    isaretler.current.delete(e.pointerId);
    if (surukle.current?.aktif) { yut.current = true; setTimeout(() => { yut.current = false; }, 60); }
    setSuruklen(false);
    if (!isaretler.current.size) surukle.current = null;
    else if (isaretler.current.size === 1 && dRef.current) { const [p] = [...isaretler.current.values()]; surukle.current = { x: p.x, y: p.y, dx: dRef.current.x, dy: dRef.current.y, aktif: true }; }
  };

  // Mini harita: kartların içerik koordinatları (içerik değişince yeniden ölçülür) ve görünüm boyutu.
  const [harita, setHarita] = useState<{ x0: number; y0: number; w: number; h: number; l: HaritaKutu[] } | null>(null);
  const [boyut, setBoyut] = useState({ vw: 0, vh: 0 });
  useEffect(() => {
    const i = ic.current, k = kap.current;
    if (!i || !k) return;
    let raf = 0;
    const olcH = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const ir = i.getBoundingClientRect();
        const z = ir.width / (i.offsetWidth || 1) || 1;
        const l: HaritaKutu[] = [...i.querySelectorAll<HTMLElement>("[data-harita]")].map((e) => { const r = e.getBoundingClientRect(); return { x: (r.left - ir.left) / z, y: (r.top - ir.top) / z, w: r.width / z, h: r.height / z, t: e.dataset.harita ?? "" }; });
        const x0 = Math.min(0, ...l.map((b) => b.x)), y0 = Math.min(0, ...l.map((b) => b.y));
        const x1 = Math.max(i.offsetWidth, ...l.map((b) => b.x + b.w)), y1 = Math.max(i.offsetHeight, ...l.map((b) => b.y + b.h));
        setHarita({ x0, y0, w: x1 - x0, h: y1 - y0, l });
      });
    };
    const ro = new ResizeObserver(olcH); ro.observe(i);
    const rk = new ResizeObserver(() => setBoyut({ vw: k.clientWidth, vh: k.clientHeight })); rk.observe(k);
    const mo = new MutationObserver((m) => { if (m.some((x) => x.target !== i)) olcH(); });
    mo.observe(i, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] });
    olcH();
    return () => { ro.disconnect(); rk.disconnect(); mo.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  const haritaGoster = !!(harita && d && boyut.vw && (harita.w * d.z > boyut.vw + 24 || harita.h * d.z > boyut.vh + 24));
  const kucukEkran = boyut.vw < 640;
  const hEn = kucukEkran ? 120 : 176, hBoy = kucukEkran ? 92 : 128;
  const hOlcek = harita ? Math.min(hEn / harita.w, hBoy / harita.h) : 1;
  const haritaGit = (e: React.PointerEvent<HTMLDivElement>) => {
    const m = dRef.current, o = olc();
    if (!m || !o || !harita) return;
    const r = e.currentTarget.getBoundingClientRect();
    const cx = (e.clientX - r.left) / hOlcek + harita.x0, cy = (e.clientY - r.top) / hOlcek + harita.y0;
    ayarla({ z: m.z, x: o.vw / 2 - cx * m.z, y: o.vh / 2 - cy * m.z });
  };
  const haritaSurukle = useRef(false);

  const yuzde = Math.round((d?.z ?? 1) * 100);
  const Dugme = ({ etiket, onClick, children: c, genis }: { etiket: string; onClick: () => void; children: React.ReactNode; genis?: boolean }) => (
    <button type="button" onClick={onClick} aria-label={etiket} title={etiket} className={cn("flex h-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/[0.08] hover:text-white", genis ? "px-3 text-[12.5px] font-medium" : "w-8")}>{c}</button>
  );
  return (
    <div ref={kap} onPointerDown={basla} onPointerMove={hareket} onPointerUp={bitir} onPointerCancel={bitir}
      onClickCapture={(e) => { if (yut.current) { yut.current = false; e.stopPropagation(); e.preventDefault(); } }}
      style={{ backgroundPosition: d ? `${d.x}px ${d.y}px` : undefined, backgroundSize: `${22 * (d?.z ?? 1)}px ${22 * (d?.z ?? 1)}px`, touchAction: "none" }}
      className={cn("relative min-h-0 flex-1 select-none overflow-hidden bg-[radial-gradient(circle,rgba(255,255,255,0.07)_1px,transparent_1px)]", suruklen ? "cursor-grabbing" : "cursor-grab", className)}>
      <div ref={ic} className="absolute left-0 top-0 w-max origin-top-left cursor-auto" style={{ transform: d ? `translate(${d.x}px, ${d.y}px) scale(${d.z})` : undefined, visibility: d ? "visible" : "hidden" }}>
        {children}
      </div>
      {ust && <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[calc(100%-24px)] [&>*]:pointer-events-auto">{ust}</div>}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-0.5 rounded-full bd-panel p-1" onPointerDown={(e) => e.stopPropagation()}>
        <Dugme etiket="Uzaklaştır" onClick={() => yakinlas(1 / 1.2)}><Minus className="h-4 w-4" /></Dugme>
        <button type="button" onClick={() => { const o = olc(); if (o && d) ayarla({ z: 1, x: (o.vw - o.w) / 2, y: 16 }); }} title="Gerçek boyut" className="h-8 min-w-[46px] rounded-full px-1 text-[12px] tabular-nums text-white/65 hover:bg-white/[0.08] hover:text-white">{yuzde}</button>
        <Dugme etiket="Yakınlaştır" onClick={() => yakinlas(1.2)}><Plus className="h-4 w-4" /></Dugme>
        <Dugme etiket="Sığdır" onClick={() => sigdir()} genis>Sığdır</Dugme>
        {ek && <><span className="mx-0.5 h-5 w-px bg-white/10" />{ek}</>}
        {notEkle && <Dugme etiket="Not ekle" onClick={() => { const o = olc(), m = dRef.current; if (!o || !m) return; notEkle(Math.round((o.vw / 2 - m.x) / m.z - o.w / 2 - 120), Math.round((o.vh / 2 - m.y) / m.z - 50)); }}><StickyNote className="h-4 w-4" /></Dugme>}
      </div>
      {haritaGoster && harita && d && (
        <div className={cn("absolute right-3 z-10 overflow-hidden rounded-[14px] bd-panel p-1.5", kucukEkran ? "bottom-[58px]" : "bottom-3")} onPointerDown={(e) => e.stopPropagation()}>
          <div role="img" aria-label="Mini harita: tıkla ya da sürükle" title="Mini harita" className="relative cursor-pointer" style={{ width: harita.w * hOlcek, height: harita.h * hOlcek, touchAction: "none" }}
            onPointerDown={(e) => { haritaSurukle.current = true; e.currentTarget.setPointerCapture(e.pointerId); haritaGit(e); }}
            onPointerMove={(e) => { if (haritaSurukle.current) haritaGit(e); }}
            onPointerUp={() => { haritaSurukle.current = false; }} onPointerCancel={() => { haritaSurukle.current = false; }}>
            <span className="pointer-events-none absolute rounded-[4px] border border-white/60 bg-[#55d6fd]/[0.06]" style={{ left: Math.max(-2, (-d.x / d.z - harita.x0) * hOlcek), top: Math.max(-2, (-d.y / d.z - harita.y0) * hOlcek), width: Math.min(harita.w * hOlcek + 4, (boyut.vw / d.z) * hOlcek), height: Math.min(harita.h * hOlcek + 4, (boyut.vh / d.z) * hOlcek) }} />
            {harita.l.map((b, i) => <span key={i} className="pointer-events-none absolute rounded-[2px]" style={{ left: (b.x - harita.x0) * hOlcek, top: (b.y - harita.y0) * hOlcek, width: Math.max(2, b.w * hOlcek), height: Math.max(2, b.h * hOlcek), background: HARITA_RENK[b.t] ?? "rgba(255,255,255,0.3)" }} />)}
          </div>
        </div>
      )}
    </div>
  );
}
