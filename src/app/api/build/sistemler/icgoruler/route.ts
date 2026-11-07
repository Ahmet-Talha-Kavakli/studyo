import { istatistikOku, sistemleriListele, type GunIstat } from "@/lib/build/sistemDepo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/**
 * İçgörüler: ?gun=7|30|90 ya da ?bas=YYYY-AA-GG&son=YYYY-AA-GG (Türkiye günleri, dahil), &deneme=1 denemeleri de sayar.
 * Dönem ve hemen önceki eşit uzunluktaki dönem için sistem başına çalışma, başarı, hata oranı, ortalama süre, kredi ve
 * kazanılan süre (başarılı çalışma sayısı çarpı sistemin "çalışma başı dakika" ayarı); günlük seriler.
 */
const GUN = 86_400_000;
const gunKey = (t: number) => new Date(t).toISOString().slice(0, 10);
const gunOku = (s: string | null) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10))) : null);
type Toplam = { calisma: number; basarili: number; basarisiz: number; sure: number; kredi: number; kazanilanDk: number };
const bos = (): Toplam => ({ calisma: 0, basarili: 0, basarisiz: 0, sure: 0, kredi: 0, kazanilanDk: 0 });
const ekle = (t: Toplam, v: GunIstat | undefined, dk: number) => { if (!v) return; t.calisma += v.n; t.basarili += v.b; t.basarisiz += v.h; t.sure += v.s; t.kredi += v.k; t.kazanilanDk += v.b * dk; };
const ozet = (t: Toplam) => ({ ...t, hataOrani: t.calisma ? t.basarisiz / t.calisma : 0, ortSure: t.calisma ? Math.round(t.sure / t.calisma) : 0, kredi: Math.round(t.kredi * 10) / 10, kazanilanDk: Math.round(t.kazanilanDk) });

export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const q = new URL(req.url).searchParams;
  const deneme = q.get("deneme") === "1";
  const bugun = Date.UTC(new Date(Date.now() + 3 * 3600_000).getUTCFullYear(), new Date(Date.now() + 3 * 3600_000).getUTCMonth(), new Date(Date.now() + 3 * 3600_000).getUTCDate());
  let bas = gunOku(q.get("bas")), son = gunOku(q.get("son"));
  if (bas === null || son === null) { const n = Math.max(1, Math.min(400, Number(q.get("gun")) || 30)); son = bugun; bas = bugun - (n - 1) * GUN; }
  if (bas > son) [bas, son] = [son, bas];
  if ((son - bas) / GUN > 400) return hata("Aralık en çok 400 gün olabilir.");
  const n = Math.round((son - bas) / GUN) + 1;
  const gunler = Array.from({ length: n }, (_, i) => gunKey(bas! + i * GUN));
  const onceki = Array.from({ length: n }, (_, i) => gunKey(bas! - n * GUN + i * GUN));

  const toplam = bos(), oncekiToplam = bos();
  const gunluk = gunler.map((g) => ({ gun: g, ...bos() }));
  const sistemler: Record<string, unknown>[] = [];
  for (const s of await sistemleriListele(sahip)) {
    const ist = await istatistikOku(s.id);
    const dk = s.ayar.dakika ?? 0;
    const t = bos(), o = bos();
    const seri: { gun: string; basarili: number; basarisiz: number; calisma: number }[] = [];
    gunler.forEach((g, i) => {
      const x = ist[g], v = bos();
      ekle(v, x?.c, dk); if (deneme) ekle(v, x?.d, dk);
      ekle(t, x?.c, dk); if (deneme) ekle(t, x?.d, dk);
      for (const k of Object.keys(v) as (keyof Toplam)[]) gunluk[i][k] += v[k];
      seri.push({ gun: g, basarili: v.basarili, basarisiz: v.basarisiz, calisma: v.calisma });
    });
    for (const g of onceki) { const x = ist[g]; ekle(o, x?.c, dk); if (deneme) ekle(o, x?.d, dk); }
    for (const k of Object.keys(t) as (keyof Toplam)[]) { toplam[k] += t[k]; oncekiToplam[k] += o[k]; }
    sistemler.push({ id: s.id, ad: s.ad, durum: s.durum, dakika: s.ayar.dakika ?? null, etiketler: s.etiketler ?? [], ...ozet(t), onceki: ozet(o), seri });
  }
  sistemler.sort((a, b) => (b.calisma as number) - (a.calisma as number) || String(a.ad).localeCompare(String(b.ad), "tr"));
  return Response.json({
    ok: true, aralik: { bas: gunler[0], son: gunler.at(-1), gun: n }, onceki: { bas: onceki[0], son: onceki.at(-1) },
    toplam: ozet(toplam), oncekiToplam: ozet(oncekiToplam), gunluk: gunluk.map((g) => ({ ...g, kredi: Math.round(g.kredi * 10) / 10, kazanilanDk: Math.round(g.kazanilanDk) })), sistemler,
  });
}
