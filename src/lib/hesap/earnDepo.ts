import "server-only";
import path from "path";
import { readdir } from "fs/promises";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { jsonOku, jsonYaz, kilitle, sil, UID_DESENI, yeniKimlik } from "@/lib/hesap/depo";

/**
 * Vayra Earn başvuruları: kullanıcının kampanyaya gönderdiği bağlantılar sunucuda kayıtlıdır
 * (.veri/earn/<uid>.json). Durum yalnız yönetim panelindeki inceleme kararıyla değişir; zamanla
 * kendiliğinden onaylanmaz. Kazanç defteri yoktur: bu kayıt para tutarı taşımaz.
 */
export const EARN_KOK = path.join(DEPO_KOK, "earn");
export type BasvuruDurum = "inceleme" | "onaylandi" | "reddedildi";
export const EARN_PLATFORMLAR = ["instagram", "tiktok", "youtube", "x"] as const;
export type EarnPlatform = (typeof EARN_PLATFORMLAR)[number];

export interface EarnBasvuru {
  id: string;
  kampanyaId: string;
  kampanyaAd: string;
  platform: EarnPlatform;
  link: string;
  tarih: number;
  durum: BasvuruDurum;
  /** Otomatik bağlantı kontrolünün sonucu (platform API'si bağlıysa). */
  kontrol?: { gercek: boolean; sahibiMi: boolean | null };
  red?: string;
  itiraz?: "inceleniyor" | "reddedildi";
  karar?: { zaman: number; admin: string };
}

interface EarnDosya { uid: string; email: string; basvurular: EarnBasvuru[] }

const EN_COK = 500;
const dosya = (uid: string) => path.join(EARN_KOK, `${uid}.json`);

export async function basvurularim(uid: string): Promise<EarnBasvuru[]> {
  if (!UID_DESENI.test(uid)) return [];
  return (await jsonOku<EarnDosya>(dosya(uid)))?.basvurular ?? [];
}

export async function basvuruEkle(uid: string, email: string, b: Omit<EarnBasvuru, "id" | "tarih" | "durum">): Promise<{ ok: true; basvuru: EarnBasvuru } | { ok: false; hata: string }> {
  if (!UID_DESENI.test(uid)) return { ok: false, hata: "Hesap bulunamadı." };
  return kilitle(`earn:${uid}`, async () => {
    const d = (await jsonOku<EarnDosya>(dosya(uid))) ?? { uid, email, basvurular: [] };
    const ayni = d.basvurular.find((x) => x.kampanyaId === b.kampanyaId && x.link === b.link && x.durum !== "reddedildi");
    if (ayni) return { ok: true as const, basvuru: ayni };
    if (d.basvurular.length >= EN_COK) return { ok: false as const, hata: "Başvuru sınırına ulaştın." };
    const yeni: EarnBasvuru = { ...b, id: yeniKimlik("eb"), tarih: Date.now(), durum: "inceleme" };
    d.email = email;
    d.basvurular = [yeni, ...d.basvurular];
    await jsonYaz(dosya(uid), d);
    return { ok: true as const, basvuru: yeni };
  });
}

export async function itirazEt(uid: string, id: string): Promise<EarnBasvuru | null> {
  if (!UID_DESENI.test(uid)) return null;
  return kilitle(`earn:${uid}`, async () => {
    const d = await jsonOku<EarnDosya>(dosya(uid));
    const b = d?.basvurular.find((x) => x.id === id);
    if (!d || !b || b.durum !== "reddedildi" || b.itiraz) return null;
    b.itiraz = "inceleniyor";
    await jsonYaz(dosya(uid), d);
    return b;
  });
}

/** Hesap silinince başvuru kaydı da silinir. */
export async function basvurulariSil(uid: string) {
  if (!UID_DESENI.test(uid)) return;
  await sil(dosya(uid));
}

/** Yönetim: bütün başvurular (yeniden eskiye). */
export async function tumBasvurular(): Promise<(EarnBasvuru & { uid: string; email: string })[]> {
  let adlar: string[] = [];
  try { adlar = await readdir(EARN_KOK); } catch { return []; }
  const l = await Promise.all(adlar.filter((a) => /^u_[A-Za-z0-9_-]{16}\.json$/.test(a)).map((a) => jsonOku<EarnDosya>(path.join(EARN_KOK, a))));
  return l.filter((x): x is EarnDosya => !!x).flatMap((d) => d.basvurular.map((b) => ({ ...b, uid: d.uid, email: d.email }))).sort((a, b) => b.tarih - a.tarih);
}

/** Yönetim kararı: onayla ya da gerekçeyle reddet. İtiraz edilmiş bir başvuruya verilen karar itirazı sonuçlandırır. */
export async function basvuruKarar(uid: string, id: string, durum: "onaylandi" | "reddedildi", admin: string, red?: string): Promise<EarnBasvuru | null> {
  if (!UID_DESENI.test(uid)) return null;
  return kilitle(`earn:${uid}`, async () => {
    const d = await jsonOku<EarnDosya>(dosya(uid));
    const b = d?.basvurular.find((x) => x.id === id);
    if (!d || !b) return null;
    if (b.itiraz === "inceleniyor") b.itiraz = durum === "reddedildi" ? "reddedildi" : undefined;
    b.durum = durum;
    b.red = durum === "reddedildi" ? (red || "Kampanya gereksinimleri karşılanmadı.").slice(0, 300) : undefined;
    b.karar = { zaman: Date.now(), admin };
    await jsonYaz(dosya(uid), d);
    return b;
  });
}
