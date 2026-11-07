"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Building2, Check, CircleDollarSign, Infinity as InfinityIcon, Users, X } from "lucide-react";
import {
  EKIP, ESZAMANLI, KART_OZELLIKLERI, KART_PLANLARI, KURUMSAL_OZELLIK, ORNEK_MALIYET, PLAN_ETIKET, PLAN_SINIRSIZ,
  SAGLAYICI_LOGO, SINIRSIZ_VITRIN, ULTRA_KREDI_KADEMELERI, UCRETSIZ, VAYRA_LOGO, YILLIK_INDIRIM,
  aylikFiyat, ekipFiyat, krediBasina, planBul, sayi, tl, tlKurus, type Donem, type KartPlanId, type PlanId,
} from "@/lib/fiyat";
import { MODELLER } from "@/lib/catalog";
import { useAuth } from "@/store/useAuth";
import { odemeyeGec } from "@/components/fiyat/OdemePenceresi";
import { davetliFiyat } from "@/lib/earn/davet";
import { cn } from "@/lib/utils";

/**
 * Plan kartları — /fiyatlandirma, /panel/kredi, kredi modalı ve ana sayfa aynı bileşeni kullanır.
 *  mod="site":  4 kart (Ücretsiz dahil). CTA /panel/kredi?sekme=plan&plan=<id>'ye götürür.
 *  mod="panel": 3 ücretli kart. CTA ödeme özetini açar (gerçek ödeme), mevcut plan işaretlenir.
 * Yoğunluk referansı: Higgsfield / Krea / Magnific fiyat kartları.
 */
export type FiyatModu = "site" | "panel";
export type Kitle = "bireysel" | "ekip";

const logo = (modelId: string) => {
  const m = MODELLER.find((x) => x.id === modelId);
  return { ad: m?.ad ?? modelId, src: (m && SAGLAYICI_LOGO[m.saglayici]) ?? VAYRA_LOGO };
};

/* ───────────── Dönem ve kitle seçicileri ───────────── */

export function DonemSecici({ donem, setDonem }: { donem: Donem; setDonem: (d: Donem) => void; kimlik?: string }) {
  const yillik = donem === "yillik";
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/[0.08] bg-yuzey py-1.5 pl-4 pr-1.5">
      <button onClick={() => setDonem("aylik")} className={cn("text-[13.5px] font-medium transition-colors", yillik ? "text-metin-3 hover:text-white" : "text-white")}>Aylık</button>
      <button role="switch" aria-checked={yillik} aria-label="Yıllık faturalandırma" onClick={() => setDonem(yillik ? "aylik" : "yillik")}
        className={cn("relative h-6 w-11 rounded-full transition-colors", yillik ? "bg-vurgu" : "bg-white/15")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full transition-all duration-200", yillik ? "left-[22px] bg-white" : "left-0.5 bg-white")} />
      </button>
      <button onClick={() => setDonem("yillik")} className={cn("text-[13.5px] font-medium transition-colors", yillik ? "text-white" : "text-metin-3 hover:text-white")}>Yıllık</button>
      <span className="rounded-full bg-emerald-400/12 px-2 py-1 text-[11px] font-bold text-emerald-300">yüzde {Math.round(YILLIK_INDIRIM * 100)} tasarruf</span>
    </div>
  );
}

export function KitleSecici({ kitle, setKitle }: { kitle: Kitle; setKitle: (k: Kitle) => void }) {
  return (
    <div role="tablist" aria-label="Plan türü" className="inline-flex rounded-full border border-white/[0.08] bg-yuzey p-1">
      {([["bireysel", "Bireysel"], ["ekip", "Ekip & Kurumsal"]] as const).map(([id, ad]) => (
        <button key={id} role="tab" aria-selected={kitle === id} onClick={() => setKitle(id)}
          className={cn("relative rounded-full px-4 py-1.5 text-[13.5px] font-medium transition-colors", kitle === id ? "text-zemin" : "text-metin-2 hover:text-white")}>
          {kitle === id && <motion.span layoutId="kitleHap" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
          <span className="relative">{ad}</span>
        </button>
      ))}
    </div>
  );
}

/* ───────────── Bireysel kartlar ───────────── */

/** odak: dışarıdan gelinen plan (ör. ?plan=arti) — kart halkayla vurgulanır. */
export function PlanKartlari({ donem, mod, odak }: { donem: Donem; mod: FiyatModu; odak?: string | null }) {
  const planlar = mod === "site" ? KART_PLANLARI : KART_PLANLARI.filter((p) => p !== "ucretsiz");
  return (
    <div className={cn("grid gap-3 md:grid-cols-2", planlar.length === 4 ? "xl:grid-cols-4" : "lg:grid-cols-3")}>
      {planlar.map((id, i) => <PlanKart key={id} id={id} donem={donem} mod={mod} sira={i} odak={odak === id} />)}
    </div>
  );
}

// Panelde kullanıcı zaten bir plandadır: "Başla" yerine geçiş dili.
const PANEL_CTA: Partial<Record<KartPlanId, string>> = { baslangic: "Başlangıç'a geç" };

function PlanKart({ id, donem, mod, sira, odak }: { id: KartPlanId; donem: Donem; mod: FiyatModu; sira: number; odak?: boolean }) {
  const mevcut = useAuth((s) => s.kullanici?.plan);
  const girisli = useAuth((s) => s.girisYapildi);
  const davetIndirimi = useAuth((s) => s.kullanici?.davetIndirimi === "bekliyor");
  const [kademe, setKademe] = useState(0);

  const ucretsiz = id === "ucretsiz";
  const p = ucretsiz ? null : planBul(id)!;
  const ultra = id === "ultra";
  const kredi = ucretsiz ? 0 : ultra ? ULTRA_KREDI_KADEMELERI[kademe] : p!.kredi;
  const fiyat = p ? aylikFiyat(p, donem, kredi) : 0;
  const aylikTam = p ? aylikFiyat(p, "aylik", kredi) : 0;
  const yillikTasarruf = (aylikTam - fiyat) * 12;
  const etiket = PLAN_ETIKET[id];
  const vurgu = id === "arti";
  const buPlan = mod === "panel" && girisli && mevcut === id;
  const sutun = KART_PLANLARI.indexOf(id);
  const gorselKredi = ucretsiz ? UCRETSIZ.gunluk : kredi;

  const sec = () => {
    if (buPlan || !p) return;
    // Fiyat, davet indirimi ve kalan süre farkı sunucuda hesaplanır; ödeme sağlayıcının güvenli sayfasında yapılır.
    odemeyeGec({ tur: "plan", urun: ultra && kredi !== ULTRA_KREDI_KADEMELERI[0] ? `ultra-${kredi}` : (id as PlanId), donem });
  };

  const ctaSinif = cn(
    "flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-[opacity,background-color]",
    buPlan ? "cursor-default border border-white/[0.1] text-metin-3"
      : vurgu ? "bg-white text-zemin hover:opacity-90" : "bg-white/[0.08] text-white hover:bg-white/[0.13]",
  );
  const ctaMetin = ucretsiz ? UCRETSIZ.cta : buPlan ? "Kullandığın plan" : mod === "panel" ? (PANEL_CTA[id] ?? p!.cta) : p!.cta;
  const sinirsizEk = PLAN_SINIRSIZ[id].filter((s) => !SINIRSIZ_VITRIN.includes(s.model)).length;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: sira * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative flex flex-col rounded-[22px] border p-5",
        vurgu ? "border-vurgu/50 bg-[color-mix(in_oklab,var(--vurgu-renk)_20%,#111113)]" : "border-white/[0.07] bg-yuzey",
        odak && "ring-2 ring-white/70 ring-offset-4 ring-offset-zemin")}>
      {/* Başlık */}
      <div className="flex min-h-[26px] items-center justify-between gap-2">
        <h3 className="text-[20px] font-semibold tracking-[-0.02em] text-white">{ucretsiz ? UCRETSIZ.ad : p!.ad}</h3>
        {buPlan ? <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10.5px] font-semibold text-white/80">Mevcut planın</span>
          : etiket.rozet && <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", vurgu ? "bg-vurgu text-vurgu-ust" : "border border-vurgu/40 text-vurgu")}>{etiket.rozet}</span>}
      </div>
      <p className="mt-1 text-[13px] text-metin-3">{etiket.kime}</p>

      {/* Kredi kutusu — neye yeter, model logolarıyla */}
      <div className="mt-4 rounded-2xl bg-white/[0.04] p-3.5 ring-1 ring-inset ring-white/[0.05]">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-white">
          <CircleDollarSign className="h-4 w-4 text-vurgu" />
          {ucretsiz ? <>{UCRETSIZ.gunluk} kredi <span className="font-normal text-metin-2">/ gün</span></> : <>{sayi(kredi)} kredi <span className="font-normal text-metin-2">/ ay</span></>}
        </p>
        <ul className="mt-2.5 space-y-1.5 text-[12.5px] text-metin-2">
          <li className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo("nano-banana-pro").src} alt="" className="h-3.5 w-3.5" />
            {sayi(Math.floor(gorselKredi / ORNEK_MALIYET.gorsel.kredi))} Nano Banana Pro görseli{ucretsiz && " / gün"}
          </li>
          <li className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ucretsiz ? VAYRA_LOGO : logo("seedance-2").src} alt="" className="h-3.5 w-3.5 object-contain" />
            {ucretsiz ? `+ ${UCRETSIZ.hosgeldin} kredi hoş geldin hediyesi` : `yaklaşık ${sayi(Math.floor(kredi / ORNEK_MALIYET.video.kredi))} Seedance 2.0 videosu`}
          </li>
        </ul>
        {ultra && (
          <div className="mt-3.5">
            <input type="range" min={0} max={ULTRA_KREDI_KADEMELERI.length - 1} step={1} value={kademe}
              onChange={(e) => setKademe(Number(e.target.value))} aria-label="Ultra aylık kredi miktarı"
              aria-valuetext={`${sayi(kredi)} kredi`}
              className="fiyat-kaydirici w-full" style={{ ["--dolu" as string]: `${(kademe / (ULTRA_KREDI_KADEMELERI.length - 1)) * 100}%` }} />
            <div className="mt-1.5 flex justify-between text-[11px] tabular-nums">
              {ULTRA_KREDI_KADEMELERI.map((k, i) => (
                <button key={k} onClick={() => setKademe(i)} className={cn(i === kademe ? "font-semibold text-white" : "text-metin-3 hover:text-white")}>{sayi(k)}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fiyat */}
      <div className="mt-5 flex items-end gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={fiyat} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
            className="text-[38px] font-semibold leading-none tracking-[-0.03em] text-white tabular-nums">{ucretsiz ? "₺0" : tl(fiyat)}</motion.span>
        </AnimatePresence>
        {!ucretsiz && donem === "yillik" && <s className="pb-1 text-[15px] tabular-nums text-metin-3">{tl(aylikTam)}</s>}
        <span className="pb-1 text-[12.5px] text-metin-3">/ ay</span>
      </div>
      <p className="mt-1.5 min-h-[18px] text-[12px] text-metin-3">
        {ucretsiz ? "Kart bilgisi gerekmez"
          : donem === "yillik" ? <>Yıllık faturalandırılır · <span className="font-medium text-emerald-300">yılda {tl(yillikTasarruf)} tasarruf</span></>
          : <>Aylık faturalandırılır · {tlKurus(krediBasina(fiyat, kredi))} / kredi</>}
      </p>

      <div className="mt-4">
        {ucretsiz ? <Link href="/panel" className={ctaSinif}>{ctaMetin}</Link>
          : mod === "panel" ? <button onClick={sec} disabled={buPlan} className={ctaSinif}>{ctaMetin}</button>
          : <Link href={`/panel/kredi?sekme=plan&plan=${id}`} className={ctaSinif}>{ctaMetin}</Link>}
      </div>
      {davetIndirimi && !ucretsiz && !buPlan && (
        <p className="mt-2 text-center text-[12px] text-tur-3d">Davet indirimi: ilk ödemen {tl(davetliFiyat(fiyat))}</p>
      )}

      {/* Sınırsız modeller */}
      <div className="mt-4 rounded-2xl border border-white/[0.06] p-3">
        <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-metin-3">
          <InfinityIcon className="h-3.5 w-3.5" /> Sınırsız modeller
        </p>
        {SINIRSIZ_VITRIN.map((mid) => {
          const hak = PLAN_SINIRSIZ[id].find((s) => s.model === mid);
          const l = logo(mid);
          return (
            <div key={mid} className="flex items-center justify-between gap-2 px-1 py-1">
              <span className={cn("flex min-w-0 items-center gap-2 text-[12.5px]", hak ? "text-white" : "text-metin-3")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.src} alt="" className={cn("h-3.5 w-3.5 shrink-0", !hak && "opacity-40 grayscale")} />
                <span className="truncate">{l.ad}</span>
              </span>
              {hak ? <span className="shrink-0 rounded-md bg-white px-1.5 py-px text-[10px] font-bold text-zemin">{hak.etiket}</span>
                : <span className="shrink-0 text-[10.5px] text-metin-3">Yok</span>}
            </div>
          );
        })}
        {sinirsizEk > 0 && <p className="px-1 pt-1 text-[11.5px] text-metin-2">+ {sinirsizEk} model daha</p>}
      </div>

      {/* Özellikler — planda olmayanlar gri */}
      <p className="mt-5 text-[12.5px] text-white/85">Aynı anda {ESZAMANLI[id].video} video · {ESZAMANLI[id].gorsel} görsel üretimi</p>
      <ul className="mt-3 space-y-2">
        {KART_OZELLIKLERI.map((o) => {
          const var_ = o.d[sutun];
          return (
            <li key={o.ad} className={cn("flex items-start gap-2 text-[12.5px] leading-snug", var_ ? "text-white/85" : "text-white/30")}>
              {var_ ? <Check className="mt-px h-3.5 w-3.5 shrink-0 text-white" strokeWidth={2.6} /> : <X className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />}
              <span>{o.ad}</span>
              {o.yeni && var_ && <span className="ml-auto shrink-0 rounded bg-white/[0.08] px-1 py-px text-[9.5px] font-bold text-white/80">YENİ</span>}
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}

/* ───────────── Ekip & Kurumsal ───────────── */

export function EkipKartlari({ donem }: { donem: Donem }) {
  const [kademe, setKademe] = useState(1);
  const kredi = EKIP.kademeler[kademe];
  const fiyat = ekipFiyat(kredi, donem);
  const tam = ekipFiyat(kredi, "aylik");
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {/* Ekip */}
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="flex flex-col rounded-[22px] border border-vurgu/50 bg-[color-mix(in_oklab,var(--vurgu-renk)_20%,#111113)] p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-[22px] font-semibold tracking-[-0.02em] text-white"><Users className="h-5 w-5" /> {EKIP.ad}</h3>
            <p className="mt-1 max-w-[380px] text-[13.5px] text-metin-2">{EKIP.ozet}</p>
          </div>
          <span className="shrink-0 rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/85">{EKIP.uyeler}</span>
        </div>

        <div className="mt-6 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-inset ring-white/[0.05]">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-[15px] font-semibold text-white">{sayi(kredi)} kredi <span className="font-normal text-metin-2">/ ay ortak havuz</span></p>
            <p className="text-[12px] text-metin-3">yaklaşık {sayi(Math.floor(kredi / ORNEK_MALIYET.gorsel.kredi))} görsel · {sayi(Math.floor(kredi / ORNEK_MALIYET.video.kredi))} video</p>
          </div>
          <input type="range" min={0} max={EKIP.kademeler.length - 1} step={1} value={kademe} onChange={(e) => setKademe(Number(e.target.value))}
            aria-label="Ekip aylık kredi havuzu" aria-valuetext={`${sayi(kredi)} kredi`}
            className="fiyat-kaydirici mt-4 w-full" style={{ ["--dolu" as string]: `${(kademe / (EKIP.kademeler.length - 1)) * 100}%` }} />
          <div className="mt-1.5 flex justify-between text-[11px] tabular-nums">
            {EKIP.kademeler.map((k, i) => (
              <button key={k} onClick={() => setKademe(i)} className={cn(i === kademe ? "font-semibold text-white" : "text-metin-3 hover:text-white")}>{sayi(k / 1000)}B</button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-end gap-2">
              <span className="text-[38px] font-semibold leading-none tracking-[-0.03em] text-white tabular-nums">{tl(fiyat)}</span>
              {donem === "yillik" && <s className="pb-1 text-[15px] tabular-nums text-metin-3">{tl(tam)}</s>}
              <span className="pb-1 text-[12.5px] text-metin-3">/ ay</span>
            </p>
            <p className="mt-1.5 text-[12px] text-metin-3">{tlKurus(krediBasina(fiyat, kredi))} / kredi · {donem === "yillik" ? "yıllık faturalandırılır" : "aylık faturalandırılır"}</p>
          </div>
          <Link href="/iletisim" className="flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-[14px] font-semibold text-zemin transition-opacity hover:opacity-90">
            Ekip planını başlat <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <ul className="mt-6 grid gap-x-6 gap-y-2 border-t border-white/[0.06] pt-5 sm:grid-cols-2">
          {EKIP.ozellikler.map((o) => <li key={o} className="flex items-start gap-2 text-[13px] text-white/85"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.6} />{o}</li>)}
          {EKIP.ozellikDisi.map((o) => <li key={o} className="flex items-start gap-2 text-[13px] text-white/30"><X className="mt-0.5 h-3.5 w-3.5 shrink-0" />{o}</li>)}
        </ul>
      </motion.div>

      {/* Kurumsal */}
      <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.06 }}
        className="relative isolate flex flex-col overflow-hidden rounded-[22px] border border-white/[0.08] p-6 sm:p-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/gercek/orig/banner-atlas-creative.webp" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0a0a0b]/95 via-[#0a0a0b]/85 to-[#0a0a0b]/55" />
        <h3 className="flex items-center gap-2 text-[22px] font-semibold tracking-[-0.02em] text-white"><Building2 className="h-5 w-5" /> Kurumsal</h3>
        <p className="mt-1 max-w-[380px] text-[13.5px] text-white/70">Yaratıcı üretimin iş açısından kritik olduğu kurumlar için güvenlik, ölçek ve özel destek.</p>
        <p className="mt-8 text-[30px] font-semibold tracking-[-0.03em] text-white">Size özel fiyat</p>
        <p className="mt-1 text-[12.5px] text-white/60">Hacminize göre kredi başı maliyet ve sözleşme</p>
        <Link href="/iletisim" className="mt-6 flex h-11 w-fit items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-[14px] font-semibold text-white backdrop-blur-md transition-colors hover:bg-white hover:text-zemin">
          Satış ekibiyle görüş <ArrowRight className="h-4 w-4" />
        </Link>
        <ul className="mt-auto grid gap-x-6 gap-y-2 border-t border-white/10 pt-5 sm:grid-cols-2">
          {KURUMSAL_OZELLIK.map((o) => <li key={o} className="flex items-start gap-2 text-[13px] text-white/85"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.6} />{o}</li>)}
        </ul>
      </motion.div>
    </div>
  );
}

/** Bireysel kartların altında ekiplere yönlendiren ince şerit (ana sayfa ve panel). */
export function KurumsalSerit() {
  return (
    <div className="mt-3 flex flex-col gap-4 rounded-[22px] border border-white/[0.07] bg-yuzey px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-3 text-[14px] text-white">
        <Users className="h-5 w-5 shrink-0 text-white/70" />
        <span><span className="font-semibold">Ekip ya da kurum musunuz?</span> <span className="text-metin-2">Ortak kredi havuzu, koltuk başı ücret yok. Kredi başı {tlKurus(EKIP.krediBasinaTL * (1 - YILLIK_INDIRIM))}&apos;den başlayan fiyatlar.</span></span>
      </p>
      <Link href="/fiyatlandirma?kitle=ekip" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-white/[0.14] px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-white/[0.05]">
        Ekip planları <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
