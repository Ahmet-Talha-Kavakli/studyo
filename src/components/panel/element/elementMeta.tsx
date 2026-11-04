"use client";

import { useEffect, useState } from "react";
import { UserRound, MapPin, Box, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { baglantiyiKopyala, uretimIndir } from "@/lib/gercekEylem";
import { useElements, type ElementTur, type VElement } from "@/store/useElements";

/**
 * Element ortak meta'sı — kütüphane, düzenleyici, detay, seçici ve @ girdileri aynı tanımı kullanır.
 * `hex`: cam rozet / renk karışımı için ham renk.
 */
export const TUR_META: Record<ElementTur, {
  ad: string; cogul: string; ikon: typeof UserRound; renk: string; hex: string;
  /** Görsel yuvaları: ilki ana (kapak) görsel. */
  yuvalar: string[];
  ipucu: string; aciklamaYer: string; ornekler: string[];
}> = {
  karakter: {
    ad: "Karakter", cogul: "Karakterler", ikon: UserRound, renk: "text-sky-300", hex: "#7dd3fc",
    yuvalar: ["Ön", "Yan", "Arka", "Yakın plan"],
    ipucu: "Net, iyi aydınlatılmış, yüzü açık bir ön görsel en önemlisi. Yan ve arka açılar farklı sahnelerde tutarlılığı artırır.",
    aciklamaYer: "Ör. 30'lu yaşlarda kadın, omuz hizasında kızıl dalgalı saç, çilli, siyah deri ceket, gümüş kolye.",
    ornekler: ["Yaşı ve yüz hatları", "Saç rengi ve kesimi", "Kıyafet ve aksesuar", "Duruş ve tavır"],
  },
  mekan: {
    ad: "Mekân", cogul: "Mekânlar", ikon: MapPin, renk: "text-emerald-300", hex: "#6ee7b7",
    yuvalar: ["Geniş plan", "Farklı açı", "Detay", "Işık"],
    ipucu: "Mekânı bütünüyle gösteren geniş bir görsel seç; farklı açılar sahne geçişlerinde tutarlılık sağlar.",
    aciklamaYer: "Ör. Yağmurlu gece, dar Tokyo arka sokağı, pembe-mavi neon tabelalar, ıslak asfaltta yansımalar.",
    ornekler: ["Zaman ve hava", "Mimari ve malzeme", "Işık ve renk", "Atmosfer"],
  },
  obje: {
    ad: "Nesne", cogul: "Nesneler", ikon: Box, renk: "text-amber-300", hex: "#fcd34d",
    yuvalar: ["Ön", "Yan", "Üst", "Detay"],
    ipucu: "Objeyi sade bir arka planda, tamamı görünecek şekilde çek. Logo ya da yazı varsa yakın plan ekle.",
    aciklamaYer: "Ör. Antika altın cep saati, oymalı kapak, krem kadran, roma rakamları, ince zincir.",
    ornekler: ["Malzeme ve doku", "Renk ve yüzey", "Boyut", "Ayırt edici detay"],
  },
  stil: {
    ad: "Stil", cogul: "Stiller", ikon: Palette, renk: "text-violet-300", hex: "#c4b5fd",
    yuvalar: ["Örnek 1", "Örnek 2", "Örnek 3", "Örnek 4"],
    ipucu: "Aynı görsel dili taşıyan örnekler seç. Stil tarifinde ışığı, rengi, dokuyu ve kamerayı anlat.",
    aciklamaYer: "Ör. Sıcak tonlu sinematik renk düzeni, yumuşak film greni, alçak altın saat ışığı, 35 mm lens.",
    ornekler: ["Renk paleti", "Işık", "Doku ve gren", "Kamera ve lens"],
  },
};
export const TUR_SIRA: ElementTur[] = ["karakter", "mekan", "obje", "stil"];
export const MAKS_GORSEL = 4;

export type Siralama = "olusturma" | "kullanim" | "ad";
export const SIRALAMALAR: { id: Siralama; ad: string }[] = [
  { id: "olusturma", ad: "Son oluşturulan" },
  { id: "kullanim", ad: "Son kullanılan" },
  { id: "ad", ad: "Ada göre" },
];
export function sirala(l: VElement[], s: Siralama): VElement[] {
  const k = [...l];
  if (s === "ad") k.sort((a, b) => a.ad.localeCompare(b.ad, "tr"));
  else if (s === "kullanim") k.sort((a, b) => (b.sonKullanim ?? 0) - (a.sonKullanim ?? 0) || b.olusturma - a.olusturma);
  else k.sort((a, b) => b.olusturma - a.olusturma);
  return k.sort((a, b) => Number(!!b.sabitli) - Number(!!a.sabitli));
}

/* ── Kapak: ilk görsel; üzerine gelince diğer açılar sırayla. Görsel yoksa tür işareti (stok foto yok). ── */
export function ElementKapak({ e, className, ikonBoyut = 34, oynat }: { e: Pick<VElement, "gorseller" | "tur" | "ad">; className?: string; ikonBoyut?: number; oynat?: boolean }) {
  const g = e.gorseller.filter(Boolean);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!oynat || g.length < 2) { setI(0); return; }
    const t = setInterval(() => setI((x) => (x + 1) % g.length), 900);
    return () => clearInterval(t);
  }, [oynat, g.length]);
  const m = TUR_META[e.tur];
  if (!g.length) {
    const I = m.ikon;
    return (
      <span className={cn("relative flex items-center justify-center overflow-hidden", className)}
        style={{ background: `radial-gradient(120% 90% at 30% 15%, ${m.hex}38, transparent 60%), linear-gradient(160deg, #1d1f24, #121317)` }}>
        <I style={{ width: ikonBoyut, height: ikonBoyut, color: m.hex }} strokeWidth={1.5} />
      </span>
    );
  }
  return (
    <span className={cn("relative block overflow-hidden bg-white/[0.04]", className)}>
      {g.map((src, k) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src + k} src={src} alt="" draggable={false} className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-500", k === i ? "opacity-100" : "opacity-0")} />
      ))}
      {oynat && g.length > 1 && (
        <span className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
          {g.map((_, k) => <span key={k} className={cn("h-1 rounded-full transition-all", k === i ? "w-3 bg-white" : "w-1 bg-white/50")} />)}
        </span>
      )}
    </span>
  );
}

/** Tür rozeti (cam). */
export function TurRozeti({ tur, kucuk }: { tur: ElementTur; kucuk?: boolean }) {
  const m = TUR_META[tur]; const I = m.ikon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full font-semibold backdrop-blur-md", kucuk ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]")}
      style={{ background: `color-mix(in srgb, ${m.hex} 22%, rgba(0,0,0,0.55))`, color: m.hex }}>
      <I className={kucuk ? "h-2.5 w-2.5" : "h-3 w-3"} /> {m.ad}
    </span>
  );
}

/* ── Görsel yükleme: istemcide boyutlandır (en uzun kenar 2048), kalite kontrolü, sunucu deposu ── */
export type GorselKontrol = { url: string; uyari?: string };
const MIN_KENAR = 300;
function dosyaOku(f: Blob): Promise<string> {
  return new Promise((ok, hata) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => hata(r.error); r.readAsDataURL(f); });
}
function gorselAc(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, hata) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = () => hata(new Error("Görsel açılamadı")); i.src = src; });
}
/** Dosya ya da adres → depoya yazılmış görsel adresi. Çok küçük görselleri reddeder, oran/kalite için uyarır. */
export async function elementGorseliHazirla(kaynak: File | string): Promise<GorselKontrol> {
  if (typeof kaynak !== "string") {
    if (!/^image\/(png|jpeg|webp)$/.test(kaynak.type)) throw new Error("PNG, JPG ya da WebP görsel seç.");
    if (kaynak.size > 25 * 1024 * 1024) throw new Error("Görsel en fazla 25 MB olabilir.");
  }
  const src = typeof kaynak === "string" ? kaynak : await dosyaOku(kaynak);
  // Zaten depodaki bir görselse (ör. kendi üretimin) yeniden yüklemeye gerek yok.
  if (typeof kaynak === "string" && /^\/api\/dosya\//.test(kaynak)) return { url: kaynak };
  const img = await gorselAc(src);
  const k = Math.min(img.naturalWidth, img.naturalHeight);
  if (k < MIN_KENAR) throw new Error(`Görsel çok küçük (${img.naturalWidth}×${img.naturalHeight}); kısa kenar en az ${MIN_KENAR} px olmalı.`);
  const oran = img.naturalWidth / img.naturalHeight;
  let uyari: string | undefined;
  if (oran > 2.5 || oran < 0.4) uyari = "Çok geniş ya da çok uzun görsel; bazı modeller kırpabilir.";
  else if (k < 768) uyari = "Düşük çözünürlük; 1024 px ve üstü daha tutarlı sonuç verir.";
  const olcek = Math.min(1, 2048 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * olcek); c.height = Math.round(img.naturalHeight * olcek);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  const dataUrl = c.toDataURL("image/webp", 0.92);
  const j = (await (await fetch("/api/element/gorsel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl }) })).json()) as { ok: boolean; url?: string; hata?: string };
  if (!j.ok || !j.url) throw new Error(j.hata ?? "Görsel kaydedilemedi.");
  return { url: j.url, uyari };
}

/* ── Gerçek eylemler ── */
export function elementiCogalt(e: VElement): string | null {
  const yid = useElements.getState().cogalt(e.id);
  if (!yid) { toast.error("Element çoğaltılamadı", { description: "Element artık kitaplığında yok. Sayfayı yenileyip yeniden dene." }); return null; }
  const yeni = useElements.getState().elementler.find((x) => x.id === yid);
  toast.success("Element çoğaltıldı", { description: `@${yeni?.ad ?? e.ad} kitaplığına eklendi.` });
  return yid;
}
export function elementiPaylas(e: VElement) {
  return baglantiyiKopyala(`/panel/element?el=${encodeURIComponent(e.ad)}`, "Bağlantı kopyalandı");
}
/** Elementin görsellerini indirir (yoksa tarif metni). */
export function elementiIndir(e: VElement) {
  const g = e.gorseller.filter(Boolean);
  if (!g.length) {
    const blob = new Blob([`@${e.ad} · ${TUR_META[e.tur].ad}\n\n${e.aciklama}`], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${e.ad}.txt`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast.success("Tarif indirildi", { description: `Görsel olmadığı için @${e.ad} tarifi ${e.ad}.txt olarak indi.` });
    return;
  }
  g.forEach((src, i) => uretimIndir({ baslik: g.length > 1 ? `${e.ad}-${i + 1}` : e.ad, gorselUrl: src, tur: "gorsel", prompt: e.aciklama }, i === 0 ? undefined : " "));
}
/** Silme + geri alma (toast eylemi). */
export function elementiSil(e: VElement) {
  useElements.getState().sil(e.id);
  toast(`@${e.ad} silindi`, {
    description: "Geçmiş üretimler etkilenmez.",
    action: { label: "Geri al", onClick: () => useElements.getState().geriYukle(e) },
  });
}
