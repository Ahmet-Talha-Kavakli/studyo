import { tamam } from "@/lib/hesap/guvenlik";
import { sunucuDurumu } from "@/lib/hesap/hesap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Hangi sosyal giriş sağlayıcıları bu sunucuda kurulu (giriş ekranı düğmeleri buna göre konuşur). */
export async function GET() {
  return tamam({ sunucu: sunucuDurumu() });
}
