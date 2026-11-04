"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Yuzen, type Yerlesim } from "@/components/ui/Yuzen";

export type CipSecenek<T> = { deger: T; ad: string; alt?: string; nokta?: string; on?: ReactNode; stil?: CSSProperties };

/**
 * Küçük açılır seçici (yerel <select> yerine): cam hap tetikleyici + menü yüzeyi.
 * `nokta` renk noktası, `on` sol öğe (ikon/önizleme), `stil` satır yazı stili (ör. yazı tipi önizlemesi).
 */
export function CipSecici<T extends string>({ deger, secenekler, onSec, etiket, bosAd = "Seç", yerlesim = "alt-sol", genislik = 220, sinif }: {
  deger: T | undefined; secenekler: CipSecenek<T>[]; onSec: (v: T) => void; etiket: string; bosAd?: string; yerlesim?: Yerlesim; genislik?: number; sinif?: string;
}) {
  const [acik, setAcik] = useState(false);
  const sec = secenekler.find((s) => s.deger === deger);
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setAcik((v) => !v)} aria-haspopup="listbox" aria-expanded={acik} aria-label={etiket}
        className={cn("hf-btn flex h-8 w-full items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-semibold ring-1 ring-inset transition-colors",
          acik ? "bg-aksan/10 text-metin ring-aksan/45" : "bg-white/[0.045] text-metin ring-white/[0.08] hover:bg-white/[0.07]", sinif)}>
        {sec?.nokta && <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-black/30" style={{ background: sec.nokta }} />}
        {sec?.on}
        <span className="min-w-0 flex-1 truncate text-left" style={sec?.stil}>{sec?.ad ?? <span className="font-medium text-metin-3">{bosAd}</span>}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-metin-3 transition-transform", acik && "rotate-180 text-aksan")} />
      </button>
      <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim={yerlesim} bosluk={6} etiket={etiket} className="menu-surface max-h-[320px] overflow-y-auto rounded-[14px] p-1 [scrollbar-width:thin]" style={{ width: genislik }}>
        {secenekler.map((s) => {
          const aktif = s.deger === deger;
          return (
            <button key={s.deger} role="option" aria-selected={aktif} onClick={() => { onSec(s.deger); setAcik(false); }}
              className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left transition-colors", aktif ? "bg-aksan/10" : "hover:bg-white/[0.06]")}>
              {s.nokta && <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-black/30" style={{ background: s.nokta }} />}
              {s.on}
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-[13px] font-medium", aktif ? "text-metin" : "text-metin-2")} style={s.stil}>{s.ad}</span>
                {s.alt && <span className="block truncate text-[11px] text-metin-3">{s.alt}</span>}
              </span>
              {aktif && <Check className="h-4 w-4 shrink-0 text-aksan" />}
            </button>
          );
        })}
      </Yuzen>
    </div>
  );
}
