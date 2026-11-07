import "server-only";
import { yeniTabloKurali } from "./bulutVeriAyar";
import { KURALLAR, SINIR, alanlariTemizle, istekOrtami, semaTemizle, semayaUygula, suzgecUygula, veriDegistir, veriOku, yeniKayitId, type Kural, type Suzgec } from "./veri";

type Sonuc = { icerik: string; hata?: boolean; adim?: { baslik: string; ayrinti?: string } };
const TUR_AD: Record<string, string> = { metin: "metin", uzunMetin: "uzun metin", sayi: "sayı", mantiksal: "evet/hayır", tarih: "tarih", eposta: "e-posta", url: "adres", gorsel: "görsel", secim: "seçim", iliski: "ilişki", json: "JSON" };

/**
 * Build ajanının "veritabani" aracı: tabloları listeler, tablo kurar (şema + kurallar), örnek kayıt ekler, kayıt okur.
 * Ajan proje sahibinin yetkisiyle çalışır; her değişiklik sohbette bir adım olarak görünür.
 * Projede Test ortamı açıksa ajan Test veritabanında çalışır (önizleme de onu kullanır); yayında Canlı'ya aktarılır.
 */
export async function veritabaniAraci(projeId: string, g: Record<string, unknown>): Promise<Sonuc> {
  const tablo = typeof g.tablo === "string" ? g.tablo : "";
  const ortam = await istekOrtami(projeId, true).catch(() => "canli" as const);
  const ek = ortam === "test" ? " (Test ortamı)" : "";
  try {
    switch (g.islem) {
      case "tablolar": {
        const v = await veriOku(projeId, ortam);
        const l = Object.entries(v.koleksiyonlar);
        if (!l.length) return { icerik: `Henüz tablo yok${ek}.` };
        return {
          icerik: l.map(([ad, k]) => `${ad} (${k.kayitlar.length} kayıt; okuma ${k.kurallar.okuma}, ekleme ${k.kurallar.ekleme}, düzenleme ${k.kurallar.duzenleme})${k.aciklama ? ` — ${k.aciklama}` : ""}\n  sütunlar: ${k.sema?.length ? k.sema.map((s) => `${s.ad}:${s.tur}${s.zorunlu ? "!" : ""}${s.benzersiz ? " benzersiz" : ""}${s.secenekler ? ` [${s.secenekler.join("|")}]` : ""}${s.iliski ? ` → ${s.iliski}` : ""}`).join(", ") : `şemasız (${[...new Set(k.kayitlar.slice(-20).flatMap((r) => Object.keys(r)))].join(", ")})`}`).join("\n"),
          adim: { baslik: "Veritabanı incelendi", ayrinti: `${l.length} tablo${ek}` },
        };
      }
      case "tablo_kur": {
        const sema = g.sutunlar !== undefined ? semaTemizle(g.sutunlar) : undefined;
        if (g.sutunlar !== undefined && !sema) return { icerik: "Sütunlar geçersiz.", hata: true };
        const kr = (g.kurallar ?? {}) as Record<string, unknown>;
        const yk = await yeniTabloKurali(projeId);
        const sonuc = await veriDegistir(projeId, (v) => {
          const yeni = !v.koleksiyonlar[tablo];
          if (yeni && Object.keys(v.koleksiyonlar).length >= SINIR.koleksiyon) throw new Error("Tablo sınırına ulaşıldı (50).");
          const k = v.koleksiyonlar[tablo] ??= { kurallar: { ...yk }, kayitlar: [] };
          if (sema) k.sema = sema;
          if (typeof g.aciklama === "string") k.aciklama = g.aciklama.slice(0, 300);
          for (const a of ["okuma", "ekleme", "duzenleme"] as const) if (KURALLAR.includes(kr[a] as Kural)) k.kurallar[a] = kr[a] as Kural;
          return { yeni, k };
        }, ortam);
        const sut = sonuc.k.sema ?? [];
        const kapaliUyari = sonuc.yeni && !g.kurallar && yk.okuma === "kapali" ? " DİKKAT: bu projede yeni tablolar kapalı açılır; ziyaretçiler bu tabloyu okuyamaz ve kayıt ekleyemez. Site tarayıcıdan okuyacak ya da yazacaksa tablo_kur ile kurallar ver (ör. okuma herkes, ekleme uyeler)." : "";
        return {
          icerik: `"${tablo}" ${sonuc.yeni ? "oluşturuldu" : "güncellendi"}. Sütunlar: ${sut.map((s) => `${s.ad} (${s.tur})`).join(", ") || "şemasız"}. Kurallar: okuma ${sonuc.k.kurallar.okuma}, ekleme ${sonuc.k.kurallar.ekleme}, düzenleme ${sonuc.k.kurallar.duzenleme}.${kapaliUyari}`,
          adim: { baslik: `${sonuc.yeni ? "Tablo kuruldu" : "Tablo güncellendi"}: ${tablo}${ek}`, ayrinti: sut.map((s) => `${s.ad} · ${TUR_AD[s.tur] ?? s.tur}${s.zorunlu ? " · zorunlu" : ""}`).join("\n") },
        };
      }
      case "ornek_ekle": {
        const l = Array.isArray(g.kayitlar) ? g.kayitlar.slice(0, 30) : [];
        if (!l.length) return { icerik: "Eklenecek kayıt yok.", hata: true };
        const yk = await yeniTabloKurali(projeId);
        const r = await veriDegistir(projeId, (v) => {
          const k = v.koleksiyonlar[tablo] ??= { kurallar: { ...yk }, kayitlar: [] };
          let n = 0; const hatalar: string[] = [];
          for (const [i, x] of l.entries()) {
            if (k.kayitlar.length >= SINIR.kayit) break;
            const t = alanlariTemizle(x);
            if (!t) { hatalar.push(`${i + 1}. kayıt geçersiz`); continue; }
            const s = semayaUygula(k, t, true);
            if ("hata" in s) { hatalar.push(`${i + 1}. kayıt: ${s.hata}`); continue; }
            const z = Date.now();
            k.kayitlar.push({ id: yeniKayitId(), olusturma: z, guncelleme: z, ...s.alanlar });
            n++;
          }
          return { n, hatalar };
        }, ortam);
        return { icerik: `${r.n} kayıt eklendi.${r.hatalar.length ? ` Atlananlar: ${r.hatalar.join("; ")}` : ""}`, hata: r.n === 0, adim: { baslik: `${r.n} örnek kayıt eklendi: ${tablo}${ek}` } };
      }
      case "oku": {
        const k = (await veriOku(projeId, ortam)).koleksiyonlar[tablo];
        if (!k) return { icerik: `"${tablo}" adında tablo yok.` };
        let l = [...k.kayitlar].reverse();
        if (Array.isArray(g.suzgec)) l = suzgecUygula(l, g.suzgec as Suzgec[]);
        const n = Math.min(50, Math.max(1, Number(g.sinir) || 20));
        return { icerik: `${k.kayitlar.length} kayıttan son ${Math.min(n, l.length)}:\n${JSON.stringify(l.slice(0, n)).slice(0, 12000)}`, adim: { baslik: `Kayıtlar okundu: ${tablo}` } };
      }
    }
    return { icerik: "Bilinmeyen işlem.", hata: true };
  } catch (e) {
    return { icerik: (e as Error).message, hata: true, adim: { baslik: "Veritabanı işlemi başarısız", ayrinti: (e as Error).message } };
  }
}
