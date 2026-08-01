/**
 * Katalog ikonları — açık import (tree-shake dostu).
 * `import * as Icons from "lucide-react"` TÜM kütüphaneyi bundle'a katar (~150-200 kB fazlalık).
 * Burada SADECE catalog.ts'te kullanılan ikonlar açıkça import edilir → tree-shaking çalışır.
 *
 * Yeni bir katalog ikonu eklerken buraya da ekle (yoksa Sparkles fallback görünür).
 */
import {
  ArrowUpNarrowWide, AudioLines, Bird, Box, Cat, Clapperboard, Eraser,
  Gamepad, Gamepad2, GraduationCap, Grid3x3, IdCard, Image, Laugh, Layers,
  Link as LinkIcon, Maximize, Megaphone, Mic, Music, Orbit, Rotate3d,
  Scissors, Shirt, Shuffle, Signpost, Sparkles, Sun, TrendingUp, Truck,
  UserRound, Users, Video, Wand2,
  type LucideIcon,
} from "lucide-react";

/** kebab-case ikon adı → lucide bileşeni. Bilinmeyen ad → Sparkles. */
const IKON_HARITA: Record<string, LucideIcon> = {
  "arrow-up-narrow-wide": ArrowUpNarrowWide,
  "audio-lines": AudioLines,
  bird: Bird,
  box: Box,
  cat: Cat,
  clapperboard: Clapperboard,
  eraser: Eraser,
  gamepad: Gamepad,
  "gamepad-2": Gamepad2,
  "graduation-cap": GraduationCap,
  "grid-3x3": Grid3x3,
  "id-card": IdCard,
  image: Image,
  laugh: Laugh,
  layers: Layers,
  link: LinkIcon,
  maximize: Maximize,
  megaphone: Megaphone,
  mic: Mic,
  music: Music,
  orbit: Orbit,
  "rotate-3d": Rotate3d,
  scissors: Scissors,
  shirt: Shirt,
  shuffle: Shuffle,
  signpost: Signpost,
  sparkles: Sparkles,
  sun: Sun,
  "trending-up": TrendingUp,
  truck: Truck,
  "user-round": UserRound,
  users: Users,
  video: Video,
  "wand-2": Wand2,
};

/** Katalog ikon adından lucide bileşenini döndürür (bilinmeyen → Sparkles). */
export function katalogIkon(ad: string): LucideIcon {
  return IKON_HARITA[ad] ?? Sparkles;
}
