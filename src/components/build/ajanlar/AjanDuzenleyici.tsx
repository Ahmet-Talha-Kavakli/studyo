"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  AlertTriangle, ArrowLeft, Brain, Check, ChevronDown, Copy, Info, Loader2, MessageSquare, MoreHorizontal, Plug, Plus, RotateCcw, Rocket, ScrollText, Sparkles, Trash2, Upload, Wrench, X,
} from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { ModelSecici } from "@/components/build/ModelSecici";
import { SohbetleDuzenle } from "./SohbetleDuzenle";
import { Suzgec } from "@/components/build/ana/Bolumler";
import { CalismaPaneli, Calismalar } from "./Calismalar";
import { DeneSohbet } from "./DeneSohbet";
import { Tetikler } from "./Tetikler";
import { Konusmalar } from "./Konusmalar";
import { DevirKarti, EkipKarti, KorumaKarti, Onaylar } from "./KurulumEk";
import { SurumBolumu } from "./Surumler";
import { KanallarBolumu } from "./Kanallar";
import { Analitik } from "./Analitik";
import { Bilgi } from "./Bilgi";
import { Bellek } from "./Bellek";
import { KutuAyarlari } from "./KutuAyarlari";
import { Testler } from "./Testler";
import { KonuKarti, YonlendirmeKarti } from "./Yonlendirme";
import { Bosluklar } from "./Bosluklar";
import { ProsedurKarti } from "./Prosedurler";
import { IsletmeKarti } from "./IsletmeKarti";
import { studyoYenile } from "@/components/build/kabuk/useStudyo";
import { AJAN_SIMGELERI, ARAC_KATALOG, ARAC_KATEGORI, type AracIzni, type AracKategori } from "@/lib/build/ajanKatalog";
import { YETENEK_KATALOGU } from "@/lib/build/yetenekKatalog";
import { BAGLANTI_KATALOGU } from "@/lib/build/baglantiKatalog";
import { api, ApiHatasi } from "@/lib/build/istemci";
import { modelBul } from "@/lib/build/modeller";
import { cn } from "@/lib/utils";
import { AjanSimge, ajanlaSohbet, type Ajan } from "./ortak";

const yay = { type: "spring" as const, stiffness: 460, damping: 38 };

/** Kayan beyaz seçimli küçük bölümlü düğme grubu. */
export function Secici<T extends string>({ id, deger, set, l, kucuk }: { id: string; deger: T; set: (v: T) => void; l: { id: T; ad: string; ipucu?: string; kapali?: boolean }[]; kucuk?: boolean }) {
  return (
    <LayoutGroup id={id}>
      <div className="flex shrink-0 rounded-full bg-white/[0.07] p-0.5">
        {l.map((x) => (
          <button key={x.id} type="button" title={x.ipucu} disabled={x.kapali} onClick={() => set(x.id)}
            className={cn("relative rounded-full font-medium transition-colors disabled:opacity-30", kucuk ? "h-7 px-2.5 text-[12px]" : "h-8 px-3 text-[12.5px]", deger === x.id ? "text-black" : "text-white/60 enabled:hover:text-white")}>
            {deger === x.id && <motion.span layoutId={`${id}-z`} transition={yay} className="absolute inset-0 rounded-full bg-white" />}
            <span className="relative whitespace-nowrap">{x.ad}</span>
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

export function Anahtar({ acik, set, etiket }: { acik: boolean; set: (v: boolean) => void; etiket: string }) {
  return (
    <button type="button" role="switch" aria-checked={acik} aria-label={etiket} onClick={() => set(!acik)} className={cn("relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55d6fd]", acik ? "bg-[#55d6fd]" : "bg-white/[0.14] hover:bg-white/[0.2]")}>
      <motion.span layout transition={yay} className={cn("absolute top-[3px] h-5 w-5 rounded-full bg-white", acik ? "right-[3px]" : "left-[3px]")} />
    </button>
  );
}

/** Açılır seçim: tam genişlik düğme, sabit konumlu menü (panel kenarında kesilmez), seçili satır beyaz çerçeveli (tik yok). */
export function AcilirSecim({ deger, set, l, bos }: { deger: string; set: (v: string) => void; l: { id: string; ad: string; alt?: string; gorsel?: string }[]; bos?: string }) {
  const [acik, setAcik] = useState(false);
  const [konum, setKonum] = useState<{ sol: number; en: number; ust?: number; alt?: number; boy: number }>({ sol: 0, en: 280, boy: 320 });
  const kok = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!acik) return;
    const f = (e: MouseEvent) => { if (!kok.current?.contains(e.target as Node)) setAcik(false); };
    const t = (e: KeyboardEvent) => { if (e.key === "Escape") setAcik(false); };
    addEventListener("mousedown", f); addEventListener("keydown", t); addEventListener("resize", () => setAcik(false), { once: true });
    return () => { removeEventListener("mousedown", f); removeEventListener("keydown", t); };
  }, [acik]);
  const ac = () => {
    const r = kok.current?.getBoundingClientRect();
    if (r) { const asagi = innerHeight - r.bottom - 16, yukari = r.top - 16; const yk = asagi < 260 && yukari > asagi; setKonum({ sol: r.left, en: r.width, ...(yk ? { alt: innerHeight - r.top + 6 } : { ust: r.bottom + 6 }), boy: Math.min(320, Math.max(160, yk ? yukari : asagi)) }); }
    setAcik((x) => !x);
  };
  const sec = l.find((x) => x.id === deger);
  const secenekler = bos !== undefined ? [{ id: "", ad: bos }, ...l] : l;
  return (
    <div ref={kok} className="relative">
      <button type="button" aria-haspopup="listbox" aria-expanded={acik} onClick={ac} className={cn(alanSinif, "flex h-10 items-center gap-2 text-left text-[13.5px]", acik && "ring-white/30")}>
        {sec?.gorsel && /* eslint-disable-next-line @next/next/no-img-element */ <img src={sec.gorsel} alt="" className="h-6 w-6 shrink-0 rounded-[7px] object-cover" />}
        <span className={cn("min-w-0 flex-1 truncate", !sec && "text-white/45")}>{sec?.ad ?? bos ?? "Seç"}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/40 transition-transform", acik && "rotate-180")} />
      </button>
      <AnimatePresence>
        {acik && (
          <motion.div role="listbox" initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.14 }}
            style={{ left: konum.sol, width: konum.en, top: konum.ust, bottom: konum.alt, maxHeight: konum.boy }} className="bd-panel fixed z-[130] overflow-y-auto rounded-[16px] p-1.5 [scrollbar-width:thin]">
            {secenekler.map((x) => (
              <button key={x.id || "_bos"} type="button" role="option" aria-selected={x.id === deger} onClick={() => { set(x.id); setAcik(false); }}
                className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left transition-colors", x.id === deger ? "bg-white/[0.08] ring-1 ring-inset ring-white/60" : "hover:bg-white/[0.06]")}>
                {"gorsel" in x && x.gorsel && /* eslint-disable-next-line @next/next/no-img-element */ <img src={x.gorsel} alt="" className="h-7 w-7 shrink-0 rounded-[8px] object-cover" />}
                <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] text-white">{x.ad}</span>{"alt" in x && x.alt && <span className="block truncate text-[12px] text-white/45">{x.alt}</span>}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const alanSinif = "w-full rounded-[14px] bg-white/[0.05] px-3.5 text-[14px] text-white outline-none ring-1 ring-inset ring-white/[0.08] transition-shadow placeholder:text-white/30 focus:ring-white/30";

/** Görseli kare 256 px'e küçültüp data URL yapar. */
export async function kareGorsel(f: File): Promise<string | null> {
  if (!f.type.startsWith("image/")) return null;
  const u = URL.createObjectURL(f);
  try {
    const img = await new Promise<HTMLImageElement>((ok, red) => { const i = new Image(); i.onload = () => ok(i); i.onerror = red; i.src = u; });
    const k = Math.min(img.width, img.height);
    const c = document.createElement("canvas"); c.width = 256; c.height = 256;
    c.getContext("2d")!.drawImage(img, (img.width - k) / 2, (img.height - k) / 2, k, k, 0, 0, 256, 256);
    return c.toDataURL("image/webp", 0.86);
  } catch { return null; } finally { URL.revokeObjectURL(u); }
}

/* ───────────── Kimlik ───────────── */
function Kimlik({ a, d }: { a: Ajan; d: (p: Partial<Ajan>) => void }) {
  const [secici, setSecici] = useState(false);
  const dosya = useRef<HTMLInputElement>(null);
  return (
    <Kart ikon={Sparkles} baslik="Kimlik" alt="Adı, simgesi ve ne yaptığı" govde="p-4 sm:p-5">
      <div className="flex gap-4">
        <div className="relative shrink-0">
          <button type="button" onClick={() => setSecici((x) => !x)} className="group relative block rounded-[24px]" aria-label="Simgeyi değiştir">
            <AjanSimge src={a.simge} boyut={84} />
            <span className="absolute inset-0 flex items-center justify-center rounded-[24px] bg-black/50 text-[12px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">Değiştir</span>
          </button>
        </div>
        <div className="min-w-0 flex-1 space-y-2.5">
          <input value={a.ad} onChange={(e) => d({ ad: e.target.value })} maxLength={60} placeholder="Ajanın adı" className={cn(alanSinif, "h-11 text-[16px] font-semibold")} />
          <input value={a.aciklama} onChange={(e) => d({ aciklama: e.target.value })} maxLength={300} placeholder="Ne yapar? Tek cümle (sohbet başında ve dizinde görünür)" className={cn(alanSinif, "h-11")} />
        </div>
      </div>
      <AnimatePresence initial={false}>
        {secici && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-4 rounded-[18px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-[repeat(13,minmax(0,1fr))]">
                <button type="button" onClick={() => dosya.current?.click()} className="flex aspect-square items-center justify-center rounded-[14px] bg-white/[0.06] text-white/70 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.1] hover:text-white" title="Kendi görselini yükle"><Upload className="h-4 w-4" /></button>
                {AJAN_SIMGELERI.map((g) => (
                  <button key={g} type="button" onClick={() => { d({ simge: g }); setSecici(false); }} className={cn("overflow-hidden rounded-[14px] ring-2 transition", a.simge === g ? "ring-white" : "ring-transparent hover:ring-white/30")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g} alt="" className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
              <input ref={dosya} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; const u = await kareGorsel(f); if (u) { d({ simge: u }); setSecici(false); } }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Kart>
  );
}

/* ───────────── Talimat ───────────── */
const PARCALAR: { ad: string; metin: string }[] = [
  { ad: "Rol", metin: "Sen deneyimli bir … uzmanısın. Amacın …" },
  { ad: "Adımlar", metin: "Çalışma biçimin:\n1. …\n2. …\n3. …" },
  { ad: "Ton", metin: "Ton: samimi ama profesyonel; kısa cümleler; teknik terimleri açıkla." },
  { ad: "Sınırlar", metin: "Yapmayacakların: emin olmadığın bilgiyi kesin gibi sunma; kişisel veri isteme; konu dışı isteklerde kibarca yönlendir." },
  { ad: "Çıktı biçimi", metin: "Cevap biçimi: önce 2 cümlelik özet, sonra maddeler; gerekirse tablo." },
];
function Talimat({ a, d }: { a: Ajan; d: (p: Partial<Ajan>) => void }) {
  const alan = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const t = alan.current; if (t) { t.style.height = "0px"; t.style.height = `${Math.max(220, Math.min(t.scrollHeight + 2, 640))}px`; } }, [a.talimat]);
  const ekle = (m: string) => d({ talimat: a.talimat.trim() ? `${a.talimat.trimEnd()}\n\n${m}` : m });
  return (
    <Kart ikon={ScrollText} baslik="Talimat" alt="Ajanın rolü, nasıl çalışacağı ve sınırları"
      sag={<span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] tabular-nums text-white/45">{a.talimat.length.toLocaleString("tr-TR")} karakter</span>} govde="p-4 sm:p-5">
      <textarea ref={alan} value={a.talimat} onChange={(e) => d({ talimat: e.target.value })} maxLength={32000} spellCheck={false}
        placeholder={"Sen … konusunda uzman bir asistansın.\n\nÇalışma biçimin:\n1. …\n2. …\n\nSınırların: …"}
        className={cn(alanSinif, "block resize-none py-3 text-[14px] leading-[1.65]")} />
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[12px] text-white/40">Parça ekle</span>
        {PARCALAR.map((p) => <button key={p.ad} type="button" onClick={() => ekle(p.metin)} className="inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/70 ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.1] hover:text-white"><Plus className="h-3 w-3" />{p.ad}</button>)}
      </div>
    </Kart>
  );
}

/* ───────────── Model ───────────── */
function ModelBolumu({ a, d, baglantilar }: { a: Ajan; d: (p: Partial<Ajan>) => void; baglantilar?: Record<string, string | null> }) {
  const m = modelBul(a.model);
  const claudeAraclari = ARAC_KATALOG.filter((t) => t.yalnizClaude && (a.araclar[t.id] ?? "kapali") !== "kapali");
  const bagli = baglantilar ? baglantilar[m.id] !== null || m.saglayici === "anthropic" && baglantilar[m.id] !== null : true;
  return (
    <Kart ikon={Brain} baslik="Model" alt="Ajanın düşünürken kullandığı yapay zekâ" govde="p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-full bg-white/[0.05] p-1 ring-1 ring-inset ring-white/[0.08]"><ModelSecici deger={a.model} sec={(x) => d({ model: x })} baglantilar={baglantilar} /></div>
        <span className="ml-auto flex items-center gap-2 text-[12.5px] text-white/45">Düşünme
          <Secici id="efor" deger={a.efor} set={(e) => d({ efor: e })} l={[{ id: "low", ad: "Hızlı", ipucu: "Kısa düşünür, hızlı ve ucuz" }, { id: "medium", ad: "Dengeli" }, { id: "high", ad: "Derin", ipucu: "Zor işlerde daha uzun düşünür" }]} />
        </span>
      </div>
      <div className="mt-3.5 flex flex-wrap items-center gap-3 rounded-[16px] bg-white/[0.03] px-3.5 py-3 ring-1 ring-inset ring-white/[0.06]">
        <span className="min-w-[180px] flex-1"><span className="block text-[13.5px] font-medium text-white">Yedek model</span><span className="block text-[12px] leading-snug text-white/45">Ana model kesinti ya da sınır yüzünden yanıt veremezse aynı mesajı yedek model yanıtlar; çalışma izinde görünür.</span></span>
        {a.yedekModel && <div className="rounded-full bg-white/[0.05] p-1 ring-1 ring-inset ring-white/[0.08]"><ModelSecici deger={a.yedekModel} sec={(x) => d({ yedekModel: x === a.model ? undefined : x })} baglantilar={baglantilar} /></div>}
        <Anahtar acik={!!a.yedekModel} etiket="Yedek model" set={(v) => d({ yedekModel: v ? (a.model.startsWith("claude") ? "gpt-6-astra" : "claude-sonnet-5-5") : "" })} />
      </div>
      {(!bagli || (m.saglayici !== "anthropic" && claudeAraclari.length > 0)) && (
        <div className="mt-3 space-y-2">
          {!bagli && <p className="flex items-start gap-2 rounded-[14px] bg-amber-400/[0.07] px-3 py-2.5 text-[12.5px] leading-relaxed text-amber-100/85 ring-1 ring-inset ring-amber-300/15"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{m.ad} bu sunucuya bağlı değil; {a.yedekModel ? `bağlantı eklenene kadar yedek model ${modelBul(a.yedekModel).ad} yanıtlar.` : "test sohbeti bağlantı eklenene kadar cevap vermez."}</p>}
          {m.saglayici !== "anthropic" && claudeAraclari.length > 0 && <p className="flex items-start gap-2 rounded-[14px] bg-white/[0.04] px-3 py-2.5 text-[12.5px] leading-relaxed text-white/65 ring-1 ring-inset ring-white/[0.07]"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{claudeAraclari.map((t) => t.ad).join(", ")} yalnız Claude modellerinde çalışır; bu modelle kullanılmaz.</p>}
        </div>
      )}
    </Kart>
  );
}

/* ───────────── Araçlar ───────────── */
function Araclar({ a, d }: { a: Ajan; d: (p: Partial<Ajan>) => void }) {
  const set = (id: string, v: AracIzni) => { const y = { ...a.araclar }; if (v === "kapali") delete y[id]; else y[id] = v; d({ araclar: y }); };
  const acikSayi = Object.keys(a.araclar).length;
  return (
    <Kart ikon={Wrench} baslik="Araçlar" alt="Ajan neleri kendisi yapabilir, neler için önce sana sorar"
      sag={<span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] text-white/50">{acikSayi} açık</span>}>
      {(Object.keys(ARAC_KATEGORI) as AracKategori[]).filter((k) => ARAC_KATALOG.some((t) => t.kategori === k)).map((k) => (
        <div key={k} className="border-b border-white/[0.05] last:border-b-0">
          <p className="px-4 pb-1 pt-3 text-[12px] font-medium text-white/40 sm:px-5">{ARAC_KATEGORI[k]}</p>
          <div className="divide-y divide-white/[0.04]">
            {ARAC_KATALOG.filter((t) => t.kategori === k).map((t) => {
              const v = a.araclar[t.id] ?? "kapali";
              return (
                <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.gorsel} alt="" className={cn("h-10 w-10 shrink-0 rounded-[12px] object-cover ring-1 ring-inset ring-white/10 transition-opacity", v === "kapali" && "opacity-45")} />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[13.5px] font-medium", v === "kapali" ? "text-white/60" : "text-white")}>{t.ad}</span>
                    <span className="block truncate text-[12px] text-white/40">{t.alt}{t.kredi ? ` · ${t.kredi}` : ""}{t.yalnizClaude ? " · Claude modellerinde" : ""}</span>
                  </span>
                  {t.onaylanabilir
                    ? <Secici id={`arac-${t.id}`} kucuk deger={v} set={(x) => set(t.id, x)} l={[{ id: "kapali", ad: "Kapalı" }, { id: "sor", ad: "Sor", ipucu: "Her kullanımda önce onayını ister" }, { id: "her-zaman", ad: "Açık", ipucu: "Gerektiğinde kendisi kullanır" }]} />
                    : <Secici id={`arac-${t.id}`} kucuk deger={v === "kapali" ? "kapali" : "her-zaman"} set={(x) => set(t.id, x)} l={[{ id: "kapali", ad: "Kapalı" }, { id: "her-zaman", ad: "Açık" }]} />}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </Kart>
  );
}

/* ───────────── Yetenekler ───────────── */
type YOzet = { id: string; ad: string; baslik: string; aciklama: string; simge: string; katalogId?: string };
function Yetenekler({ a, d }: { a: Ajan; d: (p: Partial<Ajan>) => void }) {
  const [l, setL] = useState<YOzet[] | null>(null);
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const yukle = () => api<{ yetenekler: YOzet[] }>("/api/build/yetenekler").then((v) => setL(v.yetenekler)).catch(() => setL([]));
  useEffect(() => { yukle(); }, []);
  const secili = new Set(a.yetenekler ?? []);
  const degistir = (id: string, v: boolean) => { const x = new Set(secili); if (v) x.add(id); else x.delete(id); d({ yetenekler: [...x] }); };
  const oneriler = YETENEK_KATALOGU.filter((k) => !(l ?? []).some((y) => y.katalogId === k.id)).slice(0, 3);
  return (
    <Kart ikon={Sparkles} baslik="Yetenekler" alt="Ajanın gerektiğinde yüklediği talimat paketleri"
      sag={<Link href="/panel/build/yetenekler" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white hover:bg-white/[0.13]">Kitaplık</Link>}>
      {l === null ? <div className="h-16 animate-pulse" /> : (
        <div className="divide-y divide-white/[0.04]">
          {l.map((y) => (
            <div key={y.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={y.simge} alt="" className={cn("h-10 w-10 shrink-0 rounded-[12px] object-cover ring-1 ring-inset ring-white/10", !secili.has(y.id) && "opacity-45")} />
              <span className="min-w-0 flex-1"><span className={cn("block truncate text-[13.5px] font-medium", secili.has(y.id) ? "text-white" : "text-white/60")}>{y.baslik}</span><span className="block truncate text-[12px] text-white/40">{y.aciklama}</span></span>
              <Anahtar acik={secili.has(y.id)} set={(v) => degistir(y.id, v)} etiket={`${y.baslik} yeteneği`} />
            </div>
          ))}
          {oneriler.map((k) => (
            <div key={k.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={k.simge} alt="" className="h-10 w-10 shrink-0 rounded-[12px] object-cover opacity-60 ring-1 ring-inset ring-white/10" />
              <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-white/70">{k.baslik}</span><span className="block truncate text-[12px] text-white/40">Vayra'dan · {k.aciklama}</span></span>
              <button type="button" disabled={!!gidiyor} onClick={async () => { setGidiyor(k.id); try { const v = await api<{ id: string }>("/api/build/yetenekler", { govde: { katalog: k.id } }); await yukle(); degistir(v.id, true); } finally { setGidiyor(null); } }}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white hover:bg-white/[0.13]">{gidiyor === k.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}Ekle ve bağla</button>
            </div>
          ))}
        </div>
      )}
    </Kart>
  );
}

/* ───────────── Bağlantılar ───────────── */
type BOzet = { id: string; ad: string; logo?: string; durum: string; araclar: unknown[]; url: string };
function Baglantilar({ a, d }: { a: Ajan; d: (p: Partial<Ajan>) => void }) {
  const [l, setL] = useState<BOzet[] | null>(null);
  useEffect(() => { api<{ baglantilar: BOzet[] }>("/api/build/baglantilar").then((v) => setL(v.baglantilar)).catch(() => setL([])); }, []);
  const secili = new Set(a.baglantilar ?? []);
  const degistir = (id: string, v: boolean) => { const x = new Set(secili); if (v) x.add(id); else x.delete(id); d({ baglantilar: [...x] }); };
  const oneriler = BAGLANTI_KATALOGU.filter((k) => k.one && !(l ?? []).some((b) => b.url === k.url)).slice(0, 4);
  return (
    <Kart ikon={Plug} baslik="Bağlantılar" alt="Ajanın okuyup işlem yapabildiği servisler (GitHub, Notion, Stripe…)"
      sag={<Link href="/panel/build/baglantilar" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white hover:bg-white/[0.13]">Yönet</Link>}>
      {l === null ? <div className="h-16 animate-pulse" /> : (
        <div className="divide-y divide-white/[0.04]">
          {l.map((b) => (
            <div key={b.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.07] ring-1 ring-inset ring-white/[0.08]", !secili.has(b.id) && "opacity-50")}>{b.logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={b.logo} alt="" className="h-5 w-5 object-contain" /> : <Plug className="h-4 w-4 text-white/60" />}</span>
              <span className="min-w-0 flex-1"><span className={cn("block truncate text-[13.5px] font-medium", secili.has(b.id) ? "text-white" : "text-white/60")}>{b.ad}</span><span className="block truncate text-[12px] text-white/40">{b.durum === "etkin" ? `${b.araclar.length} araç · izinler bağlantı ayarında` : "Bağlantı etkin değil"}</span></span>
              <Anahtar acik={secili.has(b.id)} set={(v) => degistir(b.id, v)} etiket={`${b.ad} bağlantısı`} />
            </div>
          ))}
          {oneriler.map((k) => (
            <Link key={k.id} href={`/panel/build/baglantilar?baglan=${k.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] sm:px-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.05] ring-1 ring-inset ring-white/[0.06]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={k.logo} alt="" className="h-5 w-5 object-contain opacity-70" /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-white/70">{k.ad}</span><span className="block truncate text-[12px] text-white/40">{k.aciklama}</span></span>
              <span className="inline-flex h-8 shrink-0 items-center rounded-full bg-white/[0.08] px-3 text-[12.5px] text-white">Bağla</span>
            </Link>
          ))}
        </div>
      )}
    </Kart>
  );
}

/* ───────────── Sohbet açılışı ───────────── */
function Acilis({ a, d }: { a: Ajan; d: (p: Partial<Ajan>) => void }) {
  const l = [...a.baslangiclar, "", "", "", ""].slice(0, 4);
  return (
    <Kart ikon={MessageSquare} baslik="Sohbet açılışı" alt="İlk karşılama ve tıklanabilir öneriler" govde="space-y-3 p-4 sm:p-5">
      <textarea value={a.karsilama} onChange={(e) => d({ karsilama: e.target.value })} rows={2} maxLength={300} placeholder="Karşılama cümlesi (ör. Merhaba! Ürününü anlat, açıklamasını birlikte yazalım.)" className={cn(alanSinif, "resize-none py-2.5 leading-relaxed")} />
      <div className="grid gap-2 sm:grid-cols-2">
        {l.map((b, i) => (
          <input key={i} value={b} maxLength={120} placeholder={`Öneri ${i + 1}`} onChange={(e) => { const y = [...l]; y[i] = e.target.value; d({ baslangiclar: y }); }} className={cn(alanSinif, "h-10 text-[13.5px]")} />
        ))}
      </div>
    </Kart>
  );
}

/* ───────────── Yayın paneli ───────────── */
export function KodKutusu({ kod }: { kod: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="relative rounded-[14px] bg-[#0c0d0f] ring-1 ring-inset ring-white/[0.08]">
      <pre className="sc-kod overflow-x-auto p-3 pr-12 text-[12px] leading-relaxed text-white/80 [scrollbar-width:thin]">{kod}</pre>
      <button type="button" onClick={() => { navigator.clipboard?.writeText(kod); setOk(true); setTimeout(() => setOk(false), 1300); }} aria-label="Kopyala" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-white/70 hover:text-white">{ok ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>
    </div>
  );
}

type YayinSekme = "surum" | "kanallar" | "kutu";
function YayinPaneli({ a, setA, degisiklik, setDegisiklik, d, kapat }: { a: Ajan; setA: (a: Ajan) => void; degisiklik: boolean; setDegisiklik: (v: boolean) => void; d: (p: Partial<Ajan>) => void; kapat: () => void }) {
  const [sekme, setSekme] = useState<YayinSekme>("surum");
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const [anahtar, setAnahtar] = useState<string | null>(null);
  const [ortamAnahtar, setOrtamAnahtar] = useState<string | null>(null);
  const [hata, setHata] = useState("");
  const [koken, setKoken] = useState("");
  const [hazir, setHazir] = useState(false);
  useEffect(() => { setHazir(true); setKoken(location.origin); }, []);
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape" && !document.querySelector("[role=dialog] ~ [role=dialog], .fixed.inset-0.z-\\[125\\]")) kapat(); }; addEventListener("keydown", t); return () => removeEventListener("keydown", t); }, [kapat]);
  const islem = async (g: Record<string, unknown>) => {
    setGidiyor(String(g.islem)); setHata("");
    try { const v = await api<{ ajan: Ajan; degisiklik: boolean; anahtar?: string }>(`/api/build/ajanlar/${a.id}/yayinla`, { govde: g }); setA(v.ajan); setDegisiklik(v.degisiklik); if (v.anahtar) (g.islem === "ortam-anahtar" ? setOrtamAnahtar : setAnahtar)(v.anahtar); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "İşlem yapılamadı."); }
    finally { setGidiyor(null); }
  };
  if (!hazir) return null;
  const yayinda = a.yayin.durum === "yayinda";
  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex justify-end bg-black/50 sm:p-3" onMouseDown={(e) => { if (e.target === e.currentTarget) kapat(); }}>
      <motion.div role="dialog" aria-modal="true" aria-label="Yayınla" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="flex h-full w-full max-w-[580px] flex-col overflow-hidden bg-[#141416] ring-1 ring-white/[0.1] sm:rounded-[24px]">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
          <AjanSimge src={a.simge} boyut={36} />
          <div className="min-w-0 flex-1"><p className="truncate text-[16px] font-semibold text-white">Yayınla</p><p className="truncate text-[12.5px] text-white/50">{yayinda ? `Yayında, sürüm ${a.yayin.surum}` : a.surumler.length ? "Yayından kaldırıldı" : "Henüz yayında değil"}</p></div>
          <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="border-b border-white/[0.06] px-4 py-2.5"><Suzgec id="yayin-sekme" deger={sekme} set={setSekme} l={[{ id: "surum" as const, ad: "Sürümler" }, { id: "kanallar" as const, ad: "Kanallar" }, { id: "kutu" as const, ad: "Web kutusu" }]} /></div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
          {sekme === "surum" && <SurumBolumu a={a} degisiklik={degisiklik} islem={islem} gidiyor={gidiyor} hata={hata} ortamAnahtar={ortamAnahtar} />}
          {sekme === "kanallar" && <KanallarBolumu a={a} d={d} koken={koken} anahtar={anahtar} islem={islem} gidiyor={gidiyor} setA={setA} />}
          {sekme === "kutu" && <KutuAyarlari a={a} d={d} koken={koken} />}
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

/* ───────────── Düzenleyici ───────────── */
type Bolum = "kurulum" | "tetikler" | "calismalar" | "konusmalar" | "analitik" | "testler";
const BOLUMLER: { id: Bolum; ad: string }[] = [{ id: "kurulum", ad: "Kurulum" }, { id: "tetikler", ad: "Tetikler" }, { id: "calismalar", ad: "Çalışmalar" }, { id: "konusmalar", ad: "Konuşmalar" }, { id: "analitik", ad: "Analitik" }, { id: "testler", ad: "Testler" }];
export function AjanDuzenleyici({ id }: { id: string }) {
  const router = useRouter();
  const ara = useSearchParams();
  const [a, setAjan] = useState<Ajan | null>(null);
  const [yok, setYok] = useState(false);
  const [degisiklik, setDegisiklik] = useState(false);
  const [kayit, setKayit] = useState<"" | "bekliyor" | "kaydedildi" | "hata">("");
  const [iz, setIzHam] = useState<{ id: string; ajanId?: string } | null>(null);
  const setIz = useCallback((id: string | null, ajanId?: string) => setIzHam(id ? { id, ajanId } : null), []);
  const [yayin, setYayin] = useState(false);
  const [menu, setMenu] = useState(false);
  const [silOnay, setSilOnay] = useState(false);
  const [sekme, setSekme] = useState<"ayar" | "dene">("ayar");
  const [bolum, setBolum] = useState<Bolum>(() => (BOLUMLER.some((b) => b.id === ara.get("bolum")) ? ara.get("bolum") as Bolum : "kurulum"));
  const [baglantilar, setBaglantilar] = useState<Record<string, string | null>>();
  const bekleyen = useRef<Partial<Ajan>>({});
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuKok = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ ajan: Ajan; degisiklik: boolean }>(`/api/build/ajanlar/${id}`).then((v) => { setAjan(v.ajan); setDegisiklik(v.degisiklik); })
      .catch((e) => { if (e instanceof ApiHatasi && e.durum === 404) setYok(true); });
    fetch("/api/build/modeller").then((r) => r.json()).then((v) => setBaglantilar(v.baglantilar)).catch(() => {});
  }, [id]);
  useEffect(() => {
    if (!menu) return;
    const f = (e: PointerEvent) => { if (!menuKok.current?.contains(e.target as Node)) { setMenu(false); setSilOnay(false); } };
    addEventListener("pointerdown", f);
    return () => removeEventListener("pointerdown", f);
  }, [menu]);

  const kaydet = useCallback(async () => {
    const g = bekleyen.current; bekleyen.current = {};
    if (!Object.keys(g).length) return;
    try { const v = await api<{ degisiklik: boolean }>(`/api/build/ajanlar/${id}`, { method: "PATCH", govde: g }); setDegisiklik(v.degisiklik); setKayit("kaydedildi"); }
    catch { setKayit("hata"); }
  }, [id]);
  const d = useCallback((p: Partial<Ajan>) => {
    setAjan((x) => (x ? { ...x, ...p } : x));
    bekleyen.current = { ...bekleyen.current, ...p };
    setKayit("bekliyor");
    if (zamanlayici.current) clearTimeout(zamanlayici.current);
    zamanlayici.current = setTimeout(kaydet, 650);
  }, [kaydet]);
  // Sayfadan çıkarken bekleyen değişiklik kaybolmasın.
  useEffect(() => () => { if (Object.keys(bekleyen.current).length) fetch(`/api/build/ajanlar/${id}`, { method: "PATCH", keepalive: true, headers: { "Content-Type": "application/json", "x-build-sahip": localStorage.getItem("vayra-build-sahip") ?? "" }, body: JSON.stringify(bekleyen.current) }).catch(() => {}); }, [id]);

  const bekleyeniKaydet = useCallback(async () => { if (zamanlayici.current) { clearTimeout(zamanlayici.current); zamanlayici.current = null; await kaydet(); } }, [kaydet]);
  const [denemeAnahtar, setDenemeAnahtar] = useState(0);
  const yeniTest = async () => { await bekleyeniKaydet(); await api(`/api/build/ajanlar/${id}/dene`, { govde: { yeni: true } }).catch(() => {}); setDenemeAnahtar((x) => x + 1); };

  if (yok) return <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center"><p className="text-[17px] font-semibold">Ajan bulunamadı</p><Link href="/panel/build/ajanlar" className="mt-4 inline-flex h-10 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-black">Ajanlara dön</Link></div>;
  if (!a) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>;
  const yayinda = a.yayin.durum === "yayinda";

  return (
    <div className="flex h-screen min-h-0 flex-col">
      {/* Üst çubuk */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.06] px-3 pl-16 md:pl-3">
        <Link href="/panel/build/ajanlar" aria-label="Ajanlara dön" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white"><ArrowLeft className="h-4 w-4" /></Link>
        <AjanSimge src={a.simge} boyut={28} />
        <p className="min-w-0 truncate text-[15px] font-semibold text-white">{a.ad || "Adsız ajan"}</p>
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-medium max-sm:hidden", yayinda ? (degisiklik ? "bg-amber-400/[0.12] text-amber-200" : "bg-[#55d6fd]/[0.12] text-[#8be6ff]") : "bg-white/[0.06] text-white/50")}>
          {yayinda ? (degisiklik ? `Sürüm ${a.yayin.surum} yayında · taslak değişti` : `Yayında, sürüm ${a.yayin.surum}`) : "Taslak"}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[12px] text-white/40 max-md:hidden">
          {kayit === "bekliyor" ? <><Loader2 className="h-3 w-3 animate-spin" />Kaydediliyor</> : kayit === "kaydedildi" ? <><Check className="h-3 w-3" />Kaydedildi</> : kayit === "hata" ? <span className="text-rose-300">Kaydedilemedi</span> : null}
        </span>
        <div ref={menuKok} className="relative max-md:ml-auto">
          <button type="button" onClick={() => setMenu((x) => !x)} aria-label="Ajan menüsü" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
          <AnimatePresence>
            {menu && (
              <motion.div initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.14 }}
                className="absolute right-0 top-11 z-30 w-[220px] rounded-[16px] bd-panel p-1.5">
                <button type="button" onClick={() => { setMenu(false); yeniTest(); }} className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/85 hover:bg-white/[0.07]"><RotateCcw className="h-4 w-4 text-white/55" />Testi sıfırla</button>
                <div className="my-1 h-px bg-white/[0.07]" />
                <button type="button" onClick={async () => { if (!silOnay) { setSilOnay(true); return; } await api(`/api/build/ajanlar/${id}`, { method: "DELETE" }).catch(() => {}); router.push("/panel/build/ajanlar"); }}
                  className={cn("flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] hover:bg-rose-500/[0.1]", silOnay ? "bg-rose-500/[0.12] font-semibold text-rose-200" : "text-rose-300/90")}><Trash2 className="h-4 w-4" />{silOnay ? "Silmek için tekrar tıkla" : "Ajanı sil"}</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button type="button" onClick={async () => { if (zamanlayici.current) { clearTimeout(zamanlayici.current); await kaydet(); } const s = await ajanlaSohbet(id); studyoYenile(); router.push(`/panel/build/sohbet/${s}`); }}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white hover:bg-white/[0.13] max-sm:hidden"><MessageSquare className="h-3.5 w-3.5" />Sohbet</button>
        <button type="button" onClick={async () => { if (zamanlayici.current) { clearTimeout(zamanlayici.current); await kaydet(); } setYayin(true); }}
          className="relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black">
          <Rocket className="h-3.5 w-3.5" />Yayınla{degisiklik && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#55d6fd] ring-2 ring-[#0b0b0c]" />}
        </button>
      </header>

      {/* Telefonda Ayarlar / Dene */}
      <div className="flex shrink-0 justify-center border-b border-white/[0.06] py-2 lg:hidden">
        <Secici id="ajan-sekme" deger={sekme} set={setSekme} l={[{ id: "ayar", ad: "Ayarlar" }, { id: "dene", ad: "Dene" }]} />
      </div>

      <div className="flex min-h-0 flex-1">
        <div className={cn("min-h-0 w-full overflow-y-auto [scrollbar-width:thin] lg:w-[min(600px,50%)] lg:shrink-0 lg:border-r lg:border-white/[0.06]", sekme === "dene" && "max-lg:hidden")}>
          <div className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0b0b0c]/90 px-4 py-2.5 backdrop-blur-xl">
            <div className="mx-auto max-w-[640px]"><Suzgec id="ajan-bolum" deger={bolum} set={(b) => { setBolum(b); router.replace(`/panel/build/ajanlar/${id}${b === "kurulum" ? "" : `?bolum=${b}`}`, { scroll: false }); }} l={BOLUMLER.map((b) => ({ id: b.id, ad: b.ad }))} /></div>
          </div>
          <div className="mx-auto max-w-[640px] space-y-4 p-4 pb-24">
            {bolum === "kurulum" && (
              <>
                {ara.get("taslak") === "1" && (
                  <p className="flex items-start gap-2 rounded-[16px] bg-white/[0.04] px-3.5 py-3 text-[12.5px] leading-relaxed text-white/65 ring-1 ring-inset ring-white/[0.07]"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Taslak tarifinden kuruldu: talimat senin yazdığın metin, araçlar tarifteki kelimelere göre açıldı. Yapay zekâ bağlandığında tarif ayrıntılı bir talimata dönüşür; şimdilik aşağıdan düzenleyebilirsin.</p>
                )}
                <SohbetleDuzenle a={a} d={d} />
                <Kimlik a={a} d={d} />
                <Talimat a={a} d={d} />
                <ModelBolumu a={a} d={d} baglantilar={baglantilar} />
                <Araclar a={a} d={d} />
                <IsletmeKarti a={a} d={d} />
                <Onaylar a={a} d={d} />
                <Yetenekler a={a} d={d} />
                <Baglantilar a={a} d={d} />
                <ProsedurKarti a={a} d={d} />
                <YonlendirmeKarti a={a} d={d} />
                <EkipKarti a={a} d={d} />
                <Bilgi a={a} setA={(y) => { setAjan((x) => (x ? { ...x, bilgi: y.bilgi } : y)); setDegisiklik(true); }} />
                <Acilis a={a} d={d} />
                <Bellek a={a} d={d} />
                <KorumaKarti a={a} d={d} />
                <DevirKarti a={a} d={d} />
                <KonuKarti a={a} d={d} />
              </>
            )}
            {bolum === "tetikler" && <Tetikler a={a} izAc={setIz} />}
            {bolum === "calismalar" && <Calismalar ajanId={a.id} />}
            {bolum === "konusmalar" && <Konusmalar ajanId={a.id} />}
            {bolum === "analitik" && <><Analitik ajanId={a.id} etiketler={a.konular.etiketler.map((e) => e.ad)} konuEkle={(ad) => { if (!a.konular.etiketler.some((e) => e.ad.toLocaleLowerCase("tr") === ad.toLocaleLowerCase("tr"))) d({ konular: { ...a.konular, etiketler: [...a.konular.etiketler, { ad: ad.slice(0, 40) }].slice(0, 30) } }); }} /><Bosluklar ajanId={a.id} gun={30} guncel={(y) => { setAjan(y); setDegisiklik(true); }} /></>}
            {bolum === "testler" && <Testler a={a} izAc={setIz} />}
          </div>
        </div>
        <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col p-3", sekme === "ayar" && "max-lg:hidden")}>
          <DeneSohbet key={denemeAnahtar} a={a} kaydet={bekleyeniKaydet} izAc={setIz} />
        </div>
      </div>
      <CalismaPaneli ajanId={iz?.ajanId ?? a.id} calismaId={iz?.id ?? null} kapat={() => setIz(null)} />
      <AnimatePresence>{yayin && <YayinPaneli a={a} setA={(y) => setAjan(y)} degisiklik={degisiklik} setDegisiklik={setDegisiklik} d={d} kapat={() => setYayin(false)} />}</AnimatePresence>
    </div>
  );
}

