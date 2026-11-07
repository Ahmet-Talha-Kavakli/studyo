/**
 * Çalışma alanı API'sinin tarayıcı tarafı. Hiçbir çağrı hata fırlatmaz (lib/hesap/istemci.hesapIstek).
 */
import { hesapIstek } from "@/lib/hesap/istemci";
import type { KrediHareketi } from "@/lib/hesap/tipler";
import type {
  AlanAyrinti, AlanGunlukKaydi, AlanKitaplikOgesi, AlanKrediBilgisi, AlanOzet, AlanProjeBilgisi, AlanRol, AlanUrun,
} from "./tipler";

export type EtkinOzet = AlanOzet & { kredi: AlanKrediBilgisi };
export type Katilabilir = AlanOzet & { alanAdi?: string };

export const alanlarGetir = () => hesapIstek<{ alanlar: AlanOzet[]; etkin: EtkinOzet | null; katilabilir: Katilabilir | null }>("/api/alan");
export const alanOlustur = (ad: string) => hesapIstek<{ alan: AlanOzet }>("/api/alan", { govde: { ad, etkin: true } });
export const etkinSec = (alan: string | null) => hesapIstek<{ etkin: EtkinOzet | null }>("/api/alan/etkin", { govde: { alan } });
export const alanGetir = (id: string) => hesapIstek<{ alan: AlanAyrinti }>(`/api/alan/${id}`);
export const alanYaz = (id: string, g: { ad?: string; logo?: string; varsayilanSinir?: number | null; ayar?: Partial<AlanAyrinti["ayar"]> }) =>
  hesapIstek<{ alan: AlanAyrinti }>(`/api/alan/${id}`, { method: "PATCH", govde: g });
export const alanSil = (id: string, onay: string) => hesapIstek<{ silindi: true; iade: number }>(`/api/alan/${id}`, { method: "DELETE", govde: { onay } });

export const uyeYaz = (id: string, g: { uid: string; rol?: AlanRol; sinir?: number | null }) => hesapIstek<{ alan: AlanAyrinti }>(`/api/alan/${id}/uye`, { method: "PATCH", govde: g });
export const uyeCikar = (id: string, uid: string) => hesapIstek<{ alan: AlanAyrinti }>(`/api/alan/${id}/uye`, { method: "DELETE", govde: { uid } });
export const ayril = (id: string) => hesapIstek<{ ayrildi: true }>(`/api/alan/${id}/uye`, { govde: { islem: "ayril" } });
export const devret = (id: string, uid: string, onay: string) => hesapIstek<{ alan: AlanAyrinti }>(`/api/alan/${id}/uye`, { govde: { islem: "devret", uid, onay } });

export type DavetSonucu = { eposta: string; durum: "gonderildi" | "baglanti" | "uye"; baglanti?: string; hata?: string };
export const davetEt = (id: string, epostalar: string[], rol: AlanRol) =>
  hesapIstek<{ sonuc: DavetSonucu[]; epostaServisi: boolean; gelistirme: boolean; alan: AlanAyrinti }>(`/api/alan/${id}/davet`, { govde: { epostalar, rol } });
export const davetGeriAl = (id: string, davet: string) => hesapIstek<{ alan: AlanAyrinti }>(`/api/alan/${id}/davet`, { method: "DELETE", govde: { id: davet } });
export type DavetOnizleme = {
  alan: { id: string; ad: string; logo?: string; renk: string; uyeSayisi: number }; rol: AlanRol; eposta: string; davetEden: string; bitis: number;
  oturum: { email: string; eslesiyor: boolean; uye: boolean } | null;
};
export const davetKontrol = (b: string) => hesapIstek<DavetOnizleme>("/api/alan/davet", { govde: { b, kontrol: true } });
export const davetKabul = (b: string) => hesapIstek<{ alan: AlanOzet }>("/api/alan/davet", { govde: { b } });
export const alanAdiylaKatil = (id: string) => hesapIstek<{ alan: AlanOzet }>(`/api/alan/${id}/katil`, { govde: {} });

export const krediGetir = (id: string) => hesapIstek<{ kredi: AlanKrediBilgisi; hareketler: KrediHareketi[]; kisiselBakiye: number; plan: AlanOzet["plan"]; planBitis: number | null }>(`/api/alan/${id}/kredi`);
export const krediAktar = (id: string, miktar: number) => hesapIstek<{ kisiselBakiye: number; kredi: AlanKrediBilgisi }>(`/api/alan/${id}/kredi`, { govde: { islem: "aktar", miktar } });

export type KullanimYaniti = {
  gun: number; toplam: number; onceki: number; urunler: Record<AlanUrun, number>; csv: boolean;
  uyeler: { uid: string; ad: string; rol: AlanRol | null; urun: Record<AlanUrun, number>; toplam: number; adet: number; iade: number; ben: boolean }[];
  seri: ({ gun: number } & Record<AlanUrun, number>)[];
  son: { zaman: number; uid: string; ad: string; miktar: number; urun: AlanUrun; kaynak: string; aciklama: string; iade?: boolean }[];
};
export const kullanimGetir = (id: string, gun: number) => hesapIstek<KullanimYaniti>(`/api/alan/${id}/kullanim?gun=${gun}`);
export const gunlukGetir = (id: string, tur?: string) => hesapIstek<{ kayitlar: AlanGunlukKaydi[]; toplam: number }>(`/api/alan/${id}/gunluk${tur ? `?tur=${tur}` : ""}`);

export const alanAdiIslem = (id: string, g: { islem: "ekle"; alan: string } | { islem: "dogrula" } | { islem: "ayar"; acik?: boolean; rol?: "uye" | "izleyici" }) =>
  hesapIstek<{ alan: AlanAyrinti }>(`/api/alan/${id}/alanadi`, { govde: g });
export const alanAdiKaldir = (id: string) => hesapIstek<{ alan: AlanAyrinti }>(`/api/alan/${id}/alanadi`, { method: "DELETE", govde: {} });

export const kitaplikGetir = (id: string, tur?: string) => hesapIstek<{ ogeler: (AlanKitaplikOgesi & { benim: boolean })[]; toplam: number }>(`/api/alan/${id}/kitaplik${tur ? `?tur=${tur}` : ""}`);
export const kitaplikEkle = (id: string, ogeler: { tur: string; model?: string; istem?: string; url: string; kapak?: string }[]) => hesapIstek<{ eklenen: number }>(`/api/alan/${id}/kitaplik`, { govde: { ogeler } });
export const kitaplikSil = (id: string, oge: string) => hesapIstek<{ silindi: true }>(`/api/alan/${id}/kitaplik`, { method: "DELETE", govde: { id: oge } });

/** Build istekleri sahip anahtarını başlıkla taşır; oturum çerezi olan tarayıcıda sunucu hesabın anahtarını kendisi bulur. */
export const projelerGetir = (id: string) => hesapIstek<{ projeler: AlanProjeBilgisi[] }>(`/api/alan/${id}/projeler`);
export const projeAdaylari = (id: string) => hesapIstek<{ projeler: { id: string; ad: string; tur: string; kapak?: string; guncelleme: number }[] }>(`/api/alan/${id}/projeler?aday=1`);
export const projeEkle = (id: string, proje: string) => hesapIstek(`/api/alan/${id}/projeler`, { govde: { id: proje } });
export const projeCikar = (id: string, proje: string) => hesapIstek(`/api/alan/${id}/projeler`, { method: "DELETE", govde: { id: proje } });
