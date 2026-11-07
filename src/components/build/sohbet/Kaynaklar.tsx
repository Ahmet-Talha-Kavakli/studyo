"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, FileText, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { alanAdi, favicon } from "./ortak";
import type { Alinti, Parca } from "./tipler";

/**
 * Alıntılar (Claude web araması): metin bloklarına bağlı kaynaklar numaralanır; metinde numaralı çip (üzerine
 * gelince kaynak kartı: site simgesi, başlık, alan adı, alıntılanan cümle), yanıtın sonunda kaynak listesi.
 */
export type KaynakDizini = { liste: (Alinti & { no: number })[]; no: Map<string, number> };

export function kaynakDizini(parcalar: Parca[]): KaynakDizini {
  const no = new Map<string, number>();
  const liste: (Alinti & { no: number })[] = [];
  for (const p of parcalar) {
    if (p.tur !== "metin") continue;
    for (const a of p.alintilar ?? []) if (!no.has(a.url)) { no.set(a.url, liste.length + 1); liste.push({ ...a, no: liste.length + 1 }); }
  }
  return { liste, no };
}

/** Ajanın bilgi kaynağı alıntıları: model metne [n] yazar; listede olan numaralar çipe dönüşür. */
export function bilgiDizini(l: { no: number; ad: string; url?: string; parca: string }[]): KaynakDizini {
  const liste = l.map((k) => ({ no: k.no, url: k.url ?? "", baslik: k.ad, metin: k.parca }));
  return { liste, no: new Map(liste.filter((k) => k.url).map((k) => [k.url, k.no])) };
}
export const bilgiIsaretle = (md: string, d: KaynakDizini) => md.replace(/\[(\d{1,3})\](?!\()/g, (x, n) => (d.liste.some((k) => k.no === Number(n)) ? `[${n}](#kaynak-${n})` : x));
const web = (u: string) => /^https?:\/\//.test(u);

/** Ardışık metin parçalarını tek Markdown'a birleştirir; alıntılı parçanın sonuna [n](#kaynak-n) işaretleri ekler. */
export function metinGruplari(parcalar: Parca[], d: KaynakDizini): ({ tur: "metin"; metin: string; son: number } | { tur: "diger"; parca: Parca; i: number })[] {
  const o: ({ tur: "metin"; metin: string; son: number } | { tur: "diger"; parca: Parca; i: number })[] = [];
  parcalar.forEach((p, i) => {
    if (p.tur !== "metin") { o.push({ tur: "diger", parca: p, i }); return; }
    const isaret = [...new Set((p.alintilar ?? []).map((a) => d.no.get(a.url)!).filter(Boolean))].map((n) => `[${n}](#kaynak-${n})`).join("");
    const son = o[o.length - 1];
    const ek = p.metin + (isaret ? `${/\s$/.test(p.metin) ? "" : " "}${isaret}` : "");
    if (son?.tur === "metin") { son.metin += ek; son.son = i; } else o.push({ tur: "metin", metin: ek, son: i });
  });
  return o;
}

/** Metin içindeki numaralı çip + kaynak kartı. */
export function AlintiCipi({ n, k }: { n: number; k?: Alinti }) {
  const [kart, setKart] = useState<{ x: number; y: number; alt: boolean } | null>(null);
  const zaman = useRef<ReturnType<typeof setTimeout>>(undefined);
  const ref = useRef<HTMLAnchorElement>(null);
  const ac = () => {
    clearTimeout(zaman.current);
    const r = ref.current?.getBoundingClientRect();
    if (r) setKart({ x: Math.max(8, Math.min(r.left - 20, innerWidth - 328)), y: r.top > 220 ? r.top - 8 : r.bottom + 8, alt: r.top <= 220 });
  };
  const kapat = () => { zaman.current = setTimeout(() => setKart(null), 120); };
  useEffect(() => () => clearTimeout(zaman.current), []);
  if (!k) return <sup className="text-white/40">[{n}]</sup>;
  const w = web(k.url);
  return (
    <>
      <a ref={ref} href={w ? k.url : undefined} target="_blank" rel="noopener noreferrer" tabIndex={0} onMouseEnter={ac} onMouseLeave={kapat} onFocus={ac} onBlur={kapat}
        className="mx-[1px] inline-flex h-[18px] min-w-[18px] -translate-y-[1px] items-center justify-center rounded-full bg-[#55d6fd]/[0.14] px-1 align-middle text-[10.5px] font-semibold leading-none text-[#8be6ff] no-underline transition-colors hover:bg-[#55d6fd]/[0.28]">
        {n}
      </a>
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {kart && (
            <motion.a href={w ? k.url : undefined} target="_blank" rel="noopener noreferrer" onMouseEnter={() => clearTimeout(zaman.current)} onMouseLeave={kapat}
              initial={{ opacity: 0, y: kart.alt ? -4 : 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
              style={{ left: kart.x, ...(kart.alt ? { top: kart.y } : { bottom: innerHeight - kart.y }) }}
              className="bd-panel fixed z-[140] block w-[320px] rounded-[16px] p-3 text-left no-underline">
              <span className="flex items-center gap-2">
                {w ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={favicon(k.url)} alt="" className="h-4 w-4 rounded-[4px]" /> : <FileText className="h-4 w-4 text-[#8be6ff]" />}
                <span className="truncate text-[12px] text-white/55">{w ? alanAdi(k.url) : "Bilgi kaynağı"}</span>
                <span className="ml-auto rounded-full bg-white/[0.07] px-1.5 text-[11px] text-white/60">{n}</span>
              </span>
              <span className="mt-1.5 line-clamp-2 block text-[13.5px] font-semibold leading-snug text-white">{k.baslik}</span>
              {k.metin && <span className="mt-1.5 line-clamp-3 block border-l-2 border-[#55d6fd]/40 pl-2 text-[12.5px] leading-relaxed text-white/60">{k.metin}</span>}
            </motion.a>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

/** Yanıt sonundaki kaynak listesi (katlanır). */
export function KaynakListesi({ d }: { d: KaynakDizini }) {
  const [acik, setAcik] = useState(false);
  if (!d.liste.length) return null;
  const goster = acik ? d.liste : d.liste.slice(0, 4);
  return (
    <div className="mt-4 overflow-hidden rounded-[18px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
      <button type="button" onClick={() => setAcik((x) => !x)} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left">
        <Library className="h-4 w-4 text-[#8be6ff]" />
        <span className="text-[13px] font-semibold text-white">Kaynaklar</span>
        <span className="rounded-full bg-white/[0.07] px-2 py-px text-[11.5px] text-white/60">{d.liste.length}</span>
        <span className="ml-auto flex -space-x-1.5">
          {d.liste.filter((k) => web(k.url)).slice(0, 5).map((k) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={k.url} src={favicon(k.url)} alt="" className="h-5 w-5 rounded-full bg-[#1b1c1f] p-[3px] ring-1 ring-[#141416]" />)}
        </span>
        {d.liste.length > 4 && <ChevronDown className={cn("h-3.5 w-3.5 text-white/45 transition-transform", acik && "rotate-180")} />}
      </button>
      <ol className="divide-y divide-white/[0.05] border-t border-white/[0.06]">
        {goster.map((k) => (
          <li key={`${k.no}-${k.url}`}>
            <a href={web(k.url) ? k.url : undefined} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3.5 py-2 transition-colors hover:bg-white/[0.04]">
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#55d6fd]/[0.14] px-1 text-[11px] font-semibold text-[#8be6ff]">{k.no}</span>
              {web(k.url) ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={favicon(k.url)} alt="" className="h-4 w-4 shrink-0 rounded-[4px]" /> : <FileText className="h-4 w-4 shrink-0 text-[#8be6ff]" />}
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white/90">{k.baslik}</span><span className="block truncate text-[11.5px] text-white/45">{web(k.url) ? alanAdi(k.url) : k.metin?.slice(0, 120) || "Bilgi kaynağı"}</span></span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
