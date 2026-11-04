import Link from "next/link";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { XIcon, InstagramIcon, YoutubeIcon, GithubIcon } from "./SocialIcons";
import { SOSYAL } from "@/lib/kurumsal/site";

const kolonlar = [
  {
    baslik: "Ürün",
    linkler: [
      ["Sinema Stüdyosu", "/urunler/sinema"],
      ["Pazarlama Stüdyosu", "/urunler/pazarlama"],
      ["3D Stüdyo", "/urunler/3d"],
      ["Ses Stüdyosu", "/urunler/ses"],
      ["Modeller", "/modeller"],
    ],
  },
  {
    baslik: "Kaynaklar",
    linkler: [
      ["Keşfet", "/kesfet"],
      ["Blog", "/blog"],
      ["Fiyatlandırma", "/fiyatlandirma"],
      ["API & MCP", "/gelistirici"],
      ["SSS", "/sss"],
      ["Sistem durumu", "/durum"],
    ],
  },
  {
    baslik: "Şirket",
    linkler: [
      ["Hakkımızda", "/hakkinda"],
      ["Kurumsal", "/kurumsal"],
      ["Kariyer", "/kariyer"],
      ["Basın", "/basin"],
      ["İş Ortaklığı", "/partner"],
      ["İletişim", "/iletisim"],
    ],
  },
  {
    baslik: "Yasal",
    linkler: [
      ["Yasal Merkez", "/yasal"],
      ["Güvenlik", "/guvenlik"],
      ["Gizlilik", "/gizlilik"],
      ["Şartlar", "/sartlar"],
      ["Veri Koruma", "/veri-koruma"],
      ["İade Politikası", "/iade"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-32 border-t border-white/10 bg-ink-950/80">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <VayraIsaret size={32} />
              <span className="text-lg font-bold">Vayra</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-white/50">
              Yaratıcılığın altyapısı. Tek panelde sinematik video, editorial görsel,
              3D modelleme ve stüdyo kalitesinde ses.
            </p>
            <div className="mt-5 flex gap-2">
              {[
                { I: XIcon, ad: "X (Twitter)", url: SOSYAL.x },
                { I: InstagramIcon, ad: "Instagram", url: SOSYAL.instagram },
                { I: YoutubeIcon, ad: "YouTube", url: SOSYAL.youtube },
                { I: GithubIcon, ad: "GitHub", url: SOSYAL.github },
              ].map(({ I, ad, url }) => (
                <a key={ad} href={url} target="_blank" rel="noopener noreferrer" aria-label={ad} title={ad} className="group relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/60 transition-colors hover:border-white/25 hover:text-white">
                  <I className="h-4 w-4" />
                  <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink-800 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">{ad}</span>
                </a>
              ))}
            </div>
          </div>
          {kolonlar.map((k) => (
            <div key={k.baslik}>
              <h4 className="text-sm font-semibold text-white/90">{k.baslik}</h4>
              <ul className="mt-4 space-y-2.5">
                {k.linkler.map(([ad, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-white/50 transition-colors hover:text-white">
                      {ad}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/40 sm:flex-row">
          <p>© 2026 Vayra. Tüm hakları saklıdır.</p>
          <p>Dört kıtada uzaktan çalışan bir ekip tarafından üretildi 🌍</p>
        </div>
      </div>
    </footer>
  );
}
