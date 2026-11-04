"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Mic, MicOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SCLogoCanli } from "@/components/kabuk/sc/SCLogoCanli";
import { useScTercih } from "@/store/useScTercih";

/**
 * Sesli sohbet modu (ChatGPT / Claude sesli mod) — tarayıcının konuşma tanıma ve okuma özellikleriyle:
 * dinler → konuşma bitince mesajı gönderir → yanıt gelince sesli okur → yeniden dinler.
 * Konuşurken araya girersen (bas-konuş ya da mikrofon) okuma kesilir.
 */
type Durum = "dinliyor" | "dusunuyor" | "konusuyor" | "sessiz";
type Tanima = { lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void; abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null };

export const sesliModDestekli = () => typeof window !== "undefined" && !!((window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition) && "speechSynthesis" in window;

/** Markdown'ı okunacak düz metne çevirir (kod blokları atlanır). */
const okunur = (t: string) => t.replace(/```[\s\S]*?```/g, " Kod bloğunu ekranda görebilirsin. ").replace(/\[(\d+)\]\(#sc-k-\d+\)/g, "").replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[#*_`>|~-]+/g, " ").replace(/\s+/g, " ").trim();

export function SesliMod({ onKapat, onGonder, calisiyor, sonYanit }: {
  onKapat: () => void; onGonder: (metin: string) => void; calisiyor: boolean;
  /** Son asistan yanıtının kimliği ve metni (yeni yanıt bitince okunur). */
  sonYanit: { id: string; metin: string } | null;
}) {
  const [durum, setDurum] = useState<Durum>("dinliyor");
  const [ara, setAra] = useState("");
  const [sessiz, setSessiz] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const tanima = useRef<Tanima | null>(null);
  const bekleyenYanit = useRef<string | null>(null); // gönderdikten sonra okunacak yanıtın ÖNCEKİ kimliği
  const kapandi = useRef(false);

  const dinle = () => {
    if (kapandi.current || sessiz) return;
    const Sinif = (window as unknown as { SpeechRecognition?: new () => Tanima }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Tanima }).webkitSpeechRecognition;
    if (!Sinif) { setHata("Tarayıcın konuşma tanımayı desteklemiyor. Chrome ya da Edge'de dene."); return; }
    tanima.current?.abort();
    const r = new Sinif(); r.lang = "tr-TR"; r.continuous = false; r.interimResults = true;
    let son = "";
    r.onresult = (e) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; son = t; setAra(t); };
    r.onend = () => {
      tanima.current = null;
      if (kapandi.current) return;
      const t = son.trim();
      if (t) { bekleyenYanit.current = sonYanit?.id ?? ""; setDurum("dusunuyor"); onGonder(t); }
      else if (!sessiz) setTimeout(dinle, 250);
    };
    r.onerror = (e) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") setHata("Mikrofon izni verilmedi. Tarayıcı ayarlarından izin ver."); };
    try { r.start(); tanima.current = r; setDurum("dinliyor"); setAra(""); } catch { /* zaten çalışıyor */ }
  };

  /* Yanıt bitince oku, sonra yeniden dinle. */
  useEffect(() => {
    if (calisiyor || bekleyenYanit.current === null || !sonYanit || sonYanit.id === bekleyenYanit.current || !sonYanit.metin) return;
    bekleyenYanit.current = null;
    const u = new SpeechSynthesisUtterance(okunur(sonYanit.metin).slice(0, 3000));
    u.lang = "tr-TR"; u.rate = useScTercih.getState().sesHizi;
    const tr = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("tr")); if (tr) u.voice = tr;
    u.onend = () => { if (!kapandi.current) dinle(); };
    speechSynthesis.cancel(); speechSynthesis.speak(u); setDurum("konusuyor");
  }, [calisiyor, sonYanit]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    kapandi.current = false; dinle();
    const t = (e: KeyboardEvent) => { if (e.key === "Escape") kapat(); };
    window.addEventListener("keydown", t);
    return () => { window.removeEventListener("keydown", t); kapandi.current = true; tanima.current?.abort(); speechSynthesis.cancel(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const kapat = () => { kapandi.current = true; tanima.current?.abort(); speechSynthesis.cancel(); onKapat(); };
  const araGir = () => { speechSynthesis.cancel(); dinle(); };
  const mikrofon = () => {
    if (sessiz) { setSessiz(false); setTimeout(dinle, 0); return; }
    setSessiz(true); tanima.current?.abort(); setDurum("sessiz");
  };

  const yazi = hata ?? (durum === "dinliyor" ? (ara || "Dinliyorum…") : durum === "dusunuyor" ? "Düşünüyor…" : durum === "konusuyor" ? "Konuşuyor — sözünü kesmek için dokun" : "Mikrofon kapalı");
  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Sesli sohbet"
      className="sc-kapsam fixed inset-0 z-[300] flex flex-col items-center justify-between bg-[var(--sc-zemin)] px-6 pb-10 pt-16 text-[var(--sc-metin)]">
      <p className="text-[13px] text-[var(--sc-metin-3)]">Sesli sohbet · Esc ile çık</p>
      <button onClick={durum === "konusuyor" ? araGir : undefined} aria-label={durum === "konusuyor" ? "Sözünü kes" : undefined}
        className={cn("relative flex h-64 w-64 items-center justify-center rounded-full max-sm:h-52 max-sm:w-52", durum !== "konusuyor" && "cursor-default")}>
        <motion.span aria-hidden className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(85,214,253,0.28),rgba(85,214,253,0)_68%)]"
          animate={durum === "dinliyor" ? { scale: [1, 1.12, 1] } : durum === "konusuyor" ? { scale: [1, 1.25, 0.95, 1.18, 1] } : durum === "dusunuyor" ? { scale: [0.95, 1.02, 0.95], opacity: [0.6, 1, 0.6] } : { scale: 0.85, opacity: 0.4 }}
          transition={{ duration: durum === "konusuyor" ? 1.1 : 1.8, repeat: Infinity, ease: "easeInOut" }} />
        <SCLogoCanli boyut={150} calisiyor={durum !== "sessiz"} />
      </button>
      <p aria-live="polite" className={cn("min-h-[56px] max-w-[560px] text-center text-[18px] leading-relaxed", hata ? "text-amber-200" : durum === "dinliyor" && ara ? "text-[var(--sc-metin)]" : "text-[var(--sc-metin-2)]")}>{yazi}</p>
      <div className="flex items-center gap-4">
        <button onClick={mikrofon} aria-pressed={sessiz} aria-label={sessiz ? "Mikrofonu aç" : "Mikrofonu kapat"}
          className={cn("flex h-14 w-14 items-center justify-center rounded-full transition-colors", sessiz ? "bg-rose-500/20 text-rose-300" : "bg-white/[0.08] text-[var(--sc-metin)] hover:bg-white/[0.12]")}>
          {sessiz ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>
        <button onClick={kapat} aria-label="Sesli sohbeti bitir" className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white hover:bg-rose-400"><X className="h-6 w-6" /></button>
      </div>
    </motion.div>,
    document.body,
  );
}
