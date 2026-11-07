import "server-only";
import { kullanim as depolamaKullanim, PROJE_SINIRI as DEPOLAMA_SINIRI } from "./depolama";
import { aiKullanim, AI_VARSAYILAN } from "./yapayZeka";
import { aylikKullanim, ayAnahtari, gunlukKullanim, kullanimGecmisi } from "./bulutKullanim";
import { bulutAyarOku } from "./bulutAyar";
import type { Proje } from "./tipler";
import { uyeleriListele } from "./uye";
import { SINIR, veriOku } from "./veri";

/**
 * Proje kullanımı ve sınırları. Gerçekten uygulanan sınırlar: depolama (500 MB), tablo başına kayıt (5.000), üye
 * (20.000), sitenin günlük yapay zekâ sınırı (sahibin ayarı). İstek, bant genişliği ve fonksiyon çağrısı için aylık
 * kota: dolunca bildirim gelir; sahip "kota dolunca bakım moduna al" seçtiyse site bakım sayfasına geçer.
 */
export const AYLIK_KOTA = { istek: 100_000, bant: 10 * 1024 ** 3, fonksiyon: 50_000, fonksiyonMs: 50 * 3600_000, gorsel: 5_000, ai: 3_000 };
export const UYE_SINIRI = 20_000;
/** Bütün projelerde aynı olan Bulut sınırları (plan tablosu bunlardan kurulur). */
export const PLAN = { ad: "Vayra Bulut", aciklama: "Bütün projelerde aynı sınırlar; istek, bant, fonksiyon ve görsel kotası takvim ayıyla (Türkiye saati) sıfırlanır." };

export type KullanimKalemi = {
  id: "istek" | "bant" | "fonksiyon" | "fonksiyonMs" | "gorsel" | "ai" | "aiAy" | "depolama" | "kayit" | "uye"; ad: string; kullanilan: number; sinir: number; birim: "adet" | "bayt" | "ms"; donem: "ay" | "gun" | "toplam"; uygulanan: boolean; not?: string;
  /** Aylık kalemlerde bu hızla ay sonunda varılacak değer (son 7 günün ortalamasıyla). */ tahmin?: number;
  /** Uyarı: dolmak üzere ya da tahminle aşacak. */ uyari?: "dolu" | "yakin" | "asacak";
};

export async function kullanimOzeti(p: Proje) {
  const [ay, gecmis, dep, v, ai, uyeler, ayar, gunler] = await Promise.all([aylikKullanim(p.id), kullanimGecmisi(p.id, 6), depolamaKullanim(p.id), veriOku(p.id), aiKullanim(p.id), uyeleriListele(p.id).catch(() => []), bulutAyarOku(p.id), gunlukKullanim(p.id, 30)]);
  const aiAyar = { ...AI_VARSAYILAN, ...(p.ayarlar.ai ?? {}) };
  const tablolar = Object.entries(v.koleksiyonlar).map(([ad, k]) => ({ ad, adet: k.kayitlar.length })).sort((a, b) => b.adet - a.adet);
  const toplamKayit = tablolar.reduce((t, x) => t + x.adet, 0);
  const kalemler: KullanimKalemi[] = [
    { id: "istek", ad: "İstekler", kullanilan: ay.istek, sinir: AYLIK_KOTA.istek, birim: "adet", donem: "ay", uygulanan: false },
    { id: "bant", ad: "Bant genişliği", kullanilan: ay.bant, sinir: AYLIK_KOTA.bant, birim: "bayt", donem: "ay", uygulanan: false },
    { id: "fonksiyon", ad: "Fonksiyon çağrıları", kullanilan: ay.fonksiyon, sinir: AYLIK_KOTA.fonksiyon, birim: "adet", donem: "ay", uygulanan: false },
    { id: "fonksiyonMs", ad: "Fonksiyon süresi", kullanilan: ay.fonksiyonMs ?? 0, sinir: AYLIK_KOTA.fonksiyonMs, birim: "ms", donem: "ay", uygulanan: false, not: ay.fonksiyon ? `Çağrı başına ortalama ${Math.round((ay.fonksiyonMs ?? 0) / Math.max(1, ay.fonksiyon))} ms; zamanlanmış görevler ve kuyruk işleri dahil` : "Yayındaki sunucu fonksiyonlarının toplam çalışma süresi" },
    { id: "gorsel", ad: "Görsel dönüşümleri", kullanilan: ay.gorsel ?? 0, sinir: AYLIK_KOTA.gorsel, birim: "adet", donem: "ay", uygulanan: false, not: "Yalnız yeni üretilenler sayılır; önbellekten verilenler sayılmaz" },
    { id: "ai", ad: "Yapay zekâ istekleri, bugün", kullanilan: ai.metin + ai.gorsel, sinir: Math.max(1, aiAyar.gunlukSinir), birim: "adet", donem: "gun", uygulanan: true, not: aiAyar.acik ? `${ai.metin} metin, ${ai.gorsel} görsel; sınırı Yapay zekâ bölümünden değiştir` : "Sitede yapay zekâ kapalı" },
    { id: "aiAy", ad: "Yapay zekâ istekleri, bu ay", kullanilan: ay.ai, sinir: AYLIK_KOTA.ai, birim: "adet", donem: "ay", uygulanan: false },
    { id: "depolama", ad: "Dosya depolama", kullanilan: dep.boyut, sinir: DEPOLAMA_SINIRI, birim: "bayt", donem: "toplam", uygulanan: true, not: `${dep.dosya} dosya` },
    { id: "kayit", ad: "Veritabanı kayıtları", kullanilan: tablolar[0]?.adet ?? 0, sinir: SINIR.kayit, birim: "adet", donem: "toplam", uygulanan: true, not: tablolar.length ? `En dolu tablo ${tablolar[0].ad}; toplam ${toplamKayit.toLocaleString("tr-TR")} kayıt, ${tablolar.length} tablo` : "Henüz tablo yok" },
    { id: "uye", ad: "Üyeler", kullanilan: uyeler.length, sinir: UYE_SINIRI, birim: "adet", donem: "toplam", uygulanan: true },
  ];
  // Ay sonu tahmini: son 7 günün ortalaması kalan günlerle çarpılıp bugüne kadarkine eklenir.
  const simdi = new Date(Date.now() + 3 * 3600_000);
  const ayGun = new Date(Date.UTC(simdi.getUTCFullYear(), simdi.getUTCMonth() + 1, 0)).getUTCDate();
  const kalan = ayGun - simdi.getUTCDate() + (1 - (simdi.getUTCHours() * 60 + simdi.getUTCMinutes()) / 1440);
  const son7 = gunler.slice(-7);
  for (const k of kalemler) {
    if (k.donem === "ay") {
      const alan = (k.id === "aiAy" ? "ai" : k.id) as keyof (typeof gunler)[number]["s"];
      const ort = son7.reduce((t, g) => t + (g.s[alan] ?? 0), 0) / Math.max(1, son7.length);
      k.tahmin = Math.round(k.kullanilan + ort * Math.max(0, kalan));
    }
    const oran = k.kullanilan / Math.max(1, k.sinir);
    k.uyari = oran >= 1 ? "dolu" : oran >= 0.8 ? "yakin" : k.tahmin && k.tahmin > k.sinir ? "asacak" : undefined;
  }
  return { ay: ayAnahtari(), kalemler, gecmis, gunler, plan: PLAN, ayar: { aiDuraklat: ayar.aiDuraklat, bakim: ayar.bakim, kota: ayar.kota }, ai: { acik: aiAyar.acik }, duvarEngel: ay.engel };
}

/** Hesabın bütün projeleri için bu ayın kullanımı (Bulut genel bakışı). */
export async function hesapKullanimi(projeler: Proje[]) {
  const l = await Promise.all(projeler.map(async (p) => {
    const [ay, dep, ai] = await Promise.all([aylikKullanim(p.id), depolamaKullanim(p.id), aiKullanim(p.id).catch(() => ({ metin: 0, gorsel: 0 }))]);
    return { id: p.id, ad: p.ad, kapak: p.kapak, istek: ay.istek, bant: ay.bant, fonksiyon: ay.fonksiyon, fonksiyonMs: ay.fonksiyonMs ?? 0, ai: ay.ai, aiBugun: ai.metin + ai.gorsel, depolama: dep.boyut, gorsel: ay.gorsel ?? 0 };
  }));
  return { ay: ayAnahtari(), projeler: l.sort((a, b) => b.istek + b.fonksiyon - (a.istek + a.fonksiyon)), kota: AYLIK_KOTA, depolamaSiniri: DEPOLAMA_SINIRI };
}
