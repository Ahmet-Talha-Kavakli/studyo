import { Hero } from "./UI";
import { FileText } from "lucide-react";

/* Beyaz yasal-sayfa şablonu — veri-güdümlü. (kurumsal) layout kabuğu sağlar,
   burada SADECE hero + bölüm gövdesi döner (site tarafındaki koyu HukukiSayfa'nın beyaz muadili). */

export function HukukiSayfa({
  baslik, guncelleme, ozet, bolumler,
}: {
  baslik: string;
  guncelleme: string;
  ozet?: string;
  bolumler: { baslik: string; icerik: string }[];
}) {
  return (
    <>
      <Hero ustBaslik="Yasal" baslik={baslik} aciklama={ozet ?? `Son güncelleme: ${guncelleme}`} izgara={false} />

      <section className="mx-auto max-w-3xl px-4 pb-20">
        {/* İçindekiler */}
        <nav className="kr-kart mb-10 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[color:var(--color-metin)]">
            <FileText className="h-4 w-4 text-[color:var(--kr-lime-metin)]" /> İçindekiler
          </div>
          <ol className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {bolumler.map((b, i) => (
              <li key={b.baslik}>
                <a href={`#bolum-${i + 1}`} className="text-sm text-[color:var(--color-metin-2)] transition-colors hover:text-[color:var(--kr-lime-metin)]">
                  {i + 1}. {b.baslik}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-9">
          {bolumler.map((b, i) => (
            <div key={b.baslik} id={`bolum-${i + 1}`} className="scroll-mt-24">
              <h2 className="mb-2.5 text-lg font-bold text-[color:var(--color-metin)]">{i + 1}. {b.baslik}</h2>
              <p className="text-[15px] leading-relaxed text-[color:var(--color-metin-2)]">{b.icerik}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 border-t border-[color:var(--color-kenar)] pt-6 text-sm text-[color:var(--color-metin-3)]">
          Son güncelleme: {guncelleme}. Sorularınız için{" "}
          <a href="mailto:hello@vayra.ai" className="font-semibold text-[color:var(--kr-lime-metin)]">hello@vayra.ai</a>.
        </p>
      </section>
    </>
  );
}
