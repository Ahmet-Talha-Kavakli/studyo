/**
 * Mesai saatleri (istemci ve sunucu ortak): Türkiye saatiyle gün ve saat aralığı. Dışında insana devredilen
 * konuşmada ziyaretçiye ekibin ne zaman döneceği söylenir; gelen kutusu da durumu gösterir.
 */
export type MesaiAyar = { acik: boolean; gunler: number[]; bas: string; bit: string; disari: string };
export const GUN_AD = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"] as const;
export const GUN_KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"] as const;

const dakika = (s: string) => { const [h, m] = s.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
/** Türkiye saati (UTC+3, yaz saati yok): gün ve gün içi dakika. */
export function trSaat(t = Date.now()) { const d = new Date(t + 3 * 3600_000); return { gun: d.getUTCDay(), dakika: d.getUTCHours() * 60 + d.getUTCMinutes() }; }

/** Şu an mesai içinde mi? Kapalı ayarda her zaman içinde sayılır. Gece yarısını aşan aralık (22:00 ile 06:00) desteklenir. */
export function mesaideMi(m: MesaiAyar | undefined, t = Date.now()): boolean {
  if (!m?.acik) return true;
  const { gun, dakika: d } = trSaat(t);
  const b = dakika(m.bas), e = dakika(m.bit);
  if (b === e) return m.gunler.includes(gun);
  if (b < e) return m.gunler.includes(gun) && d >= b && d < e;
  const dun = (gun + 6) % 7;
  return (m.gunler.includes(gun) && d >= b) || (m.gunler.includes(dun) && d < e);
}

/** Kısa özet: "Pazartesi ile Cuma, 09:00 ile 18:00". */
export function mesaiOzeti(m: MesaiAyar): string {
  const g = [...m.gunler].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  if (!g.length) return "Gün seçilmedi";
  const ard = g.every((x, i) => i === 0 || (g[i - 1] + 1) % 7 === x);
  const gunler = g.length === 7 ? "Her gün" : ard && g.length > 2 ? `${GUN_AD[g[0]]} ile ${GUN_AD[g.at(-1)!]}` : g.map((x) => GUN_AD[x]).join(", ");
  return `${gunler}, ${m.bas} ile ${m.bit}`;
}
