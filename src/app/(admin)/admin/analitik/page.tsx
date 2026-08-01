"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  LineChart, Filter, Grid3x3, TrendingDown, BarChart3, Share2, Users2, Globe, Sparkles, Download, Search, Play, Megaphone, Clock,
} from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { BolumBaslik, MetrikKart, Kart, Sekmeler, Rozet, AD, Dugme } from "@/components/admin/ui/temel";
import { CubukGrafik, YatayCubuk, AlanGrafik, DonutGrafik } from "@/components/admin/grafik";
import { Funnel } from "@/components/admin/grafik/Funnel";
import { CohortMatris } from "@/components/admin/grafik/CohortMatris";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import { ozet, veri } from "@/lib/admin/seed";
import { funnel } from "@/lib/admin/seed/panolar";
import {
  cohortRetention, kanalMetrikleri, churnAnaliz, churnRiskListesi, kullanimHistogram, kullanimOzet,
  attributionRapor, flowAnalitik, seoAnalitik, markaBilinirlik, tierLtv, hazirSorgular,
  type HazirSorgu,
} from "@/lib/admin/seed/analitik";
import { para, kisaPara, kisaSayi, yuzde, sayi, goreceZaman } from "@/lib/admin/cekirdek";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/* CSV Blob indirme — gerçek dosya. */
function csvIndir(dosya: string, basliklar: string[], satirlar: (string | number)[][]) {
  const kacis = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const icerik = [basliklar, ...satirlar].map((r) => r.map(kacis).join(",")).join("\n");
  const blob = new Blob(["﻿" + icerik], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = dosya;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Analitik() {
  const o = ozet();
  const evren = veri();
  const oturum = useAdminOturum();
  const [sekme, setSekme] = useState("funnel");

  const funnelV = useMemo(() => funnel(o), [o]);
  const cohort = useMemo(() => cohortRetention(), []);
  const kanal = useMemo(() => kanalMetrikleri(o), [o]);
  const tier = useMemo(() => tierLtv(), []);
  const churn = useMemo(() => churnAnaliz(), []);
  const riskListe = useMemo(() => churnRiskListesi(), []);
  const hist = useMemo(() => kullanimHistogram(), []);
  const kOzet = useMemo(() => kullanimOzet(), []);
  const attr = useMemo(() => attributionRapor(), []);
  const flow = useMemo(() => flowAnalitik(), []);
  const seo = useMemo(() => seoAnalitik(), []);
  const marka = useMemo(() => markaBilinirlik(), []);

  // SQL editörü
  const sorgular = useMemo(() => hazirSorgular(), []);
  const [aktifSorgu, setAktifSorgu] = useState<HazirSorgu>(sorgular[0]);
  const [sql, setSql] = useState(sorgular[0].sql);
  const [sonuc, setSonuc] = useState<Record<string, string | number>[]>(() => sorgular[0].calistir());

  const sorguSec = (q: HazirSorgu) => {
    setAktifSorgu(q);
    setSql(q.sql);
    setSonuc(q.calistir());
  };
  const calistir = () => {
    setSonuc(aktifSorgu.calistir());
    toast.success(`${aktifSorgu.ad} · ${aktifSorgu.calistir().length} satır döndü`);
  };
  const bicimle = (v: string | number, bicim?: string) =>
    bicim === "para" ? para(Number(v)) : bicim === "sayi" ? sayi(Number(v)) : String(v);

  const sonucCsv = () => {
    csvIndir(
      `${aktifSorgu.id}.csv`,
      aktifSorgu.kolonlar.map((k) => k.ad),
      sonuc.map((row) => aktifSorgu.kolonlar.map((k) => row[k.anahtar] ?? "")),
    );
    toast.success("CSV indirildi");
  };

  // Proaktif kampanya (risk listesi) — audit + toast
  const proaktifKampanya = (ad?: string) => {
    oturum.denetle({
      admin: oturum.aktifAdmin ?? "admin", rol: oturum.aktifRol ?? "super",
      eylem: ad ? `Proaktif churn kampanyası: ${ad}` : `Toplu churn kampanyası (${riskListe.length} abone)`,
      hedef: ad ?? "churn-risk-listesi",
      detay: ad ? "Tekil abone win-back teklifi" : "Risk listesindeki tüm abonelere kampanya",
      onem: "uyari", arac: "manuel",
    });
    toast.success(ad ? `${ad} için kampanya kuyruğa alındı` : `${riskListe.length} aboneye kampanya başlatıldı`);
  };

  const genelCsv = () => {
    csvIndir(
      "cohort-retention.csv",
      ["Cohort", "Boyut", "D1", "D7", "D30", "D90", "Gelir"],
      cohort.map((c) => [c.cohort, c.boyut, c.d1, c.d7, c.d30, c.d90, c.gelir]),
    );
    toast.success("Cohort raporu CSV indirildi");
  };

  const sekmeler = [
    { id: "funnel", ad: "Funnel" },
    { id: "cohort", ad: "Cohort & Retention" },
    { id: "ltvcac", ad: "LTV / CAC" },
    { id: "churn", ad: "Churn", sayi: riskListe.length },
    { id: "kullanim", ad: "Kullanım" },
    { id: "attr", ad: "Attribution / UTM" },
    { id: "flow", ad: "Flow Topluluk" },
    { id: "seo", ad: "GEO / SEO" },
    { id: "marka", ad: "Marka Bilinirliği" },
    { id: "ozel", ad: "Özel Rapor" },
  ];

  return (
    <RotaGuard modul="analitik">
      <BolumBaslik baslik="Analitik" ozet="Funnel, cohort, LTV/CAC, churn, attribution ve daha fazlası" ikon={LineChart}
        sag={<Dugme tur="glass" boyut="sm" ikon={Download} onClick={genelCsv}>Cohort CSV</Dugme>} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="LTV / CAC" deger={o.ltvCac.toFixed(1) + "x"} ikon={TrendingDown} delta={1.8} renk="basari" />
        <MetrikKart etiket="Churn (aylık)" deger={yuzde(churn.aylikOran)} ikon={TrendingDown} alt={`${sayi(churn.churnAbone)} abone`} renk="tehlike" />
        <MetrikKart etiket="Aktif kullanıcı" deger={kisaSayi(o.aktifKullanici)} ikon={Users2} delta={5.4} />
        <MetrikKart etiket="Risk altında" deger={sayi(churn.riskliSayi)} ikon={Filter} alt="churn riski yüksek" renk="uyari" />
      </div>

      <div className="mb-3"><Sekmeler sekmeler={sekmeler} aktif={sekme} sec={setSekme} /></div>

      {/* Funnel */}
      {sekme === "funnel" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Kart className="lg:col-span-2"><h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Edinim funnel'ı (30 gün)</h3><Funnel adimlar={funnelV} /></Kart>
          <Kart>
            <h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Adım dönüşümleri</h3>
            <div className="space-y-3">
              {funnelV.slice(1).map((f, i) => {
                const onceki = funnelV[i];
                return (
                  <div key={f.asama} className="flex items-center justify-between text-[13px]">
                    <span className={AD.metin2}>{onceki.asama} → {f.asama}</span>
                    <Rozet ton={f.sayi / onceki.sayi > 0.5 ? "basari" : "uyari"}>%{((f.sayi / onceki.sayi) * 100).toFixed(0)}</Rozet>
                  </div>
                );
              })}
            </div>
          </Kart>
        </div>
      )}

      {/* Cohort */}
      {sekme === "cohort" && (
        <Kart>
          <h3 className={cn("mb-1 flex items-center gap-2 text-sm font-bold", AD.metin)}><Grid3x3 className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Cohort retention matrisi</h3>
          <p className={cn("mb-4 text-[13px]", AD.metin3)}>Kayıt haftasına göre D1/D7/D30/D90 tutundurma — {kisaSayi(evren.kullanicilar.length)} kullanıcı, gerçek kayıt+dönüş verisi.</p>
          <CohortMatris satirlar={cohort} />
          <div className="mt-3 flex flex-wrap gap-3 text-[12px]">
            {cohort.map((c) => (
              <span key={c.cohort} className={cn("rounded-lg border border-[color:var(--ad-kenar)] px-2.5 py-1", AD.metin3)}>{c.cohort}: <span className={AD.metin2}>{kisaPara(c.gelir)}</span></span>
            ))}
          </div>
        </Kart>
      )}

      {/* LTV/CAC */}
      {sekme === "ltvcac" && (
        <div className="space-y-4">
          <Kart className="overflow-hidden !p-0">
            <div className="p-5"><h3 className={cn("text-sm font-bold", AD.metin)}>Kanal bazlı LTV / CAC kârlılığı</h3></div>
            <div className="overflow-x-auto ad-ince-scroll">
              <table className="w-full min-w-[640px] text-sm">
                <thead><tr className="border-y border-[color:var(--ad-kenar)] text-left text-[11px] uppercase tracking-wider text-[color:var(--ad-metin-3)]">
                  <th className="px-5 py-2.5">Kanal</th><th className="px-3 py-2.5 text-right">Kayıt</th><th className="px-3 py-2.5 text-right">CAC</th>
                  <th className="px-3 py-2.5 text-right">LTV</th><th className="px-3 py-2.5 text-right">LTV/CAC</th><th className="px-3 py-2.5 text-right">Payback</th><th className="px-5 py-2.5 text-right">Gelir</th>
                </tr></thead>
                <tbody>
                  {kanal.map((k) => (
                    <tr key={k.kanalId} className="border-b border-[color:var(--ad-kenar)] last:border-0">
                      <td className="px-5 py-3 font-medium text-[color:var(--ad-metin)]">{k.kanal}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-[color:var(--ad-metin-2)]">{sayi(k.kayit)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-[color:var(--ad-metin-2)]">{para(k.cac)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-[color:var(--ad-metin)]">{para(k.ltv)}</td>
                      <td className="px-3 py-3 text-right"><span className="tabular-nums font-semibold" style={{ color: k.ltvCac >= 3 ? "var(--ad-basari)" : k.ltvCac >= 1 ? "var(--ad-uyari)" : "var(--ad-tehlike)" }}>{k.ltvCac}x</span></td>
                      <td className="px-3 py-3 text-right tabular-nums text-[color:var(--ad-metin-2)]">{k.payback ? `${k.payback}ay` : "—"}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-semibold text-[color:var(--ad-metin)]">{kisaPara(k.gelir)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Kart>
          <Kart>
            <h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Tier (plan) bazlı LTV</h3>
            <YatayCubuk veri={tier.map((t) => ({ etiket: t.plan, deger: t.ltv, alt: `LTV ${para(t.ltv)} · ${sayi(t.abone)} abone · ${kisaPara(t.toplamGelir)} gelir` }))} />
          </Kart>
        </div>
      )}

      {/* Churn */}
      {sekme === "churn" && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Kart><h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>İptal sebepleri dağılımı</h3><YatayCubuk veri={churn.sebepler.map((s) => ({ etiket: s.sebep, deger: s.sayi, alt: `${sayi(s.sayi)} (%${s.oran.toFixed(0)})` }))} renk="#f87171" /></Kart>
            <Kart>
              <h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Churn özeti</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-[color:var(--ad-kenar)] p-3"><span className={cn("text-[13px]", AD.metin2)}>Aylık churn oranı</span><span className="text-lg font-bold tabular-nums text-rose-400">%{churn.aylikOran}</span></div>
                <div className="flex items-center justify-between rounded-xl border border-[color:var(--ad-kenar)] p-3"><span className={cn("text-[13px]", AD.metin2)}>Churn eden abone</span><span className="text-lg font-bold tabular-nums text-rose-400">{sayi(churn.churnAbone)}</span></div>
                <div className="flex items-center justify-between rounded-xl border border-[color:var(--ad-kenar)] p-3"><span className={cn("text-[13px]", AD.metin2)}>Risk altındaki abone</span><span className="text-lg font-bold tabular-nums text-amber-400">{sayi(churn.riskliSayi)}</span></div>
                <div className="flex items-center justify-between rounded-xl border border-[color:var(--ad-kenar)] p-3"><span className={cn("text-[13px]", AD.metin2)}>Win-back oranı</span><span className="text-lg font-bold tabular-nums text-emerald-400">%{churn.winbackOran}</span></div>
              </div>
            </Kart>
          </div>

          <Kart className="overflow-hidden !p-0">
            <div className="flex items-center justify-between p-5">
              <div>
                <h3 className={cn("text-sm font-bold", AD.metin)}>Churn risk listesi</h3>
                <p className={cn("mt-0.5 text-[12px]", AD.metin3)}>Yenilemesi yaklaşan + kullanımı düşmüş {riskListe.length} abone (isimli).</p>
              </div>
              <Dugme boyut="sm" ikon={Megaphone} onClick={() => proaktifKampanya()}>Toplu kampanya</Dugme>
            </div>
            <div className="overflow-x-auto ad-ince-scroll">
              <table className="w-full min-w-[680px] text-sm">
                <thead><tr className="border-y border-[color:var(--ad-kenar)] text-left text-[11px] uppercase tracking-wider text-[color:var(--ad-metin-3)]">
                  <th className="px-5 py-2.5">Abone</th><th className="px-3 py-2.5">Plan</th><th className="px-3 py-2.5">Son aktif</th>
                  <th className="px-3 py-2.5">Sebep</th><th className="px-3 py-2.5 text-right">Risk</th><th className="px-5 py-2.5 text-right">Aksiyon</th>
                </tr></thead>
                <tbody>
                  {riskListe.map((r) => (
                    <tr key={r.id} className="border-b border-[color:var(--ad-kenar)] last:border-0">
                      <td className="px-5 py-3"><Link href={`/admin/kullanicilar/${r.id}`} className="font-medium text-[color:var(--ad-metin)] hover:text-[color:var(--ad-aksan)]">{r.ad}</Link></td>
                      <td className="px-3 py-3 text-[color:var(--ad-metin-2)]">{r.plan}</td>
                      <td className="px-3 py-3 text-[color:var(--ad-metin-3)]">{goreceZaman(r.sonAktif)}</td>
                      <td className="px-3 py-3 text-[12px] text-[color:var(--ad-metin-2)]">{r.sebep}</td>
                      <td className="px-3 py-3 text-right"><span className="tabular-nums font-semibold" style={{ color: r.risk >= 70 ? "var(--ad-tehlike)" : r.risk >= 50 ? "var(--ad-uyari)" : "var(--ad-metin-2)" }}>{r.risk}</span></td>
                      <td className="px-5 py-3 text-right"><Dugme boyut="sm" tur="glass" ikon={Megaphone} onClick={() => proaktifKampanya(r.ad)}>Kampanya</Dugme></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Kart>
        </div>
      )}

      {/* Kullanım */}
      {sekme === "kullanim" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Kart><h3 className={cn("mb-4 flex items-center gap-2 text-sm font-bold", AD.metin)}><BarChart3 className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Kullanıcı başına üretim dağılımı</h3><CubukGrafik veri={hist} yukseklik={160} /><p className={cn("mt-3 text-[12px]", AD.metin3)}>{kisaSayi(evren.kullanicilar.length)} kullanıcının job sayısı bucket'ları — gerçek dağılım.</p></Kart>
          <Kart>
            <h3 className={cn("mb-4 flex items-center gap-2 text-sm font-bold", AD.metin)}><Clock className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Kullanım & değer metrikleri</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Ort. job / kullanıcı", sayi(kOzet.ortJob)],
                ["Medyan job", sayi(kOzet.medyanJob)],
                ["İlk üretime süre", kOzet.ttvSaat < 1 ? `${Math.round(kOzet.ttvSaat * 60)}dk` : `${kOzet.ttvSaat}sa`],
                ["Aktif üretici", `%${kOzet.aktifOran}`],
                ["Doğrulanmış oran", `%${kOzet.ilkDenemeBasari}`],
              ].map(([e, d]) => (
                <div key={e} className="rounded-xl border border-[color:var(--ad-kenar)] p-3 text-center"><div className={cn("text-lg font-bold tabular-nums", AD.metin)}>{d}</div><div className={cn("text-[11px]", AD.metin3)}>{e}</div></div>
              ))}
            </div>
          </Kart>
        </div>
      )}

      {/* Attribution */}
      {sekme === "attr" && (
        <Kart className="overflow-hidden !p-0">
          <div className="flex items-center justify-between p-5"><h3 className={cn("text-sm font-bold", AD.metin)}>Attribution / UTM raporu (ROAS)</h3><span className={cn("text-[12px]", AD.metin3)}>first-touch model</span></div>
          <div className="overflow-x-auto ad-ince-scroll">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-y border-[color:var(--ad-kenar)] text-left text-[11px] uppercase tracking-wider text-[color:var(--ad-metin-3)]">
                <th className="px-5 py-2.5">Kaynak</th><th className="px-3 py-2.5 text-right">Kayıt</th><th className="px-3 py-2.5 text-right">İlk üretim</th>
                <th className="px-3 py-2.5 text-right">İlk ödeme</th><th className="px-3 py-2.5 text-right">Gelir</th><th className="px-3 py-2.5 text-right">Reklam</th><th className="px-5 py-2.5 text-right">ROAS</th>
              </tr></thead>
              <tbody>
                {attr.map((a) => (
                  <tr key={a.kaynak} className="border-b border-[color:var(--ad-kenar)] last:border-0">
                    <td className="px-5 py-3"><span className="font-medium text-[color:var(--ad-metin)]">{a.kaynak}</span> <span className={cn("text-[11px]", AD.metin3)}>· {a.ortam}</span></td>
                    <td className="px-3 py-3 text-right tabular-nums text-[color:var(--ad-metin-2)]">{sayi(a.kayit)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-[color:var(--ad-metin-2)]">{sayi(a.ilkUretim)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-[color:var(--ad-metin-2)]">{sayi(a.ilkOdeme)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-[color:var(--ad-metin)]">{kisaPara(a.gelir)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-[color:var(--ad-metin-3)]">{a.reklamHarcama ? kisaPara(a.reklamHarcama) : "—"}</td>
                    <td className="px-5 py-3 text-right">{a.roas ? <span className="tabular-nums font-semibold" style={{ color: a.roas >= 3 ? "var(--ad-basari)" : a.roas >= 1.5 ? "var(--ad-uyari)" : "var(--ad-tehlike)" }}>{a.roas}x</span> : <span className={AD.metin3}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Kart>
      )}

      {/* Flow Topluluk */}
      {sekme === "flow" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetrikKart etiket="Toplam gönderi" deger={kisaSayi(flow.toplamGonderi)} ikon={Share2} />
            <MetrikKart etiket="Aktif paylaşan" deger={kisaSayi(flow.aktifPaylasan)} ikon={Users2} renk="mor" />
            <MetrikKart etiket="Toplam beğeni" deger={kisaSayi(flow.toplamBegeni)} ikon={Sparkles} renk="basari" />
            <MetrikKart etiket="Ort. etkileşim" deger={yuzde(flow.ortEtkilesim)} ikon={LineChart} renk="aksan" />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Kart className="lg:col-span-2">
              <h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>En popüler gönderiler</h3>
              <div className="space-y-2">
                {flow.enPopulerGonderiler.map((g, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-[color:var(--ad-kenar)] p-2.5">
                    <span className={cn("w-4 text-center text-[12px] font-bold", i < 3 ? "text-[color:var(--ad-aksan)]" : AD.metin3)}>{i + 1}</span>
                    <div className="min-w-0 flex-1"><div className={cn("truncate text-[13px] font-medium", AD.metin)}>{g.baslik}</div><div className={cn("text-[11px]", AD.metin3)}>{g.kullanici}</div></div>
                    <span className={cn("text-[12px] tabular-nums", AD.metin2)}>{kisaSayi(g.begeni)} beğeni</span>
                    <span className={cn("text-[12px] tabular-nums", AD.metin3)}>{kisaSayi(g.yorum)} yorum</span>
                  </div>
                ))}
              </div>
            </Kart>
            <Kart>
              <h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Topluluk sağlığı</h3>
              <div className="space-y-2.5">
                {[["Günlük aktif", kisaSayi(flow.gunlukAktif)], ["Toplam yorum", kisaSayi(flow.toplamYorum)], ["Toplam paylaşım", kisaSayi(flow.toplamPaylasim)], ["Viral içerik", sayi(flow.viralIcerik)]].map(([e, d]) => (
                  <div key={e} className="flex items-center justify-between"><span className={cn("text-[13px]", AD.metin2)}>{e}</span><span className={cn("tabular-nums font-semibold", AD.metin)}>{d}</span></div>
                ))}
              </div>
            </Kart>
          </div>
        </div>
      )}

      {/* GEO / SEO */}
      {sekme === "seo" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetrikKart etiket="Organik oturum" deger={kisaSayi(seo.organikTrafik)} ikon={Globe} delta={9.2} renk="basari" />
            <MetrikKart etiket="Anahtar kelime" deger={sayi(seo.toplamAnahtar)} ikon={Search} />
            <MetrikKart etiket="Ort. sıralama" deger={seo.ort.toFixed(1)} ikon={LineChart} renk="aksan" />
            <MetrikKart etiket="Backlink" deger={kisaSayi(seo.backlink)} ikon={Share2} renk="mor" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Kart className="overflow-hidden !p-0">
              <div className="p-5"><h3 className={cn("text-sm font-bold", AD.metin)}>Anahtar kelime sıralamaları</h3></div>
              <div className="overflow-x-auto ad-ince-scroll">
                <table className="w-full text-sm">
                  <thead><tr className="border-y border-[color:var(--ad-kenar)] text-left text-[11px] uppercase tracking-wider text-[color:var(--ad-metin-3)]"><th className="px-5 py-2">Kelime</th><th className="px-3 py-2 text-right">Sıra</th><th className="px-3 py-2 text-right">Hacim</th><th className="px-5 py-2 text-right">Değişim</th></tr></thead>
                  <tbody>{seo.kelimeler.map((k) => (
                    <tr key={k.anahtarKelime} className="border-b border-[color:var(--ad-kenar)] last:border-0">
                      <td className="px-5 py-2.5 text-[color:var(--ad-metin)]">{k.anahtarKelime}</td>
                      <td className="px-3 py-2.5 text-right"><span className={cn("tabular-nums font-semibold", k.siralama <= 3 ? "text-emerald-400" : k.siralama <= 10 ? "text-[color:var(--ad-aksan)]" : AD.metin2)}>{k.siralama}</span></td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[color:var(--ad-metin-2)]">{kisaSayi(k.hacim)}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums" style={{ color: k.degisim >= 0 ? "var(--ad-basari)" : "var(--ad-tehlike)" }}>{k.degisim >= 0 ? "↑" : "↓"}{Math.abs(k.degisim)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Kart>
            <Kart><h3 className={cn("mb-4 flex items-center gap-2 text-sm font-bold", AD.metin)}><Globe className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Ülke bazlı organik trafik</h3><YatayCubuk veri={seo.ulkeTrafik.map((u) => ({ etiket: u.ulke, deger: u.oturum, alt: `${sayi(u.oturum)} (%${u.oran})` }))} /></Kart>
          </div>
        </div>
      )}

      {/* Marka */}
      {sekme === "marka" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetrikKart etiket="Toplam mention" deger={kisaSayi(marka.mention)} ikon={Share2} delta={12.4} renk="basari" />
            <MetrikKart etiket="Pozitif sentiment" deger={yuzde(marka.sentiment)} ikon={Sparkles} renk="basari" />
            <MetrikKart etiket="Share of Voice" deger={yuzde(marka.sov)} ikon={BarChart3} renk="aksan" />
            <MetrikKart etiket="Aylık büyüme" deger="+24%" ikon={LineChart} renk="mor" />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Kart className="lg:col-span-2"><h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Mention trendi (30 gün)</h3><AlanGrafik veri={marka.trend} yukseklik={160} /></Kart>
            <Kart><h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Kanal dağılımı</h3><DonutGrafik veri={marka.kanalDagilim} boyut={140} /></Kart>
          </div>
        </div>
      )}

      {/* Özel Rapor (SQL editörü) — çalışan */}
      {sekme === "ozel" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Kart>
              <div className="mb-3 flex items-center justify-between">
                <h3 className={cn("text-sm font-bold", AD.metin)}>SQL editörü (read-only replica)</h3>
                <div className="flex gap-2">
                  <Dugme boyut="sm" tur="glass" ikon={Download} onClick={sonucCsv}>CSV</Dugme>
                  <Dugme boyut="sm" ikon={Play} onClick={calistir}>Çalıştır</Dugme>
                </div>
              </div>
              <textarea value={sql} onChange={(e) => setSql(e.target.value)} rows={7} className="w-full resize-none rounded-xl border border-[color:var(--ad-kenar)] bg-black/30 p-3 font-mono text-[13px] text-[color:var(--ad-metin)] outline-none focus:border-[color:var(--ad-aksan)]/40" />
              <p className={cn("mt-2 text-[11px]", AD.metin3)}>Hazır sorgular gerçek {kisaSayi(evren.kullanicilar.length)} kullanıcı kaydı üzerinde çalışır. Sonuç aşağıda.</p>
            </Kart>

            <Kart className="overflow-hidden !p-0">
              <div className="flex items-center justify-between p-4">
                <h3 className={cn("text-sm font-bold", AD.metin)}>{aktifSorgu.ad}</h3>
                <span className={cn("text-[12px]", AD.metin3)}>{sonuc.length} satır</span>
              </div>
              <div className="overflow-x-auto ad-ince-scroll">
                <table className="w-full min-w-[440px] text-sm">
                  <thead><tr className="border-y border-[color:var(--ad-kenar)] text-[11px] uppercase tracking-wider text-[color:var(--ad-metin-3)]">
                    {aktifSorgu.kolonlar.map((c) => <th key={c.anahtar} className={cn("px-4 py-2.5", c.hiza === "sag" ? "text-right" : "text-left")}>{c.ad}</th>)}
                  </tr></thead>
                  <tbody>
                    {sonuc.map((row, i) => (
                      <tr key={i} className="border-b border-[color:var(--ad-kenar)] last:border-0">
                        {aktifSorgu.kolonlar.map((c) => (
                          <td key={c.anahtar} className={cn("px-4 py-2.5 tabular-nums", c.hiza === "sag" ? "text-right text-[color:var(--ad-metin)]" : "text-[color:var(--ad-metin-2)]")}>{bicimle(row[c.anahtar], c.bicim)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Kart>
          </div>

          <Kart>
            <h3 className={cn("mb-3 text-sm font-bold", AD.metin)}>Hazır sorgular</h3>
            <div className="space-y-1.5">
              {sorgular.map((q) => (
                <button key={q.id} onClick={() => sorguSec(q)} className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors", q.id === aktifSorgu.id ? "bg-[color:var(--ad-aksan)]/12" : "hover:bg-white/[0.04]")}>
                  <Search className={cn("h-3.5 w-3.5", q.id === aktifSorgu.id ? "text-[color:var(--ad-aksan)]" : "text-[color:var(--ad-metin-3)]")} />
                  <span className={q.id === aktifSorgu.id ? AD.metin : AD.metin2}>{q.ad}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-[color:var(--ad-kenar)] p-3">
              <p className={cn("text-[12px]", AD.metin3)}>Zamanlanmış rapor: haftalık özet → e-posta/Slack. {kisaSayi(evren.kullanicilar.length)} kayıt üzerinde.</p>
            </div>
          </Kart>
        </div>
      )}
    </RotaGuard>
  );
}
