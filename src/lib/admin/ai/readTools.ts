/**
 * READ tool executor'ları — seed verisinden okur, JSON döner.
 * Hem sunucu (route) hem client (fallback) kullanabilir.
 */
import { veri, ozet } from "@/lib/admin/seed";
import { modelStatlar } from "@/lib/admin/seed/marj";
import { enCokHarcayan } from "@/lib/admin/seed/panolar";
import { para, yuzde } from "@/lib/admin/cekirdek";

export function readToolCalistir(name: string, girdi: Record<string, unknown>): unknown {
  const evren = veri();
  switch (name) {
    case "kullanici_bul": {
      const q = String(girdi.sorgu ?? "").toLowerCase();
      const durum = girdi.durum ? String(girdi.durum) : null;
      const sonuc = evren.kullanicilar.filter((k) =>
        (!durum || k.durum === durum) &&
        (k.ad.toLowerCase().includes(q) || k.email.toLowerCase().includes(q) || k.id.includes(q)),
      ).slice(0, 8).map((k) => ({ id: k.id, ad: k.ad, email: k.email, plan: k.plan, durum: k.durum, kredi: k.krediBakiye, guven: k.guvenSkoru }));
      return { bulunan: sonuc.length, kullanicilar: sonuc };
    }
    case "kullanici_detay": {
      const k = evren.kullanicilar.find((x) => x.id === girdi.kullaniciId);
      if (!k) return { hata: "Kullanıcı bulunamadı" };
      return { id: k.id, ad: k.ad, email: k.email, plan: k.plan, durum: k.durum, kredi: k.krediBakiye, toplamHarcanan: k.toplamHarcanan, toplamOdenen: k.toplamOdenen, guvenSkoru: k.guvenSkoru, ulke: k.ulke, jobSayisi: k.jobSayisi, vip: k.vip };
    }
    case "gelir_ozet": {
      const o = ozet();
      return { mrr: para(o.mrr), arr: para(o.arr), netKar30: para(o.kar30), marj: yuzde(o.karMarji), churn: yuzde(o.churnOran), arpu: para(o.arpu), ltvCac: o.ltvCac.toFixed(1) + "x", aktifAbone: o.aktifAbone };
    }
    case "job_ozet": {
      const o = ozet();
      return { toplamJob: o.toplamJob, job24: o.job24, basariOran: yuzde(o.basariOran), kuyruk: o.kuyruk, isleniyor: o.isleniyor, ortSureSn: o.ortSureSn.toFixed(1) };
    }
    case "model_marj": {
      const stat = modelStatlar(evren, () => ({}));
      const dusuk = stat.filter((s) => s.marj < 20).map((s) => ({ model: s.model.ad, marj: yuzde(s.marj), netKatki: para(s.netKatki) }));
      const enIyi = stat.slice(0, 5).map((s) => ({ model: s.model.ad, marj: yuzde(s.marj), gelir: para(s.gelir) }));
      return { dusukMarjli: dusuk, enCokGelir: enIyi };
    }
    case "en_cok_harcayan": {
      const adet = Number(girdi.adet ?? 10);
      return { kullanicilar: enCokHarcayan(evren).slice(0, adet).map((h) => ({ id: h.id, ad: h.ad, plan: h.plan, harcanan: para(h.harcanan), ulke: h.ulke })) };
    }
    default:
      return { hata: `Bilinmeyen read tool: ${name}` };
  }
}
