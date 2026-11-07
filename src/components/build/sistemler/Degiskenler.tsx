"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, Check, Copy, KeyRound, Loader2, Lock, Pencil, Plus, RefreshCw, Trash2, Variable, Workflow, X } from "lucide-react";
import { alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { cn } from "@/lib/utils";
import { Segment, YanPanel, useKopya } from "./ortak";

type Deg = { ad: string; deger: string; aciklama?: string; guncelleme: number };
type Sir = { ad: string; sonu: string; aciklama?: string; guncelleme: number };
type Liste = { degiskenler: Deg[]; sirlar: Sir[]; kullanim: Record<string, { id: string; ad: string }[]> };
type Duzen = { tur: "degisken" | "sir"; eskiAd?: string; ad: string; deger: string; aciklama: string } | null;

/** Değişkenler ve sırların adları (veri seçici ve hap etiketleri için). */
export function useDegiskenAdlari(yenile = 0) {
  const [v, setV] = useState<{ degiskenler: { ad: string; deger?: string }[]; sirlar: { ad: string }[] }>({ degiskenler: [], sirlar: [] });
  useEffect(() => { api<Liste>("/api/build/sistemler/degiskenler").then((x) => setV({ degiskenler: x.degiskenler.map((d) => ({ ad: d.ad, deger: d.deger })), sirlar: x.sirlar.map((d) => ({ ad: d.ad })) })).catch(() => {}); }, [yenile]);
  return v;
}

/** Sağdan açılan Değişkenler paneli: hesap değişkenleri ({{degisken.ad}}) ve şifreli sırlar ({{sir.ad}}). */
export function DegiskenPaneli({ acik, kapat, degisti }: { acik: boolean; kapat: () => void; degisti?: () => void }) {
  const [v, setV] = useState<Liste | null>(null);
  const [sekme, setSekme] = useState<"degisken" | "sir" | "depo">("degisken");
  const [duzen, setDuzen] = useState<Duzen>(null);
  const [gidiyor, setGidiyor] = useState(false);
  const [hata, setHata] = useState("");
  const [sil, setSil] = useState<string | null>(null);
  const { kopya, kopyala } = useKopya();
  const yukle = () => api<Liste>("/api/build/sistemler/degiskenler").then(setV).catch(() => setV({ degiskenler: [], sirlar: [], kullanim: {} }));
  useEffect(() => { if (acik) { yukle(); setDuzen(null); setHata(""); setSil(null); } }, [acik]);

  const kaydet = async () => {
    if (!duzen) return;
    setGidiyor(true); setHata("");
    try {
      const x = await api<Liste>("/api/build/sistemler/degiskenler", { govde: { islem: duzen.tur, ad: duzen.ad.trim(), ...(duzen.tur === "degisken" || duzen.deger ? { deger: duzen.deger } : {}), aciklama: duzen.aciklama, eskiAd: duzen.eskiAd } });
      setV((y) => ({ ...x, kullanim: y?.kullanim ?? {} })); setDuzen(null); degisti?.();
    } catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Kaydedilemedi."); }
    finally { setGidiyor(false); }
  };
  const silGonder = async (tur: "degisken" | "sir", ad: string) => {
    if (sil !== `${tur}:${ad}`) { setSil(`${tur}:${ad}`); return; }
    setSil(null);
    try { const x = await api<Liste>("/api/build/sistemler/degiskenler", { govde: { islem: "sil", tur, ad } }); setV((y) => ({ ...x, kullanim: y?.kullanim ?? {} })); degisti?.(); } catch { /* sessiz */ }
  };
  const l = sekme === "degisken" ? v?.degiskenler ?? [] : v?.sirlar ?? [];
  const tur: "degisken" | "sir" = sekme === "sir" ? "sir" : "degisken";
  const Form = (
    <motion.div key="form" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-2.5 rounded-[18px] bg-white/[0.04] p-3.5 ring-1 ring-inset ring-white/[0.1]">
      <p className="text-[13.5px] font-semibold text-white">{duzen?.eskiAd ? "Düzenle" : duzen?.tur === "sir" ? "Yeni sır" : "Yeni değişken"}</p>
      <input value={duzen?.ad ?? ""} onChange={(e) => setDuzen((d) => d && { ...d, ad: e.target.value.replace(/[^A-Za-z0-9_]/g, "").slice(0, 40) })} placeholder={duzen?.tur === "sir" ? "ODEME_ANAHTARI" : "magaza_adi"} aria-label="Ad" className={cn(alanSinif, "sc-kod h-10 text-[13px]")} />
      {duzen?.tur === "sir"
        ? <input type="password" autoComplete="new-password" value={duzen.deger} onChange={(e) => setDuzen((d) => d && { ...d, deger: e.target.value })} placeholder={duzen.eskiAd ? "Değiştirmek için yeni değeri yaz, boşsa aynı kalır" : "Gizli değer"} aria-label="Değer" className={cn(alanSinif, "cam-istemci h-10 text-[13px]")} />
        : <textarea value={duzen?.deger ?? ""} onChange={(e) => setDuzen((d) => d && { ...d, deger: e.target.value })} rows={2} placeholder="Değer" aria-label="Değer" className={cn(alanSinif, "cam-istemci resize-y py-2.5 text-[13px]")} />}
      <input value={duzen?.aciklama ?? ""} onChange={(e) => setDuzen((d) => d && { ...d, aciklama: e.target.value.slice(0, 200) })} placeholder="Açıklama, isteğe bağlı" aria-label="Açıklama" className={cn(alanSinif, "h-10 text-[13px]")} />
      {hata && <p className="text-[12.5px] text-rose-300">{hata}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={kaydet} disabled={gidiyor || !duzen?.ad.trim() || (duzen.tur === "sir" && !duzen.eskiAd && !duzen.deger)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40">{gidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Kaydet</button>
        <button type="button" onClick={() => { setDuzen(null); setHata(""); }} className="h-9 rounded-full px-3.5 text-[13px] text-white/65 hover:bg-white/[0.06]">Vazgeç</button>
      </div>
    </motion.div>
  );
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Değişkenler" alt="Bütün sistemlerinde ortak değerler; / ile veri seçiciden eklenir" genislik={500}
      alt2={sekme === "depo" ? undefined : <button type="button" onClick={() => { setHata(""); setDuzen({ tur, ad: "", deger: "", aciklama: "" }); }} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black"><Plus className="h-4 w-4" />{sekme === "sir" ? "Sır ekle" : "Değişken ekle"}</button>}>
      <div className="space-y-4">
        <Segment id="degisken-sekme" deger={sekme} set={(x) => { setSekme(x); setDuzen(null); }} l={[{ id: "degisken", ad: `Değişkenler${v ? ` ${v.degiskenler.length}` : ""}` }, { id: "sir", ad: `Sırlar${v ? ` ${v.sirlar.length}` : ""}` }, { id: "depo", ad: "Depo" }]} />
        {sekme === "depo" ? <DepoListesi /> : (<>
        <div className={cn("flex items-start gap-3 rounded-[16px] p-3.5 ring-1 ring-inset", sekme === "sir" ? "bg-amber-400/[0.05] ring-amber-300/15" : "bg-[#55d6fd]/[0.05] ring-[#55d6fd]/15")}>
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]", sekme === "sir" ? "bg-amber-400/[0.12] text-amber-200" : "bg-[#55d6fd]/[0.12] text-[#8be6ff]")}>{sekme === "sir" ? <Lock className="h-4 w-4" /> : <Variable className="h-4 w-4" />}</span>
          <p className="text-[12.5px] leading-relaxed text-white/70">{sekme === "sir" ? <>API anahtarı, parola, belirteç. Şifreli saklanır, tarayıcıya geri gelmez. Adımlarda <span className="sc-kod text-amber-100">{"{{sir.AD}}"}</span> ile kullanılır; çalışmanın girdi, çıktı, hata ve günlük kayıtlarında maskelenir. Kod adımında girdi.sir.AD.</> : <>Mağaza adı, destek adresi, kur gibi değerler. Adımlarda <span className="sc-kod text-[#8be6ff]">{"{{degisken.ad}}"}</span> ile kullanılır; bir yerde değiştirince bütün sistemlerde değişir. Kod adımında girdi.degisken.ad.</>}</p>
        </div>
        <AnimatePresence initial={false}>{duzen && duzen.tur === tur && Form}</AnimatePresence>
        {v === null ? <div className="h-32 animate-pulse rounded-[18px] bg-white/[0.03]" /> : !l.length ? (
          <div className="flex items-center gap-3 rounded-[16px] bg-white/[0.02] p-3.5 ring-1 ring-inset ring-white/[0.06]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.06] text-white/60">{sekme === "sir" ? <KeyRound className="h-4 w-4" /> : <Variable className="h-4 w-4" />}</span>
            <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-white/55">{sekme === "sir" ? "Henüz sır yok. Bir servisin API anahtarını sır olarak ekle; HTTP adımının başlığında kullan." : "Henüz değişken yok. Birden çok sistemde tekrar eden bir değeri buraya taşı."}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05] overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.07]">
            {l.map((x) => {
              const anahtar = `${sekme}.${x.ad}`, kul = v.kullanim[anahtar] ?? [];
              const sablon = `{{${sekme === "sir" ? "sir" : "degisken"}.${x.ad}}}`;
              return (
                <motion.div layout key={x.ad} className="px-3.5 py-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]", sekme === "sir" ? "bg-amber-400/[0.1] text-amber-200" : "bg-[#55d6fd]/[0.1] text-[#8be6ff]")}>{sekme === "sir" ? <KeyRound className="h-3.5 w-3.5" /> : <Variable className="h-3.5 w-3.5" />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="sc-kod block truncate text-[13px] font-medium text-white">{x.ad}</span>
                      <span className="block truncate text-[12px] text-white/50">{sekme === "sir" ? `Şifreli${(x as Sir).sonu ? `, sonu ${(x as Sir).sonu}` : ""}` : (x as Deg).deger || "boş"}{x.aciklama ? ` · ${x.aciklama}` : ""}</span>
                    </span>
                    <button type="button" onClick={() => kopyala(sablon, x.ad)} title={`${sablon} kopyala`} aria-label="Şablonu kopyala" className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.07] hover:text-white">{kopya === x.ad ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>
                    <button type="button" onClick={() => { setHata(""); setDuzen({ tur, eskiAd: x.ad, ad: x.ad, deger: sekme === "sir" ? "" : (x as Deg).deger, aciklama: x.aciklama ?? "" }); }} aria-label="Düzenle" className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.07] hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => silGonder(tur, x.ad)} aria-label="Sil" className={cn("flex h-8 items-center justify-center rounded-full", sil === `${sekme}:${x.ad}` ? "bg-rose-500/[0.14] px-2.5 text-[11.5px] font-medium text-rose-200" : "w-8 text-white/50 hover:bg-rose-500/[0.1] hover:text-rose-300")}>{sil === `${sekme}:${x.ad}` ? (kul.length ? `${kul.length} sistem kullanıyor, sil` : "Sil") : <Trash2 className="h-3.5 w-3.5" />}</button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-10">
                    {kul.length ? kul.slice(0, 4).map((k) => <Link key={k.id} href={`/panel/build/sistemler/${k.id}`} className="flex max-w-[180px] items-center gap-1 rounded-full bg-white/[0.05] px-2 py-0.5 text-[11.5px] text-white/65 hover:text-white"><Workflow className="h-3 w-3 shrink-0" /><span className="truncate">{k.ad}</span></Link>) : <span className="text-[11.5px] text-white/35">Hiçbir sistem kullanmıyor</span>}
                    {kul.length > 4 && <span className="text-[11.5px] text-white/40">ve {kul.length - 4} sistem</span>}
                    <span className="ml-auto text-[11px] text-white/30">{gorece(x.guncelleme)}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        {duzen && duzen.tur !== sekme && <button type="button" onClick={() => setDuzen(null)} className="flex items-center gap-1 text-[12px] text-white/45"><X className="h-3 w-3" />Açık formu kapat</button>}
        </>)}
      </div>
    </YanPanel>
  );
}

type DepoKaydi = { anahtar: string; tam: string; kapsam: "sistem" | "hesap"; sistemId?: string; sistemAd?: string; ozet: string; tur: string; boyut: number; guncelleme: number; sonKullanma?: number };
/** Depo adımlarının yazdığı anahtarlar: kapsam, değer özeti, son kullanma ve silme. */
function DepoListesi() {
  const [l, setL] = useState<DepoKaydi[] | null>(null);
  const [sil, setSil] = useState<string | null>(null);
  const yukle = () => api<{ anahtarlar: DepoKaydi[] }>("/api/build/sistemler/depo").then((x) => setL(x.anahtarlar)).catch(() => setL([]));
  useEffect(() => { yukle(); }, []);
  const silGonder = async (tam: string) => {
    if (sil !== tam) { setSil(tam); return; }
    setSil(null);
    await api(`/api/build/sistemler/depo?anahtar=${encodeURIComponent(tam)}`, { method: "DELETE" }).catch(() => {});
    yukle();
  };
  return (<>
    <div className="flex items-start gap-3 rounded-[16px] bg-violet-400/[0.05] p-3.5 ring-1 ring-inset ring-violet-300/15">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-violet-400/[0.12] text-violet-200"><Archive className="h-4 w-4" /></span>
      <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-white/70">Depo adımının çalışmalar arasında sakladığı değerler: sayaçlar, son işlenen kayıt, kuyruklar ve tekrar denetimi listeleri. Yalnız bu sisteme ayrılanlar ve bütün sistemlerin ortak kullandıkları ayrı tutulur.</p>
      <button type="button" onClick={yukle} aria-label="Yenile" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><RefreshCw className="h-3.5 w-3.5" /></button>
    </div>
    {l === null ? <div className="h-32 animate-pulse rounded-[18px] bg-white/[0.03]" /> : !l.length ? (
      <div className="flex items-center gap-3 rounded-[16px] bg-white/[0.02] p-3.5 ring-1 ring-inset ring-white/[0.06]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.06] text-white/60"><Archive className="h-4 w-4" /></span>
        <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-white/55">Depo boş. Bir sisteme Depo adımı ekleyip çalıştırınca yazdığı anahtarlar burada görünür.</p>
      </div>
    ) : (
      <div className="divide-y divide-white/[0.05] overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.07]">
        {l.map((x) => (
          <motion.div layout key={x.tam} className="flex items-start gap-2.5 px-3.5 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-violet-400/[0.1] text-violet-200"><Archive className="h-3.5 w-3.5" /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5"><span className="sc-kod truncate text-[13px] font-medium text-white">{x.anahtar}</span><span className="shrink-0 rounded-full bg-white/[0.06] px-1.5 py-px text-[10.5px] text-white/55">{x.tur}</span></span>
              <span className="mt-0.5 block truncate text-[12px] text-white/55">{x.ozet}</span>
              <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-white/40">
                {x.kapsam === "hesap" ? <span>Bütün sistemler</span> : x.sistemId ? <Link href={`/panel/build/sistemler/${x.sistemId}`} className="flex max-w-[180px] items-center gap-1 hover:text-white"><Workflow className="h-3 w-3 shrink-0" /><span className="truncate">{x.sistemAd}</span></Link> : null}
                <span>· {gorece(x.guncelleme)}</span>{x.sonKullanma && <span>· {new Date(x.sonKullanma).toLocaleDateString("tr-TR")} tarihinde silinir</span>}
              </span>
            </span>
            <button type="button" onClick={() => silGonder(x.tam)} aria-label="Sil" className={cn("flex h-8 shrink-0 items-center justify-center rounded-full", sil === x.tam ? "bg-rose-500/[0.14] px-2.5 text-[11.5px] font-medium text-rose-200" : "w-8 text-white/50 hover:bg-rose-500/[0.1] hover:text-rose-300")}>{sil === x.tam ? "Sil" : <Trash2 className="h-3.5 w-3.5" />}</button>
          </motion.div>
        ))}
      </div>
    )}
  </>);
}
