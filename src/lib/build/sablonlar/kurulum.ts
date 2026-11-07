import "server-only";
import { gunlukYaz } from "../gunluk";
import { SINIR, semaTemizle, semayaUygula, veriDegistir, yeniKayitId, type Kayit, type Kurallar, type Sutun } from "../veri";

/**
 * Şablonun hazır tablosu: şema, erişim kuralları, açıklama ve başlangıç kayıtları. Kayıtta id verilirse korunur
 * (sayfadaki bağlantılar ve şablon önizlemesindeki yedek veri aynı kimliği kullanır).
 */
export type SablonTablo = { aciklama: string; kurallar: Kurallar; sema: Sutun[]; kayitlar?: Record<string, unknown>[] };

/**
 * Şablondan açılan yeni projenin tablolarını Canlı veritabanına kurar. Projede aynı adlı tablo varsa ona dokunulmaz.
 * Başlangıç kayıtları şemadan geçer (tür dönüşümü, varsayılanlar); uymayan kayıt atlanır ve günlüğe yazılır.
 * Test ortamı sonradan açılırsa bu tablolar oraya kendiliğinden kopyalanır.
 */
export async function sablonTablolariniKur(projeId: string, tablolar: Record<string, SablonTablo>): Promise<string[]> {
  const atlanan: string[] = [];
  const kurulan = await veriDegistir(projeId, (v) => {
    const l: string[] = [];
    for (const [ad, t] of Object.entries(tablolar)) {
      if (v.koleksiyonlar[ad] || Object.keys(v.koleksiyonlar).length >= SINIR.koleksiyon) continue;
      const k = (v.koleksiyonlar[ad] = { kurallar: { ...t.kurallar }, kayitlar: [] as Kayit[], sema: semaTemizle(t.sema) ?? [], aciklama: t.aciklama });
      const z = Date.now();
      (t.kayitlar ?? []).forEach((x, i) => {
        const { id, ...alanlar } = x;
        const s = semayaUygula(k, alanlar, true);
        if ("hata" in s) { atlanan.push(`${ad} ${i + 1}. kayıt: ${s.hata}`); return; }
        const kimlik = typeof id === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(id) && !k.kayitlar.some((r) => r.id === id) ? id : yeniKayitId();
        k.kayitlar.push({ id: kimlik, olusturma: z + i, guncelleme: z + i, ...s.alanlar });
      });
      l.push(ad);
    }
    return l;
  }, "canli");
  if (kurulan.length) gunlukYaz(projeId, { t: "veri", d: 201, m: `Şablon tabloları kuruldu: ${kurulan.join(", ")}` });
  if (atlanan.length) gunlukYaz(projeId, { t: "veri", d: 400, m: `Şablon kayıtları atlandı: ${atlanan.join("; ")}`.slice(0, 500) });
  return kurulan;
}
