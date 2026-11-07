/**
 * Ajan prosedürleri (Intercom Fin Procedures, Decagon AOP karşılığı): ajanın serbest yanıtı yerine adım adım,
 * belirlenmiş sırayla yürüyen iş akışı. İstemci ve sunucunun ortak tipleri, temizleme, alan doğrulama ve şablon
 * doldurma burada; yürütücü sunucuda (ajanProsedur.ts).
 *
 * Adım türleri: mesaj, veri toplama formu, koşul (if/else), değişken atama, HTTP isteği, bağlantı aracı, ziyaretçi ya
 * da temsilci onayı, web kancası bekleme, doğrulama kodu (e-posta ya da SMS), yapay zekâ adımı, insana devir, bitiş.
 * Adımlar listedeki sırayla yürür; "sonraki" boşsa bir alttaki adıma geçer, "son" prosedürü bitirir.
 */
export type PAlanTur = "metin" | "eposta" | "telefon" | "sayi" | "tarih" | "secim" | "evethayir" | "siparis" | "tc" | "iban" | "plaka" | "ozel";
export const ALAN_TUR_AD: Record<PAlanTur, string> = {
  metin: "Serbest metin", eposta: "E-posta", telefon: "Telefon", sayi: "Sayı ya da tutar", tarih: "Tarih", secim: "Seçeneklerden biri", evethayir: "Evet ya da hayır",
  siparis: "Sipariş numarası", tc: "T.C. kimlik numarası", iban: "IBAN", plaka: "Araç plakası", ozel: "Özel desen",
};
export type PAlan = { ad: string; etiket: string; soru: string; tur: PAlanTur; secenekler?: string[]; desen?: string; zorunlu: boolean; gizli?: boolean };

export type PKosulOp = "esit" | "esitDegil" | "icerir" | "buyuk" | "kucuk" | "dolu" | "bos";
export const KOSUL_OP_AD: Record<PKosulOp, string> = { esit: "eşittir", esitDegil: "eşit değildir", icerir: "içerir", buyuk: "büyüktür", kucuk: "küçüktür", dolu: "dolu", bos: "boş" };
export type PKosul = { degisken: string; op: PKosulOp; deger: string };
export type PDal = { kosullar: PKosul[]; hepsi: boolean; git: string };

export type PAdimTur = "mesaj" | "topla" | "kosul" | "ata" | "istek" | "arac" | "onay" | "bekle" | "dogrula" | "ajan" | "devret" | "bitir";
export const ADIM_TUR: Record<PAdimTur, { ad: string; alt: string }> = {
  mesaj: { ad: "Mesaj gönder", alt: "Ziyaretçiye sabit bir metin yazar" },
  topla: { ad: "Bilgi topla", alt: "Form alanlarını sırayla sorar ve doğrular" },
  kosul: { ad: "Koşul", alt: "Değişkenlere göre dallanır" },
  ata: { ad: "Değişken ata", alt: "Bir değeri değişkene yazar" },
  istek: { ad: "HTTP isteği", alt: "Kendi sistemine istek atar, yanıtı saklar" },
  arac: { ad: "Bağlantı aracı", alt: "Bağlı bir servisin aracını çalıştırır" },
  onay: { ad: "Onay", alt: "Ziyaretçiden ya da temsilciden evet ya da hayır alır" },
  bekle: { ad: "Web kancası bekle", alt: "Dış sistem sonucu gönderene kadar bekler" },
  dogrula: { ad: "Kimliği doğrula", alt: "E-posta ya da SMS ile tek kullanımlık kod gönderir" },
  ajan: { ad: "Yapay zekâ adımı", alt: "Ajan bu talimatla serbest bir yanıt yazar" },
  devret: { ad: "İnsana devret", alt: "Konuşmayı gelen kutusuna aktarır" },
  bitir: { ad: "Bitir", alt: "Prosedürü kapatır" },
};
/** Adım: türe göre ilgili alanlar dolu (düz biçim, düzenleyicide kolay). */
export type PAdim = {
  id: string; tur: PAdimTur; baslik?: string;
  /** Sonraki adım: boş bir alttaki, "son" bitiş. */
  sonraki?: string;
  metin?: string;
  alanlar?: PAlan[];
  dallar?: PDal[]; aksi?: string;
  degisken?: string; deger?: string;
  yontem?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; url?: string; govde?: string; basliklar?: { ad: string; deger: string }[];
  /** Sonucun saklanacağı değişken. */
  kaydet?: string;
  /** Hata olursa gidilecek adım (boşsa devam). */
  hataGit?: string;
  /** Prosedür denemesinde gerçek çağrı yerine kullanılacak JSON yanıt. */
  deneme?: string;
  baglanti?: string; arac?: string; girdi?: string;
  kim?: "ziyaretci" | "temsilci"; evet?: string; hayir?: string;
  /** Bekleme süresi (dakika) ve zaman aşımında gidilecek adım. */
  sure?: number; zamanAsimi?: string;
  kanal?: "eposta" | "sms";
  talimat?: string;
  neden?: string;
  sonuc?: "cozuldu" | "serbest";
};
export type Prosedur = {
  id: string; ad: string;
  /** Ne zaman başlar: ajan bu tarife göre prosedur_baslat aracını çağırır. */
  ne: string;
  /** Bu kelimelerden biri geçince yapay zekâya sormadan başlar. */
  anahtarlar: string[];
  acik: boolean;
  adimlar: PAdim[];
  /** Ziyaretçi "vazgeç" diyerek çıkabilir. */
  iptal: boolean;
  /** Araya giren soruyu ajan serbestçe yanıtlar, sonra prosedür kaldığı yerden sürer. */
  gecis: boolean;
  /** Web kancası bekleme adımlarında gelen isteğin imza anahtarı (HMAC-SHA256); boşsa yalnız gizli adres. */
  imza?: string;
  guncelleme: number;
};

/* ───────────── Temizleme ───────────── */
const s = (x: unknown, n: number) => (typeof x === "string" ? x.slice(0, n) : "");
const DEGISKEN = /^[a-zA-Z_][a-zA-Z0-9_]{0,39}$/;
const degiskenAdi = (x: unknown) => { const v = s(x, 40).trim(); return DEGISKEN.test(v) ? v : ""; };
const hedef = (x: unknown) => s(x, 20).trim();
const ADIMLAR = Object.keys(ADIM_TUR) as PAdimTur[];
const ALANLAR = Object.keys(ALAN_TUR_AD) as PAlanTur[];
const OPLAR = Object.keys(KOSUL_OP_AD) as PKosulOp[];
export const yeniPid = () => Math.random().toString(36).slice(2, 10);

export function alanTemizle(x: unknown, i = 0): PAlan {
  const a = (x ?? {}) as Partial<PAlan>;
  const tur = ALANLAR.includes(a.tur as PAlanTur) ? (a.tur as PAlanTur) : "metin";
  return {
    ad: degiskenAdi(a.ad) || `alan_${i + 1}`, etiket: s(a.etiket, 60) || "Bilgi", soru: s(a.soru, 400), tur, zorunlu: a.zorunlu !== false,
    ...(tur === "secim" ? { secenekler: (Array.isArray(a.secenekler) ? a.secenekler : []).map((o) => s(o, 60).trim()).filter(Boolean).slice(0, 12) } : {}),
    ...(tur === "ozel" ? { desen: s(a.desen, 200) } : {}),
    ...(a.gizli || tur === "tc" || tur === "iban" ? { gizli: true } : {}),
  };
}
export function adimTemizle(x: unknown): PAdim | null {
  const a = (x ?? {}) as Partial<PAdim>;
  if (!ADIMLAR.includes(a.tur as PAdimTur)) return null;
  const tur = a.tur as PAdimTur;
  const o: PAdim = { id: /^[A-Za-z0-9_-]{2,20}$/.test(String(a.id ?? "")) ? String(a.id) : yeniPid(), tur, ...(a.baslik ? { baslik: s(a.baslik, 80) } : {}), ...(a.sonraki ? { sonraki: hedef(a.sonraki) } : {}) };
  const metin = (n = 2000) => { if (typeof a.metin === "string") o.metin = a.metin.slice(0, n); };
  if (tur === "mesaj" || tur === "bitir" || tur === "devret" || tur === "bekle" || tur === "onay") metin();
  if (tur === "topla") o.alanlar = (Array.isArray(a.alanlar) ? a.alanlar : []).slice(0, 12).map(alanTemizle);
  if (tur === "kosul") {
    o.dallar = (Array.isArray(a.dallar) ? a.dallar : []).slice(0, 8).map((d) => ({
      kosullar: (Array.isArray(d?.kosullar) ? d.kosullar : []).slice(0, 6).map((k) => ({ degisken: s(k?.degisken, 80).trim(), op: OPLAR.includes(k?.op as PKosulOp) ? (k.op as PKosulOp) : "esit", deger: s(k?.deger, 200) })),
      hepsi: d?.hepsi !== false, git: hedef(d?.git),
    }));
    o.aksi = hedef(a.aksi);
  }
  if (tur === "ata") { o.degisken = degiskenAdi(a.degisken); o.deger = s(a.deger, 1000); }
  if (tur === "istek") {
    o.yontem = (["GET", "POST", "PUT", "PATCH", "DELETE"] as const).includes(a.yontem as "GET") ? a.yontem : "POST";
    o.url = s(a.url, 1000).trim(); o.govde = s(a.govde, 8000);
    o.basliklar = (Array.isArray(a.basliklar) ? a.basliklar : []).slice(0, 10).map((b) => ({ ad: s(b?.ad, 60).replace(/[^A-Za-z0-9-]/g, ""), deger: s(b?.deger, 1000) })).filter((b) => b.ad);
  }
  if (tur === "arac") { o.baglanti = s(a.baglanti, 40); o.arac = s(a.arac, 120); o.girdi = s(a.girdi, 8000); }
  if (tur === "istek" || tur === "arac" || tur === "ajan" || tur === "bekle") o.kaydet = degiskenAdi(a.kaydet);
  if (tur === "istek" || tur === "arac") { o.hataGit = hedef(a.hataGit); o.deneme = s(a.deneme, 8000); }
  if (tur === "onay") { o.kim = a.kim === "temsilci" ? "temsilci" : "ziyaretci"; o.evet = hedef(a.evet); o.hayir = hedef(a.hayir); }
  if (tur === "bekle") { o.sure = Math.max(1, Math.min(10080, Math.round(Number(a.sure) || 60))); o.zamanAsimi = hedef(a.zamanAsimi); }
  if (tur === "dogrula") { o.degisken = degiskenAdi(a.degisken); o.kanal = a.kanal === "sms" ? "sms" : "eposta"; o.evet = hedef(a.evet); o.hayir = hedef(a.hayir); }
  if (tur === "ajan") o.talimat = s(a.talimat, 3000);
  if (tur === "devret") o.neden = s(a.neden, 300);
  if (tur === "bitir") o.sonuc = a.sonuc === "serbest" ? "serbest" : "cozuldu";
  return o;
}
export function prosedurTemizle(x: unknown): Prosedur {
  const p = (x ?? {}) as Partial<Prosedur>;
  return {
    id: /^[A-Za-z0-9_-]{4,20}$/.test(String(p.id ?? "")) ? String(p.id) : yeniPid(), ad: s(p.ad, 80).trim() || "Adsız prosedür", ne: s(p.ne, 600),
    anahtarlar: (Array.isArray(p.anahtarlar) ? p.anahtarlar : []).map((k) => s(k, 60).trim()).filter(Boolean).slice(0, 12),
    acik: p.acik !== false, iptal: p.iptal !== false, gecis: p.gecis !== false, ...(p.imza ? { imza: s(p.imza, 120) } : {}),
    adimlar: (Array.isArray(p.adimlar) ? p.adimlar : []).slice(0, 60).map(adimTemizle).filter((a): a is PAdim => !!a),
    guncelleme: Number(p.guncelleme) || Date.now(),
  };
}
/** Düzenleyicide görünen sorunlar: kopuk hedef, boş adres, eksik değişken. */
export function prosedurSorunlari(p: Prosedur): { adim?: string; metin: string }[] {
  const o: { adim?: string; metin: string }[] = [];
  const idler = new Set(p.adimlar.map((a) => a.id));
  const hedefVar = (h?: string) => !h || h === "son" || idler.has(h);
  if (!p.adimlar.length) o.push({ metin: "Prosedürde hiç adım yok." });
  if (!p.ne.trim() && !p.anahtarlar.length) o.push({ metin: "Ne zaman başlayacağını yaz ya da bir anahtar kelime ekle; yoksa ajan bu prosedürü başlatamaz." });
  for (const a of p.adimlar) {
    const ad = a.baslik || ADIM_TUR[a.tur].ad;
    for (const h of [a.sonraki, a.aksi, a.hataGit, a.evet, a.hayir, a.zamanAsimi, ...(a.dallar ?? []).map((d) => d.git)]) if (!hedefVar(h)) o.push({ adim: a.id, metin: `${ad}: gidilecek adım silinmiş.` });
    if (a.tur === "istek" && !/^https:\/\//.test(a.url ?? "")) o.push({ adim: a.id, metin: `${ad}: adres https:// ile başlamalı.` });
    if (a.tur === "istek" && /^https:\/\/api\.magazan\.com\//.test(a.url ?? "")) o.push({ adim: a.id, metin: `${ad}: hazır prosedürün adresi; canlıda çalışması için kendi sisteminin adresini yaz (denemede deneme yanıtı kullanılır).` });
    if (a.tur === "topla" && !a.alanlar?.length) o.push({ adim: a.id, metin: `${ad}: en az bir alan ekle.` });
    if (a.tur === "arac" && (!a.baglanti || !a.arac)) o.push({ adim: a.id, metin: `${ad}: bağlantı ve araç seç.` });
    if (a.tur === "dogrula" && !a.degisken) o.push({ adim: a.id, metin: `${ad}: doğrulanacak değişkeni seç.` });
    if (a.tur === "ata" && !a.degisken) o.push({ adim: a.id, metin: `${ad}: değişken adı gerekli.` });
    if (a.tur === "kosul" && !a.dallar?.length) o.push({ adim: a.id, metin: `${ad}: en az bir dal ekle.` });
  }
  return o;
}
/** Prosedürde tanımlı değişkenler (alanlar, kaydet, ata) ve hazır kişi değişkenleri. */
export function degiskenler(p: Prosedur): string[] {
  const l = new Set<string>(["kisi.ad", "kisi.eposta", "kisi.telefon", "kanal"]);
  for (const a of p.adimlar) {
    for (const f of a.alanlar ?? []) l.add(f.ad);
    if (a.kaydet) l.add(a.kaydet);
    if (a.tur === "ata" && a.degisken) l.add(a.degisken);
    if (a.tur === "dogrula" && a.degisken) l.add(`${a.degisken}_dogrulandi`);
    if (a.tur === "onay") l.add("onay_notu");
  }
  return [...l];
}

/* ───────────── Değer doğrulama ───────────── */
const kucuk = (x: string) => x.toLocaleLowerCase("tr").trim();
const tcGecerli = (v: string) => { if (!/^[1-9]\d{10}$/.test(v)) return false; const d = v.split("").map(Number); const t1 = (7 * (d[0] + d[2] + d[4] + d[6] + d[8]) - (d[1] + d[3] + d[5] + d[7])) % 10; return ((t1 + 10) % 10) === d[9] && d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10]; };
function ibanGecerli(v: string) {
  if (!/^TR\d{24}$/.test(v)) return false;
  const r = (v.slice(4) + v.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let m = 0; for (const c of r) m = (m * 10 + Number(c)) % 97;
  return m === 1;
}
export function telefonNormal(ham: string): string | null {
  let d = ham.replace(/[^\d+]/g, "");
  if (d.startsWith("00")) d = `+${d.slice(2)}`;
  if (d.startsWith("+")) return /^\+[1-9]\d{7,14}$/.test(d) ? d : null;
  if (/^0?5\d{9}$/.test(d)) return `+90${d.replace(/^0/, "")}`;
  if (/^90\d{10}$/.test(d)) return `+${d}`;
  if (/^0[2-4]\d{9}$/.test(d)) return `+90${d.slice(1)}`;
  return null;
}
const GUNLER = ["pazar", "pazartesi", "salı", "çarşamba", "perşembe", "cuma", "cumartesi"];
function tarihCoz(ham: string, simdi = Date.now()): string | null {
  const t = kucuk(ham);
  const gun = (n: number) => new Date(simdi + 3 * 3600_000 + n * 86_400_000).toISOString().slice(0, 10);
  if (/\bbugün\b/.test(t)) return gun(0);
  if (/\byarın\b/.test(t)) return gun(1);
  if (/\böbür gün\b/.test(t)) return gun(2);
  const gi = GUNLER.findIndex((g) => new RegExp(`(^|\\s)${g}(\\s|$|ye|ya|e|a|i|ı|si|sı)`).test(t));
  if (gi >= 0) { const bugun = new Date(simdi + 3 * 3600_000).getUTCDay(); let f = (gi - bugun + 7) % 7; if (f === 0) f = 7; if (/haftaya/.test(t)) f += f < 7 ? 7 : 0; return gun(f); }
  let m = t.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/);
  if (m) { const y = m[3].length === 2 ? `20${m[3]}` : m[3]; const d = new Date(`${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}T12:00:00Z`); return Number.isNaN(+d) || d.getUTCDate() !== Number(m[1]) ? null : d.toISOString().slice(0, 10); }
  m = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) { const d = new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00Z`); return Number.isNaN(+d) ? null : d.toISOString().slice(0, 10); }
  const AYLAR = ["ocak", "şubat", "mart", "nisan", "mayıs", "haziran", "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık"];
  m = t.match(/\b(\d{1,2})\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)(?:\s+(\d{4}))?/);
  if (m) { const ay = AYLAR.indexOf(m[2]) + 1; const y = m[3] ?? new Date(simdi).getUTCFullYear(); const d = new Date(`${y}-${String(ay).padStart(2, "0")}-${m[1].padStart(2, "0")}T12:00:00Z`); return Number.isNaN(+d) ? null : d.toISOString().slice(0, 10); }
  return null;
}
export const EVET = /^(evet|e|olur|tamam|onaylıyorum|onayla|kabul|kabul ediyorum|tabii|tabi|elbette|isterim|evt|yes|ok)\b/;
export const HAYIR = /^(hayır|hayir|h|yok|istemiyorum|olmaz|vazgeçtim|reddet|no|iptal)\b/;
export type Dogrulama = { ok: true; deger: string } | { ok: false; hata: string };
/** Tek alanın değerini doğrular ve normalleştirir. */
export function alanDogrula(a: PAlan, ham: string): Dogrulama {
  const v = ham.trim();
  if (!v) return { ok: false, hata: `${a.etiket} boş olamaz.` };
  switch (a.tur) {
    case "eposta": { const m = v.match(/[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,24}/i); return m ? { ok: true, deger: m[0].toLowerCase() } : { ok: false, hata: "Bu bir e-posta adresine benzemiyor; ad@alanadi.com biçiminde yaz." }; }
    case "telefon": { const t = telefonNormal(v); return t ? { ok: true, deger: t } : { ok: false, hata: "Telefon numarasını 05xx xxx xx xx ya da ülke koduyla yaz." }; }
    case "sayi": { const m = v.replace(/\s/g, "").match(/-?\d{1,3}(\.\d{3})*(,\d+)?|-?\d+([.,]\d+)?/); if (!m) return { ok: false, hata: "Bir sayı yaz." }; const x = m[0].includes(",") ? m[0].replace(/\./g, "").replace(",", ".") : m[0]; return Number.isFinite(Number(x)) ? { ok: true, deger: String(Number(x)) } : { ok: false, hata: "Bir sayı yaz." }; }
    case "tarih": { const d = tarihCoz(v); return d ? { ok: true, deger: d } : { ok: false, hata: "Tarihi 12.05.2026, yarın ya da cuma gibi yaz." }; }
    case "secim": {
      const l = a.secenekler ?? [];
      const n = Number(v.replace(/[^\d]/g, ""));
      if (/^\d+\.?$/.test(v) && n >= 1 && n <= l.length) return { ok: true, deger: l[n - 1] };
      const k = kucuk(v);
      const b = l.find((o) => kucuk(o) === k) ?? l.find((o) => k.length >= 3 && (kucuk(o).startsWith(k) || k.includes(kucuk(o))));
      return b ? { ok: true, deger: b } : { ok: false, hata: `Şunlardan birini seç: ${l.join(", ")}.` };
    }
    case "evethayir": { const k = kucuk(v); return EVET.test(k) ? { ok: true, deger: "evet" } : HAYIR.test(k) ? { ok: true, deger: "hayır" } : { ok: false, hata: "Evet ya da hayır diye yanıtla." }; }
    case "siparis": { const m = v.toUpperCase().match(/\b(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{3,29}\b/); return m ? { ok: true, deger: m[0] } : { ok: false, hata: "Sipariş numarasını yaz; genelde sipariş e-postasında yer alır." }; }
    case "tc": { const m = v.match(/\b[1-9]\d{10}\b/); return m && tcGecerli(m[0]) ? { ok: true, deger: m[0] } : { ok: false, hata: "Geçerli bir T.C. kimlik numarası değil; 11 haneyi kontrol et." }; }
    case "iban": { const x = v.toUpperCase().replace(/\s/g, ""); const m = x.match(/TR\d{24}/); return m && ibanGecerli(m[0]) ? { ok: true, deger: m[0] } : { ok: false, hata: "Geçerli bir IBAN değil; TR ile başlayan 26 karakteri kontrol et." }; }
    case "plaka": { const x = v.toUpperCase().replace(/\s+/g, " ").trim(); const m = x.match(/\b(0[1-9]|[1-7]\d|8[01])\s?([A-ZÇĞİÖŞÜ]{1,3})\s?(\d{2,4})\b/); return m ? { ok: true, deger: `${m[1]} ${m[2]} ${m[3]}` } : { ok: false, hata: "Plakayı 34 ABC 123 biçiminde yaz." }; }
    case "ozel": {
      try { const r = new RegExp(a.desen || ".+", "u"); return r.test(v) ? { ok: true, deger: v.slice(0, 500) } : { ok: false, hata: `${a.etiket} beklenen biçimde değil.` }; }
      catch { return { ok: true, deger: v.slice(0, 500) }; }
    }
    default: return v.length > 1000 ? { ok: false, hata: "Biraz daha kısa yaz." } : { ok: true, deger: v };
  }
}
/** Serbest metinden başka alanları da yakalar (e-posta, telefon, sipariş, plaka gibi belirgin biçimler). */
export function cokluCikar(alanlar: PAlan[], metin: string): Record<string, string> {
  const o: Record<string, string> = {};
  for (const a of alanlar) {
    if (!["eposta", "telefon", "tc", "iban", "plaka"].includes(a.tur)) continue;
    const r = alanDogrula(a, metin);
    if (r.ok) o[a.ad] = r.deger;
  }
  return o;
}
/** Gizli alanın gösterimi: son dört karakter. */
export const gizle = (v: string) => (v.length <= 4 ? "••••" : `••••${v.slice(-4)}`);

/* ───────────── Şablon ───────────── */
export function yolDeger(v: Record<string, unknown>, yol: string): unknown {
  let x: unknown = v;
  for (const p of yol.split(".")) {
    if (x === null || x === undefined) return undefined;
    if (Array.isArray(x) && /^\d+$/.test(p)) x = x[Number(p)];
    else if (typeof x === "object") x = (x as Record<string, unknown>)[p];
    else return undefined;
  }
  return x;
}
const metinYap = (x: unknown) => (x === undefined || x === null ? "" : typeof x === "object" ? JSON.stringify(x) : String(x));
/** {{degisken}} ve {{yanit.alan.0}} yerlerini doldurur. kip "json": JSON metni içine güvenli; "url": adres bileşeni. */
export function doldur(sablon: string, v: Record<string, unknown>, kip: "duz" | "json" | "url" = "duz"): string {
  return sablon.replace(/\{\{\s*([a-zA-Z_][\w.]{0,80})\s*\}\}/g, (_, yol: string) => {
    const x = metinYap(yolDeger(v, yol));
    return kip === "json" ? JSON.stringify(x).slice(1, -1) : kip === "url" ? encodeURIComponent(x) : x;
  });
}
