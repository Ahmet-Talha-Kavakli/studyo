"use client";

/**
 * Kitaplık başlık kartı (sol raylı düzen): seçili görünümün kimliği (simge ya da projenin klasörü), adı ve tek satır
 * özeti (üretim, harcanan kredi, son üretim, süren işler); sağda görünüme göre eylem: proje için kapak yığını + Projeyi aç,
 * çöp için Çöpü boşalt. Telefonda ray gizli olduğundan Yükle ve Yeni proje burada.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, FolderPlus, Star, LayoutGrid, Loader2, Sparkles, Trash2, Upload, type LucideIcon } from "lucide-react";
import { MacKlasor } from "@/components/panel/proje/calisma/ortak";
import { KrediJeton } from "@/components/ui/KrediHap";
import type { Uretim } from "@/store/useProjeler";
import { kapakUrl } from "./yardimci";
import { cn } from "@/lib/utils";

const GUN = 86_400_000;
const goreli = (t: number) => {
  const f = Date.now() - t;
  if (f < 3600_000) return "az önce";
  if (f < GUN) return `${Math.floor(f / 3600_000)} saat önce`;
  if (f < 7 * GUN) return `${Math.floor(f / GUN)} gün önce`;
  return new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
};

export function KitaplikBaslik({ ad, ikon, proje, liste, aktifIs, copModu, yukleniyor, onYukle, onYeniProje, onCopBosalt }: {
  ad: string; ikon: "tumu" | "favori" | "son7" | "akilli" | "cop" | LucideIcon; proje?: { id: string; renk?: string; kapak?: string };
  liste: Uretim[]; aktifIs: number; copModu: boolean; yukleniyor: number;
  onYukle: () => void; onYeniProje: () => void; onCopBosalt: () => void;
}) {
  const kredi = liste.reduce((t, u) => t + (u.kredi ?? 0), 0);
  const son = liste.reduce<Uretim | undefined>((a, u) => (!a || u.olusturma > a.olusturma ? u : a), undefined);
  const kapaklar = liste.map(kapakUrl).filter(Boolean).slice(0, 4) as string[];
  const I: LucideIcon = typeof ikon === "string" ? ({ tumu: LayoutGrid, favori: Star, son7: Clock, akilli: Sparkles, cop: Trash2 } as const)[ikon] : ikon;

  return (
    <motion.header key={ad} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[22px] bg-[#111214] px-4 py-3.5 ring-1 ring-inset ring-white/[0.08] sm:px-5">
      {proje ? <MacKlasor renk={proje.renk} gorsel={proje.kapak ?? kapaklar[0]} className="h-11 w-14" />
        : <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] ring-1 ring-inset", copModu ? "bg-rose-400/10 text-rose-300 ring-rose-300/20" : "bg-white/[0.07] text-white ring-white/[0.1]")}><I className={cn("h-5 w-5", ikon === "favori" && "fill-rose-400 text-rose-400")} /></span>}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[21px] font-semibold tracking-[-0.025em] text-white">{ad}</h1>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-white/55">
          {copModu ? <span>{liste.length} üretim · 30 gün sonra kalıcı olarak silinir</span> : (
            <>
              <span className="tabular-nums">{liste.length} üretim</span>
              {kredi > 0 && <><span className="text-white/25">·</span><span className="flex items-center gap-1 tabular-nums"><KrediJeton boyut={11} />{kredi} kredi</span></>}
              {son && <><span className="text-white/25">·</span><span>Son üretim {goreli(son.olusturma)}</span></>}
              {aktifIs > 0 && <span className="ml-1 flex items-center gap-1.5 rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] font-medium text-white/85"><Loader2 className="h-3 w-3 animate-spin" />{aktifIs} sürüyor</span>}
            </>
          )}
        </p>
      </div>

      {!copModu && kapaklar.length > 0 && (
        <div className="flex items-center gap-3 max-sm:hidden">
          <span className="flex -space-x-3">
            {kapaklar.slice(0, 3).map((k, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={k + i} src={k} alt="" className="h-10 w-10 rounded-[11px] object-cover ring-[3px] ring-[#111214]" style={{ transform: `rotate(${(i - 1) * 5}deg)` }} />
            ))}
          </span>
          {proje && <Link href={`/panel/projeler/${proje.id}`} className="flex h-10 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[13px] font-medium text-white ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.12]">Projeyi aç<ArrowRight className="h-3.5 w-3.5" /></Link>}
        </div>
      )}
      {copModu && liste.length > 0 && (
        <motion.button whileTap={{ scale: 0.96 }} onClick={onCopBosalt} className="flex h-10 items-center gap-1.5 rounded-full bg-rose-400/10 px-4 text-[13px] font-semibold text-rose-200 ring-1 ring-inset ring-rose-300/20 transition hover:bg-rose-400/15"><Trash2 className="h-4 w-4" />Çöpü boşalt</motion.button>
      )}
      <div className="flex w-full gap-2 lg:hidden">
        <motion.button whileTap={{ scale: 0.96 }} onClick={onYukle} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-[13.5px] font-semibold text-black">
          {yukleniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{yukleniyor ? `${yukleniyor} yükleniyor` : "Yükle"}
        </motion.button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={onYeniProje} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-white/[0.07] text-[13.5px] font-medium text-white ring-1 ring-inset ring-white/[0.08]"><FolderPlus className="h-4 w-4" />Yeni proje</motion.button>
      </div>
    </motion.header>
  );
}
