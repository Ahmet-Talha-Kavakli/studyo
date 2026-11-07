import type { SaglayiciAdapter, SaglayiciIstek, SaglayiciSonuc, UretimTuru } from "./tipler";
import { elevenAdapter } from "./eleven";
import { meshyAdapter } from "./meshy";
import { replicateVideoAdapter } from "./gorsel";
import { gorselHazir, gorselUret } from "./gorselMotor";
import { klingVideoAdapter, seedanceVideoAdapter, minimaxVideoAdapter, omniVideoAdapter, lumaReframeAdapter, falVideoAdapter } from "./video";
import { videoErisim } from "@/lib/videoSaglayici";

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

/**
 * Görsel sağlayıcıları: hangi modelin hangi sağlayıcıya gideceği `gorselModelVeri` kataloğunda
 * tanımlı; asıl iş `gorselUret` içinde. Bu nesneler durum listesi ve tür eşlemesi içindir.
 */
function gorselSaglayici(ad: keyof typeof gorselHazir): SaglayiciAdapter {
  return {
    ad,
    hazir: gorselHazir[ad],
    destekler: (tur) => tur === "gorsel",
    async uret(istek) {
      const s = await gorselUret(istek);
      if (!s) throw new Error("Görsel sağlayıcısı bağlı değil.");
      return s;
    },
  };
}

/* Tür için varsayılan öncelik sırası (ilk hazır seçilir). */
const GERCEK_ADAPTORLER: SaglayiciAdapter[] = [
  elevenAdapter,          // ses
  meshyAdapter,           // 3d
  ...(["gemini", "seedream", "openai", "fal"] as const).map(gorselSaglayici), // görsel (yönlendirme gorselMotor'da)
  klingVideoAdapter,      // video
  seedanceVideoAdapter,   // video
  minimaxVideoAdapter,    // video
  omniVideoAdapter,       // video (Gemini Omni Flash)
  lumaReframeAdapter,     // video yeniden çerçeveleme (yalnız adıyla seçilir)
  falVideoAdapter,        // video (Kling 4.0, MiniMax H3, FLUX, Wan 3.0, LTX, PixVerse, Vidu, Luma Ray 3…)
  replicateVideoAdapter,  // video (yedek)
];

/* Kullanıcının seçtiği modele göre doğru sağlayıcı — model adı/id içinde anahtar kelime.
   Kullanıcı "Seedance ile" derse Seedance, "Kling ile" derse Kling çalışır. */
const MODEL_SAGLAYICI: { desen: RegExp; ad: string }[] = [
  { desen: /seedance/i, ad: "seedance" },
  { desen: /gemini omni/i, ad: "omni" },
  { desen: /luma ray reframe/i, ad: "luma" },
  { desen: /kling/i, ad: "kling" },
  { desen: /hailuo|minimax/i, ad: "minimax" },
  { desen: /eleven|vali/i, ad: "eleven" },
  { desen: /meshy|vayra.?3d/i, ad: "meshy" },
];

/** Bir tür (+ opsiyonel model) için gerçek sağlayıcıyı bul; yoksa simülasyon. */
export function saglayiciSec(tur: UretimTuru, model?: string): SaglayiciAdapter {
  // 1) Model adı belirtilmişse ona uygun sağlayıcıyı dene
  if (model) {
    // Video: yalnız gerçek sağlayıcı eşlemesi olan modeller (kapanan / henüz bağlanmayan → demo).
    if (tur === "video") {
      const e = videoErisim(model);
      if (e.durum !== "gercek") return simulasyonAdapter;
      // Sağlayıcı katalogdan: aynı aileden modeller farklı sağlayıcılarda olabilir (Kling 4.0 → fal).
      const a = GERCEK_ADAPTORLER.find((x) => x.ad === e.saglayici && x.destekler(tur) && x.hazir());
      return a ?? simulasyonAdapter;
    }
    const eslesme = MODEL_SAGLAYICI.find((m) => m.desen.test(model));
    if (eslesme) {
      const a = GERCEK_ADAPTORLER.find((x) => x.ad === eslesme.ad && x.destekler(tur) && x.hazir());
      if (a) return a;
    }
    // Model sağlayıcıya özgüdür: eşleşmeyen (ya da sağlayıcısı bağlı olmayan) modeli başka bir
    // sağlayıcıyla üretip o modelin adıyla sunmak yanıltıcı olur — demo olarak üretilir.
    return simulasyonAdapter;
  }
  // 2) Türe göre ilk hazır sağlayıcı
  // Luma Reframe genel video üretmez (kaynak video ister): yalnız adıyla seçilir.
  return GERCEK_ADAPTORLER.find((a) => a.ad !== "luma" && a.ad !== "fal" && a.destekler(tur) && a.hazir()) ?? simulasyonAdapter;
}

/**
 * Bir üretim isteğini uygun sağlayıcıya yönlendir. Gerçek sağlayıcı hata verirse sahte bir
 * sonuç DÖNMEZ: hata istemciye iletilir, kredi iade edilir (kullanıcı ödeyip demo almasın).
 */
export async function uretimYonlendir(istek: SaglayiciIstek): Promise<SaglayiciSonuc> {
  // Görsel: katalog eşlemesiyle gerçek sağlayıcı; bağlı değilse demo.
  if (istek.tur === "gorsel") return (await gorselUret(istek)) ?? simulasyonAdapter.uret(istek);
  return saglayiciSec(istek.tur, istek.model).uret(istek);
}

/**
 * Bu istek gerçek bir sağlayıcıda çalışabilir mi (kredi kesilmeden önce sorulur). false ise çıktı örnek olur
 * ve kredi kesilmez. Görselde yönlendirme işleme göre değiştiği için herhangi bir görsel sağlayıcısının bağlı
 * olması yeter; çıktı yine de örnek dönerse rota krediyi iade eder.
 */
export function gercekUretimMumkun(tur: UretimTuru, model?: string): boolean {
  if (tur === "gorsel") return Object.values(gorselHazir).some((f) => f());
  return saglayiciSec(tur, model).ad !== "simulasyon";
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

/** Gerçek sağlayıcı adaptörlerinin yapılandırılıp yapılandırılmadığı (anahtar var mı) — durum sayfası için. */
export function saglayiciHazirlik(): { ad: string; hazir: boolean }[] {
  return GERCEK_ADAPTORLER.map((a) => ({ ad: a.ad, hazir: a.hazir() }));
}
