"use client";

import { Sparkles, Wrench, Bug, Zap } from "lucide-react";
import { SayfaBaslik } from "@/components/api/parcalar";
import { cn } from "@/lib/utils";

/* Değişiklik Günlüğü — API sürüm notları (Higgsfield/Stripe changelog deseni). */

type Tur = "yeni" | "iyilestirme" | "duzeltme" | "hizlandirma";
const TUR: Record<Tur, { ad: string; ikon: typeof Sparkles; sinif: string }> = {
  yeni: { ad: "Yeni", ikon: Sparkles, sinif: "border-aksan/30 bg-aksan/12 text-aksan" },
  iyilestirme: { ad: "İyileştirme", ikon: Wrench, sinif: "border-sky-400/25 bg-sky-500/12 text-sky-300" },
  duzeltme: { ad: "Düzeltme", ikon: Bug, sinif: "border-amber-400/25 bg-amber-500/12 text-amber-300" },
  hizlandirma: { ad: "Performans", ikon: Zap, sinif: "border-violet-400/25 bg-violet-500/12 text-violet-300" },
};

const KAYITLAR: { tarih: string; surum: string; degisiklikler: { tur: Tur; metin: string }[] }[] = [
  {
    tarih: "26 Temmuz 2026", surum: "v1.4.0",
    degisiklikler: [
      { tur: "yeni", metin: "Canlı API Konsolu — panelden gerçek istek gönderip yanıtı görebilirsin." },
      { tur: "yeni", metin: "Doğrulanabilir anahtar checksum'ı: her anahtar kriptografik olarak imzalanır." },
      { tur: "iyilestirme", metin: "Rate-limit başlıkları (x-ratelimit-*) tüm yanıtlarda döner." },
    ],
  },
  {
    tarih: "12 Temmuz 2026", surum: "v1.3.0",
    degisiklikler: [
      { tur: "yeni", metin: "text2music uç noktası eklendi (metinden müzik)." },
      { tur: "hizlandirma", metin: "Görsel üretim medyan gecikmesi %31 düştü." },
      { tur: "duzeltme", metin: "request_id durum sorgusunda nadir 500 hatası giderildi." },
    ],
  },
  {
    tarih: "28 Haziran 2026", surum: "v1.2.0",
    degisiklikler: [
      { tur: "yeni", metin: "Webhook imza doğrulaması (whsec_) yayında." },
      { tur: "iyilestirme", metin: "Test ortamı anahtarları kredi harcamadan tam akışı çalıştırır." },
    ],
  },
  {
    tarih: "10 Haziran 2026", surum: "v1.0.0",
    degisiklikler: [
      { tur: "yeni", metin: "Vayra API v1 genel kullanıma açıldı: görsel, video, ses, 3D." },
    ],
  },
];

export default function Degisiklikler() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
      <SayfaBaslik baslik="Değişiklik Günlüğü" ozet="API'de yeni uç noktalar, iyileştirmeler ve düzeltmeler." />

      <div className="relative space-y-8 border-l border-white/[0.08] pl-6">
        {KAYITLAR.map((k) => (
          <div key={k.surum} className="relative">
            <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-aksan bg-arkaplan" />
            <div className="mb-2 flex items-baseline gap-2">
              <h2 className="text-lg font-bold text-metin">{k.surum}</h2>
              <span className="text-xs text-metin-3">{k.tarih}</span>
            </div>
            <ul className="space-y-2">
              {k.degisiklikler.map((d, i) => {
                const t = TUR[d.tur];
                return (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className={cn("mt-0.5 inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold", t.sinif)}>
                      <t.ikon className="h-3 w-3" /> {t.ad}
                    </span>
                    <span className="text-sm text-metin-2">{d.metin}</span>
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
