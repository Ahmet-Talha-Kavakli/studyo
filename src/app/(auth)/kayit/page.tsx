"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthKart } from "@/components/auth/AuthKart";

function Kayit() {
  const params = useSearchParams();
  const geri = params.get("geri") ?? "/panel";
  return <AuthKart baslangic="kayit" geri={geri} />;
}

export default function KayitSayfa() {
  return (
    <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-glow" />}>
      <Kayit />
    </Suspense>
  );
}
