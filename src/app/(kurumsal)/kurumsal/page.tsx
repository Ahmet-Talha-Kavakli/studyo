import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Kap } from "@/components/sirket/ortak";
import { SatisFormu } from "@/components/sirket/SatisFormu";
import { HatBaslik, Karsilastirma, KurumsalSss, SatinAlmaListesi, UretimHatti, YoneticiKartlari } from "@/components/sirket/kurumsal/KurumsalParcalari";
import { ILETISIM } from "@/lib/kurumsal/site";

export const metadata: Metadata = {
  title: "Kurumsal",
  description: "Ekipler ve kurumlar için Vayra: ortak kredi havuzu, SSO, denetim kayıtları, veri ikamet bölgesi, marka modeli, onay akışı, SLA ve atanmış başarı yöneticisi.",
};

const SSS = [
  { s: "Kurumsal plan ne kadar?", c: "Fiyat; kredi hacmine, üye sayısına, veri bölgesi ve özel model ihtiyacına göre yıllık sözleşmeyle belirlenir. Ekip planı fiyatlandırma sayfasında açıkça listelenir; daha büyük ihtiyaçlar için satış ekibimiz teklif hazırlar." },
  { s: "Verilerimiz model eğitiminde kullanılır mı?", c: "Hayır. İstemleriniz, yüklediğiniz dosyalar ve çıktılarınız ne bizim ne de model sağlayıcılarımızın modellerini eğitmek için kullanılmaz. Bu taahhüt sözleşmeye de yazılır." },
  { s: "Hangi kimlik sağlayıcılarla SSO çalışıyor?", c: "SAML 2.0 destekleyen tüm kimlik sağlayıcılarla: Okta, Microsoft Entra ID, Google Workspace, OneLogin ve JumpCloud. Kullanıcı yaşam döngüsü SCIM ile otomatik yönetilebilir." },
  { s: "Veri işleme sözleşmesi (DPA) imzalıyor musunuz?", c: "Evet. GDPR md. 28 ve KVKK uyumlu standart DPA'mızı sunar, gerekirse kurumunuzun sözleşmesini inceleriz. Alt işleyici listesi Güvenlik sayfasında yayınlanır." },
  { s: "Ürettiğimiz içeriklerin hakları kimde?", c: "Ürettiğiniz tüm içerikler size aittir ve ticari olarak kullanılabilir. Kurumsal sözleşmelerde fikrî mülkiyet tazminat güvencesi de sunuyoruz." },
  { s: "Kurulum ne kadar sürer?", c: "SSO ve çalışma alanı kurulumu genellikle bir gün sürer. İlk hafta içinde ekibinize canlı eğitim veririz; özel marka modeli eğitimi 1–2 hafta sürer." },
];

const baslik = "text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:text-[38px]";

/** Kurumsal — "B · Üretim hattı" (2026-10-29). */
export default function Kurumsal() {
  return (
    <Kap className="pb-24 pt-6 sm:pt-10">
      <HatBaslik />

      <section id="hat" className="mt-20 scroll-mt-24 sm:mt-28">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className={`${baslik} max-w-[620px]`}>Brif'ten yayına, <span className="bg-gradient-to-r from-[#55d6fd] to-[#a8ecff] bg-clip-text text-transparent">her adımda kontrol</span></h2>
          <p className="max-w-sm text-[14.5px] text-white/65">Ekibin hızlı üretir; kurallar her adımda kendiliğinden işler.</p>
        </div>
        <UretimHatti />
      </section>

      <section className="mt-24 sm:mt-28">
        <h2 className={`${baslik} mb-2`}>Yönetici için tek ekran</h2>
        <p className="mb-8 max-w-xl text-[14.5px] text-white/65">Finans ve BT'nin sorduğu her şey: bütçe, model erişimi, kimlik ve kayıt.</p>
        <YoneticiKartlari />
      </section>

      <section className="mt-24">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 className={baslik}>Satın alma sürecine hazır</h2>
          <Link href="/guvenlik" className="group flex items-center gap-1 text-[14px] text-white/65 transition hover:text-white">Güvenlik merkezi<ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
        </div>
        <SatinAlmaListesi />
      </section>

      <section className="mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className={baslik}>Ekip mi, Kurumsal mı?</h2>
            <p className="mt-2 max-w-xl text-[14.5px] text-white/65">10 kişiye kadar ekipler kartla hemen başlayabilir. Kimlik yönetimi, veri ikameti ve sözleşme ihtiyacı olan kurumlar için Kurumsal.</p>
          </div>
          <Link href="/fiyatlandirma?kitle=ekip" className="flex items-center gap-1 text-[14px] text-white/65 transition hover:text-white">Ekip fiyatları<ArrowUpRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-6"><Karsilastirma /></div>
      </section>

      <section id="gorusme" className="mt-24 grid scroll-mt-24 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div>
          <h2 className={baslik}>Ekibine özel bir demo planlayalım</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/65">Formu doldur; 1 iş günü içinde dönüş yapalım. İstersen doğrudan <a href={`mailto:${ILETISIM.satis}`} className="text-white underline-offset-4 hover:underline">{ILETISIM.satis}</a> adresine yaz.</p>
          <ol className="mt-8 divide-y divide-white/[0.07] border-y border-white/[0.07]">
            {[["Kişiye özel demo", "Kendi kullanım senaryolarınla, kendi markanla 30 dakikalık canlı gösterim."], ["İki haftalık deneme alanı", "Ekibin gerçek projelerle denesin; SSO ilk gün bağlanır."], ["Esnek sözleşme", "Kredi hacmine göre fiyat, fatura ile ödeme, e-fatura."]].map(([a, b], i) => (
              <li key={a} className="flex gap-4 py-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#55d6fd] text-[12px] font-semibold text-[#04212b]">{i + 1}</span>
                <span><span className="block text-[15px] font-medium text-white">{a}</span><span className="mt-0.5 block text-[14px] leading-relaxed text-white/65">{b}</span></span>
              </li>
            ))}
          </ol>
        </div>
        <SatisFormu />
      </section>

      <section className="mt-24 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">Sık sorulanlar</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-white/65">Güvenlik değerlendirme paketi ve DPA için <Link href="/guvenlik" className="text-white underline-offset-4 hover:underline">Güvenlik merkezi</Link>.</p>
        </div>
        <KurumsalSss sorular={SSS} />
      </section>
    </Kap>
  );
}
