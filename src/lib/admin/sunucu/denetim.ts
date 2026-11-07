import "server-only";
import { open } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { satirEkle, yeniKimlik } from "@/lib/hesap/depo";
import { istemciIp, ipGizle } from "@/lib/hesap/guvenlik";
import type { GecerliOturum } from "@/lib/hesap/oturum";

/**
 * Yönetici işlemlerinin denetim günlüğü: .veri/yonetim/denetim.ndjson (yalnız sona eklenir, hiç değiştirilmez).
 * Her satır bir işlem: kim, ne zaman, hangi hesaba, ne yaptı. Güvenlik sayfası ve kullanıcı ayrıntısı buradan okur.
 */
export const YONETIM_KOK = path.join(DEPO_KOK, "yonetim");
const DOSYA = path.join(YONETIM_KOK, "denetim.ndjson");

export type DenetimOnem = "bilgi" | "uyari" | "kritik";

export interface DenetimKaydi {
  id: string;
  zaman: number;
  admin: { uid: string; email: string };
  eylem: string;
  /** İşlem türü (süzgeç için): kredi-ekle, kredi-dus, plan, askiya-al, askidan-cikar, oturum-kapat, dogrulama-gonder, hesap-sil, destek, icerik, panel ... */
  tur: string;
  hedef?: { uid?: string; email?: string; kimlik?: string };
  ayrinti?: string;
  onem: DenetimOnem;
  ip?: string;
}

export async function denetimYaz(o: GecerliOturum, req: Request, g: { tur: string; eylem: string; hedef?: DenetimKaydi["hedef"]; ayrinti?: string; onem?: DenetimOnem }): Promise<DenetimKaydi> {
  const k: DenetimKaydi = {
    id: yeniKimlik("dn"), zaman: Date.now(), admin: { uid: o.hesap.uid, email: o.hesap.email }, tur: g.tur, eylem: g.eylem.slice(0, 200),
    ...(g.hedef ? { hedef: g.hedef } : {}), ...(g.ayrinti ? { ayrinti: g.ayrinti.slice(0, 500) } : {}), onem: g.onem ?? "bilgi", ip: ipGizle(istemciIp(req)),
  };
  await satirEkle(DOSYA, k);
  return k;
}

/** Son kayıtlar (en yeni başta). Dosyanın yalnız sonu okunur. */
export async function denetimOku(adet = 500): Promise<DenetimKaydi[]> {
  let fh;
  try { fh = await open(DOSYA, "r"); } catch { return []; }
  try {
    const { size } = await fh.stat();
    const oku = Math.min(size, Math.max(65_536, adet * 600));
    const b = Buffer.alloc(oku);
    await fh.read(b, 0, oku, size - oku);
    const satirlar = b.toString("utf8").split("\n").filter(Boolean);
    if (oku < size) satirlar.shift();
    const l: DenetimKaydi[] = [];
    for (const s of satirlar) { try { l.push(JSON.parse(s)); } catch { /* yarım satır */ } }
    return l.slice(-adet).reverse();
  } finally { await fh.close(); }
}

/** Panel açılışı: aynı yönetici için yarım saatte en çok bir kez yazılır. */
const G = globalThis as unknown as { __vayraPanelAcilis?: Map<string, number> };
const ACILIS = (G.__vayraPanelAcilis ??= new Map());
export async function panelAcilisiYaz(o: GecerliOturum, req: Request) {
  const anahtar = `${o.hesap.uid}:${o.oturum.id}`;
  if ((ACILIS.get(anahtar) ?? 0) > Date.now() - 30 * 60_000) return;
  ACILIS.set(anahtar, Date.now());
  await denetimYaz(o, req, { tur: "panel", eylem: "Yönetim paneli açıldı", ayrinti: `${o.oturum.tarayici} · ${o.oturum.isletim}` }).catch(() => {});
}
