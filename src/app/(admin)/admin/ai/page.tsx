"use client";

import { Sparkles } from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { BolumBaslik } from "@/components/admin/ui/temel";
import { AiSohbet } from "@/components/admin/ai/Sohbet";

export default function AiSayfa() {
  return (
    <RotaGuard modul="ai">
      <BolumBaslik baslik="Yönetim asistanı" ozet="Gerçek panel verisini okur; hesap işlemlerini senin onayınla yapar. Tam sohbet için ANTHROPIC_API_KEY gerekir." ikon={Sparkles} />
      <div className="ad-glass h-[calc(100vh-11rem)] overflow-hidden !p-0">
        <AiSohbet />
      </div>
    </RotaGuard>
  );
}
