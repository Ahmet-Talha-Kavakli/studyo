/**
 * Roller + modül yetki matrisi + risk sınıflandırması.
 * Tek doğruluk kaynağı: hem nav filtreleme, hem RotaGuard, hem AI tool erişimi bunu kullanır.
 */
import type { RiskSeviye } from "@/components/admin/ui/Onay";

export type Rol = "super" | "finans" | "moderator" | "destek";

export const ROL_ADI: Record<Rol, string> = {
  super: "Süper Admin",
  finans: "Finans",
  moderator: "Moderatör",
  destek: "Destek",
};

/** Modül anahtarları — nav + rota guard eşleşir. */
export type Modul =
  | "genel" | "kullanicilar" | "analitik" | "finans" | "joblar" | "modeller"
  | "moderasyon" | "buyume" | "icerik" | "destek" | "sistem" | "guvenlik" | "gelistirici" | "kvkk" | "ai";

/** Her rol hangi modüllere erişebilir. super = hepsi. */
export const ROL_YETKI: Record<Rol, Modul[] | "hepsi"> = {
  super: "hepsi",
  finans: ["genel", "analitik", "finans", "kullanicilar", "buyume", "ai"],
  moderator: ["genel", "moderasyon", "kullanicilar", "joblar", "icerik", "destek", "ai"],
  destek: ["genel", "destek", "kullanicilar", "joblar", "ai"],
};

export function yetkiVar(rol: Rol, modul: Modul): boolean {
  const y = ROL_YETKI[rol];
  return y === "hepsi" || y.includes(modul);
}

/* ── Risk sınıflandırması — aksiyon adı → risk seviyesi + onay metni ──
   0 = normal (tek onay) · 1 = riskli (tek onay) · 2 = ekstra-riskli (çift onay) */
export interface AksiyonRisk {
  risk: RiskSeviye;
  onayMetin?: string; // ekstra-riskli için yazılması gereken doğrulama
}

export const AKSIYON_RISK: Record<string, AksiyonRisk> = {
  // normal
  kredi_ekle: { risk: 0 },
  ticket_yanitla: { risk: 0 },
  kupon_olustur: { risk: 0 },
  makro_uygula: { risk: 0 },
  flag_onayla: { risk: 0 },
  etiket_ekle: { risk: 0 },
  not_ekle: { risk: 0 },
  // riskli
  plan_degistir: { risk: 1 },
  iade_yap: { risk: 1 },
  model_fiyat_degistir: { risk: 1 },
  feature_flag_toggle: { risk: 1 },
  kampanya_baslat: { risk: 1 },
  abonelik_iptal: { risk: 1 },
  kredi_cikar: { risk: 1 },
  ip_ban: { risk: 1 },
  // ekstra-riskli (çift onay)
  kullanici_banla: { risk: 2, onayMetin: "BANLA" },
  hesap_anonimlestir: { risk: 2, onayMetin: "SİL" },
  bakim_modu: { risk: 2, onayMetin: "BAKIM" },
  kayit_kapat: { risk: 2, onayMetin: "KAPAT" },
  toplu_iade: { risk: 2, onayMetin: "TOPLU İADE" },
  impersonate: { risk: 2, onayMetin: "GİRİŞ" },
};

export function aksiyonRisk(aksiyon: string): AksiyonRisk {
  return AKSIYON_RISK[aksiyon] ?? { risk: 0 };
}
