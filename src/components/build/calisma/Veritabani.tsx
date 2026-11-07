"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlignLeft, ArrowDown, ArrowUp, AtSign, Braces, Calendar, Code2, Database, Download, ExternalLink, Filter, Hash, ImageIcon, Link2, List, Loader2, Maximize2,
  Network, Plus, RotateCw, Search, Shield, ToggleLeft, Trash2, Type, Upload, X, Columns3, ChevronLeft, ChevronRight, Sparkles, Archive, History, FlaskConical, ArrowUpFromLine,
} from "lucide-react";
import { AcilirSecim, Anahtar, KodKutusu, Secici, alanSinif } from "@/components/build/ajanlar/AjanDuzenleyici";
import { api } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { SemaDiyagrami } from "@/components/build/bulut/SemaDiyagrami";

type GecmisSatir = { z: number; kayitId: string; islem: "ekle" | "guncelle" | "sil" | "geriYukle"; kim: string; onceki?: Record<string, unknown>; sonraki?: Record<string, unknown> };
const KIM_AD = (k: string) => (k === "sahip" ? "Sen" : k === "ekip" ? "Ekip üyesi" : k === "onizleme" ? "Önizleme" : k === "fonksiyon" ? "Sunucu fonksiyonu" : k === "ajan" ? "Build ajanı" : k.startsWith("uye:") ? "Site üyesi" : "Ziyaretçi");
const ISLEM_AD: Record<string, string> = { ekle: "Eklendi", guncelle: "Güncellendi", sil: "Silindi", geriYukle: "Geri yüklendi", toplu: "Tablo toplu değişti", tabloSil: "Tablo silindi" };
const SISTEM_ALAN = new Set(["id", "olusturma", "guncelleme", "uyeId"]);
/** İki hâl arasındaki değişen alanlar. */
function farklar(a?: Record<string, unknown>, b?: Record<string, unknown>) {
  const adlar = [...new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])].filter((x) => !SISTEM_ALAN.has(x));
  return adlar.filter((x) => JSON.stringify(a?.[x] ?? null) !== JSON.stringify(b?.[x] ?? null)).map((x) => ({ alan: x, eski: a?.[x], yeni: b?.[x] }));
}
const kisa = (v: unknown) => { const t = v === null || v === undefined ? "boş" : typeof v === "object" ? JSON.stringify(v) : String(v); return t.length > 60 ? t.slice(0, 60) + "…" : t; };

type Kural = "herkes" | "uyeler" | "sahibi" | "kapali";
type Kurallar = { okuma: Kural; ekleme: Kural; duzenleme: Kural };
type SutunTur = "metin" | "uzunMetin" | "sayi" | "mantiksal" | "tarih" | "eposta" | "url" | "gorsel" | "secim" | "iliski" | "json";
type Sutun = { ad: string; tur: SutunTur; zorunlu?: boolean; benzersiz?: boolean; varsayilan?: unknown; secenekler?: string[]; iliski?: string; silinince?: "kisitla" | "zincir" | "bosalt"; aciklama?: string; /** şemada yok, verilerden çıkarıldı */ cikarim?: boolean };
type KolOzet = { ad: string; adet: number; kurallar: Kurallar; son: number | null; sema: Sutun[]; aciklama: string };
type Kayit = { id: string; olusturma: number; guncelleme: number; uyeId?: string } & Record<string, unknown>;
type Op = "esit" | "esitDegil" | "buyuk" | "buyukEsit" | "kucuk" | "kucukEsit" | "icerir" | "baslar" | "bos" | "dolu";
type Suzgec = { alan: string; op: Op; deger: string };
type Sekme = "kayitlar" | "yapi" | "kurallar" | "kullanim";
type Panel = null | { tur: "yeniTablo"; sablon?: { ad: string; aciklama: string; sema: Sutun[]; kurallar: Kurallar } } | { tur: "kayit"; kayit?: Kayit; odak?: string } | { tur: "iceAktar" } | { tur: "uret" } | { tur: "yedek" } | { tur: "aktar" };
type Ortam = "canli" | "test";
type OrtamAyari = { test: boolean; kurulum?: number; sonAktarim?: number };

const SAYFA = 100;
const SISTEM = ["id", "olusturma", "guncelleme", "uyeId"];
const yay = { type: "spring" as const, stiffness: 420, damping: 40 };

export const TUR_BILGI: Record<SutunTur, { ad: string; ikon: typeof Type; alt: string }> = {
  metin: { ad: "Metin", ikon: Type, alt: "Kısa yazı: ad, başlık, şehir" },
  uzunMetin: { ad: "Uzun metin", ikon: AlignLeft, alt: "Açıklama, yorum, yazı gövdesi" },
  sayi: { ad: "Sayı", ikon: Hash, alt: "Fiyat, adet, puan" },
  mantiksal: { ad: "Evet / hayır", ikon: ToggleLeft, alt: "Stokta mı, yayında mı" },
  tarih: { ad: "Tarih", ikon: Calendar, alt: "Tarih ve saat" },
  eposta: { ad: "E-posta", ikon: AtSign, alt: "Biçimi doğrulanır" },
  url: { ad: "Adres", ikon: Link2, alt: "https ile başlayan bağlantı" },
  gorsel: { ad: "Görsel", ikon: ImageIcon, alt: "Görsel adresi, küçük resimle gösterilir" },
  secim: { ad: "Seçim", ikon: List, alt: "Belirli değerlerden biri" },
  iliski: { ad: "İlişki", ikon: Network, alt: "Başka tablodaki bir kaydın kimliği" },
  json: { ad: "JSON", ikon: Braces, alt: "Liste ya da nesne" },
};
const TURLER = Object.keys(TUR_BILGI) as SutunTur[];

const KURAL_ACIKLAMA: Record<keyof Kurallar, { ad: string; secenekler: { id: Kural; ad: string; alt: string }[] }> = {
  okuma: { ad: "Kim görebilir", secenekler: [
    { id: "herkes", ad: "Herkes", alt: "Siteye giren herkes kayıtları görür" },
    { id: "uyeler", ad: "Üyeler", alt: "Yalnız giriş yapmış üyeler görür" },
    { id: "sahibi", ad: "Kendi kaydı", alt: "Her üye yalnız kendi eklediği kayıtları görür" },
    { id: "kapali", ad: "Yalnız sen", alt: "Ziyaretçiler göremez; panelden ve sunucu fonksiyonlarından erişilir" },
  ] },
  ekleme: { ad: "Kim ekleyebilir", secenekler: [
    { id: "herkes", ad: "Herkes", alt: "Form, yorum, oy gibi herkesin ekleyebildiği kayıtlar" },
    { id: "uyeler", ad: "Üyeler", alt: "Yalnız giriş yapmış üyeler ekler" },
    { id: "kapali", ad: "Yalnız sen", alt: "Kayıtları yalnız sen ve ajan eklersin" },
  ] },
  duzenleme: { ad: "Kim değiştirip silebilir", secenekler: [
    { id: "herkes", ad: "Herkes", alt: "Herkes her kaydı değiştirebilir; yalnız ortak listeler için" },
    { id: "uyeler", ad: "Üyeler", alt: "Giriş yapmış her üye her kaydı değiştirebilir" },
    { id: "sahibi", ad: "Kendi kaydı", alt: "Üyeler yalnız kendi eklediği kaydı değiştirip siler" },
    { id: "kapali", ad: "Yalnız sen", alt: "Ziyaretçiler hiçbir kaydı değiştiremez" },
  ] },
};
const KURAL_HAZIR: { id: string; ad: string; alt: string; k?: Kurallar }[] = [
  { id: "acik", ad: "Herkese açık liste", alt: "Yorum, ziyaretçi defteri, skor tablosu", k: { okuma: "herkes", ekleme: "herkes", duzenleme: "kapali" } },
  { id: "vitrin", ad: "Vitrin", alt: "Ürün, menü, blog: herkes okur, sen yazarsın", k: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" } },
  { id: "uye", ad: "Üyelere özel", alt: "Üyeler okur ve ekler, kendi kaydını değiştirir", k: { okuma: "uyeler", ekleme: "uyeler", duzenleme: "sahibi" } },
  { id: "kisisel", ad: "Kişisel veri", alt: "Notlar, görevler: herkes yalnız kendininkini görür", k: { okuma: "sahibi", ekleme: "uyeler", duzenleme: "sahibi" } },
  { id: "gelen", ad: "Gelen kutusu", alt: "Başvuru, sipariş: herkes ekler, yalnız sen görürsün", k: { okuma: "kapali", ekleme: "herkes", duzenleme: "kapali" } },
  { id: "ozel", ad: "Özel", alt: "Üç kuralı kendin seç" },
];
const hazirBul = (k: Kurallar) => KURAL_HAZIR.find((h) => h.k && h.k.okuma === k.okuma && h.k.ekleme === k.ekleme && h.k.duzenleme === k.duzenleme)?.id ?? "ozel";

const TABLO_SABLON: { ad: string; baslik: string; aciklama: string; sema: Sutun[]; kurallar: Kurallar }[] = [
  { ad: "urunler", baslik: "Ürünler", aciklama: "Satılan ürünler ve stok", kurallar: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" }, sema: [
    { ad: "ad", tur: "metin", zorunlu: true }, { ad: "fiyat", tur: "sayi", zorunlu: true }, { ad: "aciklama", tur: "uzunMetin" }, { ad: "gorsel", tur: "gorsel" }, { ad: "kategori", tur: "secim", secenekler: ["Kahve", "Tatlı", "Çekirdek"] }, { ad: "stokta", tur: "mantiksal", varsayilan: true }] },
  { ad: "rezervasyonlar", baslik: "Rezervasyonlar", aciklama: "Sitedeki rezervasyon formundan gelenler", kurallar: { okuma: "kapali", ekleme: "herkes", duzenleme: "kapali" }, sema: [
    { ad: "ad", tur: "metin", zorunlu: true }, { ad: "telefon", tur: "metin", zorunlu: true }, { ad: "eposta", tur: "eposta" }, { ad: "tarih", tur: "tarih", zorunlu: true }, { ad: "kisi", tur: "sayi", varsayilan: 2 }, { ad: "durum", tur: "secim", secenekler: ["Bekliyor", "Onaylandı", "İptal"], varsayilan: "Bekliyor" }] },
  { ad: "yazilar", baslik: "Blog yazıları", aciklama: "Yayınlanan yazılar", kurallar: { okuma: "herkes", ekleme: "kapali", duzenleme: "kapali" }, sema: [
    { ad: "baslik", tur: "metin", zorunlu: true }, { ad: "kisaAd", tur: "metin", zorunlu: true, benzersiz: true }, { ad: "ozet", tur: "uzunMetin" }, { ad: "govde", tur: "uzunMetin" }, { ad: "kapak", tur: "gorsel" }, { ad: "yayinda", tur: "mantiksal", varsayilan: false }, { ad: "tarih", tur: "tarih", varsayilan: "simdi" }] },
  { ad: "yorumlar", baslik: "Yorumlar", aciklama: "Ziyaretçi yorumları ve puanları", kurallar: { okuma: "herkes", ekleme: "herkes", duzenleme: "kapali" }, sema: [
    { ad: "ad", tur: "metin", zorunlu: true }, { ad: "yorum", tur: "uzunMetin", zorunlu: true }, { ad: "puan", tur: "sayi" }, { ad: "onayli", tur: "mantiksal", varsayilan: false }] },
];

const OPLAR: { id: Op; ad: string; degersiz?: boolean }[] = [
  { id: "esit", ad: "eşittir" }, { id: "esitDegil", ad: "eşit değil" }, { id: "icerir", ad: "içerir" }, { id: "baslar", ad: "ile başlar" },
  { id: "buyuk", ad: "büyüktür" }, { id: "buyukEsit", ad: "en az" }, { id: "kucuk", ad: "küçüktür" }, { id: "kucukEsit", ad: "en çok" },
  { id: "bos", ad: "boş", degersiz: true }, { id: "dolu", ad: "dolu", degersiz: true },
];

/* ── yardımcılar ── */
const goster = (v: unknown) => (v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v));
const tarihYaz = (v: unknown) => { const z = typeof v === "number" ? v : Date.parse(String(v)); return Number.isFinite(z) ? new Date(z).toLocaleString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : String(v); };
const serbestCoz = (s: string): unknown => { if (s === "") return null; if (/^-?\d+([.,]\d+)?$/.test(s)) return Number(s.replace(",", ".")); if (s === "true" || s === "false") return s === "true"; if (/^[[{]/.test(s)) { try { return JSON.parse(s); } catch { /* metin */ } } return s; };
function turTahmin(l: unknown[]): SutunTur {
  const d = l.filter((v) => v !== null && v !== undefined && v !== "");
  if (!d.length) return "metin";
  if (d.every((v) => typeof v === "boolean")) return "mantiksal";
  if (d.every((v) => typeof v === "number")) return "sayi";
  if (d.every((v) => typeof v === "object")) return "json";
  const s = d.map(String);
  if (s.every((x) => /^\d{4}-\d{2}-\d{2}([T ][\d:.]+Z?)?/.test(x))) return "tarih";
  if (s.every((x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x))) return "eposta";
  if (s.every((x) => /^https?:\/\/\S+\.(png|jpe?g|webp|gif|avif|svg)(\?\S*)?$/i.test(x) || x.startsWith("/gercek/") || x.startsWith("data:image/"))) return "gorsel";
  if (s.every((x) => /^https?:\/\//.test(x))) return "url";
  if (s.some((x) => x.length > 80)) return "uzunMetin";
  return "metin";
}
/** Görünen sütunlar: şemadakiler + verilerde olup şemada olmayanlar (çıkarım). */
function sutunlariKur(sema: Sutun[], kayitlar: Kayit[]): Sutun[] {
  const l = sema.map((s) => ({ ...s }));
  const var_ = new Set(l.map((s) => s.ad));
  const ek: Record<string, unknown[]> = {};
  for (const r of kayitlar) for (const [a, v] of Object.entries(r)) if (!SISTEM.includes(a) && !var_.has(a)) (ek[a] ??= []).push(v);
  for (const [a, v] of Object.entries(ek).slice(0, 40)) l.push({ ad: a, tur: turTahmin(v), cikarim: true });
  return l;
}
function csvCoz(metin: string): string[][] {
  const t = metin.replace(/^﻿/, "");
  const ilk = t.split(/\r?\n/, 1)[0] ?? "";
  const ayrac = (ilk.match(/;/g)?.length ?? 0) > (ilk.match(/,/g)?.length ?? 0) ? ";" : ilk.includes("\t") && !ilk.includes(",") ? "\t" : ",";
  const satirlar: string[][] = []; let satir: string[] = [], alan = "", tirnak = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (tirnak) { if (c === '"') { if (t[i + 1] === '"') { alan += '"'; i++; } else tirnak = false; } else alan += c; continue; }
    if (c === '"') tirnak = true;
    else if (c === ayrac) { satir.push(alan); alan = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; satir.push(alan); alan = ""; if (satir.some((x) => x !== "")) satirlar.push(satir); satir = []; }
    else alan += c;
  }
  satir.push(alan); if (satir.some((x) => x !== "")) satirlar.push(satir);
  return satirlar;
}
const indir = (ad: string, icerik: string, tur: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([icerik], { type: tur })); a.download = ad; a.click(); };

/* ── küçük parçalar ── */
function SecimKutusu({ durum, degis, etiket }: { durum: "yok" | "yarim" | "tam"; degis: () => void; etiket: string }) {
  return (
    <button type="button" role="checkbox" aria-checked={durum === "tam" ? true : durum === "yarim" ? "mixed" : false} aria-label={etiket} onClick={(e) => { e.stopPropagation(); degis(); }}
      className={cn("flex h-[18px] w-[18px] items-center justify-center rounded-[6px] ring-inset transition-colors", durum === "yok" ? "ring-1 ring-white/25 hover:ring-white/50" : "bg-white/[0.12] ring-2 ring-white")}>
      {durum === "tam" && <span className="h-2 w-2 rounded-[3px] bg-white" />}
      {durum === "yarim" && <span className="h-[2px] w-2 rounded-full bg-white" />}
    </button>
  );
}
function TurSimge({ tur, className }: { tur: SutunTur; className?: string }) { const I = TUR_BILGI[tur].ikon; return <I className={cn("h-3.5 w-3.5 shrink-0", className)} />; }

function Hucre({ s, v }: { s: Sutun; v: unknown }) {
  if (v === null || v === undefined || v === "") return <span className="text-white/20">boş</span>;
  switch (s.tur) {
    case "mantiksal": return <span className={cn("inline-flex h-6 items-center rounded-full px-2 text-[11.5px] font-medium", v === true || v === "true" ? "bg-[#55d6fd]/[0.14] text-[#8be6ff]" : "bg-white/[0.07] text-white/55")}>{v === true || v === "true" ? "Evet" : "Hayır"}</span>;
    case "sayi": return <span className="tabular-nums">{typeof v === "number" ? v.toLocaleString("tr-TR") : String(v)}</span>;
    case "tarih": return <span className="whitespace-nowrap">{tarihYaz(v)}</span>;
    case "gorsel": return <span className="flex items-center gap-2">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={String(v)} alt="" className="h-7 w-7 shrink-0 rounded-[7px] bg-white/[0.05] object-cover" /><span className="truncate text-white/50">{String(v).split("/").pop()}</span></span>;
    case "url": return <a href={String(v)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex max-w-full items-center gap-1 text-[#8be6ff] hover:underline"><span className="truncate">{String(v).replace(/^https?:\/\//, "")}</span><ExternalLink className="h-3 w-3 shrink-0" /></a>;
    case "secim": return <span className="inline-flex h-6 items-center rounded-full bg-white/[0.08] px-2.5 text-[12px] text-white/85">{String(v)}</span>;
    case "iliski": return <span className="inline-flex h-6 items-center gap-1 rounded-full bg-white/[0.06] px-2 font-mono text-[11.5px] text-white/70"><Network className="h-3 w-3 text-white/40" />{String(v)}</span>;
    case "json": return <span className="truncate font-mono text-[11.5px] text-white/60">{goster(v)}</span>;
    default: return <span className="line-clamp-1 break-all">{goster(v)}</span>;
  }
}

function DisaAktarMenu({ kapali, sec }: { kapali: boolean; sec: (b: "csv" | "json") => void }) {
  const [acik, setAcik] = useState(false);
  const kok = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!acik) return; const f = (e: MouseEvent) => { if (!kok.current?.contains(e.target as Node)) setAcik(false); }; addEventListener("mousedown", f); return () => removeEventListener("mousedown", f); }, [acik]);
  return (
    <div ref={kok} className="relative">
      <button type="button" disabled={kapali} onClick={() => setAcik((x) => !x)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/80 hover:bg-white/[0.1] hover:text-white disabled:opacity-30"><Download className="h-3.5 w-3.5" /><span className="max-2xl:hidden">Dışa aktar</span></button>
      <AnimatePresence>
        {acik && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }} className="bd-panel absolute right-0 top-[calc(100%+6px)] z-30 w-[220px] rounded-[14px] p-1.5">
            {([["csv", "CSV", "Excel ve Google E-Tablolar"], ["json", "JSON", "Geliştiriciler için"]] as const).map(([b, a, alt]) => (
              <button key={b} type="button" onClick={() => { sec(b); setAcik(false); }} className="flex w-full flex-col rounded-[10px] px-2.5 py-2 text-left hover:bg-white/[0.06]"><span className="text-[13px] text-white">{a}</span><span className="text-[11.5px] text-white/45">{alt}</span></button>
            ))}
            <p className="px-2.5 pb-1 pt-1.5 text-[11.5px] leading-snug text-white/35">Süzgeç ve arama uygulanmış kayıtlar, en fazla 1000</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Seçilince beyaz çerçeveli küçük aç/kapa hapı. */
function Hap({ acik, set, ad }: { acik: boolean; set: (v: boolean) => void; ad: string }) {
  return <button type="button" role="switch" aria-checked={acik} onClick={() => set(!acik)} className={cn("h-8 rounded-full px-3 text-[12px] font-medium transition-colors", acik ? "bg-white/[0.1] text-white ring-1 ring-inset ring-white/70" : "bg-white/[0.04] text-white/50 ring-1 ring-inset ring-white/[0.07] hover:text-white")}>{ad}</button>;
}

/** Sağdan açılan panel (bileşen içi). */
function YanPanel({ acik, kapat, baslik, alt, children, alt2 }: { acik: boolean; kapat: () => void; baslik: string; alt?: string; children: React.ReactNode; alt2?: React.ReactNode }) {
  useEffect(() => { if (!acik) return; const t = (e: KeyboardEvent) => e.key === "Escape" && kapat(); addEventListener("keydown", t); return () => removeEventListener("keydown", t); }, [acik, kapat]);
  return (
    <AnimatePresence>
      {acik && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={kapat} className="absolute inset-0 z-30 bg-black/40" />
          <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={yay} className="bd-panel absolute inset-y-0 right-0 z-40 flex w-[460px] max-w-full flex-col rounded-l-[20px]">
            <header className="flex items-start gap-3 border-b border-white/[0.07] px-5 py-4">
              <div className="min-w-0 flex-1"><p className="text-[15px] font-semibold text-white">{baslik}</p>{alt && <p className="mt-0.5 text-[12.5px] text-white/50">{alt}</p>}</div>
              <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-width:thin]">{children}</div>
            {alt2 && <footer className="flex items-center gap-2 border-t border-white/[0.07] px-5 py-3">{alt2}</footer>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/** Sütun tanım satırları (yeni tablo ve Yapı sekmesi ortak). */
function SutunDuzenleyici({ l, set, tablolar }: { l: Sutun[]; set: (l: Sutun[]) => void; tablolar: string[] }) {
  const d = (i: number, p: Partial<Sutun>) => set(l.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-[14px] bg-white/[0.025] px-3 py-2 text-[12px] text-white/45 ring-1 ring-inset ring-white/[0.05]">
        <span className="text-white/70">id, olusturma ve guncelleme</span><span>her kayda kendiliğinden eklenir</span>
      </div>
      {l.map((s, i) => (
        <div key={i} className="rounded-[16px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.07]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-10 w-8 shrink-0 items-center justify-center text-white/40"><TurSimge tur={s.tur} className="h-4 w-4" /></span>
            <input value={s.ad} onChange={(e) => d(i, { ad: e.target.value.replace(/[^\p{L}\p{N}_ -]/gu, "").slice(0, 60) })} placeholder="sutun_adi" className={cn(alanSinif, "h-10 min-w-[120px] flex-1 text-[13.5px]")} />
            <div className="w-[150px] shrink-0"><AcilirSecim deger={s.tur} set={(v) => d(i, { tur: v as SutunTur })} l={TURLER.map((t) => ({ id: t, ad: TUR_BILGI[t].ad, alt: TUR_BILGI[t].alt }))} /></div>
            <Hap acik={!!s.zorunlu} set={(v) => d(i, { zorunlu: v })} ad="Zorunlu" />
            <Hap acik={!!s.benzersiz} set={(v) => d(i, { benzersiz: v })} ad="Benzersiz" />
            <button type="button" onClick={() => set(l.filter((_, j) => j !== i))} aria-label="Sütunu kaldır" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-rose-200"><X className="h-4 w-4" /></button>
          </div>
          {s.tur === "secim" && <input value={(s.secenekler ?? []).join(", ")} onChange={(e) => d(i, { secenekler: e.target.value.split(",").map((x) => x.trimStart()) })} onBlur={() => d(i, { secenekler: (s.secenekler ?? []).map((x) => x.trim()).filter(Boolean) })} placeholder="Seçenekler, virgülle: Bekliyor, Onaylandı, İptal" className={cn(alanSinif, "ml-10 mt-2 h-10 w-[calc(100%-2.5rem)] text-[13px]")} />}
          {s.tur === "iliski" && <div className="ml-10 mt-2 space-y-2"><AcilirSecim deger={s.iliski ?? ""} set={(v) => d(i, { iliski: v })} l={tablolar.map((t) => ({ id: t, ad: t }))} bos="Bağlanacak tabloyu seç" />
            <AcilirSecim deger={s.silinince ?? ""} set={(v) => d(i, { silinince: (v || undefined) as Sutun["silinince"] })} bos="Bağlı kayıt silinince: bir şey yapma" l={[{ id: "kisitla", ad: "Silinmesine izin verme", alt: "Bu tablodan bağlı kayıt varken silme reddedilir" }, { id: "zincir", ad: "Bu kayıtları da sil", alt: "Zincirleme silme, en çok 3 düzey" }, { id: "bosalt", ad: "Bu alanı boşalt", alt: "Bağlantı kaldırılır, kayıt kalır" }]} /></div>}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 pl-10">
            {s.tur === "mantiksal" ? (
              <span className="flex items-center gap-2 text-[12.5px] text-white/65">Varsayılan<Secici id={`vars-${i}`} kucuk deger={s.varsayilan === true ? "e" : s.varsayilan === false ? "h" : "y"} set={(v) => d(i, { varsayilan: v === "e" ? true : v === "h" ? false : undefined })} l={[{ id: "y", ad: "Yok" }, { id: "e", ad: "Evet" }, { id: "h", ad: "Hayır" }]} /></span>
            ) : s.tur === "tarih" ? (
              <span className="flex items-center gap-2 text-[12.5px] text-white/65">Varsayılan<Secici id={`vars-${i}`} kucuk deger={s.varsayilan === "simdi" ? "s" : "y"} set={(v) => d(i, { varsayilan: v === "s" ? "simdi" : undefined })} l={[{ id: "y", ad: "Yok" }, { id: "s", ad: "Eklendiği an" }]} /></span>
            ) : s.tur !== "json" && s.tur !== "iliski" ? (
              <input value={goster(s.varsayilan)} onChange={(e) => d(i, { varsayilan: e.target.value === "" ? undefined : s.tur === "sayi" ? Number(e.target.value) || 0 : e.target.value })} placeholder="Varsayılan değer, isteğe bağlı" className={cn(alanSinif, "h-8 max-w-[260px] flex-1 rounded-[10px] text-[12.5px]")} />
            ) : null}
          </div>
        </div>
      ))}
      <button type="button" onClick={() => set([...l, { ad: "", tur: "metin" }])} className="flex h-11 w-full items-center justify-center gap-1.5 rounded-[14px] text-[13px] text-white/70 border border-dashed border-white/[0.14] hover:bg-white/[0.04] hover:text-white"><Plus className="h-4 w-4" />Sütun ekle</button>
    </div>
  );
}

function KuralSecimi({ k, set }: { k: Kurallar; set: (k: Kurallar) => void }) {
  const hazir = hazirBul(k);
  const [ozel, setOzel] = useState(hazir === "ozel");
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {KURAL_HAZIR.map((h) => {
          const secili = h.id === "ozel" ? ozel || hazir === "ozel" : !ozel && hazir === h.id;
          return (
            <button key={h.id} type="button" onClick={() => { if (h.k) { set(h.k); setOzel(false); } else setOzel(true); }}
              className={cn("rounded-[14px] px-3 py-2.5 text-left transition-colors", secili ? "bg-white/[0.08] ring-2 ring-inset ring-white" : "bg-white/[0.03] ring-1 ring-inset ring-white/[0.07] hover:bg-white/[0.06]")}>
              <span className="block text-[13px] font-semibold text-white">{h.ad}</span><span className="block text-[12px] leading-snug text-white/50">{h.alt}</span>
            </button>
          );
        })}
      </div>
      {(ozel || hazir === "ozel") && (
        <div className="space-y-2.5 rounded-[16px] bg-white/[0.03] p-3 ring-1 ring-inset ring-white/[0.07]">
          {(Object.keys(KURAL_ACIKLAMA) as (keyof Kurallar)[]).map((a) => (
            <div key={a}><p className="mb-1.5 text-[12.5px] text-white/55">{KURAL_ACIKLAMA[a].ad}</p><AcilirSecim deger={k[a]} set={(v) => set({ ...k, [a]: v as Kural })} l={KURAL_ACIKLAMA[a].secenekler} /></div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── ana bileşen ── */
/**
 * Veritabanı (Vayra Veri) tablo düzenleyicisi: tablolar, türlü sütunlar (şema), kayıt ızgarası (arama, süzgeç, sıralama,
 * sayfalama, toplu seçim, satır içi düzenleme), kayıt paneli, CSV/JSON içe ve dışa aktarma, erişim kuralları, kullanım örnekleri.
 */
export function Veritabani({ p }: { p: Proje }) {
  const kok = `/api/build/veri/${p.id}`;
  // Test ve Canlı: Test görünümünde bütün istekler ?ortam=test ile gider (önizleme ve ajan Test ortamı açıksa onu kullanır).
  const [ortam, setOrtam] = useState<Ortam>("canli");
  const [ortamAyari, setOrtamAyari] = useState<OrtamAyari>({ test: false });
  const yol = useCallback((y: string) => (ortam === "test" ? `${y}${y.includes("?") ? "&" : "?"}ortam=test` : y), [ortam]);
  const [tablolar, setTablolar] = useState<KolOzet[] | null>(null);
  const [secili, setSecili] = useState<string | null>(null);
  const [tabloAra, setTabloAra] = useState("");
  const [sekme, setSekme] = useState<Sekme>("kayitlar");
  const [kayitlar, setKayitlar] = useState<Kayit[] | null>(null);
  const [toplam, setToplam] = useState(0);
  const [sayfa, setSayfa] = useState(0);
  const [ara, setAra] = useState("");
  const [araGecikmeli, setAraGecikmeli] = useState("");
  const [suzgecler, setSuzgecler] = useState<Suzgec[]>([]);
  const [taslakSuzgec, setTaslakSuzgec] = useState<Suzgec | null>(null);
  const [sirala, setSirala] = useState<{ alan: string; yon: "artan" | "azalan" } | null>(null);
  const [secimler, setSecimler] = useState<Set<string>>(new Set());
  const [duzen, setDuzen] = useState<{ id: string; alan: string; deger: string } | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [sistem, setSistem] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [silOnay, setSilOnay] = useState<"tablo" | "secim" | "bosalt" | null>(null);
  const [semaAcik, setSemaAcik] = useState(false);
  const [gecmisAcik, setGecmisAcik] = useState(false);

  const getir = useCallback(async () => {
    const v = await api<{ koleksiyonlar: KolOzet[]; ortamAyari?: OrtamAyari }>(yol(kok)).catch(() => ({ koleksiyonlar: [] as KolOzet[], ortamAyari: undefined }));
    setTablolar(v.koleksiyonlar);
    if (v.ortamAyari) setOrtamAyari(v.ortamAyari);
    setSecili((s) => (s && v.koleksiyonlar.some((x) => x.ad === s) ? s : v.koleksiyonlar[0]?.ad ?? null));
  }, [kok, yol]);
  useEffect(() => { getir(); }, [getir]);
  useEffect(() => { const t = setTimeout(() => setAraGecikmeli(ara), 300); return () => clearTimeout(t); }, [ara]);

  const sorgu = useCallback((sinir: number, atla: number) => {
    const q = new URLSearchParams({ sinir: String(sinir), atla: String(atla) });
    if (araGecikmeli.trim()) q.set("ara", araGecikmeli.trim());
    if (suzgecler.length) q.set("suzgec", JSON.stringify(suzgecler));
    if (sirala) { q.set("sirala", sirala.alan); q.set("yon", sirala.yon); }
    return q.toString();
  }, [araGecikmeli, suzgecler, sirala]);

  const kayitGetir = useCallback(async () => {
    if (!secili) return;
    setYukleniyor(true);
    try {
      const v = await api<{ kayitlar: Kayit[]; toplam: number }>(yol(`${kok}/${encodeURIComponent(secili)}?${sorgu(SAYFA, sayfa * SAYFA)}`));
      setKayitlar(v.kayitlar); setToplam(v.toplam ?? v.kayitlar.length);
    } catch (e) { setHata((e as Error).message); setKayitlar([]); }
    finally { setYukleniyor(false); }
  }, [kok, secili, sorgu, sayfa, yol]);
  useEffect(() => { setSayfa(0); setSecimler(new Set()); }, [secili, araGecikmeli, suzgecler, sirala]);
  useEffect(() => { kayitGetir(); }, [kayitGetir]);
  useEffect(() => { setKayitlar(null); setSuzgecler([]); setSirala(null); setAra(""); setSilOnay(null); setDuzen(null); }, [secili]);
  useEffect(() => { if (!hata) return; const t = setTimeout(() => setHata(null), 5000); return () => clearTimeout(t); }, [hata]);

  const tablo = tablolar?.find((x) => x.ad === secili);
  const sutunlar = useMemo(() => sutunlariKur(tablo?.sema ?? [], kayitlar ?? []), [tablo?.sema, kayitlar]);
  const gorunen = useMemo(() => [...sutunlar, ...(sistem ? [{ ad: "id", tur: "metin" as SutunTur }, { ad: "uyeId", tur: "metin" as SutunTur }, { ad: "guncelleme", tur: "tarih" as SutunTur }] : [])], [sutunlar, sistem]);
  const tabloAdlari = (tablolar ?? []).map((t) => t.ad);

  const yenile = () => { getir(); kayitGetir(); };
  const islem = async (f: () => Promise<unknown>) => { try { await f(); } catch (e) { setHata((e as Error).message); } yenile(); };
  const hucreKaydet = async (id: string, alan: string, deger: unknown) => {
    setDuzen(null);
    setKayitlar((l) => l?.map((r) => (r.id === id ? { ...r, [alan]: deger } : r)) ?? l);
    await islem(() => api(yol(`${kok}/${encodeURIComponent(secili!)}/${id}`), { method: "PATCH", govde: { alanlar: { [alan]: deger } } }));
  };
  const siralaDegis = (alan: string) => setSirala((s) => (!s || s.alan !== alan ? { alan, yon: "artan" } : s.yon === "artan" ? { alan, yon: "azalan" } : null));
  const tumu = kayitlar?.length ? (kayitlar.every((r) => secimler.has(r.id)) ? "tam" : kayitlar.some((r) => secimler.has(r.id)) ? "yarim" : "yok") : "yok";

  const disaAktar = async (bicim: "csv" | "json", yalnizSecili = false) => {
    if (!secili) return;
    let l: Kayit[] = [];
    if (yalnizSecili) l = (kayitlar ?? []).filter((r) => secimler.has(r.id));
    else { try { l = (await api<{ kayitlar: Kayit[] }>(yol(`${kok}/${encodeURIComponent(secili)}?${sorgu(1000, 0)}`))).kayitlar; } catch (e) { setHata((e as Error).message); return; } }
    if (bicim === "json") return indir(`${secili}.json`, JSON.stringify(l, null, 2), "application/json");
    const s = ["id", ...sutunlar.map((x) => x.ad), "olusturma"];
    const k = (x: string) => `"${x.replace(/"/g, '""')}"`;
    indir(`${secili}.csv`, "﻿" + [s.map(k).join(","), ...l.map((r) => s.map((a) => k(a === "olusturma" ? new Date(r.olusturma).toISOString() : goster(r[a]))).join(","))].join("\n"), "text/csv;charset=utf-8");
  };

  if (tablolar === null) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/40" /></div>;

  const paneller = (
    <>
      <YeniTabloPaneli projeId={p.id} acik={panel?.tur === "yeniTablo"} sablon={panel?.tur === "yeniTablo" ? panel.sablon : undefined} kapat={() => setPanel(null)} tablolar={tabloAdlari}
        kur={async (ad, aciklama, sema, kurallar) => { await api(yol(`${kok}/${encodeURIComponent(ad)}`), { method: "PATCH", govde: { sema, aciklama, kurallar } }); setPanel(null); await getir(); setSecili(ad); setSekme("kayitlar"); }} />
      {secili && <TabloGecmisi acik={gecmisAcik} kapat={() => setGecmisAcik(false)} tablo={secili} adres={yol(`${kok}/${encodeURIComponent(secili)}?gecmis=*&sinir=200`)} geriYukle={async (kayit) => { await api(yol(kok), { govde: { islem: "geriYukle", tablo: secili, kayit } }); yenile(); }} />}
      {secili && <KayitPaneli acik={panel?.tur === "kayit"} gecmisAdres={(id) => yol(`${kok}/${encodeURIComponent(secili)}?gecmis=${encodeURIComponent(id)}`)} kayit={panel?.tur === "kayit" ? panel.kayit : undefined} odak={panel?.tur === "kayit" ? panel.odak : undefined} sutunlar={sutunlar} kapat={() => setPanel(null)}
        kaydet={async (alanlar, id) => {
          if (id) await api(yol(`${kok}/${encodeURIComponent(secili)}/${id}`), { method: "PATCH", govde: { alanlar } });
          else await api(yol(`${kok}/${encodeURIComponent(secili)}`), { govde: { kayit: alanlar } });
          setPanel(null); yenile();
        }}
        sil={async (id) => { await api(yol(`${kok}/${encodeURIComponent(secili)}/${id}`), { method: "DELETE" }); setPanel(null); yenile(); }} />}
      {secili && <UretPaneli acik={panel?.tur === "uret"} tablo={secili} kapat={() => setPanel(null)} uret={async (adet, yonerge) => { const r = await api<{ eklendi: number; hatalar: string[] }>(yol(`/api/build/veritabani/${p.id}/uret`), { govde: { tablo: secili, adet, yonerge } }); yenile(); return r; }} />}
      <YedekPaneli acik={panel?.tur === "yedek"} projeId={p.id} kapat={() => setPanel(null)} yenile={yenile} />
      {secili && <IceAktarPaneli acik={panel?.tur === "iceAktar"} tablo={secili} sutunlar={sutunlar} kapat={() => setPanel(null)}
        aktar={async (l, anahtar) => { const r = await api<{ eklendi: number; guncellendi?: number; hatalar: string[]; hataSayisi: number }>(yol(`${kok}/${encodeURIComponent(secili)}`), { govde: { kayitlar: l, ...(anahtar ? { anahtar } : {}) } }); yenile(); return r; }} />}
      <AktarPaneli acik={panel?.tur === "aktar"} kok={kok} kapat={() => setPanel(null)} bitti={(a) => { setOrtamAyari(a); getir(); }} />
    </>
  );

  /* Ortam seçici ve Test şeridi (Test görünümünde) */
  const ortamSecici = <Secici id="vt-ortam" kucuk deger={ortam} set={(x) => { setOrtam(x); setSecili(null); setKayitlar(null); setPanel(null); }} l={[{ id: "canli", ad: "Canlı" }, { id: "test", ad: "Test" }]} />;
  const testAc = async () => { try { const v = await api<{ ortamAyari: OrtamAyari }>(kok, { govde: { islem: "testAc" } }); setOrtamAyari(v.ortamAyari); getir(); } catch (e) { setHata((e as Error).message); } };
  const testSeridi = ortam === "test" && (
    <div className="flex flex-wrap items-center gap-2 border-b border-amber-300/10 bg-amber-400/[0.05] px-4 py-2">
      <FlaskConical className="h-3.5 w-3.5 shrink-0 text-amber-200" />
      <p className="min-w-0 flex-1 text-[12.5px] text-amber-50/85">{ortamAyari.test ? "Test ortamı: önizleme, ajan ve test ödemeleri bu verileri kullanır; yayındaki site Canlı'yı kullanır." : "Test ortamı kapalı: önizleme şu an Canlı veriyi kullanır. Açınca Canlı'daki tablolar bir kez Test'e kopyalanır."}</p>
      {ortamAyari.test
        ? <button type="button" onClick={() => setPanel({ tur: "aktar" })} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black"><ArrowUpFromLine className="h-3.5 w-3.5" />Canlı&apos;ya aktar</button>
        : <button type="button" onClick={testAc} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black"><FlaskConical className="h-3.5 w-3.5" />Test ortamını aç</button>}
    </div>
  );

  /* Boş durum: tablo yok */
  if (!tablolar.length) {
    return (
      <div className="relative h-full overflow-y-auto [scrollbar-width:thin]">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2"><span className="text-[12px] text-white/45">Ortam</span>{ortamSecici}</div>
        {testSeridi}
        <div className="mx-auto flex max-w-[760px] flex-col items-center px-6 py-12 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#55d6fd]/[0.12] text-[#7fe0ff]"><Database className="h-5 w-5" /></span>
          <p className="text-[17px] font-semibold text-white">{ortam === "test" ? "Test veritabanında tablo yok" : "Projenin veritabanı hazır"}</p>
          <p className="mt-1.5 max-w-[500px] text-[13.5px] leading-relaxed text-white/55">Ürünler, rezervasyonlar, yorumlar ya da üyelerin notları burada tablolarda tutulur. Ajana &quot;ürünleri veritabanında tut&quot; demen yeter; tabloyu sütunları ve erişim kurallarıyla kendisi kurar. Ya da bir başlangıç tablosu seç:</p>
          <div className="mt-6 grid w-full gap-2.5 sm:grid-cols-2">
            {TABLO_SABLON.map((t) => (
              <button key={t.ad} type="button" onClick={() => setPanel({ tur: "yeniTablo", sablon: { ad: t.ad, aciklama: t.aciklama, sema: t.sema, kurallar: t.kurallar } })} className="rounded-[18px] bg-white/[0.03] p-4 text-left ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.06]">
                <span className="flex items-center justify-between"><span className="text-[14px] font-semibold text-white">{t.baslik}</span><span className="text-[11.5px] text-white/40">{t.ad}</span></span>
                <span className="mt-1 block text-[12.5px] text-white/50">{t.aciklama}</span>
                <span className="mt-3 flex flex-wrap gap-1">{t.sema.slice(0, 5).map((s) => <span key={s.ad} className="inline-flex h-6 items-center gap-1 rounded-full bg-white/[0.06] px-2 text-[11.5px] text-white/65"><TurSimge tur={s.tur} className="h-3 w-3 text-white/40" />{s.ad}</span>)}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setPanel({ tur: "yeniTablo" })} className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13.5px] font-semibold text-black"><Plus className="h-4 w-4" />Boş tablo oluştur</button>
        </div>
        {paneller}
      </div>
    );
  }

  const suzgecYazi = (s: Suzgec) => `${s.alan} ${OPLAR.find((o) => o.id === s.op)?.ad ?? s.op}${OPLAR.find((o) => o.id === s.op)?.degersiz ? "" : ` ${s.deger}`}`;
  const sayfaSayisi = Math.max(1, Math.ceil(toplam / SAYFA));

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden max-md:flex-col">
      {/* tablolar */}
      <div className="flex w-[230px] shrink-0 flex-col border-r border-white/[0.06] max-md:w-full max-md:border-b max-md:border-r-0">
        <div className="flex items-center gap-2 px-2.5 pt-2.5"><span className="text-[12px] text-white/45">Ortam</span>{ortamSecici}</div>
        <div className="flex items-center gap-1.5 p-2">
          <label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" /><input value={tabloAra} onChange={(e) => setTabloAra(e.target.value)} placeholder="Tablo ara" className="h-8 w-full rounded-[10px] bg-white/[0.05] pl-8 pr-2 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.06] placeholder:text-white/30 focus:ring-white/25" /></label>
          <button type="button" title="Yeni tablo" onClick={() => setPanel({ tur: "yeniTablo" })} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white text-black"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 [scrollbar-width:thin] max-md:flex max-md:gap-1 max-md:overflow-x-auto">
          {tablolar.filter((t) => t.ad.toLowerCase().includes(tabloAra.toLowerCase())).map((t) => (
            <button key={t.ad} type="button" onClick={() => { setSecili(t.ad); setSemaAcik(false); }} className={cn("flex w-full shrink-0 items-center gap-2 rounded-[10px] px-2.5 py-2 text-left transition-colors max-md:w-auto", secili === t.ad ? "bg-white/[0.08] text-white" : "text-white/65 hover:bg-white/[0.04] hover:text-white")}>
              <Database className={cn("h-3.5 w-3.5 shrink-0", secili === t.ad ? "text-[#8be6ff]" : "text-white/35")} />
              <span className="min-w-0 flex-1 truncate text-[13px]">{t.ad}</span>
              <span className="shrink-0 text-[11.5px] tabular-nums text-white/40">{t.adet.toLocaleString("tr-TR")}</span>
            </button>
          ))}
        </div>
        <div className={cn("border-t border-white/[0.06] p-2 max-md:hidden", ortam === "test" && "hidden")}>
          <button type="button" onClick={() => setSemaAcik(true)} className={cn("flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[12.5px] hover:bg-white/[0.04] hover:text-white", semaAcik ? "bg-white/[0.07] text-white" : "text-white/60")}><Network className="h-3.5 w-3.5" />Şema diyagramı</button>
          <button type="button" onClick={() => setPanel({ tur: "yedek" })} className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[12.5px] text-white/60 hover:bg-white/[0.04] hover:text-white"><History className="h-3.5 w-3.5" />Yedekler ve geri yükleme</button>
        </div>
      </div>

      {/* tablo */}
      <div className="flex min-w-0 flex-1 flex-col">
        {testSeridi}
        {semaAcik && <SemaDiyagrami projeId={p.id} tablolar={tablolar} kapat={() => setSemaAcik(false)} onSec={(ad) => { setSecili(ad); setSemaAcik(false); setSekme("yapi"); }} />}
        {tablo && !semaAcik && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/[0.06] px-4 py-2.5">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[15px] font-semibold text-white">{tablo.ad}<span className="text-[12px] font-normal text-white/40">{tablo.adet.toLocaleString("tr-TR")} kayıt</span></p>
              {tablo.aciklama && <p className="truncate text-[12px] text-white/45">{tablo.aciklama}</p>}
            </div>
            <span className="flex-1" />
            <Secici id="vt-sekme" kucuk deger={sekme} set={setSekme} l={[{ id: "kayitlar", ad: "Kayıtlar" }, { id: "yapi", ad: "Yapı" }, { id: "kurallar", ad: "Kurallar" }, { id: "kullanim", ad: "Kullanım" }]} />
          </div>
        )}

        {tablo && !semaAcik && sekme === "kayitlar" && (
          <>
            {/* araç çubuğu */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.06] px-3 py-2">
              {secimler.size ? (
                <>
                  <span className="px-1 text-[12.5px] font-medium text-white">{secimler.size} kayıt seçili</span>
                  <button type="button" onClick={() => disaAktar("csv", true)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white hover:bg-white/[0.12]"><Download className="h-3.5 w-3.5" />Dışa aktar</button>
                  {silOnay === "secim" ? (
                    <button type="button" onClick={() => { setSilOnay(null); islem(() => api(yol(`${kok}/${encodeURIComponent(secili!)}?idler=${[...secimler].join(",")}`), { method: "DELETE" })).then(() => setSecimler(new Set())); }} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-rose-500/20 px-3 text-[12.5px] font-medium text-rose-100">Evet, {secimler.size} kaydı sil</button>
                  ) : <button type="button" onClick={() => setSilOnay("secim")} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white/80 hover:bg-rose-500/15 hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" />Sil</button>}
                  <button type="button" onClick={() => { setSecimler(new Set()); setSilOnay(null); }} className="inline-flex h-8 items-center rounded-full px-3 text-[12.5px] text-white/55 hover:bg-white/[0.06] hover:text-white">Seçimi kaldır</button>
                </>
              ) : (
                <>
                  <label className="relative min-w-[150px] max-w-[240px] flex-1 max-sm:max-w-none"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" /><input value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Kayıtlarda ara" className="h-8 w-full rounded-full bg-white/[0.05] pl-8 pr-3 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-white/30 focus:ring-white/25" /></label>
                  <button type="button" onClick={() => setTaslakSuzgec({ alan: sutunlar[0]?.ad ?? "id", op: "esit", deger: "" })} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] transition-colors", suzgecler.length ? "bg-[#55d6fd]/[0.14] text-[#8be6ff]" : "bg-white/[0.06] text-white/75 hover:bg-white/[0.1] hover:text-white")}><Filter className="h-3.5 w-3.5" />Süzgeç{suzgecler.length ? ` ${suzgecler.length}` : ""}</button>
                  <button type="button" onClick={() => setSistem((x) => !x)} title="Kimlik ve güncelleme sütunlarını göster" aria-label="Sistem sütunları" className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] transition-colors", sistem ? "bg-white/[0.1] text-white ring-1 ring-inset ring-white/60" : "bg-white/[0.06] text-white/75 hover:bg-white/[0.1] hover:text-white")}><Columns3 className="h-3.5 w-3.5" /><span className="max-2xl:hidden">Sistem sütunları</span><span className="2xl:hidden">Sistem</span></button>
                  <span className="flex-1" />
                  <button type="button" title="Değişiklik geçmişi ve silinen kayıtlar" aria-label="Değişiklik geçmişi" onClick={() => setGecmisAcik(true)} className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><History className="h-3.5 w-3.5" /></button>
                  <button type="button" title="Yenile" onClick={yenile} className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><RotateCw className={cn("h-3.5 w-3.5", yukleniyor && "animate-spin")} /></button>
                  {<button type="button" title="Yapay zekâyla deneme verisi üret" onClick={() => setPanel({ tur: "uret" })} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/80 hover:bg-white/[0.1] hover:text-white"><Sparkles className="h-3.5 w-3.5 text-[#8be6ff]" /><span className="max-2xl:hidden">Veri üret</span></button>}
                  <button type="button" title="CSV ya da JSON içe aktar" onClick={() => setPanel({ tur: "iceAktar" })} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12.5px] text-white/80 hover:bg-white/[0.1] hover:text-white"><Upload className="h-3.5 w-3.5" /><span className="max-2xl:hidden">İçe aktar</span></button>
                  <DisaAktarMenu kapali={!toplam} sec={(b) => disaAktar(b)} />
                  <button type="button" onClick={() => setPanel({ tur: "kayit" })} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black"><Plus className="h-3.5 w-3.5" />Kayıt ekle</button>
                </>
              )}
            </div>
            {/* süzgeçler */}
            {(suzgecler.length > 0 || taslakSuzgec || sirala) && (
              <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.06] px-3 py-2">
                {suzgecler.map((s, i) => (
                  <span key={i} className="inline-flex h-8 items-center gap-1 rounded-full bg-[#55d6fd]/[0.1] pl-3 pr-1 text-[12.5px] text-[#a8ecff] ring-1 ring-inset ring-[#55d6fd]/20">
                    <Filter className="h-3 w-3" />{suzgecYazi(s)}
                    <button type="button" aria-label="Süzgeci kaldır" onClick={() => setSuzgecler((l) => l.filter((_, j) => j !== i))} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/[0.1]"><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {sirala && (
                  <span className="inline-flex h-8 items-center gap-1 rounded-full bg-white/[0.07] pl-3 pr-1 text-[12.5px] text-white/80">
                    {sirala.yon === "artan" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}{sirala.alan}, {sirala.yon === "artan" ? "artan" : "azalan"}
                    <button type="button" aria-label="Sıralamayı kaldır" onClick={() => setSirala(null)} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/[0.1]"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {taslakSuzgec && (
                  <form onSubmit={(e) => { e.preventDefault(); setSuzgecler((l) => [...l, taslakSuzgec]); setTaslakSuzgec(null); }} className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
                    <div className="w-[150px]"><AcilirSecim deger={taslakSuzgec.alan} set={(v) => setTaslakSuzgec({ ...taslakSuzgec, alan: v })} l={[...sutunlar.map((s) => ({ id: s.ad, ad: s.ad, alt: TUR_BILGI[s.tur].ad })), { id: "id", ad: "id", alt: "Kimlik" }, { id: "olusturma", ad: "olusturma", alt: "Eklenme zamanı" }]} /></div>
                    <div className="w-[130px]"><AcilirSecim deger={taslakSuzgec.op} set={(v) => setTaslakSuzgec({ ...taslakSuzgec, op: v as Op })} l={OPLAR.map((o) => ({ id: o.id, ad: o.ad }))} /></div>
                    {!OPLAR.find((o) => o.id === taslakSuzgec.op)?.degersiz && <input autoFocus value={taslakSuzgec.deger} onChange={(e) => setTaslakSuzgec({ ...taslakSuzgec, deger: e.target.value })} placeholder="Değer" className={cn(alanSinif, "h-10 w-[150px] text-[13px]")} />}
                    <button className="inline-flex h-10 items-center rounded-full bg-white px-4 text-[12.5px] font-semibold text-black">Uygula</button>
                    <button type="button" onClick={() => setTaslakSuzgec(null)} className="inline-flex h-10 items-center rounded-full px-3 text-[12.5px] text-white/55 hover:bg-white/[0.06]">Vazgeç</button>
                  </form>
                )}
                {!taslakSuzgec && (suzgecler.length > 0 || sirala) && <button type="button" onClick={() => { setSuzgecler([]); setSirala(null); }} className="inline-flex h-8 items-center rounded-full px-3 text-[12.5px] text-white/50 hover:bg-white/[0.06] hover:text-white">Temizle</button>}
              </div>
            )}
            {/* ızgara */}
            <div className="min-h-0 flex-1 overflow-auto [scrollbar-width:thin]">
              {kayitlar === null ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-white/40" /></div>
                : !kayitlar.length ? (
                  <div className="flex flex-col items-center px-6 py-14 text-center">
                    <p className="text-[14px] text-white/75">{araGecikmeli || suzgecler.length ? "Bu aramaya uyan kayıt yok" : "Bu tabloda henüz kayıt yok"}</p>
                    <p className="mt-1 max-w-[400px] text-[12.5px] leading-relaxed text-white/45">{araGecikmeli || suzgecler.length ? "Süzgeçleri gevşet ya da temizle." : "Sitende ziyaretçiler ekledikçe burada görünür. Elle ekleyebilir ya da CSV dosyasından içe aktarabilirsin."}</p>
                    {!araGecikmeli && !suzgecler.length && <div className="mt-4 flex gap-2"><button type="button" onClick={() => setPanel({ tur: "kayit" })} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black"><Plus className="h-3.5 w-3.5" />Kayıt ekle</button><button type="button" onClick={() => setPanel({ tur: "iceAktar" })} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] text-white"><Upload className="h-3.5 w-3.5" />CSV içe aktar</button></div>}
                  </div>
                ) : (
                  <table className="w-full min-w-max border-separate border-spacing-0 text-[12.5px]">
                    <thead className="sticky top-0 z-10 bg-[#111214]">
                      <tr>
                        <th className="w-[72px] border-b border-r border-white/[0.06] px-3 py-2"><SecimKutusu durum={tumu} etiket="Hepsini seç" degis={() => setSecimler(tumu === "tam" ? new Set() : new Set(kayitlar.map((r) => r.id)))} /></th>
                        {gorunen.map((s) => (
                          <th key={s.ad} className="border-b border-r border-white/[0.06] p-0 text-left font-medium">
                            <button type="button" onClick={() => siralaDegis(s.ad)} title={`${TUR_BILGI[s.tur].ad}${s.zorunlu ? ", zorunlu" : ""}${s.cikarim ? ", şemada tanımsız" : ""}`} className="flex w-full min-w-[140px] items-center gap-1.5 px-3 py-2 text-white/60 hover:bg-white/[0.03] hover:text-white">
                              <TurSimge tur={s.tur} className={s.cikarim ? "text-white/25" : "text-white/40"} />
                              <span className="text-[12.5px]">{s.ad}</span>
                              {s.zorunlu && <span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" title="Zorunlu" />}
                              <span className="flex-1" />
                              {sirala?.alan === s.ad && (sirala.yon === "artan" ? <ArrowUp className="h-3 w-3 text-[#8be6ff]" /> : <ArrowDown className="h-3 w-3 text-[#8be6ff]" />)}
                            </button>
                          </th>
                        ))}
                        <th className="border-b border-white/[0.06] p-0 text-left font-medium"><button type="button" onClick={() => siralaDegis("olusturma")} className="flex w-full min-w-[150px] items-center gap-1.5 px-3 py-2 text-white/60 hover:bg-white/[0.03] hover:text-white"><Calendar className="h-3.5 w-3.5 text-white/40" /><span className="text-[12.5px]">olusturma</span><span className="flex-1" />{sirala?.alan === "olusturma" && (sirala.yon === "artan" ? <ArrowUp className="h-3 w-3 text-[#8be6ff]" /> : <ArrowDown className="h-3 w-3 text-[#8be6ff]" />)}</button></th>
                      </tr>
                    </thead>
                    <tbody>
                      {kayitlar.map((r) => (
                        <tr key={r.id} className={cn("group", secimler.has(r.id) && "bg-white/[0.035]")}>
                          <td className="border-b border-r border-white/[0.04] px-3 py-1.5">
                            <span className="flex items-center gap-1.5">
                              <SecimKutusu durum={secimler.has(r.id) ? "tam" : "yok"} etiket="Kaydı seç" degis={() => setSecimler((s) => { const n = new Set(s); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); return n; })} />
                              <button type="button" title="Kaydı aç" onClick={() => setPanel({ tur: "kayit", kayit: r })} className="flex h-6 w-6 items-center justify-center rounded-[7px] text-white/30 opacity-0 hover:bg-white/[0.08] hover:text-white group-hover:opacity-100 max-md:opacity-100"><Maximize2 className="h-3 w-3" /></button>
                            </span>
                          </td>
                          {gorunen.map((s) => {
                            const sistemSutun = SISTEM.includes(s.ad);
                            const satirIci = !sistemSutun && !["mantiksal", "secim", "json", "uzunMetin"].includes(s.tur);
                            return (
                              <td key={s.ad} onDoubleClick={() => {
                                if (sistemSutun) return;
                                if (s.tur === "mantiksal") return hucreKaydet(r.id, s.ad, !(r[s.ad] === true));
                                if (!satirIci) return setPanel({ tur: "kayit", kayit: r, odak: s.ad });
                                setDuzen({ id: r.id, alan: s.ad, deger: s.tur === "tarih" && r[s.ad] ? new Date(String(r[s.ad])).toISOString().slice(0, 16) : goster(r[s.ad]) });
                              }}
                                className={cn("h-10 max-w-[320px] border-b border-r border-white/[0.04] px-3 py-1 align-middle text-white/85", !sistemSutun && "cursor-cell hover:bg-white/[0.025]", duzen?.id === r.id && duzen.alan === s.ad && "p-0 ring-2 ring-inset ring-[#55d6fd]")}>
                                {duzen?.id === r.id && duzen.alan === s.ad ? (
                                  <input autoFocus type={s.tur === "tarih" ? "datetime-local" : s.tur === "sayi" ? "number" : "text"} value={duzen.deger} onChange={(e) => setDuzen({ ...duzen, deger: e.target.value })}
                                    onKeyDown={(e) => { if (e.key === "Escape") setDuzen(null); if (e.key === "Enter") hucreKaydet(r.id, s.ad, s.cikarim ? serbestCoz(duzen.deger) : duzen.deger === "" ? null : duzen.deger); }}
                                    onBlur={() => hucreKaydet(r.id, s.ad, s.cikarim ? serbestCoz(duzen.deger) : duzen.deger === "" ? null : duzen.deger)}
                                    className="h-10 w-full min-w-[160px] bg-[#0c0d0f] px-3 text-[12.5px] text-white outline-none [color-scheme:dark]" />
                                ) : sistemSutun ? <span className="font-mono text-[11.5px] text-white/45">{s.tur === "tarih" ? tarihYaz(r[s.ad]) : goster(r[s.ad]) || "boş"}</span> : <Hucre s={s} v={r[s.ad]} />}
                              </td>
                            );
                          })}
                          <td className="whitespace-nowrap border-b border-white/[0.04] px-3 py-1 align-middle text-white/45">{tarihYaz(r.olusturma)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
            {/* alt çubuk */}
            <div className="flex items-center gap-2 border-t border-white/[0.06] px-3 py-1.5 text-[12px] text-white/45">
              <span className="tabular-nums max-md:hidden">{toplam ? `${(sayfa * SAYFA + 1).toLocaleString("tr-TR")} ile ${Math.min(toplam, (sayfa + 1) * SAYFA).toLocaleString("tr-TR")} arası, toplam ${toplam.toLocaleString("tr-TR")} kayıt` : "Kayıt yok"}</span><span className="tabular-nums md:hidden">{toplam.toLocaleString("tr-TR")} kayıt</span>
              <span className="max-md:hidden">· Hücreyi değiştirmek için çift tıkla</span>
              <span className="flex-1" />
              <button type="button" aria-label="Önceki sayfa" disabled={sayfa === 0} onClick={() => setSayfa((s) => s - 1)} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/[0.07] hover:text-white disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <span className="tabular-nums">Sayfa {sayfa + 1}<span className="max-md:hidden">, toplam {sayfaSayisi}</span></span>
              <button type="button" aria-label="Sonraki sayfa" disabled={sayfa + 1 >= sayfaSayisi} onClick={() => setSayfa((s) => s + 1)} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/[0.07] hover:text-white disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </>
        )}

        {tablo && !semaAcik && sekme === "yapi" && <YapiSekmesi tablo={tablo} sutunlar={sutunlar} tablolar={tabloAdlari} kok={kok} yol={yol} yenile={async (yeniAd) => { await getir(); if (yeniAd) setSecili(yeniAd); kayitGetir(); }} silOnay={silOnay} setSilOnay={setSilOnay} sil={async () => { await api(yol(`${kok}/${encodeURIComponent(tablo.ad)}`), { method: "DELETE" }); setSilOnay(null); setSecili(null); getir(); }} bosalt={async () => { await api(yol(`${kok}/${encodeURIComponent(tablo.ad)}?bosalt=1`), { method: "DELETE" }); setSilOnay(null); yenile(); }} />}
        {tablo && !semaAcik && sekme === "kurallar" && <KurallarSekmesi tablo={tablo} kaydet={async (k) => { await api(yol(`${kok}/${encodeURIComponent(tablo.ad)}`), { method: "PATCH", govde: { kurallar: k } }); getir(); }} />}
        {tablo && !semaAcik && sekme === "kullanim" && <KullanimSekmesi tablo={tablo} sutunlar={sutunlar} kok={kok} />}
      </div>

      <AnimatePresence>{hata && <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-12 left-1/2 z-50 -translate-x-1/2 rounded-full bg-rose-500/20 px-4 py-2 text-[12.5px] text-rose-100 ring-1 ring-inset ring-rose-400/25 backdrop-blur">{hata}</motion.p>}</AnimatePresence>
      {paneller}
    </div>
  );
}

/* ── Yeni tablo paneli ── */
function YeniTabloPaneli({ acik, sablon, kapat, kur, tablolar, projeId }: { acik: boolean; sablon?: { ad: string; aciklama: string; sema: Sutun[]; kurallar: Kurallar }; kapat: () => void; kur: (ad: string, aciklama: string, sema: Sutun[], k: Kurallar) => Promise<void>; tablolar: string[]; projeId?: string }) {
  const [ad, setAd] = useState(""); const [aciklama, setAciklama] = useState("");
  const [sema, setSema] = useState<Sutun[]>([{ ad: "ad", tur: "metin", zorunlu: true }]);
  const [k, setK] = useState<Kurallar>({ okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" });
  const [hata, setHata] = useState(""); const [gidiyor, setGidiyor] = useState(false);
  const [vars, setVars] = useState<{ kip: string; kurallar: Kurallar; kaynak: string } | null>(null);
  useEffect(() => { if (!acik || !projeId) return; api<{ yeniTablo: { kip: string; kurallar: Kurallar; kaynak: string } }>(`/api/build/veritabani/${projeId}/ayar`).then((x) => { setVars(x.yeniTablo); if (!sablon) setK(x.yeniTablo.kurallar); }).catch(() => {}); }, [acik, projeId, sablon]);
  const varsayilanYap = async (kip: "kapali" | "acik" | "ozel") => { if (!projeId) return; const x = await api<{ yeniTablo: { kip: string; kurallar: Kurallar; kaynak: string } }>(`/api/build/veritabani/${projeId}/ayar`, { method: "PATCH", govde: { yeniTablo: { kip, kurallar: k } } }).catch(() => null); if (x) setVars(x.yeniTablo); };
  useEffect(() => { if (!acik) return; setAd(sablon?.ad ?? ""); setAciklama(sablon?.aciklama ?? ""); setSema(sablon?.sema ?? [{ ad: "ad", tur: "metin", zorunlu: true }]); setK(sablon?.kurallar ?? vars?.kurallar ?? { okuma: "kapali", ekleme: "kapali", duzenleme: "kapali" }); setHata(""); }, [acik, sablon]); // eslint-disable-line react-hooks/exhaustive-deps
  const gonder = async () => {
    if (!/^[a-zA-Z0-9_-]{1,40}$/.test(ad)) return setHata("Tablo adı yalnız İngilizce harf, rakam, tire ve alt çizgi olabilir.");
    if (tablolar.includes(ad)) return setHata("Bu adda bir tablo zaten var.");
    const l = sema.filter((s) => s.ad.trim());
    if (new Set(l.map((s) => s.ad)).size !== l.length) return setHata("Aynı adda iki sütun var.");
    setGidiyor(true);
    try { await kur(ad, aciklama, l, k); } catch (e) { setHata((e as Error).message); } finally { setGidiyor(false); }
  };
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Yeni tablo" alt="Sütunları ve kimin neye erişeceğini belirle; sonra her şeyi değiştirebilirsin"
      alt2={<>{hata && <span className="min-w-0 flex-1 text-[12.5px] text-rose-200">{hata}</span>}<span className="flex-1" /><button type="button" onClick={kapat} className="h-10 rounded-full px-4 text-[13px] text-white/65 hover:bg-white/[0.06]">Vazgeç</button><button type="button" onClick={gonder} disabled={gidiyor} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13px] font-semibold text-black disabled:opacity-50">{gidiyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Tabloyu oluştur</button></>}>
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-[12.5px] text-white/55">Ad</p>
          <input autoFocus value={ad} onChange={(e) => setAd(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))} placeholder="urunler" className={cn(alanSinif, "h-11")} />
          <input value={aciklama} onChange={(e) => setAciklama(e.target.value)} placeholder="Açıklama, isteğe bağlı: ne tutar?" className={cn(alanSinif, "h-11 text-[13.5px]")} />
        </div>
        <div><p className="mb-2 text-[12.5px] text-white/55">Sütunlar</p><SutunDuzenleyici l={sema} set={setSema} tablolar={tablolar} /></div>
        <div><p className="mb-2 text-[12.5px] text-white/55">Erişim</p><KuralSecimi k={k} set={setK} /></div>
        {vars && <div className="rounded-[12px] bg-white/[0.03] px-3 py-2.5 text-[12px] leading-relaxed text-white/55 ring-1 ring-inset ring-white/[0.07]">Bu projede yeni tablolar varsayılan olarak <span className="text-white">{vars.kip === "kapali" ? "kapalı" : vars.kip === "acik" ? "okuma ve eklemeye açık" : "özel kurallarla"}</span> açılır{vars.kaynak === "yeniProje" ? " (yeni projelerde güvenli varsayılan)" : vars.kaynak === "eskiProje" ? " (eski projelerde siteler bozulmasın diye açık)" : ""}; site, ajan ve sunucu fonksiyonunun açtığı tablolar da buna uyar.<span className="mt-1.5 flex flex-wrap gap-1.5"><button type="button" onClick={() => varsayilanYap("kapali")} className={cn("h-7 rounded-full px-2.5 text-[11.5px]", vars.kip === "kapali" ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "bg-white/[0.05] text-white/65 ring-1 ring-inset ring-white/[0.08]")}>Varsayılan kapalı</button><button type="button" onClick={() => varsayilanYap("acik")} className={cn("h-7 rounded-full px-2.5 text-[11.5px]", vars.kip === "acik" ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "bg-white/[0.05] text-white/65 ring-1 ring-inset ring-white/[0.08]")}>Varsayılan açık</button><button type="button" onClick={() => varsayilanYap("ozel")} className={cn("h-7 rounded-full px-2.5 text-[11.5px]", vars.kip === "ozel" ? "bg-white/[0.08] text-white ring-2 ring-inset ring-white" : "bg-white/[0.05] text-white/65 ring-1 ring-inset ring-white/[0.08]")}>Özel: yukarıdaki kurallar</button></span></div>}
      </div>
    </YanPanel>
  );
}

/* ── Kayıt paneli (ekle / düzenle) ── */
function KayitPaneli({ acik, kayit, odak, sutunlar, kapat, kaydet, sil, gecmisAdres }: { acik: boolean; kayit?: Kayit; odak?: string; sutunlar: Sutun[]; kapat: () => void; kaydet: (alanlar: Record<string, unknown>, id?: string) => Promise<void>; sil: (id: string) => Promise<void>; gecmisAdres?: (id: string) => string }) {
  const [gecmis, setGecmis] = useState<GecmisSatir[] | null>(null);
  const [gecmisAcik, setGecmisAcik] = useState(false);
  useEffect(() => { setGecmis(null); setGecmisAcik(false); }, [kayit?.id, acik]);
  useEffect(() => { if (gecmisAcik && kayit && gecmisAdres && gecmis === null) api<{ gecmis: GecmisSatir[] }>(gecmisAdres(kayit.id)).then((x) => setGecmis(x.gecmis)).catch(() => setGecmis([])); }, [gecmisAcik, kayit, gecmisAdres, gecmis]);
  const [d, setD] = useState<Record<string, string>>({});
  const [ek, setEk] = useState<{ ad: string; deger: string }[]>([]);
  const [hata, setHata] = useState(""); const [gidiyor, setGidiyor] = useState(false); const [silOnay, setSilOnay] = useState(false);
  const kutu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!acik) return;
    setD(Object.fromEntries(sutunlar.map((s) => { const v = kayit?.[s.ad]; return [s.ad, v === undefined || v === null ? (kayit ? "" : s.varsayilan !== undefined && s.varsayilan !== "simdi" ? goster(s.varsayilan) : "") : s.tur === "tarih" ? new Date(String(v)).toISOString().slice(0, 16) : s.tur === "json" ? JSON.stringify(v, null, 2) : goster(v)]; })));
    setEk([]); setHata(""); setSilOnay(false);
    if (odak) setTimeout(() => kutu.current?.querySelector<HTMLElement>(`[data-alan="${CSS.escape(odak)}"]`)?.focus(), 250);
  }, [acik, kayit, sutunlar, odak]);
  const gonder = async () => {
    const alanlar: Record<string, unknown> = {};
    for (const s of sutunlar) {
      const v = d[s.ad] ?? "";
      if (!kayit && v === "" ) continue;
      alanlar[s.ad] = v === "" ? null : s.cikarim ? serbestCoz(v) : s.tur === "mantiksal" ? v === "true" : s.tur === "tarih" ? new Date(v).toISOString() : v;
    }
    for (const e of ek) if (e.ad.trim()) alanlar[e.ad.trim()] = serbestCoz(e.deger);
    setGidiyor(true); setHata("");
    try { await kaydet(alanlar, kayit?.id); } catch (e) { setHata((e as Error).message); } finally { setGidiyor(false); }
  };
  return (
    <YanPanel acik={acik} kapat={kapat} baslik={kayit ? "Kaydı düzenle" : "Yeni kayıt"} alt={kayit ? `Kimlik ${kayit.id} · ${tarihYaz(kayit.olusturma)} eklendi` : "Zorunlu alanlar mavi noktayla işaretli"}
      alt2={<>
        {kayit && (silOnay ? <button type="button" onClick={() => sil(kayit.id).catch((e) => setHata((e as Error).message))} className="h-10 rounded-full bg-rose-500/20 px-4 text-[13px] font-medium text-rose-100">Evet, sil</button>
          : <button type="button" onClick={() => setSilOnay(true)} aria-label="Kaydı sil" className="flex h-10 w-10 items-center justify-center rounded-full text-white/50 hover:bg-rose-500/15 hover:text-rose-200"><Trash2 className="h-4 w-4" /></button>)}
        {hata && <span className="min-w-0 flex-1 text-[12.5px] text-rose-200">{hata}</span>}
        <span className="flex-1" />
        <button type="button" onClick={kapat} className="h-10 rounded-full px-4 text-[13px] text-white/65 hover:bg-white/[0.06]">Vazgeç</button>
        <button type="button" onClick={gonder} disabled={gidiyor} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13px] font-semibold text-black disabled:opacity-50">{gidiyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{kayit ? "Kaydet" : "Ekle"}</button>
      </>}>
      <div ref={kutu} className="space-y-4">
        {sutunlar.map((s) => (
          <div key={s.ad}>
            <p className="mb-1.5 flex items-center gap-1.5 text-[12.5px] text-white/60"><TurSimge tur={s.tur} className="text-white/40" /><span className="font-medium text-white/80">{s.ad}</span>{s.zorunlu && <span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" />}<span className="ml-auto text-[11.5px] text-white/35">{TUR_BILGI[s.tur].ad}{s.iliski ? `, ${s.iliski}` : ""}</span></p>
            {s.tur === "mantiksal" ? <Secici id={`k-${s.ad}`} deger={d[s.ad] === "true" ? "true" : d[s.ad] === "false" ? "false" : ""} set={(v) => setD({ ...d, [s.ad]: v })} l={[{ id: "", ad: "Boş" }, { id: "true", ad: "Evet" }, { id: "false", ad: "Hayır" }]} />
              : s.tur === "secim" && s.secenekler?.length ? <AcilirSecim deger={d[s.ad] ?? ""} set={(v) => setD({ ...d, [s.ad]: v })} l={s.secenekler.map((x) => ({ id: x, ad: x }))} bos="Boş" />
                : s.tur === "uzunMetin" || s.tur === "json" ? <textarea data-alan={s.ad} value={d[s.ad] ?? ""} onChange={(e) => setD({ ...d, [s.ad]: e.target.value })} rows={s.tur === "json" ? 6 : 4} className={cn(alanSinif, "resize-y py-2.5 text-[13.5px]", s.tur === "json" && "font-mono text-[12.5px]")} />
                  : <>
                    <input data-alan={s.ad} type={s.tur === "tarih" ? "datetime-local" : s.tur === "sayi" ? "number" : s.tur === "eposta" ? "email" : s.tur === "url" || s.tur === "gorsel" ? "url" : "text"} value={d[s.ad] ?? ""} onChange={(e) => setD({ ...d, [s.ad]: e.target.value })} placeholder={s.tur === "gorsel" ? "https://…/gorsel.jpg" : s.tur === "iliski" ? "Bağlı kaydın kimliği" : ""} className={cn(alanSinif, "h-11 [color-scheme:dark]")} />
                    {s.tur === "gorsel" && d[s.ad] && /* eslint-disable-next-line @next/next/no-img-element */ <img src={d[s.ad]} alt="" className="mt-2 h-28 w-full rounded-[12px] bg-white/[0.04] object-cover" />}
                  </>}
          </div>
        ))}
        {ek.map((e, i) => (
          <div key={i} className="flex gap-2">
            <input value={e.ad} onChange={(x) => setEk(ek.map((y, j) => (j === i ? { ...y, ad: x.target.value } : y)))} placeholder="alan_adi" className={cn(alanSinif, "h-11 w-[150px] font-mono text-[13px]")} />
            <input value={e.deger} onChange={(x) => setEk(ek.map((y, j) => (j === i ? { ...y, deger: x.target.value } : y)))} placeholder="Değer" className={cn(alanSinif, "h-11 flex-1")} />
          </div>
        ))}
        <button type="button" onClick={() => setEk([...ek, { ad: "", deger: "" }])} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-[12.5px] text-white/75 hover:bg-white/[0.1] hover:text-white"><Plus className="h-3.5 w-3.5" />Şemada olmayan alan ekle</button>
        {kayit && gecmisAdres && (
          <section className="rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
            <button type="button" onClick={() => setGecmisAcik((x) => !x)} className="flex w-full items-center gap-2 px-3.5 py-3 text-left"><History className="h-4 w-4 text-white/50" /><span className="flex-1 text-[13px] font-medium text-white">Değişiklik geçmişi</span><ChevronRight className={cn("h-4 w-4 text-white/40 transition-transform", gecmisAcik && "rotate-90")} /></button>
            {gecmisAcik && (gecmis === null ? <div className="flex h-16 items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-white/40" /></div>
              : !gecmis.length ? <p className="px-3.5 pb-3 text-[12.5px] text-white/45">Bu kaydın kayıtlı geçmişi yok (geçmiş tutulmaya başlamadan önce eklenmiş olabilir).</p>
              : <div className="divide-y divide-white/[0.05] border-t border-white/[0.05]">{gecmis.map((g, i) => { const f = g.islem === "guncelle" ? farklar(g.onceki, g.sonraki) : []; return (
                <div key={i} className="px-3.5 py-2.5">
                  <p className="flex items-center gap-2 text-[12.5px]"><span className="font-medium text-white">{ISLEM_AD[g.islem]}</span><span className="text-white/45">{KIM_AD(g.kim)} · {tarihYaz(g.z)}</span><span className="flex-1" />
                    {g.islem === "guncelle" && g.onceki && <button type="button" onClick={() => { const geri: Record<string, unknown> = {}; for (const x of farklar(g.onceki, kayit as Record<string, unknown>)) geri[x.alan] = g.onceki?.[x.alan] ?? null; kaydet(geri, kayit.id).catch((e) => setHata((e as Error).message)); }} className="rounded-full bg-white/[0.07] px-2.5 py-0.5 text-[11.5px] text-white/80 hover:bg-white/[0.12]">Önceki hâle dön</button>}</p>
                  {f.slice(0, 6).map((x) => <p key={x.alan} className="mt-1 text-[12px] text-white/55"><span className="text-white/75">{x.alan}</span>: <span className="text-rose-200/70 line-through">{kisa(x.eski)}</span> <span className="text-emerald-200/80">{kisa(x.yeni)}</span></p>)}
                </div>
              ); })}</div>)}
          </section>
        )}
      </div>
    </YanPanel>
  );
}

/* ── Deneme verisi üretme paneli ── */
function UretPaneli({ acik, tablo, kapat, uret }: { acik: boolean; tablo: string; kapat: () => void; uret: (adet: number, yonerge: string) => Promise<{ eklendi: number; hatalar: string[] }> }) {
  const [adet, setAdet] = useState("10"); const [ozel, setOzel] = useState(""); const [yonerge, setYonerge] = useState("");
  const [gidiyor, setGidiyor] = useState(false); const [sonuc, setSonuc] = useState<{ eklendi: number; hatalar: string[] } | null>(null); const [hata, setHata] = useState("");
  useEffect(() => { if (acik) { setSonuc(null); setHata(""); } }, [acik]);
  const n = adet === "ozel" ? Math.min(50, Math.max(1, Number(ozel) || 0)) : Number(adet);
  const gonder = async () => { setGidiyor(true); setHata(""); setSonuc(null); try { setSonuc(await uret(n, yonerge)); } catch (e) { setHata((e as Error).message); } finally { setGidiyor(false); } };
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Deneme verisi üret" alt={`${tablo} tablosunun sütunlarına uygun, gerçekçi Türkçe kayıtlar`}
      alt2={<><span className="flex-1" /><button type="button" onClick={kapat} className="h-10 rounded-full px-4 text-[13px] text-white/65 hover:bg-white/[0.06]">{sonuc ? "Kapat" : "Vazgeç"}</button><button type="button" onClick={gonder} disabled={gidiyor || !n} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13px] font-semibold text-black disabled:opacity-40">{gidiyor ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}{sonuc ? "Yeniden üret" : `${n || ""} kayıt üret`}</button></>}>
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-[12.5px] text-white/55">Kaç kayıt</p>
          <div className="flex flex-wrap items-center gap-2">
            <Secici id="vt-uret-adet" deger={adet} set={setAdet} l={[{ id: "10", ad: "10" }, { id: "25", ad: "25" }, { id: "50", ad: "50" }, { id: "ozel", ad: "Özel" }]} />
            {adet === "ozel" && <input autoFocus type="number" min={1} max={50} value={ozel} onChange={(e) => setOzel(e.target.value)} placeholder="1 ile 50 arası" className={cn(alanSinif, "h-9 w-[140px] text-[13px]")} />}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[12.5px] text-white/55">Yönerge, isteğe bağlı</p>
          <textarea value={yonerge} onChange={(e) => setYonerge(e.target.value)} rows={3} placeholder="Kadıköy ve Moda'daki müşteriler, hafta sonu akşamları ağırlıklı" className={cn(alanSinif, "resize-y py-2.5 text-[13.5px]")} />
        </div>
        <p className="text-[12px] leading-relaxed text-white/45">Kayıtlar tablonun kurallarına ve sütun türlerine göre doğrulanır; uymayanlar eklenmez. Okuma kuralı açıksa yayındaki sitede görünür; istemezsen seçip silebilirsin.</p>
        {hata && <p className="rounded-[14px] bg-rose-500/[0.08] px-3.5 py-2.5 text-[12.5px] text-rose-200 ring-1 ring-inset ring-rose-400/20">{hata}</p>}
        {sonuc && (
          <div className="space-y-2">
            <p className="rounded-[14px] bg-[#55d6fd]/[0.1] px-3.5 py-2.5 text-[13px] text-[#a8ecff] ring-1 ring-inset ring-[#55d6fd]/20">{sonuc.eklendi} kayıt eklendi.</p>
            {sonuc.hatalar.length > 0 && <div className="rounded-[14px] bg-amber-400/[0.07] px-3.5 py-2.5 text-[12.5px] text-amber-100/80 ring-1 ring-inset ring-amber-300/15">{sonuc.hatalar.slice(0, 6).map((h) => <p key={h}>{h}</p>)}</div>}
          </div>
        )}
      </div>
    </YanPanel>
  );
}

/* ── Yedekler paneli ── */
type YedekBilgi = { ad: string; zaman: number; boyut: number; tur: "otomatik" | "elle" | "geri-yukleme-oncesi" | "yayin-oncesi" };
function YedekPaneli({ acik, projeId, kapat, yenile }: { acik: boolean; projeId: string; kapat: () => void; yenile: () => void }) {
  const [l, setL] = useState<YedekBilgi[] | null>(null); const [isleniyor, setIsleniyor] = useState<string | null>(null); const [onay, setOnay] = useState<string | null>(null); const [hata, setHata] = useState("");
  useEffect(() => { if (acik) { setOnay(null); setHata(""); api<{ yedekler: YedekBilgi[] }>(`/api/build/veritabani/${projeId}/yedek`).then((v) => setL(v.yedekler)).catch(() => setL([])); } }, [acik, projeId]);
  const islem = async (anahtar: string, govde: Record<string, unknown>) => {
    setIsleniyor(anahtar); setHata("");
    try { const v = await api<{ yedekler: YedekBilgi[] }>(`/api/build/veritabani/${projeId}/yedek`, { govde }); setL(v.yedekler); setOnay(null); yenile(); }
    catch (e) { setHata((e as Error).message); } finally { setIsleniyor(null); }
  };
  const TUR = { otomatik: "Günlük otomatik", elle: "Elle", "geri-yukleme-oncesi": "Geri yüklemeden önce", "yayin-oncesi": "Test aktarımından önce" } as const;
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Yedekler" alt="Günde bir otomatik yedek alınır; son 14 yedek saklanır"
      alt2={<><span className="flex-1" /><button type="button" disabled={isleniyor === "yeni"} onClick={() => islem("yeni", {})} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13px] font-semibold text-black disabled:opacity-50">{isleniyor === "yeni" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}Şimdi yedekle</button></>}>
      {hata && <p className="mb-3 text-[12.5px] text-rose-200">{hata}</p>}
      {l === null ? <div className="flex h-32 items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-white/40" /></div>
        : !l.length ? <p className="py-8 text-center text-[13px] text-white/50">Henüz yedek yok. İlk değişiklikte otomatik yedek alınır; istersen şimdi yedekle.</p>
          : (
            <div className="space-y-2">
              {l.map((y) => (
                <div key={y.ad} className={cn("rounded-[16px] bg-white/[0.03] p-3 ring-1 ring-inset", onay === y.ad ? "ring-white/60" : "ring-white/[0.07]")}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.06] text-white/60"><Archive className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-[13.5px] text-white">{new Date(y.zaman).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</span><span className="block text-[12px] text-white/45">{TUR[y.tur]} · {(y.boyut / 1024).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} KB</span></span>
                    <button type="button" onClick={() => setOnay(onay === y.ad ? null : y.ad)} className="inline-flex h-8 shrink-0 items-center rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white/85 hover:bg-white/[0.12]">Geri yükle</button>
                  </div>
                  {onay === y.ad && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
                      <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-white/60">Tüm tablolar bu ana döner. Şu anki durum önce yedeklenir, istersen geri alabilirsin.</p>
                      <button type="button" disabled={!!isleniyor} onClick={() => islem(y.ad, { geriYukle: y.ad })} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[12.5px] font-semibold text-black disabled:opacity-50">{isleniyor === y.ad && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Evet, geri yükle</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
    </YanPanel>
  );
}

/* ── Test'i Canlı'ya aktarma paneli ── */
type TabloFarki = { ad: string; durum: "yeni" | "degisti" | "ayni" | "yalnizCanli"; sema: boolean; kural: boolean; testAdet: number; canliAdet: number; ortamaOzgu: boolean };
function AktarPaneli({ acik, kok, kapat, bitti }: { acik: boolean; kok: string; kapat: () => void; bitti: (a: OrtamAyari) => void }) {
  const [fark, setFark] = useState<TabloFarki[] | null>(null);
  const [veri, setVeri] = useState(false);
  const [isleniyor, setIsleniyor] = useState<"" | "aktar" | "kapat">("");
  const [sonuc, setSonuc] = useState<string>("");
  const [hata, setHata] = useState("");
  useEffect(() => { if (!acik) return; setSonuc(""); setHata(""); setVeri(false); setFark(null); api<{ fark: TabloFarki[] }>(kok, { govde: { islem: "fark" } }).then((v) => setFark(v.fark)).catch((e) => setHata((e as Error).message)); }, [acik, kok]);
  const DURUM_AD = { yeni: { ad: "Yeni tablo", s: "bg-[#55d6fd]/[0.12] text-[#8be6ff]" }, degisti: { ad: "Değişti", s: "bg-amber-400/[0.12] text-amber-200" }, ayni: { ad: "Aynı", s: "bg-white/[0.07] text-white/55" }, yalnizCanli: { ad: "Yalnız Canlı'da", s: "bg-white/[0.07] text-white/55" } } as const;
  const aktar = async () => {
    setIsleniyor("aktar"); setHata("");
    try { const v = await api<{ tablolar: string[]; veri: boolean; yedek: string | null; ortamAyari: OrtamAyari }>(kok, { govde: { islem: "aktar", veri } }); setSonuc(`${v.tablolar.length} tablonun şeması ve kuralları${v.veri ? " kayıtlarıyla birlikte" : ""} Canlı'ya aktarıldı.${v.yedek ? " Önce Canlı yedeklendi." : ""}`); bitti(v.ortamAyari); setFark(await api<{ fark: TabloFarki[] }>(kok, { govde: { islem: "fark" } }).then((x) => x.fark)); }
    catch (e) { setHata((e as Error).message); } finally { setIsleniyor(""); }
  };
  const kapatOrtam = async () => { setIsleniyor("kapat"); try { const v = await api<{ ortamAyari: OrtamAyari }>(kok, { govde: { islem: "testKapat" } }); bitti(v.ortamAyari); kapat(); } catch (e) { setHata((e as Error).message); } finally { setIsleniyor(""); } };
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="Test'i Canlı'ya aktar" alt="Yayındaki site Canlı'yı kullanır; aktarmadan önce Canlı otomatik yedeklenir"
      alt2={<><button type="button" disabled={!!isleniyor} onClick={kapatOrtam} className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] text-white/60 hover:bg-white/[0.06] hover:text-white">{isleniyor === "kapat" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Test ortamını kapat</button><span className="flex-1" /><button type="button" disabled={!!isleniyor || !fark} onClick={aktar} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13px] font-semibold text-black disabled:opacity-50">{isleniyor === "aktar" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpFromLine className="h-3.5 w-3.5" />}Canlı&apos;ya aktar</button></>}>
      {hata && <p className="mb-3 text-[12.5px] text-rose-200">{hata}</p>}
      {sonuc && <p className="mb-3 rounded-[12px] bg-[#55d6fd]/[0.08] px-3 py-2 text-[12.5px] text-[#bdf1ff] ring-1 ring-inset ring-[#55d6fd]/15">{sonuc}</p>}
      <div className="space-y-4">
        <div className="rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.07]">
          {fark === null ? <div className="flex h-24 items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-white/40" /></div> : !fark.length ? <p className="p-4 text-[13px] text-white/50">İki ortamda da tablo yok.</p> : (
            <div className="divide-y divide-white/[0.05]">{fark.map((t) => (
              <div key={t.ad} className="flex items-center gap-3 px-3.5 py-2.5">
                <Database className="h-3.5 w-3.5 shrink-0 text-white/40" />
                <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white">{t.ad}</span><span className="block text-[11.5px] text-white/45">Test {t.testAdet.toLocaleString("tr-TR")} kayıt, Canlı {t.canliAdet.toLocaleString("tr-TR")} kayıt{t.durum === "degisti" ? ` · ${[t.sema && "şema", t.kural && "kurallar"].filter(Boolean).join(" ve ") || "açıklama"} farklı` : ""}{t.ortamaOzgu ? " · kayıtlar taşınmaz" : ""}</span></span>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", DURUM_AD[t.durum].s)}>{DURUM_AD[t.durum].ad}</span>
              </div>
            ))}</div>
          )}
        </div>
        <label className="flex items-start gap-3 rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]">
          <span className="min-w-0 flex-1"><span className="block text-[13.5px] text-white">Kayıtları da aktar</span><span className="mt-0.5 block text-[12px] leading-relaxed text-white/50">Canlı&apos;daki kayıtlar Test&apos;tekilerle değişir. Siparişler tablosu hiç taşınmaz; Canlı&apos;da olup Test&apos;te olmayan tablolar silinmez.</span></span>
          <Anahtar acik={veri} set={setVeri} etiket="Kayıtları da aktar" />
        </label>
        <p className="text-[12px] leading-relaxed text-white/45">Bulut konsolundan son sürümü yayınladığında şema ve kurallar kendiliğinden aktarılır; kayıtlar yalnız burada istersen aktarılır.</p>
      </div>
    </YanPanel>
  );
}

/* ── İçe aktarma paneli ── */
function IceAktarPaneli({ acik, tablo, sutunlar, kapat, aktar }: { acik: boolean; tablo: string; sutunlar: Sutun[]; kapat: () => void; aktar: (l: Record<string, unknown>[], anahtar?: string) => Promise<{ eklendi: number; guncellendi?: number; hatalar: string[]; hataSayisi: number }> }) {
  const [satirlar, setSatirlar] = useState<string[][] | null>(null);
  const [anahtar, setAnahtar] = useState("");
  const [dosyaAdi, setDosyaAdi] = useState("");
  const [sonuc, setSonuc] = useState<{ eklendi: number; guncellendi?: number; hatalar: string[]; hataSayisi: number } | null>(null);
  const [gidiyor, setGidiyor] = useState(false); const [hata, setHata] = useState("");
  const giris = useRef<HTMLInputElement>(null);
  useEffect(() => { if (acik) { setSatirlar(null); setSonuc(null); setDosyaAdi(""); setHata(""); setAnahtar(""); } }, [acik]);
  const oku = async (f: File) => {
    setDosyaAdi(f.name); setSonuc(null); setHata("");
    const t = await f.text();
    if (/\.json$/i.test(f.name)) {
      try { const j = JSON.parse(t); const l = Array.isArray(j) ? j : [j]; const b = [...new Set(l.flatMap((x) => Object.keys(x ?? {})))].filter((x) => !["olusturma", "guncelleme"].includes(x)); setSatirlar([b, ...l.map((x) => b.map((a) => goster(x?.[a])))]); }
      catch { setHata("JSON dosyası okunamadı."); }
      return;
    }
    const l = csvCoz(t);
    if (l.length < 2) return setHata("Dosyada başlık satırı ve en az bir kayıt olmalı.");
    setSatirlar(l);
  };
  const basliklar = satirlar?.[0]?.map((b) => b.trim()) ?? [];
  const sema = new Map(sutunlar.map((s) => [s.ad, s]));
  const gonder = async () => {
    if (!satirlar) return;
    const l = satirlar.slice(1, 1001).map((r) => Object.fromEntries(basliklar.map((b, i) => [b, r[i] ?? ""]).filter(([b]) => b && !["olusturma", "guncelleme"].includes(b as string) && (b !== "id" || anahtar === "id")).map(([b, v]) => [b, sema.has(b as string) && !sema.get(b as string)!.cikarim ? (v === "" ? null : v) : serbestCoz(String(v))])));
    setGidiyor(true);
    try { setSonuc(await aktar(l, anahtar || undefined)); } catch (e) { setHata((e as Error).message); } finally { setGidiyor(false); }
  };
  return (
    <YanPanel acik={acik} kapat={kapat} baslik="İçe aktar" alt={`CSV ya da JSON dosyasındaki kayıtlar ${tablo} tablosuna eklenir (en fazla 1000)`}
      alt2={<><span className="flex-1" /><button type="button" onClick={kapat} className="h-10 rounded-full px-4 text-[13px] text-white/65 hover:bg-white/[0.06]">{sonuc ? "Kapat" : "Vazgeç"}</button>{!sonuc && <button type="button" onClick={gonder} disabled={!satirlar || gidiyor} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13px] font-semibold text-black disabled:opacity-40">{gidiyor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{satirlar ? `${Math.min(1000, satirlar.length - 1)} kaydı aktar` : "Aktar"}</button>}</>}>
      <input ref={giris} type="file" accept=".csv,.tsv,.txt,.json,text/csv,application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) oku(f); e.target.value = ""; }} />
      <button type="button" onClick={() => giris.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) oku(f); }}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-[18px] px-4 py-8 text-center border border-dashed border-white/[0.16] transition-colors hover:bg-white/[0.03]">
        <Upload className="h-5 w-5 text-white/50" />
        <span className="text-[13.5px] text-white/80">{dosyaAdi || "Dosyayı sürükle ya da seç"}</span>
        <span className="text-[12px] text-white/40">İlk satır sütun adları olmalı. Virgül, noktalı virgül ve sekme ayraçları tanınır.</span>
      </button>
      {hata && <p className="mt-3 text-[12.5px] text-rose-200">{hata}</p>}
      {satirlar && !sonuc && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {basliklar.map((b) => { const s = sema.get(b); return <span key={b} className={cn("inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px]", s && !s.cikarim ? "bg-[#55d6fd]/[0.12] text-[#a8ecff]" : "bg-white/[0.06] text-white/65")}>{s ? <TurSimge tur={s.tur} className="h-3 w-3" /> : <Plus className="h-3 w-3" />}{b}</span>; })}
          </div>
          <p className="text-[12px] leading-relaxed text-white/45">Mavi sütunlar tablodaki türlü sütunlarla eşleşti ve türüne çevrilir. Diğerleri yeni alan olarak eklenir.</p>
          <div className="flex flex-wrap items-center gap-2 rounded-[14px] bg-white/[0.03] px-3 py-2.5 ring-1 ring-inset ring-white/[0.07]">
            <span className="min-w-[160px] flex-1 text-[12.5px] text-white/70">Eşleşen kaydı güncelle<span className="block text-[11.5px] text-white/40">Seçtiğin alan aynı olan kayıt güncellenir, yoksa eklenir</span></span>
            <div className="w-[200px]"><AcilirSecim deger={anahtar} set={setAnahtar} l={[{ id: "", ad: "Hepsini yeni ekle" }, ...basliklar.filter((b) => b).map((b) => ({ id: b, ad: b, alt: b === "id" ? "Kayıt kimliği" : sema.get(b) ? TUR_BILGI[sema.get(b)!.tur].ad : "Alan" }))]} /></div>
          </div>
          <div className="overflow-x-auto rounded-[14px] ring-1 ring-inset ring-white/[0.08] [scrollbar-width:thin]">
            <table className="min-w-full text-[12px]">
              <thead><tr>{basliklar.map((b) => <th key={b} className="border-b border-white/[0.07] px-2.5 py-1.5 text-left font-mono font-medium text-white/55">{b}</th>)}</tr></thead>
              <tbody>{satirlar.slice(1, 6).map((r, i) => <tr key={i}>{basliklar.map((_, j) => <td key={j} className="max-w-[160px] truncate border-b border-white/[0.04] px-2.5 py-1.5 text-white/75">{r[j]}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <p className="text-[12px] text-white/40">İlk 5 kayıt gösteriliyor, toplam {satirlar.length - 1}.</p>
        </div>
      )}
      {sonuc && (
        <div className="mt-4 space-y-2">
          <p className="rounded-[14px] bg-[#55d6fd]/[0.1] px-3.5 py-2.5 text-[13px] text-[#a8ecff] ring-1 ring-inset ring-[#55d6fd]/20">{sonuc.eklendi} kayıt eklendi{sonuc.guncellendi ? `, ${sonuc.guncellendi} kayıt güncellendi` : ""}.</p>
          {sonuc.hataSayisi > 0 && <div className="rounded-[14px] bg-amber-400/[0.07] px-3.5 py-2.5 text-[12.5px] text-amber-100/85 ring-1 ring-inset ring-amber-300/15"><p className="font-medium">{sonuc.hataSayisi} kayıt atlandı</p>{sonuc.hatalar.map((h) => <p key={h} className="mt-0.5 text-amber-100/65">{h}</p>)}</div>}
        </div>
      )}
    </YanPanel>
  );
}

/* ── Tablo geçmişi: son değişiklikler ve silinen kayıtları geri yükleme ── */
function TabloGecmisi({ acik, kapat, tablo, adres, geriYukle }: { acik: boolean; kapat: () => void; tablo: string; adres: string; geriYukle: (kayit: Record<string, unknown>) => Promise<void> }) {
  const [l, setL] = useState<GecmisSatir[] | null>(null);
  const [suz, setSuz] = useState<"hepsi" | "sil">("hepsi");
  const [yapilan, setYapilan] = useState<Set<string>>(new Set());
  const [hata, setHata] = useState("");
  useEffect(() => { if (acik) { setL(null); setHata(""); api<{ gecmis: GecmisSatir[] }>(adres).then((x) => setL(x.gecmis)).catch(() => setL([])); } }, [acik, adres]);
  const gorunen = (l ?? []).filter((g) => suz === "hepsi" || g.islem === "sil");
  return (
    <YanPanel acik={acik} kapat={kapat} baslik={`${tablo} geçmişi`} alt="Son 30 günün ekleme, güncelleme ve silmeleri; kim yaptı">
      <div className="mb-3"><Secici id="tg-suz" kucuk deger={suz} set={setSuz} l={[{ id: "hepsi", ad: "Hepsi" }, { id: "sil", ad: "Silinenler" }]} /></div>
      {hata && <p className="mb-2 text-[12.5px] text-rose-200">{hata}</p>}
      {l === null ? <div className="flex h-24 items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-white/40" /></div>
        : !gorunen.length ? <p className="text-[13px] text-white/50">{suz === "sil" ? "Silinen kayıt yok." : "Henüz değişiklik yok."}</p>
        : <div className="-mx-5 divide-y divide-white/[0.05]">{gorunen.map((g, i) => {
          const f = g.islem === "guncelle" ? farklar(g.onceki, g.sonraki) : [];
          const ozet = g.islem === "sil" ? g.onceki : g.sonraki;
          const ilkAlan = ozet ? Object.entries(ozet).find(([a, v]) => !SISTEM_ALAN.has(a) && typeof v === "string") : undefined;
          const anahtar = `${g.kayitId}-${g.z}`;
          return (
            <div key={i} className="px-5 py-2.5">
              <p className="flex items-center gap-2 text-[12.5px]"><span className={cn("h-2 w-2 shrink-0 rounded-full", g.islem === "sil" ? "bg-rose-400" : g.islem === "guncelle" ? "bg-amber-300" : "bg-emerald-400")} /><span className="font-medium text-white">{ISLEM_AD[g.islem]}</span><span className="min-w-0 truncate text-white/55">{ilkAlan ? kisa(ilkAlan[1]) : g.kayitId}</span><span className="flex-1" /><span className="shrink-0 text-[11.5px] text-white/40">{KIM_AD(g.kim)} · {tarihYaz(g.z)}</span></p>
              {f.slice(0, 4).map((x) => <p key={x.alan} className="ml-4 mt-0.5 text-[12px] text-white/55"><span className="text-white/75">{x.alan}</span>: <span className="text-rose-200/70 line-through">{kisa(x.eski)}</span> <span className="text-emerald-200/80">{kisa(x.yeni)}</span></p>)}
              {g.islem === "sil" && g.onceki && <div className="ml-4 mt-1.5">{yapilan.has(anahtar) ? <span className="text-[12px] text-emerald-200">Geri yüklendi</span> : <button type="button" onClick={async () => { setHata(""); try { await geriYukle(g.onceki!); setYapilan((s) => new Set(s).add(anahtar)); } catch (e) { setHata((e as Error).message); } }} className="rounded-full bg-white/[0.08] px-3 py-1 text-[12px] text-white hover:bg-white/[0.13]">Geri yükle</button>}</div>}
            </div>
          );
        })}</div>}
    </YanPanel>
  );
}

/* ── Yapı sekmesi ── */
function YapiSekmesi({ tablo, sutunlar, tablolar, kok, yol = (y) => y, yenile, silOnay, setSilOnay, sil, bosalt }: { tablo: KolOzet; sutunlar: Sutun[]; tablolar: string[]; kok: string; yol?: (y: string) => string; yenile: (yeniAd?: string) => Promise<void>; silOnay: string | null; setSilOnay: (v: "tablo" | "bosalt" | null) => void; sil: () => Promise<void>; bosalt: () => Promise<void> }) {
  const [l, setL] = useState<Sutun[]>([]);
  const [ad, setAd] = useState(tablo.ad); const [aciklama, setAciklama] = useState(tablo.aciklama);
  const [durum, setDurum] = useState<"" | "kaydediliyor" | "kaydedildi">(""); const [hata, setHata] = useState("");
  useEffect(() => { setL(sutunlar.map(({ cikarim: _c, ...s }) => s)); setAd(tablo.ad); setAciklama(tablo.aciklama); }, [tablo.ad, tablo.aciklama, sutunlar]);
  const kaydet = async () => {
    setDurum("kaydediliyor"); setHata("");
    try {
      const temiz = l.filter((s) => s.ad.trim());
      if (new Set(temiz.map((s) => s.ad)).size !== temiz.length) throw new Error("Aynı adda iki sütun var.");
      // Adı değişen sütunlar: eski sıradaki ad ile karşılaştır, kayıtlarda da yeniden adlandır.
      const eski = sutunlar.filter((s) => !s.cikarim);
      for (const [i, s] of temiz.entries()) { const e = eski[i]; if (e && e.ad !== s.ad && !temiz.some((x) => x.ad === e.ad)) await api(yol(`${kok}/${encodeURIComponent(tablo.ad)}`), { method: "PATCH", govde: { sutunIslem: { tur: "yenidenAdlandir", eski: e.ad, yeni: s.ad } } }); }
      await api(yol(`${kok}/${encodeURIComponent(tablo.ad)}`), { method: "PATCH", govde: { sema: temiz, aciklama, ...(ad !== tablo.ad ? { yeniAd: ad } : {}) } });
      await yenile(ad !== tablo.ad ? ad : undefined);
      setDurum("kaydedildi"); setTimeout(() => setDurum(""), 1800);
    } catch (e) { setHata((e as Error).message); setDurum(""); }
  };
  const cikarimVar = sutunlar.some((s) => s.cikarim);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
      <div className="mx-auto max-w-[760px] space-y-6 px-4 py-5">
        {cikarimVar && <p className="rounded-[14px] bg-[#55d6fd]/[0.07] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#bdf1ff] ring-1 ring-inset ring-[#55d6fd]/15">Bu tablodaki bazı alanların türü henüz tanımlı değil; türlerini kayıtlardan tahmin ettik. Kaydedersen bundan sonra eklenen kayıtlar bu türlere göre doğrulanır.</p>}
        <section className="space-y-2">
          <p className="text-[13px] font-semibold text-white">Tablo</p>
          <div className="grid gap-2 sm:grid-cols-[220px_1fr]">
            <input value={ad} onChange={(e) => setAd(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))} className={cn(alanSinif, "h-11")} />
            <input value={aciklama} onChange={(e) => setAciklama(e.target.value)} placeholder="Açıklama" className={cn(alanSinif, "h-11 text-[13.5px]")} />
          </div>
          {ad !== tablo.ad && <p className="text-[12px] text-amber-200/80">Tabloyu yeniden adlandırırsan sitedeki kodda da adı değiştirmen gerekir; ajana &quot;{tablo.ad} tablosunun adı artık {ad}&quot; demen yeter.</p>}
        </section>
        <section>
          <p className="mb-2 text-[13px] font-semibold text-white">Sütunlar</p>
          <SutunDuzenleyici l={l} set={setL} tablolar={tablolar.filter((t) => t !== tablo.ad)} />
        </section>
        <div className="flex items-center gap-2">
          {hata && <span className="text-[12.5px] text-rose-200">{hata}</span>}
          <span className="flex-1" />
          <button type="button" onClick={kaydet} disabled={durum === "kaydediliyor"} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13px] font-semibold text-black disabled:opacity-50">{durum === "kaydediliyor" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{durum === "kaydedildi" ? "Kaydedildi" : "Yapıyı kaydet"}</button>
        </div>
        <section className="rounded-[18px] p-4 ring-1 ring-inset ring-rose-400/15">
          <p className="text-[13px] font-semibold text-rose-100">Tehlikeli işlemler</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {silOnay === "bosalt" ? <button type="button" onClick={bosalt} className="h-9 rounded-full bg-rose-500/20 px-4 text-[12.5px] font-medium text-rose-100">Evet, {tablo.adet} kaydın hepsini sil</button>
              : <button type="button" onClick={() => setSilOnay("bosalt")} className="h-9 rounded-full bg-white/[0.06] px-4 text-[12.5px] text-white/80 hover:bg-rose-500/15 hover:text-rose-200">Tüm kayıtları sil</button>}
            {silOnay === "tablo" ? <button type="button" onClick={sil} className="h-9 rounded-full bg-rose-500/20 px-4 text-[12.5px] font-medium text-rose-100">Evet, {tablo.ad} tablosunu sil</button>
              : <button type="button" onClick={() => setSilOnay("tablo")} className="h-9 rounded-full bg-white/[0.06] px-4 text-[12.5px] text-white/80 hover:bg-rose-500/15 hover:text-rose-200">Tabloyu sil</button>}
            {silOnay && <button type="button" onClick={() => setSilOnay(null)} className="h-9 rounded-full px-3 text-[12.5px] text-white/55 hover:bg-white/[0.06]">Vazgeç</button>}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Kurallar sekmesi ── */
function KurallarSekmesi({ tablo, kaydet }: { tablo: KolOzet; kaydet: (k: Kurallar) => Promise<void> }) {
  const [k, setK] = useState(tablo.kurallar);
  const [durum, setDurum] = useState("");
  useEffect(() => setK(tablo.kurallar), [tablo.kurallar]);
  const degisti = k.okuma !== tablo.kurallar.okuma || k.ekleme !== tablo.kurallar.ekleme || k.duzenleme !== tablo.kurallar.duzenleme;
  const uyarilar = [
    k.duzenleme === "herkes" && "Herkes her kaydı değiştirip silebilir. Ortak bir yapılacaklar listesi değilse bunu kapat.",
    k.okuma === "herkes" && /uye|musteri|siparis|rezervasyon|basvuru|iletisim|mesaj/i.test(tablo.ad) && "Bu tablo kişisel bilgi tutuyor gibi görünüyor ama herkes okuyabiliyor.",
    k.okuma === "sahibi" && k.ekleme === "herkes" && "Kendi kaydını görme kuralı üye girişi ister; giriş yapmadan eklenen kayıtları kimse göremez.",
  ].filter(Boolean) as string[];
  return (
    <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
      <div className="mx-auto max-w-[760px] space-y-5 px-4 py-5">
        <div className="flex items-start gap-3 rounded-[18px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.07]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#55d6fd]/[0.12] text-[#8be6ff]"><Shield className="h-4 w-4" /></span>
          <p className="text-[13px] leading-relaxed text-white/65">Kurallar yalnız sitedeki ziyaretçiler ve üyeler için geçerli. Sen panelden, ajan ve sunucu fonksiyonların her zaman her kayda erişir. Üye kuralları için sitede üyelik açık olmalı.</p>
        </div>
        <KuralSecimi k={k} set={setK} />
        {uyarilar.map((u) => <p key={u} className="rounded-[14px] bg-amber-400/[0.07] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-amber-100/85 ring-1 ring-inset ring-amber-300/15">{u}</p>)}
        <div className="flex justify-end">
          <button type="button" disabled={!degisti || durum === "k"} onClick={async () => { setDurum("k"); await kaydet(k).catch(() => {}); setDurum("ok"); setTimeout(() => setDurum(""), 1600); }} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-[13px] font-semibold text-black disabled:opacity-40">{durum === "k" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{durum === "ok" ? "Kaydedildi" : "Kuralları kaydet"}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Kullanım sekmesi ── */
function KullanimSekmesi({ tablo, sutunlar, kok }: { tablo: KolOzet; sutunlar: Sutun[]; kok: string }) {
  const ornek = Object.fromEntries(sutunlar.slice(0, 4).map((s) => [s.ad, s.tur === "sayi" ? 1 : s.tur === "mantiksal" ? true : s.tur === "tarih" ? "2026-11-05T10:00" : s.tur === "secim" ? s.secenekler?.[0] ?? "" : s.tur === "eposta" ? "ad@ornek.com" : s.tur === "gorsel" || s.tur === "url" ? "https://ornek.com/a.jpg" : "…"]));
  const sayiSutun = sutunlar.find((s) => s.tur === "sayi")?.ad;
  const o = JSON.stringify(ornek);
  const [kaynak, setKaynak] = useState<"sayfa" | "fonksiyon" | "rest">("sayfa");
  const adres = typeof window !== "undefined" ? `${location.origin}${kok}/${tablo.ad}` : `${kok}/${tablo.ad}`;
  const kod = kaynak === "sayfa"
    ? `// Sitede, herhangi bir sayfanın betiğinde (kurulum gerekmez)
const kayitlar = await vayra.veri.liste("${tablo.ad}", { sirala: "olusturma", yon: "azalan", sinir: 20 });
${sayiSutun ? `const suzulmus = await vayra.veri.liste("${tablo.ad}", { suzgec: [{ alan: "${sayiSutun}", op: "buyuk", deger: 0 }] });\n` : ""}const yeni = await vayra.veri.ekle("${tablo.ad}", ${o});
await vayra.veri.guncelle("${tablo.ad}", yeni.id, ${JSON.stringify(Object.fromEntries(Object.entries(ornek).slice(0, 1)))});
await vayra.veri.sil("${tablo.ad}", yeni.id);`
    : kaynak === "fonksiyon"
      ? `// api/${tablo.ad}.js — sunucuda çalışır, kurallar uygulanmaz
export default async function (istek, vayra) {
  if (istek.yontem === "POST") return await vayra.veri.ekle("${tablo.ad}", istek.govde);
  return await vayra.veri.liste("${tablo.ad}", { sinir: 50 });
}`
      : `# Okuma (kurallara tabidir)
curl "${adres}?sinir=20&sirala=olusturma&yon=azalan"

# Ekleme
curl -X POST "${adres}" \\
  -H "Content-Type: application/json" \\
  -d '{"kayit": ${o}}'`;
  return (
    <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
      <div className="mx-auto max-w-[820px] space-y-4 px-4 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-white"><Code2 className="h-4 w-4 text-white/50" />Koddan kullan</p>
          <span className="flex-1" />
          <Secici id="vt-kaynak" kucuk deger={kaynak} set={setKaynak} l={[{ id: "sayfa", ad: "Sayfada" }, { id: "fonksiyon", ad: "Sunucu fonksiyonunda" }, { id: "rest", ad: "REST" }]} />
        </div>
        <KodKutusu kod={kod} />
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ["Süzgeç türleri", "eşittir, eşit değil, büyüktür, en az, küçüktür, en çok, içerir, ile başlar, boş, dolu"],
            ["Sıralama", "sirala ile herhangi bir sütun, yon artan ya da azalan"],
            ["Sınırlar", "Tablo başına 5000 kayıt, kayıt başına 20 KB, sorgu başına 500 kayıt"],
            ["Ajanla", "\"Bu tabloyu listeleyen bir sayfa yap\" de; ajan bu kodu kendisi yazar"],
          ].map(([a, b]) => <div key={a} className="rounded-[16px] bg-white/[0.03] p-3.5 ring-1 ring-inset ring-white/[0.07]"><p className="text-[12.5px] font-semibold text-white">{a}</p><p className="mt-1 text-[12.5px] leading-relaxed text-white/55">{b}</p></div>)}
        </div>
      </div>
    </div>
  );
}
