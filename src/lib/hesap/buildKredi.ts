import "server-only";
import { createHash } from "crypto";
import path from "path";
import { buildAnahtarHesabi } from "./build";
import { HESAP_KOK, hesapOku, jsonOku, jsonYaz, kilitle, ozet } from "./depo";
import { krediHarca, krediOzeti } from "./kredi";
import { etkinAlanSunucu } from "@/lib/alan/etkin";
import { alanKrediBilgisi, alanKrediKes } from "@/lib/alan/kredi";

/**
 * Vayra Build kredisi sunucuda düşer.
 *
 * Build işlerinin bedeli (model token'ı, araçlar) iş bitince belli olur; bu yüzden:
 *  1. İş başlamadan buildKrediYeterli ile bakiye denetlenir (sıfırsa iş başlamaz).
 *  2. İş bitince buildKrediKes kullanılan krediyi hesaptan düşer. Bakiye bedelin altına inmişse kalan bakiye düşer
 *     (bakiye hiçbir zaman eksiye inmez) ve sonraki iş başlamaz.
 * Kesinti idempotenttir: aynı iş (anahtar) iki kez düşülmez. Tarayıcı artık Build kredisini kendisi düşmez;
 * yanıttaki bakiyeyle ekranı eşitler.
 *
 * Sahip anahtarı bir hesaba bağlı değilse (yalnız geliştirmede, eski cihaz kimliği) kesinti yapılmaz.
 */

export type BuildKrediSonucu = { kesilen: number; bakiye: number; eksik: number } | null;

const anahtarYap = (kaynak: string, is: string) => `bk_${createHash("sha256").update(`${kaynak}|${is}`).digest("base64url").slice(0, 40)}`;

/**
 * Build sahibi: ham sahip anahtarı ya da (sistemler, ajanlar gibi yalnız özetini saklayan yerler için) { oz }.
 * Özet → hesap eşlemesi, ham anahtarla gelen her Build isteğinde kaydedilir.
 */
export type BuildSahip = string | { oz: string };
const sahipOzetiHesapla = (anahtar: string) => createHash("sha256").update(`vayra-build:${anahtar}`).digest("hex").slice(0, 40);
const ozDosyasi = (oz: string) => path.join(HESAP_KOK, "build-oz", `${oz.replace(/[^a-f0-9]/g, "").slice(0, 40)}.json`);
const OZ_YAZILDI = ((globalThis as unknown as { __vayraBuildOz?: Set<string> }).__vayraBuildOz ??= new Set());

/** Ham sahip anahtarının özet eşlemesini (bir kez) kaydeder. */
export async function buildOzKaydet(anahtar: string, uid: string) {
  const oz = sahipOzetiHesapla(anahtar);
  if (OZ_YAZILDI.has(`${oz}:${uid}`)) return;
  const v = await jsonOku<{ uid: string }>(ozDosyasi(oz));
  if (v?.uid !== uid) await jsonYaz(ozDosyasi(oz), { uid });
  OZ_YAZILDI.add(`${oz}:${uid}`);
}

async function hesapPlani(sahip: BuildSahip) {
  let uid: string | null;
  if (typeof sahip === "string") {
    uid = buildAnahtarHesabi(sahip);
    if (uid) await buildOzKaydet(sahip, uid).catch(() => {});
  } else uid = (await jsonOku<{ uid: string }>(ozDosyasi(sahip.oz)))?.uid ?? null;
  if (!uid) return null;
  const h = await hesapOku(uid);
  if (!h) return null;
  // Etkin çalışma alanı (hesabın son seçimi): Build harcaması alan havuzundan, üyenin aylık sınırıyla düşer.
  const e = await etkinAlanSunucu(uid).catch(() => null);
  return { uid, plan: h.plan, ad: h.profil.ad || h.email.split("@")[0], alan: e ? { id: e.alan.id, ad: e.alan.ad, izleyici: e.uye.rol === "izleyici" } : null };
}

/** Hesabın Build için kullanılabilir bakiyesi (hesap yoksa null). */
export async function buildBakiye(sahip: BuildSahip): Promise<number | null> {
  const h = await hesapPlani(sahip).catch(() => null);
  if (!h) return null;
  if (h.alan) { const a = await import("@/lib/alan/depo").then((m) => m.alanOku(h.alan!.id)); if (a) return (await alanKrediBilgisi(a, h.uid)).kullanilabilir; }
  return (await krediOzeti(h.uid, h.plan)).bakiye;
}

/**
 * İş başlamadan önce: yeterliyse null, değilse kullanıcıya gösterilecek ileti.
 * enAz: işin en az tutarı (bilinmiyorsa 1).
 */
export async function buildKrediYeterli(sahip: BuildSahip, enAz = 1): Promise<string | null> {
  const h = await hesapPlani(sahip).catch(() => null);
  if (h?.alan?.izleyici) return `"${h.alan.ad}" çalışma alanında izleyicisin; kredi harcayamazsın. Alan yöneticisinden üye rolü iste ya da kişisel alana geç.`;
  const b = await buildBakiye(sahip).catch(() => null);
  if (b === null) return null;
  if (b >= Math.max(1, Math.ceil(enAz))) return null;
  return b <= 0
    ? "Kredin bitti. Devam etmek için kredi yükle ya da planını yükselt."
    : `Kredin bu iş için yetmiyor: en az ${Math.ceil(enAz)} kredi gerekiyor, bakiyende ${b} var.`;
}

/**
 * İş bitince kullanılan krediyi düşer. tutar ondalıklı olabilir (yukarı yuvarlanır).
 * kaynak: "build:proje", "build:sohbet", "build:ajan", "build:sistem", "build:buyume" …; is: işin benzersiz kimliği.
 */
export async function buildKrediKes(sahip: BuildSahip, tutar: number, g: { kaynak: string; is: string; aciklama: string }): Promise<BuildKrediSonucu> {
  const ham = Number(tutar) || 0;
  if (!(ham > 0)) return null;
  try {
    const h = await hesapPlani(sahip);
    if (!h) return null;
    const anahtar = anahtarYap(g.kaynak, g.is);
    // Küsurat: küçük işlerin (öneri, başlık) kesirli bedeli biriktirilir, tam krediye ulaşınca düşülür.
    const miktar = await kilitle(`build-kredi-artik:${h.uid}`, async () => {
      const dosya = path.join(HESAP_KOK, "build-kredi-artik", `${ozet(h.uid)}.json`);
      const a = (await jsonOku<{ artik: number; son: string[] }>(dosya)) ?? { artik: 0, son: [] };
      if (a.son.includes(anahtar)) return 0;
      const toplam = a.artik + ham;
      const tam = Math.floor(toplam + 1e-9);
      await jsonYaz(dosya, { artik: Math.max(0, toplam - tam), son: [...a.son, anahtar].slice(-200) });
      return tam;
    });
    const aciklama = g.aciklama.slice(0, 160);
    if (h.alan) {
      const { alanOku } = await import("@/lib/alan/depo");
      const a = await alanOku(h.alan.id);
      if (a) {
        if (!(miktar > 0)) return { kesilen: 0, bakiye: (await alanKrediBilgisi(a, h.uid)).kullanilabilir, eksik: 0 };
        const r = await alanKrediKes({ alanId: a.id, uid: h.uid, ad: h.ad, tutar: miktar, kaynak: g.kaynak, aciklama, anahtar, kismi: true });
        if (r.ok) return { kesilen: r.kesilen, bakiye: r.kullanilabilir, eksik: Math.max(0, miktar - r.kesilen) };
        return { kesilen: 0, bakiye: r.kullanilabilir, eksik: miktar };
      }
    }
    if (!(miktar > 0)) return { kesilen: 0, bakiye: (await krediOzeti(h.uid, h.plan)).bakiye, eksik: 0 };
    const r = await krediHarca(h.uid, miktar, { kaynak: g.kaynak, aciklama, anahtar, plan: h.plan });
    if (r.ok) return { kesilen: r.tekrar ? 0 : miktar, bakiye: r.ozet.bakiye, eksik: 0 };
    if (r.neden === "yetersiz" && r.ozet && r.ozet.bakiye > 0) {
      const kalan = r.ozet.bakiye;
      const r2 = await krediHarca(h.uid, kalan, { kaynak: g.kaynak, aciklama: `${aciklama} (bakiye yetmedi, kalanı düşüldü)`, anahtar: `${anahtar}k`, plan: h.plan });
      if (r2.ok) return { kesilen: r2.tekrar ? 0 : kalan, bakiye: r2.ozet.bakiye, eksik: miktar - kalan };
    }
    return { kesilen: 0, bakiye: r.ozet?.bakiye ?? 0, eksik: r.neden === "yetersiz" ? miktar : 0 };
  } catch (e) {
    console.error("[build-kredi] kesinti yapılamadı:", (e as Error).message);
    return null;
  }
}

/**
 * Yanıtında { kredi } dönen Build rotaları için: kredi sıfırdan büyükse sunucuda düşülür ve yanıta bakiye eklenir.
 * Rota mantığına dokunmadan kesinti eklemek içindir (her istek ayrı iş sayılır).
 */
export async function yanittanKes(res: Response | undefined, sahip: string | null | undefined, g: { kaynak: string; aciklama: string }): Promise<Response> {
  if (!res) return Response.json({ ok: false, hata: "İşlem tamamlanamadı." }, { status: 500 });
  if (!sahip || !res.ok || !(res.headers.get("content-type") ?? "").includes("application/json")) return res;
  let j: Record<string, unknown>;
  try { j = await res.clone().json(); } catch { return res; }
  const k = Number(j?.kredi);
  if (!(k > 0)) return res;
  const r = await buildKrediKes(sahip, k, { ...g, is: `${Date.now()}:${Math.random().toString(36).slice(2)}` });
  if (!r) return res;
  const h = new Headers(res.headers);
  h.delete("content-length");
  return new Response(JSON.stringify({ ...j, bakiye: r.bakiye }), { status: res.status, headers: h });
}
