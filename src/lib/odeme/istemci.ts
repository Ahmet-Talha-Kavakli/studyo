"use client";

/**
 * Ödeme API'sinin tarayıcı tarafı. Fiyat gönderilmez: yalnız ürün kimliği. Ödeme her zaman sağlayıcının güvenli
 * sayfasında yapılır; dönüşte /odeme/sonuc sunucudan durumu okur ve bakiye ile planı sunucuyla eşitler.
 */
import { hesapIstek } from "@/lib/hesap/istemci";
import type { KrediOzeti } from "@/lib/hesap/tipler";
import type {
  AbonelikOzeti, FaturaBilgisi, HaklarYaniti, KrediKaydi, OdemeDurumu, OdemeIstegi, OnizlemeYaniti, SiparisOzeti,
} from "./tipler";

export const odemeDurumuGetir = () => hesapIstek<{ durum: OdemeDurumu }>("/api/odeme/durum");
export const onizle = (i: OdemeIstegi) => hesapIstek<Omit<OnizlemeYaniti, "ok">>("/api/odeme/onizle", { govde: i });
export const baslat = (i: OdemeIstegi) => hesapIstek<{ no?: string; adres?: string; planlandi?: true; mesaj?: string }>("/api/odeme/baslat", { govde: i });
export const siparisGetir = (no: string) => hesapIstek<{ siparis: SiparisOzeti; kredi: KrediOzeti }>(`/api/odeme/siparis/${encodeURIComponent(no)}`);
export const gecmisGetir = () => hesapIstek<{ siparisler: SiparisOzeti[]; krediKayitlari: KrediKaydi[]; abonelik: AbonelikOzeti | null; haklar: HaklarYaniti; fatura: FaturaBilgisi | null; durum: OdemeDurumu }>("/api/odeme/gecmis");
export const abonelikGetir = () => hesapIstek<{ abonelik: AbonelikOzeti | null; haklar: HaklarYaniti; kredi: KrediOzeti; odeme: OdemeDurumu }>("/api/odeme/abonelik");
export const abonelikIslemi = (g: { islem: "iptal"; neden?: string } | { islem: "surdur" } | { islem: "degisikligiKaldir" }) =>
  hesapIstek<{ mesaj: string; abonelik: AbonelikOzeti | null; haklar: HaklarYaniti; kredi: KrediOzeti }>("/api/odeme/abonelik", { govde: g });
export const faturaGetir = () => hesapIstek<{ fatura: FaturaBilgisi | null; tamam: boolean; efatura: boolean }>("/api/odeme/fatura");
export const faturaKaydet = (f: FaturaBilgisi) => hesapIstek<{ fatura: FaturaBilgisi; tamam: boolean; hatalar?: Record<string, string> }>("/api/odeme/fatura", { method: "PUT", govde: { fatura: f } });
export const denemeSonucu = (no: string, sonuc: "basarili" | "basarisiz" | "iptal") => hesapIstek<{ siparis: SiparisOzeti }>("/api/odeme/deneme", { govde: { no, sonuc } });
export const denemeSiparisi = (no: string) => hesapIstek<{ siparis: SiparisOzeti; acik: boolean }>(`/api/odeme/deneme?s=${encodeURIComponent(no)}`);
export const portalAc = () => hesapIstek<{ adres: string }>("/api/odeme/portal", { govde: {} });
export const haklarGetir = () => hesapIstek<{ haklar: HaklarYaniti }>("/api/odeme/haklar");
export const gorevOdulAl = (id: string) => hesapIstek<{ kredi: number; bakiye: number }>("/api/odeme/gorev", { govde: { id } });
export const alinanGorevlerGetir = () => hesapIstek<{ alinanlar: string[] }>("/api/odeme/gorev");

/** Sunucudaki süreli hakları (sınırsız erişim, hız) tarayıcıdaki ekler deposuna yazar. */
export async function haklariEsitle(h?: HaklarYaniti) {
  const veri = h ?? (await haklarGetir().then((r) => (r.ok ? r.haklar : null)));
  if (!veri) return;
  const { useEkler } = await import("@/store/useEkler");
  useEkler.setState({
    sinirsizlar: veri.sinirsiz.map((x) => ({ model: x.model, kalite: x.kalite, bitis: x.bitis })),
    ...(veri.hiz ? { hiz: veri.hiz.seviye, ekEsZamanli: veri.hiz.ekEsZamanli } : { hiz: "standart" as const, ekEsZamanli: 0 }),
  });
}

/** Bakiye, plan ve haklar sunucudan yeniden okunur (krediyi tarayıcıda eklemez). */
export async function hesabiTazele(h?: HaklarYaniti) {
  const { useAuth } = await import("@/store/useAuth");
  await useAuth.getState().esitle();
  await haklariEsitle(h);
}
