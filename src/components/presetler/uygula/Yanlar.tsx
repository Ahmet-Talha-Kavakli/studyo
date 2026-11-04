"use client";

/** Preset sayfasının yan parçaları: Sonuçların, Nasıl çalışır, efekt seçici, kitaplık seçici, küçük simgeler. */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Check, Film, ImagePlus, Images, LayoutGrid, Play, Search, Shuffle, Sparkles, X } from "lucide-react";
import { useProjeler } from "@/store/useProjeler";
import { KATEGORI_AD, KATEGORI_SIRA, type KatalogPreset } from "@/lib/presetKatalog";
import { kapakUrl } from "@/components/kitaplik/yardimci";
import { UretimKarti } from "@/components/panel/UretimKarti";
import { KrediJeton } from "@/components/ui/KrediHap";
import { cn } from "@/lib/utils";
import { KAT_IKON, PresetKapak, PresetVideo } from "../PresetKarti";
import { ESANLAM, GIRDI, presetGirdi, trNorm, type Medya } from "../presetOrtak";

const yay = { type: "spring" as const, stiffness: 420, damping: 34 };
const ease = [0.22, 1, 0.36, 1] as const;
export const ORAN_BOY: Record<string, [number, number]> = { "9:16": [9, 16], "1:1": [1, 1], "16:9": [16, 9] };
export const ORAN_NOT: Record<string, string> = { "9:16": "Reels, TikTok, Shorts", "1:1": "Gönderi", "16:9": "YouTube, sunum" };
type Uretim = ReturnType<typeof useProjeler.getState>["uretimler"][number];

export function OranSimge({ oran, kucuk }: { oran: string; kucuk?: boolean }) {
  const [w, h] = ORAN_BOY[oran] ?? [9, 16]; const k = (kucuk ? 13 : 16) / Math.max(w, h);
  const gw = w * k, gh = h * k;
  return (
    <svg width={gw + 2} height={gh + 2} viewBox={`0 0 ${gw + 2} ${gh + 2}`} fill="none" aria-hidden className="shrink-0 text-white">
      <rect x={1} y={1} width={gw} height={gh} rx={3} stroke="currentColor" strokeWidth={1.6} />
    </svg>
  );
}

export function BagDurum({ bagli }: { bagli: boolean | null }) {
  if (bagli === null) return null;
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1", bagli ? "text-emerald-300" : "text-amber-200")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", bagli ? "bg-emerald-400" : "bg-amber-300")} />{bagli ? "Bağlı" : "Bağlı değil"}
    </span>
  );
}

/** Parlak camgöbeği kredi jetonu (galerideki kartlarla aynı). */
export function Jeton({ boyut = 20 }: { boyut?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#a5ecff,#55d6fd_45%,#1f9ec9)] ring-1 ring-inset ring-white/40" style={{ width: boyut, height: boyut }}>
      <KrediJeton boyut={Math.round(boyut * 0.55)} className="[&>path]:fill-white" />
    </span>
  );
}

/* ───────── Sonuçların ───────── */

const KART = "overflow-hidden rounded-[28px] bg-[#111214] ring-1 ring-inset ring-white/[0.08]";
const SERIT = "flex min-h-[62px] flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-2.5 sm:px-5";
const SIMGE = "flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white";

export function Sonuclar({ liste, tumu, p, onOnizleme }: { liste: Uretim[]; tumu: Uretim[]; p: KatalogPreset; onOnizleme: () => void }) {
  const [kapsam, setKapsam] = useState<"bu" | "tumu">("bu");
  const l = kapsam === "bu" ? liste : tumu;
  return (
    <div className="mx-auto w-full max-w-[1480px] px-4 pb-52 pt-5 sm:px-6 sm:pt-6">
      <section className={KART}>
        <header className={SERIT}>
          <span className={SIMGE}><Film className="h-[18px] w-[18px]" /></span>
          <h2 className="min-w-0 truncate text-[17px] font-semibold tracking-[-0.02em] text-white">{kapsam === "bu" ? `${p.ad} ile ürettiklerin` : "Tüm preset videoların"}</h2>
          {l.length > 0 && <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[12px] font-medium tabular-nums text-white/60">{l.length}</span>}
          <LayoutGroup id="sonuc-kapsam">
            <div className="ml-auto flex h-9 items-center gap-0.5 rounded-full bg-white/[0.06] p-0.5">
              {([["bu", "Bu efekt", liste.length], ["tumu", "Tümü", tumu.length]] as const).map(([id, ad, n]) => (
                <button key={id} onClick={() => setKapsam(id)} aria-pressed={kapsam === id} className="relative flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium active:scale-[0.97]">
                  {kapsam === id && <motion.span layoutId="sonuc-kapsam-z" className="absolute inset-0 rounded-full bg-white" transition={yay} />}
                  <span className={cn("relative", kapsam === id ? "text-black" : "text-white/60")}>{ad}</span>
                  {n > 0 && <span className={cn("relative text-[11.5px] tabular-nums", kapsam === id ? "text-black/45" : "text-white/35")}>{n}</span>}
                </button>
              ))}
            </div>
          </LayoutGroup>
        </header>
        <div className="p-3 sm:p-4">
          {l.length ? (
            <div className="columns-2 gap-3 md:columns-3 xl:columns-4">
              {l.map((u, i) => (
                <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }} className="relative mb-3 break-inside-avoid">
                  <UretimKarti u={u} kutuBoyut="orta" />
                  {u.gercek === false && u.durum === "tamam" && (
                    <span className="hidden" />
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-start gap-4 rounded-[20px] bg-white/[0.025] p-4 ring-1 ring-inset ring-white/[0.06] sm:flex-row sm:items-center">
              <span className="relative h-16 w-11 shrink-0 overflow-hidden rounded-[12px] ring-1 ring-white/10"><PresetKapak p={p} kucuk /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-white">Henüz video yok</p>
                <p className="mt-0.5 text-[13px] text-white/55">Fotoğrafını ekleyip Oluştur&apos;a bas; videoların birkaç dakikada burada belirir.</p>
              </div>
              <button onClick={onOnizleme} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black active:scale-[0.97]"><Play className="h-3.5 w-3.5 fill-current" />Önizlemeye dön</button>
            </div>
          )}
        </div>
        <footer className="border-t border-white/[0.06] px-5 py-3 text-[12.5px] text-white/50">Videolar kitaplığına da kaydedilir.</footer>
      </section>
    </div>
  );
}

/* ───────── Nasıl çalışır ───────── */

export function NasilCalisir({ p, foto }: { p: KatalogPreset; foto: Medya | null }) {
  const g = GIRDI[presetGirdi(p)];
  return (
    <div className="mx-auto w-full max-w-[1480px] px-4 pb-52 pt-5 sm:px-6 sm:pt-6">
      <section className={KART}>
        <header className={SERIT}>
          <span className={SIMGE}><Sparkles className="h-[18px] w-[18px]" /></span>
          <h2 className="min-w-0 text-[17px] font-semibold tracking-[-0.02em] text-white">Tek fotoğraftan viral video</h2>
          <span className="ml-auto text-[12.5px] text-white/50 max-md:hidden">Hareket, kamera ve ışık hazır; senin işin fotoğrafı seçmek.</span>
        </header>
        <div className="grid gap-3 p-3 sm:grid-cols-3 sm:p-4">
          {/* 1: fotoğraf */}
          <Adim n={1} baslik="Fotoğrafını ekle" metin={`${g.ipucu}. İstersen mekân ve ürün fotoğrafı da ekle.`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={foto?.url ?? "/gercek/kabuk/ornek-iyi.webp"} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur-md">{foto ? "Senin fotoğrafın" : "Örnek fotoğraf"}</span>
          </Adim>
          {/* 2: ayarlar */}
          <Adim n={2} baslik="Efekti ayarla" metin={`${p.ad} hareketiyle gelir. İstersen ikinci bir efekt ekle; model, kalite ve oranı seç.`}>
            <span className="absolute inset-0 scale-110 opacity-50 blur-2xl"><PresetKapak p={p} /></span>
            <span className="absolute inset-0 flex flex-col justify-center gap-1.5 p-5">
              {([["Efekt", p.ad], ["Model", "Kling 3.0"], ["Kalite", "HD · 1080p"], ["Oran", "9:16"]] as const).map(([k, v], i) => (
                <motion.span key={k} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 * i, duration: 0.4, ease }}
                  className="flex h-10 items-center justify-between rounded-full bg-black/40 px-4 text-[12.5px] ring-1 ring-inset ring-white/15 backdrop-blur-xl">
                  <span className="text-white/55">{k}</span><span lang={k === "Efekt" ? "en" : undefined} className="font-semibold text-white">{v}</span>
                </motion.span>
              ))}
            </span>
          </Adim>
          {/* 3: sonuç */}
          <Adim n={3} baslik="Videonu al" metin="Önce ucuz taslakla dene, beğendiğini HD üret. Video kitaplığına düşer.">
            <PresetVideo p={p} oyna />
            <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur-md"><Play className="h-3 w-3 fill-current" />Örnek sonuç</span>
          </Adim>
        </div>
        <div className="grid gap-2 border-t border-white/[0.06] p-3 sm:grid-cols-3 sm:p-4">
          {([["/gercek/kabuk/ornek-iyi.webp", "İyi sonuç verir", `${g.ipucu}, en az 512 px`, true], ["/gercek/kabuk/ornek-kotu.webp", "Kaçın", "Kalabalık, bulanık, yüzü örtülü ya da kırpık fotoğraflar", false]] as const).map(([src, bb, aa, iyi]) => (
            <div key={bb} className="flex items-center gap-3 rounded-[16px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.06]">
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                <span className={cn("absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-black", iyi ? "bg-emerald-400" : "bg-rose-400")}>{iyi ? <Check className="h-2.5 w-2.5" strokeWidth={4} /> : <X className="h-2.5 w-2.5" strokeWidth={4} />}</span>
              </span>
              <span className="min-w-0 text-[13px] leading-snug"><span className="block font-semibold text-white">{bb}</span><span className="text-white/60">{aa}</span></span>
            </div>
          ))}
          <div className="flex items-center gap-3 rounded-[16px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.06]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-white"><Shuffle className="h-5 w-5" /></span>
            <span className="min-w-0 text-[13px] leading-snug"><span className="block font-semibold text-white">Beklediğin gibi olmadıysa</span><span className="text-white/60">Başka bir fotoğraf ya da benzer bir efekt dene; taslakta denemek ucuzdur.</span></span>
          </div>
        </div>
        <footer className="border-t border-white/[0.06] px-5 py-3 text-[12.5px] leading-relaxed text-white/50">Yüklediğin fotoğraftaki kişinin iznine sahip olduğunu onaylarsın. Videolar &ldquo;Yapay zekâ ile üretildi&rdquo; bilgisini taşır.</footer>
      </section>
    </div>
  );
}

function Adim({ n, baslik, metin, children }: { n: number; baslik: string; metin: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * n, duration: 0.5, ease }} className="overflow-hidden rounded-[22px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#0b0b0d]">
        {children}
        <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[13px] font-semibold text-black">{n}</span>
      </div>
      <div className="p-4">
        <p className="text-[15px] font-semibold tracking-tight text-white">{baslik}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-white/60">{metin}</p>
      </div>
    </motion.div>
  );
}

/* ───────── Kitaplıktan fotoğraf ───────── */

export function KitaplikListe({ onSec }: { onSec: (m: Medya) => void }) {
  const uretimler = useProjeler((s) => s.uretimler);
  const liste = useMemo(() => uretimler.filter((u) => u.durum === "tamam" && u.tur === "gorsel" && kapakUrl(u)).slice(0, 24), [uretimler]);
  return (
    <div>
      <p className="flex items-center gap-1.5 px-1 pb-2 text-[13px] font-semibold text-white"><Images className="h-3.5 w-3.5" />Son görsel üretimlerin</p>
      {liste.length ? (
        <div className="grid max-h-[300px] grid-cols-4 gap-1.5 overflow-y-auto [scrollbar-width:thin]">
          {liste.map((u) => (
            <button key={u.id} role="menuitem" onClick={() => onSec({ url: kapakUrl(u)!, ad: u.baslik })} title={u.baslik}
              className="aspect-square overflow-hidden rounded-[10px] ring-1 ring-inset ring-white/[0.06] transition hover:ring-2 hover:ring-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={kapakUrl(u)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : <p className="px-1 py-6 text-center text-[13px] text-white/45">Kitaplığında henüz görsel yok.</p>}
    </div>
  );
}

/* ───────── Efekt seçici (Değiştir / İkinci efekt) ───────── */

export function PresetSecici({ tumu, seciliSlug, haric, mod, onSec, onKapat }: {
  tumu: KatalogPreset[]; seciliSlug: string | null; haric: string | null; mod: "degistir" | "karistir"; onSec: (p: KatalogPreset) => void; onKapat: () => void;
}) {
  const [q, setQ] = useState("");
  const [kat, setKat] = useState("TUMU");
  const [ustunde, setUstunde] = useState<string | null>(null);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); };
    const eski = document.body.style.overflow; document.body.style.overflow = "hidden";
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = eski; };
  }, [onKapat]);
  const kaynak = tumu.filter((x) => x.slug !== haric && !x.taslak && !(mod === "karistir" && x.ozel));
  const qn = trNorm(q.trim());
  const es = qn ? new Set(ESANLAM.filter(([r]) => r.test(qn)).flatMap(([, s]) => s)) : null;
  const aranan = qn ? kaynak.filter((x) => es!.has(x.slug) || trNorm(`${x.ad} ${x.aciklama} ${x.kategoriler.map((k) => KATEGORI_AD[k] ?? k).join(" ")}`).includes(qn)) : kaynak;
  const kategoriler = KATEGORI_SIRA.filter((k) => aranan.some((x) => x.kategoriler.includes(k)));
  const liste = aranan.filter((x) => kat === "TUMU" || x.kategoriler.includes(kat)).sort((a, b) => a.sira - b.sira);

  return createPortal(
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 top-[var(--ust-nav)] z-[90] bg-black/40" onClick={onKapat}>
        <motion.div role="dialog" aria-modal="true" aria-label={mod === "karistir" ? "İkinci efekti seç" : "Efekt seç"}
          initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 380, damping: 40 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-0 right-0 top-[var(--ust-nav)] flex w-[min(640px,100vw)] flex-col overflow-hidden border-l border-white/[0.08] bg-[#121214]">
          <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-white/[0.06] p-4 sm:p-5">
            <div className="min-w-0 flex-1">
              <p className="text-[20px] font-semibold tracking-[-0.02em] text-white">{mod === "karistir" ? "İkinci efekti seç" : "Efekt seç"}</p>
              <p className="text-[13px] text-white/50">{mod === "karistir" ? "Seçtiğin efekt atmosfer katar; bedelinin yarısı eklenir." : "Fotoğrafın ve ayarların yeni efekte taşınır."}</p>
            </div>
            <label className="relative order-3 w-full">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Efekt ara: ateş, ikiz, uzay" aria-label="Efekt ara" autoFocus
                className="h-11 w-full rounded-full bg-white/[0.06] pl-11 pr-4 text-[14px] text-white outline-none transition placeholder:text-white/40 focus:bg-white/[0.09]" />
            </label>
            <button onClick={onKapat} aria-label="Kapat" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] text-white/70 transition hover:bg-white/[0.12] hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          <div className="px-4 pb-3 pt-3 sm:px-5">
            <LayoutGroup id="secici-kat">
              <div className="gizli-scroll flex gap-0.5 overflow-x-auto rounded-full bg-white/[0.04] p-1 ring-1 ring-inset ring-white/[0.07]">
                {[["TUMU", "Tümü", LayoutGrid] as const, ...kategoriler.map((k) => [k, KATEGORI_AD[k] ?? k, KAT_IKON[k] ?? Sparkles] as const)].map(([id, ad, I]) => (
                  <button key={id} onClick={() => setKat(id)} aria-pressed={kat === id} className="relative flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-[13.5px] font-medium">
                    {kat === id && <motion.span layoutId="secici-kat-z" className="absolute inset-0 rounded-full bg-white" transition={yay} />}
                    <I className={cn("relative h-4 w-4", kat === id ? "text-black" : "text-white/45")} />
                    <span className={cn("relative whitespace-nowrap", kat === id ? "text-black" : "text-white/65")}>{ad}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
          </div>
          <div className="gizli-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-1 sm:px-5">
            {liste.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {liste.map((x) => {
                  const sec = x.slug === seciliSlug;
                  return (
                    <button key={x.slug} onClick={() => onSec(x)} onMouseEnter={() => setUstunde(x.slug)} onMouseLeave={() => setUstunde(null)} aria-pressed={sec}
                      className={cn("group relative aspect-[9/16] overflow-hidden rounded-[14px] text-left transition", sec ? "outline outline-2 -outline-offset-2 outline-white" : "hover:brightness-110")}>
                      <PresetVideo p={x} oyna={ustunde === x.slug} />
                      {sec && <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-black"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>}
                      <span className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-full bg-black/45 py-1 pl-2.5 pr-1 ring-1 ring-white/[0.15] backdrop-blur-xl">
                        <span lang="en" className="min-w-0 flex-1 truncate text-[12px] font-semibold text-white">{x.ad}</span>
                        <span className="flex h-6 shrink-0 items-center gap-1 rounded-full bg-white pl-1 pr-2 text-[11.5px] font-semibold tabular-nums text-black"><Jeton boyut={16} />{mod === "karistir" ? `+${Math.ceil(x.kredi / 2)}` : x.kredi}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : <p className="py-16 text-center text-[14px] text-white/45">Eşleşen efekt yok.</p>}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
