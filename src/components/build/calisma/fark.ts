/**
 * Satır farkı (en uzun ortak alt dizi). Sürüm geçmişinde "Değişiklikler" görünümü için. Çok büyük dosyalarda
 * (satır çarpımı 6 milyonu aşarsa) yaklaşık sonuç: önce ve sonra ayrı bloklar.
 */
export type FarkSatiri = { tur: "ayni" | "ekle" | "sil"; metin: string; eski?: number; yeni?: number };
export type FarkParcasi = FarkSatiri | { tur: "atla"; adet: number };

export function satirFarki(eski: string, yeni: string): FarkSatiri[] {
  const a = eski ? eski.split("\n") : [], b = yeni ? yeni.split("\n") : [];
  const n = a.length, m = b.length;
  if (n * m > 6_000_000) {
    return [...a.map((metin, i) => ({ tur: "sil" as const, metin, eski: i + 1 })), ...b.map((metin, i) => ({ tur: "ekle" as const, metin, yeni: i + 1 }))];
  }
  // dp[i][j] = a[i..] ile b[j..] arasındaki LCS uzunluğu (tek boyutlu dizi).
  const W = m + 1;
  const dp = new Uint32Array((n + 1) * W);
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i * W + j] = a[i] === b[j] ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
  const s: FarkSatiri[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { s.push({ tur: "ayni", metin: a[i], eski: i + 1, yeni: j + 1 }); i++; j++; }
    else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) { s.push({ tur: "sil", metin: a[i], eski: i + 1 }); i++; }
    else { s.push({ tur: "ekle", metin: b[j], yeni: j + 1 }); j++; }
  }
  while (i < n) { s.push({ tur: "sil", metin: a[i], eski: i + 1 }); i++; }
  while (j < m) { s.push({ tur: "ekle", metin: b[j], yeni: j + 1 }); j++; }
  return s;
}

/** Değişikliklerin çevresinde 3 satır bağlam bırakır; aradaki aynı satırları "N satır aynı" diye katlar. */
export function parcala(l: FarkSatiri[], baglam = 3): FarkParcasi[] {
  const goster = new Array(l.length).fill(false);
  l.forEach((x, i) => { if (x.tur !== "ayni") for (let k = Math.max(0, i - baglam); k <= Math.min(l.length - 1, i + baglam); k++) goster[k] = true; });
  const o: FarkParcasi[] = [];
  let atla = 0;
  l.forEach((x, i) => {
    if (goster[i]) { if (atla) { o.push({ tur: "atla", adet: atla }); atla = 0; } o.push(x); }
    else atla++;
  });
  if (atla) o.push({ tur: "atla", adet: atla });
  return o;
}
