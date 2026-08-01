"use client";

/* Route sarmalayıcısı — gerçek bileşen `@/components/studyo/ExplainerStudyo`.
   Next route dosyasından fazladan export edilemediği için bileşen ayrı
   dosyada durur; "Tüm varlıklar" sekmesi onu `gomulu` ile mount eder. */
import { ExplainerStudyo } from "@/components/studyo/ExplainerStudyo";

export default function ExplainerStudyoSayfa() {
  return <ExplainerStudyo />;
}
