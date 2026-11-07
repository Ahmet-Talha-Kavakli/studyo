"use client";

import { ESZAMANLI } from "@/lib/fiyat";
import type { GorselIslem } from "@/lib/saglayicilar/tipler";
import { elementleriCoz, type ElementReferans } from "@/lib/elementCekirdek";
import { useElements } from "@/store/useElements";
import { toast } from "@/lib/toast";
import { useProjeler } from "@/store/useProjeler";
import { useProje } from "@/store/useSinema";
import { useAuth } from "@/store/useAuth";
import { useAuthKapi } from "@/store/useAuthKapi";
import { useBildirim } from "@/store/useBildirim";
import { sesCalici } from "@/lib/sesCalici";
import { useTercih } from "@/store/useTercih";
import { haklarGetir } from "@/lib/odeme/istemci";
import { HIZ_CARPANI } from "./krediTarife";
import { bildir, OTO_YUKLEME_ESIGI } from "./bildirimler";
import { KREDI_PAKETLERI } from "./fiyat";
import { gradientOnizleme, onizlemeArka } from "./utils";
import { kategoriEtiket, type IhlalKategori } from "./moderasyon";
import { ISLEM_BASLIGI, krediHatasiGoster, yanitBakiyesi, yeniIslemAnahtari, type KrediAlani } from "./krediIstek";
import type { ModelTur } from "./catalog";

export { gradientOnizleme };

/**
 * uretimBaslat sonucu başarısızsa uygun hata toast'ını gösterir.
 * Kredi yetersizse "Kredi Yükle" aksiyon butonlu toast (Higgsfield birebir yönlendirme).
 * Kullanım: const s = uretimBaslat(...); if (!s.ok) return uretimHataToast(s);
 */
export function uretimHataToast(sonuc: { hata?: string; kod?: "giris" | "kredi" }, baslik = "Üretilemedi") {
  if (sonuc.kod === "kredi") {
    toast.error("Kredin yetmiyor", {
      description: sonuc.hata,
      action: { label: "Kredi yükle", onClick: () => { window.location.href = "/panel/kredi"; } },
    });
  } else if (sonuc.kod === "giris") {
    // Misafir üretmeye kalktı → toast yerine merkezi giriş/kayıt POP-UP'ı aç.
    useAuthKapi.getState().ac({
      baslik: "Üretmek için giriş yap",
      altBaslik: "Ücretsiz kaydol, saniyeler içinde üretmeye başla",
    });
  } else {
    toast.error(baslik, { description: sonuc.hata ?? "Üretim başlatılamadı. Biraz sonra yeniden dene." });
  }
}

/** Üretim türüne göre en uygun stok görsel kategorisi (Higgsfield görünümü). */
function turKategori(tur: ModelTur): string {
  if (tur === "video") return "sinematik";
  if (tur === "3d") return "3d";
  if (tur === "ses") return "soyut";
  if (tur === "muzik") return "soyut";
  return "portre"; // görsel
}

/* 2026-11-07: sağlayıcısız "örnek çıktı" yolu kaldırıldı. Eskiden sağlayıcı bağlı değilken stok bir görsel ya da
   klip "tamamlandı" diye kitaplığa yazılıyordu; artık üretim açık bir hatayla biter ve kredi düşmez. */
const SAGLAYICI_YOK = "Bu üretim için sağlayıcı bağlı değil.";

export interface UretimIstek {
  baslik: string;
  tur: ModelTur;
  model: string;
  prompt: string;
  kredi: number;
  arac?: string;
  projeId?: string; // bu üretimi bağlayacağın ortak proje (useProje). Geçilmezse bağımsız üretim.
  /* hamIstem: kullanıcının yazdığı istem — ayar notları hariç.
     Bkz. useProjeler.Uretim.meta açıklaması. */
  /* Video: gorselUrl başlangıç karesi, bitisKareUrl son kare, hareket seçilen kamera preseti. */
  meta?: { oran?: string; cozunurluk?: string; sure?: string; taslak?: { cozunurluk?: string; sure?: string }; kurulum?: Record<string, unknown>; demoKlip?: { video: string; poster: string }; hizEgri?: string; tempo?: string; ses?: string; gorselUrl?: string; videoUrl?: string; hamIstem?: string; kaynakId?: string; surumTur?: string; sahneDiyalog?: { kim: string; metin: string; ton?: string }[]; sesNotu?: string; diyalogDili?: string; yenidenKok?: string; ucretsiz?: boolean; sesHak?: string; akis?: boolean; bitisKareUrl?: string; hareket?: string; bitHizi?: string; cokCekim?: boolean; cekimler?: { istem: string; sn: number }[]; sinirsiz?: boolean; mod?: string; dil?: string; hiz?: number; kararlilik?: number; benzerlik?: number; stil?: number; sesId?: string; hedefDil?: string; kaynakDil?: string; konusmaciSayisi?: number; gurultuTemizle?: boolean; kaynakAd?: string; karakter?: number; paylasimSahibi?: string; bicim?: string; tohum?: number; diyalog?: { metin: string; sesId: string; ses?: string; sahip?: string }[]; efektSn?: number; dongu?: boolean; istemEtkisi?: number;
    /** İstemdeki @elementler: ad + tür (kayıtta gösterim için). Görseller `girdi.referanslar` ile gider. */
    elementler?: { ad: string; tur: string }[];
    /* Görsel: işlem ve gerçek parametreler (bkz. saglayicilar/tipler). */
    islem?: GorselIslem; referanslar?: string[]; stilRefler?: string[]; stilGuc?: "hafif" | "dengeli" | "guclu"; demoOrnek?: string; urunGorsel?: string; maskeUrl?: string; negatif?: string; seffaf?: boolean; kalite?: string; vektor?: boolean; yonlendirme?: number; adim?: number; renkler?: string[];
    /* 3D araçları: kaynak modelin sağlayıcı görevi ya da herkese açık GLB adresi. */
    kaynakGorev?: { id?: string; tur?: string }; kaynakGlb?: string; stilAd?: string; stilIstem?: string; refRolleri?: string[]; zemin?: string; pano?: string; palet?: string; gelistir?: boolean; grupId?: string; sira?: number; motor?: string; yon?: string; kanvas?: { w: number; h: number; x: number; y: number; gw: number; gh: number }; istemsiz?: boolean; lora?: { url: string; olcek?: number }; giysi?: { kategori?: string; foto?: string; mod?: string }; sadakat?: "siki" | "dengeli" | "serbest" };
  /** Sunucuya gönderilen ama SAKLANMAYAN girdiler (ör. ses değiştirme/çeviri için kaynak dosyanın data URL'i).
      Büyük dosyalar tarayıcı deposuna yazılmaz; üretim kaydında yalnız dosya adı kalır. */
  girdi?: { kaynak?: string; gorseller?: string[]; referanslar?: ElementReferans[] };
}

/** ModelTur → API üretim türü. Müzik ses altyapısını kullanır; bilinmeyen türler görsele düşer. */
function apiTuru(tur: ModelTur): "gorsel" | "video" | "ses" | "3d" | "muzik" {
  if (tur === "video" || tur === "ses" || tur === "3d" || tur === "muzik") return tur;
  return "gorsel";
}

const TUR_ADI: Record<string, string> = { video: "Video", gorsel: "Görsel", ses: "Ses", muzik: "Şarkı", "3d": "3D model" };

/** "… hazır" bildirimi — çıktının küçük resmi ve kitaplık bağlantısıyla. */
function tamamBildirimi(istek: UretimIstek, id: string) {
  const u = useProjeler.getState().uretimler.find((x) => x.id === id);
  const aday = u?.thumbnailUrl ?? u?.gorselUrl;
  // Gradyan yer tutucular küçük resim olamaz; yalnız gerçek görsel yolları alınır.
  const gorsel = aday && /^(\/|https?:|data:image)/.test(aday) ? aday : undefined;
  const link = `/panel/kitaplik?u=${id}`;
  return {
    kategori: "uretim" as const, tur: "basari" as const,
    baslik: `${TUR_ADI[istek.tur] ?? "Üretim"} hazır`,
    mesaj: `"${istek.baslik}" · ${istek.model}.`,
    gorsel, link, eylem: { ad: "Görüntüle", link }, uretimId: id,
  };
}

/**
 * Gerçek çalışır üretim akışı:
 * kredi kontrol → ekranda ayır (useAuth.krediAyir) → kuyruğa ekle → deterministik progress →
 * /api/uretim'e POST (işlem anahtarıyla; anahtar varsa GERÇEK sağlayıcı: ElevenLabs/Meshy/OpenAI/Replicate,
 * yoksa simülasyon) → gerçek çıktıyı yerleştir → bildirim.
 * Kredi sunucuda kesilir ve sunucuda iade edilir; istemci yalnız ekrandaki bakiyeyi yanıttaki bakiyeye eşitler.
 * Kredi yetmezse hata döner.
 */
/**
 * İstemdeki @elementleri çözer (tüm stüdyolar için tek nokta): modele giden istemde @Ad,
 * elementin adı ve tarifiyle açıklanır; elementin görselleri referans olarak sağlayıcıya gider
 * (destekleyen modellerde). Kullanım sayacı yalnız gerçek üretimde artar.
 */
function elementleriUygula(istek: UretimIstek): UretimIstek {
  if (!istek.prompt.includes("@")) return istek;
  const { istem, referanslar, bulunan } = elementleriCoz(istek.prompt, useElements.getState().elementler);
  if (!bulunan.length) return istek;
  useElements.getState().kullanildi(bulunan.map((e) => e.id));
  // Gösterilen/yeniden kullanılan istem kullanıcının yazdığı (@'li) haliyle kalır.
  return {
    ...istek, prompt: istem,
    meta: { ...istek.meta, hamIstem: istek.meta?.hamIstem ?? istek.prompt, elementler: bulunan.map((e) => ({ ad: e.ad, tur: e.tur })) },
    girdi: { ...istek.girdi, referanslar: referanslar.filter((r) => r.gorseller.length) },
  };
}

/* ── Eşzamanlılık ve iptal ──
   Plan başına aynı anda çalışan iş sınırı (fiyat.ESZAMANLI). Sınır doluysa iş "Sırada" bekler ve
   bir iş bitince başlar (reddedilmez). Her iş iptal edilebilir: sıradaysa hiç başlamaz, çalışıyorsa
   istek kesilir; ikisinde de kredi iade edilir. */
type IsGrubu = "video" | "gorsel";
const calisan: Record<IsGrubu, number> = { video: 0, gorsel: 0 };
const bekleyen: Record<IsGrubu, { id: string; basla: () => void }[]> = { video: [], gorsel: [] };
const kesiciler = new Map<string, AbortController>();
const iptalEdilen = new Set<string>();
/** Üretim kimliği → ekranda ayrılan kredinin jetonu (useAuth.krediAyir). */
const ayirmalar = new Map<string, string | null>();
/** Ekrandaki ayırmayı bırakır: sunucu bakiyesi biliniyorsa ona eşitlenir, bilinmiyorsa ayrılan kredi geri eklenir. */
function ayirmaBirak(id: string, sunucuBakiyesi?: number) {
  if (!ayirmalar.has(id)) return;
  const j = ayirmalar.get(id) ?? null;
  ayirmalar.delete(id);
  useAuth.getState().krediBirak(j, sunucuBakiyesi);
}
/** İstek gönderilmişken kesildi: sunucunun kesip kesmediği yanıt gelmeden bilinmez; bakiye sunucudan yeniden okunur. */
const bakiyeyiTazele = () => setTimeout(() => void useAuth.getState().esitle(), 3000);
const grupBul = (tur: ModelTur): IsGrubu => (tur === "video" ? "video" : "gorsel");
/** NDJSON üretim akışını okur: "s" satırları oynatıcıya gider, "son" satırı üretim yanıtıdır. */
async function akisOku(yanit: Response, id: string): Promise<unknown> {
  const akis = sesCalici.akisDestek() ? sesCalici.akisBaslat(id) : null;
  let son: { ok?: boolean } = { ok: false };
  try {
    const okuyucu = yanit.body!.getReader();
    const coz = new TextDecoder();
    let tampon = "";
    const satir = (s: string) => {
      if (!s.trim()) return;
      const j = JSON.parse(s) as { t: "s"; b: string } | { t: "son"; veri: { ok?: boolean } };
      if (j.t === "s") akis?.ekle(j.b); else son = j.veri;
    };
    for (;;) {
      const { value, done } = await okuyucu.read();
      if (done) break;
      tampon += coz.decode(value, { stream: true });
      let i: number;
      while ((i = tampon.indexOf("\n")) >= 0) { satir(tampon.slice(0, i)); tampon = tampon.slice(i + 1); }
    }
    satir(tampon);
  } catch (e) { akis?.iptal(); throw e; }
  if (son.ok) akis?.bitir(); else { akis?.iptal(); if (!("hata" in son)) Object.assign(son, { hata: "Ses akışı yarıda kesildi." }); }
  return son;
}

/* Hız hakkı sunucudaki ödeme kaydından gelir (/api/odeme/haklar ve her üretim yanıtındaki haklar alanı);
   tarayıcıdaki ekler deposu ya da tercih kullanılmaz. Seviye akış hızını, ek eşzamanlı adet plan sınırını belirler. */
let sunucuHiz: { seviye: string; ekEsZamanli: number; zaman: number } | null = null;
function hizTazele() {
  if (sunucuHiz && Date.now() - sunucuHiz.zaman < 60_000) return;
  if (!useAuth.getState().hesap) return;
  void haklarGetir().then((r) => { if (r.ok) sunucuHiz = { seviye: r.haklar.hiz?.seviye ?? "standart", ekEsZamanli: r.haklar.hiz?.ekEsZamanli ?? 0, zaman: Date.now() }; }).catch(() => undefined);
}
function sinir(grup: IsGrubu): number {
  hizTazele();
  const plan = useAuth.getState().kullanici?.plan ?? "baslangic";
  const anahtar = (plan === "kurumsal" ? "ultra" : plan) as keyof typeof ESZAMANLI;
  return (ESZAMANLI[anahtar]?.[grup] ?? 1) + (sunucuHiz?.ekEsZamanli ?? 0);
}
function slotAl(grup: IsGrubu, id: string): Promise<void> {
  if (calisan[grup] < sinir(grup)) { calisan[grup]++; return Promise.resolve(); }
  return new Promise((coz) => bekleyen[grup].push({ id, basla: () => { calisan[grup]++; coz(); } }));
}
function slotBirak(grup: IsGrubu) {
  calisan[grup] = Math.max(0, calisan[grup] - 1);
  const sira = bekleyen[grup].shift();
  if (sira) sira.basla();
}
/** Sırada bekleyen işin kuyruktaki konumu (1'den başlar); çalışıyor ya da yoksa 0. */
export function uretimSirasi(id: string): number {
  for (const g of ["video", "gorsel"] as IsGrubu[]) { const i = bekleyen[g].findIndex((x) => x.id === id); if (i >= 0) return i + 1; }
  return 0;
}
/** Üretimi iptal eder: sıradaysa çıkarılır, çalışıyorsa istek kesilir. Kredi iade edilir. */
export function uretimIptal(id: string): boolean {
  const u = useProjeler.getState().uretimler.find((x) => x.id === id);
  if (!u || (u.durum !== "kuyrukta" && u.durum !== "isleniyor")) return false;
  iptalEdilen.add(id);
  for (const g of ["video", "gorsel"] as IsGrubu[]) {
    const i = bekleyen[g].findIndex((x) => x.id === id);
    if (i >= 0) { bekleyen[g].splice(i, 1); iptalSonu(id, u.kredi, false); return true; }
  }
  const k = kesiciler.get(id);
  if (k) { k.abort(); return true; }
  iptalSonu(id, u.kredi, false);
  return true;
}
/** gonderildi: istek sunucuya gitmişti (sunucu bağlantının kesildiğini görünce kesintiyi kendisi iade eder). */
function iptalSonu(id: string, kredi: number, gonderildi: boolean) {
  ayirmaBirak(id);
  if (gonderildi) bakiyeyiTazele();
  useProjeler.getState().guncelle(id, { durum: "hata", ilerleme: 0, hata: "İptal edildi", kredi: 0 });
  toast("Üretim iptal edildi", kredi > 0 ? { description: gonderildi ? "İş yarıda kesildi; kesilen kredi sunucuda iade edilir, bakiyen birazdan güncellenir." : "İş başlamadan durduruldu, kredi düşmedi." } : undefined);
}

export function uretimBaslat(istekHam: UretimIstek): { ok: boolean; id?: string; hata?: string; kod?: "giris" | "kredi" } {
  const istek = elementleriUygula(istekHam);
  const auth = useAuth.getState();
  const projeler = useProjeler.getState();
  const bildirim = useBildirim.getState();

  if (!auth.kullanici) return { ok: false, hata: "Önce giriş yapmalısın.", kod: "giris" };
  if (auth.kullanici.krediler < istek.kredi)
    return { ok: false, hata: `Bu üretim ${istek.kredi} kredi gerektiriyor, bakiyende ${auth.kullanici.krediler} kredi var.`, kod: "kredi" };

  const oncekiKredi = auth.kullanici.krediler;
  // Kredi sunucuda kesilir (/api/uretim); burada yalnız ekrandaki bakiye iyimser düşer.
  const ayirma = auth.krediAyir(istek.kredi);
  if (ayirma === null)
    return { ok: false, hata: `Bu üretim ${istek.kredi} kredi gerektiriyor, bakiyende ${auth.kullanici.krediler} kredi var.`, kod: "kredi" };

  // Düşük kredi uyarısı — bakiye kullanıcının eşiğinin (Ayarlar › Bildirimler; 0 = kapalı) ALTINA yeni indiyse bir kez bildir.
  const kalanKredi = oncekiKredi - istek.kredi;
  const ESIK = useTercih.getState().krediEsigi ?? 200;
  if (oncekiKredi >= ESIK && kalanKredi < ESIK) {
    // ekleTek: aynı uyarı arka arkaya üretimlerde spam yapmasın.
    bildirim.ekleTek({
      anahtar: kalanKredi <= 0 ? "kredi-bitti" : "kredi-dusuk",
      kategori: "hesap",
      baslik: kalanKredi <= 0 ? "Kredin bitti" : "Kredin azalıyor",
      mesaj: kalanKredi <= 0
        ? "Bakiyen tükendi. Üretime devam etmek için kredi yükle ya da planını yükselt."
        : `Bakiyende ${kalanKredi} kredi kaldı. Kesintisiz üretim için kredi yükleyebilirsin.`,
      tur: "uyari",
      link: "/panel/kredi?sekme=kredi",
      eylem: { ad: "Kredi yükle", link: "/panel/kredi?sekme=kredi" },
    });
  }

  // Yükleme hatırlatması (Ayarlar › Kullanım): kayıtlı kartla ödemesiz yükleme altyapısı yok; tarayıcı kendi kendine
  // kredi eklemez ve makbuz kesmez. Bakiye eşiğin altına ilk indiğinde seçili paketi yükleme bağlantısıyla hatırlatır.
  const tercih = useTercih.getState();
  if (tercih.otomatikYukleme && kalanKredi < OTO_YUKLEME_ESIGI && oncekiKredi >= OTO_YUKLEME_ESIGI) {
    const p = KREDI_PAKETLERI.find((x) => x.kredi === tercih.otoPaket) ?? KREDI_PAKETLERI.find((x) => x.populer)!;
    bildirim.ekle({
      kategori: "hesap", tur: "uyari", baslik: "Kredin azaldı",
      mesaj: `Bakiyen ${OTO_YUKLEME_ESIGI} kredinin altına indi. Seçtiğin ${p.kredi.toLocaleString("tr-TR")} kredilik paketi yükleyebilirsin.`,
      link: "/panel/kredi?sekme=kredi", eylem: { ad: "Kredi yükle", link: "/panel/kredi?sekme=kredi" },
    });
  }

  const id = projeler.ekle({
    baslik: istek.baslik,
    tur: istek.tur,
    model: istek.model,
    prompt: istek.prompt,
    durum: "kuyrukta",
    ilerleme: 0,
    kredi: istek.kredi,
    arac: istek.arac,
    projeId: istek.projeId,
    meta: istek.meta,
  });
  ayirmalar.set(id, ayirma);

  // Ortak proje mimarisi: üretim bir projeye aitse o projenin uretimIdler'ine bağla (çift-yönlü erişim).
  if (istek.projeId) {
    try { useProje.getState().uretimBagla(istek.projeId, id, istek.arac === "Shorts Stüdyosu" ? "shorts" : "genel"); } catch { /* proje store hazır değilse sessiz geç */ }
  }

  // İşleme animasyonu — gerçek ilerleyen progress (API yanıtı gelene kadar akar)
  // Hız kademesi (Hız & Güç): Standart 1× · Öncelikli 2× · Turbo 4× — progress o oranda hızlı akar.
  const hizCarpani = HIZ_CARPANI[sunucuHiz?.seviye ?? "standart"] ?? 1;
  /* Ara adımlar yalnız üretim hâlâ sürüyorsa yazılır: sağlayıcı ilk adımdan önce yanıt verirse
     (hızlı API) geç kalan bir adım bitmiş üretimi "işleniyor"a geri çevirmesin. */
  const suruyor = () => { const u = useProjeler.getState().uretimler.find((x) => x.id === id); return !!u && (u.durum === "kuyrukta" || u.durum === "isleniyor"); };
  const adimlar = [22, 38, 55, 71, 86];
  let zamanlayicilar: ReturnType<typeof setTimeout>[] = [];
  const animasyonuBaslat = () => {
    projeler.guncelle(id, { durum: "isleniyor", ilerleme: 4, baslama: Date.now() });
    zamanlayicilar = adimlar.map((p, i) =>
      setTimeout(() => { if (suruyor()) projeler.guncelle(id, { ilerleme: p }); }, (500 + i * 420) / hizCarpani));
  };

  const grup = grupBul(istek.tur);
  const kesici = new AbortController();
  kesiciler.set(id, kesici);

  // Gerçek üretim çağrısı — arka planda, progress animasyonuyla örtüşür.
  (async () => {
    // Gerçek çıktının kendi küçük resmi yoksa (ses, küçük resimsiz 3D) kart için dekoratif arka plan.
    const yedekOnizleme = apiTuru(istek.tur) === "ses" || apiTuru(istek.tur) === "muzik" ? onizlemeArka(istek.prompt + istek.model + id, turKategori(istek.tur)) : gradientOnizleme(id);
    await slotAl(grup, id);
    if (iptalEdilen.has(id)) { slotBirak(grup); kesiciler.delete(id); return; }
    animasyonuBaslat();
    let gonderildi = false;
    try {
      gonderildi = true;
      const yanit = await fetch("/api/uretim", {
        signal: kesici.signal,
        method: "POST",
        headers: { "Content-Type": "application/json", [ISLEM_BASLIGI]: yeniIslemAnahtari("u") },
        body: JSON.stringify({
          tur: apiTuru(istek.tur),
          model: istek.model,
          prompt: istek.prompt,
          meta: istek.meta,
          // Arayüzde gösterilen bedel: sunucu kendi tabanını keser, bu yalnız tabanın üstündeyse dikkate alınır.
          kredi: istek.kredi,
          ...(istek.girdi ? { girdi: istek.girdi } : {}),
        }),
      });
      // Akışlı seslendirme (NDJSON): parçalar geldikçe çalınır, son satır normal yanıtla aynıdır.
      const veri = (yanit.headers.get("content-type")?.includes("ndjson") ? await akisOku(yanit, id) : await yanit.json()) as {
        ok: boolean;
        gercek?: boolean;
        moderasyon?: boolean;
        kategori?: string;
        hata?: string;
        saglayici?: string;
        ciktiUrl?: string;
        dataUri?: string;
        detay?: { glb?: string; thumbnail?: string; gorev?: { id: string; tur: string }; dosyalar?: Record<string, string>; animasyonlar?: { ad: string; glb: string }[]; model?: string; vayraModel?: string; gonderilenIstem?: string; tohum?: number; genislik?: number; yukseklik?: number; kelimeler?: { k: string; b: number; s: number; kon?: string }[]; transkript?: string; sureSn?: number; dil?: string };
        kredi?: KrediAlani; gereken?: number; bakiye?: number;
        /** Sunucunun uyguladığı süreli haklar (ödeme kaydından). */
        haklar?: { sinirsiz: boolean; hiz: string; ekEsZamanli: number };
        /** Ücretli seslendirmede sunucunun açtığı ücretsiz yeniden üretim hakkı. */
        sesHak?: string;
      };
      // Ekrandaki bakiye sunucunun bildirdiğine eşitlenir (kesinti, iade ya da kesintisiz örnek çıktı).
      ayirmaBirak(id, yanitBakiyesi(veri, yanit));
      if (veri.haklar) sunucuHiz = { seviye: veri.haklar.hiz, ekEsZamanli: veri.haklar.ekEsZamanli, zaman: Date.now() };

      // Oturum kapalı (401) ya da kredi sunucuda yetmedi (402): kredi kesilmedi.
      if (yanit.status === 401 || yanit.status === 402) {
        zamanlayicilar.forEach(clearTimeout);
        projeler.guncelle(id, { durum: "hata", ilerleme: 0, kredi: 0, hata: yanit.status === 401 ? "Oturumun kapalı. Giriş yapıp yeniden dene." : (veri.hata ?? "Kredin yetmiyor.") });
        krediHatasiGoster(yanit.status, veri);
        return;
      }

      // MODERASYON REDDİ (422) → üretim "hata", KREDİ İADE + bildirim.
      // Kullanıcı isteği: "NFC(+18) içerik üretiminde hata mesajı + kredilerin geri gelmesi."
      if (veri.moderasyon) {
        zamanlayicilar.forEach(clearTimeout);
        // Sunucu moderasyonu kesintiden önce çalışır: kredi hiç kesilmedi.
        projeler.guncelle(id, { durum: "hata", ilerleme: 0, hata: veri.hata ?? "İçerik politikası ihlali." });
        bildir({
          kategori: "uretim",
          baslik: "Üretim engellendi",
          mesaj: `"${istek.baslik}" · ${veri.kategori ? `${kategoriEtiket(veri.kategori as IhlalKategori)}. ` : ""}${veri.hata ?? "İçerik politikası ihlali."}${istek.kredi > 0 ? ` ${istek.kredi} kredi iade edildi.` : ""}`,
          tur: "uyari",
          link: "/sartlar",
          eylem: { ad: "Kuralları gör", link: "/sartlar" },
          uretimId: id,
        });
        return;
      }

      // GERÇEK SUNUCU HATASI (400/500 vb. — ok:false, moderasyon değil): KREDİ İADE + hata bildirimi.
      // Higgsfield birebir: teknik başarısızlıkta kullanıcı kredisini kaybetmez, net hata görür.
      if (!yanit.ok || veri.ok === false) {
        zamanlayicilar.forEach(clearTimeout);
        // Kesinti sunucuda iade edildi; yanıttaki bakiye ekrana yansıdı.
        projeler.guncelle(id, { durum: "hata", ilerleme: 0, hata: (veri.hata ?? "Beklenmeyen bir hata oluştu.").slice(0, 200) });
        bildir({
          kategori: "uretim",
          baslik: "Üretim tamamlanamadı",
          mesaj: `"${istek.baslik}" · ${istek.model} · ${veri.hata ?? "Sağlayıcı yanıt vermedi."}${istek.kredi > 0 ? ` ${istek.kredi} kredi iade edildi.` : ""} Yeniden deneyebilirsin.`,
          tur: "hata",
          link: `/panel/kitaplik?u=${id}`,
          eylem: { ad: "Kitaplıkta gör", link: `/panel/kitaplik?u=${id}` },
          uretimId: id,
        });
        return;
      }

      // Sağlayıcı bağlı değil (sunucu gerçek üretim yapmadı, kredi kesmedi): stok örnek göstermek yerine açık hata.
      if (!veri.gercek) {
        zamanlayicilar.forEach(clearTimeout);
        projeler.guncelle(id, { durum: "hata", ilerleme: 0, kredi: 0, hata: SAGLAYICI_YOK });
        bildir({
          kategori: "uretim", tur: "hata", baslik: "Üretim yapılamadı",
          mesaj: `"${istek.baslik}" · ${istek.model} · ${SAGLAYICI_YOK} Kredi düşmedi.`,
          uretimId: id,
        });
        return;
      }

      zamanlayicilar.forEach(clearTimeout);
      // Son adım: %96 → sonra tamam (higgs'te olduğu gibi tam bitiş hissi)
      projeler.guncelle(id, { ilerleme: 96 });
      await new Promise((r) => setTimeout(r, 180 / hizCarpani));

      const cikti = veri.dataUri ?? veri.ciktiUrl;
      const tur = apiTuru(istek.tur);
      const sesMi = tur === "ses" || tur === "muzik";
      const ucBoyutMu = tur === "3d";
      const videoMu = tur === "video";
      const glb = veri.detay?.glb ?? (ucBoyutMu ? veri.ciktiUrl : undefined);
      const thumb = veri.detay?.thumbnail;
      // Video URL'i http olmalı (data-uri video pratik değil); yoksa gradient önizleme kalır.
      const videoLink = videoMu && veri.ciktiUrl ? veri.ciktiUrl : undefined;
      projeler.guncelle(id, {
        durum: "tamam",
        ilerleme: 100,
        // Ses → sesUrl; 3D → thumbnail/gradient gorselUrl'e; görsel → gorselUrl; video → gradient önizleme + videoUrl.
        gorselUrl: sesMi ? yedekOnizleme : (ucBoyutMu ? (thumb ?? yedekOnizleme) : (videoMu ? (thumb ?? yedekOnizleme) : (cikti ?? yedekOnizleme))),
        ...(sesMi && cikti ? { sesUrl: cikti } : {}),
        ...(videoLink ? { videoUrl: videoLink } : {}),
        ...(ucBoyutMu && glb ? { glbUrl: glb } : {}),
        ...(ucBoyutMu && thumb ? { thumbnailUrl: thumb } : {}),
        ...(veri.saglayici ? { saglayici: veri.saglayici, gercek: veri.gercek } : {}),
        // Görsel: sağlayıcıdaki gerçek model, gönderilen istem, tohum ve gerçek piksel boyutu bilgi panelinde görünür.
        ...(veri.gercek && veri.detay?.model && tur === "gorsel" ? {
          meta: {
            ...(useProjeler.getState().uretimler.find((u) => u.id === id)?.meta ?? istek.meta),
            apiModel: veri.detay.model,
            ...(veri.detay.vayraModel && veri.detay.vayraModel !== istek.model ? { cozulenModel: veri.detay.vayraModel } : {}),
            ...(veri.detay.gonderilenIstem ? { gonderilenIstem: veri.detay.gonderilenIstem.slice(0, 2000) } : {}),
            ...(Number.isInteger(veri.detay.tohum) ? { tohum: veri.detay.tohum } : {}),
          },
        } : {}),
        // 3D: sağlayıcı görevi (sonraki araç işlemi bu modelden devam eder), rig animasyonları ve baskı dosyaları.
        ...(veri.gercek && ucBoyutMu && (veri.detay?.gorev || veri.detay?.dosyalar) ? {
          meta: {
            ...(useProjeler.getState().uretimler.find((u) => u.id === id)?.meta ?? istek.meta),
            ...(veri.detay?.gorev ? { saglayiciGorev: veri.detay.gorev } : {}),
            ...(veri.detay?.dosyalar && Object.keys(veri.detay.dosyalar).length ? { dosyalar: veri.detay.dosyalar } : {}),
          },
        } : {}),
        ...(veri.gercek && ucBoyutMu && veri.detay?.animasyonlar ? { animasyonlar: veri.detay.animasyonlar.map((a) => a.ad) } : {}),
        // Ses: kelime zamanları (karaoke, SRT/VTT), transkript metni ve gerçek süre.
        ...(veri.gercek && sesMi && (veri.detay?.kelimeler || veri.detay?.transkript || veri.detay?.sureSn) ? {
          meta: {
            ...(useProjeler.getState().uretimler.find((u) => u.id === id)?.meta ?? istek.meta),
            ...(veri.detay?.kelimeler ? { kelimeler: veri.detay.kelimeler } : {}),
            ...(veri.detay?.transkript !== undefined ? { transkript: veri.detay.transkript, ...(veri.detay.dil ? { algilananDil: veri.detay.dil } : {}) } : {}),
            ...(typeof veri.detay?.sureSn === "number" ? { sureSn: veri.detay.sureSn } : {}),
          },
        } : {}),
        ...(useTercih.getState().otoYayin ? { yayinda: true } : {}),
        // Sunucunun kestiği tutar yazılır.
        ...(veri.kredi && !veri.kredi.iade ? { kredi: veri.kredi.harcanan } : {}),
      });

      // Ücretsiz yeniden üretim hakkı kayda yazılır (Ses Stüdyosu yeniden üretirken sunucuya geri gönderir).
      if (veri.sesHak) {
        const m = useProjeler.getState().uretimler.find((u) => u.id === id)?.meta ?? istek.meta;
        projeler.guncelle(id, { meta: { ...m, sesHak: veri.sesHak } });
      }
      // Sınırsız erişim sunucuda doğrulanamıyorsa (ekler bu tarayıcıda tutuluyor) kesinti açıkça söylenir.
      if (istek.meta?.sinirsiz && veri.kredi && !veri.kredi.iade && veri.kredi.harcanan > 0) {
        toast.info("Bu üretim için kredi kesildi", { description: `Bu model ve ayarlar için etkin bir sınırsız erişimin yok; ${veri.kredi.harcanan} kredi düştü.` });
      }
      // Kullanıcı "Üretim tamamlandı" bildirimini kapatmışsa bildirim düşürme (Ayarlar tercihi).
      // Derin bağlantı: bildirime tıklayınca kitaplıkta o üretimin lightbox'ı açılır.
      bildir(tamamBildirimi(istek, id));
    } catch {
      zamanlayicilar.forEach(clearTimeout);
      if (iptalEdilen.has(id)) { iptalSonu(id, istek.kredi, gonderildi); return; }
      // Sunucuya ulaşılamadı (çevrimdışı vb.): sahte "tamam" yerine hata. Sunucu yanıt veremediyse kesintiyi iade eder;
      // ekrandaki ayırma geri alınır ve bakiye sunucudan yeniden okunur.
      ayirmaBirak(id);
      bakiyeyiTazele();
      projeler.guncelle(id, { durum: "hata", ilerleme: 0 });
      bildir({
        kategori: "uretim", tur: "hata", baslik: "Üretim tamamlanamadı",
        mesaj: `"${istek.baslik}" · Sunucuya ulaşılamadı.${istek.kredi > 0 ? " Kesilen kredi sunucuda iade edilir." : ""} Bağlantını kontrol edip yeniden dene.`,
        link: `/panel/kitaplik?u=${id}`, uretimId: id,
      });
    } finally {
      ayirmaBirak(id);
      kesiciler.delete(id);
      iptalEdilen.delete(id);
      slotBirak(grup);
    }
  })();

  return { ok: true, id };
}
