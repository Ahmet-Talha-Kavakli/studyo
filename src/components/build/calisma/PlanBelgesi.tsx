"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Loader2, MessageSquareQuote, Plus, Sparkles, Trash2 } from "lucide-react";
import { YanPanel } from "@/components/build/paylasim/ortak";
import type { PlanKart } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";

type PlanIcerik = { baslik: string; neden: string; adimlar: string[]; bitti: string; kapsamDisi?: string };
const yay = { type: "spring" as const, stiffness: 460, damping: 38 };

/** Planı ajana gidecek düz metne çevirir (onayda ve yorumda kullanılır). */
export function planMetni(p: PlanIcerik) {
  return `${p.baslik}\n${p.neden}\n${p.adimlar.map((a, i) => `${i + 1}. ${a}`).join("\n")}\nBitti sayılır: ${p.bitti}${p.kapsamDisi ? `\nKapsam dışı: ${p.kapsamDisi}` : ""}`;
}

/**
 * Plan belgesi (Lovable Plan görünümü düzeyinde): tam boy okuma, elle düzenleme (adım ekle, sil, sırala), her kayıt yeni
 * plan sürümü (önceki sürümler gezilir, adım farkı gösterilir), metin seçip yalnız o kısmı ajana yeniden yazdırma.
 */
export function PlanBelgesi({ acik, kapat, plan, kaydet, onayla, yorumla, kilitli }: {
  acik: boolean; kapat: () => void; plan: PlanKart; kilitli?: boolean;
  kaydet: (yeni: PlanKart) => Promise<void>; onayla: (p: PlanKart) => void; yorumla: (secili: string, yorum: string) => void;
}) {
  const surumler = useMemo<(PlanIcerik & { zaman?: number })[]>(() => [...(plan.onceki ?? []), plan], [plan]);
  const [gor, setGor] = useState(surumler.length - 1);
  const [kip, setKip] = useState<"oku" | "duzenle">("oku");
  const [taslak, setTaslak] = useState<PlanIcerik>(plan);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [secili, setSecili] = useState<{ metin: string; x: number; y: number } | null>(null);
  const [yorum, setYorum] = useState("");
  const [yorumAcik, setYorumAcik] = useState(false);
  const govde = useRef<HTMLDivElement>(null);
  useEffect(() => { setGor(surumler.length - 1); setTaslak(plan); setKip("oku"); }, [plan, surumler.length, acik]);
  const g = surumler[gor] ?? plan;
  const onceki = gor > 0 ? surumler[gor - 1] : null;
  const fark = useMemo(() => {
    if (!onceki) return null;
    const eski = new Set(onceki.adimlar), yeni = new Set(g.adimlar);
    return { eklenen: new Set(g.adimlar.filter((a) => !eski.has(a))), silinen: onceki.adimlar.filter((a) => !yeni.has(a)) };
  }, [g, onceki]);
  const sonMu = gor === surumler.length - 1;
  const degisti = JSON.stringify([taslak.baslik, taslak.neden, taslak.adimlar, taslak.bitti, taslak.kapsamDisi ?? ""]) !== JSON.stringify([plan.baslik, plan.neden, plan.adimlar, plan.bitti, plan.kapsamDisi ?? ""]);

  /* Okuma kipinde metin seçilince "Bu kısma yorum yaz" kabarcığı */
  const secimBak = () => {
    if (kip !== "oku" || !sonMu || kilitli) return;
    const s = getSelection();
    const m = s?.toString().trim() ?? "";
    if (!s || !m || m.length < 3 || !govde.current?.contains(s.anchorNode)) { if (!yorumAcik) setSecili(null); return; }
    const r = s.getRangeAt(0).getBoundingClientRect(), k = govde.current.getBoundingClientRect();
    setSecili({ metin: m.slice(0, 600), x: Math.min(k.width - 250, Math.max(0, r.left - k.left)), y: r.bottom - k.top + govde.current.scrollTop + 6 });
    setYorumAcik(false); setYorum("");
  };

  const kaydetVe = async (onayDa: boolean) => {
    setKaydediliyor(true);
    const temiz: PlanIcerik = { ...taslak, adimlar: taslak.adimlar.map((a) => a.trim()).filter(Boolean) };
    const yeni: PlanKart = { ...plan, ...temiz, duzenlendi: true, onceki: [...(plan.onceki ?? []), { baslik: plan.baslik, neden: plan.neden, adimlar: plan.adimlar, bitti: plan.bitti, kapsamDisi: plan.kapsamDisi, zaman: Date.now() }].slice(-20) };
    try { await kaydet(yeni); if (onayDa) { onayla(yeni); kapat(); } else setKip("oku"); } finally { setKaydediliyor(false); }
  };

  const alan = "w-full rounded-[12px] bg-white/[0.04] px-3 py-2 text-[13.5px] leading-relaxed text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/35 focus:ring-white/30";

  return (
    <YanPanel acik={acik} kapat={kapat} genislik={620} baslik="Plan belgesi"
      alt={`${surumler.length > 1 ? `Sürüm ${gor + 1} / ${surumler.length} · ` : ""}${plan.durum === "onaylandi" ? "Onaylandı" : kilitli ? "Salt okunur" : "Onay bekliyor"}`}
      durum={surumler.length > 1 ? (
        <div className="mt-0.5 flex items-center gap-0.5">
          <button type="button" aria-label="Önceki plan sürümü" disabled={gor === 0} onClick={() => { setGor((x) => x - 1); setKip("oku"); }} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" aria-label="Sonraki plan sürümü" disabled={sonMu} onClick={() => setGor((x) => x + 1)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
      ) : undefined}
      alt2={plan.durum === "bekliyor" && !kilitli && sonMu ? (
        <>
          {kip === "duzenle" ? (
            <>
              <button type="button" onClick={() => { setTaslak(plan); setKip("oku"); }} className="h-9 rounded-full px-3.5 text-[13px] text-white/65 hover:bg-white/[0.07] hover:text-white">Vazgeç</button>
              <span className="ml-auto" />
              <button type="button" disabled={!degisti || kaydediliyor} onClick={() => kaydetVe(false)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] text-white ring-1 ring-inset ring-white/[0.1] disabled:opacity-40">{kaydediliyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Kaydet</button>
              <button type="button" disabled={kaydediliyor} onClick={() => (degisti ? kaydetVe(true) : (onayla(plan), kapat()))} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Sparkles className="h-3.5 w-3.5" />Kaydet ve onayla</button>
            </>
          ) : (
            <>
              <p className="min-w-[180px] flex-1 text-[12px] text-white/45">Bir kısmı seçip yorum yaz; ajan yalnız o kısmı yeniden yazar.</p>
              <button type="button" onClick={() => setKip("duzenle")} className="h-9 rounded-full bg-white/[0.08] px-4 text-[13px] text-white ring-1 ring-inset ring-white/[0.1] hover:bg-white/[0.12]">Düzenle</button>
              <button type="button" onClick={() => { onayla(plan); kapat(); }} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Sparkles className="h-3.5 w-3.5" />Onayla ve yap</button>
            </>
          )}
        </>
      ) : undefined}>
      {plan.durum === "bekliyor" && !kilitli && sonMu && (
        <LayoutGroup id="plan-kip">
          <div className="mb-4 flex w-fit rounded-full bg-white/[0.05] p-0.5">
            {(["oku", "duzenle"] as const).map((x) => (
              <button key={x} type="button" onClick={() => setKip(x)} className={cn("relative h-8 rounded-full px-4 text-[12.5px]", kip === x ? "text-black" : "text-white/60 hover:text-white")}>
                {kip === x && <motion.span layoutId="plan-kip-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}<span className="relative">{x === "oku" ? "Oku" : "Düzenle"}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      )}

      {kip === "duzenle" && sonMu ? (
        <div className="space-y-4">
          <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Başlık</span><input value={taslak.baslik} onChange={(e) => setTaslak({ ...taslak, baslik: e.target.value })} className={alan} /></label>
          <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Ne ve neden</span><textarea rows={3} value={taslak.neden} onChange={(e) => setTaslak({ ...taslak, neden: e.target.value })} className={cn(alan, "resize-none")} /></label>
          <div>
            <span className="mb-1.5 block text-[12.5px] text-white/55">Adımlar</span>
            <div className="space-y-1.5">
              <AnimatePresence initial={false}>
                {taslak.adimlar.map((a, i) => (
                  <motion.div key={i} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-start gap-1.5">
                    <span className="mt-2 w-5 shrink-0 text-right text-[12px] tabular-nums text-white/40">{i + 1}</span>
                    <textarea rows={1} value={a} onChange={(e) => setTaslak({ ...taslak, adimlar: taslak.adimlar.map((x, j) => (j === i ? e.target.value : x)) })} className={cn(alan, "min-h-[38px] resize-y py-1.5")} />
                    <div className="flex shrink-0 flex-col">
                      <button type="button" aria-label="Yukarı taşı" disabled={i === 0} onClick={() => { const l = [...taslak.adimlar]; [l[i - 1], l[i]] = [l[i], l[i - 1]]; setTaslak({ ...taslak, adimlar: l }); }} className="flex h-5 w-7 items-center justify-center text-white/45 hover:text-white disabled:opacity-25"><ArrowUp className="h-3 w-3" /></button>
                      <button type="button" aria-label="Aşağı taşı" disabled={i === taslak.adimlar.length - 1} onClick={() => { const l = [...taslak.adimlar]; [l[i + 1], l[i]] = [l[i], l[i + 1]]; setTaslak({ ...taslak, adimlar: l }); }} className="flex h-5 w-7 items-center justify-center text-white/45 hover:text-white disabled:opacity-25"><ArrowDown className="h-3 w-3" /></button>
                    </div>
                    <button type="button" aria-label="Adımı sil" onClick={() => setTaslak({ ...taslak, adimlar: taslak.adimlar.filter((_, j) => j !== i) })} className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <button type="button" onClick={() => setTaslak({ ...taslak, adimlar: [...taslak.adimlar, ""] })} className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.05] px-3 text-[12.5px] text-white/70 ring-1 ring-inset ring-white/[0.08] hover:text-white"><Plus className="h-3.5 w-3.5" />Adım ekle</button>
          </div>
          <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Bitti sayılır</span><textarea rows={2} value={taslak.bitti} onChange={(e) => setTaslak({ ...taslak, bitti: e.target.value })} className={cn(alan, "resize-none")} /></label>
          <label className="block"><span className="mb-1.5 block text-[12.5px] text-white/55">Kapsam dışı</span><textarea rows={2} value={taslak.kapsamDisi ?? ""} onChange={(e) => setTaslak({ ...taslak, kapsamDisi: e.target.value })} placeholder="Bu turda yapılmayacaklar" className={cn(alan, "resize-none")} /></label>
        </div>
      ) : (
        <div ref={govde} onMouseUp={secimBak} onKeyUp={secimBak} className="relative select-text">
          {!sonMu && <p className="mb-3 rounded-[12px] bg-white/[0.04] px-3 py-2 text-[12.5px] text-white/60 ring-1 ring-inset ring-white/[0.07]">Eski sürümü görüyorsun{g.zaman ? `, ${new Date(g.zaman).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} tarihinde değiştirildi` : ""}.</p>}
          <h3 className="text-[19px] font-semibold leading-snug tracking-[-0.01em] text-white">{g.baslik}</h3>
          {g.neden && <p className="mt-2 text-[14px] leading-relaxed text-white/65">{g.neden}</p>}
          <p className="mb-2 mt-5 text-[12.5px] font-medium text-white/50">Adımlar</p>
          <ol className="space-y-2">
            {g.adimlar.map((a, i) => (
              <li key={i} className={cn("flex gap-3 rounded-[12px] px-3 py-2 text-[14px] leading-relaxed", fark?.eklenen.has(a) ? "bg-emerald-400/[0.08] text-emerald-50 ring-1 ring-inset ring-emerald-300/15" : "bg-white/[0.03] text-white/80")}>
                <span className="w-5 shrink-0 text-right tabular-nums text-white/35">{i + 1}</span><span>{a}</span>
              </li>
            ))}
            {fark?.silinen.map((a) => <li key={`s-${a}`} className="flex gap-3 rounded-[12px] bg-rose-500/[0.06] px-3 py-2 text-[14px] leading-relaxed text-rose-100/60 line-through decoration-rose-300/40"><span className="w-5 shrink-0" />{a}</li>)}
          </ol>
          {fark && (fark.eklenen.size > 0 || fark.silinen.length > 0) && <p className="mt-2 text-[11.5px] text-white/40">Önceki sürüme göre {fark.eklenen.size} adım eklendi ya da değişti, {fark.silinen.length} adım çıktı.</p>}
          <dl className="mt-5 space-y-3 border-t border-white/[0.07] pt-4 text-[13.5px]">
            <div><dt className="text-[12.5px] text-white/50">Bitti sayılır</dt><dd className="mt-0.5 leading-relaxed text-white/80">{g.bitti}</dd></div>
            {g.kapsamDisi && <div><dt className="text-[12.5px] text-white/50">Kapsam dışı</dt><dd className="mt-0.5 leading-relaxed text-white/80">{g.kapsamDisi}</dd></div>}
          </dl>

          <AnimatePresence>
            {secili && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={yay} style={{ left: secili.x, top: secili.y }} onMouseUp={(e) => e.stopPropagation()}
                className="absolute z-10 w-[250px] rounded-[14px] bg-[#1f2023] p-1.5 ring-1 ring-inset ring-white/[0.14]">
                {!yorumAcik ? (
                  <button type="button" onClick={() => setYorumAcik(true)} className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[12.5px] text-white hover:bg-white/[0.07]"><MessageSquareQuote className="h-4 w-4 text-[#8be6ff]" />Bu kısma yorum yaz</button>
                ) : (
                  <div className="space-y-1.5 p-1">
                    <p className="line-clamp-2 border-l-2 border-[#55d6fd]/60 pl-2 text-[11.5px] text-white/55">{secili.metin}</p>
                    <textarea autoFocus rows={3} value={yorum} onChange={(e) => setYorum(e.target.value)} placeholder="Nasıl değişsin?" className="w-full resize-none rounded-[10px] bg-white/[0.05] px-2.5 py-2 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.08] placeholder:text-white/35 focus:ring-white/30" />
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => { setSecili(null); setYorumAcik(false); }} className="h-8 rounded-full px-3 text-[12px] text-white/55 hover:text-white">Vazgeç</button>
                      <button type="button" disabled={!yorum.trim()} onClick={() => { yorumla(secili.metin, yorum.trim()); setSecili(null); setYorumAcik(false); kapat(); }} className="inline-flex h-8 items-center gap-1 rounded-full bg-white px-3 text-[12px] font-semibold text-black disabled:opacity-40"><Check className="h-3.5 w-3.5" />Yeniden yazdır</button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </YanPanel>
  );
}
