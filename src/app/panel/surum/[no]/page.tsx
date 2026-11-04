import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { SURUMLER, surumBul } from "@/lib/surumler";
import { SurumGirisi } from "@/components/surum/SurumGirisi";
import { BultenFormu } from "@/components/blog/BlogParcalari";
import { kesfetFont } from "@/components/kesfet/font";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return SURUMLER.map((s) => ({ no: s.no }));
}

export async function generateMetadata({ params }: { params: Promise<{ no: string }> }): Promise<Metadata> {
  const s = surumBul(decodeURIComponent((await params).no));
  return s ? { title: `${s.no} · ${s.baslik} · Sürüm notları`, description: s.ozet } : { title: "Sürüm bulunamadı" };
}

/** Tek sürüm sayfası — kalıcı bağlantı, tüm özellikler görselleriyle, önceki/sonraki sürüm. */
export default async function SurumSayfasi({ params }: { params: Promise<{ no: string }> }) {
  const { no } = await params;
  const s = surumBul(decodeURIComponent(no));
  if (!s) notFound();
  const i = SURUMLER.findIndex((x) => x.no === s.no);
  const yeni = SURUMLER[i - 1];
  const eski = SURUMLER[i + 1];

  return (
    <div className={cn("kesfet-tema min-h-screen bg-zemin pb-28", kesfetFont.variable)}>
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6">
        <nav aria-label="Konum" className="flex items-center gap-1 pb-10 pt-10 text-[13px] text-metin-2">
          <Link href="/panel/surum" className="inline-flex items-center gap-1.5 transition hover:text-white"><ArrowLeft className="h-3.5 w-3.5" />Sürüm notları</Link>
          <ChevronRight className="h-3.5 w-3.5" /><span className="tabular-nums text-white/80">{s.no}</span>
        </nav>

        <SurumGirisi s={s} tam etkin />

        <div className="mt-14 grid max-w-[740px] gap-3 sm:grid-cols-2 lg:ml-[220px]">
          {eski ? (
            <Link href={`/panel/surum/${eski.no}`} className="group rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-white/[0.08] transition hover:ring-white/[0.18]">
              <span className="flex items-center gap-1.5 text-[12.5px] text-metin-2"><ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />Önceki sürüm · {eski.no}</span>
              <span className="mt-1.5 block text-[14.5px] font-medium text-white">{eski.baslik}</span>
            </Link>
          ) : <span />}
          {yeni && (
            <Link href={`/panel/surum/${yeni.no}`} className="group rounded-[18px] bg-white/[0.03] p-4 text-right ring-1 ring-white/[0.08] transition hover:ring-white/[0.18]">
              <span className="flex items-center justify-end gap-1.5 text-[12.5px] text-metin-2">Sonraki sürüm · {yeni.no}<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
              <span className="mt-1.5 block text-[14.5px] font-medium text-white">{yeni.baslik}</span>
            </Link>
          )}
        </div>
        <div className="mt-14 max-w-[740px] lg:ml-[220px]"><BultenFormu kompakt /></div>
      </div>
    </div>
  );
}
