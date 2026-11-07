"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, History, Loader2, MessageSquareText, Rocket } from "lucide-react";
import { gorece } from "@/lib/build/istemci";
import type { ProjeOzet, ProjeTur } from "@/lib/build/tipler";
import { ProjeKapagi } from "./Bolumler";

const TUR_AD: Record<ProjeTur, string> = { site: "Web sitesi", uygulama: "Web uygulaması", oyun: "Oyun", mobil: "Mobil uygulama" };

/** Yayın durumu cümlesi: yayınlanmamış sürüm sayısı ya da hiç yayınlanmamış. */
function yayinDurumu(p: ProjeOzet): { metin: string; bekliyor: boolean } {
  const n = p.yayinlanmamis ?? 0;
  if (!p.surumSayisi) return { metin: "Henüz sürüm yok", bekliyor: false };
  if (!p.yayin) return { metin: `Henüz yayınlanmadı · ${p.surumSayisi} sürüm`, bekliyor: true };
  return n > 0 ? { metin: `${n} yayınlanmamış değişiklik`, bekliyor: true } : { metin: "Yayındaki sürüm güncel", bekliyor: false };
}

/**
 * Ana sayfada "Kaldığın yerden devam": en son düzenlenen proje büyük kartta (kapak, son istek, yayınlanmamış değişiklik),
 * sonraki iki proje kısa satırlarda. Paralel görev kopyaları (taslak) gösterilmez.
 */
export function DevamKarti({ projeler }: { projeler: ProjeOzet[] }) {
  const l = projeler.filter((p) => !p.taslak?.gorev).slice(0, 3);
  if (!l.length) return null;
  const [ana, ...diger] = l;
  const d = yayinDurumu(ana);
  const izleyici = ana.ekipRol === "izleyici";
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} aria-label="Kaldığın yerden devam"
      className="overflow-hidden rounded-[24px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
      <div className="grid gap-0 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Link href={`/panel/build/${ana.id}`} className="group relative block aspect-[16/9] overflow-hidden bg-[#16171a] md:aspect-auto md:min-h-[230px]">
          <ProjeKapagi p={ana} />
          <span className="absolute left-3 top-3 flex items-center gap-1.5">
            {ana.calisiyor && <span className="flex h-6 items-center gap-1.5 rounded-full bg-black/60 px-2.5 text-[11.5px] font-medium text-white backdrop-blur"><Loader2 className="h-3 w-3 animate-spin text-[#55d6fd]" />Ajan çalışıyor</span>}
            {ana.yayin && <span className="flex h-6 items-center gap-1.5 rounded-full bg-black/60 px-2.5 text-[11.5px] font-medium text-white backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />Yayında</span>}
          </span>
        </Link>
        <div className="flex min-w-0 flex-col p-4 sm:p-5">
          <p className="text-[12.5px] font-medium text-[#8be6ff]">Kaldığın yerden devam</p>
          <p className="mt-1 truncate text-[20px] font-semibold tracking-[-0.02em] text-white">{ana.ad}</p>
          <p className="mt-0.5 text-[12.5px] text-white/45">{ana.ekipRol ? `${ana.sahipAd || "Sahibi"} paylaştı` : TUR_AD[ana.tur]} · {gorece(ana.guncelleme)}{ana.sonSurumNo ? ` · Sürüm ${ana.sonSurumNo}` : ""}</p>
          {ana.sonIstek ? (
            <div className="mt-3.5 rounded-[14px] bg-white/[0.04] px-3 py-2.5 ring-1 ring-inset ring-white/[0.06]">
              <p className="flex items-center gap-1.5 text-[11.5px] text-white/45"><MessageSquareText className="h-3.5 w-3.5" />Son isteğin · {gorece(ana.sonIstek.zaman)}</p>
              <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-white/85">{ana.sonIstek.metin}</p>
            </div>
          ) : <p className="mt-3.5 text-[13px] leading-relaxed text-white/50">Bu projede henüz ajana bir istek yazmadın; açıp ne istediğini yaz.</p>}
          <p className={`mt-3 flex items-center gap-1.5 text-[12.5px] ${d.bekliyor ? "text-amber-200/90" : "text-white/50"}`}>
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${d.bekliyor ? "bg-amber-300" : "bg-white/30"}`} />{d.metin}
          </p>
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            <Link href={`/panel/build/${ana.id}`} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition-opacity hover:opacity-90">Devam et<ArrowRight className="h-4 w-4" /></Link>
            {d.bekliyor && !izleyici && <Link href={`/panel/build/${ana.id}?yayinla=1`} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13.5px] font-medium text-white ring-1 ring-inset ring-white/[0.1] hover:bg-white/[0.13]"><Rocket className="h-4 w-4" />Yayınla</Link>}
          </div>
        </div>
      </div>
      {diger.length > 0 && (
        <div className="grid border-t border-white/[0.06] sm:grid-cols-2">
          {diger.map((p, i) => {
            const dd = yayinDurumu(p);
            return (
              <Link key={p.id} href={`/panel/build/${p.id}`} className={`group flex min-w-0 items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03] ${i === 1 ? "border-t border-white/[0.06] sm:border-l sm:border-t-0" : ""}`}>
                <ProjeKapagi p={p} kucuk />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-white">{p.ad}</span>
                  <span className="block truncate text-[12px] text-white/45">{p.sonIstek ? p.sonIstek.metin : gorece(p.guncelleme)}</span>
                </span>
                {dd.bekliyor && (p.yayinlanmamis ?? 0) > 0 && p.yayin ? <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-400/[0.12] px-2 py-0.5 text-[11px] font-medium tabular-nums text-amber-200"><History className="h-3 w-3" />{p.yayinlanmamis}</span> : null}
                <ArrowRight className="h-4 w-4 shrink-0 text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70" />
              </Link>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}
