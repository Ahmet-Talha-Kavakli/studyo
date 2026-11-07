import { sahipOzeti } from "@/lib/build/depo";
import { aktifOku, beklemeListesi, calismaOku, onayGecmisi, onayGecmisiEkle, sistemGetirOz } from "@/lib/build/sistemDepo";
import { calismaDevam } from "@/lib/build/sistemMotoru";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Onay kutusu: bekleyen onaylar (en eski önce) ve son kararlar. */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return Response.json({ ok: true, bekleyen: [], gecmis: [] });
  const oz = sahipOzeti(sahip);
  const aktif = await aktifOku();
  const bekleyen = [];
  for (const [cid, a] of Object.entries(aktif)) {
    if (a.sahipOz !== oz || a.durum !== "bekliyor") continue;
    const s = await sistemGetirOz(a.sistemId, oz);
    const c = s ? await calismaOku(a.sistemId, cid) : null;
    if (!s || !c) continue;
    // Paralel dallarda aynı çalışmada birden çok onay bekleyebilir: her biri ayrı kart.
    for (const b of beklemeListesi(c).filter((x) => x.tur === "onay" && c.devam?.[x.anahtar] === undefined)) bekleyen.push({
      calismaId: cid, anahtar: b.anahtar, sistemId: s.id, sistemAd: s.ad, adim: c.adimlar.find((x) => x.anahtar === b.anahtar)?.ad ?? "Onay",
      baslik: b.baslik ?? "", icerik: b.icerik ?? "", duzenlenebilir: !!b.duzenlenebilir, varsayilan: b.varsayilan ?? "ret",
      zamanAsimi: b.zamanAsimi, baslangic: c.baslangic, istendi: c.adimlar.find((x) => x.anahtar === b.anahtar)?.baslangic ?? c.baslangic,
      deneme: c.tetik.tur === "deneme", tetikTur: c.tetik.tur,
    });
  }
  bekleyen.sort((x, y) => x.istendi - y.istendi);
  return Response.json({ ok: true, bekleyen, gecmis: (await onayGecmisi(oz)).slice(0, 50) });
}

/** Karar: { sistemId, calismaId, karar: "onay" | "ret", not?, icerik? (düzenlenmiş içerik) }. */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const oz = sahipOzeti(sahip);
  let g: { sistemId?: string; calismaId?: string; anahtar?: string; karar?: string; not?: string; icerik?: string } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (g.karar !== "onay" && g.karar !== "ret") return hata("Onayla ya da reddet.");
  const s = await sistemGetirOz(String(g.sistemId ?? ""), oz);
  const c = s ? await calismaOku(s.id, String(g.calismaId ?? "")) : null;
  if (!s || !c) return hata("Onay bulunamadı.", 404);
  const b = beklemeListesi(c).find((x) => x.tur === "onay" && (!g.anahtar || x.anahtar === g.anahtar));
  if (c.durum !== "bekliyor" || !b) return hata("Bu onay artık beklemede değil.", 409);
  const icerik = typeof g.icerik === "string" && b.duzenlenebilir ? g.icerik.slice(0, 20_000) : undefined;
  const r = await calismaDevam(s.id, c.id, { tur: "onay", anahtar: b.anahtar, veri: { karar: g.karar, not: String(g.not ?? "").slice(0, 2000), icerik, kararVeren: "uygulama" } });
  if (!r.ok) return hata(r.hata, r.durum ?? 409);
  await onayGecmisiEkle(oz, { calismaId: c.id, sistemId: s.id, sistemAd: s.ad, baslik: b.baslik ?? "Onay", karar: g.karar, duzenlendi: icerik !== undefined && icerik !== (b.icerik ?? ""), not: g.not?.slice(0, 300) || undefined, zaman: Date.now(), kararVeren: "uygulama" });
  return Response.json({ ok: true });
}
