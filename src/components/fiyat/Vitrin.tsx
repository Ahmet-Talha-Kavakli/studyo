"use client";

/**
 * /fiyatlandirma — "C1 · Sinema kartları" (2026-10-28 kullanıcı seçimi).
 *
 * Plan kartlarının tepesinde gerçek Vayra videosu, en çok tercih edilen planın
 * çevresinde dönen RGB ışık. Tüm rakamlar lib/fiyat ve catalog'dan okunur; satın
 * alma /panel/kredi'de tamamlanır (?sekme=plan&plan=<id>, ?sekme=kredi&paket=<sıra>).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, AudioLines, BadgeCheck, Box, Check, ChevronDown, Clapperboard, Coins, CreditCard, ImageIcon, Infinity as Sonsuz,
  Layers, Lock, Minus, Music, Plus, RotateCcw, ShieldCheck, Sparkles, Users, Zap, type LucideIcon,
} from "lucide-react";
import { MODELLER, type AIModel } from "@/lib/catalog";
import { modelLogoUrl } from "@/components/kitaplik/Simgeler";
import { KrediJeton } from "@/components/ui/KrediHap";
import { useAuth } from "@/store/useAuth";
import { useAuthKapi } from "@/store/useAuthKapi";
import { odemeyeGec } from "@/components/fiyat/OdemePenceresi";
import {
  BIREYSEL_PLANLAR, EKIP, FIYAT_SSS, HIZ_SEVIYELERI, KARSILASTIRMA, KREDI_PAKETLERI, KURUMSAL_OZELLIK, PLAN_SINIRSIZ, SINIRSIZ_TEKLIFLER,
  ULTRA_KREDI_KADEMELERI, UCRETSIZ, aylikFiyat, ekipFiyat, krediBasina, modelErisim, sayi, sinirsizFiyat, tl, tlKurus,
  type Donem, type Hucre, type KartPlanId,
} from "@/lib/fiyat";
import { cn } from "@/lib/utils";

export type Kitle = "bireysel" | "ekip";
const EASE = [0.22, 1, 0.36, 1] as const;
const model = (id: string) => MODELLER.find((m) => m.id === id);
const logo = (ad: string) => modelLogoUrl(ad) ?? "/brand/vayra-mark.png";
const VH = "/gercek/video-hareket/";

/* ══════════════ Veri ══════════════ */

export type Kart = {
  id: KartPlanId; ad: string; kime: string; rozet?: string; cta: string;
  fiyat: number; eski?: number; yillikToplam?: number; kredi: number; ayKredi: number; krediNot: string;
  onceki?: string; yeniler: string[];
};
const VIDEO: Record<string, string> = {
  ucretsiz: "soul-jump", baslangic: "drone-orbit", arti: "low-shutter", ultra: "bullet-time", ekip: "camera-move", kurumsal: "vertigo",
  sinirsiz: "effects", hiz: "fpv-dive",
};

export function kartlar(donem: Donem, ultraKademe: number): Kart[] {
  const p = (id: string) => BIREYSEL_PLANLAR.find((x) => x.id === id)!;
  const yap = (id: "baslangic" | "arti" | "ultra", kredi?: number) => {
    const pl = p(id); const k = kredi ?? pl.kredi;
    const f = aylikFiyat(pl, donem, k), e = aylikFiyat(pl, "aylik", k);
    return { fiyat: f, eski: donem === "yillik" ? e : undefined, yillikToplam: donem === "yillik" ? f * 12 : undefined, kredi: k, ayKredi: k };
  };
  return [
    { id: "ucretsiz", ad: "Ücretsiz", kime: "Vayra'yı tanımak için", cta: "Ücretsiz başla", fiyat: 0, kredi: UCRETSIZ.gunluk, ayKredi: UCRETSIZ.gunluk * 30, krediNot: "kredi / gün",
      yeniler: [`${UCRETSIZ.hosgeldin} kredi hoş geldin hediyesi`, "Nano Banana Pro, Flux 2 ve Hailuo", "Aynı anda 1 görsel · 1 video", "Kart bilgisi gerekmez"] },
    { id: "baslangic", ad: "Başlangıç", kime: "İlk projelerin için", cta: "Başla", ...yap("baslangic"), krediNot: "kredi / ay", onceki: "Ücretsiz",
      yeniler: ["Filigransız, ticari kullanım", "Tüm görsel modelleri", "1080p çıktı", "Aynı anda 2 görsel · 2 video"] },
    { id: "arti", ad: "Artı", kime: "Her gün üretenler için", rozet: "En çok tercih edilen", cta: "Artı'ya geç", ...yap("arti"), krediNot: "kredi / ay", onceki: "Başlangıç",
      yeniler: ["Veo, Sora ve Kling dahil tüm video modelleri", "Sinema, Pazarlama, 3D ve Ses stüdyoları", "Canvas iş akışları", "Kullanılmayan kredi sonraki aya geçer", "Öncelikli kuyruk"] },
    { id: "ultra", ad: "Ultra", kime: "Stüdyolar ve yoğun üretim için", rozet: "En iyi değer", cta: "Ultra'ya geç", ...yap("ultra", ULTRA_KREDI_KADEMELERI[ultraKademe]), krediNot: "kredi / ay", onceki: "Artı",
      yeniler: ["4K çıktı ve Topaz büyütme", "API ve MCP erişimi", "Sınırsız Ruh ID karakter", "Aynı anda 8 görsel · 8 video"] },
  ];
}
const karsilik = (kredi: number) => ({ gorsel: Math.floor(kredi / (model("nano-banana-pro")?.kredi ?? 5)), video: Math.floor(kredi / (model("seedance-2")?.kredi ?? 42)) });

/* ══════════════ Küçük parçalar ══════════════ */

/** Görünür olunca oynayan, hareketi azalt tercihinde ilk karede duran video. */
function KartVideo({ ad, className }: { ad: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const g = new IntersectionObserver(([e]) => { if (e.isIntersecting) void v.play().catch(() => {}); else v.pause(); }, { threshold: 0.15 });
    g.observe(v);
    return () => g.disconnect();
  }, []);
  return <video ref={ref} src={`${VH}${ad}.mp4`} poster={`${VH}${ad}-poster.webp`} muted loop playsInline preload="metadata" aria-hidden className={cn("h-full w-full object-cover", className)} />;
}

export function Bolumlu<T extends string>({ id, secenekler, deger, setDeger, etiket }: { id: string; secenekler: { id: T; ad: React.ReactNode }[]; deger: T; setDeger: (v: T) => void; etiket: string }) {
  return (
    <LayoutGroup id={id}>
      <div role="tablist" aria-label={etiket} className="inline-flex rounded-full bg-[#18181b] p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]">
        {secenekler.map((s) => (
          <button key={s.id} role="tab" aria-selected={deger === s.id} onClick={() => setDeger(s.id)}
            className={cn("relative h-9 rounded-full px-4 text-[13.5px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#55d6fd]/60", deger === s.id ? "text-[#0b0b0d]" : "text-white/60 hover:text-white")}>
            {deger === s.id && <motion.span layoutId={`${id}-zemin`} className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
            <span className="relative flex items-center gap-1.5 whitespace-nowrap">{s.ad}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}
export function DonemSec({ donem, setDonem, id = "donem" }: { donem: Donem; setDonem: (d: Donem) => void; id?: string }) {
  return <Bolumlu id={id} etiket="Faturalandırma dönemi" deger={donem} setDeger={setDonem} secenekler={[
    { id: "aylik", ad: "Aylık" },
    { id: "yillik", ad: <>Yıllık<span className={cn("rounded-full px-1.5 text-[11px] font-bold leading-[18px] transition-colors", donem === "yillik" ? "bg-[#55d6fd]/25 text-[#08637e]" : "bg-[#55d6fd]/15 text-[#55d6fd]")}>yüzde 20 indirim</span></> },
  ]} />;
}

function FiyatBlok({ k }: { k: Kart }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={k.fiyat} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: EASE }}
            className="text-[38px] font-semibold leading-none tracking-[-0.045em] text-white tabular-nums">{tl(k.fiyat)}</motion.span>
        </AnimatePresence>
        {k.eski && <span className="text-[15px] text-white/35 line-through decoration-white/40 tabular-nums">{tl(k.eski)}</span>}
        <span className="text-[14px] text-white/45">/ ay</span>
      </div>
      <p className="mt-2 min-h-[18px] text-[12.5px] leading-snug text-white/45">
        {k.id === "ucretsiz" ? "Her zaman ücretsiz"
          : k.yillikToplam ? <>Yılda bir kez {tl(k.yillikToplam)} · <span className="font-medium text-[#55d6fd]">{tl((k.eski! - k.fiyat) * 12)} tasarruf</span></>
          : "Aylık faturalandırılır, istediğin an iptal"}
      </p>
    </div>
  );
}

function KrediKutusu({ k, children }: { k: Kart; children?: React.ReactNode }) {
  const c = karsilik(k.ayKredi);
  const nb = model("nano-banana-pro"), sd = model("seedance-2");
  return (
    <div className="rounded-[16px] bg-white/[0.035] p-3.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.055)]">
      <p className="flex items-center gap-2">
        <KrediJeton boyut={15} className="kredi-isilti-yildiz" />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={k.kredi} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-[16px] font-semibold tabular-nums text-white">{sayi(k.kredi)}</motion.span>
        </AnimatePresence>
        <span className="text-[13px] text-white/50">{k.krediNot}</span>
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-white/55">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <span className="flex items-center gap-1.5" title={`${nb?.ad} ile`}><img src={logo(nb?.ad ?? "")} alt="" className="h-3.5 w-3.5" />{sayi(c.gorsel)} görsel</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <span className="flex items-center gap-1.5" title={`${sd?.ad} ile`}><img src={logo(sd?.ad ?? "")} alt="" className="h-3.5 w-3.5" />{sayi(c.video)} video</span>
        {k.id === "ucretsiz" && <span className="text-white/35">ayda</span>}
      </p>
      {children}
    </div>
  );
}

function UltraKademe({ kademe, setKademe }: { kademe: number; setKademe: (n: number) => void }) {
  return (
    <div className="mt-3 border-t border-white/[0.06] pt-3">
      <p className="mb-2 text-[12px] text-white/45">Aylık kredi seç</p>
      <LayoutGroup id="ultra-kademe">
        <div role="radiogroup" aria-label="Ultra aylık kredi" className="flex rounded-full bg-black/30 p-0.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
          {ULTRA_KREDI_KADEMELERI.map((k, i) => (
            <button key={k} role="radio" aria-checked={i === kademe} onClick={() => setKademe(i)}
              className={cn("relative h-7 flex-1 rounded-full text-[12px] font-semibold tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#55d6fd]/60", i === kademe ? "text-[#06222c]" : "text-white/55 hover:text-white")}>
              {i === kademe && <motion.span layoutId="ultra-kademe-z" className="absolute inset-0 rounded-full bg-[#55d6fd]" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
              <span className="relative">{sayi(k)}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>
    </div>
  );
}

function SinirsizBlok({ id }: { id: KartPlanId }) {
  const l = PLAN_SINIRSIZ[id];
  if (!l.length) return null;
  return (
    <div className="rounded-[16px] p-3 shadow-[inset_0_0_0_1px_rgba(85,214,253,0.22)]" style={{ background: "linear-gradient(160deg, rgba(85,214,253,0.08), rgba(139,123,255,0.05))" }}>
      <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#55d6fd]"><Sonsuz className="h-4 w-4" />Kredi düşmeden</p>
      <ul className="mt-2 space-y-1.5">
        {l.map((s) => {
          const m = model(s.model);
          return (
            <li key={s.model} className="flex items-center gap-2 text-[13px] text-white/85">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo(m?.ad ?? "")} alt="" className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{m?.ad}</span><span className="shrink-0 text-[12px] text-white/45">{s.etiket}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Ozellikler({ onceki, liste }: { onceki?: string; liste: string[] }) {
  return (
    <div>
      <p className="text-[12.5px] font-medium text-white/45">{onceki ? `${onceki} planındaki her şey, artı:` : "Neler var:"}</p>
      <ul className="mt-2.5 space-y-2">
        {liste.map((y) => <li key={y} className="flex gap-2.5 text-[13.5px] leading-snug text-white/80"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#55d6fd]" strokeWidth={2.4} />{y}</li>)}
      </ul>
    </div>
  );
}

/** Panelde planı seçer: ödeme özeti açılır, ödeme sağlayıcının güvenli sayfasında yapılır (davet indirimi sunucuda uygulanır). */
export function planaGec(k: Kart, donem: Donem) {
  if (k.id === "ucretsiz") return;
  odemeyeGec({ tur: "plan", urun: k.id === "ultra" && k.kredi !== ULTRA_KREDI_KADEMELERI[0] ? `ultra-${k.kredi}` : k.id, donem });
}

/** Ücretsizde giriş penceresi; ücretli planlarda sitede satın alma sayfasına, panelde doğrudan plan değişimi. */
function PlanCTA({ k, donem, vurgu, panel }: { k: Kart; donem: Donem; vurgu?: boolean; panel?: boolean }) {
  const mevcut = useAuth((s) => s.kullanici?.plan);
  const router = useRouter();
  const girisli = useAuth((s) => s.girisYapildi);
  const ac = useAuthKapi((s) => s.ac);
  const sinif = cn("group/cta flex h-11 w-full items-center justify-center gap-1.5 rounded-full text-[14px] font-semibold outline-none transition-[background-color,transform] focus-visible:ring-2 focus-visible:ring-[#55d6fd]/70 active:scale-[0.98]",
    vurgu ? "bg-white text-[#0b0b0d] hover:bg-white/90" : "bg-white/[0.08] text-white ring-1 ring-inset ring-white/[0.1] hover:bg-white/[0.13]");
  const ic = <>{k.cta}<ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" /></>;
  if (panel) {
    if (mevcut === k.id) return <span className="flex h-11 w-full items-center justify-center gap-1.5 rounded-full text-[14px] font-semibold text-white/50 ring-1 ring-inset ring-white/[0.1]"><Check className="h-4 w-4" />Kullandığın plan</span>;
    return <button onClick={() => planaGec(k, donem)} className={sinif}>{k.id === "baslangic" ? "Başlangıç'a geç" : k.cta}<ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" /></button>;
  }
  if (k.id === "ucretsiz") {
    return <button onClick={() => (girisli ? router.push("/panel") : ac({ eylem: () => router.push("/panel") }))} className={sinif}>{ic}</button>;
  }
  return <Link href={`/panel/kredi?sekme=plan&plan=${k.id}&donem=${donem}`} className={sinif}>{ic}</Link>;
}

/* ══════════════ Plan kartları ══════════════ */

function KartGovde({ children, rgb }: { children: React.ReactNode; rgb?: boolean }) {
  if (!rgb) return <div className="h-full rounded-[28px] bg-white/[0.08] p-px">{children}</div>;
  return (
    <div className="relative h-full">
      {/* Dönen RGB ışık: bulanık hale + 1.5px kenar */}
      <span aria-hidden className="rgb-cerceve rgb-hale pointer-events-none absolute -inset-[3px] rounded-[31px]" />
      <div className="rgb-cerceve relative h-full rounded-[28px] p-[1.5px]">{children}</div>
    </div>
  );
}

function VideoBaslik({ ad, baslik, alt, rozet, rgb }: { ad: string; baslik: string; alt: string; rozet?: string; rgb?: boolean }) {
  return (
    <div className="relative h-[190px] overflow-hidden">
      <KartVideo ad={ad} className="transition-transform duration-[900ms] ease-out group-hover:scale-[1.045]" />
      <span className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/0 to-[#111113]" />
      {rozet && (
        <span className={cn("absolute right-3.5 top-3.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold backdrop-blur-md",
          rgb ? "rgb-rozet text-white" : "bg-black/50 text-white/90 ring-1 ring-inset ring-white/15")}>{rozet}</span>
      )}
      <div className="absolute inset-x-5 bottom-3">
        <h3 className="text-[26px] font-semibold tracking-[-0.03em] text-white">{baslik}</h3>
        <p className="text-[13px] text-white/65">{alt}</p>
      </div>
    </div>
  );
}

export function PlanKartlari({ donem, kademe, setKademe, panel }: { donem: Donem; kademe: number; setKademe: (n: number) => void; panel?: boolean }) {
  const l = kartlar(donem, kademe).filter((k) => !panel || k.id !== "ucretsiz");
  return (
    <div className={cn("grid items-stretch gap-3 md:grid-cols-2", panel ? "lg:grid-cols-3" : "xl:grid-cols-4")}>
      {l.map((k, i) => {
        const v = k.id === "arti";
        return (
          <motion.div key={k.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.5, ease: EASE }}>
            <KartGovde rgb={v}>
              <article aria-label={`${k.ad} planı`} className="group flex h-full flex-col overflow-hidden rounded-[27px] bg-[#111113]">
                <VideoBaslik ad={VIDEO[k.id]} baslik={k.ad} alt={k.kime} rozet={k.rozet} rgb={v} />
                <div className="flex flex-1 flex-col gap-5 p-5 pt-4">
                  <FiyatBlok k={k} />
                  <PlanCTA k={k} donem={donem} vurgu={v} panel={panel} />
                  <KrediKutusu k={k}>{k.id === "ultra" && <UltraKademe kademe={kademe} setKademe={setKademe} />}</KrediKutusu>
                  <SinirsizBlok id={k.id} />
                  <div className="border-t border-white/[0.06] pt-4"><Ozellikler onceki={k.onceki} liste={k.yeniler} /></div>
                </div>
              </article>
            </KartGovde>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ── Ekip ve kurumsal ── */
export function EkipKartlari({ donem }: { donem: Donem }) {
  const [kademe, setKademe] = useState(1);
  const kredi = EKIP.kademeler[kademe];
  const fiyat = ekipFiyat(kredi, donem), eski = ekipFiyat(kredi, "aylik");
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
        <KartGovde rgb>
          <article className="group flex h-full flex-col overflow-hidden rounded-[27px] bg-[#111113]">
            <VideoBaslik ad={VIDEO.ekip} baslik={EKIP.ad} alt={EKIP.ozet} rozet="Ajanslar için" rgb />
            <div className="grid flex-1 gap-6 p-5 pt-4 sm:grid-cols-2">
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[38px] font-semibold leading-none tracking-[-0.045em] text-white tabular-nums">{tl(fiyat)}</span>
                    {donem === "yillik" && <span className="text-[15px] text-white/35 line-through tabular-nums">{tl(eski)}</span>}
                    <span className="text-[14px] text-white/45">/ ay</span>
                  </div>
                  <p className="mt-2 text-[12.5px] text-white/45">Koltuk başı ücret yok · {EKIP.uyeler} · kredi başı {tlKurus(fiyat / kredi)}</p>
                </div>
                <div className="rounded-[16px] bg-white/[0.035] p-3.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.055)]">
                  <p className="flex items-center gap-2"><KrediJeton boyut={15} className="kredi-isilti-yildiz" /><span className="text-[16px] font-semibold tabular-nums text-white">{sayi(kredi)}</span><span className="text-[13px] text-white/50">kredi / ay · ortak havuz</span></p>
                  <div className="mt-3 flex rounded-full bg-black/30 p-0.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
                    {EKIP.kademeler.map((k, i) => (
                      <button key={k} onClick={() => setKademe(i)} className={cn("relative h-7 flex-1 rounded-full text-[12px] font-semibold tabular-nums transition-colors", i === kademe ? "text-[#06222c]" : "text-white/55 hover:text-white")}>
                        {i === kademe && <motion.span layoutId="ekip-kademe" className="absolute inset-0 rounded-full bg-[#55d6fd]" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                        <span className="relative">{sayi(k / 1000)}B</span>
                      </button>
                    ))}
                  </div>
                </div>
                <Link href="/iletisim?konu=satis" className="group/cta mt-auto flex h-11 items-center justify-center gap-1.5 rounded-full bg-white text-[14px] font-semibold text-[#0b0b0d] transition-[background-color,transform] hover:bg-white/90 active:scale-[0.98]">
                  Ekibini kur<ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" />
                </Link>
              </div>
              <div className="sm:border-l sm:border-white/[0.06] sm:pl-6"><Ozellikler liste={EKIP.ozellikler} /></div>
            </div>
          </article>
        </KartGovde>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.5, ease: EASE }}>
        <KartGovde>
          <article className="group flex h-full flex-col overflow-hidden rounded-[27px] bg-[#111113]">
            <VideoBaslik ad={VIDEO.kurumsal} baslik="Kurumsal" alt="Markalar ve büyük ekipler için özel çözüm" />
            <div className="grid flex-1 gap-6 p-5 pt-4 sm:grid-cols-2">
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-[38px] font-semibold leading-none tracking-[-0.045em] text-white">Özel fiyat</p>
                  <p className="mt-2 text-[12.5px] text-white/45">Hacmine ve sözleşmene göre, fatura ile ödeme</p>
                </div>
                <div className="rounded-[16px] bg-white/[0.035] p-3.5 text-[13px] leading-relaxed text-white/60 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.055)]">
                  SSO, denetim kayıtları, özel model eğitimi ve atanmış başarı yöneticisiyle tüm ekibin tek çatı altında.
                </div>
                <Link href="/kurumsal" className="group/cta mt-auto flex h-11 items-center justify-center gap-1.5 rounded-full bg-white/[0.08] text-[14px] font-semibold text-white ring-1 ring-inset ring-white/[0.1] transition-[background-color,transform] hover:bg-white/[0.13] active:scale-[0.98]">
                  Satışla görüş<ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" />
                </Link>
              </div>
              <div className="sm:border-l sm:border-white/[0.06] sm:pl-6"><Ozellikler liste={KURUMSAL_OZELLIK} /></div>
            </div>
          </article>
        </KartGovde>
      </motion.div>
    </div>
  );
}

/* ══════════════ Model logoları şeridi ══════════════ */
const SERIT = ["veo-31", "sora-2", "kling-3", "seedance-2", "nano-banana-pro", "hailuo-23", "seedream-5", "wan-27", "flux-2"];
export function LogoSeridi() {
  const l = SERIT.map(model).filter(Boolean) as AIModel[];
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]" aria-label="Planlardaki modeller">
      <div className="kare-akis flex w-max gap-9 py-1" style={{ animationDuration: "45s" }}>
        {[...l, ...l].map((m, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <span key={i} aria-hidden={i >= l.length} className="flex shrink-0 items-center gap-2 text-[14px] font-medium text-white/55"><img src={logo(m.ad)} alt="" className="h-[18px] w-[18px]" />{m.ad}</span>
        ))}
      </div>
    </div>
  );
}

/* ══════════════ Kredin neye yeter? ══════════════ */
const TURLER: { id: AIModel["tur"]; ad: string; ikon: LucideIcon }[] = [
  { id: "video", ad: "Video", ikon: Clapperboard }, { id: "gorsel", ad: "Görsel", ikon: ImageIcon }, { id: "ses", ad: "Ses", ikon: AudioLines },
  { id: "muzik", ad: "Müzik", ikon: Music }, { id: "3d", ad: "3D", ikon: Box },
];
const ILK_PLAN: Record<KartPlanId, string> = { ucretsiz: "Ücretsiz'de", baslangic: "Başlangıç'ta", arti: "Artı'da", ultra: "Ultra'da" };
export function ModelTablosu({ donem, kademe }: { donem: Donem; kademe: number }) {
  const [tur, setTur] = useState<AIModel["tur"]>("video");
  const [hepsi, setHepsi] = useState(false);
  const l = kartlar(donem, kademe);
  const tum = MODELLER.filter((m) => m.tur === tur).sort((a, b) => b.kredi - a.kredi);
  const goster = hepsi ? tum : tum.slice(0, 6);
  useEffect(() => setHepsi(false), [tur]);
  return (
    <div>
      <div className="gizli-scroll -mx-5 overflow-x-auto px-5">
        <Bolumlu id="model-tur" etiket="Model türü" deger={tur} setDeger={setTur} secenekler={TURLER.map((t) => ({ id: t.id, ad: <><t.ikon className="h-3.5 w-3.5" />{t.ad}</> }))} />
      </div>
      <div className="mt-5 overflow-hidden rounded-[24px] bg-[#111113] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]">
        <div className="gizli-scroll overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 z-10 bg-[#111113] px-5 py-4 text-[13px] font-medium text-white/45">Model · üretim başı</th>
                {l.map((k) => (
                  <th key={k.id} scope="col" className={cn("px-5 py-4 text-[14px] font-semibold text-white", k.id === "arti" && "bg-[#55d6fd]/[0.055]")}>
                    {k.ad}<span className="block text-[12px] font-normal tabular-nums text-white/40">{sayi(k.ayKredi)} kredi / ay</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {goster.map((m) => (
                  <motion.tr key={m.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-t border-white/[0.05] text-[14px]">
                    <th scope="row" className="sticky left-0 z-10 bg-[#111113] px-5 py-3 font-normal">
                      <span className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.06]"><img src={logo(m.ad)} alt="" className="h-4 w-4" /></span>
                        <span className="min-w-0"><span className="block truncate font-medium text-white">{m.ad}</span><span className="text-[12px] tabular-nums text-white/40">{m.kredi} kredi</span></span>
                      </span>
                    </th>
                    {l.map((k) => {
                      const s = PLAN_SINIRSIZ[k.id].find((x) => x.model === m.id);
                      const acik = modelErisim(m.id, k.id);
                      const ilk = (["ucretsiz", "baslangic", "arti", "ultra"] as KartPlanId[]).find((p) => modelErisim(m.id, p));
                      return (
                        <td key={k.id} className={cn("px-5 py-3 tabular-nums", k.id === "arti" && "bg-[#55d6fd]/[0.055]")}>
                          {s ? <span className="flex items-center gap-1.5 font-semibold text-[#55d6fd]"><Sonsuz className="h-4 w-4" />Sınırsız<span className="text-[11.5px] font-normal text-white/40">{s.etiket.replace(" · sınırsız", "").replace("sınırsız", "")}</span></span>
                            : !acik ? <span className="flex items-center gap-1.5 text-[12.5px] text-white/30"><Lock className="h-3.5 w-3.5" />{ilk ? ILK_PLAN[ilk] : "—"}</span>
                            : <span className="text-white/85">{sayi(Math.floor(k.ayKredi / m.kredi))}</span>}
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {tum.length > 6 && (
          <button onClick={() => setHepsi((h) => !h)} className="flex w-full items-center justify-center gap-1.5 border-t border-white/[0.05] py-3.5 text-[13.5px] font-medium text-white/70 transition-colors hover:bg-white/[0.03] hover:text-white">
            {hepsi ? "Daha az göster" : `Tüm ${tum.length} modeli göster`}<ChevronDown className={cn("h-4 w-4 transition-transform", hepsi && "rotate-180")} />
          </button>
        )}
      </div>
      <p className="mt-3 text-[12.5px] text-white/40">Sayılar ayda yaklaşık üretim adedidir; video için varsayılan süre ve kaliteyle hesaplanır. Ücretsiz planda 30 günlük kredi esas alınır.</p>
    </div>
  );
}

/* ══════════════ Kredi paketleri (P2 · Mağaza) ══════════════ */

/** Yandan görünen madeni para: koyu kenar bandı + parlak üst yüz + basık yıldız. */
export function Jeton({ soluk }: { soluk?: boolean }) {
  return (
    <span className={cn("relative block h-[20px] w-[46px]", soluk && "opacity-70")}>
      <span className="absolute inset-x-0 bottom-0 h-[15px] rounded-[50%] bg-[linear-gradient(180deg,#1f7f9c,#0b3240_70%)] shadow-[inset_0_-1px_0_rgba(255,255,255,0.12)]" />
      <span className="absolute inset-x-0 top-0 flex h-[15px] items-center justify-center rounded-[50%] bg-[radial-gradient(120%_140%_at_35%_20%,#e6fbff_0%,#8fe6ff_28%,#3bbde3_60%,#167a98_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]">
        <span className="block h-[8px] w-[24px] rounded-[50%] shadow-[inset_0_0_0_1px_rgba(9,74,94,0.45)]" />
        <svg viewBox="0 0 24 24" className="absolute h-[14px] w-[14px] scale-y-[0.42] fill-[#0b4e63]" aria-hidden><path d="M12 1.5c.5 5.6 4.9 10 10.5 10.5-5.6.5-10 4.9-10.5 10.5C11.5 16.9 7.1 12.5 1.5 12 7.1 11.5 11.5 7.1 12 1.5Z" /></svg>
      </span>
    </span>
  );
}
/** Pakete göre büyüyen yığın: arka sıra (soluk, yukarıda) + ön sıra. */
const YIGIN: { arka: number[]; on: number[] }[] = [
  { arka: [], on: [1] }, { arka: [], on: [2, 3] }, { arka: [2], on: [3, 4] },
  { arka: [3, 4], on: [4, 6, 3] }, { arka: [4, 5, 3], on: [5, 7, 6] }, { arka: [5, 7, 6, 4], on: [6, 9, 8, 5] },
];
export function Yigin({ i, ust }: { i: number; ust: boolean }) {
  const y = YIGIN[i];
  const sutun = (adet: number, k: number, soluk?: boolean) => (
    <span key={k} className="-mx-[7px] flex flex-col-reverse">
      {Array.from({ length: adet }, (_, j) => (
        <motion.span key={j} className="-mt-[13px] first:mt-0" animate={ust ? { y: [0, -5, 0] } : { y: 0 }} transition={{ duration: 0.45, delay: (k * 2 + j) * 0.025, ease: "easeOut" }}>
          <Jeton soluk={soluk} />
        </motion.span>
      ))}
    </span>
  );
  return (
    <div className="relative flex h-[130px] items-end justify-center">
      <span aria-hidden className="absolute bottom-0 left-1/2 h-[26px] w-[150px] -translate-x-1/2 rounded-[50%] bg-[#55d6fd]/[0.12] blur-md transition-opacity duration-500" style={{ opacity: 0.4 + i * 0.12 }} />
      {y.arka.length > 0 && <div className="absolute bottom-[12px] left-1/2 flex -translate-x-1/2 items-end">{y.arka.map((a, k) => sutun(a, k, true))}</div>}
      <div className="relative flex items-end">{y.on.map((a, k) => sutun(a, k + 10))}</div>
    </div>
  );
}

export function KrediPaketleri() {
  const [ust, setUst] = useState<number | null>(null);
  const taban = krediBasina(KREDI_PAKETLERI[0].fiyat, KREDI_PAKETLERI[0].kredi);
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {KREDI_PAKETLERI.map((p, i) => {
          const pop = !!p.populer;
          const ind = Math.round((1 - krediBasina(p.fiyat, p.kredi) / taban) * 100);
          const c = karsilik(p.kredi);
          const govde = (
            <Link href={`/panel/kredi?sekme=kredi&paket=${i}`} onMouseEnter={() => setUst(i)} onMouseLeave={() => setUst(null)} onFocus={() => setUst(i)} onBlur={() => setUst(null)}
              aria-label={`${sayi(p.kredi)} kredi, ${tl(p.fiyat)}`}
              className="group flex h-full flex-col items-center overflow-hidden rounded-[25px] bg-[linear-gradient(180deg,#151519_0%,#101012_60%)] px-4 pb-4 pt-4 text-center outline-none focus-visible:ring-2 focus-visible:ring-[#55d6fd]/60">
              <span className={cn("h-[22px] whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-semibold leading-[22px]",
                pop ? "rgb-rozet text-white" : ind > 0 ? "bg-white/[0.07] text-white/70" : "invisible")}>
                {pop ? "En çok alınan" : `yüzde ${ind} avantaj`}
              </span>
              <div className="mt-2 w-full"><Yigin i={i} ust={ust === i} /></div>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-[28px] font-semibold leading-none tracking-[-0.035em] text-white tabular-nums">{sayi(p.kredi)}</span>
                <span className="text-[13px] text-white/45">kredi</span>
              </p>
              <p className="mt-1.5 flex flex-wrap justify-center gap-x-1.5 text-[12.5px] tabular-nums text-white/45"><span className="whitespace-nowrap">{sayi(c.gorsel)} görsel</span><span className="whitespace-nowrap">{sayi(c.video)} video</span></p>
              <div className="mt-auto w-full pt-5">
                <span className={cn("flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[14.5px] font-semibold tabular-nums transition-[background-color,transform] group-active:scale-[0.97]",
                  pop ? "bg-white text-[#0b0b0d] group-hover:bg-white/90" : "bg-white/[0.08] text-white ring-1 ring-inset ring-white/[0.08] group-hover:bg-white group-hover:text-[#0b0b0d]")}>
                  {tl(p.fiyat)}
                </span>
                <p className="mt-2 text-[11.5px] tabular-nums text-white/35">{tlKurus(krediBasina(p.fiyat, p.kredi))} / kredi</p>
              </div>
            </Link>
          );
          return (
            <motion.div key={p.kredi} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.05, duration: 0.5, ease: EASE }} whileHover={{ y: -4 }} className="h-full">
              {pop ? (
                <div className="relative h-full">
                  <span aria-hidden className="rgb-cerceve rgb-hale pointer-events-none absolute -inset-[3px] rounded-[29px]" />
                  <div className="rgb-cerceve relative h-full rounded-[26px] p-[1.5px]">{govde}</div>
                </div>
              ) : <div className="h-full rounded-[26px] bg-white/[0.08] p-px transition-colors hover:bg-white/[0.16]">{govde}</div>}
            </motion.div>
          );
        })}
      </div>
      <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-[20px] bg-white/[0.025] px-5 py-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] sm:flex-row">
        <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-[13px] text-white/60">
          {["Süresi hiç dolmaz", "Anında yüklenir", "Kullanılmayan kredide 14 gün iade", "KDV hariç"].map((x) => <li key={x} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#55d6fd]" strokeWidth={2.4} />{x}</li>)}
        </ul>
        <p className="text-[13px] text-white/45">Her ay üretiyorsan <Link href="/panel/kredi?sekme=plan&plan=arti" className="font-medium text-white underline decoration-white/25 underline-offset-2 hover:decoration-white">Artı planında</Link> kredi daha ucuz.</p>
      </div>
    </div>
  );
}

/* ══════════════ Ek güç ══════════════ */
export function EkGuc() {
  const kartlar = [
    { ad: "Sınırsız erişim", ozet: "Seçtiğin modeli 1, 7 ya da 30 gün boyunca kredi düşmeden kullan. Kampanya haftaları için ideal.", fiyat: `Günde ${tl(Math.min(...SINIRSIZ_TEKLIFLER.map((t) => sinirsizFiyat(t, 0, 0))))}'den`, video: VIDEO.sinirsiz, ikon: Sonsuz, href: "/panel/kredi?sekme=sinirsiz" },
    { ad: "Öncelikli hız", ozet: "Yoğun saatlerde kuyruğun önüne geç. Turbo'da ayrılmış kapasitede 4 kat hızlı üret.", fiyat: `Aylık ${tl(HIZ_SEVIYELERI[1].fiyat)}'den`, video: VIDEO.hiz, ikon: Zap, href: "/panel/kredi?sekme=hiz" },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {kartlar.map((k, i) => (
        <motion.div key={k.ad} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: i * 0.06, duration: 0.5, ease: EASE }}>
          <Link href={k.href} className="group relative isolate flex min-h-[300px] flex-col justify-end overflow-hidden rounded-[28px] p-7 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
            <div className="absolute inset-0 -z-10"><KartVideo ad={k.video} className="transition-transform duration-[900ms] group-hover:scale-[1.04]" /></div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/45 to-black/5" />
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.12] ring-1 ring-inset ring-white/20 backdrop-blur-md"><k.ikon className="h-5 w-5 text-white" /></span>
            <h3 className="mt-4 text-[26px] font-semibold tracking-[-0.025em] text-white">{k.ad}</h3>
            <p className="mt-1.5 max-w-[440px] text-[14.5px] leading-relaxed text-white/75">{k.ozet}</p>
            <p className="mt-6 flex items-center justify-between gap-3">
              <span className="text-[14px] font-semibold text-white">{k.fiyat}</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors group-hover:bg-white group-hover:text-[#0b0b0d]"><ArrowUpRight className="h-[18px] w-[18px]" /></span>
            </p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

/* ══════════════ Ayrıntılı karşılaştırma (K1 · Videolu tablo) ══════════════ */
const KAR_PLANLAR = [
  { id: "baslangic", ad: "Başlangıç", video: VIDEO.baslangic }, { id: "arti", ad: "Artı", video: VIDEO.arti },
  { id: "ultra", ad: "Ultra", video: VIDEO.ultra }, { id: "kurumsal", ad: "Kurumsal", video: VIDEO.kurumsal },
] as const;
const GRUP_IKON: LucideIcon[] = [Coins, Sparkles, Layers, Users];
const KOLON = "grid grid-cols-[minmax(230px,1.35fr)_repeat(4,minmax(0,1fr))] gap-2";
function HucreG({ d }: { d: Hucre }) {
  if (d === true) return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#55d6fd]/15" aria-label="Var"><Check className="h-3.5 w-3.5 text-[#55d6fd]" strokeWidth={3} /></span>;
  if (d === false) return <Minus className="h-4 w-4 text-white/15" aria-label="Yok" />;
  return <span className="text-[13.5px] font-medium text-white">{d}</span>;
}
export function Karsilastirma({ donem }: { donem: Donem }) {
  const fiyat = (id: string) => { const p = BIREYSEL_PLANLAR.find((x) => x.id === id); return p ? `${tl(aylikFiyat(p, donem))} / ay` : "Özel fiyat"; };
  return (
    <div className="rounded-[28px] bg-[#111113] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
      <div className="gizli-scroll overflow-x-auto lg:overflow-visible">
        <div className="min-w-[880px] pb-3">
          {/* Yapışkan başlık: her planın videolu mini kartı */}
          <div className={cn(KOLON, "sticky top-[var(--ust-nav)] z-20 rounded-t-[28px] bg-[#111113]/95 p-3 backdrop-blur-xl")}>
            <div className="flex flex-col justify-end p-3">
              <p className="text-[13px] text-white/45">{donem === "yillik" ? "Yıllık faturalandırma" : "Aylık faturalandırma"}</p>
              <p className="mt-1 text-[13px] text-white/45">Fiyatlara KDV dahil değil</p>
            </div>
            {KAR_PLANLAR.map((p) => {
              const v = p.id === "arti";
              return (
                <div key={p.id} className={cn("rounded-[18px]", v ? "rgb-cerceve p-[1.5px]" : "bg-white/[0.07] p-px")}>
                  <div className="group h-full overflow-hidden rounded-[16.5px] bg-[#111113]">
                    <div className="relative h-[76px] overflow-hidden">
                      <KartVideo ad={p.video} className="transition-transform duration-700 group-hover:scale-105" />
                      <span className="absolute inset-0 bg-gradient-to-b from-black/10 to-[#111113]" />
                      <p className="absolute bottom-1.5 left-3 text-[16px] font-semibold text-white">{p.ad}</p>
                    </div>
                    <div className="p-3 pt-1">
                      <p className="text-[12.5px] tabular-nums text-white/55">{fiyat(p.id)}</p>
                      <Link href={p.id === "kurumsal" ? "/kurumsal" : `/panel/kredi?sekme=plan&plan=${p.id}&donem=${donem}`}
                        className={cn("mt-2.5 flex h-8 items-center justify-center rounded-full text-[12.5px] font-semibold transition-colors", v ? "bg-white text-[#0b0b0d] hover:bg-white/90" : "bg-white/[0.08] text-white hover:bg-white/[0.14]")}>
                        {p.id === "kurumsal" ? "Görüşelim" : `${p.ad} seç`}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {KARSILASTIRMA.map((g, gi) => {
            const I = GRUP_IKON[gi] ?? Sparkles;
            return (
              <div key={g.grup} className="px-3">
                <p className="flex items-center gap-2.5 px-3 pb-2.5 pt-6 text-[15px] font-semibold text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-white/[0.06]"><I className="h-4 w-4 text-white/75" /></span>{g.grup}
                </p>
                <div className="overflow-hidden rounded-[18px] bg-white/[0.02] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                  {g.satirlar.map((s, si) => (
                    <div key={s.ad} className={cn(KOLON, "px-3 transition-colors hover:bg-white/[0.03]", si > 0 && "border-t border-white/[0.04]")}>
                      <div className="py-3.5 pl-3 text-[13.5px] text-white/70">{s.ad}{s.ipucu && <span className="block text-[12px] text-white/35">{s.ipucu}</span>}</div>
                      {s.d.map((d, i) => <div key={i} className={cn("flex items-center py-3.5 pl-3", i === 1 && "bg-[#55d6fd]/[0.045]")}><HucreG d={d} /></div>)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════ Güven şeridi ══════════════ */
export function Guven() {
  const l = [
    { ikon: ShieldCheck, ad: "Güvenli ödeme", alt: "Kart bilgilerin bizde saklanmaz" },
    { ikon: RotateCcw, ad: "İstediğin an iptal", alt: "Taahhüt yok, dönem sonuna kadar kullan" },
    { ikon: CreditCard, ad: "Türk lirası", alt: "Kur farkı yok, e-fatura" },
    { ikon: BadgeCheck, ad: "Ticari kullanım", alt: "Ücretli planlarda üretimler senin" },
  ];
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] bg-white/[0.06] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] lg:grid-cols-4">
      {l.map((x) => (
        <div key={x.ad} className="flex items-start gap-3 bg-[#0d0d0f] p-5">
          <x.ikon className="mt-0.5 h-5 w-5 shrink-0 text-[#55d6fd]" strokeWidth={1.9} />
          <span><span className="block text-[14px] font-semibold text-white">{x.ad}</span><span className="mt-0.5 block text-[12.5px] leading-snug text-white/45">{x.alt}</span></span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════ SSS ══════════════ */
const EK_SSS = [
  { s: "Fiyatlara KDV dahil mi?", c: "Hayır. Gösterilen fiyatlara yüzde 20 KDV eklenir; ödeme özetinde toplamı ayrıca görürsün. Yurt dışından ABD doları ile yapılan ödemede KDV uygulanmaz." },
  { s: "Ekip planında koltuk başına ücret var mı?", c: "Yok. Ekip planında ortak bir kredi havuzu alırsın; 10 üyeye kadar ekleyebilir, her üyeye harcama limiti koyabilirsin." },
  { s: "“Kredi düşmeden” kullanım nasıl çalışır?", c: "Planında listelenen modeller Vayra arayüzünde kredi harcamadan çalışır. Yoğun saatlerde sıraya alınabilir; API, MCP ve Canvas kullanımında kredi düşer." },
];
export function SSS() {
  const [acik, setAcik] = useState<number | null>(0);
  const l = useMemo(() => [...FIYAT_SSS, ...EK_SSS], []);
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
      <div>
        <h2 className="text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-[40px]">Aklına takılanlar.</h2>
        <p className="mt-3 text-[15px] text-white/55">Cevabını bulamadın mı? Ekibimiz 4 iş saati içinde döner.</p>
        <Link href="/iletisim?konu=fatura" className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-white/[0.08] px-4 text-[13.5px] font-semibold text-white ring-1 ring-inset ring-white/[0.1] transition-colors hover:bg-white/[0.13]">
          <Users className="h-4 w-4" />Bize yaz
        </Link>
      </div>
      <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
        {l.map((q, i) => {
          const a = acik === i;
          return (
            <div key={q.s}>
              <button onClick={() => setAcik(a ? null : i)} aria-expanded={a} className="group flex w-full items-center justify-between gap-4 py-5 text-left">
                <span className="text-[16px] font-semibold text-white">{q.s}</span>
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors", a ? "bg-white text-[#0b0b0d]" : "bg-white/[0.06] text-white/70 group-hover:bg-white/[0.1]")}>
                  <Plus className={cn("h-4 w-4 transition-transform duration-300", a && "rotate-45")} />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {a && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                    <p className="max-w-[640px] pb-5 text-[14.5px] leading-relaxed text-white/60">{q.c}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
