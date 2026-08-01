"use client";

/* Route sarmalayıcısı — gerçek bileşen `@/components/studyo/VideoStudyo`.
   Next route dosyasından fazladan export edilemediği için bileşen ayrı
   dosyada durur; "Tüm varlıklar" sekmesi onu `gomulu` ile mount eder. */
import { VideoStudyo } from "@/components/studyo/VideoStudyo";

export default function VideoStudyoSayfa() {
  return <VideoStudyo />;
}
