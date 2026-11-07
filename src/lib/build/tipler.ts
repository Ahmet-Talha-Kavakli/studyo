/**
 * Vayra Build — ortak tipler (istemci + sunucu).
 * Proje = çok dosyalı statik web projesi (HTML/CSS/JS modülleri, CDN kitaplıkları); derleme adımı yok,
 * önizleme ve yayın dosyaları olduğu gibi sunar. Oyun ve mobil uygulama da aynı biçimde (canvas / PWA).
 */

export type ProjeTur = "site" | "uygulama" | "oyun" | "mobil";

export const PROJE_TURLERI: { id: ProjeTur; ad: string; alt: string; gorsel: string }[] = [
  { id: "site", ad: "Web sitesi", alt: "Kurumsal, kişisel, açılış sayfası", gorsel: "/gercek/sc/sc-land.webp" },
  { id: "uygulama", ad: "Web uygulaması", alt: "Panel, araç, üyelikli uygulama", gorsel: "/gercek/sc/sc-dash.webp" },
  { id: "oyun", ad: "Oyun", alt: "2D, 3D, tarayıcıda oynanır", gorsel: "/gercek/sc/sc-game.webp" },
  { id: "mobil", ad: "Mobil uygulama", alt: "iOS ve Android", gorsel: "/gercek/sc/uyg-pati.webp" },
];

/** Projenin bir anlık görüntüsü. Her ajan turu, elle kayıt ve geri yükleme yeni sürüm oluşturur (doğrusal geçmiş). */
export type Surum = {
  id: string;
  no: number;
  zaman: number;
  /** Kısa açıklama: "Menü sayfası eklendi", "Elle düzenleme", "Sürüm 3'e dönüldü". */
  aciklama: string;
  kaynak: "ajan" | "elle" | "stil" | "geri" | "sablon";
  dosyalar: Record<string, string>;
  /** Önceki sürüme göre değişen dosyalar ve satır farkı. */
  degisen: { yol: string; ekle: number; sil: number }[];
  yerImi?: boolean;
};

export type AlanAdiDurum = "dns-bekleniyor" | "dogrulaniyor" | "ssl" | "bagli" | "sorun";
export type DnsKayit = { tur: "A" | "CNAME" | "TXT"; ad: string; deger: string; durum?: "dogru" | "yok" | "yanlis"; bulunan?: string[] };
export type AlanAdi = {
  ad: string;
  /** Kök mü alt alan adı mı. */
  kok: boolean;
  birincil: boolean;
  /** www'yi köke yönlendir (yalnız kök alan adında). */
  wwwYonlendir: boolean;
  durum: AlanAdiDurum;
  dogrulamaKodu: string;
  sonKontrol?: number;
  kayitlar: DnsKayit[];
  /** Taramada bulunan uyarılar (CAA, AAAA, Cloudflare vekili, eski A kaydı …). */
  uyarilar: string[];
  /** Korunan e-posta kayıtları (MX, SPF). */
  korunan: string[];
  eklenme: number;
};

export type Sir = { ad: string; deger: string; gorunurluk: "sunucu" | "herkese" };

export type AjanIzinKategori = "veritabani" | "dosyaSil" | "gorsel" | "test" | "hafiza";
export type AjanIzinSeviye = "her-zaman" | "sor" | "asla";
export const AJAN_IZINLERI: { id: AjanIzinKategori; ad: string; alt: string }[] = [
  { id: "veritabani", ad: "Veritabanını değiştirme", alt: "Tablo kurma, sütun ve kural değiştirme, örnek kayıt ekleme" },
  { id: "dosyaSil", ad: "Dosya silme", alt: "Projeden dosya kaldırma" },
  { id: "gorsel", ad: "Görsel üretme", alt: "Yapay zekâyla yeni görsel üretir, kredi harcar" },
  { id: "test", ad: "Tarayıcı testi", alt: "Siteyi gerçek tarayıcıda deneme; formları gönderebilir" },
  { id: "hafiza", ad: "Hafızaya not alma", alt: "Kalıcı tercihlerini proje hafızasına yazma" },
];

/**
 * Ziyaretçi oturum kaydı ayarı (rrweb; yalnız yayındaki sitede). Form alanları her zaman maskelenir; parola, kart ve
 * kimlik alanlarıyla data-vayra-gizli öğeleri hiç kaydedilmez.
 */
export type OturumAyar = {
  acik: boolean;
  /** Kaydedilecek ziyaret oranı, yüzde 1-100 (oturum başında bir kez karar verilir). */
  oran: number;
  /** Saklama süresi, gün (1-90). */
  saklama: number;
  /** Sayfadaki bütün metinleri de maskele. */
  metinMaskele: boolean;
  /** Sitenin kendi çerez bandı vayra.kayit.onayla() çağırana kadar kaydetme. */
  onayBekle: boolean;
  /** İzlenmek istemediğini bildiren tarayıcıları (Do Not Track, GPC) kaydetme. */
  izlemeIstemeyen: boolean;
};

export type ProjeAyarlar = {
  /** Yayın adresi: <altAlan>.vayra.app ya da yerelde /b/<altAlan>. */
  altAlan: string;
  gorunurluk: "herkes" | "sifreli";
  sifre?: string;
  seo: { baslik: string; aciklama: string; ogGorsel?: string; indeks: boolean };
  sirlar: Sir[];
  /** Vayra rozeti ("Vayra ile yapıldı"). */
  rozet: boolean;
  /** Ajan talimatları (proje bilgisi). */
  talimat: string;
  /** Vayra Yapay Zekâ geçidi: sitenin vayra.ai ile metin ve görsel üretmesi. */
  ai?: { acik: boolean; gunlukSinir: number; sistem: string };
  /** Güvenlik taramasında gerekçesiyle yok sayılan bulgular. */
  guvenlikYoksay?: { id: string; neden: string; zaman: number }[];
  /** Kritik güvenlik bulgusu varken yayını durdur (varsayılan açık). */
  kritikteDurdur?: boolean;
  /** Ajan izinleri: yetenek başına her zaman, sor ya da asla (tanımsız: her zaman). */
  ajanIzinleri?: Partial<Record<AjanIzinKategori, AjanIzinSeviye>>;
  /** "İzin ver" cevabıyla verilen geçici izinler (kategori, zaman); 15 dakika geçerli. */
  ajanIzinGecici?: Partial<Record<AjanIzinKategori, number>>;
  /** Proje hafızası: ajanın kullanıcıdan öğrendiği kalıcı tercihler (kullanıcı düzenleyebilir). */
  hafiza?: { id: string; metin: string; zaman: number }[];
  /** Ziyaretçi oturum kaydı (Bulut > Oturumlar); tanımsızsa kapalı. */
  oturum?: OturumAyar;
  /** GitHub bağlantısı (anahtar şifreli). */
  github?: { anahtar?: string; kullanici?: string; avatar?: string; depo?: string; dal?: string; ozel?: boolean; son?: { sha: string; url: string; zaman: number; yon: "gonder" | "cek"; surumNo: number } };
};

export type YayinKaydi = { surumId: string; surumNo: number; zaman: number };

export type FormGonderimi = { id: string; form: string; sayfa: string; alanlar: Record<string, string>; zaman: number; okundu?: boolean };

/** Sohbet mesajlarının arayüz biçimi (API geçmişi sunucuda ayrı ve yalnız eklenerek tutulur). */
export type AdimTur = "dusunce" | "dosya-yaz" | "dosya-duzenle" | "dosya-sil" | "gorsel" | "test" | "plan" | "soru" | "bilgi" | "veri" | "sistem";
export type Adim = { id: string; tur: AdimTur; baslik: string; ayrinti?: string; yol?: string; /** Adımın açtığı sayfa (ör. kurulan sistem). */ baglanti?: string; ekle?: number; sil?: number; gorsel?: string; /** Saniye (düşünme süresi). */ sure?: number; durum: "suruyor" | "bitti" | "hata";
  /** Tarayıcı testi: adım adım sonuç ve ekran görüntüleri. */ testAdimlari?: { ad: string; durum: "gecti" | "kaldi"; gorsel?: string; hata?: string }[]; cihaz?: "masaustu" | "mobil" };
export type PlanKart = { baslik: string; neden: string; adimlar: string[]; bitti: string; kapsamDisi?: string; tahmin: number; durum: "bekliyor" | "onaylandi" | "reddedildi";
  /** Plan belgesinde elle düzenlenince önceki hâller (plan sürümleri) ve düzenlendi işareti (onayda tam metin gönderilir). */
  onceki?: { baslik: string; neden: string; adimlar: string[]; bitti: string; kapsamDisi?: string; zaman: number }[]; duzenlendi?: boolean };
export type SoruKart = { sorular: { id: string; soru: string; secenekler: { ad: string; renkler?: string[]; font?: string }[]; cevap?: string }[]; durum: "bekliyor" | "cevaplandi" };

/** Kod yazılmadan önce sunulan tasarım yönleri (tek dosyalık önizlemeler); kullanıcı birini seçer. */
export type TasarimKart = { secenekler: { ad: string; aciklama: string; html: string }[]; secilen?: number; durum: "bekliyor" | "secildi" };

/** Önizlemede seçilen öğe: seçici, etiket, metin ve kaynak konumu (öğe hangi dosyanın hangi satırlarında). */
export type OgeBaglam = { secici: string; etiket: string; metin?: string; konum?: { dosya: string; satir: number; sonSatir?: number } };

export type BuildMesaj = {
  id: string;
  rol: "kullanici" | "asistan";
  zaman: number;
  metin: string;
  ekler?: { tur: "gorsel"; url: string; ad: string }[];
  /** Belge ekleri (PDF ve metin dosyaları); metinleri ajana gider. */
  belgeler?: { tur: "pdf" | "metin"; url: string; ad: string; boyut?: number }[];
  /** Kullanıcının önizlemede seçtiği öğe (bağlam) ve kaynaktaki yeri (dosya, satır aralığı). */
  oge?: OgeBaglam;
  /** Sohbet ayracı: yeni sohbet başladı ya da bir noktaya geri dönüldü (ajan önceki konuşmayı bu noktadan sonra özetle görür). */
  ayrac?: { tur: "yeni-sohbet" | "geri-donus"; kod?: boolean; surumNo?: number; silinen?: number };
  adimlar?: Adim[];
  plan?: PlanKart;
  soru?: SoruKart;
  tasarim?: TasarimKart;
  /** Hedef kipi: ajan hedefe ulaşana kadar kendi başına çalışır; kredi tavanında durup devam edip etmeyeceğini sorar. */
  hedef?: { metin: string; tavan: number; harcanan: number; durum: "suruyor" | "tavan" | "tamam" | "durdu" };
  /** Bu tur sonunda oluşan sürüm. */
  surumId?: string;
  sureMs?: number;
  kredi?: number;
  /** Bu turun hata düzeltmesi olup olmadığı (ücretsiz). */
  duzeltme?: boolean;
  durum?: "suruyor" | "bitti" | "durduruldu" | "hata" | "anahtar-yok";
  /** Turu çalıştıran model (BUILD_MODELLERI kimliği). */
  model?: string;
  hata?: string;
  oneriler?: string[];
  /** Kullanıcı mesajını yazan ekip üyesinin görünen adı (ekipte birden çok kişi varken mesajın üstünde görünür). */
  yazar?: string;
};

/** Ekip rolü: düzenleyici ajanla çalışır, kodu ve ayarları değiştirir, yayınlar; izleyici yalnız görür. */
export type EkipRol = "duzenleyici" | "izleyici";
/** İsteği yapanın projedeki yeri. */
export type ProjeErisim = "sahip" | EkipRol;

export type Proje = {
  id: string;
  ad: string;
  tur: ProjeTur;
  olusturma: number;
  guncelleme: number;
  /** Önizleme sunucusu için gizli belirteç (iframe adresinde). */
  onizlemeBelirteci: string;
  dosyalar: Record<string, string>;
  surumler: Surum[];
  mesajlar: BuildMesaj[];
  ayarlar: ProjeAyarlar;
  yayin: YayinKaydi | null;
  /** Yayın geçmişi (yeniden eskiye): yayın, geri alma, yayından kaldırma. */
  yayinGecmisi?: { surumId: string; surumNo: number; zaman: number; olay: "yayin" | "geri" | "kaldir" }[];
  alanAdlari: AlanAdi[];
  kapak?: string;
  sablon?: string;
  /** Projeler sayfasında yıldızlı (üstte). */
  yildiz?: boolean;
  /** Projeler sayfasındaki klasör adı. */
  klasor?: string;
  /** Bu proje bir taslaksa: ana proje ve taslağın açıldığı andaki ana sürüm. */
  taslak?: { anaId: string; anaAd: string; anaSurumNo: number; olusturma: number; gorev?: TaslakGorev };
  /** Bu proje bir paylaşım bağlantısından ya da topluluk şablonundan remix edildiyse kaynağı (emeği anmak için). */
  remixKaynagi?: { tur: "paylasim" | "topluluk"; id: string; ad: string; yazar: string; surumNo: number; zaman: number };
  /** Proje bir web adresinden içe aktarıldıysa orijinal site (önizlemede yan yana kıyas). */
  kaynakSite?: { url: string; zaman: number };
  /** Yalnız API yanıtında: isteği yapanın rolü ve sahip dışındaki ekip üyesi sayısı (dosyaya yazılmaz). */
  ekipRol?: ProjeErisim;
  ekipSayisi?: number;
};

/** Liste görünümü için hafif özet. */
/** Paralel görev: ana projenin kopyasında arka planda çalışan ajan turu (görev panosu). */
export type TaslakGorev = { istem: string; model: string; mod: "yap" | "plan"; olusturma: number; grup?: string };

export type ProjeOzet = Pick<Proje, "id" | "ad" | "tur" | "olusturma" | "guncelleme" | "kapak" | "yayin" | "yildiz" | "klasor" | "taslak"> & { altAlan: string; surumSayisi: number; sonSurumNo: number;
  /** Benimle paylaşılan projede rolüm (kendi projelerimde yok). */
  ekipRol?: EkipRol;
  /** Sahip dışındaki ekip üyesi sayısı. */
  uyeSayisi?: number;
  /** Paylaşılan projede sahibin görünen adı. */
  sahipAd?: string;
  /** Kaldığın yerden devam: son kullanıcı isteği ve zamanı. */
  sonIstek?: { metin: string; zaman: number };
  /** Yayından bu yana oluşan sürüm sayısı (hiç yayınlanmadıysa bütün sürümler). */
  yayinlanmamis?: number;
  /** Ajan şu an bu projede çalışıyor. */
  calisiyor?: boolean;
};

/** Dosya uzantısından içerik türü. */
export const MIME_TURU: Record<string, string> = {
  html: "text/html; charset=utf-8", css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8", mjs: "text/javascript; charset=utf-8",
  json: "application/json; charset=utf-8", svg: "image/svg+xml", txt: "text/plain; charset=utf-8", md: "text/plain; charset=utf-8",
  webmanifest: "application/manifest+json", xml: "application/xml; charset=utf-8",
};
export const mimeBul = (yol: string) => MIME_TURU[yol.split(".").pop()?.toLowerCase() ?? ""] ?? "text/plain; charset=utf-8";

/** Proje içi yol güvenliği: göreli, ".." yok, izinli karakterler. */
export function yolGecerli(yol: string): boolean {
  if (!yol || yol.length > 200) return false;
  if (yol.startsWith("/") || yol.includes("\\") || yol.split("/").some((p) => p === ".." || p === "." || p === "")) return false;
  return /^[A-Za-z0-9._\-/]+$/.test(yol);
}

/** İki metin arasındaki satır farkı (basit LCS yok; eklenen/silinen satır sayısı kümeyle tahmin). */
export function satirFarki(eski: string | undefined, yeni: string | undefined): { ekle: number; sil: number } {
  const a = (eski ?? "").split("\n"), b = (yeni ?? "").split("\n");
  if (!eski) return { ekle: yeni ? b.length : 0, sil: 0 };
  if (!yeni) return { ekle: 0, sil: a.length };
  const say = new Map<string, number>();
  for (const s of a) say.set(s, (say.get(s) ?? 0) + 1);
  let ortak = 0;
  for (const s of b) { const n = say.get(s) ?? 0; if (n > 0) { ortak++; say.set(s, n - 1); } }
  return { ekle: b.length - ortak, sil: a.length - ortak };
}

export function dosyaFarklari(eski: Record<string, string>, yeni: Record<string, string>) {
  const yollar = new Set([...Object.keys(eski), ...Object.keys(yeni)]);
  const sonuc: { yol: string; ekle: number; sil: number }[] = [];
  for (const y of yollar) {
    if (eski[y] === yeni[y]) continue;
    const f = satirFarki(eski[y], yeni[y]);
    sonuc.push({ yol: y, ...f });
  }
  return sonuc.sort((x, y) => x.yol.localeCompare(y.yol));
}

/** Alt alan adı biçimi: küçük harf, rakam, tire; 3-40 karakter. */
export function altAlanUret(ad: string): string {
  const tr: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", İ: "i" };
  const s = ad.toLocaleLowerCase("tr-TR").replace(/[çğıöşüİ]/g, (h) => tr[h] ?? h).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
  return s.length >= 3 ? s : `proje-${s || "yeni"}`;
}
export const altAlanGecerli = (s: string) => /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/.test(s);
