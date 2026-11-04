/** Model kimliği → kapak görseli. Gerçek model çıktısı varsa o; yoksa türe uygun Vayra üretimi
 *  (birbirinin aynısı sağlayıcı tanıtım görselleri kullanılmaz). */
const K = "/gercek/kesfet/";
export const MODEL_KAPAK: Record<string, string> = {
  "seedance-2": `${K}gun-batimi-sahiliseedance-2-0.webp`,
  "veo-31": `${K}deniz-feneri-firtinasiveo-3-1.webp`,
  "kling-3": `${K}futuristik-metrokling-3-0.webp`,
  "sora-2": `${K}cyberpunk-sokak-yagmurusora-2.webp`,
  "wan-27": "/gercek/video-hareket/arc-shot-poster.webp",
  "hailuo-23": "/gercek/video-hareket/action-run-poster.webp",
  "ruh-2": `${K}ruh-2-0gorsel.webp`,
  "ruh-sinema": `${K}mistik-dag-manastiriruh-sinema.webp`,
  "nano-banana-pro": `${K}aurora-gecesinano-banana-pro.webp`,
  "seedream-5": `${K}kozmik-bahceseedream-5-0-pro.webp`,
  "flux-2": "/gercek/galeri/portre7.webp",
  "gpt-image-2": `${K}gpt-image-2openai.webp`,
  "meshy-metin3d": `${K}meshy-3d3d.webp`,
  "meshy-gorsel3d": "/gercek/orig/seed-scifi-kask-meshy.webp",
  "meshy-doku": "/gercek/3d/lamba-poster.png",
  "meshy-animasyon": "/gercek/3d/robot-poster.png",
  "vayra-muse-2": `${K}vayra-muse-2vayra.webp`,
  "vayra-muse-lite": `${K}vayra-muse-litevayra.webp`,
  "vayra-instrumental": `${K}vayra-enstrumantalvayra.webp`,
  "eleven-tts": `${K}elevenlabs-ttselevenlabs.webp`,
  "eleven-klon": `${K}ses-klonuelevenlabs.webp`,
  "vali-muzik": `${K}vali-muzikvali.webp`,
  "vali-sfx": `${K}vali-sfxvali.webp`,
};
export const modelKapak = (id: string) => MODEL_KAPAK[id] ?? "/gercek/kesfet/blog-api.webp";
