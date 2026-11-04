/**
 * ÜRET HUB verisi — Higgsfield "Create" (higgsfield.ai/flow) modalının BİREBİR
 * Türkçe karşılığı. Mobilde /panel/olustur açılınca önce bu hub görünür:
 *   ┌ "Üret" başlığı (sticky) + daire ✕
 *   │ sekme şeridi (sticky): Tümü · Yeni · Görseller · Videolar · Düzenle · Karakterler · Modeller
 *   │   → aktif sekme BEYAZ pill + koyu metin; pasif = zeminsiz gri metin
 *   │ dev hero kart (Viral Presetler) — tam genişlik, NEW rozeti
 *   └ 2 sütun araç kartları (görsel + AD bold + açıklama gri + rozet sol-üst)
 *
 * Referans: ~/Desktop/referanslar/alagam (22 ekran, 67 kart). Higgsfield "All"
 * akışının tamamı buraya çıkarıldı; adlar Vayra Türkçesine uyarlandı, hedefler
 * bizim mevcut rotalara/modellere eşlendi.
 *
 * ROZET RENKLERİ (referans birebir):
 *   YENİ(NEW)=lime #55D6FD · TEMEL(CORE)=mavi #2f6bff · TOP=mor #8b5cf6
 *   PRO=mor #7b4bff · EN İYİ(BEST/TOP CHOICE)=kırmızı #e5484d
 */

export type HubSekme = "tumu" | "yeni" | "gorseller" | "videolar" | "duzenle" | "karakterler" | "modeller";

export type HubRozet = "YENİ" | "TEMEL" | "TOP" | "PRO" | "EN İYİ";

export interface HubKart {
  id: string;
  ad: string;
  ozet: string;
  href: string;
  rozet?: HubRozet;
  /** Kartın hangi sekmelerde görüneceği. "tumu" her zaman dahildir. */
  sekmeler: Exclude<HubSekme, "tumu">[];
  /** Önizleme görseli için stok kategori tohumu. */
  kategori: "sinematik" | "portre" | "soyut" | "3d" | "urun" | "moda";
  /** Kart oranı — çoğu 4:3, hero 16:9. */
  oran?: "4:3" | "16:9" | "3:4" | "1:1";
}

/** ROZET RENKLERİ — Higgsfield birebir. */
export const HUB_ROZET_RENK: Record<HubRozet, { bg: string; metin: string }> = {
  "YENİ": { bg: "#55d6fd", metin: "#04222c" },
  "TEMEL": { bg: "#2f6bff", metin: "#ffffff" },
  "TOP": { bg: "#8b5cf6", metin: "#ffffff" },
  "PRO": { bg: "#7b4bff", metin: "#ffffff" },
  "EN İYİ": { bg: "#e5484d", metin: "#ffffff" },
};

/** Sekme etiketleri (şerit sırası — referans birebir). */
export const HUB_SEKMELER: { id: HubSekme; ad: string }[] = [
  { id: "tumu", ad: "Tümü" },
  { id: "yeni", ad: "Yeni" },
  { id: "gorseller", ad: "Görseller" },
  { id: "videolar", ad: "Videolar" },
  { id: "duzenle", ad: "Düzenle" },
  { id: "karakterler", ad: "Karakterler" },
  { id: "modeller", ad: "Modeller" },
];

/** HERO — dev "Viral Presetler" kartı (referansta en üstte, tam genişlik). */
export const HUB_HERO: HubKart = {
  id: "hero-viral",
  ad: "Vayra Viral Presetler",
  ozet: "Her viral preset ve trend olan format",
  href: "/panel/presetler",
  rozet: "YENİ",
  sekmeler: ["yeni", "gorseller", "videolar"],
  kategori: "moda",
  oran: "16:9",
};

/** ARAÇ KARTLARI — Higgsfield "All" akışının 67 kartı (referans birebir sıra).
    g=görseller, v=videolar, d=düzenle, k=karakterler, m=modeller, y=yeni. */
export const HUB_KARTLAR: HubKart[] = [
  // ── Çekirdek (CORE) ──
  { id: "gorsel", ad: "Görsel Üret", ozet: "Yapay zeka görselleri üret", href: "/panel/gorsel", rozet: "TEMEL", sekmeler: ["gorseller"], kategori: "portre" },
  { id: "video", ad: "Video Üret", ozet: "Yapay zeka videoları üret", href: "/panel/video", rozet: "TEMEL", sekmeler: ["videolar"], kategori: "sinematik" },
  { id: "m-seedream-pro", ad: "Seedream 5.0 Pro", ozet: "ByteDance'in üst düzey akıl yürütmeli görsel modeli", href: "/panel/gorsel?model=seedream-5", rozet: "YENİ", sekmeler: ["gorseller", "modeller"], kategori: "portre" },
  { id: "m-seedance-4k", ad: "Seedance 2.0 4K", ozet: "Yerel 4K video üretimi", href: "/panel/video?model=seedance-2", rozet: "TOP", sekmeler: ["videolar", "modeller"], kategori: "sinematik" },
  { id: "shorts", ad: "Shorts Stüdyosu", ozet: "Görüntülerine sahne ışığı ver", href: "/panel/shorts", rozet: "YENİ", sekmeler: ["videolar"], kategori: "sinematik" },
  { id: "explainer", ad: "Vayra Explainer", ozet: "Her konuyu altyazılı anlatım videosuna", href: "/panel/explainer", rozet: "YENİ", sekmeler: ["videolar"], kategori: "soyut" },
  { id: "m-gemini-flash", ad: "Gemini Omni Flash", ozet: "Her girdiden video üret ve düzenle", href: "/panel/video?model=veo-31", rozet: "YENİ", sekmeler: ["videolar", "modeller"], kategori: "sinematik" },
  { id: "m-nano-lite", ad: "Nano Banana 2 Lite", ozet: "Hızda hafif görsel üretimi", href: "/panel/gorsel?model=nano-banana-pro", rozet: "YENİ", sekmeler: ["gorseller", "modeller"], kategori: "portre" },
  { id: "m-seedaudio", ad: "Seed Audio 1.0", ozet: "Çok konuşmacılı sahneler, konuşma ve ambiyans", href: "/panel/ses", rozet: "YENİ", sekmeler: ["duzenle", "modeller"], kategori: "soyut" },
  { id: "m-gpt2", ad: "GPT Image 2", ozet: "Neredeyse kusursuz metinle 4K görseller", href: "/panel/gorsel?model=gpt-image-2", rozet: "YENİ", sekmeler: ["gorseller", "modeller"], kategori: "portre" },
  { id: "m-recraft", ad: "Recraft 4.1", ozet: "Keskin vektörler, rafine estetik, tam stil kontrolü", href: "/panel/gorsel?model=flux-2", rozet: "YENİ", sekmeler: ["gorseller", "modeller"], kategori: "soyut" },
  { id: "m-grok", ad: "Grok Imagine 1.5", ozet: "Senkron sesli sinematik videolar", href: "/panel/video?model=wan-27", rozet: "YENİ", sekmeler: ["videolar", "modeller"], kategori: "sinematik" },
  { id: "ses", ad: "Ses Üret", ozet: "Yapay zeka seslendirme ve ses değiştirme", href: "/panel/ses", rozet: "TEMEL", sekmeler: ["duzenle"], kategori: "soyut" },
  { id: "pazarlama", ad: "Pazarlama Stüdyosu", ozet: "Hermes Ajanı ile güçlendirildi", href: "/panel/pazarlama", rozet: "YENİ", sekmeler: ["videolar"], kategori: "urun" },
  { id: "m-kling4k", ad: "Kling 3.0 4K", ozet: "Tam 4K çözünürlükte sinema kalitesinde video", href: "/panel/video?model=kling-3", rozet: "YENİ", sekmeler: ["videolar", "modeller"], kategori: "sinematik" },
  { id: "photodump", ad: "Photodump", ozet: "Kendi photodump'ını oluştur", href: "/panel/photodump", rozet: "YENİ", sekmeler: ["gorseller"], kategori: "portre" },
  { id: "sinema", ad: "Soul Sinema", ozet: "Sinematik film kalitesinde estetik", href: "/panel/sinema", sekmeler: ["gorseller", "videolar"], kategori: "sinematik" },
  { id: "m-soul2", ad: "Soul 2.0", ozet: "Yeni nesil ultra-gerçekçi moda görselleri", href: "/panel/gorsel?model=ruh-2", sekmeler: ["gorseller", "modeller"], kategori: "moda" },
  { id: "moodboard", ad: "Moodboard", ozet: "Referans görsellerle stilini tanımla", href: "/panel/moodboard", rozet: "YENİ", sekmeler: ["gorseller"], kategori: "moda" },
  { id: "soul-id", ad: "Soul ID", ozet: "Benzersiz karakter oluştur", href: "/panel/karakter/yeni", sekmeler: ["karakterler"], kategori: "portre" },
  { id: "m-nano2", ad: "Nano Banana 2", ozet: "Şimdiye kadarki en iyi 4K görsel modeli", href: "/panel/gorsel?model=nano-banana-pro", sekmeler: ["gorseller", "modeller"], kategori: "portre" },
  { id: "m-seedream-lite", ad: "Seedream 5.0 Lite", ozet: "Akıllı görsel muhakeme", href: "/panel/gorsel?model=seedream-5", sekmeler: ["gorseller", "modeller"], kategori: "portre" },
  { id: "m-kling-motion", ad: "Kling 3.0 Hareket Kontrolü", ozet: "Karakter aksiyon ve ifadelerinin hassas kontrolü", href: "/panel/video?arac=motion", rozet: "TOP", sekmeler: ["videolar", "modeller"], kategori: "sinematik" },
  { id: "edit-image", ad: "Görseli Düzenle", ozet: "Alanları fırçalayarak görselleri düzenle", href: "/panel/inpaint", rozet: "TEMEL", sekmeler: ["duzenle"], kategori: "portre" },
  { id: "grok-edit", ad: "Grok Imagine Düzenle", ozet: "Videoları metin istemleriyle düzenle", href: "/panel/video?arac=edit", sekmeler: ["duzenle", "videolar"], kategori: "sinematik" },
  { id: "angles", ad: "Açılar 2.0", ozet: "Artık 360° kapsama, daha iyi kalite", href: "/panel/gorsel?arac=angles", sekmeler: ["duzenle"], kategori: "portre" },
  { id: "influencer", ad: "AI Influencer Stüdyosu", ozet: "Viral karakterler oluştur", href: "/panel/influencer", sekmeler: ["karakterler"], kategori: "moda" },
  { id: "mixed-media", ad: "Karma Medya", ozet: "Videoları AI presetleriyle dönüştür", href: "/panel/video?arac=mixed", sekmeler: ["duzenle", "videolar"], kategori: "sinematik" },
  { id: "whats-next", ad: "Sırada Ne Var?", ozet: "Herhangi bir sahneden 8 hikâye devamı fikri üret", href: "/panel/video?arac=whatsnext", sekmeler: ["videolar"], kategori: "sinematik" },
  { id: "stylist", ad: "AI Stilist", ozet: "Her şeyi anında dene", href: "/panel/gorsel?arac=stylist", sekmeler: ["duzenle"], kategori: "moda" },
  { id: "relight", ad: "Yeniden Işıklandır", ozet: "Işık konumunu ve rengini ayarla", href: "/panel/gorsel?arac=relight", sekmeler: ["duzenle"], kategori: "portre" },
  { id: "m-seedance15", ad: "Seedance 1.5 Pro", ozet: "Profesyonel görsel-işitsel senkron", href: "/panel/video?model=seedance-2", sekmeler: ["videolar", "modeller"], kategori: "sinematik" },
  { id: "m-gpt15", ad: "GPT Image 1.5", ozet: "Gerçek renk hassasiyetiyle işleme", href: "/panel/gorsel?model=gpt-image-2", sekmeler: ["gorseller", "modeller"], kategori: "portre" },
  { id: "m-wan26", ad: "WAN 2.6", ozet: "Çok çekimli sinematik hikâye anlatımı", href: "/panel/video?model=wan-27", sekmeler: ["videolar", "modeller"], kategori: "sinematik" },
  { id: "m-flux-max", ad: "Flux.2 Max", ozet: "Keskin metin, maksimum detay", href: "/panel/gorsel?model=flux-2", sekmeler: ["gorseller", "modeller"], kategori: "soyut" },
  { id: "skin", ad: "Cilt İyileştirici", ozet: "Doğal, gerçekçi cilt dokuları", href: "/panel/gorsel?arac=skin", sekmeler: ["duzenle"], kategori: "portre" },
  { id: "m-kling26", ad: "Kling 2.6", ozet: "Sesli sinematik videolar", href: "/panel/video?model=kling-3", sekmeler: ["videolar", "modeller"], kategori: "sinematik" },
  { id: "upscale", ad: "Yükselt", ozet: "Medya kalitesini artır", href: "/panel/upscale", rozet: "TEMEL", sekmeler: ["duzenle"], kategori: "portre" },
  { id: "lipsync", ad: "Konuştur Stüdyosu", ozet: "Konuşan avatar klipleri oluştur", href: "/panel/speak", rozet: "TEMEL", sekmeler: ["duzenle", "videolar", "karakterler"], kategori: "portre" },
  { id: "m-seedream45", ad: "Seedream 4.5", ozet: "Yeni nesil 4K görsel modeli", href: "/panel/gorsel?model=seedream-5", sekmeler: ["gorseller", "modeller"], kategori: "portre" },
  { id: "m-kling-o1", ad: "Kling O1 Görsel", ozet: "Foto-gerçekçi görseller", href: "/panel/gorsel?model=nano-banana-pro", sekmeler: ["gorseller", "modeller"], kategori: "portre" },
  { id: "kling-video-edit", ad: "Kling Video Düzenle", ozet: "Gelişmiş video düzenleme", href: "/panel/video?arac=edit", sekmeler: ["duzenle", "videolar"], kategori: "sinematik" },
  { id: "urban-cuts", ad: "Urban Cuts", ozet: "Ritme senkronlu kıyafet videoları", href: "/panel/shorts?arac=urban", sekmeler: ["videolar"], kategori: "moda" },
  { id: "m-flux2", ad: "Flux 2.0", ozet: "Gelişmiş görsel düzenleme", href: "/panel/gorsel?model=flux-2", sekmeler: ["gorseller", "modeller"], kategori: "soyut" },
  { id: "style-snap", ad: "Style Snap", ozet: "Anında kıyafet dönüşümleri", href: "/panel/gorsel?arac=stylesnap", sekmeler: ["duzenle"], kategori: "moda" },
  { id: "banana-apps", ad: "Banana Pro Uygulamaları", ozet: "Tek dokunuşla stil dönüşümleri", href: "/panel/uygulamalar", sekmeler: ["duzenle"], kategori: "portre" },
  { id: "plushies", ad: "Peluşlar", ozet: "Bir fotoğraftan peluş tarzı videolar oluştur", href: "/panel/video?arac=plushies", sekmeler: ["videolar"], kategori: "3d" },
  { id: "click-to-ad", ad: "Tıkla Reklam Ol", ozet: "Bir bağlantı yapıştır, video reklam al", href: "/panel/pazarlama", rozet: "PRO", sekmeler: ["videolar"], kategori: "urun" },
  { id: "micro-beasts", ad: "Mini Yaratıklar Paketi", ozet: "Kendini sevimli hayvanlarla çevrele", href: "/panel/video?arac=beasts", sekmeler: ["videolar"], kategori: "3d" },
  { id: "transitions", ad: "Kusursuz Geçişler", ozet: "İki klip. Tek video", href: "/panel/video?arac=transitions", sekmeler: ["videolar", "duzenle"], kategori: "sinematik" },
  { id: "face-swap-video", ad: "Video Yüz Değiştir", ozet: "Her video için sınıfının en iyisi yüz değiştirme", href: "/panel/video?arac=faceswap", sekmeler: ["duzenle", "videolar"], kategori: "portre" },
  { id: "recast", ad: "Bir Kez Oyna, Sonsuz Yeniden Çek", ozet: "Kendini bir kez kaydet, sonra video üret", href: "/panel/influencer", rozet: "PRO", sekmeler: ["karakterler", "videolar"], kategori: "portre" },
  { id: "face-swap", ad: "Yüz Değiştir", ozet: "Gerçekçi yüz değişimleri oluştur", href: "/panel/gorsel?arac=faceswap", sekmeler: ["duzenle"], kategori: "portre" },
  { id: "character-swap", ad: "Karakter Değiştir", ozet: "Gerçekçi karakter değişimleri oluştur", href: "/panel/gorsel?arac=charswap", sekmeler: ["duzenle", "karakterler"], kategori: "portre" },
  { id: "m-veo31", ad: "Veo 3.1", ozet: "Sesli gelişmiş AI video", href: "/panel/video?model=veo-31", sekmeler: ["videolar", "modeller"], kategori: "sinematik" },
  { id: "sketch-to-video", ad: "Çizimden Videoya", ozet: "Çizimlerden tam videolar oluştur", href: "/panel/draw", sekmeler: ["videolar"], kategori: "soyut" },
  { id: "sora-trends", ad: "Sora 2 Trendler", ozet: "Viral içerik oluştur", href: "/panel/video?arac=sora", sekmeler: ["videolar"], kategori: "sinematik" },
  { id: "sora-enhancer", ad: "Sora 2 İyileştirici", ozet: "Genel video kalitesini stabilize eder ve yumuşatır", href: "/panel/video?arac=soraenhance", rozet: "EN İYİ", sekmeler: ["duzenle", "videolar"], kategori: "sinematik" },
  { id: "m-wan25", ad: "WAN 2.5", ozet: "Yeni nesil video + ses", href: "/panel/video?model=wan-27", sekmeler: ["videolar", "modeller"], kategori: "sinematik" },
  { id: "animate", ad: "Vayra Animate", ozet: "Video akıllı değiştirme", href: "/panel/video?arac=animate", sekmeler: ["videolar"], kategori: "sinematik" },
  { id: "fashion", ad: "Moda Fabrikası", ozet: "Moda setleri oluştur", href: "/panel/fashion", sekmeler: ["gorseller"], kategori: "moda" },
  { id: "draw-to-video", ad: "Çizimden Videoya", ozet: "Çizim sinemaya dönüşür", href: "/panel/draw", rozet: "EN İYİ", sekmeler: ["videolar"], kategori: "soyut" },
  { id: "apps", ad: "Vayra Uygulamaları", ozet: "Tek tıkla paylaşıma hazır içerik", href: "/panel/uygulamalar", sekmeler: ["gorseller", "videolar"], kategori: "portre" },
  { id: "ugc", ad: "UGC Fabrikası", ozet: "Avatarla UGC videosu oluştur", href: "/panel/ugc", sekmeler: ["videolar", "karakterler"], kategori: "portre" },
  { id: "reference", ad: "Görsel Referans", ozet: "Karakterle herhangi bir görseli kullan", href: "/panel/gorsel?arac=reference", sekmeler: ["gorseller"], kategori: "portre" },
];

/** Sekmeye göre kartları süz (hero hariç — o ayrı gösterilir). */
export function hubKartlariSuz(sekme: HubSekme): HubKart[] {
  if (sekme === "tumu") return HUB_KARTLAR;
  return HUB_KARTLAR.filter((k) => k.sekmeler.includes(sekme));
}

/* ── MOD DEĞİŞTİRİCİ verisi (composer başlığındaki ⌄) ──
   Referans create-image: FEATURED[Image/Audio/Video/Upscale/Inpaint] + ALL[…].
   id = composer sayfasının kök adı (seçili modu vurgulamak için). */
export interface UretMod { id: string; ad: string; href: string; }

export const MOD_ONE_CIKAN: UretMod[] = [
  { id: "gorsel", ad: "Görsel", href: "/panel/gorsel" },
  { id: "ses", ad: "Ses", href: "/panel/ses" },
  { id: "video", ad: "Video", href: "/panel/video" },
  { id: "upscale", ad: "Yükselt", href: "/panel/upscale" },
  { id: "inpaint", ad: "Inpaint", href: "/panel/inpaint" },
];

export const MOD_TUMU: UretMod[] = [
  { id: "gorsel", ad: "Görsel", href: "/panel/gorsel" },
  { id: "ses", ad: "Ses", href: "/panel/ses" },
  { id: "video", ad: "Video", href: "/panel/video" },
  { id: "video-edit", ad: "Video Düzenle", href: "/panel/video?arac=edit" },
  { id: "explainer", ad: "Explainer", href: "/panel/explainer" },
  { id: "reframe", ad: "Yeniden Çerçevele", href: "/panel/reframe" },
  { id: "muzik", ad: "Müzik", href: "/panel/muzik" },
  { id: "3d", ad: "3D", href: "/panel/3d" },
  { id: "sinema", ad: "Sinema", href: "/panel/sinema" },
  { id: "shorts", ad: "Shorts", href: "/panel/shorts" },
  { id: "pazarlama", ad: "Pazarlama", href: "/panel/pazarlama" },
  { id: "moodboard", ad: "Moodboard", href: "/panel/moodboard" },
  { id: "karakter", ad: "Karakter", href: "/panel/karakter/yeni" },
  { id: "reference", ad: "Referans", href: "/panel/gorsel?arac=reference" },
  { id: "upscale", ad: "Yükselt", href: "/panel/upscale" },
  { id: "inpaint", ad: "Inpaint", href: "/panel/inpaint" },
];
