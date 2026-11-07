import "server-only";
import { ajanGuncelleOz, ajanHam, surumAyarTamamla, type Ajan, type KademeAyar, type SurumAyar, type yayindakiAjan } from "./ajanDepo";
import { konusmalariOku, type ZiyaretciKonusma } from "./ziyaretciDepo";

/**
 * Ortamlar ve kademeli yayın (Voiceflow Environments + Traffic Split, Fin Releases karşılığı).
 *  - Taslak: düzenleyicideki ayarlar (Dene sohbeti).
 *  - Deneme ortamı: seçilen sürüm ayrı adreste (?ortam=deneme), ayrı API anahtarıyla ve kutuda data-ortam="deneme"
 *    ile çalışır; konuşmaları canlıdan ayrı tutulur, canlı ziyaretçi görmez.
 *  - Canlı: yayındaki sürüm. Kademeli yayında yeni sürüm yeni konuşmaların yüzde N'ine gider; konuşma başladığı
 *    sürümde kalır. Plan adımlarıyla (ör. 10, 25, 50, 100) elle ya da zamanla ilerler; koruma eşikleri (devir ve hata
 *    oranı eski sürüme göre şu kadar puan kötüleşirse) aşılınca kendiliğinden geri alınır. Yüzde 100'de yeni sürüm
 *    yayındaki sürüm olur.
 */
type Yayindaki = NonNullable<Awaited<ReturnType<typeof yayindakiAjan>>>;

/** Deneme ortamındaki ajan: canlı ile aynı biçim, ayar deneme sürümünden. */
export async function denemeOrtamAjani(id: string): Promise<Yayindaki | null> {
  const h = await ajanHam(id);
  const no = h?.ajan.yayin.ortam?.deneme?.surum;
  const s = no ? h!.ajan.surumler.find((x) => x.no === no) : undefined;
  if (!h || !s) return null;
  return { ajan: h.ajan, ayar: surumAyarTamamla(s.ayar), sahipOzeti: h.sahipOz };
}

const kova = (konusmaId: string) => parseInt(konusmaId.slice(6, 12), 16) % 100;
/**
 * Konuşmanın sürümü: deneme ortamı, kademeli yayın ve A/B sırasıyla. Konuşma başladığı sürümde kalır; kademe geri
 * alındıysa ya da A/B bittiyse yayındaki sürüme döner.
 */
export function surumSec(y: Yayindaki, k: ZiyaretciKonusma, konusmaId: string): { ayar: SurumAyar; surum: number } {
  const { ajan } = y;
  if (k.ortam === "deneme") return { ayar: y.ayar, surum: ajan.yayin.ortam?.deneme?.surum ?? ajan.yayin.surum };
  const kd = ajan.yayin.kademe;
  const yeniSurum = kd?.acik ? ajan.surumler.find((s) => s.no === kd.surum) : undefined;
  if (yeniSurum && kd) {
    if (!k.kol && k.olusturma >= kd.baslangic) {
      const b = kova(konusmaId) < kd.oran;
      k.kol = b ? "B" : "A"; k.surum = b ? kd.surum : ajan.yayin.surum;
    }
    if (k.kol === "B" && k.surum === kd.surum) return { ayar: surumAyarTamamla(yeniSurum.ayar), surum: kd.surum };
    return { ayar: y.ayar, surum: ajan.yayin.surum };
  }
  const ab = ajan.yayin.ab;
  const bSurum = ab?.acik ? ajan.surumler.find((s) => s.no === ab.surum && s.no !== ajan.yayin.surum) : undefined;
  if (bSurum && !k.kol && k.olusturma >= ab!.baslangic) {
    const b = parseInt(konusmaId.slice(0, 6), 16) % 100 < ab!.oran;
    k.kol = b ? "B" : "A"; k.surum = b ? bSurum.no : ajan.yayin.surum;
  }
  if (bSurum && k.kol === "B" && k.surum === bSurum.no) return { ayar: surumAyarTamamla(bSurum.ayar), surum: bSurum.no };
  return { ayar: y.ayar, surum: ajan.yayin.surum };
}

export const varsayilanKademe = (surum: number, onceki: number, g: Partial<KademeAyar> = {}): KademeAyar => ({
  acik: true, surum, onceki, oran: g.plan?.[0] ?? g.oran ?? 10, baslangic: Date.now(), plan: g.plan?.length ? g.plan : [10, 25, 50, 100], otomatik: g.otomatik ?? false,
  adimSaat: g.adimSaat ?? 24, sonAdim: Date.now(), koruma: { acik: true, devirPuan: 10, hataPuan: 5, enAz: 20, ...(g.koruma ?? {}) }, gecmis: [{ zaman: Date.now(), olay: `Sürüm ${surum} kademeli yayına çıktı (yüzde ${g.plan?.[0] ?? g.oran ?? 10})` }],
});

export type KolOlcu = { surum: number; konusma: number; devir: number; hata: number; csat: number | null; csatSayi: number };
export type KademeRapor = { yeni: KolOlcu; eski: KolOlcu; karar: "yetersiz" | "iyi" | "geri-al"; neden: string };
const hataliMi = (k: ZiyaretciKonusma) => k.mesajlar.some((m) => m.rol === "asistan" && m.durum === "hata");
const devirliMi = (k: ZiyaretciKonusma) => !!k.devir || k.durum === "devredildi" || k.durum === "insan";
/** Kademenin iki kolu: konuşma, devir ve hata oranı, memnuniyet. */
export async function kademeOlc(a: Ajan): Promise<KademeRapor | null> {
  const kd = a.yayin.kademe;
  if (!kd) return null;
  const l = (await konusmalariOku(a.id, kd.baslangic)).filter((k) => k.olusturma >= kd.baslangic && k.ortam !== "deneme" && k.kol);
  const olc = (no: number, kol: "A" | "B"): KolOlcu => {
    const x = l.filter((k) => k.kol === kol && (kol === "A" || k.surum === no));
    const c = x.filter((k) => k.csat).map((k) => k.csat!.puan);
    return { surum: no, konusma: x.length, devir: x.length ? x.filter(devirliMi).length / x.length : 0, hata: x.length ? x.filter(hataliMi).length / x.length : 0, csat: c.length ? c.reduce((t, v) => t + v, 0) / c.length : null, csatSayi: c.length };
  };
  const yeni = olc(kd.surum, "B"), eski = olc(kd.onceki, "A");
  if (yeni.konusma < kd.koruma.enAz) return { yeni, eski, karar: "yetersiz", neden: `Karar için yeni sürümde en az ${kd.koruma.enAz} konuşma gerekiyor (şu an ${yeni.konusma}).` };
  const devirFark = (yeni.devir - eski.devir) * 100, hataFark = (yeni.hata - eski.hata) * 100;
  if (kd.koruma.acik && devirFark > kd.koruma.devirPuan) return { yeni, eski, karar: "geri-al", neden: `İnsana devir oranı yüzde ${Math.round(yeni.devir * 100)}, eski sürümde yüzde ${Math.round(eski.devir * 100)}; fark eşiği (${kd.koruma.devirPuan} puan) aştı.` };
  if (kd.koruma.acik && hataFark > kd.koruma.hataPuan) return { yeni, eski, karar: "geri-al", neden: `Hata oranı yüzde ${Math.round(yeni.hata * 100)}, eski sürümde yüzde ${Math.round(eski.hata * 100)}; fark eşiği (${kd.koruma.hataPuan} puan) aştı.` };
  return { yeni, eski, karar: "iyi", neden: "Yeni sürüm koruma eşiklerinin içinde." };
}

/** Kademe denetimi: koruma aşıldıysa geri alır, otomatikse zamanı gelen adıma çıkar, yüzde 100'de bitirir. */
export async function kademeDenetle(id: string, sahipOz: string, simdi = Date.now()): Promise<{ olay?: string; rapor: KademeRapor | null }> {
  const h = await ajanHam(id);
  if (!h || h.sahipOz !== sahipOz || !h.ajan.yayin.kademe?.acik) return { rapor: null };
  const rapor = await kademeOlc(h.ajan);
  let olay: string | undefined;
  await ajanGuncelleOz(id, sahipOz, (a) => {
    const kd = a.yayin.kademe;
    if (!kd?.acik || !rapor) return "yok";
    if (rapor.karar === "geri-al") { kd.acik = false; olay = `Otomatik geri alındı: ${rapor.neden}`; kd.gecmis = [...kd.gecmis, { zaman: simdi, olay }].slice(-40); return; }
    if (kd.otomatik && rapor.karar === "iyi" && simdi - kd.sonAdim >= kd.adimSaat * 3600_000) {
      const sonraki = kd.plan.find((p) => p > kd.oran);
      if (!sonraki) return "yok";
      if (sonraki >= 100) { a.yayin.surum = kd.surum; a.yayin.durum = "yayinda"; kd.acik = false; kd.oran = 100; olay = `Sürüm ${kd.surum} herkese açıldı`; }
      else { kd.oran = sonraki; kd.sonAdim = simdi; olay = `Yüzde ${sonraki} adımına çıkıldı`; }
      kd.gecmis = [...kd.gecmis, { zaman: simdi, olay }].slice(-40);
      return;
    }
    return "yok";
  });
  return { olay, rapor };
}
