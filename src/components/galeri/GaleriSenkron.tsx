"use client";

/**
 * Galeri düzeni eşitleyicisi — panel kabuğunda bir kez bağlanır.
 * Hesap açıkken favoriler (useProjeler.favori) ve klasörler (useKoleksiyon) sunucuya yazılır
 * (/api/hesap/galeri). Açılışta sunucudaki düzen daha yeniyse cihaza uygulanır; cihazdaki daha
 * yeniyse sunucuya gönderilir (son yazan kazanır). Misafirde yalnız cihazda kalır.
 * Ayrıca indirme hattını (filigran köprüsü) yükler.
 */

import { useEffect } from "react";
import "@/lib/galeri/indir";
import { useAuth } from "@/store/useAuth";
import { useProjeler } from "@/store/useProjeler";
import { useKoleksiyon, type Koleksiyon } from "@/store/useKoleksiyon";
import { hesapIstek } from "@/lib/hesap/istemci";

type Duzen = { favoriler: string[]; klasorler: Koleksiyon[]; guncelleme: number };

const zamanAnahtari = (e: string) => `vayra-galeri-guncelleme:${e}`;
const zamanOku = (e: string) => { try { return Number(localStorage.getItem(zamanAnahtari(e))) || 0; } catch { return 0; } };
const zamanYaz = (e: string, t: number) => { try { localStorage.setItem(zamanAnahtari(e), String(t)); } catch { /* yoksay */ } };

const favoriImzasi = () => useProjeler.getState().uretimler.filter((u) => u.favori).map((u) => u.id).sort().join(",");
/** Başka cihazda üretilmiş (bu cihazda kaydı olmayan) favoriler de korunur; yoksa ilk gönderimde silinirlerdi. */
let disaridakiFavoriler: string[] = [];
const yerelDuzen = (guncelleme: number): Duzen => {
  const u = useProjeler.getState().uretimler;
  const burada = new Set(u.map((x) => x.id));
  return {
    favoriler: [...u.filter((x) => x.favori).map((x) => x.id), ...disaridakiFavoriler.filter((id) => !burada.has(id))],
    klasorler: useKoleksiyon.getState().koleksiyonlar,
    guncelleme,
  };
};

export function GaleriSenkron() {
  const eposta = useAuth((s) => s.kullanici?.email ?? null);

  useEffect(() => {
    if (!eposta) return;
    let iptal = false;
    let uyguluyor = false;
    let zamanlayici: ReturnType<typeof setTimeout> | null = null;

    const gonder = () => {
      zamanlayici = null;
      const d = yerelDuzen(zamanOku(eposta));
      void hesapIstek<{ yazildi: boolean; duzen: Duzen }>("/api/hesap/galeri", { method: "PUT", govde: d, keepalive: true }).then((r) => {
        if (iptal || !r.ok) return;
        if (!r.yazildi && r.duzen) uygula(r.duzen); // başka cihaz daha yeni yazmış
      });
    };
    const isaretle = () => {
      if (uyguluyor) return;
      zamanYaz(eposta, Date.now());
      if (zamanlayici) clearTimeout(zamanlayici);
      zamanlayici = setTimeout(gonder, 1200);
    };
    const uygula = (d: Duzen) => {
      uyguluyor = true;
      const fav = new Set(d.favoriler);
      const burada = new Set(useProjeler.getState().uretimler.map((x) => x.id));
      disaridakiFavoriler = d.favoriler.filter((id) => !burada.has(id));
      useProjeler.setState((s) => ({ uretimler: s.uretimler.map((u) => (!!u.favori === fav.has(u.id) ? u : { ...u, favori: fav.has(u.id) })) }));
      useKoleksiyon.getState().hepsiniYaz(d.klasorler);
      zamanYaz(eposta, d.guncelleme);
      uyguluyor = false;
    };

    void hesapIstek<{ duzen: Duzen | null }>("/api/hesap/galeri").then((r) => {
      if (iptal || !r.ok) return;
      if (r.duzen) { const burada = new Set(useProjeler.getState().uretimler.map((x) => x.id)); disaridakiFavoriler = r.duzen.favoriler.filter((id) => !burada.has(id)); }
      const yerel = zamanOku(eposta);
      if (r.duzen && r.duzen.guncelleme > yerel) uygula(r.duzen);
      else if (!r.duzen || yerel > r.duzen.guncelleme) { if (!yerel) zamanYaz(eposta, Date.now()); gonder(); }
    });

    let sonFavori = favoriImzasi();
    const c1 = useProjeler.subscribe(() => { const f = favoriImzasi(); if (f !== sonFavori) { sonFavori = f; isaretle(); } });
    const c2 = useKoleksiyon.subscribe((s, o) => { if (s.koleksiyonlar !== o.koleksiyonlar) isaretle(); });
    return () => { iptal = true; c1(); c2(); if (zamanlayici) { clearTimeout(zamanlayici); gonder(); } };
  }, [eposta]);

  return null;
}
