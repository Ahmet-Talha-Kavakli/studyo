"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function KopyalaButonu({ metin, etiket = "Kopyala", className }: { metin: string; etiket?: string; className?: string }) {
  const [tamam, setTamam] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard?.writeText(metin); setTamam(true); setTimeout(() => setTamam(false), 1600); }}
      className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-white", className)}>
      {tamam ? <Check className="h-3.5 w-3.5 text-tur-3d" /> : <Copy className="h-3.5 w-3.5" />}{tamam ? "Kopyalandı" : etiket}
    </button>
  );
}
