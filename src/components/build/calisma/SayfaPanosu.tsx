"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, FileText, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

/** Sayfanın başlığı, açıklaması ve verdiği iç bağlantılar (HTML'den). */
function sayfaBilgisi(html: string, sayfalar: string[]) {
  const baslik = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
  const aciklama = /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i.exec(html)?.[1] ?? /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i.exec(html)?.[1] ?? "";
  const gorsel = /<meta[^>]+property=["']og:image["']/i.test(html);
  const baglar = new Set<string>();
  for (const m of html.matchAll(/href=["']\.?\/?([^"'#?]*)["']/gi)) {
    const h = m[1] === "" ? "index.html" : m[1].endsWith(".html") ? m[1] : `${m[1].replace(/\/$/, "")}.html`;
    if (sayfalar.includes(h)) baglar.add(h);
  }
  return { baslik, aciklama, gorsel, baglar: [...baglar] };
}

/** Kutu genişliğine göre ölçeklenen canlı sayfa karesi. */
function Kare({ src, genislik, yukseklik, oran, baslik, sec }: { src: string; genislik: number; yukseklik: number; oran: string; baslik: string; sec: () => void }) {
  const kutu = useRef<HTMLButtonElement>(null);
  const [o, setO] = useState(0.25);
  const [gorunur, setGorunur] = useState(false);
  useEffect(() => {
    const k = kutu.current; if (!k) return;
    const r = new ResizeObserver(() => setO(k.offsetWidth / genislik)); r.observe(k);
    const g = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { setGorunur(true); g.disconnect(); } }, { rootMargin: "300px" }); g.observe(k);
    return () => { r.disconnect(); g.disconnect(); };
  }, [genislik]);
  return (
    <button ref={kutu} type="button" onClick={sec} aria-label={baslik} className={cn("group relative block w-full overflow-hidden bg-white ring-1 ring-white/10 transition-shadow hover:ring-2 hover:ring-white", oran)}>
      {gorunur && <iframe title={baslik} src={src} sandbox="allow-scripts" loading="lazy" tabIndex={-1} style={{ width: genislik, height: yukseklik, transform: `scale(${o})`, transformOrigin: "0 0" }} className="pointer-events-none absolute left-0 top-0 border-0 bg-white" />}
    </button>
  );
}

/**
 * Bütün sayfalar panosu: her sayfa masaüstü ve telefon karesiyle yan yana; başlık, açıklama, paylaşım görseli
 * eksikleri ve sayfanın bağlantı verdiği diğer sayfalar. Kareye tıklayınca o sayfa o cihazda açılır.
 */
export function SayfaPanosu({ dosyalar, kok, surum, ac }: { dosyalar: Record<string, string>; kok: string; surum: string; ac: (sayfa: string, cihaz: "masaustu" | "telefon") => void }) {
  const sayfalar = useMemo(() => Object.keys(dosyalar).filter((y) => y.endsWith(".html")).sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b))), [dosyalar]);
  const bilgi = useMemo(() => Object.fromEntries(sayfalar.map((s) => [s, sayfaBilgisi(dosyalar[s] ?? "", sayfalar)])), [sayfalar, dosyalar]);
  const gelen = (s: string) => sayfalar.filter((x) => x !== s && bilgi[x].baglar.includes(s));
  const ad = (s: string) => (s === "index.html" ? "Ana sayfa" : s.replace(/\.html$/, ""));
  return (
    <div className="h-full overflow-y-auto px-4 py-5 [scrollbar-width:thin] sm:px-6">
      <p className="mb-4 text-[12.5px] text-white/45">{sayfalar.length} sayfa · kareye tıklayınca o sayfa o görünümde açılır</p>
      <div className="grid gap-5 xl:grid-cols-2">
        {sayfalar.map((s) => {
          const b = bilgi[s];
          const src = `${kok}/${s === "index.html" ? "" : s}?v=${surum}&pano=1`;
          const eksik = [!b.baslik && "başlık", !b.aciklama && "açıklama", !b.gorsel && "paylaşım görseli"].filter(Boolean) as string[];
          const g = gelen(s);
          return (
            <section key={s} className="rounded-[20px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
              <header className="mb-3 flex items-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.07] text-white/70"><FileText className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2"><span className="truncate text-[14px] font-semibold text-white">{ad(s)}</span><span className="shrink-0 text-[11.5px] text-white/35">{s}</span></span>
                  <span className="block truncate text-[12px] text-white/55">{b.baslik || "Başlık yok"}</span>
                </span>
              </header>
              <div className="grid grid-cols-[1fr_96px] items-end gap-3 sm:grid-cols-[1fr_120px]">
                <div>
                  <Kare src={src} genislik={1280} yukseklik={800} oran="aspect-[16/10] rounded-[12px]" baslik={`${ad(s)} masaüstünde aç`} sec={() => ac(s, "masaustu")} />
                  <span className="mt-1.5 flex items-center gap-1 text-[11px] text-white/35"><Monitor className="h-3 w-3" />Masaüstü</span>
                </div>
                <div>
                  <Kare src={src} genislik={390} yukseklik={844} oran="aspect-[390/844] rounded-[16px]" baslik={`${ad(s)} telefonda aç`} sec={() => ac(s, "telefon")} />
                  <span className="mt-1.5 flex items-center gap-1 text-[11px] text-white/35"><Smartphone className="h-3 w-3" />Telefon</span>
                </div>
              </div>
              {b.aciklama && <p className="mt-3 line-clamp-2 text-[12px] leading-relaxed text-white/50">{b.aciklama}</p>}
              {eksik.length > 0 && <p className="mt-2.5 flex items-start gap-1.5 text-[12px] text-amber-200/80"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />Eksik: {eksik.join(", ")}</p>}
              {(b.baglar.filter((x) => x !== s).length > 0 || g.length > 0) && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11.5px]">
                  {b.baglar.filter((x) => x !== s).map((x) => <button key={x} type="button" onClick={() => ac(x, "masaustu")} className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-white/65 hover:bg-white/[0.1] hover:text-white"><ArrowRight className="h-3 w-3" />{ad(x)}</button>)}
                  {g.length > 0 && <span className="text-white/35">{g.length} sayfa buraya bağlanıyor</span>}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
