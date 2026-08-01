/**
 * İlk kurulum — seed admin hesapları (hash'li şifre). Bir kez çalışır.
 * Demo giriş bilgileri (kullanıcı bunları girerek girer):
 *   super   / vayra2026     (2FA kapalı)
 *   finans  / finans2026    (2FA kapalı)
 *   moderator / mod2026     (2FA kapalı)
 *   destek  / destek2026    (2FA kapalı)
 * 2FA kurulumu Güvenlik modülünden yapılır (gerçek TOTP).
 */
import { saltUret, sifreHash } from "./sifre";
import type { AdminHesap } from "@/store/admin/useAdminOturum";
import type { Rol } from "./roller";

const TOHUM: { kullaniciAdi: string; ad: string; rol: Rol; sifre: string }[] = [
  { kullaniciAdi: "super", ad: "Kaan Arslan", rol: "super", sifre: "vayra2026" },
  { kullaniciAdi: "finans", ad: "Elif Yıldırım", rol: "finans", sifre: "finans2026" },
  { kullaniciAdi: "moderator", ad: "Burak Şen", rol: "moderator", sifre: "mod2026" },
  { kullaniciAdi: "destek", ad: "Zeynep Kaya", rol: "destek", sifre: "destek2026" },
];

export async function seedHesaplar(): Promise<AdminHesap[]> {
  const out: AdminHesap[] = [];
  for (const t of TOHUM) {
    const salt = saltUret();
    const sifreHashDeger = await sifreHash(t.sifre, salt);
    out.push({
      kullaniciAdi: t.kullaniciAdi,
      ad: t.ad,
      rol: t.rol,
      salt,
      sifreHash: sifreHashDeger,
      iki2faAktif: false,
    });
  }
  return out;
}
