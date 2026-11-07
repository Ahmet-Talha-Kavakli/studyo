import { govdeOku, hata, hizHatasi, hizSiniri, tamam } from "@/lib/hesap/guvenlik";
import { krediOzeti } from "@/lib/hesap/kredi";
import { odemeDurumu } from "@/lib/odeme/ayar";
import { kayitOku } from "@/lib/odeme/depo";
import { abonelikDenetle, abonelikIslem, abonelikOzeti, haklarOzeti } from "@/lib/odeme/motor";
import { baglamAl, hataYanit } from "@/lib/odeme/uc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function durum(uid: string, plan: Parameters<typeof krediOzeti>[1]) {
  const k = await kayitOku(uid);
  return { abonelik: abonelikOzeti(k.abonelik), haklar: haklarOzeti(k), kredi: await krediOzeti(uid, plan), odeme: odemeDurumu() };
}

/** Abonelik durumu. Açılışta zamanla değişen durum (dönem sonu, hatırlatma, Stripe eşitlemesi) işlenir. */
export async function GET(req: Request) {
  const b = await baglamAl(req);
  if (b instanceof Response) return b;
  await abonelikDenetle(b.uid).catch((e) => console.error("[odeme-abonelik]", (e as Error).message));
  return tamam(await durum(b.uid, b.hesap.plan));
}

/** { islem: "iptal", neden? } | { islem: "surdur" } | { islem: "degisikligiKaldir" } */
export async function POST(req: Request) {
  const b = await baglamAl(req);
  if (b instanceof Response) return b;
  const bekle = hizSiniri(`odeme-abonelik:${b.uid}`, 20, 600_000, false);
  if (bekle) return hizHatasi(bekle);
  const g = await govdeOku<{ islem?: string; neden?: string }>(req, 2_000);
  const islem = g?.islem;
  if (islem !== "iptal" && islem !== "surdur" && islem !== "degisikligiKaldir") return hata("İşlem tanınmadı.");
  try {
    const mesaj = await abonelikIslem(b.uid, islem === "iptal" ? { islem, neden: String(g?.neden ?? "").slice(0, 120) } : { islem });
    return tamam({ mesaj, ...(await durum(b.uid, b.hesap.plan)) });
  } catch (e) { return hataYanit(e, "odeme-abonelik"); }
}
