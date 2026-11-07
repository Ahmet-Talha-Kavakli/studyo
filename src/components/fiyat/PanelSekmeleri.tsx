"use client";

import { useEffect, useState } from "react";
import { KrediYildiz, KrediIsiltiHap } from "@/components/ui/KrediHap";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, Check, Clock, Infinity as InfinityIcon, Layers, RefreshCw, ShieldCheck, X,
} from "lucide-react";
import {
  EK_ESZAMANLI, ESZAMANLI, HIZ_BEKLEME, HIZ_SEVIYELERI, KREDI_PAKETLERI, ORNEK_MALIYET, PLAN_SINIRSIZ, SAGLAYICI_LOGO,
  SINIRSIZ_GUNLER, SINIRSIZ_TEKLIFLER, VAYRA_LOGO, krediBasina, planBul, sayi, sinirsizFiyat, tl, tlKurus,
  type KartPlanId, type SinirsizTeklif,
} from "@/lib/fiyat";
import { MODELLER } from "@/lib/catalog";
import { useAuth } from "@/store/useAuth";
import { useTercih } from "@/store/useTercih";
import { aktifSinirsizlar, useEkler, type HizSeviye } from "@/store/useEkler";
import type { KrediSekme } from "@/store/useKrediModal";
import { toast } from "@/lib/toast";
import { odemeyeGec } from "@/components/fiyat/OdemePenceresi";
import { cn } from "@/lib/utils";

/**
 * /panel/kredi'nin Kredi yükle · Sınırsız · Hız sekmeleri (ve kredi modalı).
 * Rakip derinliği: Higgsfield Top-up / Unlimited / Boost ekranları.
 * Seçimler gerçek store'lara yazılır: useAuth (kredi), useEkler (sınırsız, hız).
 */

const KDV = 0.2;
const model = (id: string) => MODELLER.find((m) => m.id === id)!;
const logo = (id: string) => SAGLAYICI_LOGO[model(id)?.saglayici] ?? VAYRA_LOGO;
const kullaniciPlan = (p?: string): KartPlanId => (p === "arti" || p === "ultra" || p === "baslangic" ? p : "baslangic");

function Radyo({ secili }: { secili: boolean }) {
  return (
    <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors", secili ? "border-vurgu bg-vurgu" : "border-white/25")}>
      {secili && <Check className="h-3 w-3 text-vurgu-ust" strokeWidth={3} />}
    </span>
  );
}

function OtomatikYuklemeSatiri() {
  const acik = useTercih((s) => s.otomatikYukleme);
  const toggle = useTercih((s) => s.otomatikYuklemeToggle);
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-start gap-2.5">
        <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-white/70" />
        <span>
          <span className="block text-[13.5px] font-medium text-white">Yükleme hatırlatması</span>
          <span className="block text-[12px] leading-snug text-metin-3">{acik ? `Bakiye 100'ün altına inince ${useTercih.getState().otoPaket.toLocaleString("tr-TR")} kredilik paketi yüklemen için hatırlatırız.` : "Bakiye bitince üretim durur."}</span>
        </span>
      </span>
      <button role="switch" aria-checked={acik} aria-label="Yükleme hatırlatması"
        onClick={() => { const y = toggle(); toast.success(y ? "Yükleme hatırlatması açıldı" : "Yükleme hatırlatması kapatıldı"); }}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", acik ? "bg-vurgu" : "bg-white/15")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full transition-all", acik ? "left-[22px] bg-white" : "left-0.5 bg-white")} />
      </button>
    </div>
  );
}

/* ═══════════════════════ KREDİ YÜKLE ═══════════════════════ */

/** Özel miktarın birim fiyatı: miktara eşit ya da altındaki en büyük paketin oranı. */
function ozelFiyat(kredi: number) {
  const kademe = [...KREDI_PAKETLERI].reverse().find((p) => p.kredi <= kredi) ?? KREDI_PAKETLERI[0];
  return Math.round(kredi * krediBasina(kademe.fiyat, kademe.kredi));
}

export function KrediYukleSekmesi({ onSekme }: { onSekme: (s: KrediSekme) => void }) {
  const kullanici = useAuth((s) => s.kullanici);
  const [secili, setSecili] = useState<number | "ozel">(KREDI_PAKETLERI.findIndex((p) => p.populer));
  const [ozel, setOzel] = useState(3000);
  // /fiyatlandirma'dan ?paket=<sıra> ile gelinirse o paket seçili açılır.
  useEffect(() => {
    const i = Number(new URLSearchParams(window.location.search).get("paket"));
    if (Number.isInteger(i) && i >= 0 && i < KREDI_PAKETLERI.length && new URLSearchParams(window.location.search).has("paket")) setSecili(i);
  }, []);

  const kredi = secili === "ozel" ? ozel : KREDI_PAKETLERI[secili].kredi;
  const araToplam = secili === "ozel" ? ozelFiyat(ozel) : KREDI_PAKETLERI[secili].fiyat;
  const kdv = Math.round(araToplam * KDV);
  const bakiye = kullanici?.krediler ?? 0;
  const taban = krediBasina(KREDI_PAKETLERI[0].fiyat, KREDI_PAKETLERI[0].kredi);
  const arti = planBul("arti")!;
  const artiBirim = krediBasina(arti.fiyatTRY * 0.8, arti.kredi);
  const enUcuzSinirsiz = Math.min(...SINIRSIZ_TEKLIFLER.map((t) => sinirsizFiyat(t, 0, 0)));

  const satinAl = () => odemeyeGec({ tur: "kredi", urun: String(kredi) });

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-3">
        {/* Sınırsız tanıtım bandı */}
        <button onClick={() => onSekme("sinirsiz")}
          className="group relative isolate flex w-full items-center justify-between gap-4 overflow-hidden rounded-[20px] border border-white/[0.08] px-6 py-5 text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gercek/sinirsiz/unl-hero-dragon.webp" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-[1.04]" />
          <span className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0a0a0b] via-[#0a0a0b]/85 to-transparent" />
          <span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70"><InfinityIcon className="h-3.5 w-3.5" /> Sınırsız erişim</span>
            <span className="mt-1 block text-[18px] font-semibold text-white">Kredi saymadan üret — günde {tl(enUcuzSinirsiz)}&apos;den</span>
            <span className="mt-0.5 block text-[12.5px] text-white/60">Nano Banana Pro, Seedance 2.0, Kling 3.0, GPT Image 2 ve daha fazlası</span>
          </span>
          <span className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-white/15 px-4 text-[13px] font-semibold text-white backdrop-blur-md transition-colors group-hover:bg-white group-hover:text-zemin">
            İncele <ArrowRight className="h-4 w-4" />
          </span>
        </button>

        {/* Paket listesi */}
        <div role="radiogroup" aria-label="Kredi paketi" className="space-y-2">
          {KREDI_PAKETLERI.map((p, i) => {
            const birim = krediBasina(p.fiyat, p.kredi);
            const tasarruf = Math.round((1 - birim / taban) * 100);
            const s = secili === i;
            return (
              <button key={p.kredi} role="radio" aria-checked={s} onClick={() => setSecili(i)}
                className={cn("grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-[18px] border p-4 text-left transition-colors sm:px-5",
                  s ? "border-vurgu/60 bg-vurgu/[0.08]" : "border-white/[0.07] bg-yuzey hover:border-white/[0.16]")}>
                <Radyo secili={s} />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[20px] font-semibold tracking-[-0.02em] text-white tabular-nums">{sayi(p.kredi)} kredi</span>
                    {p.populer && <span className="rounded-full bg-vurgu px-2 py-0.5 text-[10.5px] font-semibold text-vurgu-ust">En çok alınan</span>}
                    {tasarruf > 0 && <span className="rounded-full bg-emerald-400/12 px-2 py-0.5 text-[10.5px] font-bold text-emerald-300">yüzde {tasarruf} tasarruf</span>}
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-metin-2">
                    <span className="flex items-center gap-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo("nano-banana-pro")} alt="" className="h-3.5 w-3.5" /> {sayi(Math.floor(p.kredi / ORNEK_MALIYET.gorsel.kredi))} Nano Banana Pro görseli
                    </span>
                    <span className="flex items-center gap-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo("seedance-2")} alt="" className="h-3.5 w-3.5" /> {sayi(Math.floor(p.kredi / ORNEK_MALIYET.video.kredi))} Seedance 2.0 videosu
                    </span>
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-[19px] font-semibold text-white tabular-nums">{tl(p.fiyat)}</span>
                  <span className="block text-[11.5px] tabular-nums text-metin-3">{tlKurus(birim)} / kredi</span>
                </span>
              </button>
            );
          })}

          {/* Özel miktar */}
          <div role="radio" aria-checked={secili === "ozel"} tabIndex={0} onClick={() => setSecili("ozel")} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSecili("ozel"); }}
            className={cn("grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-[18px] border p-4 transition-colors sm:px-5",
              secili === "ozel" ? "border-vurgu/60 bg-vurgu/[0.08]" : "border-dashed border-white/[0.12] bg-transparent hover:border-white/25")}>
            <Radyo secili={secili === "ozel"} />
            <span className="flex min-w-0 flex-wrap items-center gap-3">
              <span className="text-[15px] font-semibold text-white">Özel miktar</span>
              <span className="flex items-center rounded-lg border border-white/[0.12] bg-zemin">
                <input type="number" min={100} max={100000} step={100} value={ozel} aria-label="Özel kredi miktarı"
                  onFocus={() => setSecili("ozel")}
                  onChange={(e) => setOzel(Math.max(100, Math.min(100000, Math.round(Number(e.target.value) / 100) * 100 || 100)))}
                  className="w-24 bg-transparent px-3 py-1.5 text-[14px] tabular-nums text-white focus:outline-none" />
                <span className="pr-3 text-[12.5px] text-metin-3">kredi</span>
              </span>
            </span>
            <span className="text-right">
              <span className="block text-[19px] font-semibold text-white tabular-nums">{tl(ozelFiyat(ozel))}</span>
              <span className="block text-[11.5px] tabular-nums text-metin-3">{tlKurus(ozelFiyat(ozel) / ozel)} / kredi</span>
            </span>
          </div>
        </div>
        <p className="px-1 text-[12px] text-metin-3">Tek seferlik krediler anında yüklenir ve süresi dolmaz. Önce plan kredin, sonra yüklediğin kredi harcanır.</p>
      </div>

      {/* Sipariş özeti */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-[22px] border border-white/[0.1] bg-yuzey p-5">
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-metin-3">Sipariş özeti</p>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3.5">
            <span>
              <span className="block text-[12px] text-metin-3">Bakiyen</span>
              <span className="mt-1 flex"><KrediIsiltiHap deger={bakiye} artiGizle boyut="sm" etiket={`Bakiyen: ${sayi(bakiye)} kredi`} className="pointer-events-none" /></span>
            </span>
            <ArrowRight className="h-4 w-4 text-metin-3" />
            <span className="text-right">
              <span className="block text-[12px] text-metin-3">Yükleme sonrası</span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={kredi} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="block text-[20px] font-semibold tabular-nums text-white">
                  {sayi(bakiye + kredi)}
                </motion.span>
              </AnimatePresence>
            </span>
          </div>
          <dl className="mt-4 space-y-2 text-[13.5px]">
            <div className="flex justify-between"><dt className="text-metin-2">{sayi(kredi)} kredi</dt><dd className="tabular-nums text-white">{tl(araToplam)}</dd></div>
            <div className="flex justify-between"><dt className="text-metin-2">KDV, yüzde {KDV * 100}</dt><dd className="tabular-nums text-white">{tl(kdv)}</dd></div>
            <div className="flex justify-between border-t border-white/[0.06] pt-2.5 text-[15px] font-semibold"><dt className="text-white">Toplam</dt><dd className="tabular-nums text-white">{tl(araToplam + kdv)}</dd></div>
          </dl>
          <button onClick={satinAl} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-[14.5px] font-semibold text-zemin transition-opacity hover:opacity-90">
            {tl(araToplam + kdv)} öde ve yükle
          </button>
          <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[11.5px] text-metin-3"><ShieldCheck className="h-3.5 w-3.5" /> Kart bilgilerin bizde saklanmaz</p>
          <div className="mt-5 border-t border-white/[0.06] pt-4"><OtomatikYuklemeSatiri /></div>
        </div>

        {/* Plan önerisi — düzenli alıyorsa abonelik daha ucuz */}
        <button onClick={() => onSekme("plan")} className="group mt-3 flex w-full items-center justify-between gap-3 rounded-[18px] border border-white/[0.07] bg-yuzey px-5 py-4 text-left transition-colors hover:border-white/[0.16]">
          <span>
            <span className="block text-[13.5px] font-semibold text-white">Her ay kredi mi alıyorsun?</span>
            <span className="block text-[12.5px] text-metin-2">Artı planında kredi {tlKurus(artiBirim)} — paketten yüzde {Math.round((1 - artiBirim / krediBasina(araToplam, kredi)) * 100)} daha ucuz.</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-metin-3 transition-transform group-hover:translate-x-0.5" />
        </button>
      </aside>
    </div>
  );
}

/* ═══════════════════════ SINIRSIZ ═══════════════════════ */

const TUR_FILTRE: { id: string; ad: string }[] = [{ id: "tumu", ad: "Tümü" }, { id: "gorsel", ad: "Görsel" }, { id: "video", ad: "Video" }, { id: "ses", ad: "Ses" }];

function kalanSure(bitis: number) {
  const ms = bitis - Date.now();
  const gun = Math.floor(ms / 86_400_000), sa = Math.floor((ms % 86_400_000) / 3_600_000);
  return gun > 0 ? `${gun} gün ${sa} sa` : `${Math.max(1, sa)} sa`;
}

export function SinirsizSekmesi() {
  const plan = kullaniciPlan(useAuth((s) => s.kullanici?.plan));
  const girisli = useAuth((s) => s.girisYapildi);
  const ekle = useEkler((s) => s.sinirsizEkle);
  const ham = useEkler((s) => s.sinirsizlar);
  // Kalan süreler dakikada bir tazelenir.
  const [, setTik] = useState(0);
  useEffect(() => { const t = setInterval(() => setTik((x) => x + 1), 60_000); return () => clearInterval(t); }, []);
  const aktifler = aktifSinirsizlar(ham);

  const [filtre, setFiltre] = useState("tumu");
  const [seciliModel, setSeciliModel] = useState(SINIRSIZ_TEKLIFLER[0].model);
  const liste = SINIRSIZ_TEKLIFLER.filter((t) => filtre === "tumu" || model(t.model).tur === filtre);
  const teklif = SINIRSIZ_TEKLIFLER.find((t) => t.model === seciliModel)!;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative isolate overflow-hidden rounded-[22px] border border-white/[0.08]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/gercek/sinirsiz/unl-hero-dragon.webp" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent" />
        <div className="flex min-h-[200px] flex-col justify-center px-6 py-8 sm:px-10">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70"><InfinityIcon className="h-3.5 w-3.5" /> Sınırsız erişim</p>
          <h2 className="mt-2 max-w-[520px] text-[30px] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[38px]">En iyi modeller, kredi saymadan.</h2>
          <p className="mt-2 max-w-[460px] text-[14px] text-white/70">Süre boyunca seçtiğin modelde kredi düşmez. Yoğun bir kampanya ya da proje dönemi için en ekonomik yol.</p>
        </div>
      </div>

      {/* Aktif erişimler */}
      {girisli && aktifler.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-[18px] border border-white/[0.07] bg-yuzey px-4 py-3">
          <span className="mr-1 text-[12.5px] font-medium text-white">Aktif erişimlerin</span>
          {aktifler.map((a) => (
            <span key={a.model} className="flex items-center gap-2 rounded-full bg-white/[0.06] py-1 pl-1.5 pr-3 text-[12.5px] text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo(a.model)} alt="" className="h-4 w-4" />
              {model(a.model).ad} {a.kalite} <span className="text-metin-3">· {kalanSure(a.bitis)} kaldı</span>
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Model ızgarası */}
        <div className="min-w-0">
          <div role="tablist" aria-label="Model türü" className="mb-4 flex gap-1.5">
            {TUR_FILTRE.map((f) => (
              <button key={f.id} role="tab" aria-selected={filtre === f.id} onClick={() => setFiltre(f.id)}
                className={cn("rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors", filtre === f.id ? "bg-white text-zemin" : "bg-white/[0.05] text-metin-2 hover:text-white")}>{f.ad}</button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {liste.map((t) => {
              const m = model(t.model);
              const planda = PLAN_SINIRSIZ[plan].some((s) => s.model === t.model);
              const aktif = aktifler.find((a) => a.model === t.model);
              const s = seciliModel === t.model;
              return (
                <button key={t.model} onClick={() => setSeciliModel(t.model)} aria-pressed={s}
                  className={cn("group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[18px] border text-left transition-[border-color,transform]",
                    s ? "border-white/60" : "border-white/[0.08] hover:border-white/25")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.gorsel} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                  <span className="absolute left-3 top-3 flex gap-1">
                    {t.kaliteler.map((k) => <span key={k.ad} className="rounded-md bg-black/55 px-1.5 py-0.5 text-[10.5px] font-semibold text-white backdrop-blur">{k.ad}</span>)}
                  </span>
                  {(planda || aktif) && (
                    <span className="absolute right-3 top-3 rounded-md bg-vurgu px-1.5 py-0.5 text-[10.5px] font-bold text-vurgu-ust">{aktif ? "Aktif" : "Planında dahil"}</span>
                  )}
                  <span className="relative p-4">
                    <span className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo(t.model)} alt="" className="h-4 w-4" />
                      <span className="text-[15px] font-semibold text-white">{m.ad}</span>
                    </span>
                    <span className="mt-1 block text-[12px] text-white/60">Normalde {m.kredi} kredi / üretim</span>
                    <span className="mt-3 flex h-9 items-center justify-center rounded-lg bg-white/15 text-[12.5px] font-semibold text-white backdrop-blur-md transition-colors group-hover:bg-white group-hover:text-zemin">
                      Günde {tl(sinirsizFiyat(t, 0, 0))}&apos;den
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detay */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <AnimatePresence mode="wait">
            <motion.div key={teklif.model} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <SinirsizDetay teklif={teklif} planda={PLAN_SINIRSIZ[plan].find((s) => s.model === teklif.model)?.etiket}
                onAl={(kalite, gun) => odemeyeGec({ tur: "sinirsiz", urun: `${teklif.model}|${kalite}|${gun}` })} />
            </motion.div>
          </AnimatePresence>
        </aside>
      </div>
    </div>
  );
}

function SinirsizDetay({ teklif, planda, onAl }: { teklif: SinirsizTeklif; planda?: string; onAl: (kalite: string, gun: number) => void }) {
  const [kalite, setKalite] = useState(0);
  const [gun, setGun] = useState(1);
  const m = model(teklif.model);
  const fiyat = sinirsizFiyat(teklif, kalite, gun);
  const birGun = sinirsizFiyat(teklif, kalite, 0);
  const gunSayi = SINIRSIZ_GUNLER[gun].gun;
  // Kârlılık eşiği: Artı plan kredi birim fiyatıyla, günde kaç üretimden sonra sınırsız daha ucuz?
  const arti = planBul("arti")!;
  const krediTL = arti.fiyatTRY / arti.kredi;
  const esik = Math.ceil(fiyat / gunSayi / (m.kredi * teklif.kaliteler[kalite].carpan * krediTL));

  return (
    <div className="overflow-hidden rounded-[22px] border border-white/[0.1] bg-yuzey">
      <div className="relative h-36">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={teklif.gorsel} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-yuzey via-yuzey/30 to-transparent" />
        <div className="absolute inset-x-5 bottom-3 flex items-end justify-between gap-3">
          <span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">Sınırsız</span>
            <span className="block text-[24px] font-semibold leading-tight tracking-[-0.02em] text-white">{m.ad}</span>
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo(teklif.model)} alt="" className="mb-1 h-6 w-6" />
        </div>
      </div>
      <div className="p-5">
        {planda && <p className="mb-4 rounded-xl bg-white/[0.06] px-3 py-2 text-[12.5px] text-white">Planında bu model zaten <b>{planda}</b>. Daha yüksek kalite için ek erişim alabilirsin.</p>}
        {teklif.kaliteler.length > 1 && (
          <div role="radiogroup" aria-label="Kalite" className="grid gap-1 rounded-xl bg-white/[0.04] p-1" style={{ gridTemplateColumns: `repeat(${teklif.kaliteler.length}, minmax(0,1fr))` }}>
            {teklif.kaliteler.map((k, i) => (
              <button key={k.ad} role="radio" aria-checked={kalite === i} onClick={() => setKalite(i)}
                className={cn("rounded-lg py-1.5 transition-colors", kalite === i ? "bg-white text-zemin" : "text-metin-2 hover:text-white")}>
                <span className="block text-[10px] opacity-60">Şuna kadar</span>
                <span className="text-[13.5px] font-semibold">{k.ad}</span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 rounded-lg bg-white/[0.05] px-2.5 py-1 text-[11.5px] text-metin-2"><Layers className="h-3 w-3" /> Aynı anda {teklif.esZamanli}</span>
          {teklif.maxSure && <span className="flex items-center gap-1 rounded-lg bg-white/[0.05] px-2.5 py-1 text-[11.5px] text-metin-2"><Clock className="h-3 w-3" /> {teklif.maxSure}</span>}
          <span className="flex items-center gap-1 rounded-lg bg-white/[0.05] px-2.5 py-1 text-[11.5px] text-metin-2"><KrediYildiz className="h-3 w-3" /> Normalde {Math.round(m.kredi * teklif.kaliteler[kalite].carpan)} kr / üretim</span>
        </div>

        <div role="radiogroup" aria-label="Süre" className="mt-4 space-y-2">
          {SINIRSIZ_GUNLER.map((g, i) => {
            const f = sinirsizFiyat(teklif, kalite, i);
            const tasarruf = Math.round((1 - f / (birGun * g.gun)) * 100);
            return (
              <button key={g.gun} role="radio" aria-checked={gun === i} onClick={() => setGun(i)}
                className={cn("flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                  gun === i ? "border-vurgu/60 bg-vurgu/[0.08]" : "border-white/[0.07] hover:border-white/[0.16]")}>
                <span className="flex items-center gap-3">
                  <Radyo secili={gun === i} />
                  <span>
                    <span className="flex items-center gap-2 text-[14px] font-semibold text-white">{g.gun} gün{tasarruf > 0 && <span className="rounded-full bg-emerald-400/12 px-1.5 py-px text-[10px] font-bold text-emerald-300">yüzde {tasarruf}</span>}</span>
                    <span className="block text-[11.5px] text-metin-3">{g.ozet}</span>
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-[17px] font-semibold tabular-nums text-white">{tl(f)}</span>
                  <span className="block text-[11px] tabular-nums text-metin-3">günde {tl(Math.round(f / g.gun))}</span>
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-4 rounded-xl bg-white/[0.03] px-3 py-2.5 text-[12px] leading-relaxed text-metin-2">
          Günde <b className="text-white">{esik}</b> üretimden fazlasını yapıyorsan sınırsız, kredi kullanmaktan daha ucuz.
        </p>
        <button onClick={() => onAl(teklif.kaliteler[kalite].ad, gunSayi)}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-[14.5px] font-semibold text-zemin transition-opacity hover:opacity-90">
          <InfinityIcon className="h-4 w-4" /> {tl(fiyat)} · {gunSayi} gün sınırsız al
        </button>
        <p className="mt-2.5 text-center text-[11px] leading-snug text-metin-3">Tek ödeme, otomatik yenilenmez. Yalnız Vayra arayüzünde; API, MCP ve Canvas hariç.</p>
      </div>
    </div>
  );
}

/* ═══════════════════════ HIZ ═══════════════════════ */

const sureYaz = (sn: number) => {
  if (sn <= 0) return "Anında";
  if (sn < 60) return `${sn} sn`;
  const dk = Math.floor(sn / 60), s = sn % 60;
  return s ? `${dk} dk ${s} sn` : `${dk} dk`;
};

/** Tek bir videonun ortalama üretim süresi (sn) — parti tahmini için. */
const VIDEO_SN = 75;
const ORNEK_PARTI = 8;

/** N videoluk partinin yoğun saatte toplam bitiş süresi: bekleme + dalga sayısı × üretim süresi. */
function partiSuresi(n: number, esZamanli: number, bekleme: number) {
  return bekleme + Math.ceil(n / esZamanli) * VIDEO_SN;
}

/** Seviye kartlarındaki özellikler — [standart, öncelikli, turbo]. */
const HIZ_OZELLIK: { ad: string; d: [boolean, boolean, boolean] }[] = [
  { ad: "Tüm görsel, video, ses ve 3D modelleri", d: [true, true, true] },
  { ad: "Stüdyolar, Sinema ve Pazarlama'da geçerli", d: [true, true, true] },
  { ad: "Yoğun saatte kuyruğun önüne geçer", d: [false, true, true] },
  { ad: "Ayrılmış kapasite, sıfır bekleme", d: [false, false, true] },
  { ad: "Uzun videolarda öncelikli işleme", d: [false, false, true] },
];
const HIZ_ROZET: Record<string, string> = { oncelikli: "En çok tercih", turbo: "En hızlı" };

export function HizSekmesi() {
  const plan = kullaniciPlan(useAuth((s) => s.kullanici?.plan));
  const girisli = useAuth((s) => s.girisYapildi);
  const mevcutHiz = useEkler((s) => s.hiz);
  const mevcutEk = useEkler((s) => s.ekEsZamanli);
  const hizAyarla = useEkler((s) => s.hizAyarla);
  const [ek, setEk] = useState(mevcutEk);
  useEffect(() => setEk(mevcutEk), [mevcutEk]);
  const esz = ESZAMANLI[plan];

  const uygula = (hiz: HizSeviye, ekAdet: number) => {
    const seviye = HIZ_SEVIYELERI.find((h) => h.id === hiz)!;
    const toplam = seviye.fiyat + (EK_ESZAMANLI.find((e) => e.adet === ekAdet)?.fiyat ?? 0);
    // Ücretli hız 30 günlük süreli haktır ve ödemeyle açılır; standarda dönmek ücretsizdir.
    if (toplam) return odemeyeGec({ tur: "hiz", urun: `${hiz}:${ekAdet}` });
    hizAyarla(hiz, ekAdet);
    toast.success("Standart hıza dönüldü", { description: "Ek ücret yok." });
  };

  const enUzunBekleme = Math.max(...Object.values(HIZ_BEKLEME));
  const ekFiyat = (n: number) => EK_ESZAMANLI.find((e) => e.adet === n)?.fiyat ?? 0;
  const partiSimdi = partiSuresi(ORNEK_PARTI, esz.video + mevcutEk, HIZ_BEKLEME[mevcutHiz]);
  const partiSecim = partiSuresi(ORNEK_PARTI, esz.video + ek, HIZ_BEKLEME[mevcutHiz]);

  return (
    <div>
      {/* Seviye kartları — plan kartlarıyla aynı dil */}
      <div className="grid gap-3 md:grid-cols-3">
        {HIZ_SEVIYELERI.map((h, i) => {
          const bu = mevcutHiz === h.id;
          const vurgu = !!h.populer;
          const bekleme = HIZ_BEKLEME[h.id];
          const parti = partiSuresi(ORNEK_PARTI, esz.video + mevcutEk, bekleme);
          return (
            <motion.div key={h.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className={cn("relative flex flex-col rounded-[22px] border p-5", vurgu ? "border-vurgu/50 bg-[color-mix(in_oklab,var(--vurgu-renk)_20%,#111113)]" : "border-white/[0.07] bg-yuzey")}>
              <div className="flex min-h-[26px] items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-[20px] font-semibold tracking-[-0.02em] text-white">{h.ad}<span className="text-[13px] font-medium text-metin-3">{h.kat}</span></h3>
                {bu ? <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10.5px] font-semibold text-white/80">Mevcut seviyen</span>
                  : HIZ_ROZET[h.id] && <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", vurgu ? "bg-vurgu text-vurgu-ust" : "border border-vurgu/40 text-vurgu")}>{HIZ_ROZET[h.id]}</span>}
              </div>
              <p className="mt-1 text-[13px] text-metin-3">{h.ozet}</p>

              {/* Bekleme kutusu */}
              <div className="mt-4 rounded-2xl bg-white/[0.04] p-3.5 ring-1 ring-inset ring-white/[0.05]">
                <p className="flex items-center gap-2 text-[14px] font-semibold text-white">
                  <Clock className="h-4 w-4 text-vurgu" />{bekleme ? <>{sureYaz(bekleme)} <span className="font-normal text-metin-2">bekleme</span></> : "Beklemesiz"}
                </p>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]" aria-hidden>
                  <div className={cn("h-full rounded-full", bekleme ? "bg-white/45" : "bg-vurgu")} style={{ width: bekleme ? `${(bekleme / enUzunBekleme) * 100}%` : "3%" }} />
                </div>
                <p className="mt-2.5 flex items-center gap-2 text-[12.5px] text-metin-2"><Layers className="h-3.5 w-3.5 text-metin-3" />{ORNEK_PARTI} videoluk parti yaklaşık <span className="font-medium text-white">{sureYaz(parti).toLocaleLowerCase("tr-TR")}</span></p>
              </div>

              <div className="mt-5 flex items-end gap-2">
                <span className="text-[38px] font-semibold leading-none tracking-[-0.03em] text-white tabular-nums">{h.fiyat ? tl(h.fiyat) : "₺0"}</span>
                <span className="pb-1 text-[12.5px] text-metin-3">/ ay</span>
              </div>
              <p className="mt-1.5 min-h-[18px] text-[12px] text-metin-3">{h.fiyat ? "Aylık faturalandırılır · istediğin an iptal" : "Her planda dahil"}</p>

              <button onClick={() => !bu && uygula(h.id as HizSeviye, mevcutEk)} disabled={bu}
                className={cn("mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-[opacity,background-color]",
                  bu ? "cursor-default border border-white/[0.1] text-metin-3" : vurgu ? "bg-white text-zemin hover:opacity-90" : "bg-white/[0.08] text-white hover:bg-white/[0.13]")}>
                {bu ? "Kullandığın seviye" : h.id === "turbo" ? "Turbo'ya geç" : h.fiyat ? `${h.ad}'ye geç` : "Standart'a dön"}
              </button>

              <ul className="mt-5 space-y-2">
                {HIZ_OZELLIK.map((o) => {
                  const var_ = o.d[i];
                  return (
                    <li key={o.ad} className={cn("flex items-start gap-2 text-[12.5px] leading-snug", var_ ? "text-white/85" : "text-white/30")}>
                      {var_ ? <Check className="mt-px h-3.5 w-3.5 shrink-0 text-white" strokeWidth={2.6} /> : <X className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />}
                      <span>{o.ad}</span>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          );
        })}
      </div>

      {/* Ek eşzamanlı üretim — tek şerit kart */}
      <div className="mt-3 rounded-[22px] border border-white/[0.07] bg-yuzey p-5 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] ring-1 ring-inset ring-white/[0.06]"><Layers className="h-[18px] w-[18px] text-white/80" /></span>
            <div>
              <p className="text-[15px] font-semibold text-white">Ek eşzamanlı üretim</p>
              <p className="mt-0.5 text-[13px] text-metin-2">Planında aynı anda <b className="font-medium text-white">{esz.video} video · {esz.gorsel} görsel</b>. Fazlasını ekle, büyük partileri paralel üret.</p>
              <p className="mt-1.5 text-[12.5px] text-metin-3">
                {ORNEK_PARTI} videoluk parti: <span className="tabular-nums text-metin-2">{sureYaz(partiSimdi).toLocaleLowerCase("tr-TR")}</span>
                {ek !== mevcutEk && <>, yeni seçimle <span className="font-medium tabular-nums text-white">{sureYaz(partiSecim).toLocaleLowerCase("tr-TR")}</span></>}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div role="radiogroup" aria-label="Ek eşzamanlı üretim" className="grid grid-cols-4 gap-1.5">
              {EK_ESZAMANLI.map((e) => (
                <button key={e.adet} role="radio" aria-checked={ek === e.adet} onClick={() => setEk(e.adet)}
                  className={cn("min-w-[78px] rounded-xl border px-3 py-2 text-center transition-colors", ek === e.adet ? "border-vurgu/70 bg-vurgu/[0.1]" : "border-white/[0.08] hover:border-white/20")}>
                  <span className="block text-[15px] font-semibold text-white">{e.adet ? `+${e.adet}` : "Yok"}</span>
                  <span className="block text-[11px] tabular-nums text-metin-3">{e.fiyat ? `${tl(e.fiyat)}/ay` : "Dahil"}</span>
                </button>
              ))}
            </div>
            <button onClick={() => uygula(mevcutHiz, ek)} disabled={ek === mevcutEk}
              className="h-11 shrink-0 rounded-xl bg-white px-4 text-[13.5px] font-semibold text-zemin transition-opacity hover:opacity-90 disabled:cursor-default disabled:bg-white/[0.06] disabled:text-metin-3">
              {ek === mevcutEk ? (mevcutEk ? `+${mevcutEk} etkin` : "Değişiklik yok") : ek > mevcutEk ? `${tl(ekFiyat(ek))}/ay ile ekle` : ek ? `+${ek}'e düşür` : "Kaldır"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
