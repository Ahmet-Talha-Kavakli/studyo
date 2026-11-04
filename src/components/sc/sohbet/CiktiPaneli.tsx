"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Check, ChevronDown, Code2, Copy, Download, Expand, Eye, ExternalLink, History, Monitor, MousePointer2, Pencil, RotateCw, Smartphone, Tablet, Type, WrapText, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Yuzen } from "@/components/ui/Yuzen";
import type { SCCikti, SCYayin } from "@/store/useSupercomputer";
import { duzenleyiciEkle, duzenlemeleriUygula, type MetinDuzenleme } from "@/lib/scDuzenleyici";
import { YayinDugmesi } from "./Yayin";
import { GorselPanel } from "./GorselPanel";

/**
 * Çıktı paneli — sağdan açılır. Site/oyun/panel: Önizleme/Kod sekmeleri, cihaz genişliği, yenile,
 * sürüm seçici, kopyala/indir/yeni sekme/tam ekran. Görsel: büyük önizleme + indir.
 */
const CIHAZ = [["masa", Monitor, "100%"], ["tablet", Tablet, "768px"], ["telefon", Smartphone, "390px"]] as const;
const YAY = { type: "spring", stiffness: 420, damping: 34 } as const;

export function indirCikti(c: SCCikti) {
  const ad = (c.ad ?? "vayra-cikti").toLocaleLowerCase("tr").replace(/[^\w-]+/g, "-").replace(/-+/g, "-");
  const a = document.createElement("a");
  if (c.html) { a.href = URL.createObjectURL(new Blob([c.html], { type: "text/html" })); a.download = `${ad}.html`; }
  else if (c.url && (c.url.startsWith("data:") || c.url.startsWith("http") || c.url.startsWith("/"))) { a.href = c.url; a.download = `${ad}.webp`; a.target = "_blank"; }
  else { toast.error("İndirilecek dosya yok", { description: "Bu çıktının indirilebilir bir dosyası bulunmuyor. Çıktıyı yeniden üretmeyi dene." }); return; }
  document.body.appendChild(a); a.click(); a.remove();
  if (a.href.startsWith("blob:")) setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast.success("Çıktı indirildi", { description: `${a.download} indirilenler klasörüne kaydedildi.` });
}

/** Kod sekmesi: satır numaralı, kaydırılabilir; satır kaydırma açılıp kapanır. "Düzenle" ile kod
 *  doğrudan değiştirilip önizlemeye uygulanır (ChatGPT Canvas / Claude artifact düzenleme gibi). */
function KodGorunumu({ kod, onKaydet }: { kod: string; onKaydet?: (yeni: string) => void }) {
  const [sar, setSar] = useState(false);
  const [duzen, setDuzen] = useState<string | null>(null);
  const satirlar = kod.split("\n");
  if (duzen !== null) {
    return (
      <div className="flex h-full flex-col bg-[#0a0d12]">
        <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/[0.06] px-3 text-[12px] text-[var(--sc-metin-3)]">
          <Pencil className="h-3.5 w-3.5 text-[var(--sc-aksan)]" /><span className="text-[var(--sc-metin-2)]">index.html düzenleniyor</span>
          <span className="flex-1" />
          <button onClick={() => setDuzen(null)} className="h-7 rounded-full px-2.5 font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]">Vazgeç</button>
          <button onClick={() => { if (duzen !== kod) onKaydet?.(duzen); setDuzen(null); }} className="h-7 rounded-full bg-[var(--sc-aksan)] px-3 font-semibold text-[var(--sc-aksan-metin)]">Kaydet ve önizle</button>
        </div>
        <textarea value={duzen} onChange={(e) => setDuzen(e.target.value)} spellCheck={false} aria-label="Kodu düzenle" autoFocus
          onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); if (duzen !== kod) onKaydet?.(duzen); setDuzen(null); } if (e.key === "Tab") { e.preventDefault(); const t = e.currentTarget, a = t.selectionStart; setDuzen(duzen.slice(0, a) + "  " + duzen.slice(t.selectionEnd)); requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = a + 2; }); } }}
          className="sc-kod min-h-0 flex-1 resize-none bg-transparent p-4 text-[12.5px] leading-[1.65] text-[#dfe6ee] caret-[var(--sc-aksan)] outline-none [scrollbar-width:thin]" />
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col bg-[#0a0d12]">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/[0.06] px-3 text-[12px] text-[var(--sc-metin-3)]">
        <span>index.html</span><span>·</span><span className="tabular-nums">{satirlar.length.toLocaleString("tr")} satır</span>
        <span className="flex-1" />
        {onKaydet && <button onClick={() => setDuzen(kod)} className="flex h-7 items-center gap-1.5 rounded-full px-2.5 font-medium text-[var(--sc-metin-2)] transition-colors hover:bg-white/[0.06] hover:text-[var(--sc-metin)]"><Pencil className="h-3.5 w-3.5" />Düzenle</button>}
        <button onClick={() => setSar((v) => !v)} aria-pressed={sar} className={cn("flex h-7 items-center gap-1.5 rounded-full px-2.5 font-medium transition-colors hover:bg-white/[0.06] hover:text-[var(--sc-metin)]", sar ? "text-[var(--sc-metin)]" : "text-[var(--sc-metin-2)]")}>
          <WrapText className="h-3.5 w-3.5" />Satırları kaydır{sar && <Check className="h-3.5 w-3.5 text-[var(--sc-aksan)]" />}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto py-3 [scrollbar-width:thin]">
        <table className="sc-kod border-collapse text-[12.5px] leading-[1.65] text-[#dfe6ee]">
          <tbody>
            {satirlar.map((s, i) => (
              <tr key={i} className="hover:bg-white/[0.03]">
                <td className="sticky left-0 select-none bg-[#0a0d12] pl-4 pr-4 text-right align-top tabular-nums text-[#4b5768]">{i + 1}</td>
                <td className={cn("pr-6 align-top", sar ? "whitespace-pre-wrap break-all" : "whitespace-pre")}>{s || " "}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type Secim = { etiket: string; metin: string; x: number; y: number };

/**
 * @param onDuzenle Elle değişiklik (kod, metin) → yeni sürüm olarak kaydedilir.
 * @param onIstek Seçili öğe için talimatı sohbete gönderir (model yeni sürüm üretir).
 */
export function CiktiPaneli({ c, surumler, onSec, onKapat, onDuzenle, onIstek, yayin, onYayin, onGorselDuzenle }: {
  c: SCCikti; surumler: SCCikti[]; onSec: (c: SCCikti) => void; onKapat: () => void; onDuzenle?: (html: string, not?: string) => void;
  onIstek?: (metin: string) => void; yayin?: SCYayin; onYayin?: (y: SCYayin | undefined) => void;
  /** Görsel: istem (+ isteğe bağlı maske data URL'i) ile yeni sürüm üret. */
  onGorselDuzenle?: (istem: string, maske?: string) => void;
}) {
  const [mod, setMod] = useState<"onizle" | "sec" | "metin">("onizle");
  const [secim, setSecim] = useState<Secim | null>(null);
  const [secimTalimat, setSecimTalimat] = useState("");
  const [duzenler, setDuzenler] = useState<MetinDuzenleme[]>([]);
  const cerceve = useRef<HTMLIFrameElement>(null);
  const kaynak = useMemo(() => (c.html ? duzenleyiciEkle(c.html) : ""), [c.html]);
  const sonSurum = surumler.length > 0 && surumler[surumler.length - 1].id === c.id;
  /* Düzenleyici betiğiyle konuşma (yalnız bu iframe'den gelen iletiler). */
  useEffect(() => {
    const dinle = (e: MessageEvent) => {
      if (e.source !== cerceve.current?.contentWindow) return;
      const d = e.data as { vy?: string } & Record<string, unknown>;
      if (d?.vy === "hazir") cerceve.current?.contentWindow?.postMessage({ vy: "mod", mod }, "*");
      else if (d?.vy === "secildi") { setSecim({ etiket: String(d.etiket), metin: String(d.metin ?? ""), x: Number(d.x), y: Number(d.y) }); setSecimTalimat(""); }
      else if (d?.vy === "duzenle") setDuzenler((l) => [...l.filter((x) => x.yol !== d.yol), { yol: String(d.yol), eski: (l.find((x) => x.yol === d.yol)?.eski ?? String(d.eski)), yeni: String(d.yeni) }]);
    };
    window.addEventListener("message", dinle); return () => window.removeEventListener("message", dinle);
  }, [mod]);
  const modAyarla = (m: typeof mod) => { setMod(m); setSecim(null); cerceve.current?.contentWindow?.postMessage({ vy: "mod", mod: m }, "*"); };
  useEffect(() => { setMod("onizle"); setSecim(null); setDuzenler([]); }, [c.id]);
  const metinKaydet = () => {
    if (!c.html || !duzenler.length || !onDuzenle) { modAyarla("onizle"); return; }
    const r = duzenlemeleriUygula(c.html, duzenler);
    if (r.uygulanan) onDuzenle(r.html, `${r.uygulanan} metin düzenlendi`);
    if (r.atlanan) toast.warning(`${r.atlanan} değişiklik uygulanamadı`, { description: "O metinler sayfanın betiğiyle üretiliyor. Değişikliği sohbetten iste." });
    setDuzenler([]); setMod("onizle");
  };
  const secimGonder = () => {
    if (!secim || !secimTalimat.trim() || !onIstek) return;
    onIstek(`Sitede seçtiğim öğeyi değiştir — <${secim.etiket}>${secim.metin ? ` "${secim.metin.slice(0, 120)}"` : ""}: ${secimTalimat.trim()}`);
    setSecim(null); setSecimTalimat(""); modAyarla("onizle");
  };
  const [sekme, setSekme] = useState<"onizleme" | "kod">("onizleme");
  const [cihaz, setCihaz] = useState<(typeof CIHAZ)[number][0]>("masa");
  const [anahtar, setAnahtar] = useState(0);
  const [surumAcik, setSurumAcik] = useState(false);
  const [kopya, setKopya] = useState(false);
  const [tam, setTam] = useState(false);
  const i = surumler.findIndex((x) => x.id === c.id);
  const site = !!c.html;
  const ikon = "flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sc-metin-2)] transition-colors hover:bg-white/[0.07] hover:text-[var(--sc-metin)]";
  const yeniSekme = () => { if (!c.html) return; const u = URL.createObjectURL(new Blob([c.html], { type: "text/html" })); window.open(u, "_blank", "noopener"); setTimeout(() => URL.revokeObjectURL(u), 10000); };
  const genislik = CIHAZ.find((x) => x[0] === cihaz)?.[2] ?? "100%";
  const bg = c.url && (c.url.startsWith("data:") || c.url.startsWith("http") || c.url.startsWith("/")) ? `url("${c.url}") center/contain no-repeat` : c.url;

  const icerik = (
    <div className="flex h-full flex-col bg-[#131820]">
      <div className="flex h-14 shrink-0 items-center gap-1.5 border-b border-white/[0.06] px-3">
        <div className="relative min-w-0">
          <button onClick={() => surumler.length > 1 && setSurumAcik((v) => !v)} className={cn("flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-left", surumler.length > 1 && "hover:bg-white/[0.06]")}>
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-semibold text-[var(--sc-metin)]">{c.ad}</span>
              <span className="block truncate text-[11.5px] text-[var(--sc-metin-3)]">{site ? "HTML · çalışan önizleme" : c.demo ? "Görsel · demo örneği" : "Görsel"}{surumler.length > 1 ? ` · Sürüm ${i + 1}/${surumler.length}` : ""}</span>
            </span>
            {surumler.length > 1 && <ChevronDown className="h-4 w-4 shrink-0 text-[var(--sc-metin-3)]" />}
          </button>
          <AnimatePresence>
            <Yuzen acik={surumAcik} onKapat={() => setSurumAcik(false)} yerlesim="alt-sol" bosluk={6} etiket="Sürümler" className="rounded-[14px] border border-white/[0.09] bg-[#18181b] p-1.5" style={{ width: 240 }}>
              {surumler.map((s, k) => (
                <button key={s.id} onClick={() => { onSec(s); setSurumAcik(false); }} className={cn("flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[13px]", s.id === c.id ? "bg-white/[0.07] text-[var(--sc-metin)]" : "text-[var(--sc-metin-2)] hover:bg-white/[0.05]")}>
                  <span className="w-14 shrink-0 text-[12px] text-[var(--sc-metin-3)]">Sürüm {k + 1}</span><span className="min-w-0 flex-1 truncate">{s.ad}</span>{yayin?.ciktiId === s.id && <span className="rounded-full bg-emerald-400/12 px-1.5 text-[10.5px] text-emerald-300">Yayında</span>}{s.id === c.id && <Check className="h-4 w-4 text-[var(--sc-aksan)]" />}
                </button>
              ))}
              {!sonSurum && onDuzenle && c.html && (
                <>
                  <div className="mx-1 my-1 h-px bg-white/[0.07]" />
                  <button onClick={() => { onDuzenle(c.html!, `Sürüm ${i + 1} geri yüklendi`); setSurumAcik(false); }} className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[13px] text-[var(--sc-metin)] hover:bg-white/[0.05]"><History className="h-4 w-4 text-[var(--sc-metin-2)]" />Bu sürümü geri yükle</button>
                </>
              )}
            </Yuzen>
          </AnimatePresence>
        </div>
        <span className="flex-1" />
        {site && (
          <div role="tablist" className="flex rounded-full bg-white/[0.05] p-[3px]">
            {([["onizleme", "Önizleme", Eye], ["kod", "Kod", Code2]] as const).map(([id, ad, I]) => (
              <button key={id} role="tab" aria-selected={sekme === id} onClick={() => setSekme(id)} className={cn("relative flex h-7 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium", sekme === id ? "text-[var(--sc-metin)]" : "text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]")}>
                {sekme === id && <motion.span layoutId="sc-panel-sekme" transition={YAY} className="absolute inset-0 rounded-full bg-white/[0.1]" />}<I className="relative h-3.5 w-3.5" /><span className="relative max-sm:sr-only">{ad}</span>
              </button>
            ))}
          </div>
        )}
        {site && onYayin && <YayinDugmesi c={c} yayin={yayin} onDegis={onYayin} />}
        <button onClick={() => setTam((v) => !v)} aria-label={tam ? "Küçült" : "Tam ekran"} title={tam ? "Küçült" : "Tam ekran"} className={ikon}><Expand className="h-4 w-4" /></button>
        <button onClick={onKapat} aria-label="Paneli kapat" title="Kapat" className={ikon}><X className="h-4 w-4" /></button>
      </div>

      {site && sekme === "onizleme" && (
        <div className="flex h-11 shrink-0 items-center gap-1 border-b border-white/[0.06] px-3">
          {(onDuzenle || onIstek) && (
            <div role="radiogroup" aria-label="Önizleme modu" className="mr-1.5 flex rounded-full bg-white/[0.05] p-[3px]">
              {([["onizle", Eye, "Önizle", true], ["sec", MousePointer2, "Seç ve değiştir", !!onIstek], ["metin", Type, "Metni düzenle", !!onDuzenle]] as const).filter(([, , , v]) => v).map(([m, I, ad]) => (
                <button key={m} role="radio" aria-checked={mod === m} title={ad} onClick={() => (mod === "metin" && m !== "metin" && duzenler.length ? metinKaydet() : modAyarla(m))}
                  className={cn("relative flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium", mod === m ? "text-[var(--sc-metin)]" : "text-[var(--sc-metin-3)] hover:text-[var(--sc-metin)]")}>
                  {mod === m && <motion.span layoutId="sc-onizleme-mod" transition={YAY} className={cn("absolute inset-0 rounded-full", m === "onizle" ? "bg-white/[0.1]" : "bg-[var(--sc-aksan)]/20")} />}
                  <I className="relative h-3.5 w-3.5" /><span className="relative max-xl:sr-only">{m === "onizle" ? "Önizle" : m === "sec" ? "Seç" : "Metin"}</span>
                </button>
              ))}
            </div>
          )}
          {CIHAZ.map(([id, I]) => <button key={id} onClick={() => setCihaz(id)} aria-pressed={cihaz === id} title={id} className={cn(ikon, "h-7 w-7", cihaz === id && "bg-white/[0.08] text-[var(--sc-metin)]")}><I className="h-3.5 w-3.5" /></button>)}
          <button onClick={() => setAnahtar((k) => k + 1)} aria-label="Yenile" title="Yenile" className={cn(ikon, "h-7 w-7")}><RotateCw className="h-3.5 w-3.5" /></button>
          <span className="mx-2 flex h-7 min-w-0 flex-1 items-center rounded-full bg-white/[0.04] px-3 text-[12px] text-[var(--sc-metin-3)]"><span className="truncate">{(c.ad ?? "site").split("·")[0].trim().toLocaleLowerCase("tr").replace(/\s+/g, "-")}.vayra.app</span></span>
          <button onClick={yeniSekme} className="flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]"><ExternalLink className="h-3.5 w-3.5" /><span className="max-sm:sr-only">Yeni sekme</span></button>
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {site ? (sekme === "onizleme" ? (
          <div className="flex h-full justify-center overflow-auto bg-[#0a0d12] p-0">
            <motion.iframe ref={cerceve} key={anahtar + c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} srcDoc={onDuzenle || onIstek ? kaynak : c.html} title={c.ad} sandbox="allow-scripts allow-forms allow-popups"
              className={cn("h-full border-0 bg-white transition-[width] duration-300", genislik !== "100%" && "my-3 rounded-[14px]")} style={{ width: genislik, maxWidth: "100%" }} />
          </div>
        ) : null) : null}
        {site && sekme === "onizleme" && mod === "metin" && (
          <div className="absolute inset-x-3 top-3 z-10 flex items-center gap-2 rounded-[14px] bg-[#18181b]/95 px-3 py-2 text-[12.5px] ring-1 ring-inset ring-white/[0.1] backdrop-blur-md">
            <Type className="h-4 w-4 shrink-0 text-[var(--sc-aksan)]" />
            <span className="min-w-0 flex-1 text-[var(--sc-metin-2)]">{duzenler.length ? `${duzenler.length} metin değişti` : "Bir metne tıkla ve yaz; Enter ile bitir."}</span>
            <button onClick={() => { setDuzenler([]); setAnahtar((k) => k + 1); setMod("onizle"); }} className="h-7 rounded-full px-2.5 font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.06]">Vazgeç</button>
            <button onClick={metinKaydet} disabled={!duzenler.length} className="h-7 rounded-full bg-[var(--sc-aksan)] px-3 font-semibold text-[var(--sc-aksan-metin)] disabled:opacity-40">Kaydet</button>
          </div>
        )}
        {site && sekme === "onizleme" && mod === "sec" && !secim && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center"><span className="rounded-full bg-[#18181b]/95 px-3 py-1.5 text-[12.5px] text-[var(--sc-metin-2)] ring-1 ring-inset ring-white/[0.1]">Değiştirmek istediğin öğeye tıkla</span></div>
        )}
        <AnimatePresence>
          {site && sekme === "onizleme" && secim && (
            <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.15 }}
              onSubmit={(e) => { e.preventDefault(); secimGonder(); }}
              className="absolute inset-x-3 bottom-3 z-10 rounded-[16px] bg-[#18181b]/97 p-2.5 ring-1 ring-inset ring-white/[0.1] backdrop-blur-md">
              <div className="flex items-center gap-2 px-1 pb-2 text-[12px] text-[var(--sc-metin-3)]">
                <span className="rounded-md bg-[var(--sc-aksan)]/15 px-1.5 py-0.5 font-mono text-[11px] text-[var(--sc-aksan)]">&lt;{secim.etiket}&gt;</span>
                <span className="min-w-0 flex-1 truncate text-[var(--sc-metin-2)]">{secim.metin || "Seçili öğe"}</span>
                <button type="button" onClick={() => setSecim(null)} aria-label="Seçimi kaldır" className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-white/[0.06]"><X className="h-3.5 w-3.5" /></button>
              </div>
              <div className="flex items-center gap-2 rounded-[12px] bg-[var(--sc-zemin)] py-1 pl-3 pr-1 ring-1 ring-inset ring-[var(--sc-kenar)] focus-within:ring-[var(--sc-aksan)]/50">
                <input autoFocus value={secimTalimat} onChange={(e) => setSecimTalimat(e.target.value)} placeholder="Bu öğede ne değişsin? Ör. daha büyük yap, rengi turuncu olsun" aria-label="Seçili öğe için talimat"
                  className="h-8 min-w-0 flex-1 bg-transparent text-[13.5px] text-[var(--sc-metin)] outline-none placeholder:text-[var(--sc-metin-3)]" />
                <button disabled={!secimTalimat.trim()} aria-label="Gönder" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--sc-aksan)] text-[var(--sc-aksan-metin)] disabled:bg-white/[0.08] disabled:text-[var(--sc-metin-3)]"><ArrowUp className="h-4 w-4" strokeWidth={2.4} /></button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
        {site && sekme === "kod" ? (
          <KodGorunumu kod={c.html ?? ""} onKaydet={onDuzenle ? (h) => { onDuzenle(h, "Kod düzenlendi"); setSekme("onizleme"); setAnahtar((k) => k + 1); } : undefined} />
        ) : !site ? (
          <GorselPanel c={c} gorseller={surumler} onSec={onSec} onDuzenle={onGorselDuzenle} kredi={4} />
        ) : null}
      </div>

      <div className="flex h-12 shrink-0 items-center gap-1 border-t border-white/[0.06] px-3">
        {site && <button onClick={() => { void navigator.clipboard.writeText(c.html ?? ""); setKopya(true); setTimeout(() => setKopya(false), 1500); }} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]">{kopya ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}{kopya ? "Kopyalandı" : "Kodu kopyala"}</button>}
        {!site && c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]"><ExternalLink className="h-3.5 w-3.5" />Yeni sekmede aç</a>}
        
        <span className="flex-1" />
        <button onClick={() => indirCikti(c)} className="flex h-8 items-center gap-1.5 rounded-full bg-[var(--sc-metin)] px-3.5 text-[12.5px] font-semibold text-[#111113]"><Download className="h-3.5 w-3.5" />İndir{site ? " (.html)" : ""}</button>
      </div>
    </div>
  );

  if (tam) return <div className="fixed inset-0 z-[350]">{icerik}</div>;
  return icerik;
}
