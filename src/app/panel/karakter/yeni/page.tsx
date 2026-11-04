"use client";

import { Suspense } from "react";
import { KarakterOlustur } from "@/components/karakter/KarakterOlustur";

/** Karakter oluştur / düzenle (?id=). */
export default function YeniKarakterSayfa() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-var(--ust-nav))] bg-zemin" />}>
      <KarakterOlustur />
    </Suspense>
  );
}
