import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Kap, KapanisBandi } from "@/components/sirket/ortak";
import { HIKAYELER, hikayeBul } from "@/lib/kurumsal/musteriler";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return HIKAYELER.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const h = hikayeBul((await params).slug);
  return h ? { title: `${h.sirket} · Müşteri hikâyesi`, description: h.ozet } : {};
}

export default async function HikayeDetay({ params }: Props) {
  const h = hikayeBul((await params).slug);
  if (!h) notFound();
  const sira = HIKAYELER.indexOf(h);
  const sonraki = HIKAYELER[(sira + 1) % HIKAYELER.length];

  return (
    <>
      <Kap className="pt-12 sm:pt-16">
        <Link href="/referanslar" className="inline-flex items-center gap-1.5 text-[13px] text-metin-2 hover:text-white"><ArrowLeft className="h-4 w-4" />Müşteriler</Link>
        <p className="mt-8 text-[12.5px] font-medium text-vurgu">{h.sektor} · {h.sirket}</p>
        <h1 className="mt-4 max-w-[900px] text-balance text-[38px] font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-[58px]">{h.baslik}</h1>
        <p className="mt-5 max-w-[640px] text-[17px] leading-relaxed text-metin-2">{h.ozet}</p>
      </Kap>

      <Kap className="mt-12">
        <div className="overflow-hidden rounded-[26px] border border-white/[0.07]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={h.kapak} alt="" className="aspect-[21/9] w-full object-cover object-[center_22%]" />
        </div>
        <dl className="mt-3 grid grid-cols-1 gap-px overflow-hidden rounded-[22px] border border-white/[0.07] bg-white/[0.06] sm:grid-cols-3">
          {h.metrikler.map((m) => (
            <div key={m.etiket} className="bg-zemin px-6 py-6"><dt className="text-[40px] font-semibold leading-none tabular-nums tracking-[-0.04em] text-white">{m.deger}</dt><dd className="mt-2 text-[13.5px] text-metin-2">{m.etiket}</dd></div>
          ))}
        </dl>
      </Kap>

      <Kap className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-20">
        <aside className="lg:sticky lg:top-[88px] lg:self-start">
          <dl className="space-y-5 text-[14px]">
            {[["Şirket", h.sirket], ["Sektör", h.sektor], ["Konum", h.konum], ["Ekip", h.ekip]].map(([a, b]) => (
              <div key={a} className="border-t border-white/[0.07] pt-4"><dt className="text-[12px] text-metin-3">{a}</dt><dd className="mt-1 font-medium text-white">{b}</dd></div>
            ))}
            <div className="border-t border-white/[0.07] pt-4">
              <dt className="text-[12px] text-metin-3">Kullandıkları</dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">{h.kullanilan.map((k) => <span key={k} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] text-white/85">{k}</span>)}</dd>
            </div>
          </dl>
        </aside>
        <article className="max-w-[720px] space-y-12">
          {([["Zorluk", h.zorluk], ["Çözüm", h.cozum]] as const).map(([b, p]) => (
            <section key={b}>
              <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-white">{b}</h2>
              <div className="mt-4 space-y-4 text-[16.5px] leading-[1.75] text-metin-2">{p.map((x) => <p key={x}>{x}</p>)}</div>
            </section>
          ))}
          <figure className="border-l-2 border-vurgu pl-6">
            <blockquote className="text-[22px] font-medium leading-[1.4] tracking-[-0.015em] text-white sm:text-[26px]">&ldquo;{h.alinti.metin}&rdquo;</blockquote>
            <figcaption className="mt-4 text-[14px] text-metin-2"><b className="font-semibold text-white">{h.alinti.kisi}</b> · {h.alinti.unvan}, {h.sirket}</figcaption>
          </figure>
          <section>
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-white">Sonuç</h2>
            <div className="mt-4 space-y-4 text-[16.5px] leading-[1.75] text-metin-2">{h.sonuc.map((x) => <p key={x}>{x}</p>)}</div>
          </section>
          <Link href={`/referanslar/${sonraki.slug}`} className="group flex items-center justify-between gap-4 rounded-[22px] border border-white/[0.07] bg-yuzey p-6 transition-colors hover:border-white/[0.16]">
            <span><span className="block text-[12.5px] text-metin-3">Sonraki hikâye</span><span className="mt-1 block text-[16px] font-semibold text-white">{sonraki.baslik}</span></span>
            <ArrowRight className="h-5 w-5 shrink-0 text-metin-2 transition-transform group-hover:translate-x-1 group-hover:text-white" />
          </Link>
        </article>
      </Kap>

      <KapanisBandi baslik="Ekibin için benzer sonuçları konuşalım." birincil={{ ad: "Satış ekibiyle görüş", href: "/kurumsal#iletisim" }} ikincil={{ ad: "Ücretsiz başla", href: "/panel" }} gorsel={h.kapak} />
    </>
  );
}
