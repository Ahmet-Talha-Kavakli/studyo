"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Yuzen, type Yerlesim } from "./Yuzen";

export type SeciciSecenek = {
  id: string;
  ad: string;
  /** İkinci satır (açıklama) ya da yerel ad. */
  alt?: string;
  /** Sağda küçük bilgi (ör. "70+ dil"). */
  sag?: ReactNode;
  /** Solda ikon/görsel. */
  ikon?: ReactNode;
  grup?: string;
  /** Aramada eşleşecek ek sözcükler. */
  anahtar?: string;
  devreDisi?: boolean;
};

/**
 * Aramalı açılır seçici (combobox). Klavye: yazınca süzer, ↑/↓ gezer, Enter seçer, Esc kapatır.
 * Liste gövdeye portal edilir; panelin altında ya da üstünde ekrana sığacak şekilde açılır.
 */
export function AramaliSecici({
  secenekler, deger, onSec, tetik, aramaYerTutucu = "Ara", genislik = 320, yerlesim = "alt-sol", bosMetin = "Sonuç yok", etiket, aramaGizli,
}: {
  secenekler: SeciciSecenek[];
  deger: string;
  onSec: (id: string) => void;
  /** Tetikleyici içerik (buton içi). */
  tetik: (acik: boolean) => ReactNode;
  aramaYerTutucu?: string;
  genislik?: number;
  yerlesim?: Yerlesim;
  bosMetin?: string;
  etiket: string;
  /** Kısa listelerde arama kutusunu gizle. */
  aramaGizli?: boolean;
}) {
  const [acik, setAcik] = useState(false);
  const [q, setQ] = useState("");
  const [aktif, setAktif] = useState(0);
  const listeRef = useRef<HTMLDivElement>(null);
  const aramaRef = useRef<HTMLInputElement>(null);
  const kucult = (s: string) => s.toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "");
  const suzulmus = useMemo(() => {
    const k = kucult(q.trim());
    return k ? secenekler.filter((s) => kucult(`${s.ad} ${s.alt ?? ""} ${s.anahtar ?? ""}`).includes(k)) : secenekler;
  }, [q, secenekler]);
  const secilebilir = suzulmus.filter((s) => !s.devreDisi);

  useEffect(() => {
    if (!acik) return;
    setQ("");
    const i = secenekler.filter((s) => !s.devreDisi).findIndex((s) => s.id === deger);
    setAktif(Math.max(0, i));
    // Liste konumlanınca (görünür olunca) arama kutusuna odaklan.
    const t = setTimeout(() => (aramaGizli ? listeRef.current : aramaRef.current)?.focus(), 40);
    return () => clearTimeout(t);
  }, [acik]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setAktif(0); }, [q]);
  useEffect(() => {
    listeRef.current?.querySelector<HTMLElement>(`[data-aktif="1"]`)?.scrollIntoView({ block: "nearest" });
  }, [aktif]);

  const sec = (id: string) => { onSec(id); setAcik(false); };
  const tus = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setAktif((a) => Math.min(secilebilir.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAktif((a) => Math.max(0, a - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); const s = secilebilir[aktif]; if (s) sec(s.id); }
  };

  let sonGrup: string | undefined;
  return (
    <div className="relative">
      <button type="button" onClick={() => setAcik((v) => !v)} aria-haspopup="listbox" aria-expanded={acik} aria-label={etiket} className="block w-full text-left">
        {tetik(acik)}
      </button>
      <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim={yerlesim} bosluk={6} etiket={etiket}
        className="menu-surface overflow-hidden rounded-[14px]" style={{ width: genislik }}>
        {!aramaGizli && (
          <label className="flex items-center gap-2 border-b border-white/[0.07] px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-metin-3" />
            <input ref={aramaRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={tus} placeholder={aramaYerTutucu} aria-label={aramaYerTutucu}
              className="min-w-0 flex-1 bg-transparent text-[13.5px] text-metin outline-none placeholder:text-metin-3" />
          </label>
        )}
        <div ref={listeRef} role="listbox" aria-label={etiket} tabIndex={aramaGizli ? 0 : -1} onKeyDown={aramaGizli ? tus : undefined}
          className="max-h-[340px] overflow-y-auto p-1.5 [scrollbar-width:thin]">
          {suzulmus.length === 0 && <p className="px-3 py-6 text-center text-[13px] text-metin-3">{bosMetin}</p>}
          {suzulmus.map((s) => {
            const baslik = s.grup && s.grup !== sonGrup ? s.grup : null;
            sonGrup = s.grup;
            const ai = secilebilir.indexOf(s);
            const isaretli = s.id === deger;
            return (
              <div key={s.id}>
                {baslik && <p className="px-2.5 pb-1 pt-2.5 text-[11px] font-medium text-metin-3 first:pt-1">{baslik}</p>}
                <button type="button" role="option" aria-selected={isaretli} disabled={s.devreDisi} data-aktif={ai === aktif ? "1" : undefined}
                  onMouseEnter={() => ai >= 0 && setAktif(ai)} onClick={() => sec(s.id)}
                  className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                    ai === aktif && !s.devreDisi ? "bg-white/[0.07]" : "")}>
                  {s.ikon && <span className="flex shrink-0 items-center">{s.ikon}</span>}
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[13.5px]", isaretli ? "font-medium text-metin" : "text-metin")}>{s.ad}</span>
                    {s.alt && <span className="block truncate text-[11.5px] leading-snug text-metin-3">{s.alt}</span>}
                  </span>
                  {s.sag && <span className="shrink-0 text-[11.5px] text-metin-3">{s.sag}</span>}
                  {isaretli && <Check className="h-4 w-4 shrink-0 text-aksan" />}
                </button>
              </div>
            );
          })}
        </div>
      </Yuzen>
    </div>
  );
}

/** Ayar paneli satırı tetikleyicisi: solda başlık, sağda değer + ok. */
export function SatirTetik({ baslik, deger, ikon, acik, alt }: { baslik: string; deger: ReactNode; ikon?: ReactNode; acik: boolean; alt?: string }) {
  return (
    <span className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors", acik ? "bg-white/[0.07]" : "hover:bg-white/[0.045]")}>
      {ikon && <span className="flex shrink-0 items-center">{ikon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] text-metin-3">{baslik}</span>
        <span className="block truncate text-[14px] font-medium text-metin">{deger}</span>
        {alt && <span className="block truncate text-[11.5px] text-metin-3">{alt}</span>}
      </span>
      <ChevronDown className={cn("h-4 w-4 shrink-0 text-metin-3 transition-transform", acik && "rotate-180")} />
    </span>
  );
}
