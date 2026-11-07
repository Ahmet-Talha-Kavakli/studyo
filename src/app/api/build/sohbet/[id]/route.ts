import { kilitAcik, kilitliYanit } from "@/lib/build/sohbetKilit";
import { ajanGetir } from "@/lib/build/ajanDepo";
import { sohbetAcik, sohbetGetir, sohbetKaydet, sohbetSil } from "@/lib/build/sohbetDepo";
import { klasorGetir } from "@/lib/build/sohbetKlasor";
import { paylasimSil } from "@/lib/build/sohbetPaylasim";
import { yayinlar } from "@/lib/build/sohbetYayin";
import { baglamTahmini } from "@/lib/build/sohbetGecmis";
import { etkinYol } from "@/lib/build/sohbetYol";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { asistanBul } from "@/lib/build/sohbetAsistan";
import { gorevleriEsitle } from "@/lib/build/sohbetGorev";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Sohbet (bütün dallar; API geçmişi gönderilmez) + ajan + süren tur bilgisi (yeniden bağlanmak için). */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  // Bu sohbetin zamanlanmış görevlerinin biten çalışmaları önce sohbete aktarılır (açılınca okunmuş sayılır).
  await gorevleriEsitle(sahip, { sohbet: id, okundu: true }).catch(() => 0);
  const s = await sohbetGetir(id, sahip);
  if (!s) return hata("Sohbet bulunamadı.", 404);
  // Kilitli sohbet: PIN belirteci yoksa yalnız başlık döner.
  if (!kilitAcik(req, s)) return Response.json({ ok: false, hata: "Bu sohbet kilitli.", kilitli: true, baslik: s.baslik }, { status: 423 });
  const a = s.ajanId ? await ajanGetir(s.ajanId, sahip) : null;
  const ajan = a ? { id: a.id, ad: a.ad, aciklama: a.aciklama, simge: a.simge, model: a.model, karsilama: a.karsilama, baslangiclar: a.baslangiclar } : null;
  const y = yayinlar.get(id);
  // Sunucu yeniden başladıysa yarıda kalan tur "sürüyor" görünmesin.
  if (!y || y.bitti) {
    let degisti = false;
    for (const m of s.mesajlar) if (m.rol === "asistan" && m.durum === "suruyor") {
      m.durum = "durduruldu"; m.hata = "Yanıt yarıda kaldı.";
      m.parcalar = (m.parcalar ?? []).filter((p) => !(p.tur === "plan" && p.durum === "hazirlaniyor")).map((p) => (p.tur === "arac" && p.durum === "suruyor" ? { ...p, durum: "hata" as const, baslik: "Yarıda kaldı" } : p));
      degisti = true;
    }
    if (degisti) await sohbetKaydet(s, sahip);
  }
  const k = s.klasor ? await klasorGetir(sahip, s.klasor) : null;
  return Response.json({ ok: true, sohbet: sohbetAcik(s), baglam: baglamTahmini(s, etkinYol(s.mesajlar, s.secim)), ajan, calisiyor: !!y && !y.bitti, canli: y && !y.bitti ? y.asistanId : undefined, klasor: k ? { id: k.id, ad: k.ad, renk: k.renk } : null });
}

type Yama = {
  baslik?: string; sabit?: boolean; arsiv?: boolean; klasor?: string | null; secim?: { ust: string; cocuk: string };
  izinModu?: "otomatik" | "onay"; baglantiSecimi?: string[] | null; kapaliYetenekler?: string[]; bellekKapali?: boolean;
  efor?: "low" | "medium" | "high" | "max"; geri?: { mesajId: string; deger: "iyi" | "kotu" | null };
  ogrenme?: boolean; asistan?: string | null;
};

/** Adlandır, sabitle, arşivle, klasöre taşı, dal seç, izin modu, bu sohbetin bağlantı ve yetenek seçimi, geri bildirim. */
export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const s = await sohbetGetir((await params).id, sahip);
  if (!s) return hata("Sohbet bulunamadı.", 404);
  let g: Yama;
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  if (typeof g.baslik === "string" && g.baslik.trim()) s.baslik = g.baslik.trim().slice(0, 80);
  if (typeof g.sabit === "boolean") s.sabit = g.sabit || undefined;
  if (typeof g.arsiv === "boolean") { s.arsiv = g.arsiv || undefined; if (g.arsiv) s.sabit = undefined; }
  if (g.klasor === null) delete s.klasor;
  else if (typeof g.klasor === "string") { if (!(await klasorGetir(sahip, g.klasor))) return hata("Klasör bulunamadı.", 404); s.klasor = g.klasor; }
  if (g.secim && typeof g.secim.ust === "string" && s.mesajlar.some((m) => m.id === g.secim!.cocuk && (m.ust || "kok") === g.secim!.ust)) s.secim = { ...(s.secim ?? {}), [g.secim.ust]: g.secim.cocuk };
  if (g.izinModu === "otomatik" || g.izinModu === "onay") s.izinModu = g.izinModu;
  if (g.baglantiSecimi === null) delete s.baglantiSecimi;
  else if (Array.isArray(g.baglantiSecimi)) s.baglantiSecimi = g.baglantiSecimi.filter((x) => typeof x === "string").slice(0, 50);
  if (Array.isArray(g.kapaliYetenekler)) s.kapaliYetenekler = g.kapaliYetenekler.filter((x) => typeof x === "string").slice(0, 100);
  if (typeof g.bellekKapali === "boolean") s.bellekKapali = g.bellekKapali || undefined;
  if (g.efor && ["low", "medium", "high", "max"].includes(g.efor)) s.efor = g.efor;
  if (typeof g.ogrenme === "boolean") s.ogrenme = g.ogrenme || undefined;
  if (g.asistan === null) delete s.asistan;
  else if (typeof g.asistan === "string" && asistanBul(g.asistan) && !s.ajanId) s.asistan = g.asistan;
  if (g.geri) { const m = s.mesajlar.find((x) => x.id === g.geri!.mesajId && x.rol === "asistan"); if (m) { if (g.geri.deger) m.geri = g.geri.deger; else delete m.geri; } }
  // Başlık ve düzen değişiklikleri sohbetin sırasını bozmasın diye güncelleme zamanı değişmez.
  await sohbetKaydet(s, sahip);
  return Response.json({ ok: true, secim: s.secim });
}

/** Sil: paylaşım bağlantısı da kaldırılır. Süren tur durdurulur. */
export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const s = await sohbetGetir(id, sahip);
  if (!s) return hata("Sohbet bulunamadı.", 404);
  if (s.paylasim) await paylasimSil(s.paylasim.id).catch(() => {});
  yayinlar.get(id)?.durdur.abort();
  await sohbetSil(id, sahip);
  return Response.json({ ok: true });
}
