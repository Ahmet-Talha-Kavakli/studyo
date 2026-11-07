import "server-only";
import { GOZETIMSIZ } from "./ajanKatalog";
import { ajanGetirOz, ajanlariListeleOz, surumAyari, surumAyarTamamla, type Ajan } from "./ajanDepo";
import { ajanCalistir } from "./ajanCalistir";
import { calismaGetir, calismaGuncelle, calismalariListele, type Calisma, type CalismaOzet } from "./ajanCalismaDepo";
import { konusmalariListele, type KMesaj, type KonusmaOzet } from "./ziyaretciDepo";

/**
 * Görevler kutusu (bütün ajanlar): "Girdi bekliyor" (onay bekleyen gözetimsiz çalışmalar ve temsilci bekleyen
 * konuşmalar), "Hatalı" (deneme dışı kanallarda hata) ve "Tamamlandı" (zamanlama ve webhook çıktıları).
 * Bildirim sayısı: bekleyen onaylar + görülmemiş hatalar + okunmamış temsilci konuşmaları.
 */
export type GorevAjan = { id: string; ad: string; simge: string };
export type Gorev =
  | { tur: "onay" | "hata" | "tamam"; ajan: GorevAjan; calisma: CalismaOzet }
  | { tur: "devir"; ajan: GorevAjan; konusma: KonusmaOzet };
const GUN = 86_400_000;

export async function gorevleriTopla(sahipOz: string, gun = 30): Promise<{ onay: Gorev[]; hata: Gorev[]; tamam: Gorev[]; devir: Gorev[]; sayac: number; ajanlar: GorevAjan[] }> {
  const ajanlar = await ajanlariListeleOz(sahipOz);
  const bas = Date.now() - gun * GUN;
  const o = { onay: [] as Gorev[], hata: [] as Gorev[], tamam: [] as Gorev[], devir: [] as Gorev[] };
  let sayac = 0;
  for (const a of ajanlar) {
    const ga: GorevAjan = { id: a.id, ad: a.ad, simge: a.simge };
    for (const c of await calismalariListele(a.id)) {
      if (c.durum === "girdi-bekliyor" && GOZETIMSIZ.includes(c.kanal) && c.bekleyen?.length) { o.onay.push({ tur: "onay", ajan: ga, calisma: c }); sayac++; continue; }
      if (c.baslangic < bas || c.kanal === "test" || c.kanal === "sohbet" || c.kanal === "eval" || c.ust) continue;
      if (c.durum === "hata") { o.hata.push({ tur: "hata", ajan: ga, calisma: c }); if (!c.goruldu) sayac++; }
      else if (c.durum === "tamamlandi" && GOZETIMSIZ.includes(c.kanal)) o.tamam.push({ tur: "tamam", ajan: ga, calisma: c });
    }
    for (const k of await konusmalariListele(a.id, 200)) {
      if (k.durum !== "devredildi" && k.durum !== "insan") continue;
      o.devir.push({ tur: "devir", ajan: ga, konusma: k });
      if (k.okunmadi) sayac++;
    }
  }
  const zaman = (g: Gorev) => (g.tur === "devir" ? g.konusma.guncelleme : g.calisma.baslangic);
  for (const l of Object.values(o)) l.sort((x, y) => zaman(y) - zaman(x));
  return { ...o, sayac, ajanlar: ajanlar.map((a) => ({ id: a.id, ad: a.ad, simge: a.simge })) };
}

/** Çalışmanın kullandığı ayar: kaydedildiği sürüm (yoksa taslak). */
function calismaAyari(a: Ajan, c: Calisma) {
  const s = c.surum ? a.surumler.find((x) => x.no === c.surum) : undefined;
  return s ? surumAyarTamamla(s.ayar) : surumAyari(a);
}

/** Onay bekleyen gözetimsiz çalışmayı onay ya da retle sürdürür. Aynı çalışma iki kez sürdürülemez. */
export async function bekleyeniSurdur(ajanId: string, sahipOz: string, calismaId: string, karar: "onay" | "ret", hep = false): Promise<{ hata?: string; calisma?: Calisma }> {
  const a = await ajanGetirOz(ajanId, sahipOz);
  if (!a) return { hata: "Ajan bulunamadı." };
  const once = await calismaGetir(ajanId, calismaId);
  if (!once?.bekleme) return { hata: "Bu çalışma artık onay beklemiyor." };
  const bekleme = once.bekleme;
  const al = await calismaGuncelle(ajanId, calismaId, (c) => { if (!c.bekleme) return "Bu çalışma artık onay beklemiyor."; c.bekleme = undefined; c.durum = "calisiyor"; c.goruldu = true; });
  if (!al || typeof al === "string") return { hata: typeof al === "string" ? al : "Çalışma bulunamadı." };
  const asistan: KMesaj = { id: `g-${calismaId}`, rol: "asistan", zaman: al.baslangic, parcalar: bekleme.parcalar as KMesaj["parcalar"], model: al.model, durum: "onay-bekliyor" };
  try {
    const r = await ajanCalistir({
      ajan: a, ayar: calismaAyari(a, al), sahipOz, kanal: al.kanal, surum: al.surum, mod: "gozetimsiz",
      konusma: { gecmis: bekleme.gecmis, mesajlar: [asistan] }, tetik: al.tetik,
      devam: { cagrilar: bekleme.cagrilar, ret: karar === "ret", hep, calisma: al, asistan },
    });
    return { calisma: r.calisma };
  } catch (e) {
    await calismaGuncelle(ajanId, calismaId, (c) => { c.durum = "hata"; c.hata = (e as Error).message.slice(0, 300); });
    return { hata: (e as Error).message };
  }
}
