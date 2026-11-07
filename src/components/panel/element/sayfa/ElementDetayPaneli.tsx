"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Copy, Download, Film, ImageIcon, Loader2, Pencil, Pin, Plus, Sparkles, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { mesaj } from "@/lib/mesaj";
import { useElements, type VElement } from "@/store/useElements";
import { useProjeler } from "@/store/useProjeler";
import { DerinEgitim, useLoraTakip } from "@/components/karakter/DerinEgitim";
import { ElementKapak, MAKS_GORSEL, TUR_META, elementiCogalt, elementiIndir, elementiSil } from "../elementMeta";
import { goreliZaman } from "./ElementKart";

/**
 * Element detayı (sağdan açılan panel): büyük görsel + açılar, tarif, istatistikler, bu elementle üretilenler,
 * karakterlerde derin eğitim, "Görselde / Videoda kullan". Klavye: ← → açı, Esc kapat.
 */
export function ElementDetayPaneli({ e, onKapat, onDuzenle, onKullan }: { e: VElement; onKapat: () => void; onDuzenle: () => void; onKullan: (h: "gorsel" | "video") => void }) {
  const g = e.gorseller.filter(Boolean);
  const [i, setI] = useState(0);
  const [egitimAcik, setEgitimAcik] = useState(false);
  const [fal, setFal] = useState<boolean | null>(null);
  const m = TUR_META[e.tur]; const I = m.ikon;
  const guncelle = useElements((s) => s.guncelle);
  const uretimler = useProjeler((s) => s.uretimler);
  useLoraTakip(e);
  const ileYapilan = useMemo(() => uretimler.filter((u) => u.durum !== "hata" && ((u.meta as { elementler?: { ad: string }[] } | undefined)?.elementler ?? []).some((x) => x.ad.toLocaleLowerCase("tr") === e.ad.toLocaleLowerCase("tr"))), [uretimler, e.ad]);

  useEffect(() => { setI(0); }, [e.id]);
  useEffect(() => {
    const t = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement).closest("input,textarea")) return;
      if (ev.key === "Escape") onKapat();
      else if (ev.key === "ArrowRight" && g.length > 1) setI((x) => (x + 1) % g.length);
      else if (ev.key === "ArrowLeft" && g.length > 1) setI((x) => (x - 1 + g.length) % g.length);
    };
    window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t);
  }, [g.length, onKapat]);
  useEffect(() => { if (egitimAcik && fal === null) fetch("/api/karakter/egit").then((r) => r.json()).then((j: { hazir?: boolean }) => setFal(!!j.hazir)).catch(() => setFal(false)); }, [egitimAcik, fal]);

  const istem = `@${e.ad}`;
  return (
    <div className="fixed inset-x-0 bottom-0 top-[var(--ust-nav)] z-[250] flex justify-end" role="dialog" aria-modal="true" aria-label={istem}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/55" onClick={onKapat} />
      <motion.aside initial={{ x: 48, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 48, opacity: 0, transition: { duration: 0.15 } }} transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className="studyo-tema relative flex h-full w-full max-w-[480px] flex-col overflow-hidden border-l border-white/[0.08] bg-[#111214] text-metin">
        {/* Üst */}
        <div className="flex items-center gap-1 px-4 pb-3 pt-4">
          <h2 className="min-w-0 flex-1 truncate text-[21px] font-semibold tracking-[-0.01em]">{istem}</h2>
          {([
            [Pin, e.sabitli ? "Sabitlemeyi kaldır" : "Sabitle", () => guncelle(e.id, { sabitli: !e.sabitli }), e.sabitli],
            [Pencil, "Düzenle", onDuzenle, false],
            [Copy, "Çoğalt", () => elementiCogalt(e), false],
            [Download, "Görselleri indir", () => elementiIndir(e), false],
            [Trash2, "Sil", () => { elementiSil(e); onKapat(); }, false],
          ] as const).map(([C, a, f, aktif]) => (
            <button key={a} onClick={f} aria-label={a} title={a} aria-pressed={a.startsWith("Sabit") ? !!aktif : undefined}
              className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors", aktif ? "text-aksan" : a === "Sil" ? "text-metin-2 hover:bg-rose-500/10 hover:text-rose-300" : "text-metin-2 hover:bg-white/[0.075] hover:text-metin")}>
              <C className={cn("h-4 w-4", aktif && "fill-current")} />
            </button>
          ))}
          <button onClick={onKapat} aria-label="Kapat" className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.075] text-metin-2 hover:text-metin"><X className="h-4 w-4" /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-5 [scrollbar-width:thin]">
          {/* Görsel + açılar */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-black">
            {g.length ? (
              <AnimatePresence mode="wait">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <motion.img key={g[i]} src={g[Math.min(i, g.length - 1)]} alt={m.yuvalar[i] ?? ""} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="absolute inset-0 h-full w-full object-cover" />
              </AnimatePresence>
            ) : <ElementKapak e={e} className="absolute inset-0" ikonBoyut={64} />}
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold backdrop-blur-md" style={{ background: `color-mix(in srgb, ${m.hex} 24%, rgba(0,0,0,0.55))`, color: m.hex }}><I className="h-3 w-3" />{m.ad}</span>
              {e.lora?.durum === "hazir" && <span className="flex items-center gap-1 rounded-full bg-aksan/90 px-2 py-0.5 text-[11.5px] font-semibold text-[#06222b]"><Sparkles className="h-3 w-3" />Eğitildi</span>}
              {(e.lora?.durum === "egitiliyor" || e.lora?.durum === "sirada") && <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11.5px] text-white backdrop-blur-md"><Loader2 className="h-3 w-3 animate-spin" />Eğitiliyor</span>}
            </div>
            {g.length > 1 && <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2 py-0.5 text-[11.5px] text-white/90 backdrop-blur-md">{m.yuvalar[i] ?? `Görsel ${i + 1}`} · {i + 1}/{g.length}</span>}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {m.yuvalar.map((ad, k) => g[k] ? (
              <button key={ad} onClick={() => setI(k)} aria-label={ad} className={cn("relative aspect-square overflow-hidden rounded-[12px] outline outline-2 -outline-offset-2 transition", k === i ? "outline-white" : "opacity-75 outline-transparent hover:opacity-100")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g[k]} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent pb-1 pt-3 text-center text-[10.5px] font-medium text-white">{ad}</span>
              </button>
            ) : (
              <button key={ad} onClick={onDuzenle} title={`${ad} açısı ekle`} className={cn("flex aspect-square flex-col items-center justify-center gap-1 rounded-[12px] text-[11px] ring-1 ring-inset transition", k === g.length ? "bg-white/[0.065] text-white/80 ring-white/[0.1] hover:bg-white/[0.1] hover:text-white" : "bg-white/[0.035] text-white/35 ring-white/[0.05]")}>
                <Plus className="h-4 w-4" />{ad}
              </button>
            ))}
          </div>

          {/* Tarif */}
          <div className="rounded-[16px] bg-white/[0.045] p-3.5 ring-1 ring-inset ring-white/[0.05]">
            {e.aciklama ? <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-metin">{e.aciklama}</p> : <button onClick={onDuzenle} className="text-[13.5px] text-metin-2 hover:text-aksan"><span className="inline-flex items-center gap-1">Tarif yok. Eklemek modele ne çizeceğini daha net söyler<ArrowRight className="h-3.5 w-3.5 shrink-0" /></span></button>}
            <div className="mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-2.5 text-[12.5px] text-metin-2">
              <span className="min-w-0 flex-1 leading-snug">İstemde <b className="font-semibold text-aksan">{istem}</b> yazınca {g.length ? `${g.length} görseli ve tarifi` : "tarifi"} modele gider.</span>
              <button onClick={() => { void mesaj.kopyala(istem, "Element etiketi"); }} className="flex h-7 shrink-0 items-center gap-1 rounded-full px-2 text-[12px] text-metin-2 ring-1 ring-inset ring-white/[0.08] hover:text-metin"><Copy className="h-3 w-3" />{istem}</button>
            </div>
          </div>

          <dl className="grid grid-cols-3 divide-x divide-white/[0.06] rounded-[16px] bg-white/[0.045] py-3 text-center ring-1 ring-inset ring-white/[0.05]">
            {[["Üretim", e.kullanim ? String(e.kullanim) : "Henüz yok"], ["Son kullanım", e.sonKullanim ? goreliZaman(e.sonKullanim) : "Henüz yok"], ["Eklendi", goreliZaman(e.olusturma).replace(/^şimdi$/, "az önce")]].map(([a, v]) => (
              <div key={a} className="min-w-0 px-2"><dt className="text-[11.5px] text-metin-3">{a}</dt><dd className="mt-0.5 truncate text-[14px] font-semibold tabular-nums">{v}</dd></div>
            ))}
          </dl>

          {/* Bu elementle üretilenler */}
          <section>
            <div className="mb-2 flex items-center gap-1.5">
              <h3 className="text-[14px] font-semibold">Bu elementle üretilenler</h3>
              {ileYapilan.length > 0 && <span className="rounded-full bg-white/[0.075] px-1.5 py-0.5 text-[11px] tabular-nums text-metin-2">{ileYapilan.length}</span>}
              <span className="flex-1" />
            </div>
            {ileYapilan.length ? (
              <div className="grid grid-cols-4 gap-1.5">
                {ileYapilan.slice(0, 12).map((u) => {
                  const kapak = u.gorselUrl && /^(\/|data:image|https?:)/.test(u.gorselUrl) ? u.gorselUrl : undefined;
                  return (
                    <a key={u.id} href={`/panel/kitaplik?u=${u.id}`} title={u.baslik} className="group relative block aspect-square overflow-hidden rounded-[11px] bg-white/[0.055]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {kapak ? <img src={kapak} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" /> : <span className="absolute inset-0" style={{ background: u.gorselUrl ?? "#1a1b1f" }} />}
                      {u.tur === "video" && <span className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60"><Film className="h-2.5 w-2.5 text-white" /></span>}
                      {u.durum !== "tamam" && <span className="absolute inset-0 flex items-center justify-center bg-black/45"><Loader2 className="h-4 w-4 animate-spin text-white" /></span>}
                      
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-[14px] bg-white/[0.025] p-3 ring-1 ring-inset ring-white/[0.05]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-white"><Sparkles className="h-4 w-4" /></span>
                <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-metin-2">Henüz bu elementle üretim yok. İlk sahneyi üret; burada birikir.</p>
              </div>
            )}
          </section>

          {/* Derin eğitim (yalnız karakter) */}
          {e.tur === "karakter" && (
            <section className="overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.06]">
              <button onClick={() => setEgitimAcik((v) => !v)} aria-expanded={egitimAcik} className="flex w-full items-center gap-3 p-3.5 text-left hover:bg-white/[0.025]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-white">{e.lora?.durum === "hazir" ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold">Derin eğitim</span>
                  <span className="block text-[12px] leading-snug text-metin-2">{e.lora?.durum === "hazir" ? `Hazır · tetik kelime ${e.lora.tetik}` : e.lora?.durum === "egitiliyor" || e.lora?.durum === "sirada" ? "Eğitiliyor; bitince otomatik kullanılır" : fal === false ? "Sağlayıcı bağlanınca açılır" : "5+ fotoğrafla yüzü kalıcı öğret; en tutarlı sonuç"}</span>
                </span>
                <ChevronDown className={cn("h-4 w-4 text-metin-3 transition-transform", egitimAcik && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {egitimAcik && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/[0.06] p-3.5"><DerinEgitim e={e} fal={fal} gomulu /></motion.div>}
              </AnimatePresence>
            </section>
          )}
        </div>

        {/* Kullan */}
        <div className="grid grid-cols-2 gap-2 border-t border-white/[0.06] p-4">
          <button onClick={() => onKullan("gorsel")} className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-white text-[14px] font-semibold text-black transition hover:bg-white/90"><ImageIcon className="h-4 w-4" />Görselde kullan</button>
          <button onClick={() => onKullan("video")} className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-white/[0.085] text-[14px] font-medium ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.1]"><Film className="h-4 w-4" />Videoda kullan</button>
        </div>
      </motion.aside>
    </div>
  );
}
