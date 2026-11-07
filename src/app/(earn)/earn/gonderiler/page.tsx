"use client";

/**
 * Gönderilerim (2026-10-29, seçilen "A · Durum panosu"): başlık + beyaz "Bağlantı gönder", sayaçlı
 * Cüzdanda / Bekleyen / Toplam şeridi, sayılı aşama segmenti, açılır satırlı durum tablosu (GonderiTablosu).
 * Gönderi yoksa kompakt bilgi şeridi + kampanya önerileri.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Send } from "lucide-react";
import { useEarn, cuzdan, gonderiHesap, type GonderiDurum } from "@/store/useEarn";
import { kampanyalar, bittiMi, tl, KURALLAR } from "@/lib/earn/kampanyalar";
import { useSimdi } from "@/components/earn/ortak";
import { kampanyaOdul } from "@/components/earn/PosterKart";
import { GonderiTablosu } from "@/components/earn/kampanya/GonderiTablosu";
import { KampanyaAvatar } from "@/components/earn/kampanya/OdemeKartlari";
import { Sayac, Segment, ease } from "@/components/earn/kampanya/parcalar";

type Filtre = "hepsi" | "inceleme" | "onaylandi" | "reddedildi";
const FILTRE: { id: Exclude<Filtre, "hepsi">; ad: string; d: GonderiDurum[] }[] = [
  { id: "inceleme", ad: "İncelemede", d: ["inceleme", "degerlendirme"] },
  { id: "onaylandi", ad: "Onaylanan", d: ["onaylandi", "sonuclandi"] },
  { id: "reddedildi", ad: "Reddedilen", d: ["reddedildi"] },
];

export default function GonderilerSayfasi() {
  const s = useEarn();
  const simdi = useSimdi();
  const c = cuzdan(s, simdi);
  const [filtre, setFiltre] = useState<Filtre>("hepsi");
  const liste = useMemo(() => s.gonderiler.map((g) => ({ g, h: gonderiHesap(g, simdi, c.seviye.bonus) })).sort((a, b) => b.g.tarih - a.g.tarih), [s.gonderiler, simdi, c.seviye.bonus]);
  const say = (f: (typeof FILTRE)[number]) => liste.filter((x) => f.d.includes(x.h.durum)).length;
  const gorunen = filtre === "hepsi" ? liste : liste.filter((x) => FILTRE.find((f) => f.id === filtre)!.d.includes(x.h.durum));
  const gonderHref = s.katilimlar[0] ? `/earn/kampanyalar/${s.katilimlar[0]}#gonder` : "/earn/kampanyalar";
  const oneri = useMemo(() => kampanyalar(simdi).filter((k) => !bittiMi(k, simdi)).sort((a, b) => Number(!!b.oneCikan) - Number(!!a.oneCikan) || b.katilimci - a.katilimci).slice(0, 3), [simdi]);

  // Sayılar sunucudaki inceleme durumlarından; para tutarı yok (kazanç defteri açılmadı).
  const ozet: { ad: string; deger: number; renk: string; alt: string }[] = [
    { ad: "İncelemede", deger: liste.filter((x) => x.h.durum === "inceleme" || x.h.durum === "degerlendirme").length, renk: "#fcd34d", alt: "Vayra ekibinin kararını bekliyor" },
    { ad: "Onaylanan", deger: liste.filter((x) => x.h.durum === "onaylandi").length, renk: "#34d399", alt: "Kurallara uygun bulundu" },
    { ad: "Toplam", deger: liste.length, renk: "#ffffff", alt: "Gönderdiğin bağlantılar" },
  ];

  return (
    <div>
      <motion.header initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }} className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[30px] font-semibold tracking-[-0.035em] text-white sm:text-[36px]">Gönderilerim</h1>
          <p className="mt-1 max-w-[620px] text-[15px] text-white/60">Her gönderi Vayra ekibince elle incelenir; durum yalnız inceleme kararıyla değişir. Kazanç tutarları ödeme sistemi açılınca yazılacak.</p>
        </div>
        <Link href={gonderHref} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]"><Send className="h-4 w-4" />Bağlantı gönder</Link>
      </motion.header>

      {liste.length > 0 ? (
        <>
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.45, ease }}
            className="mt-7 grid grid-cols-1 gap-px overflow-hidden rounded-[24px] bg-white/[0.06] ring-1 ring-white/[0.08] sm:grid-cols-3">
            {ozet.map((o) => (
              <div key={o.ad} className="flex items-center justify-between gap-3 bg-[#0e0f12] px-5 py-4 sm:block sm:py-5">
                <div>
                  <p className="flex items-center gap-2 text-[13px] text-white/55"><span className="h-1.5 w-1.5 rounded-full" style={{ background: o.renk }} />{o.ad}</p>
                  <p className="mt-1 hidden text-[12px] text-white/40 sm:block">{o.alt}</p>
                </div>
                <p className="text-[22px] font-semibold leading-none tabular-nums tracking-[-0.03em] text-white sm:mt-3 sm:text-[28px]"><Sayac hedef={o.deger} bicim={(v) => String(Math.round(v))} /></p>
              </div>
            ))}
          </motion.section>

          <Segment id="gonderi-filtre" deger={filtre} set={setFiltre} className="mt-7 w-max"
            secenek={[{ id: "hepsi" as const, ad: "Tümü", n: liste.length }, ...FILTRE.filter((f) => say(f) > 0 || f.id === filtre).map((f) => ({ id: f.id, ad: f.ad, n: say(f) }))]} />
          <div className="mt-4">
            {gorunen.length ? <GonderiTablosu satirlar={gorunen.map((x) => x.g)} simdi={simdi} bonus={c.seviye.bonus} />
              : <p className="rounded-[20px] bg-white/[0.025] px-5 py-4 text-[14px] text-white/55 ring-1 ring-white/[0.07]">Bu aşamada gönderin yok.</p>}
          </div>
          <p className="mt-3 text-[12.5px] text-white/40">Ayrıntı ve itiraz için satıra tıkla.</p>
        </>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, ease }} className="mt-7 flex flex-col items-start gap-3 rounded-[20px] bg-white/[0.025] px-5 py-4 ring-1 ring-white/[0.08] sm:flex-row sm:items-center">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]"><Send className="h-4 w-4 text-white/70" /></span>
            <p className="flex-1 text-[14px] text-white/65">Henüz gönderin yok. Bir kampanyaya katıl, Vayra&apos;da üret ve paylaşımının bağlantısını gönder.</p>
            <Link href="/earn/kampanyalar" className="h-9 rounded-full bg-white px-4 text-[13px] font-semibold leading-9 text-black transition hover:bg-white/90 active:scale-[0.97]">Kampanya seç</Link>
          </motion.div>
          <h2 className="mb-3 mt-10 text-[19px] font-semibold tracking-[-0.02em] text-white">Başlamak için</h2>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
            {oneri.map((k, i) => {
              const o = kampanyaOdul(k);
              return (
                <motion.div key={k.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06, ease }}>
                  <Link href={`/earn/kampanyalar/${k.id}`} className="group flex items-center gap-3 rounded-[20px] bg-white/[0.03] p-3 ring-1 ring-white/[0.07] transition hover:bg-white/[0.055]">
                    <KampanyaAvatar k={k} boyut={52} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-medium text-white">{k.ad}</span><span className="text-[13px] text-white/55"><b className="font-semibold text-white">{o.deger}</b> {o.birim}</span></span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-white/35 transition group-hover:translate-x-0.5 group-hover:text-white" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
