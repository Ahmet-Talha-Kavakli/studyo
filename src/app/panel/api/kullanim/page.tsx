"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3, DollarSign, TrendingUp, Flame, CalendarDays, Activity, KeyRound, ChevronDown,
} from "lucide-react";
import { MODELLER } from "@/lib/catalog";
import { turEtiket } from "@/lib/apiPlatform";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { useProjeler } from "@/store/useProjeler";
import { BosDurum, MetrikKart, SayfaBaslik } from "@/components/api/parcalar";
import { cn } from "@/lib/utils";

/* ============================================================
   KULLANIM — Higgsfield "Usage" birebir.
   Filtreler (anahtar + dönem) · 5 metrik · günlük grafik · model tablosu.

   GERÇEK VERİ: hem API çağrı günlüğünden (useApiAnahtar.cagrilar) hem de
   ürünün gerçek üretim geçmişinden (useProjeler.uretimler) beslenir —
   böylece kullanıcı stüdyolarda ürettiyse burası boş kalmaz.
   ============================================================ */

const DONEMLER = [
  { id: "buay", ad: "Bu Ay" },
  { id: "son30", ad: "Son 30 Gün" },
  { id: "son7", ad: "Son 7 Gün" },
  { id: "tum", ad: "Tüm Zamanlar" },
] as const;

/** 1 kredi ≈ ₺0,09 (kredi paketi ortalaması) — harcama tahmini. */
const KREDI_TL = 0.09;

export default function Kullanim() {
  const cagrilar = useApiAnahtar((s) => s.cagrilar);
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const uretimler = useProjeler((s) => s.uretimler);
  const [donem, setDonem] = useState<(typeof DONEMLER)[number]["id"]>("buay");
  const [anahtarFiltre, setAnahtarFiltre] = useState<string>("tum");
  const [donemAcik, setDonemAcik] = useState(false);
  const [anahtarAcik, setAnahtarAcik] = useState(false);

  const baslangic = useMemo(() => {
    const simdi = new Date();
    if (donem === "buay") return new Date(simdi.getFullYear(), simdi.getMonth(), 1).getTime();
    if (donem === "son30") return Date.now() - 30 * 24 * 3600e3;
    if (donem === "son7") return Date.now() - 7 * 24 * 3600e3;
    return 0;
  }, [donem]);

  /** Birleşik olay listesi: API çağrıları + stüdyo üretimleri (kaynak etiketli). */
  const olaylar = useMemo(() => {
    const apiOlay = cagrilar
      .filter((c) => c.zaman >= baslangic && (anahtarFiltre === "tum" || c.anahtarId === anahtarFiltre))
      .map((c) => ({ zaman: c.zaman, modelId: c.modelId, kredi: c.kredi, kaynak: "api" as const }));

    // Anahtar filtresi seçiliyken stüdyo üretimlerini karıştırma (onlar anahtarsız).
    if (anahtarFiltre !== "tum") return apiOlay;

    const studyoOlay = uretimler
      .filter((u) => u.olusturma >= baslangic && u.durum === "tamam")
      .map((u) => ({ zaman: u.olusturma, modelId: u.model, kredi: u.kredi, kaynak: "studyo" as const }));

    return [...apiOlay, ...studyoOlay].sort((a, b) => b.zaman - a.zaman);
  }, [cagrilar, uretimler, baslangic, anahtarFiltre]);

  const ozet = useMemo(() => {
    const gunlukHarita = new Map<string, number>();
    const modelHarita = new Map<string, { sayi: number; kredi: number }>();
    for (const o of olaylar) {
      const g = new Date(o.zaman).toLocaleDateString("tr", { day: "2-digit", month: "2-digit" });
      gunlukHarita.set(g, (gunlukHarita.get(g) ?? 0) + 1);
      const m = modelHarita.get(o.modelId) ?? { sayi: 0, kredi: 0 };
      m.sayi += 1;
      m.kredi += o.kredi;
      modelHarita.set(o.modelId, m);
    }
    const toplamKredi = olaylar.reduce((a, o) => a + o.kredi, 0);
    const gunler = [...gunlukHarita.entries()].map(([etiket, sayi]) => ({ etiket, sayi }));
    const zirve = gunler.reduce((en, g) => (g.sayi > en.sayi ? g : en), { etiket: "—", sayi: 0 });
    const aktifGun = gunler.length;
    return {
      toplamCagri: olaylar.length,
      toplamKredi,
      harcama: toplamKredi * KREDI_TL,
      gunlukOrt: aktifGun ? toplamKredi / aktifGun : 0,
      zirve,
      aktifGun,
      gunler: gunler.reverse(),
      modeller: [...modelHarita.entries()]
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => b.kredi - a.kredi),
    };
  }, [olaylar]);

  const enYuksek = Math.max(1, ...ozet.gunler.map((g) => g.sayi));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <SayfaBaslik
        baslik="Kullanım"
        ozet="API kullanımını ve harcamanı izle"
        sag={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-metin-3 max-sm:hidden">Saatlik güncellenir</span>

            {/* Anahtar filtresi */}
            <div className="relative">
              <button
                onClick={() => { setAnahtarAcik((v) => !v); setDonemAcik(false); }}
                className="glass-cip flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-metin"
              >
                <KeyRound className="h-4 w-4 text-metin-2" />
                {anahtarFiltre === "tum"
                  ? "Tüm API Anahtarları"
                  : anahtarlar.find((k) => k.id === anahtarFiltre)?.ad ?? "Anahtar"}
                <ChevronDown className="h-4 w-4 text-metin-3" />
              </button>
              {anahtarAcik && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAnahtarAcik(false)} />
                  <div className="menu-surface absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl p-1.5">
                    <button
                      onClick={() => { setAnahtarFiltre("tum"); setAnahtarAcik(false); }}
                      className="w-full rounded-xl px-3 py-2 text-left text-sm text-metin hover:bg-white/[0.06]"
                    >
                      Tüm API Anahtarları
                    </button>
                    {anahtarlar.map((k) => (
                      <button
                        key={k.id}
                        onClick={() => { setAnahtarFiltre(k.id); setAnahtarAcik(false); }}
                        className="w-full truncate rounded-xl px-3 py-2 text-left text-sm text-metin hover:bg-white/[0.06]"
                      >
                        {k.ad}
                      </button>
                    ))}
                    {anahtarlar.length === 0 && (
                      <p className="px-3 py-2 text-xs text-metin-3">Henüz anahtar yok</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Dönem filtresi */}
            <div className="relative">
              <button
                data-donem
                onClick={() => { setDonemAcik((v) => !v); setAnahtarAcik(false); }}
                className="glass-cip flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-metin"
              >
                <CalendarDays className="h-4 w-4 text-metin-2" />
                {DONEMLER.find((d) => d.id === donem)!.ad}
                <ChevronDown className="h-4 w-4 text-metin-3" />
              </button>
              {donemAcik && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDonemAcik(false)} />
                  <div className="menu-surface absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl p-1.5">
                    {DONEMLER.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => { setDonem(d.id); setDonemAcik(false); }}
                        className={cn(
                          "w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-white/[0.06]",
                          donem === d.id ? "text-aksan" : "text-metin",
                        )}
                      >
                        {d.ad}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetrikKart
          deger={ozet.toplamCagri.toLocaleString("tr")}
          etiket="Toplam Çağrı"
          ikon={<BarChart3 className="h-4 w-4 text-sky-300" />}
        />
        <MetrikKart
          deger={`₺${ozet.harcama.toFixed(2)}`}
          etiket="Toplam Harcama"
          alt={`${ozet.toplamKredi.toLocaleString("tr")} kredi`}
          ikon={<DollarSign className="h-4 w-4 text-emerald-300" />}
        />
        <MetrikKart
          deger={`₺${(ozet.gunlukOrt * KREDI_TL).toFixed(2)}`}
          etiket="Günlük Ortalama"
          ikon={<TrendingUp className="h-4 w-4 text-violet-300" />}
        />
        <MetrikKart
          deger={String(ozet.zirve.sayi)}
          etiket="Zirve Gün"
          alt={ozet.zirve.etiket}
          ikon={<Flame className="h-4 w-4 text-amber-300" />}
        />
        <MetrikKart
          deger={String(ozet.aktifGun)}
          etiket="Aktif Gün"
          ikon={<CalendarDays className="h-4 w-4 text-rose-300" />}
        />
      </div>

      {/* Günlük grafik */}
      <div className="mt-5 rounded-2xl border border-white/[0.06] bg-yuzey p-5">
        <h3 className="text-base font-semibold text-metin">Kullanım Analitiği</h3>
        <p className="mb-5 text-xs text-metin-2">Günlük API çağrıları</p>
        {ozet.gunler.length === 0 ? (
          <BosDurum ikon={<Activity className="h-8 w-8" />} baslik="Kullanım verisi yok" ozet="Seçilen dönemde çağrı bulunamadı." />
        ) : (
          <div className="flex h-52 items-end gap-1.5 overflow-x-auto [scrollbar-width:thin]">
            {ozet.gunler.map((g) => (
              <div key={g.etiket} className="flex min-w-[30px] flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    title={`${g.etiket}: ${g.sayi} çağrı`}
                    className="w-full rounded-t bg-aksan/70 transition-all hover:bg-aksan"
                    style={{ height: `${Math.max(3, (g.sayi / enYuksek) * 100)}%` }}
                  />
                </div>
                <span className="whitespace-nowrap text-[10px] text-metin-3">{g.etiket}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Model bazlı tablo */}
      <div className="mt-5 rounded-2xl border border-white/[0.06] bg-yuzey p-5">
        <h3 className="text-base font-semibold text-metin">Modele Göre Kullanım</h3>
        <p className="mb-4 text-xs text-metin-2">Tüm tarihlerdeki model bazlı toplam kullanım</p>
        {ozet.modeller.length === 0 ? (
          <BosDurum
            ikon={<Activity className="h-8 w-8" />}
            baslik="Kullanım Verisi Yok"
            ozet="Seçilen tarih aralığında API kullanımı bulunamadı."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-[0.14em] text-metin-3">
                  <th className="py-2.5 font-semibold">Model</th>
                  <th className="py-2.5 font-semibold">Tür</th>
                  <th className="py-2.5 font-semibold">Çağrı</th>
                  <th className="py-2.5 font-semibold">Kredi</th>
                  <th className="py-2.5 font-semibold">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {ozet.modeller.map((m) => {
                  const katalog = MODELLER.find((x) => x.id === m.id);
                  return (
                    <tr key={m.id} className="border-b border-white/[0.04] last:border-0">
                      <td className="py-3">
                        {katalog ? (
                          <Link
                            href={`/panel/api/modeller/${m.id}/analitik`}
                            className="font-medium text-metin transition-colors hover:text-aksan"
                          >
                            {katalog.ad}
                          </Link>
                        ) : (
                          <span className="text-metin-2">{m.id}</span>
                        )}
                      </td>
                      <td className="py-3 text-metin-3">{katalog ? turEtiket(katalog.tur) : "—"}</td>
                      <td className="py-3 text-metin-2">{m.sayi}</td>
                      <td className="py-3 text-metin-2">{m.kredi.toLocaleString("tr")}</td>
                      <td className="py-3 text-metin-2">₺{(m.kredi * KREDI_TL).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
