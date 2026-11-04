"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CornerDownLeft, MessageSquare, Plus, Search } from "lucide-react";
import { useSupercomputer } from "@/store/useSupercomputer";
import { yanitMetni } from "@/lib/scSohbet";
import { cn } from "@/lib/utils";

/**
 * Sohbetlerde ara (Ctrl K) — komut paleti: üstte arama, ilk satır "Yeni sohbet", altında
 * başlık ve içerikte eşleşen sohbetler (eşleşen parça vurgulu, son etkinlik zamanı sağda).
 * ↑/↓ gezin, Enter aç, Esc kapat.
 */
const zamanYaz = (z: number) => {
  const fark = Date.now() - z, dk = Math.round(fark / 60000);
  if (dk < 1) return "şimdi";
  if (dk < 60) return `${dk} dk önce`;
  const sa = Math.round(dk / 60);
  if (sa < 24) return `${sa} sa önce`;
  const g = Math.round(sa / 24);
  return g < 7 ? `${g} gün önce` : new Date(z).toLocaleDateString("tr", { day: "numeric", month: "short" });
};

function Vurgu({ metin, q }: { metin: string; q: string }) {
  if (!q) return <>{metin}</>;
  const i = metin.toLocaleLowerCase("tr").indexOf(q);
  if (i < 0) return <>{metin}</>;
  return <>{metin.slice(0, i)}<mark className="rounded-[3px] bg-[var(--sc-aksan)]/25 text-[var(--sc-metin)]">{metin.slice(i, i + q.length)}</mark>{metin.slice(i + q.length)}</>;
}

export function SCAramaModal({ acik, onKapat }: { acik: boolean; onKapat: () => void }) {
  const router = useRouter();
  const sohbetler = useSupercomputer((s) => s.sohbetler);
  const [ara, setAra] = useState("");
  const [imlec, setImlec] = useState(0);
  const [hazir, setHazir] = useState(false);
  const listeRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setHazir(true); }, []);
  useEffect(() => { if (acik) { setAra(""); setImlec(0); } }, [acik]);

  const q = ara.trim().toLocaleLowerCase("tr");
  const sonuc = useMemo(() => {
    return sohbetler.filter((s) => !s.gecici && !s.kilit)
      .map((s) => {
        const metinler = s.mesajlar.map((m) => (m.yanit ? yanitMetni(m.yanit) : m.metin).replace(/<[^>]+>/g, "").replace(/```[\s\S]*?```/g, " ").replace(/[*_`#>|]+/g, "").replace(/\s+/g, " ").trim()).filter(Boolean);
        const eslesen = q ? metinler.find((t) => t.toLocaleLowerCase("tr").includes(q)) : undefined;
        let ozet = eslesen ?? metinler[metinler.length - 1] ?? "";
        if (eslesen) { const i = eslesen.toLocaleLowerCase("tr").indexOf(q); ozet = (i > 40 ? "…" : "") + eslesen.slice(Math.max(0, i - 40), i + 120); }
        return { s, ozet, z: s.mesajlar[s.mesajlar.length - 1]?.zaman ?? s.olusturma, uygun: !q || s.baslik.toLocaleLowerCase("tr").includes(q) || !!eslesen };
      })
      .filter((x) => x.uygun).sort((a, b) => b.z - a.z).slice(0, 30);
  }, [sohbetler, q]);
  const toplam = sonuc.length + 1;

  const sec = (i: number) => {
    onKapat();
    if (i === 0) router.push(q ? `/panel/supercomputer?istem=${encodeURIComponent(ara.trim())}` : "/panel/supercomputer");
    else router.push(`/panel/supercomputer/${sonuc[i - 1].s.id}`);
  };

  useEffect(() => {
    if (!acik) return;
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onKapat(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setImlec((i) => Math.min(i + 1, toplam - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setImlec((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter") { e.preventDefault(); sec(imlec); }
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { listeRef.current?.querySelector(`[data-i="${imlec}"]`)?.scrollIntoView({ block: "nearest" }); }, [imlec]);

  if (!hazir) return null;
  const satir = (i: number) => cn("flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors", i === imlec ? "bg-white/[0.07]" : "hover:bg-white/[0.04]");

  return createPortal(
    <AnimatePresence>
      {acik && (
        <div className="sc-kapsam fixed inset-0 z-[200]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="perde absolute inset-0 bg-black/60" onClick={onKapat} />
          <motion.div role="dialog" aria-modal="true" aria-label="Sohbetlerde ara"
            initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-[12vh] flex max-h-[70vh] w-[min(640px,calc(100vw-32px))] -translate-x-1/2 flex-col overflow-hidden rounded-[20px] bg-[#18181b] ring-1 ring-inset ring-white/[0.1]">
            <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.07] px-4">
              <Search className="h-[18px] w-[18px] shrink-0 text-[var(--sc-metin-3)]" />
              <input value={ara} onChange={(e) => { setAra(e.target.value); setImlec(0); }} placeholder="Sohbetlerde ara" autoFocus aria-label="Sohbetlerde ara"
                className="h-14 w-full bg-transparent text-[16px] text-[var(--sc-metin)] outline-none placeholder:text-[var(--sc-metin-3)]" />
              <kbd className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-[var(--sc-metin-3)]">Esc</kbd>
            </div>
            <div ref={listeRef} className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">
              <button data-i={0} onMouseEnter={() => setImlec(0)} onClick={() => sec(0)} className={satir(0)}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--sc-aksan)] text-[var(--sc-aksan-metin)]"><Plus className="h-4 w-4" strokeWidth={2.4} /></span>
                <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--sc-metin)]">{q ? <>Yeni sohbet: <span className="text-[var(--sc-metin-2)]">{ara.trim()}</span></> : "Yeni sohbet"}</span>
                {imlec === 0 && <CornerDownLeft className="h-3.5 w-3.5 text-[var(--sc-metin-3)]" />}
              </button>
              {sonuc.length > 0 && <p className="px-3 pb-1 pt-3 text-[12px] font-medium text-[var(--sc-metin-3)]">{q ? `${sonuc.length} sonuç` : "Son sohbetler"}</p>}
              {sonuc.map(({ s, ozet, z }, k) => (
                <button key={s.id} data-i={k + 1} onMouseEnter={() => setImlec(k + 1)} onClick={() => sec(k + 1)} className={cn(satir(k + 1), "items-start")}>
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[var(--sc-metin-3)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] text-[var(--sc-metin)]"><Vurgu metin={s.baslik} q={q} /></span>
                    {ozet && <span className="mt-0.5 block truncate text-[12.5px] text-[var(--sc-metin-3)]"><Vurgu metin={ozet} q={q} /></span>}
                  </span>
                  <span className="shrink-0 pt-0.5 text-[12px] text-[var(--sc-metin-3)]">{zamanYaz(z)}</span>
                </button>
              ))}
              {q && sonuc.length === 0 && <p className="px-3 py-8 text-center text-[13.5px] text-[var(--sc-metin-3)]">“{ara.trim()}” için eşleşen sohbet yok</p>}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
