import "server-only";
import { randomBytes } from "crypto";
import type { BuildModel } from "./modeller";
import { baglamSiniri, SIKISTIRMA_ESIGI } from "./sohbetBaglam";
import type { Sohbet, SohbetMesaji, SohbetOzeti, SohbetParca } from "./sohbetDepo";
import { ekMetni } from "./sohbetEk";
import { baglamTahmini, ozetNoktasi } from "./sohbetGecmis";
import { motoruCalistir } from "./sohbetMotoru";
import { bellekEtiketiniGizle } from "./sohbetYol";

/**
 * Otomatik bağlam sıkıştırma (Claude'un "compaction"ı gibi): bağlam modelin sınırının yüzde 80'ine gelince eski
 * mesajlar aynı modelle özetlenir; özet ağaçtaki son özetlenen mesaja bağlanır ve o yoldan geçen her dal kullanır.
 * Son birkaç mesaj olduğu gibi kalır, sohbet kesilmez. Kullanıcı istediğinde elle de sıkıştırılabilir.
 */
const SISTEM = `Sen Vayra'nın sohbet özetleyicisisin. Aşağıda bir kullanıcı ile asistan arasındaki konuşmanın eski kısmı var (varsa önceki özetle birlikte). Konuşma bu özetle sürecek; asistan eski mesajları artık görmeyecek.
Görevin bu kısmın yoğun ama eksiksiz bir özetini çıkarmak. Koru:
- kullanıcının amacı, bağlamı, tercihleri ve kısıtları
- verilen kararlar, kabul ya da reddedilen öneriler
- üretilen dosyalar, kodlar, görseller (adları, kimlikleri, sürümleri), önemli sayılar, adresler ve adlar
- yarım kalan işler ve açık sorular
Biçim: Türkçe, kısa başlıklar altında madde madde; en çok 700 kelime. Giriş cümlesi yazma, konuşmayı yorumlama.`;

const parcaMetni = (p: SohbetParca): string => {
  if (p.tur === "metin") return bellekEtiketiniGizle(p.metin);
  if (p.tur !== "arac") return "";
  const s = p.sonuc;
  if (s?.tur === "dosya") return `[${p.baslik}: ${s.dosya.ad}, kimlik ${s.dosya.id}, sürüm ${s.dosya.surum}]`;
  if (s?.tur === "gorsellestirme") return `[Görselleştirme: ${s.baslik}]`;
  if (s?.tur === "gorsel") return `[${p.baslik}: ${s.urller.join(", ")}]`;
  if (s?.tur === "video" || s?.tur === "ses" || s?.tur === "3d") return `[${p.baslik}: ${s.url}]`;
  if (s?.tur === "proje") return `[Build projesi açıldı: ${s.ad} (${s.id})]`;
  if (s?.tur === "arama") return `[Web araması${s.sorgu ? `: ${s.sorgu}` : ""}]`;
  return p.durum === "bitti" ? `[${p.baslik}]` : "";
};

async function dokum(m: SohbetMesaji, sinir: number): Promise<string> {
  let t: string;
  if (m.rol === "kullanici") {
    const ekler: string[] = [];
    for (const e of m.ekler ?? []) {
      if (e.tur === "gorsel") { ekler.push(`[Görsel eki: ${e.ad}]`); continue; }
      const x = await ekMetni(e).catch(() => "");
      ekler.push(`[Ek: ${e.ad}]${x ? `\n${x.slice(0, 8000)}${x.length > 8000 ? "…" : ""}` : ""}`);
    }
    t = `Kullanıcı:${m.istek?.alinti ? ` (alıntı: "${m.istek.alinti.slice(0, 400)}")` : ""} ${m.metin ?? ""}${ekler.length ? `\n${ekler.join("\n")}` : ""}`;
  } else {
    t = `Asistan: ${(m.parcalar ?? []).map(parcaMetni).filter(Boolean).join("\n") || m.kurul?.sentez || ""}`;
  }
  return t.length > sinir ? `${t.slice(0, sinir)}… (kısaltıldı)` : t;
}

export type SikistirSonucu = { ozet: SohbetOzeti } | { yok: string };

/**
 * yol: kökten şimdiki noktaya mesajlar. Otomatikte yolun sonu [soru, yanıt] olur ve soru korunur; elle sıkıştırmada
 * son iki mesaj korunur. Sıkıştırılacak bir şey yoksa { yok } döner.
 */
export async function sohbetiSikistir(g: { s: Sohbet; yol: SohbetMesaji[]; model: BuildModel; signal: AbortSignal; elle?: boolean }): Promise<SikistirSonucu> {
  const { s, yol, model } = g;
  const sonSoru = g.elle ? yol.length : yol.map((m) => m.rol).lastIndexOf("kullanici");
  const once = yol.slice(0, Math.max(0, sonSoru));
  const koru = g.elle ? (once.length >= 4 ? 2 : 0) : once.length >= 8 ? 4 : once.length >= 4 ? 2 : 0;
  let c = once.length - koru - 1;
  while (c >= 0 && once[c].rol !== "asistan") c--;
  if (c < 0) return { yok: "Özetlenecek kadar eski mesaj yok." };
  const onceki = ozetNoktasi(s, [...once, { id: "_", rol: "kullanici", zaman: 0 }]);
  if (onceki && onceki.i >= c) return { yok: "Eski mesajlar zaten özetlendi." };
  const sinir = baglamSiniri(model.id);
  const toplamSinir = Math.min(420_000, Math.floor(sinir * 3.5 * 0.55));
  const parcalar: string[] = [];
  const bas = onceki ? onceki.i + 1 : 0;
  const tekSinir = Math.max(4000, Math.floor(toplamSinir / Math.max(1, c - bas + 1)));
  for (let i = bas; i <= c; i++) parcalar.push(await dokum(once[i], tekSinir));
  const metin = `${onceki ? `<onceki-ozet>\n${onceki.ozet.metin}\n</onceki-ozet>\n\n` : ""}<konusma>\n${parcalar.join("\n\n")}\n</konusma>\n\nBu kısmın özetini yaz.`;
  const tokenOnce = baglamTahmini(s, once);
  const cikti: SohbetParca[] = [];
  const r = await motoruCalistir({
    model, sistem: SISTEM, gecmis: [{ role: "user", content: [{ type: "text", text: metin.slice(0, toplamSinir + 20_000) }] }], efor: "low",
    izin: () => "kapali", ozel: [], sunucu: [], parcalar: cikti, yaz: () => {}, yurut: async () => ({ icerik: "", hata: true }), kaydet: async () => {}, signal: g.signal,
  });
  const ozetMetni = cikti.filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin.trim()).filter(Boolean).join("\n\n").trim();
  if (r.durum !== "bitti" || !ozetMetni) return { yok: r.hata ?? "Özet çıkarılamadı." };
  const ozet: SohbetOzeti = {
    id: randomBytes(6).toString("base64url"), sonMesaj: once[c].id, metin: ozetMetni.slice(0, 12_000), zaman: Date.now(),
    mesaj: (onceki?.ozet.mesaj ?? 0) + (c - bas + 1), once: tokenOnce, sonra: 0, model: model.id, ...(g.elle ? { elle: true } : {}),
  };
  s.ozetler = [...(s.ozetler ?? []), ozet].slice(-30);
  ozet.sonra = baglamTahmini(s, once);
  return { ozet };
}

/** Otomatik eşik: tahmini bağlam modelin sınırının yüzde 80'ini geçti mi. */
export function sikistirmaGerekli(s: Sohbet, yol: SohbetMesaji[], model: BuildModel, sistemKarakter: number): boolean {
  const t = baglamTahmini(s, yol) + Math.ceil(sistemKarakter / 3.5);
  return t >= baglamSiniri(model.id) * SIKISTIRMA_ESIGI;
}
