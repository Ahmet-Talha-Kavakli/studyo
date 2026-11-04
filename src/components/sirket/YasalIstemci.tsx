"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";

/** Yapışkan içindekiler; okunan bölümü vurgular (yasal belge şablonunun istemci adası). */
export function Icindekiler({ ogeler }: { ogeler: { id: string; baslik: string }[] }) {
  const [aktif, setAktif] = useState(ogeler[0]?.id);
  useEffect(() => {
    const els = ogeler.map((b) => document.getElementById(b.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((girdiler) => {
      const gorunen = girdiler.filter((g) => g.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (gorunen) setAktif(gorunen.target.id);
    }, { rootMargin: "-90px 0px -65% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [ogeler]);

  return (
    <nav aria-label="İçindekiler" className="hidden lg:block print:hidden">
      <div className="sticky top-[88px] max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
        <p className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-metin-3">İçindekiler</p>
        <ol className="space-y-0.5 border-l border-white/[0.07]">
          {ogeler.map((b, i) => (
            <li key={b.id}>
              <a href={`#${b.id}`} className={cn("-ml-px block border-l py-1.5 pl-4 text-[13px] leading-snug transition-colors",
                aktif === b.id ? "border-vurgu font-medium text-white" : "border-transparent text-metin-3 hover:text-white")}>
                <span className="tabular-nums">{i + 1}.</span> {b.baslik}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

export function YazdirButonu() {
  return (
    <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 font-medium text-white hover:underline">
      <Printer className="h-3.5 w-3.5" />Yazdır / PDF
    </button>
  );
}
