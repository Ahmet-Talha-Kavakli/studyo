"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Download, FileCode2, FileText, History, Info, Lightbulb, Loader2, MoreHorizontal, Play, Plus, RotateCcw, ScrollText, Share2, Sparkles, Trash2, Upload } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Md, SohbetEkrani } from "@/components/build/sohbet/SohbetEkrani";
import { Anahtar, Secici, alanSinif, kareGorsel } from "@/components/build/ajanlar/AjanDuzenleyici";
import { AJAN_SIMGELERI } from "@/lib/build/ajanKatalog";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { YetenekSimge, yetenekIndir, yetenekMdIndir } from "./YetenekListesi";
import { CagriVeBaglantilar, GuvenlikKarti, Karsilastir, PaylasPaneli, Surumler as SurumKarti, TetikTesti, useModeller, type Bagimlilik, type YetenekV2 } from "./YetenekAraclari";
import { DegerlendirmePaketi } from "./DegerlendirmePaketi";
import { BetikAg, BetikCalistirici, KaliteKarti, KaynakGuncelleme, KullanimYerleri, SurumKarsilastir } from "./YetenekGelismis";

type Yetenek = YetenekV2 & { simge: string; katalogId?: string; herSohbette: boolean; guncelleme: number; betikAg?: string[] };
const AD = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const boyut = (n: number) => (n < 1000 ? `${n} karakter` : `${(n / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} bin karakter`);

function Kimlik({ y, d }: { y: Yetenek; d: (p: Partial<Yetenek>) => void }) {
  const [secici, setSecici] = useState(false);
  const dosya = useRef<HTMLInputElement>(null);
  const adGecerli = AD.test(y.ad) && y.ad.length <= 64;
  return (
    <Kart ikon={Sparkles} baslik="Kimlik" alt="Adı ve ne zaman kullanılacağı (model yeteneği buna bakarak seçer)" govde="space-y-3 p-4 sm:p-5">
      <div className="flex gap-4">
        <button type="button" onClick={() => setSecici((x) => !x)} className="group relative block shrink-0 rounded-[22px]" aria-label="Simgeyi değiştir">
          <YetenekSimge src={y.simge} boyut={84} />
          <span className="absolute inset-0 flex items-center justify-center rounded-[22px] bg-black/50 text-[12px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">Değiştir</span>
        </button>
        <div className="min-w-0 flex-1 space-y-2.5">
          <input value={y.baslik} onChange={(e) => d({ baslik: e.target.value })} maxLength={80} placeholder="Yeteneğin adı" className={cn(alanSinif, "h-11 text-[16px] font-semibold")} />
          <div>
            <input value={y.ad} onChange={(e) => d({ ad: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 64) })} placeholder="kisa-ad" className={cn(alanSinif, "h-10 text-[13.5px]", !adGecerli && "ring-rose-400/50")} />
            <p className={cn("mt-1 pl-1 text-[11.5px]", adGecerli ? "text-white/35" : "text-rose-300")}>{adGecerli ? "SKILL.md adı: küçük harf, rakam ve tire" : "Yalnız küçük harf, rakam ve tek tire; başta ve sonda tire olamaz"}</p>
          </div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {secici && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="grid grid-cols-6 gap-2 rounded-[18px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07] sm:grid-cols-[repeat(13,minmax(0,1fr))]">
              <button type="button" onClick={() => dosya.current?.click()} className="flex aspect-square items-center justify-center rounded-[14px] bg-white/[0.06] text-white/70 ring-1 ring-inset ring-white/[0.08] hover:text-white" title="Kendi görselini yükle"><Upload className="h-4 w-4" /></button>
              {AJAN_SIMGELERI.map((g) => (
                <button key={g} type="button" onClick={() => { d({ simge: g }); setSecici(false); }} className={cn("overflow-hidden rounded-[14px] ring-2", y.simge === g ? "ring-white" : "ring-transparent hover:ring-white/30")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
              <input ref={dosya} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; const u = await kareGorsel(f); if (u) { d({ simge: u }); setSecici(false); } }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div>
        <textarea value={y.aciklama} onChange={(e) => d({ aciklama: e.target.value })} maxLength={1024} rows={3}
          placeholder="Ne yapar ve NE ZAMAN kullanılmalı? Örneğin: Müşteri e-postalarına yanıt yazarken kullan; marka tonunu ve iade kurallarını uygular."
          className={cn(alanSinif, "resize-none py-2.5 leading-relaxed")} />
        <p className="mt-1 flex justify-between pl-1 text-[11.5px] text-white/35"><span>Model bu açıklamaya bakarak yeteneği yükler; tetikleyici kelimeleri buraya yaz.</span><span className="tabular-nums">{y.aciklama.length}/1024</span></p>
      </div>
    </Kart>
  );
}

function Govde({ y, d }: { y: Yetenek; d: (p: Partial<Yetenek>) => void }) {
  const [mod, setMod] = useState<"yaz" | "onizle">("yaz");
  const alan = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const t = alan.current; if (t) { t.style.height = "0px"; t.style.height = `${Math.max(320, Math.min(t.scrollHeight + 2, 900))}px`; } }, [y.govde, mod]);
  return (
    <Kart ikon={ScrollText} baslik="Talimat" alt="SKILL.md gövdesi: adımlar, kurallar, çıktı biçimi (Markdown)"
      sag={<><span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] tabular-nums text-white/45 max-sm:hidden">{boyut(y.govde.length)}</span><Secici id="govde-mod" kucuk deger={mod} set={setMod} l={[{ id: "yaz", ad: "Yaz" }, { id: "onizle", ad: "Önizle" }]} /></>} govde="p-4 sm:p-5">
      {mod === "yaz"
        ? <textarea ref={alan} value={y.govde} onChange={(e) => d({ govde: e.target.value })} maxLength={80000} spellCheck={false} className={cn(alanSinif, "block resize-none py-3 font-mono text-[13px] leading-[1.65]")} />
        : <div className="min-h-[320px] rounded-[14px] bg-white/[0.02] px-4 py-3 ring-1 ring-inset ring-white/[0.06]"><Md metin={y.govde || "Henüz talimat yok."} onizle={() => {}} /></div>}
    </Kart>
  );
}

function Dosyalar({ y, d, kaydet }: { y: Yetenek; d: (p: Partial<Yetenek>) => void; kaydet: () => Promise<void> }) {
  const [acik, setAcik] = useState<number | null>(null);
  const [calisan, setCalisan] = useState<string | null>(null);
  const [yeni, setYeni] = useState("");
  const dosya = useRef<HTMLInputElement>(null);
  const ekle = (yol: string, icerik: string) => { const l = [...y.dosyalar.filter((x) => x.yol !== yol), { yol, icerik }]; d({ dosyalar: l }); setAcik(l.length - 1); };
  return (
    <Kart ikon={FileCode2} baslik="Ek dosyalar" alt="Gerekince okunan başvuru belgeleri ve betikler (references/, scripts/)"
      sag={<button type="button" onClick={() => dosya.current?.click()} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white hover:bg-white/[0.13]"><Upload className="h-3.5 w-3.5" />Yükle</button>}>
      <input ref={dosya} type="file" multiple hidden accept=".md,.txt,.json,.csv,.js,.ts,.py,.sh,.yaml,.yml,.html,.css,text/*"
        onChange={async (e) => { const l = [...(e.target.files ?? [])].slice(0, 10); e.target.value = ""; for (const f of l) if (f.size < 1_000_000) ekle(`${/\.(js|ts|py|sh)$/.test(f.name) ? "scripts" : "references"}/${f.name.replace(/[^\w.-]/g, "-")}`, await f.text()); }} />
      {y.dosyalar.length > 0 && (
        <div className="divide-y divide-white/[0.04] border-b border-white/[0.05]">
          {y.dosyalar.map((f, i) => (
            <div key={f.yol}>
              <div className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                <button type="button" onClick={() => setAcik(acik === i ? null : i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.07] text-white/65">{f.yol.startsWith("scripts/") ? <FileCode2 className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}</span>
                  <span className="min-w-0"><span className="block truncate text-[13.5px] text-white/85">{f.yol}</span><span className="block text-[11.5px] text-white/40">{boyut(f.icerik.length)}</span></span>
                </button>
                {/\.(c|m)?js$/i.test(f.yol) &&<button type="button" onClick={() => setCalisan(calisan === f.yol ? null : f.yol)} aria-pressed={calisan === f.yol} className={cn("inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[12px]", calisan === f.yol ? "bg-white text-black" : "bg-white/[0.07] text-white hover:bg-white/[0.12]")}><Play className="h-3 w-3" />Çalıştır</button>}
                <button type="button" onClick={() => { d({ dosyalar: y.dosyalar.filter((_, j) => j !== i) }); setAcik(null); }} aria-label={`${f.yol} dosyasını sil`} className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              {calisan === f.yol && <div className="px-4 pb-3 sm:px-5"><BetikCalistirici id={y.id} yol={f.yol} kaydet={kaydet} /></div>}
              {acik === i && <div className="px-4 pb-3 sm:px-5"><textarea value={f.icerik} onChange={(e) => d({ dosyalar: y.dosyalar.map((x, j) => (j === i ? { ...x, icerik: e.target.value } : x)) })} rows={12} spellCheck={false} className={cn(alanSinif, "resize-y py-2.5 font-mono text-[12.5px] leading-relaxed")} /></div>}
            </div>
          ))}
        </div>
      )}
      {y.dosyalar.some((x) => /\.(c|m)?js$/i.test(x.yol)) && <BetikAg y={y} d={(p) => d(p)} />}
      <form className="flex gap-2 p-4 sm:p-5" onSubmit={(e) => { e.preventDefault(); const yol = yeni.trim().replace(/^\/+/, ""); if (!yol || !/^[\w.-]+(\/[\w.-]+)*$/.test(yol)) return; ekle(yol.includes("/") ? yol : `references/${yol}`, ""); setYeni(""); }}>
        <input value={yeni} onChange={(e) => setYeni(e.target.value)} placeholder="Yeni dosya, ör. references/sablonlar.md" className={cn(alanSinif, "h-10 text-[13.5px]")} />
        <button type="submit" disabled={!yeni.trim()} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40"><Plus className="h-3.5 w-3.5" />Ekle</button>
      </form>
    </Kart>
  );
}

function Ornekler({ y, d }: { y: Yetenek; d: (p: Partial<Yetenek>) => void }) {
  const l = [...y.ornekler, "", "", "", "", ""].slice(0, 5);
  return (
    <Kart ikon={Lightbulb} baslik="Örnek istekler" alt="Yeteneği tetiklemesi gereken istekler; Dene bölümünde tıklanır" govde="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">
      {l.map((b, i) => <input key={i} value={b} maxLength={200} placeholder={`Örnek ${i + 1}`} onChange={(e) => { const x = [...l]; x[i] = e.target.value; d({ ornekler: x }); }} className={cn(alanSinif, "h-10 text-[13.5px]")} />)}
    </Kart>
  );
}

/** Yetenek düzenleyicisi: solda kimlik, SKILL.md gövdesi, dosyalar, örnekler, sürümler; sağda yetenek açık canlı test. */
export function YetenekDuzenleyici({ id }: { id: string }) {
  const router = useRouter();
  const ara = useSearchParams();
  const [y, setY] = useState<Yetenek | null>(null);
  const [yok, setYok] = useState(false);
  const [kayit, setKayit] = useState<"" | "bekliyor" | "kaydedildi" | "hata">("");
  const [hata, setHata] = useState("");
  const [testId, setTestId] = useState<string | null>(null);
  const [testSayac, setTestSayac] = useState(0);
  const [sekme, setSekme] = useState<"ayar" | "dene">("ayar");
  const [menu, setMenu] = useState(false);
  const [silOnay, setSilOnay] = useState(false);
  const [bag, setBag] = useState<Bagimlilik[]>([]);
  const [paylas, setPaylas] = useState(false);
  const [deneMod, setDeneMod] = useState<"sohbet" | "karsilastir" | "tetik" | "paket">("sohbet");
  const modeller = useModeller();
  const [farkAcik, setFarkAcik] = useState(false);
  const [digerleri, setDigerleri] = useState<{ ad: string; aciklama: string }[]>([]);
  const bekleyen = useRef<Partial<Yetenek>>({});
  const zaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuKok = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ yetenek: Yetenek; bagimliliklar: Bagimlilik[] }>(`/api/build/yetenekler/${id}`).then((v) => { setY(v.yetenek); setBag(v.bagimliliklar ?? []); }).catch((e) => { if (e instanceof ApiHatasi && e.durum === 404) setYok(true); });
    api<{ sohbet: string }>(`/api/build/yetenekler/${id}/test`, { govde: {} }).then((v) => setTestId(v.sohbet)).catch(() => {});
    api<{ yetenekler: { id: string; ad: string; aciklama: string }[] }>("/api/build/yetenekler").then((v) => setDigerleri(v.yetenekler.filter((x) => x.id !== id))).catch(() => {});
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
    if (g.ad !== undefined && !AD.test(g.ad)) delete g.ad;
    if (!Object.keys(g).length) { setKayit(""); return; }
    try { const v = await api<{ yetenek: Yetenek; bagimliliklar: Bagimlilik[] }>(`/api/build/yetenekler/${id}`, { method: "PATCH", govde: g }); setY((x) => (x ? { ...x, surum: v.yetenek.surum, surumler: v.yetenek.surumler, tarama: v.yetenek.tarama, sabitSurum: v.yetenek.sabitSurum, herSohbette: v.yetenek.herSohbette } : x)); setBag(v.bagimliliklar ?? []); setKayit("kaydedildi"); setHata(""); }
    catch (e) { setKayit("hata"); setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); }
  }, [id]);
  const d = useCallback((p: Partial<Yetenek>) => {
    setY((x) => (x ? { ...x, ...p } : x));
    bekleyen.current = { ...bekleyen.current, ...p };
    setKayit("bekliyor");
    if (zaman.current) clearTimeout(zaman.current);
    zaman.current = setTimeout(kaydet, 650);
  }, [kaydet]);
  useEffect(() => () => { if (Object.keys(bekleyen.current).length) fetch(`/api/build/yetenekler/${id}`, { method: "PATCH", keepalive: true, headers: { "Content-Type": "application/json", "x-build-sahip": localStorage.getItem("vayra-build-sahip") ?? "" }, body: JSON.stringify(bekleyen.current) }).catch(() => {}); }, [id]);
  /** Anında uygulanan işlem (sürüm kaydet, sabitle, geri yükle): bekleyen değişiklikler önce kaydedilir. */
  const islem = async (g: Record<string, unknown>) => {
    if (zaman.current) { clearTimeout(zaman.current); await kaydet(); }
    try { const v = await api<{ yetenek: Yetenek; bagimliliklar: Bagimlilik[] }>(`/api/build/yetenekler/${id}`, { method: "PATCH", govde: g }); setY(v.yetenek); setBag(v.bagimliliklar ?? []); setHata(""); }
    catch (e) { setKayit("hata"); setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); }
  };
  const yeniTest = async () => { if (zaman.current) { clearTimeout(zaman.current); await kaydet(); } const v = await api<{ sohbet: string }>(`/api/build/yetenekler/${id}/test`, { govde: { yeni: true } }); setTestId(v.sohbet); setTestSayac((x) => x + 1); };

  if (yok) return <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center"><p className="text-[17px] font-semibold">Yetenek bulunamadı</p><Link href="/panel/build/yetenekler" className="mt-4 inline-flex h-10 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-black">Yeteneklere dön</Link></div>;
  if (!y) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>;

  return (
    <div className="flex h-screen min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.06] px-3 pl-16 md:pl-3">
        <Link href="/panel/build/yetenekler" aria-label="Yeteneklere dön" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white"><ArrowLeft className="h-4 w-4" /></Link>
        <YetenekSimge src={y.simge} boyut={28} />
        <p className="min-w-0 truncate text-[15px] font-semibold text-white">{y.baslik || "Adsız yetenek"}</p>
        <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11.5px] text-white/50 max-sm:hidden">Sürüm {y.surum}</span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[12px] text-white/40 max-md:hidden">
          {kayit === "bekliyor" ? <><Loader2 className="h-3 w-3 animate-spin" />Kaydediliyor</> : kayit === "kaydedildi" ? <><Check className="h-3 w-3" />Kaydedildi</> : kayit === "hata" ? <span className="text-rose-300">{hata || "Kaydedilemedi"}</span> : null}
        </span>
        <label className="flex shrink-0 items-center gap-2 text-[12.5px] text-white/55 max-md:ml-auto" title="Açıksa genel sohbette her zaman kullanılabilir">
          <span className="max-sm:hidden">Her sohbette</span><Anahtar acik={y.herSohbette} set={(v) => { if (v && y.tarama?.sonuc === "kritik") { setKayit("hata"); setHata("Güvenlik taramasında kritik bulgu var"); return; } d({ herSohbette: v }); }} etiket="Her sohbette" />
        </label>
        <div ref={menuKok} className="relative">
          <button type="button" onClick={() => setMenu((x) => !x)} aria-label="Yetenek menüsü" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
          <AnimatePresence>
            {menu && (
              <motion.div initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.14 }}
                className="absolute right-0 top-11 z-30 w-[210px] rounded-[16px] bd-panel p-1.5">
                <button type="button" onClick={() => { setMenu(false); yetenekIndir(id); }} className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/85 hover:bg-white/[0.07]"><Download className="h-4 w-4 text-white/55" />İndir (.zip)</button>
                <button type="button" onClick={() => { setMenu(false); yetenekMdIndir(id); }} className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/85 hover:bg-white/[0.07]"><FileText className="h-4 w-4 text-white/55" />SKILL.md indir</button>
                <button type="button" onClick={() => { setMenu(false); setPaylas(true); }} className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/85 hover:bg-white/[0.07]"><Share2 className="h-4 w-4 text-white/55" />Paylaş</button>
                <button type="button" onClick={() => { setMenu(false); yeniTest(); }} className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/85 hover:bg-white/[0.07]"><RotateCcw className="h-4 w-4 text-white/55" />Testi sıfırla</button>
                <div className="my-1 h-px bg-white/[0.07]" />
                <button type="button" onClick={async () => { if (!silOnay) { setSilOnay(true); return; } await api(`/api/build/yetenekler/${id}`, { method: "DELETE" }).catch(() => {}); router.push("/panel/build/yetenekler"); }}
                  className={cn("flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] hover:bg-rose-500/[0.1]", silOnay ? "bg-rose-500/[0.12] font-semibold text-rose-200" : "text-rose-300/90")}><Trash2 className="h-4 w-4" />{silOnay ? "Silmek için tekrar tıkla" : "Yeteneği sil"}</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>
      <div className="flex shrink-0 justify-center border-b border-white/[0.06] py-2 lg:hidden">
        <Secici id="yetenek-sekme" deger={sekme} set={setSekme} l={[{ id: "ayar", ad: "Düzenle" }, { id: "dene", ad: "Dene" }]} />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className={cn("min-h-0 w-full overflow-y-auto [scrollbar-width:thin] lg:w-[min(640px,52%)] lg:shrink-0 lg:border-r lg:border-white/[0.06]", sekme === "dene" && "max-lg:hidden")}>
          <div className="mx-auto max-w-[680px] space-y-4 p-4 pb-24">
            {ara.get("taslak") === "1" && <p className="flex items-start gap-2 rounded-[16px] bg-white/[0.04] px-3.5 py-3 text-[12.5px] leading-relaxed text-white/65 ring-1 ring-inset ring-white/[0.07]"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Tarifinden bir iskelet kuruldu. Yapay zekâ bağlandığında tarif ayrıntılı bir talimata dönüşür; şimdilik adımları aşağıda sen yaz.</p>}
            {ara.get("atlanan") && <p className="flex items-start gap-2 rounded-[16px] bg-white/[0.04] px-3.5 py-3 text-[12.5px] leading-relaxed text-white/65 ring-1 ring-inset ring-white/[0.07]"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />İçe aktarılırken {ara.get("atlanan")} dosya alınmadı (görsel, yazı tipi gibi ikili dosyalar ya da boyut sınırını aşanlar).</p>}
            {y.kaynak?.tur === "anthropic" && <p className="flex items-start gap-2 rounded-[16px] bg-white/[0.04] px-3.5 py-3 text-[12.5px] leading-relaxed text-white/65 ring-1 ring-inset ring-white/[0.07]"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>Anthropic resmî yeteneğinden içe aktarıldı ({y.kaynak.lisans}; lisans dosyası ek dosyalarda). {y.kaynak.url && <a href={y.kaynak.url} target="_blank" rel="noopener noreferrer" className="text-white underline-offset-2 hover:underline">Kaynak</a>}</span></p>}
            {y.kaynak?.tur === "anthropic" && <KaynakGuncelleme id={id} guncellendi={(v) => setY((x) => (x ? { ...x, ...v } : x))} />}
            {y.tarama?.sonuc === "kritik" && <GuvenlikKarti t={y.tarama} />}
            <Kimlik y={y} d={d} />
            <CagriVeBaglantilar y={y} d={(p) => d(p as Partial<Yetenek>)} bag={bag} />
            <Govde y={y} d={d} />
            <Dosyalar y={y} d={d} kaydet={async () => { if (zaman.current) { clearTimeout(zaman.current); await kaydet(); } }} />
            <Ornekler y={y} d={d} />
            <SurumKarti y={y} islem={islem} karsilastir={() => setFarkAcik(true)} />
            <KaliteKarti y={y} digerleri={digerleri} />
            <KullanimYerleri id={id} />
            {y.tarama?.sonuc !== "kritik" && <GuvenlikKarti t={y.tarama} />}
          </div>
        </div>
        <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col p-3", sekme === "ayar" && "max-lg:hidden")}>
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] bg-[#121315] ring-1 ring-inset ring-white/[0.07]">
            <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-white/[0.06] pl-4 pr-2">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#55d6fd] opacity-60" /><span className="relative h-2 w-2 rounded-full bg-[#55d6fd]" /></span>
              <p className="text-[13.5px] font-semibold text-white max-sm:hidden">Dene</p>
              <Secici id="dene-mod" kucuk deger={deneMod} set={setDeneMod} l={[{ id: "sohbet", ad: "Sohbet" }, { id: "karsilastir", ad: "Karşılaştır" }, { id: "tetik", ad: "Tetik testi" }, { id: "paket", ad: "Değerlendirme" }]} />
              <p className="min-w-0 flex-1 truncate text-[12px] text-white/40 max-2xl:hidden">{deneMod === "sohbet" ? "Bu sohbette yetenek açık; model gerekince kendisi yükler" : deneMod === "karsilastir" ? "Aynı istem yetenekli ve yeteneksiz" : "Açıklama doğru sorgularda mı tetikleniyor"}</p>
              <span className="flex-1 2xl:hidden" />
              {deneMod === "sohbet" && <button type="button" onClick={yeniTest} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-white/60 hover:bg-white/[0.07] hover:text-white"><RotateCcw className="h-3.5 w-3.5" /><span className="max-sm:hidden">Sıfırla</span></button>}
            </header>
            <div className="min-h-0 flex-1">
              {deneMod === "paket" ? <DegerlendirmePaketi y={y} modeller={{ ...modeller, l: modeller.l.map((x) => ({ id: x.id, ad: x.ad, alt: x.alt })) }} /> : deneMod === "karsilastir" ? <Karsilastir y={y} /> : deneMod === "tetik" ? <TetikTesti y={y} guncelle={(p) => { if (typeof p.aciklama === "string") d({ aciklama: p.aciklama }); else setY((x) => (x ? { ...x, ...p } : x)); }} /> : testId ? <SohbetEkrani key={`${testId}-${testSayac}`} id={testId} gomulu oneriler={y.ornekler.filter((x) => x.trim())} bosBaslik="Yeteneği tetikleyecek bir istek yaz; model talimatı yükleyip uygulayacak." />
                : <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>}
            </div>
          </section>
        </div>
      </div>
      <AnimatePresence>{farkAcik && <SurumKarsilastir key="fark" y={y} kapat={() => setFarkAcik(false)} />}</AnimatePresence>
      <AnimatePresence>{paylas && <PaylasPaneli key="paylas" y={y} kapat={() => setPaylas(false)} guncelle={(p) => setY((x) => (x ? { ...x, ...p } : x))} indirZip={() => yetenekIndir(id)} indirMd={() => yetenekMdIndir(id)} />}</AnimatePresence>
    </div>
  );
}

