"use client";

import { use } from "react";
import { CalismaAyrinti } from "@/components/build/sistemler/CalismaAyrinti";

/** Çalışma görünümü: akışın salt okunur kopyası, adım girdi ve çıktıları, yeniden oynatma. */
export default function CalismaSayfasi({ params }: { params: Promise<{ id: string; cid: string }> }) {
  const { id, cid } = use(params);
  return <CalismaAyrinti key={cid} sistemId={id} cid={cid} />;
}
