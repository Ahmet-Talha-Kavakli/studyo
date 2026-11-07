import { govdeOku, hata, tamam } from "@/lib/hesap/guvenlik";
import { kayitGuncelle, kayitOku } from "@/lib/odeme/depo";
import { faturaTamam, faturaTemizle } from "@/lib/odeme/fatura";
import { baglamAl } from "@/lib/odeme/uc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Fatura bilgisi (bireysel ya da kurumsal). Sunucuda saklanır; ödeme ve makbuzda kullanılır. */
export async function GET(req: Request) {
  const b = await baglamAl(req);
  if (b instanceof Response) return b;
  const f = (await kayitOku(b.uid)).fatura ?? null;
  return tamam({ fatura: f, tamam: faturaTamam(f ?? undefined), efatura: false });
}

export async function PUT(req: Request) {
  const b = await baglamAl(req);
  if (b instanceof Response) return b;
  const g = await govdeOku<{ fatura?: unknown }>(req, 8_000);
  if (!g?.fatura) return hata("Fatura bilgisi eksik.");
  const { f, hatalar } = faturaTemizle(g.fatura);
  if (Object.keys(hatalar).length) return hata(Object.values(hatalar)[0]!, 400, { kod: "alan", hatalar });
  if (!f.eposta) f.eposta = b.hesap.email;
  await kayitGuncelle(b.uid, (k) => { k.fatura = f; });
  return tamam({ fatura: f, tamam: faturaTamam(f) });
}
