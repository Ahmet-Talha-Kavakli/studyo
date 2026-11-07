import "server-only";
import { ARAC_KATALOG, type AracIzni } from "./ajanKatalog";
import { ajanGetirOz, surumAyarTamamla, surumAyari, type Ajan, type SurumAyar } from "./ajanDepo";
import { ADIM_TUR, type PAdim, type Prosedur } from "./ajanProsedurTip";
import { baglantiHam } from "./baglantiDepo";
import { modelBul } from "./modeller";
import { yetenekHam } from "./yetenekDepo";

/**
 * Sürüm karşılaştırma: taslak ile yayındaki (ya da herhangi iki) sürüm arasında alan alan fark. Talimat satır satır
 * (LCS) karşılaştırılır; araçlar, bilgi kaynakları, yetenekler, bağlantılar ve ekip eklenen, çıkan ve değişen
 * öğeler olarak döner. Adlar sunucuda çözülür.
 */
export type Satir = { tur: "ayni" | "eklendi" | "silindi"; metin: string };
export type Fark =
  | { alan: string; ad: string; tur: "deger"; eski: string; yeni: string }
  | { alan: "talimat"; ad: string; tur: "metin"; satirlar: Satir[]; eklenen: number; silinen: number }
  | { alan: string; ad: string; tur: "liste"; eklenen: string[]; cikan: string[]; degisen: string[] }
  | ProsedurFarki;

/** Prosedürün adım adım farkı: adımlar kimlikle eşlenir, yeni sıraya göre dizilir; silinenler eski yerinde görünür. */
export type AdimFarki = { id: string; durum: "ayni" | "eklendi" | "silindi" | "degisti"; baslik: string; turAd: string; sira: { eski?: number; yeni?: number }; alanlar: { ad: string; eski: string; yeni: string }[] };
export type ProsedurFarki = { alan: string; ad: string; tur: "prosedur"; durum: "eklendi" | "silindi" | "degisti"; ayarlar: { ad: string; eski: string; yeni: string }[]; adimlar: AdimFarki[] };

const ALAN_AD: Record<string, string> = {
  tur: "Adım türü", baslik: "Başlık", sonraki: "Sonraki adım", metin: "Metin", alanlar: "Toplanan bilgiler", dallar: "Dallar", aksi: "Aksi hâlde", degisken: "Değişken", deger: "Değer",
  yontem: "Yöntem", url: "Adres", govde: "Gövde", basliklar: "Başlıklar", kaydet: "Sonucu sakla", hataGit: "Hata olursa", deneme: "Deneme yanıtı", baglanti: "Bağlantı", arac: "Araç", girdi: "Girdi",
  kim: "Kimden onay", evet: "Evet olursa", hayir: "Hayır olursa", sure: "Bekleme süresi", zamanAsimi: "Zaman aşımında", kanal: "Doğrulama kanalı", talimat: "Talimat", neden: "Devir nedeni", sonuc: "Bitiş sonucu",
};
function adimDegeri(a: PAdim, k: string, ad: (id?: string) => string): string {
  const v = (a as Record<string, unknown>)[k];
  if (v === undefined || v === null || v === "") return "";
  if (k === "tur") return ADIM_TUR[a.tur]?.ad ?? a.tur;
  if (k === "sonraki" || k === "aksi" || k === "hataGit" || k === "evet" || k === "hayir" || k === "zamanAsimi") return ad(String(v));
  if (k === "alanlar") return (a.alanlar ?? []).map((f) => `${f.etiket} (${f.ad}${f.zorunlu ? "" : ", isteğe bağlı"})`).join(", ");
  if (k === "dallar") return (a.dallar ?? []).map((d) => `${d.kosullar.map((c) => `${c.degisken} ${c.op} ${c.deger}`).join(d.hepsi ? " ve " : " ya da ")} ise ${ad(d.git)}`).join("; ");
  if (k === "basliklar") return (a.basliklar ?? []).map((b) => `${b.ad}: ${b.deger}`).join(", ");
  if (k === "sure") return `${v} dakika`;
  return typeof v === "object" ? JSON.stringify(v) : String(v);
}
function prosedurFarki(e: Prosedur | undefined, y: Prosedur | undefined): ProsedurFarki | null {
  const p = (y ?? e)!;
  const durum = !e ? "eklendi" : !y ? "silindi" : "degisti";
  const ayarlar: ProsedurFarki["ayarlar"] = [];
  const evet = (b: boolean) => (b ? "Açık" : "Kapalı");
  if (e && y) {
    const d = (ad: string, a: string, b: string) => { if (a !== b) ayarlar.push({ ad, eski: a, yeni: b }); };
    d("Ad", e.ad, y.ad); d("Ne zaman başlar", e.ne, y.ne); d("Anahtar kelimeler", e.anahtarlar.join(", "), y.anahtarlar.join(", "));
    d("Durum", evet(e.acik), evet(y.acik)); d("Vazgeçme", evet(e.iptal), evet(y.iptal)); d("Araya giren soru", evet(e.gecis), evet(y.gecis));
  }
  const eAd = new Map((e?.adimlar ?? []).map((a, i) => [a.id, a.baslik || `${i + 1}. adım`]));
  const yAd = new Map((y?.adimlar ?? []).map((a, i) => [a.id, a.baslik || `${i + 1}. adım`]));
  const hedefAd = (m: Map<string, string>) => (id?: string) => (!id ? "Alttaki adım" : id === "son" ? "Bitiş" : m.get(id) ?? "Silinmiş adım");
  const eMap = new Map((e?.adimlar ?? []).map((a, i) => [a.id, { a, i }]));
  const yMap = new Map((y?.adimlar ?? []).map((a, i) => [a.id, { a, i }]));
  const adimlar: AdimFarki[] = [];
  const ekle = (id: string) => {
    const x = eMap.get(id), z = yMap.get(id);
    const a = (z?.a ?? x?.a)!;
    const baslik = a.baslik || ADIM_TUR[a.tur]?.ad || "Adım";
    const alanlar: AdimFarki["alanlar"] = [];
    if (x && z) for (const k of Object.keys(ALAN_AD)) { const o = adimDegeri(x.a, k, hedefAd(eAd)), n = adimDegeri(z.a, k, hedefAd(yAd)); if (o !== n) alanlar.push({ ad: ALAN_AD[k], eski: o, yeni: n }); }
    adimlar.push({ id, durum: !x ? "eklendi" : !z ? "silindi" : alanlar.length || x.i !== z.i ? "degisti" : "ayni", baslik, turAd: ADIM_TUR[a.tur]?.ad ?? a.tur, sira: { eski: x ? x.i + 1 : undefined, yeni: z ? z.i + 1 : undefined }, alanlar });
  };
  // Yeni sıra esas; silinen adımlar eski komşusunun ardına yerleşir.
  const eL = e?.adimlar ?? [], yL = y?.adimlar ?? [];
  const yerlesen = new Set<string>();
  for (const a of yL) {
    ekle(a.id); yerlesen.add(a.id);
    const ei = eMap.get(a.id)?.i;
    if (ei === undefined) continue;
    for (let j = ei + 1; j < eL.length && !yMap.has(eL[j].id); j++) { ekle(eL[j].id); yerlesen.add(eL[j].id); }
  }
  for (const a of eL) if (!yerlesen.has(a.id)) ekle(a.id);
  if (durum === "degisti" && !ayarlar.length && adimlar.every((a) => a.durum === "ayni")) return null;
  return { alan: `prosedur:${p.id}`, ad: `Prosedür: ${p.ad}`, tur: "prosedur", durum, ayarlar, adimlar };
}

const IZIN: Record<AracIzni, string> = { "her-zaman": "Açık", sor: "Sor", kapali: "Kapalı" };

export function satirFarki(a: string, b: string): Satir[] {
  const x = a.split("\n"), y = b.split("\n");
  if (x.length * y.length > 2_000_000) return [...x.map((m) => ({ tur: "silindi" as const, metin: m })), ...y.map((m) => ({ tur: "eklendi" as const, metin: m }))];
  const n = x.length, m = y.length;
  const t = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) t[i][j] = x[i] === y[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
  const o: Satir[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (x[i] === y[j]) { o.push({ tur: "ayni", metin: x[i] }); i++; j++; }
    else if (t[i + 1][j] >= t[i][j + 1]) o.push({ tur: "silindi", metin: x[i++] });
    else o.push({ tur: "eklendi", metin: y[j++] });
  }
  while (i < n) o.push({ tur: "silindi", metin: x[i++] });
  while (j < m) o.push({ tur: "eklendi", metin: y[j++] });
  return o;
}

async function adlar(ids: string[], f: (id: string) => Promise<string | undefined>) { return Promise.all(ids.map(async (id) => (await f(id)) ?? "Silinmiş öğe")); }
function kumeFarki(eski: string[], yeni: string[]) { return { eklenen: yeni.filter((x) => !eski.includes(x)), cikan: eski.filter((x) => !yeni.includes(x)) }; }

export async function ayarFarki(e: SurumAyar, y: SurumAyar, sahipOz: string): Promise<Fark[]> {
  const o: Fark[] = [];
  const deger = (alan: string, ad: string, a: string, b: string) => { if (a !== b) o.push({ alan, ad, tur: "deger", eski: a, yeni: b }); };
  deger("ad", "Ad", e.ad, y.ad);
  deger("aciklama", "Açıklama", e.aciklama, y.aciklama);
  if (e.simge !== y.simge) o.push({ alan: "simge", ad: "Simge", tur: "deger", eski: "Önceki simge", yeni: "Yeni simge" });
  if (e.talimat !== y.talimat) {
    const s = satirFarki(e.talimat, y.talimat);
    o.push({ alan: "talimat", ad: "Talimat", tur: "metin", satirlar: s, eklenen: s.filter((x) => x.tur === "eklendi").length, silinen: s.filter((x) => x.tur === "silindi").length });
  }
  deger("model", "Model", modelBul(e.model).ad, modelBul(y.model).ad);
  const EFOR = { low: "Hızlı", medium: "Dengeli", high: "Derin" };
  deger("efor", "Düşünme", EFOR[e.efor], EFOR[y.efor]);
  // Araçlar
  const aracAd = (id: string) => ARAC_KATALOG.find((t) => t.id === id)?.ad ?? id;
  const tum = [...new Set([...Object.keys(e.araclar), ...Object.keys(y.araclar)])];
  const ae: string[] = [], ac: string[] = [], ad: string[] = [];
  for (const id of tum) {
    const a = e.araclar[id] ?? "kapali", b = y.araclar[id] ?? "kapali";
    if (a === b) continue;
    if (a === "kapali") ae.push(`${aracAd(id)} (${IZIN[b]})`); else if (b === "kapali") ac.push(aracAd(id)); else ad.push(`${aracAd(id)}: ${IZIN[a]} yerine ${IZIN[b]}`);
  }
  if (ae.length || ac.length || ad.length) o.push({ alan: "araclar", ad: "Araçlar", tur: "liste", eklenen: ae, cikan: ac, degisen: ad });
  // Bilgi
  const be = new Map(e.bilgi.map((b) => [b.id, b])), by = new Map(y.bilgi.map((b) => [b.id, b]));
  const bEk = y.bilgi.filter((b) => !be.has(b.id)).map((b) => b.ad), bCik = e.bilgi.filter((b) => !by.has(b.id)).map((b) => b.ad);
  const bDeg = y.bilgi.filter((b) => { const x = be.get(b.id); return x && (x.icerik !== b.icerik || (x.ne ?? "") !== (b.ne ?? "")); }).map((b) => { const x = be.get(b.id)!; return `${b.ad}${x.icerik !== b.icerik ? " içeriği" : ""}${(x.ne ?? "") !== (b.ne ?? "") ? `${x.icerik !== b.icerik ? " ve" : ""} kullanım notu` : ""} değişti`; });
  if (bEk.length || bCik.length || bDeg.length) o.push({ alan: "bilgi", ad: "Bilgi", tur: "liste", eklenen: bEk, cikan: bCik, degisen: bDeg });
  // Açılış
  deger("karsilama", "Karşılama", e.karsilama, y.karsilama);
  const ba = kumeFarki(e.baslangiclar, y.baslangiclar);
  if (ba.eklenen.length || ba.cikan.length) o.push({ alan: "baslangiclar", ad: "Başlangıç önerileri", tur: "liste", ...ba, degisen: [] });
  // Yetenekler, bağlantılar, ekip
  const yt = kumeFarki(e.yetenekler, y.yetenekler);
  if (yt.eklenen.length || yt.cikan.length) { const f = async (id: string) => (await yetenekHam(id, sahipOz))?.baslik; o.push({ alan: "yetenekler", ad: "Yetenekler", tur: "liste", eklenen: await adlar(yt.eklenen, f), cikan: await adlar(yt.cikan, f), degisen: [] }); }
  const bg = kumeFarki(e.baglantilar, y.baglantilar);
  if (bg.eklenen.length || bg.cikan.length) { const f = async (id: string) => (await baglantiHam(id, sahipOz))?.ad; o.push({ alan: "baglantilar", ad: "Bağlantılar", tur: "liste", eklenen: await adlar(bg.eklenen, f), cikan: await adlar(bg.cikan, f), degisen: [] }); }
  const ek = kumeFarki(e.ekip, y.ekip);
  if (ek.eklenen.length || ek.cikan.length) { const f = async (id: string) => (await ajanGetirOz(id, sahipOz))?.ad; o.push({ alan: "ekip", ad: "Ekip", tur: "liste", eklenen: await adlar(ek.eklenen, f), cikan: await adlar(ek.cikan, f), degisen: [] }); }
  // Koruma ve devir
  const evet = (b: boolean) => (b ? "Açık" : "Kapalı");
  deger("koruma.kisisel", "Kişisel veri maskeleme", evet(e.koruma.kisisel), evet(y.koruma.kisisel));
  deger("koruma.enjeksiyon", "Enjeksiyon koruması", evet(e.koruma.enjeksiyon), evet(y.koruma.enjeksiyon));
  const yk = kumeFarki(e.koruma.yasakKonular, y.koruma.yasakKonular);
  if (yk.eklenen.length || yk.cikan.length) o.push({ alan: "koruma.yasak", ad: "Yasak konular", tur: "liste", ...yk, degisen: [] });
  deger("koruma.yanit", "Yasak konu yanıtı", e.koruma.yasakYanit, y.koruma.yasakYanit);
  deger("devir.acik", "İnsana devir", evet(e.devir.acik), evet(y.devir.acik));
  deger("devir.kurallar", "Devir kuralları", e.devir.kurallar, y.devir.kurallar);
  deger("devir.mesaj", "Devir mesajı", e.devir.mesaj, y.devir.mesaj);
  // Prosedürler: eklenen, çıkan ve adımları ya da ayarı değişen.
  const pe = new Map((e.prosedurler ?? []).map((p) => [p.id, p])), py = new Map((y.prosedurler ?? []).map((p) => [p.id, p]));
  const sade = (p: { guncelleme?: number }) => JSON.stringify({ ...p, guncelleme: 0 });
  const pEk = [...py.values()].filter((p) => !pe.has(p.id)).map((p) => `${p.ad} (${p.adimlar.length} adım)`), pCik = [...pe.values()].filter((p) => !py.has(p.id)).map((p) => p.ad);
  const pDeg = [...py.values()].filter((p) => pe.has(p.id) && sade(pe.get(p.id)!) !== sade(p)).map((p) => { const x = pe.get(p.id)!; const n = p.adimlar.length - x.adimlar.length; return `${p.ad}: ${n > 0 ? `${n} adım eklendi` : n < 0 ? `${-n} adım çıkarıldı` : x.acik !== p.acik ? (p.acik ? "açıldı" : "kapatıldı") : "adımlar değişti"}`; });
  if (pEk.length || pCik.length || pDeg.length) o.push({ alan: "prosedurler", ad: "Prosedürler", tur: "liste", eklenen: pEk, cikan: pCik, degisen: pDeg });
  // Adım adım görsel fark: her değişen, eklenen ya da çıkan prosedür ayrı kartta.
  for (const pid of new Set([...pe.keys(), ...py.keys()])) { const f = prosedurFarki(pe.get(pid), py.get(pid)); if (f) o.push(f); }
  return o;
}

/** "taslak", "yayin" ya da sürüm numarası. */
export function ayarSec(a: Ajan, k: string): SurumAyar | null {
  if (k === "taslak") return surumAyari(a);
  const no = k === "yayin" ? a.yayin.surum : Number(k);
  const s = a.surumler.find((x) => x.no === no);
  return s ? surumAyarTamamla(s.ayar) : null;
}
