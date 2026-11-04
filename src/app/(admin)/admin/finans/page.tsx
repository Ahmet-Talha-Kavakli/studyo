"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Wallet, CreditCard, RefreshCcw, Receipt, Package, AlertTriangle, TrendingUp, TrendingDown, Percent,
  Layers, Pause, Play, Tag, Pencil, Check, LineChart, Server,
} from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { BolumBaslik, MetrikKart, Kart, Sekmeler, Rozet, Dugme, AD, AramaKutu, FiltreCip } from "@/components/admin/ui/temel";
import { Tablo, type Kolon } from "@/components/admin/ui/tablo";
import { PLTablo } from "@/components/admin/pano/PLTablo";
import { AlanGrafik, DonutGrafik } from "@/components/admin/grafik";
import { useOnay } from "@/components/admin/ui/Onay";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import { useAdminModeller } from "@/store/admin/useAdminModeller";
import { useAdminAbonelik } from "@/store/admin/useAdminAbonelik";
import { PlanlarSekmesi } from "@/components/admin/finans/PlanlarSekmesi";
import { veri, ozet } from "@/lib/admin/seed";
import { plTablo, planGelir } from "@/lib/admin/seed/finans";
import { nakitProjeksiyon } from "@/lib/admin/seed/panolar";
import { PROVIDERLAR } from "@/lib/admin/tablolar";
import {
  uretAbonelikler, uretIadeler, uretRetryler, vergiRapor, bakiyeAnomalileri,
  type Abonelik, type IadeKayit, type RetryKayit,
} from "@/lib/admin/seed/abonelik";
import { aksiyonRisk } from "@/lib/admin/guvenlik/roller";
import { para, kisaPara, yuzde, sayi, dolar, goreceZaman, tarihEtiket } from "@/lib/admin/cekirdek";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const ABO_DURUM = { active: { ad: "Aktif", ton: "basari" }, trialing: { ad: "Deneme", ton: "aksan" }, past_due: { ad: "Gecikmiş", ton: "uyari" }, canceled: { ad: "İptal", ton: "notr" }, paused: { ad: "Duraklatıldı", ton: "mor" } } as const;

export default function Finans() {
  const { onayIste } = useOnay();
  const oturum = useAdminOturum();
  const modStore = useAdminModeller();
  const aboStore = useAdminAbonelik();
  const evren = veri();
  const o = ozet();
  const [sekme, setSekme] = useState("ozet");
  const [aboAra, setAboAra] = useState("");
  const [aboDurum, setAboDurum] = useState("hepsi");

  const pl = useMemo(() => plTablo(evren.seri), [evren.seri]);
  const planPay = useMemo(() => planGelir(evren.kullanicilar), [evren.kullanicilar]);
  const abonelikBaz = useMemo(() => uretAbonelikler(evren), [evren]);
  // Efektif durum: store delta seed üstüne
  const abonelikler = useMemo(
    () => abonelikBaz.map((a) => ({ ...a, durum: (aboStore.durumGetir(a.id) ?? a.durum) as Abonelik["durum"] })),
    [abonelikBaz, aboStore],
  );
  const iadeler = useMemo(() => uretIadeler(evren), [evren]);
  const retryler = useMemo(() => uretRetryler(evren), [evren]);
  const vergi = useMemo(() => vergiRapor(evren), [evren]);
  const anomaliler = useMemo(() => bakiyeAnomalileri(evren), [evren]);
  const nakit = useMemo(() => nakitProjeksiyon(o.mrr, o.churnOran), [o.mrr, o.churnOran]);
  // Provider bakiye + günlük ~yakma ile tahmini tükenme (deterministik: bakiyenin ~%2,4'ü/gün)
  const providerBakiye = useMemo(
    () => PROVIDERLAR.map((p) => {
      const gunlukYakim = Math.max(1, Math.round(p.bakiyeUsd * 0.024));
      return { ...p, gunlukYakim, tukenmeGun: Math.floor(p.bakiyeUsd / gunlukYakim), dusuk: p.bakiyeUsd < p.alarmEsigiUsd };
    }).sort((a, b) => a.tukenmeGun - b.tukenmeGun),
    [],
  );
  const toplamBakiye = providerBakiye.reduce((a, p) => a + p.bakiyeUsd, 0);

  const iadeOran = useMemo(() => {
    const cb = iadeler.filter((i) => i.tur === "chargeback").length;
    return (cb / abonelikler.length) * 100;
  }, [iadeler, abonelikler]);

  const aboListe = useMemo(() => {
    const q = aboAra.trim().toLowerCase();
    return abonelikler.filter((a) => (aboDurum === "hepsi" || a.durum === aboDurum) && (!q || a.ad.toLowerCase().includes(q)));
  }, [abonelikler, aboAra, aboDurum]);

  const admin = oturum.aktifAdmin ?? "admin";
  const denetle = (eylem: string, onem: "bilgi" | "uyari" | "kritik", hedef?: string) =>
    oturum.denetle({ admin, rol: oturum.aktifRol!, eylem, hedef, onem, arac: "manuel" });

  // Abonelik aksiyonları — GERÇEK store'a yazar, durum efektif değişir
  const aboAksiyon = async (a: Abonelik, tip: "iptal" | "duraklat" | "yeniden" | "indirim") => {
    if (tip === "indirim") {
      const ok = await onayIste({ baslik: "İndirim uygula", aciklama: `${a.ad} aboneliğine %20 sadakat indirimi uygulanır.`, risk: 0, eylemEtiket: "Uygula" });
      if (!ok) return;
      aboStore.indirimUygula(a.id, 20, admin);
      denetle("Abonelik indirimi (%20)", "bilgi", a.ad);
      toast.success("İndirim uygulandı", { description: `${a.ad} aboneliğine %20 sadakat indirimi tanımlandı.` });
      return;
    }
    const risk = aksiyonRisk("abonelik_iptal");
    const yeniDurum = tip === "iptal" ? "canceled" : tip === "duraklat" ? "paused" : "active";
    const ok = await onayIste({
      baslik: tip === "iptal" ? "Aboneliği iptal et" : tip === "duraklat" ? "Aboneliği duraklat" : "Aboneliği yeniden başlat",
      aciklama: `${a.ad} · ${para(a.tutar)}/ay. ${tip === "iptal" ? "Dönem sonunda iptal edilir." : ""}`,
      risk: tip === "iptal" ? risk.risk : 0, eylemEtiket: "Uygula",
    });
    if (!ok) return;
    aboStore.durumDegistir(a.id, yeniDurum, admin, `${tip} · ${a.ad}`);
    denetle(`Abonelik ${tip}`, "uyari", a.ad);
    toast.success(tip === "iptal" ? "Abonelik iptal edildi" : tip === "duraklat" ? "Abonelik duraklatıldı" : "Abonelik yeniden başlatıldı", { description: tip === "iptal" ? `${a.ad} aboneliği dönem sonunda sona erecek.` : a.ad });
  };

  const iadeKarar = async (i: IadeKayit, onay: boolean) => {
    const risk = aksiyonRisk("iade_yap");
    const ok = await onayIste({ baslik: onay ? "İadeyi onayla" : "İadeyi reddet", aciklama: `${i.ad} · ${para(i.tutar)} · ${i.sebepKategori}`, risk: onay ? risk.risk : 0, eylemEtiket: onay ? "Onayla" : "Reddet" });
    if (!ok) return;
    denetle(`İade ${onay ? "onaylandı" : "reddedildi"}`, "kritik", i.ad);
    toast.success(onay ? "İade onaylandı" : "İade reddedildi", { description: `${i.ad} · ${para(i.tutar)}` });
  };

  const retryAksiyon = async (rt: RetryKayit, tip: string) => {
    const ok = await onayIste({ baslik: `Ödeme: ${tip}`, aciklama: `${rt.ad} · ${para(rt.tutar)} · ${rt.denemeSayisi}. deneme`, risk: 0, eylemEtiket: "Uygula" });
    if (!ok) return;
    denetle(`Retry ${tip}`, "bilgi", rt.ad);
    toast.success(tip === "süre tanı" ? "Ödeme için süre tanındı" : "Ödeme yeniden denendi", { description: `${rt.ad} · ${para(rt.tutar)}` });
  };

  const paketToggle = (id: string, gorunur: boolean) => { modStore.paketGuncelle(id, { gorunur }); toast.success(gorunur ? "Paket görünür yapıldı" : "Paket gizlendi"); };

  const sekmeler = [
    { id: "ozet", ad: "Özet & P&L" },
    { id: "planlar", ad: "Planlar" },
    { id: "abonelik", ad: "Abonelikler", sayi: abonelikler.length },
    { id: "iade", ad: "İade & Chargeback", sayi: iadeler.length },
    { id: "retry", ad: "Başarısız & Retry", sayi: retryler.length },
    { id: "vergi", ad: "Vergi (KDV)" },
    { id: "paket", ad: "Kredi Paketleri" },
    { id: "anomali", ad: "Anomaliler", sayi: anomaliler.length },
  ];

  // ── Tablolar ──
  const aboKolon: Kolon<Abonelik>[] = [
    { anahtar: "ad", baslik: "Kullanıcı", render: (a) => <Link href={`/admin/kullanicilar/${a.kullaniciId}`} className={cn("font-medium hover:text-[color:var(--ad-aksan)]", AD.metin)}>{a.ad}</Link> },
    { anahtar: "durum", baslik: "Durum", render: (a) => <Rozet ton={ABO_DURUM[a.durum].ton}>{ABO_DURUM[a.durum].ad}</Rozet> },
    { anahtar: "tutar", baslik: "Tutar/ay", hizala: "sag", render: (a) => <span className="tabular-nums">{para(a.tutar)}</span> },
    { anahtar: "yenileme", baslik: "Yenileme", hizala: "sag", gizleMobil: true, render: (a) => <span className={cn("text-[12px]", AD.metin3)}>{a.durum === "canceled" ? "—" : goreceZaman(a.sonrakiYenileme).replace("önce", "sonra")}</span> },
    { anahtar: "sayi", baslik: "#", hizala: "sag", gizleMobil: true, render: (a) => <span className="tabular-nums">{a.yenilemeSayisi}</span> },
    { anahtar: "mrr", baslik: "MRR", hizala: "sag", gizleMobil: true, render: (a) => <span className="tabular-nums">{para(a.mrrKatki)}</span> },
    { anahtar: "aksiyon", baslik: "", hizala: "sag", render: (a) => (
      <div className="flex justify-end gap-1">
        {a.durum === "active" && <>
          <Dugme boyut="sm" tur="glass" ikon={Tag} onClick={() => aboAksiyon(a, "indirim")}>İndirim</Dugme>
          <Dugme boyut="sm" tur="glass" ikon={Pause} onClick={() => aboAksiyon(a, "duraklat")}>Duraklat</Dugme>
          <Dugme boyut="sm" tur="glass" onClick={() => aboAksiyon(a, "iptal")}>İptal</Dugme>
        </>}
        {a.durum === "paused" && <Dugme boyut="sm" tur="glass" ikon={Play} onClick={() => aboAksiyon(a, "yeniden")}>Sürdür</Dugme>}
        {a.durum === "canceled" && <Dugme boyut="sm" tur="glass" onClick={() => aboAksiyon(a, "yeniden")}>Yeniden</Dugme>}
      </div>
    ) },
  ];

  return (
    <RotaGuard modul="finans">
      <BolumBaslik baslik="Finans" ozet="Gelir, abonelik, iade ve vergi yönetimi" ikon={Wallet} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="MRR" deger={kisaPara(o.mrr)} ikon={Wallet} delta={8.2} alt={`ARR ${kisaPara(o.arr)}`} renk="basari" />
        <MetrikKart etiket="Net kâr (30g)" deger={kisaPara(o.kar30)} ikon={TrendingUp} delta={6.7} alt={`marj ${yuzde(o.karMarji)}`} renk="basari" />
        <MetrikKart etiket="Chargeback oranı" deger={yuzde(iadeOran)} ikon={TrendingDown} delta={-0.3} alt={iadeOran > 1 ? "Stripe risk eşiği!" : "sağlıklı"} renk={iadeOran > 1 ? "tehlike" : "aksan"} />
        <MetrikKart etiket="ARPU" deger={para(o.arpu)} ikon={Percent} delta={2.2} alt="abone başına" renk="mor" />
      </div>

      <div className="mb-3"><Sekmeler sekmeler={sekmeler} aktif={sekme} sec={setSekme} /></div>

      {/* Özet & P&L */}
      {sekme === "ozet" && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Kart className="lg:col-span-2">
              <h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Gelir & Net Kâr — 90 gün</h3>
              <AlanGrafik veri={evren.seri.map((g) => g.gelir)} yukseklik={150} />
              <div className="mt-3 border-t border-[color:var(--ad-kenar)] pt-3"><AlanGrafik veri={evren.seri.map((g) => g.gelir - g.maliyet)} renk="#34d399" yukseklik={90} /></div>
            </Kart>
            <Kart><h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Aylık P&amp;L</h3><PLTablo satirlar={pl} /></Kart>
            <Kart><h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Plan bazlı gelir</h3><DonutGrafik veri={planPay} /></Kart>
          </div>

          {/* Nakit projeksiyonu + Provider bakiye — YENİ */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Kart className="lg:col-span-2">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className={cn("flex items-center gap-2 text-sm font-bold", AD.metin)}><LineChart className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Nakit projeksiyonu — 6 ay (kümülatif)</h3>
                <span className="text-right"><span className={cn("tabular-nums text-lg font-bold", AD.metin)}>{kisaPara(nakit[nakit.length - 1].deger)}</span><span className={cn("ml-1.5 text-[11px]", AD.metin3)}>6 ay sonu</span></span>
              </div>
              <p className={cn("mb-3 text-[12px]", AD.metin3)}>Mevcut MRR {kisaPara(o.mrr)} + net büyüme − churn %{o.churnOran.toFixed(1)} varsayımıyla kümülatif nakit girişi.</p>
              <AlanGrafik veri={nakit.map((n) => n.deger)} renk="#34d399" yukseklik={130} etiketler={nakit.map((n) => n.ay)} />
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[color:var(--ad-kenar)] pt-3 sm:grid-cols-6">
                {nakit.map((n) => (
                  <div key={n.ay} className="text-center">
                    <div className={cn("text-[10px] uppercase", AD.metin3)}>{n.ay}</div>
                    <div className={cn("tabular-nums text-[12px] font-semibold", AD.metin2)}>{kisaPara(n.deger)}</div>
                  </div>
                ))}
              </div>
            </Kart>

            <Kart>
              <div className="mb-3 flex items-center justify-between">
                <h3 className={cn("flex items-center gap-2 text-sm font-bold", AD.metin)}><Server className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Provider bakiye</h3>
                <span className={cn("tabular-nums text-[13px] font-semibold", AD.metin)}>{dolar(toplamBakiye)}</span>
              </div>
              <p className={cn("mb-3 text-[12px]", AD.metin3)}>Tahmini tükenme süresine göre sıralı.</p>
              <div className="space-y-2">
                {providerBakiye.map((p) => (
                  <div key={p.id} className="rounded-xl border border-[color:var(--ad-kenar)] p-2.5">
                    <div className="flex items-center justify-between">
                      <span className={cn("text-[13px] font-medium", AD.metin)}>{p.ad}</span>
                      <span className={cn("tabular-nums text-[13px] font-semibold", p.dusuk ? "text-rose-400" : AD.metin)}>{dolar(p.bakiyeUsd)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className={AD.metin3}>~{dolar(p.gunlukYakim)}/gün</span>
                      <span className={cn("tabular-nums font-medium", p.tukenmeGun < 15 ? "text-rose-400" : p.tukenmeGun < 30 ? "text-amber-400" : AD.metin3)}>~{p.tukenmeGun} gün kaldı</span>
                    </div>
                    {p.dusuk && <div className="mt-1.5 flex items-center gap-1 text-[11px] text-rose-300"><AlertTriangle className="h-3 w-3" /> Eşik altında — yükleme gerek</div>}
                  </div>
                ))}
              </div>
            </Kart>
          </div>
        </div>
      )}

      {/* Planlar — CRUD */}
      {sekme === "planlar" && <PlanlarSekmesi />}

      {/* Abonelikler */}
      {sekme === "abonelik" && (
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <AramaKutu deger={aboAra} degis={setAboAra} yer="Kullanıcı ara…" className="w-full sm:w-72" />
            <div className="flex flex-wrap gap-1.5">
              {["hepsi", "active", "trialing", "past_due", "canceled", "paused"].map((d) => (
                <FiltreCip key={d} aktif={aboDurum === d} onClick={() => setAboDurum(d)}>{d === "hepsi" ? "Hepsi" : ABO_DURUM[d as keyof typeof ABO_DURUM].ad}</FiltreCip>
              ))}
            </div>
          </div>
          <p className={cn("mb-2 text-[13px]", AD.metin3)}>{sayi(aboListe.length)} abonelik</p>
          <Tablo kolonlar={aboKolon} satirlar={aboListe} sayfaBoyut={20} />
        </div>
      )}

      {/* İade & Chargeback */}
      {sekme === "iade" && (
        <div className="space-y-2">
          {iadeler.slice(0, 40).map((i) => (
            <Kart key={i.id} className="!p-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: i.tur === "chargeback" ? "rgba(248,113,113,0.12)" : "rgba(85,214,253,0.12)", color: i.tur === "chargeback" ? "var(--ad-tehlike)" : "var(--ad-aksan)" }}>
                  {i.tur === "chargeback" ? <AlertTriangle className="h-4 w-4" /> : <RefreshCcw className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/kullanicilar/${i.kullaniciId}`} className={cn("text-[13px] font-medium hover:text-[color:var(--ad-aksan)]", AD.metin)}>{i.ad}</Link>
                  <div className={cn("text-[11px]", AD.metin3)}>{i.sebepKategori} · {goreceZaman(i.tarih)}{i.sonTarih && ` · dispute son: ${tarihEtiket(i.sonTarih)}`}</div>
                </div>
                <Rozet ton={i.tur === "chargeback" ? "tehlike" : "aksan"}>{i.tur}</Rozet>
                <span className={cn("tabular-nums font-semibold", AD.metin)}>{para(i.tutar)}</span>
                <Rozet ton={i.durum === "onaylandi" ? "basari" : i.durum === "reddedildi" ? "tehlike" : i.durum === "dispute" ? "uyari" : "notr"}>{i.durum}</Rozet>
                {i.durum === "beklemede" && (
                  <div className="flex gap-1">
                    <Dugme boyut="sm" onClick={() => iadeKarar(i, true)}>Onayla</Dugme>
                    <Dugme boyut="sm" tur="tehlike" onClick={() => iadeKarar(i, false)}>Reddet</Dugme>
                  </div>
                )}
              </div>
            </Kart>
          ))}
        </div>
      )}

      {/* Retry */}
      {sekme === "retry" && (
        <div className="space-y-2">
          {retryler.map((rt) => (
            <Kart key={rt.id} className="!p-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/12 text-amber-400"><CreditCard className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/kullanicilar/${rt.kullaniciId}`} className={cn("text-[13px] font-medium hover:text-[color:var(--ad-aksan)]", AD.metin)}>{rt.ad}</Link>
                  <div className={cn("text-[11px]", AD.metin3)}>{rt.denemeSayisi}. deneme · {rt.gonderilenMail} mail gönderildi · sonraki: {tarihEtiket(rt.sonrakiDeneme)}</div>
                </div>
                <span className={cn("tabular-nums font-semibold", AD.metin)}>{para(rt.tutar)}</span>
                <Rozet ton={rt.durum === "kurtarildi" ? "basari" : rt.durum === "iptal" ? "tehlike" : "uyari"}>{rt.durum}</Rozet>
                {rt.durum === "retry" && (
                  <div className="flex gap-1">
                    <Dugme boyut="sm" onClick={() => retryAksiyon(rt, "yeniden dene")}>Yeniden dene</Dugme>
                    <Dugme boyut="sm" tur="glass" onClick={() => retryAksiyon(rt, "süre tanı")}>Süre tanı</Dugme>
                  </div>
                )}
              </div>
            </Kart>
          ))}
        </div>
      )}

      {/* Vergi */}
      {sekme === "vergi" && (
        <Kart>
          <div className="mb-3 flex items-center justify-between">
            <h3 className={cn("flex items-center gap-2 text-sm font-bold", AD.metin)}><Receipt className="h-4 w-4 text-[color:var(--ad-aksan)]" /> Ülke bazlı KDV/VAT raporu (aylık)</h3>
            <span className={cn("text-[13px]", AD.metin3)}>Toplam vergi: <b className={AD.metin}>{para(vergi.reduce((a, v) => a + v.vergi, 0))}</b></span>
          </div>
          <div className="overflow-x-auto ad-ince-scroll">
            <table className="w-full min-w-[480px] text-sm">
              <thead><tr className="border-b border-[color:var(--ad-kenar)] text-left text-[11px] uppercase tracking-wider text-[color:var(--ad-metin-3)]">
                <th className="py-2">Ülke</th><th className="py-2 text-right">KDV %</th><th className="py-2 text-right">Matrah</th><th className="py-2 text-right">Vergi</th>
              </tr></thead>
              <tbody>
                {vergi.map((v) => (
                  <tr key={v.kod} className="border-b border-[color:var(--ad-kenar)] last:border-0">
                    <td className="py-2.5 text-[color:var(--ad-metin)]">{v.ulke}</td>
                    <td className="py-2.5 text-right tabular-nums text-[color:var(--ad-metin-2)]">%{v.oran}</td>
                    <td className="py-2.5 text-right tabular-nums text-[color:var(--ad-metin)]">{para(v.matrah)}</td>
                    <td className="py-2.5 text-right tabular-nums font-semibold text-[color:var(--ad-aksan)]">{para(v.vergi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Kart>
      )}

      {/* Kredi Paketleri */}
      {sekme === "paket" && (
        <div>
          <p className={cn("mb-3 text-sm", AD.metin3)}>Tek seferlik satın alınan kredi paketleri. Görünürlük anlık değişir.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[...modStore.paketler].sort((a, b) => a.sira - b.sira).map((p) => (
              <Kart key={p.id} className={cn(p.populer && "!border-[color:var(--ad-aksan)]/40")}>
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--ad-aksan)]/12 text-[color:var(--ad-aksan)]"><Package className="h-4 w-4" /></span>
                  {p.populer && <Rozet ton="aksan">Popüler</Rozet>}
                </div>
                <div className={cn("mt-3 text-lg font-bold", AD.metin)}>{p.ad}</div>
                <div className={cn("text-sm", AD.metin2)}>{sayi(p.kredi)} kredi {p.bonus > 0 && <span className="text-emerald-400">+%{p.bonus} bonus</span>}</div>
                <div className={cn("mt-1 text-xl font-bold", AD.metin)}>{para(p.fiyatTRY)}</div>
                <button onClick={() => paketToggle(p.id, !p.gorunur)}
                  className={cn("mt-3 w-full rounded-lg border py-1.5 text-[13px] font-semibold transition-colors", p.gorunur ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300" : "border-[color:var(--ad-kenar)] text-[color:var(--ad-metin-3)]")}>
                  {p.gorunur ? "Görünür" : "Gizli"}
                </button>
              </Kart>
            ))}
          </div>
        </div>
      )}

      {/* Anomaliler */}
      {sekme === "anomali" && (
        <div className="space-y-2">
          {anomaliler.map((a, i) => (
            <Kart key={i} className="!p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/12 text-rose-400"><AlertTriangle className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/kullanicilar/${a.kullaniciId}`} className={cn("text-[13px] font-medium hover:text-[color:var(--ad-aksan)]", AD.metin)}>{a.ad}</Link>
                  <div className={cn("text-[11px]", AD.metin3)}>{a.detay}</div>
                </div>
                <Rozet ton={a.tip === "negatif" || a.tip === "hizli_tuketim" ? "tehlike" : "uyari"}>{a.tip === "negatif" ? "Negatif" : a.tip === "asiri_yuksek" ? "Aşırı yüksek" : a.tip === "tutarsiz" ? "Tutarsız" : "Hızlı tüketim"}</Rozet>
                <span className={cn("tabular-nums font-semibold", AD.metin)}>{sayi(a.deger)}</span>
              </div>
            </Kart>
          ))}
          {!anomaliler.length && <Kart><p className={cn("py-6 text-center text-sm", AD.metin3)}>Anomali tespit edilmedi.</p></Kart>}
        </div>
      )}
    </RotaGuard>
  );
}
