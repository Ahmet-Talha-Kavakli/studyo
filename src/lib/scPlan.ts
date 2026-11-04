/**
 * Çok adımlı iş planı (Higgsfield Usta plan kartı, Replit "Task plan"): istek teslim edilecek parçalara bölünür,
 * her adımın kredi tahmini gösterilir; kullanıcı düzenleyip onaylamadan hiçbir şey çalışmaz.
 * Planlayıcı kural tabanlıdır (istemcide); yalnız Usta'nın gerçekten yapabildiği adımlar çalıştırılabilir.
 */
export type PlanAdimTur = "metin" | "gorsel" | "site" | "video";
export type PlanAdim = {
  id: string; tur: PlanAdimTur; baslik: string; istem: string;
  adet?: number; oran?: string;
  /** Birim kredi (görsel başına); metin ve site Usta kullanımına dahil. */
  kredi: number;
  secili: boolean;
  durum: "bekliyor" | "calisiyor" | "bitti" | "hata" | "atlandi";
  sonuc?: string; hata?: string; ciktiIds?: string[]; demo?: boolean;
  /** Bu adım burada çalıştırılamıyor (ör. video → Video stüdyosu). */
  disari?: { ad: string; href: string };
};
export type ScPlan = { baslik: string; adimlar: PlanAdim[]; durum: "taslak" | "calisiyor" | "duraklatildi" | "bitti" | "iptal"; harcanan: number; bekleyenKredi?: boolean };

export const PLAN_GORSEL_KREDI = 4;
const SAYI: Record<string, number> = { bir: 1, iki: 2, üç: 3, dört: 4, beş: 5, altı: 6, yedi: 7, sekiz: 8, on: 10 };

function adetBul(k: string, kelime: string, varsayilan: number) {
  const m = k.match(new RegExp(`(\\d+|bir|iki|üç|dört|beş|altı|yedi|sekiz|on)\\s*(?:adet\\s*|tane\\s*|farklı\\s*|kısa\\s*|yeni\\s*)?(?:[\\p{L}-]+\\s+){0,2}${kelime}`, "u"));
  if (!m) return varsayilan;
  const n = /\d/.test(m[1]) ? Number(m[1]) : SAYI[m[1]] ?? varsayilan;
  return Math.max(1, Math.min(8, n));
}

const TESLIM: [PlanAdimTur | "gonderi" | "eposta" | "slogan", RegExp][] = [
  ["gorsel", /(görsel|fotoğraf|afiş|poster|banner|kapak görseli|ürün çekimi)/],
  ["site", /(web ?sitesi|site|açılış sayfası|landing|sayfası)/],
  ["gonderi", /(gönderi|post|tweet|paylaşım|caption|instagram|linkedin)/],
  ["eposta", /(e-?posta|mail|bülten)/],
  ["slogan", /(slogan|reklam metni|metin yaz|metni)/],
  ["video", /(video|reels|tiktok|kısa film)/],
];

/** İstekte iki ya da daha çok farklı teslim türü varsa çok adımlı plan önerilir. */
export function planMi(t: string) {
  const k = t.toLocaleLowerCase("tr");
  return TESLIM.filter(([, re]) => re.test(k)).length >= 2;
}

let sayac = 0;
const yeniId = () => `pa-${Date.now().toString(36)}-${++sayac}`;

/** Marka/konu adı: tırnak içi ya da genel kelime olmayan ilk büyük harfli sözcük. */
const GENEL = new Set(["Bir", "Yeni", "Benim", "Bizim", "Bu", "Şu", "Lütfen", "Hazırla", "Yap", "Lansman", "Kampanya", "Instagram", "LinkedIn", "Türkiye", "İstanbul"]);
export function markaBul(t: string): string | undefined {
  const q = t.match(/["“]([^"”]{2,30})["”]/)?.[1]?.trim();
  if (q) return q;
  for (const w of t.match(/(?<![\p{L}])[A-ZÇĞİÖŞÜ][\p{L}0-9&-]{1,24}/gu) ?? []) if (!GENEL.has(w)) return w;
  return undefined;
}

export function planCikar(t: string, marka = markaBul(t)): ScPlan {
  const k = t.toLocaleLowerCase("tr");
  const konu = marka ? `"${marka}"` : "bu iş";
  const a: PlanAdim[] = [];
  const ekle = (p: Omit<PlanAdim, "id" | "secili" | "durum"> & { secili?: boolean }) => a.push({ id: yeniId(), secili: true, durum: "bekliyor", ...p });
  ekle({ tur: "metin", baslik: "Strateji ve ana mesaj", istem: `${t}\n\nBu iş için önce kısa bir strateji yaz: hedef kitle, ana mesaj, ton ve 3 anahtar fikir. Sonraki adımlar bunu temel alacak.`, kredi: 0 });
  if (TESLIM[0][1].test(k)) { const n = adetBul(k, "(?:görsel|fotoğraf|afiş|poster|banner)", 3); ekle({ tur: "gorsel", baslik: `${n} görsel`, istem: `${konu} için ${t}`, adet: n, oran: /dikey|story|hikaye|reels/.test(k) ? "9:16" : /yatay|banner|kapak/.test(k) ? "16:9" : "1:1", kredi: PLAN_GORSEL_KREDI }); }
  if (TESLIM[1][1].test(k)) ekle({ tur: "site", baslik: "Açılış sayfası", istem: `${konu} için açılış sayfası yap. Bağlam: ${t}`, kredi: 0 });
  if (TESLIM[2][1].test(k)) { const n = adetBul(k, "(?:gönderi|post|paylaşım)", 5); ekle({ tur: "metin", baslik: `${n} sosyal medya gönderisi`, istem: `${t}\n\nStratejiye uygun ${n} sosyal medya gönderisi yaz; her biri için başlık, metin ve etiketler.`, adet: n, kredi: 0 }); }
  if (TESLIM[3][1].test(k)) { const n = adetBul(k, "(?:e-?posta|mail)", 1); ekle({ tur: "metin", baslik: n > 1 ? `${n} e-posta` : "E-posta", istem: `${t}\n\nStratejiye uygun ${n > 1 ? `${n} e-posta` : "bir e-posta"} yaz: konu satırı, gövde, çağrı.`, adet: n, kredi: 0 }); }
  if (TESLIM[4][1].test(k)) ekle({ tur: "metin", baslik: "Slogan ve reklam metinleri", istem: `${t}\n\n5 slogan ve 3 kısa reklam metni yaz.`, kredi: 0 });
  if (TESLIM[5][1].test(k)) ekle({ tur: "video", baslik: "Tanıtım videosu", istem: t, kredi: 0, secili: false, disari: { ad: "Video stüdyosunda yap", href: "/panel/video" } });
  return { baslik: marka ? `${marka} planı` : "İş planı", adimlar: a, durum: "taslak", harcanan: 0 };
}

export const adimKredi = (p: PlanAdim) => (p.secili && !p.disari ? p.kredi * (p.tur === "gorsel" ? p.adet ?? 1 : 1) : 0);
export const planToplam = (p: ScPlan) => p.adimlar.reduce((t, a) => t + adimKredi(a), 0);
