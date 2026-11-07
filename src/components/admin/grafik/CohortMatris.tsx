"use client";

import { cn } from "@/lib/utils";
import { AD } from "@/components/admin/ui/temel";
import { gunEtiket } from "@/lib/admin/istemci";

/* Haftalık kohort: kayıt haftası ve sonraki haftalarda üretim yapan kullanıcı oranı (yüzde). */

export function CohortMatris({ satirlar }: { satirlar: { hafta: string; boyut: number; oranlar: (number | null)[] }[] }) {
  const kolon = Math.max(0, ...satirlar.map((s) => s.oranlar.length));
  const renk = (v: number) => `rgba(85, 214, 253, ${0.08 + (v / 100) * 0.85})`;
  return (
    <div className="overflow-x-auto ad-ince-scroll">
      <table className="w-full min-w-[620px] text-sm">
        <thead>
          <tr className={cn("text-left text-[12px]", AD.metin3)}>
            <th className="py-2 pr-3 font-semibold">Kayıt haftası</th><th className="py-2 pr-3 text-right font-semibold">Kişi</th>
            {Array.from({ length: kolon }, (_, i) => <th key={i} className="px-1 py-2 text-center font-semibold">{i === 0 ? "İlk hafta" : `${i}. hafta`}</th>)}
          </tr>
        </thead>
        <tbody>
          {satirlar.map((s) => (
            <tr key={s.hafta}>
              <td className={cn("whitespace-nowrap py-1.5 pr-3 text-[13px]", AD.metin2)}>{gunEtiket(s.hafta)}</td>
              <td className={cn("py-1.5 pr-3 text-right text-[13px] tabular-nums", AD.metin)}>{s.boyut}</td>
              {Array.from({ length: kolon }, (_, i) => {
                const v = s.oranlar[i];
                return (
                  <td key={i} className="px-1 py-1">
                    {v === null || v === undefined || s.boyut === 0
                      ? <div className="h-8 rounded bg-white/[0.02]" />
                      : <div className="flex h-8 items-center justify-center rounded text-[12px] font-semibold tabular-nums text-white" style={{ background: renk(v) }} title={`yüzde ${v}`}>{v}</div>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className={cn("mt-2 text-[12px]", AD.metin3)}>Hücredeki sayı, o hafta en az bir üretim yapan kişilerin yüzdesidir.</p>
    </div>
  );
}
