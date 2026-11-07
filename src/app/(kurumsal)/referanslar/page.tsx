import type { Metadata } from "next";
import { Bolum, Kap, KapanisBandi, SayiSeridi, SirketHero, butonSinif } from "@/components/sirket/ortak";
import { HikayeIzgarasi } from "@/components/sirket/HikayeIzgarasi";
import { EKIPLER, SOZLER } from "@/lib/kurumsal/musteriler";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Müşteriler",
  description: "Ajanslar, e-ticaret markaları, yapım şirketleri ve oyun stüdyoları Vayra ile nasıl üretiyor? Ölçülebilir sonuçlarla müşteri hikâyeleri.",
};

export default function Referanslar() {
  return (
    <>
      <SirketHero ust="Müşteriler" baslik="Fikirden yayına, ölçülebilir hızla."
        alt="Bağımsız yaratıcılardan 100 kişilik ekiplere kadar 120'den fazla ülkede ekipler Vayra ile üretiyor. İşte yaptıkları ve kazandıkları.">
        <Link href="/kurumsal#iletisim" className={butonSinif("beyaz")}>Ekibin için konuşalım</Link>
        <Link href="/panel" className={butonSinif("ikincil")}>Ücretsiz başla</Link>
      </SirketHero>

      <Bolum>
        <HikayeIzgarasi />
      </Bolum>

      <Kap>
        <SayiSeridi ogeler={[
          { deger: "10.000+", etiket: "aktif yaratıcı ve ekip" },
          { deger: "yüzde 74", etiket: "ortalama daha kısa teslim süresi" },
          { deger: "3,1x", etiket: "proje başına daha fazla konsept" },
          { deger: "4,9/5", etiket: "ortalama memnuniyet puanı" },
        ]} />
      </Kap>

      <Bolum ust="Ekipler ne diyor" baslik="Kendi sözleriyle.">
        <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 [&>*]:mb-3">
          {SOZLER.map((s) => (
            <figure key={s.kisi} className="break-inside-avoid rounded-[22px] border border-white/[0.07] bg-yuzey p-6">
              <blockquote className="text-[15.5px] leading-relaxed text-white/90">&ldquo;{s.metin}&rdquo;</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-white/[0.06] pt-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-[12px] font-semibold text-white">{s.kisi.split(" ").map((x) => x[0]).join("").slice(0, 2)}</span>
                <span><span className="block text-[13.5px] font-semibold text-white">{s.kisi}</span><span className="block text-[12px] text-metin-3">{s.unvan} · {s.sirket} · {s.konum}</span></span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Bolum>

      <Kap className="pb-6">
        <p className="text-center text-[12.5px] font-medium text-metin-3">Vayra ile üreten ekiplerden bazıları</p>
        <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-5 text-center sm:grid-cols-3 lg:grid-cols-6">
          {EKIPLER.map((e) => <span key={e} className="text-[16px] font-semibold tracking-[-0.02em] text-white/45">{e}</span>)}
        </div>
      </Kap>

      <KapanisBandi baslik="Sıradaki hikâye senin ekibinin olsun." alt="Ekibine özel bir demo için satış ekibimizle görüş." birincil={{ ad: "Satış ekibiyle görüş", href: "/kurumsal#iletisim" }} ikincil={{ ad: "Fiyatlandırma", href: "/fiyatlandirma" }} />
    </>
  );
}
