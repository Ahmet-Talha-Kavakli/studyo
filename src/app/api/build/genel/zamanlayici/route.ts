import { zamanlayiciTuru } from "@/lib/build/sistemMotoru";

export const dynamic = "force-dynamic";

/**
 * Zamanlayıcı turu: süreç içi zamanlayıcının olmadığı ortamlarda (Vercel) her dakika cron ile çağrılır.
 * Authorization: Bearer <CRON_SECRET> gerekir.
 */
export async function GET(req: Request) {
  const gizli = process.env.CRON_SECRET;
  if (!gizli || req.headers.get("authorization") !== `Bearer ${gizli}`) return Response.json({ ok: false }, { status: 401 });
  return Response.json({ ok: true, calistirilan: await zamanlayiciTuru() });
}
