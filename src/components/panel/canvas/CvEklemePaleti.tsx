"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { CV, CV_LIME } from "@/lib/canvasTema";
import { PALET, type NodeTur } from "@/lib/canvasVeri";

/* ============================================================
   EKLEME PALETİ — tek kaynak.

   Referansta AYNI palet iki yerden açılır:
     · alt araç çubuğundaki `+` butonu (çubuğun üstünde)
     · tuval boşluğuna SAĞ TIK (imlecin olduğu yerde)
   Bu yüzden ayrı bileşen: iki çağrı da birebir aynı listeyi görür,
   fark yalnızca konumlandırma.
   ============================================================ */

export function CvEklemePaleti({
  onSec, onKapat, stil,
}: {
  /** Seçilen node tipi. Sağ tıkta imleç konumuna, `+`'da merkeze eklenir. */
  onSec: (tip: NodeTur) => void;
  onKapat: () => void;
  /** Konumlandırma — çağıran belirler (çubuk üstü ya da imleç noktası). */
  stil: React.CSSProperties;
}) {
  const [ara, setAra] = useState("");
  const q = ara.trim().toLocaleLowerCase("tr");

  /* Escape ile kapat. Bu OLMADAN tam-ekran örtü açık kalıp tuvali
     tamamen kilitliyordu (tıklama/sürükleme hiçbiri geçmiyordu). */
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onKapat]);

  const suzulu = useMemo(
    () => (q ? PALET.filter((p) => p.ad.toLocaleLowerCase("tr").includes(q)) : PALET),
    [q],
  );

  return (
    <>
      <span className="fixed inset-0 z-40" onClick={onKapat} onContextMenu={(e) => { e.preventDefault(); onKapat(); }} />
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.14 }}
        onMouseDown={(e) => e.stopPropagation()}
        className="z-50 overflow-hidden rounded-[14px]"
        style={{
          width: 214,
          background: CV.bar,
          border: `1px solid ${CV.barKenar}`,
          boxShadow: "none",
          ...stil,
        }}>
        <div className="p-2 pb-1">
          <label className="flex h-9 items-center gap-2 rounded-[8px] px-2.5" style={{ background: CV.panelAra }}>
            <Search className="h-3.5 w-3.5 shrink-0" style={{ color: CV.panelPlaceholder }} />
            <input
              autoFocus
              value={ara}
              onChange={(e) => setAra(e.target.value)}
              placeholder="Ara"
              className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-[#656668]"
            />
          </label>
        </div>

        <div className="max-h-[320px] overflow-y-auto pb-2 [scrollbar-width:thin]">
          {suzulu.map((p, i) => {
            const oncekiGrup = i > 0 ? suzulu[i - 1].grup : null;
            return (
              <div key={`${p.tip}-${p.grup}-${i}`}>
                {p.grup && p.grup !== oncekiGrup && (
                  <p className="px-3 pb-1 pt-2 text-[12px]" style={{ color: "#7A7C7E" }}>{p.grup}</p>
                )}
                <button
                  onClick={() => { onSec(p.tip); onKapat(); }}
                  className="flex h-9 w-full items-center gap-2.5 px-3 text-left transition-colors hover:bg-white/[0.06]">
                  <span className="h-[22px] w-[22px] shrink-0 rounded-[6px]"
                    style={{ background: `linear-gradient(140deg, ${p.renk}, ${p.renk}99)` }} />
                  <span className="flex-1 truncate text-[14px] text-white">{p.ad}</span>
                  {p.yeni && (
                    <span className="rounded-[3px] px-1 text-[9px] font-bold" style={{ background: CV_LIME, color: "#0F1113" }}>
                      Yeni
                    </span>
                  )}
                </button>
              </div>
            );
          })}
          {suzulu.length === 0 && (
            <p className="px-3 py-6 text-center text-[13px]" style={{ color: CV.metinGri }}>Sonuç yok</p>
          )}
        </div>
      </motion.div>
    </>
  );
}
