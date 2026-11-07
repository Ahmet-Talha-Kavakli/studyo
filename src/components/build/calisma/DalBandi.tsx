"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowUpRight, GitBranch, GitMerge, Loader2 } from "lucide-react";
import { api, ApiHatasi } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";

type Durum = { ana: { id: string; ad: string; sonSurumNo: number } | null; anaDegisti: boolean; degisen: { yol: string; tur: "eklendi" | "silindi" | "degisti" }[]; anaDegisen: string[] };

/** Deneme dalı bandı: dalın ana projesi, değişen dosyalar, ana projeye uygula (çakışma uyarısıyla). */
export function DalBandi({ p }: { p: Proje }) {
  const router = useRouter();
  const [d, setD] = useState<Durum | null>(null);
  const [is, setIs] = useState(false);
  const [catisma, setCatisma] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const sonNo = p.surumler.at(-1)?.no ?? 0;
  const getir = useCallback(() => api<Durum>(`/api/build/dal/${p.id}`).then(setD).catch(() => {}), [p.id]);
  useEffect(() => { getir(); }, [getir, sonNo]);
  if (!p.taslak) return null;
  const uygula = async (zorla = false) => {
    setIs(true); setHata("");
    try { const v = await api<{ anaId: string }>(`/api/build/dal/${p.id}`, { govde: { zorla } }); router.push(`/panel/build/${v.anaId}`); }
    catch (e) {
      const m = e instanceof ApiHatasi ? e.message : "Uygulanamadı.";
      if (/iki tarafta/.test(m)) setCatisma(m); else setHata(m);
      setIs(false);
    }
  };
  return (
    <div className="mx-3 mb-1 mt-2 overflow-hidden rounded-[16px] bg-[#55d6fd]/[0.06] ring-1 ring-inset ring-[#55d6fd]/20">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#55d6fd]/[0.14] text-[#8be6ff]"><GitBranch className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-white">Deneme dalı</span>
          <span className="block truncate text-[12px] text-white/55">{p.taslak.anaAd} projesini etkilemez{d ? ` · ${d.degisen.length} dosya değişti` : ""}</span>
        </span>
        {d?.ana && <Link href={`/panel/build/${d.ana.id}`} title="Ana projeye git" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><ArrowUpRight className="h-4 w-4" /></Link>}
        <button type="button" disabled={is || !d?.degisen.length || !d.ana} onClick={() => uygula(false)} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black disabled:opacity-40">{is ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitMerge className="h-3.5 w-3.5" />}Uygula</button>
      </div>
      {catisma && (
        <div className="space-y-2 border-t border-[#55d6fd]/15 px-3 py-2.5">
          <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-amber-100/85"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{catisma}</p>
          <div className="flex gap-1.5">
            <button type="button" disabled={is} onClick={() => uygula(true)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black">{is && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Yine de uygula</button>
            <button type="button" onClick={() => setCatisma(null)} className="h-8 rounded-full px-3 text-[12.5px] text-white/60 hover:text-white">Vazgeç</button>
          </div>
        </div>
      )}
      {hata && <p className="border-t border-[#55d6fd]/15 px-3 py-2 text-[12.5px] text-rose-200">{hata}</p>}
    </div>
  );
}
