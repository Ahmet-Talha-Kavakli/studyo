/**
 * WRITE tool köprüsü — Claude bir write-tool çağırınca frontend'de çalışır:
 * kademeli onay iste → onaylanınca gerçek store aksiyonu + audit → sonuç döner.
 */
import type { OnayIstek } from "@/components/admin/ui/Onay";
import { aksiyonRisk } from "@/lib/admin/guvenlik/roller";
import { useAdminAksiyon } from "@/store/admin/useAdminAksiyon";
import { useAdminKupon } from "@/store/admin/useAdminKupon";
import { useAdminOturum } from "@/store/admin/useAdminOturum";
import { veri } from "@/lib/admin/seed";

export interface WriteSonuc {
  onaylandi: boolean;
  sonuc: string;
}

/** Bir write tool'u onaydan geçirip uygular. onayIste + toast dışarıdan gelir. */
export async function writeToolUygula(
  name: string,
  girdi: Record<string, unknown>,
  onayIste: (i: OnayIstek) => Promise<boolean>,
): Promise<WriteSonuc> {
  const aks = useAdminAksiyon.getState();
  const kupon = useAdminKupon.getState();
  const oturum = useAdminOturum.getState();
  const admin = oturum.aktifAdmin ?? "ai";
  const rol = oturum.aktifRol!;
  const risk = aksiyonRisk(name);
  const denetle = (eylem: string, onem: "bilgi" | "uyari" | "kritik", hedef?: string) =>
    oturum.denetle({ admin, rol, eylem, hedef, onem, arac: "ai" });

  const kulAd = (id: string) => veri().kullanicilar.find((k) => k.id === id)?.ad ?? id;

  switch (name) {
    case "kredi_ekle": {
      const { kullaniciId, miktar, sebep } = girdi as { kullaniciId: string; miktar: number; sebep: string };
      const ok = await onayIste({ baslik: `${miktar} kredi ekle`, aciklama: `AI önerisi: ${kulAd(kullaniciId)} hesabına ${miktar} kredi. Sebep: ${sebep}`, risk: risk.risk, eylemEtiket: "Uygula" });
      if (!ok) return { onaylandi: false, sonuc: "Kullanıcı onaylamadı." };
      aks.krediDuzelt(kullaniciId, miktar);
      aks.ledgerEkle({ kullaniciId, miktar, sebep: `AI: ${sebep}`, yapan: admin });
      denetle(`AI ile kredi eklendi: ${miktar}`, "kritik", kulAd(kullaniciId));
      return { onaylandi: true, sonuc: `${kulAd(kullaniciId)} hesabına ${miktar} kredi eklendi.` };
    }
    case "plan_degistir": {
      const { kullaniciId, plan } = girdi as { kullaniciId: string; plan: string };
      const ok = await onayIste({ baslik: "Plan değiştir", aciklama: `AI önerisi: ${kulAd(kullaniciId)} planı → ${plan}`, risk: risk.risk, eylemEtiket: "Değiştir" });
      if (!ok) return { onaylandi: false, sonuc: "Kullanıcı onaylamadı." };
      aks.planDegistir(kullaniciId, plan);
      denetle(`AI ile plan değiştirildi → ${plan}`, "uyari", kulAd(kullaniciId));
      return { onaylandi: true, sonuc: `${kulAd(kullaniciId)} planı ${plan} olarak değiştirildi.` };
    }
    case "kullanici_banla": {
      const { kullaniciId } = girdi as { kullaniciId: string; sebep?: string };
      const ok = await onayIste({ baslik: "Kullanıcıyı banla", aciklama: `AI önerisi: ${kulAd(kullaniciId)} banlanacak. YÜKSEK RİSK.`, risk: risk.risk, onayMetin: risk.onayMetin, eylemEtiket: "BANLA" });
      if (!ok) return { onaylandi: false, sonuc: "Kullanıcı onaylamadı." };
      aks.durumDegistir(kullaniciId, "banli");
      denetle("AI ile kullanıcı banlandı", "kritik", kulAd(kullaniciId));
      return { onaylandi: true, sonuc: `${kulAd(kullaniciId)} banlandı.` };
    }
    case "kupon_olustur": {
      const { kod, tur, deger } = girdi as { kod: string; tur: string; deger: number };
      const ok = await onayIste({ baslik: "Kupon oluştur", aciklama: `AI önerisi: ${kod} · ${tur} · ${deger}`, risk: risk.risk, eylemEtiket: "Oluştur" });
      if (!ok) return { onaylandi: false, sonuc: "Kullanıcı onaylamadı." };
      kupon.ekle({ kod: kod.toUpperCase(), tur: tur as "yuzde" | "bonus_kredi", deger, kullanimLimit: 1000, kisiBasiLimit: 1, baslangic: Date.now(), bitis: Date.now() + 30 * 86400000, planlar: "Tümü", yeniKullanici: false, aktif: true });
      denetle(`AI ile kupon oluşturuldu: ${kod}`, "bilgi");
      return { onaylandi: true, sonuc: `${kod} kuponu oluşturuldu.` };
    }
    default:
      return { onaylandi: false, sonuc: `Bilinmeyen write tool: ${name}` };
  }
}
