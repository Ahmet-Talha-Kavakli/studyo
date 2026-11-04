"use client";

import { memo, useState } from "react";
import { Grafik, grafikCoz } from "./Grafik";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Download, Play, WrapText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScKaynak } from "@/lib/scSohbet";
import { useScTercih } from "@/store/useScTercih";

const BOYUT = { kucuk: "text-[15px] leading-[1.7]", orta: "text-[16.5px] leading-[1.75]", buyuk: "text-[18px] leading-[1.75]" } as const;

/** Bağlantının alan adı ve site ikonu. */
export const alanAdi = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };
export const favikon = (url: string) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(alanAdi(url))}&sz=32`;

const DIL_AD: Record<string, string> = { ts: "TypeScript", tsx: "TSX", js: "JavaScript", jsx: "JSX", py: "Python", python: "Python", sh: "Shell", bash: "Shell", json: "JSON", html: "HTML", css: "CSS", sql: "SQL", md: "Markdown", yaml: "YAML", yml: "YAML", go: "Go", rust: "Rust", java: "Java" };

const UZANTI: Record<string, string> = { ts: "ts", tsx: "tsx", js: "js", jsx: "jsx", py: "py", python: "py", sh: "sh", bash: "sh", json: "json", html: "html", css: "css", sql: "sql", md: "md", yaml: "yml", yml: "yml", go: "go", rust: "rs", java: "java" };
const HTML_MI = (dil: string, kod: string) => /^(html|svg)$/i.test(dil) || /^\s*(<!doctype html|<html|<svg)/i.test(kod);

function KodBlogu({ dil, kod }: { dil: string; kod: string }) {
  const [kopya, setKopya] = useState(false);
  const [sar, setSar] = useState(false);
  const [onizle, setOnizle] = useState(false);
  const indir = () => {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([kod], { type: "text/plain" }));
    a.download = `kod.${UZANTI[dil.toLowerCase()] ?? "txt"}`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  };
  return (
    <div className="group/kod my-4 overflow-hidden rounded-[14px] bg-[#0a0d12] ring-1 ring-inset ring-white/[0.08]">
      <div className="sticky top-0 z-[1] flex h-9 items-center gap-1 border-b border-white/[0.06] bg-[#0e0e10] pl-3.5 pr-1.5">
        <span className="font-sans text-[12px] font-medium text-[var(--sc-metin-2)]">{DIL_AD[dil.toLowerCase()] ?? (dil || "Metin")}</span>
        <span className="flex-1" />
        {HTML_MI(dil, kod) && <button onClick={() => setOnizle(true)} className="flex h-7 items-center gap-1.5 rounded-md px-2 font-sans text-[12px] font-medium text-[var(--sc-metin-2)] transition-colors hover:bg-white/[0.07] hover:text-[var(--sc-metin)]"><Play className="h-3.5 w-3.5" />Önizle</button>}
        <button onClick={indir} title="İndir" aria-label="Kodu indir" className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--sc-metin-2)] transition-colors hover:bg-white/[0.07] hover:text-[var(--sc-metin)]"><Download className="h-3.5 w-3.5" /></button>
        <button onClick={() => setSar((v) => !v)} aria-pressed={sar} title="Satırları kaydır" className={cn("flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/[0.07]", sar ? "text-[var(--sc-metin)]" : "text-[var(--sc-metin-2)]")}><WrapText className="h-3.5 w-3.5" /></button>
        <button onClick={() => { void navigator.clipboard.writeText(kod); setKopya(true); setTimeout(() => setKopya(false), 1800); }}
          className="flex h-7 items-center gap-1.5 rounded-md px-2 font-sans text-[12px] font-medium text-[var(--sc-metin-2)] transition-colors hover:bg-white/[0.07] hover:text-[var(--sc-metin)]">
          {kopya ? <><Check className="h-3.5 w-3.5 text-emerald-400" />Kopyalandı</> : <><Copy className="h-3.5 w-3.5" />Kopyala</>}
        </button>
      </div>
      {onizle && createPortal(
        <div className="fixed inset-0 z-[200] flex flex-col bg-black/80 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Kod önizlemesi">
          <div className="mb-2 flex items-center justify-between font-sans text-[13px] text-white/80"><span>Önizleme · kum havuzunda çalışır</span><button onClick={() => setOnizle(false)} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><X className="h-4 w-4" /></button></div>
          <iframe srcDoc={kod} title="Kod önizlemesi" sandbox="allow-scripts" className="min-h-0 flex-1 rounded-[14px] border-0 bg-white" />
        </div>,
        document.body,
      )}
      <pre className={cn("overflow-x-auto px-4 py-3.5 sc-kod text-[13px] leading-[1.65] text-[#dfe6ee] [scrollbar-width:thin]", sar && "whitespace-pre-wrap break-words")}><code>{kod}</code></pre>
    </div>
  );
}

/** Satır içi atıf: cümlenin sonunda site adlı küçük çip; üzerine gelince kaynak kartı (Claude gibi). */
function AtifCipi({ n, k }: { n: number; k?: ScKaynak }) {
  const [acik, setAcik] = useState(false);
  if (!k) return null;
  return (
    <span className="relative inline-block align-[1px]" onMouseEnter={() => setAcik(true)} onMouseLeave={() => setAcik(false)}>
      <a href={k.url} target="_blank" rel="noopener noreferrer" aria-label={`Kaynak ${n}: ${k.baslik}`} onFocus={() => setAcik(true)} onBlur={() => setAcik(false)}
        className="ml-1 inline-flex h-[20px] max-w-[150px] items-center gap-1 rounded-full bg-white/[0.07] px-1.5 font-sans text-[11.5px] font-medium leading-none text-[var(--sc-metin-2)] no-underline ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.12] hover:text-[var(--sc-metin)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={favikon(k.url)} alt="" className="h-3 w-3 shrink-0 rounded-sm" /><span className="truncate">{alanAdi(k.url)}</span>
      </a>
      {acik && (
        <span role="tooltip" className="sc-ipucu absolute bottom-full left-0 z-[60] mb-2 block w-[300px] max-w-[80vw] rounded-[12px] bg-[#1a1a1d] p-3 font-sans text-left ring-1 ring-inset ring-white/[0.1]">
          <span className="flex items-center gap-1.5 text-[12px] text-[var(--sc-metin-3)]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={favikon(k.url)} alt="" className="h-3.5 w-3.5 rounded-sm" />{alanAdi(k.url)}<span className="ml-auto tabular-nums">{n}</span></span>
          <span className="mt-1 line-clamp-2 text-[13.5px] font-medium leading-snug text-[var(--sc-metin)]">{k.baslik}</span>
          {k.alinti && <span className="mt-1.5 line-clamp-3 border-l-2 border-white/[0.12] pl-2 text-[12.5px] leading-relaxed text-[var(--sc-metin-2)]">{k.alinti}</span>}
        </span>
      )}
    </span>
  );
}

/** Asistan yanıtı için markdown: başlıklar, listeler, tablolar, kod blokları, alıntılar, bağlantılar. */
export const Markdown = memo(function Markdown({ metin, akiyor, kaynaklar }: { metin: string; akiyor?: boolean; kaynaklar?: ScKaynak[] }) {
  const yaziTipi = useScTercih((s) => s.yaziTipi);
  const boyut = useScTercih((s) => s.yaziBoyutu);
  return (
    <div className={cn("sc-md text-[#e3e9f1]", yaziTipi === "serif" ? "sc-serif" : "font-sans", BOYUT[boyut] ?? BOYUT.orta, akiyor && "sc-md-akiyor")}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2 className="mb-3 mt-7 text-[23px] font-semibold leading-snug tracking-[-0.01em] text-[var(--sc-metin)] first:mt-0">{children}</h2>,
          h2: ({ children }) => <h3 className="mb-2.5 mt-6 text-[20px] font-semibold leading-snug text-[var(--sc-metin)] first:mt-0">{children}</h3>,
          h3: ({ children }) => <h4 className="mb-2 mt-5 text-[17.5px] font-semibold text-[var(--sc-metin)] first:mt-0">{children}</h4>,
          p: ({ children }) => <p className="my-3.5 first:mt-0 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="my-3.5 list-disc space-y-2 pl-6 marker:text-[var(--sc-metin-3)]">{children}</ul>,
          ol: ({ children }) => <ol className="my-3.5 list-decimal space-y-2 pl-6 marker:text-[var(--sc-metin-2)]">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-[var(--sc-metin)]">{children}</strong>,
          blockquote: ({ children }) => <blockquote className="my-4 border-l-2 border-[var(--sc-aksan)]/60 pl-4 text-[var(--sc-metin-2)]">{children}</blockquote>,
          hr: () => <hr className="my-6 border-white/[0.08]" />,
          a: ({ href, children }) => href?.startsWith("#sc-k-") ? <AtifCipi n={Number(href.slice(6))} k={kaynaklar?.[Number(href.slice(6)) - 1]} /> : (
            <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-baseline gap-1 text-[var(--sc-aksan)] underline decoration-[var(--sc-aksan)]/30 underline-offset-[3px] transition-colors hover:decoration-[var(--sc-aksan)]">
              {href?.startsWith("http") && <img src={favikon(href)} alt="" className="relative top-[2px] h-3.5 w-3.5 rounded-sm" />}{/* eslint-disable-line @next/next/no-img-element */}
              {children}
            </a>
          ),
          table: ({ children }) => <div className="my-4 overflow-x-auto rounded-[12px] ring-1 ring-inset ring-white/[0.08] [scrollbar-width:thin]"><table className="w-full border-collapse font-sans text-[14px]">{children}</table></div>,
          thead: ({ children }) => <thead className="bg-white/[0.04]">{children}</thead>,
          th: ({ children }) => <th className="border-b border-white/[0.08] px-3.5 py-2 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="border-b border-white/[0.05] px-3.5 py-2 align-top text-[var(--sc-metin-2)]">{children}</td>,
          code: ({ className, children }) => {
            const dil = /language-(\w+)/.exec(className ?? "")?.[1];
            const kod = String(children ?? "").replace(/\n$/, "");
            if (dil === "grafik" || dil === "chart") {
              const v = grafikCoz(kod);
              if (v) return <Grafik veri={v} />;
              if (akiyor) return <span className="my-4 flex h-[120px] items-center justify-center rounded-[14px] bg-white/[0.03] font-sans text-[13px] text-[var(--sc-metin-3)] ring-1 ring-inset ring-white/[0.06]">Grafik hazırlanıyor…</span>;
            }
            if (dil || kod.includes("\n")) return <KodBlogu dil={dil ?? ""} kod={kod} />;
            return <code className="rounded-[6px] bg-white/[0.07] px-1.5 py-0.5 sc-kod text-[0.88em] text-[#f0c9a8] [overflow-wrap:anywhere]">{children}</code>;
          },
          pre: ({ children }) => <>{children}</>,
        }}>
        {metin}
      </ReactMarkdown>
    </div>
  );
});
