"use client";

/* Usta'nın ortak açılır seçicisi: tarayıcının <select> listesi yerine.
   Düğme (simge + değer + ok) → başlık şeritli yüzen liste (simge, ad, alt satır, seçili halka), isteğe bağlı gruplar. */

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Yuzen } from "@/components/ui/Yuzen";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { SAGLAYICI_ADI, SC_MODELLER } from "@/lib/scSohbet";

export type ScSecenek<T extends string | number> = { id: T; ad: string; alt?: string; simge?: React.ReactNode; grup?: string };

export function ScSecici<T extends string | number>({ deger, secenekler, onSec, etiket, baslik, genislik = 280, tam, kucuk }: {
  deger: T; secenekler: ScSecenek<T>[]; onSec: (v: T) => void; etiket: string; baslik?: string; genislik?: number; tam?: boolean; kucuk?: boolean;
}) {
  const [acik, setAcik] = useState(false);
  const secili = secenekler.find((s) => s.id === deger);
  const gruplar = [...new Set(secenekler.map((s) => s.grup ?? ""))];
  return (
    <div className={cn("relative", tam && "w-full")}>
      <button type="button" onClick={() => setAcik((v) => !v)} aria-expanded={acik} aria-haspopup="listbox" aria-label={etiket}
        className={cn("flex items-center gap-2 rounded-full bg-white/[0.065] pl-2.5 pr-2 font-medium text-[var(--sc-metin)] ring-1 ring-inset transition active:scale-[0.98]",
          kucuk ? "h-8 text-[12.5px]" : "h-9 text-[13.5px]", tam && "w-full", acik ? "bg-white/[0.1] ring-white/25" : "ring-white/[0.08] hover:bg-white/[0.09]")}>
        {secili?.simge && <span className="flex shrink-0 items-center">{secili.simge}</span>}
        <span className={cn("min-w-0 truncate text-left", tam && "flex-1")}>{secili?.ad ?? "Seç"}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-[var(--sc-metin-3)] transition-transform", acik && "rotate-180")} />
      </button>
      <AnimatePresence>
        <Yuzen acik={acik} onKapat={() => setAcik(false)} yerlesim="alt-sag" bosluk={6} etiket={etiket}
          className="sc-kapsam overflow-hidden rounded-[16px] border border-white/[0.09] bg-[#18181b]" style={{ width: genislik }}>
          {baslik && <div className="border-b border-white/[0.06] px-3.5 py-2.5 text-[13px] font-semibold text-[var(--sc-metin)]">{baslik}</div>}
          <div role="listbox" aria-label={etiket} className="max-h-[340px] overflow-y-auto p-1.5 [scrollbar-width:thin]">
            {gruplar.map((g) => (
              <div key={g} className="[&+&]:mt-1 [&+&]:border-t [&+&]:border-white/[0.06] [&+&]:pt-1">
                {g && <p className="px-2.5 pb-1 pt-1.5 text-[11.5px] font-semibold text-[var(--sc-metin-3)]">{g}</p>}
                {secenekler.filter((s) => (s.grup ?? "") === g).map((s) => {
                  const a = s.id === deger;
                  return (
                    <button key={String(s.id)} type="button" role="option" aria-selected={a} onClick={() => { onSec(s.id); setAcik(false); }}
                      className={cn("relative flex w-full items-center gap-2.5 rounded-[11px] px-2.5 py-2 text-left transition-colors", a ? "bg-white/[0.085]" : "hover:bg-white/[0.055]")}>
                      {s.simge && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.065]">{s.simge}</span>}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-[var(--sc-metin)]">{s.ad}</span>
                        {s.alt && <span className="block truncate text-[12px] text-[var(--sc-metin-3)]">{s.alt}</span>}
                      </span>
                      {a && <span className="pointer-events-none absolute inset-0 rounded-[11px] ring-1 ring-inset ring-white/45" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </Yuzen>
      </AnimatePresence>
    </div>
  );
}

const logoAdi = (s: string) => (s === "openai" ? "gpt" : s === "google" ? "gemini" : "claude");

/** Model seçici: sağlayıcıya göre gruplu, gerçek logolarla. */
export function ScModelSecici({ deger, onSec, tam, otomatik }: { deger: string; onSec: (v: string) => void; tam?: boolean; otomatik?: boolean }) {
  const secenekler: ScSecenek<string>[] = [
    ...(otomatik ? [{ id: "otomatik", ad: "Otomatik", alt: "Soruya göre hızlı ya da güçlü modeli seçer", simge: <Sparkles className="h-3.5 w-3.5 text-[var(--sc-metin-2)]" /> }] : []),
    ...SC_MODELLER.map((m) => ({ id: m.id as string, ad: m.ad, alt: m.alt, simge: <ModelLogo ad={logoAdi(m.saglayici)} boyut={14} />, grup: SAGLAYICI_ADI[m.saglayici] })),
  ];
  return <ScSecici deger={deger} secenekler={secenekler} onSec={onSec} etiket="Model" baslik="Model" genislik={300} tam={tam} />;
}
