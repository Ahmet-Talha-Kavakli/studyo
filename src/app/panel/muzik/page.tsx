"use client";

/* Route sarmalayıcısı — gerçek bileşen `@/components/studyo/MuzikStudyo`.
   Next route dosyasından fazladan export edilemediği için bileşen ayrı
   dosyada durur; "Tüm varlıklar" sekmesi onu `gomulu` ile mount eder. */
import { MuzikStudyo } from "@/components/studyo/MuzikStudyo";

export default function MuzikStudyoSayfa() {
  return <div className="ses-kapsam contents"><MuzikStudyo /></div>;
}
