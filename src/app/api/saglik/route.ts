import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BASLANGIC = Date.now();

/**
 * Sağlık denetimi (yük dengeleyici ve Docker HEALTHCHECK için): sunucu ayakta mı, veri klasörü yazılabilir mi.
 * Gizli bilgi döndürmez; ayrıntılı yayın hazırlığı yönetim panelindedir.
 */
export async function GET() {
  let depo = false;
  try {
    const d = path.join(DEPO_KOK, ".saglik");
    await mkdir(d, { recursive: true });
    const f = path.join(d, `${process.pid}.txt`);
    await writeFile(f, String(Date.now()));
    await rm(f, { force: true });
    depo = true;
  } catch { /* yazılamıyor */ }
  return Response.json(
    { ok: depo, depo: depo ? "yazilabilir" : "yazilamiyor", calismaSuresi: Math.round((Date.now() - BASLANGIC) / 1000) },
    { status: depo ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
