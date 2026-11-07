import "server-only";
import { createHash, randomBytes } from "crypto";
import path from "path";
import { gelistirme, hata } from "./guvenlik";
import { HESAP_KOK, jsonOku, jsonYaz, kilitle, ozet, sil } from "./depo";
import { krediHarca, krediIade } from "./kredi";
import type { GecerliOturum } from "./oturum";
import type { PlanKimligi } from "./tipler";
import { oturumGerekli } from "./yetki";
import { etkinAlanCoz } from "@/lib/alan/etkin";
import { alanIade, alanKrediKes } from "@/lib/alan/kredi";
import { kesilecekTutar } from "@/lib/krediTarife";

/**
 * Kredi harcayan rotaların ortak kapısı (2. aşama: sunucu tarafı kesinti).
 *
 *   const k = await krediAl(req, { kaynak: "uretim", aciklama, taban, istemci: govde.kredi, ucretli });
 *   if (k instanceof Response) return k;          // 401 oturum yok, 402 kredi yetmiyor, 409 tekrar
 *   try { sonuc = await saglayici(); } catch (e) { await k.iade("Sağlayıcı hatası"); throw e; }
 *   return Response.json({ ok: true, ...sonuc, ...k.alanlar() }, { headers: k.basliklar() });
 *
 * - Tutar sunucuda hesaplanır (lib/krediTarife). İstemcinin bildirdiği tutar yalnız tabanın üstündeyse dikkate alınır.
 * - Kesinti sağlayıcı çağrısından önce, işlem anahtarıyla yapılır: istemci `x-islem-anahtari` gönderir, yoksa sunucu üretir.
 *   Defterdeki anahtar istemci anahtarından sunucu tuzuyla türetilir: istemci bu harcamayı /api/hesap/kredi/iade ile
 *   kendisi geri alamaz, aynı anahtarla gelen ikinci istek yeniden düşmez ve sağlayıcıyı yeniden çalıştırmaz (409).
 * - ucretli false ise (gerçek sağlayıcı bağlı değil, çıktı örnek olacak) kredi kesilmez: arayüz bu durumda
 *   "Örnek çıktı, kredi düşmez" der.
 * - Geliştirmede `x-vayra-sahte-saglayici: gercek | hata` başlığı sağlayıcısız ortamda kesinti ve iade akışını sınamak
 *   içindir; üretimde yok sayılır.
 */

export const ISLEM_BASLIGI = "x-islem-anahtari";
const ISTEMCI_ANAHTARI = /^[A-Za-z0-9_.:-]{8,80}$/;

export type SahteSaglayici = "gercek" | "hata" | null;

/** Yalnız geliştirmede: sağlayıcıyı taklit et (gercek: başarılı gerçek çıktı gibi, hata: sağlayıcı hatası). */
export function sahteSaglayici(req: Request): SahteSaglayici {
  if (!gelistirme()) return null;
  const v = req.headers.get("x-vayra-sahte-saglayici");
  return v === "gercek" || v === "hata" ? v : null;
}

/* Defter anahtarı türetme tuzu: VAYRA_KREDI_TUZU ya da ilk kullanımda üretilip depoda saklanan rastgele değer. */
let tuzSozu: Promise<string> | null = null;
function tuz(): Promise<string> {
  return (tuzSozu ??= (async () => {
    const env = process.env.VAYRA_KREDI_TUZU?.trim();
    if (env) return env;
    const dosya = path.join(HESAP_KOK, "kredi-tuz.json");
    const var_ = await jsonOku<{ tuz: string }>(dosya);
    if (var_?.tuz) return var_.tuz;
    const yeni = randomBytes(24).toString("base64url");
    await jsonYaz(dosya, { tuz: yeni });
    return yeni;
  })());
}
async function defterAnahtari(uid: string, kaynak: string, istemciAnahtari: string) {
  const h = createHash("sha256").update(`${await tuz()}|${uid}|${kaynak}|${istemciAnahtari}`).digest("base64url");
  return `srv_${h.slice(0, 40)}`;
}

export interface KrediIslemi {
  uid: string;
  plan: PlanKimligi;
  /** Kesilen kredi (ücretsiz işte 0). */
  tutar: number;
  /** Kesintiden sonraki bakiye (ücretsiz işte bilinmez). */
  bakiye?: number;
  sahte: SahteSaglayici;
  /** Kesintiyi bir kez geri verir. Kesinti yoksa bir şey yapmaz. Yeni bakiyeyi döndürür. */
  iade(aciklama: string): Promise<number | undefined>;
  /** JSON yanıtına eklenecek alan: { kredi: { harcanan, bakiye, iade } }. */
  alanlar(): { kredi: { harcanan: number; bakiye?: number; iade?: true } };
  /** Akışlı yanıtlar için başlıklar. */
  basliklar(): Record<string, string>;
  /** Defterdeki anahtar (zaman uyumsuz işlerde iadeyi sonra yapmak için saklanır). */
  readonly defterAnahtari: string | null;
  readonly kaynak: string;
  /** Harcama bir çalışma alanının havuzundan yapıldıysa alan kimliği (yoksa kişisel bakiye). */
  readonly alan?: string;
}

type KesSonucu = KrediIslemi | { hata: "yetersiz" | "tekrar" | "cakisma" | "gecersiz" | "sinir" | "izleyici" | "uye-degil"; gereken: number; bakiye?: number; sinir?: number | null; buAy?: number };

/**
 * Hesaptan kesinti (oturumdan bağımsız: API anahtarının sahibi gibi). tutar 0 ise ücretsiz işlem döner.
 */
export async function krediKes(g: {
  uid: string; plan: PlanKimligi; kaynak: string; aciklama: string; tutar: number; istemciAnahtari?: string | null; sahte?: SahteSaglayici;
  /** Etkin çalışma alanı: kesinti alanın ortak havuzundan, üyenin aylık sınırı denetlenerek yapılır. */
  alan?: { id: string; ad: string } | null;
}): Promise<KesSonucu> {
  const kaynak = g.kaynak.replace(/[^\w/:.-]/g, "").slice(0, 60) || "rota";
  if (g.istemciAnahtari && !ISTEMCI_ANAHTARI.test(g.istemciAnahtari)) return { hata: "gecersiz", gereken: g.tutar };
  let iadeEdildi = false;
  let bakiye: number | undefined;
  const alan = g.alan ?? null;
  const islem = (tutar: number, anahtar: string | null): KrediIslemi => ({
    uid: g.uid, plan: g.plan, tutar, sahte: g.sahte ?? null, kaynak, defterAnahtari: anahtar, ...(alan ? { alan: alan.id } : {}),
    get bakiye() { return bakiye; },
    async iade(aciklama) {
      if (!anahtar || !tutar || iadeEdildi) return bakiye;
      iadeEdildi = true;
      if (alan) {
        const r = await alanIade(alan.id, anahtar, { kaynak: `sunucu:${kaynak}`, aciklama: aciklama.slice(0, 160) });
        if (r.ozet && bakiye !== undefined) bakiye = Math.min(r.ozet.bakiye, bakiye + tutar);
        return bakiye;
      }
      const r = await krediIade(g.uid, anahtar, { kaynak: `sunucu:${kaynak}`, aciklama: aciklama.slice(0, 160) });
      if (r.ozet) bakiye = r.ozet.bakiye;
      return bakiye;
    },
    alanlar() { return { kredi: { harcanan: iadeEdildi ? 0 : tutar, ...(bakiye !== undefined ? { bakiye } : {}), ...(iadeEdildi ? { iade: true as const } : {}) } }; },
    basliklar() {
      return { "x-kredi-harcanan": String(iadeEdildi ? 0 : tutar), ...(bakiye !== undefined ? { "x-kredi-bakiye": String(bakiye) } : {}) };
    },
  });
  if (!(g.tutar > 0)) return islem(0, null);
  const anahtar = await defterAnahtari(g.uid, kaynak, g.istemciAnahtari || randomBytes(16).toString("base64url"));
  if (alan) {
    // Alan havuzu: bakiye yanıtı üyenin harcayabileceğidir (havuz ile aylık sınırın küçüğü).
    const r = await alanKrediKes({ alanId: alan.id, uid: g.uid, ad: alan.ad, tutar: g.tutar, kaynak: `sunucu:${kaynak}`, aciklama: g.aciklama, anahtar });
    if (r.ok && !r.tekrar) { bakiye = r.kullanilabilir; return islem(g.tutar, anahtar); }
    if (r.ok) return { hata: "tekrar", gereken: g.tutar, bakiye: r.kullanilabilir };
    return { hata: r.neden, gereken: g.tutar, bakiye: r.kullanilabilir, sinir: r.sinir, buAy: r.buAy };
  }
  const r = await krediHarca(g.uid, g.tutar, { kaynak: `sunucu:${kaynak}`, aciklama: g.aciklama.slice(0, 160), anahtar, plan: g.plan });
  if (r.ok && !r.tekrar) { bakiye = r.ozet.bakiye; return islem(g.tutar, anahtar); }
  if (r.ok) return { hata: "tekrar", gereken: g.tutar, bakiye: r.ozet.bakiye };
  return { hata: r.neden, gereken: g.tutar, bakiye: r.ozet?.bakiye };
}

/** krediKes hatası → HTTP yanıtı. */
export function kesintiYaniti(h: Exclude<KesSonucu, KrediIslemi>): Response {
  if (h.hata === "yetersiz") {
    return hata(`Kredin yetmiyor. Bu işlem ${h.gereken} kredi${typeof h.bakiye === "number" ? `, bakiyende ${h.bakiye} var` : ""}.`, 402, { kod: "yetersiz", gereken: h.gereken, bakiye: h.bakiye });
  }
  if (h.hata === "sinir") {
    return hata(`Bu ayki çalışma alanı kredi sınırına ulaştın${typeof h.sinir === "number" ? ` (${h.sinir} kredi, bu ay ${h.buAy ?? 0} harcandı)` : ""}. Sınır ayın 1'inde yenilenir; alan yöneticisi sınırını artırabilir.`, 402, { kod: "sinir", gereken: h.gereken, bakiye: h.bakiye, sinir: h.sinir });
  }
  if (h.hata === "izleyici") return hata("Bu çalışma alanında izleyicisin; kredi harcayamazsın. Üretmek için alan yöneticisinden üye rolü iste ya da kişisel alana geç.", 403, { kod: "izleyici", bakiye: 0 });
  if (h.hata === "uye-degil") return hata("Seçili çalışma alanının üyesi değilsin. Alan seçiciden başka bir alan seç.", 403, { kod: "alan" });
  if (h.hata === "tekrar") return hata("Bu işlem anahtarıyla yapılan işlem zaten işlendi; kredi yeniden düşülmedi.", 409, { kod: "tekrar", bakiye: h.bakiye });
  if (h.hata === "cakisma") return hata("Bu işlem anahtarı başka bir tutarla kullanılmış.", 409, { kod: "cakisma", bakiye: h.bakiye });
  return hata("İşlem anahtarı geçersiz.", 400, { kod: "gecersiz" });
}

/**
 * Oturumlu rotalar için: oturum yoksa 401, kredi yetmiyorsa 402, aynı anahtarla tekrar 409.
 * taban: lib/krediTarife ile sunucuda hesaplanan bedel. istemci: istemcinin gösterdiği bedel (yalnız tabanın üstündeyse kesilir).
 * ucretli: gerçek sağlayıcı çalışacak mı (false ise kredi kesilmez; sahte başlıkta her zaman kesilir).
 */
export async function krediAl(req: Request, g: {
  kaynak: string; aciklama: string; taban: number; istemci?: unknown; ucretli: boolean; oturum?: GecerliOturum;
}): Promise<KrediIslemi | Response> {
  const o = g.oturum ?? (await oturumGerekli(req));
  if (o instanceof Response) return o;
  const sahte = sahteSaglayici(req);
  const tutar = g.ucretli || sahte ? kesilecekTutar(g.taban, g.istemci) : 0;
  // Etkin çalışma alanı (çerez ya da başlık): üyelik ve rol sunucuda denetlenir; kişisel alanda davranış aynı kalır.
  const e = await etkinAlanCoz(req, o.hesap.uid);
  if (e instanceof Response) return e;
  if (e && e.uye.rol === "izleyici") return kesintiYaniti({ hata: "izleyici", gereken: tutar });
  const alan = e ? { id: e.alan.id, ad: o.hesap.profil.ad || o.hesap.email.split("@")[0] } : null;
  const r = await krediKes({ uid: o.hesap.uid, plan: o.hesap.plan, kaynak: g.kaynak, aciklama: g.aciklama, tutar, istemciAnahtari: req.headers.get(ISLEM_BASLIGI), sahte, alan });
  return "hata" in r ? kesintiYaniti(r) : r;
}

/** Sahte sağlayıcı açıksa onu, değilse gerçeğini çalıştırır. */
export async function saglayiciyla<T>(k: KrediIslemi, gercek: () => Promise<T>, sahteDeger: () => T): Promise<T> {
  if (k.sahte === "hata") throw new Error("Sınama: sağlayıcı hata verdi.");
  if (k.sahte === "gercek") return sahteDeger();
  return gercek();
}

/* ── Ücretsiz yeniden üretim hakkı (seslendirme) ──
   Ücretli bir seslendirme bitince sunucu bir hak kaydı açar ve kimliğini istemciye verir; aynı metnin yeniden
   üretimi bu kimlikle (meta.sesHak) gelirse kredi kesilmez, hak bir azalır. Hak hesaba bağlıdır ve ilk işin
   bedelini aşan bir iş için kullanılamaz. Sağlayıcı hata verirse hak geri verilir. */

interface HakKaydi { uid: string; kalan: number; tutar: number; zaman: number }
const hakDosyasi = (id: string) => path.join(HESAP_KOK, "kredi-hak", `${ozet(id)}.json`);
const HAK_DESENI = /^hak_[A-Za-z0-9_-]{16,40}$/;

export async function hakAc(uid: string, tutar: number, adet: number): Promise<string> {
  const id = `hak_${randomBytes(18).toString("base64url")}`;
  await jsonYaz(hakDosyasi(id), { uid, kalan: adet, tutar, zaman: Date.now() } satisfies HakKaydi);
  return id;
}
/** Hakkı kullanır (bir azaltır). Geçersiz, başkasının, bitmiş ya da daha pahalı iş için false. */
export async function hakKullan(uid: string, id: unknown, tutar: number): Promise<boolean> {
  if (typeof id !== "string" || !HAK_DESENI.test(id)) return false;
  return kilitle(`kredi-hak:${id}`, async () => {
    const h = await jsonOku<HakKaydi>(hakDosyasi(id));
    if (!h || h.uid !== uid || h.kalan <= 0 || tutar > h.tutar) return false;
    await jsonYaz(hakDosyasi(id), { ...h, kalan: h.kalan - 1 });
    return true;
  });
}
/** İş başarısız: kullanılan hak geri verilir (hatalı denemeler hak yemez). */
export async function hakGeriVer(id: string) {
  await kilitle(`kredi-hak:${id}`, async () => {
    const h = await jsonOku<HakKaydi>(hakDosyasi(id));
    if (h) await jsonYaz(hakDosyasi(id), { ...h, kalan: h.kalan + 1 });
  });
}

/* ── Zaman uyumsuz işler (büyütme, LoRA eğitimi) ──
   Kesinti iş başlarken yapılır; sağlayıcı sonradan hata verirse durum sorgusu iadeyi yapar.
   İş kaydı jetonun özetiyle saklanır (jetonun kendisi yazılmaz). */

interface IsFaturasi { uid: string; anahtar: string; kaynak: string; tutar: number; zaman: number; sahte?: SahteSaglayici; alan?: string }
const isDosyasi = (jeton: string) => path.join(HESAP_KOK, "kredi-is", `${ozet(jeton)}.json`);

export async function isFaturasiYaz(jeton: string, k: KrediIslemi) {
  if (!k.defterAnahtari || !k.tutar) return;
  await jsonYaz(isDosyasi(jeton), { uid: k.uid, anahtar: k.defterAnahtari, kaynak: k.kaynak, tutar: k.tutar, zaman: Date.now(), ...(k.sahte ? { sahte: k.sahte } : {}), ...(k.alan ? { alan: k.alan } : {}) } satisfies IsFaturasi);
}
export const isFaturasi = (jeton: string) => jsonOku<IsFaturasi>(isDosyasi(jeton));
/** İş başarısız: kesinti bir kez iade edilir, kayıt silinir. Yeni bakiye döner. */
export async function isIade(jeton: string, aciklama: string): Promise<{ miktar: number; bakiye?: number } | null> {
  const f = await isFaturasi(jeton);
  if (!f) return null;
  await sil(isDosyasi(jeton));
  if (f.alan) {
    const a = await alanIade(f.alan, f.anahtar, { kaynak: `sunucu:${f.kaynak}`, aciklama: aciklama.slice(0, 160) });
    return a.ok ? { miktar: a.miktar } : null;
  }
  const r = await krediIade(f.uid, f.anahtar, { kaynak: `sunucu:${f.kaynak}`, aciklama: aciklama.slice(0, 160) });
  return r.ok ? { miktar: r.miktar, bakiye: r.ozet.bakiye } : null;
}
/** İş başarıyla bitti: kayıt silinir (kesinti kalır). */
export const isKapat = (jeton: string) => sil(isDosyasi(jeton));
