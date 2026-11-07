import "server-only";
import { coz, sifrele } from "@/lib/build/sifre";
import { hesapGuncelle, olayEkle } from "./depo";
import { totpDogrula, yedekKodlarUret, yedekNormal, yedekOzeti } from "./totp";

/** 6 rakam doğrulama uygulaması kodu; harf içeren 8 karakter yedek kod sayılır. */
export const yedekMi = (kod: string) => /[a-z]/i.test(kod) || yedekNormal(kod).length === 8;

/**
 * Hesabın iki adım kodunu doğrular ve tüketir (TOTP adımı ya da yedek kod bir daha geçmez).
 * "kapali": hesapta iki adım yok.
 */
export async function ikiAdimKoduKullan(uid: string, kod: unknown, g: { cihaz: string; ip?: string }): Promise<"tamam" | "hatali" | "kapali"> {
  const k = String(kod ?? "").trim();
  if (!k || k.length > 20) return "hatali";
  const r = await hesapGuncelle(uid, (h) => {
    if (!h.ikiAdim) return "kapali" as const;
    if (yedekMi(k)) {
      const oz = yedekOzeti(k);
      const y = h.ikiAdim.yedekler.find((x) => !x.kullanildi && x.ozet === oz);
      if (!y) return "hatali" as const;
      y.kullanildi = Date.now();
      olayEkle(h, "yedek-kod", g.cihaz, `${h.ikiAdim.yedekler.filter((x) => !x.kullanildi).length} yedek kod kaldı`, g.ip);
      return "tamam" as const;
    }
    const sir = coz(h.ikiAdim.sir);
    if (!sir) return "hatali" as const;
    const adim = totpDogrula(sir, k, h.ikiAdim.sonAdim);
    if (adim === null) return "hatali" as const;
    h.ikiAdim.sonAdim = adim;
    return "tamam" as const;
  });
  return r?.sonuc ?? "hatali";
}

export function yedekSeti() {
  const kodlar = yedekKodlarUret();
  return { kodlar, kayit: kodlar.map((kod) => ({ ozet: yedekOzeti(kod), kullanildi: null as number | null })) };
}

export { sifrele as sirSifrele, coz as sirCoz };
