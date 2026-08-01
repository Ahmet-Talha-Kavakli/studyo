import Link from "next/link";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { XIcon, InstagramIcon, YoutubeIcon, GithubIcon } from "@/components/site/SocialIcons";
import { SOSYAL, SIRKET } from "@/lib/kurumsal/site";

/* Beyaz kurumsal footer — 5 kolon + gerçek sosyal linkler.
   NOT (2026-08-01): /durum sayfası kaldırıldığı için canlı durum rozeti de
   söküldü — aksi hâlde ölü bir linke işaret ediyordu. */

/* SADECE resmî/şirket kolonları — ürün/pazarlama linkleri yok. */
const kolonlar: { baslik: string; linkler: [string, string][] }[] = [
  {
    baslik: "Şirket",
    linkler: [
      ["Hakkımızda", "/hakkinda"],
      ["Kurumsal", "/kurumsal"],
      ["Kariyer", "/kariyer"],
      ["Blog", "/blog"],
      ["Referanslar", "/referanslar"],
    ],
  },
  {
    baslik: "Kurumsal",
    linkler: [
      ["Basın", "/basin"],
      ["Güvenlik", "/guvenlik"],
      ["İş Ortaklığı", "/partner"],
      ["İletişim", "/iletisim"],
    ],
  },
  {
    baslik: "Yasal",
    linkler: [
      ["Yasal Merkez", "/yasal"],
      ["Gizlilik", "/gizlilik"],
      ["Şartlar", "/sartlar"],
      ["Çerezler", "/cerezler"],
      ["Veri Koruma", "/veri-koruma"],
      ["İade Politikası", "/iade"],
    ],
  },
];

export function KurumsalFooter() {
  const sosyal = [
    { I: XIcon, ad: "X (Twitter)", url: SOSYAL.x },
    { I: InstagramIcon, ad: "Instagram", url: SOSYAL.instagram },
    { I: YoutubeIcon, ad: "YouTube", url: SOSYAL.youtube },
    { I: GithubIcon, ad: "GitHub", url: SOSYAL.github },
  ];

  return (
    <footer className="mt-24 border-t border-[color:var(--color-kenar)] bg-[color:var(--color-yuzey-2)]">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          {/* Marka bloğu */}
          <div className="col-span-2">
            <Link href={"/kurumsal" as never} className="flex items-center gap-2">
              <VayraIsaret size={30} />
              <span className="text-lg font-bold text-[color:var(--color-metin)]">Vayra</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[color:var(--color-metin-2)]">{SIRKET.aciklama}</p>
            <div className="mt-5 flex gap-2">
              {sosyal.map(({ I, ad, url }) => (
                <a key={ad} href={url} target="_blank" rel="noopener noreferrer" aria-label={ad} title={ad}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--color-kenar)] text-[color:var(--color-metin-2)] transition-colors hover:border-[color:var(--color-kenar-2)] hover:text-[color:var(--color-metin)]">
                  <I className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link kolonları */}
          {kolonlar.map((k) => (
            <div key={k.baslik}>
              <h4 className="text-sm font-semibold text-[color:var(--color-metin)]">{k.baslik}</h4>
              <ul className="mt-4 space-y-2.5">
                {k.linkler.map(([ad, href]) => (
                  <li key={href}>
                    <Link href={href as never} className="text-sm text-[color:var(--color-metin-2)] transition-colors hover:text-[color:var(--color-metin)]">{ad}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Alt şerit */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[color:var(--color-kenar)] pt-8 sm:flex-row">
          <p className="text-sm text-[color:var(--color-metin-3)]">© 2026 {SIRKET.yasalAd}. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-4">
            <p className="text-sm text-[color:var(--color-metin-3)]">{SIRKET.merkez} · Dünya genelinde uzaktan</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
