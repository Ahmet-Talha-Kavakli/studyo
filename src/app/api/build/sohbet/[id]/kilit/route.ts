import { sohbetGetir, sohbetKaydet } from "@/lib/build/sohbetDepo";
import { PIN, belirtecUret, kilitAcik, kilitCerezi, kilitKur, pinDogru } from "@/lib/build/sohbetKilit";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/**
 * Kilitli sohbet: { islem: "ac", pin } belirteç döndürür; { islem: "kur", pin } kilit koyar ya da PIN'i değiştirir
 * (kilitliyse geçerli belirteç gerekir); { islem: "kaldir", pin } kilidi kaldırır. Beş yanlış PIN: 15 dakika bekleme.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const s = await sohbetGetir((await params).id, sahip);
  if (!s) return hata("Sohbet bulunamadı.", 404);
  let g: { islem?: string; pin?: string };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const pin = String(g.pin ?? "").trim();
  if (!PIN.test(pin)) return hata("PIN 4 ile 8 rakam olmalı.");
  if (g.islem === "kur") {
    if (s.gecici) return hata("Geçici sohbet kilitlenemez.");
    if (s.kilit && !kilitAcik(req, s)) return hata("PIN'i değiştirmek için önce sohbetin kilidini aç.", 423);
    s.kilit = kilitKur(pin);
    await sohbetKaydet(s, sahip);
    return acildi(s.id, belirtecUret(s));
  }
  if (!s.kilit) return g.islem === "kaldir" ? Response.json({ ok: true }) : acildi(s.id, belirtecUret(s));
  if (s.kilit.bekle && s.kilit.bekle > Date.now()) return hata(`Çok fazla yanlış deneme. ${Math.ceil((s.kilit.bekle - Date.now()) / 60_000)} dakika sonra yeniden dene.`, 429);
  if (!pinDogru(s.kilit, pin)) {
    s.kilit.hatali = (s.kilit.hatali ?? 0) + 1;
    if (s.kilit.hatali >= 5) { s.kilit.bekle = Date.now() + 15 * 60_000; s.kilit.hatali = 0; }
    await sohbetKaydet(s, sahip);
    return hata(s.kilit.bekle && s.kilit.bekle > Date.now() ? "Çok fazla yanlış deneme; 15 dakika bekle." : `PIN yanlış. ${5 - (s.kilit.hatali ?? 0)} deneme hakkın kaldı.`, 403);
  }
  if (s.kilit.hatali || s.kilit.bekle) { s.kilit.hatali = 0; s.kilit.bekle = undefined; }
  if (g.islem === "kaldir") { delete s.kilit; await sohbetKaydet(s, sahip); return Response.json({ ok: true }, { headers: { "Set-Cookie": kilitCerezi(s.id, null) } }); }
  await sohbetKaydet(s, sahip);
  return acildi(s.id, belirtecUret(s));
}

const acildi = (id: string, b: string) => Response.json({ ok: true }, { headers: { "Set-Cookie": kilitCerezi(id, b) } });
