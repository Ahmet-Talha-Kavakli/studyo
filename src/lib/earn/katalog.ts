import type { Gorev, Yarisma } from "@/store/useEarn";

/* Earn platformu statik kataloğu — açık görevler ve yarışmalar (deterministik seed). */

const G = 86400000;
// referans "şimdi" (deterministik değil ama katalog client'ta okunur; sabit ofsetler)
const T = () => Date.now();

export const ACIK_GOREVLER: Gorev[] = [
  { id: "g-reel5", baslik: "5 Reel Serisi: Sinematik Portre", aciklama: "Vayra ile ürettiğin 5 sinematik portre reel'ini Flow'da paylaş. Her biri en az 30sn.", odul: 5000, xp: 4000, sonTarih: T() + 7 * G, kategori: "İçerik Üretimi", kotaKalan: 120 },
  { id: "g-tanit", baslik: "Yeni Özellik Tanıtımı: Süper Beğeni", aciklama: "Süper Beğeni özelliğini anlatan bir video hazırla ve sosyal medyada paylaş.", odul: 8000, xp: 6000, sonTarih: T() + 5 * G, kategori: "Tanıtım", kotaKalan: 45 },
  { id: "g-egitim", baslik: "Eğitim İçeriği: İlk Videonu Üret", aciklama: "Yeni kullanıcılar için Vayra'da ilk video üretimini anlatan bir rehber içerik.", odul: 6500, xp: 5000, sonTarih: T() + 10 * G, kategori: "Eğitim", kotaKalan: 80 },
  { id: "g-3d", baslik: "3D Vitrin: Ürün Görselleştirme", aciklama: "Vayra 3D ile bir ürün sahnesini görselleştir, süreç videosunu paylaş.", odul: 12000, xp: 9000, sonTarih: T() + 14 * G, kategori: "İçerik Üretimi", kotaKalan: 30 },
  { id: "g-music", baslik: "Müzik + Görsel Klip", aciklama: "Vayra müzik ve görsel üretimini birleştiren 60sn'lik bir klip.", odul: 10000, xp: 7500, sonTarih: T() + 8 * G, kategori: "İçerik Üretimi", kotaKalan: 60 },
];

export const YARISMALAR: Yarisma[] = [
  { id: "y-yaz", ad: "Yaz Estetiği Yarışması", tema: "Sıcak tonlar, güneş, tatil atmosferi", odulHavuzu: 100000, bitis: T() + 6 * G, katilimci: 342, durum: "aktif" },
  { id: "y-scifi", ad: "Bilim Kurgu Sahnesi", tema: "Distopik şehir, neon, gelecek", odulHavuzu: 150000, bitis: T() + 12 * G, katilimci: 218, durum: "aktif" },
  { id: "y-portre", ad: "Editorial Portre Ustalığı", tema: "Moda dergisi kalitesinde portre", odulHavuzu: 80000, bitis: T() - 2 * G, katilimci: 511, durum: "bitti" },
];

export const AFFILIATE_PLANLAR = [
  { plan: "Plus", aylik: 199, komisyon: 0.25 },
  { plan: "Ultra", aylik: 499, komisyon: 0.25 },
  { plan: "Kurumsal", aylik: 1999, komisyon: 0.30 },
];

// Kazanç yolu tanımları — ikon = lucide component adı (emoji YOK, glass-ikon ile render edilir)
export const KAZANC_YOLLARI = [
  { id: "flow", ad: "Flow İçerik Performansı", ozet: "Flow'da ürettiğin içeriğin görüntülenme ve etkileşimine göre otomatik kredi.", ikon: "Video", yol: "/earn/flow" },
  { id: "sosyal", ad: "Sosyal Paylaşım", ozet: "Instagram, TikTok, YouTube, Facebook'ta paylaş; görüntülenmene göre kazan.", ikon: "Share2", yol: "/earn/sosyal" },
  { id: "referans", ad: "Referans Programı", ozet: "Arkadaşını davet et; o üretim yaptıkça iki kademe kazanç.", ikon: "Users", yol: "/earn/referans" },
  { id: "affiliate", ad: "Affiliate Ortaklık", ozet: "Kendi linkinle abonelik sat, %25'e varan yinelenen komisyon.", ikon: "Briefcase", yol: "/earn/affiliate" },
  { id: "bounty", ad: "Görev Pazarı", ozet: "Vayra'nın açtığı özel görevleri tamamla, sabit ödül al.", ikon: "Target", yol: "/earn/gorevler" },
  { id: "marketplace", ad: "Marketplace", ozet: "Ürettiğin preset, karakter, ses ve şablonları sat, %70 pay al.", ikon: "ShoppingBag", yol: "/earn/marketplace" },
  { id: "yarisma", ad: "Yarışmalar", ozet: "Temalı yarışmalara katıl, ödül havuzundan pay kazan.", ikon: "Trophy", yol: "/earn/yarismalar" },
];
