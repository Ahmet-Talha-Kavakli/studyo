/**
 * Panel gezinme listesi — TEK kaynak.
 *
 * Hem masaüstü üst navigasyonu (UstNav) hem mobil çekmece menüsü (MobilBaslik)
 * buradan beslenir; eskiden liste yalnız UstNav içinde yereldi ve mobil menü
 * onu göremiyordu. İkon `lucide-react` adıyla değil bileşenle taşınır ki
 * tüketiciler ayrıca eşleme tablosu tutmak zorunda kalmasın.
 */

import {
  Compass, LayoutGrid, Image as ImageIcon, Film, AudioLines, Music, Box,
  Cpu, Terminal, Megaphone, Scissors, Presentation, Clapperboard,
  Workflow, UserRound, Sparkle, Combine, type LucideIcon,
} from "lucide-react";

export type PanelOge = {
  ad: string;
  href: string;
  yeni?: boolean;
  /** Beta aşamasındaki stüdyo — nav'da amber BETA rozeti gösterilir. */
  beta?: boolean;
  ikon: LucideIcon;
  /** .glass-ikon renk varyantı — çıktı türüne göre gruplama. */
  renk?: string;
  /** Mobil çekmecede ikinci satır. */
  ozet?: string;
};

export const KESFET: PanelOge = {
  ad: "Keşfet", href: "/panel", ikon: Compass, ozet: "Topluluk galerisi ve yenilikler",
};

export const STUDYOLAR: PanelOge[] = [
  { ad: "Görsel", href: "/panel/gorsel", ikon: ImageIcon, renk: "glass-ikon-cyan", ozet: "Metinden AI görsel üret" },
  { ad: "Video", href: "/panel/video", ikon: Film, renk: "glass-ikon-mor", ozet: "15+ model ile video" },
  { ad: "3D", href: "/panel/3d", ikon: Box, renk: "glass-ikon-lime", ozet: "Metin/görselden 3D model" },
  { ad: "Müzik", href: "/panel/muzik", ikon: Music, renk: "glass-ikon-gul", ozet: "Şarkı, stil ve remix" },
  { ad: "Ses", href: "/panel/ses", ikon: AudioLines, renk: "glass-ikon-gok", ozet: "Seslendirme, klon, SFX" },
];

export const URUNLER: PanelOge[] = [
  { ad: "Usta", href: "/panel/supercomputer", yeni: true, ikon: Cpu, renk: "glass-ikon-kehribar", ozet: "Ajanlar, otomasyon, beceriler" },
  { ad: "API Konsolu", href: "/panel/api", yeni: true, ikon: Terminal, renk: "glass-ikon-lime", ozet: "Anahtar, oyun alanı, kullanım, faturalama" },
  { ad: "MCP & CLI", href: "/panel/mcp", yeni: true, ikon: Terminal, ozet: "Claude'u yaratıcı motora çevir" },
  { ad: "Sinema Stüdyosu", href: "/panel/sinema", ikon: Clapperboard, renk: "glass-ikon-mor", ozet: "AI Yönetmen & kamera kontrolü" },
  { ad: "Pazarlama Stüdyosu", href: "/panel/pazarlama", ikon: Megaphone, renk: "glass-ikon-gul", ozet: "URL'den yayına hazır reklam" },
  { ad: "Shorts Stüdyosu", href: "/panel/shorts", yeni: true, ikon: Scissors, renk: "glass-ikon-mor", ozet: "Dikey kısa video üretimi" },
  { ad: "Explainer", href: "/panel/explainer", yeni: true, ikon: Presentation, renk: "glass-ikon-yesil", ozet: "Konuyu anlatan video" },
  { ad: "Uzun Video Stüdyosu", href: "/panel/uzun-video", yeni: true, ikon: Film, renk: "glass-ikon-lime", ozet: "1 dk–1 saat çok sahneli video" },
  { ad: "Montaj Stüdyosu", href: "/panel/montaj", beta: true, ikon: Combine, renk: "glass-ikon-cyan", ozet: "AI ile video montaj ve düzenleme" },
  { ad: "Originals", href: "/panel/originals", ikon: Clapperboard, renk: "glass-ikon-mor", ozet: "Vayra orijinal dizileri" },
  { ad: "Viral Presetler", href: "/panel/presetler", ikon: Sparkle, renk: "glass-ikon-lime", ozet: "Tek tık efekt şablonları" },
  { ad: "Canvas", href: "/panel/canvas", ikon: Workflow, renk: "glass-ikon-cyan", ozet: "Düğüm tabanlı görsel akış" },
  { ad: "AI Influencer", href: "/panel/influencer", ikon: UserRound, renk: "glass-ikon-kehribar", ozet: "Kendi dijital yüzünü kur" },
  { ad: "Uygulamalar", href: "/panel/uygulamalar", ikon: LayoutGrid, ozet: "80+ tek-tık aracı" },
];

/** Mobil çekmece için gruplanmış görünüm. */
export const MOBIL_GRUPLAR: { baslik: string; ogeler: PanelOge[] }[] = [
  { baslik: "Keşfet", ogeler: [KESFET] },
  { baslik: "Stüdyolar", ogeler: STUDYOLAR },
  { baslik: "Ürünler", ogeler: URUNLER },
];
