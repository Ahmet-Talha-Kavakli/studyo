"use client";

/* Route sarmalayıcısı — gerçek bileşen `@/components/studyo/GorselStudyo`.
   Next route dosyalarından fazladan export edilemediği (ve sayfa bileşenine
   özel prop verilemediği) için bileşen ayrı dosyada durur; "Tüm varlıklar"
   sekmesi onu `gomulu` ile mount eder — composer BİREBİR aynısıdır. */
import { GorselStudyo } from "@/components/studyo/GorselStudyo";

export default function GorselStudyoSayfa() {
  return <GorselStudyo />;
}
