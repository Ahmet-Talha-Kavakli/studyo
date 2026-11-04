import type { Metadata } from "next";
import { Kap } from "@/components/sirket/ortak";
import { DegerIzgarasi, KariyerSss, RolTarayici, SinemaBaslik, SurecSeridi } from "@/components/sirket/kariyer/KariyerParcalari";
import { ILETISIM } from "@/lib/kurumsal/site";

export const metadata: Metadata = {
  title: "Kariyer",
  description: "Vayra'da yaratıcılığın geleceğini birlikte kuralım. Uzaktan öncelikli, maaş aralığı açık ilanlar; mühendislik, yapay zekâ, tasarım, satış ve topluluk rolleri.",
};

const baslik = "text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:text-[40px]";

/** Kariyer — "A · Sinema + rol tarayıcı" (2026-10-29). */
export default function Kariyer() {
  return (
    <Kap className="pb-24 pt-6 sm:pt-10">
      <SinemaBaslik />

      <section id="roller" className="mt-20 scroll-mt-24 sm:mt-28">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className={baslik}>Kuracağımız şeyde <span className="bg-gradient-to-r from-[#55d6fd] to-[#a8ecff] bg-clip-text text-transparent">yerini bul</span></h2>
          <p className="text-[14.5px] text-white/65">Her ilanda maaş aralığı yazar; başvurunu bir insan okur.</p>
        </div>
        <RolTarayici />
      </section>

      <section className="mt-24 sm:mt-28">
        <h2 className={`${baslik} max-w-[640px]`}>Kariyerinin en iddialı işini, işine düşkün bir ekiple yap</h2>
        <DegerIzgarasi />
      </section>

      <section className="mt-24">
        <h2 className="text-[24px] font-semibold tracking-[-0.025em] text-white">Beş adım, iki-üç hafta</h2>
        <p className="mt-1 text-[14.5px] text-white/65">Her aşamanın sonunda ne olacağını bilirsin; olumsuz sonuçlanırsa gerekçesini paylaşırız.</p>
        <SurecSeridi />
      </section>

      <section className="mt-24 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div>
          <h2 className="text-[24px] font-semibold tracking-[-0.025em] text-white">Sık sorulanlar</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-white/65">Başka bir sorun varsa <a href={`mailto:${ILETISIM.kariyer}`} className="text-white underline-offset-4 hover:underline">{ILETISIM.kariyer}</a> adresine yaz.</p>
        </div>
        <KariyerSss />
      </section>
    </Kap>
  );
}
