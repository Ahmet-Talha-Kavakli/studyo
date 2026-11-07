import { ajanGetir, surumAyari } from "@/lib/build/ajanDepo";
import { baglamKur, prosedurBaslat, prosedurIlerle, type PDurum, type POlay } from "@/lib/build/ajanProsedur";
import { prosedurDisOlay } from "@/lib/build/ajanProsedurDevam";
import { ADIM_TUR, prosedurSorunlari, prosedurTemizle, yeniPid, type Prosedur } from "@/lib/build/ajanProsedurTip";
import { zekaJson } from "@/lib/build/ajanZeka";
import { baglantiHam } from "@/lib/build/baglantiDepo";
import { sahipOzeti } from "@/lib/build/depo";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { icerikDenetle } from "@/lib/moderasyon";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Prosedür sayaçları ve "Bağlantı aracı" adımı için ajana bağlı servislerin araçları. */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const a = await ajanGetir((await params).id, sahip);
  if (!a) return hata("Ajan bulunamadı.", 404);
  const baglantilar = (await Promise.all((a.baglantilar ?? []).map((b) => baglantiHam(b, sahipOzeti(sahip))))).filter((b) => !!b).map((b) => ({ id: b!.id, ad: b!.ad, logo: b!.logo, araclar: (b!.araclar ?? []).slice(0, 200).map((t) => ({ ad: t.name, baslik: t.annotations?.title ?? t.title ?? t.name })) }));
  return Response.json({ ok: true, istatistik: a.prosedurIstat ?? {}, baglantilar });
}

/**
 * { islem: "dene", tanim, durum?, olay } prosedürü taslak hâliyle adım adım dener: gerçek motor, deneme yanıtı
 * verilmiş istek ve araç adımları onu kullanır, doğrulama kodu gönderilmez (ekranda görünür), web kancası ve
 * temsilci kararı düğmelerle verilir. Durum istemcide tutulur. · { islem: "tarif", metin } düz dille anlatılan
 * işi adımlara çevirir (bağlı model gerekir). · { islem: "karar", karar, not } düzenleyicinin Dene sohbetinde
 * temsilci onayı bekleyen prosedüre karar verir.
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const a = await ajanGetir(id, sahip);
  if (!a) return hata("Ajan bulunamadı.", 404);
  let g: { islem?: string; tanim?: unknown; durum?: PDurum; olay?: POlay; metin?: string; karar?: "evet" | "hayir"; not?: string } = {};
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }
  const sahipOz = sahipOzeti(sahip);

  if (g.islem === "dene") {
    const tanim = prosedurTemizle(g.tanim);
    const ayar = { ...surumAyari(a), prosedurler: [tanim] };
    const ctx = { ...baglamKur({ ajan: a, ayar, sahipOz, dosyaId: "prosedur-deneme", deneme: true }), webhookKaydet: async () => {} };
    const olay = g.olay ?? { tur: "baslat" as const };
    const d0 = g.durum && g.durum.pid === tanim.id && olay.tur !== "baslat" ? { ...g.durum, tanim } : prosedurBaslat(tanim, { ajanId: a.id, surum: null, kanal: "test", kisi: { ad: "Deneme Kişisi", eposta: "deneme@vayra.app" } });
    if (olay.tur === "mesaj" && olay.metin) { const dn = icerikDenetle(olay.metin); if (!dn.izin) return hata(dn.mesaj, 422); }
    const r = await prosedurIlerle(d0, olay.tur === "baslat" ? { tur: "baslat", neden: "Düzenleyicide deneme" } : olay, ctx);
    return Response.json({ ok: true, mesajlar: r.mesajlar, durum: r.durum, bitis: r.bitis, devret: r.devret, gecis: r.gecis, form: r.form, secenekler: r.secenekler, bekliyor: r.bekliyor, iz: r.son.iz.slice(-60), degiskenler: r.son.degiskenler, sorunlar: prosedurSorunlari(tanim) });
  }

  if (g.islem === "karar") {
    const r = await prosedurDisOlay({ ajanId: id, sahipOz, dosyaId: "deneme" }, { tur: "karar", evet: g.karar === "evet", kim: "Sen (deneme)", not: String(g.not ?? "").slice(0, 300) });
    return r.hata ? hata(r.hata) : Response.json({ ok: true });
  }

  if (g.islem === "tarif") {
    const metin = String(g.metin ?? "").trim().slice(0, 3000);
    if (metin.length < 10) return hata("İşi birkaç cümleyle anlat.");
    const dn = icerikDenetle(metin);
    if (!dn.izin) return hata(dn.mesaj, 422);
    const turler = Object.entries(ADIM_TUR).map(([k, v]) => `${k}: ${v.ad} (${v.alt})`).join("\n");
    const z = await zekaJson<Partial<Prosedur>>({
      model: a.model, enCok: 4000,
      sistem: `Bir destek ajanı için adım adım prosedür (iş akışı) tasarlıyorsun. Kullanıcının anlattığı işi aşağıdaki adım türleriyle JSON'a çevir. Türkçe yaz.
Adım türleri:\n${turler}
Kurallar: adımlar listedeki sırayla yürür; "sonraki" boşsa bir alttakine geçer, "son" bitirir. Her adımın kısa bir "id"si olsun (a1, a2 ...). "topla" adımında alanlar: { ad (değişken, harf ve alt çizgi), etiket, soru, tur (metin | eposta | telefon | sayi | tarih | secim | evethayir | siparis | tc | iban | plaka), secenekler (secim için), zorunlu }. "kosul" adımında dallar: [{ kosullar: [{ degisken, op (esit | esitDegil | icerir | buyuk | kucuk | dolu | bos), deger }], hepsi: true, git: adım id }], aksi: adım id. "istek" adımında yontem, url (https), govde (JSON metni, {{degisken}} kullan), kaydet. "onay" adımında kim (ziyaretci | temsilci), metin, evet ve hayir adım id. "bekle" adımında metin, sure (dakika), kaydet, zamanAsimi. "mesaj", "devret" (neden, metin), "bitir" (metin, sonuc: cozuldu). Metinlerde {{degisken}} kullanabilirsin.
JSON: {"ad": "...", "ne": "ne zaman başlar", "anahtarlar": ["..."], "adimlar": [...]}`,
      istem: metin,
    });
    if (!z) return Response.json({ ok: true, modelYok: true });
    if (!z.veri) return hata("Model geçerli bir prosedür üretmedi; tarifi biraz daha ayrıntılı yazıp yeniden dene.");
    const p = prosedurTemizle({ ...z.veri, id: yeniPid(), acik: true });
    return Response.json({ ok: true, prosedur: p, sorunlar: prosedurSorunlari(p) });
  }
  return hata("Bilinmeyen işlem.");
}
