"use client";

import { Suspense, use } from "react";
import { YetenekDuzenleyici } from "@/components/build/yetenekler/YetenekDuzenleyici";

/** Yetenek düzenleyicisi: SKILL.md, dosyalar, sürümler ve canlı deneme. */
export default function YetenekSayfasi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <Suspense fallback={null}><YetenekDuzenleyici key={id} id={id} /></Suspense>;
}
