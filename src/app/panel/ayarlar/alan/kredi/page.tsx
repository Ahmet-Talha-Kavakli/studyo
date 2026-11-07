"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, Loader2, Package } from "lucide-react";
import { AlanOzetKarti, AlanSayfa, type AlanSayfaBaglam } from "@/components/alan/AlanSayfa";
import { DIL, SecimMenusu, goreliZaman, paraYaz, sayiYaz, tarihYaz } from "@/components/alan/ortak";
import { Cubuk, Grup, Hap, Satir, Segment, alan as alanSinifi, dugme } from "@/components/ayarlar/ui";
import { KrediJeton } from "@/components/ui/KrediHap";
import * as A from "@/lib/alan/istemci";
import { odemeyeGec } from "@/components/fiyat/OdemePenceresi";
import type { Para } from "@/lib/odeme/tipler";
import type { KrediHareketi } from "@/lib/hesap/tipler";
import { KREDI_PAKETLERI, ULTRA_KREDI_KADEMELERI, YILLIK_INDIRIM, planBul } from "@/lib/fiyat";
import { PLAN_ADI, useAuth } from "@/store/useAuth";
import { useAlan } from "@/store/useAlan";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/** Kredi ve sınırlar: ortak havuz, kişisel bakiyeden aktarım, alan planı ve kredi paketi satın alma, varsayılan üye sınırı. */
export default function AlanKredi() {
  return (
    <AlanSayfa baslik="Kredi ve sınırlar" aciklama="Alanın ortak kredi havuzu. Üyelerin üretimleri ve Build işleri buradan düşer; her üyenin aylık sınırı ayrı denetlenir."
      yan={(b) => <AlanOzetKarti alan={b.alan} />}>
      {(b) => <Icerik {...b} />}
    </AlanSayfa>
  );
}

/** Varsayılan para birimi tahmini: Türkiye saat diliminde TRY, başka her yerde USD. Kullanıcı değiştirebilir. */
const varsayilanPara = (): Para => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone === "Europe/Istanbul" ? "TRY" : "USD"; } catch { return "USD"; } };

function Icerik({ alan, setAlan, yonetici, yenile }: AlanSayfaBaglam) {
  const k = alan.kredi;
  const [veri, setVeri] = useState<{ hareketler: KrediHareketi[]; kisiselBakiye: number } | null>(null);
  const [donem, setDonem] = useState<"aylik" | "yillik">("aylik");
  const [para, setPara] = useState<Para>("USD");
  useEffect(() => setPara(varsayilanPara()), []);
  const getir = useCallback(async () => { const r = await A.krediGetir(alan.id); if (r.ok) setVeri({ hareketler: r.hareketler, kisiselBakiye: r.kisiselBakiye }); }, [alan.id]);
  useEffect(() => { void getir(); }, [getir]);
  const sonra = async () => { await yenile(); await getir(); await useAuth.getState().esitle(); void useAlan.getState().yukle(); };
  const planOran = k.kota ? Math.min(1, k.planKredi / k.kota) : 0;
  const varsayilanYaz = async (v: number | null) => {
    const r = await A.alanYaz(alan.id, { varsayilanSinir: v });
    if (!r.ok) return toast.error("Kaydedilemedi", { description: r.hata });
    setAlan(r.alan); toast.success("Varsayılan sınır güncellendi");
  };
  return (
    <>
      <Grup id="havuz" baslik="Ortak havuz" aciklama={`Dönem ${tarihYaz(k.donemBitis)} tarihinde yenilenir. Plan kredisi önce harcanır, satın alınan ve aktarılan kredinin süresi dolmaz.`}>
        <div className="grid gap-px bg-white/[0.06] sm:grid-cols-[1.3fr_1fr]">
          <div className="bg-[#121214] px-6 py-5">
            <p className="text-[13px] text-white/50">Havuzdaki kredi</p>
            <motion.p key={k.bakiye} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-1 flex items-center gap-2 text-[34px] font-semibold tabular-nums tracking-[-0.02em] text-white">
              <KrediJeton boyut={26} />{sayiYaz(k.bakiye)}
            </motion.p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-[12.5px] text-white/50"><span>Plan kredisi</span><span className="tabular-nums text-white/80">{sayiYaz(k.planKredi)} / {sayiYaz(k.kota)}</span></div>
              <Cubuk oran={planOran} />
              <div className="flex justify-between text-[12.5px] text-white/50"><span>Ek kredi (süresi dolmaz)</span><span className="tabular-nums text-white/80">{sayiYaz(k.ekKalan)}</span></div>
            </div>
          </div>
          <dl className="divide-y divide-white/[0.06] bg-[#121214]">
            {[["Alan planı", alan.plan === "baslangic" ? "Ücretsiz, kotasız" : `${PLAN_ADI[alan.plan]}${alan.planBitis ? `, ${tarihYaz(alan.planBitis)} bitiş` : ""}`],
              ["Senin bu ay", `${sayiYaz(k.buAy)} harcandı`], ["Senin sınırın", k.etkinSinir === null ? "Sınırsız" : `Aylık ${sayiYaz(k.etkinSinir)}`], ["Harcayabileceğin", sayiYaz(k.kullanilabilir)]].map(([a, v]) => (
              <div key={a} className="flex items-center justify-between gap-3 px-6 py-3 text-[13.5px]"><dt className="text-white/50">{a}</dt><dd className="text-right font-medium text-white">{v}</dd></div>
            ))}
          </dl>
        </div>
      </Grup>

      {yonetici && <Aktarim alanId={alan.id} kisiselBakiye={veri?.kisiselBakiye} onTamam={sonra} />}

      <Grup id="plan" baslik="Alan planı" aciklama="Plan alanın kendisine alınır: her ay havuza kota yüklenir, üye sınırı yükselir. Bir dönem için ödenir, kendiliğinden yenilenmez."
        sag={<div className="flex gap-2"><Segment kucuk kayit={false} deger={para} onSec={setPara} secenekler={[{ deger: "USD", ad: "USD" }, { deger: "TRY", ad: "TRY" }]} /><Segment kucuk kayit={false} deger={donem} onSec={setDonem} secenekler={[{ deger: "aylik", ad: "Aylık" }, { deger: "yillik", ad: `Yıllık` }]} /></div>}>
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
          {(["arti", "ultra"] as const).map((p, i) => {
            const pl = planBul(p)!;
            const aylik = (para === "USD" ? (donem === "yillik" ? pl.yillikUSD ?? pl.fiyatUSD * (1 - YILLIK_INDIRIM) : pl.fiyatUSD) : pl.fiyatTRY * (donem === "yillik" ? 1 - YILLIK_INDIRIM : 1));
            const su = alan.plan === p;
            return (
              <motion.div key={p} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={cn("flex flex-col rounded-[16px] bg-white/[0.03] p-5 ring-1 ring-inset ring-white/[0.07]", su && "outline outline-2 -outline-offset-2 outline-white ring-0")}>
                <div className="flex items-center justify-between"><p className="text-[16px] font-semibold text-white">{pl.ad}</p>{su && <Hap ton="vurgu">Şu anki plan</Hap>}</div>
                <p className="mt-1 text-[13px] text-white/50">Aylık {sayiYaz(pl.kredi)}{p === "ultra" ? ` ile ${sayiYaz(ULTRA_KREDI_KADEMELERI.at(-1)!)} arası` : ""} kredi · {p === "arti" ? "20" : "100"} üyeye kadar</p>
                <p className="mt-4 text-[26px] font-semibold tabular-nums tracking-[-0.02em] text-white">{paraYaz(Math.round(aylik * 100), para)}<span className="text-[13px] font-normal text-white/45"> / ay, vergi hariç</span></p>
                {yonetici ? (
                  <button type="button" onClick={() => odemeyeGec({ tur: "plan", urun: p, donem, para, alan: alan.id })} className={cn(su ? dugme.ikincil : dugme.birincil, "mt-4")}>{su ? "Yeni dönem al" : `${pl.ad} al`}</button>
                ) : <p className="mt-4 text-[12.5px] text-white/45">Planı sahip ve yöneticiler alır.</p>}
              </motion.div>
            );
          })}
        </div>
      </Grup>

      {yonetici && (
        <Grup id="paket" baslik="Kredi paketi" aciklama="Tek seferlik kredi havuzun süresi dolmayan kovasına eklenir.">
          <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 sm:p-6">
            {KREDI_PAKETLERI.map((p) => (
              <button key={p.kredi} type="button" onClick={() => odemeyeGec({ tur: "kredi", urun: String(p.kredi), para, alan: alan.id })}
                className="group flex items-center gap-3 rounded-[14px] bg-white/[0.03] px-4 py-3.5 text-left ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.06]">
                <Package className="h-5 w-5 shrink-0 text-[#55d6fd]" strokeWidth={1.8} />
                <span className="min-w-0"><span className="block text-[15px] font-semibold tabular-nums text-white">{sayiYaz(p.kredi)} kredi</span><span className="block text-[12px] text-white/45">{p.populer ? "En çok tercih edilen" : "Süresi dolmaz"}</span></span>
              </button>
            ))}
          </div>
          <Satir ad="Özel miktar" alt="100 ile 100.000 kredi arası, 50'nin katı.">
            <SecimMenusu etiket="Özel kredi miktarı" deger={null as number | null} secenekler={[{ deger: null, ad: "Miktar seç" }, { deger: 7500, ad: "7.500 kredi" }, { deger: 20000, ad: "20.000 kredi" }]}
              onSec={(v) => { if (v) odemeyeGec({ tur: "kredi", urun: String(v), para, alan: alan.id }); }}
              ozel={{ ad: "Özel miktar", birim: "kredi", en: 100, enCok: 100_000, onSec: (n) => odemeyeGec({ tur: "kredi", urun: String(Math.round(n / 50) * 50), para, alan: alan.id }) }} />
          </Satir>
        </Grup>
      )}

      <Grup id="sinir" baslik="Üye başına aylık sınır" aciklama="Bir üyenin bir ayda havuzdan harcayabileceği en çok kredi. Üyeye özel sınır Üyeler sayfasından verilir ve bunu geçersiz kılar. Sınıra ulaşan üye ayın 1'ine (UTC) kadar harcayamaz.">
        <Satir ad="Alan varsayılanı" alt={alan.varsayilanSinir === null ? "Şu an sınırsız: üyeler havuz bitene kadar harcayabilir." : `Şu an her üye ayda en çok ${sayiYaz(alan.varsayilanSinir)} kredi harcar.`}>
          <SecimMenusu etiket="Varsayılan sınır" disabled={!yonetici} deger={alan.varsayilanSinir}
            secenekler={[{ deger: null, ad: "Sınırsız" }, { deger: 100, ad: "Aylık 100 kredi" }, { deger: 500, ad: "Aylık 500 kredi" }, { deger: 1000, ad: "Aylık 1.000 kredi" }, { deger: 5000, ad: "Aylık 5.000 kredi" },
              ...(alan.varsayilanSinir !== null && ![100, 500, 1000, 5000].includes(alan.varsayilanSinir) ? [{ deger: alan.varsayilanSinir, ad: `Aylık ${sayiYaz(alan.varsayilanSinir)} kredi` }] : [])]}
            onSec={(v) => void varsayilanYaz(v)} ozel={{ ad: "Özel miktar", birim: "kredi", onSec: (n) => void varsayilanYaz(n) }} genislik={250} />
        </Satir>
      </Grup>

      {yonetici && (
        <Grup baslik="Havuz hareketleri" aciklama="Alan defterinin son 60 hareketi: harcamalar, iadeler, aktarımlar, satın almalar ve dönem yenilemeleri.">
          {!veri ? <div className="px-6 py-5"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div> : !veri.hareketler.length ? <p className="px-6 py-5 text-[13.5px] text-white/45">Henüz hareket yok.</p> : (
            veri.hareketler.map((h) => (
              <div key={h.id} className="flex items-center gap-3 px-6 py-3">
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", h.miktar > 0 ? "bg-emerald-400/12 text-emerald-300" : h.miktar < 0 ? "bg-white/[0.06] text-white/60" : "bg-white/[0.04] text-white/40")}>
                  {h.miktar > 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] text-white">{h.aciklama}</span><span className="block text-[12px] text-white/40">{goreliZaman(h.zaman)} · bakiye {sayiYaz(h.bakiye)}</span></span>
                <span className={cn("shrink-0 text-[14px] font-semibold tabular-nums", h.miktar > 0 ? "text-emerald-300" : "text-white/80")}>{h.miktar > 0 ? "+" : ""}{h.miktar.toLocaleString(DIL)}</span>
              </div>
            ))
          )}
        </Grup>
      )}
    </>
  );
}

function Aktarim({ alanId, kisiselBakiye, onTamam }: { alanId: string; kisiselBakiye?: number; onTamam: () => Promise<void> }) {
  const [miktar, setMiktar] = useState<number | null>(100);
  const [ozel, setOzel] = useState("");
  const [bekle, setBekle] = useState(false);
  const deger = ozel ? Math.floor(Number(ozel)) : miktar ?? 0;
  const aktar = async () => {
    if (!(deger > 0)) return;
    setBekle(true);
    const r = await A.krediAktar(alanId, deger);
    setBekle(false);
    if (!r.ok) return toast.error("Aktarılamadı", { description: r.hata });
    toast.success(`${sayiYaz(deger)} kredi alana aktarıldı`, { description: `Kişisel bakiyende ${sayiYaz(r.kisiselBakiye)} kredi kaldı.` });
    setOzel("");
    await onTamam();
  };
  return (
    <Grup id="aktar" baslik="Kişisel bakiyenden aktar" aciklama="Kendi kredini alanın havuzuna taşı. Aktarılan kredinin süresi dolmaz; alan silinirse kalan ek kredi sahibin kişisel bakiyesine döner."
      sag={typeof kisiselBakiye === "number" ? <Hap><KrediJeton boyut={12} />{sayiYaz(kisiselBakiye)} kişisel</Hap> : undefined}>
      <div className="flex flex-wrap items-center gap-2 px-6 py-4">
        {[100, 500, 1000].map((m) => (
          <button key={m} type="button" onClick={() => { setMiktar(m); setOzel(""); }}
            className={cn("h-9 rounded-full bg-white/[0.05] px-4 text-[13.5px] font-medium tabular-nums text-white ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.09]", !ozel && miktar === m && "outline outline-[1.5px] -outline-offset-[1.5px] outline-white ring-0")}>{sayiYaz(m)}</button>
        ))}
        <input value={ozel} onChange={(e) => setOzel(e.target.value.replace(/\D/g, "").slice(0, 7))} inputMode="numeric" placeholder="Özel" aria-label="Özel miktar"
          className={cn(alanSinifi, "h-9 w-[110px] rounded-full", ozel && "outline outline-[1.5px] -outline-offset-[1.5px] outline-white")} />
        <span className="flex-1" />
        <button type="button" disabled={bekle || !(deger > 0) || (typeof kisiselBakiye === "number" && deger > kisiselBakiye)} onClick={() => void aktar()} className={dugme.birincil}>
          <ArrowRightLeft className="h-4 w-4" />{bekle ? "Aktarılıyor" : `${sayiYaz(deger || 0)} kredi aktar`}
        </button>
      </div>
      {typeof kisiselBakiye === "number" && deger > kisiselBakiye && <p className="px-6 pb-4 text-[12.5px] text-amber-200/80">Kişisel bakiyen bu miktara yetmiyor.</p>}
    </Grup>
  );
}
