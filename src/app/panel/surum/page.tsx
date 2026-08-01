"use client";

/**
 * m3: Sürüm Geçmişi (Changelog) — navigasyonda YOK, doğrudan /panel/surum ile açılır.
 * Vayra kalitesinde: sürüm rozetleri (yeni/geliştirme/düzeltme) + tarih + madde listesi.
 * Veri deterministik (SSR güvenli).
 */

import { Sparkles, Wrench, Bug, Rocket, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type DegisiklikTur = "yeni" | "gelistirme" | "duzeltme";
type Surum = {
  no: string;
  tarih: string;
  baslik: string;
  one_cikan?: boolean;
  degisiklikler: { tur: DegisiklikTur; metin: string }[];
};

const TUR_META: Record<DegisiklikTur, { ad: string; ikon: typeof Sparkles; renk: string }> = {
  yeni: { ad: "Yeni", ikon: Sparkles, renk: "bg-aksan/15 text-aksan ring-aksan/25" },
  gelistirme: { ad: "Geliştirme", ikon: Wrench, renk: "bg-sky-400/15 text-sky-300 ring-sky-400/25" },
  duzeltme: { ad: "Düzeltme", ikon: Bug, renk: "bg-rose-400/15 text-rose-300 ring-rose-400/25" },
};

const SURUMLER: Surum[] = [
  {
    no: "3.6.0", tarih: "24 Temmuz 2026", baslik: "Ortak proje deneyimi & Cloud", one_cikan: true,
    degisiklikler: [
      { tur: "yeni", metin: "Projeler artık sinema, kitaplık ve stüdyolar arasında tek ortak havuzda." },
      { tur: "yeni", metin: "Vayra Cloud (API) — 23 model, gerçek anahtar üretimi, oyun alanı, webhook ve hız limitleri." },
      { tur: "gelistirme", metin: "Üretim detay paneli tüm stüdyolarda birleştirildi (gerçek yorumlar, referans, yayın)." },
      { tur: "gelistirme", metin: "Bildirimler yeniden tasarlandı — sol-üstte cam yüzey, ilerleme çubuğu." },
      { tur: "duzeltme", metin: "Navigasyon mega-panelleri artık üst üste binmiyor." },
    ],
  },
  {
    no: "3.5.0", tarih: "14 Temmuz 2026", baslik: "Sinema Stüdyosu 3.5 & Montaj",
    degisiklikler: [
      { tur: "yeni", metin: "Montaj Stüdyosu — çok katmanlı AI video düzenleme (beta)." },
      { tur: "yeni", metin: "Uzun Video Stüdyosu — 1 dk–1 saat çok sahneli üretim." },
      { tur: "gelistirme", metin: "Ses Stüdyosu: gerçek ses klonlama (Add Voice) akışı." },
      { tur: "duzeltme", metin: "Zustand seçici kaynaklı sonsuz-döngü hatası giderildi." },
    ],
  },
  {
    no: "3.4.0", tarih: "1 Temmuz 2026", baslik: "Supercomputer & Oyunlar",
    degisiklikler: [
      { tur: "yeni", metin: "Supercomputer: istemden site, oyun, uygulama üretimi." },
      { tur: "yeni", metin: "AI Çalışanlar — hazır ajanlar (Shorts Ustası, Kişisel Klipçi…)." },
      { tur: "gelistirme", metin: "Kredi halkası: kalan krediye göre renk (yeşil→kırmızı)." },
    ],
  },
  {
    no: "3.3.0", tarih: "18 Haziran 2026", baslik: "Akış & Topluluk",
    degisiklikler: [
      { tur: "yeni", metin: "Akış — TikTok tarzı topluluk feed'i, yeniden oluştur, yorumlar." },
      { tur: "gelistirme", metin: "Keşfet galerisi ve topluluk yayınlama akışı." },
    ],
  },
];

export default function SurumGecmisi() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <Link href="/panel" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-metin-3 transition-colors hover:text-metin">
        <ChevronLeft className="h-4 w-4" /> Panele dön
      </Link>
      <div className="mb-10 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-aksan/15 text-aksan">
          <Rocket className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-metin">Sürüm Geçmişi</h1>
          <p className="mt-1 text-[14px] text-metin-2">Vayra&rsquo;ya eklenen her yenilik, geliştirme ve düzeltme.</p>
        </div>
      </div>

      <div className="relative space-y-8 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-white/[0.08]">
        {SURUMLER.map((s) => (
          <div key={s.no} className="relative pl-8">
            <span className={cn("absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full ring-4 ring-zemin", s.one_cikan ? "bg-aksan" : "bg-white/25")} />
            <div className="mb-2 flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-white/[0.06] px-2.5 py-1 text-[13px] font-bold tabular-nums text-metin">v{s.no}</span>
              <span className="text-[13px] text-metin-3">{s.tarih}</span>
              {s.one_cikan && <span className="rounded-full bg-aksan px-2 py-0.5 text-[11px] font-bold text-zemin">Öne çıkan</span>}
            </div>
            <h2 className="mb-3 text-[18px] font-bold text-metin">{s.baslik}</h2>
            <ul className="space-y-2">
              {s.degisiklikler.map((d, i) => {
                const meta = TUR_META[d.tur];
                return (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className={cn("mt-0.5 flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ring-1 ring-inset", meta.renk)}>
                      <meta.ikon className="h-3 w-3" /> {meta.ad}
                    </span>
                    <span className="text-[14px] leading-relaxed text-metin-2">{d.metin}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
