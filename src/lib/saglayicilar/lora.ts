import { readFile } from "fs/promises";
import path from "path";
import { DEPO_KOK, MIME } from "@/lib/dosyaDepo";
import { zipOlustur } from "@/lib/zipYaz";

/**
 * Karakter "derin eğitim" — fal.ai `flux-lora-portrait-trainer`. Fotoğraflar sunucuda tek bir ZIP'e
 * konur ve kuyruğa gönderilir; iş dakikalar sürdüğü için istek beklemez, durum jetonla yoklanır.
 * fal yüzde vermez: arayüz yalnız gerçek durumları (sırada / eğitiliyor / hazır / hata) gösterir.
 * Eğitilen LoRA `fal-ai/flux-lora` ile `loras: [{ path, scale }]` olarak kullanılır.
 */
const KUYRUK = "https://queue.fal.run/";
const UC = "fal-ai/flux-lora-portrait-trainer";
export const ADIM = 1000;
const baslik = () => ({ Authorization: `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json" });

async function dosyaOku(url: string): Promise<{ veri: Blob; uz: string }> {
  let dosya: string | undefined;
  const depo = url.match(/^\/api\/dosya\/([a-z]+)\/([0-9a-f-]{36}\.([a-z0-9]{2,4}))$/);
  if (depo) dosya = path.join(DEPO_KOK, depo[1], depo[2]);
  else if (/^\/gercek\/[\w\-./]+\.(png|jpe?g|webp)$/i.test(url) && !url.includes("..")) dosya = path.join(process.cwd(), "public", url);
  if (!dosya) throw new Error("Fotoğraf okunamadı.");
  const uz = dosya.split(".").pop()!.toLowerCase();
  return { veri: new Blob([await readFile(dosya)], { type: MIME[uz] ?? "image/jpeg" }), uz };
}

type Jeton = { d: string; s: string };
const jetonYaz = (j: Jeton) => Buffer.from(JSON.stringify(j)).toString("base64url");
function jetonOku(t: string): Jeton | null {
  try {
    const j = JSON.parse(Buffer.from(t, "base64url").toString()) as Jeton;
    return typeof j.d === "string" && typeof j.s === "string" && j.d.startsWith(KUYRUK) && j.s.startsWith(KUYRUK) ? j : null;
  } catch { return null; }
}

export async function loraEgitBaslat(gorseller: string[], tetik: string): Promise<{ jeton: string }> {
  if (!process.env.FAL_KEY) throw new Error("Derin eğitim için fal.ai bağlantısı gerekli.");
  if (gorseller.length < 5) throw new Error("Eğitim için en az 5 fotoğraf gerekli.");
  const dosyalar = await Promise.all(gorseller.slice(0, 30).map(async (u, i) => { const d = await dosyaOku(u); return { ad: `${String(i + 1).padStart(2, "0")}.${d.uz}`, veri: d.veri }; }));
  const zip = Buffer.from(await (await zipOlustur(dosyalar)).arrayBuffer());
  if (zip.length > 60 * 1024 * 1024) throw new Error("Fotoğraflar toplam 60 MB'ı aşıyor.");
  const r = await fetch(KUYRUK + UC, {
    method: "POST", headers: baslik(),
    body: JSON.stringify({ images_data_url: `data:application/zip;base64,${zip.toString("base64")}`, trigger_phrase: tetik, steps: ADIM, multiresolution_training: true, subject_crop: true, create_masks: false }),
  });
  if (!r.ok) throw new Error(`fal: ${(await r.text()).slice(0, 200)}`);
  const j = (await r.json()) as { status_url?: string; response_url?: string };
  if (!j.status_url || !j.response_url) throw new Error("fal: kuyruk yanıtı eksik.");
  return { jeton: jetonYaz({ d: j.status_url, s: j.response_url }) };
}

export type LoraDurum = { durum: "sirada"; sira?: number } | { durum: "egitiliyor"; log?: string } | { durum: "hazir"; url: string } | { durum: "hata"; hata: string };

export async function loraSorgula(jeton: string): Promise<LoraDurum> {
  if (!process.env.FAL_KEY) return { durum: "hata", hata: "fal.ai bağlı değil." };
  const j = jetonOku(jeton);
  if (!j) return { durum: "hata", hata: "Geçersiz iş." };
  const r = await fetch(`${j.d}?logs=1`, { headers: baslik() });
  if (!r.ok && r.status !== 202) return { durum: "hata", hata: `fal: HTTP ${r.status}` };
  const s = (await r.json()) as { status?: string; queue_position?: number; error?: string; logs?: { message?: string }[] };
  if (s.status === "IN_QUEUE") return { durum: "sirada", sira: s.queue_position };
  if (s.status === "IN_PROGRESS") return { durum: "egitiliyor", log: s.logs?.filter((l) => l.message).slice(-1)[0]?.message?.slice(0, 120) };
  if (s.status !== "COMPLETED" || s.error) return { durum: "hata", hata: (s.error || "Eğitim başarısız.").slice(0, 200) };
  const c = await fetch(j.s, { headers: baslik() });
  if (!c.ok) return { durum: "hata", hata: `fal: HTTP ${c.status}` };
  const o = (await c.json()) as { diffusers_lora_file?: { url?: string } };
  if (!o.diffusers_lora_file?.url) return { durum: "hata", hata: "LoRA dosyası dönmedi." };
  return { durum: "hazir", url: o.diffusers_lora_file.url };
}
