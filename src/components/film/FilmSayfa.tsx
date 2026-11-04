"use client";

import { useEffect, useMemo, useState } from "react";
import { useFilm } from "@/store/useFilm";
import { FilmGiris } from "./FilmGiris";
import { FilmEditor } from "./FilmEditor";

/** Uzun Video Stüdyosu — hikâye → bölüm/çekim planı → kareler → çekimler → montaj. */
export function FilmSayfa() {
  const projeler = useFilm((s) => s.projeler);
  const aktifId = useFilm((s) => s.aktifId);
  const aktif = useMemo(() => projeler.find((p) => p.id === aktifId) ?? null, [projeler, aktifId]);
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  if (!hazir) return <div className="min-h-[calc(100dvh-var(--ust-nav))] bg-zemin" />;
  return aktif ? <FilmEditor key={aktif.id} p={aktif} /> : <FilmGiris />;
}
