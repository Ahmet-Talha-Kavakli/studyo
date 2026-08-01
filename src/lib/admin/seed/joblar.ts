/**
 * Job (üretim) evreni — deterministik. Her job: kullanıcı, model, durum, süre, kredi,
 * gerçek provider maliyeti, moderasyon skorları. Canlı kuyruk dilimi buradan türetilir.
 */
import { prng, tohumla, tamsayi, sec, agirlikliSec, normal, BUGUN, GUN, DK } from "../cekirdek";
import { MODELLER } from "../tablolar";
import type { AdminKullanici } from "./kullanicilar";

export type JobDurum = "kuyrukta" | "isleniyor" | "tamam" | "hata" | "iptal";

export interface AdminJob {
  id: string;
  kullaniciId: string;
  modelId: string;
  modelAd: string;
  tur: string;
  saglayici: string;
  durum: JobDurum;
  prompt: string;
  olusturma: number;
  sureMs: number; // işlem süresi
  beklemeMs: number; // kuyrukta bekleme
  kredi: number; // kullanıcıdan alınan
  maliyetUsd: number; // provider'a ödenen
  hataKodu?: string;
  nsfw: number; // 0-1
  siddet: number; // 0-1
  unluEslesme: number; // 0-1
  oncelik: number; // 1-10 (tier bazlı)
}

const PROMPT_ORNEK = [
  "sinematik gün batımı sahili, drone çekimi",
  "neon ışıklı cyberpunk sokak, yağmur",
  "ürün tanıtımı, minimalist stüdyo ışığı",
  "portre, yumuşak doğal ışık, film grain",
  "3D karakter, oyun varlığı, düşük poligon",
  "seslendirme, sıcak erkek ses, TR",
  "moda editoryal, altın saat, rüzgar",
  "explainer video, altyazılı, kurumsal",
  "epik fantezi manzara, sisli dağlar",
  "reklam hook'u, dikey format, enerjik",
];
const HATA_KODLARI = ["PROVIDER_5XX", "TIMEOUT", "CONTENT_POLICY", "RATE_LIMIT", "INVALID_INPUT"];

export function uretJoblar(kullanicilar: AdminKullanici[], adet = 42000): AdminJob[] {
  const liste: AdminJob[] = [];
  const aktifKul = kullanicilar.filter((k) => k.jobSayisi > 0);
  for (let i = 0; i < adet; i++) {
    const r = prng(tohumla(`vayra-admin-job-v2-${i}`));
    const kul = aktifKul[tamsayi(r, 0, aktifKul.length)];
    const model = sec(r, MODELLER);
    const yakinlik = normal(r); // 0..1 — 1'e yakın = daha yeni
    const olusturma = BUGUN - Math.round((1 - yakinlik) * 90 * GUN) - tamsayi(r, 0, 86400000);
    const canli = olusturma > BUGUN - 10 * DK; // son 10 dk = canlı kuyruk adayı
    const durum: JobDurum = canli
      ? agirlikliSec(r, [["kuyrukta", 30], ["isleniyor", 40], ["tamam", 25], ["hata", 5]] as const)
      : agirlikliSec(r, [["tamam", 88], ["hata", 8], ["iptal", 4]] as const);
    const sureMs = tamsayi(r, 3000, 90000);
    const maliyetUsd = +(model.maliyetUsd * (0.85 + r() * 0.3)).toFixed(3);
    liste.push({
      id: `j_${(1000000 + i).toString(36)}`,
      kullaniciId: kul.id,
      modelId: model.id,
      modelAd: model.ad,
      tur: model.tur,
      saglayici: model.saglayici,
      durum,
      prompt: sec(r, PROMPT_ORNEK),
      olusturma,
      sureMs,
      beklemeMs: tamsayi(r, 200, 25000),
      kredi: model.kredi,
      maliyetUsd,
      hataKodu: durum === "hata" ? sec(r, HATA_KODLARI) : undefined,
      nsfw: +(normal(r) * (r() > 0.92 ? 1 : 0.3)).toFixed(2),
      siddet: +(normal(r) * (r() > 0.95 ? 1 : 0.2)).toFixed(2),
      unluEslesme: +(normal(r) * (r() > 0.97 ? 1 : 0.15)).toFixed(2),
      oncelik: kul.vip ? tamsayi(r, 7, 11) : kul.plan === "ultra" ? tamsayi(r, 5, 9) : tamsayi(r, 1, 6),
    });
  }
  return liste;
}
