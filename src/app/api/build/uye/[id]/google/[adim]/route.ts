import { projeOkuHam } from "@/lib/build/depo";
import { gunlukYaz } from "@/lib/build/gunluk";
import { donusDogrula, kokenBul, siteAdresi } from "@/lib/build/bulutKimlik";
import { googleIleGiris, googleIstemci, kimlikAyarOku, oauthBaslat, oauthBitir, UyeHatasi } from "@/lib/build/uye";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; adim: string }> };

/**
 * Google ile giriş (sahibin kendi Google OAuth istemcisiyle; yetki kodu akışı + PKCE + durum çerezi).
 *  GET basla?donus=<sitedeki sayfa>  → Google onay ekranına yönlendirir
 *  GET geri?code&state                → kodu sunucuda belirteçle değiştirir, üyeyi bulur ya da oluşturur, oturum açar ve
 *                                       dönüş adresine #vayra-oturum=<belirteç> ile yönlendirir (parça sunucuya gitmez).
 * Dönüş adresi yalnız projenin kendi adresleri ya da Kimlik > Ayarlar'daki izin listesi olabilir.
 */
const metinSayfa = (m: string, durum = 400) => new Response(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Giriş yapılamadı</title><body style="margin:0;display:grid;place-items:center;min-height:100vh;font:15px system-ui;background:#f6f7f8;color:#111"><main style="max-width:420px;padding:24px;text-align:center"><p style="font-size:19px;font-weight:600;margin:0 0 8px">Giriş yapılamadı</p><p style="color:#555">${m.replace(/[<>&]/g, "")}</p></main>`, { status: durum, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
const cerezAdi = (id: string) => `vayra-oauth-${id}`;

export async function GET(req: Request, { params }: Ctx) {
  const { id, adim } = await params;
  const p = await projeOkuHam(id);
  if (!p) return metinSayfa("Proje bulunamadı.", 404);
  const koken = kokenBul(req);
  const istemci = await googleIstemci(id);
  if (!istemci) return metinSayfa("Bu sitede Google ile giriş açık değil. Site sahibi Bulut › Kimlik bölümünden Google istemcisini eklemeli.", 404);
  const geriAdres = `${koken}/api/build/uye/${id}/google/geri`;
  const q = new URL(req.url).searchParams;

  if (adim === "basla") {
    const ayar = await kimlikAyarOku(id);
    const donus = donusDogrula(p, q.get("donus"), koken, ayar.yonlendirmeler) ?? siteAdresi(p, koken);
    const { durum, meydanOkuma } = await oauthBaslat(id, donus);
    const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    u.search = new URLSearchParams({ client_id: istemci.istemciId, redirect_uri: geriAdres, response_type: "code", scope: "openid email profile", state: durum, code_challenge: meydanOkuma, code_challenge_method: "S256", prompt: "select_account" }).toString();
    return new Response(null, { status: 302, headers: { Location: u.toString(), "Cache-Control": "no-store", "Set-Cookie": `${cerezAdi(id)}=${durum}; Path=/api/build/uye/${id}/google; Max-Age=600; HttpOnly; SameSite=Lax${koken.startsWith("https") ? "; Secure" : ""}` } });
  }

  if (adim === "geri") {
    const durum = q.get("state") ?? "";
    const cerez = (req.headers.get("cookie") ?? "").split(/;\s*/).find((x) => x.startsWith(cerezAdi(id) + "="))?.split("=")[1];
    const kayit = /^[A-Za-z0-9_-]{20,64}$/.test(durum) ? await oauthBitir(id, durum) : null;
    if (!kayit || cerez !== durum) return metinSayfa("Giriş isteğinin süresi doldu ya da başka bir tarayıcıda başlatıldı. Siteye dönüp tekrar dene.");
    const sil = `${cerezAdi(id)}=; Path=/api/build/uye/${id}/google; Max-Age=0; HttpOnly; SameSite=Lax`;
    const yonlendir = (parca: string) => new Response(null, { status: 302, headers: { Location: `${kayit.donus}#${parca}`, "Cache-Control": "no-store", "Set-Cookie": sil, "Referrer-Policy": "no-referrer" } });
    if (q.get("error")) return yonlendir(`vayra-hata=${encodeURIComponent(q.get("error") === "access_denied" ? "Google girişi iptal edildi." : "Google girişi tamamlanamadı.")}`);
    try {
      const r = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: AbortSignal.timeout(10_000),
        body: new URLSearchParams({ code: q.get("code") ?? "", client_id: istemci.istemciId, client_secret: istemci.sir, redirect_uri: geriAdres, grant_type: "authorization_code", code_verifier: kayit.dogrulayici }),
      });
      const j = await r.json().catch(() => ({})) as { id_token?: string; error?: string; error_description?: string };
      if (!r.ok || !j.id_token) throw new UyeHatasi(j.error === "invalid_client" ? "Google istemci kimliği ya da gizli anahtarı hatalı." : j.error === "redirect_uri_mismatch" ? "Google istemcisinde yönlendirme adresi eksik." : "Google belirteci alınamadı.");
      // Belirteç doğrudan Google'ın belirteç ucundan TLS üzerinden geldi; içerik alanları yine de denetlenir.
      const yuk = JSON.parse(Buffer.from(j.id_token.split(".")[1] ?? "", "base64url").toString("utf8")) as { iss?: string; aud?: string; exp?: number; sub?: string; email?: string; email_verified?: boolean; name?: string; picture?: string };
      if (!["accounts.google.com", "https://accounts.google.com"].includes(yuk.iss ?? "") || yuk.aud !== istemci.istemciId || !yuk.sub || (yuk.exp ?? 0) * 1000 < Date.now()) throw new UyeHatasi("Google kimlik belirteci doğrulanamadı.");
      const s = await googleIleGiris(id, { sub: yuk.sub, email: yuk.email ?? "", emailDogru: !!yuk.email_verified, ad: yuk.name, gorsel: yuk.picture });
      gunlukYaz(id, { t: "uye", d: 200, m: "Google ile giriş" });
      return yonlendir(s.mfa ? `vayra-ikiadim=${s.mfa}` : `vayra-oturum=${s.oturum}`);
    } catch (e) {
      gunlukYaz(id, { t: "uye", d: 400, m: `Google girişi başarısız: ${(e as Error).message.slice(0, 120)}` });
      return yonlendir(`vayra-hata=${encodeURIComponent(e instanceof UyeHatasi ? e.message : "Google girişi tamamlanamadı.")}`);
    }
  }
  return metinSayfa("Bilinmeyen adım.", 404);
}
