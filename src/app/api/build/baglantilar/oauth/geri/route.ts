import { baglantiGuncelleOz, baglantiTest } from "@/lib/build/baglantiDepo";
import { sahipOzeti } from "@/lib/build/depo";
import { yetkiTamamla } from "@/lib/build/mcpOauth";
import { sifrele } from "@/lib/build/sifre";
import { ucYaz } from "@/lib/build/baglantiUcDepo";

export const dynamic = "force-dynamic";

const esc = (x: string) => x.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const sayfa = (b: string, m: string, ok: boolean, id?: string) => { const baslik = esc(b), metin = esc(m); return new Response(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${baslik}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b0c;color:#fff;font:15px/1.6 system-ui,sans-serif}main{max-width:380px;padding:28px;text-align:center}h1{font-size:19px;margin:0 0 6px}p{color:rgba(255,255,255,.6);margin:0}</style></head>
<body><main><h1>${baslik}</h1><p>${metin}</p></main><script>try{window.opener&&window.opener.postMessage({vayra:"baglanti-oauth",ok:${ok},id:${JSON.stringify(id ?? "")}},location.origin)}catch(e){}setTimeout(function(){window.close()},${ok ? 900 : 4000});</script></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }); };

/** OAuth geri dönüşü: kodu token ile değiştirir, kasaya şifreli yazar, bağlantıyı dener, pencereyi kapatır. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const hataKodu = u.searchParams.get("error");
  if (hataKodu) return sayfa("Bağlantı kurulmadı", u.searchParams.get("error_description") ?? "Giriş iptal edildi.", false);
  const kod = u.searchParams.get("code"), durum = u.searchParams.get("state");
  if (!kod || !durum) return sayfa("Bağlantı kurulmadı", "Eksik bilgiyle döndü; yeniden dene.", false);
  try {
    const t = await yetkiTamamla(durum, kod);
    // Uç kullanıcı akışı: belirteçler kullanıcının kendi hesabına yazılır; sahibin bağlantısı değişmez.
    if (t.uc) {
      const tokenlar = sifrele(JSON.stringify(t.tokenlar));
      await ucYaz(t.baglantiId, t.uc.kullanici, (h) => { h.yetki = { ...h.yetki, tokenlar, oauth: t.ayar }; h.durum = "etkin"; });
      return sayfa("Hesabın bağlandı", "Bu pencere kapanıyor; uygulamaya dönebilirsin.", true, t.baglantiId);
    }
    const oz = sahipOzeti(t.sahip);
    await baglantiGuncelleOz(t.baglantiId, oz, (b) => { b.yetki.tur = "oauth"; b.yetki.oauth = t.ayar; b.yetki.tokenlar = sifrele(JSON.stringify(t.tokenlar)); b.sonYenileme = Date.now(); });
    const b = await baglantiTest(t.baglantiId, oz);
    return b?.durum === "etkin" ? sayfa("Bağlandı", `${b.ad} hazır; ${b.araclar.length} araç bulundu. Bu pencere kapanıyor.`, true, b.id) : sayfa("Giriş yapıldı ama bağlanamadı", b?.hata ?? "Sunucu yanıt vermedi.", false, t.baglantiId);
  } catch (e) { return sayfa("Bağlantı kurulmadı", (e as Error).message, false); }
}
