"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Users, Wallet, ListChecks, TrendingUp, TrendingDown, Percent, CreditCard,
  Globe, Boxes, Activity, Gauge, ArrowUpRight, Flame, Layers, Server,
} from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { MetrikKart, BolumBaslik, Kart, AD, AdIkon, Rozet } from "@/components/admin/ui/temel";
import { AlanGrafik, DonutGrafik, YatayCubuk, IlerlemeHalka } from "@/components/admin/grafik";
import { Heatmap } from "@/components/admin/grafik/Heatmap";
import { Funnel } from "@/components/admin/grafik/Funnel";
import { LiveOps } from "@/components/admin/pano/LiveOps";
import { PLTablo } from "@/components/admin/pano/PLTablo";
import { AlarmKutusu, CanliAkis } from "@/components/admin/pano/AlarmVeAkis";
import { veri, ozet } from "@/lib/admin/seed";
import { plTablo, planGelir } from "@/lib/admin/seed/finans";
import {
  alarmlar, funnel, ulkeDagilim, modelDagilim, nakitProjeksiyon,
  enCokHarcayan, tierDagilim, sistemSaglik,
} from "@/lib/admin/seed/panolar";
import { PLAN_ADI } from "@/store/useAuth";
import { kisaPara, para, yuzde, sayi } from "@/lib/admin/cekirdek";
import { useLiveTik } from "@/lib/admin/useLiveTik";
import { cn } from "@/lib/utils";

export default function GenelBakis() {
  const tik = useLiveTik(5000);
  const evren = veri();
  const o = ozet();

  const pl = useMemo(() => plTablo(evren.seri), [evren.seri]);
  const planPay = useMemo(() => planGelir(evren.kullanicilar), [evren.kullanicilar]);
  const alarm = useMemo(() => alarmlar(o), [o]);
  const funnelV = useMemo(() => funnel(o), [o]);
  const ulke = useMemo(() => ulkeDagilim(evren), [evren]);
  const model = useMemo(() => modelDagilim(evren), [evren]);
  const nakit = useMemo(() => nakitProjeksiyon(o.mrr, o.churnOran), [o.mrr, o.churnOran]);
  const harcayan = useMemo(() => enCokHarcayan(evren), [evren]);
  const tier = useMemo(() => tierDagilim(evren), [evren]);
  const saglik = sistemSaglik(tik);

  const gelirSeri = evren.seri.map((g) => g.gelir);
  const karSeri = evren.seri.map((g) => g.gelir - g.maliyet);
  const etiketler = ["90g", "", "", "60g", "", "", "30g", "", "", "bugün"];

  return (
    <RotaGuard modul="genel">
      <BolumBaslik baslik="Genel Bakış" ozet="Vayra yönetim panosu — canlı özet ve finansal durum"
        sag={<Rozet ton="basari"><Activity className="h-3 w-3" /> Sistemler çalışıyor</Rozet>} />

      {/* ── Üst metrik grid (8 metrik) ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="Aktif kullanıcı" deger="" sayacHedef={o.aktifKullanici} ikon={Users} delta={5.4} alt={`${sayi(o.toplamKullanici)} toplam`} />
        <MetrikKart etiket="MRR" deger={kisaPara(o.mrr)} ikon={Wallet} delta={8.2} alt={`ARR ${kisaPara(o.arr)}`} renk="basari" />
        <MetrikKart etiket="Net kâr (30g)" deger={kisaPara(o.kar30)} ikon={TrendingUp} delta={6.7} alt={`marj ${yuzde(o.karMarji)}`} renk="basari" />
        <MetrikKart etiket="Aktif abone" deger="" sayacHedef={o.aktifAbone} ikon={CreditCard} delta={4.1} alt={`churn ${yuzde(o.churnOran)}`} renk="mor" />
        <MetrikKart etiket="Job (24s)" deger="" sayacHedef={o.job24} ikon={ListChecks} delta={3.1} alt={`başarı ${yuzde(o.basariOran)}`} renk="aksan" />
        <MetrikKart etiket="ARPU" deger={para(o.arpu)} ikon={Percent} delta={2.2} alt="abone başına aylık" />
        <MetrikKart etiket="LTV / CAC" deger={o.ltvCac.toFixed(1) + "x"} ikon={Gauge} delta={1.8} alt={`LTV ${kisaPara(o.ltv)} · CAC ${para(o.cac)}`} renk="basari" />
        <MetrikKart etiket="Churn (30g)" deger={yuzde(o.churnOran)} ikon={TrendingDown} delta={-0.6} alt="gelir kaybı riski" renk="tehlike" />
      </div>

      {/* ── Live Ops ── */}
      <div className="mt-4">
        <LiveOps />
      </div>

      {/* ── Gelir/Kâr grafiği + P&L ── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Kart className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className={cn("flex items-center gap-2 text-sm font-bold", AD.metin)}>
              <AdIkon ikon={TrendingUp} boyut={28} /> Gelir & Net Kâr — 90 gün
            </h3>
            <div className="flex gap-3 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[color:var(--ad-aksan)]" /> Gelir</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Net kâr</span>
            </div>
          </div>
          <AlanGrafik veri={gelirSeri} etiketler={etiketler} yukseklik={170} />
          <div className="mt-3 border-t border-[color:var(--ad-kenar)] pt-3">
            <AlanGrafik veri={karSeri} renk="#34d399" yukseklik={90} />
          </div>
        </Kart>

        <Kart>
          <h3 className={cn("mb-4 flex items-center gap-2 text-sm font-bold", AD.metin)}>
            <AdIkon ikon={Wallet} boyut={28} /> Aylık P&amp;L
          </h3>
          <PLTablo satirlar={pl} />
        </Kart>
      </div>

      {/* ── Plan gelir donut + Funnel + Tier dağılım ── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Kart>
          <h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Plan bazlı gelir</h3>
          <DonutGrafik veri={planPay} />
        </Kart>
        <Kart>
          <h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Edinim funnel'ı (30g)</h3>
          <Funnel adimlar={funnelV} />
        </Kart>
        <Kart>
          <h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Tier dağılımı</h3>
          <DonutGrafik veri={tier.map((t) => ({ etiket: t.etiket, deger: t.deger, renk: t.renk }))} boyut={140} />
        </Kart>
      </div>

      {/* ── Nakit projeksiyon + Alarm + Canlı akış ── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Kart>
          <h3 className={cn("mb-4 flex items-center gap-2 text-sm font-bold", AD.metin)}>
            <ArrowUpRight className="h-4 w-4 text-emerald-400" /> Nakit akış projeksiyonu (6 ay)
          </h3>
          <AlanGrafik veri={nakit.map((n) => n.deger)} renk="#34d399" etiketler={nakit.map((n) => n.ay)} yukseklik={140} />
          <p className={cn("mt-2 text-[12px]", AD.metin3)}>Mevcut MRR + churn tahminiyle kümülatif nakit.</p>
        </Kart>
        <Kart>
          <h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Aktif alarmlar</h3>
          <AlarmKutusu liste={alarm} />
        </Kart>
        <Kart>
          <h3 className={cn("mb-1 text-sm font-bold", AD.metin)}>Canlı akış</h3>
          <CanliAkis />
        </Kart>
      </div>

      {/* ── Ülke/Model dağılım + En çok harcayan ── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Kart>
          <h3 className={cn("mb-4 flex items-center gap-2 text-sm font-bold", AD.metin)}>
            <Globe className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Ülke dağılımı
          </h3>
          <YatayCubuk veri={ulke} />
        </Kart>
        <Kart>
          <h3 className={cn("mb-4 flex items-center gap-2 text-sm font-bold", AD.metin)}>
            <Boxes className="h-4 w-4 text-[color:var(--ad-aksan)]" /> En çok kullanılan modeller
          </h3>
          <YatayCubuk veri={model} renk="#a78bfa" />
        </Kart>
        <Kart>
          <h3 className={cn("mb-3 flex items-center gap-2 text-sm font-bold", AD.metin)}>
            <Flame className="h-4 w-4 text-[color:var(--ad-pembe,#f472b6)]" /> En çok harcayan 10
          </h3>
          <div className="space-y-1">
            {harcayan.map((h, i) => (
              <Link key={h.id} href={`/admin/kullanicilar/${h.id}`} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.04]">
                <span className={cn("w-4 text-center text-[11px] font-bold tabular-nums", i < 3 ? "text-[color:var(--ad-aksan)]" : AD.metin3)}>{i + 1}</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#7de0ff] to-[#1ea8d6] text-[10px] font-bold text-[#04222c]">
                  {h.ad.split(" ").map((x) => x[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={cn("truncate text-[13px] font-medium", AD.metin)}>{h.ad}</div>
                  <div className={cn("text-[10px]", AD.metin3)}>{PLAN_ADI[h.plan as keyof typeof PLAN_ADI] ?? h.plan} · {h.ulke}</div>
                </div>
                <span className={cn("shrink-0 text-[13px] font-semibold tabular-nums", AD.metin)}>{kisaPara(h.harcanan)}</span>
              </Link>
            ))}
          </div>
        </Kart>
      </div>

      {/* ── Saatlik heatmap + Sistem sağlık ── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Kart className="lg:col-span-2">
          <h3 className={cn("mb-4 flex items-center gap-2 text-sm font-bold", AD.metin)}>
            <Layers className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Saatlik üretim yoğunluğu (peak planlama)
          </h3>
          <Heatmap veri={evren.heatmap} />
        </Kart>
        <Kart>
          <h3 className={cn("mb-4 flex items-center gap-2 text-sm font-bold", AD.metin)}>
            <Server className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Servis sağlığı
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {saglik.map((s) => (
              <div key={s.ad} className="flex flex-col items-center gap-1.5">
                <IlerlemeHalka deger={s.saglik} boyut={58}
                  renk={s.durum === "saglikli" ? "#34d399" : s.durum === "yavas" ? "#fbbf24" : "#f87171"} />
                <span className={cn("text-[11px]", AD.metin2)}>{s.ad}</span>
              </div>
            ))}
          </div>
        </Kart>
      </div>
    </RotaGuard>
  );
}
