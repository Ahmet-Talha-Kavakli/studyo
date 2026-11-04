"use client";

/**
 * /panel/kredi Sınırsız ve Hız sekmeleri (2026-10-28 kullanıcı seçimi):
 *  - Sınırsız · "Raf": yatay kayan model kartları; seçilen kart genişleyip kalite ve süre seçimini içinde gösterir.
 *  - Hız · "Kadran": videolu sahnede hız göstergesi (tikli yay, renk geçişli dolgu, yaylı ibre), üç ölçüm, ek eşzamanlı üretim.
 * İkisinde de seçim ekranın altındaki ödeme çubuğunda özetlenir (Kredi yükle sekmesiyle aynı dil).
 * Satın alma demo: useEkler'e yazılır, faturaya ve bildirimlere düşer.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import { ArrowLeft, ArrowRight, Infinity as Sonsuz, Layers, Minus, Plus, Zap } from "lucide-react";
import { MODELLER } from "@/lib/catalog";
import { modelLogoUrl } from "@/components/kitaplik/Simgeler";
import { useAuth } from "@/store/useAuth";
import { aktifSinirsizlar, useEkler, type HizSeviye } from "@/store/useEkler";
import { hareketYaz } from "@/store/useHesap";
import { hesapBildirimi } from "@/lib/bildirimler";
import { toast } from "@/lib/toast";
import {
  EK_ESZAMANLI, ESZAMANLI, HIZ_BEKLEME, HIZ_SEVIYELERI, PLAN_SINIRSIZ, SINIRSIZ_GUNLER, SINIRSIZ_TEKLIFLER,
  planBul, sinirsizFiyat, tl, type KartPlanId, type SinirsizTeklif,
} from "@/lib/fiyat";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
const KDV = 0.2;
const VH = "/gercek/video-hareket/";
const model = (id: string) => MODELLER.find((m) => m.id === id)!;
const logo = (id: string) => modelLogoUrl(model(id).ad) ?? "/brand/vayra-mark.png";
const kartPlan = (p?: string): KartPlanId => (p === "arti" || p === "ultra" || p === "baslangic" ? p : "baslangic");
const sureYaz = (sn: number) => (sn <= 0 ? "Beklemesiz" : sn < 60 ? `${sn} sn` : `${Math.floor(sn / 60)} dk${sn % 60 ? ` ${sn % 60} sn` : ""}`);

/* ── Ortak: alt ödeme çubuğu ── */
function OdemeCubugu({ ikon: I, baslik, alt, dugme, onAl, pasif }: { ikon: typeof Zap; baslik: string; alt: string; dugme: string; onAl: () => void; pasif?: boolean }) {
  const [isliyor, setIsliyor] = useState(false);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-40 flex justify-center px-3 sm:bottom-6">
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.2 }} className="pointer-events-auto relative w-full max-w-[820px]">
        <span aria-hidden className="rgb-cerceve rgb-hale pointer-events-none absolute -inset-[2px] rounded-[26px] opacity-25" />
        <div className="bd-panel relative flex items-center gap-3 rounded-[24px] p-2.5 pl-3 sm:gap-4 sm:pl-4">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#16384c] to-[#0c1520] shadow-[inset_0_0_0_1px_rgba(85,214,253,0.35)] sm:flex"><I className="h-5 w-5 text-[#55d6fd]" /></span>
          <span className="min-w-0 flex-1">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={baslik} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="block truncate text-[16px] font-semibold text-white">{baslik}</motion.span>
            </AnimatePresence>
            <span className="block truncate text-[12.5px] text-white/50">{alt}</span>
          </span>
          <button disabled={pasif || isliyor} onClick={() => { setIsliyor(true); setTimeout(() => { onAl(); setIsliyor(false); }, 600); }}
            className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-[14.5px] font-semibold text-[#0b0b0d] transition-[background-color,transform] hover:bg-white/90 active:scale-[0.97] disabled:bg-white/[0.08] disabled:text-white/45">
            {isliyor && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0b0b0d]/25 border-t-[#0b0b0d]" />}
            {dugme}{!isliyor && !pasif && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ═════════════════════ SINIRSIZ · RAF ═════════════════════ */

const TURLER = [{ id: "tumu", ad: "Tümü" }, { id: "gorsel", ad: "Görsel" }, { id: "video", ad: "Video" }, { id: "ses", ad: "Ses" }];
function kalanSure(bitis: number) {
  const ms = bitis - Date.now();
  const gun = Math.floor(ms / 864e5), sa = Math.floor((ms % 864e5) / 36e5);
  return gun > 0 ? `${gun} gün ${sa} sa` : `${Math.max(1, sa)} sa`;
}

function SecimPaneli({ t, k, setK, g, setG, planda }: { t: SinirsizTeklif; k: number; setK: (n: number) => void; g: number; setG: (n: number) => void; planda?: string }) {
  const m = model(t.model);
  const arti = planBul("arti")!;
  const esik = Math.ceil(sinirsizFiyat(t, k, g) / SINIRSIZ_GUNLER[g].gun / (m.kredi * t.kaliteler[k].carpan * (arti.fiyatTRY / arti.kredi)));
  return (
    <div className="flex h-full flex-col">
      <p className="flex items-center gap-2.5 text-[26px] font-semibold tracking-[-0.025em] text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white/[0.12] backdrop-blur-md"><img src={logo(t.model)} alt="" className="h-5 w-5" /></span>{m.ad}
      </p>
      <p className="mt-2 flex flex-wrap gap-1.5 text-[12px] text-white/75">
        {[`Normalde ${Math.round(m.kredi * t.kaliteler[k].carpan)} kredi`, `Aynı anda ${t.esZamanli}`, t.maxSure].filter(Boolean).map((x) => <span key={x} className="rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-md">{x}</span>)}
      </p>
      {planda && <p className="mt-3 w-fit rounded-full bg-[#55d6fd]/15 px-3 py-1 text-[12px] font-semibold text-[#55d6fd] backdrop-blur-md">Planında zaten {planda}</p>}
      {t.kaliteler.length > 1 && (
        <div className="mt-4 inline-flex w-fit rounded-full bg-black/45 p-1 ring-1 ring-inset ring-white/[0.12] backdrop-blur-xl">
          {t.kaliteler.map((q, i) => (
            <button key={q.ad} onClick={() => setK(i)} className={cn("relative h-8 rounded-full px-3.5 text-[12.5px] font-semibold transition-colors", k === i ? "text-[#0b0b0d]" : "text-white/70 hover:text-white")}>
              {k === i && <motion.span layoutId={`kalite-${t.model}`} className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
              <span className="relative">{q.ad}</span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-auto grid grid-cols-3 gap-2 pt-5">
        {SINIRSIZ_GUNLER.map((x, i) => {
          const f = sinirsizFiyat(t, k, i), gunluk = Math.round(f / x.gun), ind = Math.round((1 - gunluk / sinirsizFiyat(t, k, 0)) * 100);
          return (
            <button key={x.gun} onClick={() => setG(i)} aria-pressed={g === i}
              className={cn("rounded-[16px] p-3 text-left backdrop-blur-xl transition-[background-color,box-shadow]", g === i ? "bg-[#0f2129]/90 shadow-[inset_0_0_0_1.5px_#55d6fd]" : "bg-black/45 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] hover:bg-black/60")}>
              <span className="block text-[14px] font-semibold text-white">{x.gun} gün</span>
              <span className="mt-1 block text-[17px] font-semibold tabular-nums text-white">{tl(f)}</span>
              <span className="block text-[11.5px] tabular-nums text-white/50">günde {tl(gunluk)}</span>
              {ind > 0 && <span className="mt-1 block text-[11.5px] font-semibold text-[#55d6fd]">%{ind} ucuz</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[12px] text-white/60">Günde <b className="text-white">{esik}</b> üretimden fazlasını yapıyorsan krediden daha ucuz.</p>
    </div>
  );
}

export function SinirsizRaf() {
  const plan = kartPlan(useAuth((s) => s.kullanici?.plan));
  const girisli = useAuth((s) => s.girisYapildi);
  const ekle = useEkler((s) => s.sinirsizEkle);
  const aktifler = aktifSinirsizlar(useEkler((s) => s.sinirsizlar));
  const [tur, setTur] = useState("tumu");
  const [sec, setSec] = useState(SINIRSIZ_TEKLIFLER[0].model);
  const [k, setK] = useState(0);
  const [g, setG] = useState(1);
  const raf = useRef<HTMLDivElement>(null);
  const liste = SINIRSIZ_TEKLIFLER.filter((t) => tur === "tumu" || model(t.model).tur === tur);
  const t = SINIRSIZ_TEKLIFLER.find((x) => x.model === sec)!;
  const m = model(t.model);
  const fiyat = sinirsizFiyat(t, k, g);
  const planda = (id: string) => PLAN_SINIRSIZ[plan].find((s) => s.model === id)?.etiket;

  useEffect(() => { setK(0); }, [sec]);
  useEffect(() => { if (!liste.some((x) => x.model === sec)) setSec(liste[0].model); }, [tur]); // eslint-disable-line react-hooks/exhaustive-deps
  // Seçilen kart görünür alana kaysın.
  useEffect(() => { const el = raf.current?.querySelector<HTMLElement>(`[data-model="${sec}"]`); setTimeout(() => el?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" }), 320); }, [sec]);
  const kaydir = (yon: number) => raf.current?.scrollBy({ left: yon * 420, behavior: "smooth" });

  const al = () => {
    if (!girisli) return toast.error("Önce giriş yap", { description: "Satın almak için hesabınla giriş yapman gerekiyor." });
    const kalite = t.kaliteler[k].ad, gun = SINIRSIZ_GUNLER[g].gun;
    ekle(t.model, kalite, gun);
    hareketYaz({ tur: "sinirsiz", aciklama: `${m.ad} ${kalite} · ${gun} gün sınırsız`, kredi: 0, tutar: fiyat, kdv: Math.round(fiyat * KDV), belge: true });
    hesapBildirimi(`Sınırsız ${m.ad} etkin`, `${kalite} · ${gun} gün boyunca bu modelde kredi düşmez.`, { ad: "Hemen üret", link: m.tur === "video" ? "/panel/video" : m.tur === "ses" ? "/panel/ses" : "/panel/gorsel" });
    toast.success(`Sınırsız ${m.ad} etkin`, { description: `${kalite} · ${gun} gün. Gerçek ödeme alınmadı.` });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full bg-[#18181b] p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]">
          {TURLER.map((x) => (
            <button key={x.id} onClick={() => setTur(x.id)} className={cn("relative h-9 rounded-full px-4 text-[13.5px] font-semibold transition-colors", tur === x.id ? "text-[#0b0b0d]" : "text-white/60 hover:text-white")}>
              {tur === x.id && <motion.span layoutId="sinirsiz-tur" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
              <span className="relative">{x.ad}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {[-1, 1].map((y) => (
            <button key={y} onClick={() => kaydir(y)} aria-label={y < 0 ? "Geri kaydır" : "İleri kaydır"} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.07] text-white ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.13]">
              {y < 0 ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>

      {aktifler.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-white/50">Aktif:</span>
          {aktifler.map((a) => (
            <span key={a.model + a.kalite} className="flex items-center gap-2 rounded-full bg-[#55d6fd]/10 py-1 pl-1.5 pr-3 text-[12.5px] text-white ring-1 ring-inset ring-[#55d6fd]/25">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo(a.model)} alt="" className="h-4 w-4" />{model(a.model).ad} {a.kalite}<span className="text-white/45">· {kalanSure(a.bitis)} kaldı</span>
            </span>
          ))}
        </div>
      )}

      <div ref={raf} className="gizli-scroll -mx-4 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-0 sm:px-0">
        {liste.map((x) => {
          const a = x.model === sec;
          const aktif = aktifler.find((y) => y.model === x.model);
          return (
            <motion.div key={x.model} data-model={x.model} role="button" tabIndex={0} aria-pressed={a}
              onClick={() => !a && setSec(x.model)} onKeyDown={(e) => { if (e.key === "Enter" && !a) setSec(x.model); }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              className={cn("group relative isolate h-[420px] shrink-0 snap-start overflow-hidden rounded-[28px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[#55d6fd]/60",
                a ? "w-[min(640px,calc(100vw-48px))] shadow-[inset_0_0_0_2px_#55d6fd]" : "w-[210px] cursor-pointer shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={x.gorsel} alt="" className={cn("absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700", !a && "group-hover:scale-105")} />
              <span className={cn("absolute inset-0 -z-10 transition-opacity", a ? "bg-gradient-to-r from-black/90 via-black/60 to-black/5" : "bg-gradient-to-t from-black/90 via-black/20 to-transparent")} />
              {!a && (
                <>
                  {(planda(x.model) || aktif) && <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-[#55d6fd] backdrop-blur-md">{aktif ? "Aktif" : "Planında"}</span>}
                  <span className="absolute inset-x-4 bottom-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <span className="flex items-center gap-2 text-[15px] font-semibold text-white"><img src={logo(x.model)} alt="" className="h-4 w-4" />{model(x.model).ad}</span>
                    <span className="mt-1 block text-[12.5px] text-white/60">Günde {tl(sinirsizFiyat(x, 0, 0))}&apos;den</span>
                  </span>
                </>
              )}
              <AnimatePresence>
                {a && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.15, duration: 0.3, ease: EASE }}
                    className="absolute inset-y-6 left-6 w-[min(420px,calc(100%-48px))]">
                    <SecimPaneli t={x} k={k} setK={setK} g={g} setG={setG} planda={planda(x.model)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
      <p className="mt-4 text-[12.5px] text-white/40">Tek ödeme, otomatik yenilenmez. Süre boyunca seçtiğin model Vayra arayüzünde kredi düşmeden çalışır; API, MCP ve Canvas kullanımında kredi düşer.</p>

      <OdemeCubugu ikon={Sonsuz} baslik={`${m.ad} · ${SINIRSIZ_GUNLER[g].gun} gün sınırsız`} alt={`${t.kaliteler[k].ad} kalite · ${tl(Math.round(fiyat * KDV))} KDV dahil · tek ödeme`} dugme={`${tl(fiyat + Math.round(fiyat * KDV))} öde`} onAl={al} />
    </div>
  );
}

/* ═════════════════════ HIZ · KADRAN ═════════════════════ */

const HVID: Record<string, string> = { standart: "slow-motion", oncelikli: "dolly-in", turbo: "fpv-dive" };
/** Kadranda her seviyenin konumu (0–1); 1×, 2×, 4× hıza göre. */
const KONUM: Record<string, number> = { standart: 0.25, oncelikli: 0.5, turbo: 1 };
const VIDEO_SN = 75, PARTI = 8;
const partiSuresi = (esz: number, bekleme: number) => bekleme + Math.ceil(PARTI / esz) * VIDEO_SN;

/** Halka renkleri (camgöbeği tonları, 2026-10-28 kullanıcı seçimi): hız · bekleme · kapasite. */
const HALKA: [string, string][] = [["#9ff0ff", "#55d6fd"], ["#55d6fd", "#1e9fd6"], ["#2b8cc4", "#145a86"]];

/** Yaylı akan 0–1 değer. */
function useYayli(hedef: number) {
  const v = useMotionValue(hedef);
  const [d, setD] = useState(hedef);
  useEffect(() => v.on("change", setD), [v]);
  useEffect(() => { const c = animate(v, hedef, { type: "spring", stiffness: 70, damping: 13, mass: 1 }); return c.stop; }, [hedef, v]);
  return d;
}

/** Apple Watch Etkinlik halkaları: dış halka hız, orta halka beklemesizlik, iç halka aynı anda üretim. */
function Halkalar({ hiz, ek, esz }: { hiz: HizSeviye; ek: number; esz: number }) {
  const h = useYayli(KONUM[hiz]);
  const b = useYayli(Math.max(0.05, 1 - HIZ_BEKLEME[hiz] / Math.max(...Object.values(HIZ_BEKLEME))));
  const k = useYayli(Math.min(1, (esz + ek) / (esz + EK_ESZAMANLI[EK_ESZAMANLI.length - 1].adet)));
  const l = [{ r: 128, d: h }, { r: 98, d: b }, { r: 68, d: k }];
  return (
    <svg viewBox="0 0 300 300" className="h-auto w-full max-w-[340px]" role="img" aria-label="Hız, bekleme ve kapasite halkaları">
      <defs>
        {HALKA.map((x, i) => <linearGradient key={i} id={`halka-${i}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={x[0]} /><stop offset="1" stopColor={x[1]} /></linearGradient>)}
        <filter id="halka-isilti" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      {l.map((x, i) => {
        const c = 2 * Math.PI * x.r;
        return (
          <g key={i} transform="rotate(-90 150 150)">
            <circle cx="150" cy="150" r={x.r} fill="none" stroke={HALKA[i][1]} strokeOpacity="0.16" strokeWidth="24" />
            <circle cx="150" cy="150" r={x.r} fill="none" stroke={`url(#halka-${i})`} strokeWidth="24" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - x.d)} filter="url(#halka-isilti)" opacity="0.5" />
            <circle cx="150" cy="150" r={x.r} fill="none" stroke={`url(#halka-${i})`} strokeWidth="24" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - x.d)} />
          </g>
        );
      })}
      <text x="150" y="161" textAnchor="middle" fontSize="30" fontWeight={700} fill="#fff" letterSpacing="-1">{HIZ_SEVIYELERI.find((x) => x.id === hiz)!.kat}</text>
    </svg>
  );
}

export function HizKadran() {
  const plan = kartPlan(useAuth((s) => s.kullanici?.plan));
  const girisli = useAuth((s) => s.girisYapildi);
  const mevcutHiz = useEkler((s) => s.hiz);
  const mevcutEk = useEkler((s) => s.ekEsZamanli);
  const hizAyarla = useEkler((s) => s.hizAyarla);
  const [hiz, setHiz] = useState<HizSeviye>(mevcutHiz === "standart" ? "oncelikli" : mevcutHiz);
  const [ek, setEk] = useState(mevcutEk);
  useEffect(() => setEk(mevcutEk), [mevcutEk]);
  const esz = ESZAMANLI[plan];
  const sv = HIZ_SEVIYELERI.find((h) => h.id === hiz)!;
  const ekI = EK_ESZAMANLI.findIndex((e) => e.adet === ek);
  const toplam = sv.fiyat + EK_ESZAMANLI[ekI].fiyat;
  const degisiklik = hiz !== mevcutHiz || ek !== mevcutEk;
  const parti = partiSuresi(esz.video + ek, HIZ_BEKLEME[hiz]);
  const standartParti = partiSuresi(esz.video + ek, HIZ_BEKLEME.standart);

  const uygula = () => {
    if (!girisli) return toast.error("Önce giriş yap", { description: "Hızı değiştirmek için hesabınla giriş yapman gerekiyor." });
    hizAyarla(hiz, ek);
    if (toplam) hareketYaz({ tur: "hiz", aciklama: `${sv.ad} hız${ek ? ` · +${ek} eşzamanlı` : ""} (aylık)`, kredi: 0, tutar: toplam, kdv: Math.round(toplam * KDV), belge: true });
    hesapBildirimi(`${sv.ad} hız etkin`, `Aynı anda ${esz.video + ek} video, ${esz.gorsel + ek} görsel · yoğun saatte ${HIZ_BEKLEME[hiz] ? `bekleme ${sureYaz(HIZ_BEKLEME[hiz]).toLocaleLowerCase("tr-TR")}` : "beklemesiz"}.`);
    toast.success(`${sv.ad} hız etkin`, { description: `${ek ? `+${ek} eşzamanlı iş. ` : ""}${toplam ? `${tl(toplam)} / ay, makbuz Faturalar'da.` : "Ek ücret yok."}` });
  };

  return (
    <div>
      <div className="relative isolate overflow-hidden rounded-[30px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
        <AnimatePresence initial={false}>
          <motion.video key={hiz} src={`${VH}${HVID[hiz]}.mp4`} poster={`${VH}${HVID[hiz]}-poster.webp`} autoPlay muted loop playsInline aria-hidden
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        </AnimatePresence>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(8,8,10,0.72)_0%,rgba(8,8,10,0.92)_70%)]" />
        <div className="grid items-center gap-6 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="relative flex flex-col items-center">
            <Halkalar hiz={hiz} ek={ek} esz={esz.video} />
          </div>
          <div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={hiz} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
                <p className="flex flex-wrap items-center gap-2.5 text-[34px] font-semibold text-white"><span className="tracking-[-0.03em]">{sv.ad}</span>
                  {mevcutHiz === hiz && <span className="rounded-full bg-white/[0.12] px-2.5 py-0.5 text-[12px] font-semibold text-white/80">Kullandığın</span>}
                  {sv.populer && mevcutHiz !== hiz && <span className="rgb-rozet rounded-full px-2.5 py-0.5 text-[12px] font-semibold text-white">En çok tercih</span>}</p>
                <p className="mt-1 text-[15px] text-white/65">{sv.ozet}</p>
              </motion.div>
            </AnimatePresence>
            <dl className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-[20px] bg-white/[0.08] ring-1 ring-inset ring-white/[0.08]">
              {[
                { et: "Hız", d: sv.kat, renk: HALKA[0][1], alt: `${PARTI} videoluk parti ${sureYaz(parti).toLocaleLowerCase("tr-TR")}` },
                { et: "Yoğun saatte", d: sureYaz(HIZ_BEKLEME[hiz]), renk: HALKA[1][1], alt: hiz !== "standart" ? `Standart'tan ${sureYaz(standartParti - parti).toLocaleLowerCase("tr-TR")} önce biter` : undefined },
                { et: "Aynı anda", d: `${esz.video + ek} video`, renk: HALKA[2][1] },
              ].map((x) => (
                <div key={x.et} className="bg-black/55 p-4 backdrop-blur-xl">
                  <dt className="flex items-center gap-1.5 text-[12px] text-white/50"><span className="h-2.5 w-2.5 rounded-full" style={{ background: x.renk }} />{x.et}</dt>
                  <AnimatePresence mode="popLayout" initial={false}><motion.dd key={x.d} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-1 text-[18px] font-semibold tabular-nums text-white">{x.d}</motion.dd></AnimatePresence>
                  {x.alt && <p className="mt-0.5 text-[11.5px] leading-snug text-white/50">{x.alt}</p>}
                </div>
              ))}
            </dl>
            <div className="mt-4 inline-flex w-full rounded-full bg-black/45 p-1 ring-1 ring-inset ring-white/[0.12] backdrop-blur-xl sm:w-auto">
              {HIZ_SEVIYELERI.map((h) => (
                <button key={h.id} onClick={() => setHiz(h.id as HizSeviye)} className={cn("relative h-10 flex-1 rounded-full px-4 text-[13.5px] font-semibold transition-colors sm:flex-none", hiz === h.id ? "text-[#0b0b0d]" : "text-white/70 hover:text-white")}>
                  {hiz === h.id && <motion.span layoutId="hiz-sec" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                  <span className="relative flex items-center justify-center gap-1.5 whitespace-nowrap">{h.ad}<span className={hiz === h.id ? "text-black/45" : "text-white/40"}>{h.fiyat ? tl(h.fiyat) : "Dahil"}</span></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ek eşzamanlı üretim */}
      <div className="mt-3 flex flex-col gap-4 rounded-[24px] bg-[#111113] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-white/[0.06]"><Layers className="h-5 w-5 text-white/75" /></span>
        <span className="flex-1"><span className="block text-[15px] font-semibold text-white">Ek eşzamanlı üretim</span><span className="block text-[13px] text-white/50">Planında aynı anda {esz.video} video · {esz.gorsel} görsel. Fazlasını ekle, büyük partileri paralel üret.</span></span>
        <div className="flex items-center gap-1 self-start rounded-full bg-black/30 p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)] sm:self-auto">
          <button disabled={ekI <= 0} onClick={() => setEk(EK_ESZAMANLI[ekI - 1].adet)} aria-label="Azalt" className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 disabled:opacity-30"><Minus className="h-4 w-4" /></button>
          <span className="w-[96px] text-center">
            <AnimatePresence mode="popLayout" initial={false}><motion.span key={ek} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="block text-[16px] font-semibold tabular-nums text-white">{ek ? `+${ek}` : "Yok"}</motion.span></AnimatePresence>
            <span className="block text-[11.5px] tabular-nums text-white/45">{EK_ESZAMANLI[ekI].fiyat ? `${tl(EK_ESZAMANLI[ekI].fiyat)} / ay` : "Dahil"}</span>
          </span>
          <button disabled={ekI >= EK_ESZAMANLI.length - 1} onClick={() => setEk(EK_ESZAMANLI[ekI + 1].adet)} aria-label="Artır" className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 disabled:opacity-30"><Plus className="h-4 w-4" /></button>
        </div>
      </div>
      <p className="mt-4 text-[12.5px] text-white/40">Tüm görsel, video, ses ve 3D modellerinde; stüdyolarda, Sinema ve Pazarlama&apos;da geçerli. Aylık faturalandırılır, istediğin an iptal edersin.</p>

      <OdemeCubugu ikon={Zap} pasif={!degisiklik}
        baslik={`${sv.ad} hız${ek ? ` · +${ek} eşzamanlı` : ""}`}
        alt={degisiklik ? `${HIZ_BEKLEME[hiz] ? `Yoğun saatte bekleme ${sureYaz(HIZ_BEKLEME[hiz]).toLocaleLowerCase("tr-TR")}` : "Beklemesiz"} · aylık, istediğin an iptal` : "Şu an kullandığın ayar"}
        dugme={!degisiklik ? "Etkin" : toplam ? `${tl(toplam)} / ay ile geç` : "Standart'a dön"} onAl={uygula} />
    </div>
  );
}
