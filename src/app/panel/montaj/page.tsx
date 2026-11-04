"use client";

import { useEffect, useMemo, useState } from "react";
import { useMontaj } from "@/store/useMontaj";
import { MontajGiris } from "@/components/montaj/MontajGiris";
import { MontajEditor } from "@/components/montaj/MontajEditor";

/**
 * Montaj Stüdyosu — çok katmanlı tarayıcı içi video editörü.
 * Giriş ekranında montajlar ve başlangıçlar; bir montaj seçilince editör açılır.
 * Önizleme ve dışa aktarma aynı canvas motorunu kullanır (src/lib/montajMotor.ts).
 */
export default function MontajStudyo() {
  const projeler = useMontaj((s) => s.projeler);
  const aktifId = useMontaj((s) => s.aktifId);
  const aktif = useMemo(() => projeler.find((p) => p.id === aktifId) ?? null, [projeler, aktifId]);
  // Kalıcı depo istemcide yüklenir; ilk karede sunucu çıktısıyla uyuşsun diye bekle.
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  if (!hazir) return <div className="min-h-[calc(100dvh-var(--ust-nav))] bg-zemin" />;
  return <div className="montaj-kapsam contents">{aktif ? <MontajEditor key={aktif.id} proje={aktif} /> : <MontajGiris />}</div>;
}
