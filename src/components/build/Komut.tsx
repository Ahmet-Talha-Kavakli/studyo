"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowUp, AudioLines, ImagePlus, ListPlus, Mic, MousePointer2, Plus, Square, X } from "lucide-react";
import { KrediJeton } from "@/components/ui/KrediHap";
import type { AjanMod } from "@/lib/build/ajan";
import { cn } from "@/lib/utils";
import { ModelSecici } from "./ModelSecici";

const yay = { type: "spring" as const, stiffness: 460, damping: 38 };
export type KomutEki = { tur: "gorsel"; url: string; ad: string };

const MODLAR: { id: AjanMod; ad: string; alt: string }[] = [
  { id: "yap", ad: "Yap", alt: "İsteği uygular, dosyaları yazar" },
  { id: "plan", ad: "Plan", alt: "Önce plan sunar, onaylarsan yapar" },
  { id: "sohbet", ad: "Sohbet", alt: "Soru sor, fikir al; dosyaya dokunmaz" },
];

/** Görseli en uzun kenarı 1600 px olacak şekilde küçültüp data URL'e çevirir. */
export async function gorselOku(f: File): Promise<KomutEki | null> {
  if (!f.type.startsWith("image/")) return null;
  const url = URL.createObjectURL(f);
  try {
    const img = await new Promise<HTMLImageElement>((ok, red) => { const i = new Image(); i.onload = () => ok(i); i.onerror = red; i.src = url; });
    const o = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * o); c.height = Math.round(img.height * o);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return { tur: "gorsel", url: c.toDataURL("image/jpeg", 0.86), ad: f.name || "görsel" };
  } catch { return null; } finally { URL.revokeObjectURL(url); }
}

type SesTanima = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: (e: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void; onend: () => void };

/**
 * Vayra Build komut kutusu (Apple buzlu cam). Mod (Yap/Plan/Sohbet), model, görsel ekleme (seç, yapıştır, sürükle),
 * sesle yazma, tahmini kredi, gönder / durdur. Seçili önizleme öğesi kutunun üstünde çip olarak görünür.
 */
export function Komut({
  deger, setDeger, gonder, mod, setMod, model, setModel, baglantilar, ekler, setEkler, tahmin, calisiyor, durdur,
  yer = "Ne değiştirmek istiyorsun?", genis, dar, oge, ogeKaldir, kilit, otomatikOdak, kuyrugaEkle, modsuz, modelYerine,
  arti, ekAlani, ustIcerik, araclar, doluMu, dosyaBirak, tusYakala, alanRef, efor, setEfor, modelAltBilgi, metinYapistir, sesKipi,
}: {
  deger: string; setDeger: (s: string) => void; gonder: () => void;
  mod: AjanMod; setMod: (m: AjanMod) => void; model: string; setModel: (m: string) => void; baglantilar?: Record<string, string | null>;
  ekler: KomutEki[]; setEkler: (e: KomutEki[]) => void; tahmin?: number; calisiyor?: boolean; durdur?: () => void;
  yer?: string; genis?: boolean; dar?: boolean; oge?: { etiket: string; metin?: string; konum?: string } | null; ogeKaldir?: () => void; kilit?: string; otomatikOdak?: boolean;
  /** Ajan çalışırken yazılanı sıraya ekler (Enter ve sıra düğmesi). */
  kuyrugaEkle?: () => void;
  /** Genel sohbette Yap/Plan/Sohbet seçicisi gizlenir. */
  modsuz?: boolean;
  /** Model seçicinin yerine gösterilecek öğe (ör. ajan sohbetinde ajanın adı; model ajandan gelir). */
  modelYerine?: React.ReactNode;
  /* ── İsteğe bağlı genişletmeler (genel sohbet). Verilmezse kutu eskisi gibi davranır. ── */
  /** "+" düğmesinin yerine (ör. ekler, araştırma, araçlar menüsü). */
  arti?: React.ReactNode;
  /** Yazı alanının üstündeki çip şeridine eklenecek öğeler (ekler, kip ve bahsetme çipleri). */
  ekAlani?: React.ReactNode;
  /** Kutunun hemen üstünde açılan öneri katmanı ("/" komutları, "@" bahsetmeleri). */
  ustIcerik?: React.ReactNode;
  /** Model seçicinin yanına eklenecek araçlar (izin modu, kredi). */
  araclar?: React.ReactNode;
  /** Gönderilebilir mi (ekler dışarıda tutuluyorsa). */
  doluMu?: boolean;
  /** Sürüklenen ya da yapıştırılan dosyalar (verilirse görsel dışı dosyalar da buraya gelir). */
  dosyaBirak?: (f: File[]) => void;
  /** Tuş olayı önce buraya gelir; true dönerse kutu kendi işlemini yapmaz (öneri listesinde gezinme). */
  tusYakala?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
  alanRef?: React.MutableRefObject<HTMLTextAreaElement | null>;
  /** Model seçicideki düşünme seviyesi alt menüsü. */
  efor?: "low" | "medium" | "high" | "max";
  setEfor?: (e: "low" | "medium" | "high" | "max") => void;
  /** Model seçici satırlarında kredi rozeti ve yetenek simgeleri. */
  modelAltBilgi?: boolean;
  /** Yapıştırılan düz metin (true dönerse kutuya yazılmaz; ör. uzun metin ek olur). */
  metinYapistir?: (metin: string) => boolean;
  /** Konuşma kipi düğmesi (kutu boşken gönder düğmesinin yanında). */
  sesKipi?: () => void;
}) {
  const alan = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (alanRef) alanRef.current = alan.current; });
  const dosya = useRef<HTMLInputElement>(null);
  const [dinliyor, setDinliyor] = useState(false);
  const [surukle, setSurukle] = useState(false);
  const tanima = useRef<SesTanima | null>(null);
  const bos = doluMu !== undefined ? !doluMu : !deger.trim() && !ekler.length;

  useEffect(() => { if (otomatikOdak) alan.current?.focus(); }, [otomatikOdak]);
  useEffect(() => {
    const t = alan.current;
    if (!t) return;
    t.style.height = "0px";
    t.style.height = `${Math.min(t.scrollHeight, genis ? 280 : 220)}px`;
  }, [deger, genis]);

  const ekle = async (l: FileList | File[]) => {
    if (dosyaBirak) { dosyaBirak([...l]); return; }
    const yeni = (await Promise.all([...l].slice(0, 4).map(gorselOku))).filter(Boolean) as KomutEki[];
    if (yeni.length) setEkler([...ekler, ...yeni].slice(0, 4));
  };

  const sesAc = () => {
    const S = (window as unknown as { SpeechRecognition?: new () => SesTanima; webkitSpeechRecognition?: new () => SesTanima }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: new () => SesTanima }).webkitSpeechRecognition;
    if (!S) return;
    if (dinliyor) { tanima.current?.stop(); return; }
    const r = new S();
    r.lang = "tr-TR"; r.interimResults = true; r.continuous = true;
    const bas = deger ? `${deger.trimEnd()} ` : "";
    r.onresult = (e) => {
      let s = "";
      for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript;
      setDeger(bas + s);
    };
    r.onend = () => setDinliyor(false);
    tanima.current = r;
    r.start();
    setDinliyor(true);
  };

  return (
    <div
      onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setSurukle(true); } }}
      onDragLeave={() => setSurukle(false)}
      onDrop={(e) => { e.preventDefault(); setSurukle(false); ekle(e.dataTransfer.files); }}
      className={cn("cam-istemci relative rounded-[26px] p-2.5 transition-[box-shadow]", genis && "p-3", surukle && "ring-2 ring-inset ring-white/60")}>
      {ustIcerik}
      {(oge || ekler.length > 0 || !!ekAlani) && (
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5 px-1 pt-0.5">
          {oge && (
            <span className="flex h-8 max-w-full items-center gap-1.5 rounded-full bg-white/[0.08] pl-2.5 pr-1 text-[12.5px] text-white/85">
              <MousePointer2 className="h-3.5 w-3.5 shrink-0 text-white/60" />
              <span className="truncate"><span className="text-white/50">{oge.etiket}</span>{oge.metin ? ` · ${oge.metin.slice(0, 40)}` : ""}</span>
              {oge.konum && <span className="shrink-0 rounded-full bg-white/[0.08] px-2 py-0.5 font-mono text-[11px] text-white/60">{oge.konum}</span>}
              <button type="button" onClick={ogeKaldir} aria-label="Seçimi kaldır" className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/10"><X className="h-3 w-3" /></button>
            </span>
          )}
          {ekler.map((e, i) => (
            <span key={i} className="group relative h-12 w-12 overflow-hidden rounded-[12px] ring-1 ring-inset ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.url} alt={e.ad} className="h-full w-full object-cover" />
              <button type="button" onClick={() => setEkler(ekler.filter((_, j) => j !== i))} aria-label="Görseli kaldır" className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100"><X className="h-3 w-3" /></button>
            </span>
          ))}
          {ekAlani}
        </div>
      )}
      <textarea
        ref={alan}
        value={deger}
        onChange={(e) => setDeger(e.target.value)}
        onPaste={(e) => { const f = [...e.clipboardData.files].filter((x) => dosyaBirak || x.type.startsWith("image/")); if (f.length) { e.preventDefault(); ekle(f); return; } if (metinYapistir?.(e.clipboardData.getData("text/plain"))) e.preventDefault(); }}
        onKeyDown={(e) => { if (tusYakala?.(e)) return; if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (bos || kilit) return; if (calisiyor) kuyrugaEkle?.(); else gonder(); } }}
        placeholder={yer}
        rows={1}
        className={cn("block w-full resize-none bg-transparent px-2.5 pt-1.5 text-white outline-none placeholder:text-white/40", genis ? "min-h-[64px] text-[16px] leading-[1.5]" : "min-h-[44px] text-[14.5px] leading-[1.5]")}
      />
      <div className="mt-1 flex items-center gap-1.5">
        {arti ?? <>
          <input ref={dosya} type="file" accept={dosyaBirak ? "image/*,.pdf,.txt,.md,.csv,.json,.html,.css,.js,.xml" : "image/*"} multiple hidden onChange={(e) => { if (e.target.files) ekle(e.target.files); e.target.value = ""; }} />
          <button type="button" onClick={() => dosya.current?.click()} title="Görsel ekle (ekran görüntüsü, tasarım, eskiz)" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white/80 transition-colors hover:bg-white/[0.12] hover:text-white">
            {ekler.length ? <ImagePlus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        </>}
        {!modsuz && <LayoutGroup id={`mod-${genis ? "g" : "d"}`}>
          <div className="flex shrink-0 rounded-full bg-white/[0.06] p-0.5">
            {MODLAR.map((m) => (
              <button key={m.id} type="button" title={m.alt} onClick={() => setMod(m.id)} className={cn("relative h-8 rounded-full px-3 text-[12.5px] font-semibold transition-colors", mod === m.id ? "text-black" : "text-white/60 hover:text-white", dar && "px-2.5")}>
                {mod === m.id && <motion.span layoutId={`mz-${genis ? "g" : "d"}`} transition={yay} className="absolute inset-0 rounded-full bg-white" />}
                <span className="relative">{m.ad}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>}
        {modelYerine ?? <ModelSecici deger={model} sec={setModel} baglantilar={baglantilar} dar={dar} efor={efor} setEfor={setEfor} ayrinti={modelAltBilgi} />}
        {araclar}
        <span className="ml-auto" />
        {tahmin != null && !calisiyor && (
          <span title="Tahmini maliyet; gerçek maliyet tur sonunda yazar. Hata düzeltmeleri ücretsiz." className="flex items-center gap-1 whitespace-nowrap text-[12px] text-white/45">
            {!dar && "Tahmini "}<KrediJeton boyut={11} />{tahmin.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}{!dar && " kredi"}
          </span>
        )}
        <button type="button" onClick={sesAc} title={dinliyor ? "Dinlemeyi bitir" : "Sesle yaz"} className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors", dinliyor ? "bg-white/[0.12] text-white" : "text-white/60 hover:bg-white/[0.06] hover:text-white")}>
          {dinliyor && <span className="absolute inset-0 animate-ping rounded-full bg-white/10" />}
          <Mic className="relative h-4 w-4" />
        </button>
        {sesKipi && bos && !calisiyor && (
          <button type="button" onClick={sesKipi} title="Konuşma kipi" aria-label="Konuşma kipi" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-white transition-colors hover:bg-white/[0.16]"><AudioLines className="h-4 w-4" /></button>
        )}
        <AnimatePresence mode="popLayout" initial={false}>
          {calisiyor && kuyrugaEkle && !bos && (
            <motion.button key="sira" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} type="button" onClick={kuyrugaEkle} title="Sıraya ekle (Enter)" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.12] text-white hover:bg-white/[0.18]">
              <ListPlus className="h-4 w-4" />
            </motion.button>
          )}
          {calisiyor ? (
            <motion.button key="dur" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} type="button" onClick={durdur} title="Durdur" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black">
              <Square className="h-3.5 w-3.5 fill-current" />
            </motion.button>
          ) : (
            <motion.button key="gonder" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} type="button" onClick={gonder} disabled={bos || !!kilit} title={kilit ?? "Gönder (Enter)"} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black transition-opacity disabled:opacity-30">
              <ArrowUp className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
