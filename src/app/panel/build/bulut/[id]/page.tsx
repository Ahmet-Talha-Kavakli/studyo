"use client";

import { use } from "react";
import { BulutProje } from "@/components/build/bulut/BulutProje";

/** Proje bulut konsolu. */
export default function BulutProjeSayfasi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BulutProje key={id} id={id} />;
}
