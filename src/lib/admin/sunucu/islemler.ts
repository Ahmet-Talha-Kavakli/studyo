import "server-only";
import { randomBytes } from "crypto";
import { belirtecUret } from "@/lib/hesap/belirtec";
import { buildVerisiniSil } from "@/lib/hesap/build";
import { hesapGuncelle, hesapOku, olayEkle } from "@/lib/hesap/depo";
import { baglantiGonder } from "@/lib/hesap/eposta";
import { hesabiSil, PLANLAR, rolHesapla } from "@/lib/hesap/hesap";
import { krediEkle, krediHarca, planDegistir } from "@/lib/hesap/kredi";
import { hesapOnbelleginiDusur, oturumlariKapat, type GecerliOturum } from "@/lib/hesap/oturum";
import type { PlanKimligi } from "@/lib/hesap/tipler";
import { aktifAbonelik } from "@/lib/odeme/depo";
import { denetimYaz } from "./denetim";

/**
 * Yönetici işlemleri. Her başarılı işlem denetim günlüğüne yazılır; hedef hesabın kendi güvenlik olaylarına da not düşülür.
 * Dönüş: { ok, mesaj, ... } ya da { ok: false, hata, durum }.
 */
export type IslemSonucu = { ok: true; mesaj: string; [k: string]: unknown } | { ok: false; hata: string; durum: number };

const PLAN_AD: Record<PlanKimligi, string> = { baslangic: "Başlangıç", arti: "Artı", ultra: "Ultra", kurumsal: "Kurumsal" };
const hataD = (hata: string, durum = 400): IslemSonucu => ({ ok: false, hata, durum });
const notTemizle = (s: unknown) => String(s ?? "").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);

export async function islemYap(o: GecerliOturum, req: Request, uid: string, g: Record<string, unknown>): Promise<IslemSonucu> {
  const h = await hesapOku(uid);
  if (!h) return hataD("Hesap bulunamadı.", 404);
  const not = notTemizle(g.not);
  const hedef = { uid: h.uid, email: h.email };
  const kendisi = h.uid === o.hesap.uid;
  const tur = String(g.islem ?? "");

  switch (tur) {
    case "kredi-ekle":
    case "kredi-dus": {
      const miktar = Number(g.miktar);
      if (!Number.isInteger(miktar) || miktar < 1 || miktar > 1_000_000) return hataD("Miktar 1 ile 1.000.000 arası tam sayı olmalı.");
      if (!not) return hataD("İşlemin nedenini yaz (kullanıcının kredi geçmişinde görünür).");
      const anahtar = `adm_${randomBytes(12).toString("base64url")}`;
      const aciklama = `Yönetici ${tur === "kredi-ekle" ? "ekledi" : "düştü"}: ${not}`;
      const r = tur === "kredi-ekle"
        ? await krediEkle(h.uid, miktar, { kaynak: "yonetim", aciklama, anahtar, plan: h.plan })
        : await krediHarca(h.uid, miktar, { kaynak: "yonetim", aciklama, anahtar, plan: h.plan });
      if (!r.ok) return hataD(r.neden === "yetersiz" ? `Bakiye yetmiyor (bakiye ${r.ozet?.bakiye ?? 0}).` : "Kredi işlemi yapılamadı.", 409);
      await denetimYaz(o, req, { tur, eylem: `${miktar} kredi ${tur === "kredi-ekle" ? "eklendi" : "düşüldü"}`, hedef, ayrinti: not, onem: tur === "kredi-dus" || miktar >= 5000 ? "uyari" : "bilgi" });
      return { ok: true, mesaj: `${miktar} kredi ${tur === "kredi-ekle" ? "eklendi" : "düşüldü"}. Yeni bakiye ${r.ozet.bakiye}.`, bakiye: r.ozet.bakiye };
    }

    case "plan": {
      const plan = String(g.plan) as PlanKimligi;
      if (!PLANLAR.includes(plan)) return hataD("Plan tanınmadı.");
      if (plan === h.plan) return hataD("Hesap zaten bu planda.");
      const ab = await aktifAbonelik(h.uid);
      if (ab && g.zorla !== true) return hataD(`Bu hesabın süren bir ${PLAN_AD[ab.plan]} aboneliği var (${ab.saglayici}). Plan ödeme sistemiyle yönetiliyor; yine de değiştirmek için onay kutusunu işaretle.`, 409);
      const eski = h.plan;
      const ozet = await planDegistir(h.uid, plan, "yonetim");
      await hesapGuncelle(h.uid, (x) => { x.plan = plan; });
      await denetimYaz(o, req, { tur, eylem: `Plan değiştirildi: ${PLAN_AD[eski]} yerine ${PLAN_AD[plan]}`, hedef, ayrinti: not || undefined, onem: "uyari" });
      return { ok: true, mesaj: `Plan ${PLAN_AD[plan]} oldu. Yeni dönem başladı, bakiye ${ozet.bakiye}.` };
    }

    case "askiya-al": {
      if (kendisi) return hataD("Kendi hesabını askıya alamazsın.");
      if (rolHesapla(h) === "admin") return hataD("Yönetici hesabı askıya alınamaz. Önce yönetici yetkisini kaldır.");
      if (h.askida) return hataD("Hesap zaten askıda.");
      if (!not) return hataD("Askıya alma nedenini yaz.");
      await hesapGuncelle(h.uid, (x) => { x.askida = { zaman: Date.now(), neden: not, admin: o.hesap.email }; olayEkle(x, "kilit", "Yönetici", `Hesap askıya alındı: ${not}`); });
      hesapOnbelleginiDusur(h.uid);
      await denetimYaz(o, req, { tur, eylem: "Hesap askıya alındı", hedef, ayrinti: not, onem: "kritik" });
      return { ok: true, mesaj: "Hesap askıya alındı. Açık oturumlar artık geçersiz; kullanıcı giriş yapamaz." };
    }

    case "askidan-cikar": {
      if (!h.askida) return hataD("Hesap askıda değil.");
      await hesapGuncelle(h.uid, (x) => { delete x.askida; olayEkle(x, "kilit", "Yönetici", "Askı kaldırıldı"); });
      hesapOnbelleginiDusur(h.uid);
      await denetimYaz(o, req, { tur, eylem: "Hesabın askısı kaldırıldı", hedef, ayrinti: not || undefined, onem: "uyari" });
      return { ok: true, mesaj: "Askı kaldırıldı. Kullanıcı yeniden giriş yapabilir." };
    }

    case "oturum-kapat": {
      const id = typeof g.oturum === "string" ? g.oturum : undefined;
      if (kendisi && !id) return hataD("Kendi bütün oturumlarını buradan kapatamazsın; Ayarlar, Güvenlik bölümünü kullan.");
      if (kendisi && id === o.oturum.id) return hataD("Şu an kullandığın oturumu buradan kapatamazsın.");
      const n = await oturumlariKapat(h.uid, id ? { id } : { hepsi: true }, { cihaz: "Yönetici", ayrinti: id ? "Yönetici bir oturumu kapattı" : "Yönetici bütün oturumları kapattı" });
      await denetimYaz(o, req, { tur, eylem: id ? "Bir oturum kapatıldı" : `Bütün oturumlar kapatıldı (${n})`, hedef, ayrinti: not || undefined, onem: "uyari" });
      return { ok: true, mesaj: n ? `${n} oturum kapatıldı.` : "Kapatılacak açık oturum yoktu.", kapatilan: n };
    }

    case "dogrulama-gonder": {
      if (h.epostaDogrulandi) return hataD("E-posta zaten doğrulanmış.");
      const b = await belirtecUret("dogrula", { uid: h.uid, email: h.email }, 24 * 3_600_000);
      const s = await baglantiGonder(req, "dogrula", h.email, b);
      if (!s.gonderildi && !s.gelistirmeBaglantisi) return hataD(s.hata ?? "E-posta gönderilemedi.", 503);
      await denetimYaz(o, req, { tur, eylem: "Doğrulama e-postası yeniden gönderildi", hedef, ayrinti: s.gonderildi ? "Gönderildi" : "E-posta servisi yok, geliştirme bağlantısı üretildi" });
      return s.gonderildi
        ? { ok: true, mesaj: `Doğrulama bağlantısı ${h.email} adresine gönderildi.` }
        : { ok: true, mesaj: "E-posta servisi kurulu değil. Geliştirme ortamında bağlantı aşağıda.", gelistirmeBaglantisi: s.gelistirmeBaglantisi };
    }

    case "hesap-sil": {
      if (kendisi) return hataD("Kendi hesabını buradan silemezsin.");
      if (rolHesapla(h) === "admin") return hataD("Yönetici hesabı buradan silinemez.");
      if (String(g.onay ?? "").trim().toLowerCase() !== h.email) return hataD("Onay için hesabın e-posta adresini aynen yaz.");
      if (!not) return hataD("Silme nedenini yaz (KVKK talebi numarası gibi).");
      await denetimYaz(o, req, { tur, eylem: "Hesap kalıcı olarak silindi", hedef, ayrinti: not, onem: "kritik" });
      await hesabiSil(h.uid, buildVerisiniSil);
      return { ok: true, mesaj: "Hesap ve bağlı veriler silindi. Mali kayıtlar kimlik bilgisi atılarak saklandı." };
    }

    default:
      return hataD("İşlem tanınmadı.");
  }
}
