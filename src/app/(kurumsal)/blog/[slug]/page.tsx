import { BlogKapak } from "@/components/blog/BlogKapak";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, Info, Lightbulb } from "lucide-react";
import { Kap, KapanisBandi } from "@/components/sirket/ortak";
import { KodEditor } from "@/components/api/ui";
import { BultenFormu, Icindekiler, OkumaIlerleme, Paylas } from "@/components/blog/BlogParcalari";
import { BLOG_YAZILARI, blogBul, okumaSuresi, siraliYazilar, tarihMetni, yazarSlug, type BlogBlok } from "@/lib/kurumsal/blog";
import { LIDERLIK } from "@/lib/kurumsal/icerik";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_YAZILARI.map((y) => ({ slug: y.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const y = blogBul((await params).slug);
  if (!y) return { title: "Yazı bulunamadı" };
  return {
    title: `${y.baslik} · Blog`, description: y.ozet, authors: [{ name: y.yazar }], keywords: y.etiketler,
    alternates: { canonical: `/blog/${y.slug}` },
    openGraph: { title: y.baslik, description: y.ozet, images: [y.kapak], type: "article", publishedTime: y.tarih, modifiedTime: y.guncelleme ?? y.tarih, authors: [y.yazar], tags: y.etiketler },
    twitter: { card: "summary_large_image", title: y.baslik, description: y.ozet, images: [y.kapak] },
  };
}

const capa = (m: string) => m.toLocaleLowerCase("tr-TR").replace(/[çğıöşü]/g, (h) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[h]!).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const NOT = {
  bilgi: { ikon: Info, sinif: "border-sky-400/25 bg-sky-400/[0.06]", renk: "text-sky-300", ad: "Bilgi" },
  ipucu: { ikon: Lightbulb, sinif: "border-emerald-400/25 bg-emerald-400/[0.06]", renk: "text-emerald-300", ad: "İpucu" },
  uyari: { ikon: AlertTriangle, sinif: "border-amber-400/25 bg-amber-400/[0.06]", renk: "text-amber-300", ad: "Dikkat" },
};

function Blok({ b }: { b: BlogBlok }) {
  switch (b.tip) {
    case "h2": {
      const id = capa(b.metin);
      return (
        <h2 id={id} className="group scroll-mt-24 pt-6 text-[26px] font-semibold tracking-[-0.02em] text-white">
          {b.metin}<a href={`#${id}`} aria-label="Bu bölüme bağlantı" className="ml-2 text-metin-3 opacity-0 transition-opacity group-hover:opacity-100">#</a>
        </h2>
      );
    }
    case "h3": return <h3 id={capa(b.metin)} className="scroll-mt-24 pt-2 text-[20px] font-semibold tracking-[-0.015em] text-white">{b.metin}</h3>;
    case "p": return <p className="text-[17.5px] leading-[1.8] text-white/80">{b.metin}</p>;
    case "alinti": return (
      <figure className="border-l-2 border-vurgu py-1 pl-6">
        <blockquote className="text-[22px] font-medium leading-[1.45] tracking-[-0.01em] text-white">{b.metin}</blockquote>
        {b.kaynak && <figcaption className="mt-2 text-[14px] text-metin-3">— {b.kaynak}</figcaption>}
      </figure>
    );
    case "liste": {
      const L = b.sirali ? "ol" : "ul";
      return (
        <L className="space-y-3">
          {b.ogeler.map((o, i) => (
            <li key={o} className="flex gap-3 text-[17px] leading-[1.7] text-white/80">
              {b.sirali ? <span className="mt-[3px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.07] font-mono text-[12px] text-white">{i + 1}</span>
                : <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-vurgu" />}
              {o}
            </li>
          ))}
        </L>
      );
    }
    case "gorsel": return (
      <figure className="-mx-4 sm:mx-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.src} alt={b.aciklama ?? ""} loading="lazy" className="w-full rounded-none border-y border-white/[0.07] object-cover sm:rounded-[20px] sm:border" />
        {b.aciklama && <figcaption className="mt-3 px-4 text-center text-[13.5px] text-metin-3 sm:px-0">{b.aciklama}</figcaption>}
      </figure>
    );
    case "not": {
      const n = NOT[b.tur ?? "bilgi"];
      return (
        <aside className={cn("flex gap-3 rounded-2xl border p-4", n.sinif)}>
          <n.ikon className={cn("mt-0.5 h-5 w-5 shrink-0", n.renk)} />
          <div><p className={cn("text-[14px] font-semibold", n.renk)}>{b.baslik ?? n.ad}</p><p className="mt-1 text-[15.5px] leading-relaxed text-white/80">{b.metin}</p></div>
        </aside>
      );
    }
    case "kod": return <KodEditor kod={b.kod} dil={b.dil} satirNo={false} maxH="none" dosyaAdi={b.dil === "bash" ? "terminal" : b.dil} />;
  }
}

export default async function BlogYazisi({ params }: Props) {
  const y = blogBul((await params).slug);
  if (!y) notFound();
  const sirali = siraliYazilar();
  const i = sirali.findIndex((x) => x.slug === y.slug);
  const yeni = sirali[i - 1], eski = sirali[i + 1];
  const ilgili = sirali.filter((x) => x.slug !== y.slug)
    .map((x) => ({ x, puan: Number(x.kategori === y.kategori) * 2 + (x.etiketler ?? []).filter((e) => y.etiketler?.includes(e)).length }))
    .sort((a, b) => b.puan - a.puan || b.x.tarih.localeCompare(a.x.tarih)).slice(0, 3).map((a) => a.x);
  const basliklar = y.govde.filter((b): b is Extract<BlogBlok, { tip: "h2" | "h3" }> => b.tip === "h2" || b.tip === "h3").map((b) => ({ id: capa(b.metin), metin: b.metin, alt: b.tip === "h3" }));
  const yazar = LIDERLIK.find((l) => l.ad === y.yazar);
  const sure = y.sure ?? okumaSuresi(y);
  const jsonLd = {
    "@context": "https://schema.org", "@type": "BlogPosting", headline: y.baslik, description: y.ozet, image: [`https://vayra.ai${y.kapak}`],
    datePublished: y.tarih, dateModified: y.guncelleme ?? y.tarih, keywords: y.etiketler?.join(", "),
    author: { "@type": "Person", name: y.yazar, jobTitle: y.yazarUnvan, url: `https://vayra.ai/blog/yazar/${yazarSlug(y.yazar)}` },
    publisher: { "@type": "Organization", name: "Vayra", logo: { "@type": "ImageObject", url: "https://vayra.ai/icon.png" } },
    mainEntityOfPage: `https://vayra.ai/blog/${y.slug}`, inLanguage: "tr-TR",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <OkumaIlerleme hedef="yazi-govde" />
      <Kap className="pt-12 sm:pt-16">
        <div className="mx-auto max-w-[760px]">
          <nav aria-label="Konum" className="flex items-center gap-2 text-[13px] text-metin-2">
            <Link href="/blog" className="inline-flex items-center gap-1.5 hover:text-white"><ArrowLeft className="h-4 w-4" />Blog</Link>
            <span className="text-metin-3">/</span><Link href={`/blog?kategori=${encodeURIComponent(y.kategori)}`} className="hover:text-white">{y.kategori}</Link>
          </nav>
          <h1 className="mt-8 text-balance text-[36px] font-semibold leading-[1.08] tracking-[-0.035em] text-white sm:text-[52px]">{y.baslik}</h1>
          <p className="mt-5 text-[19px] leading-relaxed text-metin-2">{y.ozet}</p>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-white/[0.07] py-4">
            <Link href={`/blog/yazar/${yazarSlug(y.yazar)}`} className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-vurgu/15 text-[13px] font-semibold text-vurgu-acik">{y.yazarMono}</span>
              <span>
                <span className="block text-[14px] font-semibold text-white hover:underline">{y.yazar}</span>
                <span className="block text-[12.5px] text-metin-3">
                  <time dateTime={y.tarih}>{y.tarihMetin}</time>{y.guncelleme && <> · güncellendi <time dateTime={y.guncelleme}>{tarihMetni(y.guncelleme)}</time></>} · {sure}
                </span>
              </span>
            </Link>
            <Paylas baslik={y.baslik} yol={`/blog/${y.slug}`} />
          </div>
        </div>
      </Kap>

      <Kap className="mt-10">
        <div className="mx-auto max-w-[1040px] overflow-hidden rounded-[26px] border border-white/[0.07]">
          <div className="aspect-[16/8] w-full"><BlogKapak y={y} buyuk /></div>
        </div>
      </Kap>

      <Kap className="py-14 sm:py-16">
        <div className="mx-auto grid max-w-[1180px] grid-cols-[minmax(0,1fr)] gap-10 xl:grid-cols-[200px_minmax(0,760px)_200px] xl:justify-center">
          <aside className="hidden xl:block"><div className="sticky top-24"><Icindekiler basliklar={basliklar} /></div></aside>
          <div className="mx-auto w-full min-w-0 max-w-[760px]">
            <article id="yazi-govde" className="space-y-7">
              {y.govde.map((b, k) => <Blok key={k} b={b} />)}
            </article>

            {y.etiketler && y.etiketler.length > 0 && (
              <div className="mt-12 flex flex-wrap gap-1.5">
                {y.etiketler.map((e) => <Link key={e} href={`/blog?etiket=${encodeURIComponent(e)}`} className="rounded-md bg-white/[0.05] px-2.5 py-1 text-[12.5px] font-medium text-metin-2 hover:bg-white/[0.09] hover:text-white">#{e}</Link>)}
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-white/[0.07] py-5">
              <p className="text-[14px] font-medium text-white">Bu yazıyı paylaş</p>
              <Paylas baslik={y.baslik} yol={`/blog/${y.slug}`} />
            </div>

            {/* Yazar */}
            <Link href={`/blog/yazar/${yazarSlug(y.yazar)}`} className="mt-8 flex gap-4 rounded-2xl border border-white/[0.07] bg-yuzey p-5 hover:border-white/[0.14]">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-vurgu/15 text-[17px] font-semibold text-vurgu-acik">{y.yazarMono}</span>
              <span>
                <span className="block text-[12px] text-metin-3">Yazar</span>
                <span className="block text-[16px] font-semibold text-white">{y.yazar}</span>
                <span className="block text-[13px] text-metin-2">{y.yazarUnvan}{yazar?.konum ? ` · ${yazar.konum}` : ""}</span>
                {yazar?.bio && <span className="mt-2 block text-[14px] leading-relaxed text-metin-2">{yazar.bio}</span>}
              </span>
            </Link>

            {/* Önceki / sonraki */}
            <nav aria-label="Diğer yazılar" className="mt-6 grid gap-3 sm:grid-cols-2">
              {eski ? (
                <Link href={`/blog/${eski.slug}`} className="group rounded-2xl border border-white/[0.07] p-4 hover:border-white/[0.16]">
                  <span className="flex items-center gap-1.5 text-[12px] text-metin-3"><ArrowLeft className="h-3.5 w-3.5" />Önceki yazı</span>
                  <span className="mt-1.5 block text-[15px] font-medium leading-snug text-white group-hover:underline">{eski.baslik}</span>
                </Link>
              ) : <span />}
              {yeni && (
                <Link href={`/blog/${yeni.slug}`} className="group rounded-2xl border border-white/[0.07] p-4 text-right hover:border-white/[0.16]">
                  <span className="flex items-center justify-end gap-1.5 text-[12px] text-metin-3">Sonraki yazı<ArrowRight className="h-3.5 w-3.5" /></span>
                  <span className="mt-1.5 block text-[15px] font-medium leading-snug text-white group-hover:underline">{yeni.baslik}</span>
                </Link>
              )}
            </nav>
          </div>
          <div className="hidden xl:block" />
        </div>
      </Kap>

      <Kap className="pb-6">
        <div className="mx-auto max-w-[1040px]">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">İlgili yazılar</h2>
            <Link href="/blog" className="text-[13.5px] font-medium text-metin-2 hover:text-white">Tüm yazılar</Link>
          </div>
          <div className="grid gap-x-3 gap-y-8 sm:grid-cols-3">
            {ilgili.map((x) => (
              <Link key={x.slug} href={`/blog/${x.slug}`} className="group">
                <div className="overflow-hidden rounded-[18px] border border-white/[0.07]">
                  <div className="aspect-[16/10] w-full"><BlogKapak y={x} /></div>
                </div>
                <p className="mt-3 text-[12px] font-medium text-vurgu-acik">{x.kategori} · {x.tarihMetin}</p>
                <p className="mt-1.5 text-[16px] font-semibold leading-snug text-white group-hover:underline group-hover:underline-offset-4">{x.baslik}</p>
              </Link>
            ))}
          </div>
          <div className="mt-14"><BultenFormu /></div>
        </div>
      </Kap>

      <KapanisBandi baslik="Okuduğunu dene." alt="Ücretsiz hesabınla tüm stüdyolara hemen başla." birincil={{ ad: "Ücretsiz başla", href: "/panel" }} ikincil={{ ad: "Fiyatlandırma", href: "/fiyatlandirma" }} gorsel={y.kapak} />
    </>
  );
}
