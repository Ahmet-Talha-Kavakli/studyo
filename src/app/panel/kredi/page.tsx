"use client";

/**
 * /panel/kredi — plan, kredi paketi, sınırsız erişim ve hız.
 *
 * Sekme URL'de tutulur (?sekme=plan|kredi|sinirsiz|hiz) ki bağlantı paylaşılabilsin
 * ve geri tuşu çalışsın. ?plan=<id> ile gelinirse o plan kartı vurgulanır.
 * Kartlar /fiyatlandirma ile aynı bileşenler (components/fiyat), rakamlar lib/fiyat.
 */

import { Suspense, useEffect, useState } from "react";
import { KrediJeton } from "@/components/ui/KrediHap";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Coins, Infinity as InfinityIcon, Loader2, Rocket, Zap } from "lucide-react";
import { useAuthKapi } from "@/store/useAuthKapi";
import { KrediCuzdan } from "@/components/fiyat/KrediCuzdan";
import { DonemSec, Guven } from "@/components/fiyat/Vitrin";
import { PlanSinema } from "@/components/fiyat/PlanSinema";
import { KurumsalSerit } from "@/components/fiyat/Planlar";
import { OtomatikYukleme } from "@/components/fiyat/EkSecenekler";
import { HizGosterge, SinirsizGaleri } from "@/components/fiyat/EkGucYeni";
import { Kap } from "@/components/kesfet/ortak";
import { kesfetFont } from "@/components/kesfet/font";
import { useKrediModal, type KrediSekme } from "@/store/useKrediModal";
import { useAuth, krediDurum, PLAN_ADI } from "@/store/useAuth";
import { HIZ_SEVIYELERI, ORNEK_MALIYET, sayi, type Donem } from "@/lib/fiyat";
import { aktifSinirsizlar, useEkler } from "@/store/useEkler";
import { cn } from "@/lib/utils";

const SEKMELER: { id: KrediSekme; ad: string; ikon: typeof Rocket; baslik: string; ozet: string }[] = [
  { id: "plan", ad: "Plan", ikon: Rocket, baslik: "Planını seç", ozet: "Aylık kredin her ay yenilenir; Artı ve üzerinde kullanmadığın kredi devreder." },
  { id: "kredi", ad: "Kredi yükle", ikon: Coins, baslik: "Kredi yükle", ozet: "Tek seferlik paketler. Süresi dolmaz, büyük pakette kredi başına maliyet düşer." },
  { id: "sinirsiz", ad: "Sınırsız", ikon: InfinityIcon, baslik: "Sınırsız erişim", ozet: "Seçili modelleri süre boyunca kredi saymadan kullan." },
  { id: "hiz", ad: "Hız", ikon: Zap, baslik: "Öncelikli hız", ozet: "Yoğun saatlerde beklemeden üret." },
];
const GECERLI = SEKMELER.map((s) => s.id);

const VIDEO: Record<KrediSekme, string> = { plan: "drone-orbit", kredi: "low-shutter", sinirsiz: "effects", hiz: "fpv-dive" };
const VH = "/gercek/video-hareket/";

function KrediSayfaIc() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const modalKapat = useKrediModal((s) => s.kapat);
  const kullanici = useAuth((s) => s.kullanici);
  const girisli = useAuth((s) => s.girisYapildi);
  const ac = useAuthKapi((s) => s.ac);
  const [donem, setDonem] = useState<Donem>("yillik");
  const [kademe, setKademe] = useState(0);

  const ham = params.get("sekme") as KrediSekme | null;
  const sekme: KrediSekme = ham && GECERLI.includes(ham) ? ham : "plan";
  const aktif = SEKMELER.find((s) => s.id === sekme)!;

  // Modal açıksa kapat — aynı içerik iki kez görünmesin.
  useEffect(() => { modalKapat(); }, [modalKapat]);
  useEffect(() => { if (params.get("donem") === "aylik") setDonem("aylik"); }, [params]);

  const sekmeSec = (id: KrediSekme) => router.push(`${pathname}?sekme=${id}`, { scroll: false });

  return (
    <div className={cn("kesfet-tema min-h-[calc(100vh-var(--ust-nav))] overflow-x-clip bg-[#0a0a0b]", kesfetFont.variable)}>
      <Kap className={cn("pt-5 sm:pt-8", "pb-16")}>
        {/* ── Videolu üst alan: başlık, sekmeler, bakiye (sekmeye göre video değişir) ── */}
        <div className="relative isolate overflow-hidden rounded-[30px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
          <AnimatePresence initial={false}>
            <motion.video key={sekme} src={`${VH}${VIDEO[sekme]}.mp4`} poster={`${VH}${VIDEO[sekme]}-poster.webp`} autoPlay muted loop playsInline aria-hidden
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
              className="absolute inset-0 -z-10 h-full w-full object-cover" />
          </AnimatePresence>
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/90 via-black/65 to-black/25" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={aktif.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                  <h1 className="text-[36px] font-semibold leading-[1.04] tracking-[-0.035em] text-white sm:text-[54px]">{aktif.baslik}</h1>
                  <p className="mt-3 max-w-[480px] text-[15.5px] leading-relaxed text-white/70">{aktif.ozet}</p>
                </motion.div>
              </AnimatePresence>
              <LayoutGroup id="kredi-sekme">
                <div role="tablist" aria-label="Kredi seçenekleri" className="gizli-scroll -mx-1 mt-7 flex overflow-x-auto px-1">
                  <div className="inline-flex shrink-0 rounded-full bg-black/40 p-1 ring-1 ring-inset ring-white/[0.12] backdrop-blur-xl">
                    {SEKMELER.map((s) => (
                      <button key={s.id} role="tab" aria-selected={sekme === s.id} onClick={() => sekmeSec(s.id)}
                        className={cn("relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#55d6fd]/60", sekme === s.id ? "text-[#0b0b0d]" : "text-white/70 hover:text-white")}>
                        {sekme === s.id && <motion.span layoutId="kredi-sekme-z" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                        <span className="relative flex items-center gap-1.5">{s.id === "kredi" ? <KrediJeton boyut={13} /> : <s.ikon className="h-3.5 w-3.5" />}{s.ad}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </LayoutGroup>
            </div>
            {girisli && kullanici ? <BakiyeKarti onSekme={sekmeSec} /> : (
              <div className="rounded-[22px] bg-black/45 p-5 ring-1 ring-inset ring-white/15 backdrop-blur-xl">
                <p className="text-[15px] font-semibold text-white">Bakiyeni görmek için giriş yap</p>
                <p className="mt-1 text-[13px] leading-snug text-white/60">Seçenekleri şimdiden inceleyebilirsin; satın almak için hesabın gerekli.</p>
                <button onClick={() => ac()} className="mt-4 flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white text-[13.5px] font-semibold text-[#0b0b0d] hover:bg-white/90">Giriş yap<ArrowRight className="h-4 w-4" /></button>
              </div>
            )}
          </div>
        </div>

        {sekme === "plan" && <div className="mt-8 flex justify-end"><DonemSec donem={donem} setDonem={setDonem} id="kredi-donem" /></div>}

        {/* ── İçerik ── */}
        <motion.div key={`panel-${sekme}`} role="tabpanel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mt-8">
          {sekme === "plan" && (
            <>
              <PlanSinema donem={donem} kademe={kademe} setKademe={setKademe} />
              <div className="mt-3"><KurumsalSerit /></div>
              <OtomatikYukleme />
            </>
          )}
          {sekme === "kredi" && <KrediCuzdan onSekme={sekmeSec} />}
          {sekme === "sinirsiz" && <SinirsizGaleri />}
          {sekme === "hiz" && <HizGosterge />}
        </motion.div>

        <div className="mt-12 flex flex-col gap-6">
          <Guven />
          <Link href="/fiyatlandirma" className="group inline-flex w-fit items-center gap-1.5 text-[13.5px] font-medium text-white/55 transition-colors hover:text-white">
            Planları ayrıntılı karşılaştır ve model maliyetlerini gör <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Kap>
    </div>
  );
}

/** Videonun üstündeki cam bakiye kartı: bakiye, kalan çubuğu, karşılığı ve hesap durumu. */
function BakiyeKarti({ onSekme }: { onSekme: (s: KrediSekme) => void }) {
  const kullanici = useAuth((s) => s.kullanici)!;
  const hiz = useEkler((s) => s.hiz);
  const sinirsizlar = aktifSinirsizlar(useEkler((s) => s.sinirsizlar));
  const k = krediDurum(kullanici);
  const dusuk = k.oran < 0.2;
  return (
    <div className="rounded-[22px] bg-black/45 p-5 ring-1 ring-inset ring-white/15 backdrop-blur-xl">
      <div className="flex items-center justify-between text-[12.5px]">
        <span className={dusuk ? "font-medium text-amber-300" : "text-white/55"}>{dusuk ? "Kredin azalıyor" : "Bakiyen"}</span>
        <span className="tabular-nums text-white/45">yüzde {Math.round(k.oran * 100)} kaldı</span>
      </div>
      <p className="mt-1.5 flex items-center gap-2">
        <KrediJeton boyut={22} az={dusuk} className="kredi-isilti-yildiz" />
        <motion.span key={k.kalan} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-[38px] font-semibold leading-none tracking-[-0.04em] text-white tabular-nums">{sayi(k.kalan)}</motion.span>
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(3, k.oran * 100)}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className={cn("plan-karti-cubuk h-full rounded-full", dusuk && "plan-karti-cubuk-az")} />
      </div>
      <p className="mt-2 text-[12.5px] tabular-nums text-white/55">{sayi(Math.floor(k.kalan / ORNEK_MALIYET.gorsel.kredi))} görsel ya da {sayi(Math.floor(k.kalan / ORNEK_MALIYET.video.kredi))} videoya yeter</p>
      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/10 pt-3.5">
        {[
          { et: PLAN_ADI[kullanici.plan], s: "plan" as const, ikon: Rocket },
          { et: `${HIZ_SEVIYELERI.find((h) => h.id === hiz)?.ad ?? "Standart"} hız`, s: "hiz" as const, ikon: Zap },
          { et: sinirsizlar.length ? `${sinirsizlar.length} sınırsız` : "Sınırsız yok", s: "sinirsiz" as const, ikon: InfinityIcon },
        ].map((d) => (
          <button key={d.s} onClick={() => onSekme(d.s)} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.1] px-3 text-[12.5px] font-medium text-white/85 transition-colors hover:bg-white/[0.18] hover:text-white">
            <d.ikon className="h-3.5 w-3.5 text-white/60" />{d.et}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function KrediSayfa() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-metin-3" /></div>}>
      <KrediSayfaIc />
    </Suspense>
  );
}
