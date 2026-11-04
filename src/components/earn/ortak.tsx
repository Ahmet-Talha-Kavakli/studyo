"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Clock, Eye, Lock, Trophy, Users, X } from "lucide-react";
import {
  TUR_AD, KURALLAR, kalanGun, kisaSayi, platformBul, tl, bittiMi, type Kampanya, type Platform,
} from "@/lib/earn/kampanyalar";
import { gonderiHesap, kampanyaHakki, useEarn, type Gonderi, type GonderiDurum } from "@/store/useEarn";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { havuzSec } from "@/lib/medyaHavuzu";
/** Telifsiz havuzdan bu sayfaya özgü hero klibi (tekrar eden seedance/hero-video yerine). */
const ORTAK_HERO = havuzSec("earn-ortak", ["muzik", "hareket"]);

/** Zamana bağlı hesaplar için "şimdi" — 30 sn'de bir tazelenir. */
export function useSimdi(aralik = 30_000) {
  const [simdi, setSimdi] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setSimdi(Date.now()), aralik); return () => clearInterval(t); }, [aralik]);
  return simdi;
}

/** Earn düğmeleri: birincil camgöbeği hap, ikincil çerçeveli hap. */
export const earnBirincil = "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-vurgu px-4 text-[13.5px] font-medium text-vurgu-ust transition-[transform,opacity] hover:opacity-90 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";
export const earnIkincil = "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[13.5px] text-white ring-1 ring-white/[0.12] transition-[transform,background-color] hover:bg-white/[0.05] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";

export function SayfaBaslik({ baslik, alt, sag }: { baslik: string; alt?: string; sag?: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[32px]">{baslik}</h1>
        {alt && <p className="mt-1.5 max-w-[620px] text-[14.5px] leading-relaxed text-metin-2">{alt}</p>}
      </div>
      {sag && <div className="flex shrink-0 flex-wrap gap-2">{sag}</div>}
    </motion.div>
  );
}

export function Kart({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-[20px] bg-white/[0.025] ring-1 ring-white/[0.08]", className)}>{children}</div>;
}

export function BolumEtiket({ children, sag }: { children: React.ReactNode; sag?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-white">{children}</h2>
      {sag}
    </div>
  );
}

/** 0'dan hedefe yumuşak sayan sayaç (giriş animasyonu). */
export function Sayac({ hedef, sure = 1400, bicim }: { hedef: number; sure?: number; bicim: (n: number) => string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let r = 0; const t0 = performance.now();
    const ad = (t: number) => { const p = Math.min(1, (t - t0) / sure); setN(hedef * (1 - Math.pow(1 - p, 3))); if (p < 1) r = requestAnimationFrame(ad); };
    r = requestAnimationFrame(ad); return () => cancelAnimationFrame(r);
  }, [hedef, sure]);
  return <>{bicim(n)}</>;
}

export function PlatformLogo({ id, boyut = 16 }: { id: Platform; boyut?: number }) {
  const p = platformBul(id);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={p.logo} alt={p.ad} title={p.ad} width={boyut} height={boyut} className={cn("shrink-0", p.ters && "invert")} style={{ width: boyut, height: boyut }} />;
}

/* ── Durum ── */
export const DURUM: Record<GonderiDurum, { ad: string; sinif: string }> = {
  inceleme: { ad: "İncelemede", sinif: "bg-amber-400/12 text-amber-200 ring-amber-300/20" },
  kazaniyor: { ad: "Kazanıyor", sinif: "bg-vurgu/15 text-vurgu ring-vurgu/25" },
  bekleme: { ad: "Beklemede", sinif: "bg-white/[0.07] text-white/80 ring-white/10" },
  cekilebilir: { ad: "Çekilebilir", sinif: "bg-emerald-400/12 text-emerald-300 ring-emerald-300/20" },
  reddedildi: { ad: "Reddedildi", sinif: "bg-rose-500/12 text-rose-300 ring-rose-400/20" },
  degerlendirme: { ad: "Jüride", sinif: "bg-violet-400/12 text-violet-200 ring-violet-300/20" },
  sonuclandi: { ad: "Sonuçlandı", sinif: "bg-white/[0.07] text-metin-2 ring-white/10" },
};
export function DurumRozet({ durum }: { durum: GonderiDurum }) {
  const d = DURUM[durum];
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium ring-1 ring-inset", d.sinif)}>{d.ad}</span>;
}

/** Gönderi zaman çizelgesi: Gönderildi → İnceleme → Kazanma → Bekleme → Çekilebilir. */
export function DurumCizelgesi({ durum, tur, ilerleme }: { durum: GonderiDurum; tur: Kampanya["tur"]; ilerleme: number }) {
  const asamalar = tur === "goruntulenme"
    ? [{ id: "inceleme", ad: "İnceleme", sure: `${KURALLAR.incelemeSaat} sa` }, { id: "kazaniyor", ad: "Kazanma", sure: `${KURALLAR.kazanmaGun} gün` }, { id: "bekleme", ad: "Bekleme", sure: `${KURALLAR.beklemeGun} gün` }, { id: "cekilebilir", ad: "Çekilebilir", sure: "" }]
    : tur === "gorev"
      ? [{ id: "inceleme", ad: "İnceleme", sure: `${KURALLAR.incelemeSaat} sa` }, { id: "bekleme", ad: "Bekleme", sure: `${KURALLAR.beklemeGun} gün` }, { id: "cekilebilir", ad: "Çekilebilir", sure: "" }]
      : [{ id: "degerlendirme", ad: "Jüri", sure: "" }, { id: "bekleme", ad: "Bekleme", sure: `${KURALLAR.beklemeGun} gün` }, { id: "cekilebilir", ad: "Çekilebilir", sure: "" }];
  const aktif = asamalar.findIndex((a) => a.id === durum);
  return (
    <ol className="flex w-full items-start">
      {asamalar.map((a, i) => {
        const bitti = durum === "cekilebilir" ? true : i < aktif;
        const simdi = i === aktif && durum !== "cekilebilir";
        return (
          <li key={a.id} className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center">
              <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                bitti ? "bg-vurgu text-vurgu-ust" : simdi ? "bg-vurgu/20 text-vurgu ring-2 ring-vurgu/60" : "bg-white/[0.07] text-metin-2")}>
                {bitti ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
              </span>
              {i < asamalar.length - 1 && (
                <span className="relative mx-1.5 h-[3px] flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                  <span className="absolute inset-y-0 left-0 rounded-full bg-vurgu" style={{ width: bitti ? "100%" : simdi ? `${Math.round(ilerleme * 100)}%` : "0%" }} />
                </span>
              )}
            </div>
            <span className={cn("mt-1.5 truncate pr-2 text-[11px]", simdi ? "font-medium text-white" : bitti ? "text-metin-2" : "text-metin-2")}>{a.ad}{a.sure && <span className="hidden sm:inline"> · {a.sure}</span>}</span>
          </li>
        );
      })}
    </ol>
  );
}

/* ── Kampanya kartı (dikey, hover'da video) ── */
export const odulMetni = (k: Kampanya): [string, string] =>
  k.tur === "goruntulenme" ? [tl(k.oran!), "/ 1B görüntülenme"] : k.tur === "gorev" ? [tl(k.odul!), "/ teslim"] : [tl(k.havuz!), "ödül havuzu"];

export function KampanyaKarti({ k, katildi, simdi, raf }: { k: Kampanya; katildi?: boolean; simdi: number; raf?: boolean }) {
  const bitti = bittiMi(k, simdi);
  const gonderiler = useEarn((s) => s.gonderiler);
  const kota = kampanyaHakki(k, gonderiler).kotaKalan;
  const oranButce = k.butce ? Math.min(1, (k.odenen ?? 0) / k.butce) : 0;
  const [ust, setUst] = useState(false);
  const [odul, birim] = odulMetni(k);
  return (
    <motion.div whileTap={{ scale: 0.98 }} className={cn(raf && "w-[220px] shrink-0 sm:w-[236px]")}>
      <Link href={`/earn/kampanyalar/${k.id}`} onMouseEnter={() => setUst(true)} onMouseLeave={() => setUst(false)} onFocus={() => setUst(true)} onBlur={() => setUst(false)}
        className={cn("group relative block aspect-[9/14] overflow-hidden rounded-[20px] bg-white/[0.03] ring-1 ring-white/[0.08] transition-[box-shadow] hover:ring-white/[0.2]", bitti && "opacity-60")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={k.kapak} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
        {k.video && ust && !bitti && <video src={k.video} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <span className="flex gap-1.5">
            <span className="rounded-full bg-black/55 px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur">{TUR_AD[k.tur]}</span>
            {katildi && <span className="rounded-full bg-vurgu px-2.5 py-1 text-[11.5px] font-medium text-vurgu-ust">Katıldın</span>}
          </span>
          <span className="flex gap-1 rounded-full bg-black/55 px-2 py-1 backdrop-blur">{k.platformlar.map((p) => <PlatformLogo key={p} id={p} boyut={13} />)}</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-[24px] font-semibold leading-none tracking-[-0.02em] text-white">{odul}<span className="ml-1 text-[12px] font-normal text-white/70">{birim}</span></p>
          <p className="mt-2 line-clamp-2 text-[14px] font-medium leading-snug text-white">{k.ad}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-white/70">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{kalanGun(k.bitis, simdi)}</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{kisaSayi(k.katilimci)}</span>
            {k.tur === "gorev" && !bitti && <span>{kota}/{k.kota} yer</span>}
          </p>
          {k.butce ? (
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15" title={`${tl(k.butce - (k.odenen ?? 0))} bütçe kaldı`}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${oranButce * 100}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full rounded-full bg-vurgu" />
            </div>
          ) : k.dereceler ? (
            <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-white/80"><Trophy className="h-3.5 w-3.5 text-amber-300" />1. {tl(k.dereceler[0])} · ilk {k.dereceler.length} ödüllü</p>
          ) : null}
        </div>
      </Link>
    </motion.div>
  );
}

/** Mekanizma: Vayra'da üretilen video paylaşılır → görüntülenme artar → kazanç sayar. */
export function NasilKazanilir({ adimlar }: { adimlar: { ad: string; alt: string; tamam?: boolean; href?: string }[] }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-px overflow-hidden rounded-[22px] bg-white/[0.06] ring-1 ring-white/[0.08] md:grid-cols-[1.1fr_1fr]">
      <div className="flex items-center justify-center gap-4 bg-[#0d0e10] px-5 py-7 sm:gap-6">
        <div className="relative aspect-[9/16] w-[118px] shrink-0 overflow-hidden rounded-[20px] ring-1 ring-white/15 sm:w-[140px]">
          <video src={ORTAK_HERO.video} poster={ORTAK_HERO.poster} autoPlay muted loop playsInline className="h-full w-full object-cover" />
          <div className="absolute inset-x-1.5 bottom-1.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10.5px] text-white backdrop-blur">
            <PlatformLogo id="tiktok" boyut={10} /><span>@sen</span><Eye className="ml-auto h-3 w-3" /><Sayac hedef={48200} sure={2600} bicim={(n) => kisaSayi(Math.round(n))} />
          </div>
        </div>
        <svg width="56" height="10" aria-hidden className="hidden shrink-0 sm:block"><motion.line x1="0" y1="5" x2="56" y2="5" stroke="var(--vurgu-renk)" strokeWidth="2" strokeDasharray="4 6" animate={{ strokeDashoffset: [0, -20] }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} /></svg>
        <div className="rounded-[18px] bg-white/[0.04] p-4 ring-1 ring-white/[0.1]">
          <p className="text-[12.5px] text-metin-2">Bu gönderiden</p>
          <p className="mt-1 text-[24px] font-semibold tabular-nums tracking-[-0.02em] text-white sm:text-[28px]"><Sayac hedef={2892} sure={2600} bicim={(n) => tl(Math.round(n))} /></p>
          <p className="mt-1.5 text-[12px] text-vurgu">24. saat bonusu +%{Math.round(KURALLAR.bonus24 * 100)}</p>
          <p className="mt-0.5 text-[11.5px] text-metin-2">Örnek hesap</p>
        </div>
      </div>
      <ol className="bg-[#0d0e10] p-5 sm:p-7">
        {adimlar.map((a, i) => {
          const ic = (
            <>
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12.5px] font-semibold", a.tamam ? "bg-vurgu text-vurgu-ust" : "text-white ring-1 ring-white/[0.14]")}>
                {a.tamam ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[14.5px] font-medium", a.tamam ? "text-metin-2 line-through decoration-white/25" : "text-white")}>{a.ad}</span>
                <span className="block text-[13px] text-metin-2">{a.alt}</span>
              </span>
              {a.href && !a.tamam && <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-metin-2 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />}
            </>
          );
          return (
            <motion.li key={a.ad} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
              {a.href ? <Link href={a.href} className="group -mx-2 flex gap-3 rounded-[14px] px-2 py-2.5 transition-colors hover:bg-white/[0.03]">{ic}</Link> : <div className="flex gap-3 py-2.5">{ic}</div>}
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

/* ── Gönderi satırı ── */
export function GonderiSatiri({ g, simdi, bonus = 0, kompakt }: { g: Gonderi; simdi: number; bonus?: number; kompakt?: boolean }) {
  const h = gonderiHesap(g, simdi, bonus);
  const k = h.kampanya;
  if (!k) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="min-w-0 rounded-[18px] bg-white/[0.025] p-4 ring-1 ring-white/[0.08]">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={g.uretimGorsel ?? g.kontrol?.kucukResim ?? k.kapak} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/earn/kampanyalar/${k.id}`} className="truncate text-[14px] font-semibold text-white hover:underline">{k.ad}</Link>
            <DurumRozet durum={h.durum} />
          </div>
          <p className="mt-1 flex items-center gap-2 text-[12px] text-metin-2">
            <PlatformLogo id={g.platform} boyut={12} />
            <a href={g.link} target="_blank" rel="noopener noreferrer" className="truncate hover:text-white">{g.link.replace(/^https?:\/\//, "")}</a>
          </p>
        </div>
        <div className="shrink-0 text-right">
          {h.durum === "inceleme" || h.durum === "degerlendirme" || h.durum === "sonuclandi" ? (
            <>
              <p className="text-[17px] font-semibold text-metin-2">—</p>
              <p className="text-[11.5px] text-metin-2">{k.tur === "goruntulenme" ? `Onayda ${tl(k.sabitOdeme ?? 0)}` : k.tur === "gorev" ? `Onayda ${tl(k.odul ?? 0)}` : h.durum === "sonuclandi" ? "Ödül yok" : "Sonuç bekleniyor"}</p>
            </>
          ) : <p className={cn("text-[17px] font-semibold tabular-nums", h.durum === "reddedildi" ? "text-metin-2 line-through" : "text-white")}>{tl(h.kazanc, true)}</p>}
          {k.tur === "goruntulenme" && h.durum !== "inceleme" && h.durum !== "reddedildi" && (
            <p className="flex items-center justify-end gap-1 text-[11.5px] tabular-nums text-metin-2" title={h.gercekVeri ? "Platformdan okunan görüntülenme" : "Tahmini görüntülenme"}><Eye className="h-3 w-3" />{h.gercekVeri ? "" : "tahmini "}{kisaSayi(h.goruntulenme)}</p>
          )}
          {k.tur === "yarisma" && g.derece && h.durum !== "degerlendirme" && <p className="text-[11.5px] text-amber-300">{g.derece}. sıra</p>}
        </div>
      </div>
      {!kompakt && h.durum !== "reddedildi" && h.durum !== "sonuclandi" && <div className="mt-4"><DurumCizelgesi durum={h.durum} tur={k.tur} ilerleme={h.ilerleme} /></div>}
      {!kompakt && h.durum === "kazaniyor" && (
        <p className="mt-3 text-[12px] text-metin-2">
          Sabit {tl(h.sabit)} · görüntülenme {tl((h.goruntulenme / 1000) * (k.oran ?? 0), true)}{h.bonus24 > 0 && <> · 24. saat bonusu {tl(h.bonus24, true)}</>}
          <span className="text-metin-2"> · 7. gün bonusu ve kesin tutar kazanma süresi bitince eklenir</span>
          <span className="mt-1 block text-[11.5px] text-metin-2">
            {h.gercekVeri && g.istatistik
              ? <>Görüntülenme platformdan okunuyor · son güncelleme {new Date(g.istatistik.zaman).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</>
              : <>Görüntülenme tahminidir; platform API&apos;si bağlandığında gerçek veriyle güncellenir.</>}
          </span>
        </p>
      )}
      {!kompakt && h.durum === "inceleme" && g.kontrol?.sahibiMi === null && (
        <p className="mt-3 text-[12px] text-metin-2">Platform gönderi sahibini bildirmediği için sahiplik incelemede elle kontrol edilecek.</p>
      )}
      {h.durum === "sonuclandi" && <p className="mt-3 text-[12px] text-metin-2">Yarışma sonuçlandı; bu başvuru ödül sıralamasına giremedi. Katılımın için teşekkürler.</p>}
      {h.minAltinda && <p className="mt-3 text-[12px] text-amber-200">Gönderi minimum ödemeye ({tl(k.minOdeme ?? 0)}) ulaşmadı; ödeme yapılmaz.</p>}
      {h.durum === "reddedildi" && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-rose-500/[0.06] px-3 py-2.5 text-[12.5px] text-rose-200">
          <span className="flex items-start gap-1.5"><X className="mt-0.5 h-3.5 w-3.5 shrink-0" />{g.red}</span>
          <ItirazButonu g={g} />
        </div>
      )}
      {g.itiraz === "inceleniyor" && <p className="mt-3 text-[12px] text-amber-200">İtirazın inceleniyor. Sonuç 48 saat içinde bildirilecek.</p>}
    </motion.div>
  );
}

function ItirazButonu({ g }: { g: Gonderi }) {
  const itirazEt = useEarn((s) => s.itirazEt);
  if (g.itiraz) return <span className="text-[12px] text-metin-2">İtiraz hakkın kullanıldı</span>;
  return (
    <button onClick={() => { itirazEt(g.id); toast.success("İtiraz gönderildi", { description: "Gönderin yeniden incelenecek." }); }}
      className="rounded-full px-3 py-1 text-[12px] font-medium text-rose-100 ring-1 ring-rose-300/30 transition hover:bg-rose-500/15 active:scale-[0.97]">İtiraz et (1 hak)</button>
  );
}

/* ── Günlük kazanç grafiği (çubuk) ── */
export function KazancGrafigi({ veri, etiketler }: { veri: number[]; etiketler: string[] }) {
  const max = Math.max(1, ...veri);
  const [uzerinde, setUzerinde] = useState<number | null>(null);
  return (
    <div>
      <div className="flex h-44 items-end gap-[3px]" onMouseLeave={() => setUzerinde(null)}>
        {veri.map((v, i) => (
          <div key={i} className="group relative flex h-full flex-1 items-end" onMouseEnter={() => setUzerinde(i)}>
            <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(2, (v / max) * 100)}%` }} transition={{ duration: 0.5, delay: i * 0.01 }}
              className={cn("w-full rounded-t-[4px]", uzerinde === i ? "bg-vurgu" : v > 0 ? "bg-vurgu/45" : "bg-white/[0.06]")} />
            {uzerinde === i && (
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-[10px] bg-[#1c1d20] px-2.5 py-1.5 text-[12px] text-white ring-1 ring-white/[0.12]">
                {etiketler[i]} · {tl(v, true)}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-metin-2"><span>{etiketler[0]}</span><span>{etiketler[Math.floor(etiketler.length / 2)]}</span><span>Bugün</span></div>
    </div>
  );
}

export function KilitliBolum({ baslik, children }: { baslik: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] bg-white/[0.025] px-4 py-4 ring-1 ring-white/[0.08]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]"><Lock className="h-4 w-4 text-metin-2" /></span>
      <span className="min-w-0 flex-1"><span className="block text-[14px] font-medium text-white">{baslik}</span><span className="block text-[12.5px] text-metin-2">Kampanyaya katılınca açılır.</span></span>
      {children}
    </div>
  );
}

export function TumuLink({ href, children = "Tümü" }: { href: string; children?: React.ReactNode }) {
  return <Link href={href} className="group flex items-center gap-1 text-[13px] font-medium text-metin-2 hover:text-white">{children}<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></Link>;
}
