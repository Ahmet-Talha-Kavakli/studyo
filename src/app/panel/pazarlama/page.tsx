"use client";

/* Route sarmalayıcısı — gerçek bileşen `@/components/studyo/PazarlamaAna`.
   Next route dosyasından fazladan export edilemediği için bileşen ayrı
   dosyada durur; "Tüm varlıklar" sekmesi onu `gomulu` ile mount eder. */
import { PazarlamaAna } from "@/components/studyo/PazarlamaAna";

export default function PazarlamaAnaSayfa() {
  return <PazarlamaAna />;
}
