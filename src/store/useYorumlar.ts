"use client";

/**
 * useYorumlar — üretim/gönderi yorumlarının TEK kaynağı (m9, m23).
 *
 * Higgsfield'da her üretimin detay panelinde "Comments" sekmesi var; eskiden
 * yorum kutusu sahte bir toast atıyordu ("Yorum eklendi") ama HİÇBİR yorum
 * saklanmıyor, gösterilmiyordu. Artık gerçek: yorum eklenir, kalıcı saklanır
 * (persist), tekrar açınca görünür, silinebilir, beğenilebilir. Zaman damgası
 * gerçek — "3sn önce / 2sa önce" göreli biçimde gösterilir.
 *
 * Anahtar: her üretim/gönderi `konuId` ile ayrışır (üretim id'si, akış gönderi
 * id'si, ses id'si — hepsi tek havuzda ama konuId ile filtrelenir).
 */

import { create } from "zustand";
import { alanlariKoru } from "./gocHelper";
import { persist } from "zustand/middleware";

export interface Yorum {
  id: string;
  konuId: string;
  yazar: string;
  yazarRenk?: string; // avatar gradyanı (opsiyonel)
  metin: string;
  zaman: number;
  begeniler: number;
  begendim: boolean;
  yanitId?: string; // bir yoruma yanıtsa üst yorumun id'si
  sabit?: boolean;  // içerik sahibi bu yorumu sabitlediyse (pin — en üste, rozetli)
  benim?: boolean;  // kullanıcının kendi yorumu (sil/pin yetkisi)
  /** Görselin üzerindeki işaret (0–1 oran; görsel boyutundan bağımsız). */
  nokta?: { x: number; y: number };
  /** İnceleme akışı: not çözüldü olarak işaretlendi. */
  cozuldu?: boolean;
  /** Son düzenleme zamanı ("düzenlendi" etiketi). */
  duzenlendi?: number;
}

interface YorumlarState {
  yorumlar: Yorum[];
  ekle: (konuId: string, metin: string, yazar?: string, yanitId?: string, benim?: boolean, ek?: { nokta?: { x: number; y: number } }) => string | undefined;
  guncelle: (id: string, metin: string) => void;
  cozulduToggle: (id: string) => void;
  /** Silineni geri yükler (yanıtlarıyla birlikte). */
  geriYukle: (l: Yorum[]) => void;
  sil: (id: string) => void;
  begeniToggle: (id: string) => void;
  /** Yorumu sabitle/kaldır — konu başına yalnızca BİR sabit yorum (içerik sahibi yetkisi). */
  sabitToggle: (id: string) => void;
  konununYorumlari: (konuId: string) => Yorum[];
  sayi: (konuId: string) => number;
}

let _sayac = 0;
function yeniId() {
  _sayac += 1;
  return `y_${_sayac}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export const useYorumlar = create<YorumlarState>()(
  persist(
    (set, get) => ({
      yorumlar: [],
      ekle: (konuId, metin, yazar = "Sen", yanitId, benim, ek) => {
        const temiz = metin.trim();
        if (!temiz) return undefined;
        const id = yeniId();
        set((s) => ({
          yorumlar: [
            ...s.yorumlar,
            {
              id,
              ...(ek?.nokta ? { nokta: ek.nokta } : {}),
              konuId,
              yazar,
              metin: temiz,
              zaman: Date.now(),
              begeniler: 0,
              begendim: false,
              yanitId,
              benim,
            },
          ],
        }));
        return id;
      },
      guncelle: (id, metin) => {
        const temiz = metin.trim();
        if (!temiz) return;
        set((s) => ({ yorumlar: s.yorumlar.map((y) => (y.id === id ? { ...y, metin: temiz, duzenlendi: Date.now() } : y)) }));
      },
      cozulduToggle: (id) => set((s) => ({ yorumlar: s.yorumlar.map((y) => (y.id === id ? { ...y, cozuldu: !y.cozuldu } : y)) })),
      geriYukle: (l) => set((s) => ({ yorumlar: [...s.yorumlar.filter((y) => !l.some((k) => k.id === y.id)), ...l] })),
      sil: (id) => set((s) => ({ yorumlar: s.yorumlar.filter((y) => y.id !== id && y.yanitId !== id) })),
      begeniToggle: (id) =>
        set((s) => ({
          yorumlar: s.yorumlar.map((y) =>
            y.id === id
              ? { ...y, begendim: !y.begendim, begeniler: y.begeniler + (y.begendim ? -1 : 1) }
              : y,
          ),
        })),
      sabitToggle: (id) =>
        set((s) => {
          const hedef = s.yorumlar.find((y) => y.id === id);
          if (!hedef) return {};
          const yeniDurum = !hedef.sabit;
          return {
            // Aynı konuda başka sabit varsa kaldır — konu başına tek sabit yorum.
            yorumlar: s.yorumlar.map((y) =>
              y.id === id ? { ...y, sabit: yeniDurum }
                : (yeniDurum && y.konuId === hedef.konuId ? { ...y, sabit: false } : y),
            ),
          };
        }),
      konununYorumlari: (konuId) =>
        get().yorumlar
          .filter((y) => y.konuId === konuId)
          // Sabit yorum en üstte, sonra yeniden eskiye.
          .sort((a, b) => (Number(b.sabit ?? 0) - Number(a.sabit ?? 0)) || (b.zaman - a.zaman)),
      sayi: (konuId) => get().yorumlar.filter((y) => y.konuId === konuId).length,
    }),
    { name: "vayra-yorumlar", version: 2, migrate: alanlariKoru },
  ),
);

/** Göreli zaman — "3sn önce / 5dk önce / 2sa önce / 3g önce" (m4, m23). */
export function goreliZaman(ms: number): string {
  const fark = Math.max(0, Date.now() - ms);
  const sn = Math.floor(fark / 1000);
  if (sn < 5) return "şimdi";
  if (sn < 60) return `${sn}sn önce`;
  const dk = Math.floor(sn / 60);
  if (dk < 60) return `${dk}dk önce`;
  const sa = Math.floor(dk / 60);
  if (sa < 24) return `${sa}sa önce`;
  const g = Math.floor(sa / 24);
  if (g < 7) return `${g}g önce`;
  const h = Math.floor(g / 7);
  if (h < 5) return `${h}hf önce`;
  const ay = Math.floor(g / 30);
  if (ay < 12) return `${ay}ay önce`;
  return `${Math.floor(g / 365)}y önce`;
}

/**
 * Görselde işaretleme köprüsü — yorum sekmesi ile görüntüleyici arasında anlık durum
 * (kalıcı değil). Sekme açıkken görüntüleyici işaretleri çizer; işaret modu açıkken
 * görsele tıklamak taslak noktayı koyar.
 */
export const useYorumIsaret = create<{
  konuId: string | null; mod: boolean; taslak: { x: number; y: number } | null; vurgu: string | null;
  ayarla: (p: Partial<{ konuId: string | null; mod: boolean; taslak: { x: number; y: number } | null; vurgu: string | null }>) => void;
}>()((set) => ({ konuId: null, mod: false, taslak: null, vurgu: null, ayarla: (p) => set(p) }));
