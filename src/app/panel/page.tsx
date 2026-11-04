"use client";

import { Hero } from "@/components/anasayfa/Hero";
import { Araclar } from "@/components/anasayfa/Araclar";
import { Yenilikler } from "@/components/anasayfa/Yenilikler";
import { Modeller } from "@/components/anasayfa/Modeller";
import { Presetler } from "@/components/anasayfa/Presetler";
import { Galeri } from "@/components/anasayfa/Galeri";
import { Etkilesim } from "@/components/anasayfa/Etkilesim";
import { Derinlik } from "@/components/anasayfa/Derinlik";
import { Kapanis } from "@/components/anasayfa/Kapanis";
import { kesfetFont } from "@/components/kesfet/font";
import { AnimasyonBekci } from "@/components/anasayfa/performans";
import { cn } from "@/lib/utils";

/**
 * Ana sayfa (/panel) — 2026-10-28 baştan.
 * Akış: çalışan komut kutusu (Hero) → ne yapmak istiyorsun (araç sahneleri) → etkileşimli 3D zemin → yeni gelenler
 * → model duvarı → preset kapak akışı → galeri ve Originals
 * → derinlik geçişi ve "Sıra sende" → SSS ve altbilgi. Bölümler src/components/anasayfa altında.
 */
export default function AnaSayfa() {
  return (
    <div className={cn("anasayfa kesfet-tema overflow-x-clip", kesfetFont.variable)}>
      <AnimasyonBekci />
      <Hero />
      <Araclar />
      <Etkilesim />
      <Yenilikler />
      <Modeller />
      <Presetler />
      <Galeri />
      <Derinlik />
      <Kapanis />
    </div>
  );
}
