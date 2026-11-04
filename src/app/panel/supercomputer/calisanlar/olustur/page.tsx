"use client";

import { Suspense } from "react";
import { CalisanOlusturucu } from "@/components/sc/sayfalar/CalisanOlusturucu";

/* Çalışan oluşturucu — ?id= düzenle, ?kopya= hazır çalışandan kopya. */
export default function CalisanOlusturSayfa() {
  return <Suspense fallback={null}><CalisanOlusturucu /></Suspense>;
}
