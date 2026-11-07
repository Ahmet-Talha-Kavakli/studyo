"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarClock, Check, ChevronLeft, ChevronRight, GraduationCap, History, Layers3, Lightbulb, Loader2, MessageSquare, Pause, Play, RotateCcw, Send, Shuffle, X } from "lucide-react";
import { SesAvatar } from "@/components/studyo/ses/ortak";
import { api, gorece } from "@/lib/build/istemci";
import { katla, type GorevSonucu, type KartlarSonucu, type SesliOzetSonucu, type SohbetlerSonucu, type TestSonucu } from "@/lib/build/sohbetTipler";
import { cn } from "@/lib/utils";
import { SesAyarDugmesi, sesAyariOku, sesAyariYaz, soyle, turkceSesler, useSesler, type SesAyari } from "./Ses";

function saklananOku<T>(k: string, v: T): T { try { const x = localStorage.getItem(k); return x ? (JSON.parse(x) as T) : v; } catch { return v; } }
function sakla(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* yok */ } }
const karistir = <T,>(l: T[]) => { const a = [...l]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ───────────── Test ───────────── */
type Cevap = { deger: string; dogru: boolean };
const eslesir = (a: string, b: string) => { const x = katla(a).replace(/[^\p{L}\p{N}]+/gu, " ").trim(), y = katla(b).replace(/[^\p{L}\p{N}]+/gu, " ").trim(); return !!x && (x === y || (y.length > 3 && (x.includes(y) || y.includes(x)))); };

/** Etkileşimli test (ChatGPT Study, Gemini Guided Learning, Perplexity Learn gibi): tek tek soru, anında geri bildirim, puan. */
export function TestKarti({ t, kimlik, gonder }: { t: TestSonucu; kimlik: string; gonder?: (metin: string) => boolean | void }) {
  const anahtar = `vayra-test-${kimlik}`;
  const [cevaplar, setCevaplar] = useState<(Cevap | null)[]>(() => t.sorular.map(() => null));
  const [sira, setSira] = useState(0);
  const [yazi, setYazi] = useState("");
  const [ipucu, setIpucu] = useState(false);
  const [acikGoster, setAcikGoster] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);
  useEffect(() => { const k = saklananOku<{ c: (Cevap | null)[]; g?: boolean } | null>(anahtar, null); if (k?.c?.length === t.sorular.length) { setCevaplar(k.c); setGonderildi(!!k.g); const i = k.c.findIndex((x) => !x); setSira(i < 0 ? t.sorular.length : i); } }, [anahtar, t.sorular.length]);
  const kaydet = (c: (Cevap | null)[], g = gonderildi) => { setCevaplar(c); sakla(anahtar, { c, g }); };
  const s = t.sorular[sira];
  const c = cevaplar[sira];
  const bitti = sira >= t.sorular.length;
  const dogru = cevaplar.filter((x) => x?.dogru).length;
  const yanitla = (deger: string, dogruMu?: boolean) => {
    if (!s || c) return;
    const d = dogruMu ?? (s.tur === "coktan" || s.tur === "dogru-yanlis" ? deger === s.dogru : eslesir(deger, s.dogru));
    const l = [...cevaplar]; l[sira] = { deger, dogru: d }; kaydet(l); setYazi(""); setIpucu(false); setAcikGoster(false);
  };
  const ileri = () => { setSira((x) => x + 1); setIpucu(false); setAcikGoster(false); };
  const sonucGonder = () => {
    const yanlis = t.sorular.map((q, i) => ({ q, c: cevaplar[i] })).filter((x) => x.c && !x.c.dogru);
    const metin = `"${t.baslik}" testini bitirdim: ${t.sorular.length} sorudan ${dogru} doğru.${yanlis.length ? `\nYanlışlarım:\n${yanlis.map((x) => `- ${x.q.soru} (benim yanıtım: ${x.c!.deger}; doğrusu: ${x.q.dogru})`).join("\n")}\nZorlandığım noktaları açıkla ve bir sonraki adımı öner.` : "\nSıradaki konuya geçelim."}`;
    if (gonder?.(metin) !== false) { setGonderildi(true); sakla(anahtar, { c: cevaplar, g: true }); }
  };
  const yeniden = () => { kaydet(t.sorular.map(() => null), false); setGonderildi(false); setSira(0); };
  return (
    <div className="my-3 max-w-[620px] overflow-hidden rounded-[20px] bg-white/[0.04] ring-1 ring-inset ring-white/[0.09]">
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><GraduationCap className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-white">{t.baslik}</span><span className="block text-[12px] text-white/50">{t.sorular.length} soru{bitti ? ` · ${dogru} doğru` : ""}</span></span>
        <div className="flex gap-1">{t.sorular.map((_, i) => <button key={i} type="button" onClick={() => setSira(i)} aria-label={`Soru ${i + 1}`} className={cn("h-2 w-2 rounded-full transition-colors", cevaplar[i] ? (cevaplar[i]!.dogru ? "bg-emerald-400" : "bg-rose-400") : i === sira ? "bg-white" : "bg-white/20")} />)}</div>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={bitti ? "son" : sira} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }} className="p-4">
          {bitti ? (
            <div className="text-center">
              <p className="text-[34px] font-semibold tracking-[-0.02em] text-white">{dogru} <span className="text-white/35">/ {t.sorular.length}</span></p>
              <p className="mt-1 text-[13.5px] text-white/60">{dogru === t.sorular.length ? "Hepsi doğru, çok iyi." : dogru >= t.sorular.length * 0.6 ? "İyi gidiyorsun; yanlışlarına birlikte bakalım." : "Bu konuyu birlikte biraz daha çalışalım."}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {gonder && <button type="button" disabled={gonderildi} onClick={sonucGonder} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-50">{gonderildi ? <Check className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}{gonderildi ? "Sonuç gönderildi" : "Sonucu Vayra'ya gönder"}</button>}
                <button type="button" onClick={yeniden} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13px] text-white hover:bg-white/[0.12]"><RotateCcw className="h-3.5 w-3.5" />Yeniden çöz</button>
              </div>
            </div>
          ) : s && (
            <>
              <p className="text-[12px] text-white/45">Soru {sira + 1} · {s.tur === "coktan" ? "Çoktan seçmeli" : s.tur === "dogru-yanlis" ? "Doğru mu, yanlış mı?" : s.tur === "bosluk" ? "Boşluğu doldur" : "Açık uçlu"}</p>
              <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-white">{s.soru}</p>
              {(s.tur === "coktan" || s.tur === "dogru-yanlis") && (
                <div className="mt-3 grid gap-2">
                  {(s.tur === "coktan" ? s.secenekler ?? [] : ["Doğru", "Yanlış"]).map((x, k) => {
                    const secildi = c?.deger === x, dogruSecenek = !!c && x === s.dogru;
                    return (
                      <button key={x} type="button" disabled={!!c} onClick={() => yanitla(x)}
                        className={cn("flex items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-left text-[14px] ring-1 ring-inset transition-colors", !c ? "bg-white/[0.04] text-white/85 ring-white/[0.08] hover:bg-white/[0.08]" : dogruSecenek ? "bg-emerald-400/[0.12] text-emerald-100 ring-emerald-400/40" : secildi ? "bg-rose-500/[0.12] text-rose-100 ring-rose-400/40" : "bg-white/[0.02] text-white/45 ring-white/[0.05]")}>
                        <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold", dogruSecenek ? "bg-emerald-400 text-black" : secildi ? "bg-rose-400 text-black" : "bg-white/[0.08] text-white/70")}>{dogruSecenek ? <Check className="h-3.5 w-3.5" /> : secildi ? <X className="h-3.5 w-3.5" /> : String.fromCharCode(65 + k)}</span>{x}
                      </button>
                    );
                  })}
                </div>
              )}
              {(s.tur === "bosluk" || s.tur === "acik") && !c && (
                <form onSubmit={(e) => { e.preventDefault(); if (!yazi.trim()) return; if (s.tur === "acik") setAcikGoster(true); else yanitla(yazi.trim()); }} className="mt-3">
                  {s.tur === "acik" ? <textarea value={yazi} onChange={(e) => setYazi(e.target.value)} disabled={acikGoster} rows={3} placeholder="Yanıtını yaz" className="w-full resize-none rounded-[14px] bg-white/[0.05] px-3.5 py-2.5 text-[14px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/40 focus:ring-white/30" />
                    : <input value={yazi} onChange={(e) => setYazi(e.target.value)} placeholder="Boşluğa gelecek yanıt" className="h-11 w-full rounded-[14px] bg-white/[0.05] px-3.5 text-[14px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/40 focus:ring-white/30" />}
                  {!acikGoster && <button type="submit" disabled={!yazi.trim()} className="mt-2 h-9 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-30">{s.tur === "acik" ? "Yanıtı karşılaştır" : "Kontrol et"}</button>}
                </form>
              )}
              {s.tur === "acik" && acikGoster && !c && (
                <div className="mt-3 rounded-[14px] bg-white/[0.04] p-3 ring-1 ring-inset ring-white/[0.08]">
                  <p className="text-[12px] text-white/50">Örnek doğru yanıt</p><p className="mt-1 text-[13.5px] text-white/85">{s.dogru}</p>
                  <p className="mt-2.5 text-[12.5px] text-white/60">Kendi yanıtını nasıl değerlendiriyorsun?</p>
                  <div className="mt-1.5 flex gap-2"><button type="button" onClick={() => yanitla(yazi.trim(), true)} className="h-8 rounded-full bg-emerald-400/[0.16] px-3.5 text-[12.5px] text-emerald-100 ring-1 ring-inset ring-emerald-400/30">Doğru saydım</button><button type="button" onClick={() => yanitla(yazi.trim(), false)} className="h-8 rounded-full bg-rose-500/[0.12] px-3.5 text-[12.5px] text-rose-100 ring-1 ring-inset ring-rose-400/30">Eksik ya da yanlış</button></div>
                </div>
              )}
              {c && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn("mt-3 rounded-[14px] px-3.5 py-2.5 text-[13.5px] ring-1 ring-inset", c.dogru ? "bg-emerald-400/[0.08] text-emerald-100 ring-emerald-400/20" : "bg-rose-500/[0.08] text-rose-100 ring-rose-400/20")}>
                  <p className="font-semibold">{c.dogru ? "Doğru" : `Yanlış. Doğru yanıt: ${s.dogru}`}</p>
                  {s.aciklama && <p className="mt-1 text-white/75">{s.aciklama}</p>}
                </motion.div>
              )}
              <div className="mt-3 flex items-center gap-2">
                {s.ipucu && !c && <button type="button" onClick={() => setIpucu((x) => !x)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/75 hover:text-white"><Lightbulb className="h-3.5 w-3.5 text-amber-200" />İpucu</button>}
                {ipucu && s.ipucu && !c && <span className="text-[12.5px] text-amber-100/85">{s.ipucu}</span>}
                <span className="ml-auto" />
                {sira > 0 && <button type="button" onClick={() => setSira(sira - 1)} aria-label="Önceki soru" className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07]"><ChevronLeft className="h-4 w-4" /></button>}
                {c && <button type="button" onClick={ileri} className="inline-flex h-8 items-center gap-1 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black">{sira === t.sorular.length - 1 ? "Sonucu gör" : "Sonraki"}<ChevronRight className="h-3.5 w-3.5" /></button>}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ───────────── Bilgi kartları ───────────── */
export function KartlarKarti({ k, kimlik }: { k: KartlarSonucu; kimlik: string }) {
  const anahtar = `vayra-kart-${kimlik}`;
  const [sira, setSira] = useState<number[]>(() => k.kartlar.map((_, i) => i));
  const [i, setI] = useState(0);
  const [cevir, setCevir] = useState(false);
  const [bildim, setBildim] = useState<Record<number, boolean>>({});
  useEffect(() => { const x = saklananOku<{ b: Record<number, boolean>; s: number[]; i: number } | null>(anahtar, null); if (x?.s?.length === k.kartlar.length) { setBildim(x.b); setSira(x.s); setI(Math.min(x.i, x.s.length)); } }, [anahtar, k.kartlar.length]);
  useEffect(() => { sakla(anahtar, { b: bildim, s: sira, i }); }, [anahtar, bildim, sira, i]);
  const bitti = i >= sira.length;
  const kart = k.kartlar[sira[i]];
  const isaretle = (v: boolean) => { setBildim((b) => ({ ...b, [sira[i]]: v })); setCevir(false); setTimeout(() => setI((x) => x + 1), 120); };
  const tekrarlar = sira.filter((x) => bildim[x] === false);
  return (
    <div className="my-3 max-w-[560px] overflow-hidden rounded-[20px] bg-white/[0.04] ring-1 ring-inset ring-white/[0.09]">
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><Layers3 className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-white">{k.baslik}</span><span className="block text-[12px] tabular-nums text-white/50">{bitti ? "Tamamlandı" : `${i + 1} / ${sira.length}`} · {Object.values(bildim).filter(Boolean).length} bildin</span></span>
        <button type="button" onClick={() => { setSira(karistir(k.kartlar.map((_, x) => x))); setI(0); setBildim({}); setCevir(false); }} title="Karıştır ve baştan başla" aria-label="Karıştır" className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><Shuffle className="h-4 w-4" /></button>
      </div>
      <div className="p-4">
        {bitti ? (
          <div className="py-4 text-center">
            <p className="text-[15px] font-semibold text-white">{tekrarlar.length ? `${tekrarlar.length} kartı tekrar etmen iyi olur` : "Bütün kartları bildin"}</p>
            <div className="mt-3 flex justify-center gap-2">
              {tekrarlar.length > 0 && <button type="button" onClick={() => { setSira(tekrarlar); setI(0); setBildim({}); }} className="h-9 rounded-full bg-white px-4 text-[13px] font-semibold text-black">Tekrarları çalış</button>}
              <button type="button" onClick={() => { setSira(k.kartlar.map((_, x) => x)); setI(0); setBildim({}); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13px] text-white"><RotateCcw className="h-3.5 w-3.5" />Baştan</button>
            </div>
          </div>
        ) : kart && (
          <>
            <button type="button" onClick={() => setCevir((x) => !x)} className="block w-full [perspective:1200px]" aria-label="Kartı çevir">
              <motion.div animate={{ rotateY: cevir ? 180 : 0 }} transition={{ duration: 0.45, ease: [0.3, 0.7, 0.2, 1] }} className="relative h-[190px] w-full [transform-style:preserve-3d]">
                <span className="absolute inset-0 flex flex-col items-center justify-center rounded-[18px] bg-gradient-to-br from-[#16323d] to-[#141618] p-5 text-center ring-1 ring-inset ring-[#55d6fd]/20 [backface-visibility:hidden]">
                  <span className="text-[18px] font-semibold leading-snug text-white">{kart.on}</span><span className="mt-3 text-[12px] text-white/40">Çevirmek için dokun</span>
                </span>
                <span className="absolute inset-0 flex items-center justify-center overflow-auto rounded-[18px] bg-[#17181b] p-5 text-center text-[14.5px] leading-relaxed text-white/90 ring-1 ring-inset ring-white/[0.1] [backface-visibility:hidden] [transform:rotateY(180deg)]">{kart.arka}</span>
              </motion.div>
            </button>
            <div className="mt-3 flex items-center gap-2">
              <button type="button" disabled={i === 0} onClick={() => { setI(i - 1); setCevir(false); }} aria-label="Önceki kart" className="flex h-9 w-9 items-center justify-center rounded-full text-white/55 enabled:hover:bg-white/[0.07] disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" onClick={() => isaretle(false)} className="h-9 flex-1 rounded-full bg-rose-500/[0.1] text-[13px] text-rose-100 ring-1 ring-inset ring-rose-400/25 hover:bg-rose-500/[0.16]">Tekrar et</button>
              <button type="button" onClick={() => isaretle(true)} className="h-9 flex-1 rounded-full bg-emerald-400/[0.12] text-[13px] text-emerald-100 ring-1 ring-inset ring-emerald-400/30 hover:bg-emerald-400/[0.18]">Bildim</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ───────────── Sesli özet ───────────── */
/** İki sunuculu sesli özet (Gemini Audio Overview gibi): tarayıcı sesleriyle çalar, konuşan satır vurgulanır. */
export function SesliOzetKarti({ o }: { o: SesliOzetSonucu }) {
  const [calan, setCalan] = useState(-1);
  const [ayar, setAyarS] = useState<SesAyari>({ ses: "", hiz: 1 });
  const durdu = useRef(true);
  const liste = useRef<HTMLDivElement>(null);
  const sesler = useSesler();
  useEffect(() => setAyarS(sesAyariOku()), []);
  useEffect(() => () => { durdu.current = true; if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel(); }, []);
  const tr = turkceSesler(sesler);
  const sesA = tr.find((v) => v.name === ayar.ses) ?? tr[0] ?? null, sesB = tr.find((v) => v !== sesA) ?? sesA;
  const destek = typeof window !== "undefined" && "speechSynthesis" in window;
  const cal = async (bas = Math.max(0, calan)) => {
    if (!destek) return;
    speechSynthesis.cancel(); durdu.current = false;
    for (let i = bas; i < o.satirlar.length; i++) {
      if (durdu.current) return;
      setCalan(i);
      liste.current?.querySelector(`[data-satir="${i}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      const s = o.satirlar[i];
      await soyle(s.metin, ayar, { ses: s.k === "A" ? sesA : sesB, perde: s.k === "B" && sesA === sesB ? 1.25 : s.k === "A" && sesA === sesB ? 0.9 : undefined });
    }
    if (!durdu.current) { durdu.current = true; setCalan(-1); }
  };
  const dur = () => { durdu.current = true; speechSynthesis.cancel(); setCalan((x) => x); };
  const caliyor = calan >= 0 && !durdu.current;
  const ilerleme = calan < 0 ? 0 : (calan + 1) / o.satirlar.length;
  const sure = useMemo(() => Math.round(o.satirlar.reduce((t, s) => t + s.metin.split(/\s+/).length, 0) / 150 / ayar.hiz), [o.satirlar, ayar.hiz]);
  return (
    <div className="my-3 max-w-[620px] overflow-hidden rounded-[20px] bg-white/[0.04] ring-1 ring-inset ring-white/[0.09]">
      <div className="flex items-center gap-3 p-3.5">
        <span className="relative flex shrink-0"><SesAvatar ad="Sunucu A" renk="#55d6fd" boyut={40} aktif={caliyor && o.satirlar[calan]?.k === "A"} /><span className="-ml-3"><SesAvatar ad="Sunucu B" renk="#9085e9" boyut={40} aktif={caliyor && o.satirlar[calan]?.k === "B"} /></span></span>
        <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold text-white">{o.baslik}</span><span className="block text-[12px] text-white/50">Sesli özet · {o.satirlar.length} replik · yaklaşık {Math.max(1, sure)} dk</span></span>
        <SesAyarDugmesi a={ayar} set={(a) => { setAyarS(a); sesAyariYaz(a); }} />
        <button type="button" disabled={!destek} onClick={() => (caliyor ? dur() : cal())} aria-label={caliyor ? "Duraklat" : "Oynat"} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-30">{caliyor ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}</button>
      </div>
      <div className="mx-3.5 h-1 overflow-hidden rounded-full bg-white/[0.08]"><motion.div animate={{ width: `${ilerleme * 100}%` }} className="h-full rounded-full bg-[#55d6fd]" /></div>
      {!destek && <p className="px-3.5 pt-2 text-[12.5px] text-amber-200/80">Bu tarayıcı metni seslendiremiyor; metni aşağıdan okuyabilirsin.</p>}
      {destek && sesler.length > 0 && !tr.length && <p className="px-3.5 pt-2 text-[12.5px] text-amber-200/80">Tarayıcında Türkçe ses yok; metin yabancı aksanla okunur.</p>}
      <div ref={liste} className="max-h-[260px] space-y-1.5 overflow-auto p-3.5 [scrollbar-width:thin]">
        {o.satirlar.map((s, i) => (
          <button key={i} type="button" data-satir={i} onClick={() => cal(i)} className={cn("flex w-full gap-2.5 rounded-[12px] px-2.5 py-1.5 text-left transition-colors", i === calan ? "bg-white/[0.07]" : "hover:bg-white/[0.035]")}>
            <span className={cn("mt-0.5 shrink-0 text-[11.5px] font-semibold", s.k === "A" ? "text-[#8be6ff]" : "text-[#b5adf3]")}>{s.k === "A" ? "Ece" : "Can"}</span>
            <span className={cn("text-[13.5px] leading-relaxed", i === calan ? "text-white" : "text-white/65")}>{s.metin}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Görev ve geçmiş sohbet kartları ───────────── */
export function GorevKarti({ g, salt }: { g: GorevSonucu; salt?: boolean }) {
  const [calisti, setCalisti] = useState<"" | "gidiyor" | "tamam" | "hata">("");
  return (
    <div className="my-3 flex max-w-[560px] flex-wrap items-center gap-3 rounded-[18px] bg-white/[0.04] p-3.5 ring-1 ring-inset ring-[#55d6fd]/20">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><CalendarClock className="h-5 w-5" /></span>
      <span className="min-w-[180px] flex-1"><span className="block truncate text-[14.5px] font-semibold text-white">{g.ad}</span><span className="block text-[12.5px] text-white/55">{g.aciklama}{g.sonraki ? ` · sonraki ${new Date(g.sonraki).toLocaleString("tr-TR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}</span></span>
      {!salt && <>
      <button type="button" disabled={!!calisti && calisti !== "hata"} onClick={async () => { setCalisti("gidiyor"); try { await api(`/api/build/sohbet/gorev/${g.id}/calistir`, { govde: {} }); setCalisti("tamam"); } catch { setCalisti("hata"); } }}
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[12.5px] text-white hover:bg-white/[0.13] disabled:opacity-60">{calisti === "gidiyor" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : calisti === "tamam" ? <Check className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}{calisti === "tamam" ? "Başladı, sonuç sohbete düşecek" : calisti === "hata" ? "Başlatılamadı" : "Şimdi çalıştır"}</button>
      <Link href="/panel/build/sohbet/gorevler" className="inline-flex h-9 items-center gap-1 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black">Görevler<ArrowRight className="h-3.5 w-3.5" /></Link>
      </>}
    </div>
  );
}

export function SohbetlerKarti({ s }: { s: SohbetlerSonucu }) {
  return (
    <div className="my-2.5 max-w-[560px]">
      <p className="mb-1.5 flex items-center gap-2 text-[13px] text-white/55"><History className="h-3.5 w-3.5" />Geçmiş sohbetlerde arandı: &quot;{s.sorgu}&quot;{!s.sonuclar.length && " · sonuç yok"}</p>
      {s.sonuclar.length > 0 && (
        <div className="overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.08]">
          {s.sonuclar.slice(0, 4).map((x) => (
            <Link key={x.id} href={`/panel/build/sohbet/${x.id}${x.mesajId ? `?m=${x.mesajId}` : ""}`} className="flex items-start gap-2.5 border-b border-white/[0.05] px-3 py-2 last:border-0 hover:bg-white/[0.04]">
              <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8be6ff]" />
              <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium text-white">{x.baslik}</span><span className="line-clamp-1 text-[12px] text-white/50">{x.parca}</span></span>
              <span className="shrink-0 text-[11.5px] text-white/35">{gorece(x.zaman)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
