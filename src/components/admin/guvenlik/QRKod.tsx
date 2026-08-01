"use client";

import { useMemo } from "react";
import { qrMatris } from "@/lib/admin/guvenlik/qr";

/* SVG QR kodu — bağımlılıksız. TOTP otpauth URI'sini çizer. */
export function QRKod({ metin, boyut = 180 }: { metin: string; boyut?: number }) {
  const matris = useMemo(() => {
    try { return qrMatris(metin); } catch { return null; }
  }, [metin]);
  if (!matris) return <div style={{ width: boyut, height: boyut }} className="flex items-center justify-center rounded-xl bg-white/5 text-xs text-[color:var(--ad-metin-3)]">QR</div>;
  const N = matris.length;
  const q = 2; // quiet zone
  const total = N + q * 2;
  return (
    <div className="rounded-xl bg-white p-3" style={{ width: boyut, height: boyut }}>
      <svg viewBox={`0 0 ${total} ${total}`} width="100%" height="100%" shapeRendering="crispEdges">
        <rect width={total} height={total} fill="#fff" />
        {matris.map((row, r) => row.map((on, c) => on ? <rect key={`${r}-${c}`} x={c + q} y={r + q} width={1} height={1} fill="#000" /> : null))}
      </svg>
    </div>
  );
}
