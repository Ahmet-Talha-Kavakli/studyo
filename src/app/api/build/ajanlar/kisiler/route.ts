import { ajanlariListeleOz } from "@/lib/build/ajanDepo";
import { kimlikAyir, kisiGetir, kisiGuncelle, kisileriBirlestir, kisileriListele, kisiNotEkle, kisiOzeti, kisiSil, type KimlikTur } from "@/lib/build/ajanKisi";
import { sahipOzeti } from "@/lib/build/depo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { konusmaDosyadan, konusmaGuncelle, konusmaSil } from "@/lib/build/ziyaretciDepo";
import { icerikDenetle } from "@/lib/moderasyon";

export const dynamic = "force-dynamic";

/**
 * Kişiler (kanallar arası tek kimlik). GET ?ara= ?kanal= ?oneri=1 liste; ?id= tek kişi (kimlikler, notlar,
 * bilgiler, olası eşleşmeler, bütün kanallardaki konuşmaların kısa dökümü).
 */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const sahipOz = sahipOzeti(sahip);
  const u = new URL(req.url).searchParams;
  const id = u.get("id");
  if (id) {
    const k = await kisiGetir(sahipOz, id);
    if (!k) return hata("Kişi bulunamadı.", 404);
    const ajanlar = new Map((await ajanlariListeleOz(sahipOz)).map((a) => [a.id, a]));
    const konusmalar = await Promise.all(k.konusmalar.slice(0, 60).map(async (c) => {
      const v = await konusmaDosyadan(c.ajanId, c.dosyaId);
      const a = ajanlar.get(c.ajanId);
      return { ...c, ajan: a ? { id: a.id, ad: a.ad, simge: a.simge } : null, var: !!v, durum: v?.durum ?? "acik", mesaj: v?.mesajlar.filter((m) => !m.olay).length ?? 0, ilk: v?.mesajlar.find((m) => m.rol === "kullanici")?.metin?.slice(0, 160) ?? c.ilk, csat: v?.csat?.puan, etiketler: v?.etiketler ?? [] };
    }));
    const oneriler = await Promise.all(k.oneriler.map(async (o) => { const x = await kisiGetir(sahipOz, o.kisi); return x ? { ...o, kisiOzet: kisiOzeti(x) } : null; }));
    return Response.json({ ok: true, kisi: { ...k, konusmalar, oneriler: oneriler.filter(Boolean) } });
  }
  const r = await kisileriListele(sahipOz, { ara: u.get("ara")?.slice(0, 80) ?? undefined, kanal: u.get("kanal") ?? undefined, oneri: u.get("oneri") === "1" });
  return Response.json({ ok: true, ...r });
}

/**
 * { id, islem } işlemleri: birlestir { kaynak } · not { metin } · not-sil { not } · guncelle { ad?, etiketler?, ozellikler? }
 * · kimlik-ayir { tur, deger } · oneri-reddet { kisi } · sil { konusmalar?: true } (unutulma hakkı: konuşmaları da siler).
 */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const sahipOz = sahipOzeti(sahip);
  let g: { id?: string; islem?: string; kaynak?: string; metin?: string; not?: string; ad?: string; etiketler?: string[]; ozellikler?: Record<string, string>; tur?: KimlikTur; deger?: string; kisi?: string; konusmalar?: boolean } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const id = String(g.id ?? "");
  const sonuc = (k: unknown) => (k === null ? hata("Kişi bulunamadı.", 404) : typeof k === "string" ? hata(k) : Response.json({ ok: true }));
  switch (g.islem) {
    case "birlestir": {
      const r = await kisileriBirlestir(sahipOz, id, String(g.kaynak ?? ""));
      if (r && typeof r === "object") for (const c of r.konusmalar) await konusmaGuncelle(c.ajanId, c.dosyaId, (x) => { x.kisi = r.id; }, true).catch(() => null);
      return sonuc(r);
    }
    case "not": {
      const metin = String(g.metin ?? "").trim().slice(0, 400);
      if (!metin) return hata("Not boş.");
      const d = icerikDenetle(metin); if (!d.izin) return hata(d.mesaj, 422);
      return sonuc(await kisiNotEkle(sahipOz, id, { metin, kaynak: "temsilci", yazan: "Sen" }));
    }
    case "not-sil": return sonuc(await kisiGuncelle(sahipOz, id, (k) => { k.notlar = k.notlar.filter((n) => n.id !== g.not); }));
    case "guncelle": return sonuc(await kisiGuncelle(sahipOz, id, (k) => {
      if (typeof g.ad === "string") k.ad = g.ad.trim().slice(0, 80) || undefined;
      if (Array.isArray(g.etiketler)) k.etiketler = [...new Set(g.etiketler.filter((e): e is string => typeof e === "string").map((e) => e.trim().slice(0, 40)).filter(Boolean))].slice(0, 20);
      if (g.ozellikler && typeof g.ozellikler === "object") k.ozellikler = Object.fromEntries(Object.entries(g.ozellikler).filter(([a, v]) => /^[a-zA-Z_][\w]{0,39}$/.test(a) && typeof v === "string" && v.trim()).slice(0, 40).map(([a, v]) => [a, v.slice(0, 300)]));
    }));
    case "kimlik-ayir": return sonuc(await kimlikAyir(sahipOz, id, g.tur as KimlikTur, String(g.deger ?? "")));
    case "oneri-reddet": return sonuc(await kisiGuncelle(sahipOz, id, (k) => { k.oneriler = k.oneriler.filter((o) => o.kisi !== g.kisi); }));
    case "sil": {
      const k = await kisiSil(sahipOz, id);
      if (!k) return hata("Kişi bulunamadı.", 404);
      if (g.konusmalar) for (const c of k.konusmalar) await konusmaSil(c.ajanId, c.dosyaId).catch(() => {});
      else for (const c of k.konusmalar) await konusmaGuncelle(c.ajanId, c.dosyaId, (x) => { x.kisi = undefined; x.kisiImza = undefined; }, true).catch(() => null);
      return Response.json({ ok: true, silinen: g.konusmalar ? k.konusmalar.length : 0 });
    }
  }
  return hata("Bilinmeyen işlem.");
}
