/**
 * Model ailelerinin gerçek örnek çıktıları. Keşfet klasöründe dosya adı modelin adıyla biten
 * görseller o modelle üretilmiştir; aile kartlarında tekrar eden tanıtım görseli yerine bunlar gösterilir.
 * Yalnız başlıklı gerçek çıktılar alınır; "<model><sağlayıcı>" adlı dosyalar sağlayıcı tanıtım görselidir, kullanılmaz.
 * Gerçek çıktısı olmayan ailelere türün genel örnekleri verilir.
 */

import type { KatalogTur } from "@/lib/modelKatalogu";

const K = (ad: string) => `/gercek/kesfet/${ad}.webp`;

const AILE: [RegExp, string[]][] = [
  [/veo/i, ["antik-tapinak-kesfiveo-3-1", "deniz-feneri-firtinasiveo-3-1", "uzay-istasyonu-yorungesiveo-3-1"].map(K)],
  [/sora/i, [K("cyberpunk-sokak-yagmurusora-2")]],
  [/kling/i, [K("yagmurlu-tokyo-sokagikling-3-0-turbo")]],
  [/nano banana/i, ["altin-saat-portresinano-banana-pro", "aurora-gecesinano-banana-pro", "buz-sarayinano-banana-pro"].map(K)],
  [/seedream/i, ["kozmik-bahceseedream-5-0-pro", "su-alti-kristal-sehriseedream-5-0-pro", "tropik-cennet-adasiseedream-5-0-pro", "vahsi-bati-kasabasiseedream-5-0-pro"].map(K)],
  [/recraft/i, ["kuantum-laboratuvarirecraft-v4-1", "piksel-kahramanirecraft-v4-1", "steampunk-atolyerecraft-v4-1"].map(K)],
  [/eleven(?! music)|^seed$|vibevoice/i, ["elevenlabs-ttselevenlabs", "ses-klonuelevenlabs", "blog-ses"].map(K)],
  [/vayra 3d/i, ["/gercek/3d/robot-poster.png", "/gercek/3d/kask-poster.png", "/gercek/3d/savasci-poster.png", "/gercek/3d/lamba-poster.png"]],
];

const VAYRA_GORSEL = ["editoryel-moda-serisiruh-2-0", "barok-balo-salonuruh-2-0", "fantastik-orman-perisiruh-sinema", "denizati-kralligiruh-sinema"].map(K);

const V = (ad: string) => `/gercek/video-hareket/${ad}-poster.webp`;
const TUR: Record<KatalogTur, string[]> = {
  video: [
    // arc-shot çıkarıldı: ilk karesi boş siyah monitör, kapak olarak anlamsız.
    ...["action-run", "air-bending", "bullet-time", "camera-orbit", "commercial", "crane-up", "drone-orbit", "fpv-dive", "giant-grab", "handheld", "focus-pull", "emotion-zoom", "low-shutter"].map(V),
    "/gercek/sinema/ps-fire.webp", "/gercek/sinema/ps-fpv.webp", "/gercek/sinema/ps-car.webp", "/gercek/sinema/ps-concert.webp",
  ],
  gorsel: ["/gercek/galeri/portre4.webp", "/gercek/galeri/sinematik2.webp", "/gercek/galeri/manzara3.webp", "/gercek/galeri/soyut5.webp", "/gercek/galeri/portre7.webp", "/gercek/galeri/sinematik8.webp", "/gercek/galeri/manzara8.webp", "/gercek/galeri/soyut10.webp", "/gercek/galeri/portre10.webp", "/gercek/galeri/sinematik5.webp"],
  ses: ["elevenlabs-ttselevenlabs", "ses-klonuelevenlabs", "blog-ses"].map(K),
  muzik: ["/gercek/muzik/ms-neon.webp", "/gercek/muzik/ms-velvet.webp", "/gercek/muzik/ms-brass.webp"],
  "3d": ["/gercek/3d/robot-poster.png", "/gercek/3d/kask-poster.png", "/gercek/3d/savasci-poster.png"],
};
/** Yedek havuzdan her aileye sırayla ayrı bir dilim verir (ilk görüldüğü sırada sabitlenir), böylece kartlar tekrar etmez. */
const atanan = new Map<string, number>();
const sayac: Partial<Record<KatalogTur, number>> = {};
const kaydir = (l: string[], anahtar: string, tur: KatalogTur) => {
  if (!atanan.has(anahtar)) { const n = sayac[tur] ?? 0; atanan.set(anahtar, n); sayac[tur] = n + 1; }
  const i = (atanan.get(anahtar)! * 2) % l.length;
  return [...l.slice(i), ...l.slice(0, i)];
};

/** Ailenin örnek görselleri; `gercek` false ise türün genel örnekleridir. */
export function aileGorselleri(aile: string, tur: KatalogTur): { liste: string[]; gercek: boolean } {
  if (tur === "gorsel" && /^vayra$/i.test(aile)) return { liste: VAYRA_GORSEL, gercek: true };
  const b = AILE.find(([r]) => r.test(aile));
  // Tek örneği olan ailelerde kart iki kare gösterdiği için türün örnekleriyle tamamlanır.
  if (b && tur !== "muzik") return { liste: b[1].length > 1 ? b[1] : [...b[1], ...kaydir(TUR[tur], `${tur}|${aile}`, tur)], gercek: true };
  return { liste: kaydir(TUR[tur], `${tur}|${aile}`, tur), gercek: false };
}
