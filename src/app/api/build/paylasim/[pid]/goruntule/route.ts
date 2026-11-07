import { goruntulemeEkle } from "@/lib/build/paylasim";
import { hata, sahipAl } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Sayfa görüntülenmesi: sahibin kendi bakışı ve aynı ağdan yarım saat içindeki tekrar sayılmaz. */
export async function POST(req: Request, { params }: { params: Promise<{ pid: string }> }) {
  const ag = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "yerel";
  const n = await goruntulemeEkle((await params).pid, sahipAl(req), `${ag}:${req.headers.get("user-agent")?.slice(0, 80) ?? ""}`);
  return n === null ? hata("Bulunamadı.", 404) : Response.json({ ok: true, goruntulenme: n });
}
