import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import type { ReactNode } from "react";

/** Landing alt sayfaları için ortak kabuk: nav + içerik + footer. */
export function SayfaKabuk({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteNav />
      <main className="pt-24">{children}</main>
      <SiteFooter />
    </>
  );
}

/** Sayfa başlık bloğu — aurora arka planlı hero. */
export function SayfaHero({
  ustBaslik,
  baslik,
  aciklama,
}: {
  ustBaslik?: string;
  baslik: string;
  aciklama?: string;
}) {
  return (
    <section className="relative overflow-hidden px-4 py-16 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-72 w-[540px] -translate-x-1/2 rounded-full bg-vayra-600/15 blur-[120px]" />
      </div>
      {ustBaslik && (
        <span className="text-sm font-semibold uppercase tracking-widest text-vayra-300">{ustBaslik}</span>
      )}
      <h1 className="hf-baslik mx-auto mt-3 max-w-3xl text-balance text-4xl md:text-5xl">
        {baslik}
      </h1>
      {aciklama && <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">{aciklama}</p>}
    </section>
  );
}
