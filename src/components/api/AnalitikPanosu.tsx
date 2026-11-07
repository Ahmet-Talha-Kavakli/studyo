"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, BarChart3, CheckCircle2, ChevronRight, Download, KeyRound, Table2 } from "lucide-react";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { MODELLER } from "@/lib/catalog";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { CubukGrafik, SiraCubuklari } from "./grafik";
import { SecimSerit, ikincil, sureMetin } from "./ui";
import { csvIndir, gunlukIstek, gunlukKredi, modelKirilimi, ozet } from "./veri";
import { cn } from "@/lib/utils";

const ARALIKLAR = [{ id: 7, ad: "7 gün" }, { id: 30, ad: "30 gün" }, { id: 90, ad: "90 gün" }];
const ORTAMLAR = [{ id: "tumu" as const, ad: "Tümü" }, { id: "live" as const, ad: "Canlı" }, { id: "test" as const, ad: "Test" }];
const kart = "rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08]";
const HATA_AD: Record<string, string> = {
  content_policy: "İçerik politikası", rate_limited: "Hız sınırı", insufficient_credits: "Yetersiz kredi", invalid_input: "Geçersiz girdi",
  provider_error: "Sağlayıcı hatası", internal_error: "Sunucu hatası", timeout: "Zaman aşımı", unknown: "Bilinmeyen",
};
const logoAd = (id: string) => { const m = MODELLER.find((x) => x.id === id); return m ? `${m.ad} ${m.saglayici} ${m.id}` : id; };

function KartBaslik({ baslik, aciklama, sag }: { baslik: string; aciklama?: string; sag?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5">
      <div><h3 className="text-[15px] font-semibold text-white">{baslik}</h3>{aciklama && <p className="mt-0.5 text-[12.5px] text-white/55">{aciklama}</p>}</div>
      {sag}
    </div>
  );
}

export function AnalitikPanosu({ model }: { model?: string }) {
  const tum = useApiAnahtar((s) => s.uretimler);
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const [gun, setGun] = useState<number>(30);
  const [ortam, setOrtam] = useState<"tumu" | "live" | "test">("tumu");
  const [tablo, setTablo] = useState(false);

  const liste = useMemo(() => {
    const esik = Date.now() - gun * 86400_000;
    return tum.filter((u) => (!model || u.model === model) && (ortam === "tumu" || u.environment === ortam) && Date.parse(u.created_at) >= esik);
  }, [tum, model, gun, ortam]);
  const o = ozet(liste);
  const istekG = useMemo(() => gunlukIstek(liste, gun), [liste, gun]);
  const krediG = useMemo(() => gunlukKredi(liste, gun), [liste, gun]);
  const hatalar = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of liste) if (u.status === "failed") m.set(u.error?.code ?? "unknown", (m.get(u.error?.code ?? "unknown") ?? 0) + 1);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([ad, deger]) => ({ ad, deger }));
  }, [liste]);
  const anahtarK = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of liste) m.set(u.anahtarId, (m.get(u.anahtarId) ?? 0) + 1);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([id, deger]) => ({ ad: anahtarlar.find((a) => a.id === id)?.ad ?? "Silinmiş anahtar", deger }));
  }, [liste, anahtarlar]);

  const disaAktar = () => csvIndir(`vayra-kullanim-${gun}g-${new Date().toISOString().slice(0, 10)}.csv`, [
    ["tarih", "istek", "basarili", "basarisiz", "kredi"],
    ...istekG.map((g, i) => [new Date(Number(g.anahtar)).toISOString().slice(0, 10), g.parcalar[0].deger + g.parcalar[1].deger, g.parcalar[0].deger, g.parcalar[1].deger, krediG[i].parcalar[0].deger]),
  ]);

  const kpi: { e: string; d: string; a: string; r?: string }[] = [
    { e: "İstek", d: o.toplam.toLocaleString("tr-TR"), a: `${o.basarili} başarılı · ${o.basarisiz} başarısız` },
    { e: "Başarı oranı", d: o.oran === null ? "Veri yok" : `yüzde ${(o.oran * 100).toFixed(1).replace(".", ",").replace(",0", "")}`, a: "Biten istekler içinde", r: o.oran === null ? undefined : o.oran >= 0.99 ? "text-emerald-300" : o.oran >= 0.9 ? "text-amber-200" : "text-rose-300" },
    { e: "Çalışma süresi", d: o.p50 === null ? "Veri yok" : sureMetin(o.p50), a: `p50 · p95 ${sureMetin(o.p95)}` },
    { e: "Harcanan kredi", d: o.kredi.toLocaleString("tr-TR"), a: "Yalnız canlı ve tamamlanan" },
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <SecimSerit id={`an-gun${model ?? ""}`} secenek={ARALIKLAR} deger={gun} onDegis={setGun} />
        <SecimSerit id={`an-ortam${model ?? ""}`} secenek={ORTAMLAR} deger={ortam} onDegis={setOrtam} />
        <div className="ml-auto flex gap-2">
          <button onClick={() => setTablo((v) => !v)} aria-pressed={tablo} className={ikincil}>{tablo ? <BarChart3 className="h-4 w-4" /> : <Table2 className="h-4 w-4" />}{tablo ? "Grafik" : "Tablo"}</button>
          <button onClick={disaAktar} className={ikincil}><Download className="h-4 w-4" />CSV</button>
        </div>
      </div>

      <dl className={cn(kart, "mb-5 grid grid-cols-2 gap-px overflow-hidden bg-white/[0.06] lg:grid-cols-4")}>
        {kpi.map((k, i) => (
          <motion.div key={k.e} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-[#0d0e10] px-5 py-4">
            <dt className="text-[12.5px] text-white/60">{k.e}</dt>
            <dd className={cn("mt-1 whitespace-nowrap text-[26px] font-semibold tabular-nums tracking-[-0.03em]", k.d === "Veri yok" ? "text-white/35" : k.r ?? "text-white")}>{k.d}</dd>
            <p className="truncate text-[12.5px] text-white/50">{k.a}</p>
          </motion.div>
        ))}
      </dl>

      {tablo ? (
        <section className={cn(kart, "mb-5 overflow-hidden")}>
          <KartBaslik baslik="Günlük döküm" aciklama={`Son ${gun} gün, yeniden eskiye`} />
          <div className="mt-4 max-h-[420px] overflow-auto border-t border-white/[0.06]">
            <table className="w-full text-left text-[13px]">
              <thead className="sticky top-0 bg-[#111214]"><tr className="border-b border-white/[0.06] text-[12px] text-white/55"><th className="px-5 py-2.5 font-medium">Gün</th><th className="px-3 py-2.5 text-right font-medium">Başarılı</th><th className="px-3 py-2.5 text-right font-medium">Başarısız</th><th className="px-5 py-2.5 text-right font-medium">Kredi</th></tr></thead>
              <tbody className="divide-y divide-white/[0.05]">
                {[...istekG].reverse().map((g, i) => (
                  <tr key={g.anahtar} className="transition-colors hover:bg-white/[0.02]"><td className="px-5 py-2.5 text-white/70">{g.uzunEtiket}</td><td className="px-3 py-2.5 text-right tabular-nums text-white">{g.parcalar[0].deger}</td><td className={cn("px-3 py-2.5 text-right tabular-nums", g.parcalar[1].deger ? "text-rose-300" : "text-white/40")}>{g.parcalar[1].deger}</td><td className="px-5 py-2.5 text-right tabular-nums text-white">{krediG[krediG.length - 1 - i].parcalar[0].deger}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="mb-5 grid gap-5 xl:grid-cols-2">
          <section className={kart}><KartBaslik baslik="İstekler" aciklama="Günlük, duruma göre" /><div className="p-5 pt-4"><CubukGrafik veri={istekG} birim="istek" /></div></section>
          <section className={kart}><KartBaslik baslik="Kredi" aciklama="Günlük canlı harcama" /><div className="p-5 pt-4"><CubukGrafik veri={krediG} birim="kredi" bosMetin="Bu aralıkta canlı harcama yok" /></div></section>
        </div>
      )}

      <div className={cn("grid gap-5", model ? "lg:grid-cols-2" : "lg:grid-cols-3")}>
        {!model && (
          <section className={kart}>
            <KartBaslik baslik="Modele göre kredi" />
            <div className="p-5 pt-4">
              <SiraCubuklari birim="kredi" bos="Bu aralıkta canlı harcama yok" satirlar={modelKirilimi(liste, "kredi").slice(0, 8).map((x) => ({ ad: x.ad, deger: x.deger, onEk: <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/[0.08]"><ModelLogo ad={logoAd(x.id)} boyut={14} /></span> }))} />
            </div>
          </section>
        )}
        <section className={kart}>
          <KartBaslik baslik="Anahtara göre istek" />
          <div className="p-5 pt-4">
            <SiraCubuklari birim="istek" renk="#a78bfa" satirlar={anahtarK.slice(0, 8).map((x) => ({ ...x, onEk: <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/[0.08]"><KeyRound className="h-3.5 w-3.5 text-white/70" /></span> }))} />
          </div>
        </section>
        <section className={kart}>
          <KartBaslik baslik="Hatalar" sag={hatalar.length > 0 && <span className="rounded-full bg-rose-400/12 px-2.5 py-0.5 text-[12px] font-medium tabular-nums text-rose-300">{hatalar.reduce((t, h) => t + h.deger, 0)} hata</span>} />
          <div className="p-5 pt-3">
            {hatalar.length ? (
              <ul className="-mx-2">
                {hatalar.map((h) => (
                  <li key={h.ad}>
                    <Link href={`/panel/api/hatalar#${h.ad}`} className="group flex items-center gap-3 rounded-[14px] px-2 py-2 transition hover:bg-white/[0.04]">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-400/10 text-rose-300"><AlertTriangle className="h-3.5 w-3.5" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] text-white">{HATA_AD[h.ad] ?? h.ad}</span><span className="block truncate font-mono text-[11.5px] text-white/50">{h.ad}</span></span>
                      <span className="text-[14px] font-semibold tabular-nums text-white">{h.deger}</span>
                      <ChevronRight className="h-4 w-4 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-3 rounded-[18px] bg-emerald-400/[0.06] px-3.5 py-3 ring-1 ring-emerald-400/15">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/15"><CheckCircle2 className="h-4 w-4 text-emerald-300" /></span>
                <div><p className="text-[13.5px] font-medium text-white">Temiz</p><p className="text-[12.5px] text-white/60">Bu aralıkta başarısız istek yok.</p></div>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
