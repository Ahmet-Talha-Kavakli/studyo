/** Hazır ruh panoları — tek liste (Ruh panosu sayfası ve görsel stüdyosu köprüsü). Görseller projedeki gerçek dosyalardır. */
export type PanoKategori = "Karanlık" | "Film" | "Editöryel" | "Sokak" | "Y2K" | "Pastel" | "Doğa";
export type HazirPano = { id: string; ad: string; kat: PanoKategori; gorseller: string[]; not: string };

const g = (d: string) => `/gercek/gorsel/mood-${d}.webp`;
const m = (d: string) => `/gercek/moodboard/${d}.webp`;

export const HAZIR_PANOLAR_TAM: HazirPano[] = [
  { id: "karanlik-couture", ad: "Karanlık Couture", kat: "Karanlık", gorseller: ["mood-h1", "mood-h2", "mood-h3", "mood-h4"].map(m), not: "Siyah kumaş, sert yan ışık, dramatik hareket" },
  { id: "gotik-editoryel", ad: "Gotik Editöryel", kat: "Karanlık", gorseller: ["mb-iyi-0", "mb-iyi-1", "mb-iyi-2", "mb-iyi-3"].map(m), not: "Katedral loşluğu, uçuşan etekler" },
  { id: "sicak-ambiyans", ad: "Sıcak Ambiyans", kat: "Film", gorseller: [g("sicak-ambiyans")], not: "Şömine, kehribar lambalar, yumuşak gölge" },
  { id: "sicak-canli-film", ad: "Sıcak Canlı Film", kat: "Film", gorseller: [g("sicak-canli-film")], not: "Doygun turuncu, analog doku" },
  { id: "tek-kullanimlik", ad: "Tek Kullanımlık Kamera", kat: "Film", gorseller: [g("tek-kullanimlik-kamera")], not: "Flaş, tarih damgası, anı fotoğrafı" },
  { id: "notr-pastel-film", ad: "Nötr Pastel Film", kat: "Pastel", gorseller: [g("notr-pastel-film")], not: "Kâğıt dokusu, soluk pastel, sakin" },
  { id: "editoryel-sokak", ad: "Editöryel Sokak", kat: "Editöryel", gorseller: [g("editoryel-sokak")], not: "Şehirde moda yürüyüşü, nötr tonlar" },
  { id: "teatral-isik", ad: "Teatral Işık", kat: "Editöryel", gorseller: [g("teatral-isik")], not: "Spot ışığı, karanlık sahne" },
  { id: "y2k-studyo", ad: "Y2K Stüdyo", kat: "Y2K", gorseller: [g("y2k-studyo")], not: "Metalik kumaş, mor ışık, 2000'ler" },
  { id: "y2k-sokak", ad: "Y2K Sokak", kat: "Y2K", gorseller: [g("y2k-sokak")], not: "Atari ışıkları, kot, flaş" },
  { id: "2000ler-grup", ad: "2000'ler Grup", kat: "Y2K", gorseller: [g("2000ler-grup")], not: "Arkadaş fotoğrafları, sıcak flaş" },
  { id: "frutiger-aero", ad: "Frutiger Aero", kat: "Y2K", gorseller: [g("frutiger-aero")], not: "Cam baloncuklar, gök mavisi, parlak" },
  { id: "swag-donemi", ad: "Swag Dönemi", kat: "Sokak", gorseller: [g("swag-donemi")], not: "Hip hop, aksesuar, gece" },
  { id: "drain", ad: "Drain", kat: "Karanlık", gorseller: [g("drain")], not: "Islak beton, soğuk yeşil, endüstriyel" },
  { id: "80ler-korku", ad: "80'ler Korku", kat: "Karanlık", gorseller: [g("80ler-korku")], not: "VHS, kırmızı göz, karanlık oda" },
  { id: "dunya-disi", ad: "Dünya Dışı", kat: "Doğa", gorseller: [g("dunya-disi")], not: "Nebula, kristal, mor-mavi" },
  { id: "doga-isigi", ad: "Doğa Işığı", kat: "Doğa", gorseller: [g("doga-isigi")], not: "Altın saat, buğday, sis" },
  { id: "su-alti", ad: "Su Altı", kat: "Doğa", gorseller: [g("su-alti")], not: "Derin mavi, kostik ışık" },
  { id: "yeni-indie", ad: "Yeni Indie", kat: "Film", gorseller: [g("yeni-indie")], not: "Gri gün, yağmurlu cam, sade" },
  { id: "flash", ad: "Flaş Gecesi", kat: "Sokak", gorseller: [m("mood-flash")], not: "Direkt flaş, beyaz duvar, rahat poz" },
  { id: "gece-sehri", ad: "Gece Şehri", kat: "Karanlık", gorseller: [m("mood-night")], not: "Bokeh, sıcak ten, gece ışıkları" },
  { id: "eski-telefon", ad: "Eski Telefon", kat: "Sokak", gorseller: [m("mood-oldphone")], not: "Düşük ışık, gren, tuğla duvar" },
  { id: "pastel-ruya", ad: "Pastel Rüya", kat: "Pastel", gorseller: [m("mood-pastel")], not: "Şeker pembe, kelebek, yumuşak" },
  { id: "retro-yol", ad: "Retro Yol", kat: "Film", gorseller: [m("mood-retro")], not: "70'ler, çöl, klasik araba" },
  { id: "sokak", ad: "Grafiti Sokak", kat: "Sokak", gorseller: [m("mood-street")], not: "Grafiti duvar, gün ışığı" },
  { id: "yaz-swag", ad: "Yaz Swag", kat: "Sokak", gorseller: [m("mood-swag")], not: "Havuz kenarı, güneş, rahat" },
  { id: "teatral", ad: "Sahne Siluet", kat: "Editöryel", gorseller: [m("mood-theatr")], not: "Tek spot, siyah sahne, heykelsi" },
  { id: "sicak-ic", ad: "Sıcak İç Mekân", kat: "Editöryel", gorseller: [m("mood-warm")], not: "Kadife, öğle ışığı, sakin" },
  { id: "y2k-renk", ad: "Y2K Renk", kat: "Y2K", gorseller: [m("mood-y2k")], not: "Düz mavi fon, saten mor" },
  { id: "benzinlik", ad: "Benzinlik Pop", kat: "Sokak", gorseller: [m("mood-y2kstreet")], not: "Bayrak tişört, gün ışığı, Amerika" },
  { id: "minimal", ad: "Minimal Beyaz", kat: "Pastel", gorseller: [m("mood-minimal")], not: "Beyaz keten, krem fon, sade" },
  { id: "genel", ad: "Sessiz İç Mekân", kat: "Pastel", gorseller: [g("genel")], not: "Bej, seramik, yumuşak gün ışığı" },
];
export const PANO_KATEGORILERI: PanoKategori[] = ["Karanlık", "Film", "Editöryel", "Sokak", "Y2K", "Pastel", "Doğa"];
/** Bir modelin dikkate aldığı stil görseli sayısı (Gemini Pro belgesi: 3). */
export const STIL_REF_SINIRI = 3;
