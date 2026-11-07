import "server-only";
import { createHash, randomBytes } from "crypto";
import { appendFile, mkdir, readdir, readFile, rm } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { kullanimArttir } from "./bulutKullanim";

/**
 * Proje günlükleri (Vayra Bulut): yayındaki siteye gelen istekler ve platform olayları (yayın, kayıt, üyelik, form,
 * dosya, fonksiyon, yapay zekâ, tarayıcı hatası). Gün başına NDJSON dosyası; 14 gün tutulur. IP düz saklanmaz:
 * güvenlik duvarı için yalnız tuzlu özeti (ip) yazılır. Dosya: .veri/build/gunluk/<projeId>/<YYYY-MM-DD>.ndjson
 */
export type GunlukTur = "istek" | "yayin" | "veri" | "uye" | "form" | "dosya" | "fonksiyon" | "sistem" | "hata" | "ai" | "bulut";
/** Fonksiyon çağrısının dış isteği: adres (sorgu dizgesi atılır), yöntem, durum (0: ağ hatası), süre. */
export type DisIstek = { a: string; y: string; d: number; ms: number; h?: string };
export type Gunluk = {
  z: number; t: GunlukTur; d?: number; y?: string; ms?: number; m?: string; c?: "mobil" | "masaustu" | "bot"; k?: string;
  /** Kayıt kimliği (derin bağlantı). Eski kayıtlarda okurken üretilir. */ i?: string;
  /** HTTP yöntemi. */ yt?: string;
  /** Sorgu dizgesi (en çok 200 karakter). */ q?: string;
  /** Ülke kodu (yalnız barındırma katmanı bildirdiyse). */ u?: string;
  /** Tuzlu IP özeti. */ ip?: string;
  /** Tarayıcı ve işletim sistemi. */ ua?: string;
  /** Yanıt boyutu, bayt. */ b?: number;
  /** Güvenlik duvarı kararı (engellendiyse neden). */ e?: string;
  /** Fonksiyon ayrıntısı: console satırları, dış istekler, hata. */ f?: { log?: string[]; dis?: DisIstek[]; hata?: string; onizleme?: boolean };
};
export type Seviye = "basarili" | "uyari" | "hata";

const KOK = path.join(DEPO_KOK, "build", "gunluk");
const KIMLIK = /^[A-Za-z0-9_-]{6,20}$/;
const gun = (t: number) => new Date(t + 3 * 3600_000).toISOString().slice(0, 10);
let sonTemizlik = 0;
const SAKLAMA = 14 * 864e5;
const dinleyiciler = new Set<(id: string, g: Gunluk) => void>();

export function cihaz(ua: string | null): Gunluk["c"] {
  const u = (ua ?? "").toLowerCase();
  if (/bot|crawl|spider|slurp|preview|headless/.test(u)) return "bot";
  return /mobile|android|iphone|ipad/.test(u) ? "mobil" : "masaustu";
}

/** Kaydın seviyesi: 5xx, tarayıcı hatası ve fonksiyon hatası "hata"; 4xx "uyari". */
export function seviyeBul(g: Gunluk): Seviye {
  if (g.t === "hata" || (g.d ?? 0) >= 500 || g.f?.hata) return "hata";
  if ((g.d ?? 0) >= 400) return "uyari";
  return "basarili";
}

/** Günlük yazılınca haber alınır (bildirim denetimi gibi). */
export function gunlukDinle(f: (id: string, g: Gunluk) => void) { dinleyiciler.add(f); return () => dinleyiciler.delete(f); }

/** Olay yazar (beklemeden; hata yutulur). */
export function gunlukYaz(projeId: string, g: Omit<Gunluk, "z"> & { z?: number }) {
  if (!KIMLIK.test(projeId)) return;
  const k: Gunluk = { z: g.z ?? Date.now(), ...g };
  if (!k.i) k.i = randomBytes(6).toString("base64url");
  if (k.y) k.y = k.y.slice(0, 200);
  if (k.m) k.m = k.m.slice(0, 300);
  if (k.q) k.q = k.q.slice(0, 200);
  if (k.f?.log) k.f.log = k.f.log.slice(-30).map((x) => x.slice(0, 400));
  if (k.f?.dis) k.f.dis = k.f.dis.slice(0, 12);
  const d = path.join(KOK, projeId);
  mkdir(d, { recursive: true }).then(() => appendFile(path.join(d, `${gun(k.z)}.ndjson`), JSON.stringify(k) + "\n")).catch(() => {});
  if (k.t === "istek") kullanimArttir(projeId, { istek: 1, bant: k.b ?? 0, engel: k.e ? 1 : 0 });
  else if (k.t === "fonksiyon" && !k.f?.onizleme && !/\(önizleme\)|\(deneme\)/.test(k.y ?? "")) kullanimArttir(projeId, { fonksiyon: 1, fonksiyonMs: Math.max(0, Math.round(k.ms ?? 0)) });
  else if (k.t === "ai") kullanimArttir(projeId, { ai: 1 });
  for (const f of dinleyiciler) { try { f(projeId, k); } catch { /* dinleyici hatası yutulur */ } }
  // Hata ya da başarısız yayın: bildirim denetimi arka planda (proje başına en çok 5 dakikada bir).
  if (seviyeBul(k) === "hata" || (k.t === "yayin" && (k.d ?? 0) >= 400)) {
    const g = globalThis as unknown as { __vayraBildirimZ?: Map<string, number> };
    const m = (g.__vayraBildirimZ ??= new Map());
    if (Date.now() - (m.get(projeId) ?? 0) > (k.t === "yayin" ? 5_000 : 5 * 60_000)) { m.set(projeId, Date.now()); setTimeout(() => { import("./bulutBildirim").then((x) => x.arkaPlanDenetimi(projeId)).catch(() => {}); }, 1500); }
  }
  if (Date.now() - sonTemizlik > 3600_000) { sonTemizlik = Date.now(); temizle().catch(() => {}); }
}

async function temizle() {
  const sinir = gun(Date.now() - SAKLAMA);
  for (const p of await readdir(KOK).catch(() => [] as string[])) {
    for (const f of await readdir(path.join(KOK, p)).catch(() => [] as string[])) if (f.slice(0, 10) < sinir) await rm(path.join(KOK, p, f), { force: true });
  }
}

/** Gezgin süzgeci. bas/bit: zaman aralığı (ms). turler: virgüllü tür listesi. */
export type GunlukSuzgec = {
  gun?: number; tur?: string; turler?: string[]; durum?: string; seviyeler?: Seviye[]; ara?: string; sinir?: number; sonra?: number;
  bas?: number; bit?: number; yol?: string; cihazlar?: string[]; yontem?: string; id?: string; ip?: string;
};

/** Satırları yeniden eskiye gezer; her uyan kayıt için geri çağırır. false dönerse durur. */
async function gez(projeId: string, s: GunlukSuzgec, f: (g: Gunluk) => boolean | void) {
  const bit = Math.min(Date.now(), s.bit ?? Date.now());
  let bas = Math.max(Date.now() - SAKLAMA, s.bas ?? Date.now() - Math.min(14, Math.max(1, s.gun ?? 7)) * 864e5);
  if (s.sonra) bas = Math.max(bas, s.sonra + 1);
  const gunler: string[] = [];
  for (let t = bit; gun(t) >= gun(bas); t -= 864e5) gunler.push(gun(t));
  for (const g0 of gunler) {
    const t = await readFile(path.join(KOK, projeId, `${g0}.ndjson`), "utf8").catch(() => "");
    if (!t) continue;
    const satirlar = t.trim().split("\n");
    for (let j = satirlar.length - 1; j >= 0; j--) {
      const sat = satirlar[j];
      if (!sat) continue;
      let g: Gunluk;
      try { g = JSON.parse(sat); } catch { continue; }
      if (g.z > bit || g.z < bas) continue;
      if (!g.i) g.i = `e${createHash("sha1").update(sat).digest("base64url").slice(0, 9)}`;
      if (f(g) === false) return;
    }
  }
}

const turUyar = (s: GunlukSuzgec, g: Gunluk) => (s.turler?.length ? s.turler.includes(g.t) : !s.tur || s.tur === "hepsi" || g.t === s.tur);
function uyar(s: GunlukSuzgec, g: Gunluk, ara?: string, haric?: "tur" | "seviye" | "cihaz" | "yol"): boolean {
  if (s.id && g.i !== s.id) return false;
  if (haric !== "tur" && !turUyar(s, g)) return false;
  if (s.durum === "hata" && !(g.t === "hata" || (g.d ?? 0) >= 400)) return false;
  if (s.durum === "basarili" && (g.d ?? 200) >= 400) return false;
  if (haric !== "seviye" && s.seviyeler?.length && !s.seviyeler.includes(seviyeBul(g))) return false;
  if (haric !== "cihaz" && s.cihazlar?.length && !s.cihazlar.includes(g.c ?? "yok")) return false;
  if (haric !== "yol" && s.yol && !(g.y ?? "").toLocaleLowerCase("tr").startsWith(s.yol.toLocaleLowerCase("tr"))) return false;
  if (s.yontem && (g.yt ?? "") !== s.yontem) return false;
  if (s.ip && g.ip !== s.ip) return false;
  if (ara && !`${g.y ?? ""} ${g.m ?? ""} ${g.d ?? ""} ${g.q ?? ""} ${g.i ?? ""} ${g.f?.log?.join(" ") ?? ""}`.toLocaleLowerCase("tr").includes(ara)) return false;
  return true;
}

/** Son günlükler (yeniden eskiye). Süzgeç: tür, durum sınıfı, seviye, yol, cihaz, zaman aralığı, metin araması. */
export async function gunlukOku(projeId: string, s: GunlukSuzgec = {}): Promise<Gunluk[]> {
  if (!KIMLIK.test(projeId)) return [];
  const o: Gunluk[] = [];
  const ara = s.ara?.toLocaleLowerCase("tr").trim();
  const n = s.sinir ?? 500;
  await gez(projeId, s, (g) => { if (uyar(s, g, ara)) { o.push(g); if (o.length >= n) return false; } });
  return o;
}

/** Hacim grafiği için kova boyu: aralığa göre 1 dk ile 12 sa arası. */
export function kovaBoyu(aralik: number) {
  const dk = 60_000, sa = 3600_000;
  return aralik <= 2 * sa ? dk * 2 : aralik <= 6 * sa ? dk * 10 : aralik <= 26 * sa ? dk * 30 : aralik <= 4 * 864e5 ? sa * 3 : sa * 12;
}

/**
 * Günlük gezgini: süzülmüş kayıtlar + zaman içinde hacim (seviyeye göre) + yüzey sayıları (tür, seviye, cihaz,
 * en çok görülen yollar). Yüzey sayıları kendi boyutu dışındaki süzgeçlerle hesaplanır.
 */
export async function gunlukGezgini(projeId: string, s: GunlukSuzgec) {
  const bit = Math.min(Date.now(), s.bit ?? Date.now());
  const bas = Math.max(Date.now() - SAKLAMA, s.bas ?? bit - 864e5);
  const boy = kovaBoyu(bit - bas);
  const kovaSayisi = Math.max(1, Math.ceil((bit - bas) / boy));
  const ilk = bit - kovaSayisi * boy;
  const hacim = Array.from({ length: kovaSayisi }, (_, i) => ({ z: ilk + i * boy, basarili: 0, uyari: 0, hata: 0 }));
  const yuzey = { tur: {} as Record<string, number>, seviye: { basarili: 0, uyari: 0, hata: 0 } as Record<Seviye, number>, cihaz: {} as Record<string, number>, yol: {} as Record<string, number> };
  const kayitlar: Gunluk[] = [];
  const ara = s.ara?.toLocaleLowerCase("tr").trim();
  const n = Math.min(1000, s.sinir ?? 300);
  let toplam = 0, sure = 0, sureAdet = 0;
  const ss = { ...s, bas, bit, sonra: undefined };
  if (KIMLIK.test(projeId)) await gez(projeId, ss, (g) => {
    if (!uyar(ss, g, ara, "tur")) return;
    const sev = seviyeBul(g);
    const tamam = turUyar(ss, g);
    const sevOk = !ss.seviyeler?.length || ss.seviyeler.includes(sev);
    const cihazOk = !ss.cihazlar?.length || ss.cihazlar.includes(g.c ?? "yok");
    const yolOk = !ss.yol || (g.y ?? "").toLocaleLowerCase("tr").startsWith(ss.yol.toLocaleLowerCase("tr"));
    if (sevOk && cihazOk && yolOk) yuzey.tur[g.t] = (yuzey.tur[g.t] ?? 0) + 1;
    if (!tamam) return;
    if (cihazOk && yolOk) yuzey.seviye[sev]++;
    if (sevOk && yolOk && g.c) yuzey.cihaz[g.c] = (yuzey.cihaz[g.c] ?? 0) + 1;
    if (sevOk && cihazOk && g.y && Object.keys(yuzey.yol).length < 400) { const y = g.y.replace(/ \((önizleme|deneme)\)$/, ""); yuzey.yol[y] = (yuzey.yol[y] ?? 0) + 1; }
    if (!sevOk || !cihazOk || !yolOk) return;
    toplam++;
    if (g.ms != null) { sure += g.ms; sureAdet++; }
    const k = Math.floor((g.z - ilk) / boy);
    if (hacim[k]) hacim[k][sev]++;
    if (kayitlar.length < n) kayitlar.push(g);
  });
  return {
    kayitlar, hacim, kova: boy, bas, bit, toplam, ortSure: sureAdet ? Math.round(sure / sureAdet) : 0,
    yuzey: { ...yuzey, yol: Object.entries(yuzey.yol).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([ad, adet]) => ({ ad, adet })) },
  };
}

/** Son N günün istek özeti: toplam, hata, ortalama süre, günlük dağılım. */
export async function gunlukOzet(projeId: string, n = 7) {
  const l = await gunlukOku(projeId, { gun: n, tur: "istek", sinir: 50_000 });
  const gunler: Record<string, { istek: number; hata: number }> = {};
  for (let i = n - 1; i >= 0; i--) gunler[gun(Date.now() - i * 864e5)] = { istek: 0, hata: 0 };
  let hata = 0, sure = 0;
  for (const g of l) { const k = gunler[gun(g.z)]; if (k) { k.istek++; if ((g.d ?? 200) >= 500) k.hata++; } if ((g.d ?? 200) >= 500) hata++; sure += g.ms ?? 0; }
  return { istek: l.length, hata, ortSure: l.length ? Math.round(sure / l.length) : 0, gunler: Object.entries(gunler).map(([tarih, v]) => ({ tarih, ...v })) };
}
