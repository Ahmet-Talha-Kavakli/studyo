import { bulutOzeti } from "@/lib/build/bulut";
import { hesapKullanimi } from "@/lib/build/bulutRapor";
import { projeOku, sahipProjeleri } from "@/lib/build/depo";
import { sahipAl } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/**
 * Vayra Bulut genel bakış: bütün projelerin yayın, istek, ziyaretçi, veri, üye ve depolama özeti.
 * ?kullanim=1 → bu ayın proje başına kullanımı (istek, bant, fonksiyon çağrısı ve süresi, yapay zekâ, depolama) ve kotalar.
 */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return Response.json({ ok: true, projeler: [] });
  const l = (await sahipProjeleri(sahip)).filter((o) => !o.taslak?.gorev);
  const tam = (await Promise.all(l.slice(0, 60).map((o) => projeOku(o.id, sahip)))).filter((x): x is NonNullable<typeof x> => !!x);
  if (new URL(req.url).searchParams.get("kullanim") === "1") return Response.json({ ok: true, ...(await hesapKullanimi(tam)) });
  const projeler = await Promise.all(tam.map((p) => bulutOzeti(p)));
  return Response.json({ ok: true, projeler });
}
