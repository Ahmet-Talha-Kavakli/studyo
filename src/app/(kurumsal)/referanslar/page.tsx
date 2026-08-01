import type { Metadata } from "next";
import { Star, Quote, Building2, Sparkles, MapPin } from "lucide-react";
import { Hero, IstatistikBandi, Kart, BolumBaslik, CTASerit } from "@/components/kurumsal/UI";

export const metadata: Metadata = {
  title: "Bize Güvenenler — Vayra",
  description: "10.000'den fazla yaratıcı, ajans ve marka Vayra ile üretiyor. Vayra'ya güvenen ekiplerin deneyimlerini ve bizi tercih etme sebeplerini keşfedin.",
};

const istatistikler = [
  { deger: "10.000+", etiket: "Aktif yaratıcı" },
  { deger: "2,4M+", etiket: "Üretilen içerik" },
  { deger: "120+", etiket: "Ülke" },
  { deger: "4,9/5", etiket: "Ortalama puan" },
];

const markalar = [
  "Meridian Studio", "Nova Collective", "Kite Media", "Atlas Creative",
  "Pixel Union", "Lumen Films", "Vertex Brand", "Northwind Digital",
  "Zenith Productions", "Karma Creative", "Orbit Agency", "Harbor House",
];

/* Global müşteri sesleri — dört kıtadan ekipler. */
const yorumlar = [
  { ad: "Léa Fontaine", unvan: "Kreatif Direktör · Meridian Studio", konum: "Paris, Fransa", mono: "LF", metin: "Eskiden bir kampanya görseli için günlerce ajanslarla yazışırdık. Vayra ile aynı işi bir öğleden sonrada, üstelik daha yüksek kalitede çıkarıyoruz. Ekibimizin ritmini tamamen değiştirdi." },
  { ad: "Marcus Feld", unvan: "Kurucu · Nova Collective", konum: "Berlin, Almanya", mono: "MF", metin: "Video, görsel ve 3D'yi tek panelde toplaması bizim için oyun değiştirici oldu. Artık farklı araçlar arasında dosya taşımıyoruz; her şey Vayra içinde akıyor." },
  { ad: "Priya Raghavan", unvan: "Sosyal Medya Yöneticisi · Kite Media", konum: "Bengaluru, Hindistan", mono: "PR", metin: "Viral presetler sayesinde haftalık içerik takvimimizi yarı sürede dolduruyoruz. Müşterilerimiz çıkan işlerin stüdyo kalitesine inanamıyor." },
  { ad: "Sarah Whitfield", unvan: "Marka Müdürü · Atlas Creative", konum: "Toronto, Kanada", mono: "SW", metin: "Fiyatlandırması şeffaf, çıktı kalitesi tutarlı. Bir yıldır kullanıyoruz ve teslim sürelerimiz gözle görülür şekilde kısaldı. Kesinlikle güvendiğimiz bir partner." },
  { ad: "Diego Salazar", unvan: "Bağımsız Yaratıcı", konum: "Buenos Aires, Arjantin", mono: "DS", metin: "Tek kişilik bir stüdyo gibi çalışıyorum ve Vayra tam olarak bunu mümkün kılıyor. 3D modelden sese kadar her şeyi kendim üretebiliyorum." },
  { ad: "Hana Kobayashi", unvan: "Yapım Amiri · Lumen Films", konum: "Osaka, Japonya", mono: "HK", metin: "Sinema Stüdyosu ile fırtına panolarını dakikalar içinde görselleştiriyoruz. Müşteri sunumlarımız artık çok daha ikna edici." },
];

export default function Referanslar() {
  return (
    <>
      <Hero
        ustBaslik="Bize Güvenenler"
        baslik="Binlerce yaratıcının seçimi"
        aciklama="Bağımsız yaratıcılardan büyük ajanslara kadar 120'den fazla ülkede ekipler Vayra ile üretiyor. İşte onların hikayeleri."
      />

      <section className="mx-auto max-w-5xl px-4 py-6">
        <IstatistikBandi ogeler={istatistikler} />
      </section>

      {/* Markalar */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <p className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-[color:var(--color-metin-3)]">Bize güvenen markalar</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {markalar.map((m) => (
            <div key={m} className="kr-kart kr-kart-hover flex items-center gap-3 px-4 py-4">
              <span className="kr-ikon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"><Building2 className="h-4.5 w-4.5" /></span>
              <span className="truncate text-sm font-semibold text-[color:var(--color-metin-2)]">{m}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Yorumlar */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <BolumBaslik baslik="Ekipler ne diyor?" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {yorumlar.map((y) => (
            <div key={y.ad} className="kr-kart kr-kart-hover flex h-full flex-col p-6">
              <div className="mb-3 flex items-center gap-1 text-[#b8e02f]">
                {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}
              </div>
              <Quote className="h-6 w-6 text-[color:var(--color-metin-3)]" />
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[color:var(--color-metin-2)]">{y.metin}</p>
              <div className="mt-5 flex items-center gap-3 border-t border-[color:var(--color-kenar)] pt-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#e8ff7a] to-[#a8d61e] text-sm font-bold text-[#14160b]">{y.mono}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[color:var(--color-metin)]">{y.ad}</p>
                  <p className="text-xs text-[color:var(--color-metin-3)]">{y.unvan}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-[color:var(--color-metin-3)]">
                    <MapPin className="h-3 w-3 shrink-0" /> {y.konum}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Öne çıkan */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="kr-kart relative overflow-hidden p-8 md:p-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#dafd55]/25 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
            <span className="kr-ikon flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"><Sparkles className="h-7 w-7" /></span>
            <div className="flex-1">
              <p className="text-lg font-semibold leading-relaxed text-[color:var(--color-metin)]">
                &quot;Vayra&apos;ya geçtiğimizden beri içerik üretim maliyetimizi <span className="text-[color:var(--kr-lime-metin)]">%70 azalttık</span> ve
                yayın hızımızı üçe katladık. Artık fikirle yayın arasında bekleme yok.&quot;
              </p>
              <p className="mt-3 text-sm text-[color:var(--color-metin-3)]">— Nova Studios kurucu ekibi</p>
            </div>
          </div>
        </div>
      </section>

      <CTASerit
        baslik="Güvenen binlerce ekibe katıl"
        ozet="Ücretsiz başla, ilk üretimini bugün yap. Kredi kartı gerekmez."
        birincil={{ ad: "Ücretsiz başla", href: "/kayit" }}
        ikincil={{ ad: "Örnekleri keşfet", href: "/kesfet" }}
      />
    </>
  );
}
