"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Database, KeyRound, LayoutGrid, Link2, Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Sutun = { ad: string; tur: string; zorunlu?: boolean; benzersiz?: boolean; iliski?: string; cikarim?: boolean };
type Tablo = { ad: string; adet: number; sema: Sutun[]; kurallar: { okuma: string; ekleme: string; duzenleme: string } };
type Kenar = { kaynak: string; sutun: string; hedef: string; cikarim: boolean };
const EN = 230, SATIR = 26, BAS = 44;
const TUR_AD: Record<string, string> = { metin: "metin", uzunMetin: "uzun metin", sayi: "sayı", mantiksal: "evet/hayır", tarih: "tarih", eposta: "e-posta", url: "adres", gorsel: "görsel", secim: "seçim", iliski: "ilişki", json: "JSON" };
const KURAL: Record<string, string> = { herkes: "Herkes okur", uyeler: "Üyeler okur", sahibi: "Kendi kaydını okur", kapali: "Yalnız sen" };

/** Kenarlar: şemadaki ilişki sütunları (düz) ve adı tabloAdiId / tablo_id olan sütunlar (kesikli, çıkarım). */
function kenarlar(l: Tablo[]): Kenar[] {
  const adlar = new Set(l.map((t) => t.ad));
  const o: Kenar[] = [];
  for (const t of l) for (const s of t.sema) {
    if (s.tur === "iliski" && s.iliski && adlar.has(s.iliski)) { o.push({ kaynak: t.ad, sutun: s.ad, hedef: s.iliski, cikarim: false }); continue; }
    const m = /^(.+?)(_?id|Id)$/.exec(s.ad);
    const aday = m ? [m[1], `${m[1]}ler`, `${m[1]}lar`].find((x) => adlar.has(x) && x !== t.ad) : undefined;
    if (aday) o.push({ kaynak: t.ad, sutun: s.ad, hedef: aday, cikarim: true });
  }
  return o;
}

/** Otomatik yerleşim: başka tabloya işaret etmeyenler (hedefler) solda, işaret edenler sağa doğru katmanlanır. */
function yerlesim(l: Tablo[], k: Kenar[]) {
  const derinlik = new Map<string, number>();
  const hesap = (ad: string, yol: Set<string>): number => {
    if (derinlik.has(ad)) return derinlik.get(ad)!;
    if (yol.has(ad)) return 0;
    yol.add(ad);
    const d = Math.max(0, ...k.filter((x) => x.kaynak === ad && x.hedef !== ad).map((x) => hesap(x.hedef, yol) + 1));
    derinlik.set(ad, d);
    return d;
  };
  for (const t of l) hesap(t.ad, new Set());
  const sutunlar = new Map<number, Tablo[]>();
  for (const t of l) { const d = derinlik.get(t.ad) ?? 0; sutunlar.set(d, [...(sutunlar.get(d) ?? []), t]); }
  const konum: Record<string, { x: number; y: number }> = {};
  for (const [d, ts] of sutunlar) { let y = 24; for (const t of ts) { konum[t.ad] = { x: 24 + d * (EN + 90), y }; y += BAS + Math.max(1, t.sema.length + 1) * SATIR + 34; } }
  return konum;
}

/** Şema diyagramı (Supabase Schema Visualizer benzeri): tablolar, sütun türleri, ilişki okları; sürüklenen konumlar saklanır. */
export function SemaDiyagrami({ projeId, tablolar, onSec, kapat }: { projeId: string; tablolar: Tablo[]; onSec: (ad: string) => void; kapat: () => void }) {
  const k = useMemo(() => kenarlar(tablolar), [tablolar]);
  const anahtar = `vayra-sema-${projeId}`;
  const [konum, setKonum] = useState<Record<string, { x: number; y: number }>>({});
  const [olcek, setOlcek] = useState(1);
  const [vurgu, setVurgu] = useState<string | null>(null);
  const surukle = useRef<{ ad: string; dx: number; dy: number } | null>(null);
  const alan = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const oto = yerlesim(tablolar, k);
    let kayitli: Record<string, { x: number; y: number }> = {};
    try { kayitli = JSON.parse(localStorage.getItem(anahtar) ?? "{}"); } catch { /* yok */ }
    setKonum(Object.fromEntries(tablolar.map((t) => [t.ad, kayitli[t.ad] ?? oto[t.ad]])));
  }, [tablolar, k, anahtar]);
  const sakla = useCallback((k2: Record<string, { x: number; y: number }>) => { try { localStorage.setItem(anahtar, JSON.stringify(k2)); } catch { /* yok */ } }, [anahtar]);
  const yukseklik = (t: Tablo) => BAS + (t.sema.length + 1) * SATIR + 8;
  const sutunY = (t: Tablo, ad: string) => { const i = ad === "id" ? 0 : t.sema.findIndex((s) => s.ad === ad) + 1; return BAS + i * SATIR + SATIR / 2; };
  const tablo = (ad: string) => tablolar.find((t) => t.ad === ad)!;
  const enX = Math.max(800, ...Object.values(konum).map((p) => p.x + EN + 60));
  const enY = Math.max(500, ...tablolar.map((t) => (konum[t.ad]?.y ?? 0) + yukseklik(t) + 60));
  const tasi = (e: React.PointerEvent) => {
    const s = surukle.current; if (!s || !alan.current) return;
    const r = alan.current.getBoundingClientRect();
    const x = Math.max(0, (e.clientX - r.left + alan.current.scrollLeft) / olcek - s.dx), y = Math.max(0, (e.clientY - r.top + alan.current.scrollTop) / olcek - s.dy);
    setKonum((p) => ({ ...p, [s.ad]: { x: Math.round(x / 8) * 8, y: Math.round(y / 8) * 8 } }));
  };
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
        <p className="min-w-0 flex-1"><span className="block text-[15px] font-semibold text-white">Şema diyagramı</span><span className="block text-[12px] text-white/45">{tablolar.length} tablo, {k.filter((x) => !x.cikarim).length} ilişki{k.some((x) => x.cikarim) ? `, ${k.filter((x) => x.cikarim).length} addan çıkarılan bağ (kesikli)` : ""}. Tabloyu sürükle, adına çift tıkla.</span></p>
        <button type="button" onClick={() => { const o = yerlesim(tablolar, k); setKonum(o); sakla(o); }} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white hover:bg-white/[0.12]"><LayoutGrid className="h-3.5 w-3.5" />Otomatik yerleştir</button>
        <span className="flex items-center rounded-full bg-white/[0.07]"><button type="button" aria-label="Uzaklaş" onClick={() => setOlcek((o) => Math.max(0.5, Math.round((o - 0.1) * 10) / 10))} className="flex h-8 w-8 items-center justify-center text-white/70 hover:text-white"><Minus className="h-3.5 w-3.5" /></button><span className="w-10 text-center text-[12px] tabular-nums text-white/60">{Math.round(olcek * 100)}</span><button type="button" aria-label="Yakınlaş" onClick={() => setOlcek((o) => Math.min(1.6, Math.round((o + 0.1) * 10) / 10))} className="flex h-8 w-8 items-center justify-center text-white/70 hover:text-white"><Plus className="h-3.5 w-3.5" /></button></span>
        <button type="button" onClick={kapat} aria-label="Diyagramı kapat" className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <div ref={alan} onPointerMove={tasi} onPointerUp={() => { if (surukle.current) { surukle.current = null; sakla(konum); } }} className="relative min-h-0 flex-1 overflow-auto bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:20px_20px] [scrollbar-width:thin]">
        {!tablolar.length ? <p className="p-8 text-center text-[13px] text-white/50">Henüz tablo yok.</p> : (
          <div className="relative origin-top-left" style={{ width: enX, height: enY, transform: `scale(${olcek})` }}>
            <svg className="pointer-events-none absolute inset-0" width={enX} height={enY}>
              <defs><marker id="sema-ok" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#55d6fd" /></marker></defs>
              {k.map((e, i) => {
                const a = konum[e.kaynak], b = konum[e.hedef]; if (!a || !b) return null;
                const ta = tablo(e.kaynak), tb = tablo(e.hedef);
                const sag = b.x + EN / 2 < a.x;
                const x1 = sag ? a.x : a.x + EN, y1 = a.y + sutunY(ta, e.sutun), x2 = sag ? b.x + EN : b.x, y2 = b.y + sutunY(tb, "id");
                const c = Math.max(40, Math.abs(x2 - x1) / 2);
                const aktif = !vurgu || vurgu === e.kaynak || vurgu === e.hedef;
                return <path key={i} d={`M${x1} ${y1} C${x1 + (sag ? -c : c)} ${y1}, ${x2 + (sag ? c : -c)} ${y2}, ${x2} ${y2}`} fill="none" stroke="#55d6fd" strokeOpacity={aktif ? 0.75 : 0.15} strokeWidth={1.6} strokeDasharray={e.cikarim ? "5 5" : undefined} markerEnd="url(#sema-ok)" />;
              })}
            </svg>
            {tablolar.map((t) => { const p = konum[t.ad]; if (!p) return null; const iliskili = k.filter((x) => x.kaynak === t.ad || x.hedef === t.ad).length; return (
              <motion.div key={t.ad} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: !vurgu || vurgu === t.ad || k.some((x) => (x.kaynak === vurgu && x.hedef === t.ad) || (x.hedef === vurgu && x.kaynak === t.ad)) ? 1 : 0.45, scale: 1 }}
                onMouseEnter={() => setVurgu(t.ad)} onMouseLeave={() => setVurgu(null)}
                className={cn("absolute overflow-hidden rounded-[14px] bg-[#16171a] ring-1 ring-inset", vurgu === t.ad ? "ring-white/60" : "ring-white/[0.1]")} style={{ left: p.x, top: p.y, width: EN }}>
                <div onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); const r = alan.current!.getBoundingClientRect(); surukle.current = { ad: t.ad, dx: (e.clientX - r.left + alan.current!.scrollLeft) / olcek - p.x, dy: (e.clientY - r.top + alan.current!.scrollTop) / olcek - p.y }; }} onDoubleClick={() => onSec(t.ad)}
                  className="flex cursor-grab items-center gap-2 border-b border-white/[0.07] bg-white/[0.04] px-3 active:cursor-grabbing" style={{ height: BAS }}>
                  <Database className="h-3.5 w-3.5 shrink-0 text-[#8be6ff]" /><span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white">{t.ad}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-white/40" title={KURAL[t.kurallar.okuma]}>{t.adet.toLocaleString("tr-TR")}</span>
                </div>
                <div className="flex items-center gap-2 px-3 text-[12px]" style={{ height: SATIR }}><KeyRound className="h-3 w-3 shrink-0 text-amber-200/80" /><span className="flex-1 text-white/80">id</span><span className="text-white/35">kimlik</span></div>
                {t.sema.map((s) => { const bag = k.find((x) => x.kaynak === t.ad && x.sutun === s.ad); return (
                  <div key={s.ad} className="flex items-center gap-2 border-t border-white/[0.04] px-3 text-[12px]" style={{ height: SATIR }}>
                    {bag ? <Link2 className="h-3 w-3 shrink-0 text-[#8be6ff]" /> : <span className="h-3 w-3 shrink-0" />}
                    <span className={cn("min-w-0 flex-1 truncate", s.cikarim ? "text-white/50" : "text-white/85")}>{s.ad}{s.zorunlu && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[#55d6fd] align-middle" />}</span>
                    <span className="shrink-0 text-white/35">{bag ? bag.hedef : TUR_AD[s.tur] ?? s.tur}</span>
                  </div>
                ); })}
                {!t.sema.length && <p className="border-t border-white/[0.04] px-3 py-1.5 text-[11.5px] text-white/35">Şema tanımsız{iliskili ? "" : ", alanlar serbest"}</p>}
              </motion.div>
            ); })}
          </div>
        )}
      </div>
    </div>
  );
}
