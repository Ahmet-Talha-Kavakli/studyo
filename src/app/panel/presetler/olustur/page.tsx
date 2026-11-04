"use client";

import { Suspense } from "react";
import { PresetStudyosu } from "@/components/presetler/PresetStudyosu";

/** Preset stüdyosu — kendi presetini kur, test et, yayınla. ?id=<taslak> düzenler, ?kaynak=<resmi> çoğaltır. */
export default function PresetOlusturSayfasi() {
  return <Suspense><PresetStudyosu /></Suspense>;
}
