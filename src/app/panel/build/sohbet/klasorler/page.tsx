import { Suspense } from "react";
import { KlasorListesi } from "@/components/build/sohbet/Klasorler";

/** Sohbet klasörleri: talimat, bilgi dosyaları ve sohbetler bir arada (Build "Projeler"inden ayrı). */
export default function KlasorlerSayfasi() {
  return <Suspense><KlasorListesi /></Suspense>;
}
