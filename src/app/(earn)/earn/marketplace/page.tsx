"use client";

/**
 * Earn › Marketplace — "B · Satıcı paneli" (2026-10-29, kullanıcı seçimi; Gumroad):
 * tarayıcı çerçeveli panelde üç büyük sayı (kullanım, biriken kredi, cüzdana geçecek) ve kapaklı preset tablosu
 * (fiyat, sana kalan, kullanım çubuğu, kazanç; satırda Toplulukta gör ve Kaldır), fiyatın nasıl bölündüğü,
 * yayınlama penceresi (components/earn/para/marketplace.tsx). Yayınlanan preset /panel/presetler › Topluluk'ta görünür.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Plus, Trash2 } from "lucide-react";
import { usePaylasim, presetMinFiyat, type Paylasim } from "@/store/usePaylasim";
import { useAuth } from "@/store/useAuth";
import { KrediJeton } from "@/components/ui/KrediHap";
import { PRESET_KREDI_TL, sayi, tl } from "@/lib/earn/kampanyalar";
import { Baslik, Bolum, OrnekRozet, Sayac, birincil, ease, yuzey } from "@/components/earn/para/ui";
import { PresetFormu } from "@/components/earn/para/marketplace";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type Satir = Paylasim & { video?: string };
const PV = (x: string) => ({ gorsel: `/gercek/preset-video/${x}.webp`, video: `/gercek/preset-video/${x}.mp4` });
const ORNEK: Satir[] = [
  { id: "o1", tur: "preset", ad: "Aksiyon Figürü", aciklama: "", tohum: "", kategori: "Ürün", yazar: "@sen", benimMi: true, kullanim: 1240, begeni: 0, olusturma: 0, model: "Kling 3.0", minFiyat: 16, ekstraFiyat: 12, kazanc: 7440, ...PV("action-figure") },
  { id: "o2", tur: "preset", ad: "Dünyadan Yakınlaş", aciklama: "", tohum: "", kategori: "Sahne", yazar: "@sen", benimMi: true, kullanim: 386, begeni: 0, olusturma: 0, model: "Veo 3.1", minFiyat: 17, ekstraFiyat: 10, kazanc: 1930, ...PV("earth-zoom") },
  { id: "o3", tur: "preset", ad: "Masal Şatosu", aciklama: "", tohum: "", kategori: "Sahne", yazar: "@sen", benimMi: true, kullanim: 92, begeni: 0, olusturma: 0, model: "Seedance 2.0", minFiyat: 19, ekstraFiyat: 8, kazanc: 368, ...PV("fairytale-castle") },
];

export default function MarketplaceSayfasi() {
  const tumu = usePaylasim((s) => s.benimPaylasimlar);
  const presetler = useMemo(() => tumu.filter((p) => p.tur === "preset"), [tumu]);
  const kaldir = usePaylasim((s) => s.paylasimKaldir);
  const ad = useAuth((s) => s.kullanici?.ad);
  const [form, setForm] = useState(false);
  const ornek = presetler.length === 0;
  const liste: Satir[] = ornek ? ORNEK : presetler;
  const kullanim = liste.reduce((a, p) => a + p.kullanim, 0);
  const kredi = liste.reduce((a, p) => a + (p.kazanc ?? 0), 0);
  const kadi = ad?.toLocaleLowerCase("tr-TR").replace(/ı/g, "i").normalize("NFD").replace(/[^a-z0-9]/g, "") || "sen";

  return (
    <div>
      <Baslik baslik="Preset satışların" alt={`Üretimini preset olarak yayınla. Başkaları kullandıkça belirlediğin ek fiyatın yarısı sana kalır; her kredi ${tl(PRESET_KREDI_TL, true)} olarak cüzdanına geçer.`}
        sag={<button onClick={() => setForm(true)} className={birincil}><Plus className="h-4 w-4" />Preset yayınla</button>} />

      {/* Satıcı paneli */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="overflow-hidden rounded-[26px] bg-[#0f1013] ring-1 ring-white/[0.08]">
        <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-5 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 min-w-0 truncate text-[12.5px] text-white/40">vayra.ai/presetler/@{kadi}</span>
          {ornek && <span className="ml-auto shrink-0"><OrnekRozet>Örnek görünüm</OrnekRozet></span>}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] divide-y divide-white/[0.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            ["Kullanım", kullanim, (n: number) => sayi(Math.round(n)), "başkalarının üretimleri"],
            ["Biriken kredi", kredi, (n: number) => sayi(Math.round(n)), "kullanım başına payın"],
            ["Cüzdana geçecek", kredi * PRESET_KREDI_TL, (n: number) => tl(n, true), "her ayın 1'inde"],
          ].map(([a, v, b, alt]) => (
            <div key={a as string} className="flex min-w-0 items-baseline justify-between gap-3 px-5 py-3.5 sm:block sm:p-6">
              <p className="truncate text-[12.5px] text-white/50">{a as string}</p>
              <p className={cn("truncate text-[22px] font-semibold tabular-nums tracking-[-0.035em] sm:mt-1 sm:text-[36px]", ornek ? "text-white/60" : "text-white")}><Sayac hedef={v as number} bicim={b as (n: number) => string} /></p>
              <p className="mt-1 hidden truncate text-[12px] text-white/40 sm:block">{alt as string}</p>
            </div>
          ))}
        </div>
        <Tablo liste={liste} ornek={ornek} kaldir={(p) => { kaldir(p.id); toast.success("Preset yayından kaldırıldı", { description: `${p.ad} artık toplulukta görünmüyor.` }); }} yeni={() => setForm(true)} />
      </motion.section>

      {/* Fiyat bölünmesi */}
      <Bolum baslik="Fiyatın nasıl bölünür" alt="Her kullanımda kullanıcıdan alınan kredi üçe ayrılır.">
        <Bolunme />
      </Bolum>

      <AnimatePresence>{form && <PresetFormu kapat={() => setForm(false)} />}</AnimatePresence>
    </div>
  );
}

/* ── Preset tablosu ── */
function Tablo({ liste, ornek, kaldir, yeni }: { liste: Satir[]; ornek: boolean; kaldir: (p: Satir) => void; yeni: () => void }) {
  const max = Math.max(1, ...liste.map((p) => p.kullanim));
  const sutun = "grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,2fr)_120px_minmax(0,1.3fr)_130px_72px]";
  return (
    <div className="border-t border-white/[0.06]">
      <div className={cn("hidden gap-4 px-6 py-3 text-[12px] text-white/40 md:grid", sutun)}><span>Preset</span><span>Fiyat</span><span>Kullanım</span><span className="text-right">Kazanç</span><span /></div>
      <div className={cn(ornek && "pointer-events-none opacity-55")} aria-hidden={ornek}>
        <AnimatePresence initial={false}>
          {liste.map((p, i) => <PresetSatiri key={p.id} p={p} i={i} max={max} sutun={sutun} kaldir={() => kaldir(p)} />)}
        </AnimatePresence>
      </div>
      {ornek ? (
        <div className="flex flex-col gap-3 border-t border-white/[0.06] px-6 py-5 sm:flex-row sm:items-center">
          <p className="flex-1 text-[14px] text-white/65">Henüz yayında presetin yok. Kitaplığındaki bir üretimi presete çevir; başkaları kullandıkça burada satır satır kazancını görürsün.</p>
          <button onClick={yeni} className={cn(birincil, "h-10 shrink-0 px-4 text-[13.5px]")}><Plus className="h-4 w-4" />İlk presetini yayınla</button>
        </div>
      ) : (
        <button onClick={yeni} className="flex w-full items-center gap-3 border-t border-white/[0.06] px-6 py-4 text-left text-[14px] font-medium text-white/70 transition hover:bg-white/[0.02] hover:text-white">
          <span className="flex h-12 w-16 items-center justify-center rounded-[10px] border border-dashed border-white/[0.16] bg-white/[0.03]"><Plus className="h-4 w-4" /></span>Yeni preset yayınla
        </button>
      )}
    </div>
  );
}

function PresetSatiri({ p, i, max, sutun, kaldir }: { p: Satir; i: number; max: number; sutun: string; kaldir: () => void }) {
  const [ust, setUst] = useState(false);
  const pay = Math.floor((p.ekstraFiyat ?? 0) / 2);
  const fiyat = (p.minFiyat ?? presetMinFiyat(p.model)) + (p.ekstraFiyat ?? 0);
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.04, ease }}
      onMouseEnter={() => setUst(true)} onMouseLeave={() => setUst(false)}
      className={cn("group grid items-center gap-4 border-t border-white/[0.05] px-6 py-3.5 transition-colors hover:bg-white/[0.02]", sutun)}>
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-[10px] bg-white/[0.04] ring-1 ring-white/[0.08]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.gorsel && <img src={p.gorsel} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          {p.video && ust && <video src={p.video} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
        </span>
        <div className="min-w-0"><p className="truncate text-[14.5px] font-medium text-white">{p.ad}</p><p className="truncate text-[12.5px] text-white/45">{p.model ?? "Model yok"} · {p.kategori}</p></div>
      </div>
      <p className="hidden text-[13.5px] tabular-nums text-white/75 md:block"><span className="flex items-center gap-1"><KrediJeton boyut={11} />{fiyat}</span><span className="block text-[11.5px] text-white/40">sana {pay} kredi</span></p>
      <div className="hidden items-center gap-3 md:flex">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(2, (p.kullanim / max) * 100)}%` }} transition={{ duration: 0.8, delay: i * 0.06, ease }} className="h-full rounded-full bg-gradient-to-r from-[#55d6fd] to-[#a5ecff]" /></div>
        <span className="w-14 text-right text-[13px] tabular-nums text-white/70">{sayi(p.kullanim)}</span>
      </div>
      <p className="text-right text-[15px] font-semibold tabular-nums text-white">{tl((p.kazanc ?? 0) * PRESET_KREDI_TL, true)}<span className="block text-[11.5px] font-normal text-white/40 md:hidden">{sayi(p.kullanim)} kullanım</span></p>
      <div className="hidden justify-end gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 md:flex">
        <Link href={p.tohum && !p.id.startsWith("o") ? `/panel/presetler?p=${p.tohum.startsWith("ozel-") ? p.tohum : `p-${p.id}`}` : "/panel/presetler?kim=topluluk"} aria-label="Toplulukta gör" title="Toplulukta gör" className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/[0.08] hover:text-white"><ArrowUpRight className="h-4 w-4" /></Link>
        <button onClick={kaldir} aria-label="Yayından kaldır" title="Yayından kaldır" className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition hover:bg-rose-500/15 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
      <div className="col-span-2 -mt-1.5 flex gap-2 md:hidden">
        <Link href={p.tohum && !p.id.startsWith("o") ? `/panel/presetler?p=${p.tohum.startsWith("ozel-") ? p.tohum : `p-${p.id}`}` : "/panel/presetler?kim=topluluk"} className="flex h-8 items-center gap-1 rounded-full px-3 text-[12.5px] text-white/70 ring-1 ring-white/[0.1]">Toplulukta gör<ArrowUpRight className="h-3.5 w-3.5" /></Link>
        <button onClick={kaldir} className="flex h-8 items-center gap-1 rounded-full px-3 text-[12.5px] text-white/70 ring-1 ring-white/[0.1]"><Trash2 className="h-3.5 w-3.5" />Kaldır</button>
      </div>
    </motion.div>
  );
}

/* ── Fiyat bölünmesi: örnek 31 kredilik bir kullanım ── */
function Bolunme() {
  const taban = presetMinFiyat("Kling 3.0"), ek = 12, pay = ek / 2;
  const parca = [
    { ad: "Taban fiyat", alt: "Modelin üretim maliyeti", d: taban, renk: "bg-white/[0.1] text-white/80" },
    { ad: "Vayra payı", alt: "Ek fiyatın yarısı", d: ek - pay, renk: "bg-white/[0.18] text-white" },
    { ad: "Senin payın", alt: `Kredi başı ${tl(PRESET_KREDI_TL, true)}, ayda bir cüzdana`, d: pay, renk: "bg-[#55d6fd] text-[#05222b]" },
  ];
  return (
    <div className={cn(yuzey, "p-6 sm:p-7")}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-[14px] text-white/60">Kling 3.0 ile yapılmış, ek fiyatı {ek} kredi olan bir preset</p>
        <p className="flex items-center gap-1.5 text-[22px] font-semibold tabular-nums text-white"><KrediJeton boyut={15} />{taban + ek} kredi</p>
      </div>
      <div className="mt-5 flex h-12 gap-1 overflow-hidden rounded-[14px]">
        {parca.map((x, i) => (
          <motion.div key={x.ad} initial={{ flexGrow: 0.001 }} animate={{ flexGrow: x.d }} transition={{ duration: 0.9, delay: i * 0.12, ease }} className={cn("flex min-w-0 basis-0 items-center justify-center rounded-[8px] px-2 text-[13px] font-semibold tabular-nums", x.renk)}>
            <span className="truncate">{x.d}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
        {parca.map((x) => (
          <div key={x.ad} className="flex items-start gap-3">
            <span className={cn("mt-1 h-3 w-3 shrink-0 rounded-[4px]", x.renk.split(" ")[0])} />
            <div><p className="text-[14.5px] font-semibold text-white">{x.ad} · {x.d} kredi</p><p className="text-[12.5px] text-white/50">{x.alt}</p></div>
          </div>
        ))}
      </div>
      <p className="mt-5 border-t border-white/[0.06] pt-4 text-[12.5px] leading-relaxed text-white/45">Preset özgün olmalı; kapak, presetin istemiyle Vayra'da üretilmiş gerçek bir çıktıdır. Başkasının işini kopyalayan presetler yayından kaldırılır.</p>
    </div>
  );
}
