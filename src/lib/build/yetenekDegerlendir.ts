import "server-only";
import { karsilastir, type TurSonuc } from "./yetenekDene";
import type { Yetenek } from "./yetenekDepo";

/**
 * Kayıtlı değerlendirme paketi (skill-creator evals karşılığı): her vaka bir istem ve denetimlerden oluşur
 * (içerir, içermez, düzenli ifade, en az / en çok karakter). Her vaka yetenek yüklüyken ve yokken aynı modelle
 * çalışır; denetimler yanıta uygulanır. Sonuç: geçme oranları, fark, süre ve belirteç. Çalışmalar sürüm numarasıyla
 * saklanır; sürümler arası gerileme görünür. Denetimler modelden bağımsızdır (yargıç model kullanılmaz).
 */
export type DenetimTuru = "icerir" | "icermez" | "duzenli" | "enAz" | "enCok";
export type Denetim = { tur: DenetimTuru; deger: string };
export type Vaka = { id: string; istem: string; denetimler: Denetim[] };
export type VakaSonucu = { id: string; ile: { gecen: number; toplam: number; sure: number; belirtec: number; hata?: string; ozet: string }; olmadan: { gecen: number; toplam: number; sure: number; belirtec: number; hata?: string; ozet: string }; ayrinti: { denetim: Denetim; ile: boolean; olmadan: boolean }[] };
export type Calisma = { zaman: number; surum: number; model: string; ile: number; olmadan: number; toplam: number; sure: number; belirtec: number; vakalar: VakaSonucu[] };

const tr = (s: string) => s.toLocaleLowerCase("tr");
export function denetle(d: Denetim, metin: string): boolean {
  switch (d.tur) {
    case "icerir": return tr(metin).includes(tr(d.deger));
    case "icermez": return !tr(metin).includes(tr(d.deger));
    case "duzenli": try { return new RegExp(d.deger, "iu").test(metin); } catch { return false; }
    case "enAz": return metin.length >= Number(d.deger);
    case "enCok": return metin.length <= Number(d.deger);
  }
}
export function vakalariTemizle(l: unknown): Vaka[] | string {
  if (!Array.isArray(l)) return "Vaka listesi geçersiz.";
  const o: Vaka[] = [];
  for (const v of l.slice(0, 20)) {
    const istem = String(v?.istem ?? "").trim().slice(0, 2000);
    if (!istem) continue;
    const denetimler: Denetim[] = (Array.isArray(v?.denetimler) ? v.denetimler : []).slice(0, 10)
      .filter((d: Denetim) => d && ["icerir", "icermez", "duzenli", "enAz", "enCok"].includes(d.tur) && String(d.deger ?? "").trim())
      .map((d: Denetim) => ({ tur: d.tur, deger: String(d.deger).slice(0, 300) }));
    for (const d of denetimler) if (d.tur === "duzenli") { try { new RegExp(d.deger); } catch { return `Düzenli ifade geçersiz: ${d.deger}`; } }
    if (!denetimler.length) return `"${istem.slice(0, 40)}" vakasına en az bir denetim ekle.`;
    o.push({ id: typeof v?.id === "string" && /^[\w-]{4,20}$/.test(v.id) ? v.id : Math.random().toString(36).slice(2, 10), istem, denetimler });
  }
  return o;
}
const ozet = (t: TurSonuc) => (t.hata ? t.hata : t.metin).slice(0, 400);

/** Bütün vakaları çalıştırır (aynı anda en çok 3). */
export async function paketCalistir(y: Yetenek, vakalar: Vaka[], modelId: string): Promise<Calisma> {
  const bas = Date.now();
  const sonuc: VakaSonucu[] = [];
  for (let i = 0; i < vakalar.length; i += 3) {
    sonuc.push(...(await Promise.all(vakalar.slice(i, i + 3).map(async (v) => {
      const r = await karsilastir(y, v.istem, modelId);
      const ayrinti = v.denetimler.map((d) => ({ denetim: d, ile: !r.ile.hata && denetle(d, r.ile.metin), olmadan: !r.olmadan.hata && denetle(d, r.olmadan.metin) }));
      const ozetle = (t: TurSonuc, k: "ile" | "olmadan") => ({ gecen: ayrinti.filter((a) => a[k]).length, toplam: ayrinti.length, sure: t.sure, belirtec: t.girdi + t.cikti, ...(t.hata ? { hata: t.hata } : {}), ozet: ozet(t) });
      return { id: v.id, ile: ozetle(r.ile, "ile"), olmadan: ozetle(r.olmadan, "olmadan"), ayrinti };
    }))));
  }
  const toplam = sonuc.reduce((t, s) => t + s.ile.toplam, 0);
  return {
    zaman: Date.now(), surum: y.surum, model: modelId, toplam, sure: Date.now() - bas,
    ile: sonuc.reduce((t, s) => t + s.ile.gecen, 0), olmadan: sonuc.reduce((t, s) => t + s.olmadan.gecen, 0),
    belirtec: sonuc.reduce((t, s) => t + s.ile.belirtec + s.olmadan.belirtec, 0), vakalar: sonuc,
  };
}
