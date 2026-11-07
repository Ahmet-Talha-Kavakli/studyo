"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Box, CalendarClock, Code2, FileSearch, FlaskConical, Globe, ImageIcon, Brain, KeyRound, LayoutGrid, Mic, Music, Search, Send, Terminal, Users, Video, Webhook, Wrench, X, MessageSquare, Mail, Phone, MessageSquareText, ArrowLeftRight, Star, CheckCircle2, MessagesSquare } from "lucide-react";
import type { AracIzni, CalismaDurum, Kanal } from "@/lib/build/ajanKatalog";
import { DURUM_AD, DURUM_TON } from "@/lib/build/ajanKatalog";
import type { IstemciAjan } from "@/lib/build/ajanDepo";
import { api } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";

/** Ajan araçlarının simgeleri (katalog kimliğine göre). */
export const ARAC_IKON: Record<string, typeof Globe> = {
  web_search: Search, web_fetch: Globe, code_execution: Terminal, gorsel_uret: ImageIcon, video_uret: Video, muzik_uret: Music,
  ses_uret: Mic, model_3d_uret: Box, proje_olustur: Code2, projelerim: LayoutGrid, bellege_yaz: Brain, bilgide_ara: FileSearch, insana_devret: Users,
};
export const aracIkonu = (id: string) => (id.startsWith("ekip_") ? Bot : ARAC_IKON[id] ?? Wrench);

/** Ajan simgesi: kare, yuvarlatılmış görsel. */
export function AjanSimge({ src, boyut = 40, className }: { src: string; boyut?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={boyut} height={boyut} style={{ width: boyut, height: boyut, borderRadius: Math.round(boyut * 0.3) }}
      className={cn("shrink-0 bg-white/[0.06] object-cover ring-1 ring-inset ring-white/10", className)} />
  );
}

export type AjanOzet = { id: string; ad: string; aciklama: string; simge: string; model: string; guncelleme: number; sablon?: string; yayinda: boolean; surum: number; araclar: string[]; sohbet: number; tetik: number };
export type Ajan = IstemciAjan;
export type AjanBilgi = Ajan["bilgi"][number];
export type AjanSurum = Ajan["surumler"][number];
export type { AracIzni };

/** Ajanla yeni sohbet açar; sohbet kimliğini döndürür. */
export const ajanlaSohbet = (ajanId: string) => api<{ id: string }>("/api/build/sohbet", { govde: { ajanId } }).then((v) => v.id);

/** Kanal simgeleri: şirket kanalları resmî logolarıyla, genel kanallar simgeyle. */
export const KANAL_LOGO: Partial<Record<Kanal, string>> = { telegram: "/marka/telegram.svg", whatsapp: "/marka/whatsapp.svg", slack: "/marka/baglanti/slack.svg", messenger: "/marka/renkli/messenger.svg", instagram: "/marka/renkli/instagram-color.svg", discord: "/marka/renkli/discord.svg", teams: "/marka/renkli/microsoft-teams.svg", line: "/marka/renkli/line.svg" };
const KANAL_IKON: Record<Kanal, typeof Globe> = { test: FlaskConical, sohbet: MessageSquare, sayfa: Globe, kutu: Code2, api: KeyRound, zamanlama: CalendarClock, webhook: Webhook, telegram: Send, whatsapp: Send, slack: Send, ekip: Users, eval: FlaskConical, eposta: Mail, messenger: Send, instagram: Send, telefon: Phone, sms: MessageSquareText, discord: Send, teams: Send, line: Send, site: MessagesSquare };
export function KanalSimge({ k, boyut = 32 }: { k: Kanal; boyut?: number }) {
  const I = KANAL_IKON[k];
  const logo = KANAL_LOGO[k] ?? null;
  return (
    <span className="flex shrink-0 items-center justify-center rounded-[10px] bg-white/[0.07] text-white/70" style={{ width: boyut, height: boyut }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {logo ? <img src={logo} alt="" className="h-[52%] w-[52%] object-contain" /> : <I className="h-[44%] w-[44%]" />}
    </span>
  );
}

export const TON_SINIF = {
  iyi: "bg-[#55d6fd]/[0.12] text-[#8be6ff]", bekliyor: "bg-amber-400/[0.12] text-amber-200", hata: "bg-rose-500/[0.12] text-rose-200", notr: "bg-white/[0.07] text-white/60",
} as const;
export function DurumHapi({ d, className }: { d: CalismaDurum; className?: string }) {
  return <span className={cn("inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-medium", TON_SINIF[DURUM_TON[d]], className)}>{DURUM_AD[d]}</span>;
}

/** Süre: 850 ms, 4,2 sn, 2 dk 5 sn. */
export function sureYaz(ms: number): string {
  if (ms < 1000) return `${Math.max(0, Math.round(ms))} ms`;
  if (ms < 60_000) return `${(ms / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} sn`;
  const d = Math.floor(ms / 60_000), s = Math.round((ms % 60_000) / 1000);
  return s ? `${d} dk ${s} sn` : `${d} dk`;
}
export const sayi = (n: number) => new Intl.NumberFormat("tr-TR").format(n);
export const saatYaz = (t: number) => new Date(t).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const yay = { type: "spring" as const, stiffness: 420, damping: 40 };
/**
 * Sağdan açılan panel (Veritabanı YanPanel deseni): sayfanın üstünde, gövdeye taşınır; Esc ve dış tıklama kapatır.
 * Telefonda tam genişlik.
 */
export function YanPanel({ acik, kapat, baslik, alt, children, alt2, genis, ust }: { acik: boolean; kapat: () => void; baslik: React.ReactNode; alt?: React.ReactNode; children: React.ReactNode; alt2?: React.ReactNode; genis?: boolean; ust?: React.ReactNode }) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  useEffect(() => { if (!acik) return; const t = (e: KeyboardEvent) => e.key === "Escape" && kapat(); addEventListener("keydown", t); return () => removeEventListener("keydown", t); }, [acik, kapat]);
  if (!hazir) return null;
  return createPortal(
    <AnimatePresence>
      {acik && (
        <div className="fixed inset-0 z-[125]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kapat} className="absolute inset-0 bg-black/45" />
          <motion.aside role="dialog" aria-modal="true" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={yay}
            className={cn("bd-panel absolute inset-y-0 right-0 flex w-full flex-col sm:rounded-l-[22px]", genis ? "sm:w-[640px]" : "sm:w-[500px]")}>
            <header className="flex items-start gap-3 border-b border-white/[0.07] px-5 py-4">
              {ust}
              <div className="min-w-0 flex-1"><div className="text-[15.5px] font-semibold text-white">{baslik}</div>{alt && <div className="mt-0.5 text-[12.5px] text-white/50">{alt}</div>}</div>
              <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:thin]">{children}</div>
            {alt2 && <footer className="flex flex-wrap items-center gap-2 border-t border-white/[0.07] px-5 py-3">{alt2}</footer>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Ayar kartı içindeki satır: solda başlık ve açıklama, sağda denetim. */
export function AyarSatiri({ baslik, alt, children, className }: { baslik: React.ReactNode; alt?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5", className)}>
      <span className="min-w-[min(100%,250px)] flex-1"><span className="block text-[13.5px] font-medium text-white">{baslik}</span>{alt && <span className="mt-0.5 block text-[12px] leading-relaxed text-white/45">{alt}</span>}</span>
      {children}
    </div>
  );
}

/** Konuşma içi olay ayracı (yönlendirme, devir, geri devir, çözüldü, anket): ortada hap, iki yanda ince çizgi. */
export function OlayAyrac({ tur, metin, acik }: { tur: string; metin: string; acik?: boolean }) {
  const I = tur === "yonlendirme" || tur === "geri" ? ArrowLeftRight : tur === "csat" ? Star : tur === "cozuldu" ? CheckCircle2 : Users;
  return (
    <div className={cn("flex items-center gap-3 text-[12px]", acik ? "text-black/50" : "text-white/50")} role="note">
      <span className={cn("h-px flex-1", acik ? "bg-black/[0.08]" : "bg-white/[0.08]")} />
      <span className={cn("inline-flex max-w-[82%] items-center gap-1.5 rounded-[14px] px-3 py-1 leading-snug", acik ? "bg-black/[0.04]" : "bg-white/[0.05]")}><I className="h-3.5 w-3.5 shrink-0" /><span className="line-clamp-2">{metin}</span></span>
      <span className={cn("h-px flex-1", acik ? "bg-black/[0.08]" : "bg-white/[0.08]")} />
    </div>
  );
}

/** Kart içi boş durum: simge, başlık, açıklama ve en çok iki eylem. */
export function BosDurum({ ikon: I, baslik, alt, children }: { ikon: typeof Globe; baslik: string; alt: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-9 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-[#55d6fd]/[0.1] text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/20"><I className="h-5 w-5" /></span>
      <p className="mt-3 text-[14.5px] font-semibold text-white">{baslik}</p>
      <p className="mt-1 max-w-[380px] text-[12.5px] leading-relaxed text-white/50">{alt}</p>
      {children && <div className="mt-4 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

export const birincil = "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition-opacity disabled:opacity-40";
export const ikincil = "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.13] disabled:opacity-40";
