import { projeOku } from "@/lib/build/depo";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { denetimKim, denetimYaz } from "@/lib/build/bulutGecmis";
import { KIP_KURAL, veriAyarDegistir, veriAyarOku, yeniTabloDurumu, YENI_TABLO_KAPALI_BASLANGIC, type OdaErisim, type YeniTabloKip } from "@/lib/build/bulutVeriAyar";
import { KURALLAR, veriOku, type Kural, type Kurallar } from "@/lib/build/veri";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Veri ayarları (yalnız sahip ve ekip; yazma izleyiciye kapalı).
 *  GET → { yeniTablo: { kip, kurallar, kaynak }, oda, acikTablolar }
 *  PATCH { yeniTablo?: { kip: "kapali"|"acik"|"ozel", kurallar? } | null, oda?: { yazma?, okuma? } }
 *   yeniTablo: null → ayar silinir, proje açılış tarihine göre varsayılan döner.
 */
const KURAL_AD: Record<string, string> = { herkes: "herkes", uyeler: "üyeler", sahibi: "kaydın sahibi", kapali: "yalnız sen" };

export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  const v = await veriOku(id);
  return Response.json({
    ok: true, yeniTablo: await yeniTabloDurumu(id), oda: (await veriAyarOku(id)).oda, baslangic: YENI_TABLO_KAPALI_BASLANGIC,
    acikTablolar: Object.entries(v.koleksiyonlar).filter(([, k]) => k.kurallar.okuma === "herkes" || k.kurallar.ekleme === "herkes").map(([ad, k]) => ({ ad, kurallar: k.kurallar })),
  });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  let g: { yeniTablo?: { kip?: string; kurallar?: Partial<Kurallar> } | null; oda?: { yazma?: string; okuma?: string } } = {};
  try { g = await req.json(); } catch { return hata("İstek okunamadı."); }
  const olaylar: string[] = [];
  let sorun = "";
  await veriAyarDegistir(id, (a) => {
    if (g.yeniTablo === null) { delete a.yeniTablo; olaylar.push("Yeni tablo varsayılanı proje açılış tarihine göre belirlenecek"); }
    else if (g.yeniTablo) {
      const kip = g.yeniTablo.kip as YeniTabloKip;
      if (kip !== "kapali" && kip !== "acik" && kip !== "ozel") { sorun = "Kip geçersiz."; return; }
      let kurallar: Kurallar;
      if (kip === "ozel") {
        const k = g.yeniTablo.kurallar ?? {};
        if (!(["okuma", "ekleme", "duzenleme"] as const).every((x) => KURALLAR.includes(k[x] as Kural))) { sorun = "Özel kip için okuma, ekleme ve düzenleme kuralı seç."; return; }
        kurallar = { okuma: k.okuma!, ekleme: k.ekleme!, duzenleme: k.duzenleme! };
      } else kurallar = { ...KIP_KURAL[kip] };
      a.yeniTablo = { kip, kurallar, zaman: Date.now() };
      olaylar.push(`Yeni tablolar için varsayılan erişim: okuma ${KURAL_AD[kurallar.okuma]}, ekleme ${KURAL_AD[kurallar.ekleme]}, düzenleme ${KURAL_AD[kurallar.duzenleme]}`);
    }
    if (g.oda) {
      const y = g.oda.yazma as OdaErisim, o = g.oda.okuma;
      if (y && (y === "herkes" || y === "uyeler" || y === "sunucu") && y !== a.oda.yazma) { a.oda.yazma = y; olaylar.push(`Odalara yazma: ${y === "herkes" ? "herkes" : y === "uyeler" ? "üyeler" : "yalnız sunucu fonksiyonları"}`); }
      if ((o === "herkes" || o === "uyeler") && o !== a.oda.okuma) { a.oda.okuma = o; olaylar.push(`Odaları izleme: ${o === "herkes" ? "herkes" : "üyeler"}`); }
    }
  });
  if (sorun) return hata(sorun);
  const kim = await denetimKim(id, sahip);
  for (const m of olaylar) denetimYaz(id, { tur: "ayar", kim, mesaj: m });
  return Response.json({ ok: true, yeniTablo: await yeniTabloDurumu(id), oda: (await veriAyarOku(id)).oda });
}
