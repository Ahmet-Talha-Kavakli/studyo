"use client";

import { useSCProjeler, scProjeAc } from "@/lib/scProje";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { FileText, FolderClosed, MessageSquare, Pin, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupercomputer } from "@/store/useSupercomputer";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";

const YAY = { type: "spring", stiffness: 420, damping: 32 } as const;

/** "3 gün önce" gibi göreli zaman. */
export const oncesi = (z: number) => {
  const dk = Math.round((Date.now() - z) / 60000);
  if (dk < 1) return "az önce";
  if (dk < 60) return `${dk} dk önce`;
  const sa = Math.round(dk / 60);
  if (sa < 24) return `${sa} sa önce`;
  const g = Math.round(sa / 24);
  return g < 30 ? `${g} gün önce` : new Date(z).toLocaleDateString("tr", { day: "numeric", month: "short" });
};

/** Yeni proje penceresi: ad + ne için olduğu. */
export function YeniProjePenceresi({ onKapat, onOlustur }: { onKapat: () => void; onOlustur: (ad: string, aciklama: string) => void }) {
  const [ad, setAd] = useState("");
  const [aciklama, setAciklama] = useState("");
  const ref = useOdakTuzagi<HTMLFormElement>(true);
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") onKapat(); }; window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t); }, [onKapat]);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="perde absolute inset-0 bg-black/60" onClick={onKapat} />
      <motion.form ref={ref} role="dialog" aria-modal="true" aria-label="Yeni proje" initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={YAY}
        onSubmit={(e) => { e.preventDefault(); if (ad.trim()) onOlustur(ad.trim(), aciklama.trim()); }}
        className="relative w-full max-w-[520px] rounded-[22px] bg-[#18181b] p-6 ring-1 ring-inset ring-white/[0.1]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[19px] font-semibold text-[var(--sc-metin)]">Yeni proje</h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--sc-metin-2)]">Sohbetlerini bir arada tut. Projeye eklediğin talimat ve dosyalar, içindeki her sohbette kullanılır.</p>
          </div>
          <button type="button" onClick={onKapat} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.06]"><X className="h-4 w-4" /></button>
        </div>
        <label className="block text-[13px] font-medium text-[var(--sc-metin-2)]">Ne üzerinde çalışıyorsun?
          <input autoFocus value={ad} onChange={(e) => setAd(e.target.value.slice(0, 60))} placeholder="Ör. Demlik kahve markası"
            className="mt-1.5 h-11 w-full rounded-[12px] bg-white/[0.04] px-3.5 text-[15px] text-[var(--sc-metin)] outline-none ring-1 ring-inset ring-white/[0.1] placeholder:text-[var(--sc-metin-3)] focus:ring-[var(--sc-aksan)]/50" />
        </label>
        <label className="mt-4 block text-[13px] font-medium text-[var(--sc-metin-2)]">Ne yapmaya çalışıyorsun? <span className="font-normal text-[var(--sc-metin-3)]">(isteğe bağlı)</span>
          <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value.slice(0, 300))} rows={3} placeholder="Projenin amacını, hedef kitleni, beklediğin çıktıları anlat"
            className="mt-1.5 block w-full resize-none rounded-[12px] bg-white/[0.04] px-3.5 py-2.5 text-[14.5px] leading-relaxed text-[var(--sc-metin)] outline-none ring-1 ring-inset ring-white/[0.1] placeholder:text-[var(--sc-metin-3)] focus:ring-[var(--sc-aksan)]/50" />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onKapat} className="h-10 rounded-full px-4 text-[14px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]">Vazgeç</button>
          <button type="submit" disabled={!ad.trim()} className="h-10 rounded-full bg-[var(--sc-metin)] px-5 text-[14px] font-semibold text-[#111113] transition-opacity disabled:opacity-40">Proje oluştur</button>
        </div>
      </motion.form>
    </div>
  );
}

const SIRALAR = [["etkinlik", "Son etkinlik"], ["ad", "Ada göre"], ["olusturma", "Oluşturma tarihi"]] as const;

/** Projeler — Claude Projeleri gibi: arama, sıralama ve proje kartları. */
export function Projeler() {
  const router = useRouter();
  const { sohbetler } = useSupercomputer();
  const projeler = useSCProjeler(); const projeAc = scProjeAc;
  const [ara, setAra] = useState("");
  const [sira, setSira] = useState<(typeof SIRALAR)[number][0]>("etkinlik");
  const [yeni, setYeni] = useState(false);
  /* Kenar çubuğundaki "+" → /projeler?yeni=1: yeni proje penceresini doğrudan aç. */
  useEffect(() => {
    const u = new URL(window.location.href);
    if (u.searchParams.get("yeni") === "1") { setYeni(true); u.searchParams.delete("yeni"); window.history.replaceState(null, "", u.pathname + u.search); }
  }, []);

  const liste = useMemo(() => {
    const q = ara.trim().toLocaleLowerCase("tr");
    return projeler.map((p) => {
      const ps = sohbetler.filter((s) => s.projeId === p.id && !s.gecici);
      const son = Math.max(p.olusturma, ...ps.map((s) => s.mesajlar[s.mesajlar.length - 1]?.zaman ?? s.olusturma));
      return { p, sayi: ps.length, son };
    }).filter(({ p }) => !q || p.ad.toLocaleLowerCase("tr").includes(q) || (p.aciklama ?? "").toLocaleLowerCase("tr").includes(q))
      .sort((a, b) => Number(!!b.p.sabit) - Number(!!a.p.sabit) || (sira === "ad" ? a.p.ad.localeCompare(b.p.ad, "tr") : sira === "olusturma" ? b.p.olusturma - a.p.olusturma : b.son - a.son));
  }, [projeler, sohbetler, ara, sira]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[var(--sc-zemin)] text-[var(--sc-metin)]">
        <div className="mx-auto w-full max-w-[880px] px-6 pb-16 pt-12 max-md:pt-16 max-sm:px-4">
          <div className="flex items-center gap-3">
            <h1 className="flex-1 text-[28px] font-normal tracking-[-0.02em] max-sm:text-[24px]">Projeler</h1>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setYeni(true)} className="flex h-10 items-center gap-1.5 rounded-full bg-[var(--sc-metin)] pl-3.5 pr-4 text-[14px] font-semibold text-[#111113] hover:bg-white">
              <Plus className="h-4 w-4" strokeWidth={2.4} />Yeni proje
            </motion.button>
          </div>

          <div className="mt-6 flex items-center gap-2 max-sm:flex-col max-sm:items-stretch">
            <label className="flex h-11 flex-1 items-center gap-2.5 rounded-[12px] bg-white/[0.04] px-3.5 ring-1 ring-inset ring-white/[0.08] focus-within:ring-[var(--sc-aksan)]/50">
              <Search className="h-4 w-4 shrink-0 text-[var(--sc-metin-3)]" />
              <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Projelerde ara" aria-label="Projelerde ara" className="h-full w-full bg-transparent text-[14.5px] outline-none placeholder:text-[var(--sc-metin-3)]" />
            </label>
            <div role="radiogroup" aria-label="Sıralama" className="flex h-11 items-center gap-0.5 rounded-[12px] bg-white/[0.03] p-1 ring-1 ring-inset ring-white/[0.07]">
              {SIRALAR.map(([id, ad]) => (
                <button key={id} role="radio" aria-checked={sira === id} onClick={() => setSira(id)}
                  className={cn("relative h-full flex-1 whitespace-nowrap rounded-[9px] px-3 text-[13px] font-medium transition-colors", sira === id ? "text-[var(--sc-metin)]" : "text-[var(--sc-metin-3)] hover:text-[var(--sc-metin-2)]")}>
                  {sira === id && <motion.span layoutId="proje-sira" transition={YAY} className="absolute inset-0 rounded-[9px] bg-white/[0.08]" />}
                  <span className="relative">{ad}</span>
                </button>
              ))}
            </div>
          </div>

          {projeler.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-[22px] bg-white/[0.025] p-8 text-center ring-1 ring-inset ring-white/[0.07] max-sm:p-6">
              <div className="mx-auto mb-5 flex w-fit items-end gap-1.5">
                {[["-rotate-6", "bg-[#26303d]"], ["z-[1] -mb-1", "bg-[var(--sc-aksan)]/20"], ["rotate-6", "bg-[#26303d]"]].map(([d, r], i) => (
                  <span key={i} className={cn("flex h-16 w-14 flex-col gap-1.5 rounded-[10px] p-2 ring-1 ring-inset ring-white/[0.1]", d, r)}>
                    <span className="h-1.5 w-8 rounded-full bg-white/25" /><span className="h-1.5 w-6 rounded-full bg-white/15" /><span className="h-1.5 w-7 rounded-full bg-white/15" />
                  </span>
                ))}
              </div>
              <h2 className="text-[18px] font-semibold">İşini projelerde topla</h2>
              <p className="mx-auto mt-2 max-w-[440px] text-[14px] leading-relaxed text-[var(--sc-metin-2)]">Bir markayı, kitabı ya da müşteriyi tek yerde tut: talimatlarını bir kez yaz, belgelerini ekle; projedeki her sohbet bunları bilerek yanıt versin.</p>
              <button onClick={() => setYeni(true)} className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[14px] font-medium ring-1 ring-inset ring-white/[0.1] hover:bg-white/[0.12]"><Plus className="h-4 w-4" />İlk projeni oluştur</button>
            </motion.div>
          ) : liste.length === 0 ? (
            <p className="mt-12 text-center text-[14px] text-[var(--sc-metin-3)]">“{ara.trim()}” ile eşleşen proje yok</p>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              <AnimatePresence initial={false}>
                {liste.map(({ p, sayi, son }, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...YAY, delay: i * 0.02 }}>
                    <Link href={`/panel/supercomputer/projeler/${p.id}`}
                      className="group flex h-full min-h-[148px] flex-col rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.055] hover:ring-white/[0.14]">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--sc-aksan)]/12 text-[var(--sc-aksan)]"><FolderClosed className="h-[18px] w-[18px]" /></span>
                        <span className="min-w-0 flex-1 pt-1.5 text-[15.5px] font-semibold leading-snug">{p.ad}</span>
                        {p.sabit && <Pin className="mt-2 h-3.5 w-3.5 shrink-0 fill-current text-[var(--sc-metin-3)]" />}
                      </div>
                      <p className="mt-2 line-clamp-2 flex-1 text-[13.5px] leading-relaxed text-[var(--sc-metin-2)]">{p.aciklama || <span className="text-[var(--sc-metin-3)]">Açıklama yok</span>}</p>
                      <div className="mt-3 flex items-center gap-3 text-[12.5px] text-[var(--sc-metin-3)]">
                        <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{sayi} sohbet</span>
                        {p.dosyalar.length > 0 && <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{p.dosyalar.length} dosya</span>}
                        <span className="ml-auto">{oncesi(son)}</span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
        {yeni && <YeniProjePenceresi onKapat={() => setYeni(false)} onOlustur={(ad, a) => { const id = projeAc(ad, a || undefined); setYeni(false); router.push(`/panel/supercomputer/projeler/${id}`); }} />}
      </div>
    </MotionConfig>
  );
}
