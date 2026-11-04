import type { Metadata } from "next";
import { Suspense } from "react";
import { DurumGecmis } from "@/components/durum/DurumGecmis";

export const metadata: Metadata = { title: "Olay geçmişi" };

export default function DurumGecmisSayfasi() {
  return <Suspense><DurumGecmis /></Suspense>;
}
