"use client";

/**
 * Preset sayfasının istemcisi (2026-11-01, Video stüdyosunun onaylı diliyle):
 * Apple buzlu cam kutu; solda kare yuvaları (Fotoğraf zorunlu, Mekân ve Ürün isteğe bağlı), yanında ek talimat;
 * altta etiket + değer gösteren büyük çipler (Efekt, İkinci efekt, Model, Kalite, Oran) ve sağda bölünmüş beyaz
 * düğme (adet | Oluştur + bedel). Demo bilgisi yalnız düğmenin bedel yerinde görünür; tekrar etmez.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ImagePlus, Info, Loader2, MapPin, Package, Plus, Shuffle, Sparkles, Wand2, X, Zap } from "lucide-react";
import type { KatalogPreset } from "@/lib/presetKatalog";
import { MarkaKare } from "@/components/studyo/hf";
import { Yuzen } from "@/components/ui/Yuzen";
import { KrediJeton } from "@/components/ui/KrediHap";
import { cn } from "@/lib/utils";
import { PresetKapak } from "../PresetKarti";
import { PRESET_MODELLER, fotoOku, presetBedel, type Kalite, type Medya, type PresetModel } from "../presetOrtak";
import { ORAN_NOT, OranSimge } from "./Yanlar";

type Pop = null | "model" | "kalite" | "oran" | "adet";
const ease = [0.22, 1, 0.36, 1] as const;

/** Çip: solda yuvarlak simge, sağda küçük etiket + değer (Video stüdyosu SEG). */
const SEG = "group/seg flex h-12 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full bg-white/[0.07] pl-1.5 pr-3.5 text-left transition-[background-color,transform] duration-200 hover:bg-white/[0.11] active:scale-[0.97]";
const PANO = "rounded-[20px] border border-white/[0.09] bg-[#18181b] p-1.5";

function Daire({ children, dolu }: { children: React.ReactNode; dolu?: boolean }) {
  return <span className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full", dolu ? "ring-1 ring-inset ring-white/20" : "bg-white/[0.08] text-white/75")}>{children}</span>;
}
function SegMetin({ etiket, deger }: { etiket: string; deger: React.ReactNode }) {
  return (
    <span className="flex min-w-0 flex-col items-start leading-none">
      <span className="text-[11px] text-white/55">{etiket}</span>
      <span className="mt-1 flex items-center gap-1 text-[13px] font-medium tabular-nums text-white">{deger}</span>
    </span>
  );
}

export function KomutKutusu(props: {
  p: KatalogPreset; ek: KatalogPreset | null; setEk: (x: KatalogPreset | null) => void;
  foto: Medya | null; mekan: Medya | null; urun: Medya | null; urunVar: boolean;
  setFoto: (m: Medya | null) => void; setMekan: (m: Medya | null) => void; setUrun: (m: Medya | null) => void;
  talimat: string; setTalimat: (s: string) => void;
  model: PresetModel; setModel: (ad: string) => void; kalite: Kalite; setKalite: (k: Kalite) => void;
  oran: string; setOran: (o: string) => void; adet: number; setAdet: (n: number) => void;
  birim: number; toplam: number; bagli: boolean | null; sag: Record<string, unknown> | null;
  yetersiz: boolean; girisli: boolean; krediler: number; girdiSlot: string;
  onUret: () => void; onDegistir: () => void; onKaristir: () => void;
}) {
  const { p, ek, model, kalite, oran, adet, foto } = props;
  const [pop, setPop] = useState<Pop>(null);
  const [dar, setDar] = useState(false);
  useEffect(() => { const f = () => setDar(window.innerWidth < 640); f(); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  const ac = (x: Pop) => setPop((v) => (v === x ? null : x));
  const oranVar = model.oranlar.length > 0;
  const demo = props.bagli === false;
  const hazir = !!foto;
  const bagliDegil = props.sag ? PRESET_MODELLER.some((m) => !props.sag![m.saglayici]) : false;

  return (
    <div className="pointer-events-none fixed inset-x-2 bottom-[calc(64px+env(safe-area-inset-bottom))] z-[41] flex justify-center sm:inset-x-4 sm:bottom-4">
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, ease, delay: 0.1 }}
        className="cam-istemci pointer-events-auto w-full max-w-[1080px] rounded-[26px] p-3">
        {/* Üst: kare yuvaları + ek talimat */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex shrink-0 items-center gap-1.5">
            <Yuva medya={foto} onDegis={props.setFoto} ana etiket={props.girdiSlot === "Fotoğraf" ? "Fotoğraf" : props.girdiSlot} />
            <Yuva medya={props.mekan} onDegis={props.setMekan} etiket="Mekân" ikon={MapPin} />
            {props.urunVar && <Yuva medya={props.urun} onDegis={props.setUrun} etiket="Ürün" ikon={Package} />}
          </div>
          <label className="relative flex min-w-0 flex-1 items-start self-stretch">
            <Wand2 className="pointer-events-none absolute left-1 top-[13px] h-4 w-4 text-white/40" />
            <textarea value={props.talimat} onChange={(e) => props.setTalimat(e.target.value.slice(0, 300))} rows={2}
              placeholder={dar ? "Yönlendir (isteğe bağlı)" : "İstersen yönlendir · ör. kırmızı ceket, gün batımında sahil"} aria-label="Ek talimat"
              className="h-full min-h-[44px] w-full resize-none bg-transparent py-2.5 pl-7 pr-8 text-[15px] leading-relaxed text-white outline-none placeholder:text-white/40 max-sm:h-11 max-sm:overflow-hidden max-sm:whitespace-nowrap sm:min-h-[64px]" />
            {props.talimat && <button onClick={() => props.setTalimat("")} aria-label="Talimatı temizle" className="absolute right-1 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30"><X className="h-3 w-3" strokeWidth={3} /></button>}
          </label>
        </div>

        {/* Alt: çipler + bölünmüş Oluştur */}
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <div className="gizli-scroll min-w-0 flex-1 overflow-x-auto max-sm:-mx-3 max-sm:basis-full max-sm:px-3 sm:pr-5 sm:[mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]">
            <div className="flex w-max items-center gap-1.5">
              {/* Efekt */}
              <button onClick={props.onDegistir} className={SEG} title="Efekti değiştir">
                <Daire dolu><PresetKapak p={p} kucuk /></Daire>
                <SegMetin etiket="Efekt" deger={<span lang="en" className="block max-w-[130px] truncate">{p.ad}</span>} />
              </button>
              {/* İkinci efekt */}
              {ek ? (
                <span className={cn(SEG, "bg-white/[0.11] pr-1.5")}>
                  <button onClick={props.onKaristir} className="flex items-center gap-2.5 text-left">
                    <Daire dolu><PresetKapak p={ek} kucuk /></Daire>
                    <SegMetin etiket={`İkinci efekt · +${Math.ceil(ek.kredi / 2)}`} deger={<span lang="en" className="block max-w-[120px] truncate">{ek.ad}</span>} />
                  </button>
                  <button onClick={() => props.setEk(null)} aria-label="İkinci efekti kaldır" className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.1] hover:text-white"><X className="h-3.5 w-3.5" /></button>
                </span>
              ) : (
                <button onClick={props.onKaristir} className={SEG}>
                  <Daire><Shuffle className="h-4 w-4" /></Daire><SegMetin etiket="İkinci efekt" deger={<span className="text-white/70">Ekle</span>} />
                </button>
              )}
              {/* Model */}
              <div className="relative">
                <button onClick={() => ac("model")} aria-expanded={pop === "model"} className={cn(SEG, pop === "model" && "bg-white/[0.13]")}>
                  <Daire dolu><span className="[&>span]:!h-9 [&>span]:!w-9 [&>span]:!rounded-full"><MarkaKare ad={model.ad} boyut={36} /></span></Daire>
                  <SegMetin etiket="Model" deger={<>{model.ad}<ChevronDown className={cn("h-3 w-3 text-white/45 transition-transform", pop === "model" && "rotate-180")} /></>} />
                </button>
                <Yuzen acik={pop === "model"} onKapat={() => setPop(null)} yerlesim="ust-sol" bosluk={10} etiket="Model" className={PANO} style={{ width: "min(420px, calc(100vw - 24px))" }}>
                  <p className="px-2.5 pb-1.5 pt-1 text-[13px] font-semibold text-white">Fotoğraftan video modeli</p>
                  {PRESET_MODELLER.map((m) => {
                    const sec = m.ad === model.ad;
                    return (
                      <button key={m.ad} role="menuitemradio" aria-checked={sec} onClick={() => { props.setModel(m.ad); setPop(null); }}
                        className={cn("flex w-full items-center gap-3 rounded-[14px] p-2 text-left transition-colors hover:bg-white/[0.05]", sec && "bg-white/[0.07]")}>
                        <MarkaKare ad={m.ad} boyut={38} />
                        <span className="min-w-0 flex-1 leading-tight">
                          <span className="flex items-center gap-1.5 text-[14px] font-semibold text-white">{m.ad}{m.rozet && <span className="rounded-full bg-white/[0.1] px-1.5 py-px text-[10.5px] font-semibold text-white/80">{m.rozet}</span>}</span>
                          <span className="mt-0.5 block truncate text-[12.5px] text-white/55">{m.aciklama} · {m.coz.hd}, {m.sure ? `${m.sure} sn` : "süreyi model seçer"}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold tabular-nums text-white/85"><KrediJeton boyut={12} />{presetBedel(p, m.ad, kalite, ek)}</span>
                        <span className="flex w-4 shrink-0 justify-center">{sec && <Check className="h-4 w-4 text-white" />}</span>
                      </button>
                    );
                  })}
                  {bagliDegil && <p className="mt-1 flex items-start gap-1.5 border-t border-white/[0.06] px-2.5 pb-1 pt-2.5 text-[12px] leading-snug text-white/50"><Info className="mt-px h-3.5 w-3.5 shrink-0" />Sağlayıcısı bağlı olmayan modellerde örnek video üretilir, kredi düşmez.</p>}
                </Yuzen>
              </div>
              {/* Kalite */}
              <div className="relative">
                <button onClick={() => ac("kalite")} aria-expanded={pop === "kalite"} className={cn(SEG, pop === "kalite" && "bg-white/[0.13]")}>
                  <Daire>{kalite === "taslak" ? <Zap className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}</Daire>
                  <SegMetin etiket="Kalite" deger={`${kalite === "taslak" ? "Taslak" : "HD"} · ${model.coz[kalite]}`} />
                </button>
                <Yuzen acik={pop === "kalite"} onKapat={() => setPop(null)} yerlesim="ust-sol" bosluk={10} etiket="Kalite" className={PANO} style={{ width: "min(320px, calc(100vw - 24px))" }}>
                  {(["taslak", "hd"] as Kalite[]).map((k) => {
                    const sec = kalite === k;
                    return (
                      <button key={k} onClick={() => { props.setKalite(k); setPop(null); }} aria-pressed={sec}
                        className={cn("flex w-full items-center gap-3 rounded-[14px] p-2.5 text-left transition-colors hover:bg-white/[0.05]", sec && "bg-white/[0.07]")}>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white">{k === "taslak" ? <Zap className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}</span>
                        <span className="min-w-0 flex-1 leading-tight">
                          <span className="block text-[14px] font-semibold text-white">{k === "taslak" ? "Taslak" : "HD"} · {model.coz[k]}</span>
                          <span className="mt-0.5 block text-[12px] text-white/55">{k === "taslak" ? "Hızlı dene, yüzde 40 daha ucuz" : "Paylaşıma hazır netlik"}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[13px] font-semibold tabular-nums text-white/85"><KrediJeton boyut={12} />{presetBedel(p, model.ad, k, ek)}</span>
                        <span className="flex w-4 justify-center">{sec && <Check className="h-4 w-4 text-white" />}</span>
                      </button>
                    );
                  })}
                </Yuzen>
              </div>
              {/* Oran */}
              <div className="relative">
                <button onClick={() => oranVar && ac("oran")} disabled={!oranVar} aria-expanded={pop === "oran"} title={oranVar ? "Oran" : "Bu modelde oranı model seçer"}
                  className={cn(SEG, pop === "oran" && "bg-white/[0.13]", !oranVar && "cursor-default hover:bg-white/[0.07]")}>
                  <Daire>{oranVar ? <OranSimge oran={oran} /> : <Sparkles className="h-4 w-4" />}</Daire>
                  <SegMetin etiket="Oran" deger={oranVar ? oran : "Otomatik"} />
                </button>
                <Yuzen acik={pop === "oran"} onKapat={() => setPop(null)} yerlesim="ust-sol" bosluk={10} etiket="Oran" className={PANO} style={{ width: "min(270px, calc(100vw - 24px))" }}>
                  {model.oranlar.map((r) => {
                    const sec = oran === r;
                    return (
                      <button key={r} onClick={() => { props.setOran(r); setPop(null); }} aria-pressed={sec}
                        className={cn("flex w-full items-center gap-3 rounded-[14px] p-2.5 text-left transition-colors hover:bg-white/[0.05]", sec && "bg-white/[0.07]")}>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white"><OranSimge oran={r} /></span>
                        <span className="min-w-0 flex-1 leading-tight"><span className="block text-[14px] font-semibold text-white">{r}</span><span className="mt-0.5 block text-[12px] text-white/55">{ORAN_NOT[r]}</span></span>
                        <span className="flex w-4 justify-center">{sec && <Check className="h-4 w-4 text-white" />}</span>
                      </button>
                    );
                  })}
                </Yuzen>
              </div>
            </div>
          </div>

          {/* Bölünmüş düğme: adet | Oluştur + bedel */}
          <div className="flex h-12 shrink-0 items-center rounded-[14px] bg-white p-1 max-sm:w-full">
            <div className="relative">
              <button onClick={() => ac("adet")} aria-expanded={pop === "adet"} aria-label={`Video sayısı: ${adet}`} title="Aynı ayarla kaç video"
                className="flex h-10 items-center gap-0.5 rounded-[11px] pl-3 pr-2 text-[13px] font-bold tabular-nums text-[#0a0a0b] transition-colors hover:bg-black/[0.06]">
                {adet}×<ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", pop === "adet" && "rotate-180")} />
              </button>
              <Yuzen acik={pop === "adet"} onKapat={() => setPop(null)} yerlesim="ust-sag" bosluk={10} etiket="Adet" className={PANO} style={{ width: 220 }}>
                <p className="px-2 pb-1 pt-1 text-[12.5px] font-semibold text-white">Kaç video?</p>
                {[1, 2, 3, 4].map((n) => (
                  <button key={n} onClick={() => { props.setAdet(n); setPop(null); }} aria-pressed={adet === n} className={cn("flex w-full items-center gap-2 rounded-[10px] px-2 py-2 text-left transition-colors", adet === n ? "bg-white/[0.07]" : "hover:bg-white/[0.04]")}>
                    <span className="flex-1 text-[13px] font-medium text-white">{n} video</span>
                    {!demo && <span className="text-[11.5px] tabular-nums text-white/50">{props.birim * n} kredi</span>}
                    <span className="flex w-4 justify-center">{adet === n && <Check className="h-4 w-4 text-white" />}</span>
                  </button>
                ))}
                <p className="px-2 pb-1 pt-1 text-[11px] leading-snug text-white/45">Aynı fotoğrafla farklı varyasyonlar; en iyisini seç.</p>
              </Yuzen>
            </div>
            <span aria-hidden className="h-5 w-px bg-black/15" />
            <button onClick={props.onUret} title={hazir ? undefined : "Önce fotoğrafını ekle"}
              className="flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-[11px] pl-3 pr-1 text-[14.5px] font-semibold text-[#0a0a0b] transition-[background-color,transform] hover:bg-black/[0.04] active:scale-[0.98]">
              {hazir ? <Sparkles className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
              <span className="truncate">{hazir ? (adet > 1 ? `${adet} video oluştur` : "Oluştur") : "Fotoğraf ekle"}</span>
              <span className="flex h-7 items-center gap-1 rounded-full bg-black/[0.08] px-2.5 text-[11.5px] font-semibold tabular-nums">
                {demo ? "Ücretsiz" : <><KrediJeton boyut={11} />
                  <AnimatePresence mode="popLayout" initial={false}><motion.span key={props.toplam} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -6, opacity: 0 }}>{props.toplam}</motion.span></AnimatePresence></>}
              </span>
            </button>
          </div>
        </div>

        {/* Engel notu: yalnız kredi yetmiyorsa */}
        <AnimatePresence initial={false}>
          {props.yetersiz && !demo && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <Link href="/panel/kredi?sekme=kredi" className="mx-auto mt-2.5 flex w-fit max-w-full items-start gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[12px] leading-snug text-white/75 transition hover:bg-white/[0.1] hover:text-white">
                <Info className="mt-px h-3.5 w-3.5 shrink-0" />Kredin yetersiz: {props.toplam} gerekli, {props.krediler.toLocaleString("tr-TR")} var. Kredi yükle
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/** Kare yuvası (Video stüdyosundaki gibi): boşken artı daireli cam kare + etiket; doluyken küçük resim, altta etiket, köşede kaldır. */
function Yuva({ medya, onDegis, ana, etiket, ikon: I = ImagePlus }: { medya: Medya | null; onDegis: (m: Medya | null) => void; ana?: boolean; etiket: string; ikon?: React.ElementType }) {
  const ref = useRef<HTMLInputElement>(null);
  const [surukle, setSurukle] = useState(false);
  const [isleniyor, setIsleniyor] = useState(false);
  const al = useCallback(async (d?: File | null) => { setIsleniyor(true); const m = await fotoOku(d); setIsleniyor(false); if (m) onDegis(m); }, [onDegis]);
  const boy = "h-12 w-12 rounded-[14px] sm:h-[72px] sm:w-[72px] sm:rounded-[18px]";
  return (
    <div className="group relative shrink-0">
      <input id={ana ? "preset-foto-girdi" : undefined} ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden onChange={(e) => { void al(e.target.files?.[0]); e.target.value = ""; }} />
      {medya ? (
        <div className={cn("relative overflow-hidden ring-1 ring-inset ring-white/15", boy)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={medya.url} alt={etiket} className="h-full w-full object-cover" />
          <button onClick={() => ref.current?.click()} aria-label={`${etiket} değiştir`} className="absolute inset-0" />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent pb-1 pt-4 text-center text-[10px] font-semibold text-white">{etiket}</span>
          <button onClick={() => onDegis(null)} aria-label={`${etiket} kaldır`}
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/75 text-white opacity-0 transition-opacity hover:bg-rose-500 focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100"><X className="h-3 w-3" /></button>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()} aria-label={`${etiket} ekle`} title={ana ? `${etiket} ekle · sürükle ya da Ctrl V` : `${etiket} ekle (isteğe bağlı)`}
          onDragOver={(e) => { e.preventDefault(); setSurukle(true); }} onDragLeave={() => setSurukle(false)} onDrop={(e) => { e.preventDefault(); setSurukle(false); void al(e.dataTransfer.files[0]); }}
          className={cn("flex flex-col items-center justify-center gap-1.5 text-center transition-all duration-200 hover:-translate-y-px", boy,
            "bg-[linear-gradient(160deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] ring-1 ring-inset", surukle ? "ring-2 ring-white" : ana ? "ring-white/25" : "ring-white/[0.09] hover:ring-white/25")}>
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-full transition-colors", ana ? "bg-white text-[#0a0a0b]" : "bg-white/[0.07] text-white group-hover:bg-white group-hover:text-[#0a0a0b]")}>
            {isleniyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : ana ? <Plus className="h-3.5 w-3.5" strokeWidth={2.6} /> : <I className="h-3.5 w-3.5" />}
          </span>
          <span className="text-[10.5px] font-medium leading-none text-white/75 max-sm:hidden">{etiket}</span>
        </button>
      )}
    </div>
  );
}
