import "server-only";
import { createHash, createPublicKey, randomBytes, sign as imzala, timingSafeEqual, verify as dogrula, type JsonWebKeyInput } from "crypto";
import { belirtecKullan, belirtecUret } from "./belirtec";
import {
  epostaNormal, epostadanUid, hesapGuncelle, hesapOku, olayEkle, saglayiciSil, saglayiciUid, saglayiciYaz, type HesapKaydi,
} from "./depo";
import { cihazAdi, gelistirme, istekKokeni, istemciIp } from "./guvenlik";
import { hesapOlustur, rolYukselt } from "./hesap";
import { cerezOku, cerezYaz, hesapOnbelleginiDusur, oturumDizinleriniSil } from "./oturum";
import { ortam, saglayiciKurulu } from "./saglayiciAyar";
import { SAGLAYICI_AD, type SaglayiciKimligi } from "./tipler";

/**
 * Google, Apple ve Microsoft ile giriş (OpenID Connect, yetkilendirme kodu akışı).
 *  - state: tek kullanımlık belirteç (10 dk), tarayıcıya bağlı: vayra_oauth çerezinin özeti durum kaydında.
 *  - PKCE (S256): Google ve Microsoft. Apple PKCE kabul etmediği için state + nonce + imzalı istemci sırrı.
 *  - id_token: sağlayıcının JWKS anahtarıyla imza, iss, aud, exp ve nonce denetlenir.
 *  - Hesap eşleme önce sağlayıcı kimliğiyle (sub). Yoksa yalnız sağlayıcının doğruladığı e-posta mevcut hesaba
 *    bağlanır; o hesabın e-postası doğrulanmamışsa (başkası önceden açmış olabilir) şifresi, iki adımı ve oturumları
 *    silinir. Doğrulanmamış e-posta mevcut hesaba asla bağlanmaz.
 */
export const OAUTH_CEREZI = "vayra_oauth";

interface Ayar { yetki: string; token: string; jwks: string; kapsam: string; pkce: boolean; formPost: boolean; istemci: string; sir: () => string; iss: (iss: string, c: Iddialar) => boolean }
interface Iddialar { iss?: string; aud?: string | string[]; exp?: number; iat?: number; nonce?: string; sub?: string; email?: string; email_verified?: boolean | string; name?: string; given_name?: string; family_name?: string; picture?: string; tid?: string; oid?: string; preferred_username?: string; xms_edov?: boolean | string }

const MS_TUKETICI = "9188040d-6c67-4c5b-b112-36a304b66dad";

function appleSirri(): string {
  const simdi = Math.floor(Date.now() / 1000);
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const giris = `${b64({ alg: "ES256", kid: ortam("VAYRA_APPLE_KEY_ID") })}.${b64({ iss: ortam("VAYRA_APPLE_TEAM_ID"), iat: simdi, exp: simdi + 600, aud: "https://appleid.apple.com", sub: ortam("VAYRA_APPLE_CLIENT_ID") })}`;
  const anahtar = ortam("VAYRA_APPLE_PRIVATE_KEY").replace(/\\n/g, "\n");
  return `${giris}.${imzala("sha256", Buffer.from(giris), { key: anahtar, dsaEncoding: "ieee-p1363" }).toString("base64url")}`;
}

function ayar(s: SaglayiciKimligi): Ayar | null {
  if (!saglayiciKurulu(s)) return null;
  if (s === "google") return {
    yetki: "https://accounts.google.com/o/oauth2/v2/auth", token: "https://oauth2.googleapis.com/token", jwks: "https://www.googleapis.com/oauth2/v3/certs",
    kapsam: "openid email profile", pkce: true, formPost: false, istemci: ortam("VAYRA_GOOGLE_CLIENT_ID"), sir: () => ortam("VAYRA_GOOGLE_CLIENT_SECRET"),
    iss: (i) => i === "https://accounts.google.com" || i === "accounts.google.com",
  };
  if (s === "microsoft") {
    const kiraci = ortam("VAYRA_MICROSOFT_TENANT") || "common";
    return {
      yetki: `https://login.microsoftonline.com/${kiraci}/oauth2/v2.0/authorize`, token: `https://login.microsoftonline.com/${kiraci}/oauth2/v2.0/token`,
      jwks: `https://login.microsoftonline.com/${kiraci}/discovery/v2.0/keys`, kapsam: "openid email profile", pkce: true, formPost: false,
      istemci: ortam("VAYRA_MICROSOFT_CLIENT_ID"), sir: () => ortam("VAYRA_MICROSOFT_CLIENT_SECRET"),
      iss: (i, c) => !!c.tid && i === `https://login.microsoftonline.com/${c.tid}/v2.0` && (["common", "organizations", "consumers"].includes(kiraci) || c.tid === kiraci),
    };
  }
  return {
    yetki: "https://appleid.apple.com/auth/authorize", token: "https://appleid.apple.com/auth/token", jwks: "https://appleid.apple.com/auth/keys",
    kapsam: "name email", pkce: false, formPost: true, istemci: ortam("VAYRA_APPLE_CLIENT_ID"), sir: appleSirri, iss: (i) => i === "https://appleid.apple.com",
  };
}

const donusAdresi = (req: Request, s: SaglayiciKimligi) => `${istekKokeni(req)}/api/hesap/oauth/${s}/donus`;
/** Yalnız site içi yol (açık yönlendirmeye karşı). */
export const guvenliYol = (y: unknown, varsayilan = "/panel") => (typeof y === "string" && /^\/(?![/\\])[^\s]*$/.test(y) && y.length < 400 ? y : varsayilan);

interface Durum { s: SaglayiciKimligi; dogrulayici: string; nonce: string; geri: string; baglayici: string; bagla?: string }

/** Başlangıç: sağlayıcıya yönlendirme adresi ve bağlayıcı çerez. */
export async function oauthBaslat(req: Request, s: SaglayiciKimligi, g: { geri: string; bagla?: string }): Promise<{ adres: string; cerez: string } | null> {
  const a = ayar(s);
  if (!a) return null;
  const baglayici = randomBytes(24).toString("base64url");
  const dogrulayici = randomBytes(32).toString("base64url");
  const nonce = randomBytes(16).toString("base64url");
  const state = await belirtecUret<Durum>("oauth", { s, dogrulayici, nonce, geri: guvenliYol(g.geri), baglayici: createHash("sha256").update(baglayici).digest("base64url"), ...(g.bagla ? { bagla: g.bagla } : {}) }, 10 * 60_000);
  const q = new URLSearchParams({ client_id: a.istemci, redirect_uri: donusAdresi(req, s), response_type: "code", scope: a.kapsam, state, nonce });
  if (a.pkce) { q.set("code_challenge", createHash("sha256").update(dogrulayici).digest("base64url")); q.set("code_challenge_method", "S256"); }
  if (a.formPost) q.set("response_mode", "form_post");
  if (s !== "apple") q.set("prompt", "select_account");
  // Apple dönüşü siteler arası POST: bağlayıcı çerez SameSite=None olmalı (üretimde Secure).
  const cerez = cerezYaz(OAUTH_CEREZI, baglayici, 600, { yol: "/api/hesap/oauth", sameSite: gelistirme() ? "Lax" : "None" });
  return { adres: `${a.yetki}?${q}`, cerez };
}

/* ── id_token doğrulama ── */

type Jwk = JsonWebKeyInput["key"] & { kid?: string };
const G = globalThis as unknown as { __vayraJwks?: Map<string, { zaman: number; anahtarlar: Jwk[] }> };
const JWKS = (G.__vayraJwks ??= new Map());

async function jwksAl(adres: string, yenile = false): Promise<Jwk[]> {
  const o = JWKS.get(adres);
  if (o && !yenile && o.zaman > Date.now() - 3_600_000) return o.anahtarlar;
  const r = await fetch(adres, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`JWKS ${r.status}`);
  const j = (await r.json()) as { keys?: Jwk[] };
  JWKS.set(adres, { zaman: Date.now(), anahtarlar: j.keys ?? [] });
  return j.keys ?? [];
}

async function idTokenDogrula(jwt: string, a: Ayar, nonce: string): Promise<Iddialar | null> {
  const [h, p, im] = jwt.split(".");
  if (!h || !p || !im) return null;
  let baslik: { alg?: string; kid?: string }, iddia: Iddialar;
  try { baslik = JSON.parse(Buffer.from(h, "base64url").toString()); iddia = JSON.parse(Buffer.from(p, "base64url").toString()); } catch { return null; }
  if (baslik.alg !== "RS256" || !baslik.kid) return null;
  let anahtar = (await jwksAl(a.jwks)).find((k) => k.kid === baslik.kid);
  if (!anahtar) anahtar = (await jwksAl(a.jwks, true)).find((k) => k.kid === baslik.kid);
  if (!anahtar) return null;
  const { kid: _k, ...jwk } = anahtar; void _k;
  const imzaGecerli = dogrula("sha256", Buffer.from(`${h}.${p}`), createPublicKey({ key: jwk, format: "jwk" }), Buffer.from(im, "base64url"));
  if (!imzaGecerli) return null;
  const simdi = Math.floor(Date.now() / 1000);
  const aud = Array.isArray(iddia.aud) ? iddia.aud : [iddia.aud];
  if (!iddia.iss || !a.iss(iddia.iss, iddia) || !aud.includes(a.istemci) || !iddia.exp || iddia.exp < simdi - 60 || (iddia.iat && iddia.iat > simdi + 300) || !iddia.sub) return null;
  const n1 = Buffer.from(String(iddia.nonce ?? "")), n2 = Buffer.from(nonce);
  if (n1.length !== n2.length || !timingSafeEqual(n1, n2)) return null;
  return iddia;
}

export interface DisKimlik { s: SaglayiciKimligi; kimlik: string; email: string | null; dogrulandi: boolean; ad: string; avatar?: string }
export type DonusSonucu = { ok: true; kimlik: DisKimlik; geri: string; bagla?: string } | { ok: false; kod: string; geri: string };

/** Dönüş: durum ve tarayıcı bağını doğrular, kodu belirteçle değiştirir, kimliği çıkarır. */
export async function oauthDonus(req: Request, s: SaglayiciKimligi): Promise<DonusSonucu> {
  const a = ayar(s);
  if (!a) return { ok: false, kod: "kurulu-degil", geri: "/panel" };
  const p = new URL(req.url).searchParams;
  let alan: Record<string, string> = Object.fromEntries(p);
  if (req.method === "POST") { try { alan = { ...alan, ...Object.fromEntries((await req.formData()).entries() as Iterable<[string, string]>) }; } catch { /* boş */ } }
  const durum = await belirtecKullan<Durum>(alan.state, "oauth");
  if (!durum || durum.s !== s) return { ok: false, kod: "durum", geri: "/panel" };
  const baglayici = cerezOku(req, OAUTH_CEREZI);
  if (!baglayici || createHash("sha256").update(baglayici).digest("base64url") !== durum.baglayici) return { ok: false, kod: "durum", geri: durum.geri };
  if (alan.error) return { ok: false, kod: alan.error === "access_denied" || alan.error === "user_cancelled_authorize" ? "iptal" : "dogrulanamadi", geri: durum.geri };
  if (!alan.code) return { ok: false, kod: "dogrulanamadi", geri: durum.geri };

  let jeton: { id_token?: string; error?: string };
  try {
    const govde = new URLSearchParams({ grant_type: "authorization_code", code: alan.code, redirect_uri: donusAdresi(req, s), client_id: a.istemci, client_secret: a.sir() });
    if (a.pkce) govde.set("code_verifier", durum.dogrulayici);
    const r = await fetch(a.token, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: govde, signal: AbortSignal.timeout(10_000) });
    jeton = await r.json();
    if (!r.ok || !jeton.id_token) { console.error(`[hesap] ${s} belirteç değişimi başarısız:`, r.status, jeton.error); return { ok: false, kod: "dogrulanamadi", geri: durum.geri }; }
  } catch (e) { console.error(`[hesap] ${s} belirteç isteği:`, (e as Error).message); return { ok: false, kod: "dogrulanamadi", geri: durum.geri }; }

  const c = await idTokenDogrula(jeton.id_token, a, durum.nonce).catch(() => null);
  if (!c) return { ok: false, kod: "dogrulanamadi", geri: durum.geri };

  let ad = c.name || [c.given_name, c.family_name].filter(Boolean).join(" ");
  if (s === "apple" && alan.user) { try { const u = JSON.parse(alan.user) as { name?: { firstName?: string; lastName?: string } }; ad = [u.name?.firstName, u.name?.lastName].filter(Boolean).join(" ") || ad; } catch { /* yok */ } }
  let email = c.email ?? null;
  if (!email && s === "microsoft" && c.preferred_username && /@/.test(c.preferred_username)) email = c.preferred_username;
  const dogrulandi = s === "microsoft"
    ? !!email && (c.tid === MS_TUKETICI || c.xms_edov === true || c.xms_edov === "1" || c.xms_edov === "true")
    : c.email_verified === true || c.email_verified === "true";
  const kimlik = s === "microsoft" ? `${c.tid}:${c.oid || c.sub}` : c.sub!;
  return {
    ok: true, geri: durum.geri, ...(durum.bagla ? { bagla: durum.bagla } : {}),
    kimlik: { s, kimlik, email: email ? epostaNormal(email) : null, dogrulandi, ad: ad || (email ? email.split("@")[0] : SAGLAYICI_AD[s]), ...(c.picture && /^https:\/\//.test(c.picture) ? { avatar: c.picture } : {}) },
  };
}

export type EslesmeSonucu = { ok: true; hesap: HesapKaydi; yeni: boolean; baglandi?: boolean } | { ok: false; kod: "baglanamadi" | "eposta-yok" | "baska-hesap" | "hesap-yok" };

/** Dış kimliği Vayra hesabına eşler: bağlı hesap, bağlama isteği, doğrulanmış e-postayla eşleme ya da yeni hesap. */
export async function disKimlikEsle(req: Request, k: DisKimlik, bagla?: string): Promise<EslesmeSonucu> {
  const cihaz = cihazAdi(req), ip = istemciIp(req);
  const kayit = { tur: k.s, kimlik: k.kimlik, ...(k.email ? { email: k.email } : {}), baglanma: Date.now() };
  const bagli = await saglayiciUid(k.s, k.kimlik);

  if (bagla) {
    if (bagli && bagli !== bagla) return { ok: false, kod: "baska-hesap" };
    const r = await hesapGuncelle(bagla, async (h) => {
      if (!h.saglayicilar.some((x) => x.tur === k.s && x.kimlik === k.kimlik)) h.saglayicilar.push(kayit);
      await saglayiciYaz(k.s, k.kimlik, h.uid);
      olayEkle(h, "saglayici-bagla", cihaz, SAGLAYICI_AD[k.s], ip);
    });
    return r ? { ok: true, hesap: r.hesap, yeni: false, baglandi: true } : { ok: false, kod: "hesap-yok" };
  }

  if (bagli) {
    const h = await hesapOku(bagli);
    if (h) return { ok: true, hesap: h, yeni: false };
    await saglayiciSil(k.s, k.kimlik).catch(() => {});
  }
  if (!k.email) return { ok: false, kod: "eposta-yok" };

  const mevcut = await epostadanUid(k.email);
  if (mevcut) {
    if (!k.dogrulandi) return { ok: false, kod: "baglanamadi" };
    const r = await hesapGuncelle(mevcut, async (h) => {
      if (!h.epostaDogrulandi) {
        // Bu adresi doğrulamadan açılmış hesap: e-postanın gerçek sahibi şimdi geldi. Önceki erişim yolları kapanır.
        delete h.sifre; delete h.ikiAdim; delete h.ikiAdimKurulum;
        await oturumDizinleriniSil(h); h.oturumlar = [];
        h.epostaDogrulandi = true;
        olayEkle(h, "eposta-dogrula", cihaz, `${SAGLAYICI_AD[k.s]} ile doğrulandı; önceki şifre ve oturumlar kaldırıldı`, ip);
      }
      h.saglayicilar = [...h.saglayicilar.filter((x) => !(x.tur === k.s && x.kimlik === k.kimlik)), kayit];
      await saglayiciYaz(k.s, k.kimlik, h.uid);
      olayEkle(h, "saglayici-bagla", cihaz, SAGLAYICI_AD[k.s], ip);
      rolYukselt(h);
    });
    hesapOnbelleginiDusur(mevcut);
    return r ? { ok: true, hesap: r.hesap, yeni: false } : { ok: false, kod: "hesap-yok" };
  }

  const o = await hesapOlustur({ email: k.email, ad: k.ad, dogrulandi: k.dogrulandi, saglayici: kayit, cihaz, ip, yontem: SAGLAYICI_AD[k.s] });
  if (!o.ok) return disKimlikEsle(req, k); // aynı anda açıldıysa bir kez daha eşle
  await saglayiciYaz(k.s, k.kimlik, o.hesap.uid);
  if (k.avatar) await hesapGuncelle(o.hesap.uid, (h) => { h.profil.avatar ??= k.avatar; });
  return { ok: true, hesap: (await hesapOku(o.hesap.uid)) ?? o.hesap, yeni: true };
}

/** Sağlayıcı bağını kaldırır. Hesapta başka giriş yolu kalmayacaksa reddedilir. */
export async function saglayiciKaldir(uid: string, s: SaglayiciKimligi, cihaz: string): Promise<"tamam" | "son-yol" | "yok"> {
  const r = await hesapGuncelle(uid, async (h) => {
    const bu = h.saglayicilar.filter((x) => x.tur === s);
    if (!bu.length) return "yok" as const;
    if (!h.sifre && h.saglayicilar.length === bu.length) return "son-yol" as const;
    for (const x of bu) await saglayiciSil(x.tur, x.kimlik);
    h.saglayicilar = h.saglayicilar.filter((x) => x.tur !== s);
    olayEkle(h, "saglayici-kaldir", cihaz, SAGLAYICI_AD[s]);
    return "tamam" as const;
  });
  return r?.sonuc ?? "yok";
}
