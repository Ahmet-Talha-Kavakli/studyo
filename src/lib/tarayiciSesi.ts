"use client";

/**
 * Tarayıcı sesi — ses sağlayıcısı bağlı değilken (demo) metni tarayıcının kendi konuşma
 * motoruyla GERÇEKTEN seslendirir. Seçilen dil, cinsiyet ve hız uygulanır; uygun ses yoksa
 * eldeki en yakın ses kullanılır ve bu durum `uyari` ile bildirilir.
 * Dosyaya yazılamaz (tarayıcı izin vermez), bu yüzden demo çıktılar indirilemez.
 */

const KADIN = /female|kadın|woman|zira|aria|jenny|emel|seda|filiz|yelda|samantha|victoria|karen|moira|tessa|fiona|serena|susan|hazel|libby|sonia|natasha|michelle|ava|emma|clara|elvira|denise|hortense|katja|amala|elsa|isabella|nanami|sunhi|xiaoxiao|google .*female/i;
const ERKEK = /male|erkek|\bman\b|david|mark|guy|tolga|ahmet|daniel|alex|fred|george|ryan|thomas|christopher|eric|brian|roger|steffan|conrad|henri|diego|keita|injoon|yunxi|google .*male/i;

export function tarayiciSesiVar(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

/** Sesler bazı tarayıcılarda gecikmeli yüklenir; hazır olunca döner. */
export function sesleriAl(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((ok) => {
    if (!tarayiciSesiVar()) return ok([]);
    const ilk = speechSynthesis.getVoices();
    if (ilk.length) return ok(ilk);
    const bitir = () => { speechSynthesis.removeEventListener("voiceschanged", bitir); ok(speechSynthesis.getVoices()); };
    speechSynthesis.addEventListener("voiceschanged", bitir);
    setTimeout(bitir, 1500);
  });
}

function cinsiyetiTahmin(v: SpeechSynthesisVoice): "Kadın" | "Erkek" | null {
  // "female" "male" içerdiği için önce kadın kalıbı denenir.
  if (KADIN.test(v.name)) return "Kadın";
  if (ERKEK.test(v.name)) return "Erkek";
  return null;
}

export type SesSecimi = { ses: SpeechSynthesisVoice | null; uyari?: string };

/** Dil (ISO 639-1) ve cinsiyete en uygun tarayıcı sesini seçer. */
export function sesSec(sesler: SpeechSynthesisVoice[], dil: string | undefined, cinsiyet: "Kadın" | "Erkek" | "Nötr"): SesSecimi {
  if (!sesler.length) return { ses: null, uyari: "Tarayıcın konuşma sesi sunmuyor." };
  const dilde = dil ? sesler.filter((v) => v.lang.toLowerCase().split(/[-_]/)[0] === dil) : sesler;
  const havuz = dilde.length ? dilde : sesler;
  // Nötr seste cinsiyet tercihi yok: dildeki varsayılan ses yeterli.
  const uygun = cinsiyet === "Nötr" ? havuz.find((v) => v.default) ?? havuz[0] : havuz.find((v) => cinsiyetiTahmin(v) === cinsiyet);
  const ses = uygun ?? havuz.find((v) => v.default) ?? havuz[0];
  const uyarilar: string[] = [];
  if (dil && !dilde.length) uyarilar.push("bu dilde tarayıcı sesi yok");
  if (!uygun) uyarilar.push(`${cinsiyet === "Kadın" ? "kadın" : "erkek"} sesi yok`);
  return { ses, uyari: uyarilar.length ? `Tarayıcıda ${uyarilar.join(", ")}; ${ses.name} kullanıldı.` : undefined };
}

/** Basit dil tahmini — dil seçilmemişse Türkçe karakterlerden ya da yaygın sözcüklerden. */
export function dilTahmin(metin: string): string {
  if (/[çğıöşüÇĞİÖŞÜ]/.test(metin) || /\b(ve|bir|bu|için|ile|çok|ama)\b/i.test(metin)) return "tr";
  return "en";
}
