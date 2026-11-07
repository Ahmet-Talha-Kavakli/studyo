"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2, X } from "lucide-react";
import { AcilirSecim, Anahtar, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { DONUSTUR_ISLEMLERI, type DonusturGrup } from "@/lib/build/sistemDonustur";
import { api } from "@/lib/build/istemci";
import { GUVENLIK_DENETIMLERI, ISLECLER, SURE_BIRIMLERI, VAYRA_ARACLARI, VERI_ISLECLERI, VERI_ISLEMLERI, veriIslemi, type Adim, type CiktiAlani, type Dal, type GirdiAlani, type Kosul } from "@/lib/build/sistemKatalog";
import { cn } from "@/lib/utils";
import { Segment } from "./ortak";
import { SablonAlani, type VeriKaynagi } from "./SablonAlani";
import { AlanAyarla, DepoAyari, KodYazici, ParalelAyari, UygulamaAyari, YanitAyari } from "./YeniAdimlar";

export type Kaynaklar = {
  projeler: { id: string; ad: string }[]; ajanlar: { id: string; ad: string; simge: string }[];
  baglantilar: { id: string; ad: string; logo?: string; durum: string; araclar: { name: string; title?: string; description?: string; inputSchema?: { properties?: Record<string, unknown>; required?: string[] }; annotations?: { title?: string } }[] }[];
  sistemler: { id: string; ad: string; girdi?: GirdiAlani[] }[];
  /** Diğer sistemlerdeki etiketler (öneri için). */
  etiketler?: string[];
};
const kimlik = () => Math.random().toString(36).slice(2, 8);

export function Alan({ etiket, ipucu, children, sag }: { etiket: string; ipucu?: React.ReactNode; children: React.ReactNode; sag?: React.ReactNode }) {
  return (
    <div className="block">
      <div className="mb-1.5 flex items-center gap-2"><span className="flex-1 text-[12.5px] font-medium text-white/70">{etiket}</span>{sag}</div>
      {children}
      {ipucu && <div className="mt-1.5 text-[11.5px] leading-relaxed text-white/45">{ipucu}</div>}
    </div>
  );
}
function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return <section className="space-y-3.5 rounded-[18px] bg-white/[0.025] p-3.5 ring-1 ring-inset ring-white/[0.06]"><p className="text-[13px] font-semibold text-white/90">{baslik}</p>{children}</section>;
}

/** Hazır seçenekli sayı: listede "Özel" seçilince giriş açılır. */
function HazirSayi({ deger, set, l, birim, en = 1, boy = 100000 }: { deger: number; set: (v: number) => void; l: number[]; birim: string; en?: number; boy?: number }) {
  const [ozel, setOzel] = useState(!l.includes(deger));
  return (
    <div className="flex gap-2">
      <div className="min-w-0 flex-1"><AcilirSecim deger={ozel ? "ozel" : String(deger)} set={(v) => { if (v === "ozel") setOzel(true); else { setOzel(false); set(Number(v)); } }} l={[...l.map((x) => ({ id: String(x), ad: `${x} ${birim}` })), { id: "ozel", ad: "Özel", alt: "Kendin yaz" }]} /></div>
      {ozel && <input type="number" min={en} max={boy} value={deger} onChange={(e) => set(Math.max(en, Math.min(boy, Number(e.target.value) || en)))} className={cn(alanSinif, "h-10 w-28")} />}
    </div>
  );
}
/** Süre seçimi: hazır süreler + Özel (miktar ve birim). */
const SURE_HAZIR = [{ m: 10, b: "dakika" }, { m: 1, b: "saat" }, { m: 8, b: "saat" }, { m: 1, b: "gun" }, { m: 3, b: "gun" }, { m: 7, b: "gun" }];
function SureSecimi({ miktar, birim, set, hazir = SURE_HAZIR }: { miktar: number; birim: string; set: (m: number, b: string) => void; hazir?: { m: number; b: string }[] }) {
  const id = hazir.findIndex((x) => x.m === miktar && x.b === birim);
  const [ozel, setOzel] = useState(id < 0);
  const ad = (m: number, b: string) => `${m} ${SURE_BIRIMLERI.find((x) => x.id === b)?.ad ?? b}`;
  return (
    <div className="space-y-2">
      <AcilirSecim deger={ozel ? "ozel" : String(id)} set={(v) => { if (v === "ozel") setOzel(true); else { setOzel(false); const x = hazir[Number(v)]; set(x.m, x.b); } }} l={[...hazir.map((x, i) => ({ id: String(i), ad: ad(x.m, x.b) })), { id: "ozel", ad: "Özel", alt: "Miktarı ve birimi kendin seç" }]} />
      {ozel && <div className="flex items-center gap-2"><input type="number" min={1} max={100000} value={miktar} onChange={(e) => set(Math.max(1, Number(e.target.value) || 1), birim)} className={cn(alanSinif, "h-10 w-24")} /><Segment id={`birim-${hazir.length}`} kucuk deger={birim} set={(b) => set(miktar, b)} l={SURE_BIRIMLERI.map((b) => ({ id: b.id, ad: b.ad }))} /></div>}
    </div>
  );
}

/* ───── Koşullar ───── */
export function KosulDuzenleyici({ l, baglac, set, kaynaklar, id }: { l: Kosul[]; baglac: "ve" | "veya"; set: (l: Kosul[], b: "ve" | "veya") => void; kaynaklar: VeriKaynagi[]; id: string }) {
  const d = (i: number, p: Partial<Kosul>) => set(l.map((k, j) => (j === i ? { ...k, ...p } : k)), baglac);
  return (
    <div className="space-y-2">
      {l.length > 1 && <Segment id={`baglac-${id}`} kucuk deger={baglac} set={(b) => set(l, b)} l={[{ id: "ve", ad: "Hepsi uysun" }, { id: "veya", ad: "Biri yeter" }]} />}
      <AnimatePresence initial={false}>
        {l.map((k, i) => { const tek = ISLECLER.find((x) => x.id === k.islec)?.tek; return (
          <motion.div key={i} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="space-y-1.5 rounded-[14px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <span className="flex-1 text-[11.5px] text-white/45">{i === 0 ? "Eğer" : baglac === "veya" ? "ya da" : "ve"}</span>
              {l.length > 1 && <button type="button" onClick={() => set(l.filter((_, j) => j !== i), baglac)} aria-label="Koşulu sil" className="flex h-6 w-6 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-white"><X className="h-3.5 w-3.5" /></button>}
            </div>
            <SablonAlani tekSatir deger={k.sol} set={(v) => d(i, { sol: v })} kaynaklar={kaynaklar} yer="Değer, / ile veri seç" etiket="Değer" />
            <AcilirSecim deger={k.islec} set={(v) => d(i, { islec: v })} l={ISLECLER.map((x) => ({ id: x.id, ad: x.ad, alt: x.grup }))} />
            {!tek && <SablonAlani tekSatir deger={k.sag} set={(v) => d(i, { sag: v })} kaynaklar={kaynaklar} yer="Karşılaştırılacak" etiket="Karşılaştırılacak" />}
          </motion.div>
        ); })}
      </AnimatePresence>
      {l.length < 10 && <button type="button" onClick={() => set([...l, { sol: "", islec: "esit", sag: "" }], baglac)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/75 hover:bg-white/[0.1]"><Plus className="h-3.5 w-3.5" />Koşul ekle</button>}
    </div>
  );
}

/* ───── Dallar ───── */
function DallarDuzenleyici({ a, set, kaynaklar }: { a: Adim; set: (d: Dal[]) => void; kaynaklar: VeriKaynagi[] }) {
  const dallar = a.dallar ?? [];
  const normal = dallar.filter((d) => !d.yedek), yedek = dallar.find((d) => d.yedek);
  const yaz = (l: Dal[]) => set([...l, ...(yedek ? [yedek] : [])]);
  const d = (i: number, p: Partial<Dal>) => yaz(normal.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const tasi = (i: number, y: number) => { const l = [...normal]; const [x] = l.splice(i, 1); l.splice(i + y, 0, x); yaz(l); };
  const ai = a.tur === "siniflandir";
  const harf = (i: number) => String.fromCharCode(65 + i);
  return (
    <div className="space-y-2.5">
      {normal.map((x, i) => (
        <motion.div key={x.id} layout className="space-y-2 rounded-[16px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
          <div className="flex items-center gap-1.5">
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-violet-400/[0.14] px-1.5 text-[11.5px] font-semibold text-violet-100">{harf(i)}</span>
            <input value={x.ad} onChange={(e) => d(i, { ad: e.target.value })} maxLength={60} aria-label="Dal adı" className="h-8 min-w-0 flex-1 rounded-[10px] bg-transparent px-2 text-[13.5px] font-medium text-white outline-none hover:bg-white/[0.04] focus:bg-white/[0.06]" />
            <button type="button" disabled={i === 0} onClick={() => tasi(i, -1)} aria-label="Dalı sola al" className="flex h-7 w-7 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.07] disabled:opacity-25"><ArrowUp className="h-3.5 w-3.5" /></button>
            <button type="button" disabled={i === normal.length - 1} onClick={() => tasi(i, 1)} aria-label="Dalı sağa al" className="flex h-7 w-7 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.07] disabled:opacity-25"><ArrowDown className="h-3.5 w-3.5" /></button>
            <button type="button" disabled={normal.length <= (ai ? 1 : 2)} onClick={() => yaz(normal.filter((_, j) => j !== i))} aria-label="Dalı sil" className="flex h-7 w-7 items-center justify-center rounded-full text-white/45 hover:bg-rose-500/[0.1] hover:text-rose-300 disabled:opacity-25"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          {ai ? <textarea value={x.aciklama ?? ""} onChange={(e) => d(i, { aciklama: e.target.value })} rows={2} maxLength={600} placeholder="Ne zaman seçilsin? Örneğin: ürün bozuk geldi, iade istiyor" className={cn(alanSinif, "resize-none py-2 text-[13px]")} />
            : <KosulDuzenleyici id={x.id} l={x.kosullar?.length ? x.kosullar : [{ sol: "", islec: "esit", sag: "" }]} baglac={x.baglac ?? "ve"} set={(l, b) => d(i, { kosullar: l, baglac: b })} kaynaklar={kaynaklar} />}
          {x.adimlar.length > 0 && <p className="text-[11.5px] text-white/40">Bu dalda {x.adimlar.length} adım var; tuvalde düzenle.</p>}
        </motion.div>
      ))}
      {normal.length < 10 && <button type="button" onClick={() => yaz([...normal, { id: kimlik(), ad: `Dal ${harf(normal.length)}`, ...(ai ? { aciklama: "" } : { kosullar: [{ sol: "", islec: "esit", sag: "" }], baglac: "ve" as const }), adimlar: [] }])} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/75 hover:bg-white/[0.1]"><Plus className="h-3.5 w-3.5" />Dal ekle</button>}
      {yedek && (
        <div className="space-y-2 rounded-[16px] bg-white/[0.02] p-3 ring-1 ring-inset ring-dashed ring-white/[0.1]">
          <p className="text-[13px] font-medium text-white/80">Hiçbiri uymazsa</p>
          {ai ? <textarea value={yedek.aciklama ?? ""} onChange={(e) => set([...normal, { ...yedek, aciklama: e.target.value }])} rows={2} maxLength={600} placeholder="Modele ne zaman hiçbiri demesi gerektiğini anlat" className={cn(alanSinif, "resize-none py-2 text-[13px]")} />
            : <p className="text-[12px] leading-relaxed text-white/45">Yukarıdaki dalların hiçbiri uymazsa bu dal çalışır. Boş bırakırsan akış birleşme noktasından sürer.</p>}
        </div>
      )}
    </div>
  );
}

/* ───── Ajan çıktı alanları ───── */
function AlanSemasi({ l, set }: { l: CiktiAlani[]; set: (l: CiktiAlani[]) => void }) {
  const d = (i: number, p: Partial<CiktiAlani>) => set(l.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <div className="space-y-2">
      {l.map((x, i) => (
        <div key={i} className="space-y-1.5 rounded-[14px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.06]">
          <div className="flex gap-1.5">
            <input value={x.ad} onChange={(e) => d(i, { ad: e.target.value.replace(/[^\p{L}\p{N}_]/gu, "").slice(0, 40) })} placeholder="alan_adi" aria-label="Alan adı" className={cn(alanSinif, "sc-kod h-9 min-w-0 flex-1 text-[13px]")} />
            <div className="w-[128px] shrink-0"><AcilirSecim deger={x.tur} set={(v) => d(i, { tur: v as CiktiAlani["tur"] })} l={[{ id: "metin", ad: "Metin" }, { id: "sayi", ad: "Sayı" }, { id: "evet-hayir", ad: "Evet ya da hayır" }, { id: "liste", ad: "Liste" }, { id: "nesne", ad: "Nesne" }]} /></div>
            <button type="button" onClick={() => set(l.filter((_, j) => j !== i))} aria-label="Alanı sil" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/45 hover:bg-rose-500/[0.1] hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          <input value={x.aciklama ?? ""} onChange={(e) => d(i, { aciklama: e.target.value })} maxLength={300} placeholder="Modele ne yazacağını anlat" className={cn(alanSinif, "h-9 text-[13px]")} />
        </div>
      ))}
      {l.length < 20 && <button type="button" onClick={() => set([...l, { ad: "", tur: "metin" }])} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/75 hover:bg-white/[0.1]"><Plus className="h-3.5 w-3.5" />Alan ekle</button>}
    </div>
  );
}

/* ───── Hata ve yeniden deneme ───── */
const TEKRAR_HAZIR = [{ id: "0", ad: "Yeniden deneme yok", t: null }, { id: "2", ad: "2 kez, artan bekleme", t: { sayi: 2, bekleme: 5, artan: true } }, { id: "3", ad: "3 kez, artan bekleme", t: { sayi: 3, bekleme: 10, artan: true } }, { id: "5", ad: "5 kez, artan bekleme", t: { sayi: 5, bekleme: 30, artan: true } }] as const;
function HataAyari({ a, set, kaynaklar }: { a: Adim; set: (a: Adim) => void; kaynaklar: VeriKaynagi[] }) {
  const t = a.tekrar;
  const hazir = !t ? "0" : TEKRAR_HAZIR.find((x) => x.t && x.t.sayi === t.sayi && x.t.bekleme === t.bekleme && x.t.artan === t.artan)?.id;
  const [ozel, setOzel] = useState(!!t && !hazir);
  const kap = a.tur === "yonlendirici" || a.tur === "onay" || a.tur === "dongu" || a.tur === "kosul";
  return (
    <Bolum baslik="Hata olursa">
      <Segment id={`hata-${a.id}`} kucuk deger={a.hata} set={(v) => set({ ...a, hata: v, hataDali: v === "dal" ? a.hataDali ?? [] : a.hataDali, hataSonrasi: v === "dal" ? a.hataSonrasi ?? "bitir" : a.hataSonrasi })} l={[{ id: "durdur", ad: "Durdur" }, { id: "devam", ad: "Devam et" }, { id: "yedek", ad: "Yedek çıktı" }, { id: "dal", ad: "Hata dalı" }]} />
      {a.hata === "yedek" && <Alan etiket="Yedek çıktı" ipucu="Adım hata verirse bu değer adımın çıktısı olur ve akış sürer (Make Resume gibi). JSON ya da metin; Hata iletisini / ile seçebilirsin."><SablonAlani deger={String(a.ayar.yedekCikti ?? "")} set={(v) => set({ ...a, ayar: { ...a.ayar, yedekCikti: v } })} kaynaklar={kaynaklar} satir={3} kod yer={'{"durum": "bilinmiyor", "kaynak": "yedek"}'} etiket="Yedek çıktı" /></Alan>}
      {a.hata === "dal" && (<>
        <p className="text-[12px] leading-relaxed text-white/50">Tuvalde bu adımın altında kırmızı bir dal açılır; içindeki adımlarda veri seçiciden Hata iletisini seçebilirsin.</p>
        <Alan etiket="Hata dalından sonra"><Segment id={`hsonra-${a.id}`} kucuk deger={a.hataSonrasi ?? "bitir"} set={(v) => set({ ...a, hataSonrasi: v })} l={[{ id: "bitir", ad: "Sistemi bitir" }, { id: "devam", ad: "Ana akışa devam et" }]} /></Alan>
      </>)}
      {!kap && (
        <Alan etiket="Yeniden dene" ipucu="Geçici hatalarda (ağ, zaman aşımı, 5xx, 429) yeniden dener; geçersiz ayar ya da 4xx yanıtta denemez. 5 saniyeden uzun beklemeler diske yazılır, sunucu yeniden başlasa da sürer.">
          <AcilirSecim deger={ozel ? "ozel" : hazir ?? "0"} set={(v) => { if (v === "ozel") { setOzel(true); set({ ...a, tekrar: a.tekrar ?? { sayi: 2, bekleme: 5, artan: true } }); return; } setOzel(false); const x = TEKRAR_HAZIR.find((z) => z.id === v); set({ ...a, tekrar: x?.t ? { ...x.t } : undefined }); }}
            l={[...TEKRAR_HAZIR.map((x) => ({ id: x.id, ad: x.ad, alt: x.t ? `İlk bekleme ${x.t.bekleme} saniye, her denemede iki katı` : undefined })), { id: "ozel", ad: "Özel", alt: "Deneme sayısını ve beklemeyi kendin seç" }]} />
          {ozel && t && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="block"><span className="mb-1 block text-[11.5px] text-white/50">Kaç kez</span><input type="number" min={1} max={5} value={t.sayi} onChange={(e) => set({ ...a, tekrar: { ...t, sayi: Math.max(1, Math.min(5, Number(e.target.value) || 1)) } })} className={cn(alanSinif, "h-10")} /></label>
              <label className="block"><span className="mb-1 block text-[11.5px] text-white/50">Bekleme (saniye)</span><input type="number" min={1} max={3600} value={t.bekleme} onChange={(e) => set({ ...a, tekrar: { ...t, bekleme: Math.max(1, Math.min(3600, Number(e.target.value) || 1)) } })} className={cn(alanSinif, "h-10")} /></label>
              <label className="col-span-2 flex items-center justify-between gap-3 rounded-[12px] bg-white/[0.03] px-3 py-2"><span className="text-[12.5px] text-white/70">Her denemede beklemeyi iki katına çıkar</span><Anahtar acik={t.artan} etiket="Artan bekleme" set={(v) => set({ ...a, tekrar: { ...t, artan: v } })} /></label>
            </div>
          )}
        </Alan>
      )}
      <label className="flex items-center justify-between gap-3"><span className="text-[12.5px] text-white/70">Adımı devre dışı bırak<span className="block text-[11.5px] text-white/40">Çalışmada atlanır, ayarları korunur</span></span><Anahtar acik={!!a.kapali} etiket="Devre dışı" set={(v) => set({ ...a, kapali: v || undefined })} /></label>
    </Bolum>
  );
}


/* ───── Veri tablosu: tablo ve sütun seçimi ───── */
type Tablo = { ad: string; adet: number; sema: { ad: string; tur: string }[] };
const tabloOnbellek = new Map<string, Promise<Tablo[]>>();
export function useTablolar(projeId: string): Tablo[] | null {
  const [l, setL] = useState<Tablo[] | null>(null);
  useEffect(() => {
    if (!projeId) { setL([]); return; }
    let iptal = false;
    let p = tabloOnbellek.get(projeId);
    if (!p) { p = api<{ koleksiyonlar: Tablo[] }>(`/api/build/veri/${projeId}`).then((v) => v.koleksiyonlar ?? []).catch(() => []); tabloOnbellek.set(projeId, p); setTimeout(() => tabloOnbellek.delete(projeId), 30_000); }
    p.then((x) => { if (!iptal) setL(x); });
    return () => { iptal = true; };
  }, [projeId]);
  return l;
}
/** Projedeki tablolar + Özel (yeni ad). */
export function TabloSecici({ projeId, deger, set }: { projeId: string; deger: string; set: (v: string) => void }) {
  const l = useTablolar(projeId);
  const [ozel, setOzel] = useState(false);
  const varMi = !!l?.some((x) => x.ad === deger);
  const ozelAcik = ozel || (!!deger && l !== null && !varMi);
  if (!projeId) return <p className="rounded-[14px] bg-white/[0.03] px-3.5 py-2.5 text-[12.5px] text-white/45 ring-1 ring-inset ring-white/[0.06]">Önce projeyi seç.</p>;
  return (
    <div className="space-y-2">
      <AcilirSecim deger={ozelAcik ? "__ozel" : deger} set={(v) => { if (v === "__ozel") { setOzel(true); return; } setOzel(false); set(v); }} bos={l === null ? "Tablolar yükleniyor" : "Tablo seç"}
        l={[...(l ?? []).map((x) => ({ id: x.ad, ad: x.ad, alt: `${x.adet} kayıt${x.sema.length ? `, ${x.sema.length} sütun` : ""}` })), { id: "__ozel", ad: "Özel", alt: "Yeni tablo adı yaz; ilk kayıtla oluşur" }]} />
      {ozelAcik && <input value={deger} onChange={(e) => set(e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40))} placeholder="siparisler" aria-label="Tablo adı" className={cn(alanSinif, "sc-kod h-10 text-[13px]")} />}
    </div>
  );
}
const SISTEM_SUTUN = [{ ad: "id", tur: "kimlik" }, { ad: "olusturma", tur: "zaman" }, { ad: "guncelleme", tur: "zaman" }];
function SutunSecici({ deger, set, sutunlar, bos = "Sütun seç" }: { deger: string; set: (v: string) => void; sutunlar: { ad: string; tur: string }[]; bos?: string }) {
  const [ozel, setOzel] = useState(false);
  const l = [...sutunlar, ...SISTEM_SUTUN.filter((x) => !sutunlar.some((y) => y.ad === x.ad))];
  const ozelAcik = ozel || (!!deger && !l.some((x) => x.ad === deger));
  return (
    <div className="flex min-w-0 gap-1.5">
      <div className="min-w-0 flex-1"><AcilirSecim deger={ozelAcik ? "__ozel" : deger} set={(v) => { if (v === "__ozel") { setOzel(true); return; } setOzel(false); set(v); }} bos={bos} l={[...l.map((x) => ({ id: x.ad, ad: x.ad, alt: x.tur })), { id: "__ozel", ad: "Özel", alt: "Alan adını kendin yaz" }]} /></div>
      {ozelAcik && <input value={deger} onChange={(e) => set(e.target.value.slice(0, 60))} placeholder="alan" aria-label="Alan adı" className={cn(alanSinif, "sc-kod h-10 w-28 text-[13px]")} />}
    </div>
  );
}
function VeriSuzgeci({ a, set, kaynaklar, sutunlar }: { a: Adim; set: (a: Adim) => void; kaynaklar: VeriKaynagi[]; sutunlar: { ad: string; tur: string }[] }) {
  const l = a.kosullar ?? [];
  const d = (i: number, p: Partial<Kosul>) => set({ ...a, kosullar: l.map((k, j) => (j === i ? { ...k, ...p } : k)) });
  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {l.map((k, i) => { const tek = VERI_ISLECLERI.find((x) => x.id === k.islec)?.tek; return (
          <motion.div key={i} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="space-y-1.5 rounded-[14px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.06]">
            <div className="flex items-center gap-1.5"><span className="flex-1 text-[11.5px] text-white/45">{i === 0 ? "Şu kayıtlar" : "ve"}</span><button type="button" onClick={() => set({ ...a, kosullar: l.filter((_, j) => j !== i) })} aria-label="Koşulu sil" className="flex h-6 w-6 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-white"><X className="h-3.5 w-3.5" /></button></div>
            <SutunSecici deger={k.sol} set={(v) => d(i, { sol: v })} sutunlar={sutunlar} />
            <AcilirSecim deger={k.islec} set={(v) => d(i, { islec: v })} l={VERI_ISLECLERI.map((x) => ({ id: x.id, ad: x.ad }))} />
            {!tek && <SablonAlani tekSatir deger={k.sag} set={(v) => d(i, { sag: v })} kaynaklar={kaynaklar} yer="Değer, / ile veri seç" etiket="Karşılaştırılacak" />}
          </motion.div>
        ); })}
      </AnimatePresence>
      {l.length < 10 && <button type="button" onClick={() => set({ ...a, kosullar: [...l, { sol: sutunlar[0]?.ad ?? "", islec: "esit", sag: "" }] })} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/75 hover:bg-white/[0.1]"><Plus className="h-3.5 w-3.5" />Süzgeç ekle</button>}
      {!l.length && <p className="text-[11.5px] text-white/40">Süzgeç yoksa tablodaki bütün kayıtlar alınır.</p>}
    </div>
  );
}

function VeriAyari({ a, set, k, kaynaklar, s }: { a: Adim; set: (a: Adim) => void; k: Kaynaklar; kaynaklar: VeriKaynagi[]; s: (p: Record<string, unknown>) => void }) {
  const ay = a.ayar as Record<string, string | number | boolean | undefined>;
  const yazi = (x: string) => String(ay[x] ?? "");
  const islem = veriIslemi(a);
  const tablolar = useTablolar(yazi("projeId"));
  const sutunlar = tablolar?.find((x) => x.ad === yazi("koleksiyon"))?.sema ?? [];
  const S = (alan: string, p: { satir?: number; tek?: boolean; yer?: string; kod?: boolean; etiket?: string } = {}) => <SablonAlani deger={yazi(alan)} set={(v) => s({ [alan]: v })} kaynaklar={kaynaklar} satir={p.satir} tekSatir={p.tek} yer={p.yer} kod={p.kod} etiket={p.etiket} />;
  const kimlikMi = (islem === "guncelle" || islem === "sil") ? yazi("hedef") !== "suzgec" : islem === "getir";
  const suzgecli = islem === "bul" || islem === "say" || ((islem === "guncelle" || islem === "sil") && !kimlikMi);
  const alanli = islem === "ekle" || islem === "guncelle" || islem === "upsert";
  const iskelet = () => s({ alanlar: JSON.stringify(Object.fromEntries(sutunlar.map((x) => [x.ad, ""])), null, 2) });
  const bulunamazsa = yazi("bulunamazsa") || (islem === "getir" ? "hata" : "bos");
  return (<>
    <Alan etiket="Build projesi"><AcilirSecim deger={yazi("projeId")} set={(v) => s({ projeId: v, koleksiyon: "" })} l={k.projeler} bos="Proje seç" /></Alan>
    <Alan etiket="Tablo"><TabloSecici projeId={yazi("projeId")} deger={yazi("koleksiyon")} set={(v) => s({ koleksiyon: v })} /></Alan>
    <Alan etiket="İşlem">
      <div className="grid grid-cols-2 gap-1.5">
        {VERI_ISLEMLERI.map((x) => { const on = islem === x.id; return (
          <button key={x.id} type="button" onClick={() => set({ ...a, ad: VERI_ISLEMLERI.some((y) => y.adimAdi === a.ad) || a.ad === "Kayıt ekle" ? x.adimAdi : a.ad, ayar: { ...a.ayar, islem: x.id } })}
            className={cn("rounded-[12px] px-2.5 py-2 text-left transition", on ? "bg-white/[0.08] ring-2 ring-inset ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]", x.id === "upsert" && "col-span-2")}>
            <span className="block text-[12.5px] font-medium text-white">{x.ad}</span><span className="block text-[11px] leading-snug text-white/45">{x.alt}</span>
          </button>
        ); })}
      </div>
    </Alan>
    {(islem === "guncelle" || islem === "sil") && <Alan etiket="Hangi kayıt"><Segment id={`vhedef-${a.id}`} kucuk deger={(yazi("hedef") || "kimlik") as "kimlik" | "suzgec"} set={(v) => s({ hedef: v })} l={[{ id: "kimlik", ad: "Kimliğiyle" }, { id: "suzgec", ad: "Süzgece uyanlar" }]} /></Alan>}
    {kimlikMi && <Alan etiket="Kayıt kimliği" ipucu="Önceki bir Kayıt bul ya da Kayıt ekle adımının id alanını / ile seç.">{S("kayitId", { tek: true, yer: "/ ile kimlik seç", etiket: "Kayıt kimliği" })}</Alan>}
    {suzgecli && (
      <Bolum baslik="Süzgeç">
        <VeriSuzgeci a={a} set={set} kaynaklar={kaynaklar} sutunlar={sutunlar} />
        <Alan etiket="Bütün alanlarda ara (isteğe bağlı)">{S("ara", { tek: true, yer: "Örneğin: / ile müşteri adı" })}</Alan>
      </Bolum>
    )}
    {islem === "bul" && (
      <Bolum baslik="Sıralama ve sınır">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
          <Alan etiket="Sırala"><SutunSecici deger={yazi("sirala") || "olusturma"} set={(v) => s({ sirala: v })} sutunlar={sutunlar} /></Alan>
          <Segment id={`vyon-${a.id}`} kucuk deger={(yazi("yon") || "azalan") as "azalan" | "artan"} set={(v) => s({ yon: v })} l={[{ id: "azalan", ad: "Yeniden eskiye" }, { id: "artan", ad: "Eskiden yeniye" }]} />
        </div>
        <Alan etiket="En çok kaç kayıt"><HazirSayi deger={Number(ay.sinir) || 50} set={(v) => s({ sinir: v })} l={[1, 10, 50, 100, 500]} birim="kayıt" boy={1000} /></Alan>
      </Bolum>
    )}
    {(islem === "guncelle" || islem === "sil") && !kimlikMi && <Alan etiket="En çok kaç kayıt" ipucu="Yanlış süzgeçte bütün tablo değişmesin diye sınır."><HazirSayi deger={Number(ay.sinir) || 100} set={(v) => s({ sinir: v })} l={[1, 10, 100, 1000]} birim="kayıt" boy={1000} /></Alan>}
    {islem === "upsert" && <Alan etiket="Eşleşme alanı" ipucu="Alanlardaki bu alanın değeri tabloda varsa o kayıt güncellenir, yoksa yeni kayıt eklenir (ör. eposta, siparisNo)."><SutunSecici deger={yazi("eslesme")} set={(v) => s({ eslesme: v })} sutunlar={sutunlar} bos="Alan seç" /></Alan>}
    {alanli && <Alan etiket={islem === "guncelle" ? "Değişecek alanlar (JSON)" : "Alanlar (JSON)"} sag={sutunlar.length ? <button type="button" onClick={iskelet} className="text-[11.5px] text-[#8be6ff]/80 hover:text-[#8be6ff]">Sütunlardan doldur</button> : undefined} ipucu={islem === "guncelle" ? "Yalnız yazdığın alanlar değişir; diğerleri korunur. Tablonun şeması varsa değerler denetlenir." : "Tablonun şeması varsa alanlar şemaya göre denetlenir."}>{S("alanlar", { satir: 4, kod: true })}</Alan>}
    {islem !== "ekle" && islem !== "upsert" && islem !== "say" && <Alan etiket="Bulunamazsa"><Segment id={`vbul-${a.id}`} kucuk deger={bulunamazsa as "bos" | "hata"} set={(v) => s({ bulunamazsa: v })} l={[{ id: "bos", ad: "Boş sonuçla devam et" }, { id: "hata", ad: "Hata ver" }]} /></Alan>}
    <p className="text-[12px] leading-relaxed text-white/45">{islem === "bul" ? "Çıktı: kayitlar listesi, ilk kayıt ve sayı. Listeyi Döngü adımına verip her kayıt için işlem yapabilirsin." : islem === "say" ? "Çıktı: sayi. Süzgeç adımıyla eşiğe göre dallandırabilirsin." : islem === "sil" ? "Silinen kayıtlar geri gelmez; tablo yedeklerinden dönebilirsin. Denemede silinmez, kaç kaydın silineceği gösterilir." : "Denemede yazılmaz; çalışmada gerçekten yazar ve Veri tablosu tetiğini dinleyen sistemleri çalıştırır."}</p>
  </>);
}

/* ───── Sistemi çağır ───── */
function CagirAyari({ a, set, k, kaynaklar, s }: { a: Adim; set: (a: Adim) => void; k: Kaynaklar; kaynaklar: VeriKaynagi[]; s: (p: Record<string, unknown>) => void }) {
  const ay = a.ayar as Record<string, string | number | undefined>;
  const hedef = k.sistemler.find((x) => x.id === ay.sistemId);
  const alanlar = hedef?.girdi ?? [];
  let degerler: Record<string, string> | null = null;
  try { const j = JSON.parse(String(ay.girdi || "{}")); if (j && typeof j === "object" && !Array.isArray(j)) degerler = Object.fromEntries(Object.entries(j).map(([x, y]) => [x, typeof y === "string" ? y : JSON.stringify(y)])); } catch { degerler = null; }
  const alanYaz = (ad: string, v: string) => { const o = { ...(degerler ?? {}), [ad]: v }; for (const x of Object.keys(o)) if (o[x] === "") delete o[x]; s({ girdi: JSON.stringify(o, null, 2) }); };
  const bekle = ay.mod !== "baslat";
  return (<>
    <Alan etiket="Hangi sistem" ipucu={!k.sistemler.length ? "Önce başka bir sistem kur." : undefined}>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1"><AcilirSecim deger={String(ay.sistemId ?? "")} set={(v) => s({ sistemId: v })} l={k.sistemler.map((x) => ({ id: x.id, ad: x.ad, alt: x.girdi?.length ? `${x.girdi.length} girdi alanı` : "Girdi alanı yok" }))} bos="Sistem seç" /></div>
        {hedef && <Link href={`/panel/build/sistemler/${hedef.id}`} target="_blank" aria-label="Sistemi aç" title="Sistemi yeni sekmede aç" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white/75 hover:bg-white/[0.12]"><ExternalLink className="h-4 w-4" /></Link>}
      </div>
    </Alan>
    <Alan etiket="Nasıl çalışsın">
      <div className="grid grid-cols-2 gap-1.5">
        {[{ id: "bekle", ad: "Bitmesini bekle", alt: "Çıktısını sonraki adımlarda kullan" }, { id: "baslat", ad: "Başlat ve devam et", alt: "Beklemeden sıradaki adıma geç" }].map((x) => { const on = (bekle ? "bekle" : "baslat") === x.id; return (
          <button key={x.id} type="button" onClick={() => s({ mod: x.id })} className={cn("rounded-[12px] px-2.5 py-2 text-left transition", on ? "bg-white/[0.08] ring-2 ring-inset ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]")}><span className="block text-[12.5px] font-medium text-white">{x.ad}</span><span className="block text-[11px] leading-snug text-white/45">{x.alt}</span></button>
        ); })}
      </div>
    </Alan>
    {hedef && (alanlar.length && degerler ? (
      <Bolum baslik={`${hedef.ad} girdileri`}>
        {alanlar.map((g) => (
          <Alan key={g.ad} etiket={g.etiket || g.ad} sag={<span className="text-[11px] text-white/35">{g.zorunlu ? "Zorunlu · " : ""}{g.tur === "sayi" ? "Sayı" : g.tur === "evet-hayir" ? "Evet ya da hayır" : g.tur === "secim" ? `Seçim: ${(g.secenekler ?? []).join(", ")}` : "Metin"}</span>} ipucu={g.aciklama}>
            <SablonAlani tekSatir={g.tur !== "uzunMetin"} satir={3} deger={degerler![g.ad] ?? ""} set={(v) => alanYaz(g.ad, v)} kaynaklar={kaynaklar} yer={g.varsayilan ? `Boşsa ${g.varsayilan}` : "/ ile veri seç ya da yaz"} etiket={g.etiket || g.ad} />
          </Alan>
        ))}
      </Bolum>
    ) : (
      <Alan etiket="Girdi (JSON)" ipucu={alanlar.length ? "Alanlar JSON olarak yazıldı; alan alan düzenlemek için geçerli bir JSON nesnesi bırak." : `${hedef.ad} sisteminde girdi alanı tanımlı değil; bu nesne tetik verisi olarak gider. Alan tanımlamak için o sistemde Elle tetiğinde girdi alanları ekle.`}>
        <SablonAlani deger={String(ay.girdi ?? "")} set={(v) => s({ girdi: v })} kaynaklar={kaynaklar} satir={4} kod />
      </Alan>
    ))}
    {bekle && <Alan etiket="Çağrılan sistem beklemeye geçerse en çok" ipucu="Onay ya da bekleme adımı varsa çağıran çalışma da bekler; süre dolarsa adım hata verir."><SureSecimi miktar={Number(ay.zamanAsimiMiktar) || 1} birim={String(ay.zamanAsimiBirim || "gun")} set={(m, b) => s({ zamanAsimiMiktar: m, zamanAsimiBirim: b })} /></Alan>}
    <p className="text-[12px] leading-relaxed text-white/45">Çağrılan sistem yayındaki sürümüyle çalışır (yayınlanmadıysa taslağıyla) ve kuyruğa girmez. Çalışma ayrıntısında iki çalışma birbirine bağlantı olarak görünür. Sonsuz döngü koruması: zincir en çok 5 düzey.</p>
  </>);
}

/* ───── Güvenlik denetimi ───── */
function GuvenlikAyari({ a, kaynaklar, s }: { a: Adim; kaynaklar: VeriKaynagi[]; s: (p: Record<string, unknown>) => void }) {
  const ay = a.ayar as Record<string, string | number | boolean | undefined>;
  const mod = ay.mod === "engelle" ? "engelle" : "maskele";
  return (<>
    <Alan etiket="Denetlenecek metin" ipucu="Genellikle kullanıcıdan gelen ya da modelin yazdığı metin: / ile seç.">
      <SablonAlani deger={String(ay.metin ?? "")} set={(v) => s({ metin: v })} kaynaklar={kaynaklar} satir={3} yer="/ ile metni seç" etiket="Metin" />
    </Alan>
    <Alan etiket="İhlal bulununca">
      <div className="grid grid-cols-2 gap-1.5">
        {[{ id: "maskele", ad: "Maskele", alt: "Bulunanların yerine etiket yazar, metin sürer" }, { id: "engelle", ad: "Engelle", alt: "Metni boşaltır; ihlal dalı çalışır" }].map((x) => (
          <button key={x.id} type="button" onClick={() => s({ mod: x.id, ihlalSonrasi: x.id === "engelle" ? "dur" : "devam" })} className={cn("rounded-[12px] px-2.5 py-2 text-left transition", mod === x.id ? "bg-white/[0.08] ring-2 ring-inset ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]")}><span className="block text-[12.5px] font-medium text-white">{x.ad}</span><span className="block text-[11px] leading-snug text-white/45">{x.alt}</span></button>
        ))}
      </div>
    </Alan>
    <Bolum baslik="Denetimler">
      <div className="-mt-1 divide-y divide-white/[0.05]">
        {GUVENLIK_DENETIMLERI.map((g) => (
          <label key={g.id} className="flex items-center gap-3 py-2.5">
            <span className="min-w-0 flex-1"><span className="block text-[13px] text-white/85">{g.ad}</span><span className="block text-[11.5px] leading-snug text-white/45">{g.alt}{g.ornek ? `, ör. ${g.ornek}` : ""}</span></span>
            <Anahtar acik={ay[g.id] === true} etiket={g.ad} set={(v) => s({ [g.id]: v })} />
          </label>
        ))}
      </div>
      {ay.uygunsuz === true && <Alan etiket="Uygunsuz içerik güven eşiği" ipucu="Model bu güvenin altında uygunsuz derse ihlal sayılmaz. Kredi harcar; sistem ayarlarındaki modeli kullanır."><HazirSayi deger={Number(ay.esik ?? 60)} set={(v) => s({ esik: v })} l={[40, 60, 80]} birim="puan" en={0} boy={100} /></Alan>}
      <Alan etiket="Özel kalıp (isteğe bağlı)" ipucu="Düzenli ifade; ör. sipariş numarası SP-\d{6}. Bulunanlar Özel kalıp ihlali sayılır.">
        <input value={String(ay.ozelDesen ?? "")} onChange={(e) => s({ ozelDesen: e.target.value.slice(0, 300) || undefined })} spellCheck={false} placeholder="SP-\d{6}" className={cn(alanSinif, "sc-kod h-10 text-[13px]")} />
      </Alan>
    </Bolum>
    <Alan etiket="İhlal dalından sonra"><Segment id={`gsonra-${a.id}`} kucuk deger={(ay.ihlalSonrasi === "dur" ? "dur" : "devam") as "devam" | "dur"} set={(v) => s({ ihlalSonrasi: v })} l={[{ id: "devam", ad: "Ana akışa devam et" }, { id: "dur", ad: "Sistemi durdur" }]} /></Alan>
    <p className="text-[12px] leading-relaxed text-white/45">Tuvalde iki dal açılır: Temizse ve İhlal varsa. Çıktı: metin (maskeli ya da temiz), temiz, ihlaller listesi. Kalıp denetimleri yerelde çalışır, metin modele gitmez; yalnız uygunsuz içerik denetimi modeli kullanır. Girdi kaydında metin maskeli saklanır.</p>
  </>);
}

/* ───── Adım ayarı ───── */
export function AdimAyari({ a, set, k, kaynaklar, sistemId }: { a: Adim; set: (a: Adim) => void; k: Kaynaklar; kaynaklar: VeriKaynagi[]; sistemId?: string }) {
  const ay = a.ayar as Record<string, string | number | boolean | undefined>;
  const s = (p: Record<string, unknown>) => set({ ...a, ayar: { ...a.ayar, ...p } });
  const yazi = (x: string) => String(ay[x] ?? "");
  const sayi = (x: string, v: number) => (Number.isFinite(Number(ay[x])) && ay[x] !== "" && ay[x] !== undefined ? Number(ay[x]) : v);
  const bg = k.baglantilar.find((b) => b.id === ay.baglantiId);
  const arac = bg?.araclar.find((t) => t.name === ay.arac);
  const S = (alan: string, p: { satir?: number; tek?: boolean; yer?: string; kod?: boolean; etiket?: string } = {}) => <SablonAlani deger={yazi(alan)} set={(v) => s({ [alan]: v })} kaynaklar={kaynaklar} satir={p.satir} tekSatir={p.tek} yer={p.yer} kod={p.kod} etiket={p.etiket} />;
  const grup = (yazi("grup") || "metin") as DonusturGrup;
  const islem = DONUSTUR_ISLEMLERI[grup]?.find((x) => x.id === yazi("islem"));
  return (
    <div className="space-y-4">
      <Alan etiket="Adım adı"><input value={a.ad} onChange={(e) => set({ ...a, ad: e.target.value })} maxLength={80} className={cn(alanSinif, "h-10")} /></Alan>
      {a.tur === "ajan" && (<>
        <Alan etiket="Kim yapsın"><AcilirSecim deger={yazi("ajanId")} set={(v) => s({ ajanId: v })} l={k.ajanlar.map((x) => ({ id: x.id, ad: x.ad, gorsel: x.simge }))} bos="Vayra (genel asistan)" /></Alan>
        <Alan etiket="Görev" ipucu="Ajan bu görevi tek seferde yapar. / yazarak ya da sağ alttaki düğmeyle önceki adımların verisini ekle. Otomasyonda onay isteyen araçları kullanmaz.">{S("istem", { satir: 6, yer: "Ne yapsın? Örneğin: gelen mesajı sınıflandır ve kısa bir yanıt yaz", etiket: "Görev" })}</Alan>
        <Bolum baslik="Çıktı alanları">
          <p className="-mt-2 text-[12px] leading-relaxed text-white/50">{a.alanlar?.length ? "Model yanıtını bu alanlarla JSON olarak verir; sonraki adımlar alanları tek tek seçer." : "Alan eklersen model yanıtını yapılandırılmış verir (ör. sınıf, yanıt, puan). Eklemezsen çıktı tek metindir."}</p>
          <AlanSemasi l={a.alanlar ?? []} set={(l) => set({ ...a, alanlar: l.length ? l : undefined })} />
        </Bolum>
      </>)}
      {a.tur === "arac" && (<>
        <Alan etiket="Araç"><AcilirSecim deger={yazi("arac")} set={(v) => s({ arac: v, ...(VAYRA_ARACLARI.find((x) => x.id === v)?.ek ?? {}) })} l={VAYRA_ARACLARI} /></Alan>
        <Alan etiket={yazi("arac") === "ses_uret" ? "Seslendirilecek metin" : "İstem"} ipucu={yazi("arac") === "ses_uret" ? undefined : "Görsel ve video modelleri İngilizce istemle daha iyi sonuç verir."}>{S(yazi("arac") === "ses_uret" ? "metin" : "istem", { satir: 4 })}</Alan>
        {(yazi("arac") === "gorsel_uret" || yazi("arac") === "video_uret") && <Alan etiket="Oran"><Segment id={`oran-${a.id}`} kucuk deger={yazi("oran") || "1:1"} set={(v) => s({ oran: v })} l={["1:1", "4:5", "16:9", "9:16"].map((x) => ({ id: x, ad: x }))} /></Alan>}
      </>)}
      {a.tur === "baglanti" && (<>
        <Alan etiket="Bağlantı" ipucu={!k.baglantilar.length ? "Önce Bağlantılar sayfasından bir servis bağla." : undefined}><AcilirSecim deger={yazi("baglantiId")} set={(v) => s({ baglantiId: v, arac: "" })} l={k.baglantilar.filter((b) => b.durum === "etkin").map((b) => ({ id: b.id, ad: b.ad, gorsel: b.logo, alt: `${b.araclar.length} araç` }))} bos="Bağlantı seç" /></Alan>
        {bg && <Alan etiket="Araç"><AcilirSecim deger={yazi("arac")} set={(v) => { const t = bg.araclar.find((x) => x.name === v); const iskelet = Object.fromEntries(Object.keys(t?.inputSchema?.properties ?? {}).map((p) => [p, ""])); s({ arac: v, girdi: JSON.stringify(iskelet, null, 2) }); }} l={bg.araclar.map((t) => ({ id: t.name, ad: t.annotations?.title ?? t.title ?? t.name, alt: t.description }))} bos="Araç seç" /></Alan>}
        {arac && <Alan etiket="Girdi (JSON)" ipucu={arac.description}>{S("girdi", { satir: 6, kod: true })}</Alan>}
      </>)}
      {a.tur === "http" && (<>
        <Alan etiket="Adres">
          <div className="flex gap-2"><div className="w-[104px] shrink-0"><AcilirSecim deger={yazi("yontem") || "POST"} set={(v) => s({ yontem: v })} l={["GET", "POST", "PUT", "PATCH", "DELETE"].map((x) => ({ id: x, ad: x }))} /></div><div className="min-w-0 flex-1">{S("url", { tek: true, yer: "https://api.ornek.com/kanca", etiket: "Adres" })}</div></div>
        </Alan>
        <Alan etiket="Başlıklar (JSON, isteğe bağlı)">{S("basliklar", { satir: 2, kod: true, yer: "{\"Authorization\": \"Bearer anahtar\"}" })}</Alan>
        {yazi("yontem") !== "GET" && yazi("yontem") !== "DELETE" && <Alan etiket="Gövde" ipucu="JSON yazarsan tırnak içindeki veriler kaçışlı metin olarak, tırnak dışındakiler JSON değeri olarak yerleşir.">{S("govde", { satir: 5, kod: true })}</Alan>}
        <Alan etiket="Zaman aşımı"><HazirSayi deger={sayi("zamanAsimi", 20)} set={(v) => s({ zamanAsimi: v })} l={[10, 20, 30, 60]} birim="saniye" boy={60} /></Alan>
      </>)}
      {a.tur === "kosul" && (<>
        <KosulDuzenleyici id={a.id} l={a.kosullar?.length ? a.kosullar : [{ sol: "", islec: "iceriyor", sag: "" }]} baglac={a.baglac ?? "ve"} set={(l, b) => set({ ...a, kosullar: l, baglac: b })} kaynaklar={kaynaklar} />
        <p className="text-[12px] leading-relaxed text-white/45">Koşul tutmazsa sistem burada durur ve çalışma Durdu olarak kaydedilir. Döngünün içindeyse yalnız o öğe atlanır.</p>
      </>)}
      {a.tur === "veri" && <VeriAyari a={a} set={set} k={k} kaynaklar={kaynaklar} s={s} />}
      {a.tur === "cagir" && <CagirAyari a={a} set={set} k={k} kaynaklar={kaynaklar} s={s} />}
      {a.tur === "guvenlik" && <GuvenlikAyari a={a} kaynaklar={kaynaklar} s={s} />}
      {a.tur === "yanit" && <YanitAyari a={a} set={set} kaynaklar={kaynaklar} s={s} />}
      {a.tur === "paralel" && <ParalelAyari a={a} set={set} kaynaklar={kaynaklar} s={s} />}
      {a.tur === "depo" && <DepoAyari a={a} set={set} kaynaklar={kaynaklar} s={s} />}
      {a.tur === "uygulama" && <UygulamaAyari a={a} set={set} kaynaklar={kaynaklar} s={s} />}
      {a.tur === "bekle" && (<>
        <Segment id={`bmod-${a.id}`} kucuk deger={(yazi("mod") || "sure") as "sure" | "tarih" | "webhook"} set={(v) => s({ mod: v })} l={[{ id: "sure", ad: "Süre kadar" }, { id: "tarih", ad: "Tarihe kadar" }, { id: "webhook", ad: "Dış çağrıya kadar" }]} />
        {(yazi("mod") || "sure") === "sure" && <Alan etiket="Ne kadar" ipucu="5 saniyeden uzun beklemeler diske yazılır; sunucu yeniden başlasa da çalışma kaldığı yerden sürer. En çok 30 gün."><SureSecimi miktar={sayi("miktar", 10)} birim={yazi("birim") || "dakika"} set={(m, b) => s({ miktar: m, birim: b })} hazir={[{ m: 30, b: "saniye" }, ...SURE_HAZIR]} /></Alan>}
        {yazi("mod") === "tarih" && <Alan etiket="Hangi zamana kadar" ipucu="Türkiye saatiyle 06.11.2026 09:00, 6 Kasım 2026 09:00 ya da ISO biçimi. Bir önceki adımdan tarih de seçebilirsin; geçmişteyse beklemeden sürer.">{S("tarih", { tek: true, yer: "06.11.2026 09:00" })}</Alan>}
        {yazi("mod") === "webhook" && (<>
          <div className="rounded-[14px] bg-[#55d6fd]/[0.06] px-3.5 py-3 text-[12.5px] leading-relaxed text-white/70 ring-1 ring-inset ring-[#55d6fd]/15">Her çalışmanın kendine özel devam adresi var: önceki bir adımda <span className="rounded bg-[#55d6fd]/[0.12] px-1 text-[#8be6ff]">Devam adresi</span> verisini dış servise gönder. O adrese istek gelince gövdesi bu adımın çıktısı olur ve sistem sürer.</div>
          <Alan etiket="En çok ne kadar beklesin"><SureSecimi miktar={sayi("zamanAsimiMiktar", 1)} birim={yazi("zamanAsimiBirim") || "gun"} set={(m, b) => s({ zamanAsimiMiktar: m, zamanAsimiBirim: b })} /></Alan>
          <Alan etiket="İstek gelmezse"><Segment id={`basim-${a.id}`} kucuk deger={(yazi("zamanAsiminda") || "devam") as "devam" | "hata"} set={(v) => s({ zamanAsiminda: v })} l={[{ id: "devam", ad: "Boş veriyle devam et" }, { id: "hata", ad: "Hata ver" }]} /></Alan>
        </>)}
      </>)}
      {a.tur === "yonlendirici" && (<>
        <Alan etiket="Hangi dallar çalışsın"><Segment id={`ymod-${a.id}`} kucuk deger={(yazi("mod") || "ilk") as "ilk" | "hepsi"} set={(v) => s({ mod: v })} l={[{ id: "ilk", ad: "İlk uyan dal" }, { id: "hepsi", ad: "Uyan her dal, sırayla" }]} /></Alan>
        <DallarDuzenleyici a={a} set={(d) => set({ ...a, dallar: d })} kaynaklar={kaynaklar} />
        <p className="text-[12px] leading-relaxed text-white/45">Dallar bitince akış birleşme noktasından sürer; sonraki adımlar her daldaki adımların verisini kullanabilir.</p>
      </>)}
      {a.tur === "siniflandir" && (<>
        <Alan etiket="Sınıflandırılacak metin">{S("girdi", { satir: 3, yer: "Örneğin: / ile müşteri mesajını seç", etiket: "Metin" })}</Alan>
        <Alan etiket="Talimat (isteğe bağlı)"><textarea value={yazi("talimat")} onChange={(e) => s({ talimat: e.target.value })} rows={2} maxLength={2000} placeholder="Bu bir e-ticaret müşteri mesajı. Sipariş numarası geçiyorsa sipariş dalını tercih et." className={cn(alanSinif, "resize-y py-2.5 text-[13.5px]")} /></Alan>
        <Alan etiket="Güven eşiği" ipucu="Modelin güveni bunun altındaysa Hiçbiri uymazsa dalı çalışır."><HazirSayi deger={sayi("esik", 50)} set={(v) => s({ esik: v })} l={[30, 50, 70, 90]} birim="puan" en={0} boy={100} /></Alan>
        <DallarDuzenleyici a={a} set={(d) => set({ ...a, dallar: d })} kaynaklar={kaynaklar} />
      </>)}
      {a.tur === "dongu" && (<>
        <Alan etiket="Liste" ipucu="Önceki bir adımdan liste seç (ör. sipariş satırları). Metin verirsen satır satır bölünür; sayı verirsen 1'den o sayıya kadar döner.">{S("liste", { tek: true, yer: "/ ile liste seç", etiket: "Liste" })}</Alan>
        <Alan etiket="Metin listeyse ayraç"><Segment id={`ayrac-${a.id}`} kucuk deger={(yazi("ayrac") || "satir") as "satir" | "virgul" | "ozel"} set={(v) => s({ ayrac: v })} l={[{ id: "satir", ad: "Satır" }, { id: "virgul", ad: "Virgül" }, { id: "ozel", ad: "Özel" }]} /></Alan>
        {yazi("ayrac") === "ozel" && <input value={yazi("ayracOzel")} onChange={(e) => s({ ayracOzel: e.target.value.slice(0, 10) })} placeholder="Ayraç, ör. ;" className={cn(alanSinif, "h-10 w-32")} />}
        <Alan etiket="En çok kaç öğe"><HazirSayi deger={sayi("sinir", 100)} set={(v) => s({ sinir: v })} l={[10, 50, 100, 500]} birim="öğe" boy={500} /></Alan>
        <Bolum baslik="Sonunda topla">
          <Segment id={`topla-${a.id}`} kucuk deger={(yazi("topla") || "liste") as "liste" | "metin" | "sayi"} set={(v) => s({ topla: v })} l={[{ id: "liste", ad: "Liste" }, { id: "metin", ad: "Metin" }, { id: "sayi", ad: "Sayı" }]} />
          <Alan etiket="Her turdan ne alınsın" ipucu="Boş bırakırsan döngüdeki son adımın çıktısı alınır. Sonuç: sonuclar, metin, sayi; sayılarda toplam, ortalama, enKucuk, enBuyuk.">{S("toplaDeger", { tek: true, yer: "Örneğin: / ile son adımın bir alanı" })}</Alan>
        </Bolum>
      </>)}
      {a.tur === "onay" && (<>
        <Alan etiket="Başlık">{S("baslik", { tek: true, yer: "Örneğin: Haftanın gönderisi" })}</Alan>
        <Alan etiket="Onaylanacak içerik">{S("icerik", { satir: 5, yer: "/ ile önceki adımın çıktısını seç" })}</Alan>
        <label className="flex items-center justify-between gap-3 rounded-[14px] bg-white/[0.03] px-3.5 py-2.5 ring-1 ring-inset ring-white/[0.06]"><span className="text-[13px] text-white/80">Onaylayan içeriği düzenleyebilsin<span className="block text-[11.5px] text-white/45">Düzenlenen hal, onay adımının içerik alanıyla sonraki adımlara gider</span></span><Anahtar acik={ay.duzenlenebilir !== false} etiket="Düzenlenebilir" set={(v) => s({ duzenlenebilir: v })} /></label>
        <Alan etiket="Yanıt gelmezse ne kadar sonra"><SureSecimi miktar={sayi("zamanAsimiMiktar", 1)} birim={yazi("zamanAsimiBirim") || "gun"} set={(m, b) => s({ zamanAsimiMiktar: m, zamanAsimiBirim: b })} /></Alan>
        <Alan etiket="Varsayılan karar"><Segment id={`vk-${a.id}`} kucuk deger={(yazi("varsayilan") || "ret") as "ret" | "onay"} set={(v) => s({ varsayilan: v })} l={[{ id: "ret", ad: "Reddedilmiş say" }, { id: "onay", ad: "Onaylanmış say" }]} /></Alan>
        <p className="text-[12px] leading-relaxed text-white/45">İstek Sistemler sayfasındaki Onaylar kutusuna düşer. Dışarıdan karar da verilebilir: devam adresine karar alanını onay ya da ret olarak gönder; adresi önceki bir adımla Slack'e ya da e-postaya iletebilirsin.</p>
      </>)}
      {a.tur === "kod" && sistemId && <KodYazici sistemId={sistemId} a={a} set={set} />}
      {a.tur === "kod" && (
        <Alan etiket="JavaScript" ipucu={<>girdi.tetik tetik verisi, girdi.adim[&quot;2&quot;] ya da girdi.adim[&quot;kimlik&quot;] önceki adımın JSON çıktısı, döngüdeyse girdi.dongu.oge. Döndürdüğün nesne bu adımın çıktısı olur. Ağa ve dosyaya erişim yok; 5 saniye, 32 MB. vayra.hmac ve vayra.ozet imza hesaplar.</>}>
          <textarea value={yazi("kod")} onChange={(e) => s({ kod: e.target.value })} rows={12} spellCheck={false}
            onKeyDown={(e) => { if (e.key === "Tab") { e.preventDefault(); const t = e.currentTarget, b = t.selectionStart, n = t.selectionEnd; const v = `${t.value.slice(0, b)}  ${t.value.slice(n)}`; s({ kod: v }); requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = b + 2; }); } }}
            className={cn(alanSinif, "sc-kod resize-y bg-[#0c0d0f] py-3 text-[12.5px] leading-relaxed")} />
        </Alan>
      )}
      {a.tur === "donustur" && (<>
        <Alan etiket="Ne dönüşsün"><Segment id={`dgrup-${a.id}`} kucuk deger={grup} set={(v) => s({ grup: v, islem: DONUSTUR_ISLEMLERI[v][0].id, p1: "", p2: "" })} l={[{ id: "metin", ad: "Metin" }, { id: "sayi", ad: "Sayı" }, { id: "tarih", ad: "Tarih" }, { id: "json", ad: "JSON" }, { id: "liste", ad: "Liste" }, { id: "yardimci", ad: "Yardımcı" }]} /></Alan>
        <Alan etiket="İşlem"><AcilirSecim deger={yazi("islem")} set={(v) => set({ ...a, ad: Object.values(DONUSTUR_ISLEMLERI).flat().some((x) => x.ad === a.ad) || a.ad === "Dönüştür" ? DONUSTUR_ISLEMLERI[grup].find((x) => x.id === v)?.ad ?? a.ad : a.ad, ayar: { ...a.ayar, islem: v, p1: "", p2: "" } })} l={DONUSTUR_ISLEMLERI[grup].map((x) => ({ id: x.id, ad: x.ad }))} /></Alan>
        {yazi("islem") === "ayarla" ? <AlanAyarla a={a} set={set} kaynaklar={kaynaklar} s={s} /> : !["rastgele", "kimlik"].includes(yazi("islem")) && <Alan etiket={grup === "liste" ? "Liste" : "Değer"} ipucu={grup === "liste" ? "/ ile bir liste seç: Kayıt bul sonucu, döngü sonuçları ya da HTTP yanıtındaki dizi." : undefined}>{S("deger", { tek: true, yer: grup === "liste" ? "/ ile liste seç" : "/ ile dönüşecek veriyi seç" })}</Alan>}
        {islem?.p1 && <Alan etiket={islem.p1}>{islem.secenek1 ? <AcilirSecim deger={yazi("p1") || islem.secenek1[0].id} set={(v) => s({ p1: v })} l={islem.secenek1} /> : S("p1", { tek: islem.id !== "arama", satir: 4, yer: islem.p1Yer })}</Alan>}
        {islem?.p2 && (!islem.secenek1 || yazi("p1") === "ozel") && <Alan etiket={islem.p2} ipucu={islem.id === "bicim" && grup === "tarih" ? "GG gün, AA ay, AAAA ay adı, YYYY yıl, GGGG gün adı, SS saat, dd dakika, ss saniye" : undefined}>{islem.secenek2 ? <AcilirSecim deger={yazi("p2") || islem.secenek2[0].id} set={(v) => s({ p2: v })} l={islem.secenek2} /> : S("p2", { tek: true, yer: islem.p2Yer })}</Alan>}
      </>)}
      <HataAyari a={a} set={set} kaynaklar={kaynaklar} />
    </div>
  );
}
