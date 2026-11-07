import { readFile } from "fs/promises";
import path from "path";
import { AD } from "@/lib/alan/depo";
import { ALAN_DESENI } from "@/lib/alan/tipler";

export const runtime = "nodejs";

const TUR: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

/** Alan logosu. Adı içeriğin özetini taşıdığı için uzun süre önbelleklenir. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string; ad: string }> }) {
  const { id, ad } = await ctx.params;
  const m = /^logo-[a-f0-9]{16}\.(png|jpg|webp)$/.exec(ad);
  if (!ALAN_DESENI.test(id) || !m) return new Response("Bulunamadı", { status: 404 });
  try {
    const b = await readFile(path.join(AD.medya, id, ad));
    return new Response(new Uint8Array(b), { headers: { "Content-Type": TUR[m[1]], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response("Bulunamadı", { status: 404 }); }
}
