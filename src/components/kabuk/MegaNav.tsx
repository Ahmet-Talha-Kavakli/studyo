"use client";

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, Workflow, FolderKanban, Library, Coins, Code2, Terminal, Info, Newspaper, Briefcase, Mail, Building2,
  HelpCircle, Sparkles, Boxes, Activity, ImageIcon, Wand2, Maximize2, Crop, UserRound, Palette, Images, Camera, Shirt,
  Film, Clapperboard, Layers, Combine, Scissors, Presentation, Mic, PenTool, ShoppingBag, Heart, AudioLines, Music, Box, Paintbrush,
  PersonStanding, Printer, LayoutGrid, Megaphone, Cpu, Type, Gem,
  type LucideIcon,
} from "lucide-react";
import { KATALOG, type KatalogModel, type KatalogTur } from "@/lib/modelKatalogu";
import { videoErisim } from "@/lib/videoSaglayici";
import { SURUMLER } from "@/lib/surumler";
import { MarkaKare } from "@/components/studyo/hf";
import { cn } from "@/lib/utils";

/**
 * Üst navigasyonun orta kısmı: başlıklar + açılır panel.
 *
 * Tasarım (Higgsfield / Leonardo / Runway incelemesi): bar sade ve tipografik; panel
 * sola yaslı, sayfayı karartmaz, sütunlar halinde "Özellikler" ve "Modeller". Her satır
 * aynı ritimde: 44 px karo + ad + tek satır açıklama. Karo nötr, üzerine gelince
 * Vayra camgöbeğine döner; yenilik ve öne çıkanlar karonun köşesinde küçük rozetle.
 * Video menüsü yalnız sağlayıcısı gerçekten çalışan modelleri listeler.
 *
 * Davranış: fareyle kısa gecikmeyle açılır, başlıklar arasında gezerken panel kapanmadan
 * içerik değişir; Enter/Space/↓ ile klavyeden açılır, panelde oklarla gezilir, Esc kapatır.
 */

const G = "/gercek";

type Menu = "gorsel" | "video" | "ses" | "uc" | "studyolar" | "kaynaklar";
type Baslik = { ad: string; href?: string; menu?: Menu; rozet?: string; eslesme: string[]; genis?: "lg" | "xl" };

const BASLIKLAR: Baslik[] = [
  { ad: "Keşfet", href: "/panel", eslesme: ["/panel"] },
  { ad: "Görsel", menu: "gorsel", eslesme: ["/panel/gorsel", "/panel/inpaint", "/panel/upscale", "/panel/reframe", "/panel/karakter", "/panel/moodboard", "/panel/photodump", "/panel/instadump", "/panel/fashion"] },
  { ad: "Video", menu: "video", eslesme: ["/panel/video", "/panel/draw", "/panel/speak", "/panel/ugc", "/panel/fans"] },
  { ad: "Ses", menu: "ses", eslesme: ["/panel/ses", "/panel/muzik"] },
  { ad: "3D", menu: "uc", eslesme: ["/panel/3d"] },
  { ad: "Stüdyolar", menu: "studyolar", eslesme: ["/panel/sinema", "/panel/pazarlama", "/panel/supercomputer", "/panel/uzun-video", "/panel/montaj", "/panel/shorts", "/panel/explainer", "/panel/influencer", "/panel/element", "/panel/canvas", "/panel/projeler"] },
  { ad: "Presetler", href: "/panel/presetler", rozet: "Yeni", eslesme: ["/panel/presetler"], genis: "lg" },
  { ad: "Kaynaklar", menu: "kaynaklar", eslesme: ["/panel/originals", "/panel/api", "/panel/mcp", "/panel/surum"] },
];

/** Menü öğesi. `ikon` masaüstü panelinde, `gorsel` mobil menüde ve aramada kullanılır. */
export type Arac = { ad: string; aciklama: string; href: string; ikon: LucideIcon; gorsel: string; rozet?: string };
export type TurMenu = {
  ikon: LucideIcon; baslik: string; studyo: string; turler: KatalogTur[];
  giris: { ad: string; aciklama: string; gorsel: string };
  araclar: Arac[];
  /** Menüde gösterilen modeller — katalogdaki adıyla, bu sırayla. */
  modeller: string[];
  /** Editoryal "Popüler" rozeti alan modeller. */
  populer: string[];
};

export const TUR_MENU: Record<"gorsel" | "video" | "ses" | "uc", TurMenu> = {
  gorsel: {
    ikon: ImageIcon, baslik: "Görsel", studyo: "/panel/gorsel", turler: ["gorsel"],
    giris: { ad: "Görsel oluştur", aciklama: "Metinden ve referanstan görsel üret", gorsel: `${G}/panel/gal-soul2-1.webp` },
    araclar: [
      { ad: "Görsel düzenle", aciklama: "Bir alanı seç, değişikliği yaz", href: "/panel/inpaint", ikon: Wand2, gorsel: `${G}/gorsel/iyilestir-gercekci.webp` },
      { ad: "Büyüt", aciklama: "Çözünürlüğü ve detayı artır", href: "/panel/upscale", ikon: Maximize2, gorsel: `${G}/arac/upscale-sonra.webp` },
      { ad: "Yeniden çerçevele", aciklama: "Görseli her en-boy oranına taşı", href: "/panel/reframe", ikon: Crop, gorsel: `${G}/arac/reframe-banner.webp` },
      { ad: "Karakter", aciklama: "Her sahnede aynı yüz", href: "/panel/karakter", ikon: UserRound, gorsel: `${G}/gorsel/gorsel-karakter-Aria.webp`, rozet: "Popüler" },
      { ad: "Ruh panosu", aciklama: "Referanslarından tutarlı bir stil kur", href: "/panel/moodboard", ikon: Palette, gorsel: `${G}/moodboard/mood-h1.webp` },
      { ad: "Photodump", aciklama: "Aynı günden çekilmiş gibi fotoğraf seti", href: "/panel/photodump", ikon: Images, gorsel: `${G}/arac/photodump-ornek-0.webp` },
      { ad: "Instadump", aciklama: "10 görsellik kaydırmalı gönderi", href: "/panel/instadump", ikon: Camera, gorsel: `${G}/panel/photodump1.webp` },
      { ad: "Moda fabrikası", aciklama: "Kıyafeti mankenli katalog çekimine çevir", href: "/panel/fashion", ikon: Shirt, gorsel: `${G}/arac/fashion-noir.webp` },
    ],
    modeller: ["Vayra Ruh 2.0", "Nano Banana Pro", "GPT Image 2", "Seedream 5.0 Pro", "FLUX.2 Pro", "Recraft V4.1", "Nano Banana 2.1", "Grok Imagine"],
    populer: ["Nano Banana Pro", "Vayra Ruh 2.0"],
  },
  video: {
    ikon: Film, baslik: "Video", studyo: "/panel/video", turler: ["video"],
    giris: { ad: "Video oluştur", aciklama: "Metinden ya da görselden, sesli video", gorsel: `${G}/hero-video/hero-video-poster.webp` },
    araclar: [
      { ad: "Sinema Stüdyosu", aciklama: "Kamera, lens ve ışıkla çok çekimli film", href: "/panel/sinema", ikon: Clapperboard, gorsel: `${G}/sinema/cs-hero-kokboru.webp` },
      { ad: "Viral presetler", aciklama: "Tek fotoğraftan hazır efektli video", href: "/panel/presetler", ikon: Sparkles, gorsel: `${G}/preset-video/earth-zoom.webp`, rozet: "Popüler" },
      { ad: "Uzun video", aciklama: "Senaryodan 1 dakikadan 1 saate film", href: "/panel/uzun-video", ikon: Layers, gorsel: `${G}/panel/yenilik-uzunvideo.webp`, rozet: "Yeni" },
      { ad: "Montaj", aciklama: "Klip, geçiş, altyazı ve müzikle kurgu", href: "/panel/montaj", ikon: Combine, gorsel: `${G}/panel/yenilik-montaj.webp`, rozet: "Beta" },
      { ad: "Shorts", aciklama: "Uzun videodan dikey kısa videolar", href: "/panel/shorts", ikon: Scissors, gorsel: `${G}/shorts/sp-neonpop.webp` },
      { ad: "Explainer", aciklama: "Konudan anlatım ve eğitim videosu", href: "/panel/explainer", ikon: Presentation, gorsel: `${G}/explainer-video/ex-claymotion.webp` },
      { ad: "Konuştur", aciklama: "Fotoğrafı dudak senkronuyla konuştur", href: "/panel/speak", ikon: Mic, gorsel: `${G}/influencer/kart-Lyric.webp` },
      { ad: "Çizimden videoya", aciklama: "Taslağını hareketli sahneye çevir", href: "/panel/draw", ikon: PenTool, gorsel: `${G}/arac/draw-tuval-video.webp` },
      { ad: "UGC fabrikası", aciklama: "Telefonla çekilmiş gibi ürün reklamı", href: "/panel/ugc", ikon: ShoppingBag, gorsel: `${G}/arac/ugc-review.webp` },
      { ad: "Fans stüdyosu", aciklama: "Karakterinle dublajlı hayran içeriği", href: "/panel/fans", ikon: Heart, gorsel: `${G}/gorsel/gorsel-karakter-Sofia.webp` },
    ],
    modeller: ["Kling 3.0", "Seedance 2.5", "Seedance 2.0", "Gemini Omni Flash", "Kling 3.0 Turbo", "Minimax Hailuo 2.3", "Kling 2.6", "Seedance 2.0 Fast"],
    populer: ["Kling 3.0", "Seedance 2.0"],
  },
  ses: {
    ikon: AudioLines, baslik: "Ses", studyo: "/panel/ses", turler: ["ses", "muzik"],
    giris: { ad: "Seslendirme", aciklama: "Metni doğal, duygulu sese çevir", gorsel: `${G}/kesfet/elevenlabsses.webp` },
    araclar: [
      { ad: "Müzik üret", aciklama: "Sözlü ya da enstrümantal tam şarkı", href: "/panel/muzik", ikon: Music, gorsel: `${G}/muzik/ms-neon.webp` },
      { ad: "Konuştur", aciklama: "Sesi bir yüze dudak senkronuyla ver", href: "/panel/speak", ikon: Mic, gorsel: `${G}/influencer/kart-Cooper.webp` },
      { ad: "AI Influencer", aciklama: "Sesli, tutarlı sanal karakter", href: "/panel/influencer", ikon: UserRound, gorsel: `${G}/gorsel/gorsel-karakter-Emma.webp` },
      { ad: "Explainer seslendirme", aciklama: "Senaryodan sahne sahne anlatım", href: "/panel/explainer", ikon: Presentation, gorsel: `${G}/explainer-video/ex-whiteboard.webp` },
    ],
    modeller: ["Eleven v3", "Eleven v4", "Seed Audio 1.0", "MiniMax Speech 2.8 HD", "VibeVoice", "Eleven Music v2.5"],
    populer: ["Eleven v3"],
  },
  uc: {
    ikon: Box, baslik: "3D", studyo: "/panel/3d", turler: ["3d"],
    giris: { ad: "3D stüdyosu", aciklama: "Üretime hazır, dokulu 3D model", gorsel: `${G}/hero-video/hero-3d-poster.webp` },
    araclar: [
      { ad: "Metinden 3D", aciklama: "Nesneyi tarif et, modelini al", href: "/panel/3d?mod=metin", ikon: Type, gorsel: `${G}/3d/robot-poster.png` },
      { ad: "Görselden 3D", aciklama: "Tek fotoğraftan tam 3D model", href: "/panel/3d?mod=gorsel", ikon: ImageIcon, gorsel: `${G}/3d/kask-poster.png` },
      { ad: "Dokulama", aciklama: "Modeline PBR doku giydir", href: "/panel/3d?mod=doku", ikon: Paintbrush, gorsel: `${G}/3d/lamba-poster.png` },
      { ad: "Canlandır", aciklama: "Karakterine iskelet ve animasyon ekle", href: "/panel/3d?mod=canlandir", ikon: PersonStanding, gorsel: `${G}/3d/savasci-poster.png`, rozet: "Yeni" },
      { ad: "3D baskı", aciklama: "Yazıcıya hazır STL çıktısı", href: "/panel/3d?mod=yazdir", ikon: Printer, gorsel: `${G}/3d/kask-ham-poster.png` },
    ],
    modeller: ["Vayra 3D · Metin", "Vayra 3D · Görsel", "Vayra 3D · Dokulama", "Vayra 3D · Rig & Animasyon"],
    populer: [],
  },
};

/* ── "Stüdyolar" paneli ── */
export const STUDYOLAR: Arac[] = [
  { ad: "Sinema Stüdyosu", aciklama: "Çok çekimli sinematik prodüksiyon", href: "/panel/sinema", ikon: Clapperboard, gorsel: `${G}/sinema/cs-hero-kokboru.webp`, rozet: "Popüler" },
  { ad: "Pazarlama Stüdyosu", aciklama: "Ürün linkinden reklam seti", href: "/panel/pazarlama", ikon: Megaphone, gorsel: `${G}/panel/gal-pazarlama-2.webp` },
  { ad: "Usta", aciklama: "İstemle site, oyun ve uygulama", href: "/panel/supercomputer", ikon: Cpu, gorsel: `${G}/panel/hero-sc-free.webp`, rozet: "Beta" },
  { ad: "Uzun Video", aciklama: "1 dakikadan 1 saate film", href: "/panel/uzun-video", ikon: Layers, gorsel: `${G}/orig/kb-anim-hero.webp`, rozet: "Yeni" },
  { ad: "Montaj Stüdyosu", aciklama: "Yapay zekâ destekli kurgu", href: "/panel/montaj", ikon: Combine, gorsel: `${G}/orig/montaj-proje-1.webp`, rozet: "Beta" },
  { ad: "Shorts Stüdyosu", aciklama: "Dikey, kısa ve viral", href: "/panel/shorts", ikon: Scissors, gorsel: `${G}/panel/preset2.webp` },
  { ad: "Explainer", aciklama: "Anlatım ve eğitim videosu", href: "/panel/explainer", ikon: Presentation, gorsel: `${G}/explainer-video/ex-claymotion.webp` },
  { ad: "AI Influencer", aciklama: "Tutarlı, sesli sanal karakter", href: "/panel/influencer", ikon: UserRound, gorsel: `${G}/gorsel/gorsel-karakter-Sofia.webp` },
];
export const CALISMA_ALANI: Arac[] = [
  { ad: "Canvas", aciklama: "Düğümlerle tekrar kullanılabilir akış", href: "/panel/canvas", ikon: Workflow, gorsel: `${G}/panel/canvas-mockup.webp` },
  { ad: "Elementler", aciklama: "Karakter, mekân, obje ve stil", href: "/panel/element", ikon: LayoutGrid, gorsel: `${G}/orig/ornek-boynuz.webp` },
  { ad: "Projeler", aciklama: "Ekip ve varlık yönetimi", href: "/panel/projeler", ikon: FolderKanban, gorsel: `${G}/kabuk/varlik-2.webp` },
  { ad: "Kitaplık", aciklama: "Ürettiğin her şey", href: "/panel/kitaplik", ikon: Library, gorsel: `${G}/kabuk/kutuphane-ornek-1.webp` },
];

/* ── "Kaynaklar" paneli ── */
type KaynakOge = { ad: string; aciklama: string; href: string; ikon: LucideIcon; rozet?: string };
export const KAYNAK_SUTUNLARI: { baslik: string; ogeler: KaynakOge[] }[] = [
  {
    baslik: "Platform",
    ogeler: [
      { ad: "Vayra Earn", aciklama: "Üret, paylaş, kazan", href: "/earn", ikon: Coins },
      { ad: "API", aciklama: "Vayra'yı ürününe bağla", href: "/panel/api", ikon: Code2 },
      { ad: "MCP & CLI", aciklama: "Claude ve ChatGPT'den üret", href: "/panel/mcp", ikon: Terminal, rozet: "Yeni" },
    ],
  },
  {
    baslik: "Öğren",
    ogeler: [
      { ad: "Modeller", aciklama: `${KATALOG.length} model, bedel ve özellikleriyle`, href: "/modeller", ikon: Boxes },
      { ad: "Sürüm notları", aciklama: `Son sürüm v${SURUMLER[0].no}`, href: "/panel/surum", ikon: Sparkles },
      { ad: "Blog", aciklama: "Rehberler ve ürün haberleri", href: "/blog", ikon: Newspaper },
      { ad: "Yardım merkezi", aciklama: "Sık sorulan sorular", href: "/sss", ikon: HelpCircle },
      { ad: "Sistem durumu", aciklama: "Servislerin anlık durumu", href: "/durum", ikon: Activity },
    ],
  },
  {
    baslik: "Şirket",
    ogeler: [
      { ad: "Hakkımızda", aciklama: "Ekip, misyon ve hikâye", href: "/hakkinda", ikon: Info },
      { ad: "Kurumsal", aciklama: "Ekipler için Vayra", href: "/kurumsal", ikon: Building2 },
      { ad: "Kariyer", aciklama: "Açık pozisyonlar", href: "/kariyer", ikon: Briefcase },
      { ad: "İletişim", aciklama: "Destek ve satış ekibi", href: "/iletisim", ikon: Mail },
    ],
  },
];

const ACILMA_MS = 80;   // fare başlıktan geçip giderken panel boşuna açılmasın
const KAPANMA_MS = 200; // bar ↔ panel arasındaki boşlukta kapanmasın

/* ───────────────────────── Ortak parçalar (mobil menü ve hesap menüsü de kullanır) ───────────────────────── */

/** Kredi jetonu: üst üste binmiş iki halka. */
export function KrediIkon({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="9" cy="12" r="6" />
      <circle cx="15" cy="12" r="6" />
    </svg>
  );
}

/** Cam ikon karosu — rengi anlamdan (tür / bölüm) gelir. */
export function CamKaro({ ikon: Ikon, renk, boyut = 34, className }: { ikon: LucideIcon; renk: string; boyut?: number; className?: string }) {
  return (
    <span className={cn("glass-ikon glass-ikon-cyan flex shrink-0 items-center justify-center rounded-[10px] transition-transform duration-200 group-hover:scale-[1.06]", className)}
      style={{ "--gi": renk, width: boyut, height: boyut } as CSSProperties}>
      <Ikon style={{ width: Math.round(boyut * 0.47), height: Math.round(boyut * 0.47) }} strokeWidth={1.9} />
    </span>
  );
}

/** Küçük harfli bölüm etiketi. */
export function BolumEtiket({ children, sag, className }: { children: React.ReactNode; sag?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-2.5 flex items-center justify-between gap-2 px-1", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">{children}</p>
      {sag}
    </div>
  );
}

/** Rozet: Yeni (camgöbeği) · Popüler (beyaz) · Beta (lila). */
export function Rozet({ children, sinif }: { children: React.ReactNode; sinif?: string }) {
  const r = String(children);
  const ton = r === "Popüler" || r === "Trend" ? "bg-white text-[#0a0a0b]" : r === "Beta" ? "bg-[#c4b5fd] text-[#120b24]" : "bg-aksan text-[#03141a]";
  return <span className={cn("inline-flex shrink-0 items-center rounded-[5px] px-1.5 py-px text-[9.5px] font-extrabold uppercase leading-[14px] tracking-[0.04em]", ton, sinif)}>{children}</span>;
}

/**
 * Menü içi ok tuşu gezintisi: kapsayıcıdaki `[data-gez]` öğeleri arasında
 * ↓/→ ileri, ↑/← geri, Home/End uçlara gider.
 */
export function okGezinti(e: React.KeyboardEvent<HTMLElement>) {
  const k = e.key;
  if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"].includes(k)) return;
  const ogeler = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-gez]"));
  if (!ogeler.length) return;
  e.preventDefault();
  const i = ogeler.indexOf(document.activeElement as HTMLElement);
  const n = ogeler.length;
  const j = k === "Home" ? 0 : k === "End" ? n - 1
    : k === "ArrowDown" || k === "ArrowRight" ? (i + 1 + n) % n
    : (i - 1 + n) % n;
  ogeler[i < 0 && (k === "ArrowUp" || k === "ArrowLeft") ? n - 1 : j]?.focus();
}

const ODAK = "outline-none focus-visible:ring-2 focus-visible:ring-aksan/70";

/* ───────────────────────── MegaNav ───────────────────────── */

export function MegaNav({ path }: { path: string }) {
  const [acik, setAcik] = useState<Menu | null>(null);
  const zaman = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tetikRef = useRef<Partial<Record<Menu, HTMLButtonElement | null>>>({});
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const sonFare = useRef(false);

  const temizle = () => { if (zaman.current) { clearTimeout(zaman.current); zaman.current = null; } };
  const ac = useCallback((m: Menu, gecikme = 0) => {
    temizle();
    if (gecikme) zaman.current = setTimeout(() => setAcik(m), gecikme);
    else setAcik(m);
  }, []);
  const kapat = useCallback((gecikme = 0) => {
    temizle();
    if (gecikme) zaman.current = setTimeout(() => setAcik(null), gecikme);
    else setAcik(null);
  }, []);

  useEffect(() => { kapat(); }, [path, kapat]);
  useEffect(() => () => temizle(), []);

  // Dışarı basınca ve Esc'te kapan (Esc odağı başlığa geri verir).
  useEffect(() => {
    if (!acik) return;
    const bas = (e: PointerEvent) => {
      const t = e.target as Node;
      if (navRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      kapat();
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { tetikRef.current[acik]?.focus(); kapat(); } };
    document.addEventListener("pointerdown", bas);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", bas); document.removeEventListener("keydown", esc); };
  }, [acik, kapat]);

  // ↓ ile açılınca ilk öğeye odaklan.
  const ilkeOdak = useRef(false);
  useEffect(() => {
    if (!acik || !ilkeOdak.current) return;
    ilkeOdak.current = false;
    const t = setTimeout(() => panelRef.current?.querySelector<HTMLElement>("[data-gez]")?.focus(), 40);
    return () => clearTimeout(t);
  }, [acik]);

  // Panel body'ye portal ile basılır (header'ın backdrop-filter'ı fixed konumu bozar).
  const [mount, setMount] = useState(false);
  useEffect(() => setMount(true), []);

  const aktifMi = (b: Baslik) => b.href === "/panel" ? path === "/panel" : b.eslesme.some((h) => path === h || path.startsWith(h + "/"));
  const fare = (e: React.PointerEvent) => e.pointerType === "mouse";

  return (
    <>
      <nav ref={navRef} aria-label="Ana gezinme" className="flex items-center gap-0.5"
        onPointerLeave={(e) => { if (fare(e)) kapat(KAPANMA_MS); }}>
        {BASLIKLAR.map((b) => {
          const aktif = aktifMi(b);
          const menuAcik = !!b.menu && acik === b.menu;
          const sinif = cn(
            "relative flex h-10 items-center gap-1.5 rounded-[11px] px-3 text-[15px] font-medium tracking-[-0.005em] transition-colors duration-150 xl:px-3",
            ODAK,
            b.genis === "lg" && "hidden lg:flex",
            b.genis === "xl" && "hidden xl:flex",
            menuAcik ? "bg-white/[0.08] text-white" : aktif ? "text-aksan" : "text-white/65 hover:bg-white/[0.05] hover:text-white",
          );
          const ic = (
            <>
              {b.ad}
              {b.rozet && <span className="rounded-[5px] bg-white/[0.08] px-1 py-px text-[10px] font-semibold leading-[14px] text-white/55">{b.rozet}</span>}
            </>
          );
          return b.menu ? (
            <button key={b.ad} type="button" ref={(el) => { tetikRef.current[b.menu!] = el; }}
              aria-expanded={menuAcik} aria-controls={menuAcik ? panelId : undefined} aria-haspopup="true"
              onPointerEnter={(e) => { if (fare(e)) ac(b.menu!, acik ? 0 : ACILMA_MS); }}
              onPointerDown={(e) => { sonFare.current = fare(e); }}
              // Fare üzerine gelince zaten açtı: tıklama kapatmasın. Dokunmatik ve klavyede aç/kapa.
              onClick={() => { if (sonFare.current) { sonFare.current = false; ac(b.menu!); return; } if (menuAcik) kapat(); else ac(b.menu!); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); ilkeOdak.current = true; if (menuAcik) panelRef.current?.querySelector<HTMLElement>("[data-gez]")?.focus(); else ac(b.menu!); }
              }}
              className={sinif}>
              {ic}
            </button>
          ) : (
            <Link key={b.ad} href={b.href!} className={sinif} aria-current={aktif ? "page" : undefined}
              onPointerEnter={(e) => { if (fare(e)) kapat(KAPANMA_MS); }}>
              {ic}
            </Link>
          );
        })}
        {/* Fiyatlar: Kaynaklar'ın sağında, kenarında dönen RGB ışık */}
        <Link href="/fiyatlandirma" aria-current={path.startsWith("/fiyatlandirma") ? "page" : undefined}
          onPointerEnter={(e) => { if (fare(e)) kapat(KAPANMA_MS); }}
          className={cn("group relative ml-1.5 hidden rounded-[12px] lg:block", ODAK)}>
          <span aria-hidden className="rgb-cerceve rgb-hale pointer-events-none absolute inset-0 rounded-[12px] opacity-0 transition-opacity duration-300 group-hover:opacity-60" />
          <span className="rgb-cerceve relative block rounded-[12px] p-[1.5px]">
            <span className="flex h-[37px] items-center gap-1.5 rounded-[10.5px] bg-[#0f0f11] px-4 text-[14.5px] font-semibold text-white transition-colors group-hover:bg-[#151518]">
              <Gem className="h-[15px] w-[15px]" strokeWidth={2} />Fiyatlar
            </span>
          </span>
        </Link>
      </nav>

      {mount && createPortal(
        <AnimatePresence>
          {acik && (
            <motion.div key="panel" ref={panelRef} id={panelId} role="region" aria-label={BASLIKLAR.find((b) => b.menu === acik)?.ad}
              onPointerEnter={(e) => { if (fare(e)) temizle(); }}
              onPointerLeave={(e) => { if (fare(e)) kapat(KAPANMA_MS); }}
              onKeyDown={okGezinti}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-3 top-[calc(var(--ust-nav)+2px)] z-[46] max-h-[calc(100dvh-var(--ust-nav)-18px)] max-w-[calc(100vw-24px)] overflow-y-auto overflow-x-hidden rounded-[20px] border border-white/[0.08] bg-[#151517] p-2 [scrollbar-width:thin]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={acik} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
                  {(acik === "gorsel" || acik === "video" || acik === "ses" || acik === "uc") && <TurPaneli m={TUR_MENU[acik]} />}
                  {acik === "studyolar" && <StudyolarPaneli />}
                  {acik === "kaynaklar" && <KaynaklarPaneli />}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

/* ───────────────────────── Panel parçaları ───────────────────────── */

function Sutun({ baslik, sag, children, className }: { baslik: string; sag?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("w-[min(372px,calc(100vw-40px))] min-w-0", className)}>
      <div className="flex h-8 items-center justify-between px-3">
        <p className="text-[13px] text-white/45">{baslik}</p>
        {sag}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

/** Karo: nötr cam kare, üzerine gelince camgöbeğine döner; rozet sol üst köşeye taşar. */
function Karo({ children, rozet }: { children: React.ReactNode; rozet?: string }) {
  return (
    <span className="relative shrink-0">
      <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-white/[0.055] text-white/90 ring-1 ring-inset ring-white/[0.08] transition-[background-color,color,box-shadow] duration-200 group-hover:bg-aksan/[0.12] group-hover:text-aksan group-hover:ring-aksan/35 group-focus-visible:bg-aksan/[0.12] group-focus-visible:text-aksan">
        {children}
      </span>
      {rozet && <Rozet sinif="absolute -left-1.5 -top-1.5">{rozet}</Rozet>}
    </span>
  );
}

function Satir({ href, ad, aciklama, rozet, karo }: { href: string; ad: string; aciklama: string; rozet?: string; karo: React.ReactNode }) {
  return (
    <Link href={href} data-gez className={cn("group flex items-center gap-3.5 rounded-[14px] px-3 py-2 transition-colors duration-150 hover:bg-white/[0.045] focus-visible:bg-white/[0.045]", ODAK)}>
      <Karo rozet={rozet}>{karo}</Karo>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-medium leading-5 text-white">{ad}</span>
        <span className="block truncate text-[13px] leading-5 text-white/45 transition-colors group-hover:text-white/60">{aciklama}</span>
      </span>
    </Link>
  );
}

const ikonSatir = (a: { href: string; ad: string; aciklama: string; ikon: LucideIcon; rozet?: string }) => (
  <Satir key={a.href + a.ad} href={a.href} ad={a.ad} aciklama={a.aciklama} rozet={a.rozet} karo={<a.ikon className="h-5 w-5" strokeWidth={1.8} />} />
);

/** Video modellerinde yalnız sağlayıcısı çalışanlar; diğer türlerde katalogdaki ad. */
function modelleriBul(m: TurMenu): KatalogModel[] {
  const tum = KATALOG.filter((x) => m.turler.includes(x.tur));
  return m.modeller
    .map((ad) => tum.find((x) => x.ad === ad))
    .filter((x): x is KatalogModel => !!x && (x.tur !== "video" || videoErisim(x.ad).durum === "gercek"));
}

function TurPaneli({ m }: { m: TurMenu }) {
  const modeller = modelleriBul(m);
  const toplam = KATALOG.filter((x) => m.turler.includes(x.tur)).length;
  return (
    <div className="flex flex-col gap-1 md:flex-row">
      <Sutun baslik="Özellikler">
        {ikonSatir({ href: m.studyo, ad: m.giris.ad, aciklama: m.giris.aciklama, ikon: m.ikon })}
        {m.araclar.map(ikonSatir)}
      </Sutun>
      {modeller.length > 0 && (
        <Sutun baslik="Modeller" sag={
          <Link href={`/modeller?tur=${m.turler[0]}`} data-gez className={cn("flex items-center gap-1 rounded-md text-[12.5px] text-white/45 transition-colors hover:text-white", ODAK)}>
            Tümü <span className="tabular-nums">{toplam}</span><ArrowRight className="h-3 w-3" />
          </Link>
        }>
          {modeller.map((x) => (
            <Satir key={x.slug} href={x.href} ad={x.ad} aciklama={x.ozet}
              rozet={m.populer.includes(x.ad) ? "Popüler" : x.rozet === "Yeni" ? "Yeni" : undefined}
              karo={<span className="flex h-11 w-11 items-center justify-center [&>span]:!bg-transparent [&>span]:!shadow-none [&>span]:!ring-0"><MarkaKare ad={x.ad} boyut={44} /></span>} />
          ))}
        </Sutun>
      )}
    </div>
  );
}

function StudyolarPaneli() {
  return (
    <div className="flex flex-col gap-1 md:flex-row">
      <Sutun baslik="Stüdyolar">{STUDYOLAR.map(ikonSatir)}</Sutun>
      <Sutun baslik="Çalışma alanı">{CALISMA_ALANI.map(ikonSatir)}</Sutun>
    </div>
  );
}

function KaynaklarPaneli() {
  return (
    <div className="flex flex-col gap-1 md:flex-row">
      {KAYNAK_SUTUNLARI.map((k) => (
        <Sutun key={k.baslik} baslik={k.baslik} className="md:w-[300px]">{k.ogeler.map(ikonSatir)}</Sutun>
      ))}
    </div>
  );
}
