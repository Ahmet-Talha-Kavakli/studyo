/**
 * gocHelper — persist'li store'lar için güvenli varsayılan göç (migration).
 *
 * SORUN (ölçüldü 2026-07-31): 18 store `persist(..., { version: N })` kullanıyor
 * ama `migrate` vermiyordu. Zustand'ın davranışı şu: kayıtlı sürüm ile kod
 * sürümü FARKLIYSA ve `migrate` yoksa kayıtlı durumu TAMAMEN ATAR ve konsola
 * "State loaded from storage couldn't be migrated since no migrate function
 * was provided" yazar.
 *
 * Yani ileride herhangi bir store'un `version` numarası artırıldığında,
 * kullanıcının o store'daki tüm verisi sessizce silinirdi:
 *   · useMuzik      → üretilen parçalar, klonlanan sesler, özel stiller
 *   · useKoleksiyon → klasörler ve içindekiler
 *   · useTaslak     → kaydedilmiş taslaklar
 *   · usePazarlama  → sabitlenen avatarlar, oluşturulan ortam/kanca/stil
 *
 * ÇÖZÜM: alanları KORUYAN bir varsayılan göç. Eski durumu olduğu gibi geçirir;
 * kodda sonradan eklenen alanlar `undefined` kalır ve store'un kendi
 * varsayılanlarıyla birleşir (zustand persist zaten `{...initial, ...persisted}`
 * yapar). Böylece sürüm artırmak veri kaybettirmez.
 *
 * Şema GERÇEKTEN kırıcı biçimde değişirse (alan adı değişimi, tip değişimi) o
 * store kendi özel `migrate`ini yazmalı — bu yalnız güvenli taban.
 */

/**
 * Alanları koruyan varsayılan göç.
 *
 * @example
 *   persist(fn, { name: "vayra-muzik", version: 2, migrate: alanlariKoru })
 */
export function alanlariKoru<T>(kayitli: unknown, _oncekiSurum: number): T {
  // Kayıtlı durum beklenen biçimde değilse (bozuk/boş) store varsayılanına düş.
  if (!kayitli || typeof kayitli !== "object") return {} as T;
  return kayitli as T;
}
