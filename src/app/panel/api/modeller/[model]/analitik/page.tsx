"use client";

import { use, useMemo, useState } from "react";
import { Activity, Zap, Clock, CalendarDays, CheckCircle2 } from "lucide-react";
import { MODELLER } from "@/lib/catalog";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { MetrikKart } from "@/components/api/parcalar";
import { cn } from "@/lib/utils";

/* ============================================================
   MODEL ANALİTİĞİ — Higgsfield "Analytics" birebir.
   Tarih aralığı ön ayarları · Toplam İstek / Hız P90 / Hız P50 ·
   İş Durumları (job stats) · İş Süresi grafiği.
   Tüm sayılar GERÇEK çağrı günlüğünden hesaplanır.
   ============================================================ */

const ARALIKLAR = [
  { id: "24s", ad: "Son 24 saat", ms: 24 * 3600e3 },
  { id: "hafta", ad: "Son hafta", ms: 7 * 24 * 3600e3 },
  { id: "ay", ad: "Son ay", ms: 30 * 24 * 3600e3 },
  { id: "tum", ad: "Tüm zamanlar", ms: Number.POSITIVE_INFINITY },
] as const;

function yuzdelik(sirali: number[], p: number): number {
  if (sirali.length === 0) return 0;
  const i = Math.min(sirali.length - 1, Math.floor((p / 100) * sirali.length));
  return sirali[i];
}

export default function ModelAnalitik({ params }: { params: Promise<{ model: string }> }) {
  const { model: modelId } = use(params);
  const model = MODELLER.find((m) => m.id === modelId)!;
  const cagrilar = useApiAnahtar((s) => s.cagrilar);
  const [aralik, setAralik] = useState<(typeof ARALIKLAR)[number]["id"]>("hafta");

  const secili = ARALIKLAR.find((a) => a.id === aralik)!;

  const veri = useMemo(() => {
    const simdi = Date.now();
    const liste = cagrilar.filter(
      (c) => c.modelId === modelId && simdi - c.zaman <= secili.ms,
    );
    const gecikmeler = liste.filter((c) => c.gecikmeMs > 0).map((c) => c.gecikmeMs).sort((a, b) => a - b);
    const durumSayim: Record<string, number> = {};
    for (const c of liste) durumSayim[c.durum] = (durumSayim[c.durum] ?? 0) + 1;
    const tamam = durumSayim.completed ?? 0;

    // Günlük dağılım (grafik için)
    const gunler: { etiket: string; sayi: number }[] = [];
    const gunSayisi = aralik === "24s" ? 1 : aralik === "hafta" ? 7 : 30;
    for (let i = gunSayisi - 1; i >= 0; i--) {
      const gunBas = new Date(simdi - i * 24 * 3600e3);
      gunBas.setHours(0, 0, 0, 0);
      const gunSon = gunBas.getTime() + 24 * 3600e3;
      gunler.push({
        etiket: gunBas.toLocaleDateString("tr", { day: "2-digit", month: "2-digit" }),
        sayi: liste.filter((c) => c.zaman >= gunBas.getTime() && c.zaman < gunSon).length,
      });
    }

    return {
      toplam: liste.length,
      p90: yuzdelik(gecikmeler, 90) / 1000,
      p50: yuzdelik(gecikmeler, 50) / 1000,
      durumSayim,
      basariOrani: liste.length ? Math.round((tamam / liste.length) * 100) : 0,
      kredi: liste.reduce((a, c) => a + c.kredi, 0),
      gunler,
    };
  }, [cagrilar, modelId, secili.ms, aralik]);

  const enYuksek = Math.max(1, ...veri.gunler.map((g) => g.sayi));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-metin">Analitik</h2>
          <p className="mt-0.5 text-sm text-metin-2">{model.ad} kullanım ve performans metrikleri</p>
        </div>
        <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-yuzey p-1">
          {ARALIKLAR.map((a) => (
            <button
              key={a.id}
              onClick={() => setAralik(a.id)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                aralik === a.id ? "bg-yuzey-3 text-metin" : "text-metin-2 hover:text-metin",
              )}
            >
              {a.ad}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetrikKart
          deger={veri.toplam.toLocaleString("tr")}
          etiket="Toplam İstek"
          ikon={<Activity className="h-4 w-4 text-aksan" />}
          vurgulu
        />
        <MetrikKart
          deger={`${veri.p90.toFixed(1)}sn`}
          etiket="Hız P90"
          ikon={<Zap className="h-4 w-4 text-sky-300" />}
        />
        <MetrikKart
          deger={`${veri.p50.toFixed(1)}sn`}
          etiket="Hız P50"
          ikon={<Clock className="h-4 w-4 text-violet-300" />}
        />
        <MetrikKart
          deger={`%${veri.basariOrani}`}
          etiket="Başarı Oranı"
          alt={`${veri.kredi.toLocaleString("tr")} kredi harcandı`}
          ikon={<CheckCircle2 className="h-4 w-4 text-emerald-300" />}
        />
      </div>

      {/* İş durumları */}
      <div className="rounded-2xl border border-white/[0.06] bg-yuzey p-5">
        <h3 className="mb-4 text-base font-semibold text-metin">İş Durumları</h3>
        {veri.toplam === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-metin-2">Veri yok</p>
            <p className="mt-1 text-xs text-metin-3">Seçilen tarih aralığında etkinlik yok</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(veri.durumSayim).map(([durum, sayi]) => {
              const yuzde = Math.round((sayi / veri.toplam) * 100);
              return (
                <div key={durum}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-mono text-metin-2">{durum}</span>
                    <span className="text-metin-3">{sayi} · %{yuzde}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        durum === "completed" ? "bg-aksan"
                          : durum === "failed" || durum === "nsfw" ? "bg-rose-400"
                          : "bg-sky-400",
                      )}
                      style={{ width: `${yuzde}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Günlük dağılım */}
      <div className="rounded-2xl border border-white/[0.06] bg-yuzey p-5">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-metin-2" />
          <h3 className="text-base font-semibold text-metin">Günlük İstek Dağılımı</h3>
        </div>
        {veri.toplam === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-metin-2">Veri yok</p>
            <p className="mt-1 text-xs text-metin-3">Seçilen tarih aralığında etkinlik yok</p>
          </div>
        ) : (
          <div className="flex h-44 items-end gap-1 overflow-x-auto [scrollbar-width:thin]">
            {veri.gunler.map((g) => (
              <div key={g.etiket} className="flex min-w-[24px] flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full flex-1 items-end">
                  <div
                    title={`${g.etiket}: ${g.sayi} istek`}
                    className="w-full rounded-t bg-aksan/70 transition-all hover:bg-aksan"
                    style={{ height: `${Math.max(2, (g.sayi / enYuksek) * 100)}%` }}
                  />
                </div>
                <span className="whitespace-nowrap text-[9px] text-metin-3">{g.etiket}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
