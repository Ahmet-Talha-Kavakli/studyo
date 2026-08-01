"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { SSSKategori, SSSMadde } from "@/lib/kurumsal/sss";
import { cn } from "./UI";

/* Kategorili + aranabilir SSS akordeonu. /sss tam sürüm; fiyatlandırma tekMadde alt küme. */

function Madde({ s, c }: SSSMadde) {
  const [acik, setAcik] = useState(false);
  return (
    <div className="kr-kart overflow-hidden">
      <button onClick={() => setAcik((v) => !v)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="font-semibold text-[color:var(--color-metin)]">{s}</span>
        <ChevronDown className={cn("h-4.5 w-4.5 shrink-0 text-[color:var(--color-metin-3)] transition-transform", acik && "rotate-180")} />
      </button>
      {acik && <p className="px-5 pb-5 text-sm leading-relaxed text-[color:var(--color-metin-2)]">{c}</p>}
    </div>
  );
}

/** Tek kategorili basit liste (fiyatlandırma için). */
export function SSSListe({ maddeler }: { maddeler: SSSMadde[] }) {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {maddeler.map((m) => <Madde key={m.s} {...m} />)}
    </div>
  );
}

/** Tam SSS — arama + kategori sekmeleri. */
export function SSSAkordeon({ kategoriler }: { kategoriler: SSSKategori[] }) {
  const [ara, setAra] = useState("");
  const [aktif, setAktif] = useState<string>("Tümü");

  const sekmeler = ["Tümü", ...kategoriler.map((k) => k.ad)];

  const gorunen = useMemo(() => {
    const q = ara.trim().toLowerCase();
    return kategoriler
      .filter((k) => aktif === "Tümü" || k.ad === aktif)
      .map((k) => ({
        ...k,
        maddeler: k.maddeler.filter((m) => !q || m.s.toLowerCase().includes(q) || m.c.toLowerCase().includes(q)),
      }))
      .filter((k) => k.maddeler.length > 0);
  }, [kategoriler, ara, aktif]);

  const toplam = gorunen.reduce((a, k) => a + k.maddeler.length, 0);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Arama */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[color:var(--color-metin-3)]" />
        <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Sorularda ara…"
          className="h-12 w-full rounded-xl border border-[color:var(--color-kenar)] bg-white pl-11 pr-4 text-sm text-[color:var(--color-metin)] outline-none placeholder:text-[color:var(--color-metin-3)] focus:border-[color:var(--color-kenar-2)]" />
      </div>

      {/* Kategori sekmeleri */}
      <div className="mb-6 flex flex-wrap gap-2">
        {sekmeler.map((s) => (
          <button key={s} onClick={() => setAktif(s)}
            className={cn("rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
              aktif === s ? "kr-cta border-transparent" : "border-[color:var(--color-kenar)] text-[color:var(--color-metin-2)] hover:text-[color:var(--color-metin)]")}>
            {s}
          </button>
        ))}
      </div>

      {/* Sonuçlar */}
      {toplam === 0 ? (
        <div className="kr-kart py-14 text-center">
          <p className="text-[color:var(--color-metin-2)]">&quot;{ara}&quot; için sonuç bulunamadı.</p>
          <p className="mt-1 text-sm text-[color:var(--color-metin-3)]">Farklı bir kelime dene veya bize ulaş.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {gorunen.map((k) => (
            <div key={k.ad}>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[color:var(--color-metin-3)]">{k.ad}</h3>
              <div className="space-y-3">
                {k.maddeler.map((m) => <Madde key={m.s} {...m} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
