import { SAGLAYICILAR, yetkiTamamla, type OauthAg } from "@/lib/build/buyumeSosyal";
import { hizAsildi, istekIp } from "@/lib/build/buyumeEkDepo";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ag: string }> };

/**
 * Sosyal hesap ve Google İşletme Profili OAuth geri dönüşü (herkese açık; doğrulama imzalı durum parametresiyle).
 * Sonuç küçük bir sayfa: açan pencereye haber verir ve kendini kapatır; açan pencere yoksa Vayra'ya dönüş bağlantısı gösterir.
 */
const kacir = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
function sayfa(ok: boolean, ag: string, baslik: string, metin: string) {
  const veri = JSON.stringify({ vayraBuyumeOauth: ag, ok, metin }).replace(/</g, "\\u003c");
  return new Response(`<!doctype html><html lang="tr"><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><meta name=robots content=noindex><title>${kacir(baslik)}</title><body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#0b0c0f;color:#eef1f5;font:15px/1.6 -apple-system,Segoe UI,Roboto,sans-serif"><main style="max-width:420px;margin:24px;padding:28px;border-radius:18px;background:#15171b;border:1px solid rgba(255,255,255,.08)"><p style="display:flex;align-items:center;gap:8px;margin:0 0 6px;font-weight:600;font-size:17px"><span style="width:9px;height:9px;border-radius:50%;background:${ok ? "#55d6fd" : "#f5a3a3"}"></span>${kacir(baslik)}</p><p style="margin:0;color:#aab1bb">${kacir(metin)}</p><p style="margin:16px 0 0"><a href="/panel/build" style="color:#8be6ff">Vayra Build'e dön</a></p></main><script>try{if(window.opener){window.opener.postMessage(${veri},location.origin);setTimeout(function(){window.close()},${ok ? 900 : 4000})}}catch(e){}</script></body></html>`, { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}

export async function GET(req: Request, { params }: Ctx) {
  const ag = (await params).ag as OauthAg;
  if (!(ag in SAGLAYICILAR)) return new Response("Bulunamadı", { status: 404 });
  if (hizAsildi(`oauth:${istekIp(req)}`, 20)) return sayfa(false, ag, "Çok fazla deneme", "Biraz bekleyip yeniden dene.");
  const u = new URL(req.url);
  const ad = SAGLAYICILAR[ag].ad;
  const hata = u.searchParams.get("error_description") || u.searchParams.get("error");
  if (hata) return sayfa(false, ag, `${ad} bağlanmadı`, hata === "access_denied" ? "İzin verilmedi; hesap bağlanmadı." : hata.slice(0, 200));
  const kod = u.searchParams.get("code"), durum = u.searchParams.get("state");
  if (!kod || !durum) return sayfa(false, ag, `${ad} bağlanmadı`, "Yetkilendirme kodu gelmedi.");
  try {
    const r = await yetkiTamamla(ag, durum, kod);
    return sayfa(true, ag, `${ad} bağlandı`, `${r.ad} hesabı projeye bağlandı. Bu pencere kapanıyor.`);
  } catch (e) {
    return sayfa(false, ag, `${ad} bağlanmadı`, (e as Error).message.slice(0, 300));
  }
}
