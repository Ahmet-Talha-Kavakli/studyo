import { hesapGuncelle } from "@/lib/hesap/depo";
import { hata, tamam } from "@/lib/hesap/guvenlik";
import { benYaniti, rolHesapla, rolYukselt, sunucuDurumu } from "@/lib/hesap/hesap";
import { OTURUM_CEREZI, cerezOku, oturumCereziSil, oturumOku } from "@/lib/hesap/oturum";
import { adminIkiAdimTamam } from "@/lib/hesap/yetki";
import { PLAN_KREDI } from "@/lib/fiyat";
import { alanOzeti } from "@/lib/alan/depo";
import { alanCerezi, etkinAlanSessiz } from "@/lib/alan/etkin";
import { alanKrediBilgisi } from "@/lib/alan/kredi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Oturumdaki hesap: profil, kredi bakiyesi, güvenlik özeti ve sunucunun yetenekleri.
 * ?yetki=1 yalnız rolü (yöneticide iki adım durumunu da) döndürür (yönetim sayfası ara katmanı için hafif yanıt).
 */
export async function GET(req: Request) {
  const o = await oturumOku(req);
  if (!o) {
    const cerezVar = !!cerezOku(req, OTURUM_CEREZI);
    return hata("Oturum açık değil.", 401, { kod: "oturum", sunucu: sunucuDurumu() }, cerezVar ? { "Set-Cookie": oturumCereziSil() } : undefined);
  }
  if (new URL(req.url).searchParams.get("yetki") === "1") return tamam({ rol: rolHesapla(o.hesap), ...(rolHesapla(o.hesap) === "admin" ? { ikiAdim: adminIkiAdimTamam(o) } : {}) });
  let h = o.hesap;
  if (h.rol !== "admin" && rolHesapla(h) === "admin") h = (await hesapGuncelle(h.uid, rolYukselt))?.hesap ?? h;
  const { ok: _ok, ...b } = await benYaniti(h, o.oturum.id); void _ok;
  // Etkin çalışma alanı: ekrandaki bakiye alanın havuzundan bu üyenin harcayabileceğidir; kişisel alanda değişmez.
  const s = await etkinAlanSessiz(req, h.uid);
  if (s.e) {
    const k = await alanKrediBilgisi(s.e.alan, h.uid);
    b.kullanici = { ...b.kullanici, krediler: k.kullanilabilir, ekKredi: Math.max(0, Math.min(k.donemToplam, k.etkinSinir ?? Infinity) - (PLAN_KREDI[b.kullanici.plan] ?? 0)) };
    b.alan = { ...alanOzeti(s.e.alan, s.e.uye.rol), kredi: k };
  } else b.alan = null;
  return tamam(b, 200, s.bayat ? { "Set-Cookie": alanCerezi("kisisel") } : undefined);
}
