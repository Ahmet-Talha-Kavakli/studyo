"use client";

import { useEffect } from "react";
import { useAuth } from "@/store/useAuth";
import { useEarn, cekimDurum, cuzdan, gonderiHesap } from "@/store/useEarn";
import { bildir } from "@/lib/bildirimler";
import { tl } from "./kampanyalar";
import { istatistikIstek } from "./istemci";

const ISTATISTIK_ARALIK = 30 * 60_000;

/**
 * Earn gözcüsü — uygulama kabuğunda bir kez çalışır (bildirim gözcüsüyle birlikte):
 *  1. Earn verisini giriş yapan hesaba bağlar (hesap değişince sıfırlanır).
 *  2. Kazanma süresindeki gönderilerin görüntülenmesini platform API'sinden tazeler.
 *  3. Gönderi ve çekim durum değişimlerini bir kez bildirim olarak düşer.
 */
export function useEarnGozcusu() {
  const kullanici = useAuth((s) => s.kullanici);

  useEffect(() => {
    if (kullanici) useEarn.getState().sahipAyarla(kullanici.email, kullanici.ad);
  }, [kullanici]);

  useEffect(() => {
    if (!kullanici) return;
    let iptal = false;

    const kontrol = async () => {
      const s = useEarn.getState();
      const simdi = Date.now();
      const bonus = cuzdan(s, simdi).seviye.bonus;

      for (const g of s.gonderiler) {
        const h = gonderiHesap(g, simdi, bonus);
        const k = h.kampanya;
        if (!k) continue;
        const bir = (olay: string, f: () => void) => {
          const a = `${g.id}:${olay}`;
          if (useEarn.getState().bildirilen.includes(a)) return;
          useEarn.getState().bildirildi(a);
          f();
        };
        // Gönderinin geçmişteki olaylarına (sayfa açık değilken olanlar) toplu bildirim atmamak için
        // yalnız son 3 günün olayları bildirilir.
        const yeni = (t: number) => simdi - t < 3 * 86_400_000;
        if (h.durum === "kazaniyor" && yeni(h.sonrakiAsama - 7 * 86_400_000)) {
          bir("onay", () => bildir({ kategori: "earn", tur: "basari", baslik: "Gönderin onaylandı", mesaj: `${k.ad} · Görüntülenmeler artık kazandırıyor. Onay ödemesi: ${tl(k.sabitOdeme ?? 0)}.`, link: "/earn/gonderiler", gorsel: g.uretimGorsel ?? k.kapak }));
        }
        if (h.durum === "cekilebilir" && h.kazanc > 0 && yeni(h.sonrakiAsama)) {
          bir("cekilebilir", () => bildir({ kategori: "earn", tur: "basari", baslik: `${tl(h.kazanc, true)} çekilebilir`, mesaj: `${k.ad} kazancın cüzdanına geçti.`, link: "/earn/cuzdan", eylem: { ad: "Para çek", link: "/earn/cuzdan" } }));
        }
        if (h.durum === "reddedildi") {
          bir("red", () => bildir({ kategori: "earn", tur: "hata", baslik: "Gönderin reddedildi", mesaj: `${k.ad} · ${g.red ?? "Gereksinimler karşılanmadı."}`, link: "/earn/gonderiler", eylem: { ad: "İtiraz et", link: "/earn/gonderiler" } }));
        }
      }

      for (const c of s.cekimler) {
        const d = cekimDurum(c, simdi);
        if (d === "odendi" && simdi - c.tarih < 7 * 86_400_000) {
          const a = `${c.id}:odendi`;
          if (!useEarn.getState().bildirilen.includes(a)) {
            useEarn.getState().bildirildi(a);
            bildir({ kategori: "earn", tur: "basari", baslik: `${tl(c.tutar, true)} hesabına gönderildi`, mesaj: `${c.yontemAd} · Referans ${c.referans}.`, link: "/earn/cuzdan" });
          }
        }
      }

      // Gerçek görüntülenme: kazanma süresindeki gönderiler, 30 dakikada bir.
      for (const g of s.gonderiler) {
        if (iptal) return;
        const h = gonderiHesap(g, simdi);
        if (h.durum !== "kazaniyor" || h.kampanya?.tur !== "goruntulenme") continue;
        if (g.istatistik && simdi - g.istatistik.zaman < ISTATISTIK_ARALIK) continue;
        const r = await istatistikIstek(g.platform, g.link);
        if (r.ok && r.gercek && typeof r.goruntulenme === "number") useEarn.getState().istatistikYaz(g.id, r.goruntulenme);
      }
    };

    kontrol();
    const t = setInterval(kontrol, 60_000);
    return () => { iptal = true; clearInterval(t); };
  }, [kullanici]);
}
