"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlignLeft, ArrowUp, BookOpenText, Check, ChevronLeft, ChevronRight, Copy, Download, FileText, Loader2, Minimize2, Maximize2, Pencil, Presentation, Sparkles, SpellCheck, Square, Wand2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { Yuzen } from "@/components/ui/Yuzen";
import { bosYanit, olayUygula, sohbetAkisi, SC_VARSAYILAN_MODEL } from "@/lib/scSohbet";
import { mdIndir, pdfYazdir, wordIndir } from "@/lib/scIndir";
import { Markdown } from "./Markdown";
import { Sunum } from "./Sunum";
import { Ipucu } from "./Ipucu";

/**
 * Belge paneli (ChatGPT Canvas / Claude belge artifact'i karşılığı): uzun bir yanıtı yan panelde
 * belge olarak açar. Okuma ve düzenleme modu, sürümler, seçili kısmı düzenletme ve hazır eylemler
 * (kısalt, uzat, ton, okuma seviyesi, son rötuş). Düzenlemeler modelle yapılır, her biri yeni sürüm olur.
 */
export type ScBelge = { baslik: string; surumler: string[]; aktif: number };

const EYLEMLER: { ad: string; ikon: typeof Wand2; talimat: string; alt?: { ad: string; talimat: string }[] }[] = [
  { ad: "Uzunluk", ikon: AlignLeft, talimat: "", alt: [
    { ad: "Çok daha kısa", talimat: "Belgeyi yaklaşık yarı uzunluğa indir; ana fikirleri koru." },
    { ad: "Biraz kısa", talimat: "Belgeyi yaklaşık %25 kısalt; gereksiz tekrarları çıkar." },
    { ad: "Biraz uzun", talimat: "Belgeyi yaklaşık %30 uzat; örnek ve açıklama ekle." },
    { ad: "Çok daha uzun", talimat: "Belgeyi yaklaşık iki katına çıkar; bölümleri derinleştir." },
  ] },
  { ad: "Ton", ikon: Sparkles, talimat: "", alt: [
    { ad: "Resmî", talimat: "Tonu resmî ve profesyonel yap." },
    { ad: "Samimi", talimat: "Tonu samimi ve sıcak yap." },
    { ad: "İkna edici", talimat: "Tonu ikna edici yap; net faydalar ve çağrı ekle." },
    { ad: "Sade", talimat: "Dili sadeleştir; kısa cümleler ve günlük kelimeler kullan." },
  ] },
  { ad: "Okuma seviyesi", ikon: BookOpenText, talimat: "", alt: [
    { ad: "Ortaokul", talimat: "Bir ortaokul öğrencisinin anlayacağı düzeyde yeniden yaz." },
    { ad: "Lise", talimat: "Lise düzeyinde yeniden yaz." },
    { ad: "Üniversite", talimat: "Üniversite düzeyinde, terimleri koruyarak yeniden yaz." },
    { ad: "Uzman", talimat: "Alan uzmanına yönelik, teknik ve yoğun biçimde yeniden yaz." },
  ] },
  { ad: "Son rötuş", ikon: SpellCheck, talimat: "Yazım, noktalama ve akıcılık hatalarını düzelt; anlamı değiştirme. Gerekirse başlıkları ve biçimi tutarlı hale getir." },
];

export function BelgePaneli({ belge, model, onDegis, onKapat }: { belge: ScBelge; model?: string; onDegis: (b: ScBelge) => void; onKapat: () => void }) {
  const [mod, setMod] = useState<"oku" | "duzenle">("oku");
  const [taslak, setTaslak] = useState(belge.surumler[belge.aktif] ?? "");
  const [calisiyor, setCalisiyor] = useState(false);
  const [akan, setAkan] = useState<string | null>(null);
  const [altMenu, setAltMenu] = useState<number | null>(null);
  const [serbest, setSerbest] = useState("");
  const [indirAcik, setIndirAcik] = useState(false);
  const [sunum, setSunum] = useState(false);
  const [secim, setSecim] = useState<{ metin: string; x: number; y: number } | null>(null);
  const [secimTalimat, setSecimTalimat] = useState("");
  const govde = useRef<HTMLDivElement>(null);
  const kesici = useRef<AbortController | null>(null);
  const metin = belge.surumler[belge.aktif] ?? "";
  useEffect(() => { setTaslak(metin); }, [metin]);

  /* Seçili kısmı düzenlet (Canvas "seçimi düzenle"). */
  useEffect(() => {
    const el = govde.current; if (!el || mod !== "oku") return;
    const birak = () => setTimeout(() => {
      const s = window.getSelection(); const t = s?.toString().trim() ?? "";
      if (!s || s.isCollapsed || t.length < 3 || !s.rangeCount || !el.contains(s.anchorNode)) { setSecim(null); return; }
      const r = s.getRangeAt(0).getBoundingClientRect(); const k = el.getBoundingClientRect();
      setSecim({ metin: t.slice(0, 2000), x: Math.min(Math.max(r.left - k.left + r.width / 2, 170), k.width - 170), y: r.bottom - k.top + el.scrollTop + 8 });
    }, 0);
    el.addEventListener("mouseup", birak); el.addEventListener("keyup", birak);
    return () => { el.removeEventListener("mouseup", birak); el.removeEventListener("keyup", birak); };
  }, [mod]);

  const surumEkle = (yeni: string) => { const s = [...belge.surumler.slice(0, belge.aktif + 1), yeni]; onDegis({ ...belge, surumler: s, aktif: s.length - 1 }); };

  const duzenlet = async (talimat: string, kisim?: string) => {
    if (calisiyor || !metin.trim()) return;
    setCalisiyor(true); setAkan(""); setAltMenu(null); setSecim(null);
    const istek = `<belge baslik="${belge.baslik.replace(/"/g, "")}">\n${metin}\n</belge>\n\n${kisim ? `Yalnız şu kısmı değiştir, belgenin geri kalanını aynen koru:\n<kisim>\n${kisim}\n</kisim>\n\n` : ""}Görev: ${talimat}\nYalnızca düzenlenmiş belgenin TAMAMINI Markdown olarak döndür; önsöz, açıklama ya da kod bloğu çiti ekleme.`;
    const k = new AbortController(); kesici.current = k;
    let y = bosYanit(); let demo = false;
    try {
      await sohbetAkisi({ mesajlar: [{ rol: "kullanici", metin: istek }], model: model ?? SC_VARSAYILAN_MODEL, dusun: false, web: false, stil: "normal" },
        (o) => { y = olayUygula(y, o); setAkan(y.parcalar.filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("")); },
        () => { demo = true; k.abort(); }, k.signal);
    } catch { /* durduruldu ya da demo */ }
    const sonuc = y.parcalar.filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("").replace(/^```(?:markdown|md)?\n([\s\S]*?)\n```\s*$/, "$1").trim();
    setCalisiyor(false); setAkan(null); kesici.current = null;
    if (demo) { toast.warning("Model bağlı değil", { description: "Önizleme modundasın; belge düzenleme eylemleri model bağlanınca çalışır. Belgeyi elle düzenleyebilirsin." }); return; }
    if (y.durum === "hata") { toast.error("Belge düzenlenemedi", { description: `${y.hata ?? "Model yanıt vermedi."} Yeniden dene.` }); return; }
    if (sonuc && sonuc !== metin.trim()) { surumEkle(sonuc); toast.success("Yeni sürüm oluşturuldu"); }
  };

  const html = () => govde.current?.querySelector(".sc-md")?.innerHTML ?? "";
  const gosterilen = akan ?? (mod === "duzenle" ? taslak : metin);

  return (
    <div className="flex h-full flex-col bg-[#101012]">
      {/* Üst çubuk */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.06] px-3">
        <FileText className="h-4 w-4 shrink-0 text-[var(--sc-aksan)]" />
        <input value={belge.baslik} onChange={(e) => onDegis({ ...belge, baslik: e.target.value.slice(0, 80) })} aria-label="Belge başlığı" className="min-w-0 flex-1 truncate rounded-md bg-transparent px-1 py-1 text-[14.5px] font-semibold outline-none hover:bg-white/[0.04] focus:bg-white/[0.06]" />
        {belge.surumler.length > 1 && (
          <span className="flex items-center text-[12.5px] tabular-nums text-[var(--sc-metin-3)]">
            <button disabled={belge.aktif === 0 || calisiyor} onClick={() => onDegis({ ...belge, aktif: belge.aktif - 1 })} aria-label="Önceki sürüm" className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/[0.06] disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            Sürüm {belge.aktif + 1}/{belge.surumler.length}
            <button disabled={belge.aktif === belge.surumler.length - 1 || calisiyor} onClick={() => onDegis({ ...belge, aktif: belge.aktif + 1 })} aria-label="Sonraki sürüm" className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/[0.06] disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
          </span>
        )}
        <div role="radiogroup" aria-label="Görünüm" className="flex rounded-full bg-white/[0.04] p-0.5 ring-1 ring-inset ring-white/[0.08] max-sm:hidden">
          {(["oku", "duzenle"] as const).map((m) => (
            <button key={m} role="radio" aria-checked={mod === m} disabled={calisiyor} onClick={() => { if (m === "oku" && taslak !== metin) surumEkle(taslak); setMod(m); }}
              className={cn("flex h-7 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-medium", mod === m ? "bg-white/[0.1] text-[var(--sc-metin)]" : "text-[var(--sc-metin-3)] hover:text-[var(--sc-metin-2)]")}>
              {m === "oku" ? "Okuma" : <><Pencil className="h-3 w-3" />Düzenleme</>}
            </button>
          ))}
        </div>
        <Ipucu metin="Sunum olarak göster"><button onClick={() => setSunum(true)} disabled={calisiyor || !metin.trim()} aria-label="Sunum olarak göster" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)] disabled:opacity-30"><Presentation className="h-4 w-4" /></button></Ipucu>
        <Ipucu metin="Kopyala"><button onClick={() => { void navigator.clipboard.writeText(metin); toast.success("Belge kopyalandı"); }} aria-label="Kopyala" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]"><Copy className="h-4 w-4" /></button></Ipucu>
        <div className="relative">
          <Ipucu metin="İndir" kapali={indirAcik}><button onClick={() => setIndirAcik((v) => !v)} aria-expanded={indirAcik} aria-label="İndir" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]"><Download className="h-4 w-4" /></button></Ipucu>
          <AnimatePresence>
            <Yuzen acik={indirAcik} onKapat={() => setIndirAcik(false)} yerlesim="alt-sag" bosluk={6} etiket="İndir" className="rounded-[14px] border border-white/[0.09] bg-[#1a1a1d] p-1.5" style={{ width: 210 }}>
              {([["Word belgesi (.doc)", () => { wordIndir(html(), belge.baslik); toast.success("Belge indirildi", { description: "Word belgesi (.doc) indirilenler klasörüne kaydedildi." }); }], ["PDF", () => { if (!pdfYazdir(html(), belge.baslik)) mesaj.acilirPencereEngellendi(); }], ["Markdown (.md)", () => { mdIndir(metin, belge.baslik); toast.success("Belge indirildi", { description: "Markdown (.md) dosyası indirilenler klasörüne kaydedildi." }); }]] as const).map(([ad, f]) => (
                <button key={ad} onClick={() => { setIndirAcik(false); f(); }} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13.5px] hover:bg-white/[0.06]"><FileText className="h-4 w-4 text-[var(--sc-metin-2)]" />{ad}</button>
              ))}
            </Yuzen>
          </AnimatePresence>
        </div>
        {sunum && <Sunum baslik={belge.baslik} metin={metin} onKapat={() => setSunum(false)} />}
        <button onClick={onKapat} aria-label="Belgeyi kapat" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]"><X className="h-4 w-4" /></button>
      </div>

      {/* Belge */}
      <div ref={govde} className="relative min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
        <div className="mx-auto max-w-[720px] px-10 pb-40 pt-10 max-sm:px-5">
          {mod === "duzenle" && akan === null ? (
            <textarea value={taslak} onChange={(e) => setTaslak(e.target.value)} aria-label="Belgeyi düzenle" spellCheck
              className="sc-kod min-h-[70vh] w-full resize-none bg-transparent text-[14px] leading-[1.75] text-[#dfe6ee] caret-[var(--sc-aksan)] outline-none" />
          ) : <div className={cn(calisiyor && akan === "" && "opacity-40 transition-opacity")}><Markdown metin={gosterilen || metin} akiyor={akan !== null && akan !== ""} /></div>}
        </div>
        {calisiyor && (
          <div className="pointer-events-none sticky bottom-24 mx-auto flex w-fit items-center gap-2 rounded-full bg-[#1a1a1d] px-3.5 py-2 text-[13px] ring-1 ring-inset ring-white/[0.1]">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--sc-aksan)]" /><span className="sc-parilti font-medium">Belge düzenleniyor</span>
          </div>
        )}
        {/* Seçimi düzenle */}
        <AnimatePresence>
          {secim && !calisiyor && (
            <motion.form initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.stopPropagation()}
              onSubmit={(e) => { e.preventDefault(); if (secimTalimat.trim()) { void duzenlet(secimTalimat.trim(), secim.metin); setSecimTalimat(""); } }}
              style={{ left: secim.x, top: secim.y }} className="absolute z-20 flex w-[320px] -translate-x-1/2 items-center gap-1 rounded-full bg-[#1a1a1d] p-1 pl-3.5 ring-1 ring-inset ring-white/[0.14]">
              <Wand2 className="h-4 w-4 shrink-0 text-[var(--sc-aksan)]" />
              <input autoFocus value={secimTalimat} onChange={(e) => setSecimTalimat(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") setSecim(null); }} placeholder="Bu kısımda ne değişsin?" aria-label="Seçili kısım için talimat" className="h-8 min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-[var(--sc-metin-3)]" />
              <button disabled={!secimTalimat.trim()} aria-label="Uygula" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--sc-aksan)] text-[var(--sc-aksan-metin)] disabled:bg-white/[0.08] disabled:text-[var(--sc-metin-3)]"><ArrowUp className="h-4 w-4" strokeWidth={2.4} /></button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Eylem çubuğu */}
      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {EYLEMLER.map((e, i) => (
            <div key={e.ad} className="relative">
              <button disabled={calisiyor} onClick={() => (e.alt ? setAltMenu(altMenu === i ? null : i) : void duzenlet(e.talimat))} aria-expanded={e.alt ? altMenu === i : undefined}
                className={cn("flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium ring-1 ring-inset transition-colors disabled:opacity-40", altMenu === i ? "bg-white/[0.08] text-[var(--sc-metin)] ring-white/20" : "text-[var(--sc-metin-2)] ring-white/[0.1] hover:bg-white/[0.05] hover:text-[var(--sc-metin)]")}>
                <e.ikon className="h-3.5 w-3.5" />{e.ad}
              </button>
              <AnimatePresence>
                {e.alt && (
                  <Yuzen acik={altMenu === i} onKapat={() => setAltMenu(null)} yerlesim="ust-sol" bosluk={6} etiket={e.ad} className="rounded-[14px] border border-white/[0.09] bg-[#1a1a1d] p-1.5" style={{ width: 200 }}>
                    {e.alt.map((a) => <button key={a.ad} onClick={() => void duzenlet(a.talimat)} className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[13.5px] hover:bg-white/[0.06]">{a.ad.includes("kısa") ? <Minimize2 className="h-3.5 w-3.5 text-[var(--sc-metin-3)]" /> : a.ad.includes("uzun") ? <Maximize2 className="h-3.5 w-3.5 text-[var(--sc-metin-3)]" /> : <Check className="h-3.5 w-3.5 text-transparent" />}{a.ad}</button>)}
                  </Yuzen>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (serbest.trim()) { void duzenlet(serbest.trim()); setSerbest(""); } }} className="flex items-center gap-2 rounded-[16px] bg-[#1c1c1f] p-1.5 pl-3.5 ring-1 ring-inset ring-white/[0.08] focus-within:ring-white/[0.18]">
          <input value={serbest} onChange={(e) => setSerbest(e.target.value)} disabled={calisiyor} placeholder="Belgede ne değişsin? Ör. sonuna bir özet tablosu ekle" aria-label="Belge için talimat" className="h-8 min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-[var(--sc-metin-3)]" />
          {calisiyor
            ? <button type="button" onClick={() => kesici.current?.abort()} aria-label="Durdur" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--sc-metin)] text-[#111113]"><Square className="h-3 w-3 fill-current" /></button>
            : <button disabled={!serbest.trim()} aria-label="Uygula" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--sc-aksan)] text-[var(--sc-aksan-metin)] disabled:bg-white/[0.07] disabled:text-[var(--sc-metin-3)]"><ArrowUp className="h-4 w-4" strokeWidth={2.4} /></button>}
        </form>
      </div>
    </div>
  );
}
