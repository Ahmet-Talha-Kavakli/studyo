import { tamam } from "@/lib/hesap/guvenlik";
import { odemeDurumu } from "@/lib/odeme/ayar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ödeme altyapısının durumu: hangi sağlayıcı bağlı, deneme akışı açık mı. Anahtar değerleri dönmez. */
export async function GET() {
  return tamam({ durum: odemeDurumu() });
}
