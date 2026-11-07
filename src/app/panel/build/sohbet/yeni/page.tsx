import { Suspense } from "react";
import { YeniSohbet } from "@/components/build/sohbet/YeniSohbet";

/** Yeni sohbet (?klasor=<id> klasörde, ?gecici=1 geçici sohbet). */
export default function YeniSohbetSayfasi() {
  return <Suspense><YeniSohbet /></Suspense>;
}
