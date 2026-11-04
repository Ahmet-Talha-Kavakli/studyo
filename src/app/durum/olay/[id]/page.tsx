import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BAKIMLAR, DURUM, EVRE_AD, OLAYLAR, TUM_BILESENLER, gunMetni, olayAraligi } from "@/lib/durum";

const bul = (id: string) => [...OLAYLAR, ...BAKIMLAR].find((o) => o.id === id);

/** Olay kimlikleri sabit: bilinmeyen kimlik doğrudan 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return [...OLAYLAR, ...BAKIMLAR].map((o) => ({ id: o.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const o = bul((await params).id);
  return o ? { title: o.baslik, description: o.guncellemeler[0]?.metin.slice(0, 160) } : { title: "Olay bulunamadı" };
}

/** Olay raporu — evre evre zaman çizelgesi ve etkilenen bileşenler. */
export default async function OlaySayfasi({ params }: { params: Promise<{ id: string }> }) {
  const o = bul((await params).id);
  if (!o) notFound();
  const etkilenen = o.bilesenler.map((id) => TUM_BILESENLER.find((b) => b.id === id)?.ad ?? id);
  return (
    <article className="mx-auto max-w-[680px]">
      <header className="text-center">
        <p className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium" style={{ color: DURUM[o.etki].renk, borderColor: `${DURUM[o.etki].renk}66` }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: DURUM[o.etki].renk }} />{DURUM[o.etki].ad}
        </p>
        <h1 className="mt-4 text-balance text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[36px]" style={{ color: DURUM[o.etki].renk }}>{o.baslik}</h1>
        <p className="mt-2 text-[17px] text-metin-2">{o.bakim ? "Vayra bakım raporu" : "Vayra olay raporu"} · {olayAraligi(o)}</p>
      </header>

      <ol className="mt-10 space-y-7">
        {o.guncellemeler.map((u, i) => (
          <li key={i} className="grid gap-1 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
            <p className="text-[17px] font-medium text-white">{EVRE_AD[u.evre]}</p>
            <div>
              <p className="text-[15px] leading-relaxed text-metin">{u.metin}</p>
              <p className="mt-1.5 text-[12.5px] text-metin-3">Yayımlandı: {gunMetni(u.zaman)} · saat kaydı yok</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-9 rounded-xl border border-white/[0.08] bg-yuzey px-4 py-3.5 text-[13.5px] text-metin-2">
        Bu olaydan etkilenen bileşenler: <span className="text-white">{etkilenen.join(", ")}</span>.
      </div>
      <p className="mt-3 text-[12.5px] text-metin-3">
        Kaynak: <Link href={o.kaynak.href} className="underline hover:text-white">{o.kaynak.ad}</Link> sürüm notu. Bu kayıt, düzeltmeyle birlikte yayımlanan sürüm notundan derlenmiştir.
      </p>
      <p className="mt-10"><Link href="/durum" className="text-[13.5px] text-metin-2 hover:text-white">← Güncel durum</Link></p>
    </article>
  );
}
