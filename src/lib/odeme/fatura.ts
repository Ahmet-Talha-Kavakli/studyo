import type { FaturaBilgisi } from "./tipler";

/** Kimlik ve vergi numarası doğrulaması (resmî algoritmalar). İstemci ve sunucu aynı kuralı kullanır. */
export function tcknGecerli(t: string) {
  if (!/^[1-9]\d{10}$/.test(t)) return false;
  const d = t.split("").map(Number);
  const tek = d[0] + d[2] + d[4] + d[6] + d[8], cift = d[1] + d[3] + d[5] + d[7];
  if ((((tek * 7 - cift) % 10) + 10) % 10 !== d[9]) return false;
  return d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10];
}
export function vknGecerli(v: string) {
  if (!/^\d{10}$/.test(v)) return false;
  const d = v.split("").map(Number);
  let top = 0;
  for (let i = 0; i < 9; i++) { const t = (d[i] + 9 - i) % 10; top += t === 9 ? 9 : (t * 2 ** (9 - i)) % 9; }
  return (10 - (top % 10)) % 10 === d[9];
}

export const BOS_FATURA: FaturaBilgisi = { tip: "bireysel", adSoyad: "", tckn: "", unvan: "", vkn: "", vergiDairesi: "", adres: "", il: "", ilce: "", postaKodu: "", eposta: "", telefon: "", ulke: "Türkiye" };

const temiz = (v: unknown, n: number) => String(v ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);

/** Gelen fatura bilgisini temizler ve doğrular. Alan hatalarını döndürür (boşsa geçerli). */
export function faturaTemizle(g: unknown): { f: FaturaBilgisi; hatalar: Partial<Record<keyof FaturaBilgisi, string>> } {
  const o = (g && typeof g === "object" ? g : {}) as Record<string, unknown>;
  const f: FaturaBilgisi = {
    tip: o.tip === "kurumsal" ? "kurumsal" : "bireysel",
    adSoyad: temiz(o.adSoyad, 100), tckn: temiz(o.tckn, 11).replace(/\D/g, ""), unvan: temiz(o.unvan, 200), vkn: temiz(o.vkn, 10).replace(/\D/g, ""),
    vergiDairesi: temiz(o.vergiDairesi, 80), adres: temiz(o.adres, 300), il: temiz(o.il, 60), ilce: temiz(o.ilce, 60), postaKodu: temiz(o.postaKodu, 5).replace(/\D/g, ""),
    eposta: temiz(o.eposta, 120).toLowerCase(), telefon: temiz(o.telefon, 20).replace(/[^\d+]/g, ""), ulke: temiz(o.ulke, 60) || "Türkiye",
  };
  const h: Partial<Record<keyof FaturaBilgisi, string>> = {};
  if (f.tip === "bireysel") {
    if (f.adSoyad && f.adSoyad.split(" ").length < 2) h.adSoyad = "Ad ve soyad gir.";
    if (f.tckn && !tcknGecerli(f.tckn)) h.tckn = "Geçerli bir T.C. kimlik numarası değil.";
  } else {
    if (f.vkn && !vknGecerli(f.vkn)) h.vkn = "Geçerli bir vergi kimlik numarası değil.";
    if (f.vkn && !f.vergiDairesi) h.vergiDairesi = "Vergi dairesini gir.";
  }
  if (f.postaKodu && !/^\d{5}$/.test(f.postaKodu)) h.postaKodu = "5 haneli olmalı.";
  if (f.eposta && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.eposta)) h.eposta = "Geçerli bir e-posta gir.";
  if (f.telefon && !/^\+?\d{10,15}$/.test(f.telefon)) h.telefon = "Telefon numarası geçerli değil.";
  return { f, hatalar: h };
}

/** Türkiye'de ödeme (iyzico) ve e-Arşiv için en az: ad soyad ya da unvan, adres ve il. */
export function faturaTamam(f: FaturaBilgisi | undefined): boolean {
  if (!f) return false;
  const kimlik = f.tip === "kurumsal" ? !!f.unvan && vknGecerli(f.vkn) && !!f.vergiDairesi : f.adSoyad.split(" ").filter(Boolean).length >= 2;
  return kimlik && f.adres.length >= 5 && !!f.il;
}
