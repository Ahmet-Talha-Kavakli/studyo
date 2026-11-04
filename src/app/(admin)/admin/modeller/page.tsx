"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Boxes, Server, TrendingUp, Zap, Power, Pencil, Check, X, GitBranch, RefreshCcw, DollarSign,
  Grid3x3, Users, Activity, ChevronRight,
} from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { BolumBaslik, MetrikKart, Kart, Sekmeler, Rozet, Dugme, AD, DurumNokta } from "@/components/admin/ui/temel";
import { AlanGrafik } from "@/components/admin/grafik";
import { useOnay } from "@/components/admin/ui/Onay";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import { useAdminModeller } from "@/store/admin/useAdminModeller";
import { veri } from "@/lib/admin/seed";
import { modelStatlar, whatIf, providerHarcamaSeri, modelTierMatris, agirKullanicilar, cogsTrend } from "@/lib/admin/seed/marj";
import { PROVIDERLAR } from "@/lib/admin/tablolar";
import { providerLatency } from "@/lib/admin/seed/liveops";
import { useLiveTik } from "@/lib/admin/useLiveTik";
import { aksiyonRisk } from "@/lib/admin/guvenlik/roller";
import { para, dolar, yuzde, sayi, kisaPara } from "@/lib/admin/cekirdek";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export default function Modeller() {
  const { onayIste } = useOnay();
  const oturum = useAdminOturum();
  const mod = useAdminModeller();
  const evren = veri();
  const tik = useLiveTik(5000);
  const [sekme, setSekme] = useState("katalog");
  const [duzenle, setDuzenle] = useState<string | null>(null);
  const [dKredi, setDKredi] = useState(0);
  const [dMaliyet, setDMaliyet] = useState(0);
  const [wSaglayici, setWSaglayici] = useState("Google");
  const [wArtis, setWArtis] = useState(20);

  const statlar = useMemo(() => modelStatlar(evren, (id) => mod.modelOverride(id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [evren, mod.override]);
  const wi = useMemo(() => whatIf(statlar, wSaglayici, wArtis), [statlar, wSaglayici, wArtis]);
  const matris = useMemo(() => modelTierMatris(statlar), [statlar]);
  const agir = useMemo(() => agirKullanicilar(evren, 20), [evren]);
  const cogs = useMemo(() => cogsTrend(evren), [evren]);
  const lat = providerLatency(tik);

  const toplamGelir = statlar.reduce((a, s) => a + s.gelir, 0);
  const toplamMaliyet = statlar.reduce((a, s) => a + s.maliyet, 0);
  const zararlilar = statlar.filter((s) => s.marj < 20);
  const cogsSonOran = cogs.length ? cogs[cogs.length - 1].oran : 0;

  const denetle = (eylem: string, onem: "bilgi" | "uyari" | "kritik", hedef?: string) =>
    oturum.denetle({ admin: oturum.aktifAdmin ?? "admin", rol: oturum.aktifRol!, eylem, hedef, onem, arac: "manuel" });

  const modelToggle = async (id: string, ad: string, acik: boolean) => {
    const ok = await onayIste({ baslik: acik ? "Modeli aç" : "Modeli kapat", aciklama: `${ad} ${acik ? "kullanıma açılacak" : "anında kapatılacak"}.`, risk: acik ? 0 : 1, eylemEtiket: acik ? "Aç" : "Kapat" });
    if (!ok) return;
    mod.modelGuncelle(id, { acik });
    denetle(`Model ${acik ? "açıldı" : "kapatıldı"}`, "uyari", ad);
    toast.success(acik ? "Model açıldı" : "Model kapatıldı", { description: ad });
  };

  const fiyatKaydet = async (id: string, ad: string) => {
    const risk = aksiyonRisk("model_fiyat_degistir");
    const ok = await onayIste({ baslik: "Model fiyatını değiştir", aciklama: `${ad}: ${dKredi} kredi / maliyet ${dolar(dMaliyet)}. Deploy beklemeden anında geçerli olur.`, risk: risk.risk, eylemEtiket: "Kaydet" });
    if (!ok) return;
    mod.modelGuncelle(id, { kredi: dKredi, maliyetUsd: dMaliyet });
    denetle(`Model fiyatı değiştirildi: ${dKredi} kredi / ${dolar(dMaliyet)}`, "kritik", ad);
    toast.success("Model fiyatı güncellendi", { description: `${ad}: ${dKredi} kredi. Hemen geçerli.` });
    setDuzenle(null);
  };

  const iadeKuralToggle = (id: string, ad: string) => { mod.iadeKuralToggle(id); denetle(`İade kuralı değişti: ${ad}`, "uyari"); toast.success("İade kuralı güncellendi", { description: ad }); };

  const sekmeler = [
    { id: "katalog", ad: "Model Kataloğu", sayi: statlar.length },
    { id: "marj", ad: "Marj & Analiz" },
    { id: "provider", ad: "Providerlar", sayi: PROVIDERLAR.length },
    { id: "failover", ad: "Failover" },
    { id: "whatif", ad: "What-If Simülasyon" },
    { id: "iade", ad: "İade Kuralları" },
  ];

  return (
    <RotaGuard modul="modeller">
      <BolumBaslik baslik="Modeller & Provider" ozet="Katalog, fiyatlandırma, maliyet ve marj yönetimi" ikon={Boxes} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="Aktif model" deger={sayi(statlar.filter((s) => s.model.acik).length)} ikon={Boxes} alt={`${statlar.length} toplam`} />
        <MetrikKart etiket="Model geliri (30g)" deger={kisaPara(toplamGelir)} ikon={TrendingUp} delta={5.1} renk="basari" />
        <MetrikKart etiket="Provider maliyeti" deger={kisaPara(toplamMaliyet)} ikon={Server} alt={`marj ${yuzde(((toplamGelir - toplamMaliyet) / toplamGelir) * 100)}`} renk="mor" />
        <MetrikKart etiket="Düşük marjlı" deger={sayi(zararlilar.length)} ikon={Zap} alt="model < %20 marj" renk={zararlilar.length ? "tehlike" : "basari"} />
      </div>

      <div className="mb-3"><Sekmeler sekmeler={sekmeler} aktif={sekme} sec={setSekme} /></div>

      {/* Katalog */}
      {sekme === "katalog" && (
        <div className="ad-glass overflow-hidden !p-0">
          <div className="overflow-x-auto ad-ince-scroll">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-b border-[color:var(--ad-kenar)] text-left text-[11px] uppercase tracking-wider text-[color:var(--ad-metin-3)]">
                <th className="px-4 py-3">Model</th><th className="px-4 py-3">Provider</th><th className="px-4 py-3 text-right">Kredi</th>
                <th className="px-4 py-3 text-right">Maliyet</th><th className="px-4 py-3 text-right">Marj</th><th className="px-4 py-3 text-right">Kullanım</th>
                <th className="px-4 py-3 text-center">Durum</th><th className="px-4 py-3"></th>
              </tr></thead>
              <tbody>
                {statlar.map((s) => {
                  const dzn = duzenle === s.model.id;
                  return (
                    <tr key={s.model.id} className="border-b border-[color:var(--ad-kenar)] last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-[color:var(--ad-metin)]">{s.model.ad}</span>
                          {s.model.rozet && <Rozet ton="aksan">{s.model.rozet}</Rozet>}
                        </div>
                        <span className="text-[11px] uppercase text-[color:var(--ad-metin-3)]">{s.model.tur}</span>
                      </td>
                      <td className="px-4 py-3 text-[color:var(--ad-metin-2)]">{s.model.saglayici}</td>
                      <td className="px-4 py-3 text-right">
                        {dzn ? <input type="number" value={dKredi} onChange={(e) => setDKredi(+e.target.value)} className="h-8 w-16 rounded-lg border border-[color:var(--ad-aksan)]/40 bg-white/[0.03] px-2 text-right text-sm tabular-nums" />
                          : <span className="tabular-nums text-[color:var(--ad-metin)]">{s.model.kredi}</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {dzn ? <input type="number" step="0.001" value={dMaliyet} onChange={(e) => setDMaliyet(+e.target.value)} className="h-8 w-20 rounded-lg border border-[color:var(--ad-aksan)]/40 bg-white/[0.03] px-2 text-right text-sm tabular-nums" />
                          : <span className="tabular-nums text-[color:var(--ad-metin-2)]">{dolar(s.model.maliyetUsd)}</span>}
                      </td>
                      <td className="px-4 py-3 text-right"><span className="tabular-nums" style={{ color: s.marj < 20 ? "var(--ad-tehlike)" : s.marj < 40 ? "var(--ad-uyari)" : "var(--ad-basari)" }}>{yuzde(s.marj)}</span></td>
                      <td className="px-4 py-3 text-right tabular-nums text-[color:var(--ad-metin-2)]">{sayi(s.kullanim30)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => modelToggle(s.model.id, s.model.ad, !s.model.acik)} className="inline-flex">
                          <Power className={cn("h-4 w-4", s.model.acik ? "text-emerald-400" : "text-[color:var(--ad-metin-3)]")} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {dzn ? (
                          <div className="flex justify-end gap-1">
                            <button onClick={() => fiyatKaydet(s.model.id, s.model.ad)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400"><Check className="h-4 w-4" /></button>
                            <button onClick={() => setDuzenle(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--ad-metin-3)]"><X className="h-4 w-4" /></button>
                          </div>
                        ) : (
                          <button onClick={() => { setDuzenle(s.model.id); setDKredi(s.model.kredi); setDMaliyet(s.model.maliyetUsd); }} className="flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--ad-metin-3)] hover:text-[color:var(--ad-aksan)]"><Pencil className="h-3.5 w-3.5" /></button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Marj & Analiz */}
      {sekme === "marj" && (
        <div className="space-y-4">
          {/* Model × Tier ısı matrisi */}
          <Kart className="!p-0 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-3">
              <h3 className={cn("flex items-center gap-2 text-sm font-bold", AD.metin)}><Grid3x3 className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Model × Plan marj matrisi — hangi model hangi planda para kaybettiriyor</h3>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--ad-basari)" }} /><span className={AD.metin3}>kâr</span></span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--ad-tehlike)" }} /><span className={AD.metin3}>zarar</span></span>
              </div>
            </div>
            <div className="overflow-x-auto ad-ince-scroll">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-y border-[color:var(--ad-kenar)] text-[11px] uppercase tracking-wider text-[color:var(--ad-metin-3)]">
                    <th className="px-4 py-2.5 text-left font-medium">Model</th>
                    {matris.tierler.map((t) => <th key={t.id} className="px-3 py-2.5 text-right font-medium">{t.ad}</th>)}
                    <th className="px-4 py-2.5 text-right font-medium">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {matris.satirlar.slice(0, 24).map((sat) => {
                    const max = Math.max(...sat.hucreler.map((h) => Math.abs(h.net)), 1);
                    return (
                      <tr key={sat.model.id} className="border-b border-[color:var(--ad-kenar)] last:border-0">
                        <td className="px-4 py-2 text-[color:var(--ad-metin)]"><span className="font-medium">{sat.model.ad}</span></td>
                        {sat.hucreler.map((h, ci) => {
                          const yog = Math.min(0.55, 0.12 + (Math.abs(h.net) / max) * 0.43);
                          const renk = h.net < 0 ? `rgba(244,113,113,${yog})` : `rgba(52,211,153,${yog})`;
                          return (
                            <td key={ci} className="px-3 py-2 text-right" style={{ background: h.kullanim ? renk : "transparent" }}>
                              {h.kullanim ? (
                                <div>
                                  <div className="tabular-nums font-semibold" style={{ color: h.net < 0 ? "var(--ad-tehlike)" : "var(--ad-metin)" }}>{h.net < 0 ? "−" : ""}{kisaPara(Math.abs(h.net))}</div>
                                  <div className={cn("text-[10px] tabular-nums", AD.metin3)}>{yuzde(h.marj, 0)}</div>
                                </div>
                              ) : <span className={AD.metin3}>—</span>}
                            </td>
                          );
                        })}
                        <td className="px-4 py-2 text-right"><span className="tabular-nums font-bold" style={{ color: sat.toplamNet < 0 ? "var(--ad-tehlike)" : "var(--ad-basari)" }}>{sat.toplamNet < 0 ? "−" : ""}{kisaPara(Math.abs(sat.toplamNet))}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[color:var(--ad-kenar)] text-[12px]">
                    <td className={cn("px-4 py-2.5 font-semibold", AD.metin2)}>Plan toplamı</td>
                    {matris.tierToplam.map((t, i) => (
                      <td key={i} className="px-3 py-2.5 text-right">
                        <div className="tabular-nums font-bold" style={{ color: t.net < 0 ? "var(--ad-tehlike)" : "var(--ad-basari)" }}>{t.net < 0 ? "−" : ""}{kisaPara(Math.abs(t.net))}</div>
                        {t.zararSay > 0 && <div className="text-[10px] text-rose-400">{t.zararSay} zarar model</div>}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right tabular-nums font-bold" style={{ color: (toplamGelir - toplamMaliyet) < 0 ? "var(--ad-tehlike)" : "var(--ad-basari)" }}>{kisaPara(toplamGelir - toplamMaliyet)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Kart>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* COGS trend */}
            <Kart>
              <div className="mb-3 flex items-center justify-between">
                <h3 className={cn("flex items-center gap-2 text-sm font-bold", AD.metin)}><Activity className="h-4 w-4 text-[color:var(--ad-aksan)]" /> COGS oranı — 30 gün</h3>
                <span className="text-right"><span className="tabular-nums text-lg font-bold" style={{ color: cogsSonOran > 40 ? "var(--ad-uyari)" : "var(--ad-basari)" }}>{yuzde(cogsSonOran)}</span><span className={cn("ml-1.5 text-[11px]", AD.metin3)}>bugün</span></span>
              </div>
              <p className={cn("mb-3 text-[12px]", AD.metin3)}>Provider maliyeti / gelir. Düşük = sağlıklı marj.</p>
              <AlanGrafik veri={cogs.map((c) => c.oran)} renk="#a78bfa" yukseklik={120} etiketler={["30g", "20g", "10g", "bugün"]} />
            </Kart>

            {/* Net katkı barları */}
            <Kart>
              <h3 className={cn("mb-3 flex items-center gap-2 text-sm font-bold", AD.metin)}><DollarSign className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Model net katkı (30g)</h3>
              <div className="space-y-1.5">
                {statlar.slice(0, 12).map((s) => {
                  const max = Math.max(...statlar.map((x) => Math.abs(x.netKatki)), 1);
                  const negatif = s.netKatki < 0;
                  return (
                    <div key={s.model.id} className="flex items-center gap-2.5 text-[12px]">
                      <span className={cn("w-28 shrink-0 truncate", AD.metin2)}>{s.model.ad}</span>
                      <div className="h-3.5 flex-1 overflow-hidden rounded" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="h-full rounded" style={{ width: `${(Math.abs(s.netKatki) / max) * 100}%`, background: negatif ? "var(--ad-tehlike)" : "var(--ad-basari)" }} />
                      </div>
                      <span className="w-16 shrink-0 text-right tabular-nums" style={{ color: negatif ? "var(--ad-tehlike)" : "var(--ad-basari)" }}>{negatif ? "−" : ""}{kisaPara(Math.abs(s.netKatki))}</span>
                    </div>
                  );
                })}
              </div>
            </Kart>
          </div>

          {/* Ağır kullanıcılar */}
          <Kart className="!p-0 overflow-hidden">
            <div className="p-4 pb-3">
              <h3 className={cn("flex items-center gap-2 text-sm font-bold", AD.metin)}><Users className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Ağır kullanıcılar — ödediğinden fazla maliyet üretenler</h3>
              <p className={cn("mt-1 text-[12px]", AD.metin3)}>Provider maliyeti abonelik/paket gelirini aşan kullanıcılar. Fark = zarar.</p>
            </div>
            <div className="overflow-x-auto ad-ince-scroll">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-y border-[color:var(--ad-kenar)] text-left text-[11px] uppercase tracking-wider text-[color:var(--ad-metin-3)]">
                    <th className="px-4 py-2.5">Kullanıcı</th><th className="px-4 py-2.5">Plan</th><th className="px-4 py-2.5">Ülke</th>
                    <th className="px-4 py-2.5 text-right">Ödediği</th><th className="px-4 py-2.5 text-right">Maliyet</th><th className="px-4 py-2.5 text-right">Zarar</th><th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {agir.map((k) => (
                    <tr key={k.id} className="border-b border-[color:var(--ad-kenar)] last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/kullanicilar/${k.id}`} className={cn("font-medium hover:text-[color:var(--ad-aksan)]", AD.metin)}>{k.ad}</Link>
                        <div className={cn("text-[10px]", AD.metin3)}>{sayi(k.jobSayisi)} üretim</div>
                      </td>
                      <td className="px-4 py-2.5"><Rozet ton="mor">{k.plan}</Rozet></td>
                      <td className={cn("px-4 py-2.5 text-[13px]", AD.metin2)}>{k.ulke}</td>
                      <td className={cn("px-4 py-2.5 text-right tabular-nums", AD.metin2)}>{para(k.odenen)}</td>
                      <td className={cn("px-4 py-2.5 text-right tabular-nums", AD.metin)}>{para(k.maliyet)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-rose-400">−{para(k.fark)}</td>
                      <td className="px-4 py-2.5 text-right"><Link href={`/admin/kullanicilar/${k.id}`} className="inline-flex text-[color:var(--ad-metin-3)] hover:text-[color:var(--ad-aksan)]"><ChevronRight className="h-4 w-4" /></Link></td>
                    </tr>
                  ))}
                  {!agir.length && <tr><td colSpan={7} className={cn("px-4 py-6 text-center text-sm", AD.metin3)}>Zarar ettiren kullanıcı yok.</td></tr>}
                </tbody>
              </table>
            </div>
          </Kart>

          {/* What-If simülasyon */}
          <Kart className="max-w-xl">
            <h3 className={cn("mb-4 flex items-center gap-2 text-sm font-bold", AD.metin)}><Zap className="h-4 w-4 text-[color:var(--ad-aksan)]" /> What-If: Provider fiyat artışı → yeni marj</h3>
            <div className="mb-4">
              <label className={cn("mb-1.5 block text-[13px]", AD.metin2)}>Provider</label>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set(statlar.map((s) => s.model.saglayici))].map((sg) => (
                  <button key={sg} onClick={() => setWSaglayici(sg)} className={cn("rounded-full border px-3 py-1.5 text-[13px]", wSaglayici === sg ? "border-[color:var(--ad-aksan)]/50 bg-[color:var(--ad-aksan)]/10 text-[color:var(--ad-aksan)]" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)]")}>{sg}</button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <div className="mb-1.5 flex justify-between text-[13px]"><span className={AD.metin2}>{wSaglayici} fiyatı artarsa</span><span className={cn("tabular-nums font-bold", AD.metin)}>%{wArtis}</span></div>
              <input type="range" min={0} max={100} value={wArtis} onChange={(e) => setWArtis(+e.target.value)} className="w-full accent-[color:var(--ad-aksan)]" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[color:var(--ad-kenar)] p-3 text-center"><div className={cn("text-lg font-bold tabular-nums", AD.metin)}>{yuzde(wi.eskiMarj)}</div><div className={cn("text-[11px]", AD.metin3)}>mevcut marj</div></div>
              <div className="rounded-xl border border-[color:var(--ad-kenar)] p-3 text-center"><div className="text-lg font-bold tabular-nums" style={{ color: wi.yeniMarj < wi.eskiMarj - 5 ? "var(--ad-tehlike)" : "var(--ad-uyari)" }}>{yuzde(wi.yeniMarj)}</div><div className={cn("text-[11px]", AD.metin3)}>yeni marj</div></div>
              <div className="rounded-xl border border-rose-400/20 bg-rose-500/5 p-3 text-center"><div className="text-lg font-bold tabular-nums text-rose-400">−{kisaPara(wi.kayip)}</div><div className={cn("text-[11px]", AD.metin3)}>ek maliyet/ay</div></div>
            </div>
          </Kart>
        </div>
      )}

      {/* Providerlar */}
      {sekme === "provider" && (
        <div className="grid gap-4 md:grid-cols-2">
          {PROVIDERLAR.map((pr) => {
            const l = lat.find((x) => x.ad === pr.ad);
            const dusuk = pr.bakiyeUsd < pr.alarmEsigiUsd;
            return (
              <Kart key={pr.id}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--ad-aksan)]/12 text-[color:var(--ad-aksan)]"><Server className="h-4 w-4" /></span>
                    <div><div className={cn("font-semibold", AD.metin)}>{pr.ad}</div><div className={cn("text-[11px]", AD.metin3)}>öncelik {pr.oncelik}</div></div>
                  </div>
                  <div className="flex items-center gap-1.5"><DurumNokta ton={l && l.basariOran < 95 ? "uyari" : "basari"} nabiz /><span className={cn("text-[11px]", AD.metin3)}>{l?.basariOran}%</span></div>
                </div>
                <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                  <div><div className={cn("text-sm font-bold tabular-nums", dusuk ? "text-rose-400" : AD.metin)}>{dolar(pr.bakiyeUsd)}</div><div className={cn("text-[10px]", AD.metin3)}>bakiye</div></div>
                  <div><div className={cn("text-sm font-bold tabular-nums", AD.metin)}>{l?.p95}ms</div><div className={cn("text-[10px]", AD.metin3)}>p95</div></div>
                  <div><div className={cn("text-sm font-bold tabular-nums", AD.metin)}>{l?.devreKesici === "acik" ? "Açık" : "Kapalı"}</div><div className={cn("text-[10px]", AD.metin3)}>devre kesici</div></div>
                </div>
                <AlanGrafik veri={providerHarcamaSeri(pr.id)} renk="#a78bfa" yukseklik={60} />
                {dusuk && <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-[12px] text-rose-300"><Zap className="h-3.5 w-3.5" /> Bakiye eşik altında — yükleme gerek</div>}
              </Kart>
            );
          })}
        </div>
      )}

      {/* Failover */}
      {sekme === "failover" && (
        <Kart>
          <h3 className={cn("mb-4 flex items-center gap-2 text-sm font-bold", AD.metin)}><GitBranch className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Failover & Circuit Breaker kuralları</h3>
          <div className="space-y-2">
            {PROVIDERLAR.map((pr, i) => {
              const yedek = PROVIDERLAR[(i + 1) % PROVIDERLAR.length];
              const l = lat.find((x) => x.ad === pr.ad);
              return (
                <div key={pr.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[color:var(--ad-kenar)] p-3">
                  <DurumNokta ton={l?.devreKesici === "acik" ? "tehlike" : l?.devreKesici === "yarim" ? "uyari" : "basari"} />
                  <span className={cn("w-40 font-medium", AD.metin)}>{pr.ad}</span>
                  <span className={cn("text-[13px]", AD.metin3)}>hata &gt;%5 → </span>
                  <Rozet ton="aksan"><RefreshCcw className="h-3 w-3" /> {yedek.ad}</Rozet>
                  <span className={cn("ml-auto text-[12px]", AD.metin3)}>devre kesici: <b style={{ color: l?.devreKesici === "acik" ? "var(--ad-tehlike)" : "var(--ad-basari)" }}>{l?.devreKesici === "acik" ? "AÇIK" : l?.devreKesici === "yarim" ? "YARIM" : "kapalı"}</b></span>
                </div>
              );
            })}
          </div>
        </Kart>
      )}

      {/* What-If */}
      {sekme === "whatif" && (
        <Kart className="max-w-xl">
          <h3 className={cn("mb-4 flex items-center gap-2 text-sm font-bold", AD.metin)}><Zap className="h-4 w-4 text-[color:var(--ad-aksan)]" /> What-If: Provider fiyat artışı simülasyonu</h3>
          <div className="mb-4">
            <label className={cn("mb-1.5 block text-[13px]", AD.metin2)}>Provider</label>
            <div className="flex flex-wrap gap-1.5">
              {[...new Set(statlar.map((s) => s.model.saglayici))].map((sg) => (
                <button key={sg} onClick={() => setWSaglayici(sg)} className={cn("rounded-full border px-3 py-1.5 text-[13px]", wSaglayici === sg ? "border-[color:var(--ad-aksan)]/50 bg-[color:var(--ad-aksan)]/10 text-[color:var(--ad-aksan)]" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-2)]")}>{sg}</button>
              ))}
            </div>
          </div>
          <div className="mb-5">
            <div className="mb-1.5 flex justify-between text-[13px]"><span className={AD.metin2}>Fiyat artışı</span><span className={cn("tabular-nums font-bold", AD.metin)}>%{wArtis}</span></div>
            <input type="range" min={0} max={100} value={wArtis} onChange={(e) => setWArtis(+e.target.value)} className="w-full accent-[color:var(--ad-aksan)]" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-[color:var(--ad-kenar)] p-3 text-center"><div className={cn("text-lg font-bold tabular-nums", AD.metin)}>{yuzde(wi.eskiMarj)}</div><div className={cn("text-[11px]", AD.metin3)}>mevcut marj</div></div>
            <div className="rounded-xl border border-[color:var(--ad-kenar)] p-3 text-center"><div className="text-lg font-bold tabular-nums" style={{ color: wi.yeniMarj < wi.eskiMarj - 5 ? "var(--ad-tehlike)" : "var(--ad-uyari)" }}>{yuzde(wi.yeniMarj)}</div><div className={cn("text-[11px]", AD.metin3)}>yeni marj</div></div>
            <div className="rounded-xl border border-rose-400/20 bg-rose-500/5 p-3 text-center"><div className="text-lg font-bold tabular-nums text-rose-400">−{kisaPara(wi.kayip)}</div><div className={cn("text-[11px]", AD.metin3)}>ek maliyet/ay</div></div>
          </div>
        </Kart>
      )}

      {/* İade Kuralları */}
      {sekme === "iade" && (
        <Kart className="max-w-2xl">
          <h3 className={cn("mb-1 flex items-center gap-2 text-sm font-bold", AD.metin)}><RefreshCcw className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Otomatik kredi iadesi kuralları</h3>
          <p className={cn("mb-4 text-[13px]", AD.metin3)}>Hangi durumlarda otomatik iade yapılsın + oran. Anlık geçerli.</p>
          <div className="space-y-2">
            {mod.iadeKurallari.map((k) => (
              <div key={k.id} className="flex items-center gap-3 rounded-xl border border-[color:var(--ad-kenar)] p-3">
                <button onClick={() => iadeKuralToggle(k.id, k.ad)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", k.aktif ? "bg-emerald-500" : "bg-white/15")}>
                  <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", k.aktif ? "left-[22px]" : "left-0.5")} />
                </button>
                <span className={cn("flex-1 text-[13px]", AD.metin)}>{k.ad}</span>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={100} step={5} value={k.oran} onChange={(e) => mod.iadeOranAyarla(k.id, +e.target.value)} disabled={!k.aktif} className="w-24 accent-[color:var(--ad-aksan)] disabled:opacity-30" />
                  <span className={cn("w-10 text-right tabular-nums text-[13px] font-semibold", k.aktif ? AD.metin : AD.metin3)}>%{k.oran}</span>
                </div>
              </div>
            ))}
          </div>
        </Kart>
      )}
    </RotaGuard>
  );
}
