"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ListOrdered, Play, FlaskConical } from "lucide-react";
import { MODELLER } from "@/lib/catalog";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { BosDurum, KopyalaDugme } from "@/components/api/parcalar";
import { durumSinif } from "@/lib/apiPlatform";
import { cn } from "@/lib/utils";

/* ============================================================
   İSTEKLER — Higgsfield "Requests / Generations" birebir.
   Bu modele ait GERÇEK çağrı günlüğü (useApiAnahtar.cagrilar).
   ============================================================ */

export default function Istekler({ params }: { params: Promise<{ model: string }> }) {
  const { model: modelId } = use(params);
  const model = MODELLER.find((m) => m.id === modelId)!;
  const cagrilar = useApiAnahtar((s) => s.cagrilar);

  const liste = useMemo(() => cagrilar.filter((c) => c.modelId === modelId), [cagrilar, modelId]);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-bold tracking-tight text-metin">Üretimler</h2>
        <p className="mt-0.5 text-sm text-metin-2">{liste.length} toplam üretim</p>
      </div>

      {liste.length === 0 ? (
        <BosDurum
          ikon={<ListOrdered className="h-9 w-9" />}
          baslik="Üretim bulunamadı"
          ozet="Burada görmek için üretim oluşturmaya başla"
          aksiyon={
            <Link
              href={`/panel/api/modeller/${model.id}/oyun-alani`}
              className="hf-btn inline-flex items-center gap-1.5 rounded-xl bg-aksan px-3.5 py-2 text-sm font-bold text-[#12140c]"
            >
              <Play className="h-4 w-4" /> Oyun Alanı&apos;nı aç
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-yuzey">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-[0.14em] text-metin-3">
                <th className="px-5 py-3 font-semibold">İstek Kimliği</th>
                <th className="px-5 py-3 font-semibold">Durum</th>
                <th className="px-5 py-3 font-semibold">Kredi</th>
                <th className="px-5 py-3 font-semibold">Gecikme</th>
                <th className="px-5 py-3 font-semibold">Zaman</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((c) => (
                <tr key={c.id} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs text-metin-2">{c.id}</code>
                      <KopyalaDugme metin={c.id} kucuk />
                      {c.sandbox && (
                        <span className="flex items-center gap-1 rounded border border-amber-400/25 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                          <FlaskConical className="h-2.5 w-2.5" /> sandbox
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[11px]", durumSinif(c.durum))}>
                      {c.durum}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-metin-2">{c.kredi}</td>
                  <td className="px-5 py-3.5 text-metin-2">
                    {c.gecikmeMs > 0 ? `${(c.gecikmeMs / 1000).toFixed(2)}sn` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-metin-3">
                    {new Date(c.zaman).toLocaleString("tr", {
                      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
