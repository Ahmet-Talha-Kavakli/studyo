import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Kap } from "@/components/sirket/ortak";
import { BasvuruFormu } from "@/components/sirket/BasvuruFormu";
import { POZISYONLAR, pozisyonBul } from "@/lib/kurumsal/pozisyonlar";
import { BASVURU_SURECI } from "@/lib/kurumsal/detay";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return [...POZISYONLAR.map((p) => ({ slug: p.slug })), { slug: "genel" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "genel") return { title: "Genel başvuru · Kariyer" };
  const p = pozisyonBul(slug);
  return p ? { title: `${p.ad} · Kariyer`, description: p.ozet } : {};
}

const tarihFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" });

export default async function PozisyonDetay({ params }: Props) {
  const { slug } = await params;
  const genel = slug === "genel";
  const p = genel ? null : pozisyonBul(slug);
  if (!genel && !p) notFound();

  return (
    <>
      <Kap className="pt-12 sm:pt-16">
        <Link href="/kariyer#pozisyonlar" className="inline-flex items-center gap-1.5 text-[13px] text-metin-2 hover:text-white"><ArrowLeft className="h-4 w-4" />Tüm pozisyonlar</Link>
        <p className="mt-8"><span className="rounded-full bg-[#55d6fd]/12 px-2.5 py-1 text-[12.5px] font-medium text-[#55d6fd]">{p ? p.ekip : "Kariyer"}</span></p>
        <h1 className="mt-3 max-w-[860px] text-balance text-[38px] font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-[56px]">{p ? p.ad : "Genel başvuru"}</h1>
        {p ? (
          <dl className="mt-7 grid max-w-[860px] grid-cols-2 overflow-hidden rounded-[18px] bg-white/[0.07] ring-1 ring-white/[0.08] sm:grid-cols-4" style={{ gap: 1 }}>
            {[["Konum", p.yer], ["Çalışma", p.tur], ["Maaş", p.maas], ["İlan", tarihFmt.format(new Date(p.tarih))]].map(([a, b]) => (
              <div key={a} className="bg-[#0e0f11] px-4 py-3"><dt className="text-[12.5px] text-metin-2">{a}</dt><dd className="mt-0.5 text-[14px] font-medium tabular-nums text-white">{b}</dd></div>
            ))}
          </dl>
        ) : <p className="mt-5 max-w-[620px] text-[16.5px] leading-relaxed text-metin-2">Listede sana uygun bir rol yoksa kendini anlat. Yeni bir rol açıldığında ilk başvurulara bakarız.</p>}
      </Kap>

      <Kap className="grid gap-12 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-16">
        <article className="min-w-0 max-w-[720px] space-y-12">
          {p && (
            <>
              <p className="text-[18px] leading-[1.7] text-white/90">{p.ozet}</p>
              {([["Ne yapacaksın", p.gorevler], ["Sende aradıklarımız", p.nitelikler], ["Artı olur", p.arti]] as const).map(([b, l]) => (
                <section key={b}>
                  <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">{b}</h2>
                  <ul className="mt-4 space-y-3">
                    {l.map((m) => <li key={m} className="flex gap-3 text-[16px] leading-relaxed text-metin-2"><Check className="mt-1.5 h-4 w-4 shrink-0 text-[#55d6fd]" />{m}</li>)}
                  </ul>
                </section>
              ))}
            </>
          )}
          <section>
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">Süreç</h2>
            <ol className="mt-4 divide-y divide-white/[0.07] border-y border-white/[0.07]">
              {BASVURU_SURECI.map((a) => (
                <li key={a.no} className="flex items-start gap-4 py-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#55d6fd]/15 text-[12px] font-semibold text-[#55d6fd]">{a.no}</span>
                  <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold text-white">{a.ad}</span><span className="block text-[14px] text-metin-2">{a.aciklama}</span></span>
                  <span className="shrink-0 text-[13px] text-metin-2">{a.sure}</span>
                </li>
              ))}
            </ol>
          </section>
          <p className="text-[14px] leading-relaxed text-metin-2">Vayra fırsat eşitliğine bağlı bir işverendir. Irk, din, cinsiyet, cinsel yönelim, yaş, engellilik ya da başka herhangi bir özelliğe göre ayrım yapmayız. Görüşmelerde ihtiyacın olan düzenlemeyi başvuruna yazman yeterli.</p>
        </article>
        <aside className="lg:sticky lg:top-[88px] lg:self-start">
          <h2 className="mb-4 text-[20px] font-semibold text-white">Başvur</h2>
          <BasvuruFormu pozisyon={p?.slug ?? "genel"} pozisyonAd={p?.ad ?? "Genel"} />
        </aside>
      </Kap>
    </>
  );
}
