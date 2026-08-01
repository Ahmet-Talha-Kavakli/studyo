/**
 * Sistem verileri — servis sağlığı, webhook logları, cron jobları, storage.
 */
import { prng, tohumla, tamsayi, sec, agirlikliSec, BUGUN, SAAT } from "../cekirdek";

export interface Servis {
  ad: string;
  durum: "saglikli" | "yavas" | "sorunlu";
  uptime: string;
  latency: number;
  sonKontrol: number;
}

export function servisler(tik: number): Servis[] {
  const isimler = [
    ["API", 99.98], ["Veritabanı", 99.99], ["Redis", 99.97], ["Kuyruk Worker", 99.9],
    ["Storage", 99.95], ["CDN", 99.99], ["fal.ai", 99.4], ["Google Veo", 99.8], ["ElevenLabs", 99.6],
  ] as const;
  return isimler.map(([ad, up], i) => {
    const r = prng(tohumla(`sys-${ad}-${Math.floor(tik / 4)}`));
    const s = up - (i === 3 ? 0.5 : 0);
    return { ad, durum: s >= 99.8 ? "saglikli" : s >= 99.3 ? "yavas" : "sorunlu", uptime: `%${up}`, latency: tamsayi(r, 40, 400), sonKontrol: BUGUN - tamsayi(r, 1, 300) * 1000 };
  });
}

export interface WebhookLog {
  id: string;
  kaynak: string;
  olay: string;
  durum: number; // HTTP
  retry: number;
  tarih: number;
  yon: "gelen" | "giden";
}

export function webhookLoglari(): WebhookLog[] {
  const olaylar = [
    ["Stripe", "payment.succeeded", "gelen"], ["Stripe", "subscription.updated", "gelen"],
    ["fal.ai", "job.completed", "gelen"], ["iyzico", "payment.failed", "gelen"],
    ["Vayra", "user.credit_low", "giden"], ["Vayra", "job.done", "giden"],
  ] as const;
  return Array.from({ length: 30 }, (_, i) => {
    const r = prng(tohumla(`wh-${i}`));
    const [kaynak, olay, yon] = sec(r, olaylar);
    const durum = agirlikliSec(r, [[200, 82], [500, 8], [400, 6], [429, 4]] as const);
    return { id: `wh_${i}`, kaynak, olay, durum, retry: durum !== 200 ? tamsayi(r, 1, 4) : 0, tarih: BUGUN - i * tamsayi(r, 5, 60) * 60000, yon: yon as "gelen" | "giden" };
  });
}

export interface CronJob {
  ad: string;
  aciklama: string;
  sonCalisma: number;
  sureMs: number;
  durum: "basarili" | "calisiyor" | "hata";
  sonrakiCalisma: number;
  sikilik: string;
}

export function cronJoblar(): CronJob[] {
  const joblar = [
    ["Kredi yenileme", "Aylık kredi tahsisi", "Her gün 00:00"],
    ["Kredi expire", "Süresi dolan kredileri temizle", "Her gün 02:00"],
    ["Storage temizlik", "Yetim dosyaları sil", "Her hafta Pzt 03:00"],
    ["Rapor gönderimi", "Haftalık özet e-posta", "Her Pzt 09:00"],
    ["Tutarlılık kontrolü", "Ledger ≠ bakiye kontrolü", "Her gün 04:00"],
    ["Yedekleme", "DB snapshot", "Her 6 saatte"],
  ];
  return joblar.map(([ad, aciklama, sikilik], i) => {
    const r = prng(tohumla(`cron-${i}`));
    return {
      ad, aciklama, sikilik,
      sonCalisma: BUGUN - tamsayi(r, 1, 24) * SAAT, sureMs: tamsayi(r, 500, 45000),
      durum: agirlikliSec(r, [["basarili", 85], ["calisiyor", 8], ["hata", 7]] as const),
      sonrakiCalisma: BUGUN + tamsayi(r, 1, 12) * SAAT,
    };
  });
}

export function storageDurum() {
  return {
    toplamTB: 48.2, aylikMaliyet: 1240, buyumeYuzde: 8.4, cdnBandwidth: 124, cdnMaliyet: 640,
    enCokKaplayan: Array.from({ length: 6 }, (_, i) => {
      const r = prng(tohumla(`stor-${i}`));
      return { kullanici: sec(r, ["Selin A.", "Emre K.", "Nova Studios", "Meridyen", "Mert D.", "Atlas"]), boyutGB: tamsayi(r, 20, 400) };
    }).sort((a, b) => b.boyutGB - a.boyutGB),
  };
}

/* Error/exception logları */
export interface HataLog {
  id: string;
  seviye: "error" | "warning" | "fatal";
  mesaj: string;
  servis: string;
  sayi: number;
  tarih: number;
}

export function hataLoglari(): HataLog[] {
  const hatalar = [
    ["error", "Provider timeout after 60s", "job-worker"],
    ["warning", "Rate limit approaching for fal.ai", "api-gateway"],
    ["error", "Payment webhook signature mismatch", "billing"],
    ["fatal", "Redis connection lost (recovered)", "queue"],
    ["warning", "Storage bucket 85% full", "storage"],
  ] as const;
  return hatalar.map(([seviye, mesaj, servis], i) => {
    const r = prng(tohumla(`err-${i}`));
    return { id: `err_${i}`, seviye: seviye as HataLog["seviye"], mesaj, servis, sayi: tamsayi(r, 1, 240), tarih: BUGUN - tamsayi(r, 1, 48) * SAAT };
  }).sort((a, b) => b.sayi - a.sayi);
}
