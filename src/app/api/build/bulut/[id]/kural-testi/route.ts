import { projeOku } from "@/lib/build/depo";
import { bulunamadi, sahipAl, yetkisiz } from "@/lib/build/sunucu";
import { uyeleriListele } from "@/lib/build/uye";
import { veriOku, type Kayit, type Kural } from "@/lib/build/veri";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Üye gibi gör (erişim kuralı deneyicisi): ?kim=ziyaretci | <uyeId>. Her tablo için okuma, ekleme ve değiştirme
 * kararını, kararı veren kuralı, gerekçesini ve o kişinin görebileceği kayıtlardan önizlemeyi döner. Karar mantığı
 * /api/build/veri ile birebir aynıdır (sahibi: kaydın uyeId alanı üyenin kimliği).
 */
const KURAL_AD: Record<Kural, string> = { herkes: "Herkes", uyeler: "Giriş yapmış üyeler", sahibi: "Yalnız kaydın sahibi", kapali: "Yalnız sen" };
const izin = (kural: Kural, uyeId: string | null, kayit?: Kayit) => kural === "herkes" || (kural === "uyeler" && !!uyeId) || (kural === "sahibi" && !!uyeId && (!kayit || kayit.uyeId === uyeId));

function neden(islem: "okuma" | "ekleme" | "duzenleme", kural: Kural, uye: boolean, sayi?: number): string {
  const fiil = islem === "okuma" ? "okuyabilir" : islem === "ekleme" ? "kayıt ekleyebilir" : "değiştirip silebilir";
  if (kural === "herkes") return `Kural herkese açık; giriş yapmamış ziyaretçi de ${fiil}.`;
  if (kural === "kapali") return `Kural yalnız sana açık; ne ziyaretçi ne üye ${fiil}. Site bu işi sunucu fonksiyonuyla yapmalı.`;
  if (kural === "uyeler") return uye ? `Giriş yaptığı için ${fiil}.` : `Önce giriş yapması gerekir; giriş yapmamış ziyaretçi ${islem === "okuma" ? "okuyamaz" : islem === "ekleme" ? "ekleyemez" : "değiştiremez"}.`;
  if (!uye) return "Yalnız kaydın sahibi olan üye yetkili; giriş yapmamış ziyaretçinin kaydı olmaz.";
  return islem === "ekleme" ? "Giriş yaptığı için ekleyebilir; eklediği kayıt kendisine bağlanır." : `Yalnız kendi kayıtlarını ${islem === "okuma" ? "görür" : "değiştirebilir"}${sayi != null ? ` (${sayi} kayıt)` : ""}.`;
}
const ozetle = (k: Kayit) => Object.fromEntries(Object.entries(k).filter(([a]) => !["olusturma", "guncelleme"].includes(a)).slice(0, 6).map(([a, v]) => [a, typeof v === "string" ? v.slice(0, 80) : typeof v === "object" && v !== null ? JSON.stringify(v).slice(0, 80) : v]));

export async function GET(req: Request, { params }: Ctx) {
  const sahip = sahipAl(req);
  if (!sahip) return yetkisiz();
  const id = (await params).id;
  if (!(await projeOku(id, sahip))) return bulunamadi();
  const kim = new URL(req.url).searchParams.get("kim") ?? "ziyaretci";
  const uye = kim === "ziyaretci" ? null : (await uyeleriListele(id)).find((u) => u.id === kim) ?? null;
  if (kim !== "ziyaretci" && !uye) return Response.json({ ok: false, hata: "Üye bulunamadı." }, { status: 404 });
  const yasakli = !!uye?.yasakBitis && uye.yasakBitis > Date.now();
  const uyeId = uye && !yasakli ? uye.id : null;
  const v = await veriOku(id);
  const tablolar = Object.entries(v.koleksiyonlar).map(([ad, k]) => {
    const okunur = izin(k.kurallar.okuma, uyeId) ? (k.kurallar.okuma === "sahibi" ? k.kayitlar.filter((x) => x.uyeId === uyeId) : k.kayitlar) : [];
    const degisir = k.kayitlar.filter((x) => izin(k.kurallar.duzenleme, uyeId, x));
    return {
      ad, toplam: k.kayitlar.length, kurallar: k.kurallar,
      okuma: { izin: izin(k.kurallar.okuma, uyeId), kural: k.kurallar.okuma, kuralAd: KURAL_AD[k.kurallar.okuma], neden: neden("okuma", k.kurallar.okuma, !!uyeId, okunur.length), gorulen: okunur.length },
      ekleme: { izin: izin(k.kurallar.ekleme, uyeId), kural: k.kurallar.ekleme, kuralAd: KURAL_AD[k.kurallar.ekleme], neden: neden("ekleme", k.kurallar.ekleme, !!uyeId) },
      duzenleme: { izin: izin(k.kurallar.duzenleme, uyeId), kural: k.kurallar.duzenleme, kuralAd: KURAL_AD[k.kurallar.duzenleme], neden: neden("duzenleme", k.kurallar.duzenleme, !!uyeId, degisir.length), degisebilen: degisir.length },
      onizleme: [...okunur].reverse().slice(0, 5).map(ozetle),
    };
  });
  return Response.json({ ok: true, kim: uye ? { id: uye.id, ad: uye.ad, eposta: uye.eposta, yasakli } : null, tablolar });
}
