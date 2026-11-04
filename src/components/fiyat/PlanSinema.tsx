"use client";

/**
 * Plan seçimi, "C · Sinematik vitrin" (kullanıcı seçimi 2026-11-04, "çok daha kaliteli").
 * Her plan kendi videosuyla dikey bir şerit; seçilen şerit genişler ve içi açılır: solda fiyat, kredi ve
 * karşılığı, Ultra kredi kademesi, geçiş düğmesi; sağda cam panelde planla gelenler, kredi düşmeden
 * kullanılan modeller ve eşzamanlı iş sayısı. Kapalı şeritlerin videosu durur (GPU), açık olan oynar.
 * Klavye: sol/sağ (telefonda yukarı/aşağı) ok tuşları şeritler arasında gezer. ?plan=<id> o şeridi açar.
 * Telefonda şeritler alt alta, açık olan uzar.
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, Infinity as Sonsuz, Layers } from "lucide-react";
import { kartlar, planaGec, type Kart } from "@/components/fiyat/Vitrin";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { KrediJeton } from "@/components/ui/KrediHap";
import { useAuth } from "@/store/useAuth";
import { MODELLER } from "@/lib/catalog";
import { ESZAMANLI, ORNEK_MALIYET, PLAN_SINIRSIZ, ULTRA_KREDI_KADEMELERI, sayi, tl, type Donem, type KartPlanId } from "@/lib/fiyat";
import { cn } from "@/lib/utils";

const VH = "/gercek/video-hareket/";
const VIDEO: Record<KartPlanId, string> = { ucretsiz: "soul-jump", baslangic: "drone-orbit", arti: "low-shutter", ultra: "bullet-time" };
const SIRA: KartPlanId[] = ["ucretsiz", "baslangic", "arti", "ultra"];
const akis = [0.22, 1, 0.36, 1] as const;
const yay = { type: "spring" as const, stiffness: 260, damping: 34, mass: 0.9 };
const modelAd = (id: string) => MODELLER.find((m) => m.id === id)?.ad ?? id;

/** Yönelme eki: Artı'ya, Başlangıç'a, Ücretsiz'e (ünlü uyumu). */
export function yonelme(ad: string) {
  const k = ad.toLocaleLowerCase("tr-TR");
  const son = [...k].reverse().find((h) => "aeıioöuü".includes(h)) ?? "a";
  const sesliBiter = "aeıioöuü".includes(k.slice(-1));
  return `${ad}'${sesliBiter ? "y" : ""}${"eiöü".includes(son) ? "e" : "a"}`;
}

/** Şeridin videosu: açıkken oynar, kapalıyken ilk karede durur; hareketi azalt açıksa hiç oynamaz. */
function SeritVideo({ ad, oynat }: { ad: string; oynat: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const azalt = useReducedMotion();
  useEffect(() => {
    const v = ref.current; if (!v) return;
    if (oynat && !azalt) void v.play().catch(() => {}); else v.pause();
  }, [oynat, azalt]);
  return (
    <video ref={ref} src={`${VH}${ad}.mp4`} poster={`${VH}${ad}-poster.webp`} muted loop playsInline preload="metadata" aria-hidden
      className={cn("absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700", oynat ? "scale-100 opacity-90" : "scale-[1.04] opacity-45 group-hover:opacity-60")} />
  );
}

function Kademe({ kademe, setKademe }: { kademe: number; setKademe: (n: number) => void }) {
  return (
    <LayoutGroup id="sinema-kademe">
      <div role="radiogroup" aria-label="Aylık kredi" className="inline-flex rounded-full bg-black/45 p-1 ring-1 ring-inset ring-white/15">
        {ULTRA_KREDI_KADEMELERI.map((x, i) => (
          <button key={x} type="button" role="radio" aria-checked={i === kademe} onClick={(e) => { e.stopPropagation(); setKademe(i); }}
            className={cn("relative flex h-8 items-center gap-1 rounded-full px-3.5 text-[13px] font-semibold tabular-nums transition-colors", i === kademe ? "text-black" : "text-white/65 hover:text-white")}>
            {i === kademe && <motion.span layoutId="sinema-kademe-z" transition={{ type: "spring", stiffness: 500, damping: 38 }} className="absolute inset-0 rounded-full bg-white" />}
            <span className="relative">{sayi(x)}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

function Gecis({ k, mevcut, donem }: { k: Kart; mevcut: KartPlanId; donem: Donem }) {
  const girisli = useAuth((s) => !!s.kullanici);
  const su = k.id === mevcut;
  const yukari = SIRA.indexOf(k.id) > SIRA.indexOf(mevcut);
  const temel = "flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 text-[14.5px] font-semibold transition-[transform,opacity,background-color] active:scale-[0.97]";
  if (girisli && su) return <span className={cn(temel, "bg-white/[0.1] text-white/70 ring-1 ring-inset ring-white/20")}>Kullandığın plan</span>;
  if (girisli && k.id === "ucretsiz") return <Link href="/panel/ayarlar/abonelik#iptal" onClick={(e) => e.stopPropagation()} className={cn(temel, "bg-white/[0.1] text-white ring-1 ring-inset ring-white/20 hover:bg-white/[0.16]")}>Aboneliği iptal et</Link>;
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); planaGec(k, donem); }}
      className={cn(temel, "group/g", !girisli || yukari ? "bg-white text-black hover:opacity-90" : "bg-white/[0.1] text-white ring-1 ring-inset ring-white/20 hover:bg-white/[0.16]")}>
      {!girisli ? k.cta : `${yonelme(k.ad)} ${yukari ? "geç" : "düşür"}`}
      <ArrowRight className="h-4 w-4 transition-transform group-hover/g:translate-x-0.5" />
    </button>
  );
}

export function PlanSinema({ donem, kademe, setKademe }: { donem: Donem; kademe: number; setKademe: (n: number) => void }) {
  const K = useMemo(() => kartlar(donem, kademe), [donem, kademe]);
  const plan = useAuth((s) => s.kullanici?.plan);
  const mevcut: KartPlanId = plan && plan !== "kurumsal" ? plan : "ucretsiz";
  const params = useSearchParams();
  const istenen = params.get("plan") as KartPlanId | null;
  const [acik, setAcik] = useState<KartPlanId>(() => (istenen && SIRA.includes(istenen) ? istenen : !plan ? "arti" : SIRA[Math.min(3, SIRA.indexOf(mevcut) + 1)]));
  const refler = useRef<(HTMLDivElement | null)[]>([]);

  const gez = (e: React.KeyboardEvent, i: number) => {
    const ileri = e.key === "ArrowRight" || e.key === "ArrowDown", geri = e.key === "ArrowLeft" || e.key === "ArrowUp";
    if (!ileri && !geri) return;
    e.preventDefault();
    const j = (i + (ileri ? 1 : -1) + SIRA.length) % SIRA.length;
    setAcik(SIRA[j]); refler.current[j]?.focus();
  };

  return (
    <div role="tablist" aria-label="Planlar" aria-orientation="horizontal" className="flex gap-3 max-lg:flex-col lg:h-[620px]">
      {K.map((k, i) => {
        const a = acik === k.id;
        const su = k.id === mevcut && !!plan;
        const gorsel = Math.floor(k.ayKredi / ORNEK_MALIYET.gorsel.kredi), video = Math.floor(k.ayKredi / ORNEK_MALIYET.video.kredi);
        const sinirsiz = PLAN_SINIRSIZ[k.id];
        return (
          <motion.div key={k.id} ref={(el) => { refler.current[i] = el; }} role="tab" aria-selected={a} tabIndex={a ? 0 : -1}
            onClick={() => setAcik(k.id)} onKeyDown={(e) => gez(e, i)}
            initial={false} animate={{ flexGrow: a ? 3.7 : 1 }} transition={yay}
            className={cn("group relative isolate min-w-0 basis-0 cursor-pointer overflow-hidden rounded-[28px] bg-[#0d0d0f] outline-none ring-inset transition-[box-shadow] focus-visible:ring-2 focus-visible:ring-white/80",
              a ? "cursor-default ring-[1.5px] ring-white/70" : "ring-1 ring-white/10 hover:ring-white/25",
              "max-lg:basis-auto", a ? "max-lg:min-h-[640px]" : "max-lg:h-[112px]")}>
            <SeritVideo ad={VIDEO[k.id]} oynat={a} />
            {/* okunurluk: altta koyu, açıkken solda da koyu */}
            <div className={cn("absolute inset-0 transition-opacity duration-500", a ? "bg-gradient-to-t from-black via-black/55 to-black/5" : "bg-gradient-to-t from-black/95 via-black/50 to-black/20")} />
            <div className={cn("absolute inset-0 bg-gradient-to-r from-black/80 via-black/25 to-transparent transition-opacity duration-500", a ? "opacity-100" : "opacity-0")} />

            <div className="relative flex h-full flex-col p-6 max-lg:p-5">
              {/* üst satır */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={cn("font-semibold tracking-[-0.03em] text-white transition-[font-size] duration-300", a ? "text-[34px] leading-none max-lg:text-[28px]" : "text-[21px] leading-tight")}>{k.ad}</p>
                  {!a && su && <span className="mt-2 inline-flex rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-black">Senin planın</span>}
                  <AnimatePresence>{a && <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.15 }} className="mt-2 text-[14px] text-white/70">{k.kime}</motion.p>}</AnimatePresence>
                </div>
                <div className={cn("flex shrink-0 flex-col items-end gap-1.5", !a && "hidden")}>
                  {su && <span className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold text-black">Senin planın</span>}
                  {k.rozet && (a || !su) && <span className={cn("rounded-full px-2.5 py-1 text-[11.5px] font-semibold", a ? "bg-white/15 text-white ring-1 ring-inset ring-white/20" : "bg-black/40 text-white/80 ring-1 ring-inset ring-white/15", !a && "max-xl:hidden")}>{k.rozet}</span>}
                </div>
              </div>

              {/* kapalı şerit: fiyat ve kredi altta */}
              {!a && (
                <div className="mt-auto max-lg:absolute max-lg:bottom-5 max-lg:right-5 max-lg:text-right">
                  <p className="text-[22px] font-semibold tabular-nums tracking-[-0.03em] text-white">{k.fiyat ? tl(k.fiyat) : "₺0"}<span className="text-[13px] font-normal text-white/50"> / ay</span></p>
                  <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-white/55 max-lg:justify-end"><KrediJeton boyut={11} />{sayi(k.ayKredi)} kredi / ay</p>
                  <p className="mt-4 flex items-center gap-1 text-[12.5px] font-medium text-white/45 transition-colors group-hover:text-white max-lg:hidden">Aç<ArrowRight className="h-3.5 w-3.5" /></p>
                </div>
              )}

              {/* açık şerit */}
              <AnimatePresence>
                {a && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.5, delay: 0.12, ease: akis }}
                    className="mt-auto grid items-end gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <motion.span key={`${k.fiyat}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[60px] font-semibold leading-none tabular-nums tracking-[-0.045em] text-white max-lg:text-[46px]">{k.fiyat ? tl(k.fiyat) : "₺0"}</motion.span>
                        <span className="text-[15px] text-white/60">/ ay</span>
                        {k.eski && <span className="text-[16px] tabular-nums text-white/40 line-through">{tl(k.eski)}</span>}
                      </p>
                      <p className="mt-2 h-5 text-[13px] text-white/55">{k.yillikToplam ? <>Yılda bir kez {tl(k.yillikToplam)} · <span className="text-white">{tl((k.eski! - k.fiyat) * 12)} tasarruf</span></> : k.id === "ucretsiz" ? "Kart bilgisi gerekmez" : "Aylık faturalandırılır, istediğin an iptal"}</p>

                      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                        <p className="flex items-center gap-2 text-[17px] font-semibold text-white"><KrediJeton boyut={16} />{sayi(k.ayKredi)}<span className="text-[13.5px] font-normal text-white/60">{k.krediNot === "kredi / gün" ? "kredi / ay, günde " + sayi(k.kredi) : "kredi / ay"}</span></p>
                        {k.id === "ultra" && <Kademe kademe={kademe} setKademe={setKademe} />}
                      </div>
                      <p className="mt-1.5 text-[13px] text-white/55">Ayda yaklaşık <span className="tabular-nums text-white">{sayi(video)}</span> video ya da <span className="tabular-nums text-white">{sayi(gorsel)}</span> görsel</p>

                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <Gecis k={k} mevcut={mevcut} donem={donem} />
                        <Link href="/fiyatlandirma#karsilastir" onClick={(e) => e.stopPropagation()} className="flex h-12 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white">
                          Tüm özellikleri karşılaştır<ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>

                    {/* cam panel: planla gelenler */}
                    <div className="cam-istemci rounded-[22px] p-4">
                      <p className="text-[12.5px] text-white/55">{k.onceki ? `${k.onceki} planındaki her şey, artı` : "Bu planla"}</p>
                      <ul className="mt-2.5 space-y-2">
                        {k.yeniler.map((y) => <li key={y} className="flex gap-2.5 text-[13.5px] leading-snug text-white"><Check className="mt-0.5 h-4 w-4 shrink-0 text-white/70" strokeWidth={2.2} />{y}</li>)}
                      </ul>
                      {sinirsiz.length > 0 && (
                        <div className="mt-4 border-t border-white/10 pt-3.5">
                          <p className="mb-2 flex items-center gap-1.5 text-[12.5px] text-white/55"><Sonsuz className="h-3.5 w-3.5" />Kredi düşmeden</p>
                          <div className="space-y-1.5">
                            {sinirsiz.map((s) => <p key={s.model} className="flex items-center gap-2 text-[13px] text-white"><ModelLogo ad={modelAd(s.model)} boyut={15} /><span className="min-w-0 flex-1 truncate">{modelAd(s.model)}</span><span className="shrink-0 text-[12px] text-white/55">{s.etiket}</span></p>)}
                          </div>
                        </div>
                      )}
                      {!k.yeniler.some((y) => y.startsWith("Aynı anda")) && <p className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3.5 text-[12.5px] text-white/60"><Layers className="h-3.5 w-3.5" />Aynı anda {ESZAMANLI[k.id].gorsel} görsel · {ESZAMANLI[k.id].video} video</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
