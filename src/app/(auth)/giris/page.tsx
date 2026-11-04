"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthEkran } from "@/components/auth/AuthEkran";

function Ekran() {
  const geri = useSearchParams().get("geri");
  // Yalnız site içi yollara dön (açık yönlendirmeye karşı)
  return <AuthEkran niyet="giris" geri={geri && geri.startsWith("/") && !geri.startsWith("//") ? geri : "/panel"} />;
}

export default function Sayfa() {
  return <Suspense fallback={<div className="min-h-[100dvh] bg-[#08080a]" />}><Ekran /></Suspense>;
}
