import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, FileText, Cookie, Scale, RotateCcw, ArrowRight } from "lucide-react";
import { Hero, Kart } from "@/components/kurumsal/UI";

export const metadata: Metadata = {
  title: "Yasal Merkez — Vayra",
  description: "Vayra'nın tüm yasal belgeleri tek yerde: gizlilik, kullanım şartları, veri koruma bildirimi, çerez bildirimi ve iade politikası.",
};

const belgeler = [
  { ikon: ShieldCheck, ad: "Gizlilik Politikası", ozet: "Verilerini nasıl topladığımız, kullandığımız ve koruduğumuz.", href: "/gizlilik", guncelleme: "1 Temmuz 2026" },
  { ikon: FileText, ad: "Kullanım Şartları", ozet: "Hizmeti kullanırken geçerli koşullar ve sorumluluklar.", href: "/sartlar", guncelleme: "1 Temmuz 2026" },
  { ikon: Scale, ad: "Veri Koruma Bildirimi", ozet: "GDPR, UK GDPR ve CCPA kapsamında kişisel verilerin işlenmesi ve hakların.", href: "/veri-koruma", guncelleme: "1 Temmuz 2026" },
  { ikon: Cookie, ad: "Çerez Bildirimi", ozet: "Hangi çerezleri neden kullandığımız ve tercih yönetimi.", href: "/cerezler", guncelleme: "1 Temmuz 2026" },
  { ikon: RotateCcw, ad: "İade & İptal Politikası", ozet: "Abonelik iptali, kredi paketleri ve para iadesi koşulları.", href: "/iade", guncelleme: "1 Temmuz 2026" },
];

export default function YasalMerkez() {
  return (
    <>
      <Hero
        ustBaslik="Yasal Merkez"
        baslik="Tüm yasal belgeler tek yerde"
        aciklama="Şeffaflığa inanıyoruz. Gizlilik, kullanım koşulları ve veri koruma belgelerimize buradan ulaşabilirsin."
      />

      <section className="mx-auto max-w-4xl px-4 pb-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {belgeler.map((b) => (
            <Link key={b.href} href={b.href as never} className="group">
              <Kart hover className="flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <span className="kr-ikon flex h-11 w-11 items-center justify-center rounded-xl"><b.ikon className="h-5 w-5" /></span>
                  <ArrowRight className="h-5 w-5 text-[color:var(--color-metin-3)] transition-all group-hover:translate-x-1 group-hover:text-[color:var(--kr-lime-metin)]" />
                </div>
                <h3 className="mt-4 font-semibold text-[color:var(--color-metin)]">{b.ad}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[color:var(--color-metin-2)]">{b.ozet}</p>
                <p className="mt-3 text-xs text-[color:var(--color-metin-3)]">Güncelleme: {b.guncelleme}</p>
              </Kart>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-[color:var(--color-metin-3)]">
          Yasal bir sorun için{" "}
          <a href="mailto:hello@vayra.ai" className="font-semibold text-[color:var(--kr-lime-metin)]">hello@vayra.ai</a>{" "}
          adresine yazabilirsin.
        </p>
      </section>
    </>
  );
}
