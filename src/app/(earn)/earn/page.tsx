"use client";

import { useMemo } from "react";
import Link from "next/link";
import * as Ikonlar from "lucide-react";
import { Wallet, ArrowRight, TrendingUp, Gift, Clock, Award } from "lucide-react";
import { useEarn, bakiye, bekleyen, toplamKazanc, tierBul, sonrakiTier, tl, MIN_CEKIM } from "@/store/useEarn";
import { KAZANC_YOLLARI } from "@/lib/earn/katalog";
import { cn, GlassIkon, Kart } from "@/components/earn/UI";
import { AlanGrafik } from "@/components/earn/Grafik";

export default function EarnDashboard() {
  const s = useEarn();
  const bak = bakiye(s.hareketler, s.cekimler);
  const bek = bekleyen(s.hareketler);
  const toplam = toplamKazanc(s.hareketler);
  const tier = tierBul(s.xp);
  const sonraki = sonrakiTier(s.xp);
  const oran = sonraki ? (s.xp - tier.minXp) / (sonraki.minXp - tier.minXp) : 1;

  const egri = useMemo(() => {
    const gun = 86400000, simdi = Date.now();
    return Array.from({ length: 7 }, (_, i) => {
      const bas = simdi - (6 - i) * gun;
      return s.hareketler.filter((h) => h.kredi > 0 && h.tarih >= bas && h.tarih < bas + gun).reduce((a, h) => a + h.kredi, 0);
    });
  }, [s.hareketler]);
  const buHafta = egri.reduce((a, b) => a + b, 0);

  // onboarding adımları — gerçek duruma bağlı
  const adimlar = [
    { ad: "Sosyal hesabını bağla", tamam: s.bagliHesaplar.some((h) => h.dogrulandi), yol: "/earn/hesaplar", ikonAd: Ikonlar.Link2 },
    { ad: "İlk kazancını gönder", tamam: s.paylasimlar.length > 0 || s.gorevBasvurular.length > 0 || s.referanslar.length > 0, yol: "/earn/yollar", ikonAd: Ikonlar.Send },
    { ad: "Bakiyeni çek", tamam: s.cekimler.length > 0, yol: "/earn/cuzdan", ikonAd: Wallet },
  ];
  const onboardGoster = !s.onboardTamam && !adimlar.every((a) => a.tamam);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <h1 className="text-[26px] font-bold text-white">Merhaba</h1>
      <p className="mt-1 mb-6 text-white/50">Ürettiklerinle kazanmaya devam et.</p>

      {/* onboarding — 3 adımda kazanmaya başla */}
      {onboardGoster && (
        <Kart className="mb-6 !border-sky-400/20">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-white">3 adımda kazanmaya başla</h2>
            <button onClick={() => s.onboardBitir()} className="text-xs text-white/40 hover:text-white/70">Kapat</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {adimlar.map((a, i) => (
              <Link key={i} href={a.yol} className={cn("group flex items-center gap-3 rounded-2xl border p-3.5 transition-colors", a.tamam ? "border-sky-400/30 bg-sky-500/[0.06]" : "border-white/[0.06] bg-white/[0.02] hover:border-sky-400/25")}>
                <GlassIkon boyut={40} aktif={a.tamam}>{a.tamam ? <Ikonlar.Check className="h-4.5 w-4.5" /> : <a.ikonAd className="h-4.5 w-4.5" />}</GlassIkon>
                <div>
                  <div className="text-[11px] text-white/40">Adım {i + 1}</div>
                  <div className={cn("text-sm font-semibold", a.tamam ? "text-sky-300" : "text-white")}>{a.ad}</div>
                </div>
              </Link>
            ))}
          </div>
        </Kart>
      )}

      {/* HERO — büyük kazanç kartı (gri, aksan sadece rakam) */}
      <Kart className="!p-6 md:!p-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-white/50"><GlassIkon boyut={30} aktif><Wallet className="h-4 w-4" /></GlassIkon> Çekilebilir bakiyen</div>
            <div className="mt-3 text-[44px] font-black leading-none text-white md:text-[56px]">{tl(bak)}</div>
            <div className="mt-2 text-sm text-white/45">{bak.toLocaleString("tr-TR")} kredi · 1 kredi = 0,01 ₺</div>
          </div>
          {bak >= MIN_CEKIM ? (
            <Link href="/earn/cuzdan" className="flex items-center gap-2 rounded-2xl bg-sky-400 px-5 py-3 text-[15px] font-bold text-[#04141a] transition-colors hover:bg-sky-300">
              Para Çek <ArrowRight className="h-4.5 w-4.5" />
            </Link>
          ) : (
            <Link href="/earn/yollar" className="flex items-center gap-2 rounded-2xl border border-sky-400/30 bg-sky-500/10 px-5 py-3 text-[15px] font-bold text-sky-300 transition-colors hover:bg-sky-500/20">
              Kazanmaya Başla <ArrowRight className="h-4.5 w-4.5" />
            </Link>
          )}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-4">
          <div className="text-center"><div className="text-lg font-bold text-white">{tl(bek)}</div><div className="text-[11px] text-white/45">yolda</div></div>
          <div className="text-center"><div className="text-lg font-bold text-sky-300">+{tl(buHafta)}</div><div className="text-[11px] text-white/45">bu hafta</div></div>
          <div className="text-center"><div className="text-lg font-bold text-white">{tl(toplam)}</div><div className="text-[11px] text-white/45">toplam</div></div>
        </div>
      </Kart>

      {/* seviye kartı */}
      <Kart className="mt-6">
        <div className="flex items-center gap-3">
          <GlassIkon boyut={52} aktif><Award className="h-6 w-6" /></GlassIkon>
          <div>
            <div className="text-lg font-bold text-white">{tier.ad} seviyesindesin</div>
            <div className="text-sm text-white/50">Kazançların <span className="font-semibold text-sky-300">×{tier.carpan}</span> katına çıkıyor</div>
          </div>
        </div>
        {sonraki && (
          <div className="mt-4">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-300 transition-all" style={{ width: `${Math.min(100, oran * 100)}%` }} />
            </div>
            <p className="mt-2 text-sm text-white/55">Sonraki seviye <b className="text-white">{sonraki.ad}</b> — biraz daha üret, çekim limitin <b className="text-sky-300">{tl(sonraki.cekimLimiti)}</b>'ye çıksın.</p>
          </div>
        )}
      </Kart>

      {/* nasıl kazanırım */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-white">Nasıl kazanırım?</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {KAZANC_YOLLARI.map((y) => {
            const Ikon = (Ikonlar as unknown as Record<string, React.ComponentType<{ className?: string }>>)[y.ikon] ?? Gift;
            const ozet =
              y.id === "sosyal" ? (s.paylasimlar.length ? `${s.paylasimlar.length} paylaşım` : null)
              : y.id === "referans" ? (s.referanslar.length ? `${s.referanslar.length} davet` : null)
              : y.id === "bounty" ? (s.gorevBasvurular.length ? `${s.gorevBasvurular.length} görev` : null)
              : y.id === "marketplace" ? (s.presetler.length ? `${s.presetler.length} preset` : null)
              : y.id === "yarisma" ? (s.yarismaKatilimlar.length ? `${s.yarismaKatilimlar.length} katılım` : null)
              : null;
            return (
              <Link key={y.id} href={y.yol} className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#14151799] p-4 backdrop-blur-xl transition-colors hover:border-sky-400/25">
                <GlassIkon boyut={52}><Ikon className="h-5.5 w-5.5" /></GlassIkon>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{y.ad}</span>
                    {ozet && <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-300">{ozet}</span>}
                  </div>
                  <div className="truncate text-sm text-white/45">{y.ozet}</div>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-white/25 transition-all group-hover:translate-x-1 group-hover:text-sky-400" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* haftalık kazanç */}
      <Kart className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold text-white"><GlassIkon boyut={30}><TrendingUp className="h-4 w-4" /></GlassIkon> Son 7 günün</h2>
          <span className="text-sm font-bold text-sky-300">+{tl(buHafta)}</span>
        </div>
        <AlanGrafik veri={egri} />
        <div className="mt-2 flex justify-between text-[11px] text-white/30">
          {["6g önce", "", "", "", "", "dün", "bugün"].map((g, i) => <span key={i}>{g}</span>)}
        </div>
      </Kart>

      {/* son kazançlar */}
      {s.hareketler.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-white"><GlassIkon boyut={30}><Gift className="h-4 w-4" /></GlassIkon> Son kazançların</h2>
            <Link href="/earn/basvurular" className="text-sm font-semibold text-sky-400 hover:text-sky-300">Tümü →</Link>
          </div>
          <div className="space-y-2">
            {s.hareketler.slice(0, 4).map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-2xl border border-white/[0.05] bg-[#14151799] backdrop-blur-xl px-4 py-3.5">
                <div className="min-w-0">
                  <div className="truncate font-medium text-white">{h.baslik}</div>
                  <div className="text-xs text-white/40">{new Date(h.tarih).toLocaleDateString("tr", { day: "numeric", month: "long" })}</div>
                </div>
                <span className={cn("shrink-0 text-lg font-bold", h.kredi > 0 ? "text-sky-300" : "text-white/40")}>{h.kredi > 0 ? "+" : ""}{tl(h.kredi)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
