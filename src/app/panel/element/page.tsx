"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useElements, type ElementTur, type VElement } from "@/store/useElements";
import { ElementDetayPaneli } from "@/components/panel/element/sayfa/ElementDetayPaneli";
import { ElementSayfa } from "@/components/panel/element/sayfa/ElementSayfa";
import { ElementDuzenleModal } from "@/components/panel/element/ElementDuzenleModal";
import { elementiStudyodaKullan } from "@/components/panel/element/KullanSecici";

/**
 * Elementler — karakter, mekân, obje ve stillerin tek merkezi. Kütüphane, düzenleyici ve detay,
 * stüdyolardaki seçiciyle aynı bileşenlerdir. `?el=Ad` bağlantısı o elementin ayrıntısını açar.
 */
function ElementSayfasi() {
  const router = useRouter();
  const arama = useSearchParams();
  const elementler = useElements((s) => s.elementler);
  const [yeni, setYeni] = useState<{ tur?: ElementTur; gorsel?: string; projeId?: string } | null>(null);
  const [duzenle, setDuzenle] = useState<VElement | null>(null);
  const [detayId, setDetayId] = useState<string | null>(null);
  const detay = detayId ? elementler.find((e) => e.id === detayId) : undefined;

  useEffect(() => {
    const ad = arama.get("el");
    if (!ad) return;
    const e = useElements.getState().elementler.find((x) => x.ad.toLocaleLowerCase("tr") === ad.toLocaleLowerCase("tr"));
    if (e) setDetayId(e.id);
  }, [arama]);

  return (
    <>
      <ElementSayfa onDetay={(e) => setDetayId(e.id)} onDuzenle={setDuzenle} onKullan={(e, h) => { elementiStudyodaKullan(e, h); router.push(h === "video" ? "/panel/video" : "/panel/gorsel"); }}
        onYeni={(p) => setYeni(p ?? {})} />
      <AnimatePresence>
        {detay && <ElementDetayPaneli key="detay" e={detay} onKapat={() => setDetayId(null)} onDuzenle={() => setDuzenle(detay)} onKullan={(h) => { elementiStudyodaKullan(detay, h); router.push(h === "video" ? "/panel/video" : "/panel/gorsel"); }} />}
      </AnimatePresence>
      <AnimatePresence>
        {yeni && <ElementDuzenleModal key="yeni" element={null} onKapat={() => setYeni(null)}
          tohumDeger={{ ...(yeni.tur ? { tur: yeni.tur } : {}), ...(yeni.gorsel ? { gorsel: yeni.gorsel } : {}) }}
          hedefKapsam={yeni.projeId ? { projeId: yeni.projeId } : undefined}
          onOlustu={(id) => setDetayId(id)} />}
      </AnimatePresence>
      <AnimatePresence>
        {duzenle && <ElementDuzenleModal key={`d-${duzenle.id}`} element={duzenle} onKapat={() => setDuzenle(null)} />}
      </AnimatePresence>
    </>
  );
}

export default function Sayfa() {
  return <Suspense><ElementSayfasi /></Suspense>;
}
