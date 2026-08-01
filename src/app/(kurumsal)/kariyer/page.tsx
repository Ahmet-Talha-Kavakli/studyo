import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Clock, ArrowRight, Heart, Zap, Globe, GraduationCap, Laptop, HeartPulse, TrendingUp, Plane } from "lucide-react";
import { Hero, BolumBaslik, DegerKart, CTASerit, Kart, SurecAdimlari, MiniSSS } from "@/components/kurumsal/UI";
import { POZISYONLAR } from "@/lib/kurumsal/pozisyonlar";
import { BASVURU_SURECI, KARIYER_SSS } from "@/lib/kurumsal/detay";

export const metadata: Metadata = {
  title: "Kariyer — Vayra",
  description: "Vayra'da açık pozisyonlar ve çalışma kültürü. Yaratıcılığın altyapısını kuran ekibe katıl; uzaktan çalışma, esnek saatler ve gerçek etki.",
};

const kultur = [
  { ikon: Zap, ad: "Gerçek etki", ozet: "Küçük ve hızlı bir ekipteyiz; yaptığın iş doğrudan milyonlarca yaratıcıya dokunur." },
  { ikon: Globe, ad: "Uzaktan öncelikli", ozet: "18 ülkede, 12 zaman diliminde çalışıyoruz. Nereden çalıştığın değil, ne ürettiğin önemli." },
  { ikon: Heart, ad: "Sahiplik kültürü", ozet: "Mikro yönetim yok. Sana bir problem veririz, çözümü senin olur." },
];

const yanHaklar = [
  { ikon: Laptop, ad: "Ekipman bütçesi", ozet: "İhtiyacın olan donanım ve yazılım." },
  { ikon: GraduationCap, ad: "Öğrenme desteği", ozet: "Kurs, konferans ve kitap bütçesi." },
  { ikon: HeartPulse, ad: "Sağlık sigortası", ozet: "Ülkene uyarlanmış kapsamlı sigorta." },
  { ikon: TrendingUp, ad: "Hisse opsiyonu", ozet: "Tüm tam zamanlı çalışanlar ortak olur." },
  { ikon: Plane, ad: "Yıllık ekip buluşması", ozet: "Yılda bir kez tüm ekip aynı şehirde." },
  { ikon: Globe, ad: "Global istihdam", ozet: "30+ ülkede yerel sözleşmeyle işe alım." },
];

export default function Kariyer() {
  return (
    <>
      <Hero
        ustBaslik="Kariyer"
        baslik="Yaratıcılığın geleceğini birlikte kur"
        aciklama="Küçük, hızlı ve tutkulu bir ekibiz. Yaptığın işin dünyanın dört bir yanındaki yaratıcılara dokunmasını istiyorsan doğru yerdesin."
      />

      {/* Kültür */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <BolumBaslik baslik="Vayra'da çalışmak" ozet="Nasıl bir ekip olduğumuza dair birkaç söz." />
        <div className="grid gap-5 md:grid-cols-3">
          {kultur.map((k) => <DegerKart key={k.ad} {...k} />)}
        </div>
      </section>

      {/* Yan haklar */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {yanHaklar.map((y) => (
            <Kart key={y.ad} className="text-center">
              <span className="kr-ikon mx-auto flex h-11 w-11 items-center justify-center rounded-xl"><y.ikon className="h-5 w-5" /></span>
              <h3 className="mt-3 text-sm font-semibold text-[color:var(--color-metin)]">{y.ad}</h3>
              <p className="mt-1 text-xs text-[color:var(--color-metin-3)]">{y.ozet}</p>
            </Kart>
          ))}
        </div>
      </section>

      {/* Açık pozisyonlar */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <BolumBaslik baslik="Açık pozisyonlar" ozet={`Şu an ${POZISYONLAR.length} açık pozisyon var.`} />
        <div className="space-y-3">
          {POZISYONLAR.map((p) => (
            <Link key={p.slug} href={`/kariyer/${p.slug}` as never} className="group block">
              <Kart hover className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="kr-rozet rounded-full px-2.5 py-0.5 text-[11px] font-semibold">{p.ekip}</span>
                  </div>
                  <h3 className="font-semibold text-[color:var(--color-metin)]">{p.ad}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[color:var(--color-metin-3)]">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {p.yer}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {p.tur}</span>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-[color:var(--color-metin-3)] transition-all group-hover:translate-x-1 group-hover:text-[color:var(--kr-lime-metin)]" />
              </Kart>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-[color:var(--color-metin-3)]">
          Aradığın pozisyonu bulamadın mı?{" "}
          <a href="mailto:careers@vayra.ai" className="font-semibold text-[color:var(--kr-lime-metin)]">careers@vayra.ai</a>{" "}
          adresine yeteneklerini anlat.
        </div>
      </section>

      {/* Başvuru süreci */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <BolumBaslik baslik="Başvuru süreci" ozet="Baştan sona ne bekleyeceğini bil." />
        <SurecAdimlari adimlar={BASVURU_SURECI} />
      </section>

      {/* Kariyer SSS */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <BolumBaslik baslik="Sıkça sorulanlar" />
        <MiniSSS maddeler={KARIYER_SSS} />
      </section>

      <CTASerit
        baslik="Birlikte üretmeye hazır mısın?"
        ozet="Açık pozisyonlara göz at veya doğrudan bize yaz."
        birincil={{ ad: "Bize ulaş", href: "/iletisim" }}
      />
    </>
  );
}
