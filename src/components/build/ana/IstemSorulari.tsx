"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, MessageCircleQuestion, Wand2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type IstemSorusu = { id: string; soru: string; secenekler: string[] };

/** Yanıtları isteğin sonuna "Soru: yanıt" satırları olarak ekler. */
export function yanitlariEkle(istem: string, sorular: IstemSorusu[], cevaplar: Record<string, string>): string {
  const satirlar = sorular.filter((s) => cevaplar[s.id]?.trim()).map((s) => `${s.soru.replace(/[?.:]+$/, "")}: ${cevaplar[s.id].trim()}`);
  return satirlar.length ? `${istem.trim()}\n\n${satirlar.join("\n")}` : istem;
}

/**
 * İstem geliştiricinin soru kartları (v0 ve Rork modeli): belirsiz istekte 2-4 kısa seçmeli soru. Her soruda hazır
 * seçenekler ve "Özel" alanı; seçim beyaz halkayla gösterilir. Yanıtlar isteğe eklenir, istenirse ardından geliştirilir.
 */
export function IstemSorulari({ sorular, ekle, kapat, gidiyor }: { sorular: IstemSorusu[]; ekle: (cevaplar: Record<string, string>, gelistir: boolean) => void; kapat: () => void; gidiyor?: boolean }) {
  const [c, setC] = useState<Record<string, string>>({});
  const [ozel, setOzel] = useState<Record<string, boolean>>({});
  const dolu = sorular.filter((s) => c[s.id]?.trim()).length;
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
      className="mt-3 rounded-[22px] bg-[#141416]/90 p-4 text-left ring-1 ring-inset ring-white/[0.1] backdrop-blur-xl">
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><MessageCircleQuestion className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-white">Birkaç kısa soru</p>
          <p className="text-[12.5px] text-white/50">Yanıtların isteğine eklenir; boş bıraktığını ajan kendisi seçer.</p>
        </div>
        <button type="button" onClick={kapat} aria-label="Soruları kapat" className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <div className="mt-3.5 space-y-3.5">
        {sorular.map((s, i) => (
          <div key={s.id}>
            <p className="mb-1.5 text-[13px] text-white/80"><span className="mr-1.5 tabular-nums text-white/35">{i + 1}</span>{s.soru}</p>
            <div className="flex flex-wrap gap-1.5">
              {s.secenekler.map((o) => {
                const sec = !ozel[s.id] && c[s.id] === o;
                return <button key={o} type="button" aria-pressed={sec} onClick={() => { setOzel((x) => ({ ...x, [s.id]: false })); setC((x) => ({ ...x, [s.id]: sec ? "" : o })); }}
                  className={cn("h-8 rounded-full px-3 text-[12.5px] ring-inset transition-colors", sec ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.04] text-white/70 ring-1 ring-white/[0.08] hover:text-white")}>{o}</button>;
              })}
              {ozel[s.id] ? (
                <input autoFocus value={c[s.id] ?? ""} onChange={(e) => setC((x) => ({ ...x, [s.id]: e.target.value.slice(0, 120) }))} placeholder="Kendin yaz" className="h-8 min-w-[160px] flex-1 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white outline-none ring-2 ring-inset ring-white placeholder:text-white/35" />
              ) : (
                <button type="button" onClick={() => { setOzel((x) => ({ ...x, [s.id]: true })); setC((x) => ({ ...x, [s.id]: "" })); }} className="h-8 rounded-full bg-white/[0.04] px-3 text-[12.5px] text-white/55 ring-1 ring-inset ring-white/[0.08] hover:text-white">Özel</button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" disabled={gidiyor} onClick={() => ekle(c, true)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-50">{gidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}Ekle ve geliştir</button>
        <button type="button" disabled={gidiyor || !dolu} onClick={() => ekle(c, false)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] font-medium text-white ring-1 ring-inset ring-white/[0.1] hover:bg-white/[0.12] disabled:opacity-40"><Plus className="h-3.5 w-3.5" />Yalnız isteğe ekle</button>
        <span className="ml-auto text-[12px] tabular-nums text-white/40">{dolu} / {sorular.length} yanıtlandı</span>
      </div>
    </motion.div>
  );
}
