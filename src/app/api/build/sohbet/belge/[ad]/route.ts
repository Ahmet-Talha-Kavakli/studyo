import { belgeBaytlari, belgeGetir, belgeOnizleme } from "@/lib/build/belgeDepo";
import { BICIM_MIME } from "@/lib/build/belgeTipler";

export const dynamic = "force-dynamic";

/**
 * Sohbetin Office dosyaları (tahmin edilemez kimlikle): <id>.docx|xlsx|pptx dosyanın kendisi (indirme, Türkçe adıyla),
 * <id>.json önizleme (yapılandırılmış içerik, Excel formül sonuçları, sürüm zinciri).
 */
export async function GET(_: Request, { params }: { params: Promise<{ ad: string }> }) {
  const m = /^([A-Za-z0-9_-]{24})\.(docx|xlsx|pptx|json)$/.exec((await params).ad);
  if (!m) return new Response("Bulunamadı", { status: 404 });
  const k = await belgeGetir(m[1]);
  if (!k || (m[2] !== "json" && m[2] !== k.bicim)) return new Response("Bulunamadı", { status: 404 });
  if (m[2] === "json") return Response.json({ ok: true, ...(await belgeOnizleme(k)) }, { headers: { "Cache-Control": "private, max-age=60" } });
  const b = await belgeBaytlari(k);
  if (!b) return new Response("Bulunamadı", { status: 404 });
  const ascii = k.ad.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").replace(/İ/g, "I").replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'");
  return new Response(new Uint8Array(b), {
    headers: {
      "Content-Type": BICIM_MIME[k.bicim], "Content-Length": String(b.length),
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(k.ad)}`,
      "Cache-Control": "private, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff",
    },
  });
}
