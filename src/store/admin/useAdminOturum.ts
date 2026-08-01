"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Rol } from "@/lib/admin/guvenlik/roller";

/* Admin oturum + güvenlik çekirdeği — persist "vayra-admin-oturum".
   Giriş (şifre-hash), rol, 2FA durumu, audit log, idle-timeout, IP-whitelist,
   bilinen cihazlar. API route bu store'un token'ını doğrular (Faz 9). */

export interface AdminHesap {
  kullaniciAdi: string;
  ad: string;
  rol: Rol;
  salt: string;
  sifreHash: string;
  totpSecret?: string; // 2FA aktifse
  iki2faAktif: boolean;
}

export interface AuditKayit {
  id: string;
  zaman: number;
  admin: string;
  rol: Rol;
  eylem: string;
  hedef?: string;
  detay?: string;
  onem: "bilgi" | "uyari" | "kritik";
  ip?: string;
  arac: "manuel" | "ai";
}

const IDLE_MS = 15 * 60 * 1000; // 15 dk

interface OturumState {
  hesaplar: AdminHesap[];
  kuruldu: boolean;
  girisli: boolean;
  aktifAdmin: string | null; // kullaniciAdi
  aktifRol: Rol | null;
  sonAktivite: number;
  oturumId: string | null;
  audit: AuditKayit[];
  ipWhitelist: string[];
  bilinenCihazlar: string[];
  girisAsamasi: "sifre" | "2fa" | "tamam";
  bekleyenAdmin: string | null; // 2fa aşamasında

  hesapKur: (hesaplar: AdminHesap[]) => void;
  sifreAsama: (kullaniciAdi: string) => void; // şifre doğrulandı, 2fa'ya geç
  girisTamamla: (oturumId: string) => void;
  cikis: () => void;
  aktiviteYenile: () => void;
  idleKontrol: () => boolean; // true = kilitlendi
  denetle: (k: Omit<AuditKayit, "id" | "zaman">) => void;
  hesapGuncelle: (kullaniciAdi: string, delta: Partial<AdminHesap>) => void;
  aktifHesap: () => AdminHesap | undefined;
}

export const useAdminOturum = create<OturumState>()(
  persist(
    (set, get) => ({
      hesaplar: [],
      kuruldu: false,
      girisli: false,
      aktifAdmin: null,
      aktifRol: null,
      sonAktivite: 0,
      oturumId: null,
      audit: [],
      ipWhitelist: [],
      bilinenCihazlar: [],
      girisAsamasi: "sifre",
      bekleyenAdmin: null,

      hesapKur: (hesaplar) => set({ hesaplar, kuruldu: true }),

      sifreAsama: (kullaniciAdi) => {
        const h = get().hesaplar.find((x) => x.kullaniciAdi === kullaniciAdi);
        if (!h) return;
        if (h.iki2faAktif) set({ girisAsamasi: "2fa", bekleyenAdmin: kullaniciAdi });
        else {
          // 2fa yoksa direkt giriş (yine de token üretilir)
          const oid = Math.random().toString(36).slice(2);
          set({ girisli: true, aktifAdmin: h.kullaniciAdi, aktifRol: h.rol, oturumId: oid, sonAktivite: Date.now(), girisAsamasi: "tamam", bekleyenAdmin: null });
          get().denetle({ admin: h.kullaniciAdi, rol: h.rol, eylem: "Giriş yapıldı", onem: "bilgi", arac: "manuel" });
        }
      },

      girisTamamla: (oturumId) => {
        const kadi = get().bekleyenAdmin;
        const h = get().hesaplar.find((x) => x.kullaniciAdi === kadi);
        if (!h) return;
        set({ girisli: true, aktifAdmin: h.kullaniciAdi, aktifRol: h.rol, oturumId, sonAktivite: Date.now(), girisAsamasi: "tamam", bekleyenAdmin: null });
        get().denetle({ admin: h.kullaniciAdi, rol: h.rol, eylem: "Giriş yapıldı (2FA)", onem: "bilgi", arac: "manuel" });
      },

      cikis: () => {
        const { aktifAdmin, aktifRol } = get();
        if (aktifAdmin && aktifRol) get().denetle({ admin: aktifAdmin, rol: aktifRol, eylem: "Çıkış yapıldı", onem: "bilgi", arac: "manuel" });
        set({ girisli: false, aktifAdmin: null, aktifRol: null, oturumId: null, girisAsamasi: "sifre", bekleyenAdmin: null });
      },

      aktiviteYenile: () => set({ sonAktivite: Date.now() }),

      idleKontrol: () => {
        const { girisli, sonAktivite } = get();
        if (girisli && sonAktivite && Date.now() - sonAktivite > IDLE_MS) {
          get().cikis();
          return true;
        }
        return false;
      },

      denetle: (k) =>
        set((s) => ({
          audit: [
            { ...k, id: Math.random().toString(36).slice(2), zaman: Date.now() },
            ...s.audit,
          ].slice(0, 500),
        })),

      hesapGuncelle: (kullaniciAdi, delta) =>
        set((s) => ({ hesaplar: s.hesaplar.map((h) => (h.kullaniciAdi === kullaniciAdi ? { ...h, ...delta } : h)) })),

      aktifHesap: () => get().hesaplar.find((h) => h.kullaniciAdi === get().aktifAdmin),
    }),
    {
      name: "vayra-admin-oturum",
      partialize: (s) => ({
        hesaplar: s.hesaplar,
        kuruldu: s.kuruldu,
        audit: s.audit,
        ipWhitelist: s.ipWhitelist,
        bilinenCihazlar: s.bilinenCihazlar,
        // OTURUM DURUMU persist EDİLMEZ — her yeni sekme/yenileme yeniden giriş ister (güvenli).
      }),
    },
  ),
);
