import "server-only";
import type { Kayit, Veritabani } from "./veri";

/**
 * İlişki bütünlüğü (Appwrite onDelete restrict / cascade / setNull benzeri). İlişki sütununda "silinince" seçiliyse
 * bağlı kayıt silinirken uygulanır: kisitla (bağlı kayıt varken silme reddedilir), zincir (bağlı kayıtlar da silinir,
 * en çok 3 düzey), bosalt (bağlı kayıtlardaki alan boşaltılır). Seçili değilse bir şey yapılmaz (eski davranış).
 * veriDegistir geri çağrısının içinde, silmeden önce çağrılır; zincir ve bosalt v üzerinde hemen uygulanır.
 */
export type IliskiEtkisi = {
  engel: boolean; engelMetni?: string; ozet: string;
  yapilan: { tablo: string; islem: "sil" | "bosalt"; kayit: Kayit; sonraki?: Kayit; okuma?: string }[];
};

export function iliskiSilmeDenetimi(v: Veritabani, tablo: string, idler: string[], derinlik = 0, etki: IliskiEtkisi = { engel: false, ozet: "", yapilan: [] }): IliskiEtkisi {
  if (!idler.length || derinlik > 3 || etki.yapilan.length > 1000) return etki;
  const hedef = new Set(idler);
  // Önce kısıtlamalar: herhangi bir bağlı kayıt kısıtlıysa hiçbir şey yapılmaz.
  for (const [ad, k] of Object.entries(v.koleksiyonlar)) {
    for (const s of k.sema ?? []) {
      if (s.tur !== "iliski" || s.iliski !== tablo || s.silinince !== "kisitla") continue;
      const bagli = k.kayitlar.filter((r) => hedef.has(String(r[s.ad] ?? "")) && !(ad === tablo && hedef.has(r.id)));
      if (bagli.length) { etki.engel = true; etki.engelMetni = `Bu kayda "${ad}" tablosundaki ${bagli.length} kayıt "${s.ad}" alanıyla bağlı ve ilişki silinmeyi kısıtlıyor. Önce o kayıtları kaldır ya da ilişkinin silinince davranışını değiştir.`; return etki; }
    }
  }
  const zincir: { tablo: string; idler: string[] }[] = [];
  for (const [ad, k] of Object.entries(v.koleksiyonlar)) {
    for (const s of k.sema ?? []) {
      if (s.tur !== "iliski" || s.iliski !== tablo || !s.silinince || s.silinince === "kisitla") continue;
      const bagli = k.kayitlar.filter((r) => hedef.has(String(r[s.ad] ?? "")) && !(ad === tablo && hedef.has(r.id)));
      if (!bagli.length) continue;
      if (s.silinince === "bosalt") {
        for (const r of bagli) { const once = { ...r }; r[s.ad] = null; r.guncelleme = Date.now(); etki.yapilan.push({ tablo: ad, islem: "bosalt", kayit: once, sonraki: { ...r }, okuma: k.kurallar.okuma }); }
      } else {
        const sil = new Set(bagli.map((r) => r.id));
        for (const r of bagli) etki.yapilan.push({ tablo: ad, islem: "sil", kayit: { ...r }, okuma: k.kurallar.okuma });
        k.kayitlar = k.kayitlar.filter((r) => !sil.has(r.id));
        zincir.push({ tablo: ad, idler: [...sil] });
      }
    }
  }
  for (const z of zincir) { iliskiSilmeDenetimi(v, z.tablo, z.idler, derinlik + 1, etki); if (etki.engel) return etki; }
  if (derinlik === 0 && etki.yapilan.length) {
    const say = new Map<string, number>();
    for (const x of etki.yapilan) say.set(`${x.tablo}:${x.islem}`, (say.get(`${x.tablo}:${x.islem}`) ?? 0) + 1);
    etki.ozet = [...say.entries()].map(([a, n]) => { const [t, i] = a.split(":"); return `"${t}" tablosunda ${n} kayıt ${i === "sil" ? "silindi" : "boşaltıldı"}`; }).join(", ");
  }
  return etki;
}
