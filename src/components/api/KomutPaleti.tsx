"use client";

/**
 * API konsolu Ctrl+K paleti: sayfalar, modeller (oyun alanı), uç noktalar (konsol), son üretimler
 * ve hata kodları tek aramada. Ok tuşlarıyla gezilir, Enter ile açılır.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CornerDownLeft, ListTree, Search, Shapes, Terminal } from "lucide-react";
import { MODELLER } from "@/lib/catalog";
import { UC_NOKTALAR } from "@/lib/api/ucnoktalar";
import { HATALAR } from "@/lib/api/hatalar";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { YontemRozet } from "./ui";
import { cn } from "@/lib/utils";

type Sonuc = { id: string; tur: string; baslik: string; alt?: string; href: string; ikon?: React.ElementType; logo?: string; yontem?: string };
const sade = (s: string) => s.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");

export function KomutPaleti({ acik, onKapat, sayfalar }: { acik: boolean; onKapat: () => void; sayfalar: { ad: string; href: string; ikon: React.ElementType }[] }) {
  const router = useRouter();
  const uretimler = useApiAnahtar((s) => s.uretimler);
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const girdi = useRef<HTMLInputElement>(null);
  const liste = useRef<HTMLDivElement>(null);

  useEffect(() => { if (acik) { setQ(""); setI(0); setTimeout(() => girdi.current?.focus(), 30); } }, [acik]);

  const tum = useMemo<Sonuc[]>(() => [
    ...sayfalar.map((s) => ({ id: `s-${s.href}`, tur: "Sayfa", baslik: s.ad, href: s.href, ikon: s.ikon })),
    ...MODELLER.map((m) => ({ id: `m-${m.id}`, tur: "Model", baslik: m.ad, alt: `${m.id} · ${m.kredi} kredi`, href: `/panel/api/modeller/${m.id}`, logo: `${m.ad} ${m.saglayici} ${m.id}` })),
    ...UC_NOKTALAR.map((u) => ({ id: `u-${u.id}`, tur: "Uç nokta", baslik: u.ad, alt: `/v1${u.yol}`, href: `/panel/api/konsol?uc=${u.id}`, ikon: Terminal, yontem: u.yontem })),
    ...uretimler.slice(0, 40).map((u) => ({ id: `r-${u.id}`, tur: "İstek", baslik: u.id, alt: `${u.model} · ${u.status}`, href: `/panel/api/istekler?id=${u.id}`, ikon: ListTree })),
    ...HATALAR.map((h) => ({ id: `h-${h.kod}`, tur: "Hata kodu", baslik: h.kod, alt: `${h.http} · ${h.mesaj}`, href: `/panel/api/hatalar#${h.kod}`, ikon: AlertTriangle })),
  ], [sayfalar, uretimler]);

  const sonuc = useMemo(() => {
    const t = sade(q.trim());
    if (!t) return tum.filter((x) => x.tur === "Sayfa" || x.tur === "Model").slice(0, 14);
    return tum.filter((x) => sade(`${x.baslik} ${x.alt ?? ""} ${x.tur}`).includes(t)).slice(0, 30);
  }, [q, tum]);
  useEffect(() => setI(0), [q]);
  useEffect(() => { liste.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest" }); }, [i]);

  const git = (s: Sonuc | undefined) => { if (!s) return; onKapat(); router.push(s.href); };
  const tus = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(sonuc.length - 1, x + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); git(sonuc[i]); }
    else if (e.key === "Escape") onKapat();
  };

  if (typeof document === "undefined") return null;
  let onceki = "";
  return createPortal(
    <AnimatePresence>
      {acik && (
        <div className="kesfet-tema fixed inset-0 z-[130] flex items-start justify-center p-4 pt-[12vh]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onKapat} className="perde absolute inset-0" />
          <motion.div role="dialog" aria-label="API'de ara" initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.16 }}
            className="relative w-full max-w-[620px] overflow-hidden rounded-[26px] bg-[#141518]/95 ring-1 ring-white/[0.12] backdrop-blur-xl">
            <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-4">
              <Search className="h-4 w-4 shrink-0 text-metin-2" />
              <input ref={girdi} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={tus} placeholder="Model, uç nokta, istek kimliği, hata kodu ya da sayfa ara"
                className="h-14 min-w-0 flex-1 bg-transparent text-[15.5px] text-white outline-none placeholder:text-white/40" aria-label="Ara" />
              <kbd>Esc</kbd>
            </div>
            <div ref={liste} className="max-h-[min(420px,60vh)] overflow-y-auto p-1.5">
              {sonuc.map((s, j) => {
                const baslik = s.tur !== onceki ? s.tur : null; onceki = s.tur;
                const I = s.ikon ?? Shapes;
                return (
                  <div key={s.id}>
                    {baslik && <p className="px-3 pb-1.5 pt-3 text-[12.5px] font-medium text-white/50">{baslik}</p>}
                    <button data-i={j} onMouseEnter={() => setI(j)} onClick={() => git(s)}
                      className={cn("flex w-full items-center gap-3 rounded-[14px] px-3 py-2 text-left transition-colors", j === i ? "bg-white/[0.08] ring-1 ring-white/[0.08]" : "")}>
                      {s.logo
                        ? <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/[0.08]"><ModelLogo ad={s.logo} boyut={16} /></span>
                        : s.yontem ? <YontemRozet yontem={s.yontem} /> : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06]"><I className={cn("h-3.5 w-3.5", j === i ? "text-[#55d6fd]" : "text-white/60")} /></span>}
                      <span className="min-w-0 flex-1"><span className="block truncate text-[14px] text-white">{s.baslik}</span>{s.alt && <span className="block truncate text-[12px] text-metin-2">{s.alt}</span>}</span>
                      {j === i && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-metin-2" />}
                    </button>
                  </div>
                );
              })}
              {!sonuc.length && <p className="px-4 py-10 text-center text-[13.5px] text-metin-2">&ldquo;{q}&rdquo; için sonuç yok</p>}
            </div>
            <div className="flex items-center gap-4 border-t border-white/[0.07] px-4 py-2.5 text-[12px] text-metin-2">
              <span className="flex items-center gap-1.5"><kbd>↑</kbd><kbd>↓</kbd>gez</span>
              <span className="flex items-center gap-1.5"><kbd>Enter</kbd>aç</span>
              <span className="ml-auto">{tum.length} sonuç içinde</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
