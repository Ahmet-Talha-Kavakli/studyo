"use client";

/**
 * /panel/kredi?sekme=kredi — "C · Videolu + alt çubuk" (2026-10-28 kullanıcı seçimi).
 *
 * Altı paket kartı (yandan görünen para yığınları, fiyat sayfasıyla aynı dil) + özel
 * miktar kaydırıcısı + öneri kartları; seçim ekranın altında yapışık ödeme çubuğunda
 * özetlenir. Satın alma demo: bakiyeye eklenir, faturaya ve bildirimlere yazılır.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Infinity as Sonsuz, Lock, RefreshCw, SlidersHorizontal, Zap } from "lucide-react";
import { KrediJeton } from "@/components/ui/KrediHap";
import { Yigin } from "@/components/fiyat/Vitrin";
import { useAuth } from "@/store/useAuth";
import { hareketYaz } from "@/store/useHesap";
import { useTercih } from "@/store/useTercih";
import { hesapBildirimi } from "@/lib/bildirimler";
import { toast } from "@/lib/toast";
import { KREDI_PAKETLERI, SINIRSIZ_TEKLIFLER, krediBasina, planBul, sayi, sinirsizFiyat, tl, tlKurus } from "@/lib/fiyat";
import type { KrediSekme } from "@/store/useKrediModal";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
const KDV = 0.2;
const VH = "/gercek/video-hareket/";
const OZEL_MIN = 100, OZEL_MAX = 25000;
const taban = krediBasina(KREDI_PAKETLERI[0].fiyat, KREDI_PAKETLERI[0].kredi);
const avantaj = (i: number) => Math.round((1 - krediBasina(KREDI_PAKETLERI[i].fiyat, KREDI_PAKETLERI[i].kredi) / taban) * 100);
const karsilik = (k: number) => ({ gorsel: Math.floor(k / 5), video: Math.floor(k / 42) });
/** Özel miktar: miktara eşit ya da altındaki en büyük paketin kredi başı fiyatı. */
function ozelFiyat(kredi: number) {
  const kademe = [...KREDI_PAKETLERI].reverse().find((p) => p.kredi <= kredi) ?? KREDI_PAKETLERI[0];
  return Math.round(kredi * krediBasina(kademe.fiyat, kademe.kredi));
}
/** Kaydırıcı logaritmik: 100 → 25.000 arasında küçük miktarlar da rahat seçilsin. */
const kaydirDeger = (t: number) => Math.round((OZEL_MIN * Math.pow(OZEL_MAX / OZEL_MIN, t)) / 50) * 50;
const kaydirKonum = (k: number) => Math.log(k / OZEL_MIN) / Math.log(OZEL_MAX / OZEL_MIN);

/* ── Paket kartı ── */
function PaketKarti({ i, secili, onSec }: { i: number; secili: boolean; onSec: () => void }) {
  const [ust, setUst] = useState(false);
  const p = KREDI_PAKETLERI[i];
  const pop = !!p.populer;
  const c = karsilik(p.kredi);
  const ind = avantaj(i);
  const govde = (
    <button onClick={onSec} onMouseEnter={() => setUst(true)} onMouseLeave={() => setUst(false)} role="radio" aria-checked={secili}
      aria-label={`${sayi(p.kredi)} kredi, ${tl(p.fiyat)}`}
      className={cn("flex h-full w-full flex-col items-center rounded-[23px] px-3.5 pb-4 pt-3.5 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#55d6fd]/60",
        secili ? "bg-[linear-gradient(180deg,#0f2129_0%,#0e1417_65%)]" : "bg-[linear-gradient(180deg,#151519_0%,#101012_60%)]")}>
      <span className="flex w-full items-center justify-between">
        <span className={cn("flex h-5 w-5 items-center justify-center rounded-full transition-[background-color,box-shadow]", secili ? "bg-[#55d6fd] text-[#06222c]" : "shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.2)]")}>
          <AnimatePresence>{secili && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check className="h-3 w-3" strokeWidth={3} /></motion.span>}</AnimatePresence>
        </span>
        <span className={cn("h-[22px] whitespace-nowrap rounded-full px-2.5 text-[11px] font-semibold leading-[22px]", pop ? "rgb-rozet text-white" : ind > 0 ? "bg-white/[0.07] text-white/70" : "invisible")}>
          {pop ? "En çok alınan" : `%${ind} avantaj`}
        </span>
      </span>
      <div className="-mt-1 w-full origin-bottom scale-[0.86]"><Yigin i={i} ust={ust || secili} /></div>
      <p className="mt-2 flex items-baseline gap-1"><span className="text-[26px] font-semibold leading-none tracking-[-0.035em] text-white tabular-nums">{sayi(p.kredi)}</span><span className="text-[12.5px] text-white/45">kredi</span></p>
      <p className="mt-1.5 flex flex-wrap justify-center gap-x-1.5 text-[12px] tabular-nums text-white/45"><span className="whitespace-nowrap">{sayi(c.gorsel)} görsel</span><span className="whitespace-nowrap">{sayi(c.video)} video</span></p>
      <p className="mt-auto pt-4 text-[18px] font-semibold tabular-nums text-white">{tl(p.fiyat)}</p>
      <p className="text-[11.5px] tabular-nums text-white/35">{tlKurus(krediBasina(p.fiyat, p.kredi))} / kredi</p>
    </button>
  );
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.45, ease: EASE }} whileHover={{ y: -3 }} className="h-full">
      {pop ? (
        <div className="relative h-full">
          <span aria-hidden className={cn("rgb-cerceve rgb-hale pointer-events-none absolute -inset-[3px] rounded-[27px] transition-opacity", secili ? "opacity-60" : "opacity-30")} />
          <div className="rgb-cerceve relative h-full rounded-[24px] p-[1.5px]">{govde}</div>
        </div>
      ) : (
        <div className={cn("h-full rounded-[24px] p-[1.5px] transition-colors", secili ? "bg-[#55d6fd]" : "bg-white/[0.08] hover:bg-white/[0.16]")}>{govde}</div>
      )}
    </motion.div>
  );
}

/* ── Özel miktar ── */
function OzelMiktar({ secili, kredi, setKredi, onSec }: { secili: boolean; kredi: number; setKredi: (n: number) => void; onSec: () => void }) {
  const t = kaydirKonum(kredi);
  return (
    <div onClick={onSec} className={cn("rounded-[24px] p-[1.5px] transition-colors", secili ? "bg-[#55d6fd]" : "bg-white/[0.08] hover:bg-white/[0.14]")}>
      <div className={cn("flex flex-col gap-5 rounded-[23px] p-5 sm:flex-row sm:items-center sm:gap-8", secili ? "bg-[linear-gradient(180deg,#0f2129,#0e1417)]" : "bg-[#121214]")}>
        <div className="flex items-center gap-3 sm:w-[220px]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-white/[0.06]"><SlidersHorizontal className="h-5 w-5 text-white/75" /></span>
          <span><span className="block text-[15px] font-semibold text-white">Özel miktar</span><span className="block text-[12.5px] text-white/45">100 – 25.000 kredi arası</span></span>
        </div>
        <div className="flex-1">
          <input type="range" min={0} max={1000} value={Math.round(t * 1000)} aria-label="Özel kredi miktarı"
            onChange={(e) => { setKredi(kaydirDeger(+e.target.value / 1000)); onSec(); }}
            className="fiyat-kaydir w-full" style={{ ["--y" as string]: `${t * 100}%` }} />
          <div className="mt-2 flex justify-between text-[11.5px] tabular-nums text-white/35"><span>100</span><span>1.000</span><span>5.000</span><span>25.000</span></div>
        </div>
        <div className="flex items-baseline justify-between gap-6 sm:block sm:w-[150px] sm:text-right">
          <p className="flex items-center gap-1.5 text-[22px] font-semibold tabular-nums text-white sm:justify-end"><KrediJeton boyut={15} className="kredi-isilti-yildiz" />{sayi(kredi)}</p>
          <p className="text-[13px] tabular-nums text-white/55">{tl(ozelFiyat(kredi))} · {tlKurus(ozelFiyat(kredi) / kredi)}/kredi</p>
        </div>
      </div>
    </div>
  );
}

/* ── Ana bileşen ── */
export function KrediYukle({ onSekme }: { onSekme: (s: KrediSekme) => void }) {
  const kullanici = useAuth((s) => s.kullanici);
  const ekKrediEkle = useAuth((s) => s.ekKrediEkle);
  const oto = useTercih((s) => s.otomatikYukleme);
  const otoToggle = useTercih((s) => s.otomatikYuklemeToggle);
  const [secili, setSecili] = useState<number | "ozel">(KREDI_PAKETLERI.findIndex((p) => p.populer));
  const [ozel, setOzel] = useState(3000);
  const [isliyor, setIsliyor] = useState(false);

  // /fiyatlandirma'dan ?paket=<sıra> ile gelinirse o paket seçili açılır.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const i = Number(q.get("paket"));
    if (q.has("paket") && Number.isInteger(i) && i >= 0 && i < KREDI_PAKETLERI.length) setSecili(i);
  }, []);

  const kredi = secili === "ozel" ? ozel : KREDI_PAKETLERI[secili].kredi;
  const araToplam = secili === "ozel" ? ozelFiyat(ozel) : KREDI_PAKETLERI[secili].fiyat;
  const kdv = Math.round(araToplam * KDV);
  const bakiye = kullanici?.krediler ?? 0;
  const arti = planBul("arti")!;
  const artiFark = Math.round((1 - krediBasina(arti.fiyatTRY * 0.8, arti.kredi) / krediBasina(araToplam, kredi)) * 100);
  const enUcuzSinirsiz = useMemo(() => Math.min(...SINIRSIZ_TEKLIFLER.map((t) => sinirsizFiyat(t, 0, 0))), []);

  const satinAl = () => {
    if (!kullanici) return toast.error("Önce giriş yap", { description: "Kredi yüklemek için hesabınla giriş yapman gerekiyor." });
    setIsliyor(true);
    setTimeout(() => {
      ekKrediEkle(kredi);
      hareketYaz({ tur: "kredi", aciklama: `${sayi(kredi)} kredi paketi`, kredi, tutar: araToplam, kdv, belge: true });
      hesapBildirimi(`${sayi(kredi)} kredi yüklendi`, `Demo satın alma (${tl(araToplam + kdv)}), gerçek ödeme alınmadı. Yeni bakiyen ${sayi(bakiye + kredi)} kredi.`, { ad: "Faturaları gör", link: "/panel/ayarlar/faturalar" });
      toast.success(`${sayi(kredi)} kredi yüklendi`, { description: `${tl(araToplam + kdv)} · Gerçek ödeme alınmadı.` });
      setIsliyor(false);
    }, 700);
  };

  return (
    <div>
      <div role="radiogroup" aria-label="Kredi paketi" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {KREDI_PAKETLERI.map((_, i) => <PaketKarti key={i} i={i} secili={secili === i} onSec={() => setSecili(i)} />)}
      </div>
      <div className="mt-3"><OzelMiktar secili={secili === "ozel"} kredi={ozel} setKredi={setOzel} onSec={() => setSecili("ozel")} /></div>

      {/* Öneriler + otomatik yükleme */}
      <div className="mt-8 grid gap-3 lg:grid-cols-3">
        <button onClick={() => onSekme("plan")} className="group relative isolate flex min-h-[150px] flex-col justify-end overflow-hidden rounded-[24px] p-5 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
          <video src={`${VH}drone-orbit.mp4`} poster={`${VH}drone-orbit-poster.webp`} autoPlay muted loop playsInline className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <span className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#55d6fd]"><Zap className="h-3.5 w-3.5 fill-current" />Her ay mı alıyorsun?</span>
          <span className="mt-1 flex items-center justify-between gap-3 text-[16px] font-semibold text-white">
            {artiFark > 0 ? `Artı planında kredi %${artiFark} daha ucuz` : "Artı planı ile her ay 1.000 kredi"}<ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
          </span>
        </button>
        <button onClick={() => onSekme("sinirsiz")} className="group relative isolate flex min-h-[150px] flex-col justify-end overflow-hidden rounded-[24px] p-5 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
          <video src={`${VH}effects.mp4`} poster={`${VH}effects-poster.webp`} autoPlay muted loop playsInline className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <span className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#55d6fd]"><Sonsuz className="h-4 w-4" />Sınırsız erişim</span>
          <span className="mt-1 flex items-center justify-between gap-3 text-[16px] font-semibold text-white">Kredi saymadan üret, günde {tl(enUcuzSinirsiz)}&apos;den<ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" /></span>
        </button>
        <div className="flex flex-col justify-between rounded-[24px] bg-[#111113] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.06]"><RefreshCw className="h-[18px] w-[18px] text-white/75" /></span>
            <span className="flex-1">
              <span className="block text-[15px] font-semibold text-white">Otomatik yükleme</span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-white/50">{oto ? `Bakiye 100'ün altına inince ${sayi(useTercih.getState().otoPaket)} kredi yüklenir.` : "Kapalı: bakiye bitince üretim durur."}</span>
            </span>
            <button role="switch" aria-checked={oto} aria-label="Otomatik yükleme" onClick={() => { const y = otoToggle(); toast.success(y ? "Otomatik yükleme açıldı" : "Otomatik yükleme kapatıldı"); }}
              className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", oto ? "bg-[#55d6fd]" : "bg-white/15")}>
              <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 35 }} className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white", oto ? "right-0.5" : "left-0.5")} />
            </button>
          </div>
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-white/50">
            {["Süresi dolmaz", "Anında yüklenir", "14 gün iade"].map((x) => <span key={x} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#55d6fd]" strokeWidth={2.6} />{x}</span>)}
          </p>
        </div>
      </div>

      {/* Yapışık ödeme çubuğu */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-40 flex justify-center px-3 sm:bottom-6">
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.2 }}
          className="pointer-events-auto relative w-full max-w-[820px]">
          <span aria-hidden className="rgb-cerceve rgb-hale pointer-events-none absolute -inset-[2px] rounded-[26px] opacity-25" />
          <div className="bd-panel relative flex items-center gap-3 rounded-[24px] p-2.5 pl-3 sm:gap-4 sm:pl-4">
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#16384c] to-[#0c1520] shadow-[inset_0_0_0_1px_rgba(85,214,253,0.35)] sm:flex">
              <KrediJeton boyut={20} className="kredi-isilti-yildiz" />
            </span>
            <span className="min-w-0 flex-1">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={kredi} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                  className="block text-[16px] font-semibold tabular-nums text-white">{sayi(kredi)} kredi</motion.span>
              </AnimatePresence>
              <span className="block truncate text-[12.5px] tabular-nums text-white/50">
                Yükleme sonrası bakiyen <b className="font-semibold text-white">{sayi(bakiye + kredi)}</b> kredi<span className="hidden sm:inline"> · {tl(kdv)} KDV dahil</span>
              </span>
            </span>
            <span className="hidden items-center gap-1.5 text-[12px] text-white/35 md:flex"><Lock className="h-3.5 w-3.5" />Test ödemesi</span>
            <button onClick={satinAl} disabled={isliyor}
              className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-[14.5px] font-semibold text-[#0b0b0d] transition-[background-color,transform] hover:bg-white/90 active:scale-[0.97] disabled:opacity-70">
              {isliyor ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0b0b0d]/25 border-t-[#0b0b0d]" /> : null}
              {tl(araToplam + kdv)} öde{!isliyor && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </motion.div>
      </div>
      <p className="mt-6 text-[12.5px] text-white/40">Tek seferlik krediler anında yüklenir ve süresi dolmaz. Önce plan kredin, sonra yüklediğin kredi harcanır. <Link href="/fiyatlandirma#neye-yeter" className="text-white/65 underline decoration-white/20 underline-offset-2 hover:text-white">Modellerin kredi maliyetleri</Link></p>
    </div>
  );
}
