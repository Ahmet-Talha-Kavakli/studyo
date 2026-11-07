import "server-only";
import { randomBytes } from "crypto";
import path from "path";
import { coz, sifrele } from "@/lib/build/sifre";
import { D, hesapGuncelle, hesapOkuSync, jsonOkuSync, jsonYaz, ozet, sil, type HesapKaydi } from "./depo";
import { oturumOkuSync } from "./oturum";

/**
 * Vayra Build kimliğinin hesaba bağlanması.
 *  - Oturum varsa Build sahip anahtarı hesaptan gelir (kasa ile şifreli saklanır; tarayıcıya gönderilmez).
 *  - Hesabın anahtarı yoksa istekteki geçerli x-build-sahip başlığı bir kez benimsenir: o cihazdaki eski projeler
 *    hesaba geçer, sonra her cihazda aynı kimlik kullanılır. Başka hesaba bağlı bir anahtar benimsenmez.
 *  - Hesaptan farklı cihaz anahtarları "eskiler" listesine yazılır (ileride projeleri taşımak için).
 * sahipAl eşzamanlı olduğu için okumalar eşzamanlı ve önbellekli; yazım arka planda hesap kilidiyle yapılır.
 */
const DESEN = /^[A-Za-z0-9_-]{24,80}$/;
const indeks = (anahtar: string) => path.join(D.build, `${ozet(`build:${anahtar}`)}.json`);

const G = globalThis as unknown as { __vayraBuildAnahtar?: Map<string, string>; __vayraBuildDogrulanmis?: Map<string, number>; __vayraBuildEski?: Set<string> };
const ANAHTAR = (G.__vayraBuildAnahtar ??= new Map());
const DOGRULANMIS = (G.__vayraBuildDogrulanmis ??= new Map());
const ESKI = (G.__vayraBuildEski ??= new Set());
const DOGRULAMA_SURESI = 15 * 60_000;

const yeniAnahtar = () => randomBytes(32).toString("base64url");
function baskaHesabin(anahtar: string, uid: string) {
  const v = jsonOkuSync<{ uid: string }>(indeks(anahtar));
  return !!v?.uid && v.uid !== uid;
}

async function benimse(uid: string, aday: string) {
  const r = await hesapGuncelle(uid, async (h) => {
    const mevcut = h.build ? coz(h.build.anahtar) : null;
    if (mevcut) return mevcut;
    h.build = { anahtar: sifrele(aday), baglanma: Date.now() };
    await jsonYaz(indeks(aday), { uid });
    return aday;
  });
  if (r) ANAHTAR.set(uid, r.sonuc);
}

async function eskiyiKaydet(uid: string, anahtar: string) {
  await hesapGuncelle(uid, (h) => {
    if (!h.build) return;
    const l = h.build.eskiler ?? [];
    if (l.some((x) => coz(x) === anahtar)) return;
    h.build.eskiler = [...l, sifrele(anahtar)].slice(-10);
  });
}

/**
 * Geçerli oturum varsa hesabın Build anahtarı; oturum yoksa undefined.
 * Hata fırlatmaz (Build rotalarının başında çağrılır).
 */
export function hesapBuildAnahtari(req: Request, baslik: string | null): string | undefined {
  try {
    const o = oturumOkuSync(req);
    if (!o) return undefined;
    let a = ANAHTAR.get(o.uid);
    if (!a) {
      const h = hesapOkuSync(o.uid);
      if (!h) return undefined;
      a = (h.build && coz(h.build.anahtar)) || undefined;
      if (!a) {
        a = baslik && DESEN.test(baslik) && !baskaHesabin(baslik, o.uid) ? baslik : yeniAnahtar();
        void benimse(o.uid, a).catch((e) => console.error("[hesap] Build anahtarı kaydedilemedi:", (e as Error).message));
      }
      ANAHTAR.set(o.uid, a);
    }
    if (baslik && baslik !== a && DESEN.test(baslik)) {
      const k = `${o.uid}:${ozet(baslik)}`;
      if (!ESKI.has(k) && !baskaHesabin(baslik, o.uid)) { ESKI.add(k); void eskiyiKaydet(o.uid, baslik).catch(() => {}); }
    }
    DOGRULANMIS.set(a, Date.now() + DOGRULAMA_SURESI);
    { const anahtar = a, uid = o.uid; void import("./buildKredi").then((m) => m.buildOzKaydet(anahtar, uid)).catch(() => {}); }
    if (DOGRULANMIS.size > 5000) for (const [k, t] of DOGRULANMIS) if (t < Date.now()) DOGRULANMIS.delete(k);
    return a;
  } catch (e) {
    console.error("[hesap] Build kimliği çözülemedi:", (e as Error).message);
    return undefined;
  }
}

/**
 * Üretimde oturumsuz başlık yalnız sunucunun kendi iç çağrılarında geçer: son 15 dakikada bir oturumla doğrulanmış
 * hesap anahtarı (anahtar tarayıcıya hiç gönderilmez; çıkışta cihazdaki kopya silinir).
 */
export const dogrulanmisAnahtar = (a: string) => (DOGRULANMIS.get(a) ?? 0) > Date.now();

/** Build sahip anahtarının bağlı olduğu hesap (yoksa null: eski, hesapsız geliştirme kimliği). */
export function buildAnahtarHesabi(anahtar: string): string | null {
  if (!DESEN.test(anahtar)) return null;
  return jsonOkuSync<{ uid: string }>(indeks(anahtar))?.uid ?? null;
}

/** Hesap silinirken: Build projeleri (yalnız hesabın kendi anahtarı) ve dizin kaydı. */
export async function buildVerisiniSil(h: HesapKaydi) {
  const a = h.build ? coz(h.build.anahtar) : null;
  ANAHTAR.delete(h.uid);
  if (!a) return;
  DOGRULANMIS.delete(a);
  const v = jsonOkuSync<{ uid: string }>(indeks(a));
  if (v?.uid && v.uid !== h.uid) return;
  const { sahipProjeleri, projeSil, copListesi, copKaliciSil } = await import("@/lib/build/depo");
  for (const p of await sahipProjeleri(a)) if (!p.ekipRol) await projeSil(p.id, a).catch(() => {});
  for (const c of await copListesi(a)) await copKaliciSil(c.id, a).catch(() => {});
  await sil(indeks(a));
}
