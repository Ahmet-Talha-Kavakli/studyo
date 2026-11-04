"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Maximize, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { Markdown } from "./Markdown";

/**
 * Belgeden sunum (Gamma / ChatGPT Canvas "slides" karşılığı): "---" ayraçlarına, yoksa # / ## başlıklarına göre
 * slaytlara bölünür. Ok tuşları / boşluk / tıklama ile ilerler, tam ekran açılır, PDF yatay sayfalarla yazdırılır.
 */
export function slaytlaraBol(baslik: string, metin: string): string[] {
  const temiz = metin.trim();
  if (/^\s*---\s*$/m.test(temiz)) return temiz.split(/^\s*---\s*$/m).map((s) => s.trim()).filter(Boolean);
  const parcalar: string[] = [];
  let simdiki: string[] = [];
  for (const satir of temiz.split("\n")) {
    if (/^#{1,2}\s/.test(satir) && simdiki.some((x) => x.trim())) { parcalar.push(simdiki.join("\n").trim()); simdiki = []; }
    simdiki.push(satir);
  }
  if (simdiki.some((x) => x.trim())) parcalar.push(simdiki.join("\n").trim());
  /* İlk parça başlıksız giriş ise kapak slaytı olur; değilse kapak eklenir. */
  if (!/^#{1,2}\s/.test(parcalar[0] ?? "")) parcalar[0] = `# ${baslik}\n\n${parcalar[0] ?? ""}`;
  else parcalar.unshift(`# ${baslik}`);
  /* Çok uzun slaytları böl (okunurluk): 14 satırdan uzun liste bloklarını ikiye ayır. */
  return parcalar.flatMap((p) => {
    const satirlar = p.split("\n");
    if (satirlar.length <= 16) return [p];
    const bas = /^#{1,3}\s/.test(satirlar[0]) ? satirlar[0] : "";
    const govde = bas ? satirlar.slice(1) : satirlar;
    const yari = Math.ceil(govde.length / 2);
    return [[bas, ...govde.slice(0, yari)].join("\n"), [bas && `${bas} (devam)`, ...govde.slice(yari)].join("\n")];
  });
}

const SLAYT_STIL = `@page{size:A4 landscape;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,sans-serif;color:#111113}
.s{width:100vw;height:100vh;padding:7vh 8vw;display:flex;flex-direction:column;justify-content:center;page-break-after:always;break-after:page;overflow:hidden}
.s:first-child h1{font-size:5.2vh}h1{font-size:4.6vh;margin:0 0 2.4vh}h2{font-size:4vh;margin:0 0 2.2vh}h3{font-size:3vh}p,li{font-size:2.5vh;line-height:1.5;color:#333}
table{border-collapse:collapse;font-size:2.1vh}td,th{border:1px solid #ddd;padding:.8vh 1.2vh;text-align:left}code{background:#f2f2f2;padding:0 .4em;border-radius:4px}
.n{position:fixed;bottom:3vh;right:4vw;font-size:1.6vh;color:#999}`;

export function Sunum({ baslik, metin, onKapat }: { baslik: string; metin: string; onKapat: () => void }) {
  const slaytlar = useMemo(() => slaytlaraBol(baslik, metin), [baslik, metin]);
  const [i, setI] = useState(0);
  const [yon, setYon] = useState(1);
  const kap = useRef<HTMLDivElement>(null);
  const gizli = useRef<HTMLDivElement>(null);
  const git = (n: number) => { const h = Math.max(0, Math.min(slaytlar.length - 1, n)); setYon(h >= i ? 1 : -1); setI(h); };

  useEffect(() => {
    const t = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) onKapat();
      else if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); git(i + 1); }
      else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); git(i - 1); }
      else if (e.key === "Home") git(0);
      else if (e.key === "End") git(slaytlar.length - 1);
    };
    window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t);
  });
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  const tamEkran = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void kap.current?.requestFullscreen?.().catch(() => toast.error("Tam ekran açılamadı", { description: "Tarayıcı tam ekrana izin vermedi. F11 ile dene." })); };
  const pdf = () => {
    const dugumler = gizli.current?.querySelectorAll<HTMLElement>("[data-slayt]");
    if (!dugumler?.length) return;
    const w = window.open("", "_blank", "width=1100,height=760");
    if (!w) { mesaj.acilirPencereEngellendi(); return; }
    const govde = [...dugumler].map((d, k) => `<section class="s">${d.innerHTML}<span class="n">${k + 1} / ${dugumler.length}</span></section>`).join("");
    w.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${baslik.replace(/</g, "&lt;")}</title><style>${SLAYT_STIL}</style></head><body>${govde}</body></html>`);
    w.document.close(); w.focus(); setTimeout(() => w.print(), 350);
  };

  return createPortal(
    <div ref={kap} role="dialog" aria-modal="true" aria-label={`${baslik} sunumu`} className="sc-kapsam fixed inset-0 z-[300] flex flex-col bg-[#07090d] text-[var(--sc-metin)]">
      <div className="flex items-center gap-2 px-4 py-3">
        <p className="min-w-0 flex-1 truncate text-[14px] text-[var(--sc-metin-2)]">{baslik}</p>
        <button onClick={pdf} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]"><Download className="h-4 w-4" /><span className="max-sm:sr-only">PDF</span></button>
        <button onClick={tamEkran} aria-label="Tam ekran" className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]"><Maximize className="h-4 w-4" /></button>
        <button onClick={onKapat} aria-label="Sunumu kapat" className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]"><X className="h-4 w-4" /></button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-10">
        <div className="relative aspect-video w-full max-w-[min(1280px,calc((100vh-150px)*16/9))] max-sm:aspect-[4/5] max-sm:max-w-full overflow-hidden rounded-[18px] bg-[#151517] ring-1 ring-inset ring-white/[0.08]">
          <AnimatePresence initial={false} custom={yon} mode="popLayout">
            <motion.div key={i} custom={yon} initial={{ opacity: 0, x: 40 * yon }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 * yon }} transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
              className={cn("sc-slayt absolute inset-0 flex flex-col overflow-y-auto px-[7%] py-[5%] [justify-content:safe_center] [scrollbar-width:none] max-sm:px-5 max-sm:py-6", i === 0 && "sc-slayt-kapak")}>
              <Markdown metin={slaytlar[i]} />
            </motion.div>
          </AnimatePresence>
          <button aria-label="Önceki slayt" onClick={() => git(i - 1)} className="absolute inset-y-0 left-0 w-1/4 cursor-w-resize" tabIndex={-1} />
          <button aria-label="Sonraki slayt" onClick={() => git(i + 1)} className="absolute inset-y-0 right-0 w-1/4 cursor-e-resize" tabIndex={-1} />
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 px-4 pb-5 pt-3">
        <button onClick={() => git(i - 1)} disabled={i === 0} aria-label="Önceki" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
        <div className="flex max-w-[60vw] items-center gap-1.5 overflow-x-auto px-1 py-1 [scrollbar-width:none]">
          {slaytlar.map((_, k) => <button key={k} onClick={() => git(k)} aria-label={`${k + 1}. slayt`} aria-current={k === i ? "step" : undefined} className={cn("h-1.5 shrink-0 rounded-full transition-all", k === i ? "w-6 bg-[var(--sc-aksan)]" : "w-1.5 bg-white/20 hover:bg-white/40")} />)}
        </div>
        <span className="min-w-[52px] text-center text-[13px] tabular-nums text-[var(--sc-metin-3)]">{i + 1} / {slaytlar.length}</span>
        <button onClick={() => git(i + 1)} disabled={i === slaytlar.length - 1} aria-label="Sonraki" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
      </div>

      {/* PDF için tüm slaytların HTML'i (görünmez). */}
      <div ref={gizli} aria-hidden className="pointer-events-none fixed -left-[9999px] top-0 w-[1000px] opacity-0">
        {slaytlar.map((s, k) => <div key={k} data-slayt><Markdown metin={s} /></div>)}
      </div>
    </div>,
    document.body,
  );
}
