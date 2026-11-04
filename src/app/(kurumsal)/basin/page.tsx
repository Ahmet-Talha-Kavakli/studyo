import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, Mail } from "lucide-react";
import { Bolum, Kap, SirketHero, butonSinif } from "@/components/sirket/ortak";
import { KopyalaButonu } from "@/components/sirket/KopyalaButonu";
import { BASIN_BULTENLERI, BOILERPLATE, KUNYE, MARKA_RENKLER, MARKA_VARLIKLAR, URUN_GORSELLERI } from "@/lib/kurumsal/basin";
import { LIDERLIK } from "@/lib/kurumsal/icerik";
import { ILETISIM } from "@/lib/kurumsal/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Basın",
  description: "Vayra basın odası: basın bültenleri, medya kiti, logo ve ürün görselleri, marka renkleri, şirket künyesi ve basın iletişimi.",
};

export default function Basin() {
  const [son, ...digerleri] = BASIN_BULTENLERI;
  return (
    <>
      <SirketHero ust="Basın odası" baslik="Vayra hakkında yazıyorsan, ihtiyacın olan her şey burada."
        alt="Güncel duyurular, indirilebilir medya kiti ve şirket bilgileri. Röportaj ve görüş talepleri için basın ekibimiz bir iş günü içinde dönüyor.">
        <a href={`mailto:${ILETISIM.basin}`} className={butonSinif("beyaz")}><Mail className="h-4 w-4" />{ILETISIM.basin}</a>
        <a href="#medya-kiti" className={butonSinif("ikincil")}>Medya kiti</a>
      </SirketHero>

      <Bolum ust="Duyurular" baslik="Basın bültenleri">
        <Link href={`/basin/${son.slug}`} className="group block rounded-[24px] border border-white/[0.07] bg-yuzey p-7 transition-colors hover:border-white/[0.16] sm:p-9">
          <p className="text-[12.5px] font-medium text-vurgu">{son.kategori} · {son.tarih}</p>
          <h3 className="mt-3 max-w-[820px] text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-white sm:text-[34px]">{son.baslik}</h3>
          <p className="mt-3 max-w-[680px] text-[15.5px] leading-relaxed text-metin-2">{son.ozet}</p>
          <span className="mt-6 inline-flex items-center gap-1 text-[14px] font-medium text-white">Bülteni oku <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
        </Link>
        <div className="mt-3 divide-y divide-white/[0.07] border-y border-white/[0.07]">
          {digerleri.map((b) => (
            <Link key={b.slug} href={`/basin/${b.slug}`} className="group grid gap-2 py-5 sm:grid-cols-[150px_100px_minmax(0,1fr)_20px] sm:items-center sm:gap-6">
              <span className="text-[13px] tabular-nums text-metin-3">{b.tarih}</span>
              <span className="text-[12.5px] font-medium text-vurgu">{b.kategori}</span>
              <span className="text-[16px] font-medium text-white group-hover:underline group-hover:underline-offset-4">{b.baslik}</span>
              <ArrowRight className="hidden h-4 w-4 text-metin-3 group-hover:text-white sm:block" />
            </Link>
          ))}
        </div>
      </Bolum>

      <Bolum id="medya-kiti" ust="Medya kiti" baslik="Logolar ve ürün görselleri" alt="Haberlerinde serbestçe kullanabilirsin. Logoyu yeniden renklendirme, gerdirme ya da efekt ekleme.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MARKA_VARLIKLAR.map((v) => (
            <div key={v.ad} className="overflow-hidden rounded-[20px] border border-white/[0.07] bg-yuzey">
              <div className="flex aspect-[4/3] items-center justify-center bg-[#0d0d10] p-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.onizleme} alt={v.ad} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex items-center gap-3 p-4">
                <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-white">{v.ad}</span><span className="block text-[12px] text-metin-3">{v.format}</span></span>
                <a href={v.yol} download aria-label={`${v.ad} indir`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] text-metin-2 hover:text-white"><Download className="h-4 w-4" /></a>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {URUN_GORSELLERI.map((u) => (
            <a key={u.yol} href={u.yol} download className="group overflow-hidden rounded-[20px] border border-white/[0.07] bg-yuzey">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u.yol} alt={u.ad} loading="lazy" className="aspect-[16/10] w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]" />
              <span className="flex items-center justify-between p-4 text-[14px] font-semibold text-white">{u.ad}<Download className="h-4 w-4 text-metin-3 group-hover:text-white" /></span>
            </a>
          ))}
        </div>
      </Bolum>

      <Bolum ust="Renkler" baslik="Marka renkleri">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {MARKA_RENKLER.map((r) => (
            <div key={r.hex} className="overflow-hidden rounded-[18px] border border-white/[0.07] bg-yuzey">
              <div className="h-24" style={{ background: r.hex }} />
              <div className="flex items-center justify-between gap-2 p-3.5">
                <span><span className="block text-[13.5px] font-semibold text-white">{r.ad}</span><span className="block font-mono text-[12px] text-metin-3">{r.hex}</span></span>
                <KopyalaButonu metin={r.hex} etiket="" className="px-2" />
              </div>
            </div>
          ))}
        </div>
      </Bolum>

      <Bolum ust="Şirket" baslik="Künye ve şirket tanımı">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="rounded-[22px] border border-white/[0.07] bg-yuzey p-7">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold text-white">Vayra hakkında</p>
              <KopyalaButonu metin={BOILERPLATE} />
            </div>
            <p className="mt-4 text-[15.5px] leading-[1.75] text-metin-2">{BOILERPLATE}</p>
          </div>
          <dl className="divide-y divide-white/[0.06] rounded-[22px] border border-white/[0.07] bg-yuzey px-6">
            {KUNYE.map((k) => (
              <div key={k.etiket} className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 py-3.5 text-[14px]"><dt className="text-metin-3">{k.etiket}</dt><dd className="text-white">{k.deger}</dd></div>
            ))}
          </dl>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LIDERLIK.slice(0, 4).map((l) => (
            <div key={l.ad} className="rounded-[20px] border border-white/[0.07] p-5">
              <p className="text-[15px] font-semibold text-white">{l.ad}</p>
              <p className="text-[13px] text-metin-2">{l.unvan}</p>
              <p className="mt-3 text-[12.5px] text-metin-3">Röportaj için uygun · {l.konum}</p>
            </div>
          ))}
        </div>
      </Bolum>

      <Kap className="pb-20">
        <div className={cn("flex flex-col gap-5 rounded-[26px] border border-white/[0.07] bg-[color-mix(in_oklab,var(--vurgu-renk)_9%,#111113)] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10")}>
          <div>
            <h2 className="text-[26px] font-semibold tracking-[-0.025em] text-white">Basın iletişimi</h2>
            <p className="mt-2 max-w-[520px] text-[15px] text-metin-2">Röportaj, yorum ve görsel talepleri için yaz; bir iş günü içinde dönüyoruz. Destek talepleri için lütfen iletişim sayfasını kullan.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={`mailto:${ILETISIM.basin}`} className={butonSinif("beyaz")}><Mail className="h-4 w-4" />{ILETISIM.basin}</a>
            <Link href="/iletisim" className={butonSinif("ikincil")}>İletişim</Link>
          </div>
        </div>
      </Kap>
    </>
  );
}
