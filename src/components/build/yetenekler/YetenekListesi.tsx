"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Download, FileText, Loader2, MoreHorizontal, Pencil, Plus, Search, Sparkles, Trash2, Upload, Wand2, X } from "lucide-react";
import { Kart } from "@/components/film/ortak";
import { Suzgec } from "@/components/build/ana/Bolumler";
import { Md } from "@/components/build/sohbet/SohbetEkrani";
import { Anahtar, Secici } from "@/components/build/ajanlar/AjanDuzenleyici";
import { ANTHROPIC_YETENEKLERI } from "@/lib/build/yetenekDizin";
import { AnthropicDizini } from "./AnthropicDizini";
import { Degerlendirmeler, DizinIsareti, useDizinIstatistik } from "./YetenekGelismis";
import { belirtecTahmini } from "@/lib/build/yetenekKalite";
import { zipOlustur } from "@/components/build/calisma/zip";
import { api, ApiHatasi, gorece } from "@/lib/build/istemci";
import { YETENEK_KATALOGU, YETENEK_KATEGORI, type KatalogYetenek, type YetenekKategori } from "@/lib/build/yetenekKatalog";
import { cn } from "@/lib/utils";

export type YetenekOzet = {
  id: string; ad: string; baslik: string; aciklama: string; simge: string; kategori?: YetenekKategori; katalogId?: string; herSohbette: boolean; surum: number; guncelleme: number; dosya: number; boyut: number;
  cagri?: "model" | "elle" | "her-zaman"; sabitSurum?: number; gerekenBaglantilar?: string[]; tarama?: "temiz" | "kritik" | "uyari" | "bilgi"; paylasimda?: boolean; kaynak?: { tur: string; ad?: string; lisans?: string };
};
export const CAGRI_AD = { model: "Model karar verir", elle: "Yalnız istenince", "her-zaman": "Her zaman açık" } as const;

/** Dosyayı base64'e çevirir (zip içe aktarımı sunucuda açılır; betikler dahil metin dosyaları alınır). */
async function base64(f: File): Promise<string> {
  const b = new Uint8Array(await f.arrayBuffer());
  let s = "";
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}
/** SKILL.md'yi tek dosya olarak indirir. */
export async function yetenekMdIndir(id: string) {
  const v = await api<{ yetenek: { ad: string }; skillMd: string }>(`/api/build/yetenekler/${id}`);
  const u = URL.createObjectURL(new Blob([v.skillMd], { type: "text/markdown" }));
  const a = document.createElement("a"); a.href = u; a.download = `${v.yetenek.ad}-SKILL.md`; a.click();
  setTimeout(() => URL.revokeObjectURL(u), 2000);
}

const ORNEKLER = [
  "Müşteri e-postalarına markamın tonunda, kısa ve çözüm odaklı cevap yazma",
  "Haftalık satış CSV'sini analiz edip yöneticilere özet rapor çıkarma",
  "Blog yazılarını SEO kurallarımıza göre düzenleme",
  "Ürün fotoğrafı istemlerini stüdyo ışığı kurallarımıza göre yazma",
];

export function YetenekSimge({ src, boyut = 40 }: { src: string; boyut?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" width={boyut} height={boyut} style={{ width: boyut, height: boyut, borderRadius: Math.round(boyut * 0.28) }} className="shrink-0 bg-white/[0.06] object-cover ring-1 ring-inset ring-white/10" />;
}

/** Yeteneği SKILL.md + dosyalarıyla .zip olarak indirir (Claude ve Codex ile uyumlu klasör yapısı). */
export async function yetenekIndir(id: string) {
  const v = await api<{ yetenek: { ad: string; dosyalar: { yol: string; icerik: string }[] }; skillMd: string }>(`/api/build/yetenekler/${id}`);
  const d: Record<string, string> = { "SKILL.md": v.skillMd };
  for (const f of v.yetenek.dosyalar) d[f.yol] = f.icerik;
  const u = URL.createObjectURL(zipOlustur(d, v.yetenek.ad));
  const a = document.createElement("a"); a.href = u; a.download = `${v.yetenek.ad}.zip`; a.click();
  setTimeout(() => URL.revokeObjectURL(u), 2000);
}

/** "Ne öğretmek istiyorsun" kutusu + içe aktarma (SKILL.md ya da .zip). */
function OlusturKarti({ yenile }: { yenile: () => void }) {
  const router = useRouter();
  const [tarif, setTarif] = useState("");
  const [gidiyor, setGidiyor] = useState<"" | "tarif" | "bos" | "ice">("");
  const [hata, setHata] = useState("");
  const dosya = useRef<HTMLInputElement>(null);
  const alan = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const t = alan.current; if (t) { t.style.height = "0px"; t.style.height = `${Math.min(t.scrollHeight, 200)}px`; } }, [tarif]);
  const olustur = async (g: Record<string, unknown>, tur: typeof gidiyor) => {
    if (gidiyor) return;
    setGidiyor(tur); setHata("");
    try { const v = await api<{ id: string; yapayZeka?: boolean; atlanan?: number; tarama?: string }>("/api/build/yetenekler", { govde: g }); yenile(); const q = [v.yapayZeka === false ? "taslak=1" : "", v.atlanan ? `atlanan=${v.atlanan}` : ""].filter(Boolean).join("&"); router.push(`/panel/build/yetenekler/${v.id}${q ? `?${q}` : ""}`); }
    catch (e) { setHata(e instanceof ApiHatasi ? e.message : "Oluşturulamadı."); setGidiyor(""); }
  };
  const iceAktar = async (f: File) => {
    if (f.name.toLowerCase().endsWith(".zip")) {
      if (f.size > 5_000_000) { setHata("Zip en çok 5 MB olabilir."); return; }
      await olustur({ zip: await base64(f) }, "ice");
    } else await olustur({ skillMd: await f.text() }, "ice");
  };
  return (
    <Kart ikon={Wand2} baslik="Yetenek oluştur" alt="Ajanlarına bir işi nasıl yapacağını öğret; gerektiğinde kendisi yükler"
      sag={<>
        <button type="button" onClick={() => dosya.current?.click()} disabled={!!gidiyor} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white hover:bg-white/[0.13] disabled:opacity-50">{gidiyor === "ice" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}<span className="max-sm:hidden">İçe aktar</span></button>
        <button type="button" onClick={() => olustur({}, "bos")} disabled={!!gidiyor} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white hover:bg-white/[0.13] disabled:opacity-50">{gidiyor === "bos" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}<span className="max-sm:hidden">Boş yetenek</span></button>
      </>} govde="p-4 sm:p-5">
      <input ref={dosya} type="file" accept=".md,.zip,text/markdown" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) iceAktar(f); }} />
      <div className="cam-istemci rounded-[22px] p-2">
        <textarea ref={alan} value={tarif} onChange={(e) => setTarif(e.target.value)} rows={2} maxLength={4000}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (tarif.trim()) olustur({ tarif: tarif.trim() }, "tarif"); } }}
          placeholder="Ne öğretmek istiyorsun? Örneğin: teklif e-postalarını şirket şablonumuza göre yazmak…"
          className="block min-h-[64px] w-full resize-none bg-transparent px-3 pt-2 text-[15px] leading-relaxed text-white outline-none placeholder:text-white/35" />
        <div className="flex items-center justify-between gap-2 px-1 pb-0.5">
          <span className="pl-2 text-[12px] text-white/40">SKILL.md biçiminde; Claude ve Codex yetenekleriyle uyumlu</span>
          <button type="button" onClick={() => olustur({ tarif: tarif.trim() }, "tarif")} disabled={!tarif.trim() || !!gidiyor}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white pl-4 pr-3 text-[14px] font-semibold text-black transition-opacity disabled:opacity-35">
            {gidiyor === "tarif" ? <><Loader2 className="h-4 w-4 animate-spin" />Yazılıyor</> : <>Oluştur<ArrowUp className="h-4 w-4" /></>}
          </button>
        </div>
      </div>
      {hata && <p className="mt-3 text-[13px] text-rose-300">{hata}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {ORNEKLER.map((o) => <button key={o} type="button" onClick={() => { setTarif(o); alan.current?.focus(); }} className="rounded-full bg-white/[0.06] px-3.5 py-1.5 text-left text-[12.5px] text-white/60 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.1] hover:text-white">{o}</button>)}
      </div>
    </Kart>
  );
}

function YetenekSatiri({ y, yenile }: { y: YetenekOzet; yenile: () => void }) {
  const [menu, setMenu] = useState(false);
  const [silOnay, setSilOnay] = useState(false);
  const [acik, setAcik] = useState(y.herSohbette);
  const kok = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const f = (e: PointerEvent) => { if (!kok.current?.contains(e.target as Node)) { setMenu(false); setSilOnay(false); } };
    addEventListener("pointerdown", f);
    return () => removeEventListener("pointerdown", f);
  }, [menu]);
  return (
    <div className="group relative flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] sm:px-5">
      <Link href={`/panel/build/yetenekler/${y.id}`} className="absolute inset-0" aria-label={`${y.baslik} yeteneğini düzenle`} />
      <YetenekSimge src={y.simge} boyut={44} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2"><span className="truncate text-[14.5px] font-semibold text-white">{y.baslik}</span><span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/45 max-sm:hidden">{y.ad}</span></span>
        <span className="mt-0.5 block truncate text-[12.5px] text-white/50">{y.aciklama || "Açıklama yok: model ne zaman kullanacağını bilemez"}</span>
        {(y.tarama === "kritik" || y.tarama === "uyari" || (y.cagri && y.cagri !== "model") || y.sabitSurum || y.paylasimda || y.gerekenBaglantilar?.length || y.kaynak?.tur === "anthropic") && (
          <span className="mt-1.5 flex flex-wrap gap-1">
            {y.tarama === "kritik" && <span className="rounded-full bg-rose-500/[0.12] px-2 py-0.5 text-[11px] font-medium text-rose-200">Güvenlik: kritik bulgu, kapalı</span>}
            {y.tarama === "uyari" && <span className="rounded-full bg-amber-400/[0.1] px-2 py-0.5 text-[11px] text-amber-200/90">Güvenlik uyarısı</span>}
            {y.cagri && y.cagri !== "model" && <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] text-white/60">{CAGRI_AD[y.cagri]}</span>}
            {y.sabitSurum && <span className="rounded-full bg-[#55d6fd]/[0.12] px-2 py-0.5 text-[11px] text-[#8be6ff]">Sürüm {y.sabitSurum} sabit</span>}
            {!!y.gerekenBaglantilar?.length && <span className="rounded-full bg-white/[0.07] max-sm:hidden px-2 py-0.5 text-[11px] text-white/60">{y.gerekenBaglantilar.length} bağlantı ister</span>}
            {y.paylasimda && <span className="rounded-full bg-white/[0.07] max-sm:hidden px-2 py-0.5 text-[11px] text-white/60">Paylaşımda</span>}
            {y.kaynak?.tur === "anthropic" && <span className="rounded-full bg-white/[0.07] max-sm:hidden px-2 py-0.5 text-[11px] text-white/60">Anthropic · {y.kaynak.lisans}</span>}
          </span>
        )}
      </span>
      <span className="hidden shrink-0 text-[12px] text-white/40 md:block">{y.dosya ? `${y.dosya} dosya · ` : ""}sürüm {y.surum} · {gorece(y.guncelleme)}</span>
      <label className="relative z-10 flex shrink-0 items-center gap-2 text-[12px] text-white/55" title="Açıksa genel sohbette her zaman kullanılabilir">
        <span className="max-sm:hidden">Her sohbette</span>
        <Anahtar acik={acik} etiket="Her sohbette" set={async (v) => { if (v && y.tarama === "kritik") return; setAcik(v); await api(`/api/build/yetenekler/${y.id}`, { method: "PATCH", govde: { herSohbette: v } }).catch(() => setAcik(!v)); }} />
      </label>
      <div ref={kok} className="relative z-10">
        <button type="button" onClick={() => setMenu((x) => !x)} aria-label="Yetenek menüsü" className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.08] hover:text-white"><MoreHorizontal className="h-4 w-4" /></button>
        <AnimatePresence>
          {menu && (
            <motion.div initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.14 }}
              className="absolute right-0 top-9 z-30 w-[200px] rounded-[16px] bd-panel p-1.5">
              <Link href={`/panel/build/yetenekler/${y.id}`} className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/85 hover:bg-white/[0.07]"><Pencil className="h-4 w-4 text-white/55" />Düzenle</Link>
              <button type="button" onClick={() => { setMenu(false); yetenekIndir(y.id); }} className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/85 hover:bg-white/[0.07]"><Download className="h-4 w-4 text-white/55" />İndir (.zip)</button>
              <button type="button" onClick={() => { setMenu(false); yetenekMdIndir(y.id); }} className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-white/85 hover:bg-white/[0.07]"><FileText className="h-4 w-4 text-white/55" />SKILL.md indir</button>
              <div className="my-1 h-px bg-white/[0.07]" />
              <button type="button" onClick={async () => { if (!silOnay) { setSilOnay(true); return; } await api(`/api/build/yetenekler/${y.id}`, { method: "DELETE" }).catch(() => {}); yenile(); }}
                className={cn("flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] hover:bg-rose-500/[0.1]", silOnay ? "bg-rose-500/[0.12] font-semibold text-rose-200" : "text-rose-300/90")}><Trash2 className="h-4 w-4" />{silOnay ? "Silmek için tekrar tıkla" : "Sil"}</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Katalog yeteneği ayrıntısı: sağdan açılan panel, SKILL.md önizlemesi. */
function KatalogPaneli({ k, kapat, ekle, gidiyor, ekli }: { k: KatalogYetenek; kapat: () => void; ekle: () => void; gidiyor: boolean; ekli?: string }) {
  const [hazir, setHazir] = useState(false);
  useEffect(() => setHazir(true), []);
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") kapat(); }; addEventListener("keydown", t); return () => removeEventListener("keydown", t); }, [kapat]);
  if (!hazir) return null;
  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex justify-end bg-black/50 sm:p-3" onMouseDown={(e) => { if (e.target === e.currentTarget) kapat(); }}>
      <motion.div role="dialog" aria-modal="true" aria-label={k.baslik} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="flex h-full w-full max-w-[620px] flex-col overflow-hidden bg-[#141416] ring-1 ring-white/[0.1] sm:rounded-[24px]">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
          <YetenekSimge src={k.simge} boyut={40} />
          <div className="min-w-0 flex-1"><p className="truncate text-[16px] font-semibold text-white">{k.baslik}</p><p className="truncate text-[12.5px] text-white/50">{YETENEK_KATEGORI[k.kategori]} · Vayra'dan · {k.ad}</p></div>
          <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 [scrollbar-width:thin]">
          <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
            <p className="border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white">Ne zaman kullanılır</p>
            <p className="px-4 py-3 text-[13.5px] leading-relaxed text-white/70">{k.aciklama}</p>
          </section>
          <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
            <p className="border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white">Talimat</p>
            <div className="px-4 py-3"><Md metin={k.govde} onizle={() => {}} /></div>
          </section>
          <Degerlendirmeler hedef={`vayra:${k.id}`} />
          {k.dosyalar.length > 0 && (
            <section className="overflow-hidden rounded-[18px] ring-1 ring-inset ring-white/[0.08]">
              <p className="border-b border-white/[0.06] px-4 py-2.5 text-[13px] font-semibold text-white">Ek dosyalar</p>
              {k.dosyalar.map((d) => <p key={d.yol} className="flex items-center gap-2 px-4 py-2.5 text-[13px] text-white/70"><FileText className="h-3.5 w-3.5 text-white/45" />{d.yol}</p>)}
            </section>
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-white/[0.06] p-3 sm:p-4">
          <span className="flex-1 pl-1 text-[12.5px] text-white/45">Kopyan senin olur; istediğin gibi değiştir.</span>
          {ekli ? <Link href={`/panel/build/yetenekler/${ekli}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-white/[0.08] px-5 text-[14px] font-semibold text-white">Eklendi, aç</Link>
            : <button type="button" onClick={ekle} disabled={gidiyor} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-black disabled:opacity-60">{gidiyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Yeteneklerime ekle</button>}
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

function VayraYetenekleri({ benim, yenile }: { benim: YetenekOzet[]; yenile: () => void }) {
  const router = useRouter();
  const [kaynak, setKaynak] = useState<"vayra" | "anthropic">("vayra");
  const [arama, setArama] = useState("");
  const [kat, setKat] = useState<"hepsi" | YetenekKategori>("hepsi");
  const [acik, setAcik] = useState<KatalogYetenek | null>(null);
  const [gidiyor, setGidiyor] = useState<string | null>(null);
  const [sira, setSira] = useState<"onerilen" | "kurulum" | "puan">("onerilen");
  const [adet, setAdet] = useState(18);
  const ist = useDizinIstatistik();
  const s = arama.trim().toLocaleLowerCase("tr");
  const l = useMemo(() => {
    const f = YETENEK_KATALOGU.filter((k) => (kat === "hepsi" || k.kategori === kat) && (!s || `${k.baslik} ${k.ad} ${k.aciklama}`.toLocaleLowerCase("tr").includes(s)));
    const x = (k: KatalogYetenek) => ist[`vayra:${k.id}`];
    return sira === "kurulum" ? [...f].sort((a, b) => (x(b)?.kurulum ?? 0) - (x(a)?.kurulum ?? 0)) : sira === "puan" ? [...f].sort((a, b) => (x(b)?.puan ?? 0) - (x(a)?.puan ?? 0) || (x(b)?.oy ?? 0) - (x(a)?.oy ?? 0)) : f;
  }, [kat, s, sira, ist]);
  useEffect(() => setAdet(18), [kat, s, sira]);
  const ekli = (id: string) => benim.find((y) => y.katalogId === id)?.id;
  const ekle = async (k: KatalogYetenek, ac?: boolean) => {
    if (gidiyor) return;
    setGidiyor(k.id);
    try { const v = await api<{ id: string }>("/api/build/yetenekler", { govde: { katalog: k.id } }); yenile(); if (ac) router.push(`/panel/build/yetenekler/${v.id}`); }
    finally { setGidiyor(null); }
  };
  const kategoriler = (Object.keys(YETENEK_KATEGORI) as YetenekKategori[]).map((k) => ({ id: k, ad: YETENEK_KATEGORI[k], sayi: YETENEK_KATALOGU.filter((x) => x.kategori === k).length })).filter((k) => k.sayi);
  return (
    <Kart ikon={Sparkles} baslik="Yetenek dizini" alt={kaynak === "vayra" ? `${YETENEK_KATALOGU.length} Vayra yeteneği · Türkiye'ye özel ödeme, yasal metin, mağaza yayını` : `${ANTHROPIC_YETENEKLERI.length} Anthropic resmî yeteneği · lisansı izin verenler içe aktarılır`}
      sag={<span className="max-sm:hidden"><Secici id="dizin-kaynak" deger={kaynak} set={setKaynak} l={[{ id: "vayra", ad: "Vayra" }, { id: "anthropic", ad: "Anthropic" }]} /></span>} govde="p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="sm:hidden"><Secici id="dizin-kaynak-m" deger={kaynak} set={setKaynak} l={[{ id: "vayra", ad: "Vayra" }, { id: "anthropic", ad: "Anthropic" }]} /></span>
        <label className="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-full bg-white/[0.08] px-3 text-white/45 ring-1 ring-inset ring-transparent focus-within:ring-white/25 sm:max-w-[300px]"><Search className="h-3.5 w-3.5 shrink-0" /><input value={arama} onChange={(e) => setArama(e.target.value)} placeholder="Yetenek ara" className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/35" /></label>
      </div>
      {kaynak === "anthropic" ? <AnthropicDizini benim={benim} yenile={yenile} arama={arama} /> : <>
      <div className="mb-3"><Suzgec id="yetenek-kat" deger={kat} set={setKat} l={[{ id: "hepsi" as const, ad: "Hepsi", sayi: YETENEK_KATALOGU.length }, ...kategoriler]} /></div>
      <div className="mb-4"><Secici id="yetenek-sira" kucuk deger={sira} set={setSira} l={[{ id: "onerilen", ad: "Önerilen" }, { id: "kurulum", ad: "En çok kurulan" }, { id: "puan", ad: "En yüksek puan" }]} /></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {l.slice(0, adet).map((k) => { const e = ekli(k.id); return (
          <div key={k.id} className="group relative flex flex-col rounded-[20px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07] transition-colors hover:bg-white/[0.05]">
            <button type="button" onClick={() => setAcik(k)} className="absolute inset-0 rounded-[20px]" aria-label={`${k.baslik} ayrıntıları`} />
            <div className="flex items-start gap-3">
              <YetenekSimge src={k.simge} boyut={44} />
              <div className="min-w-0 flex-1"><p className="text-[14.5px] font-semibold text-white">{k.baslik}</p><p className="text-[12px] text-white/45">{YETENEK_KATEGORI[k.kategori]}</p></div>
            </div>
            <p className="mt-3 line-clamp-3 flex-1 text-[13px] leading-[1.45] text-white/55">{k.aciklama}</p>
            <div className="relative z-[1] mt-3 flex items-center justify-between gap-2">
              <DizinIsareti x={ist[`vayra:${k.id}`]} />
              {e ? <Link href={`/panel/build/yetenekler/${e}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-[13px] font-medium text-white">Eklendi</Link>
                : <button type="button" onClick={() => ekle(k)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black">{gidiyor === k.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Ekle</button>}
            </div>
          </div>
        ); })}
      </div>
      {l.length > adet && <div className="mt-4 flex items-center justify-center gap-3"><span className="text-[12.5px] text-white/45">{l.length} yeteneğin {adet} tanesi gösteriliyor</span><button type="button" onClick={() => setAdet((x) => x + 36)} className="h-9 rounded-full bg-white/[0.08] px-4 text-[13px] font-medium text-white hover:bg-white/[0.13]">Daha fazla göster</button></div>}
      {!l.length && <p className="py-6 text-center text-[13px] text-white/50">Aramana uyan yetenek yok.</p>}
      </>}
      <AnimatePresence>{acik && <KatalogPaneli k={acik} kapat={() => setAcik(null)} ekle={() => ekle(acik, true)} gidiyor={gidiyor === acik.id} ekli={ekli(acik.id)} />}</AnimatePresence>
    </Kart>
  );
}

/** Yetenekler sayfası: oluştur ya da içe aktar, yeteneklerin, Vayra yetenekleri. */
export function YetenekListesi() {
  const [l, setL] = useState<YetenekOzet[] | null>(null);
  const yenile = () => { api<{ yetenekler: YetenekOzet[] }>("/api/build/yetenekler").then((v) => setL(v.yetenekler)).catch(() => setL([])); };
  useEffect(yenile, []);
  return (
    <div className="mx-auto max-w-[1320px] space-y-5 px-4 pb-24 pt-16 sm:px-6 md:pt-8">
      <OlusturKarti yenile={yenile} />
      {l === null ? <div className="h-[180px] animate-pulse rounded-[26px] bg-white/[0.03]" /> : l.length > 0 && (
        <Kart ikon={FileText} baslik="Yeteneklerin" alt={`${l.length} yetenek · ${l.filter((y) => y.herSohbette).length} tanesi her sohbette açık · açıklamaları her turda yaklaşık ${l.filter((y) => y.herSohbette && y.cagri !== "elle").reduce((t, y) => t + belirtecTahmini(y.aciklama), 0).toLocaleString("tr-TR")} belirteç`}>
          <div className="divide-y divide-white/[0.05]">{l.map((y) => <YetenekSatiri key={y.id} y={y} yenile={yenile} />)}</div>
        </Kart>
      )}
      <VayraYetenekleri benim={l ?? []} yenile={yenile} />
    </div>
  );
}
