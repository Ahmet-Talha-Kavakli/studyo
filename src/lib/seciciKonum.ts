/**
 * seciciKonum — açılır seçicilerin (avatar, ürün, element, dil, model…)
 * ekranda DOĞRU yere açılmasını sağlayan ortak hesap (2026-08-02).
 *
 * Sorun (kullanıcı): "avatar seçme, ürün seçme, element seçme, dil seçme gibi
 * seçicilerimiz doğru davranmıyor: ya altta kalıyor ya yanlış yere açılıyor."
 *
 * Kök neden: seçiciler KOŞULSUZ yukarı açılacak şekilde yazılmıştı
 * (`bottom: innerHeight - r.top`). Bu, composer sayfanın en altındayken
 * doğruydu; ama composer yukarıdaysa ya da panel ekrana sığmıyorsa panel
 * görüntü alanının dışına taşıyordu. Yatayda da kırpma yoktu, sağ kenardaki
 * çiplerde panel ekran dışına çıkıyordu.
 *
 * Çözüm: tetikleyicinin gerçek konumuna bakıp yukarı/aşağı YÖNÜ seçmek ve
 * her iki eksende ekran içine sıkıştırmak. `position: fixed` değerleri
 * döner — çağıran bunu portal ile body'ye basmalı (aksi hâlde `transform`
 * / `backdrop-filter` taşıyan bir ata öğe kapsayıcı blok yaratıp konumu
 * bozar; bu hata daha önce ölçüldü).
 */

export type SeciciKonum = {
  /** Sol kenar (px, viewport). */
  left: number;
  /** Üst kenar — panel AŞAĞI açılıyorsa dolu. */
  top?: number;
  /** Alt kenar — panel YUKARI açılıyorsa dolu (`bottom` CSS değeri). */
  bottom?: number;
  /** Panelin sığabileceği en fazla yükseklik; içerik uzunsa kaydırılır. */
  maxYukseklik: number;
  /** Hangi yöne açıldı — animasyon yönü için. */
  yon: "yukari" | "asagi";
};

/**
 * @param tetik  Panelin bağlı olduğu buton/çip.
 * @param genislik Panelin genişliği (px).
 * @param tercih  Tercih edilen yön; sığmazsa öbür yöne çevrilir.
 */
export function seciciKonumHesapla(
  tetik: HTMLElement | null,
  genislik: number,
  tercih: "yukari" | "asagi" = "yukari",
): SeciciKonum | null {
  if (!tetik || typeof window === "undefined") return null;
  const r = tetik.getBoundingClientRect();
  const BOSLUK = 10;        // tetikleyici ile panel arası
  const KENAR = 12;         // ekran kenarı payı
  const EN_AZ = 180;        // bir yönü "sığıyor" saymak için en az yükseklik

  const ustBosluk = r.top - BOSLUK - KENAR;
  const altBosluk = window.innerHeight - r.bottom - BOSLUK - KENAR;

  /* Tercih edilen yön yetersizse ve öbür yön daha genişse yön değiştir. */
  let yon = tercih;
  if (tercih === "yukari" && ustBosluk < EN_AZ && altBosluk > ustBosluk) yon = "asagi";
  if (tercih === "asagi" && altBosluk < EN_AZ && ustBosluk > altBosluk) yon = "yukari";

  /* Yatayda ekran içine sıkıştır — sağ kenardaki çiplerde panel dışarı
     taşıyordu. Panel ekrandan genişse sol kenara yasla. */
  const enFazlaSol = window.innerWidth - genislik - KENAR;
  const left = Math.max(KENAR, Math.min(r.left, Math.max(KENAR, enFazlaSol)));

  return yon === "yukari"
    ? { left, bottom: window.innerHeight - r.top + BOSLUK, maxYukseklik: Math.max(EN_AZ, ustBosluk), yon }
    : { left, top: r.bottom + BOSLUK, maxYukseklik: Math.max(EN_AZ, altBosluk), yon };
}

/** Hesaplanan konumu doğrudan `style` nesnesine çevirir. */
export function seciciStil(k: SeciciKonum): React.CSSProperties {
  return {
    position: "fixed",
    left: k.left,
    ...(k.yon === "yukari" ? { bottom: k.bottom } : { top: k.top }),
    maxHeight: k.maxYukseklik,
    overflowY: "auto",
  };
}
