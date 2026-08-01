// 3D Stüdyo (Meshy birebir) veri katmanı: üretim modları, sanat stilleri, AI
// modelleri, animasyon kütüphanesi, HDRI ortamları, DCC köprü hedefleri, taban
// kütüphanesi ve indirme formatları. Renk hariç Meshy'nin yapısını birebir taşır.

export type UcBoyutMod = "metin" | "gorsel" | "doku" | "canlandir" | "yazdir";

/** Sol dikey mod rayı — Meshy'deki Varlıklar/Görüntü/Model/Yazdır/Canlandırmak. */
export const UC_BOYUT_MODLARI: {
  id: UcBoyutMod;
  ad: string;
  ikon: string; // lucide adı
  aciklama: string;
  yeni?: boolean;
}[] = [
  { id: "metin", ad: "Metin → 3D", ikon: "type", aciklama: "Metinden dokulu 3D model üret." },
  { id: "gorsel", ad: "Görsel → 3D", ikon: "image", aciklama: "Tek görselden 3D mesh çıkar." },
  { id: "doku", ad: "Dokulama", ikon: "palette", aciklama: "Mevcut modele yeni PBR doku uygula." },
  { id: "canlandir", ad: "Canlandır", ikon: "person-standing", aciklama: "Otomatik rig + animasyon kütüphanesi.", yeni: true },
  { id: "yazdir", ad: "3D Baskı", ikon: "layers", aciklama: "Çok renkli baskı, taban ekle, dilimleyiciye gönder." },
];

/** Sanat stilleri (Meshy: Realistic/Sculpture/Cartoon…). */
export const SANAT_STILLERI = [
  { id: "gercekci", ad: "Gerçekçi", ipucu: "PBR dokulu, foto-gerçekçi" },
  { id: "heykel", ad: "Heykel", ipucu: "Dokusuz gri kil / heykel" },
  { id: "karikatur", ad: "Karikatür", ipucu: "Stilize, çizgi-film" },
  { id: "dusuk-poli", ad: "Düşük Poligon", ipucu: "Oyun-hazır low-poly" },
  { id: "voksel", ad: "Voksel", ipucu: "Küp-blok stil" },
] as const;

/** Model türü — Meshy: Standart vs Akıllı Topoloji (quad). */
export const MODEL_TURLERI = [
  { id: "standart", ad: "Standart", topoloji: "triangle" as const, ipucu: "Üçgen mesh, hızlı" },
  { id: "akilli", ad: "Akıllı Topoloji", topoloji: "quad" as const, ipucu: "Temiz quad, animasyona uygun" },
];

/** AI model seçimi (Meshy 6 / Meshy T2…). Bizde lime aksan rozetli. */
export const UC_BOYUT_MODELLERI = [
  { id: "vayra-3d-6", ad: "Vayra 3D · 6", ipucu: "En yeni · en yüksek detay", rozet: "Yeni" },
  { id: "vayra-3d-t2", ad: "Vayra 3D · T2", ipucu: "Hızlı taslak, düşük kredi" },
  { id: "vayra-3d-turbo", ad: "Vayra 3D · Turbo", ipucu: "Saniyeler içinde önizleme" },
];

/** Poz seçimi — Meshy: Hiçbiri / A-Poz / T-Pozu. */
export const POZLAR = ["Hiçbiri", "A-Poz", "T-Pozu", "Özel"];

/** Lisans — Meshy: CC BY 4.0 / Özel. */
export const LISANSLAR = [
  { id: "cc", ad: "CC BY 4.0", ipucu: "Atıfla serbest kullanım" },
  { id: "ozel", ad: "Özel", ipucu: "Yalnızca sana ait" },
];

/** İndirme formatları (Meshy: fbx/glb/usdz + obj/stl). */
export const UC_BOYUT_FORMATLARI = ["GLB", "FBX", "OBJ", "USDZ", "STL"];

/** HDRI / ortam ışıklandırma presetleri (viewport Çevre Ayarları). */
export const HDRI_ORTAMLARI = [
  { id: "ic", ad: "İç Aydınlatma", grad: "from-amber-200 to-orange-400" },
  { id: "dis", ad: "Dış Aydınlatma", grad: "from-sky-300 to-blue-500" },
  { id: "studyo", ad: "Stüdyo Aydınlatması", grad: "from-zinc-200 to-zinc-500" },
  { id: "yumusak", ad: "Yumuşak Aydınlatma", grad: "from-rose-200 to-fuchsia-400" },
  { id: "gece", ad: "Gece / Neon", grad: "from-cyan-400 to-indigo-600" },
];

/** Viewport render modları (Katı / Aydınlatılmamış / Tel-kafes / Malzeme). */
export const RENDER_MODLARI = [
  { id: "kati", ad: "Katı", ikon: "circle" },
  { id: "aydinlatilmamis", ad: "Aydınlatılmamış", ikon: "circle-dashed" },
  { id: "telkafes", ad: "Tel Kafes", ikon: "hexagon" },
  { id: "malzeme", ad: "Malzeme", ikon: "sun" },
];

/** DCC köprü hedefleri (Meshy: Blender/Unity/Unreal…). */
export const DCC_HEDEFLERI = [
  { ad: "Blender", aktif: true, renk: "#f5792a" },
  { ad: "Unity", aktif: true, renk: "#cbcbcb" },
  { ad: "Unreal", aktif: true, renk: "#8a8a8a" },
  { ad: "Maya", aktif: true, renk: "#2ba7df" },
  { ad: "3ds Max", aktif: true, renk: "#37a5cc" },
  { ad: "Godot", aktif: true, renk: "#478cbf" },
  { ad: "ZBrush", aktif: false, renk: "#c0563b" },
  { ad: "Roblox", aktif: false, renk: "#e0322f" },
];

/** Animasyon kütüphanesi — Meshy Mixamo-tarzı Türkçe preset ağacı. */
export const ANIMASYON_KATEGORILERI = [
  { id: "hepsi", ad: "Hepsi" },
  { id: "yuru-kos", ad: "Yürü ve Koş" },
  { id: "gunluk", ad: "Günlük Eylemler" },
  { id: "savas", ad: "Savaşmak" },
  { id: "vucut", ad: "Vücut Hareketleri" },
  { id: "dans", ad: "Dans etmek" },
];

export const ANIMASYONLAR: { ad: string; kategori: string; sure: string }[] = [
  { ad: "Yürüme", kategori: "yuru-kos", sure: "0:02" },
  { ad: "Koşu", kategori: "yuru-kos", sure: "0:01" },
  { ad: "Alkış Koşusu", kategori: "yuru-kos", sure: "0:02" },
  { ad: "Geriye Koşu", kategori: "yuru-kos", sure: "0:02" },
  { ad: "Boşta Bekleme", kategori: "gunluk", sure: "0:03" },
  { ad: "Alkışlama", kategori: "gunluk", sure: "0:01" },
  { ad: "Selamlama", kategori: "gunluk", sure: "0:02" },
  { ad: "Oturma", kategori: "gunluk", sure: "0:02" },
  { ad: "Zıplama", kategori: "vucut", sure: "0:01" },
  { ad: "Düşme", kategori: "vucut", sure: "0:01" },
  { ad: "Geriye Takla", kategori: "vucut", sure: "0:02" },
  { ad: "Esneme", kategori: "vucut", sure: "0:02" },
  { ad: "Yumruk Atma", kategori: "savas", sure: "0:01" },
  { ad: "Tekme", kategori: "savas", sure: "0:01" },
  { ad: "Kılıç Savurma", kategori: "savas", sure: "0:02" },
  { ad: "Savunma", kategori: "savas", sure: "0:02" },
  { ad: "Hip Hop Dansı", kategori: "dans", sure: "0:04" },
  { ad: "360 Güç Dönüşü", kategori: "dans", sure: "0:03" },
  { ad: "Salsa", kategori: "dans", sure: "0:04" },
  { ad: "Robot Dansı", kategori: "dans", sure: "0:03" },
];

/** 3D baskı taban kütüphanesi — Meshy: Klasik/Roman/Sevimli/Doğa/Fantastik. */
export const TABAN_KATEGORILERI = [
  { id: "klasik", ad: "Klasik", tabanlar: ["Çakıl Taşı", "Beton", "Çatlamış", "Izgara Taşı"] },
  { id: "roman", ad: "Roman", tabanlar: ["Daire", "Sütun", "Tapınak", "İyonik"] },
  { id: "sevimli", ad: "Sevimli", tabanlar: ["Yıldız", "Bulut", "Kalp", "Kütük"] },
  { id: "doga", ad: "Doğa", tabanlar: ["Rün", "Çimenli", "Döşenmiş", "Büyü"] },
  { id: "fantastik", ad: "Fantastik", tabanlar: ["Taş", "Diş", "Arena", "Dikenli"] },
];

/** Boş viewport ilham örnekleri. */
export const UC_BOYUT_ORNEKLER = [
  "Sevimli robot maskot", "Antika ahşap sandık", "Fantastik kılıç", "Uzay gemisi",
  "Sevimli ejderha yavrusu", "Modern deri koltuk", "Ortaçağ baltası", "Sci-fi drone",
];

/** "Örnekler" modalı — Meshy concept-art örnek kartları (görselden-3D ilhamı). */
export const UC_BOYUT_ORNEK_KARTLAR: { ad: string; istem: string; tohum: string; kategori: string }[] = [
  { ad: "Minik Rex", istem: "sevimli minik tyrannosaurus rex, stilize karikatür, iri gözler", tohum: "ornek-rex", kategori: "3d" },
  { ad: "Boynuzlu Genç", istem: "boynuzlu genç savaşçı, geyik boynuzu, fantastik zırh", tohum: "ornek-boynuz", kategori: "3d" },
  { ad: "Sis Bekçisi", istem: "sisli pelerinli gizemli bekçi, uzun asa, mavi ışıltı", tohum: "ornek-sis", kategori: "3d" },
  { ad: "Demir Sakal Usta", istem: "demirci cüce, örs, kızıl sakal, deri önlük", tohum: "ornek-demir", kategori: "3d" },
  { ad: "Buzul Devi", istem: "buz kristalinden dev golem, mavi buzul dokusu", tohum: "ornek-buzul", kategori: "3d" },
  { ad: "Mantar Pençe", istem: "mantar kabuklu orman yaratığı, pençeli, yosun dokusu", tohum: "ornek-mantar", kategori: "3d" },
];

/** Nesil sayısı seçenekleri (kaç varyasyon üretilecek). */
export const NESIL_SAYILARI = [1, 2, 4];

/** Doku çözünürlüğü (retexture). */
export const DOKU_COZUNURLUKLERI = ["2K", "4K"];

/** PBR harita kanalları (doku inceleyici). */
export const PBR_KANALLARI = [
  { id: "albedo", ad: "Temel Renk", grad: "from-amber-200 via-rose-300 to-stone-400" },
  { id: "roughness", ad: "Pürüzlülük", grad: "from-zinc-300 to-zinc-600" },
  { id: "metallic", ad: "Metaliklik", grad: "from-zinc-800 to-zinc-500" },
  { id: "normal", ad: "Normal", grad: "from-indigo-300 to-violet-400" },
  { id: "ao", ad: "Örtüşme (AO)", grad: "from-zinc-200 to-zinc-500" },
];

/** Çok renkli baskı — varsayılan filament slotları (Meshy filament örnekleri). */
export const FILAMENT_SLOTLARI = ["#313030", "#eca788", "#d7d7d5", "#4b2e26"];

/** PLA renk paleti (filament seçici). */
export const PLA_PALETI = [
  "#f5f5f5", "#f2d94e", "#f0a83a", "#e8542e", "#e0326a", "#c23fd6",
  "#7a4de0", "#3a6ef0", "#2ba7df", "#2fc98a", "#8fd13a", "#c0c0c0",
  "#7a7a7a", "#313030", "#eca788", "#4b2e26",
];

/** Sol dikey ana ray — Meshy: Varlıklar / Ajan / Görüntü / Model / Yazdır / Canlandırmak. */
export const RAY_MODLARI: { id: string; ad: string; ikon: string; yeni?: boolean }[] = [
  { id: "varliklar", ad: "Varlıklar", ikon: "layout-grid" },
  { id: "ajan", ad: "Ajan", ikon: "sparkles", yeni: true },
  { id: "metin", ad: "Metin → 3D", ikon: "type" },
  { id: "gorsel", ad: "Görsel → 3D", ikon: "image" },
  { id: "doku", ad: "Dokulama", ikon: "palette" },
  { id: "canlandir", ad: "Canlandır", ikon: "person-standing", yeni: true },
  { id: "yazdir", ad: "3D Baskı", ikon: "layers" },
];

/** Workspace galeri filtre sekmeleri. */
export const GALERI_SEKMELERI = [
  { id: "hepsi", ad: "Tümü", ikon: "layout-grid" },
  { id: "model", ad: "Model", ikon: "box" },
  { id: "dokulu", ad: "Dokulu", ikon: "palette" },
  { id: "animasyon", ad: "Animasyon", ikon: "person-standing" },
];

/** Ajan (sohbet) hızlı-başlangıç kartları. */
export const AJAN_HIZLI_BASLANGIC = [
  { ad: "Vayra 3D neler yapabilir?", ipucu: "Yeteneklere göz at" },
  { ad: "Koleksiyonluk baskı parçası üret", ipucu: "Figür & minyatür" },
  { ad: "Çizimi 3D'ye dönüştür", ipucu: "Eskizden mesh" },
  { ad: "Model malzemesini değiştir", ipucu: "Yeni doku uygula" },
];

/** Poz özelleştir preset kartları (rigging). */
export const POZ_PRESETLERI = [
  { id: "punch", ad: "Yumruk", },
  { id: "guard", ad: "Savunma", },
  { id: "kneel-both", ad: "İki Diz Çök", },
  { id: "kneel-single", ad: "Tek Diz Çök", },
  { id: "run", ad: "Koşu Döngüsü", },
  { id: "sit", ad: "Rahat Otur", },
  { id: "ozel", ad: "Özel", },
];
