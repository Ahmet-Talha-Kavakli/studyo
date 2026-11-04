"use client";

/**
 * Kitaplığın üst kartı (2026-10-29, "A · Kitaplık kartı"): başlık şeridi (ad, sayı, sürenler, Yeni klasör + Yükle),
 * içerik (türlerin kapaklı sayaç karoları + son üretim), alt şerit (toplam, harcanan kredi, cihaz depolaması,
 * en çok kullanılan modeller). Karolar ve model logoları galerinin süzgeçlerini sürer; sayılar gerçek veriden gelir.
 */

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, ChevronLeft, Crown, FolderPlus, HardDrive, Layers, Loader2, Play, RotateCcw, Trash2, Upload } from "lucide-react";
import { KrediJeton } from "@/components/ui/KrediHap";
import type { Uretim } from "@/store/useProjeler";
import { ModelLogo } from "./Simgeler";
import { TURLER, kapakUrl, uretimTuru, type Tur } from "./yardimci";
import { goreliZaman } from "@/components/panel/element/sayfa/ElementKart";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;
export const KART = "overflow-hidden rounded-[26px] bg-[#111214] ring-1 ring-inset ring-white/[0.08]";
const SERIT = "flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5";
const ALT = "flex flex-wrap items-center justify-between gap-x-5 gap-y-2.5 border-t border-white/[0.06] px-4 py-3 sm:px-5";
export const Hap = ({ children, className }: { children: React.ReactNode; className?: string }) =>
  <span className={cn("rounded-full bg-white/[0.08] px-2 py-0.5 text-[12px] font-medium tabular-nums text-white/75", className)}>{children}</span>;

/** Sayaç: kare başı değer React state'e yazılmaz, metne doğrudan bağlanır. */
export function Sayac({ n, className }: { n: number; className?: string }) {
  const mv = useMotionValue(0);
  const metin = useTransform(mv, (v) => Math.round(v).toLocaleString("tr-TR"));
  useEffect(() => { const a = animate(mv, n, { duration: 0.9, ease }); return () => a.stop(); }, [n, mv]);
  return <motion.span className={className}>{metin}</motion.span>;
}

const sureKapak = (u: Uretim) => kapakUrl(u) || u.meta?.demoKlip?.poster;
const sureVideo = (u: Uretim) => u.videoUrl || u.meta?.demoKlip?.video;

export function KitaplikKarti({
  baslik, onKapsamTemizle, kapsamdakiler, tumu, tur, onTur, aktifIs, yukleniyor, onYukle, onYeniKlasor,
  onAc, onTekrar, depolamaKb, modelSec, onModel, copModu, copSayi, onCopBosalt,
}: {
  baslik?: string; onKapsamTemizle: () => void;
  kapsamdakiler: Uretim[]; tumu: Uretim[]; tur: Tur | null; onTur: (t: Tur | null) => void;
  aktifIs: number; yukleniyor: number; onYukle: () => void; onYeniKlasor: () => void;
  onAc: (u: Uretim) => void; onTekrar: (u: Uretim) => void;
  depolamaKb: number; modelSec: string | null; onModel: (m: string | null) => void;
  copModu: boolean; copSayi: number; onCopBosalt: () => void;
}) {
  const bitenler = useMemo(() => kapsamdakiler.filter((u) => u.durum === "tamam"), [kapsamdakiler]);
  const son = useMemo(() => bitenler.reduce<Uretim | undefined>((a, u) => (!a || u.olusturma > a.olusturma ? u : a), undefined), [bitenler]);
  const turSayilari = useMemo(() => {
    const t = { gorsel: 0, video: 0, ses: 0, muzik: 0, "3d": 0 } as Record<Tur, number>;
    for (const u of kapsamdakiler) t[uretimTuru(u)]++;
    return t;
  }, [kapsamdakiler]);
  const toplam = kapsamdakiler.length;
  const demoSayi = useMemo(() => kapsamdakiler.filter((u) => u.gercek === false).length, [kapsamdakiler]);
  const kredi = useMemo(() => kapsamdakiler.reduce((a, u) => a + (u.durum === "hata" ? 0 : u.kredi ?? 0), 0), [kapsamdakiler]);
  const enCok = useMemo(() => {
    const say = new Map<string, number>();
    for (const u of tumu) if (u.arac !== "Yükleme" && u.model !== "Yükleme") say.set(u.model, (say.get(u.model) ?? 0) + 1);
    return [...say.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [tumu]);
  /* Hiç üretim yokken içerik ve alt şerit gizlenir; başlangıç kartı aşağıda yolu gösterir. */
  const bosKitaplik = toplam === 0 && !baslik && !copModu;
  const haftalik = useMemo(() => kapsamdakiler.filter((u) => Date.now() - u.olusturma < 7 * 86_400_000).length, [kapsamdakiler]);
  const depoYuzde = Math.min(100, (depolamaKb / 10240) * 100);

  return (
    <section className={KART} aria-label="Kitaplık özeti">
      <header className={cn(SERIT, bosKitaplik && "border-b-0")}>
        <div className="flex min-w-0 items-center gap-2.5">
          {baslik && (
            <button onClick={onKapsamTemizle} aria-label="Tüm kitaplığa dön" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white/85 transition hover:bg-white/[0.12]"><ChevronLeft className="h-4 w-4" /></button>
          )}
          <h1 className="truncate text-[22px] font-semibold tracking-[-0.025em] text-white">{baslik ?? "Kitaplık"}</h1>
          <Hap><Sayac n={toplam} /> {copModu ? "öğe" : "üretim"}</Hap>
          <AnimatePresence>
            {aktifIs > 0 && (
              <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} aria-live="polite"
                className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[12px] font-medium text-white/85">
                <Loader2 className="h-3 w-3 animate-spin text-white" />{aktifIs} sürüyor
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {copModu ? (
          copSayi > 0 && <motion.button whileTap={{ scale: 0.96 }} onClick={onCopBosalt} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13.5px] font-medium text-rose-300 transition hover:bg-rose-500/15"><Trash2 className="h-4 w-4" />Çöpü boşalt</motion.button>
        ) : (
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.96 }} onClick={onYeniKlasor} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13.5px] font-medium text-white/90 transition hover:bg-white/[0.12]"><FolderPlus className="h-4 w-4" />Yeni proje</motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={onYukle} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition hover:bg-white/90">
              {yukleniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{yukleniyor ? `${yukleniyor} yükleniyor` : "Yükle"}
            </motion.button>
          </div>
        )}
      </header>

      {!copModu && !bosKitaplik && (
        <div className="grid gap-3 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
          <div className="gizli-scroll -mx-3 flex snap-x scroll-px-3 gap-2 overflow-x-auto px-3 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
            {TURLER.map((t, i) => (
              <TurKarosu key={t.id} t={t} i={i} n={turSayilari[t.id]} secili={tur === t.id}
                kapaklar={bitenler.filter((u) => uretimTuru(u) === t.id).map(sureKapak).filter(Boolean).slice(0, 3) as string[]}
                onClick={() => onTur(tur === t.id ? null : t.id)} />
            ))}
          </div>
          {son ? <SonUretim u={son} onAc={onAc} onTekrar={onTekrar} /> : (
            <div className="flex min-h-[200px] flex-col items-start justify-end rounded-[18px] bg-white/[0.04] p-4">
              <p className="text-[15px] font-semibold text-white">Burada henüz üretim yok</p>
              <p className="mt-1 text-[13px] text-white/60">Stüdyoda ürettiğin ya da yüklediğin her şey buraya düşer.</p>
              <Link href="/panel/gorsel" className="mt-3 flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black">Üretmeye başla<ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          )}
        </div>
      )}

      {!(copModu && copSayi === 0) && !bosKitaplik && <footer className={copModu ? ALT : "border-t border-white/[0.06]"}>
        {copModu ? (
          <span className="text-[13px] text-white/65">Sildiğin üretimler 30 gün burada bekler, sonra kalıcı olarak silinir. Geri almak için seç.</span>
        ) : (
          <div className="grid grid-cols-2 gap-px bg-white/[0.06] lg:grid-cols-[0.9fr_1fr_1.2fr_1.9fr]">
            <Hucre ikon={<Layers className="h-3.5 w-3.5" />} etiket="Üretim" alt={haftalik ? `Bu hafta ${haftalik} yeni` : son ? `Son üretim ${goreliZaman(son.olusturma)}` : "Henüz yok"}>
              <Sayac n={toplam} />
            </Hucre>
            <Hucre ikon={<KrediJeton boyut={13} />} etiket="Harcanan kredi" alt={toplam ? `Üretim başına ortalama ${Math.round(kredi / toplam)}` : "Henüz harcama yok"}>
              <Sayac n={kredi} />
            </Hucre>
            <Hucre ikon={<HardDrive className="h-3.5 w-3.5" />} etiket="Cihaz depolaması" className="max-lg:col-span-2 max-sm:hidden" baslik="Kitaplık bu cihazın tarayıcı depolamasında tutulur; sınır yaklaşık 10 MB."
              alt={<span className="flex items-center gap-2"><span className="flex flex-1 gap-[3px]">{Array.from({ length: 20 }).map((_, i) => (
                <motion.span key={i} initial={{ opacity: 0, scaleY: 0.4 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ delay: 0.3 + i * 0.025, duration: 0.3 }}
                  className={cn("h-2 flex-1 rounded-[2px]", i < Math.max(1, Math.round(depoYuzde / 5)) ? (depoYuzde > 80 ? "bg-amber-300" : "bg-white/85") : "bg-white/[0.1]")} />
              ))}</span><span className="shrink-0 tabular-nums">%{Math.max(1, Math.round(depoYuzde))} dolu</span></span>}>
              {depolamaKb < 1024 ? depolamaKb : (depolamaKb / 1024).toFixed(1)}<span className="ml-1 text-[14px] font-medium text-white/55">{depolamaKb < 1024 ? "KB" : "MB"} / 10 MB</span>
            </Hucre>
            <div className="col-span-2 min-w-0 bg-[#111214] px-4 py-3.5 max-sm:hidden sm:px-5 lg:col-span-1">
              <p className="flex items-center gap-1.5 text-[12.5px] text-white/60"><Crown className="h-3.5 w-3.5" />En çok kullandığın</p>
              {enCok.length ? (
                <div className="gizli-scroll mt-2 flex gap-1.5 overflow-x-auto">
                  {enCok.map(([m, n], i) => {
                    const sec = modelSec === m;
                    return (
                      <motion.button key={m} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }} whileTap={{ scale: 0.96 }}
                        onClick={() => onModel(sec ? null : m)} aria-pressed={sec} title={sec ? "Süzgeci kaldır" : `Yalnız ${m} üretimlerini göster`}
                        className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-full pl-1 pr-2.5 text-[12.5px] font-medium transition", sec ? "bg-white text-black" : "bg-white/[0.06] text-white/90 hover:bg-white/[0.1]")}>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1b1c1f]"><ModelLogo ad={m} boyut={14} /></span>
                        <span className="max-w-[110px] truncate">{m}</span>
                        <span className={cn("rounded-full px-1.5 text-[11.5px] tabular-nums", sec ? "bg-black/10 text-black/65" : "bg-white/[0.08] text-white/60")}>{n}</span>
                      </motion.button>
                    );
                  })}
                </div>
              ) : <p className="mt-2 text-[13px] text-white/55">İlk üretiminden sonra burada görünür.</p>}
            </div>
          </div>
        )}
      </footer>}
    </section>
  );
}

function Hucre({ ikon, etiket, alt, baslik, className, children }: { ikon: React.ReactNode; etiket: string; alt: React.ReactNode; baslik?: string; className?: string; children: React.ReactNode }) {
  return (
    <div title={baslik} className={cn("min-w-0 bg-[#111214] px-4 py-3.5 sm:px-5", className)}>
      <p className="flex items-center gap-1.5 text-[12.5px] text-white/60">{ikon}{etiket}</p>
      <p className="mt-1 text-[22px] font-semibold tabular-nums leading-tight tracking-[-0.02em] text-white">{children}</p>
      <div className="mt-1 truncate text-[12px] text-white/55">{alt}</div>
    </div>
  );
}

function TurKarosu({ t, i, n, secili, kapaklar, onClick }: { t: (typeof TURLER)[number]; i: number; n: number; secili: boolean; kapaklar: string[]; onClick: () => void }) {
  const bos = n === 0;
  const icerik = (
    <>
      {kapaklar.map((src, j) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src + j} src={src} alt="" loading="lazy"
          className="absolute h-[58%] w-[58%] rounded-[10px] object-cover ring-1 ring-black/40 transition-transform duration-500 ease-out group-hover:-translate-y-1"
          style={{ left: `${10 + j * 14}%`, top: `${8 + j * 5}%`, rotate: `${(j - 1) * 6}deg`, zIndex: 3 - j }} />
      ))}
      {bos && <span className="absolute left-1/2 top-[36%] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.06]"><t.ikon className="h-5 w-5 text-white/55" /></span>}
      <span className="absolute inset-0 bg-gradient-to-t from-[#111214] via-[#111214]/45 to-transparent" />
      <AnimatePresence>
      </AnimatePresence>
      <span className="relative z-[4] flex w-full items-end justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate text-[14.5px] font-semibold text-white">{t.cogul}</span>
          {bos && <span className="mt-0.5 flex items-center gap-1 text-[12px] text-white/60">Stüdyoya git<ArrowRight className="h-3 w-3" /></span>}
        </span>
        {!bos && <Sayac n={n} className="text-[24px] font-semibold tabular-nums leading-none tracking-[-0.02em] text-white" />}
      </span>
    </>
  );
  const sinif = cn("group relative flex aspect-[4/5] w-full flex-col justify-end overflow-hidden rounded-[18px] bg-white/[0.04] p-3 text-left outline outline-2 -outline-offset-2 transition-[outline-color,background-color] hover:bg-white/[0.06]",
    secili ? "outline-white" : "outline-transparent");
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.45, ease }} className="w-[138px] shrink-0 snap-start sm:w-auto">
      {bos ? <Link href={t.studyo} className={sinif}>{icerik}</Link> : <button onClick={onClick} aria-pressed={secili} className={sinif}>{icerik}</button>}
    </motion.div>
  );
}

function SonUretim({ u, onAc, onTekrar }: { u: Uretim; onAc: (u: Uretim) => void; onTekrar: (u: Uretim) => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const kapak = sureKapak(u);
  const video = sureVideo(u);
  const sesli = uretimTuru(u) === "ses" || uretimTuru(u) === "muzik";
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5, ease }}
      onMouseEnter={() => ref.current?.play().catch(() => {})} onMouseLeave={() => { const v = ref.current; if (v) { v.pause(); v.currentTime = 0; } }}
      className="group relative flex min-h-[230px] overflow-hidden rounded-[18px] bg-[#16171a] max-sm:hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {kapak && <img src={kapak} alt="" className={cn("absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]", sesli && "scale-110 opacity-50 blur-[2px]")} />}
      {video && <video ref={ref} src={video} muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />}
      <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/5" />
      <span className="absolute left-3 top-3 flex gap-1.5">
        <span className="rounded-full bg-black/45 px-2.5 py-1 text-[11.5px] font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl">Son üretim</span>
      </span>
      {video && <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl transition-opacity group-hover:opacity-0"><Play className="ml-0.5 h-3 w-3 fill-current" /></span>}
      <div className="relative mt-auto w-full p-4">
        <p className="text-[15px] font-semibold leading-snug text-white">{u.baslik || u.prompt}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2 text-[12.5px] text-white/75">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/40 ring-1 ring-inset ring-white/15"><ModelLogo ad={u.model} boyut={14} /></span>
            <span className="truncate">{u.model}</span><span className="shrink-0 text-white/50">· {goreliZaman(u.olusturma)}</span>
          </span>
          <span className="flex shrink-0 gap-1.5">
            <motion.button whileTap={{ scale: 0.94 }} onClick={() => onTekrar(u)} aria-label="Bu istemle yeniden üret" title="Bu istemle yeniden üret"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.14] text-white ring-1 ring-inset ring-white/15 backdrop-blur-xl transition hover:bg-white/[0.22]"><RotateCcw className="h-4 w-4" /></motion.button>
            <motion.button whileTap={{ scale: 0.94 }} onClick={() => onAc(u)} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black">Aç<ArrowRight className="h-3.5 w-3.5" /></motion.button>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
