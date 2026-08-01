"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* Kampanya + drip akış + A/B test yönetimi — persist "vayra-admin-kampanya".
   Kalıcı oluşturma / durum değiştirme / silme / toggle. */

export interface Kampanya {
  id: string;
  ad: string;
  tur: "email" | "push" | "inapp";
  segment: string;
  sablon: string; // değişkenli metin: {isim} {kredi} {tier}
  zamanlama: number | null; // ms; null = hemen
  durum: "taslak" | "zamanlandi" | "gonderildi";
  metrikler: { gonderim: number; acilma: number; tiklama: number; donusum: number };
}

export interface DripAkis {
  id: string;
  ad: string;
  tetik: "hosgeldin" | "kredi_bitti" | "winback" | "trial_bitiyor" | "upsell";
  adimlar: { gun: number; kanal: "email" | "push" | "inapp"; metin: string }[];
  aktif: boolean;
}

export interface AbTest {
  id: string;
  ad: string;
  tur: "thumbnail" | "prompt" | "landing";
  varyantA: string;
  varyantB: string;
  gorunumA: number;
  gorunumB: number;
  donusumA: number;
  donusumB: number;
  kazanan: "A" | "B" | null;
  durum: "calisiyor" | "durduruldu";
}

const VARSAYILAN_KAMPANYA: Kampanya[] = [
  { id: "kmp_1", ad: "Hoşgeldin serisi", tur: "inapp", segment: "Yeni kayıt", sablon: "Merhaba {isim}! Vayra'ya hoş geldin. Hesabında {kredi} kredi hazır bekliyor.", zamanlama: null, durum: "gonderildi", metrikler: { gonderim: 3240, acilma: 2418, tiklama: 892, donusum: 412 } },
  { id: "kmp_2", ad: "Kredi bitti hatırlatması", tur: "email", segment: "Kredi bitenler", sablon: "{isim}, kredin tükendi. {tier} planında kaldığın yerden devam etmek için yükle.", zamanlama: null, durum: "gonderildi", metrikler: { gonderim: 5820, acilma: 2910, tiklama: 1164, donusum: 640 } },
  { id: "kmp_3", ad: "Win-back kampanyası", tur: "email", segment: "30g inaktif", sablon: "Seni özledik {isim}! Geri dön, hesabına 200 bonus kredi tanımladık.", zamanlama: Date.UTC(2026, 6, 29, 9, 0), durum: "zamanlandi", metrikler: { gonderim: 0, acilma: 0, tiklama: 0, donusum: 0 } },
  { id: "kmp_4", ad: "Ultra upsell", tur: "email", segment: "Ücretsiz plan", sablon: "{isim}, {tier} planını denemeye ne dersin? İlk ay %40 indirimli.", zamanlama: null, durum: "taslak", metrikler: { gonderim: 0, acilma: 0, tiklama: 0, donusum: 0 } },
];

const VARSAYILAN_DRIP: DripAkis[] = [
  {
    id: "drip_hosgeldin", ad: "Hoşgeldin akışı", tetik: "hosgeldin", aktif: true,
    adimlar: [
      { gun: 0, kanal: "inapp", metin: "İlk projeni oluştur, 100 kredi hediye." },
      { gun: 2, kanal: "email", metin: "En sevilen 3 stüdyoyu keşfet." },
      { gun: 5, kanal: "push", metin: "Hâlâ üretmedin mi? Şablonla 30 saniyede başla." },
    ],
  },
  {
    id: "drip_kredi_bitti", ad: "Kredi bitti akışı", tetik: "kredi_bitti", aktif: true,
    adimlar: [
      { gun: 0, kanal: "inapp", metin: "Kredin bitti — hemen yükle." },
      { gun: 1, kanal: "email", metin: "%20 kredi bonusu bugün geçerli." },
    ],
  },
  {
    id: "drip_winback", ad: "Win-back akışı", tetik: "winback", aktif: false,
    adimlar: [
      { gun: 0, kanal: "email", metin: "Seni özledik — 200 bonus kredi seni bekliyor." },
      { gun: 3, kanal: "email", metin: "Yeni modeller eklendi, bir göz at." },
      { gun: 7, kanal: "push", metin: "Son şans: bonus kredin 24 saat sonra siliniyor." },
    ],
  },
  {
    id: "drip_trial", ad: "Trial bitiyor akışı", tetik: "trial_bitiyor", aktif: true,
    adimlar: [
      { gun: 0, kanal: "email", metin: "Deneme sürenin son 3 günü — plana geç." },
      { gun: 2, kanal: "push", metin: "Yarın deneme bitiyor, %30 indirimi kaçırma." },
    ],
  },
  {
    id: "drip_upsell", ad: "Upsell akışı", tetik: "upsell", aktif: false,
    adimlar: [
      { gun: 0, kanal: "inapp", metin: "Ağır kullanıcısın — Ultra sınırsız krediye geç." },
      { gun: 4, kanal: "email", metin: "Ultra ile 4K çıktı ve öncelikli kuyruk." },
    ],
  },
];

const VARSAYILAN_ABTEST: AbTest[] = [
  { id: "ab_1", ad: "Landing hero başlığı", tur: "landing", varyantA: "Saniyeler içinde AI video üret", varyantB: "Fikrini viral videoya çevir", gorunumA: 12840, gorunumB: 12610, donusumA: 892, donusumB: 1104, kazanan: null, durum: "calisiyor" },
  { id: "ab_2", ad: "Preset thumbnail stili", tur: "thumbnail", varyantA: "Koyu sinematik kapak", varyantB: "Parlak neon kapak", gorunumA: 8420, gorunumB: 8390, donusumA: 640, donusumB: 512, kazanan: "A", durum: "durduruldu" },
  { id: "ab_3", ad: "Composer varsayılan prompt", tur: "prompt", varyantA: "Kısa yönlendirici prompt", varyantB: "Detaylı örnek prompt", gorunumA: 5210, gorunumB: 5180, donusumA: 1560, donusumB: 1720, kazanan: null, durum: "calisiyor" },
];

interface KampanyaState {
  kampanyalar: Kampanya[];
  dripAkislar: DripAkis[];
  abTestler: AbTest[];
  kampanyaEkle: (k: Omit<Kampanya, "id" | "durum" | "metrikler"> & { durum?: Kampanya["durum"] }) => void;
  kampanyaSil: (id: string) => void;
  durumDegistir: (id: string, durum: Kampanya["durum"]) => void;
  dripToggle: (id: string) => void;
  abTestEkle: (t: Omit<AbTest, "id" | "gorunumA" | "gorunumB" | "donusumA" | "donusumB" | "kazanan" | "durum">) => void;
  abTestDurdur: (id: string, kazanan: "A" | "B" | null) => void;
}

const yeniId = () => Math.random().toString(36).slice(2, 10);

export const useAdminKampanya = create<KampanyaState>()(
  persist(
    (set) => ({
      kampanyalar: VARSAYILAN_KAMPANYA,
      dripAkislar: VARSAYILAN_DRIP,
      abTestler: VARSAYILAN_ABTEST,
      kampanyaEkle: (k) =>
        set((s) => ({
          kampanyalar: [
            { ...k, id: yeniId(), durum: k.durum ?? "taslak", metrikler: { gonderim: 0, acilma: 0, tiklama: 0, donusum: 0 } },
            ...s.kampanyalar,
          ],
        })),
      kampanyaSil: (id) => set((s) => ({ kampanyalar: s.kampanyalar.filter((x) => x.id !== id) })),
      durumDegistir: (id, durum) =>
        set((s) => ({
          kampanyalar: s.kampanyalar.map((x) => {
            if (x.id !== id) return x;
            // taslak/zamanlandi → gonderildi: gerçekçi metrik üret (segment büyüklüğü kadar)
            if (durum === "gonderildi" && x.metrikler.gonderim === 0) {
              const g = 2000 + Math.floor(Math.random() * 6000);
              const acilma = Math.round(g * (0.42 + Math.random() * 0.22));
              const tiklama = Math.round(acilma * (0.28 + Math.random() * 0.18));
              const donusum = Math.round(tiklama * (0.3 + Math.random() * 0.2));
              return { ...x, durum, metrikler: { gonderim: g, acilma, tiklama, donusum } };
            }
            return { ...x, durum };
          }),
        })),
      dripToggle: (id) => set((s) => ({ dripAkislar: s.dripAkislar.map((x) => (x.id === id ? { ...x, aktif: !x.aktif } : x)) })),
      abTestEkle: (t) =>
        set((s) => ({
          abTestler: [
            { ...t, id: yeniId(), gorunumA: 0, gorunumB: 0, donusumA: 0, donusumB: 0, kazanan: null, durum: "calisiyor" },
            ...s.abTestler,
          ],
        })),
      abTestDurdur: (id, kazanan) => set((s) => ({ abTestler: s.abTestler.map((x) => (x.id === id ? { ...x, durum: "durduruldu", kazanan } : x)) })),
    }),
    { name: "vayra-admin-kampanya", version: 1 },
  ),
);
