"use client";

/**
 * Vayra bildirim (toast) sistemi.
 *
 * sonner ile aynı imza: toast(), toast.success/error/warning/info/loading,
 * toast.dismiss — uygulamadaki tüm çağrılar değişmeden çalışır. Ek olarak
 * toast.promise ve aynı id ile yerinde güncelleme (loading → success).
 * Render katmanı: components/kabuk/VayraToaster.
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
  ikon?: React.ReactNode;
  /** ms — 0 = kendiliğinden kapanmaz (loading) */
  sure: number;
  /** Süre bu andan itibaren sayılır; değişirse geri sayım baştan başlar. */
  olusma: number;
  /** Aynı bildirim üst üste geldiyse kaç kez geldiği. */
  adet: number;
};

type ToastStore = {
  toastlar: ToastVeri[];
  ekle: (t: Omit<ToastVeri, "olusma" | "adet">) => string | number;
  kaldir: (id: string | number) => void;
  temizle: () => void;
};

/* Modül başına rastgele ön ek: dev'de modül yeniden yüklenince sayaç sıfırlansa da
   bellekteki bildirimlerle id çakışmaz. */
let sayac = 0;
const onEk = Math.random().toString(36).slice(2, 7);
const yeniId = () => `t${onEk}_${++sayac}`;
const simdi = () => (typeof performance !== "undefined" ? performance.now() : 0);

const ENCOK = 5;

export const useToastStore = create<ToastStore>((set) => ({
  toastlar: [],
  ekle: (t) => {
    let donen = t.id;
    set((s) => {
      // Aynı id: yerinde güncelle (loading → success). Tür ya da süre değiştiyse sayım baştan.
      const mevcut = s.toastlar.find((x) => x.id === t.id);
      if (mevcut) {
        const sifirla = mevcut.tur !== t.tur || mevcut.sure !== t.sure;
        return { toastlar: s.toastlar.map((x) => (x.id === t.id ? { ...x, ...t, olusma: sifirla ? simdi() : x.olusma } : x)) };
      }
      // Aynı metin zaten görünüyorsa yenisini açma: sayacı artır, en öne al, süreyi tazele.
      const ayni = typeof t.baslik === "string" && t.tur !== "loading" && !t.aksiyon && (t.aciklama == null || typeof t.aciklama === "string")
        ? s.toastlar.find((x) => x.tur === t.tur && x.baslik === t.baslik && (x.aciklama ?? "") === (t.aciklama ?? ""))
        : undefined;
      if (ayni) {
        donen = ayni.id;
        return { toastlar: [...s.toastlar.filter((x) => x.id !== ayni.id), { ...ayni, adet: ayni.adet + 1, olusma: simdi() }] };
      }
      return { toastlar: [...s.toastlar, { ...t, olusma: simdi(), adet: 1 }].slice(-ENCOK) };
    });
    return donen;
  },
  kaldir: (id) => set((s) => ({ toastlar: s.toastlar.filter((x) => x.id !== id) })),
  temizle: () => set({ toastlar: [] }),
}));

type ToastGirdi =
  | string
  | {
      description?: React.ReactNode;
      duration?: number;
      id?: string | number;
      action?: ToastAksiyon;
      icon?: React.ReactNode;
    };

function goster(tur: ToastTur, baslik: React.ReactNode, opts?: ToastGirdi) {
  const o = typeof opts === "object" && opts !== null ? opts : undefined;
  // Boş string id React'e boş anahtar verir; yalnız dolu id kabul edilir.
  const id = o?.id !== undefined && o.id !== null && o.id !== "" ? o.id : yeniId();
  const uzun = typeof o?.description === "string" && o.description.length > 90;
  const varsayilan = tur === "loading" ? 0 : tur === "error" ? 6000 : o?.action ? 6500 : uzun ? 5500 : 4200;
  return useToastStore.getState().ekle({
    id, tur, baslik, aciklama: o?.description, aksiyon: o?.action, ikon: o?.icon,
    sure: o?.duration ?? varsayilan,
  });
}

type Fn = (baslik: React.ReactNode, opts?: ToastGirdi) => string | number;
type ToastFn = Fn & {
  success: Fn; error: Fn; warning: Fn; info: Fn; loading: Fn; message: Fn; custom: Fn;
  dismiss: (id?: string | number) => void;
  promise: <T>(p: Promise<T>, m: { loading: React.ReactNode; success: React.ReactNode | ((v: T) => React.ReactNode); error: React.ReactNode | ((e: unknown) => React.ReactNode) }) => Promise<T>;
};

const _toast = ((b, o) => goster("default", b, o)) as ToastFn;
_toast.success = (b, o) => goster("success", b, o);
_toast.error = (b, o) => goster("error", b, o);
_toast.warning = (b, o) => goster("warning", b, o);
_toast.info = (b, o) => goster("info", b, o);
_toast.loading = (b, o) => goster("loading", b, o);
_toast.message = (b, o) => goster("default", b, o);
_toast.custom = (b, o) => goster("default", b, o);
_toast.dismiss = (id) => {
  if (id == null) useToastStore.getState().temizle();
  else useToastStore.getState().kaldir(id);
};
_toast.promise = async (p, m) => {
  const id = goster("loading", m.loading);
  try {
    const v = await p;
    goster("success", typeof m.success === "function" ? (m.success as (v: unknown) => React.ReactNode)(v) : m.success, { id });
    return v;
  } catch (e) {
    goster("error", typeof m.error === "function" ? (m.error as (e: unknown) => React.ReactNode)(e) : m.error, { id });
    throw e;
  }
};

export const toast = _toast;
