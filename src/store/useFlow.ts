"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Flow durumu — Instagram-tarzı topluluk (DM YOK).
 * Kullanıcının etkileşimleri: beğeni, kaydetme, takip, gizle, engelle, sessize al,
 * şikayet, kendi gönderdiği yorumlar, izlenen story, pro hesap, mavi tik başvuru.
 * persist (localStorage). Vayra oturumu ayrı (useAuth); burası topluluk katmanı.
 */

export interface FlowYorumGirdi { id: string; gonderiId: string; metin: string; zaman: number; }
export interface FlowSikayet { gonderiId: string; sebep: string; zaman: number; }
export interface FlowPaylasim { id: string; tohum: string; kat: string; aciklama: string; konum?: string; zaman: number; begeniGizli: boolean; yorumKapali: boolean; }

export type ProKategori = "Dijital Yaratıcı" | "Sanatçı" | "Video İçerik Üreticisi" | "Fotoğrafçı" | "Tasarımcı";
export type MaviTikDurum = "yok" | "beklemede" | "onayli" | "reddedildi";

interface FlowState {
  begeniler: Record<string, boolean>;       // gonderiId → beğenildi
  kaydedilenler: Record<string, boolean>;    // gonderiId → kaydedildi
  takipler: Record<string, boolean>;         // kullaniciId → takip
  gizlenenler: Record<string, boolean>;      // gonderiId → gizle
  engellenenler: Record<string, boolean>;    // kullaniciId → engelle
  sessizler: Record<string, boolean>;        // kullaniciId → sessize al
  kisitlananlar: Record<string, boolean>;    // kullaniciId → kısıtla
  sikayetler: FlowSikayet[];
  yorumlarim: FlowYorumGirdi[];
  izlenenStoryler: Record<string, number>;   // kullaniciId → izlenme zamanı (görüldü işareti)
  begeniYorum: Record<string, boolean>;      // yorumId → beğenildi
  superLikeler: Record<string, number>;      // gonderiId → gönderilen süper beğeni kredisi (TikTok tarzı)

  // hesap durumu
  proHesap: boolean;
  proKategori: ProKategori | null;
  maviTik: MaviTikDurum;
  benimGonderilerim: FlowPaylasim[];       // Vayra üretiminden paylaşılan gönderiler
  oneCikanlar: string[];                    // profil öne çıkarma adları

  begen: (id: string) => void;
  kaydet: (id: string) => void;
  takipEt: (id: string) => void;
  gizle: (id: string) => void;
  engelle: (id: string) => void;
  sessizeAl: (id: string) => void;
  kisitla: (id: string) => void;
  sikayetEt: (id: string, sebep: string) => void;
  yorumEkle: (gonderiId: string, metin: string) => void;
  yorumBegen: (yorumId: string) => void;
  storyIzle: (kullaniciId: string) => void;
  superLike: (gonderiId: string, kredi: number) => void;   // TikTok tarzı süper beğeni (kredi ekler)

  proAktifEt: (kat: ProKategori) => void;
  proKapat: () => void;
  maviTikBasvur: () => void;
  gonderiPaylas: (p: Omit<FlowPaylasim, "id" | "zaman">) => void;
  oneCikanEkle: (ad: string) => void;
}

let sayac = 0;
const yid = () => `y_${(sayac++).toString(36)}_${Date.now().toString(36)}`;
const cevir = (o: Record<string, boolean>, id: string) => ({ ...o, [id]: !o[id] });

export const useFlow = create<FlowState>()(
  persist(
    (set, get) => ({
      begeniler: {}, kaydedilenler: {}, takipler: {}, gizlenenler: {}, engellenenler: {},
      sessizler: {}, kisitlananlar: {}, sikayetler: [], yorumlarim: [], izlenenStoryler: {}, begeniYorum: {}, superLikeler: {},
      proHesap: false, proKategori: null, maviTik: "yok", benimGonderilerim: [], oneCikanlar: [],

      begen: (id) => set((s) => ({ begeniler: cevir(s.begeniler, id) })),
      kaydet: (id) => set((s) => ({ kaydedilenler: cevir(s.kaydedilenler, id) })),
      takipEt: (id) => set((s) => ({ takipler: cevir(s.takipler, id) })),
      gizle: (id) => set((s) => ({ gizlenenler: { ...s.gizlenenler, [id]: true } })),
      engelle: (id) => set((s) => ({ engellenenler: cevir(s.engellenenler, id) })),
      sessizeAl: (id) => set((s) => ({ sessizler: cevir(s.sessizler, id) })),
      kisitla: (id) => set((s) => ({ kisitlananlar: cevir(s.kisitlananlar, id) })),
      sikayetEt: (id, sebep) => set((s) => ({ sikayetler: [{ gonderiId: id, sebep, zaman: Date.now() }, ...s.sikayetler], gizlenenler: { ...s.gizlenenler, [id]: true } })),
      yorumEkle: (gonderiId, metin) => set((s) => ({ yorumlarim: [{ id: yid(), gonderiId, metin, zaman: Date.now() }, ...s.yorumlarim] })),
      yorumBegen: (yorumId) => set((s) => ({ begeniYorum: cevir(s.begeniYorum, yorumId) })),
      storyIzle: (kullaniciId) => set((s) => ({ izlenenStoryler: { ...s.izlenenStoryler, [kullaniciId]: Date.now() } })),
      superLike: (gonderiId, kredi) => set((s) => ({ superLikeler: { ...s.superLikeler, [gonderiId]: (s.superLikeler[gonderiId] ?? 0) + kredi }, begeniler: { ...s.begeniler, [gonderiId]: true } })),

      proAktifEt: (kat) => set({ proHesap: true, proKategori: kat }),
      proKapat: () => set({ proHesap: false, proKategori: null }),
      maviTikBasvur: () => set({ maviTik: "beklemede" }),
      gonderiPaylas: (p) => set((s) => ({ benimGonderilerim: [{ ...p, id: yid(), zaman: Date.now() }, ...s.benimGonderilerim] })),
      oneCikanEkle: (ad) => set((s) => ({ oneCikanlar: [...s.oneCikanlar, ad] })),
    }),
    { name: "vayra-flow" },
  ),
);
