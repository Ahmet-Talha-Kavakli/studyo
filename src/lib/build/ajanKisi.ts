import "server-only";
import { createHash, randomBytes } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { telefonNormal } from "./ajanProsedurTip";
import type { Kaynak } from "./ziyaretciDepo";

/**
 * Kanallar arası tek kişi kimliği ve ortak hafıza (Intercom kişileri, Fin Memory karşılığı). Sahip başına kişi
 * kayıtları: aynı müşteri e-postada, WhatsApp'ta, SMS'te, web kutusunda ve diğer kanallarda tek kişi olarak tanınır.
 *  - Güçlü kimlik: kanalın kendisinin doğruladığı değer (WhatsApp ve SMS numarası, e-posta kanalındaki gönderen,
 *    Telegram, Messenger, Slack, Discord, Teams, LINE kullanıcı kimliği, sitenin imzaladığı e-posta, doğrulama
 *    kodu ile onaylanan değer). Aynı güçlü kimlik iki kişide görünürse kişiler kendiliğinden birleşir.
 *  - Zayıf kimlik: ziyaretçinin yazdığı e-posta ya da telefon (form, prosedür). Başka bir kişiye aitse
 *    kendiliğinden birleşmez; "olası eşleşme" önerisi olur, sahip birleştirir (başkasının hafızası sızmasın).
 * Hafıza: kişi notları (ajanın bellege_yaz ile yazdıkları ve temsilci notları) bütün kanallarda ve sahibin bütün
 * ajanlarında kullanılır; geçmiş konuşmaların kısa dökümü ajana bağlam olarak verilir.
 * Dosyalar: .veri/build/ajan-kisi/<sahip özeti>/<kişi>.json ve dizin.json (kimlik → kişi, birleşen eski kimlikler)
 */
export type KimlikTur = "eposta" | "telefon" | "telegram" | "messenger" | "instagram" | "slack" | "discord" | "teams" | "line" | "ziyaretci" | "api" | "site";
export const KIMLIK_AD: Record<KimlikTur, string> = { eposta: "E-posta", telefon: "Telefon", telegram: "Telegram", messenger: "Messenger", instagram: "Instagram", slack: "Slack", discord: "Discord", teams: "Microsoft Teams", line: "LINE", ziyaretci: "Web tarayıcısı", api: "API oturumu", site: "Site sohbeti" };
export type KisiKimlik = { tur: KimlikTur; deger: string; guclu: boolean; ilk: number; son: number; kanal?: Kaynak };
export type KisiKonusma = { ajanId: string; dosyaId: string; kanal: Kaynak; zaman: number; ilk?: string };
export type KisiNot = { id: string; metin: string; zaman: number; kaynak: "ajan" | "temsilci"; ajanId?: string; yazan?: string };
export type Kisi = {
  id: string; ad?: string; olusturma: number; son: number;
  kimlikler: KisiKimlik[]; konusmalar: KisiKonusma[]; notlar: KisiNot[]; etiketler: string[];
  /** Prosedürlerin topladığı ve temsilcinin girdiği bilgiler (sipariş numarası, şehir ...). */
  ozellikler: Record<string, string>;
  /** Olası eşleşmeler: zayıf kimliği başka bir kişide görünen. */
  oneriler: { kisi: string; neden: string; zaman: number }[];
  birlesen?: string[];
};
type Dizin = { kimlik: Record<string, string>; takma: Record<string, string>; liste: string[] };
export type KimlikGirdi = { tur: KimlikTur; deger: string };

const KOK = path.join(DEPO_KOK, "build", "ajan-kisi");
const oz = (s: string) => s.replace(/[^a-f0-9]/g, "").slice(0, 64);
const dizinYolu = (sahipOz: string) => path.join(KOK, oz(sahipOz), "dizin.json");
const kisiYolu = (sahipOz: string, id: string) => path.join(KOK, oz(sahipOz), `${id.replace(/[^A-Za-z0-9_-]/g, "")}.json`);
const KID = /^k[A-Za-z0-9_-]{10}$/;
async function oku<T>(f: string): Promise<T | null> { try { return JSON.parse(await readFile(f, "utf8")) as T; } catch { return null; } }
async function yaz(f: string, v: unknown) { await mkdir(path.dirname(f), { recursive: true }); await writeFile(f, JSON.stringify(v)); }

const kilitler = new Map<string, Promise<unknown>>();
function kilitle<T>(sahipOz: string, f: () => Promise<T>): Promise<T> {
  const once = kilitler.get(sahipOz) ?? Promise.resolve();
  const p = once.catch(() => {}).then(f);
  kilitler.set(sahipOz, p);
  p.finally(() => { if (kilitler.get(sahipOz) === p) kilitler.delete(sahipOz); }).catch(() => {});
  return p;
}
const dizinOku = async (sahipOz: string): Promise<Dizin> => ({ kimlik: {}, takma: {}, liste: [], ...((await oku<Dizin>(dizinYolu(sahipOz))) ?? {}) });

export function kimlikNormal(g: KimlikGirdi): KimlikGirdi | null {
  const d = String(g.deger ?? "").trim();
  if (!d) return null;
  if (g.tur === "eposta") { const e = d.toLowerCase(); return /^[^\s@]+@[^\s@]+\.[a-z]{2,24}$/.test(e) ? { tur: "eposta", deger: e } : null; }
  if (g.tur === "telefon") { const t = telefonNormal(d.startsWith("+") || d.startsWith("0") ? d : `+${d}`); return t ? { tur: "telefon", deger: t } : null; }
  return { tur: g.tur, deger: d.slice(0, 160) };
}
const anahtar = (g: KimlikGirdi) => `${g.tur}:${g.tur === "ziyaretci" || g.tur === "api" ? createHash("sha256").update(g.deger).digest("hex").slice(0, 24) : g.deger}`;

async function kisiOkuHam(sahipOz: string, id: string): Promise<Kisi | null> {
  if (!KID.test(id)) return null;
  const k = await oku<Kisi>(kisiYolu(sahipOz, id));
  if (!k) return null;
  k.oneriler ??= []; k.ozellikler ??= {}; k.etiketler ??= []; k.notlar ??= []; k.konusmalar ??= []; k.kimlikler ??= [];
  return k;
}
/** Birleşmiş eski kimlikleri izleyerek kişiyi getirir. */
export async function kisiGetir(sahipOz: string, id: string): Promise<Kisi | null> {
  const d = await dizinOku(sahipOz);
  let x = id;
  for (let i = 0; i < 5 && d.takma[x]; i++) x = d.takma[x];
  return kisiOkuHam(sahipOz, x);
}

function birlestirIc(hedef: Kisi, kaynak: Kisi) {
  for (const k of kaynak.kimlikler) { const v = hedef.kimlikler.find((x) => x.tur === k.tur && x.deger === k.deger); if (v) { v.guclu ||= k.guclu; v.son = Math.max(v.son, k.son); } else hedef.kimlikler.push(k); }
  for (const c of kaynak.konusmalar) if (!hedef.konusmalar.some((x) => x.ajanId === c.ajanId && x.dosyaId === c.dosyaId)) hedef.konusmalar.push(c);
  hedef.konusmalar.sort((a, b) => b.zaman - a.zaman); hedef.konusmalar = hedef.konusmalar.slice(0, 300);
  hedef.notlar = [...hedef.notlar, ...kaynak.notlar].sort((a, b) => a.zaman - b.zaman).slice(-300);
  hedef.etiketler = [...new Set([...hedef.etiketler, ...kaynak.etiketler])].slice(0, 30);
  hedef.ozellikler = { ...kaynak.ozellikler, ...hedef.ozellikler };
  hedef.ad ||= kaynak.ad;
  hedef.olusturma = Math.min(hedef.olusturma, kaynak.olusturma); hedef.son = Math.max(hedef.son, kaynak.son);
  hedef.birlesen = [...new Set([...(hedef.birlesen ?? []), kaynak.id, ...(kaynak.birlesen ?? [])])].slice(-50);
  hedef.oneriler = hedef.oneriler.filter((o) => o.kisi !== kaynak.id && o.kisi !== hedef.id);
}

/**
 * Konuşmayı kişiye bağlar. Güçlü kimliklerle bulunan kişiler birleşir; hiçbiri yoksa yeni kişi açılır. Zayıf
 * kimlik başka kişiye aitse öneri olarak kalır. Dönüş: kişi kimliği.
 */
export function kisiBagla(sahipOz: string, g: { guclu: KimlikGirdi[]; zayif?: KimlikGirdi[]; ad?: string; kanal: Kaynak; konusma?: Omit<KisiKonusma, "zaman" | "kanal">; mevcut?: string }): Promise<string | null> {
  return kilitle(sahipOz, async () => {
    const guclu = g.guclu.map(kimlikNormal).filter((x): x is KimlikGirdi => !!x);
    const zayif = (g.zayif ?? []).map(kimlikNormal).filter((x): x is KimlikGirdi => !!x).filter((z) => !guclu.some((x) => anahtar(x) === anahtar(z)));
    if (!guclu.length && !zayif.length && !g.mevcut) return null;
    const d = await dizinOku(sahipOz);
    const coz = (id?: string) => { let x = id; for (let i = 0; x && i < 5 && d.takma[x]; i++) x = d.takma[x]; return x; };
    const bulunan = [...new Set([coz(g.mevcut), ...guclu.map((x) => coz(d.kimlik[anahtar(x)]))].filter((x): x is string => !!x && KID.test(x)))];
    const adaylar = (await Promise.all(bulunan.map((id) => kisiOkuHam(sahipOz, id)))).filter((x): x is Kisi => !!x);
    // Yalnız güçlü kimliği gerçekten güçlü olarak taşıyan kişilerle birleşilir; değeri yalnız yazarak sahiplenen
    // (zayıf) kişi birleşmez, öneri olarak kalır (başkasının e-postasını yazan biri onun geçmişine erişemesin).
    const kisiler = adaylar.filter((c) => c.id === coz(g.mevcut) || guclu.some((x) => c.kimlikler.some((k2) => k2.guclu && k2.tur === x.tur && k2.deger === x.deger)));
    const zayifSahipler = adaylar.filter((c) => !kisiler.includes(c));
    const simdi = Date.now();
    let k: Kisi;
    if (!kisiler.length) {
      k = { id: `k${randomBytes(8).toString("base64url").slice(0, 10)}`, olusturma: simdi, son: simdi, kimlikler: [], konusmalar: [], notlar: [], etiketler: [], ozellikler: {}, oneriler: [] };
      d.liste.unshift(k.id);
    } else {
      kisiler.sort((a, b) => a.olusturma - b.olusturma);
      k = kisiler[0];
      for (const x of kisiler.slice(1)) {
        birlestirIc(k, x);
        d.takma[x.id] = k.id;
        for (const [a2, v] of Object.entries(d.kimlik)) if (v === x.id) d.kimlik[a2] = k.id;
        d.liste = d.liste.filter((y) => y !== x.id);
        await rm(kisiYolu(sahipOz, x.id), { force: true });
      }
    }
    const ekle = (x: KimlikGirdi, gucluMu: boolean) => {
      const v = k.kimlikler.find((y) => y.tur === x.tur && y.deger === x.deger);
      if (v) { v.son = simdi; v.guclu ||= gucluMu; } else k.kimlikler.push({ ...x, guclu: gucluMu, ilk: simdi, son: simdi, kanal: g.kanal });
      if (gucluMu || !d.kimlik[anahtar(x)]) d.kimlik[anahtar(x)] = k.id;
    };
    for (const x of guclu) ekle(x, true);
    for (const c of zayifSahipler) if (!k.oneriler.some((o) => o.kisi === c.id)) k.oneriler.push({ kisi: c.id, neden: "Bu kişinin doğrulanmış kimliğini başka bir kişi yazarak vermiş", zaman: simdi });
    for (const z of zayif) {
      const sahibi = coz(d.kimlik[anahtar(z)]);
      if (sahibi && sahibi !== k.id) { if (!k.oneriler.some((o) => o.kisi === sahibi)) k.oneriler.push({ kisi: sahibi, neden: `${KIMLIK_AD[z.tur]} ${z.deger} başka bir kişide kayıtlı`, zaman: simdi }); }
      else ekle(z, false);
    }
    k.kimlikler = k.kimlikler.slice(-40); k.oneriler = k.oneriler.slice(-10);
    if (g.ad && !k.ad) k.ad = g.ad.slice(0, 80);
    if (g.konusma) {
      const c = k.konusmalar.find((x) => x.ajanId === g.konusma!.ajanId && x.dosyaId === g.konusma!.dosyaId);
      if (c) { c.zaman = simdi; c.ilk ||= g.konusma.ilk; } else k.konusmalar.unshift({ ...g.konusma, kanal: g.kanal, zaman: simdi });
      k.konusmalar.sort((a, b) => b.zaman - a.zaman); k.konusmalar = k.konusmalar.slice(0, 300);
    }
    k.son = simdi;
    d.liste = [k.id, ...d.liste.filter((x) => x !== k.id)].slice(0, 20_000);
    await yaz(kisiYolu(sahipOz, k.id), k);
    await yaz(dizinYolu(sahipOz), d);
    return k.id;
  });
}

/** Kişi kaydında güncelleme (kilit altında). f hata metni döndürürse yazılmaz. */
export function kisiGuncelle(sahipOz: string, id: string, f: (k: Kisi, d: Dizin) => void | string): Promise<Kisi | string | null> {
  return kilitle(sahipOz, async () => {
    const d = await dizinOku(sahipOz);
    let x = id; for (let i = 0; i < 5 && d.takma[x]; i++) x = d.takma[x];
    const k = await kisiOkuHam(sahipOz, x);
    if (!k) return null;
    const h = f(k, d);
    if (typeof h === "string") return h;
    await yaz(kisiYolu(sahipOz, k.id), k);
    await yaz(dizinYolu(sahipOz), d);
    return k;
  });
}
export const kisiNotEkle = (sahipOz: string, id: string, n: Omit<KisiNot, "id" | "zaman">) =>
  kisiGuncelle(sahipOz, id, (k) => { if (k.notlar.some((x) => x.metin === n.metin)) return; k.notlar = [...k.notlar, { ...n, metin: n.metin.slice(0, 400), id: randomBytes(4).toString("hex"), zaman: Date.now() }].slice(-300); });
export const kisiOzellikYaz = (sahipOz: string, id: string, o: Record<string, string>) =>
  kisiGuncelle(sahipOz, id, (k) => { for (const [a, v] of Object.entries(o).slice(0, 30)) if (/^[a-zA-Z_][\w]{0,39}$/.test(a) && v && v !== "-") k.ozellikler[a] = String(v).slice(0, 300); });

/** İki kişiyi birleştirir (kaynak hedefe katılır). */
export function kisileriBirlestir(sahipOz: string, hedefId: string, kaynakId: string): Promise<Kisi | string | null> {
  return kilitle(sahipOz, async () => {
    if (hedefId === kaynakId) return "Aynı kişi.";
    const d = await dizinOku(sahipOz);
    const h = await kisiOkuHam(sahipOz, hedefId), s = await kisiOkuHam(sahipOz, kaynakId);
    if (!h || !s) return null;
    birlestirIc(h, s);
    d.takma[s.id] = h.id;
    for (const [a, v] of Object.entries(d.kimlik)) if (v === s.id) d.kimlik[a] = h.id;
    d.liste = d.liste.filter((x) => x !== s.id);
    await rm(kisiYolu(sahipOz, s.id), { force: true });
    await yaz(kisiYolu(sahipOz, h.id), h);
    await yaz(dizinYolu(sahipOz), d);
    return h;
  });
}
/** Bir kimliği kişiden ayırır (yanlış eşleşme). */
export const kimlikAyir = (sahipOz: string, id: string, tur: KimlikTur, deger: string) =>
  kisiGuncelle(sahipOz, id, (k, d) => { k.kimlikler = k.kimlikler.filter((x) => !(x.tur === tur && x.deger === deger)); const a = anahtar({ tur, deger }); if (d.kimlik[a] === k.id) delete d.kimlik[a]; });
export function kisiSil(sahipOz: string, id: string): Promise<Kisi | null> {
  return kilitle(sahipOz, async () => {
    const d = await dizinOku(sahipOz);
    const k = await kisiOkuHam(sahipOz, id);
    if (!k) return null;
    for (const [a, v] of Object.entries(d.kimlik)) if (v === k.id) delete d.kimlik[a];
    for (const [a, v] of Object.entries(d.takma)) if (v === k.id) delete d.takma[a];
    d.liste = d.liste.filter((x) => x !== k.id);
    await rm(kisiYolu(sahipOz, k.id), { force: true });
    await yaz(dizinYolu(sahipOz), d);
    return k;
  });
}

export type KisiOzet = { id: string; ad?: string; eposta?: string; telefon?: string; kanallar: Kaynak[]; konusma: number; son: number; olusturma: number; not: number; oneri: number; etiketler: string[] };
export const kisiOzeti = (k: Kisi): KisiOzet => ({
  id: k.id, ad: k.ad, eposta: k.kimlikler.find((x) => x.tur === "eposta" && x.guclu)?.deger ?? k.kimlikler.find((x) => x.tur === "eposta")?.deger,
  telefon: k.kimlikler.find((x) => x.tur === "telefon" && x.guclu)?.deger ?? k.kimlikler.find((x) => x.tur === "telefon")?.deger,
  kanallar: [...new Set(k.konusmalar.map((c) => c.kanal))], konusma: k.konusmalar.length, son: k.son, olusturma: k.olusturma, not: k.notlar.length, oneri: k.oneriler.length, etiketler: k.etiketler,
});
export async function kisileriListele(sahipOz: string, g: { ara?: string; kanal?: string; oneri?: boolean; sinir?: number } = {}): Promise<{ kisiler: KisiOzet[]; toplam: number }> {
  const d = await dizinOku(sahipOz);
  const q = (g.ara ?? "").toLocaleLowerCase("tr").trim();
  const o: KisiOzet[] = [];
  for (const id of d.liste.slice(0, 3000)) {
    const k = await kisiOkuHam(sahipOz, id);
    if (!k) continue;
    if (q && !`${k.ad ?? ""} ${k.kimlikler.map((x) => x.deger).join(" ")} ${Object.values(k.ozellikler).join(" ")} ${k.etiketler.join(" ")}`.toLocaleLowerCase("tr").includes(q)) continue;
    if (g.kanal && !k.konusmalar.some((c) => c.kanal === g.kanal)) continue;
    if (g.oneri && !k.oneriler.length) continue;
    o.push(kisiOzeti(k));
    if (o.length >= (g.sinir ?? 200)) break;
  }
  return { kisiler: o, toplam: d.liste.length };
}

/** Ajana verilen kişi bağlamı: ad, kanallar, notlar ve diğer kanallardaki son konuşmalar. */
export async function kisiBaglami(sahipOz: string, id: string, haric: { ajanId: string; dosyaId: string }, ozet: (c: KisiKonusma) => Promise<string | null>): Promise<string> {
  const k = await kisiGetir(sahipOz, id);
  if (!k) return "";
  const digerleri = k.konusmalar.filter((c) => !(c.ajanId === haric.ajanId && c.dosyaId === haric.dosyaId)).slice(0, 5);
  if (!digerleri.length && !k.notlar.length && !Object.keys(k.ozellikler).length) return "";
  const satirlar: string[] = [];
  for (const c of digerleri) { const s = await ozet(c).catch(() => null); if (s) satirlar.push(`- ${new Date(c.zaman).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}, ${c.kanal}: ${s}`); }
  const kanallar = [...new Set(k.kimlikler.filter((x) => x.guclu).map((x) => KIMLIK_AD[x.tur]))].join(", ");
  return `<kisi>\nBu ziyaretçi daha önce de yazdı ve kanallar arasında aynı kişi olarak tanındı${k.ad ? ` (ad: ${k.ad})` : ""}. Doğrulanmış kanalları: ${kanallar || "yok"}. Bunları ziyaretçiye kendiliğinden sayma; işine yararsa kullan, gizli bilgileri tekrarlama.${Object.keys(k.ozellikler).length ? `\nBilinen bilgiler: ${Object.entries(k.ozellikler).slice(0, 15).map(([a, v]) => `${a}: ${v}`).join("; ")}` : ""}${k.notlar.length ? `\nHatırlananlar:\n${k.notlar.slice(-15).map((n) => `- ${n.metin}`).join("\n")}` : ""}${satirlar.length ? `\nÖnceki konuşmaları:\n${satirlar.join("\n")}` : ""}\n</kisi>`;
}
