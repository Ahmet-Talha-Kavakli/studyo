"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import {
  Search, Rocket, FolderOpen, Bell, LayoutGrid, Check, ChevronRight,
  LogOut, User, Settings, Zap, Sparkles, Infinity,
  Image as ImageIcon, Film, AudioLines, Type,
  Camera, UserRound, Sun, Wand2, Maximize2, Scissors, Palette,
  Clapperboard, Presentation, Layers, Pencil, Megaphone, Mic, Move3d, Languages, Music, BarChart3,
  Gift, X,
  Compass, Box, Cpu, Terminal, Puzzle, Clapperboard as Sinema, Workflow, Sparkle,
  ChevronDown, Flame, Clapperboard as UzunFilm, Combine, AlertTriangle, FolderKanban,
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { AramaModal } from "@/components/panel/AramaModal";
import { VayraIsaret } from "./VayraIsaret";
import { useAuth, krediDurum } from "@/store/useAuth";
import { useAuthKapi } from "@/store/useAuthKapi";
import { useBildirim } from "@/store/useBildirim";
import { cn } from "@/lib/utils";

/**
 * Higgsfield üst navigasyonu — BİREBİR.
 * Referans: HIGGSFIELD-SPEC.md §1 Kabuk A.
 *
 *  [logo] Keşfet │ Görsel  Video  Ses │ ⊞Supercomputer[Yeni]  MCP&CLI[Yeni]  Sinema Stüdyosu  Eklentiler[Yeni]  Pazarlama Stüdyosu  Shorts[Yeni]
 *                                        sağ: 🔍  🚀Yükselt[%30 İNDİRİM]  📁Varlıklar │ 🔔  (avatar)
 *
 * Yükseklik 48px. Aktif öğe: beyaz metin + aksan alt çizgi. Pasif: #8E8E95.
 */

// renk: .glass-ikon renkli varyantı — çıktı türüne göre gruplanır, böylece renge
// bakınca "bu bir video aracı" denebiliyor. Nötr öğelerde renk yok.
type Oge = { ad: string; href: string; yeni?: boolean; beta?: boolean; ikon?: typeof LayoutGrid; renk?: string };

// Higgsfield'daki sıra ve gruplama birebir
const KESFET: Oge = { ad: "Keşfet", href: "/panel", ikon: Compass };
// Akış — TikTok-tarzı topluluk feed'i (birincil segment, Keşfet'in yanında).
const AKIS: Oge = { ad: "Akış", href: "/panel/akis", ikon: Flame, renk: "glass-ikon-gul" };

// Logo tıklayınca açılan 4 platform kutusu.
// İkonlar generic lucide değil, MARKA İŞARETİNİN kendisi — her platform kendi
// renk varyantını kullanır (public/brand/vayra-mark-*.png, hue kaydırmalı üretim;
// cam parlaklık ve kanat formu korunur). renk = kutu zemini/vurgu tonu.
const LOGO_MENU: { ad: string; href: string; aciklama: string; isaret: string; renk: string }[] = [
  { ad: "Earn", href: "/earn", aciklama: "Kazanç ve büyüme platformu", isaret: "/brand/vayra-mark-yesil.png", renk: "#22c55e" },   // yeşil
  { ad: "Social", href: "/flow", aciklama: "Topluluk akışı ve keşif", isaret: "/brand/vayra-mark-pembe.png", renk: "#ec4899" },     // pembe — bağımsız tam-ekran topluluk (/panel/akis değil)
  { ad: "Geliştirici", href: "/panel/api", aciklama: "API, MCP & CLI, eklentiler", isaret: "/brand/vayra-mark-kirmizi.png", renk: "#ef4444" }, // kırmızı
  { ad: "Kurumsal", href: "/kurumsal", aciklama: "Şirket, kariyer, hukuki", isaret: "/brand/vayra-mark-beyaz.png", renk: "#ffffff" },  // beyaz
];

// Ana nava ÇIKARILAN öne çıkan öğeler (Stüdyolar menüsünden ayrı, doğrudan görünür).
// Akış, Earn, API/MCP/Eklenti, Uygulamalar → logo menüsüne taşındı (ayrı rotalar).
const ONE_CIKAN: Oge[] = [
  { ad: "Viral Presetler", href: "/panel/presetler", ikon: Sparkle, renk: "glass-ikon-lime" },
  // Projeler — ORTAK proje yönetimi (sinema/kitaplık ile aynı useProje havuzu).
  { ad: "Projeler", href: "/panel/projeler", ikon: FolderKanban, renk: "glass-ikon-lime" },
];

const STUDYOLAR: Oge[] = [
  { ad: "Görsel", href: "/panel/gorsel", ikon: ImageIcon, renk: "glass-ikon-cyan" },
  { ad: "Video", href: "/panel/video", ikon: Film, renk: "glass-ikon-mor" },
  { ad: "3D", href: "/panel/3d", ikon: Box, renk: "glass-ikon-lime" },
  { ad: "Müzik", href: "/panel/muzik", ikon: Music, renk: "glass-ikon-gul" },
  { ad: "Ses", href: "/panel/ses", ikon: AudioLines, renk: "glass-ikon-gok" },
];

// Higgsfield üst nav BİREBİR (referans 2026-07-14 09.52.40 doğrulandı — soldan sağa):
// Supercomputer[New] · MCP&CLI[New] · Cinema Studio · Plugins[New] · Marketing Studio ·
// Shorts Studio[New] · Explainer[New] · Originals · Canvas · AI Influencer · Apps.
const URUNLER: Oge[] = [
  { ad: "Supercomputer", href: "/panel/supercomputer", yeni: true, ikon: Cpu, renk: "glass-ikon-kehribar" },
  { ad: "MCP & CLI", href: "/panel/mcp", yeni: true, ikon: Terminal },
  { ad: "Sinema Stüdyosu", href: "/panel/sinema", ikon: Sinema, renk: "glass-ikon-mor" },
  { ad: "Eklentiler", href: "/panel/eklentiler", yeni: true, ikon: Puzzle },
  { ad: "Pazarlama Stüdyosu", href: "/panel/pazarlama", ikon: Megaphone, renk: "glass-ikon-gul" },
  { ad: "Shorts Stüdyosu", href: "/panel/shorts", yeni: true, ikon: Scissors, renk: "glass-ikon-mor" },
  { ad: "Explainer", href: "/panel/explainer", yeni: true, ikon: Presentation, renk: "glass-ikon-yesil" },
  { ad: "Originals", href: "/panel/originals", ikon: Clapperboard, renk: "glass-ikon-mor" },
  { ad: "Viral Presetler", href: "/panel/presetler", ikon: Sparkle, renk: "glass-ikon-lime" },
  { ad: "Canvas", href: "/panel/canvas", ikon: Workflow, renk: "glass-ikon-cyan" },
  { ad: "AI Influencer", href: "/panel/influencer", ikon: UserRound, renk: "glass-ikon-kehribar" },
];

// "Stüdyolar ▾" mega-paneli — 12 ürün anlamlı kategorilere bölünür (nav ferahlar).
type MenuKategori = { baslik: string; ogeler: (Oge & { aciklama?: string })[] };
const STUDYOLAR_MENU: MenuKategori[] = [
  {
    baslik: "Yapay Zekâ Stüdyoları",
    ogeler: [
      { ad: "Supercomputer", href: "/panel/supercomputer", beta: true, ikon: Cpu, renk: "glass-ikon-kehribar", aciklama: "İstemle site, oyun, uygulama üret" },
      { ad: "Sinema Stüdyosu", href: "/panel/sinema", ikon: Sinema, renk: "glass-ikon-mor", aciklama: "Sinematik AI video prodüksiyonu" },
      { ad: "Pazarlama Stüdyosu", href: "/panel/pazarlama", ikon: Megaphone, renk: "glass-ikon-gul", aciklama: "Reklam ve kampanya içerikleri" },
      { ad: "Shorts Stüdyosu", href: "/panel/shorts", yeni: true, ikon: Scissors, renk: "glass-ikon-mor", aciklama: "Dikey kısa video akışı" },
      { ad: "Explainer", href: "/panel/explainer", yeni: true, ikon: Presentation, renk: "glass-ikon-yesil", aciklama: "Anlatım ve eğitim videoları" },
      { ad: "Uzun Video Stüdyosu", href: "/panel/uzun-video", yeni: true, ikon: UzunFilm, renk: "glass-ikon-lime", aciklama: "1 dk–1 saat çok sahneli video" },
      { ad: "Montaj Stüdyosu", href: "/panel/montaj", beta: true, ikon: Combine, renk: "glass-ikon-cyan", aciklama: "AI ile video montaj ve düzenleme" },
    ],
  },
  {
    baslik: "Yaratıcı Araçlar",
    ogeler: [
      { ad: "Originals", href: "/panel/originals", ikon: Clapperboard, renk: "glass-ikon-mor", aciklama: "Vayra orijinal yapımları" },
      { ad: "Elementler", href: "/panel/element", ikon: Sparkle, renk: "glass-ikon-cyan", aciklama: "@mention karakter, mekân, obje, stil" },
      { ad: "Canvas", href: "/panel/canvas", ikon: Workflow, renk: "glass-ikon-cyan", aciklama: "Düğüm tabanlı sonsuz tuval" },
      { ad: "AI Influencer", href: "/panel/influencer", ikon: UserRound, renk: "glass-ikon-kehribar", aciklama: "Tutarlı karakter üretimi" },
    ],
  },
];

/**
 * PAYLAŞIMLI mega-panel yöneticisi (m1).
 *
 * Eskiden her NavStudyoMega kendi lokal `acik` state'ini tutuyordu; ses panelinden
 * video paneline geçince ses'in 1sn kapanma timer'ı henüz dolmadığından İKİ panel
 * birden görünüyordu (üst üste binme). Artık tek bir aktif-anahtar (hangi menü açık)
 * merkezde tutulur:
 *   - Bir menüye girince o menü ANINDA aktif olur, önceki (varsa) aynı anda kapanır.
 *   - Mouse tüm menülerden çıkınca 900ms sonra kapanır (imleç buton↔panel arası
 *     gezerken kaybolmasın). Bu süre içinde başka menüye girilirse anında geçilir.
 * Böylece her an EN FAZLA BİR panel açık kalır ve son girilen kazanır.
 */
type MegaKtx = { aktifAnahtar: string | null; ac: (k: string) => void; gecikmeliKapat: () => void };
const MegaMenuKtx = createContext<MegaKtx | null>(null);

function MegaMenuSaglayici({ children }: { children: React.ReactNode }) {
  const [aktifAnahtar, setAktifAnahtar] = useState<string | null>(null);
  const kapatZamani = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ac = (k: string) => {
    if (kapatZamani.current) { clearTimeout(kapatZamani.current); kapatZamani.current = null; }
    setAktifAnahtar(k); // son girilen kazanır → önceki anında kapanır
  };
  const gecikmeliKapat = () => {
    if (kapatZamani.current) clearTimeout(kapatZamani.current);
    // 260ms — imleç buton↔panel arası köprüden geçerken kapanmaz ama fazla asılı kalmaz.
    kapatZamani.current = setTimeout(() => setAktifAnahtar(null), 260);
  };
  useEffect(() => () => { if (kapatZamani.current) clearTimeout(kapatZamani.current); }, []);
  return <MegaMenuKtx.Provider value={{ aktifAnahtar, ac, gecikmeliKapat }}>{children}</MegaMenuKtx.Provider>;
}

function useMegaMenu(anahtar: string) {
  const ktx = useContext(MegaMenuKtx);
  if (!ktx) return { acik: false, ac: () => {}, gecikmeliKapat: () => {}, kapat: () => {} };
  return {
    acik: ktx.aktifAnahtar === anahtar,
    ac: () => ktx.ac(anahtar),
    gecikmeliKapat: ktx.gecikmeliKapat,
    kapat: () => ktx.ac(""), // "" hiçbir menüyle eşleşmez → tümü kapanır
  };
}

/**
 * "Yeni" işareti — rozet değil, tek nokta.
 *
 * Kutulu etiket her sekmenin yanında ikinci bir öğe gibi duruyor ve navın
 * ritmini bozuyordu. Aksan renkli küçük bir nokta aynı bilgiyi taşır, hiç yer
 * kaplamaz. Erişilebilirlik için görünmez metin bırakıldı.
 */
function YeniRozet({ aktif }: { aktif?: boolean }) {
  return (
    <span className={cn(
      "ml-0.5 h-[5px] w-[5px] shrink-0 rounded-full bg-aksan transition-opacity",
      aktif ? "opacity-100" : "opacity-70",
    )}>
      <span className="sr-only">Yeni</span>
    </span>
  );
}

// Eklentiler (Plugins) hover mega-paneli — Higgsfield BİREBİR (677 referanstan doğrulandı:
// nav hover paneli SADECE Plugins'te var, Image/Video/Audio'da YOK). Marka logosu + ad + açıklama.
type EklentiMega = { ad: string; aciklama: string; slug: string; rozet: string; rozetRenk: string };
const EKLENTI_MEGA: EklentiMega[] = [
  { ad: "Adobe Photoshop", aciklama: "Photoshop içinde AI görsel araçları", slug: "photoshop", rozet: "Ps", rozetRenk: "bg-[#31a8ff]/20 text-[#31a8ff]" },
  { ad: "Adobe Premiere Pro", aciklama: "Premiere Pro içinde AI video araçları", slug: "premiere-pro", rozet: "Pr", rozetRenk: "bg-[#9999ff]/20 text-[#c9c9ff]" },
  { ad: "Adobe After Effects", aciklama: "After Effects içinde AI video araçları", slug: "after-effects", rozet: "Ae", rozetRenk: "bg-[#9999ff]/20 text-[#d3a3ff]" },
  { ad: "DaVinci Resolve", aciklama: "DaVinci Resolve içinde AI video araçları", slug: "davinci", rozet: "◉", rozetRenk: "bg-white/10 text-white/80" },
  { ad: "Figma", aciklama: "Figma içinde AI görsel & video araçları", slug: "figma", rozet: "F", rozetRenk: "bg-[#a259ff]/20 text-[#f24e1e]" },
  { ad: "Minecraft", aciklama: "Minecraft içinde AI üretim araçları", slug: "minecraft", rozet: "▦", rozetRenk: "bg-emerald-600/25 text-emerald-300" },
];

// Görsel/Video/Ses hover MEGA-PANELİ — Higgsfield BİREBİR (1234 klasörü referansı):
// 2 sütun: SOL "Özellikler" (Features) + SAĞ "Modeller" (Models). Her öğe ikon+başlık+açıklama.
type MegaSatir = { ad: string; aciklama: string; ikon: typeof ImageIcon; href?: string; top?: boolean; renk?: string };
type StudyoMegaVeri = { ozellikler: MegaSatir[]; modeller: MegaSatir[] };
/* KALDIRILDI (2026-07-31, kullanıcı kararı): Görsel / Video / Ses üzerine
   gelince açılan hover mega-paneli "gereksiz" bulundu. Harita BOŞ bırakıldı —
   NavStudyoMega veri bulamayınca sade <NavOge/> basar, yani nav öğeleri
   normal bağlantı gibi davranır (tıklama davranışı değişmedi).

   Geri istenirse: eski panel tanımları git geçmişinde bu dosyada duruyor;
   ilgili href anahtarını ({ ozellikler: [...], modeller: [...] }) buraya
   eklemek yeterli. */
const STUDYO_MEGA: Record<string, StudyoMegaVeri> = {};

function NavStudyoMega({ oge, aktif }: { oge: Oge; aktif: boolean }) {
  const { acik, ac, gecikmeliKapat, kapat } = useMegaMenu(`studyo:${oge.href}`);
  const veri = STUDYO_MEGA[oge.href];
  if (!veri) return <NavOge oge={oge} aktif={aktif} />;
  const setAcik = (v: boolean) => { if (!v) kapat(); };
  const Satir = (m: MegaSatir, i: number) => {
    const govde = (
      <>
        <span className={cn("glass-ikon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", m.renk ?? "text-metin-2 group-hover/row:text-aksan")}><m.ikon className="h-[18px] w-[18px]" /></span>
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13.5px] font-medium text-metin">{m.ad}</span>
            {m.top && <span className="rounded bg-rose-500 px-1 py-px text-[8px] font-bold text-white">TOP</span>}
          </span>
          <span className="block truncate text-[12px] text-metin-3">{m.aciklama}</span>
        </span>
      </>
    );
    const sinif = "group/row flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/6";
    return m.href
      ? <Link key={i} href={m.href} onClick={() => setAcik(false)} className={sinif}>{govde}</Link>
      : <div key={i} className={cn(sinif, "cursor-default")}>{govde}</div>;
  };
  // m1: paylaşımlı yönetici — girince önceki panel anında kapanır, mouse tüm
  // menülerden çıkınca 900ms sonra kapanır. Üst üste binme imkânsız.
  return (
    <div className="relative" onMouseEnter={ac} onMouseLeave={gecikmeliKapat}>
      <NavOge oge={oge} aktif={aktif} />
      <AnimatePresence>
        {acik && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.14 }}
            onMouseEnter={ac} onMouseLeave={gecikmeliKapat}
            className="fixed left-0 right-0 top-14 z-50 flex justify-start px-4 pt-1"
          >
            {/* Görünmez hover köprüsü — buton↔panel arası boşlukta menü kapanmasın */}
            <span className="absolute inset-x-0 -top-2 h-3" aria-hidden />
            <div className="menu-surface max-h-[80vh] w-full max-w-4xl overflow-y-auto rounded-2xl p-4 shadow-2xl">
              <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                <div>
                  <p className="mb-1 px-2.5 text-[11px] font-medium uppercase tracking-wide text-metin-3">Özellikler</p>
                  {veri.ozellikler.map(Satir)}
                </div>
                <div>
                  <p className="mb-1 px-2.5 text-[11px] font-medium uppercase tracking-wide text-metin-3">Modeller</p>
                  {veri.modeller.map(Satir)}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavEklentiOge({ oge, aktif }: { oge: Oge; aktif: boolean }) {
  // m1: paylaşımlı mega-panel yöneticisi (diğerleriyle aynı — üst üste binmez).
  const { acik, ac, gecikmeliKapat, kapat } = useMegaMenu(`eklenti:${oge.href}`);
  const setAcik = (v: boolean) => { if (!v) kapat(); };
  return (
    <div className="relative" onMouseEnter={ac} onMouseLeave={gecikmeliKapat}>
      <NavOge oge={oge} aktif={aktif} sade />
      <AnimatePresence>
        {acik && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 top-full z-50 w-80 pt-1"
          >
            <div className="menu-surface overflow-hidden rounded-2xl p-1.5">
              <p className="px-2.5 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-wide text-metin-3">Eklentiler</p>
              {EKLENTI_MEGA.map((m) => (
                <Link key={m.slug} href={`/panel/eklentiler/${m.slug}`} onClick={() => setAcik(false)}
                  className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/6">
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[15px] font-bold", m.rozetRenk)}>{m.rozet}</span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-medium text-metin">{m.ad}</span>
                    <span className="block truncate text-[12px] text-metin-3">{m.aciklama}</span>
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// "Stüdyolar ▾" — 12 ürünü kategorili mega-panelde toplayan tek nav düğmesi.
function NavStudyolarMenu({ path }: { path: string }) {
  // m1: paylaşımlı mega-panel yöneticisi — Görsel/Video/Ses panelleriyle çakışmaz.
  const { acik, ac, gecikmeliKapat, kapat } = useMegaMenu("studyolar-menu");
  const setAcik = (v: boolean) => { if (!v) kapat(); };
  const herhangiAktif = STUDYOLAR_MENU.some((k) =>
    k.ogeler.some((o) => path === o.href || path.startsWith(o.href + "/")),
  );
  return (
    <div className="relative shrink-0" onMouseEnter={ac} onMouseLeave={gecikmeliKapat}>
      <button
        className={cn(
          "relative flex h-9 items-center gap-1.5 whitespace-nowrap px-2.5 pb-1 text-[13.5px] transition-colors duration-200",
          herhangiAktif || acik ? "font-medium text-white" : "font-normal text-[#a0a0a6] hover:text-[#e8e8ea]",
        )}
      >
        Stüdyolar
        <ChevronDown className={cn("h-3 w-3 opacity-50 transition-transform duration-200", acik && "rotate-180")} strokeWidth={2.2} />
        {herhangiAktif && (
          <span className="absolute inset-x-2.5 bottom-0 h-[2px] rounded-full bg-aksan" />
        )}
      </button>
      <AnimatePresence>
        {acik && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.14 }}
            /* fixed — parent'ın overflow-hidden'ı paneli kırpmasın (nav yatay-scroll kapsayıcısı içinde) */
            className="fixed left-1/2 top-[52px] z-50 -translate-x-1/2 pt-2"
          >
            <div className="menu-surface w-[560px] max-w-[92vw] overflow-hidden rounded-2xl p-3 shadow-2xl">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {STUDYOLAR_MENU.map((kat) => (
                  <div key={kat.baslik} className={kat.baslik === "Geliştirici & Pazar" ? "col-span-2 mt-1 border-t border-white/[0.06] pt-2" : ""}>
                    <p className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-metin-3">{kat.baslik}</p>
                    <div className={kat.baslik === "Geliştirici & Pazar" ? "grid grid-cols-2 gap-x-3" : ""}>
                      {kat.ogeler.map((o) => {
                        const Ikon = o.ikon!;
                        const oAktif = path === o.href || path.startsWith(o.href + "/");
                        return (
                          <Link key={o.href} href={o.href} onClick={() => setAcik(false)}
                            className={cn("group/row flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/[0.06]", oAktif && "bg-white/[0.05]")}>
                            <span className={cn("glass-ikon flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]", o.renk ?? "text-metin-2")}>
                              <Ikon className="h-[18px] w-[18px]" strokeWidth={2} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5">
                                <span className={cn("truncate text-[13.5px] font-medium", oAktif ? "text-aksan" : "text-metin")}>{o.ad}</span>
                                {o.yeni && <span className="rounded-[4px] bg-white/[0.08] px-1 py-px text-[9px] font-semibold text-metin-2">Yeni</span>}
                                {o.beta && <span className="rounded-[4px] bg-amber-400/15 px-1 py-px text-[9px] font-bold text-amber-300 ring-1 ring-inset ring-amber-400/25">BETA</span>}
                              </span>
                              {o.aciklama && <span className="block truncate text-[12px] text-metin-3">{o.aciklama}</span>}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Nav öğesi — SAKİN tipografik sekme.
 *
 * Eskiden aktif öğe dolu cyan hap içindeydi: sayfanın en yüksek kontrastlı
 * öğesi navigasyon oluyordu, yani araç kendi kendini işaret ediyordu. Artık
 * aktiflik metin ağırlığı + saç teli inceliğinde bir alt çizgiyle söylenir;
 * dikkat içeriğe kalır.
 *
 * İkonlar da kaldırıldı — 8 glif yan yana kalabalıktı ve etiketin söylediğinden
 * fazlasını söylemiyordu. Tür rengi mega-panelde zaten var.
 */
function NavOge({ oge, aktif, sade }: { oge: Oge; aktif: boolean; sade?: boolean }) {
  return (
    <Link
      href={oge.href}
      className={cn(
        /* h-9 + pb-1: alt çizginin oturacağı şeridi metnin altında AÇIYOR.
           Nav kapsayıcısı overflow-hidden olduğu için çizgi dışarı taşamaz —
           bu yüzden boşluk sekmenin kendi içinde ayrılır. */
        "group/nav relative flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 pb-1 text-[13.5px] transition-colors duration-200",
        aktif
          ? "font-medium text-white"
          : sade
            ? "font-normal text-[#7c7c82] hover:text-[#e8e8ea]"
            : "font-normal text-[#a0a0a6] hover:text-[#e8e8ea]",
      )}
    >
      <span>{oge.ad}</span>
      {oge.yeni && <YeniRozet aktif={aktif} />}
      {/* Hover izi — imleç sekmenin üstündeyken çizginin nereye oturacağını
          önceden gösterir. Sessiz beyaz; aktif çizgiyle yarışmaz. */}
      {!aktif && (
        <span className="pointer-events-none absolute inset-x-2.5 bottom-0 h-[2px] rounded-full bg-white/25 opacity-0 transition-opacity duration-200 group-hover/nav:opacity-100" />
      )}
      {/* Aktif işaret — hap değil, saç teli alt çizgi. Paylaşımlı layout
          animasyonuyla sekmeler arası kayar. */}
      {aktif && (
        <motion.span
          layoutId="ustNavPill"
          className="absolute inset-x-2.5 bottom-0 h-[2px] rounded-full bg-aksan"
          transition={{ type: "spring", stiffness: 480, damping: 40 }}
        />
      )}
    </Link>
  );
}

/* Hesap menüsü ikonları — Higgsfield birebir (lucide'de karşılığı yok). */

/** Kredi jetonu: üst üste binmiş iki halka. */
function KrediIkon({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="9" cy="12" r="6" />
      <circle cx="15" cy="12" r="6" />
    </svg>
  );
}

/** Discord amblemi. */
function DiscordIkon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.27 5.33A16.6 16.6 0 0 0 15.2 4l-.25.46a12.3 12.3 0 0 1 3.6 1.85 15.6 15.6 0 0 0-12.9-.36c.2-.1.4-.2.62-.3l.28-.12A12.4 12.4 0 0 1 9.05 4.5L8.8 4a16.6 16.6 0 0 0-4.07 1.33C2.2 9.06 1.5 12.7 1.85 16.28a16.7 16.7 0 0 0 5.05 2.55l.9-1.24a10.9 10.9 0 0 1-1.72-.83l.42-.32a11.9 11.9 0 0 0 10.8 0l.42.32c-.54.32-1.12.6-1.72.83l.9 1.24a16.7 16.7 0 0 0 5.06-2.55c.4-4.15-.68-7.76-2.7-10.95ZM8.52 14.1c-.98 0-1.79-.9-1.79-2s.79-2 1.79-2 1.8.9 1.79 2c0 1.1-.79 2-1.79 2Zm6.96 0c-.98 0-1.79-.9-1.79-2s.79-2 1.79-2 1.8.9 1.79 2c0 1.1-.79 2-1.79 2Z" />
    </svg>
  );
}

/** Higgsfield bildirim listesindeki sağ üst yaş etiketi: "3s" · "4sa" · "10g". */
function kisaYas(t: number) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return `${Math.max(1, s)}sn`;
  if (s < 3600) return `${Math.floor(s / 60)}dk`;
  if (s < 86400) return `${Math.floor(s / 3600)}sa`;
  return `${Math.floor(s / 86400)}g`;
}

const AY_ADLARI = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

/** Bildirimleri güne göre gruplar — Higgsfield "Yesterday / July 12" başlıkları. */
function gunGrupla<T extends { zaman: number }>(liste: T[]): { etiket: string; oge: T[] }[] {
  const gunBasi = (ms: number) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const bugun = gunBasi(Date.now());
  const gun = 86_400_000;
  const gruplar = new Map<number, T[]>();
  for (const o of liste) {
    const g = gunBasi(o.zaman);
    if (!gruplar.has(g)) gruplar.set(g, []);
    gruplar.get(g)!.push(o);
  }
  return Array.from(gruplar.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([g, oge]) => {
      const d = new Date(g);
      const etiket = g === bugun ? "Bugün"
        : g === bugun - gun ? "Dün"
        : `${d.getDate()} ${AY_ADLARI[d.getMonth()]}`;
      return { etiket, oge };
    });
}

export function UstNav() {
  const path = usePathname();
  const router = useRouter();
  const { kullanici, cikisYap, girisYapildi } = useAuth();
  // M10: avatar halkasının doluluk oranı + rengi (kalan kredi / plan kotası + ek paket)
  const kredi = useMemo(() => krediDurum(kullanici), [kullanici]);
  const acKapi = useAuthKapi((s) => s.ac);
  const { bildirimler, okunduIsaretle, tumunuOku } = useBildirim();
  const [arama, setArama] = useState(false);
  const [zil, setZil] = useState(false);
  const [profil, setProfil] = useState(false);
  const [logoMenu, setLogoMenu] = useState(false);
  const okunmamis = bildirimler.filter((b) => !b.okundu).length;
  // Zil panelinde Tümü / Okunmamış filtresi (M9).
  const [zilFiltre, setZilFiltre] = useState<"tumu" | "okunmamis">("tumu");
  const zilListe = useMemo(
    () => (zilFiltre === "okunmamis" ? bildirimler.filter((b) => !b.okundu) : bildirimler),
    [bildirimler, zilFiltre],
  );

  // Nav yatay taşma tespiti (M23): sağ kenar fade YALNIZCA içerik taşınca +
  // scroll sonuna gelinmemişse görünür. Aksi halde fade opak siyah bir "katman"
  // gibi Para Kazan öğesinin üstüne biniyordu (arka plan yarı saydam olduğundan
  // renk uyuşmuyordu). Böylece fade doğal ve sadece gerektiğinde çıkar.
  const navKaydirRef = useRef<HTMLDivElement>(null);
  const [fadeGoster, setFadeGoster] = useState(false);
  useEffect(() => {
    const el = navKaydirRef.current;
    if (!el) return;
    const kontrol = () => setFadeGoster(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
    kontrol();
    el.addEventListener("scroll", kontrol, { passive: true });
    const ro = new ResizeObserver(kontrol);
    ro.observe(el);
    window.addEventListener("resize", kontrol);
    return () => { el.removeEventListener("scroll", kontrol); ro.disconnect(); window.removeEventListener("resize", kontrol); };
  }, []);

  // Aktiflik: "/panel" (Keşfet) TAM eşleşme ister — aksi halde her /panel/* alt
  // sayfasında Keşfet yanıyordu. Diğer öğeler önek eşleşmesi kullanır.
  const aktif = (h: string) => (h === "/panel" ? path === "/panel" : path === h || path.startsWith(h + "/"));

  useEffect(() => {
    const kisayol = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setArama((v) => !v);
      }
    };
    document.addEventListener("keydown", kisayol);
    return () => document.removeEventListener("keydown", kisayol);
  }, []);

  // Yükseklik 56px — 48px sıkışıktı; sekmelerin altında alt-çizginin oturacağı
  // ve gözün dinleneceği boşluk gerekiyor. Ayrım çizgisi de inceltildi.
  return (
    <header className="sticky top-0 z-40 hidden h-14 border-b border-white/[0.05] bg-[#0b0b0c]/75 backdrop-blur-xl backdrop-saturate-150 sm:block">
      <div className="flex h-14 items-center px-4">
        {/* Logo — tıklayınca 4 platform kutusu açılır (earn/social/geliştirici/kurumsal). */}
        <div className="relative mr-2 shrink-0">
          <button onClick={() => { setLogoMenu((v) => !v); setZil(false); setProfil(false); }} aria-label="Vayra platformları"
            className="flex items-center rounded-lg transition-opacity hover:opacity-80">
            <VayraIsaret size={40} />
          </button>
          <AnimatePresence>
            {logoMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLogoMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.14 }}
                  className="menu-surface absolute left-0 top-10 z-50 w-72 overflow-hidden rounded-2xl p-1.5">
                  <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-metin-3">Vayra Platformları</p>
                  {LOGO_MENU.map((m) => (
                    /* Satırın TAMAMI platformun rengini taşır: hover'da renkli zemin +
                       renkli çerçeve + solda renk şeridi, başlık ve ok da o renge geçer.
                       Renk CSS değişkeniyle bir kez verilir (--lm) ki tek kaynaktan aksın. */
                    <Link key={m.href} href={m.href} onClick={() => setLogoMenu(false)}
                      style={{ ["--lm" as string]: m.renk }}
                      className="lm-satir group/lm relative flex items-center gap-3 overflow-hidden rounded-xl px-2.5 py-2.5
                                 transition-all duration-150">
                      {/* sol renk şeridi — hover'da açılır */}
                      <span aria-hidden
                        className="absolute inset-y-1.5 left-0 w-[3px] origin-center scale-y-0 rounded-full
                                   opacity-0 transition-all duration-150 group-hover/lm:scale-y-100 group-hover/lm:opacity-100"
                        style={{ background: "var(--lm)", boxShadow: "0 0 10px var(--lm)" }} />
                      <span className="flex h-9 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px] transition-colors duration-150"
                        style={{ background: "color-mix(in srgb, var(--lm) 16%, transparent)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.isaret} alt="" aria-hidden width={40} height={13} draggable={false}
                          className="w-10 object-contain transition-transform duration-150 group-hover/lm:scale-110" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-semibold text-metin transition-colors duration-150 group-hover/lm:text-[var(--lm)]">{m.ad}</span>
                        <span className="block truncate text-[12px] text-metin-3">{m.aciklama}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-metin-3 transition-all duration-150 group-hover/lm:translate-x-0.5 group-hover/lm:text-[var(--lm)]" />
                    </Link>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* PILL-NAV — iki segment grubu, yatay kaydırılabilir. Aktif sekme lime dolu pill.
            Grup 1 (birincil): Keşfet + üretim stüdyoları — belirgin segment kapsülü.
            Grup 2 (ürünler): daha soluk ikincil segment; aralarında yumuşak ayraç. */}
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <MegaMenuSaglayici>
          <LayoutGroup id="ustnav">
          {/* Gruplama artık kutuyla değil BOŞLUKLA yapılıyor: birincil sekmeler
              dar aralıklı, ikincil küme daha geniş boşlukla ayrılır. Kapsül +
              dikey ayraç birlikte iki ayrı gruplama sinyaliydi, ikisi de kalktı. */}
          <nav ref={navKaydirRef} className="gizli-scroll flex min-w-0 items-center overflow-x-auto py-0.5 pr-2">
            <div className="flex shrink-0 items-center gap-0.5">
              <NavOge oge={KESFET} aktif={aktif(KESFET.href)} />
              {STUDYOLAR.map((o) => (
                <NavStudyoMega key={o.href} oge={o} aktif={aktif(o.href)} />
              ))}
            </div>
            {/* Birincil ↔ ikincil küme arası nefes — çizgi yerine boşluk. */}
            <span className="w-7 shrink-0" aria-hidden />
            {ONE_CIKAN.map((o) => (
              <NavOge key={o.href} oge={o} aktif={aktif(o.href)} />
            ))}
            {/* Kalan ürünler → tek "Stüdyolar ▾" mega-panel — en sağda.
                Akış/Earn/API/MCP/Eklenti/Uygulamalar logo menüsüne taşındı. */}
            <NavStudyolarMenu path={path} />
            <span className="w-2 shrink-0" aria-hidden />
          </nav>
          </LayoutGroup>
          </MegaMenuSaglayici>
          {/* Sağ kenar fade — YALNIZCA içerik taşıp scroll sonuna gelinmemişken.
              Böylece Para Kazan öğesinin üstüne binen sahte "katman" görünümü gitti. */}
          <span className={cn("pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-zemin/90 to-transparent transition-opacity duration-200",
            fadeGoster ? "opacity-100" : "opacity-0")} aria-hidden />
        </div>

        {/* Sağ küme */}
        <div className="ml-2 flex shrink-0 items-center gap-0.5">
          <Tooltip label="Ara (⌘K)">
            <button
              onClick={() => setArama(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8e8e95] transition-colors hover:bg-white/8 hover:text-white"
              aria-label="Ara"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
          </Tooltip>

          {/* Yükselt — sade metin bağlantısı.
              Fuşya "%30 İNDİRİM" rozeti kaldırıldı: indirim etiketi bir üretim
              aracının navigasyonunda ucuz duruyordu ve navın en parlak öğesiydi.
              İndirim zaten kredi sayfasında, ait olduğu yerde duruyor. */}
          <button
            onClick={() => router.push("/panel/kredi?sekme=plan")}
            className="mx-1 hidden items-center px-2 text-[13.5px] text-[#a0a0a6] transition-colors hover:text-white sm:flex"
          >
            Yükselt
          </button>

          {/* Varlıklar — yalnızca girişli kullanıcıda (misafirde gizli) */}
          {girisYapildi && (
            <Tooltip label="Kitaplığım">
              <Link
                href="/panel/kitaplik"
                className="mx-1 hidden items-center px-2 text-[13.5px] text-[#a0a0a6] transition-colors hover:text-white md:flex"
              >
                Varlıklar
              </Link>
            </Tooltip>
          )}

          {girisYapildi && <span className="mx-1.5 hidden h-3.5 w-px bg-white/[0.09] md:block" />}

          {/* Bildirimler — yalnızca girişli kullanıcıda */}
          {girisYapildi && (
          <div className="relative">
            <Tooltip label="Bildirimler">
              <button
                onClick={() => { setZil((v) => !v); setProfil(false); }}
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[#8e8e95] transition-colors hover:bg-white/8 hover:text-white"
                aria-label="Bildirimler"
              >
                <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
                {okunmamis > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-aksan px-1 text-[9px] font-bold text-zemin">
                    {okunmamis}
                  </span>
                )}
              </button>
            </Tooltip>
            <AnimatePresence>
              {zil && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setZil(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.14 }}
                    className="sinema-kapsam menu-surface absolute right-0 top-10 z-50 w-[390px] rounded-[16px] p-3"
                  >
                    <div className="flex items-center justify-between px-1 pb-3">
                      <span className="text-[19px] font-bold text-white">Bildirimler</span>
                      <div className="flex items-center gap-1.5">
                        {okunmamis > 0 && (
                          <button onClick={tumunuOku} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] text-aksan transition-opacity hover:opacity-75">
                            <Check className="h-3.5 w-3.5" /> Tümünü oku
                          </button>
                        )}
                        <button onClick={() => setZil(false)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/8 text-metin-2 transition-colors hover:bg-white/12 hover:text-white" aria-label="Kapat">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Ödül hero kartı — Higgsfield birebir: koyu yeşil zemin,
                        sağda lime hediye kartı, beyaz CTA. */}
                    <div className="relative mb-3 overflow-hidden rounded-[14px] p-4"
                      style={{ background: "linear-gradient(120deg, #1d3a24 0%, #16301d 55%, #12261a 100%)" }}>
                      <div className="relative z-10 max-w-[58%]">
                        <p className="text-[17px] font-bold leading-snug text-white">Ödüllerin yakında açılıyor</p>
                        <p className="mt-2 text-[13px] leading-relaxed text-white/65">Görevleri tamamla, bonusları topla ve sınırsız Nano Banana&apos;nın kilidini aç.</p>
                        <button onClick={() => { setZil(false); router.push("/panel/kredi"); }}
                          className="mt-3.5 rounded-[12px] bg-white px-4 py-2.5 text-[14px] font-semibold text-zemin transition-transform hover:scale-[1.03]">
                          Ödülleri gör
                        </button>
                      </div>
                      {/* Hediye kartı — arkada ikinci kart, önde lime kart + kurdele */}
                      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                        {/* arkada kalan ikinci kart — referansta hafifçe sağa taşar */}
                        <span className="absolute -right-2.5 top-1/2 h-[100px] w-[78px] -translate-y-1/2 rounded-[12px]"
                          style={{ background: "#5f8a3a" }} />
                        <span className="relative flex h-[112px] w-[84px] items-center justify-center rounded-[12px] shadow-lg"
                          style={{ background: "linear-gradient(180deg, #d9f95b 0%, #8fe08a 100%)" }}>
                          {/* üstteki asma deliği */}
                          <span className="absolute left-1/2 top-2.5 h-1 w-6 -translate-x-1/2 rounded-full bg-black/45" />
                          <Gift className="mt-2 h-9 w-9 text-emerald-950/85" strokeWidth={1.8} />
                        </span>
                      </div>
                    </div>

                    {/* Filtre: Tümü / Okunmamış — okunmamışlar sayaçlı çip. */}
                    <div className="mb-1 flex items-center gap-1.5 px-1">
                      {([
                        { id: "tumu" as const, ad: "Tümü", say: bildirimler.length },
                        { id: "okunmamis" as const, ad: "Okunmamış", say: okunmamis },
                      ]).map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setZilFiltre(f.id)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                            zilFiltre === f.id
                              ? "bg-aksan text-zemin"
                              : "bg-white/[0.06] text-metin-2 hover:bg-white/10 hover:text-white",
                          )}
                        >
                          {f.ad}
                          <span className={cn(
                            "rounded-full px-1.5 text-[11px] font-bold",
                            zilFiltre === f.id ? "bg-black/20 text-zemin" : "bg-white/10 text-metin-3",
                          )}>{f.say}</span>
                        </button>
                      ))}
                    </div>

                    {/* Tarih gruplu liste — Higgsfield "Yesterday / July 12" birebir */}
                    <div className="max-h-[340px] overflow-y-auto">
                      {zilListe.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 px-2 py-10 text-center">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] text-metin-3">
                            <Bell className="h-5 w-5" />
                          </span>
                          <p className="text-[14px] font-medium text-metin-2">
                            {zilFiltre === "okunmamis" ? "Okunmamış bildirim yok" : "Henüz bildirim yok"}
                          </p>
                          <p className="max-w-[240px] text-[12.5px] leading-snug text-metin-3">
                            {zilFiltre === "okunmamis"
                              ? "Hepsini okudun. Yeni bir üretim bittiğinde burada görünecek."
                              : "Bir üretim başlat — tamamlandığında buraya bildirim düşer."}
                          </p>
                        </div>
                      ) : (
                        gunGrupla(zilListe).map((grup) => (
                          <div key={grup.etiket}>
                            <p className="px-1 pb-1.5 pt-2.5 text-[13px] text-metin-3">{grup.etiket}</p>
                            {grup.oge.map((b) => (
                              <button
                                key={b.id}
                                onClick={() => { okunduIsaretle(b.id); if (b.link) { setZil(false); router.push(b.link); } }}
                                className="flex w-full gap-3 rounded-[12px] p-2 text-left transition-colors hover:bg-white/[0.045]"
                              >
                                {/* yuvarlak ikon rozeti */}
                                <span className={cn(
                                  "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                                  b.tur === "basari" ? "bg-emerald-500/18 text-emerald-300"
                                    : b.tur === "uyari" ? "bg-amber-500/18 text-amber-300"
                                    : b.tur === "hata" ? "bg-rose-500/18 text-rose-300"
                                    : "bg-white/8 text-metin-2",
                                )}>
                                  {b.tur === "basari" ? <Sparkles className="h-5 w-5" />
                                    : b.tur === "uyari" ? <Gift className="h-5 w-5" />
                                    : b.tur === "hata" ? <AlertTriangle className="h-5 w-5" />
                                    : <Bell className="h-5 w-5" />}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-start gap-2">
                                    <span className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-white">
                                      {b.baslik}
                                    </span>
                                    {/* sağda yaş — Higgsfield'de "1d" / "10d" */}
                                    <span className="shrink-0 pt-0.5 text-[13px] text-metin-3">{kisaYas(b.zaman)}</span>
                                  </span>
                                  <span className="mt-0.5 block text-[13.5px] leading-snug text-metin-2">{b.mesaj}</span>
                                  {b.link && (
                                    <span className="mt-2.5 inline-block rounded-[10px] bg-aksan px-3.5 py-2 text-[14px] font-bold text-zemin">
                                      Görüntüle
                                    </span>
                                  )}
                                </span>
                                {/* okunmamış işareti */}
                                {!b.okundu && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-aksan" />}
                              </button>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          )}

          {/* MİSAFİR: Giriş yap + Kaydol.
              Tek dolu buton yerine iki sakin öğe: giriş sade metin, kaydol ince
              çerçeveli. Dolu cyan buton navda ikinci bir parlak noktaydı (aktif
              sekme hapıyla birlikte); ölçülü çerçeve aynı işi bağırmadan yapıyor. */}
          {!girisYapildi && (
            <div className="ml-1.5 flex items-center gap-1">
              <button
                onClick={() => acKapi({ baslik: "Tekrar hoş geldin", altBaslik: "Kaldığın yerden devam et" })}
                className="px-2.5 py-1.5 text-[13.5px] text-[#a0a0a6] transition-colors hover:text-white"
              >
                Giriş yap
              </button>
              <button
                onClick={() => acKapi({ baslik: "Vayra'ya hoş geldin", altBaslik: "Ücretsiz kaydol ve üretmeye başla" })}
                className="rounded-lg border border-white/[0.14] px-3.5 py-1.5 text-[13.5px] font-medium text-white transition-colors hover:border-white/25 hover:bg-white/[0.06]"
              >
                Kaydol
              </button>
            </div>
          )}

          {/* Avatar — aksan halkalı (Higgsfield imzası) — yalnızca girişli */}
          {girisYapildi && (
          <div className="relative ml-1">
            {/* Higgsfield avatarı: koyu halka + içinde LİME dolu daire (harf yok). */}
            {/* M10: halka = KREDİ DOLULUK göstergesi. Dolu yay kalan kredi oranı
                kadar çizilir, rengi eşiğe göre değişir (>%80 yeşil · >%50 sarı ·
                >%30 turuncu · altı kırmızı). conic-gradient + iç maske ile ince halka. */}
            <button
              onClick={() => { setProfil((v) => !v); setZil(false); }}
              className="relative flex h-[28px] w-[28px] items-center justify-center rounded-full transition-transform hover:scale-105"
              aria-label={`Hesabım — ${kredi.etiket}: ${kredi.kalan.toLocaleString("tr-TR")} / ${kredi.toplam.toLocaleString("tr-TR")} kredi`}
              title={`${kredi.etiket} · ${kredi.kalan.toLocaleString("tr-TR")} / ${kredi.toplam.toLocaleString("tr-TR")} kredi (%${Math.round(kredi.oran * 100)})`}
            >
              {/* boş yay (zemin) */}
              <span className="absolute inset-0 rounded-full ring-[2px] ring-white/12" />
              {/* dolu yay — kredi oranı kadar */}
              <span className="absolute inset-0 rounded-full transition-[background] duration-500"
                style={{
                  background: `conic-gradient(from -90deg, ${kredi.renk} 0turn ${kredi.oran}turn, transparent ${kredi.oran}turn 1turn)`,
                  WebkitMask: "radial-gradient(circle, transparent 0 11px, #000 11.6px)",
                  mask: "radial-gradient(circle, transparent 0 11px, #000 11.6px)",
                }} />
              <span className="h-[19px] w-[19px] rounded-full" style={{ background: "var(--sn-lime, #55d6fd)" }} />
            </button>
            <AnimatePresence>
              {profil && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfil(false)} />
                  {/* Higgsfield hesap menüsü BİREBİR (referans 2026-07-22).
                      Kritik: bu menü LİME aksanlıdır — panelin cyan aksanı burada
                      geçmez. .sinema-kapsam ile --color-aksan lime'a çevrilir,
                      böylece bg-aksan/text-aksan sınıfları otomatik lime olur. */}
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.14 }}
                    className="sinema-kapsam menu-surface absolute right-0 top-10 z-50 w-[300px] rounded-[16px] p-2"
                  >
                    {/* avatar + isim + plan */}
                    <div className="flex items-center gap-3 px-2 py-2.5">
                      {/* m51: navdaki avatarla AYNI kredi halkası — dolu yay kalan
                          kredi oranı kadar, rengi eşiğe göre (nav ile birebir tutarlı). */}
                      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
                        <span className="absolute inset-0 rounded-full ring-[2.5px] ring-white/12" />
                        <span className="absolute inset-0 rounded-full transition-[background] duration-500"
                          style={{
                            background: `conic-gradient(from -90deg, ${kredi.renk} 0turn ${kredi.oran}turn, transparent ${kredi.oran}turn 1turn)`,
                            WebkitMask: "radial-gradient(circle, transparent 0 17px, #000 17.6px)",
                            mask: "radial-gradient(circle, transparent 0 17px, #000 17.6px)",
                          }} />
                        <span className="h-[30px] w-[30px] rounded-full" style={{ background: "var(--sn-lime)" }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold text-white">{kullanici?.ad}</span>
                        <span className="block text-[13px] capitalize text-metin-3">{kullanici?.plan} Plan</span>
                      </span>
                    </div>

                    {/* Kredi kutusu — Higgsfield'de kendi yüzeyi olan kart */}
                    <div className="mt-1 rounded-[12px] bg-white/[0.035] px-3 py-2.5">
                      <Link
                        href="/panel/kredi"
                        onClick={() => setProfil(false)}
                        className="flex items-center justify-between text-[15px] transition-colors hover:text-aksan"
                      >
                        <span className="font-medium text-white">Kredi</span>
                        {/* m51: "kalan" rengi kalan krediye göre (eşik renkleriyle aynı) */}
                        <span className="flex items-center gap-1.5 text-metin-3">
                          <span className="font-semibold" style={{ color: kredi.renk }}>
                            {new Intl.NumberFormat("tr-TR").format(kullanici?.krediler ?? 0)}
                          </span>
                          <span>kalan</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                      {/* doluluk barı — kredi oranı kadar, eşik renginde */}
                      <div className="mt-2.5 flex items-center gap-[4px]">
                        {Array.from({ length: 26 }).map((_, i) => (
                          <span
                            key={i}
                            className="h-[5px] w-[5px] rounded-full transition-colors"
                            style={{
                              background: i < Math.round(kredi.oran * 26) ? kredi.renk : "rgba(255,255,255,0.12)",
                            }}
                          />
                        ))}
                      </div>
                      {/* Kredi yükle · Hız artır · Sınırsız modeller — ayrı kredi sayfasına git (m59) */}
                      {([
                        { ad: "Kredi yükle", sekme: "kredi" as const, ikon: KrediIkon },
                        { ad: "Hız artır", sekme: "hiz" as const, ikon: Zap },
                        { ad: "Sınırsız modeller", sekme: "sinirsiz" as const, ikon: Infinity },
                      ]).map((s, i) => (
                        <div key={s.ad} className={cn("flex items-center gap-3 border-t border-white/[0.07] py-2.5", i === 0 && "mt-2.5")}>
                          <s.ikon className="h-[22px] w-[22px] shrink-0 text-aksan" strokeWidth={2} />
                          <span className="flex-1 text-[15px] text-white">{s.ad}</span>
                          <button
                            onClick={() => { setProfil(false); router.push(`/panel/kredi?sekme=${s.sekme}`); }}
                            className="rounded-full bg-aksan px-4 py-1.5 text-[13px] font-bold text-zemin transition-transform hover:scale-105"
                          >
                            Al
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-1.5">
                      <Link href="/panel/profil" onClick={() => setProfil(false)} className="flex items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-[15px] text-white hover:bg-white/8">
                        <User className="h-[18px] w-[18px] text-metin-2" /> Profili görüntüle
                      </Link>
                      <Link href="/panel/ayarlar" onClick={() => setProfil(false)} className="flex items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-[15px] text-white hover:bg-white/8">
                        <Settings className="h-[18px] w-[18px] text-metin-2" /> Hesabı yönet
                      </Link>
                      <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" onClick={() => setProfil(false)} className="flex items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-[15px] text-white hover:bg-white/8">
                        <DiscordIkon className="h-[18px] w-[18px] text-metin-2" /> Topluluğa katıl
                      </a>
                      <div className="my-1.5 h-px bg-white/[0.07]" />
                      {/* Higgsfield'de "Sign Out" BEYAZ — kırmızı değil */}
                      <button
                        onClick={() => { cikisYap(); router.push("/"); }}
                        className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-[15px] text-white hover:bg-white/8"
                      >
                        <LogOut className="h-[18px] w-[18px] text-metin-2" /> Çıkış yap
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          )}
        </div>
      </div>

      <AramaModal acik={arama} onKapat={() => setArama(false)} />
    </header>
  );
}
