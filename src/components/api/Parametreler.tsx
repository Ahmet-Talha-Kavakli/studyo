"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { Alan } from "@/lib/api/sema";
import { cn } from "@/lib/utils";

/** Stripe tarzı parametre listesi: ad · tür · zorunlu, açıklama, izinli değerler, aralık, varsayılan. */
export function ParametreListesi({ alanlar, alt }: { alanlar: Alan[]; alt?: Record<string, Alan[]> }) {
  return (
    <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-[20px] bg-white/[0.02] ring-1 ring-white/[0.07]">
      {alanlar.map((a) => <ParametreSatiri key={a.ad} a={a} alt={alt?.[a.ad]} />)}
    </ul>
  );
}

function ParametreSatiri({ a, alt }: { a: Alan; alt?: Alan[] }) {
  const [acik, setAcik] = useState(false);
  return (
    <li id={`param-${a.ad}`} className="px-4 py-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <code className="font-mono text-[13.5px] font-semibold text-white">{a.ad}</code>
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] text-white/65">{a.tip === "enum" ? "seçenek" : a.tip}</span>
        {a.zorunlu ? <span className="rounded-full bg-rose-400/12 px-2 py-0.5 text-[11.5px] font-medium text-rose-300">Zorunlu</span> : <span className="text-[12px] text-white/45">İsteğe bağlı</span>}
        {a.varsayilan !== undefined && <span className="text-[12px] text-white/55">Varsayılan <code className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11.5px] text-white/80">{String(a.varsayilan)}</code></span>}
      </div>
      <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{a.aciklama}</p>
      {(a.secenekler || a.min !== undefined || a.max !== undefined) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[12.5px] text-white/55">
          {a.secenekler && <><span className="mr-0.5">İzinli</span>{a.secenekler.map((s) => <code key={String(s)} className="rounded-full bg-[#9ece6a]/10 px-2 py-0.5 font-mono text-[11.5px] text-[#b9e08a] ring-1 ring-[#9ece6a]/15">{String(s)}</code>)}</>}
          {!a.secenekler && a.min !== undefined && a.max !== undefined && <span>{a.tip === "string" ? "Uzunluk" : "Aralık"} <span className="font-medium tabular-nums text-white/80">{a.min.toLocaleString("tr-TR")} ile {a.max.toLocaleString("tr-TR")} arası</span></span>}
          {!a.secenekler && a.min === undefined && a.max !== undefined && a.tip === "string" && <span>En çok <span className="font-medium tabular-nums text-white/80">{a.max.toLocaleString("tr-TR")}</span> karakter</span>}
        </div>
      )}
      {alt && alt.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-[16px] bg-black/20 ring-1 ring-white/[0.08]">
          <button onClick={() => setAcik((v) => !v)} aria-expanded={acik} className="flex w-full items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium text-white/70 transition hover:text-white">
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", acik && "rotate-90")} />{acik ? "Alt alanları gizle" : `${alt.length} alt alanı göster`}
          </button>
          <AnimatePresence initial={false}>
            {acik && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden border-t border-white/[0.06]">
                <ul className="divide-y divide-white/[0.06]">{alt.map((x) => <ParametreSatiri key={x.ad} a={x} />)}</ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </li>
  );
}
