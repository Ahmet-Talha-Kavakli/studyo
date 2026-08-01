import { SayfaKabuk, SayfaHero } from "./SayfaKabuk";

export function HukukiSayfa({
  baslik,
  guncelleme,
  bolumler,
}: {
  baslik: string;
  guncelleme: string;
  bolumler: { baslik: string; icerik: string }[];
}) {
  return (
    <SayfaKabuk>
      <SayfaHero baslik={baslik} aciklama={`Son güncelleme: ${guncelleme}`} />
      <section className="mx-auto max-w-3xl px-4 pb-20">
        <div className="space-y-8">
          {bolumler.map((b, i) => (
            <div key={b.baslik}>
              <h2 className="mb-2 text-lg font-semibold">{i + 1}. {b.baslik}</h2>
              <p className="text-sm leading-relaxed text-white/60">{b.icerik}</p>
            </div>
          ))}
        </div>
      </section>
    </SayfaKabuk>
  );
}
