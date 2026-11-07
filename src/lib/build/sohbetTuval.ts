import "server-only";
import { randomBytes } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { sahipOzeti } from "./depo";
import { jsonBul, tekSeferlik } from "./sohbetCagri";
import type { TuvalSonucu, TuvalTip } from "./sohbetTipler";

/**
 * Tuval (ChatGPT Canvas, Gemini Canvas, Claude Docs gibi): sohbetin yanında düzenlenen belge ya da kod. Model
 * tuval_yaz aracıyla açar ve günceller; kullanıcı elle düzenler; seçili parçayı ya da bütün metni yapay zekâyla
 * değiştirtir (uzunluk, okuma düzeyi, ton, son rötuş; kodda yorum, günlük, hata düzeltme, başka dile çevirme);
 * düzeltme önerileri tek tek uygulanır. Her değişiklik sürüm olur (en çok 60), eski sürüm geri yüklenebilir.
 * Dosya: .veri/build/sohbet-tuval/<id>.json
 */
export type TuvalSurum = { no: number; icerik: string; zaman: number; kaynak: "vayra" | "sen"; not?: string };
export type Tuval = { id: string; sohbet: string; baslik: string; tip: TuvalTip; dil?: string; surumler: TuvalSurum[]; olusturma: number; guncelleme: number };
type Kayitli = Tuval & { sahip: string };

const KLASOR = path.join(DEPO_KOK, "build", "sohbet-tuval");
const dosya = (id: string) => path.join(KLASOR, `${id}.json`);
const KIMLIK = /^[A-Za-z0-9_-]{14}$/;
export const tuvalKimligiGecerli = (id: string) => KIMLIK.test(id);
export const TUVAL_SINIRI = 120_000;
const kilitler = new Map<string, Promise<unknown>>();

async function oku(id: string): Promise<Kayitli | null> {
  if (!KIMLIK.test(id)) return null;
  try { return JSON.parse(await readFile(dosya(id), "utf8")) as Kayitli; } catch { return null; }
}
async function yaz(t: Kayitli) { await mkdir(KLASOR, { recursive: true }); await writeFile(dosya(t.id), JSON.stringify(t)); }
const ac = (t: Kayitli): Tuval => { const { sahip: _s, ...x } = t; void _s; return x; };

export async function tuvalGetir(id: string, sahip: string): Promise<Tuval | null> {
  const t = await oku(id);
  return t && t.sahip === sahipOzeti(sahip) ? ac(t) : null;
}
/** Sahip denetimsiz (paylaşılan sohbetin görüntülenmesi ve kopyası için). */
export async function tuvalHam(id: string): Promise<Tuval | null> { const t = await oku(id); return t ? ac(t) : null; }

/** Kilitli değişiklik: f yeni hâli yazar ya da hata metni döndürür. */
export function tuvalDegistir(id: string, sahip: string, f: (t: Tuval) => void | string): Promise<{ tuval: Tuval } | { hata: string } | null> {
  const once = kilitler.get(id) ?? Promise.resolve();
  const is = once.then(async () => {
    const t = await oku(id);
    if (!t || t.sahip !== sahipOzeti(sahip)) return null;
    const h = f(t);
    if (typeof h === "string") return { hata: h };
    t.guncelleme = Date.now();
    t.surumler = t.surumler.slice(-60);
    await yaz(t);
    return { tuval: ac(t) };
  });
  kilitler.set(id, is.catch(() => {}));
  return is;
}

const temizle = (s: string) => s.replace(/\r\n/g, "\n").slice(0, TUVAL_SINIRI);
export const sonIcerik = (t: Pick<Tuval, "surumler">) => t.surumler[t.surumler.length - 1]?.icerik ?? "";
const kelimeSay = (s: string) => (s.match(/[\p{L}\p{N}]+/gu) ?? []).length;

export async function tuvalOlustur(sahip: string, sohbet: string, g: { baslik: string; tip: TuvalTip; dil?: string; icerik: string; not?: string }): Promise<Tuval> {
  const id = randomBytes(11).toString("base64url").slice(0, 14);
  const t: Kayitli = {
    id, sahip: sahipOzeti(sahip), sohbet, baslik: g.baslik.trim().slice(0, 120) || "Adsız tuval", tip: g.tip, ...(g.dil ? { dil: g.dil.slice(0, 30) } : {}),
    surumler: [{ no: 1, icerik: temizle(g.icerik), zaman: Date.now(), kaynak: "vayra", ...(g.not ? { not: g.not.slice(0, 160) } : {}) }], olusturma: Date.now(), guncelleme: Date.now(),
  };
  await yaz(t);
  return ac(t);
}

/** Yeni sürüm ekler. Kullanıcının art arda elle kaydettikleri (3 dakika içinde) tek sürümde birleşir. */
export function surumEkle(id: string, sahip: string, icerik: string, kaynak: "vayra" | "sen", not?: string, ek?: { dil?: string; baslik?: string }) {
  return tuvalDegistir(id, sahip, (t) => {
    const yeni = temizle(icerik);
    const son = t.surumler[t.surumler.length - 1];
    if (ek?.dil) t.dil = ek.dil.slice(0, 30);
    if (ek?.baslik?.trim()) t.baslik = ek.baslik.trim().slice(0, 120);
    if (son && son.icerik === yeni) return;
    if (son && kaynak === "sen" && son.kaynak === "sen" && Date.now() - son.zaman < 180_000 && t.surumler.length > 1) { son.icerik = yeni; son.zaman = Date.now(); return; }
    t.surumler.push({ no: (son?.no ?? 0) + 1, icerik: yeni, zaman: Date.now(), kaynak, ...(not ? { not: not.slice(0, 160) } : {}) });
  });
}

export function tuvalSonucu(t: Tuval): TuvalSonucu {
  const s = sonIcerik(t);
  return { tur: "tuval", id: t.id, baslik: t.baslik, tip: t.tip, ...(t.dil ? { dil: t.dil } : {}), surum: t.surumler[t.surumler.length - 1]?.no ?? 1, onizleme: s.slice(0, 420), kelime: kelimeSay(s) };
}

/** Sohbetin tuvallerinin son hâlleri (modelin her turda görmesi için; kullanıcı elle değiştirmiş olabilir). */
export async function tuvalBolumu(sahip: string, kimlikler: string[] | undefined): Promise<string> {
  if (!kimlikler?.length) return "";
  const l = (await Promise.all(kimlikler.slice(-6).map((k) => tuvalGetir(k, sahip)))).filter((x): x is Tuval => !!x);
  if (!l.length) return "";
  let butce = 40_000;
  const parcalar = [...l].reverse().map((t) => {
    const s = sonIcerik(t);
    const kes = s.length > butce ? `${s.slice(0, Math.max(0, butce))}\n…(kısaltıldı)` : s;
    butce = Math.max(0, butce - kes.length);
    const son = t.surumler[t.surumler.length - 1];
    return `<tuval kimlik="${t.id}" baslik="${t.baslik.replace(/"/g, "'")}" tip="${t.tip}"${t.dil ? ` dil="${t.dil}"` : ""} surum="${son?.no ?? 1}"${son?.kaynak === "sen" ? ' son-degistiren="kullanici"' : ""}>\n${kes}\n</tuval>`;
  });
  return `\n\n<tuvaller>\nBu sohbette açık tuvaller (son hâlleri; kullanıcı elle düzenlemiş olabilir, her zaman bunu esas al):\n${parcalar.reverse().join("\n")}\n</tuvaller>`;
}

/** Paylaşılan sohbetin kopyası: tuvaller yeni sahibe kopyalanır; eski kimlik → yeni kimlik. */
export async function tuvalKopyala(id: string, sahip: string, sohbet: string): Promise<Tuval | null> {
  const t = await tuvalHam(id);
  if (!t) return null;
  const yeni = await tuvalOlustur(sahip, sohbet, { baslik: t.baslik, tip: t.tip, dil: t.dil, icerik: sonIcerik(t) });
  return yeni;
}
export async function tuvalSil(id: string, sahip: string) { const t = await oku(id); if (t && t.sahip === sahipOzeti(sahip)) await rm(dosya(id), { force: true }); }

/* ───────────── Yapay zekâyla düzenleme ───────────── */
export const UZUNLUK = ["", "En kısa: metni yaklaşık üçte birine indir, yalnız ana fikirler kalsın.", "Kısalt: metni yaklaşık üçte ikisine indir.", "", "Uzat: metni yaklaşık bir buçuk katına çıkar; ayrıntı, örnek ve geçiş ekle.", "En uzun: metni yaklaşık iki katına çıkar; her bölümü derinleştir."];
export const OKUMA = ["", "İlkokul düzeyi: çok kısa cümleler, günlük kelimeler, somut örnekler.", "Ortaokul düzeyi: sade dil, kısa cümleler, terimleri açıkla.", "Lise düzeyi: açık ve düzenli bir anlatım.", "Üniversite düzeyi: akademik ama okunur, kavramları doğru kullan.", "Uzman düzeyi: alan terimleri, yoğun ve kesin anlatım."];
export const TONLAR: Record<string, string> = { resmi: "Resmî ve profesyonel bir tona çevir.", gunluk: "Gündelik, rahat bir tona çevir.", samimi: "Sıcak ve samimi bir tona çevir.", ikna: "İkna edici bir tona çevir: güçlü fiiller, net faydalar, harekete çağrı.", akademik: "Akademik bir tona çevir." };
export const DILLER = ["Python", "JavaScript", "TypeScript", "Java", "C#", "Go", "PHP", "Swift", "Kotlin", "Rust", "C++", "Ruby", "SQL"];

/** Kısayol ve parametresinden talimat (sunucuda kurulur; istemci yalnız kimlik yollar). */
export function kisayolTalimati(t: Pick<Tuval, "tip" | "dil">, k: string, p?: string | number): { talimat: string; not: string; dil?: string } | null {
  const n = Number(p);
  if (t.tip === "belge") {
    if (k === "uzunluk" && UZUNLUK[n]) return { talimat: UZUNLUK[n], not: n < 3 ? "Kısaltıldı" : "Uzatıldı" };
    if (k === "okuma" && OKUMA[n]) return { talimat: `Okuma düzeyini değiştir. ${OKUMA[n]}`, not: "Okuma düzeyi değişti" };
    if (k === "ton" && typeof p === "string" && TONLAR[p]) return { talimat: TONLAR[p], not: "Ton değişti" };
    if (k === "rotus") return { talimat: "Son rötuş: yazım ve dil bilgisi hatalarını düzelt, akışı ve tutarlılığı iyileştir, başlık düzenini ve listeleri toparla. Anlamı ve uzunluğu koru.", not: "Son rötuş" };
    if (k === "baslik") return { talimat: "Metni okunur bölümlere ayır: anlamlı başlıklar ve gerektiğinde madde listeleri ekle. İçeriği değiştirme.", not: "Bölümlere ayrıldı" };
  } else {
    if (k === "yorum") return { talimat: "Koda açıklayıcı yorumlar ekle (dilin yorum sözdizimiyle, Türkçe). Kodun davranışını değiştirme.", not: "Yorum eklendi" };
    if (k === "gunluk") return { talimat: "Önemli noktalara hata ayıklama için günlük (log) satırları ekle. Davranışı değiştirme.", not: "Günlük eklendi" };
    if (k === "hata") return { talimat: "Koddaki hataları bul ve düzelt; düzelttiğin yerlere kısa bir yorum koy.", not: "Hatalar düzeltildi" };
    if (k === "sadelestir") return { talimat: "Kodu sadeleştir ve okunurluğunu artır; davranışı aynen koru.", not: "Sadeleştirildi" };
    if (k === "cevir" && typeof p === "string" && p.trim()) return { talimat: `Kodu ${p.trim().slice(0, 30)} diline çevir; aynı davranışı ve yapıyı koru, dilin alışılmış kalıplarını kullan.`, not: `${p.trim().slice(0, 30)} diline çevrildi`, dil: p.trim().slice(0, 30) };
  }
  return null;
}

const SISTEM_TEMEL = "Sen Vayra Tuval düzenleyicisisin. Kullanıcının tuvalindeki metni ya da kodu istenen yönde değiştirirsin. Türkçe metinlerde doğal ve akıcı Türkçe kullan. Emoji kullanma.";
const fencesiz = (s: string) => s.replace(/^\s*```[\w-]*\n([\s\S]*?)\n```\s*$/, "$1").trim();

export type DuzenSonucu = { yeni: string; kredi: number; not: string; dil?: string } | { oneriler: { alinti: string; oneri: string; yeni: string }[]; kredi: number } | { hata: string; durum: number };

/**
 * islem: "secim" (seçili parçayı yeniden yaz), "tum" (bütün metne talimat ya da kısayol), "oneri" (düzeltme önerileri).
 * secim.bas/son verilirse tam o aralık değişir; yoksa secim.metin metinde aranır.
 */
export async function tuvalDuzenle(t: Tuval, g: { islem: "secim" | "tum" | "oneri"; talimat?: string; kisayol?: string; param?: string | number; secim?: { bas?: number; son?: number; metin: string }; model: string }): Promise<DuzenSonucu> {
  const icerik = sonIcerik(t);
  const tur = t.tip === "kod" ? `kod (${t.dil || "dil belirtilmedi"})` : "belge (Markdown)";
  if (g.islem === "oneri") {
    const sistem = `${SISTEM_TEMEL}\nGörevin: ${t.tip === "kod" ? "kodu incele; hata, güvenlik, okunurluk ve performans sorunlarını bul" : "metni oku; anlatım, dil bilgisi, akış ve açıklık sorunlarını bul"}. En fazla 6 öneri ver.\nYalnız şu JSON'u döndür: {"oneriler":[{"alinti":"metinden AYNEN kopyalanmış kısa parça","oneri":"sorun ve neden, tek cümle","yeni":"alıntının yerine gelecek düzeltilmiş hâli"}]}`;
    const r = await tekSeferlik({ model: g.model, sistem, ileti: `Tuval türü: ${tur}\nBaşlık: ${t.baslik}\n\n<tuval>\n${icerik}\n</tuval>`, efor: "medium" });
    if ("hata" in r) return r;
    const j = jsonBul<{ oneriler?: { alinti?: unknown; oneri?: unknown; yeni?: unknown }[] }>(r.metin);
    const l = (j?.oneriler ?? []).map((x) => ({ alinti: String(x.alinti ?? ""), oneri: String(x.oneri ?? "").slice(0, 400), yeni: String(x.yeni ?? "") }))
      .filter((x) => x.alinti && icerik.includes(x.alinti) && x.yeni !== x.alinti).slice(0, 8);
    return { oneriler: l, kredi: r.kredi };
  }
  if (g.islem === "secim") {
    const s = g.secim;
    if (!s?.metin?.trim() || !g.talimat?.trim()) return { hata: "Seçim ve istek gerekli.", durum: 400 };
    const bas = typeof s.bas === "number" && icerik.slice(s.bas, s.son) === s.metin ? s.bas : icerik.indexOf(s.metin);
    if (bas < 0) return { hata: "Seçtiğin parça tuvalde bulunamadı; tuval değişmiş olabilir. Yeniden seç.", durum: 409 };
    const son = bas + s.metin.length;
    const sistem = `${SISTEM_TEMEL}\nGörevin: tuvaldeki SEÇİLİ PARÇAYI kullanıcının isteğine göre yeniden yazmak. Yalnız seçili parçanın yerine gelecek yeni metni döndür; açıklama, tırnak ya da kod çiti ekleme. Çevresiyle uyumlu olsun (biçim, girinti, dil).`;
    const ileti = `Tuval türü: ${tur}\n\n<oncesi>\n${icerik.slice(Math.max(0, bas - 1500), bas)}\n</oncesi>\n<secili>\n${s.metin}\n</secili>\n<sonrasi>\n${icerik.slice(son, son + 1500)}\n</sonrasi>\n\nİstek: ${g.talimat.trim().slice(0, 2000)}`;
    const r = await tekSeferlik({ model: g.model, sistem, ileti, efor: "low" });
    if ("hata" in r) return r;
    const yeniParca = fencesiz(r.metin);
    return { yeni: icerik.slice(0, bas) + yeniParca + icerik.slice(son), kredi: r.kredi, not: `Seçim: ${g.talimat.trim().slice(0, 60)}` };
  }
  const k = g.kisayol ? kisayolTalimati(t, g.kisayol, g.param) : null;
  const talimat = k?.talimat ?? g.talimat?.trim();
  if (!talimat) return { hata: "Ne değişsin? Bir istek yaz.", durum: 400 };
  const sistem = `${SISTEM_TEMEL}\nGörevin: tuvalin TAMAMINI isteğe göre yeniden yazmak. Yalnız tuvalin yeni hâlini döndür; açıklama, giriş cümlesi ya da kod çiti ekleme.${t.tip === "belge" ? " Markdown biçimini koru." : ""}`;
  const r = await tekSeferlik({ model: g.model, sistem, ileti: `Tuval türü: ${tur}\nBaşlık: ${t.baslik}\n\n<tuval>\n${icerik}\n</tuval>\n\nİstek: ${talimat.slice(0, 2000)}`, efor: "medium" });
  if ("hata" in r) return r;
  return { yeni: fencesiz(r.metin), kredi: r.kredi, not: k?.not ?? talimat.slice(0, 60), ...(k?.dil ? { dil: k.dil } : {}) };
}
