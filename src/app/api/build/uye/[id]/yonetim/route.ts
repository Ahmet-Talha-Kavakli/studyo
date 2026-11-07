import { projeOku } from "@/lib/build/depo";
import { gunlukYaz } from "@/lib/build/gunluk";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { hata, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { epostaGonder, epostaKurulu } from "@/lib/build/bulutEposta";
import { EPOSTA_TURLERI, type EpostaTur } from "@/lib/build/epostaSablon";
import { sablonluEposta } from "@/lib/build/uyeEposta";
import { kokenBul, siteAdresi } from "@/lib/build/bulutKimlik";
import { denetimKim, denetimYaz } from "@/lib/build/bulutGecmis";
import {
  ikiAdimSifirla, kimlikAyarOku, kimlikAyarYaz, oturumlariKapat, sifirlamaBelirteci, SURESIZ, uyeAyrinti, uyeEkle, UyeHatasi, uyeleriListele, uyeSil, uyeYasakla,
} from "@/lib/build/uye";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Kimlik yönetimi (yalnız sahip).
 *  GET                      → { uyeler, ayarlar, eposta: { kurulu }, googleDonus, siteAdresi }
 *  GET ?uye=<id>            → { uye, ham, oturumlar }
 *  POST { islem: "ekle", eposta, ad?, sifre? }              → { uye, baglanti? }  (şifresiz: şifre belirleme bağlantısı)
 *  POST { islem: "yasakla", uyeId, sure: ms | "suresiz" }    POST { islem: "yasakKaldir", uyeId }
 *  POST { islem: "oturumKapat", uyeId }                     POST { islem: "sifirlama", uyeId } → { baglanti, bitis }
 *  POST { islem: "sil", uyeId }                             PATCH { ayarlar }  → { ayarlar }  (ayarlar.eposta: şablonlar ve marka)
 *  POST { islem: "sifirlama", uyeId, gonder: true }          bağlantıyı şablonlu e-postayla üyeye de yollar
 *  POST { islem: "epostaDene", tur, kime }                   şablonu örnek verilerle denemek için tek e-posta
 */
export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  const id = (await params).id;
  const p = sahip ? await projeOku(id, sahip) : null;
  if (!p) return yetkisiz();
  const uyeId = new URL(req.url).searchParams.get("uye");
  if (uyeId) { const a = await uyeAyrinti(id, uyeId); return a ? Response.json({ ok: true, ...a }) : hata("Üye bulunamadı.", 404); }
  const koken = kokenBul(req);
  return Response.json({ ok: true, uyeler: await uyeleriListele(id), ayarlar: await kimlikAyarOku(id), eposta: { kurulu: epostaKurulu() }, googleDonus: `${koken}/api/build/uye/${id}/google/geri`, oauthDonus: Object.fromEntries(["github", "microsoft", "apple"].map((x) => [x, `${koken}/api/build/uye/${id}/oauth/${x}/geri`])), alanAdi: new URL(koken).hostname, siteAdresi: siteAdresi(p, koken), yayinda: !!p.yayin });
}

export async function POST(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  const id = (await params).id;
  const p = sahip ? await projeOku(id, sahip) : null;
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  if (!p) return yetkisiz();
  let g: { islem?: string; uyeId?: string; eposta?: string; ad?: string; sifre?: string; sure?: number | "suresiz"; gonder?: boolean; tur?: string; kime?: string } = {};
  try { g = await req.json(); } catch { return hata("İstek okunamadı."); }
  const koken = kokenBul(req);
  const baglanti = (b: string) => `${koken}/api/build/uye/${id}/sifirla?t=${b}`;
  try {
    switch (g.islem) {
      case "ekle": {
        const r = await uyeEkle(id, { eposta: String(g.eposta ?? ""), ad: g.ad, sifre: g.sifre || undefined });
        gunlukYaz(id, { t: "uye", d: 201, m: `Sahip üye ekledi: ${r.uye.eposta}` });
        return Response.json({ ok: true, uye: r.uye, ...(r.belirtec ? { baglanti: baglanti(r.belirtec) } : {}) });
      }
      case "yasakla": {
        const sure = g.sure === "suresiz" ? SURESIZ : Number(g.sure);
        if (!(sure > 0)) return hata("Süre geçersiz.");
        const u = await uyeYasakla(id, String(g.uyeId), sure);
        gunlukYaz(id, { t: "uye", m: `Üye yasaklandı: ${u.eposta}${sure >= SURESIZ ? ", süresiz" : ""}` });
        return Response.json({ ok: true, uye: u });
      }
      case "yasakKaldir": { const u = await uyeYasakla(id, String(g.uyeId), null); gunlukYaz(id, { t: "uye", m: `Üyenin yasağı kaldırıldı: ${u.eposta}` }); return Response.json({ ok: true, uye: u }); }
      case "oturumKapat": { const n = await oturumlariKapat(id, String(g.uyeId)); gunlukYaz(id, { t: "uye", m: `Üyenin ${n} oturumu kapatıldı` }); return Response.json({ ok: true, kapanan: n }); }
      case "sifirlama": {
        const r = await sifirlamaBelirteci(id, String(g.uyeId));
        if (!g.gonder) { gunlukYaz(id, { t: "uye", m: "Şifre sıfırlama bağlantısı oluşturuldu" }); return Response.json({ ok: true, baglanti: baglanti(r.belirtec), bitis: r.bitis }); }
        if (!epostaKurulu()) return hata("E-posta servisi kurulu değil; bağlantıyı kopyalayıp üyeye kendin ilet.", 501);
        const u = (await uyeleriListele(id)).find((x) => x.id === String(g.uyeId));
        if (!u) return hata("Üye bulunamadı.", 404);
        const x = await epostaGonder({ projeId: id, kime: u.eposta, ...(await sablonluEposta(id, "sifre", p.ad, { ad: u.ad, eposta: u.eposta }, baglanti(r.belirtec))) });
        gunlukYaz(id, { t: "uye", d: x.ok ? 200 : 502, m: x.ok ? `Şifre sıfırlama e-postası gönderildi: ${u.eposta}` : `Şifre sıfırlama e-postası gönderilemedi: ${x.hata}` });
        return x.ok ? Response.json({ ok: true, gonderildi: true, baglanti: baglanti(r.belirtec), bitis: r.bitis }) : hata(x.hata, 502);
      }
      case "epostaDene": {
        const tur = EPOSTA_TURLERI.some((t) => t.id === g.tur) ? g.tur as EpostaTur : "dogrula";
        const kime = String(g.kime ?? "").trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(kime)) return hata("Geçerli bir e-posta yaz.");
        if (!epostaKurulu()) return hata("E-posta servisi kurulu değil; şablonu önizlemede görebilirsin ama gönderilemez.", 501);
        const e = await sablonluEposta(id, tur, p.ad, { ad: "Deniz", eposta: kime }, siteAdresi(p, koken));
        const x = await epostaGonder({ projeId: id, kime, ...e, konu: `[Deneme] ${e.konu}` });
        return x.ok ? Response.json({ ok: true }) : hata(x.hata, 502);
      }
      case "sil": { await uyeSil(id, String(g.uyeId)); gunlukYaz(id, { t: "uye", m: "Sahip bir üyeyi sildi" }); denetimYaz(id, { tur: "uye", kim: await denetimKim(id, sahip), mesaj: "Bir üye silindi" }); return Response.json({ ok: true }); }
      case "ikiAdimSifirla": { const u = await ikiAdimSifirla(id, String(g.uyeId)); gunlukYaz(id, { t: "uye", m: `Üyenin iki adımlı doğrulaması kaldırıldı: ${u.eposta || u.telefon || u.id}` }); denetimYaz(id, { tur: "uye", kim: await denetimKim(id, sahip), mesaj: `Üyenin iki adımlı doğrulaması kaldırıldı: ${u.eposta || u.telefon || u.id}` }); return Response.json({ ok: true, uye: u }); }
    }
  } catch (e) { return hata(e instanceof UyeHatasi ? e.message : "İşlem yapılamadı."); }
  return hata("Bilinmeyen işlem.");
}

export async function PATCH(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  const id = (await params).id;
  const p = sahip ? await projeOku(id, sahip) : null;
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  if (!p) return yetkisiz();
  let g: { ayarlar?: Parameters<typeof kimlikAyarYaz>[1] } = {};
  try { g = await req.json(); } catch { return hata("İstek okunamadı."); }
  if (!g.ayarlar) return hata("Ayar yok.");
  if (!epostaKurulu()) { delete g.ayarlar.epostaDogrulama; delete g.ayarlar.sihirliBaglanti; }
  try {
    const a = await kimlikAyarYaz(id, g.ayarlar);
    gunlukYaz(id, { t: "uye", m: "Kimlik ayarları değişti" });
    const alanlar = Object.keys(g.ayarlar).map((k) => ({ kayitKapali: "kayıtlar", minSifre: "şifre uzunluğu", yonlendirmeler: "dönüş adresleri", oturumGun: "oturum süresi", epostaDogrulama: "e-posta doğrulama", sihirliBaglanti: "e-posta bağlantısı", google: "Google ile giriş", eposta: "e-posta şablonları", oauth: `${Object.keys(g.ayarlar!.oauth ?? {}).join(", ")} ile giriş`, sms: "SMS ile kod", epostaKod: "e-postayla kod", anonim: "misafir girişi", ikiAdim: "iki adımlı doğrulama" } as Record<string, string>)[k] ?? k);
    denetimYaz(id, { tur: "kimlik", kim: await denetimKim(id, sahip), mesaj: `Kimlik ayarı değişti: ${alanlar.join(", ")}` });
    return Response.json({ ok: true, ayarlar: a });
  } catch (e) { return hata(e instanceof UyeHatasi ? e.message : "Kaydedilemedi."); }
}
