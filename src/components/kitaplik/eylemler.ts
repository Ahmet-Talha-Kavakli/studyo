"use client";

import { upscaleAdresi } from "@/lib/upscaleVeri";
import { toast } from "@/lib/toast";
import { useProjeler, type Uretim } from "@/store/useProjeler";
import { useProje } from "@/store/useSinema";
import { useReferansKopru } from "@/store/useReferansKopru";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { uretimIndir } from "@/lib/gercekEylem";
import { kapakUrl, turBul, uretimTuru, zipIndir } from "./yardimci";

/* ── Düzenleme araçları ──
   Her araç gerçek bir üretim başlatır: kaynak üretim meta.gorselUrl ile girdi olur,
   meta.kaynakId ile sürüm zincirine bağlanır. Kredi bedeli katalogdaki araçla aynıdır. */
export type AracId = "buyut" | "iyilestir" | "isik" | "genislet" | "arkaplan" | "videoyap" | "varyasyon";
export interface AracTanim {
  id: AracId; ad: string; ozet: string; model: string; kredi: number;
  turler: ("gorsel" | "video" | "ses" | "muzik" | "3d")[];
  secenekler?: { ad: string; degerler: string[] };
}
export const ARAC_TANIMLARI: AracTanim[] = [
  { id: "varyasyon", ad: "Varyasyon", ozet: "Aynı istem ve modelle yeni bir sürüm.", model: "", kredi: 0, turler: ["gorsel", "video", "ses", "muzik", "3d"] },
  { id: "buyut", ad: "Büyüt", ozet: "Büyüt stüdyosunda aç: model, ölçek ve önce/sonra karşılaştırma.", model: "Büyüt", kredi: 0, turler: ["gorsel", "video"] },
  { id: "iyilestir", ad: "Cilt iyileştirici", ozet: "Doğal, gerçekçi cilt dokusu.", model: "Vayra Skin", kredi: 3, turler: ["gorsel"], secenekler: { ad: "Doku", degerler: ["Doğal", "Yumuşak", "Gerçekçi"] } },
  { id: "isik", ad: "Yeniden ışıklandır", ozet: "Işığın yönünü, rengini ve havasını değiştir.", model: "Vayra Relight", kredi: 4, turler: ["gorsel"], secenekler: { ad: "Işık", degerler: ["Altın saat", "Stüdyo", "Neon", "Gece", "Bulutlu"] } },
  { id: "genislet", ad: "Genişlet", ozet: "Kareyi yeni bir orana taşı, kenarları tamamla.", model: "Görsel Genişlet", kredi: 3, turler: ["gorsel"], secenekler: { ad: "Oran", degerler: ["16:9", "9:16", "1:1", "4:5", "21:9"] } },
  { id: "arkaplan", ad: "Arka planı kaldır", ozet: "Özneyi ayır, şeffaf arka planla çıkar.", model: "Arka Plan Kaldır", kredi: 2, turler: ["gorsel", "video"] },
  { id: "videoyap", ad: "Videoya çevir", ozet: "Görseli 5 saniyelik videoya dönüştür.", model: "Kling 3.0", kredi: 40, turler: ["gorsel"] },
];
export const araclarFor = (u: Uretim) => ARAC_TANIMLARI.filter((a) => a.turler.includes(uretimTuru(u)));

export function aracKredi(a: AracTanim, u: Uretim) {
  if (a.id === "varyasyon") return u.kredi || 4;
  if (a.id === "arkaplan" && u.tur === "video") return 7;
  return a.kredi;
}

export function aracUygula(u: Uretim, a: AracTanim, secenek?: string): string | null {
  const kaynak = kapakUrl(u);
  const temel = u.meta?.hamIstem || u.prompt || u.baslik;
  const ek = secenek ? ` · ${secenek}` : "";
  const video = a.id === "videoyap" || (u.tur === "video" && a.id !== "varyasyon");
  const s = uretimBaslat({
    baslik: a.id === "varyasyon" ? u.baslik : `${u.baslik} — ${a.ad}${ek}`,
    tur: a.id === "varyasyon" ? u.tur : video ? "video" : "gorsel",
    model: a.id === "varyasyon" ? u.model : a.model,
    prompt: a.id === "varyasyon" ? `${temel} · varyasyon` : `${temel} · ${a.ad.toLocaleLowerCase("tr-TR")}${ek}`,
    kredi: aracKredi(a, u),
    arac: a.id === "varyasyon" ? u.arac ?? "Kitaplık" : a.ad,
    projeId: u.projeId,
    meta: {
      oran: a.id === "genislet" && secenek ? secenek : u.meta?.oran,
      cozunurluk: a.id === "buyut" ? (secenek === "4x" ? "4K" : "2K") : u.meta?.cozunurluk,
      sure: a.id === "videoyap" ? "5 sn" : u.meta?.sure,
      gorselUrl: kaynak,
      hamIstem: temel,
      kaynakId: u.id,
    },
  });
  if (!s.ok) { uretimHataToast(s, `${a.ad} başlatılamadı`); return null; }
  toast.success(`${a.ad} başladı`, { description: "Hazır olunca Kitaplık'ta ve bildirimlerde görünecek." });
  return s.id ?? null;
}

/** Büyüt stüdyosu adresi (kaynak = üretimin kendisi). */
export function buyutAdresi(u: Uretim): string | null {
  const url = u.tur === "video" ? u.videoUrl : kapakUrl(u);
  return url && /^(\/|https:\/\/|data:image\/)/.test(url) ? upscaleAdresi(url, u.id) : null;
}

/** Aynı istem ve ayarlarla ilgili stüdyoyu aç (istem doldurulmuş). */
export const ayarlarlaAcAdres = (u: Uretim) => `${turBul(uretimTuru(u)).studyo}?istem=${encodeURIComponent(u.meta?.hamIstem || u.prompt || u.baslik)}`;

/** Üretimi stüdyo composer'ına referans olarak taşı. */
export function referansOlarakKullan(u: Uretim): string | null {
  const url = kapakUrl(u);
  if (!url) { toast.error("Referans olarak eklenemedi", { description: "Bu varlığın kullanılabilir bir görseli yok. Görseli ya da videosu olan bir varlık seç." }); return null; }
  const hedefTur = u.tur === "video" ? "video" : "gorsel";
  useReferansKopru.getState().gonder({ url, tur: hedefTur, baslik: u.baslik, prompt: u.prompt });
  toast.success("Referans olarak eklendi", { description: "Stüdyonun komut kutusuna taşındı." });
  return hedefTur === "video" ? "/panel/video" : "/panel/gorsel";
}

/* ── Düzen ── */
export function projeyeTasi(idler: string[], projeId: string) {
  const p = useProje.getState();
  idler.forEach((id) => p.uretimBagla(projeId, id));
  useProjeler.setState((s) => ({ uretimler: s.uretimler.map((u) => (idler.includes(u.id) ? { ...u, projeId } : u)) }));
  const ad = p.projeler.find((x) => x.id === projeId)?.ad ?? "proje";
  toast.success(`${idler.length} varlık "${ad}" projesine eklendi`);
}
export function projedenCikar(idler: string[], projeId: string) {
  const p = useProje.getState();
  idler.forEach((id) => p.uretimCoz(projeId, id));
  useProjeler.setState((s) => ({ uretimler: s.uretimler.map((u) => (idler.includes(u.id) && u.projeId === projeId ? { ...u, projeId: undefined } : u)) }));
  toast.success(`${idler.length} varlık projeden çıkarıldı`);
}

export function copeTasi(idler: string[]) {
  const p = useProje.getState();
  p.projeler.forEach((pr) => idler.forEach((id) => {
    if ((pr.uretimIdler ?? []).includes(id) || (pr.shortsKlipleri ?? []).includes(id)) p.uretimCoz(pr.id, id);
  }));
  useProjeler.getState().copeTasi(idler);
  toast(`${idler.length} varlık çöp kutusuna taşındı`, {
    description: "30 gün içinde geri alabilirsin.",
    action: { label: "Geri al", onClick: () => useProjeler.getState().copGeriAl(idler) },
  });
}

export function yayinla(idler: string[], deger: boolean) {
  const g = useProjeler.getState().guncelle;
  idler.forEach((id) => g(id, { yayinda: deger }));
  toast.success(deger ? `${idler.length} varlık Keşfet'te yayınlandı` : `${idler.length} varlık yayından kaldırıldı`);
}

export function favoriYap(idler: string[], deger: boolean) {
  const g = useProjeler.getState().guncelle;
  idler.forEach((id) => g(id, { favori: deger }));
}

export function etiketEkle(idler: string[], etiket: string) {
  const temiz = etiket.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, "-").slice(0, 24);
  if (!temiz) return;
  useProjeler.setState((s) => ({ uretimler: s.uretimler.map((u) => (idler.includes(u.id) && !(u.etiketler ?? []).includes(temiz) ? { ...u, etiketler: [...(u.etiketler ?? []), temiz] } : u)) }));
  toast.success(`#${temiz} etiketi ${idler.length} varlığa eklendi`);
}
export function etiketCikar(id: string, etiket: string) {
  useProjeler.setState((s) => ({ uretimler: s.uretimler.map((u) => (u.id === id ? { ...u, etiketler: (u.etiketler ?? []).filter((e) => e !== etiket) } : u)) }));
}

export const paylasimBaglantisi = (u: Uretim) => (typeof window === "undefined" ? "" : `${window.location.origin}/kesfet?u=${u.id}`);

export function indir(liste: Uretim[]) {
  if (liste.length === 1) { uretimIndir(liste[0]); return; }
  const t = toast.loading(`${liste.length} dosya paketleniyor`);
  zipIndir(liste, `vayra-kitaplik-${new Date().toISOString().slice(0, 10)}.zip`).then(({ eklenen, atlanan }) => {
    toast.dismiss(t);
    toast.success(`${eklenen} dosya ZIP olarak indirildi`, { description: atlanan ? `${atlanan} dosyaya erişilemedi; künye dosyasında listelendi.` : "Künye dosyası (istem, model, tarih) pakete eklendi." });
  }).catch(() => { toast.dismiss(t); toast.error("ZIP oluşturulamadı", { description: "Dosyalar paketlenemedi. Daha az dosya seçip yeniden dene ya da tek tek indir." }); });
}
