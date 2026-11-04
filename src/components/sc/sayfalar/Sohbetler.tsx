"use client";

import { useSCProjeler } from "@/lib/scProje";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Archive, ArchiveRestore, Check, FolderClosed, MessageSquare, Pin, Plus, Search, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useSupercomputer, type SCSohbet } from "@/store/useSupercomputer";
import { Yuzen } from "@/components/ui/Yuzen";
import { oncesi } from "./Projeler";

const YAY = { type: "spring", stiffness: 420, damping: 32 } as const;
const sonEtkinlik = (s: SCSohbet) => s.mesajlar[s.mesajlar.length - 1]?.zaman ?? s.olusturma;
const ozet = (s: SCSohbet) => {
  const m = [...s.mesajlar].reverse().find((x) => x.metin || x.yanit);
  const t = m?.yanit ? m.yanit.parcalar.filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join(" ") : m?.metin ?? "";
  return t.replace(/<[^>]+>/g, "").replace(/```[\s\S]*?```/g, " ").replace(/\[(\d+)\]\(#sc-k-\d+\)/g, "").replace(/[*_`#>|]+/g, "").replace(/\s+/g, " ").trim();
};

/** Sohbetler — Claude'un "Sohbetlerin" sayfası: ara, arşiv sekmesi, seçip toplu arşivle/taşı/sil. */
export function Sohbetler() {
  const { sohbetler, sohbetGuncelle, sohbetSil } = useSupercomputer();
  const projeler = useSCProjeler();
  const [ara, setAra] = useState("");
  const [sekme, setSekme] = useState<"hepsi" | "arsiv" | "kilitli">("hepsi");
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [secim, setSecim] = useState(false);
  const [tasi, setTasi] = useState(false);
  const [silOnay, setSilOnay] = useState(false);

  const q = ara.trim().toLocaleLowerCase("tr");
  const liste = useMemo(() => sohbetler.filter((s) => !s.gecici && (sekme === "kilitli" ? !!s.kilit : !s.kilit && (sekme === "arsiv" ? s.arsiv : !s.arsiv)))
    .filter((s) => !q || s.baslik.toLocaleLowerCase("tr").includes(q) || (!s.kilit && ozet(s).toLocaleLowerCase("tr").includes(q)))
    .sort((a, b) => sonEtkinlik(b) - sonEtkinlik(a)), [sohbetler, sekme, q]);
  const arsivSayisi = sohbetler.filter((s) => s.arsiv && !s.gecici && !s.kilit).length;
  const kilitliSayisi = sohbetler.filter((s) => s.kilit && !s.gecici).length;
  const hepsiSecili = liste.length > 0 && liste.every((s) => secili.has(s.id));
  const bitir = () => { setSecili(new Set()); setSecim(false); };
  const degistir = (id: string) => setSecili((x) => { const y = new Set(x); if (y.has(id)) y.delete(id); else y.add(id); return y; });
  const toplu = (f: (id: string) => void, mesaj: string) => { const n = secili.size; secili.forEach(f); toast.success(`${n} ${mesaj}`); bitir(); };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[var(--sc-zemin)] text-[var(--sc-metin)]">
        <div className="mx-auto w-full max-w-[820px] px-6 pb-28 pt-12 max-md:pt-16 max-sm:px-4">
          <div className="flex items-center gap-3">
            <h1 className="flex-1 text-[28px] font-normal tracking-[-0.02em] max-sm:text-[24px]">Sohbetler</h1>
            <Link href="/panel/supercomputer" className="flex h-10 items-center gap-1.5 rounded-full bg-[var(--sc-metin)] pl-3.5 pr-4 text-[14px] font-semibold text-[#111113] hover:bg-white"><Plus className="h-4 w-4" strokeWidth={2.4} />Yeni sohbet</Link>
          </div>

          <label className="mt-6 flex h-11 items-center gap-2.5 rounded-[12px] bg-white/[0.04] px-3.5 ring-1 ring-inset ring-white/[0.08] focus-within:ring-[var(--sc-aksan)]/50">
            <Search className="h-4 w-4 shrink-0 text-[var(--sc-metin-3)]" />
            <input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Sohbetlerinde ara" aria-label="Sohbetlerinde ara" className="h-full w-full bg-transparent text-[14.5px] outline-none placeholder:text-[var(--sc-metin-3)]" />
          </label>

          <div className="mt-4 flex items-center gap-2">
            <div role="tablist" className="flex gap-1">
              {([["hepsi", "Sohbetler"], ["arsiv", `Arşiv${arsivSayisi ? ` · ${arsivSayisi}` : ""}`], ...(kilitliSayisi ? [["kilitli", `Kilitli · ${kilitliSayisi}`]] : [])] as ["hepsi" | "arsiv" | "kilitli", string][]).map(([id, ad]) => (
                <button key={id} role="tab" aria-selected={sekme === id} onClick={() => { setSekme(id); bitir(); }}
                  className={cn("relative h-9 rounded-full px-3.5 text-[13.5px] font-medium transition-colors", sekme === id ? "text-[var(--sc-metin)]" : "text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]")}>
                  {sekme === id && <motion.span layoutId="sohbet-sekme" transition={YAY} className="absolute inset-0 rounded-full bg-white/[0.08] ring-1 ring-inset ring-white/[0.1]" />}
                  <span className="relative">{ad}</span>
                </button>
              ))}
            </div>
            <span className="ml-auto text-[13px] tabular-nums text-[var(--sc-metin-3)]">{liste.length} sohbet</span>
            {liste.length > 0 && (secim
              ? <button onClick={bitir} className="h-9 rounded-full px-3 text-[13.5px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.05] hover:text-[var(--sc-metin)]">Bitti</button>
              : <button onClick={() => setSecim(true)} className="h-9 rounded-full px-3.5 text-[13.5px] font-medium text-[var(--sc-metin)] ring-1 ring-inset ring-white/[0.12] hover:bg-white/[0.05]">Seç</button>)}
          </div>

          {secim && liste.length > 0 && (
            <button onClick={() => setSecili(hepsiSecili ? new Set() : new Set(liste.map((s) => s.id)))} className="mt-3 flex items-center gap-2.5 px-3 text-[13px] text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]">
              <Kutu acik={hepsiSecili} />{hepsiSecili ? "Seçimi kaldır" : "Tümünü seç"}
            </button>
          )}

          {liste.length === 0 ? (
            <div className="mt-12 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05]">{sekme === "arsiv" ? <Archive className="h-5 w-5 text-[var(--sc-metin-3)]" /> : <MessageSquare className="h-5 w-5 text-[var(--sc-metin-3)]" />}</span>
              <p className="mt-3 text-[14.5px] text-[var(--sc-metin-2)]">{q ? `“${ara.trim()}” ile eşleşen sohbet yok` : sekme === "arsiv" ? "Arşivde sohbet yok. Bir sohbetin ⋯ menüsünden arşivleyebilirsin." : "Henüz sohbet yok."}</p>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-white/[0.06]">
              {liste.map((s) => {
                const pr = s.projeId ? projeler.find((p) => p.id === s.projeId) : undefined;
                const sec = secili.has(s.id);
                const ic = (
                  <>
                    {secim && <Kutu acik={sec} />}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-[15px] font-medium">{s.sabit && <Pin className="h-3.5 w-3.5 shrink-0 fill-current text-[var(--sc-metin-3)]" />}<span className="truncate">{s.baslik}</span></span>
                      <span className="mt-0.5 block truncate text-[13px] text-[var(--sc-metin-3)]">{s.kilit ? "Kilitli — açmak için şifre gerekir" : ozet(s) || "Boş sohbet"}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1 text-[12px] text-[var(--sc-metin-3)]">
                      <span>{oncesi(sonEtkinlik(s))}</span>
                      {pr && <span className="flex max-w-[140px] items-center gap-1 truncate"><FolderClosed className="h-3 w-3 shrink-0" /><span className="truncate">{pr.ad}</span></span>}
                    </span>
                  </>
                );
                return (
                  <li key={s.id} className="group relative">
                    {secim
                      ? <button onClick={() => degistir(s.id)} aria-pressed={sec} className={cn("flex w-full items-center gap-3 rounded-[12px] px-3 py-3.5 text-left transition-colors", sec ? "bg-[var(--sc-aksan)]/[0.07]" : "hover:bg-white/[0.03]")}>{ic}</button>
                      : <Link href={`/panel/supercomputer/${s.id}`} className="flex items-center gap-3 rounded-[12px] px-3 py-3.5 pr-12 transition-colors hover:bg-white/[0.03]">{ic}</Link>}
                    {!secim && (
                      <button onClick={() => { sohbetGuncelle(s.id, { arsiv: !s.arsiv }); toast.success(s.arsiv ? "Sohbet arşivden çıkarıldı" : "Sohbet arşivlendi"); }} aria-label={s.arsiv ? "Arşivden çıkar" : "Arşivle"} title={s.arsiv ? "Arşivden çıkar" : "Arşivle"}
                        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--sc-metin-3)] opacity-0 transition-opacity hover:bg-white/[0.07] hover:text-[var(--sc-metin)] focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100">
                        {s.arsiv ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Toplu işlem çubuğu */}
        <AnimatePresence>
          {secim && secili.size > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={YAY}
              className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#1c1c1f] p-1.5 pl-4 ring-1 ring-inset ring-white/[0.12] md:ml-[calc(var(--sidebar-genislik,0px)/2)]">
              <span className="mr-2 text-[13.5px] font-medium tabular-nums">{secili.size} seçili</span>
              <button onClick={() => toplu((id) => sohbetGuncelle(id, { arsiv: sekme !== "arsiv" }), sekme === "arsiv" ? "sohbet arşivden çıkarıldı" : "sohbet arşivlendi")} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-medium hover:bg-white/[0.07]">
                {sekme === "arsiv" ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}<span className="max-sm:sr-only">{sekme === "arsiv" ? "Arşivden çıkar" : "Arşivle"}</span>
              </button>
              <div className="relative">
                <button onClick={() => setTasi((v) => !v)} aria-expanded={tasi} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-medium hover:bg-white/[0.07]"><FolderClosed className="h-4 w-4" /><span className="max-sm:sr-only">Projeye taşı</span></button>
                <AnimatePresence>
                  <Yuzen acik={tasi} onKapat={() => setTasi(false)} yerlesim="ust-sol" bosluk={8} etiket="Projeye taşı" className="rounded-[14px] border border-white/[0.09] bg-[#1a1a1d] p-1.5" style={{ width: 230 }}>
                    {projeler.length ? projeler.map((p) => (
                      <button key={p.id} onClick={() => { setTasi(false); toplu((id) => sohbetGuncelle(id, { projeId: p.id }), `sohbet ${p.ad} projesine taşındı`); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13.5px] hover:bg-white/[0.06]"><FolderClosed className="h-4 w-4 shrink-0 text-[var(--sc-metin-2)]" /><span className="truncate">{p.ad}</span></button>
                    )) : <Link href="/panel/supercomputer/projeler" className="flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13.5px] text-[var(--sc-metin-2)] hover:bg-white/[0.06]"><Plus className="h-4 w-4" />Önce proje oluştur</Link>}
                  </Yuzen>
                </AnimatePresence>
              </div>
              <button onClick={() => setSilOnay(true)} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-medium text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /><span className="max-sm:sr-only">Sil</span></button>
              <button onClick={bitir} aria-label="Seçimi kapat" className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--sc-metin-2)] hover:bg-white/[0.07]"><X className="h-4 w-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {silOnay && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="perde absolute inset-0 bg-black/60" onClick={() => setSilOnay(false)} />
            <motion.div role="alertdialog" aria-modal="true" aria-label="Sohbetleri sil" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={YAY}
              className="relative w-full max-w-[400px] rounded-[22px] bg-[#18181b] p-5 ring-1 ring-inset ring-white/[0.1]">
              <h2 className="text-[16px] font-semibold">{secili.size} sohbet silinsin mi?</h2>
              <p className="mt-1 text-[14px] text-[var(--sc-metin-2)]">Sohbetler ve içindeki çıktılar kalıcı olarak silinir.</p>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setSilOnay(false)} className="h-9 rounded-full px-4 text-[13.5px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.06]">Vazgeç</button>
                <button autoFocus onClick={() => { setSilOnay(false); toplu(sohbetSil, "sohbet silindi"); }} className="h-9 rounded-full bg-rose-500 px-4 text-[13.5px] font-semibold text-white">Sil</button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}

function Kutu({ acik }: { acik: boolean }) {
  return (
    <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] ring-1 ring-inset transition-colors", acik ? "bg-[var(--sc-aksan)] ring-[var(--sc-aksan)] text-[var(--sc-aksan-metin)]" : "ring-white/25")}>
      {acik && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
    </span>
  );
}
