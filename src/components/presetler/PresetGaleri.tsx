"use client";

/**
 * Viral presetler galerisi — "B · Raflar, çok daha iyi" (2026-11-01, kullanıcı seçimi; rakipler: Hailuo, Krea, CapCut, PixVerse).
 *  Keşfet: giriş kartı (fotoğrafını ekle + canlı mekanizma), Bu haftanın 10'u, Konuya göre, Takip ettiklerinden,
 *  Topluluğun yaratıcıları, Yeni çıkanlar, İki efekt bir videoda, en altta yapışkan başlıklı "Tüm presetler" kartı.
 *  Arama, filtre, kategori, kaynak ya da yaratıcı seçilince raflar çekilir, yalnız sonuç kartı kalır.
 *  Sekmeler: Keşfet, Kaydedilenler, Benim presetlerim, Üretimlerim. Her bölüm başlık şeritli kart (havada yazı yok).
 */

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  ArrowDownUp, ArrowRight, ArrowUpNarrowWide, ArrowDownWideNarrow, BadgeCheck, Bookmark, Check, Clock, Compass, Crown, Eye, Film, Flame,
  FolderOpen, Heart, ImagePlus, LayoutGrid, Loader2, Play, Plus, Search, SlidersHorizontal, Sparkles, UserCheck, UserPlus, Users, Wallet, Wand2, X,
} from "lucide-react";
import { useProjeler } from "@/store/useProjeler";
import { usePresetler } from "@/store/usePresetler";
import { RESMI_PRESETLER, KATEGORI_AD, KATEGORI_SIRA, type KatalogPreset } from "@/lib/presetKatalog";
import { sayiKisa, tumPresetler, tutamac, yaraticiBul } from "@/lib/presetTopluluk";
import { useAuth } from "@/store/useAuth";
import { usePaylasim } from "@/store/usePaylasim";
import { PresetPaneli, YaraticiAvatar } from "./PresetPaneli";
import { UretimKarti } from "@/components/panel/UretimKarti";
import { Yuzen } from "@/components/ui/Yuzen";
import { KrediJeton } from "@/components/ui/KrediHap";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { KAT_IKON, PresetKapak } from "./PresetKarti";
import { ARAC, ESANLAM, GIRDI, fotoOku, presetGirdi, presetinMi, trNorm, useGorunur, usePresetOturum, type Girdi } from "./presetOrtak";
import { GirisKarti, KARISIM_LISTE, KarisimRafi, KonuRafi, OnluRaf, PresetKart, Raf, SatirRaf, YaraticiRafi, YayinlaKarti, type KartOlay } from "./galeri/Raflar";

type Sekme = "kesfet" | "kayitli" | "benim" | "uretim";
type Kaynak = "hepsi" | "vayra" | "topluluk" | "takip";
type Sira = "onerilen" | "trend" | "yeni" | "kullanim" | "begeni" | "kredi-artan" | "kredi-azalan";
type Fiyat = "hepsi" | "uygun" | "orta" | "yuksek";

const yay = { type: "spring" as const, stiffness: 420, damping: 34 };

const SIRALAR: { id: Sira; ad: string; alt: string; ikon: React.ElementType }[] = [
  { id: "onerilen", ad: "Önerilen", alt: "Karışık; raflarda görmediklerin önce", ikon: Sparkles },
  { id: "trend", ad: "Trend", alt: "Son günlerde en çok kullanılan ve beğenilen", ikon: Flame },
  { id: "yeni", ad: "En yeni", alt: "Son yayınlanan presetler", ikon: Clock },
  { id: "kullanim", ad: "En çok kullanılan", alt: "Tüm zamanlar", ikon: Play },
  { id: "begeni", ad: "En çok beğenilen", alt: "Topluluğun favorileri", ikon: Heart },
  { id: "kredi-artan", ad: "Kredi: düşükten yükseğe", alt: "En uygun önce", ikon: ArrowUpNarrowWide },
  { id: "kredi-azalan", ad: "Kredi: yüksekten düşüğe", alt: "En kapsamlı önce", ikon: ArrowDownWideNarrow },
];
const FIYATLAR: { id: Fiyat; ad: string; alt: string; test: (k: number) => boolean }[] = [
  { id: "hepsi", ad: "Hepsi", alt: "Tüm bedeller", test: () => true },
  { id: "uygun", ad: "Uygun", alt: "28 kredi ve altı", test: (k) => k <= 28 },
  { id: "orta", ad: "Orta", alt: "29 ile 40 kredi", test: (k) => k > 28 && k <= 40 },
  { id: "yuksek", ad: "Kapsamlı", alt: "40 kredi üstü", test: (k) => k > 40 },
];

/** Editoryal karışımlar: ana efekt hareketi taşır, ikincisi atmosfer katar (preset sayfası da kullanır). */
export const KARISIMLAR = KARISIM_LISTE;

const katAd = (k: string) => KATEGORI_AD[k] ?? k;
const katIkon = (k: string): React.ElementType => (k === "TUMU" ? LayoutGrid : KAT_IKON[k] ?? Sparkles);
/** 60: 2, 3, 4, 5 ve 6 sütunda son satır dolu kalır. */
const SAYFA = 60;
const BUGUN = Date.UTC(2026, 9, 31);
const trendPuan = (x: KatalogPreset) => ((x.kullanimSayi ?? 0) + (x.begeniSayi ?? 0) * 3) * (1 + Math.max(0, 30 - (BUGUN - (x.tarih ?? 0)) / 86_400_000) / 15) * (x.oneCikan ? 1.6 : 1);

export function PresetGaleri() {
  const arama = useSearchParams();
  const kayitliListe = usePresetler((s) => s.kayitli);
  const ozel = usePresetler((s) => s.ozel);
  const takip = usePresetler((s) => s.takip);
  const takipDegis = usePresetler((s) => s.takipDegis);
  const bildirilen = usePresetler((s) => s.bildirilen);
  const uretimler = useProjeler((s) => s.uretimler);
  const kullaniciAd = useAuth((s) => s.kullanici?.ad);
  const benimTutamac = tutamac(kullaniciAd);

  const paylasimlar = usePaylasim((s) => s.benimPaylasimlar);
  const tumu = useMemo(() => tumPresetler(ozel, benimTutamac, paylasimlar).filter((p) => !bildirilen.includes(p.slug)), [ozel, benimTutamac, paylasimlar, bildirilen]);
  const benimler = useMemo(() => tumu.filter((p) => p.ozel), [tumu]);
  /** Akışta görünenler: Vayra + topluluk + kendi toplulukta yayınladıkların. */
  const akis = useMemo(() => tumu.filter((p) => !p.ozel || (!p.taslak && (p.gorunurluk ?? "topluluk") === "topluluk")), [tumu]);
  const trendAkis = useMemo(() => [...akis].sort((a, b) => trendPuan(b) - trendPuan(a)), [akis]);

  const [sekme, setSekme] = useState<Sekme>(() => (["kayitli", "benim", "uretim"].includes(arama.get("sekme") ?? "") ? arama.get("sekme") as Sekme : "kesfet"));
  const [kaynak, setKaynak] = useState<Kaynak>(() => (["vayra", "topluluk", "takip"].includes(arama.get("kim") ?? "") ? arama.get("kim") as Kaynak : "hepsi"));
  const [yaratici, setYaratici] = useState<string | null>(() => arama.get("yaratici"));
  const [kategori, setKategori] = useState("TUMU");
  const [ara, setAra] = useState("");
  const [sira, setSira] = useState<Sira>("onerilen");
  const [girdi, setGirdi] = useState<Girdi | "hepsi">("hepsi");
  const [fiyat, setFiyat] = useState<Fiyat>("hepsi");
  const [videolu, setVideolu] = useState(false);
  const [istemli, setIstemli] = useState(false);
  const [siraAcik, setSiraAcik] = useState(false);
  const [filtreAcik, setFiltreAcik] = useState(false);
  const [secili, setSecili] = useState<KatalogPreset | null>(null);
  const [goster, setGoster] = useState(SAYFA);
  const aramaRef = useRef<HTMLInputElement>(null);
  const galeriRef = useRef<HTMLDivElement>(null);

  /* Paylaşılan bağlantı: ?p=<slug> paneli açar */
  useEffect(() => { const s = arama.get("p"); if (s) { const x = tumu.find((y) => y.slug === s); if (x) setSecili(x); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  const urlYaz = useCallback((f: (u: URL) => void) => { const u = new URL(window.location.href); f(u); window.history.replaceState(null, "", u.toString()); }, []);
  const panelAc = useCallback((p: KatalogPreset | null) => { setSecili(p); urlYaz((u) => (p ? u.searchParams.set("p", p.slug) : u.searchParams.delete("p"))); }, [urlYaz]);

  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      const h = e.target as HTMLElement;
      if (e.key === "/" && h.tagName !== "INPUT" && h.tagName !== "TEXTAREA" && !h.isContentEditable) { e.preventDefault(); aramaRef.current?.focus(); }
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, []);

  const sekmeDegis = (s: Sekme) => { setSekme(s); setGoster(SAYFA); urlYaz((u) => (s === "kesfet" ? u.searchParams.delete("sekme") : u.searchParams.set("sekme", s))); };
  const kaynakDegis = (k: Kaynak) => { setKaynak(k); setYaratici(null); urlYaz((u) => { if (k === "hepsi") u.searchParams.delete("kim"); else u.searchParams.set("kim", k); u.searchParams.delete("yaratici"); }); };
  const yaraticiSec = useCallback((y: string | null) => {
    setYaratici(y); setSekme("kesfet"); if (y) setKaynak("hepsi");
    urlYaz((u) => { if (y) u.searchParams.set("yaratici", y); else u.searchParams.delete("yaratici"); u.searchParams.delete("sekme"); u.searchParams.delete("kim"); });
    setSecili(null); urlYaz((u) => u.searchParams.delete("p"));
  }, [urlYaz]);
  const takipEt = useCallback((y: string) => { const v = takipDegis(y); toast.success(v ? `${yaraticiBul(y)?.ad ?? y} takip ediliyor` : "Takipten çıkıldı", { description: v ? "Yeni presetleri Takip görünümünde toplanır." : undefined }); }, [takipDegis]);

  /* Raflarda öne çıkanlar: giriş vitrini, haftanın 10'u. Aşağıdaki raflar ve ızgara bunları tekrar başa koymaz. */
  const onlu = useMemo(() => trendAkis.slice(0, 10), [trendAkis]);
  const vitrin = useMemo(() => {
    const ust = new Set(onlu.slice(0, 5).map((p) => p.slug));
    const l = trendAkis.filter((p) => p.video && !p.yazar && !ust.has(p.slug));
    return (l.length >= 4 ? l : [...l, ...trendAkis.filter((p) => p.video && !p.yazar && !l.includes(p))]).slice(0, 4);
  }, [trendAkis, onlu]);
  const gorulen = useMemo(() => new Set([...onlu, ...vitrin].map((p) => p.slug)), [onlu, vitrin]);
  /* Konu rafı: "Viral" zaten haftanın 10'u; konular gerçek türlerden başlar. */
  const konular = useMemo(() => KATEGORI_SIRA.filter((k) => k !== "VIRAL" && akis.filter((p) => p.kategoriler.includes(k)).length >= 5), [akis]);
  /* Izgara, raflarda açılışta görünen kartları (vitrin, 10'lu, ilk konunun 9 kartı) ilk sıralara koymaz. */
  const rafGorulen = useMemo(() => {
    const ilk = konular[0] ? trendAkis.filter((p) => p.kategoriler.includes(konular[0]) && !gorulen.has(p.slug)).slice(0, 9) : [];
    return new Set([...gorulen, ...ilk.map((p) => p.slug)]);
  }, [konular, trendAkis, gorulen]);

  const presetUretimleri = useMemo(() => uretimler.filter((u) => u.arac === ARAC), [uretimler]);
  const kullanimSay = useCallback((p: KatalogPreset) => presetUretimleri.filter((u) => presetinMi(u.baslik, p.ad)).length, [presetUretimleri]);
  const olay: KartOlay = useMemo(() => ({ onAc: panelAc, onYaratici: yaraticiSec, benimTutamac }), [panelAc, yaraticiSec, benimTutamac]);

  const kaynakListe = useMemo(() => {
    if (sekme === "kayitli") return kayitliListe.map((s) => tumu.find((x) => x.slug === s)).filter(Boolean) as KatalogPreset[];
    if (sekme === "benim") return benimler;
    if (yaratici) return akis.filter((p) => p.yazar === yaratici);
    return akis.filter((p) => kaynak === "hepsi" || (kaynak === "vayra" ? !p.yazar : kaynak === "topluluk" ? !!p.yazar : !!p.yazar && takip.includes(p.yazar)));
  }, [sekme, kayitliListe, tumu, benimler, akis, kaynak, takip, yaratici]);

  const sayilar = useMemo(() => { const m = new Map<string, number>(); for (const x of kaynakListe) for (const k of x.kategoriler) m.set(k, (m.get(k) ?? 0) + 1); return m; }, [kaynakListe]);

  const liste = useMemo(() => {
    const q = trNorm(ara.trim().replace(/^@/, ""));
    const esSlug = q ? new Set(ESANLAM.filter(([r]) => r.test(q)).flatMap(([, s]) => s)) : null;
    const fz = FIYATLAR.find((f) => f.id === fiyat)!;
    const l = kaynakListe.filter((x) =>
      (kategori === "TUMU" || x.kategoriler.includes(kategori))
      && (girdi === "hepsi" || presetGirdi(x) === girdi)
      && fz.test(x.kredi)
      && (!videolu || !!x.video)
      && (!istemli || x.istemGorunur !== false)
      && (!q || esSlug!.has(x.taban ?? x.slug) || trNorm(`${x.ad} ${x.aciklama} ${x.yazar ?? "vayra"} ${yaraticiBul(x.yazar)?.ad ?? ""} ${x.kategoriler.map(katAd).join(" ")}`).includes(q)));
    const s = [...l];
    if (sira === "onerilen") {
      /* Trend sırası, ama art arda aynı konu gelmez ve raflarda gördüklerin ilk iki sıradan sonra gelir. */
      const t = [...l].sort((a, b) => trendPuan(b) - trendPuan(a));
      const once = t.filter((x) => !rafGorulen.has(x.slug)), sonra = t.filter((x) => rafGorulen.has(x.slug));
      const kar: KatalogPreset[] = [];
      const ana = (x: KatalogPreset) => x.kategoriler.find((k) => k !== "VIRAL");
      while (once.length) {
        const son = kar.slice(-2).map(ana);
        const j = once.findIndex((x) => !son.includes(ana(x)));
        kar.push(...once.splice(j < 0 ? 0 : j, 1));
      }
      return [...kar, ...sonra];
    }
    if (sira === "trend") s.sort((a, b) => trendPuan(b) - trendPuan(a));
    else if (sira === "yeni") s.sort((a, b) => (b.tarih ?? 0) - (a.tarih ?? 0));
    else if (sira === "kullanim") s.sort((a, b) => (b.kullanimSayi ?? 0) - (a.kullanimSayi ?? 0));
    else if (sira === "begeni") s.sort((a, b) => (b.begeniSayi ?? 0) - (a.begeniSayi ?? 0));
    else if (sira === "kredi-artan") s.sort((a, b) => a.kredi - b.kredi);
    else if (sira === "kredi-azalan") s.sort((a, b) => b.kredi - a.kredi);
    return s;
  }, [kaynakListe, kategori, ara, sira, girdi, fiyat, videolu, istemli, rafGorulen]);

  const filtreSayisi = (girdi !== "hepsi" ? 1 : 0) + (fiyat !== "hepsi" ? 1 : 0) + (videolu ? 1 : 0) + (istemli ? 1 : 0);
  /** Raflar yalnız süzgeçsiz Keşfet'te görünür. */
  const raflar = sekme === "kesfet" && kategori === "TUMU" && !ara.trim() && !filtreSayisi && !yaratici && kaynak === "hepsi";

  /* Süzgeç değişince sayfalama başa döner ve galeri başı görünür olur. */
  /* Önceki süzgeç anahtarıyla karşılaştırılır: StrictMode'daki çift çalıştırma ilk açılışta sayfayı kaydırmaz. */
  const oncekiSuzgec = useRef<string | null>(null);
  useEffect(() => {
    const anahtar = JSON.stringify([ara, kategori, kaynak, girdi, fiyat, videolu, istemli, sira, yaratici]);
    if (oncekiSuzgec.current === null || oncekiSuzgec.current === anahtar) { oncekiSuzgec.current = anahtar; return; }
    oncekiSuzgec.current = anahtar;
    setGoster(SAYFA);
    const el = galeriRef.current;
    if (!el) return;
    const ust = el.getBoundingClientRect().top;
    if (ust < 0 || ust > window.innerHeight * 0.6) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [ara, kategori, kaynak, girdi, fiyat, videolu, istemli, sira, yaratici]);
  const filtreTemizle = () => { setGirdi("hepsi"); setFiyat("hepsi"); setVideolu(false); setIstemli(false); setKategori("TUMU"); setAra(""); };
  const konuGor = (k: string) => { setKategori(k); };

  const SEKMELER: { id: Sekme; ad: string; ikon: React.ElementType; n?: number }[] = [
    { id: "kesfet", ad: "Keşfet", ikon: Compass },
    { id: "kayitli", ad: "Kaydedilenler", ikon: Bookmark, n: kayitliListe.length },
    { id: "benim", ad: "Benim presetlerim", ikon: Wand2, n: ozel.length },
    { id: "uretim", ad: "Üretimlerim", ikon: FolderOpen, n: presetUretimleri.length },
  ];
  const yY = yaraticiBul(yaratici ?? undefined);
  const baslik = sekme === "kayitli" ? "Kaydedilenler" : sekme === "benim" ? "Benim presetlerim" : yaratici ? `${yaratici === benimTutamac ? "Senin" : yY?.ad ?? yaratici} presetleri` : { hepsi: "Tüm presetler", vayra: "Vayra presetleri", topluluk: "Topluluk presetleri", takip: "Takip ettiklerin" }[kaynak];
  const toplulukGorunur = sekme === "kesfet" && (kaynak !== "vayra" || !!yaratici);
  const takipYeni = useMemo(() => [...akis].filter((p) => p.yazar && takip.includes(p.yazar)).sort((a, b) => (b.tarih ?? 0) - (a.tarih ?? 0)).slice(0, 12), [akis, takip]);
  const yeniler = useMemo(() => [...akis].sort((a, b) => (b.tarih ?? 0) - (a.tarih ?? 0)).slice(0, 12), [akis]);
  const yayinlaYeri = sekme === "kesfet" && kaynak !== "vayra" && !yaratici && !ara.trim() && !filtreSayisi && kategori === "TUMU" ? 7 : -1;
  const ogeler = liste.slice(0, goster - (yayinlaYeri >= 0 && liste.length >= goster ? 1 : 0));
  /* Boş sekmelerde altta tıklanabilir başlangıç içeriği (yalnız bilgi şeridi bırakılmaz). */
  const baslangic = (
    <Raf baslik="Popüler efektlerle başla" ikon={Flame} sag={<button onClick={() => sekmeDegis("kesfet")} className="flex h-9 items-center gap-1 rounded-full bg-white/[0.07] px-3 text-[12.5px] font-medium text-white/85 transition hover:bg-white/[0.12]">Keşfet<ArrowRight className="h-3.5 w-3.5" /></button>}>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {trendAkis.slice(0, 6).map((p, i) => <PresetKart key={p.slug} p={p} olay={olay} className={cn(i >= 4 && "max-sm:hidden lg:max-xl:hidden")} />)}
      </div>
    </Raf>
  );
  const bosTakip = kaynak === "takip" && !takip.length && sekme === "kesfet" && !ara.trim() && !filtreSayisi && !yaratici;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 pb-28 pt-4 sm:px-6 sm:pb-16 sm:pt-5">
      {/* Üst satır: sekmeler + oluştur */}
      <div className="flex items-center gap-2">
        <LayoutGroup id="preset-sekme">
          <div role="tablist" aria-label="Presetler" className="gizli-scroll -mx-4 flex min-w-0 flex-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex shrink-0 gap-0.5 rounded-full bg-white/[0.05] p-1">
              {SEKMELER.map((s) => (
                <button key={s.id} role="tab" aria-selected={sekme === s.id} onClick={() => sekmeDegis(s.id)}
                  className={cn("relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-medium transition-colors active:scale-[0.97]", sekme === s.id ? "text-black" : "text-white/60 hover:text-white")}>
                  {sekme === s.id && <motion.span layoutId="preset-sekme-z" className="absolute inset-0 rounded-full bg-white" transition={yay} />}
                  <s.ikon className="relative h-4 w-4" /><span className="relative">{s.ad}</span>
                  {!!s.n && <motion.span key={s.n} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} className={cn("relative text-[11.5px] tabular-nums", sekme === s.id ? "text-black/45" : "text-white/35")}>{s.n}</motion.span>}
                </button>
              ))}
            </div>
          </div>
        </LayoutGroup>
        <Link href="/panel/presetler/olustur" className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-black transition active:scale-[0.97] max-sm:hidden">
          <Plus className="h-4 w-4" strokeWidth={2.4} />Preset yayınla
        </Link>
      </div>

      {sekme === "uretim" ? <><UretimlerSekmesi />{!presetUretimleri.length && <div className="mt-4">{baslangic}</div>}</> : (
        <div className="mt-4 flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {raflar && (
              <motion.div key="raflar" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="overflow-clip">
                <div className="flex flex-col gap-4">
                  <GirisKarti vitrin={vitrin} toplam={akis.length} enUygun={Math.min(...akis.map((p) => p.kredi))} yeni={akis.find((p) => !p.yazar && p.etiket === "Yeni" && p.video) ?? akis.find((p) => !p.yazar && p.etiket === "Yeni")} onAc={panelAc} foto={<FotoHap />}
                    sag={<button onClick={() => galeriRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="inline-flex h-12 items-center gap-2 rounded-full bg-white/[0.07] px-5 text-[14.5px] font-medium text-white ring-1 ring-inset ring-white/[0.12] transition hover:bg-white/[0.12] active:scale-[0.97]"><Search className="h-4 w-4" />Tüm presetlerde ara</button>} />
                  <OnluRaf liste={(k) => trendAkis.filter((p) => k === "hepsi" || (k === "vayra" ? !p.yazar : !!p.yazar))} olay={olay} />
                  <KonuRafi akis={trendAkis} konular={konular} ad={katAd} ikon={katIkon} olay={olay} onTumu={konuGor} haric={gorulen} />
                  {takipYeni.length > 0 && <SatirRaf baslik="Takip ettiklerinden" ikon={UserCheck} liste={takipYeni} olay={olay}
                    sag={<button onClick={() => kaynakDegis("takip")} className="flex h-9 items-center gap-1 rounded-full bg-white/[0.07] px-3 text-[12.5px] font-medium text-white/85 hover:bg-white/[0.12]">Tümü<ArrowRight className="h-3.5 w-3.5" /></button>} />}
                  <YaraticiRafi akis={akis} takip={takip} onTakip={takipEt} onSec={yaraticiSec} />
                  <SatirRaf baslik="Yeni çıkanlar" ikon={Sparkles} liste={yeniler} olay={olay}
                    sag={<button onClick={() => setSira("yeni")} className="hidden h-9 items-center gap-1 rounded-full bg-white/[0.07] px-3 text-[12.5px] font-medium text-white/85 hover:bg-white/[0.12] sm:flex">Tümü<ArrowRight className="h-3.5 w-3.5" /></button>} />
                  <KarisimRafi />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Yaratıcı başlığı */}
          {yaratici && sekme === "kesfet" && <YaraticiBasligi kapak={kaynakListe[0]?.kapak} yazar={yaratici} benim={yaratici === benimTutamac} n={kaynakListe.length} takipte={takip.includes(yaratici)} onTakip={() => takipEt(yaratici)} onKapat={() => yaraticiSec(null)} />}
          {sekme === "benim" && <BenimOzet benimler={benimler} />}
          {sekme === "kesfet" && !yaratici && (kaynak === "topluluk" || kaynak === "takip") && <YaraticiRafi akis={akis} takip={takip} onTakip={takipEt} onSec={yaraticiSec} baslik={kaynak === "takip" && !takip.length ? "Takip edebileceğin yaratıcılar" : undefined} />}

          {/* Tüm presetler: yapışkan başlıklı sonuç kartı */}
          <section ref={galeriRef} className={cn("scroll-mt-[calc(var(--ust-nav)+8px)] rounded-[28px] bg-[#111214] ring-1 ring-inset ring-white/[0.07]", sekme === "benim" && !benimler.length && "hidden")}>
            <div className="z-30 rounded-t-[28px] border-b border-white/[0.06] bg-[#111214]/90 backdrop-blur-2xl sm:sticky sm:top-[var(--ust-nav)]">
              <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:px-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-white/[0.07] text-white max-sm:hidden"><LayoutGrid className="h-[18px] w-[18px]" /></span>
                <h2 className="flex min-w-0 items-center gap-2 text-[17px] font-semibold tracking-[-0.02em] text-white">
                  <span className="truncate">{baslik}</span>
                  <motion.span key={liste.length} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} className="shrink-0 rounded-full bg-white/[0.07] px-2 py-0.5 text-[12px] font-medium tabular-nums tracking-normal text-white/60">{liste.length}</motion.span>
                </h2>
                <AnimatePresence>
                  {(kategori !== "TUMU" || ara.trim() || filtreSayisi > 0) && (
                    <motion.button key="temizle" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={filtreTemizle}
                      className="flex h-8 max-w-[220px] items-center gap-1.5 rounded-full bg-white/[0.07] pl-3 pr-2 text-[12.5px] font-medium text-white/80 transition hover:bg-white/[0.12] hover:text-white">
                      <span className="truncate">{[kategori !== "TUMU" && katAd(kategori), ara.trim() && `"${ara.trim()}"`, filtreSayisi > 0 && `${filtreSayisi} filtre`].filter(Boolean).join(" · ")}</span><X className="h-3.5 w-3.5 shrink-0" />
                    </motion.button>
                  )}
                </AnimatePresence>
                {sekme === "kesfet" && !yaratici && (
                    <LayoutGroup id="preset-kaynak">
                      <div role="radiogroup" aria-label="Kaynak" className="ml-auto flex h-10 shrink-0 items-center gap-0.5 rounded-full bg-white/[0.06] p-0.5">
                        {([["hepsi", "Hepsi", LayoutGrid], ["vayra", "Vayra", Sparkles], ["topluluk", "Topluluk", Users], ["takip", "Takip", UserCheck]] as const).map(([k, a, I]) => (
                          <button key={k} role="radio" aria-checked={kaynak === k} aria-label={a} onClick={() => kaynakDegis(k)}
                            className={cn("relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors active:scale-[0.97]", kaynak === k ? "text-black" : "text-white/65 hover:text-white")}>
                            {kaynak === k && <motion.span layoutId="preset-kaynak-z" className="absolute inset-0 rounded-full bg-white" transition={yay} />}
                            <I className="relative h-4 w-4" /><span className={cn("relative", kaynak !== k && "max-xl:hidden", "max-sm:hidden")}>{a}</span>
                            {k === "takip" && takip.length > 0 && <span className={cn("relative text-[11px] tabular-nums max-sm:hidden", kaynak === k ? "text-black/45" : "text-white/35")}>{takip.length}</span>}
                          </button>
                        ))}
                      </div>
                    </LayoutGroup>
                  )}
                <div className={cn("flex min-w-0 items-center gap-1.5 max-sm:w-full", !(sekme === "kesfet" && !yaratici) && "sm:ml-auto")}>
                  <label className="group relative min-w-0 flex-1 sm:w-[240px] sm:flex-none xl:w-[280px]">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within:text-white" />
                    <input ref={aramaRef} value={ara} onChange={(e) => setAra(e.target.value)} placeholder="Efekt ya da yaratıcı ara" aria-label="Preset ara"
                      className="h-10 w-full rounded-full bg-white/[0.06] pl-10 pr-10 text-[13.5px] text-white outline-none transition placeholder:text-white/40 focus:bg-white/[0.09]" />
                    {ara ? (
                      <button onClick={() => setAra("")} aria-label="Aramayı temizle" className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-black hover:bg-white/40"><X className="h-3.5 w-3.5" strokeWidth={3} /></button>
                    ) : <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 max-md:!hidden">/</kbd>}
                  </label>
                  <div className="relative shrink-0">
                    <button onClick={() => setFiltreAcik((v) => !v)} aria-expanded={filtreAcik} aria-label="Filtreler"
                      className={cn("flex h-10 items-center gap-2 rounded-full px-3 text-[13px] font-medium transition active:scale-[0.97] lg:px-3.5", filtreSayisi ? "bg-white text-black" : "bg-white/[0.06] text-white/75 hover:bg-white/[0.1] hover:text-white")}>
                      <SlidersHorizontal className="h-4 w-4" /><span className="hidden lg:inline">Filtre</span>
                      {filtreSayisi > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[11px] font-bold text-white">{filtreSayisi}</span>}
                    </button>
                    <Yuzen acik={filtreAcik} onKapat={() => setFiltreAcik(false)} yerlesim="alt-sag" bosluk={8} etiket="Filtreler"
                      className="w-[min(400px,calc(100vw-24px))] rounded-[22px] border border-white/[0.09] bg-[#141416] p-4">
                      <FiltrePanel girdi={girdi} setGirdi={setGirdi} fiyat={fiyat} setFiyat={setFiyat} videolu={videolu} setVideolu={setVideolu} istemli={istemli} setIstemli={setIstemli}
                        onTemizle={() => { setGirdi("hepsi"); setFiyat("hepsi"); setVideolu(false); setIstemli(false); }} sonuc={liste.length} onKapat={() => setFiltreAcik(false)} />
                    </Yuzen>
                  </div>
                  <div className="relative shrink-0">
                    <button onClick={() => setSiraAcik((v) => !v)} aria-expanded={siraAcik} aria-label="Sırala"
                      className="flex h-10 items-center gap-2 rounded-full bg-white/[0.06] px-3 text-[13px] font-medium text-white/75 transition hover:bg-white/[0.1] hover:text-white active:scale-[0.97] lg:px-3.5">
                      <ArrowDownUp className="h-4 w-4" /><span className="hidden lg:inline">{SIRALAR.find((s) => s.id === sira)!.ad}</span>
                    </button>
                    <Yuzen acik={siraAcik} onKapat={() => setSiraAcik(false)} yerlesim="alt-sag" bosluk={8} etiket="Sırala"
                      className="w-[280px] rounded-[20px] border border-white/[0.09] bg-[#141416] p-1.5">
                      <p className="px-2.5 pb-1.5 pt-1 text-[12.5px] font-semibold text-white">Sırala</p>
                      {SIRALAR.map((s) => (
                        <button key={s.id} role="menuitemradio" aria-checked={sira === s.id} onClick={() => { setSira(s.id); setSiraAcik(false); }}
                          className={cn("flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2 text-left transition-colors hover:bg-white/[0.05]", sira === s.id && "bg-white/[0.06]")}>
                          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]", sira === s.id ? "text-white" : "text-white/55")}><s.ikon className="h-4 w-4" /></span>
                          <span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-white">{s.ad}</span><span className="block text-[11.5px] text-white/45">{s.alt}</span></span>
                          {sira === s.id && <Check className="h-4 w-4 shrink-0 text-white" />}
                        </button>
                      ))}
                    </Yuzen>
                  </div>
                </div>
              </div>
              {sekme !== "benim" && kaynakListe.length > 0 && sayilar.size > 1 && <div className="px-3 pb-2.5 sm:px-4">{kategoriSeridi("kat")}</div>}
            </div>

            <div className="p-3 sm:p-4">
              {liste.length ? (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {ogeler.map((p, i) => (
                    <Fragment key={p.slug}>
                      {i === yayinlaYeri && <YayinlaKarti />}
                      <PresetKart p={p} olay={olay} kullandin={kullanimSay(p)} />
                    </Fragment>
                  ))}
                </div>
              ) : sekme === "benim" ? (benimler.length ? <BosDurum sekme={sekme} onTemizle={filtreTemizle} onKesfet={() => sekmeDegis("kesfet")} /> : null) : bosTakip ? (
                <div className="flex flex-col items-start gap-3 rounded-[22px] bg-white/[0.025] p-5 ring-1 ring-inset ring-white/[0.07] sm:flex-row sm:items-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.07]"><UserCheck className="h-5 w-5 text-white" /></span>
                  <div className="min-w-0 flex-1"><p className="text-[15px] font-semibold text-white">Henüz kimseyi takip etmiyorsun</p><p className="mt-0.5 text-[13px] text-white/55">Beğendiğin yaratıcıları takip et; yeni presetleri burada toplanır.</p></div>
                  <button onClick={() => kaynakDegis("topluluk")} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black">Topluluğa göz at<ArrowRight className="h-4 w-4" /></button>
                </div>
              ) : <BosDurum sekme={sekme} onTemizle={filtreTemizle} onKesfet={() => sekmeDegis("kesfet")} onHepsi={sekme === "kesfet" && (kaynak !== "hepsi" || !!yaratici) ? () => { if (yaratici) yaraticiSec(null); kaynakDegis("hepsi"); } : undefined} />}
            </div>

            {(liste.length > goster || (toplulukGorunur && liste.length > 0)) && (
              <footer className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-4 py-3 sm:px-5">
                {toplulukGorunur && <p className="text-[12.5px] text-white/45">Topluluk presetleri ve sayılar şimdilik örnek içeriktir.</p>}
                {liste.length > goster && (
                  <button onClick={() => setGoster((g) => g + SAYFA)} className="ml-auto flex h-10 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] font-medium text-white transition hover:bg-white/[0.13] active:scale-[0.97]">
                    Daha fazla göster<span className="tabular-nums text-white/50">{liste.length - goster}</span>
                  </button>
                )}
              </footer>
            )}
          </section>
          {yaratici && sekme === "kesfet" && kaynakListe.length < 6 && <YaraticiRafi akis={akis} takip={takip} onTakip={takipEt} onSec={yaraticiSec} baslik="Diğer yaratıcılar" haric={yaratici} />}
          {((sekme === "kayitli" && !kayitliListe.length) || (sekme === "benim" && !benimler.length)) && baslangic}
        </div>
      )}

      <AnimatePresence>
        {secili && <PresetPaneli key="panel" p={secili} tumu={akis} benimTutamac={benimTutamac} onKapat={() => panelAc(null)} onSec={panelAc} onYaratici={yaraticiSec} />}
      </AnimatePresence>
    </div>
  );

  function kategoriSeridi(id: string) {
    const l = [["TUMU", "Tümü", LayoutGrid, kaynakListe.length] as const, ...KATEGORI_SIRA.filter((k) => (sayilar.get(k) ?? 0) > 0).map((k) => [k, katAd(k), KAT_IKON[k] ?? Sparkles, sayilar.get(k) ?? 0] as const)];
    return <KategoriIzi id={id} liste={l} deger={kategori} set={setKategori} />;
  }
}

function YaraticiBasligi({ yazar, benim, n, takipte, onTakip, onKapat, kapak }: { yazar: string; benim: boolean; n: number; takipte: boolean; onTakip: () => void; onKapat: () => void; kapak?: string }) {
  const y = yaraticiBul(yazar);
  return (
    <section className="relative flex flex-wrap items-center gap-4 overflow-hidden rounded-[28px] bg-[#111214] p-5 ring-1 ring-inset ring-white/[0.08] sm:p-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {kapak && <img src={kapak} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-25 blur-[60px]" />}
      <span className="relative rounded-full ring-[3px] ring-white/10"><YaraticiAvatar yazar={yazar} boyut={64} /></span>
      <div className="relative min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[22px] font-semibold tracking-[-0.02em] text-white">{benim ? "Sen" : y?.ad ?? yazar}{y?.dogrulanmis && <BadgeCheck className="h-4 w-4" />}</p>
        <p className="text-[13px] text-white/55">{yazar} · {n} preset{y ? ` · ${sayiKisa(y.takipci + (takipte ? 1 : 0))} takipçi` : ""}</p>
        {y?.bio && <p className="mt-1 text-[13px] text-white/70">{y.bio}</p>}
      </div>
      {!benim && <button onClick={onTakip} aria-pressed={takipte} className={cn("relative flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold active:scale-[0.97]", takipte ? "bg-white/[0.08] text-white" : "bg-white text-black")}>{takipte ? <><Check className="h-4 w-4" />Takipte</> : <><UserPlus className="h-4 w-4" />Takip et</>}</button>}
      <button onClick={onKapat} className="relative flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] text-white/60 hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" />Tüm presetler</button>
    </section>
  );
}

/** Benim presetlerim özeti: yayın durumu, kullanım, kazanç ve Earn bağlantısı. */
function BenimOzet({ benimler }: { benimler: KatalogPreset[] }) {
  const yayinda = benimler.filter((p) => !p.taslak && (p.gorunurluk ?? "topluluk") === "topluluk").length;
  if (!benimler.length) return (
    <div className="mt-2 overflow-hidden rounded-[26px] bg-[radial-gradient(90%_120%_at_0%_0%,rgba(85,214,253,0.12),transparent_60%),#121316] ring-1 ring-inset ring-white/[0.08]">
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <div>
          <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white text-black"><Wand2 className="h-5 w-5" /></span>
          <h3 className="mt-4 text-[24px] font-semibold tracking-[-0.02em] text-white">İlk presetini yayınla</h3>
          <p className="mt-2 max-w-[440px] text-[14px] leading-relaxed text-white/60">Hareketi tarif et, farklı yüzlerle test et ve toplulukta paylaş. Ek fiyat koyarsan her kullanımda yarısı sana kalır; kazancın Earn cüzdanına geçer.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/panel/presetler/olustur" className="flex h-11 items-center gap-1.5 rounded-full bg-white px-5 text-[14px] font-semibold text-black active:scale-[0.97]"><Plus className="h-4 w-4" />Preset oluştur</Link>
            <Link href="/earn/marketplace" className="flex h-11 items-center gap-1.5 rounded-full bg-white/[0.07] px-4 text-[14px] font-medium text-white/85 transition hover:bg-white/[0.12]"><Wallet className="h-4 w-4" />Nasıl kazanırım</Link>
          </div>
        </div>
        <ol className="grid gap-2">
          {([["Tarif et", "Özneye ne olacağını, kamerayı ve atmosferi seç.", Wand2], ["Test et", "Farklı yüzlerle dene, en iyi sonucu kapak yap.", Play], ["Yayınla ve kazan", "Toplulukta paylaş, ek fiyatın yarısı sana.", Wallet]] as const).map(([b, a, I], i) => (
            <li key={b} className="flex items-center gap-3 rounded-[16px] bg-white/[0.04] p-3 ring-1 ring-inset ring-white/[0.06]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[13px] font-semibold tabular-nums text-white">{i + 1}</span>
              <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-white">{b}</span><span className="block text-[12.5px] text-white/50">{a}</span></span>
              <I className="h-4 w-4 shrink-0 text-white/40" />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
  const taslak = benimler.filter((p) => p.taslak).length;
  const kullanim = benimler.reduce((a, p) => a + (p.kullanimSayi ?? 0), 0);
  const kazanc = usePaylasim((s) => s.benimPaylasimlar).filter((p) => p.tur === "preset").reduce((a, p) => a + (p.kazanc ?? 0), 0);
  return (
    <div className="mb-3 mt-1 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <Link href="/panel/presetler/olustur" className="group flex items-center gap-4 rounded-[20px] bg-white/[0.03] p-4 ring-1 ring-inset ring-white/[0.08] transition hover:bg-white/[0.05]">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-white text-black transition-transform group-hover:scale-105"><Wand2 className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold text-white">Yeni preset oluştur</span><span className="block text-[12.5px] text-white/50">Hareketi tarif et, farklı yüzlerle test et, yayınla</span></span>
        <ArrowRight className="h-4 w-4 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
      </Link>
      <div className="flex items-center gap-2 rounded-[20px] bg-white/[0.03] p-2 ring-1 ring-inset ring-white/[0.08]">
        <dl className="grid min-w-0 flex-1 grid-cols-4 divide-x divide-white/[0.06] text-center">
          {([["Toplulukta", yayinda], ["Taslak", taslak], ["Kullanım", sayiKisa(kullanim)], ["Kazanç", `${kazanc} kredi`]] as const).map(([k, v]) => (
            <div key={k} className="px-1.5 py-1.5"><dt className="text-[11.5px] text-white/45">{k}</dt><dd className="mt-0.5 truncate text-[15px] font-semibold tabular-nums text-white">{v}</dd></div>
          ))}
        </dl>
        <Link href="/earn/marketplace" className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[13px] font-medium text-white/85 transition hover:bg-white/[0.12]"><Wallet className="h-4 w-4" />Kazanç paneli</Link>
      </div>
    </div>
  );
}

/** Tek parça kategori izi: kayan beyaz seçim, kenarlarda yumuşak geçiş ve gerektiğinde ok düğmeleri; seçili ortaya kayar. */
function KategoriIzi({ id, liste, deger, set }: { id: string; liste: readonly (readonly [string, string, React.ElementType, number])[]; deger: string; set: (k: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [kenar, setKenar] = useState({ sol: false, sag: false });
  const olc = useCallback(() => { const el = ref.current; if (!el) return; setKenar({ sol: el.scrollLeft > 4, sag: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 }); }, []);
  useEffect(() => { olc(); const el = ref.current; if (!el) return; const ro = new ResizeObserver(olc); ro.observe(el); return () => ro.disconnect(); }, [olc]);
  useEffect(() => {
    const el = ref.current, b = el?.querySelector<HTMLElement>(`[data-k="${deger}"]`);
    if (el && b) el.scrollTo({ left: b.offsetLeft - el.clientWidth / 2 + b.offsetWidth / 2, behavior: "smooth" });
  }, [deger]);
  const kaydir = (d: number) => ref.current?.scrollBy({ left: d * 360, behavior: "smooth" });
  const maske = `linear-gradient(90deg, ${kenar.sol ? "transparent, #000 56px" : "#000, #000"}, ${kenar.sag ? "#000 calc(100% - 56px), transparent" : "#000, #000"})`;
  return (
    <div className="relative rounded-full bg-white/[0.04] p-1 ring-1 ring-inset ring-white/[0.07]">
      <LayoutGroup id={id}>
        <div ref={ref} onScroll={olc} className="gizli-scroll flex gap-0.5 overflow-x-auto" style={{ maskImage: maske, WebkitMaskImage: maske }}>
          {liste.map(([k, ad, I, n]) => {
            const s = deger === k;
            return (
              <button key={k} data-k={k} onClick={() => set(k)} aria-pressed={s} className="group relative flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-[13.5px] font-medium active:scale-[0.97]">
                {s && <motion.span layoutId={id + "-z"} className="absolute inset-0 rounded-full bg-white" transition={yay} />}
                <I className={cn("relative h-4 w-4 transition-colors", s ? "text-black" : "text-white/45 group-hover:text-white/80")} />
                <span className={cn("relative whitespace-nowrap transition-colors", s ? "text-black" : "text-white/65 group-hover:text-white")}>{ad}</span>
                <span className={cn("relative text-[11.5px] tabular-nums", s ? "text-black/45" : "text-white/30")}>{n}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>
      <AnimatePresence>
        {kenar.sol && <motion.button key="s" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => kaydir(-1)} aria-label="Geri" className="absolute left-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#1b1c1f] text-white ring-1 ring-white/[0.1] transition hover:bg-[#25262a] sm:flex"><ArrowRight className="h-4 w-4 rotate-180" /></motion.button>}
        {kenar.sag && <motion.button key="g" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => kaydir(1)} aria-label="İleri" className="absolute right-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#1b1c1f] text-white ring-1 ring-white/[0.1] transition hover:bg-[#25262a] sm:flex"><ArrowRight className="h-4 w-4" /></motion.button>}
      </AnimatePresence>
    </div>
  );
}

/* ───────── Galeri kartı (kullanıcı seçimi K1: yazısız video) ───────── */

/**
 * 9:16 kart: tamamı video, üzerinde yazı yok. Ekrandayken örnek video sessiz döngüde oynar
 * (yoksa kapak yavaşça kayar). Üzerine gelince alt kenarda cam hapta ad + kredi ve "Dene" çıkar;
 * dokunmatikte hap hep görünür. Rozet sağ üstte tek küçük cam hap.
 */
/** Kart rozeti: tek tip yumuşak cam hap; tür rengi yalnız küçük işarette. */
export function KartRozet({ tur, children }: { tur: "trend" | "yeni" | "pro" | "senin"; children: React.ReactNode }) {
  const isaret = tur === "trend" ? <Flame className="h-3 w-3 text-[#ffb347]" strokeWidth={2.4} />
    : tur === "pro" ? <Crown className="h-3 w-3 text-[#ffd36b]" strokeWidth={2.4} />
    : tur === "yeni" ? <span className="relative flex h-1.5 w-1.5"><span className="absolute inset-0 animate-ping rounded-full bg-[#55d6fd]/70" /><span className="h-1.5 w-1.5 rounded-full bg-[#55d6fd]" /></span>
    : <Wand2 className="h-3 w-3 text-white/80" />;
  return (
    <span className="inline-flex h-[22px] items-center gap-1.5 rounded-full bg-black/35 pl-2 pr-2.5 text-[11.5px] font-semibold tracking-[-0.005em] text-white ring-1 ring-inset ring-white/[0.14] backdrop-blur-xl [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
      {isaret}{children}
    </span>
  );
}

/** Preset sayfasındaki raflar için: galerideki kartın aynısı (tek kart dili); dokununca preset sayfasına gider. */
export function GaleriKart({ p, href, kullanim = 0, buyuk }: {
  p: KatalogPreset; href: string; kayitli?: boolean; onKayit?: () => void; kullanim?: number; buyuk?: boolean;
}) {
  const router = useRouter();
  const benimTutamac = tutamac(useAuth((s) => s.kullanici?.ad));
  const olay = useMemo<KartOlay>(() => ({ onAc: () => router.push(href), onYaratici: (y) => router.push(`/panel/presetler?yaratici=${encodeURIComponent(y)}`), benimTutamac }), [router, href, benimTutamac]);
  return <PresetKart p={p} olay={olay} kullandin={kullanim} kutu={buyuk ? "aspect-[9/16]" : "aspect-[9/14]"} />;
}

/* ───────── Fotoğraf oturumu ───────── */

/** Bir kez ekle, seçtiğin her efekt onunla açılır. Yapıştır ve sürükle-bırak da çalışır. */
function FotoHap() {
  const foto = usePresetOturum((s) => s.foto);
  const ayarla = usePresetOturum((s) => s.ayarla);
  const [isleniyor, setIsleniyor] = useState(false);
  const [surukle, setSurukle] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const al = useCallback(async (d?: File | null) => {
    setIsleniyor(true);
    const m = await fotoOku(d);
    setIsleniyor(false);
    if (m) { ayarla({ foto: m }); toast.success("Fotoğraf yüklendi", { description: "Seçtiğin her efekt bu fotoğrafla açılır." }); }
  }, [ayarla]);
  useEffect(() => {
    const yapistir = (e: ClipboardEvent) => {
      const h = e.target as HTMLElement;
      if (h.tagName === "TEXTAREA" || h.tagName === "INPUT") return;
      const d = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
      if (d) { e.preventDefault(); void al(d); }
    };
    window.addEventListener("paste", yapistir);
    return () => window.removeEventListener("paste", yapistir);
  }, [al]);
  const surukleOlay = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setSurukle(true); },
    onDragLeave: () => setSurukle(false),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setSurukle(false); void al(e.dataTransfer.files[0]); },
  };
  return (
    <>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden onChange={(e) => { void al(e.target.files?.[0]); e.target.value = ""; }} />
      <AnimatePresence mode="wait" initial={false}>
        {foto ? (
          <motion.div key="var" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} {...surukleOlay}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-white/[0.07] py-1 pl-1 pr-1.5 ring-1 ring-inset ring-white/[0.14]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={foto.url} alt="Seçilen fotoğraf" className="h-10 w-10 rounded-full object-cover" />
            <span className="text-left leading-tight"><span className="flex items-center gap-1 text-[13px] font-semibold text-white"><Check className="h-3.5 w-3.5 text-[#55d6fd]" strokeWidth={3} />Fotoğrafın hazır</span><span className="block text-[11.5px] text-white/50">Bir efekte dokun</span></span>
            <button onClick={() => ref.current?.click()} className="ml-1 h-8 rounded-full px-2.5 text-[12px] font-medium text-white/65 hover:bg-white/[0.08] hover:text-white">Değiştir</button>
            <button onClick={() => ayarla({ foto: null })} aria-label="Fotoğrafı kaldır" className="flex h-8 w-8 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.08] hover:text-white"><X className="h-4 w-4" /></button>
          </motion.div>
        ) : (
          <motion.button key="yok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={() => ref.current?.click()} {...surukleOlay}
            className={cn("inline-flex h-12 items-center gap-2 rounded-full pl-2 pr-5 text-[15px] font-semibold transition hover:-translate-y-px active:scale-[0.97]", surukle ? "bg-white text-black ring-4 ring-[#55d6fd]/40" : "bg-white text-black")}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.07]">{isleniyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}</span>
            Fotoğrafını ekle
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

/* ───────── Filtre paneli ───────── */

function FiltrePanel({ girdi, setGirdi, fiyat, setFiyat, videolu, setVideolu, istemli, setIstemli, onTemizle, sonuc, onKapat }: {
  girdi: Girdi | "hepsi"; setGirdi: (g: Girdi | "hepsi") => void; fiyat: Fiyat; setFiyat: (f: Fiyat) => void;
  videolu: boolean; setVideolu: (v: boolean) => void; istemli: boolean; setIstemli: (v: boolean) => void; onTemizle: () => void; sonuc: number; onKapat: () => void;
}) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-white">Fotoğrafında ne var?</p>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {([["hepsi", { ad: "Hepsi", ikon: LayoutGrid, ipucu: "Tüm presetler", iyi: "Tüm presetler" }], ...Object.entries(GIRDI).map(([k, v]) => [k, v])] as [Girdi | "hepsi", { ad: string; ikon: React.ElementType; ipucu: string; iyi: string }][]).map(([id, v]) => (
          <button key={id} onClick={() => setGirdi(id)} aria-pressed={girdi === id}
            className={cn("flex items-center gap-2.5 rounded-[14px] p-2 text-left ring-1 ring-inset transition-colors", girdi === id ? "bg-white/[0.09] ring-white/30" : "bg-white/[0.03] ring-white/[0.06] hover:bg-white/[0.06]", id === "hepsi" && "col-span-2")}>
            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]", girdi === id ? "bg-white text-black" : "bg-white/[0.06] text-white/60")}><v.ikon className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-medium text-white">{v.ad}</span><span className="block truncate text-[11px] text-white/45">{v.iyi}</span></span>
            {girdi === id && <Check className="h-4 w-4 shrink-0 text-white" />}
          </button>
        ))}
      </div>

      <p className="mt-4 text-[13px] font-semibold text-white">Bedel</p>
      <LayoutGroup id="fiyat">
        <div className="mt-2 grid grid-cols-4 rounded-full bg-white/[0.04] p-1 ring-1 ring-inset ring-white/[0.07]">
          {FIYATLAR.map((f) => (
            <button key={f.id} onClick={() => setFiyat(f.id)} aria-pressed={fiyat === f.id} title={f.alt} className="relative h-8 rounded-full text-[12.5px] font-medium">
              {fiyat === f.id && <motion.span layoutId="fiyat-z" className="absolute inset-0 rounded-full bg-white" transition={yay} />}
              <span className={cn("relative", fiyat === f.id ? "text-black" : "text-white/65")}>{f.ad}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>
      <p className="mt-1.5 px-1 text-[11.5px] text-white/45">{FIYATLAR.find((f) => f.id === fiyat)!.alt}</p>

      <button role="switch" aria-checked={videolu} onClick={() => setVideolu(!videolu)}
        className="mt-4 flex w-full items-center gap-3 rounded-[14px] bg-white/[0.03] p-2.5 text-left ring-1 ring-inset ring-white/[0.06] hover:bg-white/[0.05]">
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]", videolu ? "bg-white text-black" : "bg-white/[0.06] text-white/60")}><Film className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-medium text-white">Yalnız örnek videolu</span><span className="block text-[11px] text-white/45">Sonucu önceden izleyebildiklerin</span></span>
        <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", videolu ? "bg-white" : "bg-white/15")}><motion.span layout transition={yay} className={cn("absolute top-0.5 h-4 w-4 rounded-full", videolu ? "right-0.5 bg-[#0a0a0b]" : "left-0.5 bg-white")} /></span>
      </button>
      <button role="switch" aria-checked={istemli} onClick={() => setIstemli(!istemli)}
        className="mt-1.5 flex w-full items-center gap-3 rounded-[14px] bg-white/[0.03] p-2.5 text-left ring-1 ring-inset ring-white/[0.06] hover:bg-white/[0.05]">
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]", istemli ? "bg-white text-black" : "bg-white/[0.06] text-white/60")}><Eye className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1"><span className="block text-[12.5px] font-medium text-white">İstemi açık olanlar</span><span className="block text-[11px] text-white/45">Yaratıcının tarifini görüp öğrenebildiklerin</span></span>
        <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", istemli ? "bg-white" : "bg-white/15")}><motion.span layout transition={yay} className={cn("absolute top-0.5 h-4 w-4 rounded-full", istemli ? "right-0.5 bg-[#0a0a0b]" : "left-0.5 bg-white")} /></span>
      </button>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.07] pt-3">
        <button onClick={onTemizle} className="rounded-full px-3 py-2 text-[12.5px] font-medium text-white/60 hover:bg-white/[0.05] hover:text-white">Sıfırla</button>
        <button onClick={onKapat} className="rounded-full bg-white px-4 py-2 text-[12.5px] font-semibold text-black active:scale-[0.97]">{sonuc} preseti göster</button>
      </div>
    </div>
  );
}

/* ───────── Boş durumlar ───────── */

function BosDurum({ sekme, onTemizle, onKesfet, onHepsi }: { sekme: Sekme; onTemizle: () => void; onKesfet: () => void; onHepsi?: () => void }) {
  const kayitli = sekme === "kayitli";
  const ornek = RESMI_PRESETLER.filter((p) => p.etiket === "Trend").slice(0, 3);
  return (
    <div className="flex flex-col items-start gap-4 rounded-[22px] bg-white/[0.025] p-5 ring-1 ring-inset ring-white/[0.07] sm:flex-row sm:items-center">
      <div className="flex -space-x-3">{ornek.map((p) => <span key={p.slug} className="relative h-14 w-10 overflow-hidden rounded-[10px] ring-2 ring-[#111214]"><PresetKapak p={p} /></span>)}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-white">{kayitli ? "Henüz kaydettiğin preset yok" : "Eşleşen preset yok"}</p>
        <p className="mt-0.5 text-[13px] text-white/55">{kayitli ? "Kartların köşesindeki yer imiyle beğendiğin efektleri burada topla." : onHepsi ? "Bu görünümde sonuç yok. Tüm presetlerde aramayı dene." : "Başka bir kelime dene ya da filtreleri temizle."}</p>
      </div>
      {!kayitli && onHepsi && <button onClick={onHepsi} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-[13px] font-medium text-white transition hover:bg-white/[0.13] active:scale-[0.97]">Tüm presetlerde ara</button>}
      <button onClick={kayitli ? onKesfet : onTemizle} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black active:scale-[0.97]">
        {kayitli ? <>Presetleri keşfet<ArrowRight className="h-4 w-4" /></> : "Filtreleri temizle"}
      </button>
    </div>
  );
}

/* ───────── Üretimlerim ───────── */

function UretimlerSekmesi() {
  const uretimler = useProjeler((s) => s.uretimler);
  const [tur, setTur] = useState<"hepsi" | "suruyor" | "tamam">("hepsi");
  const tum = useMemo(() => uretimler.filter((u) => u.arac === ARAC), [uretimler]);
  const liste = tum.filter((u) => tur === "hepsi" || (tur === "tamam" ? u.durum === "tamam" : u.durum !== "tamam" && u.durum !== "hata"));
  if (!tum.length) {
    const ornek = RESMI_PRESETLER.filter((p) => p.etiket === "Trend").slice(0, 3);
    return (
      <div className="mt-6 flex flex-col items-start gap-4 rounded-[24px] bg-white/[0.025] p-5 ring-1 ring-inset ring-white/[0.07] sm:flex-row sm:items-center">
        <div className="flex -space-x-3">{ornek.map((p) => <span key={p.slug} className="relative h-14 w-10 overflow-hidden rounded-[10px] ring-2 ring-zemin"><PresetKapak p={p} /></span>)}</div>
        <div className="min-w-0 flex-1"><p className="text-[15px] font-semibold text-white">Henüz preset videon yok</p><p className="mt-0.5 text-[13px] text-white/50">Bir efekt seç, fotoğrafını ekle; videoların burada toplanır.</p></div>
        <Link href="/panel/presetler" onClick={() => window.scrollTo({ top: 0 })} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black">Presetleri keşfet<ArrowRight className="h-4 w-4" /></Link>
      </div>
    );
  }
  return (
    <div className="mt-6">
      <LayoutGroup id="uretim-tur">
        <div className="flex w-max gap-0.5 rounded-full bg-white/[0.04] p-1 ring-1 ring-inset ring-white/[0.07]">
          {([["hepsi", "Hepsi"], ["suruyor", "Üretiliyor"], ["tamam", "Tamamlanan"]] as const).map(([id, ad]) => (
            <button key={id} onClick={() => setTur(id)} aria-pressed={tur === id} className="relative h-8 rounded-full px-3.5 text-[13px] font-medium">
              {tur === id && <motion.span layoutId="uretim-tur-z" className="absolute inset-0 rounded-full bg-white" transition={yay} />}
              <span className={cn("relative", tur === id ? "text-black" : "text-white/60 hover:text-white")}>{ad}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>
      <div className="mt-4 columns-2 gap-3 sm:columns-3 lg:columns-4 2xl:columns-5">
        {liste.map((u) => <div key={u.id} className="mb-3 break-inside-avoid"><UretimKarti u={u} kutuBoyut="orta" /></div>)}
      </div>
    </div>
  );
}
