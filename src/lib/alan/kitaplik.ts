import "server-only";
import { randomBytes } from "crypto";
import path from "path";
import { hesapOku, satirEkle } from "@/lib/hesap/depo";
import { AD, alanOku, jsonlOku, uyeBul } from "./depo";
import type { AlanKitaplikOgesi } from "./tipler";

/**
 * Alan kitaplığı: alanda üretilen (etkin alan seçiliyken sunucuda biten) çıktılar kendiliğinden, kişisel kitaplıktan
 * "Alana ekle" ile seçilenler elle eklenir. jsonl'e yalnız eklenir; silme bir işaret satırıdır.
 */
type Satir = AlanKitaplikOgesi | { id: string; sil: 1; zaman: number; uid: string };
const dosya = (id: string) => path.join(AD.kitaplik, `${id}.jsonl`);
const TURLER = new Set(["gorsel", "video", "ses", "3d", "muzik"]);
export const kitaplikUrlGecerli = (u: unknown): u is string => typeof u === "string" && ((/^\/(?!\/)[\w\-./%]{1,300}$/.test(u) && !u.includes("..")) || /^https:\/\/[^\s"'<>]{4,600}$/.test(u));

export async function kitaplikEkle(alanId: string, uid: string, g: { tur: string; model?: string; istem?: string; url: string; kapak?: string; kredi?: number }): Promise<AlanKitaplikOgesi | null> {
  if (!TURLER.has(g.tur) || !kitaplikUrlGecerli(g.url)) return null;
  const h = await hesapOku(uid);
  const o: AlanKitaplikOgesi = {
    id: `k_${randomBytes(8).toString("base64url")}`, zaman: Date.now(), uid, ad: h?.profil.ad ?? "Üye", tur: g.tur as AlanKitaplikOgesi["tur"],
    model: String(g.model ?? "").slice(0, 80), istem: String(g.istem ?? "").slice(0, 600), url: g.url,
    ...(kitaplikUrlGecerli(g.kapak) ? { kapak: g.kapak } : {}), ...(g.kredi ? { kredi: Math.max(0, Math.round(g.kredi)) } : {}),
  };
  await satirEkle(dosya(alanId), o);
  return o;
}

export async function kitaplikListe(alanId: string): Promise<AlanKitaplikOgesi[]> {
  const l = await jsonlOku<Satir>(dosya(alanId), 6_000_000);
  const silinen = new Set(l.filter((x) => "sil" in x).map((x) => x.id));
  return (l.filter((x) => !("sil" in x) && !silinen.has(x.id)) as AlanKitaplikOgesi[]).reverse();
}

export async function kitaplikSil(alanId: string, id: string, uid: string) {
  await satirEkle(dosya(alanId), { id, sil: 1, zaman: Date.now(), uid } satisfies Satir);
}

/** Üretim rotaları için: harcama bir alandan yapıldıysa çıktıyı alan kitaplığına yazar. Hata fırlatmaz. */
export async function alanUretimKaydet(k: { alan?: string; uid: string; tutar: number }, g: { tur: string; model?: string; istem?: string; url?: string; kapak?: string }) {
  if (!k.alan || !g.url) return;
  try {
    const a = await alanOku(k.alan);
    if (!a || !uyeBul(a, k.uid)) return;
    await kitaplikEkle(k.alan, k.uid, { ...g, url: g.url, kredi: k.tutar });
  } catch (e) { console.error("[alan] kitaplığa yazılamadı:", (e as Error).message); }
}
