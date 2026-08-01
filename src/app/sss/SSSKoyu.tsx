"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import type { SSSKategori, SSSMadde } from "@/lib/kurumsal/sss";

/* Landing (koyu tema) SSS akordeonu — arama + kategori sekmeleri. */

function Madde({ s, c }: SSSMadde) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-yuzey">
      <button onClick={() => setAcik((v) => !v)} className="flex w-full items-center justify-between gap-4 p-5 text-left">
        <span className="font-medium">{s}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-white/50 transition-transform ${acik ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {acik && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="px-5 pb-5 text-sm text-white/60">{c}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SSSKoyu({ kategoriler }: { kategoriler: SSSKategori[] }) {
  const [ara, setAra] = useState("");
  const [aktif, setAktif] = useState<string>("Tümü");
  const sekmeler = ["Tümü", ...kategoriler.map((k) => k.ad)];

  const gorunen = useMemo(() => {
    const q = ara.trim().toLowerCase();
    return kategoriler
      .filter((k) => aktif === "Tümü" || k.ad === aktif)
      .map((k) => ({ ...k, maddeler: k.maddeler.filter((m) => !q || m.s.toLowerCase().includes(q) || m.c.toLowerCase().includes(q)) }))
      .filter((k) => k.maddeler.length > 0);
  }, [kategoriler, ara, aktif]);
  const toplam = gorunen.reduce((a, k) => a + k.maddeler.length, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20">
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-white/40" />
        <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Sorularda ara…"
          className="h-12 w-full rounded-xl border border-white/10 bg-yuzey pl-11 pr-4 text-sm outline-none placeholder:text-white/30 focus:border-vayra-400/50" />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {sekmeler.map((s) => (
          <button key={s} onClick={() => setAktif(s)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${aktif === s ? "border-vayra-500 bg-vayra-500 text-ink-950" : "border-white/10 text-white/60 hover:text-white"}`}>{s}</button>
        ))}
      </div>

      {toplam === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-yuzey py-14 text-center text-white/60">&quot;{ara}&quot; için sonuç bulunamadı.</div>
      ) : (
        <div className="space-y-8">
          {gorunen.map((k) => (
            <div key={k.ad}>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/40">{k.ad}</h3>
              <div className="space-y-3">{k.maddeler.map((m) => <Madde key={m.s} {...m} />)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
