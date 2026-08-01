"use client";

/* Route sarmalayıcısı — gerçek bileşen `@/components/studyo/SinemaStudyo`.
   Next route dosyasından fazladan export edilemediği için bileşen ayrı
   dosyada durur; "Tüm varlıklar" sekmesi onu `gomulu` ile mount eder. */
import { SinemaStudyo } from "@/components/studyo/SinemaStudyo";

export default function SinemaStudyoSayfa() {
  return <SinemaStudyo />;
}
