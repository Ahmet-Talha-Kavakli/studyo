// Panel üst nav mega-menü verisi — Görsel / Video / Ses
// 2 sütun: Özellikler + Modeller. Vayra'nın kendi kataloğu.

export interface MegaOge {
  ad: string;
  ozet: string;
  href: string;
  ikon: string;
  rozet?: "Yeni" | "Pro" | "Top";
}

export interface MegaMenu {
  ozellikler: MegaOge[];
  modeller: MegaOge[];
}

export const MEGA_MENULER: Record<"gorsel" | "video" | "ses", MegaMenu> = {
  gorsel: {
    ozellikler: [
      { ad: "Görsel Üret", ozet: "Metinden AI görsel", href: "/panel/gorsel", ikon: "image" },
      { ad: "Sinematik Kamera", ozet: "Kamera kontrollü görsel", href: "/panel/sinema", ikon: "camera", rozet: "Top" },
      { ad: "Akış (Canvas)", ozet: "Tekrarlanabilir görsel akış", href: "/panel/akis-canvas", ikon: "layers", rozet: "Yeni" },
      { ad: "Karakterler", ozet: "Kendi karakterini eğit", href: "/panel/karakter", ikon: "user-round" },
      { ad: "Yeniden Işıklandır", ozet: "Işık, renk, parlaklık", href: "/panel/uygulamalar", ikon: "sun" },
      { ad: "Inpaint", ozet: "Alan seç, değiştir", href: "/panel/uygulamalar", ikon: "layers" },
      { ad: "Görsel Yükselt", ozet: "4K'ya çıkar", href: "/panel/uygulamalar", ikon: "maximize" },
      { ad: "Yüz Değiştir", ozet: "Gerçekçi yüz değiştirme", href: "/panel/uygulamalar", ikon: "user-round" },
    ],
    modeller: [
      { ad: "Ruh 2.0", ozet: "Yeni nesil editorial foto", href: "/panel/gorsel", ikon: "sparkles", rozet: "Pro" },
      { ad: "Ruh Sinema", ozet: "Sinematik kalite görsel", href: "/panel/gorsel", ikon: "sparkles" },
      { ad: "GPT Image 2", ozet: "Metin işleyen 4K görsel", href: "/panel/gorsel", ikon: "sparkles", rozet: "Yeni" },
      { ad: "Seedream 5.0 Pro", ozet: "Akıl yürütmeli görsel", href: "/panel/gorsel", ikon: "sparkles", rozet: "Pro" },
      { ad: "Nano Banana Pro", ozet: "Üstün 4K görsel modeli", href: "/panel/gorsel", ikon: "sparkles", rozet: "Top" },
      { ad: "Flux 2", ozet: "Keskin detay & anatomi", href: "/panel/gorsel", ikon: "sparkles" },
    ],
  },
  video: {
    ozellikler: [
      { ad: "Video Üret", ozet: "Metinden AI video", href: "/panel/video", ikon: "video" },
      { ad: "Sinema Stüdyosu", ozet: "AI Yönetmen ile video", href: "/panel/sinema", ikon: "clapperboard", rozet: "Top" },
      { ad: "Açıklayıcı", ozet: "Konuyu videoya çevir", href: "/panel/uygulamalar", ikon: "graduation-cap", rozet: "Yeni" },
      { ad: "Akış (Canvas)", ozet: "Görsel workflow", href: "/panel/akis-canvas", ikon: "layers", rozet: "Yeni" },
      { ad: "Video Düzenle", ozet: "Sahne, çekim düzenle", href: "/panel/uygulamalar", ikon: "scissors" },
      { ad: "Tıkla Reklam Ol", ozet: "URL'den video reklam", href: "/panel/pazarlama", ikon: "link" },
      { ad: "Lip-Sync Stüdyo", ozet: "Konuşan klipler", href: "/panel/ses", ikon: "mic" },
      { ad: "Recast", ozet: "Videoda karakter değiştir", href: "/panel/uygulamalar", ikon: "clapperboard" },
    ],
    modeller: [
      { ad: "Seedance 2.0", ozet: "4K senkron sesli video", href: "/panel/video", ikon: "sparkles", rozet: "Top" },
      { ad: "Veo 3.1", ozet: "Atmosferik dış mekan", href: "/panel/video", ikon: "sparkles", rozet: "Pro" },
      { ad: "Kling 3.0", ozet: "4K sesli sinematik video", href: "/panel/video", ikon: "sparkles", rozet: "Top" },
      { ad: "Sora 2", ozet: "Fizik tutarlı uzun video", href: "/panel/video", ikon: "sparkles", rozet: "Yeni" },
      { ad: "WAN 2.7", ozet: "Video stil transferi", href: "/panel/video", ikon: "sparkles" },
      { ad: "MiniMax Hailuo 2.3", ozet: "Hızlı kısa-form video", href: "/panel/video", ikon: "sparkles" },
    ],
  },
  ses: {
    ozellikler: [
      { ad: "Seslendirme", ozet: "Metinden konuşma üret", href: "/panel/ses", ikon: "audio-lines" },
      { ad: "Ses Değiştir", ozet: "Videoda ses değiştir", href: "/panel/ses", ikon: "mic" },
      { ad: "Çeviri", ozet: "Videodaki konuşmayı çevir", href: "/panel/ses", ikon: "languages" },
      { ad: "Müzik Üret", ozet: "Metinden telifsiz müzik", href: "/panel/ses", ikon: "music" },
    ],
    modeller: [
      { ad: "ElevenLabs TTS", ozet: "32 dilde gerçekçi ses", href: "/panel/ses", ikon: "sparkles", rozet: "Yeni" },
      { ad: "Ses Klonu", ozet: "Kendi sesini klonla", href: "/panel/ses", ikon: "sparkles" },
      { ad: "Vali Müzik", ozet: "Telifsiz müzik & jingle", href: "/panel/ses", ikon: "sparkles", rozet: "Yeni" },
      { ad: "Vali SFX", ozet: "Metinden ses efekti", href: "/panel/ses", ikon: "sparkles" },
    ],
  },
};
