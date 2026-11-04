"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, Infinity as Sonsuz } from "lucide-react";
import { useAuth, PLAN_ADI } from "@/store/useAuth";
import { useEkler, aktifSinirsizlar } from "@/store/useEkler";
import { useHesapKaydi } from "@/components/ayarlar/AyarKabugu";
import { Grup, Hap, Pencere, Satir, Sayfa, dugme, akis, yay } from "@/components/ayarlar/ui";
import { kalanSure } from "@/components/api/ui";
import { MODELLER, PLANLAR } from "@/lib/catalog";
import { aylikFiyat, planBul, HIZ_SEVIYELERI, EK_ESZAMANLI, YILLIK_INDIRIM, SAGLAYICI_LOGO, VAYRA_LOGO, tl, sayi } from "@/lib/fiyat";
import { sonrakiYenileme, tarih } from "@/lib/ayarlar";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const NEDENLER = ["Çok pahalı", "Yeterince kullanmıyorum", "Başka bir araca geçiyorum", "Kalite beklentimi karşılamadı", "Geçici bir ara veriyorum", "Diğer"];
/** Her plan kendi gerçek üretim karesiyle tanınır. */
const KAPAK: Record<string, string> = {
  baslangic: "/gercek/sinirsiz/unl-nano-banana-pro.webp", arti: "/gercek/sinirsiz/unl-kling.webp",
  ultra: "/gercek/sinirsiz/unl-hero-dragon.webp", kurumsal: "/gercek/sinirsiz/unl-seedance.webp",
};
const SIRA = ["baslangic", "arti", "ultra", "kurumsal"];

function donemBasi(yenileme: number, donem: "aylik" | "yillik", baslangic: number) {
  const d = new Date(yenileme);
  return Math.max(new Date(d.getFullYear(), d.getMonth() - (donem === "yillik" ? 12 : 1), d.getDate(), d.getHours(), d.getMinutes()).getTime(), baslangic);
}

export default function PlanAyarlari() {
  const kullanici = useAuth((s) => s.kullanici)!;
  const { kayit, guncelle } = useHesapKaydi();
  const ab = kayit.abonelik;
  const plan = planBul(kullanici.plan)!;
  const kurumsal = kullanici.plan === "kurumsal";
  const fiyat = aylikFiyat(plan, ab.donem);
  const yenileme = sonrakiYenileme(ab.baslangic, ab.donem);
  const bitis = ab.iptal && ab.iptalTarihi ? ab.iptalTarihi : yenileme;
  const [iptalAcik, setIptalAcik] = useState(false);
  const [donemAcik, setDonemAcik] = useState(false);
  const ekler = useEkler();
  const [simdi, setSimdi] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setSimdi(Date.now()), 60_000); return () => clearInterval(t); }, []);
  const sinirsizlar = aktifSinirsizlar(ekler.sinirsizlar, simdi);
  const hiz = HIZ_SEVIYELERI.find((h) => h.id === ekler.hiz) ?? HIZ_SEVIYELERI[0];
  const esz = EK_ESZAMANLI.find((e) => e.adet === ekler.ekEsZamanli) ?? EK_ESZAMANLI[0];
  const aylikToplam = (kurumsal ? 0 : fiyat) + hiz.fiyat + esz.fiyat;
  const bas = donemBasi(yenileme, ab.donem, ab.baslangic);
  const ilerleme = Math.min(1, Math.max(0, (simdi - bas) / Math.max(1, yenileme - bas)));

  const surdur = () => {
    guncelle((h) => ({ ...h, abonelik: { ...h.abonelik, iptal: false, iptalTarihi: null, iptalNedeni: undefined } }));
    toast.success("Aboneliğin devam ediyor", { description: `${tarih(yenileme)} tarihinde yenilenecek.` });
  };

  const kart = (
    <div className="overflow-hidden rounded-[20px] bg-[#121214] ring-1 ring-inset ring-white/[0.08]">
      <div className="relative h-[190px] overflow-hidden">
        <motion.img initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 1.4, ease: akis }} src={KAPAK[kullanici.plan] ?? KAPAK.arti} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#121214_2%,rgba(18,18,20,0.6)_45%,rgba(18,18,20,0.05))]" />
        <div className="absolute inset-x-5 bottom-5 flex flex-wrap items-end justify-between gap-3 sm:inset-x-6">
          <div>
            <p className="text-[13px] font-medium text-white/65">Mevcut planın</p>
            <h2 className="mt-1 flex items-center gap-2.5 text-[28px] font-semibold leading-none tracking-[-0.03em] text-white">
              {PLAN_ADI[kullanici.plan]}<Hap ton={ab.iptal ? "sari" : "yesil"} className="tracking-normal">{ab.iptal ? "İptal edildi" : "Etkin"}</Hap>
            </h2>
          </div>
          <p className="text-right text-white">
            {kurumsal ? <span className="text-[14px] text-white/80">Sözleşmeli</span>
              : <><span className="text-[20px] font-semibold tabular-nums tracking-[-0.02em]">{tl(fiyat)}</span><span className="text-[14px] text-white/60"> / ay</span></>}
          </p>
        </div>
      </div>
      <div className="px-5 pb-5 pt-1 sm:px-6">
        <div className="flex items-center justify-between text-[12.5px] text-white/45">
          <span>{new Date(bas).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span>
          <span className="font-medium text-white/85">{kalanSure(bitis)} sonra {ab.iptal ? "bitiyor" : "yenilenir"}</span>
          <span>{new Date(bitis).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span>
        </div>
        <div className="mt-2 h-[6px] overflow-hidden rounded-full bg-white/[0.08]">
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: ilerleme }} transition={{ duration: 1, ease: akis, delay: 0.2 }} className={cn("h-full origin-left rounded-full", ab.iptal ? "bg-amber-400" : "bg-[#55d6fd]")} />
        </div>
        <dl className="mt-5 divide-y divide-white/[0.06] rounded-[14px] bg-white/[0.03]">
          {[["Dönem kredisi", `${sayi(plan.kredi)} kredi`], ["Faturalama", ab.donem === "yillik" ? "Yıllık" : "Aylık"], ["Aylık toplam", kurumsal ? "Sözleşmeli" : tl(aylikToplam)]].map(([e, d]) => (
            <div key={e} className="flex items-center justify-between px-4 py-2.5"><dt className="text-[13px] text-white/45">{e}</dt><dd className="truncate text-[14px] font-semibold tabular-nums text-white">{d}</dd></div>
          ))}
        </dl>
      </div>
      {ab.iptal && !kurumsal && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-amber-400/15 bg-amber-400/[0.05] px-5 py-3.5 sm:px-6">
          <p className="text-[13.5px] text-amber-100/85">{ab.iptalTarihi ? tarih(ab.iptalTarihi) : ""} tarihinde sona erecek. O güne kadar her şey açık.</p>
          <button type="button" onClick={surdur} className={dugme.birincil}>Aboneliği sürdür</button>
        </div>
      )}
    </div>
  );

  return (
    <Sayfa baslik="Plan" aciklama="Planın, yenileme tarihin ve plana eklediğin her şey. Fiyatlara KDV dahil değildir."
      sag={<Link href="/fiyatlandirma" className={cn(dugme.hayalet, "h-8 text-[13px]")}>Planları karşılaştır<ArrowUpRight className="h-3.5 w-3.5" /></Link>} yan={kart}>

      {!kurumsal && (
        <Grup id="donem" baslik="Faturalama">
          <Satir id="plan" ad="Ödeme dönemi" alt={ab.sonrakiDonem && ab.sonrakiDonem !== ab.donem ? `${tarih(ab.sonrakiDonemTarihi ?? yenileme)} tarihinde ${ab.sonrakiDonem === "yillik" ? "yıllığa" : "aylığa"} geçecek` : ab.donem === "aylik" ? `Yıllık faturalamada yüzde ${YILLIK_INDIRIM * 100} daha az ödersin.` : "Yıllık indirim uygulanıyor."}>
            <button type="button" onClick={() => setDonemAcik(true)} className={dugme.ikincil}>{ab.donem === "aylik" ? "Yıllığa geç" : "Aylığa geç"}</button>
          </Satir>
          <Satir ad={ab.iptal ? "Erişimin bitiyor" : "Sonraki ödeme"} alt={ab.iptal ? "Yenilenmeyecek" : `${tl(aylikToplam)} ${ab.donem === "yillik" ? "aylık eşdeğer" : ""}`.trim()}>
            <span className="text-[14px] tabular-nums text-white/75">{tarih(bitis)}</span>
          </Satir>
          <Satir ad="Makbuzlar ve fatura bilgileri">
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
        <Grup id="planlar" baslik="Planı değiştir" aciklama="Yükseltme hemen, düşürme dönem sonunda geçerli olur." govde>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {PLANLAR.filter((p) => p.id !== "kurumsal").map((p) => {
              const su = p.id === kullanici.plan;
              const yukari = SIRA.indexOf(p.id) > SIRA.indexOf(kullanici.plan);
              return (
                <div key={p.id} className={cn("relative flex flex-col overflow-hidden rounded-[18px] p-4", su ? "bg-white/[0.06]" : "bg-white/[0.03]")}>
                  {su && <motion.span layoutId="plan-cerceve" transition={yay} className="pointer-events-none absolute inset-0 rounded-[18px] ring-[1.5px] ring-inset ring-white" />}
                  <img src={KAPAK[p.id]} alt="" className="-mx-4 -mt-4 mb-3 h-20 w-[calc(100%+2rem)] max-w-none object-cover opacity-80" />
                  <p className="flex items-center justify-between text-[15.5px] font-semibold text-white">{p.ad}{su && <Hap ton="vurgu">Mevcut</Hap>}</p>
                  <p className="mt-1.5 text-[22px] font-semibold tabular-nums tracking-[-0.02em] text-white">{tl(aylikFiyat(p, ab.donem))}<span className="text-[13px] font-normal text-white/45"> / ay</span></p>
                  <p className="mt-0.5 text-[13px] text-white/50">{sayi(p.kredi)} kredi her dönem</p>
                  <div className="mt-auto pt-4">
                    {su ? <span className="flex h-9 items-center justify-center text-[13px] text-white/40">Şu an bu plandasın</span>
                      : <Link href="/panel/kredi?sekme=plan" className={cn(yukari ? dugme.birincil : dugme.ikincil, "w-full")}>{yukari ? "Yükselt" : "Düşür"}</Link>}
                  </div>
                </div>
              );
            })}
          </div>
        </Grup>
      )}

      <Grup baslik="Eklentiler" aciklama="Plana ek olarak aldığın sınırsız erişimler ve hız.">
        {sinirsizlar.map((s) => {
          const m = MODELLER.find((x) => x.id === s.model);
          return (
            <Satir key={s.model} on={<img src={SAGLAYICI_LOGO[m?.saglayici ?? ""] ?? VAYRA_LOGO} alt="" className="h-9 w-9 shrink-0 rounded-[10px] bg-white/[0.06] object-contain p-1.5" />}
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
        <Satir id="hiz" ad={<>Hız: {hiz.ad} <span className="font-normal text-white/45">({hiz.kat})</span></>} alt={hiz.ozet}>
          <span className="text-[13.5px] tabular-nums text-white/55">{hiz.fiyat ? `${tl(hiz.fiyat)} / ay` : "Dahil"}</span>
          <Link href="/panel/kredi?sekme=hiz" className={dugme.ikincil}>Değiştir</Link>
        </Satir>
        <Satir ad="Ek eşzamanlı üretim" alt={esz.adet ? `Planına ek ${esz.adet} iş aynı anda çalışır.` : "Planındaki eşzamanlı sınır geçerli."}>
          <span className="text-[13.5px] tabular-nums text-white/55">{esz.fiyat ? `${tl(esz.fiyat)} / ay` : "Yok"}</span>
          <Link href="/panel/kredi?sekme=hiz" className={dugme.ikincil}>Değiştir</Link>
        </Satir>
      </Grup>

      {!kurumsal && !ab.iptal && (
        <Grup id="iptal" baslik="Aboneliği iptal et" tehlike>
          <Satir ad="Yenilemeyi durdur" alt={`${tarih(yenileme)} tarihine kadar planın açık kalır. Kalan kredilerin silinmez; istediğin an sürdürebilirsin.`}>
            <button type="button" onClick={() => setIptalAcik(true)} className={dugme.tehlike}>İptal et</button>
          </Satir>
        </Grup>
      )}

      <DonemPenceresi acik={donemAcik} onKapat={() => setDonemAcik(false)} planId={kullanici.plan} />
      <IptalPenceresi acik={iptalAcik} onKapat={() => setIptalAcik(false)} yenileme={yenileme} />
    </Sayfa>
  );
}

function DonemPenceresi({ acik, onKapat, planId }: { acik: boolean; onKapat: () => void; planId: string }) {
  const { kayit, guncelle } = useHesapKaydi();
  const plan = planBul(planId)!;
  const hedef = kayit.abonelik.donem === "aylik" ? "yillik" : "aylik";
  const aylik = aylikFiyat(plan, "aylik"), yillik = aylikFiyat(plan, "yillik");
  const yenileme = sonrakiYenileme(kayit.abonelik.baslangic, kayit.abonelik.donem);
  const onayla = () => {
    guncelle((h) => ({ ...h, abonelik: { ...h.abonelik, sonrakiDonem: hedef, sonrakiDonemTarihi: yenileme } }));
    toast.success(hedef === "yillik" ? "Yıllık faturalamaya geçiş planlandı" : "Aylık faturalamaya geçiş planlandı", { description: `${tarih(yenileme)} tarihindeki yenilemede geçerli olacak.` });
    onKapat();
  };
  return (
    <Pencere acik={acik} onKapat={onKapat} baslik="Ödeme dönemini değiştir" aciklama={`Değişiklik ${tarih(yenileme)} tarihindeki yenilemede geçerli olur; bu dönem için ek ücret alınmaz.`}
      alt={<><button type="button" onClick={onKapat} className={dugme.hayalet}>Vazgeç</button><button type="button" onClick={onayla} className={dugme.birincil}>{hedef === "yillik" ? "Yıllığa geç" : "Aylığa geç"}</button></>}>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {([["aylik", "Aylık", `${tl(aylik)} / ay`], ["yillik", "Yıllık", `${tl(yillik)} / ay, yılda ${tl(yillik * 12)}`]] as const).map(([id, ad, alt]) => (
          <div key={id} className={cn("rounded-[16px] p-4", hedef === id ? "bg-white/[0.07] ring-[1.5px] ring-inset ring-white" : "bg-white/[0.04]")}>
            <p className="flex items-center justify-between text-[14.5px] font-semibold text-white">{ad}{id === "yillik" && <Hap ton="vurgu">Yüzde {YILLIK_INDIRIM * 100} indirim</Hap>}</p>
            <p className="mt-1 text-[13px] text-white/55">{alt}</p>
            <p className={cn("mt-3 text-[12px] font-medium", hedef === id ? "text-white" : "text-white/40")}>{hedef === id ? "Yeni dönem" : "Şu anki dönem"}</p>
          </div>
        ))}
      </div>
      {hedef === "yillik" && <p className="mt-4 text-[13.5px] text-emerald-300">Yılda {tl((aylik - yillik) * 12)} tasarruf edersin.</p>}
    </Pencere>
  );
}

function IptalPenceresi({ acik, onKapat, yenileme }: { acik: boolean; onKapat: () => void; yenileme: number }) {
  const { guncelle } = useHesapKaydi();
  const [neden, setNeden] = useState("");
  const kapat = () => { setNeden(""); onKapat(); };
  const iptal = () => {
    guncelle((h) => ({ ...h, abonelik: { ...h.abonelik, iptal: true, iptalTarihi: yenileme, iptalNedeni: neden } }));
    toast.success("Aboneliğin iptal edildi", { description: `${tarih(yenileme)} tarihine kadar her şey açık kalacak.` });
    kapat();
  };
  return (
    <Pencere acik={acik} onKapat={kapat} baslik="Aboneliği iptal et" aciklama={`Erişimin ${tarih(yenileme)} tarihine kadar sürer, sonra yenilenmez. Kalan kredilerin silinmez.`}
      alt={<><button type="button" onClick={kapat} className={dugme.hayalet}>Vazgeç</button><button type="button" onClick={iptal} disabled={!neden} className={dugme.tehlikeDolu}>İptal et</button></>}>
      <p className="mb-3 text-[14px] font-medium text-white">Neden ayrılıyorsun?</p>
      <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[16px] bg-white/[0.03]">
        {NEDENLER.map((n) => (
          <button key={n} type="button" aria-pressed={neden === n} onClick={() => setNeden(n)} className="flex w-full items-center justify-between px-4 py-3 text-left text-[14px] text-white/80 transition-colors hover:bg-white/[0.03]">
            {n}<span className={cn("flex h-5 w-5 items-center justify-center rounded-full transition-colors", neden === n ? "ring-[5px] ring-inset ring-white" : "ring-1 ring-inset ring-white/20")} />
          </button>
        ))}
      </div>
      {neden === "Çok pahalı" && <p className="mt-3 rounded-[14px] bg-white/[0.04] p-3.5 text-[13.5px] text-white/65">Yıllık faturalama aylık fiyatı yüzde {YILLIK_INDIRIM * 100} düşürür. Daha az kredi gerekiyorsa küçük bir plana da geçebilirsin.</p>}
      {neden === "Geçici bir ara veriyorum" && <p className="mt-3 rounded-[14px] bg-white/[0.04] p-3.5 text-[13.5px] text-white/65">Kalan kredilerin hesabında kalır; döndüğünde kaldığın yerden devam edersin.</p>}
    </Pencere>
  );
}
