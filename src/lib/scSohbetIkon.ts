import {
  MessageSquare, Globe, Gamepad2, LayoutDashboard, Image as ImageIcon,
  Film, Music, Code2, FileText, Megaphone, UserRound, Bot, Search,
  type LucideIcon,
} from "lucide-react";

/**
 * Sohbet listesi ikonu — Claude'un sohbet satırlarındaki tür ikonu.
 *
 * Sohbetin ne hakkında olduğunu başlıktan (ilk kullanıcı mesajından türetilen)
 * çıkarır. Store'da tür alanı yok ve geçmiş sohbetleri geriye dönük
 * etiketlemek mümkün değil; bu yüzden anahtar-kelime eşlemesi kullanılır.
 * Eşleşme yoksa nötr sohbet balonu döner.
 *
 * Sıra ÖNEMLİ: daha özel kalıplar üstte olmalı (ör. "oyun" → Gamepad2,
 * "site" → Globe; ikisi birlikte geçerse ilk eşleşen kazanır).
 */
const KALIPLAR: { re: RegExp; ikon: LucideIcon }[] = [
  { re: /oyun|game|platformer|bulmaca/i, ikon: Gamepad2 },
  { re: /panel|dashboard|gösterge|analitik|rapor/i, ikon: LayoutDashboard },
  { re: /site|landing|web ?sayfa|portfolyo|blog|menü/i, ikon: Globe },
  { re: /görsel|resim|foto|image|poster|afiş|logo|illüstrasyon/i, ikon: ImageIcon },
  { re: /video|film|klip|reels|shorts|montaj|sinema/i, ikon: Film },
  { re: /müzik|şarkı|beat|ses|jingle|podcast/i, ikon: Music },
  { re: /kod|script|api|uygulama|app|fonksiyon|bug/i, ikon: Code2 },
  { re: /kampanya|reklam|pazarlama|funnel|ugc/i, ikon: Megaphone },
  { re: /çalışan|employee|ajan|asistan/i, ikon: Bot },
  { re: /karakter|influencer|persona|avatar/i, ikon: UserRound },
  { re: /araştır|research|incele|analiz|karşılaştır/i, ikon: Search },
  { re: /metin|yazı|makale|senaryo|blog ?yaz|e-?posta/i, ikon: FileText },
];

/** Sohbet başlığına göre ikon; eşleşme yoksa nötr sohbet balonu. */
export function sohbetIkonu(baslik: string): LucideIcon {
  for (const k of KALIPLAR) if (k.re.test(baslik)) return k.ikon;
  return MessageSquare;
}
