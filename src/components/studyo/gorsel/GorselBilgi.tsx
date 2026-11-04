"use client";

/* Görsel görüntüleyicinin Bilgi sekmesi — Görsel stüdyosu ve Kitaplık aynı paneli kullanır. */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Ban, CalendarClock, ChevronDown, ChevronRight, Coins, Copy, Cpu, Gem, LayoutGrid, Maximize, Ruler, Sprout, Download, Heart, ImagePlus, Info, Lightbulb, MoreHorizontal, Palette, RefreshCw, Share2, Shuffle, Trash2, UserSquare, Video as VideoIcon, Wand2,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { Yuzen } from "@/components/ui/Yuzen";
import { kopyala } from "@/lib/gercekEylem";
import { cn, saltUrl } from "@/lib/utils";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import type { Uretim } from "@/store/useProjeler";

const krediYaz = (k: number) => (Number.isInteger(k) ? String(k) : k.toFixed(2).replace(/\.?0+$/, "").replace(".", ","));

export function InfoSekmesi({
  url, uretim, prompt, onIndir, onYenidenUret, onElement, onAyarlariYukle, onRemix, onAnimate, onReferans, begenili, onBegen, onSil, kaynak, ek,
}: {
  /** Kaynak kartının yerine ya da yanına eklenen kart (ör. sürüm geçmişi). */
  ek?: React.ReactNode;
  /** Remix: görseli referans, istemini düzenlenebilir olarak composer'a yükler. */
  onRemix?: () => void;
  /** Bu görsel bir düzenlemenin sonucuysa kaynağı (tıklayınca kaynak açılır). */
  kaynak?: { url: string; ad: string; ac: () => void };
  url: string | null; uretim?: Uretim; prompt: string;
  onIndir: () => void; onYenidenUret?: () => void; onElement: () => void;
  /** "Bu ayarlarla üret" — üretimin model/oran/istem/referansını composer'a yükler. */
  onAyarlariYukle?: () => void;
  onAnimate: () => void; onReferans: () => void;
  begenili: boolean; onBegen?: () => void; onSil?: () => void;
}) {
  const [genis, setGenis] = useState(false);
  const [dahaAcik, setDahaAcik] = useState(false);
  const [detayAcik, setDetayAcik] = useState(true);
  // Piksel boyutu görselin kendisinden ölçülür.
  const [piksel, setPiksel] = useState<string | null>(null);
  useEffect(() => {
    setPiksel(null);
    const kaynak = url ? (saltUrl(url) ?? url) : "";
    if (!/^(data:|https?:|\/)/.test(kaynak)) return;
    const img = new Image();
    img.onload = () => setPiksel(`${img.naturalWidth} × ${img.naturalHeight}`);
    img.src = kaynak;
  }, [url]);

  const gorseliPaylas = async () => {
    if (!url) return;
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    const mutlak = url.startsWith("http") || url.startsWith("data:")
      ? url
      : typeof location !== "undefined" ? new URL(url, location.origin).href : url;
    try {
      if (nav?.canShare && nav.share) {
        const yanit = await fetch(mutlak);
        const blob = await yanit.blob();
        const dosya = new File([blob], "vayra-gorsel.png", { type: blob.type || "image/png" });
        if (nav.canShare({ files: [dosya] })) {
          await nav.share({ files: [dosya], title: "Vayra görseli", text: prompt.slice(0, 120) || undefined });
          return;
        }
      }
      if (nav?.share && !mutlak.startsWith("data:")) { await nav.share({ title: "Vayra görseli", url: mutlak }); return; }
      throw new Error("paylaşım yok");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (mutlak.startsWith("data:")) { toast.info("Bu görselin paylaşım bağlantısı yok", { description: "Görseli indirip istediğin yerde paylaşabilirsin." }); return; }
      await kopyala(mutlak, "Görsel bağlantısı kopyalandı", "Paylaşmak için yapıştırman yeterli.");
    }
  };
  const kisa = prompt.length > 160 ? prompt.slice(0, 160) + "…" : prompt;
  const m = uretim?.meta;
  const tarih = uretim ? new Date(uretim.olusturma).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null;
  const satirlar: [string, string][] = uretim ? [
    ["Model", m?.cozulenModel ? `${uretim.model} → ${m.cozulenModel}` : uretim.model],
    ...(m?.apiModel ? [["Sağlayıcı modeli", m.apiModel] as [string, string]] : []),
    ...(m?.oran && uretim.gercek !== false ? [["Oran", m.oran] as [string, string]] : []),
    ...(m?.cozunurluk && uretim.gercek !== false ? [["Çözünürlük", m.cozunurluk] as [string, string]] : []),
    ...(m?.kalite ? [["Kalite", m.kalite] as [string, string]] : []),
    ...(piksel ? [["Boyut", piksel] as [string, string]] : []),
    ...(Number.isInteger(m?.tohum) ? [["Tohum", String(m!.tohum)] as [string, string]] : []),
    ...(m?.negatif ? [["Kaçınılan", m.negatif] as [string, string]] : []),
    ...(m?.referanslar?.length ? [["Referans", `${m.referanslar.length} görsel${m.refRolleri?.some((r) => r !== "genel") ? ` · ${m.refRolleri.filter((r) => r !== "genel").map((r) => ({ stil: "stil", karakter: "karakter", kompozisyon: "kompozisyon", urun: "ürün" } as Record<string, string>)[r] ?? r).join(", ")}` : ""}`] as [string, string]] : []),
    ...(m?.stilAd ? [["Stil", m.stilAd] as [string, string]] : []),
    ...(m?.pano ? [["Ruh panosu", m.pano] as [string, string]] : []),
    ...(m?.palet ? [["Palet", m.palet] as [string, string]] : []),
    ["Kredi", uretim.kredi ? krediYaz(uretim.kredi) : uretim.gercek === false ? "Ücretsiz" : "Sınırsız erişim"],
    ...(tarih ? [["Oluşturma", tarih] as [string, string]] : []),
  ] : [
    ["Kaynak", "Vayra ilham galerisi"],
    ...(piksel ? [["Boyut", piksel] as [string, string]] : []),
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto p-4 [scrollbar-width:thin]">
        {uretim ? (
          /* İstem kartı: başlık + kopyala üstte, metin ortada, eylemler kartın altında iki düğme. */
          <section className="overflow-hidden rounded-[16px] bg-white/[0.035] ring-1 ring-inset ring-white/[0.07]">
            <div className="flex items-center justify-between px-3.5 pt-3">
              <span className="text-[12px] font-medium text-metin-3">İstem</span>
              {prompt && (
                <Tooltip label="İstemi kopyala" side="left">
                  <button onClick={() => { void kopyala(prompt, "İstem kopyalandı"); }} aria-label="İstemi kopyala"
                    className="-mr-1 flex h-7 w-7 items-center justify-center rounded-[8px] text-metin-3 transition-colors hover:bg-white/[0.07] hover:text-metin">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </Tooltip>
              )}
            </div>
            <div className="px-3.5 pb-3.5 pt-1.5">
              <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-metin">{prompt ? (genis ? prompt : kisa) : <span className="text-metin-3">Bu üretimin istemi kaydedilmemiş.</span>}</p>
              {prompt.length > 160 && (
                <button onClick={() => setGenis((v) => !v)} className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-metin-3 transition-colors hover:text-metin">
                  {genis ? "Daha az" : "Tümünü gör"} <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", genis && "rotate-180")} />
                </button>
              )}
              {m?.gonderilenIstem && m.gonderilenIstem.trim() !== prompt.trim() && (
                <details className="group mt-2.5 rounded-[10px] bg-black/25 px-3 py-2 text-[12px] text-metin-2">
                  <summary className="flex cursor-pointer select-none list-none items-center gap-1.5 text-metin-3 hover:text-metin">
                    <ChevronDown className="h-3.5 w-3.5 -rotate-90 transition-transform group-open:rotate-0" />Modele giden istem
                  </summary>
                  <p className="mt-1.5 whitespace-pre-wrap break-words leading-relaxed">{m.gonderilenIstem}</p>
                </details>
              )}
            </div>
            {(onRemix || onAyarlariYukle) && (
              <div className={cn("grid gap-1.5 border-t border-white/[0.06] p-1.5", onRemix && onAyarlariYukle && "grid-cols-2")}>
                {onRemix && (
                  <button onClick={onRemix} title="Görseli referans al, istemi değiştirip yeniden üret"
                    className="flex h-9 items-center justify-center gap-1.5 rounded-[11px] text-[13px] font-medium text-metin-2 transition-colors hover:bg-white/[0.06] hover:text-metin">
                    <Shuffle className="h-3.5 w-3.5" />Remix
                  </button>
                )}
                {onAyarlariYukle && (
                  <button onClick={onAyarlariYukle} title="Model, oran, istem ve referansları üretim kutusuna yükle"
                    className="flex h-9 items-center justify-center gap-1.5 rounded-[11px] bg-white text-[13px] font-semibold text-black transition active:scale-[0.98]">
                    <Wand2 className="h-3.5 w-3.5" />Bu ayarlarla üret
                  </button>
                )}
              </div>
            )}
          </section>
        ) : (
          <div className="panel-ic rounded-[14px] p-3.5">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-metin"><Lightbulb className="h-4 w-4 text-metin-2" /> Örnek görsel</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-metin-2">Bu görsel ilham galerisinden. Benzerini üretmek için referans olarak ekle, istemini yaz ve üret.</p>
            <button onClick={onReferans} className="hf-btn mt-3 flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-white py-2 text-[13px] font-semibold text-zemin">
              <ImagePlus className="h-3.5 w-3.5" /> Referans olarak ekle
            </button>
          </div>
        )}

        {ek}
        {kaynak && !ek && (
          <button onClick={kaynak.ac} className="panel-ic flex w-full items-center gap-3 rounded-[14px] p-2.5 text-left transition-colors hover:bg-white/[0.06]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={kaynak.url} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] text-metin-2">Kaynak görsel</span>
              <span className="block truncate text-[13px] text-metin">{kaynak.ad}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-metin-3" />
          </button>
        )}

        <section className="overflow-hidden rounded-[16px] ring-1 ring-inset ring-white/[0.07]" style={{ background: "rgba(255,255,255,0.035)" }}>
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5 text-[13px] font-semibold text-metin"><Info className="h-4 w-4 text-metin-2" />Ayrıntılar</div>
          <dl className="divide-y divide-white/[0.05]">
            {satirlar.map(([k, v]) => (
              <div key={k} className="flex items-center gap-3 px-3.5 py-2.5">
                <dt className="flex shrink-0 items-center gap-2.5 text-[13px] text-metin-3">{k === "Model" && uretim ? <span className="flex h-5 w-5 items-center justify-center"><ModelLogo ad={uretim.model} boyut={16} /></span> : <DetayIkon k={k} v={v} />}{k}</dt>
                <dd className="min-w-0 flex-1 break-words text-right text-[13px] font-medium tabular-nums text-metin">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="shrink-0 space-y-2 border-t border-white/[0.06] p-3">
        <button onClick={onAnimate} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white text-[14px] font-semibold text-black transition active:scale-[0.98]">
          <VideoIcon className="h-4 w-4" /> Videoya çevir
        </button>
        <div className="flex items-center justify-between gap-1.5">
          {onYenidenUret && <Tooltip label="Yeniden üret" side="top"><IkonAksiyon ikon={RefreshCw} etiket="Yeniden üret" onClick={onYenidenUret} /></Tooltip>}
          {uretim && <Tooltip label="Referans olarak ekle" side="top"><IkonAksiyon ikon={ImagePlus} etiket="Referans olarak ekle" onClick={onReferans} /></Tooltip>}
          <Tooltip label="İndir" side="top"><IkonAksiyon ikon={Download} etiket="İndir" onClick={onIndir} /></Tooltip>
          {onBegen && <Tooltip label={begenili ? "Beğeniyi kaldır" : "Beğen"} side="top"><IkonAksiyon ikon={Heart} etiket={begenili ? "Beğeniyi kaldır" : "Beğen"} onClick={onBegen} aktif={begenili} /></Tooltip>}
          <Tooltip label="Paylaş" side="top"><IkonAksiyon ikon={Share2} etiket="Paylaş" onClick={() => void gorseliPaylas()} /></Tooltip>
          <div className="relative">
            <IkonAksiyon ikon={MoreHorizontal} etiket="Daha fazla" onClick={() => setDahaAcik((v) => !v)} />
            <AnimatePresence>
              <Yuzen acik={!!(dahaAcik)} onKapat={() => setDahaAcik(false)} alt={44} sag={0} bosluk={0}><motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    className="menu-surface w-48 overflow-hidden rounded-xl p-1">
                    {[
                      { ad: "Element oluştur", ik: UserSquare, fn: onElement, tehlike: false },
                      ...(onSil ? [{ ad: "Sil", ik: Trash2, fn: onSil, tehlike: true }] : []),
                    ].map((o) => (
                      <button key={o.ad} onClick={() => { o.fn(); setDahaAcik(false); }}
                        className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors hover:bg-white/8", o.tehlike ? "text-rose-400" : "text-metin")}>
                        <o.ik className="h-3.5 w-3.5" /> {o.ad}
                      </button>
                    ))}
                  </motion.div></Yuzen>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Ayrıntı karosunun simgesi; oran için gerçek en-boy şekli çizilir. */
function DetayIkon({ k, v }: { k: string; v: string }) {
  const kutu = "flex h-5 w-5 shrink-0 items-center justify-center text-metin-2";
  if (k.endsWith("ran")) {
    const [a, b] = v.split(":").map(Number);
    const en = a && b ? (a >= b ? 13 : Math.max(6, Math.round((13 * a) / b))) : 11;
    const boy = a && b ? (b >= a ? 13 : Math.max(6, Math.round((13 * b) / a))) : 11;
    return <span className={kutu}><span className="rounded-[3px] border-[1.5px] border-current" style={{ width: en, height: boy }} /></span>;
  }
  const I = ({ "Sağlayıcı modeli": Cpu, "Çözünürlük": Maximize, "İstenen çözünürlük": Maximize, Kalite: Gem, Boyut: Ruler, Tohum: Sprout, "Kaçınılan": Ban, Referans: ImagePlus, Stil: Palette, "Ruh panosu": LayoutGrid, Palet: Palette, Kredi: Coins, "Oluşturma": CalendarClock, Kaynak: Lightbulb } as Record<string, typeof Info>)[k] ?? Info;
  return <span className={kutu}><I className="h-4 w-4" /></span>;
}

/** Lightbox alt satırdaki kare ikon aksiyonu (Higgsfield birebir). */
function IkonAksiyon({ ikon: Ikon, etiket, onClick, aktifSinif = "hover:text-metin", aktif }: { ikon: typeof Heart; etiket: string; onClick: () => void; aktifSinif?: string; aktif?: boolean }) {
  return (
    <button onClick={onClick} aria-label={etiket} aria-pressed={aktif}
      className={cn("flex h-10 w-[52px] items-center justify-center rounded-full bg-white/[0.085] transition-colors hover:bg-white/[0.14] active:scale-95", aktif ? "text-rose-400" : "text-metin-2", aktifSinif)}>
      <Ikon className={cn("h-4 w-4", aktif && "fill-current")} />
    </button>
  );
}