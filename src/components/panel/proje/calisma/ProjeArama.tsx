"use client";

/** Projede ara (Ctrl K / "/"): bölümler, sahneler, elementler, varlıklar ve alt projeler tek listede; ↑↓ ve Enter ile. */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AtSign, Clapperboard, CornerDownLeft, Search } from "lucide-react";
import type { Proje } from "@/store/useSinema";
import { useProje } from "@/store/useSinema";
import type { Uretim } from "@/store/useProjeler";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { BOLUMLER } from "./ProjeRay";
import { KART, MacKlasor, altAgac, ease, gorselAdresi, projeKapakAdresi, projeVarliklari, videoAdresi, type Bolum } from "./ortak";
import { useProjeler } from "@/store/useProjeler";
import { cn } from "@/lib/utils";

type Sonuc = { id: string; grup: string; ad: string; alt?: string; simge: React.ReactNode; git: () => void };

export function ProjeArama({ p, varliklar, onKapat, onBolum, onSahne, onVarlik, onProje }: {
  p: Proje; varliklar: Uretim[]; onKapat: () => void; onBolum: (b: Bolum) => void; onSahne: (id: string) => void; onVarlik: (id: string) => void; onProje: (id: string) => void;
}) {
  useScrollKilit(true);
  useEscKapat(true, onKapat);
  const hepsi = useProje((s) => s.projeler);
  const uretimler = useProjeler((s) => s.uretimler);
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const listeRef = useRef<HTMLDivElement>(null);
  const girdiRef = useRef<HTMLInputElement>(null);
  useEffect(() => { const t = setTimeout(() => girdiRef.current?.focus(), 30); return () => clearTimeout(t); }, []);

  const sonuclar = useMemo(() => {
    const t = q.trim().toLocaleLowerCase("tr");
    const uyar = (s: string) => !t || s.toLocaleLowerCase("tr").includes(t);
    const r: Sonuc[] = [];
    for (const [b, ad, I] of BOLUMLER) if (uyar(ad)) r.push({ id: `b-${b}`, grup: "Bölümler", ad, simge: <I className="h-4 w-4 text-white/70" />, git: () => onBolum(b) });
    p.cekimler.forEach((c, n) => {
      const ad = c.baslik || `Sahne ${n + 1}`;
      if (uyar(`${ad} ${c.istem ?? ""}`)) r.push({ id: `s-${c.id}`, grup: "Sahneler", ad, alt: c.istem || "İstem yok", git: () => onSahne(c.id),
        simge: c.gorselUrl ? <Kare src={c.gorselUrl} /> : <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white/[0.06]"><Clapperboard className="h-4 w-4 text-white/60" /></span> });
    });
    for (const e of p.elementler ?? []) if (uyar(e.ad)) r.push({ id: `e-${e.id}`, grup: "Elementler", ad: `@${e.ad}`, alt: e.tur === "mekan" ? "Mekân" : e.tur === "prop" ? "Nesne" : "Karakter", git: () => onBolum("elementler"),
      simge: <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#55d6fd]/10"><AtSign className="h-4 w-4 text-[#55d6fd]" /></span> });
    const alt = altAgac(hepsi, p.id);
    for (const x of hepsi) if (x.id !== p.id && !x.klasor && alt.has(x.id) && uyar(x.ad)) r.push({ id: `p-${x.id}`, grup: "Alt projeler", ad: x.ad, alt: x.tur, git: () => onProje(x.id),
      simge: <MacKlasor renk={x.renk} className="h-6 w-8" /> });
    let v = 0;
    for (const u of varliklar) {
      if (v >= (t ? 24 : 6)) break;
      if (!uyar(`${u.prompt} ${u.baslik} ${u.model}`)) continue;
      v++;
      const g = gorselAdresi(u), vid = videoAdresi(u);
      r.push({ id: `v-${u.id}`, grup: t ? "Varlıklar" : "Son varlıklar", ad: u.prompt || u.baslik || "İstemsiz", alt: u.model, git: () => onVarlik(u.id),
        simge: g ? <Kare src={g} /> : vid ? <video src={vid} muted className="h-8 w-8 rounded-[8px] object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-white/[0.06]"><ModelLogo ad={u.model} boyut={14} /></span> });
    }
    return r;
  }, [q, p, hepsi, varliklar, uretimler, onBolum, onSahne, onProje, onVarlik]);

  useEffect(() => setI(0), [q]);
  useEffect(() => { listeRef.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest" }); }, [i]);
  const sec = (s?: Sonuc) => { if (!s) return; onKapat(); s.git(); };

  let son = "";
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center p-3 pt-[12vh]">
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="perde absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Kapat" onClick={onKapat} />
      <motion.div role="dialog" aria-label="Projede ara" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease }}
        className={cn(KART, "relative w-full max-w-[620px] bg-[#131416]")}>
        <label className="flex h-[54px] items-center gap-3 border-b border-white/[0.06] px-4">
          <Search className="h-[18px] w-[18px] text-white/55" />
          <input ref={girdiRef} autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${p.ad} içinde ara`}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(sonuclar.length - 1, x + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
              if (e.key === "Enter") { e.preventDefault(); sec(sonuclar[i]); }
            }}
            className="min-w-0 flex-1 bg-transparent text-[16px] text-white outline-none placeholder:text-white/40" />
          <kbd className="rounded-[6px] bg-white/[0.08] px-1.5 py-0.5 font-sans text-[11px] text-white/55">Esc</kbd>
        </label>
        <div ref={listeRef} className="max-h-[56vh] overflow-y-auto p-1.5">
          {sonuclar.length === 0 && <p className="px-3 py-6 text-center text-[13.5px] text-white/55">&quot;{q}&quot; ile eşleşen bir şey yok.</p>}
          {sonuclar.map((s, n) => {
            const baslik = s.grup !== son ? s.grup : null;
            son = s.grup;
            return (
              <div key={s.id}>
                {baslik && <p className="px-2.5 pb-1 pt-2.5 text-[12px] font-medium text-white/45">{baslik}</p>}
                <button data-i={n} onMouseMove={() => setI(n)} onClick={() => sec(s)}
                  className={cn("flex w-full items-center gap-3 rounded-[10px] px-2.5 py-1.5 text-left transition-colors", i === n ? "bg-white/[0.08]" : "")}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center">{s.simge}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] text-white">{s.ad}</span>{s.alt && <span className="block truncate text-[12px] text-white/50">{s.alt}</span>}</span>
                  {i === n && <CornerDownLeft className="h-3.5 w-3.5 text-white/45" />}
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function Kare({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="h-8 w-8 rounded-[8px] object-cover" />;
}
