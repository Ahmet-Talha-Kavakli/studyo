"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthKart } from "@/components/auth/AuthKart";

function Giris() {
  const params = useSearchParams();
  const geri = params.get("geri") ?? "/panel";
  return <AuthKart baslangic="giris" geri={geri} />;
}

export default function GirisSayfa() {
  return (
    <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-glow" />}>
      <Giris />
    </Suspense>
  );
}
