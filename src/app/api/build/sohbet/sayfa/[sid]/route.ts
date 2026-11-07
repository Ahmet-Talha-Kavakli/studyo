import { sayfaOku } from "@/lib/build/sohbetPaylasim";

export const dynamic = "force-dynamic";

/** Paylaşılan sohbet sayfası (artifact). Kum havuzunda sunulur: site çerezlerine ve oturuma erişemez. */
export async function GET(_: Request, { params }: { params: Promise<{ sid: string }> }) {
  const html = await sayfaOku((await params).sid);
  if (html === null) return new Response("Bu sayfa bulunamadı ya da kaldırıldı.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": "sandbox allow-scripts allow-forms allow-modals allow-popups", "X-Robots-Tag": "noindex", "Cache-Control": "public, max-age=300" } });
}
