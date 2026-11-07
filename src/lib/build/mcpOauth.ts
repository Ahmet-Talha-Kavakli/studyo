import "server-only";
import { createHash, randomBytes } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { mcpAdresi, mcpFetch } from "./mcpIstemci";

/**
 * MCP sunucuları için OAuth 2.1 (MCP yetkilendirme belirtimi): korunan kaynak meta verisi → yetkilendirme
 * sunucusu meta verisi → dinamik istemci kaydı (DCR) → PKCE (S256) ile yetkilendirme → kod değişimi → yenileme.
 * Bekleyen akışlar state ile .veri/build/oauth-bekleyen/<state>.json dosyasında 15 dakika tutulur.
 */
export type OauthAyar = { yetkiUrl: string; tokenUrl: string; istemciId: string; istemciGizli?: string; kaynak: string; kapsam?: string };
export type Tokenlar = { erisim: string; yenileme?: string; bitis?: number };
/** uc: uç kullanıcı akışı (belirteçler sahibin bağlantısına değil, kullanıcının hesabına yazılır). */
export type UcAkis = { kullanici: string; sahipOz: string };
type Bekleyen = OauthAyar & { sahip: string; baglantiId: string; dogrulayici: string; donus: string; zaman: number; uc?: UcAkis };

const KOK = path.join(DEPO_KOK, "build", "oauth-bekleyen");
const getir = async (u: string) => { const a = mcpAdresi(u); if (!a) return null; const r = await mcpFetch(a, { signal: AbortSignal.timeout(10_000), headers: { Accept: "application/json" } }).catch(() => null); return r?.ok ? r.json().catch(() => null) : null; };

/** Sunucunun yetkilendirme bilgisini keşfeder. Dönüş: yetkilendirme sunucusu uç noktaları ya da null. */
export async function oauthKesfet(mcpUrl: string, metaAdresi?: string): Promise<{ yetki: string; token: string; kayit?: string; kapsamlar?: string[]; kaynak: string; cimd?: boolean } | null> {
  const u = new URL(mcpUrl);
  const kaynak = `${u.origin}${u.pathname.replace(/\/+$/, "")}`;
  const adaylar = [metaAdresi, `${u.origin}/.well-known/oauth-protected-resource${u.pathname.replace(/\/+$/, "")}`, `${u.origin}/.well-known/oauth-protected-resource`].filter(Boolean) as string[];
  let sunucu: string | undefined;
  let kapsamlar: string[] | undefined;
  for (const a of adaylar) {
    const m = await getir(a) as { authorization_servers?: string[]; scopes_supported?: string[] } | null;
    if (m?.authorization_servers?.length) { sunucu = m.authorization_servers[0]; kapsamlar = m.scopes_supported; break; }
  }
  sunucu ??= u.origin;
  const s = new URL(sunucu);
  const yol = s.pathname.replace(/\/+$/, "");
  const metaAdaylar = yol && yol !== ""
    ? [`${s.origin}/.well-known/oauth-authorization-server${yol}`, `${s.origin}/.well-known/openid-configuration${yol}`, `${s.origin}${yol}/.well-known/openid-configuration`]
    : [`${s.origin}/.well-known/oauth-authorization-server`, `${s.origin}/.well-known/openid-configuration`];
  for (const a of metaAdaylar) {
    const m = await getir(a) as { authorization_endpoint?: string; token_endpoint?: string; registration_endpoint?: string; scopes_supported?: string[]; client_id_metadata_document_supported?: boolean } | null;
    if (m?.authorization_endpoint && m.token_endpoint) return { yetki: m.authorization_endpoint, token: m.token_endpoint, kayit: m.registration_endpoint, kapsamlar: kapsamlar ?? m.scopes_supported, kaynak, cimd: m.client_id_metadata_document_supported === true };
  }
  return null;
}

/** Dinamik istemci kaydı (RFC 7591). */
export async function istemciKaydet(kayitUrl: string, donus: string): Promise<{ istemciId: string; istemciGizli?: string } | null> {
  const a = mcpAdresi(kayitUrl);
  if (!a) return null;
  const r = await mcpFetch(a, {
    method: "POST", signal: AbortSignal.timeout(10_000), headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_name: "Vayra Build", redirect_uris: [donus], grant_types: ["authorization_code", "refresh_token"], response_types: ["code"], token_endpoint_auth_method: "none", client_uri: "https://vayra.ai" }),
  }).catch(() => null);
  if (!r?.ok) return null;
  const j = await r.json().catch(() => null) as { client_id?: string; client_secret?: string } | null;
  return j?.client_id ? { istemciId: j.client_id, istemciGizli: j.client_secret } : null;
}

const b64 = (b: Buffer) => b.toString("base64url");

/** Yetkilendirme adresini üretir, bekleyen akışı kaydeder. */
export async function yetkiBaslat(g: OauthAyar & { sahip: string; baglantiId: string; donus: string; uc?: UcAkis }): Promise<string> {
  const dogrulayici = b64(randomBytes(32));
  const durum = b64(randomBytes(18));
  await mkdir(KOK, { recursive: true });
  const b: Bekleyen = { ...g, dogrulayici, zaman: Date.now() };
  await writeFile(path.join(KOK, `${durum}.json`), JSON.stringify(b));
  const u = new URL(g.yetkiUrl);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", g.istemciId);
  u.searchParams.set("redirect_uri", g.donus);
  u.searchParams.set("code_challenge", b64(createHash("sha256").update(dogrulayici).digest()));
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("state", durum);
  if (g.kaynak) u.searchParams.set("resource", g.kaynak);
  if (g.kapsam) u.searchParams.set("scope", g.kapsam);
  return u.toString();
}

async function tokenIstegi(tokenUrl: string, alanlar: Record<string, string>, istemciGizli?: string): Promise<Tokenlar> {
  const a = mcpAdresi(tokenUrl);
  if (!a) throw new Error("Token adresi geçersiz.");
  const r = await mcpFetch(a, {
    method: "POST", signal: AbortSignal.timeout(15_000),
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams(Object.entries({ ...alanlar, ...(istemciGizli ? { client_secret: istemciGizli } : {}) }).filter(([, v]) => v !== "")).toString(),
  });
  const j = await r.json().catch(() => null) as { access_token?: string; refresh_token?: string; expires_in?: number; error_description?: string; error?: string } | null;
  if (!r.ok || !j?.access_token) throw new Error(j?.error_description ?? j?.error ?? `Token alınamadı (${r.status}).`);
  return { erisim: j.access_token, yenileme: j.refresh_token, bitis: j.expires_in ? Date.now() + j.expires_in * 1000 : undefined };
}

/** Geri dönüşte kodu token ile değiştirir. Dönüş: bağlantı + sahip + tokenlar. */
export async function yetkiTamamla(durum: string, kod: string): Promise<{ sahip: string; baglantiId: string; tokenlar: Tokenlar; ayar: OauthAyar; uc?: UcAkis }> {
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(durum)) throw new Error("Geçersiz durum.");
  const f = path.join(KOK, `${durum}.json`);
  const b = JSON.parse(await readFile(f, "utf8").catch(() => "null")) as Bekleyen | null;
  await rm(f, { force: true });
  if (!b || Date.now() - b.zaman > 15 * 60_000) throw new Error("Bağlantı isteğinin süresi doldu; yeniden dene.");
  const tokenlar = await tokenIstegi(b.tokenUrl, { grant_type: "authorization_code", code: kod, redirect_uri: b.donus, client_id: b.istemciId, code_verifier: b.dogrulayici, resource: b.kaynak }, b.istemciGizli);
  const { sahip, baglantiId, dogrulayici: _d, donus: _o, zaman: _z, uc, ...ayar } = b; void _d; void _o; void _z;
  return { sahip, baglantiId, tokenlar, ayar, ...(uc ? { uc } : {}) };
}

export async function tokenYenile(ayar: OauthAyar, yenileme: string): Promise<Tokenlar> {
  return tokenIstegi(ayar.tokenUrl, { grant_type: "refresh_token", refresh_token: yenileme, client_id: ayar.istemciId, resource: ayar.kaynak }, ayar.istemciGizli);
}

/* ── İstemci kimliği meta veri belgesi (CIMD, draft-ietf-oauth-client-id-metadata-document) ── */
export const CIMD_YOLU = "/api/build/genel/mcp-istemci";
export const OAUTH_DONUS_YOLU = "/api/build/baglantilar/oauth/geri";
/** İsteğin dış kökeni (vekil başlıkları dahil). VAYRA_KOKEN tanımlıysa o kullanılır. */
export function istekKokeni(req: Request): string {
  if (process.env.VAYRA_KOKEN) return process.env.VAYRA_KOKEN.replace(/\/+$/, "");
  const h = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const p = req.headers.get("x-forwarded-proto") ?? (h?.startsWith("localhost") ? "http" : "https");
  return h ? `${p}://${h}` : new URL(req.url).origin;
}
/** Vayra'nın yayınlanmış istemci kimliği: belgenin kendi https adresi. Yerel (http) kökende CIMD kullanılamaz. */
export function cimdKimligi(koken: string): string | null {
  try { const u = new URL(koken); return u.protocol === "https:" && u.hostname !== "localhost" ? `${u.origin}${CIMD_YOLU}` : null; } catch { return null; }
}
/** CIMD belgesi: client_id belgenin adresine eşit olmalı; açık istemci (token_endpoint_auth_method none) + PKCE. */
export function cimdBelgesi(koken: string) {
  const o = new URL(koken).origin;
  return {
    client_id: `${o}${CIMD_YOLU}`, client_name: "Vayra Build", client_uri: o, logo_uri: `${o}/icon.png`,
    redirect_uris: [`${o}${OAUTH_DONUS_YOLU}`], grant_types: ["authorization_code", "refresh_token"], response_types: ["code"],
    token_endpoint_auth_method: "none", software_id: "vayra-build", software_version: "1.0.0",
  };
}

/** İstemci kimliği akışı (client_credentials): ör. ikas özel uygulaması. Dönüş: erişim belirteci + bitiş. */
export async function istemciKimligiTokeni(tokenUrl: string, istemciId: string, istemciGizli: string): Promise<Tokenlar> {
  return tokenIstegi(tokenUrl, { grant_type: "client_credentials", client_id: istemciId }, istemciGizli);
}
