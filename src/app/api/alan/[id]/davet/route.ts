import { epostaGonder, epostaKurulu } from "@/lib/build/bulutEposta";
import { epostaNormal, EPOSTA_DESENI, epostadanUid } from "@/lib/hesap/depo";
import { gelistirme, govdeOku, hata, hizHatasi, hizSiniri, istekKokeni, tamam } from "@/lib/hesap/guvenlik";
import { baglantiKoku } from "@/lib/hesap/eposta";
import { AlanHatasi, alanGuncelle, alanOku, davetDiziniSil, davetEkle, gunlukEkle, uyeBul, uyeSiniri } from "@/lib/alan/depo";
import { alanAyrintisi, alanBaglam, alanHataYanit, kisiAd } from "@/lib/alan/uc";
import { DAVET_GUN, ROL_AD, ROL_SIRA, type AlanRol } from "@/lib/alan/tipler";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

/**
 * POST   { epostalar: string[], rol }  e-postayla davet: bağlantılı, 7 gün geçerli, tek kullanımlık, adrese bağlı.
 *        E-posta servisi (RESEND_API_KEY) kuruluysa gönderilir; değilse ya da gönderilemezse davet yine oluşur ve
 *        bağlantı yalnız daveti yapana döner (kopyalayıp kendisi iletir). Aynı adrese yeni davet eskisini geçersiz kılar.
 * DELETE { id }                        daveti geri al
 * Davet: sahip ve yönetici; alan ayarı açıksa üyeler de (yalnız üye ve izleyici rolüyle).
 */
export async function POST(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id, "uye");
  if (b instanceof Response) return b;
  const yonetici = ROL_SIRA[b.uye.rol] >= ROL_SIRA.yonetici;
  if (!yonetici && !b.alan.ayar.uyeDavet) return hata("Bu alanda davet göndermeyi yalnız sahip ve yöneticiler yapabilir.", 403, { kod: "yetki" });
  const bekle = hizSiniri(`alan-davet-gonder:${b.h.uid}`, b.alan.plan === "baslangic" ? 20 : 100, 86_400_000, false);
  if (bekle) return hizHatasi(bekle);
  const g = await govdeOku<{ epostalar?: unknown; rol?: string }>(req);
  const rol = (g?.rol ?? "uye") as AlanRol;
  if (!["yonetici", "uye", "izleyici"].includes(rol)) return hata("Davet rolü tanınmadı.");
  if (rol === "yonetici" && b.uye.rol !== "sahip" && b.uye.rol !== "yonetici") return hata("Yönetici davet etme yetkin yok.", 403);
  if (rol === "yonetici" && b.uye.rol === "yonetici") return hata("Yönetici rolüyle yalnız sahip davet edebilir.", 403);
  const ham = (Array.isArray(g?.epostalar) ? g!.epostalar : String(g?.epostalar ?? "").split(/[\s,;]+/)).map((x) => epostaNormal(String(x))).filter(Boolean);
  const epostalar = [...new Set(ham)].slice(0, 20);
  if (!epostalar.length) return hata("En az bir e-posta adresi yaz.", 400, { alan: "eposta" });
  const gecersiz = epostalar.filter((e) => !EPOSTA_DESENI.test(e));
  if (gecersiz.length) return hata(`Geçersiz adres: ${gecersiz.join(", ")}`, 400, { alan: "eposta" });

  const kok = baglantiKoku(req) ?? istekKokeni(req);
  const servis = epostaKurulu() && !!baglantiKoku(req);
  const sonuc: { eposta: string; durum: "gonderildi" | "baglanti" | "uye"; baglanti?: string; hata?: string }[] = [];
  try {
    const yeni: { eposta: string; belirtec: string; id: string }[] = [];
    await alanGuncelle(b.alan.id, async (a) => {
      const s = uyeSiniri(a);
      const bekleyen = a.davetler.filter((d) => d.bitis > Date.now() && !epostalar.includes(d.eposta)).length;
      for (const e of epostalar) {
        const uid = await epostadanUid(e);
        if (uid && uyeBul(a, uid)) { sonuc.push({ eposta: e, durum: "uye" }); continue; }
        if (s !== null && a.uyeler.length + bekleyen + yeni.length + 1 > s) throw new AlanHatasi(`Bu alanın planı en çok ${s} üyeye izin veriyor (bekleyen davetler dahil). Planı yükselt ya da eski davetleri geri al.`, 409, "kapasite");
        const r = await davetEkle(a, { eposta: e, rol: rol as Exclude<AlanRol, "sahip">, davetEden: b.h.uid });
        yeni.push({ eposta: e, belirtec: r.belirtec, id: r.davet.id });
      }
    });
    const davetEden = kisiAd(b.h);
    for (const y of yeni) {
      const baglanti = `${kok}/davet?b=${encodeURIComponent(y.belirtec)}`;
      let gonderildi = false, hataMetni: string | undefined;
      if (servis) {
        const r = await epostaGonder({
          kime: y.eposta, konu: `${davetEden} seni ${b.alan.ad} çalışma alanına davet etti`,
          metin: `${davetEden}, seni Vayra'daki ${b.alan.ad} çalışma alanına ${ROL_AD[rol].toLocaleLowerCase("tr-TR")} olarak davet etti. Alanda ortak kredi havuzuyla üretir, Build projelerini birlikte düzenlersin. Daveti kabul etmek için aşağıdaki düğmeye bas. Bağlantı ${DAVET_GUN} gün geçerli ve bir kez kullanılabilir.`,
          dugme: { ad: "Daveti kabul et", adres: baglanti },
        }).catch((e) => ({ ok: false as const, hata: (e as Error).message }));
        gonderildi = r.ok;
        if (!r.ok) hataMetni = "E-posta gönderilemedi; bağlantıyı kopyalayıp ilet.";
      }
      if (gonderildi) await alanGuncelle(b.alan.id, (a) => { const d = a.davetler.find((x) => x.id === y.id); if (d) d.gonderildi = true; });
      sonuc.push({ eposta: y.eposta, durum: gonderildi ? "gonderildi" : "baglanti", baglanti, ...(hataMetni ? { hata: hataMetni } : {}) });
    }
    if (yeni.length) await gunlukEkle(b.alan.id, "davet", { uid: b.h.uid, ad: davetEden }, `${yeni.map((y) => y.eposta).join(", ")} adresine ${ROL_AD[rol]} rolüyle davet${servis ? "" : " (bağlantı, e-posta gönderilmedi)"}`, b.ip);
    return tamam({ sonuc, epostaServisi: servis, gelistirme: gelistirme(), alan: await alanAyrintisi((await alanOku(b.alan.id))!, b.h.uid) });
  } catch (e) { return alanHataYanit(e); }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const b = await alanBaglam(req, (await ctx.params).id, "uye");
  if (b instanceof Response) return b;
  const g = await govdeOku<{ id?: string }>(req);
  try {
    const eposta = await alanGuncelle(b.alan.id, async (a) => {
      const d = a.davetler.find((x) => x.id === g?.id);
      if (!d) throw new AlanHatasi("Davet bulunamadı.", 404);
      if (ROL_SIRA[b.uye.rol] < ROL_SIRA.yonetici && d.davetEden !== b.h.uid) throw new AlanHatasi("Yalnız kendi davetlerini geri alabilirsin.", 403);
      a.davetler = a.davetler.filter((x) => x.id !== d.id);
      await davetDiziniSil(d.ozet);
      return d.eposta;
    });
    await gunlukEkle(b.alan.id, "davet-iptal", { uid: b.h.uid, ad: kisiAd(b.h) }, `${eposta.sonuc} adresine giden davet geri alındı`, b.ip);
    return tamam({ alan: await alanAyrintisi((await alanOku(b.alan.id))!, b.h.uid) });
  } catch (e) { return alanHataYanit(e); }
}
