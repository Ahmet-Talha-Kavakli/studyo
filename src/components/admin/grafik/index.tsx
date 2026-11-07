"use client";

import { useId } from "react";
import { motion } from "framer-motion";

/* Bağımlılıksız SVG grafik kütüphanesi — admin apple-glass diline uyumlu.
   Tümü responsive (viewBox), animasyonlu (framer-motion path/opacity).
   Renkler .admin-kapsam token'larından (var(--ad-aksan) vb). */

const AKSAN = "var(--ad-aksan)";

function normalize(veri: number[]) {
  const max = Math.max(...veri, 1);
  const min = Math.min(...veri, 0);
  const aralik = max - min || 1;
  return { max, min, aralik };
}

/** Küçük sparkline — metrik kartı içi. */
export function Sparkline({ veri, renk = AKSAN, yukseklik = 32 }: { veri: number[]; renk?: string; yukseklik?: number }) {
  if (!veri.length) return null;
  const G = 100, Y = yukseklik;
  const { min, aralik } = normalize(veri);
  const nokta = veri.map((v, i) => [(veri.length > 1 ? i / (veri.length - 1) : 0.5) * G, Y - ((v - min) / aralik) * (Y - 4) - 2]);
  const d = nokta.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${G} ${Y}`} preserveAspectRatio="none" className="h-8 w-full" style={{ overflow: "visible" }}>
      <motion.path d={d} fill="none" stroke={renk} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} />
    </svg>
  );
}

/** Alan grafiği — dolgu gradyanı + çizgi. */
export function AlanGrafik({ veri, renk = AKSAN, yukseklik = 180, etiketler }: { veri: number[]; renk?: string; yukseklik?: number; etiketler?: string[] }) {
  const gid = useId();
  if (!veri.length) return null;
  const G = 320, Y = yukseklik;
  const { min, aralik } = normalize(veri);
  const nokta = veri.map((v, i) => [(veri.length > 1 ? i / (veri.length - 1) : 0.5) * G, Y - ((v - min) / aralik) * (Y - 20) - 10]);
  const cizgi = nokta.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const alan = `${cizgi} L${G},${Y} L0,${Y} Z`;
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${G} ${Y}`} preserveAspectRatio="none" className="w-full" style={{ height: yukseklik }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={renk} stopOpacity="0.28" />
            <stop offset="100%" stopColor={renk} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" y1={Y * f} x2={G} y2={Y * f} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}
        <motion.path d={alan} fill={`url(#${gid})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />
        <motion.path d={cizgi} fill="none" stroke={renk} strokeWidth="2" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: "easeOut" }} />
      </svg>
      {etiketler && (
        <div className="mt-1.5 flex justify-between text-[10px] text-[color:var(--ad-metin-3)]">
          {etiketler.map((e, i) => <span key={i}>{e}</span>)}
        </div>
      )}
    </div>
  );
}

/** Çok-seri çizgi grafiği. */
export function CizgiGrafik({ seriler, yukseklik = 180 }: { seriler: { veri: number[]; renk: string; ad: string }[]; yukseklik?: number }) {
  if (!seriler.length) return null;
  const G = 320, Y = yukseklik;
  const tumDeger = seriler.flatMap((s) => s.veri);
  const { min, aralik } = normalize(tumDeger);
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${G} ${Y}`} preserveAspectRatio="none" className="w-full" style={{ height: yukseklik }}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" y1={Y * f} x2={G} y2={Y * f} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}
        {seriler.map((s, si) => {
          const nokta = s.veri.map((v, i) => [(s.veri.length > 1 ? i / (s.veri.length - 1) : 0.5) * G, Y - ((v - min) / aralik) * (Y - 20) - 10]);
          const d = nokta.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
          return <motion.path key={si} d={d} fill="none" stroke={s.renk} strokeWidth="2" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: si * 0.1 }} />;
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3">
        {seriler.map((s) => (
          <span key={s.ad} className="flex items-center gap-1.5 text-[11px] text-[color:var(--ad-metin-2)]">
            <span className="h-2 w-2 rounded-full" style={{ background: s.renk }} /> {s.ad}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Çubuk grafiği (dikey). */
export function CubukGrafik({ veri, renk = AKSAN, yukseklik = 160 }: { veri: { etiket: string; deger: number }[]; renk?: string; yukseklik?: number }) {
  if (!veri.length) return null;
  const max = Math.max(...veri.map((v) => v.deger), 1);
  return (
    <div className="w-full">
      <div className={veri.length > 30 ? "flex items-end gap-px" : "flex items-end gap-1.5"} style={{ height: yukseklik }}>
        {veri.map((v, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${v.etiket}: ${v.deger.toLocaleString("tr-TR")}`}>
            <motion.div className="w-full rounded-t-md" style={{ background: renk, minHeight: 2 }}
              initial={{ height: 0 }} animate={{ height: `${(v.deger / max) * 100}%` }} transition={{ duration: 0.6, delay: i * 0.03, ease: "easeOut" }} />
          </div>
        ))}
      </div>
      {veri.length > 12 ? (
        <div className="mt-1.5 flex justify-between text-[10px] text-[color:var(--ad-metin-3)]">
          {[0, 0.25, 0.5, 0.75, 1].map((o) => Math.round(o * (veri.length - 1))).filter((x, i, l) => l.indexOf(x) === i).map((i) => <span key={i} className="whitespace-nowrap">{veri[i].etiket}</span>)}
        </div>
      ) : (
        <div className="mt-1.5 flex gap-1.5">
          {veri.map((v, i) => <span key={i} className="flex-1 truncate text-center text-[10px] text-[color:var(--ad-metin-3)]">{v.etiket}</span>)}
        </div>
      )}
    </div>
  );
}

/** Yatay çubuk (sıralı liste). */
export function YatayCubuk({ veri, renk = AKSAN }: { veri: { etiket: string; deger: number; alt?: string }[]; renk?: string }) {
  const max = Math.max(...veri.map((v) => v.deger), 1);
  return (
    <div className="space-y-2.5">
      {veri.map((v, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between text-[13px]">
            <span className="text-[color:var(--ad-metin-2)]">{v.etiket}</span>
            <span className="tabular-nums text-[color:var(--ad-metin)]">{v.alt ?? v.deger.toLocaleString("tr-TR")}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
            <motion.div className="h-full rounded-full" style={{ background: renk }}
              initial={{ width: 0 }} animate={{ width: `${(v.deger / max) * 100}%` }} transition={{ duration: 0.7, delay: i * 0.05, ease: "easeOut" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Donut grafiği (dağılım). */
export function DonutGrafik({ veri, boyut = 160 }: { veri: { etiket: string; deger: number; renk: string }[]; boyut?: number }) {
  const toplam = veri.reduce((a, v) => a + v.deger, 0) || 1;
  const R = 42, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" style={{ width: boyut, height: boyut }} className="-rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        {veri.map((v, i) => {
          const oran = v.deger / toplam;
          const uzunluk = oran * C;
          const el = (
            <motion.circle key={i} cx="50" cy="50" r={R} fill="none" stroke={v.renk} strokeWidth="12"
              strokeDasharray={`${uzunluk} ${C}`} strokeDashoffset={-offset} strokeLinecap="round"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }} />
          );
          offset += uzunluk;
          return el;
        })}
      </svg>
      <div className="space-y-1.5">
        {veri.map((v) => (
          <div key={v.etiket} className="flex items-center gap-2 text-[13px]">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: v.renk }} />
            <span className="text-[color:var(--ad-metin-2)]">{v.etiket}</span>
            <span className="ml-auto pl-2 tabular-nums font-semibold text-[color:var(--ad-metin)]">{v.deger.toLocaleString("tr-TR")}</span>
            <span className="w-16 text-right tabular-nums text-[11px] text-[color:var(--ad-metin-3)]">yüzde {Math.round((v.deger / toplam) * 100)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** İlerleme halkası (tek değer). */
export function IlerlemeHalka({ deger, boyut = 72, renk = AKSAN, etiket }: { deger: number; boyut?: number; renk?: string; etiket?: string }) {
  const R = 42, C = 2 * Math.PI * R;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: boyut, height: boyut }}>
      <svg viewBox="0 0 100 100" className="-rotate-90" style={{ width: boyut, height: boyut }}>
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
        <motion.circle cx="50" cy="50" r={R} fill="none" stroke={renk} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C - (deger / 100) * C }}
          transition={{ duration: 1, ease: "easeOut" }} />
      </svg>
      <span className="absolute text-center text-[13px] font-bold tabular-nums text-[color:var(--ad-metin)]">
        {Math.round(deger)}{etiket && <span className="block text-[9px] font-normal text-[color:var(--ad-metin-3)]">{etiket}</span>}
      </span>
    </div>
  );
}
