"use client";

import { useParams } from "next/navigation";
import { TuvalEditor } from "@/components/tuval/TuvalEditor";

/* Canvas editörü — bileşen: components/tuval/TuvalEditor (2026-10-27 sıfırdan). */
export default function CanvasEditorSayfa() {
  const { id } = useParams<{ id: string }>();
  return <TuvalEditor id={id} />;
}
