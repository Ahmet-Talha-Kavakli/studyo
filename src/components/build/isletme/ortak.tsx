"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, ImagePlus, Loader2, Plus, X } from "lucide-react";
import { alanSinif, Anahtar } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, sahipAnahtari } from "@/lib/build/istemci";
import { GUNLER, para, type HaftaSaat, type IsletmeVeri } from "@/lib/build/isletmeTipler";
import { cn } from "@/lib/utils";

export { alanSinif };
export const yay = { type: "spring" as const, stiffness: 460, damping: 38 };
export const birincil = "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40";
export const ikincil = "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-white/[0.13] disabled:opacity-40";
export const imza = "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#55d6fd] px-4 text-[13px] font-semibold text-[#04212b] transition-opacity hover:opacity-90 disabled:opacity-40";
export const simgeDugme = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white";
/** Panelin bölge ayarı: işletmenin saat dilimi ve para birimi (useIsletme yükleyince doldurur). Panel metni Türkçe kalır. */
let BOLGE = { tz: "UTC", para: "USD" };
export const bolgeAyarla = (b: Partial<typeof BOLGE>) => { BOLGE = { ...BOLGE, ...Object.fromEntries(Object.entries(b).filter(([, v]) => v)) }; };
export const panelBolgesi = () => BOLGE;
/** Tutar, işletmenin para biriminde ("1.250 TL", "$1.250", "1.250 €"); kod verilirse o birimde. */
export const tlYaz = (n: number | null | undefined, kod?: string) => (n == null ? "" : para(Number(n), kod || BOLGE.para, "tr-TR"));
export const tarihSaat = (z: number) => new Date(z).toLocaleString("tr-TR", { timeZone: BOLGE.tz, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const tarihYaz = (z: number) => new Date(z).toLocaleDateString("tr-TR", { timeZone: BOLGE.tz, day: "numeric", month: "long", year: "numeric" });
export function gorece(z: number) {
  const d = (Date.now() - z) / 1000;
  if (d < 0) { const s = -d; if (s < 3600) return `${Math.max(1, Math.round(s / 60))} dk sonra`; if (s < 86400) return `${Math.round(s / 3600)} sa sonra`; return `${Math.round(s / 86400)} gün sonra`; }
  if (d < 60) return "az önce"; if (d < 3600) return `${Math.floor(d / 60)} dk önce`; if (d < 86400) return `${Math.floor(d / 3600)} sa önce`; if (d < 7 * 86400) return `${Math.floor(d / 86400)} gün önce`;
  return tarihYaz(z);
}

/* ───────── veri kancası ───────── */
export type IsletmeDurum = {
  veri: IsletmeVeri; site: string; yayinda: boolean; tur: string;
  servis: { eposta: boolean; ai: boolean; odeme: string | null; odemeMod: "test" | "canli"; testOrtami: boolean };
  ozet: { bekleyenSiparis: number; bugunRandevu: number; onayBekleyenRandevu: number; yazi: number; taslak: number; bekleyenYorum: number; okunmamisSohbet: number; abone: number; profilEksik: string[]; yasalEksik: string[] };
};
export type Bolum = keyof Omit<IsletmeVeri, "kuponlar" | "guncelleme">;
export function useIsletme(id: string) {
  const [d, setD] = useState<IsletmeDurum | null>(null);
  const [hata, setHata] = useState("");
  const yukle = useCallback(async () => {
    try { const x = await api<IsletmeDurum>(`/api/build/isletme/${id}`); bolgeAyarla({ tz: x.veri.profil.saatDilimi, para: x.veri.magaza.paraBirimi }); setD(x); setHata(""); } catch (e) { setHata((e as Error).message); }
  }, [id]);
  useEffect(() => { yukle(); }, [yukle]);
  const kaydet = useCallback(async <B extends Bolum>(bolum: B, deger: IsletmeVeri[B]) => {
    const r = await api<{ veri: IsletmeVeri }>(`/api/build/isletme/${id}`, { govde: { bolum, deger } });
    bolgeAyarla({ tz: r.veri.profil.saatDilimi, para: r.veri.magaza.paraBirimi });
    setD((x) => (x ? { ...x, veri: r.veri } : x));
    return r.veri;
  }, [id]);
  const veriAyarla = useCallback((v: Partial<IsletmeVeri>) => setD((x) => (x ? { ...x, veri: { ...x.veri, ...v } } : x)), []);
  return { d, hata, setHata, yukle, kaydet, veriAyarla };
}
export type IsletmeKanca = ReturnType<typeof useIsletme>;
export const isletmeApi = <T = Record<string, unknown>,>(id: string, yol: string, g?: { method?: string; govde?: unknown }) => api<T>(`/api/build/isletme/${id}${yol ? `/${yol}` : ""}`, g ?? {});

/** Ayar bölümü taslağı: asıl değer değişince taslak sıfırlanır; değişti mi ve kaydet. */
export function useTaslak<T>(asil: T, kaydet: (v: T) => Promise<unknown>) {
  const [t, setT] = useState<T>(asil);
  const [durum, setDurum] = useState<"bos" | "kaydediliyor" | "kaydedildi">("bos");
  const [hata, setHata] = useState("");
  const asilMetin = JSON.stringify(asil);
  const onceki = useRef(asilMetin);
  useEffect(() => { if (onceki.current !== asilMetin) { onceki.current = asilMetin; setT(JSON.parse(asilMetin) as T); } }, [asilMetin]);
  const degisti = JSON.stringify(t) !== asilMetin;
  const kaydetT = async () => {
    setDurum("kaydediliyor"); setHata("");
    try { await kaydet(t); setDurum("kaydedildi"); setTimeout(() => setDurum("bos"), 1800); } catch (e) { setHata((e as Error).message); setDurum("bos"); }
  };
  const d = <K extends keyof T>(k: K, v: T[K]) => setT((x) => ({ ...x, [k]: v }));
  return { t, setT, d, degisti, kaydet: kaydetT, durum, hata, sifirla: () => setT(JSON.parse(asilMetin) as T) };
}

/* ───────── atomlar ───────── */
export function Etiket({ children, alt }: { children: React.ReactNode; alt?: React.ReactNode }) {
  return <span className="mb-1.5 block text-[12.5px] font-medium text-white/75">{children}{alt && <span className="ml-1 font-normal text-white/45">{alt}</span>}</span>;
}
export function Alan({ etiket, alt, children, className }: { etiket: React.ReactNode; alt?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <label className={cn("block min-w-0 [&>div.rounded-full]:w-fit", className)}><Etiket alt={alt}>{etiket}</Etiket>{children}</label>;
}
export function Girdi(p: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cn(alanSinif, "h-10", p.className)} />;
}
export function MetinAlani(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cn(alanSinif, "min-h-[84px] resize-y py-2.5 leading-relaxed", p.className)} />;
}
/** Sayı girişi: boş bırakılabilir (null). */
export function SayiGirdi({ deger, set, bos, birim, min = 0, max, adim, className, ph }: { deger: number | null; set: (v: number | null) => void; bos?: boolean; birim?: string; min?: number; max?: number; adim?: number; className?: string; ph?: string }) {
  const [m, setM] = useState(deger == null ? "" : String(deger).replace(".", ","));
  useEffect(() => { const s = deger == null ? "" : String(deger).replace(".", ","); setM((x) => (Number(x.replace(",", ".")) === deger && x !== "" ? x : s)); }, [deger]);
  return (
    <div className={cn("relative", className)}>
      <input inputMode="decimal" value={m} placeholder={ph} onChange={(e) => {
        const s = e.target.value.replace(/[^\d,.-]/g, ""); setM(s);
        if (!s) { set(bos ? null : min); return; }
        const n = Number(s.replace(",", "."));
        if (Number.isFinite(n)) set(Math.min(max ?? Infinity, Math.max(min, adim ? Math.round(n / adim) * adim : n)));
      }} className={cn(alanSinif, "h-10 tabular-nums", birim && "pr-12")} />
      {birim && <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12.5px] text-white/45">{birim}</span>}
    </div>
  );
}
export function Rozet({ children, ton = "notr", className }: { children: React.ReactNode; ton?: "notr" | "imza" | "iyi" | "uyari" | "kotu"; className?: string }) {
  const s = { notr: "bg-white/[0.07] text-white/65", imza: "bg-[#55d6fd]/[0.14] text-[#8be6ff]", iyi: "bg-emerald-400/[0.12] text-emerald-200", uyari: "bg-amber-400/[0.13] text-amber-200", kotu: "bg-rose-500/[0.14] text-rose-200" }[ton];
  return <span className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium", s, className)}>{children}</span>;
}
export function HataSatiri({ mesaj, kapat }: { mesaj: string; kapat?: () => void }) {
  if (!mesaj) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-[14px] bg-rose-500/[0.09] px-3.5 py-2.5 text-[13px] text-rose-100 ring-1 ring-inset ring-rose-400/20">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" /><span className="min-w-0 flex-1">{mesaj}</span>
      {kapat && <button type="button" onClick={kapat} aria-label="Kapat" className="text-rose-200/70 hover:text-white"><X className="h-4 w-4" /></button>}
    </div>
  );
}
export function BilgiSatiri({ children, ton = "notr", ikon: I }: { children: React.ReactNode; ton?: "notr" | "uyari" | "imza"; ikon?: React.ElementType }) {
  return (
    <div className={cn("flex items-start gap-2.5 rounded-[14px] px-3.5 py-2.5 text-[13px] leading-relaxed ring-1 ring-inset", ton === "uyari" ? "bg-amber-400/[0.07] text-amber-100/90 ring-amber-300/15" : ton === "imza" ? "bg-[#55d6fd]/[0.07] text-[#c9f3ff] ring-[#55d6fd]/15" : "bg-white/[0.03] text-white/70 ring-white/[0.07]")}>
      {I && <I className="mt-0.5 h-4 w-4 shrink-0" />}<div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
/** Kayıt düğmesi ve durum (Kart altSerit için). */
export function KaydetSeridi({ degisti, durum, kaydet, sifirla, hata, ek }: { degisti: boolean; durum: "bos" | "kaydediliyor" | "kaydedildi"; kaydet: () => void; sifirla?: () => void; hata?: string; ek?: React.ReactNode }) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      {hata ? <span className="min-w-0 flex-1 text-[12.5px] text-rose-200">{hata}</span> : <span className="min-w-0 flex-1 text-[12.5px] text-white/45">{durum === "kaydedildi" ? <span className="inline-flex items-center gap-1 text-[#8be6ff]"><Check className="h-3.5 w-3.5" />Kaydedildi</span> : degisti ? "Kaydedilmemiş değişiklik var" : "Değişiklikler kaydedildi"}</span>}
      {ek}
      {sifirla && degisti && <button type="button" onClick={sifirla} className={ikincil}>Vazgeç</button>}
      <button type="button" disabled={!degisti || durum === "kaydediliyor"} onClick={kaydet} className={birincil}>{durum === "kaydediliyor" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Kaydet</button>
    </div>
  );
}

/** Seçenek çipleri ve "Özel" değer: seçili çip beyaz halkalı. */
export function SecenekCipleri<T extends string | number>({ deger, set, l, ozel, birim, ozelTur = "sayi" }: { deger: T; set: (v: T) => void; l: { id: T; ad: string }[]; ozel?: boolean; birim?: string; ozelTur?: "sayi" | "metin" }) {
  const listede = l.some((x) => x.id === deger);
  const [ozelAcik, setOzelAcik] = useState(!listede);
  const kimlikler = l.map((x) => String(x.id)).join("|");
  useEffect(() => { setOzelAcik(!kimlikler.split("|").includes(String(deger))); }, [deger, kimlikler]);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {l.map((x) => (
        <button key={String(x.id)} type="button" onClick={() => { setOzelAcik(false); set(x.id); }} className={cn("h-8 rounded-full px-3 text-[12.5px] font-medium transition-colors", deger === x.id && !ozelAcik ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.05] text-white/70 hover:bg-white/[0.09] hover:text-white")}>{x.ad}</button>
      ))}
      {ozel && (
        <button type="button" onClick={() => setOzelAcik(true)} className={cn("h-8 rounded-full px-3 text-[12.5px] font-medium transition-colors", ozelAcik ? "bg-white/[0.1] text-white ring-2 ring-white" : "bg-white/[0.05] text-white/70 hover:bg-white/[0.09] hover:text-white")}>Özel</button>
      )}
      {ozel && ozelAcik && (
        ozelTur === "sayi"
          ? <SayiGirdi deger={typeof deger === "number" ? deger : null} set={(v) => set((v ?? 0) as T)} birim={birim} className="w-[120px]" />
          : <Girdi value={String(deger ?? "")} onChange={(e) => set(e.target.value as T)} className="h-8 w-[180px]" placeholder="Yaz" />
      )}
    </div>
  );
}

/** Boş durum: üst üste kart yelpazesi ve iki eylem. */
export function BosDurum({ ikon: I, baslik, alt, birincilEylem, ikincilEylem, gorseller }: { ikon: React.ElementType; baslik: string; alt: string; birincilEylem?: { ad: string; tikla: () => void; ikon?: React.ElementType }; ikincilEylem?: { ad: string; tikla: () => void }; gorseller?: string[] }) {
  const g = (gorseller ?? []).slice(0, 3);
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <div className="relative mb-5 h-[92px] w-[170px]">
        {[0, 1, 2].map((i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            style={{ rotate: (i - 1) * 9, left: 32 + (i - 1) * 40, zIndex: i === 1 ? 2 : 1 }}
            className="absolute top-1 h-[84px] w-[104px] overflow-hidden rounded-[16px] bg-[#1b1d21] ring-1 ring-inset ring-white/[0.1]">
            {g[i] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={g[i]} alt="" className="h-full w-full object-cover opacity-80" />
              : <div className="flex h-full flex-col gap-1.5 p-2.5"><div className="h-2 w-12 rounded-full bg-white/[0.12]" /><div className="h-2 w-16 rounded-full bg-white/[0.07]" /><div className="mt-auto h-6 rounded-[8px] bg-[#55d6fd]/[0.14]" /></div>}
          </motion.div>
        ))}
        <span className="absolute -bottom-1 left-1/2 z-[3] flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-[12px] bg-white text-black"><I className="h-[18px] w-[18px]" /></span>
      </div>
      <p className="text-[15.5px] font-semibold text-white">{baslik}</p>
      <p className="mt-1 max-w-[420px] text-[13px] leading-relaxed text-white/55">{alt}</p>
      {(birincilEylem || ikincilEylem) && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {birincilEylem && <button type="button" onClick={birincilEylem.tikla} className={birincil}>{birincilEylem.ikon ? <birincilEylem.ikon className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{birincilEylem.ad}</button>}
          {ikincilEylem && <button type="button" onClick={ikincilEylem.tikla} className={ikincil}>{ikincilEylem.ad}</button>}
        </div>
      )}
    </div>
  );
}

/** İstatistik satırı (dl). */
export function Istatistikler({ l, className }: { l: { ad: string; deger: React.ReactNode; alt?: React.ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-[18px] bg-white/[0.06] ring-1 ring-inset ring-white/[0.07] sm:grid-cols-4", className)}>
      {l.map((x) => (
        <div key={x.ad} className="min-w-0 bg-[#121315] px-4 py-3.5">
          <dt className="truncate text-[12px] text-white/50">{x.ad}</dt>
          <dd className="mt-1 truncate text-[20px] font-semibold tracking-[-0.02em] text-white tabular-nums">{x.deger}</dd>
          {x.alt && <dd className="mt-0.5 truncate text-[11.5px] text-white/45">{x.alt}</dd>}
        </div>
      ))}
    </dl>
  );
}

/* ───────── görsel yükleme (Vayra Bulut depolama, "isletme" kovası) ───────── */
async function kovaHazir(id: string) {
  const r = await api<{ kovalar: { ad: string }[] }>(`/api/build/depolama/${id}`);
  if (!r.kovalar.some((k) => k.ad === "isletme")) await api(`/api/build/depolama/${id}`, { govde: { ad: "isletme", okuma: "herkes", yukleme: "kapali", boyutMb: 8, turler: ["image/"] } });
}
export async function gorselYukle(id: string, f: File): Promise<string> {
  if (!f.type.startsWith("image/")) throw new Error("Yalnız görsel yüklenebilir.");
  if (f.size > 8 * 1024 * 1024) throw new Error("Görsel en çok 8 MB olabilir.");
  await kovaHazir(id);
  const fd = new FormData(); fd.append("dosya", f);
  const r = await fetch(`/api/build/depolama/${id}/isletme`, { method: "POST", headers: { "x-build-sahip": sahipAnahtari() }, body: fd });
  const j = (await r.json().catch(() => ({}))) as { ok?: boolean; adres?: string; hata?: string };
  if (!r.ok || !j.adres) throw new Error(j.hata ?? "Görsel yüklenemedi.");
  return j.adres;
}
export function GorselAlani({ projeId, deger, set, oran = "aspect-square", etiket = "Görsel", className }: { projeId: string; deger: string; set: (v: string) => void; oran?: string; etiket?: string; className?: string }) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const g = useRef<HTMLInputElement>(null);
  return (
    <div className={className}>
      <button type="button" onClick={() => g.current?.click()} className={cn("group relative flex w-full items-center justify-center overflow-hidden rounded-[16px] bg-white/[0.04] ring-1 ring-inset ring-white/[0.1] transition-colors hover:bg-white/[0.07]", oran)} aria-label={`${etiket} yükle`}>
        {deger ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={deger} alt="" className="absolute inset-0 h-full w-full object-cover" />
          : <span className="flex flex-col items-center gap-1.5 text-[12px] text-white/50"><ImagePlus className="h-5 w-5" />{etiket}</span>}
        {deger && <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[12px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">Değiştir</span>}
        {yukleniyor && <span className="absolute inset-0 flex items-center justify-center bg-black/50"><Loader2 className="h-5 w-5 animate-spin text-white" /></span>}
      </button>
      <input ref={g} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; setYukleniyor(true); setHata(""); try { set(await gorselYukle(projeId, f)); } catch (x) { setHata((x as Error).message); } finally { setYukleniyor(false); } }} />
      {hata && <p className="mt-1 text-[11.5px] text-rose-200">{hata}</p>}
      {deger && <button type="button" onClick={() => set("")} className="mt-1 text-[11.5px] text-white/45 hover:text-white">Kaldır</button>}
    </div>
  );
}

/** Kısa süreli bildirim (sağ altta). */
export function useBildirim() {
  const [m, setM] = useState<{ metin: string; ton: "iyi" | "kotu" } | null>(null);
  const goster = useCallback((metin: string, ton: "iyi" | "kotu" = "iyi") => { setM({ metin, ton }); setTimeout(() => setM(null), 3200); }, []);
  const ogesi = (
    <AnimatePresence>
      {m && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className={cn("fixed bottom-5 left-1/2 z-[140] flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium ring-1 ring-inset", m.ton === "iyi" ? "bg-[#16181b] text-white ring-white/[0.12]" : "bg-[#2a1418] text-rose-100 ring-rose-400/25")}>
          {m.ton === "iyi" ? <Check className="h-4 w-4 text-[#55d6fd]" /> : <AlertTriangle className="h-4 w-4 text-rose-300" />}{m.metin}
        </motion.div>
      )}
    </AnimatePresence>
  );
  return { goster, ogesi };
}

/** Haftalık saat düzenleyici (7 satır: açık/kapalı, açılış, kapanış, isteğe bağlı mola). */
export function HaftaDuzenleyici({ deger, set }: { deger: HaftaSaat; set: (v: HaftaSaat) => void }) {
  const d = (i: number, p: Partial<HaftaSaat[number]>) => set(deger.map((g, j) => (j === i ? { ...g, ...p } : g)));
  return (
    <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
      {deger.map((g, i) => (
        <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-2.5">
          <span className="w-[92px] text-[13px] font-medium text-white">{GUNLER[i]}</span>
          <Anahtar acik={g.acik} set={(v) => d(i, { acik: v })} etiket={`${GUNLER[i]} açık`} />
          {g.acik ? (
            <div className="flex flex-wrap items-center gap-2">
              <input type="time" value={g.bas} onChange={(e) => d(i, { bas: e.target.value })} className={cn(alanSinif, "h-9 w-[104px] tabular-nums")} aria-label="Açılış" />
              <span className="text-white/40">ile</span>
              <input type="time" value={g.bit} onChange={(e) => d(i, { bit: e.target.value })} className={cn(alanSinif, "h-9 w-[104px] tabular-nums")} aria-label="Kapanış" />
              {g.molaBas ? (
                <span className="flex items-center gap-1.5 text-[12px] text-white/55">mola
                  <input type="time" value={g.molaBas} onChange={(e) => d(i, { molaBas: e.target.value })} className={cn(alanSinif, "h-9 w-[100px]")} aria-label="Mola başlangıcı" />
                  <input type="time" value={g.molaBit} onChange={(e) => d(i, { molaBit: e.target.value })} className={cn(alanSinif, "h-9 w-[100px]")} aria-label="Mola bitişi" />
                  <button type="button" onClick={() => d(i, { molaBas: undefined, molaBit: undefined })} className={simgeDugme} aria-label="Molayı kaldır"><X className="h-3.5 w-3.5" /></button>
                </span>
              ) : <button type="button" onClick={() => d(i, { molaBas: "12:30", molaBit: "13:30" })} className="text-[12px] text-white/45 hover:text-white">Mola ekle</button>}
            </div>
          ) : <span className="text-[12.5px] text-white/40">Kapalı</span>}
          {i === 0 && <button type="button" onClick={() => set(deger.map((x, j) => (j < 5 ? { ...deger[0] } : x)))} className="ml-auto text-[12px] text-white/45 hover:text-white">Hafta içine uygula</button>}
        </div>
      ))}
    </div>
  );
}

/** Geri alınamaz işlemde satır içi onay: ilk tık soruyu açar, "Evet" işlemi yapar (tarayıcı penceresi açılmaz). */
export function OnayliDugme({ children, soru, onayla, className, disabled, ad }: { children: React.ReactNode; soru: string; onayla: () => void; className?: string; disabled?: boolean; ad?: string }) {
  const [s, setS] = useState(false);
  if (s) return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-[14px] bg-rose-500/[0.1] py-1 pl-3 pr-1 text-[12.5px] text-rose-100 ring-1 ring-inset ring-rose-400/20">
      <span className="min-w-0">{soru}</span>
      <button type="button" onClick={() => { setS(false); onayla(); }} className="h-7 rounded-full bg-rose-500/85 px-3 text-[12.5px] font-semibold text-white">Evet</button>
      <button type="button" onClick={() => setS(false)} className="h-7 rounded-full px-2.5 text-[12.5px] text-white/70 hover:text-white">Vazgeç</button>
    </span>
  );
  return <button type="button" disabled={disabled} aria-label={ad} onClick={() => setS(true)} className={className}>{children}</button>;
}
