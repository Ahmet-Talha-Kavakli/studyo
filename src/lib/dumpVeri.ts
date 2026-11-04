/**
 * Photodump / Instadump paketleri. Her paket bir tema tarifi taşır; set, sabit kadraj listesindeki
 * K kare istemiyle (kadraj + tema) üretilir. Her kare ayrı bir üretimdir ve aynı kişi referansını alır.
 * Görseller projedeki gerçek dosyalardır (yalnız kapak/örnek; üretime gönderilmez).
 */
export type DumpKategori = "Kadın" | "Erkek" | "Nötr" | "Tematik";
export type DumpPaket = { id: string; ad: string; kat: DumpKategori; kapak: [string, string, string]; tema: string; not: string; yeni?: boolean;
  /** Paketin örnek kareleri (kapak dahil). Ayrıntı panelinde ve demo çıktısında gösterilir. */
  ornekler?: string[];
  /** Gönderi metni önerileri (Türkçe) ve etiketler. */
  metinler?: string[]; etiketler?: string[] };

const g = (y: string) => `/gercek/${y}.webp`;

export const DUMP_PAKETLERI: DumpPaket[] = [
  { id: "cool-girl", ad: "Cool Girl Dump", kat: "Kadın", kapak: [g("panel/photodump0"), g("moodboard/mood-flash"), g("moodboard/mood-oldphone")], tema: "effortless cool-girl photodump, 35mm point-and-shoot look, direct flash, casual city outfits", not: "Flaş, kafe, şehir; rahat ve havalı", ornekler: [g("panel/photodump2"), g("moodboard/mood-swag"), g("panel/gal-soulcinema-2")], metinler: ["şehirde sıradan bir gün, sıradan olmayan ışık","kahve, flaş, tekrar","bu hafta kamerama ne girdiyse"], etiketler: ["photodump","35mm","citygirl","flaş"] },
  { id: "erkek-arsiv", ad: "Erkek Arşivi", kat: "Erkek", kapak: [g("panel/gal-soulcinema-1"), g("arac/street0"), g("panel/gal-soulcinema-7")], tema: "understated menswear, muted documentary tones, candid analog moments", not: "Sakin tonlar, belgesel anlar", ornekler: [g("arac/fashion-street"), g("moodboard/mood-y2kstreet"), g("gorsel/mood-editoryel-sokak")], metinler: ["az konuş, çok yürü","arşivden birkaç kare","sakin bir hafta"], etiketler: ["menswear","arşiv","analog","günlük"] },
  { id: "altin-saat", ad: "Altın Saat", kat: "Nötr", kapak: [g("kesfet/altin-saat-portresinano-banana-pro"), g("kesfet/altin-saat"), g("arac/vfx-summer")], tema: "golden hour warm sunlight, soft lens flare, dreamy summer evening", not: "Sıcak ışık, uzun gölgeler", ornekler: [g("kesfet/altin-saat-portresiatlas-creative"), g("kesfet/gun-batimi11"), g("moodboard/mood-retro")], metinler: ["güneş batarken her şey daha iyi","altın saat, altın kareler","günün en güzel on dakikası"], etiketler: ["altınsaat","günbatımı","yaz","ışık"] },
  { id: "kafe", ad: "Kafe Günü", kat: "Nötr", kapak: [g("panel/gal-soulcinema-2"), g("panel/photodump0"), g("moodboard/mood-warm")], tema: "cozy café day, warm interior light, latte art, rainy window reflections", not: "Kahve, yağmurlu cam, sıcak iç mekân", ornekler: [g("gorsel/mood-sicak-ambiyans"), g("panel/gal-soul2-1"), g("panel/gal-soul2-6")], metinler: ["yağmur dışarıda, ben içeride","bir kahve daha lütfen","kafe günlüğü, bölüm 12"], etiketler: ["kafe","kahve","yağmurlugün","photodump"] },
  { id: "gece", ad: "Gece Flaşı", kat: "Nötr", kapak: [g("moodboard/mood-night"), g("moodboard/mood-flash"), g("panel/gal-soulcinema-4")], tema: "night out, direct on-camera flash, neon reflections, grainy high-ISO film", not: "Neon, flaş, gece dışarıda", yeni: true, ornekler: [g("moodboard/mood-oldphone"), g("panel/photodump2"), g("kesfet/cyberpunk-sokakechostudio")], metinler: ["gece daha yeni başladı","flaş açık, plan yok","sabaha karşı arşiv"], etiketler: ["gece","flaş","neon","dışarıda"] },
  { id: "yaz", ad: "Yaz Tatili", kat: "Tematik", kapak: [g("moodboard/mood-swag"), g("kesfet/gun-batimi-sahiliwanderer"), g("moodboard/mood-retro")], tema: "summer vacation, beach and pool, sun-bleached colors, holiday mood", not: "Plaj, havuz, güneş", ornekler: [g("arac/vfx-summer"), g("kesfet/gun-batimi-sahiliseedance-2-0")], metinler: ["tuzlu saçlar, sıfır plan","yaz bitmesin diye","güneş kremi ve kötü kararlar"], etiketler: ["yaz","tatil","deniz","havuz"] },
  { id: "kis", ad: "Kış Masalı", kat: "Tematik", kapak: [g("arac/winter0"), g("gorsel/mood-sicak-ambiyans"), g("kesfet/kar-tozu")], tema: "snowy winter, knit scarves, cold blue daylight and cozy warm indoor light", not: "Kar, örgü, sıcak içecek", ornekler: [g("kesfet/buz-sarayinano-banana-pro"), g("panel/gal-soul2-6"), g("kesfet/kis-ormani-ruyasivividworks")], metinler: ["dışarısı soğuk, kareler sıcak","kar yağınca her şey yavaşlar","atkı mevsimi açıldı"], etiketler: ["kış","kar","örgü","sıcakçikolata"] },
  { id: "aura", ad: "Aura Farming", kat: "Tematik", kapak: [g("arac/aura1"), g("gorsel/mood-dunya-disi"), g("gorsel/mood-y2k-studyo")], tema: "glowing aura energy, neon particles around the body, surreal cinematic night", not: "Işık enerjisi, sürreal", yeni: true, ornekler: [g("kesfet/isik-festivaliechostudio"), g("kesfet/aurora-gecesisynthwave"), g("kesfet/neon-sehir-turucinemadreams")], metinler: ["enerjimi korumak için buradayım","aura yüksek, beklenti düşük","ışık bende"], etiketler: ["aura","enerji","gece","sürreal"] },
  { id: "y2k", ad: "2000'ler", kat: "Tematik", kapak: [g("moodboard/mood-y2k"), g("moodboard/mood-y2kstreet"), g("moodboard/mood-swag")], tema: "Y2K 2000s nostalgia, glossy fabrics, low-rise jeans, compact digital camera flash", not: "Dijital kamera, parlak kumaş", ornekler: [g("panel/gal-soul2-7"), g("moodboard/mood-pastel"), g("gorsel/mood-y2k-studyo")], metinler: ["2004'ten selamlar","dijital kamera geri döndü","düşük bel, yüksek moral"], etiketler: ["y2k","2000ler","nostalji","dijitalkamera"] },
  { id: "editoryel", ad: "Editöryel", kat: "Kadın", kapak: [g("arac/fashion-noir"), g("arac/fashion-bold"), g("kesfet/editorial-moda1")], tema: "high-fashion editorial, controlled studio lighting, magazine styling", not: "Dergi çekimi, stüdyo ışığı", ornekler: [g("kesfet/editorial-moda-serisistudio-ela"), g("kesfet/editoryel-moda-serisiruh-2-0"), g("arac/fashion-gradient")], metinler: ["sayfa 34'ten bir kare","stüdyo günü","kapak denemesi"], etiketler: ["editoryel","moda","stüdyo","portre"] },
  { id: "sokak", ad: "Sokak Stili", kat: "Erkek", kapak: [g("arac/street0"), g("arac/fashion-street"), g("moodboard/mood-street")], tema: "street style, graffiti walls and crosswalks, natural daylight", not: "Grafiti, kaldırım, gün ışığı", ornekler: [g("gorsel/mood-editoryel-sokak"), g("moodboard/mood-y2kstreet"), g("kesfet/yagmurlu-tokyoauralab")], metinler: ["kaldırım benim podyumum","şehirde bir tur","grafiti önünde dur, poz ver"], etiketler: ["sokakstili","şehir","ootd","günışığı"] },
  { id: "film-gezi", ad: "Film Seyahat", kat: "Nötr", kapak: [g("moodboard/mood-retro"), g("kesfet/deniz-fenerimonolith-co"), g("kesfet/gun-batimi-sahiliwanderer")], tema: "travel diary on analog film, coastal towns and markets, soft grain", not: "Analog film, yol günlüğü", ornekler: [g("kesfet/altin-saat"), g("panel/gal-soulcinema-7"), g("kesfet/sinematik-sahil3")], metinler: ["yol günlüğünden sayfalar","film bitti, anılar kaldı","bir sahil kasabası, otuz altı poz"], etiketler: ["seyahat","analogfilm","yolgünlüğü","gezi"] },
];
export const DUMP_KATEGORILERI: DumpKategori[] = ["Kadın", "Erkek", "Nötr", "Tematik"];

/** Kare kadrajları — set boyunca sırayla kullanılır (photodump çeşitliliği). */
export const KADRAJLAR: { ad: string; istem: string }[] = [
  { ad: "Ayna selfie", istem: "mirror selfie holding a phone, casual pose" },
  { ad: "Gülerken", istem: "candid laughing moment, looking away from the camera" },
  { ad: "Yakın portre", istem: "close-up portrait, direct gaze into the lens" },
  { ad: "Arkadan", istem: "walking away and looking back over the shoulder" },
  { ad: "Masada", istem: "sitting at a table with a drink, relaxed" },
  { ad: "Flaşlı", istem: "direct flash photo, slightly overexposed, spontaneous" },
  { ad: "Siluet", istem: "backlit silhouette with warm light around the hair" },
  { ad: "Detay", istem: "detail shot of hands, rings and accessories, face partly visible" },
  { ad: "Boy çekim", istem: "full body outfit shot standing against a textured wall" },
  { ad: "Üstten", istem: "top-down shot lying down, hair spread out" },
  { ad: "Araba", istem: "in the passenger seat of a car, window light on the face" },
  { ad: "Hareket", istem: "crossing the street with motion-blurred background" },
  { ad: "Asansör", istem: "elevator selfie with soft overhead light" },
  { ad: "Atıştırma", istem: "candid while eating a snack, unposed" },
  { ad: "Bulanık an", istem: "slightly blurry motion candid with heavy film grain" },
];

export function kareIstemi(kim: string, paketTema: string, i: number): { istem: string; kadraj: string } {
  const k = KADRAJLAR[i % KADRAJLAR.length];
  // Kadraj listesi bitince (26 karelik set) aynı kadraj farklı mekân ve kıyafetle tekrar gelir.
  const tur = Math.floor(i / KADRAJLAR.length);
  return {
    kadraj: tur ? `${k.ad} ${tur + 1}` : k.ad,
    istem: `${kim}, ${k.istem}${tur ? ", in a different location and outfit than the earlier similar shot" : ""}. Style: ${paketTema}. Same person and identity in every photo, authentic social-media photodump, natural skin, not posed like an advert.`,
  };
}

/** Paketin tüm örnek kareleri: kapak + ek örnekler (tekrarsız). */
export const paketOrnekleri = (p: DumpPaket) => [...new Set([...p.kapak, ...(p.ornekler ?? [])])];
