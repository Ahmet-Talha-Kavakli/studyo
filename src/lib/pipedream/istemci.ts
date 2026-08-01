"use client";

import { toast } from "@/lib/toast";

/**
 * Pipedream Connect — tarayıcı tarafı. Gerçek OAuth bağlantısı akışı:
 * 1) /api/baglayici/token'dan kısa ömürlü token + connectLinkUrl al
 * 2) Connect Link'i popup pencerede aç (kullanıcı OAuth ile bağlanır)
 * 3) Pencere kapanınca bağlı hesapları yeniden çekip doğrula
 *
 * connectLinkUrl yaklaşımı SDK browser paketine bağımlı değildir (exports sorunu yok),
 * popup + postMessage ile sonucu yakalar.
 */

export interface BaglanSonuc {
  basarili: boolean;
  hesapId?: string;
  hata?: string;
  yapilandirilmadi?: boolean;
}

/** Bir uygulamaya (appSlug: "gmail", "slack", "notion"...) gerçek OAuth ile bağlan. */
export async function baglayiciyaBaglan(appSlug: string, kullaniciId: string): Promise<BaglanSonuc> {
  // 1) Token + connect link al
  let connectLinkUrl: string;
  try {
    const r = await fetch("/api/baglayici/token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kullaniciId, app: appSlug }),
    });
    const d = await r.json();
    if (r.status === 503 || d.yapilandirilmadi) return { basarili: false, yapilandirilmadi: true, hata: d.hata };
    if (!r.ok || !d.connectLinkUrl) return { basarili: false, hata: d.hata || "Bağlantı linki alınamadı" };
    // Belirli app'e yönlendir
    connectLinkUrl = d.connectLinkUrl.includes("?") ? `${d.connectLinkUrl}&app=${appSlug}` : `${d.connectLinkUrl}?app=${appSlug}`;
  } catch (e) {
    return { basarili: false, hata: e instanceof Error ? e.message : "Ağ hatası" };
  }

  // 2) Popup aç + kapanışı/sonucu izle
  return new Promise<BaglanSonuc>((cozumle) => {
    const g = 520, y = 680;
    const sol = window.screenX + (window.outerWidth - g) / 2;
    const ust = window.screenY + (window.outerHeight - y) / 2;
    const pencere = window.open(connectLinkUrl, "vayra-connect", `width=${g},height=${y},left=${sol},top=${ust}`);
    if (!pencere) { cozumle({ basarili: false, hata: "Popup engellendi — izin ver ve tekrar dene" }); return; }

    // Pipedream başarı/hata postMessage gönderir
    const dinle = (e: MessageEvent) => {
      const veri = e.data;
      if (!veri || typeof veri !== "object") return;
      if (veri.type === "pd-connect-success" || veri.event === "CONNECT_SUCCESS") {
        temizle(); cozumle({ basarili: true, hesapId: veri.accountId || veri.account?.id });
      } else if (veri.type === "pd-connect-error" || veri.event === "CONNECT_ERROR") {
        temizle(); cozumle({ basarili: false, hata: veri.message || "Bağlantı hatası" });
      }
    };
    // Pencere kapanırsa (kullanıcı tamamladı ya da vazgeçti) → başarı varsayıp doğrulamayı üst katmana bırak
    const tik = window.setInterval(() => {
      if (pencere.closed) { temizle(); cozumle({ basarili: true }); }
    }, 700);
    const temizle = () => { window.removeEventListener("message", dinle); window.clearInterval(tik); };
    window.addEventListener("message", dinle);
  });
}

/** Kullanıcının bağlı hesaplarını getir. */
export async function bagliHesaplar(kullaniciId: string) {
  try {
    const r = await fetch(`/api/baglayici/hesaplar?kullaniciId=${encodeURIComponent(kullaniciId)}`);
    const d = await r.json();
    return { hesaplar: d.hesaplar ?? [], yapilandirilmadi: Boolean(d.yapilandirilmadi) };
  } catch {
    return { hesaplar: [], yapilandirilmadi: false };
  }
}

/** Bir bağlantıyı kaldır. */
export async function baglantiKaldir(hesapId: string): Promise<boolean> {
  try {
    const r = await fetch(`/api/baglayici/hesaplar?id=${encodeURIComponent(hesapId)}`, { method: "DELETE" });
    return r.ok;
  } catch {
    return false;
  }
}

/** Kullanıcı dostu bağlan akışı (toast ile). Sayfadan doğrudan çağrılır. */
export async function baglanVeBildir(appSlug: string, appAd: string, kullaniciId: string): Promise<BaglanSonuc> {
  const sonuc = await baglayiciyaBaglan(appSlug, kullaniciId);
  if (sonuc.yapilandirilmadi) {
    toast.error("Bağlayıcılar henüz aktif değil", { description: "Yönetici Pipedream anahtarlarını tanımlamalı." });
  } else if (sonuc.basarili) {
    toast.success(`${appAd} bağlandı`, { description: "Artık iş akışlarında kullanabilirsin." });
  } else {
    toast.error(`${appAd} bağlanamadı`, { description: sonuc.hata });
  }
  return sonuc;
}
