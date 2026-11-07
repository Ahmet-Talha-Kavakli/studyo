import "server-only";
import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import { metinAra, veriOku, type Kayit, type VeriOrtami } from "./veri";

/**
 * Vayra Sorgu dili (Supabase SQL editörü, Convex özel sorgu, PocketBase süzgeç dili benzeri; salt okunur).
 * Aşamalar satır satır ya da | ile yazılır; ilk aşama tablodur:
 *   urunler
 *   | nerede fiyat > 100 ve (kategori = "kahve" veya stok bos) ve olusturma > simdi - 7g
 *   | birlestir kategoriler kategori = id olarak kat
 *   | ara "filtre kahve"
 *   | grupla kat.ad: adet, toplam(fiyat), ortalama(fiyat) olarak ort
 *   | sirala adet azalan, kat.ad
 *   | sec kat.ad olarak kategori, adet, ort
 *   | sinir 50 | atla 0
 * Karşılaştırma: = != > >= < <= icerir baslar biter bos dolu icinde (a, b); mantık: ve, veya, degil, parantez.
 * Değerler: sayı, "metin", dogru, yanlis, bos, simdi ve bugun (± 30dk, 24s, 7g, 2h). Türkçe harfli yazım da olur
 * (sırala, seç, içerir, değil). Tek tabloda en çok 5000 kayıt okunur; çıktı en çok 1000 satır.
 */
export class SorguHatasi extends Error { constructor(m: string, public konum?: number) { super(m); } }
type Tok = { t: "kelime" | "metin" | "sayi" | "op" | "ayrac" | "virgul" | "ac" | "kapa" | "iki"; v: string; k: number };
const norm = (s: string) => s.toLocaleLowerCase("tr-TR").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "");

function sozcukle(metin: string): Tok[] {
  const o: Tok[] = [];
  let i = 0;
  while (i < metin.length) {
    const c = metin[i];
    if (c === "\n" || c === "|") { o.push({ t: "ayrac", v: c, k: i }); i++; continue; }
    if (/\s/.test(c)) { i++; continue; }
    if (c === "#" || (c === "-" && metin[i + 1] === "-")) { while (i < metin.length && metin[i] !== "\n") i++; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1, s = "";
      while (j < metin.length && metin[j] !== c) { if (metin[j] === "\\" && j + 1 < metin.length) { s += metin[j + 1]; j += 2; continue; } s += metin[j]; j++; }
      if (j >= metin.length) throw new SorguHatasi("Tırnak kapanmamış.", i);
      o.push({ t: "metin", v: s, k: i }); i = j + 1; continue;
    }
    const ops = [">=", "<=", "!=", "<>", "==", "=", ">", "<", "~"];
    const op = ops.find((x) => metin.startsWith(x, i));
    if (op) { o.push({ t: "op", v: op === "==" ? "=" : op === "<>" ? "!=" : op, k: i }); i += op.length; continue; }
    if (c === ",") { o.push({ t: "virgul", v: c, k: i }); i++; continue; }
    if (c === "(") { o.push({ t: "ac", v: c, k: i }); i++; continue; }
    if (c === ")") { o.push({ t: "kapa", v: c, k: i }); i++; continue; }
    if (c === ":") { o.push({ t: "iki", v: c, k: i }); i++; continue; }
    if (c === "+" || c === "-") { if (/\d/.test(metin[i + 1] ?? "") && !(o.length && ["sayi", "kelime", "metin", "kapa"].includes(o.at(-1)!.t))) { /* işaretli sayı */ } else { o.push({ t: "op", v: c, k: i }); i++; continue; } }
    const m = /^[-+]?\d+(?:\.\d+)?(?:dk|sn|s|g|h|ay)?(?![\p{L}\p{N}_])/u.exec(metin.slice(i));
    if (m) { o.push({ t: "sayi", v: m[0], k: i }); i += m[0].length; continue; }
    const w = /^[\p{L}_][\p{L}\p{N}_.-]*/u.exec(metin.slice(i));
    if (w) { o.push({ t: "kelime", v: w[0].replace(/[.-]+$/, ""), k: i }); i += w[0].replace(/[.-]+$/, "").length; continue; }
    throw new SorguHatasi(`Anlaşılmayan karakter: ${c}`, i);
  }
  return o;
}

type Kosul = { tur: "ve"; l: Kosul[] } | { tur: "veya"; l: Kosul[] } | { tur: "degil"; k: Kosul } | { tur: "kar"; alan: string; op: string; deger?: unknown; liste?: unknown[] };
type Asama =
  | { tur: "nerede"; k: Kosul; yazi: string } | { tur: "birlestir"; tablo: string; yerel: string; uzak: string; ad: string; yazi: string }
  | { tur: "grupla"; alanlar: string[]; toplamlar: { f: string; alan?: string; ad: string }[]; yazi: string } | { tur: "sirala"; l: { alan: string; yon: 1 | -1 }[]; yazi: string }
  | { tur: "sec"; l: { alan: string; ad: string }[]; yazi: string } | { tur: "ara"; metin: string; yazi: string } | { tur: "sinir" | "atla"; n: number; yazi: string } | { tur: "say"; yazi: string };
export type Plan = { tablo: string; asamalar: Asama[] };

const ANAHTAR: Record<string, string> = { nerede: "nerede", where: "nerede", suz: "nerede", birlestir: "birlestir", join: "birlestir", grupla: "grupla", sirala: "sirala", sec: "sec", goster: "sec", ara: "ara", bul: "ara", sinir: "sinir", limit: "sinir", atla: "atla", say: "say" };
const SURE: Record<string, number> = { dk: 60_000, sn: 1000, s: 3600_000, g: 864e5, h: 7 * 864e5, ay: 30 * 864e5 };

function degerCoz(t: Tok, sonraki: () => Tok | undefined, al: () => Tok): unknown {
  if (t.t === "metin") return t.v;
  if (t.t === "sayi") { if (/[a-z]$/.test(t.v)) throw new SorguHatasi("Süre yalnız simdi ya da bugun ile kullanılır (simdi - 7g).", t.k); return Number(t.v.replace(",", ".")); }
  if (t.t === "kelime") {
    const n = norm(t.v);
    if (n === "dogru" || n === "evet" || n === "true") return true;
    if (n === "yanlis" || n === "hayir" || n === "false") return false;
    if (n === "bos" || n === "null") return null;
    if (n === "simdi" || n === "bugun") {
      let z = Date.now();
      if (n === "bugun") { const d = new Date(z + 3 * 3600_000); z = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - 3 * 3600_000; }
      const s = sonraki();
      if (s?.t === "op" && (s.v === "+" || s.v === "-")) {
        al(); const sure = al();
        const m = sure && /^(\d+)(dk|sn|s|g|h|ay)$/.exec(sure.v);
        if (!m) throw new SorguHatasi("Süre biçimi: 30dk, 24s, 7g, 2h ya da 3ay.", sure?.k);
        z += (s.v === "+" ? 1 : -1) * Number(m[1]) * SURE[m[2]];
      }
      return { __zaman: z };
    }
    return t.v;
  }
  throw new SorguHatasi("Değer bekleniyordu.", t.k);
}

/** Sorgu metnini aşamalara çözer. */
export function sorguCoz(metin: string): Plan {
  if (metin.length > 5000) throw new SorguHatasi("Sorgu en çok 5000 karakter olabilir.");
  const tok = sozcukle(metin);
  const parcalar: Tok[][] = [[]];
  for (const t of tok) { if (t.t === "ayrac") { if (parcalar.at(-1)!.length) parcalar.push([]); } else parcalar.at(-1)!.push(t); }
  const l = parcalar.filter((x) => x.length);
  if (!l.length) throw new SorguHatasi("Sorgu boş. İlk satıra tablo adını yaz.");
  const ilk = l[0];
  let tablo = ilk[0].v;
  if (ilk[0].t === "kelime" && norm(ilk[0].v) === "tablo" && ilk[1]) tablo = ilk[1].v;
  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(tablo)) throw new SorguHatasi(`"${tablo}" geçerli bir tablo adı değil.`, ilk[0].k);
  const asamalar: Asama[] = [];
  for (const p of l.slice(1)) {
    let i = 0;
    const bak = () => p[i], al = () => p[i++], sonraki = () => p[i];
    const bas = al();
    const tur = bas.t === "kelime" ? ANAHTAR[norm(bas.v)] : undefined;
    const yazi = metin.slice(p[0].k, (p.at(-1)!.k + p.at(-1)!.v.length + (p.at(-1)!.t === "metin" ? 2 : 0))).trim();
    if (!tur) throw new SorguHatasi(`"${bas.v}" bir aşama değil. nerede, birlestir, grupla, sirala, sec, ara, sinir, atla ya da say yaz.`, bas.k);
    const alanAl = () => { const t = al(); if (!t || t.t !== "kelime") throw new SorguHatasi("Alan adı bekleniyordu.", t?.k ?? bas.k); return t.v; };
    const kelimeMi = (t: Tok | undefined, ...k: string[]) => !!t && t.t === "kelime" && k.includes(norm(t.v));
    if (tur === "nerede") {
      const veya = (): Kosul => { const l2 = [ve()]; while (kelimeMi(bak(), "veya", "or")) { al(); l2.push(ve()); } return l2.length > 1 ? { tur: "veya", l: l2 } : l2[0]; };
      const ve = (): Kosul => { const l2 = [birim()]; while (kelimeMi(bak(), "ve", "and")) { al(); l2.push(birim()); } return l2.length > 1 ? { tur: "ve", l: l2 } : l2[0]; };
      const birim = (): Kosul => {
        const t = bak();
        if (!t) throw new SorguHatasi("Koşul eksik.", bas.k);
        if (t.t === "ac") { al(); const k = veya(); if (bak()?.t !== "kapa") throw new SorguHatasi("Parantez kapanmamış.", t.k); al(); return k; }
        if (kelimeMi(t, "degil", "not")) { al(); return { tur: "degil", k: birim() }; }
        const alan = alanAl();
        const o = al();
        if (!o) throw new SorguHatasi(`"${alan}" için karşılaştırma eksik (= > < icerir bos …).`, t.k);
        if (o.t === "op" && !["+", "-"].includes(o.v)) { const d = al(); if (!d) throw new SorguHatasi("Değer eksik.", o.k); return { tur: "kar", alan, op: o.v === "~" ? "icerir" : o.v, deger: degerCoz(d, sonraki, al) }; }
        const n = o.t === "kelime" ? norm(o.v) : "";
        if (n === "bos" || n === "dolu") return { tur: "kar", alan, op: n };
        if (n === "icerir" || n === "baslar" || n === "biter") { const d = al(); if (!d) throw new SorguHatasi("Değer eksik.", o.k); return { tur: "kar", alan, op: n, deger: degerCoz(d, sonraki, al) }; }
        if (n === "icinde") {
          if (al()?.t !== "ac") throw new SorguHatasi("icinde (a, b, c) biçiminde yaz.", o.k);
          const liste: unknown[] = [];
          while (bak() && bak()!.t !== "kapa") { const d = al(); if (d.t !== "virgul") liste.push(degerCoz(d, sonraki, al)); }
          if (bak()?.t !== "kapa") throw new SorguHatasi("Parantez kapanmamış.", o.k);
          al();
          return { tur: "kar", alan, op: "icinde", liste: liste.slice(0, 100) };
        }
        throw new SorguHatasi(`"${o.v}" bir karşılaştırma değil.`, o.k);
      };
      const k = veya();
      if (bak()) throw new SorguHatasi(`Beklenmeyen "${bak()!.v}". Koşulları ve ya da veya ile bağla.`, bak()!.k);
      asamalar.push({ tur, k, yazi });
    } else if (tur === "birlestir") {
      const t2 = alanAl(); const yerel = alanAl(); let uzak = "id";
      if (bak()?.t === "op" && bak()!.v === "=") { al(); uzak = alanAl(); }
      let ad = t2;
      if (kelimeMi(bak(), "olarak", "as")) { al(); ad = alanAl(); }
      asamalar.push({ tur, tablo: t2, yerel, uzak, ad, yazi });
    } else if (tur === "grupla") {
      const alanlar: string[] = [];
      while (bak() && bak()!.t !== "iki") { const t = al(); if (t.t === "kelime") alanlar.push(t.v); }
      const toplamlar: { f: string; alan?: string; ad: string }[] = [];
      if (bak()?.t === "iki") {
        al();
        while (bak()) {
          const t = al();
          if (t.t === "virgul") continue;
          const f = norm(t.v);
          if (!["adet", "say", "toplam", "ortalama", "enaz", "encok"].includes(f)) throw new SorguHatasi(`"${t.v}" bir toplama işlevi değil (adet, toplam, ortalama, enaz, encok).`, t.k);
          let alan: string | undefined;
          if (bak()?.t === "ac") { al(); alan = alanAl(); if (al()?.t !== "kapa") throw new SorguHatasi("Parantez kapanmamış.", t.k); }
          if (f !== "adet" && f !== "say" && !alan) throw new SorguHatasi(`${t.v} için alan yaz: ${t.v}(fiyat)`, t.k);
          let ad = f === "say" || f === "adet" ? "adet" : `${f}_${alan}`;
          if (kelimeMi(bak(), "olarak", "as")) { al(); ad = alanAl(); }
          toplamlar.push({ f: f === "say" ? "adet" : f, alan, ad });
        }
      }
      if (!alanlar.length && !toplamlar.length) throw new SorguHatasi("grupla için alan yaz.", bas.k);
      if (!toplamlar.length) toplamlar.push({ f: "adet", ad: "adet" });
      asamalar.push({ tur, alanlar, toplamlar, yazi });
    } else if (tur === "sirala") {
      const l2: { alan: string; yon: 1 | -1 }[] = [];
      while (bak()) { const t = al(); if (t.t === "virgul") continue; if (t.t !== "kelime") throw new SorguHatasi("Alan adı bekleniyordu.", t.k); let yon: 1 | -1 = 1; if (kelimeMi(bak(), "azalan", "desc")) { al(); yon = -1; } else if (kelimeMi(bak(), "artan", "asc")) al(); l2.push({ alan: t.v, yon }); }
      asamalar.push({ tur, l: l2, yazi });
    } else if (tur === "sec") {
      const l2: { alan: string; ad: string }[] = [];
      while (bak()) { const t = al(); if (t.t === "virgul") continue; if (t.t !== "kelime") throw new SorguHatasi("Alan adı bekleniyordu.", t.k); let ad = t.v; if (kelimeMi(bak(), "olarak", "as")) { al(); ad = alanAl(); } l2.push({ alan: t.v, ad }); }
      asamalar.push({ tur, l: l2, yazi });
    } else if (tur === "ara") {
      const t = al();
      if (!t || (t.t !== "metin" && t.t !== "kelime")) throw new SorguHatasi('ara "aranacak metin" biçiminde yaz.', bas.k);
      asamalar.push({ tur, metin: [t.v, ...p.slice(i).map((x) => x.v)].join(" "), yazi });
    } else if (tur === "sinir" || tur === "atla") {
      const t = al();
      if (!t || t.t !== "sayi" || !/^\d+$/.test(t.v)) throw new SorguHatasi(`${tur} için bir sayı yaz.`, bas.k);
      asamalar.push({ tur, n: Number(t.v), yazi });
    } else asamalar.push({ tur: "say", yazi });
  }
  return { tablo, asamalar };
}

/* ───────── Çalıştırma ───────── */

const oku = (r: Record<string, unknown>, yol: string): unknown => {
  if (yol in r) return r[yol];
  let v: unknown = r;
  for (const p of yol.split(".")) { if (v && typeof v === "object") v = (v as Record<string, unknown>)[p]; else return undefined; }
  return v;
};
const sayiMi = (v: unknown) => typeof v === "number" || (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)));
function karsilastir(a: unknown, b: unknown): number {
  if (b && typeof b === "object" && "__zaman" in (b as object)) { const z = (b as { __zaman: number }).__zaman; const x = typeof a === "number" ? a : Date.parse(String(a)); return Number.isFinite(x) ? x - z : NaN; }
  if (sayiMi(a) && sayiMi(b)) return Number(a) - Number(b);
  if (typeof a === "boolean" || typeof b === "boolean") return String(a) === String(b) ? 0 : NaN;
  return String(a ?? "").localeCompare(String(b ?? ""), "tr");
}
function uyar(r: Record<string, unknown>, k: Kosul): boolean {
  if (k.tur === "ve") return k.l.every((x) => uyar(r, x));
  if (k.tur === "veya") return k.l.some((x) => uyar(r, x));
  if (k.tur === "degil") return !uyar(r, k.k);
  const v = oku(r, k.alan);
  const bos = v === null || v === undefined || v === "";
  switch (k.op) {
    case "bos": return bos;
    case "dolu": return !bos;
    case "=": return k.deger === null ? bos : !bos && karsilastir(v, k.deger) === 0;
    case "!=": return k.deger === null ? !bos : bos || karsilastir(v, k.deger) !== 0;
    case ">": return !bos && karsilastir(v, k.deger) > 0;
    case ">=": return !bos && karsilastir(v, k.deger) >= 0;
    case "<": return !bos && karsilastir(v, k.deger) < 0;
    case "<=": return !bos && karsilastir(v, k.deger) <= 0;
    case "icerir": return norm(typeof v === "object" ? JSON.stringify(v) : String(v ?? "")).includes(norm(String(k.deger ?? "")));
    case "baslar": return norm(String(v ?? "")).startsWith(norm(String(k.deger ?? "")));
    case "biter": return norm(String(v ?? "")).endsWith(norm(String(k.deger ?? "")));
    case "icinde": return (k.liste ?? []).some((x) => karsilastir(v, x) === 0);
  }
  return false;
}

export type SorguSonucu = { sutunlar: string[]; satirlar: Record<string, unknown>[]; toplam: number; kesildi: boolean; sure: number; plan: { asama: string; adet: number }[]; uyarilar: string[] };

/** Sorguyu salt okunur çalıştırır. */
export async function sorguCalistir(projeId: string, metin: string, ortam: VeriOrtami = "canli"): Promise<SorguSonucu> {
  const bas = Date.now();
  const plan = sorguCoz(metin);
  const v = await veriOku(projeId, ortam);
  const tablo = v.koleksiyonlar[plan.tablo];
  if (!tablo) throw new SorguHatasi(`"${plan.tablo}" adında tablo yok. Tablolar: ${Object.keys(v.koleksiyonlar).join(", ") || "henüz yok"}.`, 0);
  let l: Record<string, unknown>[] = tablo.kayitlar.map((x) => ({ ...x }));
  const izler: { asama: string; adet: number }[] = [{ asama: plan.tablo, adet: l.length }];
  const uyarilar: string[] = [];
  let sinir: number | null = null, atla = 0, gruplandi = false;
  for (const a of plan.asamalar) {
    if (a.tur === "nerede") l = l.filter((r) => uyar(r, a.k));
    else if (a.tur === "birlestir") {
      const t = v.koleksiyonlar[a.tablo];
      if (!t) throw new SorguHatasi(`Birleştirilecek "${a.tablo}" tablosu yok.`);
      const dizin = new Map<string, Kayit>();
      for (const x of t.kayitlar) { const k = x[a.uzak]; if (k !== undefined && k !== null && !dizin.has(String(k))) dizin.set(String(k), x); }
      let eslesmeyen = 0;
      l = l.map((r) => { const y = dizin.get(String(oku(r, a.yerel) ?? "")); if (!y) eslesmeyen++; return { ...r, [a.ad]: y ? { ...y } : null }; });
      if (eslesmeyen) uyarilar.push(`${eslesmeyen} kayıtta "${a.tablo}" eşleşmesi bulunamadı (${a.ad} boş).`);
    } else if (a.tur === "ara") l = metinAra(l as Kayit[], a.metin, gruplandi ? undefined : tablo.sema);
    else if (a.tur === "grupla") {
      const g = new Map<string, Record<string, unknown>[]>();
      for (const r of l) { const k = JSON.stringify(a.alanlar.map((x) => oku(r, x) ?? null)); const x = g.get(k); if (x) x.push(r); else g.set(k, [r]); }
      l = [...g.entries()].map(([k, rs]) => {
        const o: Record<string, unknown> = {};
        const anahtarlar = JSON.parse(k) as unknown[];
        a.alanlar.forEach((x, i) => { o[x] = anahtarlar[i]; });
        for (const t of a.toplamlar) {
          const sayilar = t.alan ? rs.map((r) => oku(r, t.alan!)).filter(sayiMi).map(Number) : [];
          o[t.ad] = t.f === "adet" ? rs.length : t.f === "toplam" ? sayilar.reduce((s, x) => s + x, 0) : t.f === "ortalama" ? (sayilar.length ? Math.round((sayilar.reduce((s, x) => s + x, 0) / sayilar.length) * 100) / 100 : null) : t.f === "enaz" ? (sayilar.length ? Math.min(...sayilar) : null) : sayilar.length ? Math.max(...sayilar) : null;
        }
        return o;
      });
      gruplandi = true;
    } else if (a.tur === "sirala") l.sort((x, y) => { for (const s of a.l) { const c = karsilastir(oku(x, s.alan), oku(y, s.alan)); if (c) return (Number.isNaN(c) ? 0 : c) * s.yon; } return 0; });
    else if (a.tur === "sec") l = l.map((r) => Object.fromEntries(a.l.map((s) => [s.ad, oku(r, s.alan) ?? null])));
    else if (a.tur === "sinir") sinir = Math.min(1000, a.n);
    else if (a.tur === "atla") atla = a.n;
    else if (a.tur === "say") { l = [{ adet: l.length }]; gruplandi = true; }
    izler.push({ asama: a.yazi, adet: l.length });
    if (Date.now() - bas > 4000) throw new SorguHatasi("Sorgu 4 saniyede bitmedi; süzgeç ekle ya da sınırla.");
  }
  const toplam = l.length;
  const kes = sinir ?? 100;
  const satirlar = l.slice(atla, atla + kes);
  const sutunlar: string[] = [];
  const ekle = (k: string) => { if (!sutunlar.includes(k)) sutunlar.push(k); };
  if (!gruplandi && !plan.asamalar.some((x) => x.tur === "sec")) ekle("id");
  for (const r of satirlar.slice(0, 200)) for (const k of Object.keys(r)) if (!["olusturma", "guncelleme", "uyeId"].includes(k)) ekle(k);
  if (!gruplandi && !plan.asamalar.some((x) => x.tur === "sec") && satirlar.length) ekle("olusturma");
  if (sinir === null && toplam > kes) uyarilar.push(`İlk ${kes} satır gösteriliyor; hepsi için sinir 1000 ekle ya da dışa aktar.`);
  return { sutunlar, satirlar, toplam, kesildi: toplam > atla + kes, sure: Date.now() - bas, plan: izler, uyarilar };
}

/* ───────── Kayıtlı sorgular ve geçmiş ───────── */
export type KayitliSorgu = { id: string; ad: string; metin: string; z: number; yildiz?: boolean };
type SorguDepo = { kayitli: KayitliSorgu[]; gecmis: { metin: string; z: number; sure: number; adet: number; hata?: string }[] };
const dosya = (id: string) => path.join(DEPO_KOK, "build", "bulut-sorgu", `${id}.json`);
export async function sorguDeposu(id: string): Promise<SorguDepo> { try { const d = JSON.parse(await readFile(dosya(id), "utf8")) as Partial<SorguDepo>; return { kayitli: d.kayitli ?? [], gecmis: d.gecmis ?? [] }; } catch { return { kayitli: [], gecmis: [] }; } }
const kuyruk = new Map<string, Promise<unknown>>();
export async function sorguDeposuDegistir<T>(id: string, f: (d: SorguDepo) => T): Promise<T> {
  const onceki = kuyruk.get(id) ?? Promise.resolve();
  let s!: T;
  const is = onceki.then(async () => { const d = await sorguDeposu(id); s = f(d); d.gecmis = d.gecmis.slice(0, 40); d.kayitli = d.kayitli.slice(0, 100); await mkdir(path.dirname(dosya(id)), { recursive: true }); await writeFile(dosya(id), JSON.stringify(d)); });
  kuyruk.set(id, is.catch(() => {}));
  await is;
  return s;
}
export const yeniSorguId = () => randomBytes(5).toString("base64url");
