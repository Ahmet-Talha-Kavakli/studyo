import "server-only";
import { dilimZaman } from "./bolge";
import { createHash, randomBytes } from "crypto";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { mkdir, readdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { coz, sifrele } from "./sifre";
import { projeOkuHam } from "./depo";
import { buyumeGuncelle, buyumeOku } from "./buyumeDepo";
import { ekGuncelle, ekOku, imza } from "./buyumeEkDepo";
import { gonderiMetni, type Gonderi } from "./buyumeTipler";
import { KANAL_HEDEF, type HedefTur, type SosyalAg, type SosyalHedef, type SosyalHesap } from "./buyumeKanalTipler";

/**
 * Büyüme sosyal hesap bağlantıları (OAuth 2.0) ve zamanlanmış otomatik paylaşım.
 *  - Meta (Facebook Sayfası ve Instagram profesyonel hesabı), LinkedIn (kişi ve isteğe bağlı şirket sayfası), X, TikTok
 *    ve Google İşletme Profili (gönderiler buyumeGbp.ts'de).
 *  - Uygulama anahtarları ortam değişkenlerinde; yoksa bağla düğmesi kapalıdır ve arayüz eksik değişkeni söyler.
 *  - Belirteçler AES-256-GCM kasasında (.veri/build/buyume-sosyal/<proje>.json, sifre.ts); tarayıcıya ve modele gitmez.
 *  - Zamanlayıcı dakikada bir: "Hazır" durumda, tarihi ve saati gelmiş gönderileri seçili hedeflere paylaşır, gönderiyi
 *    Paylaşıldı yapar ve adresini yazar. Başarısız deneme en çok 3 kez, aralıklarla yinelenir; hata arayüzde görünür.
 */
const KASA = path.join(DEPO_KOK, "build", "buyume-sosyal");
const BEKLEYEN = path.join(DEPO_KOK, "build", "buyume-sosyal-bekleyen.json");
const KIMLIK = /^[A-Za-z0-9_-]{12}$/;
export const OAUTH_YOLU = "/api/build/buyume-genel/oauth";
export type OauthAg = SosyalAg | "google";
type Tokenlar = { erisim: string; yenileme?: string; bitis?: number; hedef?: Record<string, string>; koken?: string };

export const SAGLAYICILAR: Record<OauthAg, { ad: string; env: [string, string]; ek?: string[] }> = {
  meta: { ad: "Meta", env: ["META_APP_ID", "META_APP_SECRET"] },
  linkedin: { ad: "LinkedIn", env: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"] },
  x: { ad: "X", env: ["X_CLIENT_ID", "X_CLIENT_SECRET"] },
  tiktok: { ad: "TikTok", env: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"] },
  google: { ad: "Google İşletme Profili", env: ["GOOGLE_ISLETME_ISTEMCI_ID", "GOOGLE_ISLETME_ISTEMCI_GIZLI"] },
};
export const anahtarDurumu = (ag: OauthAg) => { const e = SAGLAYICILAR[ag].env; return { anahtar: e.every((x) => !!process.env[x]), eksik: e.filter((x) => !process.env[x]) }; };
const istemci = (ag: OauthAg) => ({ id: process.env[SAGLAYICILAR[ag].env[0]] ?? "", gizli: process.env[SAGLAYICILAR[ag].env[1]] ?? "" });
export const donusAdresi = (koken: string, ag: OauthAg) => `${koken}${OAUTH_YOLU}/${ag}`;
const META_SURUM = process.env.META_GRAPH_SURUM || "v21.0";
/** LinkedIn sürüm başlığı (YYYYMM): her sürüm bir yıl desteklenir; üç ay önceki ay güvenlidir. */
const linkedinSurum = () => { if (process.env.LINKEDIN_API_SURUM) return process.env.LINKEDIN_API_SURUM; const t = new Date(); t.setUTCMonth(t.getUTCMonth() - 3); return `${t.getUTCFullYear()}${String(t.getUTCMonth() + 1).padStart(2, "0")}`; };

/* ── Kasa ── */
const kasaDosya = (p: string) => path.join(KASA, `${p}.json`);
async function kasaOku(p: string): Promise<Record<string, string>> { if (!KIMLIK.test(p)) return {}; try { return JSON.parse(await readFile(kasaDosya(p), "utf8")); } catch { return {}; } }
export async function belirtecAl(p: string, ag: OauthAg): Promise<Tokenlar | null> { const k = await kasaOku(p); const c = coz(k[ag]); if (!c) return null; try { return JSON.parse(c) as Tokenlar; } catch { return null; } }
async function belirtecYaz(p: string, ag: OauthAg, t: Tokenlar | null) {
  const k = await kasaOku(p);
  if (t) k[ag] = sifrele(JSON.stringify(t)); else delete k[ag];
  await mkdir(KASA, { recursive: true });
  if (Object.keys(k).length) await writeFile(kasaDosya(p), JSON.stringify(k), { mode: 0o600 }); else await rm(kasaDosya(p), { force: true });
}
export async function baglantiyiKes(p: string, ag: OauthAg) {
  await belirtecYaz(p, ag, null);
  if (ag !== "google") await ekGuncelle(p, (v) => { v.sosyal = v.sosyal.filter((h) => h.ag !== ag); });
  else await ekGuncelle(p, (v) => { v.gbp.konum = undefined; });
}

/* ── Bekleyen yetkilendirmeler (durum parametresi imzalı; PKCE doğrulayıcısı sunucuda) ── */
type Bekleyen = { p: string; ag: OauthAg; v?: string; z: number; koken: string };
const GB = globalThis as unknown as { __vayraSosyalBekleyen?: Record<string, Bekleyen> };
function bekleyenler(): Record<string, Bekleyen> { if (!GB.__vayraSosyalBekleyen) { try { GB.__vayraSosyalBekleyen = JSON.parse(readFileSync(BEKLEYEN, "utf8")); } catch { GB.__vayraSosyalBekleyen = {}; } } const b = GB.__vayraSosyalBekleyen!; for (const [k, x] of Object.entries(b)) if (Date.now() - x.z > 20 * 60_000) delete b[k]; return b; }
const bekleyenYaz = () => { try { mkdirSync(path.dirname(BEKLEYEN), { recursive: true }); writeFileSync(BEKLEYEN, JSON.stringify(bekleyenler()), { mode: 0o600 }); } catch { /* yok */ } };
const b64 = (b: Buffer) => b.toString("base64url");

/** Yetkilendirme adresini üretir (sahip doğrulanmış uçtan çağrılır). */
export function yetkiAdresi(p: string, ag: OauthAg, koken: string): string {
  const { id } = istemci(ag);
  if (!anahtarDurumu(ag).anahtar) throw new Error(`${SAGLAYICILAR[ag].ad} uygulama anahtarları sunucuda tanımlı değil: ${anahtarDurumu(ag).eksik.join(", ")}.`);
  const nonce = b64(randomBytes(18));
  const state = `${nonce}.${imza("o" + nonce)}`;
  const dogrulayici = b64(randomBytes(40));
  const meydan = b64(createHash("sha256").update(dogrulayici).digest());
  bekleyenler()[nonce] = { p, ag, v: dogrulayici, z: Date.now(), koken }; bekleyenYaz();
  const donus = donusAdresi(koken, ag);
  const q = (o: Record<string, string>) => new URLSearchParams(o).toString();
  switch (ag) {
    case "meta": return `https://www.facebook.com/${META_SURUM}/dialog/oauth?${q({ client_id: id, redirect_uri: donus, state, response_type: "code", scope: "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,business_management" })}`;
    case "linkedin": return `https://www.linkedin.com/oauth/v2/authorization?${q({ response_type: "code", client_id: id, redirect_uri: donus, state, scope: ["openid", "profile", "w_member_social", ...(process.env.LINKEDIN_KURUM_IZNI === "1" ? ["w_organization_social", "r_organization_admin"] : [])].join(" ") })}`;
    case "x": return `https://x.com/i/oauth2/authorize?${q({ response_type: "code", client_id: id, redirect_uri: donus, state, scope: "tweet.read tweet.write users.read offline.access media.write", code_challenge: meydan, code_challenge_method: "S256" })}`;
    case "tiktok": return `https://www.tiktok.com/v2/auth/authorize/?${q({ client_key: id, response_type: "code", redirect_uri: donus, state, scope: "user.info.basic,video.publish" })}`;
    case "google": return `https://accounts.google.com/o/oauth2/v2/auth?${q({ client_id: id, redirect_uri: donus, response_type: "code", state, scope: "https://www.googleapis.com/auth/business.manage", access_type: "offline", prompt: "consent", include_granted_scopes: "true" })}`;
  }
}

async function jsonAl(r: Response, ad: string): Promise<Record<string, unknown>> {
  const t = await r.text();
  let j: Record<string, unknown> = {};
  try { j = JSON.parse(t); } catch { /* boş */ }
  if (!r.ok) {
    const e = j.error as Record<string, unknown> | string | undefined;
    const m = typeof e === "string" ? `${e}${j.error_description ? `: ${j.error_description}` : ""}` : (e?.message as string) ?? (j.message as string) ?? (j.detail as string) ?? (j.title as string) ?? t.slice(0, 200);
    throw new Error(`${ad} ${r.status}: ${String(m).slice(0, 240)}`);
  }
  return j;
}
const formGonder = (u: string, o: Record<string, string>, h: Record<string, string> = {}) => fetch(u, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", ...h }, body: new URLSearchParams(o), signal: AbortSignal.timeout(20_000) });
const al = (u: string, t: string, h: Record<string, string> = {}) => fetch(u, { headers: { Authorization: `Bearer ${t}`, ...h }, signal: AbortSignal.timeout(20_000) });

/** Geri dönüş: kodu belirtece çevirir, hesabı ve hedefleri okur, kasaya ve projeye yazar. */
export async function yetkiTamamla(ag: OauthAg, state: string, kod: string): Promise<{ p: string; ad: string }> {
  const [nonce, s] = state.split(".");
  if (!nonce || !s || imza("o" + nonce) !== s) throw new Error("Yetkilendirme isteği doğrulanamadı; bağlantıyı yeniden başlat.");
  const b = bekleyenler()[nonce];
  if (!b || b.ag !== ag) throw new Error("Yetkilendirme isteğinin süresi doldu; bağlantıyı yeniden başlat.");
  delete bekleyenler()[nonce]; bekleyenYaz();
  const { id, gizli } = istemci(ag);
  const donus = donusAdresi(b.koken, ag);
  let t: Tokenlar;
  let hesap: SosyalHesap;
  if (ag === "meta") {
    const k = await jsonAl(await fetch(`https://graph.facebook.com/${META_SURUM}/oauth/access_token?${new URLSearchParams({ client_id: id, client_secret: gizli, redirect_uri: donus, code: kod })}`), "Meta");
    const u = await jsonAl(await fetch(`https://graph.facebook.com/${META_SURUM}/oauth/access_token?${new URLSearchParams({ grant_type: "fb_exchange_token", client_id: id, client_secret: gizli, fb_exchange_token: String(k.access_token) })}`), "Meta");
    const erisim = String(u.access_token ?? k.access_token);
    const ben = await jsonAl(await al(`https://graph.facebook.com/${META_SURUM}/me?fields=id,name,picture`, erisim), "Meta");
    const sayfalar = await jsonAl(await al(`https://graph.facebook.com/${META_SURUM}/me/accounts?fields=id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}&limit=50`, erisim), "Meta");
    const hedefler: SosyalHedef[] = [], hedefT: Record<string, string> = {};
    for (const x of (sayfalar.data as Record<string, unknown>[]) ?? []) {
      hedefler.push({ id: String(x.id), ad: String(x.name), tur: "facebook", resim: ((x.picture as { data?: { url?: string } })?.data?.url) });
      hedefT[String(x.id)] = String(x.access_token);
      const ig = x.instagram_business_account as Record<string, unknown> | undefined;
      if (ig?.id) { hedefler.push({ id: String(ig.id), ad: `@${ig.username}`, tur: "instagram", resim: ig.profile_picture_url as string | undefined }); hedefT[String(ig.id)] = String(x.access_token); }
    }
    t = { erisim, bitis: u.expires_in ? Date.now() + Number(u.expires_in) * 1000 : undefined, hedef: hedefT, koken: b.koken };
    hesap = { ag, kimlik: String(ben.id), ad: String(ben.name), resim: (ben.picture as { data?: { url?: string } })?.data?.url, hedefler, bagli: Date.now(), sureBitis: t.bitis };
  } else if (ag === "linkedin") {
    const k = await jsonAl(await formGonder("https://www.linkedin.com/oauth/v2/accessToken", { grant_type: "authorization_code", code: kod, redirect_uri: donus, client_id: id, client_secret: gizli }), "LinkedIn");
    const erisim = String(k.access_token);
    const ben = await jsonAl(await al("https://api.linkedin.com/v2/userinfo", erisim), "LinkedIn");
    const hedefler: SosyalHedef[] = [{ id: `urn:li:person:${ben.sub}`, ad: String(ben.name ?? "LinkedIn profili"), tur: "kisi", resim: ben.picture as string | undefined }];
    if (String(k.scope ?? "").includes("w_organization_social")) {
      try {
        const acl = await jsonAl(await al("https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED", erisim, { "LinkedIn-Version": linkedinSurum(), "X-Restli-Protocol-Version": "2.0.0" }), "LinkedIn");
        for (const e of ((acl.elements as Record<string, unknown>[]) ?? []).slice(0, 10)) {
          const urn = String(e.organization); const no = urn.split(":").pop();
          let ad = "Şirket sayfası";
          try { const o = await jsonAl(await al(`https://api.linkedin.com/rest/organizations/${no}`, erisim, { "LinkedIn-Version": linkedinSurum() }), "LinkedIn"); ad = String(o.localizedName ?? ad); } catch { /* ad okunamadı */ }
          hedefler.push({ id: urn, ad, tur: "kurum" });
        }
      } catch { /* şirket sayfası izni yok */ }
    }
    t = { erisim, yenileme: k.refresh_token as string | undefined, bitis: Date.now() + Number(k.expires_in ?? 5_184_000) * 1000, koken: b.koken };
    hesap = { ag, kimlik: String(ben.sub), ad: String(ben.name ?? "LinkedIn"), resim: ben.picture as string | undefined, hedefler, bagli: Date.now(), sureBitis: t.bitis, kapsam: String(k.scope ?? "").split(/[ ,]/).filter(Boolean) };
  } else if (ag === "x") {
    const k = await jsonAl(await formGonder("https://api.x.com/2/oauth2/token", { grant_type: "authorization_code", code: kod, redirect_uri: donus, code_verifier: b.v ?? "", client_id: id }, { Authorization: `Basic ${Buffer.from(`${id}:${gizli}`).toString("base64")}` }), "X");
    const erisim = String(k.access_token);
    const ben = (await jsonAl(await al("https://api.x.com/2/users/me?user.fields=profile_image_url,username", erisim), "X")).data as Record<string, unknown>;
    t = { erisim, yenileme: k.refresh_token as string | undefined, bitis: Date.now() + Number(k.expires_in ?? 7200) * 1000, koken: b.koken };
    hesap = { ag, kimlik: String(ben.id), ad: String(ben.name), kullanici: String(ben.username), resim: ben.profile_image_url as string | undefined, hedefler: [{ id: String(ben.id), ad: `@${ben.username}`, tur: "x" }], bagli: Date.now(), sureBitis: t.bitis };
  } else if (ag === "tiktok") {
    const k = await jsonAl(await formGonder("https://open.tiktokapis.com/v2/oauth/token/", { client_key: id, client_secret: gizli, code: kod, grant_type: "authorization_code", redirect_uri: donus }), "TikTok");
    const erisim = String(k.access_token);
    const ben = ((await jsonAl(await al("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url", erisim), "TikTok")).data as { user?: Record<string, unknown> })?.user ?? {};
    t = { erisim, yenileme: k.refresh_token as string | undefined, bitis: Date.now() + Number(k.expires_in ?? 86400) * 1000, koken: b.koken };
    hesap = { ag, kimlik: String(k.open_id ?? ben.open_id), ad: String(ben.display_name ?? "TikTok hesabı"), resim: ben.avatar_url as string | undefined, hedefler: [{ id: String(k.open_id ?? ben.open_id), ad: String(ben.display_name ?? "TikTok"), tur: "tiktok" }], bagli: Date.now(), sureBitis: t.bitis, kapsam: String(k.scope ?? "").split(",") };
  } else {
    const k = await jsonAl(await formGonder("https://oauth2.googleapis.com/token", { code: kod, client_id: id, client_secret: gizli, redirect_uri: donus, grant_type: "authorization_code" }), "Google");
    t = { erisim: String(k.access_token), yenileme: k.refresh_token as string | undefined, bitis: Date.now() + Number(k.expires_in ?? 3600) * 1000, koken: b.koken };
    await belirtecYaz(b.p, "google", t);
    return { p: b.p, ad: "Google İşletme Profili" };
  }
  await belirtecYaz(b.p, ag, t);
  await ekGuncelle(b.p, (v) => {
    const eski = v.sosyal.find((h) => h.ag === ag);
    hesap.secili = eski?.secili?.filter((x) => hesap.hedefler.some((h) => h.id === x)) ?? hesap.hedefler.filter((h) => h.tur !== "facebook").map((h) => h.id);
    v.sosyal = [...v.sosyal.filter((h) => h.ag !== ag), hesap];
  });
  return { p: b.p, ad: hesap.ad };
}

/** Süresi dolan belirteci yeniler (X, TikTok, LinkedIn ve Google yenileme belirteci verir). */
export async function tazeBelirtec(p: string, ag: OauthAg): Promise<Tokenlar> {
  const t = await belirtecAl(p, ag);
  if (!t) throw new Error(`${SAGLAYICILAR[ag].ad} bağlı değil.`);
  if (!t.bitis || t.bitis - Date.now() > 5 * 60_000) return t;
  if (!t.yenileme) { if (ag === "meta") throw new Error("Meta bağlantısının süresi doldu; yeniden bağla."); return t; }
  const { id, gizli } = istemci(ag);
  let k: Record<string, unknown>;
  if (ag === "x") k = await jsonAl(await formGonder("https://api.x.com/2/oauth2/token", { grant_type: "refresh_token", refresh_token: t.yenileme, client_id: id }, { Authorization: `Basic ${Buffer.from(`${id}:${gizli}`).toString("base64")}` }), "X");
  else if (ag === "tiktok") k = await jsonAl(await formGonder("https://open.tiktokapis.com/v2/oauth/token/", { client_key: id, client_secret: gizli, grant_type: "refresh_token", refresh_token: t.yenileme }), "TikTok");
  else if (ag === "linkedin") k = await jsonAl(await formGonder("https://www.linkedin.com/oauth/v2/accessToken", { grant_type: "refresh_token", refresh_token: t.yenileme, client_id: id, client_secret: gizli }), "LinkedIn");
  else k = await jsonAl(await formGonder("https://oauth2.googleapis.com/token", { grant_type: "refresh_token", refresh_token: t.yenileme, client_id: id, client_secret: gizli }), "Google");
  const y: Tokenlar = { ...t, erisim: String(k.access_token), yenileme: (k.refresh_token as string | undefined) ?? t.yenileme, bitis: Date.now() + Number(k.expires_in ?? 3600) * 1000 };
  await belirtecYaz(p, ag, y);
  return y;
}

/* ── Paylaşım ── */
const mutlak = (koken: string, u?: string) => (!u ? "" : /^https?:\/\//.test(u) ? u : `${koken}${u}`);
async function gorselBayt(adres: string): Promise<{ veri: Buffer; tur: string } | null> {
  if (!adres) return null;
  const r = await fetch(adres, { signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`Görsel okunamadı (${r.status}).`);
  return { veri: Buffer.from(await r.arrayBuffer()), tur: r.headers.get("content-type") ?? "image/png" };
}
const herkeseAcik = (u: string) => /^https:\/\//.test(u) && !/localhost|127\.0\.0\.1|\.local\b/.test(u);

/** Tek bir hedefe paylaşır; gönderinin adresini döndürür. */
export async function hedefePaylas(p: string, ag: SosyalAg, hedef: SosyalHedef, g: Gonderi, metin: string): Promise<{ adres?: string; not?: string }> {
  const t = await tazeBelirtec(p, ag);
  const gorsel = mutlak(t.koken ?? "", g.gorsel);
  if (ag === "meta") {
    const tok = t.hedef?.[hedef.id];
    if (!tok) throw new Error("Bu sayfanın erişim izni yok; Meta'yı yeniden bağla.");
    if (hedef.tur === "instagram") {
      if (!gorsel) throw new Error("Instagram görselsiz gönderiyi kabul etmez; önce görsel üret.");
      if (!herkeseAcik(gorsel)) throw new Error("Instagram görseli herkese açık bir https adresinden çeker; bu sunucunun adresi dışarıdan erişilemiyor.");
      const c = await jsonAl(await formGonder(`https://graph.facebook.com/${META_SURUM}/${hedef.id}/media`, { image_url: gorsel, ...(g.kanal === "hikaye" ? { media_type: "STORIES" } : { caption: metin }), access_token: tok }), "Instagram");
      const y = await jsonAl(await formGonder(`https://graph.facebook.com/${META_SURUM}/${hedef.id}/media_publish`, { creation_id: String(c.id), access_token: tok }), "Instagram");
      let adres: string | undefined;
      try { adres = String((await jsonAl(await fetch(`https://graph.facebook.com/${META_SURUM}/${y.id}?fields=permalink&access_token=${encodeURIComponent(tok)}`), "Instagram")).permalink ?? "") || undefined; } catch { /* adres yok */ }
      return { adres };
    }
    if (gorsel && herkeseAcik(gorsel)) { const y = await jsonAl(await formGonder(`https://graph.facebook.com/${META_SURUM}/${hedef.id}/photos`, { url: gorsel, caption: metin, access_token: tok }), "Facebook"); return { adres: `https://www.facebook.com/${y.post_id ?? y.id}` }; }
    const y = await jsonAl(await formGonder(`https://graph.facebook.com/${META_SURUM}/${hedef.id}/feed`, { message: metin, access_token: tok }), "Facebook");
    return { adres: `https://www.facebook.com/${y.id}`, not: gorsel ? "Görsel herkese açık adreste olmadığı için yalnız metin paylaşıldı." : undefined };
  }
  if (ag === "linkedin") {
    const h = { Authorization: `Bearer ${t.erisim}`, "LinkedIn-Version": linkedinSurum(), "X-Restli-Protocol-Version": "2.0.0", "Content-Type": "application/json" };
    let medya: string | undefined;
    const b = gorsel ? await gorselBayt(gorsel) : null;
    if (b) {
      const ilk = await jsonAl(await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", { method: "POST", headers: h, body: JSON.stringify({ initializeUploadRequest: { owner: hedef.id } }), signal: AbortSignal.timeout(20_000) }), "LinkedIn");
      const v = ilk.value as { uploadUrl: string; image: string };
      const y = await fetch(v.uploadUrl, { method: "PUT", headers: { Authorization: `Bearer ${t.erisim}`, "Content-Type": b.tur }, body: new Uint8Array(b.veri), signal: AbortSignal.timeout(60_000) });
      if (!y.ok) throw new Error(`LinkedIn görsel yüklemesi ${y.status}.`);
      medya = v.image;
    }
    const r = await fetch("https://api.linkedin.com/rest/posts", { method: "POST", headers: h, body: JSON.stringify({ author: hedef.id, commentary: metin.replace(/([\\(){}[\]<>@|~_*#])/g, "\\$1"), visibility: "PUBLIC", distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] }, ...(medya ? { content: { media: { id: medya } } } : {}), lifecycleState: "PUBLISHED", isReshareDisabledByAuthor: false }), signal: AbortSignal.timeout(30_000) });
    if (!r.ok) await jsonAl(r, "LinkedIn");
    const urn = r.headers.get("x-restli-id") ?? "";
    return { adres: urn ? `https://www.linkedin.com/feed/update/${urn}/` : undefined };
  }
  if (ag === "x") {
    let medya: string | undefined;
    const b = gorsel ? await gorselBayt(gorsel) : null;
    if (b) {
      const f = new FormData();
      f.append("media", new Blob([new Uint8Array(b.veri)], { type: b.tur }), "gorsel");
      f.append("media_category", "tweet_image");
      const m = await jsonAl(await fetch("https://api.x.com/2/media/upload", { method: "POST", headers: { Authorization: `Bearer ${t.erisim}` }, body: f, signal: AbortSignal.timeout(60_000) }), "X medya");
      medya = String((m.data as Record<string, unknown>)?.id ?? m.media_id_string ?? "") || undefined;
    }
    const y = await jsonAl(await fetch("https://api.x.com/2/tweets", { method: "POST", headers: { Authorization: `Bearer ${t.erisim}`, "Content-Type": "application/json" }, body: JSON.stringify({ text: metin.slice(0, 280), ...(medya ? { media: { media_ids: [medya] } } : {}) }), signal: AbortSignal.timeout(30_000) }), "X");
    const ek = await ekOku(p);
    const k = ek.sosyal.find((x) => x.ag === "x")?.kullanici ?? "i";
    return { adres: `https://x.com/${k}/status/${(y.data as Record<string, unknown>).id}` };
  }
  // TikTok: yalnız görselli (fotoğraf) gönderi; denetlenmemiş uygulamada yalnız "yalnız ben" görünürlüğü.
  if (!gorsel) throw new Error("TikTok görselsiz gönderiyi kabul etmez; önce görsel üret.");
  if (!herkeseAcik(gorsel)) throw new Error("TikTok görseli doğrulanmış, herkese açık bir alan adından çeker; bu sunucunun adresi dışarıdan erişilemiyor.");
  const h = { Authorization: `Bearer ${t.erisim}`, "Content-Type": "application/json; charset=UTF-8" };
  const bilgi = (await jsonAl(await fetch("https://open.tiktokapis.com/v2/post/publish/creator_info/query/", { method: "POST", headers: h, body: "{}", signal: AbortSignal.timeout(20_000) }), "TikTok")).data as { privacy_level_options?: string[] };
  const gizlilik = bilgi.privacy_level_options?.includes("PUBLIC_TO_EVERYONE") ? "PUBLIC_TO_EVERYONE" : bilgi.privacy_level_options?.[0] ?? "SELF_ONLY";
  const y = await jsonAl(await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", { method: "POST", headers: h, body: JSON.stringify({ post_info: { title: (g.konu || metin).slice(0, 90), description: metin.slice(0, 4000), privacy_level: gizlilik, disable_comment: false, auto_add_music: true }, source_info: { source: "PULL_FROM_URL", photo_cover_index: 0, photo_images: [gorsel] }, post_mode: "DIRECT_POST", media_type: "PHOTO" }), signal: AbortSignal.timeout(30_000) }), "TikTok");
  return { not: `TikTok gönderiyi işliyor (kimlik ${(y.data as Record<string, unknown>)?.publish_id ?? ""})${gizlilik === "SELF_ONLY" ? "; uygulama denetlenmediği için yalnız sen görebilirsin" : ""}.` };
}

/** Gönderinin kanalına göre paylaşılacak hedefler (seçili olanlar). Instagram gönderisi seçiliyse Facebook sayfasına da gider. */
export function hedefleriBul(hesaplar: SosyalHesap[], kanal: string): { ag: SosyalAg; hedef: SosyalHedef }[] {
  const turler: HedefTur[] = KANAL_HEDEF[kanal] ?? [];
  const l: { ag: SosyalAg; hedef: SosyalHedef }[] = [];
  for (const h of hesaplar) for (const x of h.hedefler) if ((h.secili ?? []).includes(x.id) && (turler.includes(x.tur) || (kanal === "instagram" && x.tur === "facebook"))) l.push({ ag: h.ag, hedef: x });
  return l;
}
/** Gönderinin tarih ve saati işletmenin saat diliminde. */
const trAn = (tarih: string, saat: string, tz = "UTC") => dilimZaman(tarih, saat, tz);

/** Bir gönderiyi şimdi paylaşır (zamanlayıcı ve "Şimdi paylaş" düğmesi). */
export async function gonderiPaylas(p: string, gonderiId: string): Promise<{ ok: boolean; hata?: string; adres?: string; hedef: number }> {
  const [ek, bv] = await Promise.all([ekOku(p), buyumeOku(p)]);
  const g = bv.gonderiler.find((x) => x.id === gonderiId);
  if (!g) return { ok: false, hata: "Gönderi bulunamadı.", hedef: 0 };
  const hedefler = hedefleriBul(ek.sosyal, g.kanal);
  if (!hedefler.length) return { ok: false, hata: "Bu kanal için bağlı ve seçili hesap yok.", hedef: 0 };
  const metin = gonderiMetni({ ...g, baslik: undefined });
  let ilk: string | undefined, hata = "", not = "";
  for (const { ag, hedef } of hedefler) {
    const anahtar = `${g.id}:${hedef.id}`;
    const once = ek.yayinlar[anahtar];
    if (once?.durum === "yayinda") { ilk ??= once.adres; continue; }
    await ekGuncelle(p, (v) => { v.yayinlar[anahtar] = { gonderi: g.id, ag, hedef: hedef.id, durum: "suruyor", z: Date.now(), deneme: (once?.deneme ?? 0) + 1 }; });
    try {
      const r = await hedefePaylas(p, ag, hedef, g, metin);
      ilk ??= r.adres; if (r.not) not = r.not;
      await ekGuncelle(p, (v) => { v.yayinlar[anahtar] = { ...v.yayinlar[anahtar], durum: "yayinda", adres: r.adres, hata: r.not, z: Date.now() }; const h = v.sosyal.find((x) => x.ag === ag); if (h) h.sonHata = undefined; });
    } catch (e) {
      hata = (e as Error).message.slice(0, 300);
      await ekGuncelle(p, (v) => { v.yayinlar[anahtar] = { ...v.yayinlar[anahtar], durum: "hata", hata, z: Date.now() }; const h = v.sosyal.find((x) => x.ag === ag); if (h) h.sonHata = hata; });
    }
  }
  const ek2 = await ekOku(p);
  const hepsi = hedefler.every(({ hedef }) => ek2.yayinlar[`${g.id}:${hedef.id}`]?.durum === "yayinda");
  if (hepsi) await buyumeGuncelle(p, (v) => { const x = v.gonderiler.find((y) => y.id === g.id); if (x) { x.durum = "paylasildi"; if (ilk) x.paylasimAdresi = ilk; x.guncelleme = Date.now(); } });
  return { ok: hepsi, hata: hepsi ? (not || undefined) : hata, adres: ilk, hedef: hedefler.length };
}

/** Dakikalık tur: otomatik paylaşımı açık projelerde saati gelen Hazır gönderileri paylaşır (son 24 saat). */
export async function sosyalTuru() {
  const l = await readdir(KASA).catch(() => [] as string[]);
  for (const f of l) {
    const p = f.replace(/\.json$/, "");
    if (!KIMLIK.test(p)) continue;
    try {
      if (!(await projeOkuHam(p))) { await rm(kasaDosya(p), { force: true }); continue; }
      const ek = await ekOku(p);
      if (!ek.sosyalOtomatik || !ek.sosyal.length) continue;
      const bv = await buyumeOku(p);
      const simdi = Date.now();
      const tz = (await import("./isletme").then((m) => m.isletmeOku(p)).catch(() => null))?.profil.saatDilimi || "UTC";
      for (const g of bv.gonderiler) {
        if (g.durum !== "hazir" || !g.tarih || !g.saat) continue;
        const z = trAn(g.tarih, g.saat, tz);
        if (z > simdi || simdi - z > 24 * 3600_000) continue;
        const hedefler = hedefleriBul(ek.sosyal, g.kanal);
        if (!hedefler.length) continue;
        const kayitlar = hedefler.map(({ hedef }) => ek.yayinlar[`${g.id}:${hedef.id}`]);
        if (kayitlar.some((k) => k?.durum === "suruyor" && simdi - k.z < 10 * 60_000)) continue;
        if (kayitlar.some((k) => k?.durum === "hata" && (k.deneme >= 3 || simdi - k.z < k.deneme * 10 * 60_000))) continue;
        await gonderiPaylas(p, g.id);
      }
    } catch { /* sonraki turda */ }
  }
}
/** Kasada belirteci olan projeler (Google İşletme turu için). */
export async function kasaProjeleri(): Promise<string[]> { return (await readdir(KASA).catch(() => [] as string[])).map((f) => f.replace(/\.json$/, "")).filter((p) => KIMLIK.test(p)); }
