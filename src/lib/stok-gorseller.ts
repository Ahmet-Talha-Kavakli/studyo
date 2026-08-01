/**
 * Stok Görsel Havuzu
 * -------------------
 * public/stok/ altındaki telifsiz (Picsum) stok görsellerinin merkezi kaydı.
 * Gradyan placeholder kartların yerine gerçek görsel koymak için kullanılır.
 *
 * Tüm yollar public köküne göredir (örn "/stok/sinematik/cinema1.webp"),
 * dolayısıyla <img src>, next/image ve CSS background-image ile doğrudan çalışır.
 *
 * ÖNEMLİ: SSR/hydration bozulmaması için burada Math.random KULLANILMAZ.
 * Seçimler ya index ya da string-seed hash'i ile deterministiktir.
 */

/** Kategori -> public path dizisi eşlemesi. */
export const STOK_GORSELLER: Record<string, string[]> = {
  sinematik: [
    "/stok/sinematik/cinema1.webp",
    "/stok/sinematik/cinema2.webp",
    "/stok/sinematik/cinema3.webp",
    "/stok/sinematik/cinema4.webp",
    "/stok/sinematik/cinema5.webp",
    "/stok/sinematik/cinema6.webp",
    "/stok/sinematik/cinema7.webp",
    "/stok/sinematik/cinema8.webp",
    "/stok/sinematik/cinema9.webp",
    "/stok/sinematik/cinema10.webp",
    "/stok/sinematik/cinema11.webp",
    "/stok/sinematik/cinema12.webp",
  ],
  portre: [
    "/stok/portre/portrait1.webp",
    "/stok/portre/portrait2.webp",
    "/stok/portre/portrait3.webp",
    "/stok/portre/portrait4.webp",
    "/stok/portre/portrait5.webp",
    "/stok/portre/portrait6.webp",
    "/stok/portre/portrait7.webp",
    "/stok/portre/portrait8.webp",
    "/stok/portre/portrait9.webp",
    "/stok/portre/portrait10.webp",
    "/stok/portre/portrait11.webp",
    "/stok/portre/portrait12.webp",
  ],
  urun: [
    "/stok/urun/product1.webp",
    "/stok/urun/product2.webp",
    "/stok/urun/product3.webp",
    "/stok/urun/product4.webp",
    "/stok/urun/product5.webp",
    "/stok/urun/product6.webp",
    "/stok/urun/product7.webp",
    "/stok/urun/product8.webp",
    "/stok/urun/product9.webp",
    "/stok/urun/product10.webp",
    "/stok/urun/product11.webp",
    "/stok/urun/product12.webp",
  ],
  manzara: [
    "/stok/manzara/scene1.webp",
    "/stok/manzara/scene2.webp",
    "/stok/manzara/scene3.webp",
    "/stok/manzara/scene4.webp",
    "/stok/manzara/scene5.webp",
    "/stok/manzara/scene6.webp",
    "/stok/manzara/scene7.webp",
    "/stok/manzara/scene8.webp",
    "/stok/manzara/scene9.webp",
    "/stok/manzara/scene10.webp",
    "/stok/manzara/scene11.webp",
    "/stok/manzara/scene12.webp",
  ],
  soyut: [
    "/stok/soyut/abstract1.webp",
    "/stok/soyut/abstract2.webp",
    "/stok/soyut/abstract3.webp",
    "/stok/soyut/abstract4.webp",
    "/stok/soyut/abstract5.webp",
    "/stok/soyut/abstract6.webp",
    "/stok/soyut/abstract7.webp",
    "/stok/soyut/abstract8.webp",
    "/stok/soyut/abstract9.webp",
    "/stok/soyut/abstract10.webp",
    "/stok/soyut/abstract11.webp",
    "/stok/soyut/abstract12.webp",
  ],
  "3d": [
    "/stok/3d/render1.webp",
    "/stok/3d/render2.webp",
    "/stok/3d/render3.webp",
    "/stok/3d/render4.webp",
    "/stok/3d/render5.webp",
    "/stok/3d/render6.webp",
    "/stok/3d/render7.webp",
    "/stok/3d/render8.webp",
    "/stok/3d/render9.webp",
    "/stok/3d/render10.webp",
    "/stok/3d/render11.webp",
    "/stok/3d/render12.webp",
  ],
};

/** Tüm kategorilerin düz halde birleştirilmiş tam listesi. */
export const TUM: string[] = Object.values(STOK_GORSELLER).flat();

/** Kullanılabilir kategori anahtarları. */
export const KATEGORILER: string[] = Object.keys(STOK_GORSELLER);

/**
 * Bir string seed'i pozitif tamsayı hash'e çevirir (djb2 türevi).
 * Deterministiktir: aynı seed her zaman aynı sayıyı verir.
 * SSR ve client'ta aynı sonucu ürettiği için hydration'ı bozmaz.
 */
function seedHash(seed: string): number {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    // hash * 33 + karakterKodu
    hash = (hash * 33) ^ seed.charCodeAt(i);
  }
  // 32-bit işaretsiz tamsayıya sabitle
  return hash >>> 0;
}

/**
 * Bir kategoriden deterministik (döngüsel/modulo) görsel seçer.
 * index havuz boyutunu aşsa bile modulo ile başa döner.
 * Kategori bilinmiyorsa TUM havuzundan seçer.
 */
export function stokGorsel(kategori: string, index: number): string {
  const havuz = STOK_GORSELLER[kategori] ?? TUM;
  if (havuz.length === 0) return TUM[0];
  // Negatif index güvenliği
  const guvenli = ((Math.trunc(index) % havuz.length) + havuz.length) % havuz.length;
  return havuz[guvenli];
}

/**
 * String seed'den deterministik TEK görsel döndürür (tüm havuzdan).
 * Math.random KULLANMAZ; aynı seed her render'da aynı görseli verir,
 * böylece SSR/client uyumsuzluğu (hydration hatası) yaşanmaz.
 * İsteğe bağlı kategori verilirse seçim o kategoriyle sınırlandırılır.
 */
export function rastgeleStok(seed: string, kategori?: string): string {
  const havuz = kategori ? (STOK_GORSELLER[kategori] ?? TUM) : TUM;
  if (havuz.length === 0) return TUM[0];
  return havuz[seedHash(seed) % havuz.length];
}
