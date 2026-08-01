"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ListChecks, Layers, AlertTriangle, Gauge, Clock, Cpu, RefreshCcw, Coins, Zap,
} from "lucide-react";
import { RotaGuard } from "@/components/admin/RotaGuard";
import { BolumBaslik, MetrikKart, Kart, Sekmeler, Rozet, Dugme, AramaKutu, FiltreCip, AD, DurumNokta } from "@/components/admin/ui/temel";
import { Tablo, type Kolon } from "@/components/admin/ui/tablo";
import { CubukGrafik, YatayCubuk } from "@/components/admin/grafik";
import { useOnay } from "@/components/admin/ui/Onay";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import { useAdminJob } from "@/store/admin/useAdminJob";
import { veri, ozet, canliKuyruk } from "@/lib/admin/seed";
import { hataGruplari, stuckJoblar, saatlikHacim as saatlikHacimGercek } from "@/lib/admin/seed/jobDetay";
import { useProjeler } from "@/store/useProjeler";
import { JOB_DURUM, TUR_ETIKET } from "@/lib/admin/etiketler";
import { para, dolar, yuzde, sayi, goreceZaman } from "@/lib/admin/cekirdek";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { AdminJob } from "@/lib/admin/seed";

const DURUM_F = ["hepsi", "tamam", "isleniyor", "kuyrukta", "hata", "iptal"];

export default function Joblar() {
  const router = useRouter();
  const { onayIste } = useOnay();
  const oturum = useAdminOturum();
  const jobStore = useAdminJob();
  const evren = veri();
  const o = ozet();
  const gercekUretimler = useProjeler((s) => s.uretimler);
  const [sekme, setSekme] = useState("tumu");
  const [ara, setAra] = useState("");
  const [durum, setDurum] = useState("hepsi");
  const [tur, setTur] = useState("hepsi");

  const kuyruk = useMemo(() => canliKuyruk(), []);
  const hatalar = useMemo(() => hataGruplari(evren.joblar), [evren.joblar]);
  const stuck = useMemo(() => stuckJoblar(evren.joblar), [evren.joblar]);

  const liste = useMemo(() => {
    const q = ara.trim().toLowerCase();
    return evren.joblar.filter((j) => {
      if (durum !== "hepsi" && j.durum !== durum) return false;
      if (tur !== "hepsi" && j.tur !== tur) return false;
      if (q && !j.prompt.toLowerCase().includes(q) && !j.modelAd.toLowerCase().includes(q) && !j.id.includes(q)) return false;
      return true;
    }).slice(0, 3000);
  }, [evren.joblar, ara, durum, tur]);

  const modelKullanim = useMemo(() => {
    const say = new Map<string, number>();
    for (const j of evren.joblar) say.set(j.saglayici, (say.get(j.saglayici) ?? 0) + 1);
    return [...say.entries()].map(([etiket, deger]) => ({ etiket, deger, alt: sayi(deger) })).sort((a, b) => b.deger - a.deger).slice(0, 6);
  }, [evren.joblar]);

  const saatlikHacim = useMemo(() => saatlikHacimGercek(evren.joblar), [evren.joblar]);

  const admin = oturum.aktifAdmin ?? "admin";
  const denetle = (eylem: string, onem: "bilgi" | "uyari" | "kritik", hedef?: string) =>
    oturum.denetle({ admin, rol: oturum.aktifRol!, eylem, hedef, onem, arac: "manuel" });

  const jobAksiyon = async (j: AdminJob, tip: "iptal" | "yeniden" | "iade" | "oncelik") => {
    const risk = tip === "iade" ? 1 : 0;
    const etiket = { iptal: "Job'u iptal et", yeniden: "Ücretsiz yeniden çalıştır", iade: "Kredi iade et", oncelik: "Öncelik ver" }[tip];
    const ok = await onayIste({ baslik: etiket, aciklama: `${j.modelAd} · ${j.kredi} kredi · ${j.id}`, risk, eylemEtiket: "Uygula" });
    if (!ok) return;
    if (tip === "iptal") jobStore.durumDegistir(j.id, "iptal");
    if (tip === "yeniden") jobStore.durumDegistir(j.id, "kuyrukta");
    if (tip === "oncelik") jobStore.oncelikVer(j.id, 10);
    jobStore.islemEkle({ jobId: j.id, tur: tip === "yeniden" ? "retry" : tip === "iptal" ? "iptal" : tip === "iade" ? "iade" : "oncelik", yapan: admin, detay: etiket });
    denetle(etiket, "bilgi", j.id);
    toast.success("İşlem uygulandı");
  };

  const stuckTemizle = async () => {
    const ok = await onayIste({ baslik: "Stuck joblari toplu temizle", aciklama: `${stuck.length} takılı job iptal edilip kredi iade edilecek.`, risk: 1, eylemEtiket: "Temizle" });
    if (!ok) return;
    jobStore.toplu(stuck.map((j) => j.id), "iptal", admin, "iptal");
    denetle("Stuck joblar toplu temizlendi", "uyari", `${stuck.length} job`);
    toast.success(`${stuck.length} job temizlendi + iade yapıldı`);
  };

  const sekmeler = [
    { id: "tumu", ad: "Tüm Joblar", sayi: evren.joblar.length },
    { id: "kuyruk", ad: "Canlı Kuyruk", sayi: o.kuyruk + o.isleniyor },
    { id: "stuck", ad: "Başarısız & Stuck", sayi: stuck.length },
    { id: "performans", ad: "Performans" },
  ];

  const kolonlar: Kolon<AdminJob>[] = [
    { anahtar: "model", baslik: "Model / Prompt", render: (j) => (
      <div className="min-w-0"><div className="font-medium text-[color:var(--ad-metin)]">{j.modelAd}</div><div className={cn("truncate text-[11px]", AD.metin3)}>{j.prompt}</div></div>
    ) },
    { anahtar: "tur", baslik: "Tür", gizleMobil: true, render: (j) => <Rozet ton="notr">{TUR_ETIKET[j.tur] ?? j.tur}</Rozet> },
    { anahtar: "durum", baslik: "Durum", render: (j) => <span className="flex items-center gap-1.5"><DurumNokta ton={j.durum === "tamam" ? "basari" : j.durum === "hata" ? "tehlike" : j.durum === "isleniyor" ? "basari" : "uyari"} nabiz={j.durum === "isleniyor"} /><span className="text-[13px]">{JOB_DURUM[j.durum].ad}</span></span> },
    { anahtar: "kredi", baslik: "Kredi", hizala: "sag", gizleMobil: true, render: (j) => <span className="tabular-nums">{j.kredi}</span> },
    { anahtar: "maliyet", baslik: "Maliyet", hizala: "sag", gizleMobil: true, render: (j) => <span className={cn("tabular-nums text-[12px]", AD.metin3)}>{dolar(j.maliyetUsd)}</span> },
    { anahtar: "sure", baslik: "Süre", hizala: "sag", gizleMobil: true, render: (j) => <span className={cn("tabular-nums text-[12px]", AD.metin3)}>{(j.sureMs / 1000).toFixed(1)}sn</span> },
    { anahtar: "tarih", baslik: "Tarih", hizala: "sag", render: (j) => <span className={cn("text-[12px]", AD.metin3)}>{goreceZaman(j.olusturma)}</span> },
  ];

  return (
    <RotaGuard modul="joblar">
      <BolumBaslik baslik="Joblar" ozet={`${sayi(evren.joblar.length)} üretim işi${gercekUretimler.length ? ` · ${gercekUretimler.length} gerçek` : ""}`} ikon={ListChecks} />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetrikKart etiket="Job (24s)" deger="" sayacHedef={o.job24} ikon={ListChecks} delta={3.1} />
        <MetrikKart etiket="Başarı oranı" deger={yuzde(o.basariOran)} ikon={Gauge} delta={0.4} renk="basari" />
        <MetrikKart etiket="Kuyrukta" deger={sayi(o.kuyruk)} ikon={Layers} alt={`${o.isleniyor} işleniyor`} renk="uyari" />
        <MetrikKart etiket="Ort. süre" deger={o.ortSureSn.toFixed(1)} birim="sn" ikon={Clock} renk="mor" />
      </div>

      <div className="mb-3"><Sekmeler sekmeler={sekmeler} aktif={sekme} sec={setSekme} /></div>

      {/* Tüm Joblar */}
      {sekme === "tumu" && (
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <AramaKutu deger={ara} degis={setAra} yer="Prompt, model veya ID ara…" className="w-full sm:w-80" />
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {DURUM_F.map((d) => <FiltreCip key={d} aktif={durum === d} onClick={() => setDurum(d)}>{d === "hepsi" ? "Tüm durumlar" : JOB_DURUM[d].ad}</FiltreCip>)}
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {["hepsi", "video", "gorsel", "3d", "ses", "muzik"].map((t) => <FiltreCip key={t} aktif={tur === t} onClick={() => setTur(t)}>{t === "hepsi" ? "Tüm türler" : TUR_ETIKET[t]}</FiltreCip>)}
          </div>
          <p className={cn("mb-2 text-[13px]", AD.metin3)}>{sayi(liste.length)} sonuç</p>
          <Tablo kolonlar={kolonlar} satirlar={liste} satirTikla={(j) => router.push(`/admin/joblar/${j.id}`)} sayfaBoyut={25} />
        </div>
      )}

      {/* Canlı Kuyruk */}
      {sekme === "kuyruk" && (
        <div>
          <div className="mb-3 flex items-center gap-2"><DurumNokta ton="basari" nabiz /><span className={cn("text-[13px]", AD.metin3)}>Öncelik sırasına göre · tier bazlı</span></div>
          <div className="space-y-2">
            {kuyruk.map((j) => (
              <Kart key={j.id} className="!p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold" style={{ background: j.oncelik >= 7 ? "rgba(251,191,36,0.15)" : "rgba(85,214,253,0.12)", color: j.oncelik >= 7 ? "var(--ad-uyari)" : "var(--ad-aksan)" }}>{j.oncelik}</span>
                  <Link href={`/admin/joblar/${j.id}`} className="min-w-0 flex-1">
                    <div className={cn("text-[13px] font-medium hover:text-[color:var(--ad-aksan)]", AD.metin)}>{j.modelAd}</div>
                    <div className={cn("truncate text-[11px]", AD.metin3)}>{j.prompt}</div>
                  </Link>
                  <Rozet ton={j.durum === "isleniyor" ? "aksan" : "uyari"}>{JOB_DURUM[j.durum].ad}</Rozet>
                  <span className={cn("text-[12px] tabular-nums", AD.metin3)}>bekleme {(j.beklemeMs / 1000).toFixed(0)}sn</span>
                  <Dugme boyut="sm" tur="glass" ikon={Zap} onClick={() => jobAksiyon(j, "oncelik")}>Öncelik ver</Dugme>
                </div>
              </Kart>
            ))}
          </div>
        </div>
      )}

      {/* Başarısız & Stuck */}
      {sekme === "stuck" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Kart>
            <h3 className={cn("mb-3 flex items-center gap-2 text-sm font-bold", AD.metin)}><AlertTriangle className="h-4 w-4 text-rose-400" /> Hata dağılımı (son 24s)</h3>
            {hatalar.length ? (
              <div className="space-y-2">
                {hatalar.map((h) => (
                  <div key={h.kod} className="flex items-center justify-between rounded-lg border border-[color:var(--ad-kenar)] p-2.5">
                    <span className="font-mono text-[13px] text-rose-300">{h.kod}</span>
                    <Rozet ton="tehlike">{h.sayi} kez</Rozet>
                  </div>
                ))}
              </div>
            ) : <p className={cn("py-4 text-center text-sm", AD.metin3)}>Son 24s hata yok.</p>}
          </Kart>
          <Kart>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={cn("flex items-center gap-2 text-sm font-bold", AD.metin)}><Cpu className="h-4 w-4 text-amber-400" /> Takılı (stuck) joblar</h3>
              {stuck.length > 0 && <Dugme boyut="sm" tur="tehlike" ikon={RefreshCcw} onClick={stuckTemizle}>Toplu temizle</Dugme>}
            </div>
            {stuck.length ? (
              <div className="space-y-2">
                {stuck.map((j) => (
                  <div key={j.id} className="flex items-center gap-2.5 rounded-lg border border-[color:var(--ad-kenar)] p-2.5">
                    <DurumNokta ton="uyari" nabiz />
                    <Link href={`/admin/joblar/${j.id}`} className="min-w-0 flex-1"><div className={cn("truncate text-[13px]", AD.metin)}>{j.modelAd}</div></Link>
                    <span className={cn("text-[12px] tabular-nums text-amber-300")}>{(j.sureMs / 60000).toFixed(0)}dk</span>
                    <div className="flex gap-1">
                      <Dugme boyut="sm" tur="glass" onClick={() => jobAksiyon(j, "yeniden")}>Retry</Dugme>
                      <Dugme boyut="sm" tur="glass" onClick={() => jobAksiyon(j, "iade")}>İade</Dugme>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className={cn("py-4 text-center text-sm", AD.metin3)}>Takılı job yok.</p>}
          </Kart>
        </div>
      )}

      {/* Performans */}
      {sekme === "performans" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Kart>
            <h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Saatlik generation hacmi</h3>
            <CubukGrafik veri={saatlikHacim} yukseklik={160} />
          </Kart>
          <Kart>
            <h3 className={cn("mb-4 text-sm font-bold", AD.metin)}>Provider bazlı job hacmi</h3>
            <YatayCubuk veri={modelKullanim} renk="#a78bfa" />
          </Kart>
          <Kart className="lg:col-span-2">
            <h3 className={cn("mb-3 text-sm font-bold", AD.metin)}>Özet metrikler</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { e: "Ort. job süresi", d: `${o.ortSureSn.toFixed(1)}sn`, i: Clock },
                { e: "Başarı oranı", d: yuzde(o.basariOran), i: Gauge },
                { e: "Toplam job", d: sayi(o.toplamJob), i: ListChecks },
                { e: "Toplam maliyet", d: para(evren.joblar.reduce((a, j) => a + j.maliyetUsd * 33, 0)), i: Coins },
              ].map((m) => (
                <div key={m.e} className="rounded-xl border border-[color:var(--ad-kenar)] p-3 text-center">
                  <m.i className="mx-auto mb-1.5 h-4 w-4 text-[color:var(--ad-aksan)]" />
                  <div className={cn("text-lg font-bold tabular-nums", AD.metin)}>{m.d}</div>
                  <div className={cn("text-[11px]", AD.metin3)}>{m.e}</div>
                </div>
              ))}
            </div>
          </Kart>
        </div>
      )}
    </RotaGuard>
  );
}
