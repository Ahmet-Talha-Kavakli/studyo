"use client";

/** Sahne üretimi tek yerde: Storyboard ve AI Yönetmen aynı akışı kullanır. Sonuç sahneye sürüm, projeye varlık olarak yazılır. */

import { useEffect } from "react";
import { MODELLER } from "@/lib/catalog";
import { uretimBaslat, uretimHataToast } from "@/lib/uretimMotoru";
import { useProje, type Cekim, type Proje } from "@/store/useSinema";
import { useProjeler } from "@/store/useProjeler";
import { toast } from "@/lib/toast";

export const VIDEO_MODELLERI = MODELLER.filter((m) => m.tur === "video").slice(0, 8);
export const GORSEL_MODELLERI = MODELLER.filter((m) => m.tur === "gorsel").slice(0, 8);

/** Ad ya da kimlikten modeli bul (yönetmen "Kling 3.0" der, sahne "kling-3" saklar). */
export function modelBul(x?: string, tur?: "video" | "gorsel") {
  const k = (x ?? "").toLocaleLowerCase("tr");
  const m = MODELLER.find((y) => y.id === x || y.ad.toLocaleLowerCase("tr") === k);
  if (m && (!tur || m.tur === tur)) return m;
  return tur === "gorsel" ? GORSEL_MODELLERI[0] : VIDEO_MODELLERI[0];
}

export function sahneUret(p: Proje, c: Cekim, tur?: "video" | "gorsel", modelId?: string): boolean {
  const { cekimGuncelle, uretimBagla, etkinlikEkle } = useProje.getState();
  const once = c.model ? MODELLER.find((x) => x.id === c.model) : undefined;
  const m = modelBul(modelId ?? c.model, tur ?? (once?.tur === "gorsel" ? "gorsel" : "video"));
  if (!c.istem.trim()) { toast.error("Sahnenin istemi boş", { description: "Önce sahnede ne olacağını yaz, sonra üret." }); return false; }
  const ek = [c.plan && `plan: ${c.plan}`, c.aci && `açı: ${c.aci}`, c.lens && `lens: ${c.lens}`, c.hareket && `kamera: ${c.hareket}`, c.isik && `ışık: ${c.isik}`, c.palet && `renk: ${c.palet}`, m.tur === "video" && c.ses && `ses: ${c.ses}`, m.tur === "video" && c.diyalog && `diyalog: "${c.diyalog}"`].filter(Boolean).join(", ");
  /* Süreklilik: sahnenin elementleri istemde @ ile geçmiyorsa eklenir; model karakteri her sahnede aynı tutar. */
  const eksikEl = (c.elementler ?? []).filter((a) => !c.istem.toLocaleLowerCase("tr").includes(`@${a.toLocaleLowerCase("tr")}`));
  const istem = `${c.istem.trim()}${eksikEl.length ? ` ${eksikEl.map((a) => `@${a}`).join(" ")}` : ""}${ek ? `. ${ek}` : ""}`;
  const sonuc = uretimBaslat({
    baslik: `${p.ad} · ${c.baslik}`, tur: m.tur, model: m.ad, prompt: istem, kredi: m.kredi, arac: "Proje", projeId: p.id,
    meta: { oran: p.ayar?.oran || "16:9", sure: m.tur === "video" ? `${c.sure}sn` : undefined, hareket: c.hareket, hamIstem: c.istem.trim() },
  });
  if (!sonuc.ok || !sonuc.id) { uretimHataToast(sonuc, "Sahne üretilemedi"); return false; }
  uretimBagla(p.id, sonuc.id, "genel");
  cekimGuncelle(p.id, c.id, { durum: "uretiliyor", model: m.id, surumler: [{ id: sonuc.id, uretimId: sonuc.id, zaman: Date.now() }, ...(c.surumler ?? [])] });
  etkinlikEkle(p.id, `"${c.baslik}" sahnesini ${m.ad} ile üretmeye başladı`, "sahne");
  return true;
}

/** Üretimi süren sahneleri izler: bitince sahneye sürüm yazar, hata olursa geri alır. Proje sayfasında bir kez çalışır. */
export function useSahneIzleyici(p?: Proje) {
  const uretimler = useProjeler((s) => s.uretimler);
  useEffect(() => {
    if (!p) return;
    const { cekimGuncelle } = useProje.getState();
    for (const c of p.cekimler) {
      if (c.durum !== "uretiliyor") continue;
      const uid = c.surumler?.[0]?.uretimId;
      const u = uid ? uretimler.find((x) => x.id === uid) : undefined;
      if (!u) continue;
      if (u.durum === "tamam") {
        const gorsel = u.gorselUrl && /^(https?:|data:image|blob:|\/)/.test(u.gorselUrl) ? u.gorselUrl : u.meta?.demoKlip?.poster ?? u.thumbnailUrl;
        const video = u.videoUrl ?? u.meta?.demoKlip?.video;
        cekimGuncelle(p.id, c.id, { durum: "tamam", gorselUrl: gorsel, videoUrl: video, surumler: (c.surumler ?? []).map((s, i) => (i === 0 ? { ...s, gorselUrl: gorsel, videoUrl: video } : s)) });
        toast.success(`"${c.baslik}" hazır`, { description: "Yeni sürüm sahneye eklendi." });
      } else if (u.durum === "hata") {
        cekimGuncelle(p.id, c.id, { durum: (c.surumler?.length ?? 0) > 1 ? "tamam" : "taslak", surumler: (c.surumler ?? []).slice(1) });
        toast.error(`"${c.baslik}" üretilemedi`, { description: u.hata || "Kredin iade edildi. İstemi değiştirip yeniden dene." });
      }
    }
  }, [uretimler, p]);
}
