"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, ArrowLeft, AudioLines, BookMarked, Brain, CalendarClock, ChevronRight, FileText, GraduationCap, Hand, Headphones, Layers3, Loader2, MessageSquare, PanelRight, Paperclip, Plug, Quote, Settings2, ShieldCheck, Sparkles, Telescope, Users, X,
} from "lucide-react";
import { api } from "@/lib/build/istemci";
import { BICIM_ADI } from "@/lib/build/belgeTipler";
import { baglamSiniri, tokenTahmini } from "@/lib/build/sohbetBaglam";
import { BaglamHalkasi } from "./Baglam";
import { BicimSimge } from "./DosyaKarti";
import { Komut } from "@/components/build/Komut";
import { SaglayiciLogo } from "@/components/build/ModelSecici";
import { AjanSimge } from "@/components/build/ajanlar/ortak";
import { KrediJeton } from "@/components/ui/KrediHap";
import { sahipAnahtari } from "@/lib/build/istemci";
import { modelBul } from "@/lib/build/modeller";
import { useAuth } from "@/store/useAuth";
import { cn } from "@/lib/utils";
import { Acilir, MenuAnahtar, MenuSatir, boyutYaz, sayi, useAcilir, Anahtar } from "./ortak";
import type { AjanBilgisi, Baglam, Ek, Sohbet, TurIstegi } from "./tipler";

export type Efor = "low" | "medium" | "high" | "max";
export const VAYRA_ARACLARI = [
  { id: "gorsel_uret", ad: "Görsel üret", alt: "Ürün fotoğrafı, illüstrasyon, logo fikri", gorsel: "/gercek/arac/gorsel-ilham-portre.webp", komut: "gorsel" },
  { id: "video_uret", ad: "Video üret", alt: "5 ya da 10 saniyelik kısa video", gorsel: "/gercek/arac/video-ilham-sinematik.webp", komut: "video" },
  { id: "muzik_uret", ad: "Müzik üret", alt: "Şarkı ya da fon müziği", gorsel: "/gercek/muzik/ms-neon.webp", komut: "muzik" },
  { id: "ses_uret", ad: "Seslendir", alt: "Metni doğal sesle okut", gorsel: "/gercek/arac/ses-ilham-dalga.webp", komut: "ses" },
  { id: "model_3d_uret", ad: "3D model üret", alt: "Metinden 3D nesne", gorsel: "/gercek/arac/3d-ilham-render.webp", komut: "3d" },
];
export type Bahsetme = { tur: "ajan" | "yetenek" | "baglanti" | "sohbet"; id: string; ad: string; simge?: string };
export type Kip = { arastirma?: boolean; arac?: string; kurul?: { modeller: string[]; sentez: string }; tuval?: boolean };
export type KayitliIstemOzeti = { id: string; ad: string; baslik: string; metin: string };
type Yukleme = { id: string; ad: string; boyut: number; hata?: string; onizleme?: string };

/** Görseli 2000 px'e küçültür (büyükse); küçük PNG/JPEG/WebP/GIF olduğu gibi gider. */
async function gorselHazirla(f: File): Promise<Blob> {
  if (f.size < 3_500_000 && /^image\/(png|jpeg|webp|gif)$/.test(f.type)) return f;
  const url = URL.createObjectURL(f);
  try {
    const img = await new Promise<HTMLImageElement>((ok, red) => { const i = new Image(); i.onload = () => ok(i); i.onerror = red; i.src = url; });
    const o = Math.min(1, 2000 / Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = Math.round(img.width * o); c.height = Math.round(img.height * o);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise<Blob>((ok) => c.toBlob((b) => ok(b ?? f), "image/jpeg", 0.88));
  } catch { return f; } finally { URL.revokeObjectURL(url); }
}

export async function ekYukle(f: File): Promise<Ek> {
  const fd = new FormData();
  const veri = f.type.startsWith("image/") ? await gorselHazirla(f) : f;
  fd.append("dosya", veri, f.name || "dosya");
  const r = await fetch("/api/build/sohbet/ek", { method: "POST", headers: { "x-build-sahip": sahipAnahtari() }, body: fd });
  const v = await r.json().catch(() => ({}));
  if (!r.ok || !v.ok) throw new Error(v.hata ?? "Dosya yüklenemedi.");
  return v.ek as Ek;
}

export function EkKarosu({ e, kaldir }: { e: Ek; kaldir?: () => void }) {
  if (e.tur === "ofis" && e.bicim) return (
    <span className="group relative flex h-12 max-w-[240px] shrink-0 items-center gap-2 rounded-[12px] bg-white/[0.07] pl-2 pr-3 ring-1 ring-inset ring-white/[0.08]">
      <BicimSimge bicim={e.bicim} boyut={32} />
      <span className="min-w-0"><span className="block truncate text-[12.5px] font-medium text-white">{e.ad}</span><span className="block truncate text-[11px] text-white/50">{BICIM_ADI[e.bicim]}{e.boyut ? ` · ${boyutYaz(e.boyut)}` : ""}</span></span>
      {kaldir && <button type="button" onClick={kaldir} aria-label="Eki kaldır" className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2a2b2f] text-white opacity-0 ring-1 ring-white/10 transition-opacity group-hover:opacity-100 max-sm:opacity-100"><X className="h-3 w-3" /></button>}
    </span>
  );
  if (e.tur === "gorsel") return (
    <span className="group relative h-12 w-12 shrink-0 overflow-hidden rounded-[12px] ring-1 ring-inset ring-white/10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={e.url} alt={e.ad} className="h-full w-full object-cover" />
      {kaldir && <button type="button" onClick={kaldir} aria-label="Eki kaldır" className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100"><X className="h-3 w-3" /></button>}
    </span>
  );
  return (
    <span className="group relative flex h-12 max-w-[220px] shrink-0 items-center gap-2 rounded-[12px] bg-white/[0.07] pl-2 pr-3 ring-1 ring-inset ring-white/[0.08]">
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]", e.tur === "pdf" ? "bg-rose-400/15 text-rose-200" : "bg-[#55d6fd]/[0.14] text-[#8be6ff]")}><FileText className="h-4 w-4" /></span>
      <span className="min-w-0"><span className="block truncate text-[12.5px] font-medium text-white">{e.ad}</span><span className="block text-[11px] text-white/50">{e.tur === "pdf" ? "PDF" : "Metin"}{e.boyut ? ` · ${boyutYaz(e.boyut)}` : ""}</span></span>
      {kaldir && <button type="button" onClick={kaldir} aria-label="Eki kaldır" className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2a2b2f] text-white opacity-0 ring-1 ring-white/10 transition-opacity group-hover:opacity-100 max-sm:opacity-100"><X className="h-3 w-3" /></button>}
    </span>
  );
}

function Cip({ ikon, children, kaldir, title }: { ikon: React.ReactNode; children: React.ReactNode; kaldir: () => void; title?: string }) {
  return (
    <motion.span layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} title={title}
      className="flex h-8 max-w-full items-center gap-1.5 rounded-full bg-[#55d6fd]/[0.12] pl-2.5 pr-1 text-[12.5px] font-medium text-[#8be6ff] ring-1 ring-inset ring-[#55d6fd]/20">
      {ikon}<span className="truncate">{children}</span>
      <button type="button" onClick={kaldir} aria-label="Kaldır" className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/10"><X className="h-3 w-3" /></button>
    </motion.span>
  );
}

type Oneri = { id: string; ad: string; alt: string; ikon: React.ReactNode; sec: () => void };

/**
 * Genel sohbetin komut kutusu (Komut'un üstüne): "+" menüsü (dosya, araştırma, Vayra araçları, model kurulu,
 * bu sohbetin bağlantıları ve yetenekleri, bellek), "/" komutları ve "@" bahsetmeleri, izin modu, kalan kredi.
 */
export function Besteci({
  deger, setDeger, gonder, model, setModel, efor, setEfor, modelBaglantilari, calisiyor, durdur, yer, dar, ajan, s, ayarDegis, baglam,
  kip, setKip, kurulAc, otomatikOdak, alinti, setAlinti, doluluk, istemAc, zamanla, sesKipi, dokumAc, istemler, sohbetId, ogrenme, ogrenmeDegis, disEk, disEkAlindi,
}: {
  deger: string; setDeger: (v: string) => void; gonder: (g: { metin: string; ekler: Ek[]; istek?: TurIstegi }) => void;
  model: string; setModel: (m: string) => void; efor: Efor; setEfor: (e: Efor) => void; modelBaglantilari?: Record<string, string | null>;
  calisiyor: boolean; durdur: () => void; yer: string; dar?: boolean; ajan?: AjanBilgisi | null;
  s?: Pick<Sohbet, "izinModu" | "baglantiSecimi" | "kapaliYetenekler" | "bellekKapali" | "gecici" | "ajanId">;
  ayarDegis: (p: Partial<Sohbet>) => void; baglam: Baglam | null;
  kip: Kip; setKip: (k: Kip) => void; kurulAc: () => void; otomatikOdak?: boolean;
  /** Seçime sor: yanıttan alıntılanan parça (gönderilince mesaja eklenir). */
  alinti?: string; setAlinti?: (v?: string) => void;
  /** Bağlam doluluğu (token) ve elle özetleme. */
  doluluk?: { token: number; ozetle?: () => Promise<string | null>; ozetleniyor?: boolean; mesajSayisi: number };
  /** v4: istem kitaplığı, zamanlanmış görev paneli, konuşma kipi, kayıtlı istemler (/ menüsü), öğrenme kipi. */
  istemAc?: () => void; zamanla?: (metin: string) => void; sesKipi?: () => void; istemler?: KayitliIstemOzeti[];
  /** v5: ses kaydı ve toplantı dökümü paneli. */
  dokumAc?: () => void;
  sohbetId?: string; ogrenme?: boolean; ogrenmeDegis?: (v: boolean) => void;
  /** Dışarıdan eklenen ek (ör. görseli referans olarak kullan). */
  disEk?: Ek | null; disEkAlindi?: () => void;
}) {
  const [ekler, setEkler] = useState<Ek[]>([]);
  const [yuklemeler, setYuklemeler] = useState<Yukleme[]>([]);
  const [bahsetmeler, setBahsetmeler] = useState<Bahsetme[]>([]);
  const [oneriSira, setOneriSira] = useState(0);
  const [gizli, setGizli] = useState<string | null>(null);
  const [sayfa, setSayfa] = useState<"ana" | "baglanti" | "yetenek" | "arac">("ana");
  const alan = useRef<HTMLTextAreaElement | null>(null);
  const dosya = useRef<HTMLInputElement>(null);
  const arti = useAcilir(340, "yukari");
  const izinMenu = useAcilir(300, "yukari");
  const krediler = useAuth((x) => x.kullanici?.krediler ?? 0);
  const genel = !ajan;
  const izinModu = s?.izinModu ?? "otomatik";

  useEffect(() => { if (!arti.acik) setSayfa("ana"); }, [arti.acik]);
  useEffect(() => { if (!disEk) return; setEkler((x) => (x.some((e) => e.url === disEk.url) ? x : [...x, disEk].slice(0, 10))); disEkAlindi?.(); setTimeout(() => alan.current?.focus(), 0); }, [disEk]); // eslint-disable-line react-hooks/exhaustive-deps
  // @ ile sohbet anma: son sohbetler ilk @ yazılınca bir kez yüklenir.
  const [sohbetler, setSohbetler] = useState<{ id: string; baslik: string; guncelleme: number }[] | null>(null);
  /** Uzun yapıştırılan metin (Claude gibi) metin eki olur; kutu kısa kalır. */
  const metinYapistir = (t: string) => {
    if (t.length < 4000 || ekler.length + yuklemeler.length >= 10) return false;
    const ilk = t.trim().split("\n")[0].slice(0, 40).replace(/[^\p{L}\p{N} ]+/gu, "").trim();
    yukle([new File([t], `${ilk || "Yapıştırılan metin"}.txt`, { type: "text/plain" })]);
    return true;
  };

  const yukle = async (l: File[]) => {
    const kalan = 10 - ekler.length - yuklemeler.length;
    for (const f of l.slice(0, Math.max(0, kalan))) {
      const id = `${Date.now()}-${Math.random()}`;
      setYuklemeler((x) => [...x, { id, ad: f.name || "dosya", boyut: f.size, onizleme: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined }]);
      if (f.size > 20 * 1024 * 1024) { setYuklemeler((x) => x.map((y) => (y.id === id ? { ...y, hata: "20 MB sınırını aşıyor" } : y))); continue; }
      ekYukle(f).then((e) => { setEkler((x) => [...x, e]); setYuklemeler((x) => x.filter((y) => y.id !== id)); })
        .catch((e: Error) => setYuklemeler((x) => x.map((y) => (y.id === id ? { ...y, hata: e.message } : y))));
    }
  };

  // "/" komutları ve "@" bahsetmeleri: imlecin önündeki parça (Esc ile o metin için gizlenir).
  // eslint-disable-next-line react-hooks/refs
  const imlec = Math.min(deger.length, alan.current?.selectionStart ?? deger.length);
  const once = gizli === deger ? "" : deger.slice(0, imlec);
  const slash = /^\/([\p{L}\p{N}_-]*)$/u.exec(once);
  const at = /(?:^|\s)@([\p{L}\p{N}_.-]*)$/u.exec(once);
  useEffect(() => { if (at && genel && sohbetler === null) api<{ sohbetler: { id: string; baslik: string; guncelleme: number }[] }>("/api/build/sohbet").then((v) => setSohbetler(v.sohbetler)).catch(() => setSohbetler([])); }, [!!at]); // eslint-disable-line react-hooks/exhaustive-deps
  const parcayiSil = (uzunluk: number) => { const y = deger.slice(0, imlec - uzunluk) + deger.slice(imlec); setDeger(y.replace(/^\s+/, "")); setTimeout(() => alan.current?.focus(), 0); };
  const oneriler = useMemo<Oneri[]>(() => {
    if (slash) {
      const q = slash[1].toLocaleLowerCase("tr");
      const l: Oneri[] = [
        ...(genel ? [{ id: "arastir", ad: "/arastir", alt: "Araştırma: web'de çok adımlı, kaynaklı rapor", ikon: <Telescope className="h-4 w-4" />, sec: () => { setKip({ ...kip, arastirma: true, kurul: undefined }); parcayiSil(slash[0].length); } }] : []),
        ...VAYRA_ARACLARI.map((a) => ({ id: a.komut, ad: `/${a.komut}`, alt: a.ad, ikon: /* eslint-disable-next-line @next/next/no-img-element */ <img src={a.gorsel} alt="" className="h-full w-full rounded-[10px] object-cover" />, sec: () => { setKip({ ...kip, arac: a.id }); parcayiSil(slash[0].length); } })),
        ...(genel ? [{ id: "kurul", ad: "/kurul", alt: "Model kurulu: aynı soruyu birden çok modele sor", ikon: <Users className="h-4 w-4" />, sec: () => { parcayiSil(slash[0].length); kurulAc(); } }] : []),
        ...(genel ? [
          { id: "tuval", ad: "/tuval", alt: "Tuval: belge ya da kodu yanda birlikte düzenle", ikon: <PanelRight className="h-4 w-4" />, sec: () => { setKip({ ...kip, tuval: true }); parcayiSil(slash[0].length); } },
          ...(ogrenmeDegis ? [{ id: "ogren", ad: "/ogren", alt: ogrenme ? "Öğrenme kipini kapat" : "Öğrenme kipi: adım adım, sorularla öğretir", ikon: <GraduationCap className="h-4 w-4" />, sec: () => { ogrenmeDegis(!ogrenme); parcayiSil(slash[0].length); } }] : []),
          { id: "test", ad: "/test", alt: "Bir konuda etkileşimli test hazırlat", ikon: <GraduationCap className="h-4 w-4" />, sec: () => { setDeger("Şu konuda 6 soruluk karışık bir test hazırla: "); setTimeout(() => alan.current?.focus(), 0); } },
          { id: "kartlar", ad: "/kartlar", alt: "Tekrar için bilgi kartları", ikon: <Layers3 className="h-4 w-4" />, sec: () => { setDeger("Şu konu için bilgi kartları hazırla: "); setTimeout(() => alan.current?.focus(), 0); } },
          { id: "sesli-ozet", ad: "/sesli-ozet", alt: "İki sunuculu sesli özet", ikon: <Headphones className="h-4 w-4" />, sec: () => { setDeger("Şu konuyu iki sunuculu kısa bir sesli özet olarak anlat: "); setTimeout(() => alan.current?.focus(), 0); } },
          ...(zamanla ? [{ id: "zamanla", ad: "/zamanla", alt: "Zamanlanmış görev kur: her gün, her hafta", ikon: <CalendarClock className="h-4 w-4" />, sec: () => { parcayiSil(slash[0].length); zamanla(deger.replace(slash[0], "").trim()); } }] : []),
          ...(dokumAc ? [{ id: "dokum", ad: "/kayit", alt: "Ses kaydı ve toplantı dökümü", ikon: <AudioLines className="h-4 w-4" />, sec: () => { parcayiSil(slash[0].length); dokumAc(); } }] : []),
          ...(istemAc ? [{ id: "istemler", ad: "/istemler", alt: "İstem kitaplığı: hazır ve kayıtlı istemler", ikon: <BookMarked className="h-4 w-4" />, sec: () => { parcayiSil(slash[0].length); istemAc(); } }] : []),
        ] : []),
        ...(istemler ?? []).map((x) => ({ id: `i-${x.id}`, ad: `/${x.ad}`, alt: `Kayıtlı istem · ${x.baslik}`, ikon: <BookMarked className="h-4 w-4" />, sec: () => { setDeger(x.metin); api("/api/build/sohbet/istemler", { govde: { id: x.id, kullanildi: true } }).catch(() => {}); setTimeout(() => alan.current?.focus(), 0); } })),
        { id: "dosya", ad: "/dosya", alt: "Görsel, PDF ya da metin dosyası ekle", ikon: <Paperclip className="h-4 w-4" />, sec: () => { parcayiSil(slash[0].length); dosya.current?.click(); } },
        ...(baglam?.yetenekler ?? []).map((y) => ({ id: `y-${y.id}`, ad: `/${y.ad}`, alt: y.baslik || y.aciklama, ikon: <Sparkles className="h-4 w-4" />, sec: () => { setBahsetmeler((b) => b.some((x) => x.id === y.id) ? b : [...b, { tur: "yetenek", id: y.id, ad: y.ad }]); parcayiSil(slash[0].length); } })),
      ];
      return l.filter((x) => !q || x.ad.toLocaleLowerCase("tr").includes(q) || x.alt.toLocaleLowerCase("tr").includes(q)).slice(0, 18);
    }
    if (at && baglam) {
      const q = at[1].toLocaleLowerCase("tr");
      const ekle = (b: Bahsetme) => { setBahsetmeler((l) => l.some((x) => x.id === b.id) ? l : [...l.filter((x) => !(b.tur === "ajan" && x.tur === "ajan")), b]); parcayiSil(at[1].length + 1); };
      const l: Oneri[] = [
        ...(genel ? baglam.ajanlar.map((a) => ({ id: `a-${a.id}`, ad: `@${a.ad}`, alt: `Ajan · ${a.aciklama || modelBul(a.model).ad}`, ikon: <AjanSimge src={a.simge} boyut={32} />, sec: () => ekle({ tur: "ajan", id: a.id, ad: a.ad, simge: a.simge }) })) : []),
        ...baglam.yetenekler.map((y) => ({ id: `y-${y.id}`, ad: `@${y.ad}`, alt: `Yetenek · ${y.baslik || y.aciklama}`, ikon: <Sparkles className="h-4 w-4" />, sec: () => ekle({ tur: "yetenek", id: y.id, ad: y.ad }) })),
        ...(genel ? baglam.baglantilar.filter((b) => b.durum === "etkin" && b.sohbette).map((b) => ({ id: `b-${b.id}`, ad: `@${b.ad}`, alt: `Bağlantı · ${b.arac} araç`, ikon: b.logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={b.logo} alt="" className="h-5 w-5 object-contain" /> : <Plug className="h-4 w-4" />, sec: () => ekle({ tur: "baglanti", id: b.id, ad: b.ad, simge: b.logo }) })) : []),
        ...(genel ? (sohbetler ?? []).filter((x) => x.id !== sohbetId).slice(0, 40).map((x) => ({ id: `s-${x.id}`, ad: `@${x.baslik}`, alt: "Sohbet · bağlam olarak ekle", ikon: <MessageSquare className="h-4 w-4" />, sec: () => { if (bahsetmeler.filter((b) => b.tur === "sohbet").length < 3) ekle({ tur: "sohbet", id: x.id, ad: x.baslik }); else parcayiSil(at[1].length + 1); } })) : []),
      ];
      return l.filter((x) => !q || x.ad.toLocaleLowerCase("tr").includes(q)).slice(0, 10);
    }
    return [];
  }, [slash?.[0], at?.[0], baglam, kip, genel, sohbetler, istemler, ogrenme]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setOneriSira(0), [oneriler.length, slash?.[0], at?.[0]]);

  const tusYakala = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!oneriler.length) return false;
    if (e.key === "ArrowDown") { e.preventDefault(); setOneriSira((i) => (i + 1) % oneriler.length); return true; }
    if (e.key === "ArrowUp") { e.preventDefault(); setOneriSira((i) => (i - 1 + oneriler.length) % oneriler.length); return true; }
    if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); oneriler[oneriSira]?.sec(); return true; }
    if (e.key === "Escape") { e.preventDefault(); setGizli(deger); return true; }
    return false;
  };

  const dolu = !!deger.trim() || ekler.length > 0;
  const gonderTikla = () => {
    if (!dolu || yuklemeler.some((y) => !y.hata)) return;
    const istek: TurIstegi = {};
    if (kip.arastirma) istek.arastirma = true;
    if (kip.arac) istek.arac = kip.arac;
    if (kip.kurul) istek.kurul = kip.kurul;
    if (kip.tuval) istek.tuval = true;
    const sh = bahsetmeler.filter((b) => b.tur === "sohbet").map((b) => ({ id: b.id, baslik: b.ad })); if (sh.length) istek.sohbetler = sh;
    const aj = bahsetmeler.find((b) => b.tur === "ajan");
    if (aj) istek.ajan = aj.id;
    const y = bahsetmeler.filter((b) => b.tur === "yetenek").map((b) => b.ad); if (y.length) istek.yetenekler = y;
    const b = bahsetmeler.filter((x) => x.tur === "baglanti").map((x) => x.ad); if (b.length) istek.baglantilar = b;
    if (alinti) istek.alinti = alinti;
    gonder({ metin: deger.trim(), ekler, istek: Object.keys(istek).length ? istek : undefined });
    setEkler([]); setYuklemeler([]); setBahsetmeler([]); setAlinti?.(undefined);
    if (kip.arac || kip.tuval) setKip({ ...kip, arac: undefined, tuval: undefined });
  };

  // Kullanım yeri "sohbet" kapalı bağlantılar hiçbir sohbette kullanılmaz; seçim yalnız açık olanlar arasında.
  const baglantiAcik = (b: Baglam["baglantilar"][number]) => b.sohbette && (s?.baglantiSecimi ? s.baglantiSecimi.includes(b.id) : true);
  const baglantiDegis = (id: string, v: boolean) => {
    const l = (baglam?.baglantilar ?? []).filter((x) => x.sohbette);
    const simdi = l.filter(baglantiAcik).map((x) => x.id);
    ayarDegis({ baglantiSecimi: v ? [...new Set([...simdi, id])] : simdi.filter((x) => x !== id) });
  };
  const yetenekAcik = (y: Baglam["yetenekler"][number]) => y.herSohbette && y.cagri !== "elle" && !s?.kapaliYetenekler?.includes(y.id);
  const yetenekDegis = (id: string, v: boolean) => ayarDegis({ kapaliYetenekler: v ? (s?.kapaliYetenekler ?? []).filter((x) => x !== id) : [...new Set([...(s?.kapaliYetenekler ?? []), id])] });
  const acikBaglanti = (baglam?.baglantilar ?? []).filter(baglantiAcik).length;
  const acikYetenek = (baglam?.yetenekler ?? []).filter(yetenekAcik).length;
  const arac = VAYRA_ARACLARI.find((a) => a.id === kip.arac);

  const ekAlani = (ekler.length || yuklemeler.length || bahsetmeler.length || kip.arastirma || kip.arac || kip.kurul || alinti || kip.tuval || ogrenme) ? (
    <AnimatePresence initial={false}>
      {alinti && (
        <motion.div key="alinti" layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="flex w-full items-start gap-2.5 rounded-[14px] bg-white/[0.05] py-2 pl-3 pr-1.5 ring-1 ring-inset ring-white/[0.08]">
          <Quote className="mt-[3px] h-3.5 w-3.5 shrink-0 text-[#8be6ff]" />
          <p className="line-clamp-2 min-w-0 flex-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-white/75">{alinti}</p>
          <button type="button" onClick={() => setAlinti?.(undefined)} aria-label="Alıntıyı kaldır" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"><X className="h-3.5 w-3.5" /></button>
        </motion.div>
      )}
      {ekler.map((e, i) => <EkKarosu key={e.url} e={e} kaldir={() => setEkler(ekler.filter((_, j) => j !== i))} />)}
      {yuklemeler.map((y) => (
        <span key={y.id} title={y.hata} className={cn("relative flex h-12 max-w-[220px] items-center gap-2 overflow-hidden rounded-[12px] pl-2 pr-3 ring-1 ring-inset", y.hata ? "bg-rose-500/[0.08] ring-rose-400/25" : "bg-white/[0.06] ring-white/[0.08]")}>
          {y.onizleme ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={y.onizleme} alt="" className="h-8 w-8 rounded-[8px] object-cover opacity-60" /> : <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white/[0.06]"><FileText className="h-4 w-4 text-white/60" /></span>}
          <span className="min-w-0"><span className="block truncate text-[12.5px] text-white/85">{y.ad}</span><span className={cn("flex items-center gap-1 text-[11px]", y.hata ? "text-rose-200" : "text-white/50")}>{y.hata ? <><AlertTriangle className="h-3 w-3" />{y.hata}</> : <><Loader2 className="h-3 w-3 animate-spin" />Yükleniyor</>}</span></span>
          {y.hata && <button type="button" onClick={() => setYuklemeler((x) => x.filter((z) => z.id !== y.id))} aria-label="Kaldır" className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-white/10"><X className="h-3 w-3" /></button>}
        </span>
      ))}
      {ogrenme && <Cip key="ogr" ikon={<GraduationCap className="h-3.5 w-3.5" />} kaldir={() => ogrenmeDegis?.(false)} title="Vayra adım adım, sorularla öğretir ve testle pekiştirir">Öğrenme kipi</Cip>}
      {kip.tuval && <Cip key="tuv" ikon={<PanelRight className="h-3.5 w-3.5" />} kaldir={() => setKip({ ...kip, tuval: false })} title="Yanıt yandaki tuvale yazılır, birlikte düzenlersiniz">Tuval</Cip>}
      {kip.arastirma && <Cip key="ar" ikon={<Telescope className="h-3.5 w-3.5" />} kaldir={() => setKip({ ...kip, arastirma: false })} title="Önce bir araştırma planı çıkarılır, onaylayınca web'de araştırılır">Araştırma</Cip>}
      {arac && <Cip key="arac" ikon={/* eslint-disable-next-line @next/next/no-img-element */ <img src={arac.gorsel} alt="" className="h-5 w-5 rounded-full object-cover" />} kaldir={() => setKip({ ...kip, arac: undefined })}>{arac.ad}</Cip>}
      {kip.kurul && (
        <Cip key="kurul" ikon={<span className="flex -space-x-1">{kip.kurul.modeller.map((m) => <span key={m} className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1b1c1f] ring-1 ring-[#2a2b2f]"><SaglayiciLogo m={modelBul(m)} boyut={11} /></span>)}</span>} kaldir={() => setKip({ ...kip, kurul: undefined })} title="Aynı soru bu modellere sorulur, sonra birleşik yanıt yazılır">
          <button type="button" onClick={kurulAc} className="hover:underline">Model kurulu · {kip.kurul.modeller.length} model</button>
        </Cip>
      )}
      {bahsetmeler.map((b) => <Cip key={b.id} ikon={b.tur === "ajan" ? <AjanSimge src={b.simge ?? ""} boyut={20} /> : b.tur === "yetenek" ? <Sparkles className="h-3.5 w-3.5" /> : b.tur === "sohbet" ? <MessageSquare className="h-3.5 w-3.5" /> : b.simge ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={b.simge} alt="" className="h-4 w-4 object-contain" /> : <Plug className="h-3.5 w-3.5" />} kaldir={() => setBahsetmeler((l) => l.filter((x) => x.id !== b.id))}>@{b.ad}</Cip>)}
    </AnimatePresence>
  ) : undefined;

  const ustIcerik = oneriler.length > 0 ? (
    <div className="bd-panel absolute inset-x-2 bottom-full z-30 mb-2 max-h-[320px] overflow-y-auto rounded-[18px] p-1.5 [scrollbar-width:thin]">
      <p className="px-2.5 pb-1 pt-1.5 text-[11.5px] font-medium text-white/45">{slash ? "Komutlar" : "Bahset: ajan, yetenek, bağlantı ya da sohbet"}</p>
      {oneriler.map((o, i) => (
        <button key={o.id} type="button" onMouseDown={(e) => { e.preventDefault(); o.sec(); }} onMouseEnter={() => setOneriSira(i)}
          className={cn("flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-1.5 text-left", i === oneriSira ? "bg-white/[0.08] ring-1 ring-inset ring-white/60" : "hover:bg-white/[0.05]")}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white/[0.06] text-white/80">{o.ikon}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-white">{o.ad}</span><span className="block truncate text-[12px] text-white/50">{o.alt}</span></span>
        </button>
      ))}
    </div>
  ) : undefined;

  const artiDugmesi = (
    <div ref={arti.kok}>
      <input ref={dosya} type="file" multiple hidden accept="image/*,application/pdf,.pdf,.docx,.xlsx,.pptx,.txt,.md,.csv,.tsv,.json,.xml,.html,.css,.js,.ts,.tsx,.jsx,.py,.sql,.yaml,.yml,.log,.srt"
        onChange={(e) => { if (e.target.files) yukle([...e.target.files]); e.target.value = ""; }} />
      <button type="button" onClick={() => arti.setAcik(!arti.acik)} title="Ekle ve araçlar" aria-label="Ekle ve araçlar"
        className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white/80 transition-colors hover:bg-white/[0.12] hover:text-white", arti.acik && "bg-white/[0.14] text-white")}>
        <motion.span animate={{ rotate: arti.acik ? 45 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="text-[20px] font-light leading-none">+</motion.span>
      </button>
      <Acilir a={arti}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={sayfa} initial={{ opacity: 0, x: sayfa === "ana" ? -8 : 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
            {sayfa === "ana" ? (
              <>
                <MenuSatir ikon={<Paperclip className="h-4 w-4" />} ad="Dosya ekle" alt="Görsel, PDF, Word, Excel, PowerPoint ya da metin" onClick={() => { arti.setAcik(false); dosya.current?.click(); }} />
                {genel && <MenuAnahtar ikon={<Telescope className="h-4 w-4" />} ad="Araştırma" alt="Plan, web araması, kaynaklı rapor" acik={!!kip.arastirma} set={(v) => setKip({ ...kip, arastirma: v, kurul: v ? undefined : kip.kurul })} />}
                <MenuSatir ikon={/* eslint-disable-next-line @next/next/no-img-element */ <img src={VAYRA_ARACLARI[0].gorsel} alt="" className="h-8 w-8 rounded-[10px] object-cover" />} ad="Vayra araçları" alt="Görsel, video, müzik, ses, 3D" sag={<ChevronRight className="h-4 w-4 text-white/40" />} onClick={() => setSayfa("arac")} />
                {genel && <MenuSatir ikon={<Users className="h-4 w-4" />} ad="Model kurulu" alt="Aynı soruyu 2 ile 4 modele sor, birleştir" secili={!!kip.kurul} onClick={() => { arti.setAcik(false); kurulAc(); }} />}
                {genel && <MenuAnahtar ikon={<PanelRight className="h-4 w-4" />} ad="Tuval" alt="Belge ya da kodu yanda birlikte düzenle" acik={!!kip.tuval} set={(v) => setKip({ ...kip, tuval: v })} />}
                {genel && ogrenmeDegis && <MenuAnahtar ikon={<GraduationCap className="h-4 w-4" />} ad="Öğrenme kipi" alt="Adım adım, sorularla öğretir; testle pekiştirir" acik={!!ogrenme} set={ogrenmeDegis} />}
                {genel && zamanla && <MenuSatir ikon={<CalendarClock className="h-4 w-4" />} ad="Zamanla" alt="Bu isteği her gün ya da her hafta çalıştır" onClick={() => { arti.setAcik(false); zamanla(deger.trim()); }} />}
                {genel && istemAc && <MenuSatir ikon={<BookMarked className="h-4 w-4" />} ad="İstem kitaplığı" alt="Hazır istemler ve kaydettiklerin" onClick={() => { arti.setAcik(false); istemAc(); }} />}
                {genel && dokumAc && <MenuSatir ikon={<AudioLines className="h-4 w-4" />} ad="Ses kaydı ve döküm" alt="Toplantıyı kaydet ya da yükle; konuşmacılarıyla metne dök" onClick={() => { arti.setAcik(false); dokumAc(); }} />}
                {genel && <>
                  <div className="my-1 h-px bg-white/[0.07]" />
                  <MenuSatir ikon={<Plug className="h-4 w-4" />} ad="Bağlantılar" alt={baglam?.baglantilar.length ? `${acikBaglanti} / ${baglam.baglantilar.filter((b) => b.sohbette).length} bu sohbette açık` : "Henüz bağlantı yok"} sag={<ChevronRight className="h-4 w-4 text-white/40" />} onClick={() => setSayfa("baglanti")} />
                  <MenuSatir ikon={<Sparkles className="h-4 w-4" />} ad="Yetenekler" alt={baglam?.yetenekler.length ? `${acikYetenek} yetenek her sohbette açık` : "Henüz yetenek yok"} sag={<ChevronRight className="h-4 w-4 text-white/40" />} onClick={() => setSayfa("yetenek")} />
                  {!s?.gecici && <MenuAnahtar ikon={<Brain className="h-4 w-4" />} ad="Bellek" alt={!baglam?.bellek.acik ? "Bellek duraklatıldı" : s?.bellekKapali ? "Bu sohbette kapalı" : `${baglam?.bellek.kayit ?? 0} kayıt kullanılıyor`} acik={!s?.bellekKapali && !!baglam?.bellek.acik} set={(v) => ayarDegis({ bellekKapali: !v })} disabled={!baglam?.bellek.acik} />}
                </>}
              </>
            ) : (
              <>
                <button type="button" onClick={() => setSayfa("ana")} className="mb-1 flex h-9 w-full items-center gap-2 rounded-[10px] px-2 text-[13px] font-semibold text-white hover:bg-white/[0.05]"><ArrowLeft className="h-4 w-4" />{sayfa === "arac" ? "Vayra araçları" : sayfa === "baglanti" ? "Bu sohbetin bağlantıları" : "Yetenekler"}</button>
                {sayfa === "arac" && VAYRA_ARACLARI.map((a) => (
                  <MenuSatir key={a.id} ikon={/* eslint-disable-next-line @next/next/no-img-element */ <img src={a.gorsel} alt="" className="h-8 w-8 rounded-[10px] object-cover" />} ad={a.ad} alt={a.alt} secili={kip.arac === a.id} onClick={() => { setKip({ ...kip, arac: kip.arac === a.id ? undefined : a.id }); arti.setAcik(false); alan.current?.focus(); }} />
                ))}
                {sayfa === "baglanti" && <>
                  {(baglam?.baglantilar ?? []).map((b) => (
                    <div key={b.id} className="flex items-center gap-2.5 rounded-[12px] px-2.5 py-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]">{b.logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={b.logo} alt="" className="h-[18px] w-[18px] object-contain" /> : <Plug className="h-4 w-4 text-white/70" />}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] text-white">{b.ad}</span><span className="block truncate text-[12px] text-white/50">{!b.sohbette ? "Sohbetlerde kullanımı kapalı" : b.durum === "etkin" ? `${b.arac} araç${b.saltOkunur ? " · salt okunur" : ""}` : b.durum === "giris-gerekli" ? "Giriş gerekli" : "Kurulmadı"}</span></span>
                      {b.sohbette ? <Anahtar acik={baglantiAcik(b)} set={(v) => baglantiDegis(b.id, v)} etiket={`${b.ad} bu sohbette`} />
                        : <Link href="/panel/build/baglantilar" className="h-7 shrink-0 rounded-full bg-white/[0.08] px-2.5 text-[12px] leading-7 text-white hover:bg-white/[0.14]">Ayarla</Link>}
                    </div>
                  ))}
                  {!baglam?.baglantilar.length && <p className="px-2.5 py-2 text-[12.5px] text-white/50">GitHub, Notion, Slack gibi servisleri bağla; Vayra bu sohbette onların araçlarını kullanır.</p>}
                  <Link href="/panel/build/baglantilar" className="mt-1 flex h-9 items-center gap-2 rounded-[10px] px-2.5 text-[13px] text-white/70 hover:bg-white/[0.05] hover:text-white"><Settings2 className="h-4 w-4" />Bağlantıları yönet</Link>
                </>}
                {sayfa === "yetenek" && <>
                  {(baglam?.yetenekler ?? []).map((y) => (
                    <div key={y.id} className="flex items-center gap-2.5 rounded-[12px] px-2.5 py-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06] text-[#8be6ff]"><Sparkles className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] text-white">{y.baslik || y.ad}</span><span className="block truncate text-[12px] text-white/50">{y.cagri === "elle" ? "Yalnız / ya da @ ile çağrılınca" : y.cagri === "her-zaman" ? "Her zaman açık" : y.herSohbette ? y.aciklama : "Yalnız @ ile çağrılınca"}</span></span>
                      {y.herSohbette && y.cagri !== "elle" ? <Anahtar acik={yetenekAcik(y)} set={(v) => yetenekDegis(y.id, v)} etiket={`${y.ad} bu sohbette`} />
                        : <button type="button" onClick={() => { setBahsetmeler((l) => l.some((x) => x.id === y.id) ? l : [...l, { tur: "yetenek", id: y.id, ad: y.ad }]); arti.setAcik(false); }} className="h-7 shrink-0 rounded-full bg-white/[0.08] px-2.5 text-[12px] text-white hover:bg-white/[0.14]">Kullan</button>}
                    </div>
                  ))}
                  {!baglam?.yetenekler.length && <p className="px-2.5 py-2 text-[12.5px] text-white/50">Yetenekler Vayra'ya bir işi senin yönteminle yapmayı öğretir.</p>}
                  <Link href="/panel/build/yetenekler" className="mt-1 flex h-9 items-center gap-2 rounded-[10px] px-2.5 text-[13px] text-white/70 hover:bg-white/[0.05] hover:text-white"><Settings2 className="h-4 w-4" />Yetenekleri yönet</Link>
                </>}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </Acilir>
    </div>
  );

  const IZINLER = [
    { id: "otomatik" as const, ad: "Otomatik", alt: "Araçları sormadan kullanır", I: ShieldCheck },
    { id: "onay" as const, ad: "Onay iste", alt: "Üretim ve dış işlemlerden önce sorar", I: Hand },
  ];
  const izin = IZINLER.find((x) => x.id === izinModu)!;
  const araclar = (
    <>
      <div ref={izinMenu.kok}>
        <button type="button" onClick={() => izinMenu.setAcik(!izinMenu.acik)} title={`İzin: ${izin.ad}. ${izin.alt}`}
          className={cn("flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12.5px] transition-colors", izinModu === "onay" ? "bg-[#55d6fd]/[0.12] text-[#8be6ff]" : "bg-white/[0.06] text-white/75 hover:bg-white/[0.1] hover:text-white", dar && "w-8 justify-center px-0")}>
          <izin.I className="h-3.5 w-3.5" />{!dar && <span className="max-sm:hidden @max-[600px]:hidden">{izin.ad}</span>}
        </button>
        <Acilir a={izinMenu}>
          <p className="px-2.5 pb-1 pt-1.5 text-[11.5px] font-medium text-white/45">Araç izinleri</p>
          {IZINLER.map((x) => <MenuSatir key={x.id} ikon={<x.I className="h-4 w-4" />} ad={x.ad} alt={x.alt} secili={izinModu === x.id} onClick={() => { ayarDegis({ izinModu: x.id }); izinMenu.setAcik(false); }} />)}
          <p className="px-2.5 pb-1 pt-1.5 text-[11.5px] leading-snug text-white/40">Web araması ve okuma işlemleri her iki modda da sormadan çalışır.</p>
        </Acilir>
      </div>
      {!dar && (
        <Link href="/panel/kredi" title="Kalan kredin" className={cn("flex h-8 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[12px] tabular-nums transition-colors max-md:hidden @max-[680px]:hidden", krediler < 20 ? "bg-amber-400/[0.12] text-amber-200" : "text-white/55 hover:bg-white/[0.06] hover:text-white")}>
          <KrediJeton boyut={11} />{sayi(krediler)}{krediler < 20 && <span className="ml-0.5">Kredin azaldı</span>}
        </Link>
      )}
      {doluluk && <BaglamHalkasi token={doluluk.token} sinir={baglamSiniri(ajan ? ajan.model : model)} taslak={deger.trim() ? tokenTahmini(deger.length) : 0} ozetle={doluluk.ozetle} ozetleniyor={doluluk.ozetleniyor} mesajSayisi={doluluk.mesajSayisi} />}
    </>
  );

  return (
    <div className="@container">
    <Komut modsuz dar={dar} deger={deger} setDeger={setDeger} mod="sohbet" setMod={() => {}}
      model={model} setModel={setModel} baglantilar={modelBaglantilari} ekler={[]} setEkler={() => {}} calisiyor={calisiyor} durdur={durdur} otomatikOdak={otomatikOdak}
      modelYerine={ajan ? <span className="flex h-8 min-w-0 items-center gap-1.5 rounded-full bg-white/[0.06] pl-1 pr-3 text-[12.5px] text-white/70"><AjanSimge src={ajan.simge} boyut={22} /><span className="truncate">{ajan.ad}</span></span> : undefined}
      yer={yer} gonder={gonderTikla} arti={artiDugmesi} ekAlani={ekAlani} ustIcerik={ustIcerik} araclar={araclar} doluMu={dolu && !yuklemeler.some((y) => !y.hata)}
      dosyaBirak={yukle} tusYakala={tusYakala} alanRef={alan} efor={ajan ? undefined : efor} setEfor={ajan ? undefined : setEfor} modelAltBilgi metinYapistir={metinYapistir} sesKipi={sesKipi} />
    </div>
  );
}
