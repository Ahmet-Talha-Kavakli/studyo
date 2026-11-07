"use client";

import { Iskelet } from "@/components/ui/Iskelet";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, CreditCard, Infinity as Sonsuz, Loader2 } from "lucide-react";
import { useAuth, PLAN_ADI } from "@/store/useAuth";
import { Grup, Hap, Pencere, Satir, Sayfa, dugme, akis, yay } from "@/components/ayarlar/ui";
import { kalanSure } from "@/components/api/ui";
import { odemeyeGec } from "@/components/fiyat/OdemePenceresi";
import { MODELLER, PLANLAR } from "@/lib/catalog";
import { aylikFiyat, planBul, HIZ_SEVIYELERI, EK_ESZAMANLI, YILLIK_INDIRIM, SAGLAYICI_LOGO, VAYRA_LOGO, tl, sayi } from "@/lib/fiyat";
import { paraYaz, planUrunu } from "@/lib/odeme/katalog";
import * as O from "@/lib/odeme/istemci";
import type { AbonelikOzeti, HaklarYaniti, OdemeDurumu } from "@/lib/odeme/tipler";
import { SAGLAYICI_AD } from "@/lib/odeme/tipler";
import { tarih } from "@/lib/ayarlar";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/**
 * Ayarlar, Plan: sunucudaki abonelik (iyzico dönemlik, Stripe otomatik yenilenen), ödenmiş dönem, planlanmış değişiklik,
 * süreli haklar. Plan değişikliği ve yenileme ödeme penceresinden geçer; iptal dönem sonunda geçerli olur.
 */
const NEDENLER = ["Çok pahalı", "Yeterince kullanmıyorum", "Başka bir araca geçiyorum", "Kalite beklentimi karşılamadı", "Geçici bir ara veriyorum", "Diğer"];
const KAPAK: Record<string, string> = {
  baslangic: "/gercek/sinirsiz/unl-nano-banana-pro.webp", arti: "/gercek/sinirsiz/unl-kling.webp",
  ultra: "/gercek/sinirsiz/unl-hero-dragon.webp", kurumsal: "/gercek/sinirsiz/unl-seedance.webp",
};
const SIRA = ["baslangic", "arti", "ultra", "kurumsal"];
const DURUM: Record<AbonelikOzeti["durum"], { ad: string; ton: "yesil" | "sari" | "kirmizi" | "notr" }> = {
  etkin: { ad: "Etkin", ton: "yesil" }, iptal: { ad: "İptal edildi", ton: "sari" }, odenemedi: { ad: "Ödeme alınamadı", ton: "kirmizi" }, bitti: { ad: "Sona erdi", ton: "notr" },
};

export default function PlanAyarlari() {
  const kullanici = useAuth((s) => s.kullanici)!;
  const [ab, setAb] = useState<AbonelikOzeti | null>(null);
  const [haklar, setHaklar] = useState<HaklarYaniti>({ sinirsiz: [], hiz: null });
  const [odeme, setOdeme] = useState<OdemeDurumu | null>(null);
  const [yuklendi, setYuklendi] = useState(false);
  const [iptalAcik, setIptalAcik] = useState(false);
  const [is, setIs] = useState<string | null>(null);
  const [simdi, setSimdi] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setSimdi(Date.now()), 60_000); return () => clearInterval(t); }, []);

  const yukle = useCallback(async () => {
    const r = await O.abonelikGetir();
    if (r.ok) { setAb(r.abonelik); setHaklar(r.haklar); setOdeme(r.odeme); void O.haklariEsitle(r.haklar); }
    setYuklendi(true);
  }, []);
  useEffect(() => { void yukle(); }, [yukle]);

  const islem = async (g: Parameters<typeof O.abonelikIslemi>[0], ad: string) => {
    setIs(ad);
    const r = await O.abonelikIslemi(g);
    setIs(null);
    if (!r.ok) return toast.error("İşlem yapılamadı", { description: r.hata });
    setAb(r.abonelik); setHaklar(r.haklar);
    toast.success(ad, { description: r.mesaj });
    void O.hesabiTazele(r.haklar);
  };
  const portal = async () => {
    setIs("portal");
    const r = await O.portalAc();
    setIs(null);
    if (!r.ok) return toast.error("Ödeme yöntemi açılamadı", { description: r.hata });
    location.assign(r.adres);
  };

  const plan = planBul(ab?.plan ?? kullanici.plan) ?? planBul("baslangic")!;
  const planId = ab?.plan ?? kullanici.plan;
  const kurumsal = planId === "kurumsal";
  const donem = ab?.donem ?? "aylik";
  const kota = ab?.kota ?? plan.kredi;
  const sinirsizlar = haklar.sinirsiz.filter((x) => x.bitis > simdi);
  const hiz = HIZ_SEVIYELERI.find((h) => h.id === (haklar.hiz?.seviye ?? "standart")) ?? HIZ_SEVIYELERI[0];
  const esz = EK_ESZAMANLI.find((e) => e.adet === (haklar.hiz?.ekEsZamanli ?? 0)) ?? EK_ESZAMANLI[0];
  const ilerleme = ab ? Math.min(1, Math.max(0, (simdi - ab.donemBaslangic) / Math.max(1, ab.donemBitis - ab.donemBaslangic))) : 0;
  const sonraki = ab?.sonraki ?? (ab ? { plan: ab.plan, kota: ab.kota, donem: ab.donem } : null);
  const bitiyor = !!ab && (ab.durum === "iptal" || !ab.otomatik);
  const hedefDonem = donem === "aylik" ? "yillik" : "aylik";

  const kart = (
    <div className="overflow-hidden rounded-[20px] bg-[#121214] ring-1 ring-inset ring-white/[0.08]">
      <div className="relative h-[190px] overflow-hidden">
        <motion.img initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 1.4, ease: akis }} src={KAPAK[planId] ?? KAPAK.arti} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#121214_2%,rgba(18,18,20,0.6)_45%,rgba(18,18,20,0.05))]" />
        <div className="absolute inset-x-5 bottom-5 flex flex-wrap items-end justify-between gap-3 sm:inset-x-6">
          <div>
            <p className="text-[13px] font-medium text-white/65">Mevcut planın</p>
            <h2 className="mt-1 flex items-center gap-2.5 text-[28px] font-semibold leading-none tracking-[-0.03em] text-white">
              {PLAN_ADI[planId]}{yuklendi && <Hap ton={ab ? DURUM[ab.durum].ton : "notr"} className="tracking-normal">{ab ? DURUM[ab.durum].ad : "Abonelik yok"}</Hap>}
            </h2>
          </div>
          <p className="text-right text-white">
            {kurumsal ? <span className="text-[14px] text-white/80">Sözleşmeli</span>
              : ab ? <><span className="text-[20px] font-semibold tabular-nums tracking-[-0.02em]">{paraYaz(ab.sonrakiTutar, ab.para)}</span><span className="text-[14px] text-white/60"> / {(ab.sonraki?.donem ?? ab.donem) === "yillik" ? "yıl" : "ay"}</span></>
                : <span className="text-[14px] text-white/70">Ücretli abonelik yok</span>}
          </p>
        </div>
      </div>
      <div className="px-5 pb-5 pt-1 sm:px-6">
        {ab ? <>
          <div className="flex items-center justify-between text-[12.5px] text-white/45">
            <span>{new Date(ab.donemBaslangic).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span>
            <span className="font-medium text-white/85">{kalanSure(ab.donemBitis)} sonra {bitiyor ? "bitiyor" : "yenilenir"}</span>
            <span>{new Date(ab.donemBitis).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span>
          </div>
          <div className="mt-2 h-[6px] overflow-hidden rounded-full bg-white/[0.08]">
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: ilerleme }} transition={{ duration: 1, ease: akis, delay: 0.2 }} className={cn("h-full origin-left rounded-full", ab.durum === "odenemedi" ? "bg-rose-400" : bitiyor ? "bg-amber-400" : "bg-[#55d6fd]")} />
          </div>
        </> : yuklendi ? <p className="text-[13.5px] leading-relaxed text-white/55">Başlangıç planının aylık kredisi her ay yenilenir. Daha fazlası için bir plan seç.</p> : <div aria-hidden className="space-y-2 py-0.5"><Iskelet className="h-3.5 w-full rounded-full" /><Iskelet className="h-3.5 w-2/3 rounded-full" /></div>}
        <dl className="mt-5 divide-y divide-white/[0.06] rounded-[14px] bg-white/[0.03]">
          {[["Dönem kredisi", `${sayi(kota)} kredi`], ["Faturalama", ab ? (ab.donem === "yillik" ? "Yıllık" : "Aylık") : "Yok"], ["Ödeme", ab ? `${SAGLAYICI_AD[ab.saglayici]}${ab.mod === "test" && ab.saglayici !== "deneme" ? ", test" : ""}` : "Yok"]].map(([e, d]) => (
            <div key={e} className="flex items-center justify-between px-4 py-2.5"><dt className="text-[13px] text-white/45">{e}</dt><dd className="truncate text-[14px] font-semibold tabular-nums text-white">{d}</dd></div>
          ))}
        </dl>
      </div>
      {ab?.durum === "iptal" && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-amber-400/15 bg-amber-400/[0.05] px-5 py-3.5 sm:px-6">
          <p className="text-[13.5px] text-amber-100/85">{tarih(ab.donemBitis)} tarihinde sona erecek. O güne kadar her şey açık.</p>
          <button type="button" disabled={!!is} onClick={() => void islem({ islem: "surdur" }, "Aboneliğin sürüyor")} className={dugme.birincil}>Aboneliği sürdür</button>
        </div>
      )}
      {ab?.durum === "odenemedi" && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rose-400/15 bg-rose-400/[0.05] px-5 py-3.5 sm:px-6">
          <p className="text-[13.5px] text-rose-100/85">Son dönem ödemesi alınamadı; plan Başlangıç'a döndü. Stripe ödemeyi yeniden deneyecek, ödenince planın geri gelir.</p>
          <button type="button" disabled={!!is} onClick={() => void portal()} className={dugme.birincil}>Kartı güncelle</button>
        </div>
      )}
    </div>
  );

  return (
    <Sayfa baslik="Plan" aciklama="Planın, ödenmiş dönemin ve plana eklediğin her şey. Fiyatlara KDV dahil değildir."
      sag={<Link href="/fiyatlandirma" className={cn(dugme.hayalet, "h-8 text-[13px]")}>Planları karşılaştır<ArrowUpRight className="h-3.5 w-3.5" /></Link>} yan={kart}>

      {odeme && !odeme.altyapi && (
        <p className="rounded-[16px] bg-amber-400/[0.06] px-5 py-3.5 text-[13.5px] leading-relaxed text-amber-100/85 ring-1 ring-inset ring-amber-400/15">
          Ödeme altyapısı henüz bağlanmadı: bu sunucuda iyzico ya da Stripe kurulu değil. Plan satın alma ve yenileme şu an yapılamıyor.
        </p>
      )}

      {ab && !kurumsal && (
        <Grup id="yenile" baslik="Faturalama">
          <Satir id="plan" ad="Ödeme dönemi" alt={ab.sonraki && ab.sonraki.donem !== ab.donem ? `${tarih(ab.donemBitis)} tarihinde ${ab.sonraki.donem === "yillik" ? "yıllığa" : "aylığa"} geçecek` : ab.donem === "aylik" ? `Yıllık faturalamada yüzde ${YILLIK_INDIRIM * 100} daha az ödersin. Geçiş hemen olur, kalan ayın değeri düşülür.` : "Yıllık indirim uygulanıyor. Aylığa geçiş dönem sonunda olur."}>
            <button type="button" onClick={() => odemeyeGec({ tur: "plan", urun: planUrunu(ab.plan, ab.kota), donem: hedefDonem })} className={dugme.ikincil}>{ab.donem === "aylik" ? "Yıllığa geç" : "Aylığa geç"}</button>
          </Satir>
          {ab.saglayici === "stripe" ? (
            <Satir ad={ab.durum === "iptal" ? "Erişimin bitiyor" : "Sonraki ödeme"} alt={ab.durum === "iptal" ? "Yenilenmeyecek" : `${paraYaz(ab.sonrakiTutar, ab.para)}, kayıtlı kartından kendiliğinden çekilir`}>
              <span className="text-[14px] tabular-nums text-white/75">{tarih(ab.donemBitis)}</span>
              <button type="button" disabled={!!is} onClick={() => void portal()} className={dugme.ikincil}>{is === "portal" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}Ödeme yöntemi</button>
            </Satir>
          ) : (
            <Satir ad="Ödenmiş dönem" alt={ab.yenilenebilir ? `Yenileme açık: ${sonraki ? `${PLAN_ADI[sonraki.plan]}, ${sonraki.donem === "yillik" ? "yıllık" : "aylık"}` : ""}, ${paraYaz(ab.sonrakiTutar, ab.para)}. Ödemezsen plan dönem sonunda Başlangıç'a döner.` : `Kart saklanmaz, kendiliğinden çekim yapılmaz. Yenileme ${tarih(ab.donemBitis - 7 * 864e5)} tarihinde açılır ve e-postayla hatırlatılır.`}>
              <span className="text-[14px] tabular-nums text-white/75">{tarih(ab.donemBitis)}</span>
              <button type="button" disabled={!ab.yenilenebilir || ab.durum === "iptal"} onClick={() => sonraki && odemeyeGec({ tur: "plan", urun: planUrunu(sonraki.plan, sonraki.kota), donem: sonraki.donem })} className={ab.yenilenebilir ? dugme.birincil : dugme.ikincil}>Şimdi yenile</button>
            </Satir>
          )}
          {ab.sonraki && (
            <Satir ad="Planlanmış değişiklik" alt={`${tarih(ab.donemBitis)} tarihinde ${PLAN_ADI[ab.sonraki.plan]}${ab.sonraki.plan === "ultra" ? `, ${sayi(ab.sonraki.kota)} kredi` : ""}, ${ab.sonraki.donem === "yillik" ? "yıllık" : "aylık"} başlar.`}>
              <button type="button" disabled={!!is} onClick={() => void islem({ islem: "degisikligiKaldir" }, "Değişiklik kaldırıldı")} className={dugme.ikincil}>Kaldır</button>
            </Satir>
          )}
          <Satir ad="Makbuzlar ve fatura bilgileri" alt={ab.sonOdeme ? `Son ödeme ${tarih(ab.sonOdeme.zaman)}, ${paraYaz(ab.sonOdeme.toplam, ab.para)}` : undefined}>
            <Link href="/panel/ayarlar/faturalar" className={dugme.ikincil}>Faturalar</Link>
          </Satir>
        </Grup>
      )}

      <Grup baslik="Planına dahil" govde>
        <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {plan.ozellikler.map((o, i) => (
            <motion.li key={o} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.03 }} className="flex items-start gap-2.5 text-[14px] leading-snug text-white/75">
              <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#55d6fd]/12 text-[#55d6fd]"><Check className="h-3 w-3" strokeWidth={3} /></span>{o}
            </motion.li>
          ))}
        </ul>
      </Grup>

      {!kurumsal && (
        <Grup id="planlar" baslik="Planı değiştir" aciklama="Yükseltme hemen geçerli olur, kalan sürenin değeri ödemeden düşülür. Düşürme dönem sonunda geçerli olur." govde>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {PLANLAR.filter((p) => p.id !== "kurumsal").map((p) => {
              const su = p.id === planId && (!!ab || p.id === "baslangic");
              const yukari = SIRA.indexOf(p.id) > SIRA.indexOf(planId) || (!ab && p.id === planId);
              return (
                <div key={p.id} className={cn("relative flex flex-col overflow-hidden rounded-[18px] p-4", su ? "bg-white/[0.06]" : "bg-white/[0.03]")}>
                  {su && <motion.span layoutId="plan-cerceve" transition={yay} className="pointer-events-none absolute inset-0 rounded-[18px] ring-[1.5px] ring-inset ring-white" />}
                  <img src={KAPAK[p.id]} alt="" className="-mx-4 -mt-4 mb-3 h-20 w-[calc(100%+2rem)] max-w-none object-cover opacity-80" />
                  <p className="flex items-center justify-between text-[15.5px] font-semibold text-white">{p.ad}{su && <Hap ton="vurgu">Mevcut</Hap>}</p>
                  <p className="mt-1.5 text-[22px] font-semibold tabular-nums tracking-[-0.02em] text-white">{tl(aylikFiyat(p, donem))}<span className="text-[13px] font-normal text-white/45"> / ay</span></p>
                  <p className="mt-0.5 text-[13px] text-white/50">{sayi(p.kredi)} kredi her dönem</p>
                  <div className="mt-auto pt-4">
                    {su ? <span className="flex h-9 items-center justify-center text-[13px] text-white/40">Şu an bu plandasın</span>
                      : <button type="button" onClick={() => odemeyeGec({ tur: "plan", urun: p.id, donem })} className={cn(yukari ? dugme.birincil : dugme.ikincil, "w-full")}>{!ab ? "Abone ol" : yukari ? "Yükselt" : "Düşür"}</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </Grup>
      )}

      <Grup baslik="Eklentiler" aciklama="Plana ek olarak aldığın sınırsız erişimler ve hız. Süreli haklardır, kendiliğinden yenilenmez.">
        {sinirsizlar.map((s) => {
          const m = MODELLER.find((x) => x.id === s.model);
          return (
            <Satir key={s.no} on={<img src={SAGLAYICI_LOGO[m?.saglayici ?? ""] ?? VAYRA_LOGO} alt="" className="h-9 w-9 shrink-0 rounded-[10px] bg-white/[0.06] object-contain p-1.5" />}
              ad={<span className="flex items-center gap-1.5"><Sonsuz className="h-4 w-4 text-[#55d6fd]" />{m?.ad ?? s.model}, {s.kalite}</span>} alt={`${tarih(s.bitis)} tarihine kadar, ${kalanSure(s.bitis)} kaldı`}>
              <Hap>{Math.ceil((s.bitis - simdi) / 86_400_000)} gün</Hap>
            </Satir>
          );
        })}
        {!sinirsizlar.length && (
          <Satir on={<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]"><Sonsuz className="h-[18px] w-[18px] text-white/60" /></span>}
            ad="Sınırsız erişim" alt="Bir modelde günlük, haftalık ya da aylık sınırsız üretim.">
            <Link href="/panel/kredi?sekme=sinirsiz" className={dugme.ikincil}>Göz at</Link>
          </Satir>
        )}
        <Satir id="hiz" ad={<>Hız: {hiz.ad} <span className="font-normal text-white/45">({hiz.kat})</span></>} alt={haklar.hiz ? `${tarih(haklar.hiz.bitis)} tarihine kadar, ${kalanSure(haklar.hiz.bitis)} kaldı` : hiz.ozet}>
          <span className="text-[13.5px] tabular-nums text-white/55">{haklar.hiz && hiz.fiyat ? `${tl(hiz.fiyat)}, 30 gün` : "Dahil"}</span>
          <Link href="/panel/kredi?sekme=hiz" className={dugme.ikincil}>Değiştir</Link>
        </Satir>
        <Satir ad="Ek eşzamanlı üretim" alt={esz.adet ? `Planına ek ${esz.adet} iş aynı anda çalışır.` : "Planındaki eşzamanlı sınır geçerli."}>
          <span className="text-[13.5px] tabular-nums text-white/55">{esz.fiyat ? `${tl(esz.fiyat)}, 30 gün` : "Yok"}</span>
          <Link href="/panel/kredi?sekme=hiz" className={dugme.ikincil}>Değiştir</Link>
        </Satir>
      </Grup>

      {ab && !kurumsal && (ab.durum === "etkin" || ab.durum === "odenemedi") && (
        <Grup id="iptal" baslik="Aboneliği iptal et" tehlike>
          <Satir ad={ab.otomatik ? "Yenilemeyi durdur" : "Hatırlatmaları durdur"} alt={`${tarih(ab.donemBitis)} tarihine kadar planın açık kalır. Satın aldığın kredi silinmez; istediğin an sürdürebilirsin.`}>
            <button type="button" onClick={() => setIptalAcik(true)} className={dugme.tehlike}>İptal et</button>
          </Satir>
        </Grup>
      )}

      <IptalPenceresi acik={iptalAcik} onKapat={() => setIptalAcik(false)} bitis={ab?.donemBitis ?? Date.now()} bekle={is === "iptal"}
        onIptal={(neden) => void islem({ islem: "iptal", neden }, "Aboneliğin iptal edildi").then(() => setIptalAcik(false))} />
    </Sayfa>
  );
}

function IptalPenceresi({ acik, onKapat, bitis, onIptal, bekle }: { acik: boolean; onKapat: () => void; bitis: number; onIptal: (neden: string) => void; bekle: boolean }) {
  const [neden, setNeden] = useState("");
  const kapat = () => { setNeden(""); onKapat(); };
  return (
    <Pencere acik={acik} onKapat={kapat} baslik="Aboneliği iptal et" aciklama={`Erişimin ${tarih(bitis)} tarihine kadar sürer, sonra yenilenmez. Satın aldığın kredi silinmez.`}
      alt={<><button type="button" onClick={kapat} className={dugme.hayalet}>Vazgeç</button><button type="button" onClick={() => onIptal(neden)} disabled={!neden || bekle} className={dugme.tehlikeDolu}>{bekle && <Loader2 className="h-4 w-4 animate-spin" />}İptal et</button></>}>
      <p className="mb-3 text-[14px] font-medium text-white">Neden ayrılıyorsun?</p>
      <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[16px] bg-white/[0.03]">
        {NEDENLER.map((n) => (
          <button key={n} type="button" aria-pressed={neden === n} onClick={() => setNeden(n)} className="flex w-full items-center justify-between px-4 py-3 text-left text-[14px] text-white/80 transition-colors hover:bg-white/[0.03]">
            {n}<span className={cn("flex h-5 w-5 items-center justify-center rounded-full transition-colors", neden === n ? "ring-[5px] ring-inset ring-white" : "ring-1 ring-inset ring-white/20")} />
          </button>
        ))}
      </div>
      {neden === "Çok pahalı" && <p className="mt-3 rounded-[14px] bg-white/[0.04] p-3.5 text-[13.5px] text-white/65">Yıllık faturalama aylık fiyatı yüzde {YILLIK_INDIRIM * 100} düşürür. Daha az kredi gerekiyorsa küçük bir plana da geçebilirsin.</p>}
      {neden === "Geçici bir ara veriyorum" && <p className="mt-3 rounded-[14px] bg-white/[0.04] p-3.5 text-[13.5px] text-white/65">Satın aldığın kredi hesabında kalır; döndüğünde kaldığın yerden devam edersin.</p>}
    </Pencere>
  );
}
