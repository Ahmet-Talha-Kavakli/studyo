import type { BelgeBlok } from "./belgeTipler";
import type { SohbetMesaji } from "./sohbetDepo";
import { bellekEtiketiniGizle } from "./sohbetYol";

/**
 * Sohbet ve tuval dışa aktarma yardımcıları: Markdown'dan Word blokları, sohbet yolundan Word belgesi girdisi.
 */
/** Markdown'dan Word blokları (başlık, paragraf, liste, alıntı, tablo, kod). */
export function mdBloklari(md: string): BelgeBlok[] {
  const o: BelgeBlok[] = [];
  const satirlar = md.replace(/\r\n/g, "\n").split("\n");
  let para: string[] = [], liste: { maddeler: string[]; sirali: boolean } | null = null;
  const bitir = () => {
    if (para.length) { o.push({ tur: "paragraf", metin: para.join(" ") } as BelgeBlok); para = []; }
    if (liste) { o.push({ tur: "liste", maddeler: liste.maddeler, sirali: liste.sirali } as BelgeBlok); liste = null; }
  };
  for (let i = 0; i < satirlar.length; i++) {
    const s = satirlar[i];
    if (/^```/.test(s)) { bitir(); const kod: string[] = []; for (i++; i < satirlar.length && !/^```/.test(satirlar[i]); i++) kod.push(satirlar[i]); o.push({ tur: "alinti", metin: kod.join("\n") } as BelgeBlok); continue; }
    const b = /^(#{1,3})\s+(.*)$/.exec(s);
    if (b) { bitir(); o.push({ tur: "baslik", metin: b[2].trim(), seviye: b[1].length } as BelgeBlok); continue; }
    const m = /^\s*([-*+]|\d+[.)])\s+(.*)$/.exec(s);
    if (m) { const sirali = /\d/.test(m[1]); if (para.length) { o.push({ tur: "paragraf", metin: para.join(" ") } as BelgeBlok); para = []; } if (!liste || liste.sirali !== sirali) { if (liste) bitir(); liste = { maddeler: [], sirali }; } liste.maddeler.push(m[2]); continue; }
    if (/^>\s?/.test(s)) { bitir(); o.push({ tur: "alinti", metin: s.replace(/^>\s?/, "") } as BelgeBlok); continue; }
    if (/^\|.*\|\s*$/.test(s) && /^\|?\s*:?-{2,}/.test(satirlar[i + 1] ?? "")) {
      bitir();
      const hucre = (x: string) => x.trim().replace(/^\||\|$/g, "").split("|").map((y) => y.trim());
      const basliklar = hucre(s); const satir: string[][] = [];
      for (i += 2; i < satirlar.length && /^\|.*\|\s*$/.test(satirlar[i]); i++) satir.push(hucre(satirlar[i]));
      i--;
      o.push({ tur: "tablo", basliklar, satirlar: satir } as BelgeBlok);
      continue;
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(s)) { bitir(); o.push({ tur: "ayrac" } as BelgeBlok); continue; }
    if (!s.trim()) { bitir(); continue; }
    if (liste) bitir();
    para.push(s.trim());
  }
  bitir();
  return o;
}


/** Sohbetin görünen dalından Word belgesi girdisi (başlık, tarih, Sen / Vayra bölümleri). */
export function sohbetBelgesi(baslik: string, yol: SohbetMesaji[], modelAdi: (id?: string) => string): { ad: string; baslik: string; alt_baslik: string; bloklar: BelgeBlok[] } {
  const o: BelgeBlok[] = [];
  for (const m of yol) {
    if (m.rol === "kullanici") {
      if (!m.metin?.trim() && !m.ekler?.length) continue;
      o.push({ tur: "baslik", metin: m.istek?.gorev ? `Zamanlanmış görev: ${m.istek.gorev.ad}` : "Sen", seviye: 3 });
      if (m.metin?.trim()) o.push(...mdBloklari(m.metin));
      if (m.ekler?.length) o.push({ tur: "liste", maddeler: m.ekler.map((e) => `Ek: ${e.ad}`) });
      continue;
    }
    const t = bellekEtiketiniGizle((m.parcalar ?? []).filter((p) => p.tur === "metin").map((p) => (p as { metin: string }).metin).join("")).trim() || m.kurul?.sentez || "";
    const dosyalar = (m.parcalar ?? []).flatMap((p) => (p.tur === "arac" && p.sonuc ? [p.sonuc.tur === "dosya" ? `Dosya: ${p.sonuc.dosya.ad}` : p.sonuc.tur === "tuval" ? `Tuval: ${p.sonuc.baslik}` : p.sonuc.tur === "gorsel" ? `${p.sonuc.urller.length} görsel` : ""] : [])).filter(Boolean);
    if (!t && !dosyalar.length) continue;
    o.push({ tur: "baslik", metin: `Vayra${m.model ? ` · ${modelAdi(m.model)}` : ""}`, seviye: 3 });
    if (t) o.push(...mdBloklari(t));
    if (dosyalar.length) o.push({ tur: "liste", maddeler: dosyalar });
  }
  return { ad: baslik, baslik, alt_baslik: `Vayra sohbeti · ${new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}`, bloklar: o };
}
