/**
 * KVKK veri erişim talebi — kullanıcının TÜM verisini toplayıp gerçek indirilebilir
 * JSON üretir (spec Modül: veri indirme talebi ZIP). Tarayıcıda Blob download.
 */
import { veri, kullaniciBul } from "./index";
import {
  uretLedger, uretOdemeler, uretOturumlar, uretGuvenlikOlaylar,
  uretKullaniciJoblar, uretKullaniciTicketlar,
} from "./kullaniciDetay";
import { kullaniciYolculugu } from "./davranis";
import { tarihSaat } from "../cekirdek";

export function kullaniciVeriPaketi(kullaniciId: string): object | null {
  const k = kullaniciBul(kullaniciId);
  if (!k) return null;
  return {
    _meta: {
      belge: "KVKK Kişisel Veri Erişim Paketi",
      olusturuldu: tarihSaat(Date.now()),
      kullaniciId: k.id,
      aciklama: "6698 sayılı KVKK md.11 kapsamında kişisel veri erişim talebi çıktısı.",
    },
    profil: {
      ad: k.ad, email: k.email, plan: k.plan, durum: k.durum,
      ulke: k.ulke, sehir: k.sehir, ip: k.ip, cihaz: k.cihaz,
      tarayici: k.tarayici, isletim: k.isletim, dil: k.dil,
      kayitTarih: tarihSaat(k.kayitTarih), sonAktif: tarihSaat(k.sonAktif),
      dogrulanmis: k.dogrulanmis, guvenSkoru: k.guvenSkoru, kaynak: k.kaynak,
    },
    finansal: {
      krediBakiye: k.krediBakiye, toplamHarcanan: k.toplamHarcanan, toplamOdenen: k.toplamOdenen,
      krediLedger: uretLedger(k),
      odemeler: uretOdemeler(k),
    },
    uretimler: uretKullaniciJoblar(k),
    oturumlar: uretOturumlar(k),
    gezinmeGecmisi: kullaniciYolculugu(k.id),
    guvenlikOlaylari: uretGuvenlikOlaylar(k),
    destekTalepleri: uretKullaniciTicketlar(k),
  };
}

/** Tarayıcıda gerçek dosya indir. */
export function kullaniciVeriExport(kullaniciId: string, ad: string): boolean {
  const paket = kullaniciVeriPaketi(kullaniciId);
  if (!paket) return false;
  const blob = new Blob([JSON.stringify(paket, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kvkk-veri-${ad.replace(/\s+/g, "-").toLowerCase()}-${kullaniciId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
