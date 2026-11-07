import { sesDosyasi } from "@/lib/build/sohbetDokum";
import { sahipAl } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/**
 * Dökümün ses dosyası (yalnız sahibi). Ses öğesi başlık gönderemediği için sahip anahtarı ?s= ile de gelebilir.
 * Range istekleri desteklenir (oynatıcıda ileri sarma).
 */
export async function GET(req: Request, { params }: { params: Promise<{ did: string }> }) {
  const u = new URL(req.url);
  const s0 = u.searchParams.get("s");
  const istek = s0 ? new Request(req.url, { headers: { cookie: req.headers.get("cookie") ?? "", "x-build-sahip": s0 } }) : req;
  const sahip = sahipAl(istek);
  if (!sahip) return new Response("Yetkisiz", { status: 403 });
  const s = await sesDosyasi(sahip, (await params).did);
  if (!s) return new Response("Bulunamadı", { status: 404 });
  const n = s.veri.length;
  const r = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") ?? "");
  const ortak = { "Content-Type": s.mime, "Accept-Ranges": "bytes", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (r && (r[1] || r[2])) {
    const bas = r[1] ? Number(r[1]) : Math.max(0, n - Number(r[2]));
    const son = r[1] && r[2] ? Math.min(n - 1, Number(r[2])) : n - 1;
    if (bas >= n || bas > son) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${n}` } });
    return new Response(new Uint8Array(s.veri.subarray(bas, son + 1)), { status: 206, headers: { ...ortak, "Content-Range": `bytes ${bas}-${son}/${n}`, "Content-Length": String(son - bas + 1) } });
  }
  return new Response(new Uint8Array(s.veri), { headers: { ...ortak, "Content-Length": String(n) } });
}
