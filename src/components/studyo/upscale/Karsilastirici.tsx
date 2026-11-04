"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export type GoruntuMod = "kaydir" | "yanyana" | "tek";
export type Yakinlik = "sigdir" | 1 | 2;
export type Medya = { url: string; w: number; h: number };

/**
 * Önce/sonra görüntüleyici. Üç düzen (kaydırıcı, yan yana, tek), eşzamanlı yakınlaştırma ve kaydırma.
 * Yakınlık sonucun piksel boyutuna göredir (%100 = sonucun gerçek pikseli). Kaynak görsel büyük
 * yakınlıkta en yakın komşu ile çizilir — gerçek pikselleri görünür, tarayıcı yumuşatması
 * kaynağı olduğundan iyi göstermez.
 */
export function Karsilastirici({
  tur, once, sonra, mod, yakinlik, onYakinlik, ust, sonraEtiket = "Sonra", onceGoster, buyutec,
}: {
  tur: "gorsel" | "video";
  once: Medya;
  sonra?: Medya;
  mod: GoruntuMod;
  yakinlik: Yakinlik;
  onYakinlik: (y: Yakinlik) => void;
  /** Görüntünün üstüne çizilen katman (işleniyor animasyonu vb.). */
  ust?: ReactNode;
  sonraEtiket?: string;
  /** "tek" düzende önceyi göster (basılı tutma). */
  onceGoster?: boolean;
  /** İmlecin altını 3× büyüten mercek (kaydırıcıda çizginin hangi tarafındaysa o görsel). */
  buyutec?: boolean;
}) {
  const kapRef = useRef<HTMLDivElement>(null);
  const [kap, setKap] = useState({ w: 0, h: 0 });
  const [kay, setKay] = useState({ x: 0, y: 0 });
  const [kol, setKol] = useState(0.5);
  const [imlec, setImlec] = useState<{ x: number; y: number } | null>(null);
  const surukle = useRef<{ tip: "kol" | "kaydir"; x: number; y: number; kx: number; ky: number } | null>(null);
  // Büyük çıktılar (ör. 16 MP) çözülürken boş alan görünmesin: yüklenen adresler izlenir, bitene kadar gösterge.
  const [yuklu, setYuklu] = useState<Record<string, boolean>>({});
  const yuklendi = (u: string) => setYuklu((x) => (x[u] ? x : { ...x, [u]: true }));

  useLayoutEffect(() => {
    const el = kapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setKap({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const yanyana = mod === "yanyana" && !!sonra;
  const taban = sonra ?? once;
  const alanW = yanyana ? (kap.w - 8) / 2 : kap.w;
  const sigdirOlcek = taban.w && alanW > 0 ? Math.min(alanW / taban.w, kap.h / taban.h) : 1;
  const olcek = yakinlik === "sigdir" ? sigdirOlcek : yakinlik;
  const gW = taban.w * olcek, gH = taban.h * olcek;

  // Kaydırma sınırı: görsel alandan küçükse ortalanır.
  const sinirla = useCallback((x: number, y: number) => ({
    x: gW <= alanW ? 0 : Math.max(-(gW - alanW) / 2, Math.min((gW - alanW) / 2, x)),
    y: gH <= kap.h ? 0 : Math.max(-(gH - kap.h) / 2, Math.min((gH - kap.h) / 2, y)),
  }), [gW, gH, alanW, kap.h]);
  useEffect(() => setKay((k) => sinirla(k.x, k.y)), [sinirla]);
  useEffect(() => { if (yakinlik === "sigdir") setKay({ x: 0, y: 0 }); }, [yakinlik, once.url, sonra?.url]);

  const sol = (alanW - gW) / 2 + kay.x;
  const ust_ = (kap.h - gH) / 2 + kay.y;
  const piksel = olcek * (taban.w / Math.max(1, once.w)) >= 2; // kaynağın 1 pikseli ≥ 2 ekran pikseli
  const kaydirilabilir = gW > alanW + 1 || gH > kap.h + 1;

  const asagi = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const r = kapRef.current!.getBoundingClientRect();
    const kolX = r.left + kol * kap.w;
    const tip = mod === "kaydir" && sonra && (Math.abs(e.clientX - kolX) < 22 || !kaydirilabilir) ? "kol" : kaydirilabilir ? "kaydir" : null;
    if (!tip) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    surukle.current = { tip, x: e.clientX, y: e.clientY, kx: kay.x, ky: kay.y };
    if (tip === "kol") setKol(Math.min(1, Math.max(0, (e.clientX - r.left) / kap.w)));
  };
  const hareket = (e: React.PointerEvent) => {
    if (buyutec && !yanyana) { const r0 = kapRef.current!.getBoundingClientRect(); setImlec({ x: e.clientX - r0.left, y: e.clientY - r0.top }); }
    const s = surukle.current;
    if (!s) return;
    if (s.tip === "kol") {
      const r = kapRef.current!.getBoundingClientRect();
      setKol(Math.min(1, Math.max(0, (e.clientX - r.left) / kap.w)));
    } else setKay(sinirla(s.kx + e.clientX - s.x, s.ky + e.clientY - s.y));
  };
  const birak = () => { surukle.current = null; };

  const katman = (m: Medya, onceMi: boolean, kirp?: string) => {
    const stil: React.CSSProperties = { left: sol, top: ust_, width: gW, height: gH, clipPath: kirp, imageRendering: onceMi && piksel ? "pixelated" : undefined };
    return tur === "video"
      ? <video key={m.url} src={m.url} data-rol={onceMi ? "once" : "sonra"} muted={onceMi} playsInline loop className="absolute max-w-none select-none" style={stil} />
      // eslint-disable-next-line @next/next/no-img-element
      : <img key={m.url} src={m.url} alt={onceMi ? "Önce" : "Sonra"} draggable={false} onLoad={() => yuklendi(m.url)} ref={(el) => { if (el?.complete && el.naturalWidth) yuklendi(m.url); }}
          className={cn("absolute max-w-none select-none transition-opacity duration-300", yuklu[m.url] ? "opacity-100" : "opacity-0")} style={stil} />;
  };

  // Etiketler görselin köşesine oturur (görsel alandan küçükse alanın köşesine kaymaz).
  const etiket = (metin: string, konum: "sol" | "sag", alt?: string) => (
    <span className="pointer-events-none absolute z-10 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"
      style={{ top: Math.max(10, ust_ + 10), ...(konum === "sol" ? { left: Math.max(10, sol + 10) } : { right: Math.max(10, alanW - sol - gW + 10) }) }}>
      {metin}{alt && (yanyana ? alanW : gW) > 300 && <span className="ml-1.5 tabular-nums text-white/55">{alt}</span>}
    </span>
  );
  const boyut = (m: Medya) => `${m.w}×${m.h}`;

  const kolX = kol * kap.w;
  const kirpSonra = `inset(0 0 0 ${Math.max(0, Math.min(gW, kolX - sol))}px)`;

  return (
    <div className="relative h-full w-full">
      <div ref={kapRef}
        className={cn("absolute inset-0 overflow-hidden touch-none", yanyana && "flex gap-2",
          buyutec && !yanyana ? "cursor-none" : surukle.current?.tip === "kaydir" ? "cursor-grabbing" : mod === "kaydir" && sonra && !kaydirilabilir ? "cursor-ew-resize" : kaydirilabilir ? "cursor-grab" : "")}
        onPointerDown={asagi} onPointerMove={hareket} onPointerUp={birak} onPointerCancel={birak} onPointerLeave={() => setImlec(null)}
        onDoubleClick={() => onYakinlik(yakinlik === "sigdir" ? 1 : "sigdir")}>
        {yanyana ? (
          <>
            {([[once, true], [sonra!, false]] as const).map(([m, o]) => (
              <div key={o ? "o" : "s"} className="relative h-full flex-1 overflow-hidden rounded-xl bg-black/30">
                {tur === "gorsel" && !yuklu[m.url] && <span className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/60" /></span>}
                {katman(m, o)}
                {etiket(o ? "Önce" : sonraEtiket, "sol", boyut(m))}
              </div>
            ))}
          </>
        ) : mod === "kaydir" && sonra ? (
          <>
            {katman(once, true)}
            {katman(sonra, false, kirpSonra)}
            {etiket("Önce", "sol", boyut(once))}
            {etiket(sonraEtiket, "sag", boyut(sonra))}
            <div className="pointer-events-none absolute inset-y-0 z-10 w-[2px] -translate-x-1/2 bg-white" style={{ left: kolX }}>
              <span className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M6 4 2 8l4 4M10 4l4 4-4 4" stroke="#0a0a0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            </div>
          </>
        ) : (
          <>
            {katman(sonra && !onceGoster ? sonra : once, !sonra || !!onceGoster)}
            {etiket(sonra && !onceGoster ? sonraEtiket : "Önce", "sol", boyut(sonra && !onceGoster ? sonra : once))}
          </>
        )}
        {tur === "gorsel" && !yanyana && !yuklu[(mod === "tek" && !(sonra && !onceGoster) ? once : sonra ?? once).url] && <span className="pointer-events-none absolute inset-0 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/60" /></span>}
        {ust}
        {buyutec && imlec && !yanyana && imlec.x >= sol && imlec.x <= sol + gW && imlec.y >= ust_ && imlec.y <= ust_ + gH && (() => {
          // Çizginin solunda önce, sağında sonra; tek düzende görünen görsel.
          const m = mod === "kaydir" && sonra ? (imlec.x < kolX ? once : sonra) : sonra && !onceGoster ? sonra : once;
          const R = 92, K = 3;
          const bx = (imlec.x - sol) * K, by = (imlec.y - ust_) * K;
          return (
            <span className="pointer-events-none absolute z-30 overflow-hidden rounded-full ring-2 ring-white"
              style={{ left: imlec.x - R, top: imlec.y - R, width: R * 2, height: R * 2,
                backgroundImage: `url("${m.url}")`, backgroundRepeat: "no-repeat", backgroundSize: `${gW * K}px ${gH * K}px`, backgroundPosition: `${R - bx}px ${R - by}px`,
                imageRendering: m === once ? "pixelated" : "auto", backgroundColor: "#0b0b0d" }}>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-2 py-px text-[10px] font-semibold text-white">{m === once ? "Önce" : sonraEtiket} · 3×</span>
            </span>
          );
        })()}
      </div>
      {mod === "kaydir" && sonra && (
        <input type="range" min={0} max={100} value={Math.round(kol * 100)} onChange={(e) => setKol(Number(e.target.value) / 100)}
          aria-label="Karşılaştırma çizgisi" className="sr-only" />
      )}
      {tur === "video" && <VideoKontrol kap={kapRef} />}
    </div>
  );
}

/** İki videoyu birlikte oynatır/sarar (sonuç videosu ana saattir). */
function VideoKontrol({ kap }: { kap: React.RefObject<HTMLDivElement | null> }) {
  const [oynuyor, setOynuyor] = useState(false);
  const [an, setAn] = useState(0);
  const [sure, setSure] = useState(0);
  const videolar = () => Array.from(kap.current?.querySelectorAll("video") ?? []);
  const ana = () => videolar().find((v) => v.dataset.rol === "sonra") ?? videolar()[0];

  useEffect(() => {
    const t = setInterval(() => {
      const a = ana();
      if (!a) return;
      setAn(a.currentTime); setSure(a.duration || 0); setOynuyor(!a.paused);
      for (const v of videolar()) if (v !== a && Math.abs(v.currentTime - a.currentTime) > 0.12) v.currentTime = a.currentTime;
    }, 120);
    return () => clearInterval(t);
  });

  const oynat = () => {
    const a = ana();
    if (!a) return;
    if (a.paused) for (const v of videolar()) { v.currentTime = a.currentTime; void v.play().catch(() => {}); }
    else for (const v of videolar()) v.pause();
  };
  const sar = (t: number) => { for (const v of videolar()) v.currentTime = t; setAn(t); };
  const bicim = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="absolute inset-x-3 bottom-3 z-20 flex items-center gap-2.5 rounded-xl bg-black/60 px-2.5 py-1.5 backdrop-blur-md">
      <button onClick={oynat} aria-label={oynuyor ? "Duraklat" : "Oynat"} className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black">
        {oynuyor ? <Pause className="h-3.5 w-3.5" fill="currentColor" /> : <Play className="h-3.5 w-3.5 translate-x-px" fill="currentColor" />}
      </button>
      <input type="range" min={0} max={sure || 0} step={0.01} value={an} onChange={(e) => sar(Number(e.target.value))} aria-label="Konum"
        className="h-1 flex-1 cursor-pointer accent-white" />
      <span className="text-[11px] tabular-nums text-white/70">{bicim(an)} / {bicim(sure)}</span>
    </div>
  );
}
