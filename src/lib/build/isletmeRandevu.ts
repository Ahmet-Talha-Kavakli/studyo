import "server-only";
import { randomBytes } from "crypto";
import { projeOkuHam } from "./depo";
import { epostaGonder, epostaKurulu } from "./bulutEposta";
import { gunlukYaz } from "./gunluk";
import { isletmeOku, listeDegistir, listeOku } from "./isletme";
import { dilimSaat, dilimTarih, dilimYaz, dilimZaman, tarihGunu } from "./bolge";
import { siteAdresi } from "./isletmeMagaza";
import { eposta as epostaTemizle, isletmePara, metin, nesne, telefon, type Calisan, type GunSaat, type Hizmet, type IsletmeVeri, type Randevu, type RandevuAyar, type RandevuDurum } from "./isletmeTipler";

/**
 * Vayra İşletme randevu sistemi (Wix Bookings, Squarespace Scheduling, Hostinger randevu karşılığı): hizmetler,
 * çalışanlar, haftalık saatler, izin ve kapalı günler, tampon süre, en az önceden ve en çok ileri sınırı, grup kapasitesi.
 * Müsait saatler ve çakışma denetimi sunucuda, kayıt kilidinin içinde yapılır (aynı saate iki randevu düşmez).
 * Saatler işletmenin saat diliminde (profil.saatDilimi, yaz saati dahil) hesaplanır. Müşteri e-postadaki bağlantıyla randevusunu görür, iptal eder, takvimine ekler.
 */
export class RandevuHata extends Error { constructor(m: string, public durum = 400) { super(m); } }

const ISLETME = "_isletme";
const dk = 60_000;
const saatDk = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
/** Randevu ayarındaki saat dilimi (isletmeTamamla profilden doldurur). */
const tzAl = (a: RandevuAyar) => a.saatDilimi || "UTC";
/** İşletmenin saat diliminde okunur tarih ve saat ("12 Mart 2026 Perşembe 14:30"). */
export const randevuZamanYaz = (v: Pick<IsletmeVeri, "profil">, z: number) => dilimYaz(z, v.profil.saatDilimi || "UTC");

/** Hizmeti verebilen etkin çalışanlar; çalışan tanımlı değilse işletmenin kendisi (tek kaynak). */
export function hizmetCalisanlari(a: RandevuAyar, h: Hizmet): Calisan[] {
  const aktif = a.calisanlar.filter((c) => c.aktif);
  if (!aktif.length) return [{ id: ISLETME, ad: "", unvan: "", gorsel: "", eposta: "", ozelSaat: false, saatler: a.saatler, izinler: [], aktif: true }];
  const l = h.calisanlar.length ? aktif.filter((c) => h.calisanlar.includes(c.id)) : aktif;
  return l;
}
function gunSaati(a: RandevuAyar, c: Calisan, tarih: string): GunSaat | null {
  if (a.kapaliGunler.includes(tarih) || c.izinler.includes(tarih)) return null;
  const g = (c.ozelSaat ? c.saatler : a.saatler)[tarihGunu(tarih)];
  return g?.acik ? g : null;
}
const mesgul = (r: Randevu, tampon: number) => r.durum !== "iptal" && r.durum !== "gelmedi" ? [r.bas, r.bit + tampon * dk] as const : null;

/** Bir çalışan için o günün boş başlangıç saatleri (epoch ms). */
function calisanSaatleri(a: RandevuAyar, h: Hizmet, c: Calisan, tarih: string, l: Randevu[], simdi: number, sahip = false): number[] {
  const g = gunSaati(a, c, tarih);
  if (!g) return [];
  const bas = saatDk(g.bas), bit = saatDk(g.bit);
  const mola = g.molaBas && g.molaBit ? [saatDk(g.molaBas), saatDk(g.molaBit)] : null;
  const enErken = sahip ? simdi : simdi + a.enAzOnce * dk, enGec = simdi + a.enCokIleri * 864e5;
  const tz = tzAl(a);
  const benim = l.filter((r) => r.calisanId === c.id && dilimTarih(r.bas, tz) === tarih);
  const o: number[] = [];
  for (let t = bas; t + h.sure <= bit; t += a.adim) {
    if (mola && t < mola[1] && t + h.sure > mola[0]) continue;
    const z = dilimZaman(tarih, `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`, tz);
    if (z < enErken || (!sahip && z > enGec)) continue;
    const son = z + (h.sure + h.tampon) * dk;
    let cakisan = 0, baska = false;
    for (const r of benim) {
      const m = mesgul(r, r.hizmetId === h.id ? h.tampon : a.hizmetler.find((x) => x.id === r.hizmetId)?.tampon ?? 0);
      if (!m || !(z < m[1] && son > m[0])) continue;
      if (r.hizmetId === h.id && r.bas === z && h.kapasite > 1) cakisan++; else baska = true;
    }
    if (baska || cakisan >= h.kapasite) continue;
    o.push(z);
  }
  return o;
}

export type MusaitSaat = { bas: number; saat: string; calisanlar: string[] };
/** Bir gün için müsait saatler; calisanId boşsa hizmeti veren herkesin saatleri birleşir. */
export function musaitSaatler(a: RandevuAyar, hizmetId: string, calisanId: string, tarih: string, l: Randevu[], simdi = Date.now(), sahip = false): MusaitSaat[] {
  const h = a.hizmetler.find((x) => x.id === hizmetId && x.aktif);
  if (!h || !/^\d{4}-\d{2}-\d{2}$/.test(tarih)) return [];
  const cl = hizmetCalisanlari(a, h).filter((c) => !calisanId || c.id === calisanId);
  const harita = new Map<number, string[]>();
  for (const c of cl) for (const z of calisanSaatleri(a, h, c, tarih, l, simdi, sahip)) harita.set(z, [...(harita.get(z) ?? []), c.id]);
  return [...harita.entries()].sort((x, y) => x[0] - y[0]).map(([bas, c]) => ({ bas, saat: dilimSaat(bas, tzAl(a)), calisanlar: c }));
}
/** Önümüzdeki günlerin müsaitlik özeti (takvimde boş günleri soluk göstermek için). */
export function musaitGunler(a: RandevuAyar, hizmetId: string, calisanId: string, l: Randevu[], gunSayisi = 42, simdi = Date.now()): { tarih: string; adet: number }[] {
  const o: { tarih: string; adet: number }[] = [];
  const tz = tzAl(a), bugun = dilimTarih(simdi, tz);
  for (let i = 0; i < Math.min(gunSayisi, a.enCokIleri + 1); i++) {
    const t = dilimTarih(dilimZaman(bugun, "12:00", tz) + i * 864e5, tz);
    o.push({ tarih: t, adet: musaitSaatler(a, hizmetId, calisanId, t, l, simdi).length });
  }
  return o;
}

/** Sitenin gördüğü randevu ayarları (çalışan e-postası ve izin günleri gitmez). */
export function randevuGenel(v: IsletmeVeri) {
  const a = v.randevu;
  return {
    acik: a.acik, isletme: v.profil.ad, saatDilimi: v.profil.saatDilimi, paraBirimi: v.magaza.paraBirimi, yerel: v.profil.yerel, adim: a.adim, enCokIleri: a.enCokIleri, iptalSaat: a.iptalSaat, onay: a.onay,
    hizmetler: a.hizmetler.filter((h) => h.aktif).map((h) => ({ id: h.id, ad: h.ad, aciklama: h.aciklama, sure: h.sure, fiyat: h.fiyat, kapasite: h.kapasite, calisanlar: hizmetCalisanlari(a, h).filter((c) => c.id !== ISLETME).map((c) => c.id) })),
    calisanlar: a.calisanlar.filter((c) => c.aktif).map((c) => ({ id: c.id, ad: c.ad, unvan: c.unvan, gorsel: c.gorsel })),
  };
}

const kodUret = () => randomBytes(15).toString("base64url");
export const kodGecerli = (k: string) => /^[A-Za-z0-9_-]{20}$/.test(k);

/**
 * Randevu oluşturur. Saat kilit içinde yeniden denetlenir. kaynak "panel" ise sahip en az önceden sınırına bağlı değildir
 * ve isterse müsaitlik dışına da yazabilir (zorla).
 */
export async function randevuOlustur(id: string, g: unknown, s: { kaynak: "site" | "panel"; zorla?: boolean; ip?: string }): Promise<Randevu> {
  const v = await isletmeOku(id);
  const a = v.randevu;
  if (!a.acik && s.kaynak === "site") throw new RandevuHata("Bu sitede çevrim içi randevu kapalı.", 409);
  const o = nesne(g);
  const h = a.hizmetler.find((x) => x.id === o.hizmet && x.aktif);
  if (!h) throw new RandevuHata("Hizmet bulunamadı.");
  const basMetin = String(o.bas ?? "");
  const bas = typeof o.bas === "number" ? o.bas : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(basMetin) ? dilimZaman(basMetin.slice(0, 10), basMetin.slice(11, 16), tzAl(a)) : Date.parse(basMetin);
  if (!Number.isFinite(bas)) throw new RandevuHata("Randevu saati geçersiz.");
  const ad = metin(o.ad, 80), ep = epostaTemizle(o.eposta), tel = telefon(o.telefon);
  if (!ad) throw new RandevuHata("Ad soyad gerekli.");
  if (!ep && s.kaynak === "site") throw new RandevuHata("Geçerli bir e-posta adresi gerekli.");
  if (s.kaynak === "site" && tel.replace(/\D/g, "").length < 10) throw new RandevuHata("Geçerli bir telefon numarası gerekli.");
  const istenen = typeof o.calisan === "string" ? o.calisan : "";
  const tarih = dilimTarih(bas, tzAl(a));
  const r = await listeDegistir<Randevu, Randevu>(id, "randevular", (l) => {
    // Aynı kişiden aynı saate ikinci randevu (çift tıklama) gelmesin.
    if (ep && l.some((x) => x.eposta === ep && x.bas === bas && x.hizmetId === h.id && x.durum !== "iptal")) throw new RandevuHata("Bu saat için randevun zaten var.", 409);
    const saatler = musaitSaatler(a, h.id, istenen, tarih, l, Date.now(), s.kaynak === "panel");
    const uygun = saatler.find((x) => x.bas === bas);
    const cl = hizmetCalisanlari(a, h);
    let calisan: Calisan | undefined;
    if (uygun) calisan = cl.find((c) => c.id === (istenen && uygun.calisanlar.includes(istenen) ? istenen : uygun.calisanlar[0]));
    else if (s.kaynak === "panel" && s.zorla) calisan = cl.find((c) => c.id === istenen) ?? cl[0];
    if (!calisan) throw new RandevuHata("Bu saat artık müsait değil; başka bir saat seç.", 409);
    const z = Date.now();
    const y: Randevu = {
      id: kodUret().slice(0, 12), hizmetId: h.id, hizmetAd: h.ad, calisanId: calisan.id, calisanAd: calisan.ad, bas, bit: bas + h.sure * dk, sure: h.sure, fiyat: h.fiyat,
      ad, eposta: ep, telefon: tel, not: metin(o.not, 600, true), durum: s.kaynak === "panel" || a.onay === "otomatik" ? "onaylandi" : "bekliyor", kod: kodUret(), kaynak: s.kaynak,
      olusturma: z, guncelleme: z, gecmis: [{ z, olay: s.kaynak === "panel" ? "Panelden eklendi" : "Siteden alındı" }],
    };
    if (l.filter((x) => x.bas > z).length >= 4000) throw new RandevuHata("Randevu sınırına ulaşıldı.", 507);
    l.push(y);
    return y;
  }, 8000);
  gunlukYaz(id, { t: "veri", d: 200, y: "/isletme/randevu", m: `Randevu: ${r.hizmetAd}, ${randevuZamanYaz(v, r.bas)}${r.kaynak === "site" ? " (siteden)" : ""}` });
  return r;
}

/** Randevu e-postaları: müşteriye onay ya da talep alındı, sahibe bildirim. Servis yoksa false döner (sahte gönderim yok). */
export async function randevuEpostalari(id: string, r: Randevu, koken: string, olay: "yeni" | "onay" | "iptal" | "hatirlatma" | "degisti"): Promise<boolean> {
  if (!epostaKurulu()) return false;
  const p = await projeOkuHam(id);
  const v = await isletmeOku(id);
  if (!p) return false;
  const site = v.profil.ad || p.ad;
  const trYaz = (z: number) => randevuZamanYaz(v, z), tl = isletmePara(v);
  const yonet = `${koken}/api/build/isletme-genel/${id}/randevu/yonet/${r.kod}`;
  const ayrinti = `${r.hizmetAd}${r.calisanAd ? `, ${r.calisanAd}` : ""}\n${trYaz(r.bas)} (${r.sure} dakika)${r.fiyat ? `\nÜcret: ${tl(r.fiyat)}` : ""}${v.profil.adres.sokak && !v.profil.adresGizli ? `\nAdres: ${[v.profil.adres.sokak, v.profil.adres.ilce, v.profil.adres.il].filter(Boolean).join(", ")}` : ""}`;
  const marka = { ...(v.profil.logo ? { logo: v.profil.logo } : {}), altYazi: [site, v.profil.telefon].filter(Boolean).join(" · ") };
  const konu: Record<typeof olay, string> = {
    yeni: r.durum === "onaylandi" ? `Randevun onaylandı: ${trYaz(r.bas)}` : "Randevu talebin alındı", onay: `Randevun onaylandı: ${trYaz(r.bas)}`,
    iptal: "Randevun iptal edildi", hatirlatma: `Hatırlatma: randevun ${trYaz(r.bas)}`, degisti: `Randevun güncellendi: ${trYaz(r.bas)}`,
  };
  const giris: Record<typeof olay, string> = {
    yeni: r.durum === "onaylandi" ? "Randevun oluşturuldu." : "Randevu talebini aldık; onaylandığında ayrıca haber vereceğiz.", onay: "Randevun onaylandı.",
    iptal: "Randevun iptal edildi.", hatirlatma: "Yaklaşan randevunu hatırlatmak istedik.", degisti: "Randevunun saati güncellendi.",
  };
  let ok = false;
  if (r.eposta) {
    const x = await epostaGonder({ projeId: id, kime: r.eposta, konu: konu[olay], metin: `Merhaba ${r.ad},\n\n${giris[olay]}\n\n${ayrinti}${olay !== "iptal" && v.randevu.iptalSaat ? `\n\nGelemeyeceksen randevudan en geç ${v.randevu.iptalSaat} saat önce iptal edebilirsin.` : ""}`, dugme: olay === "iptal" ? undefined : { ad: "Randevumu görüntüle", adres: yonet }, site, marka });
    ok = x.ok;
  }
  if (olay === "yeni" || olay === "iptal") {
    const sahipler = [v.randevu.sahipEposta || v.profil.eposta, v.randevu.calisanlar.find((c) => c.id === r.calisanId)?.eposta].filter((x): x is string => !!x);
    for (const k of [...new Set(sahipler)]) await epostaGonder({ kime: k, konu: olay === "yeni" ? `Yeni randevu: ${r.ad}, ${trYaz(r.bas)}` : `Randevu iptal edildi: ${r.ad}`, metin: `${olay === "yeni" ? "Siteden yeni bir randevu geldi" : "Müşteri randevusunu iptal etti"}.\n\n${ayrinti}\nMüşteri: ${r.ad}, ${r.telefon || "telefon yok"}, ${r.eposta || "e-posta yok"}${r.not ? `\nNot: ${r.not}` : ""}${r.durum === "bekliyor" ? "\n\nBu randevu onayını bekliyor; Vayra Build'de İşletme sekmesinin Takvim bölümünden onayla." : ""}` }).catch(() => {});
  }
  return ok;
}

/** Sahibin ya da müşterinin durum değişikliği. */
export async function randevuDurumu(id: string, randevuId: string, durum: RandevuDurum, neden = ""): Promise<{ r: Randevu; onceki: RandevuDurum }> {
  return listeDegistir<Randevu, { r: Randevu; onceki: RandevuDurum }>(id, "randevular", (l) => {
    const r = l.find((x) => x.id === randevuId);
    if (!r) throw new RandevuHata("Randevu bulunamadı.", 404);
    const onceki = r.durum;
    if (onceki !== durum) {
      r.durum = durum; r.guncelleme = Date.now();
      if (durum === "iptal" && neden) r.iptalNeden = metin(neden, 200);
      r.gecmis = [...r.gecmis, { z: Date.now(), olay: `Durum: ${durum}${neden ? ` (${metin(neden, 120)})` : ""}` }].slice(-30);
    }
    return { r: { ...r }, onceki };
  }, 8000);
}
/** Saati taşır (sahip): yeni saat müsait olmalı ya da zorla. */
export async function randevuTasi(id: string, randevuId: string, yeniBas: number, zorla: boolean): Promise<Randevu> {
  const v = await isletmeOku(id);
  return listeDegistir<Randevu, Randevu>(id, "randevular", (l) => {
    const r = l.find((x) => x.id === randevuId);
    if (!r) throw new RandevuHata("Randevu bulunamadı.", 404);
    const digerleri = l.filter((x) => x.id !== randevuId);
    const uygun = musaitSaatler(v.randevu, r.hizmetId, r.calisanId === ISLETME ? "" : r.calisanId, dilimTarih(yeniBas, tzAl(v.randevu)), digerleri, Date.now(), true).some((x) => x.bas === yeniBas);
    if (!uygun && !zorla) throw new RandevuHata("Bu saat müsait değil. Yine de taşımak için zorla seçeneğini kullan.", 409);
    r.gecmis = [...r.gecmis, { z: Date.now(), olay: `Taşındı: ${randevuZamanYaz(v, r.bas)} yerine ${randevuZamanYaz(v, yeniBas)}` }].slice(-30);
    r.bas = yeniBas; r.bit = yeniBas + r.sure * dk; r.guncelleme = Date.now(); delete r.hatirlatildi;
    return { ...r };
  }, 8000);
}

/** ICS (iCalendar) metni: tek randevu ya da takvim aboneliği. */
const icsTarih = (z: number) => new Date(z).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsKacir = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
export function icsUret(v: IsletmeVeri, l: Randevu[], ad: string): string {
  const yer = v.profil.adresGizli ? "" : [v.profil.adres.sokak, v.profil.adres.ilce, v.profil.adres.il].filter(Boolean).join(", ");
  const satir = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Vayra Build//Isletme//TR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${icsKacir(ad)}`, `X-WR-TIMEZONE:${v.profil.saatDilimi || "UTC"}`];
  for (const r of l) {
    satir.push("BEGIN:VEVENT", `UID:${r.id}@vayra-build`, `DTSTAMP:${icsTarih(r.guncelleme)}`, `DTSTART:${icsTarih(r.bas)}`, `DTEND:${icsTarih(r.bit)}`,
      `SUMMARY:${icsKacir(`${r.hizmetAd}${r.ad ? `: ${r.ad}` : ""}`)}`, `DESCRIPTION:${icsKacir([r.calisanAd && `Çalışan: ${r.calisanAd}`, r.telefon && `Telefon: ${r.telefon}`, r.not && `Not: ${r.not}`].filter(Boolean).join("\n"))}`,
      ...(yer ? [`LOCATION:${icsKacir(yer)}`] : []), `STATUS:${r.durum === "iptal" ? "CANCELLED" : r.durum === "bekliyor" ? "TENTATIVE" : "CONFIRMED"}`, "END:VEVENT");
  }
  satir.push("END:VCALENDAR");
  return satir.join("\r\n") + "\r\n";
}

/** Zamanlayıcı: yaklaşan randevulara hatırlatma e-postası (bir kez). */
export async function hatirlatmalariGonder(id: string, koken: string): Promise<number> {
  const v = await isletmeOku(id);
  if (!v.randevu.hatirlatma.acik || !epostaKurulu()) return 0;
  const simdi = Date.now(), pencere = v.randevu.hatirlatma.saat * 3600_000;
  const l = (await listeOku<Randevu>(id, "randevular")).filter((r) => !r.hatirlatildi && r.eposta && (r.durum === "onaylandi") && r.bas > simdi && r.bas - simdi <= pencere && r.olusturma < r.bas - 3600_000);
  let n = 0;
  for (const r of l.slice(0, 50)) {
    // Önce işaretle: e-posta servisi yavaşken aynı randevuya iki kez gitmesin.
    const isaret = await listeDegistir<Randevu, boolean>(id, "randevular", (x) => { const y = x.find((k) => k.id === r.id); if (!y || y.hatirlatildi) return false; y.hatirlatildi = Date.now(); return true; }, 8000);
    if (isaret && (await randevuEpostalari(id, r, koken, "hatirlatma").catch(() => false))) n++;
  }
  return n;
}

export { ISLETME as ISLETME_KAYNAGI, siteAdresi };
