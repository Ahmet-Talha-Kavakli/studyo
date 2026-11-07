"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gauge, Loader2 } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { api } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { boyut } from "./veriOrtak";

type Satir = { id: string; ad: string; kapak?: string; istek: number; bant: number; fonksiyon: number; fonksiyonMs: number; ai: number; aiBugun: number; depolama: number; gorsel: number };
type Veri = { ay: string; projeler: Satir[]; kota: { istek: number; bant: number; fonksiyon: number; fonksiyonMs: number; gorsel: number; ai: number }; depolamaSiniri: number };
const saat = (ms: number) => (ms < 60_000 ? `${Math.round(ms / 1000)} sn` : ms < 3600_000 ? `${Math.round(ms / 60_000)} dk` : `${(ms / 3600_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} sa`);

function Hucre({ n, sinir, metin }: { n: number; sinir: number; metin: string }) {
  const oran = n / Math.max(1, sinir);
  return (
    <td className="px-3 py-2.5 text-right">
      <span className={cn("block tabular-nums", oran >= 1 ? "text-rose-200" : oran >= 0.8 ? "text-amber-200" : "text-white/85")}>{metin}</span>
      <span className="ml-auto mt-1 block h-1 w-16 overflow-hidden rounded-full bg-white/[0.07]"><span className={cn("block h-full rounded-full", oran >= 1 ? "bg-[#e8546c]" : oran >= 0.8 ? "bg-[#b8801c]" : "bg-[#1e9fcf]")} style={{ width: `${Math.min(100, Math.max(n ? 3 : 0, oran * 100))}%` }} /></span>
    </td>
  );
}

/** Bulut genel bakış: bu ay proje başına istek, depolama, fonksiyon süresi ve yapay zekâ kullanımı, sınıra göre. */
export function HesapKullanimi() {
  const [v, setV] = useState<Veri | null>(null);
  useEffect(() => { api<Veri>("/api/build/bulut?kullanim=1").then(setV).catch(() => setV(null)); }, []);
  return (
    <Kart ikon={Gauge} baslik="Bu ayın kullanımı" alt={v ? `${new Date(`${v.ay}-15T12:00:00`).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}; çubuklar proje başına sınıra göre doluluk` : "Yükleniyor"}>
      {!v ? <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : !v.projeler.length ? <p className="px-5 py-5 text-[13px] text-white/50">Henüz proje yok.</p> : (
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full min-w-[720px] text-[12.5px]">
            <thead><tr className="border-b border-white/[0.06] text-white/45"><th className="px-5 py-2 text-left font-normal">Proje</th><th className="px-3 py-2 text-right font-normal">İstek</th><th className="px-3 py-2 text-right font-normal">Bant</th><th className="px-3 py-2 text-right font-normal">Fonksiyon süresi</th><th className="px-3 py-2 text-right font-normal">Yapay zekâ</th><th className="px-3 py-2 text-right font-normal">Depolama</th></tr></thead>
            <tbody>{v.projeler.map((p) => (
              <tr key={p.id} className="border-b border-white/[0.04] last:border-0">
                <td className="px-5 py-2.5"><Link href={`/panel/build/bulut/${p.id}?bolum=kullanim`} className="block max-w-[220px] truncate text-white hover:underline">{p.ad}</Link><span className="text-[11.5px] text-white/40">{p.fonksiyon.toLocaleString("tr-TR")} fonksiyon çağrısı</span></td>
                <Hucre n={p.istek} sinir={v.kota.istek} metin={p.istek.toLocaleString("tr-TR")} />
                <Hucre n={p.bant} sinir={v.kota.bant} metin={boyut(p.bant)} />
                <Hucre n={p.fonksiyonMs} sinir={v.kota.fonksiyonMs} metin={saat(p.fonksiyonMs)} />
                <Hucre n={p.ai} sinir={v.kota.ai} metin={p.ai.toLocaleString("tr-TR")} />
                <Hucre n={p.depolama} sinir={v.depolamaSiniri} metin={boyut(p.depolama)} />
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </Kart>
  );
}
