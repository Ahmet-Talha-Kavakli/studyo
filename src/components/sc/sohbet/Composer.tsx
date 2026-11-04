"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  ArrowUp, AudioLines, Brain, Check, ChevronDown, ChevronRight, Clock, Globe, ImageIcon, LayoutTemplate, Mic, Palette, Paperclip, Plus,
  ShieldCheck, SlidersHorizontal, Square, Telescope, TerminalSquare, Columns2, Upload, X, Zap, Monitor, AtSign, PenLine, ListChecks,
} from "lucide-react";
import { HAZIR_CALISANLAR, useScCalisan } from "@/lib/scCalisan";
import { CalisanAvatar } from "../sayfalar/CalisanGorsel";
import { useScStil } from "@/lib/scStil";
import { StilPenceresi } from "./StilPenceresi";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { cn } from "@/lib/utils";
import { Yuzen } from "@/components/ui/Yuzen";
import { useOdakTuzagi } from "@/hooks/useOdakTuzagi";
import { SAGLAYICI_ADI, SC_EFORLAR, SC_MODELLER, SC_OTOMATIK, SC_STILLER, SC_VARSAYILAN_MODEL, type ScEfor, type ScStil } from "@/lib/scSohbet";
import { ModelLogo } from "@/components/kitaplik/Simgeler";
import { useScTercih } from "@/store/useScTercih";
import { HAZIR_BECERILER, useScBeceri } from "@/lib/scBeceri";
import Link from "next/link";
import { Ipucu } from "./Ipucu";

/**
 * Usta komut kutusu.
 * Sol: "+" (dosya ekle, görsel üret, site kur) ve Araçlar (web, uzun düşün, yanıt stili, onay) —
 * açık araçlar kutuda küçük haplar olarak görünür. Sağ: model seçici, dikte, gönder/durdur.
 * Ekler tür rozetli kartlar; görsele tıklayınca büyük önizleme. Taslak sohbet başına saklanır,
 * boş kutuda ↑ son mesajı düzenler, dokunmatikte Enter yeni satırdır, "/" komut listesi açar.
 */
export type ScEk = { id: string; tur: "gorsel" | "metin"; ad: string; boyut: number; onizleme?: string; veri?: string; icerik?: string };
export type ScNiyet = "oto" | "gorsel" | "site" | "plan";
export type ScAyar = { model: string; dusun: boolean; web: boolean; stil: ScStil; niyet: ScNiyet; sor: boolean; arastir?: boolean; beceri?: string; kod?: boolean; karsilastir?: string; efor?: ScEfor; calisan?: string; ozelStil?: string };
export const VARSAYILAN_AYAR: ScAyar = { model: SC_VARSAYILAN_MODEL, dusun: false, web: false, stil: "normal", niyet: "oto", sor: true, arastir: false };
/** Yeni sohbetin başlangıç ayarı: Ayarlar › Yetenekler'deki varsayılan model ve araçlar uygulanır. */
export const varsayilanAyar = (): ScAyar => {
  const t = useScTercih.getState();
  return { ...VARSAYILAN_AYAR, web: t.varsayilanWeb, dusun: t.varsayilanDusun, model: t.varsayilanModel && SC_MODELLER.some((m) => m.id === t.varsayilanModel) ? t.varsayilanModel : VARSAYILAN_AYAR.model };
};

const YAY = { type: "spring", stiffness: 460, damping: 34 } as const;
const POP = "rounded-[16px] border border-white/[0.09] bg-[#1a1a1d] p-1.5";
const UZUN = 2400;
const KOMUTLAR = [
  { ad: "gorsel", alt: "Tarifinden görsel üret", ikon: ImageIcon, uygula: (a: ScAyar): ScAyar => ({ ...a, niyet: "gorsel" }) },
  { ad: "site", alt: "Site, oyun ya da panel kur", ikon: LayoutTemplate, uygula: (a: ScAyar): ScAyar => ({ ...a, niyet: "site" }) },
  { ad: "arastir", alt: "Derin araştırma: çok adımlı arama, kaynaklı rapor", ikon: Telescope, uygula: (a: ScAyar): ScAyar => ({ ...a, niyet: "oto", arastir: true }) },
  { ad: "dusun", alt: "Uzun düşünmeyi aç", ikon: Brain, uygula: (a: ScAyar): ScAyar => ({ ...a, dusun: true }) },
];
const boyutYaz = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const uzanti = (ad: string) => (ad === "Yapıştırılan metin" ? "METİN" : (ad.split(".").pop() ?? "").slice(0, 4).toLocaleUpperCase("tr"));
const UZANTI_RENK: Record<string, string> = { MD: "bg-sky-400/15 text-sky-300", CSV: "bg-emerald-400/15 text-emerald-300", JSON: "bg-amber-300/15 text-amber-200", PY: "bg-yellow-300/15 text-yellow-200", TS: "bg-blue-400/15 text-blue-300", TSX: "bg-blue-400/15 text-blue-300", JS: "bg-yellow-300/15 text-yellow-200", HTML: "bg-orange-400/15 text-orange-300", CSS: "bg-violet-400/15 text-violet-300" };
const yeniId = () => Math.random().toString(36).slice(2, 9);
const dokunmatik = () => typeof window !== "undefined" && window.matchMedia("(hover: none) and (pointer: coarse)").matches;

async function kucukResim(veri: string, en = 200): Promise<string> {
  return new Promise((coz) => {
    const img = new Image();
    img.onload = () => { const o = Math.min(1, en / Math.max(img.width, img.height)); const c = document.createElement("canvas"); c.width = Math.round(img.width * o); c.height = Math.round(img.height * o); c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height); coz(c.toDataURL("image/jpeg", 0.82)); };
    img.onerror = () => coz(""); img.src = veri;
  });
}
const dosyaOku = (f: File, metin = false) => new Promise<string>((coz, red) => { const r = new FileReader(); r.onload = () => coz(String(r.result)); r.onerror = red; if (metin) r.readAsText(f); else r.readAsDataURL(f); });

/** Dosyaları komut kutusu eklerine çevirir (görsel ≤ 8 MB, metin/kod ≤ 1 MB). */
export async function dosyalariEkle(dosyalar: File[]): Promise<ScEk[]> {
  const sonuc: ScEk[] = [];
  for (const f of dosyalar.slice(0, 8)) {
    if (/^image\/(png|jpe?g|webp|gif)$/.test(f.type)) {
      if (f.size > 8 * 1048576) { toast.error(`${f.name} çok büyük`, { description: "Görseller en çok 8 MB olabilir. Daha küçük bir dosya seç." }); continue; }
      const veri = await dosyaOku(f);
      sonuc.push({ id: yeniId(), tur: "gorsel", ad: f.name || "Yapıştırılan görsel", boyut: f.size, veri, onizleme: await kucukResim(veri) });
    } else if (/^text\/|json|xml|csv|javascript|typescript/.test(f.type) || /\.(md|txt|csv|json|ts|tsx|js|py|html|css|sql|yml|yaml)$/i.test(f.name)) {
      if (f.size > 1048576) { toast.error(`${f.name} çok büyük`, { description: "Metin dosyaları en çok 1 MB olabilir. Daha küçük bir dosya seç." }); continue; }
      sonuc.push({ id: yeniId(), tur: "metin", ad: f.name, boyut: f.size, icerik: await dosyaOku(f, true) });
    } else toast.error("Bu dosya türü desteklenmiyor", { description: `${f.name} eklenemedi. Görsel (PNG, JPG, WEBP, GIF) ya da metin/kod dosyası ekle.` });
  }
  return sonuc;
}

/** Ekran görüntüsü: kullanıcının seçtiği pencere/sekmeden tek kare alınır (en fazla 2560 px, WEBP). */
async function ekranGoruntusu(): Promise<File | null> {
  const akis = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
  try {
    const v = document.createElement("video"); v.srcObject = akis; v.muted = true; v.playsInline = true; await v.play();
    await new Promise((r) => setTimeout(r, 250));
    const oran = Math.min(1, 2560 / Math.max(v.videoWidth, 1));
    const c = document.createElement("canvas"); c.width = Math.round(v.videoWidth * oran); c.height = Math.round(v.videoHeight * oran);
    c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", 0.9));
    const saat = new Date().toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" });
    return blob ? new File([blob], `Ekran görüntüsü ${saat}.webp`, { type: "image/webp" }) : null;
  } finally { akis.getTracks().forEach((t) => t.stop()); }
}

/* ── Küçük parçalar ── */

function Hap({ ikon: I, ad, onSil, vurgu, bas }: { ikon: typeof Brain; ad: string; onSil: () => void; vurgu?: boolean; bas?: React.ReactNode }) {
  return (
    <motion.span layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={YAY}
      title={ad} className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-full pl-2.5 pr-1 text-[13px] font-medium max-sm:gap-0.5 max-sm:pl-2",
        vurgu ? "bg-[var(--sc-aksan)]/[0.13] text-[var(--sc-aksan)]" : "bg-white/[0.07] text-[var(--sc-metin)]")}>
      {bas ?? <I className="h-3.5 w-3.5 shrink-0" />}<span className="max-sm:sr-only">{ad}</span>
      <button onClick={onSil} aria-label={`${ad} kapat`} className="flex h-6 w-6 items-center justify-center rounded-full opacity-60 transition-[opacity,background] hover:bg-white/10 hover:opacity-100"><X className="h-3 w-3" /></button>
    </motion.span>
  );
}

function Anahtar({ acik }: { acik: boolean }) {
  return (
    <span aria-hidden className={cn("relative flex h-[18px] w-8 shrink-0 items-center rounded-full px-[2px] transition-colors duration-200", acik ? "justify-end bg-[var(--sc-aksan)]" : "justify-start bg-white/[0.16]")}>
      <motion.span layout transition={YAY} className="h-[14px] w-[14px] rounded-full bg-white" />
    </span>
  );
}

function Satir({ ikon: I, ad, alt, onClick, sag, vurgu, tus }: { ikon: typeof Brain; ad: string; alt?: string; onClick: () => void; sag?: React.ReactNode; vurgu?: boolean; tus?: string }) {
  return (
    <button role="menuitem" onClick={onClick} className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none">
      <I className={cn("h-4 w-4 shrink-0", vurgu ? "text-[var(--sc-aksan)]" : "text-[var(--sc-metin-2)]")} />
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] leading-tight text-[var(--sc-metin)]">{ad}</span>
        {alt && <span className="mt-0.5 block truncate text-[12px] leading-tight text-[var(--sc-metin-3)]">{alt}</span>}
      </span>
      {tus && <span className="flex shrink-0 gap-1">{tus.split(" ").map((t) => <kbd key={t} className="text-[11px]">{t}</kbd>)}</span>}
      {sag}
    </button>
  );
}

const ikonDugme = (aktif?: boolean) => cn("flex h-8 items-center justify-center gap-1.5 rounded-full transition-colors",
  aktif ? "bg-white/[0.1] text-[var(--sc-metin)]" : "text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]");

/** Görsel ekinin büyük önizlemesi. */
function EkOnizleme({ e, onKapat }: { e: ScEk; onKapat: () => void }) {
  const odak = useOdakTuzagi(true);
  useEffect(() => { const t = (k: KeyboardEvent) => k.key === "Escape" && onKapat(); window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t); }, [onKapat]);
  return (
    <div className="perde sc-kapsam fixed inset-0 z-[400] flex items-center justify-center bg-black/80 p-6" onClick={onKapat}>
      <motion.figure ref={odak} role="dialog" aria-modal="true" aria-label={e.ad} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={YAY} onClick={(x) => x.stopPropagation()} className="flex max-h-full max-w-[min(1000px,100%)] flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={e.veri || e.onizleme} alt={e.ad} className="max-h-[78vh] max-w-full rounded-[14px] object-contain" />
        <figcaption className="flex items-center gap-3 text-[13px] text-[var(--sc-metin-2)]">
          <span className="font-medium text-[var(--sc-metin)]">{e.ad}</span>{boyutYaz(e.boyut)}
          <button onClick={onKapat} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 font-medium text-[var(--sc-metin)] hover:bg-white/[0.12]"><X className="h-3.5 w-3.5" />Kapat</button>
        </figcaption>
      </motion.figure>
    </div>
  );
}

function EkKarti({ e, onSil, onAc }: { e: ScEk; onSil: () => void; onAc: () => void }) {
  const satir = e.icerik ? e.icerik.replace(/\n+$/, "").split("\n").length : 0;
  const uz = uzanti(e.ad);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={YAY} className="group/ek relative shrink-0">
      {e.tur === "gorsel" ? (
        <button onClick={onAc} aria-label={`${e.ad} önizle`} className="block h-[68px] w-[68px] overflow-hidden rounded-[12px] ring-1 ring-inset ring-white/10 transition-[box-shadow] hover:ring-white/25">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.onizleme} alt={e.ad} className="h-full w-full object-cover" />
        </button>
      ) : (
        <div title={e.ad} className="flex h-[68px] w-[172px] flex-col justify-between rounded-[12px] bg-white/[0.045] px-2.5 py-2 ring-1 ring-inset ring-white/[0.08]">
          <span className="line-clamp-2 break-all text-[12.5px] font-medium leading-[1.25] text-[var(--sc-metin)]">{e.ad === "Yapıştırılan metin" ? (e.icerik ?? "").trim().split("\n")[0].slice(0, 80) : e.ad}</span>
          <span className="flex items-center gap-1.5 text-[11px] text-[var(--sc-metin-3)]">
            <span className={cn("rounded-[4px] px-1 py-px text-[10px] font-semibold", UZANTI_RENK[uz] ?? "bg-white/10 text-[#b4b4ba]")}>{uz || "DOSYA"}</span>
            {satir.toLocaleString("tr")} satır · {boyutYaz(e.boyut)}
          </span>
        </div>
      )}
      <button onClick={onSil} aria-label={`${e.ad} kaldır`}
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#26303d] text-[var(--sc-metin)] opacity-0 ring-1 ring-white/15 transition-opacity hover:bg-[#4a4a46] focus-visible:opacity-100 group-hover/ek:opacity-100 [@media(hover:none)]:opacity-100">
        <X className="h-3 w-3" strokeWidth={2.4} />
      </button>
    </motion.div>
  );
}

/* ── Komut kutusu ── */

export function Composer({ metin, setMetin, ekler, setEkler, ayar, setAyar, calisiyor, kuyruk, onKuyrukSil, onGonder, onDurdur, buyuk, yerTutucu, ust, alt, odakRef, taslakAnahtari, onSonuDuzenle, onSesliMod }: {
  metin: string; setMetin: (v: string) => void; ekler: ScEk[]; setEkler: (f: (l: ScEk[]) => ScEk[]) => void;
  ayar: ScAyar; setAyar: (f: (a: ScAyar) => ScAyar) => void; calisiyor?: boolean; kuyruk?: string | null; onKuyrukSil?: () => void;
  onGonder: () => void; onDurdur?: () => void; buyuk?: boolean; yerTutucu?: string; ust?: React.ReactNode; alt?: React.ReactNode;
  odakRef?: React.RefObject<HTMLTextAreaElement | null>;
  /** Taslağın saklanacağı anahtar (sohbet kimliği ya da "ana"). */
  taslakAnahtari?: string;
  /** Boş kutuda ↑: son mesajını düzenle. */
  onSonuDuzenle?: () => void;
  /** Verilirse boş kutuda gönder düğmesinin yerine "Sesli sohbet" düğmesi çıkar (ChatGPT gibi). */
  onSesliMod?: () => void;
}) {
  const icRef = useRef<HTMLTextAreaElement>(null);
  const ta = odakRef ?? icRef;
  const dosyaRef = useRef<HTMLInputElement>(null);
  const [menu, setMenu] = useState<"arti" | "arac" | "stil" | "karsilastir" | "model" | null>(null);
  const [surukle, setSurukle] = useState(false);
  const [dinliyor, setDinliyor] = useState(false);
  const [onizle, setOnizle] = useState<ScEk | null>(null);
  const [komutSec, setKomutSec] = useState(0);
  const tanima = useRef<{ stop: () => void } | null>(null);
  const model = ayar.model === SC_OTOMATIK.id ? { ...SC_OTOMATIK, ana: true as const } : SC_MODELLER.find((m) => m.id === ayar.model) ?? SC_MODELLER[0];
  /** Düşünme düzeyi: açıkça seçilmediyse eski "Uzun düşün" bayrağından türetilir. */
  const efor: ScEfor = ayar.efor ?? (ayar.dusun ? "yuksek" : "orta");
  const [digerAcik, setDigerAcik] = useState(false);
  const [saglayiciSekme, setSaglayiciSekme] = useState<"anthropic" | "openai" | "google">("anthropic");
  const komutAra = /^\/(\S*)$/.exec(metin)?.[1]?.toLocaleLowerCase("tr");
  const beceriAcik = useScBeceri((s) => s.acik);
  const beceriOzel = useScBeceri((s) => s.ozel);
  const beceriler = [...beceriOzel, ...HAZIR_BECERILER].filter((b) => beceriAcik.includes(b.id));
  const seciliBeceri = ayar.beceri ? [...beceriOzel, ...HAZIR_BECERILER].find((b) => b.id === ayar.beceri) : undefined;
  const tumKomutlar = [...KOMUTLAR, ...beceriler.map((b) => ({ ad: b.komut, alt: b.aciklama || b.ad, ikon: Zap, uygula: (a: ScAyar): ScAyar => ({ ...a, beceri: b.id }) }))];
  const komutlar = komutAra !== undefined ? tumKomutlar.filter((k) => k.ad.startsWith(komutAra)).slice(0, 9) : [];
  /* "@" ile çalışan anma (ChatGPT'de @GPT): seçilen çalışan bu sohbetteki sonraki yanıtları üstlenir. */
  const calisanOzel = useScCalisan((s) => s.ozel);
  const anmaAra = komutAra === undefined ? /(?:^|\s)@([^\s@]*)$/.exec(metin)?.[1]?.toLocaleLowerCase("tr") : undefined;
  const anmalar = anmaAra !== undefined ? [...calisanOzel, ...HAZIR_CALISANLAR].filter((c) => c.ad.toLocaleLowerCase("tr").split(/\s+/).some((k) => k.startsWith(anmaAra)) || c.ad.toLocaleLowerCase("tr").startsWith(anmaAra)).slice(0, 7) : [];
  const anilan = ayar.calisan ? [...calisanOzel, ...HAZIR_CALISANLAR].find((c) => c.id === ayar.calisan) : undefined;
  const ozelStiller = useScStil((s) => s.ozel);
  const ozelStil = ayar.ozelStil ? ozelStiller.find((s) => s.id === ayar.ozelStil) : undefined;
  const [stilPencere, setStilPencere] = useState<{ duzenle?: string } | null>(null);
  const ekranDestek = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia && !dokunmatik();
  const dolu = metin.trim().length > 0 || ekler.length > 0;
  const aracSayisi = Number(!!ayar.kod) + Number(!!ayar.arastir) + Number(ayar.web && !ayar.arastir) + Number((ayar.efor ?? (ayar.dusun ? "yuksek" : "orta")) === "yuksek" || ayar.efor === "max") + Number(ayar.stil !== "normal" || !!ozelStil);
  const aracAcik = menu === "arac" || menu === "stil" || menu === "karsilastir";

  useEffect(() => { setKomutSec(0); }, [komutAra, anmaAra]);

  /* Taslak: açılışta geri yükle, yazdıkça sakla. */
  const taslakYuklendi = useRef(false);
  useEffect(() => {
    if (!taslakAnahtari || taslakYuklendi.current) return;
    taslakYuklendi.current = true;
    try { const t = localStorage.getItem(`sc-taslak:${taslakAnahtari}`); if (t && !metin) setMetin(t); } catch { /* depolama kapalı */ }
  }, [taslakAnahtari]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!taslakAnahtari || !taslakYuklendi.current) return;
    const z = setTimeout(() => { try { if (metin.trim()) localStorage.setItem(`sc-taslak:${taslakAnahtari}`, metin); else localStorage.removeItem(`sc-taslak:${taslakAnahtari}`); } catch { /* yoksay */ } }, 300);
    return () => clearTimeout(z);
  }, [metin, taslakAnahtari]);

  /* Pencereye dosya sürüklenince tam ekran bırakma alanı. */
  useEffect(() => {
    let sayac = 0;
    const gir = (e: DragEvent) => { if (e.dataTransfer?.types.includes("Files")) { sayac++; setSurukle(true); } };
    const cik = () => { sayac = Math.max(0, sayac - 1); if (!sayac) setSurukle(false); };
    const uzerinde = (e: DragEvent) => { if (e.dataTransfer?.types.includes("Files")) e.preventDefault(); };
    const birak = async (e: DragEvent) => {
      if (!e.dataTransfer?.files.length) return;
      e.preventDefault(); sayac = 0; setSurukle(false);
      const yeni = await dosyalariEkle([...e.dataTransfer.files]);
      if (yeni.length) { setEkler((l) => [...l, ...yeni].slice(0, 8)); ta.current?.focus(); }
    };
    window.addEventListener("dragenter", gir); window.addEventListener("dragleave", cik); window.addEventListener("dragover", uzerinde); window.addEventListener("drop", birak);
    return () => { window.removeEventListener("dragenter", gir); window.removeEventListener("dragleave", cik); window.removeEventListener("dragover", uzerinde); window.removeEventListener("drop", birak); };
  }, [setEkler, ta]);

  /* Ctrl+U: dosya ekle. */
  useEffect(() => {
    const t = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") { e.preventDefault(); dosyaRef.current?.click(); } };
    window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t);
  }, []);

  const komutUygula = (i: number) => { const k = komutlar[i]; if (!k) return; setAyar(k.uygula); setMetin(""); ta.current?.focus(); };
  const kapat = () => { setMenu(null); ta.current?.focus(); };
  const anmaUygula = (i: number) => {
    const c = anmalar[i]; if (!c) return;
    setAyar((a) => ({ ...a, calisan: c.id }));
    setMetin(metin.replace(/(^|\s)@[^\s@]*$/, "$1"));
    ta.current?.focus();
  };
  const ekranEkle = async () => {
    setMenu(null);
    try {
      const f = await ekranGoruntusu(); if (!f) return;
      const y = await dosyalariEkle([f]);
      if (y.length) { setEkler((l) => [...l, ...y].slice(0, 8)); toast.success("Ekran görüntüsü eklendi"); }
    } catch (e) {
      if ((e as Error).name !== "NotAllowedError") toast.error("Ekran görüntüsü alınamadı", { description: "Tarayıcı ekran paylaşımına izin vermedi. İzin verip yeniden dene." });
    }
    ta.current?.focus();
  };

  const dikte = () => {
    if (dinliyor) { tanima.current?.stop(); return; }
    const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Sinif = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Sinif) { toast.error("Dikte desteklenmiyor", { description: "Bu tarayıcı sesle yazmayı desteklemiyor. Chrome ya da Edge'de dene." }); return; }
    const r = new Sinif(); r.lang = "tr-TR"; r.continuous = true; r.interimResults = true;
    const taban = metin ? metin.replace(/\s*$/, " ") : "";
    r.onresult = (e) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setMetin(taban + t); };
    r.onend = () => { setDinliyor(false); tanima.current = null; ta.current?.focus(); };
    r.onerror = () => { setDinliyor(false); mesaj.izinGerekli("Mikrofon"); };
    r.start(); tanima.current = r; setDinliyor(true);
  };

  const gonder = () => {
    if (!dolu) return;
    if (dinliyor) tanima.current?.stop();
    if (taslakAnahtari) { try { localStorage.removeItem(`sc-taslak:${taslakAnahtari}`); } catch { /* yoksay */ } }
    onGonder();
  };

  const stilAd = ozelStil?.ad ?? SC_STILLER.find((s) => s.id === ayar.stil)?.ad ?? "";

  return (
    <div className="relative w-full">
      {/* Tam ekran bırakma alanı */}
      <AnimatePresence>
        {surukle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="sc-kapsam pointer-events-none fixed inset-0 z-[300] flex items-center justify-center bg-[#131315]/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.94, y: 8 }} animate={{ scale: 1, y: 0 }} transition={YAY} className="flex flex-col items-center gap-3 rounded-[28px] border-2 border-dashed border-[var(--sc-aksan)]/60 px-16 py-12 text-center">
              <motion.span animate={{ y: [0, -5, 0] }} transition={{ duration: 1.4, repeat: Infinity }}><Upload className="h-8 w-8 text-[var(--sc-aksan)]" /></motion.span>
              <p className="text-[17px] font-semibold text-[var(--sc-metin)]">Dosyaları buraya bırak</p>
              <p className="text-[13.5px] text-[var(--sc-metin-2)]">Görsel, metin ya da kod dosyası · en fazla 8 dosya</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sıradaki mesaj */}
      <AnimatePresence>
        {kuyruk && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={YAY}
            className="mx-4 -mb-3 flex items-center gap-2 rounded-t-[16px] bg-[#18181b] px-3.5 pb-5 pt-2 text-[13px] ring-1 ring-inset ring-white/[0.07]">
            <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--sc-aksan)]" />
            <span className="shrink-0 text-[var(--sc-metin-2)]">Sırada</span>
            <span className="min-w-0 flex-1 truncate text-[var(--sc-metin)]">{kuyruk}</span>
            <span className="shrink-0 text-[12px] text-[var(--sc-metin-3)] max-sm:hidden">yanıt bitince gider</span>
            <button onClick={onKuyrukSil} aria-label="Sıradan kaldır" className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--sc-metin-2)] hover:bg-white/10 hover:text-[var(--sc-metin)]"><X className="h-3.5 w-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "/" komutları — kutunun hemen üstünde */}
      <AnimatePresence>
        {komutlar.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.98 }} transition={{ duration: 0.14 }}
            className={cn(POP, "absolute bottom-full left-0 z-30 mb-2 w-[360px] max-w-full")} role="listbox" aria-label="Komutlar">
            <p className="px-2.5 pb-1 pt-1 text-[12px] font-medium text-[var(--sc-metin-3)]">Komutlar</p>
            {komutlar.map((k, i) => (
              <button key={k.ad} role="option" aria-selected={i === komutSec} onMouseEnter={() => setKomutSec(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => komutUygula(i)}
                className={cn("flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left", i === komutSec && "bg-white/[0.07]")}>
                <k.ikon className="h-4 w-4 shrink-0 text-[var(--sc-aksan)]" />
                <span className="text-[13.5px] font-medium text-[var(--sc-metin)]">/{k.ad}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--sc-metin-3)]">{k.alt}</span>
                {i === komutSec && <kbd className="max-sm:hidden rounded-[4px] bg-white/[0.08] px-1 text-[10.5px] text-[var(--sc-metin-3)]">Tab</kbd>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* "@" çalışan anma */}
      <AnimatePresence>
        {anmaAra !== undefined && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.98 }} transition={{ duration: 0.14 }}
            className={cn(POP, "absolute bottom-full left-0 z-30 mb-2 w-[360px] max-w-full")} role="listbox" aria-label="Çalışanlar">
            <p className="px-2.5 pb-1 pt-1 text-[12px] font-medium text-[var(--sc-metin-3)]">Bir çalışanı sohbete çağır</p>
            {anmalar.map((c, i) => (
              <button key={c.id} role="option" aria-selected={i === komutSec} onMouseEnter={() => setKomutSec(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => anmaUygula(i)}
                className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left", i === komutSec && "bg-white/[0.07]")}>
                <CalisanAvatar c={c} boyut={26} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-[var(--sc-metin)]">{c.ad}</span>
                  <span className="block truncate text-[12px] text-[var(--sc-metin-3)]">{c.aciklama}</span>
                </span>
                {i === komutSec && <kbd className="max-sm:hidden rounded-[4px] bg-white/[0.08] px-1 text-[10.5px] text-[var(--sc-metin-3)]">Tab</kbd>}
              </button>
            ))}
            {anmalar.length === 0 && <p className="px-2.5 py-2 text-[13px] text-[var(--sc-metin-3)]">Bu adla çalışan yok</p>}
            <Link href="/panel/supercomputer/calisanlar" className="mt-1 flex items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-[12.5px] text-[var(--sc-metin-2)] hover:bg-white/[0.05]"><AtSign className="h-3.5 w-3.5" />Tüm çalışanlar</Link>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn("relative rounded-[22px] bg-[#1c1c1f] ring-1 ring-inset transition-[box-shadow] duration-200",
        dinliyor ? "ring-rose-400/40" : "ring-white/[0.08] hover:ring-white/[0.13] focus-within:ring-white/[0.2]", buyuk ? "p-3" : "p-2.5")}
        onPaste={async (e) => {
          const dosyalar = [...e.clipboardData.files];
          if (dosyalar.length) { e.preventDefault(); const y = await dosyalariEkle(dosyalar); if (y.length) setEkler((l) => [...l, ...y].slice(0, 8)); return; }
          const t = e.clipboardData.getData("text");
          if (t.length > UZUN) { e.preventDefault(); setEkler((l) => [...l, { id: yeniId(), tur: "metin" as const, ad: "Yapıştırılan metin", boyut: new Blob([t]).size, icerik: t }].slice(0, 8)); toast("Uzun metin ek olarak eklendi", { description: `${t.split("\n").length.toLocaleString("tr")} satır` }); }
        }}>
        {ust}
        <AnimatePresence initial={false}>
          {ekler.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="-mt-1 flex gap-2 overflow-x-auto px-1 pb-2.5 pt-2.5 [scrollbar-width:none]">
                <AnimatePresence initial={false}>
                  {ekler.map((e) => <EkKarti key={e.id} e={e} onAc={() => setOnizle(e)} onSil={() => setEkler((l) => l.filter((x) => x.id !== e.id))} />)}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <textarea ref={ta} value={metin} onChange={(e) => setMetin(e.target.value)} rows={1} aria-label="Mesaj" spellCheck={false} enterKeyHint="send"
          placeholder={dinliyor ? "Dinliyorum, konuşabilirsin…" : yerTutucu ?? "Usta'ya bir şey sor"}
          onKeyDown={(e) => {
            if (komutlar.length) {
              if (e.key === "ArrowDown") { e.preventDefault(); setKomutSec((i) => (i + 1) % komutlar.length); return; }
              if (e.key === "ArrowUp") { e.preventDefault(); setKomutSec((i) => (i - 1 + komutlar.length) % komutlar.length); return; }
              if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); komutUygula(komutSec); return; }
              if (e.key === "Escape") { e.preventDefault(); setMetin(""); return; }
            }
            if (anmalar.length) {
              if (e.key === "ArrowDown") { e.preventDefault(); setKomutSec((i) => (i + 1) % anmalar.length); return; }
              if (e.key === "ArrowUp") { e.preventDefault(); setKomutSec((i) => (i - 1 + anmalar.length) % anmalar.length); return; }
              if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); anmaUygula(komutSec); return; }
              if (e.key === "Escape") { e.preventDefault(); setMetin(metin.replace(/@[^\s@]*$/, "")); return; }
            }
            if (e.key === "ArrowUp" && !metin && !ekler.length && onSonuDuzenle) { e.preventDefault(); onSonuDuzenle(); return; }
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && !dokunmatik() && (useScTercih.getState().enterGonder || e.ctrlKey || e.metaKey)) { e.preventDefault(); gonder(); }
            else if (e.key === "Escape" && calisiyor) onDurdur?.();
          }}
          className={cn("block max-h-[40vh] w-full resize-none bg-transparent px-2 text-[var(--sc-metin)] caret-[var(--sc-aksan)] outline-none [field-sizing:content] placeholder:text-[var(--sc-metin-3)] [scrollbar-width:thin]",
            buyuk ? "min-h-[60px] py-1.5 text-[16px] leading-relaxed" : "min-h-[28px] py-1 text-[15.5px] leading-relaxed")} />

        <div className="mt-2 flex items-center gap-1">
          {/* + : ekle ve üret */}
          <div className="relative">
            <Ipucu metin="Ekle ve üret" tus="Ctrl U" kapali={menu === "arti"}>
              <button onClick={() => setMenu(menu === "arti" ? null : "arti")} aria-expanded={menu === "arti"} aria-haspopup="menu" aria-label="Ekle ve üret"
                className={cn(ikonDugme(menu === "arti"), "w-8 ring-1 ring-inset", menu === "arti" ? "ring-white/20" : "ring-white/[0.12]")}>
                <Plus className={cn("h-4 w-4 transition-transform duration-200", menu === "arti" && "rotate-45")} />
              </button>
            </Ipucu>
            <AnimatePresence>
              <Yuzen acik={menu === "arti"} onKapat={() => setMenu(null)} yerlesim="ust-sol" bosluk={10} etiket="Ekle ve üret" className={POP} style={{ width: 296 }}>
                <div role="menu">
                  <Satir ikon={Paperclip} ad="Dosya ya da görsel ekle" tus="Ctrl U" onClick={() => { dosyaRef.current?.click(); setMenu(null); }} />
                  {ekranDestek && <Satir ikon={Monitor} ad="Ekran görüntüsü ekle" alt="Bir pencere ya da sekme seç" onClick={() => void ekranEkle()} />}
                  <Satir ikon={AtSign} ad="Çalışan çağır" alt="Yanıtı bir çalışan versin" vurgu={!!anilan} onClick={() => { setMenu(null); setMetin(metin && !/\s$/.test(metin) ? `${metin} @` : `${metin}@`); ta.current?.focus(); }} />
                  <div className="mx-2 my-1 h-px bg-white/[0.07]" />
                  <Satir ikon={ImageIcon} ad="Görsel üret" alt="Tarifinden görsel, kredi harcar" vurgu={ayar.niyet === "gorsel"}
                    sag={ayar.niyet === "gorsel" ? <Check className="h-4 w-4 text-[var(--sc-aksan)]" /> : null}
                    onClick={() => { setAyar((a) => ({ ...a, niyet: a.niyet === "gorsel" ? "oto" : "gorsel" })); kapat(); }} />
                  <Satir ikon={LayoutTemplate} ad="Site, oyun ya da panel kur" alt="Çalışan önizlemeyle" vurgu={ayar.niyet === "site"}
                    sag={ayar.niyet === "site" ? <Check className="h-4 w-4 text-[var(--sc-aksan)]" /> : null}
                    onClick={() => { setAyar((a) => ({ ...a, niyet: a.niyet === "site" ? "oto" : "site" })); kapat(); }} />
                  <Satir ikon={ListChecks} ad="Çok adımlı plan" alt="Görsel, sayfa, metin: önce plan ve kredi tahmini" vurgu={ayar.niyet === "plan"}
                    sag={ayar.niyet === "plan" ? <Check className="h-4 w-4 text-[var(--sc-aksan)]" /> : null}
                    onClick={() => { setAyar((a) => ({ ...a, niyet: a.niyet === "plan" ? "oto" : "plan" })); kapat(); }} />
                  <div className="mx-2 my-1 h-px bg-white/[0.07]" />
                  <p className="px-2.5 pb-1 pt-1 text-[12px] font-medium text-[var(--sc-metin-3)]">Beceriler</p>
                  {beceriler.slice(0, 6).map((b) => (
                    <Satir key={b.id} ikon={Zap} ad={b.ad} alt={`/${b.komut}`} vurgu={ayar.beceri === b.id} sag={ayar.beceri === b.id ? <Check className="h-4 w-4 text-[var(--sc-aksan)]" /> : null}
                      onClick={() => { setAyar((a) => ({ ...a, beceri: a.beceri === b.id ? undefined : b.id })); kapat(); }} />
                  ))}
                  <Link href="/panel/supercomputer/ayarlar/beceriler" onClick={kapat} className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-[13px] text-[var(--sc-metin-2)] hover:bg-white/[0.05] hover:text-[var(--sc-metin)]">
                    <SlidersHorizontal className="h-4 w-4" />{beceriler.length ? "Becerileri yönet" : "Beceri ekle"}<span className="ml-auto text-[12px] text-[var(--sc-metin-3)]">{beceriler.length > 6 ? `+${beceriler.length - 6}` : ""}</span>
                  </Link>
                </div>
              </Yuzen>
            </AnimatePresence>
          </div>

          {/* Araçlar */}
          <div className="relative">
            <Ipucu metin="Araçlar" kapali={aracAcik}>
              <button onClick={() => setMenu(aracAcik ? null : "arac")} aria-expanded={aracAcik} aria-haspopup="menu" aria-label="Araçlar" className={cn(ikonDugme(aracAcik), "relative w-8")}>
                <SlidersHorizontal className="h-4 w-4" />
                <AnimatePresence>
                  {aracSayisi > 0 && (
                    <motion.span key={aracSayisi} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={YAY}
                      className="absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[var(--sc-aksan)] px-1 text-[10px] font-bold text-[var(--sc-aksan-metin)] ring-2 ring-[#1c1c1f]">{aracSayisi}</motion.span>
                  )}
                </AnimatePresence>
              </button>
            </Ipucu>
            <AnimatePresence>
              <Yuzen acik={aracAcik} onKapat={() => setMenu(null)} yerlesim="ust-sol" bosluk={10} etiket="Araçlar" className={cn(POP, "overflow-hidden")} style={{ width: 292 }}>
                <AnimatePresence mode="wait" initial={false}>
                  {menu === "karsilastir" ? (
                    <motion.div key="kars" role="menu" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }} transition={{ duration: 0.14 }}>
                      <button onClick={() => setMenu("arac")} className="mb-1 flex w-full items-center gap-1.5 rounded-[10px] px-2 py-1.5 text-[13px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.05] hover:text-[var(--sc-metin)]"><ChevronRight className="h-3.5 w-3.5 rotate-180" />{model.ad} ile karşılaştır</button>
                      {ayar.karsilastir && <Satir ikon={X} ad="Karşılaştırmayı kapat" onClick={() => { setAyar((a) => ({ ...a, karsilastir: undefined })); kapat(); }} />}
                      {SC_MODELLER.filter((m) => m.id !== ayar.model && m.ana).map((m) => <Satir key={m.id} ikon={Columns2} ad={m.ad} alt={m.alt} vurgu={ayar.karsilastir === m.id} sag={ayar.karsilastir === m.id ? <Check className="h-4 w-4 text-[var(--sc-aksan)]" /> : null} onClick={() => { setAyar((a) => ({ ...a, karsilastir: m.id })); kapat(); }} />)}
                    </motion.div>
                  ) : menu === "stil" ? (
                    <motion.div key="stil" role="menu" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }} transition={{ duration: 0.14 }}>
                      <button onClick={() => setMenu("arac")} className="mb-1 flex w-full items-center gap-1.5 rounded-[10px] px-2 py-1.5 text-[13px] font-medium text-[var(--sc-metin-2)] hover:bg-white/[0.05] hover:text-[var(--sc-metin)]"><ChevronRight className="h-3.5 w-3.5 rotate-180" />Yanıt stili</button>
                      {SC_STILLER.map((s) => <Satir key={s.id} ikon={Palette} ad={s.ad} alt={s.alt} vurgu={ayar.stil === s.id && !ozelStil} sag={ayar.stil === s.id && !ozelStil ? <Check className="h-4 w-4 text-[var(--sc-aksan)]" /> : null} onClick={() => { setAyar((a) => ({ ...a, stil: s.id, ozelStil: undefined })); kapat(); }} />)}
                      {ozelStiller.length > 0 && <p className="px-2.5 pb-1 pt-2 text-[12px] font-medium text-[var(--sc-metin-3)]">Senin stillerin</p>}
                      {ozelStiller.map((s) => (
                        <div key={s.id} className={cn("group/st flex items-center rounded-[10px] hover:bg-white/[0.06]", ayar.ozelStil === s.id && "bg-[var(--sc-aksan)]/[0.08]")}>
                          <button role="menuitem" onClick={() => { setAyar((a) => ({ ...a, stil: "normal", ozelStil: s.id })); kapat(); }} className="flex min-w-0 flex-1 items-center gap-3 px-2.5 py-2 text-left">
                            <PenLine className={cn("h-4 w-4 shrink-0", ayar.ozelStil === s.id ? "text-[var(--sc-aksan)]" : "text-[var(--sc-metin-2)]")} />
                            <span className="min-w-0 flex-1 truncate text-[13.5px] text-[var(--sc-metin)]">{s.ad}</span>
                            {ayar.ozelStil === s.id && <Check className="h-4 w-4 text-[var(--sc-aksan)]" />}
                          </button>
                          <button onClick={() => { setMenu(null); setStilPencere({ duzenle: s.id }); }} aria-label={`${s.ad} stilini düzenle`} className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--sc-metin-3)] opacity-0 hover:bg-white/[0.08] hover:text-[var(--sc-metin)] focus:opacity-100 group-hover/st:opacity-100 max-sm:opacity-100"><SlidersHorizontal className="h-3.5 w-3.5" /></button>
                        </div>
                      ))}
                      <div className="mx-2 my-1 h-px bg-white/[0.07]" />
                      <Satir ikon={Plus} ad="Stil oluştur" alt="Yazı örneğinden ya da tarif ederek" onClick={() => { setMenu(null); setStilPencere({}); }} />
                    </motion.div>
                  ) : (
                    <motion.div key="arac" role="menu" initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.14 }}>
                      <Satir ikon={Telescope} ad="Derin araştırma" alt="Çok kaynaklı, ayrıntılı rapor" vurgu={!!ayar.arastir} sag={<Anahtar acik={!!ayar.arastir} />} onClick={() => setAyar((a) => ({ ...a, arastir: !a.arastir }))} />
                      <Satir ikon={Globe} ad="Web'de ara" alt={ayar.arastir ? "Derin araştırmada hep açık" : "Güncel bilgi, kaynaklı yanıt"} vurgu={ayar.web || !!ayar.arastir} sag={<Anahtar acik={ayar.web || !!ayar.arastir} />} onClick={() => setAyar((a) => (a.arastir ? a : { ...a, web: !a.web }))} />
                      <Satir ikon={Columns2} ad="Modelleri karşılaştır" alt={ayar.karsilastir ? `${model.ad} ile ${SC_MODELLER.find((m) => m.id === ayar.karsilastir)?.ad} yan yana` : "Aynı soruyu iki modele sor"} vurgu={!!ayar.karsilastir}
                        sag={<ChevronRight className="h-4 w-4 text-[var(--sc-metin-3)]" />} onClick={() => setMenu("karsilastir")} />
                      <Satir ikon={TerminalSquare} ad="Kod çalıştır" alt="Python ile hesap, veri ve grafik" vurgu={!!ayar.kod} sag={<Anahtar acik={!!ayar.kod} />} onClick={() => setAyar((a) => ({ ...a, kod: !a.kod }))} />
                      <Satir ikon={Brain} ad="Uzun düşün" alt="Düşünme düzeyini yükseltir" vurgu={efor === "yuksek" || efor === "max"} sag={<Anahtar acik={efor === "yuksek" || efor === "max"} />} onClick={() => setAyar((a) => { const acik = (a.efor ?? (a.dusun ? "yuksek" : "orta")) === "yuksek" || a.efor === "max"; return { ...a, dusun: !acik, efor: acik ? "orta" : "yuksek" }; })} />
                      <Satir ikon={Palette} ad="Yanıt stili" alt={stilAd} vurgu={ayar.stil !== "normal"} sag={<ChevronRight className="h-4 w-4 text-[var(--sc-metin-3)]" />} onClick={() => setMenu("stil")} />
                      <div className="mx-2 my-1 h-px bg-white/[0.07]" />
                      <Satir ikon={ShieldCheck} ad="Üretmeden önce sor" alt="Kredi harcayan işlerde onay iste" vurgu={ayar.sor} sag={<Anahtar acik={ayar.sor} />} onClick={() => setAyar((a) => ({ ...a, sor: !a.sor }))} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Yuzen>
            </AnimatePresence>
          </div>

          {/* Açık modlar */}
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pl-0.5 pr-3 [mask-image:linear-gradient(to_right,black_calc(100%-14px),transparent)] [scrollbar-width:none]">
            <AnimatePresence initial={false} mode="popLayout">
              {ayar.niyet === "gorsel" && <Hap key="g" ikon={ImageIcon} ad="Görsel" vurgu onSil={() => setAyar((a) => ({ ...a, niyet: "oto" }))} />}
              {ayar.niyet === "plan" && <Hap key="pl" ikon={ListChecks} ad="Plan" vurgu onSil={() => setAyar((a) => ({ ...a, niyet: "oto" }))} />}
              {ayar.niyet === "site" && <Hap key="s" ikon={LayoutTemplate} ad="Site kur" vurgu onSil={() => setAyar((a) => ({ ...a, niyet: "oto" }))} />}
              {anilan && <Hap key="cl" ikon={AtSign} ad={anilan.ad} vurgu bas={<CalisanAvatar c={anilan} boyut={18} />} onSil={() => setAyar((a) => ({ ...a, calisan: undefined }))} />}
              {seciliBeceri && <Hap key="bc" ikon={Zap} ad={seciliBeceri.ad} vurgu onSil={() => setAyar((a) => ({ ...a, beceri: undefined }))} />}
              {ayar.arastir && <Hap key="ar" ikon={Telescope} ad="Derin araştırma" vurgu onSil={() => setAyar((a) => ({ ...a, arastir: false }))} />}
              {ayar.web && !ayar.arastir && <Hap key="w" ikon={Globe} ad="Web" onSil={() => setAyar((a) => ({ ...a, web: false }))} />}
              {ayar.karsilastir && ayar.karsilastir !== ayar.model && <Hap key="ks" ikon={Columns2} ad={`+ ${SC_MODELLER.find((m) => m.id === ayar.karsilastir)?.ad ?? "Model"}`} vurgu onSil={() => setAyar((a) => ({ ...a, karsilastir: undefined }))} />}
              {ayar.kod && <Hap key="kd" ikon={TerminalSquare} ad="Kod" onSil={() => setAyar((a) => ({ ...a, kod: false }))} />}
              {(efor === "yuksek" || efor === "max") && <Hap key="d" ikon={Brain} ad={efor === "max" ? "En yüksek düşünme" : "Uzun düşün"} onSil={() => setAyar((a) => ({ ...a, dusun: false, efor: "orta" }))} />}
              {(ayar.stil !== "normal" || ozelStil) && <Hap key="st" ikon={ozelStil ? PenLine : Palette} ad={stilAd} onSil={() => setAyar((a) => ({ ...a, stil: "normal", ozelStil: undefined }))} />}
            </AnimatePresence>
          </div>

          {metin.length > 1500 && <span className={cn("shrink-0 px-1 text-[12px] tabular-nums", metin.length > 20000 ? "text-amber-300" : "text-[var(--sc-metin-3)]")}>{metin.length.toLocaleString("tr")}</span>}

          {/* Model */}
          <div className="relative shrink-0">
            <button onClick={() => { if (menu !== "model") setSaglayiciSekme("saglayici" in model ? model.saglayici : "anthropic"); setMenu(menu === "model" ? null : "model"); }} aria-expanded={menu === "model"} aria-haspopup="menu" aria-label={`Model: ${model.ad}`}
              className={cn(ikonDugme(menu === "model"), "px-2.5 text-[13px] font-medium")}>
              <span className="max-sm:hidden">{model.ad}</span><span className="sm:hidden">{model.ad.split(" ")[0]}</span><ChevronDown className={cn("h-3.5 w-3.5 transition-transform", menu === "model" && "rotate-180")} />
            </button>
            <AnimatePresence>
              <Yuzen acik={menu === "model"} onKapat={() => setMenu(null)} yerlesim="ust-sag" bosluk={10} etiket="Model" className={cn(POP, "!p-0 overflow-hidden")} style={{ width: 340 }}>
                <div role="menu">
                  <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2.5">
                    <span className="text-[13.5px] font-semibold text-[var(--sc-metin)]">Model</span>
                    <span className="ml-auto flex items-center gap-1.5 rounded-full bg-white/[0.085] py-0.5 pl-1.5 pr-2.5 text-[12px] font-medium text-[var(--sc-metin-2)]">
                      {model.id === SC_OTOMATIK.id ? <Sparkles className="h-3 w-3" /> : <ModelLogo ad={"saglayici" in model && model.saglayici === "openai" ? "gpt" : "saglayici" in model && model.saglayici === "google" ? "gemini" : "claude"} boyut={13} />}{model.ad}
                    </span>
                  </div>
                  <div className="p-1.5">
                    <button role="menuitemradio" aria-checked={ayar.model === SC_OTOMATIK.id} onClick={() => { setAyar((a) => ({ ...a, model: SC_OTOMATIK.id })); kapat(); }}
                      className={cn("relative flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2 text-left transition-colors", ayar.model === SC_OTOMATIK.id ? "bg-white/[0.085]" : "hover:bg-white/[0.055]")}>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#55d6fd] to-[#8b7bff] text-[#0b0b0c]"><Sparkles className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold text-[var(--sc-metin)]">{SC_OTOMATIK.ad}</span><span className="block truncate text-[12px] text-[var(--sc-metin-3)]">{SC_OTOMATIK.alt}</span></span>
                      {ayar.model === SC_OTOMATIK.id && <span className="pointer-events-none absolute inset-0 rounded-[12px] ring-1 ring-inset ring-white/50" />}
                    </button>
                  </div>
                  <div className="px-1.5">
                    <div role="tablist" aria-label="Sağlayıcı" className="grid grid-cols-3 gap-0.5 rounded-full bg-black/25 p-0.5 ring-1 ring-inset ring-white/[0.07]">
                      {(["anthropic", "openai", "google"] as const).map((k) => (
                        <button key={k} role="tab" aria-selected={saglayiciSekme === k} onClick={() => setSaglayiciSekme(k)}
                          className={cn("relative flex h-8 items-center justify-center gap-1.5 rounded-full text-[12.5px] font-semibold transition-colors", saglayiciSekme === k ? "text-[#0b0b0c]" : "text-[var(--sc-metin-2)] hover:text-[var(--sc-metin)]")}>
                          {saglayiciSekme === k && <motion.span layoutId="sc-saglayici" transition={YAY} className="absolute inset-0 rounded-full bg-white" />}
                          <span className="relative flex items-center gap-1.5"><ModelLogo ad={k === "openai" ? "gpt" : k === "google" ? "gemini" : "claude"} boyut={14} />{SAGLAYICI_ADI[k]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-1.5 [scrollbar-width:thin]">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div key={saglayiciSekme} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.14 }}>
                        {SC_MODELLER.filter((m) => m.saglayici === saglayiciSekme).map((m, i) => {
                          const sec = m.id === ayar.model;
                          const rozet = m.id === "claude-fable-5-1" || m.id === "gpt-6-astra" || m.id === "gemini-4-argon" ? "En güçlü" : m.id === "claude-haiku-5-5" || m.id === "gpt-6-luna" || m.id === "gemini-3.5-flash-lite" ? "En hızlı" : m.id === SC_VARSAYILAN_MODEL ? "Varsayılan" : !m.ana && m.saglayici === "anthropic" ? "Önceki nesil" : null;
                          return (
                            <button key={m.id} role="menuitemradio" aria-checked={sec} onClick={() => { setAyar((a) => ({ ...a, model: m.id })); kapat(); }}
                              className={cn("relative flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2 text-left transition-colors", sec ? "bg-white/[0.085]" : "hover:bg-white/[0.055]", !m.ana && m.saglayici === "anthropic" && i > 0 && "opacity-90")}>
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.065]"><ModelLogo ad={m.saglayici === "openai" ? "gpt" : m.saglayici === "google" ? "gemini" : "claude"} boyut={16} /></span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2 text-[13.5px] font-semibold text-[var(--sc-metin)]">{m.ad}{rozet && <span className={cn("rounded-full px-1.5 text-[10.5px] font-medium leading-[17px]", rozet === "En güçlü" ? "bg-[#55d6fd]/15 text-[#9be6ff]" : "bg-white/[0.085] text-[var(--sc-metin-3)]")}>{rozet}</span>}</span>
                                <span className="block truncate text-[12px] text-[var(--sc-metin-3)]">{m.alt}</span>
                              </span>
                              {sec && <span className="pointer-events-none absolute inset-0 rounded-[12px] ring-1 ring-inset ring-white/50" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  {/* Düşünme düzeyi (yalnız Claude modellerinde geçerli) */}
                  {(!("saglayici" in model) || model.saglayici === "anthropic") && (
                    <div className="border-t border-white/[0.06] px-3 pb-3 pt-2.5">
                      <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--sc-metin)]"><Brain className="h-3.5 w-3.5" />Düşünme düzeyi<span className="ml-auto font-normal text-[var(--sc-metin-3)]">{SC_EFORLAR.find((e) => e.id === efor)?.alt}</span></p>
                      <div role="radiogroup" aria-label="Düşünme düzeyi" className="grid grid-cols-4 gap-0.5 rounded-full bg-black/25 p-0.5 ring-1 ring-inset ring-white/[0.07]">
                        {SC_EFORLAR.map((e) => (
                          <button key={e.id} role="radio" aria-checked={efor === e.id} onClick={() => setAyar((a) => ({ ...a, efor: e.id, dusun: e.id === "yuksek" || e.id === "max" }))}
                            className={cn("relative h-8 rounded-full text-[12px] font-semibold transition-colors", efor === e.id ? "text-[#0b0b0c]" : "text-[var(--sc-metin-3)] hover:text-[var(--sc-metin)]")}>
                            {efor === e.id && <motion.span layoutId="sc-efor" transition={YAY} className="absolute inset-0 rounded-full bg-white" />}
                            <span className="relative">{e.ad}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Yuzen>
            </AnimatePresence>
          </div>

          {/* Dikte */}
          <Ipucu metin={dinliyor ? "Dikteyi bitir" : "Sesle yaz"} hiza="sag">
            <button onClick={dikte} aria-pressed={dinliyor} aria-label={dinliyor ? "Dikteyi bitir" : "Sesle yaz"}
              className={cn("flex h-8 shrink-0 items-center justify-center rounded-full transition-colors", dinliyor ? "gap-[3px] bg-rose-500/15 px-3 text-rose-300" : "w-8 text-[var(--sc-metin-2)] hover:bg-white/[0.06] hover:text-[var(--sc-metin)]")}>
              {dinliyor ? [0, 1, 2, 3].map((i) => <motion.span key={i} className="w-[3px] rounded-full bg-current" animate={{ height: [5, 14, 7, 12, 5] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12 }} />) : <Mic className="h-4 w-4" />}
            </button>
          </Ipucu>

          {/* Gönder / durdur / sıraya ekle */}
          <AnimatePresence mode="popLayout" initial={false}>
            {calisiyor && dolu && (
              <motion.span key="sira" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={YAY}>
                <Ipucu metin="Yanıt bitince gönderilir" tus="Enter" hiza="sag">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={gonder} aria-label="Sıraya ekle" className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.1] px-3 text-[13px] font-medium text-[var(--sc-metin)] hover:bg-white/[0.14]">
                    <Clock className="h-3.5 w-3.5" />Sıraya ekle
                  </motion.button>
                </Ipucu>
              </motion.span>
            )}
            {calisiyor ? (
              <motion.span key="dur" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={YAY}>
                <Ipucu metin="Durdur" tus="Esc" hiza="sag">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={onDurdur} aria-label="Durdur" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--sc-metin)] text-[#111113]">
                    <Square className="h-3 w-3 fill-current" />
                  </motion.button>
                </Ipucu>
              </motion.span>
            ) : !dolu && onSesliMod ? (
              <motion.span key="sesli" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={YAY}>
                <Ipucu metin="Sesli sohbet" hiza="sag">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={onSesliMod} aria-label="Sesli sohbet" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--sc-metin)] text-[#111113] transition-colors hover:bg-white">
                    <AudioLines className="h-[18px] w-[18px]" strokeWidth={2.2} />
                  </motion.button>
                </Ipucu>
              </motion.span>
            ) : (
              <motion.span key="gonder" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={YAY}>
                <Ipucu metin={dolu ? "Gönder" : "Önce bir mesaj yaz"} tus={dolu ? "Enter" : undefined} hiza="sag">
                  <motion.button whileTap={dolu ? { scale: 0.9 } : undefined} onClick={gonder} disabled={!dolu} aria-label="Gönder"
                    className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-[background,color] duration-200",
                      dolu ? "bg-[var(--sc-aksan)] text-[var(--sc-aksan-metin)] hover:bg-[var(--sc-aksan-koyu)]" : "cursor-default bg-white/[0.07] text-[var(--sc-metin-3)]")}>
                    <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.4} />
                  </motion.button>
                </Ipucu>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <input ref={dosyaRef} type="file" multiple className="hidden" accept="image/png,image/jpeg,image/webp,image/gif,.txt,.md,.csv,.json,.ts,.tsx,.js,.py,.html,.css,.sql,.yml,.yaml"
          onChange={async (e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; const y = await dosyalariEkle(f); if (y.length) { setEkler((l) => [...l, ...y].slice(0, 8)); ta.current?.focus(); } }} />
      </div>
      {alt}
      {onizle && <EkOnizleme e={onizle} onKapat={() => setOnizle(null)} />}
      {stilPencere && <StilPenceresi duzenle={stilPencere.duzenle ? ozelStiller.find((x) => x.id === stilPencere.duzenle) : undefined} onKapat={() => setStilPencere(null)}
        onKaydet={(sid) => setAyar((a) => ({ ...a, stil: "normal", ozelStil: sid }))} />}
    </div>
  );
}

type SpeechRec = {
  lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onend: () => void; onerror: () => void;
};
