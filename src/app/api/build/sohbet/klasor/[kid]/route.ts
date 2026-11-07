import { randomBytes } from "crypto";
import { klasoruBosalt } from "@/lib/build/sohbetDepo";
import { KLASOR_RENKLERI, klasorAcik, klasorlerGuncelleOz, talimatSurumle } from "@/lib/build/sohbetKlasor";
import { klasorErisimi, ortakSil } from "@/lib/build/sohbetOrtak";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ kid: string }> };

/** Klasör (kendi klasörün ya da ?sahip= ile seninle paylaşılan klasör) ve rolün. */
export async function GET(req: Request, { params }: Ctx) {
  if (!sahipAl(req)) return yetkisiz();
  const e = await klasorErisimi(req, (await params).kid);
  if (!e) return hata("Klasör bulunamadı ya da erişimin yok.", 404);
  if (e.rol !== "sahip" && e.kimlik) await klasorlerGuncelleOz(e.oz, (l) => { const u = l.find((y) => y.id === e.k.id)?.ekip?.find((x) => x.eposta === e.kimlik!.eposta); if (u) u.sonGorulme = Date.now(); });
  const { ekip, ...acik } = klasorAcik(e.k);
  return Response.json({ ok: true, rol: e.rol, klasor: { ...acik, ...(e.rol === "sahip" ? { ekip: ekip ?? [] } : { ekipSayisi: ekip?.length ?? 0 }) } });
}

/**
 * { ad?, aciklama?, talimat?, renk?, bellek?, bellekModu?, sablon?, talimatGeriYukle?, kayitEkle?, kayitSil? }.
 * Düzenleyici talimatı, açıklamayı ve klasör belleğini değiştirir; ad, renk ve bellek kipi yalnız sahipte.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!sahipAl(req)) return yetkisiz();
  const kid = (await params).kid;
  const e = await klasorErisimi(req, kid);
  if (!e) return hata("Klasör bulunamadı.", 404);
  if (e.rol === "izleyici") return hata("Bu klasörde yalnız görüntüleme iznin var.", 403);
  let g: { ad?: string; aciklama?: string; talimat?: string; renk?: string; bellek?: boolean; bellekModu?: string; sablon?: string; talimatGeriYukle?: string; kayitEkle?: string; kayitSil?: string };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const sahip = e.rol === "sahip";
  const k = await klasorlerGuncelleOz(e.oz, (l) => {
    const x = l.find((y) => y.id === kid);
    if (!x) return null;
    if (sahip && typeof g.ad === "string" && g.ad.trim()) x.ad = g.ad.trim().slice(0, 60);
    if (typeof g.aciklama === "string") x.aciklama = g.aciklama.trim().slice(0, 300);
    if (typeof g.talimat === "string") talimatSurumle(x, g.talimat.slice(0, 8000));
    if (typeof g.talimatGeriYukle === "string") { const v = x.talimatSurumleri?.find((y) => y.id === g.talimatGeriYukle); if (v) talimatSurumle(x, v.talimat); }
    if (typeof g.sablon === "string") x.sablon = g.sablon.slice(0, 40);
    if (sahip && typeof g.renk === "string" && KLASOR_RENKLERI.includes(g.renk)) x.renk = g.renk;
    if (sahip && typeof g.bellek === "boolean") { x.bellek = g.bellek; x.bellekModu = g.bellek ? "hesap" : "kapali"; }
    if (sahip && (g.bellekModu === "hesap" || g.bellekModu === "klasor" || g.bellekModu === "kapali")) { x.bellekModu = g.bellekModu; x.bellek = g.bellekModu !== "kapali"; }
    if (typeof g.kayitEkle === "string" && g.kayitEkle.trim()) x.kayitlar = [...(x.kayitlar ?? []), { id: randomBytes(3).toString("hex"), metin: g.kayitEkle.trim().slice(0, 400), zaman: Date.now() }].slice(-200);
    if (typeof g.kayitSil === "string") x.kayitlar = (x.kayitlar ?? []).filter((y) => y.id !== g.kayitSil);
    x.guncelleme = Date.now();
    return x;
  });
  if (!k) return hata("Klasör bulunamadı.", 404);
  const { ekip, ...acik } = klasorAcik(k);
  return Response.json({ ok: true, rol: e.rol, klasor: { ...acik, ...(sahip ? { ekip: ekip ?? [] } : {}) } });
}

/** Klasörü sil (yalnız sahip): içindeki sohbetler silinmez, klasörsüz kalır; ekibin erişimi kalkar. */
export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const kid = (await params).kid;
  const e = await klasorErisimi(req, kid);
  if (!e || e.rol !== "sahip") return hata("Klasör bulunamadı.", 404);
  await klasorlerGuncelleOz(e.oz, (l) => { const i = l.findIndex((y) => y.id === kid); if (i >= 0) l.splice(i, 1); });
  for (const u of e.k.ekip ?? []) await ortakSil(u.eposta, "klasor", `${e.oz}:${kid}`);
  await klasoruBosalt(sahip, kid);
  return Response.json({ ok: true });
}
