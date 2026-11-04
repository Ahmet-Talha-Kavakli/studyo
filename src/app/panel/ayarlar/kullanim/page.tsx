"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Check, Download, Plus } from "lucide-react";
import { useAuth, krediDurum } from "@/store/useAuth";
import { useProjeler } from "@/store/useProjeler";
import { useApiAnahtar } from "@/store/useApiAnahtar";
import { useTercih } from "@/store/useTercih";
import { useHesapKaydi } from "@/components/ayarlar/AyarKabugu";
import { Anahtar, Grup, Hap, Satir, Sayfa, Segment, dugme, akis, kaydedildi } from "@/components/ayarlar/ui";
import { goreli } from "@/components/api/ui";
import { CubukGrafik, gunKovalari, type Cubuk } from "@/components/api/grafik";
import { KrediJeton } from "@/components/ui/KrediHap";
import { MODELLER } from "@/lib/catalog";
import { MODEL_TURLERI, SAGLAYICI_LOGO, VAYRA_LOGO, KREDI_PAKETLERI, tl, sayi } from "@/lib/fiyat";
import { OTO_YUKLEME_ESIGI } from "@/lib/bildirimler";
import { sonrakiYenileme, tarih } from "@/lib/ayarlar";
import { metinIndir } from "@/lib/gercekEylem";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { cn } from "@/lib/utils";

/** Seriler koyu yüzeyde doğrulandı: stüdyo camgöbeği, API turuncu; her zaman etiketle gösterilir. */
const RENK = { studyo: "#55d6fd", api: "#f08a4b" };
const TUR_RENK: Record<string, string> = { gorsel: "#a78bfa", video: "#55d6fd", ses: "#fbbf24", muzik: "#f472b6", "3d": "#34d399" };
const GUN = 86_400_000;
type Kayit = { zaman: number; kredi: number; kaynak: "studyo" | "api"; model: string; tur: string; basarili: boolean };
const modelAd = (id: string) => MODELLER.find((m) => m.id === id || m.ad === id)?.ad ?? id;
const modelLogo = (id: string) => SAGLAYICI_LOGO[MODELLER.find((m) => m.id === id || m.ad === id)?.saglayici ?? ""] ?? VAYRA_LOGO;
const TUR_AD: Record<string, string> = Object.fromEntries(MODEL_TURLERI.map((t) => [t.id, t.ad]));

export default function KrediKullanim() {
  const kullanici = useAuth((s) => s.kullanici)!;
  const { kayit } = useHesapKaydi();
  const uretimler = useProjeler((s) => s.uretimler);
  const cop = useProjeler((s) => s.cop);
  const api = useApiAnahtar((s) => s.uretimler);
  const otomatik = useTercih((s) => s.otomatikYukleme);
  const otoToggle = useTercih((s) => s.otomatikYuklemeToggle);
  const otoPaket = useTercih((s) => s.otoPaket);
  const esik = useTercih((s) => s.krediEsigi);
  const tAyarla = useTercih((s) => s.gorunumAyarla);
  const [gun, setGun] = useState<"7" | "30" | "90">("30");
  const g = +gun;

  // Gerçek harcama: stüdyo üretimleri (çöptekiler dahil) ve canlı API çağrıları. Örnek içerik sayılmaz.
  const kayitlar = useMemo<Kayit[]>(() => [
    ...[...uretimler, ...cop].filter((u) => !u.id.startsWith("seed_") && u.kredi > 0).map((u) => ({ zaman: u.olusturma, kredi: u.durum === "hata" ? 0 : u.kredi, kaynak: "studyo" as const, model: u.model, tur: u.tur, basarili: u.durum !== "hata" })),
    ...api.filter((a) => a.environment === "live" && a.credits > 0).map((a) => ({ zaman: Date.parse(a.created_at), kredi: a.status === "succeeded" ? a.credits : 0, kaynak: "api" as const, model: a.model, tur: a.type === "image" ? "gorsel" : a.type === "audio" ? "ses" : a.type, basarili: a.status === "succeeded" })),
  ], [uretimler, cop, api]);

  const kovalar = gunKovalari(g);
  const bas = kovalar[0].bas;
  const aralik = kayitlar.filter((k) => k.zaman >= bas).sort((a, b) => b.zaman - a.zaman);
  const toplam = aralik.reduce((a, k) => a + k.kredi, 0);
  const oncekiToplam = kayitlar.filter((k) => k.zaman >= bas - g * GUN && k.zaman < bas).reduce((a, k) => a + k.kredi, 0);
  const degisim = oncekiToplam ? Math.round(((toplam - oncekiToplam) / oncekiToplam) * 100) : null;
  const basarisiz = aralik.filter((k) => !k.basarili).length;
  const gunluk = toplam / g;
  const kd = krediDurum(kullanici);
  const kacGun = gunluk > 0 ? Math.floor(kd.kalan / gunluk) : null;
  const bitis = kacGun !== null ? Date.now() + kacGun * GUN : null;
  const ab = kayit.abonelik;
  const yenileme = ab.iptal && ab.iptalTarihi ? ab.iptalTarihi : sonrakiYenileme(ab.baslangic, ab.donem);
  const erkenBiter = bitis !== null && bitis < yenileme;
  const ekKalan = Math.min(kullanici.ekKredi ?? 0, kd.kalan);
  const planKalan = kd.kalan - ekKalan;

  const cubuklar: Cubuk[] = kovalar.map((k) => {
    const ic = aralik.filter((x) => x.zaman >= k.bas && x.zaman < k.bit);
    return { anahtar: String(k.bas), etiket: k.etiket, uzunEtiket: k.uzun, parcalar: [
      { ad: "Stüdyo", deger: ic.filter((x) => x.kaynak === "studyo").reduce((a, x) => a + x.kredi, 0), renk: RENK.studyo },
      { ad: "API", deger: ic.filter((x) => x.kaynak === "api").reduce((a, x) => a + x.kredi, 0), renk: RENK.api },
    ] };
  });
  const grupla = (f: (k: Kayit) => string) => {
    const m = new Map<string, { kredi: number; adet: number }>();
    for (const k of aralik) { const a = f(k); const v = m.get(a) ?? { kredi: 0, adet: 0 }; v.kredi += k.kredi; v.adet++; m.set(a, v); }
    return [...m.entries()].sort((a, b) => b[1].kredi - a[1].kredi);
  };
  const modeller = grupla((k) => k.model).slice(0, 6);
  const turler = grupla((k) => k.tur).filter(([, v]) => v.kredi > 0);
  const tepe = Math.max(1, ...modeller.map(([, v]) => v.kredi));

  const csv = () => {
    const satir = (x: (string | number)[]) => x.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";");
    const icerik = "﻿" + [satir(["Tarih", "Kaynak", "Tür", "Model", "Kredi", "Durum"]),
      ...aralik.map((k) => satir([new Date(k.zaman).toLocaleString("tr-TR"), k.kaynak === "api" ? "API" : "Stüdyo", TUR_AD[k.tur] ?? k.tur, modelAd(k.model), k.kredi, k.basarili ? "Tamamlandı" : "Başarısız, iade edildi"]))].join("\r\n");
    if (metinIndir(icerik, `vayra-kullanim-${g}g.csv`, "text/csv;charset=utf-8")) toast.success("Kullanım raporu indirildi", { description: `Son ${g} günün ${aralik.length} satırı CSV olarak kaydedildi.` });
    else mesaj.indirilemedi("Tarayıcı indirmeyi engelledi.");
  };

  const bakiye = (
    <div className="rounded-[20px] bg-[#121214] p-5 ring-1 ring-inset ring-white/[0.08]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13.5px] text-white/50">Kalan kredi</p>
          <p className="mt-1 flex items-center gap-2 text-[34px] font-semibold leading-none tracking-[-0.035em] tabular-nums text-white"><KrediJeton boyut={24} />{sayi(kd.kalan)}<span className="text-[16px] font-medium tracking-normal text-white/35">/ {sayi(kd.toplam)}</span></p>
        </div>
        
      </div>
      <div className="mt-5 flex h-2.5 gap-[3px] overflow-hidden rounded-full bg-white/[0.07]">
        {planKalan > 0 && <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.9, ease: akis }} className="h-full origin-left rounded-l-full bg-[#55d6fd]" style={{ width: `${(planKalan / kd.toplam) * 100}%` }} />}
        {ekKalan > 0 && <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.9, delay: 0.15, ease: akis }} className="h-full origin-left bg-[#a78bfa]" style={{ width: `${(ekKalan / kd.toplam) * 100}%` }} />}
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
        <div><dt className="flex items-center gap-2 text-[12.5px] text-white/45"><span className="h-2 w-2 rounded-full bg-[#55d6fd]" />Plan kredisi</dt><dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-white">{sayi(planKalan)}</dd><dd className="text-[12px] text-white/40">{tarih(yenileme)} tarihinde yenilenir</dd></div>
        <div><dt className="flex items-center gap-2 text-[12.5px] text-white/45"><span className="h-2 w-2 rounded-full bg-[#a78bfa]" />Ek kredi</dt><dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-white">{sayi(ekKalan)}</dd><dd className="text-[12px] text-white/40">Süresi dolmaz, en son harcanır</dd></div>
        <div className="col-span-2"><dt className="text-[12.5px] text-white/45">Bu hızla yeter</dt><dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-white">{kacGun === null ? "Harcama yok" : kacGun > 365 ? "1 yıldan uzun" : `${kacGun} gün`}</dd><dd className="text-[12px] text-white/40">{gunluk ? `Günde ortalama ${sayi(Math.round(gunluk))} kredi` : `Son ${g} gün`}</dd></div>
      </dl>
      <Link href="/panel/kredi?sekme=kredi" className={cn(dugme.birincil, "mt-5 h-10 w-full")}><Plus className="h-4 w-4" />Kredi yükle</Link>
      {erkenBiter && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[14px] bg-amber-400/[0.07] px-4 py-3 ring-1 ring-inset ring-amber-400/15">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />
          <p className="min-w-0 flex-1 text-[13.5px] text-amber-100/90">Bu hızla kredin yenilemeden önce bitebilir. Otomatik yüklemeyi açabilirsin.</p>
          {!otomatik && <a href="#oto-yukleme" className="text-[13px] font-semibold text-white hover:underline">Aç</a>}
        </div>
      )}
    </div>
  );

  return (
    <Sayfa baslik="Kredi ve kullanım" aciklama="Bakiyen, kredini nereye harcadığın ve bakiye azaldığında ne olacağı." yan={bakiye}>
      <Grup id="harcama" baslik="Harcama" aciklama="Stüdyo ve API birlikte. Çubuğun üzerine gelince o günün dökümü görünür."
        sag={<>
          <Segment kucuk kayit={false} deger={gun} onSec={setGun} secenekler={[{ deger: "7", ad: "7 gün" }, { deger: "30", ad: "30 gün" }, { deger: "90", ad: "90 gün" }]} />
          {aralik.length > 0 && <button type="button" onClick={csv} aria-label="CSV indir" title="CSV indir" className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/[0.06] text-white/60 transition-colors hover:bg-white/[0.1] hover:text-white"><Download className="h-4 w-4" /></button>}
        </>} govde>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-white">{sayi(toplam)} <span className="text-[14px] font-medium tracking-normal text-white/40">kredi</span></p>
            {degisim !== null && <p className={cn("mt-1.5 flex items-center gap-1 text-[13px]", degisim > 0 ? "text-amber-300" : "text-emerald-300")}>{degisim > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}Önceki {g} güne göre yüzde {Math.abs(degisim)} {degisim > 0 ? "fazla" : "az"}</p>}
          </div>
          <div className="flex gap-5 text-[13px]">
            <span className="text-white/45">Üretim <span className="ml-1 font-semibold tabular-nums text-white">{sayi(aralik.length)}</span></span>
            <span className="text-white/45">İade edilen <span className="ml-1 font-semibold tabular-nums text-white">{sayi(basarisiz)}</span></span>
          </div>
        </div>
        <CubukGrafik veri={cubuklar} birim="kredi" yukseklik={210} bosMetin={`Son ${g} günde kredi harcanmadı`} />
        {turler.length > 0 && (
          <div className="mt-6 border-t border-white/[0.06] pt-5">
            <div className="flex h-2 gap-[3px] overflow-hidden rounded-full">
              {turler.map(([t, v]) => <span key={t} title={`${TUR_AD[t] ?? t}: ${sayi(v.kredi)} kredi`} style={{ flexGrow: v.kredi, background: TUR_RENK[t] ?? "#8b8b94" }} />)}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px]">
              {turler.map(([t, v]) => <span key={t} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: TUR_RENK[t] ?? "#8b8b94" }} /><span className="text-white/75">{TUR_AD[t] ?? t}</span><span className="tabular-nums text-white/40">yüzde {Math.round((v.kredi / Math.max(1, toplam)) * 100)}</span></span>)}
            </div>
          </div>
        )}
      </Grup>

      {modeller.length > 0 && (
        <Grup baslik="Modellere göre">
          {modeller.map(([m, v], i) => (
            <Satir key={m} on={<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]"><img src={modelLogo(m)} alt="" className="h-[18px] w-[18px] object-contain" /></span>}
              ad={modelAd(m)} alt={<span className="flex items-center gap-3"><span className="tabular-nums">{v.adet} üretim</span><span className="h-1 w-24 overflow-hidden rounded-full bg-white/[0.07] sm:w-40"><motion.span initial={{ scaleX: 0 }} animate={{ scaleX: v.kredi / tepe }} transition={{ delay: 0.2 + i * 0.05, duration: 0.7, ease: akis }} className="block h-full origin-left rounded-full bg-[#55d6fd]" /></span></span>}>
              <span className="text-[14.5px] font-semibold tabular-nums text-white">{sayi(v.kredi)}</span>
            </Satir>
          ))}
        </Grup>
      )}

      {aralik.length > 0 && (
        <Grup baslik="Son işlemler" alt={<><span>{aralik.length} işlemin tamamı CSV raporunda.</span><button type="button" onClick={csv} className="flex items-center gap-1.5 font-medium text-white/75 hover:text-white"><Download className="h-3.5 w-3.5" />CSV indir</button></>}>
          {aralik.slice(0, 8).map((k, i) => (
            <div key={`${k.zaman}-${i}`} className="flex items-center gap-3.5 px-6 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.05]"><img src={modelLogo(k.model)} alt="" className="h-4 w-4 object-contain" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] text-white">{modelAd(k.model)}</p>
                <p className="flex items-center gap-1.5 text-[12.5px] text-white/40"><span className="h-1.5 w-1.5 rounded-full" style={{ background: TUR_RENK[k.tur] ?? "#8b8b94" }} />{TUR_AD[k.tur] ?? k.tur} · {k.kaynak === "api" ? "API" : "Stüdyo"} · {goreli(k.zaman)}</p>
              </div>
              {k.basarili ? <span className="text-[14px] font-semibold tabular-nums text-white">-{sayi(k.kredi)}</span> : <Hap ton="kirmizi">İade edildi</Hap>}
            </div>
          ))}
        </Grup>
      )}

      <Grup id="oto-yukleme" baslik="Bakiye azalınca">
        <Satir id="esik" ad="Düşük kredi uyarısı" alt="Bakiyen bu sayının altına inince bildirim alırsın.">
          <Segment deger={String(esik)} onSec={(v) => tAyarla({ krediEsigi: +v })} secenekler={[50, 100, 200, 500].map((n) => ({ deger: String(n), ad: n }))} />
        </Satir>
        <Satir ad="Otomatik kredi yükleme" alt={`Bakiye ${OTO_YUKLEME_ESIGI} kredinin altına inince seçtiğin paket yüklenir ve makbuzu Faturalar'a düşer. Üretimin yarıda kalmaz.`}>
          <Anahtar acik={otomatik} kayit={false} onDegis={() => { const y = otoToggle(); kaydedildi(); toast.success(y ? "Otomatik yükleme açıldı" : "Otomatik yükleme kapatıldı"); }} etiket="Otomatik kredi yükleme" />
        </Satir>
        <motion.div initial={false} animate={{ opacity: otomatik ? 1 : 0.45 }} className="px-6 pb-6 pt-1">
          <div role="radiogroup" aria-label="Yüklenecek paket" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {KREDI_PAKETLERI.map((p) => {
              const a = otoPaket === p.kredi;
              return (
                <button key={p.kredi} type="button" role="radio" aria-checked={a} disabled={!otomatik} onClick={() => { tAyarla({ otoPaket: p.kredi }); kaydedildi(); }}
                  className={cn("relative rounded-[14px] p-3.5 text-left transition-colors", a ? "bg-white/[0.07] ring-[1.5px] ring-inset ring-white" : "bg-white/[0.03] hover:bg-white/[0.05]")}>
                  <p className="flex items-center gap-1.5 text-[14.5px] font-semibold tabular-nums text-white"><KrediJeton boyut={12} />{sayi(p.kredi)}</p>
                  <p className="mt-0.5 text-[12.5px] tabular-nums text-white/45">{tl(p.fiyat)}{p.populer && <span className="ml-1.5 text-[#55d6fd]">En çok tercih</span>}</p>
                </button>
              );
            })}
          </div>
        </motion.div>
      </Grup>
    </Sayfa>
  );
}
