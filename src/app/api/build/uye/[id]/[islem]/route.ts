import { projeOku, projeOkuHam } from "@/lib/build/depo";
import { gunlukYaz } from "@/lib/build/gunluk";
import { izleyiciEngeli } from "@/lib/build/ekipRota";
import { sahipAl } from "@/lib/build/sunucu";
import { anonimGiris, belirtecKullan, belirtecUret, cikisYap, girisYap, ikiAdimGiris, ikiAdimKapat, ikiAdimKur, ikiAdimOnayla, kayitOl, kimlikAyarOku, kodHazirla, kodIleGiris, oturumdanUye, sifirlamaBelirteci, smsAyari, UyeHatasi, uyeBulEposta, uyeleriListele, uyeSil } from "@/lib/build/uye";
import { netgsmGonder, telefonMaskele, telefonTemizle } from "@/lib/build/bulutSms";
import qrcode from "qrcode-generator";
import { sablonluEposta } from "@/lib/build/uyeEposta";
import { epostaGonder, epostaKurulu } from "@/lib/build/bulutEposta";
import { donusDogrula, kokenBul, siteAdresi } from "@/lib/build/bulutKimlik";
import { veriDegistir } from "@/lib/build/veri";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; islem: string }> };

/**
 * Vayra Üyelik API (proje sitesinden, kum havuzu içinden çağrılır; CORS açık).
 *  POST kayit {eposta, sifre, ad}   POST giris {eposta, sifre}   POST cikis   GET ben   (oturum: x-vayra-oturum)
 *  GET liste (yalnız sahip)   DELETE uye?id= (yalnız sahip)
 *  POST sifremiUnuttum {eposta}  kayıtlı üyeye şifre sıfırlama bağlantısı (24 saat; yanıt hesap olsun olmasın aynı)
 *  POST baglanti {eposta, donus}  sihirli bağlantı (yalnız e-posta servisi kuruluysa ve ayar açıksa; yoksa 501)
 *  POST hesabiSil   (oturum: x-vayra-oturum) üye kendi hesabını siler: "sahibi" kurallı tablolardaki kendi kayıtları
 *                    silinir, bütün oturumları kapanır (App Store 5.1.1(v), Google Play hesap silme kuralı)
 *  GET baglanti?t=   bağlantıyla oturum açar, #vayra-oturum ile siteye döner    GET dogrula?t=   e-postayı doğrular
 * Giriş yanıtı { mfa } ise üyede iki adımlı doğrulama açıktır: POST ikiAdimGiris { mfa, kod } oturumu açar.
 *  POST ikiAdimKur (oturum) → { gizli, uri, qr }   POST ikiAdimOnayla { kod } → { kurtarmaKodlari }   POST ikiAdimKapat { kod }
 *  POST kodGonder { kanal: "sms" | "eposta", hedef } (Netgsm ya da e-posta servisi; deneme numarasında gönderilmez)
 *  POST kodGiris { kanal, hedef, kod } → oturum ya da mfa      POST anonim → misafir oturumu (kayit sonra kalıcı hesap yapar)
 */
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-vayra-oturum, x-build-sahip" };
const y = (v: unknown, d = 200) => new Response(JSON.stringify(v), { status: d, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...CORS } });
const sayac = new Map<string, number[]>();
const sinirli = (a: string, n: number) => { const z = Date.now(), l = (sayac.get(a) ?? []).filter((t) => z - t < 10 * 60_000); l.push(z); sayac.set(a, l); return l.length > n; };

export async function POST(req: Request, { params }: Ctx) {
  const { id, islem } = await params;
  if (!(await projeOkuHam(id))) return y({ ok: false, hata: "Proje yok." }, 404);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "yerel";
  let g: { eposta?: string; sifre?: string; ad?: string; donus?: string; mfa?: string; kod?: string; kanal?: string; hedef?: string } = {};
  try { g = await req.json(); } catch { /* boş gövde (çıkış) */ }
  try {
    if (islem === "kayit") {
      if (sinirli(`k:${ip}:${id}`, 10)) return y({ ok: false, hata: "Çok fazla deneme; biraz sonra tekrar dene." }, 429);
      const r = await kayitOl(id, String(g.eposta ?? ""), String(g.sifre ?? ""), String(g.ad ?? ""), req.headers.get("x-vayra-oturum"));
      gunlukYaz(id, { t: "uye", d: 201, m: r.yukseltildi ? "Misafir üye kalıcı hesaba geçti" : "Yeni üye kaydı" });
      // E-posta doğrulaması: yalnız servis kuruluysa ve sahip açtıysa gönderilir (beklenmez).
      if (epostaKurulu() && (await kimlikAyarOku(id)).epostaDogrulama) {
        const p = await projeOkuHam(id);
        const b = await belirtecUret(id, "dogrula", r.uye.eposta);
        const s = await sablonluEposta(id, "dogrula", p?.ad ?? "Site", { ad: r.uye.ad, eposta: r.uye.eposta }, `${kokenBul(req)}/api/build/uye/${id}/dogrula?t=${b}`);
        epostaGonder({ projeId: id, kime: r.uye.eposta, ...s }).then((x) => gunlukYaz(id, { t: "uye", d: x.ok ? 200 : 502, m: x.ok ? "Doğrulama e-postası gönderildi" : `Doğrulama e-postası gönderilemedi: ${x.hata}` }));
      }
      return y({ ok: true, ...r });
    }
    if (islem === "giris") {
      if (sinirli(`g:${ip}:${id}`, 20)) return y({ ok: false, hata: "Çok fazla deneme; 10 dakika sonra tekrar dene." }, 429);
      { const r = await girisYap(id, String(g.eposta ?? ""), String(g.sifre ?? "")); gunlukYaz(id, { t: "uye", d: 200, m: r.mfa ? "Üye girişi, ikinci adım bekleniyor" : "Üye girişi" }); return y({ ok: true, ...r }); }
    }
    if (islem === "ikiAdimGiris") {
      if (sinirli(`m:${ip}:${id}`, 20)) return y({ ok: false, hata: "Çok fazla deneme; 10 dakika sonra tekrar dene." }, 429);
      const r = await ikiAdimGiris(id, String(g.mfa ?? ""), String(g.kod ?? ""));
      gunlukYaz(id, { t: "uye", d: 200, m: r.kurtarmaKullanildi ? `İki adımlı giriş, kurtarma koduyla (${r.kalanKurtarma} kod kaldı)` : "İki adımlı giriş" });
      return y({ ok: true, ...r });
    }
    if (islem === "ikiAdimKur" || islem === "ikiAdimOnayla" || islem === "ikiAdimKapat") {
      const uye = await oturumdanUye(id, req.headers.get("x-vayra-oturum"));
      if (!uye) return y({ ok: false, hata: "Önce giriş yap." }, 401);
      if (sinirli(`i:${ip}:${id}`, 20)) return y({ ok: false, hata: "Çok fazla deneme; biraz sonra tekrar dene." }, 429);
      if (islem === "ikiAdimKur") {
        const p = await projeOkuHam(id);
        const r = await ikiAdimKur(id, uye.id, p?.ad ?? "Site");
        const q = qrcode(0, "M"); q.addData(r.uri); q.make();
        return y({ ok: true, ...r, qr: q.createDataURL(5, 2) });
      }
      if (islem === "ikiAdimOnayla") { const r = await ikiAdimOnayla(id, uye.id, String(g.kod ?? "")); gunlukYaz(id, { t: "uye", d: 200, m: "Üye iki adımlı doğrulamayı açtı" }); return y({ ok: true, ...r }); }
      await ikiAdimKapat(id, uye.id, String(g.kod ?? "")); gunlukYaz(id, { t: "uye", d: 200, m: "Üye iki adımlı doğrulamayı kapattı" }); return y({ ok: true });
    }
    if (islem === "kodGonder") {
      const kanal = g.kanal === "sms" ? "sms" : "eposta";
      if (sinirli(`o:${ip}:${id}`, 10)) return y({ ok: false, hata: "Çok fazla kod istendi; 10 dakika sonra tekrar dene." }, 429);
      const hedef = kanal === "sms" ? telefonTemizle(String(g.hedef ?? "")) : String(g.hedef ?? "").trim().toLocaleLowerCase("tr-TR");
      if (!hedef || (kanal === "eposta" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hedef))) return y({ ok: false, hata: kanal === "sms" ? "Geçerli bir Türkiye cep telefonu numarası yaz (05xx xxx xx xx)." : "Geçerli bir e-posta yaz." }, 400);
      if (kanal === "eposta" && !epostaKurulu()) return y({ ok: false, hata: "Bu sitede e-posta gönderimi kurulu değil; kod gönderilemez." }, 501);
      const sms = kanal === "sms" ? await smsAyari(id) : null;
      if (kanal === "sms" && (!sms?.kullanici || !sms.sifre || !sms.baslik)) return y({ ok: false, hata: "Bu sitede SMS servisi kurulu değil; site sahibi Bulut, Kimlik bölümünden Netgsm bilgilerini girmeli." }, 501);
      const p = (await projeOkuHam(id))!;
      const k = await kodHazirla(id, kanal, hedef);
      if (k.deneme) { gunlukYaz(id, { t: "uye", d: 200, m: `Deneme numarasına kod (SMS gönderilmedi): ${telefonMaskele(hedef)}` }); return y({ ok: true, deneme: true }); }
      const metin = kanal === "sms" ? sms!.sablon.replace(/\{kod\}/g, k.kod).replace(/\{site\}/g, p.ad) : "";
      const x = kanal === "sms" ? await netgsmGonder({ kullanici: sms!.kullanici, sifre: sms!.sifre, baslik: sms!.baslik }, hedef, metin)
        : await epostaGonder({ projeId: id, kime: hedef, konu: `${p.ad} giriş kodun: ${k.kod}`, metin: `${p.ad} sitesine giriş kodun: ${k.kod}\n\nKod 5 dakika geçerli. Bu isteği sen yapmadıysan bu e-postayı yok say.`, site: p.ad });
      gunlukYaz(id, { t: "uye", d: x.ok ? 200 : 502, m: x.ok ? `Giriş kodu gönderildi (${kanal === "sms" ? `SMS, ${telefonMaskele(hedef)}` : "e-posta"})` : `Giriş kodu gönderilemedi: ${"hata" in x ? x.hata : ""}` });
      return x.ok ? y({ ok: true }) : y({ ok: false, hata: kanal === "sms" ? `SMS gönderilemedi: ${"hata" in x ? x.hata : ""}` : "E-posta gönderilemedi, biraz sonra tekrar dene." }, 502);
    }
    if (islem === "kodGiris") {
      const kanal = g.kanal === "sms" ? "sms" : "eposta";
      if (sinirli(`c:${ip}:${id}`, 20)) return y({ ok: false, hata: "Çok fazla deneme; 10 dakika sonra tekrar dene." }, 429);
      const hedef = kanal === "sms" ? telefonTemizle(String(g.hedef ?? "")) : String(g.hedef ?? "").trim().toLocaleLowerCase("tr-TR");
      if (!hedef) return y({ ok: false, hata: "Numara ya da e-posta geçersiz." }, 400);
      const r = await kodIleGiris(id, kanal, hedef, String(g.kod ?? ""));
      gunlukYaz(id, { t: "uye", d: 200, m: `Kodla giriş (${kanal === "sms" ? "SMS" : "e-posta"})` });
      return y({ ok: true, ...r });
    }
    if (islem === "anonim") {
      if (sinirli(`a:${ip}:${id}`, 10)) return y({ ok: false, hata: "Çok fazla deneme; biraz sonra tekrar dene." }, 429);
      const r = await anonimGiris(id);
      gunlukYaz(id, { t: "uye", d: 201, m: "Misafir girişi" });
      return y({ ok: true, ...r });
    }
    if (islem === "baglanti") {
      if (!epostaKurulu()) return y({ ok: false, hata: "Bu sitede e-posta gönderimi kurulu değil; sihirli bağlantı gönderilemez." }, 501);
      const ayar = await kimlikAyarOku(id);
      if (!ayar.sihirliBaglanti) return y({ ok: false, hata: "Bu sitede e-postayla bağlantı girişi kapalı." }, 403);
      if (sinirli(`b:${ip}:${id}`, 5)) return y({ ok: false, hata: "Çok fazla deneme; 10 dakika sonra tekrar dene." }, 429);
      const e = String(g.eposta ?? "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return y({ ok: false, hata: "Geçerli bir e-posta yaz." }, 400);
      const p = (await projeOkuHam(id))!;
      const koken = kokenBul(req);
      const donus = donusDogrula(p, g.donus, koken, ayar.yonlendirmeler) ?? siteAdresi(p, koken);
      const b = await belirtecUret(id, "baglanti", e, donus);
      const x = await epostaGonder({ projeId: id, kime: e, ...(await sablonluEposta(id, "baglanti", p.ad, { eposta: e }, `${koken}/api/build/uye/${id}/baglanti?t=${b}`)) });
      gunlukYaz(id, { t: "uye", d: x.ok ? 200 : 502, m: x.ok ? "Giriş bağlantısı gönderildi" : `Giriş bağlantısı gönderilemedi: ${x.hata}` });
      return x.ok ? y({ ok: true }) : y({ ok: false, hata: "E-posta gönderilemedi, biraz sonra tekrar dene." }, 502);
    }
    if (islem === "sifremiUnuttum") {
      // Hesap var mı yok mu açığa çıkmasın diye yanıt her zaman aynıdır; e-posta yalnız kayıtlı üyeye gider.
      if (!epostaKurulu()) return y({ ok: false, hata: "Bu sitede e-posta gönderimi kurulu değil; şifre sıfırlama bağlantısı gönderilemez. Site sahibine yaz." }, 501);
      if (sinirli(`u:${ip}:${id}`, 5)) return y({ ok: false, hata: "Çok fazla deneme; 10 dakika sonra tekrar dene." }, 429);
      const e = String(g.eposta ?? "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return y({ ok: false, hata: "Geçerli bir e-posta yaz." }, 400);
      const u = await uyeBulEposta(id, e);
      if (u) {
        const p = (await projeOkuHam(id))!;
        const r = await sifirlamaBelirteci(id, u.id);
        const x = await epostaGonder({ projeId: id, kime: u.eposta, ...(await sablonluEposta(id, "sifre", p.ad, { ad: u.ad, eposta: u.eposta }, `${kokenBul(req)}/api/build/uye/${id}/sifirla?t=${r.belirtec}`)) });
        gunlukYaz(id, { t: "uye", d: x.ok ? 200 : 502, m: x.ok ? "Şifre sıfırlama e-postası gönderildi" : `Şifre sıfırlama e-postası gönderilemedi: ${x.hata}` });
      }
      return y({ ok: true });
    }
    if (islem === "hesabiSil") {
      if (sinirli(`s:${ip}:${id}`, 5)) return y({ ok: false, hata: "Çok fazla deneme; biraz sonra tekrar dene." }, 429);
      const uye = await oturumdanUye(id, req.headers.get("x-vayra-oturum"));
      if (!uye) return y({ ok: false, hata: "Hesabı silmek için giriş yapmış olmalısın." }, 401);
      // Üyenin kendi kayıtları: okuma, ekleme ya da düzenleme kuralı "sahibi" olan tablolarda uyeId alanı bu üye olanlar.
      const silinen = await veriDegistir(id, (v) => {
        let n = 0;
        for (const k of Object.values(v.koleksiyonlar)) {
          if (![k.kurallar.okuma, k.kurallar.ekleme, k.kurallar.duzenleme].includes("sahibi")) continue;
          const once = k.kayitlar.length;
          k.kayitlar = k.kayitlar.filter((x) => x.uyeId !== uye.id);
          n += once - k.kayitlar.length;
        }
        return n;
      });
      await uyeSil(id, uye.id);
      gunlukYaz(id, { t: "uye", d: 200, m: `Üye kendi hesabını sildi (${silinen} kişisel kayıt silindi)` });
      return y({ ok: true, silinenKayit: silinen });
    }
    if (islem === "cikis") { const o = req.headers.get("x-vayra-oturum"); if (o) await cikisYap(id, o); return y({ ok: true }); }
  } catch (e) {
    return y({ ok: false, hata: e instanceof UyeHatasi ? e.message : "İşlem yapılamadı." }, e instanceof UyeHatasi ? 400 : 500);
  }
  return y({ ok: false, hata: "Bilinmeyen işlem." }, 404);
}

export async function GET(req: Request, { params }: Ctx) {
  const { id, islem } = await params;
  if (islem === "ben") return y({ ok: true, uye: await oturumdanUye(id, req.headers.get("x-vayra-oturum")) });
  if (islem === "baglanti" || islem === "dogrula") {
    const p = await projeOkuHam(id);
    if (!p) return y({ ok: false, hata: "Proje yok." }, 404);
    const site = siteAdresi(p, kokenBul(req));
    try {
      const r = await belirtecKullan(id, new URL(req.url).searchParams.get("t") ?? "");
      gunlukYaz(id, { t: "uye", d: 200, m: r.tur === "dogrula" ? "E-posta doğrulandı" : "Bağlantıyla giriş" });
      const hedef = r.donus ?? site;
      const parca = "oturum" in r && r.oturum ? `vayra-oturum=${r.oturum}` : "mfa" in r && r.mfa ? `vayra-ikiadim=${r.mfa}` : "vayra-dogrulandi=1";
      return new Response(null, { status: 302, headers: { Location: `${hedef}#${parca}`, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
    } catch (e) {
      return new Response(null, { status: 302, headers: { Location: `${site}#vayra-hata=${encodeURIComponent(e instanceof UyeHatasi ? e.message : "Bağlantı kullanılamadı.")}`, "Cache-Control": "no-store" } });
    }
  }
  if (islem === "liste") {
    const sahip = sahipAl(req);
    if (!sahip || !(await projeOku(id, sahip))) return y({ ok: false, hata: "Yetki yok." }, 403);
    return y({ ok: true, uyeler: await uyeleriListele(id) });
  }
  return y({ ok: false, hata: "Bilinmeyen işlem." }, 404);
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id, islem } = await params;
  const sahip = sahipAl(req);
  if (islem !== "uye" || !sahip || !(await projeOku(id, sahip))) return y({ ok: false, hata: "Yetki yok." }, 403);
  { const engel = await izleyiciEngeli(id, sahip); if (engel) return engel; }
  const uyeId = new URL(req.url).searchParams.get("id");
  if (uyeId) await uyeSil(id, uyeId);
  return y({ ok: true });
}

export function OPTIONS() { return new Response(null, { status: 204, headers: CORS }); }
