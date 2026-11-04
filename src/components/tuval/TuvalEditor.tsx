"use client";
import { useMasaustu } from "@/hooks/useMasaustu";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KrediJeton } from "@/components/ui/KrediHap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  AppWindow, ArrowLeft, ArrowUp, Ban, History, MessageSquare, FolderDown, Grid3x3, BookmarkPlus, Check, ChevronDown, ClipboardCopy, Copy, Download, FileJson, Frame, Hand, HelpCircle, Keyboard, LayoutGrid, Library, Loader2, Lock, Map as MapIcon, Maximize,
  Minimize2, Minus, MousePointer2, Play, Plus, Redo2, Search, Share2, SlidersHorizontal, Sparkles, Square, StickyNote, Trash2, Type, Undo2, Ungroup, Unlock, Upload, X,
  ArrowRight, ChevronsRight, Clapperboard, CopyPlus, Film, Images, Link2, Mic, PanelLeft, PanelRight, ShoppingBag, Unplug, UserRound, WandSparkles,
} from "lucide-react";
import { KisayolPaneli } from "./KisayolPaneli";
import { CiktiPaneli, DUGUM_SURUKLE, DugumKitapligi, Sunum, ciktilariTopla } from "./Atolye";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { mesaj } from "@/lib/mesaj";
import { useAuth } from "@/store/useAuth";
import { useKrediModal } from "@/store/useKrediModal";
import { gorselYukle } from "@/components/arac/kit";
import { VayraIsaret } from "@/components/kabuk/VayraIsaret";
import { KATALOG, PORT_RENK, type DugumTur, saydam } from "@/lib/tuval/katalog";
import { calisacaklar, dugumCalistir, girdileriTopla, iptalEt, dugumOgeleri, siradakileriIptal, tahminiKredi, tumunuCalistir, asagiEski } from "@/lib/tuval/calistir";
import { SABLONLAR, akisPlanla, tarifKur, type AsistanPlan } from "@/lib/tuval/kurucu";
import { baglantiKontrol, dugumOlustur, geriVar, ileriVar, useTuval, yeniId, type Dugum as TDugum, type Gorunum, type Kenar, type Yorum, type Surum, type Tuval } from "@/store/useTuval";
import { genislik, hizala, otoDuzen, sablonHazirla, useKendiSablon, yukseklikTahmin, type Kilavuz } from "@/lib/tuval/duzen";
import { dosyaYukle } from "@/components/montaj/ortak";
import { Dugum, portY } from "./Dugum";
import { Denetci } from "./Denetci";
import { MaskeCizici } from "./MaskeCizici";
import { UygulamaPenceresi } from "./Uygulama";
import { GecmisPaneli, Gorunum3D, YorumBalonu, YorumIgne, YorumPaneli } from "./EditorEk2";
import { AramaKutusu, BaglamMenu, CalistirOnay, Varliklar, type MenuOge, type OnaySatir, type Varlik } from "./EditorEk";
import { KomutPaleti } from "./KomutPaleti";
import { PaylasPenceresi } from "./Paylas";
import { ETIKET_RENK, IZGARA, TEMALAR, temaSinifi, useTuvalTema } from "@/lib/tuval/tema";
import { zipIndir } from "@/lib/zipYaz";
import { useOrtak } from "@/lib/tuval/ortak";

/**
 * Canvas editörü (onaylanan A + C düzeni): tam ekran sonsuz tuval; altta yüzen araç çubuğu, gerektiğinde açılan asistan kutusu;
 * sol üstte başlık, sağ üstte kredi tahmini + Tümünü çalıştır + Paylaş; sol altta yakınlaştırma, sağ altta mini harita.
 */
type Arac = "sec" | "el" | "yorum";
type Surukleme =
  | { tur: "kaydir"; sx: number; sy: number; ox: number; oy: number }
  | { tur: "tasi"; sx: number; sy: number; ids: string[]; dx: number; dy: number; kilavuz?: Kilavuz[] }
  | { tur: "kutu"; sx: number; sy: number; ex: number; ey: number; ek: boolean }
  | { tur: "bagla"; kaynak: string; wx: number; wy: number };

const ZMIN = 0.15, ZMAX = 2.5;
const yazilabilir = (el: EventTarget | null) => { const h = el as HTMLElement | null; return !!h && (h.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(h.tagName)); };
const GIRIS = { opacity: 0, scale: 0.92 }, HEDEF = { opacity: 1, scale: 1 }, GECIS = { type: "spring" as const, stiffness: 380, damping: 30 };
/** Bağlantı sürüklerken uygun girişler; aynı dizi döner ki kartlar gereksiz çizilmesin. */
const portOnbellek = new Map<string, string[]>();
const uygunPortlar = (tur: DugumTur, tip: string) => { const k = `${tur}:${tip}`; let v = portOnbellek.get(k); if (!v) { v = KATALOG[tur].girisler.filter((x) => x.tip === tip).map((x) => x.id); portOnbellek.set(k, v); } return v; };
const dunyaDonusum = (v: Gorunum) => `translate(${v.x}px, ${v.y}px) scale(${v.z})`;
/** Zemin ızgarası (Atölye): küçük kareler 20 birim, büyük kareler 100 birim; uzaklaştıkça küçük çizgiler kaybolur. */
const noktaStil = (v: Gorunum) => {
  const T = 20 * v.z, B = T * 5, m = (a: number) => ((a % B) + B) % B;
  const ince = T < 9 ? "transparent" : `color-mix(in srgb, var(--tv-nokta) ${Math.min(100, Math.round((T - 9) * 9))}%, transparent)`, kalin = "var(--tv-nokta)";
  return { left: `${-B}px`, top: `${-B}px`, right: `${-B}px`, bottom: `${-B}px`,
    backgroundImage: `linear-gradient(to right, ${ince} 1px, transparent 1px), linear-gradient(to bottom, ${ince} 1px, transparent 1px), linear-gradient(to right, ${kalin} 1px, transparent 1px), linear-gradient(to bottom, ${kalin} 1px, transparent 1px)`,
    backgroundSize: `${T}px ${T}px, ${T}px ${T}px, ${B}px ${B}px, ${B}px ${B}px`, transform: `translate3d(${m(v.x)}px, ${m(v.y)}px, 0)` };
};
const GRUP_RENK = ["#5b9cff", "#22d3ee", "#a78bfa", "#f472b6", "#fbbf24", "#34d399"];
/** Bu kadar adım ya da kredi aşılınca çalıştırmadan önce döküm gösterilir. */
const ONAY_ADIM = 4, ONAY_KREDI = 60;
const yukleTuru = (mime: string) => (mime.startsWith("video/") ? "videoYukle" : mime.startsWith("audio/") ? "sesYukle" : mime.startsWith("image/") ? "yukle" : null);


export function TuvalEditor({ id }: { id: string }) {
  const masaustuMu = useMasaustu();
  const router = useRouter();
  const tuval = useTuval((s) => s.tuvaller.find((t) => t.id === id));
  const guncelle = useTuval((s) => s.guncelle);
  const kredi = useAuth((s) => s.kullanici?.krediler ?? 0);
  const tema = useTuvalTema((s) => s.tema);
  const kenarStil = useTuvalTema((s) => s.kenar);
  const izgara = useTuvalTema((s) => s.izgara);
  const kendiSablon = useKendiSablon((s) => s.liste);
  const ortak = useOrtak(id, tuval?.ortak);
  const kok = useRef<HTMLDivElement>(null);
  const akici = (f: (v: Gorunum) => Gorunum) => {
    const v = f(gRef.current); gRef.current = v;
    if (dunya.current) dunya.current.style.transform = dunyaDonusum(v);
    if (nokta.current) Object.assign(nokta.current.style, noktaStil(v));
    kok.current?.setAttribute("data-hareket", "");
    hareketli();
    if (akisZaman.current) clearTimeout(akisZaman.current);
    akisZaman.current = setTimeout(() => { kok.current?.removeAttribute("data-hareket"); setGs(gRef.current); }, 140);
  };
  /* Dünya katmanı: hareket sürerken compositor katmanına alınır (kaydırma yeniden boyamasız), durunca keskin çizim için bırakılır. */
  const dunya = useRef<HTMLDivElement>(null);
  const hareketZaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hareketli = () => {
    const el = dunya.current; if (!el) return;
    if (el.style.willChange !== "transform") el.style.willChange = "transform";
    if (hareketZaman.current) clearTimeout(hareketZaman.current);
    hareketZaman.current = setTimeout(() => { if (dunya.current) dunya.current.style.willChange = ""; }, 220);
  };
  const [hazir, setHazir] = useState(false);
  /* Görünüm: kaynağı ref. Kaydırma/yakınlaştırma sürerken DOM'a doğrudan yazılır (akici), React yalnız hareket bitince güncellenir. */
  const [gs, setGs] = useState({ x: 0, y: 0, z: 1 });
  const gRef = useRef(gs);
  const g = gRef.current;
  const setG = useCallback((f: Gorunum | ((v: Gorunum) => Gorunum)) => { const v = typeof f === "function" ? f(gRef.current) : f; gRef.current = v; setGs(v); }, []);
  const nokta = useRef<HTMLDivElement>(null);
  const akisZaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [arac, setArac] = useState<Arac>("sec");
  const [bosluk, setBosluk] = useState(false);
  const [secili, setSecili] = useState<string[]>([]);
  const [seciliKenar, setSeciliKenar] = useState<string | null>(null);
  const [sur, setSur] = useState<Surukleme | null>(null);
  const surRef = useRef(sur); surRef.current = sur;
  /* İmleç konumu ref: her fare hareketinde yeniden çizim olmasın. */
  const imlecRef = useRef({ x: 0, y: 0 }); const imlec = imlecRef.current;
  const [hedefPort, setHedefPort] = useState<string | null>(null);
  const [palet, setPalet] = useState<{ sx: number; sy: number; wx: number; wy: number; kaynak?: string } | null>(null);
  const [asistan, setAsistan] = useState(false);
  const [plan, setPlan] = useState<AsistanPlan | null>(null);
  const [istek, setIstek] = useState("");
  const [harita, setHarita] = useState(true);
  const [kisayol, setKisayol] = useState(false);
  const [menu, setMenu] = useState(false);
  const [paylas, setPaylas] = useState(false);
  const [uygulamaAcik, setUygulamaAcik] = useState(false);
  const [calisiyorTum, setCalisiyorTum] = useState(false);
  const [yeniler, setYeniler] = useState<Set<string>>(new Set());
  const [ayarlarId, setAyarlarId] = useState<string | null>(null);
  const [baglam, setBaglam] = useState<{ x: number; y: number; wx: number; wy: number; dugum?: string; grup?: string } | null>(null);
  const [kitaplik, setKitaplik] = useState(false);
  const [arama, setArama] = useState(false);
  const [onay, setOnay] = useState<{ satirlar: OnaySatir[]; ids?: string[] } | null>(null);
  const [birakma, setBirakma] = useState(false);
  const [maskeId, setMaskeId] = useState<string | null>(null);
  const [gecmisAcik, setGecmisAcik] = useState(false);
  const [yorumPaneli, setYorumPaneli] = useState(false);
  const [yeniYorum, setYeniYorum] = useState<{ wx: number; wy: number; dugum?: string } | null>(null);
  const [acikYorum, setAcikYorum] = useState<string | null>(null);
  const [gor3d, setGor3d] = useState<{ glb: string; poster?: string; ad: string } | null>(null);
  /* Geri al ya da silme sonrası artık olmayan düğümleri seçimden ve ayar panelinden çıkar. */
  useEffect(() => useTuval.subscribe((st) => {
    const tv = st.tuvaller.find((x) => x.id === id); if (!tv) return;
    const var_ = new Set(tv.dugumler.map((d) => d.id));
    setSecili((v) => (v.some((x) => !var_.has(x)) ? v.filter((x) => var_.has(x)) : v));
    setAyarlarId((v) => (v && !var_.has(v) ? null : v));
  }), [id]);
  const [solPanel, setSolPanel] = useState(true);
  /* Tuval değişince kısa bir "Kaydediliyor" göster (depo anında yazar; geri bildirim içindir). */
  const [kayitAn, setKayitAn] = useState(false);
  useEffect(() => {
    let z: ReturnType<typeof setTimeout> | undefined; let onceki = useTuval.getState().tuvaller.find((x) => x.id === id);
    const coz = useTuval.subscribe((st) => { const yeni = st.tuvaller.find((x) => x.id === id); if (yeni === onceki) return; onceki = yeni; setKayitAn(true); clearTimeout(z); z = setTimeout(() => setKayitAn(false), 650); });
    return () => { coz(); clearTimeout(z); };
  }, [id]);
  const [sagPanel, setSagPanel] = useState(true);
  const [sunum, setSunum] = useState<number | null>(null);
  useEffect(() => { if (window.innerWidth < 1180) { setSagPanel(false); if (window.innerWidth < 900) setSolPanel(false); } }, []);
  useEffect(() => { const f = (e: Event) => setGor3d((e as CustomEvent<{ glb: string; poster?: string; ad: string }>).detail); window.addEventListener("tuval-3d", f); return () => window.removeEventListener("tuval-3d", f); }, []);
  const kullaniciAd = useAuth((s) => s.kullanici?.ad ?? "Sen");
  const yazarRenk = (ad: string) => ETIKET_RENK[[...ad].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % ETIKET_RENK.length];
  useEffect(() => { const f = (e: Event) => setMaskeId((e as CustomEvent<string>).detail); window.addEventListener("tuval-maske", f); return () => window.removeEventListener("tuval-maske", f); }, []);
  const pano = useRef<{ dugumler: TDugum[]; kenarlar: Kenar[] } | null>(null);
  const dokunma = useRef(new Map<number, { x: number; y: number }>());
  const sikistir = useRef<{ d: number; z: number } | null>(null);

  useEffect(() => { setHazir(true); }, []);
  useEffect(() => { if (hazir && !tuval) router.replace("/panel/canvas"); }, [hazir, tuval, router]);
  /* Görünüm: açılışta tuvalden, değişince (gecikmeli) tuvale. */
  const ilkGorunum = useRef(false);
  useEffect(() => {
    if (!tuval || ilkGorunum.current) return; ilkGorunum.current = true;
    if (tuval.dugumler.length && tuval.gorunum.z === 1 && tuval.gorunum.x === 0 && tuval.gorunum.y === 0) setTimeout(() => sigdir(), 30); else setG(tuval.gorunum);
    if (!tuval.dugumler.length) setAsistan(true);
    const hedef = new URLSearchParams(location.search).get("d");
    if (hedef && tuval.dugumler.some((d) => d.id === hedef)) setTimeout(() => { setSecili([hedef]); sigdir([hedef]); }, 80);
  }, [tuval]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const z = setTimeout(() => { if (ilkGorunum.current) guncelle(id, (t) => ({ ...t, gorunum: gRef.current }), false); }, 600); return () => clearTimeout(z); }, [gs, id, guncelle]);

  const ekranDunya = useCallback((sx: number, sy: number) => { const r = kok.current!.getBoundingClientRect(); const v = gRef.current; return { x: (sx - r.left - v.x) / v.z, y: (sy - r.top - v.y) / v.z }; }, []);
  const merkezDunya = () => { const r = kok.current!.getBoundingClientRect(); return ekranDunya(r.left + r.width / 2, r.top + r.height / 2); };
  const tYaz = useCallback((f: (t: Tuval) => Tuval, gecmis = true) => guncelle(id, f, gecmis), [guncelle, id]);
  const dugumYaz = useCallback((did: string, p: Partial<TDugum>, gecmis = true) => tYaz((t) => ({ ...t, dugumler: t.dugumler.map((d) => (d.id === did ? { ...d, ...p } : d)) }), gecmis), [tYaz]);

  const sigdir = useCallback((ids?: string[]) => {
    const t = useTuval.getState().tuvaller.find((x) => x.id === id); const el = kok.current; if (!t || !el) return;
    const l = t.dugumler.filter((d) => !ids || ids.includes(d.id)); if (!l.length) { setG({ x: el.clientWidth / 2, y: el.clientHeight / 2, z: 1 }); return; }
    const x0 = Math.min(...l.map((d) => d.x)), y0 = Math.min(...l.map((d) => d.y)), x1 = Math.max(...l.map((d) => d.x + genislik(d))), y1 = Math.max(...l.map((d) => d.y + yukseklikTahmin(d)));
    /* Açık yan paneller (kitaplık, çıktılar) görünür alandan düşülür. */
    const r = el.getBoundingClientRect();
    const sol = Math.max(0, ...[...el.querySelectorAll<HTMLElement>('[data-yan="sol"]')].map((p) => p.getBoundingClientRect().right - r.left).filter((v) => v < r.width * 0.5));
    const sag = Math.max(0, ...[...el.querySelectorAll<HTMLElement>('[data-yan="sag"]')].map((p) => r.right - p.getBoundingClientRect().left).filter((v) => v < r.width * 0.5));
    const W = el.clientWidth - sol - sag, H = el.clientHeight - 140;
    const z = Math.max(ZMIN, Math.min(1.1, Math.min(W / (x1 - x0 + 160), H / (y1 - y0 + 160))));
    setG({ z, x: sol + W / 2 - ((x0 + x1) / 2) * z, y: 70 + H / 2 - ((y0 + y1) / 2) * z });
  }, [id]);

  const yakinlas = (k: number, sx?: number, sy?: number, akis = false) => {
    const el = kok.current!; const r = el.getBoundingClientRect();
    const px = sx ?? r.left + r.width / 2, py = sy ?? r.top + r.height / 2;
    (akis ? akici : setG)((v) => { const z = Math.max(ZMIN, Math.min(ZMAX, v.z * k)); const wx = (px - r.left - v.x) / v.z, wy = (py - r.top - v.y) / v.z; return { z, x: px - r.left - wx * z, y: py - r.top - wy * z }; });
  };

  /* Tekerlek: Ctrl ile yakınlaştır, değilse kaydır (dokunmatik yüzey dostu). */
  useEffect(() => {
    const el = kok.current; if (!el) return;
    /* Olaylar biriktirilip kare başına bir kez uygulanır (yüksek frekanslı dokunmatik yüzeylerde takılmasın). */
    let dx = 0, dy = 0, zk = 1, zx = 0, zy = 0, bekleyen = 0;
    const uygula = () => {
      bekleyen = 0; hareketli();
      if (zk !== 1) yakinlas(zk, zx, zy, true);
      if (dx || dy) { const a = dx, b = dy; akici((v) => ({ ...v, x: v.x - a, y: v.y - b })); }
      dx = dy = 0; zk = 1;
    };
    const t = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest("[data-kaydirilabilir]")) return;
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) { zk *= Math.exp(-e.deltaY * 0.0022); zx = e.clientX; zy = e.clientY; }
      else { dx += e.deltaX; dy += e.deltaY; }
      if (!bekleyen) bekleyen = requestAnimationFrame(uygula);
    };
    el.addEventListener("wheel", t, { passive: false });
    return () => { el.removeEventListener("wheel", t); cancelAnimationFrame(bekleyen); };
  }, [hazir]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Düğüm ekleme ── */
  const ekle = useCallback((tur: DugumTur, wx?: number, wy?: number, baglaKaynak?: string) => {
    const m = wx === undefined ? merkezDunya() : { x: wx, y: wy! };
    const d = dugumOlustur(tur, Math.round(m.x - (wx === undefined ? genislik({ tur } as TDugum) / 2 : 0)), Math.round(m.y - (wx === undefined ? 60 : portY(0))));
    tYaz((t) => {
      let kenarlar = t.kenarlar;
      if (baglaKaynak) {
        const K = t.dugumler.find((x) => x.id === baglaKaynak); const tip = K && KATALOG[K.tur].cikti;
        const giris = KATALOG[tur].girisler.find((x) => x.tip === tip);
        if (giris) kenarlar = [...kenarlar, { id: yeniId("e"), kaynak: baglaKaynak, hedef: d.id, port: giris.id }];
      }
      return { ...t, dugumler: [...t.dugumler, d], kenarlar };
    });
    setSecili([d.id]); setYeniler(new Set([d.id])); setPalet(null);
    // Metin düğümünde hemen yazılabilsin.
    if (tur === "istem" || tur === "not" || tur === "liste" || KATALOG[tur].istemli) setTimeout(() => (document.querySelector(`[data-dugum="${d.id}"] textarea`) as HTMLTextAreaElement | null)?.focus({ preventScroll: true }), 80);
    /* Yeni düğüm ekran dışına düştüyse görünüme kaydır. */
    const el = kok.current;
    if (el) {
      const v = gRef.current, W = el.clientWidth, H = el.clientHeight;
      const sx = v.x + d.x * v.z, sy = v.y + d.y * v.z, sw = genislik(d) * v.z, sh = yukseklikTahmin(d) * v.z;
      const dx = sx + sw > W - 40 ? W - 40 - (sx + sw) : sx < 40 ? 40 - sx : 0;
      const dy = sy + sh > H - 90 ? H - 90 - (sy + sh) : sy < 80 ? 80 - sy : 0;
      if (dx || dy) setG((o) => ({ ...o, x: o.x + dx, y: o.y + dy }));
    }
    return d.id;
  }, [tYaz]); // eslint-disable-line react-hooks/exhaustive-deps

  const sil = useCallback((ids0: string[]) => {
    const t = useTuval.getState().tuvaller.find((x) => x.id === id);
    const ids = ids0.filter((i) => !t?.dugumler.find((d) => d.id === i)?.kilit);
    if (ids.length < ids0.length) toast.warning(`${ids0.length - ids.length} kilitli düğüm silinmedi`, { description: "Silmek için önce düğümün kilidini aç." });
    if (!ids.length) return;
    tYaz((t) => ({ ...t, dugumler: t.dugumler.filter((d) => !ids.includes(d.id)), kenarlar: t.kenarlar.filter((e) => !ids.includes(e.kaynak) && !ids.includes(e.hedef)),
      yorumlar: (t.yorumlar ?? []).map((y) => { if (!y.dugum || !ids.includes(y.dugum)) return y; const nd = t.dugumler.find((d) => d.id === y.dugum); return { ...y, dugum: undefined, x: y.x + (nd?.x ?? 0), y: y.y + (nd?.y ?? 0) }; }),
      gruplar: (t.gruplar ?? []).map((g) => ({ ...g, dugumler: g.dugumler.filter((x) => !ids.includes(x)) })).filter((g) => g.dugumler.length > 0) }));
    setSecili([]); setAyarlarId((a) => (a && ids.includes(a) ? null : a));
  }, [tYaz, id]);

  const kopyaYapistir = useCallback((kaynak: { dugumler: TDugum[]; kenarlar: Kenar[] }, kayma = 40) => {
    const harita = new Map<string, string>();
    const yeni = kaynak.dugumler.map((d) => { const n = { ...JSON.parse(JSON.stringify(d)), id: yeniId("d"), x: d.x + kayma, y: d.y + kayma, durum: d.surumler.length ? "bitti" : "bos" } as TDugum; harita.set(d.id, n.id); return n; });
    const kenar = kaynak.kenarlar.filter((e) => harita.has(e.kaynak) && harita.has(e.hedef)).map((e) => ({ ...e, id: yeniId("e"), kaynak: harita.get(e.kaynak)!, hedef: harita.get(e.hedef)! }));
    tYaz((t) => ({ ...t, dugumler: [...t.dugumler, ...yeni], kenarlar: [...t.kenarlar, ...kenar] }));
    setSecili(yeni.map((d) => d.id));
  }, [tYaz]);

  /** Silinen düğümün girdisini çıktısının gittiği yerlere doğrudan bağlar (türler uyuyorsa). */
  const silKopru = useCallback((ids0: string[]) => {
    const t0 = useTuval.getState().tuvaller.find((x) => x.id === id); if (!t0) return;
    const ids = ids0.filter((i) => !t0.dugumler.find((d) => d.id === i)?.kilit);
    const yeniKenar: Kenar[] = [];
    for (const did of ids) {
      const gelen = t0.kenarlar.filter((e) => e.hedef === did && !ids.includes(e.kaynak));
      const giden = t0.kenarlar.filter((e) => e.kaynak === did && !ids.includes(e.hedef));
      for (const o of giden) {
        const B = t0.dugumler.find((d) => d.id === o.hedef); const pt = B && KATALOG[B.tur].girisler.find((x) => x.id === o.port)?.tip;
        for (const gi of gelen) {
          const A = t0.dugumler.find((d) => d.id === gi.kaynak);
          if (A && KATALOG[A.tur].cikti === pt && !yeniKenar.some((k) => k.kaynak === A.id && k.hedef === o.hedef && k.port === o.port)) yeniKenar.push({ id: yeniId("e"), kaynak: A.id, hedef: o.hedef, port: o.port });
        }
      }
    }
    const koprulu = t0.kenarlar.some((e) => ids.includes(e.hedef) && !ids.includes(e.kaynak)) && t0.kenarlar.some((e) => ids.includes(e.kaynak) && !ids.includes(e.hedef));
    sil(ids0);
    if (!yeniKenar.length && koprulu) toast("Silindi", { description: "Önceki ve sonraki düğümün türleri uymadığı için aradaki bağlantı kurulamadı." });
    if (yeniKenar.length) { tYaz((t) => ({ ...t, kenarlar: [...t.kenarlar, ...yeniKenar] }), false); toast.success("Silindi, akış bağlı kaldı", { description: `${yeniKenar.length} bağlantı yeniden kuruldu.` }); }
  }, [id, sil, tYaz]);
  /** Çoğalt ve dışarıdan gelen girdileri de yeni kopyaya bağla. */
  const cogaltBagli = useCallback((ids: string[]) => {
    const t0 = useTuval.getState().tuvaller.find((x) => x.id === id); if (!t0 || !ids.length) return;
    const harita = new Map<string, string>();
    const yeni = t0.dugumler.filter((d) => ids.includes(d.id)).map((d) => { const n = { ...JSON.parse(JSON.stringify(d)), id: yeniId("d"), x: d.x + 40, y: d.y + 40, durum: d.surumler.length ? "bitti" : "bos" } as TDugum; harita.set(d.id, n.id); return n; });
    const kenar = t0.kenarlar.filter((e) => harita.has(e.hedef)).map((e) => ({ ...e, id: yeniId("e"), kaynak: harita.get(e.kaynak) ?? e.kaynak, hedef: harita.get(e.hedef)! }));
    tYaz((t) => ({ ...t, dugumler: [...t.dugumler, ...yeni], kenarlar: [...t.kenarlar, ...kenar] }));
    setSecili(yeni.map((d) => d.id)); setYeniler(new Set(yeni.map((d) => d.id)));
  }, [id, tYaz]);
  /** Bir düğümün aşağı akışındaki bütün düğümler (kendisi dahil). */
  const asagiAkis = (did: string) => {
    const t0 = useTuval.getState().tuvaller.find((x) => x.id === id); if (!t0) return [did];
    const g2 = new Set<string>([did]); const y = [did];
    while (y.length) { const u = y.pop()!; for (const e of t0.kenarlar) if (e.kaynak === u && !g2.has(e.hedef)) { g2.add(e.hedef); y.push(e.hedef); } }
    return [...g2];
  };
  /** Düğümdeki her sürümü ayrı bir yükleme düğümüne çıkarır (çok sonuçlu üretimleri tek tek kullanmak için). */
  const sonuclariAyir = (did: string) => {
    const t0 = useTuval.getState().tuvaller.find((x) => x.id === id); const d = t0?.dugumler.find((x) => x.id === did); if (!d) return;
    const l = d.surumler.filter((s2) => s2.url && s2.tip !== "metin");
    const altY = Math.max(...t0!.dugumler.map((x) => x.y + yukseklikTahmin(x))) + 120;
    const yeni = l.map((s2, i) => dugumOlustur(s2.tip === "video" ? "videoYukle" : s2.tip === "ses" ? "sesYukle" : "yukle", d.x + (i % 4) * 300, altY + Math.floor(i / 4) * 340,
      { surumler: [{ ...s2, id: yeniId("s") }], aktif: 0, durum: "bitti", ad: `${d.ad ?? KATALOG[d.tur].ad} ${i + 1}` }));
    tYaz((t) => ({ ...t, dugumler: [...t.dugumler, ...yeni] }));
    setYeniler(new Set(yeni.map((x) => x.id))); setSecili(yeni.map((x) => x.id)); setTimeout(() => sigdir(yeni.map((x) => x.id)), 60);
    toast.success(`${yeni.length} sonuç ayrı düğümlere açıldı`, { description: "Her birini istediğin düğüme bağlayabilirsin." });
  };
  const odakla = (did: string) => { setSecili([did]); sigdir([did]); };
  const dugumBaglantisi = (did: string) => { void mesaj.kopyala(`${location.origin}/panel/canvas/${id}?d=${did}`, "Düğüm bağlantısı"); };

  /** Çalıştırma: ids yoksa tüm tuval. Büyük işlerde önce maliyet dökümü gösterilir (onaylı = atla). */
  const baslat = useCallback(async (ids?: string[], onayli = false) => {
    const t = useTuval.getState().tuvaller.find((x) => x.id === id); if (!t) return;
    const l = calisacaklar(t, ids).filter((did) => !t.dugumler.find((d) => d.id === did)?.kilit);
    if (!l.length) { toast("Çalıştırılacak düğüm yok", { description: "Tüm sonuçlar güncel. Yeniden üretmek için düğümdeki düğmeyi kullan." }); return; }
    const satirlar: OnaySatir[] = l.map((did) => { const d = t.dugumler.find((x) => x.id === did)!; return { id: did, ad: d.ad ?? KATALOG[d.tur].ad, tur: d.tur, kredi: tahminiKredi(t, d), adet: dugumOgeleri(d, girdileriTopla(t, d)).length }; });
    const toplam = satirlar.reduce((s, x) => s + x.kredi, 0);
    if (toplam > kredi) { toast.error("Kredin yetmiyor", { description: `Bu işlem ${toplam} kredi, bakiyende ${kredi} var.`, action: { label: "Kredi yükle", onClick: () => useKrediModal.getState().ac("kredi") } }); return; }
    if (!onayli && (l.length >= ONAY_ADIM || toplam >= ONAY_KREDI)) { setOnay({ satirlar, ids }); return; }
    if (ids && l.length === 1) { void dugumCalistir(id, l[0]); return; }
    setCalisiyorTum(true);
    const r = await tumunuCalistir(id, ids);
    setCalisiyorTum(false);
    if (ids) { if (r.hata) toast.error(`${r.hata} adım tamamlanamadı`, { description: "Nedeni kırmızı çerçeveli düğümlerde yazıyor. Düzeltip yeniden çalıştır." }); }
    else toast[r.hata ? "error" : "success"](r.hata ? `${r.biten} adım bitti, ${r.hata} adım tamamlanamadı` : `Akış tamamlandı · ${r.biten} adım`);
  }, [id, kredi]);
  const calistirSecili = useCallback((ids: string[]) => baslat(ids), [baslat]);
  const tumu = useCallback(() => baslat(), [baslat]);

  /* ── Gruplar, düzen, kilit ── */
  const grupla = useCallback((ids: string[]) => {
    if (ids.length < 2) { toast.info("Gruplanacak düğüm yok", { description: "Gruplamak için en az iki düğüm seç." }); return; }
    tYaz((t) => { const n = (t.gruplar ?? []).length; const temiz = (t.gruplar ?? []).map((g) => ({ ...g, dugumler: g.dugumler.filter((x) => !ids.includes(x)) })).filter((g) => g.dugumler.length > 1);
      return { ...t, gruplar: [...temiz, { id: yeniId("g"), ad: `Grup ${n + 1}`, renk: GRUP_RENK[n % GRUP_RENK.length], dugumler: ids }] }; });
  }, [tYaz]);
  const grubuCoz = useCallback((ids: string[], gid?: string) => tYaz((t) => ({ ...t, gruplar: (t.gruplar ?? []).filter((g) => (gid ? g.id !== gid : !g.dugumler.some((x) => ids.includes(x)))) })), [tYaz]);
  const duzenle = useCallback((ids?: string[]) => {
    const t = useTuval.getState().tuvaller.find((x) => x.id === id); if (!t || !t.dugumler.length) return;
    const k = otoDuzen(t, ids && ids.length > 1 ? ids : undefined);
    tYaz((tt) => ({ ...tt, dugumler: tt.dugumler.map((d) => (k.has(d.id) && !d.kilit ? { ...d, ...k.get(d.id)! } : d)) }));
    setTimeout(() => sigdir(ids && ids.length > 1 ? ids : undefined), 30);
  }, [id, tYaz]); // eslint-disable-line react-hooks/exhaustive-deps
  const kilitle = useCallback((ids: string[]) => {
    const t = useTuval.getState().tuvaller.find((x) => x.id === id); if (!t) return;
    const hepsi = ids.every((i) => t.dugumler.find((d) => d.id === i)?.kilit);
    tYaz((tt) => ({ ...tt, dugumler: tt.dugumler.map((d) => (ids.includes(d.id) ? { ...d, kilit: !hepsi } : d)) }));
  }, [id, tYaz]);

  /* ── Medya ekleme (dosya bırakma, kitaplık, sürümü tuvale çıkarma) ── */
  const medyaEkle = useCallback((tip: Surum["tip"], url: string, wx: number, wy: number, ad?: string, poster?: string, demo?: boolean) => {
    const tur = tip === "video" ? "videoYukle" : tip === "ses" ? "sesYukle" : "yukle";
    const d = dugumOlustur(tur, Math.round(wx), Math.round(wy), { surumler: [{ id: yeniId("s"), tip, url, metin: ad, zaman: Date.now(), ...(poster ? { poster } : {}), ...(demo ? { demo } : {}) }], aktif: 0, durum: "bitti", ...(ad ? { ad: ad.slice(0, 40) } : {}) });
    tYaz((t) => ({ ...t, dugumler: [...t.dugumler, d] }));
    setYeniler(new Set([d.id])); setSecili([d.id]);
    return d.id;
  }, [tYaz]);
  const dosyalariEkle = useCallback(async (dosyalar: File[], wx: number, wy: number) => {
    const uygun = dosyalar.filter((f) => yukleTuru(f.type));
    if (!uygun.length) { mesaj.desteklenmeyenDosya("Görsel, video ya da ses"); return; }
    const bekle = toast.loading(`${uygun.length} dosya yükleniyor…`);
    let i = 0;
    for (const f of uygun) {
      try {
        const url = await dosyaYukle(f);
        const tip = f.type.startsWith("video/") ? "video" : f.type.startsWith("audio/") ? "ses" : "gorsel";
        medyaEkle(tip, url, wx + i * 40, wy + i * 40, f.name.replace(/\.[^.]+$/, ""));
        i++;
      } catch (e) { toast.error(`${f.name} yüklenemedi`, { description: `${e instanceof Error && e.message ? e.message : "Sunucuya ulaşılamadı."} Yeniden dene.` }); }
    }
    toast.dismiss(bekle);
    if (i) toast.success(`${i} dosya tuvale eklendi`);
  }, [medyaEkle]);

  /* ── Panodan görsel yapıştırma ── */
  useEffect(() => {
    const p = async (e: ClipboardEvent) => {
      if (yazilabilir(e.target)) return;
      const f = [...(e.clipboardData?.files ?? [])].find((x) => x.type.startsWith("image/"));
      if (f) {
        e.preventDefault();
        const veri = await new Promise<string>((coz) => { const r = new FileReader(); r.onload = () => coz(String(r.result)); r.readAsDataURL(f); });
        const url = await gorselYukle(veri).catch(() => null); if (!url) { mesaj.yuklenemedi("Görsel"); return; }
        const did = ekle("yukle", imlecDunya().x, imlecDunya().y);
        dugumYaz(did, { surumler: [{ id: yeniId("s"), tip: "gorsel", url, metin: f.name || "Yapıştırılan görsel", zaman: Date.now() }], aktif: 0, durum: "bitti" }, false);
        return;
      }
      if (pano.current) { e.preventDefault(); kopyaYapistir(pano.current); }
    };
    window.addEventListener("paste", p); return () => window.removeEventListener("paste", p);
  }); // her çizimde güncel kapanış

  const imlecDunya = () => ekranDunya(imlec.x || window.innerWidth / 2, imlec.y || window.innerHeight / 2);

  /* ── Klavye ── */
  useEffect(() => {
    const asagi = (e: KeyboardEvent) => {
      if (yazilabilir(e.target)) { if (e.key === "Escape") (e.target as HTMLElement).blur(); return; }
      const ctrl = e.ctrlKey || e.metaKey; const k = e.key.toLowerCase();
      if (e.code === "Space" && !e.repeat) { setBosluk(true); e.preventDefault(); return; }
      if (ctrl && k === "z") { e.preventDefault(); if (e.shiftKey) useTuval.getState().yinele(id); else useTuval.getState().geriAl(id); return; }
      if (ctrl && k === "y") { e.preventDefault(); useTuval.getState().yinele(id); return; }
      if (ctrl && k === "a") { e.preventDefault(); setSecili(tuval?.dugumler.map((d) => d.id) ?? []); return; }
      if (ctrl && k === "c") { const t = useTuval.getState().tuvaller.find((x) => x.id === id); if (t && secili.length) { pano.current = { dugumler: t.dugumler.filter((d) => secili.includes(d.id)), kenarlar: t.kenarlar }; toast.success(`${secili.length} düğüm kopyalandı`, { description: "Ctrl+V ile yapıştırabilirsin." }); } return; }
      if (ctrl && e.shiftKey && k === "d") { e.preventDefault(); cogaltBagli(secili); return; }
      if (ctrl && k === "d") { e.preventDefault(); const t = useTuval.getState().tuvaller.find((x) => x.id === id); if (t && secili.length) kopyaYapistir({ dugumler: t.dugumler.filter((d) => secili.includes(d.id)), kenarlar: t.kenarlar }); return; }
      if (ctrl && e.key === "Enter") { e.preventDefault(); if (e.shiftKey) void tumu(); else if (secili.length) void calistirSecili(secili); return; }
      if (ctrl && k === "g") { e.preventDefault(); if (e.shiftKey) grubuCoz(secili); else grupla(secili); return; }
      if (ctrl && k === "f") { e.preventDefault(); setArama(true); return; }
      if (ctrl && k === "l") { e.preventDefault(); if (secili.length) kilitle(secili); return; }
      if (ctrl && k === "m") { e.preventDefault(); if (secili.length) { const kapat = !secili.every((i) => tuval?.dugumler.find((d) => d.id === i)?.kapali); tYaz((tt) => ({ ...tt, dugumler: tt.dugumler.map((d) => (secili.includes(d.id) && KATALOG[d.tur].calisir ? { ...d, kapali: kapat } : d)) })); } return; }
      if ((e.key === "Delete" || e.key === "Backspace") && e.shiftKey && secili.length) { silKopru(secili); return; }
      if (e.key === "Delete" || e.key === "Backspace") { if (seciliKenar) { tYaz((t) => ({ ...t, kenarlar: t.kenarlar.filter((x) => x.id !== seciliKenar) })); setSeciliKenar(null); } else sil(secili); return; }
      if (e.key === "Escape" && (yeniYorum || acikYorum)) { setYeniYorum(null); setAcikYorum(null); return; }
      if (e.key === "Escape" && arac === "yorum") { setArac("sec"); return; }
      if (e.key === "Escape") { if (baglam) setBaglam(null); else if (ayarlarId) setAyarlarId(null); else { setSecili([]); setSeciliKenar(null); setPalet(null); setPlan(null); setKisayol(false); setKitaplik(false); } return; }
      if (e.key === "Enter" && secili.length === 1) { e.preventDefault(); setAyarlarId(secili[0]); return; }
      if (ctrl) return;
      if (e.shiftKey && k === "l") { duzenle(secili); return; }
      if (k === "l") { setKitaplik((v) => !v); return; }
      if (e.key === "[") { setSolPanel((v) => !v); return; }
      if (e.key === "]") { setSagPanel((v) => !v); return; }
      if (e.key === "/" || e.key === "Tab") { e.preventDefault(); const r = kok.current!.getBoundingClientRect(); const m = imlecDunya(); setPalet({ sx: imlec.x || r.left + r.width / 2 - 190, sy: imlec.y || r.top + 120, wx: m.x, wy: m.y }); return; }
      if (k === "v") setArac("sec"); else if (k === "h") setArac("el"); else if (k === "c") { setArac((a) => (a === "yorum" ? "sec" : "yorum")); return; }
      else if (k === "t") ekle("istem", imlecDunya().x, imlecDunya().y); else if (k === "n") ekle("not", imlecDunya().x, imlecDunya().y); else if (k === "u") ekle("yukle", imlecDunya().x, imlecDunya().y);
      else if (k === "f") sigdir(secili.length ? secili : undefined);
      else if (e.key === "?") setKisayol((v) => !v);
      else if (e.key.startsWith("Arrow") && secili.length) { e.preventDefault(); const a = e.shiftKey ? 20 : 4; const dx = e.key === "ArrowLeft" ? -a : e.key === "ArrowRight" ? a : 0, dy = e.key === "ArrowUp" ? -a : e.key === "ArrowDown" ? a : 0; tYaz((t) => ({ ...t, dugumler: t.dugumler.map((d) => (secili.includes(d.id) ? { ...d, x: d.x + dx, y: d.y + dy } : d)) })); }
    };
    const yukari = (e: KeyboardEvent) => { if (e.code === "Space") setBosluk(false); };
    window.addEventListener("keydown", asagi); window.addEventListener("keyup", yukari);
    return () => { window.removeEventListener("keydown", asagi); window.removeEventListener("keyup", yukari); };
  });

  /* ── İşaretçi ── */
  const bas = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") { dokunma.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (dokunma.current.size === 2) { const [a, b] = [...dokunma.current.values()]; sikistir.current = { d: Math.hypot(a.x - b.x, a.y - b.y), z: gRef.current.z }; setSur(null); return; } }
    const hedef = e.target as HTMLElement;
    setPalet(null); setMenu(false);
    const cikis = hedef.closest("[data-cikis]") as HTMLElement | null;
    if (cikis && e.button === 0) {
      e.stopPropagation(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const w = ekranDunya(e.clientX, e.clientY); setSur({ tur: "bagla", kaynak: cikis.dataset.cikis!, wx: w.x, wy: w.y }); return;
    }
    const giris = hedef.closest("[data-giris]") as HTMLElement | null;
    if (giris && e.button === 0) {
      // bağlı girişten sürükle: bağlantıyı söküp yeniden bağla
      const [hid, port] = giris.dataset.giris!.split(":");
      const k = tuval?.kenarlar.find((x) => x.hedef === hid && x.port === port);
      if (k) { e.stopPropagation(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); tYaz((t) => ({ ...t, kenarlar: t.kenarlar.filter((x) => x.id !== k.id) })); const w = ekranDunya(e.clientX, e.clientY); setSur({ tur: "bagla", kaynak: k.kaynak, wx: w.x, wy: w.y }); }
      return;
    }
    if (arac === "yorum" && e.button === 0 && !hedef.closest("[data-arayuz],[data-yorum]")) {
      e.stopPropagation(); setAcikYorum(null);
      const w = ekranDunya(e.clientX, e.clientY);
      const dn = (hedef.closest("[data-dugum]") as HTMLElement | null)?.dataset.dugum;
      setYeniYorum({ wx: w.x, wy: w.y, dugum: dn }); return;
    }
    if (hedef.closest("[data-dugum]") || hedef.closest("[data-arayuz]")) return;
    setBaglam(null); setAcikYorum(null); setYeniYorum(null);
    if (e.button === 2) return; // sağ tık: bağlam menüsü (onContextMenu)
    const grupEl = hedef.closest("[data-grup]") as HTMLElement | null;
    if (grupEl && e.button === 0 && arac === "sec" && !bosluk) {
      const gr = tuval?.gruplar?.find((x) => x.id === grupEl.dataset.grup);
      if (gr) {
        e.stopPropagation(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        const ids = gr.dugumler.filter((i) => !tuval?.dugumler.find((d) => d.id === i)?.kilit);
        setSecili(gr.dugumler); setSur({ tur: "tasi", sx: e.clientX, sy: e.clientY, ids, dx: 0, dy: 0 }); return;
      }
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSeciliKenar(null);
    if (arac === "el" || bosluk || e.button === 1 || e.pointerType === "touch") { setSur({ tur: "kaydir", sx: e.clientX, sy: e.clientY, ox: gRef.current.x, oy: gRef.current.y }); return; }
    if (!e.shiftKey) setSecili([]);
    setSur({ tur: "kutu", sx: e.clientX, sy: e.clientY, ex: e.clientX, ey: e.clientY, ek: e.shiftKey });
  };
  const dugumBas = (d: TDugum) => (e: React.PointerEvent) => {
    const h = e.target as HTMLElement;
    if (arac === "yorum") return; // kök bas() yeni yorumu açar
    if (h.closest("[data-etkilesim],[data-cikis],[data-giris],input:not([data-ad-salt]),textarea,button,select,a,video,audio")) { if (!secili.includes(d.id)) setSecili([d.id]); return; }
    if (e.button === 2) { e.stopPropagation(); setBaglam(null); if (!secili.includes(d.id)) setSecili([d.id]); return; }
    if (arac === "el" || bosluk || e.button !== 0) return;
    e.stopPropagation(); setBaglam(null);
    kok.current!.setPointerCapture(e.pointerId);
    const ids = secili.includes(d.id) ? secili : e.shiftKey ? [...secili, d.id] : [d.id];
    if (!secili.includes(d.id)) setSecili(ids);
    const tasinir = ids.filter((i) => !tuval?.dugumler.find((x) => x.id === i)?.kilit);
    if (!tasinir.length) return;
    setSur({ tur: "tasi", sx: e.clientX, sy: e.clientY, ids: tasinir, dx: 0, dy: 0 });
  };
  const hareket = (e: React.PointerEvent) => {
    imlecRef.current.x = e.clientX; imlecRef.current.y = e.clientY;
    if (tuval?.ortak) { const w = ekranDunya(e.clientX, e.clientY); ortak.imlecGonder(Math.round(w.x), Math.round(w.y), secili); }
    if (e.pointerType === "touch" && dokunma.current.has(e.pointerId)) {
      dokunma.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (dokunma.current.size === 2 && sikistir.current) { const [a, b] = [...dokunma.current.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); yakinlas((sikistir.current.z * (d / sikistir.current.d)) / gRef.current.z, (a.x + b.x) / 2, (a.y + b.y) / 2, true); return; }
    }
    const s = surRef.current; if (!s) return;
    if (s.tur === "kaydir") akici((v) => ({ ...v, x: s.ox + e.clientX - s.sx, y: s.oy + e.clientY - s.sy }));
    else if (s.tur === "tasi") {
      let dx = (e.clientX - s.sx) / gRef.current.z, dy = (e.clientY - s.sy) / gRef.current.z;
      let kilavuz: Kilavuz[] | undefined;
      if (!e.altKey && tuval) {
        const l = tuval.dugumler.filter((d) => s.ids.includes(d.id));
        const x0 = Math.min(...l.map((d) => d.x)) + dx, y0 = Math.min(...l.map((d) => d.y)) + dy;
        const kutu = { x: x0, y: y0, w: Math.max(...l.map((d) => d.x + genislik(d))) + dx - x0, h: Math.max(...l.map((d) => d.y + yukseklikTahmin(d))) + dy - y0 };
        const h = hizala(kutu, tuval.dugumler.filter((d) => !s.ids.includes(d.id)), 6 / gRef.current.z);
        dx += h.dx; dy += h.dy; kilavuz = h.kilavuz;
      }
      setSur({ ...s, dx, dy, kilavuz });
    }
    else if (s.tur === "kutu") setSur({ ...s, ex: e.clientX, ey: e.clientY });
    else if (s.tur === "bagla") {
      const w = ekranDunya(e.clientX, e.clientY); setSur({ ...s, wx: w.x, wy: w.y });
      const alt = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-giris]") as HTMLElement | null;
      setHedefPort(alt?.dataset.giris ?? null);
    }
  };
  const birak = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") { dokunma.current.delete(e.pointerId); if (dokunma.current.size < 2) sikistir.current = null; }
    const s = surRef.current; setSur(null); setHedefPort(null);
    if (!s) return;
    if (s.tur === "tasi" && (Math.abs(s.dx) > 1 || Math.abs(s.dy) > 1)) {
      const yuvarla = (v: number) => (useTuvalTema.getState().izgara ? Math.round(v / IZGARA) * IZGARA : Math.round(v));
      tYaz((t) => ({ ...t, dugumler: t.dugumler.map((d) => (s.ids.includes(d.id) ? { ...d, x: yuvarla(d.x + s.dx), y: yuvarla(d.y + s.dy) } : d)) }));
    } else if (s.tur === "kutu") {
      const a = ekranDunya(Math.min(s.sx, s.ex), Math.min(s.sy, s.ey)), b = ekranDunya(Math.max(s.sx, s.ex), Math.max(s.sy, s.ey));
      if (Math.abs(s.ex - s.sx) > 4 || Math.abs(s.ey - s.sy) > 4) {
        const icinde = (tuval?.dugumler ?? []).filter((d) => d.x < b.x && d.x + genislik(d) > a.x && d.y < b.y && d.y + yukseklikTahmin(d) > a.y).map((d) => d.id);
        setSecili((o) => (s.ek ? [...new Set([...o, ...icinde])] : icinde));
      }
    } else if (s.tur === "bagla") {
      const alt = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-giris]") as HTMLElement | null;
      if (alt) {
        const [hid, port] = alt.dataset.giris!.split(":");
        const t = useTuval.getState().tuvaller.find((x) => x.id === id)!;
        const hata = baglantiKontrol(t, s.kaynak, hid, port);
        if (hata) { toast.error("Düğümler bağlanamadı", { description: hata }); return; }
        const coklu = KATALOG[t.dugumler.find((d) => d.id === hid)!.tur].girisler.find((x) => x.id === port)?.coklu;
        tYaz((tt) => ({ ...tt, kenarlar: [...tt.kenarlar.filter((x) => coklu || !(x.hedef === hid && x.port === port)).filter((x) => !(x.kaynak === s.kaynak && x.hedef === hid && x.port === port)), { id: yeniId("e"), kaynak: s.kaynak, hedef: hid, port }] }));
        asagiEski(id, s.kaynak);
      } else {
        setPalet({ sx: e.clientX + 8, sy: e.clientY - 20, wx: s.wx + 20, wy: s.wy, kaynak: s.kaynak });
      }
    }
  };

  /* Düğümlere sabit kimlikli işleyiciler: memo'lu kartlar kaydırma/taşıma sırasında yeniden çizilmesin. */
  const son = useRef({ dugumYaz, calistirSecili, dugumBas, setAyarlarId, setSecili, tuval });
  son.current = { dugumYaz, calistirSecili, dugumBas, setAyarlarId, setSecili, tuval };
  const isleyiciler = useRef(new Map<string, { onDegis: (p: Partial<TDugum>, g?: boolean) => void; onCalistir: () => void; onIptal: () => void; onGovdeBas: (e: React.PointerEvent) => void; onAyarlar: () => void }>());
  const isleyici = (did: string) => {
    let h = isleyiciler.current.get(did);
    if (!h) {
      const bul = () => son.current.tuval?.dugumler.find((x) => x.id === did);
      h = {
        onDegis: (p, g) => son.current.dugumYaz(did, p, g ?? true),
        onCalistir: () => void son.current.calistirSecili([did]),
        onIptal: () => { iptalEt(did); son.current.dugumYaz(did, { durum: bul()?.surumler.length ? "bitti" : "bos" }, false); },
        onGovdeBas: (e) => { const d = bul(); if (d) son.current.dugumBas(d)(e); },
        onAyarlar: () => { son.current.setSecili([did]); son.current.setAyarlarId(did); },
      };
      isleyiciler.current.set(did, h);
    }
    return h;
  };

  const t = tuval;
  const kaynakTip = sur?.tur === "bagla" && t ? KATALOG[t.dugumler.find((d) => d.id === sur.kaynak)?.tur ?? "istem"].cikti : undefined;
  const konum = (d: TDugum) => (sur?.tur === "tasi" && sur.ids.includes(d.id) ? { x: d.x + sur.dx, y: d.y + sur.dy } : { x: d.x, y: d.y });
  const bekleyen = useMemo(() => (t ? calisacaklar(t) : []), [t]);
  const toplamKredi = useMemo(() => (t ? bekleyen.reduce((s, did) => s + tahminiKredi(t, t.dugumler.find((d) => d.id === did)!), 0) : 0), [t, bekleyen]);
  const calisanVar = !!t?.dugumler.some((d) => d.durum === "calisiyor" || d.durum === "sirada");

  if (!hazir || !t) return <div className="sc-kapsam flex h-screen items-center justify-center bg-[var(--tv-zemin)]"><Loader2 className="h-5 w-5 animate-spin text-[var(--sc-metin-3)]" /></div>;

  const tekSecili = secili.length === 1 ? t.dugumler.find((d) => d.id === secili[0]) : undefined;
  const ayarlarD = ayarlarId ? t.dugumler.find((d) => d.id === ayarlarId) : undefined;
  /** Ayarlar paneli açıkken seçili ve aynı türden diğer düğümler: model/ayar değişikliği hepsine uygulanır. */
  const topluIds = ayarlarD && secili.length > 1 && secili.includes(ayarlarD.id) && secili.every((i) => t.dugumler.find((d) => d.id === i)?.tur === ayarlarD.tur) ? secili : null;
  const ayarYay = (p: Partial<TDugum>, gecmis: boolean) => {
    if (!ayarlarD) return;
    if (!topluIds || (!p.ayar && !p.model && p.kilit === undefined && p.kucuk === undefined && p.kapali === undefined)) { dugumYaz(ayarlarD.id, p, gecmis); return; }
    const degisen = p.ayar ? Object.fromEntries(Object.entries(p.ayar).filter(([k, v]) => ayarlarD.ayar[k] !== v)) : {};
    const silinen = p.ayar ? Object.keys(ayarlarD.ayar).filter((k) => !(k in p.ayar!)) : [];
    tYaz((tt) => ({ ...tt, dugumler: tt.dugumler.map((d) => {
      if (!topluIds.includes(d.id)) return d;
      if (d.id === ayarlarD.id) return { ...d, ...p };
      const ayar = { ...d.ayar, ...degisen }; silinen.forEach((k) => delete ayar[k]);
      return { ...d, ...(p.model ? { model: p.model } : {}), ...(p.ayar ? { ayar } : {}), ...(p.kilit !== undefined ? { kilit: p.kilit } : {}), ...(p.kucuk !== undefined ? { kucuk: p.kucuk } : {}), ...(p.eski ? { eski: d.surumler.length > 0 } : {}) };
    }) }), gecmis);
  };

  const sonuclariIndir = async (ids?: string[]) => {
    const l = t.dugumler.filter((d) => !ids || ids.includes(d.id)).flatMap((d) => d.surumler.filter((s) => s.url).map((s, i) => ({ ad: `${(d.ad ?? KATALOG[d.tur].ad).replace(/[^\p{L}\p{N}]+/gu, "-")}-${i + 1}`, url: s.url! })));
    if (!l.length) { toast.info("İndirilecek sonuç yok", { description: "Önce düğümleri çalıştırıp sonuç üret." }); return; }
    const bekle = toast.loading(`${l.length} dosya hazırlanıyor…`);
    const r = await zipIndir(t.ad.replace(/[^\p{L}\p{N}]+/gu, "-") || "tuval", l);
    toast.dismiss(bekle);
    if (r.atlanan) toast.warning(`${r.eklenen} dosya indirildi, ${r.atlanan} atlandı`, { description: "Atlanan dosyalara şu an ulaşılamıyor. Biraz sonra yeniden dene." }); else toast.success(`${r.eklenen} dosya indirildi`, { description: "ZIP dosyası indirilenler klasörüne kaydedildi." });
  };
  const etiketUst = (b: NonNullable<typeof baglam>) => {
    if (!b.dugum) return undefined;
    const ids = secili.includes(b.dugum) ? secili : [b.dugum];
    const mevcut = t.dugumler.find((x) => x.id === b.dugum)?.etiket;
    const yaz = (renk?: string) => { tYaz((tt) => ({ ...tt, dugumler: tt.dugumler.map((x) => (ids.includes(x.id) ? { ...x, etiket: renk } : x)) })); setBaglam(null); };
    return (
      <div className="flex items-center gap-1.5 px-2.5 pb-2 pt-1.5">
        {ETIKET_RENK.map((c) => <button key={c} onClick={() => yaz(c)} aria-label="Renk etiketi" className={cn("h-4 w-4 rounded-full ring-offset-2 ring-offset-[var(--tv-yukselti)]", mevcut === c && "ring-2 ring-white")} style={{ background: c }} />)}
        <button onClick={() => yaz(undefined)} aria-label="Etiketi kaldır" className="ml-auto text-[11.5px] text-[var(--sc-metin-3)] hover:text-[var(--sc-metin)]">Yok</button>
      </div>
    );
  };
  const baglamOgeleri = (b: NonNullable<typeof baglam>): MenuOge[] => {
    const gr = b.grup ? t.gruplar?.find((x) => x.id === b.grup) : undefined;
    if (gr) return [
      { ad: "Grubu çalıştır", ikon: Play, f: () => void calistirSecili(gr.dugumler) },
      { ad: "Grubu seç", ikon: MousePointer2, f: () => setSecili(gr.dugumler) },
      { ad: "Yeniden adlandır", ikon: Type, f: () => { const ad = prompt("Grup adı", gr.ad)?.trim(); if (ad) tYaz((tt) => ({ ...tt, gruplar: (tt.gruplar ?? []).map((x) => (x.id === gr.id ? { ...x, ad: ad.slice(0, 40) } : x)) })); } },
      { ad: "Rengi değiştir", ikon: Frame, f: () => tYaz((tt) => ({ ...tt, gruplar: (tt.gruplar ?? []).map((x) => (x.id === gr.id ? { ...x, renk: GRUP_RENK[(GRUP_RENK.indexOf(x.renk) + 1) % GRUP_RENK.length] } : x)) })) },
      { ad: "Düzenle", ikon: LayoutGrid, f: () => duzenle(gr.dugumler) },
      "ayrac",
      { ad: "Grubu çöz", ikon: Ungroup, kisayol: "Ctrl ⇧ G", f: () => grubuCoz([], gr.id) },
      { ad: "Grubu sil (düğümlerle)", ikon: Trash2, tehlike: true, f: () => { sil(gr.dugumler); grubuCoz([], gr.id); } },
    ];
    if (b.dugum) {
      const ids = secili.includes(b.dugum) ? secili : [b.dugum];
      const d = t.dugumler.find((x) => x.id === b.dugum); if (!d) return [];
      const calisir = ids.some((i) => { const x = t.dugumler.find((y) => y.id === i); return x && KATALOG[x.tur].calisir; });
      const kilitli = ids.every((i) => t.dugumler.find((y) => y.id === i)?.kilit);
      const grupta = (t.gruplar ?? []).some((g) => g.dugumler.some((x) => ids.includes(x)));
      const c = d.surumler[d.aktif];
      return [
        ...(calisir ? [{ ad: ids.length > 1 ? `${ids.length} düğümü çalıştır` : "Yalnız bunu üret", ikon: Play, f: () => { if (ids.length === 1) void dugumCalistir(id, ids[0]); else void calistirSecili(ids); } },
          { ad: "Önceki adımlarla çalıştır", ikon: Sparkles, kisayol: "Ctrl ↵", f: () => void calistirSecili(ids) },
          ...(ids.length === 1 && t.kenarlar.some((e) => e.kaynak === ids[0]) ? [{ ad: "Buradan sonrasını çalıştır", ikon: ChevronsRight, f: () => void calistirSecili(asagiAkis(ids[0])) }] : []), "ayrac" as const] : []),
        ...(ids.length === 1 ? [{ ad: "Ayarlar", ikon: SlidersHorizontal, kisayol: "↵", f: () => setAyarlarId(d.id) }] : []),
        { ad: "Çoğalt", ikon: Copy, kisayol: "Ctrl D", f: () => kopyaYapistir({ dugumler: t.dugumler.filter((x) => ids.includes(x.id)), kenarlar: t.kenarlar }) },
        ...(t.kenarlar.some((e) => ids.includes(e.hedef) && !ids.includes(e.kaynak)) ? [{ ad: "Bağlantılarıyla çoğalt", ikon: CopyPlus, kisayol: "Ctrl ⇧ D", f: () => cogaltBagli(ids) }] : []),
        { ad: "Kopyala", ikon: ClipboardCopy, kisayol: "Ctrl C", f: () => { pano.current = { dugumler: t.dugumler.filter((x) => ids.includes(x.id)), kenarlar: t.kenarlar }; toast.success(`${ids.length} düğüm kopyalandı`, { description: "Ctrl+V ile yapıştırabilirsin." }); } },
        ...(c?.url ? [{ ad: "Sonucu indir", ikon: Download, f: () => { const a = document.createElement("a"); a.href = c.url!; a.download = ""; a.target = "_blank"; a.click(); mesaj.indiriliyor("Sonuç"); } }] : []),
        ...(ids.length === 1 && c?.metin && c.tip === "metin" ? [{ ad: "Metni kopyala", ikon: ClipboardCopy, f: () => { void mesaj.kopyala(c.metin!, "Metin"); } }] : []),
        ...(ids.length === 1 && d.surumler.filter((x) => x.url && x.tip !== "metin").length > 1 ? [{ ad: "Sonuçları ayrı düğümlere aç", ikon: Images, f: () => sonuclariAyir(d.id) }] : []),
        ...(ids.length === 1 ? [{ ad: "Düğüm bağlantısını kopyala", ikon: Link2, f: () => dugumBaglantisi(d.id) }] : []),
        "ayrac",
        ...(ids.length > 1 ? [{ ad: "Grupla", ikon: Frame, kisayol: "Ctrl G", f: () => grupla(ids) }, { ad: "Düzenle", ikon: LayoutGrid, kisayol: "⇧ L", f: () => duzenle(ids) }] : []),
        ...(grupta ? [{ ad: "Gruptan çıkar", ikon: Ungroup, f: () => tYaz((tt) => ({ ...tt, gruplar: (tt.gruplar ?? []).map((g) => ({ ...g, dugumler: g.dugumler.filter((x) => !ids.includes(x)) })).filter((g) => g.dugumler.length > 1) })) }] : []),
        { ad: kilitli ? "Kilidi aç" : "Kilitle", ikon: kilitli ? Unlock : Lock, kisayol: "Ctrl L", f: () => kilitle(ids) },
        ...(calisir ? [{ ad: d.kapali ? "Etkinleştir" : "Devre dışı bırak", ikon: Ban, kisayol: "Ctrl M", f: () => tYaz((tt) => ({ ...tt, dugumler: tt.dugumler.map((x) => (ids.includes(x.id) ? { ...x, kapali: !d.kapali } : x)) })) }] : []),
        ...(ids.length > 1 && ids.some((i) => t.dugumler.find((x) => x.id === i)?.surumler.some((s) => s.url)) ? [{ ad: "Sonuçları indir (.zip)", ikon: FolderDown, f: () => void sonuclariIndir(ids) }] : []),
        { ad: d.kucuk ? "Genişlet" : "Küçült", ikon: Minimize2, f: () => tYaz((tt) => ({ ...tt, dugumler: tt.dugumler.map((x) => (ids.includes(x.id) ? { ...x, kucuk: !d.kucuk } : x)) })) },
        { ad: "Görünüme sığdır", ikon: Maximize, kisayol: "F", f: () => sigdir(ids) },
        "ayrac",
        ...(t.kenarlar.some((e) => ids.includes(e.hedef)) && t.kenarlar.some((e) => ids.includes(e.kaynak)) ? [{ ad: "Bağlantıları koruyarak sil", ikon: Unplug, kisayol: "⇧ Del", devre: kilitli, f: () => silKopru(ids) }] : []),
        { ad: "Sil", ikon: Trash2, kisayol: "Del", tehlike: true, devre: kilitli, f: () => sil(ids) },
      ];
    }
    return [
      { ad: "Düğüm ekle", ikon: Plus, kisayol: "/", f: () => setPalet({ sx: b.x, sy: b.y, wx: b.wx, wy: b.wy }) },
      { ad: "İstem", ikon: Type, kisayol: "T", f: () => ekle("istem", b.wx, b.wy) },
      { ad: "Görsel yükle", ikon: Upload, kisayol: "U", f: () => ekle("yukle", b.wx, b.wy) },
      { ad: "Not", ikon: StickyNote, kisayol: "N", f: () => ekle("not", b.wx, b.wy) },
      { ad: "Yapıştır", ikon: ClipboardCopy, kisayol: "Ctrl V", devre: !pano.current, f: () => { if (!pano.current) return; const p = pano.current; const x0 = Math.min(...p.dugumler.map((d) => d.x)), y0 = Math.min(...p.dugumler.map((d) => d.y)); kopyaYapistir({ dugumler: p.dugumler.map((d) => ({ ...d, x: d.x - x0 + b.wx, y: d.y - y0 + b.wy })), kenarlar: p.kenarlar }, 0); } },
      "ayrac",
      { ad: "Kitaplıktan ekle", ikon: Library, kisayol: "L", f: () => setKitaplik(true) },
      { ad: "Tümünü seç", ikon: MousePointer2, kisayol: "Ctrl A", f: () => setSecili(t.dugumler.map((d) => d.id)) },
      { ad: "Otomatik düzenle", ikon: LayoutGrid, kisayol: "⇧ L", devre: !t.dugumler.length, f: () => duzenle() },
      { ad: "Tümünü sığdır", ikon: Maximize, kisayol: "F", f: () => sigdir() },
      { ad: "Tuvalde ara", ikon: Search, kisayol: "Ctrl F", f: () => setArama(true) },
    ];
  };
  const planKur = (calistir: boolean) => {
    if (!plan) return;
    const sag = t.dugumler.length ? Math.max(...t.dugumler.map((d) => d.x + genislik(d))) + 160 : merkezDunya().x - 500;
    const ust = t.dugumler.length ? Math.min(...t.dugumler.map((d) => d.y)) : merkezDunya().y - 220;
    const k = tarifKur(plan.tarif, sag, ust);
    tYaz((tt) => ({ ...tt, dugumler: [...tt.dugumler, ...k.dugumler], kenarlar: [...tt.kenarlar, ...k.kenarlar], ad: tt.ad === "İsimsiz tuval" ? (istek.trim().slice(0, 48) || plan.tarif.baslik) : tt.ad }));
    setYeniler(new Set(k.dugumler.map((d) => d.id))); setSecili([]);
    setPlan(null); setIstek(""); setAsistan(false);
    setTimeout(() => sigdir(k.dugumler.map((d) => d.id)), 40);
    if (calistir) setTimeout(() => void calistirSecili(k.dugumler.map((d) => d.id)), 400);
    else toast.success("Akış kuruldu", { description: "Yükleme düğümü varsa önce görselini ekle, sonra Tümünü çalıştır." });
  };
  const sablonKur = (sid: string) => {
    const s = SABLONLAR.find((x) => x.id === sid)!; const m = merkezDunya();
    const k = tarifKur(s.tarif, m.x - 600, m.y - 260);
    tYaz((tt) => ({ ...tt, dugumler: [...tt.dugumler, ...k.dugumler], kenarlar: [...tt.kenarlar, ...k.kenarlar], ad: tt.ad === "İsimsiz tuval" ? s.ad : tt.ad }));
    setYeniler(new Set(k.dugumler.map((d) => d.id))); setAsistan(false); setTimeout(() => sigdir(), 40);
  };

  /* Bağlantı çizimi */
  const kenarYol = (x1: number, y1: number, x2: number, y2: number) => {
    if (kenarStil === "duz") return `M${x1},${y1} L${x2},${y2}`;
    if (kenarStil === "dik") { const mx = x2 > x1 + 40 ? (x1 + x2) / 2 : x1 + 30; const r0 = Math.min(10, Math.abs(y2 - y1) / 2, Math.abs(mx - x1)); const sy = Math.sign(y2 - y1) || 1;
      return x2 > x1 + 40 ? `M${x1},${y1} H${mx - r0} Q${mx},${y1} ${mx},${y1 + r0 * sy} V${y2 - r0 * sy} Q${mx},${y2} ${mx + r0},${y2} H${x2}` : `M${x1},${y1} H${x1 + 30} V${(y1 + y2) / 2} H${x2 - 30} V${y2} H${x2}`; }
    const k = Math.max(50, Math.abs(x2 - x1) / 2); return `M${x1},${y1} C${x1 + k},${y1} ${x2 - k},${y2} ${x2},${y2}`;
  };
  const cikisNokta = (d: TDugum) => { const p = konum(d); return { x: p.x + genislik(d), y: p.y + portY(0) }; };
  const girisNokta = (d: TDugum, port: string) => { const p = konum(d); const i = Math.max(0, KATALOG[d.tur].girisler.findIndex((x) => x.id === port)); return { x: p.x, y: p.y + portY(i) }; };

  /* Atölye panelleri: başka bir yan panel açıkken çekilir. */
  const solGorunur = solPanel && !kitaplik;
  const sagGorunur = sagPanel && !ayarlarD && !gecmisAcik && !yorumPaneli;
  /* Mini harita */
  const el = kok.current;
  /* Sınır: düğümler + görüş alanı birlikte; böylece görüş çerçevesi hep haritanın içinde kalır, içerik ortalanır. */
  const sinir = (() => {
    if (!t.dugumler.length) return null;
    let x0 = Math.min(...t.dugumler.map((d) => d.x)) - 80, y0 = Math.min(...t.dugumler.map((d) => d.y)) - 80;
    let x1 = Math.max(...t.dugumler.map((d) => d.x + genislik(d))) + 80, y1 = Math.max(...t.dugumler.map((d) => d.y + yukseklikTahmin(d))) + 80;
    if (el) { const vx = -g.x / g.z, vy = -g.y / g.z; x0 = Math.min(x0, vx); y0 = Math.min(y0, vy); x1 = Math.max(x1, vx + el.clientWidth / g.z); y1 = Math.max(y1, vy + el.clientHeight / g.z); }
    const o = Math.min(168 / (x1 - x0), 104 / (y1 - y0));
    return { x0: x0 - (168 / o - (x1 - x0)) / 2, y0: y0 - (104 / o - (y1 - y0)) / 2, o };
  })();

  return (
    <MotionConfig reducedMotion="user">
      <div ref={kok} data-kendi-kisayol onPointerDown={bas} onPointerMove={hareket} onPointerUp={birak} onPointerCancel={birak} onScroll={(e) => { const el = e.currentTarget; if (el.scrollLeft || el.scrollTop) { el.scrollLeft = 0; el.scrollTop = 0; } }}
        onContextMenu={(e) => {
          e.preventDefault();
          const h = e.target as HTMLElement;
          if (h.closest("[data-arayuz]") || h.tagName === "TEXTAREA" || (yazilabilir(h) && !h.closest("[data-baslik]"))) return;
          const did = (h.closest("[data-dugum]") as HTMLElement | null)?.dataset.dugum;
          const gid = (h.closest("[data-grup]") as HTMLElement | null)?.dataset.grup;
          const w = ekranDunya(e.clientX, e.clientY);
          if (did && !secili.includes(did)) setSecili([did]);
          setPalet(null); setMenu(false);
          setBaglam({ x: e.clientX, y: e.clientY, wx: w.x, wy: w.y, dugum: did, grup: did ? undefined : gid });
        }}
        onDragOver={(e) => { if ([...e.dataTransfer.types].some((x) => x === "Files" || x === "application/x-vayra-varlik" || x === DUGUM_SURUKLE)) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; if (!birakma) setBirakma(true); } }}
        onDragLeave={(e) => { if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) setBirakma(false); }}
        onDrop={(e) => {
          e.preventDefault(); setBirakma(false);
          const w = ekranDunya(e.clientX, e.clientY);
          const dt = e.dataTransfer.getData(DUGUM_SURUKLE) as DugumTur;
          if (dt && KATALOG[dt]) { ekle(dt, w.x - 120, w.y - 30); return; }
          const metinDosya = [...e.dataTransfer.files].find((x) => /\.(csv|txt|tsv)$/i.test(x.name) || x.type === "text/csv" || x.type === "text/plain");
          if (metinDosya) {
            void metinDosya.text().then((ham) => {
              const satirlar = ham.replace(/\r/g, "").split("\n").map((x) => x.split(/[,;\t]/)[0]?.replace(/^"|"$/g, "").trim()).filter(Boolean);
              /* CSV'nin ilk satırı sütun başlığıdır (ad, isim, name, ürün gibi); listeye girmez. */
              if (/\.csv$/i.test(metinDosya.name) && satirlar.length > 1 && /^(ad|adı|isim|name|title|başlık|ürün|urun|item|prompt|istem|metin|text)$/i.test(satirlar[0])) satirlar.shift();
              satirlar.splice(200);
              if (!satirlar.length) { toast.error("Dosya boş", { description: "Her satırda bir öğe olacak şekilde CSV ya da TXT bırak." }); return; }
              const did = ekle("liste", w.x - 120, w.y - 30);
              dugumYaz(did, { metin: satirlar.join("\n"), ad: metinDosya.name.replace(/\.[^.]+$/, "").slice(0, 40) }, false);
              toast.success(`${satirlar.length} satırlık liste eklendi`, { description: "Bağladığın düğüm her satır için ayrı çalışır." });
            });
            return;
          }
          const v = e.dataTransfer.getData("application/x-vayra-varlik");
          if (v) { try { const x = JSON.parse(v) as Varlik; medyaEkle(x.tip, x.url, w.x - 120, w.y - 40, x.ad, x.poster, x.demo); } catch { /* bozuk veri */ } return; }
          const f = [...e.dataTransfer.files]; if (f.length) void dosyalariEkle(f, w.x - 120, w.y - 40);
        }}
        onDoubleClick={(e) => { if ((e.target as HTMLElement).closest("[data-dugum],[data-arayuz]")) return; const w = ekranDunya(e.clientX, e.clientY); setPalet({ sx: e.clientX, sy: e.clientY, wx: w.x, wy: w.y }); }}
        className={cn("sc-kapsam relative h-[100dvh] w-full touch-none overflow-hidden bg-[var(--tv-zemin)] text-[var(--sc-metin)]", temaSinifi(tema), (arac === "el" || bosluk) && (sur?.tur === "kaydir" ? "cursor-grabbing" : "cursor-grab"), arac === "yorum" && "cursor-crosshair [&_[data-dugum]]:cursor-crosshair")}
>
        {/* Nokta deseni: kendi katmanında, kaydırırken yalnız transform değişir (yeniden boyama yok). */}
        <div ref={nokta} aria-hidden className="pointer-events-none absolute will-change-transform" style={noktaStil(g)} />
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(1200px 700px at 50% 35%, var(--tv-hale), transparent 70%), radial-gradient(130% 100% at 50% 50%, transparent 60%, rgba(0,0,0,0.35))" }} />

        {/* Dünya */}
        <div ref={dunya} className="absolute left-0 top-0 origin-top-left" style={{ transform: dunyaDonusum(g) }}>
          {(t.gruplar ?? []).map((gr) => {
            const l = t.dugumler.filter((d) => gr.dugumler.includes(d.id)); if (!l.length) return null;
            const P = 28, x0 = Math.min(...l.map((d) => konum(d).x)) - P, y0 = Math.min(...l.map((d) => konum(d).y)) - P - 30;
            const x1 = Math.max(...l.map((d) => konum(d).x + genislik(d))) + P, y1 = Math.max(...l.map((d) => konum(d).y + yukseklikTahmin(d))) + P;
            const sec = gr.dugumler.every((i) => secili.includes(i));
            return (
              <div key={gr.id} className="pointer-events-none absolute rounded-[22px]" style={{ left: x0, top: y0, width: x1 - x0, height: y1 - y0, background: saydam(gr.renk, 5), boxShadow: `inset 0 0 0 ${sec ? 2 : 1.5}px ${saydam(gr.renk, sec ? 70 : 32)}` }}>
                <div data-grup={gr.id} title="Sürükle: grubu taşı · Sağ tık: seçenekler" className="pointer-events-auto absolute left-3 top-2.5 flex max-w-[calc(100%-24px)] cursor-grab items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium active:cursor-grabbing" style={{ background: saydam(gr.renk, 16), color: gr.renk }}>
                  <Frame className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{gr.ad}</span><span className="tabular-nums opacity-60">{l.length}</span>
                </div>
              </div>
            );
          })}
          <svg className="absolute left-0 top-0 overflow-visible" width="1" height="1">
            {t.kenarlar.map((k) => {
              const A = t.dugumler.find((d) => d.id === k.kaynak), B = t.dugumler.find((d) => d.id === k.hedef); if (!A || !B) return null;
              const a = cikisNokta(A), b = girisNokta(B, k.port); const tip = KATALOG[A.tur].cikti!;
              const akiyor = B.durum === "calisiyor"; const sec = seciliKenar === k.id || secili.includes(A.id) || secili.includes(B.id);
              const yol = kenarYol(a.x, a.y, b.x, b.y);
              const hedefTip = KATALOG[B.tur].girisler.find((x) => x.id === k.port)?.tip ?? tip;
              const gid = `kg-${k.id}`;
              return (
                <g key={k.id}>
                  <defs><linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={b.x} y2={b.y}><stop offset="0" stopColor={PORT_RENK[tip]} /><stop offset="1" stopColor={PORT_RENK[hedefTip]} /></linearGradient></defs>
                  <path d={yol} fill="none" stroke="transparent" strokeWidth={14 / g.z} className="pointer-events-auto cursor-pointer" onPointerDown={(e) => { e.stopPropagation(); setSeciliKenar(k.id); setSecili([]); }} />
                  {sec && <path d={yol} fill="none" stroke={`url(#${gid})`} strokeOpacity={0.25} strokeWidth={8} className="pointer-events-none" />}
                  <path d={yol} fill="none" stroke={`url(#${gid})`} strokeOpacity={sec ? 1 : 0.75} strokeWidth={sec ? 2.5 : 2} strokeLinecap="round" className="pointer-events-none" />
                  {akiyor && <circle r={4} fill={PORT_RENK[tip]} className="pointer-events-none"><animateMotion dur="1.1s" repeatCount="indefinite" path={yol} /></circle>}
                </g>
              );
            })}
            {sur?.tur === "bagla" && (() => { const A = t.dugumler.find((d) => d.id === sur.kaynak)!; const a = cikisNokta(A); return <path d={kenarYol(a.x, a.y, sur.wx, sur.wy)} fill="none" stroke={kaynakTip ? PORT_RENK[kaynakTip] : "#fff"} strokeWidth={2} strokeDasharray="5 5" />; })()}
          </svg>
          {t.dugumler.map((d) => {
            const tasiniyor = sur?.tur === "tasi" && sur.ids.includes(d.id);
            const uygun = kaynakTip && d.id !== (sur as { kaynak?: string } | null)?.kaynak ? uygunPortlar(d.tur, kaynakTip) : undefined;
            const h = isleyici(d.id);
            const kart = <Dugum d={tasiniyor ? { ...d, x: d.x + sur.dx, y: d.y + sur.dy } : d} t={t} secili={secili.includes(d.id)} baglanabilir={uygun}
              onDegis={h.onDegis} onCalistir={h.onCalistir} onIptal={h.onIptal} onGovdeBas={h.onGovdeBas} onAyarlar={h.onAyarlar} />;
            const yeni = yeniler.has(d.id);
            return <motion.div key={d.id} initial={yeni ? GIRIS : false} animate={HEDEF} transition={yeni ? { ...GECIS, delay: Math.min(0.5, t.dugumler.indexOf(d) * 0.04) } : GECIS}>{kart}</motion.div>;
          })}
          {ortak.kisiler.flatMap((k) => (k.secili ?? []).map((sid) => { const d = t.dugumler.find((x) => x.id === sid); if (!d) return null; const p = konum(d);
            return <span key={`${k.id}-${sid}`} aria-hidden className="pointer-events-none absolute rounded-[21px]" style={{ left: p.x - 4, top: p.y - 4, width: genislik(d) + 8, height: yukseklikTahmin(d) + 8, boxShadow: `0 0 0 2px ${k.renk}` }} />; }))}
          {ortak.kisiler.filter((k) => k.x !== undefined).map((k) => (
            <div key={k.id} aria-hidden className="pointer-events-none absolute z-[6] origin-top-left transition-[left,top] duration-100 ease-linear" style={{ left: k.x, top: k.y, transform: `scale(${1 / g.z})` }}>
              <svg width="18" height="20" viewBox="0 0 18 20" className=""><path d="M1 1 L1 16 L5.5 12 L8.5 19 L11 18 L8 11 L14 11 Z" fill={k.renk} stroke="white" strokeWidth="1.2" strokeLinejoin="round" /></svg>
              <span className="absolute left-4 top-4 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium text-[#111]" style={{ background: k.renk }}>{k.ad}</span>
            </div>
          ))}
          {(t.yorumlar ?? []).map((y) => {
            const nd = y.dugum ? t.dugumler.find((d) => d.id === y.dugum) : undefined;
            const p = nd ? konum(nd) : { x: 0, y: 0 };
            return <YorumIgne key={y.id} y={{ ...y, x: p.x + y.x, y: p.y + y.y }} z={g.z} secili={acikYorum === y.id} onAc={() => { setAcikYorum(y.id); setYeniYorum(null); }} />;
          })}
          {sur?.tur === "tasi" && sur.kilavuz?.map((k, i) => (
            <span key={i} aria-hidden className="pointer-events-none absolute bg-[var(--tv-aksan)]" style={k.yon === "x" ? { left: k.deger - 0.5 / g.z, top: k.a, width: 1 / g.z, height: k.b - k.a } : { top: k.deger - 0.5 / g.z, left: k.a, height: 1 / g.z, width: k.b - k.a }} />
          ))}
        </div>
        {birakma && <div aria-hidden className="pointer-events-none absolute inset-3 z-[45] flex items-center justify-center rounded-[24px] border-2 border-dashed border-[var(--tv-aksan)]/60 bg-[var(--tv-aksan)]/[0.06]"><span className="rounded-full bg-[var(--tv-kart)] px-4 py-2 text-[14px] font-medium ring-1 ring-white/[0.1]">Bırak: düğüm, görsel, video, ses ya da CSV listesi olarak eklenir</span></div>}

        {/* Kutu seçimi */}
        {sur?.tur === "kutu" && (Math.abs(sur.ex - sur.sx) > 4) && <div className="pointer-events-none fixed z-20 rounded-[4px] border border-[var(--tv-aksan)]/70 bg-[var(--tv-aksan)]/10" style={{ left: Math.min(sur.sx, sur.ex), top: Math.min(sur.sy, sur.ey), width: Math.abs(sur.ex - sur.sx), height: Math.abs(sur.ey - sur.sy) }} />}

        {/* Seçim çubuğu */}
        {secili.length > 0 && !sur && (() => {
          const l = t.dugumler.filter((d) => secili.includes(d.id)); if (!l.length) return null;
          const x0 = Math.min(...l.map((d) => d.x)), y0 = Math.min(...l.map((d) => d.y));
          const kr = calisacaklar(t, l.map((d) => d.id)).reduce((s, did) => s + tahminiKredi(t, t.dugumler.find((d) => d.id === did)!), 0);
          const calisir = l.some((d) => KATALOG[d.tur].calisir);
          return (
            <motion.div data-arayuz initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.16 }} className="absolute z-20 flex max-w-[calc(100%-24px)] items-center gap-0.5 overflow-x-auto rounded-[12px] bg-[var(--tv-yukselti)] [scrollbar-width:none] [[data-hareket]_&]:invisible p-1 ring-1 ring-white/[0.1]" style={{ left: Math.max(solGorunur || kitaplik ? 296 : 12, Math.min(g.x + x0 * g.z, (el?.clientWidth ?? 1440) - (sagGorunur ? 276 : 12) - 440)), top: Math.max(64, g.y + y0 * g.z - 46) }}>
              {secili.length > 1 && <span className="px-2 text-[12px] text-[var(--sc-metin-3)]">{secili.length} düğüm</span>}
              {calisir && <button onClick={() => void calistirSecili(secili)} title="Gerekli önceki adımlarla birlikte çalıştırır (Ctrl Enter)" className="flex h-7 items-center gap-1 whitespace-nowrap rounded-[8px] px-2 text-[12px] text-[var(--sc-metin)] hover:bg-white/[0.085]"><Play className="h-3.5 w-3.5 fill-current text-[var(--tv-aksan)]" />Akışla çalıştır{kr ? <span className="tabular-nums text-[var(--sc-metin-3)]">· {kr} kredi</span> : null}</button>}
              {!tekSecili && l.every((d) => d.tur === l[0].tur) && KATALOG[l[0].tur].calisir && <button onClick={() => setAyarlarId(l[0].id)} title="Aynı türdeki düğümleri birlikte ayarla" className="flex h-7 items-center gap-1 whitespace-nowrap rounded-[8px] px-2 text-[12px] text-[var(--sc-metin-2)] hover:bg-white/[0.085]"><SlidersHorizontal className="h-3.5 w-3.5" />Toplu ayar</button>}
              {tekSecili && <button onClick={() => { setAyarlarId(tekSecili.id); setGecmisAcik(false); setYorumPaneli(false); }} title="Tüm ayarlar (Enter)" className={cn("flex h-7 items-center gap-1 whitespace-nowrap rounded-[8px] px-2 text-[12px] hover:bg-white/[0.085]", ayarlarId === tekSecili.id ? "text-[var(--tv-aksan)]" : "text-[var(--sc-metin-2)]")}><SlidersHorizontal className="h-3.5 w-3.5" />Ayarlar</button>}
              {secili.length > 1 && <button onClick={() => grupla(secili)} title="Grupla (Ctrl G)" className="flex h-7 items-center gap-1 whitespace-nowrap rounded-[8px] px-2 text-[12px] text-[var(--sc-metin-2)] hover:bg-white/[0.085]"><Frame className="h-3.5 w-3.5" />Grupla</button>}
              {secili.length > 1 && <button onClick={() => duzenle(secili)} title="Seçileni düzenle (Shift L)" aria-label="Seçileni düzenle" className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--sc-metin-2)] hover:bg-white/[0.085]"><LayoutGrid className="h-3.5 w-3.5" /></button>}
              <button onClick={() => kopyaYapistir({ dugumler: l, kenarlar: t.kenarlar })} className="flex h-7 items-center gap-1 whitespace-nowrap rounded-[8px] px-2 text-[12px] text-[var(--sc-metin-2)] hover:bg-white/[0.085]"><Copy className="h-3.5 w-3.5" />Çoğalt</button>
              {tekSecili?.surumler.length ? <a href={tekSecili.surumler[tekSecili.aktif]?.url} download target="_blank" rel="noopener noreferrer" className="flex h-7 items-center gap-1 rounded-[8px] px-2 text-[12px] text-[var(--sc-metin-2)] hover:bg-white/[0.085]"><Download className="h-3.5 w-3.5" />İndir</a> : null}
              <button onClick={() => sil(secili)} aria-label="Sil" className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--sc-metin-3)] hover:bg-rose-400/10 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
            </motion.div>
          );
        })()}
        {seciliKenar && <div data-arayuz className="absolute left-1/2 top-[70px] z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[var(--tv-yukselti)] px-3 py-1.5 text-[12px] text-[var(--sc-metin-2)] ring-1 ring-white/[0.1]">Bağlantı seçili<button onClick={() => { tYaz((tt) => ({ ...tt, kenarlar: tt.kenarlar.filter((x) => x.id !== seciliKenar) })); setSeciliKenar(null); }} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-rose-300 hover:bg-rose-400/10"><Trash2 className="h-3 w-3" />Kaldır</button></div>}

        {/* Boş durum */}
        {!t.dugumler.length && !plan && (
          <div data-arayuz className="pointer-events-none absolute inset-x-0 top-[14%] z-10 flex justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="pointer-events-auto w-full max-w-[720px] overflow-hidden rounded-[24px] bg-[var(--tv-kart)]/95 text-center ring-1 ring-inset ring-white/[0.08] backdrop-blur-xl">
            <div className="border-b border-white/[0.06] px-6 py-5">
              <p className="text-[19px] font-semibold">Boş tuval</p>
              <p className="mt-1 text-[13.5px] text-[var(--sc-metin-3)]">Alttaki kutuya ne yapmak istediğini yaz, çift tıklayıp düğüm ekle ya da bir şablonla başla.</p>
            </div>
            <div className="grid max-h-[44dvh] gap-1 overflow-y-auto p-2 text-left [scrollbar-width:thin] sm:max-h-none sm:grid-cols-2">
              {SABLONLAR.map((s) => (
                <button key={s.id} onClick={() => sablonKur(s.id)} className="group flex items-center gap-3 rounded-[12px] p-1.5 pr-3 text-left transition-colors hover:bg-white/[0.065]">
                  <span className="h-10 w-14 shrink-0 rounded-[9px] bg-cover bg-center ring-1 ring-inset ring-white/10" style={{ backgroundImage: `url(${s.kapak})` }} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium">{s.ad}</span><span className="block text-[12px] text-[var(--sc-metin-3)]">{s.tarif.dugumler.length} düğüm · {s.sure.replace(/^yaklaşık /, "")}</span></span>
                  <ArrowRight className="h-4 w-4 shrink-0 -translate-x-1 text-transparent transition group-hover:translate-x-0 group-hover:text-[var(--sc-metin-2)]" />
                </button>
              ))}
            </div>
            {kendiSablon.length > 0 && (
              <>
                <p className="border-t border-white/[0.06] px-4 pb-1 pt-3 text-left text-[12.5px] text-[var(--sc-metin-3)]">Şablonlarım</p>
                <div className="flex flex-wrap gap-2 px-3 pb-3">
                  {kendiSablon.slice(0, 8).map((s) => (
                    <button key={s.id} onClick={() => { const m = merkezDunya(); kopyaYapistir({ dugumler: s.dugumler.map((d) => ({ ...d, x: d.x + m.x - 500, y: d.y + m.y - 220 })), kenarlar: s.kenarlar }, 0); tYaz((tt) => ({ ...tt, ad: tt.ad === "İsimsiz tuval" ? s.ad : tt.ad }), false); setAsistan(false); setTimeout(() => sigdir(), 40); }}
                      className="flex items-center gap-2 rounded-[12px] bg-[var(--tv-kart)] p-1.5 pr-3 ring-1 ring-white/[0.08] hover:bg-[var(--tv-yukselti)]">
                      <span className="flex h-9 w-12 items-center justify-center rounded-[8px] bg-white/[0.065] bg-cover bg-center" style={s.kapak ? { backgroundImage: `url("${s.kapak}")` } : undefined}>{!s.kapak && <BookmarkPlus className="h-4 w-4 text-[var(--sc-metin-3)]" />}</span>
                      <span className="text-left"><span className="block text-[13px] font-medium">{s.ad}</span><span className="block text-[11.5px] text-[var(--sc-metin-3)]">{s.dugumler.length} düğüm</span></span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
          </div>
        )}

        {/* Üst sol */}
        <motion.div data-arayuz initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="absolute left-3 top-3 z-30 flex max-w-[calc(100vw-24px)] max-sm:right-3 items-center gap-1 rounded-[14px] bg-[var(--tv-kart)] p-1.5 ring-1 ring-white/[0.08] sm:left-4 sm:top-4 max-sm:max-w-[calc(100vw-150px)]">
          <Link href="/panel/canvas" aria-label="Canvas'a dön" title="Canvas'a dön" className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[var(--sc-metin-2)] transition hover:bg-white/[0.075] hover:text-[var(--sc-metin)] active:scale-95"><ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /></Link>
          <span className="mx-0.5 h-6 w-px shrink-0 bg-white/[0.08]" />
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ring-1 ring-inset ring-white/[0.08] max-sm:hidden" style={{ background: "rgba(255,255,255,0.04)" }}><VayraIsaret size={17} /></span>
          <div className="min-w-0 pl-1.5 pr-0.5">
            <input value={t.ad} onChange={(e) => tYaz((tt) => ({ ...tt, ad: e.target.value.slice(0, 60) }), false)} aria-label="Tuval adı" title="Yeniden adlandırmak için yaz"
              className="-mx-1 block min-w-[80px] max-w-[clamp(110px,22vw,260px)] truncate [field-sizing:content] rounded-[6px] bg-transparent px-1 text-[14px] font-semibold leading-5 outline-none transition hover:bg-white/[0.065] focus:bg-white/[0.085] max-sm:w-full" />
            <span className="flex items-center gap-1.5 text-[11.5px] leading-4 text-[var(--sc-metin-3)]">
              <span className="tabular-nums">{t.dugumler.length} düğüm</span>
              {!t.ortak && <><span className="h-0.5 w-0.5 rounded-full bg-current" /><AnimatePresence mode="wait" initial={false}>{kayitAn
                ? <motion.span key="k" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} className="flex items-center gap-1"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />Kaydediliyor</motion.span>
                : <motion.span key="t" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} className="flex items-center gap-1"><Check className="h-3 w-3 text-emerald-400" />Kaydedildi</motion.span>}</AnimatePresence></>}
            </span>
          </div>
          <div className="relative">
            <button onClick={() => setMenu((v) => !v)} aria-label="Tuval menüsü" aria-expanded={menu} title="Tuval menüsü" className={cn("flex h-9 w-8 items-center justify-center rounded-[10px] transition active:scale-95", menu ? "bg-white/[0.08] text-[var(--sc-metin)]" : "text-[var(--sc-metin-3)] hover:bg-white/[0.075] hover:text-[var(--sc-metin)]")}><motion.span animate={{ rotate: menu ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown className="h-4 w-4" /></motion.span></button>
            <AnimatePresence>
              {menu && (
                <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.16 }} className="absolute left-0 top-11 z-40 w-[230px] origin-top-left rounded-[14px] bg-[var(--tv-yukselti)] p-1.5 ring-1 ring-white/[0.1]">
                  {[[LayoutGrid, "Otomatik düzenle", () => duzenle()], [Search, "Tuvalde ara", () => setArama(true)],
                    [BookmarkPlus, "Şablon olarak kaydet", () => {
                      const kaynak = secili.length > 1 ? t.dugumler.filter((d) => secili.includes(d.id)) : t.dugumler;
                      if (!kaynak.length) { toast.info("Kaydedilecek düğüm yok", { description: "Şablon kaydetmek için tuvale en az bir düğüm ekle." }); return; }
                      const ad = prompt("Şablon adı", t.ad)?.trim(); if (!ad) return;
                      const h = sablonHazirla(kaynak, t.kenarlar);
                      const kapak = t.dugumler.flatMap((d) => d.surumler).find((s) => s.tip === "gorsel" && s.url)?.url;
                      useKendiSablon.getState().ekle({ id: yeniId("s"), ad: ad.slice(0, 48), zaman: Date.now(), ...h, kapak });
                      toast.success("Şablon kaydedildi", { description: `${h.dugumler.length} düğüm kaydedildi. Canvas ana sayfasında ve boş tuvalde görünür.` });
                    }],
                    [FolderDown, "Tüm sonuçları indir (.zip)", () => void sonuclariIndir()],
                    [Copy, "Tuvali çoğalt", () => { const y = useTuval.getState().cogalt(id); if (y) router.push(`/panel/canvas/${y}`); }],
                    [FileJson, "Dışa aktar (.json)", () => { const u = URL.createObjectURL(new Blob([JSON.stringify({ vayraTuval: 1, ad: t.ad, dugumler: t.dugumler, kenarlar: t.kenarlar }, null, 2)], { type: "application/json" })); const a = document.createElement("a"); a.href = u; a.download = `${t.ad.replace(/[^\p{L}\p{N}]+/gu, "-")}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(u), 800); toast.success("Tuval dışa aktarıldı", { description: "JSON dosyası indirilenler klasörüne kaydedildi." }); }],
                    [Keyboard, "Klavye kısayolları", () => setKisayol(true)],
                    [Trash2, "Tuvali sil", () => { if (confirm("Tuval silinsin mi?")) { useTuval.getState().sil(id); router.push("/panel/canvas"); } }]].map(([I, a, f]) => {
                    const C = I as typeof Copy;
                    return <button key={a as string} onClick={() => { setMenu(false); (f as () => void)(); }} className={cn("flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] hover:bg-white/[0.075]", a === "Tuvali sil" && "text-rose-300")}><C className="h-4 w-4 opacity-80" />{a as string}</button>;
                  })}
                  <div className="mx-1 my-1 h-px bg-white/[0.085]" />
                  <p className="px-2.5 pb-1 pt-1 text-[11.5px] font-medium text-[var(--sc-metin-3)]">Bağlantılar</p>
                  <div className="mx-1.5 mb-1.5 flex rounded-[10px] bg-white/[0.055] p-0.5">
                    {([["egri", "Eğri"], ["dik", "Dik"], ["duz", "Düz"]] as const).map(([k, a]) => <button key={k} onClick={() => useTuvalTema.getState().kenarAyarla(k)} aria-pressed={kenarStil === k} className={cn("flex-1 rounded-[8px] py-1 text-[12px]", kenarStil === k ? "bg-white/[0.1] text-[var(--sc-metin)]" : "text-[var(--sc-metin-3)] hover:text-[var(--sc-metin-2)]")}>{a}</button>)}
                  </div>
                  <button onClick={() => useTuvalTema.getState().izgaraAyarla(!izgara)} aria-pressed={izgara} className="flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] hover:bg-white/[0.075]"><Grid3x3 className="h-4 w-4 opacity-80" /><span className="flex-1">Izgaraya yapış</span><span className={cn("relative h-4 w-7 rounded-full transition-colors", izgara ? "bg-[var(--tv-aksan)]" : "bg-white/[0.14]")}><span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all", izgara ? "left-3.5" : "left-0.5")} /></span></button>
                  <p className="px-2.5 pb-1 pt-1 text-[11.5px] font-medium text-[var(--sc-metin-3)]">Tema</p>
                  <div className="flex gap-1 px-1.5 pb-1">
                    {TEMALAR.map((tm) => (
                      <button key={tm.id} onClick={() => useTuvalTema.getState().ayarla(tm.id)} title={tm.ad} aria-pressed={tema === tm.id}
                        className={cn("flex flex-1 flex-col items-center gap-1 rounded-[10px] p-1.5 text-[11px] hover:bg-white/[0.065]", tema === tm.id && "bg-white/[0.085]")}>
                        <span className="relative h-6 w-full rounded-[6px] ring-1 ring-white/[0.12]" style={{ background: tm.zemin }}><span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full" style={{ background: tm.aksan }} /></span>{tm.ad}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {t.ortak ? (
            <button onClick={() => setPaylas(true)} title={ortak.durum === "bagli" ? "Birlikte düzenleme açık" : ortak.durum === "koptu" ? "Bağlantı koptu, yeniden deneniyor" : "Bağlanılıyor"} className="ml-1 flex items-center gap-1.5 rounded-full px-1.5 py-1 text-[11.5px] hover:bg-white/[0.065]">
              <span className={cn("h-2 w-2 rounded-full", ortak.durum === "bagli" ? "bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.18)]" : ortak.durum === "koptu" ? "bg-rose-400" : "bg-amber-300")} />
              <span className="flex -space-x-1.5">{ortak.kisiler.slice(0, 4).map((k) => <span key={k.id} title={k.ad} className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-[#111] ring-2 ring-[var(--tv-kart)]" style={{ background: k.renk }}>{k.ad.split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toLocaleUpperCase("tr")}</span>)}</span>
              <span className="hidden text-[var(--sc-metin-3)] md:inline">{ortak.durum === "bagli" ? (ortak.kisiler.length ? `${ortak.kisiler.length + 1} kişi` : "Canlı") : ortak.durum === "koptu" ? "Bağlantı koptu" : "Bağlanıyor"}</span>
            </button>
          ) : null}
          <span className="mx-0.5 hidden h-6 w-px shrink-0 bg-white/[0.08] md:block" />
          <button onClick={() => setSolPanel((v) => !v)} aria-pressed={solPanel} aria-label="Düğüm kitaplığı" title="Düğüm kitaplığı ([)" className={cn("hidden h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition active:scale-95 md:flex", solPanel ? "bg-white/[0.08] text-[var(--sc-metin)]" : "text-[var(--sc-metin-2)] hover:bg-white/[0.075]")}><PanelLeft className="h-4 w-4" /></button>
        </motion.div>

        {/* Üst sağ */}
        <motion.div data-arayuz initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0.04 }} className="absolute right-3 top-3 z-30 flex max-sm:top-[64px] items-center gap-1 rounded-[14px] bg-[var(--tv-kart)] p-1.5 ring-1 ring-white/[0.08] sm:right-4 sm:top-4">
          {bekleyen.length > 0 && (
            <span className="mr-1 hidden h-8 items-center gap-2 rounded-[10px] py-1 pl-2 pr-2.5 ring-1 ring-inset ring-white/[0.07] md:flex" style={{ background: "rgba(255,255,255,0.035)" }} title={`${bekleyen.length} düğüm çalıştırılacak, toplam ${toplamKredi} kredi`}>
              <KrediJeton boyut={15} />
              <span className="flex flex-col leading-none">
                <span className="text-[12.5px] font-semibold tabular-nums"><motion.span key={toplamKredi} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="inline-block">{toplamKredi}</motion.span> kredi</span>
                <span className="mt-[3px] text-[10.5px] tabular-nums text-[var(--sc-metin-3)]">{bekleyen.length} adım çalışacak</span>
              </span>
              <span className="h-5 w-px bg-white/[0.08]" />
              <span className="flex flex-col leading-none">
                <span className={cn("text-[12.5px] font-semibold tabular-nums", toplamKredi > kredi && "text-rose-300")}>{kredi.toLocaleString("tr")}</span>
                <span className="mt-[3px] text-[10.5px] text-[var(--sc-metin-3)]">bakiye</span>
              </span>
            </span>
          )}
          {calisanVar || calisiyorTum
            ? <button onClick={() => { siradakileriIptal(id); setCalisiyorTum(false); }} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.085] px-3.5 text-[13px] font-semibold hover:bg-white/[0.14]"><Square className="h-3 w-3 fill-current" />Durdur</button>
            : <button onClick={() => void tumu()} disabled={!t.dugumler.length} title="Ctrl Shift Enter" className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold text-black transition active:scale-95 transition-[filter] hover:brightness-110 disabled:opacity-40"><Play className="h-3.5 w-3.5 fill-current" /><span className="max-sm:hidden">Tümünü çalıştır</span></button>}
          <button onClick={() => setUygulamaAcik(true)} title="Uygulama olarak yayınla" className={cn("flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-[13px] hover:bg-white/[0.075]", t.uygulama?.id && "text-emerald-300")}><AppWindow className="h-3.5 w-3.5" /><span className="max-md:hidden">Uygulama</span></button>
          <button onClick={() => setPaylas(true)} className="flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-[13px] hover:bg-white/[0.075]"><Share2 className="h-3.5 w-3.5" /><span className="max-sm:hidden">Paylaş</span></button>
          <span className="mx-0.5 hidden h-5 w-px bg-white/[0.08] lg:block" />
          <button onClick={() => { setGecmisAcik((v) => !v); setYorumPaneli(false); setAyarlarId(null); }} aria-pressed={gecmisAcik} aria-label="Çalıştırma geçmişi" title="Çalıştırma geçmişi" className={cn("relative hidden h-8 w-8 items-center justify-center rounded-[10px] transition active:scale-90 lg:flex hover:bg-white/[0.075]", gecmisAcik ? "text-[var(--tv-aksan)]" : "text-[var(--sc-metin-2)]")}><History className="h-4 w-4" />{(t.gecmis ?? []).some((k) => !k.bit) && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--tv-aksan)]" />}</button>
          <button onClick={() => { setYorumPaneli((v) => !v); setGecmisAcik(false); setAyarlarId(null); }} aria-pressed={yorumPaneli} aria-label="Yorumlar" title="Yorumlar" className={cn("relative hidden h-8 w-8 items-center justify-center rounded-[10px] transition active:scale-90 lg:flex hover:bg-white/[0.075]", yorumPaneli ? "text-[var(--tv-aksan)]" : "text-[var(--sc-metin-2)]")}><MessageSquare className="h-4 w-4" />{(t.yorumlar ?? []).some((y) => !y.cozuldu) && <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-white px-0.5 text-[8.5px] font-bold text-black">{(t.yorumlar ?? []).filter((y) => !y.cozuldu).length}</span>}</button>
          <button onClick={() => setKisayol(true)} aria-label="Kısayollar" title="Kısayollar (?)" className="hidden h-8 w-8 items-center justify-center rounded-[10px] lg:flex text-[var(--sc-metin-2)] hover:bg-white/[0.075]"><HelpCircle className="h-4 w-4" /></button>
          <button onClick={() => setSagPanel((v) => !v)} aria-pressed={sagPanel} aria-label="Çıktılar" title="Çıktılar (])" className={cn("flex h-8 w-8 items-center justify-center rounded-[10px] transition active:scale-90", sagPanel ? "bg-white/[0.08] text-[var(--sc-metin)]" : "text-[var(--sc-metin-2)] hover:bg-white/[0.075]")}><PanelRight className="h-4 w-4" /></button>
        </motion.div>

        {/* Asistan kutusu (C) */}
        <AnimatePresence>
          {(asistan || plan) && (
            <motion.div data-arayuz initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="absolute bottom-[76px] left-1/2 z-30 w-[min(640px,calc(100vw-24px))] -translate-x-1/2">
              {plan && plan.adimlar.length > 0 && (
                <div className="mb-2 rounded-[18px] bg-[var(--tv-kart)] p-4 ring-1 ring-white/[0.1]">
                  <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-white" /><p className="flex-1 text-[14px] font-semibold">Akış önerisi · {plan.adimlar.length} düğüm</p><span className="flex items-center gap-1 rounded-full bg-white/[0.075] px-2.5 py-1 text-[12px] tabular-nums"><KrediJeton boyut={14} />yaklaşık {plan.kredi} kredi</span></div>
                  <ol className="mt-3 max-h-[220px] space-y-1 overflow-y-auto text-[13px] [scrollbar-width:thin]" data-kaydirilabilir>
                    {plan.adimlar.map((a, i) => { const c = KATALOG[a.tur].cikti; return (
                      <li key={i} className="flex items-center gap-2.5 rounded-[10px] bg-white/[0.045] px-3 py-1.5"><span className="h-2 w-2 rounded-full" style={{ background: c ? PORT_RENK[c] : "#8693a5" }} /><span className="flex-1">{a.ad}</span><span className="text-[12px] tabular-nums text-[var(--sc-metin-3)]">{a.kredi ? `${a.kredi} kredi` : KATALOG[a.tur].calisir ? "Ücretsiz" : a.tur === "yukle" ? "Görselin" : "Metin"}</span></li>); })}
                  </ol>
                  {plan.tarif.dugumler.some((d) => d.tur === "yukle") && <p className="mt-2 text-[12px] text-[var(--sc-metin-3)]">Akışta görsel yükleme düğümü var; kurduktan sonra görselini ekleyip çalıştır.</p>}
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button onClick={() => setPlan(null)} className="h-9 rounded-full px-3.5 text-[13px] text-[var(--sc-metin-2)] hover:bg-white/[0.065]">Vazgeç</button>
                    <button onClick={() => planKur(false)} className={cn("h-9 rounded-full px-4 text-[13px] font-semibold", plan.tarif.dugumler.some((d) => d.tur === "yukle") ? "bg-white text-black" : "bg-white/[0.085] text-white ring-1 ring-white/[0.08] hover:bg-white/[0.14]")}>{plan.tarif.dugumler.some((d) => d.tur === "yukle") ? "Akışı kur" : "Yalnız kur"}</button>
                    {!plan.tarif.dugumler.some((d) => d.tur === "yukle") && <button onClick={() => planKur(true)} disabled={plan.kredi > kredi} className="flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-black disabled:opacity-40"><Play className="h-3.5 w-3.5 fill-current" />Kur ve çalıştır</button>}
                  </div>
                </div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); if (istek.trim().length < 3) return; setPlan(akisPlanla(istek)); }} className="cam-istemci overflow-hidden rounded-[22px]">
                <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-3.5 py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ background: "rgba(255,255,255,0.1)" }}><WandSparkles className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold leading-4">Akış asistanı</span><span className="block text-[11.5px] leading-4 text-[var(--sc-metin-3)]">Ne istediğini yaz, düğümleri ve bağlantıları ben kurayım</span></span>
                  <button type="button" onClick={() => { setAsistan(false); setPlan(null); }} aria-label="Asistanı kapat" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] text-[var(--sc-metin-3)] transition hover:bg-white/[0.075] hover:text-[var(--sc-metin)] active:scale-95"><X className="h-4 w-4" /></button>
                </div>
                <div className="p-2.5">
                <textarea value={istek} onChange={(e) => setIstek(e.target.value)} rows={1} autoFocus aria-label="Asistana akış tarifi"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement).requestSubmit(); } if (e.key === "Escape") { setAsistan(false); setPlan(null); } }}
                  placeholder="Örneğin: ürün fotoğrafından 3 reklam görseli ve kısa video"
                  className="block max-h-[120px] min-h-[28px] w-full resize-none bg-transparent px-2 py-1 text-[14.5px] outline-none [field-sizing:content] placeholder:text-[var(--sc-metin-3)]" />
                <div className="mt-2 flex items-end gap-2 px-1">
                  <span className="flex-1 text-[11.5px] text-[var(--sc-metin-3)]">Enter ile öner, kurmadan önce görürsün</span>
                  <button aria-label="Akış öner" className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white pl-3.5 pr-3 text-[13px] font-semibold text-black transition active:scale-95">Akış öner<ArrowUp className="h-3.5 w-3.5" strokeWidth={2.4} /></button>
                </div>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Araç çubuğu (A) */}
        <motion.div data-arayuz initial={{ opacity: 0, y: 14, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.05 }} className="absolute bottom-3 z-30 flex items-center gap-0.5 rounded-[16px] bg-[var(--tv-kart)] p-1.5 ring-1 ring-white/[0.09] transition-[left] duration-300 sm:bottom-4" style={masaustuMu ? { left: `calc(50% + ${((solGorunur || kitaplik ? 284 : 0) - (sagGorunur ? 268 : 0)) / 2 + 60}px)` } : { left: "50%", maxWidth: "calc(100vw - 16px)", overflowX: "auto" }}>
          {([[MousePointer2, "Seç (V)", () => setArac("sec"), arac === "sec"], [Hand, "El (H · Boşluk)", () => setArac("el"), arac === "el"], null,
            [Plus, "Düğüm ekle (/ · çift tık)", () => { const r = kok.current!.getBoundingClientRect(); const m = merkezDunya(); setPalet({ sx: r.left + r.width / 2 - 190, sy: r.top + r.height / 2 - 220, wx: m.x, wy: m.y }); }, "ekle"],
            [Type, "İstem (T)", () => ekle("istem"), false], [Upload, "Görsel yükle (U)", () => ekle("yukle"), false], [StickyNote, "Not (N)", () => ekle("not"), false], [Library, "Kitaplık (L)", () => setKitaplik((v) => !v), kitaplik], [MessageSquare, "Yorum (C)", () => setArac((a) => (a === "yorum" ? "sec" : "yorum")), arac === "yorum"], null,
            [Sparkles, "Asistan: akışı kur", () => setAsistan((v) => !v), asistan ? "asistan" : false]] as const).map((a, i) => {
            if (a === null) return <span key={i} className="mx-1 h-6 w-px bg-white/[0.08]" />;
            const [I, ad, f, durum] = a;
            return <button key={ad} onClick={f} title={ad} aria-label={ad} aria-pressed={durum === true || durum === "asistan"}
              className={cn("group relative flex h-9 w-9 items-center justify-center rounded-[10px] transition-[color,background-color,transform] duration-150 active:scale-90", durum === true ? "text-[var(--tv-zemin)]" : durum === "ekle" ? "bg-white/[0.12] text-white ring-1 ring-inset ring-white/[0.15] hover:bg-white/[0.2]" : durum === "asistan" ? "bg-white text-black" : ad.startsWith("Asistan") ? "text-white hover:bg-white/[0.08]" : "text-[var(--sc-metin-2)] hover:bg-white/[0.075] hover:text-[var(--sc-metin)]")}>{durum === true && <motion.span layoutId="arac-secili" className="absolute inset-0 rounded-[10px] bg-white" transition={{ type: "spring", stiffness: 520, damping: 36 }} />}<I className={cn("relative h-4 w-4 transition-transform duration-200", durum === "ekle" ? "group-hover:rotate-90" : "group-hover:scale-110")} /></button>;
          })}
        </motion.div>

        {/* Yakınlaştırma */}
        <motion.div data-arayuz initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className={cn("absolute bottom-4 z-30 hidden items-center gap-0.5 rounded-[12px] bg-[var(--tv-kart)] p-1 ring-1 ring-white/[0.08] transition-[left] duration-300 md:flex", solGorunur || kitaplik ? "left-[296px]" : "left-4")}>
          <button onClick={() => useTuval.getState().geriAl(id)} disabled={!geriVar(id)} aria-label="Geri al" title="Geri al (Ctrl Z)" className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--sc-metin-2)] transition hover:bg-white/[0.075] hover:text-[var(--sc-metin)] active:scale-90 disabled:opacity-30"><Undo2 className="h-3.5 w-3.5" /></button>
          <button onClick={() => useTuval.getState().yinele(id)} disabled={!ileriVar(id)} aria-label="Yinele" title="Yinele (Ctrl Shift Z)" className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--sc-metin-2)] transition hover:bg-white/[0.075] hover:text-[var(--sc-metin)] active:scale-90 disabled:opacity-30"><Redo2 className="h-3.5 w-3.5" /></button>
          <span className="mx-0.5 h-5 w-px bg-white/[0.08]" />
          <button onClick={() => yakinlas(1 / 1.2)} aria-label="Uzaklaştır" className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--sc-metin-2)] transition hover:bg-white/[0.075] hover:text-[var(--sc-metin)] active:scale-90"><Minus className="h-3.5 w-3.5" /></button>
          <button onClick={() => setG((v) => ({ ...v, z: 1 }))} className="h-7 w-12 rounded-[8px] text-center text-[12px] tabular-nums text-[var(--sc-metin-2)] transition hover:bg-white/[0.075] hover:text-[var(--sc-metin)] active:scale-95" title="%100 yap">%{Math.round(g.z * 100)}</button>
          <button onClick={() => yakinlas(1.2)} aria-label="Yakınlaştır" className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--sc-metin-2)] transition hover:bg-white/[0.075] hover:text-[var(--sc-metin)] active:scale-90"><Plus className="h-3.5 w-3.5" /></button>
          <button onClick={() => sigdir()} aria-label="Sığdır" title="Sığdır (F)" className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--sc-metin-2)] transition hover:bg-white/[0.075] hover:text-[var(--sc-metin)] active:scale-90"><Maximize className="h-3.5 w-3.5" /></button>
          <button onClick={() => setHarita((v) => !v)} aria-pressed={harita} aria-label="Mini harita" className={cn("flex h-7 w-7 items-center justify-center rounded-[8px] transition hover:bg-white/[0.075] active:scale-90", harita ? "text-[var(--sc-metin)]" : "text-[var(--sc-metin-3)]")}><MapIcon className="h-3.5 w-3.5" /></button>
          <button onClick={() => { setGecmisAcik((v) => !v); setYorumPaneli(false); setAyarlarId(null); }} aria-pressed={gecmisAcik} aria-label="Çalıştırma geçmişi" title="Çalıştırma geçmişi" className={cn("relative flex lg:hidden h-7 w-7 items-center justify-center rounded-[8px] hover:bg-white/[0.075]", gecmisAcik ? "text-[var(--tv-aksan)]" : "text-[var(--sc-metin-2)]")}><History className="h-3.5 w-3.5" />{(t.gecmis ?? []).some((k) => !k.bit) && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--tv-aksan)]" />}</button>
          <button onClick={() => { setYorumPaneli((v) => !v); setGecmisAcik(false); setAyarlarId(null); }} aria-pressed={yorumPaneli} aria-label="Yorumlar" title="Yorumlar" className={cn("relative flex lg:hidden h-7 w-7 items-center justify-center rounded-[8px] hover:bg-white/[0.075]", yorumPaneli ? "text-[var(--tv-aksan)]" : "text-[var(--sc-metin-2)]")}><MessageSquare className="h-3.5 w-3.5" />{(t.yorumlar ?? []).some((y) => !y.cozuldu) && <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-white px-0.5 text-[8.5px] font-bold text-black">{(t.yorumlar ?? []).filter((y) => !y.cozuldu).length}</span>}</button>
          <button onClick={() => setKisayol(true)} aria-label="Kısayollar" title="Kısayollar (?)" className="flex h-7 w-7 lg:hidden items-center justify-center rounded-[8px] text-[var(--sc-metin-2)] hover:bg-white/[0.075]"><HelpCircle className="h-3.5 w-3.5" /></button>
        </motion.div>

        {/* Mini harita */}
        {harita && sinir && el && !ayarlarD && !asistan && !plan && !gecmisAcik && !yorumPaneli && (
          <div data-arayuz onPointerDown={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); const wx = sinir.x0 + (e.clientX - r.left - 6) / sinir.o, wy = sinir.y0 + (e.clientY - r.top - 6) / sinir.o; setG((v) => ({ ...v, x: el.clientWidth / 2 - wx * v.z, y: el.clientHeight / 2 - wy * v.z })); }}
            className={cn("absolute bottom-4 z-30 hidden h-[116px] w-[180px] cursor-pointer overflow-hidden rounded-[14px] bg-[var(--tv-kart)]/95 ring-1 ring-inset ring-white/[0.08] backdrop-blur transition-[right] duration-300 md:block", sagGorunur ? "right-[276px]" : "right-4")}>
            {t.dugumler.map((d) => { const c = KATALOG[d.tur].cikti; return <span key={d.id} className="absolute rounded-[2px]" style={{ left: 6 + (d.x - sinir.x0) * sinir.o, top: 6 + (d.y - sinir.y0) * sinir.o, width: Math.max(3, genislik(d) * sinir.o), height: Math.max(3, yukseklikTahmin(d) * sinir.o), background: saydam(c ? PORT_RENK[c] : "#8693a5", secili.includes(d.id) ? 92 : 50) }} />; })}
            <span className="pointer-events-none absolute rounded-[4px] ring-1 ring-inset ring-white/50" style={{ background: "rgba(255,255,255,0.04)", left: 6 + (-g.x / g.z - sinir.x0) * sinir.o, top: 6 + (-g.y / g.z - sinir.y0) * sinir.o, width: (el.clientWidth / g.z) * sinir.o, height: (el.clientHeight / g.z) * sinir.o }} />
          </div>
        )}

        <AnimatePresence>
          {palet && <KomutPaleti x={palet.sx} y={palet.sy} filtreTip={palet.kaynak ? KATALOG[t.dugumler.find((d) => d.id === palet.kaynak)?.tur ?? "istem"].cikti : undefined}
            onKapat={() => setPalet(null)} onSec={(tur) => ekle(tur, palet.wx, palet.wy, palet.kaynak)} />}
        </AnimatePresence>

        {/* Kısayollar */}
        <AnimatePresence>
          {kisayol && <KisayolPaneli key="kisayol" onKapat={() => setKisayol(false)} />}
        </AnimatePresence>
        {paylas && <PaylasPenceresi tuval={t} onKapat={() => setPaylas(false)} />}
        <AnimatePresence>{uygulamaAcik && <UygulamaPenceresi t={t} onKapat={() => setUygulamaAcik(false)} />}</AnimatePresence>

        <AnimatePresence>
          {ayarlarD && (
            <Denetci key={ayarlarD.id} d={ayarlarD} t={t} onKapat={() => setAyarlarId(null)}
              onDegis={(p, gecmis) => ayarYay(p, gecmis ?? true)} toplu={topluIds?.length}
              onCalistir={() => void dugumCalistir(id, ayarlarD.id)}
              onAkisla={() => void calistirSecili([ayarlarD.id])}
              onCikar={(s) => { const nid = medyaEkle(s.tip, s.url!, ayarlarD.x + genislik(ayarlarD) + 80, ayarlarD.y + 40, `${ayarlarD.ad ?? KATALOG[ayarlarD.tur].ad} · sürüm`, s.poster, s.demo); setAyarlarId(nid); }}
              onCogalt={() => kopyaYapistir({ dugumler: [ayarlarD], kenarlar: [] })}
              onSil={() => sil([ayarlarD.id])} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {maskeId && (() => {
            const md = t.dugumler.find((x) => x.id === maskeId); const kaynak = md && girdileriTopla(t, md).find((x) => x.port === "gorsel")?.url;
            if (!md || !kaynak) return null;
            return <MaskeCizici key={maskeId} gorsel={kaynak} mevcut={typeof md.ayar.maskeUrl === "string" ? md.ayar.maskeUrl : undefined} onKapat={() => setMaskeId(null)}
              onKaydet={(m) => { const a = { ...md.ayar }; if (m) a.maskeUrl = m; else delete a.maskeUrl; dugumYaz(md.id, { ayar: a, ...(md.surumler.length ? { eski: true } : {}) }); }} />;
          })()}
        </AnimatePresence>
        <AnimatePresence>
          {gecmisAcik && <GecmisPaneli kayitlar={t.gecmis ?? []} onKapat={() => setGecmisAcik(false)} onTemizle={() => tYaz((tt) => ({ ...tt, gecmis: [] }), false)}
            onSec={(did) => { if (t.dugumler.some((d) => d.id === did)) { setSecili([did]); sigdir([did]); } else toast.info("Düğüm bulunamadı", { description: "Bu düğüm tuvalden silinmiş." }); }}
            onYeniden={(ids) => void calistirSecili(ids.filter((i) => t.dugumler.some((d) => d.id === i)))} />}
          {yorumPaneli && !gecmisAcik && <YorumPaneli yorumlar={t.yorumlar ?? []} onKapat={() => setYorumPaneli(false)}
            onSec={(y) => { const nd = y.dugum ? t.dugumler.find((d) => d.id === y.dugum) : undefined; const wx = (nd?.x ?? 0) + y.x, wy = (nd?.y ?? 0) + y.y; const el2 = kok.current; if (el2) setG((v) => ({ ...v, x: el2.clientWidth / 2 - wx * v.z - 120, y: el2.clientHeight / 2 - wy * v.z })); setAcikYorum(y.id); }} />}
        </AnimatePresence>
        <AnimatePresence>
          {(yeniYorum || acikYorum) && (() => {
            const y = acikYorum ? (t.yorumlar ?? []).find((x) => x.id === acikYorum) : undefined;
            const nd = y?.dugum ? t.dugumler.find((d) => d.id === y.dugum) : undefined;
            const wx = y ? (nd?.x ?? 0) + y.x : yeniYorum!.wx, wy = y ? (nd?.y ?? 0) + y.y : yeniYorum!.wy;
            const r0 = kok.current?.getBoundingClientRect();
            const sx = (r0?.left ?? 0) + g.x + wx * g.z, sy = (r0?.top ?? 0) + g.y + wy * g.z;
            const yorumYaz = (f: (l: Yorum[]) => Yorum[]) => tYaz((tt) => ({ ...tt, yorumlar: f(tt.yorumlar ?? []) }));
            return <YorumBalonu key={y?.id ?? "yeni"} y={y} yeni={!y} x={sx} ust={sy} yazar={kullaniciAd} onKapat={() => { setYeniYorum(null); setAcikYorum(null); }}
              onGonder={(m) => { const yy = yeniYorum!; const nd2 = yy.dugum ? t.dugumler.find((d) => d.id === yy.dugum) : undefined; const yid = yeniId("y");
                yorumYaz((l) => [...l, { id: yid, x: yy.wx - (nd2?.x ?? 0), y: yy.wy - (nd2?.y ?? 0), ...(nd2 ? { dugum: nd2.id } : {}), yazar: kullaniciAd, renk: yazarRenk(kullaniciAd), metin: m, zaman: Date.now(), yanitlar: [] }]);
                setYeniYorum(null); setAcikYorum(yid); }}
              onYanit={(m) => yorumYaz((l) => l.map((x) => (x.id === y!.id ? { ...x, yanitlar: [...x.yanitlar, { id: yeniId("r"), yazar: kullaniciAd, renk: yazarRenk(kullaniciAd), metin: m, zaman: Date.now() }] } : x)))}
              onCoz={() => yorumYaz((l) => l.map((x) => (x.id === y!.id ? { ...x, cozuldu: !x.cozuldu } : x)))}
              onSil={() => { yorumYaz((l) => l.filter((x) => x.id !== y!.id)); setAcikYorum(null); }} />;
          })()}
        </AnimatePresence>
        {yeniYorum && (() => { const r0 = kok.current?.getBoundingClientRect(); return <span aria-hidden className="pointer-events-none fixed z-[54] h-[30px] w-[30px] rounded-full rounded-bl-none bg-[var(--tv-aksan)] ring-2 ring-white" style={{ left: (r0?.left ?? 0) + g.x + yeniYorum.wx * g.z, top: (r0?.top ?? 0) + g.y + yeniYorum.wy * g.z - 30 }} />; })()}
        <AnimatePresence>{gor3d && <Gorunum3D glb={gor3d.glb} poster={gor3d.poster} ad={gor3d.ad} onKapat={() => setGor3d(null)} />}</AnimatePresence>
        <AnimatePresence>{solGorunur && <DugumKitapligi key="dk" onKapat={() => setSolPanel(false)} onEkle={(tur) => ekle(tur)} />}</AnimatePresence>
        <AnimatePresence>{sagGorunur && <CiktiPaneli key="cp" t={t} onKapat={() => setSagPanel(false)} onOdakla={(did) => { if (window.innerWidth < 768) setSagPanel(false); odakla(did); }} onSunum={(i) => setSunum(i)} onIndir={() => void sonuclariIndir()} />}</AnimatePresence>
        <AnimatePresence>{sunum !== null && <Sunum key="sunum" l={ciktilariTopla(t)} baslangic={sunum} baslik={t.ad} onKapat={() => setSunum(null)} onOdakla={odakla} />}</AnimatePresence>
        <AnimatePresence>{kitaplik && <Varliklar onKapat={() => setKitaplik(false)} onEkle={(v) => { const m = merkezDunya(); medyaEkle(v.tip, v.url, m.x - 130, m.y - 120, v.ad, v.poster, v.demo); }} />}</AnimatePresence>
        <AnimatePresence>{arama && <AramaKutusu dugumler={t.dugumler} onKapat={() => setArama(false)} onSec={(did) => { setSecili([did]); sigdir([did]); }} />}</AnimatePresence>
        <AnimatePresence>{onay && <CalistirOnay satirlar={onay.satirlar} bakiye={kredi} onKapat={() => setOnay(null)} onOnay={() => { const o = onay; setOnay(null); void baslat(o.ids, true); }} />}</AnimatePresence>
        <AnimatePresence>{baglam && <BaglamMenu key={`${baglam.x}-${baglam.y}`} x={baglam.x} y={baglam.y} onKapat={() => setBaglam(null)} ogeler={baglamOgeleri(baglam)} ust={etiketUst(baglam)} />}</AnimatePresence>
      </div>
    </MotionConfig>
  );
}
