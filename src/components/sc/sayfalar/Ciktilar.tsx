"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { AppWindow, Gamepad2, Globe, ImageIcon, LayoutDashboard, LayoutGrid, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupercomputer, type SCCikti } from "@/store/useSupercomputer";
import { oncesi } from "./Projeler";

const YAY = { type: "spring", stiffness: 420, damping: 32 } as const;
const TURLER = [["tumu", "Tümü", LayoutGrid], ["site", "Siteler", Globe], ["uygulama", "Uygulamalar", AppWindow], ["oyun", "Oyunlar", Gamepad2], ["dashboard", "Paneller", LayoutDashboard], ["gorsel", "Görseller", ImageIcon]] as const;
const TUR_AD: Record<string, string> = { site: "Web sitesi", uygulama: "Uygulama", oyun: "Oyun", dashboard: "Panel", gorsel: "Görsel", video: "Video" };

/** Kart önizlemesi: site/oyun/panel için küçültülmüş canlı sayfa (betikler kapalı), görsel için kendisi. */
function Onizleme({ c }: { c: SCCikti }) {
  if (c.tur === "gorsel" && c.url) {
    const bg = c.url.startsWith("data:") || c.url.startsWith("http") || c.url.startsWith("/") ? `url("${c.url}") center/cover` : c.url;
    return <span className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]" style={{ background: bg }} />;
  }
  if (c.html) return <iframe srcDoc={c.html.replace(/<script[\s\S]*?<\/script>/gi, "")} title="" tabIndex={-1} aria-hidden sandbox="" loading="lazy" className="pointer-events-none absolute left-0 top-0 h-[400%] w-[400%] origin-top-left scale-[0.25] border-0 bg-white" />;
  return <span className="absolute inset-0 flex items-center justify-center bg-white/[0.04]"><Sparkles className="h-6 w-6 text-[var(--sc-metin-3)]" /></span>;
}

/** Çıktılar — tüm sohbetlerde üretilen site, oyun, panel ve görseller tek galeride (Claude Artifacts gibi). */
export function Ciktilar() {
  const sohbetler = useSupercomputer((s) => s.sohbetler);
  const [tur, setTur] = useState<(typeof TURLER)[number][0]>("tumu");
  const [ara, setAra] = useState("");

  const hepsi = useMemo(() => sohbetler.filter((s) => !s.gecici).flatMap((s) => s.mesajlar.flatMap((m) => (m.ciktilar ?? []).map((c) => ({ c, s, z: m.zaman }))))
    .sort((a, b) => b.z - a.z), [sohbetler]);
  const q = ara.trim().toLocaleLowerCase("tr");
  const liste = hepsi.filter(({ c, s }) => (tur === "tumu" || c.tur === tur) && (!q || (c.ad ?? "").toLocaleLowerCase("tr").includes(q) || s.baslik.toLocaleLowerCase("tr").includes(q)));
  const sayi = (t: string) => (t === "tumu" ? hepsi.length : hepsi.filter((x) => x.c.tur === t).length);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[var(--sc-zemin)] text-[var(--sc-metin)]">
        <div className="mx-auto w-full max-w-[1080px] px-6 pb-16 pt-12 max-md:pt-16 max-sm:px-4">
          <h1 className="text-[28px] font-normal tracking-[-0.02em] max-sm:text-[24px]">Çıktılar</h1>
          <p className="mt-1 text-[14.5px] text-[var(--sc-metin-2)]">Sohbetlerinde kurduğun siteler, oyunlar, paneller ve görseller.</p>

          <div className="mt-6 flex items-center gap-3 max-md:flex-col max-md:items-stretch">
            <div role="tablist" aria-label="Çıktı türü" className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
              {TURLER.map(([id, ad, I]) => (
                <button key={id} role="tab" aria-selected={tur === id} onClick={() => setTur(id)}
                  className={cn("relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-medium transition-colors", tur === id ? "text-[var(--sc-metin)]" : "text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]")}>
                  {tur === id && <motion.span layoutId="cikti-tur" transition={YAY} className="absolute inset-0 rounded-full bg-white/[0.08] ring-1 ring-inset ring-white/[0.1]" />}
                  <I className="relative h-4 w-4" /><span className="relative">{ad}</span>
                  <span className="relative tabular-nums text-[12px] text-[var(--sc-metin-3)]">{sayi(id)}</span>
                </button>
              ))}
            </div>
            <label className="flex h-10 items-center gap-2.5 rounded-full bg-white/[0.04] px-3.5 ring-1 ring-inset ring-white/[0.08] focus-within:ring-[var(--sc-aksan)]/50 md:ml-auto md:w-[260px]">
              <Search className="h-4 w-4 shrink-0 text-[var(--sc-metin-3)]" />
              <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Çıktılarda ara" aria-label="Çıktılarda ara" className="h-full w-full bg-transparent text-[14px] outline-none placeholder:text-[var(--sc-metin-3)]" />
            </label>
          </div>

          {hepsi.length === 0 ? (
            <div className="mt-10 rounded-[22px] bg-white/[0.025] p-8 text-center ring-1 ring-inset ring-white/[0.07] max-sm:p-6">
              <div className="mx-auto mb-5 grid w-fit grid-cols-3 gap-2">
                {[Globe, Gamepad2, ImageIcon].map((I, i) => <span key={i} className={cn("flex h-14 w-16 items-center justify-center rounded-[12px] ring-1 ring-inset ring-white/[0.1]", i === 1 ? "bg-[var(--sc-aksan)]/15 text-[var(--sc-aksan)]" : "bg-white/[0.05] text-[var(--sc-metin-2)]")}><I className="h-5 w-5" /></span>)}
              </div>
              <h2 className="text-[18px] font-semibold">Henüz çıktı yok</h2>
              <p className="mx-auto mt-2 max-w-[420px] text-[14px] leading-relaxed text-[var(--sc-metin-2)]">Sohbette “bir site kur”, “yılan oyunu yap” ya da “görsel üret” de; hazır olan her şey burada toplanır.</p>
              <Link href="/panel/supercomputer" className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[14px] font-medium ring-1 ring-inset ring-white/[0.1] hover:bg-white/[0.12]">Sohbete başla</Link>
            </div>
          ) : liste.length === 0 ? (
            <p className="mt-12 text-center text-[14px] text-[var(--sc-metin-3)]">Bu filtreyle eşleşen çıktı yok</p>
          ) : (
            <motion.div className="mt-6 grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
              <AnimatePresence mode="popLayout" initial={false}>
                {liste.map(({ c, s, z }) => (
                  <motion.div key={c.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={YAY}>
                    <Link href={`/panel/supercomputer/${s.id}?cikti=${encodeURIComponent(c.id)}`} className="group block">
                      <span className="relative block aspect-[4/3] overflow-hidden rounded-[16px] bg-[#18181b] ring-1 ring-inset ring-white/[0.09] transition-shadow group-hover:ring-white/[0.2]">
                        <Onizleme c={c} />
                        
                      </span>
                      <span className="mt-2.5 block truncate px-0.5 text-[14px] font-medium">{c.ad || TUR_AD[c.tur]}</span>
                      <span className="mt-0.5 flex items-center gap-1.5 px-0.5 text-[12.5px] text-[var(--sc-metin-3)]">
                        <span className="shrink-0">{TUR_AD[c.tur] ?? "Çıktı"}</span><span>·</span><span className="truncate">{s.baslik}</span><span className="ml-auto shrink-0">{oncesi(z)}</span>
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </MotionConfig>
  );
}
