"use client";

/* Route sarmalayıcısı — gerçek bileşen `@/components/studyo/SesStudyo`.
   Next route dosyasından fazladan export edilemediği için bileşen ayrı
   dosyada durur; "Tüm varlıklar" sekmesi onu `gomulu` ile mount eder. */
import { SesStudyo } from "@/components/studyo/SesStudyo";

export default function SesStudyoSayfa() {
  return <div className="ses-kapsam contents"><SesStudyo /></div>;
}
