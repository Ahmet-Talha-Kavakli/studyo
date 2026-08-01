/**
 * Efektif kullanıcı — seed + aksiyon overlay birleştirici.
 * Admin bir kullanıcıya kredi eklerse/tier değiştirirse/banlarsa, seed değişmez
 * ama overlay uygulanır; listelerde ve detayda "efektif" hâli görünür.
 */
import type { AdminKullanici } from "./seed/kullanicilar";
import { useAdminAksiyon } from "@/store/admin/useAdminAksiyon";

export function efektifKullanici(k: AdminKullanici, overlay: {
  krediDelta: Record<string, number>;
  durumDelta: Record<string, string>;
  planDelta: Record<string, string>;
  etiketDelta: Record<string, string[]>;
}): AdminKullanici {
  const kd = overlay.krediDelta[k.id];
  const dd = overlay.durumDelta[k.id];
  const pd = overlay.planDelta[k.id];
  const ed = overlay.etiketDelta[k.id];
  if (kd === undefined && dd === undefined && pd === undefined && !ed) return k;
  return {
    ...k,
    krediBakiye: Math.max(0, k.krediBakiye + (kd ?? 0)),
    durum: (dd as AdminKullanici["durum"]) ?? k.durum,
    plan: pd ?? k.plan,
    etiketler: ed ? [...new Set([...k.etiketler, ...ed])] : k.etiketler,
  };
}

/** Hook: overlay'i store'dan çekip efektif kullanıcı üretir. */
export function useEfektif() {
  const krediDelta = useAdminAksiyon((s) => s.krediDelta);
  const durumDelta = useAdminAksiyon((s) => s.durumDelta);
  const planDelta = useAdminAksiyon((s) => s.planDelta);
  const etiketDelta = useAdminAksiyon((s) => s.etiketDelta);
  return (k: AdminKullanici) => efektifKullanici(k, { krediDelta, durumDelta, planDelta, etiketDelta });
}
