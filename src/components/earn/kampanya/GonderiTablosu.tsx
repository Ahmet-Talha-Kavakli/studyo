"use client";

/**
 * Gönderi durum panosu (2026-10-29, seçilen "A · Durum panosu"; Vyro "Track progress" deseni):
 * satırda dikey küçük resim + platform, kampanya ve bağlantı, aşama noktaları, durum hapı ve platformdan okunan izlenme.
 * Durum sunucudaki inceleme kararından gelir (zamanla ilerlemez); kazanç defteri olmadığı için tutar gösterilmez.
 * Satıra tıklayınca açılır: inceleme durumu, aşamalar, red gerekçesi + itiraz, bağlantıyı kopyala/aç.
 */

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, ChevronDown, Copy, Eye, RotateCcw, X } from "lucide-react";
import { gonderiHesap, useEarn, type Gonderi, type GonderiDurum } from "@/store/useEarn";
import { KURALLAR, kisaSayi, platformBul, tl, type Kampanya } from "@/lib/earn/kampanyalar";
import { kopyala } from "@/lib/gercekEylem";
import { toast } from "@/lib/toast";
import { PlatformLogo } from "../ortak";
import { Sayac, ease } from "./parcalar";
import { cn } from "@/lib/utils";

const tarih = (t: number) => new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

export const DURUM_GORUNUM: Record<GonderiDurum, { ad: string; renk: string }> = {
  inceleme: { ad: "İncelemede", renk: "#fcd34d" }, onaylandi: { ad: "Onaylandı", renk: "#34d399" }, degerlendirme: { ad: "Jüride", renk: "#c4b5fd" },
  kazaniyor: { ad: "Kazanıyor", renk: "#55d6fd" }, bekleme: { ad: "Güvenlik beklemesi", renk: "#a78bfa" },
  cekilebilir: { ad: "Cüzdanda", renk: "#34d399" }, reddedildi: { ad: "Reddedildi", renk: "#fb7185" }, sonuclandi: { ad: "Sonuçlandı", renk: "#9ca3af" },
};

/** Kampanya türüne göre aşamalar. */
export function asamalar(tur: Kampanya["tur"]): { id: GonderiDurum; ad: string; alt: string }[] {
  if (tur === "yarisma") return [{ id: "degerlendirme", ad: "Jüri", alt: "Kampanya bitene kadar" }, { id: "sonuclandi", ad: "Sonuç", alt: "Jüri kararıyla" }];
  return [{ id: "inceleme", ad: "İnceleme", alt: "Vayra ekibi bağlantını kontrol eder" }, { id: "onaylandi", ad: "Onay", alt: "Kurallara uygunsa" }];
}

export function DurumHap({ g, d }: { g: Gonderi; d: GonderiDurum }) {
  const x = DURUM_GORUNUM[d];
  const ad = g.itiraz === "inceleniyor" ? "İtiraz inceleniyor" : x.ad;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/[0.05] px-2.5 py-1 text-[12px] font-medium text-white ring-1 ring-white/[0.08]">
      <span className="relative flex h-1.5 w-1.5">{d === "inceleme" && <span className="absolute inset-0 animate-ping rounded-full opacity-60" style={{ background: x.renk }} />}<span className="h-1.5 w-1.5 rounded-full" style={{ background: x.renk }} /></span>{ad}
    </span>
  );
}

function AsamaNoktalari({ tur, d }: { tur: Kampanya["tur"]; d: GonderiDurum }) {
  const l = asamalar(tur);
  const n = l.findIndex((a) => a.id === d);
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {l.map((a, i) => (
        <motion.span key={a.id} initial={false} animate={{ width: i <= n && n >= 0 ? 20 : 6 }} transition={{ duration: 0.5, ease }}
          className="h-1.5 rounded-full" style={{ background: d === "reddedildi" ? "rgba(251,113,133,0.35)" : i < n ? "rgba(255,255,255,0.55)" : i === n ? DURUM_GORUNUM[d].renk : "rgba(255,255,255,0.14)" }} />
      ))}
    </span>
  );
}

export function GonderiTablosu({ satirlar, simdi, bonus = 0 }: { satirlar: Gonderi[]; simdi: number; bonus?: number }) {
  const [acik, setAcik] = useState<string | null>(null);
  return (
    <div className="overflow-hidden rounded-[24px] bg-white/[0.015] ring-1 ring-white/[0.07]">
      <div className="hidden grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_24px] gap-4 bg-white/[0.025] px-5 py-3 text-[12.5px] text-white/45 md:grid">
        <span>Gönderi</span><span>Aşama</span><span>Durum</span><span className="text-right">İzlenme</span><span className="text-right">Tür</span><span />
      </div>
      <AnimatePresence initial={false}>
        {satirlar.map((g, i) => <Satir key={g.id} g={g} i={i} simdi={simdi} bonus={bonus} acik={acik === g.id} onAc={() => setAcik((x) => (x === g.id ? null : g.id))} />)}
      </AnimatePresence>
    </div>
  );
}

function Satir({ g, i, simdi, bonus, acik, onAc }: { g: Gonderi; i: number; simdi: number; bonus: number; acik: boolean; onAc: () => void }) {
  const h = gonderiHesap(g, simdi, bonus);
  const k = h.kampanya;
  if (!k) return null;
  const izlenme = k.tur === "goruntulenme" && h.gercekVeri;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.03, ease }} className="border-t border-white/[0.06] first:border-t-0">
      <button onClick={onAc} aria-expanded={acik}
        className={cn("grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 text-left outline-none transition-colors focus-visible:bg-white/[0.05] md:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_24px] md:px-5", acik ? "bg-white/[0.04]" : "hover:bg-white/[0.025]")}>
        <span className="flex min-w-0 items-center gap-3">
          <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-[10px] bg-black ring-1 ring-white/[0.1]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.uretimGorsel ?? g.kontrol?.kucukResim ?? k.kapak} alt="" className="h-full w-full object-cover" />
            <span className="absolute bottom-0.5 left-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-black/60 backdrop-blur"><PlatformLogo id={g.platform} boyut={10} /></span>
          </span>
          <span className="min-w-0"><span className="block truncate text-[14.5px] font-medium text-white">{k.ad}</span><span className="text-[12.5px] text-white/45">{platformBul(g.platform).ad} · {tarih(g.tarih)}</span></span>
        </span>
        <span className="hidden md:block"><AsamaNoktalari tur={k.tur} d={h.durum} /></span>
        <span className="justify-self-end md:justify-self-start"><DurumHap g={g} d={h.durum} /></span>
        <span className="hidden text-right text-[13.5px] tabular-nums text-white/70 md:block">{izlenme ? kisaSayi(h.goruntulenme) : "Okunmadı"}</span>
        <span className="col-span-2 flex items-center justify-between md:col-span-1 md:block md:text-right">
          <span className="text-[12px] text-white/45 md:hidden">{izlenme ? `${kisaSayi(h.goruntulenme)} izlenme` : ""}</span>
          <span className="text-[13px] text-white/55">{k.tur === "goruntulenme" ? "Görüntülenme" : k.tur === "gorev" ? "Görev" : "Yarışma"}</span>
        </span>
        <ChevronDown className={cn("hidden h-4 w-4 text-white/40 transition-transform duration-300 md:block", acik && "rotate-180 text-white")} />
      </button>
      <AnimatePresence initial={false}>
        {acik && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
            <Ayrinti g={g} h={h} k={k} simdi={simdi} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Ayrinti({ g, h, k, simdi }: { g: Gonderi; h: ReturnType<typeof gonderiHesap>; k: Kampanya; simdi: number }) {
  const itirazEt = useEarn((s) => s.itirazEt);
  const l = asamalar(k.tur);
  const n = l.findIndex((a) => a.id === h.durum);
  return (
    <div className="grid gap-5 border-t border-white/[0.05] bg-white/[0.02] px-4 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:px-5">
      {/* Döküm */}
      <div>
        <p className="text-[12.5px] font-medium text-white/55">{h.durum === "reddedildi" ? "Neden reddedildi" : "Durum"}</p>
        {h.durum === "reddedildi" ? (
          <div className="mt-2 rounded-[16px] bg-rose-500/[0.06] p-3.5 ring-1 ring-rose-400/15">
            <p className="flex items-start gap-2 text-[13.5px] text-rose-100"><X className="mt-0.5 h-3.5 w-3.5 shrink-0" />{g.red}</p>
            {g.itiraz ? <p className="mt-2.5 text-[12.5px] text-white/55">{g.itiraz === "inceleniyor" ? "İtirazın inceleniyor; karar verilince bildirim alacaksın." : "İtiraz hakkın kullanıldı."}</p>
              : <button onClick={() => { itirazEt(g.id); toast.success("İtiraz gönderildi", { description: "Gönderin yeniden incelenecek; karar verilince bildirim alacaksın." }); }}
                className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]"><RotateCcw className="h-3.5 w-3.5" />İtiraz et</button>}
          </div>
        ) : (
          <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{h.durum === "onaylandi" ? "Başvurun kampanya kurallarına uygun bulundu. Kazanç tutarı henüz sistemde hesaplanmıyor; ödeme açıldığında yazılacak." : h.durum === "sonuclandi" ? "Yarışma sona erdi. Jüri kararı açıklandığında bildirim alacaksın." : h.durum === "degerlendirme" ? "Başvurun jüriye iletildi. Sonuç kampanya bitince açıklanır." : g.senkronHata ? `Başvurun sunucuya kaydedilemedi: ${g.senkronHata}` : g.sunucuId ? "Gönderin incelemede. Vayra ekibi bağlantını kontrol edip onaylar ya da gerekçesiyle reddeder." : "Başvurun kaydediliyor."}</p>
        )}
      </div>
      {/* Zaman çizgisi */}
      {h.durum !== "reddedildi" ? (
        <ol>
          {l.map((a, j) => {
            const son = j === l.length - 1 && j === n;
            const tamam = j < n || son;
            const su = j === n && !son;
            return (
              <li key={a.id} className="relative flex gap-3 pb-3.5 last:pb-0">
                {j < l.length - 1 && <span className={cn("absolute left-[9px] top-5 h-[calc(100%-10px)] w-px", tamam ? "bg-[#55d6fd]/50" : "bg-white/[0.08]")} />}
                <span className={cn("relative mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full", tamam ? "bg-[#55d6fd] text-[#06222b]" : su ? "bg-white" : "ring-1 ring-white/20")}>{tamam && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}</span>
                <span className="min-w-0"><span className={cn("block text-[13.5px]", tamam || su ? "text-white" : "text-white/45")}>{a.ad}</span><span className="text-[12px] text-white/45">{a.alt}</span></span>
              </li>
            );
          })}
        </ol>
      ) : <span className="hidden md:block" />}
      {/* Eylemler */}
      <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch">
        <button onClick={() => { void kopyala(g.link, "Bağlantı kopyalandı"); }} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-white ring-1 ring-white/[0.12] transition hover:bg-white/[0.06] active:scale-[0.97]"><Copy className="h-3.5 w-3.5" />Bağlantıyı kopyala</button>
        <a href={g.link} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-white ring-1 ring-white/[0.12] transition hover:bg-white/[0.06] active:scale-[0.97]"><Eye className="h-3.5 w-3.5" />Paylaşımı aç</a>
        <Link href={`/earn/kampanyalar/${k.id}`} className="inline-flex h-9 items-center justify-center gap-1 px-2 text-[13px] text-white/55 transition hover:text-white">Kampanya<ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </div>
    </div>
  );
}
