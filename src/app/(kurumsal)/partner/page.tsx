import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Check, Code2, GraduationCap, Sparkles } from "lucide-react";
import { Belir, Bolum, Kap, SayiSeridi, SirketHero, SurecAdimlari, butonSinif } from "@/components/sirket/ortak";
import { PartnerFormu } from "@/components/sirket/PartnerFormu";
import { SikSorulanlar } from "@/components/kesfet/Kapanis";
import { PARTNER_SSS, PARTNER_SURECI } from "@/lib/kurumsal/detay";
import { DAVET_INDIRIM, KOMISYON_KADEMELERI, KOMISYON_SURE_AY } from "@/lib/earn/kampanyalar";
import { ILETISIM } from "@/lib/kurumsal/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "İş ortaklığı",
  description: "Vayra ortaklık programları: kreatörler için %30'a varan tekrarlayan komisyon, ajanslar için yeniden satış ve marj, teknoloji ortakları için API, eğitim kurumları için indirim.",
};

const enYuksek = Math.round(Math.max(...KOMISYON_KADEMELERI.map((k) => k.oran)) * 100);

const PROGRAMLAR = [
  {
    ikon: Sparkles, renk: "text-tur-ses bg-tur-ses/12", ad: "Kreatör ortaklığı", kime: "YouTuber'lar, eğitmenler, sosyal medya üreticileri",
    gorsel: "/gercek/gorsel/gorsel-karakter-Sofia.webp",
    maddeler: [`%${Math.round(KOMISYON_KADEMELERI[0].oran * 100)}–%${enYuksek} tekrarlayan komisyon, ${KOMISYON_SURE_AY} ay`, `Takipçilerine %${Math.round(DAVET_INDIRIM * 100)} ilk ödeme indirimi`, "Kampanyalara erken erişim ve ücretsiz Ultra plan", "Özel kupon kodu ve canlı panel"],
    eylem: { ad: "Davet panelini aç", href: "/earn/davet" },
  },
  {
    ikon: Building2, renk: "text-tur-gorsel bg-tur-gorsel/12", ad: "Ajans ortaklığı", kime: "Reklam, sosyal medya ve prodüksiyon ajansları",
    gorsel: "/gercek/galeri/sinematik2.webp",
    maddeler: ["Müşterilerine yeniden satışta %20 marj", "Çoklu müşteri çalışma alanı ve marka kitleri", "Ortak satış görüşmeleri ve demo desteği", "Ajans dizinimizde yer al"],
    eylem: { ad: "Ajans olarak başvur", href: "#basvuru" },
  },
  {
    ikon: Code2, renk: "text-tur-3d bg-tur-3d/12", ad: "Teknoloji ve API", kime: "Yazılım şirketleri, platformlar, entegratörler",
    gorsel: "/gercek/orig/banner-neonmancer.webp",
    maddeler: ["Hacme göre indirimli API kredisi", "Ortak teknik ekip ve özel Slack kanalı", "Entegrasyonlar sayfasında listelenme", "Ortak lansman ve duyuru"],
    eylem: { ad: "API dokümantasyonu", href: "/gelistirici" },
  },
  {
    ikon: GraduationCap, renk: "text-tur-muzik bg-tur-muzik/12", ad: "Eğitim kurumu", kime: "Üniversiteler, akademiler, kurs platformları",
    gorsel: "/gercek/explainer-video/ex-claymotion.webp",
    maddeler: ["Öğrenci ve eğitmenlere %50 indirim", "Sınıf çalışma alanları ve kredi havuzu", "Müfredat için hazır ders materyalleri", "Atölye ve konuk eğitmen desteği"],
    eylem: { ad: "Kurum olarak başvur", href: "#basvuru" },
  },
];

export default function Partner() {
  return (
    <>
      <SirketHero ust="İş ortaklığı" baslik={<>Vayra&apos;yı anlat, birlikte büyüyelim.</>}
        alt={`Kreatörler için %${enYuksek}'a varan, ${KOMISYON_SURE_AY} ay boyunca tekrarlayan komisyon. Ajanslar, teknoloji şirketleri ve eğitim kurumları için ayrı programlar.`}>
        <a href="#basvuru" className={butonSinif("beyaz")}>Başvur <ArrowRight className="h-4 w-4" /></a>
        <a href="#programlar" className={butonSinif("ikincil")}>Programlar</a>
      </SirketHero>

      <Kap className="pt-14 sm:pt-20">
        <SayiSeridi ogeler={[
          { deger: `%${enYuksek}`, etiket: "kademeye göre en yüksek komisyon" },
          { deger: `${KOMISYON_SURE_AY} ay`, etiket: "tekrarlayan gelir" },
          { deger: `%${Math.round(DAVET_INDIRIM * 100)}`, etiket: "kitlene ilk ödeme indirimi" },
          { deger: "3–5 gün", etiket: "başvuru değerlendirme süresi" },
        ]} />
      </Kap>

      <Bolum id="programlar" ust="Programlar" baslik="Sana uygun ortaklık.">
        <div className="grid gap-3 md:grid-cols-2">
          {PROGRAMLAR.map((p, i) => (
            <Belir key={p.ad} gecikme={(i % 2) * 0.05} className="h-full">
              <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-white/[0.07] bg-yuzey">
                <div className="relative h-40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.gorsel} alt="" loading="lazy" className="h-full w-full object-cover object-[center_30%]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-yuzey to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-7 pt-2">
                  <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", p.renk)}><p.ikon className="h-5 w-5" /></span>
                  <h3 className="mt-5 text-[22px] font-semibold tracking-[-0.02em] text-white">{p.ad}</h3>
                  <p className="text-[13.5px] text-metin-3">{p.kime}</p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {p.maddeler.map((m) => <li key={m} className="flex gap-2.5 text-[14.5px] text-metin-2"><Check className="mt-1 h-3.5 w-3.5 shrink-0 text-tur-3d" />{m}</li>)}
                  </ul>
                  <Link href={p.eylem.href} className={cn(butonSinif("ikincil"), "mt-6 self-start")}>{p.eylem.ad}</Link>
                </div>
              </div>
            </Belir>
          ))}
        </div>
      </Bolum>

      <Bolum ust="Komisyon" baslik="Kreatör komisyonu nasıl hesaplanır?" alt="Kademen, davet ettiğin kişilerin o ayki toplam ödemelerine göre otomatik belirlenir.">
        <div className="grid gap-3 sm:grid-cols-3">
          {KOMISYON_KADEMELERI.map((k, i) => (
            <div key={k.ad} className={cn("rounded-[22px] border p-6", i === KOMISYON_KADEMELERI.length - 1 ? "border-vurgu/40 bg-[color-mix(in_oklab,var(--vurgu-renk)_12%,#111113)]" : "border-white/[0.07] bg-yuzey")}>
              <p className="text-[14px] font-semibold text-white">{k.ad}</p>
              <p className="mt-4 text-[44px] font-semibold leading-none tracking-[-0.04em] text-white">%{Math.round(k.oran * 100)}</p>
              <p className="mt-3 text-[13.5px] text-metin-2">{k.minAylik ? `Davetlilerin aylık ödemeleri ₺${k.minAylik.toLocaleString("tr-TR")} ve üzeri` : "Başlangıç kademesi"}</p>
            </div>
          ))}
        </div>
        <Link href="/earn/davet" className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-white hover:underline">Kazanç hesaplayıcıyı aç <ArrowRight className="h-4 w-4" /></Link>
      </Bolum>

      <Bolum ust="Süreç" baslik="Başvurudan lansmana.">
        <SurecAdimlari adimlar={PARTNER_SURECI} />
      </Bolum>

      <Bolum id="basvuru" ust="Başvuru" baslik="Ortaklık başvurusu" alt={`Sorun varsa ${ILETISIM.partner} adresine de yazabilirsin.`}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <PartnerFormu />
          <aside className="space-y-6">
            {[
              ["Kaynak kiti", "Logolar, ürün görselleri ve marka kuralları basın odasında hazır."],
              ["Canlı panel", "Kreatör ortakları tıklama, kayıt ve komisyonlarını Vayra Earn'de anlık izler."],
              ["Aylık ödeme", "Komisyonlar Earn cüzdanına geçer; IBAN ya da Papara'ya çekilir."],
            ].map(([a, b]) => (
              <div key={a} className="border-t border-white/[0.08] pt-5">
                <p className="text-[16px] font-semibold text-white">{a}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-metin-2">{b}</p>
              </div>
            ))}
            <Link href="/basin#medya-kiti" className={butonSinif("ikincil")}>Kaynak kitine git</Link>
          </aside>
        </div>
      </Bolum>

      <SikSorulanlar sorular={[
        ...PARTNER_SSS,
        { s: "Kreatör olarak başvurmak için takipçi şartı var mı?", c: "Hayır. Davet bağlantını Vayra Earn'den hemen alıp paylaşmaya başlayabilirsin. Ücretsiz Ultra plan ve erken erişim gibi ek ayrıcalıklar için başvurular kanal kalitesine göre değerlendirilir." },
        { s: "Komisyon ödemeleri ne zaman yapılır?", c: "Davet ettiğin kişinin ödemesi iade süresini doldurduktan sonra komisyonun Earn cüzdanına çekilebilir olarak geçer." },
      ]} baslik="Ortaklık soruları." />
    </>
  );
}
