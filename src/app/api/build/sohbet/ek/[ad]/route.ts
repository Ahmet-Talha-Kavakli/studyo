import { readFile } from "fs/promises";
import { EK_MIME, ekAdiGecerli, ekYolu } from "@/lib/build/sohbetEk";

export const dynamic = "force-dynamic";

/** Sohbet ekini sun (tahmin edilemez adla). Metin ve PDF indirme olarak değil görüntüleme olarak açılır. */
export async function GET(_: Request, { params }: { params: Promise<{ ad: string }> }) {
  const ad = (await params).ad;
  if (!ekAdiGecerli(ad)) return new Response("Bulunamadı", { status: 404 });
  try {
    const b = await readFile(ekYolu(ad));
    const uz = ad.split(".").pop()!;
    return new Response(new Uint8Array(b), { headers: { "Content-Type": EK_MIME[uz] ?? "application/octet-stream", "Cache-Control": "private, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox" } });
  } catch {
    return new Response("Bulunamadı", { status: 404 });
  }
}
