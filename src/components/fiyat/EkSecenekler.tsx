"use client";

import { useState } from "react";
import { hareketYaz } from "@/store/useHesap";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, AudioLines, Box, Building2, Check, Clapperboard, ImageIcon, Infinity as InfinityIcon, Music, RefreshCw, ShieldCheck, Zap, type LucideIcon,
} from "lucide-react";
import {
  KREDI_PAKETLERI, ORNEK_MALIYET, aylikFiyat, krediBasina, planBul, sayi, tl, tlKurus, type Paket,
} from "@/lib/fiyat";
import { METIN_RENK, type RenkTuru } from "@/lib/renk";
import { useAuth } from "@/store/useAuth";
import { useTercih } from "@/store/useTercih";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { FiyatModu } from "./Planlar";

/* ── Kredi paketleri ──
   Üstte paket kartları (tek seçim, ok tuşlarıyla gezilir). Altta seçilen paketin
   neye yettiği (gerçek örnek kareler ve tür renkleriyle) ve sipariş özeti:
   birim fiyat, tasarruf, KDV, toplam ve aynı krediye planla ne ödenirdi. */
const YETER_SATIR: { id: keyof typeof ORNEK_MALIYET; ikon: LucideIcon; renk: RenkTuru; birim: string; tur: string; kapak: string }[] = [
  { id: "gorsel", ikon: ImageIcon, renk: "gorsel", birim: "görsel", tur: "Görsel", kapak: "/gercek/arac/gorsel-ilham-portre.webp" },
  { id: "video", ikon: Clapperboard, renk: "video", birim: "video", tur: "Video", kapak: "/gercek/arac/ovl-veo-31-drone-orbit.webp" },
  { id: "ses", ikon: AudioLines, renk: "ses", birim: "seslendirme", tur: "Ses", kapak: "/gercek/kesfet/elevenlabsses.webp" },
  { id: "muzik", ikon: Music, renk: "muzik", birim: "şarkı", tur: "Müzik", kapak: "/gercek/muzik/ms-neon.webp" },
  { id: "uc", ikon: Box, renk: "3d", birim: "3D model", tur: "3D", kapak: "/gercek/arac/3d-ilham-render.webp" },
];
const KDV = 0.2;

export function KrediPaketleri({ mod }: { mod: FiyatModu }) {
  const ekKrediEkle = useAuth((s) => s.ekKrediEkle);
  const [secili, setSecili] = useState(() => KREDI_PAKETLERI.findIndex((p) => p.populer));
  const p = KREDI_PAKETLERI[secili];
  const ilk = KREDI_PAKETLERI[0];
  const taban = krediBasina(ilk.fiyat, ilk.kredi);
  const birim = krediBasina(p.fiyat, p.kredi);
  const tasarruf = (x: Paket) => Math.round((1 - krediBasina(x.fiyat, x.kredi) / taban) * 100);
  const tasarrufTl = Math.round(taban * p.kredi - p.fiyat);
  const kdv = Math.round(p.fiyat * KDV);

  // Aynı krediye en uygun planla (yıllık) ödenecek birim fiyat.
  const arti = planBul("arti")!;
  const planBirim = aylikFiyat(arti, "yillik") / arti.kredi;
  const planIleUcuz = Math.round((1 - planBirim / birim) * 100);

  const satinAl = () => {
    ekKrediEkle(p.kredi);
    hareketYaz({ tur: "kredi", aciklama: `${sayi(p.kredi)} kredi paketi`, kredi: p.kredi, tutar: p.fiyat, kdv, belge: true });
    toast.success(`${sayi(p.kredi)} kredi eklendi`, { description: `${tl(p.fiyat)} · Gerçek ödeme alınmadı.` });
  };
  const kaydir = (yon: 1 | -1) => setSecili((i) => {
    const y = Math.min(KREDI_PAKETLERI.length - 1, Math.max(0, i + yon));
    requestAnimationFrame(() => document.getElementById(`kredi-paket-${y}`)?.focus());
    return y;
  });
  const eylemSinif = "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-[14.5px] font-semibold text-zemin transition-opacity hover:opacity-90";

  return (
    <div className="space-y-3">
      {/* Paket kartları */}
      <div role="radiogroup" aria-label="Kredi paketi" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6"
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); kaydir(1); }
          if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); kaydir(-1); }
        }}>
        {KREDI_PAKETLERI.map((x, i) => {
          const aktif = i === secili;
          const t = tasarruf(x);
          return (
            <button key={x.kredi} id={`kredi-paket-${i}`} role="radio" aria-checked={aktif} tabIndex={aktif ? 0 : -1} onClick={() => setSecili(i)}
              className={cn("group relative flex flex-col rounded-[20px] border p-4 text-left transition-colors sm:p-5",
                aktif ? "border-vurgu bg-[color-mix(in_oklab,var(--vurgu-renk)_14%,#111113)]" : "border-white/[0.07] bg-yuzey hover:border-white/20")}>
              <span className="flex h-6 items-center justify-between gap-2">
                <span className={cn("flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors", aktif ? "border-vurgu bg-vurgu" : "border-white/25 group-hover:border-white/40")}>
                  {aktif && <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />}
                </span>
                {x.populer
                  ? <span className="rounded-full bg-vurgu px-2 py-0.5 text-[10.5px] font-semibold text-vurgu-ust">En çok alınan</span>
                  : t > 0 && <span className="rounded-full bg-tur-3d/12 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-tur-3d">%{t} tasarruf</span>}
              </span>
              {/* Paket büyüklüğü: üst üste kredi katmanları */}
              <span aria-hidden className="mt-5 flex h-[30px] flex-col-reverse gap-[3px]">
                {Array.from({ length: i + 1 }, (_, j) => (
                  <span key={j} className={cn("h-[2px] rounded-full transition-colors", aktif ? "bg-vurgu" : "bg-white/20")} style={{ width: `${44 + j * 9}%`, opacity: 1 - j * 0.1 }} />
                ))}
              </span>
              <span className="mt-3 block text-[28px] font-semibold leading-none tabular-nums tracking-[-0.03em] text-white sm:text-[30px]">{sayi(x.kredi)}</span>
              <span className="mt-1 block text-[12.5px] text-metin-3">kredi</span>
              <span className="mt-4 flex items-baseline justify-between gap-2 border-t border-white/[0.07] pt-3">
                <span className="text-[16px] font-semibold tabular-nums text-white">{tl(x.fiyat)}</span>
                <span className="text-[11.5px] tabular-nums text-metin-3">{tlKurus(krediBasina(x.fiyat, x.kredi))}/kr</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        {/* Bu krediyle */}
        <div className="flex flex-col rounded-[24px] border border-white/[0.07] bg-yuzey p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[16px] font-semibold text-white">{sayi(p.kredi)} krediyle üretebileceklerin</p>
            <p className="text-[12.5px] text-metin-3">Her biri tek başına; krediyi istediğin modelde harcarsın.</p>
          </div>
          <div className="mt-5 grid flex-1 grid-cols-2 gap-2.5 sm:grid-cols-5">
            {YETER_SATIR.map((y, i) => {
              const m = ORNEK_MALIYET[y.id];
              const adet = Math.floor(p.kredi / m.kredi);
              return (
                <div key={y.id} className={cn("relative h-full overflow-hidden rounded-[16px] bg-zemin", i === 4 && "col-span-2 sm:col-span-1")}>
                  <div className={cn("relative aspect-[4/5] w-full lg:aspect-auto lg:h-full lg:min-h-[240px]", i === 4 && "max-sm:aspect-[8/5]")}>
                    <Image src={y.kapak} alt="" fill sizes="(min-width: 1024px) 160px, 45vw" className="object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white ring-1 ring-inset ring-white/10 backdrop-blur-md">
                      <y.ikon className={cn("h-3 w-3", METIN_RENK[y.renk])} />{y.tur}
                    </span>
                    <span className="absolute inset-x-3 bottom-3">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span key={adet} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                          className="block text-[26px] font-semibold leading-none tabular-nums tracking-[-0.03em] text-white">{sayi(adet)}</motion.span>
                      </AnimatePresence>
                      <span className="mt-1 block text-[12px] font-medium text-white/85">{y.birim}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-white/55">{m.ad} · {m.kredi} kr</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sipariş özeti */}
        <div className="flex flex-col rounded-[24px] border border-white/[0.07] bg-yuzey p-5 sm:p-6">
          <p className="text-[13px] text-metin-2">Seçilen paket</p>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p key={p.kredi} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
              className="mt-1 text-[40px] font-semibold leading-none tabular-nums tracking-[-0.04em] text-white">
              {sayi(p.kredi)}<span className="ml-2 text-[15px] font-medium tracking-normal text-metin-2">kredi</span>
            </motion.p>
          </AnimatePresence>

          <dl className="mt-5 space-y-2.5 border-t border-white/[0.06] pt-4 text-[13.5px]">
            <div className="flex justify-between gap-3"><dt className="text-metin-2">Paket fiyatı</dt><dd className="tabular-nums text-white">{tl(p.fiyat)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-metin-2">Kredi başına</dt><dd className="tabular-nums text-white">{tlKurus(birim)}</dd></div>
            {tasarrufTl > 0 && (
              <div className="flex justify-between gap-3"><dt className="text-metin-2">{sayi(ilk.kredi)}&apos;lük paketlere göre</dt><dd className="tabular-nums font-medium text-tur-3d">{tl(tasarrufTl)} daha ucuz</dd></div>
            )}
            <div className="flex justify-between gap-3"><dt className="text-metin-2">KDV (%20)</dt><dd className="tabular-nums text-white">{tl(kdv)}</dd></div>
            <div className="flex items-baseline justify-between gap-3 border-t border-white/[0.06] pt-3">
              <dt className="font-semibold text-white">Toplam</dt>
              <dd className="text-[22px] font-semibold tabular-nums tracking-[-0.02em] text-white">{tl(p.fiyat + kdv)}</dd>
            </div>
          </dl>

          <div className="mt-auto pt-5">
            {mod === "site"
              ? <Link href={`/panel/kredi?sekme=kredi&paket=${secili}`} className={eylemSinif}>{sayi(p.kredi)} kredi al<ArrowRight className="h-4 w-4" /></Link>
              : <button onClick={satinAl} className={eylemSinif}>{sayi(p.kredi)} kredi al<ArrowRight className="h-4 w-4" /></button>}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] text-metin-3">
              <span className="flex items-center gap-1.5"><InfinityIcon className="h-3.5 w-3.5" />Süresi dolmaz</span>
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" />Anında yüklenir</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />14 gün iade</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alt şerit: plan önerisi ve hacim */}
      <div className="grid gap-3 md:grid-cols-2">
        {planIleUcuz > 0 && (
          <a href="#planlar" className="group flex items-center gap-4 rounded-[20px] border border-white/[0.07] bg-yuzey px-5 py-4 transition-colors hover:border-white/20">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tur-3d/12 text-tur-3d"><RefreshCw className="h-[18px] w-[18px]" /></span>
            <span className="min-w-0 flex-1 text-[13.5px] leading-snug text-metin-2">
              Düzenli mi üretiyorsun? <b className="font-semibold text-white">{arti.ad}</b> planında kredi {tlKurus(planBirim)}; bu paketten <b className="font-semibold text-tur-3d">%{planIleUcuz} daha ucuz</b>.
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-metin-3 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
          </a>
        )}
        <Link href="/kurumsal" className="group flex items-center gap-4 rounded-[20px] border border-white/[0.07] bg-yuzey px-5 py-4 transition-colors hover:border-white/20">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/85"><Building2 className="h-[18px] w-[18px]" /></span>
          <span className="min-w-0 flex-1 text-[13.5px] leading-snug text-metin-2">
            <b className="font-semibold text-white">25.000+ kredi</b> mi lazım? Ekipler için hacim fiyatı, faturalı ödeme ve ortak kredi havuzu.
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-metin-3 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
        </Link>
      </div>
    </div>
  );
}

/* ── Otomatik yükleme (yalnız panel) ── */
export function OtomatikYukleme() {
  const acik = useTercih((s) => s.otomatikYukleme);
  const toggle = useTercih((s) => s.otomatikYuklemeToggle);
  return (
    <div className="mt-3 flex items-center justify-between gap-4 rounded-[20px] border border-white/[0.07] bg-yuzey px-6 py-4">
      <span className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
          <RefreshCw className="h-4 w-4 text-white/85" />
        </span>
        <span>
          <span className="block text-[14.5px] font-semibold text-white">Otomatik yükleme</span>
          <span className="block text-[13px] text-metin-3">{acik ? `Açık — bakiye 100'ün altına inince ${useTercih.getState().otoPaket.toLocaleString("tr-TR")} kredi yüklenir.` : "Kapalı — bakiyen bitince üretim durur."}</span>
        </span>
      </span>
      <button role="switch" aria-checked={acik} aria-label="Otomatik yükleme"
        onClick={() => { const y = toggle(); toast.success(y ? "Otomatik yükleme açıldı" : "Otomatik yükleme kapatıldı"); }}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", acik ? "bg-white" : "bg-white/15")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full transition-all", acik ? "left-[22px] bg-zemin" : "left-0.5 bg-white")} />
      </button>
    </div>
  );
}
