/* ============================================================
   VAYRA API — Doğrulanabilir anahtar sistemi (izomorfik).

   Anahtar biçimi:  vy_{live|test}_{32hex-gövde}{8hex-checksum}
   checksum = HMAC-SHA256(gövde, VAYRA_ANAHTAR_SIRRI)  ilk 8 hex hanesi.

   Böylece HERHANGİ bir sunucu, veritabanına bakmadan anahtarın
   Vayra tarafından üretildiğini kriptografik olarak doğrulayabilir
   (tıpkı Stripe'ın anahtar checksum'ı gibi). Tarayıcı Web Crypto,
   Node ise crypto kullanır — aynı sonucu verir.

   NOT: Demo amaçlı sır kaynakta; gerçek üründe yalnızca sunucuda tutulur.
   ============================================================ */

export const ANAHTAR_SIRRI = "vayra_anahtar_imza_siri_2026";
const HEX = /^[0-9a-f]+$/;

/** İzomorfik HMAC-SHA256 → hex. */
export async function hmacHex(mesaj: string, sir = ANAHTAR_SIRRI): Promise<string> {
  // Node (sunucu) yolu
  if (typeof window === "undefined") {
    const { createHmac } = await import("crypto");
    return createHmac("sha256", sir).update(mesaj).digest("hex");
  }
  // Tarayıcı yolu (Web Crypto)
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(sir), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const imza = await crypto.subtle.sign("HMAC", key, enc.encode(mesaj));
  return Array.from(new Uint8Array(imza)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Rastgele hex (izomorfik). */
export function rastgeleHex(bayt: number): string {
  const b = new Uint8Array(bayt);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(b);
  else for (let i = 0; i < bayt; i++) b[i] = Math.floor(Math.random() * 256);
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** Checksum'lı, doğrulanabilir anahtar üret. */
export async function anahtarUretDogrulanabilir(ortam: "canli" | "test"): Promise<string> {
  const govde = rastgeleHex(16); // 32 hex
  const cs = (await hmacHex(govde)).slice(0, 8);
  return `vy_${ortam === "canli" ? "live" : "test"}_${govde}${cs}`;
}

export interface AnahtarCozum {
  gecerli: boolean;
  ortam?: "canli" | "test";
  govde?: string;
  neden?: string;
}

/** Anahtarı ayrıştır ve checksum'ını doğrula (DB'siz). */
export async function anahtarDogrula(anahtar: string | null | undefined): Promise<AnahtarCozum> {
  if (!anahtar) return { gecerli: false, neden: "Anahtar yok" };
  const t = anahtar.trim();
  const m = t.match(/^vy_(live|test)_([0-9a-f]{32})([0-9a-f]{8})$/);
  if (!m) return { gecerli: false, neden: "Biçim geçersiz (vy_live_… / vy_test_… bekleniyor)" };
  const [, ort, govde, cs] = m;
  if (!HEX.test(govde) || !HEX.test(cs)) return { gecerli: false, neden: "Biçim geçersiz" };
  const beklenen = (await hmacHex(govde)).slice(0, 8);
  if (beklenen !== cs) return { gecerli: false, neden: "Checksum uyuşmuyor — anahtar Vayra tarafından üretilmemiş" };
  return { gecerli: true, ortam: ort === "live" ? "canli" : "test", govde };
}

/** Authorization header'ından Bearer anahtarını çıkar. */
export function bearerCikar(header: string | null): string | null {
  if (!header) return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}
