import "server-only";
import { modelBagli } from "./disAjan";
import { krediHesapla, modelBul } from "./modeller";
import type { SohbetParca } from "./sohbetDepo";
import { motoruCalistir } from "./sohbetMotoru";
import { sistemGetirOz, sistemGuncelleOz, yeniKimlik, type Calisma, type Sistem } from "./sistemDepo";
import { calismaSonucu, sistemBaslat } from "./sistemMotoru";

/**
 * Sistem testleri (n8n Evaluations): kayıtlı test vakaları taslakla tek tek çalışır, son çıktı beklenenle ölçütüne göre
 * karşılaştırılır. Ölçütler: başarılı bitti mi, eşit, içeriyor, benzerlik (0 ile 100) ve yapay zekâ yargıcı. Her koşu
 * geçme oranı ve ortalama puanla geçmişe yazılır (son 20), önceki koşuyla karşılaştırılır.
 */
export type TestOlcut = "basarili" | "esit" | "iceriyor" | "benzerlik" | "yz";
export type TestVakasi = { id: string; ad: string; girdi: unknown; beklenen?: string; olcut: TestOlcut; esik?: number };
export type TestSonucu = { testId: string; ad: string; gecti: boolean; puan: number; cikti: string; neden?: string; calisma?: string; sure: number; kredi: number };
export type TestKosusu = { id: string; zaman: number; sonuclar: TestSonucu[]; gecen: number; toplam: number; ortalama: number; kredi: number; bitti: boolean };

const norm = (s: string) => s.toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();
/** Kelime kümesi benzerliği ve karakter ikilisi örtüşmesinin ortalaması (0 ile 100). */
export function benzerlik(a: string, b: string): number {
  const x = norm(a), y = norm(b);
  if (!x && !y) return 100;
  if (!x || !y) return 0;
  const k1 = new Set(x.split(" ")), k2 = new Set(y.split(" "));
  const kes = [...k1].filter((w) => k2.has(w)).length;
  const j = kes / (k1.size + k2.size - kes);
  const ikili = (s: string) => { const m = new Map<string, number>(); for (let i = 0; i < s.length - 1; i++) { const p = s.slice(i, i + 2); m.set(p, (m.get(p) ?? 0) + 1); } return m; };
  const m1 = ikili(x), m2 = ikili(y);
  let ort = 0; for (const [p, n] of m1) ort += Math.min(n, m2.get(p) ?? 0);
  const d = (2 * ort) / Math.max(1, x.length - 1 + y.length - 1);
  return Math.round(((j + d) / 2) * 100);
}

async function yargic(modelId: string, girdi: unknown, beklenen: string, cikti: string): Promise<{ gecti: boolean; puan: number; neden: string; kredi: number }> {
  const model = modelBul(modelId);
  if (!modelBagli(model)) throw new Error(`${model.ad} bu sunucuya bağlı değil; yapay zekâ yargıcı çalışamaz.`);
  const parcalar: SohbetParca[] = [];
  const ab = new AbortController();
  const z = setTimeout(() => ab.abort(), 60_000);
  try {
    const r = await motoruCalistir({
      model, sistem: "Sen bir sistem testini değerlendiren yargıçsın. Girdi, beklenen davranış ve gerçek çıktı verilir. Çıktı beklenen davranışı karşılıyorsa geçer. Yalnız tek JSON nesnesi döndür: gecti (true ya da false), puan (0 ile 100), neden (bir cümle Türkçe).",
      gecmis: [{ role: "user", content: [{ type: "text", text: `Girdi: ${JSON.stringify(girdi).slice(0, 4000)}\nBeklenen: ${beklenen.slice(0, 4000)}\nGerçek çıktı: ${cikti.slice(0, 8000)}` }] }],
      efor: "low", izin: () => "kapali", ozel: [], sunucu: [], parcalar, yaz: () => {}, signal: ab.signal, yurut: async () => ({ icerik: "", hata: true }), kaydet: async () => {},
    });
    if (r.durum === "hata") throw new Error(r.hata ?? "Yargıç yanıt vermedi.");
    const metin = parcalar.filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("\n");
    const m = /\{[\s\S]*\}/.exec(metin);
    const j = m ? JSON.parse(m[0]) as { gecti?: unknown; puan?: unknown; neden?: unknown } : {};
    const puan = Math.max(0, Math.min(100, Number(j.puan) || 0));
    return { gecti: j.gecti === true || (j.gecti === undefined && puan >= 70), puan, neden: String(j.neden ?? "").slice(0, 300), kredi: krediHesapla(model, r.kullanim) };
  } finally { clearTimeout(z); }
}

function olc(t: TestVakasi, c: Calisma, cikti: string): { gecti: boolean; puan: number; neden?: string } {
  if (c.durum !== "basarili" && c.durum !== "durdu") return { gecti: false, puan: 0, neden: c.hata ?? "Çalışma başarısız oldu." };
  const b = t.beklenen ?? "";
  switch (t.olcut) {
    case "basarili": return { gecti: true, puan: 100 };
    case "esit": { const e = norm(cikti) === norm(b); return { gecti: e, puan: e ? 100 : 0, neden: e ? undefined : "Çıktı beklenenle aynı değil." }; }
    case "iceriyor": { const e = norm(cikti).includes(norm(b)); return { gecti: e, puan: e ? 100 : 0, neden: e ? undefined : `Çıktıda "${b.slice(0, 60)}" geçmiyor.` }; }
    case "benzerlik": { const p = benzerlik(cikti, b); const esik = t.esik ?? 70; return { gecti: p >= esik, puan: p, neden: p >= esik ? undefined : `Benzerlik ${p}, eşik ${esik}.` }; }
    default: return { gecti: false, puan: 0 };
  }
}

/** Test vakalarını sırayla çalıştırır; ilerleme koşu kaydına yazılır. Koşunun kimliği hemen döner. */
export async function testleriCalistir(sistemId: string, sahipOz: string, secili?: string[]): Promise<{ kosu: TestKosusu } | { hata: string }> {
  const s = await sistemGetirOz(sistemId, sahipOz);
  if (!s) return { hata: "Sistem bulunamadı." };
  const l = (s.testler ?? []).filter((t) => !secili?.length || secili.includes(t.id));
  if (!l.length) return { hata: "Önce test vakası ekle." };
  if (!s.adimlar.length) return { hata: "Sistemde adım yok." };
  const kosu: TestKosusu = { id: yeniKimlik(8), zaman: Date.now(), sonuclar: [], gecen: 0, toplam: l.length, ortalama: 0, kredi: 0, bitti: false };
  const yaz = (x: Sistem) => { x.degerlendirmeler = [{ ...kosu }, ...(x.degerlendirmeler ?? []).filter((k) => k.id !== kosu.id)].slice(0, 20); };
  await sistemGuncelleOz(sistemId, sahipOz, yaz);
  (async () => {
    for (const t of l) {
      const bas = Date.now();
      let sonuc: TestSonucu;
      try {
        const r = await sistemBaslat(sistemId, sahipOz, { tur: "deneme", veri: t.girdi ?? {} }, { zorla: true });
        if (!r) throw new Error("Sistem başlatılamadı.");
        const c = await Promise.race([r.bitti, new Promise<null>((ok) => setTimeout(() => ok(null), 3 * 60_000))]);
        if (!c) throw new Error("Test 3 dakikada bitmedi.");
        if (c.durum === "bekliyor" || c.durum === "kuyrukta") throw new Error("Çalışma beklemeye geçti; testlerde bekleme ve onay adımları beklenmez.");
        const cikti = calismaSonucu(c, s.ad).cikti ?? "";
        let o = olc(t, c, cikti), kredi = c.kredi;
        if (t.olcut === "yz" && (c.durum === "basarili" || c.durum === "durdu")) { const y = await yargic(s.ayar.model, t.girdi, t.beklenen ?? "", cikti); o = y; kredi += y.kredi; }
        sonuc = { testId: t.id, ad: t.ad, gecti: o.gecti, puan: o.puan, cikti: cikti.slice(0, 4000), neden: o.neden, calisma: c.id, sure: Date.now() - bas, kredi };
      } catch (e) {
        sonuc = { testId: t.id, ad: t.ad, gecti: false, puan: 0, cikti: "", neden: (e as Error).message.slice(0, 300), sure: Date.now() - bas, kredi: 0 };
      }
      kosu.sonuclar.push(sonuc);
      kosu.gecen = kosu.sonuclar.filter((x) => x.gecti).length;
      kosu.ortalama = Math.round(kosu.sonuclar.reduce((a, x) => a + x.puan, 0) / kosu.sonuclar.length);
      kosu.kredi += sonuc.kredi;
      await sistemGuncelleOz(sistemId, sahipOz, yaz).catch(() => {});
    }
    kosu.bitti = true;
    await sistemGuncelleOz(sistemId, sahipOz, yaz).catch(() => {});
  })().catch(() => {});
  return { kosu };
}
