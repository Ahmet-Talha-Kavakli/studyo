import { hata, tamam } from "@/lib/hesap/guvenlik";
import { krediOzeti, sonHareketler } from "@/lib/hesap/kredi";
import { oturumOku } from "@/lib/hesap/oturum";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sunucu kredi defteri: bakiye, dönem, kovalar ve son hareketler (?adet=1..200, varsayılan 50). */
export async function GET(req: Request) {
  const o = await oturumOku(req);
  if (!o) return hata("Oturum açık değil. Giriş yap.", 401, { kod: "oturum" });
  const adet = Math.max(1, Math.min(200, Number(new URL(req.url).searchParams.get("adet")) || 50));
  const [ozet, hareketler] = await Promise.all([krediOzeti(o.hesap.uid, o.hesap.plan), sonHareketler(o.hesap.uid, adet)]);
  return tamam({ ozet, hareketler });
}
