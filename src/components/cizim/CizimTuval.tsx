"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useCizim } from "@/store/useCizim";
import { nesneCiz, isabet, tasi, cId, okKontrol, sinirlar, gorselYukle, type CizimNesne, type Nokta } from "@/lib/cizimMotor";

export type TuvalTutamak = { sigdir: () => void; yakinlas: (k: number) => void; olcek: () => number };

type Islem =
  | { tur: "ciz"; nesne: CizimNesne }
  | { tur: "tasi"; id: string; son: Nokta }
  | { tur: "uc"; id: string; hangi: 0 | 1 | "egri" }
  | { tur: "kaydir"; x: number; y: number; px: number; py: number }
  | { tur: "sil" };

/**
 * Çizim tuvali: artboard (taban görsel + vektör çizimler) ekrana sığdırılır, yakınlaştırılır/kaydırılır.
 * Tüm koordinatlar 0..1 normalize; ekran ↔ artboard dönüşümü burada yapılır.
 */
export const CizimTuval = forwardRef<TuvalTutamak, { akis: boolean; solPay?: number; sagPay?: number; ustPay?: number; altPay?: number; className?: string; children?: React.ReactNode; katman?: (ekran: (q: Nokta) => { x: number; y: number }) => React.ReactNode }>(function CizimTuval({ akis, solPay = 0, sagPay = 0, ustPay = 70, altPay = 64, className, children, katman }, ref) {
  const st = useCizim.getState;
  const nesneler = useCizim((s) => s.nesneler);
  const taban = useCizim((s) => s.taban);
  const boyut = useCizim((s) => s.boyut);
  const arac = useCizim((s) => s.arac);
  const secili = useCizim((s) => s.secili);
  const mod = useCizim((s) => s.mod);
  const rol = useCizim((s) => s.rol);
  const kalinlik = useCizim((s) => s.kalinlik);
  const kapRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [gorunum, setGorunum] = useState({ olcek: 1, x: 0, y: 0 });
  const gRef = useRef(gorunum); gRef.current = gorunum;
  const islem = useRef<Islem | null>(null);
  const [taslak, setTaslak] = useState<CizimNesne | null>(null);
  const [metinGir, setMetinGir] = useState<{ n: Nokta; deger: string } | null>(null);
  const [imlec, setImlec] = useState<Nokta | null>(null);
  const bosluk = useRef(false);
  const parmak = useRef(new Map<number, { x: number; y: number }>());
  const pinc = useRef<{ d: number; olcek: number; cx: number; cy: number; x: number; y: number } | null>(null);
  const [, zorla] = useState(0);

  /* Taban görsel */
  useEffect(() => {
    imgRef.current = null;
    if (!taban) { zorla((v) => v + 1); return; }
    let iptal = false;
    void gorselYukle(taban).then((i) => { if (!iptal) { imgRef.current = i; zorla((v) => v + 1); } }).catch(() => {});
    return () => { iptal = true; };
  }, [taban]);

  /* Sığdır */
  const sigdir = useCallback(() => {
    const k = kapRef.current; if (!k) return;
    const r = k.getBoundingClientRect();
    // Üstte araç çubuğu, altta komut kutusu, yanlarda anlam şeridi ve çekmece için pay
    const ust = ustPay, alt = altPay, yan = 24;
    const gen = r.width - yan * 2 - solPay - sagPay;
    const o = Math.max(0.05, Math.min(gen / boyut.W, (r.height - ust - alt) / boyut.H));
    setGorunum({ olcek: o, x: yan + solPay + (gen - boyut.W * o) / 2, y: ust + (r.height - ust - alt - boyut.H * o) / 2 });
  }, [boyut.W, boyut.H, solPay, sagPay, ustPay, altPay]);
  useEffect(() => { sigdir(); }, [sigdir]);
  useEffect(() => { const k = kapRef.current; if (!k) return; const ro = new ResizeObserver(() => sigdir()); ro.observe(k); return () => ro.disconnect(); }, [sigdir]);

  const yakinlas = (k: number, cx?: number, cy?: number) => {
    const r = kapRef.current?.getBoundingClientRect(); if (!r) return;
    const g = gRef.current;
    const ox = cx ?? r.width / 2, oy = cy ?? r.height / 2;
    const yeni = Math.max(0.05, Math.min(8, g.olcek * k));
    const f = yeni / g.olcek;
    setGorunum({ olcek: yeni, x: ox - (ox - g.x) * f, y: oy - (oy - g.y) * f });
  };
  useImperativeHandle(ref, () => ({ sigdir, yakinlas: (k: number) => yakinlas(k), olcek: () => gRef.current.olcek }));

  /* Ekran ↔ normalize */
  const normal = (e: { clientX: number; clientY: number }): Nokta => {
    const r = kapRef.current!.getBoundingClientRect(); const g = gRef.current;
    return { x: (e.clientX - r.left - g.x) / (boyut.W * g.olcek), y: (e.clientY - r.top - g.y) / (boyut.H * g.olcek) };
  };

  /* Çizim */
  const ciz = useCallback((faz?: number) => {
    const cv = cvRef.current, k = kapRef.current; if (!cv || !k) return;
    const r = k.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(r.width * dpr) || cv.height !== Math.round(r.height * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
    const ctx = cv.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    const g = gRef.current;
    ctx.setTransform(dpr * g.olcek, 0, 0, dpr * g.olcek, dpr * g.x, dpr * g.y);
    const { W, H } = boyut;
    // Artboard
    const rk = 14 / g.olcek;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 48 / g.olcek; ctx.shadowOffsetY = 12 / g.olcek;
    ctx.fillStyle = mod === "eskiz" && !imgRef.current ? "#f8f7f4" : "#16181b"; ctx.beginPath(); ctx.roundRect(0, 0, W, H, rk); ctx.fill(); ctx.restore();
    if (imgRef.current) { ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, W, H, rk); ctx.clip(); ctx.drawImage(imgRef.current, 0, 0, W, H); ctx.restore(); }
    else if (mod !== "eskiz") {
      // Boş taban: hafif ızgara
      ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = 1 / g.olcek;
      for (let x = 0; x <= W; x += W / 16) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y <= H; y += H / 9) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.restore();
    }
    const l = useCizim.getState().nesneler;
    const sec = useCizim.getState().secili;
    // Eskizde mürekkep koyu (kâğıt üstü, numarasız); diğer modlarda rol rengi + numara
    const murekkep = mod === "eskiz" && !imgRef.current ? "#1f2328" : undefined;
    l.forEach((n, i) => nesneCiz(ctx, n, W, H, { numara: mod === "eskiz" ? undefined : i + 1, secili: n.id === sec, akis: faz !== undefined && n.tur === "ok" ? (faz + i * 0.17) % 1 : undefined, olcek: 1 / Math.max(0.5, g.olcek), murekkep }));
    if (taslak) nesneCiz(ctx, taslak, W, H, { murekkep });
    // Seçili ok/şekil tutamakları
    const s = l.find((n) => n.id === sec);
    if (s && (s.tur === "ok" || s.tur === "kare" || s.tur === "daire")) {
      const tut = s.tur === "ok" ? [s.noktalar[0], s.noktalar[1], okKontrol(s)] : [s.noktalar[1]];
      const r0 = 7 / g.olcek;
      tut.forEach((q, i) => { ctx.beginPath(); ctx.arc(q.x * W, q.y * H, s.tur === "ok" && i === 2 ? r0 * 0.85 : r0, 0, Math.PI * 2); ctx.fillStyle = s.tur === "ok" && i === 2 ? "#22d3ee" : "#ffffff"; ctx.fill(); ctx.lineWidth = 2 / g.olcek; ctx.strokeStyle = "#0b0d10"; ctx.stroke(); });
    }
    // Silgi / kalem imleci
    if (imlec && (arac === "kalem" || arac === "silgi")) {
      ctx.beginPath(); ctx.arc(imlec.x * W, imlec.y * H, (arac === "silgi" ? 0.02 : kalinlik / 2) * Math.min(W, H), 0, Math.PI * 2);
      ctx.lineWidth = 1.5 / g.olcek; ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.stroke();
    }
  }, [boyut, mod, taslak, imlec, arac, kalinlik]);

  useEffect(() => { ciz(); });
  /* Hareket önizleme döngüsü */
  useEffect(() => {
    if (!akis) return;
    let ram = 0; const bas = performance.now();
    const tik = (n: number) => { ciz(((n - bas) / 1800) % 1); ram = requestAnimationFrame(tik); };
    ram = requestAnimationFrame(tik);
    return () => { cancelAnimationFrame(ram); ciz(); };
  }, [akis, ciz]);

  /* Kısayollar: boşluk = geçici el */
  useEffect(() => {
    const d = (e: KeyboardEvent) => { if (e.code === "Space" && !/^(INPUT|TEXTAREA)$/.test((e.target as HTMLElement)?.tagName)) { bosluk.current = true; if (kapRef.current) kapRef.current.style.cursor = "grab"; } };
    const u = (e: KeyboardEvent) => { if (e.code === "Space") { bosluk.current = false; if (kapRef.current) kapRef.current.style.cursor = ""; } };
    window.addEventListener("keydown", d); window.addEventListener("keyup", u);
    return () => { window.removeEventListener("keydown", d); window.removeEventListener("keyup", u); };
  }, []);

  /* Tekerlek: imleç çevresinde yakınlaş (kaydırma çubuğu yok, tasarım araçlarındaki gibi) */
  useEffect(() => {
    const k = kapRef.current; if (!k) return;
    const f = (e: WheelEvent) => {
      e.preventDefault();
      const r = k.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > Math.abs(e.deltaX)) yakinlas(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), e.clientX - r.left, e.clientY - r.top);
      else setGorunum((g) => ({ ...g, x: g.x - e.deltaX }));
    };
    k.addEventListener("wheel", f, { passive: false });
    return () => k.removeEventListener("wheel", f);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const tol = () => 10 / (Math.min(boyut.W, boyut.H) * gRef.current.olcek);

  const basla = (e: React.PointerEvent) => {
    if (metinGir) return;
    parmak.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (parmak.current.size === 2) {
      // İki parmak: yakınlaştır/kaydır
      const [a, b] = [...parmak.current.values()];
      const r = kapRef.current!.getBoundingClientRect();
      pinc.current = { d: Math.hypot(a.x - b.x, a.y - b.y), olcek: gRef.current.olcek, cx: (a.x + b.x) / 2 - r.left, cy: (a.y + b.y) / 2 - r.top, x: gRef.current.x, y: gRef.current.y };
      islem.current = null; setTaslak(null);
      return;
    }
    const q = normal(e);
    if (arac === "el" || bosluk.current || e.button === 1) { islem.current = { tur: "kaydir", x: e.clientX, y: e.clientY, px: gRef.current.x, py: gRef.current.y }; return; }
    const kal = st().kalinlik;
    const yeniNesne = (tur: CizimNesne["tur"]): CizimNesne => ({ id: cId(), tur, rol: mod === "eskiz" ? "not" : st().rol, noktalar: [q, q], kalinlik: tur === "kalem" ? kal : Math.max(0.006, kal), });
    if (arac === "sec") {
      const s = st().nesneler.find((n) => n.id === st().secili);
      // Önce tutamaklar
      if (s && (s.tur === "ok" || s.tur === "kare" || s.tur === "daire")) {
        const t = tol() * 1.6;
        const yakin = (p: Nokta) => Math.hypot(p.x - q.x, p.y - q.y) < t;
        if (s.tur === "ok") {
          if (yakin(okKontrol(s))) { st().anlik(); islem.current = { tur: "uc", id: s.id, hangi: "egri" }; return; }
          if (yakin(s.noktalar[0])) { st().anlik(); islem.current = { tur: "uc", id: s.id, hangi: 0 }; return; }
          if (yakin(s.noktalar[1])) { st().anlik(); islem.current = { tur: "uc", id: s.id, hangi: 1 }; return; }
        } else if (yakin(s.noktalar[1])) { st().anlik(); islem.current = { tur: "uc", id: s.id, hangi: 1 }; return; }
      }
      const h = isabet(st().nesneler, q, tol());
      st().sec(h?.id ?? null);
      if (h) { st().anlik(); islem.current = { tur: "tasi", id: h.id, son: q }; }
      return;
    }
    if (arac === "silgi") { st().anlik(); islem.current = { tur: "sil" }; silAt(q); return; }
    if (arac === "metin") { setMetinGir({ n: q, deger: "" }); return; }
    const n = yeniNesne(arac === "kalem" ? "kalem" : arac === "ok" ? "ok" : arac === "kare" ? "kare" : "daire");
    if (n.tur === "kalem") n.noktalar = [q];
    islem.current = { tur: "ciz", nesne: n }; setTaslak(n);
  };

  const silAt = (q: Nokta) => {
    const h = isabet(useCizim.getState().nesneler, q, 0.02);
    if (h) useCizim.getState().nesneleriYaz(useCizim.getState().nesneler.filter((n) => n.id !== h.id));
  };

  const surukle = (e: React.PointerEvent) => {
    if (parmak.current.has(e.pointerId)) parmak.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinc.current && parmak.current.size === 2) {
      const [a, b] = [...parmak.current.values()];
      const p0 = pinc.current, r = kapRef.current!.getBoundingClientRect();
      const yeni = Math.max(0.05, Math.min(8, p0.olcek * (Math.hypot(a.x - b.x, a.y - b.y) / p0.d)));
      const cx = (a.x + b.x) / 2 - r.left, cy = (a.y + b.y) / 2 - r.top, f = yeni / p0.olcek;
      setGorunum({ olcek: yeni, x: cx - (p0.cx - p0.x) * f, y: cy - (p0.cy - p0.y) * f });
      return;
    }
    const q = normal(e);
    setImlec(q);
    const is = islem.current; if (!is) return;
    if (is.tur === "kaydir") { setGorunum((g) => ({ ...g, x: is.px + (e.clientX - is.x), y: is.py + (e.clientY - is.y) })); return; }
    if (is.tur === "sil") { silAt(q); return; }
    if (is.tur === "tasi") {
      const n = useCizim.getState().nesneler.find((x) => x.id === is.id); if (!n) return;
      useCizim.getState().nesneleriYaz(useCizim.getState().nesneler.map((x) => (x.id === is.id ? tasi(x, q.x - is.son.x, q.y - is.son.y) : x)));
      is.son = q; return;
    }
    if (is.tur === "uc") {
      const n = useCizim.getState().nesneler.find((x) => x.id === is.id); if (!n) return;
      if (is.hangi === "egri") useCizim.getState().nesneGuncelle(n.id, { egri: q });
      else useCizim.getState().nesneGuncelle(n.id, { noktalar: n.noktalar.map((p, i) => (i === is.hangi ? q : p)) });
      return;
    }
    const n = is.nesne;
    if (n.tur === "kalem") {
      const son = n.noktalar[n.noktalar.length - 1];
      if (Math.hypot(son.x - q.x, son.y - q.y) * Math.min(boyut.W, boyut.H) * gRef.current.olcek < 2) return;
      n.noktalar = [...n.noktalar, q];
    } else n.noktalar = [n.noktalar[0], e.shiftKey && (n.tur === "kare" || n.tur === "daire") ? kareKilit(n.noktalar[0], q) : q];
    setTaslak({ ...n });
  };
  const kareKilit = (a: Nokta, b: Nokta): Nokta => { const o = boyut.W / boyut.H; const dx = b.x - a.x, dy = b.y - a.y; const m = Math.max(Math.abs(dx), Math.abs(dy) * (1 / o)); return { x: a.x + Math.sign(dx || 1) * m, y: a.y + Math.sign(dy || 1) * m * o }; };

  const bitir = (e: React.PointerEvent) => {
    parmak.current.delete(e.pointerId);
    if (parmak.current.size < 2) pinc.current = null;
    const is = islem.current; islem.current = null;
    if (!is || is.tur !== "ciz") return;
    const n = is.nesne; setTaslak(null);
    const b = sinirlar(n);
    const kucuk = n.tur === "kalem" ? n.noktalar.length < 2 : Math.hypot(b.x2 - b.x1, b.y2 - b.y1) < 0.012;
    if (kucuk) return;
    st().nesneleriYaz([...st().nesneler, n], true);
    if (n.tur !== "kalem") st().sec(n.id);
  };

  const metinBitir = () => {
    if (!metinGir) return;
    const d = metinGir.deger.trim();
    if (d) { const n: CizimNesne = { id: cId(), tur: "metin", rol: st().rol === "hareket" ? "not" : st().rol, noktalar: [metinGir.n], kalinlik: 0.006, metin: d.slice(0, 80) }; st().nesneleriYaz([...st().nesneler, n], true); st().sec(n.id); }
    setMetinGir(null);
  };

  const imlecSinif = arac === "el" ? "cursor-grab active:cursor-grabbing" : arac === "sec" ? "cursor-default" : arac === "metin" ? "cursor-text" : arac === "kalem" || arac === "silgi" ? "cursor-none" : "cursor-crosshair";
  const g = gorunum;

  return (
    <div ref={kapRef} className={cn("relative touch-none select-none overflow-hidden", imlecSinif, className)}
      onPointerDown={basla} onPointerMove={surukle} onPointerUp={bitir} onPointerCancel={bitir} onPointerLeave={() => setImlec(null)}
      onDoubleClick={(e) => { const h = isabet(st().nesneler, normal(e), tol()); if (h?.tur === "ok" && h.egri) { st().anlik(); st().nesneGuncelle(h.id, { egri: undefined }); } }}>
      <canvas ref={cvRef} className="absolute inset-0 h-full w-full" aria-label="Çizim tuvali" />
      {metinGir && (
        <input autoFocus value={metinGir.deger} onChange={(e) => setMetinGir({ ...metinGir, deger: e.target.value })} onBlur={metinBitir}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") metinBitir(); if (e.key === "Escape") setMetinGir(null); }}
          placeholder="Notu yaz, Enter" aria-label="Tuval notu"
          className="absolute z-20 h-9 min-w-[180px] rounded-full bg-[#0b0d10]/90 px-3.5 text-[13px] font-bold text-white outline-none ring-2 ring-aksan placeholder:font-medium placeholder:text-white/50"
          style={{ left: g.x + metinGir.n.x * boyut.W * g.olcek, top: g.y + metinGir.n.y * boyut.H * g.olcek - 18 }} />
      )}
      {katman?.((q) => ({ x: g.x + q.x * boyut.W * g.olcek, y: g.y + q.y * boyut.H * g.olcek }))}
      {children}
    </div>
  );
});
