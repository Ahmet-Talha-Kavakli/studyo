import type { Calisan } from "@/store/useCalisan";

/** Hazır AI çalışan galerisi — Higgsfield "Explore AI Employees" karşılığı. */
export const HAZIR_CALISANLAR: Omit<Calisan, "olusturma">[] = [
  {
    id: "shorts-maker", ad: "Shorts Ustası", rol: "Kısa Video Editörü", emoji: "🎬",
    ozet: "Uzun videolardan viral shorts kesip altyazı ve hook ekler.",
    renk: "from-cyan-glow/30 to-blue-600/20",
    yetenekler: ["Klip Kesme", "Altyazı", "Hook Yazımı", "Ritim Kurgu"],
    konektorler: ["Dosyalar", "TikTok Ads"],
  },
  {
    id: "personal-clipper", ad: "Kişisel Klipçi", rol: "İçerik Kurgucu", emoji: "✂️",
    ozet: "Konuşma videolarını sosyal medya için parçalara böler.",
    renk: "from-iris-500/30 to-fuchsia-600/20",
    yetenekler: ["Konuşma Analizi", "Otomatik Kesme", "Vurgu Bulma"],
    konektorler: ["Dosyalar", "Takvim"],
  },
  {
    id: "marketing-expert", ad: "Pazarlama Uzmanı", rol: "Kampanya Stratejisti", emoji: "📣",
    ozet: "Ürün URL'inden kampanya planı, reklam metni ve UGC brief üretir.",
    renk: "from-amber-glow/30 to-orange-600/20",
    yetenekler: ["Kampanya Planı", "Reklam Metni", "A/B Test", "Hedef Kitle"],
    konektorler: ["Meta Ads", "TikTok Ads", "Web Arama"],
  },
  {
    id: "cinema-director", ad: "Sinema Yönetmeni", rol: "AI Yönetmen", emoji: "🎥",
    ozet: "Senaryodan storyboard, kamera açısı ve sahne planı çıkarır.",
    renk: "from-rose-500/30 to-red-600/20",
    yetenekler: ["Storyboard", "Kamera Planı", "Işık Tasarımı", "Sahne Kurgu"],
    konektorler: ["Dosyalar"],
  },
  {
    id: "cartoon-generator", ad: "Çizgi Film Üreticisi", rol: "Animasyon Sanatçısı", emoji: "🎨",
    ozet: "Karakter tasarımı ve tutarlı çizgi film sahneleri oluşturur.",
    renk: "from-emerald-400/30 to-teal-600/20",
    yetenekler: ["Karakter Tasarımı", "Stil Tutarlılığı", "Sahne Üretimi"],
    konektorler: ["Dosyalar"],
  },
  {
    id: "seo-writer", ad: "SEO Yazarı", rol: "İçerik Yazarı", emoji: "📝",
    ozet: "Anahtar kelime araştırmasıyla SEO uyumlu blog ve açıklama yazar.",
    renk: "from-cyan-glow/30 to-emerald-400/20",
    yetenekler: ["Anahtar Kelime", "Blog Yazımı", "Meta Açıklama", "İç Bağlantı"],
    konektorler: ["Web Arama", "E-posta"],
  },
  {
    id: "data-analyst", ad: "Veri Analisti", rol: "Analitik Uzmanı", emoji: "📊",
    ozet: "Veritabanından içgörü çıkarır, rapor ve grafik hazırlar.",
    renk: "from-iris-500/30 to-indigo-600/20",
    yetenekler: ["SQL Sorgu", "Rapor", "Grafik", "Trend Analizi"],
    konektorler: ["Veritabanı", "E-posta"],
  },
  {
    id: "brand-designer", ad: "Marka Tasarımcısı", rol: "Görsel Kimlik Uzmanı", emoji: "🖌️",
    ozet: "Logo, renk paleti ve marka kılavuzu üretir; tutarlılığı korur.",
    renk: "from-fuchsia-600/30 to-pink-600/20",
    yetenekler: ["Logo", "Renk Paleti", "Tipografi", "Marka Kılavuzu"],
    konektorler: ["Dosyalar", "GitHub"],
  },
];

// Kendi çalışanını oluştururken seçilebilecek yetenek & konektör havuzu.
export const YETENEK_HAVUZU = [
  "Klip Kesme", "Altyazı", "Hook Yazımı", "Storyboard", "Kamera Planı",
  "Kampanya Planı", "Reklam Metni", "A/B Test", "SQL Sorgu", "Rapor",
  "Blog Yazımı", "Anahtar Kelime", "Karakter Tasarımı", "Logo", "Renk Paleti",
];
export const KONEKTOR_HAVUZU = [
  "Dosyalar", "Veritabanı", "GitHub", "Takvim", "E-posta", "Web Arama", "TikTok Ads", "Meta Ads",
];

export const CALISAN_EMOJILER = ["🤖", "🎬", "✂️", "📣", "🎥", "🎨", "📝", "📊", "🖌️", "🧠", "⚡", "🚀"];
export const CALISAN_RENKLER = [
  "from-cyan-glow/30 to-blue-600/20",
  "from-iris-500/30 to-fuchsia-600/20",
  "from-amber-glow/30 to-orange-600/20",
  "from-emerald-400/30 to-teal-600/20",
  "from-rose-500/30 to-red-600/20",
];
