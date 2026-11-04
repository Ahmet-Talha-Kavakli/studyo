"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Combine, Plus, Trash2, Copy, Clock, Check, X, Loader2, Play, Upload, Sparkles, Download, Layers, ArrowRight, Type as TypeIcon, Film, Images, Music2 } from "lucide-react";
import { cn, saltUrl } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useEscKapat, useScrollKilit } from "@/hooks/useScrollKilit";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useMontaj, montajToplamSure, type MontajProje, type MontajOran } from "@/store/useMontaj";
import { gorselKaynak, medyaSuresi } from "@/lib/montajMotor";
import { kisaSure, medyayiEkle, katmanBul, dosyalariIceAl } from "./ortak";
import { SABLONLAR, sablonKur, klipAdi, sablonAlt, type Sablon } from "./MontajPanellerEk";
import { Segment } from "./ui";
import { Kart } from "@/components/film/ortak";

const P = (d: string) => `/gercek/video-hareket/${d}-poster.webp`;
const V = (d: string) => `/gercek/video-hareket/${d}.mp4`;

const FORMATLAR: { oran: MontajOran; ad: string; alt: string; kapak: string; w: number; h: number }[] = [
  { oran: "16:9", ad: "Yatay video", alt: "YouTube · sunum", kapak: "drone-orbit", w: 150, h: 84 },
  { oran: "9:16", ad: "Dikey video", alt: "Reels · TikTok · Shorts", kapak: "skate-cruise", w: 52, h: 92 },
  { oran: "1:1", ad: "Kare", alt: "Gönderi · reklam", kapak: "orbit-left", w: 88, h: 88 },
  { oran: "4:5", ad: "Portre", alt: "Instagram akışı", kapak: "push-to-glass", w: 74, h: 92 },
];
const ORNEK = ["drone-orbit", "orbit-left", "push-to-glass", "jib-up"];
const HERO = ["drone-orbit", "skate-cruise", "push-to-glass", "dutch-angle", "jib-up"];

function goreli(t?: number): string {
  if (!t) return "";
  const d = (Date.now() - t) / 1000;
  if (d < 60) return "az önce";
  if (d < 3600) return `${Math.floor(d / 60)} dk önce`;
  if (d < 86400) return `${Math.floor(d / 3600)} sa önce`;
  if (d < 172800) return "dün";
  return new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}
/** Montaj kartının kareleri: görüntü kliplerinin ilk beşi. */
const kareler = (p: MontajProje): string[] => {
  const l: string[] = [];
  for (const kat of p.katmanlar) for (const k of [...kat.klipler].sort((a, b) => a.baslangic - b.baslangic)) {
    const g = k.tur !== "ses" && k.tur !== "metin" ? gorselKaynak(k.gorselUrl) : undefined;
    if (g && !l.includes(g)) l.push(g);
    if (l.length >= 5) return l;
  }
  const m = gorselKaynak(p.medya?.find((x) => x.tur !== "ses")?.poster);
  return l.length ? l : m ? [m] : [];
};
const uygunMu = (u: Uretim) => u.durum === "tamam" && !u.id.startsWith("seed_") && ((u.tur === "video" && !!u.videoUrl) || (u.tur === "gorsel" && !!saltUrl(u.gorselUrl)));

export function MontajGiris() {
  const projeler = useMontaj((s) => s.projeler);
  const st = useMontaj.getState;
  const [secici, setSecici] = useState(false);
  const [mesgul, setMesgul] = useState<string | null>(null);
  const [surukle, setSurukle] = useState(false);
  const [sekme, setSekme] = useState<"olustur" | "montajlar">("olustur");
  const [oran, setOran] = useState<MontajOran>("16:9");
  const dosyaRef = useRef<HTMLInputElement>(null);
  const uretimler = useProjeler((s) => s.uretimler);
  const uygun = useMemo(() => uretimler.filter(uygunMu), [uretimler]);

  const yeni = (oran: MontajOran) => { st().projeOlustur({ ad: "Adsız montaj", enBoy: oran }); };
  const ornek = async () => {
    setMesgul("ornek");
    const id = st().projeOlustur({ ad: "Örnek montaj", enBoy: "16:9" });
    for (const d of ORNEK) {
      const sure = (await medyaSuresi(V(d), "video")) ?? 5;
      const kid = medyayiEkle(id, { id: d, ad: klipAdi(d), tur: "video", url: V(d), poster: P(d), sure: Math.min(sure, 4) });
      if (kid && d !== ORNEK[0]) st().klipGuncelle(id, kid, { gecis: "fade", gecisSure: 0.5 });
    }
    const kat = katmanBul(id, "metin");
    if (kat) st().klipEkle(id, kat, { ad: "Başlık", tur: "metin", metin: "İlk montajım", baslangic: 0.3, sure: 2.8, metinStil: "baslik", metinBoyut: 110, metinKonum: "orta", metinAnim: "pop" });
    setMesgul(null);
    toast.success("Örnek montaj hazır", { description: "Oynatıp düzenleyebilir, sonra dışa aktarabilirsin." });
  };
  const dosyalar = async (l: File[]) => {
    if (!l.length) return;
    setMesgul("dosya");
    const id = st().projeOlustur({ ad: "Yeni montaj", enBoy: "16:9" });
    const eklenen = await dosyalariIceAl(id, l);
    for (const m of eklenen) medyayiEkle(id, m);
    setMesgul(null);
    if (!eklenen.length) { st().projeSil(id); return; }
    toast.success(`${eklenen.length} dosya zaman çizelgesine dizildi`);
  };
  const sablon = async (s: Sablon) => { setMesgul(s.id); try { await sablonKur(s); } finally { setMesgul(null); } };
  const sil = (p: MontajProje) => {
    st().projeSil(p.id);
    toast("Montaj silindi", { description: `${p.ad} silindi.`, action: { label: "Geri al", onClick: () => { st().projeOlustur({ ...p }); st().projeSec(null); } } });
  };
  const cogalt = (p: MontajProje) => { st().projeOlustur({ ...JSON.parse(JSON.stringify(p)), ad: `${p.ad} (kopya)` }); st().projeSec(null); toast.success("Montaj çoğaltıldı"); };
  const sirali = useMemo(() => [...projeler].sort((a, b) => b.guncelleme - a.guncelleme), [projeler]);

  return (
    <div className="min-h-[calc(100dvh-var(--ust-nav))] bg-zemin">
      <div className="mx-auto max-w-[1240px] space-y-4 px-4 pb-24 pt-4 sm:px-6 sm:pt-5">
        {/* Başlık kartı: stüdyo adı + Oluştur / Montajlarım */}
        <div className="flex min-h-[64px] items-center gap-3 rounded-[22px] bg-[#121315] px-3 py-2.5 ring-1 ring-inset ring-white/[0.07] sm:px-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.085] text-white"><Combine className="h-5 w-5" /></span>
          <span className="min-w-0 max-sm:hidden"><span className="block truncate text-[15.5px] font-semibold tracking-[-0.01em] text-white">Montaj stüdyosu</span><span className="block truncate text-[12.5px] text-white/50">Klipleri birleştir, yazı ve müzik ekle, MP4 indir</span></span>
          <span className="flex-1" />
          <div role="tablist" className="isolate flex gap-0.5 rounded-full p-[3px] ring-1 ring-inset ring-white/[0.08]" style={{ background: "rgba(255,255,255,0.04)" }}>
            {([["olustur", "Oluştur", Sparkles, 0], ["montajlar", "Montajlarım", Film, sirali.length]] as const).map(([id, ad, I, n]) => (
              <button key={id} role="tab" aria-selected={sekme === id} onClick={() => setSekme(id)} className={cn("relative flex h-9 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-medium transition-colors", sekme === id ? "text-black" : "text-metin-2 hover:text-metin")}>
                {sekme === id && <motion.span layoutId="mj-ust" transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0 -z-10 rounded-full bg-white" />}
                <I className="h-4 w-4" />{ad}{n > 0 && <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", sekme === id ? "bg-black/10" : "bg-white/[0.08]")}>{n}</span>}
              </button>
            ))}
          </div>
        </div>

        {sekme === "olustur" && (<>
        {/* 1 · Başlat: arkada oynayan örnek; solda başlık + format seçici + tek ana düğme, sağda canlı zaman çizelgesi */}
        <section className="relative isolate overflow-hidden rounded-[28px] bg-[#0b0c0e] ring-1 ring-inset ring-white/[0.08]">
          <video src={V("drone-orbit")} poster={P("drone-orbit")} autoPlay muted loop playsInline aria-hidden className="absolute inset-0 -z-10 h-full w-full object-cover" />
          <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#0b0c0e_0%,rgba(11,12,14,0.93)_34%,rgba(11,12,14,0.55)_64%,rgba(11,12,14,0.35)_100%)] max-lg:bg-[linear-gradient(180deg,rgba(11,12,14,0.6)_0%,rgba(11,12,14,0.9)_50%,#0b0c0e_100%)]" />
          <div className="grid grid-cols-[minmax(0,1fr)] gap-7 px-5 py-7 sm:px-9 sm:py-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:items-center lg:gap-10">
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-w-0">
              <h1 className="text-[38px] font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-[54px]">
                Kliplerini birleştir<br /><span className="hero-isilti">hikâyeni kur</span>
              </h1>
              <p className="mt-3.5 max-w-[460px] text-[15px] leading-relaxed text-white/70">Üretimlerini ve kendi çekimlerini kes, yazı ve müzik ekle; tarayıcında MP4 olarak indir.</p>
              <div className="cam-istemci mt-6 max-w-[540px] rounded-[24px] p-2.5">
                <div role="radiogroup" aria-label="Format" className="grid grid-cols-4 gap-1.5">
                  {FORMATLAR.map((f) => {
                    const sec = oran === f.oran;
                    return (
                      <button key={f.oran} role="radio" aria-checked={sec} onClick={() => setOran(f.oran)} title={f.alt}
                        className={cn("relative flex flex-col items-center gap-2 rounded-[16px] px-1 pb-2.5 pt-3 transition-colors", sec ? "bg-white/[0.12]" : "hover:bg-white/[0.08]")}>
                        <span className="flex h-11 items-center"><span className={cn("relative block overflow-hidden rounded-[5px] ring-1 transition", sec ? "ring-white" : "ring-white/25 opacity-70")} style={{ width: f.w * 0.42, height: f.h * 0.42 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={P(f.kapak)} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        </span></span>
                        <span className="leading-tight"><span className={cn("block text-[12.5px] font-semibold", sec ? "text-white" : "text-white/70")}>{f.ad.replace(" video", "")}</span><span className="block text-[11px] tabular-nums text-white/45">{f.oran}</span></span>
                        {sec && <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[16px] ring-2 ring-inset ring-white" />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2.5 flex gap-2 max-sm:flex-col">
                  <button onClick={() => yeni(oran)} className="flex h-12 flex-1 whitespace-nowrap items-center justify-center gap-2 rounded-full bg-white px-5 text-[14.5px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]"><Plus className="h-[18px] w-[18px]" />Yeni montaj aç</button>
                  <button onClick={() => void ornek()} disabled={!!mesgul} className="flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white/[0.1] px-5 text-[14px] font-medium text-white ring-1 ring-inset ring-white/[0.12] transition hover:bg-white/[0.16] active:scale-[0.98] disabled:opacity-60">
                    {mesgul === "ornek" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}Örnekle dene
                  </button>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }} className="cam-istemci relative rounded-[24px] p-3.5 max-sm:hidden">
              <HeroKurgu />
            </motion.div>
          </div>
        </section>

        {/* 2 · Son montajlar: kaldığın yerden */}
        {sirali.length > 0 && (
          <Kart baslik={<span className="flex items-center gap-2">Kaldığın yerden devam et<span className="rounded-full bg-white/[0.085] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-white/75">{sirali.length}</span></span>} alt="En son düzenlediğin montajlar" ikon={Clock} govde="p-3 sm:p-4"
            sag={sirali.length > 4 ? <button onClick={() => setSekme("montajlar")} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.085] px-3.5 text-[13px] font-medium text-white/85 transition hover:bg-white/[0.14] active:scale-[0.97]">Tümünü gör<ArrowRight className="h-4 w-4" /></button> : undefined}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {sirali.slice(0, 4).map((p, i) => {
                const k = kareler(p);
                const klip = p.katmanlar.reduce((t, x) => t + x.klipler.length, 0);
                return (
                  <motion.button key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={() => st().projeSec(p.id)}
                    className="group relative overflow-hidden rounded-[18px] text-left ring-1 ring-inset ring-white/[0.07] transition hover:ring-white/[0.2]" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <span className="relative block aspect-video overflow-hidden bg-[#111214]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {k[0] ? <img src={k[0]} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                        : <span className="absolute inset-0 flex items-center justify-center text-metin-3"><Film className="h-6 w-6" /></span>}
                      <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur">{p.enBoy}</span>
                      <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur"><Clock className="h-3 w-3" />{kisaSure(montajToplamSure(p))}</span>
                      <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"><span className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black">Devam et<ArrowRight className="h-4 w-4" /></span></span>
                    </span>
                    <span className="block px-3 py-2.5"><span className="block truncate text-[14px] font-semibold text-metin">{p.ad}</span><span className="block truncate text-[12px] text-metin-3">{klip} klip · {goreli(p.guncelleme)}</span></span>
                  </motion.button>
                );
              })}
              {sirali.length < 4 && (
                <button onClick={() => yeni(oran)} className="group flex flex-col items-center justify-center gap-3 rounded-[18px] text-center ring-1 ring-inset ring-white/[0.07] transition hover:ring-white/[0.2]" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition-transform group-hover:scale-105"><Plus className="h-5 w-5" /></span>
                  <span><span className="block text-[14px] font-semibold text-metin">Yeni montaj</span><span className="block text-[12px] tabular-nums text-metin-3">{oran} · boş zaman çizelgesi</span></span>
                </button>
              )}
              {SABLONLAR.slice(0, Math.max(0, 3 - sirali.length)).map((x) => (
                <button key={x.id} onClick={() => void sablon(x)} disabled={!!mesgul} className="group relative min-h-[150px] overflow-hidden rounded-[18px] text-left ring-1 ring-inset ring-white/[0.07] transition hover:ring-white/[0.2]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={P(x.kapak)} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">Şablon</span>
                  <span className="absolute inset-x-3 bottom-3 flex items-end gap-2"><span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-white">{x.ad}</span><span className="block truncate text-[12px] text-white/70">{x.oran} · {kisaSure(x.klipler.length * x.sure)}</span></span>{mesgul === x.id ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <ArrowRight className="h-4 w-4 text-white" />}</span>
                </button>
              ))}
            </div>
          </Kart>
        )}

        {/* 3 · Medyayla başla */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Kart baslik="Dosyalarından başla" alt="Seçtiğin sırayla zaman çizelgesine dizilir" ikon={Upload} govde="p-3 sm:p-4" sag={<span className="rounded-full bg-white/[0.085] px-2.5 py-0.5 text-[12px] text-metin-2">300 MB&apos;a kadar</span>}>
            <div onClick={() => !mesgul && dosyaRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); dosyaRef.current?.click(); } }}
              onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setSurukle(true); } }} onDragLeave={() => setSurukle(false)}
              onDrop={(e) => { e.preventDefault(); setSurukle(false); void dosyalar([...e.dataTransfer.files]); }}
              className={cn("relative flex h-[188px] cursor-pointer flex-col items-center justify-center gap-4 rounded-[18px] ring-inset transition-[background-color,box-shadow]", surukle ? "bg-white/[0.12] ring-2 ring-white" : "ring-1 ring-white/[0.08] hover:bg-white/[0.065]")} style={surukle ? undefined : { background: "rgba(255,255,255,0.035)" }}>
              <input ref={dosyaRef} type="file" multiple accept="video/mp4,video/webm,video/quicktime,image/png,image/jpeg,image/webp,audio/*" hidden onChange={(e) => { const l = [...(e.target.files ?? [])]; e.target.value = ""; void dosyalar(l); }} />
              <span className="flex items-center gap-2.5">
                {([[Film, "Video", "#55d6fd"], [Images, "Görsel", "#f472b6"], [Music2, "Ses", "#34d399"]] as const).map(([I, ad, renk]) => (
                  <span key={ad} className="flex h-10 items-center gap-2 rounded-full bg-white/[0.085] pl-1 pr-3.5 text-[13px] font-medium text-metin ring-1 ring-inset ring-white/[0.08]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: `${renk}26`, color: renk }}><I className="h-4 w-4" /></span>{ad}
                  </span>
                ))}
              </span>
              <span className="flex items-center gap-2.5">
                <span className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black">{mesgul === "dosya" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{surukle ? "Bırak, montaj açılsın" : "Dosya seç"}</span>
                <span className="text-[13px] text-metin-2">ya da buraya sürükle</span>
              </span>
            </div>
          </Kart>
          <Kart baslik="Üretimlerinden başla" alt={uygun.length ? "Video ve görsellerini seç, birleştir" : "Önce bir stüdyoda üret, burada hazır olur"} ikon={Sparkles} govde="p-3 sm:p-4"
            sag={uygun.length ? <span className="rounded-full bg-white/[0.085] px-2.5 py-0.5 text-[12px] font-semibold tabular-nums text-metin-2">{uygun.length} hazır</span> : undefined}>
            {uygun.length ? (
              <button onClick={() => setSecici(true)} className="group block w-full text-left">
                <span className="grid h-[188px] grid-cols-4 gap-2">
                  {uygun.slice(0, 4).map((u, i) => (
                    <span key={u.id} className="relative overflow-hidden rounded-[14px] bg-black ring-1 ring-inset ring-white/[0.08]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={saltUrl(u.gorselUrl)} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[11px] font-semibold text-white">{i + 1}</span>
                      {i === 3 && uygun.length > 4 && <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[15px] font-semibold text-white">+{uygun.length - 4}</span>}
                    </span>
                  ))}
                </span>
                <span className="mt-3 flex items-center gap-1.5 text-[13.5px] font-semibold text-metin">Seç ve birleştir<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
              </button>
            ) : (
              <div className="grid h-[188px] grid-cols-3 gap-2">
                {([["/panel/video", "Video üret", "/gercek/hero-video/hero-video-poster.webp", Film], ["/panel/gorsel", "Görsel üret", "/gercek/gorsel/gorsel-karakter-Sofia.webp", Images], ["/panel/muzik", "Müzik üret", "/gercek/muzik/ms-neon.webp", Music2]] as const).map(([href, ad, g, I]) => (
                  <Link key={href} href={href} className="group relative overflow-hidden rounded-[14px] bg-black ring-1 ring-inset ring-white/[0.08] transition hover:ring-white/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                    <span className="absolute inset-x-2.5 bottom-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-white"><I className="h-3.5 w-3.5" />{ad}<ArrowRight className="ml-auto h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" /></span>
                  </Link>
                ))}
              </div>
            )}
          </Kart>
        </div>

        {/* 4 · Şablonlar: kendi oranında oynayan önizleme + kare şeridi */}
        <Kart baslik={<span className="flex items-center gap-2">Hazır şablonlar<span className="rounded-full bg-white/[0.085] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-white/75">{SABLONLAR.length}</span></span>} alt="Kurgu, yazı, geçiş ve müzik hazır; klipleri kendi medyanla değiştir" ikon={Layers} govde="p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SABLONLAR.map((x, i) => <SablonKart key={x.id} s={x} i={i} kuruluyor={mesgul === x.id} kapali={!!mesgul} onSec={() => void sablon(x)} />)}
          </div>
        </Kart>
        </>)}

        {/* Montajlarım */}
        {sekme === "montajlar" && !sirali.length && (
          <Kart baslik="Montajlarım" alt="Henüz montajın yok" ikon={Film} govde="p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-3 rounded-[18px] px-4 py-3.5 ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.085]"><Combine className="h-4 w-4 text-white" /></span>
              <span className="min-w-0 flex-1 text-[13.5px] text-metin-2">Boş bir montaj aç ya da örnek kliplerle dene; düzenledikçe burada görünür.</span>
              <button onClick={() => yeni("16:9")} className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97]"><Plus className="h-4 w-4" />Yeni montaj</button>
              <button onClick={() => void ornek()} disabled={!!mesgul} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.085] px-4 text-[13px] font-medium text-white transition hover:bg-white/[0.14] active:scale-[0.97]">{mesgul === "ornek" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}Örnekle dene</button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SABLONLAR.map((x, i) => <SablonKart key={x.id} s={x} i={i} kuruluyor={mesgul === x.id} kapali={!!mesgul} onSec={() => void sablon(x)} />)}
            </div>
          </Kart>
        )}
        {sirali.length > 0 && sekme === "montajlar" && (
          <Kart baslik={<span className="flex items-center gap-2">Montajlarım<span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-white/75">{sirali.length}</span></span>} alt="En son düzenlenen önce" ikon={Film} govde="p-3 sm:p-4"
            sag={<button onClick={() => yeni("16:9")} className="flex h-9 items-center gap-1.5 rounded-full bg-white/[0.085] px-3.5 text-[13px] font-medium text-white/85 transition hover:bg-white/[0.14] active:scale-[0.97]"><Plus className="h-4 w-4" />Yeni montaj</button>}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sirali.map((p, i) => {
                const k = kareler(p);
                const klip = p.katmanlar.reduce((a, x) => a + x.klipler.length, 0);
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}
                    className="group relative overflow-hidden rounded-[20px] bg-white/[0.045] ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.05] hover:ring-white/[0.16]">
                    <button onClick={() => st().projeSec(p.id)} aria-label={`${p.ad} montajını aç`} className="block w-full text-left">
                      <span className="relative block aspect-video overflow-hidden bg-[#111214]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {k[0] ? <img src={k[0]} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                          : <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-metin-3"><Film className="h-6 w-6" /><span className="text-[12.5px]">Boş montaj</span></span>}
                        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25" />
                        <span className="absolute left-3 top-3 flex gap-1.5">
                          <span className="rounded-full bg-black/55 px-2.5 py-1 text-[11.5px] font-medium tabular-nums text-white backdrop-blur">{p.enBoy}</span>
                          <span className="flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11.5px] font-medium tabular-nums text-white backdrop-blur"><Clock className="h-3 w-3" />{kisaSure(montajToplamSure(p))}</span>
                        </span>
                        {k.length > 1 && (
                          <span className="absolute bottom-3 left-3 flex gap-1">
                            {k.slice(1, 5).map((g) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={g} src={g} alt="" className="h-9 w-14 rounded-[6px] object-cover ring-1 ring-white/25" />
                            ))}
                          </span>
                        )}
                        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <span className="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-[13.5px] font-semibold text-[#0a0a0b]"><Play className="h-3.5 w-3.5 fill-current" />Düzenle</span>
                        </span>
                      </span>
                      <span className="block p-3.5 pt-3">
                        <span className="block truncate text-[15.5px] font-semibold text-metin">{p.ad}</span>
                        <span className="mt-0.5 block truncate text-[12.5px] text-metin-3">{klip} klip · {p.cozunurluk} · {goreli(p.guncelleme)}</span>
                      </span>
                    </button>
                    <span className="absolute right-2.5 top-2.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100">
                      <button onClick={() => cogalt(p)} aria-label="Çoğalt" title="Çoğalt" className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/75"><Copy className="h-3.5 w-3.5" /></button>
                      <button onClick={() => sil(p)} aria-label="Sil" title="Sil" className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-rose-500/80"><Trash2 className="h-3.5 w-3.5" /></button>
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </Kart>
        )}
      </div>
      <AnimatePresence>{secici && <UretimSecici uygun={uygun} onKapat={() => setSecici(false)} />}</AnimatePresence>
    </div>
  );
}

/** Hero görseli: kendi kendine oynayan küçük bir montaj — önizleme, yazı, video ve müzik izleri, ilerleyen playhead. */
function HeroKurgu() {
  const [i, setI] = useState(0);
  const [hareket, setHareket] = useState(true);
  useEffect(() => {
    const az = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setHareket(!az);
    if (az) return;
    const t = setInterval(() => setI((v) => (v + 1) % HERO.length), 1600);
    return () => clearInterval(t);
  }, []);
  const dalga = useMemo(() => Array.from({ length: 64 }, (_, k) => 0.25 + 0.75 * Math.abs(Math.sin(k * 0.7) * Math.cos(k * 0.23))), []);
  return (
    <div className="relative">
      <div className="relative aspect-video overflow-hidden rounded-[12px] bg-black">
        {HERO.map((d, k) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={d} src={P(d)} alt="" className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-500", k === i ? "opacity-100" : "opacity-0")} />
        ))}
        {/* Kesimde oynayan gerçek klip (poster altta, yüklenince üstüne biner) */}
        {hareket && <video key={HERO[i]} src={V(HERO[i])} poster={P(HERO[i])} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />}
        <span className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <span className={cn("absolute inset-x-0 bottom-[11%] text-center text-[clamp(20px,2.6vw,34px)] font-extrabold tracking-[-0.02em] text-white transition-opacity duration-500 [text-shadow:0_2px_16px_rgba(0,0,0,0.6)]", i < 2 ? "opacity-100" : "opacity-0")}>Yaz tatili</span>
      </div>
      <div className="flex items-center gap-2.5 px-1 py-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#0b0c0e]">{hareket ? <span className="flex gap-[3px]"><span className="h-2.5 w-[3px] rounded-full bg-current" /><span className="h-2.5 w-[3px] rounded-full bg-current" /></span> : <Play className="h-3 w-3 translate-x-px fill-current" />}</span>
        <span className="text-[12px] tabular-nums text-metin-2">0:0{Math.floor(i * 1.6)} <span className="text-metin-3">/ 0:08</span></span>
        <span className="flex-1" />
        <span className="hidden items-center gap-1.5 rounded-full bg-white/[0.085] px-2.5 py-1 text-[11.5px] text-white/80 sm:flex"><Layers className="h-3 w-3" />3 katman</span>
      </div>
      <div className="relative space-y-1.5 overflow-hidden rounded-[12px] bg-black/35 p-2">
        <div className="flex h-6">
          <span className="ml-[3%] flex w-[36%] items-center gap-1 rounded-[6px] bg-[#3a2e14] px-2 text-[11px] font-medium text-amber-50 ring-1 ring-inset ring-amber-300/25"><TypeIcon className="h-3 w-3 text-amber-300" />Yaz tatili</span>
        </div>
        <div className="flex h-11 gap-[3px] sm:h-12">
          {HERO.map((d, k) => (
            <span key={d} className={cn("relative flex-1 overflow-hidden rounded-[6px] ring-inset transition-shadow", k === i ? "outline outline-2 -outline-offset-2 outline-aksan" : "outline outline-1 -outline-offset-1 outline-white/10")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={P(d)} alt="" className="absolute inset-0 h-full w-full object-cover" />
            </span>
          ))}
        </div>
        <div className="flex h-7 items-center gap-[2px] rounded-[6px] bg-[#14251f] px-1.5 ring-1 ring-inset ring-emerald-300/15">
          {dalga.map((v, k) => <span key={k} className="flex-1 rounded-full bg-emerald-300/70" style={{ height: `${v * 70}%` }} />)}
        </div>
        <span className={cn("pointer-events-none absolute inset-y-1 w-[2px] rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]", hareket ? "montaj-oynat" : "left-[30%]")} />
      </div>
    </div>
  );
}

/** Şablon kartı: üstte şablonun kendi oranında oynayan önizlemesi (bulanık zeminde), altta ad, özellikler ve kliplerin kare şeridi. */
function SablonKart({ s, i, kuruluyor, kapali, onSec }: { s: Sablon; i: number; kuruluyor: boolean; kapali: boolean; onSec: () => void }) {
  const [oyna, setOyna] = useState(false);
  const [w, h] = s.oran.split(":").map(Number);
  return (
    <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.04 }} onClick={onSec} disabled={kapali}
      onPointerEnter={(e) => e.pointerType === "mouse" && setOyna(true)} onPointerLeave={() => setOyna(false)}
      className="group overflow-hidden rounded-[20px] text-left ring-1 ring-inset ring-white/[0.07] transition hover:ring-white/[0.22] disabled:cursor-wait" style={{ background: "rgba(255,255,255,0.03)" }}>
      <span className="relative block aspect-[16/10] overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={P(s.kapak)} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl" />
        <span className="absolute inset-0 flex items-center justify-center p-4">
          <span className="relative block h-full max-w-full overflow-hidden rounded-[10px] ring-1 ring-white/15 transition-transform duration-500 group-hover:scale-[1.03]" style={{ aspectRatio: `${w} / ${h}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={P(s.kapak)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            {oyna && <video src={V(s.kapak)} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />}
            {s.baslik && <span className="absolute inset-x-1.5 top-1/2 line-clamp-2 -translate-y-1/2 text-center text-[13px] font-extrabold leading-tight text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.7)]">{s.baslik.metin}</span>}
          </span>
        </span>
        <span className="absolute left-3 top-3 flex gap-1">
          <span className="rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur">{s.oran}</span>
          <span className="rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white backdrop-blur">{kisaSure(s.klipler.length * s.sure)}</span>
        </span>
        {kuruluyor && <span className="absolute inset-0 flex items-center justify-center bg-black/60"><Loader2 className="h-6 w-6 animate-spin text-white" /></span>}
      </span>
      <span className="flex items-center gap-3 px-3.5 pb-3.5 pt-3">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-metin">{s.ad}</span>
          <span className="block truncate text-[12.5px] text-metin-3">{sablonAlt(s)}</span>
          <span className="mt-2.5 flex gap-1">
            {s.klipler.slice(0, 6).map((k) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={k} src={P(k)} alt="" className="h-8 w-11 rounded-[5px] object-cover ring-1 ring-white/10" />
            ))}
          </span>
        </span>
        <span className="flex h-9 shrink-0 items-center gap-1 self-end rounded-full bg-white/[0.085] px-3.5 text-[13px] font-semibold text-white transition group-hover:bg-white group-hover:text-black">Kullan<ArrowRight className="h-3.5 w-3.5" /></span>
      </span>
    </motion.button>
  );
}

function UretimSecici({ uygun, onKapat }: { uygun: Uretim[]; onKapat: () => void }) {
  const [secim, setSecim] = useState<string[]>([]);
  const [oran, setOran] = useState<MontajOran>("16:9");
  const [mesgul, setMesgul] = useState(false);
  useScrollKilit(true);
  useEscKapat(true, onKapat);
  const olustur = async () => {
    setMesgul(true);
    const st = useMontaj.getState();
    const id = st.projeOlustur({ ad: "Yeni montaj", enBoy: oran });
    for (const uid of secim) {
      const u = uygun.find((x) => x.id === uid); if (!u) continue;
      const video = u.tur === "video";
      const url = video ? u.videoUrl! : saltUrl(u.gorselUrl)!;
      const sure = video ? (await medyaSuresi(url, "video")) ?? 5 : 4;
      medyayiEkle(id, { id: u.id, ad: u.baslik || "Klip", tur: video ? "video" : "gorsel", url, poster: saltUrl(u.gorselUrl), sure, kaynakId: u.id });
    }
    setMesgul(false);
    toast.success(`${secim.length} klip ile montaj oluşturuldu`);
  };
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/55" onClick={onKapat} />
      <motion.div role="dialog" aria-modal="true" aria-label="Üretimlerinden seç" initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className="fixed inset-y-2 right-2 z-[201] flex w-[min(calc(100vw-16px),620px)] flex-col overflow-hidden rounded-[24px] border border-white/[0.09] bg-[#1b1c1f]">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 pb-4 pt-5">
          <span className="min-w-0 flex-1"><span className="block text-[17px] font-semibold text-metin">Klipleri seç</span><span className="mt-0.5 block text-[13px] text-metin-2">Seçtiğin sırayla zaman çizelgesine dizilir.</span></span>
          <button onClick={onKapat} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full text-metin-2 hover:bg-white/[0.07] hover:text-metin"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:thin]">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {uygun.map((u) => {
              const sira = secim.indexOf(u.id);
              return (
                <button key={u.id} onClick={() => setSecim((l) => (sira >= 0 ? l.filter((x) => x !== u.id) : [...l, u.id]))} aria-pressed={sira >= 0}
                  className={cn("group relative aspect-video overflow-hidden rounded-[12px] bg-white/[0.055] ring-inset transition-shadow", sira >= 0 ? "outline outline-2 -outline-offset-2 outline-white" : "outline outline-1 -outline-offset-1 outline-white/10 hover:outline-white/30")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={saltUrl(u.gorselUrl)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white">{u.tur === "video" ? <Film className="h-3 w-3" /> : <Images className="h-3 w-3" />}</span>
                  {sira >= 0 && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[12px] font-bold text-black">{sira + 1}</span>}
                  
                  <span className="absolute inset-x-2.5 bottom-2 truncate pr-10 text-left text-[12px] font-medium text-white">{u.baslik}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] px-5 py-4">
          <div className="w-[260px] max-w-full"><Segment etiket="Format" deger={oran} onDegis={setOran} secenekler={[["16:9", "16:9"], ["9:16", "9:16"], ["1:1", "1:1"], ["4:5", "4:5"]]} /></div>
          <span className="text-[13px] text-metin-2">{secim.length ? `${secim.length} klip seçildi` : "Klip seç"}</span>
          <button onClick={() => void olustur()} disabled={!secim.length || mesgul} className="ml-auto flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition hover:bg-white/90 active:scale-[0.97] disabled:bg-white/[0.08] disabled:text-white/40">
            {mesgul ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Montajı oluştur
          </button>
        </div>
      </motion.div>
    </>
  );
}
