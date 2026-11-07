"use client";

import { islemAnahtari } from "@/lib/hesap/istemci";
import { mesaj } from "@/lib/mesaj";
import { useAuth } from "@/store/useAuth";
import { useAuthKapi } from "@/store/useAuthKapi";

/**
 * Krediyi sunucuda kesen rotaların istemci sözleşmesi.
 *
 * - Her istek bir işlem anahtarıyla gider (`x-islem-anahtari`): aynı iş iki kez gönderilse de bir kez kesilir.
 * - Ekrandaki bakiye iyimser düşer (useAuth.krediAyir, sunucuya bildirilmez); yanıttaki bakiyeyle eşitlenir.
 * - İstemci useAuth üzerinden harcama ya da yükleme bildirerek bu işler için harcama ya da iade bildirmez: kesinti ve iade sunucuda.
 * - 401: giriş penceresi açılır. 402: "Kredi yükle" yönlendirmeli bildirim (mesaj.yetersizKredi).
 */

export const ISLEM_BASLIGI = "x-islem-anahtari";
export const yeniIslemAnahtari = (on = "r") => islemAnahtari(on);

export interface KrediAlani { harcanan: number; bakiye?: number; iade?: true }
export type KrediYaniti = { ok?: boolean; hata?: string; kod?: string; gereken?: number; bakiye?: number; kredi?: KrediAlani };

/** Yanıttaki sunucu bakiyesi: { kredi: { bakiye } }, 402/409 gövdesindeki bakiye ya da x-kredi-bakiye başlığı. */
export function yanitBakiyesi(j: unknown, yanit?: Response | null): number | undefined {
  const v = j as KrediYaniti | null;
  const b = v?.kredi?.bakiye ?? v?.bakiye ?? (yanit?.headers.get("x-kredi-bakiye") ? Number(yanit.headers.get("x-kredi-bakiye")) : undefined);
  return typeof b === "number" && Number.isFinite(b) ? b : undefined;
}

/** 401 ve 402 yanıtlarını kullanıcıya gösterir. Ele alındıysa true. */
export function krediHatasiGoster(durum: number, j: unknown): boolean {
  const v = (j ?? {}) as KrediYaniti;
  if (durum === 401) {
    useAuthKapi.getState().ac({ baslik: "Devam etmek için giriş yap", altBaslik: "Oturumun kapalı. Giriş yapınca kaldığın yerden sürdürebilirsin." });
    return true;
  }
  if (durum === 402) {
    mesaj.yetersizKredi(v.gereken ?? 0, v.bakiye ?? useAuth.getState().kullanici?.krediler ?? 0);
    return true;
  }
  return false;
}

export interface KrediliSonuc<T> { durum: number; j: (T & KrediYaniti) | null; anahtar: string; kesilen: number }

/**
 * Krediyi sunucuda kesen bir rotaya istek: yerel ayırma, işlem anahtarı, bakiye eşitleme, 401/402 gösterimi.
 * kredi: arayüzde gösterilen bedel (yerel ayırma ve sunucuya bildirim için; sunucu kendi tabanının altına inmez).
 * Bakiye yerelde yetmezse istek gönderilmez ve { durum: 402 } döner.
 */
export async function krediliIstek<T = Record<string, unknown>>(url: string, g: {
  kredi: number; json?: unknown; form?: FormData; method?: string; anahtar?: string; sessiz?: boolean; signal?: AbortSignal;
}): Promise<KrediliSonuc<T>> {
  const anahtar = g.anahtar ?? yeniIslemAnahtari();
  const jeton = useAuth.getState().krediAyir(g.kredi);
  if (jeton === null) {
    if (!g.sessiz) mesaj.yetersizKredi(Math.ceil(g.kredi), useAuth.getState().kullanici?.krediler ?? 0);
    return { durum: 402, j: null, anahtar, kesilen: 0 };
  }
  let yanit: Response | null = null;
  let j: (T & KrediYaniti) | null = null;
  try {
    yanit = await fetch(url, {
      method: g.method ?? "POST",
      headers: { [ISLEM_BASLIGI]: anahtar, ...(g.json !== undefined ? { "Content-Type": "application/json" } : {}) },
      body: g.form ?? (g.json !== undefined ? JSON.stringify(g.json) : undefined),
      signal: g.signal,
    });
    j = (await yanit.json().catch(() => null)) as (T & KrediYaniti) | null;
  } catch (e) {
    // Ağ hatası: kesilip kesilmediği bilinmiyor. Ekrandaki ayırma geri alınır, bakiye sunucudan yeniden okunur.
    useAuth.getState().krediBirak(jeton);
    setTimeout(() => void useAuth.getState().esitle(), 1500);
    throw e;
  }
  useAuth.getState().krediBirak(jeton, yanitBakiyesi(j, yanit));
  if (!g.sessiz) krediHatasiGoster(yanit.status, j);
  return { durum: yanit.status, j, anahtar, kesilen: j?.kredi && !j.kredi.iade ? j.kredi.harcanan : 0 };
}

/** Sunucunun döndürdüğü hata metni; 401 ve 402 için kısa açıklama. */
export function krediliHata(s: { durum: number; j: KrediYaniti | null }, varsayilan: string): string {
  if (s.durum === 401) return "Oturumun kapalı. Giriş yapıp yeniden dene.";
  if (s.durum === 402) return s.j?.hata ?? "Kredin yetmiyor.";
  return s.j?.hata ?? varsayilan;
}
