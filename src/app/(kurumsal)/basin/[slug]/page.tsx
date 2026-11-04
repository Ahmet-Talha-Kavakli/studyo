import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { Kap, butonSinif } from "@/components/sirket/ortak";
import { KopyalaButonu } from "@/components/sirket/KopyalaButonu";
import { BASIN_BULTENLERI, BOILERPLATE, bultenBul } from "@/lib/kurumsal/basin";
import { ILETISIM } from "@/lib/kurumsal/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BASIN_BULTENLERI.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const b = bultenBul((await params).slug);
  return b ? { title: `${b.baslik} · Basın`, description: b.ozet } : {};
}

export default async function BultenDetay({ params }: Props) {
  const b = bultenBul((await params).slug);
  if (!b) notFound();
  const tamMetin = [b.baslik, b.tarih, ...b.govde, b.alinti ? `"${b.alinti.metin}" — ${b.alinti.kisi}` : "", "Vayra hakkında", BOILERPLATE].filter(Boolean).join("\n\n");

  return (
    <Kap className="pb-24 pt-12 sm:pt-16">
      <div className="mx-auto max-w-[760px]">
        <Link href="/basin" className="inline-flex items-center gap-1.5 text-[13px] text-metin-2 hover:text-white"><ArrowLeft className="h-4 w-4" />Basın odası</Link>
        <p className="mt-8 text-[12.5px] font-medium text-vurgu">{b.kategori} · {b.tarih}</p>
        <h1 className="mt-3 text-balance text-[34px] font-semibold leading-[1.1] tracking-[-0.035em] text-white sm:text-[48px]">{b.baslik}</h1>
        <p className="mt-4 text-[18px] leading-relaxed text-metin-2">{b.ozet}</p>
        <div className="mt-8 flex items-center justify-between border-y border-white/[0.07] py-3">
          <span className="text-[13px] text-metin-3">Basın bülteni · Yayın için serbesttir</span>
          <KopyalaButonu metin={tamMetin} etiket="Metni kopyala" />
        </div>
        <div className="mt-10 space-y-6 text-[17px] leading-[1.8] text-white/85">
          {b.govde.map((p) => <p key={p}>{p}</p>)}
          {b.alinti && (
            <blockquote className="border-l-2 border-vurgu pl-6 text-[20px] font-medium leading-[1.5] text-white">
              &ldquo;{b.alinti.metin}&rdquo;
              <footer className="mt-3 text-[14px] font-normal text-metin-2">— {b.alinti.kisi}</footer>
            </blockquote>
          )}
        </div>
        <section className="mt-14 rounded-[22px] border border-white/[0.07] bg-yuzey p-7">
          <h2 className="text-[15px] font-semibold text-white">Vayra hakkında</h2>
          <p className="mt-3 text-[14.5px] leading-[1.75] text-metin-2">{BOILERPLATE}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`mailto:${ILETISIM.basin}`} className={butonSinif("beyaz")}><Mail className="h-4 w-4" />{ILETISIM.basin}</a>
            <Link href="/basin#medya-kiti" className={butonSinif("ikincil")}>Medya kiti</Link>
          </div>
        </section>
      </div>
    </Kap>
  );
}
