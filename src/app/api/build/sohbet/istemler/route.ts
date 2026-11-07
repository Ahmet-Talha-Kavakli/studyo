import { istemleriDegistir, istemleriOku, kisayolAdi, yeniIstemId, type KayitliIstem } from "@/lib/build/sohbetIstem";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Kayıtlı istemlerim. */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return Response.json({ ok: true, istemler: [] });
  return Response.json({ ok: true, istemler: await istemleriOku(sahip) });
}

/** Kaydet ya da güncelle: { id?, ad (kısayol), baslik, metin } → { istem }. Kısayol adı benzersizdir. */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  let g: { id?: string; ad?: string; baslik?: string; metin?: string; kullanildi?: boolean };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (g.kullanildi && g.id) {
    await istemleriDegistir(sahip, (l) => { const x = l.find((k) => k.id === g.id); if (x) x.kullanim += 1; });
    return Response.json({ ok: true });
  }
  const metin = String(g.metin ?? "").trim().slice(0, 8000);
  const baslik = String(g.baslik ?? "").trim().slice(0, 80);
  const ad = kisayolAdi(String(g.ad ?? "") || baslik);
  if (!metin) return hata("İstem metni boş.");
  if (!ad) return hata("Kısayol adı gerekli (ör. ozet-cikar).");
  const r = await istemleriDegistir(sahip, (l): KayitliIstem | string => {
    if (l.some((k) => k.ad === ad && k.id !== g.id)) return `"/${ad}" kısayolu zaten var; başka bir ad seç.`;
    const var_ = g.id ? l.find((k) => k.id === g.id) : undefined;
    if (var_) { Object.assign(var_, { ad, baslik: baslik || ad, metin }); return var_; }
    if (l.length >= 200) return "En çok 200 istem kaydedilebilir.";
    const yeni: KayitliIstem = { id: yeniIstemId(), ad, baslik: baslik || ad, metin, zaman: Date.now(), kullanim: 0 };
    l.unshift(yeni);
    return yeni;
  });
  if (typeof r === "string") return hata(r, 409);
  return Response.json({ ok: true, istem: r });
}

/** Sil: ?id= */
export async function DELETE(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const silindi = await istemleriDegistir(sahip, (l) => { const i = l.findIndex((k) => k.id === id); if (i >= 0) l.splice(i, 1); return i >= 0; });
  return silindi ? Response.json({ ok: true }) : hata("İstem bulunamadı.", 404);
}
