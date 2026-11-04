import { scYayinOku } from "@/lib/scYayin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Yayınlanan site/uygulama. Kullanıcı HTML'i ana alan adında sunulduğu için CSP "sandbox" ile ayrı (opak) kökene alınır:
 * betikler çalışır ama Vayra çerezlerine/depolamasına erişemez. Sağ altta küçük "Vayra ile yapıldı" rozeti (remix açıksa "Remixle").
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const k = await scYayinOku((await params).id);
  if (!k) return new Response("<!doctype html><meta charset=utf-8><title>Bulunamadı</title><p style='font-family:system-ui;padding:40px'>Bu uygulama bulunamadı ya da yayından kaldırıldı.</p>", { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
  const kok = new URL(req.url).origin;
  const rozet = `<a href="${kok}/panel/supercomputer${k.remix ? `?remix=${k.id}` : ""}" target="_top" rel="noopener" style="position:fixed;right:14px;bottom:14px;z-index:2147483647;display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;background:rgba(15,19,26,.92);color:#e9eef5;font:500 12.5px/1 system-ui,sans-serif;text-decoration:none;border:1px solid rgba(255,255,255,.12)"><span style="width:8px;height:8px;border-radius:50%;background:#55d6fd"></span>${k.remix ? "Vayra ile yapıldı · Remixle" : "Vayra ile yapıldı"}</a>`;
  const html = /<\/body>/i.test(k.html) ? k.html.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${rozet}</body>`) : k.html + rozet;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "sandbox allow-scripts allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation",
      "X-Robots-Tag": "noindex",
      "Cache-Control": "no-store",
    },
  });
}
