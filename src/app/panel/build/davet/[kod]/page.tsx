"use client";

import { use } from "react";
import { DavetSayfasi } from "@/components/build/ekip/DavetSayfasi";

/** Vayra Build ekip daveti: /panel/build/davet/<kod>. */
export default function BuildDavet({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = use(params);
  return <DavetSayfasi kod={kod} />;
}
