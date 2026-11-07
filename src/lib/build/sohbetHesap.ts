/**
 * Güvenli hesap makinesi ve birim çevirici (eval yok; kendi ayrıştırıcısı). İstemci ve sunucu birlikte kullanır.
 * İfade: + - * / ^ % (mod), parantez, sonek ! (faktöriyel), işlevler ve sabitler. Ondalık ayırıcı nokta; tek sayılık
 * ifadelerde virgül de kabul edilir. Sonuç Türkçe biçimlenir (binlik nokta, ondalık virgül).
 */
type Belirtec = { t: "sayi"; v: number } | { t: "ad"; v: string } | { t: "isl"; v: string };
const ISLEVLER: Record<string, (...a: number[]) => number> = {
  sqrt: Math.sqrt, karekok: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, mutlak: Math.abs, floor: Math.floor, ceil: Math.ceil,
  round: (x, n = 0) => { const k = 10 ** Math.max(0, Math.min(12, Math.round(n))); return Math.round(x * k) / k; }, yuvarla: (x, n = 0) => ISLEVLER.round(x, n),
  sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,
  sind: (x) => Math.sin((x * Math.PI) / 180), cosd: (x) => Math.cos((x * Math.PI) / 180), tand: (x) => Math.tan((x * Math.PI) / 180),
  ln: Math.log, log: (x, b) => (b === undefined ? Math.log(x) : Math.log(x) / Math.log(b)), log10: Math.log10, log2: Math.log2, exp: Math.exp,
  min: Math.min, max: Math.max, pow: Math.pow, hypot: Math.hypot, mod: (a, b) => a % b,
  fakt: (n) => faktoriyel(n), fact: (n) => faktoriyel(n), yuzde: (a, b) => (a * b) / 100, ortalama: (...a) => a.reduce((t, x) => t + x, 0) / a.length, avg: (...a) => a.reduce((t, x) => t + x, 0) / a.length, sum: (...a) => a.reduce((t, x) => t + x, 0), toplam: (...a) => a.reduce((t, x) => t + x, 0),
};
const SABITLER: Record<string, number> = { pi: Math.PI, e: Math.E, tau: Math.PI * 2, phi: (1 + Math.sqrt(5)) / 2 };
function faktoriyel(n: number): number {
  if (!Number.isInteger(n) || n < 0) throw new Error("Faktöriyel yalnız negatif olmayan tam sayılarda tanımlı.");
  if (n > 170) return Infinity;
  let r = 1; for (let i = 2; i <= n; i++) r *= i; return r;
}

function belirtecle(s: string): Belirtec[] {
  const o: Belirtec[] = [];
  let i = 0;
  const x = s.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/\*\*/g, "^");
  while (i < x.length) {
    const c = x[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      const m = /^(\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i.exec(x.slice(i));
      if (!m) throw new Error(`Sayı okunamadı: ${x.slice(i, i + 8)}`);
      o.push({ t: "sayi", v: Number(m[0]) }); i += m[0].length; continue;
    }
    if (/[a-zA-ZçğıöşüÇĞİÖŞÜ_π]/.test(c)) {
      const m = /^[a-zA-ZçğıöşüÇĞİÖŞÜ_π][\wçğıöşüÇĞİÖŞÜ]*/.exec(x.slice(i))!;
      o.push({ t: "ad", v: m[0] === "π" ? "pi" : m[0].toLowerCase() }); i += m[0].length; continue;
    }
    if ("+-*/^%(),!".includes(c)) { o.push({ t: "isl", v: c }); i++; continue; }
    throw new Error(`Tanınmayan karakter: ${c}`);
  }
  return o;
}

/** Öncelik tırmanmalı ayrıştırıcı: toplama < çarpma < üs (sağdan) < tekli eksi < sonek. */
function ayristir(l: Belirtec[]): number {
  let i = 0;
  const bak = () => l[i], al = () => l[i++];
  const bekle = (v: string) => { const b = al(); if (!b || b.t !== "isl" || b.v !== v) throw new Error(`"${v}" bekleniyordu.`); };
  function birincil(): number {
    const b = al();
    if (!b) throw new Error("İfade eksik.");
    if (b.t === "sayi") return b.v;
    if (b.t === "isl" && b.v === "(") { const v = toplama(); bekle(")"); return v; }
    if (b.t === "isl" && (b.v === "-" || b.v === "+")) { const v = us(); return b.v === "-" ? -v : v; }
    if (b.t === "ad") {
      if (bak()?.t === "isl" && bak()!.v === "(") {
        const f = ISLEVLER[b.v];
        if (!f) throw new Error(`Bilinmeyen işlev: ${b.v}`);
        al();
        const args: number[] = [];
        if (!(bak()?.t === "isl" && bak()!.v === ")")) { args.push(toplama()); while (bak()?.t === "isl" && bak()!.v === ",") { al(); args.push(toplama()); } }
        bekle(")");
        return f(...args);
      }
      if (b.v in SABITLER) return SABITLER[b.v];
      throw new Error(`Bilinmeyen ad: ${b.v}`);
    }
    throw new Error(`Beklenmeyen: ${b.v}`);
  }
  function sonek(): number { let v = birincil(); while (bak()?.t === "isl" && bak()!.v === "!") { al(); v = faktoriyel(v); } return v; }
  function us(): number { const t = sonek(); if (bak()?.t === "isl" && bak()!.v === "^") { al(); return t ** us(); } return t; }
  function carpma(): number {
    let v = us();
    for (;;) {
      const b = bak();
      if (b?.t === "isl" && (b.v === "*" || b.v === "/" || b.v === "%")) { al(); const r = us(); v = b.v === "*" ? v * r : b.v === "/" ? v / r : v % r; }
      else if (b && (b.t === "sayi" || b.t === "ad" || (b.t === "isl" && b.v === "("))) v *= us(); // örtük çarpma: 2pi, 3(4+1)
      else return v;
    }
  }
  function toplama(): number { let v = carpma(); while (bak()?.t === "isl" && (bak()!.v === "+" || bak()!.v === "-")) { const o = al().v; const r = carpma(); v = o === "+" ? v + r : v - r; } return v; }
  const v = toplama();
  if (i < l.length) throw new Error(`Fazladan: ${(l[i] as { v: unknown }).v}`);
  return v;
}

export const sayiBicim = (n: number) => {
  if (!Number.isFinite(n)) return Number.isNaN(n) ? "tanımsız" : n > 0 ? "sonsuz" : "eksi sonsuz";
  const a = Math.abs(n);
  if (a !== 0 && (a >= 1e15 || a < 1e-6)) return n.toExponential(6).replace(/\.?0+e/, "e").replace(".", ",").replace("e+", " çarpı 10 üzeri ").replace("e-", " çarpı 10 üzeri eksi ");
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: a < 1 ? 10 : 8 }).format(Number(n.toPrecision(15)));
};

export function hesapla(ifade: string): { deger: number; metin: string } | { hata: string } {
  try {
    let x = ifade.trim().replace(/=\s*$/, "");
    if (!x) return { hata: "İfade boş." };
    if (/^\s*-?\d{1,3}(\.\d{3})*,\d+\s*$/.test(x) || /^\s*-?\d+,\d+\s*$/.test(x)) x = x.replace(/\./g, "").replace(",", ".");
    const v = ayristir(belirtecle(x));
    return { deger: v, metin: sayiBicim(v) };
  } catch (e) { return { hata: (e as Error).message }; }
}

/* ───────────── Birim çevirici ───────────── */
type Kategori = "uzunluk" | "kutle" | "hacim" | "alan" | "hiz" | "zaman" | "veri" | "enerji" | "basinc" | "guc" | "sicaklik";
const BIRIMLER: Record<Kategori, Record<string, number>> = {
  uzunluk: { mm: 1e-3, milimetre: 1e-3, cm: 1e-2, santimetre: 1e-2, m: 1, metre: 1, km: 1e3, kilometre: 1e3, in: 0.0254, inc: 0.0254, inç: 0.0254, inch: 0.0254, ft: 0.3048, feet: 0.3048, ayak: 0.3048, yd: 0.9144, yarda: 0.9144, mi: 1609.344, mil: 1609.344, mile: 1609.344, nmi: 1852, "deniz mili": 1852 },
  kutle: { mg: 1e-6, g: 1e-3, gram: 1e-3, kg: 1, kilogram: 1, ton: 1000, t: 1000, lb: 0.45359237, libre: 0.45359237, pound: 0.45359237, oz: 0.028349523125, ons: 0.028349523125, okka: 1.2829, karat: 0.0002 },
  hacim: { ml: 1e-3, mililitre: 1e-3, cl: 1e-2, dl: 0.1, l: 1, lt: 1, litre: 1, m3: 1000, "metreküp": 1000, cm3: 1e-3, gal: 3.785411784, galon: 3.785411784, qt: 0.946352946, pt: 0.473176473, floz: 0.0295735295625, cup: 0.2365882365, "su bardağı": 0.2, "çay bardağı": 0.1, "yemek kaşığı": 0.015, "tatlı kaşığı": 0.01, "çay kaşığı": 0.005, tbsp: 0.01478676478125, tsp: 0.00492892159375 },
  alan: { mm2: 1e-6, cm2: 1e-4, m2: 1, "metrekare": 1, km2: 1e6, ha: 1e4, hektar: 1e4, dönüm: 1000, donum: 1000, decare: 1000, acre: 4046.8564224, akre: 4046.8564224, ft2: 0.09290304, in2: 0.00064516 },
  hiz: { "m/s": 1, "km/s": 1000, "km/sa": 1 / 3.6, "km/h": 1 / 3.6, kmh: 1 / 3.6, mph: 0.44704, knot: 0.514444, kn: 0.514444, "deniz mili/sa": 0.514444, "ft/s": 0.3048 },
  zaman: { ms: 1e-3, milisaniye: 1e-3, s: 1, sn: 1, saniye: 1, dk: 60, dakika: 60, min: 60, sa: 3600, saat: 3600, h: 3600, gün: 86400, gun: 86400, hafta: 604800, ay: 2629746, yıl: 31556952, yil: 31556952 },
  veri: { bit: 0.125, b: 1, bayt: 1, byte: 1, kb: 1e3, mb: 1e6, gb: 1e9, tb: 1e12, pb: 1e15, kib: 1024, mib: 1024 ** 2, gib: 1024 ** 3, tib: 1024 ** 4, kbit: 125, mbit: 125e3, gbit: 125e6 },
  enerji: { j: 1, joule: 1, kj: 1e3, mj: 1e6, cal: 4.184, kal: 4.184, kcal: 4184, kkal: 4184, wh: 3600, kwh: 3.6e6, btu: 1055.05585 },
  basinc: { pa: 1, kpa: 1e3, mpa: 1e6, bar: 1e5, mbar: 100, atm: 101325, psi: 6894.757293, mmhg: 133.322387, torr: 133.322368 },
  guc: { w: 1, watt: 1, kw: 1e3, mw: 1e6, hp: 745.699872, bg: 735.49875, beygir: 735.49875, ps: 735.49875 },
  sicaklik: { c: 1, "°c": 1, celsius: 1, santigrat: 1, f: 1, "°f": 1, fahrenheit: 1, k: 1, kelvin: 1 },
};
const KAT_AD: Record<Kategori, string> = { uzunluk: "uzunluk", kutle: "kütle", hacim: "hacim", alan: "alan", hiz: "hız", zaman: "zaman", veri: "veri", enerji: "enerji", basinc: "basınç", guc: "güç", sicaklik: "sıcaklık" };
const normal = (b: string) => b.trim().toLocaleLowerCase("tr").replace(/²/g, "2").replace(/³/g, "3").replace(/\s+/g, " ").replace(/^derece\s*/, "").replace(/^(santigrat|celsius)$/, "c");
function bul(b: string): { kat: Kategori; ad: string } | null {
  const n = normal(b);
  // Büyük-küçük harf ayrımı gereken tek birim: m (metre) ve M yok; "B" bayt, "b" bayt kabul edilir.
  for (const k of Object.keys(BIRIMLER) as Kategori[]) if (n in BIRIMLER[k]) return { kat: k, ad: n };
  const tekil = n.replace(/(lar|ler)$/, "");
  for (const k of Object.keys(BIRIMLER) as Kategori[]) if (tekil in BIRIMLER[k]) return { kat: k, ad: tekil };
  return null;
}
const sicaklikC = (v: number, b: string) => (/^(f|°f|fahrenheit)$/.test(b) ? ((v - 32) * 5) / 9 : /^(k|kelvin)$/.test(b) ? v - 273.15 : v);
const sicaklikDan = (c: number, b: string) => (/^(f|°f|fahrenheit)$/.test(b) ? (c * 9) / 5 + 32 : /^(k|kelvin)$/.test(b) ? c + 273.15 : c);

export function birimCevir(deger: number, kaynak: string, hedef: string): { sonuc: number; metin: string; kaynak: string; hedef: string; kategori: string } | { hata: string } {
  if (!Number.isFinite(deger)) return { hata: "Değer sayı olmalı." };
  const a = bul(kaynak), b = bul(hedef);
  if (!a) return { hata: `Tanınmayan birim: ${kaynak}` };
  if (!b) return { hata: `Tanınmayan birim: ${hedef}` };
  if (a.kat !== b.kat) return { hata: `${KAT_AD[a.kat]} ile ${KAT_AD[b.kat]} birbirine çevrilemez.` };
  const sonuc = a.kat === "sicaklik" ? sicaklikDan(sicaklikC(deger, a.ad), b.ad) : (deger * BIRIMLER[a.kat][a.ad]) / BIRIMLER[b.kat][b.ad];
  return { sonuc, metin: sayiBicim(Number(sonuc.toPrecision(12))), kaynak: kaynak.trim(), hedef: hedef.trim(), kategori: KAT_AD[a.kat] };
}
