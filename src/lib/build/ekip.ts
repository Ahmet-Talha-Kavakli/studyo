import "server-only";
import { projeErisimi, projeOkuHam, sahipOzeti } from "./depo";
import {
  DAVET_SINIRI, UYE_SINIRI, davetKodundanProje, davetKoduUret, ekipGuncelle, ekipOku, genelKimlik, uyeDizinineEkle, uyeDizinindenCikar,
  type EkipDavet, type EkipKaydi,
} from "./ekipDepo";
import { DAVET_SURE_SINIRI, adTemizle, type DavetHataKodu, type DavetOnizleme, type EkipBilgisi, type EkipDavetGorunum, type EkipKisi } from "./ekipOrtak";
import type { EkipRol, ProjeErisim } from "./tipler";

/**
 * Ekip işlemleri (rotalar bunları çağırır). Yalnız sahip: davet, rol, çıkarma, davet iptali. Üye: ayrılma.
 * Herkes (ekipte olan): kendi görünen adını güncelleme.
 */
export class EkipHatasi extends Error {
  constructor(mesaj: string, public durum = 400, public kod?: DavetHataKodu | "uye" | "sahip") { super(mesaj); }
}

const rolGecerli = (r: unknown): r is EkipRol => r === "duzenleyici" || r === "izleyici";

async function erisimGerekli(projeId: string, sahip: string): Promise<ProjeErisim> {
  const e = await projeErisimi(projeId, sahip);
  if (!e) throw new EkipHatasi("Proje bulunamadı.", 404);
  return e;
}
async function sahipGerekli(projeId: string, sahip: string) {
  const e = await erisimGerekli(projeId, sahip);
  if (e !== "sahip") throw new EkipHatasi("Ekibi yalnız proje sahibi yönetebilir.", 403);
}

const davetGorunum = (d: EkipDavet): EkipDavetGorunum => ({ kod: d.kod, rol: d.rol, olusturma: d.olusturma, sonKullanma: d.sonKullanma, ...(d.tekKullanim ? { tekKullanim: true } : {}), ...(d.kullanildi ? { kullanildi: true } : {}), ...(d.kullanim ? { kullanim: d.kullanim } : {}) });
const davetAcik = (d: EkipDavet, simdi = Date.now()) => d.sonKullanma > simdi && !(d.tekKullanim && d.kullanildi);

function bilgi(e: EkipKaydi, rol: ProjeErisim, oz: string, sahipOz: string): EkipBilgisi {
  const sen = genelKimlik(oz);
  const sahip: EkipKisi = { oz: genelKimlik(sahipOz), ad: e.sahipAd || "Proje sahibi", rol: "sahip", ...(rol === "sahip" ? { sen: true } : {}) };
  const uyeler: EkipKisi[] = e.uyeler.map((u) => ({ oz: genelKimlik(u.oz), ad: u.ad || "Ekip üyesi", rol: u.rol, eklenme: u.eklenme, ...(u.oz === oz ? { sen: true } : {}) }));
  return { rol, sen, sahip, uyeler, ...(rol === "sahip" ? { davetler: e.davetler.filter((d) => davetAcik(d)).sort((a, b) => b.olusturma - a.olusturma).map(davetGorunum) } : {}) };
}

/** Ekip: sahip ve üyeler; bekleyen davetler yalnız sahibe. */
export async function ekipBilgisi(projeId: string, sahip: string): Promise<EkipBilgisi> {
  const rol = await erisimGerekli(projeId, sahip);
  const p = await projeOkuHam(projeId);
  if (!p) throw new EkipHatasi("Proje bulunamadı.", 404);
  return bilgi(await ekipOku(projeId), rol, sahipOzeti(sahip), p.sahip);
}

/** Davet bağlantısı oluşturur (en çok 20 açık davet). Süre gün olarak 1 ile 90 arasında; varsayılan 7. */
export async function davetOlustur(projeId: string, sahip: string, g: { rol?: unknown; tekKullanim?: unknown; gun?: unknown }): Promise<EkipDavetGorunum> {
  await sahipGerekli(projeId, sahip);
  if (!rolGecerli(g.rol)) throw new EkipHatasi("Rol Düzenleyici ya da İzleyici olmalı.");
  const gun = g.gun === undefined ? 7 : Number(g.gun);
  if (!Number.isFinite(gun) || gun < 1 || gun > DAVET_SURE_SINIRI) throw new EkipHatasi(`Davet süresi 1 ile ${DAVET_SURE_SINIRI} gün arasında olmalı.`);
  const rol = g.rol;
  return ekipGuncelle(projeId, (e) => {
    if (e.davetler.filter((d) => davetAcik(d)).length >= DAVET_SINIRI) throw new EkipHatasi(`En çok ${DAVET_SINIRI} açık davet olabilir. Kullanılmayanları iptal et.`, 409);
    const d: EkipDavet = { kod: davetKoduUret(projeId), rol, olusturma: Date.now(), sonKullanma: Date.now() + Math.round(gun * 24) * 3_600_000, ...(g.tekKullanim === true ? { tekKullanim: true } : {}) };
    e.davetler.push(d);
    return davetGorunum(d);
  });
}

export async function davetSil(projeId: string, sahip: string, kod: unknown) {
  await sahipGerekli(projeId, sahip);
  await ekipGuncelle(projeId, (e) => {
    const n = e.davetler.length;
    e.davetler = e.davetler.filter((d) => d.kod !== kod);
    if (e.davetler.length === n) throw new EkipHatasi("Davet bulunamadı.", 404);
  });
}

export async function rolDegistir(projeId: string, sahip: string, kimlik: unknown, rol: unknown) {
  await sahipGerekli(projeId, sahip);
  if (!rolGecerli(rol)) throw new EkipHatasi("Rol Düzenleyici ya da İzleyici olmalı.");
  await ekipGuncelle(projeId, (e) => {
    const u = e.uyeler.find((x) => genelKimlik(x.oz) === kimlik);
    if (!u) throw new EkipHatasi("Bu kişi ekipte değil.", 404);
    u.rol = rol;
  });
}

export async function uyeCikar(projeId: string, sahip: string, kimlik: unknown) {
  await sahipGerekli(projeId, sahip);
  const oz = await ekipGuncelle(projeId, (e) => {
    const u = e.uyeler.find((x) => genelKimlik(x.oz) === kimlik);
    if (!u) throw new EkipHatasi("Bu kişi ekipte değil.", 404);
    e.uyeler = e.uyeler.filter((x) => x !== u);
    return u.oz;
  });
  await uyeDizinindenCikar(oz, projeId);
}

/** Üye kendi isteğiyle ayrılır (sahip ayrılamaz; projeyi silebilir). */
export async function ekiptenAyril(projeId: string, sahip: string) {
  const rol = await erisimGerekli(projeId, sahip);
  if (rol === "sahip") throw new EkipHatasi("Sahip ekipten ayrılamaz. Projeyi istemiyorsan silebilirsin.", 409);
  const oz = sahipOzeti(sahip);
  await ekipGuncelle(projeId, (e) => { e.uyeler = e.uyeler.filter((x) => x.oz !== oz); });
  await uyeDizinindenCikar(oz, projeId);
}

/** Kendi görünen adını günceller (sahip ya da üye). Değişmediyse yazmaz. */
export async function adGuncelle(projeId: string, sahip: string, ad: unknown) {
  const temiz = adTemizle(ad);
  if (!temiz) return;
  const rol = await erisimGerekli(projeId, sahip);
  const oz = sahipOzeti(sahip);
  const e = await ekipOku(projeId);
  if (rol === "sahip" ? e.sahipAd === temiz : e.uyeler.find((x) => x.oz === oz)?.ad === temiz) return;
  await ekipGuncelle(projeId, (x) => {
    if (rol === "sahip") x.sahipAd = temiz;
    else { const u = x.uyeler.find((y) => y.oz === oz); if (u) u.ad = temiz; }
  });
}

/* ── Davet bağlantısı (davet edilen taraf) ── */
async function davetBul(kod: string) {
  const projeId = davetKodundanProje(kod);
  const gecersiz = () => new EkipHatasi("Bu davet bağlantısı geçersiz ya da iptal edilmiş. Proje sahibinden yeni bir bağlantı iste.", 404, "gecersiz");
  if (!projeId) throw gecersiz();
  const [p, e] = await Promise.all([projeOkuHam(projeId), ekipOku(projeId)]);
  const d = e.davetler.find((x) => x.kod === kod);
  if (!p || !d) throw gecersiz();
  return { p, e, d };
}

/** Davet önizlemesi: proje adı, kapak, sahibin adı, rol. Süresi dolmuş ya da kullanılmışsa açık hata. */
export async function davetOnizle(kod: string, sahip: string | null): Promise<DavetOnizleme> {
  const { p, e, d } = await davetBul(kod);
  const oz = sahip ? sahipOzeti(sahip) : null;
  const durum = oz && p.sahip === oz ? "sahip" : oz && e.uyeler.some((u) => u.oz === oz) ? "uye" : "gecerli";
  if (durum === "gecerli") {
    if (d.sonKullanma <= Date.now()) throw new EkipHatasi("Bu davetin süresi dolmuş. Proje sahibinden yeni bir bağlantı iste.", 410, "suresi-doldu");
    if (d.tekKullanim && d.kullanildi) throw new EkipHatasi("Bu tek kullanımlık davet zaten kullanılmış. Proje sahibinden yeni bir bağlantı iste.", 410, "kullanildi");
  }
  return { proje: { id: p.id, ad: p.ad, tur: p.tur, ...(p.kapak ? { kapak: p.kapak } : {}) }, sahipAd: e.sahipAd || "Proje sahibi", rol: d.rol, sonKullanma: d.sonKullanma, ...(d.tekKullanim ? { tekKullanim: true } : {}), durum, uyeSayisi: e.uyeler.length };
}

/** Davetle ekibe katılır. Sahip kendi davetine katılamaz; zaten üyeyse hata (kod "uye"). */
export async function davetKatil(kod: string, sahip: string, ad: unknown): Promise<{ projeId: string; rol: EkipRol }> {
  const { p } = await davetBul(kod);
  const oz = sahipOzeti(sahip);
  if (p.sahip === oz) throw new EkipHatasi("Bu senin projen; davete gerek yok.", 409, "sahip");
  const temiz = adTemizle(ad) || "Ekip üyesi";
  const rol = await ekipGuncelle(p.id, (e) => {
    const d = e.davetler.find((x) => x.kod === kod);
    if (!d) throw new EkipHatasi("Bu davet bağlantısı geçersiz ya da iptal edilmiş.", 404, "gecersiz");
    if (e.uyeler.some((u) => u.oz === oz)) throw new EkipHatasi("Zaten bu projenin ekibindesin.", 409, "uye");
    if (d.sonKullanma <= Date.now()) throw new EkipHatasi("Bu davetin süresi dolmuş. Proje sahibinden yeni bir bağlantı iste.", 410, "suresi-doldu");
    if (d.tekKullanim && d.kullanildi) throw new EkipHatasi("Bu tek kullanımlık davet zaten kullanılmış.", 410, "kullanildi");
    if (e.uyeler.length >= UYE_SINIRI) throw new EkipHatasi(`Bir projede en çok ${UYE_SINIRI} ekip üyesi olabilir.`, 409);
    e.uyeler.push({ oz, ad: temiz, rol: d.rol, eklenme: Date.now(), davetEden: genelKimlik(p.sahip) });
    d.kullanim = (d.kullanim ?? 0) + 1;
    if (d.tekKullanim) d.kullanildi = true;
    return d.rol;
  });
  await uyeDizinineEkle(oz, p.id);
  return { projeId: p.id, rol };
}
