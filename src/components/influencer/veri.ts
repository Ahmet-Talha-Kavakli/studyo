/* AI Influencer Stüdyosu — sabit veri, istem kurucular ve içerik planı üreticisi.
   Görsellerin tamamı gerçek dosyalardır (public/gercek/…). */
import type { InfOzellikler, Influencer } from "@/store/useInfluencer";
import { videoErisim } from "@/lib/videoSaglayici";

export const ARAC_ADI = "AI Influencer";

const G = "/gercek";
const av = (ad: string) => `${G}/paz/av-${ad}.webp`;
const inf = (ad: string) => `${G}/influencer/${ad}.webp`;

export type Secenek = { id: string; ad: string; alt?: string; kapak: string; en: string; renk?: string };

/* ═════════ Görünüş ═════════ */
export const CINSIYET: Secenek[] = [
  { id: "kadin", ad: "Kadın", kapak: av("naomi"), en: "woman" },
  { id: "erkek", ad: "Erkek", kapak: av("lucas"), en: "man" },
  { id: "androjen", ad: "Androjen", kapak: av("maria"), en: "androgynous person" },
];
export const YAS: Secenek[] = [
  { id: "18-24", ad: "18–24", alt: "Genç yetişkin", kapak: av("lily"), en: "in their early twenties" },
  { id: "25-34", ad: "25–34", alt: "Yirmilerin sonu", kapak: av("emma"), en: "in their late twenties" },
  { id: "35-44", ad: "35–44", alt: "Otuzlar", kapak: av("niko"), en: "in their late thirties" },
  { id: "45+", ad: "45+", alt: "Olgun, zarif", kapak: av("jia"), en: "in their late forties, graceful and mature" },
];
export const KOKEN: Secenek[] = [
  { id: "avrupali", ad: "Avrupalı", kapak: inf("etnik-avrupali"), en: "European" },
  { id: "akdeniz", ad: "Akdeniz · Türk", kapak: `${G}/gorsel/gorsel-karakter-Sofia.webp`, en: "Mediterranean Turkish" },
  { id: "ortadogulu", ad: "Orta Doğulu", kapak: inf("etnik-ortadogulu"), en: "Middle Eastern" },
  { id: "asyali", ad: "Doğu Asyalı", kapak: inf("etnik-asyali"), en: "East Asian" },
  { id: "hintli", ad: "Güney Asyalı", kapak: inf("etnik-hintli"), en: "South Asian" },
  { id: "afrikali", ad: "Afrikalı", kapak: inf("etnik-afrikali"), en: "African" },
  { id: "karisik", ad: "Karışık", kapak: inf("etnik-karisik"), en: "mixed-race" },
];
export const SAC_STIL: Secenek[] = [
  { id: "uzun", ad: "Uzun düz", kapak: inf("sac-uzun"), en: "long straight hair" },
  { id: "dalgali", ad: "Dalgalı", kapak: av("valentina"), en: "long wavy hair" },
  { id: "kivircik", ad: "Kıvırcık", kapak: av("audrey"), en: "curly hair" },
  { id: "afro", ad: "Afro", kapak: inf("sac-afro"), en: "voluminous afro hair" },
  { id: "orgu", ad: "Örgü", kapak: av("sofia"), en: "long braids" },
  { id: "topuz", ad: "Topuz", kapak: av("amara"), en: "hair in a neat bun" },
  { id: "bob", ad: "Küt · bob", kapak: av("mei"), en: "a sleek bob haircut" },
  { id: "kisa", ad: "Kısa", kapak: inf("sac-kisa"), en: "short hair" },
  { id: "kel", ad: "Kazınmış", kapak: inf("sac-kel"), en: "a shaved head" },
];
export const SAC_RENK: Secenek[] = [
  { id: "siyah", ad: "Siyah", kapak: av("scarlett"), en: "black", renk: "#17130f" },
  { id: "kahve", ad: "Kahverengi", kapak: av("naomi"), en: "brown", renk: "#5a3b26" },
  { id: "sari", ad: "Sarı", kapak: `${G}/gorsel/gorsel-karakter-Emma.webp`, en: "blonde", renk: "#e3c27e" },
  { id: "kizil", ad: "Kızıl", kapak: av("valentina"), en: "copper red", renk: "#b5522b" },
  { id: "gri", ad: "Gümüş", kapak: av("zara"), en: "silver grey", renk: "#c9c9cc" },
  { id: "renkli", ad: "Renkli", kapak: inf("sac-punk"), en: "dyed vivid colorful", renk: "#d24fd8" },
];
export const GOZ: Secenek[] = [
  { id: "kahve", ad: "Kahve", kapak: inf("goz-kahve"), en: "warm brown eyes" },
  { id: "siyah", ad: "Koyu", kapak: inf("goz-siyah"), en: "dark eyes" },
  { id: "yesil", ad: "Yeşil", kapak: inf("goz-yesil"), en: "green eyes" },
  { id: "mavi", ad: "Mavi", kapak: inf("goz-mavi"), en: "blue eyes" },
  { id: "gri", ad: "Gri", kapak: inf("goz-gri"), en: "grey eyes" },
];
export const VUCUT: Secenek[] = [
  { id: "ince", ad: "İnce", kapak: inf("vucut-ince"), en: "slim build" },
  { id: "yalin", ad: "Fit", kapak: inf("vucut-yalin"), en: "toned fit build" },
  { id: "atletik", ad: "Atletik", kapak: inf("vucut-atletik"), en: "athletic build" },
  { id: "kasli", ad: "Kaslı", kapak: inf("vucut-kasli"), en: "muscular build" },
  { id: "dolgun", ad: "Dolgun", kapak: inf("vucut-dolgun"), en: "curvy build" },
];
export const TEN_DETAY: Secenek[] = [
  { id: "ciller", ad: "Çiller", kapak: inf("ten-ciller"), en: "natural freckles" },
  { id: "ben", ad: "Güzellik izi", kapak: inf("ten-pigmentasyon"), en: "beauty marks" },
  { id: "dovme", ad: "Dövme", kapak: inf("ten-dovme"), en: "fine-line tattoos" },
  { id: "vitiligo", ad: "Vitiligo", kapak: inf("ten-vitiligo"), en: "vitiligo skin patches" },
  { id: "iz", ad: "Hafif iz", kapak: inf("ten-yaraizleri"), en: "a subtle scar" },
];
export const TARZ: Secenek[] = [
  { id: "zarif", ad: "Zarif", kapak: inf("kiyafet-zarif"), en: "elegant refined fashion" },
  { id: "streetwear", ad: "Sokak", kapak: inf("kiyafet-streetwear"), en: "streetwear fashion" },
  { id: "spor", ad: "Sportif", kapak: inf("kiyafet-spor"), en: "sporty athleisure" },
  { id: "resmi", ad: "Klasik", kapak: inf("kiyafet-resmi"), en: "tailored classic fashion" },
  { id: "bohem", ad: "Bohem", kapak: inf("kiyafet-bohem"), en: "bohemian fashion" },
  { id: "rahat", ad: "Rahat", kapak: inf("kiyafet-rahat"), en: "relaxed casual fashion" },
];
export const AKSESUAR: Secenek[] = [
  { id: "gozluk", ad: "Gözlük", kapak: inf("aksesuar-gozluk"), en: "stylish glasses" },
  { id: "kupe", ad: "Küpe", kapak: inf("aksesuar-kupe"), en: "statement earrings" },
  { id: "kolye", ad: "Kolye", kapak: inf("aksesuar-boyuntakisi"), en: "a delicate necklace" },
  { id: "piercing", ad: "Piercing", kapak: inf("aksesuar-piercing"), en: "small piercings" },
];

export const VARSAYILAN_OZ: InfOzellikler = { cinsiyet: "kadin", yas: "25-34", koken: "akdeniz", sacStil: "dalgali", sacRenk: "kahve", goz: "kahve", vucut: "yalin", tenDetay: [], tarz: "zarif", aksesuar: [] };

const bul = (l: Secenek[], id: string) => l.find((x) => x.id === id);

/** Özelliklerden İngilizce kimlik tarifi (modele giden). */
export function karakterTarifi(o: InfOzellikler): string {
  const c = bul(CINSIYET, o.cinsiyet)?.en ?? "person";
  const parcalar = [
    `a ${bul(KOKEN, o.koken)?.en ?? ""} ${c} ${bul(YAS, o.yas)?.en ?? ""}`.replace(/\s+/g, " ").trim(),
    `${bul(SAC_RENK, o.sacRenk)?.en ?? ""} ${bul(SAC_STIL, o.sacStil)?.en ?? ""}`.trim(),
    bul(GOZ, o.goz)?.en, bul(VUCUT, o.vucut)?.en,
    ...o.tenDetay.map((t) => bul(TEN_DETAY, t)?.en), ...o.aksesuar.map((t) => bul(AKSESUAR, t)?.en),
    `signature style: ${bul(TARZ, o.tarz)?.en ?? "casual"}`,
  ].filter(Boolean);
  return parcalar.join(", ");
}

/** Kimlik kartında gösterilen Türkçe özellik çipleri. */
export function ozellikCipleri(o: InfOzellikler): { ad: string; deger: string }[] {
  return [
    { ad: "Cinsiyet", deger: bul(CINSIYET, o.cinsiyet)?.ad ?? "" },
    { ad: "Yaş", deger: bul(YAS, o.yas)?.ad ?? "" },
    { ad: "Köken", deger: bul(KOKEN, o.koken)?.ad ?? "" },
    { ad: "Saç", deger: [bul(SAC_RENK, o.sacRenk)?.ad, bul(SAC_STIL, o.sacStil)?.ad?.toLocaleLowerCase("tr")].filter(Boolean).join(" · ") },
    { ad: "Göz", deger: bul(GOZ, o.goz)?.ad ?? "" },
    { ad: "Vücut", deger: bul(VUCUT, o.vucut)?.ad ?? "" },
    { ad: "Tarz", deger: bul(TARZ, o.tarz)?.ad ?? "" },
    ...(o.tenDetay.length ? [{ ad: "Ten", deger: o.tenDetay.map((t) => bul(TEN_DETAY, t)?.ad).join(", ") }] : []),
    ...(o.aksesuar.length ? [{ ad: "Aksesuar", deger: o.aksesuar.map((t) => bul(AKSESUAR, t)?.ad).join(", ") }] : []),
  ].filter((x) => x.deger);
}

/* Demo için en yakın örnek portre havuzu (gerçek üretim değildir; kartta DEMO yazar). */
const HAVUZ: { g: string; c: string; k: string; s: string }[] = [
  { g: av("adriana"), c: "kadin", k: "akdeniz", s: "kahve" }, { g: av("amara"), c: "kadin", k: "avrupali", s: "sari" },
  { g: av("audrey"), c: "kadin", k: "avrupali", s: "kizil" }, { g: av("clara"), c: "kadin", k: "asyali", s: "siyah" },
  { g: av("emma"), c: "kadin", k: "avrupali", s: "kahve" }, { g: av("hana"), c: "kadin", k: "asyali", s: "siyah" },
  { g: av("jia"), c: "kadin", k: "asyali", s: "gri" }, { g: av("lily"), c: "kadin", k: "avrupali", s: "sari" },
  { g: av("margot"), c: "kadin", k: "afrikali", s: "siyah" }, { g: av("mei"), c: "kadin", k: "asyali", s: "siyah" },
  { g: av("miso"), c: "kadin", k: "akdeniz", s: "kahve" }, { g: av("naomi"), c: "kadin", k: "akdeniz", s: "kahve" },
  { g: av("nia"), c: "kadin", k: "ortadogulu", s: "kahve" }, { g: av("priya"), c: "kadin", k: "hintli", s: "sari" },
  { g: av("scarlett"), c: "kadin", k: "hintli", s: "siyah" }, { g: av("sofia"), c: "kadin", k: "afrikali", s: "siyah" },
  { g: av("sora"), c: "kadin", k: "asyali", s: "siyah" }, { g: av("valentina"), c: "kadin", k: "avrupali", s: "kizil" },
  { g: av("yuki"), c: "kadin", k: "karisik", s: "kizil" }, { g: av("zara"), c: "kadin", k: "avrupali", s: "gri" },
  { g: `${G}/gorsel/gorsel-karakter-Aria.webp`, c: "kadin", k: "karisik", s: "kahve" }, { g: `${G}/gorsel/gorsel-karakter-Sofia.webp`, c: "kadin", k: "akdeniz", s: "siyah" },
  { g: `${G}/gorsel/gorsel-karakter-Emma.webp`, c: "kadin", k: "avrupali", s: "sari" },
  { g: av("erik"), c: "erkek", k: "avrupali", s: "gri" }, { g: av("jayden"), c: "erkek", k: "ortadogulu", s: "siyah" },
  { g: av("kai"), c: "erkek", k: "avrupali", s: "kahve" }, { g: av("liam"), c: "erkek", k: "akdeniz", s: "siyah" },
  { g: av("lucas"), c: "erkek", k: "avrupali", s: "kahve" }, { g: av("malik"), c: "erkek", k: "akdeniz", s: "kahve" },
  { g: av("marco"), c: "erkek", k: "hintli", s: "siyah" }, { g: av("niko"), c: "erkek", k: "akdeniz", s: "kahve" },
  { g: av("omar"), c: "erkek", k: "ortadogulu", s: "kahve" }, { g: av("ren"), c: "erkek", k: "karisik", s: "siyah" },
  { g: av("ryu"), c: "erkek", k: "avrupali", s: "gri" }, { g: av("stefan"), c: "erkek", k: "avrupali", s: "kahve" },
  { g: av("tae"), c: "erkek", k: "hintli", s: "siyah" }, { g: `${G}/gorsel/gorsel-karakter-Kai.webp`, c: "erkek", k: "asyali", s: "siyah" },
  { g: `${G}/gorsel/gorsel-karakter-Leo.webp`, c: "erkek", k: "avrupali", s: "kahve" }, { g: `${G}/gorsel/gorsel-karakter-Talha.webp`, c: "erkek", k: "akdeniz", s: "siyah" },
  { g: av("maria"), c: "androjen", k: "avrupali", s: "kahve" }, { g: av("minji"), c: "androjen", k: "asyali", s: "gri" },
];
/** Özelliklere en yakın `n` örnek portre (demo adayları). */
export function enYakinOrnekler(o: InfOzellikler, n = 4): string[] {
  return HAVUZ.map((h, i) => ({ g: h.g, p: (h.c === o.cinsiyet ? 6 : 0) + (h.k === o.koken ? 3 : 0) + (h.s === o.sacRenk ? 2 : h.s === "gri" ? -2.5 : 0) - i * 0.001 }))
    .sort((a, b) => b.p - a.p).slice(0, n).map((x) => x.g);
}

/* ═════════ Persona ═════════ */
export const NISLER: Secenek[] = [
  { id: "moda", ad: "Moda", kapak: `${G}/gorsel/mood-editoryel-sokak.webp`, en: "fashion" },
  { id: "guzellik", ad: "Güzellik", kapak: `${G}/paz/paz-selfie-1.webp`, en: "beauty" },
  { id: "fitness", ad: "Fitness", kapak: `${G}/paz/ortam-spor.webp`, en: "fitness" },
  { id: "seyahat", ad: "Seyahat", kapak: `${G}/galeri/manzara2.webp`, en: "travel" },
  { id: "yasam", ad: "Yaşam", kapak: `${G}/moodboard/mood-warm.webp`, en: "lifestyle" },
  { id: "yemek", ad: "Yemek", kapak: `${G}/paz/ortam-mutfak.webp`, en: "food" },
  { id: "teknoloji", ad: "Teknoloji", kapak: `${G}/paz/ortam-ofis.webp`, en: "tech" },
  { id: "oyun", ad: "Oyun", kapak: `${G}/galeri/portre3.webp`, en: "gaming" },
];
export const TONLAR: { id: string; ad: string; alt: string }[] = [
  { id: "samimi", ad: "Samimi", alt: "Arkadaş gibi, sıcak" },
  { id: "esprili", ad: "Esprili", alt: "Şakacı, hafif" },
  { id: "ilham", ad: "İlham veren", alt: "Motive eden" },
  { id: "luks", ad: "Lüks", alt: "Seçkin, ölçülü" },
  { id: "cesur", ad: "Cesur", alt: "İddialı, net" },
  { id: "sakin", ad: "Sakin", alt: "Dingin, estetik" },
];

/* ═════════ Üretim presetleri ═════════ */
export type SahneKat = "yasam" | "sehir" | "seyahat" | "studyo" | "fitness";
export const SAHNE_KAT: { id: SahneKat | "tum"; ad: string }[] = [
  { id: "tum", ad: "Tümü" }, { id: "yasam", ad: "Yaşam" }, { id: "sehir", ad: "Şehir" }, { id: "seyahat", ad: "Seyahat" }, { id: "studyo", ad: "Stüdyo" }, { id: "fitness", ad: "Fitness" },
];
export type Sahne = Secenek & { kat: SahneKat };
export const SAHNELER: Sahne[] = [
  { id: "kafe", kat: "yasam", ad: "Kafe sabahı", kapak: `${G}/galeri/urun5.webp`, en: "at a cozy sunlit café table with a latte" },
  { id: "yatak", kat: "yasam", ad: "Ev · yatak odası", kapak: `${G}/paz/ortam-yatak.webp`, en: "in a cozy bright bedroom with soft linen" },
  { id: "mutfak", kat: "yasam", ad: "Mutfak", kapak: `${G}/paz/ortam-mutfak.webp`, en: "in a bright modern home kitchen" },
  { id: "banyo", kat: "yasam", ad: "Ayna önü", kapak: `${G}/paz/ortam-banyo.webp`, en: "in a clean modern bathroom in front of a lit mirror" },
  { id: "ofis", kat: "yasam", ad: "Çalışma masası", kapak: `${G}/paz/ortam-ofis.webp`, en: "at a minimal home office desk with a laptop" },
  { id: "sokak", kat: "sehir", ad: "Şehir sokağı", kapak: `${G}/paz/ortam-sokak.webp`, en: "on a busy stylish city street" },
  { id: "cati", kat: "sehir", ad: "Çatı · gün batımı", kapak: `${G}/paz/ortam-cati.webp`, en: "on a rooftop overlooking the city at sunset" },
  { id: "neon", kat: "sehir", ad: "Neon gece", kapak: `${G}/galeri/sinematik1.webp`, en: "on a rainy street at night under neon lights" },
  { id: "araba", kat: "sehir", ad: "Arabada", kapak: `${G}/paz/ortam-araba.webp`, en: "sitting in the driver seat of a parked car" },
  { id: "editoryel", kat: "sehir", ad: "Moda haftası", kapak: `${G}/gorsel/mood-editoryel-sokak.webp`, en: "street style outside a fashion week venue" },
  { id: "plaj", kat: "seyahat", ad: "Plaj", kapak: `${G}/galeri/manzara2.webp`, en: "on a white sand tropical beach with turquoise water" },
  { id: "tropik", kat: "seyahat", ad: "Tropik patika", kapak: `${G}/paz/ortam-doga.webp`, en: "on a lush tropical path leading to the sea" },
  { id: "dag", kat: "seyahat", ad: "Dağ gölü", kapak: `${G}/galeri/manzara1.webp`, en: "by a mirror-like alpine lake with mountains behind" },
  { id: "lavanta", kat: "seyahat", ad: "Lavanta tarlası", kapak: `${G}/galeri/manzara6.webp`, en: "in a blooming lavender field at golden hour" },
  { id: "col", kat: "seyahat", ad: "Çöl yolu", kapak: `${G}/moodboard/mood-retro.webp`, en: "next to a vintage car on a desert road with palm trees" },
  { id: "kis", kat: "seyahat", ad: "Kış köyü", kapak: `${G}/galeri/sinematik11.webp`, en: "in a snowy mountain village at blue hour" },
  { id: "renkli", kat: "studyo", ad: "Renkli stüdyo", kapak: `${G}/gorsel/mood-y2k-studyo.webp`, en: "in a colorful playful photo studio set" },
  { id: "minimal", kat: "studyo", ad: "Beyaz fon", kapak: `${G}/moodboard/mood-minimal.webp`, en: "against a seamless off-white studio backdrop" },
  { id: "flas", kat: "studyo", ad: "Flaşlı gece", kapak: `${G}/moodboard/mood-flash.webp`, en: "in a direct-flash candid party setting" },
  { id: "pastel", kat: "studyo", ad: "Pastel set", kapak: `${G}/moodboard/mood-pastel.webp`, en: "in a dreamy pastel candy-colored set" },
  { id: "spor", kat: "fitness", ad: "Spor salonu", kapak: `${G}/paz/ortam-spor.webp`, en: "in a modern gym with moody lighting" },
  { id: "kosu", kat: "fitness", ad: "Sabah koşusu", kapak: `${G}/galeri/manzara11.webp`, en: "jogging along a coastal trail in the morning" },
];
export const KIYAFETLER: Secenek[] = [
  { id: "imza", ad: "İmza tarzı", alt: "Karakterin kendi stili", kapak: inf("kiyafet-zarif"), en: "" },
  { id: "streetwear", ad: "Sokak modası", kapak: inf("kiyafet-streetwear"), en: "an oversized streetwear outfit" },
  { id: "spor", ad: "Spor", kapak: inf("kiyafet-spor"), en: "a fitted athletic set" },
  { id: "resmi", ad: "Takım", kapak: inf("kiyafet-resmi"), en: "a tailored suit" },
  { id: "bohem", ad: "Bohem", kapak: inf("kiyafet-bohem"), en: "a flowing bohemian outfit" },
  { id: "rahat", ad: "Rahat", kapak: inf("kiyafet-rahat"), en: "a cozy knit sweater and jeans" },
  { id: "gece", ad: "Gece elbisesi", kapak: `${G}/moodboard/mood-h4.webp`, en: "a sparkling evening gown" },
  { id: "minimal", ad: "Minimal beyaz", kapak: `${G}/moodboard/mood-minimal.webp`, en: "a minimal all-white outfit" },
  { id: "y2k", ad: "Y2K", kapak: `${G}/moodboard/mood-y2k.webp`, en: "a bold Y2K outfit" },
  { id: "denim", ad: "70'ler denim", kapak: `${G}/moodboard/mood-retro.webp`, en: "a 70s denim outfit" },
];
export const POZLAR: Secenek[] = [
  { id: "selfie", ad: "Selfie", alt: "Kol mesafesi", kapak: `${G}/paz/paz-selfie-3.webp`, en: "taking a casual selfie, phone at arm's length" },
  { id: "ayna", ad: "Ayna selfie", alt: "Tam boy, telefonla", kapak: `${G}/paz/paz-sanal-3.webp`, en: "taking a full-body mirror selfie" },
  { id: "yurume", ad: "Yürürken", alt: "Sokak stili", kapak: `${G}/gorsel/mood-editoryel-sokak.webp`, en: "walking toward the camera mid-stride" },
  { id: "oturan", ad: "Oturan", alt: "Rahat, doğal", kapak: `${G}/moodboard/mood-warm.webp`, en: "sitting relaxed, natural candid pose" },
  { id: "yakin", ad: "Yakın portre", alt: "Yüz odaklı", kapak: `${G}/galeri/portre4.webp`, en: "close-up portrait, looking into the lens" },
  { id: "tamboy", ad: "Tam boy", alt: "Kombini göster", kapak: `${G}/paz/paz-sanal-1.webp`, en: "full-body standing pose showing the whole outfit" },
  { id: "omuz", ad: "Omuz üstü", alt: "Geriye bakış", kapak: `${G}/galeri/portre12.webp`, en: "looking back over the shoulder" },
  { id: "dinamik", ad: "Dinamik", alt: "Hareket anı", kapak: `${G}/galeri/portre5.webp`, en: "in a dynamic mid-motion pose" },
];
export const ISIKLAR: Secenek[] = [
  { id: "dogal", ad: "Gün ışığı", alt: "Yumuşak, doğal", kapak: `${G}/gorsel/mood-genel.webp`, en: "soft natural daylight" },
  { id: "altin", ad: "Altın saat", alt: "Sıcak, parlak", kapak: `${G}/galeri/manzara10.webp`, en: "warm golden hour sunlight" },
  { id: "flas", ad: "Flaş", alt: "Direkt, canlı", kapak: `${G}/moodboard/mood-flash.webp`, en: "direct on-camera flash, crisp shadows" },
  { id: "neon", ad: "Neon", alt: "Gece, renkli", kapak: `${G}/moodboard/mood-night.webp`, en: "colorful neon night lighting" },
  { id: "film", ad: "Film tanesi", alt: "Analog his", kapak: `${G}/moodboard/mood-oldphone.webp`, en: "analog film look with subtle grain" },
  { id: "dramatik", ad: "Dramatik", alt: "Spot ışık", kapak: `${G}/moodboard/mood-theatr.webp`, en: "dramatic spotlight with deep shadows" },
];
const VH = (id: string) => ({ kapak: `${G}/video-hareket/${id}-poster.webp`, video: `${G}/video-hareket/${id}.mp4` });
export const HAREKETLER: (Secenek & { video: string })[] = [
  { id: "ugc-handheld", ad: "Elde selfie", alt: "Kameraya konuşur gibi", en: "handheld selfie camera, subtle natural movement, talking to camera", ...VH("ugc-handheld") },
  { id: "viral-spin", ad: "Viral dönüş", alt: "Trend geçiş", en: "spins toward the camera in a viral transition", ...VH("viral-spin") },
  { id: "k-pop", ad: "Dans", alt: "Trend koreografi", en: "performs a short trendy dance", ...VH("k-pop") },
  { id: "slow-motion", ad: "Ağır çekim", alt: "Sinematik an", en: "cinematic slow motion moment, hair moving in the wind", ...VH("slow-motion") },
  { id: "camera-orbit", ad: "Etrafında dönüş", alt: "360° kamera", en: "camera orbits smoothly around the person", ...VH("camera-orbit") },
  { id: "dolly-in", ad: "Yaklaşma", alt: "Yavaş dolly", en: "slow dolly-in toward the face", ...VH("dolly-in") },
  { id: "emotion-zoom", ad: "Duygu yakını", alt: "Yüze zoom", en: "emotional zoom into the face with a soft smile", ...VH("emotion-zoom") },
  { id: "handheld", ad: "Vlog", alt: "Yürürken kayıt", en: "handheld vlog shot following the person walking", ...VH("handheld") },
  { id: "focus-pull", ad: "Odak kayması", alt: "Sinematik geçiş", en: "rack focus from foreground to the person", ...VH("focus-pull") },
  { id: "skate-cruise", ad: "Kaykay", alt: "Şehirde süzülme", en: "cruising on a skateboard through the street", ...VH("skate-cruise") },
  { id: "action-run", ad: "Koşu", alt: "Enerjik", en: "running energetically toward camera", ...VH("action-run") },
  { id: "soul-jump", ad: "Zıplama", alt: "Neşeli an", en: "jumps joyfully in the air", ...VH("soul-jump") },
];

export const FOTO_MODELLER = [
  { deger: "Nano Banana Pro", ad: "Nano Banana Pro", alt: "Referanstan en tutarlı yüz", rozet: "Önerilen", kredi: 5 },
  { deger: "Seedream 5.0 Pro", ad: "Seedream 5.0 Pro", alt: "Yüksek detay, editoryel", kredi: 7 },
  { deger: "GPT Image 2", ad: "GPT Image 2", alt: "İsteme sadık kompozisyon", kredi: 6 },
  { deger: "FLUX.2 Pro", ad: "FLUX.2 Pro", alt: "Keskin doku, doğal ten", kredi: 5 },
];
export const VIDEO_MODELLER = [
  { deger: "Kling 3.0", ad: "Kling 3.0", alt: "Karakter tutarlılığı güçlü", rozet: "Önerilen" },
  { deger: "Kling 4.0", ad: "Kling 4.0", alt: "En yeni Kling, sesli", rozet: "Yeni" },
  { deger: "Seedance 2.0", ad: "Seedance 2.0", alt: "Sinematik hareket" },
  { deger: "MiniMax H3 Max", ad: "MiniMax H3 Max", alt: "Güçlü hareket ve fizik" },
  { deger: "Gemini Omni Flash", ad: "Gemini Omni Flash", alt: "Google, hızlı" },
  { deger: "Minimax Hailuo 2.3", ad: "Hailuo 2.3", alt: "Hızlı ve ekonomik" },
].filter((m) => videoErisim(m.deger).durum === "gercek");

export type PlatformId = "ig-post" | "ig-story" | "tiktok" | "youtube" | "x" | "kare";
export const PLATFORMLAR: { id: PlatformId; ad: string; alt: string; oran: string; logo: string; saat: string }[] = [
  { id: "ig-post", ad: "Instagram gönderi", alt: "4:5 · akışta en büyük alan", oran: "4:5", logo: "/marka/instagram.svg", saat: "19:00" },
  { id: "ig-story", ad: "Reels · Story", alt: "9:16 · tam ekran", oran: "9:16", logo: "/marka/instagram.svg", saat: "20:30" },
  { id: "tiktok", ad: "TikTok", alt: "9:16 · tam ekran", oran: "9:16", logo: "/marka/tiktok.svg", saat: "21:00" },
  { id: "youtube", ad: "YouTube kapak", alt: "16:9 · yatay", oran: "16:9", logo: "/marka/youtube-data.svg", saat: "18:00" },
  { id: "x", ad: "X gönderi", alt: "16:9 · akış görseli", oran: "16:9", logo: "/marka/x.svg", saat: "12:30" },
  { id: "kare", ad: "Kare", alt: "1:1 · profil, katalog", oran: "1:1", logo: "/marka/threads.svg", saat: "13:00" },
];

export type Sadakat = "serbest" | "dengeli" | "siki";

/** Sahne istemi: kimlik + poz + kıyafet + mekân + ışık. */
export function sahneIstemi(k: Influencer, p: { sahne?: Sahne; kiyafet?: Secenek; poz?: Secenek; isik?: Secenek; ek?: string; video?: boolean }): string {
  const kim = k.elementAd ? `@${k.elementAd}` : "the same person from the reference images";
  const kiyafet = p.kiyafet && p.kiyafet.en ? `wearing ${p.kiyafet.en}` : "wearing their signature outfit";
  const parca = [
    `${p.video ? "Social media video" : "Photorealistic social media photo"} of ${kim} (${karakterTarifi(k.ozellikler)})`,
    p.poz?.en, kiyafet, p.sahne?.en, p.isik?.en, p.ek?.trim(),
    "Keep the exact same face, identity and hair as the reference. Natural skin texture, authentic influencer aesthetic, no text, no watermark.",
  ].filter(Boolean);
  return parca.join(", ");
}

/* ═════════ İçerik planı (şablon tabanlı; dil modeli kullanılmaz) ═════════ */
type Fikir = [baslik: string, sahne: string, kiyafet: string, poz: string, isik: string, govde: string];
const FIKIRLER: Record<string, Fikir[]> = {
  moda: [
    ["Haftanın kombini", "sokak", "streetwear", "yurume", "dogal", "Bu haftanın favori kombini hazır: rahat ama iddialı."],
    ["Gece şıklığı", "cati", "gece", "omuz", "altin", "Şehrin ışıkları yanarken en sevdiğim elbiseyle çatıdayım."],
    ["Ayna önü OOTD", "banyo", "imza", "ayna", "dogal", "Bugünün kombinini aynadan paylaşıyorum, detaylar yorumlarda."],
    ["Stüdyo günü", "minimal", "minimal", "tamboy", "flas", "Beyaz fon, tek renk, net çizgiler. Bazen az gerçekten çoktur."],
    ["Retro hafta sonu", "col", "denim", "oturan", "altin", "Yetmişlerin ruhunu hafta sonuna taşıdım."],
    ["Defile çıkışı", "editoryel", "resmi", "yurume", "dogal", "Defileden çıkarken en çok soru alan ceket bu oldu."],
    ["Y2K geri döndü", "renkli", "y2k", "dinamik", "flas", "Y2K modası geri döndü ve ben buna çok hazırım."],
  ],
  guzellik: [
    ["Sabah cilt rutini", "banyo", "rahat", "yakin", "dogal", "Sabah rutinim üç adım: temizle, nemlendir, koru."],
    ["Altın saat ışıltısı", "cati", "imza", "yakin", "altin", "Gün batımı en iyi aydınlatıcıdır, ikna oldum."],
    ["Makyajsız pazar", "yatak", "rahat", "selfie", "dogal", "Bugün makyaj yok, sadece nem ve iyi uyku."],
    ["Gece makyajı", "neon", "gece", "omuz", "neon", "Gece için tek dokunuş: parlak dudak, keskin eyeliner."],
    ["Stüdyo portresi", "minimal", "minimal", "yakin", "flas", "Yakın plan, filtre yok. Cildimin en iyi günü."],
    ["Pastel ruh hali", "pastel", "y2k", "selfie", "dogal", "Pastel tonlar bu hafta paletimde."],
    ["Favori ürünlerim", "kafe", "zarif", "oturan", "dogal", "Çantamdan hiç eksik olmayan üç ürün."],
  ],
  fitness: [
    ["Antrenman günü", "spor", "spor", "ayna", "dramatik", "Bugün bacak günü. Bahane yok, sadece tekrar."],
    ["Sabah koşusu", "kosu", "spor", "dinamik", "altin", "Güne 5 kilometreyle başlamak gibisi yok."],
    ["Esneme rutini", "yatak", "spor", "oturan", "dogal", "Yatmadan önce 10 dakikalık esneme rutinim."],
    ["Protein kahvaltı", "mutfak", "rahat", "oturan", "dogal", "Antrenman sonrası favori kahvaltım, tarif yorumlarda."],
    ["İlerleme kaydı", "banyo", "spor", "ayna", "dogal", "Üç ay önce başladım, işte bugün."],
    ["Plaj antrenmanı", "plaj", "spor", "dinamik", "altin", "Salon kapalıysa plaj açıktır."],
    ["Dinlenme günü", "kafe", "rahat", "oturan", "dogal", "Dinlenmek de antrenmanın bir parçası."],
  ],
  seyahat: [
    ["Yeni rota", "plaj", "bohem", "yurume", "altin", "Haritada rastgele bir nokta seçtim ve işte buradayım."],
    ["Dağ sabahı", "dag", "rahat", "omuz", "dogal", "Sabahın altısında bu manzara her şeye değdi."],
    ["Lavanta kokusu", "lavanta", "bohem", "tamboy", "altin", "Lavanta tarlalarında kaybolmak için doğru zaman."],
    ["Yol hikâyesi", "col", "denim", "oturan", "altin", "Sonu belli olmayan yollar en güzel hikâyeleri yazar."],
    ["Kış kaçamağı", "kis", "rahat", "yakin", "dogal", "Karlı bir köy, sıcak bir içecek ve hiç bitmeyen sessizlik."],
    ["Şehirden bir gece", "neon", "streetwear", "yurume", "neon", "Yeni şehirde ilk gece: kaybol, keşfet, tekrarla."],
    ["Tropik patika", "tropik", "bohem", "yurume", "dogal", "Bu patikanın sonunda ne var dersiniz?"],
  ],
  yasam: [
    ["Pazar sabahı", "kafe", "rahat", "oturan", "dogal", "Pazar sabahları yavaşlamak için var."],
    ["Evden çalışma", "ofis", "rahat", "oturan", "dogal", "Bugünün ofisi: ev, kahve ve uzun bir yapılacaklar listesi."],
    ["Mutfakta deneme", "mutfak", "rahat", "selfie", "dogal", "İlk kez denedim, sonuç beklediğimden iyi."],
    ["Şehirde bir gün", "sokak", "imza", "yurume", "dogal", "Plansız bir şehir günü en güzel günlerden biri."],
    ["Çatıda akşam", "cati", "imza", "omuz", "altin", "Günün en sevdiğim saati."],
    ["Kendime zaman", "yatak", "rahat", "oturan", "dogal", "Telefonu kapatıp kitaba sarıldığım akşamlar."],
    ["Yolda", "araba", "imza", "selfie", "dogal", "Trafikte bile iyi müzik her şeyi düzeltir."],
  ],
  yemek: [
    ["Haftanın tarifi", "mutfak", "rahat", "oturan", "dogal", "Haftanın tarifi: 20 dakikada hazır, tarif yorumlarda."],
    ["Kahve durağı", "kafe", "imza", "oturan", "dogal", "Şehrin en iyi latte'sini buldum galiba."],
    ["Sokak lezzeti", "sokak", "streetwear", "yurume", "dogal", "Sokak lezzetleri turunun ilk durağı."],
    ["Plajda piknik", "plaj", "bohem", "oturan", "altin", "Deniz kenarında piknik, gerisi detay."],
    ["Gece atıştırması", "flas", "imza", "selfie", "flas", "Gece yarısı atıştırmalığı itirafı."],
    ["Pazar kahvaltısı", "yatak", "rahat", "oturan", "dogal", "Pazar kahvaltısı yatakta yenir, kural bu."],
    ["Şefin masası", "mutfak", "resmi", "tamboy", "dramatik", "Bu akşam misafirlerim için özel bir menü."],
  ],
  teknoloji: [
    ["Masam kurulumu", "ofis", "rahat", "oturan", "dogal", "Yeni masa kurulumum, ekipman listesi yorumlarda."],
    ["Kutu açılışı", "minimal", "minimal", "yakin", "flas", "Kutudan yeni çıktı, ilk izlenimlerim geliyor."],
    ["Gece kodlama", "neon", "streetwear", "oturan", "neon", "Gece yarısı, kahve ve derlenen kod."],
    ["Kafede üretkenlik", "kafe", "imza", "oturan", "dogal", "En verimli olduğum yer: köşedeki kafe."],
    ["Yolda teknoloji", "araba", "imza", "selfie", "dogal", "Yolculukta vazgeçemediğim üç uygulama."],
    ["Stüdyo testi", "renkli", "y2k", "dinamik", "flas", "Bu cihazı bir hafta test ettim, dürüst yorum."],
    ["Şehirde yapay zekâ", "sokak", "streetwear", "yurume", "dogal", "Yapay zekâ günlük hayatımı nasıl değiştirdi?"],
  ],
  oyun: [
    ["Yayın gecesi", "neon", "streetwear", "oturan", "neon", "Bu akşam yayındayım, kim geliyor?"],
    ["Oda turu", "yatak", "rahat", "oturan", "neon", "Oyun odamın son hali, ışıklar yeni."],
    ["Turnuva günü", "renkli", "y2k", "dinamik", "flas", "Turnuva günü, odak tam."],
    ["Kafede oyun", "kafe", "rahat", "oturan", "dogal", "Mola verdim ama aklım hâlâ son bölümde."],
    ["Şehir görevi", "sokak", "streetwear", "yurume", "neon", "Gerçek hayatta da yan görev peşindeyim."],
    ["Kurulum yükseltmesi", "ofis", "imza", "oturan", "neon", "Kurulumu yükselttim, farkı görüyor musunuz?"],
    ["Galibiyet pozu", "flas", "imza", "selfie", "flas", "Dün gecenin galibiyetinden kalan tek kare."],
  ],
};
const TON_EK: Record<string, { on: string[]; son: string[] }> = {
  samimi: { on: ["Selam dostlar!", "Size bir şey göstereyim:", "Bugün içimden geldi:"], son: ["Siz olsanız ne yapardınız?", "Yorumlarda buluşalım.", "Sizce nasıl olmuş?"] },
  esprili: { on: ["İtiraf zamanı:", "Kimse sormadı ama:", "Spoiler:"], son: ["Evet, yine ben.", "Gülmek serbest.", "Takip et, pişman olmazsın (muhtemelen)."] },
  ilham: { on: ["Bugün küçük bir hatırlatma:", "Her şey bir adımla başlar.", "Kendine inan:"], son: ["Sen de yapabilirsin.", "Bugün senin günün.", "Hayalini erteleme."] },
  luks: { on: ["Seçkin anlar için:", "Detaylarda saklı:", "Sadece en iyisi."], son: ["Zarafet bir tercihtir.", "Az ama öz.", "Kalite tesadüf değildir."] },
  cesur: { on: ["Net konuşayım:", "Kurallar bende değişir.", "Hazır mısın?"], son: ["Beğenmeyen kaydırsın.", "Sınır yok.", "Ya hep ya hiç."] },
  sakin: { on: ["Yavaş bir an:", "Nefes al.", "Sessizce paylaşıyorum:"], son: ["Anı yaşa.", "Az gürültü, çok huzur.", "Bugün yavaşla."] },
};
const ETIKET: Record<string, string[]> = {
  moda: ["#moda", "#ootd", "#stil", "#kombin", "#fashion", "#streetstyle"],
  guzellik: ["#güzellik", "#ciltbakımı", "#makyaj", "#skincare", "#beauty", "#glowup"],
  fitness: ["#fitness", "#spor", "#antrenman", "#sağlıklıyaşam", "#gym", "#workout"],
  seyahat: ["#seyahat", "#gezi", "#travel", "#keşfet", "#wanderlust", "#tatil"],
  yasam: ["#yaşam", "#günlük", "#lifestyle", "#pazar", "#keyif", "#anı"],
  yemek: ["#yemek", "#tarif", "#lezzet", "#foodie", "#kahve", "#mutfak"],
  teknoloji: ["#teknoloji", "#setup", "#tech", "#yapayzeka", "#inceleme", "#gadget"],
  oyun: ["#oyun", "#gaming", "#yayın", "#gamer", "#setup", "#esports"],
};
const GUNLER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const PLAN_PLATFORM: PlatformId[] = ["ig-post", "tiktok", "ig-story", "ig-post", "tiktok", "ig-post", "ig-story"];

export type PostFikri = { gun: string; tarih: Date; saat: string; platform: PlatformId; tur: "foto" | "video"; baslik: string; sahne: string; kiyafet: string; poz: string; isik: string; altyazi: string; etiketler: string[] };

/** Haftalık içerik planı — karakterin nişine ve tonuna göre; `tohum` değişince farklı varyasyon. */
export function haftalikPlan(k: Influencer, tohum: number, baslangic: Date): PostFikri[] {
  const l = FIKIRLER[k.nis] ?? FIKIRLER.yasam;
  const t = TON_EK[k.ton] ?? TON_EK.samimi;
  const elle = k.kullaniciAdi ? `#${k.kullaniciAdi.replace(/[^\p{L}\p{N}_]/gu, "")}` : "";
  return GUNLER.map((gun, i) => {
    const [baslik, sahne, kiyafet, poz, isik, govde] = l[(i + tohum) % l.length];
    const on = t.on[(i + tohum) % t.on.length], son = t.son[(i * 2 + tohum) % t.son.length];
    const temel = ETIKET[k.nis] ?? ETIKET.yasam;
    const etiketler = [...temel.slice((i + tohum) % 3, ((i + tohum) % 3) + 4), elle, "#yapayzekaileüretildi"].filter(Boolean);
    const tarih = new Date(baslangic); tarih.setDate(baslangic.getDate() + i);
    const platform = PLAN_PLATFORM[(i + tohum) % PLAN_PLATFORM.length];
    return { gun, tarih, saat: PLATFORMLAR.find((p) => p.id === platform)!.saat, platform, tur: platform === "tiktok" || platform === "ig-story" ? "video" : "foto", baslik, sahne, kiyafet, poz, isik, altyazi: `${on} ${govde} ${son}`, etiketler };
  });
}

/** Hazır şablon karakterler (örnek görsellerle; kullanıcının fotoğrafı değil). */
export const SABLONLAR: { ad: string; kullaniciAdi: string; nis: string; ton: string; biyografi: string; portre: string; oz: InfOzellikler }[] = [
  { ad: "Naz", kullaniciAdi: "naz.gunluk", nis: "yasam", ton: "samimi", biyografi: "İstanbul'da yavaş yaşam, kahve ve küçük mutluluklar.", portre: av("naomi"), oz: { ...VARSAYILAN_OZ } },
  { ad: "Lara", kullaniciAdi: "lara.studio", nis: "moda", ton: "luks", biyografi: "Sessiz lüks, zamansız parçalar, şehir şıklığı.", portre: av("valentina"), oz: { ...VARSAYILAN_OZ, koken: "avrupali", sacRenk: "kizil", goz: "yesil", tarz: "zarif", aksesuar: ["kupe"] } },
  { ad: "Mira", kullaniciAdi: "mira.glow", nis: "guzellik", ton: "sakin", biyografi: "Sade cilt bakımı, dürüst ürün yorumları.", portre: av("hana"), oz: { ...VARSAYILAN_OZ, koken: "asyali", sacStil: "bob", sacRenk: "siyah", tarz: "rahat" } },
  { ad: "Amara", kullaniciAdi: "amara.moves", nis: "fitness", ton: "ilham", biyografi: "Her gün biraz daha güçlü. Antrenman ve beslenme.", portre: av("sofia"), oz: { ...VARSAYILAN_OZ, koken: "afrikali", sacStil: "orgu", sacRenk: "siyah", vucut: "atletik", tarz: "spor" } },
  { ad: "Deniz", kullaniciAdi: "deniz.rota", nis: "seyahat", ton: "samimi", biyografi: "Sırt çantası, kamera ve bitmeyen rotalar.", portre: av("malik"), oz: { ...VARSAYILAN_OZ, cinsiyet: "erkek", sacStil: "kisa", tarz: "rahat" } },
  { ad: "Kaan", kullaniciAdi: "kaan.setup", nis: "teknoloji", ton: "esprili", biyografi: "Masa kurulumları, yeni cihazlar ve dürüst testler.", portre: av("lucas"), oz: { ...VARSAYILAN_OZ, cinsiyet: "erkek", koken: "avrupali", sacStil: "kisa", tarz: "streetwear" } },
  { ad: "Selin", kullaniciAdi: "selin.zamansiz", nis: "moda", ton: "luks", biyografi: "Yaş sadece bir sayı; stil ise bir dil.", portre: av("jia"), oz: { ...VARSAYILAN_OZ, yas: "45+", koken: "asyali", sacStil: "bob", sacRenk: "gri", tarz: "zarif" } },
  { ad: "Arjun", kullaniciAdi: "arjun.eats", nis: "yemek", ton: "esprili", biyografi: "Şehrin gizli lezzetleri, ev tarifleri.", portre: av("tae"), oz: { ...VARSAYILAN_OZ, cinsiyet: "erkek", yas: "35-44", koken: "hintli", sacStil: "kisa", sacRenk: "siyah", tarz: "resmi" } },
];

/** Görselli özellik listesi (kimlik kartı): her özellik seçilen seçeneğin gerçek kapağıyla. */
export function ozellikKarolari(o: InfOzellikler): { ad: string; deger: string; kapak: string; renk?: string }[] {
  const k = (ad: string, l: Secenek[], id: string) => { const s = bul(l, id); return s ? [{ ad, deger: s.ad, kapak: s.kapak, renk: s.renk }] : []; };
  return [
    ...k("Cinsiyet", CINSIYET, o.cinsiyet), ...k("Yaş", YAS, o.yas), ...k("Köken", KOKEN, o.koken),
    ...k("Saç stili", SAC_STIL, o.sacStil), ...k("Saç rengi", SAC_RENK, o.sacRenk), ...k("Göz", GOZ, o.goz),
    ...k("Vücut", VUCUT, o.vucut), ...k("Tarz", TARZ, o.tarz),
    ...o.tenDetay.flatMap((t) => k("Ten", TEN_DETAY, t)), ...o.aksesuar.flatMap((t) => k("Aksesuar", AKSESUAR, t)),
  ];
}
