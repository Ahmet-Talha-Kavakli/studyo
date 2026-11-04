"use client";

/* Sinema stüdyosunun kenar çubuğu: stüdyo seçici, gezinme (ana sayfa, elementler, favoriler,
   sahne şeridi), projeler (kapak, son güncelleme; ara, sırala, yeni) ve öğrenme kartı. Daraltılabilir. */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownUp, ArrowUpRight, Pin, AtSign, ChevronsUpDown, Clapperboard, Film, Heart, Home, Images, Layers, PanelLeftClose, PanelLeftOpen, Plus, Search, Video, X, Scissors,
} from "lucide-react";
import { cn, saltUrl } from "@/lib/utils";
import { useProjeler } from "@/store/useProjeler";
import { Yuzen } from "@/components/ui/Yuzen";
import { Tooltip } from "@/components/ui/Tooltip";
import { KenarTutamac, useKenarGenisligi } from "@/components/ui/KenarTutamac";
import { MacKlasor } from "@/components/panel/proje/calisma/ortak";
import type { SinemaProje } from "@/store/useSinema";

export type KenarSayfa = "ana" | "element" | "favori" | "sahne";

const once = (t: number) => {
  const dk = Math.floor((Date.now() - t) / 60000);
  return dk < 1 ? "az önce" : dk < 60 ? `${dk} dk önce` : dk < 1440 ? `${Math.floor(dk / 60)} sa önce` : dk < 10080 ? `${Math.floor(dk / 1440)} gün önce` : new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
};

const STUDYOLAR = [
  { ad: "Sinema Stüdyosu", alt: "Kamera, lens, ışık · film çek", href: "/panel/sinema", ikon: Clapperboard },
  { ad: "Video Stüdyosu", alt: "Metinden ve kareden video", href: "/panel/video", ikon: Video },
  { ad: "Görsel Stüdyosu", alt: "Görsel üret ve düzenle", href: "/panel/gorsel", ikon: Images },
  { ad: "Uzun Video", alt: "Hikâyeden bölüm bölüm film", href: "/panel/uzun-video", ikon: Film },
  { ad: "Montaj", alt: "Çekimleri kurgula", href: "/panel/montaj", ikon: Scissors },
];

export function Kenar({ sayfa, onSayfa, sayilar, projeler, onYeniProje, dar, onDar }: {
  sayfa: KenarSayfa; onSayfa: (s: KenarSayfa) => void;
  sayilar: Partial<Record<KenarSayfa, number>>;
  projeler: SinemaProje[]; onYeniProje: () => void;
  dar: boolean; onDar: (v: boolean) => void;
}) {
  const [studyoAcik, setStudyoAcik] = useState(false);
  const [ara, setAra] = useState<string | null>(null);
  const [sirala, setSirala] = useState<"yeni" | "ad">("yeni");
  const [ogren, setOgren] = useState(true);
  useEffect(() => { try { setOgren(localStorage.getItem("vayra-sinema-ogren") !== "0"); } catch { /* yok */ } }, []);
  const uretimler = useProjeler((s) => s.uretimler);
  const en = useKenarGenisligi("sinema-kenar", 256, 220, 420);
  /** Proje kapağı: projenin en yeni görselli üretimi. */
  const kapaklar = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of uretimler) { const g = saltUrl(u.gorselUrl); if (u.projeId && g && !m.has(u.projeId)) m.set(u.projeId, g); }
    return m;
  }, [uretimler]);
  const liste = useMemo(() => {
    const q = (ara ?? "").trim().toLocaleLowerCase("tr");
    const l = projeler.filter((p) => !q || p.ad.toLocaleLowerCase("tr").includes(q));
    return sirala === "ad" ? [...l].sort((a, b) => a.ad.localeCompare(b.ad, "tr")) : [...l].sort((a, b) => Number(!!b.sabit) - Number(!!a.sabit) || b.guncelleme - a.guncelleme);
  }, [projeler, ara, sirala]);

  const OGELER: { id: KenarSayfa; ad: string; ikon: typeof Home }[] = [
    { id: "ana", ad: "Ana sayfa", ikon: Home },
    { id: "element", ad: "Elementlerim", ikon: AtSign },
    { id: "favori", ad: "Favorilerim", ikon: Heart },
    { id: "sahne", ad: "Sahne şeridi", ikon: Layers },
  ];

  return (
    <motion.aside style={{ width: dar ? 68 : en }} className="relative flex h-full shrink-0 flex-col bg-[#0b0b0c]">
      {!dar && <KenarTutamac en={en} anahtar="sinema-kenar" varsayilan={256} min={220} max={420} taraf="sol" etiket="Kenar çubuğunun genişliği" />}
      {/* Stüdyo seçici */}
      <div className={cn("flex items-center gap-1 p-2.5", dar && "flex-col")}>
        <div className="relative min-w-0 flex-1">
          <button onClick={() => setStudyoAcik((v) => !v)} aria-expanded={studyoAcik} title="Stüdyo değiştir"
            className={cn("flex h-12 w-full items-center gap-2.5 rounded-[14px] px-2 text-left transition-colors hover:bg-white/[0.05]", studyoAcik && "bg-white/[0.06]", dar && "justify-center")}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#0a0a0b]"><Clapperboard className="h-4 w-4" strokeWidth={2.1} /></span>
            {!dar && <><span className="min-w-0 flex-1 leading-tight"><span className="block truncate text-[14px] font-semibold tracking-[-0.01em] text-metin">Sinema Stüdyosu</span><span className="block truncate text-[11.5px] text-metin-3">Stüdyo değiştir</span></span><ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-metin-3" /></>}
          </button>
          <Yuzen acik={studyoAcik} onKapat={() => setStudyoAcik(false)} yerlesim="alt-sol" bosluk={6} className="w-[260px] rounded-[16px] border border-white/[0.08] bg-[#151517] p-1.5">
            <p className="-mx-1.5 -mt-1.5 mb-1.5 border-b border-white/[0.06] px-3.5 py-2.5 text-[13px] font-semibold text-metin">Stüdyolar</p>
            {STUDYOLAR.map((s, i) => (
              <Link key={s.href} href={s.href} onClick={() => setStudyoAcik(false)} className={cn("flex items-center gap-2.5 rounded-[11px] px-2 py-1.5 ring-1 ring-inset transition-colors", i === 0 ? "bg-white/[0.06] ring-white/40" : "ring-transparent hover:bg-white/[0.05]")}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white/[0.06] text-metin ring-1 ring-inset ring-white/[0.08]"><s.ikon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-metin">{s.ad}</span><span className="block truncate text-[11.5px] text-metin-3">{s.alt}</span></span>
              </Link>
            ))}
          </Yuzen>
        </div>
        <Tooltip label={dar ? "Kenar çubuğunu aç" : "Kenar çubuğunu daralt"} side="right">
          <button onClick={() => onDar(!dar)} aria-label={dar ? "Kenar çubuğunu aç" : "Kenar çubuğunu daralt"} className="flex h-9 w-8 shrink-0 items-center justify-center rounded-[10px] text-metin-3 transition-colors hover:bg-white/[0.05] hover:text-metin">
            {dar ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </Tooltip>
      </div>

      {/* Gezinme */}
      <nav className="space-y-0.5 px-2.5 pt-1" aria-label="Sinema stüdyosu">
        {OGELER.map((o) => {
          const aktif = sayfa === o.id, n = sayilar[o.id];
          const icerik = (
            <button onClick={() => onSayfa(o.id)} aria-current={aktif ? "page" : undefined}
              className={cn("group relative isolate flex h-10 w-full items-center gap-3 rounded-[12px] px-2.5 text-left transition-colors active:scale-[0.99]", !aktif && "hover:bg-white/[0.04]", dar && "justify-center px-0")}>
              {aktif && <motion.span layoutId="sinema-kenar-secim" className="absolute inset-0 -z-10 rounded-[12px] bg-white/[0.08] ring-1 ring-inset ring-white/[0.08]" transition={{ type: "spring", stiffness: 480, damping: 40 }} />}
              <o.ikon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", aktif ? "text-metin" : "text-metin-3 group-hover:text-metin-2")} strokeWidth={1.9} />
              {!dar && <><span className={cn("flex-1 text-[14px] font-medium", aktif ? "text-metin" : "text-metin-2 group-hover:text-metin")}>{o.ad}</span>{!!n && <span className={cn("rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums", aktif ? "bg-white text-[#0a0a0b]" : "bg-white/[0.06] text-metin-3")}>{n > 99 ? "99+" : n}</span>}</>}
            </button>
          );
          return <div key={o.id}>{dar ? <Tooltip label={o.ad} side="right">{icerik}</Tooltip> : icerik}</div>;
        })}
      </nav>

      {/* Projeler */}
      {!dar ? (
        <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-white/[0.06] px-2.5 pt-3">
          <div className="flex h-8 items-center gap-1 pl-2 pr-0.5">
            {ara === null ? (
              <p className="flex flex-1 items-center gap-2 text-[13px] font-semibold text-metin">Projeler{projeler.length > 0 && <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] font-semibold tabular-nums text-metin-3">{projeler.length}</span>}</p>
            ) : (
              <input autoFocus value={ara} onChange={(e) => setAra(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setAra(null)} placeholder="Proje ara" aria-label="Proje ara"
                className="h-7 min-w-0 flex-1 rounded-[8px] bg-white/[0.05] px-2.5 text-[12.5px] text-metin outline-none ring-1 ring-inset ring-white/[0.1] placeholder:text-metin-3 focus:ring-white/30" />
            )}
            <button onClick={() => setAra((v) => (v === null ? "" : null))} aria-label={ara === null ? "Proje ara" : "Aramayı kapat"} className="flex h-7 w-7 items-center justify-center rounded-[8px] text-metin-3 hover:bg-white/[0.05] hover:text-metin">{ara === null ? <Search className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}</button>
            <Tooltip label={sirala === "yeni" ? "Son güncellenen önce" : "Ada göre"} side="top">
              <button onClick={() => setSirala((v) => (v === "yeni" ? "ad" : "yeni"))} aria-label="Sırala" className="flex h-7 w-7 items-center justify-center rounded-[8px] text-metin-3 hover:bg-white/[0.05] hover:text-metin"><ArrowDownUp className="h-3.5 w-3.5" /></button>
            </Tooltip>
            <Tooltip label="Yeni proje" side="top">
              <button onClick={onYeniProje} aria-label="Yeni proje" className="ml-0.5 flex h-7 w-7 items-center justify-center rounded-[8px] bg-white text-[#0a0a0b] transition-transform active:scale-[0.92]"><Plus className="h-4 w-4" strokeWidth={2.4} /></button>
            </Tooltip>
          </div>
          <div className="mt-1 min-h-0 flex-1 overflow-y-auto pb-2 [mask-image:linear-gradient(to_bottom,black_calc(100%-16px),transparent)] [scrollbar-width:thin]">
            {liste.map((p) => {
              const kapak = kapaklar.get(p.id);
              return (
                <Link key={p.id} href={`/panel/projeler/${p.id}`} title={p.ad} className="group relative flex h-12 items-center gap-2.5 rounded-[10px] px-2 transition-colors before:pointer-events-none before:absolute before:inset-x-2 before:top-0 before:h-px before:bg-white/[0.07] before:transition-opacity first:before:hidden hover:bg-white/[0.065] hover:before:opacity-0 active:scale-[0.99] [&:hover+a]:before:opacity-0">
                  <MacKlasor renk={p.renk ?? "#4aa8f0"} gorsel={kapak} kapali={!kapak} className="h-[24px] w-[31px] drop-shadow-none" />
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="flex items-center gap-1.5 text-[13.5px] font-medium text-metin-2 transition-colors group-hover:text-metin"><span className="truncate">{p.ad}</span>{p.sabit && <Pin className="h-3 w-3 shrink-0 text-metin-3" />}</span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-metin-3">{p.guncelleme ? once(p.guncelleme) : "Örnek proje"}</span>
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 -translate-x-1 text-metin-3 opacity-0 transition-[opacity,transform] group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              );
            })}
            {!liste.length && <p className="px-2 py-3 text-[12px] leading-relaxed text-metin-3">{ara ? "Eşleşen proje yok." : "Henüz proje yok. Çekimlerini bir projede toplamak için yeni proje aç."}</p>}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-1 flex-col items-center gap-1">
          <Tooltip label="Yeni proje" side="right"><button onClick={onYeniProje} aria-label="Yeni proje" className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white text-[#0a0a0b]"><Plus className="h-4 w-4" strokeWidth={2.4} /></button></Tooltip>
        </div>
      )}

      {/* Öğrenme kartı */}
      <AnimatePresence>
        {ogren && !dar && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="group relative m-2.5 shrink-0 overflow-hidden rounded-[14px] ring-1 ring-inset ring-white/[0.08]">
            <Link href="/panel/blog" className="relative block aspect-[16/8]">
              <video src="/gercek/video-hareket/dolly-in.mp4" poster="/gercek/video-hareket/dolly-in-poster.webp" autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:hidden" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/gercek/video-hareket/dolly-in-poster.webp" alt="" className="absolute inset-0 hidden h-full w-full object-cover motion-reduce:block" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
              <span className="absolute inset-x-3 bottom-2.5">
                <span className="block text-[11px] font-medium text-white/65">Rehber</span>
                <span className="mt-0.5 flex items-end gap-1.5 text-[13px] font-semibold leading-snug text-white">Kurulumdan sahneye: yönetmen gibi çalış<ArrowUpRight className="mb-0.5 h-3.5 w-3.5 shrink-0" /></span>
              </span>
            </Link>
            <button onClick={() => { setOgren(false); try { localStorage.setItem("vayra-sinema-ogren", "0"); } catch { /* yok */ } }} aria-label="Kartı kapat"
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white/80 opacity-0 backdrop-blur transition-opacity hover:text-white group-hover:opacity-100 [@media(hover:none)]:opacity-100"><X className="h-3.5 w-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
