import "server-only";
import { randomBytes } from "crypto";
import path from "path";
import { D, hesapGuncelle, hesapOku, hesapOkuSync, jsonOku, jsonOkuSync, jsonYaz, olayEkle, ozet, sil, yeniKimlik, type HesapKaydi, type OturumKaydi } from "./depo";
import { bildirimGonder } from "./eposta";
import { cihazOku, gelistirme, istemciIp, ipGizle } from "./guvenlik";
import type { OturumBilgisi } from "./tipler";

/**
 * Oturumlar: 32 baytlık rastgele belirteç httpOnly çerezde (vayra_oturum, SameSite=Lax, üretimde Secure, 30 gün).
 * Sunucuda yalnız belirtecin SHA-256 özeti tutulur: oturum/<özet>.json dizini + hesap kaydındaki oturum listesi.
 * Bir oturum ancak ikisinde de varsa geçerlidir; kapatma her ikisinden siler, önbellek hemen düşer.
 */
export const OTURUM_CEREZI = "vayra_oturum";
export const BEKLEYEN_CEREZI = "vayra_iki_adim";
export const OTURUM_SURESI = 30 * 86_400_000;
const SON_GORULME_ARALIGI = 5 * 60_000;
const ONBELLEK_SURESI = 30_000;

const oturumDosyasi = (oz: string) => path.join(D.oturum, `${oz}.json`);
const belirtecOzeti = (b: string) => ozet(`oturum:${b}`);
const BICIM = /^[A-Za-z0-9_-]{40,64}$/;

/* ── Çerezler ── */

function cerez(ad: string, deger: string, saniye: number, g: { httpOnly?: boolean; sameSite?: "Lax" | "Strict" | "None"; yol?: string } = {}) {
  const guvenli = !gelistirme() || g.sameSite === "None";
  return [
    `${ad}=${deger}`, `Path=${g.yol ?? "/"}`, `Max-Age=${Math.max(0, Math.floor(saniye))}`,
    ...(g.httpOnly === false ? [] : ["HttpOnly"]), `SameSite=${g.sameSite ?? "Lax"}`, ...(guvenli ? ["Secure"] : []),
  ].join("; ");
}
export const oturumCerezi = (belirtec: string, bitis: number) => cerez(OTURUM_CEREZI, belirtec, (bitis - Date.now()) / 1000);
export const oturumCereziSil = () => cerez(OTURUM_CEREZI, "", 0);
export const bekleyenCerezi = (b: string) => cerez(BEKLEYEN_CEREZI, b, 600, { yol: "/api/hesap" });
export const bekleyenCereziSil = () => cerez(BEKLEYEN_CEREZI, "", 0, { yol: "/api/hesap" });
export { cerez as cerezYaz };

export function cerezOku(req: Request, ad: string): string | null {
  const c = req.headers.get("cookie");
  if (!c) return null;
  for (const p of c.split(";")) {
    const i = p.indexOf("=");
    if (i > 0 && p.slice(0, i).trim() === ad) return decodeURIComponent(p.slice(i + 1).trim());
  }
  return null;
}

/* ── Önbellek (sahipAl gibi eşzamanlı yollar için) ── */

interface OnbellekKaydi { uid: string; id: string; bitis: number; zaman: number }
const G = globalThis as unknown as { __vayraOturumOnbellek?: Map<string, OnbellekKaydi> };
const ONBELLEK = (G.__vayraOturumOnbellek ??= new Map());
const onbellekDusur = (oz: string) => ONBELLEK.delete(oz);
export function hesapOnbelleginiDusur(uid: string) { for (const [k, v] of ONBELLEK) if (v.uid === uid) ONBELLEK.delete(k); }

/* ── Aç, oku, kapat ── */

/** Yeni oturum açar; hesabın oturum listesine yazar (en çok 20, en eskisi düşer). Çerez değerini döndürür. */
export async function oturumAc(req: Request, uid: string, yontem: string): Promise<{ cerez: string; oturum: OturumKaydi } | null> {
  const belirtec = randomBytes(32).toString("base64url");
  const oz = belirtecOzeti(belirtec);
  const c = cihazOku(req.headers.get("user-agent"));
  const simdi = Date.now();
  const o: OturumKaydi = { id: yeniKimlik("ss"), ozet: oz, olusturma: simdi, sonGorulme: simdi, bitis: simdi + OTURUM_SURESI, tarayici: c.tarayici, isletim: c.isletim, tur: c.tur, ip: istemciIp(req), yontem };
  if ((await hesapOku(uid))?.askida) return null;
  const r = await hesapGuncelle(uid, async (h) => {
    const yeniCihaz = !h.oturumlar.some((x) => x.tarayici === c.tarayici && x.isletim === c.isletim) && h.olaylar.some((x) => x.tur === "giris");
    const dusen = h.oturumlar.filter((x) => x.bitis < simdi);
    h.oturumlar = [o, ...h.oturumlar.filter((x) => x.bitis >= simdi)];
    while (h.oturumlar.length > 20) dusen.push(h.oturumlar.pop()!);
    for (const d of dusen) { await sil(oturumDosyasi(d.ozet)); onbellekDusur(d.ozet); }
    await jsonYaz(oturumDosyasi(oz), { uid, id: o.id, bitis: o.bitis });
    olayEkle(h, "giris", `${c.tarayici} · ${c.isletim}`, yontem, o.ip);
    return yeniCihaz && h.tercih?.yeniGirisEposta !== false ? h.email : null;
  });
  if (!r) return null;
  // Yeni cihazdan giriş bildirimi (e-posta servisi kuruluysa; tercih Ayarlar, Güvenlik'te).
  if (r.sonuc) bildirimGonder(r.sonuc, "Vayra hesabına yeni bir cihazdan girildi", `${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })} tarihinde ${c.tarayici}, ${c.isletim} ile (${ipGizle(o.ip)}) hesabına giriş yapıldı. Bu sen değilsen Ayarlar, Güvenlik bölümünden oturumu kapat ve şifreni değiştir.`);
  return { cerez: oturumCerezi(belirtec, o.bitis), oturum: o };
}

export interface GecerliOturum { hesap: HesapKaydi; oturum: OturumKaydi; belirtecOzeti: string }

/** Çerezdeki oturumu doğrular. Geçersizse null. Son görülme beş dakikada bir güncellenir. */
export async function oturumOku(req: Request): Promise<GecerliOturum | null> {
  const b = cerezOku(req, OTURUM_CEREZI);
  if (!b || !BICIM.test(b)) return null;
  const oz = belirtecOzeti(b);
  const dizin = await jsonOku<{ uid: string; id: string; bitis: number }>(oturumDosyasi(oz));
  if (!dizin || dizin.bitis < Date.now()) { if (dizin) await sil(oturumDosyasi(oz)); onbellekDusur(oz); return null; }
  let hesap = await hesapOku(dizin.uid);
  const oturum = hesap?.oturumlar.find((o) => o.id === dizin.id && o.ozet === oz);
  if (!hesap || !oturum) { await sil(oturumDosyasi(oz)); onbellekDusur(oz); return null; }
  // Askıya alınmış hesap: oturum kaydı silinmez (askı kalkınca kullanıcı yeniden girer), ama geçerli sayılmaz.
  if (hesap.askida) { onbellekDusur(oz); return null; }
  ONBELLEK.set(oz, { uid: dizin.uid, id: dizin.id, bitis: dizin.bitis, zaman: Date.now() });
  if (Date.now() - oturum.sonGorulme > SON_GORULME_ARALIGI) {
    const ip = istemciIp(req);
    const r = await hesapGuncelle(dizin.uid, (h) => { const x = h.oturumlar.find((o) => o.id === dizin.id); if (x) { x.sonGorulme = Date.now(); x.ip = ip; } });
    if (r) hesap = r.hesap;
  }
  return { hesap: hesap!, oturum: hesap!.oturumlar.find((o) => o.id === dizin.id) ?? oturum, belirtecOzeti: oz };
}

/** Eşzamanlı doğrulama (yalnız uid ve oturum kimliği). Disk okuması 30 sn önbellekle. */
export function oturumOkuSync(req: Request): { uid: string; id: string } | null {
  const b = cerezOku(req, OTURUM_CEREZI);
  if (!b || !BICIM.test(b)) return null;
  const oz = belirtecOzeti(b);
  const simdi = Date.now();
  const o = ONBELLEK.get(oz);
  if (o && o.zaman > simdi - ONBELLEK_SURESI) return o.bitis > simdi ? { uid: o.uid, id: o.id } : null;
  const dizin = jsonOkuSync<{ uid: string; id: string; bitis: number }>(oturumDosyasi(oz));
  if (!dizin || dizin.bitis < simdi) { ONBELLEK.delete(oz); return null; }
  const h = hesapOkuSync(dizin.uid);
  if (!h?.oturumlar.some((x) => x.id === dizin.id && x.ozet === oz) || h.askida) { ONBELLEK.delete(oz); return null; }
  ONBELLEK.set(oz, { uid: dizin.uid, id: dizin.id, bitis: dizin.bitis, zaman: simdi });
  return { uid: dizin.uid, id: dizin.id };
}

/** Hesabın oturum(lar)ını kapatır. haric verilirse o oturum kalır. Kapatılan sayıyı döndürür. */
export async function oturumlariKapat(uid: string, secim: { id?: string; haric?: string; hepsi?: boolean }, olay?: { cihaz: string; ayrinti?: string }): Promise<number> {
  const r = await hesapGuncelle(uid, async (h) => {
    const kapat = h.oturumlar.filter((o) => (secim.id ? o.id === secim.id : secim.hepsi ? true : o.id !== secim.haric));
    for (const o of kapat) { await sil(oturumDosyasi(o.ozet)); onbellekDusur(o.ozet); }
    h.oturumlar = h.oturumlar.filter((o) => !kapat.includes(o));
    if (olay && kapat.length) olayEkle(h, "oturum-kapat", olay.cihaz, olay.ayrinti ?? `${kapat.length} oturum`);
    return kapat.length;
  });
  return r?.sonuc ?? 0;
}

/** Hesap silinirken: bütün oturum dizin dosyaları. */
export async function oturumDizinleriniSil(h: HesapKaydi) {
  for (const o of h.oturumlar) { await sil(oturumDosyasi(o.ozet)); onbellekDusur(o.ozet); }
  hesapOnbelleginiDusur(h.uid);
}

export function oturumBilgileri(h: HesapKaydi, buId: string): OturumBilgisi[] {
  const simdi = Date.now();
  return h.oturumlar.filter((o) => o.bitis > simdi).map((o) => ({
    id: o.id, tarayici: o.tarayici, isletim: o.isletim, tur: o.tur, baslangic: o.olusturma, sonGorulme: o.sonGorulme, yontem: o.yontem, ip: ipGizle(o.ip), bu: o.id === buId,
  }));
}
