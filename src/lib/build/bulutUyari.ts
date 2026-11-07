import "server-only";
import { randomBytes } from "crypto";
import { readdir } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { bulutAyarDegistir, bulutAyarOku, UYARI_OLCUTLERI, type UyariKurali, type UyariOlcut } from "./bulutAyar";
import { gunlukOku } from "./gunluk";
import { projeOkuHam } from "./depo";
import { yuzdelik } from "./bulutPerformans";
import { zamanliOku } from "./bulutZamanli";

/**
 * Eşik uyarı kuralları (Vercel Alerts, Cloudflare bildirimleri benzeri). Her kural bir ölçütü pencere (dakika) boyunca
 * hesaplar; eşik geçilince proje bildirimine düşer (e-posta adresi verildiyse e-posta da gider) ve sessiz kalma süresi
 * boyunca yeniden bildirmez. Zamanlayıcı dakikada bir bütün açık kuralları denetler.
 */
export const OLCUT_BILGI: Record<UyariOlcut, { ad: string; birim: string; alt: string }> = {
  hataOrani: { ad: "Hata oranı", birim: "yüzde", alt: "Sunucu hatası veren isteklerin payı (en az 10 istek olunca)" },
  p95: { ad: "Yavaş uç süresi (p95)", birim: "ms", alt: "İsteklerin yüzde 95'inin bittiği süre" },
  hata5xx: { ad: "Sunucu hatası sayısı", birim: "adet", alt: "Sayfa ve fonksiyonlarda 500 ve üstü yanıt" },
  istek: { ad: "İstek sayısı", birim: "adet", alt: "Trafik ani yükselince (saldırı ya da kampanya)" },
  fonksiyonHata: { ad: "Fonksiyon hatası", birim: "adet", alt: "api/*.js çağrılarındaki hata ve zaman aşımları" },
  zamanliHata: { ad: "Zamanlanmış görev hatası", birim: "adet", alt: "Zamanlı ve gecikmeli işlerin başarısız çalışmaları" },
};

/** Kuralın ölçütünü şimdi hesaplar (pencere: son N dakika). */
export async function olcutHesapla(projeId: string, k: Pick<UyariKurali, "olcut" | "pencere" | "yol">): Promise<{ deger: number; adet: number }> {
  const bit = Date.now(), bas = bit - Math.max(1, k.pencere) * 60_000;
  if (k.olcut === "zamanliHata") {
    const d = await zamanliOku(projeId);
    const n = d.calismalar.filter((c) => c.z >= bas && c.durum === "hata" && (!k.yol || `/api/${c.fonksiyon}`.startsWith(k.yol))).length;
    return { deger: n, adet: n };
  }
  const l = (await gunlukOku(projeId, { turler: ["istek", "fonksiyon"], bas, bit, sinir: 100_000 }))
    .filter((x) => !/ \((önizleme|deneme)\)$/.test(x.y ?? "") && !x.f?.onizleme && !x.e)
    .filter((x) => !k.yol || (x.y ?? "").startsWith(k.yol));
  const hata = (x: (typeof l)[number]) => (x.d ?? 200) >= 500 || !!x.f?.hata;
  switch (k.olcut) {
    case "hataOrani": return { deger: l.length >= 10 ? Math.round((l.filter(hata).length / l.length) * 1000) / 10 : 0, adet: l.length };
    case "p95": return { deger: yuzdelik(l.map((x) => x.ms ?? 0), 0.95), adet: l.length };
    case "hata5xx": return { deger: l.filter((x) => (x.d ?? 200) >= 500).length, adet: l.length };
    case "istek": return { deger: l.length, adet: l.length };
    case "fonksiyonHata": { const f = l.filter((x) => x.t === "fonksiyon"); return { deger: f.filter(hata).length, adet: f.length }; }
  }
  return { deger: 0, adet: 0 };
}

export function kuralTemizle(g: Partial<UyariKurali>, eski?: UyariKurali): UyariKurali {
  const olcut = (g.olcut ?? eski?.olcut) as UyariOlcut;
  if (!UYARI_OLCUTLERI.includes(olcut)) throw new Error("Ölçüt seç.");
  const pencere = Math.round(Number(g.pencere ?? eski?.pencere ?? 15));
  if (![5, 15, 30, 60, 180, 1440].includes(pencere)) throw new Error("Pencere 5, 15, 30, 60, 180 ya da 1440 dakika olabilir.");
  const esik = Number(g.esik ?? eski?.esik);
  if (!Number.isFinite(esik) || esik <= 0 || (olcut === "hataOrani" && esik > 100) || esik > 10_000_000) throw new Error(olcut === "hataOrani" ? "Eşik 0 ile 100 arasında bir yüzde olmalı." : "Eşik pozitif bir sayı olmalı.");
  const yol = (g.yol ?? eski?.yol ?? "").trim();
  if (yol && !/^\/[^\s]{0,120}$/.test(yol)) throw new Error("Yol / ile başlamalı (örneğin /api/odeme).");
  const sessiz = Math.max(5, Math.min(1440, Math.round(Number(g.sessiz ?? eski?.sessiz ?? 60))));
  return {
    id: eski?.id ?? randomBytes(5).toString("base64url"), olusturma: eski?.olusturma ?? Date.now(), ad: String(g.ad ?? eski?.ad ?? "").trim().slice(0, 60) || `${OLCUT_BILGI[olcut].ad} eşiği`,
    olcut, pencere, esik, sessiz, yol: yol || undefined, acik: g.acik ?? eski?.acik ?? true, seviye: (g.seviye ?? eski?.seviye) === "kritik" ? "kritik" : "uyari",
    sonDeger: eski?.sonDeger, sonDenetim: eski?.sonDenetim, sonTetik: eski?.sonTetik, gecmis: eski?.gecmis,
  };
}

const esikYazi = (k: UyariKurali, d: number) => k.olcut === "hataOrani" ? `yüzde ${d.toLocaleString("tr-TR")}` : k.olcut === "p95" ? `${d.toLocaleString("tr-TR")} ms` : d.toLocaleString("tr-TR");

/** Bir projenin açık kurallarını denetler; tetiklenenleri bildirir. */
export async function projeUyarilari(projeId: string, zorla = false) {
  const a = await bulutAyarOku(projeId);
  const acik = a.uyarilar.filter((k) => k.acik);
  if (!acik.length) return [];
  const z = Date.now();
  const sonuc: { id: string; deger: number; tetik: boolean }[] = [];
  for (const k of acik) {
    if (!zorla && k.sonDenetim && z - k.sonDenetim < 55_000) continue;
    const { deger } = await olcutHesapla(projeId, k).catch(() => ({ deger: 0 }));
    const asti = deger >= k.esik;
    const tetik = asti && (!k.sonTetik || z - k.sonTetik >= k.sessiz * 60_000);
    sonuc.push({ id: k.id, deger, tetik });
    if (tetik) {
      const p = await projeOkuHam(projeId);
      if (p) {
        const { bildirimEkle } = await import("./bulutBildirim");
        await bildirimEkle(p, `uyari:${k.id}:${Math.floor(z / (k.sessiz * 60_000))}`, { tur: "uyari-kurali", seviye: k.seviye, baslik: `${k.ad}: ${esikYazi(k, deger)}`, ayrinti: `${OLCUT_BILGI[k.olcut].ad}${k.yol ? ` (${k.yol})` : ""} son ${k.pencere} dakikada ${esikYazi(k, deger)} oldu; eşik ${esikYazi(k, k.esik)}.`, bolum: "performans" });
      }
    }
  }
  if (sonuc.length) await bulutAyarDegistir(projeId, (x) => {
    for (const s of sonuc) {
      const k = x.uyarilar.find((y) => y.id === s.id);
      if (!k) continue;
      k.sonDeger = s.deger; k.sonDenetim = z;
      if (s.tetik) { k.sonTetik = z; k.gecmis = [{ z, deger: s.deger }, ...(k.gecmis ?? [])].slice(0, 30); }
    }
  });
  return sonuc;
}

/** Zamanlayıcıdan dakikada bir: kuralı olan bütün projeler. */
export async function uyarilariDenetle() {
  const d = path.join(DEPO_KOK, "build", "bulut");
  for (const f of await readdir(d).catch(() => [] as string[])) {
    const id = f.replace(/\.json$/, "");
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(id)) continue;
    await projeUyarilari(id).catch(() => {});
  }
}
