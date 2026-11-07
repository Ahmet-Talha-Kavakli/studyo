import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { anahtarOzeti, yayindakiAjan } from "./ajanDepo";
import { alanIzinli, type Yayindaki } from "./ajanZiyaret";
import { denemeOrtamAjani } from "./ajanOrtam";
import { coz } from "./sifre";
import { KIMLIK, type Kaynak } from "./ziyaretciDepo";

/** Yayındaki ajanın herkese açık uçlarında (mesaj, dosya) ortak erişim denetimi. */
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization, x-vayra-ziyaretci, x-vayra-site, x-vayra-ortam, x-vayra-kimlik, x-vayra-kimlik-imza" };
const hata = (mesaj: string, durum = 400) => Response.json({ ok: false, hata: mesaj }, { status: durum, headers: CORS });
export const EPOSTA = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
/** Sitenin imzaladığı ziyaretçi kimliği: x-vayra-kimlik (base64url JSON { eposta, ad }) ve x-vayra-kimlik-imza (HMAC-SHA256(anahtar, eposta), onaltılık). */
export function kimlikDogrula(req: Request, y: Yayindaki): { eposta: string; ad?: string } | null | "gecersiz" {
  const ham = req.headers.get("x-vayra-kimlik"), imza = req.headers.get("x-vayra-kimlik-imza");
  if (!ham && !imza) return null;
  const anahtar = coz(y.ajan.yayin.kimlik?.anahtarSifreli);
  if (!anahtar || !ham || !imza || !/^[a-f0-9]{64}$/i.test(imza)) return "gecersiz";
  let v: { eposta?: string; ad?: string } = {};
  try { v = JSON.parse(Buffer.from(ham, "base64url").toString("utf8")); } catch { return "gecersiz"; }
  const eposta = String(v.eposta ?? "").trim().toLowerCase();
  if (!EPOSTA.test(eposta)) return "gecersiz";
  const b = createHmac("sha256", anahtar).update(eposta).digest("hex");
  if (!timingSafeEqual(Buffer.from(b), Buffer.from(imza.toLowerCase()))) return "gecersiz";
  return { eposta, ...(v.ad ? { ad: String(v.ad).slice(0, 80) } : {}) };
}

/** Erişim: API anahtarı (Bearer) ya da tarayıcı ziyaretçi belirteci; ?ortam=deneme ya da x-vayra-ortam: deneme deneme ortamı. */
export async function erisim(req: Request, id: string, oturum?: string): Promise<{ hata: Response } | { y: Yayindaki; kimlik: string; kaynak: Kaynak; site?: string; ortam?: "deneme"; dogrulanmis?: { eposta: string; ad?: string } }> {
  const deneme = (req.headers.get("x-vayra-ortam") ?? new URL(req.url).searchParams.get("ortam")) === "deneme";
  const y = deneme ? await denemeOrtamAjani(id) : await yayindakiAjan(id);
  if (!y) return { hata: hata(deneme ? "Bu ajanın deneme ortamı yok." : "Bu ajan yayında değil.", 404) };
  const on = deneme ? "dn:" : "";
  const ortam = deneme ? ("deneme" as const) : undefined;
  const k = y.ajan.yayin.kanallar;
  const bas = req.headers.get("authorization") ?? "";
  if (bas.startsWith("Bearer ")) {
    const ozet = deneme ? y.ajan.yayin.ortam?.anahtarOzeti : y.ajan.yayin.anahtarOzeti;
    if ((!deneme && !k.api) || !ozet) return { hata: hata(deneme ? "Deneme ortamının API anahtarı yok." : "Bu ajanın API'si kapalı.", 403) };
    if (anahtarOzeti(bas.slice(7).trim()) !== ozet) return { hata: hata("API anahtarı geçersiz.", 401) };
    const o = (oturum ?? "varsayilan").slice(0, 76);
    const kimlik = `${on}api:${o}`.padEnd(8, "_");
    if (!KIMLIK.test(kimlik)) return { hata: hata("Oturum adı geçersiz (harf, rakam, - _ . :).") };
    return { y, kimlik, kaynak: "api", ortam };
  }
  const z = req.headers.get("x-vayra-ziyaretci") ?? "";
  if (!KIMLIK.test(z)) return { hata: hata("Ziyaretçi kimliği eksik.", 401) };
  const site = (req.headers.get("x-vayra-site") ?? "").toLowerCase().replace(/^https?:\/\//, "").replace(/[:/].*$/, "").slice(0, 120);
  const kaynak: Kaynak = site ? "kutu" : "sayfa";
  if (kaynak === "sayfa" && !k.sayfa && !deneme) return { hata: hata("Bu ajanın paylaşım sayfası kapalı.", 403) };
  if (kaynak === "kutu") {
    if (!k.widget) return { hata: hata("Bu ajan web sitelerine eklenemiyor.", 403) };
    if (!alanIzinli(y.ajan.yayin.alanlar, site)) return { hata: hata("Bu ajan bu sitede kullanılamaz.", 403) };
  }
  const dg = kimlikDogrula(req, y);
  if (dg === "gecersiz") return { hata: hata("Ziyaretçi kimliği doğrulanamadı.", 401) };
  if (!dg && y.ajan.yayin.kimlik?.zorunlu && kaynak === "kutu") return { hata: hata("Bu sohbet yalnız giriş yapmış kullanıcılara açık.", 401) };
  return { y, kimlik: `${on}z:${z}`, kaynak, site: site || undefined, ortam, ...(dg ? { dogrulanmis: dg } : {}) };
}

