"use client";

import { use } from "react";
import { YazdirSayfasi } from "@/components/build/sohbet/Yazdir";

/** Sohbetin yazdırma ve PDF sayfası. */
export default function Sayfa({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <YazdirSayfasi id={id} />;
}
