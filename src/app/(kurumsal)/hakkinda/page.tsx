import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Kap } from "@/components/sirket/ortak";
import { KurucuMektubu, LiderKartlari, ManifestoBaslik, ZamanCizelgesi } from "@/components/sirket/hakkinda/HakkindaParcalari";
import { OfisSeridi } from "@/components/sirket/iletisim/IletisimKutusu";
import { POZISYONLAR } from "@/lib/kurumsal/pozisyonlar";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "Vayra; görsel, video, ses, müzik ve 3D üretimini tek yerde toplayan yaratıcı yapay zekâ platformu. Hikâyemiz, kurucularımızın notu, kilometre taşlarımız, ekibimiz ve ofislerimiz.",
};

const baslik = "text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:text-[40px]";

/** Hakkımızda — "A + B" (2026-10-29): manifesto, kurucu mektubu, zaman çizelgesi, liderler, ekibe katıl, ofisler. */
export default function Hakkinda() {
  return (
    <Kap className="pb-24 pt-6 sm:pt-10">
      <ManifestoBaslik />

      <section className="mt-20 sm:mt-28"><KurucuMektubu /></section>

      <section className="mt-24 sm:mt-32">
        <div className="mx-auto mb-12 max-w-[920px] sm:pl-[180px]">
          <h2 className={baslik}>İki yılda <span className="bg-gradient-to-r from-[#55d6fd] to-[#a8ecff] bg-clip-text text-transparent">buraya geldik</span></h2>
          <p className="mt-2 text-[15px] text-white/65">Basın bültenlerimizle aynı tarihler.</p>
        </div>
        <ZamanCizelgesi />
      </section>

      <section className="mt-20 sm:mt-24">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className={baslik}>Ekibi kuranlar</h2>
          <p className="max-w-md text-[15px] text-white/65">Dört kıtadan, uzaktan öncelikli çalışan 30&apos;dan fazla kişiyiz. Aşağıdakiler çekirdek ekip.</p>
        </div>
        <LiderKartlari />
      </section>

      <section className="mt-16">
        <Link href="/kariyer" className="group flex flex-col gap-5 rounded-[24px] bg-[#55d6fd]/[0.07] p-6 ring-1 ring-inset ring-[#55d6fd]/20 transition-colors hover:bg-[#55d6fd]/[0.11] sm:flex-row sm:items-center sm:p-8">
          <div className="flex-1">
            <p className="text-[24px] font-semibold tracking-[-0.025em] text-white">Bir sonraki satırı birlikte yazalım</p>
            <p className="mt-1 text-[15px] text-white/70">{POZISYONLAR.length} açık rol; her ilanda maaş aralığı yazar.</p>
          </div>
          <span className="flex h-11 w-fit items-center gap-1.5 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition group-hover:bg-white/90">Açık roller<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
        </Link>
      </section>

      <div className="mt-24"><OfisSeridi /></div>
    </Kap>
  );
}
