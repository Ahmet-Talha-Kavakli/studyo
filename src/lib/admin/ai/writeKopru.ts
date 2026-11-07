/**
 * Yazma aracı köprüsü: asistan bir yazma aracı önerince arayüzde onay istenir, onaylanırsa gerçek yönetici işlemi ucu çağrılır.
 * İşlem sunucuda denetim günlüğüne yazılır.
 */
import type { OnayIstek } from "@/components/admin/ui/Onay";
import { adminIslem } from "@/lib/admin/istemci";

export interface WriteSonuc { onaylandi: boolean; sonuc: string }

export async function writeToolUygula(name: string, girdi: Record<string, unknown>, onayIste: (i: OnayIstek) => Promise<boolean>): Promise<WriteSonuc> {
  const uid = String(girdi.kullaniciId ?? "");
  const sebep = String(girdi.sebep ?? "").trim();
  let onay: OnayIstek, govde: Record<string, unknown>;
  switch (name) {
    case "kredi_ekle":
    case "kredi_dus": {
      const miktar = Number(girdi.miktar);
      onay = { baslik: `${miktar} kredi ${name === "kredi_ekle" ? "ekle" : "düş"}`, aciklama: `Asistanın önerisi: ${uid} hesabı. Neden: ${sebep || "belirtilmedi"}.`, risk: name === "kredi_ekle" ? 0 : 1, eylemEtiket: "Uygula" };
      govde = { islem: name === "kredi_ekle" ? "kredi-ekle" : "kredi-dus", miktar, not: `Asistan: ${sebep}` };
      break;
    }
    case "plan_degistir":
      onay = { baslik: "Planı değiştir", aciklama: `Asistanın önerisi: ${uid} hesabının planı ${String(girdi.plan)} olacak. Yeni dönem hemen başlar.`, risk: 1, eylemEtiket: "Değiştir" };
      govde = { islem: "plan", plan: String(girdi.plan ?? ""), not: sebep ? `Asistan: ${sebep}` : "Asistan önerisi" };
      break;
    case "hesabi_askiya_al":
      onay = { baslik: "Hesabı askıya al", aciklama: `Asistanın önerisi: ${uid} hesabı askıya alınacak; kullanıcı giriş yapamaz. Neden: ${sebep}.`, risk: 2, onayMetin: "ASKIYA AL", eylemEtiket: "Askıya al" };
      govde = { islem: "askiya-al", not: `Asistan: ${sebep}` };
      break;
    default:
      return { onaylandi: false, sonuc: `Bilinmeyen işlem: ${name}` };
  }
  if (!(await onayIste(onay))) return { onaylandi: false, sonuc: "Onaylanmadı." };
  const r = await adminIslem(`/api/admin/kullanicilar/${encodeURIComponent(uid)}/islem`, govde);
  return r.ok ? { onaylandi: true, sonuc: String(r.veri.mesaj ?? "Uygulandı.") } : { onaylandi: false, sonuc: r.hata };
}
