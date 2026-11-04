"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sohbet kilidi (ChatGPT "Lock chat" karşılığı): 4–6 haneli şifrenin SHA-256 özeti sohbette saklanır.
 * Kilitli sohbet kenar çubuğunda, aramada ve listelerde görünmez; açmak için şifre gerekir.
 * Bu sekmede açılan kilitler oturum boyunca açık kalır.
 */
export const acikKilitler = new Set<string>();

export async function sifreOzeti(pin: string) {
  const v = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`vayra-sc:${pin}`));
  return [...new Uint8Array(v)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function PinKutusu({ deger, setDeger, onEnter, autoFocus, hata }: { deger: string; setDeger: (v: string) => void; onEnter?: () => void; autoFocus?: boolean; hata?: boolean }) {
  return (
    <input value={deger} onChange={(e) => setDeger(e.target.value.replace(/\D/g, "").slice(0, 6))} onKeyDown={(e) => { if (e.key === "Enter") onEnter?.(); }}
      inputMode="numeric" type="password" autoComplete="off" autoFocus={autoFocus} aria-label="Şifre" placeholder="••••"
      className={cn("h-12 w-full rounded-[14px] [&::-ms-reveal]:hidden bg-[var(--sc-zemin)] text-center text-[22px] tracking-[0.5em] text-[var(--sc-metin)] outline-none ring-1 ring-inset placeholder:text-[var(--sc-metin-3)]", hata ? "ring-rose-400/70" : "ring-[var(--sc-kenar)] focus:ring-[var(--sc-aksan)]/60")} />
  );
}

/** Şifre belirleme penceresi. */
export function KilitPenceresi({ onKapat, onKilitle }: { onKapat: () => void; onKilitle: (ozet: string) => void }) {
  const [a, setA] = useState(""), [b, setB] = useState("");
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); }; window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t); }, [onKapat]);
  const uyusmuyor = b.length >= 4 && a !== b;
  const gecerli = a.length >= 4 && a === b;
  const kaydet = async () => { if (gecerli) onKilitle(await sifreOzeti(a)); };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="perde absolute inset-0 bg-black/60" onClick={onKapat} />
      <motion.div role="dialog" aria-modal="true" aria-label="Sohbeti kilitle" initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-[380px] rounded-[22px] bg-[#18181b] p-6 ring-1 ring-inset ring-white/[0.1]">
        <button onClick={onKapat} aria-label="Kapat" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.06]"><X className="h-4 w-4" /></button>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sc-aksan)]/12 text-[var(--sc-aksan)]"><Lock className="h-5 w-5" /></span>
        <h2 className="mt-3 text-center text-[17px] font-semibold">Sohbeti kilitle</h2>
        <p className="mt-1 text-center text-[13.5px] leading-relaxed text-[var(--sc-metin-2)]">Kilitli sohbet kenar çubuğunda ve aramada görünmez; açmak için şifre istenir. Şifreyi unutursan sohbet açılamaz.</p>
        <div className="mt-5 space-y-2.5">
          <PinKutusu deger={a} setDeger={setA} autoFocus />
          <PinKutusu deger={b} setDeger={setB} hata={uyusmuyor} onEnter={() => void kaydet()} />
          <p className={cn("text-center text-[12.5px]", uyusmuyor ? "text-rose-300" : "text-[var(--sc-metin-3)]")}>{uyusmuyor ? "Şifreler eşleşmiyor" : "4–6 haneli şifreyi iki kez gir"}</p>
        </div>
        <button disabled={!gecerli} onClick={() => void kaydet()} className="mt-4 h-11 w-full rounded-full bg-[var(--sc-metin)] text-[14px] font-semibold text-[#111113] transition-opacity disabled:opacity-40">Kilitle</button>
      </motion.div>
    </div>
  );
}

/** Kilitli sohbet ekranı: şifre girilince açılır. */
export function KilitEkrani({ baslik, ozet, onAc }: { baslik: string; ozet: string; onAc: () => void }) {
  const [pin, setPin] = useState("");
  const [hata, setHata] = useState(false);
  const deneme = useRef(0);
  const dene = async () => {
    if (pin.length < 4) return;
    if ((await sifreOzeti(pin)) === ozet) { onAc(); return; }
    deneme.current++; setHata(true); setPin("");
  };
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--sc-zemin)] px-4 text-center text-[var(--sc-metin)]">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06] text-[var(--sc-metin-2)]"><Lock className="h-6 w-6" /></span>
      <h1 className="mt-4 text-[20px] font-semibold">Bu sohbet kilitli</h1>
      <p className="mt-1 max-w-[320px] truncate text-[14px] text-[var(--sc-metin-3)]">{baslik}</p>
      <motion.div animate={hata ? { x: [0, -8, 8, -5, 5, 0] } : {}} transition={{ duration: 0.35 }} onAnimationComplete={() => setHata(false)} className="mt-6 w-full max-w-[260px]">
        <PinKutusu deger={pin} setDeger={setPin} onEnter={() => void dene()} autoFocus hata={hata} />
      </motion.div>
      <p className="mt-2 h-5 text-[12.5px] text-rose-300">{deneme.current > 0 && "Şifre yanlış"}</p>
      <button disabled={pin.length < 4} onClick={() => void dene()} className="mt-2 h-10 rounded-full bg-[var(--sc-metin)] px-6 text-[14px] font-semibold text-[#111113] disabled:opacity-40">Aç</button>
    </div>
  );
}
