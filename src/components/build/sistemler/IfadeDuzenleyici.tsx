"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { AlertTriangle, Check, ChevronRight, Eye, Plus, Search, SquareFunction, Trash2, X } from "lucide-react";
import { ISLEVLER, ISLEV_GRUPLARI, ifadeAyir, ifadeKur, islevBul, islevUygula, type IslevCagrisi } from "@/lib/build/sistemIslev";
import { gondermeCoz, metne, onizle, yolParcala, type SablonBaglam } from "@/lib/build/sistemSablon";
import { cn } from "@/lib/utils";
import type { DegiskenAdlari, VeriKaynagi } from "./SablonAlani";

/**
 * İfade düzenleyici: hapa tıklayınca açılan işlev penceresi (zincir, her adımın ara sonucu, işlev arama, canlı
 * sonuç) ve alanın altındaki canlı sonuç önizlemesi. Örnek değerler veri seçicinin deneme verisinden gelir.
 */

/** Veri kaynaklarından önizleme bağlamı (tetik ve adım örnekleri, değişkenler; sırlar gizli). */
export function onizlemeBaglami(kaynaklar: VeriKaynagi[], dg?: DegiskenAdlari): SablonBaglam {
  const tetik = kaynaklar.find((k) => k.onEk === "tetik");
  const dongu = kaynaklar.find((k) => k.onEk === "dongu");
  const hata = kaynaklar.find((k) => k.onEk === "hata");
  return {
    tetik: tetik?.ornek,
    adim: (ref) => { const k = kaynaklar.find((x) => x.onEk === `adim.${ref}` || (/^\d+$/.test(ref) && x.no === Number(ref))); return k && (k.ornek !== undefined || k.cikti !== undefined) ? { veri: k.ornek, cikti: k.cikti } : undefined; },
    dongu: dongu?.ornek as SablonBaglam["dongu"],
    hata: hata ? { mesaj: "Örnek hata iletisi", adim: "Hatalı adım" } : undefined,
    calisma: { id: "ornekcalisma", no: 1, devam: typeof location !== "undefined" ? `${location.origin}/api/build/genel/sistem/devam/ornekcalisma/belirtec` : "" },
    sistem: { id: "sistem", ad: "Bu sistem" },
    degisken: Object.fromEntries((dg?.degiskenler ?? []).map((d) => [d.ad, d.deger ?? ""])),
    sir: Object.fromEntries((dg?.sirlar ?? []).map((s) => [s.ad, "gizli değer"])),
  };
}

const turAdi = (v: unknown) => (v === undefined ? "örnek yok" : v === null ? "boş" : Array.isArray(v) ? `liste, ${v.length} öğe` : typeof v === "object" ? `nesne, ${Object.keys(v as object).length} alan` : typeof v === "number" ? "sayı" : typeof v === "boolean" ? "evet ya da hayır" : "metin");
const kisaMetin = (v: unknown, n = 140) => { if (v === undefined) return "örnek yok"; const s = metne(v); return s.length > n ? `${s.slice(0, n)}…` : s || "boş metin"; };
function dene(v: unknown, l: IslevCagrisi[]): { v?: unknown; hata?: string } { try { return { v: islevUygula(v, l) }; } catch (e) { return { hata: (e as Error).message }; } }

/** Alanın altındaki canlı sonuç (yalnız gönderme varsa). */
export function Onizleme({ deger, baglam, ornekVar }: { deger: string; baglam: SablonBaglam; ornekVar: boolean }) {
  const p = useMemo(() => onizle(deger, baglam), [deger, baglam]);
  if (!p.some((x) => x.tur !== "duz")) return null;
  const hata = p.find((x) => x.tur === "hata");
  return (
    <motion.div initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.14 }}
      className={cn("mt-1.5 rounded-[12px] px-3 py-2 ring-1 ring-inset", hata ? "bg-rose-500/[0.06] ring-rose-400/20" : "bg-[#55d6fd]/[0.04] ring-[#55d6fd]/15")}>
      <p className={cn("mb-0.5 flex items-center gap-1.5 text-[11.5px] font-medium", hata ? "text-rose-200" : "text-[#8be6ff]/85")}>{hata ? <AlertTriangle className="h-3 w-3" /> : <Eye className="h-3 w-3" />}{hata ? "İfadede hata" : "Sonuç, deneme verisiyle"}</p>
      {hata ? <p className="text-[12px] leading-relaxed text-rose-200/90">{hata.metin}</p> : (
        <p className="line-clamp-4 whitespace-pre-wrap break-words text-[12.5px] leading-relaxed text-white/60">
          {p.map((x, i) => x.tur === "duz" ? <span key={i}>{x.metin}</span> : x.tur === "yok" ? <span key={i} className="rounded bg-amber-400/[0.12] px-1 text-amber-200/90">örnek yok</span> : <span key={i} className="rounded bg-white/[0.07] px-0.5 text-white">{x.metin.length > 400 ? `${x.metin.slice(0, 400)}…` : x.metin || "boş"}</span>)}
        </p>
      )}
      {!ornekVar && !hata && <p className="mt-1 text-[11px] leading-relaxed text-white/40">Önceki adımları deneyince ya da tetiğe deneme verisi girince örnekler dolar.</p>}
    </motion.div>
  );
}

function ArgAlani({ c, i, set }: { c: IslevCagrisi; i: number; set: (args: string[]) => void }) {
  const f = islevBul(c.ad);
  const a = f?.arg?.[i];
  const deger = c.args[i] ?? "";
  const [ozel, setOzel] = useState(!!a?.secenek && !!deger && !a.secenek.some((x) => x.id === deger));
  if (!a) return null;
  const yaz = (v: string) => { const l = [...c.args]; while (l.length < i) l.push(""); l[i] = v; while (l.length && l.at(-1) === "" && (f?.arg?.[l.length - 1]?.istege ?? true)) l.pop(); set(l); };
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-white/45">{a.ad}{a.istege ? ", isteğe bağlı" : ""}</span>
      {a.secenek ? (
        <div className="flex flex-wrap gap-1">
          {a.secenek.map((x) => { const on = !ozel && (deger || a.varsayilan) === x.id; return <button key={x.id} type="button" onClick={() => { setOzel(false); yaz(x.id); }} className={cn("rounded-full px-2.5 py-1 text-[11.5px] transition", on ? "bg-white/[0.1] text-white ring-2 ring-inset ring-white" : "bg-white/[0.05] text-white/65 hover:text-white")}>{x.ad}</button>; })}
          {a.yer && <button type="button" onClick={() => setOzel(true)} className={cn("rounded-full px-2.5 py-1 text-[11.5px] transition", ozel ? "bg-white/[0.1] text-white ring-2 ring-inset ring-white" : "bg-white/[0.05] text-white/65 hover:text-white")}>Özel</button>}
          {ozel && <input autoFocus value={deger} onChange={(e) => yaz(e.target.value)} placeholder={a.yer} className="mt-1 h-8 w-full rounded-[10px] bg-white/[0.06] px-2.5 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.1] placeholder:text-white/30 focus:ring-white/30" />}
        </div>
      ) : <input value={deger} onChange={(e) => yaz(e.target.value)} placeholder={a.yer} className="h-8 w-full rounded-[10px] bg-white/[0.06] px-2.5 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.1] placeholder:text-white/30 focus:ring-white/30" />}
    </label>
  );
}

/** Hapa tıklayınca açılan işlev penceresi. */
export function HapPenceresi({ konum, ifade, etiket, baglam, degistir, sil, kapat }: {
  konum: { x: number; y: number; alt?: number }; ifade: string; etiket: string; baglam: SablonBaglam;
  degistir: (ifade: string) => void; sil: () => void; kapat: () => void;
}) {
  const kok = useRef<HTMLDivElement>(null);
  const [hazir, setHazir] = useState(false);
  const [ekle, setEkle] = useState(false);
  const [ara, setAra] = useState("");
  const [grup, setGrup] = useState<string>("Tümü");
  useEffect(() => setHazir(true), []);
  useEffect(() => {
    const f = (e: MouseEvent) => { if (!kok.current?.contains(e.target as Node)) kapat(); };
    const t = (e: KeyboardEvent) => { if (e.key === "Escape") kapat(); };
    const z = setTimeout(() => addEventListener("mousedown", f), 0);
    addEventListener("keydown", t);
    return () => { clearTimeout(z); removeEventListener("mousedown", f); removeEventListener("keydown", t); };
  }, [kapat]);
  let ayrik: { yol: string; islevler: IslevCagrisi[] } = { yol: ifade, islevler: [] }, ayrimHatasi = "";
  try { ayrik = ifadeAyir(ifade); } catch (e) { ayrimHatasi = (e as Error).message; }
  const { yol, islevler } = ayrik;
  const ham = useMemo(() => { try { return gondermeCoz(yol, baglam); } catch { return undefined; } }, [yol, baglam]);
  const yaz = (l: IslevCagrisi[]) => degistir(ifadeKur(yol, l));
  const son = dene(ham, islevler);
  const q = ara.trim().toLocaleLowerCase("tr");
  const secenekler = ISLEVLER.filter((f) => (grup === "Tümü" || f.grup === grup) && (!q || `${f.etiket} ${f.aciklama} ${f.ad}`.toLocaleLowerCase("tr").includes(q)));
  if (!hazir) return null;
  return createPortal(
    <motion.div ref={kok} initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.14 }}
      style={{ left: konum.x, top: konum.alt === undefined ? konum.y : undefined, bottom: konum.alt }} role="dialog" aria-label="İşlevler"
      onMouseDown={(e) => { const t = (e.target as HTMLElement).tagName; if (t !== "INPUT" && t !== "TEXTAREA") e.preventDefault(); }}
      className="bd-panel fixed z-[140] flex max-h-[min(560px,calc(100vh-24px))] w-[400px] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-[18px]">
      <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-3.5 py-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><SquareFunction className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-semibold text-white">{etiket}</span><span className="block truncate text-[11.5px] text-white/45">{yolParcala(yol).join(" › ")}</span></span>
        <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3.5 py-3 [scrollbar-width:thin]">
        <div className="rounded-[14px] bg-white/[0.03] px-3 py-2.5 ring-1 ring-inset ring-white/[0.06]">
          <p className="flex items-center gap-2 text-[11.5px] text-white/45"><span className="flex-1">Örnek değer</span><span>{turAdi(ham)}</span></p>
          <p className={cn("mt-0.5 line-clamp-3 break-words text-[12.5px] leading-relaxed", ham === undefined ? "text-amber-200/85" : "text-white/85")}>{ham === undefined ? "Bu veri için örnek yok; adımı ya da tetiği deneyince görünür." : kisaMetin(ham, 220)}</p>
        </div>
        {ayrimHatasi && <p className="rounded-[12px] bg-rose-500/[0.07] px-3 py-2 text-[12px] text-rose-200 ring-1 ring-inset ring-rose-400/15">{ayrimHatasi}</p>}
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {islevler.map((c, i) => {
              const f = islevBul(c.ad);
              const ara2 = dene(ham, islevler.slice(0, i + 1));
              return (
                <motion.div key={`${i}-${c.ad}`} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="rounded-[14px] bg-white/[0.035] p-2.5 ring-1 ring-inset ring-white/[0.07]">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#55d6fd]/[0.14] text-[11px] font-semibold tabular-nums text-[#8be6ff]">{i + 1}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium text-white">{f?.etiket ?? c.ad}</span>{!f && <span className="block text-[11.5px] text-rose-300">Bilinmeyen işlev</span>}</span>
                    <button type="button" onClick={() => yaz(islevler.filter((_, j) => j !== i))} aria-label="İşlevi kaldır" className="flex h-7 w-7 items-center justify-center rounded-full text-white/45 hover:bg-rose-500/[0.1] hover:text-rose-300"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  {!!f?.arg?.length && <div className="mt-2 grid gap-2">{f.arg.map((_, j) => <ArgAlani key={j} c={c} i={j} set={(args) => yaz(islevler.map((z, k) => (k === i ? { ...z, args } : z)))} />)}</div>}
                  <p className={cn("mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed", ara2.hata ? "text-rose-300" : "text-white/50")}><ChevronRight className="mt-0.5 h-3 w-3 shrink-0" /><span className="min-w-0 break-words">{ara2.hata ?? kisaMetin(ara2.v, 120)}</span></p>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {!islevler.length && !ekle && <p className="px-0.5 text-[12px] leading-relaxed text-white/45">Değeri olduğu gibi kullanmak yerine dönüştürebilirsin: büyük harf, Türk lirası, Türkçe tarih, listeden alan çekme, boşsa varsayılan. İşlevler sırayla uygulanır.</p>}
          {!ekle ? (
            <button type="button" onClick={() => setEkle(true)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white/85 hover:bg-white/[0.12]"><Plus className="h-3.5 w-3.5" />İşlev ekle</button>
          ) : (
            <div className="rounded-[14px] ring-1 ring-inset ring-white/[0.08]">
              <div className="flex items-center gap-2 border-b border-white/[0.06] px-2.5 py-1.5">
                <Search className="h-3.5 w-3.5 shrink-0 text-white/40" />
                <input autoFocus value={ara} onChange={(e) => setAra(e.target.value)} placeholder="İşlev ara: tarih, tl, büyük" className="h-7 min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/35" />
                <button type="button" onClick={() => { setEkle(false); setAra(""); }} aria-label="Kapat" className="flex h-6 w-6 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.08]"><X className="h-3.5 w-3.5" /></button>
              </div>
              <LayoutGroup id="islev-grup">
                <div className="flex gap-1 overflow-x-auto px-2 pt-2 [scrollbar-width:none]">
                  {["Tümü", ...ISLEV_GRUPLARI].map((g) => (
                    <button key={g} type="button" onClick={() => setGrup(g)} className={cn("relative h-7 shrink-0 rounded-full px-2.5 text-[11.5px] font-medium", grup === g ? "text-black" : "text-white/55 hover:text-white")}>
                      {grup === g && <motion.span layoutId="islev-grup-z" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 420, damping: 40 }} />}<span className="relative">{g}</span>
                    </button>
                  ))}
                </div>
              </LayoutGroup>
              <div className="max-h-[260px] overflow-y-auto p-1.5 [scrollbar-width:thin]">
                {secenekler.map((f) => {
                  const ornek = dene(son.v, [{ ad: f.ad, args: (f.arg ?? []).map((a) => a.varsayilan ?? "") }]);
                  return (
                    <button key={f.ad} type="button" onClick={() => { yaz([...islevler, { ad: f.ad, args: (f.arg ?? []).filter((a) => a.varsayilan !== undefined && !a.istege).map((a) => a.varsayilan!) }]); setEkle(false); setAra(""); }}
                      className="flex w-full items-start gap-2.5 rounded-[10px] px-2 py-1.5 text-left hover:bg-white/[0.07]">
                      <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-medium text-white">{f.etiket}<span className="ml-1.5 font-normal text-white/35">{f.grup}</span></span><span className="block text-[11.5px] leading-snug text-white/45">{f.aciklama}</span></span>
                      {son.v !== undefined && !ornek.hata && <span className="mt-0.5 max-w-[120px] shrink-0 truncate rounded-[7px] bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-white/65">{kisaMetin(ornek.v, 30)}</span>}
                    </button>
                  );
                })}
                {!secenekler.length && <p className="px-2 py-2 text-[12px] text-white/45">Bu aramaya uyan işlev yok.</p>}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-white/[0.07] px-3.5 py-2.5">
        <div className={cn("rounded-[12px] px-3 py-2 ring-1 ring-inset", son.hata ? "bg-rose-500/[0.07] ring-rose-400/20" : "bg-[#55d6fd]/[0.05] ring-[#55d6fd]/15")}>
          <p className={cn("flex items-center gap-2 text-[11.5px] font-medium", son.hata ? "text-rose-200" : "text-[#8be6ff]/85")}><span className="flex-1">Sonuç</span>{!son.hata && <span className="font-normal text-white/40">{turAdi(son.v)}</span>}</p>
          <p className={cn("mt-0.5 line-clamp-3 break-words text-[12.5px] leading-relaxed", son.hata ? "text-rose-200/90" : "text-white")}>{son.hata ?? kisaMetin(son.v, 220)}</p>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <button type="button" onClick={sil} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-white/55 hover:bg-rose-500/[0.1] hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" />Veriyi kaldır</button>
          <span className="flex-1" />
          <button type="button" onClick={kapat} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black"><Check className="h-3.5 w-3.5" />Tamam</button>
        </div>
      </div>
    </motion.div>,
    document.body,
  );
}
