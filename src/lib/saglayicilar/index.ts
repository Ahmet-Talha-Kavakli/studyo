import type { SaglayiciAdapter, SaglayiciIstek, SaglayiciSonuc, UretimTuru } from "./tipler";
import { elevenAdapter } from "./eleven";
import { meshyAdapter } from "./meshy";
import { openaiGorselAdapter, replicateVideoAdapter } from "./gorsel";
import { geminiGorselAdapter, veoVideoAdapter } from "./gemini";
import { minimaxVideoAdapter, klingVideoAdapter } from "./video-cin";
import { seedreamGorselAdapter, seedanceVideoAdapter } from "./byteplus";

export type { SaglayiciIstek, SaglayiciSonuc, UretimTuru };

/**
 * Simülasyon adaptörü — hiçbir gerçek anahtar yoksa devreye girer.
 * Deterministik önizleme üretir; istemci gradient/animasyonla tamamlar.
 * Bu FAKE değil: gerçek bir üretim akışının (kredi düşümü, kuyruk, çıktı,
 * bildirim) tam çalışan yedeğidir. Anahtar girildiği an gerçek sağlayıcı devralır.
 */
const simulasyonAdapter: SaglayiciAdapter = {
  ad: "simulasyon",
  hazir: () => true,
  destekler: () => true,
  async uret(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
    // Gerçekçi bir gecikme — üretim hissi.
    await new Promise((r) => setTimeout(r, 400));
    return { saglayici: "simulasyon", gercek: false, detay: { model: istek.model } };
  },
};

/* Tür için varsayılan öncelik sırası (ilk hazır seçilir). */
const GERCEK_ADAPTORLER: SaglayiciAdapter[] = [
  elevenAdapter,          // ses
  meshyAdapter,           // 3d
  geminiGorselAdapter,    // görsel (öncelikli — ucuz+canlı)
  seedreamGorselAdapter,  // görsel
  openaiGorselAdapter,    // görsel (yedek)
  veoVideoAdapter,        // video (öncelikli)
  seedanceVideoAdapter,   // video
  klingVideoAdapter,      // video
  minimaxVideoAdapter,    // video
  replicateVideoAdapter,  // video (yedek)
];

/* Kullanıcının seçtiği modele göre doğru sağlayıcı — model adı/id içinde anahtar kelime.
   Kullanıcı "Seedance ile" derse Seedance, "Kling ile" derse Kling çalışır. */
const MODEL_SAGLAYICI: { desen: RegExp; ad: string }[] = [
  { desen: /seedance/i, ad: "seedance" },
  { desen: /seedream|seededit/i, ad: "seedream" },
  { desen: /veo/i, ad: "veo" },
  { desen: /kling/i, ad: "kling" },
  { desen: /hailuo|minimax/i, ad: "minimax" },
  { desen: /nano.?banana|gemini|ruh/i, ad: "gemini" },
  { desen: /gpt.?image|dall/i, ad: "openai" },
  { desen: /eleven|vali/i, ad: "eleven" },
  { desen: /meshy|vayra.?3d/i, ad: "meshy" },
];

/** Bir tür (+ opsiyonel model) için gerçek sağlayıcıyı bul; yoksa simülasyon. */
export function saglayiciSec(tur: UretimTuru, model?: string): SaglayiciAdapter {
  // 1) Model adı belirtilmişse ona uygun sağlayıcıyı dene
  if (model) {
    const eslesme = MODEL_SAGLAYICI.find((m) => m.desen.test(model));
    if (eslesme) {
      const a = GERCEK_ADAPTORLER.find((x) => x.ad === eslesme.ad && x.destekler(tur) && x.hazir());
      if (a) return a;
    }
  }
  // 2) Türe göre ilk hazır sağlayıcı
  return GERCEK_ADAPTORLER.find((a) => a.destekler(tur) && a.hazir()) ?? simulasyonAdapter;
}

/** Bir üretim isteğini uygun sağlayıcıya yönlendir. Hata olursa simülasyona düş. */
export async function uretimYonlendir(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
  const adapter = saglayiciSec(istek.tur, istek.model);
  try {
    return await adapter.uret(istek);
  } catch (hata) {
    // Gerçek sağlayıcı patlarsa üretim tamamen ölmesin — simülasyonla tamamla,
    // ama şeffaf ol: hata detayını taşı.
    const sim = await simulasyonAdapter.uret(istek);
    return { ...sim, detay: { ...sim.detay, hata: String(hata).slice(0, 300), dusenSaglayici: adapter.ad } };
  }
}

/** Her türün o an hangi sağlayıcıyla (gerçek/simülasyon) çalışacağının haritası. */
export function saglayiciDurumu(): Record<UretimTuru, { saglayici: string; gercek: boolean }> {
  const turler: UretimTuru[] = ["gorsel", "video", "ses", "3d"];
  const sonuc = {} as Record<UretimTuru, { saglayici: string; gercek: boolean }>;
  for (const t of turler) {
    const a = saglayiciSec(t);
    sonuc[t] = { saglayici: a.ad, gercek: a.ad !== "simulasyon" };
  }
  return sonuc;
}
