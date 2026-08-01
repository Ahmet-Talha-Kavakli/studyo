"use client";

/**
 * m3: Blog — navigasyonda YOK, /panel/blog ile açılır.
 * Vayra kalitesinde: öne çıkan yazı + yazı ızgarası (kategori, okuma süresi, tarih).
 * Görseller onizlemeArka ile deterministik üretilir (SSR güvenli).
 */

import { ChevronLeft, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { onizlemeArka, saltUrl, cn } from "@/lib/utils";
import { kesfetArka } from "@/lib/gercekVeri";

type Yazi = {
  slug: string;
  baslik: string;
  ozet: string;
  kategori: string;
  tarih: string;
  sure: string;
  tohum: string;
  one_cikan?: boolean;
};

const YAZILAR: Yazi[] = [
  { slug: "sinema-3-5", baslik: "Sinema Stüdyosu 3.5 ile film-kalitesi üretim", ozet: "AI yönetmen, kamera kontrolü ve çok sahneli akışla dakikalar içinde sinematik videolar nasıl üretilir?", kategori: "Ürün", tarih: "22 Tem 2026", sure: "6 dk", tohum: "blog-sinema", one_cikan: true },
  { slug: "prompt-rehberi", baslik: "Etkili görsel istem yazma rehberi", ozet: "Işık, kompozisyon ve stil anahtar kelimeleriyle çıktı kalitesini ikiye katlayın.", kategori: "Rehber", tarih: "18 Tem 2026", sure: "8 dk", tohum: "blog-prompt" },
  { slug: "supercomputer-oyun", baslik: "Supercomputer ile dakikalar içinde oyun kur", ozet: "Tek bir istemden çalışan bir platform oyununa: agentic üretim akışını inceliyoruz.", kategori: "Ürün", tarih: "10 Tem 2026", sure: "5 dk", tohum: "blog-oyun" },
  { slug: "ses-klonlama", baslik: "Kendi sesini klonla: adım adım", ozet: "2 dakikalık bir kayıtla markana özel bir seslendirme sesi oluşturmanın yolu.", kategori: "Rehber", tarih: "3 Tem 2026", sure: "4 dk", tohum: "blog-ses" },
  { slug: "viral-shorts", baslik: "Viral shorts için 7 preset", ozet: "En çok izlenen dikey video efektleri ve nasıl uygulanacakları.", kategori: "İpucu", tarih: "28 Haz 2026", sure: "5 dk", tohum: "blog-shorts" },
  { slug: "api-baslangic", baslik: "Vayra Cloud API'ye başlangıç", ozet: "İlk anahtarını üret, ilk çağrını yap ve üretimi otomatikleştir.", kategori: "Geliştirici", tarih: "20 Haz 2026", sure: "7 dk", tohum: "blog-api" },
];

const KAT_RENK: Record<string, string> = {
  "Ürün": "bg-aksan/15 text-aksan",
  "Rehber": "bg-sky-400/15 text-sky-300",
  "İpucu": "bg-violet-400/15 text-violet-300",
  "Geliştirici": "bg-emerald-400/15 text-emerald-300",
};

export default function BlogSayfasi() {
  const oneCikan = YAZILAR.find((y) => y.one_cikan) ?? YAZILAR[0];
  const digerleri = YAZILAR.filter((y) => y !== oneCikan);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <Link href="/panel" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-metin-3 transition-colors hover:text-metin">
        <ChevronLeft className="h-4 w-4" /> Panele dön
      </Link>
      <h1 className="mb-2 text-[32px] font-black tracking-tight text-metin">Vayra Blog</h1>
      <p className="mb-8 text-[15px] text-metin-2">Ürün güncellemeleri, üretim rehberleri ve yaratıcı ipuçları.</p>

      {/* öne çıkan */}
      <Link href="#" className="group mb-10 block overflow-hidden rounded-3xl ring-1 ring-inset ring-white/[0.06]">
        <div className="grid md:grid-cols-2">
          <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto">
            <span className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${saltUrl(kesfetArka(oneCikan.tohum, "sinematik")) || ""})` }} />
          </div>
          <div className="flex flex-col justify-center gap-3 bg-yuzey p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <span className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-semibold", KAT_RENK[oneCikan.kategori])}>{oneCikan.kategori}</span>
              <span className="flex items-center gap-1 text-[12px] text-metin-3"><Clock className="h-3 w-3" /> {oneCikan.sure}</span>
              <span className="text-[12px] text-metin-3">· {oneCikan.tarih}</span>
            </div>
            <h2 className="text-[24px] font-bold leading-tight text-metin">{oneCikan.baslik}</h2>
            <p className="text-[14px] leading-relaxed text-metin-2">{oneCikan.ozet}</p>
            <span className="mt-1 inline-flex items-center gap-1.5 text-[14px] font-semibold text-aksan">
              Oku <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>

      {/* ızgara */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {digerleri.map((y) => (
          <Link key={y.slug} href="#" className="group overflow-hidden rounded-2xl bg-yuzey ring-1 ring-inset ring-white/[0.06]">
            <div className="relative aspect-[16/10] overflow-hidden">
              <span className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${saltUrl(kesfetArka(y.tohum, "sinematik")) || ""})` }} />
            </div>
            <div className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", KAT_RENK[y.kategori])}>{y.kategori}</span>
                <span className="flex items-center gap-1 text-[11.5px] text-metin-3"><Clock className="h-3 w-3" /> {y.sure}</span>
              </div>
              <h3 className="mb-1.5 text-[15.5px] font-bold leading-snug text-metin transition-colors group-hover:text-aksan">{y.baslik}</h3>
              <p className="line-clamp-2 text-[13px] leading-relaxed text-metin-2">{y.ozet}</p>
              <p className="mt-2.5 text-[11.5px] text-metin-3">{y.tarih}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
