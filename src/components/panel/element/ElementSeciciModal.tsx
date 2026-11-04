"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useScrollKilit, useEscKapat } from "@/hooks/useScrollKilit";
import { useElements, type VElement } from "@/store/useElements";
import { ElementKutuphanesi, ElementDetay, type Kapsam } from "./ElementKutuphanesi";
import { ElementDuzenleModal } from "./ElementDuzenleModal";
import { ElementKapak } from "./elementMeta";

/**
 * Stüdyolardaki element seçici — /panel/element ile aynı kütüphane. Birden çok element seçilip
 * istemde kullanılır; yeni element burada oluşturulunca otomatik seçilir.
 */
export function ElementSeciciModal({ onSec, onKapat }: { onSec: (ad: string) => void; onKapat: () => void }) {
  const elementler = useElements((s) => s.elementler);
  const [secili, setSecili] = useState<string[]>([]);
  const [yeni, setYeni] = useState<Kapsam | null>(null);
  const [duzenle, setDuzenle] = useState<VElement | null>(null);
  const [detayId, setDetayId] = useState<string | null>(null);
  const detay = detayId ? elementler.find((e) => e.id === detayId) : undefined;
  const ust = !!(yeni || duzenle || detay);
  useScrollKilit(true);
  useEscKapat(!ust, onKapat);
  const seciliElementler = secili.map((id) => elementler.find((e) => e.id === id)).filter((x): x is VElement => !!x);

  const ekle = (l: VElement[]) => { l.forEach((e) => onSec(e.ad)); onKapat(); };

  if (typeof document === "undefined") return null;
  return createPortal(
    <div data-yan-panel className="fixed inset-x-0 bottom-0 top-[var(--ust-nav)] z-[240] flex justify-end" role="dialog" aria-modal="true" aria-label="Element seç">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-black/55" onClick={onKapat} />
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex h-full w-[min(1080px,100vw)] flex-col overflow-hidden border-l border-white/[0.08] bg-[#111214]">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-semibold text-white">Element seç</h2>
            <p className="truncate text-[12.5px] text-white/50">Seçtiklerin istemine @ad olarak eklenir; görselleri referans olarak modele gider.</p>
          </div>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <ElementKutuphanesi mod="secici" secili={secili} onSecimDegis={setSecili}
          onDetay={(e) => setDetayId(e.id)} onYeni={(k) => setYeni(k)} onDuzenle={setDuzenle} />
        <AnimatePresence>
          {secili.length > 0 && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="flex items-center gap-3 border-t border-white/[0.08] bg-yuzey/95 px-5 py-3 backdrop-blur">
              <div className="flex -space-x-2">
                {seciliElementler.slice(0, 5).map((e) => <ElementKapak key={e.id} e={e} className="h-9 w-9 rounded-full ring-2 ring-yuzey" ikonBoyut={14} />)}
              </div>
              <p className="min-w-0 flex-1 truncate text-[13px] text-metin">{seciliElementler.map((e) => `@${e.ad}`).join(" ")}</p>
              <button onClick={() => setSecili([])} className="h-9 rounded-full px-3.5 text-[13px] text-white/65 transition hover:bg-white/[0.06] hover:text-white">Temizle</button>
              <button onClick={() => ekle(seciliElementler)} className="h-9 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-white/90">{secili.length} elementi ekle</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {detay && <ElementDetay key="detay" e={detay} onKapat={() => setDetayId(null)} onDuzenle={() => setDuzenle(detay)} onKullan={() => ekle([detay])} />}
      </AnimatePresence>
      <AnimatePresence>
        {yeni && <ElementDuzenleModal key="yeni" element={null} onKapat={() => setYeni(null)}
          tohumDeger={yeni.tip === "tur" ? { tur: yeni.tur } : undefined}
          hedefKapsam={yeni.tip === "proje" ? { projeId: yeni.projeId } : undefined}
          onOlustu={(id) => setSecili((l) => [...l, id])} />}
      </AnimatePresence>
      <AnimatePresence>
        {duzenle && <ElementDuzenleModal key={`d-${duzenle.id}`} element={duzenle} onKapat={() => setDuzenle(null)} />}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
