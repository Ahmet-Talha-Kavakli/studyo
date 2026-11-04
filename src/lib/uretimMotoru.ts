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
import { bildir, OTO_YUKLEME_ESIGI } from "./bildirimler";
import { KREDI_PAKETLERI } from "./fiyat";
import { hareketYaz, KDV_ORANI } from "@/store/useHesap";
import { gradientOnizleme, onizlemeArka } from "./utils";
import { kategoriEtiket, type IhlalKategori } from "./moderasyon";
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

/* Araç başına demo örnek havuzu — sağlayıcı yokken sonuç kartı konuyla ilgili bir örnek gösterir
   (kartta ve görüntüleyicide "DEMO · örnek görsel" yazar; kullanıcının girdisinden üretilmiş değildir). */
const ARAC_DEMO: Record<string, string[]> = {
  "Karakter": [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `/gercek/panel/gal-soul2-${i}.webp`),
  "Moda Fabrikası": ["bold", "gradient", "noir", "pastel", "sky", "street"].map((d) => `/gercek/arac/fashion-${d}.webp`).concat([1, 2, 3].map((i) => `/gercek/paz/paz-prosanal-${i}.webp`)),
  "Ruh Panosu": [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `/gercek/panel/gal-soulcinema-${i}.webp`),
  "Sinema Stüdyosu": ["cs-hero-avci", "cs-hero-kokboru", "cs-hero-sessiz", "cs-p1", "cs-p2", "cs-p3", "sh-city", "sh-dune", "sh-hero", "sh-open", "sh-street", "sh-tension", "top-4k", "top-gothic", "top-kokboru", "top-nala", "tur-Dram", "tur-Noir", "tur-Korku", "tur-Epik"].map((d) => `/gercek/sinema/${d}.webp`),
  "Uzun Video": ["cs-hero-avci", "cs-hero-kokboru", "cs-hero-sessiz", "cs-p1", "cs-p2", "cs-p3", "sh-city", "sh-dune", "sh-hero", "sh-open", "sh-street", "sh-tension", "top-gothic", "top-nala", "tur-Dram", "tur-Noir"].map((d) => `/gercek/sinema/${d}.webp`),
  "Photodump": ["panel/photodump0", "panel/photodump2", "kesfet/altin-saat-portresinano-banana-pro", "moodboard/mood-flash", "moodboard/mood-night", "moodboard/mood-oldphone", "moodboard/mood-street", "moodboard/mood-warm", "moodboard/mood-swag", "panel/gal-soulcinema-2", "panel/gal-soulcinema-0", "arac/winter0"].map((d) => `/gercek/${d}.webp`),
  "Instadump": ["arac/aura1", "arac/street0", "panel/photodump0", "kesfet/altin-saat-portresinano-banana-pro", "moodboard/mood-flash", "moodboard/mood-night", "moodboard/mood-pastel", "moodboard/mood-y2k", "moodboard/mood-retro", "moodboard/mood-swag", "arac/winter0", "panel/gal-soul2-3"].map((d) => `/gercek/${d}.webp`),
};
function aracDemo(arac: string | undefined, tohum: string): string | null {
  const l = arac ? ARAC_DEMO[arac] : undefined;
  if (!l?.length) return null;
  let h = 0;
  for (let i = 0; i < tohum.length; i++) h = (h * 31 + tohum.charCodeAt(i)) >>> 0;
  return `url("${l[h % l.length]}") center/cover no-repeat, ${gradientOnizleme(tohum)}`;
}

/* Demo video havuzu — sağlayıcı bağlı değilken video üretimi hareketsiz bir kare yerine
   gerçek bir klip oynatır (kartta "Demo" etiketiyle). Yalnız siyah şeritsiz, yeterince
   aydınlık klipler seçildi; posterler klibin kendi karesidir (kart ile oynatıcı aynı görünür). */
const DEMO_KLIPLER = ["drone-orbit", "dolly-out", "jib-up", "tilt-up", "focus-pull", "handheld", "orbit-left", "orbit-right", "fpv-dive", "push-to-glass"];
/** Yatay (16:9 ve daha geniş) istekler için yatay demo klipler — dikey klip yatay isteğe gösterilmesin. */
const DEMO_YATAY = ["hero-video", "hero-3d", "seedance-banner"];
function demoVideo(tohum: string, oran?: string): { videoUrl: string; gorselUrl: string } {
  let h = 0;
  for (let i = 0; i < tohum.length; i++) h = (h * 31 + tohum.charCodeAt(i)) >>> 0;
  const [w, y] = (oran ?? "").split(":").map(Number);
  if (w && y && w > y) {
    const ad = DEMO_YATAY[h % DEMO_YATAY.length];
    return { videoUrl: `/gercek/hero-video/${ad}.mp4`, gorselUrl: `url("/gercek/hero-video/${ad}-poster.webp") center/cover no-repeat` };
  }
  const ad = DEMO_KLIPLER[h % DEMO_KLIPLER.length];
  return {
    videoUrl: `/gercek/video-hareket/${ad}.mp4`,
    gorselUrl: `url("/gercek/video-hareket/${ad}-poster.webp") center/cover no-repeat`,
  };
}

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
  meta?: { oran?: string; cozunurluk?: string; sure?: string; taslak?: { cozunurluk?: string; sure?: string }; kurulum?: Record<string, unknown>; demoKlip?: { video: string; poster: string }; hizEgri?: string; tempo?: string; ses?: string; gorselUrl?: string; videoUrl?: string; hamIstem?: string; kaynakId?: string; surumTur?: string; sahneDiyalog?: { kim: string; metin: string; ton?: string }[]; sesNotu?: string; diyalogDili?: string; yenidenKok?: string; ucretsiz?: boolean; akis?: boolean; bitisKareUrl?: string; hareket?: string; bitHizi?: string; cokCekim?: boolean; cekimler?: { istem: string; sn: number }[]; sinirsiz?: boolean; mod?: string; dil?: string; hiz?: number; kararlilik?: number; benzerlik?: number; stil?: number; sesId?: string; hedefDil?: string; kaynakDil?: string; konusmaciSayisi?: number; gurultuTemizle?: boolean; kaynakAd?: string; karakter?: number; paylasimSahibi?: string; bicim?: string; tohum?: number; diyalog?: { metin: string; sesId: string; ses?: string; sahip?: string }[]; efektSn?: number; dongu?: boolean; istemEtkisi?: number;
    /** İstemdeki @elementler: ad + tür (kayıtta gösterim için). Görseller `girdi.referanslar` ile gider. */
    elementler?: { ad: string; tur: string }[];
    /* Görsel: işlem ve gerçek parametreler (bkz. saglayicilar/tipler). */
    islem?: GorselIslem; referanslar?: string[]; stilRefler?: string[]; stilGuc?: "hafif" | "dengeli" | "guclu"; demoOrnek?: string; urunGorsel?: string; maskeUrl?: string; negatif?: string; seffaf?: boolean; kalite?: string; vektor?: boolean; yonlendirme?: number; adim?: number; renkler?: string[]; stilAd?: string; stilIstem?: string; refRolleri?: string[]; zemin?: string; pano?: string; palet?: string; gelistir?: boolean; grupId?: string; sira?: number; motor?: string; yon?: string; kanvas?: { w: number; h: number; x: number; y: number; gw: number; gh: number }; istemsiz?: boolean; lora?: { url: string; olcek?: number }; giysi?: { kategori?: string; foto?: string; mod?: string }; sadakat?: "siki" | "dengeli" | "serbest" };
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
function tamamBildirimi(istek: UretimIstek, id: string, ek: "" | "demo") {
  const u = useProjeler.getState().uretimler.find((x) => x.id === id);
  const aday = u?.thumbnailUrl ?? u?.gorselUrl;
  // Gradyan yer tutucular küçük resim olamaz; yalnız gerçek görsel yolları alınır.
  const gorsel = aday && /^(\/|https?:|data:image)/.test(aday) ? aday : undefined;
  const link = `/panel/kitaplik?u=${id}`;
  return {
    kategori: "uretim" as const, tur: "basari" as const,
    baslik: `${TUR_ADI[istek.tur] ?? "Üretim"} hazır`,
    mesaj: `"${istek.baslik}" · ${istek.model}.${ek === "demo" ? ` Örnek çıktı${istek.kredi > 0 ? ", kredi iade edildi." : "."}` : ""}`,
    demo: ek === "demo" || undefined,
    gorsel, link, eylem: { ad: "Görüntüle", link }, uretimId: id,
  };
}

/**
 * Gerçek çalışır üretim akışı:
 * kredi kontrol → düş → kuyruğa ekle → deterministik progress →
 * /api/uretim'e POST (anahtar varsa GERÇEK sağlayıcı: ElevenLabs/Meshy/OpenAI/Replicate,
 * yoksa simülasyon) → gerçek çıktıyı yerleştir → bildirim.
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

function sinir(grup: IsGrubu): number {
  const plan = useAuth.getState().kullanici?.plan ?? "baslangic";
  const anahtar = (plan === "kurumsal" ? "ultra" : plan) as keyof typeof ESZAMANLI;
  return ESZAMANLI[anahtar]?.[grup] ?? 1;
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
    if (i >= 0) { bekleyen[g].splice(i, 1); iptalSonu(id, u.kredi); return true; }
  }
  const k = kesiciler.get(id);
  if (k) { k.abort(); return true; }
  iptalSonu(id, u.kredi);
  return true;
}
function iptalSonu(id: string, kredi: number) {
  if (kredi > 0) useAuth.getState().krediEkle(kredi);
  useProjeler.getState().guncelle(id, { durum: "hata", ilerleme: 0, hata: "İptal edildi", kredi: 0 });
  toast("Üretim iptal edildi", kredi > 0 ? { description: `${kredi} kredi bakiyene iade edildi.` } : undefined);
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
  auth.krediDus(istek.kredi);

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

  // Otomatik kredi yükleme (Ayarlar › Abonelik): bakiye 100'ün altına inince seçili paket yüklenir, makbuz kesilir.
  const tercih = useTercih.getState();
  if (tercih.otomatikYukleme && kalanKredi < OTO_YUKLEME_ESIGI) {
    const p = KREDI_PAKETLERI.find((x) => x.kredi === tercih.otoPaket) ?? KREDI_PAKETLERI.find((x) => x.populer)!;
    auth.ekKrediEkle(p.kredi);
    hareketYaz({ tur: "kredi", aciklama: `Otomatik yükleme · ${p.kredi.toLocaleString("tr-TR")} kredi`, kredi: p.kredi, tutar: p.fiyat, kdv: Math.round(p.fiyat * KDV_ORANI), belge: true });
    bildirim.ekle({ kategori: "hesap", tur: "basari", baslik: "Otomatik yükleme yapıldı", mesaj: `Bakiyen azaldığı için ${p.kredi.toLocaleString("tr-TR")} kredi yüklendi.`, link: "/panel/ayarlar/faturalar" });
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

  // Ortak proje mimarisi: üretim bir projeye aitse o projenin uretimIdler'ine bağla (çift-yönlü erişim).
  if (istek.projeId) {
    try { useProje.getState().uretimBagla(istek.projeId, id, istek.arac === "Shorts Stüdyosu" ? "shorts" : "genel"); } catch { /* proje store hazır değilse sessiz geç */ }
  }

  // İşleme animasyonu — gerçek ilerleyen progress (API yanıtı gelene kadar akar)
  // Hız kademesi (Hız & Güç): Standart 1× · Öncelikli 2× · Turbo 4× — progress o oranda hızlı akar.
  const hizCarpani = [1, 2, 4][useTercih.getState().hizKademe] ?? 1;
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

  // Minimum "işleniyor" süresi — demo/simülasyon API'si anında dönse bile kullanıcı
  // süreç animasyonunu (spinner + progress) yaşasın (Higgsfield hissi). Türe göre gerçekçi süre.
  const tabanSure = istek.tur === "video" ? 2800 : istek.tur === "3d" ? 3200 : istek.tur === "ses" ? 2000 : 2300;
  const minSure = tabanSure / hizCarpani;
  let baslangic = performance.now();
  const grup = grupBul(istek.tur);
  const kesici = new AbortController();
  kesiciler.set(id, kesici);

  // Gerçek üretim çağrısı — arka planda, progress animasyonuyla örtüşür.
  (async () => {
    // Gerçek API çıktısı yoksa: gradyan yerine GERÇEK stok görsel (türüne uygun kategori).
    // Tohuma üretim kimliği de girer: aynı istemle yapılan varyasyonlar demo modunda farklı önizleme alır.
    // Düzenleme işlemlerinde (maske, sil, arka plan, genişlet…) demo çıktısı kaynağın kendisidir: düzenleme uygulanmadı.
    const duzenlemeKaynagi = apiTuru(istek.tur) === "gorsel" && istek.meta?.islem && !["uret", "giydir"].includes(istek.meta.islem) && istek.meta.gorselUrl
      ? `url("${istek.meta.gorselUrl}") center/cover no-repeat, ${gradientOnizleme(id)}` : null;
    // Karakter: demo çıktısı karakterin kendi referans fotoğrafıdır (yabancı bir yüz gösterilmez).
    const karRef = istek.arac === "Karakter" ? istek.girdi?.referanslar?.[0]?.gorseller?.filter(Boolean) : undefined;
    const karakterDemo = karRef?.length ? `url("${karRef[Math.floor(Math.random() * karRef.length)]}") center/cover no-repeat, ${gradientOnizleme(id)}` : null;
    // Instadump gibi paketli araçlar karenin örneğini kendisi seçer (paketin kendi örnek karesi).
    const ornekDemo = istek.meta?.demoOrnek ? `url("${istek.meta.demoOrnek}") center/cover no-repeat, ${gradientOnizleme(id)}` : null;
    const yedekOnizleme = (istek.meta?.islem === "cizim" || istek.meta?.islem === "eskiz" ? ornekDemo : null) ?? duzenlemeKaynagi ?? karakterDemo ?? ornekDemo ?? (apiTuru(istek.tur) === "gorsel" ? aracDemo(istek.arac, istek.prompt + id) : null) ?? onizlemeArka(istek.prompt + istek.model + id, turKategori(istek.tur));
    await slotAl(grup, id);
    if (iptalEdilen.has(id)) { slotBirak(grup); kesiciler.delete(id); return; }
    animasyonuBaslat();
    baslangic = performance.now();
    try {
      const yanit = await fetch("/api/uretim", {
        signal: kesici.signal,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tur: apiTuru(istek.tur),
          model: istek.model,
          prompt: istek.prompt,
          meta: istek.meta,
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
        detay?: { glb?: string; thumbnail?: string; model?: string; vayraModel?: string; gonderilenIstem?: string; tohum?: number; genislik?: number; yukseklik?: number; kelimeler?: { k: string; b: number; s: number; kon?: string }[]; transkript?: string; sureSn?: number; dil?: string };
      };

      // MODERASYON REDDİ (422) → üretim "hata", KREDİ İADE + bildirim.
      // Kullanıcı isteği: "NFC(+18) içerik üretiminde hata mesajı + kredilerin geri gelmesi."
      if (veri.moderasyon) {
        zamanlayicilar.forEach(clearTimeout);
        auth.krediEkle(istek.kredi); // iade
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
        auth.krediEkle(istek.kredi); // iade
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

      // Gerçek API çıktısı DEĞİLSE (demo) minimum süreyi bekle — progress akıp bitsin (%86'ya dek),
      // kullanıcı gerçek bir "üretiliyor" süreci görsün. Gerçek API ise bekletme (zaten zaman aldı).
      if (!veri.gercek) {
        const kalan = minSure - (performance.now() - baslangic);
        if (kalan > 0) await new Promise((r) => setTimeout(r, kalan));
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
      const dk = istek.meta?.demoKlip;
      const demo = videoMu && !videoLink && !veri.gercek ? (dk ? { videoUrl: dk.video, gorselUrl: `url("${dk.poster}") center/cover no-repeat` } : istek.meta?.demoOrnek ? { videoUrl: undefined, gorselUrl: `url("${istek.meta.demoOrnek}") center/cover no-repeat` } : demoVideo(id, istek.meta?.oran)) : undefined;
      projeler.guncelle(id, {
        durum: "tamam",
        ilerleme: 100,
        // Ses → sesUrl; 3D → thumbnail/gradient gorselUrl'e; görsel → gorselUrl; video → gradient önizleme + videoUrl.
        gorselUrl: sesMi ? yedekOnizleme : (ucBoyutMu ? (thumb ?? yedekOnizleme) : (videoMu ? (demo?.gorselUrl ?? yedekOnizleme) : (cikti ?? yedekOnizleme))),
        ...(sesMi && cikti ? { sesUrl: cikti } : {}),
        ...(videoLink ? { videoUrl: videoLink } : demo?.videoUrl ? { videoUrl: demo.videoUrl } : {}),
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
        // Demo (sağlayıcı bağlı değil): gerçek çıktı yok, kredi alınmaz.
        ...(!veri.gercek ? { kredi: 0 } : {}),
      });
      if (!veri.gercek && istek.kredi > 0) auth.krediEkle(istek.kredi);

      const gercekEk = veri.gercek ? "" : "demo";
      // Kullanıcı "Üretim tamamlandı" bildirimini kapatmışsa bildirim düşürme (Ayarlar tercihi).
      // Derin bağlantı: bildirime tıklayınca kitaplıkta o üretimin lightbox'ı açılır.
      bildir(tamamBildirimi(istek, id, gercekEk));
    } catch {
      zamanlayicilar.forEach(clearTimeout);
      if (iptalEdilen.has(id)) { iptalSonu(id, istek.kredi); return; }
      // Sunucuya ulaşılamadı (çevrimdışı vb.): sahte "tamam" yerine hata + kredi iadesi.
      auth.krediEkle(istek.kredi);
      projeler.guncelle(id, { durum: "hata", ilerleme: 0 });
      bildir({
        kategori: "uretim", tur: "hata", baslik: "Üretim tamamlanamadı",
        mesaj: `"${istek.baslik}" · Sunucuya ulaşılamadı.${istek.kredi > 0 ? ` ${istek.kredi} kredi iade edildi.` : ""} Bağlantını kontrol edip yeniden dene.`,
        link: `/panel/kitaplik?u=${id}`, uretimId: id,
      });
    } finally {
      kesiciler.delete(id);
      iptalEdilen.delete(id);
      slotBirak(grup);
    }
  })();

  return { ok: true, id };
}
