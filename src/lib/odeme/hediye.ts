import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { kilitle } from "@/lib/hesap/depo";
import { gelistirme } from "@/lib/hesap/guvenlik";
import { krediEkle, krediHarca, krediIade } from "@/lib/hesap/kredi";
import type { KrediOzeti, PlanKimligi } from "@/lib/hesap/tipler";
import { hediyeOku, hediyeYaz, kayitGuncelle, kayitOku, ozet, type HediyeKaydi } from "./depo";
import { OdemeHatasi } from "./hata";

/**
 * Promosyon ve hediye kodları. Doğrulama ve kredi işlemi tamamen sunucuda:
 *  - Promosyon kodları yalnız burada tanımlı; hesap başına bir kez (ödeme kaydı ve kredi defteri anahtarı).
 *  - Hediye kodu oluşturulurken gönderenin kredisi defterden düşer; kod sunucuda saklanır (dosya adında yalnız özeti),
 *    alan kişi kullanınca kredi onun defterine eklenir. Kod bir kez kullanılır; kullanılmamış kod iptal edilirse kredi
 *    gönderene iade edilir.
 *  - Eski sürümün yalnız imzayla doğrulanan kodları (sunucuda kaydı olmayan) yalnız VAYRA_HEDIYE_SIRRI tanımlıysa kabul
 *    edilir; kaynak koddaki varsayılan sırla imzalanmış kod üretimde geçmez.
 */

const SIR = () => process.env.VAYRA_HEDIYE_SIRRI || (gelistirme() ? "vayra_hediye_imza_siri_2026" : "");
export const HEDIYE_TUTARLARI = [100, 250, 500, 1000, 2500];
const PROMOSYONLAR: Record<string, { kredi: number; aciklama: string; bitis?: string }> = {
  HOSGELDIN: { kredi: 100, aciklama: "Hoş geldin hediyesi" },
  VAYRA50: { kredi: 50, aciklama: "Topluluk kodu" },
  YARATICI2026: { kredi: 250, aciklama: "2026 yaratıcı kampanyası", bitis: "2026-12-31T23:59:59+03:00" },
};
const ALFA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const rastgele = (n: number) => [...randomBytes(n)].map((b) => ALFA[b % ALFA.length]).join("");
const imza = (govde: string, sir: string) => createHmac("sha256", sir).update(govde).digest("base64url").replace(/[-_]/g, "").slice(0, 8).toUpperCase();
const kodOzeti = (kod: string) => ozet(`hediye:${kod}`);
export const kodNormal = (k: unknown) => String(k ?? "").trim().toUpperCase().replace(/\s+/g, "").slice(0, 40);

function eskiKodGecerli(kod: string): number | null {
  const sir = process.env.VAYRA_HEDIYE_SIRRI || (gelistirme() ? SIR() : "");
  if (!sir) return null;
  const m = /^VAYRA-(\d{3,4})-([A-Z0-9]{6})-([A-Z0-9]{8})$/.exec(kod);
  if (!m) return null;
  const a = Buffer.from(imza(`${m[1]}-${m[2]}`, sir)), b = Buffer.from(m[3]);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const kredi = Number(m[1]);
  return HEDIYE_TUTARLARI.includes(kredi) ? kredi : null;
}

export interface GonderilenHediye { ozet: string; kod: string; kredi: number; zaman: number; not?: string; kullanildi?: number; iptal?: number }

export async function hediyeOlustur(uid: string, plan: PlanKimligi, kredi: number, not: string): Promise<{ kod: string; kredi: number; ozet: KrediOzeti }> {
  if (!HEDIYE_TUTARLARI.includes(kredi)) throw new OdemeHatasi("Geçersiz tutar.");
  const govde = `${String(kredi).padStart(3, "0")}-${rastgele(6)}`;
  const sir = SIR();
  const kod = `VAYRA-${govde}-${sir ? imza(govde, sir) : rastgele(8)}`;
  const oz = kodOzeti(kod);
  const harcamaAnahtari = `hediye-gonder:${oz.slice(0, 32)}`;
  const r = await krediHarca(uid, kredi, { kaynak: "hediye-gonder", aciklama: `Hediye kodu oluşturuldu${not ? `, ${not}` : ""}`, anahtar: harcamaAnahtari, plan });
  if (!r.ok) throw new OdemeHatasi(r.neden === "yetersiz" ? "Bakiyen bu tutar için yetmiyor." : "Kredi düşülemedi; yeniden dene.", r.neden === "yetersiz" ? 402 : 409, r.neden);
  const kayit: HediyeKaydi = { ozet: oz, ipucu: `${kod.slice(0, 12)}…${kod.slice(-4)}`, kredi, olusturan: uid, olusturma: Date.now(), harcamaAnahtari, ...(not ? { not } : {}) };
  await hediyeYaz(kayit);
  await kayitGuncelle(uid, (k) => { k.hediyeler = [{ ozet: oz, kod, kredi, zaman: kayit.olusturma, ...(not ? { not } : {}) }, ...(k.hediyeler ?? [])].slice(0, 200); });
  return { kod, kredi, ozet: r.ozet };
}

export type KodSonucu = { tur: "promo" | "hediye"; kod: string; kredi: number; aciklama: string; ozet: KrediOzeti };

export async function kodKullan(uid: string, plan: PlanKimligi, hamKod: string): Promise<KodSonucu> {
  const kod = kodNormal(hamKod);
  if (!kod) throw new OdemeHatasi("Bir kod gir.");
  const promo = PROMOSYONLAR[kod];
  if (promo) {
    if (promo.bitis && Date.now() > Date.parse(promo.bitis)) throw new OdemeHatasi("Bu kampanyanın süresi doldu.", 410);
    return kilitle(`promo:${kod}:${uid}`, async () => {
      if ((await kayitOku(uid)).promolar[kod]) throw new OdemeHatasi("Bu kodu bu hesapta zaten kullandın.", 409);
      const r = await krediEkle(uid, promo.kredi, { kaynak: `promo:${kod}`, aciklama: `${promo.aciklama}, ${kod}`, anahtar: `promo:${kod}:${uid.slice(2)}`, plan });
      if (!r.ok) throw new OdemeHatasi("Kod uygulanamadı; yeniden dene.", 409);
      await kayitGuncelle(uid, (k) => { k.promolar[kod] = Date.now(); });
      if (r.tekrar) throw new OdemeHatasi("Bu kodu bu hesapta zaten kullandın.", 409);
      return { tur: "promo" as const, kod, kredi: promo.kredi, aciklama: promo.aciklama, ozet: r.ozet };
    });
  }
  const oz = kodOzeti(kod);
  return kilitle(`hediye:${oz}`, async () => {
    let h = await hediyeOku(oz);
    if (!h) {
      const eski = eskiKodGecerli(kod);
      if (!eski) throw new OdemeHatasi("Bu kod geçerli değil. Harfleri ve tireleri kontrol et.", 404);
      h = { ozet: oz, ipucu: `${kod.slice(0, 12)}…${kod.slice(-4)}`, kredi: eski, olusturan: "eski-surum", olusturma: Date.now(), harcamaAnahtari: "" };
    }
    if (h.iptal) throw new OdemeHatasi("Bu hediye kodu gönderen tarafından iptal edildi.", 410);
    if (h.kullanan) throw new OdemeHatasi(h.kullanan === uid ? "Bu hediye kodunu zaten kullandın." : "Bu hediye kodu başka bir hesapta kullanılmış.", 409);
    if (h.olusturan === uid) throw new OdemeHatasi("Kendi oluşturduğun hediye kodunu kullanamazsın.", 400);
    const r = await krediEkle(uid, h.kredi, { kaynak: "hediye", aciklama: `Hediye kredisi, ${h.ipucu}`, anahtar: `hediye:${oz.slice(0, 40)}`, plan });
    if (!r.ok) throw new OdemeHatasi("Kod uygulanamadı; yeniden dene.", 409);
    h.kullanan = uid; h.kullanma = Date.now();
    await hediyeYaz(h);
    if (h.olusturan !== "eski-surum") await kayitGuncelle(h.olusturan, (k) => { const x = k.hediyeler?.find((y) => y.ozet === oz); if (x) x.kullanildi = h!.kullanma; }).catch(() => {});
    return { tur: "hediye" as const, kod, kredi: h.kredi, aciklama: "Hediye kredisi", ozet: r.ozet };
  });
}

export async function gonderilenler(uid: string): Promise<GonderilenHediye[]> {
  return (await kayitOku(uid)).hediyeler ?? [];
}

/** Kullanılmamış hediye kodunu iptal eder; kredi gönderene iade edilir. */
export async function hediyeIptal(uid: string, oz: string): Promise<KrediOzeti> {
  if (!/^[a-f0-9]{64}$/.test(oz)) throw new OdemeHatasi("Kod bulunamadı.", 404);
  return kilitle(`hediye:${oz}`, async () => {
    const h = await hediyeOku(oz);
    if (!h || h.olusturan !== uid) throw new OdemeHatasi("Kod bulunamadı.", 404);
    if (h.kullanan) throw new OdemeHatasi("Bu kod kullanılmış; iptal edilemez.", 409);
    if (h.iptal) throw new OdemeHatasi("Bu kod zaten iptal edildi.", 409);
    const r = await krediIade(uid, h.harcamaAnahtari, { kaynak: "hediye-iade", aciklama: `Hediye kodu iptal edildi, ${h.ipucu}` });
    if (!r.ok) throw new OdemeHatasi("Kredi iade edilemedi; destekle iletişime geç.", 409);
    h.iptal = Date.now();
    await hediyeYaz(h);
    await kayitGuncelle(uid, (k) => { const x = k.hediyeler?.find((y) => y.ozet === oz); if (x) x.iptal = h.iptal; });
    return r.ozet;
  });
}
