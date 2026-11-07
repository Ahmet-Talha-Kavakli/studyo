import { projeOku } from "@/lib/build/depo";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { bulutAyarDegistir, bulutAyarOku, type UyariKurali } from "@/lib/build/bulutAyar";
import { performansOzeti } from "@/lib/build/bulutPerformans";
import { kuralTemizle, olcutHesapla, OLCUT_BILGI, projeUyarilari } from "@/lib/build/bulutUyari";
import { denetimKim, denetimYaz } from "@/lib/build/bulutGecmis";
import { zamanliBaslat } from "@/lib/build/bulutZamanli";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const ZAMAN: Record<string, number> = { "1s": 3600_000, "6s": 6 * 3600_000, "24s": 864e5, "7g": 7 * 864e5, "14g": 14 * 864e5 };

/**
 * Performans ve uyarı kuralları.
 *  GET ?zaman=1s|6s|24s|7g|14g&yol=&tur=hepsi|sayfa|fonksiyon → { ozet, seri, kova, uclar, disApi, oneriler, uyarilar, olcutler }
 *  POST { islem: "uyariEkle", ...kural } | { islem: "uyariGuncelle", id, ... } | { islem: "uyariSil", id } | { islem: "uyariDene", ...kural }
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const p = await projeOku((await params).id, sahip);
  if (!p) return bulunamadi();
  zamanliBaslat();
  const q = new URL(req.url).searchParams;
  const bit = Date.now(), bas = bit - (ZAMAN[q.get("zaman") ?? "24s"] ?? 864e5);
  const tur = (["hepsi", "sayfa", "fonksiyon"] as const).find((x) => x === q.get("tur")) ?? "hepsi";
  const [v, a] = await Promise.all([performansOzeti(p.id, { bas, bit, yol: q.get("yol") || undefined, tur }), bulutAyarOku(p.id)]);
  return Response.json({ ok: true, ...v, bas, bit, uyarilar: a.uyarilar, olcutler: OLCUT_BILGI, eposta: a.bildirim.eposta || null });
}

export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  let g: Partial<UyariKurali> & { islem?: string } = {};
  try { g = await req.json(); } catch { return hata("İstek okunamadı."); }
  try {
    if (g.islem === "uyariDene") { const k = kuralTemizle(g); return Response.json({ ok: true, ...(await olcutHesapla(id, k)) }); }
    { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
    const kim = await denetimKim(id, sahip);
    if (g.islem === "uyariEkle") {
      const k = kuralTemizle(g);
      await bulutAyarDegistir(id, (a) => { if (a.uyarilar.length >= 20) throw new Error("En çok 20 uyarı kuralı olabilir."); a.uyarilar.push(k); });
      denetimYaz(id, { tur: "uyari", kim, mesaj: `Uyarı kuralı eklendi: ${k.ad} (${OLCUT_BILGI[k.olcut].ad}, eşik ${k.esik}, ${k.pencere} dakika)` });
      await projeUyarilari(id, true).catch(() => {});
      return Response.json({ ok: true, kural: k, uyarilar: (await bulutAyarOku(id)).uyarilar });
    }
    if (g.islem === "uyariGuncelle" || g.islem === "uyariSil") {
      let ad = "";
      await bulutAyarDegistir(id, (a) => {
        const i = a.uyarilar.findIndex((x) => x.id === g.id);
        if (i < 0) throw new Error("Kural bulunamadı.");
        ad = a.uyarilar[i].ad;
        if (g.islem === "uyariSil") a.uyarilar.splice(i, 1);
        else a.uyarilar[i] = kuralTemizle(g, a.uyarilar[i]);
      });
      denetimYaz(id, { tur: "uyari", kim, mesaj: g.islem === "uyariSil" ? `Uyarı kuralı silindi: ${ad}` : `Uyarı kuralı ${typeof g.acik === "boolean" && Object.keys(g).length <= 3 ? (g.acik ? "açıldı" : "kapatıldı") : "güncellendi"}: ${ad}` });
      return Response.json({ ok: true, uyarilar: (await bulutAyarOku(id)).uyarilar });
    }
    return hata("Bilinmeyen işlem.");
  } catch (e) { return hata((e as Error).message); }
}
