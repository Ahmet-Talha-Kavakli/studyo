/** Ortak durum/plan/ton eşlemeleri — kullanıcı ve diğer modüllerde tutarlı rozet. */
import type { KullaniciDurum } from "./seed/kullanicilar";

export const DURUM_ETIKET: Record<KullaniciDurum, { ad: string; ton: "basari" | "notr" | "uyari" | "tehlike" | "mor" }> = {
  aktif: { ad: "Aktif", ton: "basari" },
  pasif: { ad: "Pasif", ton: "notr" },
  askida: { ad: "Askıda", ton: "uyari" },
  banli: { ad: "Banlı", ton: "tehlike" },
  silinme_talebi: { ad: "Silme talebi", ton: "mor" },
};

export const PLAN_TON: Record<string, "notr" | "aksan" | "mor" | "basari"> = {
  baslangic: "notr", arti: "mor", ultra: "aksan", kurumsal: "basari",
};

export const JOB_DURUM: Record<string, { ad: string; ton: "basari" | "aksan" | "uyari" | "tehlike" | "notr" }> = {
  tamam: { ad: "Tamam", ton: "basari" },
  isleniyor: { ad: "İşleniyor", ton: "aksan" },
  kuyrukta: { ad: "Kuyrukta", ton: "uyari" },
  hata: { ad: "Hata", ton: "tehlike" },
  iptal: { ad: "İptal", ton: "notr" },
};

export const TUR_ETIKET: Record<string, string> = {
  video: "Video", gorsel: "Görsel", "3d": "3D", ses: "Ses", muzik: "Müzik",
};
