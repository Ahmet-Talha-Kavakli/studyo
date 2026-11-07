import { govdeOku, hata, hizHatasi, hizSiniri, tamam } from "@/lib/hesap/guvenlik";
import { alinanGorevler, gorevOdulu } from "@/lib/odeme/gorev";
import { baglamAl, hataYanit } from "@/lib/odeme/uc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ödülü alınmış görevler (günlükler bugün için). */
export async function GET(req: Request) {
  const b = await baglamAl(req);
  if (b instanceof Response) return b;
  return tamam({ alinanlar: await alinanGorevler(b.uid) });
}

/** { id }: görev ödülü sunucuda doğrulanır ve kredi defterine eklenir. */
export async function POST(req: Request) {
  const b = await baglamAl(req);
  if (b instanceof Response) return b;
  const bekle = hizSiniri(`gorev:${b.uid}`, 30, 600_000, false);
  if (bekle) return hizHatasi(bekle);
  const g = await govdeOku<{ id?: string }>(req, 500);
  if (!g?.id) return hata("Görev seçilmedi.");
  try {
    const r = await gorevOdulu(b.hesap, String(g.id).slice(0, 40));
    return tamam({ kredi: r.kredi, ozet: r.ozet, bakiye: r.ozet.bakiye });
  } catch (e) { return hataYanit(e, "odeme-gorev"); }
}
