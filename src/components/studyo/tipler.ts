/**
 * Stüdyo bileşenlerinin GÖMÜLÜ MOD sözleşmesi (2026-08-02).
 *
 * Kullanıcı isteği: /panel/projeler/[id] "Tüm varlıklar" sekmesinde bir stüdyo
 * seçici olacak ve seçilen stüdyonun composer'ı BİREBİR aynısı gelecek.
 *
 * Yaklaşım: composer'lar KOPYALANMAZ. Her stüdyo sayfası kendi bileşenine
 * taşındı (`src/components/studyo/*`); route dosyası onu propsuz sarar, proje
 * sekmesi ise `gomulu` ile mount eder. Böylece tek kaynak kalır — stüdyo
 * sayfasında yapılan her değişiklik proje sekmesine de aynen yansır.
 *
 * Gömülü modda bileşen YALNIZ composer'ını gösterir: kendi galerisini, mobil
 * tam-ekran kabuğunu ve sabit (fixed) yerleşimini kapatır.
 */
export type StudyoGomuluProps = {
  /** true → yalnız composer render edilir, galeri/kabuk gizlenir. */
  gomulu?: boolean;
  /** Üretimlerin bağlanacağı proje — gömülüyken aktif projenin yerine geçer. */
  projeId?: string;
  /** Üretim başlayınca çağrılır (klasöre atama vb. için). */
  onUretildi?: (uretimId: string) => void;
};
