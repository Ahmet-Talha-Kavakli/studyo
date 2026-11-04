"use client";

/**
 * Önizleme sahnesi: arkada efektin rengiyle ortam ışığı; üstte efektin adı, açıklaması, kategori ve bedeli;
 * ortada büyük önce/sonra (fotoğrafın ya da bırakma alanı, akış oku, seçili oranda örnek sonuç);
 * altında "Bu efektle iyi gider" karışımları ve galerideki kartlarla "Benzer efektler" rafı.
 */

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Check, Heart, UserPlus, Clock, Images, ImagePlus, Loader2, Plus, Shuffle, Sparkles, X } from "lucide-react";
import { KrediJeton } from "@/components/ui/KrediHap";
import { RESMI_PRESETLER, KATEGORI_AD, type KatalogPreset } from "@/lib/presetKatalog";
import { usePresetler } from "@/store/usePresetler";
import { useAuth } from "@/store/useAuth";
import { sayiKisa, tutamac, yaraticiBul, yaraticiPayi } from "@/lib/presetTopluluk";
import { YaraticiAvatar } from "../PresetPaneli";
import { OrtamIsigi } from "@/components/anasayfa/performans";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { KAT_IKON, PresetKapak, PresetVideo } from "../PresetKarti";
import { GaleriKart, KARISIMLAR, KartRozet } from "../PresetGaleri";
import { GIRDI, fotoOku, presetGirdi, type Medya } from "../presetOrtak";
import { KitaplikListe, ORAN_BOY } from "./Yanlar";

const ease = [0.22, 1, 0.36, 1] as const;

export function OnizlemeSahnesi({ p, ek, setEk, foto, onFoto, oran, birim }: {
  p: KatalogPreset; ek: KatalogPreset | null; setEk: (x: KatalogPreset | null) => void;
  foto: Medya | null; onFoto: (m: Medya) => void; oran: string; birim: number;
}) {
  const g = GIRDI[presetGirdi(p)];
  const kategoriler = p.kategoriler.filter((k) => k !== "VIRAL");
  const karisimOneri = KARISIMLAR.filter(([a, b]) => a === p.slug || b === p.slug);
  const ayniKat = RESMI_PRESETLER.filter((x) => x.slug !== p.slug && x.kategoriler.some((k) => k !== "VIRAL" && p.kategoriler.includes(k)));
  const benzer = [...ayniKat, ...[...RESMI_PRESETLER].sort((a, b) => a.sira - b.sira).filter((x) => x.slug !== p.slug && !ayniKat.includes(x))].slice(0, 14);

  return (
    <div className="relative">
      {/* Ortam ışığı: efektin rengi sahneye yayılır */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[900px] overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.div key={p.slug} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} className="absolute inset-0">
            <OrtamIsigi src={p.kapak} opaklik={0.32} className="inset-0 [--olcek:46]" />
          </motion.div>
        </AnimatePresence>
        <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-zemin to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-[1480px] px-4 pb-52 pt-5 sm:px-6 sm:pt-6">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:mb-[176px] lg:min-h-[calc(100dvh-var(--ust-nav)-64px-20px-196px)] lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-stretch xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          {/* Künye kartı */}
          <motion.section key={p.slug} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}
            className="flex flex-col overflow-hidden rounded-[28px] bg-[#111214]/85 ring-1 ring-inset ring-white/[0.08] backdrop-blur-2xl max-lg:order-2">
            <div className="p-5 sm:p-6 sm:pb-5">
              {(p.etiket || p.pro || p.ozel) && (
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  {p.etiket && <KartRozet tur={p.etiket === "Trend" ? "trend" : "yeni"}>{p.etiket}</KartRozet>}
                  {p.pro && <KartRozet tur="pro">Pro</KartRozet>}
                  {p.ozel && <KartRozet tur="senin">Senin presetin</KartRozet>}
                </div>
              )}
              <h1 lang="en" className="text-[34px] font-semibold leading-[1.04] tracking-[-0.04em] text-white sm:text-[42px] xl:text-[46px]">
                {p.ad}{ek && <span className="text-white/40"> + </span>}{ek && <span className="hero-isilti">{ek.ad}</span>}
              </h1>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-white/70">{p.aciklama}</p>
              <YaraticiSatiri p={p} />
            </div>
            {/* Fotoğraf rehberi: kalan yüksekliği örnek fotoğraflar doldurur (kartta boş alan kalmaz) */}
            <div className="flex min-h-0 flex-1 flex-col border-t border-white/[0.06] px-5 pb-5 pt-4 sm:px-6">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-white"><g.ikon className="h-4 w-4 text-white/60" />Hangi fotoğraf iyi sonuç verir?</p>
              <div className="mt-3 grid min-h-[96px] flex-1 grid-cols-2 gap-2 lg:max-h-[300px]">
                {([["/gercek/kabuk/ornek-iyi.webp", true, g.iyi], ["/gercek/kabuk/ornek-kotu.webp", false, g.kotu]] as const).map(([src, iyi, metin]) => (
                  <figure key={String(iyi)} className="group/f relative min-h-0 overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.08]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover/f:scale-[1.04]" />
                    <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 to-transparent" />
                    <figcaption className="absolute inset-x-2.5 bottom-2.5 text-[12px] leading-snug">
                      <span className="flex items-center gap-1.5 font-semibold text-white">
                        <span className={cn("flex h-4 w-4 items-center justify-center rounded-full text-black", iyi ? "bg-emerald-400" : "bg-rose-400")}>{iyi ? <Check className="h-2.5 w-2.5" strokeWidth={4} /> : <X className="h-2.5 w-2.5" strokeWidth={4} />}</span>
                        {iyi ? "İyi olur" : "Kaçın"}
                      </span>
                      <span className="mt-0.5 block text-white/70">{metin}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-px border-t border-white/[0.06] bg-white/[0.06] sm:grid-cols-4">
              {([
                ["Bedel", <><KrediJeton boyut={13} />{birim} kredi</>],
                ["Süre", <><Clock className="h-3.5 w-3.5 text-white/60" />{p.sureSn} sn</>],
                ["Gereken", <><g.ikon className="h-3.5 w-3.5 text-white/60" />{g.ad}</>],
                ["Tür", kategoriler.length ? <>{(() => { const I = KAT_IKON[kategoriler[0]] ?? Sparkles; return <I className="h-3.5 w-3.5 text-white/60" />; })()}{KATEGORI_AD[kategoriler[0]] ?? kategoriler[0]}</> : "Viral"],
              ] as const).map(([k, v]) => (
                <div key={k} className="min-w-0 bg-[#111214] px-4 py-3 sm:px-3.5 xl:px-4"><dt className="text-[11.5px] text-white/45">{k}</dt><dd className="mt-1 flex items-center gap-1.5 truncate whitespace-nowrap text-[13.5px] [&>svg]:shrink-0 font-semibold tabular-nums text-white">{v}</dd></div>
              ))}
            </dl>
          </motion.section>

          {/* Sahne kartı: önce / sonra */}
          <section className="relative flex items-center justify-center overflow-hidden rounded-[28px] bg-black/25 p-4 ring-1 ring-inset ring-white/[0.07] backdrop-blur-xl sm:p-6">
            <OnceSonra p={p} ek={ek} foto={foto} oran={oran} girdiAd={g.slot} ipucu={g.ipucu} onFoto={onFoto} />
          </section>
        </div>

        {/* Karışım önerileri */}
        {karisimOneri.length > 0 && (
          <section className="mt-4 overflow-hidden rounded-[26px] bg-[#111214]/90 ring-1 ring-inset ring-white/[0.08] backdrop-blur-xl">
            <header className="border-b border-white/[0.06] px-5 py-4">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-white">Bu efektle iyi gider</h2>
              <p className="mt-0.5 text-[13px] text-white/50">İkinci efekt atmosfer katar; bedelinin yarısı eklenir.</p>
            </header>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {karisimOneri.map(([a, b, ad]) => {
                const diger = RESMI_PRESETLER.find((x) => x.slug === (a === p.slug ? b : a));
                if (!diger) return null;
                const secili = ek?.slug === diger.slug;
                return (
                  <button key={a + b} onClick={() => { setEk(secili ? null : diger); if (!secili) toast.success(`${diger.ad} eklendi`, { description: `İkinci efekt olarak eklendi, +${Math.ceil(diger.kredi / 2)} kredi.` }); }}
                    className={cn("group flex items-center gap-3 rounded-[20px] p-2.5 text-left ring-1 ring-inset transition", secili ? "bg-white/[0.09] ring-white/40" : "bg-white/[0.03] ring-white/[0.08] hover:bg-white/[0.06]")}>
                    <span className="relative flex h-16 w-24 shrink-0 overflow-hidden rounded-[14px]">
                      <span className="relative w-1/2 overflow-hidden"><PresetKapak p={p} kucuk /></span>
                      <span className="relative w-1/2 overflow-hidden border-l border-zemin"><PresetKapak p={diger} kucuk /></span>
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-[14.5px] font-semibold text-white">{ad}</span>
                      <span lang="en" className="mt-0.5 block truncate text-[12.5px] text-white/50">ve {diger.ad} · +{Math.ceil(diger.kredi / 2)} kredi</span>
                    </span>
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition", secili ? "bg-white text-black" : "bg-white/[0.07] text-white group-hover:bg-white group-hover:text-black")}>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span key={String(secili)} initial={{ scale: 0.5, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}>{secili ? <Check className="h-4 w-4" strokeWidth={3} /> : <Plus className="h-4 w-4" />}</motion.span>
                      </AnimatePresence>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Benzer efektler */}
        {benzer.length > 0 && <BenzerRaf liste={benzer} />}
      </div>
    </div>
  );
}

function BenzerRaf({ liste }: { liste: KatalogPreset[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const kayitliListe = usePresetler((s) => s.kayitli);
  const kayitDegis = usePresetler((s) => s.kayitDegis);
  return (
    <section className="mt-6 overflow-hidden rounded-[26px] bg-[#111214]/90 ring-1 ring-inset ring-white/[0.08] backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
        <div>
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-white">Benzer efektler</h2>
          <p className="mt-0.5 text-[13px] text-white/50">Fotoğrafın seninle gelir; yeniden yüklemen gerekmez.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Link href="/panel/presetler" className="mr-1 inline-flex h-10 items-center rounded-full bg-white/[0.06] px-4 text-[13px] font-medium text-white/80 transition hover:bg-white/[0.1] hover:text-white">Tümü</Link>
          {[-1, 1].map((d) => (
            <button key={d} onClick={() => ref.current?.scrollBy({ left: d * 640, behavior: "smooth" })} aria-label={d < 0 ? "Geri" : "İleri"}
              className="hidden h-10 w-10 items-center justify-center rounded-full text-white ring-1 ring-white/[0.12] transition hover:bg-white/[0.06] active:scale-90 sm:flex">
              <ArrowRight className={cn("h-4 w-4", d < 0 && "rotate-180")} />
            </button>
          ))}
        </div>
      </div>
      <div ref={ref} className="gizli-scroll flex snap-x scroll-px-4 gap-2 overflow-x-auto p-4 sm:scroll-px-5 sm:p-5">
        {liste.map((x) => (
          <div key={x.slug} className="w-[160px] shrink-0 snap-start sm:w-[190px]">
            <GaleriKart p={x} href={`/panel/presetler/${x.slug}`} kayitli={kayitliListe.includes(x.slug)} onKayit={() => kayitDegis(x.slug)} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Önce/sonra: fotoğrafın (ya da büyük bırakma alanı), akış oku ve seçili oranda örnek sonuç. */
function OnceSonra({ p, ek, foto, oran, girdiAd, ipucu, onFoto }: {
  p: KatalogPreset; ek: KatalogPreset | null; foto: Medya | null; oran: string; girdiAd: string; ipucu: string; onFoto: (m: Medya) => void;
}) {
  const [w, h] = ORAN_BOY[oran] ?? [9, 16];
  const yatay = w > h;
  const [surukle, setSurukle] = useState(false);
  const [isleniyor, setIsleniyor] = useState(false);
  const [kitaplik, setKitaplik] = useState(false);
  const al = async (d?: File | null) => { setIsleniyor(true); const m = await fotoOku(d); setIsleniyor(false); if (m) onFoto(m); };
  // Geniş ekranda sonuç kartı ekran yüksekliğine sığar (komut kutusunun üstünde kalır).
  const H = "calc(100dvh - var(--ust-nav) - 64px - 300px)";
  const sonraW = yatay ? "w-full max-w-[640px]" : oran === "1:1" ? "w-[50%] max-w-[420px] sm:w-[56%] lg:w-auto lg:max-w-none" : "w-[50%] max-w-[340px] sm:w-[54%] lg:w-auto lg:max-w-none";
  return (
    <div className={cn("flex w-full items-center justify-center gap-2 sm:gap-6 xl:gap-8", yatay && "max-md:flex-col")}>
      {/* Önce */}
      <div className={cn("shrink-0", yatay ? "w-[min(280px,34vw)] max-md:w-[64%]" : "w-[33%] max-w-[270px] sm:w-[38%] lg:w-auto lg:max-w-none")} style={!yatay ? { ["--once-h" as string]: `min(calc(${H} * 0.84), 520px)` } : undefined}>
        <div onDragOver={(e) => { e.preventDefault(); setSurukle(true); }} onDragLeave={() => setSurukle(false)} onDrop={(e) => { e.preventDefault(); setSurukle(false); void al(e.dataTransfer.files[0]); }}
          className={cn("group relative aspect-[3/4] overflow-hidden rounded-[24px] transition", !yatay && "lg:h-[var(--once-h)]", foto ? "ring-1 ring-inset ring-white/15" : cn("bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] ring-1 ring-inset", surukle ? "scale-[1.02] ring-2 ring-white" : "ring-white/[0.12] hover:ring-white/25"))}>
          {foto && !kitaplik && <span className="absolute left-3 top-3 z-[2] rounded-full bg-black/45 px-2.5 py-1 text-[11.5px] font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl">Senin fotoğrafın</span>}
          <AnimatePresence initial={false} mode="popLayout">
            {kitaplik && !foto ? (
              <motion.div key="kitaplik" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col bg-[#141416]">
                <div className="min-h-0 flex-1 overflow-y-auto p-2.5 [scrollbar-width:thin]"><KitaplikListe onSec={(m) => { onFoto(m); setKitaplik(false); }} /></div>
                <button onClick={() => setKitaplik(false)} className="m-2.5 mt-0 flex h-9 items-center justify-center rounded-full bg-white/[0.07] text-[12.5px] font-medium text-white/80 transition hover:bg-white/[0.12]">Vazgeç</button>
              </motion.div>
            ) : foto ? (
              <motion.div key={foto.url} initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease }} className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={foto.url} alt="Senin fotoğrafın" className="absolute inset-0 h-full w-full object-cover" />
                <button onClick={() => document.getElementById("preset-foto-girdi")?.click()}
                  className="absolute inset-x-3 bottom-3 flex h-9 translate-y-1 items-center justify-center gap-1.5 rounded-full bg-black/45 text-[12.5px] font-semibold text-white opacity-0 ring-1 ring-white/[0.15] backdrop-blur-xl transition group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">
                  <ImagePlus className="h-3.5 w-3.5" />Değiştir
                </button>
              </motion.div>
            ) : (
              <motion.div key="bos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col">
                <button onClick={() => document.getElementById("preset-foto-girdi")?.click()} aria-label="Fotoğrafını ekle" className="relative flex flex-1 flex-col items-center justify-center gap-2.5 px-4 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black transition-transform group-hover:scale-105 sm:h-14 sm:w-14">{isleniyor ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}</span>
                  <span className="text-[14px] font-semibold leading-tight text-white sm:text-[16px]">{girdiAd === "Fotoğraf" ? "Fotoğrafını ekle" : `${girdiAd} fotoğrafı ekle`}</span>
                  <span className="text-[12.5px] leading-snug text-white/60 max-sm:hidden">{ipucu}</span>
                </button>
                <div className="relative flex flex-col items-center gap-1.5 border-t border-white/[0.07] px-2 py-2.5 max-sm:hidden">
                  <button onClick={() => setKitaplik(true)} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] font-medium text-white/85 transition hover:bg-white/[0.13] hover:text-white"><Images className="h-3.5 w-3.5" />Kitaplıktan seç</button>
                  <span className="whitespace-nowrap text-[11.5px] text-white/45 [@media(hover:none)]:hidden">Sürükle bırak ya da Ctrl V</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Akış */}
      <div className={cn("flex shrink-0 flex-col items-center gap-2", yatay && "max-md:flex-row")}>
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white text-black sm:h-12 sm:w-12">
          {foto && <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />}
          {ek ? <Shuffle className="relative h-5 w-5" /> : <ArrowRight className={cn("relative h-5 w-5", yatay && "max-md:rotate-90")} strokeWidth={2.4} />}
        </span>
      </div>

      {/* Sonra */}
      <div className={cn("shrink-0", sonraW, yatay && "max-md:w-full")}>
        <motion.div transition={{ duration: 0.4, ease }} className={cn("relative overflow-hidden rounded-[28px] bg-black ring-1 ring-inset ring-white/15", !yatay && "lg:h-[var(--sonra-h)]")} style={{ aspectRatio: `${w} / ${h}`, ["--sonra-h" as string]: `min(${H}, 680px)` }}>
          <PresetVideo p={p} oyna />
          {ek && <span className="absolute inset-0 opacity-35 mix-blend-screen"><PresetKapak p={ek} /></span>}
          <span className="absolute inset-x-3 top-3 flex items-center justify-between">
            <span className="rounded-full bg-black/45 px-2.5 py-1 text-[11.5px] font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl">{p.video ? "Örnek sonuç" : "Önizleme"}</span>
            <span className="rounded-full bg-black/45 px-2.5 py-1 text-[11.5px] font-medium tabular-nums text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl">{oran}</span>
          </span>
          {foto && (
            // eslint-disable-next-line @next/next/no-img-element
            <motion.img initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} src={foto.url} alt="" className="absolute bottom-3 left-3 h-12 w-12 rounded-full object-cover ring-2 ring-white" />
          )}
        </motion.div>
      </div>
    </div>
  );
}

/** Künyede yaratıcı: Vayra ya da topluluk üyesi; takip, beğeni ve yaratıcı payı notu. */
function YaraticiSatiri({ p }: { p: KatalogPreset }) {
  const { begenilen, takip, begeniDegis, takipDegis } = usePresetler();
  const benim = tutamac(useAuth((s) => s.kullanici?.ad));
  const y = yaraticiBul(p.yazar);
  const begendi = begenilen.includes(p.slug), takipte = !!p.yazar && takip.includes(p.yazar);
  return (
    <div className="mt-4 flex items-center gap-2 rounded-[18px] bg-white/[0.04] p-2 pl-2.5 ring-1 ring-inset ring-white/[0.07]">
      <Link href={p.yazar ? `/panel/presetler?yaratici=${encodeURIComponent(p.yazar)}` : "/panel/presetler?kim=vayra"} className="flex min-w-0 flex-1 items-center gap-2.5 pr-1">
        <YaraticiAvatar yazar={p.yazar} boyut={36} />
        <span className="min-w-0 text-left leading-tight"><span className="flex items-center gap-1 text-[14px] font-semibold text-white"><span className="truncate">{p.yazar ? (p.yazar === benim ? "Sen" : y?.ad ?? p.yazar) : "Vayra"}</span>{(!p.yazar || y?.dogrulanmis) && <BadgeCheck className="h-3.5 w-3.5 shrink-0" />}</span><span className="block truncate text-[12px] text-white/55">{p.yazar ? `${sayiKisa(p.kullanimSayi ?? 0)} kullanım${p.ekKredi ? ` · ${yaraticiPayi(p.ekKredi)} kredisi yaratıcıya` : ""}` : `Resmi Vayra efekti · ${sayiKisa(p.kullanimSayi ?? 0)} kullanım`}</span></span>
      </Link>
      <button onClick={() => { const v = begeniDegis(p.slug); if (v) toast.success("Beğendin", { description: p.ad }); }} aria-pressed={begendi} className={cn("flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium tabular-nums transition active:scale-95", begendi ? "bg-white text-rose-500" : "bg-white/[0.07] text-white/80 hover:bg-white/[0.12]")}><Heart className={cn("h-3.5 w-3.5", begendi && "fill-current")} />{sayiKisa((p.begeniSayi ?? 0) + (begendi ? 1 : 0))}</button>
      {p.yazar && p.yazar !== benim && <button onClick={() => { const v = takipDegis(p.yazar!); toast.success(v ? `${p.yazar} takip ediliyor` : "Takipten çıkıldı"); }} aria-pressed={takipte} className={cn("flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition active:scale-95", takipte ? "bg-white/[0.08] text-white" : "bg-white text-black")}>{takipte ? <><Check className="h-3.5 w-3.5" />Takipte</> : <><UserPlus className="h-3.5 w-3.5" />Takip et</>}</button>}
    </div>
  );
}
