"use client";

import { useEffect, useState } from "react";
import { InfluencerStudyo } from "@/components/influencer/InfluencerStudyo";

/** AI Influencer Stüdyosu — kayıtlı karakterler tarayıcı deposundan geldiği için istemcide açılır. */
export default function InfluencerSayfa() {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  if (!hazir) return <div className="h-[calc(100dvh-var(--ust-nav))] bg-zemin" />;
  return <div className="ses-kapsam contents"><InfluencerStudyo /></div>;
}
