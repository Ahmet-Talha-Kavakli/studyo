"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DonemSecici, KurumsalSerit, PlanKartlari } from "@/components/fiyat/Planlar";
import type { Donem } from "@/lib/fiyat";
import { BolumBaslik, Belir, Kap } from "./ortak";

/** Ana sayfa fiyat özeti — /fiyatlandirma ile aynı plan kartları (components/fiyat). */
export function Fiyat() {
  const [donem, setDonem] = useState<Donem>("yillik");
  return (
    <section className="py-16 sm:py-20">
      <Kap>
        <BolumBaslik ortala ust="Fiyatlandırma" baslik="İhtiyacına göre bir plan."
          alt="Türk lirası fiyatlar, istediğin zaman iptal. Krediler tüm modellerde geçerli." />
        <Belir className="mb-10 flex justify-center"><DonemSecici donem={donem} setDonem={setDonem} kimlik="ana-fiyat" /></Belir>
        <PlanKartlari donem={donem} mod="site" />
        <Belir><KurumsalSerit /></Belir>
        <p className="mt-6 text-center text-[12.5px] text-metin-3">
          Fiyatlara KDV dahil değildir.{" "}
          <Link href="/fiyatlandirma" className="inline-flex items-center gap-0.5 text-metin-2 underline-offset-4 hover:text-white hover:underline">
            Planları karşılaştır <ArrowUpRight className="h-3 w-3" />
          </Link>
        </p>
      </Kap>
    </section>
  );
}
