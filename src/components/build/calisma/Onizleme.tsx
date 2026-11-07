"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  AlertTriangle, Check, ChevronDown, Copy, ExternalLink, FileText, Gamepad2, Loader2, MessageSquarePlus, Monitor, MousePointer2, RotateCw, SlidersHorizontal,
  Smartphone, Tablet, Terminal, Type, Wand2, X, LayoutGrid, Gauge, History, RotateCcw, Moon, Sun, SunMoon, PenTool, Columns2 } from "lucide-react";
import { CizimKatmani } from "./CizimKatmani";
import { KaynakKiyas } from "./KaynakKiyas";
import { ExpoPaneli } from "./ExpoPaneli";
import qrcode from "qrcode-generator";
import { api, ApiHatasi, yayinAdresi } from "@/lib/build/istemci";
import type { Proje } from "@/lib/build/tipler";
import { cn } from "@/lib/utils";
import { gorselDegistir, metniDegistir, ogeSil, oyunAyarlari, stilUygula } from "./kaynak";
import { konumBul } from "./kaynakKonum";
import { TasarimPaneli, useBekleyen, type TBilgi } from "./TasarimPaneli";
import { DenetimPaneli, type DenetimSonuc } from "./DenetimPaneli";
import { CIHAZLAR, CihazMenusu, type CihazOlcu } from "./Cihazlar";
import { GorselDegistirici } from "./GorselDegistirici";
import { SayfaPanosu } from "./SayfaPanosu";
import type { ProjeKanca } from "./useProje";

const yay = { type: "spring" as const, stiffness: 460, damping: 38 };
type Cihaz = "masaustu" | "tablet" | "telefon";
export type Secim = { secici: string; etiket: string; metin?: string; gorsel?: string | null; stil: Record<string, string>; sayfa: string; kutu?: { w: number; h: number } };
type Gunluk = { seviye: string; metin: string; zaman: number };

const GENISLIK: Record<Cihaz, number | null> = { masaustu: null, tablet: 820, telefon: 390 };

export function QrKod({ adres, boyut = 132 }: { adres: string; boyut?: number }) {
  const { yol, n } = useMemo(() => {
    const q = qrcode(0, "M"); q.addData(adres); q.make();
    const n = q.getModuleCount(); let yol = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) yol += `M${c},${r}h1v1h-1z`;
    return { yol, n };
  }, [adres]);
  return <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} width={boyut} height={boyut} className="rounded-[14px] bg-white" shapeRendering="crispEdges"><path d={yol} fill="#000" /></svg>;
}

/** mobilGizli: dar ekranda araç çubuğu taşmasın diye gizlenir (komut paletinden ya da masaüstünde erişilir). */
function Arac({ ikon: I, et, aktif, onClick, kapali, mobilGizli }: { ikon: typeof Monitor; et: string; aktif?: boolean; onClick: () => void; kapali?: boolean; mobilGizli?: boolean }) {
  return (
    <button type="button" title={et} aria-label={et} disabled={kapali} onClick={onClick} className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-30", mobilGizli && "max-md:hidden", aktif ? "bg-white text-black" : "text-white/60 hover:bg-white/[0.07] hover:text-white")}>
      <I className="h-4 w-4" />
    </button>
  );
}

/* ── Oyun ayarları (ayarlar.json → kaydırıcılar, kredisiz) ── */
function OyunPaneli({ json, kaydet, kapat }: { json: string; kaydet: (yeni: string) => void; kapat: () => void }) {
  const ayarlar = useMemo(() => oyunAyarlari(json), [json]);
  const [d, setD] = useState<Record<string, number>>({});
  const zaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  if (!ayarlar) return null;
  const degis = (k: string, v: number) => {
    const yeni = { ...d, [k]: v };
    setD(yeni);
    if (zaman.current) clearTimeout(zaman.current);
    zaman.current = setTimeout(() => {
      try {
        const o = JSON.parse(json) as Record<string, { deger: number }>;
        for (const [a, b] of Object.entries(yeni)) if (o[a]) o[a].deger = b;
        kaydet(JSON.stringify(o, null, 2) + "\n");
      } catch { /* bozuk json */ }
    }, 700);
  };
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={yay}
      className="absolute bottom-3 left-3 z-20 w-[260px] rounded-[18px] bg-[#17181b]/95 p-3.5 ring-1 ring-inset ring-white/[0.1] backdrop-blur-xl max-sm:inset-x-3 max-sm:w-auto">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-white"><Gamepad2 className="h-4 w-4 text-white/60" />Oyun ayarları</p>
        <span className="flex items-center gap-1"><span className="text-[11px] text-white/40">kredisiz</span><button type="button" onClick={kapat} aria-label="Kapat" className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.07] hover:text-white"><X className="h-3.5 w-3.5" /></button></span>
      </div>
      <div className="space-y-2.5">
        {ayarlar.map((a) => {
          const v = d[a.anahtar] ?? a.deger;
          return (
            <label key={a.anahtar} className="block text-[12px]">
              <span className="mb-1 flex justify-between text-white/70"><span>{a.etiket}</span><span className="tabular-nums text-white/50">{v.toLocaleString("tr-TR", { maximumFractionDigits: 3 })}</span></span>
              <input type="range" min={a.min} max={a.max} step={a.adim} value={v} onChange={(e) => degis(a.anahtar, Number(e.target.value))} className="h-1 w-full accent-white" />
            </label>
          );
        })}
      </div>
      <p className="mt-2.5 text-[11px] leading-snug text-white/35">Değişiklik kaydedilir ve oyun yeniden başlar.</p>
    </motion.div>
  );
}

/**
 * Önizleme: projenin gerçek dosyaları kum havuzlu iframe'de çalışır (/api/build/onizleme/…).
 * Köprü üzerinden sayfa adı, hatalar, konsol, öğe seçimi ve yerinde metin düzenleme gelir.
 */
export function Onizleme({ k, secim, setSecim, ajanaYaz, duzelt, mobilQr, secimIstegi, isaretleriGonder, eskiSurum, eskiKapat, eskiyeDon, denetimIstegi, cizimEkle }: {
  k: ProjeKanca; secim: Secim | null; secimIstegi?: number; setSecim: (s: Secim | null) => void; ajanaYaz: (s: Secim) => void; duzelt: (hata: string) => void; mobilQr?: boolean; isaretleriGonder?: (metin: string) => void;
  /** Salt okunur eski sürüm önizlemesi (Geçmiş panelinden). */ eskiSurum?: { id: string; no: number; aciklama: string; zaman: number } | null; eskiKapat?: () => void; eskiyeDon?: (id: string) => void;
  /** Komut paletinden denetimi açma isteği (sayaç). */ denetimIstegi?: number;
  /** Önizleme üstüne yapılan çizimin görüntüsünü ve notunu komut kutusuna ekler. */ cizimEkle?: (gorsel: string, not: string) => void;
}) {
  const p = k.proje as Proje;
  const cerceve = useRef<HTMLIFrameElement>(null);
  const [cihaz, setCihaz] = useState<Cihaz>(p.tur === "mobil" ? "telefon" : "masaustu");
  const [sayfa, setSayfa] = useState("index.html");
  const [mod, setMod] = useState<null | "secim" | "metin" | "isaret">(null);
  const [isaretler, setIsaretler] = useState<{ secici: string; etiket: string; metin: string; sayfa: string; not: string }[]>([]);
  const [hatalar, setHatalar] = useState<{ mesaj: string; kaynak: string; satir: number }[]>([]);
  const [gunluk, setGunluk] = useState<Gunluk[]>([]);
  const [konsol, setKonsol] = useState(false);
  const [konsolSuz, setKonsolSuz] = useState<"hepsi" | "error" | "warn" | "log">("hepsi");
  const [sayfaMenu, setSayfaMenu] = useState(false);
  const [oyunAcik, setOyunAcik] = useState(true);
  const [kopya, setKopya] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [anahtar, setAnahtar] = useState(0);
  const [pano, setPano] = useState(false);
  /* Cihaz: hazır cihaz listesi ya da özel boyut, yatay ve dikey yön; sahneye sığacak şekilde ölçeklenir. */
  const [ozelCihaz, setOzelCihaz] = useState<CihazOlcu | null>(null);
  const [yatay, setYatay] = useState(false);
  const sahne = useRef<HTMLDivElement>(null);
  const [sahneOlcu, setSahneOlcu] = useState({ w: 0, h: 0 });
  useEffect(() => { const el = sahne.current; if (!el) return; const ro = new ResizeObserver(() => setSahneOlcu({ w: el.clientWidth, h: el.clientHeight })); ro.observe(el); return () => ro.disconnect(); }, []);
  /* Denetim paneli (erişilebilirlik ve performans). */
  const [denetimAcik, setDenetimAcik] = useState(false);
  const [denetim, setDenetim] = useState<DenetimSonuc | null>(null);
  const [taraniyor, setTaraniyor] = useState(false);
  const taramaZaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* Tasarım paneli: katman bilgisi, ölçü katmanı ve bekleyen (tek sürümde uygulanacak) düzenlemeler. */
  const [bilgi, setBilgi] = useState<TBilgi | null>(null);
  const [olcu, setOlcu] = useState(false);
  /* Tema taklidi (prefers-color-scheme), çizim katmanı, orijinal siteyle kıyas, Expo Go paneli. */
  const [tema, setTema] = useState<null | "acik" | "koyu">(null);
  const [temaBilgi, setTemaBilgi] = useState<{ medya: number; sinif: boolean } | null>(null);
  const [cizim, setCizim] = useState(false);
  const [kiyas, setKiyas] = useState(false);
  const [expo, setExpo] = useState(false);
  const kaydirmaBekleyen = useRef<((v: { y: number; w: number; h: number } | null) => void) | null>(null);

  const sayfalar = useMemo(() => Object.keys(p.dosyalar).filter((y) => y.endsWith(".html")).sort((a, b) => (a === "index.html" ? -1 : b === "index.html" ? 1 : a.localeCompare(b))), [p.dosyalar]);
  const bos = !Object.keys(p.dosyalar).length;
  const kok = `/api/build/onizleme/${p.id}/${p.onizlemeBelirteci}`;
  const src = eskiSurum ? `/api/build/onizleme/${p.id}/${p.onizlemeBelirteci}~${eskiSurum.id}/${sayfa === "index.html" ? "" : sayfa}?v=${anahtar}` : `${kok}/${sayfa === "index.html" ? "" : sayfa}?v=${k.onizlemeAnahtari}-${anahtar}`;
  const adres = `${yayinAdresi(p.ayarlar.altAlan).gorunen}/${sayfa === "index.html" ? "" : sayfa.replace(/\.html$/, "")}`;
  const oyunJson = p.dosyalar["ayarlar.json"];

  useEffect(() => { if (secimIstegi) setMod("secim"); }, [secimIstegi]);
  const ilet = useCallback((m: Record<string, unknown>) => cerceve.current?.contentWindow?.postMessage({ vayra: 1, ...m }, "*"), []);
  const b = useBekleyen(ilet);
  const tara = useCallback(() => { setTaraniyor(true); ilet({ tur: "tDenetle", bekle: 400 }); if (taramaZaman.current) clearTimeout(taramaZaman.current); taramaZaman.current = setTimeout(() => setTaraniyor(false), 12000); }, [ilet]);
  useEffect(() => { setDenetim(null); }, [src, ozelCihaz, yatay]);
  useEffect(() => { if (denetimIstegi) { setDenetimAcik(true); setMod(null); setSecim(null); } }, [denetimIstegi, setSecim]);
  useEffect(() => { if (eskiSurum) { setMod(null); setSecim(null); setPano(false); } }, [eskiSurum, setSecim]);
  const bRef = useRef(b); bRef.current = b;
  const secimRef = useRef(secim); secimRef.current = secim;
  const bilgiRef = useRef(bilgi); bilgiRef.current = bilgi;
  useEffect(() => { ilet({ tur: "tOlcu", secici: olcu && secim && mod === "secim" ? secim.secici : null }); }, [olcu, secim, mod, ilet]);

  useEffect(() => { setHatalar([]); setYukleniyor(true); }, [src]);
  useEffect(() => { ilet({ tur: "tema", tema }); }, [tema, ilet]);
  useEffect(() => { if (eskiSurum || pano) setCizim(false); }, [eskiSurum, pano]);
  /** Çizim için önizlemenin o anki görüntüsü: kaydırma konumu köprüden alınır, sunucuda gerçek tarayıcıyla çekilir. */
  const goruntuAl = useCallback(async (): Promise<string | null> => {
    const kd = await new Promise<{ y: number; w: number; h: number } | null>((ok) => { kaydirmaBekleyen.current = ok; ilet({ tur: "kaydirma" }); setTimeout(() => { if (kaydirmaBekleyen.current === ok) { kaydirmaBekleyen.current = null; ok(null); } }, 1500); });
    try {
      const v = await api<{ gorsel: string }>(`/api/build/onizleme-cek/${p.id}`, { govde: { sayfa, genislik: kd?.w ?? 1280, yukseklik: kd?.h ?? 800, y: kd?.y ?? 0, tema, surum: eskiSurum?.id } });
      return v.gorsel;
    } catch (e) { if (e instanceof ApiHatasi && e.durum !== 501) throw e; return null; }
  }, [ilet, p.id, sayfa, tema, eskiSurum?.id]);
  useEffect(() => { ilet({ tur: "mod", mod: mod === "isaret" ? "secim" : mod }); }, [mod, ilet, k.onizlemeAnahtari]);

  useEffect(() => {
    const al = (e: MessageEvent) => {
      if (e.source !== cerceve.current?.contentWindow) return;
      const m = e.data as Record<string, unknown>;
      if (!m || m.vayra !== 1) return;
      if (m.tur === "temaBilgi") { setTemaBilgi({ medya: Number(m.medya) || 0, sinif: !!m.sinif }); return; }
      if (m.tur === "kaydirma") { const f = kaydirmaBekleyen.current; kaydirmaBekleyen.current = null; f?.({ y: Number(m.y) || 0, w: Number(m.w) || 0, h: Number(m.h) || 0 }); return; }
      if (m.tur === "sayfa") { setYukleniyor(false); if (tema) ilet({ tur: "tema", tema }); if (typeof m.yol === "string" && m.yol in p.dosyalar && m.yol !== sayfa) setSayfa(m.yol); ilet({ tur: "mod", mod: mod === "isaret" ? "secim" : mod }); bRef.current.yeniden(typeof m.yol === "string" ? m.yol : sayfa); const sc = secimRef.current; if (sc && mod === "secim") { ilet({ tur: "tBilgi", secici: sc.secici }); } }
      else if (m.tur === "tBilgi") setBilgi(m as unknown as TBilgi);
      else if (m.tur === "tDenetim") { setDenetim({ ...(m as unknown as DenetimSonuc), sayfa, zaman: Date.now() }); setTaraniyor(false); if (taramaZaman.current) clearTimeout(taramaZaman.current); }
      else if (m.tur === "tUst") { const y = bilgiRef.current?.yol; if (y && y.length > 1) ilet({ tur: "tSec", secici: y[1].secici }); }
      else if (m.tur === "tAlt") { const c = bilgiRef.current?.cocuklar; if (c?.length) ilet({ tur: "tSec", secici: c[0].secici }); }
      else if (m.tur === "hata") setHatalar((h) => h.some((x) => x.mesaj === m.mesaj) ? h : [...h, { mesaj: String(m.mesaj), kaynak: String(m.kaynak ?? ""), satir: Number(m.satir) || 0 }].slice(-5));
      else if (m.tur === "gunluk") setGunluk((g) => [...g, { seviye: String(m.seviye), metin: String(m.metin), zaman: Date.now() }].slice(-200));
      else if (m.tur === "secildi" && mod === "isaret") {
        const secici = String(m.secici);
        setIsaretler((l) => (l.some((x) => x.secici === secici && x.sayfa === sayfa) ? l : [...l, { secici, etiket: String(m.etiket), metin: String(m.metin ?? "").slice(0, 80), sayfa, not: "" }].slice(0, 12)));
        setTimeout(() => document.querySelector<HTMLTextAreaElement>("[data-isaret-son]")?.focus(), 60);
      }
      else if (m.tur === "secildi") { setSecim({ secici: String(m.secici), etiket: String(m.etiket), metin: String(m.metin ?? ""), gorsel: (m.gorsel as string) ?? null, kutu: m.kutu as { w: number; h: number } | undefined, stil: (m.stil as Record<string, string>) ?? {}, sayfa }); ilet({ tur: "tBilgi", secici: String(m.secici) }); }
      else if (m.tur === "kapat") { setMod(null); setSecim(null); }
      else if (m.tur === "metinDegisti") {
        const html = p.dosyalar[sayfa];
        const yeni = html ? metniDegistir(html, String(m.secici), String(m.html)) : null;
        if (yeni) k.guncelle({ dosyalar: { ...p.dosyalar, [sayfa]: yeni }, aciklama: "Metin düzenlendi", kaynak: "stil" }).catch(() => {});
      }
    };
    addEventListener("message", al);
    return () => removeEventListener("message", al);
  }, [p.dosyalar, sayfa, mod, ilet, setSecim, k, tema]);

  /** Bekleyen bütün görsel düzenlemeleri kaynağa yazar: önce stiller, sonra silmeler (sondan başa); tek sürüm. */
  const hepsiniUygula = async () => {
    const dosyalar = { ...p.dosyalar };
    let yazilamayan = 0, ogeSayisi = 0;
    const sayfalar = [...new Set(Object.values(b.ogeler).map((o) => o.sayfa))];
    for (const sy of sayfalar) {
      let html = dosyalar[sy];
      if (html === undefined) continue;
      const l = Object.values(b.ogeler).filter((o) => o.sayfa === sy);
      for (const o of l) {
        if (o.sil || !Object.keys(o.stiller).length) continue;
        const st = { ...o.stiller };
        if (st["border-width"] || st["border-style"] || st["border-color"]) { /* kenarlık kısayolları olduğu gibi yazılır */ }
        const yeni = stilUygula(html, o.secici, st);
        if (yeni) { html = yeni; ogeSayisi++; } else yazilamayan++;
        const aile = st["font-family"]?.split(",")[0].replace(/["']/g, "").trim();
        if (aile && !/^(sans-serif|serif|monospace|system-ui|inherit)$/i.test(aile) && !html.includes(`family=${aile.replace(/ /g, "+")}`)) {
          const bag = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${aile.replace(/ /g, "+")}:wght@300;400;500;600;700&display=swap">`;
          html = /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${bag}\n</head>`) : bag + html;
        }
      }
      const silinecek = l.filter((o) => o.sil).map((o) => ({ o, k: konumBul(html!, o.secici)?.acilisBas ?? -1 })).sort((x, y) => y.k - x.k);
      for (const { o } of silinecek) { const yeni = ogeSil(html, o.secici); if (yeni) { html = yeni; ogeSayisi++; } else yazilamayan++; }
      dosyalar[sy] = html;
    }
    if (!ogeSayisi) return { ok: false, yazilamayan };
    try {
      await k.guncelle({ dosyalar, aciklama: `Görsel düzenleme: ${ogeSayisi} öğe`, kaynak: "stil" });
    } catch { return { ok: false, yazilamayan }; }
    const silindi = Object.values(b.ogeler).some((o) => o.sil && o.secici === secim?.secici);
    b.sifirla(false);
    if (silindi) setSecim(null);
    return { ok: true, yazilamayan };
  };

  const temel: CihazOlcu | null = ozelCihaz ?? (cihaz === "telefon" ? CIHAZLAR[0] : cihaz === "tablet" ? CIHAZLAR.find((c) => c.tur === "tablet")! : null);
  const olcuW = temel ? (yatay ? temel.h : temel.w) : null, olcuH = temel ? (yatay ? temel.w : temel.h) : null;
  const telefonCercevesi = !!temel && temel.tur === "telefon";
  const pay = telefonCercevesi ? 64 : 40;
  const oran = olcuW && olcuH && sahneOlcu.w ? Math.min(1, (sahneOlcu.w - pay) / olcuW, (sahneOlcu.h - pay - 22) / olcuH) : 1;
  const w = olcuW ? Math.round(olcuW * oran) : GENISLIK[cihaz];
  // Kıyasta sahne ikiye bölünür: iki yarı da aynı cihaz ölçüsünde, yarım genişliğe sığacak ölçekte.
  const kiyasVar = !!p.kaynakSite?.url && kiyas && !bos && !pano;
  const kiyasOran = olcuW && olcuH && sahneOlcu.w ? Math.min(1, (sahneOlcu.w / 2 - 36) / olcuW, (sahneOlcu.h - pay - 48) / olcuH) : 1;
  const temaSonraki = tema === null ? "koyu" : tema === "koyu" ? "acik" : null;
  const temaAd = tema === "koyu" ? "Koyu tema" : tema === "acik" ? "Açık tema" : "Sitenin varsayılanı";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* araç çubuğu */}
      <div className="flex h-12 shrink-0 items-center gap-1.5 border-b border-white/[0.06] px-2.5">
        <LayoutGroup id="cihaz">
          <div className="flex shrink-0 rounded-full bg-white/[0.05] p-0.5 max-md:hidden">
            {([["masaustu", Monitor, "Masaüstü"], ["tablet", Tablet, "Tablet"], ["telefon", Smartphone, "Telefon"]] as const).map(([c, I, et]) => (
              <button key={c} type="button" title={et} onClick={() => { setCihaz(c); setOzelCihaz(null); }} className={cn("relative flex h-7 w-8 items-center justify-center rounded-full", cihaz === c ? "text-black" : "text-white/55 hover:text-white")}>
                {cihaz === c && <motion.span layoutId="cihaz-z" transition={yay} className="absolute inset-0 rounded-full bg-white" />}
                <I className="relative h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </LayoutGroup>
        <CihazMenusu secili={ozelCihaz ?? temel} yatay={yatay} setYatay={setYatay} sec={(c) => { setOzelCihaz(c); if (c) setCihaz(c.tur === "masaustu" ? "masaustu" : c.tur); else { setCihaz("masaustu"); setYatay(false); } }} />
        <div className="relative min-w-0 flex-1">
          <button type="button" onClick={() => sayfalar.length > 1 && setSayfaMenu((x) => !x)} className="flex h-8 w-full min-w-0 items-center gap-2 rounded-full bg-white/[0.05] px-3 text-[12.5px] text-white/55 transition-colors hover:bg-white/[0.08]">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400/80" />
            <span className="min-w-0 flex-1 truncate text-left">{adres}</span>
            {sayfalar.length > 1 && <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
          </button>
          <AnimatePresence>
            {sayfaMenu && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-[14px] bg-[#17181b] p-1 ring-1 ring-inset ring-white/[0.1]">
                {sayfalar.map((s) => (
                  <button key={s} type="button" onClick={() => { setSayfa(s); setSayfaMenu(false); }} className={cn("flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[13px] hover:bg-white/[0.06]", s === sayfa ? "text-white" : "text-white/65")}>
                    <FileText className="h-3.5 w-3.5 text-white/40" />{s === "index.html" ? "Ana sayfa" : s.replace(/\.html$/, "")}<span className="ml-auto font-mono text-[11px] text-white/30">{s}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Arac mobilGizli ikon={LayoutGrid} et="Bütün sayfalar: her sayfa masaüstü ve telefonda yan yana" aktif={pano} kapali={bos} onClick={() => { setPano((x) => !x); setMod(null); setSecim(null); }} />
        <Arac ikon={MousePointer2} et="Öğe seç: tıkla, değiştirmek istediğini yaz ya da stilini düzenle" aktif={mod === "secim"} kapali={bos || pano || !!eskiSurum} onClick={() => { setMod(mod === "secim" ? null : "secim"); if (mod === "secim") setSecim(null); }} />
        {isaretleriGonder && <Arac ikon={MessageSquarePlus} et="İşaretle: birden çok öğeye not bırak, hepsini tek istekte ajana gönder" aktif={mod === "isaret"} kapali={bos || !!eskiSurum} onClick={() => { setMod(mod === "isaret" ? null : "isaret"); setSecim(null); }} />}
        <Arac mobilGizli ikon={Type} et="Metni yerinde düzenle (kredisiz)" aktif={mod === "metin"} kapali={bos || !!eskiSurum} onClick={() => { setMod(mod === "metin" ? null : "metin"); setSecim(null); }} />
        {cizimEkle && <Arac ikon={PenTool} et="Önizlemeye çiz ve not bırak, ekran görüntüsüyle sohbete ekle" aktif={cizim} kapali={bos || pano} onClick={() => { setCizim((x) => !x); setMod(null); setSecim(null); }} />}
        <Arac ikon={tema === "koyu" ? Moon : tema === "acik" ? Sun : SunMoon} et={`Tema: ${temaAd}. Tıkla: ${temaSonraki === "koyu" ? "koyu tema" : temaSonraki === "acik" ? "açık tema" : "sitenin varsayılanı"}`} aktif={tema !== null} kapali={bos || pano} onClick={() => setTema(temaSonraki)} />
        {p.kaynakSite?.url && <Arac ikon={Columns2} et="Orijinal siteyle yan yana kıyasla" aktif={kiyas} kapali={bos || pano} onClick={() => { setKiyas((x) => !x); setMod(null); setSecim(null); }} />}
        {p.tur === "mobil" && <Arac ikon={Smartphone} et="Expo Go ile telefonda aç" aktif={expo} kapali={bos} onClick={() => setExpo((x) => !x)} />}
        {oyunJson && oyunAyarlari(oyunJson) && <Arac ikon={SlidersHorizontal} et="Oyun ayarları" aktif={oyunAcik} onClick={() => setOyunAcik((x) => !x)} />}
        <Arac mobilGizli ikon={Gauge} et="Denetim: erişilebilirlik ve performans puanı" aktif={denetimAcik} kapali={bos || pano} onClick={() => { setDenetimAcik((x) => !x); setMod(null); setSecim(null); }} />
        <Arac mobilGizli ikon={Terminal} et="Konsol" aktif={konsol} onClick={() => setKonsol((x) => !x)} />
        <Arac ikon={RotateCw} et="Yenile" onClick={() => setAnahtar((x) => x + 1)} />
        <Arac mobilGizli ikon={kopya ? Check : Copy} et="Önizleme bağlantısını kopyala" kapali={bos} onClick={() => { navigator.clipboard?.writeText(`${location.origin}${kok}/`); setKopya(true); setTimeout(() => setKopya(false), 1400); }} />
        <Arac mobilGizli ikon={ExternalLink} et="Yeni sekmede aç" kapali={bos} onClick={() => window.open(`${kok}/${sayfa === "index.html" ? "" : sayfa}`, "_blank", "noopener")} />
      </div>

      {/* sahne */}
      <div ref={sahne} className="relative min-h-0 flex-1 overflow-hidden bg-[#0e0f11]">
        {pano && !bos ? (
          <SayfaPanosu dosyalar={p.dosyalar} kok={kok} surum={`${k.onizlemeAnahtari}-${anahtar}`} ac={(x, c) => { setSayfa(x); setCihaz(c); setPano(false); }} />
        ) : bos ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            {k.calisiyor ? (
              <>
                <div className="relative mb-5 h-[150px] w-[240px] overflow-hidden rounded-[16px] bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]">
                  <div className="build-iskelet absolute inset-3 space-y-2.5">
                    <span className="block h-3 w-1/2 rounded-full bg-white/[0.08]" /><span className="block h-16 rounded-[10px] bg-white/[0.06]" />
                    <span className="flex gap-2"><span className="h-10 flex-1 rounded-[8px] bg-white/[0.05]" /><span className="h-10 flex-1 rounded-[8px] bg-white/[0.05]" /><span className="h-10 flex-1 rounded-[8px] bg-white/[0.05]" /></span>
                  </div>
                </div>
                <p className="build-parilti text-[14.5px] text-white/80">Proje hazırlanıyor</p>
                <p className="mt-1 text-[13px] text-white/45">İlk dosyalar yazıldıkça önizleme burada canlanır.</p>
              </>
            ) : (
              <>
                <p className="text-[15px] text-white/80">Önizleme burada görünecek</p>
                <p className="mt-1 max-w-[340px] text-[13px] text-white/45">Soldaki kutuya ne yapmak istediğini yaz. Ajan dosyaları yazdıkça proje burada çalışır.</p>
              </>
            )}
          </div>
        ) : (
          <div className={cn("flex h-full justify-center", w ? "items-center" : "", eskiSurum && "pt-12", kiyasVar && "grid grid-cols-2 gap-3 p-3")}>
            {kiyasVar && <KaynakKiyas projeId={p.id} genislik={olcuW} yukseklik={olcuH} oran={kiyasOran} />}
            <div className={cn(kiyasVar ? "flex h-full min-w-0 flex-col items-center justify-center" : w ? "flex flex-col items-center" : "h-full w-full")}>
            {kiyasVar && <div className="mb-2 flex h-7 w-full items-center gap-2 px-1 text-[12px] text-white/55"><span className="shrink-0 rounded-full bg-[#55d6fd]/[0.14] px-2 py-0.5 text-[11.5px] font-medium text-[#a8ecff]">Yeni</span><span className="min-w-0 flex-1 truncate">{adres}</span></div>}
            <motion.div layout transition={yay} className={cn("relative overflow-hidden bg-white", w ? (telefonCercevesi ? "rounded-[38px] ring-[10px] ring-black" : "rounded-[18px] ring-1 ring-white/10") : kiyasVar ? "min-h-0 w-full flex-1 rounded-[14px] ring-1 ring-white/10" : "h-full")} style={w && olcuW && olcuH ? { width: Math.round(olcuW * (kiyasVar ? kiyasOran : oran)), height: Math.round(olcuH * (kiyasVar ? kiyasOran : oran)) } : kiyasVar ? undefined : { width: "100%", height: "100%" }}>
              <div style={w && olcuW && olcuH ? { width: olcuW, height: olcuH, transform: `scale(${kiyasVar ? kiyasOran : oran})`, transformOrigin: "0 0" } : { width: "100%", height: "100%" }}>
              <iframe ref={cerceve} key={`${k.onizlemeAnahtari}-${anahtar}`} src={src} title="Önizleme" sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-downloads allow-pointer-lock" allow="clipboard-write; fullscreen; gamepad; accelerometer; gyroscope" className="h-full w-full border-0 bg-white" onLoad={() => setYukleniyor(false)} />
              </div>
              {yukleniyor && <span className="pointer-events-none absolute right-3 top-3 flex h-7 items-center gap-1.5 rounded-full bg-black/60 px-2.5 text-[11.5px] text-white"><Loader2 className="h-3 w-3 animate-spin" />Yükleniyor</span>}
              <AnimatePresence>{cizim && cizimEkle && <CizimKatmani kapat={() => setCizim(false)} goruntuAl={goruntuAl} ekle={(g, n) => { cizimEkle(g, n); }} />}</AnimatePresence>
            </motion.div>
            {temel && olcuW && <p className="mt-2.5 text-center text-[11.5px] tabular-nums text-white/45">{temel.ad} · {olcuW} x {olcuH}{oran < 1 ? ` · yüzde ${Math.round(oran * 100)}` : ""}</p>}
            </div>
            {mobilQr && telefonCercevesi && !eskiSurum && (
              <div className="ml-8 hidden w-[170px] shrink-0 self-center text-center xl:block">
                <div className="mx-auto w-fit"><QrKod adres={`${typeof location !== "undefined" ? location.origin : ""}${kok}/`} /></div>
                <p className="mt-3 text-[13px] font-medium text-white">Telefonunda aç</p>
                <p className="mt-0.5 text-[12px] text-white/50">Kamerayla tara, gerçek cihazda dene</p>
              </div>
            )}
          </div>
        )}

        <AnimatePresence>
          {tema === "koyu" && temaBilgi && !temaBilgi.medya && !temaBilgi.sinif && !bos && !pano && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute left-1/2 top-3 z-20 flex w-max max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-2 rounded-full bg-[#17181b] py-1.5 pl-3.5 pr-1.5 ring-1 ring-inset ring-white/[0.12]">
              <Moon className="h-3.5 w-3.5 shrink-0 text-[#8be6ff]" /><span className="truncate text-[12.5px] text-white/80">Bu sayfada koyu tema tanımı yok</span>
              {isaretleriGonder && <button type="button" onClick={() => { isaretleriGonder("Siteye koyu tema desteği ekle: prefers-color-scheme ile cihazın temasını izlesin, renkleri CSS değişkenlerinde topla, okunabilir karşıtlık oranlarını koru."); setTema(null); }} className="h-7 shrink-0 rounded-full bg-white px-3 text-[12px] font-semibold text-black">Ajana ekle</button>}
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>{expo && p.tur === "mobil" && <ExpoPaneli ad={p.ad} kapat={() => setExpo(false)} onizlemeAdresi={`${typeof location !== "undefined" ? location.origin : ""}${kok}/`} yayinAdresi={p.yayin ? yayinAdresi(p.ayarlar.altAlan).tam : null} />}</AnimatePresence>
        {mod && !secim && !b.sayi && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1.5 text-[12px] text-white backdrop-blur">
            {mod === "secim" ? "Değiştirmek istediğin öğeye tıkla · Esc ile çık" : mod === "isaret" ? "Öğelere tıkla, not yaz, birlikte gönder" : "Bir metne tıkla ve yaz; dışarı tıklayınca kaydedilir"}
          </div>
        )}

        <AnimatePresence>
          {secim && mod === "secim" && (
            <TasarimPaneli secim={secim} bilgi={bilgi} b={b} sec={(x) => ilet({ tur: "tSec", secici: x })} ustSec={() => { const y = bilgi?.yol; if (y && y.length > 1) ilet({ tur: "tSec", secici: y[1].secici }); }} olcu={olcu} setOlcu={setOlcu} uygula={hepsiniUygula} kapat={() => setSecim(null)} ajanaSor={() => ajanaYaz(secim)}
              gorselPanel={secim.gorsel ? <GorselDegistirici projeId={p.id} mevcut={secim.gorsel} kutu={secim.kutu} ipucu={`${p.ad} için ${secim.metin || "sayfaya uygun"} görsel`} uygula={async (src) => {
                const html = p.dosyalar[secim.sayfa];
                const yeni = html ? gorselDegistir(html, secim.secici, src) : null;
                if (!yeni) return false;
                await k.guncelle({ dosyalar: { ...p.dosyalar, [secim.sayfa]: yeni }, aciklama: `Görsel değişti: ${secim.etiket}`, kaynak: "stil" });
                setSecim({ ...secim, gorsel: src });
                return true;
              }} /> : undefined} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {mod === "isaret" && isaretleriGonder && (
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={yay}
              className="absolute bottom-3 right-3 top-3 z-20 flex w-[300px] flex-col overflow-hidden rounded-[20px] bg-[#17181b] ring-1 ring-inset ring-white/[0.1] max-sm:inset-x-3 max-sm:top-auto max-sm:h-[60%] max-sm:w-auto">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <div><p className="text-[13.5px] font-semibold text-white">İşaretler</p><p className="text-[11.5px] text-white/45">{isaretler.length ? `${isaretler.length} öğe işaretlendi` : "Önizlemede bir öğeye tıkla"}</p></div>
                <button type="button" onClick={() => setMod(null)} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 [scrollbar-width:thin]">
                {!isaretler.length && <p className="px-1 pt-2 text-[12.5px] leading-relaxed text-white/45">Değişmesini istediğin her öğeye tıkla ve ne olacağını yaz: &quot;bu başlık daha kısa olsun&quot;, &quot;bu düğme yeşil&quot;, &quot;bu görsel yerine kahve çekirdeği&quot;. Hepsi tek istekte gider.</p>}
                {isaretler.map((x, i) => (
                  <div key={`${x.sayfa}-${x.secici}`} onMouseEnter={() => x.sayfa === sayfa && ilet({ tur: "vurgula", secici: x.secici })} className="rounded-[14px] bg-white/[0.03] p-2.5 ring-1 ring-inset ring-white/[0.08]">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#55d6fd] px-1 text-[10.5px] font-semibold text-[#04212b]">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-[12px] text-white/60">{x.etiket}{x.metin ? ` · ${x.metin}` : ""}{x.sayfa !== "index.html" ? ` · ${x.sayfa}` : ""}</span>
                      <button type="button" aria-label="İşareti kaldır" onClick={() => setIsaretler((l) => l.filter((_, j) => j !== i))} className="flex h-6 w-6 items-center justify-center rounded-full text-white/40 hover:bg-white/[0.07] hover:text-white"><X className="h-3 w-3" /></button>
                    </div>
                    <textarea {...(i === isaretler.length - 1 ? { "data-isaret-son": "" } : {})} value={x.not} onChange={(e) => setIsaretler((l) => l.map((y, j) => (j === i ? { ...y, not: e.target.value } : y)))} rows={2} placeholder="Ne değişsin?" className="w-full resize-none rounded-[10px] bg-white/[0.05] px-2.5 py-2 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/[0.07] placeholder:text-white/30 focus:ring-white/30" />
                  </div>
                ))}
              </div>
              <div className="border-t border-white/[0.06] p-3">
                <button type="button" disabled={!isaretler.some((x) => x.not.trim())} onClick={() => {
                  const l = isaretler.filter((x) => x.not.trim());
                  isaretleriGonder(`Önizlemede işaretlediğim öğelerde şu değişiklikleri yap:\n${l.map((x, i) => `${i + 1}. ${x.sayfa}, <${x.etiket}>${x.metin ? ` "${x.metin}"` : ""} (seçici: ${x.secici}): ${x.not.trim()}`).join("\n")}`);
                  setIsaretler([]); setMod(null);
                }} className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-white text-[13px] font-semibold text-black disabled:opacity-35"><Wand2 className="h-3.5 w-3.5" />Ajana gönder{isaretler.filter((x) => x.not.trim()).length ? ` (${isaretler.filter((x) => x.not.trim()).length})` : ""}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {oyunJson && oyunAcik && !secim && <OyunPaneli json={oyunJson} kapat={() => setOyunAcik(false)} kaydet={(yeni) => k.guncelle({ dosyalar: { ...p.dosyalar, "ayarlar.json": yeni }, aciklama: "Oyun ayarları değişti", kaynak: "stil" }).catch(() => {})} />}
        </AnimatePresence>

        {/* eski sürüm: salt okunur şerit */}
        <AnimatePresence>
          {eskiSurum && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={yay}
              className="absolute inset-x-3 top-2.5 z-30 flex flex-wrap items-center gap-2 rounded-[16px] bg-[#17181b] py-1.5 pl-3 pr-1.5 ring-1 ring-inset ring-white/[0.12]">
              <History className="h-4 w-4 shrink-0 text-[#8be6ff]" />
              <span className="min-w-[160px] flex-1 truncate text-[12.5px] text-white/85"><span className="font-semibold">Sürüm {eskiSurum.no}</span><span className="text-white/50"> · salt okunur · {eskiSurum.aciklama}</span></span>
              {eskiyeDon && <button type="button" onClick={() => eskiyeDon(eskiSurum.id)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/[0.07] px-3 text-[12.5px] text-white ring-1 ring-inset ring-white/[0.1] hover:bg-white/[0.12]"><RotateCcw className="h-3.5 w-3.5" />Bu sürüme dön</button>}
              <button type="button" onClick={eskiKapat} className="inline-flex h-8 items-center rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black">Son sürüme dön</button>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {denetimAcik && !pano && !bos && <DenetimPaneli sonuc={denetim} taraniyor={taraniyor} tara={tara} cihaz={temel?.ad ?? "Masaüstü"} goster={(x) => ilet({ tur: "vurgula", secici: x })} duzelt={(m) => { isaretleriGonder?.(m); }} kapat={() => setDenetimAcik(false)} />}
        </AnimatePresence>

        {/* panel kapalıyken bekleyen görsel düzenlemeler */}
        <AnimatePresence>
          {b.sayi > 0 && !(secim && mod === "secim") && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={yay}
              className="absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#17181b] py-1.5 pl-3.5 pr-1.5 ring-1 ring-inset ring-white/[0.12]">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#55d6fd]" />
              <span className="whitespace-nowrap text-[12.5px] text-white/80">{b.sayi} görsel düzenleme bekliyor</span>
              <button type="button" onClick={() => b.sifirla()} className="h-8 rounded-full px-2.5 text-[12px] text-white/55 hover:bg-white/[0.07] hover:text-white">Bırak</button>
              <button type="button" onClick={() => { hepsiniUygula(); }} className="h-8 rounded-full bg-white px-3.5 text-[12.5px] font-semibold text-black">Uygula</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* hata bandı */}
        <AnimatePresence>
          {hatalar.length > 0 && !k.calisiyor && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={yay}
              className="absolute bottom-3 left-1/2 z-30 flex w-[min(560px,calc(100%-24px))] -translate-x-1/2 items-center gap-3 rounded-[18px] bg-[#1b1416] py-2.5 pl-3.5 pr-2 ring-1 ring-inset ring-rose-400/20">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-300" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-white">Önizlemede {hatalar.length > 1 ? `${hatalar.length} hata` : "bir hata"} var</p>
                <p className="truncate font-mono text-[11.5px] text-white/50">{hatalar[0].mesaj}{hatalar[0].kaynak ? ` · ${hatalar[0].kaynak}${hatalar[0].satir ? `:${hatalar[0].satir}` : ""}` : ""}</p>
              </div>
              <button type="button" onClick={() => duzelt(hatalar.map((h) => `${h.mesaj}${h.kaynak ? ` (${h.kaynak}${h.satir ? ` satır ${h.satir}` : ""})` : ""}`).join("\n"))} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-[12.5px] font-semibold text-black"><Wand2 className="h-3.5 w-3.5" />{hatalar.length > 1 ? `Hepsini düzelt (${hatalar.length})` : "Düzelt"}</button>
              <button type="button" onClick={() => { setKonsol(true); setKonsolSuz("error"); }} className="inline-flex h-8 shrink-0 items-center rounded-full px-2.5 text-[12px] text-white/65 hover:bg-white/[0.07] hover:text-white max-sm:hidden">Konsolda gör</button>
              <button type="button" onClick={() => setHatalar([])} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/[0.07] hover:text-white"><X className="h-3.5 w-3.5" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* konsol */}
        <AnimatePresence>
          {konsol && (
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={yay} className="absolute inset-x-0 bottom-0 z-40 flex h-[42%] flex-col border-t border-white/[0.08] bg-[#0b0c0d]">
              <div className="flex h-9 shrink-0 items-center justify-between px-3 text-[12px] text-white/55">
                <span className="flex min-w-0 items-center gap-1.5"><Terminal className="h-3.5 w-3.5 shrink-0" />Konsol<span className="ml-1.5 flex gap-0.5">{([["hepsi", "Hepsi"], ["error", "Hata"], ["warn", "Uyarı"], ["log", "Bilgi"]] as const).map(([v, a]) => { const n = v === "hepsi" ? gunluk.length : gunluk.filter((g) => (v === "log" ? g.seviye === "log" || g.seviye === "info" : g.seviye === v)).length; return <button key={v} type="button" onClick={() => setKonsolSuz(v)} className={cn("h-6 rounded-full px-2 text-[11.5px]", konsolSuz === v ? "bg-white text-black" : "text-white/55 hover:text-white")}>{a} <span className="tabular-nums opacity-60">{n}</span></button>; })}</span></span>
                <span className="flex items-center gap-1"><button type="button" onClick={() => setGunluk([])} className="rounded-full px-2 py-0.5 hover:bg-white/[0.06] hover:text-white">Temizle</button><button type="button" onClick={() => setKonsol(false)} aria-label="Kapat" className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/[0.06] hover:text-white"><X className="h-3.5 w-3.5" /></button></span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2 font-mono text-[11.5px] leading-relaxed [scrollbar-width:thin]">
                {!gunluk.length && <p className="pt-2 text-white/30">Henüz kayıt yok. Sayfadaki console.log çıktıları burada görünür.</p>}
                {gunluk.filter((g) => konsolSuz === "hepsi" || (konsolSuz === "log" ? g.seviye === "log" || g.seviye === "info" : g.seviye === konsolSuz)).map((g, i) => <p key={i} className={cn("border-b border-white/[0.03] py-0.5", g.seviye === "error" ? "text-rose-300" : g.seviye === "warn" ? "text-amber-200" : "text-white/65")}>{g.metin}</p>)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export { gorselDegistir };
