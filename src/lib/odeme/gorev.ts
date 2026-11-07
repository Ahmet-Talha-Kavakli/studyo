import "server-only";
import { kilitle } from "@/lib/hesap/depo";
import { krediEkle, sonHareketler } from "@/lib/hesap/kredi";
import type { HesapKaydi } from "@/lib/hesap/depo";
import type { KrediOzeti } from "@/lib/hesap/tipler";
import { kayitGuncelle, kayitOku } from "./depo";
import { OdemeHatasi } from "./hata";

/**
 * Görev ödülleri (/panel/gorevler). Ödül tutarı ve tekrar kuralı sunucudadır; istemci yalnız görev kimliğini gönderir.
 * Kredi defterinden doğrulanabilen görevler (üretim sayıları, farklı stüdyolar) sunucuda denetlenir; profil görevi hesap
 * kaydından denetlenir. Sunucuda doğrulanamayan görevler (topluluk, element, davet, yorum) ödül listesinde yok;
 * davet ödülü sunucu tarafı davet kaydıyla ayrıca kurulacak. Günlük görevler günde bir kez.
 *
 * Tutarlar store/useGorevler.ts GOREVLER ile aynıdır; ödemede bu tablo esastır.
 */
type Dogrulama = "harcama1" | "harcama10" | "bugun3" | "studyo3" | "profil" | "yok";
const GOREVLER: Record<string, { odul: number; gunluk: boolean; dogrulama: Dogrulama; ad: string }> = {
  "ilk-uretim": { odul: 50, gunluk: false, dogrulama: "harcama1", ad: "İlk üretimini yap" },
  "profil-tamamla": { odul: 30, gunluk: false, dogrulama: "profil", ad: "Profilini tamamla" },
  "gunluk-uretim": { odul: 25, gunluk: true, dogrulama: "bugun3", ad: "Günlük 3 üretim" },
  "gunluk-giris": { odul: 10, gunluk: true, dogrulama: "yok", ad: "Günlük giriş" },
  "10-uretim": { odul: 60, gunluk: false, dogrulama: "harcama10", ad: "10 üretime ulaş" },
  "3-studyo": { odul: 45, gunluk: false, dogrulama: "studyo3", ad: "3 farklı stüdyo dene" },
};
const bugun = () => new Date(Date.now() + 3 * 3_600_000).toISOString().slice(0, 10);

async function dogrula(h: HesapKaydi, d: Dogrulama): Promise<boolean> {
  if (d === "yok") return true;
  if (d === "profil") return !!(h.profil.ad && h.profil.avatar && h.profil.bio);
  const hepsi = await sonHareketler(h.uid, 500);
  const gun = (t: number) => new Date(t + 3 * 3_600_000).toISOString().slice(0, 10);
  // Başarısız üretimde kredi iade edilir: iade edilen harcama üretim sayılmaz.
  const harcama = hepsi.filter((x) => x.tur === "harcama" && x.kaynak.startsWith("/")), iade = hepsi.filter((x) => x.tur === "iade");
  const sayi = (l: typeof hepsi, m: typeof hepsi) => l.length - m.length;
  if (d === "harcama1") return sayi(harcama, iade) >= 1;
  if (d === "harcama10") return sayi(harcama, iade) >= 10;
  if (d === "bugun3") { const g = bugun(); return sayi(harcama.filter((x) => gun(x.zaman) === g), iade.filter((x) => gun(x.zaman) === g)) >= 3; }
  // Kaynak, harcamanın yapıldığı sayfa (/panel/video gibi): üç farklı stüdyo.
  return new Set(harcama.map((x) => x.kaynak.split("/").slice(0, 3).join("/")).filter((k) => k.startsWith("/panel/"))).size >= 3;
}

export async function gorevOdulu(h: HesapKaydi, id: string): Promise<{ kredi: number; ozet: KrediOzeti }> {
  const g = GOREVLER[id];
  if (!g) throw new OdemeHatasi("Görev tanınmadı.", 404);
  const anahtar = g.gunluk ? `${id}:${bugun()}` : id;
  return kilitle(`gorev:${h.uid}:${anahtar}`, async () => {
    if ((await kayitOku(h.uid)).gorevler[anahtar]) throw new OdemeHatasi(g.gunluk ? "Bu görevin bugünkü ödülünü aldın." : "Bu görevin ödülünü zaten aldın.", 409, "alindi");
    if (!(await dogrula(h, g.dogrulama))) throw new OdemeHatasi("Görev henüz tamamlanmamış görünüyor. Sunucudaki kayıtlarına göre koşul sağlanmadı.", 409, "tamamlanmadi");
    const r = await krediEkle(h.uid, g.odul, { kaynak: `gorev:${id}`, aciklama: `Görev ödülü: ${g.ad}`, anahtar: `gorev:${anahtar}:${h.uid.slice(2, 12)}`, plan: h.plan });
    if (!r.ok) throw new OdemeHatasi("Ödül eklenemedi; yeniden dene.", 409);
    await kayitGuncelle(h.uid, (k) => {
      k.gorevler[anahtar] = Date.now();
      // Eski günlük kayıtlar birikmesin.
      const sinir = new Date(Date.now() - 40 * 864e5).toISOString().slice(0, 10);
      for (const a of Object.keys(k.gorevler)) { const gun = a.split(":")[1]; if (gun && gun < sinir) delete k.gorevler[a]; }
    });
    return { kredi: g.odul, ozet: r.ozet };
  });
}

/** Bugün itibarıyla ödülü alınmış görevler (günlükler yalnız bugünkü). */
export async function alinanGorevler(uid: string): Promise<string[]> {
  const k = await kayitOku(uid), g = bugun();
  return Object.keys(k.gorevler).filter((a) => !a.includes(":") || a.endsWith(`:${g}`)).map((a) => a.split(":")[0]);
}
