import "server-only";
import { modelBagli } from "./disAjan";
import { krediHesapla, modelBul } from "./modeller";
import type { SohbetParca } from "./sohbetDepo";
import { motoruCalistir } from "./sohbetMotoru";
import { kodCalistir } from "./sistemKod";

/**
 * Kod adımı için yapay zekâyla JavaScript yazar (n8n AI Transform, Zapier Code AI): tarif ve örnek girdinin şeması
 * modele gider, dönen kod örnek girdiyle kum havuzunda denenir. Model bağlı değilse açıkça hata döner.
 */
const SISTEM = `Sen Vayra sistem kod adımı yazıyorsun. Kod QuickJS kum havuzunda çalışır: ağ, dosya, require ve import yok.
Biçim zorunlu: export default function (girdi) { ... return { ... }; }
girdi.tetik tetik verisi; girdi.adim["kimlik"] ya da girdi.adim["2"] önceki adımların JSON çıktısı; girdi.dongu.oge döngü öğesi; girdi.degisken hesap değişkenleri.
vayra.hmac(alg, anahtar, veri, "hex"|"base64") ve vayra.ozet(alg, veri) kullanılabilir. console.log günlüğe düşer.
Her zaman bir nesne döndür. Eksik alanlara karşı korumalı yaz. Türkçe yorum satırı ekle.
Yanıtında yalnız tek bir \`\`\`js kod bloğu ve altında tek cümle Türkçe açıklama olsun.`;

const sema = (v: unknown, d = 0): unknown => {
  if (d > 3) return "…";
  if (Array.isArray(v)) return v.length ? [sema(v[0], d + 1)] : [];
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v as object).slice(0, 30).map(([k, x]) => [k, sema(x, d + 1)]));
  return typeof v === "string" ? (v.length > 40 ? `${v.slice(0, 40)}…` : v) : v;
};

export async function kodYaz(modelId: string, tarif: string, ornek: unknown, mevcut: string): Promise<{ kod: string; aciklama: string; kredi: number; deneme: { deger?: unknown; hata?: string; loglar: string[] } } | { hata: string }> {
  const model = modelBul(modelId);
  if (!modelBagli(model)) return { hata: `${model.ad} bu sunucuya bağlı değil; sistem ayarlarından bağlı bir model seç.` };
  const istem = `İstek: ${tarif.slice(0, 3000)}\n\nÖrnek girdinin yapısı:\n${JSON.stringify(sema(ornek), null, 2).slice(0, 8000)}\n\n${mevcut.trim() ? `Şu anki kod (gerekirse düzelt):\n${mevcut.slice(0, 6000)}` : ""}`;
  const parcalar: SohbetParca[] = [];
  const ab = new AbortController();
  const z = setTimeout(() => ab.abort(), 90_000);
  try {
    const r = await motoruCalistir({ model, sistem: SISTEM, gecmis: [{ role: "user", content: [{ type: "text", text: istem }] }], efor: "low", izin: () => "kapali", ozel: [], sunucu: [], parcalar, yaz: () => {}, signal: ab.signal, yurut: async () => ({ icerik: "", hata: true }), kaydet: async () => {} });
    if (r.durum === "hata") return { hata: r.hata ?? "Model yanıt vermedi." };
    const metin = parcalar.filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("\n").trim();
    const m = /```(?:js|javascript|ts)?\s*\n([\s\S]*?)```/i.exec(metin);
    const kod = (m ? m[1] : metin).trim();
    if (!/export\s+default|function\s+main|return\b/.test(kod)) return { hata: "Model kullanılabilir kod döndürmedi; isteği biraz daha ayrıntılı yaz." };
    const aciklama = (m ? metin.slice((m.index ?? 0) + m[0].length) : "").trim().split("\n")[0]?.slice(0, 300) ?? "";
    let deneme: { deger?: unknown; hata?: string; loglar: string[] };
    try { const x = await kodCalistir(kod, ornek); deneme = { deger: x.deger, loglar: x.loglar }; } catch (e) { deneme = { hata: (e as Error).message, loglar: (e as { loglar?: string[] }).loglar ?? [] }; }
    return { kod: `${kod}\n`, aciklama, kredi: krediHesapla(model, r.kullanim), deneme };
  } catch (e) { return { hata: (e as Error).name === "AbortError" ? "Model 90 saniyede yanıt vermedi." : (e as Error).message }; }
  finally { clearTimeout(z); }
}
