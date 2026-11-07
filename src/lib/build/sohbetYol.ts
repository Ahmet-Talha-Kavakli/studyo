/**
 * Sohbet ağacı yardımcıları (istemci + sunucu, saf işlevler). Mesajlar bir ağaçtır: her mesajın `ust` alanı
 * bir önceki mesajı gösterir (ilk mesajda yok). Kullanıcı mesajını düzenlemek aynı üstün altına yeni bir kardeş,
 * "Yeniden dene" aynı kullanıcı mesajının altına yeni bir asistan kardeşi ekler. `secim` her düğümde hangi çocuğun
 * gösterildiğini tutar ("kok" ilk düzey); seçim yoksa en yeni çocuk gösterilir.
 */
export type AgacMesaji = { id: string; ust?: string | null };
export const KOK = "kok";
export const ustAnahtari = (m: AgacMesaji) => m.ust || KOK;

/** Üst anahtarı başına çocuklar (eklenme sırasıyla). */
export function cocuklar<T extends AgacMesaji>(l: T[]): Map<string, T[]> {
  const c = new Map<string, T[]>();
  for (const m of l) { const k = ustAnahtari(m); const x = c.get(k); if (x) x.push(m); else c.set(k, [m]); }
  return c;
}

/** Kökten başlayıp seçimleri izleyen etkin yol. */
export function etkinYol<T extends AgacMesaji>(l: T[], secim: Record<string, string> = {}): T[] {
  const c = cocuklar(l);
  const yol: T[] = [];
  const gorulen = new Set<string>();
  let k = KOK;
  for (;;) {
    const x = c.get(k);
    if (!x?.length) break;
    const s = x.find((m) => m.id === secim[k]) ?? x[x.length - 1];
    if (gorulen.has(s.id)) break;
    gorulen.add(s.id);
    yol.push(s);
    k = s.id;
  }
  return yol;
}

/** Verilen mesaja kadar (dahil) kökten yol; mesaj yoksa boş. */
export function mesajaKadar<T extends AgacMesaji>(l: T[], id: string): T[] {
  const harita = new Map(l.map((m) => [m.id, m]));
  const yol: T[] = [];
  let m = harita.get(id);
  const gorulen = new Set<string>();
  while (m && !gorulen.has(m.id)) { gorulen.add(m.id); yol.unshift(m); m = m.ust ? harita.get(m.ust) : undefined; }
  return yol;
}

/** Bir mesajı görünür yapan seçimler: kökten o mesaja kadar her düğümde doğru çocuk. */
export function secimiAyarla<T extends AgacMesaji>(l: T[], secim: Record<string, string>, id: string): Record<string, string> {
  const y = { ...secim };
  for (const m of mesajaKadar(l, id)) y[ustAnahtari(m)] = m.id;
  return y;
}

/** Bugün, Dün, Son 7 gün, Daha eski. */
export function tarihGrubu(zaman: number, simdi = Date.now()): string {
  const gun = new Date(simdi); gun.setHours(0, 0, 0, 0);
  const t = gun.getTime();
  if (zaman >= t) return "Bugün";
  if (zaman >= t - 86400000) return "Dün";
  if (zaman >= t - 6 * 86400000) return "Son 7 gün";
  return "Daha eski";
}
export const TARIH_GRUPLARI = ["Bugün", "Dün", "Son 7 gün", "Daha eski"];

/** Yanıt metninden bellek kaynağı etiketini ayıklar (akış sırasında yarım etiket de gizlenir). */
const ETIKET = "<bellek-kaynak>";
export function bellekEtiketiniGizle(metin: string): string {
  const i = metin.indexOf("<bellek-kaynak");
  if (i >= 0) return metin.slice(0, i).trimEnd();
  for (let n = Math.min(ETIKET.length - 1, metin.length); n > 0; n--) if (ETIKET.startsWith(metin.slice(-n))) return metin.slice(0, -n);
  return metin;
}
export function bellekKimlikleri(metin: string): string[] {
  const m = /<bellek-kaynak>([\s\S]*?)<\/bellek-kaynak>/.exec(metin);
  return m ? [...new Set(m[1].split(/[\s,]+/).map((x) => x.trim()).filter((x) => /^[a-z0-9]{3,16}$/i.test(x)))] : [];
}
