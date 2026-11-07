import "server-only";
import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { epostaKurulu } from "@/lib/build/bulutEposta";
import { aktifAbonelik, kayitSil as odemeKaydiSil } from "@/lib/odeme/depo";
import {
  D, epostaIndeksSil, epostaIndeksYaz, epostaKilidi, epostaNormal, epostadanUid, hesapGuncelle, hesapOku, hesapSilHam, hesapYazHam,
  kadiSil, kadiUid, kadiYaz, kilitle, olayEkle, saglayiciSil, sil, yeniUid, type HesapKaydi,
} from "./depo";
import { gelistirme } from "./guvenlik";
import { defterAc, defterSil, krediOzeti, planDegistir, planKotasi } from "./kredi";
import { oturumBilgileri, oturumDizinleriniSil } from "./oturum";
import { saglayiciKurulu } from "./saglayiciAyar";
import { SAGLAYICILAR, type BenYaniti, type HesapOzeti, type KullaniciVerisi, type PlanKimligi, type ProfilVerisi, type Rol, type SunucuDurumu } from "./tipler";

export const PLANLAR: PlanKimligi[] = ["baslangic", "arti", "ultra", "kurumsal"];
const PLAN_SIRA: Record<PlanKimligi, number> = { baslangic: 0, arti: 1, ultra: 2, kurumsal: 3 };

/** Ödeme altyapısı yokken plan yükseltme ve kredi yükleme yalnız geliştirmede ya da VAYRA_DENEME_ODEME=1 ise kabul edilir. */
export const odemeDeneme = () => gelistirme() || process.env.VAYRA_DENEME_ODEME === "1";

export function yeniHesapPlani(): PlanKimligi {
  const p = process.env.VAYRA_YENI_HESAP_PLAN as PlanKimligi | undefined;
  return p && PLANLAR.includes(p) ? p : "baslangic";
}

function adminEpostalari(): Set<string> {
  return new Set((process.env.VAYRA_ADMIN_EPOSTALARI ?? "").split(/[\s,;]+/).map((e) => epostaNormal(e)).filter(Boolean));
}

/** Etkin rol: kayıtlı admin ya da VAYRA_ADMIN_EPOSTALARI listesinde doğrulanmış e-posta. */
export function rolHesapla(h: HesapKaydi): Rol {
  if (h.rol === "admin") return "admin";
  return h.epostaDogrulandi && adminEpostalari().has(epostaNormal(h.email)) ? "admin" : "kullanici";
}
/** Listedeki doğrulanmış e-posta ilk kez görülünce rol kalıcı olarak yazılır. Çağıran hesapGuncelle içindedir. */
export function rolYukselt(h: HesapKaydi) { if (h.rol !== "admin" && rolHesapla(h) === "admin") h.rol = "admin"; }

export function sunucuDurumu(): SunucuDurumu {
  return {
    gelistirme: gelistirme(), epostaServisi: epostaKurulu(), odemeDeneme: odemeDeneme(),
    saglayicilar: Object.fromEntries(SAGLAYICILAR.map((s) => [s, saglayiciKurulu(s)])) as SunucuDurumu["saglayicilar"],
  };
}

export function hesapOzeti(h: HesapKaydi, oturumId: string): HesapOzeti {
  const y = h.ikiAdim?.yedekler ?? [];
  return {
    uid: h.uid, rol: rolHesapla(h), email: h.email, epostaDogrulandi: h.epostaDogrulandi, ...(h.bekleyenEposta ? { bekleyenEposta: h.bekleyenEposta } : {}),
    sifreVar: !!h.sifre, sifreGuncelleme: h.sifre?.guncelleme ?? null,
    ikiAdim: { aktif: !!h.ikiAdim, acilis: h.ikiAdim?.acilis ?? null, yedekToplam: y.length, yedekKalan: y.filter((x) => !x.kullanildi).length, yedekDurum: y.map((x) => !!x.kullanildi) },
    saglayicilar: [...new Set(h.saglayicilar.map((s) => s.tur))], olusturma: h.olusturma, oturumId, oturumlar: oturumBilgileri(h, oturumId),
    yeniGirisEposta: h.tercih?.yeniGirisEposta !== false,
  };
}

export async function kullaniciVerisi(h: HesapKaydi): Promise<KullaniciVerisi> {
  const k = await krediOzeti(h.uid, h.plan);
  // Abonelik dönemi bitince plan kredi defterinde dönem dönümünde değişir; hesap kaydı defterle eşitlenir.
  if (k.plan !== h.plan) void hesapGuncelle(h.uid, (x) => { x.plan = k.plan; }).catch(() => {});
  return { ...h.profil, email: h.email, plan: k.plan, krediler: k.bakiye, ekKredi: Math.max(0, k.donemToplam - planKotasi(k.plan)) };
}

export async function benYaniti(h: HesapKaydi, oturumId: string): Promise<BenYaniti> {
  return { ok: true, kullanici: await kullaniciVerisi(h), hesap: hesapOzeti(h, oturumId), sunucu: sunucuDurumu() };
}

/* ── Oluşturma ── */

const adTemizle = (s: unknown, en = 60) => String(s ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, en);

export type OlusturmaSonucu = { ok: true; hesap: HesapKaydi } | { ok: false; neden: "var" };

/** E-posta kilidi altında hesap açar; e-posta kayıtlıysa açmaz. Kredi defteri de açılır. */
export async function hesapOlustur(g: { email: string; ad: string; sifreOzeti?: string; dogrulandi: boolean; saglayici?: HesapKaydi["saglayicilar"][number]; cihaz: string; ip: string; yontem: string }): Promise<OlusturmaSonucu> {
  const email = epostaNormal(g.email);
  return kilitle(epostaKilidi(email), async () => {
    if (await epostadanUid(email)) return { ok: false, neden: "var" } as const;
    const simdi = Date.now();
    const h: HesapKaydi = {
      uid: yeniUid(), email, olusturma: simdi, guncelleme: simdi, rol: "kullanici", epostaDogrulandi: g.dogrulandi,
      ...(g.sifreOzeti ? { sifre: { ozet: g.sifreOzeti, guncelleme: simdi } } : {}),
      saglayicilar: g.saglayici ? [g.saglayici] : [], profil: { ad: adTemizle(g.ad) || email.split("@")[0] }, plan: yeniHesapPlani(),
      oturumlar: [], olaylar: [],
    };
    olayEkle(h, "kayit", g.cihaz, g.yontem, g.ip);
    rolYukselt(h);
    await hesapYazHam(h);
    await epostaIndeksYaz(email, h.uid);
    await defterAc(h.uid, h.plan);
    return { ok: true, hesap: h } as const;
  });
}

/* ── Profil ── */

const KADI = /^[a-z0-9._]{3,24}$/;
const AYRILMIS = new Set(["admin", "yonetici", "vayra", "destek", "api", "panel", "giris", "kayit", "ayarlar", "yardim", "root", "sistem", "moderator", "resmi"]);
const MEDYA_SINIRI = { avatar: 600_000, kapak: 1_800_000 } as const;
const UZANTI: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

async function medyaKaydet(uid: string, tur: "avatar" | "kapak", deger: string): Promise<string> {
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(deger);
  if (!m) throw new ProfilHatasi("Görsel PNG, JPEG ya da WebP olmalı.");
  const bayt = Buffer.from(m[2], "base64");
  if (bayt.length > MEDYA_SINIRI[tur]) throw new ProfilHatasi(tur === "avatar" ? "Profil fotoğrafı en çok 600 KB olabilir." : "Kapak görseli en çok 1,8 MB olabilir.");
  const imza = bayt.subarray(0, 12).toString("hex");
  const turUyar = m[1] === "image/png" ? imza.startsWith("89504e47") : m[1] === "image/jpeg" ? imza.startsWith("ffd8ff") : imza.startsWith("52494646") && imza.slice(16, 24) === "57454250";
  if (!turUyar) throw new ProfilHatasi("Görsel dosyası bozuk ya da türü uyuşmuyor.");
  const ad = `${tur}-${createHash("sha256").update(bayt).digest("hex").slice(0, 12)}.${UZANTI[m[1]]}`;
  const dizin = path.join(D.medya, uid);
  await mkdir(dizin, { recursive: true });
  await writeFile(path.join(dizin, ad), bayt, { mode: 0o600 });
  return `/api/hesap/medya/${uid}/${ad}`;
}

function medyaYolu(uid: string, url?: string) {
  const m = url && new RegExp(`^/api/hesap/medya/${uid}/((?:avatar|kapak)-[a-f0-9]{12}\\.(?:png|jpg|webp))$`).exec(url);
  return m ? path.join(D.medya, uid, m[1]) : null;
}

export class ProfilHatasi extends Error { constructor(mesaj: string, public durum = 400, public kod?: string) { super(mesaj); } }

function baglantiTemizle(v: unknown, en = 200): string {
  const s = String(v ?? "").trim();
  if (!s) return "";
  const t = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  let u: URL;
  try { u = new URL(t); } catch { throw new ProfilHatasi("Web sitesi adresi geçerli değil."); }
  if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) throw new ProfilHatasi("Web sitesi adresi geçerli değil.");
  return u.toString().slice(0, en);
}

/**
 * Profil alanlarını doğrular ve hesaba yazar. Kullanıcı adı benzersizdir; plan yükseltmesi yalnız ödeme denemesi
 * açıkken kabul edilir (düşürmek her zaman serbest). Bilinmeyen alanlar yok sayılır.
 */
export async function profilGuncelle(uid: string, patch: Record<string, unknown>): Promise<HesapKaydi> {
  const hesap = await hesapOku(uid);
  if (!hesap) throw new ProfilHatasi("Hesap bulunamadı.", 404);
  const p: Partial<ProfilVerisi> = {};
  if ("ad" in patch) { const a = adTemizle(patch.ad); if (a.length < 1) throw new ProfilHatasi("Adını gir."); p.ad = a; }
  for (const [alan, en] of [["slogan", 120], ["bio", 1000], ["konum", 80]] as const) if (alan in patch) p[alan] = String(patch[alan] ?? "").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim().slice(0, en);
  if ("website" in patch) p.website = baglantiTemizle(patch.website);
  if ("sosyal" in patch) {
    const s = (patch.sosyal && typeof patch.sosyal === "object" ? patch.sosyal : {}) as Record<string, unknown>;
    p.sosyal = Object.fromEntries((["x", "instagram", "youtube", "tiktok"] as const).filter((k) => s[k]).map((k) => [k, adTemizle(s[k], 120)]));
  }
  let yeniKadi: string | undefined;
  if ("kullaniciAdi" in patch) {
    const k = String(patch.kullaniciAdi ?? "").trim().replace(/^@/, "").toLowerCase();
    if (k && (!KADI.test(k) || AYRILMIS.has(k))) throw new ProfilHatasi("Kullanıcı adı 3 ile 24 karakter arası olmalı; küçük harf, rakam, nokta ve alt çizgi kullanılabilir.");
    yeniKadi = k;
  }
  if ("davetEden" in patch && !hesap.profil.davetEden) { const d = adTemizle(patch.davetEden, 40); if (d) p.davetEden = d; }
  if ("davetIndirimi" in patch) {
    const d = patch.davetIndirimi;
    if (d === "kullanildi" && hesap.profil.davetEden) p.davetIndirimi = "kullanildi";
    else if (d === "bekliyor" && (hesap.profil.davetEden || p.davetEden) && hesap.profil.davetIndirimi !== "kullanildi") p.davetIndirimi = "bekliyor";
  }
  let yeniPlan: PlanKimligi | undefined;
  if ("plan" in patch && patch.plan !== hesap.plan) {
    const pl = patch.plan as PlanKimligi;
    if (!PLANLAR.includes(pl)) throw new ProfilHatasi("Plan tanınmadı.");
    if (PLAN_SIRA[pl] > PLAN_SIRA[hesap.plan] && !odemeDeneme()) throw new ProfilHatasi("Ödeme altyapısı bu sunucuda kurulu değil; plan yükseltilemedi.", 403, "odeme");
    // Ücretli abonelik sürerken plan yalnız ödeme akışıyla değişir (Ayarlar, Plan): profil yolu aboneliği atlamasın.
    if (await aktifAbonelik(uid)) throw new ProfilHatasi("Planın bir abonelikle yönetiliyor. Değiştirmek için Ayarlar, Plan bölümünü kullan.", 409, "abonelik");
    yeniPlan = pl;
  }
  const medya: Partial<Record<"avatar" | "kapak", string>> = {};
  for (const tur of ["avatar", "kapak"] as const) {
    if (!(tur in patch)) continue;
    const v = String(patch[tur] ?? "").trim();
    if (!v) medya[tur] = "";
    else if (v.startsWith("data:")) medya[tur] = await medyaKaydet(uid, tur, v);
    else if ((/^\/(?!\/)[\w\-./%]{1,300}$/.test(v) && !v.includes("..")) || /^https:\/\/[^\s"'<>]{4,500}$/.test(v)) medya[tur] = v;
    else throw new ProfilHatasi("Görsel adresi geçerli değil.");
  }

  const yaz = async () => {
    const r = await hesapGuncelle(uid, async (h) => {
      const eskiMedya = { avatar: h.profil.avatar, kapak: h.profil.kapak };
      h.profil = { ...h.profil, ...p };
      for (const [tur, v] of Object.entries(medya) as ["avatar" | "kapak", string][]) {
        if (v) h.profil[tur] = v; else delete h.profil[tur];
        const eski = medyaYolu(uid, eskiMedya[tur]);
        if (eski && eskiMedya[tur] !== v) await sil(eski);
      }
      if (yeniKadi !== undefined) {
        const eski = h.profil.kullaniciAdi;
        if (yeniKadi && yeniKadi !== eski) {
          const sahibi = await kadiUid(yeniKadi);
          if (sahibi && sahibi !== uid) throw new ProfilHatasi("Bu kullanıcı adı alınmış.", 409, "kadi");
          await kadiYaz(yeniKadi, uid);
        }
        if (eski && eski !== yeniKadi) await kadiSil(eski);
        if (yeniKadi) h.profil.kullaniciAdi = yeniKadi; else delete h.profil.kullaniciAdi;
      }
      for (const k of Object.keys(h.profil) as (keyof ProfilVerisi)[]) if (h.profil[k] === "" && k !== "ad") delete h.profil[k];
      if (yeniPlan) h.plan = yeniPlan;
      if (typeof patch.yeniGirisEposta === "boolean") h.tercih = { ...h.tercih, yeniGirisEposta: patch.yeniGirisEposta };
    });
    if (!r) throw new ProfilHatasi("Hesap bulunamadı.", 404);
    if (yeniPlan) await planDegistir(uid, yeniPlan, "profil");
    return r.hesap;
  };
  // Kullanıcı adı dizini hesaplar arası paylaşılır: aynı adı iki hesap aynı anda alamasın.
  return yeniKadi ? kilitle(`kadi:${yeniKadi}`, yaz) : yaz();
}

/* ── Silme (KVKK) ── */

/**
 * Hesabı ve hesaba bağlı bütün sunucu verisini siler: oturumlar, kredi defteri, dizinler, medya, Build projeleri
 * (hesabın Build anahtarına ait olanlar ve çöp kutusu). Silinen hesabın yalnız özet kimliği günlükte kalır.
 */
export async function hesabiSil(uid: string, buildTemizle: (h: HesapKaydi) => Promise<void>): Promise<boolean> {
  const h = await hesapOku(uid);
  if (!h) return false;
  await kilitle(epostaKilidi(h.email), async () => {
    await hesapGuncelle(uid, async (x) => { await oturumDizinleriniSil(x); x.oturumlar = []; });
    await buildTemizle(h).catch((e) => console.error("[hesap] Build verisi silinemedi:", (e as Error).message));
    // Çalışma alanları: üyelikler kalkar; sahibi olduğu alan başka üyeye geçer ya da (tek üyeyse) silinir.
    await import("@/lib/alan/islem").then((m) => m.hesapAlanlariniTemizle(h)).catch((e) => console.error("[hesap] Çalışma alanları temizlenemedi:", (e as Error).message));
    await defterSil(uid);
    await odemeKaydiSil(uid).catch((e) => console.error("[hesap] Ödeme kaydı silinemedi:", (e as Error).message));
    if ((await epostadanUid(h.email)) === uid) await epostaIndeksSil(h.email);
    if (h.bekleyenEposta && (await epostadanUid(h.bekleyenEposta)) === uid) await epostaIndeksSil(h.bekleyenEposta);
    if (h.profil.kullaniciAdi && (await kadiUid(h.profil.kullaniciAdi)) === uid) await kadiSil(h.profil.kullaniciAdi);
    for (const s of h.saglayicilar) await saglayiciSil(s.tur, s.kimlik);
    await sil(path.join(D.medya, uid));
    // Galeri düzeni (favoriler ve klasörler)
    await import("./galeriDepo").then((m) => m.duzenSil(uid)).catch((e) => console.error("[hesap] Galeri düzeni silinemedi:", (e as Error).message));
    // Earn başvuruları
    await import("./earnDepo").then((m) => m.basvurulariSil(uid)).catch((e) => console.error("[hesap] Earn başvuruları silinemedi:", (e as Error).message));
    await hesapSilHam(uid);
  });
  return true;
}
