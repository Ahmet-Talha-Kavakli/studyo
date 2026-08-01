"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown, ChevronRight, MessageSquare, Settings2, Wrench, Search, Globe,
  Compass, Eye, Sparkles, Loader2, Terminal, SquareTerminal, Code2, CloudUpload,
  AudioLines, Pencil, Copy, AlertTriangle, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   AJAN ÇALIŞMA ADIMLARI — referanslar/sohbetler birebir.

   Anatomi (referans ölçüleri):
     • sol dikey RAY: 1px var(--sc-kenar), adım ikonunun merkezinden geçer
     • adım satırı: [ikon 16px] Etiket(sans 14px var(--sc-metin-3)) [arg var(--sc-metin-3)] [⌄]
     • satır yüksekliği ~30px, ikon–etiket boşluğu 12px
     • alt içerik: raydan KAVİSLİ DİRSEK ile sağa açılır (girinti 34px)
     • "Thinking" metni SANS 15px var(--sc-metin-3) (asistan serifinden farklı!)
     • diff sayaçları: + yeşil #4ade80 · − kırmızı #f87171
   ============================================================ */

export type AdimIkon =
  | "dusun" | "gorev" | "arac" | "ara" | "oku" | "gez" | "goz" | "model"
  | "uretim" | "hazir" | "terminal" | "komut" | "kod" | "yukle" | "ses" | "duzenle";

const IKONLAR: Record<AdimIkon, typeof MessageSquare> = {
  dusun: MessageSquare, gorev: Settings2, arac: Wrench, ara: Search, oku: Globe,
  gez: Compass, goz: Eye, model: Search, uretim: Sparkles, hazir: Loader2,
  terminal: Terminal, komut: SquareTerminal, kod: Code2, yukle: CloudUpload,
  ses: AudioLines, duzenle: Pencil,
};

/** Adım satırı — açılabilirse çocukları kavisli dirsekle gösterir. */
export function SCAdimSatiri({
  ikon, etiket, arg, diff, uyari, donuyor, acilir, varsayilanAcik = false, children,
}: {
  ikon: AdimIkon;
  etiket: string;
  /** Etiketin sağındaki soluk ikincil metin (ör. dosya adı, model). */
  arg?: string;
  /** Kod adımlarında "+ 113 − 22" sayaçları. */
  diff?: { ekle?: number; sil?: number };
  uyari?: boolean;
  donuyor?: boolean;
  acilir?: boolean;
  varsayilanAcik?: boolean;
  children?: React.ReactNode;
}) {
  const [acik, setAcik] = useState(varsayilanAcik);
  const Ikon = IKONLAR[ikon];
  const acilabilir = acilir ?? Boolean(children);

  return (
    <div className="relative">
      {/* dikey ray — ikonun merkezinden geçer (x=8px) */}
      <span className="absolute left-2 top-0 h-full w-px bg-[var(--sc-kenar)]" aria-hidden />

      <button
        onClick={() => acilabilir && setAcik((v) => !v)}
        disabled={!acilabilir}
        className={cn(
          "relative flex h-[30px] w-full items-center gap-3 rounded-md pr-2 text-left",
          acilabilir && "transition-colors hover:bg-[var(--sc-cip)]",
        )}
      >
        {/* ikon — rayın üstünde, sayfa zeminiyle rayı keser */}
        <span className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center bg-inherit text-[var(--sc-metin-3)]">
          <Ikon className={cn("h-4 w-4", donuyor && "animate-spin")} strokeWidth={1.7} />
        </span>
        <span className="truncate text-[14px] text-[var(--sc-metin-3)]">{etiket}</span>
        {arg && <span className="truncate text-[14px] text-[var(--sc-metin-3)]">{arg}</span>}
        {uyari && <AlertTriangle className="h-[14px] w-[14px] shrink-0 text-[#eab308]" />}
        {diff && (
          <span className="flex shrink-0 items-center gap-2 text-[13.5px] tabular-nums">
            {diff.ekle != null && <span className="text-[#4ade80]">+ {diff.ekle}</span>}
            {diff.sil != null && <span className="text-[#f87171]">− {diff.sil}</span>}
          </span>
        )}
        {acilabilir && (
          acik
            ? <ChevronDown className="ml-auto h-[15px] w-[15px] shrink-0 text-[var(--sc-metin-3)]" />
            : <ChevronRight className="ml-auto h-[15px] w-[15px] shrink-0 text-[var(--sc-metin-3)]" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {acik && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden">
            {/* KAVİSLİ DİRSEK — ray aşağı iner, sağa kıvrılır (referans) */}
            <svg className="absolute left-2 top-0 h-[22px] w-[26px] overflow-visible" aria-hidden>
              <path d="M0.5 0 L0.5 12 Q0.5 20 8.5 20 L26 20" fill="none" stroke="var(--sc-kenar)" strokeWidth="1" />
            </svg>
            <div className="pb-2 pl-[46px] pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** "Düşünme" metni — SANS, soluk, uzunsa Daha fazla göster. */
export function SCDusunme({ metin }: { metin: string }) {
  const [acik, setAcik] = useState(false);
  const uzun = metin.length > 260;
  const govde = uzun && !acik ? metin.slice(0, 260) + "…" : metin;
  return (
    <div>
      <p className="whitespace-pre-wrap text-[15px] leading-[1.5] text-[var(--sc-metin-3)]">{govde}</p>
      {uzun && (
        <button onClick={() => setAcik((v) => !v)}
          className="mt-1.5 text-[14px] text-[var(--sc-metin-2)] transition-colors hover:text-[var(--sc-metin)]">
          {acik ? "Daha az göster" : "Daha fazla göster"}
        </button>
      )}
    </div>
  );
}

/** Terminal Girdi/Çıktı kartı — monospace, kopyalanabilir. */
export function SCTerminalKart({ baslik, icerik }: { baslik: "Girdi" | "Çıktı"; icerik: string }) {
  return (
    <div className="mb-2 overflow-hidden rounded-[12px] border border-[var(--sc-kenar)] bg-[var(--sc-kart)]">
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="text-[13px] text-[var(--sc-metin-3)]">{baslik}</span>
        <button onClick={() => navigator.clipboard?.writeText(icerik)}
          className="text-[var(--sc-metin-3)] transition-colors hover:text-[var(--sc-metin)]" aria-label="Kopyala">
          <Copy className="h-[14px] w-[14px]" />
        </button>
      </div>
      <pre className="max-h-[330px] overflow-auto px-4 pb-4 pt-2 font-mono text-[13px] leading-[1.6] text-[var(--sc-metin-2)] [scrollbar-width:thin]">
        {icerik}
      </pre>
    </div>
  );
}

/** Kod penceresi — macOS trafik ışıkları + satır no + diff şeridi. */
export function SCKodPenceresi({
  yol, satirlar,
}: {
  yol: string;
  /** durum: "e" eklendi (yeşil), "s" silindi (kırmızı), undefined normal */
  satirlar: { no: number; kod: string; durum?: "e" | "s" }[];
}) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[var(--sc-kenar)] bg-[var(--sc-kart)]">
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        <span className="flex gap-2">
          <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
          <span className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
          <span className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
        </span>
        <span className="ml-1 truncate font-mono text-[13px] text-[var(--sc-metin-3)]">{yol}</span>
      </div>
      <div className="max-h-[470px] overflow-auto bg-[var(--sc-kart)] py-2 [scrollbar-width:thin]">
        {satirlar.map((s) => (
          <div key={s.no} className="flex items-start">
            {/* sol diff şeridi */}
            <span className={cn("w-[3px] shrink-0 self-stretch",
              s.durum === "e" ? "bg-[#4ade80]" : s.durum === "s" ? "bg-[#f87171]" : "bg-transparent")} />
            <span className="w-[42px] shrink-0 pr-3 text-right font-mono text-[12px] leading-[1.65] text-[var(--sc-metin-3)]">
              {s.no}
            </span>
            <code className={cn(
              "flex-1 whitespace-pre pr-4 font-mono text-[13px] leading-[1.65]",
              s.durum === "e" ? "bg-[#3fb95015] text-[#c9d1d9]"
                : s.durum === "s" ? "bg-[#f8514915] text-[#c9d1d9]" : "text-[#c9d1d9]",
            )}>
              {s.kod}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

/** "N dosya düzenlendi" özet kartı — Geri al + lime Aç. */
export function SCDiffOzet({
  sayi, proje, ekle, sil, dosyalar, onAc, onGeriAl,
}: {
  sayi: number; proje: string; ekle: number; sil: number;
  dosyalar: { ad: string; ekle: number; sil: number }[];
  onAc: () => void; onGeriAl: () => void;
}) {
  return (
    <div className="rounded-[14px] border border-[var(--sc-kenar)] bg-[var(--sc-kart)] p-[18px]">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--sc-kenar)] bg-[var(--sc-cip)]">
          <Pencil className="h-[16px] w-[16px] text-[var(--sc-metin-3)]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-[var(--sc-metin)]">{sayi} dosya düzenlendi</span>
          <span className="mt-0.5 flex items-center gap-2 text-[13px] text-[var(--sc-metin-3)]">
            <span className="truncate">{proje}</span>
            <span className="shrink-0 text-[#4ade80]">+ {ekle}</span>
            <span className="shrink-0 text-[#f87171]">− {sil}</span>
          </span>
        </span>
        <button onClick={onGeriAl}
          className="shrink-0 rounded-md px-2 py-1.5 text-[14px] text-[var(--sc-metin-2)] transition-colors hover:bg-[var(--sc-cip)]">
          Geri al
        </button>
        <button onClick={onAc}
          className="shrink-0 rounded-full px-5 py-2 text-[14px] font-semibold transition-all hover:brightness-110"
          style={{ background: "var(--sc-aksan)", color: "var(--sc-aksan-metin)" }}>
          Aç
        </button>
      </div>

      <div className="mt-3.5">
        {dosyalar.map((d) => (
          <div key={d.ad} className="flex items-center gap-2.5 border-t border-[var(--sc-kenar)] py-2.5">
            <Code2 className="h-[15px] w-[15px] shrink-0 text-[var(--sc-metin-3)]" />
            <span className="shrink-0 text-[14px] font-bold text-[var(--sc-metin)]">Değişti</span>
            <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--sc-metin-3)]">{d.ad}</span>
            <span className="shrink-0 text-[13.5px] tabular-nums text-[#4ade80]">+ {d.ekle}</span>
            <span className="shrink-0 text-[13.5px] tabular-nums text-[#f87171]">− {d.sil}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Üretim parametre çipleri — Seedance 2.0 · 16:9 · 720p · Yüksek · 5sn */
export function SCUretimCipler({ cipler }: { cipler: { ad: string; ikon?: React.ReactNode }[] }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {cipler.map((c) => (
        <span key={c.ad}
          className="flex items-center gap-2 rounded-[10px] bg-[var(--sc-cip)] px-4 py-2.5 text-[13.5px] text-[var(--sc-metin-2)]">
          {c.ikon}
          {c.ad}
        </span>
      ))}
    </div>
  );
}

/** Metin-Konuşma bloğu — numaralı replikler + Model/Ses çipleri. */
export function SCSesBlogu({
  replikler,
}: { replikler: { metin: string; model: string; ses: string }[] }) {
  return (
    <div className="rounded-[14px] border border-[var(--sc-kenar)] bg-[var(--sc-kart)] p-4">
      {replikler.map((r, i) => (
        <div key={i} className={cn("py-3", i > 0 && "border-t border-[var(--sc-kenar)]")}>
          <div className="flex gap-3">
            <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[var(--sc-kenar)] text-[13px] text-[var(--sc-metin-2)]">
              {i + 1}
            </span>
            <p className="flex-1 text-[15px] leading-[1.5] text-[var(--sc-metin-2)]">{r.metin}</p>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2 pl-[38px]">
            {[["Model", r.model], ["Ses", r.ses]].map(([et, dg]) => (
              <span key={et} className="flex items-center gap-2 rounded-[10px] bg-[var(--sc-cip)] px-3.5 py-2 text-[13px]">
                <span className="text-[var(--sc-metin)]">{dg}</span>
                <span className="text-[var(--sc-metin-3)]">{et}</span>
                <ChevronDown className="h-3.5 w-3.5 text-[var(--sc-metin-3)]" />
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Kaynak çipi — 🌀 1 kaynak */
export function SCKaynakCipi({ sayi }: { sayi: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--sc-kenar)] bg-[var(--sc-kart)] px-3.5 py-[7px] text-[13px] text-[var(--sc-metin-3)]">
      <Check className="h-[13px] w-[13px]" /> {sayi} kaynak
    </span>
  );
}
