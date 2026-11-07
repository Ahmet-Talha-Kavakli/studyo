import { govdeOku, hata, hizHatasi, hizSiniri, tamam } from "@/lib/hesap/guvenlik";
import { oturumGerekli } from "@/lib/hesap/yetki";
import { duzenOku, duzenYaz, duzeniTemizle } from "@/lib/hesap/galeriDepo";
import { AgHatasi, guvenliFetch } from "@/lib/guvenliAg";

export const runtime = "nodejs";

/**
 * Galeri düzeni (favoriler ve klasörler) — oturum gerekli.
 *  GET                 → { duzen | null }
 *  PUT { favoriler, klasorler, guncelleme } → { yazildi, duzen }   (sunucudaki daha yeniyse yazılmaz)
 *  GET ?vekil=<https>  → uzak görselin baytları. İndirme hattı filigran ve önce-sonra şablonu için
 *                        canvas'a çizer; çapraz kökenli dosya canvas'ı kirletmesin diye oturumlu vekil.
 */
const VEKIL_SINIR = 40 * 1024 * 1024;

export async function GET(req: Request) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const vekil = new URL(req.url).searchParams.get("vekil");
  if (vekil) return vekilYanit(o.hesap.uid, vekil);
  return tamam({ duzen: await duzenOku(o.hesap.uid) });
}

export async function PUT(req: Request) {
  const o = await oturumGerekli(req);
  if (o instanceof Response) return o;
  const bekle = hizSiniri(`galeri:${o.hesap.uid}`, 120, 600_000, false);
  if (bekle) return hizHatasi(bekle);
  const g = duzeniTemizle(await govdeOku(req, 1_500_000));
  if (!g) return hata("Galeri düzeni okunamadı.", 400);
  try {
    return tamam(await duzenYaz(o.hesap.uid, g));
  } catch (e) {
    console.error("[galeri] yazılamadı:", (e as Error).message);
    return hata("Galeri düzeni kaydedilemedi.", 500);
  }
}

async function vekilYanit(uid: string, adres: string): Promise<Response> {
  const bekle = hizSiniri(`galeri-vekil:${uid}`, 120, 600_000, false);
  if (bekle) return hizHatasi(bekle);
  if (!/^https:\/\//i.test(adres)) return hata("Yalnız https adresleri.", 400);
  try {
    const r = await guvenliFetch(adres, { headers: { accept: "image/*,video/*" } }, { yalnizHttps: true, enCokYonlendirme: 3 });
    if (!r.ok) return hata(`Dosya alınamadı (${r.status}).`, 502);
    const tip = (r.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!/^(image\/(png|jpeg|webp|gif|avif)|video\/(mp4|webm|quicktime))$/.test(tip)) return hata("Bu dosya türü işlenemez.", 415);
    const boy = Number(r.headers.get("content-length") ?? 0);
    if (boy > VEKIL_SINIR) return hata("Dosya çok büyük.", 413);
    const bayt = await r.arrayBuffer();
    if (bayt.byteLength > VEKIL_SINIR) return hata("Dosya çok büyük.", 413);
    return new Response(bayt, { headers: { "content-type": tip, "cache-control": "private, max-age=600", "x-content-type-options": "nosniff" } });
  } catch (e) {
    if (e instanceof AgHatasi) return hata(e.message, 400);
    return hata("Dosyaya ulaşılamadı.", 502);
  }
}
