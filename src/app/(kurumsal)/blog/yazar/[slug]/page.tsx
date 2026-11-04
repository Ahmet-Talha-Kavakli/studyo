import { BlogKapak } from "@/components/blog/BlogKapak";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { Kap } from "@/components/sirket/ortak";
import { okumaSuresi, siraliYazilar, yazarSlug } from "@/lib/kurumsal/blog";
import { LIDERLIK } from "@/lib/kurumsal/icerik";

type Props = { params: Promise<{ slug: string }> };

const yazarlar = () => Array.from(new Map(siraliYazilar().map((y) => [yazarSlug(y.yazar), y])).values());

export function generateStaticParams() {
  return yazarlar().map((y) => ({ slug: yazarSlug(y.yazar) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const y = yazarlar().find((x) => yazarSlug(x.yazar) === slug);
  return y ? { title: `${y.yazar} · Blog`, description: `${y.yazar} (${y.yazarUnvan}) tarafından yazılan Vayra blog yazıları.` } : { title: "Yazar bulunamadı" };
}

/** Yazar sayfası — biyografi ve yazarın tüm yazıları. */
export default async function YazarSayfasi({ params }: Props) {
  const slug = (await params).slug;
  const ornek = yazarlar().find((x) => yazarSlug(x.yazar) === slug);
  if (!ornek) notFound();
  const yazilar = siraliYazilar().filter((y) => y.yazar === ornek.yazar);
  const profil = LIDERLIK.find((l) => l.ad === ornek.yazar);
  return (
    <Kap className="pb-24 pt-12 sm:pt-16">
      <div className="mx-auto max-w-[1040px]">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-[13px] text-metin-2 hover:text-white"><ArrowLeft className="h-4 w-4" />Blog</Link>
        <header className="mt-8 flex flex-col gap-6 border-b border-white/[0.07] pb-10 sm:flex-row sm:items-center">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-vurgu/15 text-[26px] font-semibold text-vurgu-acik">{ornek.yazarMono}</span>
          <div>
            <h1 className="text-[34px] font-semibold tracking-[-0.03em] text-white">{ornek.yazar}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[14.5px] text-metin-2">{ornek.yazarUnvan}{profil?.konum && <><span aria-hidden>·</span><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profil.konum}</span></>}<span aria-hidden>·</span>{yazilar.length} yazı</p>
            {profil?.bio && <p className="mt-3 max-w-[620px] text-[15px] leading-relaxed text-metin-2">{profil.bio}</p>}
          </div>
        </header>
        <div className="mt-10 grid gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {yazilar.map((y) => (
            <Link key={y.slug} href={`/blog/${y.slug}`} className="group">
              <div className="overflow-hidden rounded-[20px] border border-white/[0.07]">
                <div className="aspect-[16/10] w-full"><BlogKapak y={y} /></div>
              </div>
              <p className="mt-4 text-[12.5px] text-metin-3"><span className="font-medium text-vurgu-acik">{y.kategori}</span> · {y.tarihMetin} · {y.sure ?? okumaSuresi(y)}</p>
              <h2 className="mt-2 text-[18px] font-semibold leading-snug text-white group-hover:underline group-hover:underline-offset-4">{y.baslik}</h2>
              <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-metin-2">{y.ozet}</p>
            </Link>
          ))}
        </div>
      </div>
    </Kap>
  );
}
