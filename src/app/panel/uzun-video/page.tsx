"use client";

/* Route sarmalayıcısı — gerçek bileşen `@/components/studyo/UzunVideoStudyo`.
   Next route dosyasından fazladan export edilemediği için bileşen ayrı
   dosyada durur; "Tüm varlıklar" sekmesi onu `gomulu` ile mount eder. */
import { UzunVideoStudyo } from "@/components/studyo/UzunVideoStudyo";

export default function UzunVideoStudyoSayfa() {
  return <UzunVideoStudyo />;
}
