import { kanalKurulumu } from "@/lib/build/bildirim";
import { vapidUret } from "@/lib/build/bildirimSifre";
import { hata, sahipAl } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/**
 * Yeni VAPID anahtar çifti üretir ve YALNIZ gösterir: sunucuya yazılmaz, etkinleşmez. Yönetici satırları
 * .env.local dosyasına (ya da barındırma ortam değişkenlerine) ekleyip sunucuyu yeniden başlatınca push açılır.
 */
export async function POST(req: Request) {
  if (!sahipAl(req)) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  if (kanalKurulumu().push.kurulu) return hata("Tarayıcı bildirimi zaten kurulu; yeni anahtar üretmek bütün abonelikleri geçersiz kılar.", 409);
  const c = vapidUret();
  return Response.json({ ok: true, satirlar: [`VAPID_PUBLIC_KEY=${c.genel}`, `VAPID_PRIVATE_KEY=${c.ozel}`, "VAPID_SUBJECT=mailto:destek@alanadin.com"] });
}
