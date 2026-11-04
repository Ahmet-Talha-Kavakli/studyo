"use client";

/**
 * Konudan short: senaryo + sahne görselleri.
 *  - Gemini bağlıysa AI senaryo (sahne türü, ekran yazısı, anlatım, görsel tarifi).
 *  - Bağlı değilse short'a özgü, konuya göre kurulan düzenlenebilir taslak (kanca → neden → maddeler → kapanış).
 *  - Anlamsız konu ("asdsadsa") reddedilir.
 *  - Sahne görseli: AI ile üretilir ya da kullanıcı yükler; sonuç o sahneye yazılır.
 */

import { toast } from "@/lib/toast";
import { saltUrl } from "@/lib/utils";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { useProjeler } from "@/store/useProjeler";
import { exId, type ExSahne, type SahneTur } from "@/store/useExplainer";
import { stilBul } from "@/lib/explainerMotor";
import { yazarHazir, KREDI, GORSEL_MODEL } from "@/components/explainer/exUretim";

/** Konu anlamlı mı: rakam yığını, harf çeşitliliği, sesli harf oranı ve Türkçede olmayan ünsüz başlangıçları (klavye ezmesi "asdsadsa", "denem123 dneme 123213" yakalanır). */
const IZINLI_BAS = /^(bl|br|dr|fl|fr|gl|gr|kl|kr|pl|pr|sk|sl|sp|st|tr|ps|sc|sh|ch|th|tw|wh)/;
export function konuAnlamli(konu: string): boolean {
  const ham = konu.trim();
  const rakam = (ham.match(/\d/g) ?? []).length, dolu = ham.replace(/\s/g, "").length;
  if (dolu && rakam / dolu > 0.2 && !/^\d+\s+\p{L}/u.test(ham)) return false; // "123213" gibi rakam yığını
  const t = ham.toLocaleLowerCase("tr").replace(/[^a-zçğıöşüâîû\s]/g, " ").replace(/\s+/g, " ").trim();
  if (t.length < 4) return false;
  const kelimeler = t.split(" ").filter((w) => w.length >= 2);
  if (!kelimeler.length) return false;
  const harf = t.replace(/\s/g, "");
  // Harf çeşitliliği: uzun metinde doğal olarak düşer, bu yüzden en çok 25 harfe göre ölçülür ("asddddd" elenir, uzun cümle geçer)
  if (harf.length >= 8 && new Set(harf).size / Math.min(harf.length, 25) < 0.4) return false;
  const sesli = (harf.match(/[aeıioöuüâîû]/g) ?? []).length / harf.length;
  if (sesli < 0.25 || sesli > 0.7) return false;
  // Ünsüzle başlayan iki ünsüz ("dneme"), üç ünsüz yan yana ("sdfg") ya da sesli harfsiz kelime
  const supheli = kelimeler.filter((w) => (/^[^aeıioöuüâîû]{2}/.test(w) && !IZINLI_BAS.test(w)) || /[^aeıioöuüâîû]{4}/.test(w) || !/[aeıioöuüâîû]/.test(w));
  if (supheli.length && supheli.length >= kelimeler.length / 2) return false;
  if (/^(asd|qwe|zxc|jkl|sdf|dfg|fgh|deneme|test)/.test(t) && kelimeler.length <= 3) return false;
  return true;
}

const ilkHarfBuyuk = (s: string) => (s ? s.charAt(0).toLocaleUpperCase("tr") + s.slice(1) : s);
const sahne = (s: Omit<ExSahne, "id">): ExSahne => ({ ...s, id: exId("sh") });

/** Gemini yoksa: short akışına göre konudan kurulan taslak. Konudaki sayı (ör. "3 faydası") madde sayısını belirler. */
export function shortTaslak(konu: string, adet: number): ExSahne[] {
  const k = konu.trim().replace(/[.?!]+$/, "");
  const soru = /\?$/.test(konu.trim()) || /^(neden|nasıl|ne|hangi|kim|niçin)\b/i.test(k);
  const sayi = Math.min(4, Math.max(2, Number(k.match(/\b([2-5])\b/)?.[1] ?? 3)));
  const kisa = k.length > 42 ? `${k.slice(0, 42).replace(/\s+\S*$/, "")}…` : k;
  // "Kahvenin bilinmeyen 3 faydası" → "fayda"; konuda sayı yoksa "nokta"
  const son = (k.match(/\b[2-5]\s+(\p{L}+)/u)?.[1] ?? "").toLocaleLowerCase("tr");
  const nesne = son.replace(/(ları|leri|sı|si|su|sü|ı|i|u|ü)$/, "") || "nokta";
  const listeli = !!son;
  const l: ExSahne[] = [
    sahne({ tur: "baslik", baslik: ilkHarfBuyuk(kisa), anlatim: soru ? "Cevap sandığından basit. Hemen anlatayım." : "Çoğu kişi bunu bilmiyor. Hemen anlatayım.", gorselIstem: `${k}: dikkat çeken açılış karesi, tek ve net bir konu` }),
    sahne({ tur: "anlatim", baslik: "Neden önemli?", anlatim: `Çünkü ${k.toLocaleLowerCase("tr")} günlük hayatı doğrudan etkiliyor; küçük bir fark büyük sonuç doğuruyor.`, gorselIstem: `${k}: gündelik hayatta bunun önemini gösteren bir an` }),
    sahne({ tur: "liste", baslik: ilkHarfBuyuk(`${sayi} ${nesne}`), anlatim: listeli ? `İşte ${sayi} ${nesne}.` : `Bilmen gereken ${sayi} nokta.`, maddeler: Array.from({ length: sayi }, () => ""), gorselIstem: `${k}: maddeleri özetleyen sade bir kompozisyon` }),
    sahne({ tur: "cta", baslik: listeli ? "Sence hangisi?" : "Sen ne düşünüyorsun?", anlatim: "Yorumlara yaz, daha fazlası için takipte kal.", etiket: "Takip et", gorselIstem: `${k}: sıcak bir kapanış karesi` }),
  ];
  // Süreye göre: 3 sahnede "Neden" çıkar, 5 sahnede rakam sahnesi eklenir
  if (adet <= 3) l.splice(1, 1);
  if (adet >= 5) l.splice(l.length - 1, 0, sahne({ tur: "istatistik", baslik: "Bir rakamla", anlatim: "Rakamı kendi kaynağınla güncelle.", deger: "", etiket: "", gorselIstem: `${k}: rakamı anlatan grafik hissi` }));
  return l;
}

type AiSahne = { tur: string; baslik: string; anlatim: string; maddeler?: string[]; deger?: string; etiket?: string; gorsel?: string };
const TURLER: SahneTur[] = ["baslik", "anlatim", "liste", "istatistik", "cta"];

/** Senaryo: önce AI, olmazsa taslak. Dönen kaynak arayüzde dürüstçe gösterilir. */
export async function shortSenaryo(konu: string, hedefSn: number, stil: string): Promise<{ sahneler: ExSahne[]; kaynak: "ai" | "taslak" }> {
  const adet = hedefSn <= 15 ? 3 : hedefSn <= 30 ? 4 : 5;
  if (await yazarHazir()) {
    try {
      const r = await fetch("/api/explainer/senaryo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "yaz", konu, ton: "samimi", kitle: "genel", dil: "tr", hedefSn, stil: stilBul(stil).aciklama }) });
      const j = (await r.json()) as { ok: boolean; sahneler?: AiSahne[] };
      if (j.ok && j.sahneler?.length) {
        const l = j.sahneler.filter((x) => x.tur !== "alinti").slice(0, adet).map((x, i, a) => sahne({
          tur: i === a.length - 1 ? "cta" : TURLER.includes(x.tur as SahneTur) ? (x.tur as SahneTur) : "anlatim",
          baslik: (x.baslik ?? "").trim(), anlatim: (x.anlatim ?? "").trim(), maddeler: x.maddeler?.slice(0, 4), deger: x.deger, etiket: x.etiket, gorselIstem: (x.gorsel ?? x.anlatim ?? "").trim(),
        }));
        if (l.length) return { sahneler: l, kaynak: "ai" };
      }
    } catch { /* taslağa düş */ }
  }
  return { sahneler: shortTaslak(konu, adet), kaynak: "taslak" };
}

/** Sahne görseli üretir; bitince onBitti(url) çağrılır. Sağlayıcı yoksa demo sonucu sahneye yazılmaz (alakasız stok görsel gösterilmez). */
export function sahneGorselUret(s: ExSahne, stil: string, onBitti: (url: string) => void, onHata: () => void): boolean {
  const st = stilBul(stil);
  const r = uretimBaslat({ baslik: `Short · ${s.baslik || "sahne"}`.slice(0, 48), tur: "gorsel", model: GORSEL_MODEL, prompt: `${s.gorselIstem || s.anlatim}. Style: ${st.aciklama}. Vertical 9:16 composition. No text, no letters.`, kredi: KREDI.gorsel, arac: "Shorts Stüdyosu", meta: { oran: "9:16", islem: "uret", hamIstem: s.gorselIstem || s.anlatim } });
  if (!r.ok || !r.id) { uretimHataToast(r); return false; }
  const id = r.id;
  const izle = useProjeler.subscribe((st2) => {
    const u = st2.uretimler.find((x) => x.id === id);
    if (!u || (u.durum !== "tamam" && u.durum !== "hata")) return;
    izle();
    const url = saltUrl(u.gorselUrl);
    if (u.durum === "tamam" && url && u.gercek) onBitti(url);
    else {
      onHata();
      if (u.durum === "hata") toast.error("Sahne görseli üretilemedi", { description: `${u.hata ?? "Sağlayıcı bir hata döndürdü."} Yeniden dene ya da kendi görselini yükle.` });
      else toast.info("Görsel sağlayıcısı bağlı değil", { description: "Sahne stil klibiyle kalıyor, kredi iade edildi. Kendi görselini yükleyebilirsin." });
    }
  });
  return true;
}
