import "server-only";
import { projeOkuHam } from "./depo";
import { epostaGonder, epostaKurulu } from "./bulutEposta";
import { gunlukYaz } from "./gunluk";
import { isletmeOku } from "./isletme";
import {
  kimlik, kuponOzeti, metin, nesne, sayi, sayiYaDaBos, mantik, adres, varyantAdi, varyantTemizle, SIPARIS_ASAMALARI, isletmePara, para as paraBicim,
  vergiOrani, kargoUygun, kargoUcretHesapla, kurBul, kurlaCevir,
  type Fatura, type IsletmeVeri, type KargoYontem, type Kupon, type SiparisAsama, type SiparisIsletme, type Varyantlar,
} from "./isletmeTipler";
import { AB_ULKELERI, adresBicimi, dilimTarih, paraGecerli, paraOndalik, postaKoduGecerli, ulkeBul, vergiAdi } from "./bolge";
import {
  OdemeHata, SIPARIS_TABLOSU, URUN_SEMA, kurus, odemeAyarOku, urunTablosuKur, type Kalem, type Siparis,
} from "./odeme";
import type { Proje } from "./tipler";
import { semaTemizle, veriDegistir, veriOku, yeniKayitId, type Kayit, type Sutun, type VeriOrtami } from "./veri";

/**
 * Vayra İşletme mağaza katmanı. Ürünler Vayra Veri'deki ürün tablosunda (Vayra Ödeme'nin okuduğu tablo), siparişler
 * "siparisler" tablosunda durur; bu modül odeme.ts ile veri.ts'i yalnız çağırır. Fiyat, varyant fiyatı, stok, kupon,
 * kargo ve KDV her zaman sunucuda hesaplanır; tarayıcıdan yalnız ürün kimliği, varyant kimliği ve adet gelir.
 *
 * Varyantlı satırın ödeme kalemi kimliği "<ürün>~<varyant>" olur: Vayra Ödeme'nin stok düşümü bu satırı ürün stoğundan
 * düşmez; varyant stoğunu ödeme onayından sonra mutabakat (mutabakat) bir kez düşer ve kupon kullanımını işler.
 */

/** Ürün tablosuna eklenen mağaza sütunları (var olan sütunlara dokunulmaz). */
export const URUN_EK_SEMA: Sutun[] = semaTemizle([
  { ad: "kategori", tur: "metin" },
  { ad: "eskiFiyat", tur: "sayi", aciklama: "İndirim öncesi fiyat (üstü çizili gösterilir)" },
  { ad: "kdv", tur: "sayi", aciklama: "Vergi oranı (yüzde; KDV, VAT, GST ya da satış vergisi); boşsa mağaza varsayılanı, 0 vergisiz" },
  { ad: "sku", tur: "metin", aciklama: "Stok kodu" },
  { ad: "varyantlar", tur: "json", aciklama: "Seçenekler (beden, renk) ve bileşim başına fiyat ve stok" },
  { ad: "gorseller", tur: "json", aciklama: "Ek görsel adresleri" },
  { ad: "agirlik", tur: "sayi", aciklama: "Gram" },
  { ad: "sira", tur: "sayi" },
]) ?? [];

export const urunTablosuAdi = async (id: string) => (await odemeAyarOku(id)).urunTablosu || "urunler";

/** Ürün tablosunu kurar ve mağaza sütunlarını ekler. */
export async function magazaKur(id: string, ortam: VeriOrtami) {
  const tablo = await urunTablosuAdi(id);
  const sonuc = await urunTablosuKur(id, ortam, tablo);
  await veriDegistir(id, (v) => {
    const k = v.koleksiyonlar[tablo];
    if (!k) return;
    const sema = k.sema?.length ? k.sema : [...URUN_SEMA];
    const var_ = new Set(sema.map((s) => s.ad));
    k.sema = [...sema, ...URUN_EK_SEMA.filter((s) => !var_.has(s.ad))];
  }, ortam);
  return { tablo, sonuc };
}

/* ───────── ürünler ───────── */
const fiyatOku = (x: unknown) => (typeof x === "number" ? x : Number(String(x ?? "").replace(/\s|TL|₺|\$|€|£|USD|EUR|GBP/gi, "").replace(",", ".")));
export type Urun = Kayit & { ad: string; fiyat: number; aciklama?: string; gorsel?: string; stok?: number | null; aktif?: boolean; kategori?: string; eskiFiyat?: number | null; kdv?: number | null; sku?: string; varyantlar?: Varyantlar | null; gorseller?: string[]; agirlik?: number | null; sira?: number | null };

export async function urunler(id: string, ortam: VeriOrtami): Promise<{ tablo: string; var: boolean; urunler: Urun[] }> {
  const tablo = await urunTablosuAdi(id);
  const k = (await veriOku(id, ortam)).koleksiyonlar[tablo];
  const l = ((k?.kayitlar ?? []) as Urun[]).slice().sort((a, b) => (Number(a.sira ?? 1e9) - Number(b.sira ?? 1e9)) || b.olusturma - a.olusturma);
  return { tablo, var: !!k, urunler: l };
}

/** Panelden gelen ürünü temizler. Fiyat zorunlu ve sıfırdan büyük; varyant fiyatı boşsa ürün fiyatı geçerli. */
export function urunGirdisi(x: unknown): Omit<Urun, "id" | "olusturma" | "guncelleme"> {
  const g = nesne(x);
  const ad = metin(g.ad, 120);
  if (!ad) throw new OdemeHata("Ürün adı gerekli.");
  const fiyat = sayi(fiyatOku(g.fiyat), 0, 1e7, 0);
  if (!(fiyat > 0)) throw new OdemeHata("Fiyat sıfırdan büyük olmalı.");
  const kdv = sayiYaDaBos(g.kdv, 0, 50);
  const varyantlar = varyantTemizle(g.varyantlar);
  return {
    ad, fiyat: Math.round(fiyat * 100) / 100, aciklama: metin(g.aciklama, 4000, true), gorsel: adres(g.gorsel), stok: varyantlar ? null : sayiYaDaBos(g.stok, 0, 1e6),
    aktif: mantik(g.aktif, true), kategori: metin(g.kategori, 60), eskiFiyat: sayiYaDaBos(g.eskiFiyat, 0, 1e7), kdv: kdv !== null ? Math.round(kdv * 1000) / 1000 : null,
    sku: metin(g.sku, 40), varyantlar, gorseller: (Array.isArray(g.gorseller) ? g.gorseller : []).map((a) => adres(a)).filter(Boolean).slice(0, 12), agirlik: sayiYaDaBos(g.agirlik, 0, 1e6), sira: sayiYaDaBos(g.sira, -1e6, 1e6),
  };
}
export async function urunKaydet(id: string, ortam: VeriOrtami, urunId: string | null, girdi: unknown): Promise<Urun> {
  const temiz = urunGirdisi(girdi);
  const { tablo } = await magazaKur(id, ortam);
  return veriDegistir(id, (v) => {
    const k = v.koleksiyonlar[tablo];
    if (!k) throw new OdemeHata("Ürün tablosu kurulamadı.", 500);
    const z = Date.now();
    if (urunId) {
      const r = k.kayitlar.find((x) => x.id === urunId);
      if (!r) throw new OdemeHata("Ürün bulunamadı.", 404);
      Object.assign(r, temiz, { guncelleme: z });
      return JSON.parse(JSON.stringify(r)) as Urun;
    }
    if (k.kayitlar.length >= 5000) throw new OdemeHata("Ürün sınırına ulaşıldı (5000).", 507);
    const y = { id: yeniKayitId(), olusturma: z, guncelleme: z, ...temiz } as Urun;
    k.kayitlar.push(y);
    return y;
  }, ortam);
}
export async function urunSil(id: string, ortam: VeriOrtami, urunId: string) {
  const tablo = await urunTablosuAdi(id);
  return veriDegistir(id, (v) => { const k = v.koleksiyonlar[tablo]; if (!k) return false; const n = k.kayitlar.length; k.kayitlar = k.kayitlar.filter((x) => x.id !== urunId); return k.kayitlar.length < n; }, ortam);
}
/** Toplu stok ve fiyat güncellemesi: [{ id, varyant?, stok?, fiyat?, aktif? }]. */
export async function stokGuncelle(id: string, ortam: VeriOrtami, l: unknown): Promise<number> {
  const tablo = await urunTablosuAdi(id);
  const satirlar = (Array.isArray(l) ? l : []).slice(0, 500).map((x) => nesne(x));
  return veriDegistir(id, (v) => {
    const k = v.koleksiyonlar[tablo];
    if (!k) return 0;
    let n = 0;
    for (const s of satirlar) {
      const r = k.kayitlar.find((x) => x.id === s.id) as Urun | undefined;
      if (!r) continue;
      const hedef = s.varyant && r.varyantlar ? r.varyantlar.liste.find((x) => x.id === s.varyant) : null;
      if (s.varyant && !hedef) continue;
      const o = (hedef ?? r) as { stok?: number | null; fiyat?: number | null; aktif?: boolean };
      if ("stok" in s) o.stok = sayiYaDaBos(s.stok, 0, 1e6);
      if ("fiyat" in s) { const f = sayiYaDaBos(fiyatOku(s.fiyat), 0, 1e7); if (hedef) o.fiyat = f; else if (f && f > 0) o.fiyat = f; }
      if ("aktif" in s) o.aktif = mantik(s.aktif, true);
      r.guncelleme = Date.now(); n++;
    }
    return n;
  }, ortam);
}

/** Sitenin gördüğü ürün: stok sayısı yerine stokta/az kaldı, varyantların geçerli fiyatı. */
export function urunGenel(r: Urun, dusukStok: number) {
  const vl = r.varyantlar?.liste ?? [];
  const varyantlar = r.varyantlar ? {
    secenekler: r.varyantlar.secenekler,
    liste: vl.map((v) => ({ id: v.id, ad: varyantAdi(v), degerler: v.degerler, fiyat: v.fiyat ?? fiyatOku(r.fiyat), stokta: v.aktif !== false && (typeof v.stok !== "number" || v.stok > 0), azKaldi: typeof v.stok === "number" && v.stok > 0 && v.stok <= dusukStok ? v.stok : null })),
  } : null;
  const stokta = r.aktif !== false && (varyantlar ? varyantlar.liste.some((v) => v.stokta) : typeof r.stok !== "number" || r.stok > 0);
  const fiyatlar = varyantlar?.liste.map((v) => v.fiyat) ?? [];
  return {
    id: r.id, ad: r.ad, fiyat: fiyatOku(r.fiyat), enDusukFiyat: fiyatlar.length ? Math.min(...fiyatlar) : fiyatOku(r.fiyat), eskiFiyat: r.eskiFiyat ?? null, aciklama: r.aciklama ?? "",
    gorsel: r.gorsel ?? "", gorseller: Array.isArray(r.gorseller) ? r.gorseller : [], kategori: r.kategori ?? "", sku: r.sku ?? "", stokta,
    azKaldi: !varyantlar && typeof r.stok === "number" && r.stok > 0 && r.stok <= dusukStok ? r.stok : null, varyantlar,
  };
}

/* ───────── sepet hesabı ───────── */
export type SepetSatiri = { urunId: string; varyantId: string | null; ad: string; varyant: string; gorsel: string; kategori: string; birim: number; indirimliBirim: number; adet: number; tutar: number; kdvOrani: number; agirlik: number };
export type SepetSonucu = {
  /** Sepetin para birimi (ana birim ya da alıcının seçtiği ek birim) ve teslimat ülkesi. */
  paraBirimi: string; ulke: string; bolge: string;
  satirlar: SepetSatiri[]; araToplam: number; indirim: number; kargoUcreti: number; toplam: number; kdv: { oran: number; tutar: number }[];
  /** Vergi özeti: dahil ise toplamın içindedir; hariç ise toplama eklenmiştir. tersIbraz: AB içi kurumsal satışta vergi alıcıya geçer. */
  vergi: { ad: string; dahil: boolean; toplam: number; tersIbraz: boolean; not: string };
  kargo: { secenekler: { id: string; ad: string; firma: string; ucret: number; ucretsizEsik: number | null; sure: string; ucretsiz: boolean }[]; secili: string | null; ucretsizIcinKalan: number | null };
  kupon: { kod: string; gecerli: boolean; mesaj: string; tur?: Kupon["tur"] } | null;
  odemeKalemleri: Kalem[];
};

const yerelBugun = (v: IsletmeVeri) => dilimTarih(Date.now(), v.profil.saatDilimi || "UTC");
/** Kupon kullanım sayısı: Canlı'daki ödenmiş siparişler (test siparişleri sayılmaz). */
async function kuponKullanimi(id: string, kod: string, eposta?: string): Promise<{ toplam: number; kisi: number }> {
  const l = ((await veriOku(id, "canli")).koleksiyonlar[SIPARIS_TABLOSU]?.kayitlar ?? []) as (Siparis & { isletme?: SiparisIsletme })[];
  const kullanan = l.filter((s) => (s.durum === "odendi" || s.durum === "iade") && s.isletme?.kupon?.kod === kod);
  return { toplam: kullanan.length, kisi: eposta ? kullanan.filter((s) => s.eposta === eposta.toLowerCase()).length : 0 };
}
/** araToplamKurus mağazanın ana para biriminde; cev ek para birimindeki tutara çevirir (mesajlar için). */
export async function kuponDenetle(id: string, v: IsletmeVeri, kod: string, araToplamKurus: number, eposta?: string, yaz: (n: number) => string = isletmePara(v)): Promise<{ kupon: Kupon | null; mesaj: string }> {
  const k = v.kuponlar.find((x) => x.kod === kod.toUpperCase().trim());
  if (!k || !k.aktif) return { kupon: null, mesaj: "Bu kupon kodu geçerli değil." };
  const bugun = yerelBugun(v);
  if (k.baslangic && bugun < k.baslangic) return { kupon: null, mesaj: "Bu kupon henüz başlamadı." };
  if (k.bitis && bugun > k.bitis) return { kupon: null, mesaj: "Bu kuponun süresi doldu." };
  if (k.minSepet && araToplamKurus < kurus(k.minSepet)) return { kupon: null, mesaj: `Bu kupon en az ${isletmePara(v)(k.minSepet)} sepette geçerli.` };
  if (k.sinir || k.kisiBasi) {
    const u = await kuponKullanimi(id, k.kod, eposta);
    if (k.sinir && u.toplam >= k.sinir) return { kupon: null, mesaj: "Bu kuponun kullanım hakkı doldu." };
    if (k.kisiBasi && eposta && u.kisi >= k.kisiBasi) return { kupon: null, mesaj: "Bu kuponu daha önce kullandın." };
  }
  return { kupon: k, mesaj: kuponOzeti(k, yaz) };
}

/**
 * Sepeti sunucuda hesaplar: [{ id, varyant?, adet }] + kupon + kargo yöntemi + teslimat ülkesi/bölgesi + para birimi.
 * Fiyatlar mağazanın ana para biriminde girilir; alıcı ek para birimi seçtiyse birim fiyatlar kurla çevrilip yuvarlanır ve
 * bütün hesap o birimde yapılır. Vergi teslimat adresine göre: dahil düzende toplamın içinden ayrılır, hariç düzende eklenir.
 * İndirim satırlara oranla dağıtılır (ödeme kalemlerinin toplamı tam tutara eşit olsun diye birim fiyat yuvarlanır).
 */
export async function sepetHesapla(id: string, ortam: VeriOrtami, girdi: { sepet: unknown; kupon?: unknown; kargo?: unknown; eposta?: unknown; ulke?: unknown; bolge?: unknown; para?: unknown; vergiKimligi?: unknown }, v?: IsletmeVeri): Promise<SepetSonucu> {
  const isl = v ?? (await isletmeOku(id));
  const m = isl.magaza, magazaUlke = isl.profil.ulkeKodu;
  const istek = Array.isArray(girdi.sepet) ? girdi.sepet : [];
  if (!istek.length) throw new OdemeHata("Sepet boş.");
  if (istek.length > 50) throw new OdemeHata("Sepette en çok 50 satır olabilir.");
  const ulke = typeof girdi.ulke === "string" && ulkeBul(girdi.ulke) ? girdi.ulke.toUpperCase() : magazaUlke;
  const bolge = typeof girdi.bolge === "string" ? metin(girdi.bolge, 8).toUpperCase() : "";
  if (ulke && m.satisUlkeleri.length && !m.satisUlkeleri.includes(ulke)) throw new OdemeHata(`Bu mağaza ${ulkeBul(ulke)?.ad ?? ulke} adresine satış yapmıyor.`, 409);
  // Para birimi: ana birim ya da kuru bilinen ek birim.
  const istenenPara = typeof girdi.para === "string" && paraGecerli(girdi.para) ? girdi.para : m.paraBirimi;
  const kur = kurBul(m, istenenPara);
  const paraBirimi = kur ? istenenPara : m.paraBirimi;
  const ek = m.ekParaBirimleri.find((e) => e.kod === paraBirimi);
  const ond = paraOndalik(paraBirimi);
  /** Ana birimdeki tutarı sepet birimine çevirir (ana birimde yalnız ondalığa yuvarlar). */
  const cev = (n: number) => (paraBirimi === m.paraBirimi || !kur ? Math.round(n * 10 ** ond) / 10 ** ond : kurlaCevir(n, kur, ek?.yuvarlama ?? "yok", ond));
  /** Kargo ücreti ve eşikler yuvarlama kuralı uygulanmadan çevrilir (yuvarlama yalnız ürün fiyatı içindir). */
  const cevDuz = (n: number) => (paraBirimi === m.paraBirimi || !kur ? Math.round(n * 10 ** ond) / 10 ** ond : kurlaCevir(n, kur, "yok", ond));
  const yaz = (n: number) => paraBicim(n, paraBirimi, isl.profil.yerel || "tr-TR");
  const { urunler: l } = await urunler(id, ortam);
  const harita = new Map(l.map((r) => [r.id, r]));
  const birlesik = new Map<string, { urunId: string; varyantId: string | null; adet: number }>();
  for (const x of istek) {
    const o = nesne(x);
    const urunId = String(o.id ?? "").trim(), varyantId = o.varyant ? String(o.varyant).trim() : null;
    const adet = o.adet === undefined ? 1 : Number(o.adet);
    if (!urunId || urunId.length > 64 || (varyantId && varyantId.length > 64)) throw new OdemeHata("Ürün kimliği geçersiz.");
    if (!Number.isInteger(adet) || adet < 1 || adet > 100) throw new OdemeHata("Adet 1 ile 100 arasında tam sayı olmalı.");
    const anahtar = `${urunId}~${varyantId ?? ""}`;
    const e = birlesik.get(anahtar);
    if (e) e.adet += adet; else birlesik.set(anahtar, { urunId, varyantId, adet });
  }
  // Ters ibraz: AB'deki satıcıdan başka bir AB ülkesindeki kurumsal alıcıya (geçerli biçimde VAT numarasıyla) KDV'siz satış.
  const vkn = typeof girdi.vergiKimligi === "string" ? girdi.vergiKimligi.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
  const tersIbraz = m.vergi.model === "vat" && m.vergi.vergiKimligiIste && AB_ULKELERI.includes(magazaUlke) && AB_ULKELERI.includes(ulke) && ulke !== magazaUlke && /^[A-Z]{2}[A-Z0-9]{8,12}$/.test(vkn);
  const satirlar: SepetSatiri[] = [];
  let vergiAdiOzel = "";
  for (const { urunId, varyantId, adet } of birlesik.values()) {
    const r = harita.get(urunId);
    if (!r) throw new OdemeHata(`Ürün bulunamadı (${urunId}).`);
    const ad = String(r.ad ?? "Ürün").slice(0, 100);
    if (r.aktif === false || (r as Record<string, unknown>).stokta === false) throw new OdemeHata(`"${ad}" şu an satışta değil.`);
    let birim = fiyatOku(r.fiyat), stok = typeof r.stok === "number" ? r.stok : null, varyant = "";
    if (r.varyantlar?.liste?.length) {
      if (!varyantId) throw new OdemeHata(`"${ad}" için ${r.varyantlar.secenekler.map((s) => s.ad.toLocaleLowerCase("tr")).join(" ve ")} seç.`);
      const vy = r.varyantlar.liste.find((x) => x.id === varyantId);
      if (!vy || vy.aktif === false) throw new OdemeHata(`"${ad}" için seçilen seçenek satışta değil.`);
      if (typeof vy.fiyat === "number") birim = vy.fiyat;
      stok = typeof vy.stok === "number" ? vy.stok : null;
      varyant = varyantAdi(vy);
    } else if (varyantId) throw new OdemeHata(`"${ad}" ürününün seçeneği yok.`);
    if (!Number.isFinite(birim) || birim <= 0) throw new OdemeHata(`"${ad}" için geçerli bir fiyat yok.`);
    const ayni = satirlar.filter((s) => s.urunId === urunId && s.varyantId === varyantId).reduce((t, s) => t + s.adet, 0);
    if (stok !== null && adet + ayni > stok) throw new OdemeHata(stok > 0 ? `"${ad}${varyant ? ` (${varyant})` : ""}" için stokta ${stok} adet var.` : `"${ad}${varyant ? ` (${varyant})` : ""}" tükendi.`);
    const b = kurus(cev(birim));
    const vo = tersIbraz ? { oran: 0, ad: "" } : vergiOrani(m.vergi, magazaUlke, ulke, bolge, typeof r.kdv === "number" ? r.kdv : null);
    if (vo.ad) vergiAdiOzel = vo.ad;
    satirlar.push({ urunId, varyantId, ad, varyant, gorsel: String(r.gorsel ?? ""), kategori: String(r.kategori ?? ""), birim: b, indirimliBirim: b, adet, tutar: b * adet, kdvOrani: vo.oran, agirlik: (typeof r.agirlik === "number" ? r.agirlik : 0) * adet });
  }
  // Dahil düzende ters ibrazlı satışta fiyatın içindeki KDV düşülür (alıcı net fiyat öder).
  if (tersIbraz && m.vergi.dahil) {
    const evOran = m.vergi.varsayilanOran;
    for (const s of satirlar) { const orijinal = harita.get(s.urunId); const o = typeof orijinal?.kdv === "number" ? orijinal.kdv : evOran; s.birim = Math.round(s.birim / (1 + o / 100)); s.indirimliBirim = s.birim; s.tutar = s.birim * s.adet; }
  }
  const araToplam = satirlar.reduce((t, s) => t + s.birim * s.adet, 0);
  const eposta = typeof girdi.eposta === "string" ? girdi.eposta : undefined;

  // Kupon: yüzde ya da tutar indirimi uygun satırlara dağıtılır; kargo kuponu kargoyu sıfırlar. En az sepet ana birimde denetlenir.
  let kuponSonuc: SepetSonucu["kupon"] = null, kargoBedava = false;
  const kod = typeof girdi.kupon === "string" ? girdi.kupon.trim().toUpperCase().slice(0, 30) : "";
  if (kod) {
    const anaAraToplam = kur && kur !== 1 ? Math.round(araToplam / kur) : araToplam;
    const d = await kuponDenetle(id, isl, kod, anaAraToplam, eposta, yaz);
    if (!d.kupon) kuponSonuc = { kod, gecerli: false, mesaj: d.mesaj };
    else {
      const k = d.kupon;
      const uygun = satirlar.filter((s) => !k.kategoriler.length || k.kategoriler.includes(s.kategori));
      if (!uygun.length) kuponSonuc = { kod, gecerli: false, mesaj: `Bu kupon yalnız ${k.kategoriler.join(", ")} ürünlerinde geçerli.`, tur: k.tur };
      else {
        if (k.tur === "kargo") kargoBedava = true;
        else {
          const uygunToplam = uygun.reduce((t, s) => t + s.birim * s.adet, 0);
          const hedef = k.tur === "yuzde" ? Math.round((uygunToplam * Math.min(90, k.deger)) / 100) : Math.min(kurus(cevDuz(k.deger)), uygunToplam - uygun.length);
          const oranK = 1 - hedef / uygunToplam;
          const adim = 10 ** (2 - Math.min(2, ond)); // JPY gibi ondalıksız birimde birim fiyat tam sayı kalır
          for (const s of uygun) { s.indirimliBirim = Math.max(adim, Math.round((s.birim * oranK) / adim) * adim); s.tutar = s.indirimliBirim * s.adet; }
        }
        kuponSonuc = { kod: k.kod, gecerli: true, mesaj: kuponOzeti(k, yaz), tur: k.tur };
      }
    }
  }
  const indirimli = satirlar.reduce((t, s) => t + s.tutar, 0);
  const indirim = araToplam - indirimli;
  const agirlik = satirlar.reduce((t, s) => t + s.agirlik, 0);

  // Kargo: teslimat ülkesi ve bölgesine gönderen etkin yöntemler; ücret sabit ya da ağırlığa göre; ücretsiz eşik indirimli tutara göre.
  const yontemler = m.kargo.filter((y) => y.aktif && kargoUygun(y, ulke, bolge));
  if (m.kargo.some((y) => y.aktif) && !yontemler.length) throw new OdemeHata(`${ulkeBul(ulke)?.ad ?? "Bu adres"} için kargo yöntemi yok.`, 409);
  const secenekler = yontemler.map((y: KargoYontem) => {
    const esik = y.ucretsizEsik !== null ? kurus(cevDuz(y.ucretsizEsik)) : null;
    const ucret = cevDuz(kargoUcretHesapla(y, agirlik));
    const ucretsiz = kargoBedava || (esik !== null && indirimli >= esik) || ucret <= 0;
    return { id: y.id, ad: y.ad, firma: y.firma, ucret: ucretsiz ? 0 : ucret, ucretsizEsik: y.ucretsizEsik !== null ? cevDuz(y.ucretsizEsik) : null, sure: y.sure, ucretsiz };
  });
  const istenen = typeof girdi.kargo === "string" ? girdi.kargo : "";
  const secili = secenekler.find((s) => s.id === istenen) ?? secenekler[0] ?? null;
  const kargoUcreti = secili ? kurus(secili.ucret) : 0;
  const esikli = secili?.ucretsizEsik ?? null;
  const ucretsizIcinKalan = secili && !secili.ucretsiz && esikli !== null ? Math.max(0, kurus(esikli) - indirimli) / 100 : null;

  // Vergi: dahil düzende toplamın içinden ayrılır; hariç düzende her satıra ve (istenirse) kargoya eklenir.
  const dahil = m.vergi.dahil, kargoOran = m.vergi.kargoVergili && !tersIbraz ? vergiOrani(m.vergi, magazaUlke, ulke, bolge, null).oran : 0;
  const yuvarla = (x: number) => { const adim = 10 ** (2 - Math.min(2, ond)); return Math.round(x / adim) * adim; };
  const kdvHarita = new Map<number, number>();
  for (const s of satirlar) if (s.kdvOrani > 0) kdvHarita.set(s.kdvOrani, (kdvHarita.get(s.kdvOrani) ?? 0) + (dahil ? s.tutar - s.tutar / (1 + s.kdvOrani / 100) : (s.tutar * s.kdvOrani) / 100));
  if (kargoUcreti && kargoOran > 0) kdvHarita.set(kargoOran, (kdvHarita.get(kargoOran) ?? 0) + (dahil ? kargoUcreti - kargoUcreti / (1 + kargoOran / 100) : (kargoUcreti * kargoOran) / 100));
  const kdvListe = [...kdvHarita.entries()].sort((a, b) => a[0] - b[0]).map(([oran, t]) => ({ oran, tutar: yuvarla(t) }));
  const vergiToplam = kdvListe.reduce((t, x) => t + x.tutar, 0);
  const kdv = kdvListe.map((x) => ({ oran: x.oran, tutar: x.tutar / 100 }));

  const odemeKalemleri: Kalem[] = satirlar.map((s) => ({
    id: s.varyantId ? `${s.urunId}~${s.varyantId}` : s.urunId, ad: (s.varyant ? `${s.ad} (${s.varyant})` : s.ad).slice(0, 100), ...(s.kategori ? { kategori: s.kategori.slice(0, 60) } : {}),
    fiyat: s.indirimliBirim / 100, adet: s.adet, tutar: s.tutar / 100,
  }));
  if (secili && kargoUcreti > 0) odemeKalemleri.push({ id: `kargo-${secili.id}`.slice(0, 64), ad: `Kargo: ${secili.ad}`.slice(0, 100), kategori: "Kargo", fiyat: kargoUcreti / 100, adet: 1, tutar: kargoUcreti / 100 });
  const vAd = vergiAdiOzel || vergiAdi(m.vergi.model);
  if (!dahil && vergiToplam > 0) odemeKalemleri.push({ id: "vergi", ad: vAd, kategori: "Vergi", fiyat: vergiToplam / 100, adet: 1, tutar: vergiToplam / 100 });
  const toplam = indirimli + kargoUcreti + (dahil ? 0 : vergiToplam);
  const not = tersIbraz ? `KDV ters ibraz: alıcı ${vkn} numarasıyla KDV'yi kendi ülkesinde beyan eder (AB KDV Direktifi madde 196).` : ulke && ulke !== magazaUlke && m.vergi.ihracatVergisiz && !m.vergi.kurallar.some((k) => k.ulke === ulke) && m.vergi.model !== "yok" ? "Yurt dışı satış: vergi eklenmedi; gümrük vergisi ve ithalat KDV'si alıcıya ait olabilir." : "";
  return {
    paraBirimi, ulke, bolge,
    satirlar: satirlar.map((s) => ({ ...s, birim: s.birim / 100, indirimliBirim: s.indirimliBirim / 100, tutar: s.tutar / 100 })),
    araToplam: araToplam / 100, indirim: indirim / 100, kargoUcreti: kargoUcreti / 100, toplam: toplam / 100, kdv,
    vergi: { ad: m.vergi.model === "yok" ? "" : vAd, dahil, toplam: vergiToplam / 100, tersIbraz, not },
    kargo: { secenekler, secili: secili?.id ?? null, ucretsizIcinKalan }, kupon: kuponSonuc, odemeKalemleri,
  };
}

/** Kurumsal fatura: Türkiye'de vergi dairesi ve VKN/TCKN; diğer ülkelerde vergi kimliği (VAT, EIN, ABN, GSTIN) isteğe bağlı. */
export function faturaTemizle(x: unknown, ulke = "TR"): Fatura | null {
  const g = nesne(x);
  if (!Object.keys(g).length) return null;
  const tur = g.tur === "kurumsal" ? "kurumsal" : "bireysel";
  const tr = ulke === "TR";
  const f: Fatura = { tur, unvan: metin(g.unvan, 160), vergiDairesi: tr ? metin(g.vergiDairesi, 80) : "", vergiNo: tr ? metin(g.vergiNo, 11).replace(/\D/g, "") : metin(g.vergiNo, 24).toUpperCase().replace(/[^A-Z0-9-]/g, ""), adres: metin(g.adres, 300), ulke };
  if (tur === "kurumsal") {
    if (!f.unvan) throw new OdemeHata("Kurumsal faturada şirket adı gerekli.");
    if (tr) {
      if (!f.vergiDairesi) throw new OdemeHata("Kurumsal faturada vergi dairesi gerekli.");
      if (!/^\d{10,11}$/.test(f.vergiNo)) throw new OdemeHata("Vergi numarası 10, TC kimlik numarası 11 haneli olmalı.");
    } else if (AB_ULKELERI.includes(ulke) && f.vergiNo && !/^[A-Z]{2}[A-Z0-9]{8,12}$/.test(f.vergiNo.replace(/-/g, ""))) throw new OdemeHata("AB VAT numarası ülke koduyla başlar (örneğin DE123456789).");
  }
  return f;
}
/** Teslimat adresi ülkenin biçimine uyuyor mu (eyalet, posta kodu). */
export function adresDenetle(a: { ulke?: string; bolge?: string; postaKodu?: string; adres: string; sehir: string }) {
  const u = a.ulke ?? "";
  const b = adresBicimi(u);
  if (a.adres.length < 5) throw new OdemeHata("Teslimat adresi gerekli.");
  if (!a.sehir) throw new OdemeHata(`${b.ilEtiket === "İlçe" ? "İl ve ilçe" : "Şehir"} gerekli.`);
  if (b.bolge === "zorunlu" && !a.bolge) throw new OdemeHata(`${b.bolgeEtiket} gerekli.`);
  if (b.secenekler && a.bolge && !b.secenekler.some((x) => x.kod === a.bolge!.toUpperCase())) throw new OdemeHata(`${b.bolgeEtiket} geçersiz.`);
  if (b.posta === "zorunlu" && !a.postaKodu) throw new OdemeHata(`${b.postaEtiket} gerekli.`);
  if (a.postaKodu && !postaKoduGecerli(u, a.postaKodu)) throw new OdemeHata(`${b.postaEtiket} biçimi geçersiz.`);
}

/* ───────── siparişler ───────── */
export type IsletmeSiparis = Siparis & { isletme?: SiparisIsletme };
export async function siparisler(id: string, ortam: VeriOrtami): Promise<IsletmeSiparis[]> {
  return (((await veriOku(id, ortam)).koleksiyonlar[SIPARIS_TABLOSU]?.kayitlar ?? []) as IsletmeSiparis[]).slice().sort((a, b) => b.olusturma - a.olusturma);
}
export const asamaBul = (s: IsletmeSiparis): SiparisAsama => s.isletme?.asama ?? (s.durum === "iade" ? "iptal" : "yeni");
/** Panelde gösterilen sipariş: belirteçler ve iframe gibi iç ayrıntı atılır. */
export function siparisPanel(s: IsletmeSiparis) {
  const { ic, ...d } = s;
  return { ...d, ic: { urunOrtami: ic?.urunOrtami, kaynak: ic?.kaynak }, asama: asamaBul(s) };
}

/** Sitenin sahibi ve sitenin genel adresi (e-postalardaki bağlantılar için). */
export function siteAdresi(p: Proje, koken: string) {
  const alan = p.alanAdlari?.find((a) => a.durum === "bagli" && a.birincil) ?? p.alanAdlari?.find((a) => a.durum === "bagli");
  if (alan) return `https://${alan.ad}`;
  const ana = process.env.NEXT_PUBLIC_BUILD_ALAN;
  return ana ? `https://${p.ayarlar.altAlan}.${ana}` : `${koken}/b/${p.ayarlar.altAlan}`;
}


async function musteriyeYaz(p: Proje, v: IsletmeVeri, kime: string, konu: string, govde: string, dugme?: { ad: string; adres: string }) {
  if (!epostaKurulu() || !kime) return false;
  const r = await epostaGonder({ projeId: p.id, kime, konu, metin: govde, dugme, site: v.profil.ad || p.ad, marka: { ...(v.profil.logo ? { logo: v.profil.logo } : {}), altYazi: [v.profil.ad || p.ad, v.profil.telefon, v.profil.eposta].filter(Boolean).join(" · ") } });
  return r.ok;
}

/**
 * Ödeme onayından sonra bir kez: varyant stoğu düşer (Vayra Ödeme ürün stoğunu zaten düşer), sahibe ve müşteriye
 * sipariş e-postası gider. Panel, mağaza uçları ve zamanlayıcı çağırır; aynı sipariş iki kez işlenmez.
 */
const sonMutabakat = new Map<string, number>();
export async function mutabakat(id: string, koken = "", zorla = false) {
  const simdi = Date.now();
  if (!zorla && simdi - (sonMutabakat.get(id) ?? 0) < 5000) return 0;
  sonMutabakat.set(id, simdi);
  let n = 0;
  for (const ortam of ["canli", "test"] as const) {
    const bekleyen = (await siparisler(id, ortam)).filter((s) => s.durum === "odendi" && !s.isletme?.islendi);
    if (!bekleyen.length) continue;
    const tablo = await urunTablosuAdi(id);
    const p = await projeOkuHam(id);
    const v = await isletmeOku(id);
    for (const s of bekleyen) {
      // Önce işaretle (iki eşzamanlı çağrı aynı stoğu iki kez düşmesin).
      const isaretlendi = await veriDegistir(id, (db) => {
        const r = db.koleksiyonlar[SIPARIS_TABLOSU]?.kayitlar.find((x) => x.siparisNo === s.siparisNo) as IsletmeSiparis | undefined;
        if (!r || r.isletme?.islendi) return false;
        r.isletme = { asama: "yeni", ...(r.isletme ?? {}), islendi: true, gecmis: [...(r.isletme?.gecmis ?? []), { z: Date.now(), olay: "Ödeme onaylandı" }] };
        return true;
      }, ortam);
      if (!isaretlendi) continue;
      n++;
      const urunOrtami = s.ic?.urunOrtami ?? ortam;
      if (!(s.mod === "test" && urunOrtami === "canli")) {
        await veriDegistir(id, (db) => {
          const k = db.koleksiyonlar[tablo];
          if (!k) return;
          for (const x of s.kalemler) {
            const [uid, vid] = x.id.split("~");
            if (!vid) continue;
            const r = k.kayitlar.find((y) => y.id === uid) as Urun | undefined;
            const vy = r?.varyantlar?.liste.find((y) => y.id === vid);
            if (vy && typeof vy.stok === "number") { vy.stok = Math.max(0, vy.stok - x.adet); r!.guncelleme = Date.now(); }
          }
        }, urunOrtami).catch(() => {});
      }
      if (p && s.mod === "canli") {
        const site = siteAdresi(p, koken);
        const tutarYaz = (n: number) => paraBicim(n, s.paraBirimi || "TRY", v.profil.yerel || "tr-TR");
        const ozet = s.kalemler.map((k) => `${k.adet} x ${k.ad}: ${tutarYaz(k.tutar)}`).join("\n");
        if (v.magaza.musteriEposta) await musteriyeYaz(p, v, s.eposta, `Siparişin alındı: ${s.siparisNo}`, `Merhaba ${s.alici?.ad ?? ""},\n\n${s.siparisNo} numaralı siparişin ödemesi alındı. Hazırlanıp kargoya verildiğinde ayrıca haber vereceğiz.\n\n${ozet}\nToplam: ${tutarYaz(s.tutar)}`, { ad: "Siparişimi takip et", adres: `${site}/` }).catch(() => false);
        const sahip = v.magaza.bildirimEposta || v.profil.eposta;
        if (sahip && epostaKurulu()) await epostaGonder({ kime: sahip, konu: `Yeni sipariş: ${s.siparisNo} (${tutarYaz(s.tutar)})`, metin: `${s.alici?.ad ?? ""} ${s.alici?.soyad ?? ""} bir sipariş verdi.\n\n${ozet}\nToplam: ${tutarYaz(s.tutar)}\n\nSiparişi Vayra Build'de İşletme sekmesinin Siparişler bölümünde hazırlayabilirsin.` }).catch(() => {});
      }
      gunlukYaz(id, { t: "veri", d: 200, y: "/isletme/siparis", m: `Sipariş işlendi: ${s.siparisNo}${s.isletme?.kupon ? `, kupon ${s.isletme.kupon.kod}` : ""}` });
    }
  }
  return n;
}

/** Siparişin aşamasını, kargo bilgisini ya da notunu değiştirir; aşama değişince (istenirse) müşteriye e-posta gider. */
export async function siparisGuncelle(id: string, ortam: VeriOrtami, no: string, g: unknown, koken: string) {
  const o = nesne(g);
  const v = await isletmeOku(id);
  const asamalar = SIPARIS_ASAMALARI.map((a) => a.id) as SiparisAsama[];
  const sonuc = await veriDegistir(id, (db) => {
    const r = db.koleksiyonlar[SIPARIS_TABLOSU]?.kayitlar.find((x) => x.siparisNo === no) as IsletmeSiparis | undefined;
    if (!r) throw new OdemeHata("Sipariş bulunamadı.", 404);
    const i: SiparisIsletme = { asama: asamaBul(r), ...(r.isletme ?? {}) };
    const onceki = i.asama;
    const gecmis = [...(i.gecmis ?? [])];
    if (typeof o.asama === "string" && asamalar.includes(o.asama as SiparisAsama) && o.asama !== i.asama) {
      if (r.durum !== "odendi" && o.asama !== "iptal") throw new OdemeHata("Ödemesi alınmamış sipariş hazırlanamaz.", 409);
      i.asama = o.asama as SiparisAsama;
      gecmis.push({ z: Date.now(), olay: `Aşama: ${SIPARIS_ASAMALARI.find((a) => a.id === i.asama)!.ad}` });
    }
    if (o.kargo && typeof o.kargo === "object") {
      const k = nesne(o.kargo);
      const yontem = v.magaza.kargo.find((y) => y.id === (i.kargo?.yontem ?? ""));
      const takipNo = metin(k.takipNo, 60), firma = metin(k.firma, 40) || i.kargo?.firma || yontem?.firma || "";
      if (takipNo !== (i.kargo?.takipNo ?? "") || firma !== (i.kargo?.firma ?? "")) gecmis.push({ z: Date.now(), olay: takipNo ? `Kargo: ${firma} ${takipNo}` : "Kargo bilgisi silindi" });
      i.kargo = { yontem: i.kargo?.yontem ?? "", ad: i.kargo?.ad ?? "", firma, takipNo, takipAdresi: (v.magaza.kargo.find((y) => y.firma === firma && y.takipAdresi)?.takipAdresi ?? yontem?.takipAdresi ?? "") };
    }
    if (typeof o.not === "string" && o.not.trim()) i.notlar = [...(i.notlar ?? []), { z: Date.now(), metin: metin(o.not, 600, true) }].slice(-50);
    i.gecmis = gecmis.slice(-60);
    r.isletme = i; r.guncelleme = Date.now();
    return { s: JSON.parse(JSON.stringify(r)) as IsletmeSiparis, onceki, simdi: i.asama };
  }, ortam);
  // Müşteri e-postası: kargoya verildi, teslim edildi, iptal (yalnız canlı siparişte ve bir kez).
  let eposta: "gitti" | "kurulu-degil" | "yok" = "yok";
  if (sonuc.onceki !== sonuc.simdi && ["kargoda", "teslim", "iptal"].includes(sonuc.simdi) && v.magaza.musteriEposta && sonuc.s.mod === "canli" && !sonuc.s.isletme?.musteriBildirim?.[sonuc.simdi]) {
    if (!epostaKurulu()) eposta = "kurulu-degil";
    else {
      const p = await projeOkuHam(id);
      const k = sonuc.s.isletme?.kargo;
      const takip = k?.takipNo ? `\n\nKargo: ${k.firma} ${k.takipNo}` : "";
      const metinler: Record<string, [string, string]> = {
        kargoda: [`Siparişin kargoya verildi: ${no}`, `Merhaba ${sonuc.s.alici?.ad ?? ""},\n\n${no} numaralı siparişin kargoya verildi.${takip}`],
        teslim: [`Siparişin teslim edildi: ${no}`, `Merhaba ${sonuc.s.alici?.ad ?? ""},\n\n${no} numaralı siparişin teslim edildi. Bizi tercih ettiğin için teşekkürler.`],
        iptal: [`Siparişin iptal edildi: ${no}`, `Merhaba ${sonuc.s.alici?.ad ?? ""},\n\n${no} numaralı siparişin iptal edildi. Ödeme alındıysa iadesi bankana bağlı olarak birkaç iş günü içinde hesabına yansır.`],
      };
      const [konu, govde] = metinler[sonuc.simdi];
      const takipAdresi = k?.takipNo && k.takipAdresi ? k.takipAdresi.replace("{no}", encodeURIComponent(k.takipNo)) : "";
      if (p && (await musteriyeYaz(p, v, sonuc.s.eposta, konu, govde, takipAdresi ? { ad: "Kargonu takip et", adres: takipAdresi } : undefined).catch(() => false))) {
        eposta = "gitti";
        await veriDegistir(id, (db) => { const r = db.koleksiyonlar[SIPARIS_TABLOSU]?.kayitlar.find((x) => x.siparisNo === no) as IsletmeSiparis | undefined; if (r?.isletme) r.isletme.musteriBildirim = { ...r.isletme.musteriBildirim, [sonuc.simdi]: Date.now() }; }, ortam);
      }
    }
  }
  void koken;
  return { siparis: siparisPanel(sonuc.s), eposta };
}

/** Herkese açık sipariş takibi: numara ve e-posta birlikte doğruysa aşama ve kargo bilgisi. */
export async function siparisTakip(id: string, no: string, eposta: string) {
  for (const ortam of ["canli", "test"] as const) {
    const s = (await siparisler(id, ortam)).find((x) => x.siparisNo === no);
    if (!s) continue;
    if (s.eposta !== eposta.trim().toLowerCase()) return null;
    const k = s.isletme?.kargo;
    return {
      siparisNo: s.siparisNo, durum: s.durum, asama: asamaBul(s), asamaAd: SIPARIS_ASAMALARI.find((a) => a.id === asamaBul(s))!.ad, tutar: s.tutar, paraBirimi: s.paraBirimi, test: s.mod === "test",
      kalemler: s.kalemler.map((x) => ({ ad: x.ad, adet: x.adet, tutar: x.tutar })), olusturma: s.olusturma, odemeZamani: s.odemeZamani ?? null,
      kargo: k?.takipNo ? { firma: k.firma, takipNo: k.takipNo, takipAdresi: k.takipAdresi ? k.takipAdresi.replace("{no}", encodeURIComponent(k.takipNo)) : "" } : null,
      gecmis: (s.isletme?.gecmis ?? []).map((g) => ({ z: g.z, olay: g.olay })),
    };
  }
  return null;
}

/* ───────── terk edilen sepetler ───────── */
/** Ödeme sayfası açılıp tamamlanmayan (30 dakikadan eski) Canlı siparişler; aynı e-postayla sonra ödeme yapılmışsa sayılmaz. */
export async function terkEdilenler(id: string) {
  const l = await siparisler(id, "canli");
  const sinir = Date.now() - 30 * 60_000;
  const odeyen = new Map<string, number>();
  for (const s of l) if (s.durum === "odendi" || s.durum === "iade") odeyen.set(s.eposta, Math.max(odeyen.get(s.eposta) ?? 0, s.olusturma));
  const goruldu = new Set<string>();
  return l.filter((s) => {
    if ((s.durum !== "bekliyor" && s.durum !== "basarisiz") || s.olusturma > sinir) return false;
    if ((odeyen.get(s.eposta) ?? 0) > s.olusturma) return false;
    if (goruldu.has(s.eposta)) return false;
    goruldu.add(s.eposta);
    return true;
  }).slice(0, 300).map((s) => ({ siparisNo: s.siparisNo, eposta: s.eposta, ad: `${s.alici?.ad ?? ""} ${s.alici?.soyad ?? ""}`.trim(), tutar: s.tutar, paraBirimi: s.paraBirimi, kalemler: s.kalemler.map((k) => ({ ad: k.ad, adet: k.adet, tutar: k.tutar })), olusturma: s.olusturma, durum: s.durum, hata: s.hata ?? null, hatirlatma: s.isletme?.hatirlatma ?? null }));
}
/** Teslimden N gün sonra yorum isteği (bir kez; yorum toplama açık ve e-posta servisi kuruluysa). */
export async function yorumIstekleri(id: string, koken: string): Promise<number> {
  const v = await isletmeOku(id);
  const gun = v.magaza.yorumIstegiGun;
  if (!gun || !v.eklentiler.yorum.acik || !epostaKurulu()) return 0;
  const sinir = Date.now() - gun * 864e5, alt = Date.now() - (gun + 14) * 864e5;
  const adaylar = (await siparisler(id, "canli")).filter((s) => {
    const t = s.isletme?.gecmis?.findLast((g) => g.olay.includes("Teslim edildi"))?.z ?? 0;
    return s.durum === "odendi" && asamaBul(s) === "teslim" && !s.isletme?.yorumIstegi && t && t < sinir && t > alt;
  }).slice(0, 20);
  if (!adaylar.length) return 0;
  const p = await projeOkuHam(id);
  if (!p) return 0;
  let n = 0;
  for (const s of adaylar) {
    const isaret = await veriDegistir(id, (db) => { const r = db.koleksiyonlar[SIPARIS_TABLOSU]?.kayitlar.find((x) => x.siparisNo === s.siparisNo) as IsletmeSiparis | undefined; if (!r?.isletme || r.isletme.yorumIstegi) return false; r.isletme.yorumIstegi = Date.now(); return true; }, "canli");
    if (!isaret) continue;
    const urunler = s.kalemler.filter((k) => !k.id.startsWith("kargo-") && k.id !== "vergi").map((k) => k.ad).join(", ");
    if (await musteriyeYaz(p, v, s.eposta, "Siparişin nasıldı?", `Merhaba ${s.alici?.ad ?? ""},

${urunler} siparişini birkaç gün önce teslim aldın. Deneyimini birkaç cümleyle paylaşırsan hem bize hem diğer müşterilere çok yardımcı olur. Aynı e-postayla yazdığın yorum doğrulanmış alıcı olarak işaretlenir.`, { ad: "Yorum yaz", adres: `${siteAdresi(p, koken)}/` }).catch(() => false)) n++;
  }
  return n;
}

export async function terkHatirlat(id: string, no: string, koken: string): Promise<{ ok: boolean; hata?: string }> {
  if (!epostaKurulu()) return { ok: false, hata: "E-posta servisi kurulu değil (RESEND_API_KEY). Hatırlatma gönderilemez." };
  const p = await projeOkuHam(id);
  const s = (await siparisler(id, "canli")).find((x) => x.siparisNo === no);
  if (!p || !s) return { ok: false, hata: "Sipariş bulunamadı." };
  if (s.isletme?.hatirlatma) return { ok: false, hata: "Bu sepete hatırlatma zaten gönderildi." };
  const v = await isletmeOku(id);
  const kupon = v.magaza.terk.kuponKod && v.kuponlar.some((k) => k.kod === v.magaza.terk.kuponKod && k.aktif) ? v.kuponlar.find((k) => k.kod === v.magaza.terk.kuponKod)! : null;
  const ozet = s.kalemler.filter((k) => !k.id.startsWith("kargo-") && k.id !== "vergi").map((k) => `${k.adet} x ${k.ad}`).join("\n");
  const ok = await musteriyeYaz(p, v, s.eposta, "Sepetinde ürünler seni bekliyor", `Merhaba ${s.alici?.ad ?? ""},\n\nSepetindeki ürünleri ayırdık ama ödeme tamamlanmadı:\n${ozet}${kupon ? `\n\nSiparişini tamamlarken ${kupon.kod} koduyla ${kuponOzeti(kupon).toLocaleLowerCase("tr")} kazanırsın.` : ""}\n\nBir sorun yaşadıysan bu e-postayı yanıtlaman yeterli.`, { ad: "Alışverişe dön", adres: `${siteAdresi(p, koken)}/` });
  if (!ok) return { ok: false, hata: "E-posta gönderilemedi." };
  await veriDegistir(id, (db) => { const r = db.koleksiyonlar[SIPARIS_TABLOSU]?.kayitlar.find((x) => x.siparisNo === no) as IsletmeSiparis | undefined; if (r) r.isletme = { asama: asamaBul(r), ...(r.isletme ?? {}), hatirlatma: Date.now() }; }, "canli");
  return { ok: true };
}

/* ───────── raporlar ───────── */
/** Siparişin mağaza ana para birimindeki karşılığı (ek para biriminde alınan siparişler sipariş anındaki kurla). */
const anaTutar = (s: IsletmeSiparis) => (s.isletme?.kur && s.isletme.kur !== 1 ? Math.round((s.tutar / s.isletme.kur) * 100) / 100 : s.tutar);
export async function magazaRaporu(id: string, ortam: VeriOrtami, gun: number) {
  const v = await isletmeOku(id);
  const l = await siparisler(id, ortam);
  const { urunler: ul } = await urunler(id, ortam);
  const simdi = Date.now(), bas = simdi - gun * 864e5, oncekiBas = bas - gun * 864e5;
  const donem = l.filter((s) => s.olusturma >= bas), onceki = l.filter((s) => s.olusturma >= oncekiBas && s.olusturma < bas);
  const ozetle = (x: IsletmeSiparis[]) => {
    const odenen = x.filter((s) => s.durum === "odendi");
    const ciro = odenen.reduce((t, s) => t + kurus(anaTutar(s)), 0);
    return { ciro: ciro / 100, adet: odenen.length, ortalama: odenen.length ? ciro / odenen.length / 100 : 0, iade: x.filter((s) => s.durum === "iade").reduce((t, s) => t + kurus(s.iadeTutari ?? s.tutar), 0) / 100, baslayan: x.length, indirim: odenen.reduce((t, s) => t + kurus(s.isletme?.indirim ?? 0), 0) / 100 };
  };
  const o = ozetle(donem), oo = ozetle(onceki);
  const gunler: { tarih: string; ciro: number; adet: number }[] = [];
  const tz = v.profil.saatDilimi || "UTC";
  for (let i = gun - 1; i >= 0; i--) gunler.push({ tarih: dilimTarih(simdi - i * 864e5, tz), ciro: 0, adet: 0 });
  const dizin = new Map(gunler.map((g, i) => [g.tarih, i]));
  const urunSay = new Map<string, { ad: string; adet: number; ciro: number }>();
  const kuponSay = new Map<string, { kod: string; adet: number; indirim: number; ciro: number }>();
  const musteri = new Map<string, number>();
  for (const s of donem) {
    if (s.durum !== "odendi") continue;
    const i = dizin.get(dilimTarih(s.odemeZamani ? Date.parse(s.odemeZamani) : s.olusturma, tz));
    if (i !== undefined) { gunler[i].ciro = Math.round((gunler[i].ciro + anaTutar(s)) * 100) / 100; gunler[i].adet++; }
    for (const k of s.kalemler) {
      if (k.id.startsWith("kargo-") || k.id === "vergi") continue;
      const anahtar = k.id.split("~")[0];
      const e = urunSay.get(anahtar) ?? { ad: k.ad.replace(/ \(.*\)$/, ""), adet: 0, ciro: 0 };
      e.adet += k.adet; e.ciro = Math.round((e.ciro + k.tutar / (s.isletme?.kur || 1)) * 100) / 100; urunSay.set(anahtar, e);
    }
    if (s.isletme?.kupon) { const e = kuponSay.get(s.isletme.kupon.kod) ?? { kod: s.isletme.kupon.kod, adet: 0, indirim: 0, ciro: 0 }; e.adet++; e.indirim += s.isletme.kupon.indirim; e.ciro += anaTutar(s); kuponSay.set(e.kod, e); }
  }
  for (const s of l) if (s.durum === "odendi") musteri.set(s.eposta, (musteri.get(s.eposta) ?? 0) + 1);
  const asamaSay = Object.fromEntries(SIPARIS_ASAMALARI.map((a) => [a.id, 0])) as Record<SiparisAsama, number>;
  for (const s of l) if (s.durum === "odendi") asamaSay[asamaBul(s)]++;
  const dusuk: { id: string; ad: string; varyant: string; stok: number }[] = [];
  for (const u of ul) {
    if (u.aktif === false) continue;
    if (u.varyantlar?.liste?.length) { for (const vy of u.varyantlar.liste) if (vy.aktif !== false && typeof vy.stok === "number" && vy.stok <= v.magaza.dusukStok) dusuk.push({ id: u.id, ad: u.ad, varyant: varyantAdi(vy), stok: vy.stok }); }
    else if (typeof u.stok === "number" && u.stok <= v.magaza.dusukStok) dusuk.push({ id: u.id, ad: u.ad, varyant: "", stok: u.stok });
  }
  return {
    ozet: o, onceki: oo, gunler, enCok: [...urunSay.entries()].map(([uid, e]) => ({ id: uid, ...e })).sort((a, b) => b.ciro - a.ciro).slice(0, 10),
    kuponlar: [...kuponSay.values()].sort((a, b) => b.adet - a.adet), musteriSayisi: musteri.size, tekrarlayan: [...musteri.values()].filter((n) => n > 1).length,
    donusum: o.baslayan ? Math.round((o.adet / o.baslayan) * 100) : null, asamalar: asamaSay, dusukStok: dusuk.sort((a, b) => a.stok - b.stok).slice(0, 30),
    urunSayisi: ul.length, kuponSayisi: v.kuponlar.filter((k) => k.aktif).length,
  };
}

/** CSV hücresi (Excel uyumlu, noktalı virgül ayraçlı). */
export const csvHucre = (x: unknown) => { const s = String(x ?? ""); return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export const kimlikDogrula = kimlik;

/* ───────── ödeme (Vayra Ödeme üzerinden) ───────── */
/** Site içi göreli sayfa yolu; dış adres ya da ".." kabul edilmez (Vayra Ödeme ile aynı kural). */
function sayfaYolu(x: unknown): string | null {
  const y = String(x ?? "").trim().replace(/^\.?\/+/, "");
  if (!y || y.length > 160 || y.includes("..") || y.includes("//") || y.includes(":") || y.includes("\\")) return null;
  return /^[A-Za-z0-9._\-/]+(\?[A-Za-z0-9._\-=&%]*)?(#[A-Za-z0-9_-]*)?$/.test(y) ? y : null;
}
export type OdemeGirdisi = { sepet?: unknown; kupon?: unknown; kargo?: unknown; alici?: unknown; fatura?: unknown; not?: unknown; basariSayfasi?: unknown; hataSayfasi?: unknown; kok?: unknown; sayfa?: unknown; para?: unknown; saglayici?: unknown };
/**
 * Mağaza ödemesi: sepet (varyant, kupon, kargo, KDV) sunucuda hesaplanır, sipariş Vayra Ödeme'nin siparisler tablosuna
 * işletme alanlarıyla yazılır ve seçili sağlayıcının güvenli ödeme sayfası açılır. Önizlemeden başlayan ödeme testtir.
 */
export async function magazaOdemeBaslat(g: { id: string; girdi: OdemeGirdisi; onizlemeBelirteci: string | null; oturum: string | null; koken: string; ip: string }) {
  const { id, girdi } = g;
  const { anahtarlarHazir, aliciTemizle, odemeAyarOku: ayarOku, saglayiciBaslat, siparisNoUret, siparisOlustur, sonucIsle, SAGLAYICI_AD, paraDestekli } = await import("./odeme");
  const { istekOrtami } = await import("./veri");
  const { oturumdanUye } = await import("./uye");
  const p = await projeOkuHam(id);
  if (!p) throw new OdemeHata("Proje yok.", 404);
  const ayar = await ayarOku(id);
  if (!ayar.saglayici) throw new OdemeHata("Bu sitede ödeme henüz kurulmadı. Site sahibi Bulut'taki Ödemeler bölümünden Stripe, PayPal, iyzico ya da PayTR'yi bağlamalı.", 409);
  const onizleme = !!g.onizlemeBelirteci && g.onizlemeBelirteci === p.onizlemeBelirteci;
  if (!onizleme && !p.yayin) throw new OdemeHata("Site yayında değil.", 409);
  const mod = onizleme ? "test" : ayar.mod;
  const urunOrtami = await istekOrtami(id, onizleme);
  const kokGirdi = typeof girdi.kok === "string" ? girdi.kok : "";
  let kok = `/b/${p.ayarlar.altAlan}`;
  if (onizleme) {
    const m = /^\/api\/build\/onizleme\/([^/]+)\/([^/]+)$/.exec(kokGirdi);
    kok = m && m[1] === id && decodeURIComponent(m[2]).split("~")[0] === p.onizlemeBelirteci ? kokGirdi : `/api/build/onizleme/${id}/${p.onizlemeBelirteci}`;
  } else if (girdi.kok === "") kok = "";
  const basari = sayfaYolu(girdi.basariSayfasi) ?? (ayar.basariSayfasi || "index.html");
  const hata = sayfaYolu(girdi.hataSayfasi) ?? (ayar.hataSayfasi || basari);
  const v = await isletmeOku(id);
  const aliciHam = nesne(girdi.alici), faturaHam = nesne(girdi.fatura);
  const ulke = typeof aliciHam.ulke === "string" && ulkeBul(aliciHam.ulke) ? aliciHam.ulke.toUpperCase() : v.profil.ulkeKodu;
  const sepet = await sepetHesapla(id, urunOrtami, { sepet: girdi.sepet, kupon: girdi.kupon, kargo: girdi.kargo, eposta: aliciHam.eposta, ulke, bolge: aliciHam.bolge, para: girdi.para, vergiKimligi: faturaHam.tur === "kurumsal" ? faturaHam.vergiNo : "" }, v);
  if (sepet.kupon && !sepet.kupon.gecerli) throw new OdemeHata(sepet.kupon.mesaj, 409);
  if (sepet.toplam <= 0) throw new OdemeHata("Sepet tutarı sıfırdan büyük olmalı.");
  if (v.magaza.kargo.some((y) => y.aktif) && !sepet.kargo.secili) throw new OdemeHata("Kargo yöntemi seç.");
  // Alıcı ek sağlayıcılardan birini seçebilir (örneğin kart için Stripe, yanında PayPal).
  const saglayici = typeof girdi.saglayici === "string" && (ayar.ekSaglayicilar ?? []).includes(girdi.saglayici as never) ? (girdi.saglayici as typeof ayar.saglayici & string) : ayar.saglayici;
  if (!paraDestekli(saglayici, sepet.paraBirimi)) throw new OdemeHata(`${SAGLAYICI_AD[saglayici]} ${sepet.paraBirimi} ile ödeme almıyor; başka bir para birimi ya da ödeme yöntemi seç.`, 409);
  const alici = aliciTemizle({ ...aliciHam, ulke, bolge: sepet.bolge || aliciHam.bolge }, saglayici, v.profil.ulkeKodu);
  if (v.magaza.kargo.some((y) => y.aktif)) adresDenetle(alici);
  const fatura = faturaTemizle(girdi.fatura, ulke || "TR");
  anahtarlarHazir(p, saglayici, mod);
  const uye = await oturumdanUye(id, g.oturum).catch(() => null);
  const secili = sepet.kargo.secenekler.find((s) => s.id === sepet.kargo.secili);
  const yontem = v.magaza.kargo.find((y) => y.id === secili?.id);
  const isletme: SiparisIsletme = {
    asama: "yeni", araToplam: sepet.araToplam, indirim: sepet.indirim, kargoUcreti: sepet.kargoUcreti, kdv: sepet.kdv,
    vergi: { ad: sepet.vergi.ad, dahil: sepet.vergi.dahil, toplam: sepet.vergi.toplam, tersIbraz: sepet.vergi.tersIbraz, not: sepet.vergi.not },
    ...(sepet.paraBirimi !== v.magaza.paraBirimi ? { kur: kurBul(v.magaza, sepet.paraBirimi) ?? 1, anaPara: v.magaza.paraBirimi } : {}),
    ...(sepet.kupon?.gecerli ? { kupon: { kod: sepet.kupon.kod, indirim: sepet.indirim, tur: sepet.kupon.tur ?? "yuzde" } } : {}),
    ...(secili ? { kargo: { yontem: secili.id, ad: secili.ad, firma: secili.firma, takipNo: "", takipAdresi: yontem?.takipAdresi ?? "" } } : {}),
    ...(fatura ? { fatura } : {}), ...(typeof girdi.not === "string" && girdi.not.trim() ? { not: metin(girdi.not, 500, true) } : {}),
    gecmis: [{ z: Date.now(), olay: "Sipariş oluşturuldu" }],
  };
  const alanlar = {
    siparisNo: siparisNoUret(), durum: "bekliyor" as const, tutar: Math.round(sepet.toplam * 100) / 100, paraBirimi: sepet.paraBirimi, saglayici, mod, kalemler: sepet.odemeKalemleri, alici, eposta: alici.eposta,
    olaylar: [{ z: Date.now(), olay: "Sipariş oluşturuldu", ayrinti: `Vayra İşletme mağazası${onizleme ? ", önizlemeden test" : mod === "test" ? ", test modu" : ""}` }],
    ic: { donus: { basari: `${g.koken}${kok}/${basari}`, hata: `${g.koken}${kok}/${hata}` }, urunOrtami, kaynak: typeof girdi.sayfa === "string" ? girdi.sayfa.slice(0, 160) : undefined, ip: g.ip },
    isletme, ...(uye ? { uyeId: uye.id } : {}),
  };
  const s = await siparisOlustur(id, alanlar);
  const ortam: VeriOrtami = mod === "test" ? "test" : "canli";
  try {
    const r = await saglayiciBaslat({ p, ayar, mod, koken: g.koken, ip: g.ip, s });
    await sonucIsle(id, ortam, s.siparisNo, { durum: "bekliyor", olay: `${SAGLAYICI_AD[s.saglayici]} ödeme sayfası açıldı`, ic: r.ic });
    return { siparisNo: s.siparisNo, adres: r.adres, tutar: s.tutar, test: mod === "test", ozet: { araToplam: sepet.araToplam, indirim: sepet.indirim, kargo: sepet.kargoUcreti, vergi: sepet.vergi.toplam, vergiDahil: sepet.vergi.dahil, toplam: sepet.toplam, paraBirimi: sepet.paraBirimi } };
  } catch (e) {
    const m = (e as Error).message;
    await sonucIsle(id, ortam, s.siparisNo, { durum: "basarisiz", olay: "Ödeme başlatılamadı", ayrinti: m, alanlar: { hata: m } }).catch(() => {});
    throw e instanceof OdemeHata ? e : new OdemeHata(m, 502);
  }
}

/* ───────── para birimi kurları ───────── */
let ecbOnbellek: { z: number; oranlar: Record<string, number> } | null = null;
/** ECB euro referans kurları (her iş günü yaklaşık 16:00 CET güncellenir); AED, SAR, AZN dolara sabit kurdan. */
async function ecbKurlari(): Promise<Record<string, number>> {
  if (ecbOnbellek && Date.now() - ecbOnbellek.z < 6 * 3600_000) return ecbOnbellek.oranlar;
  let metin2 = "";
  try { const r = await fetch("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml", { signal: AbortSignal.timeout(10_000) }); if (!r.ok) throw new Error(String(r.status)); metin2 = await r.text(); }
  catch (e) { throw new OdemeHata(`Kurlar alınamadı (ECB): ${(e as Error).message}. Kuru elle girebilirsin.`, 502); }
  const oranlar: Record<string, number> = { EUR: 1 };
  for (const m of metin2.matchAll(/currency='([A-Z]{3})'\s+rate='([\d.]+)'/g)) oranlar[m[1]] = Number(m[2]);
  if (!oranlar.USD) throw new OdemeHata("ECB kur dosyası okunamadı.", 502);
  const { SABIT_KUR_USD } = await import("./bolge");
  for (const [k, v2] of Object.entries(SABIT_KUR_USD)) oranlar[k] = v2 * oranlar.USD;
  ecbOnbellek = { z: Date.now(), oranlar };
  return oranlar;
}
/** Ek para birimlerinin otomatik kurlarını yeniler (ana birim başına). Elle kuru olanlara dokunmaz. */
export async function kurlariGuncelle(id: string): Promise<IsletmeVeri["magaza"]["kurlar"]> {
  const v = await isletmeOku(id);
  const m = v.magaza;
  if (!m.ekParaBirimleri.length) return m.kurlar;
  const e = await ecbKurlari();
  const taban = e[m.paraBirimi];
  if (!taban) throw new OdemeHata(`${m.paraBirimi} için otomatik kur yok; ek para birimlerinin kurunu elle gir.`, 409);
  const oranlar: Record<string, number> = {};
  for (const x of m.ekParaBirimleri) if (e[x.kod]) oranlar[x.kod] = Math.round((e[x.kod] / taban) * 1e6) / 1e6;
  const kurlar = { z: Date.now(), taban: m.paraBirimi, oranlar, kaynak: "ECB euro referans kurları" };
  const { isletmeDegistir } = await import("./isletme");
  await isletmeDegistir(id, (x) => { x.magaza.kurlar = kurlar; });
  return kurlar;
}

/* ───────── vitrine giden mağaza ayarları ───────── */
/** Sitenin para birimi seçicisi, adres formu ve vergi notu için ayarlar (kurlar dahil; kişisel ya da gizli veri yok). */
export function magazaGenel(v: IsletmeVeri, saglayicilar: string[] = []) {
  const m = v.magaza;
  const ulkeler = m.satisUlkeleri.length ? m.satisUlkeleri : [...new Set([v.profil.ulkeKodu, ...m.kargo.filter((y) => y.aktif).flatMap((y) => y.ulkeler)].filter(Boolean))];
  return {
    paraBirimi: m.paraBirimi, yerel: v.profil.yerel, ulke: v.profil.ulkeKodu, saatDilimi: v.profil.saatDilimi,
    paraBirimleri: [{ kod: m.paraBirimi, kur: 1 }, ...m.ekParaBirimleri.map((e) => ({ kod: e.kod, kur: kurBul(m, e.kod) })).filter((e) => e.kur)],
    vergi: { model: m.vergi.model, ad: m.vergi.model === "yok" ? "" : vergiAdi(m.vergi.model), dahil: m.vergi.dahil, vergiKimligi: m.vergi.vergiKimligiIste },
    satisUlkeleri: m.satisUlkeleri, herUlke: !m.satisUlkeleri.length && m.kargo.some((y) => y.aktif && !y.ulkeler.length),
    adresBicimleri: Object.fromEntries(ulkeler.map((u) => [u, adresBicimi(u)])),
    faturaIste: m.faturaIste, saglayicilar,
  };
}
/** Ürünün vitrin biçimi, istenen para biriminde (kur ve yuvarlama mağaza ayarından). */
export function urunGenelPara(r: Urun, v: IsletmeVeri, istenen?: string | null) {
  const u = urunGenel(r, v.magaza.dusukStok);
  const m = v.magaza;
  const kod = istenen && kurBul(m, istenen) ? istenen : m.paraBirimi;
  const kur = kurBul(m, kod) ?? 1, ek = m.ekParaBirimleri.find((e) => e.kod === kod), ond = paraOndalik(kod);
  const c = (n: number | null) => (n === null ? null : kod === m.paraBirimi ? n : kurlaCevir(n, kur, ek?.yuvarlama ?? "yok", ond));
  const yaz = (n: number) => paraBicim(n, kod, v.profil.yerel || "tr-TR");
  const fiyat = c(u.fiyat)!;
  return {
    ...u, fiyat, enDusukFiyat: c(u.enDusukFiyat)!, eskiFiyat: c(u.eskiFiyat), paraBirimi: kod, fiyatMetin: yaz(fiyat),
    varyantlar: u.varyantlar ? { ...u.varyantlar, liste: u.varyantlar.liste.map((x) => ({ ...x, fiyat: c(x.fiyat)! })) } : null,
  };
}
