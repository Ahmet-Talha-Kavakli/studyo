import type { Zamanlama } from "./sistemKatalog";

/**
 * Zamanlanmış sohbet görevleri: istemci ve sunucunun ortak tanımları (hazır görevler, kalıplar, sınır).
 * Görev = Sistemler altyapısında zaman tetikli, tek "ajan" adımlı bir sistem; sonuçları görevin sohbetine düşer.
 */
export const GOREV_SINIRI = 10;
export type GorevKalibi = "bir-kez" | "gunluk" | "hafta-ici" | "haftalik" | "aylik" | "ozel";
export const KALIPLAR: { id: GorevKalibi; ad: string }[] = [
  { id: "bir-kez", ad: "Bir kez" }, { id: "gunluk", ad: "Her gün" }, { id: "hafta-ici", ad: "Hafta içi" },
  { id: "haftalik", ad: "Haftalık" }, { id: "aylik", ad: "Aylık" }, { id: "ozel", ad: "Özel" },
];
export type GorevFormu = { kalip: GorevKalibi; saat: string; gunler: number[]; ayGunu: number; tarih: string; cron: string };

/** Formdan zamanlama (Türkiye saati). Bir kez: o gün o saatte, başlangıç ve bitiş aynı gün. */
export function zamanlamaYap(f: GorevFormu): Zamanlama {
  const saat = /^\d{2}:\d{2}$/.test(f.saat) ? f.saat : "09:00";
  switch (f.kalip) {
    case "bir-kez": return { siklik: "gunluk", saat, baslangic: f.tarih, bitis: f.tarih, tolerans: 60 };
    case "gunluk": return { siklik: "gunluk", saat, tolerans: 60 };
    case "hafta-ici": return { siklik: "haftalik", saat, gunler: [1, 2, 3, 4, 5], tolerans: 60 };
    case "haftalik": return { siklik: "haftalik", saat, gunler: f.gunler.length ? f.gunler : [1], tolerans: 60 };
    case "aylik": return { siklik: "aylik", saat, ayGunu: Math.min(32, Math.max(1, f.ayGunu || 1)), tolerans: 60 };
    case "ozel": return { siklik: "ozel", cron: f.cron.trim() || "0 9 * * 1", tolerans: 60 };
  }
}
/** Zamanlamadan form (düzenlemek için). */
export function formYap(z: Zamanlama): GorevFormu {
  const bos: GorevFormu = { kalip: "gunluk", saat: z.saat ?? "09:00", gunler: z.gunler ?? [1], ayGunu: z.ayGunu ?? 1, tarih: z.baslangic ?? "", cron: z.cron ?? "" };
  if (z.siklik === "gunluk" && z.baslangic && z.baslangic === z.bitis) return { ...bos, kalip: "bir-kez" };
  if (z.siklik === "haftalik") return { ...bos, kalip: (z.gunler ?? []).join(",") === "1,2,3,4,5" ? "hafta-ici" : "haftalik" };
  if (z.siklik === "aylik") return { ...bos, kalip: "aylik" };
  if (z.siklik === "ozel") return { ...bos, kalip: "ozel" };
  return bos;
}

export type GorevSablonu = { id: string; ad: string; alt: string; istem: string; form: Pick<GorevFormu, "kalip" | "saat"> & Partial<GorevFormu>; kapak: string };
/** Hazır görevler (ChatGPT ve Gemini'deki örnek görevler gibi; içerik Türkiye'ye göre). */
export const GOREV_SABLONLARI: GorevSablonu[] = [
  { id: "sabah-ozeti", ad: "Sabah haber özeti", alt: "Hafta içi 08.00, kaynaklarıyla", istem: "Bugünün Türkiye ve dünya gündemindeki en önemli 5 haberi kaynak bağlantılarıyla, her biri iki cümle olacak şekilde özetle. Sonuna günün tek cümlelik özetini ekle.", form: { kalip: "hafta-ici", saat: "08:00" }, kapak: "/gercek/kesfet/blog-api.webp" },
  { id: "doviz", ad: "Piyasa kapanışı", alt: "Hafta içi 18.30", istem: "Bugün dolar, euro, gram altın ve BIST 100'ün kapanış değerlerini ve günlük değişimlerini bir tabloda ver; öne çıkan iki gelişmeyi kısaca açıkla.", form: { kalip: "hafta-ici", saat: "18:30" }, kapak: "/gercek/sc/bc-dashboard.webp" },
  { id: "haftalik-plan", ad: "Haftalık plan", alt: "Pazartesi 08.30", istem: "Yeni haftaya başlıyorum. Bana haftalık bir plan şablonu çıkar: 3 ana hedef, her gün için odak işi, haftanın ortasında bir ara kontrol ve cuma için kısa bir değerlendirme sorusu.", form: { kalip: "haftalik", saat: "08:30", gunler: [1] }, kapak: "/gercek/sc/bc-meeting.webp" },
  { id: "cuma-degerlendirme", ad: "Cuma değerlendirmesi", alt: "Cuma 17.00", istem: "Haftayı değerlendirmem için bana 5 kısa soru sor ve haftaya iyi bir kapanış yapmam için üç öneri ver.", form: { kalip: "haftalik", saat: "17:00", gunler: [5] }, kapak: "/gercek/sc/bc-report.webp" },
  { id: "ingilizce", ad: "Günün İngilizce kelimeleri", alt: "Her gün 07.30", istem: "Bana orta-ileri düzeyde 5 İngilizce kelime öğret: anlamı, telaffuz ipucu, birer örnek cümle ve Türkçe karşılığı. Sonunda bu kelimelerle küçük bir boşluk doldurma testi yap.", form: { kalip: "gunluk", saat: "07:30" }, kapak: "/gercek/sc/bc-translate.webp" },
  { id: "yemek", ad: "Haftalık yemek planı", alt: "Pazar 10.00", istem: "4 kişilik bir aile için bu haftanın akşam yemeği planını çıkar: 7 gün, mevsim sebzeleri, bütçe dostu; sonuna tek bir alışveriş listesi ekle.", form: { kalip: "haftalik", saat: "10:00", gunler: [7] }, kapak: "/gercek/kesfet/altin-saat.webp" },
  { id: "sektor", ad: "Sektör taraması", alt: "Pazartesi 09.00", istem: "Yapay zekâ ve yazılım sektöründe geçen haftanın en önemli 5 gelişmesini kaynaklarıyla özetle; her biri için Türkiye'deki bir şirkete etkisini tek cümleyle yorumla.", form: { kalip: "haftalik", saat: "09:00", gunler: [1] }, kapak: "/gercek/sc/bc-trend.webp" },
  { id: "spor", ad: "Günlük egzersiz", alt: "Hafta içi 07.00", istem: "Bana ekipmansız, 20 dakikalık bir egzersiz programı hazırla: ısınma, 4 hareketlik ana bölüm (set ve tekrar sayılarıyla), esneme. Her gün farklı bir kas grubuna odaklan.", form: { kalip: "hafta-ici", saat: "07:00" }, kapak: "/gercek/kesfet/agir-cekim.webp" },
  { id: "butce", ad: "Ay sonu bütçe kontrolü", alt: "Her ayın son günü 20.00", istem: "Ay sonu bütçe kontrolü yapmam için bana kısa bir kontrol listesi ver: gelir, sabit giderler, değişken giderler, birikim oranı; bir sonraki ay için iki tasarruf önerisi ekle.", form: { kalip: "aylik", saat: "20:00", ayGunu: 32 }, kapak: "/gercek/sc/bc-data.webp" },
  { id: "kitap", ad: "Haftanın kitap önerisi", alt: "Cumartesi 11.00", istem: "Bana bu hafta okuyabileceğim bir kitap öner (Türkçe baskısı olan): neden okumalıyım, üç ana fikir ve kime uygun. Her hafta farklı bir türden seç.", form: { kalip: "haftalik", saat: "11:00", gunler: [6] }, kapak: "/gercek/sc/bc-pdf.webp" },
  { id: "tarih", ad: "Tarihte bugün", alt: "Her gün 12.00", istem: "Tarihte bugün yaşanmış ilginç üç olayı anlat; biri Türkiye'den olsun. Her biri üç cümle.", form: { kalip: "gunluk", saat: "12:00" }, kapak: "/gercek/kesfet/antik-tapinakstudio-mira.webp" },
  { id: "icerik", ad: "Sosyal medya fikirleri", alt: "Pazartesi 10.00", istem: "Küçük bir kahve dükkânı için bu haftanın 5 Instagram gönderi fikrini çıkar: kanca cümlesi, kısa metin ve görsel tarifi.", form: { kalip: "haftalik", saat: "10:00", gunler: [1] }, kapak: "/gercek/sc/bc-social.webp" },
];

/** "09:00" → "09.00" (Türkçe saat yazımı). */
export const saatTr = (s: string) => s.replace(":", ".");
