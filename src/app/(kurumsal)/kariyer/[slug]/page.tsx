import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Clock, Users, ArrowLeft, Check, Send } from "lucide-react";
import { POZISYONLAR, pozisyonBul } from "@/lib/kurumsal/pozisyonlar";

export function generateStaticParams() {
  return POZISYONLAR.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = pozisyonBul(slug);
  if (!p) return { title: "Pozisyon bulunamadı — Vayra" };
  return { title: `${p.ad} — Kariyer — Vayra`, description: p.ozet };
}

export default async function PozisyonDetay({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = pozisyonBul(slug);
  if (!p) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 pt-10 pb-16">
      <Link href={"/kariyer" as never} className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--color-metin-2)] transition-colors hover:text-[color:var(--color-metin)]">
        <ArrowLeft className="h-4 w-4" /> Tüm pozisyonlar
      </Link>

      {/* Başlık */}
      <span className="kr-rozet inline-flex rounded-full px-3 py-1 text-[13px] font-semibold">{p.ekip}</span>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-[color:var(--color-metin)] md:text-4xl">{p.ad}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[color:var(--color-metin-2)]">
        <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[color:var(--kr-lime-metin)]" /> {p.yer}</span>
        <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-[color:var(--kr-lime-metin)]" /> {p.tur}</span>
        <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-[color:var(--kr-lime-metin)]" /> {p.ekip}</span>
      </div>

      <p className="mt-6 text-lg leading-relaxed text-[color:var(--color-metin-2)]">{p.ozet}</p>

      {/* Başvur kutusu (üst) */}
      <div className="kr-kart mt-8 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="font-semibold text-[color:var(--color-metin)]">Bu pozisyon sana göre mi?</p>
          <p className="text-sm text-[color:var(--color-metin-3)]">Başvurunu birkaç dakikada tamamla.</p>
        </div>
        <a href={`mailto:careers@vayra.ai?subject=Başvuru: ${encodeURIComponent(p.ad)}`} className="kr-cta inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold">
          <Send className="h-4 w-4" /> Başvur
        </a>
      </div>

      {/* Görevler */}
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold text-[color:var(--color-metin)]">Ne yapacaksın?</h2>
        <ul className="space-y-3">
          {p.gorevler.map((g) => (
            <li key={g} className="flex gap-3 text-[15px] leading-relaxed text-[color:var(--color-metin-2)]">
              <Check className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[color:var(--kr-lime-metin)]" /> {g}
            </li>
          ))}
        </ul>
      </section>

      {/* Nitelikler */}
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold text-[color:var(--color-metin)]">Sende aradıklarımız</h2>
        <ul className="space-y-3">
          {p.nitelikler.map((n) => (
            <li key={n} className="flex gap-3 text-[15px] leading-relaxed text-[color:var(--color-metin-2)]">
              <Check className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[color:var(--kr-lime-metin)]" /> {n}
            </li>
          ))}
        </ul>
      </section>

      {/* Artı */}
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold text-[color:var(--color-metin)]">Artı olur</h2>
        <div className="flex flex-wrap gap-2">
          {p.arti.map((a) => (
            <span key={a} className="rounded-full border border-[color:var(--color-kenar)] px-3 py-1.5 text-sm text-[color:var(--color-metin-2)]">{a}</span>
          ))}
        </div>
      </section>

      {/* Başvur kutusu (alt) */}
      <div className="kr-kart mt-12 p-8 text-center">
        <h3 className="text-xl font-bold text-[color:var(--color-metin)]">İlgini çektiyse başvur</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-[color:var(--color-metin-2)]">CV'ni ve neden Vayra'da olmak istediğini anlatan kısa bir notu gönder. Her başvuruyu okuyoruz.</p>
        <a href={`mailto:careers@vayra.ai?subject=Başvuru: ${encodeURIComponent(p.ad)}`} className="kr-cta mt-6 inline-flex h-12 items-center gap-2 rounded-xl px-6 text-[15px] font-semibold">
          <Send className="h-4 w-4" /> {p.ad} için başvur
        </a>
      </div>
    </article>
  );
}
