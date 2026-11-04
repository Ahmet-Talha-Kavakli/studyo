/**
 * Ses Stüdyosu verisi — sesler, diller, modlar, modeller. SSR güvenli (statik).
 *
 * Ses kütüphanesi ElevenLabs'ın hazır sesleridir; her kayıt GERÇEK bir voice_id'ye
 * bire bir bağlıdır (iki farklı ad aynı sesi çalmaz). Sesler çok dilli modellerle
 * Türkçe dahil desteklenen her dilde konuşur; "aksan" sesin kendi aksanıdır.
 */

export type SesMod = "seslendirme" | "diyalog" | "efekt" | "sesdegistir" | "ceviri" | "temizle" | "transkript";

export type SesKullanim = "Sohbet" | "Anlatım" | "Eğitim" | "Sosyal medya" | "Karakter" | "Reklam" | "TV ve eğlence";

export interface SesModel {
  ad: string;
  cinsiyet: "Kadın" | "Erkek" | "Nötr";
  renk: string;   // kapak gradyanı
  /** Kartlarda cinsiyetin yanında gösterilen kısa bilgi (ör. "Amerikan aksanı"). */
  dil: string;
  /** Sağlayıcıdaki ses kimliği (ElevenLabs voice_id). Özel seslerde klonlamadan dönen kimlik. */
  sesId?: string;
  aksan?: string;
  kullanim?: SesKullanim;
  tanim?: string;
  yas?: "Genç" | "Orta yaş" | "Olgun";
}

/** Ses modeli: ad + açıklama + karakter sınırı + desteklediği ayarlar. */
export interface SesUretimModeli {
  ad: string;
  ozet: string;
  /** Tek üretimde en fazla karakter (sağlayıcının sınırı). */
  karakterSiniri: number;
  /** Gerçek sağlayıcıda çalışıyor mu (anahtar girildiğinde). Yoksa "Yakında" — seçilemez. */
  saglayici?: "eleven";
  /** Satır içi ses etiketleri ([whispers] gibi) destekliyor mu. */
  etiketler?: boolean;
  /** Ayrıntılı ses ayarları (benzerlik, stil, hız) destekliyor mu. */
  ayrintiliAyar?: boolean;
  /** Dil zorlama destekliyor mu. */
  dilZorla?: boolean;
  /** Çok konuşmacılı diyalog destekliyor mu. */
  diyalog?: boolean;
  /** Desteklenen dil sayısı (otomatik algılamada geçerli). */
  dilSayisi?: number;
  /** Yaklaşık ilk ses gecikmesi (ms) — hızlı modellerde gösterilir. */
  gecikmeMs?: number;
  /** Duraklama sözdizimi: etiket ([pause]) ya da SSML (<break>). */
  duraklama?: "etiket" | "ssml";
  rozet?: "Yeni";
}

const v = (ad: string, cinsiyet: "Kadın" | "Erkek" | "Nötr", sesId: string, aksan: string, kullanim: SesKullanim, yas: SesModel["yas"], tanim: string, renk: string): SesModel =>
  ({ ad, cinsiyet, sesId, aksan, kullanim, yas, tanim, renk, dil: `${aksan} aksanı` });

/** Ses kütüphanesi — ElevenLabs hazır sesleri (GET /v1/voices ile doğrulandı; voice_id bire bir). */
export const SESLER: SesModel[] = [
  v("Brian", "Erkek", "nPczCjzI2devNBz1zQrb", "Amerikan", "Sosyal medya", "Orta yaş", "Derin, dolgun ve rahatlatıcı", "#a78bfa"),
  v("George", "Erkek", "JBFqnCBsd6RMkjVDRZzb", "İngiliz", "Anlatım", "Orta yaş", "Sıcak, sürükleyici hikâye anlatıcısı", "#fb923c"),
  v("Lily", "Kadın", "pFZP5JQG7iQjIQuC4Bku", "İngiliz", "Eğitim", "Orta yaş", "Kadifemsi, oyuncu sesi", "#f472b6"),
  v("Daniel", "Erkek", "onwK4e9ZLuTAKqWW03F9", "İngiliz", "Eğitim", "Orta yaş", "Sakin, güven veren spiker", "#60a5fa"),
  v("Alice", "Kadın", "Xb7hH8MSUJpSbSDYk0k2", "İngiliz", "Eğitim", "Orta yaş", "Net, ilgi çekici eğitmen", "#2dd4bf"),
  v("Matilda", "Kadın", "XrExE9yKIg1WjnnlVkGX", "Amerikan", "Eğitim", "Orta yaş", "Bilgili, profesyonel", "#fbbf24"),
  v("Bella", "Kadın", "hpp4J3VqNfWAUOO0d1Us", "Amerikan", "Eğitim", "Orta yaş", "Profesyonel, parlak ve sıcak", "#fda4af"),
  v("Sarah", "Kadın", "EXAVITQu4vr4xnSDxMaL", "Amerikan", "TV ve eğlence", "Genç", "Olgun, rahatlatıcı, kendinden emin", "#c084fc"),
  v("Roger", "Erkek", "CwhRBWXzGAHq8TQ4Fs17", "Amerikan", "Sohbet", "Orta yaş", "Rahat, gündelik, tınılı", "#94a3b8"),
  v("Jessica", "Kadın", "cgSgspJ2msm6clMCkdW9", "Amerikan", "Sohbet", "Genç", "Oyuncu, parlak ve sıcak", "#fb7185"),
  v("Eric", "Erkek", "cjVigY5qzO86Huf0OWal", "Amerikan", "Sohbet", "Orta yaş", "Akıcı, güvenilir", "#34d399"),
  v("Chris", "Erkek", "iP95p4xoKVk53GoZ742B", "Amerikan", "Sohbet", "Orta yaş", "Sevimli, samimi", "#facc15"),
  v("Charlie", "Erkek", "IKne3meq5aSn9XLyUdCD", "Avustralya", "Sohbet", "Genç", "Derin, kendinden emin, enerjik", "#a3e635"),
  v("Will", "Erkek", "bIHbv24MWmeRgasZH58o", "Amerikan", "Sohbet", "Genç", "Rahat, iyimser", "#fdba74"),
  v("River", "Nötr", "SAz9YHcvj6GT2YYXdXww", "Amerikan", "Sohbet", "Orta yaş", "Sakin, tarafsız, bilgilendirici", "#67e8f9"),
  v("Liam", "Erkek", "TX3LPaxmHKxFdv7VOQHJ", "Amerikan", "Sosyal medya", "Genç", "Enerjik içerik üreticisi", "#4ade80"),
  v("Laura", "Kadın", "FGY2WhTYpPnrIDTdsKH5", "Amerikan", "Sosyal medya", "Genç", "Hevesli, kendine has tavırlı", "#f9a8d4"),
  v("Adam", "Erkek", "pNInz6obpgDQGcFmaJgB", "Amerikan", "Sosyal medya", "Orta yaş", "Baskın, kararlı", "#818cf8"),
  v("Bill", "Erkek", "pqHfZKP75CvOlQylNhV4", "Amerikan", "Reklam", "Olgun", "Bilge, olgun, dengeli", "#cbd5e1"),
  v("Callum", "Erkek", "N2lVS1w4EtoT3dr4eOWO", "Amerikan", "Karakter", "Orta yaş", "Boğuk, düzenbaz karakter", "#f87171"),
  v("Harry", "Erkek", "SOYHLrjzK2X1ezoPC6cr", "Amerikan", "Karakter", "Genç", "Sert, savaşçı", "#fca5a5"),
];

export const SES_KULLANIMLARI: SesKullanim[] = ["Sohbet", "Anlatım", "Eğitim", "Sosyal medya", "Reklam", "Karakter", "TV ve eğlence"];

/** ElevenLabs use_case → Vayra kullanım alanı (topluluk kütüphanesi için de). */
export const KULLANIM_ESLEME: Record<string, SesKullanim> = {
  conversational: "Sohbet", narrative_story: "Anlatım", informative_educational: "Eğitim", social_media: "Sosyal medya",
  characters_animation: "Karakter", advertisement: "Reklam", entertainment_tv: "TV ve eğlence",
};

/** Ses adı → ascii slug. */
function sesSlug(ad: string): string {
  return ad.toLowerCase()
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/İ/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-");
}
/** Sesin avatar yolu (/gercek/ses/<slug>.webp). Dosyalar henüz yok; çağıranlar baş harfe düşer. */
export function sesGorsel(ad: string): string {
  return `/gercek/ses/${sesSlug(ad)}.webp`;
}

/** Diller — ad + bayrak + ISO 639-1 kodu (sağlayıcıya ve tarayıcı sesine giden). */
export const DILLER = [
  { ad: "İNGİLİZCE", bayrak: "🇺🇸", kod: "en" },
  { ad: "TÜRKÇE", bayrak: "🇹🇷", kod: "tr" },
  { ad: "ÇİNCE", bayrak: "🇨🇳", kod: "zh" },
  { ad: "FRANSIZCA", bayrak: "🇫🇷", kod: "fr" },
  { ad: "HİNTÇE", bayrak: "🇮🇳", kod: "hi" },
  { ad: "İTALYANCA", bayrak: "🇮🇹", kod: "it" },
  { ad: "JAPONCA", bayrak: "🇯🇵", kod: "ja" },
  { ad: "KORECE", bayrak: "🇰🇷", kod: "ko" },
  { ad: "PORTEKİZCE", bayrak: "🇵🇹", kod: "pt" },
  { ad: "RUSÇA", bayrak: "🇷🇺", kod: "ru" },
  { ad: "İSPANYOLCA", bayrak: "🇪🇸", kod: "es" },
  { ad: "ALMANCA", bayrak: "🇩🇪", kod: "de" },
  { ad: "ARAPÇA", bayrak: "🇸🇦", kod: "ar" },
  { ad: "LEHÇE", bayrak: "🇵🇱", kod: "pl" },
  { ad: "ENDONEZCE", bayrak: "🇮🇩", kod: "id" },
  { ad: "FİLİPİNCE", bayrak: "🇵🇭", kod: "fil" },
  { ad: "İSVEÇÇE", bayrak: "🇸🇪", kod: "sv" },
  { ad: "FİNCE", bayrak: "🇫🇮", kod: "fi" },
  { ad: "HOLLANDACA", bayrak: "🇳🇱", kod: "nl" },
  { ad: "UKRAYNACA", bayrak: "🇺🇦", kod: "uk" },
  { ad: "YUNANCA", bayrak: "🇬🇷", kod: "el" },
  { ad: "ÇEKÇE", bayrak: "🇨🇿", kod: "cs" },
];

export const SES_MODLARI: { id: SesMod; ad: string; kisa: string; ozet: string }[] = [
  { id: "seslendirme", ad: "Seslendirme", kisa: "Seslendir", ozet: "Metinden konuşma üret" },
  { id: "diyalog", ad: "Diyalog", kisa: "Diyalog", ozet: "Birden çok sesle doğal bir konuşma üret" },
  { id: "efekt", ad: "Ses Efekti", kisa: "Efekt", ozet: "Tarif ettiğin sesi ya da ortamı üret" },
  { id: "sesdegistir", ad: "Ses Değiştir", kisa: "Değiştir", ozet: "Bir kaydı başka bir sese dönüştür" },
  { id: "ceviri", ad: "Çeviri", kisa: "Çeviri", ozet: "Videonun ya da sesin konuşmasını başka dile çevir" },
  { id: "temizle", ad: "Temizle", kisa: "Temizle", ozet: "Kayıttaki arka plan gürültüsünü ayıklayıp konuşmayı netleştir" },
  { id: "transkript", ad: "Transkript", kisa: "Yazıya dök", ozet: "Konuşmayı konuşmacılarıyla birlikte yazıya dök; altyazı al" },
];

/** Diyalog satırı: konuşan ses + metin. */
export type DiyalogSatiri = { id: string; ses: string; metin: string };
/** Diyalog sınırları (ElevenLabs text-to-dialogue). */
export const DIYALOG_KARAKTER = 2000;
export const DIYALOG_SES = 10;

/** Hazır diyalog senaryoları. */
export const DIYALOG_ORNEKLERI: { baslik: string; satirlar: { ses: string; metin: string }[] }[] = [
  { baslik: "Podcast açılışı", satirlar: [
    { ses: "Jessica", metin: "[excited] Herkese merhaba, yeni bölüme hoş geldiniz!" },
    { ses: "Eric", metin: "Bugün çok konuşulan bir konuyu ele alıyoruz: yapay zekâ ile yaratıcılık." },
    { ses: "Jessica", metin: "[curious] Sence makineler gerçekten yaratıcı olabilir mi?" },
    { ses: "Eric", metin: "[chuckles] Bu sorunun cevabı sandığından daha ilginç." },
  ] },
  { baslik: "Müşteri görüşmesi", satirlar: [
    { ses: "Sarah", metin: "Merhaba, size nasıl yardımcı olabilirim?" },
    { ses: "Roger", metin: "[sighs] Siparişim üç gündür kargoda bekliyor." },
    { ses: "Sarah", metin: "Hemen kontrol ediyorum. [softly] Endişelenmeyin, bugün çözeceğiz." },
  ] },
  { baslik: "Gerilim sahnesi", satirlar: [
    { ses: "Callum", metin: "[whispers] Sesini duydun mu? Koridordan geliyor." },
    { ses: "Lily", metin: "[nervous] Belki rüzgârdır… değil mi?" },
    { ses: "Callum", metin: "[gasps] Hayır. Rüzgâr kapıyı açamaz." },
  ] },
];

/** Ses efekti örnek tarifleri (İngilizce tarif daha iyi sonuç verir; Türkçe de çalışır). */
export const EFEKT_ORNEKLERI: { ad: string; tarif: string; aciklama: string; sn?: number; dongu?: boolean }[] = [
  { ad: "Yağmur ve gök gürültüsü", tarif: "Heavy rain on a window with distant rolling thunder", aciklama: "Cama vuran yağmur, uzakta gök gürültüsü", sn: 15, dongu: true },
  { ad: "Şömine çıtırtısı", tarif: "Crackling fireplace in a cozy quiet room, soft wood pops", aciklama: "Sessiz odada yanan odun", sn: 20, dongu: true },
  { ad: "Sinematik vuruş", tarif: "Deep cinematic boom impact with long reverb tail", aciklama: "Derin patlama, uzun yankı", sn: 4 },
  { ad: "Fırtınalı deniz", tarif: "Stormy sea waves crashing against rocks with strong wind", aciklama: "Kayalara çarpan dalgalar, sert rüzgâr", sn: 15, dongu: true },
  { ad: "Uzay gemisi", tarif: "Sci-fi spaceship engine powering up and taking off", aciklama: "Motor ısınır, gemi kalkar", sn: 8 },
  { ad: "Orman sabahı", tarif: "Forest morning, birds singing, gentle wind through leaves", aciklama: "Kuş sesleri, yapraklarda rüzgâr", sn: 20, dongu: true },
  { ad: "Arayüz sesi", tarif: "Soft futuristic UI confirmation chime", aciklama: "Yumuşak onay çınlaması", sn: 1 },
  { ad: "Şehir trafiği", tarif: "Busy city street traffic, distant car horns and footsteps", aciklama: "Kalabalık cadde, korna, adımlar", sn: 20, dongu: true },
];

/** Ses üretim modelleri (ElevenLabs model belgesiyle doğrulandı). Sağlayıcısı olmayanlar "Yakında" — seçilemez. */
export const SES_URETIM_MODELLERI: SesUretimModeli[] = [
  { ad: "Eleven v4", ozet: "En duygulu model; serbest ses etiketleri, 90+ dil", karakterSiniri: 10000, saglayici: "eleven", etiketler: true, dilZorla: true, diyalog: true, duraklama: "etiket", rozet: "Yeni", dilSayisi: 90 },
  { ad: "Eleven v4 Turbo", ozet: "v4 kalitesi, gerçek zamanlıya yakın hız", karakterSiniri: 10000, saglayici: "eleven", etiketler: true, dilZorla: true, diyalog: true, duraklama: "etiket", rozet: "Yeni", dilSayisi: 90, gecikmeMs: 100 },
  { ad: "Eleven v3", ozet: "Dramatik anlatım; ses etiketleri, 70+ dil", karakterSiniri: 5000, saglayici: "eleven", etiketler: true, dilZorla: true, diyalog: true, duraklama: "etiket", dilSayisi: 70 },
  { ad: "Eleven v3 Conversational", ozet: "Sohbet ve ajanlar için doğal, akıcı v3", karakterSiniri: 5000, saglayici: "eleven", etiketler: true, dilZorla: true, duraklama: "etiket", dilSayisi: 70 },
  { ad: "Eleven Multilingual v2", ozet: "29 dilde en tutarlı uzun anlatım", karakterSiniri: 10000, saglayici: "eleven", ayrintiliAyar: true, duraklama: "ssml", dilSayisi: 29 },
  { ad: "Eleven Flash v2.5", ozet: "En hızlı, uzun metinler, 32 dil; yarı kredi", karakterSiniri: 40000, saglayici: "eleven", ayrintiliAyar: true, dilZorla: true, duraklama: "ssml", dilSayisi: 32, gecikmeMs: 75 },
  { ad: "Seed Audio 1.0", ozet: "Konuşma + ortam sesli çok-konuşmacılı sahneler", karakterSiniri: 5000 },
  { ad: "MiniMax Speech 2.8 HD", ozet: "Yüksek sadakatli tek-ses anlatım", karakterSiniri: 5000 },
  { ad: "VibeVoice", ozet: "Sesli kitap ve podcast için uzun-form anlatım", karakterSiniri: 10000 },
  { ad: "Seed Speech", ozet: "30+ dilde çok dilli konuşma", karakterSiniri: 5000 },
];
// Geriye dönük uyumluluk (eski sadece ad listesi).
export const SES_MODELLERI = SES_URETIM_MODELLERI.map((m) => m.ad);

/** v3/v4 ses etiketleri — kategorili. Metne eklenir, model o bölümü o tonda okur. */
export const SES_ETIKET_GRUPLARI: { grup: string; etiketler: { etiket: string; ad: string }[] }[] = [
  { grup: "Duygu", etiketler: [
    { etiket: "[excited]", ad: "Heyecanlı" }, { etiket: "[happy]", ad: "Mutlu" }, { etiket: "[sad]", ad: "Hüzünlü" }, { etiket: "[angry]", ad: "Öfkeli" },
    { etiket: "[nervous]", ad: "Gergin" }, { etiket: "[curious]", ad: "Meraklı" }, { etiket: "[sarcastic]", ad: "Alaycı" }, { etiket: "[calm]", ad: "Sakin" },
  ] },
  { grup: "Anlatım", etiketler: [
    { etiket: "[whispers]", ad: "Fısıltı" }, { etiket: "[shouts]", ad: "Bağırarak" }, { etiket: "[softly]", ad: "Yumuşakça" }, { etiket: "[dramatic]", ad: "Dramatik" },
    { etiket: "[rushed]", ad: "Aceleyle" }, { etiket: "[slowly]", ad: "Yavaşça" },
  ] },
  { grup: "Tepki", etiketler: [
    { etiket: "[laughs]", ad: "Gülme" }, { etiket: "[chuckles]", ad: "Kıkırdama" }, { etiket: "[sighs]", ad: "İç çekme" }, { etiket: "[gasps]", ad: "Şaşkınlık nefesi" },
    { etiket: "[clears throat]", ad: "Boğaz temizleme" }, { etiket: "[crying]", ad: "Ağlama" },
  ] },
  { grup: "Sunum", etiketler: [
    { etiket: "[thoughtful]", ad: "Düşünceli" }, { etiket: "[surprised]", ad: "Şaşkın" }, { etiket: "[mischievously]", ad: "Muzip" }, { etiket: "[professional]", ad: "Profesyonel" },
    { etiket: "[singing]", ad: "Şarkı söyleyerek" }, { etiket: "[strong Turkish accent]", ad: "Türk aksanı" },
  ] },
  { grup: "Diyalog", etiketler: [
    { etiket: "[interrupting]", ad: "Sözü keserek" }, { etiket: "[overlapping]", ad: "Üst üste" }, { etiket: "[jumping in]", ad: "Araya girerek" },
  ] },
  { grup: "Ses efekti", etiketler: [
    { etiket: "[applause]", ad: "Alkış" }, { etiket: "[door slams]", ad: "Kapı çarpması" }, { etiket: "[footsteps]", ad: "Ayak sesi" }, { etiket: "[explosion]", ad: "Patlama" },
    { etiket: "[gunshot]", ad: "Silah sesi" },
  ] },
];
/** Hızlı erişim çipleri. */
export const SES_ETIKETLERI = SES_ETIKET_GRUPLARI.flatMap((g) => g.etiketler).filter((e) => ["[excited]", "[whispers]", "[laughs]", "[sighs]", "[sad]", "[curious]"].includes(e.etiket));

/** Çıktı biçimleri (ElevenLabs output_format). Ücretli kademe gerektirenler işaretli. */
export const CIKTI_BICIMLERI: { id: string; ad: string; uzanti: string; not?: string }[] = [
  { id: "mp3_44100_128", ad: "MP3 · 128 kbps", uzanti: "mp3" },
  { id: "mp3_44100_192", ad: "MP3 · 192 kbps", uzanti: "mp3", not: "Yüksek kalite" },
  { id: "wav_44100", ad: "WAV · 44,1 kHz", uzanti: "wav", not: "Kayıpsız" },
  { id: "opus_48000_128", ad: "Opus · 128 kbps", uzanti: "opus", not: "Web için küçük" },
];

/** Ses değiştirme ve çeviri için kaynak dosya sınırı (MB). */
export const KAYNAK_MB = 20;

/** Ton etiketi grup renkleri — editörde ve ayrıntıda etiketler grubunun rengiyle görünür
 *  (duygu gül, anlatım/duraklama kehribar, tepki menekşe, efekt turkuaz). */
export const ETIKET_GRUP_RENK: Record<string, string> = { "Duygu": "#fda4af", "Anlatım": "#fcd34d", "Tepki": "#c4b5fd", "Sunum": "#93c5fd", "Diyalog": "#86efac", "Ses efekti": "#5eead4" };
const ETIKET_RENK_HARITA = new Map(SES_ETIKET_GRUPLARI.flatMap((g) => g.etiketler.map((e) => [e.etiket, ETIKET_GRUP_RENK[g.grup]] as const)));
/** Satır içi etiketin rengi; duraklamalar anlatım grubunda, bilinmeyen etiketler menekşe. */
export function etiketRengi(t: string): string {
  const k = t.trim().toLowerCase();
  if (k.startsWith("<break") || /pause\]$/.test(k)) return ETIKET_GRUP_RENK["Anlatım"];
  return ETIKET_RENK_HARITA.get(k) ?? ETIKET_GRUP_RENK["Tepki"];
}

/** Aksan → bayrak (kütüphane satırı ve ses seçicide). */
export function aksanBayrak(aksan?: string): string {
  if (!aksan) return "🌐";
  aksan = aksan.toLocaleLowerCase("tr");
  if (/amerikan/i.test(aksan)) return "🇺🇸";
  if (/ingiliz/i.test(aksan)) return "🇬🇧";
  if (/avustral/i.test(aksan)) return "🇦🇺";
  if (/türk/i.test(aksan)) return "🇹🇷";
  return "🌐";
}

/** Dil seçicide sıra: Türkçe başta, ardından diğerleri. */
export const DILLER_SIRALI = [...DILLER.filter((d) => d.kod === "tr"), ...DILLER.filter((d) => d.kod !== "tr")];
