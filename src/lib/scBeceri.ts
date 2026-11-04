import { create } from "zustand";
import { persist } from "zustand/middleware";
import { alanlariKoru } from "@/store/gocHelper";

/**
 * Usta becerileri (Claude Skills karşılığı) — her beceri gerçek bir talimat paketidir.
 * Açık beceriler sohbette "/komut" ile ya da + menüsünden seçilir; seçilen becerinin talimatı o mesajda
 * sistem istemine eklenir. Kullanıcı kendi becerisini yazabilir ya da SKILL.md içe aktarabilir.
 */
export type ScBeceri = {
  id: string;
  ad: string;
  /** Sohbette "/komut" — küçük harf, boşluksuz. */
  komut: string;
  aciklama: string;
  /** Modele giden talimat. */
  talimat: string;
  ikon: "kalem" | "megafon" | "liste" | "posta" | "kod" | "tablo" | "dil" | "sunum" | "film" | "istem" | "ogret" | "arama";
  /** Kullanıcının yazdığı beceri mi. */
  ozel?: boolean;
};

export const HAZIR_BECERILER: ScBeceri[] = [
  { id: "marka-sesi", ad: "Marka sesi", komut: "marka", ikon: "kalem", aciklama: "Metni tutarlı bir marka tonuna çevirir",
    talimat: "Kullanıcının verdiği metni ya da isteği tutarlı bir marka sesiyle yaz. Önce markanın tonunu (samimi/resmî, enerjik/sakin) mesajdan, proje talimatından ya da bellekten çıkar; yoksa tek cümlelik bir varsayım belirt. Kısa cümleler, etken çatı, somut fiiller kullan; klişe ve abartılı sıfatlardan kaçın. Sonunda 'Ton notu:' başlığıyla 2-3 maddede hangi tercihleri yaptığını yaz." },
  { id: "sosyal-medya", ad: "Sosyal medya paketi", komut: "sosyal", ikon: "megafon", aciklama: "Instagram, TikTok, X ve LinkedIn için gönderi seti",
    talimat: "Verilen konu için platforma özel bir gönderi seti hazırla: Instagram (ilk satır kanca, 3-5 kısa paragraf, 8-12 hashtag), TikTok (ilk 2 saniyelik kanca + 15-30 sn senaryo + ekran yazıları), X (280 karakteri aşmayan 2 alternatif), LinkedIn (profesyonel ton, 1 içgörü + soru ile kapanış). Her bölümü başlıkla ayır ve önerilen paylaşım saatini ekle." },
  { id: "toplanti-notu", ad: "Toplantı notu", komut: "not", ikon: "liste", aciklama: "Dağınık notları özet, karar ve aksiyona çevirir",
    talimat: "Verilen notları ya da dökümü şu yapıda düzenle: ## Özet (3 cümle), ## Alınan kararlar (madde), ## Aksiyonlar (tablo: İş | Sorumlu | Tarih; bilinmeyeni '—' bırak), ## Açık sorular. Uydurma isim ya da tarih ekleme." },
  { id: "e-posta", ad: "E-posta", komut: "eposta", ikon: "posta", aciklama: "Amaca göre net, kibar e-posta yazar",
    talimat: "İsteğe göre bir e-posta yaz: konu satırı (en çok 60 karakter), selamlama, ilk cümlede amaç, en çok 3 kısa paragraf, net bir çağrı ve kapanış. Ardından 'Daha kısa sürüm' başlığıyla 3 cümlelik alternatif ver. Ton belirtilmemişse nazik-profesyonel kullan." },
  { id: "kod-inceleme", ad: "Kod incelemesi", komut: "inceleme", ikon: "kod", aciklama: "Hataları, güvenliği ve sadeleştirmeyi denetler",
    talimat: "Verilen kodu bir kıdemli geliştirici gibi incele. Bulguları önem sırasıyla listele: önce hatalar ve güvenlik sorunları (satır/parça göster, neden yanlış, nasıl düzelir), sonra performans, sonra okunabilirlik. Her bulgu için düzeltilmiş kod parçası ver. Sorun yoksa bunu açıkça söyle; olmayan sorun uydurma." },
  { id: "veri-analizi", ad: "Veri analizi", komut: "veri", ikon: "tablo", aciklama: "Tablo/CSV verisinden içgörü ve grafik önerisi",
    talimat: "Verilen tablo ya da CSV verisini analiz et: önce veri hakkında 1-2 cümle (satır/sütun, eksikler), sonra en önemli 3-5 bulgu (sayılarla), ardından uygun grafik türü önerisi ve gerekirse Python (pandas + matplotlib) kodu. Hesapları gösterilen veriye dayandır; tahmin ediyorsan belirt." },
  { id: "ceviri", ad: "Çeviri", komut: "cevir", ikon: "dil", aciklama: "Anlamı ve tonu koruyarak doğal çeviri",
    talimat: "Metni hedef dile çevir (belirtilmemişse Türkçe↔İngilizce). Kelime kelime değil, anlam ve ton koruyarak doğal çevir; deyimleri hedef dildeki karşılığıyla ver. Çeviriden sonra, varsa 'Notlar:' başlığıyla çevrilemeyen ya da çok anlamlı ifadeleri açıkla." },
  { id: "sunum", ad: "Sunum taslağı", komut: "sunum", ikon: "sunum", aciklama: "Slayt slayt sunum akışı ve konuşma notları",
    talimat: "Konu için 8-12 slaytlık bir sunum taslağı çıkar. Her slayt için: '### Slayt N — Başlık', en çok 4 madde, önerilen görsel ve 'Konuşma notu:' (2-3 cümle). Açılışta kanca, sonda net bir çağrı slaytı olsun." },
  { id: "video-senaryosu", ad: "Video senaryosu", komut: "senaryo", ikon: "film", aciklama: "Sahne sahne çekim senaryosu ve ekran yazıları",
    talimat: "İstenen süre ve platform için video senaryosu yaz. Tablo kullan: Süre | Görüntü | Ses/Diyalog | Ekran yazısı. İlk 3 saniye güçlü bir kanca olsun, sonda çağrı olsun. Ardından Vayra'da üretmek için her sahneye uygun kısa bir görsel/video istemi öner." },
  { id: "istem-muhendisi", ad: "İstem mühendisi", komut: "istem", ikon: "istem", aciklama: "Görsel ve video modelleri için güçlü istem yazar",
    talimat: "Kullanıcının fikrini görsel/video üretim modelleri için güçlü bir isteme çevir. Şu sırayı kullan: özne, eylem, ortam, ışık, kamera (açı, lens, hareket), stil/estetik, renk paleti, kalite anahtar kelimeleri. Bir ana istem, iki farklı varyasyon ve kaçınılacaklar (negatif istem) ver. İstemleri İngilizce, açıklamaları Türkçe yaz." },
  { id: "ogretmen", ad: "Öğretmen", komut: "ogret", ikon: "ogret", aciklama: "Konuyu adım adım öğretir, sonunda dener",
    talimat: "Konuyu kullanıcının seviyesine göre adım adım öğret: önce sezgisel açıklama ve gündelik bir benzetme, sonra kesin tanım, sonra çözümlü bir örnek. Her bölüm kısa olsun. Sonunda anlamayı ölçen 3 soru sor ve cevapları altta 'Yanıtlar' başlığıyla ver." },
  { id: "rakip-analizi", ad: "Rakip analizi", komut: "rakip", ikon: "arama", aciklama: "Rakipleri karşılaştırır, konumlandırma önerir",
    talimat: "Verilen ürün/marka için rakip analizi yap. Web araması açıksa güncel kaynaklara dayan ve alıntıla; kapalıysa bilgilerinin güncel olmayabileceğini belirt. Karşılaştırma tablosu (Rakip | Güçlü yan | Zayıf yan | Fiyat | Hedef kitle), ardından boşluklar ve 3 net konumlandırma önerisi ver." },
];

/** SKILL.md (Claude beceri biçimi) → beceri: üst bilgi (name, description) + gövde talimat. */
export function skillMdOku(metin: string): Omit<ScBeceri, "id" | "ikon"> | null {
  const m = metin.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const ust = m?.[1] ?? "", govde = (m ? m[2] : metin).trim();
  const alan = (a: string) => ust.match(new RegExp(`^${a}:\\s*["']?(.+?)["']?\\s*$`, "mi"))?.[1]?.trim();
  const ad = alan("name") ?? govde.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (!ad || !govde) return null;
  return { ad: ad.slice(0, 60), komut: komutYap(ad), aciklama: (alan("description") ?? "").slice(0, 160), talimat: govde.slice(0, 8000), ozel: true };
}
export const komutYap = (ad: string) => ad.toLocaleLowerCase("tr").replace(/[çğıöşü]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[c]!).replace(/[^a-z0-9]+/g, "").slice(0, 20) || "beceri";

interface ScBeceriState {
  /** Açık beceri kimlikleri (hazır + özel). */
  acik: string[];
  ozel: ScBeceri[];
  degistir: (id: string) => void;
  ekle: (b: Omit<ScBeceri, "id">) => string;
  guncelle: (id: string, p: Partial<ScBeceri>) => void;
  sil: (id: string) => void;
}

export const useScBeceri = create<ScBeceriState>()(
  persist(
    (set) => ({
      acik: ["marka-sesi", "sosyal-medya", "toplanti-notu", "e-posta", "video-senaryosu", "istem-muhendisi"],
      ozel: [],
      degistir: (id) => set((s) => ({ acik: s.acik.includes(id) ? s.acik.filter((x) => x !== id) : [...s.acik, id] })),
      ekle: (b) => { const id = `oz-${Date.now().toString(36)}`; set((s) => ({ ozel: [{ ...b, id, ozel: true }, ...s.ozel], acik: [...s.acik, id] })); return id; },
      guncelle: (id, p) => set((s) => ({ ozel: s.ozel.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      sil: (id) => set((s) => ({ ozel: s.ozel.filter((x) => x.id !== id), acik: s.acik.filter((x) => x !== id) })),
    }),
    { name: "vayra-sc-beceri", version: 1, migrate: alanlariKoru },
  ),
);

/** Tüm beceriler (hazır + özel). */
export const tumBeceriler = () => [...useScBeceri.getState().ozel, ...HAZIR_BECERILER];
/** Açık beceriler. */
export const acikBeceriler = () => { const s = useScBeceri.getState(); return tumBeceriler().filter((b) => s.acik.includes(b.id)); };
