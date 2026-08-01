"use client";

/* Basit SVG alan grafiği — earn dashboard kazanç eğrisi. */
export function AlanGrafik({ veri, yukseklik = 120 }: { veri: number[]; yukseklik?: number }) {
  const g = 320, y = yukseklik;
  const max = Math.max(...veri, 1);
  const nokta = (i: number, v: number) => [(i / (veri.length - 1)) * g, y - (v / max) * (y - 10) - 5];
  const cizgi = veri.map((v, i) => nokta(i, v).join(",")).join(" ");
  const alan = `0,${y} ${cizgi} ${g},${y}`;
  return (
    <svg viewBox={`0 0 ${g} ${y}`} className="h-auto w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#55d6fd" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#55d6fd" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={alan} fill="url(#earnGrad)" />
      <polyline points={cizgi} fill="none" stroke="#55d6fd" strokeWidth="2" strokeLinejoin="round" />
      {veri.map((v, i) => { const [x, yy] = nokta(i, v); return <circle key={i} cx={x} cy={yy} r="2" fill="#7de0ff" />; })}
    </svg>
  );
}

/** İlerleme çubuğu (tier). */
export function Ilerleme({ oran }: { oran: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
      <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-300 transition-all" style={{ width: `${Math.min(100, Math.max(0, oran * 100))}%` }} />
    </div>
  );
}
