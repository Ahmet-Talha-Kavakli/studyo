"use client";

/**
 * /panel/api/karsilastir — aynı istemi aynı türden 4 modele kadar paralel gönderir (gerçek POST /v1/generations,
 * test anahtarıyla), çıktıları yan yana gösterir; süre, bedel, en hızlı / en ucuz işaretleriyle.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowRight, AudioLines, Box, Check, Clock, Coins, Film, Image as ImageIcon, Loader2, Music, Play, RotateCcw, Terminal } from "lucide-react";
import { MODELLER, type AIModel } from "@/lib/catalog";
import { ornekInput } from "@/lib/api/sema";
import { modelKapak } from "@/lib/api/gorsel";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { apiIstek, uretimIzle } from "@/lib/api/istemci";
import { useApiAnahtar, type ApiUretim } from "@/store/useApiAnahtar";
import { DurumRozet, SayfaBaslik, birincil, ikincil, sureMetin } from "@/components/api/ui";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type Tur = AIModel["tur"];
const TURLER: { id: Tur; ad: string; ikon: React.ElementType; istem: string }[] = [
  { id: "gorsel", ad: "Görsel", ikon: ImageIcon, istem: "Kapadokya üzerinde gün doğumunda sıcak hava balonları, 35mm film" },
  { id: "video", ad: "Video", ikon: Film, istem: "Yağmurlu bir Tokyo sokağında yavaşça ilerleyen kamera, neon yansımalar" },
  { id: "ses", ad: "Ses", ikon: AudioLines, istem: "Merhaba! Vayra ile tek bir istekte görsel, video ve ses üretebilirsin." },
  { id: "muzik", ad: "Müzik", ikon: Music, istem: "Sakin bir sabah için akustik gitar ve hafif piyano, 90 BPM" },
  { id: "3d", ad: "3D", ikon: Box, istem: "Bakır renkli, eski tip bir okuma lambası" },
];
const MAKS = 4;

type Satir = { model: AIModel; uretim: ApiUretim | null; hata: string | null; bas: number; bitti: number | null };

function girdiKur(m: AIModel, istem: string) {
  const o = ornekInput(m);
  if ("prompt" in o) o.prompt = istem; else if ("text" in o) o.text = istem; else o.prompt = istem;
  return o;
}

export default function Karsilastir() {
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const olustur = useApiAnahtar((s) => s.anahtarOlustur);
  const [tur, setTur] = useState<Tur>("gorsel");
  const turModeller = useMemo(() => MODELLER.filter((m) => m.tur === tur), [tur]);
  const [secili, setSecili] = useState<string[]>(() => MODELLER.filter((m) => m.tur === "gorsel").slice(0, 3).map((m) => m.id));
  const [istem, setIstem] = useState(TURLER[0].istem);
  const [satirlar, setSatirlar] = useState<Satir[]>([]);
  const [calisiyor, setCalisiyor] = useState(false);
  const iptal = useRef({ durdur: false });

  const turSec = (t: Tur) => {
    setTur(t); setSatirlar([]);
    setSecili(MODELLER.filter((m) => m.tur === t).slice(0, 3).map((m) => m.id));
    setIstem(TURLER.find((x) => x.id === t)!.istem);
  };
  const degis = (id: string) => setSecili((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < MAKS ? [...s, id] : s));

  const calistir = async () => {
    if (calisiyor || secili.length < 2 || !istem.trim()) return;
    setCalisiyor(true);
    iptal.current = { durdur: false };
    let a = anahtarlar.find((x) => x.ortam === "test");
    if (!a) { a = await olustur({ ad: "Test anahtarı", ortam: "test" }); toast.success("Test anahtarı oluşturuldu", { description: "Karşılaştırmalar kredi harcamaz." }); }
    const modeller = secili.map((id) => MODELLER.find((m) => m.id === id)!).filter(Boolean);
    const ilk = modeller.map((m) => ({ model: m, uretim: null, hata: null, bas: Date.now(), bitti: null } as Satir));
    setSatirlar(ilk);
    const guncelle = (id: string, p: Partial<Satir>) => setSatirlar((l) => l.map((x) => (x.model.id === id ? { ...x, ...p } : x)));
    await Promise.all(modeller.map(async (m) => {
      const r = await apiIstek<ApiUretim>(a!.tam, "POST", "/generations", { govde: { model: m.id, input: girdiKur(m, istem), metadata: { kaynak: "karsilastir" } }, anahtarId: a!.id, kaynak: "panel" });
      if (r.durum >= 300) { guncelle(m.id, { hata: (r.govde as unknown as { error?: { message?: string } })?.error?.message ?? `HTTP ${r.durum}`, bitti: Date.now() }); return; }
      guncelle(m.id, { uretim: { ...r.govde, anahtarId: a!.id } });
      const son = await uretimIzle(a!.tam, a!.id, r.govde.id, (u) => guncelle(m.id, { uretim: u }), iptal.current);
      guncelle(m.id, { uretim: son ?? undefined, bitti: Date.now() });
    }));
    setCalisiyor(false);
  };

  const biten = satirlar.filter((s) => s.uretim?.status === "succeeded");
  const enHizli = biten.length > 1 ? biten.reduce((a, b) => ((a.uretim!.metrics.run_ms ?? 1e9) <= (b.uretim!.metrics.run_ms ?? 1e9) ? a : b)).model.id : null;
  const enUcuz = satirlar.length > 1 ? satirlar.reduce((a, b) => (a.model.kredi <= b.model.kredi ? a : b)).model.id : null;

  return (
    <>
      <SayfaBaslik baslik="Karşılaştır" aciklama="Aynı istemi aynı anda birkaç modelde çalıştır; çıktıyı, süreyi ve bedeli yan yana gör. Test anahtarıyla gider, kredi harcamaz." />

      <section className="rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08] p-4 sm:p-6">
        <LayoutGroup id="kars-tur">
          <div role="tablist" className="flex w-max max-w-full gap-0.5 overflow-x-auto rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.08] [scrollbar-width:none]">
            {TURLER.map((t) => (
              <button key={t.id} role="tab" aria-selected={tur === t.id} onClick={() => turSec(t.id)} className={cn("relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-medium transition active:scale-[0.97]", tur === t.id ? "text-black" : "text-white/70 hover:text-white")}>
                {tur === t.id && <motion.span layoutId="kars-tur-z" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", damping: 34, stiffness: 420 }} />}
                <t.ikon className="relative h-3.5 w-3.5" /><span className="relative">{t.ad}</span>
                <span className={cn("relative text-[12px] tabular-nums", tur === t.id ? "text-black/50" : "text-white/40")}>{MODELLER.filter((m) => m.tur === t.id).length}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>

        <div className="mb-2.5 mt-5 flex items-baseline justify-between gap-3">
          <p className="text-[14px] font-semibold text-white">Modeller</p>
          <p className="text-[12.5px] text-white/55">En çok {MAKS} model · <span className="font-medium tabular-nums text-white/85">{secili.length} seçili</span></p>
        </div>
        <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {turModeller.map((m, i) => { const s = secili.includes(m.id); const dolu = !s && secili.length >= MAKS; return (
              <motion.button key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 34, delay: i * 0.02 }}
                whileTap={{ scale: 0.98 }} onClick={() => degis(m.id)} disabled={dolu} aria-pressed={s}
                className={cn("group relative flex items-center gap-3 rounded-[18px] p-2.5 pr-3.5 text-left ring-1 transition disabled:cursor-not-allowed disabled:opacity-40", s ? "bg-[#55d6fd]/[0.07] ring-[#55d6fd]/55" : "bg-white/[0.025] ring-white/[0.08] hover:bg-white/[0.045] hover:ring-white/[0.16]")}>
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[13px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={modelKapak(m.id)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                  <span className="absolute bottom-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/65 ring-1 ring-white/[0.15] backdrop-blur"><ModelLogo ad={`${m.ad} ${m.saglayici} ${m.id}`} boyut={11} /></span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-white">{m.ad}</span>
                  <span className="block truncate text-[12.5px] text-white/55">{m.saglayici} · <span className="tabular-nums text-white/75">{m.kredi} kredi</span></span>
                </span>
                <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition", s ? "bg-[#55d6fd] text-[#06222b]" : "ring-1 ring-inset ring-white/20 group-hover:ring-white/40")}>
                  <AnimatePresence>{s && <motion.span initial={{ scale: 0.3 }} animate={{ scale: 1 }} exit={{ scale: 0.3 }}><Check className="h-3.5 w-3.5" strokeWidth={3} /></motion.span>}</AnimatePresence>
                </span>
              </motion.button>
            ); })}
          </AnimatePresence>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <label className="flex min-h-12 min-w-0 flex-1 items-center rounded-full bg-white/[0.045] px-5 ring-1 ring-white/[0.09] transition hover:ring-white/[0.16] focus-within:ring-[#55d6fd]/55">
            <span className="sr-only">İstem</span>
            <input value={istem} onChange={(e) => setIstem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void calistir()} className="h-12 min-w-0 flex-1 bg-transparent text-[14.5px] text-white outline-none placeholder:text-white/40" placeholder="Tüm modellere aynı istem gider" />
          </label>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => void calistir()} disabled={calisiyor || secili.length < 2 || !istem.trim()} className={cn(birincil, "h-12 px-6 text-[14px]")}>
            {calisiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}{secili.length} modelde çalıştır
          </motion.button>
        </div>
        {secili.length < 2 && <p className="mt-2 text-[12.5px] text-amber-200">Karşılaştırmak için en az 2 model seç.</p>}
      </section>

      {satirlar.length > 0 ? (
        <div className={cn("mt-5 grid gap-3", satirlar.length === 2 ? "sm:grid-cols-2" : satirlar.length === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-4")}>
          <AnimatePresence initial={false}>
            {satirlar.map((s, i) => <Sonuc key={s.model.id} s={s} i={i} enHizli={enHizli === s.model.id} enUcuz={enUcuz === s.model.id} />)}
          </AnimatePresence>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {secili.map((id) => MODELLER.find((m) => m.id === id)).filter(Boolean).map((m) => (
            <motion.div key={m!.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="group relative aspect-[4/3] overflow-hidden rounded-[22px] ring-1 ring-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={modelKapak(m!.id)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-700 group-hover:scale-105 group-hover:opacity-60" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <span className="absolute left-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 ring-1 ring-white/[0.14] backdrop-blur"><ModelLogo ad={`${m!.ad} ${m!.saglayici} ${m!.id}`} boyut={17} /></span>
              <span className="absolute bottom-3.5 left-4 right-4"><span className="block text-[16px] font-semibold text-white">{m!.ad}</span><span className="text-[12.5px] text-white/70">{m!.saglayici} · {m!.kredi} kredi · çalıştırmayı bekliyor</span></span>
            </motion.div>
          ))}
        </div>
      )}

      {satirlar.length > 0 && !calisiyor && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button onClick={() => void calistir()} className={ikincil}><RotateCcw className="h-4 w-4" />Yeniden çalıştır</button>
          <Link href="/panel/api/istekler" className={ikincil}>İsteklerde gör<ArrowRight className="h-4 w-4" /></Link>
        </div>
      )}
    </>
  );
}

function Sonuc({ s, i, enHizli, enUcuz }: { s: Satir; i: number; enHizli: boolean; enUcuz: boolean }) {
  const u = s.uretim;
  const bitti = u && u.status !== "queued" && u.status !== "processing";
  const url = u?.output?.urls[0];
  const tip = u?.output?.content_type ?? "";
  const govde = JSON.stringify({ model: s.model.id, input: u?.input ?? {} });
  return (
    <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }} className="flex flex-col overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] ring-1 ring-white/[0.08]">
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3.5 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/[0.08]"><ModelLogo ad={`${s.model.ad} ${s.model.saglayici} ${s.model.id}`} boyut={16} /></span>
        <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-white">{s.model.ad}</span><span className="text-[12px] text-white/55">{s.model.saglayici}</span></span>
        {s.hata ? <span className="rounded-full bg-rose-500/12 px-2 py-0.5 text-[11.5px] text-rose-300">Hata</span> : <DurumRozet durum={u?.status ?? "queued"} />}
      </div>
      <div className="relative aspect-[4/3] bg-black/30">
        {!bitti && !s.hata && (
          <div className="absolute inset-0 overflow-hidden">
            <motion.span animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <Gecen bas={s.bas} />
          </div>
        )}
        {s.hata && <p className="absolute inset-0 flex items-center justify-center px-5 text-center text-[13px] text-rose-300">{s.hata}</p>}
        {bitti && u!.status === "failed" && <p className="absolute inset-0 flex items-center justify-center px-5 text-center text-[13px] text-rose-300">{u!.error?.message ?? "Üretim başarısız"}</p>}
        {bitti && u!.status === "succeeded" && url && (
          tip.startsWith("video") ? <video src={url} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
            : tip.startsWith("audio") ? <div className="absolute inset-0 flex items-center justify-center p-4"><audio src={url} controls className="w-full" /></div>
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        {bitti && u!.simulated && <span className="absolute left-2.5 top-2.5 rounded-full bg-amber-400/90 px-2 py-0.5 text-[11px] font-medium text-[#2a1d02]" title="Sağlayıcı anahtarı tanımlı olmadığı için örnek çıktı döndü">Örnek</span>}
        <div className="absolute right-2.5 top-2.5 flex gap-1">
          {enHizli && <span className="rounded-full bg-[#55d6fd] px-2 py-0.5 text-[11px] font-semibold text-[#06222b]">En hızlı</span>}
          {enUcuz && <span className="rounded-full bg-emerald-300 px-2 py-0.5 text-[11px] font-semibold text-[#05261a]">En ucuz</span>}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-px border-t border-white/[0.06] bg-white/[0.06] text-[12.5px]">
        <div className="bg-[#0d0e10] px-3.5 py-3"><dt className="flex items-center gap-1 text-white/55"><Clock className="h-3 w-3" />Süre</dt><dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-white">{bitti ? sureMetin(u!.metrics.run_ms) : "…"}</dd></div>
        <div className="bg-[#0d0e10] px-3.5 py-3"><dt className="flex items-center gap-1 text-white/55"><Coins className="h-3 w-3" />Canlıda bedel</dt><dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-white">{s.model.kredi} kredi</dd></div>
      </dl>
      <div className="mt-auto flex items-center gap-1 border-t border-white/[0.06] px-2 py-1.5 text-[12px]">
        <Link href={`/panel/api/modeller/${s.model.id}`} className="flex h-8 items-center gap-1 rounded-full px-2.5 text-white/60 transition hover:bg-white/[0.05] hover:text-white"><Play className="h-3.5 w-3.5" />Oyun alanı</Link>
        <Link href={`/panel/api/konsol?uc=uretim-olustur&govde=${encodeURIComponent(govde)}`} className="flex h-8 items-center gap-1 rounded-full px-2.5 text-white/60 transition hover:bg-white/[0.05] hover:text-white"><Terminal className="h-3.5 w-3.5" />Konsol</Link>
        {u && <Link href={`/panel/api/istekler?id=${u.id}`} className="ml-auto flex h-8 items-center gap-1 rounded-full px-2.5 text-white/60 transition hover:bg-white/[0.05] hover:text-white">İstek<ArrowRight className="h-3.5 w-3.5" /></Link>}
      </div>
    </motion.article>
  );
}

function Gecen({ bas }: { bas: number }) {
  const [t, setT] = useState(0);
  useEffect(() => { const i = setInterval(() => setT(Date.now() - bas), 100); return () => clearInterval(i); }, [bas]);
  return <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[12px] tabular-nums text-white backdrop-blur-md">{(t / 1000).toFixed(1)} sn</span>;
}

