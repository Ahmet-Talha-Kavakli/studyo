import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ArrowRight } from "lucide-react";
import { BLOG_YAZILARI, blogBul, type BlogBlok } from "@/lib/kurumsal/blog";
import { CTASerit } from "@/components/kurumsal/UI";

export function generateStaticParams() {
  return BLOG_YAZILARI.map((y) => ({ slug: y.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const y = blogBul(slug);
  if (!y) return { title: "Yazı bulunamadı — Vayra" };
  return { title: `${y.baslik} — Vayra Blog`, description: y.ozet };
}

function Blok({ blok }: { blok: BlogBlok }) {
  if (blok.tip === "h2") return <h2 className="mt-10 mb-3 text-2xl font-bold text-[color:var(--color-metin)]">{blok.metin}</h2>;
  if (blok.tip === "p") return <p className="mb-5 text-[17px] leading-[1.75] text-[color:var(--color-metin-2)]">{blok.metin}</p>;
  if (blok.tip === "alinti") return (
    <blockquote className="my-8 border-l-4 border-[#cfe93f] bg-[color:var(--kr-lime-yumusak)] px-5 py-4 text-lg font-medium italic text-[color:var(--color-metin)]">{blok.metin}</blockquote>
  );
  return (
    <ul className="mb-6 space-y-2.5">
      {blok.ogeler.map((o) => (
        <li key={o} className="flex gap-3 text-[17px] leading-relaxed text-[color:var(--color-metin-2)]">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b8e02f]" /> {o}
        </li>
      ))}
    </ul>
  );
}

export default async function BlogYaziDetay({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const y = blogBul(slug);
  if (!y) notFound();

  const ilgili = BLOG_YAZILARI.filter((x) => x.slug !== y.slug && x.kategori === y.kategori).slice(0, 2);
  const digerleri = ilgili.length ? ilgili : BLOG_YAZILARI.filter((x) => x.slug !== y.slug).slice(0, 2);

  return (
    <>
      <article className="mx-auto max-w-2xl px-4 pt-10 pb-12">
        <Link href={"/blog" as never} className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--color-metin-2)] transition-colors hover:text-[color:var(--color-metin)]">
          <ArrowLeft className="h-4 w-4" /> Tüm yazılar
        </Link>

        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="kr-rozet rounded-full px-2.5 py-0.5 text-[12px] font-semibold">{y.kategori}</span>
          <span className="flex items-center gap-1 text-[color:var(--color-metin-3)]"><Clock className="h-3.5 w-3.5" /> {y.sure}</span>
        </div>

        <h1 className="text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-metin)] md:text-4xl">{y.baslik}</h1>
        <p className="mt-4 text-lg text-[color:var(--color-metin-2)]">{y.ozet}</p>

        {/* Yazar */}
        <div className="mt-6 flex items-center gap-3 border-y border-[color:var(--color-kenar)] py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#e8ff7a] to-[#a8d61e] text-sm font-bold text-[#14160b]">{y.yazarMono}</span>
          <div className="text-sm">
            <div className="font-semibold text-[color:var(--color-metin)]">{y.yazar}</div>
            <div className="text-[color:var(--color-metin-3)]">{y.yazarUnvan} · {y.tarihMetin}</div>
          </div>
        </div>

        {/* Gövde */}
        <div className="mt-8">
          {y.govde.map((b, i) => <Blok key={i} blok={b} />)}
        </div>
      </article>

      {/* İlgili yazılar */}
      {digerleri.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 pb-8">
          <h2 className="mb-5 text-lg font-bold text-[color:var(--color-metin)]">İlgili yazılar</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {digerleri.map((d) => (
              <Link key={d.slug} href={`/blog/${d.slug}` as never} className="group">
                <div className="kr-kart kr-kart-hover flex h-full flex-col p-5">
                  <span className="kr-metin-lime text-xs font-semibold">{d.kategori}</span>
                  <h3 className="mt-1 font-bold text-[color:var(--color-metin)]">{d.baslik}</h3>
                  <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-[color:var(--color-metin-2)]">{d.ozet}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--kr-lime-metin)]">Oku <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <CTASerit
        baslik="Vayra ile üretmeye başla"
        ozet="Okumak güzel, üretmek daha güzel. İlk üretimin ücretsiz."
        birincil={{ ad: "Ücretsiz başla", href: "/kayit" }}
        ikincil={{ ad: "Tüm yazılar", href: "/blog" }}
      />
    </>
  );
}
