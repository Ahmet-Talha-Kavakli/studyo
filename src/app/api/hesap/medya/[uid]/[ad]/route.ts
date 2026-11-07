import { readFile } from "fs/promises";
import path from "path";
import { D, UID_DESENI } from "@/lib/hesap/depo";

export const runtime = "nodejs";

const TUR: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

/** Profil fotoğrafı ve kapak. Adın içinde içerik özeti olduğu için uzun süre önbelleklenir. */
export async function GET(_req: Request, b: { params: Promise<{ uid: string; ad: string }> }) {
  const { uid, ad } = await b.params;
  const m = /^(?:avatar|kapak)-[a-f0-9]{12}\.(png|jpg|webp)$/.exec(ad);
  if (!UID_DESENI.test(uid) || !m) return new Response("Bulunamadı", { status: 404 });
  try {
    const bayt = await readFile(path.join(D.medya, uid, ad));
    return new Response(new Uint8Array(bayt), {
      headers: { "Content-Type": TUR[m[1]], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" },
    });
  } catch { return new Response("Bulunamadı", { status: 404 }); }
}
