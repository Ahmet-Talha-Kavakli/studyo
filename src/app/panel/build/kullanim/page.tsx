"use client";

import { KullanimPanosu } from "@/components/build/kullanim/KullanimPanosu";

/** Build kredi kullanımı panosu. */
export default function KullanimSayfasi() {
  return (
    <div className="mx-auto max-w-[1320px] px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      <KullanimPanosu />
    </div>
  );
}
