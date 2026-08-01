/**
 * Akış — TikTok-tarzı topluluk feed'i için deterministik kurgusal içerik.
 *
 * SSR/hydration güvenli: Math.random/Date.now KULLANILMAZ. Her şey tohumdan
 * (başlık+yazar) deterministik türetilir → sunucu ve istemci birebir aynı üretir.
 *
 * Bu dosya SADECE tohum verisini tutar. Canlı etkileşim (yorum, favori, kaydet,
 * görüntülenme, paylaşım izni) useAkis store'unda birleştirilir.
 */

import { onizlemeArka } from "./utils";
import { kesfetArka } from "./gercekVeri";

export type AkisTur = "video" | "gorsel";

/** Kurgusal bir topluluk yaratıcısı (profil). */
export type AkisProfil = {
  kullanici: string; // "@neonmancer" — benzersiz kimlik
  ad: string; // "Neon Mancer"
  bio: string;
  takipci: number;
  takip: number;
  begeniToplam: number;
  dogrulanmis: boolean; // mavi tik
  rozetler: string[]; // "Pro Yaratıcı", "Sinema Ustası"...
  avatarTohum: string;
};

/** Feed'deki tek bir gönderi (tohum hali — store canlı sayaçlarla zenginleştirir). */
export type AkisGonderi = {
  id: string;
  kullanici: string; // yazar @handle → AkisProfil.kullanici
  tur: AkisTur;
  baslik: string;
  aciklama: string;
  model: string;
  etiketler: string[]; // "#sinematik #neon"
  gorselUrl: string; // onizlemeArka CSS (poster + gradyan)
  oran: "9:16" | "16:9" | "1:1";
  muzik: string; // "Orijinal ses — @neonmancer"
  // tohum sayaçlar (store bunları temel alır, kullanıcı etkileşimi üstüne biner)
  begeniTohum: number;
  goruntulenmeTohum: number;
  yorumTohum: number;
  paylasimTohum: number;
  izinYenidenOlustur: boolean; // yazar "Recreate" izni verdi mi
  kredi: number; // yeniden oluşturma maliyeti
  olusturmaOfset: number; // "kaç saat önce" hissi için ofset (saat)
};

// ── Deterministik hash (SSR güvenli) ────────────────────────────────────────
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function tohumSayi(tohum: string, min: number, max: number): number {
  return min + (hash(tohum) % (max - min + 1));
}
function tohumSec<T>(tohum: string, dizi: T[]): T {
  return dizi[hash(tohum) % dizi.length];
}

// ── Profiller ────────────────────────────────────────────────────────────────
const PROFIL_TANIM: Omit<AkisProfil, "takipci" | "takip" | "begeniToplam" | "avatarTohum">[] = [
  { kullanici: "@neonmancer", ad: "Neon Mancer", bio: "Gece şehirleri & neon rüyalar 🌃 · Vayra ile üretiyorum", dogrulanmis: true, rozetler: ["Pro Yaratıcı", "Sinema Ustası"] },
  { kullanici: "@studio.mira", ad: "Studio Mira", bio: "Editöryel moda · portre · ışık", dogrulanmis: true, rozetler: ["Trend Belirleyici"] },
  { kullanici: "@0xrender", ad: "0x Render", bio: "3D & fütürizm · her gün yeni bir dünya", dogrulanmis: false, rozetler: ["3D Ustası"] },
  { kullanici: "@auralab", ad: "Aura Lab", bio: "Ses tasarımı & sinematik atmosfer", dogrulanmis: true, rozetler: ["Ses Mimarı"] },
  { kullanici: "@dreamloop", ad: "Dream Loop", bio: "Rüya döngüleri · sürreel kısa filmler", dogrulanmis: false, rozetler: ["Yükselen Yıldız"] },
  { kullanici: "@velvetlens", ad: "Velvet Lens", bio: "Sinematik portre · altın saat avcısı", dogrulanmis: true, rozetler: ["Sinema Ustası", "Pro Yaratıcı"] },
  { kullanici: "@primeframe", ad: "Prime Frame", bio: "Reklam & marka filmi · URL'den video", dogrulanmis: true, rozetler: ["Pazarlama Ustası"] },
  { kullanici: "@nocturne.ai", ad: "Nocturne", bio: "Karanlık estetik · gotik atmosfer", dogrulanmis: false, rozetler: ["Yükselen Yıldız"] },
  { kullanici: "@vividworks", ad: "Vivid Works", bio: "Canlı renkler · pop sürrealizm", dogrulanmis: false, rozetler: [] },
  { kullanici: "@atlas.creative", ad: "Atlas Creative", bio: "Manzara & mimari · epik ölçek", dogrulanmis: true, rozetler: ["Trend Belirleyici", "Pro Yaratıcı"] },
  { kullanici: "@lunavisuals", ad: "Luna Visuals", bio: "Ay ışığı & masal · yumuşak render", dogrulanmis: false, rozetler: ["Yükselen Yıldız"] },
  { kullanici: "@synthwave", ad: "Synthwave", bio: "80'ler retro-fütürizm · grid & günbatımı", dogrulanmis: true, rozetler: ["Trend Belirleyici"] },
];

/** Kurgusal profiller — sayaçlar deterministik türetilir. */
export const AKIS_PROFILLER: AkisProfil[] = PROFIL_TANIM.map((p) => ({
  ...p,
  takipci: tohumSayi(p.kullanici + "tk", 1_200, 890_000),
  takip: tohumSayi(p.kullanici + "tp", 40, 520),
  begeniToplam: tohumSayi(p.kullanici + "bg", 12_000, 4_200_000),
  avatarTohum: p.kullanici,
}));

export function profilBul(kullanici: string): AkisProfil | undefined {
  return AKIS_PROFILLER.find((p) => p.kullanici === kullanici);
}

// ── Gönderi tohumları ─────────────────────────────────────────────────────────
const KONULAR: { baslik: string; tur: AkisTur; model: string; kategori: string; etiket: string[] }[] = [
  { baslik: "Neon Şehir Turu", tur: "video", model: "Veo 3.1", kategori: "sinematik", etiket: ["#neon", "#şehir", "#gece"] },
  { baslik: "Editöryel Moda Serisi", tur: "gorsel", model: "Ruh 2.0", kategori: "portre", etiket: ["#moda", "#editöryel"] },
  { baslik: "Sci-Fi Robot Yürüyüşü", tur: "video", model: "Kling 3.0", kategori: "3d", etiket: ["#scifi", "#robot"] },
  { baslik: "Gün Batımı Sahili", tur: "video", model: "Seedance 2.0", kategori: "manzara", etiket: ["#günbatımı", "#huzur"] },
  { baslik: "Fantastik Orman Perisi", tur: "gorsel", model: "Ruh Sinema", kategori: "sinematik", etiket: ["#fantastik", "#orman"] },
  { baslik: "Cyberpunk Sokak Yağmuru", tur: "video", model: "Sora 2", kategori: "sinematik", etiket: ["#cyberpunk", "#yağmur"] },
  { baslik: "Altın Saat Portresi", tur: "gorsel", model: "Nano Banana Pro", kategori: "portre", etiket: ["#portre", "#altınsaat"] },
  { baslik: "Uzay İstasyonu Yörüngesi", tur: "video", model: "Veo 3.1", kategori: "3d", etiket: ["#uzay", "#yörünge"] },
  { baslik: "Retro Sinemaskop Rüyası", tur: "video", model: "Ruh Sinema", kategori: "sinematik", etiket: ["#retro", "#film"] },
  { baslik: "Su Altı Kristal Şehri", tur: "gorsel", model: "Seedream 5.0 Pro", kategori: "manzara", etiket: ["#sualtı", "#kristal"] },
  { baslik: "Volkanik Manzara", tur: "video", model: "Seedance 2.0", kategori: "manzara", etiket: ["#volkan", "#epik"] },
  { baslik: "Samuray Düellosu", tur: "video", model: "Kling 3.0", kategori: "sinematik", etiket: ["#samuray", "#aksiyon"] },
  { baslik: "Aurora Gecesi", tur: "gorsel", model: "Nano Banana Pro", kategori: "manzara", etiket: ["#aurora", "#kutup"] },
  { baslik: "Steampunk Atölye", tur: "gorsel", model: "Recraft V4.1", kategori: "3d", etiket: ["#steampunk"] },
  { baslik: "Yağmurlu Tokyo Sokağı", tur: "video", model: "Kling 3.0 Turbo", kategori: "sinematik", etiket: ["#tokyo", "#yağmur"] },
  { baslik: "Kristal Mağara Keşfi", tur: "video", model: "Veo 3.1", kategori: "manzara", etiket: ["#mağara", "#keşif"] },
  { baslik: "Barok Balo Salonu", tur: "gorsel", model: "Ruh 2.0", kategori: "portre", etiket: ["#barok", "#lüks"] },
  { baslik: "Nebula Yolculuğu", tur: "video", model: "Sora 2", kategori: "3d", etiket: ["#nebula", "#uzay"] },
  { baslik: "Vahşi Batı Kasabası", tur: "gorsel", model: "Seedream 5.0 Pro", kategori: "sinematik", etiket: ["#western"] },
  { baslik: "Işık Festivali", tur: "video", model: "Seedance 2.0", kategori: "sinematik", etiket: ["#festival", "#ışık"] },
  { baslik: "Buz Sarayı", tur: "gorsel", model: "Nano Banana Pro", kategori: "manzara", etiket: ["#buz", "#saray"] },
  { baslik: "Robot Bahçıvan", tur: "video", model: "Kling 3.0", kategori: "3d", etiket: ["#robot", "#bahçe"] },
  { baslik: "Deniz Feneri Fırtınası", tur: "video", model: "Veo 3.1", kategori: "manzara", etiket: ["#fener", "#fırtına"] },
  { baslik: "Mistik Dağ Manastırı", tur: "gorsel", model: "Ruh Sinema", kategori: "manzara", etiket: ["#dağ", "#mistik"] },
  { baslik: "Karnaval Gecesi", tur: "video", model: "Kling 3.0 Turbo", kategori: "sinematik", etiket: ["#karnaval"] },
  { baslik: "Kozmik Bahçe", tur: "gorsel", model: "Seedream 5.0 Pro", kategori: "soyut", etiket: ["#kozmik", "#soyut"] },
  { baslik: "Titan Savaşı", tur: "video", model: "Sora 2", kategori: "sinematik", etiket: ["#epik", "#savaş"] },
  { baslik: "Rüya Kapısı", tur: "gorsel", model: "Ruh 2.0", kategori: "soyut", etiket: ["#rüya", "#sürreel"] },
  { baslik: "Piksel Kahramanı", tur: "video", model: "Recraft V4.1", kategori: "3d", etiket: ["#piksel", "#oyun"] },
  { baslik: "Sisli Vadi Şafağı", tur: "video", model: "Seedance 2.0", kategori: "manzara", etiket: ["#sis", "#şafak"] },
  { baslik: "Ejder Yuvası", tur: "gorsel", model: "Nano Banana Pro", kategori: "sinematik", etiket: ["#ejder", "#fantastik"] },
  { baslik: "Fütüristik Metro", tur: "video", model: "Kling 3.0", kategori: "sinematik", etiket: ["#metro", "#fütürist"] },
  { baslik: "Tropik Cennet Adası", tur: "gorsel", model: "Seedream 5.0 Pro", kategori: "manzara", etiket: ["#tropik", "#ada"] },
  { baslik: "Gölge Avcısı", tur: "video", model: "Sora 2", kategori: "sinematik", etiket: ["#aksiyon", "#gölge"] },
  { baslik: "Kuantum Laboratuvarı", tur: "gorsel", model: "Recraft V4.1", kategori: "3d", etiket: ["#kuantum", "#bilim"] },
  { baslik: "Antik Tapınak Keşfi", tur: "video", model: "Veo 3.1", kategori: "sinematik", etiket: ["#antik", "#macera"] },
  { baslik: "Kutup Ekspresi", tur: "video", model: "Kling 3.0 Turbo", kategori: "sinematik", etiket: ["#tren", "#kar"] },
  { baslik: "Denizatı Krallığı", tur: "gorsel", model: "Ruh Sinema", kategori: "manzara", etiket: ["#deniz", "#masal"] },
  { baslik: "Zaman Makinesi", tur: "video", model: "Sora 2", kategori: "3d", etiket: ["#zaman", "#scifi"] },
  { baslik: "Çöl Gülü", tur: "gorsel", model: "Nano Banana Pro", kategori: "portre", etiket: ["#çöl", "#estetik"] },
];

const MUZIKLER = [
  "Orijinal ses", "Midnight Drive — synthwave", "Ambient Dreams — lofi", "Epic Rise — trailer",
  "Neon Pulse — electro", "Silk & Gold — cinematic", "Rainfall — ambient", "Titan — orchestral",
];

/** Deterministik feed tohumları (SSR güvenli, 40 gönderi). */
export const AKIS_TOHUM: AkisGonderi[] = KONULAR.map((k, i) => {
  const yazar = tohumSec(k.baslik + i, PROFIL_TANIM).kullanici;
  const t = k.baslik + yazar;
  const goruntulenme = tohumSayi(t + "gr", 4_800, 2_400_000);
  return {
    id: `akis_seed_${i}`,
    kullanici: yazar,
    tur: k.tur,
    baslik: k.baslik,
    aciklama: `${k.baslik} — ${k.model} ile üretildi. ${k.etiket.join(" ")}`,
    model: k.model,
    etiketler: k.etiket,
    gorselUrl: onizlemeArka(k.baslik + k.model, k.kategori),
    oran: "9:16",
    muzik: `${tohumSec(t + "mz", MUZIKLER)} · ${yazar}`,
    begeniTohum: Math.round(goruntulenme * (0.04 + (hash(t + "or") % 12) / 100)),
    goruntulenmeTohum: goruntulenme,
    yorumTohum: tohumSayi(t + "ym", 8, 3_400),
    paylasimTohum: tohumSayi(t + "py", 3, 1_800),
    izinYenidenOlustur: hash(t + "izn") % 10 < 7, // ~%70'i Recreate'e açık
    kredi: k.tur === "video" ? tohumSayi(t + "kr", 40, 60) : tohumSayi(t + "kr", 3, 8),
    olusturmaOfset: tohumSayi(t + "of", 1, 720), // 1 saat – 30 gün
  };
});

// ── Kurgusal yorumlar (gönderi başına deterministik) ─────────────────────────
const YORUM_METIN = [
  "Bu inanılmaz olmuş 🔥", "Nasıl yaptın bunu?? Preset paylaşır mısın?", "Renkler efsane 😍",
  "Kaydettim, ilham aldım teşekkürler", "Model hangisiydi tam olarak?", "Bu ay gördüğüm en iyi iş",
  "Işıklandırma çok gerçekçi", "Vayra ile bu kalite delilik", "Yeniden oluşturdum, harika döndü 🙌",
  "Atmosfer muazzam", "Bunu duvar kağıdı yaptım", "Devamı gelsin lütfen 👏", "Kompozisyon kusursuz",
  "Sesle birlikte çok daha iyi olmuş", "Trend olmayı hak ediyor", "Sen bir efsanesin agam",
];
const YORUM_YAZAR = ["@pixelforge", "@echostudio", "@render.house", "@auroraworks", "@monolith.co", "@synthwave", "@lunavisuals", "@0xrender"];

export type AkisYorum = { id: string; kullanici: string; metin: string; begeni: number; ofset: number };

/** Bir gönderi için deterministik kurgusal yorumlar (2–5 adet). */
export function tohumYorumlar(gonderiId: string): AkisYorum[] {
  const adet = 2 + (hash(gonderiId + "ya") % 4);
  return Array.from({ length: adet }, (_, i) => {
    const t = gonderiId + "y" + i;
    return {
      id: `${gonderiId}_ky${i}`,
      kullanici: tohumSec(t + "yz", YORUM_YAZAR),
      metin: tohumSec(t + "mt", YORUM_METIN),
      begeni: tohumSayi(t + "bg", 0, 480),
      ofset: tohumSayi(t + "of", 1, 240),
    };
  });
}

/** Görüntülenme / beğeni gibi büyük sayıları TikTok gibi kısaltır: 12.4B, 1.2M. */
export function kisaSayi(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return (n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(".0", "") + "B";
  return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
}

/** Ofset saatten "3sa önce", "2g önce" üretir (Date.now olmadan, göreli). */
export function goreliZaman(ofsetSaat: number): string {
  if (ofsetSaat < 1) return "az önce";
  if (ofsetSaat < 24) return `${ofsetSaat}sa önce`;
  const g = Math.floor(ofsetSaat / 24);
  if (g < 7) return `${g}g önce`;
  const h = Math.floor(g / 7);
  return `${h}h önce`;
}
