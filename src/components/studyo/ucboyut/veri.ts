/**
 * 3D Stüdyo veri katmanı: modeller, stiller (gerçek render kapaklı), poz/topoloji seçenekleri,
 * örnek modeller (motorumuzun ürettiği gerçek GLB'ler) ve araç tanımları.
 */
import { ANIMASYONLAR, ANIMASYON_KATEGORILERI } from "@/lib/uc-boyut";

export type GirdiMod = "metin" | "gorsel" | "coklu";
export type Arac = "doku" | "remesh" | "rig" | "baski" | "indir";

/** Üretim modelleri — taslak (4 aday, dokusuz) ve detaylandırma maliyeti ayrı. */
export const MODELLER_3D = [
  { id: "vayra-3d-6", ad: "Vayra 3D 6", kisa: "Vayra 3D 6", alt: "En yüksek detay, keskin geometri", sure: "yaklaşık 60 sn", taslak: 20, detay: 10, hiz: 2, detayPuan: 5, kapak: "/gercek/3d/savasci-poster.png", rozet: "Yeni" },
  { id: "vayra-3d-topoloji", ad: "Vayra 3D Akıllı Topoloji", kisa: "Akıllı Topoloji", alt: "Temiz dörtgen mesh, rig ve animasyona hazır", sure: "yaklaşık 45 sn", taslak: 15, detay: 10, hiz: 3, detayPuan: 4, kapak: "/gercek/3d/kask-ham-poster.png", quad: true },
  { id: "vayra-3d-turbo", ad: "Vayra 3D Turbo", kisa: "Turbo", alt: "Hızlı kaba taslak, fikir denemek için", sure: "yaklaşık 10 sn", taslak: 5, detay: 10, hiz: 5, detayPuan: 2, kapak: "/gercek/3d/robot-poster.png" },
] as const;
export type Model3D = (typeof MODELLER_3D)[number];

/** Sanat stilleri — kapaklar gerçek 3D render. */
export const STILLER = [
  { id: "gercekci", ad: "Gerçekçi", alt: "PBR doku, gerçek malzeme", kapak: "/gercek/3d/savasci-poster.png", istem: "realistic, PBR materials" },
  { id: "kil", ad: "Kil heykel", alt: "Dokusuz, yumuşak form", kapak: "/gercek/arac/3d-ilham-render.webp", istem: "sculpture, clay, untextured" },
  { id: "sevimli", ad: "Sevimli", alt: "Yuvarlak hatlar, iri gözler", kapak: "/gercek/galeri/3d8.webp", istem: "cute stylized cartoon character" },
  { id: "oyuncak", ad: "Oyuncak", alt: "Parlak plastik, figür", kapak: "/gercek/galeri/3d1.webp", istem: "glossy vinyl toy figure" },
  { id: "dusuk-poli", ad: "Düşük poligon", alt: "Oyuna hazır, keskin yüzeyler", kapak: "/gercek/galeri/3d7.webp", istem: "low poly, flat shading" },
  { id: "diorama", ad: "Diorama", alt: "İzometrik minyatür sahne", kapak: "/gercek/galeri/3d10.webp", istem: "isometric diorama, miniature" },
] as const;

export const POZLAR_3D = [
  { id: "serbest", ad: "Serbest", kisa: "Kendi duruşu", alt: "Modelin kendi duruşu" },
  { id: "a", ad: "A-poz", kisa: "Rig için önerilir", alt: "Kollar 45°; rig ve animasyon için önerilir" },
  { id: "t", ad: "T-poz", kisa: "Klasik rig duruşu", alt: "Kollar yatay; klasik rig duruşu" },
] as const;

export const POLIGON_HAZIR = [3000, 10000, 30000, 100000];

/** Çoklu görünüm yuvaları. */
export const GORUNUSLER = ["Ön", "Sağ", "Arka", "Sol"] as const;

/**
 * Örnek modeller — Vayra 3D motorunun gerçek çıktıları. `ham` taslak (dokusuz) aşaması,
 * `glb` dokulu son model. Sağlayıcı bağlı değilken taslak adayları ve detaylandırma bunlarla gösterilir.
 */
export const ORNEKLER = [
  { id: "kask", ad: "Astronot kaskı", istem: "Beyaz astronot kaskı, turkuaz vizör, yıpranmış paneller", ham: "/gercek/3d/kask-ham.glb", hamPoster: "/gercek/3d/kask-ham-poster.png", glb: "/gercek/3d/kask.glb", poster: "/gercek/3d/kask-poster.png", stil: "gercekci" },
  { id: "savasci", ad: "Zırhlı şövalye", istem: "Gümüş plaka zırhlı şövalye, mavi pelerin, ayakta duruyor", ham: "/gercek/3d/savasci-ham.glb", hamPoster: "/gercek/3d/savasci-ham-poster.png", glb: "/gercek/3d/savasci.glb", poster: "/gercek/3d/savasci-poster.png", stil: "gercekci" },
  { id: "lamba", ad: "Masa lambası", istem: "Turkuaz metal başlıklı modern masa lambası, pirinç gövde", ham: "/gercek/3d/lamba-ham.glb", hamPoster: "/gercek/3d/lamba-ham-poster.png", glb: "/gercek/3d/lamba.glb", poster: "/gercek/3d/lamba-poster.png", stil: "gercekci" },
  { id: "robot", ad: "Sevimli robot", istem: "Sevimli küçük robot, yuvarlak kafa, eklemli kollar", ham: "/gercek/3d/robot.glb", hamPoster: "/gercek/3d/robot-poster.png", glb: "/gercek/3d/robot.glb", poster: "/gercek/3d/robot-poster.png", stil: "kil" },
] as const;

export const RIG_TURLERI = [
  { id: "insansi", ad: "İnsansı", alt: "İki ayaklı karakterler" },
  { id: "dort-ayakli", ad: "Dört ayaklı", alt: "Hayvanlar ve yaratıklar" },
] as const;

export const TABANLAR = [
  { id: "yok", ad: "Taban yok", alt: "Model doğrudan tablaya oturur" },
  { id: "daire", ad: "Yuvarlak kaide", alt: "Figür ve büstler için klasik" },
  { id: "kare", ad: "Kare kaide", alt: "Masaüstü maket ve diorama" },
  { id: "altigen", ad: "Altıgen kaide", alt: "Masa oyunu minyatürleri" },
] as const;

export const FORMATLAR = [
  { id: "glb", ad: "GLB", alt: "Web, Three.js, Blender" },
  { id: "fbx", ad: "FBX", alt: "Unity, Unreal" },
  { id: "obj", ad: "OBJ", alt: "Evrensel mesh" },
  { id: "usdz", ad: "USDZ", alt: "Apple AR" },
  { id: "stl", ad: "STL", alt: "Tek renk baskı" },
  { id: "3mf", ad: "3MF", alt: "Çok renkli baskı" },
  { id: "blend", ad: "BLEND", alt: "Blender" },
] as const;

export { ANIMASYONLAR, ANIMASYON_KATEGORILERI };

export const kisaSayi = (n: number) => (n >= 1000 ? `${(n / 1000).toLocaleString("tr", { maximumFractionDigits: n >= 100000 ? 0 : 1 })}B` : `${n}`);
