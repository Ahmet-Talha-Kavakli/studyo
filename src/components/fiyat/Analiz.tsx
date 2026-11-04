"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, BadgeCheck, Box, Check, ChevronDown, Film, Image as ImageIcon, Megaphone, Minus, Music, Receipt, RotateCcw, ShieldCheck,
  Sparkles, type LucideIcon,
} from "lucide-react";
import {
  ESZAMANLI, KART_OZELLIKLERI, KART_PLANLARI, ORNEK_MALIYET, PLAN_ETIKET, SAGLAYICI_LOGO, ULTRA_KREDI_KADEMELERI, UCRETSIZ, VAYRA_LOGO,
  aylikFiyat, ekipFiyat, EKIP, kartKredi, krediBasina, modelErisim, planBul, sayi, sinirsizMi, tl, tlKurus,
  type Donem, type KartPlanId,
} from "@/lib/fiyat";
import { MODELLER, type AIModel } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const planAd = (id: KartPlanId) => (id === "ucretsiz" ? UCRETSIZ.ad : planBul(id)!.ad);
const planFiyat = (id: KartPlanId, donem: Donem) => (id === "ucretsiz" ? 0 : aylikFiyat(planBul(id)!, donem));
const planLink = (id: KartPlanId) => (id === "ucretsiz" ? "/panel" : `/panel/kredi?sekme=plan&plan=${id}`);
const planCta = (id: KartPlanId) => (id === "ucretsiz" ? UCRETSIZ.cta : planBul(id)!.cta);

/* ═══════════════════ Plan bulucu ═══════════════════ */

type Tur = { id: string; ad: string; ikon: LucideIcon; kredi: number };
const TURLER: Tur[] = [
  { id: "gorsel", ad: "Görsel", ikon: ImageIcon, kredi: ORNEK_MALIYET.gorsel.kredi },
  { id: "video", ad: "Video", ikon: Film, kredi: ORNEK_MALIYET.video.kredi },
  { id: "ses", ad: "Ses & müzik", ikon: Music, kredi: Math.round((ORNEK_MALIYET.ses.kredi + ORNEK_MALIYET.muzik.kredi) / 2) },
  { id: "uc", ad: "3D", ikon: Box, kredi: ORNEK_MALIYET.uc.kredi },
  { id: "reklam", ad: "Reklam & ürün", ikon: Megaphone, kredi: Math.round((ORNEK_MALIYET.gorsel.kredi + ORNEK_MALIYET.video.kredi) / 2) },
];
const ADETLER = [10, 25, 50, 100, 250, 500];
type Ihtiyac = { id: string; ad: string; plan: KartPlanId | "ekip" };
const IHTIYACLAR: Ihtiyac[] = [
  { id: "ticari", ad: "Ticari kullanım", plan: "baslangic" },
  { id: "video", ad: "Veo, Sora, Kling", plan: "arti" },
  { id: "studyo", ad: "Sinema & Pazarlama stüdyosu", plan: "arti" },
  { id: "4k", ad: "4K çıktı", plan: "ultra" },
  { id: "api", ad: "API & MCP", plan: "ultra" },
  { id: "ekip", ad: "Ekip çalışması", plan: "ekip" },
];
const SIRA: (KartPlanId | "ekip")[] = ["ucretsiz", "baslangic", "arti", "ultra", "ekip"];

function Cip({ secili, onClick, children }: { secili: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={secili}
      className={cn("flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-colors",
        secili ? "border-white bg-white text-zemin" : "border-white/[0.1] text-metin-2 hover:border-white/25 hover:text-white")}>
      {children}
    </button>
  );
}

export function PlanBulucu({ donem }: { donem: Donem }) {
  const [turler, setTurler] = useState<string[]>(["gorsel", "video"]);
  const [adetIdx, setAdetIdx] = useState(2);
  const [ihtiyac, setIhtiyac] = useState<string[]>(["ticari"]);
  const degistir = (dizi: string[], set: (x: string[]) => void, id: string) => set(dizi.includes(id) ? dizi.filter((x) => x !== id) : [...dizi, id]);

  const sonuc = useMemo(() => {
    const secilen = TURLER.filter((t) => turler.includes(t.id));
    const ortalama = secilen.length ? secilen.reduce((t, x) => t + x.kredi, 0) / secilen.length : ORNEK_MALIYET.gorsel.kredi;
    const adet = ADETLER[adetIdx];
    const gereken = Math.round(adet * ortalama);

    // Krediye göre en küçük yeterli plan
    let krediPlani: KartPlanId | "ekip" = "ekip";
    let krediMiktar = 0;
    for (const id of ["ucretsiz", "baslangic", "arti", "ultra"] as KartPlanId[]) {
      if (id === "ultra") { const k = ULTRA_KREDI_KADEMELERI.find((x) => x >= gereken); if (k) { krediPlani = "ultra"; krediMiktar = k; break; } }
      else if (kartKredi(id) >= gereken) { krediPlani = id; krediMiktar = kartKredi(id); break; }
    }
    // Özelliğe göre en küçük yeterli plan
    const secIht = IHTIYACLAR.filter((i) => ihtiyac.includes(i.id));
    const ozellikPlani = secIht.reduce<KartPlanId | "ekip">((en, i) => (SIRA.indexOf(i.plan) > SIRA.indexOf(en) ? i.plan : en), "ucretsiz");
    const plan = SIRA.indexOf(ozellikPlani) > SIRA.indexOf(krediPlani) ? ozellikPlani : krediPlani;
    if (plan !== "ekip" && plan !== krediPlani) krediMiktar = plan === "ultra" ? ULTRA_KREDI_KADEMELERI[0] : kartKredi(plan);
    if (plan === "ekip") krediMiktar = EKIP.kademeler.find((k) => k >= gereken) ?? EKIP.kademeler[EKIP.kademeler.length - 1];

    const nedenler: string[] = [];
    nedenler.push(`Ayda yaklaşık ${adet} ${secilen.length === 1 ? secilen[0].ad.toLocaleLowerCase("tr-TR") : "içerik"} için yaklaşık ${sayi(gereken)} kredi gerekir.`);
    const belirleyici = secIht.filter((i) => i.plan === plan);
    if (belirleyici.length && plan !== krediPlani) nedenler.push(`${belirleyici.map((b) => b.ad).join(", ")} ${plan === "ekip" ? "ekip planında" : `${planAd(plan as KartPlanId)} planından itibaren`} açık.`);
    if (plan !== "ekip") {
      const oran = Math.min(1, gereken / Math.max(1, krediMiktar));
      nedenler.push(oran >= 0.98 ? "Planın kredisini tam karşılıyor." : `Kredinin %${Math.round(oran * 100)}'ini kullanırsın; ${sayi(krediMiktar - gereken)} kredi esneklik payı kalır.`);
    } else nedenler.push("Ortak kredi havuzu ve üye yönetimiyle ekibin tek hesaptan üretir.");
    if (donem === "yillik" && plan !== "ucretsiz") nedenler.push("Yıllık ödemede %20 daha az ödersin.");

    const fiyat = plan === "ekip" ? ekipFiyat(krediMiktar, donem) : plan === "ucretsiz" ? 0 : aylikFiyat(planBul(plan)!, donem, krediMiktar);
    return { plan, krediMiktar, gereken, fiyat, nedenler, adet };
  }, [turler, adetIdx, ihtiyac, donem]);

  const ad = sonuc.plan === "ekip" ? "Ekip" : planAd(sonuc.plan);
  const link = sonuc.plan === "ekip" ? "/fiyatlandirma?kitle=ekip" : planLink(sonuc.plan);

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="space-y-8 rounded-[24px] border border-white/[0.07] bg-yuzey p-6 sm:p-8">
        <div>
          <p className="mb-3 text-[14px] font-semibold text-white"><span className="mr-2 text-metin-3">1</span>Ne üretmek istiyorsun?</p>
          <div className="flex flex-wrap gap-2">
            {TURLER.map((t) => <Cip key={t.id} secili={turler.includes(t.id)} onClick={() => degistir(turler, setTurler, t.id)}><t.ikon className="h-4 w-4" />{t.ad}</Cip>)}
          </div>
        </div>
        <div>
          <p className="mb-4 flex items-baseline justify-between text-[14px] font-semibold text-white">
            <span><span className="mr-2 text-metin-3">2</span>Ayda kaç içerik üretiyorsun?</span>
            <span className="text-[13px] font-normal text-metin-2"><span className="font-semibold text-white">{ADETLER[adetIdx]}{adetIdx === ADETLER.length - 1 && "+"}</span> içerik</span>
          </p>
          <input type="range" min={0} max={ADETLER.length - 1} step={1} value={adetIdx} onChange={(e) => setAdetIdx(Number(e.target.value))}
            aria-label="Aylık içerik sayısı" aria-valuetext={`${ADETLER[adetIdx]} içerik`}
            className="fiyat-kaydirici w-full" style={{ ["--dolu" as string]: `${(adetIdx / (ADETLER.length - 1)) * 100}%` }} />
          <div className="mt-2 flex justify-between text-[11.5px] tabular-nums text-metin-3">
            {ADETLER.map((a, i) => <button key={a} onClick={() => setAdetIdx(i)} className={cn(i === adetIdx && "font-semibold text-white")}>{a}{i === ADETLER.length - 1 && "+"}</button>)}
          </div>
        </div>
        <div>
          <p className="mb-3 text-[14px] font-semibold text-white"><span className="mr-2 text-metin-3">3</span>Neye ihtiyacın var?</p>
          <div className="flex flex-wrap gap-2">
            {IHTIYACLAR.map((i) => <Cip key={i.id} secili={ihtiyac.includes(i.id)} onClick={() => degistir(ihtiyac, setIhtiyac, i.id)}>{i.ad}</Cip>)}
          </div>
        </div>
      </div>

      <div className="relative flex flex-col overflow-hidden rounded-[24px] border border-vurgu/50 bg-[color-mix(in_oklab,var(--vurgu-renk)_20%,#111113)] p-6 sm:p-8">
        <p className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-metin-3"><Sparkles className="h-3.5 w-3.5 text-vurgu" /> Önerimiz</p>
        <AnimatePresence mode="wait">
          <motion.div key={`${sonuc.plan}-${sonuc.krediMiktar}-${donem}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}
            className="flex flex-1 flex-col">
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[34px] font-semibold leading-none tracking-[-0.03em] text-white">{ad}</p>
                <p className="mt-2 text-[13px] text-metin-2">{sonuc.plan === "ekip" ? EKIP.ozet : PLAN_ETIKET[sonuc.plan].kime}</p>
              </div>
              <p className="shrink-0 text-right">
                <span className="block text-[24px] font-semibold text-white tabular-nums">{sonuc.plan === "ucretsiz" ? "₺0" : tl(sonuc.fiyat)}</span>
                <span className="text-[12px] text-metin-3">/ ay · {sayi(sonuc.krediMiktar || kartKredi("ucretsiz"))} kredi</span>
              </p>
            </div>
            <p className="mt-7 text-[12.5px] font-semibold text-white">Neden bu plan?</p>
            <ul className="mt-3 space-y-2.5">
              {sonuc.nedenler.map((n) => <li key={n} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-white/80"><Check className="mt-0.5 h-4 w-4 shrink-0 text-white" strokeWidth={2.5} />{n}</li>)}
            </ul>
            <div className="mt-auto pt-8">
              <Link href={link} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-[14px] font-semibold text-zemin transition-opacity hover:opacity-90">
                {sonuc.plan === "ekip" ? "Ekip planlarını gör" : planCta(sonuc.plan)} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════ Ayrıntılı karşılaştırma ═══════════════════ */

type Hucre = { tip: "var" } | { tip: "yok" } | { tip: "metin"; v: string; alt?: string; vurgu?: boolean };
type Satir = { ad: string; alt?: string; logo?: string; hucreler: Hucre[] };
type Grup = { ad: string; satirlar: Satir[] };

const VAR: Hucre = { tip: "var" };
const YOK: Hucre = { tip: "yok" };
const M = (v: string, alt?: string, vurgu?: boolean): Hucre => ({ tip: "metin", v, alt, vurgu });
const BIRIM: Record<AIModel["tur"], string> = { video: "video", gorsel: "görsel", ses: "ses", muzik: "şarkı", "3d": "model" };

function modelSatiri(m: AIModel): Satir {
  return {
    ad: m.ad, alt: `${m.kredi} kredi / üretim`, logo: SAGLAYICI_LOGO[m.saglayici] ?? VAYRA_LOGO,
    hucreler: KART_PLANLARI.map((p) => {
      if (!modelErisim(m.id, p)) return YOK;
      const s = sinirsizMi(m.id, p);
      if (s) return M("∞", s.etiket, true);
      return M(`${sayi(Math.floor(kartKredi(p) / m.kredi))} ${BIRIM[m.tur]}`);
    }),
  };
}

function gruplar(donem: Donem): Grup[] {
  const tur = (t: AIModel["tur"][]) => MODELLER.filter((m) => t.includes(m.tur)).sort((a, b) => b.kredi - a.kredi).map(modelSatiri);
  return [
    {
      ad: "Krediler",
      satirlar: [
        { ad: "Aylık kredi", hucreler: KART_PLANLARI.map((p) => p === "ucretsiz" ? M(`${UCRETSIZ.gunluk} / gün`, `+${UCRETSIZ.hosgeldin} hoş geldin`) : M(sayi(kartKredi(p)), p === "ultra" ? "9.000'e kadar" : undefined)) },
        { ad: "Kredi başına maliyet", hucreler: KART_PLANLARI.map((p) => p === "ucretsiz" ? M("—") : M(tlKurus(krediBasina(planFiyat(p, donem), kartKredi(p))), undefined, p === "ultra")) },
        { ad: "Kullanılmayan kredi devri", hucreler: [YOK, YOK, VAR, VAR] },
        { ad: "Ek kredi paketi alma", hucreler: [YOK, VAR, VAR, VAR] },
        { ad: "Aynı anda video / görsel", hucreler: KART_PLANLARI.map((p) => M(`${ESZAMANLI[p].video} / ${ESZAMANLI[p].gorsel}`)) },
      ],
    },
    { ad: "Video", satirlar: tur(["video"]) },
    { ad: "Görsel", satirlar: tur(["gorsel"]) },
    { ad: "Ses & müzik", satirlar: tur(["ses", "muzik"]) },
    { ad: "3D", satirlar: tur(["3d"]) },
    { ad: "Stüdyolar & özellikler", satirlar: KART_OZELLIKLERI.map((o) => ({ ad: o.ad, hucreler: o.d.map((v) => (v ? VAR : YOK)) })) },
  ];
}

function HucreGoster({ h, vurgu }: { h: Hucre; vurgu?: boolean }) {
  if (h.tip === "var") return <Check className={cn("h-4 w-4", vurgu ? "text-white" : "text-white/75")} strokeWidth={2.5} aria-label="Var" />;
  if (h.tip === "yok") return <Minus className="h-4 w-4 text-white/20" aria-label="Yok" />;
  return (
    <span className="block">
      <span className={cn("block text-[13px] tabular-nums", h.vurgu || vurgu ? "font-semibold text-white" : "text-white/75")}>{h.v}</span>
      {h.alt && <span className="block text-[11px] text-metin-3">{h.alt}</span>}
    </span>
  );
}

const KISA_SATIR = 12; // kapalıyken görünen satır sayısı

export function Karsilastirma({ donem }: { donem: Donem }) {
  const [acik, setAcik] = useState(false);
  const tum = gruplar(donem);
  const toplam = tum.reduce((t, g) => t + g.satirlar.length, 0);

  // Kapalıyken ilk KISA_SATIR satır (grup başlıklarıyla birlikte) gösterilir.
  let kalan = KISA_SATIR;
  const gorunen = acik ? tum : tum.map((g) => { const s = g.satirlar.slice(0, Math.max(0, kalan)); kalan -= s.length; return { ...g, satirlar: s }; }).filter((g) => g.satirlar.length);

  return (
    <>
      <KarsilastirmaMobil donem={donem} />
      <div className="relative hidden rounded-[24px] border border-white/[0.07] bg-yuzey md:block">
        {/* Yapışkan başlık — sayfa kayarken plan adları ve fiyatlar görünür kalır */}
        <div className="sticky top-[var(--ust-nav)] z-10 grid grid-cols-[minmax(220px,1.3fr)_repeat(4,minmax(0,1fr))] rounded-t-[24px] border-b border-white/[0.06] bg-yuzey/95 backdrop-blur-xl">
          <div className="flex items-end px-6 pb-5 pt-6 text-[12.5px] text-metin-3">{donem === "yillik" ? "Yıllık faturalandırma" : "Aylık faturalandırma"}</div>
          {KART_PLANLARI.map((p) => (
            <div key={p} className={cn("px-4 pb-5 pt-6", p === "arti" && "bg-vurgu/[0.08]")}>
              <p className="flex items-center gap-2 text-[16px] font-semibold text-white">{planAd(p)}{PLAN_ETIKET[p].rozet && p === "arti" && <span className="rounded-full bg-vurgu px-1.5 py-px text-[9.5px] font-bold text-vurgu-ust">POPÜLER</span>}</p>
              <p className="mt-0.5 text-[12.5px] tabular-nums text-metin-3">{p === "ucretsiz" ? "₺0" : `${tl(planFiyat(p, donem))} / ay`}</p>
              <Link href={planLink(p)} className={cn("mt-3 flex h-9 items-center justify-center rounded-lg text-[12.5px] font-semibold transition-[opacity,background-color]",
                p === "arti" ? "bg-white text-zemin hover:opacity-90" : "bg-white/[0.08] text-white hover:bg-white/[0.13]")}>{planCta(p)}</Link>
            </div>
          ))}
        </div>

        <div className={cn("relative", !acik && "max-h-[880px] overflow-hidden")}>
          {gorunen.map((g) => (
            <Fragment key={g.ad}>
              <div className="grid grid-cols-[minmax(220px,1.3fr)_repeat(4,minmax(0,1fr))]">
                <p className="px-6 pb-2 pt-7 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white/45">{g.ad}</p>
                {KART_PLANLARI.map((p) => <span key={p} className={cn(p === "arti" && "bg-vurgu/[0.08]")} />)}
              </div>
              {g.satirlar.map((s) => (
                <div key={g.ad + s.ad} className="grid grid-cols-[minmax(220px,1.3fr)_repeat(4,minmax(0,1fr))] border-t border-white/[0.05] transition-colors hover:bg-white/[0.015]">
                  <div className="flex items-center gap-3 px-6 py-3">
                    {s.logo && (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] ring-1 ring-inset ring-white/[0.06]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.logo} alt="" className="h-3.5 w-3.5 object-contain" />
                      </span>
                    )}
                    <span>
                      <span className="block text-[13.5px] text-white/90">{s.ad}</span>
                      {s.alt && <span className="block text-[11.5px] text-metin-3">{s.alt}</span>}
                    </span>
                  </div>
                  {s.hucreler.map((h, i) => (
                    <div key={i} className={cn("flex items-center px-4 py-3", KART_PLANLARI[i] === "arti" && "bg-vurgu/[0.08]")}>
                      <HucreGoster h={h} vurgu={KART_PLANLARI[i] === "arti"} />
                    </div>
                  ))}
                </div>
              ))}
            </Fragment>
          ))}
          {!acik && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-yuzey to-transparent" />}
        </div>

        <div className="flex justify-center border-t border-white/[0.06] p-5">
          <button onClick={() => setAcik((a) => !a)} aria-expanded={acik}
            className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.14] px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-white/[0.05]">
            {acik ? "Daralt" : `Tüm karşılaştırmayı göster · ${toplam} satır`}
            <ChevronDown className={cn("h-4 w-4 transition-transform", acik && "rotate-180")} />
          </button>
        </div>
      </div>
    </>
  );
}

/** Mobil: tek plan seçilir, tüm satırlar o planın değeriyle tek sütunda. */
function KarsilastirmaMobil({ donem }: { donem: Donem }) {
  const [secili, setSecili] = useState<KartPlanId>("arti");
  const [acik, setAcik] = useState(false);
  const idx = KART_PLANLARI.indexOf(secili);
  const tum = gruplar(donem);
  const gorunen = acik ? tum : tum.slice(0, 2);
  return (
    <div className="rounded-[24px] border border-white/[0.07] bg-yuzey md:hidden">
      <div className="sticky top-[52px] z-10 rounded-t-[24px] border-b border-white/[0.06] bg-yuzey/95 p-3 backdrop-blur-xl">
        <div role="tablist" aria-label="Plan" className="grid grid-cols-4 gap-1 rounded-xl bg-white/[0.04] p-1">
          {KART_PLANLARI.map((id) => (
            <button key={id} role="tab" aria-selected={secili === id} onClick={() => setSecili(id)}
              className={cn("rounded-lg py-2 text-[12px] font-semibold transition-colors", secili === id ? "bg-white text-zemin" : "text-metin-2")}>{planAd(id)}</button>
          ))}
        </div>
        <p className="mt-3 flex items-center justify-between px-1 text-[13px]">
          <span className="text-metin-2">{PLAN_ETIKET[secili].kime}</span>
          <span className="shrink-0 pl-3 font-semibold tabular-nums text-white">{secili === "ucretsiz" ? "₺0" : `${tl(planFiyat(secili, donem))} / ay`}</span>
        </p>
      </div>
      {gorunen.map((g) => (
        <div key={g.ad} className="px-5 pb-2">
          <p className="pb-1 pt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{g.ad}</p>
          {g.satirlar.map((s) => {
            const h = s.hucreler[idx];
            return (
              <div key={s.ad} className="flex items-center justify-between gap-4 border-t border-white/[0.05] py-3">
                <span className="flex min-w-0 items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {s.logo && <img src={s.logo} alt="" className="h-4 w-4 shrink-0 object-contain" />}
                  <span className={cn("text-[13.5px]", h.tip === "yok" ? "text-metin-3" : "text-white/85")}>{s.ad}</span>
                </span>
                <span className="shrink-0 text-right"><HucreGoster h={h} /></span>
              </div>
            );
          })}
        </div>
      ))}
      <div className="flex flex-col gap-2 p-5 pt-3">
        <button onClick={() => setAcik((a) => !a)} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.14] text-[13.5px] font-semibold text-white">
          {acik ? "Daralt" : "Tüm karşılaştırmayı göster"} <ChevronDown className={cn("h-4 w-4 transition-transform", acik && "rotate-180")} />
        </button>
        <Link href={planLink(secili)} className="flex h-11 items-center justify-center rounded-xl bg-white text-[14px] font-semibold text-zemin">{planCta(secili)}</Link>
      </div>
    </div>
  );
}

/* ═══════════════════ Güven şeridi ═══════════════════ */

const GUVEN: { ikon: LucideIcon; baslik: string; ozet: string }[] = [
  { ikon: ShieldCheck, baslik: "Güvenli ödeme", ozet: "Kart bilgilerin bizde saklanmaz" },
  { ikon: RotateCcw, baslik: "İstediğin an iptal", ozet: "Taahhüt yok, dönem sonuna kadar kullan" },
  { ikon: Receipt, baslik: "Türk lirası fiyatlar", ozet: "Kur farkı yok, KDV hariç" },
  { ikon: BadgeCheck, baslik: "Ticari kullanım", ozet: "Ücretli planlarda üretimler senin" },
];

export function GuvenSeridi() {
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
      {GUVEN.map((g) => (
        <li key={g.baslik} className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.06]">
            <g.ikon className="h-4 w-4 text-white/80" />
          </span>
          <span>
            <span className="block text-[13.5px] font-medium text-white">{g.baslik}</span>
            <span className="block text-[12.5px] text-metin-3">{g.ozet}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
