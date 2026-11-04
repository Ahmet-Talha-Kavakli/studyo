"use client";

/**
 * /panel/kredi Sınırsız ve Hız sekmeleri, 2026-11-04 kullanıcı seçimi ("S1 ve H3, çok daha iyi").
 *  - Sınırsız · Galeri + sağ panel: model karoları; tıklanınca sağdan panel açılır (kalite, süre, eşik, KDV, ödeme).
 *  - Hız · Gösterge: çentikli büyük hız göstergesi (yaylı ibre, ortada bekleme), ölçümler, seviye, ek eşzamanlı, ödeme kartta.
 * Satın alma demo: useEkler'e yazılır, faturaya ve bildirimlere düşer (eski EkGucSekmeleri ile aynı mantık).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LayoutGroup, animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { ArrowRight, Clock, Gauge, Infinity as Sonsuz, Layers, Loader2, Minus, Plus, Timer, X, Zap } from "lucide-react";
import { MODELLER } from "@/lib/catalog";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { useAuth } from "@/store/useAuth";
import { aktifSinirsizlar, useEkler, type HizSeviye } from "@/store/useEkler";
import { hareketYaz } from "@/store/useHesap";
import { hesapBildirimi } from "@/lib/bildirimler";
import { toast } from "@/lib/toast";
import {
  EK_ESZAMANLI, ESZAMANLI, HIZ_BEKLEME, HIZ_SEVIYELERI, PLAN_SINIRSIZ, SINIRSIZ_GUNLER, SINIRSIZ_TEKLIFLER,
  planBul, sinirsizFiyat, tl, type KartPlanId, type SinirsizTeklif,
} from "@/lib/fiyat";
import { cn } from "@/lib/utils";
import { yonelme } from "./PlanSinema";

const KDV = 0.2;
const akis = [0.22, 1, 0.36, 1] as const;
const yay = { type: "spring" as const, stiffness: 460, damping: 38 };
const model = (id: string) => MODELLER.find((m) => m.id === id)!;
const kartPlan = (p?: string): KartPlanId => (p === "arti" || p === "ultra" || p === "baslangic" ? p : "baslangic");
const sureYaz = (sn: number) => (sn <= 0 ? "Beklemesiz" : sn < 60 ? `${sn} sn` : `${Math.floor(sn / 60)} dk${sn % 60 ? ` ${sn % 60} sn` : ""}`);
const kalanSure = (bitis: number) => { const ms = bitis - Date.now(); const g = Math.floor(ms / 864e5), s = Math.floor((ms % 864e5) / 36e5); return g > 0 ? `${g} gün ${s} sa` : `${Math.max(1, s)} sa`; };

function Kayan<T extends string | number>({ id, secenekler, deger, sec, tam, kucuk }: { id: string; secenekler: { id: T; ad: React.ReactNode }[]; deger: T; sec: (v: T) => void; tam?: boolean; kucuk?: boolean }) {
  return (
    <LayoutGroup id={id}>
      <div role="radiogroup" className={cn("inline-flex rounded-full bg-white/[0.06] p-1 ring-1 ring-inset ring-white/[0.08]", tam && "flex w-full")}>
        {secenekler.map((s) => (
          <button key={String(s.id)} type="button" role="radio" aria-checked={deger === s.id} onClick={() => sec(s.id)}
            className={cn("relative flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-colors", kucuk ? "h-8 px-3 text-[12.5px]" : "h-9 px-4 text-[13.5px]", tam && "flex-1", deger === s.id ? "text-black" : "text-white/60 hover:text-white")}>
            {deger === s.id && <motion.span layoutId={`${id}-z`} transition={yay} className="absolute inset-0 rounded-full bg-white" />}
            <span className="relative flex items-center gap-1.5">{s.ad}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

/* ═════════════════════ SINIRSIZ · GALERİ + SAĞ PANEL ═════════════════════ */

const TURLER = [{ id: "tumu", ad: "Tümü" }, { id: "gorsel", ad: "Görsel" }, { id: "video", ad: "Video" }, { id: "ses", ad: "Ses" }] as const;

function SinirsizPanel({ t, planda, aktifBitis, onKapat }: { t: SinirsizTeklif; planda?: string; aktifBitis?: number; onKapat: () => void }) {
  const m = model(t.model);
  const girisli = useAuth((s) => s.girisYapildi);
  const ekle = useEkler((s) => s.sinirsizEkle);
  const [k, setK] = useState(0);
  const [g, setG] = useState(1);
  const [isliyor, setIsliyor] = useState(false);
  const fiyat = sinirsizFiyat(t, k, g);
  const kdv = Math.round(fiyat * KDV);
  const arti = planBul("arti")!;
  const krediTL = arti.fiyatTRY / arti.kredi;
  const uretimKredi = m.kredi * t.kaliteler[k].carpan;
  const esik = Math.ceil(fiyat / SINIRSIZ_GUNLER[g].gun / (uretimKredi * krediTL));

  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    addEventListener("keydown", f); return () => removeEventListener("keydown", f);
  }, [onKapat]);

  const al = () => {
    if (!girisli) return toast.error("Önce giriş yap", { description: "Satın almak için hesabınla giriş yapman gerekiyor." });
    setIsliyor(true);
    setTimeout(() => {
      const kalite = t.kaliteler[k].ad, gun = SINIRSIZ_GUNLER[g].gun;
      ekle(t.model, kalite, gun);
      hareketYaz({ tur: "sinirsiz", aciklama: `${m.ad} ${kalite} · ${gun} gün sınırsız`, kredi: 0, tutar: fiyat, kdv, belge: true });
      hesapBildirimi(`Sınırsız ${m.ad} etkin`, `${kalite} · ${gun} gün boyunca bu modelde kredi düşmez.`, { ad: "Hemen üret", link: m.tur === "video" ? "/panel/video" : m.tur === "ses" ? "/panel/ses" : "/panel/gorsel" });
      toast.success(`Sınırsız ${m.ad} etkin`, { description: `${kalite} · ${gun} gün. Gerçek ödeme alınmadı.` });
      setIsliyor(false); onKapat();
    }, 650);
  };

  return createPortal(
    <motion.div key="perde" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[120] flex items-end bg-black/45 sm:items-stretch sm:justify-end sm:bg-transparent sm:p-3" onMouseDown={(e) => { if (e.target === e.currentTarget) onKapat(); }}>
      <motion.aside role="dialog" aria-modal="true" aria-label={`${m.ad} sınırsız`} initial={{ x: 48, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 36, opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 40 }}
        className="kesfet-tema flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[28px] ring-1 ring-white/[0.1] sm:max-h-none sm:w-[440px] sm:rounded-[26px]" style={{ background: "#141416" }}>
        {/* görsel başlık */}
        <div className="relative h-[240px] shrink-0 max-sm:h-[190px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={t.gorsel} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-[#141416]/30 to-transparent" />
          <button type="button" onClick={onKapat} aria-label="Kapat" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75"><X className="h-4 w-4" /></button>
          <div className="absolute inset-x-5 bottom-3">
            <p className="flex items-center gap-2.5 text-[24px] font-semibold tracking-[-0.025em] text-white"><span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white/[0.14]"><ModelLogo ad={m.ad} boyut={20} /></span>{m.ad}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[`Normalde ${Math.round(uretimKredi)} kredi`, `Aynı anda ${t.esZamanli}`, t.maxSure].filter(Boolean).map((x) => <span key={x} className="rounded-full bg-black/45 px-2.5 py-1 text-[12px] text-white/85 ring-1 ring-inset ring-white/10">{x}</span>)}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-5 pt-3">
          {(planda || aktifBitis) && (
            <p className="flex items-center gap-2 rounded-[14px] bg-white/[0.05] px-3.5 py-2.5 text-[13px] text-white/80"><Sonsuz className="h-4 w-4 shrink-0 text-[#55d6fd]" />
              {aktifBitis ? `Şu an aktif, ${kalanSure(aktifBitis)} kaldı. Yeni süre kalan sürenin üstüne eklenir.` : `Planında zaten ${planda}. Daha yüksek kalite ya da süre için al.`}</p>
          )}
          {t.kaliteler.length > 1 && (
            <div><p className="mb-2 text-[13px] font-medium text-white/70">Kalite</p><Kayan tam id={`sp-kal-${t.model}`} deger={k} sec={setK} secenekler={t.kaliteler.map((q, j) => ({ id: j, ad: q.ad }))} /></div>
          )}
          <div>
            <p className="mb-2 text-[13px] font-medium text-white/70">Süre</p>
            <div className="grid grid-cols-3 gap-2">
              {SINIRSIZ_GUNLER.map((x, j) => {
                const f = sinirsizFiyat(t, k, j), gunluk = Math.round(f / x.gun), ind = Math.round((1 - gunluk / sinirsizFiyat(t, k, 0)) * 100);
                const a = g === j;
                return (
                  <button key={x.gun} type="button" onClick={() => setG(j)} aria-pressed={a}
                    className={cn("relative rounded-[16px] p-3 text-left transition-colors", a ? "bg-white/[0.08]" : "bg-white/[0.03] hover:bg-white/[0.06]")}>
                    {a && <motion.span layoutId={`sp-gun-${t.model}`} transition={yay} className="absolute inset-0 rounded-[16px] ring-[1.5px] ring-inset ring-white" />}
                    <span className="block text-[13.5px] font-semibold text-white">{x.gun} gün</span>
                    <span className="mt-1 block text-[16px] font-semibold tabular-nums text-white">{tl(f)}</span>
                    <span className="block text-[11.5px] tabular-nums text-white/45">günde {tl(gunluk)}</span>
                    <span className="mt-1 block h-4 text-[11.5px] font-semibold text-emerald-300">{ind > 0 ? `yüzde ${ind} ucuz` : ""}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[12.5px] text-white/45">{SINIRSIZ_GUNLER[g].ozet}</p>
          </div>
          <div className="rounded-[16px] bg-white/[0.04] p-4">
            <p className="text-[13.5px] leading-relaxed text-white/75">Günde <b className="text-white">{esik}</b> üretimden fazlasını yapıyorsan sınırsız, kredi harcamaktan ucuza gelir.</p>
            <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-white/[0.08]"><motion.span initial={false} animate={{ width: `${Math.min(100, (esik / 40) * 100)}%` }} transition={yay} className="h-full rounded-full bg-white/70" /></div>
            <p className="mt-2 text-[11.5px] text-white/40">Kredi değeri Artı planına göre hesaplanır. API, MCP ve Canvas kullanımında kredi düşer.</p>
          </div>
        </div>

        <div className="shrink-0 border-t border-white/[0.06] p-4">
          <div className="mb-3 space-y-1 text-[13px]">
            <p className="flex justify-between text-white/55"><span>{t.kaliteler[k].ad} · {SINIRSIZ_GUNLER[g].gun} gün</span><span className="tabular-nums text-white">{tl(fiyat)}</span></p>
            <p className="flex justify-between text-white/55"><span>KDV</span><span className="tabular-nums text-white">{tl(kdv)}</span></p>
          </div>
          <button type="button" disabled={isliyor} onClick={al} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-[14.5px] font-semibold text-black transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] disabled:opacity-70">
            {isliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{tl(fiyat + kdv)} öde{!isliyor && <ArrowRight className="h-4 w-4" />}
          </button>
          <p className="mt-2 text-center text-[11.5px] text-white/40">Tek ödeme, otomatik yenilenmez</p>
        </div>
      </motion.aside>
    </motion.div>,
    document.body,
  );
}

export function SinirsizGaleri() {
  const plan = kartPlan(useAuth((s) => s.kullanici?.plan));
  const aktifler = aktifSinirsizlar(useEkler((s) => s.sinirsizlar));
  const [tur, setTur] = useState<(typeof TURLER)[number]["id"]>("tumu");
  const [acik, setAcik] = useState<string | null>(null);
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  const liste = SINIRSIZ_TEKLIFLER.filter((t) => tur === "tumu" || model(t.model).tur === tur);
  const planda = (id: string) => PLAN_SINIRSIZ[plan].find((s) => s.model === id)?.etiket;
  const secili = SINIRSIZ_TEKLIFLER.find((x) => x.model === acik);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Kayan id="sg-tur" deger={tur} sec={setTur} secenekler={TURLER.map((x) => ({ id: x.id, ad: x.ad }))} />
        {aktifler.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-white/45">Aktif</span>
            {aktifler.map((a) => (
              <button key={a.model + a.kalite} type="button" onClick={() => setAcik(a.model)} className="flex items-center gap-2 rounded-full bg-white/[0.06] py-1 pl-1.5 pr-3 text-[12.5px] text-white ring-1 ring-inset ring-white/[0.1] hover:bg-white/[0.1]">
                <ModelLogo ad={model(a.model).ad} boyut={16} />{model(a.model).ad} {a.kalite}<span className="text-white/45">{kalanSure(a.bitis)} kaldı</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <motion.div layout className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence initial={false}>
          {liste.map((x, i) => {
            const m = model(x.model);
            const aktif = aktifler.find((y) => y.model === x.model);
            const pl = planda(x.model);
            const enUcuz = Math.round(sinirsizFiyat(x, 0, 2) / 30);
            return (
              <motion.button key={x.model} layout type="button" onClick={() => setAcik(x.model)}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.35, delay: i * 0.03, ease: akis }}
                className={cn("group relative isolate aspect-[4/5] overflow-hidden rounded-[24px] text-left outline-none ring-inset transition-shadow focus-visible:ring-2 focus-visible:ring-white",
                  acik === x.model ? "ring-2 ring-white" : "ring-1 ring-white/10 hover:ring-white/25")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={x.gorsel} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                <span className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/35 to-transparent" />
                {(aktif || pl) && (
                  <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11.5px] font-semibold text-white ring-1 ring-inset ring-white/15">
                    <Sonsuz className="h-3 w-3 text-[#55d6fd]" />{aktif ? `Aktif · ${kalanSure(aktif.bitis)}` : `Planında ${pl}`}
                  </span>
                )}
                <span className="absolute inset-x-4 bottom-4">
                  <span className="flex items-center gap-2 text-[16px] font-semibold text-white"><ModelLogo ad={m.ad} boyut={18} /><span className="truncate">{m.ad}</span></span>
                  <span className="mt-1 block text-[12.5px] text-white/65">Normalde {m.kredi} kredi · aynı anda {x.esZamanli}</span>
                  <span className="mt-3 flex items-center justify-between">
                    <span className="text-[15px] font-semibold tabular-nums text-white">günde {tl(enUcuz)}&apos;den</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition-colors group-hover:bg-white group-hover:text-black"><ArrowRight className="h-4 w-4" /></span>
                  </span>
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.div>
      <p className="mt-4 text-[12.5px] text-white/40">Tek ödeme, otomatik yenilenmez. Süre boyunca seçtiğin model Vayra stüdyolarında kredi düşmeden çalışır.</p>

      {hazir && <AnimatePresence>{secili && <SinirsizPanel key={secili.model} t={secili} planda={planda(secili.model)} aktifBitis={aktifler.find((y) => y.model === secili.model)?.bitis} onKapat={() => setAcik(null)} />}</AnimatePresence>}
    </div>
  );
}

/* ═════════════════════ HIZ · GÖSTERGE ═════════════════════ */

const HVID: Record<string, string> = { standart: "slow-motion", oncelikli: "dolly-in", turbo: "fpv-dive" };
/** İbrenin açısı (derece, -120 sol … 120 sağ); 1×, 2×, 4× hıza göre. */
const ACI: Record<string, number> = { standart: -80, oncelikli: 0, turbo: 95 };
const VIDEO_SN = 75, PARTI = 8;
const partiSuresi = (esz: number, bekleme: number) => bekleme + Math.ceil(PARTI / esz) * VIDEO_SN;

function useYayli(hedef: number) {
  const v = useMotionValue(hedef);
  const [d, setD] = useState(hedef);
  useEffect(() => v.on("change", setD), [v]);
  useEffect(() => { const c = animate(v, hedef, { type: "spring", stiffness: 90, damping: 11, mass: 1 }); return c.stop; }, [hedef, v]);
  return d;
}

function Gosterge({ hiz, onSec }: { hiz: HizSeviye; onSec: (h: HizSeviye) => void }) {
  const aci = useYayli(ACI[hiz]);
  const R = 120, CX = 160, CY = 160;
  const nokta = (a: number, r: number) => { const rad = ((a - 90) * Math.PI) / 180; return [CX + Math.cos(rad) * r, CY + Math.sin(rad) * r]; };
  const yay2 = (a1: number, a2: number, r: number) => { const [x1, y1] = nokta(a1, r), [x2, y2] = nokta(a2, r); return `M${x1} ${y1} A${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2} ${y2}`; };
  const bekleme = HIZ_BEKLEME[hiz];
  return (
    <div className="relative mx-auto mt-6 w-full max-w-[400px]">
      <svg viewBox="0 0 320 250" className="w-full overflow-visible" role="img" aria-label="Hız göstergesi">
        <defs>
          <linearGradient id="hg-dolgu" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffffff" stopOpacity="0.55" /><stop offset="1" stopColor="#55d6fd" /></linearGradient>
        </defs>
        {/* çentikler */}
        {Array.from({ length: 49 }).map((_, i) => {
          const a = -120 + i * 5, buyuk = i % 6 === 0;
          const [x1, y1] = nokta(a, R + 18), [x2, y2] = nokta(a, R + (buyuk ? 6 : 11));
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeOpacity={a <= aci ? (buyuk ? 0.9 : 0.55) : buyuk ? 0.3 : 0.12} strokeWidth={buyuk ? 2 : 1.2} strokeLinecap="round" />;
        })}
        <path d={yay2(-120, 120, R)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="16" strokeLinecap="round" />
        <path d={yay2(-120, Math.max(-119, aci), R)} fill="none" stroke="url(#hg-dolgu)" strokeWidth="16" strokeLinecap="round" />
        {/* ibre */}
        <g transform={`rotate(${aci} ${CX} ${CY})`}>
          <path d={`M${CX - 3.5} ${CY} L${CX} ${CY - R + 22} L${CX + 3.5} ${CY} Z`} fill="white" />
        </g>
        <circle cx={CX} cy={CY} r="11" fill="#141416" stroke="white" strokeWidth="3" />
      </svg>
      {/* seviye etiketleri (tıklanabilir) */}
      {HIZ_SEVIYELERI.map((h) => {
        const [x, y] = nokta(ACI[h.id], R + 36);
        return (
          <button key={h.id} type="button" onClick={() => onSec(h.id as HizSeviye)} style={{ left: `${(x / 320) * 100}%`, top: `${(y / 250) * 100}%` }}
            className={cn("absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 text-[13px] font-semibold tabular-nums transition-colors", hiz === h.id ? "text-white" : "text-white/35 hover:text-white/70")}>{h.kat}</button>
        );
      })}
      <div className="pointer-events-none absolute inset-x-0 bottom-[2%] text-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p key={hiz} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-[34px] font-semibold leading-none tabular-nums tracking-[-0.035em] text-white">{sureYaz(bekleme)}</motion.p>
        </AnimatePresence>
        <p className="mt-1.5 text-[12.5px] text-white/50">{bekleme ? "yoğun saatte bekleme" : "yoğun saatte bile"}</p>
      </div>
    </div>
  );
}

export function HizGosterge() {
  const plan = kartPlan(useAuth((s) => s.kullanici?.plan));
  const girisli = useAuth((s) => s.girisYapildi);
  const mevcutHiz = useEkler((s) => s.hiz);
  const mevcutEk = useEkler((s) => s.ekEsZamanli);
  const hizAyarla = useEkler((s) => s.hizAyarla);
  const azalt = useReducedMotion();
  const [hiz, setHiz] = useState<HizSeviye>(mevcutHiz === "standart" ? "oncelikli" : mevcutHiz);
  const [ek, setEk] = useState(mevcutEk);
  const [isliyor, setIsliyor] = useState(false);
  useEffect(() => setEk(mevcutEk), [mevcutEk]);
  const vref = useRef<HTMLVideoElement>(null);
  const esz = ESZAMANLI[plan];
  const sv = HIZ_SEVIYELERI.find((h) => h.id === hiz)!;
  const ekI = Math.max(0, EK_ESZAMANLI.findIndex((e) => e.adet === ek));
  const toplam = sv.fiyat + EK_ESZAMANLI[ekI].fiyat;
  const degisiklik = hiz !== mevcutHiz || ek !== mevcutEk;
  const parti = partiSuresi(esz.video + ek, HIZ_BEKLEME[hiz]);
  const standartParti = partiSuresi(esz.video, HIZ_BEKLEME.standart);
  const kazanc = standartParti - parti;
  const olcum = useMemo(() => [
    { ikon: Gauge, ad: "Hız", d: sv.kat, alt: hiz === "standart" ? "Sıradaki işlerle" : `Standart'ın ${sv.kat.replace("×", "")} katı` },
    { ikon: Timer, ad: `${PARTI} videoluk parti`, d: sureYaz(parti), alt: kazanc > 0 ? `${sureYaz(kazanc).toLocaleLowerCase("tr-TR")} daha erken` : "Standart süre" },
    { ikon: Layers, ad: "Aynı anda", d: `${esz.video + ek} video`, alt: `${esz.gorsel + ek} görsel` },
  ], [sv, hiz, parti, kazanc, esz, ek]);

  const uygula = () => {
    if (!girisli) return toast.error("Önce giriş yap", { description: "Hızı değiştirmek için hesabınla giriş yapman gerekiyor." });
    setIsliyor(true);
    setTimeout(() => {
      hizAyarla(hiz, ek);
      if (toplam) hareketYaz({ tur: "hiz", aciklama: `${sv.ad} hız${ek ? ` · +${ek} eşzamanlı` : ""} (aylık)`, kredi: 0, tutar: toplam, kdv: Math.round(toplam * KDV), belge: true });
      hesapBildirimi(`${sv.ad} hız etkin`, `Aynı anda ${esz.video + ek} video, ${esz.gorsel + ek} görsel · yoğun saatte ${HIZ_BEKLEME[hiz] ? `bekleme ${sureYaz(HIZ_BEKLEME[hiz]).toLocaleLowerCase("tr-TR")}` : "beklemesiz"}.`);
      toast.success(`${sv.ad} hız etkin`, { description: `${ek ? `+${ek} eşzamanlı iş. ` : ""}${toplam ? `${tl(toplam)} / ay, makbuz Faturalar'da.` : "Ek ücret yok."}` });
      setIsliyor(false);
    }, 600);
  };

  return (
    <div className="relative isolate overflow-hidden rounded-[30px] ring-1 ring-inset ring-white/[0.08]">
      {/* arka plan: seviyenin videosu, çok koyu */}
      <AnimatePresence initial={false}>
        <motion.video ref={vref} key={hiz} src={`/gercek/video-hareket/${HVID[hiz]}.mp4`} poster={`/gercek/video-hareket/${HVID[hiz]}-poster.webp`} autoPlay={!azalt} muted loop playsInline aria-hidden
          initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }} className="absolute inset-0 -z-10 h-full w-full object-cover" />
      </AnimatePresence>
      <div className="absolute inset-0 -z-10 bg-[#0d0d0f]/80" />

      <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <Gosterge hiz={hiz} onSec={setHiz} />

        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={hiz} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
              <p className="flex flex-wrap items-center gap-2.5">
                <span className="text-[40px] font-semibold leading-none tracking-[-0.04em] text-white">{sv.ad}</span>
                {mevcutHiz === hiz ? <span className="rounded-full bg-white px-2.5 py-0.5 text-[12px] font-semibold text-black">Kullandığın</span>
                  : sv.populer ? <span className="rounded-full bg-white/12 px-2.5 py-0.5 text-[12px] font-semibold text-white ring-1 ring-inset ring-white/15">En çok tercih</span> : null}
              </p>
              <p className="mt-2 text-[15px] text-white/60">{sv.ozet}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {olcum.map((o) => (
              <div key={o.ad} className="rounded-[18px] bg-white/[0.05] p-3.5 ring-1 ring-inset ring-white/[0.06]">
                <o.ikon className="h-4 w-4 text-white/45" />
                <AnimatePresence mode="popLayout" initial={false}><motion.p key={o.d} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-2 text-[16px] font-semibold leading-tight tabular-nums text-white sm:text-[19px]">{o.d}</motion.p></AnimatePresence>
                <p className="text-[12px] text-white/45">{o.ad}</p>
                <p className="mt-1 text-[11.5px] text-white/35 max-sm:hidden">{o.alt}</p>
              </div>
            ))}
          </div>

          <div className="mt-5"><Kayan tam id="hg-sev" deger={hiz} sec={(v) => setHiz(v as HizSeviye)} secenekler={HIZ_SEVIYELERI.map((h) => ({ id: h.id, ad: <>{h.ad}<span className={cn("text-[12px] font-medium max-sm:hidden", hiz === h.id ? "text-black/45" : "text-white/35")}>{h.fiyat ? tl(h.fiyat) : "Dahil"}</span></> }))} /></div>

          <div className="mt-3 flex items-center gap-3 rounded-[18px] bg-white/[0.04] p-3 pl-4 ring-1 ring-inset ring-white/[0.06]">
            <Layers className="h-4 w-4 shrink-0 text-white/50" />
            <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold text-white">Ek eşzamanlı üretim</span><span className="block text-[12px] text-white/45 max-sm:hidden">Planında aynı anda {esz.video} video · {esz.gorsel} görsel</span></span>
            <div className="flex items-center gap-0.5 rounded-full bg-black/30 p-1 ring-1 ring-inset ring-white/[0.08]">
              <button type="button" disabled={ekI <= 0} onClick={() => setEk(EK_ESZAMANLI[ekI - 1].adet)} aria-label="Azalt" className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/10 disabled:opacity-30"><Minus className="h-4 w-4" /></button>
              <span className="w-[78px] text-center"><span className="block text-[14px] font-semibold tabular-nums text-white">{ek ? `+${ek}` : "Yok"}</span><span className="block text-[11px] tabular-nums text-white/45">{EK_ESZAMANLI[ekI].fiyat ? `${tl(EK_ESZAMANLI[ekI].fiyat)} / ay` : "Dahil"}</span></span>
              <button type="button" disabled={ekI >= EK_ESZAMANLI.length - 1} onClick={() => setEk(EK_ESZAMANLI[ekI + 1].adet)} aria-label="Artır" className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/10 disabled:opacity-30"><Plus className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-5">
            <p className="text-[13px] text-white/55">{degisiklik ? <><span className="text-[20px] font-semibold tabular-nums text-white">{toplam ? tl(toplam) : "₺0"}</span> / ay · KDV hariç, istediğin an iptal</> : <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Şu an kullandığın ayar</span>}</p>
            <button type="button" disabled={!degisiklik || isliyor} onClick={uygula}
              className="flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[14.5px] font-semibold text-black transition-[opacity,transform] hover:opacity-90 active:scale-[0.97] disabled:bg-white/[0.08] disabled:text-white/45">
              {isliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {!degisiklik ? "Etkin" : toplam ? `${yonelme(sv.ad)} geç` : "Standart'a dön"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
