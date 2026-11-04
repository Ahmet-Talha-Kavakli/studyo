"use client";

/**
 * GERÇEK EYLEM KATMANI (M9)
 * ---------------------------------------------------------------
 * Amaç: "Bağlantı kopyalandı" diyen ama kopyalamayan, "İndiriliyor 📦"
 * diyen ama indirmeyen SAHTE toast'ları ortadan kaldırmak.
 *
 * Kural: Toast SADECE eylem gerçekten olduysa gösterilir. Eylem
 * başarısız olursa dürüst bir hata toast'ı gösterilir.
 *
 * Buradaki her fonksiyon önce İŞİ YAPAR, sonra toast'ı kendisi basar.
 */

import { toast } from "@/lib/toast";
import { gorseliIndir, saltUrl } from "./utils";

/* ------------------------------------------------------------------ */
/* KOPYALAMA                                                           */
/* ------------------------------------------------------------------ */

/** navigator.clipboard yoksa (http/eski tarayıcı) execCommand yedeği. */
function yedekKopyala(metin: string): boolean {
  if (typeof document === "undefined") return false;
  try {
    const ta = document.createElement("textarea");
    ta.value = metin;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Metni GERÇEKTEN panoya kopyalar ve ancak başarılıysa başarı toast'ı basar.
 * Başarısızsa metni gösteren dürüst bir hata toast'ı çıkar.
 *
 * @returns kopyalandı mı
 */
export async function kopyala(metin: string, basarıMesaj = "Panoya kopyalandı", aciklama?: string): Promise<boolean> {
  const deger = String(metin ?? "");
  if (!deger.trim()) {
    toast.error("Kopyalanacak içerik yok", { description: "Bu alan boş. Önce içerik oluştur ya da başka bir öğe seç." });
    return false;
  }
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(deger);
      toast.success(basarıMesaj, aciklama ? { description: aciklama } : undefined);
      return true;
    }
  } catch {
    /* izin reddi / güvensiz bağlam → yedeğe düş */
  }
  if (yedekKopyala(deger)) {
    toast.success(basarıMesaj, aciklama ? { description: aciklama } : undefined);
    return true;
  }
  toast.error("Panoya kopyalanamadı", { description: `Tarayıcı panoya erişime izin vermedi. Metni seçip elle kopyala: ${deger.slice(0, 90)}` });
  return false;
}

/** Mevcut sayfanın tam adresini kopyalar. */
export function baglantiyiKopyala(yol?: string, mesaj = "Bağlantı kopyalandı") {
  const kok = typeof window !== "undefined" ? window.location.origin : "https://vayra.app";
  const tam = yol ? (yol.startsWith("http") ? yol : `${kok}${yol.startsWith("/") ? "" : "/"}${yol}`)
    : (typeof window !== "undefined" ? window.location.href : kok);
  return kopyala(tam, mesaj, tam.replace(/^https?:\/\//, ""));
}

/* ------------------------------------------------------------------ */
/* İNDİRME                                                             */
/* ------------------------------------------------------------------ */

function dosyaAdiTemiz(ad: string, uzanti: string) {
  const t = (ad || "vayra")
    .replace(/[^\p{L}\p{N}\s._-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48) || "vayra";
  return `${t}.${uzanti}`;
}

/** Bir URL'i (http / data: / blob:) GERÇEKTEN indirir. */
export function urlIndir(url: string, dosyaAdi: string): boolean {
  if (typeof document === "undefined") return false;
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = dosyaAdi;
    a.rel = "noopener";
    // Çapraz-köken http URL'lerde download yok sayılabilir → yeni sekme yedeği.
    if (/^https?:/i.test(url) && typeof window !== "undefined" && !url.startsWith(window.location.origin)) {
      a.target = "_blank";
    }
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch {
    return false;
  }
}

/** Metin/JSON içeriğini blob olarak GERÇEKTEN indirir. */
export function metinIndir(icerik: string, dosyaAdi: string, mime = "text/plain;charset=utf-8"): boolean {
  if (typeof document === "undefined") return false;
  try {
    const blob = new Blob([icerik], { type: mime });
    const url = URL.createObjectURL(blob);
    const ok = urlIndir(url, dosyaAdi);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return ok;
  } catch {
    return false;
  }
}

/**
 * İndirilebilir üretim alanları — Uretim tipiyle uyumlu gevşek şekil.
 * NOT: burada `[k: string]: unknown` index imzası KULLANILMAZ; kullanılırsa
 * store'daki `Uretim` gibi index imzası olmayan arayüzler bu tipe atanamaz
 * (TS2345 "Index signature for type 'string' is missing"). Yapısal uyum
 * fazladan alanlara zaten izin verir.
 */
export interface IndirilebilirUretim {
  id?: string;
  baslik?: string;
  prompt?: string;
  model?: string;
  tur?: string;
  arac?: string;
  gorselUrl?: string;
  videoUrl?: string;
  sesUrl?: string;
  glbUrl?: string;
  thumbnailUrl?: string;
  gercek?: boolean;
}

/**
 * Bir üretimi GERÇEKTEN indirir.
 * Öncelik: video → ses → 3D(glb) → görsel → (hiçbiri yoksa) künye JSON'u.
 * Toast'ı kendisi basar; asla "indiriliyor" deyip indirmemeyi yapmaz.
 */
export function uretimIndir(u: IndirilebilirUretim | null | undefined, ekMesaj?: string): boolean {
  if (!u) {
    toast.error("İndirilecek üretim bulunamadı", { description: "Üretim silinmiş ya da henüz hazır değil. Listeyi yenileyip yeniden dene." });
    return false;
  }
  const ad = (u.baslik as string) || (u.prompt as string) || "vayra-uretim";

  if (u.videoUrl) {
    const ok = urlIndir(u.videoUrl, dosyaAdiTemiz(ad, "mp4"));
    if (ok) { toast.success("Video indiriliyor", { description: ekMesaj ?? ad }); return true; }
  }
  if (u.sesUrl) {
    const ok = urlIndir(u.sesUrl, dosyaAdiTemiz(ad, String(u.sesUrl).match(/\.(mp3|wav|opus|ogg|m4a|webm)$/)?.[1] ?? "mp3"));
    if (ok) { toast.success("Ses indiriliyor", { description: ekMesaj ?? ad }); return true; }
  }
  if (u.glbUrl) {
    const ok = urlIndir(u.glbUrl, dosyaAdiTemiz(ad, "glb"));
    if (ok) { toast.success("3D model indiriliyor", { description: ekMesaj ?? ad }); return true; }
  }
  const gorsel = saltUrl(u.gorselUrl) ?? saltUrl(u.thumbnailUrl);
  if (gorsel && /^(data:|https?:|\/)/.test(gorsel)) {
    gorseliIndir(String(u.prompt ?? "") + String(u.model ?? ""), ad, gorsel);
    toast.success("Görsel indiriliyor", { description: ekMesaj ?? ad });
    return true;
  }
  // Görsel çıktı yok → en azından üretimin künyesini gerçek bir dosya olarak indir.
  const kunye = JSON.stringify(
    {
      baslik: u.baslik ?? null,
      tur: u.tur ?? null,
      model: u.model ?? null,
      arac: u.arac ?? null,
      istem: u.prompt ?? null,
      kimlik: u.id ?? null,
      uygulama: "Vayra",
      disaAktarim: new Date().toISOString(),
    },
    null,
    2,
  );
  const ok = metinIndir(kunye, dosyaAdiTemiz(ad, "json"), "application/json");
  if (ok) {
    toast.success("Üretim künyesi indirildi", { description: "Medya dosyası olmadığı için künye JSON olarak kaydedildi." });
    return true;
  }
  toast.error("İndirilemedi", { description: "Tarayıcı indirmeyi engelledi. Bu site için indirmelere izin verip yeniden dene." });
  return false;
}

/** Birden fazla üretimi sırayla indirir (tarayıcı engellemesin diye aralıklı). */
export function topluIndir(liste: IndirilebilirUretim[], etiket?: string) {
  const gecerli = liste.filter(Boolean);
  if (!gecerli.length) {
    toast.error("İndirilecek seçim yok", { description: "Önce indirmek istediğin öğeleri seç." });
    return;
  }
  gecerli.forEach((u, i) => {
    setTimeout(() => {
      const ad = (u.baslik as string) || "vayra-uretim";
      if (u.videoUrl) return void urlIndir(u.videoUrl, dosyaAdiTemiz(ad, "mp4"));
      if (u.sesUrl) return void urlIndir(u.sesUrl, dosyaAdiTemiz(ad, "mp3"));
      if (u.glbUrl) return void urlIndir(u.glbUrl, dosyaAdiTemiz(ad, "glb"));
      const g = saltUrl(u.gorselUrl) ?? saltUrl(u.thumbnailUrl);
      gorseliIndir(String(u.prompt ?? "") + String(u.model ?? ""), ad, g && /^(data:|https?:|\/)/.test(g) ? g : undefined);
    }, i * 320);
  });
  toast.success(`${gecerli.length} dosya indiriliyor`, { description: etiket ?? "Tarayıcı indirmeleri sırayla başlatır." });
}

export { dosyaAdiTemiz };
