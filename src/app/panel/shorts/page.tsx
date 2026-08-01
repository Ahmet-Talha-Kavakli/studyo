"use client";

/* Route sarmalayıcısı — gerçek bileşen `@/components/studyo/ShortsStudyo`.
   Next route dosyasından fazladan export edilemediği için bileşen ayrı
   dosyada durur; "Tüm varlıklar" sekmesi onu `gomulu` ile mount eder. */
import { ShortsStudyo } from "@/components/studyo/ShortsStudyo";

export default function ShortsStudyoSayfa() {
  return <ShortsStudyo />;
}
