"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown, ChevronRight, Brain, Search, Globe, FileText, FilePlus2,
  SquareTerminal, Code2, Sparkles, Cpu, ListChecks, AlertTriangle, Check,
  Loader2, ExternalLink, Copy, type LucideIcon,
} from "lucide-react";
import { kopyala } from "@/lib/gercekEylem";
import type { AjanOlay, OlayTur } from "@/lib/scAjanOlay";
import { cn } from "@/lib/utils";

/* ============================================================
   AJAN AKIŞI — Claude'un araç kullanım ağacı.

   Her olay bir satır; satırlar sol dikey RAY ile bağlanır ve alt içerik
   raydan KAVİSLİ DİRSEKLE açılır. Alt adımlar (cocuklar) girintili olarak
   kendi raylarını kurar → ağaç görünümü.

   Satır anatomisi:
     [durum/araç ikonu] Etiket · soluk arg · (diff | süre) · ⌄
   Katlanabilir gövde türe göre değişir:
     · dusunme  → sans, soluk paragraf
     · arama    → sonuç listesi (favicon harfi + başlık + alan)
     · komut    → monospace terminal bloğu (kopyalanabilir)
     · kod/dosya→ monospace içerik
   ============================================================ */

const IKON: Record<OlayTur, LucideIcon> = {
  dusunme: Brain, arama: Search, gezinme: Globe, dosyaOku: FileText,
  dosyaYaz: FilePlus2, komut: SquareTerminal, kod: Code2, artifact: Sparkles,
  model: Cpu, gorev: ListChecks, hata: AlertTriangle,
};

/** Süreyi okunur biçime çevirir (Claude bitmiş adımlarda süre gösterir). */
function sure(ms?: number): string | null {
  if (ms == null || ms < 250) return null;
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function SonucSatiri({ s }: { s: { baslik: string; url: string; alan: string; ozet?: string } }) {
  return (
    <a href={s.url} target="_blank" rel="noopener noreferrer"
      className="group/s flex items-start gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--sc-cip)]">
      {/* Alan adının ilk harfi — gerçek favicon çekmeden marka hissi. */}
      <span className="mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded bg-[var(--sc-cip-2)] text-[10px] font-bold uppercase text-[var(--sc-metin-2)]">
        {s.alan.replace(/^www\./, "").charAt(0)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1">
          <span className="truncate text-[13.5px] text-[var(--sc-metin-2)] group-hover/s:text-[var(--sc-metin)]">
            {s.baslik}
          </span>
          <ExternalLink className="h-3 w-3 shrink-0 text-[var(--sc-metin-3)] opacity-0 transition-opacity group-hover/s:opacity-100" />
        </span>
        <span className="block truncate text-[12px] text-[var(--sc-metin-3)]">{s.alan}</span>
      </span>
    </a>
  );
}

function KomutBlogu({ icerik }: { icerik: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--sc-kenar)] bg-[#171717]">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-[12px] font-medium text-white/40">terminal</span>
        <button onClick={() => void kopyala(icerik, "Komut kopyalandı")} aria-label="Kopyala"
          className="text-white/45 transition-colors hover:text-white">
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
      <pre className="max-h-[280px] overflow-auto px-3 pb-3 font-mono text-[12.5px] leading-[1.6] text-[#c9d1d9] [scrollbar-width:thin]">
        {icerik}
      </pre>
    </div>
  );
}

/** Tek olay satırı (+ alt ağacı). */
function OlaySatiri({ o, derinlik = 0 }: { o: AjanOlay; derinlik?: number }) {
  // Düşünme adımları Claude'da varsayılan KAPALI gelir (özet görünür kalır).
  const [acik, setAcik] = useState(o.tur === "dusunme" ? false : false);
  const Ikon = IKON[o.tur];
  const acilabilir = Boolean(o.govde || o.sonuclar?.length || o.cocuklar?.length);
  const calisiyor = o.durum === "calisiyor";
  const hataMi = o.durum === "hata" || o.tur === "hata";
  const s = sure(o.sureMs);

  return (
    <div className="relative">
      {/* dikey ray — ikon merkezinden geçer */}
      <span className="absolute left-2 top-0 h-full w-px bg-[var(--sc-kenar)]" aria-hidden />

      <button
        onClick={() => acilabilir && setAcik((v) => !v)}
        disabled={!acilabilir}
        className={cn(
          "relative flex min-h-[30px] w-full items-center gap-3 rounded-md py-1 pr-2 text-left",
          acilabilir && "transition-colors hover:bg-[var(--sc-cip)]",
        )}>
        {/* İkon rayı keser. DİKKAT: arka plan `currentColor`-bağımsız sabit bir
            renk OLMAMALI — önce `bg-[var(--sc-zemin)]` veriliyordu ve satır
            farklı bir yüzeyde (kart/sidebar) render edildiğinde ikonun arkasında
            koyu bir blok görünüyordu. `bg-inherit` bulunduğu yüzeyi devralır. */}
        <span className={cn(
          "relative z-10 flex h-4 w-4 shrink-0 items-center justify-center bg-inherit",
          hataMi ? "text-[#f87171]" : calisiyor ? "text-[var(--sc-aksan)]" : "text-[var(--sc-metin-3)]",
        )}>
          {calisiyor
            ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.9} />
            : <Ikon className="h-4 w-4" strokeWidth={1.7} />}
        </span>

        <span className={cn(
          "truncate text-[14px]",
          hataMi ? "text-[#f87171]" : "text-[var(--sc-metin-3)]",
        )}>
          {o.etiket}
        </span>
        {o.arg && (
          <span className="truncate font-mono text-[12.5px] text-[var(--sc-metin-3)] opacity-80">{o.arg}</span>
        )}

        {o.diff && (
          <span className="flex shrink-0 items-center gap-2 text-[13px] tabular-nums">
            {o.diff.ekle != null && <span className="text-[#4ade80]">+{o.diff.ekle}</span>}
            {o.diff.sil != null && <span className="text-[#f87171]">−{o.diff.sil}</span>}
          </span>
        )}
        {o.durum === "bitti" && !o.diff && s && (
          <span className="shrink-0 text-[12px] tabular-nums text-[var(--sc-metin-3)] opacity-70">{s}</span>
        )}
        {o.durum === "bitti" && o.tur === "gorev" && (
          <Check className="h-3.5 w-3.5 shrink-0 text-[#4ade80]" strokeWidth={2.6} />
        )}

        {acilabilir && (
          acik
            ? <ChevronDown className="ml-auto h-[15px] w-[15px] shrink-0 text-[var(--sc-metin-3)]" />
            : <ChevronRight className="ml-auto h-[15px] w-[15px] shrink-0 text-[var(--sc-metin-3)]" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {acik && acilabilir && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden">
            {/* KAVİSLİ DİRSEK — ray aşağı iner, sağa kıvrılır */}
            <svg className="absolute left-2 top-0 h-[22px] w-[26px] overflow-visible" aria-hidden>
              <path d="M0.5 0 L0.5 12 Q0.5 20 8.5 20 L26 20" fill="none" stroke="var(--sc-kenar)" strokeWidth="1" />
            </svg>

            <div className="space-y-2 pb-2 pl-[42px] pt-2">
              {o.tur === "komut" && o.govde
                ? <KomutBlogu icerik={o.govde} />
                : o.govde && (
                    <p className="whitespace-pre-wrap text-[14.5px] leading-[1.55] text-[var(--sc-metin-3)]">
                      {o.govde}
                    </p>
                  )}

              {o.sonuclar && o.sonuclar.length > 0 && (
                <div className="space-y-0.5">
                  {o.sonuclar.map((r) => <SonucSatiri key={r.url} s={r} />)}
                </div>
              )}

              {/* Alt ağaç — kendi rayını kurar (derinlik artar) */}
              {o.cocuklar && o.cocuklar.length > 0 && (
                <div className="space-y-0.5">
                  {o.cocuklar.map((c) => <OlaySatiri key={c.id} o={c} derinlik={derinlik + 1} />)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SCAjanAkis({ olaylar }: { olaylar: AjanOlay[] }) {
  if (olaylar.length === 0) return null;
  return (
    /* bg-[var(--sc-zemin)]: alt satırlardaki ikonlar `bg-inherit` ile bu zemini
       devralıp rayı temiz keser (sabit renk verilince koyu blok oluşuyordu). */
    <div className="space-y-0.5 bg-[var(--sc-zemin)]">
      {olaylar.map((o) => <OlaySatiri key={o.id} o={o} />)}
    </div>
  );
}

/**
 * TAMAMLANMIŞ akış — mesajın üstünde katlanmış özet olarak durur.
 * Claude'da bitmiş araç çağrıları kaybolmaz; "N adımda çalıştı" satırına
 * dönüşür ve tıklanınca tüm ağaç yeniden açılır.
 */
export function SCGecmisAkis({ olaylar }: { olaylar: AjanOlay[] }) {
  const [acik, setAcik] = useState(false);
  if (!olaylar?.length) return null;

  // Toplam süre: ağacın tamamı (alt adımlar dahil) taranır.
  const toplamMs = (function topla(liste: AjanOlay[]): number {
    return liste.reduce((a, o) => a + (o.sureMs ?? 0) + (o.cocuklar ? topla(o.cocuklar) : 0), 0);
  })(olaylar);
  const sn = Math.max(1, Math.round(toplamMs / 1000));
  const araclar = new Set(olaylar.map((o) => o.tur));

  return (
    <div>
      <button
        onClick={() => setAcik((v) => !v)}
        className="flex items-center gap-2 rounded-md py-1 pr-2 text-[13.5px] text-[var(--sc-metin-3)] transition-colors hover:text-[var(--sc-metin-2)]">
        <Check className="h-3.5 w-3.5 shrink-0 text-[#4ade80]" strokeWidth={2.6} />
        <span>{olaylar.length} adımda çalıştı · {sn}s</span>
        {/* Kullanılan araç ikonları — hangi yetenekler devreye girdi. */}
        <span className="flex items-center gap-1">
          {[...araclar].slice(0, 5).map((t) => {
            const I = IKON[t];
            return <I key={t} className="h-3.5 w-3.5 text-[var(--sc-metin-3)]" strokeWidth={1.7} />;
          })}
        </span>
        {acik
          ? <ChevronDown className="h-4 w-4 shrink-0" />
          : <ChevronRight className="h-4 w-4 shrink-0" />}
      </button>

      <AnimatePresence initial={false}>
        {acik && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden">
            <div className="pt-2">
              <SCAjanAkis olaylar={olaylar} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
