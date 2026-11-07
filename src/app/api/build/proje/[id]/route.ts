import { randomBytes } from "crypto";
import { calisanlar } from "@/lib/build/ajanCalisan";
import { ajanBaglamiSifirla, altAlanAyir, projeErisimi, projeOku, projeSil, projeYaz, surumEkle, DOSYA_SINIRI, projeCopeAt, COP_GUN } from "@/lib/build/depo";
import { ekipOku, YetkiHatasi } from "@/lib/build/ekipDepo";
import { IZLEYICI_HATASI } from "@/lib/build/ekipOrtak";
import { istemciyeProje, uyeSirlariniBirlestir } from "@/lib/build/ekipRota";
import { bulunamadi, hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { yolGecerli, type BuildMesaj, type ProjeAyarlar } from "@/lib/build/tipler";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const [p, rol] = await Promise.all([projeOku(id, sahip), projeErisimi(id, sahip)]);
  if (!p || !rol) return bulunamadi();
  // ekipRol: sahip | duzenleyici | izleyici; ekipSayisi: sahip dışındaki üye sayısı.
  return Response.json({ ok: true, proje: istemciyeProje(p, rol, (await ekipOku(id)).uyeler.length) });
}

/**
 * Güncelleme. Alanlar (hepsi isteğe bağlı):
 *  dosyalar + aciklama + kaynak  → dosyaları değiştirir, yeni sürüm ekler
 *  geriYukle: surumId             → o sürümün dosyalarını yeni sürüm olarak geri getirir (doğrusal geçmiş)
 *  yerImi: { surumId, acik }      → sürümü yıldızlar
 *  surumAdi: { surumId, ad }      → sürüm açıklamasını değiştirir
 *  ad, kapak, ayarlar (kısmi), mesajlar (arayüz mesajları)
 */
export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const rol = await projeErisimi(id, sahip);
  if (!rol) return bulunamadi();
  if (rol === "izleyici") return hata(IZLEYICI_HATASI, 403);
  const p = await projeOku(id, sahip);
  if (!p) return bulunamadi();
  let g: {
    dosyalar?: Record<string, string>; aciklama?: string; kaynak?: "elle" | "stil"; geriYukle?: string;
    yerImi?: { surumId: string; acik: boolean }; surumAdi?: { surumId: string; ad: string };
    ad?: string; kapak?: string; ayarlar?: Partial<ProjeAyarlar>; mesajlar?: BuildMesaj[]; yildiz?: boolean; klasor?: string;
    yeniSohbet?: boolean; geriDon?: { mesajId: string; kod?: boolean };
  };
  try { g = await req.json(); } catch { return hata("Geçersiz istek."); }

  let surum = null;
  if (g.dosyalar) {
    for (const [y, d] of Object.entries(g.dosyalar)) {
      if (!yolGecerli(y)) return hata(`Geçersiz dosya yolu: ${y}`);
      if (typeof d !== "string" || d.length > DOSYA_SINIRI) return hata(`${y} çok büyük (400 KB sınırı).`);
    }
    surum = surumEkle(p, g.dosyalar, String(g.aciklama || "Elle düzenleme").slice(0, 120), g.kaynak === "stil" ? "stil" : "elle");
  }
  if (g.geriYukle) {
    const s = p.surumler.find((x) => x.id === g.geriYukle);
    if (!s) return hata("Sürüm bulunamadı.", 404);
    surum = surumEkle(p, { ...s.dosyalar }, `Sürüm ${s.no}'e dönüldü`, "geri");
  }
  if (g.yerImi) { const s = p.surumler.find((x) => x.id === g.yerImi!.surumId); if (s) s.yerImi = !!g.yerImi.acik; }
  if (g.surumAdi) { const s = p.surumler.find((x) => x.id === g.surumAdi!.surumId); if (s) s.aciklama = String(g.surumAdi.ad).slice(0, 120) || s.aciklama; }
  if (typeof g.ad === "string" && g.ad.trim()) p.ad = g.ad.trim().slice(0, 60);
  if (typeof g.kapak === "string") p.kapak = g.kapak.slice(0, 500);
  if (g.ayarlar) {
    const a = g.ayarlar;
    if (typeof a.altAlan === "string" && a.altAlan !== p.ayarlar.altAlan) {
      try { await altAlanAyir(a.altAlan, p.id, p.ayarlar.altAlan); } catch (e) { return hata((e as Error).message); }
      p.ayarlar.altAlan = a.altAlan;
    }
    if (a.gorunurluk === "herkes" || a.gorunurluk === "sifreli") p.ayarlar.gorunurluk = a.gorunurluk;
    if (typeof a.sifre === "string") p.ayarlar.sifre = a.sifre.slice(0, 64);
    if (a.seo) p.ayarlar.seo = { ...p.ayarlar.seo, ...a.seo, baslik: String(a.seo.baslik ?? p.ayarlar.seo.baslik).slice(0, 70), aciklama: String(a.seo.aciklama ?? p.ayarlar.seo.aciklama).slice(0, 170) };
    if (Array.isArray(a.sirlar)) {
      const yeni = a.sirlar.filter((s) => /^[A-Z][A-Z0-9_]{1,40}$/.test(s.ad)).slice(0, 40).map((s) => ({ ad: s.ad, deger: String(s.deger).slice(0, 2000), gorunurluk: s.gorunurluk === "herkese" ? "herkese" as const : "sunucu" as const }));
      // Ödeme anahtarları yalnız sahibin: düzenleyici onlara dokunamaz, var olanlar korunur.
      p.ayarlar.sirlar = rol === "sahip" ? yeni : uyeSirlariniBirlestir(p.ayarlar.sirlar, yeni).slice(0, 40);
    }
    if (typeof a.rozet === "boolean") p.ayarlar.rozet = a.rozet;
    if (a.ai && typeof a.ai === "object") {
      const o = p.ayarlar.ai ?? { acik: false, gunlukSinir: 200, sistem: "" };
      p.ayarlar.ai = { acik: typeof a.ai.acik === "boolean" ? a.ai.acik : o.acik, gunlukSinir: Math.min(100000, Math.max(1, Math.round(Number(a.ai.gunlukSinir ?? o.gunlukSinir)) || 200)), sistem: String(a.ai.sistem ?? o.sistem).slice(0, 4000) };
    }
    if (typeof a.talimat === "string") p.ayarlar.talimat = a.talimat.slice(0, 10000);
    if (a.ajanIzinleri && typeof a.ajanIzinleri === "object") {
      const o: Record<string, string> = {};
      for (const [k2, v] of Object.entries(a.ajanIzinleri)) if (["veritabani", "dosyaSil", "gorsel", "test", "hafiza"].includes(k2) && ["her-zaman", "sor", "asla"].includes(String(v))) o[k2] = String(v);
      p.ayarlar.ajanIzinleri = o as typeof p.ayarlar.ajanIzinleri;
    }
    if (Array.isArray(a.hafiza)) p.ayarlar.hafiza = a.hafiza.filter((x) => x && typeof x.metin === "string" && x.metin.trim()).slice(0, 50).map((x) => ({ id: String(x.id || Math.random().toString(36).slice(2, 10)).slice(0, 20), metin: x.metin.trim().slice(0, 300), zaman: Number(x.zaman) || Date.now() }));
  }
  if (Array.isArray(g.mesajlar)) p.mesajlar = g.mesajlar.slice(-400);
  /* Yeni sohbet: ajanın bağlamı sıfırlanır (proje, dosyalar, hafıza ve talimatlar kalır), sohbete ayraç düşer. */
  if (g.yeniSohbet) {
    if (calisanlar.has(id)) return hata("Ajan çalışırken yeni sohbet açılamaz; önce durdur.", 409);
    await ajanBaglamiSifirla(id);
    p.mesajlar.push({ id: randomBytes(6).toString("base64url"), rol: "asistan", zaman: Date.now(), metin: "", durum: "bitti", ayrac: { tur: "yeni-sohbet" } });
  }
  /*
   * Bir mesaja geri dön: o mesajdan sonrakiler silinir. kod açıksa dosyalar o noktadaki sürüme döner (yeni sürüm olarak,
   * geçmiş doğrusal kalır). Ajanın API geçmişi sıfırlanır; kalan konuşmanın özeti bir sonraki tura bir kez eklenir.
   */
  if (g.geriDon) {
    if (calisanlar.has(id)) return hata("Ajan çalışırken geri dönülemez; önce durdur.", 409);
    const i = p.mesajlar.findIndex((m) => m.id === g.geriDon!.mesajId);
    if (i < 0) return hata("Mesaj bulunamadı.", 404);
    const kalan = p.mesajlar.slice(0, i + 1);
    const silinen = p.mesajlar.length - kalan.length;
    let surumNo: number | undefined;
    if (g.geriDon.kod) {
      // O noktadaki kod: kalan mesajlardaki son sürüm; hiç yoksa ilk sürüm (proje oluşturuldu / şablon).
      const sid = [...kalan].reverse().find((m) => m.surumId)?.surumId;
      const s = (sid ? p.surumler.find((x) => x.id === sid) : null) ?? p.surumler[0];
      if (s) { surum = surumEkle(p, { ...s.dosyalar }, `Sürüm ${s.no}'e geri dönüldü (sohbetten)`, "geri") ?? surum; surumNo = s.no; }
    }
    const ozet = kalan.filter((m) => !m.ayrac && (m.metin || m.plan)).slice(-16).map((m) => `${m.rol === "kullanici" ? "Kullanıcı" : "Sen"}: ${(m.metin || m.plan?.baslik || "").replace(/\s+/g, " ").slice(0, 600)}`).join("\n");
    await ajanBaglamiSifirla(id, ozet);
    p.mesajlar = [...kalan, { id: randomBytes(6).toString("base64url"), rol: "asistan", zaman: Date.now(), metin: "", durum: "bitti", ayrac: { tur: "geri-donus", kod: !!g.geriDon.kod, surumNo, silinen } }];
  }
  // Yıldız ve klasör yalnız düzeni değiştirir; "son düzenleme" zamanına dokunmaz.
  const yalnizDuzen = Object.keys(g).every((a) => a === "yildiz" || a === "klasor");
  // Yıldız ve klasör sahibin proje listesini düzenler; ekip üyeleri değiştiremez.
  if (rol !== "sahip" && (typeof g.yildiz === "boolean" || typeof g.klasor === "string")) {
    if (yalnizDuzen) return hata("Yıldız ve klasör yalnız proje sahibinin listesini düzenler.", 403);
    delete g.yildiz; delete g.klasor;
  }
  if (typeof g.yildiz === "boolean") p.yildiz = g.yildiz;
  if (typeof g.klasor === "string") p.klasor = g.klasor.trim().slice(0, 40) || undefined;
  if (!yalnizDuzen) p.guncelleme = Date.now();
  try { await projeYaz(p, sahip); } catch (e) { return hata((e as Error).message, e instanceof YetkiHatasi ? 403 : 413); }
  return Response.json({ ok: true, proje: istemciyeProje(p, rol, (await ekipOku(id)).uyeler.length), surum });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  const rol = await projeErisimi(id, sahip);
  if (!rol) return bulunamadi();
  if (rol !== "sahip") return hata("Projeyi yalnız sahibi silebilir. Ekipten çıkmak için Ekip panelinden ayrıl.", 403);
  // Deneme dalları ve paralel görevler kalıcı silinir; projeler 30 gün çöp kutusunda bekler (?kalici=1 ile hemen).
  const p = await projeOku(id, sahip);
  if (p?.taslak || new URL(req.url).searchParams.get("kalici") === "1") return (await projeSil(id, sahip)) ? Response.json({ ok: true }) : bulunamadi();
  return (await projeCopeAt(id, sahip)) ? Response.json({ ok: true, cop: true, gun: COP_GUN }) : bulunamadi();
}
