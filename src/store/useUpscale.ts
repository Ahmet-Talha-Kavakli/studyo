"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuth } from "@/store/useAuth";
import { useProjeler } from "@/store/useProjeler";
import { toast } from "@/lib/toast";
import { upscaleModel, type UpscaleAyar, type UpscaleModelId, type UpscaleTur } from "@/lib/upscaleVeri";

/**
 * Büyütme geçmişi + iş motoru. İşler sayfadan bağımsız sürer (başka sayfaya geçilince de biter);
 * yarıda kalan sağlayıcı işleri sayfa yeniden açıldığında jetonla sorgulanmaya devam eder.
 * Medya tarayıcı deposuna yazılmaz — yalnız sunucu deposundaki adresler tutulur.
 */
export type UpscaleIs = {
  id: string;
  tur: UpscaleTur;
  ad: string;
  kaynakUrl: string;
  kaynakW: number;
  kaynakH: number;
  kaynakSure?: number;
  /** "yerel": tarayıcıda Lanczos — AI değil, kredisiz. */
  model: UpscaleModelId | "yerel";
  olcek: number;
  ayar: UpscaleAyar;
  hazirAyar?: string;
  durum: "kuyrukta" | "isleniyor" | "tamam" | "hata";
  hata?: string;
  sira?: number;
  sonucUrl?: string;
  sonucW?: number;
  sonucH?: number;
  kredi: number;
  gercek: boolean;
  jeton?: string;
  olusturma: number;
  bitis?: number;
  uretimId?: string;
  /** Hangi üretimden geldi (kitaplıktan açıldıysa). */
  kaynakUretimId?: string;
};

type State = {
  isler: UpscaleIs[];
  ekle: (i: Omit<UpscaleIs, "id" | "olusturma">) => string;
  guncelle: (id: string, p: Partial<UpscaleIs>) => void;
  sil: (id: string) => void;
};

export const useUpscale = create<State>()(
  persist(
    (set) => ({
      isler: [],
      ekle: (i) => {
        const id = crypto.randomUUID();
        set((s) => ({ isler: [{ ...i, id, olusturma: Date.now() }, ...s.isler].slice(0, 120) }));
        return id;
      },
      guncelle: (id, p) => set((s) => ({ isler: s.isler.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      sil: (id) => set((s) => ({ isler: s.isler.filter((x) => x.id !== id) })),
    }),
    { name: "vayra-upscale", version: 1 },
  ),
);

const izlenen = new Set<string>();
const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Biten işi kitaplığa (üretimler) yansıtır. */
export function kitapligaYansit(id: string) {
  const i = useUpscale.getState().isler.find((x) => x.id === id);
  if (!i || i.durum !== "tamam" || !i.sonucUrl || i.uretimId) return;
  const m = i.model === "yerel" ? null : upscaleModel(i.model);
  const uid = useProjeler.getState().ekle({
    baslik: i.ad, tur: i.tur, model: m ? m.ad : "Yerel büyütme",
    prompt: `${i.olcek ? `${i.olcek}× ` : ""}büyütme · ${i.kaynakW}×${i.kaynakH} kaynaktan ${i.sonucW ?? "?"}×${i.sonucH ?? "?"} boyuta`,
    durum: "tamam", ilerleme: 100, kredi: i.kredi, arac: "Yükselt", saglayici: m ? "fal" : "yerel", gercek: i.gercek,
    ...(i.tur === "video" ? { videoUrl: i.sonucUrl } : { gorselUrl: i.sonucUrl }),
    meta: { cozunurluk: i.sonucW && i.sonucH ? `${i.sonucW}×${i.sonucH}` : undefined, gorselUrl: i.kaynakUrl, kaynakId: i.kaynakUretimId },
  });
  useUpscale.getState().guncelle(id, { uretimId: uid });
}

/** Sağlayıcı işini sonuna kadar izler (kredi iadesi dahil). Aynı iş iki kez izlenmez. */
export async function isiIzle(id: string) {
  if (izlenen.has(id)) return;
  izlenen.add(id);
  const { guncelle } = useUpscale.getState();
  const al = () => useUpscale.getState().isler.find((x) => x.id === id);
  const aralik = al()?.tur === "video" ? 6000 : 2500;
  const son = Date.now() + 20 * 60_000;
  try {
    while (Date.now() < son) {
      const i = al();
      if (!i || !i.jeton || i.durum === "tamam" || i.durum === "hata") return;
      await bekle(aralik);
      const r = await fetch(`/api/upscale?jeton=${encodeURIComponent(i.jeton)}`).then((x) => x.json()).catch(() => null) as
        | { durum: "kuyrukta"; sira?: number } | { durum: "isleniyor" } | { durum: "tamam"; url: string; genislik?: number; yukseklik?: number } | { durum: "hata"; hata: string; kredi?: { iade?: boolean; bakiye?: number } } | null;
      if (!r) continue; // geçici ağ hatası — tekrar dene
      if (r.durum === "kuyrukta") guncelle(id, { durum: "kuyrukta", sira: r.sira });
      else if (r.durum === "isleniyor") guncelle(id, { durum: "isleniyor", sira: undefined });
      else if (r.durum === "tamam") {
        const boyut = r.genislik && r.yukseklik ? { w: r.genislik, h: r.yukseklik } : await medyaBoyutu(r.url, i.tur);
        guncelle(id, { durum: "tamam", sonucUrl: r.url, sonucW: boyut?.w, sonucH: boyut?.h, jeton: undefined, bitis: Date.now() });
        kitapligaYansit(id);
        toast.success("Görsel büyütüldü", { description: `${i.ad}${boyut ? ` · ${boyut.w}×${boyut.h}` : ""}` });
        return;
      } else {
        // Sunucu kesintiyi iade etti (yanıt yeni bakiyeyi taşır).
        basarisiz(id, r.hata, r.kredi?.iade ? { bakiye: r.kredi.bakiye } : "bilinmiyor");
        return;
      }
    }
    basarisiz(id, "Zaman aşımı: iş sağlayıcıda çok uzun sürdü.", "bilinmiyor");
  } finally {
    izlenen.delete(id);
  }
}

/**
 * İş başarısız. Kredi sunucuda kesilir ve sunucuda iade edilir; istemci iade bildirmez.
 * iade: { bakiye } sunucu iade etti; "yok" hiç kesilmedi; "bilinmiyor" bakiye sunucudan yeniden okunur.
 */
export function basarisiz(id: string, hata: string, iade: { bakiye?: number } | "yok" | "bilinmiyor" = "bilinmiyor") {
  const i = useUpscale.getState().isler.find((x) => x.id === id);
  if (!i) return;
  if (typeof iade === "object" && typeof iade.bakiye === "number") useAuth.getState().krediEsitle(iade.bakiye);
  else if (i.kredi > 0) void useAuth.getState().esitle();
  useUpscale.getState().guncelle(id, { durum: "hata", hata: hata.slice(0, 200), jeton: undefined, bitis: Date.now() });
  const not = !(i.kredi > 0) || iade === "yok" ? " Kredi düşmedi." : typeof iade === "object" ? ` ${i.kredi} kredi bakiyene iade edildi.` : " Kesilen kredi sunucuda iade edilir; bakiyen birazdan güncellenir.";
  toast.error("Büyütülemedi", { description: `${hata.slice(0, 120)}${not} Yeniden dene.` });
}

/** Sayfa açıldığında yarıda kalan işleri sürdürür; jetonsuz kalanları (sekme kapandı) iptal eder. */
export function isleriSurdur() {
  for (const i of useUpscale.getState().isler) {
    if (i.durum !== "kuyrukta" && i.durum !== "isleniyor") continue;
    if (i.jeton) void isiIzle(i.id);
    else if (i.model === "yerel") useUpscale.getState().guncelle(i.id, { durum: "hata", hata: "Sekme kapandığı için yerel işlem yarıda kaldı." });
    else if (Date.now() - i.olusturma > 60_000) basarisiz(i.id, "İş başlatılamadan sayfa kapandı.", "bilinmiyor");
  }
}

export function medyaBoyutu(url: string, tur: UpscaleTur): Promise<{ w: number; h: number; sure?: number } | undefined> {
  return new Promise((coz) => {
    if (tur === "video") {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => coz({ w: v.videoWidth, h: v.videoHeight, sure: v.duration });
      v.onerror = () => coz(undefined);
      v.src = url;
    } else {
      const g = new Image();
      g.onload = () => coz({ w: g.naturalWidth, h: g.naturalHeight });
      g.onerror = () => coz(undefined);
      g.src = url;
    }
  });
}
