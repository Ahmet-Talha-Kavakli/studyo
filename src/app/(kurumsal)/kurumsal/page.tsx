import type { Metadata } from "next";
import Link from "next/link";
import { Info, Briefcase, Newspaper, ShieldCheck, Handshake, Scale, ArrowRight, Mail, FileText, Star, Building2 } from "lucide-react";
import { Hero, IstatistikBandi, Kart, CTASerit, BolumBaslik, DegerKart } from "@/components/kurumsal/UI";
import { ISTATISTIKLER, HIZLI_GERCEKLER, DEGERLER } from "@/lib/kurumsal/icerik";
import { OFISLER } from "@/lib/kurumsal/site";

export const metadata: Metadata = {
  title: "Kurumsal — Vayra",
  description: "Vayra kurumsal genel bakış: hakkımızda, kariyer, basın, güvenlik, iş ortaklığı ve yasal merkez. Şirketle ilgili her şey tek çatı altında.",
};

const bolumler = [
  { ikon: Info, ad: "Hakkımızda", ozet: "Hikayemiz, misyonumuz, değerlerimiz ve ekibimiz.", href: "/hakkinda" },
  { ikon: Briefcase, ad: "Kariyer", ozet: "Açık pozisyonlar ve Vayra'da çalışma kültürü.", href: "/kariyer" },
  { ikon: FileText, ad: "Blog", ozet: "Ürün duyuruları, yaratıcılık ve mühendislik yazıları.", href: "/blog" },
  { ikon: Star, ad: "Referanslar", ozet: "Bize güvenen markalar ve yaratıcıların deneyimleri.", href: "/referanslar" },
  { ikon: Newspaper, ad: "Basın", ozet: "Medya kiti, marka varlıkları ve basın bültenleri.", href: "/basin" },
  { ikon: ShieldCheck, ad: "Güvenlik", ozet: "Veri koruma, altyapı güvenliği ve uyumluluk.", href: "/guvenlik" },
  { ikon: Handshake, ad: "İş Ortaklığı", ozet: "Partner programı, entegrasyon ve iş birliği fırsatları.", href: "/partner" },
  { ikon: Scale, ad: "Yasal Merkez", ozet: "Gizlilik, şartlar, veri koruma, çerezler ve iade politikası.", href: "/yasal" },
];

export default function KurumsalHub() {
  return (
    <>
      <Hero
        ustBaslik="Kurumsal"
        baslik="Vayra hakkında her şey"
        aciklama="Şirketimiz, ekibimiz ve çalışma prensiplerimizle ilgili aradığın her şey tek çatı altında."
      />

      <section className="mx-auto max-w-5xl px-4 py-6">
        <IstatistikBandi ogeler={ISTATISTIKLER} />
      </section>

      {/* Şirket özeti */}
      <section className="mx-auto max-w-4xl px-4 py-10">
        <div className="kr-kart p-8 text-center md:p-10">
          <p className="text-lg leading-relaxed text-[color:var(--color-metin-2)]">
            <span className="font-semibold text-[color:var(--color-metin)]">Vayra</span>, 2024'te Amsterdam'da kuruldu.
            Video, görsel, 3D ve sesi tek panelde birleştiren yeni nesil bir yaratıcı AI platformu.
            Bugün 120+ ülkede 10.000'den fazla yaratıcı, ajans ve marka Vayra ile üretiyor.
          </p>
        </div>
      </section>

      {/* Ofisler — global varlık */}
      <section className="mx-auto max-w-5xl px-4 pb-4">
        <BolumBaslik baslik="Nerede çalışıyoruz?" ozet="Üç kıtada dört ofis, 18 ülkeye yayılmış uzaktan bir ekip." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {OFISLER.map((o) => (
            <Kart key={o.sehir}>
              <div className="flex items-center gap-2.5">
                <span className="kr-ikon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"><Building2 className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[color:var(--color-metin)]">{o.sehir}</div>
                  <div className="truncate text-xs text-[color:var(--color-metin-3)]">{o.ulke}</div>
                </div>
              </div>
              <div className="mt-3 border-t border-[color:var(--color-kenar)] pt-3">
                <div className="text-[13px] font-medium text-[color:var(--color-metin-2)]">{o.rol}</div>
                <div className="mt-0.5 text-xs text-[color:var(--color-metin-3)]">{o.saat}</div>
              </div>
            </Kart>
          ))}
        </div>
      </section>

      {/* Hızlı gerçekler */}
      <section className="mx-auto max-w-5xl px-4 pb-6">
        <div className="kr-kart grid grid-cols-2 gap-px overflow-hidden bg-[color:var(--color-kenar)] !p-0 sm:grid-cols-3 lg:grid-cols-6">
          {HIZLI_GERCEKLER.map((h) => (
            <div key={h.etiket} className="bg-white px-4 py-5 text-center">
              <div className="text-xs uppercase tracking-wider text-[color:var(--color-metin-3)]">{h.etiket}</div>
              <div className="mt-1.5 font-semibold text-[color:var(--color-metin)]">{h.deger}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Bölüm kartları */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bolumler.map((b) => (
            <Link key={b.href} href={b.href as never} className="group">
              <Kart hover className="flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <span className="kr-ikon flex h-11 w-11 items-center justify-center rounded-xl"><b.ikon className="h-5 w-5" /></span>
                  <ArrowRight className="h-5 w-5 text-[color:var(--color-metin-3)] transition-all group-hover:translate-x-1 group-hover:text-[color:var(--kr-lime-metin)]" />
                </div>
                <h3 className="mt-4 font-semibold text-[color:var(--color-metin)]">{b.ad}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[color:var(--color-metin-2)]">{b.ozet}</p>
              </Kart>
            </Link>
          ))}
        </div>

        {/* İletişim şeridi */}
        <Link href={"/iletisim" as never} className="group mt-4 block">
          <Kart hover className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="kr-ikon flex h-11 w-11 items-center justify-center rounded-xl"><Mail className="h-5 w-5" /></span>
              <div>
                <h3 className="font-semibold text-[color:var(--color-metin)]">Bize ulaş</h3>
                <p className="text-sm text-[color:var(--color-metin-2)]">Soru, iş birliği veya kurumsal ihtiyaçların için buradayız.</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-[color:var(--color-metin-3)] transition-all group-hover:translate-x-1 group-hover:text-[color:var(--kr-lime-metin)]" />
          </Kart>
        </Link>
      </section>

      {/* Değerler özeti */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <BolumBaslik baslik="Neye inanıyoruz?" ozet="Şirket olarak bizi yönlendiren ilkeler." />
        <div className="grid gap-5 sm:grid-cols-2">
          {DEGERLER.map((d) => <DegerKart key={d.ad} {...d} />)}
        </div>
      </section>

      <CTASerit
        baslik="Yaratıcılığın altyapısına katıl"
        ozet="Dünyanın dört bir yanından 10.000+ yaratıcı Vayra ile üretiyor."
        birincil={{ ad: "Ücretsiz başla", href: "/kayit" }}
        ikincil={{ ad: "Hakkımızda", href: "/hakkinda" }}
      />
    </>
  );
}
