"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModelTur } from "@/lib/catalog";
import { SEED_URETIMLER } from "@/lib/seed-uretimler";
import { onizlemeArka } from "@/lib/utils";

// Üretim türüne göre stok görsel kategorisi (uretimMotoru ile aynı mantık).
function turKategori(tur: string): string {
  return tur === "video" ? "sinematik" : tur === "3d" ? "3d" : tur === "ses" ? "soyut" : "portre";
}
// Eski kayıtların gradyan gorselUrl'ünü gerçek stok görselle değiştirir (Higgsfield birebir dolu görünüm).
// Gerçek çıktı (data:/http/stok) olanlara dokunmaz; yalnızca salt-gradyan olanları yükseltir.
function gorseliYukselt(u: Uretim): Uretim {
  if (u.tur === "ses" && u.sesUrl) return u; // ses zaten sesUrl kullanır
  const g = u.gorselUrl;
  const gercek = g && (g.includes("/stok/") || g.startsWith("data:") || g.startsWith("http") || g.startsWith("/"));
  if (gercek) return u; // zaten gerçek görsel/stok var
  // Salt gradyan (veya boş) → deterministik stok görselle doldur
  return { ...u, gorselUrl: onizlemeArka((u.prompt || u.baslik) + u.model, turKategori(u.tur)) };
}

/** Bu süreden eski "işleniyor" kayıtları yarıda kalmış sayılır. */
export const YARIM_ESIK = 15 * 60_000;

export interface Uretim {
  id: string;
  baslik: string;
  tur: ModelTur;
  model: string;
  prompt: string;
  durum: "kuyrukta" | "isleniyor" | "tamam" | "hata";
  ilerleme: number;
  /** İşin sağlayıcıda başladığı an (sıradan çıkış) — geçen süre bundan hesaplanır. */
  baslama?: number;
  /** Başarısızlık/iptal nedeni (kartta gösterilir). */
  hata?: string;
  gorselUrl?: string; // önizleme (gradient/placeholder veya gerçek görsel)
  sesUrl?: string; // gerçek ses çıktısı (data-uri/http)
  videoUrl?: string; // gerçek video çıktısı (Replicate http)
  glbUrl?: string; // gerçek 3D model (Meshy GLB)
  thumbnailUrl?: string; // 3D önizleme görseli
  varyasyonlar?: { thumb: string; glb?: string }[]; // Meshy: bir üretimde 4 aday model
  secilenVaryasyon?: number; // kullanıcının seçtiği varyasyon indeksi
  topoloji?: { poligon: number; tip: "quad" | "triangle"; pbr: boolean }; // 3D mesh bilgisi
  animasyonlar?: string[]; // uygulanan animasyon preset adları (Yürü/Koş/Dans…)
  etiketler?: string[]; // kullanıcının modele eklediği etiketler (Meshy: Etiket Ekle)
  poz?: string; // uygulanan poz preset adı (Yumruk/Savunma/Diz Çök…)
  dokuCozunurluk?: string; // "2K" | "4K" (retexture)
  muzik?: { sozler?: string; tur?: string; ruhHali?: string[]; bpm?: number; key?: string; vokal?: string; sure?: number; dil?: string; kapak?: string; enstrumanlar?: string[]; varyant?: number }; // müzik/şarkı meta
  olusturma: number;
  kredi: number;
  favori?: boolean;
  yayinda?: boolean; // Keşfet topluluğunda yayınlandı mı
  arac?: string; // hangi araç/studio üretti
  /* hamIstem: kullanıcının YAZDIĞI istem — `prompt` alanına üretim sırasında
     ayar notları ekleniyor (" · 4K", " · 1 referans görsele sadık kal" …).
     "Bu ayarlarla üret" composer'a bu ham metni yazar; `prompt` yazılsaydı
     notlar her geri yüklemede birikirdi. */
  meta?: { oran?: string; cozunurluk?: string; sure?: string; taslak?: { cozunurluk?: string; sure?: string }; kurulum?: Record<string, unknown>; demoKlip?: { video: string; poster: string }; hizEgri?: string; tempo?: string; ses?: string; gorselUrl?: string; hamIstem?: string; kaynakId?: string; surumTur?: string; sahneDiyalog?: { kim: string; metin: string; ton?: string }[]; sesNotu?: string; diyalogDili?: string; yenidenKok?: string; ucretsiz?: boolean; sesHak?: string; akis?: boolean; boyutKb?: number; bitisKareUrl?: string; hareket?: string; bitHizi?: string; cokCekim?: boolean; cekimler?: { istem: string; sn: number }[]; sinirsiz?: boolean; mod?: string; dil?: string; hiz?: number; kararlilik?: number; benzerlik?: number; stil?: number; sesId?: string; hedefDil?: string; kaynakDil?: string; konusmaciSayisi?: number; gurultuTemizle?: boolean; kaynakAd?: string; kaynakUrl?: string; videoUrl?: string; karakter?: number; paylasimSahibi?: string; paylasimId?: string; bicim?: string; tohum?: number; diyalog?: { metin: string; sesId: string; ses?: string; sahip?: string }[]; efektSn?: number; dongu?: boolean; istemEtkisi?: number; elementler?: { ad: string; tur: string }[]; islem?: import("@/lib/saglayicilar/tipler").GorselIslem; referanslar?: string[]; stilRefler?: string[]; stilGuc?: "hafif" | "dengeli" | "guclu"; demoOrnek?: string; maskeUrl?: string; negatif?: string; seffaf?: boolean; kalite?: string; vektor?: boolean; yonlendirme?: number; adim?: number; renkler?: string[]; stilAd?: string; urunGorsel?: string; stilIstem?: string; refRolleri?: string[]; zemin?: string; apiModel?: string; cozulenModel?: string; gonderilenIstem?: string; pano?: string; palet?: string; gelistir?: boolean; giysi?: { kategori?: string; foto?: string; mod?: string }; normalizasyon?: "auto" | "on" | "off"; telaffuz?: { kelime: string; okunus: string }[]; ortam?: { filtre?: string; gurultu?: string; mekan?: string; mesafe?: number }; zamanDamgasi?: boolean; konusmaciGuclendir?: boolean; kelimeler?: { k: string; b: number; s: number; kon?: string }[]; transkript?: string; algilananDil?: string; sureSn?: number; grupId?: string; sira?: number; motor?: string; yon?: string; kanvas?: { w: number; h: number; x: number; y: number; gw: number; gh: number }; istemsiz?: boolean; lora?: { url: string; olcek?: number }; sadakat?: "siki" | "dengeli" | "serbest"; saglayiciGorev?: { id: string; tur: string }; kaynakGorev?: { id?: string; tur?: string }; kaynakGlb?: string; dosyalar?: Record<string, string> }; // gerçekçi çıktı bilgisi; kaynakId: bu üretimin türetildiği üretim (sürüm zinciri)
  saglayici?: string; // "eleven" | "meshy" | "openai" | "replicate" | "simulasyon"
  gercek?: boolean; // gerçek API çıktısı mı, demo mu
  projeId?: string; // bu üretimin ait olduğu ortak proje (useProje). undefined = bağımsız üretim
}

/** Çöp kutusundaki üretim — 30 gün sonra kalıcı silinir. */
export type CoptekiUretim = Uretim & { silinme: number };
export const COP_SURE_GUN = 30;

interface ProjelerState {
  uretimler: Uretim[];
  /** Kitaplıktan silinen üretimler (geri alınabilir). */
  cop: CoptekiUretim[];
  copeTasi: (idler: string[]) => void;
  copGeriAl: (idler: string[]) => void;
  kaliciSil: (idler: string[]) => void;
  copuBosalt: () => void;
  ekle: (u: Omit<Uretim, "id" | "olusturma">) => string;
  guncelle: (id: string, patch: Partial<Uretim>) => void;
  sil: (id: string) => void;
  favoriToggle: (id: string) => void;
  temizle: () => void;
}

let sayac = 0;
function yeniId() {
  sayac += 1;
  /* DİKKAT: `sayac` ve `performance.now()` ikisi de SAYFA YENİLENİNCE sıfırlanır.
     Yalnız bu ikisiyle üretilen id, yeniden yüklenmiş sayfada birebir tekrar
     edebiliyordu → localStorage'daki eski üretimle çakışıp React'te
     "two children with the same key" hatası veriyordu (ızgara bozuluyordu).
     Date.now() (duvar saati) + rastgele son ek çakışmayı kesin engeller. */
  return `u_${sayac}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useProjeler = create<ProjelerState>()(
  persist(
    (set) => ({
      // İlk ziyaret (boş localStorage): deterministik seed'lerle DOLU başla.
      // Kullanıcı bir üretim yaptığında persist devreye girer ve sonraki
      // ziyarette localStorage'daki kendi verisi bu initial state'i geçersiz kılar.
      // SEED_URETIMLER tamamen deterministik olduğu için bu initial state SSR-güvenli.
      uretimler: SEED_URETIMLER,
      cop: [],
      copeTasi: (idler) => set((s) => {
        const simdi = Date.now();
        const tasinan = s.uretimler.filter((x) => idler.includes(x.id)).map((x) => ({ ...x, silinme: simdi }));
        return { uretimler: s.uretimler.filter((x) => !idler.includes(x.id)), cop: [...tasinan, ...s.cop] };
      }),
      copGeriAl: (idler) => set((s) => {
        const geri = s.cop.filter((x) => idler.includes(x.id)).map(({ silinme: _s, ...u }) => u as Uretim);
        return { cop: s.cop.filter((x) => !idler.includes(x.id)), uretimler: [...geri, ...s.uretimler].sort((a, b) => b.olusturma - a.olusturma) };
      }),
      kaliciSil: (idler) => set((s) => ({ cop: s.cop.filter((x) => !idler.includes(x.id)) })),
      copuBosalt: () => set({ cop: [] }),
      ekle: (u) => {
        const id = yeniId();
        const yeni: Uretim = { ...u, id, olusturma: Date.now() };
        set((s) => ({ uretimler: [yeni, ...s.uretimler] }));
        return id;
      },
      guncelle: (id, patch) =>
        set((s) => ({
          uretimler: s.uretimler.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      sil: (id) => set((s) => ({ uretimler: s.uretimler.filter((x) => x.id !== id) })),
      favoriToggle: (id) =>
        set((s) => ({
          uretimler: s.uretimler.map((x) =>
            x.id === id ? { ...x, favori: !x.favori } : x,
          ),
        })),
      temizle: () => set({ uretimler: [] }),
    }),
    {
      name: "vayra-projeler",
      version: 4,
      // v2: eski kullanıcıların GRADYAN gorselUrl'lü üretimlerini gerçek stok görsele yükseltir.
      // v3: `projeId?` alanı eklendi (ortak proje mimarisi). Eski üretimler projeId olmadan kalır
      // ("bağımsız üretim") — VERİ KAYBI YOK. Kullanıcı verisi korunur, seed'lerle ezilmez.
      // v4: örnek (seed_*) üretimler istemleriyle eşleşen gerçek görsellere geçti; kullanıcının
      // favori/yayın işaretleri korunur, kendi üretimlerine dokunulmaz.
      migrate: (persisted) => {
        const s = persisted as ProjelerState;
        if (s && Array.isArray(s.uretimler)) {
          const ornek = new Map(SEED_URETIMLER.map((u) => [u.id, u]));
          return {
            ...s,
            uretimler: s.uretimler.map((u) => {
              const y = ornek.get(u.id);
              return y ? { ...y, favori: u.favori, yayinda: u.yayinda, projeId: u.projeId, etiketler: u.etiketler } : gorseliYukselt(u);
            }),
          };
        }
        return s;
      },
      // Süresi (30 gün) dolan çöp kayıtları her açılışta kalıcı olarak temizlenir.
      onRehydrateStorage: () => (st) => {
        // Sayfa kapanınca isteği kesilen üretimler sonsuza dek "işleniyor" kalmasın: 15 dakikadan eski
        // süren işler yarıda kaldı olarak işaretlenir. Kredi sunucuda kesilir ve bağlantı kesilince sunucuda iade edilir;
        // burada yalnız bakiye sunucudan yeniden okunur (istemci ayrıca iade bildirmez, çift iade olmasın).
        const yarim = st?.uretimler?.filter((u) => (u.durum === "isleniyor" || u.durum === "kuyrukta") && Date.now() - (u.baslama ?? u.olusturma) > YARIM_ESIK) ?? [];
        // Depo değişkeni oluşmadan (eşzamanlı yükleme) setState çağrılamaz: bir sonraki tikte uygula.
        if (yarim.length) setTimeout(() => {
          const ids = new Set(yarim.map((u) => u.id));
          useProjeler.setState((s) => ({ uretimler: s.uretimler.map((u) => (ids.has(u.id) ? { ...u, durum: "hata" as const, ilerleme: 0, hata: "Yarıda kaldı: sayfa kapanınca üretim tamamlanamadı. Kesilen kredi sunucuda iade edildi." } : u)) }));
          if (yarim.some((u) => u.kredi > 0)) void import("@/store/useAuth").then((m) => m.useAuth.getState().esitle());
        }, 0);
        if (!st?.cop?.length) return;
        const esik = Date.now() - COP_SURE_GUN * 86_400_000;
        const kalan = st.cop.filter((x) => x.silinme > esik);
        if (kalan.length !== st.cop.length) setTimeout(() => useProjeler.setState({ cop: kalan }), 0);
      },
    },
  ),
);
