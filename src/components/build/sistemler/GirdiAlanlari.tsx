"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Loader2, Play, Plus, Trash2 } from "lucide-react";
import { AcilirSecim, Anahtar, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { GIRDI_TURLERI, girdiDogrula, type GirdiAlani } from "@/lib/build/sistemKatalog";
import { cn } from "@/lib/utils";
import { YanPanel } from "./ortak";

/**
 * Girdi alanları: elle çalıştırma formu, Sistemi çağır adımı, API ve MCP aracının şeması aynı listeden oluşur.
 * Ad JSON anahtarıdır ({{tetik.ad}}); etiket formda görünen addır.
 */
export function GirdiAlanlariDuzenleyici({ l, set }: { l: GirdiAlani[]; set: (l: GirdiAlani[]) => void }) {
  const d = (i: number, p: Partial<GirdiAlani>) => set(l.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const tasi = (i: number, y: number) => { const c = [...l]; const [x] = c.splice(i, 1); c.splice(i + y, 0, x); set(c); };
  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {l.map((x, i) => (
          <motion.div key={i} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="space-y-2 rounded-[14px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.06]">
            <div className="flex gap-1.5">
              <input value={x.ad} onChange={(e) => d(i, { ad: e.target.value.replace(/[^A-Za-z0-9_]/g, "").slice(0, 40) })} placeholder="alan_adi" aria-label="Alan adı" className={cn(alanSinif, "sc-kod h-9 min-w-0 flex-1 text-[13px]")} />
              <div className="w-[138px] shrink-0"><AcilirSecim deger={x.tur} set={(v) => d(i, { tur: v as GirdiAlani["tur"] })} l={GIRDI_TURLERI.map((t) => ({ id: t.id, ad: t.ad }))} /></div>
            </div>
            <input value={x.etiket ?? ""} onChange={(e) => d(i, { etiket: e.target.value.slice(0, 80) || undefined })} placeholder="Formda görünen ad, ör. Müşteri adı" className={cn(alanSinif, "h-9 text-[13px]")} />
            <input value={x.aciklama ?? ""} onChange={(e) => d(i, { aciklama: e.target.value.slice(0, 300) || undefined })} placeholder="Açıklama (araçta yapay zekâ bunu okur)" className={cn(alanSinif, "h-9 text-[13px]")} />
            {x.tur !== "gizli" && x.tur !== "evet-hayir" && x.tur !== "secim" && x.tur !== "coklu" && <input value={x.yer ?? ""} onChange={(e) => d(i, { yer: e.target.value.slice(0, 120) || undefined })} placeholder="Yer tutucu metin (form sayfasında kutunun içinde)" className={cn(alanSinif, "h-9 text-[13px]")} />}
            {x.tur === "gizli" && <p className="rounded-[12px] bg-white/[0.03] px-3 py-2 text-[11.5px] leading-relaxed text-white/50">Form sayfasında görünmez. Değer adresteki aynı adlı sorgu parametresinden (ör. ?{x.ad || "kaynak"}=instagram) ya da varsayılandan gelir.</p>}
            {(x.tur === "secim" || x.tur === "coklu") && <input value={(x.secenekler ?? []).join(", ")} onChange={(e) => d(i, { secenekler: e.target.value.split(",").map((z) => z.trim()).filter(Boolean).slice(0, 30) })} placeholder="Seçenekler, virgülle: düşük, orta, yüksek" className={cn(alanSinif, "h-9 text-[13px]")} />}
            <div className="flex flex-wrap items-center gap-2">
              <input value={x.varsayilan ?? ""} onChange={(e) => d(i, { varsayilan: e.target.value.slice(0, 500) || undefined })} placeholder="Varsayılan değer" className={cn(alanSinif, "h-9 min-w-0 flex-1 text-[13px]")} />
              <label className="flex h-9 items-center gap-2 rounded-[12px] bg-white/[0.03] px-2.5 text-[12.5px] text-white/70">Zorunlu<Anahtar acik={!!x.zorunlu} etiket="Zorunlu" set={(v) => d(i, { zorunlu: v || undefined })} /></label>
              <button type="button" disabled={i === 0} onClick={() => tasi(i, -1)} aria-label="Yukarı taşı" className="flex h-8 w-8 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.07] disabled:opacity-25"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button type="button" disabled={i === l.length - 1} onClick={() => tasi(i, 1)} aria-label="Aşağı taşı" className="flex h-8 w-8 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.07] disabled:opacity-25"><ArrowDown className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => set(l.filter((_, j) => j !== i))} aria-label="Alanı sil" className="flex h-8 w-8 items-center justify-center rounded-full text-white/45 hover:bg-rose-500/[0.1] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {l.length < 30 && <button type="button" onClick={() => set([...l, { ad: `alan${l.length + 1}`, tur: "metin" }])} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/75 hover:bg-white/[0.1]"><Plus className="h-3.5 w-3.5" />Girdi alanı ekle</button>}
    </div>
  );
}

/** Tek alanın form girişi. */
function AlanGirisi({ a, v, set }: { a: GirdiAlani; v: unknown; set: (v: unknown) => void }) {
  const s = v === undefined || v === null ? "" : String(v);
  if (a.tur === "evet-hayir") return <label className="flex h-11 items-center justify-between gap-3 rounded-[14px] bg-white/[0.04] px-3.5 ring-1 ring-inset ring-white/[0.08]"><span className="text-[13.5px] text-white/80">{s === "true" ? "Evet" : "Hayır"}</span><Anahtar acik={s === "true"} etiket={a.etiket || a.ad} set={(x) => set(x)} /></label>;
  if (a.tur === "secim" && a.secenekler?.length) return <AcilirSecim deger={s} set={set} l={a.secenekler.map((x) => ({ id: x, ad: x }))} bos="Seç" />;
  if (a.tur === "coklu") { const sec = Array.isArray(v) ? (v as string[]) : s ? s.split(",").map((x) => x.trim()) : []; return <div className="flex flex-wrap gap-1.5">{(a.secenekler ?? []).map((x) => { const on = sec.includes(x); return <button key={x} type="button" aria-pressed={on} onClick={() => set(on ? sec.filter((y) => y !== x) : [...sec, x])} className={cn("rounded-full px-3 py-1.5 text-[13px] transition", on ? "bg-white/[0.1] text-white ring-2 ring-inset ring-white" : "bg-white/[0.05] text-white/70 ring-1 ring-inset ring-white/[0.08]")}>{x}</button>; })}</div>; }
  if (a.tur === "uzunMetin") return <textarea value={s} onChange={(e) => set(e.target.value)} rows={4} className={cn(alanSinif, "cam-istemci resize-y py-2.5 text-[14px]")} />;
  return <input value={s} onChange={(e) => set(e.target.value)} type={a.tur === "sayi" ? "number" : a.tur === "tarih" ? "date" : a.tur === "eposta" ? "email" : a.tur === "telefon" ? "tel" : "text"} placeholder={a.yer} className={cn(alanSinif, "cam-istemci h-11 text-[14px] [color-scheme:dark]")} />;
}

/** Girdi formuyla çalıştır: sağdan açılan panel; alanlar doğrulanır, değerler türüne çevrilir. */
export function GirdiFormu({ acik, kapat, alanlar, baslangic, gonder, baslik, alt, dugme = "Çalıştır" }: { acik: boolean; kapat: () => void; alanlar: GirdiAlani[]; baslangic?: unknown; gonder: (v: Record<string, unknown>) => Promise<void>; baslik: string; alt?: string; dugme?: string }) {
  const [v, setV] = useState<Record<string, unknown>>({});
  const [hatalar, setHatalar] = useState<string[]>([]);
  const [gidiyor, setGidiyor] = useState(false);
  useEffect(() => {
    if (!acik) return;
    const b = baslangic && typeof baslangic === "object" && !Array.isArray(baslangic) ? baslangic as Record<string, unknown> : {};
    setV(Object.fromEntries(alanlar.map((a) => [a.ad, b[a.ad] ?? a.varsayilan ?? (a.tur === "evet-hayir" ? false : "")])));
    setHatalar([]); setGidiyor(false);
  }, [acik]); // eslint-disable-line react-hooks/exhaustive-deps
  const calistir = async () => {
    const g = girdiDogrula(alanlar, v);
    setHatalar(g.hatalar);
    if (g.hatalar.length) return;
    setGidiyor(true);
    try { await gonder(g.veri); kapat(); } catch (e) { setHatalar([(e as Error).message || "Çalıştırılamadı."]); } finally { setGidiyor(false); }
  };
  return (
    <YanPanel acik={acik} kapat={kapat} baslik={baslik} alt={alt ?? "Alanları doldur; değerler tetik verisi olarak gelir"} genislik={460}
      alt2={<><button type="button" onClick={calistir} disabled={gidiyor} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black disabled:opacity-50">{gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}{dugme}</button><button type="button" onClick={kapat} className="h-10 rounded-full px-4 text-[13.5px] text-white/65 hover:bg-white/[0.06]">Vazgeç</button></>}>
      <div className="space-y-4">
        {alanlar.map((a) => (
          <div key={a.ad}>
            <div className="mb-1.5 flex items-center gap-2"><span className="text-[13px] font-medium text-white/85">{a.etiket || a.ad}</span>{a.zorunlu && <span className="rounded-full bg-white/[0.07] px-1.5 py-px text-[10.5px] text-white/55">Zorunlu</span>}<span className="ml-auto text-[11.5px] text-white/35">{GIRDI_TURLERI.find((t) => t.id === a.tur)?.ad}</span></div>
            <AlanGirisi a={a} v={v[a.ad]} set={(x) => setV((y) => ({ ...y, [a.ad]: x }))} />
            {a.aciklama && <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/45">{a.aciklama}</p>}
          </div>
        ))}
        {hatalar.length > 0 && <div className="rounded-[14px] bg-rose-500/[0.07] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-rose-200 ring-1 ring-inset ring-rose-400/15">{hatalar.join(", ")}.</div>}
      </div>
    </YanPanel>
  );
}
