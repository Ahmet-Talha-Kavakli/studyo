import { createPrivateKey, randomBytes, sign } from "crypto";
import { projeOkuHam } from "@/lib/build/depo";
import { gunlukYaz } from "@/lib/build/gunluk";
import { donusDogrula, kokenBul, siteAdresi } from "@/lib/build/bulutKimlik";
import { kimlikAyarOku, oauthBaslat, oauthBitir, oauthIleGiris, oauthIstemci, UyeHatasi, type OauthSaglayici } from "@/lib/build/uye";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; saglayici: string; adim: string }> };

/**
 * GitHub, Microsoft ve Apple ile giriş (sahibin kendi OAuth istemcisiyle; yetki kodu akışı, durum çerezi, PKCE
 * destekleyenlerde PKCE). Google ile giriş /google altında ayrıdır.
 *  GET  basla?donus=<sitedeki sayfa>   → sağlayıcının onay ekranına yönlendirir
 *  GET  geri?code&state                → (GitHub, Microsoft) kodu sunucuda belirteçle değiştirir, üyeyi bulur ya da oluşturur
 *  POST geri (form_post)               → (Apple) aynı işlem; Apple dönüşü POST ile yapar
 * Başarıda dönüş adresine #vayra-oturum=<belirteç> (iki adımlı doğrulama açıksa #vayra-ikiadim=<belirteç>) ile döner.
 * E-posta yalnız sağlayıcı doğruladığını bildirirse mevcut hesaba bağlanır (Microsoft e-postası doğrulanmış sayılmaz).
 */
const AD: Record<OauthSaglayici, string> = { github: "GitHub", microsoft: "Microsoft", apple: "Apple" };
const metinSayfa = (m: string, durum = 400) => new Response(`<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Giriş yapılamadı</title><body style="margin:0;display:grid;place-items:center;min-height:100vh;font:15px system-ui;background:#f6f7f8;color:#111"><main style="max-width:420px;padding:24px;text-align:center"><p style="font-size:19px;font-weight:600;margin:0 0 8px">Giriş yapılamadı</p><p style="color:#555">${m.replace(/[<>&]/g, "")}</p></main>`, { status: durum, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
const cerezAdi = (id: string, s: string) => `vayra-oauth-${s}-${id}`;
const b64u = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const jwtYuk = (t: string) => JSON.parse(Buffer.from(t.split(".")[1] ?? "", "base64url").toString("utf8")) as Record<string, unknown>;

/** Apple istemci sırrı: .p8 anahtarıyla ES256 imzalı JWT (5 dakika geçerli). */
function appleSirri(i: { istemciId: string; sir: string; takimId?: string; anahtarId?: string }) {
  const z = Math.floor(Date.now() / 1000);
  const govde = `${b64u(JSON.stringify({ alg: "ES256", kid: i.anahtarId }))}.${b64u(JSON.stringify({ iss: i.takimId, iat: z, exp: z + 300, aud: "https://appleid.apple.com", sub: i.istemciId }))}`;
  const imza = sign("sha256", Buffer.from(govde), { key: createPrivateKey(i.sir), dsaEncoding: "ieee-p1363" });
  return `${govde}.${b64u(imza)}`;
}

async function isle(req: Request, { params }: Ctx, form?: URLSearchParams) {
  const { id, saglayici, adim } = await params;
  if (!["github", "microsoft", "apple"].includes(saglayici)) return metinSayfa("Bilinmeyen giriş sağlayıcısı.", 404);
  const s = saglayici as OauthSaglayici;
  const p = await projeOkuHam(id);
  if (!p) return metinSayfa("Proje bulunamadı.", 404);
  const koken = kokenBul(req);
  const istemci = await oauthIstemci(id, s);
  if (!istemci) return metinSayfa(`Bu sitede ${AD[s]} ile giriş açık değil. Site sahibi Bulut, Kimlik, Giriş yöntemleri bölümünden ${AD[s]} istemcisini eklemeli.`, 404);
  const geriAdres = `${koken}/api/build/uye/${id}/oauth/${s}/geri`;
  const q = form ?? new URL(req.url).searchParams;
  const guvenli = koken.startsWith("https");

  if (adim === "basla") {
    const ayar = await kimlikAyarOku(id);
    const donus = donusDogrula(p, new URL(req.url).searchParams.get("donus"), koken, ayar.yonlendirmeler) ?? siteAdresi(p, koken);
    const { durum, meydanOkuma } = await oauthBaslat(id, donus);
    const u = new URL(s === "github" ? "https://github.com/login/oauth/authorize" : s === "microsoft" ? "https://login.microsoftonline.com/common/oauth2/v2.0/authorize" : "https://appleid.apple.com/auth/authorize");
    const ortak = { client_id: istemci.istemciId, redirect_uri: geriAdres, state: durum };
    u.search = new URLSearchParams(s === "github" ? { ...ortak, scope: "read:user user:email", code_challenge: meydanOkuma, code_challenge_method: "S256", allow_signup: "true" }
      : s === "microsoft" ? { ...ortak, response_type: "code", response_mode: "query", scope: "openid email profile", code_challenge: meydanOkuma, code_challenge_method: "S256", prompt: "select_account" }
      : { ...ortak, response_type: "code", response_mode: "form_post", scope: "name email", nonce: randomBytes(12).toString("base64url") }).toString();
    // Apple dönüşü siteler arası POST'tur: çerez yalnız SameSite=None ile gelir (bu da Secure ister).
    const site = s === "apple" && guvenli ? "None" : "Lax";
    return new Response(null, { status: 302, headers: { Location: u.toString(), "Cache-Control": "no-store", "Set-Cookie": `${cerezAdi(id, s)}=${durum}; Path=/api/build/uye/${id}/oauth/${s}; Max-Age=600; HttpOnly; SameSite=${site}${guvenli ? "; Secure" : ""}` } });
  }

  if (adim === "geri") {
    const durum = q.get("state") ?? "";
    const cerez = (req.headers.get("cookie") ?? "").split(/;\s*/).find((x) => x.startsWith(cerezAdi(id, s) + "="))?.split("=")[1];
    const kayit = /^[A-Za-z0-9_-]{20,64}$/.test(durum) ? await oauthBitir(id, durum) : null;
    if (!kayit || cerez !== durum) return metinSayfa("Giriş isteğinin süresi doldu ya da başka bir tarayıcıda başlatıldı. Siteye dönüp tekrar dene.");
    const sil = `${cerezAdi(id, s)}=; Path=/api/build/uye/${id}/oauth/${s}; Max-Age=0; HttpOnly; SameSite=Lax`;
    const yonlendir = (parca: string) => new Response(null, { status: 302, headers: { Location: `${kayit.donus}#${parca}`, "Cache-Control": "no-store", "Set-Cookie": sil, "Referrer-Policy": "no-referrer" } });
    if (q.get("error")) return yonlendir(`vayra-hata=${encodeURIComponent(["access_denied", "user_cancelled_authorize"].includes(q.get("error")!) ? `${AD[s]} girişi iptal edildi.` : `${AD[s]} girişi tamamlanamadı.`)}`);
    try {
      const kod = q.get("code") ?? "";
      let profil: { sub: string; email: string; emailDogru: boolean; ad?: string; gorsel?: string };
      if (s === "github") {
        const r = await fetch("https://github.com/login/oauth/access_token", { method: "POST", signal: AbortSignal.timeout(10_000), headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: istemci.istemciId, client_secret: istemci.sir, code: kod, redirect_uri: geriAdres, code_verifier: kayit.dogrulayici }) });
        const j = await r.json().catch(() => ({})) as { access_token?: string; error?: string };
        if (!j.access_token) throw new UyeHatasi(j.error === "incorrect_client_credentials" ? "GitHub istemci kimliği ya da gizli anahtarı hatalı." : j.error === "redirect_uri_mismatch" ? "GitHub uygulamasındaki dönüş adresi eşleşmiyor." : "GitHub belirteci alınamadı.");
        const h = { Authorization: `Bearer ${j.access_token}`, Accept: "application/vnd.github+json", "User-Agent": "Vayra-Build" };
        const [ku, ep] = await Promise.all([fetch("https://api.github.com/user", { headers: h, signal: AbortSignal.timeout(10_000) }).then((x) => x.json()), fetch("https://api.github.com/user/emails", { headers: h, signal: AbortSignal.timeout(10_000) }).then((x) => (x.ok ? x.json() : []))]) as [{ id?: number; name?: string; login?: string; avatar_url?: string }, { email: string; primary: boolean; verified: boolean }[]];
        if (!ku.id) throw new UyeHatasi("GitHub kullanıcı bilgisi alınamadı.");
        const birincil = Array.isArray(ep) ? ep.find((e) => e.primary && e.verified) ?? ep.find((e) => e.verified) : undefined;
        profil = { sub: String(ku.id), email: birincil?.email ?? "", emailDogru: !!birincil, ad: ku.name || ku.login, gorsel: ku.avatar_url };
      } else {
        const r = await fetch(s === "microsoft" ? "https://login.microsoftonline.com/common/oauth2/v2.0/token" : "https://appleid.apple.com/auth/token", {
          method: "POST", signal: AbortSignal.timeout(10_000), headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
          body: new URLSearchParams({ client_id: istemci.istemciId, client_secret: s === "apple" ? appleSirri(istemci) : istemci.sir, code: kod, redirect_uri: geriAdres, grant_type: "authorization_code", ...(s === "microsoft" ? { code_verifier: kayit.dogrulayici, scope: "openid email profile" } : {}) }),
        });
        const j = await r.json().catch(() => ({})) as { id_token?: string; error?: string; error_description?: string };
        if (!j.id_token) throw new UyeHatasi(j.error === "invalid_client" ? `${AD[s]} istemci bilgileri hatalı.` : j.error === "invalid_grant" ? `${AD[s]} kodu geçersiz ya da dönüş adresi eşleşmiyor.` : `${AD[s]} belirteci alınamadı.`);
        // Belirteç doğrudan sağlayıcının belirteç ucundan TLS ile geldi; alanlar yine de denetlenir.
        const y = jwtYuk(j.id_token);
        const iss = String(y.iss ?? "");
        const issOk = s === "apple" ? iss === "https://appleid.apple.com" : /^https:\/\/login\.microsoftonline\.com\/[0-9a-f-]{36}\/v2\.0$/.test(iss);
        if (!issOk || y.aud !== istemci.istemciId || !y.sub || Number(y.exp ?? 0) * 1000 < Date.now()) throw new UyeHatasi(`${AD[s]} kimlik belirteci doğrulanamadı.`);
        // Apple adı yalnız ilk girişte form alanında (user) gönderir.
        let ad: string | undefined;
        try { const u = JSON.parse(q.get("user") ?? "null") as { name?: { firstName?: string; lastName?: string } } | null; ad = [u?.name?.firstName, u?.name?.lastName].filter(Boolean).join(" ") || undefined; } catch { /* yok */ }
        profil = s === "apple"
          ? { sub: String(y.sub), email: String(y.email ?? ""), emailDogru: y.email_verified === true || y.email_verified === "true", ad }
          : { sub: `${y.tid ?? ""}:${y.oid ?? y.sub}`, email: String(y.email ?? y.preferred_username ?? ""), emailDogru: false, ad: typeof y.name === "string" ? y.name : undefined };
      }
      const g = await oauthIleGiris(id, s, profil);
      gunlukYaz(id, { t: "uye", d: 200, m: `${AD[s]} ile giriş` });
      return yonlendir(g.mfa ? `vayra-ikiadim=${g.mfa}` : `vayra-oturum=${g.oturum}`);
    } catch (e) {
      gunlukYaz(id, { t: "uye", d: 400, m: `${AD[s]} girişi başarısız: ${(e as Error).message.slice(0, 120)}` });
      return yonlendir(`vayra-hata=${encodeURIComponent(e instanceof UyeHatasi ? e.message : `${AD[s]} girişi tamamlanamadı.`)}`);
    }
  }
  return metinSayfa("Bilinmeyen adım.", 404);
}

export function GET(req: Request, ctx: Ctx) { return isle(req, ctx); }
/** Apple form_post dönüşü. */
export async function POST(req: Request, ctx: Ctx) {
  const f = new URLSearchParams(await req.text().catch(() => ""));
  return isle(req, ctx, f);
}
