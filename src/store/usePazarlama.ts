"use client";

/**
 * usePazarlama — Pazarlama Stüdyosu'nun KALICI kullanıcı verisi.
 *
 * Kullanıcı isteği (2026-07-31): "avatar seçimizde fake şeyler var: bir şeyi
 * sabitlediğimde gerçekten sabitlenmiyor şuanda. Avatar oluşturucular fake."
 *
 * Sorun: sabitlemeler (`sabitler`) ve üretilen avatarlar (`benimAvatarlar`)
 * bileşenin kendi `useState`'inde tutuluyordu — modal kapanınca hepsi yok
 * oluyordu. Ortam/kanca/stil için ise kullanıcı tanımlı bir kayıt hiç yoktu.
 *
 * Bu store hepsini `persist` ile kalıcı yapar.
 */

import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";
import type { PazAvatar } from "@/lib/pazarlamaAvatar";

/** Kullanıcının kendi oluşturduğu ortam/kanca/stil kaydı. */
export interface PazVarlik {
  id: string;
  ad: string;
  tur: "ortam" | "kanca" | "stil";
  /** Nasıl oluşturuldu: yazıyla mı, medya yükleyerek mi. */
  kaynak: "istem" | "medya";
  /** İstemle oluşturulduysa tarif; medya ile ise dosya adı. */
  aciklama: string;
  /** Yüklenen görsel/video (data-uri) — varsa kapak olarak kullanılır. */
  medyaUrl?: string;
  tohum: string;
  olusturma: number;
}

interface PazState {
  /** Sabitlenen avatar id'leri — KALICI (önce uçuyordu). */
  sabitAvatarlar: string[];
  /** Kullanıcının ürettiği/yüklediği avatarlar — KALICI. */
  benimAvatarlar: PazAvatar[];
  /** Kullanıcının oluşturduğu ortam/kanca/stil kayıtları. */
  varliklar: PazVarlik[];

  sabitToggle: (id: string) => void;
  avatarEkle: (a: PazAvatar) => void;
  avatarSil: (id: string) => void;
  varlikEkle: (v: Omit<PazVarlik, "id" | "olusturma">) => string;
  varlikSil: (id: string) => void;
}

let sayac = 0;
function yeniId(on: string) {
  sayac += 1;
  return `${on}_${sayac}_${Date.now().toString(36)}`;
}

export const usePazarlama = create<PazState>()(
  persist(
    (set) => ({
      sabitAvatarlar: [],
      benimAvatarlar: [],
      varliklar: [],

      sabitToggle: (id) =>
        set((s) => ({
          sabitAvatarlar: s.sabitAvatarlar.includes(id)
            ? s.sabitAvatarlar.filter((x) => x !== id)
            : [...s.sabitAvatarlar, id],
        })),

      avatarEkle: (a) => set((s) => ({ benimAvatarlar: [a, ...s.benimAvatarlar] })),
      avatarSil: (id) =>
        set((s) => ({
          benimAvatarlar: s.benimAvatarlar.filter((x) => x.id !== id),
          sabitAvatarlar: s.sabitAvatarlar.filter((x) => x !== id),
        })),

      varlikEkle: (v) => {
        const id = yeniId(v.tur);
        set((s) => ({ varliklar: [{ ...v, id, olusturma: Date.now() }, ...s.varliklar] }));
        return id;
      },
      varlikSil: (id) => set((s) => ({ varliklar: s.varliklar.filter((x) => x.id !== id) })),
    }),
    { name: "vayra-pazarlama", version: 1, migrate: alanlariKoru },
  ),
);
