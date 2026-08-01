"use client";

import { Sparkles } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { BolumBaslik } from "@/components/admin/ui/temel";
import { AiSohbet } from "@/components/admin/ai/Sohbet";

export default function AiSayfa() {
  return (
    <RotaGuard modul="ai">
      <BolumBaslik baslik="AI Asistan" ozet="Panelindeki her şeye hakim, gerçek Claude destekli asistan" ikon={Sparkles} />
      <div className="ad-glass h-[calc(100vh-11rem)] overflow-hidden !p-0">
        <AiSohbet />
      </div>
    </RotaGuard>
  );
}
