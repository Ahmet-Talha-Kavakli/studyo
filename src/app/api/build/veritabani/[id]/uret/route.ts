import { projeOku } from "@/lib/build/depo";
import { gunlukYaz } from "@/lib/build/gunluk";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { SINIR, alanlariTemizle, semayaUygula, veriDegistir, veriOku, yeniKayitId } from "@/lib/build/veri";
import { aiMetin } from "@/lib/build/yapayZeka";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Deneme verisi üretici: tablonun şemasına (yoksa mevcut kayıtlara) uygun, gerçekçi Türkçe kayıtlar üretip ekler.
 * POST { tablo, adet (1-50), yonerge? } → { eklendi, hatalar }
 */
export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const p = await projeOku(id, sahip);
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  if (!p) return bulunamadi();
  let g: { tablo?: string; adet?: number; yonerge?: string };
  try { g = await req.json(); } catch { return hata("Geçersiz gövde."); }
  const tablo = String(g.tablo ?? "");
  const adet = Math.min(50, Math.max(1, Math.round(Number(g.adet) || 10)));
  // Test görünümünden gelen istek Test ortamına yazar (?ortam=test).
  const ortam = new URL(req.url).searchParams.get("ortam") === "test" ? "test" as const : undefined;
  const v = await veriOku(id, ortam);
  const k = v.koleksiyonlar[tablo];
  if (!k) return hata("Tablo bulunamadı.");
  const yapi = k.sema?.length
    ? k.sema.map((s) => `- ${s.ad}: ${s.tur}${s.zorunlu ? ", zorunlu" : ""}${s.benzersiz ? ", benzersiz" : ""}${s.secenekler ? `, şunlardan biri: ${s.secenekler.join(" | ")}` : ""}${s.tur === "tarih" ? ", ISO 8601" : ""}${s.tur === "gorsel" ? ", https görsel adresi ya da boş" : ""}`).join("\n")
    : `Şemasız; mevcut kayıtlardaki alanlar: ${[...new Set(k.kayitlar.slice(-20).flatMap((r) => Object.keys(r)))].filter((a) => !["id", "olusturma", "guncelleme", "uyeId"].includes(a)).join(", ") || "ad, aciklama"}`;
  const ornek = k.kayitlar.slice(-3).map(({ id: _i, olusturma: _o, guncelleme: _g, uyeId: _u, ...r }) => r);
  let metin: string;
  try {
    metin = await aiMetin({
      sistem: "Yalnız geçerli JSON üret. Açıklama, markdown ya da kod bloğu yazma.",
      mesajlar: [{ rol: "kullanici", metin: `"${p.ad}" projesinin "${tablo}" tablosu${k.aciklama ? ` (${k.aciklama})` : ""} için ${adet} adet gerçekçi, çeşitli, Türkçe deneme kaydı üret.\nSütunlar:\n${yapi}\n${ornek.length ? `Mevcut kayıtlardan birkaçı (biçimi örnek al, tekrar etme):\n${JSON.stringify(ornek).slice(0, 2000)}\n` : ""}${g.yonerge ? `Ek yönerge: ${String(g.yonerge).slice(0, 500)}\n` : ""}Çıktı: {"kayitlar": [ ... ]}` }],
      enCok: 4000, signal: req.signal,
    });
  } catch (e) { return hata((e as Error).message === "AI_YOK" ? "Yapay zekâ motoru bu sunucuya bağlı değil." : "Veri üretilemedi; yeniden dene."); }
  let kayitlar: unknown[] = [];
  try {
    const bas = metin.indexOf("{"), son = metin.lastIndexOf("}");
    const j = JSON.parse(metin.slice(bas, son + 1)) as { kayitlar?: unknown[] };
    kayitlar = Array.isArray(j.kayitlar) ? j.kayitlar.slice(0, adet) : [];
  } catch { return hata("Model geçerli veri döndürmedi; yeniden dene."); }
  if (!kayitlar.length) return hata("Model kayıt döndürmedi; yeniden dene.");
  const sonuc = await veriDegistir(id, (vv) => {
    const kk = vv.koleksiyonlar[tablo];
    if (!kk) return { eklendi: 0, hatalar: ["Tablo silinmiş."] };
    let eklendi = 0; const hatalar: string[] = [];
    for (const [i, x] of kayitlar.entries()) {
      if (kk.kayitlar.length >= SINIR.kayit) break;
      const t = alanlariTemizle(x);
      if (!t) { hatalar.push(`${i + 1}. kayıt geçersiz`); continue; }
      const s = semayaUygula(kk, t, true);
      if ("hata" in s) { hatalar.push(`${i + 1}. kayıt: ${s.hata}`); continue; }
      const z = Date.now();
      kk.kayitlar.push({ id: yeniKayitId(), olusturma: z, guncelleme: z, ...s.alanlar });
      eklendi++;
    }
    return { eklendi, hatalar };
  }, ortam);
  gunlukYaz(id, { t: "veri", d: 201, m: `"${tablo}" tablosuna ${sonuc.eklendi} deneme kaydı üretildi` });
  return Response.json({ ok: true, ...sonuc });
}
