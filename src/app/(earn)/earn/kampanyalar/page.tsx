"use client";

/**
 * Kampanyalar (2026-10-29, seçilen "C · Ödeme kartları"): başlık + arama, sayılı tür segmenti (Katıldıklarım dahil),
 * gerçek logolu platform filtresi, sıralama; Vyro tarzı ödeme kartları ve masaüstünde sağda yapışkan canlı önizleme
 * (üzerine gelinen ya da klavyeyle odaklanan kart). Bağlı hesabın olmayan platformlar soluk. Sona erenler ayrı soluk bölüm.
 */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SearchX, X } from "lucide-react";
import { useEarn } from "@/store/useEarn";
import { kampanyalar, bittiMi, PLATFORMLAR, TUR_AD, type Kampanya, type KampanyaTur, type Platform } from "@/lib/earn/kampanyalar";
import { PlatformLogo, useSimdi } from "@/components/earn/ortak";
import { KampanyaOnizleme, OdemeKarti } from "@/components/earn/kampanya/OdemeKartlari";
import { Segment, ease } from "@/components/earn/kampanya/parcalar";
import { cn } from "@/lib/utils";

type Sira = "onerilen" | "odeme" | "bitis" | "butce";
const SIRA: { id: Sira; ad: string }[] = [{ id: "onerilen", ad: "Önerilen" }, { id: "odeme", ad: "En yüksek" }, { id: "bitis", ad: "Bitiyor" }, { id: "butce", ad: "Bütçe" }];
const odemeDegeri = (k: Kampanya) => k.maxOdeme ?? k.odul ?? k.dereceler?.[0] ?? 0;
const kalanButce = (k: Kampanya) => (k.butce ? k.butce - (k.odenen ?? 0) : k.havuz ?? 0);
const sade = (s: string) => s.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");

export default function KampanyalarSayfasi() {
  const simdi = useSimdi();
  const katilimlar = useEarn((s) => s.katilimlar);
  const hesaplar = useEarn((s) => s.hesaplar);
  const bagli = useMemo(() => hesaplar.filter((h) => h.durum === "dogrulandi").map((h) => h.platform), [hesaplar]);
  const [tur, setTur] = useState<KampanyaTur | "hepsi" | "katildiklarim">("hepsi");
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [sira, setSira] = useState<Sira>("onerilen");
  const [q, setQ] = useState("");
  const [secId, setSecId] = useState<string | null>(null);

  const tum = useMemo(() => kampanyalar(simdi), [simdi]);
  const acikTum = tum.filter((k) => !bittiMi(k, simdi));

  const { acik, biten } = useMemo(() => {
    let l = tum;
    if (tur === "katildiklarim") l = l.filter((k) => katilimlar.includes(k.id));
    else if (tur !== "hepsi") l = l.filter((k) => k.tur === tur);
    if (platform) l = l.filter((k) => k.platformlar.includes(platform));
    const t = sade(q.trim());
    if (t) l = l.filter((k) => sade(`${k.ad} ${k.ozet} ${k.kategori} ${TUR_AD[k.tur]}`).includes(t));
    const sirali = [...l].sort((a, b) =>
      sira === "odeme" ? odemeDegeri(b) - odemeDegeri(a)
        : sira === "bitis" ? a.bitis - b.bitis
        : sira === "butce" ? kalanButce(b) - kalanButce(a)
        : Number(!!b.oneCikan) - Number(!!a.oneCikan) || b.katilimci - a.katilimci);
    return { acik: sirali.filter((k) => !bittiMi(k, simdi)), biten: sirali.filter((k) => bittiMi(k, simdi)) };
  }, [tum, tur, platform, sira, q, katilimlar, simdi]);

  const sekmeler = [
    { id: "hepsi" as const, ad: "Tümü", n: acikTum.length },
    ...(["goruntulenme", "gorev", "yarisma"] as KampanyaTur[]).map((t) => ({ id: t, ad: TUR_AD[t], n: acikTum.filter((k) => k.tur === t).length })),
    ...(katilimlar.length ? [{ id: "katildiklarim" as const, ad: "Katıldıklarım", n: katilimlar.length }] : []),
  ];
  const suzgecli = tur !== "hepsi" || !!platform || !!q.trim();
  const temizle = () => { setTur("hepsi"); setPlatform(null); setQ(""); };
  const sec = [...acik, ...biten].find((k) => k.id === secId) ?? acik[0] ?? biten[0];

  return (
    <div>
      <motion.header initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }} className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[30px] font-semibold tracking-[-0.035em] text-white sm:text-[36px]">Kampanyalar</h1>
          <p className="mt-1 text-[15px] text-white/60">{acikTum.length} açık kampanya. Ödemeye göre seç, Vayra&apos;da üret, paylaş.</p>
        </div>
        <label className="flex h-11 w-full items-center gap-2.5 rounded-full bg-white/[0.04] px-4 ring-1 ring-white/[0.09] transition focus-within:bg-white/[0.06] focus-within:ring-white/[0.2] sm:w-[320px]">
          <Search className="h-4 w-4 shrink-0 text-white/45" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kampanya ara" aria-label="Kampanya ara" className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/40" />
          <AnimatePresence>{q && <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={() => setQ("")} aria-label="Aramayı temizle" className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-[#0b0c0f] hover:bg-white/45"><X className="h-3 w-3" strokeWidth={3} /></motion.button>}</AnimatePresence>
        </label>
      </motion.header>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.35, ease }} className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-3">
        <Segment id="kampanya-tur" deger={tur} set={setTur} secenek={sekmeler} />
        <div className="flex gap-1.5" role="group" aria-label="Platform">
          {PLATFORMLAR.map((p) => {
            const a = platform === p.id;
            return (
              <button key={p.id} onClick={() => setPlatform(a ? null : p.id)} aria-pressed={a} title={p.ad} aria-label={`${p.ad} kampanyaları`}
                className={cn("flex h-10 w-10 items-center justify-center rounded-full ring-1 transition active:scale-90", a ? "bg-white/[0.12] ring-white/[0.35]" : "bg-white/[0.03] ring-white/[0.08] hover:bg-white/[0.06]")}>
                <PlatformLogo id={p.id} boyut={16} />
              </button>
            );
          })}
        </div>
        <Segment id="kampanya-sira" deger={sira} set={setSira} secenek={SIRA} className="lg:ml-auto" />
      </motion.div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          {acik.length > 0 ? (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
              <AnimatePresence mode="popLayout" initial={false}>
                {acik.map((k, i) => <OdemeKarti key={k.id} k={k} i={i} simdi={simdi} secili={sec?.id === k.id} katildi={katilimlar.includes(k.id)} bagli={bagli} onSec={() => setSecId(k.id)} />)}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-start gap-3 rounded-[20px] bg-white/[0.025] px-5 py-4 ring-1 ring-white/[0.08] sm:flex-row sm:items-center">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]"><SearchX className="h-4 w-4 text-white/70" /></span>
              <p className="flex-1 text-[14px] text-white/65">{tur === "katildiklarim" ? "Katıldığın açık kampanya yok." : "Bu seçimle eşleşen açık kampanya yok."}</p>
              {suzgecli && <button onClick={temizle} className="h-9 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]">Filtreleri temizle</button>}
            </motion.div>
          )}

          {biten.length > 0 && (
            <section className="mt-10">
              <h2 className="flex items-center gap-2.5 text-[19px] font-semibold tracking-[-0.02em] text-white">Sona erenler<span className="rounded-full bg-white/[0.07] px-2.5 py-0.5 text-[12.5px] font-medium text-white/60">{biten.length}</span></h2>
              <p className="mt-1 text-[13.5px] text-white/50">Yeni gönderi kabul etmiyor; sonuç ve ödemeler cüzdanda.</p>
              <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
                {biten.map((k, i) => <OdemeKarti key={k.id} k={k} i={i} simdi={simdi} secili={sec?.id === k.id} katildi={katilimlar.includes(k.id)} bagli={bagli} bitti onSec={() => setSecId(k.id)} />)}
              </div>
            </section>
          )}
        </div>

        {sec && (
          <aside className="hidden lg:block" aria-label="Seçili kampanya önizlemesi">
            <div className="sticky top-[calc(var(--ust-nav)+24px)]">
              <KampanyaOnizleme k={sec} simdi={simdi} katildi={katilimlar.includes(sec.id)} bitti={bittiMi(sec, simdi)} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
