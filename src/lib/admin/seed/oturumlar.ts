/**
 * Davranış/event motoru — Faz 0'ın kalbi.
 * Her kullanıcı için deterministik OTURUM geçmişi üretir: rota grafında gezinme,
 * dwell (sayfada kalma), tıklama, üretim, kayıt/ödeme dönüşümleri, exit noktası.
 * Ayrıca gerçek "ziyaretçi" oturumları (henüz kayıt olmamış anonim trafik) da üretir —
 * böylece funnel/exit/path analizleri gerçek terk davranışını yansıtır.
 *
 * Tüm çıktı deterministik (tohumdan türer) → SSR-safe, cache'lenir.
 * Bu ham olaylardan analitik.ts / davranis.ts türetilmiş metrikleri hesaplar.
 */
import { prng, tohumla, tamsayi, sec, agirlikliSec, BUGUN, GUN, DK } from "../cekirdek";
import { ROTA_HARITA, GIRIS_ROTALARI, type OlayTur } from "./rotalar";
import { CIHAZLAR, TARAYICILAR, ULKELER } from "../tablolar";
import type { AdminKullanici } from "./kullanicilar";

export interface Olay {
  tur: OlayTur;
  yol: string; // hangi sayfada
  hedef?: string; // tıklama hedefi (buton/model adı)
  ms: number; // zaman damgası
  sureSn?: number; // sayfa dwell süresi (sayfa olayı için)
}

export interface Oturum {
  id: string;
  kullaniciId?: string; // kayıtlı kullanıcı (yoksa anonim ziyaretçi)
  anonimId: string; // her oturum için parmak-izi benzeri
  baslangic: number;
  cihaz: string;
  tarayici: string;
  ulkeKod: string;
  ip: string;
  kaynak: string; // utm/referrer
  olaylar: Olay[];
  donusti: boolean; // bu oturumda kayıt/ödeme oldu mu
  cikisYol: string; // oturumun terk edildiği son sayfa
  toplamSn: number;
}

/* Bir oturumu graf üzerinde deterministik "yürüt". */
function oturumYurut(
  r: () => number,
  baslangicMs: number,
  girisYol: string,
  maxAdim: number,
  kayitliMi: boolean,
): { olaylar: Olay[]; cikisYol: string; donusti: boolean; toplamSn: number } {
  const olaylar: Olay[] = [];
  let yol = girisYol;
  let t = baslangicMs;
  let toplamSn = 0;
  let donusti = false;

  for (let adim = 0; adim < maxAdim; adim++) {
    const rota = ROTA_HARITA[yol];
    if (!rota) break;

    // Sayfa görüntüleme + dwell (log-normal benzeri sapma)
    const sapma = 0.4 + r() * 1.6;
    const sureSn = Math.max(3, Math.round(rota.ortSaniye * sapma));
    olaylar.push({ tur: "sayfa", yol, ms: t, sureSn });
    toplamSn += sureSn;
    t += sureSn * 1000;

    // Sayfa içi tıklamalar (0-3 hedef)
    if (rota.hedefler?.length) {
      const tikSayi = tamsayi(r, 0, Math.min(4, rota.hedefler.length + 1));
      for (let k = 0; k < tikSayi; k++) {
        const hedef = sec(r, rota.hedefler);
        t += tamsayi(r, 1, 8) * 1000;
        olaylar.push({ tur: "tiklama", yol, hedef, ms: t });
        // Üretim hedefi → üretim olayı
        if (/Üret\b|Üret$/.test(hedef) || hedef === "Üret") {
          olaylar.push({ tur: "uretim", yol, ms: t + 500 });
        }
      }
    }

    // Dönüşüm olayları (kayıt/ödeme sayfalarında)
    if (yol === "/kayit" && r() < 0.56) {
      olaylar.push({ tur: "kayit", yol, ms: t }); donusti = true;
    }
    if ((yol === "/fiyatlandirma" || yol === "/panel/kredi") && kayitliMi && r() < 0.12) {
      olaylar.push({ tur: "odeme", yol, ms: t }); donusti = true;
    }
    if (yol === "/sss" && r() < 0.06) {
      olaylar.push({ tur: "feedback", yol, ms: t });
    }

    // Sonraki sayfa mı, çıkış mı?
    const cikar = r() < rota.cikisEgilim || !rota.gecisler.length;
    if (cikar) break;
    yol = agirlikliSec(r, rota.gecisler);
    t += tamsayi(r, 1, 4) * 1000;
  }

  olaylar.push({ tur: "cikis", yol, ms: t });
  return { olaylar, cikisYol: yol, donusti, toplamSn };
}

function ipParcala(r: () => number): string {
  return `${tamsayi(r, 1, 255)}.${tamsayi(r, 0, 255)}.${tamsayi(r, 0, 255)}.${tamsayi(r, 1, 255)}`;
}

/**
 * TEK kullanıcının oturumlarını talep üzerine üret (detay sayfası için).
 * Global evrende örneklenmemiş kullanıcılar da yolculuk gösterebilsin diye.
 * Deterministik: aynı kullanıcı → aynı oturumlar.
 */
export function kullaniciOturumlari(k: AdminKullanici): Oturum[] {
  if (k.durum === "banli" || k.durum === "silinme_talebi") return [];
  const r = prng(tohumla(`vayra-otr-${k.id}`));
  const oturumSayi = k.durum === "aktif" ? tamsayi(r, 2, 14) : tamsayi(r, 1, 4);
  const out: Oturum[] = [];
  for (let s = 0; s < oturumSayi; s++) {
    const gunOnce = tamsayi(r, 0, 60);
    const baslangic = BUGUN - gunOnce * GUN - tamsayi(r, 0, 86400) * 1000;
    const girisYol = r() < 0.7 ? sec(r, ["/panel", "/panel/sinema", "/panel/akis", "/panel/kitaplik"]) : agirlikliSec(r, GIRIS_ROTALARI);
    const { olaylar, cikisYol, donusti, toplamSn } = oturumYurut(r, baslangic, girisYol, tamsayi(r, 3, 12), true);
    out.push({
      id: `o_${k.id}_${s}`,
      kullaniciId: k.id,
      anonimId: `fp_${tohumla(k.ip + k.cihaz).toString(36)}`,
      baslangic, cihaz: k.cihaz, tarayici: k.tarayici, ulkeKod: k.ulkeKod, ip: k.ip,
      kaynak: k.kaynak, olaylar, donusti, cikisYol, toplamSn,
    });
  }
  return out.sort((a, b) => b.baslangic - a.baslangic);
}

const ULKE_AG = ULKELER.map((u) => [u.kod, u.agirlik] as const);
const KAYNAK_AG = [
  ["organik", 40], ["meta", 16], ["google", 14], ["tiktok", 12],
  ["instagram", 8], ["youtube", 5], ["referans", 3], ["influencer", 2],
] as const;

/**
 * Tüm oturum evreni:
 * - Kayıtlı kullanıcıların oturumları (kullanıcı verisinden türetilir, gerçek kimlikle)
 * - Anonim ziyaretçi oturumları (kayıt olmamış trafik — funnel/exit için kritik)
 */
export function uretOturumlar(kullanicilar: AdminKullanici[]): Oturum[] {
  const oturumlar: Oturum[] = [];

  // 1) Kayıtlı kullanıcı oturumları — aktiflik ve plana göre oturum sayısı
  //    (performans: 10k kullanıcının tamamı yerine temsili 2500 aktif örneklem)
  const aktifler = kullanicilar.filter((k) => k.durum === "aktif" || k.durum === "pasif");
  const ornek = aktifler.slice(0, 2500);
  for (const k of ornek) {
    const r = prng(tohumla(`vayra-otr-${k.id}`));
    const oturumSayi = k.durum === "aktif" ? tamsayi(r, 2, 14) : tamsayi(r, 1, 4);
    for (let s = 0; s < oturumSayi; s++) {
      const gunOnce = tamsayi(r, 0, 60);
      const baslangic = BUGUN - gunOnce * GUN - tamsayi(r, 0, 86400) * 1000;
      // Kayıtlı kullanıcı çoğunlukla panele düşer
      const girisYol = r() < 0.7 ? sec(r, ["/panel", "/panel/sinema", "/panel/akis", "/panel/kitaplik"]) : agirlikliSec(r, GIRIS_ROTALARI);
      const { olaylar, cikisYol, donusti, toplamSn } = oturumYurut(r, baslangic, girisYol, tamsayi(r, 3, 12), true);
      oturumlar.push({
        id: `o_${k.id}_${s}`,
        kullaniciId: k.id,
        anonimId: `fp_${tohumla(k.ip + k.cihaz).toString(36)}`,
        baslangic, cihaz: k.cihaz, tarayici: k.tarayici, ulkeKod: k.ulkeKod, ip: k.ip,
        kaynak: k.kaynak, olaylar, donusti, cikisYol, toplamSn,
      });
    }
  }

  // 2) Anonim ziyaretçi oturumları — 6000 oturum (funnel tepesi, terk davranışı)
  for (let i = 0; i < 6000; i++) {
    const r = prng(tohumla(`vayra-anon-${i}`));
    const gunOnce = tamsayi(r, 0, 60);
    const baslangic = BUGUN - gunOnce * GUN - tamsayi(r, 0, 86400) * 1000;
    const girisYol = agirlikliSec(r, GIRIS_ROTALARI);
    const { olaylar, cikisYol, donusti, toplamSn } = oturumYurut(r, baslangic, girisYol, tamsayi(r, 1, 8), false);
    const ip = ipParcala(r);
    oturumlar.push({
      id: `o_anon_${i}`,
      anonimId: `fp_${tohumla(ip + i).toString(36)}`,
      baslangic,
      cihaz: agirlikliSec(r, [["Masaüstü", 45], ["Mobil", 48], ["Tablet", 7]] as const),
      tarayici: sec(r, TARAYICILAR),
      ulkeKod: agirlikliSec(r, ULKE_AG),
      ip,
      kaynak: agirlikliSec(r, KAYNAK_AG),
      olaylar, donusti, cikisYol, toplamSn,
    });
  }

  return oturumlar;
}
