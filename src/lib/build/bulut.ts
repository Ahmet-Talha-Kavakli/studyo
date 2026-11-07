import "server-only";
import { createHash } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { denetle } from "./denetim";
import { kovalar, kullanim } from "./depolama";
import { gunlukOzet } from "./gunluk";
import type { Proje } from "./tipler";
import { uyeleriListele } from "./uye";
import { veriOku } from "./veri";

/**
 * Vayra Bulut özetleri: proje başına yayın, istek, ziyaretçi, veri, üye, depolama ve güvenlik danışmanı.
 * Hepsi mevcut depolardan okunur; ayrı bir kopya tutulmaz.
 */
type AnalitikGun = { g: number; z: number };
async function ziyaretci(id: string, n = 7): Promise<{ goruntuleme: number; ziyaretci: number }> {
  try {
    const v = JSON.parse(await readFile(path.join(DEPO_KOK, "build", "analitik", `${id}.json`), "utf8")) as { gunler: Record<string, AnalitikGun> };
    let g = 0, z = 0;
    for (let i = 0; i < n; i++) { const x = v.gunler[new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)]; g += x?.g ?? 0; z += x?.z ?? 0; }
    return { goruntuleme: g, ziyaretci: z };
  } catch { return { goruntuleme: 0, ziyaretci: 0 }; }
}

export type GuvenlikDuzeltme = { tur: "kural"; tablo: string; kurallar: Partial<{ okuma: string; ekleme: string; duzenleme: string }> } | { tur: "kova"; kova: string } | { tur: "sir"; ad: string };
export type GuvenlikBulgusu = {
  id: string; seviye: "kritik" | "uyari" | "bilgi"; baslik: string; ayrinti: string; yer: "veri" | "dosyalar" | "kod" | "alan" | "yayin" | "ortam" | "fonksiyon";
  /** Tek tıkla uygulanabilen düzeltme (kural, kova, sır görünürlüğü). */ duzelt?: GuvenlikDuzeltme & { etiket: string };
  /** Ajana gönderilecek düzeltme isteği. */ ajan?: string;
  /** Gerekçesiyle yok sayıldıysa. */ yoksayildi?: { neden: string; zaman: number };
};
const bulguId = (yer: string, baslik: string) => createHash("sha1").update(`${yer}:${baslik}`).digest("hex").slice(0, 12);
const OZEL_TABLO = /siparis|rezervasyon|randevu|basvuru|iletisim|mesaj|uye|musteri|odeme|fatura|talep|kayit_ol|bulten/i;
const KISISEL = /e-?posta|email|mail|telefon|phone|tc|tckn|kimlik|adres|iban|dogum|sifre|password/i;

/**
 * Güvenlik taraması: erişim kuralları, kovalar, koddaki sırlar ve riskli kalıplar (XSS, eval), imzasız webhook'lar,
 * tarayıcıda sunucu sırrı kullanımı, alan adları, ortam değişkenleri. dosyalar verilmezse yayındaki sürüm taranır.
 */
export async function guvenlikDenetimi(p: Proje, dosyalarVerilen?: Record<string, string>): Promise<GuvenlikBulgusu[]> {
  type Ham = Omit<GuvenlikBulgusu, "id">;
  const o: Ham[] = [];
  const v = await veriOku(p.id);
  for (const [ad, k] of Object.entries(v.koleksiyonlar)) {
    const alanlar = [...new Set(k.kayitlar.slice(0, 50).flatMap((x) => Object.keys(x)))];
    const kisisel = alanlar.filter((a) => KISISEL.test(a));
    const semaAlanlari = (k.sema ?? []).map((x) => x.ad);
    const kisiselHepsi = [...new Set([...kisisel, ...semaAlanlari.filter((a) => KISISEL.test(a)), ...(k.sema ?? []).filter((x) => x.tur === "eposta").map((x) => x.ad)])];
    if (k.kurallar.okuma === "herkes" && (kisiselHepsi.length || OZEL_TABLO.test(ad))) o.push({
      seviye: "kritik", yer: "veri", baslik: `"${ad}" tablosundaki kişisel veriler herkese açık`,
      ayrinti: `${kisiselHepsi.length ? `${kisiselHepsi.join(", ")} alanları` : "Bu tablonun kayıtları"} siteyi açan herkes tarafından okunabilir. Okumayı yalnız sana açık yap; sitenin kayıtları listelemesi gerekiyorsa bunu sunucu fonksiyonuyla yap.`,
      duzelt: { tur: "kural", tablo: ad, kurallar: { okuma: "kapali" }, etiket: "Okumayı yalnız bana aç" },
      ajan: `"${ad}" tablosunun okuma kuralı yalnız sahibe açıldı ya da açılacak. Sitede bu tabloyu tarayıcıdan listeleyen kod varsa kaldır; gerekiyorsa listelemeyi api/ altında bir sunucu fonksiyonuyla ve yalnız gerekli alanlarla yap.`,
    });
    if (k.kurallar.duzenleme === "herkes") o.push({ seviye: "kritik", yer: "veri", baslik: `"${ad}" tablosunu herkes düzenleyebilir`, ayrinti: "Ziyaretçiler başkalarının kayıtlarını değiştirebilir ya da silebilir.", duzelt: { tur: "kural", tablo: ad, kurallar: { duzenleme: "sahibi" }, etiket: "Yalnız kendi kaydını düzenlesin" } });
    if (k.kurallar.ekleme === "herkes" && !k.sema?.length && k.kayitlar.length > 0) o.push({ seviye: "uyari", yer: "veri", baslik: `"${ad}" tablosuna herkes şemasız kayıt ekleyebiliyor`, ayrinti: "Türü ve zorunluluğu tanımlanmamış tabloya ziyaretçiler istedikleri alanı yazabilir. Veritabanı › Yapı bölümünden sütunları tanımla.", ajan: `"${ad}" tablosu için veritabani aracıyla tablo_kur yap: mevcut kayıtlara bakarak sütun türlerini, zorunlu alanları ve makul uzunlukları belirle.` });
    if (k.kurallar.ekleme === "herkes" && k.kayitlar.length > 4000) o.push({ seviye: "uyari", yer: "veri", baslik: `"${ad}" koleksiyonu dolmak üzere`, ayrinti: `${k.kayitlar.length} / 5000 kayıt. Eski kayıtları dışa aktarıp temizle.` });
  }
  for (const k of await kovalar(p.id)) {
    if (k.yukleme === "herkes") o.push({ duzelt: { tur: "kova", kova: k.ad, etiket: "Yüklemeyi üyelere aç" }, seviye: "uyari", yer: "dosyalar", baslik: `"${k.ad}" kovasına herkes dosya yükleyebilir`, ayrinti: `Kötüye kullanım riski var. Yüklemeyi "Üyeler" yap ya da tür ve boyut sınırını daralt (şu an ${k.boyutMb} MB${k.turler.length ? `, ${k.turler.join(", ")}` : ", her tür"}).` });
  }
  const yayindaki = p.yayin ? p.surumler.find((s) => s.id === p.yayin!.surumId) : null;
  const dosyalar = dosyalarVerilen ?? yayindaki?.dosyalar ?? p.dosyalar;
  for (const b of denetle(dosyalar)) if (b.seviye !== "bilgi") o.push({ seviye: b.seviye, yer: "kod", baslik: b.baslik, ayrinti: `${b.ayrinti}${b.dosya ? ` (${b.dosya})` : ""}`, ajan: `${b.baslik}${b.dosya ? ` (${b.dosya})` : ""}: ${b.ayrinti} Düzelt.` });
  const sunucuSirlari = new Set((p.ayarlar.sirlar ?? []).filter((x) => x.gorunurluk === "sunucu").map((x) => x.ad));
  for (const [yol, icerik] of Object.entries(dosyalar)) {
    const tarayici = !yol.startsWith("api/") && /\.(m?js|html)$/.test(yol);
    if (tarayici) {
      // Sunucu sırrını tarayıcıdan okumaya çalışmak: değer gelmez, ama niyet yanlış (anahtar istemciye taşınmak isteniyor).
      for (const m of icerik.matchAll(/VAYRA_ENV\.([A-Z][A-Z0-9_]+)/g)) if (sunucuSirlari.has(m[1])) o.push({ seviye: "kritik", yer: "kod", baslik: `Sunucu sırrı ${m[1]} tarayıcı kodunda kullanılıyor`, ayrinti: `${yol} bu sırrı tarayıcıda okumaya çalışıyor. Sunucu sırları yalnız api/ fonksiyonlarında vayra.sir ile okunur.`, ajan: `${yol} dosyası ${m[1]} sunucu sırrını tarayıcıda kullanıyor. Bu işi api/ altında bir sunucu fonksiyonuna taşı, sırrı orada vayra.sir("${m[1]}") ile oku ve sayfadan vayra.fonksiyon ile çağır.` });
      // XSS: kullanıcı verisini innerHTML'e kaçışsız basmak.
      const xss = [...icerik.matchAll(/\.innerHTML\s*\+?=\s*`[^`]*\$\{\s*(?:[a-zA-Z_$][\w$]*\.)*(ad|isim|yorum|mesaj|metin|not|aciklama|baslik|eposta|icerik|text|name|comment|message)\b[^}]*\}/gi)];
      if (xss.length && !/function\s+(kac|kacis|escape|esc|guvenli)\w*\s*\(|\.replace\(\s*\/\[&<>/i.test(icerik)) o.push({ seviye: "uyari", yer: "kod", baslik: `Ziyaretçi verisi HTML olarak basılıyor (${yol})`, ayrinti: "Yorum, ad gibi alanlar innerHTML ile kaçışsız yazılıyor; kötü niyetli biri sayfaya betik sokabilir.", ajan: `${yol} dosyasında ziyaretçiden gelen alanlar (${[...new Set(xss.map((x) => x[1]))].join(", ")}) innerHTML ile kaçışsız basılıyor. Bunları textContent ile ya da bir kaçış fonksiyonundan geçirerek yaz.` });
      if (/\beval\s*\(|new\s+Function\s*\(/.test(icerik)) o.push({ seviye: "uyari", yer: "kod", baslik: `eval ya da new Function kullanılıyor (${yol})`, ayrinti: "Dışarıdan gelen metni kod olarak çalıştırmak güvenlik açığı oluşturur.", ajan: `${yol} dosyasındaki eval ya da new Function kullanımını güvenli bir alternatifle değiştir.` });
    }
    if (yol.startsWith("api/") && /bildirim|webhook|callback|hook|geri-?donus|odeme-sonuc/i.test(yol) && !/hmac|imza|signature|hash|dogrula/i.test(icerik)) o.push({ seviye: "uyari", yer: "fonksiyon", baslik: `${yol} gelen bildirimi doğrulamıyor`, ayrinti: "Ödeme ya da servis bildirimi imzası kontrol edilmezse herkes sahte bildirim gönderebilir.", ajan: `${yol} sunucu fonksiyonu gelen webhook/bildirim isteğinin imzasını doğrulamıyor. Servisin belgesindeki imza yöntemini vayra.hmac ile uygula, imza tutmazsa 401 dön.` });
  }
  for (const s of p.ayarlar.sirlar ?? []) if (s.gorunurluk === "herkese" && /secret|token|sifre|password|private|gizli/i.test(s.ad) && !/public|publishable|site_?key|herkese/i.test(s.ad)) o.push({ duzelt: { tur: "sir", ad: s.ad, etiket: "Sunucu sırrına çevir" }, seviye: "kritik", yer: "ortam", baslik: `"${s.ad}" gizli görünüyor ama herkese açık`, ayrinti: "Bu değer sitenin kaynağında görünür. Gizli anahtarları yalnız sunucu tarafında kullan." });
  for (const a of p.alanAdlari) if (a.durum !== "bagli") o.push({ seviye: a.durum === "sorun" ? "uyari" : "bilgi", yer: "alan", baslik: `${a.ad} henüz bağlı değil`, ayrinti: a.durum === "sorun" ? "DNS kayıtlarında sorun var; Alan adları bölümünde ayrıntıyı gör." : "DNS kayıtları bekleniyor ya da doğrulanıyor." });
  if (p.yayin && p.surumler.at(-1) && p.surumler.at(-1)!.no > p.yayin.surumNo) o.push({ seviye: "bilgi", yer: "yayin", baslik: "Yayınlanmamış değişiklikler var", ayrinti: `Yayındaki sürüm ${p.yayin.surumNo}, son sürüm ${p.surumler.at(-1)!.no}.` });
  const yoksay = new Map((p.ayarlar.guvenlikYoksay ?? []).map((x) => [x.id, x]));
  const tekil = new Map<string, GuvenlikBulgusu>();
  for (const b of o) { const id = bulguId(b.yer, b.baslik); if (!tekil.has(id)) { const y = yoksay.get(id); tekil.set(id, { ...b, id, ...(y ? { yoksayildi: { neden: y.neden, zaman: y.zaman } } : {}) }); } }
  return [...tekil.values()].sort((a, b) => Number(!!a.yoksayildi) - Number(!!b.yoksayildi) || ["kritik", "uyari", "bilgi"].indexOf(a.seviye) - ["kritik", "uyari", "bilgi"].indexOf(b.seviye));
}

/** Proje bulut özeti (liste satırı ve genel bakış kartları). */
export async function bulutOzeti(p: Proje) {
  const [istek, ziy, v, uyeler, dep] = await Promise.all([gunlukOzet(p.id, 7), ziyaretci(p.id, 7), veriOku(p.id), uyeleriListele(p.id).catch(() => []), kullanim(p.id)]);
  return {
    id: p.id, ad: p.ad, tur: p.tur, kapak: p.kapak, altAlan: p.ayarlar.altAlan, yayin: p.yayin, sonSurum: p.surumler.at(-1)?.no ?? 0,
    alanAdlari: p.alanAdlari.map((a) => ({ ad: a.ad, durum: a.durum, birincil: a.birincil })), sifreli: p.ayarlar.gorunurluk === "sifreli",
    istek: istek.istek, hata: istek.hata, ortSure: istek.ortSure, gunler: istek.gunler, ...ziy,
    kayit: Object.values(v.koleksiyonlar).reduce((t, k) => t + k.kayitlar.length, 0), koleksiyon: Object.keys(v.koleksiyonlar).length,
    uye: uyeler.length, depolama: dep.boyut, dosya: dep.dosya, guncelleme: p.guncelleme,
  };
}
export type BulutOzeti = Awaited<ReturnType<typeof bulutOzeti>>;
