import type { Metadata } from "next";
import { Download, Newspaper, Mail, ArrowRight } from "lucide-react";
import { Hero, BolumBaslik, Kart, IstatistikBandi } from "@/components/kurumsal/UI";
import { MARKA_VARLIKLAR, MARKA_RENKLER, BASIN_BULTENLERI, KUNYE } from "@/lib/kurumsal/basin";
import { ISTATISTIKLER } from "@/lib/kurumsal/icerik";
import { ILETISIM } from "@/lib/kurumsal/site";

export const metadata: Metadata = {
  title: "Basın & Medya Kiti — Vayra",
  description: "Vayra basın merkezi: marka varlıkları, logo paketi, marka rehberi, şirket künyesi ve basın bültenleri. Medya iletişimi için press@vayra.ai.",
};

export default function Basin() {
  return (
    <>
      <Hero
        ustBaslik="Basın"
        baslik="Basın & medya merkezi"
        aciklama="Vayra hakkında yazan gazeteciler ve içerik üreticiler için marka varlıkları, künye ve basın bültenleri."
        cta={
          <a href={`mailto:${ILETISIM.basin}`} className="kr-cta inline-flex h-12 items-center gap-2 rounded-xl px-6 text-[15px] font-semibold">
            <Mail className="h-4 w-4" /> {ILETISIM.basin}
          </a>
        }
      />

      {/* Sayılar */}
      <section className="mx-auto max-w-5xl px-4 py-6">
        <IstatistikBandi ogeler={ISTATISTIKLER} />
      </section>

      {/* Künye */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <BolumBaslik baslik="Şirket künyesi" ozet="Hızlı gerçekler." />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KUNYE.map((k) => (
            <Kart key={k.etiket} className="text-center">
              <div className="text-xs uppercase tracking-wider text-[color:var(--color-metin-3)]">{k.etiket}</div>
              <div className="mt-1.5 font-semibold text-[color:var(--color-metin)]">{k.deger}</div>
            </Kart>
          ))}
        </div>
      </section>

      {/* Marka varlıkları */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <BolumBaslik baslik="Marka varlıkları" ozet="Logo, marka rehberi ve ürün görselleri." />
        <div className="grid gap-4 md:grid-cols-3">
          {MARKA_VARLIKLAR.map((v) => (
            // Basın kiti dosyaları henüz yayında değil → talep e-postasına yönlendir
            // (ölü indirme linki / 404 yerine dürüst çalışan akış).
            <a key={v.ad} href={`mailto:${ILETISIM.basin}?subject=${encodeURIComponent(`Basın kiti talebi — ${v.ad}`)}`} className="group">
              <Kart hover className="flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <span className="kr-ikon flex h-11 w-11 items-center justify-center rounded-xl"><Download className="h-5 w-5" /></span>
                  <span className="text-xs text-[color:var(--color-metin-3)]">{v.format} · {v.boyut}</span>
                </div>
                <h3 className="mt-4 font-semibold text-[color:var(--color-metin)]">{v.ad}</h3>
                <p className="mt-1.5 flex-1 text-sm text-[color:var(--color-metin-2)]">{v.aciklama}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--kr-lime-metin)]">Talep et <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </Kart>
            </a>
          ))}
        </div>
      </section>

      {/* Marka renkleri */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <BolumBaslik baslik="Marka renkleri" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {MARKA_RENKLER.map((r) => (
            <Kart key={r.hex}>
              <div className="h-16 w-full rounded-lg border border-[color:var(--color-kenar)]" style={{ background: r.hex }} />
              <div className="mt-3 font-semibold text-[color:var(--color-metin)]">{r.ad}</div>
              <div className="text-xs text-[color:var(--color-metin-3)]">{r.hex} · {r.not}</div>
            </Kart>
          ))}
        </div>
      </section>

      {/* Basın bültenleri */}
      <section className="mx-auto max-w-4xl px-4 py-10">
        <BolumBaslik baslik="Basın bültenleri" />
        <div className="space-y-3">
          {BASIN_BULTENLERI.map((b) => (
            <Kart key={b.slug} hover className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="kr-ikon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"><Newspaper className="h-5 w-5" /></span>
                <div>
                  <div className="text-xs text-[color:var(--color-metin-3)]">{b.tarih}</div>
                  <h3 className="font-semibold text-[color:var(--color-metin)]">{b.baslik}</h3>
                  <p className="mt-0.5 text-sm text-[color:var(--color-metin-2)]">{b.ozet}</p>
                </div>
              </div>
            </Kart>
          ))}
        </div>
      </section>

      {/* Medya iletişim */}
      <section className="mx-auto max-w-4xl px-4 py-10 pb-16">
        <div className="kr-kart p-8 text-center md:p-10">
          <span className="kr-ikon mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"><Mail className="h-6 w-6" /></span>
          <h2 className="mt-4 text-xl font-bold text-[color:var(--color-metin)]">Medya sorularınız için</h2>
          <p className="mx-auto mt-2 max-w-md text-[color:var(--color-metin-2)]">
            Röportaj, demeç veya ek görsel talebi için basın ekibimize ulaşın. Genellikle 1 iş günü içinde dönüş yapıyoruz.
          </p>
          <a href={`mailto:${ILETISIM.basin}`} className="kr-cta mt-6 inline-flex h-12 items-center gap-2 rounded-xl px-6 text-[15px] font-semibold">
            <Mail className="h-4 w-4" /> {ILETISIM.basin}
          </a>
        </div>
      </section>
    </>
  );
}
