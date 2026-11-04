"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Uzun sohbetler için içindekiler (ChatGPT "table of contents" karşılığı): sağ kenarda her kullanıcı
 * sorusu için kısa bir çizgi; üzerine gelince soruların listesi açılır, tıklayınca o mesaja kayar.
 * Görünen mesajın çizgisi vurgulanır.
 */
export function Icindekiler({ kap, ogeler }: { kap: React.RefObject<HTMLDivElement | null>; ogeler: { id: string; metin: string }[] }) {
  const [aktif, setAktif] = useState<string | null>(null);
  const [acik, setAcik] = useState(false);

  useEffect(() => {
    const el = kap.current; if (!el) return;
    const oku = () => {
      const ust = el.getBoundingClientRect().top + 80;
      let bulunan: string | null = ogeler[0]?.id ?? null;
      for (const o of ogeler) {
        const d = el.querySelector<HTMLElement>(`[data-mid="${o.id}"]`);
        if (d && d.getBoundingClientRect().top <= ust) bulunan = o.id;
      }
      setAktif(bulunan);
    };
    oku();
    el.addEventListener("scroll", oku, { passive: true });
    return () => el.removeEventListener("scroll", oku);
  }, [kap, ogeler]);

  const git = (id: string) => {
    const el = kap.current; const d = el?.querySelector<HTMLElement>(`[data-mid="${id}"]`);
    if (el && d) el.scrollTo({ top: el.scrollTop + d.getBoundingClientRect().top - el.getBoundingClientRect().top - 16, behavior: "smooth" });
  };

  return (
    <nav aria-label="Sohbet içindekiler" onMouseEnter={() => setAcik(true)} onMouseLeave={() => setAcik(false)} onFocus={() => setAcik(true)} onBlur={() => setAcik(false)}
      className="sc-yazdirma-gizle absolute right-3 top-1/2 z-10 -translate-y-1/2 max-xl:hidden">
      <div className={cn("flex flex-col items-end gap-1.5 rounded-[14px] p-2 transition-colors duration-150", acik && "bg-[#161618]/95 ring-1 ring-inset ring-white/[0.08] backdrop-blur-md")}>
        {acik && <p className="w-full px-1.5 pb-0.5 text-[11.5px] font-medium text-[var(--sc-metin-3)]">Bu sohbette</p>}
        {ogeler.map((o) => (
          <button key={o.id} onClick={() => git(o.id)} aria-current={aktif === o.id ? "true" : undefined} title={acik ? undefined : o.metin}
            className={cn("flex items-center justify-end gap-2.5 rounded-[8px] text-right transition-colors", acik ? "w-[240px] px-1.5 py-1 hover:bg-white/[0.05]" : "py-0.5")}>
            {acik && <span className={cn("min-w-0 flex-1 truncate text-[12.5px]", aktif === o.id ? "text-[var(--sc-metin)]" : "text-[var(--sc-metin-3)]")}>{o.metin}</span>}
            <span className={cn("h-[2px] shrink-0 rounded-full transition-all", aktif === o.id ? "w-5 bg-[var(--sc-aksan)]" : "w-3 bg-white/25")} />
          </button>
        ))}
      </div>
    </nav>
  );
}
