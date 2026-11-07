import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { Sohbet } from "./sohbetDepo";

/**
 * Kilitli sohbet (ChatGPT'nin kilitli sohbetleri gibi): sahip sohbete 4 ile 8 haneli bir PIN koyar. Kilitliyken
 * sohbetin içeriği, yanıt yazma, dışa aktarma ve paylaşım PIN ile açılan kısa ömürlü bir belirteç ister; listede
 * önizleme metni gizlenir, aramada içerik taranmaz. PIN scrypt özetiyle saklanır; beş yanlış denemede 15 dakika kilit.
 */
export type SohbetKilidi = { ozet: string; tuz: string; zaman: number; hatali?: number; bekle?: number };
const OMUR = 30 * 60_000;
const gizli = () => process.env.VAYRA_SIFRE_ANAHTARI || process.env.VAYRA_OTURUM_GIZLI || "vayra-yerel-kilit";
export const PIN = /^\d{4,8}$/;
export const pinOzetle = (pin: string, tuz: string) => scryptSync(pin, tuz, 32).toString("hex");
export function kilitKur(pin: string): SohbetKilidi { const tuz = randomBytes(12).toString("hex"); return { ozet: pinOzetle(pin, tuz), tuz, zaman: Date.now() }; }
export function pinDogru(k: SohbetKilidi, pin: string): boolean {
  if (!PIN.test(pin)) return false;
  const a = Buffer.from(pinOzetle(pin, k.tuz), "hex"), b = Buffer.from(k.ozet, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
/** Açma belirteci: sohbet kimliği + bitiş, HMAC ile imzalı (PIN değişince kilidin zamanı değişir, eski belirteç geçersiz). */
export function belirtecUret(s: Sohbet & { kilit?: SohbetKilidi }): string {
  const bitis = Date.now() + OMUR;
  const imza = createHmac("sha256", gizli()).update(`${s.id}.${bitis}.${s.kilit?.zaman ?? 0}`).digest("base64url");
  return `${bitis}.${imza}`;
}
export function belirtecGecerli(s: Sohbet & { kilit?: SohbetKilidi }, b: string | null): boolean {
  if (!s.kilit) return true;
  const m = /^(\d{13})\.([A-Za-z0-9_-]{43})$/.exec(b ?? "");
  if (!m || Number(m[1]) < Date.now()) return false;
  const bek = createHmac("sha256", gizli()).update(`${s.id}.${m[1]}.${s.kilit.zaman}`).digest("base64url");
  return timingSafeEqual(Buffer.from(bek), Buffer.from(m[2]));
}
/** İstek kilitli sohbete erişebilir mi (başlık: x-sohbet-kilit). */
export const kilitAcik = (req: Request, s: Sohbet & { kilit?: SohbetKilidi }) => belirtecGecerli(s, req.headers.get("x-sohbet-kilit")) || belirtecGecerli(s, cerezBelirteci(req, s.id));
/** Açılan sohbetin belirteci yalnız o sohbetin API yoluna gönderilen httpOnly çerezde tutulur (30 dakika). */
const cerezAdi = (id: string) => `vayra_kilit_${id.replace(/[^A-Za-z0-9]/g, "")}`;
function cerezBelirteci(req: Request, id: string): string | null {
  const ad = cerezAdi(id);
  for (const p of (req.headers.get("cookie") ?? "").split(";")) { const [k, ...v] = p.trim().split("="); if (k === ad) return decodeURIComponent(v.join("=")); }
  return null;
}
export const kilitCerezi = (id: string, belirtec: string | null) => `${cerezAdi(id)}=${belirtec ? encodeURIComponent(belirtec) : ""}; Path=/api/build/sohbet/${id}; HttpOnly; SameSite=Lax; Max-Age=${belirtec ? 1800 : 0}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
export const kilitliYanit = () => Response.json({ ok: false, hata: "Bu sohbet kilitli. Açmak için PIN gerekli.", kilitli: true }, { status: 423 });
