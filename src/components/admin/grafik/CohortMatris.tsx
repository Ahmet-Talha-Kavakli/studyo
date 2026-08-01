"use client";

import { cn } from "@/lib/utils";
import { AD } from "@/components/admin/ui/temel";
import type { CohortSatir } from "@/lib/admin/seed/analitik";

/* Cohort retention matrisi — renk yoğunluklu ısı hücreleri. */
export function CohortMatris({ satirlar }: { satirlar: CohortSatir[] }) {
  const renk = (v: number) => `rgba(85, 214, 253, ${0.08 + (v / 100) * 0.85})`;
  const kolonlar = ["D1", "D7", "D30", "D90"] as const;
  const alan = (s: CohortSatir) => [s.d1, s.d7, s.d30, s.d90];
  return (
    <div className="overflow-x-auto ad-ince-scroll">
      <table className="w-full min-w-[480px] text-sm">
        <thead><tr className="text-left text-[11px] uppercase tracking-wider text-[color:var(--ad-metin-3)]">
          <th className="py-2 pr-3">Cohort</th><th className="py-2 pr-3 text-right">Boyut</th>
          {kolonlar.map((k) => <th key={k} className="px-2 py-2 text-center">{k}</th>)}
        </tr></thead>
        <tbody>
          {satirlar.map((s) => (
            <tr key={s.cohort}>
              <td className={cn("py-1.5 pr-3 text-[13px]", AD.metin2)}>{s.cohort}</td>
              <td className={cn("py-1.5 pr-3 text-right text-[13px] tabular-nums", AD.metin)}>{s.boyut.toLocaleString("tr-TR")}</td>
              {alan(s).map((v, i) => (
                <td key={i} className="px-1 py-1">
                  <div className="flex h-8 items-center justify-center rounded text-[12px] font-semibold tabular-nums text-white" style={{ background: renk(v) }}>%{v}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
