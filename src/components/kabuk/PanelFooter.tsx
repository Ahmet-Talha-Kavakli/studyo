"use client";

import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { VayraIsaret } from "./VayraIsaret";

/**
 * PanelFooter — panel içi içerik sayfaları için footer.
 *
 * Tasarım (2026-07-30, kullanıcı referansı): dokulu renkli zemin üzerinde
 * NAVİGASYON / SOSYAL MEDYA / YASAL sütunları, altta ince sorumluluk metni ve
 * sağda "Başa Dön". Referans turuncuydu; Vayra'nın imza rengiyle (cyan)
 * yeniden yorumlandı.
 *
 * Tam-ekran akış/composer sayfalarında KULLANILMAZ; galeri/liste sayfalarının
 * dibine eklenir.
 */

const SUTUNLAR: { baslik: string; linkler: { ad: string; href: string; vurgu?: boolean }[] }[] = [
  {
    baslik: "Navigasyon",
    linkler: [
      { ad: "Keşfet", href: "/panel" },
      { ad: "Stüdyolar", href: "/panel/gorsel" },
      { ad: "Viral Presetler", href: "/panel/presetler" },
      { ad: "Usta", href: "/panel/supercomputer" },
      { ad: "Kitaplığım", href: "/panel/kitaplik" },
    ],
  },
  {
    baslik: "Sosyal Medya",
    linkler: [
      { ad: "Instagram", href: "https://instagram.com" },
      { ad: "X (Twitter)", href: "https://x.com" },
      { ad: "YouTube", href: "https://youtube.com" },
      { ad: "Discord", href: "https://discord.com" },
    ],
  },
  {
    baslik: "Yasal",
    linkler: [
      { ad: "Kullanım Koşulları", href: "/sartlar" },
      { ad: "Gizlilik Sözleşmesi", href: "/gizlilik" },
      { ad: "Veri Koruma Bildirimi", href: "/veri-koruma" },
      { ad: "Çerez Politikası", href: "/cerezler" },
      { ad: "İptal ve İade Koşulları", href: "/iade" },
      { ad: "Yasal Bilgiler", href: "/yasal" },
    ],
  },
];

/** Dış bağlantı mı? (sosyal medya) — yeni sekmede ve rel korumasıyla açılır. */
const disMi = (h: string) => h.startsWith("http");

export function PanelFooter() {
  const basaDon = () =>
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });

  return (
    <footer className="panel-footer relative mt-10 overflow-hidden">
      {/* Dokulu renk zemini — referanstaki "dolu" his. Çapraz ince tarama +
          köşeden yayılan aksan ışıması. */}
      <div aria-hidden className="panel-footer-doku pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-[1600px] px-6 pb-8 pt-14 sm:px-10">
        {/* ══════ Sütunlar ══════ */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.1fr_repeat(3,1fr)]">
          {/* Marka — referansta yok ama bizde nav'da logo var, kimlik burada da dursun */}
          <div className="max-w-xs">
            <Link href="/panel" className="flex items-center gap-2.5">
              <VayraIsaret size={28} />
              <span className="text-[18px] font-bold text-white">Vayra</span>
            </Link>
            <p className="mt-3 text-[13px] leading-relaxed text-metin-3">
              Fikirden yayına — tek yerde AI görsel, video, ses ve 3D üretimi.
            </p>
          </div>

          {SUTUNLAR.map((s) => (
            <div key={s.baslik}>
              <p className="mb-4 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-metin-3">
                {s.baslik}
              </p>
              <ul className="space-y-3">
                {s.linkler.map((l) => (
                  <li key={l.ad}>
                    {disMi(l.href) ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer"
                        className="text-[14.5px] font-semibold text-white/90 transition-colors hover:text-[var(--sn-lime,#55d6fd)]">
                        {l.ad}
                      </a>
                    ) : (
                      <Link href={l.href}
                        className="text-[14.5px] font-semibold text-white/90 transition-colors hover:text-[var(--sn-lime,#55d6fd)]">
                        {l.ad}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ══════ Sorumluluk metni ══════ */}
        <p className="mx-auto mt-14 max-w-3xl text-center text-[12.5px] leading-relaxed text-metin-3">
          Vayra yapay zekâ destekli bir üretim platformudur. Üretilen içeriklerin telif ve yasal
          sorumluluğu tamamen kullanıcıya aittir. Platform dışı bağlantıların içeriklerinden Vayra
          sorumlu tutulamaz.
        </p>

        {/* ══════ Alt şerit ══════ */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/[0.07] pt-6 sm:flex-row">
          <span className="text-[13px] text-metin-3">© 2026 Vayra. Tüm hakları saklıdır.</span>
          <button onClick={basaDon}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--sn-lime,#55d6fd)] transition-opacity hover:opacity-75">
            Başa Dön <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
