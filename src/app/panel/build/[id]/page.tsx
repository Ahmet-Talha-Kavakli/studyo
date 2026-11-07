"use client";

import { use } from "react";
import { Calisma } from "@/components/build/calisma/Calisma";

/** Vayra Build çalışma alanı: solda sohbet, sağda önizleme / kod / veriler / ayarlar. */
export default function BuildProje({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <Calisma key={id} id={id} />;
}
