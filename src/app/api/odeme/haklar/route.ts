import { hata, tamam } from "@/lib/hesap/guvenlik";
import { oturumOku } from "@/lib/hesap/oturum";
import { kayitOku } from "@/lib/odeme/depo";
import { haklarOzeti } from "@/lib/odeme/motor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Satın alınan süreli haklar: model bazında sınırsız erişim ve hız. Tarayıcıdaki ekler deposu buradan eşitlenir. */
export async function GET(req: Request) {
  const o = await oturumOku(req);
  if (!o) return hata("Oturum açık değil. Giriş yap.", 401, { kod: "oturum" });
  return tamam({ haklar: haklarOzeti(await kayitOku(o.hesap.uid)) });
}
