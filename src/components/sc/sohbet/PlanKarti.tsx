"use client";

import Link from "next/link";
import { KrediJeton } from "@/components/ui/KrediHap";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, ChevronDown, ExternalLink, FileText, Globe, ImageIcon, Loader2, Minus, Pause, Play, Plus, Square, Video, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Markdown } from "./Markdown";
import { adimKredi, planToplam, type PlanAdim, type ScPlan } from "@/lib/scPlan";

/**
 * Plan kartı: adımlar (aç/kapat, adet, oran), adım başı ve toplam kredi tahmini, bakiye kontrolü.
 * Onaylanmadan hiçbir şey çalışmaz; çalışırken canlı ilerleme, harcanan kredi, duraklat ve durdur.
 */
const IKON = { metin: FileText, gorsel: ImageIcon, site: Globe, video: Video } as const;
const ORANLAR = ["1:1", "4:5", "9:16", "16:9"];

export function PlanKarti({ plan, bakiye, onDegis, onOnay, onDuraklat, onDevam, onDurdur, onIptal, onKrediYukle }: {
  plan: ScPlan; bakiye: number; onDegis: (p: ScPlan) => void; onOnay: () => void; onDuraklat: () => void; onDevam: () => void; onDurdur: () => void; onIptal: () => void; onKrediYukle: () => void;
}) {
  const [acik, setAcik] = useState<string | null>(null);
  const taslak = plan.durum === "taslak";
  const toplam = planToplam(plan);
  const yetersiz = toplam - plan.harcanan > bakiye;
  const bitenSayi = plan.adimlar.filter((a) => a.durum === "bitti").length;
  const calisacak = plan.adimlar.filter((a) => a.secili && !a.disari).length;
  const adimDegis = (id: string, p: Partial<PlanAdim>) => onDegis({ ...plan, adimlar: plan.adimlar.map((a) => (a.id === id ? { ...a, ...p } : a)) });

  return (
    <div className="mb-3 overflow-hidden rounded-[18px] bg-[#18181b] ring-1 ring-inset ring-white/[0.08]">
      <div className="flex items-center gap-3 px-4 pb-3 pt-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-semibold text-[var(--sc-metin)]">{plan.baslik}</p>
          <p className="mt-0.5 text-[12.5px] text-[var(--sc-metin-3)]">
            {taslak ? `${calisacak} adım · onaylamadan hiçbir şey çalışmaz` : plan.durum === "bitti" ? `${bitenSayi} adım tamamlandı` : plan.durum === "iptal" ? "Durduruldu" : plan.durum === "duraklatildi" ? "Duraklatıldı" : `${bitenSayi}/${calisacak} adım`}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[12.5px] tabular-nums text-[var(--sc-metin)]" title={taslak ? "Tahmini toplam" : "Harcanan / tahmini"}>
          <KrediJeton boyut={14} />{taslak ? `yaklaşık ${toplam}` : `${plan.harcanan} / ${toplam}`} kredi
        </span>
      </div>
      {!taslak && calisacak > 0 && (
        <div className="mx-4 mb-2 h-1 overflow-hidden rounded-full bg-white/[0.07]">
          <motion.div animate={{ width: `${Math.round((bitenSayi / calisacak) * 100)}%` }} transition={{ duration: 0.4 }} className="h-full rounded-full bg-[var(--sc-aksan)]" />
        </div>
      )}

      <ol className="border-t border-white/[0.06]">
        {plan.adimlar.map((a, i) => {
          const I = IKON[a.tur];
          const kapali = !a.secili || !!a.disari;
          return (
            <li key={a.id} className={cn("border-b border-white/[0.05] last:border-b-0", kapali && taslak && "opacity-60")}>
              <div className="flex items-center gap-3 px-4 py-2.5">
                {taslak ? (
                  <button onClick={() => !a.disari && adimDegis(a.id, { secili: !a.secili })} disabled={!!a.disari} role="checkbox" aria-checked={a.secili} aria-label={`${a.baslik} adımını ${a.secili ? "çıkar" : "ekle"}`}
                    className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] ring-1 ring-inset transition-colors", a.secili && !a.disari ? "bg-[var(--sc-aksan)] text-[var(--sc-aksan-metin)] ring-[var(--sc-aksan)]" : "ring-white/25")}>
                    {a.secili && !a.disari && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </button>
                ) : (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {a.durum === "bitti" ? <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300"><Check className="h-3 w-3" strokeWidth={3} /></span>
                      : a.durum === "calisiyor" ? <Loader2 className="h-4 w-4 animate-spin text-[var(--sc-aksan)]" />
                        : a.durum === "hata" ? <AlertTriangle className="h-4 w-4 text-rose-300" />
                          : <span className="text-[12px] tabular-nums text-[var(--sc-metin-3)]">{i + 1}</span>}
                  </span>
                )}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.05] text-[var(--sc-metin-2)]"><I className="h-4 w-4" /></span>
                <button onClick={() => setAcik(acik === a.id ? null : a.id)} className="min-w-0 flex-1 text-left">
                  <span className={cn("block truncate text-[13.5px]", a.durum === "atlandi" ? "text-[var(--sc-metin-3)] line-through" : "text-[var(--sc-metin)]")}>{a.baslik}</span>
                  <span className="block truncate text-[12px] text-[var(--sc-metin-3)]">
                    {a.disari ? "Bu adım burada çalışmaz" : a.tur === "gorsel" ? `${a.adet ?? 1} adet · ${a.oran ?? "1:1"}` : a.tur === "site" ? "Çalışan HTML sayfa" : a.durum === "bitti" && a.demo && a.tur === "metin" ? "Örnek yanıt · model bağlı değil" : a.durum === "bitti" && a.sonuc ? a.sonuc.replace(/[#*_`>|]/g, "").slice(0, 80) : "Metin"}
                  </span>
                </button>
                {taslak && a.tur === "gorsel" && !a.disari && (
                  <div className="flex items-center rounded-full bg-white/[0.05] ring-1 ring-inset ring-white/[0.06]">
                    <button onClick={() => adimDegis(a.id, { adet: Math.max(1, (a.adet ?? 1) - 1), baslik: `${Math.max(1, (a.adet ?? 1) - 1)} görsel` })} aria-label="Azalt" className="flex h-7 w-7 items-center justify-center text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-4 text-center text-[12.5px] tabular-nums">{a.adet ?? 1}</span>
                    <button onClick={() => adimDegis(a.id, { adet: Math.min(8, (a.adet ?? 1) + 1), baslik: `${Math.min(8, (a.adet ?? 1) + 1)} görsel` })} aria-label="Artır" className="flex h-7 w-7 items-center justify-center text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                )}
                {a.disari ? (
                  <Link href={a.disari.href} className="flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] text-[var(--sc-aksan)] hover:bg-[var(--sc-aksan)]/10">{a.disari.ad}<ExternalLink className="h-3 w-3" /></Link>
                ) : (
                  <span className="w-[62px] shrink-0 text-right text-[12px] tabular-nums text-[var(--sc-metin-3)]">{adimKredi(a) ? `${adimKredi(a)} kredi` : "Dahil"}</span>
                )}
                <ChevronDown onClick={() => setAcik(acik === a.id ? null : a.id)} className={cn("h-4 w-4 shrink-0 cursor-pointer text-[var(--sc-metin-3)] transition-transform", acik === a.id && "rotate-180")} />
              </div>
              <AnimatePresence initial={false}>
                {acik === a.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                    <div className="space-y-2 px-4 pb-3 pl-[76px]">
                      {taslak ? (
                        <>
                          <input value={a.baslik} onChange={(e) => adimDegis(a.id, { baslik: e.target.value.slice(0, 60) })} aria-label="Adım adı" className="h-8 w-full rounded-[9px] bg-[var(--sc-zemin)] px-2.5 text-[13px] outline-none ring-1 ring-inset ring-[var(--sc-kenar)] focus:ring-[var(--sc-aksan)]/50" />
                          <textarea value={a.istem} onChange={(e) => adimDegis(a.id, { istem: e.target.value.slice(0, 3000) })} rows={3} aria-label="Adım talimatı" className="w-full resize-y rounded-[10px] bg-[var(--sc-zemin)] p-2.5 text-[12.5px] leading-relaxed text-[var(--sc-metin-2)] outline-none ring-1 ring-inset ring-[var(--sc-kenar)] focus:ring-[var(--sc-aksan)]/50" />
                          {a.tur === "gorsel" && (
                            <div className="flex gap-1">{ORANLAR.map((o) => <button key={o} onClick={() => adimDegis(a.id, { oran: o })} className={cn("h-7 rounded-full px-2.5 text-[12px] tabular-nums", (a.oran ?? "1:1") === o ? "bg-white/[0.1] text-[var(--sc-metin)]" : "text-[var(--sc-metin-3)] hover:text-[var(--sc-metin)]")}>{o}</button>)}</div>
                          )}
                        </>
                      ) : a.sonuc ? (
                        <div className="max-h-[360px] overflow-y-auto rounded-[12px] bg-white/[0.02] px-3 py-1 ring-1 ring-inset ring-white/[0.05] [scrollbar-width:thin]">
                          {a.demo && <span className="mt-2 inline-block rounded-full bg-amber-300/15 px-2 py-0.5 text-[11px] font-medium text-amber-200">Örnek yanıt</span>}
                          <Markdown metin={a.sonuc} />
                        </div>
                      ) : <p className="text-[12.5px] text-[var(--sc-metin-3)]">{a.hata ?? a.istem.split("\n")[0]}</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>

      {plan.bekleyenKredi && (
        <div className="flex items-center gap-2 border-t border-white/[0.06] bg-amber-300/[0.06] px-4 py-2.5 text-[12.5px] text-amber-100">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" /><span className="flex-1">Kredin bitti; plan bekliyor. Yükledikten sonra kaldığı yerden devam eder.</span>
          <button onClick={onKrediYukle} className="h-7 rounded-full bg-amber-300 px-3 font-semibold text-[#2a1d00]">Kredi yükle</button>
          <button onClick={onDevam} className="h-7 rounded-full px-2.5 font-medium text-amber-100 hover:bg-white/[0.06]">Devam et</button>
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-white/[0.06] px-4 py-3">
        {taslak ? (
          <>
            <span className={cn("flex-1 text-[12.5px]", yetersiz ? "text-amber-200" : "text-[var(--sc-metin-3)]")}>{yetersiz ? `Bakiye yetersiz: ${bakiye} kredi var` : `Bakiye: ${bakiye.toLocaleString("tr")} kredi`}</span>
            <button onClick={onIptal} className="h-9 rounded-full px-3.5 text-[13px] text-[var(--sc-metin-2)] hover:bg-white/[0.05]">Vazgeç</button>
            {yetersiz
              ? <button onClick={onKrediYukle} className="h-9 rounded-full bg-amber-300 px-4 text-[13px] font-semibold text-[#2a1d00]">Kredi yükle</button>
              : <button onClick={onOnay} disabled={!calisacak} className="flex h-9 items-center gap-1.5 rounded-full bg-[var(--sc-aksan)] px-4 text-[13px] font-semibold text-[var(--sc-aksan-metin)] disabled:opacity-40"><Play className="h-3.5 w-3.5 fill-current" />Onayla ve başlat</button>}
          </>
        ) : plan.durum === "calisiyor" ? (
          <>
            <span className="flex-1 text-[12.5px] text-[var(--sc-metin-3)]">Çalışırken yazmaya devam edebilirsin.</span>
            <button onClick={onDuraklat} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] hover:bg-white/[0.1]"><Pause className="h-3.5 w-3.5" />Duraklat</button>
            <button onClick={onDurdur} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-rose-300 hover:bg-rose-400/10"><Square className="h-3 w-3 fill-current" />Durdur</button>
          </>
        ) : plan.durum === "duraklatildi" ? (
          <>
            <span className="flex-1 text-[12.5px] text-[var(--sc-metin-3)]">Sıradaki adımdan devam eder.</span>
            <button onClick={onDurdur} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-rose-300 hover:bg-rose-400/10"><X className="h-3.5 w-3.5" />Bitir</button>
            <button onClick={onDevam} className="flex h-8 items-center gap-1.5 rounded-full bg-[var(--sc-aksan)] px-3.5 text-[12.5px] font-semibold text-[var(--sc-aksan-metin)]"><Play className="h-3.5 w-3.5 fill-current" />Devam et</button>
          </>
        ) : (
          <span className="flex-1 text-[12.5px] text-[var(--sc-metin-3)]">{plan.durum === "bitti" ? `Tamamlandı · ${plan.harcanan} kredi harcandı` : `Durduruldu · ${plan.harcanan} kredi harcandı`}</span>
        )}
      </div>
    </div>
  );
}
