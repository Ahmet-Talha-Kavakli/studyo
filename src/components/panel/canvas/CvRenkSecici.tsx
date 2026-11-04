"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pipette, ChevronsUpDown } from "lucide-react";
import { CV } from "@/lib/canvasTema";

/* ============================================================
   RGB RENK SEÇİCİ — referans birebir (14.05.53).

   Yapı (üstten alta):
     · SV alanı (saturation-value karesi) — seçili hue'ya göre gradyan
     · Satır: damlalık · mevcut renk dairesi · hue slider (gökkuşağı)
     · 3 sayı girişi (R/G/B) + altında etiketler + format değiştirici
   Ölçü: yaklaşık 233×250, radius 10, zemin #2A2C2E
   ============================================================ */

/* ── renk dönüşümleri ── */
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
  let h = 0;
  if (d) {
    if (max === R) h = 60 * (((G - B) / d) % 6);
    else if (max === G) h = 60 * ((B - R) / d + 2);
    else h = 60 * ((R - G) / d + 4);
  }
  if (h < 0) h += 360;
  return [h, max ? d / max : 0, max];
}

function hexToRgb(hex: string): [number, number, number] {
  const t = hex.replace("#", "");
  const n = t.length === 3 ? t.split("").map((c) => c + c).join("") : t;
  return [parseInt(n.slice(0, 2), 16) || 0, parseInt(n.slice(2, 4), 16) || 0, parseInt(n.slice(4, 6), 16) || 0];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function CvRenkSecici({
  renk, onRenk, onKapat, stil,
}: {
  renk: string;
  onRenk: (hex: string) => void;
  onKapat: () => void;
  stil?: React.CSSProperties;
}) {
  const [r, g, b] = hexToRgb(renk);
  const [h, s, v] = rgbToHsv(r, g, b);
  const [hue, setHue] = useState(h);
  const [mod, setMod] = useState<"rgb" | "hex">("rgb");
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const surukleRef = useRef<"sv" | "hue" | null>(null);

  /* Dışarıdan renk değişirse hue'yu senkronla (gri tonlarda hue 0'a düşmesin) */
  useEffect(() => { if (s > 0.02) setHue(h); }, [h, s]);

  const svSec = (e: MouseEvent | React.MouseEvent) => {
    const rect = svRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ns = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const nv = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
    const [nr, ng, nb] = hsvToRgb(hue, ns, nv);
    onRenk(rgbToHex(nr, ng, nb));
  };

  const hueSec = (e: MouseEvent | React.MouseEvent) => {
    const rect = hueRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nh = Math.max(0, Math.min(359, ((e.clientX - rect.left) / rect.width) * 360));
    setHue(nh);
    const [nr, ng, nb] = hsvToRgb(nh, Math.max(s, 0.02), v || 1);
    onRenk(rgbToHex(nr, ng, nb));
  };

  /* sürükleme — SV alanı ve hue slider */
  useEffect(() => {
    const hareket = (e: MouseEvent) => {
      if (surukleRef.current === "sv") svSec(e);
      else if (surukleRef.current === "hue") hueSec(e);
    };
    const birak = () => { surukleRef.current = null; };
    window.addEventListener("mousemove", hareket);
    window.addEventListener("mouseup", birak);
    return () => {
      window.removeEventListener("mousemove", hareket);
      window.removeEventListener("mouseup", birak);
    };
  });

  /* dışına tıkla → kapat */
  const kapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const dis = (e: MouseEvent) => {
      if (!kapRef.current?.contains(e.target as Node)) onKapat();
    };
    /* bir sonraki kareye ertele: açılış tıklaması hemen kapatmasın */
    const t = setTimeout(() => document.addEventListener("mousedown", dis), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", dis); };
  }, [onKapat]);

  const kanal = (i: 0 | 1 | 2, deger: string) => {
    const n = [r, g, b] as [number, number, number];
    n[i] = Math.max(0, Math.min(255, Number(deger) || 0));
    onRenk(rgbToHex(n[0], n[1], n[2]));
  };

  return (
    <motion.div
      ref={kapRef}
      data-ui
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.14 }}
      onMouseDown={(e) => e.stopPropagation()}
      className="z-[60] overflow-hidden rounded-[10px]"
      style={{
        width: 233, background: "#2A2C2E",
        border: `1px solid ${CV.barKenar}`,
        boxShadow: "none",
        ...stil,
      }}>

      {/* ── SV alanı — sol-üst beyaz, sağ-üst saf hue, alt siyah ── */}
      <div
        ref={svRef}
        onMouseDown={(e) => { surukleRef.current = "sv"; svSec(e); }}
        className="relative cursor-crosshair"
        style={{
          height: 137,
          background: `
            linear-gradient(to top, #000, transparent),
            linear-gradient(to right, #FFF, hsl(${hue} 100% 50%))`,
        }}>
        <span className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
          style={{
            left: `${s * 100}%`, top: `${(1 - v) * 100}%`,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.4)",
          }} />
      </div>

      {/* ── damlalık · renk dairesi · hue slider ── */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <button
          aria-label="Damlalık"
          onClick={async () => {
            /* EyeDropper API destekleniyorsa gerçek ekran seçimi */
            const ED = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
            if (!ED) return;
            try {
              const sonuc = await new ED().open();
              onRenk(sonuc.sRGBHex.toUpperCase());
            } catch { /* kullanıcı iptal etti */ }
          }}
          className="shrink-0 text-[#9A9B9D] transition-colors hover:text-white">
          <Pipette className="h-[18px] w-[18px]" />
        </button>

        <span className="h-6 w-6 shrink-0 rounded-full"
          style={{ background: renk, boxShadow: "0 0 0 1px rgba(255,255,255,0.2)" }} />

        <div
          ref={hueRef}
          onMouseDown={(e) => { surukleRef.current = "hue"; hueSec(e); }}
          className="relative h-3 flex-1 cursor-pointer rounded-full"
          style={{
            background: "linear-gradient(to right, #F00 0%, #FF0 17%, #0F0 33%, #0FF 50%, #00F 67%, #F0F 83%, #F00 100%)",
          }}>
          <span className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
            style={{ left: `${(hue / 360) * 100}%`, background: `hsl(${hue} 100% 50%)` }} />
        </div>
      </div>

      {/* ── R / G / B girişleri + format değiştirici ── */}
      <div className="flex items-end gap-1.5 px-3 pb-3">
        {mod === "rgb" ? (
          ([["R", r, 0], ["G", g, 1], ["B", b, 2]] as const).map(([et, deg, i]) => (
            <label key={et} className="flex-1">
              <input
                type="number" min={0} max={255} value={deg}
                onChange={(e) => kanal(i as 0 | 1 | 2, e.target.value)}
                aria-label={`${et} kanalı`}
                className="h-8 w-full rounded-[6px] text-center text-[13px] text-white outline-none"
                style={{ background: "#1F2123", border: `1px solid ${CV.handleKenar}` }}
              />
              <span className="mt-1 block text-center text-[11px]" style={{ color: "#9A9B9D" }}>{et}</span>
            </label>
          ))
        ) : (
          <label className="flex-1">
            <input
              value={renk}
              onChange={(e) => {
                const t = e.target.value.trim();
                if (/^#?[0-9a-fA-F]{6}$/.test(t)) onRenk(t.startsWith("#") ? t.toUpperCase() : `#${t.toUpperCase()}`);
              }}
              aria-label="HEX kodu"
              className="h-8 w-full rounded-[6px] text-center text-[13px] uppercase text-white outline-none"
              style={{ background: "#1F2123", border: `1px solid ${CV.handleKenar}` }}
            />
            <span className="mt-1 block text-center text-[11px]" style={{ color: "#9A9B9D" }}>HEX</span>
          </label>
        )}
        <button
          onClick={() => setMod(mod === "rgb" ? "hex" : "rgb")}
          aria-label="Renk biçimini değiştir"
          className="mb-[18px] flex h-8 w-7 shrink-0 items-center justify-center rounded-[6px] text-[#9A9B9D] transition-colors hover:text-white">
          <ChevronsUpDown className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
