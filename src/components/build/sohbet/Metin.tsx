"use client";

import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Check, Code2, Copy, Download, Play, WrapText } from "lucide-react";
import { vurgula } from "@/components/build/calisma/vurgula";
import { bellekEtiketiniGizle } from "@/lib/build/sohbetYol";
import { cn } from "@/lib/utils";
import { AlintiCipi } from "./Kaynaklar";
import { MermaidBlok } from "./Mermaid";
import { indir } from "./ortak";
import type { Alinti } from "./tipler";

const DIL: Record<string, string> = { js: "js", javascript: "js", ts: "js", typescript: "js", jsx: "js", tsx: "js", json: "json", html: "html", xml: "html", svg: "html", css: "css" };
const UZANTI: Record<string, string> = { javascript: "js", typescript: "ts", python: "py", markdown: "md", html: "html", css: "css", json: "json", sql: "sql", bash: "sh", shell: "sh", yaml: "yml", mermaid: "mmd" };
export const htmlMi = (kod: string, dil: string) => /^(html|svg)$/i.test(dil) || /^\s*<!doctype html|^\s*<html/i.test(kod);

/* ── Kod bloğu: dil etiketi, satır kaydırma, indir, kopyala; HTML ise önizleme yan paneli ── */
function KodBlogu({ kod, dil, onizle }: { kod: string; dil: string; onizle?: (html: string) => void }) {
  const [ok, setOk] = useState(false);
  const [kaydir, setKaydir] = useState(false);
  const html = htmlMi(kod, dil);
  const satir = kod.split("\n").length;
  return (
    <div className="my-3 overflow-hidden rounded-[14px] bg-[#0c0d0f] ring-1 ring-inset ring-white/[0.08]">
      <div className="flex h-9 items-center gap-1 border-b border-white/[0.06] pl-3 pr-1.5 text-[12px] text-white/45">
        <Code2 className="mr-1 h-3.5 w-3.5" /><span className="sc-kod min-w-0 flex-1 truncate">{dil || "kod"}{satir > 1 && <span className="ml-2 text-white/30 max-sm:hidden">{satir} satır</span>}</span>
        {html && onizle && <button type="button" onClick={() => onizle(kod)} className="mr-1 inline-flex h-7 items-center gap-1 rounded-full bg-white px-2.5 text-[11.5px] font-semibold text-black"><Play className="h-3 w-3" />Önizle</button>}
        <button type="button" title={kaydir ? "Satırları kaydırma" : "Satırları kaydır"} aria-label="Satır kaydırma" aria-pressed={kaydir} onClick={() => setKaydir((x) => !x)} className={cn("flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/[0.07] hover:text-white", kaydir && "bg-[#55d6fd]/[0.14] text-[#8be6ff]")}><WrapText className="h-3 w-3" /></button>
        <button type="button" title="İndir" aria-label="İndir" onClick={() => indir(`kod.${UZANTI[dil.toLowerCase()] ?? (dil.toLowerCase() || "txt")}`, kod, "text/plain;charset=utf-8")} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/[0.07] hover:text-white"><Download className="h-3 w-3" /></button>
        <button type="button" onClick={() => { navigator.clipboard?.writeText(kod); setOk(true); setTimeout(() => setOk(false), 1300); }} className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 hover:bg-white/[0.07] hover:text-white">{ok ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}<span className="max-sm:hidden">{ok ? "Kopyalandı" : "Kopyala"}</span></button>
      </div>
      <pre className={cn("kod-renk sc-kod max-h-[520px] overflow-auto p-3.5 text-[12.5px] leading-[1.6] text-white/85 [scrollbar-width:thin]", kaydir && "whitespace-pre-wrap break-words")}><code dangerouslySetInnerHTML={{ __html: vurgula(kod, `x.${DIL[dil.toLowerCase()] ?? "txt"}`) }} /></pre>
    </div>
  );
}

/* ── Tablo: kopyala (sekmeyle ayrılmış, tablolara doğrudan yapışır) ve CSV indir ── */
type HastDugum = { type: string; tagName?: string; value?: string; children?: HastDugum[] };
const dugumMetni = (n: HastDugum): string => (n.type === "text" ? n.value ?? "" : (n.children ?? []).map(dugumMetni).join(""));
function tabloVerisi(n: HastDugum | undefined): string[][] {
  const o: string[][] = [];
  const gez = (d: HastDugum) => { if (d.tagName === "tr") { o.push((d.children ?? []).filter((c) => c.tagName === "th" || c.tagName === "td").map((c) => dugumMetni(c).replace(/\s+/g, " ").trim())); return; } (d.children ?? []).forEach(gez); };
  if (n) gez(n);
  return o;
}
const csvHucre = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
function Tablo({ node, children }: { node?: HastDugum; children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const veri = () => tabloVerisi(node);
  return (
    <div className="group/tablo my-3">
      <div className="overflow-x-auto rounded-[12px] ring-1 ring-inset ring-white/[0.08] [scrollbar-width:thin]"><table className="w-full text-[13.5px]">{children}</table></div>
      <div className="mt-1 flex justify-end gap-0.5 text-[12px] text-white/45 transition-opacity sm:opacity-0 sm:group-hover/tablo:opacity-100 sm:focus-within:opacity-100">
        <button type="button" onClick={() => { navigator.clipboard?.writeText(veri().map((r) => r.join("\t")).join("\n")); setOk(true); setTimeout(() => setOk(false), 1300); }} className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 hover:bg-white/[0.07] hover:text-white">{ok ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{ok ? "Kopyalandı" : "Kopyala"}</button>
        <button type="button" onClick={() => indir("tablo.csv", `﻿${veri().map((r) => r.map(csvHucre).join(";")).join("\r\n")}`, "text/csv;charset=utf-8")} className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 hover:bg-white/[0.07] hover:text-white"><Download className="h-3 w-3" />CSV indir</button>
      </div>
    </div>
  );
}

/**
 * Matematik ayraçları: \( \) ve \[ \] dolar biçimine çevrilir; para birimi gibi tek başına duran $ işaretleri
 * kaçırılır (Pandoc kuralı: açılış $ ardından boşluk gelmez, kapanış $ öncesi boşluk olmaz ve ardından rakam gelmez).
 * Kod blokları ve satır içi kod olduğu gibi kalır.
 */
export function matematikHazirla(md: string): string {
  if (!/[$\\]/.test(md)) return md;
  return md.split(/(```[\s\S]*?(?:```|$)|`[^`\n]*`)/g).map((p, i) => {
    if (i % 2) return p;
    let s = p.replace(/\\\[([\s\S]+?)\\\]/g, (_, x: string) => `$$${x.trim()}$$`).replace(/\\\(([\s\S]+?)\\\)/g, (_, x: string) => `$${x.trim()}$`);
    let o = "";
    for (let k = 0; k < s.length; k++) {
      const c = s[k];
      if (c === "\\" && s[k + 1] === "$") { o += "\\$"; k++; continue; }
      if (c !== "$") { o += c; continue; }
      if (s[k + 1] === "$") { const j = s.indexOf("$$", k + 2); if (j > k + 2) { o += s.slice(k, j + 2); k = j + 1; } else { o += "\\$\\$"; k++; } continue; }
      const sonraki = s[k + 1];
      let kapanis = -1;
      if (sonraki && !/\s/.test(sonraki)) {
        for (let j = k + 2; j < s.length && s[j] !== "\n"; j++) {
          if (s[j] === "$" && s[j - 1] !== "\\" && !/\s/.test(s[j - 1]) && !/\d/.test(s[j + 1] ?? "") && s[j + 1] !== "$") { kapanis = j; break; }
        }
      }
      if (kapanis > 0) { o += s.slice(k, kapanis + 1); k = kapanis; } else o += "\\$";
    }
    s = o;
    return s;
  }).join("");
}

/**
 * Yanıt metni (Markdown + KaTeX matematik + Mermaid diyagram). kaynaklar verilirse [n](#kaynak-n) bağlantıları
 * numaralı alıntı çipine dönüşür. Bellek kaynağı etiketi (model yanıtın sonuna yazar) gösterilmez.
 */
export const Md = memo(function Md({ metin, akiyor, onizle, kaynaklar }: { metin: string; akiyor?: boolean; onizle: (h: string) => void; kaynaklar?: (Alinti & { no: number })[] }) {
  return (
    <div className={cn("text-[15px] leading-[1.7] text-white/[0.88] [&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1 [&_.katex]:text-[1.06em]", akiyor && "build-md-akiyor")}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: "ignore", output: "html" }]]} components={{
        p: ({ children }) => <p className="my-3 first:mt-0 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="my-3 list-disc space-y-1.5 pl-6 marker:text-white/30">{children}</ul>,
        ol: ({ children }) => <ol className="my-3 list-decimal space-y-1.5 pl-6 marker:text-white/40">{children}</ol>,
        h1: ({ children }) => <h2 className="mb-2 mt-6 text-[21px] font-semibold tracking-[-0.01em] text-white first:mt-0">{children}</h2>,
        h2: ({ children }) => <h3 className="mb-2 mt-5 text-[18px] font-semibold text-white first:mt-0">{children}</h3>,
        h3: ({ children }) => <h4 className="mb-1.5 mt-4 text-[16px] font-semibold text-white first:mt-0">{children}</h4>,
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        a: ({ href, children }) => {
          const k = /^#kaynak-(\d+)$/.exec(href ?? "");
          if (k) return <AlintiCipi n={Number(k[1])} k={kaynaklar?.find((x) => x.no === Number(k[1]))} />;
          return <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#55d6fd] underline decoration-[#55d6fd]/30 underline-offset-[3px] hover:decoration-[#55d6fd]">{children}</a>;
        },
        blockquote: ({ children }) => <blockquote className="my-3 border-l-2 border-[#55d6fd]/50 pl-4 text-white/65">{children}</blockquote>,
        table: ({ node, children }) => <Tablo node={node as unknown as HastDugum}>{children}</Tablo>,
        th: ({ children }) => <th className="border-b border-white/[0.08] bg-white/[0.03] px-3 py-2 text-left font-semibold text-white">{children}</th>,
        td: ({ children }) => <td className="border-b border-white/[0.05] px-3 py-2 text-white/75">{children}</td>,
        img: ({ src, alt }) => /* eslint-disable-next-line @next/next/no-img-element */ <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} className="my-3 max-w-full rounded-[14px] ring-1 ring-inset ring-white/10" />,
        hr: () => <hr className="my-5 border-white/[0.08]" />,
        pre: ({ children }) => <>{children}</>,
        code: ({ className, children }) => {
          const dil = /language-([\w-]+)/.exec(className ?? "")?.[1];
          const kod = String(children).replace(/\n$/, "");
          if (!dil && !kod.includes("\n")) return <code className="sc-kod rounded-[6px] bg-white/[0.08] px-1.5 py-0.5 text-[13px] text-white">{children}</code>;
          if (dil === "mermaid") return <MermaidBlok kod={kod} akiyor={akiyor} yedek={<KodBlogu kod={kod} dil="mermaid" />} />;
          return <KodBlogu kod={kod} dil={dil ?? ""} onizle={onizle} />;
        },
      }}>{matematikHazirla(bellekEtiketiniGizle(metin))}</ReactMarkdown>
    </div>
  );
});

/** Metindeki HTML kod blokları (artifact sürümleri için). */
export function htmlBloklari(metin: string): string[] {
  const o: string[] = [];
  for (const m of metin.matchAll(/```(\w*)\n([\s\S]*?)```/g)) if (htmlMi(m[2], m[1])) o.push(m[2].replace(/\n$/, ""));
  return o;
}
