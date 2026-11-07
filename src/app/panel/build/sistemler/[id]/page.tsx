"use client";

import { use } from "react";
import { SistemDuzenleyici } from "@/components/build/sistemler/SistemDuzenleyici";

/** Sistem düzenleyicisi: akış tuvali, tetik ve adım ayarları, çalışmalar. */
export default function SistemSayfasi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SistemDuzenleyici key={id} id={id} />;
}
