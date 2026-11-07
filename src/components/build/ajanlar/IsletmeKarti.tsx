"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { ARAC_KATALOG } from "@/lib/build/ajanKatalog";
import { api } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { AcilirSecim } from "./AjanDuzenleyici";
import type { Ajan } from "./ortak";

export type SiteProje = { id: string; ad: string; kapak?: string; sohbetAcik: boolean; sohbet: number; bagli: boolean; baskaAjan: boolean };

/** İşletme araçlarının okuyacağı Build projesi (sipariş, randevu, stok, yorum). Araçlardan biri açıksa görünür. */
export function IsletmeKarti({ a, d }: { a: Ajan; d: (p: Partial<Ajan>) => void }) {
  const acik = ARAC_KATALOG.filter((t) => t.kategori === "isletme" && a.araclar[t.id]).length;
  const [l, setL] = useState<SiteProje[] | null>(null);
  useEffect(() => { if (acik) api<{ projeler: SiteProje[] }>(`/api/build/ajanlar/${a.id}/kanallar`, { govde: { tur: "site", islem: "projeler" } }).then((v) => setL(v.projeler)).catch(() => setL([])); }, [a.id, acik]);
  if (!acik) return null;
  return (
    <Kart ikon={Store} baslik="İşletme verisi" alt={`${acik} işletme aracı açık; hangi sitenin verisini okusun`} govde="space-y-2 p-4 sm:p-5">
      {l === null ? <div className="h-10 animate-pulse rounded-[14px] bg-white/[0.04]" /> : l.length ? (
        <AcilirSecim deger={a.isletmeProje ?? ""} set={(v) => d({ isletmeProje: v || undefined })} bos="Proje seç" l={l.map((p) => ({ id: p.id, ad: p.ad, alt: p.sohbetAcik ? "Canlı sohbet açık" : "Vayra İşletme", ...(p.kapak ? { gorsel: p.kapak } : {}) }))} />
      ) : <p className="text-[13px] text-white/55">Henüz bir Build projen yok. <Link href="/panel/build" className="text-[#8be6ff] hover:underline">Proje oluştur</Link></p>}
      <p className={cn("text-[12px] leading-relaxed", a.isletmeProje ? "text-white/45" : "text-amber-200/90")}>{a.isletmeProje ? "Sahip araçları (özet, siparişler, randevular, stok, yorumlar) yalnız senin sohbetinde ve zamanlamalarda çalışır; ziyaretçi yalnız sipariş takibini, uygun saatleri, hizmetleri ve stok durumunu görür." : "Proje seçilmeden işletme araçları çalışmaz."}</p>
    </Kart>
  );
}
