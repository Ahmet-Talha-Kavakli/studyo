"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Search, Play, ListOrdered, BarChart3, Wallet, KeyRound, Coins, Radio, ArrowUpRight,
} from "lucide-react";
import { MODELLER } from "@/lib/catalog";
import { turEtiket, turRozetSinif } from "@/lib/apiPlatform";
import { useAuth } from "@/store/useAuth";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { MetrikKart, SayfaBaslik } from "@/components/api/parcalar";
import { cn } from "@/lib/utils";

/* ============================================================
   GENEL BAKIŞ — Higgsfield Cloud "Account Overview" birebir.
   4 metrik kartı + arama kutulu "AI Modelleri" ızgarası.
   Modeller catalog.ts → MODELLER'den gelir (uydurma liste YOK).
   Her kart: tür rozeti · model adı · 24s etkinlik · çalışma sayısı ·
   alt aksiyonlar (Oyun Alanı / İstekler / Analitik).
   ============================================================ */

const GUN_MS = 24 * 60 * 60 * 1000;

export default function ApiGenelBakis() {
  const { kullanici } = useAuth();
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const cagrilar = useApiAnahtar((s) => s.cagrilar);
  const [arama, setArama] = useState("");

  // Model bazlı gerçek istatistik — çağrı günlüğünden hesaplanır.
  const modelIstatistik = useMemo(() => {
    const simdi = Date.now();
    const harita = new Map<string, { toplam: number; son24: number; tamam: number; hata: number; kredi: number }>();
    for (const c of cagrilar) {
      const mevcut = harita.get(c.modelId) ?? { toplam: 0, son24: 0, tamam: 0, hata: 0, kredi: 0 };
      mevcut.toplam += 1;
      if (simdi - c.zaman < GUN_MS) mevcut.son24 += 1;
      if (c.durum === "completed") mevcut.tamam += 1;
      if (c.durum === "failed" || c.durum === "nsfw") mevcut.hata += 1;
      mevcut.kredi += c.kredi;
      harita.set(c.modelId, mevcut);
    }
    return harita;
  }, [cagrilar]);

  const kullanilanKredi = useMemo(() => cagrilar.reduce((a, c) => a + c.kredi, 0), [cagrilar]);

  const suzulmus = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    if (!q) return MODELLER;
    return MODELLER.filter(
      (m) =>
        m.ad.toLocaleLowerCase("tr").includes(q) ||
        m.saglayici.toLocaleLowerCase("tr").includes(q) ||
        turEtiket(m.tur).toLocaleLowerCase("tr").includes(q),
    );
  }, [arama]);

  const ay = new Date().toLocaleDateString("tr", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <SayfaBaslik baslik="Hesap Özeti" ozet={`${ay} metrikleri ve hesap durumu`} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart
          deger={(kullanici?.krediler ?? 0).toLocaleString("tr")}
          etiket="Kullanılabilir Kredi"
          ikon={<Wallet className="h-4 w-4 text-metin-2" />}
        />
        <MetrikKart
          deger={String(anahtarlar.length)}
          etiket="Aktif API Anahtarı"
          ikon={<KeyRound className="h-4 w-4 text-metin-2" />}
        />
        <MetrikKart
          deger={kullanilanKredi.toLocaleString("tr")}
          etiket="Kullanılan Kredi"
          ikon={<Coins className="h-4 w-4 text-metin-2" />}
        />
        <MetrikKart
          deger={cagrilar.length.toLocaleString("tr")}
          etiket="API Çağrısı"
          ikon={<Radio className="h-4 w-4 text-metin-2" />}
        />
      </div>

      {/* Anahtar yoksa yönlendirme şeridi */}
      {anahtarlar.length === 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-aksan/25 bg-aksan/[0.06] px-4 py-3.5">
          <div>
            <p className="text-sm font-semibold text-metin">Henüz API anahtarın yok</p>
            <p className="text-xs text-metin-2">Vayra API&apos;sini kullanmaya başlamak için bir anahtar oluştur.</p>
          </div>
          <Link
            href="/panel/api/anahtarlar"
            className="hf-btn flex items-center gap-1.5 rounded-xl bg-aksan px-3.5 py-2 text-sm font-bold text-white"
          >
            <KeyRound className="h-4 w-4" /> Anahtar Oluştur
          </Link>
        </div>
      )}

      {/* AI Modelleri */}
      <div className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-metin">AI Modelleri</h2>
            <p className="mt-0.5 text-sm text-metin-2">
              {MODELLER.length} modeli gerçek zamanlı kullanım analitiğiyle keşfet
            </p>
          </div>
          <label className="glass-cip flex h-10 w-full max-w-xs items-center gap-2 rounded-xl px-3 sm:w-72">
            <Search className="h-4 w-4 shrink-0 text-metin-3" />
            <input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Model ara…"
              aria-label="Model ara"
              className="w-full bg-transparent text-sm text-metin outline-none placeholder:text-metin-3"
            />
          </label>
        </div>

        {suzulmus.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.08] py-14 text-center text-sm text-metin-3">
            &ldquo;{arama}&rdquo; ile eşleşen model yok.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {suzulmus.map((m) => {
              const ist = modelIstatistik.get(m.id);
              const etkin = (ist?.son24 ?? 0) > 0;
              return (
                <div
                  key={m.id}
                  data-model-kart={m.id}
                  className="flex flex-col rounded-2xl border border-white/[0.06] bg-yuzey p-4 transition-colors hover:border-white/[0.14]"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded border px-1.5 py-0.5 text-[10px] font-semibold",
                        turRozetSinif(m.tur),
                      )}
                    >
                      {turEtiket(m.tur)}
                    </span>
                    <span className="truncate text-sm font-semibold text-metin">{m.ad}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-metin-3">
                    <span className={cn("h-1.5 w-1.5 rounded-full", etkin ? "bg-aksan" : "bg-white/25")} />
                    {etkin ? `Son 24 saatte ${ist!.son24} çağrı` : "Son 24 saatte etkin değil"}
                  </div>

                  <div className="my-4 flex flex-1 flex-col items-center justify-center gap-1 py-4 text-center">
                    {ist ? (
                      <>
                        <div className="text-2xl font-bold text-metin">{ist.toplam}</div>
                        <div className="text-[11px] text-metin-3">
                          {ist.tamam} tamamlandı · {ist.hata} başarısız
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-metin-3">Son 24 saatte etkinlik yok</p>
                    )}
                  </div>

                  <div className="mb-3 flex items-center justify-between text-[11px] text-metin-3">
                    <span>{m.saglayici} · {m.kredi} kredi</span>
                    <span className="underline decoration-dotted">{ist?.toplam ?? 0} çalışma</span>
                  </div>

                  <div className="flex items-center gap-1 border-t border-white/[0.06] pt-2.5 text-[11px]">
                    <Link
                      href={`/panel/api/modeller/${m.id}/oyun-alani`}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-aksan"
                    >
                      <Play className="h-3 w-3" /> Oyun Alanı
                    </Link>
                    <Link
                      href={`/panel/api/modeller/${m.id}/istekler`}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-aksan"
                    >
                      <ListOrdered className="h-3 w-3" /> İstekler
                    </Link>
                    <Link
                      href={`/panel/api/modeller/${m.id}/analitik`}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-aksan"
                    >
                      <BarChart3 className="h-3 w-3" /> Analitik
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hızlı bağlantılar */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { ad: "API Konsolu", ozet: "Anahtarınla gerçek istek gönder, canlı yanıt gör", href: "/panel/api/konsol" },
          { ad: "Dokümantasyon", ozet: "Uç noktalar, SDK örnekleri, kimlik doğrulama", href: "/panel/api/dokuman" },
          { ad: "Örnek Galerisi", ozet: "Kopyala-çalıştır kod tarifleri", href: "/panel/api/ornekler" },
        ].map((k) => (
          <Link
            key={k.href}
            href={k.href}
            className="group rounded-2xl border border-white/[0.06] bg-yuzey p-4 transition-colors hover:border-white/[0.14]"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-metin">{k.ad}</span>
              <ArrowUpRight className="h-4 w-4 text-metin-3 transition-colors group-hover:text-aksan" />
            </div>
            <p className="mt-1 text-xs text-metin-2">{k.ozet}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
