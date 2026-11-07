"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMontaj, klipSure, kfAnlikDeger, type MontajProje, type MontajKlip } from "@/store/useMontaj";
import { klipKutusu, type MedyaHavuzu } from "@/lib/montajMotor";
import { donusumYaz } from "./ortak";

type Kutu = { cx: number; cy: number; w: number; h: number; donme: number };
type Islem = { mod: "tasi" | "olcek" | "dondur"; x0: number; y0: number; k: MontajKlip; kutu: Kutu; d0: { x: number; y: number; olcek: number; donme: number } };

/**
 * Tuval üstü düzenleme katmanı: tıkla-seç, sürükle-taşı, köşeden ölçekle, tutamaktan döndür.
 * Merkez çizgilerine yapışır ve kılavuz gösterir; yazılarda çift tıklayınca yerinde düzenleme açılır.
 * Kutular, çizimle aynı hesaptan (klipKutusu) gelir.
 */
export function MontajTuval({ proje, havuz, W, H, gw, gh }: { proje: MontajProje; havuz: MedyaHavuzu; W: number; H: number; gw: number; gh: number }) {
  const playhead = useMontaj((s) => s.playhead);
  const seciliId = useMontaj((s) => s.seciliKlipId);
  const oynuyor = useMontaj((s) => s.oynuyor);
  const st = useMontaj.getState;
  const [islem, setIslem] = useState<Islem | null>(null);
  const [kilavuz, setKilavuz] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });
  const [duzenle, setDuzenle] = useState<string | null>(null);
  const kapRef = useRef<HTMLDivElement>(null);
  const o = gw / W; // canvas → CSS

  // O anda görünür, seçilebilir klipler (üstteki önce)
  const gorunur: MontajKlip[] = [];
  for (const kat of proje.katmanlar.filter((k) => k.tur === "metin" && !k.gizli && !k.kilitli)) for (const k of kat.klipler) if (playhead >= k.baslangic && playhead < k.baslangic + klipSure(k)) gorunur.push(k);
  for (const kat of proje.katmanlar.filter((k) => k.tur === "video" && !k.gizli && !k.kilitli)) for (const k of kat.klipler) if (playhead >= k.baslangic && playhead < k.baslangic + klipSure(k)) gorunur.push(k);
  const secili = gorunur.find((k) => k.id === seciliId) ?? null;
  const kutu = secili ? klipKutusu(secili, playhead, W, H, havuz) : null;

  const icerde = (k: Kutu, px: number, py: number) => {
    const a = (-k.donme * Math.PI) / 180, dx = px - k.cx, dy = py - k.cy;
    const rx = dx * Math.cos(a) - dy * Math.sin(a), ry = dx * Math.sin(a) + dy * Math.cos(a);
    return Math.abs(rx) <= k.w / 2 && Math.abs(ry) <= k.h / 2;
  };
  const tuvalNokta = (e: { clientX: number; clientY: number }) => {
    const r = kapRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / o, y: (e.clientY - r.top) / o };
  };
  const anlik = (k: MontajKlip) => {
    const y = st().playhead - k.baslangic;
    return { x: kfAnlikDeger(k, "x", y), y: kfAnlikDeger(k, "y", y), olcek: kfAnlikDeger(k, "olcek", y), donme: kfAnlikDeger(k, "donme", y) };
  };

  const basla = (e: React.PointerEvent, mod: Islem["mod"], k: MontajKlip, kt: Kutu) => {
    e.stopPropagation(); e.preventDefault();
    st().oynatDurdur(false);
    st().anlikKaydet(proje.id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = tuvalNokta(e);
    setIslem({ mod, x0: p.x, y0: p.y, k, kutu: kt, d0: anlik(k) });
  };
  const tasi = (e: React.PointerEvent) => {
    if (!islem) return;
    const p = tuvalNokta(e);
    const { k, kutu: kt, d0 } = islem;
    if (islem.mod === "tasi") {
      let ncx = kt.cx + (p.x - islem.x0), ncy = kt.cy + (p.y - islem.y0);
      const esik = 10 / o;
      const sx = !e.shiftKey && Math.abs(ncx - W / 2) < esik, sy = !e.shiftKey && Math.abs(ncy - H / 2) < esik;
      if (sx) ncx = W / 2; if (sy) ncy = H / 2;
      setKilavuz({ x: sx, y: sy });
      donusumYaz(proje.id, k, { x: d0.x + ((ncx - kt.cx) / W) * 100, y: d0.y + ((ncy - kt.cy) / H) * 100 });
    } else if (islem.mod === "olcek") {
      const r0 = Math.hypot(islem.x0 - kt.cx, islem.y0 - kt.cy), r1 = Math.hypot(p.x - kt.cx, p.y - kt.cy);
      donusumYaz(proje.id, k, { olcek: Math.max(5, Math.min(500, d0.olcek * (r1 / Math.max(1, r0)))) });
    } else {
      const a0 = Math.atan2(islem.y0 - kt.cy, islem.x0 - kt.cx), a1 = Math.atan2(p.y - kt.cy, p.x - kt.cx);
      let dn = d0.donme + ((a1 - a0) * 180) / Math.PI;
      dn = ((dn + 540) % 360) - 180;
      if (!e.shiftKey) for (const s of [-180, -90, 0, 90, 180]) if (Math.abs(dn - s) < 4) dn = s;
      donusumYaz(proje.id, k, { donme: Math.round(dn) });
    }
  };
  const bitir = () => { setIslem(null); setKilavuz({ x: false, y: false }); };

  /* Boş tuvale tıklama: altındaki en üst klibi seç. */
  const tikla = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const p = tuvalNokta(e);
    for (const k of gorunur) {
      const kt = klipKutusu(k, playhead, W, H, havuz);
      if (kt && icerde(kt, p.x, p.y)) { st().klipSec(k.id); if (k.id === seciliId) basla(e, "tasi", k, kt); return; }
    }
    st().klipSec(null);
  };

  useEffect(() => { if (!secili || secili.tur !== "metin") setDuzenle(null); }, [secili]);

  const yazi = duzenle ? gorunur.find((k) => k.id === duzenle) : null;
  const altta = !!kutu && (kutu.cy - kutu.h / 2) * o < 34;

  return (
    <div ref={kapRef} className={cn("absolute inset-0", oynuyor && "pointer-events-none")} onPointerDown={tikla} onPointerMove={tasi} onPointerUp={bitir}
      onDoubleClick={() => { if (secili?.tur === "metin" && !secili.oge) setDuzenle(secili.id); }}>
      {/* Merkez kılavuzları */}
      {kilavuz.x && <span className="pointer-events-none absolute bottom-0 top-0 w-px bg-fuchsia-400" style={{ left: gw / 2 }} />}
      {kilavuz.y && <span className="pointer-events-none absolute left-0 right-0 h-px bg-fuchsia-400" style={{ top: gh / 2 }} />}
      {secili && kutu && !oynuyor && (
        <div className="absolute" style={{ left: (kutu.cx - kutu.w / 2) * o, top: (kutu.cy - kutu.h / 2) * o, width: kutu.w * o, height: kutu.h * o, transform: `rotate(${kutu.donme}deg)` }}>
          <div onPointerDown={(e) => basla(e, "tasi", secili, kutu)} className="absolute inset-0 cursor-move outline outline-[1.5px] outline-white" />
          {[[0, 0, "nwse"], [1, 0, "nesw"], [0, 1, "nesw"], [1, 1, "nwse"]].map(([ax, ay, c]) => (
            <span key={`${ax}${ay}`} onPointerDown={(e) => basla(e, "olcek", secili, kutu)}
              className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-1 ring-black/30"
              style={{ left: `${(ax as number) * 100}%`, top: `${(ay as number) * 100}%`, cursor: `${c}-resize` }} />
          ))}
          {/* Döndürme tutamağı: kutu kadrajın üstüne dayanıyorsa kutunun içinde, üst kenarda durur (yoksa görünmez kalıyordu) */}
          <span className={cn("absolute left-1/2 h-5 w-px -translate-x-1/2 bg-white", altta ? "hidden" : "top-0 -translate-y-full")} />
          <span onPointerDown={(e) => basla(e, "dondur", secili, kutu)} title="Döndür (Shift: serbest)"
            className={cn("absolute left-1/2 flex h-6 w-6 -translate-x-1/2 cursor-grab items-center justify-center rounded-full bg-white text-black ring-1 ring-black/20", altta ? "top-2.5" : "top-0 -translate-y-[calc(100%+18px)]")}>
            <RotateCw className="h-3 w-3" />
          </span>
          {islem && (
            <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-1.5 py-0.5 text-[10.5px] tabular-nums text-white">
              {islem.mod === "olcek" ? `yüzde ${Math.round(kfAnlikDeger(secili, "olcek", playhead - secili.baslangic))}` : islem.mod === "dondur" ? `${Math.round(kfAnlikDeger(secili, "donme", playhead - secili.baslangic))}°` : `${Math.round(kfAnlikDeger(secili, "x", playhead - secili.baslangic))}, ${Math.round(kfAnlikDeger(secili, "y", playhead - secili.baslangic))}`}
            </span>
          )}
        </div>
      )}
      {yazi && kutu && (
        <textarea autoFocus defaultValue={yazi.metin} aria-label="Yazıyı düzenle"
          onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey)) { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } }}
          onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== yazi.metin) { st().anlikKaydet(proje.id); st().klipGuncelle(proje.id, yazi.id, { metin: v, ad: v.slice(0, 30) }); } setDuzenle(null); }}
          className="absolute z-10 resize-none rounded-lg bg-black/85 p-2 text-center text-[14px] font-semibold text-white outline-none ring-2 ring-white"
          style={{ left: Math.max(4, (kutu.cx - Math.max(kutu.w, 220 / o) / 2) * o), top: (kutu.cy - kutu.h / 2) * o, width: Math.max(kutu.w * o, 220), minHeight: Math.max(kutu.h * o, 56) }} />
      )}
    </div>
  );
}
