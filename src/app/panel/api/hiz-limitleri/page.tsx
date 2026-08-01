"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Gauge, KeyRound, Timer, ShieldAlert, Layers } from "lucide-react";
import { toast } from "@/lib/toast";
import { useAuth } from "@/store/useAuth";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { BosDurum, KodBlok, MetrikKart, SayfaBaslik } from "@/components/api/parcalar";
import { cn } from "@/lib/utils";

/* ============================================================
   HIZ LİMİTLERİ — Higgsfield'da YOK, bizim ekstramız.
   Plan bazlı eşzamanlılık tablosu + anahtar bazlı dakikalık istek sınırı
   (GERÇEKTEN kaydedilir: useApiAnahtar.hizLimitAyarla).
   ============================================================ */

const PLAN_LIMIT: Record<string, { rpm: number; esZamanli: number; aylikCagri: string }> = {
  baslangic: { rpm: 20, esZamanli: 2, aylikCagri: "5.000" },
  arti: { rpm: 60, esZamanli: 6, aylikCagri: "50.000" },
  ultra: { rpm: 240, esZamanli: 8, aylikCagri: "500.000" },
  kurumsal: { rpm: 1200, esZamanli: 32, aylikCagri: "Sınırsız" },
};

const BASLIK_KODU = `HTTP/1.1 200 OK
x-vayra-ratelimit-limit: 60
x-vayra-ratelimit-remaining: 57
x-vayra-ratelimit-reset: 1784927220

# 429 alırsan Retry-After başlığındaki saniye kadar bekle
# ve üstel geri çekilme (exponential backoff) uygula.`;

const GERICEKILME = `async function istekAt(gorev, deneme = 0) {
  const yanit = await fetch(gorev.url, gorev.ayar);
  if (yanit.status !== 429) return yanit;

  const bekle = Number(yanit.headers.get("Retry-After") ?? 2 ** deneme);
  await new Promise((r) => setTimeout(r, bekle * 1000));
  if (deneme >= 5) throw new Error("Hız limiti aşıldı");
  return istekAt(gorev, deneme + 1);
}`;

export default function HizLimitleri() {
  const { kullanici } = useAuth();
  const { anahtarlar, cagrilar, hizLimitAyarla } = useApiAnahtar();

  const plan = kullanici?.plan ?? "baslangic";
  const limit = PLAN_LIMIT[plan] ?? PLAN_LIMIT.baslangic;

  // Son dakikadaki gerçek istek sayısı — anlık kullanım oranı.
  const sonDakika = useMemo(() => {
    const esik = Date.now() - 60_000;
    return cagrilar.filter((c) => c.zaman >= esik).length;
  }, [cagrilar]);

  const doluluk = Math.min(100, Math.round((sonDakika / limit.rpm) * 100));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <SayfaBaslik baslik="Hız Limitleri" ozet="Planına göre istek sınırlarını gör ve anahtar bazlı kısıt tanımla" />

      <div className="grid gap-3 lg:grid-cols-4">
        <MetrikKart
          deger={`${limit.rpm}/dk`}
          etiket="Plan İstek Sınırı"
          alt={`${plan} planı`}
          ikon={<Gauge className="h-4 w-4 text-aksan" />}
          vurgulu
        />
        <MetrikKart
          deger={String(limit.esZamanli)}
          etiket="Eşzamanlı Üretim"
          ikon={<Layers className="h-4 w-4 text-violet-300" />}
        />
        <MetrikKart
          deger={limit.aylikCagri}
          etiket="Aylık Çağrı Kotası"
          ikon={<Timer className="h-4 w-4 text-sky-300" />}
        />
        <MetrikKart
          deger={`${sonDakika}`}
          etiket="Son 1 Dakika"
          alt={`%${doluluk} doluluk`}
          ikon={<ShieldAlert className={cn("h-4 w-4", doluluk > 80 ? "text-rose-300" : "text-emerald-300")} />}
        />
      </div>

      {/* Anlık doluluk çubuğu */}
      <div className="mt-5 rounded-2xl border border-white/[0.06] bg-yuzey p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-metin">Anlık Kullanım</span>
          <span className="text-metin-2">{sonDakika} / {limit.rpm} istek</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className={cn("h-full rounded-full transition-all", doluluk > 80 ? "bg-rose-400" : "bg-aksan")}
            style={{ width: `${Math.max(2, doluluk)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-metin-3">
          Limit aşıldığında API <code className="font-mono">429 Too Many Requests</code> döner.
        </p>
      </div>

      {/* Anahtar bazlı limit */}
      <div className="mt-5 rounded-2xl border border-white/[0.06] bg-yuzey p-5">
        <h3 className="text-base font-semibold text-metin">Anahtar Bazlı Sınırlar</h3>
        <p className="mb-4 text-xs text-metin-2">
          Her anahtara ayrı dakikalık istek sınırı ver — örneğin test anahtarını kıs.
        </p>
        {anahtarlar.length === 0 ? (
          <BosDurum
            ikon={<KeyRound className="h-8 w-8" />}
            baslik="Henüz anahtarın yok"
            ozet="Sınır tanımlamak için önce bir API anahtarı oluştur."
            aksiyon={
              <Link
                href="/panel/api/anahtarlar"
                className="hf-btn inline-flex items-center gap-1.5 rounded-xl bg-aksan px-3.5 py-2 text-sm font-bold text-[#12140c]"
              >
                <KeyRound className="h-4 w-4" /> Anahtar Oluştur
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {anahtarlar.map((k) => (
              <div key={k.id} className="rounded-xl border border-white/[0.06] bg-yuzey-2 p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg glass-ikon glass-ikon-lime">
                    <KeyRound className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm font-semibold text-metin">{k.ad}</span>
                  <code className="font-mono text-[11px] text-metin-3">{k.onEk}…</code>
                  <span className="ml-auto text-sm font-semibold text-aksan">{k.hizLimiti}/dk</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={limit.rpm}
                  step={5}
                  value={Math.min(k.hizLimiti, limit.rpm)}
                  onChange={(e) => hizLimitAyarla(k.id, Number(e.target.value))}
                  onMouseUp={() => toast.success("Hız limiti güncellendi", { description: `${k.ad}` })}
                  aria-label={`${k.ad} hız limiti`}
                  className="w-full accent-[var(--color-aksan)]"
                />
                <div className="mt-1 flex justify-between text-[10px] text-metin-3">
                  <span>5/dk</span>
                  <span>plan üst sınırı {limit.rpm}/dk</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan karşılaştırma */}
      <div className="mt-5 overflow-x-auto rounded-2xl border border-white/[0.06] bg-yuzey p-5">
        <h3 className="mb-4 text-base font-semibold text-metin">Plan Karşılaştırma</h3>
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-[0.14em] text-metin-3">
              <th className="py-2.5 font-semibold">Plan</th>
              <th className="py-2.5 font-semibold">İstek / dk</th>
              <th className="py-2.5 font-semibold">Eşzamanlı</th>
              <th className="py-2.5 font-semibold">Aylık Çağrı</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(PLAN_LIMIT).map(([id, v]) => (
              <tr
                key={id}
                className={cn(
                  "border-b border-white/[0.04] last:border-0",
                  id === plan && "bg-aksan/[0.05]",
                )}
              >
                <td className="py-3 capitalize text-metin">
                  {id}
                  {id === plan && (
                    <span className="ml-2 rounded-full border border-aksan/30 bg-aksan/12 px-2 py-0.5 text-[10px] font-semibold text-aksan">
                      mevcut
                    </span>
                  )}
                </td>
                <td className="py-3 text-metin-2">{v.rpm}</td>
                <td className="py-3 text-metin-2">{v.esZamanli}</td>
                <td className="py-3 text-metin-2">{v.aylikCagri}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-wider text-metin-2">Yanıt başlıkları</h3>
          <KodBlok kod={BASLIK_KODU} baslik="HTTP" satirNo={false} />
        </div>
        <div>
          <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-wider text-metin-2">Geri çekilme deseni</h3>
          <KodBlok kod={GERICEKILME} baslik="Node.js · exponential backoff" />
        </div>
      </div>
    </div>
  );
}
