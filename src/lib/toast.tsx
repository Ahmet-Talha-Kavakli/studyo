"use client";

/**
 * VAYRA TOAST (m53) — kendi bağımsız bildirim sistemimiz.
 * ---------------------------------------------------------------
 * sonner'ın yerini alır. `toast`, `toast.success`, `toast.error`,
 * `toast.info`, `toast.warning`, `toast.loading`, `toast.dismiss` API'si
 * BİREBİR aynı imzayla korunur — böylece koddaki ~740 çağrı hiç
 * değişmeden çalışır (import kaynağı `sonner`→`@/lib/toast` olur).
 *
 * Neden kendi sistemimiz: kullanıcı sonner görünümünü beğenmedi. Artık
 *  • konum SOL-ÜST (nav'ın hemen altı) — istenildiği gibi
 *  • Vayra cam dili + türe göre renkli ikon rozeti + ince ilerleme çubuğu
 *  • başlık/açıklama hiyerarşisi, opsiyonel aksiyon butonu
 *  • yığılma animasyonu (spring), hover'da duraklatma, kapat düğmesi
 * hepsi tam kontrolümüzde.
 */

import { create } from "zustand";

export type ToastTur = "success" | "error" | "warning" | "info" | "loading" | "default";

export type ToastAksiyon = { label: string; onClick: () => void };

export type ToastVeri = {
  id: string | number;
  tur: ToastTur;
  baslik: React.ReactNode;
  aciklama?: React.ReactNode;
  aksiyon?: ToastAksiyon;
  ikon?: React.ReactNode; // özel ikon (verilirse türün varsayılan ikonunu ezer)
  sure: number; // ms — 0 = kalıcı (loading)
  olusma: number;
};

type ToastStore = {
  toastlar: ToastVeri[];
  ekle: (t: Omit<ToastVeri, "olusma">) => string | number;
  guncelle: (id: string | number, yama: Partial<ToastVeri>) => void;
  kaldir: (id: string | number) => void;
  temizle: () => void;
};

/* Artan id. DİKKAT: yalnız sayaç YETMİYOR —
   `_sayac` modül yeniden yüklenince (dev hot-reload) sıfırlanıyor ama store
   bellekte duran toast'ları koruyor; iki toast aynı `t1` id'sini alıp React'te
   "two children with the same key" hatası veriyordu (ölçüldü: anahtar BOŞ/
   tekrar eden değerdi). Modül başına rastgele bir ön ek çakışmayı kesin
   engeller ve id yine artan/okunabilir kalır. */
let _sayac = 0;
const _onEk = Math.random().toString(36).slice(2, 7);
function yeniId() { _sayac += 1; return `t${_onEk}_${_sayac}`; }

export const useToastStore = create<ToastStore>((set) => ({
  toastlar: [],
  ekle: (t) => {
    set((s) => {
      // Aynı id varsa (loading→success geçişi) yerinde güncelle.
      const mevcut = s.toastlar.find((x) => x.id === t.id);
      if (mevcut) {
        return { toastlar: s.toastlar.map((x) => (x.id === t.id ? { ...x, ...t } : x)) };
      }
      const yeni: ToastVeri = { ...t, olusma: performanceNow() };
      // En fazla 5 toast görünür; en eskisini düş.
      const liste = [...s.toastlar, yeni].slice(-5);
      return { toastlar: liste };
    });
    return t.id;
  },
  guncelle: (id, yama) =>
    set((s) => ({ toastlar: s.toastlar.map((x) => (x.id === id ? { ...x, ...yama } : x)) })),
  kaldir: (id) => set((s) => ({ toastlar: s.toastlar.filter((x) => x.id !== id) })),
  temizle: () => set({ toastlar: [] }),
}));

// performance.now() SSR'de yok; güvenli sarmalayıcı.
function performanceNow() {
  if (typeof performance !== "undefined" && performance.now) return performance.now();
  return 0;
}

type ToastGirdi =
  | string
  | {
      description?: React.ReactNode;
      duration?: number;
      id?: string | number;
      action?: ToastAksiyon | { label: string; onClick: () => void };
      icon?: React.ReactNode;
    };

// sonner imzası: toast.success(baslik, { description, duration, action, id })
function coz(tur: ToastTur, baslik: React.ReactNode, opts?: ToastGirdi) {
  const o = typeof opts === "object" && opts !== null ? opts : undefined;
  /* `??` BOŞ STRING'i geçirir: `id: ""` veren bir çağrı React'e boş anahtar
     verip çakışma yaratıyordu. Yalnız gerçekten dolu bir id kabul edilir. */
  const id = o?.id !== undefined && o.id !== null && o.id !== "" ? o.id : yeniId();
  const varsayilanSure = tur === "loading" ? 0 : tur === "error" ? 5200 : 4200;
  useToastStore.getState().ekle({
    id,
    tur,
    baslik,
    aciklama: o?.description,
    aksiyon: o?.action as ToastAksiyon | undefined,
    ikon: o?.icon,
    sure: o?.duration ?? varsayilanSure,
  });
  return id;
}

type ToastFn = {
  (baslik: React.ReactNode, opts?: ToastGirdi): string | number;
  success: (baslik: React.ReactNode, opts?: ToastGirdi) => string | number;
  error: (baslik: React.ReactNode, opts?: ToastGirdi) => string | number;
  warning: (baslik: React.ReactNode, opts?: ToastGirdi) => string | number;
  info: (baslik: React.ReactNode, opts?: ToastGirdi) => string | number;
  loading: (baslik: React.ReactNode, opts?: ToastGirdi) => string | number;
  message: (baslik: React.ReactNode, opts?: ToastGirdi) => string | number;
  dismiss: (id?: string | number) => void;
  custom: (baslik: React.ReactNode, opts?: ToastGirdi) => string | number;
};

const _toast = ((baslik: React.ReactNode, opts?: ToastGirdi) => coz("default", baslik, opts)) as ToastFn;
_toast.success = (b, o) => coz("success", b, o);
_toast.error = (b, o) => coz("error", b, o);
_toast.warning = (b, o) => coz("warning", b, o);
_toast.info = (b, o) => coz("info", b, o);
_toast.loading = (b, o) => coz("loading", b, o);
_toast.message = (b, o) => coz("default", b, o);
_toast.custom = (b, o) => coz("default", b, o);
_toast.dismiss = (id) => {
  if (id == null) useToastStore.getState().temizle();
  else useToastStore.getState().kaldir(id);
};

export const toast = _toast;
