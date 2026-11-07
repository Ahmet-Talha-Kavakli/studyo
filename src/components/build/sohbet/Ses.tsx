"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Hand, Mic, MicOff, Settings2, Square, X } from "lucide-react";
import { SesAvatar } from "@/components/studyo/ses/ortak";
import { cn } from "@/lib/utils";
import { Acilir, useAcilir } from "./ortak";

/**
 * Tarayıcı sesleri: sesli okuma, sesli özet ve konuşma kipi aynı ayarı kullanır (ses ve hız, localStorage).
 * Konuşma kipi (ChatGPT ve Claude ses kipi gibi): eller serbest (susunca gönderir) ya da bas-konuş; yanıt cümle cümle
 * okunur; küreye dokununca ya da boşluk tuşuyla söz kesilir. Tarayıcı konuşma tanımayı desteklemiyorsa açıkça söylenir.
 */
export type SesAyari = { ses: string; hiz: number };
const ANAHTAR = "vayra-sohbet-ses";
export function sesAyariOku(): SesAyari { try { return { ses: "", hiz: 1, ...JSON.parse(localStorage.getItem(ANAHTAR) ?? "{}") }; } catch { return { ses: "", hiz: 1 }; } }
export function sesAyariYaz(a: SesAyari) { try { localStorage.setItem(ANAHTAR, JSON.stringify(a)); } catch { /* yok */ } }

export function useSesler() {
  const [l, setL] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;
    const al = () => setL(speechSynthesis.getVoices());
    al();
    speechSynthesis.addEventListener("voiceschanged", al);
    return () => speechSynthesis.removeEventListener("voiceschanged", al);
  }, []);
  return l;
}
export const turkceSesler = (l: SpeechSynthesisVoice[]) => l.filter((v) => v.lang.toLowerCase().startsWith("tr"));

/** Okunacak düz metin (Markdown işaretleri, kod ve bağlantılar ayıklanır). */
export const okunurMetin = (m: string) => m.replace(/<bellek-kaynak>[\s\S]*?<\/bellek-kaynak>/g, "").replace(/```[\s\S]*?```/g, " Kod bloğu. ").replace(/\$\$[\s\S]*?\$\$/g, " ").replace(/\[(\d+)\]\(#kaynak-\d+\)/g, "").replace(/!\[[^\]]*\]\([^)]+\)/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[#*_`>|~]/g, "").replace(/\s+/g, " ").trim();

/** Bir cümleyi seçili sesle söyler; bitince çözülür. */
export function soyle(metin: string, a: SesAyari, ek: { perde?: number; ses?: SpeechSynthesisVoice | null } = {}): Promise<void> {
  return new Promise((coz) => {
    if (typeof speechSynthesis === "undefined" || !metin.trim()) { coz(); return; }
    const u = new SpeechSynthesisUtterance(metin);
    const sesler = speechSynthesis.getVoices();
    const v = ek.ses ?? sesler.find((x) => x.name === a.ses) ?? turkceSesler(sesler)[0] ?? null;
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "tr-TR";
    u.rate = a.hiz; if (ek.perde) u.pitch = ek.perde;
    u.onend = () => coz(); u.onerror = () => coz();
    speechSynthesis.speak(u);
  });
}

/** Ses ve hız seçici (açılır menü). */
export function SesAyarDugmesi({ a, set, kucuk }: { a: SesAyari; set: (a: SesAyari) => void; kucuk?: boolean }) {
  const m = useAcilir(300, "yukari");
  const sesler = useSesler();
  const tr = turkceSesler(sesler), diger = sesler.filter((v) => !tr.includes(v)).slice(0, 12);
  return (
    <div ref={m.kok}>
      <button type="button" onClick={() => m.setAcik(!m.acik)} title="Ses ve hız" aria-label="Ses ve hız" className={cn("flex items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white", kucuk ? "h-7 w-7" : "h-9 w-9")}><Settings2 className="h-4 w-4" /></button>
      <Acilir a={m}>
        <p className="px-2.5 pb-1 pt-1.5 text-[12px] font-medium text-white/55">Hız</p>
        <div className="flex gap-1 px-2 pb-2">{[0.8, 1, 1.2, 1.5].map((h) => <button key={h} type="button" onClick={() => set({ ...a, hiz: h })} className={cn("h-8 flex-1 rounded-full text-[12.5px]", a.hiz === h ? "bg-white text-black" : "bg-white/[0.06] text-white/75 hover:text-white")}>{String(h).replace(".", ",")}x</button>)}</div>
        <p className="px-2.5 pb-1 pt-1 text-[12px] font-medium text-white/55">Ses</p>
        {!sesler.length && <p className="px-2.5 pb-2 text-[12.5px] text-white/50">Bu tarayıcıda okuma sesi bulunamadı.</p>}
        {!tr.length && sesler.length > 0 && <p className="px-2.5 pb-2 text-[12px] text-amber-200/80">Türkçe ses yüklü değil; Türkçe metin yabancı aksanla okunur.</p>}
        {[...tr, ...diger].map((v) => (
          <button key={v.name} type="button" onClick={() => set({ ...a, ses: v.name })} className={cn("flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-1.5 text-left hover:bg-white/[0.06]", (a.ses === v.name || (!a.ses && v === tr[0])) && "bg-white/[0.08] ring-1 ring-inset ring-white/70")}>
            <SesAvatar ad={v.name} renk={v.lang.startsWith("tr") ? "#55d6fd" : "#9085e9"} boyut={26} />
            <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{v.name.replace(/Microsoft |Google |Online \(Natural\)/g, "").trim()}</span><span className="block text-[11.5px] text-white/45">{v.lang}</span></span>
          </button>
        ))}
      </Acilir>
    </div>
  );
}

type Tanima = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; abort: () => void; onresult: ((e: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null; onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null };
const tanimaSinifi = () => (typeof window === "undefined" ? undefined : ((window as unknown as { SpeechRecognition?: new () => Tanima }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Tanima }).webkitSpeechRecognition));
export const sesKipiDestekli = () => !!tanimaSinifi();

type Durum = "dinliyor" | "dusunuyor" | "konusuyor" | "beklemede";

/**
 * Konuşma kipi çubuğu: komut kutusunun yerine geçer. gonder(metin) mesajı yollar; yanit: canlı yanıtın o ana kadarki
 * metni ve bitip bitmediği (cümleler geldikçe okunur).
 */
export function SesKipi({ kapat, gonder, yanit, calisiyor, durdur }: { kapat: () => void; gonder: (metin: string) => void; yanit: { id: string; metin: string; bitti: boolean } | null; calisiyor: boolean; durdur: () => void }) {
  const [durum, setDurum] = useState<Durum>("beklemede");
  const [yazi, setYazi] = useState("");
  const [basKonus, setBasKonus] = useState(false);
  const [ayar, setAyarS] = useState<SesAyari>({ ses: "", hiz: 1 });
  const [hata, setHata] = useState("");
  const tanima = useRef<Tanima | null>(null);
  const sessizlik = useRef<ReturnType<typeof setTimeout> | null>(null);
  const okunan = useRef<{ id: string; i: number }>({ id: "", i: 0 });
  const kuyruk = useRef<Promise<void>>(Promise.resolve());
  const bekleyenYanit = useRef(false);
  const kapandi = useRef(false);
  const destek = sesKipiDestekli();
  useEffect(() => setAyarS(sesAyariOku()), []);
  const setAyar = (a: SesAyari) => { setAyarS(a); sesAyariYaz(a); };

  const dinlemeyiBitir = useCallback(() => { if (sessizlik.current) clearTimeout(sessizlik.current); try { tanima.current?.abort(); } catch { /* yok */ } tanima.current = null; }, []);
  const dinle = useCallback(() => {
    const S = tanimaSinifi();
    if (!S || kapandi.current) return;
    dinlemeyiBitir();
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    const r = new S();
    r.lang = "tr-TR"; r.interimResults = true; r.continuous = true;
    let son = "";
    r.onresult = (e) => {
      let s = "";
      for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript;
      son = s.trim(); setYazi(son);
      if (sessizlik.current) clearTimeout(sessizlik.current);
      // Eller serbest: 1,3 saniye sessizlikten sonra gönder.
      if (!basKonusRef.current && son) sessizlik.current = setTimeout(() => { dinlemeyiBitir(); bekleyenYanit.current = true; setDurum("dusunuyor"); gonder(son); setYazi(""); }, 1300);
    };
    r.onerror = (e) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") { setHata("Mikrofon izni verilmedi. Adres çubuğundan mikrofona izin ver."); setDurum("beklemede"); } };
    r.onend = () => { if (tanima.current === r) { tanima.current = null; if (basKonusRef.current && son) { bekleyenYanit.current = true; setDurum("dusunuyor"); gonder(son); setYazi(""); } else if (!bekleyenYanit.current && !kapandi.current && !basKonusRef.current) setDurum("beklemede"); } };
    tanima.current = r;
    try { r.start(); setDurum("dinliyor"); setHata(""); } catch { setHata("Mikrofon başlatılamadı."); }
  }, [dinlemeyiBitir, gonder]);
  const basKonusRef = useRef(false);
  basKonusRef.current = basKonus;

  // Açılınca dinlemeye başla; kapanınca her şeyi durdur.
  useEffect(() => { kapandi.current = false; if (destek && !basKonus) dinle(); return () => { kapandi.current = true; dinlemeyiBitir(); if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel(); }; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Yanıt geldikçe tamamlanan cümleleri sıraya koy; bitince dinlemeye dön.
  useEffect(() => {
    if (!yanit || !bekleyenYanit.current) return;
    if (okunan.current.id !== yanit.id) okunan.current = { id: yanit.id, i: 0 };
    const metin = okunurMetin(yanit.metin);
    const kalan = metin.slice(okunan.current.i);
    const m = yanit.bitti ? kalan.length : (() => { const r = /[.!?…:](\s|$)/g; let son = -1, x; while ((x = r.exec(kalan))) son = x.index + 1; return son; })();
    if (m > 0) {
      const parca = kalan.slice(0, m).trim();
      okunan.current.i += m;
      if (parca) { setDurum("konusuyor"); kuyruk.current = kuyruk.current.then(() => (kapandi.current ? undefined : soyle(parca, ayar))); }
    }
    if (yanit.bitti) {
      bekleyenYanit.current = false;
      kuyruk.current = kuyruk.current.then(() => { if (!kapandi.current) { setDurum("beklemede"); if (!basKonusRef.current) dinle(); } });
    }
  }, [yanit, ayar, dinle]);

  const sozuKes = () => {
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    kuyruk.current = Promise.resolve();
    if (calisiyor) durdur();
    bekleyenYanit.current = false;
    if (!basKonus) dinle(); else setDurum("beklemede");
  };
  useEffect(() => {
    const t = (e: KeyboardEvent) => {
      if (e.code !== "Space" || (e.target as HTMLElement)?.closest("input,textarea")) return;
      e.preventDefault();
      if (basKonus) { if (e.type === "keydown" && !e.repeat && durum !== "dinliyor") dinle(); if (e.type === "keyup" && tanima.current) tanima.current.stop(); }
      else if (e.type === "keydown" && durum === "konusuyor") sozuKes();
    };
    addEventListener("keydown", t); addEventListener("keyup", t);
    return () => { removeEventListener("keydown", t); removeEventListener("keyup", t); };
  });

  const etiket = !destek ? "Bu tarayıcı konuşma tanımayı desteklemiyor" : durum === "dinliyor" ? (basKonus ? "Dinliyorum, bırakınca gönderilir" : "Dinliyorum") : durum === "dusunuyor" ? "Düşünüyor" : durum === "konusuyor" ? "Konuşuyor, sözünü kesmek için dokun" : basKonus ? "Konuşmak için basılı tut" : "Başlamak için dokun";
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="cam-istemci rounded-[26px] p-3">
      {!destek ? (
        <div className="flex items-center gap-3 px-1">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400/[0.12] text-amber-200"><AlertTriangle className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block text-[14px] font-medium text-white">Konuşma kipi bu tarayıcıda çalışmıyor</span><span className="block text-[12.5px] text-white/55">Tarayıcın konuşma tanımayı desteklemiyor. Chrome, Edge ya da Safari ile dene; yanıtları yine Sesli oku ile dinleyebilirsin.</span></span>
          <button type="button" onClick={kapat} className="h-9 shrink-0 rounded-full bg-white px-4 text-[13px] font-semibold text-black">Kapat</button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button type="button" aria-label={etiket}
            onClick={() => { if (basKonus) return; if (durum === "konusuyor" || durum === "dusunuyor") sozuKes(); else if (durum === "beklemede") dinle(); else { dinlemeyiBitir(); setDurum("beklemede"); } }}
            onPointerDown={() => { if (basKonus && durum !== "dinliyor") dinle(); }} onPointerUp={() => { if (basKonus) tanima.current?.stop(); }}
            className="relative shrink-0 rounded-full outline-none transition-transform active:scale-95">
            <AnimatePresence>{(durum === "dinliyor" || durum === "konusuyor") && <motion.span key="h" initial={{ scale: 1, opacity: 0.5 }} animate={{ scale: 1.35, opacity: 0 }} transition={{ duration: 1.4, repeat: Infinity }} className="absolute inset-0 rounded-full bg-[#55d6fd]/40" />}</AnimatePresence>
            <SesAvatar ad="Vayra" renk={durum === "dinliyor" ? "#55d6fd" : durum === "konusuyor" ? "#9085e9" : "#5b8fa3"} boyut={52} aktif={durum !== "beklemede"} />
          </button>
          <div className="min-w-0 flex-1">
            <p className={cn("text-[14px] font-medium", durum === "dusunuyor" ? "build-parilti text-white/70" : "text-white")}>{etiket}</p>
            <p className="truncate text-[13px] text-white/55">{hata || yazi || (durum === "konusuyor" ? "Yanıt okunuyor" : basKonus ? "Boşluk tuşunu da basılı tutabilirsin" : "Konuşmayı bitirince kısa bir sessizlikten sonra gönderilir")}</p>
          </div>
          <button type="button" onClick={() => { const y = !basKonus; setBasKonus(y); dinlemeyiBitir(); setDurum("beklemede"); if (!y) setTimeout(dinle, 50); }} title={basKonus ? "Eller serbest kipine geç" : "Bas-konuş kipine geç"} aria-pressed={basKonus}
            className={cn("hidden h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] transition-colors sm:flex", basKonus ? "bg-[#55d6fd]/[0.14] text-[#8be6ff]" : "bg-white/[0.06] text-white/70 hover:text-white")}><Hand className="h-3.5 w-3.5" />Bas-konuş</button>
          <SesAyarDugmesi a={ayar} set={setAyar} />
          {durum === "dinliyor" ? <button type="button" onClick={() => { dinlemeyiBitir(); setDurum("beklemede"); }} title="Mikrofonu kapat" aria-label="Mikrofonu kapat" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white"><MicOff className="h-4 w-4" /></button>
            : durum === "konusuyor" ? <button type="button" onClick={sozuKes} title="Sözünü kes" aria-label="Sözünü kes" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white"><Square className="h-3.5 w-3.5 fill-current" /></button>
            : <button type="button" onClick={dinle} title="Dinlemeye başla" aria-label="Dinlemeye başla" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white"><Mic className="h-4 w-4" /></button>}
          <button type="button" onClick={kapat} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><X className="h-3.5 w-3.5" />Bitir</button>
        </div>
      )}
    </motion.div>
  );
}
