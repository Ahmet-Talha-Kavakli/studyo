"use client";

import { toast } from "@/lib/toast";
import type { Paylasim } from "@/lib/paylasim";

/** Paylaşım bağlantısı oluşturur (ya da var olanı kullanır), panoya kopyalar ve bildirir. */
export async function paylasimBaglantisi(g: Omit<Paylasim, "id" | "olusturma">, mevcutId?: string): Promise<string | null> {
  let id = mevcutId;
  if (!id) {
    try {
      const j = (await (await fetch("/api/paylas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(g) })).json()) as { ok: boolean; id?: string; hata?: string };
      if (!j.ok || !j.id) { toast.error("Paylaşılamadı", { description: j.hata ?? "Paylaşım bağlantısı oluşturulamadı. Yeniden dene." }); return null; }
      id = j.id;
    } catch { toast.error("Paylaşılamadı", { description: "Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip yeniden dene." }); return null; }
  }
  const adres = `${location.origin}/p/${id}`;
  const kopyalandi = await navigator.clipboard.writeText(adres).then(() => true, () => false);
  if (kopyalandi) toast.success("Paylaşım bağlantısı kopyalandı", { description: adres });
  else toast.warning("Paylaşım bağlantısı oluşturuldu", { description: `Panoya kopyalanamadı. Bağlantıyı elle kopyala: ${adres}` });
  return id;
}
