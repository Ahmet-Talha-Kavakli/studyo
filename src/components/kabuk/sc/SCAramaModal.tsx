"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageSquare, Command } from "lucide-react";
import { useSupercomputer } from "@/store/useSupercomputer";
import { cn } from "@/lib/utils";

/* ============================================================
   SUPERCOMPUTER ARAMA — referanstaki cam modal birebir.

   Referans anatomisi:
     • ekranın üst-ortasında büyük cam kart (~980px), radius ~28px
     • üstte kocaman arama satırı: 🔍 + "Ara" (28px), altında ince ayraç
     • "Sohbetler" gri bölüm etiketi
     • satırlar: konuşma balonu ikonu + BAŞLIK(19px beyaz) +
                 tek satır gri ÖZET(17px, taşarsa …)
     • ilk satır varsayılan olarak vurgulu (klavye seçimi)
     • sağ altta ⌘ rozeti
   ============================================================ */

export function SCAramaModal({ acik, onKapat }: { acik: boolean; onKapat: () => void }) {
  const router = useRouter();
  const sohbetler = useSupercomputer((s) => s.sohbetler);
  const [ara, setAra] = useState("");
  const [imlec, setImlec] = useState(0);
  const [hazir, setHazir] = useState(false);
  useEffect(() => { setHazir(true); }, []);

  // Açılışta sıfırla + arka plan kaydırmasını kilitle.
  useEffect(() => {
    if (!acik) return;
    setAra(""); setImlec(0);
    const eski = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = eski; };
  }, [acik]);

  const q = ara.trim().toLocaleLowerCase("tr");
  const liste = useMemo(() => {
    const hepsi = sohbetler ?? [];
    const suzulmus = !q ? hepsi : hepsi.filter((s) => {
      const govde = (s.mesajlar ?? []).map((m) => m.metin).join(" ");
      return `${s.baslik} ${govde}`.toLocaleLowerCase("tr").includes(q);
    });
    return suzulmus.slice(0, 12).map((s) => ({
      id: s.id,
      baslik: s.baslik,
      // Referansta satırın altında sohbetin son metninden bir özet var.
      ozet: (s.mesajlar ?? []).at(-1)?.metin?.replace(/\s+/g, " ").trim() ?? "",
    }));
  }, [sohbetler, q]);

  // Klavye: ↑/↓ gezin, Enter aç, Esc kapat.
  useEffect(() => {
    if (!acik) return;
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onKapat(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setImlec((i) => Math.min(i + 1, liste.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setImlec((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && liste[imlec]) { onKapat(); router.push(`/panel/supercomputer/${liste[imlec].id}`); }
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, [acik, liste, imlec, onKapat, router]);

  if (!hazir) return null;

  return createPortal(
    <AnimatePresence>
      {acik && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[200] bg-black/45 backdrop-blur-[2px]" onClick={onKapat} />
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.985 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            role="dialog" aria-modal="true" aria-label="Sohbetlerde ara"
            /* sc-kapsam ŞART: portal body'ye taşındığı için kapsam dışında
               --sc-* değişkenleri çözülmüyor ve modal şeffaf kalıyordu. */
            className="sc-kapsam border border-[var(--sc-kenar)] bg-[var(--sc-kart)] shadow-[0_28px_70px_-18px_rgba(0,0,0,0.8)] fixed left-1/2 top-[10vh] z-[201] flex max-h-[74vh] w-[min(880px,90vw)] -translate-x-1/2 flex-col overflow-hidden rounded-[26px]">
            {/* arama satırı */}
            <div className="flex shrink-0 items-center gap-3.5 border-b border-[var(--sc-kenar)] px-6 py-[18px]">
              <Search className="h-[23px] w-[23px] shrink-0 text-[var(--sc-metin-3)]" />
              <input value={ara} onChange={(e) => { setAra(e.target.value); setImlec(0); }}
                placeholder="Ara" autoFocus
                className="w-full bg-transparent text-[23px] text-[var(--sc-metin)] outline-none placeholder:text-[var(--sc-metin-3)]" />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 [scrollbar-width:thin]">
              {liste.length > 0 ? (
                <>
                  <p className="px-4 pb-1.5 pt-1 text-[14px] text-[var(--sc-metin-3)]">Sohbetler</p>
                  {liste.map((s, i) => (
                    <button key={s.id}
                      onMouseEnter={() => setImlec(i)}
                      onClick={() => { onKapat(); router.push(`/panel/supercomputer/${s.id}`); }}
                      className={cn(
                        "flex w-full items-start gap-3.5 rounded-2xl px-4 py-3 text-left transition-colors",
                        i === imlec ? "bg-[var(--sc-cip)]" : "hover:bg-[var(--sc-cip)]",
                      )}>
                      <MessageSquare className="mt-[3px] h-[19px] w-[19px] shrink-0 text-[var(--sc-metin-3)]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[17.5px] text-[var(--sc-metin)]">{s.baslik}</span>
                        {s.ozet && (
                          <span className="mt-0.5 block truncate text-[15px] text-[var(--sc-metin-3)]">{s.ozet}</span>
                        )}
                      </span>
                    </button>
                  ))}
                </>
              ) : (
                <p className="px-4 py-14 text-center text-[16px] text-[var(--sc-metin-3)]">
                  {q ? "Eşleşen sohbet yok" : "Henüz sohbetin yok"}
                </p>
              )}
            </div>

            {/* alt şerit — sağda ⌘ rozeti (referans) */}
            <div className="flex shrink-0 items-center justify-end border-t border-[var(--sc-kenar)] px-5 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--sc-cip)] text-[var(--sc-metin-3)]">
                <Command className="h-4 w-4" />
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
