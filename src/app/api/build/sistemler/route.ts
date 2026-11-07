import { sahipOzeti } from "@/lib/build/depo";
import { aktifOku, sistemAcik, sistemleriListele, sistemOlustur } from "@/lib/build/sistemDepo";
import { TUM_SABLONLAR } from "@/lib/build/sistemSablonlar";
import { hata, sahipAl } from "@/lib/build/sunucu";
import { sistemTaslagi, type SistemTaslagi } from "@/lib/build/sistemTaslak";
import { icerikDenetle } from "@/lib/moderasyon";

export const dynamic = "force-dynamic";

/** Sahibin sistemleri + etkin çalışma sayıları (bekleyen onay, beklemede, kuyrukta, çalışıyor). */
export async function GET(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return Response.json({ ok: true, sistemler: [], etkin: {} });
  const oz = sahipOzeti(sahip);
  const etkin: Record<string, { onay: number; bekliyor: number; kuyrukta: number; calisiyor: number }> = {};
  for (const a of Object.values(await aktifOku())) {
    if (a.sahipOz !== oz) continue;
    const e = (etkin[a.sistemId] ??= { onay: 0, bekliyor: 0, kuyrukta: 0, calisiyor: 0 });
    if (a.durum === "bekliyor" && a.tur === "onay") e.onay++; else if (a.durum === "bekliyor") e.bekliyor++; else if (a.durum === "kuyrukta") e.kuyrukta++; else e.calisiyor++;
  }
  return Response.json({ ok: true, sistemler: (await sistemleriListele(sahip)).map(sistemAcik), etkin });
}

/** Yeni sistem: { sablon } hazır sistemden, { tarif } anlatılandan (tek ajan adımıyla taslak), ya da boş. */
export async function POST(req: Request) {
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  let g: { sablon?: string; tarif?: string; ad?: string; onizle?: boolean; taslak?: SistemTaslagi } = {};
  try { g = await req.json(); } catch { /* boş */ }
  // Yapay zekâ taslağı: önce plan olarak gösterilir (onizle), kullanıcı onaylayınca aynı taslak kaydedilir (taslak).
  if (g.onizle && typeof g.tarif === "string" && g.tarif.trim()) {
    const d = icerikDenetle(g.tarif);
    if (!d.izin) return hata(d.mesaj, 422);
    const t = await sistemTaslagi(g.tarif.trim().slice(0, 2000));
    if (!t) return Response.json({ ok: true, taslak: null, yapayZeka: false });
    if ("hata" in t) return hata(t.hata);
    return Response.json({ ok: true, taslak: t, yapayZeka: true });
  }
  if (g.taslak && typeof g.taslak === "object" && Array.isArray(g.taslak.adimlar) && Array.isArray(g.taslak.tetikler)) {
    const t = g.taslak;
    const d = icerikDenetle(`${t.ad ?? ""}\n${t.aciklama ?? ""}`);
    if (!d.izin) return hata(d.mesaj, 422);
    const yeni = await sistemOlustur(sahip, { ad: String(t.ad ?? "Yeni sistem").slice(0, 80), aciklama: String(t.aciklama ?? "").slice(0, 600), tetikler: t.tetikler.slice(0, 1), adimlar: t.adimlar.slice(0, 12) });
    return Response.json({ ok: true, id: yeni.id });
  }
  if (g.sablon && !TUM_SABLONLAR.some((x) => x.id === g.sablon)) return hata("Hazır sistem bulunamadı.", 404);
  if (g.sablon) return Response.json({ ok: true, id: (await sistemOlustur(sahip, { sablon: g.sablon })).id });
  const tarif = String(g.tarif ?? "").trim().slice(0, 2000);
  if (tarif) {
    const d = icerikDenetle(tarif);
    if (!d.izin) return hata(d.mesaj, 422);
    // Tariften taslak: zaman ifadesi varsa zamanlı tetik, yoksa elle; görev tek ajan adımı olarak.
    const saat = /(\d{1,2})[.:](\d{2})/.exec(tarif);
    const hh = saat ? `${saat[1].padStart(2, "0")}:${saat[2]}` : "09:00";
    const zaman = /her sabah|her gün|günlük/i.test(tarif) ? { siklik: "gunluk" as const, saat: hh }
      : /her hafta|haftalık|pazartesi/i.test(tarif) ? { siklik: "haftalik" as const, saat: hh, gunler: [1] }
        : /her saat|saatlik/i.test(tarif) ? { siklik: "saatlik" as const, saat: "00:00" } : null;
    const ilk = tarif.split(/[.!?\n]/)[0].trim();
    const s = await sistemOlustur(sahip, {
      ad: (ilk.length > 50 ? ilk.slice(0, 50).replace(/\s+\S*$/, "") : ilk).replace(/^\p{Ll}/u, (h) => h.toLocaleUpperCase("tr")) || "Yeni sistem",
      aciklama: tarif,
      tetikler: [zaman ? { id: "t1", tur: "zaman", zaman } : /form/i.test(tarif) ? { id: "t1", tur: "form", projeId: "" } : /webhook|web kancası|istek gelince/i.test(tarif) ? { id: "t1", tur: "webhook" } : { id: "t1", tur: "elle" }],
      adimlar: [{ id: "a1", ad: "Görevi yap", tur: "ajan", hata: "durdur", ayar: { istem: tarif } }],
    });
    return Response.json({ ok: true, id: s.id });
  }
  return Response.json({ ok: true, id: (await sistemOlustur(sahip, { ad: g.ad?.slice(0, 80) || "Yeni sistem" })).id });
}
