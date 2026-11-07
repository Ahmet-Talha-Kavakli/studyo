/**
 * Yetenek kalite puanı: SKILL.md'yi belirtim kurallarına (agentskills.io, Claude ve Codex) ve iyi yazım
 * ölçütlerine göre denetler. Altı boyut 0-3 puan alır; doğrulama kuralları geçer ya da kalır. Modelden bağımsız,
 * saf fonksiyon (istemci ve sunucu ortak). Etki ölçümü (yetenekli ve yeteneksiz karşılaştırma) ayrıca Dene bölümünde.
 */
export type KaliteBoyut = { id: string; ad: string; puan: 0 | 1 | 2 | 3; neden: string; oneri?: string };
export type KaliteKural = { ad: string; gecti: boolean; mesaj: string; seviye: "hata" | "uyari" };
export type KaliteSonucu = { puan: number; boyutlar: KaliteBoyut[]; kurallar: KaliteKural[]; belirtec: { aciklama: number; govde: number } };

const kok = (s: string) => s.toLocaleLowerCase("tr").normalize("NFKD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9ğüşıöç]+/).filter((x) => x.length > 3).map((x) => x.slice(0, 6));
const DURAK = new Set(["icin", "olan", "gibi", "kullan", "ile", "veya", "zaman", "yapar", "eder", "olarak", "kadar", "daha", "bunu", "this", "that", "with", "when", "from", "your"]);
const benzerlik = (a: string, b: string) => { const x = new Set(kok(a).filter((k) => !DURAK.has(k))), y = new Set(kok(b).filter((k) => !DURAK.has(k))); if (!x.size || !y.size) return 0; let n = 0; for (const k of x) if (y.has(k)) n++; return n / Math.min(x.size, y.size); };
/** Kaba belirteç tahmini (Türkçe metinde karakter başına yaklaşık 0,3). */
export const belirtecTahmini = (s: string) => Math.ceil(s.length / 3.4);

export function yetenekKalite(y: { ad: string; aciklama: string; govde: string; dosyalar: { yol: string; icerik: string }[] }, digerleri: { ad: string; aciklama: string }[] = []): KaliteSonucu {
  const a = y.aciklama.trim(), g = y.govde.trim();
  const satir = g.split("\n");
  const basliklar = satir.filter((l) => /^#{1,4}\s/.test(l)).length;
  const adimlar = satir.filter((l) => /^\s*(\d+[.)]|-|\*)\s+\S/.test(l)).length;
  const boyutlar: KaliteBoyut[] = [];
  const b = (id: string, ad: string, puan: number, neden: string, oneri?: string) => boyutlar.push({ id, ad, puan: Math.max(0, Math.min(3, puan)) as KaliteBoyut["puan"], neden, ...(puan < 3 && oneri ? { oneri } : {}) });

  // 1. Açıklama: ne yaptığı ve ne zaman kullanılacağı.
  const ne = a.length >= 40;
  const neZaman = /(kullan|zaman|-?ken\b|-?kan\b|istendiğinde|gerektiğinde|isterse|when|use (it|this)|durumunda|için)/i.test(a);
  b("aciklama", "Açıklama: ne ve ne zaman", (ne ? 1 : 0) + (neZaman ? 1 : 0) + (a.length >= 120 && a.length <= 1024 ? 1 : 0),
    !a ? "Açıklama boş; model yeteneği hiç seçemez." : `${a.length} karakter${neZaman ? ", ne zaman kullanılacağı yazıyor" : ", ne zaman kullanılacağı yazmıyor"}`,
    "Ne yaptığını ve hangi isteklerde kullanılacağını aynı açıklamada anlat: “… hazırlarken kullan.”");
  // 2. Tetik sözcükleri: kullanıcının yazacağı somut sözcükler.
  const sozcuk = new Set(kok(a).filter((k) => !DURAK.has(k))).size;
  b("tetik", "Tetik sözcükleri", sozcuk >= 14 ? 3 : sozcuk >= 9 ? 2 : sozcuk >= 5 ? 1 : 0, `${sozcuk} ayırt edici sözcük`, "Kullanıcıların yazacağı somut sözcükleri ekle (belge türleri, servis adları, eylemler).");
  // 3. Ayırt edicilik: diğer yeteneklerle çakışma riski.
  const enYakin = digerleri.filter((d) => d.ad !== y.ad).map((d) => ({ ad: d.ad, s: benzerlik(a, d.aciklama) })).sort((x, z) => z.s - x.s)[0];
  b("ayirt", "Çakışma riski", !enYakin || enYakin.s < 0.25 ? 3 : enYakin.s < 0.4 ? 2 : enYakin.s < 0.6 ? 1 : 0,
    enYakin ? `En yakın yetenek ${enYakin.ad}, açıklamaların yüzde ${Math.round(enYakin.s * 100)} kadarı ortak` : "Karşılaştırılacak başka yetenek yok",
    enYakin ? `${enYakin.ad} ile sınırı açıkça yaz: hangi isteklerde bu yetenek, hangilerinde o kullanılmalı.` : undefined);
  // 4. Talimat yapısı: başlıklar, adımlar, çıktı biçimi, yasaklar.
  const cikti = /(çıktı|biçim|şablon|format|output)/i.test(g), yasak = /(yapma|kaçın|asla|don't|never|uyarı)/i.test(g);
  b("yapi", "Talimat yapısı", (basliklar >= 2 ? 1 : 0) + (adimlar >= 3 ? 1 : 0) + (cikti && yasak ? 1 : 0), `${basliklar} başlık, ${adimlar} adım${cikti ? ", çıktı biçimi var" : ""}${yasak ? ", yasaklar var" : ""}`,
    "Adımları numaralandır, beklenen çıktı biçimini ve yapılmaması gerekenleri ayrı başlıklarla yaz.");
  // 5. Özlülük: gövde her yüklemede bağlama girer.
  const gb = belirtecTahmini(g);
  b("ozluluk", "Özlülük", satir.length <= 500 && gb <= 5000 ? (gb <= 3000 ? 3 : 2) : gb <= 8000 ? 1 : 0, `${satir.length} satır, yaklaşık ${gb.toLocaleString("tr-TR")} belirteç`,
    "Uzun başvuru bilgisini references/ altına taşı; gövdede yalnız akış ve kurallar kalsın.");
  // 6. Kademeli yükleme: ek dosyalar gövdede anılıyor mu.
  const anilan = y.dosyalar.filter((d) => g.includes(d.yol) || g.includes(d.yol.split("/").pop() ?? d.yol)).length;
  const kd = !y.dosyalar.length ? (gb > 4000 ? 1 : 3) : anilan === y.dosyalar.length ? 3 : anilan ? 2 : 1;
  b("kademe", "Kademeli yükleme", kd, y.dosyalar.length ? `${y.dosyalar.length} ek dosyanın ${anilan} tanesi gövdede anılıyor` : gb > 4000 ? "Uzun gövde, ek dosya yok" : "Ek dosya gerekmiyor",
    y.dosyalar.length ? "Her ek dosyayı gövdede adıyla an ve ne zaman okunacağını yaz; anılmayan dosyayı model bulamaz." : "Uzun başvuru bölümlerini references/ dosyalarına ayır.");

  const kurallar: KaliteKural[] = [];
  const k = (ad: string, gecti: boolean, mesaj: string, seviye: KaliteKural["seviye"] = "hata") => kurallar.push({ ad, gecti, mesaj, seviye });
  k("Ad biçimi", /^[a-z0-9]+(-[a-z0-9]+)*$/.test(y.ad) && y.ad.length <= 64, "Küçük harf, rakam ve tek tire; en çok 64 karakter");
  k("Ayrılmış ad", !/(anthropic|claude)/.test(y.ad), "Ad anthropic ya da claude içeremez (Claude'a yüklenemez)");
  k("Açıklama uzunluğu", a.length > 0 && a.length <= 1024, "Boş olamaz, en çok 1024 karakter");
  k("XML etiketi", !/<[a-z/][^>]*>/i.test(`${y.ad} ${a}`), "Ad ve açıklamada XML etiketi olamaz");
  k("Gövde uzunluğu", satir.length <= 500, "SKILL.md 500 satırı aşmamalı", "uyari");
  k("Dosya derinliği", y.dosyalar.every((d) => d.yol.split("/").length <= 3), "Ek dosyalar en çok iki klasör derinde olmalı", "uyari");
  const py = y.dosyalar.filter((d) => /\.(py|sh)$/i.test(d.yol));
  k("Betik çalışma ortamı", !py.length, py.length ? `${py.map((d) => d.yol).join(", ")} Vayra kum havuzunda çalışmaz; yalnız .js betikleri çalışır` : "Betikler JavaScript", "uyari");
  const toplam = boyutlar.reduce((t, x) => t + x.puan, 0);
  const ceza = kurallar.filter((x) => !x.gecti && x.seviye === "hata").length * 15;
  return { puan: Math.max(0, Math.round((toplam / (boyutlar.length * 3)) * 100) - ceza), boyutlar, kurallar, belirtec: { aciklama: belirtecTahmini(a), govde: gb } };
}
