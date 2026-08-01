export interface Entegrasyon {
  ad: string;
  kategori: string;
  ozet: string;
  renk: string;
  harf: string;
}

export const ENTEGRASYONLAR: Entegrasyon[] = [
  // Tasarım & Video
  { ad: "Photoshop", kategori: "Tasarım", ozet: "Katmanları doğrudan Vayra'ya aktar.", renk: "from-blue-500 to-blue-700", harf: "Ps" },
  { ad: "Premiere Pro", kategori: "Video", ozet: "Zaman çizelgesine AI klip ekle.", renk: "from-purple-500 to-purple-700", harf: "Pr" },
  { ad: "After Effects", kategori: "Video", ozet: "Kompozisyonlara AI efekt.", renk: "from-indigo-500 to-indigo-700", harf: "Ae" },
  { ad: "DaVinci Resolve", kategori: "Video", ozet: "Renk & montajda AI desteği.", renk: "from-red-500 to-red-700", harf: "Dv" },
  { ad: "Figma", kategori: "Tasarım", ozet: "Tasarımlara AI görsel yerleştir.", renk: "from-pink-500 to-orange-500", harf: "Fi" },
  { ad: "Blender", kategori: "3D", ozet: "3D sahnelere Meshy modeli aktar.", renk: "from-orange-500 to-amber-500", harf: "Bl" },
  // Sosyal & Yayın
  { ad: "TikTok", kategori: "Yayın", ozet: "Üretimini doğrudan paylaş.", renk: "from-slate-700 to-black", harf: "Tt" },
  { ad: "Instagram", kategori: "Yayın", ozet: "Reels & post otomatik yayın.", renk: "from-pink-500 to-purple-600", harf: "Ig" },
  { ad: "YouTube", kategori: "Yayın", ozet: "Shorts & video yükle.", renk: "from-red-500 to-red-600", harf: "Yt" },
  { ad: "LinkedIn", kategori: "Yayın", ozet: "Kurumsal içerik paylaş.", renk: "from-blue-600 to-blue-800", harf: "In" },
  // Depolama & Otomasyon
  { ad: "Google Drive", kategori: "Depolama", ozet: "Üretimleri buluta kaydet.", renk: "from-green-500 to-yellow-500", harf: "Dr" },
  { ad: "Dropbox", kategori: "Depolama", ozet: "Varlıkları senkronla.", renk: "from-blue-500 to-blue-600", harf: "Db" },
  { ad: "Zapier", kategori: "Otomasyon", ozet: "5000+ uygulamayla otomatikleştir.", renk: "from-orange-500 to-red-500", harf: "Za" },
  { ad: "Slack", kategori: "Otomasyon", ozet: "Üretim bildirimlerini al.", renk: "from-purple-500 to-pink-500", harf: "Sl" },
  { ad: "Notion", kategori: "Otomasyon", ozet: "İçerik takvimini yönet.", renk: "from-slate-600 to-slate-800", harf: "No" },
  { ad: "Webhook / API", kategori: "Geliştirici", ozet: "Kendi akışını kur.", renk: "from-cyan-glow to-teal-500", harf: "{}" },
];

export const ENTEGRASYON_KATEGORILERI = ["Tümü", "Tasarım", "Video", "3D", "Yayın", "Depolama", "Otomasyon", "Geliştirici"];
