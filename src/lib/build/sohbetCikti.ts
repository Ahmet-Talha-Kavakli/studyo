import "server-only";
import { readFile } from "fs/promises";
import path from "path";
import { DEPO_KOK } from "@/lib/dosyaDepo";
import type { DosyaBilgisi } from "./belgeTipler";
import { sahipOzeti } from "./depo";
import type { Sohbet } from "./sohbetDepo";
import { sonIcerik, tuvalGetir } from "./sohbetTuval";

/**
 * Çıktılar kitaplığı: sahibin bütün sohbetlerinde (bütün dallar) üretilen dosyalar, görseller, videolar, sesler,
 * 3D modeller, HTML sayfaları (yanıttaki ```html blokları) ve etkileşimli görselleştirmeler; en yeniler önde.
 */
export type CiktiTur = "dosya" | "gorsel" | "video" | "ses" | "3d" | "html" | "gorsellestirme" | "tuval";
export type Cikti = {
  anahtar: string; tur: CiktiTur; baslik: string; zaman: number; sohbet: { id: string; baslik: string }; mesaj: string;
  url?: string; dosya?: DosyaBilgisi; html?: string; tip?: string; model?: string;
  /** Tuval: son hâlinin metni (ilk 6000 karakter) ve türü. */
  metin?: string; tuval?: { id: string; tip: "belge" | "kod"; dil?: string; surum: number };
};

const KOK = path.join(DEPO_KOK, "build");
const HTML_SINIRI = 120_000;
const htmlMi = (kod: string, dil: string) => /^(html|svg)$/i.test(dil) || /^\s*<!doctype html|^\s*<html/i.test(kod);
const baslikOf = (html: string) => (/<title>([^<]{1,80})<\/title>/i.exec(html)?.[1] ?? "").trim();

export async function ciktilariTopla(sahip: string): Promise<Cikti[]> {
  const oz = sahipOzeti(sahip);
  let l: string[] = [];
  try { l = JSON.parse(await readFile(path.join(KOK, "sohbet-sahip", `${oz}.json`), "utf8")) as string[]; } catch { return []; }
  const o: Cikti[] = [];
  const tuvaller = new Set<string>();
  for (const id of l.slice(0, 400)) {
    let s: (Sohbet & { sahip: string }) | null = null;
    try { s = JSON.parse(await readFile(path.join(KOK, "sohbetler", `${id}.json`), "utf8")); } catch { continue; }
    if (!s || s.sahip !== oz || s.test || s.gecici) continue;
    const sohbet = { id: s.id, baslik: s.baslik };
    for (const m of s.mesajlar) {
      if (m.rol !== "asistan") continue;
      const temel = { sohbet, mesaj: m.id, zaman: m.zaman, ...(m.model ? { model: m.model } : {}) };
      (m.parcalar ?? []).forEach((p, i) => {
        if (p.tur === "metin") {
          let k = 0;
          for (const x of p.metin.matchAll(/```(\w*)\n([\s\S]*?)```/g)) {
            if (!htmlMi(x[2], x[1]) || x[2].length > HTML_SINIRI) continue;
            o.push({ ...temel, anahtar: `${s!.id}:${m.id}:${i}:h${k++}`, tur: "html", baslik: baslikOf(x[2]) || "HTML sayfası", html: x[2].replace(/\n$/, "") });
          }
          return;
        }
        if (p.tur !== "arac" || p.durum !== "bitti" || !p.sonuc) return;
        const r = p.sonuc;
        const a = `${s!.id}:${m.id}:${i}`;
        if (r.tur === "dosya") o.push({ ...temel, anahtar: a, tur: "dosya", baslik: r.dosya.ad, dosya: r.dosya, url: r.dosya.url });
        else if (r.tur === "gorsellestirme" && r.html.length <= HTML_SINIRI) o.push({ ...temel, anahtar: a, tur: "gorsellestirme", baslik: r.baslik, html: r.html, ...(r.tip ? { tip: r.tip } : {}) });
        else if (r.tur === "gorsel") r.urller.forEach((u, j) => o.push({ ...temel, anahtar: `${a}:${j}`, tur: "gorsel", baslik: p.girdi?.["İstem"]?.slice(0, 80) || "Görsel", url: u }));
        else if (r.tur === "video") o.push({ ...temel, anahtar: a, tur: "video", baslik: "Video", url: r.url });
        else if (r.tur === "ses") o.push({ ...temel, anahtar: a, tur: "ses", baslik: r.baslik || "Ses", url: r.url });
        else if (r.tur === "3d") o.push({ ...temel, anahtar: a, tur: "3d", baslik: "3D model", url: r.url });
        else if (r.tur === "tuval" && !tuvaller.has(r.id)) { tuvaller.add(r.id); o.push({ ...temel, anahtar: `t:${r.id}`, tur: "tuval", baslik: r.baslik, metin: r.onizleme, tuval: { id: r.id, tip: r.tip, dil: r.dil, surum: r.surum } }); }
      });
    }
  }
  // Tuvallerin son hâli (elle düzenlenmiş olabilir).
  for (const c of o) if (c.tur === "tuval" && c.tuval) { const t = await tuvalGetir(c.tuval.id, sahip).catch(() => null); if (t) { c.metin = sonIcerik(t).slice(0, 6000); c.baslik = t.baslik; c.tuval.surum = t.surumler.at(-1)?.no ?? c.tuval.surum; c.zaman = Math.max(c.zaman, t.guncelleme); } }
  return o.sort((a, b) => b.zaman - a.zaman).slice(0, 800);
}
