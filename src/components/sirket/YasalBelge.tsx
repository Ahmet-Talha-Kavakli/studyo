import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Kap } from "@/components/kesfet/ortak";
import { Icindekiler, YazdirButonu } from "./YasalIstemci";
import { cn } from "@/lib/utils";

/* ============================================================
   Yasal belge şablonu — gizlilik, şartlar, KVKK, çerez, iade.
   Desen (Stripe / Dropbox / Pinterest yasal sayfaları):
     • Başlıkta yürürlük tarihi, sürüm ve belgeden sorumlu tüzel kişi
     • Solda yapışkan içindekiler; okunan bölüm vurgulanır
     • Her bölümün başında "Kısaca" özeti — hukuki metnin sade karşılığı
     • Altta değişiklik geçmişi ve iletişim
   ============================================================ */

export type YasalBlok =
  | { t: "p"; m: React.ReactNode }
  | { t: "liste"; m: React.ReactNode[]; sirali?: boolean }
  | { t: "tablo"; basliklar: string[]; satirlar: React.ReactNode[][] }
  | { t: "not"; m: React.ReactNode }
  | { t: "ozel"; m: React.ReactNode };

export type YasalBolum = { id: string; baslik: string; kisaca?: string; bloklar: YasalBlok[] };

export function YasalBelge({
  baslik, aciklama, yururluk, surum, sorumlu, bolumler, gecmis, iletisim,
}: {
  baslik: string;
  aciklama: string;
  yururluk: string;
  surum: string;
  sorumlu: string;
  bolumler: YasalBolum[];
  gecmis?: { tarih: string; not: string }[];
  iletisim: { ad: string; eposta: string };
}) {
  return (
    <>
      <section className="border-b border-white/[0.06] pb-12 pt-14 sm:pb-16 sm:pt-20">
        <Kap>
          <Link href="/yasal" className="inline-flex items-center gap-1.5 text-[13px] text-metin-2 hover:text-white print:hidden"><ArrowLeft className="h-4 w-4" />Yasal merkez</Link>
          <h1 className="mt-6 max-w-[820px] text-balance text-[38px] font-semibold leading-[1.04] tracking-[-0.035em] text-white sm:text-[56px]">{baslik}</h1>
          <p className="mt-5 max-w-[680px] text-[16px] leading-relaxed text-metin-2">{aciklama}</p>
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-[13px]">
            <div><dt className="text-metin-3">Yürürlük</dt><dd className="mt-0.5 font-medium text-white">{yururluk}</dd></div>
            <div><dt className="text-metin-3">Sürüm</dt><dd className="mt-0.5 font-medium text-white">{surum}</dd></div>
            <div><dt className="text-metin-3">Sorumlu</dt><dd className="mt-0.5 font-medium text-white">{sorumlu}</dd></div>
            <div className="print:hidden">
              <dt className="text-metin-3">Kopya</dt>
              <dd className="mt-0.5"><YazdirButonu /></dd>
            </div>
          </dl>
        </Kap>
      </section>

      <Kap className="grid gap-12 py-14 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
        <Icindekiler ogeler={bolumler.map((b) => ({ id: b.id, baslik: b.baslik }))} />

        <article className="min-w-0 max-w-[760px]">
          {/* Mobil içindekiler */}
          <details className="mb-10 rounded-2xl border border-white/[0.07] bg-yuzey p-4 lg:hidden print:hidden">
            <summary className="cursor-pointer text-[14px] font-semibold text-white">İçindekiler</summary>
            <ol className="mt-3 space-y-1.5">
              {bolumler.map((b, i) => <li key={b.id}><a href={`#${b.id}`} className="text-[13.5px] text-metin-2 hover:text-white">{i + 1}. {b.baslik}</a></li>)}
            </ol>
          </details>

          <div className="space-y-14">
            {bolumler.map((b, i) => (
              <section key={b.id} id={b.id} className="scroll-mt-24">
                <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white sm:text-[26px]"><span className="mr-2 tabular-nums text-metin-3">{i + 1}.</span>{b.baslik}</h2>
                {b.kisaca && (
                  <div className="mt-4 rounded-2xl border border-vurgu/25 bg-[color-mix(in_oklab,var(--vurgu-renk)_9%,#111113)] px-5 py-4">
                    <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-vurgu">Kısaca</p>
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-white/90">{b.kisaca}</p>
                  </div>
                )}
                <div className="mt-5 space-y-4">
                  {b.bloklar.map((x, j) => <Blok key={j} b={x} />)}
                </div>
              </section>
            ))}
          </div>

          {gecmis && gecmis.length > 0 && (
            <section className="mt-16 border-t border-white/[0.07] pt-10">
              <h2 className="text-[18px] font-semibold text-white">Değişiklik geçmişi</h2>
              <ul className="mt-4 space-y-3">
                {gecmis.map((g) => (
                  <li key={g.tarih} className="flex flex-col gap-1 text-[14px] sm:flex-row sm:gap-6">
                    <span className="w-[140px] shrink-0 tabular-nums text-metin-3">{g.tarih}</span>
                    <span className="text-metin-2">{g.not}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-yuzey p-6 sm:flex-row sm:items-center sm:justify-between print:hidden">
            <div>
              <p className="text-[15px] font-semibold text-white">Bu belgeyle ilgili sorun mu var?</p>
              <p className="mt-1 text-[13.5px] text-metin-2">{iletisim.ad} ekibine yaz; 30 gün içinde yanıtlıyoruz.</p>
            </div>
            <a href={`mailto:${iletisim.eposta}`} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-white px-4 text-[13.5px] font-semibold text-zemin hover:opacity-90"><Mail className="h-4 w-4" />{iletisim.eposta}</a>
          </div>
        </article>
      </Kap>
    </>
  );
}

function Blok({ b }: { b: YasalBlok }) {
  if (b.t === "ozel") return <>{b.m}</>;
  if (b.t === "p") return <p className="text-[15.5px] leading-[1.75] text-metin-2 [&_a]:text-white [&_a]:underline [&_a]:underline-offset-4 [&_b]:font-semibold [&_b]:text-white">{b.m}</p>;
  if (b.t === "not") return <p className="rounded-xl border-l-2 border-white/25 bg-white/[0.03] px-4 py-3 text-[14px] leading-relaxed text-metin-2 [&_b]:text-white">{b.m}</p>;
  if (b.t === "liste") {
    const L = b.sirali ? "ol" : "ul";
    return (
      <L className={cn("space-y-2 pl-5 text-[15.5px] leading-[1.7] text-metin-2 marker:text-metin-3 [&_b]:font-semibold [&_b]:text-white", b.sirali ? "list-decimal" : "list-disc")}>
        {b.m.map((x, i) => <li key={i} className="pl-1">{x}</li>)}
      </L>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
      <table className="w-full min-w-[560px] text-left text-[13.5px]">
        <thead className="bg-white/[0.03]">
          <tr>{b.basliklar.map((h) => <th key={h} className="px-4 py-3 font-semibold text-white">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {b.satirlar.map((s, i) => <tr key={i}>{s.map((h, j) => <td key={j} className="px-4 py-3 align-top leading-relaxed text-metin-2">{h}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
